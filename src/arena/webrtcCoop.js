import { computeCoopWaveReward, MAX_WAVES, verifyFounderPinInput } from "./combatLogic";

const MAX_PLAYERS = 4;
const RTC_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];
const RTC_CONFIG = {
  iceServers: RTC_ICE_SERVERS,
  iceCandidatePoolSize: 2,
  bundlePolicy: "max-bundle",
};
const VOLATILE_P2P_TYPES = new Set([
  "SYNC_PLAYER",
  "PLAYER_STATE",
  "WORLD_SNAPSHOT",
  "WORLD_SYNC",
]);
const DC_BACKPRESSURE_LIMIT = 65536;

export function isWebRTCSupported() {
  return typeof RTCPeerConnection !== "undefined";
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64u) {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encodeSignalPayload(obj) {
  const json = JSON.stringify(obj);
  const rawBytes = new TextEncoder().encode(json);
  if (obj && obj.relay === true && !obj.sdp) {
    return `AH1R:${bytesToBase64Url(rawBytes)}`;
  }
  if (typeof CompressionStream !== "undefined") {
    try {
      const cs = new CompressionStream("gzip");
      const outPromise = new Response(cs.readable).arrayBuffer();
      const writer = cs.writable.getWriter();
      writer.write(rawBytes);
      writer.close();
      const compressed = new Uint8Array(await outPromise);
      return `AH1G:${bytesToBase64Url(compressed)}`;
    } catch {
      // Fallback to uncompressed UTF-8 base64url
    }
  }
  return `AH1J:${bytesToBase64Url(rawBytes)}`;
}

export async function decodeSignalPayload(rawText) {
  const cleaned = String(rawText || "").trim().replace(/\s+/g, "");
  if (!cleaned) {
    throw new Error("Mã kết nối P2P đang trống.");
  }
  if (/^AH1G:/i.test(cleaned)) {
    const bytes = base64UrlToBytes(cleaned.slice(5));
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Trình duyệt không hỗ trợ giải nén mã P2P.");
    }
    const ds = new DecompressionStream("gzip");
    const outPromise = new Response(ds.readable).arrayBuffer();
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const out = new Uint8Array(await outPromise);
    return JSON.parse(new TextDecoder().decode(out));
  }
  if (/^AH1[JR]:/i.test(cleaned)) {
    const bytes = base64UrlToBytes(cleaned.slice(5));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  throw new Error("Mã kết nối P2P không hợp lệ. Hãy sao chép nguyên vẹn mã bắt đầu bằng AH1...");
}

function waitForIceComplete(pc, timeoutMs = 2600) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    let softTimer = null;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (softTimer) clearTimeout(softTimer);
      pc.removeEventListener("icegatheringstatechange", onState);
      pc.removeEventListener("icecandidate", onCand);
      resolve();
    };
    const onState = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    const onCand = (ev) => {
      if (!ev.candidate) {
        finish();
        return;
      }
      const candStr = String(ev.candidate.candidate || "");
      const isRelayOrSrflx =
        ev.candidate.type === "srflx" ||
        ev.candidate.type === "relay" ||
        /\btyp (srflx|relay)\b/.test(candStr);
      if (isRelayOrSrflx) {
        if (softTimer) clearTimeout(softTimer);
        softTimer = setTimeout(finish, 160);
      } else if (!softTimer) {
        // Give STUN up to 1250ms after first local candidate so mobile/4G peers get srflx candidates
        softTimer = setTimeout(finish, 1250);
      }
    };
    const timer = setTimeout(finish, timeoutMs);
    pc.addEventListener("icegatheringstatechange", onState);
    pc.addEventListener("icecandidate", onCand);
  });
}

function getSpawnPosition(slot, mapId = "classic") {
  const offsets = [
    { dx: -75, dy: -45 },
    { dx: 75, dy: -45 },
    { dx: -75, dy: 55 },
    { dx: 75, dy: 55 },
  ];
  const off = offsets[slot % offsets.length];
  if (mapId === "void_city") {
    return { x: 460 + off.dx, y: 3420 + off.dy };
  }
  if (mapId === "grudge_forest") {
    return { x: 460 + off.dx, y: 3560 + off.dy };
  }
  if (mapId === "frozen_tomb") {
    return { x: 480 + off.dx, y: 2490 + off.dy };
  }
  if (mapId === "blood_citadel") {
    return { x: 800 + off.dx, y: 840 + off.dy };
  }
  if (mapId === "inferno_ash") {
    return { x: 280 + off.dx, y: 1840 + off.dy };
  }
  return { x: 1000 + off.dx, y: 700 + off.dy };
}

function computePowerMultiplier(playerCount) {
  const n = Math.max(1, Math.min(MAX_PLAYERS, Math.round(playerCount)));
  return Number((1 + 0.5 * (n - 1)).toFixed(2));
}

function sanitizeName(raw, fallbackIndex = 1) {
  if (typeof raw !== "string") return `Chiến Binh ${fallbackIndex}`;
  const cleaned = raw.trim().replace(/\s+/g, " ").slice(0, 18);
  return cleaned || `Chiến Binh ${fallbackIndex}`;
}

function generateRandomSixDigitCode() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return String(arr[0] % 1000000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

export class P2PRoomHost {
  constructor({ hostName, heroId, mapId = "classic", founderUnlocked = false, onLocalEvent, onPeersChanged }) {
    this.hostId = `p2p_${Math.random().toString(36).slice(2, 10)}`;
    this.founderUnlocked = Boolean(founderUnlocked);
    this.founderVerifiedPeers = new Set();
    if (this.founderUnlocked) this.founderVerifiedPeers.add(this.hostId);
    this.onLocalEvent = onLocalEvent;
    this.onPeersChanged = onPeersChanged;
    this.relaySender = null;
    this.peers = new Map(); // peerId -> { pc, dc, fastDc, relayActive, state: 'pending'|'open'|'closed', playerId, joinedAcked, matchStartedAcked }
    this.pendingPeerCounter = 0;
    this.syncRetryTimer = null;

    const safeMapId =
      mapId === "blood_citadel" || mapId === "inferno_ash" || mapId === "frozen_tomb" || mapId === "grudge_forest" || mapId === "void_city"
        ? mapId
        : "classic";
    const safeHeroId = heroId === "thien" && !this.founderUnlocked ? "eohyen" : heroId || "eohyen";
    const pos = getSpawnPosition(0, safeMapId);
    const codeSuffix = generateRandomSixDigitCode();
    this.room = {
      id: codeSuffix,
      isP2P: true,
      status: "LOBBY",
      mapId: safeMapId,
      hostId: this.hostId,
      players: new Map([
        [
          this.hostId,
          {
            id: this.hostId,
            name: sanitizeName(hostName, 1),
            heroId: safeHeroId,
            isHost: true,
            ready: true,
            joinedRoom: true,
            slot: 0,
            alive: true,
            readyNextWave: true,
            totalDamage: 0,
            x: pos.x,
            y: pos.y,
            facing: 0,
            hp: 960,
            maxHp: 960,
            shield: 0,
            level: 1,
            moveSpeedFactor: 0,
            walkCyclePhase: 0,
            attackAnimTimer: 0,
            attackAnimAngle: 0,
            attackSwingParity: 1,
            weaponSkillTimer: 0,
            weaponSkillDur: 0.46,
            weaponCritTimer: 0,
            bowRecoilTimer: 0,
            buffs: {},
          },
        ],
      ]),
      matchPlayerCount: 1,
      powerMultiplier: 1,
      wave: 1,
      waveTotal: 10,
      waveSpawned: 0,
      waveKilled: 0,
      waveCleared: false,
      waveStartTime: Date.now(),
      matchNonce: 0,
      enemies: new Map(),
    };
  }

  setFounderUnlocked(unlocked) {
    this.founderUnlocked = Boolean(unlocked);
    if (this.founderUnlocked) this.founderVerifiedPeers.add(this.hostId);
    else this.founderVerifiedPeers.delete(this.hostId);
  }

  start() {
    this.sendToPlayer(this.hostId, { type: "CONNECTED", playerId: this.hostId });
    this.sendToPlayer(this.hostId, {
      type: "ROOM_JOINED",
      playerId: this.hostId,
      room: this.serializeRoom(),
    });
  }

  getNextFreeSlot() {
    const used = new Set();
    for (const p of this.room.players.values()) used.add(p.slot);
    for (let s = 0; s < MAX_PLAYERS; s++) {
      if (!used.has(s)) return s;
    }
    return this.room.players.size;
  }

  serializeRoom() {
    const members = Array.from(this.room.players.values())
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({
        id: p.id,
        name: p.name,
        heroId: p.heroId,
        isHost: p.isHost,
        ready: p.ready,
        joinedRoom: p.isHost ? true : Boolean(p.joinedRoom),
        slot: p.slot,
        alive: p.alive,
        readyNextWave: p.readyNextWave,
        totalDamage: p.totalDamage,
        hp: p.hp,
        maxHp: p.maxHp,
        shield: p.shield,
        level: p.level,
      }));
    const displayCount = this.room.status === "PLAYING" ? this.room.matchPlayerCount : Math.max(1, members.length);
    return {
      roomId: this.room.id,
      isP2P: true,
      status: this.room.status,
      mapId: this.room.mapId || "classic",
      hostId: this.room.hostId,
      maxPlayers: MAX_PLAYERS,
      playerCount: members.length,
      matchPlayerCount: this.room.matchPlayerCount,
      powerMultiplier: computePowerMultiplier(displayCount),
      wave: this.room.wave,
      waveTotal: this.room.waveTotal,
      waveKilled: this.room.waveKilled,
      waveCleared: this.room.waveCleared,
      members,
    };
  }

  setRelaySender(fn) {
    this.relaySender = typeof fn === "function" ? fn : null;
  }

  hasRelayPeers() {
    for (const peer of this.peers.values()) {
      if (peer && peer.state !== "closed" && peer.relayActive) return true;
    }
    return false;
  }

  receiveRelayMessage(peerId, msg) {
    if (!peerId || !msg || typeof msg !== "object") return;
    let peer = this.peers.get(peerId);
    if (!peer) {
      if (this.room.players.size >= MAX_PLAYERS && !this.room.players.has(peerId)) {
        if (this.relaySender) {
          this.relaySender(peerId, { type: "ROOM_ERROR", message: "Phòng đã đủ tối đa 4 người chơi." });
        }
        return;
      }
      peer = {
        pc: null,
        dc: null,
        fastDc: null,
        relayActive: true,
        state: "open",
        playerId: peerId,
        pendingQueue: [],
        disconnectTimer: null,
        joinedAcked: false,
        matchStartedAcked: false,
      };
      this.peers.set(peerId, peer);
      this.onPeersChanged?.();
      this.sendToPlayer(peerId, { type: "CONNECTED", playerId: peerId });
    } else if (!peer.relayActive) {
      peer.relayActive = true;
      if (peer.state === "pending") peer.state = "open";
      if (peer.disconnectTimer) {
        clearTimeout(peer.disconnectTimer);
        peer.disconnectTimer = null;
      }
      if (this.relaySender && peer.pendingQueue.length > 0) {
        while (peer.pendingQueue.length > 0) {
          const queued = peer.pendingQueue.shift();
          try {
            const parsed = typeof queued === "string" ? JSON.parse(queued) : queued;
            this.relaySender(peerId, parsed);
          } catch {
          }
        }
      }
      this.onPeersChanged?.();
    }
    this.handleMessage(peerId, msg);
  }

  sendToPlayer(playerId, data, preSerializedRaw = null) {
    if (playerId === this.hostId) {
      this.onLocalEvent?.(data);
      return;
    }
    const peer = this.peers.get(playerId);
    if (!peer || peer.state === "closed") return;

    const isVolatile = VOLATILE_P2P_TYPES.has(data?.type);
    const useFastDc =
      isVolatile && peer.fastDc && peer.fastDc.readyState === "open";
    const targetDc = useFastDc ? peer.fastDc : peer.dc && peer.dc.readyState === "open" ? peer.dc : null;

    if (targetDc) {
      if (
        isVolatile &&
        typeof targetDc.bufferedAmount === "number" &&
        targetDc.bufferedAmount > DC_BACKPRESSURE_LIMIT
      ) {
        // Drop stale volatile snapshot under congestion instead of causing bufferbloat lag
        return;
      }
      const raw = preSerializedRaw || JSON.stringify(data);
      try {
        targetDc.send(raw);
        return;
      } catch {
        // Fall through to relay or pending queue if DataChannel send throws
      }
    }

    if (peer.relayActive && this.relaySender) {
      try {
        this.relaySender(playerId, data);
        return;
      } catch {
      }
    }

    if (peer.pendingQueue.length < 32) {
      peer.pendingQueue.push(preSerializedRaw || JSON.stringify(data));
    }
  }

  broadcastRoom(data, excludePlayerId) {
    // Send to remote peers FIRST so synchronous local host reactions (e.g. WAVE_STARTED -> SPAWN_ENEMIES)
    // cannot overtake the outer broadcast packet on peer data channels.
    let sendHost = false;
    let preSerialized = null;
    for (const pid of this.room.players.keys()) {
      if (excludePlayerId && pid === excludePlayerId) continue;
      if (pid === this.hostId) {
        sendHost = true;
        continue;
      }
      const peer = this.peers.get(pid);
      if (peer && peer.state !== "closed") {
        if (!preSerialized && (!peer.relayActive || (peer.dc && peer.dc.readyState === "open"))) {
          preSerialized = JSON.stringify(data);
        }
        this.sendToPlayer(pid, data, preSerialized);
      }
    }
    if (sendHost) {
      this.sendToPlayer(this.hostId, data);
    }
  }

  broadcastRoomUpdate() {
    this.broadcastRoom({ type: "ROOM_UPDATE", room: this.serializeRoom() });
  }

  _buildSpawnsMap() {
    const spawns = {};
    for (const p of this.room.players.values()) {
      const sp = getSpawnPosition(p.slot, this.room.mapId);
      spawns[p.id] = { x: p.x || sp.x, y: p.y || sp.y, slot: p.slot };
    }
    return spawns;
  }

  _sendActiveMatchSync(targetId) {
    if (this.room.status !== "PLAYING") return;
    this.sendToPlayer(targetId, {
      type: "MATCH_STARTED",
      room: this.serializeRoom(),
      wave: this.room.wave,
      matchNonce: this.room.matchNonce || 1,
      playerCount: this.room.matchPlayerCount,
      powerMultiplier: this.room.powerMultiplier,
      spawns: this._buildSpawnsMap(),
    });
    if (this.room.enemies.size > 0) {
      this.sendToPlayer(targetId, {
        type: "ENEMIES_SPAWNED",
        wave: this.room.wave,
        enemies: Array.from(this.room.enemies.values()),
        waveSpawned: this.room.waveSpawned,
        waveTotal: this.room.waveTotal,
      });
    }
  }

  _ensureSyncRetryLoop() {
    if (this.syncRetryTimer) return;
    this.syncRetryTimer = setInterval(() => {
      let needsRetry = false;
      for (const [pid, peer] of this.peers.entries()) {
        if (!peer || peer.state === "closed" || !this.room.players.has(pid)) continue;
        if (!peer.joinedAcked) {
          needsRetry = true;
          this.sendToPlayer(pid, {
            type: "ROOM_JOINED",
            playerId: pid,
            room: this.serializeRoom(),
          });
        }
        if (this.room.status === "PLAYING" && !peer.matchStartedAcked) {
          needsRetry = true;
          this._sendActiveMatchSync(pid);
        }
      }
      if (!needsRetry && this.syncRetryTimer) {
        clearInterval(this.syncRetryTimer);
        this.syncRetryTimer = null;
      }
    }, 450);
  }

  async createInviteOffer() {
    if (this.room.players.size >= MAX_PLAYERS) {
      throw new Error("Phòng đã đủ tối đa 4 người chơi.");
    }
    const slotId = `p2p_m_${++this.pendingPeerCounter}_${Math.random().toString(36).slice(2, 6)}`;

    const makeRelayOnlyOffer = async () => {
      this.peers.set(slotId, {
        pc: null,
        dc: null,
        fastDc: null,
        relayActive: true,
        state: "pending",
        playerId: slotId,
        pendingQueue: [],
        disconnectTimer: null,
        joinedAcked: false,
        matchStartedAcked: false,
      });
      const code = await encodeSignalPayload({
        v: 1,
        k: "O",
        relay: true,
        pid: slotId,
        rid: this.room.id,
      });
      return { inviteId: slotId, code, relayOnly: true };
    };

    if (typeof RTCPeerConnection === "undefined") {
      return await makeRelayOnlyOffer();
    }

    let pc;
    let dc;
    let fastDc = null;
    try {
      pc = new RTCPeerConnection(RTC_CONFIG);
      dc = pc.createDataChannel("arena-coop", { ordered: true });
      const supportsDualDc = typeof dc?.bufferedAmount === "number" && typeof dc?.label === "string";
      if (supportsDualDc) {
        try {
          fastDc = pc.createDataChannel("arena-coop-fast", { ordered: false, maxRetransmits: 0 });
        } catch {
          fastDc = null;
        }
      }
    } catch {
      return await makeRelayOnlyOffer();
    }

    const peerRecord = {
      pc,
      dc,
      fastDc,
      relayActive: false,
      state: "pending",
      playerId: slotId,
      pendingQueue: [],
      disconnectTimer: null,
      joinedAcked: false,
      matchStartedAcked: false,
    };
    this.peers.set(slotId, peerRecord);

    const onDisconnect = () => {
      if (peerRecord.state === "closed") return;
      if (peerRecord.relayActive) {
        // Keep relay peer connected even if direct WebRTC ICE failed/closed (common in iPhone Messenger)
        try { peerRecord.fastDc?.close(); } catch {}
        try { peerRecord.dc?.close(); } catch {}
        try { peerRecord.pc?.close(); } catch {}
        peerRecord.fastDc = null;
        peerRecord.dc = null;
        peerRecord.pc = null;
        return;
      }
      peerRecord.state = "closed";
      if (peerRecord.disconnectTimer) {
        clearTimeout(peerRecord.disconnectTimer);
        peerRecord.disconnectTimer = null;
      }
      this.peers.delete(slotId);
      if (this.room.players.has(slotId)) {
        this.room.players.delete(slotId);
        this.broadcastRoom({
          type: "PLAYER_LEFT",
          playerId: slotId,
          newHostId: this.hostId,
          room: this.serializeRoom(),
        });
        this.checkAllPlayersDead();
      }
      this.onPeersChanged?.();
    };

    const handleOpen = () => {
      if (peerRecord.state === "closed") return;
      peerRecord.state = "open";
      if (peerRecord.disconnectTimer) {
        clearTimeout(peerRecord.disconnectTimer);
        peerRecord.disconnectTimer = null;
      }
      while (peerRecord.pendingQueue.length > 0 && dc.readyState === "open") {
        const queued = peerRecord.pendingQueue.shift();
        try {
          dc.send(queued);
        } catch {
          break;
        }
      }
      this.sendToPlayer(slotId, { type: "CONNECTED", playerId: slotId });
      if (this.room.players.has(slotId)) {
        this.sendToPlayer(slotId, {
          type: "ROOM_JOINED",
          playerId: slotId,
          room: this.serializeRoom(),
        });
        if (!peerRecord.joinedAcked || (this.room.status === "PLAYING" && !peerRecord.matchStartedAcked)) {
          this._ensureSyncRetryLoop();
        }
      }
      this.onPeersChanged?.();
    };

    const handleDcMessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      this.handleMessage(slotId, msg);
    };

    dc.onmessage = handleDcMessage;
    dc.onclose = onDisconnect;
    dc.onerror = () => {};
    if (dc.readyState === "open") {
      queueMicrotask(handleOpen);
    } else {
      dc.onopen = handleOpen;
    }

    if (fastDc) {
      fastDc.onmessage = handleDcMessage;
      fastDc.onerror = () => {};
    }

    const handleRtcState = () => {
      const st = pc.connectionState;
      const iceSt = pc.iceConnectionState;
      if (st === "connected" || iceSt === "connected" || iceSt === "completed") {
        if (peerRecord.disconnectTimer) {
          clearTimeout(peerRecord.disconnectTimer);
          peerRecord.disconnectTimer = null;
        }
        if (dc.readyState === "open" && peerRecord.state !== "open") {
          handleOpen();
        }
      } else if (st === "failed" || st === "closed" || iceSt === "failed" || iceSt === "closed") {
        onDisconnect();
      } else if ((st === "disconnected" || iceSt === "disconnected") && !peerRecord.disconnectTimer) {
        peerRecord.disconnectTimer = setTimeout(() => {
          peerRecord.disconnectTimer = null;
          if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed" ||
            pc.connectionState === "closed" ||
            pc.iceConnectionState === "disconnected" ||
            pc.iceConnectionState === "failed"
          ) {
            onDisconnect();
          }
        }, 25000);
      }
    };

    pc.onconnectionstatechange = handleRtcState;
    pc.oniceconnectionstatechange = handleRtcState;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceComplete(pc, 2400);
      const localSdp = pc.localDescription?.sdp || offer?.sdp;
      if (!localSdp) {
        throw new Error("Empty local SDP");
      }
      const code = await encodeSignalPayload({
        v: 1,
        k: "O",
        pid: slotId,
        rid: this.room.id,
        sdp: localSdp,
      });
      return { inviteId: slotId, code };
    } catch {
      try { dc.close(); } catch {}
      try { fastDc?.close(); } catch {}
      try { pc.close(); } catch {}
      return await makeRelayOnlyOffer();
    }
  }

  async acceptJoinAnswer(answerCode) {
    const payload = await decodeSignalPayload(answerCode);
    if (!payload || payload.k !== "A" || (typeof payload.sdp !== "string" && payload.relay !== true)) {
      throw new Error("Đây không phải Mã Phản Hồi (Answer) từ bạn bè.");
    }
    const target =
      (payload.pid && this.peers.get(payload.pid)) ||
      Array.from(this.peers.values()).find((p) => p.state === "pending");
    if (!target) {
      throw new Error("Không tìm thấy lời mời đang chờ khớp. Hãy bấm 'Tạo Mã Mời Mới' rồi gửi lại cho bạn bè.");
    }
    if (payload.relay === true || !payload.sdp || !target.pc) {
      target.relayActive = true;
      target.state = "open";
      if (target.disconnectTimer) {
        clearTimeout(target.disconnectTimer);
        target.disconnectTimer = null;
      }
      this.onPeersChanged?.();
      return { peerId: target.playerId, relayOnly: true };
    }
    if (target.pc.signalingState === "stable") {
      return { peerId: target.playerId, alreadyAccepted: true };
    }
    await target.pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });
    return { peerId: target.playerId };
  }

  checkWaveCompletion() {
    if (this.room.status !== "PLAYING" || this.room.waveCleared) return;
    if (this.room.waveTotal <= 0 || this.room.waveSpawned < this.room.waveTotal) return;
    for (const enemy of this.room.enemies.values()) {
      if (enemy.hp > 0) return;
    }

    this.room.waveCleared = true;
    const elapsedSec = Math.max(0.5, (Date.now() - this.room.waveStartTime) / 1000);
    const reward = computeCoopWaveReward({
      wave: this.room.wave,
      elapsedSec,
      kills: this.room.waveKilled,
      maxWaves: MAX_WAVES,
    });

    for (const p of this.room.players.values()) {
      p.alive = true;
      p.readyNextWave = p.isHost;
      if (p.maxHp > 0) p.hp = p.maxHp;
    }

    this.broadcastRoom({
      type: "WAVE_COMPLETED",
      reward,
      room: this.serializeRoom(),
    });
  }

  checkAllPlayersDead() {
    if (this.room.status !== "PLAYING" || this.room.players.size === 0) return;
    for (const p of this.room.players.values()) {
      if (p.alive && p.hp > 0) return;
    }
    this.room.status = "LOBBY";
    for (const p of this.room.players.values()) {
      p.ready = p.isHost;
      p.alive = true;
    }
    this.broadcastRoom({
      type: "MATCH_OVER",
      victory: false,
      wave: this.room.wave,
      room: this.serializeRoom(),
    });
  }

  startMatch() {
    this.room.status = "PLAYING";
    this.room.matchPlayerCount = Math.max(1, this.room.players.size);
    this.room.powerMultiplier = computePowerMultiplier(this.room.matchPlayerCount);
    this.room.wave = 1;
    this.room.waveTotal = 10;
    this.room.waveSpawned = 0;
    this.room.waveKilled = 0;
    this.room.waveCleared = false;
    this.room.waveStartTime = Date.now();
    this.room.matchNonce = (this.room.matchNonce || 0) + 1;
    this.room.enemies.clear();

    for (const peer of this.peers.values()) {
      peer.matchStartedAcked = false;
    }

    const spawns = {};
    for (const p of this.room.players.values()) {
      const pos = getSpawnPosition(p.slot, this.room.mapId);
      p.alive = true;
      p.readyNextWave = false;
      p.totalDamage = 0;
      p.x = pos.x;
      p.y = pos.y;
      p.facing = 0;
      p.shield = 0;
      p.level = 1;
      spawns[p.id] = { x: pos.x, y: pos.y, slot: p.slot };
    }

    this.broadcastRoom({
      type: "MATCH_STARTED",
      room: this.serializeRoom(),
      mapId: this.room.mapId || "classic",
      wave: 1,
      matchNonce: this.room.matchNonce,
      playerCount: this.room.matchPlayerCount,
      powerMultiplier: this.room.powerMultiplier,
      spawns,
    });
    if (this.peers.size > 0) {
      this._ensureSyncRetryLoop();
    }
  }

  handleMessage(playerId, msg) {
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "PING") {
      this.sendToPlayer(playerId, { type: "PONG", ts: Date.now() });
      return;
    }

    if (msg.type === "AUTH_FOUNDER") {
      const ok = verifyFounderPinInput(msg.pin) || (playerId === this.hostId && this.founderUnlocked);
      if (ok) {
        this.founderVerifiedPeers.add(playerId);
        if (playerId === this.hostId) this.founderUnlocked = true;
        this.sendToPlayer(playerId, { type: "FOUNDER_AUTH_RESULT", unlocked: true });
      } else {
        this.sendToPlayer(playerId, { type: "FOUNDER_AUTH_RESULT", unlocked: false, message: "Mật khẩu mở khóa Thiên không chính xác." });
      }
      return;
    }

    if (msg.type === "P2P_JOIN_ACK") {
      const peer = this.peers.get(playerId);
      const player = this.room.players.get(playerId);
      if (peer) peer.joinedAcked = true;
      if (player && !player.joinedRoom) {
        player.joinedRoom = true;
        this.broadcastRoomUpdate();
      }
      return;
    }

    if (msg.type === "P2P_MATCH_ACK") {
      const peer = this.peers.get(playerId);
      if (peer) {
        peer.joinedAcked = true;
        peer.matchStartedAcked = true;
      }
      const player = this.room.players.get(playerId);
      if (player && !player.joinedRoom) {
        player.joinedRoom = true;
      }
      return;
    }

    if (msg.type === "JOIN_ROOM" || msg.type === "P2P_HELLO") {
      const peer = this.peers.get(playerId);

      if (this.room.players.has(playerId)) {
        const existing = this.room.players.get(playerId);
        let updated = false;
        if (typeof msg.playerName === "string" && msg.playerName.trim()) {
          const nextName = sanitizeName(msg.playerName, existing.slot + 1);
          if (nextName !== existing.name) {
            existing.name = nextName;
            updated = true;
          }
        }
        if (typeof msg.heroId === "string" && msg.heroId && msg.heroId !== existing.heroId && this.room.status === "LOBBY") {
          const isFounderAuthorized = this.founderVerifiedPeers.has(playerId) || (playerId === this.hostId && this.founderUnlocked);
          const canPickHero = msg.heroId !== "thien" || isFounderAuthorized;
          if (canPickHero) {
            existing.heroId = msg.heroId;
            updated = true;
          }
        }
        this.sendToPlayer(playerId, {
          type: "ROOM_JOINED",
          playerId,
          room: this.serializeRoom(),
        });
        if (updated) {
          this.broadcastRoomUpdate();
        }
        if (peer && !peer.joinedAcked) {
          this._ensureSyncRetryLoop();
        }
        this._sendActiveMatchSync(playerId);
        return;
      }
      if (this.room.players.size >= MAX_PLAYERS) {
        this.sendToPlayer(playerId, { type: "ROOM_ERROR", message: "Phòng đã đầy (tối đa 4 người chơi)." });
        return;
      }
      const slot = this.getNextFreeSlot();
      const pos = getSpawnPosition(slot, this.room.mapId);
      const requestedHero = typeof msg.heroId === "string" && msg.heroId ? msg.heroId : "dung";
      const isFounderAuthorized = this.founderVerifiedPeers.has(playerId) || (playerId === this.hostId && this.founderUnlocked);
      const safePeerHero = requestedHero === "thien" && !isFounderAuthorized ? "dung" : requestedHero;
      const joined = {
        id: playerId,
        name: sanitizeName(msg.playerName, slot + 1),
        heroId: safePeerHero,
        ready: this.room.status === "PLAYING",
        joinedRoom: !peer,
        slot,
        alive: true,
        readyNextWave: false,
        totalDamage: 0,
        x: pos.x,
        y: pos.y,
        facing: 0,
        hp: 960,
        maxHp: 960,
        shield: 0,
        level: 1,
        moveSpeedFactor: 0,
        walkCyclePhase: 0,
        attackAnimTimer: 0,
        attackAnimAngle: 0,
        attackSwingParity: 1,
        weaponSkillTimer: 0,
        weaponSkillDur: 0.46,
        weaponCritTimer: 0,
        bowRecoilTimer: 0,
        buffs: {},
      };
      this.room.players.set(playerId, joined);
      if (this.room.status === "PLAYING") {
        this.room.matchPlayerCount = Math.max(this.room.matchPlayerCount, this.room.players.size);
        this.room.powerMultiplier = computePowerMultiplier(this.room.matchPlayerCount);
      }
      this.sendToPlayer(playerId, {
        type: "ROOM_JOINED",
        playerId,
        room: this.serializeRoom(),
      });
      this.broadcastRoom({ type: "ROOM_UPDATE", room: this.serializeRoom() }, playerId);
      if (peer) {
        this._ensureSyncRetryLoop();
      }
      this._sendActiveMatchSync(playerId);
      return;
    }

    if (msg.type === "LEAVE_ROOM") {
      if (playerId === this.hostId) {
        this.broadcastRoom({ type: "WS_CLOSE" }, this.hostId);
        this.destroy();
        this.onLocalEvent?.({ type: "LEFT_ROOM" });
      } else {
        this.room.players.delete(playerId);
        this.peers.get(playerId)?.pc?.close();
        this.peers.delete(playerId);
        this.broadcastRoom({
          type: "PLAYER_LEFT",
          playerId,
          newHostId: this.hostId,
          room: this.serializeRoom(),
        });
      }
      return;
    }

    const player = this.room.players.get(playerId);
    if (!player) return;

    const peer = this.peers.get(playerId);
    if (peer && !peer.joinedAcked) {
      peer.joinedAcked = true;
      player.joinedRoom = true;
    }

    if (msg.type === "SELECT_HERO") {
      if (typeof msg.heroId === "string" && msg.heroId) {
        const isFounderAuthorized = this.founderVerifiedPeers.has(playerId) || (playerId === this.hostId && this.founderUnlocked);
        if (msg.heroId === "thien" && !isFounderAuthorized) {
          this.sendToPlayer(playerId, {
            type: "ROOM_ERROR",
            code: "FOUNDER_LOCKED",
            message: "Tướng bí mật THIÊN chỉ dành cho Nhà Sáng Lập.",
          });
          return;
        }
        player.heroId = msg.heroId;
        this.broadcastRoomUpdate();
      }
      return;
    }

    if (msg.type === "SET_NAME") {
      player.name = sanitizeName(msg.playerName, player.slot + 1);
      this.broadcastRoomUpdate();
      return;
    }

    if (msg.type === "SET_MAP") {
      if (playerId !== this.hostId || this.room.status !== "LOBBY") return;
      this.room.mapId =
        msg.mapId === "blood_citadel" || msg.mapId === "inferno_ash" || msg.mapId === "frozen_tomb" || msg.mapId === "grudge_forest" || msg.mapId === "void_city"
          ? msg.mapId
          : "classic";
      this.broadcastRoomUpdate();
      return;
    }

    if (msg.type === "TOGGLE_READY") {
      if (this.room.status !== "LOBBY") return;
      player.ready = typeof msg.ready === "boolean" ? msg.ready : !player.ready;
      this.broadcastRoomUpdate();
      return;
    }

    if (msg.type === "START_MATCH") {
      if (playerId !== this.hostId || this.room.status !== "LOBBY") return;
      for (const rp of this.room.players.values()) {
        if (rp.heroId === "thien" && !(rp.id === this.hostId && this.founderUnlocked)) {
          rp.heroId = "eohyen";
        }
      }
      const unjoined = Array.from(this.room.players.values()).filter((p) => !p.isHost && !p.joinedRoom);
      if (unjoined.length > 0) {
        this.sendToPlayer(playerId, {
          type: "ROOM_ERROR",
          message: `Đợi ${unjoined.map((p) => p.name).join(", ")} hoàn tất vào phòng rồi mới bắt đầu!`,
        });
        return;
      }
      const notReady = Array.from(this.room.players.values()).filter((p) => !p.isHost && !p.ready);
      if (notReady.length > 0) {
        this.sendToPlayer(playerId, {
          type: "ROOM_ERROR",
          message: `Chờ ${notReady.map((p) => p.name).join(", ")} nhấn Sẵn sàng!`,
        });
        return;
      }
      this.startMatch();
      return;
    }

    if (msg.type === "RESTART_MATCH") {
      if (playerId !== this.hostId) return;
      for (const rp of this.room.players.values()) {
        if (rp.heroId === "thien" && !(rp.id === this.hostId && this.founderUnlocked)) {
          rp.heroId = "eohyen";
        }
      }
      this.startMatch();
      return;
    }

    if (this.room.status !== "PLAYING") return;

    if (msg.type === "WAVE_META") {
      if (playerId !== this.hostId) return;
      this.room.wave = Number(msg.wave) || this.room.wave;
      this.room.waveTotal = Number(msg.waveTotal) || this.room.waveTotal;
      this.room.waveSpawned = Number(msg.waveSpawned) || 0;
      this.room.waveCleared = false;
      this.room.waveStartTime = Date.now();
      this.broadcastRoom(
        {
          type: "WAVE_META_SYNC",
          wave: this.room.wave,
          waveTotal: this.room.waveTotal,
          waveSpawned: this.room.waveSpawned,
        },
        playerId
      );
      return;
    }

    if (msg.type === "SPAWN_ENEMIES") {
      if (playerId !== this.hostId || !Array.isArray(msg.enemies)) return;
      const added = [];
      for (const rawEnemy of msg.enemies) {
        if (!rawEnemy || typeof rawEnemy.id !== "number") continue;
        const enemy = {
          id: rawEnemy.id,
          kind: String(rawEnemy.kind || "minion"),
          bossWave: rawEnemy.bossWave ? Number(rawEnemy.bossWave) : undefined,
          name: String(rawEnemy.name || "Quái"),
          x: Number(rawEnemy.x) || 1000,
          y: Number(rawEnemy.y) || 700,
          radius: Number(rawEnemy.radius) || 18,
          hp: Math.max(1, Math.round(Number(rawEnemy.hp) || 100)),
          maxHp: Math.max(1, Math.round(Number(rawEnemy.maxHp) || 100)),
          damage: Math.max(1, Math.round(Number(rawEnemy.damage) || 20)),
          baseDamage: rawEnemy.baseDamage ? Math.round(Number(rawEnemy.baseDamage)) : undefined,
          speed: Number(rawEnemy.speed) || 110,
          baseSpeed: rawEnemy.baseSpeed ? Number(rawEnemy.baseSpeed) : undefined,
          xpValue: Math.max(1, Math.round(Number(rawEnemy.xpValue) || 24)),
          color: String(rawEnemy.color || "#22C55E"),
          accentColor: rawEnemy.accentColor ? String(rawEnemy.accentColor) : undefined,
          facing: Number(rawEnemy.facing) || 0,
          phase: Number(rawEnemy.phase) || 1,
        };
        this.room.enemies.set(enemy.id, enemy);
        added.push(enemy);
      }
      if (typeof msg.waveSpawned === "number") {
        this.room.waveSpawned = Math.max(this.room.waveSpawned, msg.waveSpawned);
      }
      if (added.length > 0) {
        this.broadcastRoom(
          {
            type: "ENEMIES_SPAWNED",
            wave: this.room.wave,
            enemies: added,
            waveSpawned: this.room.waveSpawned,
            waveTotal: this.room.waveTotal,
          },
          playerId
        );
      }
      return;
    }

    if (msg.type === "DAMAGE_ENEMY") {
      const enemyId = Number(msg.enemyId);
      const enemy = this.room.enemies.get(enemyId);
      if (!enemy || enemy.hp <= 0) return;

      const rawDmg = Math.max(1, Math.min(999999, Math.round(Number(msg.dmg) || 0)));
      const actualDmg = Math.min(enemy.hp, rawDmg);
      enemy.hp = Math.max(0, enemy.hp - actualDmg);
      player.totalDamage += actualDmg;

      const knockX = Number(msg.knockX) || 0;
      const knockY = Number(msg.knockY) || 0;
      if (knockX !== 0 || knockY !== 0) {
        const factor = enemy.kind === "boss" ? 0.25 : 1;
        const mapW = this.room.mapId === "blood_citadel" ? 1600 : this.room.mapId === "inferno_ash" ? 2400 : this.room.mapId === "frozen_tomb" ? 3400 : this.room.mapId === "grudge_forest" || this.room.mapId === "void_city" ? 4800 : 2000;
        const mapH = this.room.mapId === "blood_citadel" ? 1600 : this.room.mapId === "inferno_ash" ? 2100 : this.room.mapId === "frozen_tomb" ? 2800 : this.room.mapId === "grudge_forest" || this.room.mapId === "void_city" ? 4000 : 1400;
        enemy.x = Math.max(enemy.radius, Math.min(mapW - enemy.radius, enemy.x + knockX * factor));
        enemy.y = Math.max(enemy.radius, Math.min(mapH - enemy.radius, enemy.y + knockY * factor));
      }

      if (msg.effects && typeof msg.effects === "object") {
        if (typeof msg.effects.slowFactor === "number") {
          enemy.slowFactor = Math.max(enemy.slowFactor || 0, msg.effects.slowFactor);
        }
        if (typeof msg.effects.stunTimer === "number") {
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, msg.effects.stunTimer);
        }
        if (typeof msg.effects.frozenTimer === "number") {
          enemy.frozenTimer = Math.max(enemy.frozenTimer || 0, msg.effects.frozenTimer);
        }
        if (typeof msg.effects.bao_marks === "number") {
          enemy.bao_marks = msg.effects.bao_marks;
        }
        if (typeof msg.effects.tin_hasMark === "boolean") {
          enemy.tin_hasMark = msg.effects.tin_hasMark;
        }
        if (typeof msg.effects.gau_quakeTimer === "number") {
          enemy.gau_quakeTimer = Math.max(enemy.gau_quakeTimer || 0, msg.effects.gau_quakeTimer);
        }
      }

      const killed = enemy.hp <= 0;
      if (killed) {
        this.room.enemies.delete(enemyId);
        this.room.waveKilled++;
      }

      this.broadcastRoom({
        type: "ENEMY_HIT",
        enemyId,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        dmg: actualDmg,
        isCrit: Boolean(msg.isCrit),
        byPlayerId: playerId,
        knockX,
        knockY,
        killed,
        x: enemy.x,
        y: enemy.y,
        waveKilled: this.room.waveKilled,
        effects: msg.effects || null,
        quiet: Boolean(msg.quiet),
      });

      if (killed) {
        this.checkWaveCompletion();
      }
      return;
    }

    if (msg.type === "WORLD_SNAPSHOT") {
      if (playerId !== this.hostId) return;
      if (typeof msg.wave === "number" && msg.wave !== this.room.wave) return;
      if (typeof msg.waveSpawned === "number") {
        this.room.waveSpawned = Math.max(this.room.waveSpawned, msg.waveSpawned);
      }
      const syncedEnemies = [];
      const seenIds = new Set();
      if (Array.isArray(msg.enemies)) {
        for (const e of msg.enemies) {
          if (!e || typeof e.id !== "number") continue;
          seenIds.add(e.id);
          let serverEnemy = this.room.enemies.get(e.id);
          if (!serverEnemy) {
            const snapHp = Math.round(Number(e.hp) || 0);
            if (snapHp <= 0) continue;
            serverEnemy = {
              id: e.id,
              kind: String(e.kind || "minion"),
              bossWave: e.bossWave ? Number(e.bossWave) : undefined,
              name: String(e.name || "Quái"),
              x: Number(e.x) || 1000,
              y: Number(e.y) || 700,
              radius: Number(e.radius) || 18,
              hp: Math.max(1, snapHp),
              maxHp: Math.max(1, Math.round(Number(e.maxHp) || snapHp || 100)),
              damage: Math.max(1, Math.round(Number(e.damage) || 20)),
              speed: Number(e.speed) || 110,
              xpValue: Math.max(1, Math.round(Number(e.xpValue) || 24)),
              color: String(e.color || "#22C55E"),
              accentColor: e.accentColor ? String(e.accentColor) : undefined,
              facing: Number(e.facing) || 0,
              phase: Number(e.phase) || 1,
            };
            this.room.enemies.set(serverEnemy.id, serverEnemy);
          }
          if (serverEnemy.hp <= 0) continue;
          serverEnemy.x = Number(e.x) || serverEnemy.x;
          serverEnemy.y = Number(e.y) || serverEnemy.y;
          serverEnemy.vx = Number(e.vx) || 0;
          serverEnemy.vy = Number(e.vy) || 0;
          serverEnemy.facing = Number(e.facing) || 0;
          serverEnemy.phase = Number(e.phase) || serverEnemy.phase || 1;
          if (typeof e.castSkillIdx === "number") serverEnemy.castSkillIdx = e.castSkillIdx;
          if (typeof e.castWindupTimer === "number") serverEnemy.castWindupTimer = e.castWindupTimer;
          serverEnemy.stunTimer = Number(e.stunTimer) || 0;
          serverEnemy.slowFactor = Number(e.slowFactor) || 0;
          serverEnemy.frozenTimer = Number(e.frozenTimer) || 0;
          serverEnemy.bao_marks = Number(e.bao_marks) || 0;
          serverEnemy.gau_quakeTimer = Number(e.gau_quakeTimer) || 0;
          serverEnemy.tin_hasMark = Boolean(e.tin_hasMark);
          serverEnemy.burnCount = Number(e.burnCount) || 0;

          const includeMeta = msg.fullMeta !== false || !serverEnemy.metaSyncedOnce;
          serverEnemy.metaSyncedOnce = true;
          const outEnemy = {
            id: serverEnemy.id,
            x: Math.round(serverEnemy.x * 10) / 10,
            y: Math.round(serverEnemy.y * 10) / 10,
            vx: Math.round(serverEnemy.vx || 0),
            vy: Math.round(serverEnemy.vy || 0),
            facing: Math.round(serverEnemy.facing * 100) / 100,
            hp: serverEnemy.hp,
            maxHp: serverEnemy.maxHp,
            phase: serverEnemy.phase,
            castSkillIdx: serverEnemy.castSkillIdx,
            castWindupTimer: serverEnemy.castWindupTimer,
            stunTimer: serverEnemy.stunTimer,
            slowFactor: serverEnemy.slowFactor,
            frozenTimer: serverEnemy.frozenTimer,
            bao_marks: serverEnemy.bao_marks,
            gau_quakeTimer: serverEnemy.gau_quakeTimer,
            tin_hasMark: serverEnemy.tin_hasMark,
            burnCount: serverEnemy.burnCount,
          };
          if (includeMeta) {
            outEnemy.kind = serverEnemy.kind;
            outEnemy.bossWave = serverEnemy.bossWave;
            outEnemy.name = serverEnemy.name;
            outEnemy.radius = serverEnemy.radius;
            outEnemy.color = serverEnemy.color;
            outEnemy.accentColor = serverEnemy.accentColor;
            outEnemy.speed = serverEnemy.speed;
            outEnemy.damage = serverEnemy.damage;
            outEnemy.xpValue = serverEnemy.xpValue;
          }
          syncedEnemies.push(outEnemy);
        }
      }

      if (msg.fullList === true) {
        for (const existingId of this.room.enemies.keys()) {
          if (!seenIds.has(existingId)) {
            this.room.enemies.delete(existingId);
          }
        }
      }

      this.broadcastRoom(
        {
          type: "WORLD_SYNC",
          wave: this.room.wave,
          waveTotal: this.room.waveTotal,
          waveSpawned: this.room.waveSpawned,
          waveKilled: this.room.waveKilled,
          fullList: Boolean(msg.fullList),
          enemies: syncedEnemies,
          bossWarnings: Array.isArray(msg.bossWarnings) ? msg.bossWarnings : [],
          bossBeams: Array.isArray(msg.bossBeams) ? msg.bossBeams : [],
          bossShockRings: Array.isArray(msg.bossShockRings) ? msg.bossShockRings : [],
        },
        playerId
      );
      return;
    }

    if (msg.type === "SYNC_PLAYER") {
      if (peer) {
        peer.matchStartedAcked = true;
      }
      const s = msg.state;
      if (!s || typeof s !== "object") return;
      const wasAlive = player.alive;
      const mapW = this.room.mapId === "blood_citadel" ? 1600 : this.room.mapId === "inferno_ash" ? 2400 : this.room.mapId === "frozen_tomb" ? 3400 : this.room.mapId === "grudge_forest" || this.room.mapId === "void_city" ? 4800 : 2000;
      const mapH = this.room.mapId === "blood_citadel" ? 1600 : this.room.mapId === "inferno_ash" ? 2100 : this.room.mapId === "frozen_tomb" ? 2800 : this.room.mapId === "grudge_forest" || this.room.mapId === "void_city" ? 4000 : 1400;
      player.x = Math.max(20, Math.min(mapW - 20, Number(s.x) || player.x));
      player.y = Math.max(20, Math.min(mapH - 20, Number(s.y) || player.y));
      player.vx = Number(s.vx) || 0;
      player.vy = Number(s.vy) || 0;
      player.facing = Number(s.facing) || 0;
      player.hp = Math.max(0, Math.round(Number(s.hp) ?? player.hp));
      player.maxHp = Math.max(1, Math.round(Number(s.maxHp) || player.maxHp));
      player.shield = Math.max(0, Math.round(Number(s.shield) || 0));
      player.level = Math.max(1, Math.round(Number(s.level) || player.level));
      if (typeof s.totalDamage === "number" && Number.isFinite(s.totalDamage)) {
        player.totalDamage = Math.max(player.totalDamage || 0, Math.round(s.totalDamage));
      }
      player.alive = player.hp > 0 && s.alive !== false;
      player.moveSpeedFactor = Number(s.moveSpeedFactor) || 0;
      player.walkCyclePhase = Number(s.walkCyclePhase) || 0;
      player.attackAnimTimer = Number(s.attackAnimTimer) || 0;
      player.attackAnimAngle = Number(s.attackAnimAngle) || 0;
      player.attackSwingParity = Number(s.attackSwingParity) || 1;
      player.weaponSkillTimer = Number(s.weaponSkillTimer) || 0;
      player.weaponSkillDur = Number(s.weaponSkillDur) || 0.46;
      player.weaponCritTimer = Number(s.weaponCritTimer) || 0;
      player.bowRecoilTimer = Number(s.bowRecoilTimer) || 0;
      if (s.buffs && typeof s.buffs === "object") {
        player.buffs = s.buffs;
      }

      this.broadcastRoom(
        {
          type: "PLAYER_STATE",
          player: {
            id: player.id,
            name: player.name,
            heroId: player.heroId,
            isHost: player.isHost,
            slot: player.slot,
            alive: player.alive,
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            facing: player.facing,
            hp: player.hp,
            maxHp: player.maxHp,
            shield: player.shield,
            level: player.level,
            totalDamage: player.totalDamage,
            moveSpeedFactor: player.moveSpeedFactor,
            walkCyclePhase: player.walkCyclePhase,
            attackAnimTimer: player.attackAnimTimer,
            attackAnimAngle: player.attackAnimAngle,
            attackSwingParity: player.attackSwingParity,
            weaponSkillTimer: player.weaponSkillTimer,
            weaponSkillDur: player.weaponSkillDur,
            weaponCritTimer: player.weaponCritTimer,
            bowRecoilTimer: player.bowRecoilTimer,
            buffs: player.buffs,
          },
        },
        playerId
      );

      if (wasAlive && !player.alive) {
        this.broadcastRoom({
          type: "PLAYER_DOWNED",
          playerId: player.id,
          playerName: player.name,
          room: this.serializeRoom(),
        });
        this.checkAllPlayersDead();
      }
      return;
    }

    if (msg.type === "MAP_PROGRESS_SYNC") {
      this.broadcastRoom(
        {
          type: "MAP_PROGRESS_SYNC",
          fromPlayerId: playerId,
          fromName: player.name,
          fromHeroId: player.heroId,
          mapId: msg.mapId,
          citadelSecrets: msg.citadelSecrets || null,
          infernoProgress: msg.infernoProgress || null,
          frozenTombProgress: msg.frozenTombProgress || null,
          grudgeForestProgress: msg.grudgeForestProgress || null,
        },
        playerId
      );
      return;
    }

    if (msg.type === "PLAYER_VFX") {
      if (!Array.isArray(msg.events) || msg.events.length === 0) return;
      this.broadcastRoom(
        {
          type: "REMOTE_VFX",
          playerId,
          heroId: player.heroId,
          events: msg.events.slice(0, 120),
        },
        playerId
      );
      return;
    }

    if (msg.type === "ALLY_SUPPORT") {
      if (!player.alive) return;
      this.broadcastRoom(
        {
          type: "ALLY_SUPPORT",
          fromPlayerId: playerId,
          fromName: player.name,
          x: Number(msg.x) || player.x,
          y: Number(msg.y) || player.y,
          radius: Math.max(40, Math.min(600, Number(msg.radius) || 220)),
          heal: Math.max(0, Math.min(50000, Math.round(Number(msg.heal) || 0))),
          shield: Math.max(0, Math.min(50000, Math.round(Number(msg.shield) || 0))),
          label: typeof msg.label === "string" ? msg.label.slice(0, 40) : "",
          color: typeof msg.color === "string" ? msg.color.slice(0, 20) : "#10B981",
        },
        playerId
      );
      return;
    }

    if (msg.type === "REVIVE_PLAYER") {
      if (!player.alive) return;
      const targetId = typeof msg.targetPlayerId === "string" ? msg.targetPlayerId : "";
      const target = this.room.players.get(targetId);
      if (!target || target.alive) return;
      target.alive = true;
      target.hp = Math.max(1, Math.round((target.maxHp || 900) * 0.45));
      target.shield = Math.max(target.shield || 0, Math.round((target.maxHp || 900) * 0.2));
      this.broadcastRoom({
        type: "PLAYER_REVIVED",
        targetPlayerId: target.id,
        targetName: target.name,
        byPlayerId: player.id,
        byName: player.name,
        hp: target.hp,
        shield: target.shield,
        x: target.x,
        y: target.y,
        room: this.serializeRoom(),
      });
      return;
    }

    if (msg.type === "WAVE_READY") {
      if (!this.room.waveCleared) return;
      player.readyNextWave = typeof msg.ready === "boolean" ? msg.ready : true;
      this.broadcastRoomUpdate();
      return;
    }

    if (msg.type === "NEXT_WAVE") {
      if (playerId !== this.hostId || !this.room.waveCleared) return;
      if (this.room.wave >= MAX_WAVES) {
        this.room.status = "LOBBY";
        for (const p of this.room.players.values()) {
          p.ready = p.isHost;
          p.alive = true;
        }
        this.broadcastRoom({
          type: "MATCH_OVER",
          victory: true,
          wave: this.room.wave,
          room: this.serializeRoom(),
        });
        return;
      }
      this.room.wave += 1;
      this.room.waveSpawned = 0;
      this.room.waveKilled = 0;
      this.room.waveCleared = false;
      this.room.waveStartTime = Date.now();
      this.room.enemies.clear();
      for (const p of this.room.players.values()) {
        p.alive = true;
        p.readyNextWave = false;
        if (p.maxHp > 0) p.hp = p.maxHp;
      }
      this.broadcastRoom({
        type: "WAVE_STARTED",
        wave: this.room.wave,
        room: this.serializeRoom(),
      });
    }
  }

  destroy() {
    if (this.syncRetryTimer) {
      clearInterval(this.syncRetryTimer);
      this.syncRetryTimer = null;
    }
    for (const peer of this.peers.values()) {
      if (peer.disconnectTimer) {
        clearTimeout(peer.disconnectTimer);
        peer.disconnectTimer = null;
      }
      try { peer.fastDc?.close(); } catch {}
      try { peer.dc?.close(); } catch {}
      try { peer.pc?.close(); } catch {}
    }
    this.peers.clear();
  }
}

export class P2PRoomPeerClient {
  constructor({ onEvent, onClose }) {
    this.pc = null;
    this.dc = null;
    this.fastDc = null;
    this.relaySender = null;
    this.relayActive = false;
    this.rtcUnavailable = false;
    this.playerId = null;
    this.playerName = "";
    this.heroId = "eohyen";
    this.onEvent = onEvent;
    this.onClose = onClose;
    this.joinedRoom = false;
    this.inMatch = false;
    this.connectedNotified = false;
    this.helloTimer = null;
    this.disconnectTimer = null;
    this.destroyed = false;
    this._onVisibility = null;
  }

  _stopHelloLoop() {
    if (this.helloTimer) {
      clearInterval(this.helloTimer);
      this.helloTimer = null;
    }
  }

  _sendHelloNow() {
    if (this.destroyed) {
      this._stopHelloLoop();
      return;
    }
    if (this.joinedRoom && this.inMatch) {
      this._stopHelloLoop();
      return;
    }
    this.send({
      type: "P2P_HELLO",
      playerName: this.playerName,
      heroId: this.heroId,
    });
  }

  _processIncomingMsg(msg) {
    if (!msg || typeof msg !== "object" || this.destroyed) return;
    if (msg.type === "ROOM_JOINED") {
      this.joinedRoom = true;
      this._stopHelloLoop();
      this.send({ type: "P2P_JOIN_ACK" });
      if (msg.room?.status === "PLAYING") {
        this.inMatch = true;
      }
    } else if (msg.type === "MATCH_STARTED") {
      this.joinedRoom = true;
      this.inMatch = true;
      this._stopHelloLoop();
      this.send({ type: "P2P_JOIN_ACK" });
      this.send({ type: "P2P_MATCH_ACK" });
    } else if (msg.type === "MATCH_OVER" || msg.type === "LEFT_ROOM") {
      this.inMatch = false;
    } else if (msg.type === "ROOM_UPDATE") {
      if (!this.joinedRoom && msg.room?.members?.some((m) => m.id === this.playerId)) {
        this.joinedRoom = true;
        this._stopHelloLoop();
        this.send({ type: "P2P_JOIN_ACK" });
        this.onEvent?.({ type: "ROOM_JOINED", playerId: this.playerId, room: msg.room });
      }
      if (msg.room?.status === "PLAYING" && !this.inMatch) {
        this._sendHelloNow();
      }
    } else if (msg.type === "CONNECTED" && !this.joinedRoom) {
      this._sendHelloNow();
    }
    this.onEvent?.(msg);
  }

  setRelaySender(fn) {
    this.relaySender = typeof fn === "function" ? fn : null;
    if (this.relaySender && !this.destroyed) {
      this.relayActive = true;
      if (!this.connectedNotified) {
        this.connectedNotified = true;
        this.onEvent?.({ type: "CONNECTED", playerId: this.playerId, relay: true });
      }
      this._sendHelloNow();
      if (!this.joinedRoom && !this.helloTimer) {
        this.helloTimer = setInterval(() => this._sendHelloNow(), 450);
      }
    } else if (!this.relaySender) {
      this.relayActive = false;
    }
  }

  receiveRelayMessage(msg) {
    if (this.destroyed || !msg || typeof msg !== "object") return;
    this._processIncomingMsg(msg);
  }

  isDirectOpen() {
    return Boolean(this.dc && this.dc.readyState === "open");
  }

  async createAnswerFromOffer(offerCode, playerName, heroId) {
    const payload = await decodeSignalPayload(offerCode);
    if (!payload || payload.k !== "O" || (typeof payload.sdp !== "string" && payload.relay !== true)) {
      throw new Error("Mã mời không hợp lệ.");
    }

    this.playerId = payload.pid || `p2p_m_${Math.random().toString(36).slice(2, 8)}`;
    this.playerName = playerName;
    this.heroId = heroId;
    this.joinedRoom = false;
    this.inMatch = false;
    this.connectedNotified = false;
    this.rtcUnavailable = false;

    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      this._onVisibility = () => {
        if (document.visibilityState === "visible" && (!this.joinedRoom || !this.inMatch) && this.isOpen()) {
          this._sendHelloNow();
        }
      };
      document.addEventListener("visibilitychange", this._onVisibility);
    }

    const buildRelayAnswer = async () => {
      this.rtcUnavailable = true;
      return await encodeSignalPayload({
        v: 1,
        k: "A",
        relay: true,
        pid: this.playerId,
        rid: payload.rid,
      });
    };

    if (payload.relay === true || !payload.sdp || typeof RTCPeerConnection === "undefined") {
      return await buildRelayAnswer();
    }

    let pc;
    try {
      pc = new RTCPeerConnection(RTC_CONFIG);
    } catch {
      return await buildRelayAnswer();
    }
    this.pc = pc;

    let handleOpenRef = null;

    const bindPrimaryDataChannel = (dc) => {
      if (!dc || this.destroyed) return;
      this.dc = dc;

      const handleOpen = () => {
        if (this.destroyed) return;
        if (!this.connectedNotified) {
          this.connectedNotified = true;
          this.onEvent?.({ type: "CONNECTED", playerId: this.playerId });
        }
        this._sendHelloNow();
        if (!this.joinedRoom && !this.helloTimer) {
          this.helloTimer = setInterval(() => this._sendHelloNow(), 400);
        }
      };
      handleOpenRef = handleOpen;

      dc.onmessage = (msgEv) => {
        let msg;
        try {
          msg = JSON.parse(msgEv.data);
        } catch {
          return;
        }
        this._processIncomingMsg(msg);
      };
      dc.onclose = () => {
        if (this.relayActive) return;
        this._stopHelloLoop();
        if (!this.destroyed) this.onClose?.();
      };
      dc.onerror = () => {};

      if (dc.readyState === "open") {
        queueMicrotask(handleOpen);
      } else {
        dc.onopen = handleOpen;
      }
    };

    const bindFastDataChannel = (fdc) => {
      if (!fdc || this.destroyed) return;
      this.fastDc = fdc;
      fdc.onmessage = (msgEv) => {
        let msg;
        try {
          msg = JSON.parse(msgEv.data);
        } catch {
          return;
        }
        this._processIncomingMsg(msg);
      };
      fdc.onerror = () => {};
    };

    pc.ondatachannel = (ev) => {
      const ch = ev.channel;
      if (!ch) return;
      if (ch.label === "arena-coop-fast") {
        bindFastDataChannel(ch);
      } else {
        bindPrimaryDataChannel(ch);
      }
    };

    const handleRtcState = () => {
      const st = pc.connectionState;
      const iceSt = pc.iceConnectionState;
      if (st === "connected" || iceSt === "connected" || iceSt === "completed") {
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
          this.disconnectTimer = null;
        }
        if (this.dc && this.dc.readyState === "open" && !this.connectedNotified && handleOpenRef) {
          handleOpenRef();
        } else if (!this.joinedRoom && this.isOpen()) {
          this._sendHelloNow();
        }
      } else if (st === "failed" || st === "closed" || iceSt === "failed" || iceSt === "closed") {
        if (this.relayActive) return;
        this._stopHelloLoop();
        if (!this.destroyed) this.onClose?.();
      } else if ((st === "disconnected" || iceSt === "disconnected") && !this.disconnectTimer) {
        this.disconnectTimer = setTimeout(() => {
          this.disconnectTimer = null;
          if (
            !this.destroyed &&
            !this.relayActive &&
            (pc.connectionState === "disconnected" ||
              pc.connectionState === "failed" ||
              pc.connectionState === "closed" ||
              pc.iceConnectionState === "disconnected" ||
              pc.iceConnectionState === "failed")
          ) {
            this._stopHelloLoop();
            this.onClose?.();
          }
        }, 25000);
      }
    };

    pc.onconnectionstatechange = handleRtcState;
    pc.oniceconnectionstatechange = handleRtcState;

    try {
      await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceComplete(pc, 2200);
      const localSdp = pc.localDescription?.sdp || answer?.sdp;
      if (!localSdp) {
        throw new Error("Empty local SDP");
      }

      return await encodeSignalPayload({
        v: 1,
        k: "A",
        pid: this.playerId,
        rid: payload.rid,
        sdp: localSdp,
      });
    } catch {
      try { pc.close(); } catch {}
      this.pc = null;
      this.dc = null;
      this.fastDc = null;
      return await buildRelayAnswer();
    }
  }

  isOpen() {
    return Boolean((this.dc && this.dc.readyState === "open") || this.relayActive);
  }

  send(payload) {
    const isVolatile = VOLATILE_P2P_TYPES.has(payload?.type);
    const useFastDc =
      isVolatile && this.fastDc && this.fastDc.readyState === "open";
    const targetDc = useFastDc ? this.fastDc : this.dc && this.dc.readyState === "open" ? this.dc : null;

    if (targetDc) {
      if (
        isVolatile &&
        typeof targetDc.bufferedAmount === "number" &&
        targetDc.bufferedAmount > DC_BACKPRESSURE_LIMIT
      ) {
        return true;
      }
      try {
        targetDc.send(JSON.stringify(payload));
        return true;
      } catch {
      }
    }

    if (this.relayActive && this.relaySender) {
      try {
        this.relaySender(payload);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  destroy() {
    this.destroyed = true;
    this.relayActive = false;
    this.relaySender = null;
    this._stopHelloLoop();
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
    if (this._onVisibility && typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("visibilitychange", this._onVisibility);
      this._onVisibility = null;
    }
    try {
      this.fastDc?.close();
    } catch {
    }
    try {
      this.dc?.close();
    } catch {
    }
    try {
      this.pc?.close();
    } catch {
    }
    this.fastDc = null;
    this.dc = null;
    this.pc = null;
  }
}
