import {
  type ArenaMapId,
  type CitadelSecretsProgress,
  computeUnlockedMaps,
  createDefaultCitadelSecrets,
  isMapUnlocked,
  normalizeArenaMapId,
  normalizeCitadelSecrets,
} from "./bloodCitadelMap";
import {
  type InfernoProgressState,
  createDefaultInfernoProgress,
  mergeInfernoProgress,
  normalizeInfernoProgress,
} from "./infernoAshMap";
import {
  type DeviceSettings,
  type SavedRunCheckpoint,
  normalizeDeviceSettings,
  normalizeSavedRun,
  readDeviceKey,
  recordDeviceSave,
  writeDeviceKey,
} from "./deviceStorage";

export const PLAYER_PROFILE_STORAGE_KEY = "arena_player_profile_v1";
export const MP_PLAYER_NAME_STORAGE_KEY = "arena_hero_mp_name";
export const GAME_SAVE_STORAGE_KEY = "arena_hero_save_v1";
export const DAILY_CHECKIN_REWARD = 350;

export const VALID_GEAR_SLOTS = ["weapon", "armor", "boots", "gloves", "necklace", "relic"] as const;

export const AVATAR_FRAMES = [
  {
    id: "bronze_recruit",
    name: { vi: "Chiến Binh Đồng", en: "Bronze Recruit" },
    minWave: 0,
    founderOnly: false,
    border: "#C89B3C",
    glow: "rgba(200, 155, 60, 0.38)",
    gradient: "linear-gradient(135deg, #F59E0B, #78350F)",
  },
  {
    id: "cyan_storm",
    name: { vi: "Bão Điện Lam", en: "Storm Cyan" },
    minWave: 0,
    founderOnly: false,
    border: "#38BDF8",
    glow: "rgba(56, 189, 248, 0.42)",
    gradient: "linear-gradient(135deg, #38BDF8, #0369A1)",
  },
  {
    id: "crimson_blade",
    name: { vi: "Huyết Kiếm", en: "Crimson Blade" },
    minWave: 3,
    founderOnly: false,
    border: "#F43F5E",
    glow: "rgba(244, 63, 94, 0.42)",
    gradient: "linear-gradient(135deg, #FB7185, #881337)",
  },
  {
    id: "frost_crown",
    name: { vi: "Băng Vương", en: "Frost Crown" },
    minWave: 9,
    founderOnly: false,
    border: "#67E8F9",
    glow: "rgba(103, 232, 249, 0.45)",
    gradient: "linear-gradient(135deg, #A5F3FC, #0E7490)",
  },
  {
    id: "void_eclipse",
    name: { vi: "Nhật Thực Hư Không", en: "Void Eclipse" },
    minWave: 15,
    founderOnly: false,
    border: "#A855F7",
    glow: "rgba(168, 85, 247, 0.48)",
    gradient: "linear-gradient(135deg, #C084FC, #4C1D95)",
  },
  {
    id: "inferno_dragon",
    name: { vi: "Hỏa Long", en: "Inferno Dragon" },
    minWave: 21,
    founderOnly: false,
    border: "#FB923C",
    glow: "rgba(251, 146, 60, 0.5)",
    gradient: "linear-gradient(135deg, #FDBA74, #9A3412)",
  },
  {
    id: "celestial_legend",
    name: { vi: "Huyền Thoại 27 Màn", en: "27-Wave Legend" },
    minWave: 27,
    founderOnly: false,
    border: "#FACC15",
    glow: "rgba(250, 204, 21, 0.55)",
    gradient: "linear-gradient(135deg, #FEF08A, #CA8A04, #38BDF8)",
  },
  {
    id: "founder_genesis",
    name: { vi: "Đấng Sáng Thế", en: "Genesis Creator" },
    minWave: 0,
    founderOnly: true,
    border: "#FDE047",
    glow: "rgba(253, 224, 71, 0.65)",
    gradient: "linear-gradient(135deg, #FFFFFF, #FACC15, #38BDF8)",
  },
] as const;

export const AVATAR_CRESTS = [
  { id: "shield_gold", name: { vi: "Khiên Hoàng Kim", en: "Golden Shield" }, primary: "#F59E0B", secondary: "#0F172A" },
  { id: "twin_blades", name: { vi: "Song Kiếm Đấu Trường", en: "Twin Blades" }, primary: "#38BDF8", secondary: "#1E293B" },
  { id: "arcane_orb", name: { vi: "Tinh Cầu Hư Không", en: "Arcane Orb" }, primary: "#A855F7", secondary: "#1E1B4B" },
  { id: "dragon_flame", name: { vi: "Long Viêm Ấn", en: "Dragon Flame" }, primary: "#F97316", secondary: "#431407" },
  { id: "frost_star", name: { vi: "Hàn Tinh Băng", en: "Frost Star" }, primary: "#67E8F9", secondary: "#083344" },
  { id: "shadow_mask", name: { vi: "Mặt Nạ Ảnh Sát", en: "Shadow Mask" }, primary: "#C084FC", secondary: "#090D16" },
  { id: "mech_core", name: { vi: "Lõi Cơ Giáp", en: "Mecha Core" }, primary: "#22D3EE", secondary: "#0F172A" },
  { id: "celestial_sun", name: { vi: "Mặt Trời Khởi Nguyên", en: "Celestial Sun" }, primary: "#FACC15", secondary: "#172554" },
] as const;

export const PLAYER_TITLES = [
  { id: "Tân Binh Đấu Trường", en: "Arena Recruit", minWave: 0, founderOnly: false, color: "#94A3B8" },
  { id: "Chiến Binh Bất Khuất", en: "Relentless Fighter", minWave: 3, founderOnly: false, color: "#38BDF8" },
  { id: "Thợ Săn Băng Hỏa", en: "Frostflame Hunter", minWave: 9, founderOnly: false, color: "#67E8F9" },
  { id: "Kẻ Diệt Trùm", en: "Boss Slayer", minWave: 15, founderOnly: false, color: "#C084FC" },
  { id: "Bá Chủ Vực Thẳm", en: "Abyss Overlord", minWave: 21, founderOnly: false, color: "#FB923C" },
  { id: "Huyền Thoại 27 Màn", en: "27-Wave Legend", minWave: 27, founderOnly: false, color: "#FACC15" },
  { id: "Đấng Sáng Thế", en: "Genesis Creator", minWave: 0, founderOnly: true, color: "#FDE047" },
] as const;

export interface PlayerProfile {
  uid: string | null;
  friendCode: string;
  displayName: string;
  avatarType: "hero" | "crest" | "google";
  avatarValue: string;
  avatarFrame: string;
  titleBadge: string;
  bio: string;
  favoriteHeroId: string;
  isPublic: boolean;
  highestWave: number;
  lifetimeKills: number;
  matchesPlayed: number;
  victories: number;
  dailyCheckInDate: string;
  unlockedTitles: string[];
  lastSyncedAt: string;
  accountSource: "local" | "google";
  googlePhotoUrl: string;
}

export interface ProgressSnapshot {
  coins: number;
  currentWave: number;
  highestWave: number;
  selectedHeroId: string;
  inventoryItemIds: string[];
  heroGearEntries: string[];
  lifetimeKills: number;
  matchesPlayed: number;
  victories: number;
  dailyCheckInDate: string;
  unlockedTitles: string[];
  selectedMapId?: ArenaMapId;
  classicCleared?: boolean;
  unlockedMaps?: ArenaMapId[];
  citadelSecrets?: CitadelSecretsProgress;
  infernoProgress?: InfernoProgressState;
}

export function getTodayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function canClaimDailyCheckIn(lastDateStr: string, todayStr: string = getTodayDateKey()): boolean {
  const clean = typeof lastDateStr === "string" ? lastDateStr.trim() : "";
  if (!clean) return true;
  return clean < todayStr;
}

export function generateFriendCode(seed?: string | null): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  if (seed && seed.length >= 4) {
    let h1 = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h1 ^= seed.charCodeAt(i);
      h1 = Math.imul(h1, 16777619);
    }
    let code = "";
    let val = Math.abs(h1);
    for (let i = 0; i < 6; i++) {
      code += alphabet[val % alphabet.length];
      val = Math.floor(val / alphabet.length) + (seed.charCodeAt(i % seed.length) * (i + 7));
    }
    return `AH-${code}`;
  }
  let rand = "";
  for (let i = 0; i < 6; i++) {
    rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `AH-${rand}`;
}

export function normalizeDisplayName(raw: string | null | undefined, fallback: string = "Chiến Binh"): string {
  const cleaned = String(raw || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
  return cleaned.length >= 1 ? cleaned : fallback;
}

export function sanitizeGooglePhotoUrl(url: string | null | undefined): string {
  const val = String(url || "").trim();
  if (!val || val.length > 300) return "";
  if (!/^https:\/\//i.test(val)) return "";
  return val;
}

export function computeUnlockedTitles(highestWave: number, founderUnlocked: boolean): string[] {
  const w = Math.max(0, Math.min(27, Math.floor(Number(highestWave) || 0)));
  return PLAYER_TITLES.filter((t) => (t.founderOnly ? founderUnlocked : w >= t.minWave)).map((t) => t.id);
}

export function isFrameUnlocked(frameId: string, highestWave: number, founderUnlocked: boolean): boolean {
  const frame = AVATAR_FRAMES.find((f) => f.id === frameId);
  if (!frame) return false;
  if (frame.founderOnly) return founderUnlocked;
  return highestWave >= frame.minWave;
}

export function createDefaultPlayerProfile(seedName?: string): PlayerProfile {
  return {
    uid: null,
    friendCode: generateFriendCode(),
    displayName: normalizeDisplayName(seedName, "Chiến Binh"),
    avatarType: "hero",
    avatarValue: "eohyen",
    avatarFrame: "bronze_recruit",
    titleBadge: "Tân Binh Đấu Trường",
    bio: "Sẵn sàng chinh phục 27 màn Arena Hero!",
    favoriteHeroId: "eohyen",
    isPublic: true,
    highestWave: 0,
    lifetimeKills: 0,
    matchesPlayed: 0,
    victories: 0,
    dailyCheckInDate: "",
    unlockedTitles: ["Tân Binh Đấu Trường"],
    lastSyncedAt: "",
    accountSource: "local",
    googlePhotoUrl: "",
  };
}

export function sanitizePlayerProfile(
  raw: Partial<PlayerProfile> | null | undefined,
  options: { founderUnlocked?: boolean; minHighestWave?: number } = {}
): PlayerProfile {
  const base = createDefaultPlayerProfile();
  const founderUnlocked = Boolean(options.founderUnlocked);
  const highestWave = Math.max(
    0,
    Math.min(27, Math.floor(Math.max(Number(raw?.highestWave) || 0, Number(options.minHighestWave) || 0)))
  );
  const unlockedTitles = computeUnlockedTitles(highestWave, founderUnlocked);

  let favoriteHeroId = String(raw?.favoriteHeroId || base.favoriteHeroId).trim().slice(0, 24) || "eohyen";
  if (favoriteHeroId === "thien" && !founderUnlocked) {
    favoriteHeroId = "eohyen";
  }

  let avatarType: "hero" | "crest" | "google" =
    raw?.avatarType === "crest" || raw?.avatarType === "google" ? raw.avatarType : "hero";
  let avatarValue = String(raw?.avatarValue || favoriteHeroId).trim().slice(0, 300);

  if (avatarType === "hero") {
    if (!avatarValue || (avatarValue === "thien" && !founderUnlocked)) {
      avatarValue = favoriteHeroId;
    }
  } else if (avatarType === "crest") {
    if (!AVATAR_CRESTS.some((c) => c.id === avatarValue)) {
      avatarValue = AVATAR_CRESTS[0].id;
    }
  } else if (avatarType === "google") {
    const cleanPhoto = sanitizeGooglePhotoUrl(avatarValue || raw?.googlePhotoUrl);
    if (!cleanPhoto) {
      avatarType = "hero";
      avatarValue = favoriteHeroId;
    } else {
      avatarValue = cleanPhoto;
    }
  }

  let avatarFrame = String(raw?.avatarFrame || base.avatarFrame).trim().slice(0, 32);
  if (!isFrameUnlocked(avatarFrame, highestWave, founderUnlocked)) {
    avatarFrame = "bronze_recruit";
  }

  let titleBadge = String(raw?.titleBadge || "").trim().slice(0, 48);
  if (!unlockedTitles.includes(titleBadge)) {
    titleBadge = unlockedTitles[unlockedTitles.length - 1] || "Tân Binh Đấu Trường";
  }

  const friendCodeRaw = String(raw?.friendCode || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16);
  const friendCode = friendCodeRaw.length >= 4 ? friendCodeRaw : base.friendCode;

  return {
    uid: typeof raw?.uid === "string" && raw.uid.trim() ? raw.uid.trim().slice(0, 128) : null,
    friendCode,
    displayName: normalizeDisplayName(raw?.displayName, base.displayName),
    avatarType,
    avatarValue,
    avatarFrame,
    titleBadge,
    bio: String(raw?.bio ?? base.bio).replace(/[\r\n]+/g, " ").trim().slice(0, 120),
    favoriteHeroId,
    isPublic: raw?.isPublic !== false,
    highestWave,
    lifetimeKills: Math.max(0, Math.min(100000000, Math.floor(Number(raw?.lifetimeKills) || 0))),
    matchesPlayed: Math.max(0, Math.min(1000000, Math.floor(Number(raw?.matchesPlayed) || 0))),
    victories: Math.max(0, Math.min(1000000, Math.floor(Number(raw?.victories) || 0))),
    dailyCheckInDate: String(raw?.dailyCheckInDate || "").slice(0, 16),
    unlockedTitles,
    lastSyncedAt: String(raw?.lastSyncedAt || "").slice(0, 40),
    accountSource: raw?.accountSource === "google" ? "google" : "local",
    googlePhotoUrl: sanitizeGooglePhotoUrl(raw?.googlePhotoUrl),
  };
}

export function loadLocalPlayerProfile(
  options: { founderUnlocked?: boolean; fallbackMpName?: string; minHighestWave?: number } = {}
): PlayerProfile {
  try {
    const rawStr = readDeviceKey(PLAYER_PROFILE_STORAGE_KEY);
    if (rawStr) {
      const parsed = JSON.parse(rawStr);
      return sanitizePlayerProfile(parsed, options);
    }
  } catch {
  }
  const mpSeed = (() => {
    try {
      return options.fallbackMpName || readDeviceKey(MP_PLAYER_NAME_STORAGE_KEY) || "Chiến Binh";
    } catch {
      return options.fallbackMpName || "Chiến Binh";
    }
  })();
  return sanitizePlayerProfile(createDefaultPlayerProfile(mpSeed), options);
}

export function saveLocalPlayerProfile(
  profile: Partial<PlayerProfile>,
  options: { founderUnlocked?: boolean; minHighestWave?: number } = {}
): PlayerProfile {
  const safe = sanitizePlayerProfile(profile, options);
  try {
    writeDeviceKey(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(safe));
    if (safe.displayName) {
      writeDeviceKey(MP_PLAYER_NAME_STORAGE_KEY, safe.displayName);
    }
    recordDeviceSave();
  } catch {
  }
  return safe;
}

export function serializeHeroGearEntries(
  heroGear: Record<string, Record<string, { uid?: number; itemId?: string } | null>> | null | undefined
): string[] {
  if (!heroGear || typeof heroGear !== "object") return [];
  const entries: string[] = [];
  for (const heroId of Object.keys(heroGear)) {
    const slots = heroGear[heroId];
    if (!slots || typeof slots !== "object") continue;
    for (const slot of VALID_GEAR_SLOTS) {
      const item = slots[slot];
      if (item && typeof item.itemId === "string" && item.itemId.trim()) {
        entries.push(`${heroId}:${slot}:${item.itemId.trim()}`.slice(0, 64));
        if (entries.length >= 110) return entries;
      }
    }
  }
  return entries;
}

export function deserializeHeroGearEntries(
  entries: string[] | null | undefined,
  baseGearFactory: () => Record<string, Record<string, { uid: number; itemId: string } | null>>,
  nextUidStart: number = 1,
  validItemIds?: Set<string>
): { heroGear: Record<string, Record<string, { uid: number; itemId: string } | null>>; nextUid: number } {
  const gear = baseGearFactory();
  let nextUid = Math.max(1, Math.floor(Number(nextUidStart) || 1));
  if (!Array.isArray(entries)) return { heroGear: gear, nextUid };

  for (const row of entries) {
    if (typeof row !== "string") continue;
    const parts = row.split(":");
    if (parts.length !== 3) continue;
    const [heroId, slot, itemId] = parts;
    if (!gear[heroId] || !(slot in gear[heroId])) continue;
    if (validItemIds && !validItemIds.has(itemId)) continue;
    gear[heroId][slot] = { uid: nextUid++, itemId };
  }
  return { heroGear: gear, nextUid };
}

export function mergeLocalAndCloudProgress(
  local: ProgressSnapshot,
  cloud: Partial<ProgressSnapshot> | null | undefined,
  founderUnlocked: boolean
): ProgressSnapshot {
  const localClassicCleared = Boolean(local.classicCleared || (Number(local.highestWave) || 0) >= 27);
  if (!cloud) {
    const safeHero = local.selectedHeroId === "thien" && !founderUnlocked ? "eohyen" : local.selectedHeroId;
    const unlockedMaps = computeUnlockedMaps({
      highestWaveCleared: local.highestWave,
      classicCleared: localClassicCleared,
      storedUnlocked: local.unlockedMaps,
      founderUnlocked,
    });
    const rawMap = normalizeArenaMapId(local.selectedMapId);
    return {
      ...local,
      selectedHeroId: safeHero || "eohyen",
      selectedMapId: isMapUnlocked(rawMap, unlockedMaps, founderUnlocked) ? rawMap : "classic",
      classicCleared: localClassicCleared,
      unlockedMaps,
      citadelSecrets: normalizeCitadelSecrets(local.citadelSecrets),
      infernoProgress: normalizeInfernoProgress(local.infernoProgress),
    };
  }
  const cloudWave = Math.max(0, Math.min(27, Math.floor(Number(cloud.highestWave) || 0)));
  const localWave = Math.max(0, Math.min(27, Math.floor(Number(local.highestWave) || 0)));
  const highestWave = Math.max(localWave, cloudWave);

  const cloudScore = cloudWave * 100000 + (Number(cloud.coins) || 0) + (cloud.inventoryItemIds?.length || 0) * 50;
  const localScore = localWave * 100000 + (Number(local.coins) || 0) + (local.inventoryItemIds?.length || 0) * 50;
  const preferCloud = cloudScore > localScore;

  const chosenHeroRaw = (preferCloud ? cloud.selectedHeroId : local.selectedHeroId) || "eohyen";
  const selectedHeroId = chosenHeroRaw === "thien" && !founderUnlocked ? "eohyen" : chosenHeroRaw;

  const dailyCheckInDate =
    String(cloud.dailyCheckInDate || "") > String(local.dailyCheckInDate || "")
      ? String(cloud.dailyCheckInDate || "")
      : String(local.dailyCheckInDate || "");

  const unlockedTitles = computeUnlockedTitles(highestWave, founderUnlocked);
  const classicCleared = Boolean(localClassicCleared || cloud.classicCleared || highestWave >= 27);
  const unlockedMaps = computeUnlockedMaps({
    highestWaveCleared: highestWave,
    classicCleared,
    storedUnlocked: [...(local.unlockedMaps || []), ...(cloud.unlockedMaps || [])],
    founderUnlocked,
  });
  const rawCandidateMap = preferCloud
    ? (cloud.selectedMapId ?? local.selectedMapId)
    : (local.selectedMapId ?? cloud.selectedMapId);
  const candidateMap = normalizeArenaMapId(rawCandidateMap);
  const selectedMapId = isMapUnlocked(candidateMap, unlockedMaps, founderUnlocked) ? candidateMap : "classic";

  const localSec = normalizeCitadelSecrets(local.citadelSecrets);
  const cloudSec = normalizeCitadelSecrets(cloud.citadelSecrets);
  const combinedUnlocked = Boolean(localSec.combinedUnlocked || cloudSec.combinedUnlocked);
  const citadelSecrets = normalizeCitadelSecrets({
    tinClue: Boolean(localSec.tinClue || cloudSec.tinClue || combinedUnlocked),
    baoClue: Boolean(localSec.baoClue || cloudSec.baoClue || combinedUnlocked),
    combinedUnlocked,
    inspectedNodes: Array.from(new Set([...localSec.inspectedNodes, ...cloudSec.inspectedNodes])),
  });

  return {
    coins: Math.max(0, Math.min(10000000, Math.floor(Math.max(Number(local.coins) || 0, Number(cloud.coins) || 0)))),
    currentWave: Math.max(1, Math.min(27, Math.floor((preferCloud ? cloud.currentWave : local.currentWave) || 1))),
    highestWave,
    selectedHeroId,
    inventoryItemIds: (preferCloud ? cloud.inventoryItemIds : local.inventoryItemIds)?.slice(0, 250) || [],
    heroGearEntries: (preferCloud ? cloud.heroGearEntries : local.heroGearEntries)?.slice(0, 110) || [],
    lifetimeKills: Math.max(0, Math.min(100000000, Math.floor(Math.max(Number(local.lifetimeKills) || 0, Number(cloud.lifetimeKills) || 0)))),
    matchesPlayed: Math.max(0, Math.min(1000000, Math.floor(Math.max(Number(local.matchesPlayed) || 0, Number(cloud.matchesPlayed) || 0)))),
    victories: Math.max(0, Math.min(1000000, Math.floor(Math.max(Number(local.victories) || 0, Number(cloud.victories) || 0)))),
    dailyCheckInDate,
    unlockedTitles,
    selectedMapId,
    classicCleared,
    unlockedMaps,
    citadelSecrets,
    infernoProgress: mergeInfernoProgress(local.infernoProgress, cloud.infernoProgress),
  };
}

export function parseSavePackageJson(
  rawText: string,
  founderUnlocked: boolean
):
  | {
      ok: true;
      profile: Partial<PlayerProfile>;
      progress: ProgressSnapshot;
      savedRun: SavedRunCheckpoint | null;
      settings: DeviceSettings | null;
      deviceId: string | null;
    }
  | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "File sao lưu không hợp lệ." };
    }
    const p = parsed.progress || parsed;
    const prof = parsed.profile || {};
    const highestWave = Math.max(0, Math.min(27, Math.floor(Number(p.highestWave) || 0)));
    let selectedHeroId = String(p.selectedHeroId || "eohyen").slice(0, 24);
    if (selectedHeroId === "thien" && !founderUnlocked) {
      selectedHeroId = "eohyen";
    }
    const classicCleared = Boolean(p.classicCleared || highestWave >= 27);
    const unlockedMaps = computeUnlockedMaps({
      highestWaveCleared: highestWave,
      classicCleared,
      storedUnlocked: p.unlockedMaps,
      founderUnlocked,
    });
    const rawMap = normalizeArenaMapId(p.selectedMapId);
    const selectedMapId = isMapUnlocked(rawMap, unlockedMaps, founderUnlocked) ? rawMap : "classic";
    const citadelSecrets = p.citadelSecrets ? normalizeCitadelSecrets(p.citadelSecrets) : createDefaultCitadelSecrets();
    const infernoProgress = p.infernoProgress ? normalizeInfernoProgress(p.infernoProgress) : createDefaultInfernoProgress();
    const savedRun = normalizeSavedRun(parsed.savedRun ?? p.savedRun, 27);
    const settings =
      parsed.settings && typeof parsed.settings === "object"
        ? normalizeDeviceSettings(parsed.settings)
        : null;
    const deviceId =
      typeof parsed.deviceId === "string" && parsed.deviceId.trim()
        ? parsed.deviceId.trim().slice(0, 32)
        : null;
    const progress: ProgressSnapshot = {
      coins: Math.max(0, Math.min(10000000, Math.floor(Number(p.coins) || 100))),
      currentWave: Math.max(1, Math.min(27, Math.floor(Number(p.currentWave) || 1))),
      highestWave,
      selectedHeroId,
      inventoryItemIds: Array.isArray(p.inventoryItemIds)
        ? p.inventoryItemIds.filter((x: unknown): x is string => typeof x === "string").slice(0, 250)
        : [],
      heroGearEntries: Array.isArray(p.heroGearEntries)
        ? p.heroGearEntries.filter((x: unknown): x is string => typeof x === "string").slice(0, 110)
        : [],
      lifetimeKills: Math.max(0, Math.min(100000000, Math.floor(Number(p.lifetimeKills) || 0))),
      matchesPlayed: Math.max(0, Math.min(1000000, Math.floor(Number(p.matchesPlayed) || 0))),
      victories: Math.max(0, Math.min(1000000, Math.floor(Number(p.victories) || 0))),
      dailyCheckInDate: typeof p.dailyCheckInDate === "string" ? p.dailyCheckInDate.slice(0, 16) : "",
      unlockedTitles: computeUnlockedTitles(highestWave, founderUnlocked),
      selectedMapId,
      classicCleared,
      unlockedMaps,
      citadelSecrets,
      infernoProgress,
    };
    return {
      ok: true,
      profile: sanitizePlayerProfile(
        {
          ...prof,
          highestWave: Math.max(highestWave, Number(prof?.highestWave) || 0),
          lifetimeKills: Math.max(progress.lifetimeKills, Number(prof?.lifetimeKills) || 0),
          matchesPlayed: Math.max(progress.matchesPlayed, Number(prof?.matchesPlayed) || 0),
          victories: Math.max(progress.victories, Number(prof?.victories) || 0),
          dailyCheckInDate: progress.dailyCheckInDate || prof?.dailyCheckInDate || "",
        },
        { founderUnlocked }
      ),
      progress,
      savedRun,
      settings,
      deviceId,
    };
  } catch {
    return { ok: false, error: "Không thể đọc định dạng JSON của file sao lưu." };
  }
}
