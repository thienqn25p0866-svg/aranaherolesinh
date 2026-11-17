export const MAX_WAVES = 27;
export const BOSS_WAVES = [3, 6, 9, 12, 15, 18, 21, 24, 27] as const;
export const MAX_BOSS_CC_SEC = 2.6;

export const TIN_RESONANCE_MAX = 4;
export const TIN_RESONANCE_DURATION = 4.5;
export const TIN_HASTE_PER_STACK = 0.05;
export const TIN_BASIC_HIT_CD_REFUND = 0.2;
export const TIN_RECAST_WINDOW_SEC = 2.0;
export const TIN_EMPOWERED_SKILL_MULT = 1.15;
export const TIN_OVERLOAD_SHIELD_RATIO = 0.07;

export const LONGHOI_MAX_BURN_STACKS = 100;
export const LONGHOI_BURN_DURATION = 3.0;
export const LONGHOI_AMP_DURATION = 4.0;
export const LONGHOI_AMP_MULTIPLIER = 1.3;
export const LONGHOI_DETONATION_STEP = 5;

export type BossCcType = 'stun' | 'root' | 'slow' | 'silence' | 'knockback';

export function clampBossCcDuration(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return Math.min(MAX_BOSS_CC_SEC, Math.round(durationSec * 100) / 100);
}

/**
 * Exact per-boss CC progression: starts at 1.0s on Boss 1 (Wave 3)
 * and increases by +0.2s for each subsequent boss up to 2.6s at Wave 27.
 */
export function getBossStageCcDuration(bossWave: number): number {
  const bossIndex = Math.max(0, Math.round((Math.max(3, bossWave) - 3) / 3));
  return clampBossCcDuration(1.0 + bossIndex * 0.2);
}

/**
 * Scales boss crowd-control duration upward with boss wave (3 -> 27) and phase (1 -> 3),
 * strictly capped at 2.6s maximum.
 */
export function getBossCcDuration(
  baseSec: number,
  bossWave: number,
  phase: number = 1,
  ccType: BossCcType = 'stun'
): number {
  if (!Number.isFinite(baseSec) || baseSec <= 0) return 0;
  const waveTier = Math.max(0, (Math.max(3, bossWave) - 3) / 3); // 0 at w3 .. 8 at w27
  const phaseTier = Math.max(0, Math.min(2, phase - 1));
  const typeScale = ccType === 'slow' ? 1.15 : ccType === 'root' ? 1.08 : 1.0;
  const waveScale = 1 + Math.min(1.12, waveTier * 0.14) + phaseTier * 0.14;
  return clampBossCcDuration(baseSec * waveScale * typeScale);
}

export function getBossPowerModifiers(bossWave: number): {
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
} {
  const waveTier = Math.max(0, (Math.max(3, bossWave) - 3) / 3);
  return {
    hpMultiplier: Math.round((1.28 + Math.min(0.24, waveTier * 0.03)) * 1000) / 1000,
    damageMultiplier: Math.round((1.22 + Math.min(0.20, waveTier * 0.025)) * 1000) / 1000,
    speedMultiplier: Math.round((1.06 + Math.min(0.08, waveTier * 0.01)) * 1000) / 1000,
  };
}

export const LUAN_C1_BASE_DMG = 28;
export const LUAN_C1_AP_RATIO = 0.38;
export const LUAN_RIFT_BASE_DMG = 7;
export const LUAN_RIFT_AP_RATIO = 0.13;
export const LUAN_RIFT_TICK_INTERVAL = 0.5;
export const LUAN_RIFT_MAX_SEGMENTS = 14;

export function computeLuanC1ShardDamage(ap: number): number {
  return Math.round(LUAN_C1_BASE_DMG + LUAN_C1_AP_RATIO * Math.max(0, ap || 0));
}

export function computeLuanRiftTickDamage(ap: number): number {
  return Math.round(LUAN_RIFT_BASE_DMG + LUAN_RIFT_AP_RATIO * Math.max(0, ap || 0));
}

export interface TinResonanceState {
  stacks: number;
  timer: number;
  empowered: boolean;
  recastTimer: number;
}

export function computeTinStackGain(
  state: TinResonanceState,
  stacksAdded: number = 1,
  crystalReset: boolean = false
): {
  next: TinResonanceState;
  triggeredOverload: boolean;
  c2c3RefundSec: number;
} {
  if (crystalReset) {
    return {
      next: {
        stacks: Math.min(TIN_RESONANCE_MAX, Math.max(1, state.stacks)),
        timer: TIN_RESONANCE_DURATION,
        empowered: true,
        recastTimer: TIN_RECAST_WINDOW_SEC,
      },
      triggeredOverload: true,
      c2c3RefundSec: 0.8,
    };
  }

  const combined = Math.max(0, state.stacks) + Math.max(1, stacksAdded);
  if (combined >= TIN_RESONANCE_MAX) {
    return {
      next: {
        stacks: 0,
        timer: 0,
        empowered: true,
        recastTimer: TIN_RECAST_WINDOW_SEC,
      },
      triggeredOverload: true,
      c2c3RefundSec: 0.8,
    };
  }

  return {
    next: {
      stacks: combined,
      timer: TIN_RESONANCE_DURATION,
      empowered: state.empowered,
      recastTimer: state.recastTimer,
    },
    triggeredOverload: false,
    c2c3RefundSec: 0,
  };
}

export function computeTinCooldownTickRate(stacks: number): number {
  const clamped = Math.max(0, Math.min(TIN_RESONANCE_MAX, stacks));
  return 1 + clamped * TIN_HASTE_PER_STACK;
}

export function applyTinBasicHitCooldownRefund(cooldowns: number[]): number[] {
  return cooldowns.map((cd, idx) => {
    if (cd <= 0) return 0;
    const refund = idx <= 1 ? TIN_BASIC_HIT_CD_REFUND : TIN_BASIC_HIT_CD_REFUND * 0.6;
    return Math.max(0, Math.round((cd - refund) * 1000) / 1000);
  });
}

export interface LongHoiBurnApplicationResult {
  newStacks: number;
  newBurnTimer: number;
  newBurnAmpTimer: number;
  detonationsTriggered: number;
  detonationDamage: number;
}

export function computeLongHoiDetonationDamage(effectiveDamage: number, stacks: number): number {
  return Math.round(effectiveDamage * (0.9 + Math.max(1, stacks) * 0.06));
}

export function computeLongHoiBurnApplication(params: {
  currentStacks: number;
  wasBurning: boolean;
  currentAmpTimer: number;
  stacksToAdd: number;
  effectiveDamage: number;
}): LongHoiBurnApplicationResult {
  const prev = Math.max(0, Math.min(LONGHOI_MAX_BURN_STACKS, params.currentStacks));
  const add = Math.max(1, params.stacksToAdd);
  const newStacks = Math.min(LONGHOI_MAX_BURN_STACKS, prev + add);

  const prevStep = Math.floor(prev / LONGHOI_DETONATION_STEP);
  const nextStep = Math.floor(newStacks / LONGHOI_DETONATION_STEP);
  const detonationsTriggered = Math.max(0, nextStep - prevStep);

  let detonationDamage = 0;
  for (let s = prevStep + 1; s <= nextStep; s++) {
    detonationDamage += computeLongHoiDetonationDamage(
      params.effectiveDamage,
      s * LONGHOI_DETONATION_STEP
    );
  }

  return {
    newStacks,
    newBurnTimer: LONGHOI_BURN_DURATION,
    newBurnAmpTimer:
      params.wasBurning || prev > 0
        ? LONGHOI_AMP_DURATION
        : Math.max(0, params.currentAmpTimer),
    detonationsTriggered,
    detonationDamage,
  };
}

export function computeLongHoiBurnDps(params: {
  stacks: number;
  targetCurrentHp: number;
  effectiveDamage: number;
  isBoss: boolean;
  burnAmpActive: boolean;
}): number {
  const stacks = Math.max(0, Math.min(LONGHOI_MAX_BURN_STACKS, params.stacks));
  if (stacks <= 0) return 0;
  const rawHpPct = Math.max(0, params.targetCurrentHp) * 0.04;
  const hpPctPart = params.isBoss
    ? Math.min(rawHpPct, params.effectiveDamage * 1.6)
    : rawHpPct;
  const stackPart = stacks * 0.025 * Math.max(1, params.effectiveDamage);
  const ampMult = params.burnAmpActive ? LONGHOI_AMP_MULTIPLIER : 1.0;
  return (hpPctPart + stackPart) * ampMult;
}

export function isLocalFileProtocol(protocol: string): boolean {
  const p = (protocol || '').toLowerCase();
  return p === 'file:' || p === 'content:' || p === 'blob:';
}

export function isPrivateOrDevOrigin(originOrUrl: string): boolean {
  const raw = (originOrUrl || '').trim();
  if (!raw) return true;
  let hostname = '';
  let protocol = '';
  try {
    const parsed = new URL(raw);
    hostname = (parsed.hostname || '').toLowerCase();
    protocol = (parsed.protocol || '').toLowerCase();
  } catch {
    return true;
  }
  if (protocol !== 'http:' && protocol !== 'https:') return true;
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }
  if (/^ais-dev-/i.test(hostname)) {
    return true;
  }
  if (/^10\.\d+\.\d+\.\d+$/.test(hostname) || /^192\.168\.\d+\.\d+$/.test(hostname)) {
    return true;
  }
  const m172 = hostname.match(/^172\.(\d+)\.\d+\.\d+$/);
  if (m172) {
    const second = Number(m172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export const ITEM_TIER_RANK: Record<string, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  rare: 4,
  epic: 5,
  mythic: 6,
};

export function parseItemNumericId(id: string): number {
  const n = parseInt(String(id || '').replace('item_', ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function sortItemsByRarityAsc<T extends { id: string; tier: string; cost: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rankDiff = (ITEM_TIER_RANK[a.tier] ?? 99) - (ITEM_TIER_RANK[b.tier] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    const costDiff = (a.cost || 0) - (b.cost || 0);
    if (costDiff !== 0) return costDiff;
    return parseItemNumericId(a.id) - parseItemNumericId(b.id);
  });
}

export function sortItemsByRarityDesc<T extends { id: string; tier: string; cost: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rankDiff = (ITEM_TIER_RANK[b.tier] ?? 0) - (ITEM_TIER_RANK[a.tier] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    const costDiff = (b.cost || 0) - (a.cost || 0);
    if (costDiff !== 0) return costDiff;
    return parseItemNumericId(a.id) - parseItemNumericId(b.id);
  });
}

export function isSixDigitCode(rawCode: string): boolean {
  return /^\d{6}$/.test(String(rawCode || '').trim().replace(/\s+/g, ''));
}

export function classifyJoinCode(rawCode: string): {
  kind: 'empty' | 'p2p_signal' | 'server_room';
  normalized: string;
} {
  const stripped = String(rawCode || '').trim().replace(/\s+/g, '');
  if (!stripped) {
    return { kind: 'empty', normalized: '' };
  }
  const p2pMatch = stripped.match(/^(ah1[gj]):(.+)$/i);
  if (p2pMatch) {
    return {
      kind: 'p2p_signal',
      normalized: `${p2pMatch[1].toUpperCase()}:${p2pMatch[2]}`,
    };
  }
  return {
    kind: 'server_room',
    normalized: stripped.toUpperCase(),
  };
}

export function buildCoopWsUrl(params: {
  protocol: string;
  host: string;
  overrideUrl?: string;
}): { ok: true; url: string } | { ok: false; reason: 'file_protocol' | 'invalid_host'; message: string } {
  const override = (params.overrideUrl || '').trim();
  if (override) {
    if (override.startsWith('ws://') || override.startsWith('wss://')) {
      return { ok: true, url: override };
    }
    if (override.startsWith('http://') || override.startsWith('https://')) {
      const wsBase = override.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://').replace(/\/+$/, '');
      return { ok: true, url: wsBase.endsWith('/ws') ? wsBase : `${wsBase}/ws` };
    }
  }

  if (isLocalFileProtocol(params.protocol)) {
    return {
      ok: false,
      reason: 'file_protocol',
      message:
        'Bạn đang mở file HTML đã tải về máy. Hệ thống sẽ dùng chế độ P2P Trực Tiếp để bạn tạo phòng và mời bạn bè bằng Mã Mời AH1...!',
    };
  }

  const host = (params.host || '').trim();
  if (!host) {
    return {
      ok: false,
      reason: 'invalid_host',
      message: 'Không xác định được máy chủ Co-op. Hãy dùng chế độ P2P Trực Tiếp bên dưới hoặc mở link web trên Chrome/Safari.',
    };
  }

  const wsProto = params.protocol === 'https:' ? 'wss:' : 'ws:';
  return { ok: true, url: `${wsProto}//${host}/ws` };
}

export function buildCoopHttpBase(params: {
  protocol: string;
  host: string;
  overrideUrl?: string;
}): { ok: true; baseUrl: string } | { ok: false; reason: 'file_protocol' | 'invalid_host'; message: string } {
  const override = (params.overrideUrl || '').trim();
  if (override) {
    if (override.startsWith('http://') || override.startsWith('https://')) {
      return { ok: true, baseUrl: override.replace(/\/+$/, '') };
    }
    if (override.startsWith('ws://')) {
      return { ok: true, baseUrl: override.replace(/^ws:\/\//, 'http://').replace(/\/ws\/?$/, '').replace(/\/+$/, '') };
    }
    if (override.startsWith('wss://')) {
      return { ok: true, baseUrl: override.replace(/^wss:\/\//, 'https://').replace(/\/ws\/?$/, '').replace(/\/+$/, '') };
    }
  }

  if (isLocalFileProtocol(params.protocol)) {
    return {
      ok: false,
      reason: 'file_protocol',
      message:
        'Bạn đang mở file HTML đã tải về máy. Hệ thống sẽ tự chuyển sang chế độ P2P Trực Tiếp (hoặc bạn có thể dán link máy chủ vào mục Kết nối link)!',
    };
  }

  const host = (params.host || '').trim();
  if (!host) {
    return {
      ok: false,
      reason: 'invalid_host',
      message: 'Không xác định được máy chủ Co-op. Hãy dùng chế độ P2P Trực Tiếp bên dưới hoặc mở link web trên Chrome/Safari.',
    };
  }

  const httpProto = params.protocol === 'https:' ? 'https:' : 'http:';
  return { ok: true, baseUrl: `${httpProto}//${host}` };
}

export function coalesceCoopOutbox<T extends { type?: string }>(messages: T[]): T[] {
  if (!Array.isArray(messages) || messages.length <= 1) return messages || [];
  let lastSyncPlayerIdx = -1;
  let lastWorldSnapIdx = -1;
  for (let i = 0; i < messages.length; i++) {
    const t = messages[i]?.type;
    if (t === 'SYNC_PLAYER') lastSyncPlayerIdx = i;
    else if (t === 'WORLD_SNAPSHOT') lastWorldSnapIdx = i;
  }
  return messages.filter((msg, idx) => {
    const t = msg?.type;
    if (t === 'SYNC_PLAYER' && idx !== lastSyncPlayerIdx) return false;
    if (t === 'WORLD_SNAPSHOT' && idx !== lastWorldSnapIdx) return false;
    return true;
  });
}

const COOP_WAVE_TARGET_TIMES: Record<number, number> = {
  1: 22, 2: 26, 3: 48, 4: 32, 5: 36,
  6: 58, 7: 40, 8: 44, 9: 68, 10: 50,
  11: 55, 12: 78, 13: 60, 14: 65, 15: 88,
  16: 65, 17: 70, 18: 98, 19: 75, 20: 80,
  21: 108, 22: 85, 23: 90, 24: 118, 25: 95,
  26: 100, 27: 135,
};

const COOP_BOSS_COIN_REWARDS: Record<number, number> = {
  3: 150, 6: 220, 9: 300, 12: 400, 15: 500,
  18: 620, 21: 760, 24: 920, 27: 1200,
};

export function computeCoopWaveReward(params: {
  wave: number;
  elapsedSec: number;
  kills: number;
  maxWaves?: number;
}) {
  const wave = Math.max(1, Math.round(params.wave));
  const maxWaves = params.maxWaves || MAX_WAVES;
  const elapsedSec = Math.max(0.5, params.elapsedSec || 1);
  const baseCoins = 100 + 100 * (wave - 1);
  const targetSec = COOP_WAVE_TARGET_TIMES[wave] || 35;
  let speedCoins = 0;
  let speedText = 'Bình thường · +10 Xu';
  let speedClass = 'speed-normal';

  if (elapsedSec <= targetSec * 0.6) {
    speedCoins = 40;
    speedText = 'Rất nhanh · +40 Xu';
    speedClass = 'speed-super';
  } else if (elapsedSec <= targetSec * 0.85) {
    speedCoins = 30;
    speedText = 'Nhanh · +30 Xu';
    speedClass = 'speed-fast';
  } else if (elapsedSec <= targetSec) {
    speedCoins = 20;
    speedText = 'Khá nhanh · +20 Xu';
    speedClass = 'speed-fair';
  } else if (elapsedSec <= targetSec * 1.35) {
    speedCoins = 10;
    speedText = 'Bình thường · +10 Xu';
    speedClass = 'speed-normal';
  } else {
    speedCoins = 0;
    speedText = 'Chậm · +0 Xu';
    speedClass = 'speed-slow';
  }

  const isBossWave = (BOSS_WAVES as readonly number[]).includes(wave);
  const bossCoins = isBossWave ? COOP_BOSS_COIN_REWARDS[wave] || 150 : 0;
  const totalEarned = baseCoins + speedCoins + bossCoins;

  const em = Math.floor(elapsedSec / 60);
  const es = Math.floor(elapsedSec % 60);
  const tm = Math.floor(targetSec / 60);
  const ts = Math.floor(targetSec % 60);

  return {
    wave,
    baseCoins,
    speedCoins,
    bossCoins,
    totalEarned,
    speedText,
    speedClass,
    elapsedFormatted: `${String(em).padStart(2, '0')}:${String(es).padStart(2, '0')}`,
    targetFormatted: `${String(tm).padStart(2, '0')}:${String(ts).padStart(2, '0')}`,
    kills: params.kills || 0,
    isFinalWave: wave >= maxWaves,
  };
}

export interface ClientEnvironmentInfo {
  isIOS: boolean;
  isZalo: boolean;
  isMessenger: boolean;
  isInAppBrowser: boolean;
  isFileProtocol: boolean;
  isStandalonePwa: boolean;
  supportsNativeFullscreen: boolean;
}

export function detectClientEnvironment(params: {
  userAgent: string;
  protocol: string;
  hasNativeFullscreen: boolean;
  isStandalone?: boolean;
  maxTouchPoints?: number;
}): ClientEnvironmentInfo {
  const ua = params.userAgent || '';
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && (params.maxTouchPoints || 0) > 1);
  const isZalo = /Zalo/i.test(ua);
  const isMessenger = /FBAN|FBAV|Messenger/i.test(ua);
  const isLineOrInstagram = /Instagram|Line\//i.test(ua);
  const isInAppBrowser = isZalo || isMessenger || isLineOrInstagram;
  const isFileProtocol = isLocalFileProtocol(params.protocol);
  const isStandalonePwa = Boolean(params.isStandalone);
  const supportsNativeFullscreen = Boolean(params.hasNativeFullscreen) && !isIOS;

  return {
    isIOS,
    isZalo,
    isMessenger,
    isInAppBrowser,
    isFileProtocol,
    isStandalonePwa,
    supportsNativeFullscreen,
  };
}

export type TaiDuDroneMode = 'attack' | 'guard' | 'pursuit';

export const TAI_DU_DRONE_MODES: TaiDuDroneMode[] = ['attack', 'guard', 'pursuit'];

export const LUAN_C3_MONOCHROME_DURATION = 1.5;

export const TAI_DU_DRONE_OVERDRIVE_DURATION = 3.0;
export const TAI_DU_MAX_TURRETS = 2;

export function cycleTaiDuDroneMode(current: TaiDuDroneMode): TaiDuDroneMode {
  const idx = TAI_DU_DRONE_MODES.indexOf(current);
  return TAI_DU_DRONE_MODES[(idx + 1) % TAI_DU_DRONE_MODES.length];
}

export function getTaiDuDroneProfile(mode: TaiDuDroneMode) {
  if (mode === 'guard') {
    return {
      mode: 'guard' as const,
      label: 'Hộ Vệ',
      color: '#34D399',
      fireInterval: 0.92,
      damageScale: 0.26,
      dmgRatio: 0.26,
      orbitRadius: 42,
      orbitDist: 42,
      scanRange: 290,
      prioritizeLowHp: false,
      healInterval: 1.7,
      healPctMaxHp: 0.03,
      healPct: 0.03,
      guardAbsorbPct: 0.2,
      guardPulseThreshold: 160,
      guardPulseHealRatio: 0.08,
      pursuitSpeedBonus: 0,
      executeThreshold: 0,
      executeBonusMult: 1,
    };
  }
  if (mode === 'pursuit') {
    return {
      mode: 'pursuit' as const,
      label: 'Truy Kích',
      color: '#F97316',
      fireInterval: 0.46,
      damageScale: 0.38,
      dmgRatio: 0.38,
      orbitRadius: 118,
      orbitDist: 118,
      scanRange: 480,
      prioritizeLowHp: true,
      healInterval: 0,
      healPctMaxHp: 0,
      healPct: 0,
      guardAbsorbPct: 0,
      guardPulseThreshold: 0,
      guardPulseHealRatio: 0,
      pursuitSpeedBonus: 24,
      executeThreshold: 0.35,
      executeBonusMult: 1.25,
    };
  }
  return {
    mode: 'attack' as const,
    label: 'Tấn Công',
    color: '#38BDF8',
    fireInterval: 0.55,
    damageScale: 0.44,
    dmgRatio: 0.44,
    orbitRadius: 56,
    orbitDist: 56,
    scanRange: 390,
    prioritizeLowHp: false,
    healInterval: 0,
    healPctMaxHp: 0,
    healPct: 0,
    guardAbsorbPct: 0,
    guardPulseThreshold: 0,
    guardPulseHealRatio: 0,
    pursuitSpeedBonus: 0,
    executeThreshold: 0,
    executeBonusMult: 1,
  };
}

export function computeTaiDuDroneShot(params: {
  mode: TaiDuDroneMode;
  effectiveAtk: number;
  overdriveActive?: boolean;
  targetHpRatio?: number;
}) {
  const profile = getTaiDuDroneProfile(params.mode);
  const overdriveMult = params.overdriveActive ? 1.18 : 1;
  const fireInterval = params.overdriveActive ? Math.round(profile.fireInterval * 0.65 * 100) / 100 : profile.fireInterval;
  const isExecute =
    profile.executeThreshold > 0 &&
    typeof params.targetHpRatio === 'number' &&
    params.targetHpRatio <= profile.executeThreshold;
  const execMult = isExecute ? profile.executeBonusMult : 1;
  const damage = Math.max(1, Math.round(Math.max(1, params.effectiveAtk) * profile.dmgRatio * overdriveMult * execMult));
  return {
    damage,
    fireInterval,
    isExecute,
    pierceLeft: params.mode === 'pursuit' ? 2 : 1,
  };
}

export function computeNguyenOverhealConversion(params: {
  currentHp: number;
  maxHp: number;
  currentShield: number;
  rawHeal: number;
  healAmp?: number;
  lowHpThreshold?: number;
  lowHpBonusAmp?: number;
  shieldCapRatio?: number;
  convertOverheal?: boolean;
}) {
  const maxHp = Math.max(1, params.maxHp);
  const currentHp = Math.max(0, Math.min(maxHp, params.currentHp));
  const currentShield = Math.max(0, params.currentShield || 0);
  const rawHeal = Math.max(0, params.rawHeal || 0);
  const threshold = params.lowHpThreshold ?? 0.45;
  const isLowHp = currentHp / maxHp <= threshold;
  const lowHpMult = isLowHp ? 1 + (params.lowHpBonusAmp ?? 0.35) : 1;
  const ampMult = 1 + Math.max(0, params.healAmp || 0);
  const totalEffectiveHeal = Math.round(rawHeal * ampMult * lowHpMult);

  const missingHp = Math.max(0, maxHp - currentHp);
  const actualHpHealed = Math.min(missingHp, totalEffectiveHeal);
  const nextHp = currentHp + actualHpHealed;

  const overheal = Math.max(0, totalEffectiveHeal - actualHpHealed);
  const shieldCap = Math.round(maxHp * (params.shieldCapRatio ?? 0.65));
  const convert = params.convertOverheal !== false;
  const shieldAdded = convert ? Math.max(0, Math.min(overheal, Math.max(0, shieldCap - currentShield))) : 0;
  const nextShield = currentShield + shieldAdded;

  return {
    nextHp,
    nextShield,
    actualHpHealed,
    healedHp: actualHpHealed,
    shieldAdded,
    overheal,
    totalEffectiveHeal,
    isLowHp,
  };
}

export function computeLuanPortalBeamTransform(params: {
  baseDamage: number;
  baseRange: number;
  portalCount: number;
  passThroughCount: number;
}) {
  const passed = Math.max(0, params.passThroughCount || 0);
  if (passed <= 0) {
    return {
      damage: Math.round(params.baseDamage),
      range: Math.round(params.baseRange),
      splitStreams: 1,
      boosted: false,
    };
  }
  const activePortals = Math.max(1, Math.min(3, params.portalCount || 1));
  const splitStreams = activePortals >= 2 ? 3 : 2;
  return {
    damage: Math.round(params.baseDamage * 1.28),
    range: Math.round(params.baseRange * 1.45),
    splitStreams,
    boosted: true,
  };
}

export function computeItemParryAndReflect(params: {
  incomingDamage: number;
  parryChance?: number;
  reflectPct?: number;
  damageReduction?: number;
  parryRoll?: number;
}) {
  const incoming = Math.max(0, params.incomingDamage || 0);
  const dr = Math.max(0, Math.min(0.75, params.damageReduction || 0));
  const parryChance = Math.max(0, Math.min(0.6, params.parryChance || 0));
  const roll = params.parryRoll ?? 1;
  const parried = parryChance > 0 && roll < parryChance;

  if (parried) {
    const damageTaken = Math.max(1, Math.round(incoming * 0.2 * (1 - dr)));
    const reflectDamage = Math.round(incoming * (0.45 + Math.max(0, params.reflectPct || 0)));
    return { parried: true, damageTaken, reflectDamage };
  }

  const damageTaken = Math.max(1, Math.round(incoming * (1 - dr)));
  const reflectDamage = Math.round(incoming * Math.max(0, params.reflectPct || 0));
  return { parried: false, damageTaken, reflectDamage };
}

export function computeDanhDragonFormModifiers(active: boolean) {
  return {
    duration: 12,
    cooldown: 22,
    ccImmune: active,
    damageReductionBonus: active ? 0.35 : 0,
    attackSpeedMult: active ? 1.35 : 1.0,
    basicDmgMult: active ? 1.35 : 1.0,
    transformsC1C2ToFireBreath: active,
  };
}

export type LayoutMode = 'auto' | 'portrait' | 'standard';
export type PortraitFovPreset = 'wide' | 'balanced' | 'close';

export interface CameraViewportConfig {
  isPortrait: boolean;
  zoom: number;
  focusX: number;
  focusY: number;
  visibleWorldW: number;
  visibleWorldH: number;
}

export function isPortraitViewport(
  viewW: number,
  viewH: number,
  layoutMode: LayoutMode = 'auto'
): boolean {
  if (layoutMode === 'portrait') return true;
  if (layoutMode === 'standard') return false;
  return viewW > 0 && viewH > 0 && viewH > viewW && viewW <= 760;
}

export function computeCameraViewportConfig(params: {
  viewW: number;
  viewH: number;
  layoutMode?: LayoutMode;
  fovPreset?: PortraitFovPreset;
}): CameraViewportConfig {
  const viewW = Math.max(1, Number(params.viewW) || 1);
  const viewH = Math.max(1, Number(params.viewH) || 1);
  const layoutMode: LayoutMode = params.layoutMode || 'auto';
  const fovPreset: PortraitFovPreset = params.fovPreset || 'balanced';
  const isPortrait = isPortraitViewport(viewW, viewH, layoutMode);

  if (!isPortrait) {
    // On compact landscape phones (short viewport height), zoom out gently so controls moved inward never crowd vertical visibility
    if (viewH > 0 && viewH <= 540 && viewW >= 540) {
      const targetH = 560;
      const zoom = Math.round(Math.max(0.7, Math.min(1, viewH / targetH)) * 1000) / 1000;
      return {
        isPortrait: false,
        zoom,
        focusX: viewW / 2,
        focusY: Math.round(viewH * 0.44),
        visibleWorldW: Math.round(viewW / zoom),
        visibleWorldH: Math.round(viewH / zoom),
      };
    }
    return {
      isPortrait: false,
      zoom: 1,
      focusX: viewW / 2,
      focusY: viewH / 2,
      visibleWorldW: viewW,
      visibleWorldH: viewH,
    };
  }

  const presetBounds: Record<PortraitFovPreset, { targetW: number; minZoom: number; maxZoom: number }> = {
    wide: { targetW: 820, minZoom: 0.44, maxZoom: 0.88 },
    balanced: { targetW: 720, minZoom: 0.48, maxZoom: 0.9 },
    close: { targetW: 560, minZoom: 0.58, maxZoom: 0.96 },
  };
  const cfg = presetBounds[fovPreset] || presetBounds.balanced;
  const rawZoom = viewW / cfg.targetW;
  const zoom = Math.round(Math.max(cfg.minZoom, Math.min(cfg.maxZoom, rawZoom)) * 1000) / 1000;
  const focusX = viewW / 2;
  const focusY = Math.round(viewH * 0.42);

  return {
    isPortrait: true,
    zoom,
    focusX,
    focusY,
    visibleWorldW: Math.round(viewW / zoom),
    visibleWorldH: Math.round(viewH / zoom),
  };
}

export function screenToWorldWithCamera(
  screenX: number,
  screenY: number,
  cameraX: number,
  cameraY: number,
  vp: CameraViewportConfig
): { x: number; y: number } {
  const z = vp.zoom > 0 ? vp.zoom : 1;
  return {
    x: (screenX - vp.focusX) / z + cameraX,
    y: (screenY - vp.focusY) / z + cameraY,
  };
}

export function worldToScreenWithCamera(
  worldX: number,
  worldY: number,
  cameraX: number,
  cameraY: number,
  vp: CameraViewportConfig
): { x: number; y: number } {
  const z = vp.zoom > 0 ? vp.zoom : 1;
  return {
    x: vp.focusX + (worldX - cameraX) * z,
    y: vp.focusY + (worldY - cameraY) * z,
  };
}

export function computeJoystickDragRadius(zoneWidthPx: number): number {
  if (!Number.isFinite(zoneWidthPx) || zoneWidthPx <= 0) return 42;
  return Math.max(28, Math.min(44, Math.round(zoneWidthPx * 0.31)));
}

export const DUY_PASSIVE_MAX_MULT = 4.5;
export const DUY_PASSIVE_RAMP_SEC = 4.5;
export const DUY_QUIET_REGEN_DELAY = 1.2;
export const DUY_DECOY_DURATION = 5.0;
export const DUY_DECOY_BLAST_RADIUS = 195;
export const DUY_DECOY_REFLECT_RATIO = 0.12;
export const DUY_C2_BASE_SHURIKENS = 3;
export const DUY_C2_BONUS_ATK_STEP = 30;
export const DUY_C2_STUN_DUR = 0.75;
export const DUY_C3_BASE_SHURIKENS = 40;
export const DUY_C3_BONUS_ATK_STEP = 30;
export const DUY_C3_SHURIKENS_PER_STEP = 3;
export const DUY_C3_BASE_DMG = 12;
export const DUY_C3_ATK_RATIO = 0.16;
export const DUY_C3_HEAL_PER_HIT = 100;

export function computeDuyPassiveMultiplier(idleSeconds: number): number {
  const t = Math.max(0, Number.isFinite(idleSeconds) ? idleSeconds : 0);
  const ratio = Math.min(1, t / DUY_PASSIVE_RAMP_SEC);
  return Math.round((1 + ratio * (DUY_PASSIVE_MAX_MULT - 1)) * 1000) / 1000;
}

export function computeDuyDecoyBlastDamage(absorbedDamage: number, passiveMultiplier = 1, fallbackAtk = 0): number {
  const absorbed = Math.max(0, Number.isFinite(absorbedDamage) ? absorbedDamage : 0);
  const mult = Math.max(1, Number.isFinite(passiveMultiplier) ? passiveMultiplier : 1);
  if (absorbed > 0) {
    return Math.round(absorbed * DUY_DECOY_REFLECT_RATIO * mult);
  }
  const atk = Math.max(0, Number.isFinite(fallbackAtk) ? fallbackAtk : 0);
  return Math.round((28 + 0.2 * atk) * mult);
}

export function computeDuyC2ShurikenCount(bonusPhysicalAtk: number): number {
  const bonus = Math.max(0, Number.isFinite(bonusPhysicalAtk) ? bonusPhysicalAtk : 0);
  return DUY_C2_BASE_SHURIKENS + Math.floor(bonus / DUY_C2_BONUS_ATK_STEP);
}

export function computeDuyC3ShurikenCount(effectiveAtk: number): number {
  const atk = Math.max(0, Number.isFinite(effectiveAtk) ? effectiveAtk : 0);
  return DUY_C3_BASE_SHURIKENS + Math.floor(atk / DUY_C3_BONUS_ATK_STEP) * DUY_C3_SHURIKENS_PER_STEP;
}

export function computeDuyC3ShurikenDamage(effectiveAtk: number, passiveMultiplier = 1): number {
  const atk = Math.max(0, Number.isFinite(effectiveAtk) ? effectiveAtk : 0);
  const mult = Math.max(1, Number.isFinite(passiveMultiplier) ? passiveMultiplier : 1);
  return Math.round((DUY_C3_BASE_DMG + DUY_C3_ATK_RATIO * atk) * mult);
}

export interface DecoyCandidate {
  id: number | string;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  visualOnly?: boolean;
}

export function selectMonsterTargetWithDecoy<T extends { x: number; y: number }>(
  playerCandidates: T[],
  decoys: DecoyCandidate[],
  fromX: number,
  fromY: number
): { kind: 'decoy'; decoy: DecoyCandidate } | { kind: 'player'; player: T } | null {
  let bestDecoy: DecoyCandidate | null = null;
  let bestDecoyDist = Infinity;
  for (const d of decoys) {
    if (!d || d.visualOnly || d.life >= d.maxLife) continue;
    const dist = Math.hypot(d.x - fromX, d.y - fromY);
    if (dist < bestDecoyDist) {
      bestDecoyDist = dist;
      bestDecoy = d;
    }
  }
  if (bestDecoy) {
    return { kind: 'decoy', decoy: bestDecoy };
  }
  let bestPlayer: T | null = null;
  let bestPlayerDist = Infinity;
  for (const p of playerCandidates) {
    if (!p) continue;
    const dist = Math.hypot(p.x - fromX, p.y - fromY);
    if (dist < bestPlayerDist) {
      bestPlayerDist = dist;
      bestPlayer = p;
    }
  }
  return bestPlayer ? { kind: 'player', player: bestPlayer } : null;
}

export type HeroClassRole = 'fighter' | 'assassin' | 'marksman' | 'mage' | 'tank';
export type HeroRoleFilter = 'all' | HeroClassRole;

export const HERO_ROLE_CATALOG: Record<string, HeroClassRole> = {
  dung: 'fighter',
  eohyen: 'fighter',
  danh: 'fighter',
  dang: 'fighter',
  thien: 'fighter',
  tin: 'assassin',
  bao: 'assassin',
  duy: 'assassin',
  phong: 'assassin',
  trung: 'mage',
  duccong: 'mage',
  luan: 'mage',
  thanh: 'mage',
  kin: 'marksman',
  longhoi: 'marksman',
  taidu: 'marksman',
  nhi: 'marksman',
  gau: 'tank',
  nguyen: 'tank',
};

export const HERO_ROLE_ORDER: HeroRoleFilter[] = [
  'all',
  'fighter',
  'assassin',
  'marksman',
  'mage',
  'tank',
];

export const HERO_ROLE_LABELS: Record<'vi' | 'en', Record<HeroRoleFilter, string>> = {
  vi: {
    all: 'Tất Cả',
    fighter: 'Đấu Sĩ',
    assassin: 'Sát Thủ',
    marksman: 'Xạ Thủ',
    mage: 'Pháp Sư',
    tank: 'Hộ Vệ',
  },
  en: {
    all: 'All',
    fighter: 'Fighter',
    assassin: 'Assassin',
    marksman: 'Marksman',
    mage: 'Mage',
    tank: 'Tank',
  },
};

export function getHeroRoleKey(heroId: string): HeroClassRole {
  return HERO_ROLE_CATALOG[heroId] || 'fighter';
}

export function filterHeroesByRole<T extends { id: string }>(
  heroes: readonly T[],
  roleFilter: HeroRoleFilter
): T[] {
  if (!Array.isArray(heroes)) return [];
  if (!roleFilter || roleFilter === 'all') return [...heroes];
  return heroes.filter((h) => getHeroRoleKey(h?.id) === roleFilter);
}

export const PHONG_MAX_ILLUSIONS = 4;
export const PHONG_ILLUSION_DURATION = 5.5;
export const PHONG_KILL_HEAL_RATIO = 0.08;
export const PHONG_KILL_CD_REFUND = 1.2;

export function computePhongIllusionHitHeal(maxHp: number, ap: number): number {
  const safeMax = Math.max(1, maxHp || 1);
  const safeAp = Math.max(0, ap || 0);
  return Math.max(1, Math.round(safeMax * 0.014 + safeAp * 0.18));
}

export function computePhongMissingHpScale(targetHp: number, targetMaxHp: number): number {
  const safeMax = Math.max(1, targetMaxHp || 1);
  const safeHp = Math.max(0, Math.min(safeMax, targetHp ?? safeMax));
  const missingRatio = (safeMax - safeHp) / safeMax;
  return Number((1 + Math.min(1.2, missingRatio * 1.2)).toFixed(4));
}

export function computePhongC3SlashDamage({
  baseDamage,
  targetHp,
  targetMaxHp,
  isBoss = false,
}: {
  baseDamage: number;
  targetHp: number;
  targetMaxHp: number;
  isBoss?: boolean;
}): number {
  const rawScale = computePhongMissingHpScale(targetHp, targetMaxHp);
  const cappedScale = isBoss ? Math.min(1.85, rawScale) : rawScale;
  return Math.max(1, Math.round(Math.max(0, baseDamage) * cappedScale));
}

export const DANG_RAGE_MAX = 100;
export const DANG_ARMOR_DURATION = 3.2;
export const DANG_ARMOR_DR = 0.42;
export const DANG_C3_AS_BONUS = 0.5;
export const DANG_C3_AS_DURATION = 5.0;

export function computeDangRageGain({
  baseGain,
  currentHp,
  maxHp,
}: {
  baseGain: number;
  currentHp: number;
  maxHp: number;
}): number {
  const safeMax = Math.max(1, maxHp || 1);
  const hpRatio = Math.max(0, Math.min(1, (currentHp ?? safeMax) / safeMax));
  const missingBoost = Math.min(1, Math.max(0, (1 - hpRatio) / 0.8)) * 1.2;
  return Math.max(0, Math.round(Math.max(0, baseGain) * (1 + missingBoost) * 10) / 10);
}

export function computeDangC1WaveHeal(maxHp: number, enemiesHit: number): number {
  const safeMax = Math.max(1, maxHp || 1);
  const count = Math.max(0, enemiesHit || 0);
  if (count <= 0) return 0;
  const ratio = Math.min(0.14, 0.032 + count * 0.018);
  return Math.max(1, Math.round(safeMax * ratio));
}

export const THIEN_ENERGY_MAX = 100;
export const THIEN_ASCENDED_DURATION = 7.0;
export const THIEN_GOD_MODE_CDR_MULT = 5.5;
export const THIEN_GOD_MODE_DMG_MULT = 2.2;
export const THIEN_GOD_MODE_REGEN_PER_SEC = 420;
export const THIEN_C1_SWORD_COUNT = 12;

export function computeThienPassiveGain({
  currentEnergy,
  amount,
  isAscended = false,
}: {
  currentEnergy: number;
  amount: number;
  isAscended?: boolean;
}): { nextEnergy: number; triggeredAscension: boolean } {
  const cur = Math.max(0, Math.min(THIEN_ENERGY_MAX, Number.isFinite(currentEnergy) ? currentEnergy : 0));
  const add = Math.max(0, Number.isFinite(amount) ? amount : 0);
  if (isAscended) {
    return { nextEnergy: THIEN_ENERGY_MAX, triggeredAscension: false };
  }
  const sum = Math.min(THIEN_ENERGY_MAX, Math.round((cur + add) * 10) / 10);
  if (sum >= THIEN_ENERGY_MAX) {
    return { nextEnergy: THIEN_ENERGY_MAX, triggeredAscension: true };
  }
  return { nextEnergy: sum, triggeredAscension: false };
}

export function computeThienCooldownTickRate({
  baseCdr = 0,
  isAscended = false,
  godMode = false,
}: {
  baseCdr?: number;
  isAscended?: boolean;
  godMode?: boolean;
}): number {
  const clampedCdr = Math.max(0, Math.min(0.7, Number.isFinite(baseCdr) ? baseCdr : 0));
  let rate = 1 / Math.max(0.3, 1 - clampedCdr);
  if (isAscended) rate *= 1.45;
  if (godMode) rate *= THIEN_GOD_MODE_CDR_MULT;
  return Number(rate.toFixed(4));
}

export function computeThienAscendedModifiers({
  isAscended = false,
  godMode = false,
}: {
  isAscended?: boolean;
  godMode?: boolean;
}): { dmgMult: number; cdrTickRate: number; regenPerSec: number } {
  const dmgMult = (isAscended ? 1.38 : 1.0) * (godMode ? THIEN_GOD_MODE_DMG_MULT : 1.0);
  const regenPerSec = (isAscended ? 160 : 0) + (godMode ? THIEN_GOD_MODE_REGEN_PER_SEC : 0);
  const cdrTickRate = computeThienCooldownTickRate({ baseCdr: 0, isAscended, godMode });
  return {
    dmgMult: Number(dmgMult.toFixed(4)),
    cdrTickRate,
    regenPerSec,
  };
}

export function computeThienC1SwordDamage({
  atk,
  ap,
  isBoss = false,
}: {
  atk: number;
  ap: number;
  isBoss?: boolean;
}): number {
  const safeAtk = Math.max(0, atk || 0);
  const safeAp = Math.max(0, ap || 0);
  const base = 75 + safeAtk * 0.65 + safeAp * 0.72;
  return Math.max(1, Math.round(isBoss ? base * 1.15 : base));
}

export function computeThienC2Detonation({
  storedDamage,
  atk,
  ap,
  maxHp,
}: {
  storedDamage: number;
  atk: number;
  ap: number;
  maxHp: number;
}): { damage: number; heal: number; shield: number } {
  const safeStored = Math.max(0, storedDamage || 0);
  const safeAtk = Math.max(0, atk || 0);
  const safeAp = Math.max(0, ap || 0);
  const safeMaxHp = Math.max(1, maxHp || 5000);
  const damage = Math.max(1, Math.round(240 + safeAtk * 1.1 + safeAp * 1.55 + safeStored * 1.45));
  const heal = Math.max(1, Math.round(safeMaxHp * 0.12 + safeAp * 0.8 + safeStored * 0.35));
  const shield = Math.max(1, Math.round(safeMaxHp * 0.14 + safeAp * 1.1 + safeStored * 0.45));
  return { damage, heal, shield };
}

export function computeThienC4JudgementDamage({
  atk,
  ap,
  targetMaxHp,
  isBoss = false,
}: {
  atk: number;
  ap: number;
  targetMaxHp: number;
  isBoss?: boolean;
}): { damage: number; executeRegular: boolean } {
  const safeAtk = Math.max(0, atk || 0);
  const safeAp = Math.max(0, ap || 0);
  const safeTargetMax = Math.max(1, targetMaxHp || 1);
  if (!isBoss) {
    return {
      damage: Math.max(Math.round(safeTargetMax * 1.2), Math.round(1200 + safeAtk * 2.5 + safeAp * 3.5)),
      executeRegular: true,
    };
  }
  return {
    damage: Math.max(1, Math.round(820 + safeAtk * 2.4 + safeAp * 3.4)),
    executeRegular: false,
  };
}

export function computeThienDamageBreakdownTotal(breakdown: Partial<Record<'atk' | 'c1' | 'c2' | 'c3' | 'c4', number>> | null | undefined): number {
  if (!breakdown) return 0;
  return (
    Math.max(0, Math.round(breakdown.atk || 0)) +
    Math.max(0, Math.round(breakdown.c1 || 0)) +
    Math.max(0, Math.round(breakdown.c2 || 0)) +
    Math.max(0, Math.round(breakdown.c3 || 0)) +
    Math.max(0, Math.round(breakdown.c4 || 0))
  );
}

// =====================================================================
// THANH (PHÁP SƯ MÃNG XÀ) & NHI (XẠ THỦ ĐỘC DƯỢC) COMBAT HELPERS
// =====================================================================

export const THANH_ECHO_DELAY = 0.8;
export const THANH_ECHO_DMG_RATIO = 0.35;
export const THANH_ECHO_MAX_QUEUE = 6;
export const THANH_PASSIVE_BURST_WINDOW = 1.5;
export const THANH_PASSIVE_BURST_THRESHOLD_RATIO = 0.16;
export const THANH_PASSIVE_SHIELD_RATIO = 0.12;
export const THANH_PASSIVE_HEAL_RATIO = 0.06;
export const THANH_PASSIVE_CD = 18;
export const THANH_C1_POISON_DURATION = 2.0;
export const THANH_C1_MULTI_HIT_BONUS = 0.4;
export const THANH_C1_HEAL_MAX_RATIO = 0.09;
export const THANH_C2_MAX_SWALLOW_PER_CAST = 4;
export const THANH_C2_ZONE_DURATION = 5.0;
export const THANH_C2_ZONE_SLOW = 0.3;
export const THANH_C2_HEAL_RATIO_PER_TICK = 0.028;
export const THANH_C3_GUARD_COUNT = 4;
export const THANH_C3_GUARD_DURATION = 7.0;
export const THANH_C3_GUARD_DR = 0.22;
export const THANH_C3_SACRIFICE_HP_THRESHOLD = 0.35;
export const THANH_C3_SACRIFICE_SHIELD_RATIO = 0.1;
export const THANH_C3_SACRIFICE_HEAL_RATIO = 0.08;
export const THANH_C3_SACRIFICE_ICD = 2.5;

export function evaluateThanhBurstPassive({
  events,
  now,
  incomingDamage,
  maxHp,
  passiveCd,
}: {
  events: ReadonlyArray<{ time: number; amount: number }>;
  now: number;
  incomingDamage: number;
  maxHp: number;
  passiveCd: number;
}): {
  recentEvents: Array<{ time: number; amount: number }>;
  burstSum: number;
  triggered: boolean;
  shield: number;
  heal: number;
  nextCooldown: number;
} {
  const safeMaxHp = Math.max(1, maxHp || 1050);
  const safeNow = Number.isFinite(now) ? now : 0;
  const cutoff = safeNow - THANH_PASSIVE_BURST_WINDOW;
  const recentEvents = Array.isArray(events)
    ? events.filter((ev) => ev && ev.time >= cutoff && ev.amount > 0).map((ev) => ({ time: ev.time, amount: ev.amount }))
    : [];
  const dmg = Math.max(0, Number.isFinite(incomingDamage) ? incomingDamage : 0);
  if (dmg > 0) recentEvents.push({ time: safeNow, amount: dmg });
  if (recentEvents.length > 24) recentEvents.splice(0, recentEvents.length - 24);
  const burstSum = recentEvents.reduce((acc, ev) => acc + ev.amount, 0);
  const threshold = Math.max(1, Math.round(safeMaxHp * THANH_PASSIVE_BURST_THRESHOLD_RATIO));
  const cd = Math.max(0, Number.isFinite(passiveCd) ? passiveCd : 0);
  if (cd <= 0 && burstSum >= threshold) {
    return {
      recentEvents: [],
      burstSum,
      triggered: true,
      shield: Math.max(1, Math.round(safeMaxHp * THANH_PASSIVE_SHIELD_RATIO)),
      heal: Math.max(1, Math.round(safeMaxHp * THANH_PASSIVE_HEAL_RATIO)),
      nextCooldown: THANH_PASSIVE_CD,
    };
  }
  return {
    recentEvents,
    burstSum,
    triggered: false,
    shield: 0,
    heal: 0,
    nextCooldown: cd,
  };
}

export function computeThanhC1SnakeDamage({
  ap,
  atk,
  priorHitsOnTarget = 0,
  isEcho = false,
}: {
  ap: number;
  atk: number;
  priorHitsOnTarget?: number;
  isEcho?: boolean;
}): number {
  const safeAp = Math.max(0, ap || 0);
  const safeAtk = Math.max(0, atk || 0);
  const base = 54 + safeAp * 0.92 + safeAtk * 0.35;
  const repeatMult = priorHitsOnTarget > 0 ? 1 + THANH_C1_MULTI_HIT_BONUS : 1;
  const echoMult = isEcho ? THANH_ECHO_DMG_RATIO : 1;
  return Math.max(1, Math.round(base * repeatMult * echoMult));
}

export function computeThanhC1BoundedHeal({
  maxHp,
  ap,
  alreadyHealed,
  isEcho = false,
}: {
  maxHp: number;
  ap: number;
  alreadyHealed: number;
  isEcho?: boolean;
}): number {
  const safeMax = Math.max(1, maxHp || 1050);
  const safeAp = Math.max(0, ap || 0);
  const capRatio = isEcho ? THANH_C1_HEAL_MAX_RATIO * THANH_ECHO_DMG_RATIO : THANH_C1_HEAL_MAX_RATIO;
  const cap = Math.max(10, Math.round(safeMax * capRatio + safeAp * (isEcho ? 0.16 : 0.45)));
  const remaining = Math.max(0, cap - Math.max(0, alreadyHealed || 0));
  if (remaining <= 0) return 0;
  const stepHeal = Math.max(6, Math.round((safeMax * 0.022 + safeAp * 0.14) * (isEcho ? THANH_ECHO_DMG_RATIO : 1)));
  return Math.min(remaining, stepHeal);
}

const THANH_LARGE_MONSTER_KINDS = new Set(['brute', 'shield_knight', 'boss']);

export function isThanhC2SwallowEligible({
  kind,
  radius = 16,
  isMiniBoss = false,
  swallowedCount = 0,
  isEcho = false,
}: {
  kind: string;
  radius?: number;
  isMiniBoss?: boolean;
  swallowedCount?: number;
  isEcho?: boolean;
}): boolean {
  if (isEcho) return false;
  if (!kind || kind === 'boss' || isMiniBoss || THANH_LARGE_MONSTER_KINDS.has(kind)) return false;
  if ((radius || 0) > 21) return false;
  return (swallowedCount || 0) < THANH_C2_MAX_SWALLOW_PER_CAST;
}

export function computeThanhC2Damage({
  ap,
  atk,
  isLargeOrBoss = false,
  isEcho = false,
}: {
  ap: number;
  atk: number;
  isLargeOrBoss?: boolean;
  isEcho?: boolean;
}): number {
  const safeAp = Math.max(0, ap || 0);
  const safeAtk = Math.max(0, atk || 0);
  const base = isLargeOrBoss ? 128 + safeAp * 1.95 + safeAtk * 0.65 : 88 + safeAp * 1.35 + safeAtk * 0.45;
  return Math.max(1, Math.round(base * (isEcho ? THANH_ECHO_DMG_RATIO : 1)));
}

export function computeThanhC3Sacrifice({
  currentHp,
  maxHp,
  guardCount,
  sacrificeIcd,
  hitDamage,
}: {
  currentHp: number;
  maxHp: number;
  guardCount: number;
  sacrificeIcd: number;
  hitDamage: number;
}): {
  shouldSacrifice: boolean;
  shield: number;
  heal: number;
  nextIcd: number;
} {
  const safeMax = Math.max(1, maxHp || 1050);
  const safeHp = Math.max(0, currentHp || 0);
  const inDanger =
    safeHp > 0 &&
    (safeHp <= safeMax * THANH_C3_SACRIFICE_HP_THRESHOLD || hitDamage >= safeMax * 0.14);
  if ((guardCount || 0) > 0 && (sacrificeIcd || 0) <= 0 && inDanger) {
    return {
      shouldSacrifice: true,
      shield: Math.max(1, Math.round(safeMax * THANH_C3_SACRIFICE_SHIELD_RATIO)),
      heal: Math.max(1, Math.round(safeMax * THANH_C3_SACRIFICE_HEAL_RATIO)),
      nextIcd: THANH_C3_SACRIFICE_ICD,
    };
  }
  return {
    shouldSacrifice: false,
    shield: 0,
    heal: 0,
    nextIcd: Math.max(0, sacrificeIcd || 0),
  };
}

export type NhiAmmoType = 'purple' | 'green' | 'life';
export const NHI_AMMO_TYPES: readonly NhiAmmoType[] = ['purple', 'green', 'life'] as const;

export const NHI_PASSIVE_HP_THRESHOLD = 0.5;
export const NHI_PASSIVE_HEAL_RATIO = 0.12;
export const NHI_PASSIVE_MIST_DURATION = 4.0;
export const NHI_PASSIVE_SLOW = 0.3;
export const NHI_PASSIVE_CD = 24;
export const NHI_C2_MAX_ZONES = 6;
export const NHI_C2_ZONE_DURATION = 5.0;
export const NHI_C2_TETHER_RANGE = 260;
export const NHI_C2_HEAL_INTERVAL = 0.5;
export const NHI_C2_HEAL_RATIO_PER_TICK = 0.026;
export const NHI_C3_FIRST_HIT_MULT = 1.35;
export const NHI_C3_BOSS_CURRENT_HP_PCT = 0.05;
export const NHI_C3_BOSS_PCT_CAP = 340;
export const NHI_C3_HEAL_RATIO = 0.18;
export const NHI_C3_HEAL_MAX_RATIO = 0.16;

export function cycleNhiAmmoType(current: NhiAmmoType | string = 'purple'): NhiAmmoType {
  const idx = NHI_AMMO_TYPES.indexOf(current as NhiAmmoType);
  if (idx < 0) return 'green';
  return NHI_AMMO_TYPES[(idx + 1) % NHI_AMMO_TYPES.length];
}

export function getNhiAmmoProfile(ammo: NhiAmmoType | string = 'purple'): {
  id: NhiAmmoType;
  labelVi: string;
  labelEn: string;
  color: string;
  dmgMult: number;
  pierceLeft: number;
  aoeRadius: number;
  slowFactor: number;
  slowDur: number;
  poisonDur: number;
  poisonMult: number;
  healRatio: number;
} {
  if (ammo === 'green') {
    return {
      id: 'green',
      labelVi: 'Lục Dược',
      labelEn: 'Green Venom',
      color: '#22C55E',
      dmgMult: 0.96,
      pierceLeft: 1,
      aoeRadius: 88,
      slowFactor: 0.3,
      slowDur: 2.0,
      poisonDur: 1.5,
      poisonMult: 0.65,
      healRatio: 0,
    };
  }
  if (ammo === 'life') {
    return {
      id: 'life',
      labelVi: 'Sinh Dược',
      labelEn: 'Vital Tonic',
      color: '#34D399',
      dmgMult: 0.92,
      pierceLeft: 3,
      aoeRadius: 0,
      slowFactor: 0,
      slowDur: 0,
      poisonDur: 1.5,
      poisonMult: 0.6,
      healRatio: 0.15,
    };
  }
  return {
    id: 'purple',
    labelVi: 'Tử Dược',
    labelEn: 'Purple Toxin',
    color: '#A855F7',
    dmgMult: 1.04,
    pierceLeft: 1,
    aoeRadius: 0,
    slowFactor: 0,
    slowDur: 0,
    poisonDur: 3.0,
    poisonMult: 1.35,
    healRatio: 0,
  };
}

export function computeNhiPoisonDps({
  stacks,
  ap,
  atk,
  isBoss = false,
}: {
  stacks: number;
  ap: number;
  atk: number;
  isBoss?: boolean;
}): number {
  const safeStacks = Math.max(1, Math.min(5, Math.floor(stacks || 1)));
  const safeAp = Math.max(0, ap || 0);
  const safeAtk = Math.max(0, atk || 0);
  const raw = (14 + safeAp * 0.42 + safeAtk * 0.2) * (1 + (safeStacks - 1) * 0.25);
  return Math.max(6, Math.round(isBoss ? Math.min(220, raw * 0.85) : raw));
}

export function computeNhiC1LifeHeal({
  damageDealt,
  maxHp,
  alreadyHealed,
  isSkillShot = false,
}: {
  damageDealt: number;
  maxHp: number;
  alreadyHealed: number;
  isSkillShot?: boolean;
}): number {
  const safeMax = Math.max(1, maxHp || 900);
  const cap = Math.max(14, Math.round(safeMax * (isSkillShot ? 0.08 : 0.045)));
  const rem = Math.max(0, cap - Math.max(0, alreadyHealed || 0));
  if (rem <= 0) return 0;
  const rawHeal = Math.max(4, Math.round(Math.max(0, damageDealt || 0) * 0.15));
  return Math.min(rem, rawHeal);
}

export function computeNhiPoisonZoneTethers<T extends { id: number; x: number; y: number }>(
  zones: readonly T[],
  maxRange: number = NHI_C2_TETHER_RANGE
): Array<{ a: T; b: T }> {
  const res: Array<{ a: T; b: T }> = [];
  if (!Array.isArray(zones) || zones.length < 2) return res;
  const r2 = maxRange * maxRange;
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const dx = zones[j].x - zones[i].x;
      const dy = zones[j].y - zones[i].y;
      if (dx * dx + dy * dy <= r2) {
        res.push({ a: zones[i], b: zones[j] });
        if (res.length >= 12) return res;
      }
    }
  }
  return res;
}

export function selectHighestHpTarget<T extends { id: number; x: number; y: number; hp: number; radius?: number }>(
  enemies: readonly T[],
  originX: number,
  originY: number,
  maxRange: number = 640
): T | null {
  if (!Array.isArray(enemies) || enemies.length === 0) return null;
  let best: T | null = null;
  let bestHp = -1;
  let bestDist = Infinity;
  for (const e of enemies) {
    if (!e || (e.hp || 0) <= 0) continue;
    const dist = Math.hypot(e.x - originX, e.y - originY) - (e.radius || 0);
    if (dist > maxRange) continue;
    if (e.hp > bestHp + 0.5 || (Math.abs(e.hp - bestHp) <= 0.5 && dist < bestDist)) {
      best = e;
      bestHp = e.hp;
      bestDist = dist;
    }
  }
  return best;
}

export function computeNhiC3ArrowDamage({
  atk,
  ap,
  targetCurrentHp,
  isFirstHit = false,
  isBoss = false,
}: {
  atk: number;
  ap: number;
  targetCurrentHp: number;
  isFirstHit?: boolean;
  isBoss?: boolean;
}): number {
  const safeAtk = Math.max(0, atk || 0);
  const safeAp = Math.max(0, ap || 0);
  const base = 105 + safeAtk * 1.45 + safeAp * 1.05;
  const mult = isFirstHit ? NHI_C3_FIRST_HIT_MULT : 1.0;
  const bossPctRaw = isBoss ? Math.round(Math.max(0, targetCurrentHp || 0) * NHI_C3_BOSS_CURRENT_HP_PCT) : 0;
  const bossBonus = isBoss ? Math.min(NHI_C3_BOSS_PCT_CAP, bossPctRaw) : 0;
  return Math.max(1, Math.round(base * mult + bossBonus));
}

export function computeNhiC3BoundedHeal({
  damageDealt,
  maxHp,
  alreadyHealed,
}: {
  damageDealt: number;
  maxHp: number;
  alreadyHealed: number;
}): number {
  const safeMax = Math.max(1, maxHp || 900);
  const cap = Math.max(24, Math.round(safeMax * NHI_C3_HEAL_MAX_RATIO));
  const rem = Math.max(0, cap - Math.max(0, alreadyHealed || 0));
  if (rem <= 0) return 0;
  const heal = Math.max(6, Math.round(Math.max(0, damageDealt || 0) * NHI_C3_HEAL_RATIO));
  return Math.min(rem, heal);
}

// =========================================================================
// PERFORMANCE, THERMAL STABILITY, FRUSTUM CULLING & ADAPTIVE SYNC HELPERS
// =========================================================================

export type QualityMode = "auto" | "high" | "balanced" | "saver";
export type FpsCapMode = "auto" | "60" | "45" | "30";
export type EffectivePerformanceTier = "high" | "balanced" | "saver";

export interface DeviceHardwareProfile {
  tier: EffectivePerformanceTier;
  isMobile: boolean;
  isInAppBrowser: boolean;
  isIOS: boolean;
  cores: number;
  memoryGb: number;
  reducedMotion: boolean;
}

export interface PerformanceProfile {
  effectiveTier: EffectivePerformanceTier;
  targetFps: number;
  maxDpr: number;
  maxCanvasDim: number;
  particleBudgetScale: number;
  maxParticles: number;
  maxFlames: number;
  maxBlood: number;
  maxCrystals: number;
  maxSmoke: number;
  maxFloatingTexts: number;
  maxCracks: number;
  maxScorch: number;
  maxCorpses: number;
  maxAfterimages: number;
  maxSlashes: number;
  maxLightnings: number;
  maxExplosions: number;
  maxImpactBursts: number;
  maxXpOrbs: number;
  enableRadialGlows: boolean;
  enableSecondaryGradients: boolean;
  gridStepPx: number;
  hudIntervalMs: number;
  audioMaxVoices: number;
  audioLowPower: boolean;
}

export interface WorldViewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function normalizeQualityMode(raw: unknown): QualityMode {
  if (raw === "high" || raw === "balanced" || raw === "saver" || raw === "auto") {
    return raw;
  }
  return "auto";
}

export function normalizeFpsCapMode(raw: unknown): FpsCapMode {
  if (raw === "60" || raw === "45" || raw === "30" || raw === "auto") {
    return raw;
  }
  return "auto";
}

export function detectDeviceHardwareTier(env?: {
  userAgent?: string;
  cores?: number;
  memoryGb?: number;
  devicePixelRatio?: number;
  reducedMotion?: boolean;
}): DeviceHardwareProfile {
  const ua =
    typeof env?.userAgent === "string"
      ? env.userAgent
      : typeof navigator !== "undefined" && typeof navigator.userAgent === "string"
      ? navigator.userAgent
      : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = isIOS || /Android|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(ua);
  const isInAppBrowser = /Zalo|FBAN|FBAV|Messenger|Instagram|Line|MicroMessenger|WebView/i.test(ua);

  const coresRaw =
    typeof env?.cores === "number"
      ? env.cores
      : typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : 4;
  const cores = Math.max(1, Math.round(coresRaw || 4));

  const memRaw =
    typeof env?.memoryGb === "number"
      ? env.memoryGb
      : typeof navigator !== "undefined" &&
        typeof (navigator as unknown as { deviceMemory?: unknown }).deviceMemory === "number"
      ? Number((navigator as unknown as { deviceMemory: number }).deviceMemory)
      : isMobile
      ? 4
      : 8;
  const memoryGb = Math.max(0.5, memRaw || (isMobile ? 4 : 8));

  const reducedMotion =
    typeof env?.reducedMotion === "boolean"
      ? env.reducedMotion
      : typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        Boolean(window.matchMedia("(prefers-reduced-motion: reduce)")?.matches);

  let tier: EffectivePerformanceTier = "balanced";
  if (reducedMotion || cores <= 2 || memoryGb <= 2 || (isInAppBrowser && isMobile)) {
    tier = "saver";
  } else if (!isMobile && cores >= 6 && memoryGb >= 4) {
    tier = "high";
  } else if (isMobile && cores >= 6 && memoryGb >= 6 && !isInAppBrowser) {
    tier = "balanced";
  } else if (isMobile && (cores <= 4 || memoryGb <= 3)) {
    tier = "saver";
  }

  return {
    tier,
    isMobile,
    isInAppBrowser,
    isIOS,
    cores,
    memoryGb,
    reducedMotion,
  };
}

export function resolvePerformanceProfile({
  qualityMode = "auto",
  fpsCapMode = "auto",
  hardware,
  adaptiveStep = 0,
  hidden = false,
}: {
  qualityMode?: QualityMode;
  fpsCapMode?: FpsCapMode;
  hardware?: DeviceHardwareProfile;
  adaptiveStep?: number;
  hidden?: boolean;
} = {}): PerformanceProfile {
  const hw = hardware || detectDeviceHardwareTier();
  const qMode = normalizeQualityMode(qualityMode);
  const fMode = normalizeFpsCapMode(fpsCapMode);

  let effectiveTier: EffectivePerformanceTier = qMode === "auto" ? hw.tier : qMode;

  if (qMode === "auto" && adaptiveStep > 0) {
    if (adaptiveStep >= 2) {
      effectiveTier = "saver";
    } else if (effectiveTier === "high") {
      effectiveTier = "balanced";
    } else {
      effectiveTier = "saver";
    }
  }

  // Never exceed 60 FPS even on 120Hz ProMotion screens in auto mode so devices stay cool.
  let targetFps = 60;
  if (hidden) {
    targetFps = 10;
  } else if (fMode === "30") {
    targetFps = 30;
  } else if (fMode === "45") {
    targetFps = 45;
  } else if (fMode === "60") {
    targetFps = 60;
  } else {
    // auto fps cap
    if (effectiveTier === "saver") {
      targetFps = hw.isMobile ? 45 : 60;
    } else if (hw.isMobile && effectiveTier === "balanced") {
      targetFps = adaptiveStep >= 1 ? 45 : 60;
    } else {
      targetFps = 60;
    }
  }

  if (effectiveTier === "saver") {
    return {
      effectiveTier,
      targetFps,
      maxDpr: hw.isIOS ? 1.25 : 1.15,
      maxCanvasDim: hw.isMobile ? 1600 : 1920,
      particleBudgetScale: 0.4,
      maxParticles: 56,
      maxFlames: 32,
      maxBlood: 32,
      maxCrystals: 28,
      maxSmoke: 24,
      maxFloatingTexts: 28,
      maxCracks: 16,
      maxScorch: 16,
      maxCorpses: 18,
      maxAfterimages: 16,
      maxSlashes: 24,
      maxLightnings: 18,
      maxExplosions: 10,
      maxImpactBursts: 14,
      maxXpOrbs: 90,
      enableRadialGlows: false,
      enableSecondaryGradients: false,
      gridStepPx: 200,
      hudIntervalMs: 110,
      audioMaxVoices: 14,
      audioLowPower: true,
    };
  }

  if (effectiveTier === "balanced") {
    return {
      effectiveTier,
      targetFps,
      maxDpr: hw.isMobile ? 1.5 : 1.65,
      maxCanvasDim: hw.isIOS ? 2048 : 2560,
      particleBudgetScale: 0.7,
      maxParticles: 95,
      maxFlames: 56,
      maxBlood: 52,
      maxCrystals: 44,
      maxSmoke: 36,
      maxFloatingTexts: 42,
      maxCracks: 28,
      maxScorch: 24,
      maxCorpses: 28,
      maxAfterimages: 24,
      maxSlashes: 36,
      maxLightnings: 28,
      maxExplosions: 16,
      maxImpactBursts: 18,
      maxXpOrbs: 140,
      enableRadialGlows: true,
      enableSecondaryGradients: !hw.isMobile,
      gridStepPx: 100,
      hudIntervalMs: 85,
      audioMaxVoices: 20,
      audioLowPower: hw.isMobile,
    };
  }

  // high tier
  return {
    effectiveTier,
    targetFps,
    maxDpr: hw.isMobile ? 1.75 : 2,
    maxCanvasDim: 2880,
    particleBudgetScale: 1,
    maxParticles: 140,
    maxFlames: 90,
    maxBlood: 84,
    maxCrystals: 68,
    maxSmoke: 54,
    maxFloatingTexts: 64,
    maxCracks: 42,
    maxScorch: 34,
    maxCorpses: 40,
    maxAfterimages: 36,
    maxSlashes: 50,
    maxLightnings: 38,
    maxExplosions: 24,
    maxImpactBursts: 24,
    maxXpOrbs: 200,
    enableRadialGlows: true,
    enableSecondaryGradients: true,
    gridStepPx: 100,
    hudIntervalMs: 65,
    audioMaxVoices: 26,
    audioLowPower: false,
  };
}

export function stepAdaptiveQualityGovernor({
  frameTimeEmaMs,
  currentStep,
  cooldownSec,
  dtSec,
}: {
  frameTimeEmaMs: number;
  currentStep: number;
  cooldownSec: number;
  dtSec: number;
}): { nextStep: number; nextCooldownSec: number; changed: boolean } {
  const safeCooldown = Math.max(0, cooldownSec - Math.max(0, dtSec));
  if (safeCooldown > 0) {
    return { nextStep: currentStep, nextCooldownSec: safeCooldown, changed: false };
  }
  if (frameTimeEmaMs > 23 && currentStep < 2) {
    return { nextStep: currentStep + 1, nextCooldownSec: 3.0, changed: true };
  }
  if (frameTimeEmaMs < 11.5 && currentStep > 0) {
    return { nextStep: currentStep - 1, nextCooldownSec: 5.0, changed: true };
  }
  return { nextStep: currentStep, nextCooldownSec: 0, changed: false };
}

export function computeWorldViewBounds(
  cameraX: number,
  cameraY: number,
  viewport: { visibleWorldW?: number; visibleWorldH?: number; viewW?: number; viewH?: number; zoom?: number },
  padding = 140
): WorldViewBounds {
  const zoom = Math.max(0.2, Number(viewport?.zoom) || 1);
  const w = Number(viewport?.visibleWorldW) || (Number(viewport?.viewW) || 1280) / zoom;
  const h = Number(viewport?.visibleWorldH) || (Number(viewport?.viewH) || 720) / zoom;
  const halfW = w * 0.5 + padding;
  const halfH = h * 0.5 + padding;
  return {
    minX: cameraX - halfW,
    maxX: cameraX + halfW,
    minY: cameraY - halfH,
    maxY: cameraY + halfH,
  };
}

export function isCircleInViewBounds(
  x: number,
  y: number,
  radius: number,
  bounds: WorldViewBounds | null | undefined
): boolean {
  if (!bounds) return true;
  const r = Math.max(0, radius || 0);
  return (
    x + r >= bounds.minX &&
    x - r <= bounds.maxX &&
    y + r >= bounds.minY &&
    y - r <= bounds.maxY
  );
}

export function isSegmentInViewBounds(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  padding: number,
  bounds: WorldViewBounds | null | undefined
): boolean {
  if (!bounds) return true;
  const minSegX = Math.min(x1, x2) - padding;
  const maxSegX = Math.max(x1, x2) + padding;
  const minSegY = Math.min(y1, y2) - padding;
  const maxSegY = Math.max(y1, y2) + padding;
  return (
    maxSegX >= bounds.minX &&
    minSegX <= bounds.maxX &&
    maxSegY >= bounds.minY &&
    minSegY <= bounds.maxY
  );
}

export function swapRemoveAt<T>(arr: T[], index: number): void {
  const last = arr.length - 1;
  if (index < 0 || index > last) return;
  if (index !== last) {
    arr[index] = arr[last];
  }
  arr.pop();
}

export function computeAdaptiveSyncIntervals({
  transportMode,
  isRelayMode,
  isActing,
  rttMs = 0,
  networkEffectiveType = "",
}: {
  transportMode: string | null | undefined;
  isRelayMode: boolean;
  isActing: boolean;
  rttMs?: number;
  networkEffectiveType?: string;
}): { playerInterval: number; worldInterval: number; vfxInterval: number } {
  const isSlowNet = networkEffectiveType === "slow-2g" || networkEffectiveType === "2g" || rttMs > 260;
  const isModerateNet = networkEffectiveType === "3g" || (rttMs > 140 && rttMs <= 260);
  const isP2P = transportMode === "p2p_host" || transportMode === "p2p_peer";

  let playerInterval = isRelayMode
    ? isActing
      ? 0.055
      : 0.1
    : isP2P
    ? isActing
      ? 0.033
      : 0.08
    : isActing
    ? 0.04
    : 0.085;
  let worldInterval = isRelayMode ? 0.06 : isP2P ? 0.038 : 0.042;
  let vfxInterval = isRelayMode ? 0.045 : 0.028;

  if (isSlowNet) {
    playerInterval = Math.min(0.16, playerInterval * 1.45);
    worldInterval = Math.min(0.11, worldInterval * 1.45);
    vfxInterval = Math.min(0.08, vfxInterval * 1.4);
  } else if (isModerateNet) {
    playerInterval = Math.min(0.13, playerInterval * 1.2);
    worldInterval = Math.min(0.08, worldInterval * 1.2);
    vfxInterval = Math.min(0.06, vfxInterval * 1.2);
  }

  return { playerInterval, worldInterval, vfxInterval };
}

// =====================================================================
// DŨNG YÊU SANY (CHIẾN THẦN SẤM SÉT) BUFF CONSTANTS & HELPERS
// =====================================================================

export const DUNG_BASE_CRIT = 0.28;
export const DUNG_MAX_CRIT = 0.80;
export const DUNG_BUFFED_MAX_CRIT = 0.95;
export const DUNG_BASE_CRIT_DMG_RATIO = 2.05;
export const DUNG_BASE_LIFESTEAL = 0.12;
export const DUNG_C1_COOLDOWN = 4.2;
export const DUNG_C2_COOLDOWN = 10.5;
export const DUNG_C3_COOLDOWN = 21.0;
export const DUNG_C2_DURATION = 6.5;
export const DUNG_C3_DURATION = 10.5;
export const DUNG_C2_CRIT_BONUS = 0.10;
export const DUNG_C2_CRIT_DMG_BONUS = 0.20;
export const DUNG_C3_CRIT_BONUS = 0.18;
export const DUNG_C3_CRIT_DMG_BONUS = 0.35;
export const DUNG_C3_BOSS_DMG_MULT = 1.30;

export function computeDungCritProfile({
  baseAndGearCrit = DUNG_BASE_CRIT,
  berserkActive = false,
  c3Active = false,
}: {
  baseAndGearCrit?: number;
  berserkActive?: boolean;
  c3Active?: boolean;
}): {
  critChance: number;
  critDmgRatio: number;
} {
  const safeBaseGear = Math.min(DUNG_MAX_CRIT, Math.max(DUNG_BASE_CRIT, Number.isFinite(baseAndGearCrit) ? baseAndGearCrit : DUNG_BASE_CRIT));
  const bonusCrit = (berserkActive ? DUNG_C2_CRIT_BONUS : 0) + (c3Active ? DUNG_C3_CRIT_BONUS : 0);
  const maxAllowed = bonusCrit > 0 ? DUNG_BUFFED_MAX_CRIT : DUNG_MAX_CRIT;
  const critChance = Math.min(maxAllowed, Number((safeBaseGear + bonusCrit).toFixed(4)));
  const critDmgRatio = Number(
    (
      DUNG_BASE_CRIT_DMG_RATIO +
      (berserkActive ? DUNG_C2_CRIT_DMG_BONUS : 0) +
      (c3Active ? DUNG_C3_CRIT_DMG_BONUS : 0)
    ).toFixed(4)
  );
  return { critChance, critDmgRatio };
}

export function computeDungHealValues({
  maxHp,
  c3Active = false,
}: {
  maxHp: number;
  c3Active?: boolean;
}): {
  passiveHeal: number;
  c1HitHeal: number;
  c2CastHeal: number;
  c2HitHeal: number;
  c3CastHeal: number;
  c3HitBonusHeal: number;
} {
  const safeMaxHp = Math.max(1, Number.isFinite(maxHp) ? maxHp : 1280);
  const passiveHeal = c3Active
    ? Math.round(260 + safeMaxHp * 0.065)
    : Math.round(85 + safeMaxHp * 0.045);
  const c1HitHeal = Math.round(45 + safeMaxHp * 0.03);
  const c2CastHeal = Math.round(80 + safeMaxHp * 0.06);
  const c2HitHeal = Math.round((45 + safeMaxHp * 0.035) * (c3Active ? 2 : 1));
  const c3CastHeal = Math.round(240 + safeMaxHp * 0.14);
  const c3HitBonusHeal = Math.round(100 + safeMaxHp * 0.04);
  return {
    passiveHeal,
    c1HitHeal,
    c2CastHeal,
    c2HitHeal,
    c3CastHeal,
    c3HitBonusHeal,
  };
}



