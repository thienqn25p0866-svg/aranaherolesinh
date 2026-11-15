import {
  buildCoopWsUrl,
  buildCoopHttpBase,
  coalesceCoopOutbox,
  isLocalFileProtocol,
  isPrivateOrDevOrigin,
  classifyJoinCode,
} from "./combatLogic";
import { P2PRoomHost, P2PRoomPeerClient } from "./webrtcCoop";

const CRITICAL_HTTP_TYPES = new Set([
  "CREATE_ROOM",
  "JOIN_ROOM",
  "LEAVE_ROOM",
  "SELECT_HERO",
  "SET_NAME",
  "TOGGLE_READY",
  "START_MATCH",
  "RESTART_MATCH",
  "WAVE_READY",
  "NEXT_WAVE",
  "WAVE_META",
  "SPAWN_ENEMIES",
  "DAMAGE_ENEMY",
]);

class MultiplayerClient {
  constructor() {
    this.ws = null;
    this.transportMode = null; // "ws" | "http" | "p2p_host" | "p2p_peer" | null
    this.httpActive = false;
    this.httpBaseUrl = "";
    this.httpOutbox = [];
    this.httpFlushTimer = null;
    this.httpFlushing = false;
    this.httpPollAbort = null;
    this.p2pHost = null;
    this.p2pPeer = null;
    this.playerId = null;
    this.room = null;
    this.connected = false;
    this.listeners = new Set();
    this.pingTimer = null;
    this.connectPromise = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(event) {
    for (const fn of this.listeners) {
      try {
        fn(event);
      } catch (err) {
        console.warn("Multiplayer listener error:", err);
      }
    }
  }

  _getSavedServerUrl() {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem("arena_hero_server_url");
      if (saved && /^https?:\/\//i.test(saved.trim())) return saved.trim();
    } catch {
    }
    return "";
  }

  setCustomServerUrl(url) {
    if (typeof window === "undefined") return;
    try {
      const clean = String(url || "").trim().replace(/\/+$/, "");
      if (clean && /^https?:\/\//i.test(clean)) {
        localStorage.setItem("arena_hero_server_url", clean);
      } else {
        localStorage.removeItem("arena_hero_server_url");
      }
    } catch {
    }
  }

  _getInjectedOverrideUrl() {
    if (typeof window === "undefined") return "";
    const protocol = window.location?.protocol || "";
    const rawWs = typeof window.__ARENA_WS_URL__ === "string" ? window.__ARENA_WS_URL__.trim() : "";
    const rawApi = typeof window.__ARENA_API_URL__ === "string" ? window.__ARENA_API_URL__.trim() : "";
    const candidate = rawWs || rawApi;
    if (!candidate) return "";
    if (isLocalFileProtocol(protocol) && isPrivateOrDevOrigin(candidate)) {
      return "";
    }
    return candidate;
  }

  _getEffectiveOverrideUrl() {
    return this._getInjectedOverrideUrl() || this._getSavedServerUrl();
  }

  getCustomServerUrl() {
    if (typeof window === "undefined") return "";
    return this._getEffectiveOverrideUrl();
  }

  getWsUrlResult() {
    const overrideUrl = this._getEffectiveOverrideUrl();
    return buildCoopWsUrl({
      protocol: typeof window !== "undefined" ? window.location.protocol : "http:",
      host: typeof window !== "undefined" ? window.location.host : "",
      overrideUrl,
    });
  }

  getHttpBaseResult() {
    const overrideUrl = this._getEffectiveOverrideUrl();
    return buildCoopHttpBase({
      protocol: typeof window !== "undefined" ? window.location.protocol : "http:",
      host: typeof window !== "undefined" ? window.location.host : "",
      overrideUrl,
    });
  }

  getWsUrl() {
    const res = this.getWsUrlResult();
    return res.ok ? res.url : "";
  }

  _cleanupSocket(ws) {
    if (!ws) return;
    try {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    } catch {
    }
  }

  _stopHttpTransport(notifyServer = false) {
    this.httpActive = false;
    if (this.httpFlushTimer) {
      clearTimeout(this.httpFlushTimer);
      this.httpFlushTimer = null;
    }
    this.httpOutbox = [];
    if (this.httpPollAbort) {
      try {
        this.httpPollAbort.abort();
      } catch {
      }
      this.httpPollAbort = null;
    }
    if (notifyServer && this.playerId && this.httpBaseUrl) {
      const url = `${this.httpBaseUrl}/api/coop/leave`;
      const body = JSON.stringify({ playerId: this.playerId });
      const cred = this._isCrossOriginHttp() ? "omit" : "same-origin";
      try {
        if (!this._isCrossOriginHttp() && typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
        } else {
          fetch(url, { method: "POST", credentials: cred, headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
        }
      } catch {
      }
    }
  }

  _isCrossOriginHttp() {
    if (typeof window === "undefined" || !this.httpBaseUrl) return false;
    try {
      return new URL(this.httpBaseUrl).origin !== window.location.origin;
    } catch {
      return true;
    }
  }

  _handleIncomingMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === "CONNECTED") {
      this.playerId = msg.playerId || this.playerId;
    } else if (msg.type === "ROOM_JOINED") {
      this.playerId = msg.playerId || this.playerId;
      this.room = msg.room;
    } else if (
      msg.type === "ROOM_UPDATE" ||
      msg.type === "PLAYER_LEFT" ||
      msg.type === "PLAYER_DOWNED" ||
      msg.type === "WAVE_COMPLETED" ||
      msg.type === "WAVE_STARTED" ||
      msg.type === "MATCH_STARTED" ||
      msg.type === "MATCH_OVER"
    ) {
      if (msg.room) {
        const hadNoRoom = !this.room;
        this.room = msg.room;
        if (
          hadNoRoom &&
          msg.type === "ROOM_UPDATE" &&
          this.playerId &&
          Array.isArray(msg.room.members) &&
          msg.room.members.some((m) => m.id === this.playerId)
        ) {
          this.emit({ type: "ROOM_JOINED", playerId: this.playerId, room: msg.room });
          return;
        }
      }
    } else if (msg.type === "LEFT_ROOM") {
      this.room = null;
    }

    this.emit(msg);
  }

  _connectWebSocket(wsUrl) {
    return new Promise((resolve, reject) => {
      let ws;
      try {
        ws = new WebSocket(wsUrl);
      } catch (err) {
        reject(err || new Error("WebSocket constructor failed"));
        return;
      }

      this.ws = ws;
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled && this.ws === ws) {
          settled = true;
          this._cleanupSocket(ws);
          if (this.ws === ws) this.ws = null;
          reject(new Error("WebSocket handshake timeout"));
        }
      }, 1400);

      ws.onopen = () => {
        if (this.ws !== ws) return;
        this.transportMode = "ws";
        this.connected = true;
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve();
        }
        this.startHeartbeat();
        this.emit({ type: "WS_OPEN", transport: "ws" });
      };

      ws.onmessage = (ev) => {
        if (this.ws !== ws) return;
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        this._handleIncomingMessage(msg);
      };

      ws.onerror = () => {
        if (this.ws !== ws) return;
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          this._cleanupSocket(ws);
          if (this.ws === ws) this.ws = null;
          reject(new Error("WebSocket connection error"));
        }
      };

      ws.onclose = () => {
        if (this.ws !== ws) return;
        const wasOpen = this.connected;
        this.connected = false;
        this.stopHeartbeat();
        this.ws = null;
        if (this.transportMode === "ws") {
          this.transportMode = null;
        }
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error("WebSocket closed during handshake"));
        } else if (wasOpen) {
          this.emit({ type: "WS_CLOSE" });
        }
      };
    });
  }

  async _connectHttp() {
    const httpRes = this.getHttpBaseResult();
    if (!httpRes.ok) {
      throw new Error(httpRes.message);
    }
    this.httpBaseUrl = httpRes.baseUrl;

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;

    let res;
    try {
      res = await fetch(`${this.httpBaseUrl}/api/coop/connect`, {
        method: "POST",
        credentials: this._isCrossOriginHttp() ? "omit" : "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({}),
        signal: controller ? controller.signal : undefined,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!res || !res.ok) {
      throw new Error(`Máy chủ Co-op trả về mã lỗi ${res ? res.status : "network"}.`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Máy chủ web đang yêu cầu xác thực trình duyệt hoặc không hỗ trợ phiên này. Hãy mở link web Chia sẻ (Share) trên Chrome/Safari hoặc dùng chế độ P2P Trực Tiếp bên dưới!");
    }

    const data = await res.json();
    if (!data || !data.ok || !data.playerId) {
      throw new Error(data?.message || "Không thể thiết lập phiên Co-op với máy chủ.");
    }

    this.transportMode = "http";
    this.httpActive = true;
    this.connected = true;
    this.playerId = data.playerId;

    if (Array.isArray(data.events)) {
      for (const ev of data.events) {
        this._handleIncomingMessage(ev);
      }
    }

    this._startHttpPollLoop();
    this.emit({ type: "WS_OPEN", transport: "http" });
  }

  async _startHttpPollLoop() {
    while (this.httpActive && this.transportMode === "http" && this.playerId) {
      const abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      this.httpPollAbort = abortCtrl;
      try {
        const res = await fetch(
          `${this.httpBaseUrl}/api/coop/poll?playerId=${encodeURIComponent(this.playerId)}&wait=1800`,
          {
            method: "GET",
            credentials: this._isCrossOriginHttp() ? "omit" : "same-origin",
            cache: "no-store",
            signal: abortCtrl ? abortCtrl.signal : undefined,
          }
        );

        if (!this.httpActive || this.transportMode !== "http") break;

        if (res.status === 404) {
          this.httpActive = false;
          this.connected = false;
          this.transportMode = null;
          this.emit({ type: "WS_CLOSE" });
          break;
        }

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.events)) {
            for (const ev of data.events) {
              this._handleIncomingMessage(ev);
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 350));
        }
      } catch (err) {
        if (!this.httpActive || this.transportMode !== "http") break;
        if (err && err.name === "AbortError") break;
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  async _flushHttpOutbox() {
    if (!this.httpActive || this.transportMode !== "http" || !this.playerId) return;
    if (this.httpFlushTimer) {
      clearTimeout(this.httpFlushTimer);
      this.httpFlushTimer = null;
    }
    if (this.httpFlushing) {
      // Wait briefly and flush any remaining items
      await new Promise((r) => setTimeout(r, 20));
      if (this.httpFlushing) return;
    }
    if (this.httpOutbox.length === 0) return;

    this.httpFlushing = true;
    const batch = coalesceCoopOutbox(this.httpOutbox.splice(0, this.httpOutbox.length));
    try {
      const res = await fetch(`${this.httpBaseUrl}/api/coop/send`, {
        method: "POST",
        credentials: this._isCrossOriginHttp() ? "omit" : "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ playerId: this.playerId, messages: batch }),
      });

      if (res.status === 404) {
        this.httpActive = false;
        this.connected = false;
        this.transportMode = null;
        this.emit({ type: "WS_CLOSE" });
        throw new Error("Phiên Co-op đã hết hạn. Vui lòng thử lại.");
      }

      if (!res.ok) {
        throw new Error(`Lỗi gửi dữ liệu Co-op (${res.status}).`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.events)) {
        for (const ev of data.events) {
          this._handleIncomingMessage(ev);
        }
      }
    } finally {
      this.httpFlushing = false;
      if (this.httpActive && this.httpOutbox.length > 0 && !this.httpFlushTimer) {
        this.httpFlushTimer = setTimeout(() => {
          this.httpFlushTimer = null;
          this._flushHttpOutbox().catch(() => {});
        }, 30);
      }
    }
  }

  connect(forceReconnect = false) {
    if (!forceReconnect && this.isConnected()) {
      return Promise.resolve();
    }
    if (!forceReconnect && this.connectPromise) {
      return this.connectPromise;
    }

    if (forceReconnect) {
      this.stopHeartbeat();
      this._cleanupSocket(this.ws);
      this.ws = null;
      this._stopHttpTransport(false);
      this.connected = false;
      this.transportMode = null;
      this.connectPromise = null;
    }

    const urlResult = this.getWsUrlResult();
    const httpResult = this.getHttpBaseResult();

    if (!urlResult.ok && !httpResult.ok) {
      return Promise.reject(new Error(urlResult.message || httpResult.message));
    }

    if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
      this._cleanupSocket(this.ws);
      this.ws = null;
    }

    this.connectPromise = (async () => {
      try {
        if (urlResult.ok) {
          try {
            await this._connectWebSocket(urlResult.url);
            return;
          } catch (wsErr) {
            // Automatic fallback to HTTP Co-op transport when WebSocket is blocked on Chrome/proxy
            console.info("Co-op WebSocket unavailable, falling back to HTTP transport:", wsErr?.message || wsErr);
          }
        }

        if (!httpResult.ok) {
          throw new Error(httpResult.message);
        }

        try {
          await this._connectHttp();
        } catch (httpErr) {
          throw new Error(
            httpErr?.message && !httpErr.message.includes("Failed to fetch")
              ? httpErr.message
              : "Không thể kết nối máy chủ Co-op. Hãy kiểm tra kết nối mạng hoặc mở link web bằng Chrome/Safari."
          );
        }
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  async reconnect() {
    return this.connect(true);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.transportMode === "ws") {
        this.send({ type: "PING" });
      }
    }, 15000);
  }

  stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  _stopP2P() {
    if (this.p2pHost) {
      this.p2pHost.destroy();
      this.p2pHost = null;
    }
    if (this.p2pPeer) {
      this.p2pPeer.destroy();
      this.p2pPeer = null;
    }
  }

  async startP2PHost(playerName, heroId) {
    this.stopHeartbeat();
    this._cleanupSocket(this.ws);
    this.ws = null;
    this._stopHttpTransport(false);
    this._stopP2P();
    this.room = null;
    this.connected = false;
    this.transportMode = "p2p_host";

    const host = new P2PRoomHost({
      hostName: playerName,
      heroId,
      onLocalEvent: (ev) => this._handleIncomingMessage(ev),
      onPeersChanged: () => this.emit({ type: "P2P_PEERS_CHANGED" }),
    });
    this.p2pHost = host;
    this.connected = true;
    host.start();
    let inviteCode = "";
    let inviteError = "";
    try {
      const invite = await host.createInviteOffer();
      inviteCode = invite?.code || "";
    } catch (err) {
      inviteError = err?.message || "Chưa tạo được mã mời P2P tự động.";
    }
    this.emit({ type: "WS_OPEN", transport: "p2p_host" });
    this.emit({ type: "P2P_INVITE_READY", inviteCode, inviteError });
    return { mode: "p2p", room: this.room, inviteCode, inviteError };
  }

  async createP2PInviteOffer() {
    if (!this.p2pHost || this.transportMode !== "p2p_host") {
      throw new Error("Bạn chưa tạo phòng P2P.");
    }
    return await this.p2pHost.createInviteOffer();
  }

  async acceptP2PAnswer(answerCode) {
    if (!this.p2pHost || this.transportMode !== "p2p_host") {
      throw new Error("Bạn chưa tạo phòng P2P.");
    }
    return await this.p2pHost.acceptJoinAnswer(answerCode);
  }

  async joinP2PWithOffer(offerCode, playerName, heroId) {
    this.stopHeartbeat();
    this._cleanupSocket(this.ws);
    this.ws = null;
    this._stopHttpTransport(false);
    this._stopP2P();
    this.room = null;
    this.connected = false;
    this.transportMode = "p2p_peer";

    const peer = new P2PRoomPeerClient({
      onEvent: (ev) => {
        if (ev?.type === "CONNECTED") {
          this.connected = true;
          this.emit({ type: "WS_OPEN", transport: "p2p_peer" });
        }
        this._handleIncomingMessage(ev);
      },
      onClose: () => {
        if (this.p2pPeer === peer) {
          this.connected = false;
          this.transportMode = null;
          this.emit({ type: "WS_CLOSE" });
        }
      },
    });
    this.p2pPeer = peer;
    const answerCode = await peer.createAnswerFromOffer(offerCode, playerName, heroId);
    if (peer.playerId) {
      this.playerId = peer.playerId;
    }
    return { answerCode };
  }

  isConnected() {
    if (this.transportMode === "p2p_host") {
      return Boolean(this.connected && this.p2pHost);
    }
    if (this.transportMode === "p2p_peer") {
      return Boolean(this.connected && this.p2pPeer && this.p2pPeer.isOpen());
    }
    if (this.transportMode === "ws") {
      return Boolean(this.connected && this.ws && this.ws.readyState === WebSocket.OPEN);
    }
    if (this.transportMode === "http") {
      return Boolean(this.connected && this.httpActive && this.playerId);
    }
    return false;
  }

  send(payload) {
    if (this.transportMode === "p2p_host" && this.p2pHost) {
      this.p2pHost.handleMessage(this.p2pHost.hostId, payload);
      return true;
    }

    if (this.transportMode === "p2p_peer" && this.p2pPeer) {
      return this.p2pPeer.send(payload);
    }

    if (this.transportMode === "ws") {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
      try {
        this.ws.send(JSON.stringify(payload));
        return true;
      } catch {
        return false;
      }
    }

    if (this.transportMode === "http" && this.httpActive && this.playerId) {
      this.httpOutbox.push(payload);
      if (CRITICAL_HTTP_TYPES.has(payload?.type)) {
        this._flushHttpOutbox().catch(() => {});
      } else if (!this.httpFlushTimer) {
        this.httpFlushTimer = setTimeout(() => {
          this.httpFlushTimer = null;
          this._flushHttpOutbox().catch(() => {});
        }, 35);
      }
      return true;
    }

    return false;
  }

  async _ensureSend(payload) {
    if (!this.isConnected()) {
      await this.connect(false);
    }

    if (this.transportMode === "p2p_host" || this.transportMode === "p2p_peer") {
      this.send(payload);
      return;
    }

    if (this.transportMode === "http") {
      this.httpOutbox.push(payload);
      await this._flushHttpOutbox();
      return;
    }

    const ok = this.send(payload);
    if (!ok) {
      await this.connect(true);
      if (this.transportMode === "http") {
        this.httpOutbox.push(payload);
        await this._flushHttpOutbox();
        return;
      }
      const retryOk = this.send(payload);
      if (!retryOk) {
        throw new Error("Kênh kết nối Co-op chưa sẵn sàng để gửi lệnh. Vui lòng thử lại.");
      }
    }
  }

  async createRoom(playerName, heroId) {
    if (this.transportMode === "p2p_host" && this.p2pHost && this.room) {
      return { mode: "p2p", room: this.room, inviteCode: "" };
    }

    const protocol = typeof window !== "undefined" ? window.location?.protocol || "http:" : "http:";
    const hasCustomServer = Boolean(this._getEffectiveOverrideUrl());
    const localFile = isLocalFileProtocol(protocol);
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;

    if (!offline && !(localFile && !hasCustomServer)) {
      try {
        await this._ensureSend({ type: "CREATE_ROOM", playerName, heroId });
        return { mode: "server", room: this.room };
      } catch (err) {
        console.info("Co-op server unavailable during CREATE_ROOM, falling back to Direct P2P:", err?.message || err);
      }
    }

    return await this.startP2PHost(playerName, heroId);
  }

  async joinRoom(roomId, playerName, heroId) {
    const classified = classifyJoinCode(roomId);
    if (classified.kind === "empty") {
      throw new Error("Vui lòng nhập mã ID phòng hoặc mã mời P2P (AH1...).");
    }
    if (classified.kind === "p2p_signal") {
      const p2pRes = await this.joinP2PWithOffer(classified.normalized, playerName, heroId);
      return { mode: "p2p", ...p2pRes };
    }

    const protocol = typeof window !== "undefined" ? window.location?.protocol || "http:" : "http:";
    const hasCustomServer = Boolean(this._getEffectiveOverrideUrl());
    if (isLocalFileProtocol(protocol) && !hasCustomServer) {
      throw new Error(
        "Bạn đang mở file HTML tải về máy (không có máy chủ web). Để vào phòng bạn bè từ file này, hãy dán Mã Mời P2P (bắt đầu bằng AH1...) vào đây hoặc ở mục P2P Trực Tiếp bên dưới."
      );
    }

    try {
      await this._ensureSend({ type: "JOIN_ROOM", roomId: classified.normalized, playerName, heroId });
      return { mode: "server", room: this.room };
    } catch (err) {
      throw new Error(
        err?.message ||
          "Không thể kết nối máy chủ Co-op để tìm mã 6 ký tự. Nếu chơi qua file HTML tải về máy, hãy dán Mã Mời P2P (AH1...) từ Chủ phòng."
      );
    }
  }

  leaveRoom() {
    if (this.transportMode === "p2p_host" || this.transportMode === "p2p_peer") {
      this.send({ type: "LEAVE_ROOM" });
      this._stopP2P();
      this.transportMode = null;
      this.connected = false;
      this.room = null;
      return;
    }
    this.send({ type: "LEAVE_ROOM" });
    this.room = null;
  }

  selectHero(heroId) {
    this.send({ type: "SELECT_HERO", heroId });
  }

  setName(playerName) {
    this.send({ type: "SET_NAME", playerName });
  }

  toggleReady(ready) {
    this.send({ type: "TOGGLE_READY", ready });
  }

  startMatch() {
    this.send({ type: "START_MATCH" });
  }

  restartMatch() {
    this.send({ type: "RESTART_MATCH" });
  }

  setWaveReady(ready = true) {
    this.send({ type: "WAVE_READY", ready });
  }

  nextWave() {
    this.send({ type: "NEXT_WAVE" });
  }

  disconnect() {
    this.stopHeartbeat();
    this._cleanupSocket(this.ws);
    this.ws = null;
    this._stopHttpTransport(true);
    this._stopP2P();
    this.room = null;
    this.connected = false;
    this.transportMode = null;
    this.connectPromise = null;
  }
}

export const mpClient = new MultiplayerClient();
