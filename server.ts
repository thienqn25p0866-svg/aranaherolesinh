import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort(): number {
  const portIdx = process.argv.indexOf("--port");
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    const cliPort = Number(process.argv[portIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  for (const arg of process.argv) {
    if (arg.startsWith("--port=")) {
      const cliPort = Number(arg.slice("--port=".length));
      if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
    }
  }
  if (
    process.env.DEFAULT_APP_PORT &&
    process.env.NGINX_PORT &&
    process.env.PORT === process.env.NGINX_PORT
  ) {
    return Number(process.env.DEFAULT_APP_PORT) || 3000;
  }
  return Number(process.env.PORT || 3000);
}

const PORT = resolvePort();
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
  vx?: number;
  vy?: number;
  buffs: Record<string, unknown>;
}

interface ServerEnemy {
  id: number;
  kind: string;
  bossWave?: number;
  name: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
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
  castSkillIdx?: number;
  castWindupTimer?: number;
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
  isFounderVerified?: boolean;
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

interface P2PAnswerEntry {
  id: string;
  payload: string;
  createdAt: number;
}

interface P2PRelayPeer {
  peerId: string;
  toPeerQueue: unknown[];
  waiter: ((events: unknown[]) => void) | null;
  waiterTimer: ReturnType<typeof setTimeout> | null;
  lastSeen: number;
}

interface P2PRelayRoom {
  code: string;
  hostId: string;
  toHostQueue: Array<{ peerId: string; msg: unknown }>;
  hostWaiter: ((events: Array<{ peerId: string; msg: unknown }>) => void) | null;
  hostWaiterTimer: ReturnType<typeof setTimeout> | null;
  hostLastSeen: number;
  peers: Map<string, P2PRelayPeer>;
  createdAt: number;
}

const FOUNDER_HERO_ID = "thien";
const FOUNDER_EMAIL = "thien.qn25p0866@gmail.com";
const FOUNDER_PIN_SALT = "e3b2553ae0d9f0bc73bcf230afaa1b8f";
const FOUNDER_PIN_DIGEST =
  "b3c31d9e39a7ce4def22983dd52320c8e26c1b58d568d259ad6b0b41dc3008c94ccfac3326a73d4ed9dd502a244d20fdcc2e6544a4f380b9918f45fc6f44fca4";
const FOUNDER_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const FOUNDER_COOKIE_NAME = "arena_founder_token";
const FOUNDER_HMAC_SECRET = process.env.FOUNDER_AUTH_SECRET || crypto.randomBytes(32).toString("hex");
const founderVerifyAttempts = new Map<string, { count: number; resetAt: number }>();
const revokedFounderTokens = new Map<string, number>();

let cachedFirebaseApiKey: string | null = null;
function getFirebaseApiKey(): string {
  if (cachedFirebaseApiKey !== null) return cachedFirebaseApiKey;
  try {
    const cfgPath = path.join(__dirname, "firebase-applet-config.json");
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
      const key = typeof parsed?.apiKey === "string" ? parsed.apiKey : "";
      cachedFirebaseApiKey = key;
      return key;
    }
  } catch {
  }
  cachedFirebaseApiKey = "";
  return "";
}

function verifyFounderPin(rawPin: unknown): boolean {
  if (typeof rawPin !== "string") return false;
  const normalized = rawPin.trim();
  if (!/^\d{8}$/.test(normalized)) return false;
  try {
    const derived = crypto.scryptSync(normalized, FOUNDER_PIN_SALT, 64);
    const expected = Buffer.from(FOUNDER_PIN_DIGEST, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function issueFounderToken(): string {
  const payloadObj = {
    role: "founder",
    jti: crypto.randomBytes(12).toString("hex"),
    exp: Date.now() + FOUNDER_TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", FOUNDER_HMAC_SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verifyFounderToken(token: unknown): boolean {
  if (typeof token !== "string") return false;
  const trimmed = token.trim();
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx <= 0) return false;
  const payloadB64 = trimmed.slice(0, dotIdx);
  const sig = trimmed.slice(dotIdx + 1);
  if (!payloadB64 || !sig) return false;

  try {
    const expectedSig = crypto.createHmac("sha256", FOUNDER_HMAC_SECRET).update(payloadB64).digest("base64url");
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload || payload.role !== "founder" || typeof payload.exp !== "number" || typeof payload.jti !== "string") {
      return false;
    }
    const now = Date.now();
    if (payload.exp <= now) return false;
    const revokedExp = revokedFounderTokens.get(payload.jti);
    if (revokedExp && revokedExp > now) return false;
    return true;
  } catch {
    return false;
  }
}

function revokeFounderToken(token: unknown) {
  if (typeof token !== "string") return;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return;
  try {
    const payload = JSON.parse(Buffer.from(token.slice(0, dotIdx), "base64url").toString("utf8"));
    if (payload?.jti && typeof payload.exp === "number") {
      revokedFounderTokens.set(payload.jti, payload.exp);
    }
  } catch {
  }
}

function parseCookieHeader(cookieHeader: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof cookieHeader !== "string" || !cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function extractFounderTokenFromReq(req?: http.IncomingMessage | express.Request | null): string {
  if (!req) return "";
  const headerVal = req.headers?.["x-founder-token"];
  if (typeof headerVal === "string" && headerVal.trim()) {
    return headerVal.trim();
  }
  const cookies = parseCookieHeader(req.headers?.cookie);
  return cookies[FOUNDER_COOKIE_NAME] || "";
}

function isHttpsRequest(req: express.Request): boolean {
  if (req.secure) return true;
  const fwdProto = req.headers["x-forwarded-proto"];
  if (typeof fwdProto === "string") {
    const first = fwdProto.split(",")[0].trim().toLowerCase();
    if (first === "https") return true;
  }
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.startsWith("https://")) {
    return true;
  }
  return false;
}

function buildFounderCookieHeader(req: express.Request, token: string, maxAgeSec: number): string {
  const sameSite = isHttpsRequest(req) ? "SameSite=None; Secure" : "SameSite=Lax";
  return `${FOUNDER_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${sameSite}; Max-Age=${maxAgeSec}`;
}

async function verifyFirebaseFounderIdToken(idToken: unknown): Promise<boolean> {
  if (typeof idToken !== "string" || !idToken.trim()) return false;
  const apiKey = getFirebaseApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: idToken.trim() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const user = Array.isArray(data?.users) ? data.users[0] : null;
    if (!user || typeof user.email !== "string") return false;
    return user.email.trim().toLowerCase() === FOUNDER_EMAIL && user.emailVerified === true;
  } catch {
    return false;
  }
}

function getClientIp(req: express.Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) {
    return fwd.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function checkFounderRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = founderVerifyAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= 6) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

function recordFounderFailedAttempt(ip: string) {
  const now = Date.now();
  const entry = founderVerifyAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    founderVerifyAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
  } else {
    entry.count += 1;
  }
}

const rooms = new Map<string, Room>();
const sessions = new Map<string, ClientSession>();
const wsToPlayerId = new Map<WebSocket, string>();
const p2pSignals = new Map<string, P2PSignalRecord>();
const p2pAnswersByOffer = new Map<string, P2PAnswerEntry[]>();
const p2pRelayRooms = new Map<string, P2PRelayRoom>();
const P2P_RELAY_TTL_MS = 12 * 60 * 1000;

function cleanupExpiredP2PSignals(now = Date.now()) {
  for (const [code, rec] of p2pSignals.entries()) {
    if (now - rec.createdAt > P2P_SIGNAL_TTL_MS) {
      p2pSignals.delete(code);
    }
  }
  for (const [offerCode, list] of p2pAnswersByOffer.entries()) {
    const fresh = list.filter((item) => now - item.createdAt <= P2P_SIGNAL_TTL_MS);
    if (fresh.length === 0) {
      p2pAnswersByOffer.delete(offerCode);
    } else if (fresh.length !== list.length) {
      p2pAnswersByOffer.set(offerCode, fresh);
    }
  }
  for (const [code, rRoom] of p2pRelayRooms.entries()) {
    for (const [pid, rPeer] of rRoom.peers.entries()) {
      if (now - rPeer.lastSeen > 65000) {
        if (rPeer.waiterTimer) clearTimeout(rPeer.waiterTimer);
        if (rPeer.waiter) rPeer.waiter([]);
        rRoom.peers.delete(pid);
      }
    }
    const staleHost = now - rRoom.hostLastSeen > P2P_RELAY_TTL_MS && rRoom.peers.size === 0;
    const tooOld = now - rRoom.createdAt > P2P_SIGNAL_TTL_MS;
    if (staleHost || tooOld) {
      if (rRoom.hostWaiterTimer) clearTimeout(rRoom.hostWaiterTimer);
      if (rRoom.hostWaiter) rRoom.hostWaiter([]);
      for (const rPeer of rRoom.peers.values()) {
        if (rPeer.waiterTimer) clearTimeout(rPeer.waiterTimer);
        if (rPeer.waiter) rPeer.waiter([]);
      }
      p2pRelayRooms.delete(code);
    }
  }
  while (p2pSignals.size > MAX_P2P_SIGNALS) {
    const oldestKey = p2pSignals.keys().next().value;
    if (!oldestKey) break;
    p2pSignals.delete(oldestKey);
  }
}

function getOrCreateP2PRelayRoom(code: string, hostId = ""): P2PRelayRoom {
  let rRoom = p2pRelayRooms.get(code);
  const now = Date.now();
  if (!rRoom) {
    rRoom = {
      code,
      hostId,
      toHostQueue: [],
      hostWaiter: null,
      hostWaiterTimer: null,
      hostLastSeen: now,
      peers: new Map(),
      createdAt: now,
    };
    p2pRelayRooms.set(code, rRoom);
  } else if (hostId && !rRoom.hostId) {
    rRoom.hostId = hostId;
  }
  return rRoom;
}

function enqueueRelayToPeer(peer: P2PRelayPeer, payload: any) {
  if (!payload || typeof payload !== "object") return;
  const pType = payload.type;
  if (pType === "WORLD_SYNC") {
    for (let i = peer.toPeerQueue.length - 1; i >= 0; i--) {
      if ((peer.toPeerQueue[i] as any)?.type === "WORLD_SYNC") {
        peer.toPeerQueue.splice(i, 1);
      }
    }
  } else if (pType === "PLAYER_STATE" && payload.player?.id) {
    const pid = payload.player.id;
    for (let i = peer.toPeerQueue.length - 1; i >= 0; i--) {
      const q = peer.toPeerQueue[i] as any;
      if (q?.type === "PLAYER_STATE" && q?.player?.id === pid) {
        peer.toPeerQueue.splice(i, 1);
      }
    }
  }
  peer.toPeerQueue.push(payload);
  if (peer.toPeerQueue.length > 180) {
    const idx = peer.toPeerQueue.findIndex((x: any) => x?.type === "WORLD_SYNC" || x?.type === "PLAYER_STATE");
    peer.toPeerQueue.splice(idx >= 0 ? idx : 0, 1);
  }
  if (peer.waiter) {
    const w = peer.waiter;
    peer.waiter = null;
    if (peer.waiterTimer) {
      clearTimeout(peer.waiterTimer);
      peer.waiterTimer = null;
    }
    w(peer.toPeerQueue.splice(0, peer.toPeerQueue.length));
  }
}

function enqueueRelayToHost(rRoom: P2PRelayRoom, peerId: string, msg: any) {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "SYNC_PLAYER") {
    for (let i = rRoom.toHostQueue.length - 1; i >= 0; i--) {
      const item = rRoom.toHostQueue[i];
      if (item.peerId === peerId && (item.msg as any)?.type === "SYNC_PLAYER") {
        rRoom.toHostQueue.splice(i, 1);
      }
    }
  }
  rRoom.toHostQueue.push({ peerId, msg });
  if (rRoom.toHostQueue.length > 220) {
    const idx = rRoom.toHostQueue.findIndex((x) => (x.msg as any)?.type === "SYNC_PLAYER");
    rRoom.toHostQueue.splice(idx >= 0 ? idx : 0, 1);
  }
  if (rRoom.hostWaiter) {
    const w = rRoom.hostWaiter;
    rRoom.hostWaiter = null;
    if (rRoom.hostWaiterTimer) {
      clearTimeout(rRoom.hostWaiterTimer);
      rRoom.hostWaiterTimer = null;
    }
    w(rRoom.toHostQueue.splice(0, rRoom.toHostQueue.length));
  }
}

function generateSixDigitCode(): string {
  for (let attempt = 0; attempt < 250; attempt++) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    if (!rooms.has(code) && !p2pSignals.has(code)) return code;
  }
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
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
  if (session.queue.length > 260) {
    const dropIdx = session.queue.findIndex(
      (item: any) => item?.type === "WORLD_SYNC" || item?.type === "PLAYER_STATE"
    );
    if (dropIdx >= 0) {
      session.queue.splice(dropIdx, 1);
    } else {
      const nonCriticalIdx = session.queue.findIndex(
        (item: any) =>
          !["ENEMIES_SPAWNED", "WAVE_STARTED", "WAVE_META_SYNC", "PLAYER_VFX", "REMOTE_VFX", "ALLY_SUPPORT", "MATCH_OVER"].includes(
            item?.type
          )
      );
      if (nonCriticalIdx >= 0) {
        session.queue.splice(nonCriticalIdx, 1);
      } else {
        session.queue.shift();
      }
    }
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

  if (msg.type === "AUTH_FOUNDER") {
    const ok = verifyFounderToken(msg.founderToken) || verifyFounderPin(msg.pin);
    if (ok) {
      session.isFounderVerified = true;
      sendToPlayer(playerId, { type: "FOUNDER_AUTH_RESULT", unlocked: true });
    } else {
      sendToPlayer(playerId, { type: "FOUNDER_AUTH_RESULT", unlocked: false, message: "Xác thực Nhà Sáng Lập thất bại." });
    }
    return;
  }

  if (typeof msg.founderToken === "string" && verifyFounderToken(msg.founderToken)) {
    session.isFounderVerified = true;
  }

  if (msg.type === "CREATE_ROOM") {
    const heroId = typeof msg.heroId === "string" && msg.heroId ? msg.heroId : "eohyen";
    if (heroId === FOUNDER_HERO_ID && !session.isFounderVerified) {
      sendToPlayer(playerId, {
        type: "ROOM_ERROR",
        code: "FOUNDER_LOCKED",
        message: "Tướng bí mật THIÊN chỉ dành cho Nhà Sáng Lập. Vui lòng nhập mật khẩu xác thực.",
      });
      return;
    }
    removePlayerFromCurrentRoom(playerId);
    const roomId = generateRoomId();
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
    const heroId = typeof msg.heroId === "string" && msg.heroId ? msg.heroId : "dung";
    if (heroId === FOUNDER_HERO_ID && !session.isFounderVerified) {
      sendToPlayer(playerId, {
        type: "ROOM_ERROR",
        code: "FOUNDER_LOCKED",
        message: "Tướng bí mật THIÊN chỉ dành cho Nhà Sáng Lập. Vui lòng nhập mật khẩu xác thực.",
      });
      return;
    }
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
      if (msg.heroId === FOUNDER_HERO_ID && !session.isFounderVerified) {
        sendToPlayer(playerId, {
          type: "ROOM_ERROR",
          code: "FOUNDER_LOCKED",
          message: "Tướng bí mật THIÊN chỉ dành cho Nhà Sáng Lập. Vui lòng xác thực mật khẩu!",
        });
        return;
      }
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
    for (const rp of room.players.values()) {
      if (rp.heroId === FOUNDER_HERO_ID && !sessions.get(rp.id)?.isFounderVerified) {
        sendToPlayer(playerId, {
          type: "ROOM_ERROR",
          code: "FOUNDER_LOCKED",
          message: `${rp.name} chưa xác thực quyền Nhà Sáng Lập để dùng tướng THIÊN!`,
        });
        return;
      }
    }
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
    for (const rp of room.players.values()) {
      if (rp.heroId === FOUNDER_HERO_ID && !sessions.get(rp.id)?.isFounderVerified) {
        sendToPlayer(playerId, {
          type: "ROOM_ERROR",
          code: "FOUNDER_LOCKED",
          message: `${rp.name} chưa xác thực quyền Nhà Sáng Lập để dùng tướng THIÊN!`,
        });
        return;
      }
    }
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
          wave: room.wave,
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
    if (typeof msg.wave === "number" && msg.wave !== room.wave) return;
    if (typeof msg.waveSpawned === "number") {
      room.waveSpawned = Math.max(room.waveSpawned, msg.waveSpawned);
    }

    const syncedEnemies: Array<Record<string, unknown>> = [];
    const seenIds = new Set<number>();
    if (Array.isArray(msg.enemies)) {
      for (const e of msg.enemies) {
        if (!e || typeof e.id !== "number") continue;
        seenIds.add(e.id);
        let serverEnemy = room.enemies.get(e.id);
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
          room.enemies.set(serverEnemy.id, serverEnemy);
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

        syncedEnemies.push({
          id: serverEnemy.id,
          kind: serverEnemy.kind,
          bossWave: serverEnemy.bossWave,
          name: serverEnemy.name,
          radius: serverEnemy.radius,
          color: serverEnemy.color,
          accentColor: serverEnemy.accentColor,
          speed: serverEnemy.speed,
          damage: serverEnemy.damage,
          xpValue: serverEnemy.xpValue,
          x: Math.round(serverEnemy.x * 10) / 10,
          y: Math.round(serverEnemy.y * 10) / 10,
          vx: Math.round((serverEnemy.vx || 0)),
          vy: Math.round((serverEnemy.vy || 0)),
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
        });
      }
    }

    if (msg.fullList === true) {
      for (const existingId of room.enemies.keys()) {
        if (!seenIds.has(existingId)) {
          room.enemies.delete(existingId);
        }
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
    const s = msg.state;
    if (!s || typeof s !== "object") return;
    const wasAlive = player.alive;
    player.x = Math.max(20, Math.min(1980, Number(s.x) || player.x));
    player.y = Math.max(20, Math.min(1380, Number(s.y) || player.y));
    player.vx = Number(s.vx) || 0;
    player.vy = Number(s.vy) || 0;
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
          vx: player.vx,
          vy: player.vy,
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
        events: msg.events.slice(0, 120),
      },
      playerId
    );
    return;
  }

  if (msg.type === "ALLY_SUPPORT") {
    if (!player.alive) return;
    broadcastRoom(
      room,
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
    const target = room.players.get(targetId);
    if (!target || target.alive) return;
    target.alive = true;
    target.hp = Math.max(1, Math.round((target.maxHp || 900) * 0.45));
    target.shield = Math.max(target.shield || 0, Math.round((target.maxHp || 900) * 0.2));
    broadcastRoom(room, {
      type: "PLAYER_REVIVED",
      targetPlayerId: target.id,
      targetName: target.name,
      byPlayerId: player.id,
      byName: player.name,
      hp: target.hp,
      shield: target.shield,
      x: target.x,
      y: target.y,
      room: serializeRoom(room),
    });
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
    const origin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Founder-Token");
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

  const authBridgeResults = new Map<
    string,
    {
      user: {
        uid: string;
        email: string | null;
        emailVerified: boolean;
        displayName: string | null;
        photoURL: string | null;
      };
      idToken: string;
      expiresAt: number;
      createdAt: number;
    }
  >();

  app.post("/api/auth-bridge/complete", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const now = Date.now();
    for (const [k, v] of authBridgeResults.entries()) {
      if (now - v.createdAt > 180_000) authBridgeResults.delete(k);
    }

    const sid = typeof req.body?.sid === "string" ? req.body.sid.trim() : "";
    const idToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
    const rawUser = req.body?.user;
    if (!/^[a-zA-Z0-9_-]{12,64}$/.test(sid) || !idToken || !rawUser?.uid) {
      res.status(400).json({ ok: false, message: "Thiếu dữ liệu xác thực cầu nối." });
      return;
    }

    const apiKey = getFirebaseApiKey();
    if (apiKey) {
      try {
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }
        );
        if (!lookupRes.ok) {
          res.status(401).json({ ok: false, message: "Firebase ID Token không hợp lệ." });
          return;
        }
        const lookupData = await lookupRes.json();
        const verifiedUser = Array.isArray(lookupData?.users) ? lookupData.users[0] : null;
        if (!verifiedUser || verifiedUser.localId !== String(rawUser.uid)) {
          res.status(401).json({ ok: false, message: "Thông tin tài khoản không khớp token." });
          return;
        }
      } catch {
        res.status(502).json({ ok: false, message: "Không thể xác minh token Firebase." });
        return;
      }
    }

    authBridgeResults.set(sid, {
      user: {
        uid: String(rawUser.uid),
        email: rawUser.email ? String(rawUser.email) : null,
        emailVerified: Boolean(rawUser.emailVerified),
        displayName: rawUser.displayName ? String(rawUser.displayName) : null,
        photoURL: rawUser.photoURL ? String(rawUser.photoURL) : null,
      },
      idToken,
      expiresAt: typeof req.body?.expiresAt === "number" ? req.body.expiresAt : now + 50 * 60 * 1000,
      createdAt: now,
    });
    res.json({ ok: true });
  });

  app.get("/api/auth-bridge/poll", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const sid = typeof req.query.sid === "string" ? req.query.sid.trim() : "";
    if (!/^[a-zA-Z0-9_-]{12,64}$/.test(sid)) {
      res.status(400).json({ ok: false, pending: false });
      return;
    }
    const now = Date.now();
    for (const [k, v] of authBridgeResults.entries()) {
      if (now - v.createdAt > 180_000) authBridgeResults.delete(k);
    }
    const entry = authBridgeResults.get(sid);
    if (!entry) {
      res.json({ ok: true, pending: true });
      return;
    }
    authBridgeResults.delete(sid);
    res.json({
      ok: true,
      pending: false,
      user: entry.user,
      idToken: entry.idToken,
      expiresAt: entry.expiresAt,
    });
  });

  app.get("/api/founder/status", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const token = extractFounderTokenFromReq(req);
    const unlocked = verifyFounderToken(token);
    res.json({ ok: true, unlocked, founderToken: unlocked ? token : "" });
  });

  app.post("/api/founder/verify", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const ip = getClientIp(req);
    const limit = checkFounderRateLimit(ip);
    if (!limit.allowed) {
      res.status(429).json({
        ok: false,
        unlocked: false,
        message: `Thử sai quá nhiều lần. Vui lòng đợi ${limit.retryAfterSec} giây.`,
      });
      return;
    }

    const pin = typeof req.body?.pin === "string" ? req.body.pin : "";
    const firebaseIdToken = typeof req.body?.firebaseIdToken === "string" ? req.body.firebaseIdToken : "";

    let verified = false;
    if (pin) {
      verified = verifyFounderPin(pin);
    } else if (firebaseIdToken) {
      verified = await verifyFirebaseFounderIdToken(firebaseIdToken);
    }

    if (!verified) {
      recordFounderFailedAttempt(ip);
      res.status(401).json({
        ok: false,
        unlocked: false,
        message: pin
          ? "Mật khẩu Nhà Sáng Lập không chính xác."
          : "Tài khoản Google này không có quyền Nhà Sáng Lập.",
      });
      return;
    }

    founderVerifyAttempts.delete(ip);
    const founderToken = issueFounderToken();
    const maxAgeSec = Math.floor(FOUNDER_TOKEN_TTL_MS / 1000);
    res.setHeader("Set-Cookie", buildFounderCookieHeader(req, founderToken, maxAgeSec));
    res.json({ ok: true, unlocked: true, founderToken });
  });

  app.post("/api/founder/logout", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const token = extractFounderTokenFromReq(req);
    if (token) revokeFounderToken(token);
    res.setHeader("Set-Cookie", buildFounderCookieHeader(req, "", 0));
    res.json({ ok: true, unlocked: false });
  });

  app.get("/api/lan-info", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const lanUrls: string[] = [];
    try {
      const ifaces = os.networkInterfaces();
      for (const ifaceList of Object.values(ifaces)) {
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
          if (iface && iface.family === "IPv4" && !iface.internal && iface.address) {
            const url = `http://${iface.address}:${PORT}`;
            if (!lanUrls.includes(url)) lanUrls.push(url);
          }
        }
      }
    } catch {
    }
    res.json({ ok: true, port: PORT, lanUrls });
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
    const rawDesired = typeof req.body?.desiredCode === "string" ? req.body.desiredCode.trim() : "";

    if (!kind) {
      res.status(400).json({ ok: false, message: "Loại tín hiệu P2P không hợp lệ." });
      return;
    }
    if (!/^AH1[GJR]:[A-Za-z0-9_-]{8,}$/i.test(payload) || payload.length > 32768) {
      res.status(400).json({ ok: false, message: "Dữ liệu tín hiệu P2P không hợp lệ." });
      return;
    }

    let code = "";
    if (kind === "offer" && /^\d{6}$/.test(rawDesired) && !rooms.has(rawDesired) && !p2pSignals.has(rawDesired)) {
      code = rawDesired;
    } else {
      code = generateSixDigitCode();
    }

    const now = Date.now();
    p2pSignals.set(code, {
      code,
      kind,
      payload,
      forCode,
      createdAt: now,
    });

    if (kind === "offer") {
      getOrCreateP2PRelayRoom(code);
    }

    if (kind === "answer" && forCode && /^\d{6}$/.test(forCode)) {
      const list = p2pAnswersByOffer.get(forCode) || [];
      if (!list.some((item) => item.payload === payload)) {
        list.push({
          id: `${now}_${Math.random().toString(36).slice(2, 7)}`,
          payload,
          createdAt: now,
        });
        if (list.length > 16) list.shift();
        p2pAnswersByOffer.set(forCode, list);
      }
    }

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

  app.get("/api/p2p/signal/:code/answers", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    cleanupExpiredP2PSignals();
    const code = String(req.params.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ ok: false, answers: [] });
      return;
    }
    const list = p2pAnswersByOffer.get(code) || [];
    if (list.length > 0) {
      p2pAnswersByOffer.delete(code);
    }
    res.json({ ok: true, answers: list });
  });

  app.post("/api/p2p/relay", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const code = String(req.body?.code || "").trim();
    const role = req.body?.role === "host" ? "host" : req.body?.role === "peer" ? "peer" : "";
    const peerId = typeof req.body?.peerId === "string" ? req.body.peerId.trim() : "";
    if (!/^\d{6}$/.test(code) || !role) {
      res.status(400).json({ ok: false, message: "Tham số P2P Relay không hợp lệ." });
      return;
    }

    const rRoom = getOrCreateP2PRelayRoom(code, role === "host" ? peerId : "");
    const now = Date.now();

    if (role === "host") {
      rRoom.hostLastSeen = now;
      if (peerId) rRoom.hostId = peerId;
      const items: Array<Record<string, any>> = Array.isArray(req.body?.messages)
        ? req.body.messages
        : req.body?.payload && typeof req.body.payload === "object"
        ? [{ targetPeerId: req.body?.targetPeerId, payload: req.body.payload }]
        : [];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const payload = item.payload && typeof item.payload === "object" ? item.payload : item;
        const targetId = typeof item.targetPeerId === "string" ? item.targetPeerId : "";
        if (targetId) {
          const peer = rRoom.peers.get(targetId);
          if (peer) enqueueRelayToPeer(peer, payload);
        } else if (item.broadcast) {
          const exclude = typeof item.excludePeerId === "string" ? item.excludePeerId : "";
          for (const [pid, peer] of rRoom.peers.entries()) {
            if (exclude && pid === exclude) continue;
            enqueueRelayToPeer(peer, payload);
          }
        }
      }
      const events = rRoom.toHostQueue.splice(0, rRoom.toHostQueue.length);
      res.json({ ok: true, events, peerCount: rRoom.peers.size });
      return;
    }

    if (!peerId) {
      res.status(400).json({ ok: false, message: "Thiếu peerId cho P2P Relay." });
      return;
    }
    let peer = rRoom.peers.get(peerId);
    if (!peer) {
      peer = {
        peerId,
        toPeerQueue: [],
        waiter: null,
        waiterTimer: null,
        lastSeen: now,
      };
      rRoom.peers.set(peerId, peer);
    } else {
      peer.lastSeen = now;
    }

    const msgs: Array<Record<string, any>> = Array.isArray(req.body?.messages)
      ? req.body.messages
      : req.body?.message && typeof req.body.message === "object"
      ? [req.body.message]
      : req.body?.payload && typeof req.body.payload === "object"
      ? [req.body.payload]
      : [];
    for (const m of msgs) {
      if (m && typeof m === "object") {
        enqueueRelayToHost(rRoom, peerId, m);
      }
    }
    const events = peer.toPeerQueue.splice(0, peer.toPeerQueue.length);
    res.json({ ok: true, events });
  });

  app.get("/api/p2p/relay/:code/poll", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const code = String(req.params.code || "").trim();
    const role = req.query.role === "host" ? "host" : req.query.role === "peer" ? "peer" : "";
    const peerId = typeof req.query.peerId === "string" ? req.query.peerId.trim() : "";
    if (!/^\d{6}$/.test(code) || !role) {
      res.status(400).json({ ok: false, events: [] });
      return;
    }

    let rRoom = p2pRelayRooms.get(code);
    if (!rRoom && (role === "host" || p2pSignals.has(code))) {
      rRoom = getOrCreateP2PRelayRoom(code, role === "host" ? peerId : "");
    }
    if (!rRoom) {
      res.status(404).json({ ok: false, expired: true, events: [] });
      return;
    }

    const waitMs = Math.max(0, Math.min(2200, Number(req.query.wait) || 1600));
    const now = Date.now();

    if (role === "host") {
      rRoom.hostLastSeen = now;
      if (rRoom.toHostQueue.length > 0 || waitMs === 0) {
        res.json({ ok: true, events: rRoom.toHostQueue.splice(0, rRoom.toHostQueue.length), peerCount: rRoom.peers.size });
        return;
      }
      if (rRoom.hostWaiter) {
        const prev = rRoom.hostWaiter;
        rRoom.hostWaiter = null;
        if (rRoom.hostWaiterTimer) {
          clearTimeout(rRoom.hostWaiterTimer);
          rRoom.hostWaiterTimer = null;
        }
        prev([]);
      }
      let finished = false;
      const finish = (events: Array<{ peerId: string; msg: unknown }>) => {
        if (finished) return;
        finished = true;
        if (rRoom!.hostWaiter === finish) rRoom!.hostWaiter = null;
        if (rRoom!.hostWaiterTimer) {
          clearTimeout(rRoom!.hostWaiterTimer);
          rRoom!.hostWaiterTimer = null;
        }
        if (!res.headersSent) {
          res.json({ ok: true, events, peerCount: rRoom!.peers.size });
        }
      };
      rRoom.hostWaiter = finish;
      rRoom.hostWaiterTimer = setTimeout(() => finish([]), waitMs);
      req.on("close", () => {
        if (rRoom?.hostWaiter === finish) rRoom.hostWaiter = null;
        if (rRoom?.hostWaiterTimer) {
          clearTimeout(rRoom.hostWaiterTimer);
          rRoom.hostWaiterTimer = null;
        }
      });
      return;
    }

    if (!peerId) {
      res.status(400).json({ ok: false, events: [] });
      return;
    }
    let peer = rRoom.peers.get(peerId);
    if (!peer) {
      peer = {
        peerId,
        toPeerQueue: [],
        waiter: null,
        waiterTimer: null,
        lastSeen: now,
      };
      rRoom.peers.set(peerId, peer);
    } else {
      peer.lastSeen = now;
    }

    if (peer.toPeerQueue.length > 0 || waitMs === 0) {
      res.json({ ok: true, events: peer.toPeerQueue.splice(0, peer.toPeerQueue.length) });
      return;
    }
    if (peer.waiter) {
      const prev = peer.waiter;
      peer.waiter = null;
      if (peer.waiterTimer) {
        clearTimeout(peer.waiterTimer);
        peer.waiterTimer = null;
      }
      prev([]);
    }
    let finished = false;
    const finish = (events: unknown[]) => {
      if (finished) return;
      finished = true;
      if (peer!.waiter === finish) peer!.waiter = null;
      if (peer!.waiterTimer) {
        clearTimeout(peer!.waiterTimer);
        peer!.waiterTimer = null;
      }
      if (!res.headersSent) {
        res.json({ ok: true, events });
      }
    };
    peer.waiter = finish;
    peer.waiterTimer = setTimeout(() => finish([]), waitMs);
    req.on("close", () => {
      if (peer?.waiter === finish) peer.waiter = null;
      if (peer?.waiterTimer) {
        clearTimeout(peer.waiterTimer);
        peer.waiterTimer = null;
      }
    });
  });

  app.post("/api/coop/connect", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const playerId = generatePlayerId();
    const token = extractFounderTokenFromReq(req);
    const session: ClientSession = {
      playerId,
      mode: "http",
      roomId: null,
      isFounderVerified: verifyFounderToken(token),
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

  wss.on("connection", (ws: WebSocket, req?: http.IncomingMessage) => {
    aliveSockets.set(ws, true);
    ws.on("pong", () => {
      aliveSockets.set(ws, true);
    });
    const playerId = generatePlayerId();
    const token = extractFounderTokenFromReq(req);
    const session: ClientSession = {
      playerId,
      mode: "ws",
      roomId: null,
      isFounderVerified: verifyFounderToken(token),
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

  app.use((req, res, next) => {
    if (
      req.path === "/" ||
      req.path === "/index.html" ||
      req.path.startsWith("/firebase-applet-config.json") ||
      req.path === "/src/firebase.ts"
    ) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const disableHmr = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(disableHmr ? { hmr: false, ws: false, watch: null } : {}),
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

  server.on("error", (err) => {
    console.error("HTTP server error:", err);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Arena Hero 11.8 server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
