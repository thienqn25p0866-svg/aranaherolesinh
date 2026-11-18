export const DEVICE_RECORD_STORAGE_KEY = "arena_hero_device_v1";
export const DEVICE_SETTINGS_STORAGE_KEY = "arena_hero_settings_v1";
export const PORTRAIT_PREFS_STORAGE_KEY = "arena_hero_portrait_prefs";
export const PERF_PREFS_STORAGE_KEY = "arena_hero_perf_prefs";
export const DEVICE_TRANSFER_PREFIX = "AH_DEV1:";

const WINDOW_NAME_PREFIX = "__AH_DEV_V1__:";
const IDB_NAME = "arena_hero_device_db";
const IDB_VERSION = 1;
const IDB_STORE = "kv";

export type DeviceEnvironmentType =
  | "github_web"
  | "local_file"
  | "content_uri"
  | "web_https"
  | "web_http";

export interface StorageEnvironmentInfo {
  environmentType: DeviceEnvironmentType;
  origin: string;
  protocol: string;
  hostname: string;
  labelVi: string;
  labelEn: string;
  isStaticHost: boolean;
  isLocalFile: boolean;
}

export interface DeviceRecord {
  deviceId: string;
  environmentType: DeviceEnvironmentType;
  platformLabel: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastSavedAt: string;
  saveRevision: number;
  sessionCount: number;
  knownOrigins: string[];
  persistentStorageGranted: boolean;
}

export interface DeviceSettings {
  lang: "vi" | "en";
  sfxEnabled: boolean;
  sfxVolume: number;
  musicOn: boolean;
  musicVol: number;
  screenShake: boolean;
  showDamageNumbers: boolean;
  layoutMode: "auto" | "portrait" | "standard";
  portraitFov: "wide" | "balanced" | "close";
  qualityMode: "auto" | "high" | "balanced" | "saver";
  fpsCapMode: "auto" | "60" | "45" | "30";
}

export interface SavedRunCheckpoint {
  active: boolean;
  wave: number;
  mapId: string;
  heroId: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  shield: number;
  bonusLevelHp: number;
  bonusLevelAtk: number;
  bonusLevelAp: number;
  totalKilled: number;
  totalDamage: number;
  elapsedTime: number;
  updatedAt: string;
}

const memoryFallbackMap = new Map<string, string>();
let idbDbPromise: Promise<IDBDatabase | null> | null = null;
let sessionCountedForOriginKey: string | null = null;

function getSafeLocalStorage(): Storage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (
      ls &&
      typeof ls.getItem === "function" &&
      typeof ls.setItem === "function" &&
      typeof ls.removeItem === "function"
    ) {
      return ls;
    }
  } catch {
  }
  return null;
}

function readWindowNameMap(): Record<string, string> {
  try {
    if (typeof window === "undefined") return {};
    const nameStr = typeof window.name === "string" ? window.name : "";
    if (!nameStr.startsWith(WINDOW_NAME_PREFIX)) return {};
    const parsed = JSON.parse(nameStr.slice(WINDOW_NAME_PREFIX.length));
    if (!parsed || typeof parsed !== "object") return {};
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

function writeWindowNameKey(key: string, value: string | null): void {
  try {
    if (typeof window === "undefined") return;
    const current = typeof window.name === "string" ? window.name : "";
    if (current && !current.startsWith(WINDOW_NAME_PREFIX)) {
      return;
    }
    const map = readWindowNameMap();
    if (value === null) {
      delete map[key];
    } else {
      map[key] = value;
    }
    const serialized = WINDOW_NAME_PREFIX + JSON.stringify(map);
    if (serialized.length <= 512000) {
      window.name = serialized;
    }
  } catch {
  }
}

function openDeviceIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined" || !indexedDB?.open) {
    return Promise.resolve(null);
  }
  if (idbDbPromise) return idbDbPromise;
  idbDbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        } catch {
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return idbDbPromise;
}

async function writeIndexedDbKey(key: string, value: string | null): Promise<void> {
  const db = await openDeviceIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      if (value === null) store.delete(key);
      else store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function readAllIndexedDbKeys(): Promise<Record<string, string>> {
  const db = await openDeviceIdb();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const result: Record<string, string> = {};
      if (typeof store.getAllKeys === "function" && typeof store.getAll === "function") {
        const keysReq = store.getAllKeys();
        const valsReq = store.getAll();
        tx.oncomplete = () => {
          const keys = Array.isArray(keysReq.result) ? keysReq.result : [];
          const vals = Array.isArray(valsReq.result) ? valsReq.result : [];
          for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const v = vals[i];
            if (typeof k === "string" && typeof v === "string") {
              result[k] = v;
            }
          }
          resolve(result);
        };
        tx.onerror = () => resolve(result);
        tx.onabort = () => resolve(result);
      } else {
        const curReq = store.openCursor();
        curReq.onsuccess = () => {
          const cur = curReq.result;
          if (cur) {
            if (typeof cur.key === "string" && typeof cur.value === "string") {
              result[cur.key] = cur.value;
            }
            cur.continue();
          } else {
            resolve(result);
          }
        };
        curReq.onerror = () => resolve(result);
      }
    } catch {
      resolve({});
    }
  });
}

export function readDeviceKey(key: string): string | null {
  const ls = getSafeLocalStorage();
  let lsAvailable = false;
  if (ls) {
    try {
      const val = ls.getItem(key);
      lsAvailable = true;
      if (typeof val === "string") {
        memoryFallbackMap.set(key, val);
        return val;
      }
    } catch {
      lsAvailable = false;
    }
  }
  const winMap = readWindowNameMap();
  if (typeof winMap[key] === "string") {
    memoryFallbackMap.set(key, winMap[key]);
    if (lsAvailable && ls) {
      try {
        ls.setItem(key, winMap[key]);
      } catch {
      }
    }
    return winMap[key];
  }
  if (!lsAvailable && memoryFallbackMap.has(key)) {
    return memoryFallbackMap.get(key) ?? null;
  }
  return null;
}

export function writeDeviceKey(key: string, value: string): boolean {
  const serialized = String(value);
  memoryFallbackMap.set(key, serialized);
  let wroteAny = false;
  const ls = getSafeLocalStorage();
  if (ls) {
    try {
      ls.setItem(key, serialized);
      wroteAny = true;
    } catch {
    }
  }
  writeWindowNameKey(key, serialized);
  void writeIndexedDbKey(key, serialized);
  return wroteAny || true;
}

export function removeDeviceKey(key: string): void {
  memoryFallbackMap.delete(key);
  const ls = getSafeLocalStorage();
  if (ls) {
    try {
      ls.removeItem(key);
    } catch {
    }
  }
  writeWindowNameKey(key, null);
  void writeIndexedDbKey(key, null);
}

export function isStaticWebHost(hostname: string = "", protocol: string = ""): boolean {
  const p = String(protocol || "").toLowerCase();
  if (p === "file:" || p === "content:") return true;
  const h = String(hostname || "").toLowerCase();
  if (!h) return false;
  return h === "github.io" || h.endsWith(".github.io");
}

export function detectStorageEnvironment(
  locOverride?: { protocol?: string; origin?: string; hostname?: string; href?: string }
): StorageEnvironmentInfo {
  const loc =
    locOverride ||
    (typeof window !== "undefined" && window.location ? window.location : undefined);
  const protocol = String(loc?.protocol || "http:").toLowerCase();
  let hostname = String(loc?.hostname || "").toLowerCase();
  const originRaw = String(loc?.origin || "");
  if (!hostname && originRaw && originRaw !== "null") {
    try {
      hostname = new URL(originRaw).hostname.toLowerCase();
    } catch {
    }
  }
  const origin =
    originRaw && originRaw !== "null"
      ? originRaw
      : protocol === "file:"
      ? "file://local"
      : protocol === "content:"
      ? "content://local"
      : "http://localhost";

  if (protocol === "file:") {
    return {
      environmentType: "local_file",
      origin,
      protocol,
      hostname,
      labelVi: "Tệp HTML Cục Bộ (Offline)",
      labelEn: "Local HTML File",
      isStaticHost: true,
      isLocalFile: true,
    };
  }
  if (protocol === "content:") {
    return {
      environmentType: "content_uri",
      origin,
      protocol,
      hostname,
      labelVi: "Tệp Di Động (Content URI)",
      labelEn: "Mobile Content File",
      isStaticHost: true,
      isLocalFile: true,
    };
  }
  if (hostname === "github.io" || hostname.endsWith(".github.io")) {
    return {
      environmentType: "github_web",
      origin,
      protocol,
      hostname,
      labelVi: "Web GitHub Pages",
      labelEn: "GitHub Pages Web",
      isStaticHost: true,
      isLocalFile: false,
    };
  }
  if (protocol === "https:") {
    return {
      environmentType: "web_https",
      origin,
      protocol,
      hostname,
      labelVi: "Trình Duyệt Web HTTPS",
      labelEn: "HTTPS Web Browser",
      isStaticHost: false,
      isLocalFile: false,
    };
  }
  return {
    environmentType: "web_http",
    origin,
    protocol,
    hostname,
    labelVi: "Trình Duyệt Web Cục Bộ",
    labelEn: "Local Web Browser",
    isStaticHost: false,
    isLocalFile: false,
  };
}

export function detectDevicePlatformLabel(uaOverride?: string): string {
  const ua =
    typeof uaOverride === "string"
      ? uaOverride
      : typeof navigator !== "undefined" && typeof navigator.userAgent === "string"
      ? navigator.userAgent
      : "";
  if (!ua) return "Trình Duyệt Thiết Bị";

  const os = /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
    ? "Android"
    : /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua)
    ? "macOS"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Thiết Bị";

  const browser = /Zalo/i.test(ua)
    ? "Zalo"
    : /FBAN|FBAV|Messenger/i.test(ua)
    ? "Messenger"
    : /Edg\//i.test(ua)
    ? "Edge"
    : /Firefox\//i.test(ua)
    ? "Firefox"
    : /Chrome\/|CriOS\//i.test(ua)
    ? "Chrome"
    : /Safari\//i.test(ua)
    ? "Safari"
    : "Browser";

  return `${os} · ${browser}`;
}

export function generateDeviceId(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  try {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < 8; i++) {
        out += alphabet[bytes[i] % alphabet.length];
      }
      return `DEV-${out}`;
    }
  } catch {
  }
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `DEV-${out}`;
}

export function loadDeviceRecord(): DeviceRecord {
  const env = detectStorageEnvironment();
  const nowIso = new Date().toISOString();
  try {
    const raw = readDeviceKey(DEVICE_RECORD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const cleanId =
          typeof parsed.deviceId === "string" && parsed.deviceId.trim().length >= 6
            ? parsed.deviceId.trim().slice(0, 32)
            : generateDeviceId();
        const origins = Array.isArray(parsed.knownOrigins)
          ? parsed.knownOrigins
              .filter((o: unknown): o is string => typeof o === "string" && Boolean(o.trim()))
              .slice(0, 8)
          : [];
        if (env.origin && !origins.includes(env.origin)) {
          origins.unshift(env.origin);
        }
        return {
          deviceId: cleanId,
          environmentType: env.environmentType,
          platformLabel:
            typeof parsed.platformLabel === "string" && parsed.platformLabel.trim()
              ? parsed.platformLabel.trim()
              : detectDevicePlatformLabel(),
          firstSeenAt:
            typeof parsed.firstSeenAt === "string" && parsed.firstSeenAt
              ? parsed.firstSeenAt
              : nowIso,
          lastSeenAt:
            typeof parsed.lastSeenAt === "string" && parsed.lastSeenAt
              ? parsed.lastSeenAt
              : nowIso,
          lastSavedAt:
            typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : "",
          saveRevision: Math.max(0, Math.floor(Number(parsed.saveRevision) || 0)),
          sessionCount: Math.max(1, Math.floor(Number(parsed.sessionCount) || 1)),
          knownOrigins: origins.slice(0, 8),
          persistentStorageGranted: Boolean(parsed.persistentStorageGranted),
        };
      }
    }
  } catch {
  }
  return {
    deviceId: generateDeviceId(),
    environmentType: env.environmentType,
    platformLabel: detectDevicePlatformLabel(),
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    lastSavedAt: "",
    saveRevision: 0,
    sessionCount: 1,
    knownOrigins: env.origin ? [env.origin] : [],
    persistentStorageGranted: false,
  };
}

export function saveDeviceRecord(record: DeviceRecord): DeviceRecord {
  try {
    writeDeviceKey(DEVICE_RECORD_STORAGE_KEY, JSON.stringify(record));
  } catch {
  }
  return record;
}

export function touchDeviceVisit(forceIncrement: boolean = false): DeviceRecord {
  const existingRaw = readDeviceKey(DEVICE_RECORD_STORAGE_KEY);
  const env = detectStorageEnvironment();
  const nowIso = new Date().toISOString();
  const current = loadDeviceRecord();
  const originKey = `${env.origin}::${current.deviceId}`;
  const alreadyHasRecord = Boolean(existingRaw);
  const shouldIncrement =
    alreadyHasRecord && (forceIncrement || sessionCountedForOriginKey !== originKey);
  sessionCountedForOriginKey = originKey;

  const knownOrigins = [env.origin, ...current.knownOrigins.filter((o) => o !== env.origin)]
    .filter(Boolean)
    .slice(0, 8);

  const updated: DeviceRecord = {
    ...current,
    environmentType: env.environmentType,
    platformLabel: detectDevicePlatformLabel(),
    lastSeenAt: nowIso,
    sessionCount: shouldIncrement ? current.sessionCount + 1 : Math.max(1, current.sessionCount),
    knownOrigins,
  };
  return saveDeviceRecord(updated);
}

export function recordDeviceSave(minRevision?: number): DeviceRecord {
  const current = loadDeviceRecord();
  const nowIso = new Date().toISOString();
  const nextRevision = Math.max(current.saveRevision + 1, Math.floor(Number(minRevision) || 0));
  const updated: DeviceRecord = {
    ...current,
    lastSeenAt: nowIso,
    lastSavedAt: nowIso,
    saveRevision: nextRevision,
  };
  return saveDeviceRecord(updated);
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage) return false;
    let granted = false;
    if (typeof navigator.storage.persisted === "function") {
      granted = Boolean(await navigator.storage.persisted());
    }
    if (!granted && typeof navigator.storage.persist === "function") {
      granted = Boolean(await navigator.storage.persist());
    }
    const cur = loadDeviceRecord();
    if (cur.persistentStorageGranted !== granted) {
      saveDeviceRecord({ ...cur, persistentStorageGranted: granted });
    }
    return granted;
  } catch {
    return false;
  }
}

export function getDefaultDeviceSettings(): DeviceSettings {
  return {
    lang: "vi",
    sfxEnabled: true,
    sfxVolume: 0.45,
    musicOn: true,
    musicVol: 0.35,
    screenShake: true,
    showDamageNumbers: true,
    layoutMode: "auto",
    portraitFov: "balanced",
    qualityMode: "auto",
    fpsCapMode: "auto",
  };
}

export function normalizeDeviceSettings(
  raw: Partial<DeviceSettings> | null | undefined
): DeviceSettings {
  const d = getDefaultDeviceSettings();
  if (!raw || typeof raw !== "object") return d;
  const clamp01 = (v: unknown, fb: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
  };
  return {
    lang: raw.lang === "en" ? "en" : "vi",
    sfxEnabled: typeof raw.sfxEnabled === "boolean" ? raw.sfxEnabled : d.sfxEnabled,
    sfxVolume: clamp01(raw.sfxVolume, d.sfxVolume),
    musicOn: typeof raw.musicOn === "boolean" ? raw.musicOn : d.musicOn,
    musicVol: clamp01(raw.musicVol, d.musicVol),
    screenShake: typeof raw.screenShake === "boolean" ? raw.screenShake : d.screenShake,
    showDamageNumbers:
      typeof raw.showDamageNumbers === "boolean" ? raw.showDamageNumbers : d.showDamageNumbers,
    layoutMode:
      raw.layoutMode === "portrait" || raw.layoutMode === "standard" || raw.layoutMode === "auto"
        ? raw.layoutMode
        : d.layoutMode,
    portraitFov:
      raw.portraitFov === "wide" || raw.portraitFov === "close" || raw.portraitFov === "balanced"
        ? raw.portraitFov
        : d.portraitFov,
    qualityMode:
      raw.qualityMode === "high" ||
      raw.qualityMode === "balanced" ||
      raw.qualityMode === "saver" ||
      raw.qualityMode === "auto"
        ? raw.qualityMode
        : d.qualityMode,
    fpsCapMode:
      raw.fpsCapMode === "60" ||
      raw.fpsCapMode === "45" ||
      raw.fpsCapMode === "30" ||
      raw.fpsCapMode === "auto"
        ? raw.fpsCapMode
        : d.fpsCapMode,
  };
}

export function loadDeviceSettings(): DeviceSettings {
  const defaults = getDefaultDeviceSettings();
  try {
    const rawStr = readDeviceKey(DEVICE_SETTINGS_STORAGE_KEY);
    if (rawStr) {
      return normalizeDeviceSettings(JSON.parse(rawStr));
    }
  } catch {
  }

  // Backward-compatible migration from legacy portrait/perf prefs
  let portrait: Record<string, unknown> = {};
  let perf: Record<string, unknown> = {};
  try {
    const pRaw = readDeviceKey(PORTRAIT_PREFS_STORAGE_KEY);
    if (pRaw) portrait = JSON.parse(pRaw) || {};
  } catch {
  }
  try {
    const pfRaw = readDeviceKey(PERF_PREFS_STORAGE_KEY);
    if (pfRaw) perf = JSON.parse(pfRaw) || {};
  } catch {
  }

  return normalizeDeviceSettings({
    ...defaults,
    layoutMode: portrait.layoutMode as DeviceSettings["layoutMode"],
    portraitFov: portrait.portraitFov as DeviceSettings["portraitFov"],
    qualityMode: perf.qualityMode as DeviceSettings["qualityMode"],
    fpsCapMode: perf.fpsCapMode as DeviceSettings["fpsCapMode"],
  });
}

export function saveDeviceSettings(settings: Partial<DeviceSettings>): DeviceSettings {
  const safe = normalizeDeviceSettings(settings);
  try {
    writeDeviceKey(DEVICE_SETTINGS_STORAGE_KEY, JSON.stringify(safe));
    writeDeviceKey(
      PORTRAIT_PREFS_STORAGE_KEY,
      JSON.stringify({ layoutMode: safe.layoutMode, portraitFov: safe.portraitFov })
    );
    writeDeviceKey(
      PERF_PREFS_STORAGE_KEY,
      JSON.stringify({ qualityMode: safe.qualityMode, fpsCapMode: safe.fpsCapMode })
    );
  } catch {
  }
  return safe;
}

export function normalizeSavedRun(
  raw: Partial<SavedRunCheckpoint> | null | undefined,
  maxWave: number = 27
): SavedRunCheckpoint | null {
  if (!raw || typeof raw !== "object" || !raw.active) return null;
  const wave = Math.max(1, Math.min(maxWave, Math.floor(Number(raw.wave) || 1)));
  const maxHp = Math.max(100, Math.min(5000000, Math.floor(Number(raw.maxHp) || 960)));
  const hp = Math.max(1, Math.min(maxHp, Math.floor(Number(raw.hp) || maxHp)));
  const level = Math.max(1, Math.min(999, Math.floor(Number(raw.level) || 1)));
  const xpToNext = Math.max(50, Math.min(10000000, Math.floor(Number(raw.xpToNext) || 100)));
  const xp = Math.max(0, Math.min(xpToNext * 2, Math.floor(Number(raw.xp) || 0)));
  return {
    active: true,
    wave,
    mapId: typeof raw.mapId === "string" && raw.mapId.trim() ? raw.mapId.trim().slice(0, 32) : "classic",
    heroId: typeof raw.heroId === "string" && raw.heroId.trim() ? raw.heroId.trim().slice(0, 24) : "eohyen",
    level,
    xp,
    xpToNext,
    hp,
    maxHp,
    shield: Math.max(0, Math.min(maxHp * 2, Math.floor(Number(raw.shield) || 0))),
    bonusLevelHp: Math.max(0, Math.min(2000000, Math.floor(Number(raw.bonusLevelHp) || 0))),
    bonusLevelAtk: Math.max(0, Math.min(500000, Math.floor(Number(raw.bonusLevelAtk) || 0))),
    bonusLevelAp: Math.max(0, Math.min(500000, Math.floor(Number(raw.bonusLevelAp) || 0))),
    totalKilled: Math.max(0, Math.min(10000000, Math.floor(Number(raw.totalKilled) || 0))),
    totalDamage: Math.max(0, Math.min(1000000000, Math.floor(Number(raw.totalDamage) || 0))),
    elapsedTime: Math.max(0, Math.min(864000, Math.round(Number(raw.elapsedTime) || 0))),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt.slice(0, 40) : new Date().toISOString(),
  };
}

function shouldPreferIdbSave(idbVal: string, lsVal: string | null): boolean {
  if (!lsVal) return true;
  try {
    const a = JSON.parse(idbVal);
    const b = JSON.parse(lsVal);
    const revA = Number(a?.saveRevision) || 0;
    const revB = Number(b?.saveRevision) || 0;
    if (revA !== revB) return revA > revB;
    const waveA = Number(a?.highestWave) || 0;
    const waveB = Number(b?.highestWave) || 0;
    if (waveA !== waveB) return waveA > waveB;
    const runTimeA = Date.parse(a?.savedRun?.updatedAt || "") || 0;
    const runTimeB = Date.parse(b?.savedRun?.updatedAt || "") || 0;
    if (runTimeA !== runTimeB) return runTimeA > runTimeB;
  } catch {
  }
  return false;
}

export async function hydrateDeviceStorageAsync(): Promise<{
  recoveredKeys: string[];
  persistentGranted: boolean;
}> {
  const recoveredKeys: string[] = [];
  const ls = getSafeLocalStorage();
  const idbAll = await readAllIndexedDbKeys();

  for (const [k, v] of Object.entries(idbAll)) {
    let lsVal: string | null = null;
    if (ls) {
      try {
        lsVal = ls.getItem(k);
      } catch {
        lsVal = null;
      }
    }
    const needRecover =
      lsVal === null ||
      (k === "arena_hero_save_v1" && shouldPreferIdbSave(v, lsVal)) ||
      (k === DEVICE_RECORD_STORAGE_KEY && shouldPreferIdbSave(v, lsVal));
    if (needRecover) {
      memoryFallbackMap.set(k, v);
      if (ls) {
        try {
          ls.setItem(k, v);
        } catch {
        }
      }
      writeWindowNameKey(k, v);
      recoveredKeys.push(k);
    }
  }

  // Mirror any keys that are in localStorage but missing in IndexedDB
  if (ls) {
    const mirrorKeys = [
      "arena_hero_save_v1",
      "arena_player_profile_v1",
      "arena_hero_mp_name",
      "arena_hero_server_url",
      DEVICE_RECORD_STORAGE_KEY,
      DEVICE_SETTINGS_STORAGE_KEY,
    ];
    for (const mk of mirrorKeys) {
      try {
        const val = ls.getItem(mk);
        if (typeof val === "string" && !idbAll[mk]) {
          void writeIndexedDbKey(mk, val);
        }
      } catch {
      }
    }
  }

  let persistentGranted = false;
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persisted) {
      persistentGranted = Boolean(await navigator.storage.persisted());
    }
  } catch {
  }
  return { recoveredKeys, persistentGranted };
}

function utf8ToBase64Url(str: string): string {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  const b64 =
    typeof btoa === "function"
      ? btoa(utf8)
      : Buffer.from(utf8, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(b64Url: string): string {
  let b64 = b64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const bin =
    typeof atob === "function"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const pct = Array.from(bin)
    .map((ch) => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2))
    .join("");
  return decodeURIComponent(pct);
}

export function encodeDeviceTransferCode(payload: unknown): string {
  const jsonStr = JSON.stringify(payload);
  return `${DEVICE_TRANSFER_PREFIX}${utf8ToBase64Url(jsonStr)}`;
}

export function decodeDeviceTransferCode(
  rawInput: string
): { ok: true; jsonText: string } | { ok: false; error: string } {
  const trimmed = String(rawInput || "").trim();
  if (!trimmed) {
    return { ok: false, error: "Mã khôi phục trống." };
  }
  try {
    if (trimmed.startsWith(DEVICE_TRANSFER_PREFIX)) {
      const encoded = trimmed.slice(DEVICE_TRANSFER_PREFIX.length).replace(/\s+/g, "");
      if (!encoded) {
        return { ok: false, error: "Mã đồng bộ thiết bị không hợp lệ." };
      }
      const jsonText = base64UrlToUtf8(encoded);
      JSON.parse(jsonText);
      return { ok: true, jsonText };
    }
    if (trimmed.startsWith("{")) {
      JSON.parse(trimmed);
      return { ok: true, jsonText: trimmed };
    }
    return {
      ok: false,
      error: "Mã đồng bộ phải bắt đầu bằng AH_DEV1: hoặc là nội dung tệp sao lưu .json.",
    };
  } catch {
    return { ok: false, error: "Không thể giải mã chuỗi khôi phục thiết bị." };
  }
}
