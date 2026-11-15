import { computeCoopWaveReward } from "./combatLogic";

const MAX_PLAYERS = 4;
const MAX_WAVES = 15;
const RTC_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

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
  if (typeof CompressionStream !== "undefined") {
    try {
      const cs = new CompressionStream("gzip");
      const writer = cs.writable.getWriter();
      writer.write(rawBytes);
      writer.close();
      const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());
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
  if (cleaned.startsWith("AH1G:")) {
    const bytes = base64UrlToBytes(cleaned.slice(5));
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Trình duyệt không hỗ trợ giải nén mã P2P.");
    }
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const out = new Uint8Array(await new Response(ds.readable).arrayBuffer());
    return JSON.parse(new TextDecoder().decode(out));
  }
  if (cleaned.startsWith("AH1J:")) {
    const bytes = base64UrlToBytes(cleaned.slice(5));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  throw new Error("Mã kết nối P2P không hợp lệ. Hãy sao chép nguyên vẹn mã bắt đầu bằng AH1...");
}

function waitForIceComplete(pc, timeoutMs = 1500) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onState);
      pc.removeEventListener("icecandidate", onCand);
      resolve();
    };
    const onState = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    const onCand = (ev) => {
      if (!ev.candidate) finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    pc.addEventListener("icegatheringstatechange", onState);
    pc.addEventListener("icecandidate", onCand);
  });
}

function getSpawnPosition(slot) {
  const offsets = [
    { dx: -75, dy: -45 },
    { dx: 75, dy: -45 },
    { dx: -75, dy: 55 },
    { dx: 75, dy: 55 },
  ];
  const off = offsets[slot % offsets.length];
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

export class P2PRoomHost {
  constructor({ hostName, heroId, onLocalEvent, onPeersChanged }) {
    this.hostId = `p2p_${Math.random().toString(36).slice(2, 10)}`;
    this.onLocalEvent = onLocalEvent;
    this.onPeersChanged = onPeersChanged;
    this.peers = new Map(); // peerId -> { pc, dc, state: 'pending'|'open'|'closed', playerId }
    this.pendingPeerCounter = 0;

    const pos = getSpawnPosition(0);
    const codeSuffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 4).padEnd(4, "P");
    this.room = {
      id: `P2-${codeSuffix}`,
      status: "LOBBY",
      hostId: this.hostId,
      players: new Map([
        [
          this.hostId,
          {
            id: this.hostId,
            name: sanitizeName(hostName, 1),
            heroId: heroId || "eohyen",
            isHost: true,
            ready: true,
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
      enemies: new Map(),
    };
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
      status: this.room.status,
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

  sendToPlayer(playerId, data) {
    if (playerId === this.hostId) {
      this.onLocalEvent?.(data);
      return;
    }
    const peer = this.peers.get(playerId);
    if (!peer || !peer.dc || peer.dc.readyState !== "open") return;
    try {
      peer.dc.send(JSON.stringify(data));
    } catch {
    }
  }

  broadcastRoom(data, excludePlayerId) {
    for (const pid of this.room.players.keys()) {
      if (excludePlayerId && pid === excludePlayerId) continue;
      this.sendToPlayer(pid, data);
    }
  }

  broadcastRoomUpdate() {
    this.broadcastRoom({ type: "ROOM_UPDATE", room: this.serializeRoom() });
  }

  async createInviteOffer() {
    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("Trình duyệt này không hỗ trợ WebRTC P2P.");
    }
    if (this.room.players.size >= MAX_PLAYERS) {
      throw new Error("Phòng đã đủ tối đa 4 người chơi.");
    }
    const slotId = `p2p_m_${++this.pendingPeerCounter}_${Math.random().toString(36).slice(2, 6)}`;
    const pc = new RTCPeerConnection({ iceServers: RTC_ICE_SERVERS });
    const dc = pc.createDataChannel("arena-coop", { ordered: true });

    const peerRecord = { pc, dc, state: "pending", playerId: slotId };
    this.peers.set(slotId, peerRecord);

    dc.onopen = () => {
      peerRecord.state = "open";
      this.sendToPlayer(slotId, { type: "CONNECTED", playerId: slotId });
      this.onPeersChanged?.();
    };
    dc.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      this.handleMessage(slotId, msg);
    };
    const onDisconnect = () => {
      if (peerRecord.state === "closed") return;
      peerRecord.state = "closed";
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
    dc.onclose = onDisconnect;
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed" || pc.connectionState === "disconnected") {
        onDisconnect();
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceComplete(pc, 1500);

    const code = await encodeSignalPayload({
      v: 1,
      k: "O",
      pid: slotId,
      rid: this.room.id,
      sdp: pc.localDescription.sdp,
    });
    return { inviteId: slotId, code };
  }

  async acceptJoinAnswer(answerCode) {
    const payload = await decodeSignalPayload(answerCode);
    if (!payload || payload.k !== "A" || typeof payload.sdp !== "string") {
      throw new Error("Đây không phải Mã Phản Hồi (Answer) từ bạn bè.");
    }
    const target =
      (payload.pid && this.peers.get(payload.pid)) ||
      Array.from(this.peers.values()).find((p) => p.state === "pending");
    if (!target) {
      throw new Error("Không tìm thấy lời mời đang chờ khớp. Hãy bấm 'Tạo Mã Mời Mới' rồi gửi lại cho bạn bè.");
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
    this.room.enemies.clear();

    const spawns = {};
    for (const p of this.room.players.values()) {
      const pos = getSpawnPosition(p.slot);
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
      wave: 1,
      playerCount: this.room.matchPlayerCount,
      powerMultiplier: this.room.powerMultiplier,
      spawns,
    });
  }

  handleMessage(playerId, msg) {
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "PING") {
      this.sendToPlayer(playerId, { type: "PONG", ts: Date.now() });
      return;
    }

    if (msg.type === "JOIN_ROOM" || msg.type === "P2P_HELLO") {
      if (this.room.players.has(playerId)) {
        this.sendToPlayer(playerId, {
          type: "ROOM_JOINED",
          playerId,
          room: this.serializeRoom(),
        });
        return;
      }
      if (this.room.players.size >= MAX_PLAYERS) {
        this.sendToPlayer(playerId, { type: "ROOM_ERROR", message: "Phòng đã đầy (tối đa 4 người chơi)." });
        return;
      }
      const slot = this.getNextFreeSlot();
      const pos = getSpawnPosition(slot);
      const joined = {
        id: playerId,
        name: sanitizeName(msg.playerName, slot + 1),
        heroId: typeof msg.heroId === "string" && msg.heroId ? msg.heroId : "dung",
        isHost: false,
        ready: true,
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
      this.sendToPlayer(playerId, {
        type: "ROOM_JOINED",
        playerId,
        room: this.serializeRoom(),
      });
      this.broadcastRoom({ type: "ROOM_UPDATE", room: this.serializeRoom() }, playerId);
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

    if (msg.type === "SELECT_HERO") {
      if (typeof msg.heroId === "string" && msg.heroId) {
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

    if (msg.type === "TOGGLE_READY") {
      if (this.room.status !== "LOBBY") return;
      player.ready = typeof msg.ready === "boolean" ? msg.ready : !player.ready;
      this.broadcastRoomUpdate();
      return;
    }

    if (msg.type === "START_MATCH") {
      if (playerId !== this.hostId || this.room.status !== "LOBBY") return;
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
        enemy.x = Math.max(enemy.radius, Math.min(2000 - enemy.radius, enemy.x + knockX * factor));
        enemy.y = Math.max(enemy.radius, Math.min(1400 - enemy.radius, enemy.y + knockY * factor));
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
      if (typeof msg.waveSpawned === "number") {
        this.room.waveSpawned = Math.max(this.room.waveSpawned, msg.waveSpawned);
      }
      const syncedEnemies = [];
      if (Array.isArray(msg.enemies)) {
        for (const e of msg.enemies) {
          if (!e || typeof e.id !== "number") continue;
          const serverEnemy = this.room.enemies.get(e.id);
          if (!serverEnemy || serverEnemy.hp <= 0) continue;
          serverEnemy.x = Number(e.x) || serverEnemy.x;
          serverEnemy.y = Number(e.y) || serverEnemy.y;
          serverEnemy.facing = Number(e.facing) || 0;
          serverEnemy.phase = Number(e.phase) || serverEnemy.phase || 1;
          serverEnemy.stunTimer = Number(e.stunTimer) || 0;
          serverEnemy.slowFactor = Number(e.slowFactor) || 0;
          serverEnemy.frozenTimer = Number(e.frozenTimer) || 0;
          serverEnemy.bao_marks = Number(e.bao_marks) || 0;
          serverEnemy.gau_quakeTimer = Number(e.gau_quakeTimer) || 0;
          serverEnemy.tin_hasMark = Boolean(e.tin_hasMark);
          serverEnemy.burnCount = Number(e.burnCount) || 0;

          syncedEnemies.push({
            id: serverEnemy.id,
            x: Math.round(serverEnemy.x * 10) / 10,
            y: Math.round(serverEnemy.y * 10) / 10,
            facing: Math.round(serverEnemy.facing * 100) / 100,
            hp: serverEnemy.hp,
            maxHp: serverEnemy.maxHp,
            phase: serverEnemy.phase,
            stunTimer: serverEnemy.stunTimer,
            slowFactor: serverEnemy.slowFactor,
            frozenTimer: serverEnemy.frozenTimer,
            bao_marks: serverEnemy.bao_marks,
            gau_quakeTimer: serverEnemy.gau_quakeTimer,
            tin_hasMark: serverEnemy.tin_hasMark,
            burnCount: serverEnemy.burnCount,
          });
        }
      }

      this.broadcastRoom(
        {
          type: "WORLD_SYNC",
          wave: this.room.wave,
          waveTotal: this.room.waveTotal,
          waveSpawned: this.room.waveSpawned,
          waveKilled: this.room.waveKilled,
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
      const s = msg.state;
      if (!s || typeof s !== "object") return;
      const wasAlive = player.alive;
      player.x = Math.max(20, Math.min(1980, Number(s.x) || player.x));
      player.y = Math.max(20, Math.min(1380, Number(s.y) || player.y));
      player.facing = Number(s.facing) || 0;
      player.hp = Math.max(0, Math.round(Number(s.hp) ?? player.hp));
      player.maxHp = Math.max(1, Math.round(Number(s.maxHp) || player.maxHp));
      player.shield = Math.max(0, Math.round(Number(s.shield) || 0));
      player.level = Math.max(1, Math.round(Number(s.level) || player.level));
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
            facing: player.facing,
            hp: player.hp,
            maxHp: player.maxHp,
            shield: player.shield,
            level: player.level,
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

    if (msg.type === "PLAYER_VFX") {
      if (!Array.isArray(msg.events) || msg.events.length === 0) return;
      this.broadcastRoom(
        {
          type: "REMOTE_VFX",
          playerId,
          heroId: player.heroId,
          events: msg.events.slice(0, 24),
        },
        playerId
      );
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
    for (const peer of this.peers.values()) {
      try {
        peer.dc?.close();
      } catch {
      }
      try {
        peer.pc?.close();
      } catch {
      }
    }
    this.peers.clear();
  }
}

export class P2PRoomPeerClient {
  constructor({ onEvent, onClose }) {
    this.pc = null;
    this.dc = null;
    this.playerId = null;
    this.onEvent = onEvent;
    this.onClose = onClose;
  }

  async createAnswerFromOffer(offerCode, playerName, heroId) {
    if (typeof RTCPeerConnection === "undefined") {
      throw new Error("Trình duyệt này không hỗ trợ WebRTC P2P.");
    }
    const payload = await decodeSignalPayload(offerCode);
    if (!payload || payload.k !== "O" || typeof payload.sdp !== "string") {
      throw new Error("Mã mời không hợp lệ (cần mã từ Chủ phòng P2P bắt đầu bằng AH1...).");
    }

    this.playerId = payload.pid || `p2p_m_${Math.random().toString(36).slice(2, 8)}`;
    const pc = new RTCPeerConnection({ iceServers: RTC_ICE_SERVERS });
    this.pc = pc;

    pc.ondatachannel = (ev) => {
      const dc = ev.channel;
      this.dc = dc;
      dc.onopen = () => {
        this.send({ type: "P2P_HELLO", playerName, heroId });
      };
      dc.onmessage = (msgEv) => {
        let msg;
        try {
          msg = JSON.parse(msgEv.data);
        } catch {
          return;
        }
        this.onEvent?.(msg);
      };
      dc.onclose = () => {
        this.onClose?.();
      };
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.onClose?.();
      }
    };

    await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceComplete(pc, 1500);

    return await encodeSignalPayload({
      v: 1,
      k: "A",
      pid: this.playerId,
      rid: payload.rid,
      sdp: pc.localDescription.sdp,
    });
  }

  isOpen() {
    return Boolean(this.dc && this.dc.readyState === "open");
  }

  send(payload) {
    if (!this.dc || this.dc.readyState !== "open") return false;
    try {
      this.dc.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  destroy() {
    try {
      this.dc?.close();
    } catch {
    }
    try {
      this.pc?.close();
    } catch {
    }
    this.dc = null;
    this.pc = null;
  }
}
