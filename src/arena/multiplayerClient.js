import {
  buildCoopWsUrl,
  buildCoopHttpBase,
  coalesceCoopOutbox,
  isLocalFileProtocol,
  isPrivateOrDevOrigin,
  classifyJoinCode,
  isSixDigitCode,
} from "./combatLogic";
import { P2PRoomHost, P2PRoomPeerClient } from "./webrtcCoop";
import { readDeviceKey, writeDeviceKey, removeDeviceKey } from "./deviceStorage";

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
  "ALLY_SUPPORT",
  "REVIVE_PLAYER",
  "MAP_PROGRESS_SYNC",
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
    this.p2pAnswerPollTimer = null;
    this.p2pChannel = null;
    this.p2pLatestRawOffer = "";
    this.p2pServerShortCode = "";
    this.p2pHandledAnswers = new Set();
    this.p2pMqttSockets = [];
    this.p2pMqttPingTimer = null;
    this.p2pMqttRoomCode = "";
    this.p2pMqttPendingCleanup = new Set();
    this.p2pRelayActive = false;
    this.p2pRelayRoomCode = "";
    this.p2pRelayOutbox = [];
    this.p2pRelayFlushTimer = null;
    this.p2pRelayFlushing = false;
    this.p2pRelayPollAbort = null;
    this.p2pRelayFallbackTimer = null;
    this.p2pPeerMqttConn = null;
    this.playerId = null;
    this.room = null;
    this.connected = false;
    this.listeners = new Set();
    this.pingTimer = null;
    this.rttMs = 0;
    this.connectPromise = null;
    this.founderToken = "";
    this.founderUnlocked = false;
  }

  getNetworkStats() {
    const conn =
      typeof navigator !== "undefined"
        ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
        : null;
    return {
      rttMs: this.rttMs || (typeof conn?.rtt === "number" ? conn.rtt : 0),
      effectiveType: typeof conn?.effectiveType === "string" ? conn.effectiveType : "",
    };
  }

  setFounderAuth(unlocked, token = "") {
    this.founderUnlocked = Boolean(unlocked);
    this.founderToken = unlocked && typeof token === "string" ? token : "";
    if (this.p2pHost) {
      this.p2pHost.setFounderUnlocked?.(this.founderUnlocked);
    }
    if (this.founderUnlocked && this.isConnected()) {
      this.send({ type: "AUTH_FOUNDER", founderToken: this.founderToken });
    }
  }

  isFounderUnlocked() {
    return Boolean(this.founderUnlocked);
  }

  _assertHeroAuthorized(heroId) {
    if (heroId === "thien" && !this.founderUnlocked) {
      throw new Error("Tướng bí mật THIÊN chỉ dành cho Nhà Sáng Lập. Vui lòng xác thực mật khẩu!");
    }
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
      const saved = readDeviceKey("arena_hero_server_url");
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
        writeDeviceKey("arena_hero_server_url", clean);
      } else {
        removeDeviceKey("arena_hero_server_url");
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
    if (candidate) {
      if (isLocalFileProtocol(protocol) && isPrivateOrDevOrigin(candidate)) {
        // Blocked for private/dev preview origins on standalone file/content protocols
      } else {
        return candidate;
      }
    }
    if (isLocalFileProtocol(protocol)) {
      const rawLan = typeof window.__ARENA_LAN_URL__ === "string" ? window.__ARENA_LAN_URL__.trim() : "";
      if (
        rawLan &&
        /^https?:\/\/(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local)(?::\d+)?$/i.test(rawLan)
      ) {
        return rawLan;
      }
    }
    return "";
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

  _isCrossOriginUrl(baseUrl) {
    if (typeof window === "undefined" || !baseUrl) return false;
    try {
      return new URL(baseUrl).origin !== window.location.origin;
    } catch {
      return true;
    }
  }

  async _postP2PSignal(kind, payload, forCode, desiredCode) {
    if (!payload) return null;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
    const httpRes = this.getHttpBaseResult();
    if (!httpRes.ok || !httpRes.baseUrl) return null;

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;
    try {
      const res = await fetch(`${httpRes.baseUrl}/api/p2p/signal`, {
        method: "POST",
        credentials: this._isCrossOriginUrl(httpRes.baseUrl) ? "omit" : "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ kind, payload, forCode, desiredCode }),
        signal: controller ? controller.signal : undefined,
      });
      if (!res || !res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return null;
      const data = await res.json().catch(() => null);
      if (data && data.ok && typeof data.code === "string" && isSixDigitCode(data.code)) {
        return data.code;
      }
      return null;
    } catch {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async _fetchP2PSignal(code, { optional = false } = {}) {
    const clean = String(code || "").trim().replace(/\s+/g, "");
    if (!isSixDigitCode(clean)) {
      if (optional) return null;
      throw new Error("Mã P2P phải gồm đúng 6 chữ số.");
    }
    const httpRes = this.getHttpBaseResult();
    if (!httpRes.ok || !httpRes.baseUrl) {
      if (optional) return null;
      throw new Error("Không có kết nối máy chủ để tra cứu mã 6 số. Nếu chơi offline, hãy dán nguyên văn mã AH1...");
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
    try {
      const res = await fetch(`${httpRes.baseUrl}/api/p2p/signal/${encodeURIComponent(clean)}`, {
        method: "GET",
        credentials: this._isCrossOriginUrl(httpRes.baseUrl) ? "omit" : "same-origin",
        cache: "no-store",
        signal: controller ? controller.signal : undefined,
      });
      if (!res) {
        if (optional) return null;
        throw new Error("Không thể kết nối máy chủ để tra cứu mã 6 số.");
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        if (optional) return null;
        throw new Error("Máy chủ không trả về dữ liệu mã 6 số hợp lệ.");
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        if (optional) return null;
        throw new Error(data?.message || `Không tìm thấy mã ${clean} hoặc mã đã hết hạn.`);
      }
      return data;
    } catch (err) {
      if (optional) return null;
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  _handleIncomingMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === "PONG") {
      if (typeof msg.pingTs === "number" && msg.pingTs > 0) {
        const sample = Math.max(0, Math.min(2000, Date.now() - msg.pingTs));
        this.rttMs = this.rttMs > 0 ? Math.round(this.rttMs * 0.65 + sample * 0.35) : sample;
      }
      return;
    }

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
        if (this.founderUnlocked && this.founderToken) {
          this.send({ type: "AUTH_FOUNDER", founderToken: this.founderToken });
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
      const headers = { "Content-Type": "application/json" };
      if (this.founderToken) headers["X-Founder-Token"] = this.founderToken;
      res = await fetch(`${this.httpBaseUrl}/api/coop/connect`, {
        method: "POST",
        credentials: this._isCrossOriginHttp() ? "omit" : "same-origin",
        headers,
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
        const isHidden = typeof document !== "undefined" && document.hidden;
        if (isHidden) {
          await new Promise((r) => setTimeout(r, 900));
          if (!this.httpActive || this.transportMode !== "http") break;
        }
        const pollWait = isHidden ? 3500 : 1800;
        const res = await fetch(
          `${this.httpBaseUrl}/api/coop/poll?playerId=${encodeURIComponent(this.playerId)}&wait=${pollWait}`,
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
      const headers = { "Content-Type": "application/json" };
      if (this.founderToken) headers["X-Founder-Token"] = this.founderToken;
      const res = await fetch(`${this.httpBaseUrl}/api/coop/send`, {
        method: "POST",
        credentials: this._isCrossOriginHttp() ? "omit" : "same-origin",
        headers,
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
        if (typeof document !== "undefined" && document.hidden) return;
        this.send({ type: "PING", pingTs: Date.now() });
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
    this.p2pRelayActive = false;
    this.p2pRelayRoomCode = "";
    this.p2pRelayOutbox = [];
    this.p2pRelayFlushing = false;
    if (this.p2pRelayFallbackTimer) {
      clearTimeout(this.p2pRelayFallbackTimer);
      this.p2pRelayFallbackTimer = null;
    }
    if (this.p2pRelayFlushTimer) {
      clearTimeout(this.p2pRelayFlushTimer);
      this.p2pRelayFlushTimer = null;
    }
    if (this.p2pRelayPollAbort) {
      try {
        this.p2pRelayPollAbort.abort();
      } catch {
      }
      this.p2pRelayPollAbort = null;
    }
    if (this.p2pPeerMqttConn) {
      this._cleanupSocket(this.p2pPeerMqttConn.ws);
      this.p2pPeerMqttConn = null;
    }
    if (this.p2pAnswerPollTimer) {
      clearInterval(this.p2pAnswerPollTimer);
      this.p2pAnswerPollTimer = null;
    }
    if (this.p2pMqttPingTimer) {
      clearInterval(this.p2pMqttPingTimer);
      this.p2pMqttPingTimer = null;
    }
    if (Array.isArray(this.p2pMqttSockets) && this.p2pMqttSockets.length > 0) {
      for (const ws of this.p2pMqttSockets) {
        try {
          if (ws && ws.readyState === WebSocket.OPEN) {
            if (isSixDigitCode(this.p2pMqttRoomCode)) {
              ws.send(this._mqttEncodePublish(this._mqttOfferTopic(this.p2pMqttRoomCode), "", true));
            }
            ws.send(Uint8Array.of(0xe0, 0x00));
          }
        } catch {
        }
        this._cleanupSocket(ws);
      }
      this.p2pMqttSockets = [];
    }
    this.p2pMqttRoomCode = "";
    if (this.p2pChannel) {
      try {
        this.p2pChannel.close();
      } catch {
      }
      this.p2pChannel = null;
    }
    this.p2pLatestRawOffer = "";
    this.p2pServerShortCode = "";
    this.p2pHandledAnswers.clear();
    if (this.p2pHost) {
      this.p2pHost.destroy();
      this.p2pHost = null;
    }
    if (this.p2pPeer) {
      this.p2pPeer.destroy();
      this.p2pPeer = null;
    }
  }

  _mqttBrokers() {
    return [
      "wss://broker.emqx.io:8084/mqtt",
      "wss://test.mosquitto.org:8081/mqtt",
      "wss://broker.hivemq.com:8884/mqtt",
    ];
  }

  _mqttOfferTopic(code) {
    return `arenahero118/p2p/v1/offer/${code}`;
  }

  _mqttAnswerTopic(code) {
    return `arenahero118/p2p/v1/answer/${code}`;
  }

  _mqttRelayC2HTopic(code) {
    return `arenahero118/p2p/v1/relay/${code}/c2h`;
  }

  _mqttRelayH2CTopic(code, peerId) {
    return `arenahero118/p2p/v1/relay/${code}/h2c/${peerId}`;
  }

  _utf8Encode(str) {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(String(str || ""));
    }
    const raw = unescape(encodeURIComponent(String(str || "")));
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  _utf8Decode(bytes) {
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder().decode(bytes);
    }
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    try {
      return decodeURIComponent(escape(out));
    } catch {
      return out;
    }
  }

  _mqttEncodeStr(str) {
    const b = this._utf8Encode(str);
    const out = new Uint8Array(2 + b.length);
    out[0] = (b.length >> 8) & 0xff;
    out[1] = b.length & 0xff;
    out.set(b, 2);
    return out;
  }

  _mqttBuildPacket(firstByte, bodyParts) {
    let remLen = 0;
    for (const p of bodyParts) remLen += p.length;
    const lenBytes = [];
    let x = remLen;
    do {
      let digit = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) digit |= 0x80;
      lenBytes.push(digit);
    } while (x > 0);
    const out = new Uint8Array(1 + lenBytes.length + remLen);
    out[0] = firstByte;
    let offset = 1;
    for (const lb of lenBytes) out[offset++] = lb;
    for (const p of bodyParts) {
      out.set(p, offset);
      offset += p.length;
    }
    return out;
  }

  _mqttEncodeConnect(clientId) {
    const proto = new Uint8Array([0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x1e]);
    return this._mqttBuildPacket(0x10, [proto, this._mqttEncodeStr(clientId)]);
  }

  _mqttEncodeSubscribe(packetId, topic) {
    const pid = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
    const qos = new Uint8Array([0x00]);
    return this._mqttBuildPacket(0x82, [pid, this._mqttEncodeStr(topic), qos]);
  }

  _mqttEncodePublish(topic, payload, retain = false) {
    return this._mqttBuildPacket(retain ? 0x31 : 0x30, [
      this._mqttEncodeStr(topic),
      this._utf8Encode(payload),
    ]);
  }

  _mqttConcatBytes(a, b) {
    if (!a || a.length === 0) return b;
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
  }

  _mqttParsePackets(buf) {
    const packets = [];
    let offset = 0;
    while (offset < buf.length) {
      const b0 = buf[offset];
      const pktType = (b0 >> 4) & 0x0f;
      const flags = b0 & 0x0f;
      let multiplier = 1;
      let remLen = 0;
      let pos = offset + 1;
      let lenDone = false;
      while (pos < buf.length && pos - offset <= 4) {
        const enc = buf[pos++];
        remLen += (enc & 0x7f) * multiplier;
        multiplier *= 128;
        if ((enc & 0x80) === 0) {
          lenDone = true;
          break;
        }
      }
      if (!lenDone || pos + remLen > buf.length) break;
      const body = buf.subarray(pos, pos + remLen);
      offset = pos + remLen;
      if (pktType === 2) {
        packets.push({ type: 2, rc: body.length >= 2 ? body[1] : 0 });
      } else if (pktType === 3 && body.length >= 2) {
        const tLen = (body[0] << 8) | body[1];
        if (2 + tLen <= body.length) {
          const topic = this._utf8Decode(body.subarray(2, 2 + tLen));
          let pStart = 2 + tLen;
          if (((flags >> 1) & 0x03) > 0) pStart += 2;
          const payload = pStart <= body.length ? this._utf8Decode(body.subarray(pStart)) : "";
          packets.push({ type: 3, topic, payload });
        }
      } else {
        packets.push({ type: pktType });
      }
    }
    return { packets, rest: buf.subarray(offset) };
  }

  _openMqttSocket(url, timeoutMs = 2800) {
    return new Promise((resolve, reject) => {
      if (typeof WebSocket === "undefined" || (typeof navigator !== "undefined" && navigator.onLine === false)) {
        reject(new Error("WebSocket offline"));
        return;
      }
      let ws;
      try {
        ws = new WebSocket(url, "mqtt");
        ws.binaryType = "arraybuffer";
      } catch (err) {
        reject(err || new Error("MQTT WebSocket failed"));
        return;
      }

      let settled = false;
      const state = { ws, buffer: new Uint8Array(0), onPackets: null };
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          this._cleanupSocket(ws);
          reject(new Error("MQTT timeout"));
        }
      }, timeoutMs);

      ws.onopen = () => {
        try {
          const cid = `ah_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
          ws.send(this._mqttEncodeConnect(cid));
        } catch (err) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            this._cleanupSocket(ws);
            reject(err);
          }
        }
      };

      ws.onmessage = (ev) => {
        const chunk = ev.data instanceof ArrayBuffer ? new Uint8Array(ev.data) : null;
        if (!chunk) return;
        state.buffer = this._mqttConcatBytes(state.buffer, chunk);
        const parsed = this._mqttParsePackets(state.buffer);
        state.buffer = parsed.rest;
        if (!settled) {
          const connack = parsed.packets.find((p) => p.type === 2);
          if (connack) {
            settled = true;
            clearTimeout(timer);
            if (connack.rc !== 0) {
              this._cleanupSocket(ws);
              reject(new Error(`MQTT CONNACK ${connack.rc}`));
              return;
            }
            resolve(state);
          }
        }
        if (parsed.packets.length > 0 && state.onPackets) {
          state.onPackets(parsed.packets);
        }
      };

      ws.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          this._cleanupSocket(ws);
          reject(new Error("MQTT error"));
        }
      };

      ws.onclose = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error("MQTT closed"));
        }
      };
    });
  }

  async _openAllMqttConnections(timeoutMs = 5500) {
    if (typeof WebSocket === "undefined" || (typeof navigator !== "undefined" && navigator.onLine === false)) {
      return [];
    }
    const brokers = this._mqttBrokers();
    const settled = await Promise.allSettled(
      brokers.map((url) => this._openMqttSocket(url, timeoutMs))
    );
    const openConns = [];
    for (const res of settled) {
      if (res.status === "fulfilled" && res.value) {
        openConns.push(res.value);
      }
    }
    return openConns;
  }

  async _startMqttSignalingHost(roomCode, offerPayload) {
    if (!isSixDigitCode(roomCode) || !offerPayload) return false;
    if (this.p2pMqttPingTimer) {
      clearInterval(this.p2pMqttPingTimer);
      this.p2pMqttPingTimer = null;
    }
    if (Array.isArray(this.p2pMqttSockets) && this.p2pMqttSockets.length > 0) {
      for (const oldWs of this.p2pMqttSockets) {
        this._cleanupSocket(oldWs);
      }
      this.p2pMqttSockets = [];
    }

    const conns = await this._openAllMqttConnections(6000);
    if (conns.length === 0 || this.transportMode !== "p2p_host" || !this.p2pHost) {
      for (const conn of conns) this._cleanupSocket(conn.ws);
      return false;
    }

    this.p2pMqttRoomCode = roomCode;
    const answerTopic = this._mqttAnswerTopic(roomCode);
    const offerTopic = this._mqttOfferTopic(roomCode);
    const relayC2HTopic = this._mqttRelayC2HTopic(roomCode);
    const activeSockets = [];

    for (const conn of conns) {
      conn.onPackets = (packets) => {
        for (const pkt of packets) {
          if (pkt.type === 3 && pkt.topic === answerTopic && pkt.payload) {
            if (pkt.payload.startsWith("AH1") || pkt.payload.startsWith("{")) {
              this._handleIncomingP2PAnswer(pkt.payload).catch(() => {});
            }
          } else if (pkt.type === 3 && pkt.topic === relayC2HTopic && pkt.payload && this.p2pHost) {
            try {
              const envelope = JSON.parse(pkt.payload);
              if (envelope?.peerId && envelope?.msg) {
                this.p2pHost.receiveRelayMessage(envelope.peerId, envelope.msg);
              }
            } catch {
            }
          }
        }
      };
      try {
        conn.ws.send(this._mqttEncodeSubscribe(1, answerTopic));
        conn.ws.send(this._mqttEncodeSubscribe(2, relayC2HTopic));
        conn.ws.send(this._mqttEncodePublish(offerTopic, offerPayload, true));
        activeSockets.push(conn.ws);
      } catch {
        this._cleanupSocket(conn.ws);
      }
    }

    if (activeSockets.length === 0) {
      return false;
    }

    this.p2pMqttSockets = activeSockets;
    this.p2pMqttPingTimer = setInterval(() => {
      for (const ws of this.p2pMqttSockets) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(Uint8Array.of(0xc0, 0x00));
          } catch {
          }
        }
      }
    }, 20000);

    return true;
  }

  async _publishMqttOffer(roomCode, offerPayload) {
    if (!isSixDigitCode(roomCode) || !offerPayload) return false;
    const openSockets = (this.p2pMqttSockets || []).filter((ws) => ws && ws.readyState === WebSocket.OPEN);
    if (openSockets.length > 0 && this.p2pMqttRoomCode === roomCode) {
      let sentAny = false;
      const offerTopic = this._mqttOfferTopic(roomCode);
      for (const ws of openSockets) {
        try {
          ws.send(this._mqttEncodePublish(offerTopic, offerPayload, true));
          sentAny = true;
        } catch {
        }
      }
      if (sentAny) return true;
    }
    return await this._startMqttSignalingHost(roomCode, offerPayload);
  }

  async _lookupMqttOffer(code, timeoutMs = 5500) {
    const clean = String(code || "").trim().replace(/\s+/g, "");
    if (!isSixDigitCode(clean)) return null;
    if (typeof WebSocket === "undefined" || (typeof navigator !== "undefined" && navigator.onLine === false)) {
      return null;
    }

    const offerTopic = this._mqttOfferTopic(clean);
    const brokers = this._mqttBrokers();

    return await new Promise((resolve) => {
      let done = false;
      const openedSockets = [];
      let pendingBrokers = brokers.length;

      const finish = (val) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        for (const ws of openedSockets) {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(Uint8Array.of(0xe0, 0x00));
            }
          } catch {
          }
          this._cleanupSocket(ws);
        }
        resolve(val);
      };

      const timer = setTimeout(() => finish(null), timeoutMs);

      brokers.forEach((url) => {
        this._openMqttSocket(url, Math.min(timeoutMs, 5200))
          .then((conn) => {
            if (done) {
              this._cleanupSocket(conn.ws);
              return;
            }
            openedSockets.push(conn.ws);
            conn.onPackets = (packets) => {
              for (const pkt of packets) {
                if (pkt.type === 3 && pkt.topic === offerTopic && pkt.payload) {
                  const val = pkt.payload.trim();
                  if (val.startsWith("AH1") || val.startsWith("{")) {
                    finish({ ok: true, code: clean, kind: "offer", payload: val, mqttSignaling: true });
                    return;
                  }
                }
              }
            };
            try {
              conn.ws.send(this._mqttEncodeSubscribe(1, offerTopic));
            } catch {
              pendingBrokers--;
              if (pendingBrokers <= 0 && openedSockets.length === 0) finish(null);
            }
          })
          .catch(() => {
            pendingBrokers--;
            if (pendingBrokers <= 0 && openedSockets.length === 0) finish(null);
          });
      });
    });
  }

  async _publishMqttAnswer(code, answerPayload) {
    const clean = String(code || "").trim().replace(/\s+/g, "");
    if (!isSixDigitCode(clean) || !answerPayload) return false;
    const conns = await this._openAllMqttConnections(5500);
    if (conns.length === 0) return false;
    let sentCount = 0;
    const answerTopic = this._mqttAnswerTopic(clean);
    for (const conn of conns) {
      try {
        conn.ws.send(this._mqttEncodePublish(answerTopic, answerPayload, false));
        sentCount++;
      } catch {
      }
    }
    await new Promise((r) => setTimeout(r, 140));
    for (const conn of conns) {
      try {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(Uint8Array.of(0xe0, 0x00));
        }
      } catch {
      }
      this._cleanupSocket(conn.ws);
    }
    return sentCount > 0;
  }

  _ensureP2PBroadcastChannel() {
    if (typeof BroadcastChannel === "undefined") return null;
    if (!this.p2pChannel) {
      try {
        this.p2pChannel = new BroadcastChannel("arena_hero_p2p_v1");
        this.p2pChannel.onmessage = (ev) => {
          const msg = ev?.data;
          if (!msg || typeof msg !== "object") return;
          if (this.transportMode === "p2p_host" && this.p2pHost) {
            const roomCode = this.p2pServerShortCode || this.p2pHost.room?.id;
            if (msg.kind === "P2P_OFFER_QUERY" && msg.code === roomCode && this.p2pLatestRawOffer) {
              try {
                this.p2pChannel.postMessage({
                  kind: "P2P_OFFER_DATA",
                  code: roomCode,
                  payload: this.p2pLatestRawOffer,
                });
              } catch {
              }
            } else if (
              msg.kind === "P2P_ANSWER_DATA" &&
              (msg.forCode === roomCode || msg.forCode === this.p2pHost.room?.id) &&
              typeof msg.payload === "string"
            ) {
              this._handleIncomingP2PAnswer(msg.payload).catch(() => {});
            }
          }
        };
      } catch {
        this.p2pChannel = null;
      }
    }
    return this.p2pChannel;
  }

  _lookupLocalOfferViaChannel(code, timeoutMs = 450) {
    return new Promise((resolve) => {
      if (typeof BroadcastChannel === "undefined" || !isSixDigitCode(code)) {
        resolve(null);
        return;
      }
      let ch = null;
      let done = false;
      const finish = (val) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (ch) {
          try {
            ch.close();
          } catch {
          }
        }
        resolve(val);
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      try {
        ch = new BroadcastChannel("arena_hero_p2p_v1");
        ch.onmessage = (ev) => {
          const msg = ev?.data;
          if (msg?.kind === "P2P_OFFER_DATA" && msg.code === code && typeof msg.payload === "string") {
            finish({ ok: true, code, kind: "offer", payload: msg.payload, localChannel: true });
          }
        };
        ch.postMessage({ kind: "P2P_OFFER_QUERY", code });
      } catch {
        finish(null);
      }
    });
  }

  async _handleIncomingP2PAnswer(answerPayload) {
    if (!answerPayload || !this.p2pHost || this.transportMode !== "p2p_host") return null;
    if (this.p2pHandledAnswers.has(answerPayload)) return null;
    this.p2pHandledAnswers.add(answerPayload);
    const res = await this.p2pHost.acceptJoinAnswer(answerPayload);
    const roomCode = this.p2pServerShortCode || this.p2pHost.room.id;
    this.emit({ type: "P2P_AUTO_PAIRED", roomId: roomCode, peerId: res?.peerId });

    // Prepare a fresh standby offer on the same 6-digit room code if slots remain
    if (this.p2pHost && this.p2pHost.room.players.size < 4) {
      try {
        const nextInvite = await this.p2pHost.createInviteOffer();
        const nextRaw = nextInvite?.code || "";
        if (nextRaw) {
          this.p2pLatestRawOffer = nextRaw;
          const [refreshed, mqttOk] = await Promise.all([
            this._postP2PSignal("offer", nextRaw, undefined, roomCode),
            this._publishMqttOffer(roomCode, nextRaw),
          ]);
          if (refreshed) this.p2pServerShortCode = refreshed;
          this.emit({
            type: "P2P_INVITE_READY",
            inviteCode: this.p2pServerShortCode || roomCode,
            manualOfferCode: nextRaw,
            hasServerSignaling: Boolean(this.p2pServerShortCode || mqttOk),
            inviteError: "",
          });
        }
      } catch {
      }
    }
    return res;
  }

  _startP2PAnswerPollLoop(roomCode) {
    if (this.p2pAnswerPollTimer) {
      clearInterval(this.p2pAnswerPollTimer);
      this.p2pAnswerPollTimer = null;
    }
    if (!isSixDigitCode(roomCode)) return;
    let inFlight = false;
    this.p2pAnswerPollTimer = setInterval(async () => {
      if (inFlight || this.transportMode !== "p2p_host" || !this.p2pHost) return;
      if (typeof document !== "undefined" && document.hidden) return;
      if (this.p2pHost.room.players.size >= 4) return;
      const httpRes = this.getHttpBaseResult();
      if (!httpRes.ok || !httpRes.baseUrl) return;
      inFlight = true;
      try {
        const res = await fetch(`${httpRes.baseUrl}/api/p2p/signal/${encodeURIComponent(roomCode)}/answers`, {
          method: "GET",
          credentials: this._isCrossOriginUrl(httpRes.baseUrl) ? "omit" : "same-origin",
          cache: "no-store",
        });
        if (!res || !res.ok) return;
        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data.answers)) {
          for (const item of data.answers) {
            if (item?.payload) {
              await this._handleIncomingP2PAnswer(item.payload).catch(() => {});
            }
          }
        }
      } catch {
      } finally {
        inFlight = false;
      }
    }, 900);
  }

  _startP2PHostRelay(roomCode, host) {
    if (!isSixDigitCode(roomCode) || !host) return;
    this.p2pRelayRoomCode = roomCode;
    this.p2pRelayActive = true;
    const httpBase = this.getHttpBaseResult();

    host.setRelaySender((targetPeerId, payload) => {
      if (!this.p2pRelayActive || this.p2pHost !== host) return;
      if (httpBase.ok && httpBase.baseUrl) {
        const pType = payload?.type;
        if (pType === "WORLD_SYNC") {
          for (let i = this.p2pRelayOutbox.length - 1; i >= 0; i--) {
            if (this.p2pRelayOutbox[i].targetPeerId === targetPeerId && this.p2pRelayOutbox[i].payload?.type === "WORLD_SYNC") {
              this.p2pRelayOutbox.splice(i, 1);
            }
          }
        } else if (pType === "PLAYER_STATE" && payload?.player?.id) {
          const spid = payload.player.id;
          for (let i = this.p2pRelayOutbox.length - 1; i >= 0; i--) {
            const item = this.p2pRelayOutbox[i];
            if (item.targetPeerId === targetPeerId && item.payload?.type === "PLAYER_STATE" && item.payload?.player?.id === spid) {
              this.p2pRelayOutbox.splice(i, 1);
            }
          }
        }
        this.p2pRelayOutbox.push({ targetPeerId, payload });
        const urgent = pType !== "WORLD_SYNC" && pType !== "PLAYER_STATE";
        if (urgent) {
          this._flushP2PHostRelayOutbox(roomCode, host).catch(() => {});
        } else if (!this.p2pRelayFlushTimer) {
          this.p2pRelayFlushTimer = setTimeout(() => {
            this.p2pRelayFlushTimer = null;
            this._flushP2PHostRelayOutbox(roomCode, host).catch(() => {});
          }, 28);
        }
      }
      // Also mirror over MQTT relay if no server URL and MQTT sockets are open
      if ((!httpBase.ok || !httpBase.baseUrl) && Array.isArray(this.p2pMqttSockets) && this.p2pMqttSockets.length > 0) {
        const topic = this._mqttRelayH2CTopic(roomCode, targetPeerId);
        const raw = JSON.stringify(payload);
        for (const ws of this.p2pMqttSockets) {
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(this._mqttEncodePublish(topic, raw, false));
              break;
            } catch {
            }
          }
        }
      }
    });

    if (httpBase.ok && httpBase.baseUrl) {
      this._runP2PHostRelayPollLoop(roomCode, host, httpBase.baseUrl);
    }
  }

  async _flushP2PHostRelayOutbox(roomCode, host) {
    if (!this.p2pRelayActive || this.p2pHost !== host || !isSixDigitCode(roomCode)) return;
    if (this.p2pRelayFlushTimer) {
      clearTimeout(this.p2pRelayFlushTimer);
      this.p2pRelayFlushTimer = null;
    }
    if (this.p2pRelayFlushing) return;
    if (this.p2pRelayOutbox.length === 0) return;

    const httpBase = this.getHttpBaseResult();
    if (!httpBase.ok || !httpBase.baseUrl) {
      this.p2pRelayOutbox = [];
      return;
    }

    this.p2pRelayFlushing = true;
    const batch = this.p2pRelayOutbox.splice(0, this.p2pRelayOutbox.length);
    try {
      const res = await fetch(`${httpBase.baseUrl}/api/p2p/relay`, {
        method: "POST",
        credentials: this._isCrossOriginUrl(httpBase.baseUrl) ? "omit" : "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          code: roomCode,
          role: "host",
          peerId: host.hostId,
          messages: batch,
        }),
      });
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data.events)) {
          for (const ev of data.events) {
            if (ev?.peerId && ev?.msg && this.p2pHost === host) {
              host.receiveRelayMessage(ev.peerId, ev.msg);
            }
          }
        }
      }
    } catch {
    } finally {
      this.p2pRelayFlushing = false;
      if (this.p2pRelayActive && this.p2pHost === host && this.p2pRelayOutbox.length > 0 && !this.p2pRelayFlushTimer) {
        this.p2pRelayFlushTimer = setTimeout(() => {
          this.p2pRelayFlushTimer = null;
          this._flushP2PHostRelayOutbox(roomCode, host).catch(() => {});
        }, 28);
      }
    }
  }

  async _runP2PHostRelayPollLoop(roomCode, host, baseUrl) {
    while (this.p2pRelayActive && this.p2pHost === host && this.transportMode === "p2p_host") {
      const abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      this.p2pRelayPollAbort = abortCtrl;
      try {
        const isHidden = typeof document !== "undefined" && document.hidden;
        if (isHidden) {
          await new Promise((r) => setTimeout(r, 900));
          if (!this.p2pRelayActive || this.p2pHost !== host) break;
        }
        const waitMs = isHidden ? 3500 : host.hasRelayPeers() ? 1200 : 1800;
        const res = await fetch(
          `${baseUrl}/api/p2p/relay/${encodeURIComponent(roomCode)}/poll?role=host&peerId=${encodeURIComponent(host.hostId)}&wait=${waitMs}`,
          {
            method: "GET",
            credentials: this._isCrossOriginUrl(baseUrl) ? "omit" : "same-origin",
            cache: "no-store",
            signal: abortCtrl ? abortCtrl.signal : undefined,
          }
        );
        if (!this.p2pRelayActive || this.p2pHost !== host) break;
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.ok && Array.isArray(data.events)) {
            for (const ev of data.events) {
              if (ev?.peerId && ev?.msg && this.p2pHost === host) {
                host.receiveRelayMessage(ev.peerId, ev.msg);
              }
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 350));
        }
      } catch (err) {
        if (!this.p2pRelayActive || this.p2pHost !== host) break;
        if (err && err.name === "AbortError") break;
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  async startP2PHost(playerName, heroId, mapId = "classic") {
    this._assertHeroAuthorized(heroId);
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
      mapId,
      founderUnlocked: this.founderUnlocked,
      onLocalEvent: (ev) => this._handleIncomingMessage(ev),
      onPeersChanged: () => this.emit({ type: "P2P_PEERS_CHANGED" }),
    });
    this.p2pHost = host;
    this.connected = true;
    host.start();
    this._ensureP2PBroadcastChannel();

    const desiredSixDigit = host.room.id;
    let inviteCode = desiredSixDigit;
    let manualOfferCode = "";
    let hasServerSignaling = false;
    let inviteError = "";
    try {
      const invite = await host.createInviteOffer();
      const rawCode = invite?.code || "";
      manualOfferCode = rawCode;
      this.p2pLatestRawOffer = rawCode;
      const [shortCode, mqttOk] = rawCode
        ? await Promise.all([
            this._postP2PSignal("offer", rawCode, undefined, desiredSixDigit),
            this._startMqttSignalingHost(desiredSixDigit, rawCode),
          ])
        : [null, false];
      if (shortCode) {
        hasServerSignaling = true;
        this.p2pServerShortCode = shortCode;
        inviteCode = shortCode;
        this._startP2PAnswerPollLoop(shortCode);
        this._startP2PHostRelay(shortCode, host);
        if (shortCode !== desiredSixDigit && rawCode) {
          await this._startMqttSignalingHost(shortCode, rawCode);
        }
      } else {
        if (mqttOk) hasServerSignaling = true;
        this._startP2PAnswerPollLoop(desiredSixDigit);
        this._startP2PHostRelay(desiredSixDigit, host);
      }
    } catch (err) {
      inviteError = err?.message || "Chưa tạo được mã mời P2P tự động.";
    }
    this.emit({ type: "WS_OPEN", transport: "p2p_host" });
    this.emit({
      type: "P2P_INVITE_READY",
      inviteCode,
      manualOfferCode,
      hasServerSignaling,
      inviteError,
    });
    return { mode: "p2p", room: this.room, inviteCode, manualOfferCode, hasServerSignaling, inviteError };
  }

  async createP2PInviteOffer() {
    if (!this.p2pHost || this.transportMode !== "p2p_host") {
      throw new Error("Bạn chưa tạo phòng P2P.");
    }
    const desiredSixDigit = this.p2pServerShortCode || this.p2pHost.room.id;
    const raw = await this.p2pHost.createInviteOffer();
    const rawCode = raw?.code || "";
    if (rawCode) this.p2pLatestRawOffer = rawCode;
    const [shortCode, mqttOk] = rawCode
      ? await Promise.all([
          this._postP2PSignal("offer", rawCode, undefined, desiredSixDigit),
          this._publishMqttOffer(desiredSixDigit, rawCode),
        ])
      : [null, false];
    if (shortCode) {
      this.p2pServerShortCode = shortCode;
      this._startP2PAnswerPollLoop(shortCode);
      if (shortCode !== desiredSixDigit && rawCode) {
        await this._publishMqttOffer(shortCode, rawCode);
      }
    }
    return {
      ...raw,
      rawCode,
      code: shortCode || desiredSixDigit,
      hasServerSignaling: Boolean(shortCode || mqttOk),
    };
  }

  async acceptP2PAnswer(answerInput) {
    if (!this.p2pHost || this.transportMode !== "p2p_host") {
      throw new Error("Bạn chưa tạo phòng P2P.");
    }
    const cleanInput = String(answerInput || "").trim().replace(/\s+/g, "");
    let resolvedAnswer = cleanInput;
    if (isSixDigitCode(cleanInput)) {
      const fetched = await this._fetchP2PSignal(cleanInput);
      if (fetched.kind === "offer") {
        throw new Error("Mã 6 số này là mã mời phòng, không phải Mã Phản Hồi từ bạn bè.");
      }
      if (!fetched.payload) {
        throw new Error(`Không tìm thấy Mã Phản Hồi ${cleanInput} hoặc mã đã hết hạn.`);
      }
      resolvedAnswer = fetched.payload;
    }
    return await this.p2pHost.acceptJoinAnswer(resolvedAnswer);
  }

  async _activateP2PPeerRelay(roomCode, peer) {
    if (!peer || peer.destroyed || this.p2pPeer !== peer || this.transportMode !== "p2p_peer") return;
    if (this.p2pRelayActive && this.p2pRelayRoomCode === roomCode) return;
    if (!isSixDigitCode(roomCode)) return;

    this.p2pRelayActive = true;
    this.p2pRelayRoomCode = roomCode;
    const httpBase = this.getHttpBaseResult();

    if (httpBase.ok && httpBase.baseUrl) {
      peer.setRelaySender((payload) => {
        if (!this.p2pRelayActive || this.p2pPeer !== peer) return;
        this.p2pRelayOutbox.push(payload);
        if (CRITICAL_HTTP_TYPES.has(payload?.type) || payload?.type === "P2P_HELLO" || payload?.type === "P2P_JOIN_ACK" || payload?.type === "P2P_MATCH_ACK") {
          this._flushP2PPeerRelayOutbox(roomCode, peer, httpBase.baseUrl).catch(() => {});
        } else if (!this.p2pRelayFlushTimer) {
          this.p2pRelayFlushTimer = setTimeout(() => {
            this.p2pRelayFlushTimer = null;
            this._flushP2PPeerRelayOutbox(roomCode, peer, httpBase.baseUrl).catch(() => {});
          }, 28);
        }
      });
      this._runP2PPeerRelayPollLoop(roomCode, peer, httpBase.baseUrl);
      this.emit({ type: "P2P_RELAY_ACTIVE", roomId: roomCode, mode: "http" });
      return;
    }

    // Secondary MQTT relay when opened via standalone .html (no backend URL) on blocked iOS WebViews
    const conns = await this._openAllMqttConnections(4500);
    if (conns.length === 0 || peer.destroyed || this.p2pPeer !== peer) return;
    const conn = conns[0];
    for (let i = 1; i < conns.length; i++) this._cleanupSocket(conns[i].ws);
    this.p2pPeerMqttConn = conn;
    const h2cTopic = this._mqttRelayH2CTopic(roomCode, peer.playerId);
    const c2hTopic = this._mqttRelayC2HTopic(roomCode);
    conn.onPackets = (packets) => {
      for (const pkt of packets) {
        if (pkt.type === 3 && pkt.topic === h2cTopic && pkt.payload) {
          try {
            const parsed = JSON.parse(pkt.payload);
            peer.receiveRelayMessage(parsed);
          } catch {
          }
        }
      }
    };
    try {
      conn.ws.send(this._mqttEncodeSubscribe(1, h2cTopic));
    } catch {
    }
    peer.setRelaySender((payload) => {
      if (!this.p2pRelayActive || this.p2pPeer !== peer || !conn.ws || conn.ws.readyState !== WebSocket.OPEN) return;
      try {
        conn.ws.send(this._mqttEncodePublish(c2hTopic, JSON.stringify({ peerId: peer.playerId, msg: payload }), false));
      } catch {
      }
    });
    this.emit({ type: "P2P_RELAY_ACTIVE", roomId: roomCode, mode: "mqtt" });
  }

  async _flushP2PPeerRelayOutbox(roomCode, peer, baseUrl) {
    if (!this.p2pRelayActive || this.p2pPeer !== peer || !peer.playerId) return;
    if (this.p2pRelayFlushTimer) {
      clearTimeout(this.p2pRelayFlushTimer);
      this.p2pRelayFlushTimer = null;
    }
    if (this.p2pRelayFlushing) return;
    if (this.p2pRelayOutbox.length === 0) return;

    this.p2pRelayFlushing = true;
    const batch = coalesceCoopOutbox(this.p2pRelayOutbox.splice(0, this.p2pRelayOutbox.length));
    try {
      const res = await fetch(`${baseUrl}/api/p2p/relay`, {
        method: "POST",
        credentials: this._isCrossOriginUrl(baseUrl) ? "omit" : "same-origin",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          code: roomCode,
          role: "peer",
          peerId: peer.playerId,
          messages: batch,
        }),
      });
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data.events)) {
          for (const ev of data.events) {
            if (this.p2pPeer === peer) {
              peer.receiveRelayMessage(ev);
            }
          }
        }
      }
    } catch {
    } finally {
      this.p2pRelayFlushing = false;
      if (this.p2pRelayActive && this.p2pPeer === peer && this.p2pRelayOutbox.length > 0 && !this.p2pRelayFlushTimer) {
        this.p2pRelayFlushTimer = setTimeout(() => {
          this.p2pRelayFlushTimer = null;
          this._flushP2PPeerRelayOutbox(roomCode, peer, baseUrl).catch(() => {});
        }, 28);
      }
    }
  }

  async _runP2PPeerRelayPollLoop(roomCode, peer, baseUrl) {
    while (this.p2pRelayActive && this.p2pPeer === peer && !peer.destroyed) {
      const abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      this.p2pRelayPollAbort = abortCtrl;
      try {
        const isHidden = typeof document !== "undefined" && document.hidden;
        if (isHidden) {
          await new Promise((r) => setTimeout(r, 900));
          if (!this.p2pRelayActive || this.p2pPeer !== peer || peer.destroyed) break;
        }
        const waitMs = isHidden ? 3500 : 1500;
        const res = await fetch(
          `${baseUrl}/api/p2p/relay/${encodeURIComponent(roomCode)}/poll?role=peer&peerId=${encodeURIComponent(peer.playerId)}&wait=${waitMs}`,
          {
            method: "GET",
            credentials: this._isCrossOriginUrl(baseUrl) ? "omit" : "same-origin",
            cache: "no-store",
            signal: abortCtrl ? abortCtrl.signal : undefined,
          }
        );
        if (!this.p2pRelayActive || this.p2pPeer !== peer || peer.destroyed) break;
        if (res.status === 404) {
          await new Promise((r) => setTimeout(r, 450));
          continue;
        }
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.ok && Array.isArray(data.events)) {
            for (const ev of data.events) {
              if (this.p2pPeer === peer) {
                peer.receiveRelayMessage(ev);
              }
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 350));
        }
      } catch (err) {
        if (!this.p2pRelayActive || this.p2pPeer !== peer || peer.destroyed) break;
        if (err && err.name === "AbortError") break;
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  async joinP2PWithOffer(offerInput, playerName, heroId, opts = {}) {
    this._assertHeroAuthorized(heroId);
    const cleanInput = String(offerInput || "").trim().replace(/\s+/g, "");
    let resolvedOffer = cleanInput;
    let usedShortOfferCode;
    let usedMqtt = false;
    if (isSixDigitCode(cleanInput)) {
      let fetched = opts?.preFetched || (await this._fetchP2PSignal(cleanInput, { optional: true }));
      if (!fetched) {
        fetched = await this._lookupLocalOfferViaChannel(cleanInput);
      }
      if (!fetched) {
        fetched = await this._lookupMqttOffer(cleanInput, 5500);
      }
      if (!fetched) {
        throw new Error(`Không tìm thấy phòng 6 số ${cleanInput} hoặc mã đã hết hạn.`);
      }
      if (fetched.kind === "answer") {
        throw new Error("Mã 6 số này là Mã Phản Hồi P2P, không phải Mã Chia Sẻ phòng!");
      }
      if (!fetched.payload) {
        throw new Error(`Không tìm thấy Mã Chia Sẻ ${cleanInput} hoặc mã đã hết hạn.`);
      }
      resolvedOffer = fetched.payload;
      usedShortOfferCode = cleanInput;
      usedMqtt = Boolean(fetched.mqttSignaling);
    }

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
    const rawAnswer = await peer.createAnswerFromOffer(resolvedOffer, playerName, heroId);
    if (peer.playerId) {
      this.playerId = peer.playerId;
    }

    const relayCode = usedShortOfferCode || "";
    const isRelayOffer = peer.rtcUnavailable || /^AH1R:/i.test(resolvedOffer) || /^AH1R:/i.test(rawAnswer || "");

    const shortAnswer = rawAnswer
      ? await this._postP2PSignal("answer", rawAnswer, usedShortOfferCode)
      : null;

    let mqttAnswerSent = false;
    if (rawAnswer && usedShortOfferCode && (!shortAnswer || usedMqtt)) {
      mqttAnswerSent = await this._publishMqttAnswer(usedShortOfferCode, rawAnswer);
    }

    let sentLocalChannel = false;
    if (rawAnswer && usedShortOfferCode && typeof BroadcastChannel !== "undefined") {
      try {
        const ch = new BroadcastChannel("arena_hero_p2p_v1");
        ch.postMessage({ kind: "P2P_ANSWER_DATA", forCode: usedShortOfferCode, payload: rawAnswer });
        ch.close();
        sentLocalChannel = true;
      } catch {
      }
    }

    if (isSixDigitCode(relayCode)) {
      if (isRelayOffer) {
        this._activateP2PPeerRelay(relayCode, peer).catch(() => {});
      } else {
        // Automatic iPhone Messenger / WKWebView / strict NAT fallback:
        // If WebRTC DataChannel has not opened within 2.4s, seamlessly bridge over P2P relay!
        this.p2pRelayFallbackTimer = setTimeout(() => {
          this.p2pRelayFallbackTimer = null;
          if (this.p2pPeer === peer && !peer.destroyed && !peer.isDirectOpen() && !peer.joinedRoom) {
            this._activateP2PPeerRelay(relayCode, peer).catch(() => {});
          }
        }, 2400);
      }
    }

    const answerCode = shortAnswer || rawAnswer;
    return {
      answerCode,
      rawAnswerCode: rawAnswer,
      usedShortOfferCode,
      relayFallbackActive: isRelayOffer,
      autoPairedViaMqtt: Boolean(mqttAnswerSent && usedShortOfferCode),
      autoPairedViaServer: Boolean((shortAnswer || mqttAnswerSent || isRelayOffer) && usedShortOfferCode),
      autoPairedViaLocal: sentLocalChannel,
    };
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

  async createRoom(playerName, heroId, mapId = "classic") {
    this._assertHeroAuthorized(heroId);
    if (this.transportMode === "p2p_host" && this.p2pHost && this.room) {
      return { mode: "p2p", room: this.room, inviteCode: "" };
    }

    const protocol = typeof window !== "undefined" ? window.location?.protocol || "http:" : "http:";
    const hasCustomServer = Boolean(this._getEffectiveOverrideUrl());
    const localFile = isLocalFileProtocol(protocol);
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;

    if (!offline && !(localFile && !hasCustomServer)) {
      try {
        await this._ensureSend({
          type: "CREATE_ROOM",
          playerName,
          heroId,
          mapId: mapId === "blood_citadel" || mapId === "inferno_ash" || mapId === "frozen_tomb" ? mapId : "classic",
          founderToken: this.founderToken || undefined,
        });
        return { mode: "server", room: this.room };
      } catch (err) {
        console.info("Co-op server unavailable during CREATE_ROOM, falling back to Direct P2P:", err?.message || err);
      }
    }

    return await this.startP2PHost(playerName, heroId, mapId);
  }

  setMap(mapId) {
    this.send({
      type: "SET_MAP",
      mapId: mapId === "blood_citadel" || mapId === "inferno_ash" || mapId === "frozen_tomb" ? mapId : "classic",
    });
  }

  async joinRoom(roomId, playerName, heroId) {
    this._assertHeroAuthorized(heroId);
    const classified = classifyJoinCode(roomId);
    if (classified.kind === "empty") {
      throw new Error("Vui lòng nhập mã 6 số hoặc mã mời P2P (AH1...).");
    }
    if (classified.kind === "p2p_signal") {
      const p2pRes = await this.joinP2PWithOffer(classified.normalized, playerName, heroId);
      return { mode: "p2p", ...p2pRes };
    }

    if (isSixDigitCode(classified.normalized)) {
      const localChannelOffer = await this._lookupLocalOfferViaChannel(classified.normalized, 180);
      if (localChannelOffer && localChannelOffer.payload) {
        const p2pRes = await this.joinP2PWithOffer(classified.normalized, playerName, heroId, { preFetched: localChannelOffer });
        return { mode: "p2p", ...p2pRes };
      }
    }

    const httpBase = this.getHttpBaseResult();
    let mqttPromise = null;
    let serverResolved = false;
    if (isSixDigitCode(classified.normalized)) {
      if (httpBase.ok) {
        mqttPromise = new Promise((resolve) => setTimeout(resolve, 600)).then(() =>
          serverResolved ? null : this._lookupMqttOffer(classified.normalized, 4800)
        );
        const [roomCheckRes, p2pSignal] = await Promise.all([
          fetch(`${httpBase.baseUrl}/api/rooms/${encodeURIComponent(classified.normalized)}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          this._fetchP2PSignal(classified.normalized, { optional: true }),
        ]);

        if (roomCheckRes?.exists) {
          serverResolved = true;
          await this._ensureSend({
            type: "JOIN_ROOM",
            roomId: classified.normalized,
            playerName,
            heroId,
            founderToken: this.founderToken || undefined,
          });
          return { mode: "server", room: this.room };
        }

        if (p2pSignal) {
          serverResolved = true;
          if (p2pSignal.kind === "answer") {
            throw new Error("Mã 6 số này là Mã Phản Hồi P2P. Chỉ Chủ phòng mới dán mã này khi ghép thủ công!");
          }
          if (p2pSignal.kind === "offer" && p2pSignal.payload) {
            const p2pRes = await this.joinP2PWithOffer(classified.normalized, playerName, heroId, { preFetched: p2pSignal });
            return { mode: "p2p", ...p2pRes };
          }
        }
      }

      const mqttOffer = mqttPromise ? await mqttPromise : await this._lookupMqttOffer(classified.normalized, 5000);
      if (mqttOffer && mqttOffer.payload) {
        const p2pRes = await this.joinP2PWithOffer(classified.normalized, playerName, heroId, { preFetched: mqttOffer });
        return { mode: "p2p", ...p2pRes };
      }
    }

    const protocol = typeof window !== "undefined" ? window.location?.protocol || "http:" : "http:";
    const hasCustomServer = Boolean(this._getEffectiveOverrideUrl());
    if (isLocalFileProtocol(protocol) && !hasCustomServer) {
      throw new Error(
        "Không tìm thấy phòng 6 số này qua mạng. Hãy kiểm tra lại mã 6 số, mở cùng link WiFi/Server hoặc mở mục Ghép thủ công (AH1...) khi mất Internet."
      );
    }

    try {
      await this._ensureSend({
        type: "JOIN_ROOM",
        roomId: classified.normalized,
        playerName,
        heroId,
        founderToken: this.founderToken || undefined,
      });
      return { mode: "server", room: this.room };
    } catch (err) {
      throw new Error(
        err?.message ||
          "Không thể tìm thấy phòng mã 6 số. Hãy kiểm tra lại mã phòng từ Chủ phòng."
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
    if (heroId === "thien" && !this.founderUnlocked) {
      return;
    }
    this.send({
      type: "SELECT_HERO",
      heroId,
      founderToken: heroId === "thien" ? this.founderToken || undefined : undefined,
    });
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
