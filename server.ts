import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS_PER_ROOM = 4;
const MAX_WAVES = 27;
const P2P_SIGNAL_TTL_MS = 20 * 60 * 1000;
const MAX_P2P_SIGNALS = 2000;

const WAVE_TARGET_TIMES: Record<number, number> = {
  1: 22, 2: 26, 3: 48, 4: 32, 5: 36,
  6: 58, 7: 40, 8: 44, 9: 68, 10: 50,
  11: 55, 12: 78, 13: 60, 14: 65, 15: 88,
  16: 65, 17: 70, 18: 98, 19: 75, 20: 80,
  21: 108, 22: 85, 23: 90, 24: 118, 25: 95,
  26: 100, 27: 135,
};

const BOSS_COIN_REWARDS: Record<number, number> = {
  3: 150, 6: 220, 9: 300, 12: 400, 15: 500,
  18: 620, 21: 760, 24: 920, 27: 1200,
};

interface RoomPlayerState {
  id: string;
  name: string;
  heroId: string;
  isHost: boolean;
  ready: boolean;
  slot: number;
  alive: boolean;
  readyNextWave: boolean;
  totalDamage: number;
  x: number;
  y: number;
  facing: number;
  hp: number;
  maxHp: number;
  shield: number;
  level: number;
  moveSpeedFactor: number;
  walkCyclePhase: number;
  attackAnimTimer: number;
  attackAnimAngle: number;
  attackSwingParity: number;
  weaponSkillTimer: number;
  weaponSkillDur: number;
  weaponCritTimer: number;
  bowRecoilTimer: number;
  buffs: Record<string, unknown>;
}

interface ServerEnemy {
  id: number;
  kind: string;
  bossWave?: number;
  name: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  damage: number;
  baseDamage?: number;
  speed: number;
  baseSpeed?: number;
  xpValue: number;
  color: string;
  accentColor?: string;
  facing: number;
  phase?: number;
  stunTimer?: number;
  slowFactor?: number;
  frozenTimer?: number;
  bao_marks?: number;
  gau_quakeTimer?: number;
  tin_hasMark?: boolean;
  burnCount?: number;
}

interface Room {
  id: string;
  status: "LOBBY" | "PLAYING";
  hostId: string;
  players: Map<string, RoomPlayerState>;
  matchPlayerCount: number;
  powerMultiplier: number;
  wave: number;
  waveTotal: number;
  waveSpawned: number;
  waveKilled: number;
  waveCleared: boolean;
  waveStartTime: number;
  enemies: Map<number, ServerEnemy>;
}

interface ClientSession {
  playerId: string;
  mode: "ws" | "http";
  roomId: string | null;
  ws?: WebSocket;
  queue: unknown[];
  waiter: ((events: unknown[]) => void) | null;
  waiterTimer: ReturnType<typeof setTimeout> | null;
  lastSeen: number;
}

interface P2PSignalRecord {
  code: string;
  kind: "offer" | "answer";
  payload: string;
  forCode?: string;
  createdAt: number;
}

const rooms = new Map<string, Room>();
const sessions = new Map<string, ClientSession>();
const wsToPlayerId = new Map<WebSocket, string>();
const p2pSignals = new Map<string, P2PSignalRecord>();

function cleanupExpiredP2PSignals(now = Date.now()) {
  for (const [code, rec] of p2pSignals.entries()) {
    if (now - rec.createdAt > P2P_SIGNAL_TTL_MS) {
      p2pSignals.delete(code);
    }
  }
  while (p2pSignals.size > MAX_P2P_SIGNALS) {
    const oldestKey = p2pSignals.keys().next().value;
    if (!oldestKey) break;
    p2pSignals.delete(oldestKey);
  }
}

function generateSixDigitCode(): string {
  for (let attempt = 0; attempt < 250; attempt++) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    if (!rooms.has(code) && !p2pSignals.has(code)) return code;
  }
  return String(crypto.randomInt(100000, 1000000));
}

function generateRoomId(): string {
  return generateSixDigitCode();
}

function generatePlayerId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function computePowerMultiplier(playerCount: number): number {
  const n = Math.max(1, Math.min(MAX_PLAYERS_PER_ROOM, Math.round(playerCount)));
  return Number((1 + 0.5 * (n - 1)).toFixed(2));
}

function sanitizeName(raw: unknown, fallbackIndex = 1): string {
  if (typeof raw !== "string") return `Chiến Binh ${fallbackIndex}`;
  const cleaned = raw.trim().replace(/\s+/g, " ").slice(0, 18);
  return cleaned || `Chiến Binh ${fallbackIndex}`;
}

function getNextFreeSlot(room: Room): number {
  const used = new Set<number>();
  for (const p of room.players.values()) used.add(p.slot);
  for (let s = 0; s < MAX_PLAYERS_PER_ROOM; s++) {
    if (!used.has(s)) return s;
  }
  return room.players.size;
}

function getSpawnPosition(slot: number): { x: number; y: number } {
  const offsets = [
    { dx: -75, dy: -45 },
    { dx: 75, dy: -45 },
    { dx: -75, dy: 55 },
    { dx: 75, dy: 55 },
  ];
  const off = offsets[slot % offsets.length];
  return { x: 1000 + off.dx, y: 700 + off.dy };
}

function serializeRoom(room: Room) {
  const members = Array.from(room.players.values())
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
  const displayCount = room.status === "PLAYING" ? room.matchPlayerCount : Math.max(1, members.length);
  return {
    roomId: room.id,
    status: room.status,
    hostId: room.hostId,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    playerCount: members.length,
    matchPlayerCount: room.matchPlayerCount,
    powerMultiplier: computePowerMultiplier(displayCount),
    wave: room.wave,
    waveTotal: room.waveTotal,
    waveKilled: room.waveKilled,
    waveCleared: room.waveCleared,
    members,
  };
}

function drainSessionQueue(session: ClientSession): unknown[] {
  if (session.queue.length === 0) return [];
  return session.queue.splice(0, session.queue.length);
}

function sendToPlayer(playerId: string, data: unknown) {
  const session = sessions.get(playerId);
  if (!session) return;
  if (session.mode === "ws") {
    const ws = session.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(data));
    } catch {
    }
    return;
  }

  session.queue.push(data);
  if (session.queue.length > 220) {
    const dropIdx = session.queue.findIndex((item: any) => item?.type === "WORLD_SYNC" || item?.type === "PLAYER_STATE");
    session.queue.splice(dropIdx >= 0 ? dropIdx : 0, 1);
  }
  if (session.waiter) {
    const resolveWaiter = session.waiter;
    session.waiter = null;
    if (session.waiterTimer) {
      clearTimeout(session.waiterTimer);
      session.waiterTimer = null;
    }
    resolveWaiter(drainSessionQueue(session));
  }
}

function broadcastRoom(room: Room, data: unknown, excludePlayerId?: string) {
  for (const pid of room.players.keys()) {
    if (excludePlayerId && pid === excludePlayerId) continue;
    sendToPlayer(pid, data);
  }
}

function broadcastRoomUpdate(room: Room) {
  broadcastRoom(room, { type: "ROOM_UPDATE", room: serializeRoom(room) });
}

function checkWaveCompletion(room: Room) {
  if (room.status !== "PLAYING" || room.waveCleared) return;
  if (room.waveTotal <= 0 || room.waveSpawned < room.waveTotal) return;
  for (const enemy of room.enemies.values()) {
    if (enemy.hp > 0) return;
  }

  room.waveCleared = true;
  const elapsedSec = Math.max(0.5, (Date.now() - room.waveStartTime) / 1000);
  const baseCoins = 100 + 100 * (room.wave - 1);
  const targetSec = WAVE_TARGET_TIMES[room.wave] || 35;
  let speedCoins = 0;
  let speedText = "Bình thường";
  let speedClass = "speed-normal";

  if (elapsedSec <= targetSec * 0.6) {
    speedCoins = 40;
    speedText = "Rất nhanh · +40 Xu";
    speedClass = "speed-super";
  } else if (elapsedSec <= targetSec * 0.85) {
    speedCoins = 30;
    speedText = "Nhanh · +30 Xu";
    speedClass = "speed-fast";
  } else if (elapsedSec <= targetSec) {
    speedCoins = 20;
    speedText = "Khá nhanh · +20 Xu";
    speedClass = "speed-fair";
  } else if (elapsedSec <= targetSec * 1.35) {
    speedCoins = 10;
    speedText = "Bình thường · +10 Xu";
    speedClass = "speed-normal";
  } else {
    speedCoins = 0;
    speedText = "Chậm · +0 Xu";
    speedClass = "speed-slow";
  }

  const isBossWave =
    room.wave >= 3 && room.wave <= MAX_WAVES && room.wave % 3 === 0;
  const bossCoins = isBossWave ? BOSS_COIN_REWARDS[room.wave] || 150 : 0;
  const totalEarned = baseCoins + speedCoins + bossCoins;

  const em = Math.floor(elapsedSec / 60);
  const es = Math.floor(elapsedSec % 60);
  const tm = Math.floor(targetSec / 60);
  const ts = Math.floor(targetSec % 60);

  for (const p of room.players.values()) {
    p.alive = true;
    p.readyNextWave = p.isHost;
    if (p.maxHp > 0) p.hp = p.maxHp;
  }

  broadcastRoom(room, {
    type: "WAVE_COMPLETED",
    reward: {
      wave: room.wave,
      baseCoins,
      speedCoins,
      bossCoins,
      totalEarned,
      speedText,
      speedClass,
      elapsedFormatted: `${String(em).padStart(2, "0")}:${String(es).padStart(2, "0")}`,
      targetFormatted: `${String(tm).padStart(2, "0")}:${String(ts).padStart(2, "0")}`,
      kills: room.waveKilled,
      isFinalWave: room.wave >= MAX_WAVES,
    },
    room: serializeRoom(room),
  });
}

function checkAllPlayersDead(room: Room) {
  if (room.status !== "PLAYING" || room.players.size === 0) return;
  for (const p of room.players.values()) {
    if (p.alive && p.hp > 0) return;
  }
  room.status = "LOBBY";
  for (const p of room.players.values()) {
    p.ready = p.isHost;
    p.alive = true;
  }
  broadcastRoom(room, {
    type: "MATCH_OVER",
    victory: false,
    wave: room.wave,
    room: serializeRoom(room),
  });
}

function removePlayerFromCurrentRoom(playerId: string) {
  const session = sessions.get(playerId);
  const currentRoomId = session?.roomId || null;
  if (session) session.roomId = null;
  if (!currentRoomId) return;

  const room = rooms.get(currentRoomId);
  if (!room) return;

  room.players.delete(playerId);

  if (room.players.size === 0) {
    rooms.delete(room.id);
    return;
  }

  if (room.hostId === playerId) {
    const nextHost = Array.from(room.players.values()).sort((a, b) => a.slot - b.slot)[0];
    if (nextHost) {
      room.hostId = nextHost.id;
      nextHost.isHost = true;
      nextHost.ready = true;
      nextHost.readyNextWave = true;
    }
  }

  broadcastRoom(room, {
    type: "PLAYER_LEFT",
    playerId,
    newHostId: room.hostId,
    room: serializeRoom(room),
  });

  if (room.status === "PLAYING") {
    checkAllPlayersDead(room);
  }
}

function startRoomMatch(room: Room) {
  room.status = "PLAYING";
  room.matchPlayerCount = Math.max(1, room.players.size);
  room.powerMultiplier = computePowerMultiplier(room.matchPlayerCount);
  room.wave = 1;
  room.waveTotal = 10;
  room.waveSpawned = 0;
  room.waveKilled = 0;
  room.waveCleared = false;
  room.waveStartTime = Date.now();
  room.enemies.clear();

  const spawns: Record<string, { x: number; y: number; slot: number }> = {};
  for (const p of room.players.values()) {
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

  broadcastRoom(room, {
    type: "MATCH_STARTED",
    room: serializeRoom(room),
    wave: 1,
    playerCount: room.matchPlayerCount,
    powerMultiplier: room.powerMultiplier,
    spawns,
  });
}

function handleClientMessage(playerId: string, msg: Record<string, any>) {
  if (!msg || typeof msg.type !== "string") return;
  const session = sessions.get(playerId);
  if (!session) return;
  session.lastSeen = Date.now();

  if (msg.type === "PING") {
    sendToPlayer(playerId, { type: "PONG", ts: Date.now() });
    return;
  }

  if (msg.type === "CREATE_ROOM") {
    removePlayerFromCurrentRoom(playerId);
    const roomId = generateRoomId();
    const heroId = typeof msg.heroId === "string" && msg.heroId ? msg.heroId : "eohyen";
    const name = sanitizeName(msg.playerName, 1);
    const pos = getSpawnPosition(0);

    const hostPlayer: RoomPlayerState = {
      id: playerId,
      name,
      heroId,
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
    };

    const room: Room = {
      id: roomId,
      status: "LOBBY",
      hostId: playerId,
      players: new Map([[playerId, hostPlayer]]),
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

    rooms.set(roomId, room);
    session.roomId = roomId;
    sendToPlayer(playerId, {
      type: "ROOM_JOINED",
      playerId,
      room: serializeRoom(room),
    });
    return;
  }

  if (msg.type === "JOIN_ROOM") {
    const code = String(msg.roomId || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      sendToPlayer(playerId, { type: "ROOM_ERROR", message: `Không tìm thấy phòng "${code}".` });
      return;
    }
    if (room.status !== "LOBBY") {
      sendToPlayer(playerId, { type: "ROOM_ERROR", message: "Phòng này đang trong trận đấu." });
      return;
    }
    if (room.players.size >= MAX_PLAYERS_PER_ROOM && !room.players.has(playerId)) {
      sendToPlayer(playerId, { type: "ROOM_ERROR", message: "Phòng đã đầy (tối đa 4 người chơi)." });
      return;
    }

    if (session.roomId && session.roomId !== code) {
      removePlayerFromCurrentRoom(playerId);
    }

    const slot = getNextFreeSlot(room);
    const heroId = typeof msg.heroId === "string" && msg.heroId ? msg.heroId : "dung";
    const name = sanitizeName(msg.playerName, slot + 1);
    const pos = getSpawnPosition(slot);

    const joinedPlayer: RoomPlayerState = {
      id: playerId,
      name,
      heroId,
      isHost: false,
      ready: false,
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

    room.players.set(playerId, joinedPlayer);
    session.roomId = code;

    sendToPlayer(playerId, {
      type: "ROOM_JOINED",
      playerId,
      room: serializeRoom(room),
    });
    broadcastRoom(room, { type: "ROOM_UPDATE", room: serializeRoom(room) }, playerId);
    return;
  }

  if (msg.type === "LEAVE_ROOM") {
    removePlayerFromCurrentRoom(playerId);
    sendToPlayer(playerId, { type: "LEFT_ROOM" });
    return;
  }

  const room = session.roomId ? rooms.get(session.roomId) : undefined;
  if (!room) return;
  const player = room.players.get(playerId);
  if (!player) return;

  if (msg.type === "SELECT_HERO") {
    if (typeof msg.heroId === "string" && msg.heroId) {
      player.heroId = msg.heroId;
      broadcastRoomUpdate(room);
    }
    return;
  }

  if (msg.type === "SET_NAME") {
    player.name = sanitizeName(msg.playerName, player.slot + 1);
    broadcastRoomUpdate(room);
    return;
  }

  if (msg.type === "TOGGLE_READY") {
    if (room.status !== "LOBBY") return;
    player.ready = typeof msg.ready === "boolean" ? msg.ready : !player.ready;
    broadcastRoomUpdate(room);
    return;
  }

  if (msg.type === "START_MATCH") {
    if (room.hostId !== playerId) {
      sendToPlayer(playerId, { type: "ROOM_ERROR", message: "Chỉ đội trưởng mới có thể bắt đầu trận." });
      return;
    }
    if (room.status !== "LOBBY") return;
    const notReady = Array.from(room.players.values()).filter((p) => !p.isHost && !p.ready);
    if (notReady.length > 0) {
      sendToPlayer(playerId, {
        type: "ROOM_ERROR",
        message: `Chờ ${notReady.map((p) => p.name).join(", ")} nhấn Sẵn sàng!`,
      });
      return;
    }
    startRoomMatch(room);
    return;
  }

  if (msg.type === "RESTART_MATCH") {
    if (room.hostId !== playerId) return;
    startRoomMatch(room);
    return;
  }

  if (room.status !== "PLAYING") return;

  if (msg.type === "WAVE_META") {
    if (room.hostId !== playerId) return;
    room.wave = Number(msg.wave) || room.wave;
    room.waveTotal = Number(msg.waveTotal) || room.waveTotal;
    room.waveSpawned = Number(msg.waveSpawned) || 0;
    room.waveCleared = false;
    room.waveStartTime = Date.now();
    broadcastRoom(
      room,
      {
        type: "WAVE_META_SYNC",
        wave: room.wave,
        waveTotal: room.waveTotal,
        waveSpawned: room.waveSpawned,
      },
      playerId
    );
    return;
  }

  if (msg.type === "SPAWN_ENEMIES") {
    if (room.hostId !== playerId || !Array.isArray(msg.enemies)) return;
    const added: ServerEnemy[] = [];
    for (const rawEnemy of msg.enemies) {
      if (!rawEnemy || typeof rawEnemy.id !== "number") continue;
      const enemy: ServerEnemy = {
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
      room.enemies.set(enemy.id, enemy);
      added.push(enemy);
    }
    if (typeof msg.waveSpawned === "number") {
      room.waveSpawned = Math.max(room.waveSpawned, msg.waveSpawned);
    }
    if (added.length > 0) {
      broadcastRoom(
        room,
        {
          type: "ENEMIES_SPAWNED",
          enemies: added,
          waveSpawned: room.waveSpawned,
          waveTotal: room.waveTotal,
        },
        playerId
      );
    }
    return;
  }

  if (msg.type === "DAMAGE_ENEMY") {
    const enemyId = Number(msg.enemyId);
    const enemy = room.enemies.get(enemyId);
    if (!enemy || enemy.hp <= 0) return;

    const rawDmg = Math.max(1, Math.min(999999, Math.round(Number(msg.dmg) || 0)));
    if (rawDmg <= 0) return;

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
      room.enemies.delete(enemyId);
      room.waveKilled++;
    }

    broadcastRoom(room, {
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
      waveKilled: room.waveKilled,
      effects: msg.effects || null,
      quiet: Boolean(msg.quiet),
    });

    if (killed) {
      checkWaveCompletion(room);
    }
    return;
  }

  if (msg.type === "WORLD_SNAPSHOT") {
    if (room.hostId !== playerId) return;
    if (typeof msg.waveSpawned === "number") {
      room.waveSpawned = Math.max(room.waveSpawned, msg.waveSpawned);
    }

    const syncedEnemies: Array<Record<string, unknown>> = [];
    if (Array.isArray(msg.enemies)) {
      for (const e of msg.enemies) {
        if (!e || typeof e.id !== "number") continue;
        const serverEnemy = room.enemies.get(e.id);
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

    broadcastRoom(
      room,
      {
        type: "WORLD_SYNC",
        wave: room.wave,
        waveTotal: room.waveTotal,
        waveSpawned: room.waveSpawned,
        waveKilled: room.waveKilled,
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

    broadcastRoom(
      room,
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
      broadcastRoom(room, {
        type: "PLAYER_DOWNED",
        playerId: player.id,
        playerName: player.name,
        room: serializeRoom(room),
      });
      checkAllPlayersDead(room);
    }
    return;
  }

  if (msg.type === "PLAYER_VFX") {
    if (!Array.isArray(msg.events) || msg.events.length === 0) return;
    broadcastRoom(
      room,
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
    if (!room.waveCleared) return;
    player.readyNextWave = typeof msg.ready === "boolean" ? msg.ready : true;
    broadcastRoomUpdate(room);
    return;
  }

  if (msg.type === "NEXT_WAVE") {
    if (room.hostId !== playerId || !room.waveCleared) return;
    if (room.wave >= MAX_WAVES) {
      room.status = "LOBBY";
      for (const p of room.players.values()) {
        p.ready = p.isHost;
        p.alive = true;
      }
      broadcastRoom(room, {
        type: "MATCH_OVER",
        victory: true,
        wave: room.wave,
        room: serializeRoom(room),
      });
      return;
    }
    room.wave += 1;
    room.waveSpawned = 0;
    room.waveKilled = 0;
    room.waveCleared = false;
    room.waveStartTime = Date.now();
    room.enemies.clear();
    for (const p of room.players.values()) {
      p.alive = true;
      p.readyNextWave = false;
      if (p.maxHp > 0) p.hp = p.maxHp;
    }
    broadcastRoom(room, {
      type: "WAVE_STARTED",
      wave: room.wave,
      room: serializeRoom(room),
    });
  }
}

async function createApp() {
  const app = express();
  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, rooms: rooms.size, sessions: sessions.size });
  });

  app.get("/api/rooms/:roomId", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const code = String(req.params.roomId || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ exists: false, error: "Không tìm thấy phòng." });
      return;
    }
    res.json({ exists: true, room: serializeRoom(room) });
  });

  app.post("/api/p2p/signal", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    cleanupExpiredP2PSignals();
    const kind = req.body?.kind === "answer" ? "answer" : req.body?.kind === "offer" ? "offer" : "";
    const payload = typeof req.body?.payload === "string" ? req.body.payload.trim() : "";
    const forCode = typeof req.body?.forCode === "string" ? req.body.forCode.trim() : undefined;

    if (!kind) {
      res.status(400).json({ ok: false, message: "Loại tín hiệu P2P không hợp lệ." });
      return;
    }
    if (!/^AH1[GJ]:[A-Za-z0-9_-]{8,}$/i.test(payload) || payload.length > 32768) {
      res.status(400).json({ ok: false, message: "Dữ liệu tín hiệu P2P không hợp lệ." });
      return;
    }

    const code = generateSixDigitCode();
    p2pSignals.set(code, {
      code,
      kind,
      payload,
      forCode,
      createdAt: Date.now(),
    });
    res.json({
      ok: true,
      code,
      kind,
      expiresInSec: Math.round(P2P_SIGNAL_TTL_MS / 1000),
    });
  });

  app.get("/api/p2p/signal/:code", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    cleanupExpiredP2PSignals();
    const code = String(req.params.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ ok: false, message: "Mã P2P phải gồm đúng 6 chữ số." });
      return;
    }
    const rec = p2pSignals.get(code);
    if (!rec) {
      res.status(404).json({ ok: false, message: `Không tìm thấy mã ${code} hoặc mã đã hết hạn.` });
      return;
    }
    res.json({
      ok: true,
      code: rec.code,
      kind: rec.kind,
      payload: rec.payload,
      forCode: rec.forCode || null,
    });
  });

  app.post("/api/coop/connect", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const playerId = generatePlayerId();
    const session: ClientSession = {
      playerId,
      mode: "http",
      roomId: null,
      queue: [],
      waiter: null,
      waiterTimer: null,
      lastSeen: Date.now(),
    };
    sessions.set(playerId, session);
    sendToPlayer(playerId, { type: "CONNECTED", playerId });
    res.json({ ok: true, playerId, events: drainSessionQueue(session) });
  });

  app.post("/api/coop/send", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : "";
    const session = sessions.get(playerId);
    if (!session || session.mode !== "http") {
      res.status(404).json({ ok: false, expired: true, message: "Phiên Co-op không tồn tại hoặc đã hết hạn." });
      return;
    }
    session.lastSeen = Date.now();
    const list: Array<Record<string, any>> = Array.isArray(req.body?.messages)
      ? req.body.messages
      : req.body?.payload && typeof req.body.payload === "object"
      ? [req.body.payload]
      : [];

    for (const msg of list) {
      if (msg && typeof msg === "object") {
        handleClientMessage(playerId, msg);
      }
    }
    res.json({ ok: true, events: drainSessionQueue(session) });
  });

  app.get("/api/coop/poll", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const playerId = typeof req.query.playerId === "string" ? req.query.playerId : "";
    const session = sessions.get(playerId);
    if (!session || session.mode !== "http") {
      res.status(404).json({ ok: false, expired: true });
      return;
    }
    session.lastSeen = Date.now();

    const immediate = drainSessionQueue(session);
    const waitMs = Math.max(0, Math.min(2500, Number(req.query.wait) || 1500));
    if (immediate.length > 0 || waitMs === 0) {
      res.json({ ok: true, events: immediate });
      return;
    }

    if (session.waiter) {
      const prevWaiter = session.waiter;
      session.waiter = null;
      if (session.waiterTimer) {
        clearTimeout(session.waiterTimer);
        session.waiterTimer = null;
      }
      prevWaiter([]);
    }

    let finished = false;
    const finish = (events: unknown[]) => {
      if (finished) return;
      finished = true;
      if (session.waiter === finish) session.waiter = null;
      if (session.waiterTimer) {
        clearTimeout(session.waiterTimer);
        session.waiterTimer = null;
      }
      if (!res.headersSent) {
        res.json({ ok: true, events });
      }
    };

    session.waiter = finish;
    session.waiterTimer = setTimeout(() => finish([]), waitMs);
    req.on("close", () => {
      if (session.waiter === finish) {
        session.waiter = null;
      }
      if (session.waiterTimer) {
        clearTimeout(session.waiterTimer);
        session.waiterTimer = null;
      }
    });
  });

  app.post("/api/coop/leave", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : "";
    if (playerId && sessions.has(playerId)) {
      const session = sessions.get(playerId);
      if (session?.waiter) {
        session.waiter([]);
      }
      removePlayerFromCurrentRoom(playerId);
      sessions.delete(playerId);
    }
    res.json({ ok: true });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const aliveSockets = new WeakMap<WebSocket, boolean>();

  wss.on("error", (err) => {
    console.warn("WebSocketServer error:", err?.message || err);
  });

  server.on("upgrade", (req, socket, head) => {
    socket.on("error", () => {});
    let pathname = "/";
    try {
      pathname = new URL(req.url || "/", "http://localhost").pathname;
    } catch {
      return;
    }
    if (pathname !== "/ws") return;
    try {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } catch (err) {
      console.warn("WS upgrade failed:", err);
      try {
        socket.destroy();
      } catch {
      }
    }
  });

  const heartbeatInterval = setInterval(() => {
    for (const client of wss.clients) {
      if (aliveSockets.get(client) === false) {
        try {
          client.terminate();
        } catch {
        }
        continue;
      }
      aliveSockets.set(client, false);
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      } catch {
      }
    }

    const now = Date.now();
    cleanupExpiredP2PSignals(now);
    for (const [pid, session] of sessions.entries()) {
      if (session.mode === "http" && now - session.lastSeen > 35000) {
        if (session.waiter) {
          session.waiter([]);
        }
        removePlayerFromCurrentRoom(pid);
        sessions.delete(pid);
      }
    }
  }, 10000);

  server.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  wss.on("connection", (ws: WebSocket) => {
    aliveSockets.set(ws, true);
    ws.on("pong", () => {
      aliveSockets.set(ws, true);
    });
    const playerId = generatePlayerId();
    const session: ClientSession = {
      playerId,
      mode: "ws",
      roomId: null,
      ws,
      queue: [],
      waiter: null,
      waiterTimer: null,
      lastSeen: Date.now(),
    };
    sessions.set(playerId, session);
    wsToPlayerId.set(ws, playerId);
    sendToPlayer(playerId, { type: "CONNECTED", playerId });

    const cleanupWs = () => {
      const pid = wsToPlayerId.get(ws);
      wsToPlayerId.delete(ws);
      if (pid) {
        removePlayerFromCurrentRoom(pid);
        sessions.delete(pid);
      }
    };

    ws.on("error", cleanupWs);
    ws.on("close", cleanupWs);

    ws.on("message", (raw) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== "string") return;
      handleClientMessage(playerId, msg);
    });
  });

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const disableHmr = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server, path: "/__vite_ws" },
        ...(disableHmr ? { ws: false, watch: null } : {}),
      },
      plugins: disableHmr
        ? [
            {
              name: "disable-vite-client-ws",
              enforce: "post" as const,
              transform(code: string, id: string) {
                if (id.replace(/\\/g, "/").endsWith("/vite/dist/client/client.mjs")) {
                  return {
                    code: code
                      .replace(
                        "transport.connect(createHMRHandler(handleMessage));",
                        "/* HMR disabled: WebSocket transport suppressed */"
                      )
                      .replace(
                        /new WebSocket\(/g,
                        "/* HMR disabled */ (() => { throw new Error('HMR disabled'); })("
                      ),
                    map: null,
                  };
                }
                return null;
              },
            },
          ]
        : [],
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Arena Hero 11.8 server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
