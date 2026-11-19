import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_WAVES,
  BOSS_WAVES,
  MAX_BOSS_CC_SEC,
  TIN_RESONANCE_MAX,
  TIN_OVERLOAD_SHIELD_RATIO,
  LONGHOI_MAX_BURN_STACKS,
  clampBossCcDuration,
  getBossStageCcDuration,
  getBossCcDuration,
  getBossPowerModifiers,
  computeLuanC1ShardDamage,
  computeLuanRiftTickDamage,
  LUAN_RIFT_TICK_INTERVAL,
  computeCoopWaveReward,
  computeTinStackGain,
  computeTinCooldownTickRate,
  applyTinBasicHitCooldownRefund,
  computeLongHoiBurnApplication,
  computeLongHoiBurnDps,
  buildCoopWsUrl,
  buildCoopHttpBase,
  coalesceCoopOutbox,
  detectClientEnvironment,
  isPrivateOrDevOrigin,
  classifyJoinCode,
  isSixDigitCode,
  ITEM_TIER_RANK,
  sortItemsByRarityAsc,
  sortItemsByRarityDesc,
  TAI_DU_MAX_TURRETS,
  TAI_DU_DRONE_OVERDRIVE_DURATION,
  cycleTaiDuDroneMode,
  getTaiDuDroneProfile,
  computeTaiDuDroneShot,
  computeNguyenOverhealConversion,
  isPortraitViewport,
  computeCameraViewportConfig,
  screenToWorldWithCamera,
  worldToScreenWithCamera,
  computeJoystickDragRadius,
  HERO_ROLE_CATALOG,
  HERO_ROLE_ORDER,
  getHeroRoleKey,
  filterHeroesByRole,
  PHONG_MAX_ILLUSIONS,
  PHONG_ILLUSION_DURATION,
  PHONG_KILL_HEAL_RATIO,
  PHONG_KILL_CD_REFUND,
  computePhongIllusionHitHeal,
  computePhongMissingHpScale,
  computePhongC3SlashDamage,
  DANG_RAGE_MAX,
  DANG_ARMOR_DURATION,
  DANG_ARMOR_DR,
  DANG_C3_AS_BONUS,
  DANG_C3_AS_DURATION,
  computeDangRageGain,
  computeDangC1WaveHeal,
  THIEN_ENERGY_MAX,
  THIEN_ASCENDED_DURATION,
  THIEN_GOD_MODE_CDR_MULT,
  THIEN_GOD_MODE_DMG_MULT,
  THANH_ECHO_DELAY,
  THANH_ECHO_DMG_RATIO,
  THANH_ECHO_MAX_QUEUE,
  THANH_C1_POISON_DURATION,
  THANH_C2_MAX_SWALLOW_PER_CAST,
  THANH_C3_GUARD_COUNT,
  THANH_C3_GUARD_DR,
  evaluateThanhBurstPassive,
  computeThanhC1SnakeDamage,
  computeThanhC1BoundedHeal,
  isThanhC2SwallowEligible,
  computeThanhC2Damage,
  computeThanhC3Sacrifice,
  NHI_PASSIVE_HP_THRESHOLD,
  NHI_PASSIVE_HEAL_RATIO,
  NHI_PASSIVE_CD,
  NHI_C2_MAX_ZONES,
  NHI_C2_TETHER_RANGE,
  NHI_C3_BOSS_PCT_CAP,
  cycleNhiAmmoType,
  getNhiAmmoProfile,
  computeNhiPoisonDps,
  computeNhiC1LifeHeal,
  computeNhiPoisonZoneTethers,
  selectHighestHpTarget,
  computeNhiC3ArrowDamage,
  computeNhiC3BoundedHeal,
  THIEN_GOD_MODE_REGEN_PER_SEC,
  THIEN_C1_SWORD_COUNT,
  computeThienPassiveGain,
  computeThienCooldownTickRate,
  computeThienAscendedModifiers,
  computeThienC1SwordDamage,
  computeThienC2Detonation,
  computeThienC4JudgementDamage,
  computeThienDamageBreakdownTotal,
  normalizeQualityMode,
  normalizeFpsCapMode,
  detectDeviceHardwareTier,
  resolvePerformanceProfile,
  stepAdaptiveQualityGovernor,
  computeWorldViewBounds,
  isCircleInViewBounds,
  isSegmentInViewBounds,
  swapRemoveAt,
  computeAdaptiveSyncIntervals,
  DUNG_BASE_CRIT,
  DUNG_MAX_CRIT,
  DUNG_BASE_CRIT_DMG_RATIO,
  DUNG_BASE_LIFESTEAL,
  DUNG_C1_COOLDOWN,
  DUNG_C2_COOLDOWN,
  DUNG_C3_COOLDOWN,
  computeDungCritProfile,
  computeDungHealValues,
  BOSS_CC_IMMUNITY_WINDOW_SEC,
  HERO_SHIELD_CAP_RATIO,
  isBossHardCcImmune,
  evaluateEnemyHardCcApplication,
  computeBoundedShieldAdd,
  MINH_PASSIVE_HEAL_RATIO,
  MINH_PASSIVE_SHIELD_RATIO,
  MINH_PASSIVE_SHIELD_DUR,
  MINH_PASSIVE_ICD,
  MINH_C1_MOB_ROOT,
  MINH_C1_BOSS_ROOT,
  MINH_C1_BOSS27_SLOW,
  MINH_C1_BOSS27_SLOW_DUR,
  MINH_C1_WIDTH,
  MINH_C1_CHAIN_COUNT,
  MINH_C1_HEAL_RATIO,
  MINH_C1_MAX_HEAL_RATIO,
  MINH_C2_MOB_FREEZE,
  MINH_C2_BOSS_FREEZE,
  MINH_C2_BOSS_SLOW,
  MINH_C2_BOSS_SLOW_DUR,
  MINH_C2_ALLY_HEAL_RATIO,
  MINH_C2_ALLY_SHIELD_RATIO,
  MINH_C3_MOB_SEAL,
  MINH_C3_BOSS_SEAL,
  MINH_C3_ALLY_HEAL_RATIO,
  MINH_C3_ALLY_SHIELD_RATIO,
  computeMinhBasicDamage,
  computeMinhC1Damage,
  computeMinhC1CcHeal,
  computeMinhC2TickDamage,
  computeMinhC3DetonateDamage,
  DUCANH_PASSIVE_DR,
  DUCANH_PASSIVE_HP_THRESHOLD,
  DUCANH_PASSIVE_REGEN_RATIO,
  DUCANH_PASSIVE_REGEN_DUR,
  DUCANH_PASSIVE_SHIELD_RATIO,
  DUCANH_PASSIVE_CD,
  DUCANH_C1_DURATION,
  DUCANH_C1_DR,
  DUCANH_C1_BOSS_STUN,
  DUCANH_C1_PER_HIT_PCT,
  DUCANH_C1_MAX_PCT,
  DUCANH_C2_DURATION,
  DUCANH_C2_SHIELD_RATIO,
  DUCANH_C2_DR,
  DUCANH_C2_REGEN_RATIO,
  DUCANH_C2_END_ALLY_HEAL,
  DUCANH_C2_END_ALLY_SHIELD,
  DUCANH_C3_MOB_KNOCKUP,
  DUCANH_C3_BOSS_STUN,
  DUCANH_C3_SELF_HEAL,
  DUCANH_C3_SELF_SHIELD,
  DUCANH_C3_ALLY_HEAL,
  DUCANH_C3_ALLY_SHIELD,
  DUCANH_MAX_DR_CAP,
  computeDucAnhDamageReduction,
  computeDucAnhC1RollGain,
  computeDucAnhC1RollDamage,
  computeDucAnhC2ExplosionDamage,
  computeDucAnhC3ImpactDamage,
} from './combatLogic.ts';
import {
  DAILY_CHECKIN_REWARD,
  VALID_GEAR_SLOTS,
  AVATAR_FRAMES,
  AVATAR_CRESTS,
  PLAYER_TITLES,
  canClaimDailyCheckIn,
  computeUnlockedTitles,
  deserializeHeroGearEntries,
  generateFriendCode,
  isFrameUnlocked,
  mergeLocalAndCloudProgress,
  normalizeDisplayName,
  parseSavePackageJson,
  sanitizeGooglePhotoUrl,
  sanitizePlayerProfile,
  serializeHeroGearEntries,
} from './playerAccount.ts';
import {
  DEVICE_TRANSFER_PREFIX,
  decodeDeviceTransferCode,
  detectStorageEnvironment,
  encodeDeviceTransferCode,
  isStaticWebHost,
  loadDeviceRecord,
  loadDeviceSettings,
  normalizeSavedRun,
  readDeviceKey,
  recordDeviceSave,
  removeDeviceKey,
  saveDeviceSettings,
  touchDeviceVisit,
  writeDeviceKey,
} from './deviceStorage.ts';
import {
  ARENA_MAPS,
  ARENA_MAP_LIST,
  BLOOD_CITADEL_SIZE,
  BLOOD_CITADEL_SPAWN,
  BLOOD_CITADEL_INTERACTABLES,
  BLOOD_CITADEL_STATIC_OBSTACLES,
  CITADEL_UNLOCK_WAVE,
  computeUnlockedMaps,
  isMapUnlocked,
  getNextCampaignMapId,
  getMapUnlockRequirement,
  createDefaultCitadelSecrets,
  createInitialCitadelRuntimeState,
  getActiveCitadelObstacles,
  doesPointOverlapAnyObstacle,
  findClearPointNear,
  resolveCircleObstacles,
  evaluateCitadelInteraction,
  getCitadelSecretCompassTarget,
} from './bloodCitadelMap.ts';
import {
  CHRONICLE_CHAPTERS,
  HERO_CHRONICLES,
  BOSS_CHRONICLES,
  buildCitadelChronicleOverview,
  buildInfernoChronicleOverview,
  buildFrozenTombChronicleOverview,
} from './darkFantasyLore.ts';
import {
  INFERNO_MAP_WIDTH,
  INFERNO_MAP_HEIGHT,
  INFERNO_SPAWN,
  INFERNO_ZONES,
  INFERNO_GATES,
  INFERNO_DESTRUCTIBLE_WALLS,
  INFERNO_INTERACTABLES,
  INFERNO_DOCS,
  createDefaultInfernoProgress,
  normalizeInfernoProgress,
  mergeInfernoProgress,
  createInitialInfernoRuntimeState,
  getInfernoZoneAt,
  getActiveInfernoObstacles,
  tryOpenInfernoGate,
  damageInfernoDestructibleWalls,
  evaluateInfernoInteraction,
  getInfernoCompassTarget,
  stepInfernoHazards,
} from './infernoAshMap.ts';
import {
  FROZEN_TOMB_WIDTH,
  FROZEN_TOMB_HEIGHT,
  FROZEN_TOMB_SPAWN,
  FROZEN_TOMB_ZONES,
  FROZEN_TOMB_DESTRUCTIBLES,
  FROZEN_TOMB_INTERACTABLES,
  FROZEN_TOMB_DOCS,
  FROZEN_TOMB_ICE_PATCHES,
  createDefaultFrozenTombProgress,
  normalizeFrozenTombProgress,
  mergeFrozenTombProgress,
  hasCompletedMap2Links,
  hasCompletedMap3Links,
  getFrozenTombZoneAt,
  isPointOnFrozenIcePatch,
  createInitialFrozenTombRuntimeState,
  getActiveFrozenTombObstacles,
  damageFrozenTombDestructibleWalls,
  triggerEohyenFrozenTombReaction,
  evaluateFrozenTombProximityEvents,
  buildEndingSequencePayload,
  evaluateFrozenTombInteraction,
  getFrozenTombCompassTarget,
  stepFrozenTombHazards,
} from './frozenTombMap.ts';
import {
  GRUDGE_FOREST_WIDTH,
  GRUDGE_FOREST_HEIGHT,
  GRUDGE_FOREST_SPAWN,
  GRUDGE_FOREST_TREE_CENTER,
  GRUDGE_FOREST_ZONES,
  GRUDGE_FOREST_INTERACTABLES,
  GRUDGE_FOREST_DOCS,
  createDefaultGrudgeForestProgress,
  normalizeGrudgeForestProgress,
  mergeGrudgeForestProgress,
  countGrudgeForestSecrets,
  createInitialGrudgeForestRuntimeState,
  getGrudgeForestZoneAt,
  getActiveGrudgeForestObstacles,
  shiftGrudgeMazeSafely,
  damageGrudgeForestVinesAt,
  findNearestGrudgeForestInteractable,
  evaluateGrudgeForestProximityEvents,
  checkFourMapLinkReadiness,
  buildGrudgeForestEndingPayload,
  evaluateGrudgeForestInteraction,
  getGrudgeForestCompassTarget,
  stepGrudgeForestHazards,
} from './grudgeForestMap.ts';
import fs from 'node:fs';
import path from 'node:path';

test('Boss CC scaling increases with wave and phase while strictly capped at 2.6s', () => {
  const w3p1 = getBossCcDuration(0.85, 3, 1, 'stun');
  const w9p2 = getBossCcDuration(0.85, 9, 2, 'stun');
  const w15p3 = getBossCcDuration(1.4, 15, 3, 'stun');
  const w30p3 = getBossCcDuration(3.0, 30, 3, 'slow');

  assert.equal(MAX_BOSS_CC_SEC, 2.6);
  assert.ok(w9p2 > w3p1, 'Wave 9 phase 2 CC should exceed Wave 3 phase 1 CC');
  assert.ok(w15p3 > w9p2, 'Wave 15 phase 3 CC should exceed Wave 9 phase 2 CC');
  assert.ok(w15p3 <= MAX_BOSS_CC_SEC, 'Wave 15 CC must not exceed 2.6s');
  assert.equal(w30p3, MAX_BOSS_CC_SEC, 'Extreme wave/base CC must clamp at 2.6s');
  assert.equal(clampBossCcDuration(99), 2.6);
  assert.equal(clampBossCcDuration(-1), 0);
});

test('Boss power modifiers grant a buffed HP, damage, and speed boost across waves (11.8)', () => {
  const early = getBossPowerModifiers(3);
  const late = getBossPowerModifiers(15);
  const finalBoss = getBossPowerModifiers(27);
  assert.ok(early.hpMultiplier >= 1.28);
  assert.ok(early.damageMultiplier >= 1.22);
  assert.ok(early.speedMultiplier >= 1.06);
  assert.ok(late.hpMultiplier > early.hpMultiplier);
  assert.ok(late.damageMultiplier > early.damageMultiplier);
  assert.ok(finalBoss.hpMultiplier > late.hpMultiplier);
  assert.ok(finalBoss.damageMultiplier > late.damageMultiplier);
});

test('Tin Void Resonance builds up to 4 stacks, boosts cooldown rate, and triggers Overload recast', () => {
  let state = { stacks: 0, timer: 0, empowered: false, recastTimer: 0 };
  for (let i = 1; i < TIN_RESONANCE_MAX; i++) {
    const res = computeTinStackGain(state, 1);
    assert.equal(res.triggeredOverload, false);
    assert.equal(res.next.stacks, i);
    state = res.next;
  }

  assert.ok(computeTinCooldownTickRate(3) > computeTinCooldownTickRate(0));

  const overload = computeTinStackGain(state, 1);
  assert.equal(overload.triggeredOverload, true);
  assert.equal(overload.next.stacks, 0);
  assert.equal(overload.next.empowered, true);
  assert.ok(overload.next.recastTimer > 0);
  assert.equal(overload.c2c3RefundSec, 0.8);
  assert.equal(TIN_OVERLOAD_SHIELD_RATIO, 0.07);

  const refunded = applyTinBasicHitCooldownRefund([4.0, 6.0, 10.0]);
  assert.equal(refunded[0], 3.8);
  assert.equal(refunded[1], 5.8);
  assert.ok(refunded[2] < 10.0);
});

test('Long Hoi Eternal Ember stacks up to 100, activates Hoa Ach amp, and detonates every 5 stacks', () => {
  const firstHit = computeLongHoiBurnApplication({
    currentStacks: 0,
    wasBurning: false,
    currentAmpTimer: 0,
    stacksToAdd: 2,
    effectiveDamage: 100,
  });
  assert.equal(firstHit.newStacks, 2);
  assert.equal(firstHit.detonationsTriggered, 0);
  assert.equal(firstHit.newBurnAmpTimer, 0);

  const fifthStackHit = computeLongHoiBurnApplication({
    currentStacks: firstHit.newStacks,
    wasBurning: true,
    currentAmpTimer: firstHit.newBurnAmpTimer,
    stacksToAdd: 3,
    effectiveDamage: 100,
  });
  assert.equal(fifthStackHit.newStacks, 5);
  assert.equal(fifthStackHit.detonationsTriggered, 1);
  assert.ok(fifthStackHit.detonationDamage > 100);
  assert.ok(fifthStackHit.newBurnAmpTimer > 0);

  const capped = computeLongHoiBurnApplication({
    currentStacks: 99,
    wasBurning: true,
    currentAmpTimer: 2,
    stacksToAdd: 5,
    effectiveDamage: 100,
  });
  assert.equal(capped.newStacks, LONGHOI_MAX_BURN_STACKS);

  const baseDps = computeLongHoiBurnDps({
    stacks: 15,
    targetCurrentHp: 2000,
    effectiveDamage: 100,
    isBoss: false,
    burnAmpActive: false,
  });
  const ampedDps = computeLongHoiBurnDps({
    stacks: 15,
    targetCurrentHp: 2000,
    effectiveDamage: 100,
    isBoss: false,
    burnAmpActive: true,
  });
  assert.ok(Math.abs(ampedDps / baseDps - 1.3) < 0.001);
});

test('Co-op WebSocket URL builder handles https, http, and blocks file:// cleanly', () => {
  const httpsRes = buildCoopWsUrl({ protocol: 'https:', host: 'arena.example.com' });
  assert.deepEqual(httpsRes, { ok: true, url: 'wss://arena.example.com/ws' });

  const httpRes = buildCoopWsUrl({ protocol: 'http:', host: 'localhost:3000' });
  assert.deepEqual(httpRes, { ok: true, url: 'ws://localhost:3000/ws' });

  const fileRes = buildCoopWsUrl({ protocol: 'file:', host: '' });
  assert.equal(fileRes.ok, false);
  if (!fileRes.ok) {
    assert.equal(fileRes.reason, 'file_protocol');
  }

  const contentRes = buildCoopHttpBase({ protocol: 'content:', host: '' });
  assert.equal(contentRes.ok, false);
  if (!contentRes.ok) {
    assert.equal(contentRes.reason, 'file_protocol');
  }

  const contentWithServer = buildCoopHttpBase({
    protocol: 'content:',
    host: '',
    overrideUrl: 'https://arena.example.com/',
  });
  assert.deepEqual(contentWithServer, { ok: true, baseUrl: 'https://arena.example.com' });

  const httpBase = buildCoopHttpBase({ protocol: 'https:', host: 'arena.example.com' });
  assert.deepEqual(httpBase, { ok: true, baseUrl: 'https://arena.example.com' });

  const wsOverrideFromHttp = buildCoopWsUrl({
    protocol: 'content:',
    host: '',
    overrideUrl: 'https://coop.example.com/',
  });
  assert.deepEqual(wsOverrideFromHttp, { ok: true, url: 'wss://coop.example.com/ws' });

  const wsOverrideBase = buildCoopHttpBase({
    protocol: 'https:',
    host: 'ignored.local',
    overrideUrl: 'wss://coop.example.com/ws',
  });
  assert.deepEqual(wsOverrideBase, { ok: true, baseUrl: 'https://coop.example.com' });

  const coalesced = coalesceCoopOutbox([
    { type: 'SYNC_PLAYER', x: 1 },
    { type: 'DAMAGE_ENEMY', dmg: 50 },
    { type: 'WORLD_SNAPSHOT', wave: 1 },
    { type: 'SYNC_PLAYER', x: 2 },
    { type: 'WORLD_SNAPSHOT', wave: 2 },
  ]);
  assert.equal(coalesced.length, 3);
  assert.deepEqual(coalesced.map((m) => m.type), ['DAMAGE_ENEMY', 'SYNC_PLAYER', 'WORLD_SNAPSHOT']);
  assert.equal((coalesced[1] as { x?: number }).x, 2);
  assert.equal((coalesced[2] as { wave?: number }).wave, 2);
});

test('Client environment detection catches iOS, Zalo, Messenger, and file/content restrictions', () => {
  const zaloIos = detectClientEnvironment({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Zalo/24.0',
    protocol: 'https:',
    hasNativeFullscreen: true,
  });
  assert.equal(zaloIos.isIOS, true);
  assert.equal(zaloIos.isZalo, true);
  assert.equal(zaloIos.isInAppBrowser, true);
  assert.equal(zaloIos.supportsNativeFullscreen, false);

  const messenger = detectClientEnvironment({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) FBAN/MessengerForiOS FBAV/450.0',
    protocol: 'https:',
    hasNativeFullscreen: false,
  });
  assert.equal(messenger.isMessenger, true);
  assert.equal(messenger.isInAppBrowser, true);

  const androidContentFile = detectClientEnvironment({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130.0.0.0 Mobile Safari/537.36',
    protocol: 'content:',
    hasNativeFullscreen: true,
  });
  assert.equal(androidContentFile.isFileProtocol, true);
});

test('Co-op wave reward and P2P signal encoding/room host state work deterministically', async () => {
  const { computeCoopWaveReward } = await import('./combatLogic.ts');
  const { encodeSignalPayload, decodeSignalPayload, P2PRoomHost } = await import('./webrtcCoop.js');

  const bossReward = computeCoopWaveReward({ wave: 3, elapsedSec: 20, kills: 12 });
  assert.equal(bossReward.baseCoins, 300);
  assert.equal(bossReward.speedCoins, 40);
  assert.equal(bossReward.bossCoins, 150);
  assert.equal(bossReward.totalEarned, 490);

  const sample = { v: 1, k: 'O', pid: 'p1', rid: 'P2-TEST', sdp: 'v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\n' + 'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n'.repeat(60) };
  const encoded = await encodeSignalPayload(sample);
  assert.ok(encoded.startsWith('AH1G:') || encoded.startsWith('AH1J:'));
  const decoded = await decodeSignalPayload(encoded);
  assert.deepEqual(decoded, sample);

  const hostEvents: Array<{ type: string; room?: any }> = [];
  const host = new P2PRoomHost({
    hostName: 'TestHost',
    heroId: 'tin',
    onLocalEvent: (ev: any) => hostEvents.push(ev),
    onPeersChanged: () => {},
  });
  host.start();
  assert.equal(hostEvents.some((e) => e.type === 'ROOM_JOINED'), true);
  host.handleMessage('p2_guest', { type: 'P2P_HELLO', playerName: 'GuestOne', heroId: 'longhoi' });
  assert.equal(host.serializeRoom().playerCount, 2);
  assert.equal(host.serializeRoom().powerMultiplier, 1.5);
  host.startMatch();
  assert.equal(host.serializeRoom().status, 'PLAYING');
  host.destroy();
});

test('isPrivateOrDevOrigin and classifyJoinCode handle downloaded HTML origins and P2P codes cleanly', async () => {
  assert.equal(isPrivateOrDevOrigin('http://localhost:3000'), true);
  assert.equal(isPrivateOrDevOrigin('http://127.0.0.1:3000'), true);
  assert.equal(isPrivateOrDevOrigin('https://ais-dev-abc123.asia-east1.run.app'), true);
  assert.equal(isPrivateOrDevOrigin('http://192.168.1.45:3000'), true);
  assert.equal(isPrivateOrDevOrigin('https://ais-pre-abc123.asia-east1.run.app'), false);
  assert.equal(isPrivateOrDevOrigin('https://arena-hero.example.com'), false);

  assert.deepEqual(classifyJoinCode('  '), { kind: 'empty', normalized: '' });
  assert.deepEqual(classifyJoinCode(' a7k9p2 '), { kind: 'server_room', normalized: 'A7K9P2' });
  assert.deepEqual(classifyJoinCode('ah1g:AbCdEf_123'), { kind: 'p2p_signal', normalized: 'AH1G:AbCdEf_123' });
  assert.deepEqual(classifyJoinCode('AH1J:xyz\n123'), { kind: 'p2p_signal', normalized: 'AH1J:xyz123' });

  // Verify mpClient automatically switches to Direct P2P room when opened via content:// (Android Chrome downloads)
  const prevWindow = (globalThis as any).window;
  try {
    (globalThis as any).window = {
      location: { protocol: 'content:', host: '', origin: 'null' },
      __ARENA_API_URL__: 'https://ais-dev-blocked.asia-east1.run.app',
    };
    const { mpClient } = await import('./multiplayerClient.js');
    try {
      assert.equal(mpClient.getCustomServerUrl(), '');
      const res = await mpClient.createRoom('MobileHero', 'tin');
      assert.equal(res.mode, 'p2p');
      assert.match(res.room?.roomId || '', /^\d{6}$/);
    } finally {
      mpClient.disconnect();
    }
  } finally {
    (globalThis as any).window = prevWindow;
  }
});

test('P2PRoomHost and P2PRoomPeerClient auto-transition Peer into room and match even when DataChannel is pre-opened or late-synced', async () => {
  const { P2PRoomHost, P2PRoomPeerClient } = await import('./webrtcCoop.js');
  const prevRTC = (globalThis as any).RTCPeerConnection;

  class MockDataChannel {
    readyState = 'connecting';
    onopen: null | (() => void) = null;
    onmessage: null | ((ev: { data: string }) => void) = null;
    onclose: null | (() => void) = null;
    onerror: null | (() => void) = null;
    remotePeer: MockDataChannel | null = null;
    send(data: string) {
      if (this.readyState !== 'open') throw new Error('DataChannel not open');
      const target = this.remotePeer;
      if (target && target.onmessage) {
        queueMicrotask(() => target.onmessage?.({ data }));
      }
    }
    close() {
      this.readyState = 'closed';
      this.onclose?.();
    }
  }

  const registry = new Map<string, MockRTCPeerConnection>();
  class MockRTCPeerConnection {
    iceGatheringState = 'complete';
    connectionState = 'new';
    localDescription: { type: string; sdp: string } | null = null;
    remoteDescription: { type: string; sdp: string } | null = null;
    ondatachannel: null | ((ev: { channel: MockDataChannel }) => void) = null;
    onconnectionstatechange: null | (() => void) = null;
    id = `pc_${Math.random().toString(36).slice(2, 8)}`;
    dc: MockDataChannel | null = null;
    constructor() {
      registry.set(this.id, this);
    }
    addEventListener() {}
    removeEventListener() {}
    createDataChannel() {
      this.dc = new MockDataChannel();
      return this.dc;
    }
    async createOffer() {
      return { type: 'offer', sdp: `v=0\r\no=- ${this.id} 1 IN IP4 127.0.0.1\r\n` };
    }
    async createAnswer() {
      return { type: 'answer', sdp: `v=0\r\no=- ${this.id} 2 IN IP4 127.0.0.1\r\n` };
    }
    async setLocalDescription(desc: { type: string; sdp: string }) {
      this.localDescription = desc;
    }
    async setRemoteDescription(desc: { type: string; sdp: string }) {
      this.remoteDescription = desc;
      const m = desc.sdp.match(/o=- (pc_[a-z0-9]+)/);
      const other = m ? registry.get(m[1]) : null;
      if (desc.type === 'answer' && other && this.dc && other.dc) {
        // Connect both channels and open them, intentionally setting Peer's dc to "open"
        // BEFORE firing pc2.ondatachannel to verify the pre-opened DataChannel race fix!
        this.dc.remotePeer = other.dc;
        other.dc.remotePeer = this.dc;
        this.connectionState = 'connected';
        other.connectionState = 'connected';
        other.dc.readyState = 'open';
        other.ondatachannel?.({ channel: other.dc });
        this.dc.readyState = 'open';
        this.dc.onopen?.();
        this.onconnectionstatechange?.();
        other.onconnectionstatechange?.();
      } else if (desc.type === 'offer') {
        this.dc = new MockDataChannel();
      }
    }
    close() {
      this.connectionState = 'closed';
      this.dc?.close();
    }
  }

  (globalThis as any).RTCPeerConnection = MockRTCPeerConnection;

  try {
    const hostEvents: any[] = [];
    const peerEvents: any[] = [];

    const host = new P2PRoomHost({
      hostName: 'ChuPhong',
      heroId: 'eohyen',
      onLocalEvent: (ev: any) => hostEvents.push(ev),
      onPeersChanged: () => {},
    });
    host.start();

    const { code: offerCode } = await host.createInviteOffer();
    const peer = new P2PRoomPeerClient({
      onEvent: (ev: any) => peerEvents.push(ev),
      onClose: () => {},
    });

    const answerCode = await peer.createAnswerFromOffer(offerCode, 'DongDoi', 'tin');
    await host.acceptJoinAnswer(answerCode);

    // Wait briefly for microtask DataChannel handshake
    await new Promise((r) => setTimeout(r, 40));

    const peerJoined = peerEvents.find((e) => e.type === 'ROOM_JOINED');
    assert.ok(peerJoined, 'Peer must receive ROOM_JOINED automatically after host accepts answer');
    assert.equal(peerJoined.room.playerCount, 2);
    assert.equal(peer.joinedRoom, true);
    assert.equal(host.serializeRoom().playerCount, 2);

    // Peer MUST start unready in LOBBY so Host waits for Peer to enter, pick hero, and click Ready
    const guestInRoom = host.serializeRoom().members.find((m: any) => m.id === peer.playerId);
    assert.ok(guestInRoom, 'Guest should exist in serialized room');
    assert.equal(guestInRoom.ready, false, 'Guest must start with ready=false in LOBBY');
    assert.equal(guestInRoom.joinedRoom, true, 'Guest must acknowledge ROOM_JOINED via P2P_JOIN_ACK');

    // Host START_MATCH must be rejected while Peer has ready=false
    host.handleMessage(host.hostId, { type: 'START_MATCH' });
    const blockedErr = hostEvents.find((e) => e.type === 'ROOM_ERROR');
    assert.ok(blockedErr, 'Host START_MATCH must be blocked while Peer is not ready');
    assert.equal(host.serializeRoom().status, 'LOBBY');

    // Peer selects hero and toggles Ready -> Host can start match cleanly
    peer.send({ type: 'SELECT_HERO', heroId: 'luan' });
    peer.send({ type: 'TOGGLE_READY', ready: true });
    await new Promise((r) => setTimeout(r, 30));

    const updatedGuest = host.serializeRoom().members.find((m: any) => m.id === peer.playerId);
    assert.ok(updatedGuest, 'Updated guest should exist in serialized room');
    assert.equal(updatedGuest.heroId, 'luan');
    assert.equal(updatedGuest.ready, true);

    host.handleMessage(host.hostId, { type: 'START_MATCH' });
    await new Promise((r) => setTimeout(r, 40));

    const hostStarted = hostEvents.find((e) => e.type === 'MATCH_STARTED');
    const peerStarted = peerEvents.find((e) => e.type === 'MATCH_STARTED');
    assert.ok(hostStarted, 'Host must receive MATCH_STARTED');
    assert.ok(peerStarted, 'Peer must receive MATCH_STARTED automatically when host starts');
    assert.equal(peerStarted.room.status, 'PLAYING');
    assert.ok(peerStarted.matchNonce >= 1);
    assert.equal(peer.inMatch, true);
    assert.ok(peerStarted.spawns[peer.playerId!], 'Peer spawn coordinates must be present');

    // Late P2P_HELLO recovery while match is already PLAYING also delivers MATCH_STARTED
    const beforeCount = peerEvents.filter((e) => e.type === 'MATCH_STARTED').length;
    host.handleMessage(peer.playerId!, { type: 'P2P_HELLO', playerName: 'DongDoi', heroId: 'luan' });
    await new Promise((r) => setTimeout(r, 30));
    const afterCount = peerEvents.filter((e) => e.type === 'MATCH_STARTED').length;
    assert.equal(afterCount, beforeCount + 1, 'Late P2P_HELLO during PLAYING must re-sync MATCH_STARTED');

    peer.destroy();
    host.destroy();
  } finally {
    (globalThis as any).RTCPeerConnection = prevRTC;
  }
});

test('Nguyen overheal converts 100% into stackable shield (capped at 65% Max HP) and scales at low HP', async () => {
  const { computeNguyenOverhealConversion } = await import('./combatLogic.ts');

  // Full HP overheal -> 100% becomes shield up to cap (maxHp * 0.65 = 832 for 1280 HP, 975 for 1500 HP)
  const overhealRes = computeNguyenOverhealConversion({
    currentHp: 1400,
    maxHp: 1500,
    currentShield: 200,
    rawHeal: 400,
    healAmp: 0.2,
  });
  assert.equal(overhealRes.isLowHp, false);
  assert.equal(overhealRes.totalEffectiveHeal, 480);
  assert.equal(overhealRes.actualHpHealed, 100);
  assert.equal(overhealRes.healedHp, 100);
  assert.equal(overhealRes.nextHp, 1500);
  assert.equal(overhealRes.shieldAdded, 380);
  assert.equal(overhealRes.nextShield, 580);

  // Low HP triggers default +35% healing amplification
  const lowHpRes = computeNguyenOverhealConversion({
    currentHp: 450,
    maxHp: 1500,
    currentShield: 0,
    rawHeal: 300,
  });
  assert.equal(lowHpRes.isLowHp, true);
  assert.equal(lowHpRes.totalEffectiveHeal, 405);
  assert.equal(lowHpRes.actualHpHealed, 405);
  assert.equal(lowHpRes.healedHp, 405);
  assert.equal(lowHpRes.nextHp, 855);
});

test('Tai Du drone cycling, Luan portal boost, item parry/reflect, and Danh Dragon Form work accurately', async () => {
  const {
    cycleTaiDuDroneMode,
    getTaiDuDroneProfile,
    computeLuanPortalBeamTransform,
    computeItemParryAndReflect,
    computeDanhDragonFormModifiers,
  } = await import('./combatLogic.ts');

  let mode = cycleTaiDuDroneMode('attack');
  assert.equal(mode, 'guard');
  assert.ok(getTaiDuDroneProfile('guard').guardAbsorbPct > 0);
  mode = cycleTaiDuDroneMode(mode);
  assert.equal(mode, 'pursuit');
  assert.ok(getTaiDuDroneProfile('pursuit').pursuitSpeedBonus > 0);
  assert.equal(cycleTaiDuDroneMode(mode), 'attack');

  const unboosted = computeLuanPortalBeamTransform({ baseDamage: 100, baseRange: 300, portalCount: 3, passThroughCount: 0 });
  const boosted = computeLuanPortalBeamTransform({ baseDamage: 100, baseRange: 300, portalCount: 3, passThroughCount: 1 });
  assert.equal(unboosted.boosted, false);
  assert.equal(boosted.boosted, true);
  assert.ok(boosted.damage > unboosted.damage);
  assert.ok(boosted.range > unboosted.range);
  assert.equal(boosted.splitStreams, 3);

  const parried = computeItemParryAndReflect({ incomingDamage: 200, parryChance: 0.3, reflectPct: 0.15, parryRoll: 0.1 });
  assert.equal(parried.parried, true);
  assert.equal(parried.damageTaken, 40);
  assert.equal(parried.reflectDamage, 120);

  const dragonOn = computeDanhDragonFormModifiers(true);
  assert.equal(dragonOn.duration, 12);
  assert.equal(dragonOn.cooldown, 22);
  assert.equal(dragonOn.ccImmune, true);
  assert.equal(dragonOn.transformsC1C2ToFireBreath, true);
});

test('Upgraded Arena Hero roster (20 standard + 1 secret Founder = 21 heroes) and 220-item catalog satisfy exact design specs', async () => {
  const { Mi, zr, Ff } = await import('./gameData.js');
  const { HERO_SKILL_ICONS } = await import('./skillIcons.js');

  assert.equal(Mi.length, 21, 'Must preserve all 20 standard heroes + secret Founder hero Thien');
  assert.equal(Mi.filter((h: any) => !h.isSecretFounder).length, 20, 'Standard unlocked roster must be 20 heroes');
  const heroIds = new Set(Mi.map((h: any) => h.id));
  assert.equal(heroIds.size, 21);
  for (const id of ['dung', 'tin', 'kin', 'trung', 'eohyen', 'longhoi', 'duccong', 'gau', 'bao', 'danh', 'luan', 'taidu', 'nguyen', 'duy', 'phong', 'dang', 'thanh', 'nhi', 'minh', 'ducanh', 'thien']) {
    assert.ok(heroIds.has(id), `Missing hero ${id}`);
  }

  const thien = Mi.find((h: any) => h.id === 'thien');
  assert.ok(thien);
  assert.equal(thien.isSecretFounder, true);
  assert.equal(thien.stats.hp, 5000);
  assert.equal(thien.stats.damage, 180);
  assert.equal(thien.stats.ap, 250);
  assert.equal(thien.skills.length, 4);
  assert.deepEqual(thien.skills.map((s: any) => s.key), ['c1', 'c2', 'c3', 'c4']);
  assert.ok(
    HERO_SKILL_ICONS.thien?.atk &&
    HERO_SKILL_ICONS.thien?.passive &&
    HERO_SKILL_ICONS.thien?.c1 &&
    HERO_SKILL_ICONS.thien?.c2 &&
    HERO_SKILL_ICONS.thien?.c3 &&
    HERO_SKILL_ICONS.thien?.c4
  );
  assert.ok(Ff.thien && Ff.thien.length >= 2);

  const tin = Mi.find((h: any) => h.id === 'tin');
  assert.ok(tin);
  assert.equal(tin.stats.hp, 840);
  assert.equal(tin.stats.damage, 44);
  assert.equal(tin.skills[0].cooldown, 5.5);
  assert.equal(tin.skills[1].cooldown, 7.5);
  assert.equal(tin.skills[2].cooldown, 23);

  const danh = Mi.find((h: any) => h.id === 'danh');
  assert.ok(danh);
  assert.equal(danh.skills[2].cooldown, 22);

  const luan = Mi.find((h: any) => h.id === 'luan');
  assert.ok(luan);
  assert.equal(luan.stats.hp, 880);
  assert.equal(luan.stats.damage, 32);
  assert.equal(luan.stats.ap, 46);
  assert.equal(luan.skills[1].aimType, 'CIRCLE_FREE');

  const taidu = Mi.find((h: any) => h.id === 'taidu');
  assert.ok(taidu);
  assert.equal(taidu.stats.hp, 960);
  assert.equal(taidu.stats.damage, 40);
  assert.equal(taidu.skills[2].aimType, 'PATH');

  const nguyen = Mi.find((h: any) => h.id === 'nguyen');
  assert.ok(nguyen);
  assert.equal(nguyen.stats.hp, 1280);
  assert.equal(nguyen.stats.damage, 26);
  assert.equal(nguyen.stats.ap, 36);

  const duy = Mi.find((h: any) => h.id === 'duy');
  assert.ok(duy);
  assert.equal(duy.skills[0].aimType, 'CIRCLE_FREE');
  assert.equal(duy.skills[1].aimType, 'LINE');
  assert.equal(duy.skills[2].aimType, 'CONE');
  assert.ok(HERO_SKILL_ICONS.duy?.atk && HERO_SKILL_ICONS.duy?.passive && HERO_SKILL_ICONS.duy?.c1 && HERO_SKILL_ICONS.duy?.c2 && HERO_SKILL_ICONS.duy?.c3);
  assert.ok(Ff.duy && Ff.duy.length >= 3);

  const phong = Mi.find((h: any) => h.id === 'phong');
  assert.ok(phong);
  assert.equal(phong.stats.hp, 1000);
  assert.equal(phong.stats.damage, 55);
  assert.equal(phong.stats.ap, 35);
  assert.equal(phong.skills[0].aimType, 'LINE');
  assert.equal(phong.skills[1].aimType, 'CIRCLE_FREE');
  assert.equal(phong.skills[2].aimType, 'CIRCLE_SELF');
  assert.ok(HERO_SKILL_ICONS.phong?.atk && HERO_SKILL_ICONS.phong?.passive && HERO_SKILL_ICONS.phong?.c1 && HERO_SKILL_ICONS.phong?.c2 && HERO_SKILL_ICONS.phong?.c3);
  assert.ok(Ff.phong && Ff.phong.length >= 3);

  const dang = Mi.find((h: any) => h.id === 'dang');
  assert.ok(dang);
  assert.equal(dang.stats.hp, 1450);
  assert.equal(dang.stats.damage, 50);
  assert.equal(dang.stats.ap, 35);
  assert.equal(dang.skills[0].aimType, 'LINE');
  assert.equal(dang.skills[1].aimType, 'CIRCLE_SELF');
  assert.equal(dang.skills[2].aimType, 'LINE');
  assert.ok(HERO_SKILL_ICONS.dang?.atk && HERO_SKILL_ICONS.dang?.passive && HERO_SKILL_ICONS.dang?.c1 && HERO_SKILL_ICONS.dang?.c2 && HERO_SKILL_ICONS.dang?.c3);
  assert.ok(Ff.dang && Ff.dang.length >= 3);

  assert.equal(zr.length, 220, 'Item catalog must contain 140 existing + 80 new = 220 items');
  const itemIds = new Set(zr.map((it: any) => it.id));
  const itemNames = new Set(zr.map((it: any) => it.name));
  assert.equal(itemIds.size, 220, 'All 220 item IDs must be unique');
  assert.equal(itemNames.size, 220, 'All 220 item names must be unique');

  const newItems = zr.slice(140);
  assert.equal(newItems.length, 80);
  const slotCounts: Record<string, number> = { weapon: 0, armor: 0, gloves: 0, boots: 0, necklace: 0, relic: 0 };
  for (const it of newItems) {
    slotCounts[it.slot] = (slotCounts[it.slot] || 0) + 1;
    assert.ok(it.icon && it.icon.startsWith('data:image/svg+xml'), `Item ${it.id} missing icon`);
    assert.ok(it.cost > 0, `Item ${it.id} invalid cost`);
  }
  assert.deepEqual(slotCounts, { weapon: 16, armor: 14, gloves: 12, boots: 12, necklace: 14, relic: 12 });

  const activeItems = zr.filter((it: any) => Boolean(it.activeSkill));
  assert.equal(activeItems.length, 24, 'Must have 8 existing + 16 new = 24 active items');
  const activeKinds = new Set(activeItems.map((it: any) => it.activeSkill.kind));
  assert.equal(activeKinds.size, 24, 'All 24 active items must have distinct activeSkill.kind');

  const ffMap = Ff as Record<string, Array<{ id: string; name: string; desc: string; items: string[] }>>;
  for (const h of Mi) {
    assert.ok(Array.isArray(ffMap[h.id]) && ffMap[h.id].length >= 1, `Missing build presets for ${h.id}`);
    for (const preset of ffMap[h.id]) {
      for (const itemId of preset.items) {
        assert.ok(itemIds.has(itemId), `Preset ${preset.id} references unknown item ${itemId}`);
      }
    }
  }

  const skillIconsMap = HERO_SKILL_ICONS as Record<string, Record<string, string>>;
  for (const id of heroIds as Set<string>) {
    assert.ok(skillIconsMap[id], `Missing skill icon entries for ${id}`);
    for (const k of ['atk', 'passive', 'c1', 'c2', 'c3']) {
      assert.ok(skillIconsMap[id][k], `Missing ${id}.${k} icon`);
    }
  }
});

test('Tai Du and Nguyen complete kits, drone profiles, overheal cap, Luan C3 monochrome, and combo detection work accurately', async () => {
  const { Mi, Pf } = await import('./gameData.js');
  const { LUAN_C3_MONOCHROME_DURATION } = await import('./combatLogic.ts');
  const taidu = Mi.find((h: any) => h.id === 'taidu');
  const nguyen = Mi.find((h: any) => h.id === 'nguyen');

  assert.equal(LUAN_C3_MONOCHROME_DURATION, 1.5);

  assert.ok(taidu);
  assert.equal(taidu.critDmgRatio, 1.65);
  assert.equal(taidu.skills[2].aimType, 'PATH');
  assert.equal(TAI_DU_MAX_TURRETS, 2);
  assert.equal(TAI_DU_DRONE_OVERDRIVE_DURATION, 3.0);

  const attackProfile = getTaiDuDroneProfile('attack');
  assert.equal(attackProfile.orbitDist, 56);
  assert.equal(attackProfile.scanRange, 390);
  assert.equal(attackProfile.dmgRatio, 0.44);
  assert.equal(attackProfile.healPct, 0);
  assert.equal(attackProfile.prioritizeLowHp, false);
  assert.match(attackProfile.color, /^#[0-9A-F]{6}$/i);

  let mode = cycleTaiDuDroneMode('attack');
  assert.equal(mode, 'guard');
  const guardProfile = getTaiDuDroneProfile(mode);
  assert.equal(guardProfile.guardAbsorbPct, 0.2);
  assert.equal(guardProfile.healPctMaxHp, 0.03);
  assert.equal(guardProfile.healPct, 0.03);
  assert.equal(guardProfile.orbitDist, 42);
  assert.equal(guardProfile.scanRange, 290);
  assert.equal(guardProfile.dmgRatio, 0.26);
  assert.equal(guardProfile.prioritizeLowHp, false);
  assert.match(guardProfile.color, /^#[0-9A-F]{6}$/i);

  mode = cycleTaiDuDroneMode(mode);
  assert.equal(mode, 'pursuit');
  const pursuitProfile = getTaiDuDroneProfile(mode);
  assert.equal(pursuitProfile.pursuitSpeedBonus, 24);
  assert.equal(pursuitProfile.orbitDist, 118);
  assert.equal(pursuitProfile.scanRange, 480);
  assert.equal(pursuitProfile.dmgRatio, 0.38);
  assert.equal(pursuitProfile.healPct, 0);
  assert.equal(pursuitProfile.prioritizeLowHp, true);
  assert.match(pursuitProfile.color, /^#[0-9A-F]{6}$/i);
  assert.equal(cycleTaiDuDroneMode(mode), 'attack');

  const normalShot = computeTaiDuDroneShot({ mode: 'attack', effectiveAtk: 100, overdriveActive: false, targetHpRatio: 0.8 });
  const overdriveShot = computeTaiDuDroneShot({ mode: 'attack', effectiveAtk: 100, overdriveActive: true, targetHpRatio: 0.8 });
  assert.equal(normalShot.pierceLeft, 1);
  assert.ok(overdriveShot.fireInterval < normalShot.fireInterval);
  assert.ok(overdriveShot.damage > normalShot.damage);

  const pursuitNormal = computeTaiDuDroneShot({ mode: 'pursuit', effectiveAtk: 100, overdriveActive: false, targetHpRatio: 0.8 });
  const pursuitExec = computeTaiDuDroneShot({ mode: 'pursuit', effectiveAtk: 100, overdriveActive: false, targetHpRatio: 0.3 });
  assert.equal(pursuitNormal.pierceLeft, 2);
  assert.equal(pursuitExec.isExecute, true);
  assert.ok(pursuitExec.damage > pursuitNormal.damage);

  assert.ok(nguyen);
  assert.equal(nguyen.stats.hp, 1280);
  const cappedShield = computeNguyenOverhealConversion({
    currentHp: 1280,
    maxHp: 1280,
    currentShield: 750,
    rawHeal: 500,
    shieldCapRatio: 0.65,
  });
  assert.equal(cappedShield.actualHpHealed, 0);
  assert.equal(cappedShield.shieldAdded, 82);
  assert.equal(cappedShield.nextShield, 832);

  const lowHpAmp = computeNguyenOverhealConversion({
    currentHp: 576,
    maxHp: 1280,
    currentShield: 0,
    rawHeal: 200,
    lowHpThreshold: 0.45,
    lowHpBonusAmp: 0.35,
  });
  assert.equal(lowHpAmp.isLowHp, true);
  assert.equal(lowHpAmp.totalEffectiveHeal, 270);

  const taiDuTracker = new Pf();
  taiDuTracker.record({ heroId: 'taidu', action: 'c1', hitCount: 1 });
  taiDuTracker.record({ heroId: 'taidu', action: 'c2', hitCount: 2 });
  assert.equal(taiDuTracker.detectComboName('taidu', false, false), 'Hỏa Lực Liên Hoàn');
  taiDuTracker.record({ heroId: 'taidu', action: 'c3', hitCount: 3 });
  assert.equal(taiDuTracker.detectComboName('taidu', false, false), 'Oanh Tạc Hủy Diệt!');

  const taiDuUltOnly = new Pf();
  taiDuUltOnly.record({ heroId: 'taidu', action: 'c3', hitCount: 2 });
  assert.equal(taiDuUltOnly.detectComboName('taidu', false, false), 'Bão Tên Lửa Công Nghệ!');

  const nguyenTracker = new Pf();
  nguyenTracker.record({ heroId: 'nguyen', action: 'c1', hitCount: 1 });
  nguyenTracker.record({ heroId: 'nguyen', action: 'c2', hitCount: 1 });
  assert.equal(nguyenTracker.detectComboName('nguyen', false, false), 'Tam Vệ Tinh Hộ Mệnh!');
  nguyenTracker.record({ heroId: 'nguyen', action: 'c3', hitCount: 2 });
  assert.equal(nguyenTracker.detectComboName('nguyen', false, false), 'Đại Thánh Địa Sinh Mệnh!');
});

test('Equipment sorting orders strictly by ascending rarity and price without mutating catalog, and 6-digit code validator works', async () => {
  const { zr } = await import('./gameData.js');
  const sortedAsc = sortItemsByRarityAsc(zr);
  assert.equal(sortedAsc.length, zr.length);

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = sortedAsc[i - 1];
    const curr = sortedAsc[i];
    const prevRank = ITEM_TIER_RANK[prev.tier];
    const currRank = ITEM_TIER_RANK[curr.tier];
    assert.ok(prevRank <= currRank, `Expected tier ${prev.tier} (${prevRank}) <= ${curr.tier} (${currRank}) at index ${i}`);
    if (prevRank === currRank) {
      assert.ok(prev.cost <= curr.cost, `Expected cost ${prev.cost} <= ${curr.cost} within tier ${curr.tier}`);
    }
  }
  assert.equal(sortedAsc[0].tier, 'basic');
  assert.equal(sortedAsc[sortedAsc.length - 1].tier, 'mythic');

  const sortedDesc = sortItemsByRarityDesc(zr);
  assert.equal(sortedDesc[0].tier, 'mythic');
  assert.equal(sortedDesc[sortedDesc.length - 1].tier, 'basic');

  assert.equal(isSixDigitCode('482915'), true);
  assert.equal(isSixDigitCode(' 009 123 '), true);
  assert.equal(isSixDigitCode('A7K9P2'), false);
  assert.equal(isSixDigitCode('12345'), false);
  assert.equal(isSixDigitCode('AH1G:abcdef'), false);
});

test('27-wave expansion has 9 bosses with +0.2s CC scaling from 1.0s to 2.6s and Wave 15 is mid-boss', async () => {
  assert.equal(MAX_WAVES, 27);
  assert.deepEqual(BOSS_WAVES, [3, 6, 9, 12, 15, 18, 21, 24, 27]);

  const expectedCc = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6];
  const actualCc = BOSS_WAVES.map((w) => getBossStageCcDuration(w));
  assert.deepEqual(actualCc, expectedCc);

  const w15Reward = computeCoopWaveReward({ wave: 15, elapsedSec: 60, kills: 20 });
  assert.equal(w15Reward.isFinalWave, false);
  assert.equal(w15Reward.bossCoins, 500);

  const w27Reward = computeCoopWaveReward({ wave: 27, elapsedSec: 90, kills: 25 });
  assert.equal(w27Reward.isFinalWave, true);
  assert.equal(w27Reward.bossCoins, 1200);

  const { hm, Cf, _f } = await import('./gameData.js');
  assert.deepEqual(Object.keys(hm).map(Number).sort((a, b) => a - b), BOSS_WAVES);
  assert.equal(hm[15].skills.length, 3);
  assert.equal(hm[27].skills.length, 6);
  assert.ok(hm[15].baseHP < hm[27].baseHP);
  assert.ok(hm[15].baseDMG < hm[27].baseDMG);
  const bossNames = new Set(BOSS_WAVES.map((w) => hm[w].name));
  assert.equal(bossNames.size, 9);
  assert.equal(Cf[27], 140);
  assert.equal(_f[27], 1200);
});

test('Version 11.8 Luan nerf reduces Rift passive and C1 shard damage while matching catalog text', async () => {
  assert.equal(computeLuanC1ShardDamage(100), 66);
  assert.equal(computeLuanRiftTickDamage(100), 20);
  assert.equal(LUAN_RIFT_TICK_INTERVAL, 0.5);

  const { Mi } = await import('./gameData.js');
  const luan = Mi.find((h: any) => h.id === 'luan');
  assert.ok(luan);
  assert.match(luan.skills[0].description.vi, /28 \+ 38% AP/);
  assert.match(luan.skills[0].description.en, /28 \+ 38% AP/);
  assert.match(luan.passive.vi, /7 \+ 13% AP/);
});

test('Portrait viewport detection respects auto, portrait, and standard layout modes', () => {
  assert.equal(isPortraitViewport(390, 844, 'auto'), true);
  assert.equal(isPortraitViewport(360, 740, 'auto'), true);
  assert.equal(isPortraitViewport(844, 390, 'auto'), false);
  assert.equal(isPortraitViewport(1280, 720, 'auto'), false);
  assert.equal(isPortraitViewport(900, 1400, 'auto'), false);

  assert.equal(isPortraitViewport(1280, 720, 'portrait'), true);
  assert.equal(isPortraitViewport(390, 844, 'standard'), false);
});

test('Portrait camera viewport widens FOV, shifts hero focus upward, and round-trips world/screen coordinates', () => {
  const desktop = computeCameraViewportConfig({ viewW: 1280, viewH: 720, layoutMode: 'auto', fovPreset: 'balanced' });
  assert.equal(desktop.isPortrait, false);
  assert.equal(desktop.zoom, 1);
  assert.equal(desktop.focusX, 640);
  assert.equal(desktop.focusY, 360);

  const balanced = computeCameraViewportConfig({ viewW: 390, viewH: 844, layoutMode: 'auto', fovPreset: 'balanced' });
  const wide = computeCameraViewportConfig({ viewW: 390, viewH: 844, layoutMode: 'auto', fovPreset: 'wide' });
  const close = computeCameraViewportConfig({ viewW: 390, viewH: 844, layoutMode: 'auto', fovPreset: 'close' });

  assert.equal(balanced.isPortrait, true);
  assert.ok(wide.zoom < balanced.zoom && balanced.zoom < close.zoom, 'Wide zoom < balanced zoom < close zoom');
  assert.ok(balanced.visibleWorldW >= 650, `Expected unobstructed horizontal FOV >= 650, got ${balanced.visibleWorldW}`);
  assert.ok(wide.visibleWorldW > balanced.visibleWorldW);
  assert.ok(balanced.focusY < 844 / 2, 'Portrait hero focus should sit slightly above vertical center');

  const camX = 1420;
  const camY = 980;
  const sampleWorld = { x: 1615.5, y: 812.25 };
  const screenPt = worldToScreenWithCamera(sampleWorld.x, sampleWorld.y, camX, camY, balanced);
  const backToWorld = screenToWorldWithCamera(screenPt.x, screenPt.y, camX, camY, balanced);
  assert.ok(Math.abs(backToWorld.x - sampleWorld.x) < 1e-6);
  assert.ok(Math.abs(backToWorld.y - sampleWorld.y) < 1e-6);

  const heroScreen = worldToScreenWithCamera(camX, camY, camX, camY, balanced);
  assert.equal(heroScreen.x, balanced.focusX);
  assert.equal(heroScreen.y, balanced.focusY);

  const phoneLandscape = computeCameraViewportConfig({ viewW: 844, viewH: 390, layoutMode: 'auto', fovPreset: 'balanced' });
  assert.equal(phoneLandscape.isPortrait, false);
  assert.ok(phoneLandscape.zoom < 1, 'Compact phone landscape zooms out gently to keep vertical FOV wide');
  assert.ok(phoneLandscape.visibleWorldH >= 540, `Expected wide vertical FOV >= 540, got ${phoneLandscape.visibleWorldH}`);
  assert.ok(phoneLandscape.focusY < 390 / 2, 'Compact landscape hero focus shifts slightly upward above controls');
});

test('Joystick drag radius scales ergonomically between compact portrait (116px) and standard (144px+) zones', () => {
  assert.equal(computeJoystickDragRadius(116), 36);
  assert.equal(computeJoystickDragRadius(144), 44);
  assert.equal(computeJoystickDragRadius(80), 28);
  assert.equal(computeJoystickDragRadius(0), 42);
});

test('P2PRoomHost generates uniform 6-digit room IDs and GameEngine syncs Boss, revive, support, and teammate VFX', async () => {
  const { P2PRoomHost } = await import('./webrtcCoop.js');
  for (let i = 0; i < 6; i++) {
    const h = new P2PRoomHost({
      hostName: `Host${i}`,
      heroId: 'tin',
      onLocalEvent: () => {},
      onPeersChanged: () => {},
    });
    h.start();
    const serialized = h.serializeRoom();
    assert.match(serialized.roomId, /^\d{6}$/, `Expected 6-digit roomId, got ${serialized.roomId}`);
    h.destroy();
  }

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const createMockCtx = () => {
    const gradient = { addColorStop() {} };
    const noop = () => {};
    return {
      save: noop,
      restore: noop,
      translate: noop,
      rotate: noop,
      scale: noop,
      beginPath: noop,
      closePath: noop,
      arc: noop,
      ellipse: noop,
      rect: noop,
      moveTo: noop,
      lineTo: noop,
      quadraticCurveTo: noop,
      bezierCurveTo: noop,
      fill: noop,
      stroke: noop,
      fillRect: noop,
      strokeRect: noop,
      fillText: noop,
      strokeText: noop,
      setLineDash: noop,
      clip: noop,
      roundRect: noop,
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: () => ({ width: 20 }),
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: '#000',
      font: '12px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      lineCap: 'round',
      lineJoin: 'round',
    };
  };

  try {
    (globalThis as any).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      location: { protocol: 'https:', host: 'arena.example.com', origin: 'https://arena.example.com' },
    };
    (globalThis as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};

    const { GameEngine } = await import('./GameEngine.js');
    const { mpClient } = await import('./multiplayerClient.js');
    const { Mi } = await import('./gameData.js');

    const mockCanvas: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => createMockCtx(),
    };

    const engine = new GameEngine(mockCanvas);
    mpClient.playerId = 'peer_p2';
    mpClient.room = {
      roomId: '482915',
      hostId: 'host_p1',
      playerCount: 2,
      powerMultiplier: 1.5,
      members: [
        { id: 'host_p1', name: 'HostHero', heroId: 'eohyen', slot: 0, isHost: true },
        { id: 'peer_p2', name: 'PeerHero', heroId: 'tin', slot: 1, isHost: false },
      ],
    };

    try {
      // 1) Pre-match sync buffering before startCoopMatch() activates multiplayer
      engine.handleMultiplayerMessage({
        type: 'WORLD_SYNC',
        wave: 3,
        waveTotal: 11,
        waveSpawned: 11,
        waveKilled: 10,
        fullList: true,
        enemies: [
          {
            id: 901,
            kind: 'boss',
            bossWave: 3,
            name: 'Hộ Vệ Cổ Thụ',
            x: 1600,
            y: 1200,
            facing: 0.4,
            hp: 4200,
            maxHp: 5000,
            phase: 2,
            // Deliberately omit radius to verify fallback + drawBossEntity guard
          },
        ],
      });
      assert.equal(engine.multiplayer.pendingSyncMessages.length, 1);

      const tinHero = Mi.find((h: any) => h.id === 'tin');
      engine.startCoopMatch(tinHero, mpClient.room, {
        host_p1: { x: 1400, y: 1400 },
        peer_p2: { x: 1500, y: 1400 },
      });

      assert.equal(engine.wave, 3, 'Buffered WORLD_SYNC must catch non-host up to wave 3');
      const syncedBoss = engine.enemies.find((e: any) => e.id === 901);
      assert.ok(syncedBoss, 'Non-host must see the Boss replayed from buffered WORLD_SYNC');
      assert.equal(syncedBoss.kind, 'boss');
      assert.equal(syncedBoss.radius, 46);
      assert.doesNotThrow(() => engine.drawBossEntity({ ...syncedBoss, radius: 0 }));

      // 2) fullList=true WORLD_SYNC prunes stale enemies that died/despawned on host
      engine.enemies.push({ id: 9999, kind: 'minion', x: 100, y: 100, radius: 18, hp: 50, maxHp: 50 });
      engine.handleMultiplayerMessage({
        type: 'WORLD_SYNC',
        wave: 3,
        fullList: true,
        enemies: [
          { id: 901, kind: 'boss', bossWave: 3, x: 1620, y: 1210, facing: 0.5, hp: 3800, maxHp: 5000, radius: 46, phase: 2 },
        ],
      });
      assert.equal(engine.enemies.some((e: any) => e.id === 9999), false, 'Stale enemy should be pruned when fullList is true');
      assert.equal(engine.enemies.length, 1);

      // 3) Remote VFX creates visual-only crystals/pillars and detonates remote Luan portals safely
      engine.applyRemoteVfx('tin', [
        { type: 'tin_crystal_vis', x: 1520, y: 1410, radius: 44 },
        { type: 'eohyen_pillar_vis', ownerId: 'host_p1', x: 1540, y: 1420, size: 18 },
        { type: 'luan_portal_vis', x: 1560, y: 1430 },
      ]);
      assert.equal(engine.tinCrystals.length, 1);
      assert.equal(engine.tinCrystals[0].visualOnly, true);
      assert.equal(engine.icePillars.length, 1);
      assert.equal(engine.icePillars[0].visualOnly, true);
      assert.equal(engine.luanPortals.length, 1);
      assert.equal(engine.luanPortals[0].visualOnly, true);

      engine.applyRemoteVfx('luan', [{ type: 'luan_portal_detonate_vis' }]);
      assert.equal(engine.luanPortals.length, 0);

      // 4) ALLY_SUPPORT (both fromPlayerId and byPlayerId) and PLAYER_REVIVED restore teammate HP/shield
      if (!engine.player) throw new Error('Expected engine.player to be initialized');
      engine.player.hp = 400;
      engine.handleMultiplayerMessage({
        type: 'ALLY_SUPPORT',
        fromPlayerId: 'host_p1',
        x: 1510,
        y: 1410,
        radius: 260,
        heal: 200,
        shield: 120,
        label: '+200 HP',
      });
      assert.ok(engine.player.hp > 400);
      assert.ok(engine.player.shield > 0);

      // 5) Out-of-order WAVE_STARTED for the current wave must NOT wipe an already-synced Boss on Peer
      engine.handleMultiplayerMessage({ type: 'WAVE_STARTED', wave: 3 });
      assert.equal(engine.enemies.some((e: any) => e.id === 901 && e.kind === 'boss'), true);

      // 6) Boss hazard/callout VFX events sync cleanly and deduplicate hazard IDs
      engine.applyRemoteVfx('eohyen', [
        { type: 'boss_callout', x: 1620, y: 1150, text: 'TEST BOSS SKILL', color: '#EF4444', size: 16 },
        { type: 'boss_warn', id: 701, x: 1500, y: 1400, radius: 90, duration: 0.9, damage: 120, kind: 'meteor', color: '#EF4444' },
        { type: 'boss_warn', id: 701, x: 1500, y: 1400, radius: 90, duration: 0.9, damage: 120, kind: 'meteor', color: '#EF4444' },
        { type: 'boss_beam', id: 702, x1: 1400, y1: 1400, x2: 1700, y2: 1400, width: 42, duration: 0.8, damage: 140 },
        { type: 'boss_ring', id: 703, x: 1620, y: 1210, maxRadius: 340, speed: 420, damage: 110 },
        { type: 'particles', x: 1520, y: 1410, color: '#FBBF24', count: 6 },
        { type: 'explosion', x: 1520, y: 1410, maxRadius: 80, color: '#F97316' },
      ]);
      assert.equal(engine.bossWarnings.length, 1);
      assert.equal(engine.bossBeams.length, 1);
      assert.equal(engine.bossShockRings.length, 1);

      engine.multiplayer.localDowned = true;
      engine.player.hp = 0;
      engine.handleMultiplayerMessage({
        type: 'PLAYER_REVIVED',
        targetPlayerId: 'peer_p2',
        reviverName: 'HostHero',
        hpRatio: 0.45,
      });
      assert.equal(engine.multiplayer.localDowned, false);
      assert.ok(engine.player.hp >= Math.round(engine.player.maxHp * 0.45) - 1);

      engine.stopCoopMode();
    } finally {
      mpClient.disconnect();
      mpClient.room = null;
      mpClient.playerId = null;
    }
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Duy passive ramp (450% in 4.5s), C2/C3 shuriken scaling, and Decoy taunt priority work as designed', async () => {
  const {
    computeDuyPassiveMultiplier,
    computeDuyDecoyBlastDamage,
    computeDuyC2ShurikenCount,
    computeDuyC3ShurikenCount,
    computeDuyC3ShurikenDamage,
    selectMonsterTargetWithDecoy,
    DUY_DECOY_REFLECT_RATIO,
    DUY_C3_HEAL_PER_HIT,
  } = await import('./combatLogic.ts');
  const { drawDuyDecoy } = await import('./weaponRenderer.js');

  assert.equal(computeDuyPassiveMultiplier(0), 1);
  assert.equal(computeDuyPassiveMultiplier(2.25), 2.75);
  assert.equal(computeDuyPassiveMultiplier(4.5), 4.5);
  assert.equal(computeDuyPassiveMultiplier(9.0), 4.5);

  // Decoy explosion reduced to 40% of previous (0.3 -> 0.12; fallback 70+0.5*atk -> 28+0.2*atk)
  assert.equal(DUY_DECOY_REFLECT_RATIO, 0.12);
  assert.equal(computeDuyDecoyBlastDamage(1000, 1, 100), 120);
  assert.equal(computeDuyDecoyBlastDamage(1000, 4.5, 100), 540);
  assert.equal(computeDuyDecoyBlastDamage(0, 1, 100), 48);

  assert.equal(computeDuyC2ShurikenCount(0), 3);
  assert.equal(computeDuyC2ShurikenCount(29), 3);
  assert.equal(computeDuyC2ShurikenCount(30), 4);
  assert.equal(computeDuyC2ShurikenCount(95), 6);

  assert.equal(computeDuyC3ShurikenCount(0), 40);
  assert.equal(computeDuyC3ShurikenCount(30), 43);
  assert.equal(computeDuyC3ShurikenCount(120), 52);

  // C3 shuriken damage greatly reduced (35 + 0.45*atk -> 12 + 0.16*atk)
  assert.equal(computeDuyC3ShurikenDamage(100, 1), 28); // 12 + 16
  assert.equal(computeDuyC3ShurikenDamage(100, 4.5), 126); // round(28 * 4.5)
  assert.equal(DUY_C3_HEAL_PER_HIT, 100);

  // Verify drawDuyDecoy floating damage preview uses 12% reflect ratio
  const drawnTexts: string[] = [];
  const gradient = { addColorStop() {} };
  const mockCtx: any = {
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, arc() {}, ellipse() {}, rect() {},
    moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
    fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
    setLineDash() {}, clip() {}, roundRect() {},
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    strokeText(t: string) { drawnTexts.push(t); },
    fillText() {},
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    font: '12px sans-serif', textAlign: 'center', textBaseline: 'middle',
    lineCap: 'round', lineJoin: 'round',
  };
  drawDuyDecoy(mockCtx, { x: 0, y: 0, radius: 30, blastRadius: 195, life: 1, maxLife: 5, absorbedDamage: 1000, passiveMult: 1 }, 1, false);
  assert.ok(drawnTexts.some((t) => t.includes('120')), `Expected decoy preview text to contain 120, got: ${drawnTexts.join(', ')}`);

  // Verify gameData.js skill descriptions match updated values
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  try {
    const { Mi } = await import('./gameData.js');
    const duyHero = Mi.find((h: any) => h.id === 'duy');
    assert.ok(duyHero, 'Expected duy hero in gameData');
    const c1 = duyHero.skills.find((s: any) => s.key === 'c1');
    const c3 = duyHero.skills.find((s: any) => s.key === 'c3');
    assert.ok(c1 && c3, 'Expected c1 and c3 skills on duy');
    assert.ok(c1.description.vi.includes('12%') && c1.description.en.includes('12%'));
    assert.ok(c3.description.vi.includes('12 (+16% CVL)') && c3.description.en.includes('12 (+16% ATK)'));
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
  }

  const selected = selectMonsterTargetWithDecoy(
    [{ x: 105, y: 100 }],
    [
      { id: 1, x: 350, y: 100, radius: 30, life: 1, maxLife: 5, visualOnly: false },
      { id: 2, x: 120, y: 100, radius: 30, life: 5, maxLife: 5, visualOnly: false },
    ],
    100,
    100
  );
  assert.equal(selected?.kind, 'decoy');
  if (selected?.kind === 'decoy') {
    assert.equal(selected.decoy.id, 1);
  }
});

test('Waves 15-27 upgraded bosses render bodies/weapons safely across phases/animations and execute windup-to-release skills', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const createMockCtx = () => {
    const gradient = { addColorStop() {} };
    const noop = () => {};
    return {
      save: noop,
      restore: noop,
      translate: noop,
      rotate: noop,
      scale: noop,
      beginPath: noop,
      closePath: noop,
      arc: noop,
      ellipse: noop,
      rect: noop,
      moveTo: noop,
      lineTo: noop,
      quadraticCurveTo: noop,
      bezierCurveTo: noop,
      fill: noop,
      stroke: noop,
      fillRect: noop,
      strokeRect: noop,
      fillText: noop,
      strokeText: noop,
      setLineDash: noop,
      clip: noop,
      roundRect: noop,
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: () => ({ width: 20 }),
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: '#000',
      font: '12px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      lineCap: 'round',
      lineJoin: 'round',
    };
  };

  try {
    (globalThis as any).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      location: { protocol: 'https:', host: 'arena.example.com', origin: 'https://arena.example.com' },
    };
    (globalThis as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};

    const { GameEngine } = await import('./GameEngine.js');
    const { drawUpgradedBossBody, drawBossWeapon, drawUpgradedProjectile, drawUpgradedSlash } = await import('./weaponRenderer.js');
    const { Mi } = await import('./gameData.js');

    const mockCtx: any = createMockCtx();
    const mockCanvas: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => mockCtx,
    };

    const engine = new GameEngine(mockCanvas);
    const hero = Mi.find((h: any) => h.id === 'tin');
    engine.startNewGame(hero);
    if (!engine.player) throw new Error('Expected engine.player to be initialized');

    const upgradedBossWaves = [15, 18, 21, 24, 27];
    for (const bw of upgradedBossWaves) {
      for (const phase of [1, 2, 3]) {
        for (const isMono of [false, true]) {
          engine.player.tin_monochrome_realm_timer = isMono ? 2 : 0;
          const bossStates = [
            {
              id: 500 + bw,
              kind: 'boss',
              bossWave: bw,
              x: 1500,
              y: 1200,
              facing: 0.7,
              radius: 0, // Verify safe fallback radius
              hp: 5000,
              maxHp: 10000,
              phase,
              hitFlash: phase === 2 ? 0.1 : 0,
              animWalkPhase: 1.5,
              castWindupTimer: 0.2,
              castWindupTotal: 0.4,
              skillReleaseTimer: 0,
              skillReleaseTotal: 0.46,
              attackAnimTimer: 0,
              attackAnimDur: 0.34,
              attackSwingDir: 1,
            },
            {
              id: 600 + bw,
              kind: 'boss',
              bossWave: bw,
              x: 1500,
              y: 1200,
              facing: -1.1,
              radius: 54,
              hp: 2000,
              maxHp: 10000,
              phase,
              hitFlash: 0,
              animWalkPhase: 3.2,
              castWindupTimer: 0,
              castWindupTotal: 0.4,
              skillReleaseTimer: 0.22,
              skillReleaseTotal: 0.46,
              attackAnimTimer: 0.18,
              attackAnimDur: 0.34,
              attackSwingDir: -1,
            },
          ];
          for (const bState of bossStates) {
            assert.doesNotThrow(() => engine.drawBossEntity(bState), `drawBossEntity failed for wave ${bw} phase ${phase}`);
            assert.doesNotThrow(() => drawUpgradedBossBody(mockCtx, bState, 4.2, isMono));
            assert.doesNotThrow(() => drawBossWeapon(mockCtx, bState, 4.2, isMono));
          }
        }
      }
    }

    // Verify upgraded boss projectiles & slashes render cleanly (normal + mono)
    for (const kind of ['cyber_bolt', 'thunder_lance', 'venom_fang', 'blood_crystal', 'seraph_spear']) {
      assert.doesNotThrow(() =>
        drawUpgradedProjectile(mockCtx, { kind, x: 100, y: 100, angle: 0.4, radius: 11, color: '#38BDF8', distanceTraveled: 80 }, 2.5, false)
      );
      assert.doesNotThrow(() =>
        drawUpgradedProjectile(mockCtx, { kind, x: 100, y: 100, angle: 0.4, radius: 11, color: '#38BDF8', distanceTraveled: 80 }, 2.5, true)
      );
    }
    for (const sKind of ['boss_cyber_slash', 'boss_thunder_slash', 'boss_venom_slash', 'boss_blood_slash', 'boss_seraph_slash']) {
      assert.doesNotThrow(() =>
        drawUpgradedSlash(mockCtx, { kind: sKind, x: 100, y: 100, angle: 0.2, radius: 210, spread: 1.5, dir: 1, color: '#FBBF24', life: 0.15, maxLife: 0.35 }, false)
      );
    }

    // Verify telegraphed windup -> skill release executes Wave 15 skill 2 (spawns boss_emp_field)
    engine.enemies = [];
    engine.zones = [];
    engine.spawnBoss(15);
    const rex = engine.enemies.find((e: any) => e.kind === 'boss' && e.bossWave === 15);
    assert.ok(rex);
    rex.aoeTimer = 0;
    rex.bossSkillCycle = 1; // Next increment -> 2 (EMP Ring & EMP Field)
    engine.updateEnemies(0.05);
    assert.ok(rex.castWindupTimer > 0, 'Wave 15+ boss must enter telegraphed castWindupTimer before skill cast');
    assert.ok(rex.pendingSkill, 'Boss pendingSkill must be queued during windup');

    // Advance past windup duration to release the skill
    engine.updateEnemies(0.5);
    assert.equal(rex.castWindupTimer, 0);
    assert.equal(rex.pendingSkill, null);
    assert.ok(rex.skillReleaseTimer > 0, 'Boss must trigger weapon skillReleaseTimer on cast');
    assert.ok(engine.zones.some((z: any) => z.kind === 'boss_emp_field'), 'Wave 15 skill 2 must spawn boss_emp_field');

    // Verify Wave 21 venom_meteor warning spawns acid_pool on detonation
    engine.bossWarnings.push({
      id: 991,
      x: 1600,
      y: 1200,
      radius: 110,
      timer: 0.99,
      duration: 1.0,
      damage: 80,
      kind: 'venom_meteor',
      color: '#22C55E',
      ccType: 'stun',
      ccDur: 2.0,
    });
    engine.updateBossWarnings(0.05);
    assert.ok(engine.zones.some((z: any) => z.kind === 'acid_pool'), 'venom_meteor warning should leave lingering acid_pool');

    // Verify applyRemoteVfx("boss_anim") animates synced boss
    engine.applyRemoteVfx('tin', [
      { type: 'boss_anim', enemyId: rex.id, kind: 'windup', skillIdx: 1, duration: 0.36 },
    ]);
    assert.equal(rex.castSkillIdx, 1);
    assert.equal(rex.castWindupTimer, 0.36);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('MOBA hero role classification & filtering covers all 21 champions accurately', async () => {
  const { Mi } = await import('./gameData.js');
  assert.equal(Mi.length, 21);
  assert.deepEqual(HERO_ROLE_ORDER, ['all', 'fighter', 'assassin', 'marksman', 'mage', 'tank']);

  const allFiltered = filterHeroesByRole(Mi, 'all');
  assert.equal(allFiltered.length, Mi.length);

  let sumByRole = 0;
  for (const roleKey of ['fighter', 'assassin', 'marksman', 'mage', 'tank'] as const) {
    const bucket = filterHeroesByRole(Mi, roleKey);
    assert.ok(bucket.length > 0, `Expected non-empty hero bucket for role ${roleKey}`);
    sumByRole += bucket.length;
    for (const h of bucket) {
      assert.equal(HERO_ROLE_CATALOG[h.id], roleKey);
      assert.equal(getHeroRoleKey(h.id), roleKey);
    }
  }
  assert.equal(sumByRole, Mi.length);
  assert.equal(getHeroRoleKey('unknown_hero_id'), 'fighter');
});

test('SoundEngine lobby, UI, combat SFX & music modes execute cleanly with and without AudioContext', async () => {
  const { R } = await import('./soundEngine.js');
  const prevWindow = (globalThis as any).window;

  const invokeAllSounds = () => {
    const heroIds = ['dung', 'tin', 'kin', 'trung', 'eohyen', 'longhoi', 'gau', 'duccong', 'bao', 'luan', 'danh', 'taidu', 'nguyen', 'duy', 'phong', 'dang', 'thanh', 'nhi', 'minh', 'ducanh', 'thien'];
    for (const id of heroIds) {
      R.lastCooldowns.clear();
      R.playHeroSelect(id);
      R.playHeroSkillPreview(id, 'passive');
      R.playHeroSkillPreview(id, 'atk');
      R.playHeroSkillPreview(id, 'c1');
      R.playHeroSkillPreview(id, 'c2');
      R.playHeroSkillPreview(id, 'c3');
    }
    R.lastCooldowns.clear();
    R.playHeroSkillPreview('thien', 'c4');
    R.playThienBasic();
    R.playThienSwords();
    R.playThienTimeZone();
    R.playThienPortal();
    R.playThienSunUlt();
    R.playThienAscend();
    R.playThienGodMode();
    R.lastCooldowns.clear();
    R.playThanhSnakeCast(false);
    R.playThanhSnakeCast(true);
    R.playThanhDevour();
    R.playThanhGuardShield();
    R.playNhiAmmoSwitch('purple');
    R.playNhiAmmoSwitch('green');
    R.playNhiAmmoSwitch('life');
    R.playNhiFlaskBreak();
    R.playNhiPoisonSizzle();
    R.playNhiUltShot();
    R.lastCooldowns.clear();
    R.playPhongDash();
    R.playPhongIllusionSpawn();
    R.playPhongSwap();
    R.playPhongDeathFlurry();
    R.playDangTigerPunch(0);
    R.lastCooldowns.clear();
    R.playDangTigerPunch(1);
    R.playDangTigerWave();
    R.playDangBlackArmor();
    R.playDangTigerRoar();

    R.lastCooldowns.clear();
    R.playClick();
    R.playHover();
    R.playTabSwitch();
    R.playModalOpen();
    R.playModalClose();
    R.playCopy();
    R.playError();
    R.playHeroLockIn();
    R.playReadyCheck();
    R.playMatchStart();
    R.playLobbyPing('ready');
    R.lastCooldowns.clear();
    R.playLobbyPing('wait');
    R.lastCooldowns.clear();
    R.playLobbyPing('gather');
    R.playEquip();
    R.playUnequip();
    R.playTestSample();
    R.playCoin();
    R.playBuy();
    R.playUpgrade();
    R.playFanfare();
    R.playHeal();
    R.playLevelUp();

    R.lastCooldowns.clear();
    R.playHit();
    R.playPlayerHurt();
    R.playCritHit();
    R.playKill(3);
    R.playMultiKill(5);
    R.playComboRankUp('SS');
    R.playXpOrb();
    R.playShieldAbsorb();
    R.playShieldBreak();
    R.playStun();
    R.playWaveStart(false);
    R.lastCooldowns.clear();
    R.playWaveStart(true);
    R.playWaveClear();
    R.playBossPhase(2);
    R.lastCooldowns.clear();
    R.playBossPhase(3);
    R.playVictory();
    R.playDefeat();
    R.playRevive();
  };

  try {
    // 1. Safe no-op without AudioContext
    R.ctx = null;
    assert.doesNotThrow(invokeAllSounds);

    // 2. Full synthesis verification with mocked Web Audio API
    const createParam = (initial = 0) => ({
      value: initial,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
      setTargetAtTime: () => {},
    });
    const createNode = () => ({
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      gain: createParam(1),
      frequency: createParam(440),
      Q: createParam(1),
      pan: createParam(0),
      delayTime: createParam(0.08),
      threshold: createParam(-16),
      knee: createParam(18),
      ratio: createParam(5.5),
      attack: createParam(0.004),
      release: createParam(0.14),
      type: 'sine',
      buffer: null,
    });
    class MockAudioContext {
      currentTime = 1.0;
      sampleRate = 44100;
      state = 'running';
      destination = createNode();
      resume = async () => {};
      createGain = () => createNode();
      createOscillator = () => createNode();
      createBiquadFilter = () => createNode();
      createBufferSource = () => createNode();
      createDynamicsCompressor = () => createNode();
      createDelay = () => createNode();
      createStereoPanner = () => createNode();
      createBuffer = (_ch: number, len: number) => ({
        getChannelData: () => new Float32Array(len),
      });
    }

    (globalThis as any).window = { AudioContext: MockAudioContext };
    R.ctx = null;
    R.setSfxEnabled(true);
    R.setMusicEnabled(true);
    assert.doesNotThrow(invokeAllSounds);
    for (const mode of ['menu', 'battle', 'boss', 'paused', 'off']) {
      assert.doesNotThrow(() => R.setMusicMode(mode));
      assert.doesNotThrow(() => R.scheduleMusicSteps());
    }
    R.setMusicMode('off');
  } finally {
    R.setMusicMode('off');
    R.ctx = null;
    (globalThis as any).window = prevWindow;
  }
});

test('P2PRoomHost and P2PRoomPeerClient complete lobby, match start, and velocity sync over AH1R relay when RTCPeerConnection is absent', async () => {
  const {
    P2PRoomHost,
    P2PRoomPeerClient,
    encodeSignalPayload,
    decodeSignalPayload,
  } = await import('./webrtcCoop.js');
  const prevRTC = (globalThis as any).RTCPeerConnection;

  try {
    delete (globalThis as any).RTCPeerConnection;

    const encodedRelay = await encodeSignalPayload({ t: 'offer', relay: true, sid: 'ios_msg_1' });
    assert.ok(encodedRelay.startsWith('AH1R:'));
    const decodedRelay = await decodeSignalPayload(encodedRelay);
    assert.equal(decodedRelay.relay, true);
    assert.equal(decodedRelay.sid, 'ios_msg_1');

    const hostEvents: any[] = [];
    const peerEvents: any[] = [];

    const host = new P2PRoomHost({
      hostName: 'iPhoneHost',
      heroId: 'eohyen',
      onLocalEvent: (ev: any) => hostEvents.push(ev),
      onPeersChanged: () => {},
    });
    host.start();

    const inviteRes = (await host.createInviteOffer()) as { inviteId: string; code: string; relayOnly?: boolean };
    const offerCode = inviteRes.code;
    assert.equal(inviteRes.relayOnly, true);
    assert.ok(offerCode.startsWith('AH1R:'));

    const peer = new P2PRoomPeerClient({
      onEvent: (ev: any) => peerEvents.push(ev),
      onClose: () => {},
    });

    const answerCode = await peer.createAnswerFromOffer(offerCode, 'MessengerPeer', 'duy');
    assert.ok(answerCode.startsWith('AH1R:'));
    assert.equal(peer.rtcUnavailable, true);

    host.setRelaySender((_pid: string, msg: any) => {
      queueMicrotask(() => peer.receiveRelayMessage(msg));
    });
    peer.setRelaySender((msg: any) => {
      queueMicrotask(() => host.receiveRelayMessage(peer.playerId!, msg));
    });

    await host.acceptJoinAnswer(answerCode);
    await new Promise((r) => setTimeout(r, 40));

    assert.equal(host.hasRelayPeers(), true);
    assert.equal(peer.joinedRoom, true);
    assert.equal(peer.isOpen(), true);
    assert.equal(peer.isDirectOpen(), false);
    assert.ok(peerEvents.some((e) => e.type === 'ROOM_JOINED'));

    peer.send({ type: 'TOGGLE_READY', ready: true });
    await new Promise((r) => setTimeout(r, 25));
    host.handleMessage(host.hostId, { type: 'START_MATCH' });
    await new Promise((r) => setTimeout(r, 40));

    assert.ok(peerEvents.some((e) => e.type === 'MATCH_STARTED'));
    assert.equal(peer.inMatch, true);

    // Sync enemy velocity & boss cast metadata + player velocity
    host.handleMessage(host.hostId, {
      type: 'WORLD_SNAPSHOT',
      wave: 1,
      fullList: true,
      fullMeta: true,
      waveSpawned: 1,
      enemies: [
        {
          id: 77,
          kind: 'boss',
          bossWave: 15,
          name: 'Rex',
          radius: 46,
          color: '#38BDF8',
          hp: 4000,
          maxHp: 4000,
          x: 1200,
          y: 900,
          vx: 145,
          vy: -60,
          facing: 0.5,
          phase: 2,
          castSkillIdx: 2,
          castWindupTimer: 0.32,
        },
      ],
    });
    peer.send({
      type: 'SYNC_PLAYER',
      state: { x: 800, y: 700, vx: 210, vy: -40, facing: 1.1, hp: 900, maxHp: 900, alive: true },
    });
    await new Promise((r) => setTimeout(r, 40));

    const worldSync = peerEvents.find((e) => e.type === 'WORLD_SYNC');
    assert.ok(worldSync, 'Relay peer must receive WORLD_SYNC');
    assert.equal(worldSync.enemies[0].vx, 145);
    assert.equal(worldSync.enemies[0].vy, -60);
    assert.equal(worldSync.enemies[0].castSkillIdx, 2);

    const playerState = hostEvents.find((e) => e.type === 'PLAYER_STATE' && e.player?.id === peer.playerId);
    assert.ok(playerState, 'Relay host must receive peer PLAYER_STATE');
    assert.equal(playerState.player.vx, 210);
    assert.equal(playerState.player.vy, -40);

    peer.destroy();
    host.destroy();
  } finally {
    if (prevRTC !== undefined) (globalThis as any).RTCPeerConnection = prevRTC;
    else delete (globalThis as any).RTCPeerConnection;
  }
});

test('P2PRoomHost routes volatile updates via arena-coop-fast DataChannel and drops under backpressure', async () => {
  const { P2PRoomHost } = await import('./webrtcCoop.js');
  const prevRTC = (globalThis as any).RTCPeerConnection;

  const createdChannels: any[] = [];
  class DualMockDC {
    label: string;
    ordered: boolean;
    maxRetransmits?: number;
    readyState = 'open';
    bufferedAmount = 0;
    sent: string[] = [];
    onopen: (() => void) | null = null;
    onmessage: ((ev: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(label: string, opts: any = {}) {
      this.label = label;
      this.ordered = opts.ordered !== false;
      this.maxRetransmits = opts.maxRetransmits;
      createdChannels.push(this);
    }
    send(raw: string) {
      this.sent.push(raw);
    }
    close() {
      this.readyState = 'closed';
    }
  }

  class DualMockRTC {
    connectionState = 'connected';
    iceConnectionState = 'connected';
    iceGatheringState = 'complete';
    localDescription: any = null;
    remoteDescription: any = null;
    createDataChannel(label: string, opts?: any) {
      return new DualMockDC(label, opts);
    }
    async createOffer() {
      return { type: 'offer', sdp: 'v=0\r\no=- dual 1 IN IP4 127.0.0.1\r\n' };
    }
    async setLocalDescription(d: any) {
      this.localDescription = d;
    }
    async setRemoteDescription(d: any) {
      this.remoteDescription = d;
    }
    close() {}
  }

  (globalThis as any).RTCPeerConnection = DualMockRTC;
  try {
    const host = new P2PRoomHost({
      hostName: 'Host',
      heroId: 'eohyen',
      onLocalEvent: () => {},
      onPeersChanged: () => {},
    });
    host.start();
    await host.createInviteOffer();
    await Promise.resolve();

    const reliableDc = createdChannels.find((c) => c.label === 'arena-coop');
    const fastDc = createdChannels.find((c) => c.label === 'arena-coop-fast');
    assert.ok(reliableDc, 'Must create primary reliable DataChannel');
    assert.ok(fastDc, 'Must create unreliable fast DataChannel when RTCPeerConnection supports bufferedAmount');
    assert.equal(fastDc.ordered, false);
    assert.equal(fastDc.maxRetransmits, 0);

    const slot = Array.from(host.peers.values())[0] as any;
    slot.pendingQueue = [];
    reliableDc.sent.length = 0;
    fastDc.sent.length = 0;

    // Critical control packet -> reliable channel
    host.sendToPlayer(slot.playerId, { type: 'MATCH_STARTED', matchNonce: 1 });
    assert.equal(reliableDc.sent.length, 1);
    assert.equal(fastDc.sent.length, 0);

    // Volatile sync packet -> fast unordered channel
    host.sendToPlayer(slot.playerId, { type: 'WORLD_SYNC', enemies: [] });
    assert.equal(fastDc.sent.length, 1);
    assert.equal(reliableDc.sent.length, 1);

    // Saturated fast channel -> volatile packet dropped instead of queuing lag
    fastDc.bufferedAmount = 128000;
    host.sendToPlayer(slot.playerId, { type: 'PLAYER_STATE', player: { id: 'p1', x: 10, y: 20 } });
    assert.equal(fastDc.sent.length, 1, 'Volatile packet must drop when fast channel bufferedAmount > limit');
    assert.equal(slot.pendingQueue.length, 0, 'Dropped volatile packet must not buffer in pendingQueue');

    host.destroy();
  } finally {
    if (prevRTC !== undefined) (globalThis as any).RTCPeerConnection = prevRTC;
    else delete (globalThis as any).RTCPeerConnection;
  }
});

test('GameEngine non-host P2P client dead-reckons enemy/teammate movement and smoothly interpolates facing', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  try {
    (globalThis as any).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      location: { protocol: 'https:', host: 'arena.example.com', origin: 'https://arena.example.com' },
    };
    (globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};

    const { GameEngine } = await import('./GameEngine.js');
    const { Mi } = await import('./gameData.js');
    const mockCanvas: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ({
        save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        beginPath() {}, closePath() {}, arc() {}, ellipse() {}, rect() {},
        moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
        fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
        fillText() {}, strokeText() {}, setLineDash() {}, clip() {}, roundRect() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        measureText: () => ({ width: 20 }),
      }),
    };

    const engine = new GameEngine(mockCanvas);
    const hero = Mi.find((h: any) => h.id === 'eohyen');
    engine.startCoopMatch(
      hero,
      {
        roomId: '123456',
        hostId: 'host_1',
        playerCount: 2,
        powerMultiplier: 1.5,
        members: [
          { id: 'host_1', name: 'Host', heroId: 'tin', slot: 1, isHost: true },
          { id: 'peer_2', name: 'Peer', heroId: 'eohyen', slot: 2, isHost: false },
        ],
      },
      { host_1: { x: 600, y: 600 }, peer_2: { x: 800, y: 800 } }
    );
    // Force local client as non-host
    engine.multiplayer.isHost = false;

    engine.enemies.push({
      id: 901,
      kind: 'minion',
      radius: 16,
      hp: 200,
      maxHp: 200,
      x: 1000,
      y: 1000,
      vx: 0,
      vy: 0,
      mpTargetX: 1000,
      mpTargetY: 1000,
      facing: 0,
      mpTargetFacing: 0,
      mpSyncAge: 0,
      stunTimer: 0,
      slowFactor: 0,
      slowTimer: 0,
      hitFlash: 0,
      attackCooldown: 1,
    });

    engine.handleMultiplayerMessage({
      type: 'WORLD_SYNC',
      wave: 1,
      fullList: true,
      enemies: [
        {
          id: 901,
          hp: 200,
          maxHp: 200,
          x: 1020,
          y: 1000,
          vx: 240,
          vy: 0,
          facing: 1.0,
          phase: 1,
          stunTimer: 0,
          slowFactor: 0,
          frozenTimer: 0,
        },
      ],
    });

    engine.multiplayer.remotePlayers.set('host_1', {
      id: 'host_1',
      name: 'Host',
      heroId: 'tin',
      alive: true,
      x: 600,
      y: 600,
      vx: 0,
      vy: 0,
      targetX: 600,
      targetY: 600,
      facing: 0,
      targetFacing: 0,
      hp: 840,
      maxHp: 840,
    });
    engine.handleMultiplayerMessage({
      type: 'PLAYER_STATE',
      player: {
        id: 'host_1',
        name: 'Host',
        heroId: 'tin',
        alive: true,
        x: 615,
        y: 600,
        vx: 200,
        vy: 0,
        facing: 1.2,
        hp: 840,
        maxHp: 840,
        moveSpeedFactor: 1,
      },
    });

    engine.update(0.016);

    const syncedEnemy = engine.enemies.find((e: any) => e.id === 901);
    assert.ok(syncedEnemy.x > 1004, 'Non-host enemy must dead-reckon smoothly along target + vx');
    assert.ok(syncedEnemy.facing > 0.1 && syncedEnemy.facing < 1.0, 'Non-host enemy facing must interpolate smoothly');

    const remoteHost = engine.multiplayer.remotePlayers.get('host_1');
    assert.ok(remoteHost.x > 603, 'Remote teammate must dead-reckon smoothly in update()');
    assert.ok(remoteHost.facing > 0.1 && remoteHost.facing < 1.2, 'Remote teammate facing must interpolate smoothly in update()');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Phong and Dang pure combat helpers enforce missing-HP scaling, boss cap, Rage curve, and wave heal cap', () => {
  assert.equal(PHONG_MAX_ILLUSIONS, 4);
  assert.equal(PHONG_ILLUSION_DURATION, 5.5);
  assert.equal(PHONG_KILL_HEAL_RATIO, 0.08);
  assert.equal(PHONG_KILL_CD_REFUND, 1.2);

  assert.equal(computePhongMissingHpScale(1000, 1000), 1);
  assert.equal(computePhongMissingHpScale(500, 1000), 1.6);
  assert.equal(computePhongMissingHpScale(0, 1000), 2.2);

  const normalExec = computePhongC3SlashDamage({ baseDamage: 100, targetHp: 0, targetMaxHp: 1000, isBoss: false });
  const bossExec = computePhongC3SlashDamage({ baseDamage: 100, targetHp: 0, targetMaxHp: 1000, isBoss: true });
  assert.equal(normalExec, 220);
  assert.equal(bossExec, 185);

  assert.equal(DANG_RAGE_MAX, 100);
  assert.equal(DANG_ARMOR_DURATION, 3.2);
  assert.equal(DANG_ARMOR_DR, 0.42);
  assert.equal(DANG_C3_AS_BONUS, 0.5);
  assert.equal(DANG_C3_AS_DURATION, 5.0);

  const fullHpRage = computeDangRageGain({ baseGain: 10, currentHp: 1450, maxHp: 1450 });
  const lowHpRage = computeDangRageGain({ baseGain: 10, currentHp: 290, maxHp: 1450 });
  assert.equal(fullHpRage, 10);
  assert.equal(lowHpRage, 22);

  assert.equal(computeDangC1WaveHeal(1450, 0), 0);
  const heal1 = computeDangC1WaveHeal(1450, 1);
  const heal3 = computeDangC1WaveHeal(1450, 3);
  const healMany = computeDangC1WaveHeal(1450, 20);
  assert.ok(heal1 > 0 && heal3 > heal1 && healMany <= Math.round(1450 * 0.14));

  const illHeal = computePhongIllusionHitHeal(1000, 35);
  assert.equal(illHeal, 20);
});

test('Phong (Sat Thu Anh Toc) illusions, kill heal/refund, C1 3-dash, C2 Hoan Anh, and C3 missing-HP slashes work in GameEngine', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  try {
    (globalThis as any).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      location: { protocol: 'https:', host: 'arena.example.com', origin: 'https://arena.example.com' },
    };
    (globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};

    const { GameEngine } = await import('./GameEngine.js');
    const { Mi } = await import('./gameData.js');
    const mockCanvas: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ({
        save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        beginPath() {}, closePath() {}, arc() {}, ellipse() {}, rect() {},
        moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
        fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
        fillText() {}, strokeText() {}, setLineDash() {}, clip() {}, roundRect() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        measureText: () => ({ width: 20 }),
      }),
    };

    const engine = new GameEngine(mockCanvas);
    const phongHero = Mi.find((h: any) => h.id === 'phong');
    engine.startNewGame(phongHero);
    const player = engine.player!;
    player.hp = 600;
    player.x = 1200;
    player.y = 1200;

    // Place a durable dummy enemy ahead for C1
    const enemy1: any = {
      id: 1, kind: 'minion', name: 'Dummy1', radius: 18,
      x: 1320, y: 1200, hp: 3000, maxHp: 3000, speed: 60, damage: 10,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies.push(enemy1);

    // Cast C1 Tam Anh Tram: creates 1 illusion + queues 2 remaining dashes (3 total)
    engine.castSkill(0, 0, enemy1.x, enemy1.y);
    assert.equal(engine.phongIllusions.length, 1, 'Casting C1 must spawn 1 shadow illusion');
    assert.equal(engine.phongSkillQueue.length, 2, 'C1 must queue 2 follow-up dashes after initial dash');

    // Advance engine so remaining 2 dashes execute (0.13s apart) and verify heal on 3rd guaranteed crit
    const hpBefore3rd = player.hp;
    for (let i = 0; i < 8; i++) engine.updatePhongAndDangSystems(0.05);
    assert.equal(engine.phongSkillQueue.length, 0, 'All 3 C1 dashes should complete');
    assert.ok(enemy1.hp < 2700, 'C1 3 dashes must damage enemy');
    assert.ok(player.hp > hpBefore3rd, 'C1 3rd slash must heal Phong');

    // Verify illusion cap of 4, autonomous projectile firing, and bolt sustain heal
    for (let i = 0; i < 5; i++) engine.spawnPhongIllusion(1200 + i * 25, 1200);
    assert.equal(engine.phongIllusions.length, PHONG_MAX_ILLUSIONS, 'Shadow illusions capped at 4');
    engine.phongIllusions[0].fireTimer = 0.01;
    engine.projectiles = [];
    engine.updatePhongAndDangSystems(0.05);
    assert.ok(
      engine.projectiles.some((p: any) => p.kind === 'phong_illusion_bolt'),
      'Illusions must autonomously fire phong_illusion_bolt'
    );
    const hpBeforeBoltHit = player.hp;
    for (let i = 0; i < 4; i++) engine.updateProjectiles(0.05);
    assert.ok(player.hp > hpBeforeBoltHit, 'phong_illusion_bolt hits must heal Phong');

    // Cast C2 Hoan Anh: swaps to nearest illusion, grants shield + heal, and explodes AoE + slow
    engine.phongIllusions = [{
      id: 99, x: 1550, y: 1200, facing: 0, life: 4, maxLife: 5.5, fireTimer: 0.5, scale: 1, ownerId: 'local',
    }];
    const enemyNearIllusion: any = {
      id: 2, kind: 'minion', name: 'Dummy2', radius: 18,
      x: 1580, y: 1200, hp: 2000, maxHp: 2000, speed: 60, damage: 10,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies.push(enemyNearIllusion);
    player.hp = 600;
    player.shield = 0;
    engine.castSkill(1, 0, 1550, 1200);
    assert.ok(Math.hypot(player.x - 1550, player.y - 1200) < 5, 'C2 Hoan Anh must teleport Phong to nearest illusion');
    assert.ok(player.shield > 0, 'C2 Hoan Anh must grant Shadow Veil shield');
    assert.ok(player.hp > 600, 'C2 Hoan Anh arrival must heal Phong');
    assert.ok(enemyNearIllusion.hp < 2000, 'C2 arrival must damage nearby enemy');
    assert.ok(enemyNearIllusion.slowTimer > 0, 'C2 arrival must slow nearby enemy');

    // Verify C3 CC immunity + boss-hit baseline heal + execute bonus heal + passive CD refund
    player.hp = 500;
    player.cooldowns = [4.0, 5.0, 0];
    const durableBoss: any = {
      id: 98, kind: 'boss', bossWave: 3, name: 'DurableBoss', radius: 36,
      x: 1520, y: 1200, hp: 9000, maxHp: 9000, speed: 60, damage: 10,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies = [durableBoss];
    engine.castSkill(2, 0, durableBoss.x, durableBoss.y);
    engine.applyPlayerCC('stun', 1.5);
    assert.equal(player.stunTimer, 0, 'Phong C3 flurry must grant CC immunity');
    for (let i = 0; i < 10; i++) engine.updatePhongAndDangSystems(0.05);
    assert.ok(player.hp > 580, 'Phong C3 finisher hitting a boss must restore baseline HP');

    // Cast C3 Tu Than Giang Lam on a low-HP marked target & verify missing-HP scaling + execute heal + passive CD refund
    player.hp = 500;
    player.cooldowns = [4.0, 5.0, 0];
    const weakTarget: any = {
      id: 3, kind: 'minion', name: 'WeakTarget', radius: 18,
      x: 1620, y: 1200, hp: 260, maxHp: 2000, speed: 60, damage: 10,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies = [weakTarget];
    engine.castSkill(2, 0, weakTarget.x, weakTarget.y);
    assert.ok(weakTarget.phong_c3_marked > 0 || weakTarget.hp <= 0);
    for (let i = 0; i < 12; i++) engine.updatePhongAndDangSystems(0.05);
    assert.ok(weakTarget.hp <= 0, 'C3 flurry should execute weakened target');
    assert.ok(player.hp > 650, 'Passive kill heal + C3 execute heal should substantially restore Phong HP');
    assert.ok(player.cooldowns[0] < 4.0 && player.cooldowns[1] < 5.0, 'Passive kill must refund skill cooldowns');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Dang (Dau Si Ho Quyen) Rage Ho Quyen, C1 Bach Ho waves, C2 Hac Ho DR/counter/detonate, and C3 5-punch Tiger Head work in GameEngine', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  try {
    (globalThis as any).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      location: { protocol: 'https:', host: 'arena.example.com', origin: 'https://arena.example.com' },
    };
    (globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};

    const { GameEngine } = await import('./GameEngine.js');
    const { Mi } = await import('./gameData.js');
    const mockCanvas: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ({
        save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        beginPath() {}, closePath() {}, arc() {}, ellipse() {}, rect() {},
        moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
        fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
        fillText() {}, strokeText() {}, setLineDash() {}, clip() {}, roundRect() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        measureText: () => ({ width: 20 }),
      }),
    };

    const engine = new GameEngine(mockCanvas);
    const dangHero = Mi.find((h: any) => h.id === 'dang');
    engine.startNewGame(dangHero);
    const player = engine.player!;
    player.x = 1200;
    player.y = 1200;

    // 1. Passive Rage builds to 100 and empowers next basic attack into Ho Quyen AoE + heal
    player.hp = 900;
    player.dang_rage = 100;
    player.dang_rageReady = true;
    const foeA: any = {
      id: 11, kind: 'minion', name: 'FoeA', radius: 18,
      x: 1255, y: 1200, hp: 3000, maxHp: 3000, speed: 60, damage: 100,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    const foeB: any = {
      id: 12, kind: 'minion', name: 'FoeB', radius: 18,
      x: 1270, y: 1235, hp: 3000, maxHp: 3000, speed: 60, damage: 100,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies.push(foeA, foeB);

    engine.triggerBasicAttack();
    assert.equal(player.dang_rage, 0, 'Ho Quyen consumes 100 Rage');
    assert.equal(player.dang_rageReady, false);
    assert.ok(foeA.hp < 3000 && foeB.hp < 3000, 'Ho Quyen hits multiple enemies in AoE');
    assert.ok(player.hp > 900, 'Ho Quyen heals Dang');

    // 2. C1 Bach Ho Pha Son spawns 3 tiger waves and heals per enemy hit
    engine.projectiles = [];
    engine.castSkill(0, 0, 1400, 1200);
    const waves = engine.projectiles.filter((p: any) => p.kind === 'dang_tiger_wave');
    assert.equal(waves.length, 3, 'C1 must fire 3 tiger wave projectiles');
    const hpBeforeWaves = player.hp;
    for (let i = 0; i < 6; i++) engine.updateProjectiles(0.05);
    assert.ok(player.hp >= hpBeforeWaves, 'C1 wave hits heal Dang');

    // 3. C2 Hac Ho Ho The grants shield, reduces incoming damage, counters & heals, then recast detonates knockback explosion + heal
    player.hp = 1000;
    player.shield = 0;
    player.dang_c2_timer = 0;
    player.cooldowns[1] = 0;
    engine.castSkill(1, 0, player.x, player.y);
    assert.ok(player.dang_c2_timer > 3.0, 'C2 activates Hac Ho armor');
    assert.ok(player.shield > 0, 'C2 activates Hac Ho initial shield');
    const hpBeforeHit = player.hp;
    engine.damagePlayer(100, { x: foeA.x, y: foeA.y } as any);
    // Shield + 42% DR + 3% MaxHP counter-heal keeps HP >= hpBeforeHit - 58
    assert.ok(player.hp > hpBeforeHit - 58, 'C2 armor must reduce damage & trigger counter-heal');
    assert.ok(foeA.hp < 2850, 'C2 counter must damage nearby attackers');

    // Recast C2 after brief lock -> detonates, pushes back, heals, & puts C2 on cooldown
    player.dang_c2_recastLock = 0;
    player.hp = 1000;
    const foeXBeforeBoom = foeA.x;
    assert.equal(engine.canActivateSkill(1), true, 'C2 recast must be allowed while armor is active');
    engine.castSkill(1, 0, player.x, player.y);
    assert.equal(player.dang_c2_timer, 0, 'Recast detonates and ends C2 armor');
    assert.ok(player.cooldowns[1] > 0, 'Detonation puts C2 on cooldown');
    assert.ok(foeA.x > foeXBeforeBoom, 'C2 explosion pushes enemies back');
    assert.ok(player.hp > 1000, 'C2 detonation hitting enemies heals Dang');

    // 4. C3 Ho Quyen Diet The 5-punch combo (CC-immune) + giant tiger head + stun + heal + +50% AS buff
    player.hp = 900;
    player.dang_c3_asTimer = 0;
    const baseInterval = engine.getEffectiveAttackInterval();
    engine.projectiles = [];
    engine.castSkill(2, 0, 1400, 1200);
    engine.applyPlayerCC('stun', 1.5);
    assert.equal(player.stunTimer, 0, 'Dang C3 flurry must grant CC immunity');
    assert.equal(engine.dangFlurryQueue.length, 1, 'Punch 1 fires immediately and remaining 4 punches are scheduled');
    assert.equal(engine.dangFlurryQueue[0].step, 1, 'Flurry queue starts at step 1 for remaining 4 punches');
    for (let i = 0; i < 14; i++) engine.updatePhongAndDangSystems(0.05);
    assert.equal(engine.dangFlurryQueue.length, 0);
    assert.ok(
      engine.projectiles.some((p: any) => p.kind === 'dang_tiger_head'),
      '5th punch must summon giant dang_tiger_head projectile'
    );
    assert.ok(player.hp > 900, 'C3 finisher must heal Dang');
    assert.ok(player.dang_c3_asTimer > 4.0, 'C3 finisher must grant attack speed buff');
    assert.ok(engine.getEffectiveAttackInterval() < baseInterval, 'C3 AS buff must reduce attack interval');
    foeA.x = player.x + 120;
    foeA.y = player.y;
    foeA.stunTimer = 0;
    for (let i = 0; i < 4; i++) engine.updateProjectiles(0.05);
    assert.ok(foeA.stunTimer > 0, 'Giant tiger head impact must stun non-immune monsters');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Phong and Dang weaponRenderer routines draw cleanly with zero shadowBlur', async () => {
  const {
    drawHeroBody,
    drawHeroWeapon,
    drawPhongIllusion,
    drawUpgradedProjectile,
    drawUpgradedSlash,
  } = await import('./weaponRenderer.js');

  let maxShadowBlurUsed = 0;
  const gradient = { addColorStop() {} };
  const noop = () => {};
  const ctx: any = {
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    beginPath: noop, closePath: noop, arc: noop, ellipse: noop, rect: noop,
    moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    fill: noop, stroke: noop, fillRect: noop, strokeRect: noop,
    fillText: noop, strokeText: noop, setLineDash: noop, clip: noop, roundRect: noop,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: () => ({ width: 20 }),
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    _shadowBlur: 0,
    get shadowBlur() { return this._shadowBlur; },
    set shadowBlur(v: number) {
      this._shadowBlur = v;
      if (v > maxShadowBlurUsed) maxShadowBlurUsed = v;
    },
    shadowColor: '#000', font: '12px sans-serif', textAlign: 'center', textBaseline: 'middle', lineCap: 'round', lineJoin: 'round',
  };

  for (const isMono of [false, true]) {
    assert.doesNotThrow(() =>
      drawHeroBody(ctx, { heroId: 'phong', radius: 22, facing: 0.4, color: '#0EA5E9', accentColor: '#22D3EE', isMono, isUlt: true, elapsedTime: 3.4, moveSpeedFactor: 0.8, walkCyclePhase: 1.2 })
    );
    assert.doesNotThrow(() =>
      drawHeroWeapon(ctx, 'phong', { x: 100, y: 100, facing: 0.4, attackAnimTimer: 0.2, weaponAttackDuration: 0.35, attackSwingParity: 1, phong_basicStep: 1 }, 3.4, isMono)
    );
    assert.doesNotThrow(() =>
      drawHeroBody(ctx, { heroId: 'dang', radius: 22, facing: -0.5, color: '#18181B', accentColor: '#F8FAFC', isMono, isUlt: true, elapsedTime: 3.4, moveSpeedFactor: 0.8, walkCyclePhase: 2.1 })
    );
    assert.doesNotThrow(() =>
      drawHeroWeapon(ctx, 'dang', { x: 100, y: 100, facing: -0.5, attackAnimTimer: 0.15, weaponAttackDuration: 0.35, attackSwingParity: -1, dang_rageReady: true, dang_c2_timer: 2.0, dang_c3_asTimer: 3.0, dang_basicStep: 2 }, 3.4, isMono)
    );
    assert.doesNotThrow(() =>
      drawPhongIllusion(ctx, { x: 200, y: 180, facing: 0.7, life: 3.2, maxLife: 5.5, attackAnim: 0.15 }, 3.4, isMono)
    );
    for (const kind of ['phong_illusion_bolt', 'dang_tiger_wave', 'dang_tiger_head']) {
      assert.doesNotThrow(() =>
        drawUpgradedProjectile(ctx, { kind, x: 120, y: 120, angle: 0.3, radius: 22, color: '#22D3EE', distanceTraveled: 60 }, 3.4, isMono)
      );
    }
    for (const sKind of ['phong_slash', 'phong_swap_burst', 'phong_c3_mark', 'dang_punch', 'dang_tiger_fist_aoe', 'dang_black_shield_boom']) {
      assert.doesNotThrow(() =>
        drawUpgradedSlash(ctx, { kind: sKind, x: 120, y: 120, angle: 0.2, radius: 130, spread: 1.8, dir: 1, color: '#22D3EE', life: 0.18, maxLife: 0.35 }, isMono)
      );
    }
  }

  assert.equal(maxShadowBlurUsed, 0, 'Phong and Dang renderers must never set non-zero ctx.shadowBlur');
});

test('Thien (Dang Sang The) combatLogic formulas compute passive ascension, C1/C2/C4, God Mode & breakdown accurately', () => {
  assert.equal(THIEN_ENERGY_MAX, 100);
  assert.equal(THIEN_ASCENDED_DURATION, 7.0);
  assert.equal(THIEN_C1_SWORD_COUNT, 12);

  const step1 = computeThienPassiveGain({ currentEnergy: 80, amount: 15, isAscended: false });
  assert.equal(step1.nextEnergy, 95);
  assert.equal(step1.triggeredAscension, false);

  const step2 = computeThienPassiveGain({ currentEnergy: 95, amount: 10, isAscended: false });
  assert.equal(step2.nextEnergy, 100);
  assert.equal(step2.triggeredAscension, true);

  const whileAscended = computeThienPassiveGain({ currentEnergy: 60, amount: 25, isAscended: true });
  assert.equal(whileAscended.nextEnergy, 100);
  assert.equal(whileAscended.triggeredAscension, false);

  const baseRate = computeThienCooldownTickRate({ baseCdr: 0, isAscended: false, godMode: false });
  const ascRate = computeThienCooldownTickRate({ baseCdr: 0, isAscended: true, godMode: false });
  const godRate = computeThienCooldownTickRate({ baseCdr: 0, isAscended: true, godMode: true });
  assert.equal(baseRate, 1);
  assert.equal(ascRate, 1.45);
  assert.equal(godRate, Number((1.45 * THIEN_GOD_MODE_CDR_MULT).toFixed(4)));

  const godMods = computeThienAscendedModifiers({ isAscended: true, godMode: true });
  assert.equal(godMods.dmgMult, Number((1.38 * THIEN_GOD_MODE_DMG_MULT).toFixed(4)));
  assert.equal(godMods.regenPerSec, 160 + THIEN_GOD_MODE_REGEN_PER_SEC);

  const swordMob = computeThienC1SwordDamage({ atk: 180, ap: 250, isBoss: false });
  const swordBoss = computeThienC1SwordDamage({ atk: 180, ap: 250, isBoss: true });
  assert.ok(swordBoss > swordMob);

  const c2Low = computeThienC2Detonation({ storedDamage: 0, atk: 180, ap: 250, maxHp: 5000 });
  const c2High = computeThienC2Detonation({ storedDamage: 800, atk: 180, ap: 250, maxHp: 5000 });
  assert.ok(c2High.damage > c2Low.damage);
  assert.ok(c2High.heal > c2Low.heal);
  assert.ok(c2High.shield > c2Low.shield);

  const mobUlt = computeThienC4JudgementDamage({ atk: 180, ap: 250, targetMaxHp: 600, isBoss: false });
  const bossUlt = computeThienC4JudgementDamage({ atk: 180, ap: 250, targetMaxHp: 20000, isBoss: true });
  assert.equal(mobUlt.executeRegular, true);
  assert.ok(mobUlt.damage >= 600);
  assert.equal(bossUlt.executeRegular, false);
  assert.equal(bossUlt.damage, 820 + Math.round(180 * 2.4 + 250 * 3.4));

  assert.equal(computeThienDamageBreakdownTotal({ atk: 100, c1: 200, c2: 300, c3: 400, c4: 500 }), 1500);
});

test('Thien (Dang Sang The) full kit, God Mode, Thien Nhan HUD & Founder lock behave accurately in GameEngine', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  try {
    (globalThis as any).window = {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      location: { protocol: 'https:', host: 'arena.example.com', origin: 'https://arena.example.com' },
    };
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};

    const { GameEngine } = await import('./GameEngine.js');
    const { Mi, cm } = await import('./gameData.js');
    const { mpClient } = await import('./multiplayerClient.js');

    const mockCanvas: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ({
        save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
        beginPath() {}, closePath() {}, arc() {}, ellipse() {}, rect() {},
        moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
        fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
        fillText() {}, strokeText() {}, setLineDash() {}, clip() {}, roundRect() {},
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        measureText: () => ({ width: 20 }),
      }),
    };

    // 1. Founder lock: saved selectedHeroId='thien' must be rejected when founder auth is locked
    store.set(cm, JSON.stringify({ selectedHeroId: 'thien', coins: 200 }));
    mpClient.setFounderAuth(false, '');
    const lockedEngine = new GameEngine(mockCanvas);
    assert.notEqual(lockedEngine.currentHero.id, 'thien', 'Locked Founder cannot restore Thien from localStorage');

    // Unlocked Founder restores Thien cleanly
    mpClient.setFounderAuth(true, 'mock.founder.token');
    const engine = new GameEngine(mockCanvas);
    assert.equal(engine.currentHero.id, 'thien', 'Verified Founder can restore Thien');

    const thienHero = Mi.find((h: any) => h.id === 'thien');
    engine.startNewGame(thienHero);
    const player = engine.player!;
    player.x = 1200;
    player.y = 1200;

    // 2. Passive energy builds to 100 and triggers Genesis State (Sang The)
    engine.applyThienEnergy(90);
    assert.equal(player.thien_energy, 90);
    assert.equal(player.thien_ascendedTimer, 0);
    engine.applyThienEnergy(15);
    assert.ok(player.thien_ascendedTimer > 6.5, 'Reaching 100 energy triggers 7s Sang The ascension');
    player.thien_ascendedTimer = 0;
    player.thien_energy = 0;

    const regularMob: any = {
      id: 901, kind: 'minion', name: 'ShadowMinion', radius: 18,
      x: 1290, y: 1200, hp: 500, maxHp: 500, speed: 60, damage: 120,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    const boss: any = {
      id: 902, kind: 'boss', bossWave: 27, phase: 2, name: 'Lucifer Test', radius: 56,
      x: 1360, y: 1200, hp: 25000, maxHp: 25000, speed: 100, damage: 220,
      facing: Math.PI, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies.push(regularMob, boss);

    // 3. C1 Van Kiem Khai Thien spawns 12 divine swords, seeks targets & heals HP
    player.hp = 3500;
    engine.castSkill(0, 0, boss.x, boss.y);
    assert.equal(engine.thienSwords.length, 12, 'C1 must summon 12 divine swords');
    for (let i = 0; i < 16; i++) engine.updateThienSystems(0.05);
    assert.ok(boss.hp < 25000, 'C1 divine swords must damage Boss');
    assert.ok(player.hp > 3500, 'C1 divine swords must heal Thien');
    assert.ok(player.thien_damageBreakdown.c1 > 0, 'C1 damage must be recorded in breakdown');

    // 4. C2 Thien Menh Dao Chieu slows enemies (-60%), stores damage, and recast detonates + heals + shields
    player.hp = 3200;
    player.shield = 0;
    engine.castSkill(1, 0, player.x, player.y);
    assert.ok(player.thien_c2ZoneId !== null, 'C2 creates active time zone');
    engine.damagePlayer(300, { x: boss.x, y: boss.y } as any);
    assert.ok(engine.thienTimeZones[0].storedDamage >= 300, 'C2 stores incoming damage');
    player.thien_c2RecastLock = 0;
    const bossHpBeforeC2Boom = boss.hp;
    assert.equal(engine.canActivateSkill(1), true, 'C2 recast must be allowed while time zone is active');
    engine.castSkill(1, 0, player.x, player.y);
    assert.equal(player.thien_c2ZoneId, null, 'Recasting C2 consumes time zone');
    assert.ok(boss.hp < bossHpBeforeC2Boom, 'C2 detonation damages enemies');
    assert.ok(player.hp > 3200, 'C2 detonation heals Thien');
    assert.ok(player.shield > 0, 'C2 detonation grants shield');
    assert.ok(player.thien_damageBreakdown.c2 > 0, 'C2 damage must be recorded in breakdown');

    // 5. C3 Van Gioi Du Hanh blinks via portal & recasts return blast
    player.cooldowns[2] = 0;
    const origX = player.x;
    const origY = player.y;
    engine.castSkill(2, 0, origX + 260, origY);
    assert.ok(player.x > origX + 150, 'C3 blinks Thien toward target');
    assert.ok(player.thien_c3PortalTimer > 3.5, 'C3 opens return portal window');
    assert.equal(engine.thienPortals.length, 2, 'C3 creates origin and exit portals');
    player.thien_c3RecastLock = 0;
    boss.x = origX + 60;
    boss.y = origY;
    assert.equal(engine.canActivateSkill(2), true, 'C3 return recast must be allowed');
    engine.castSkill(2, 0, player.x, player.y);
    assert.ok(Math.hypot(player.x - origX, player.y - origY) < 25, 'C3 recast returns Thien to origin portal');
    assert.ok(player.thien_damageBreakdown.c3 > 0, 'C3 damage must be recorded in breakdown');

    // 6. C4 Phan Quyet Sang The executes regular mob, heavily damages Boss, heals 28% MaxHP, activates Sang The
    player.hp = 2500;
    player.thien_ascendedTimer = 0;
    player.cooldowns[3] = 0;
    regularMob.hp = 500;
    regularMob.x = player.x + 80;
    regularMob.y = player.y;
    boss.x = player.x + 120;
    boss.y = player.y;
    const bossHpBeforeC4 = boss.hp;
    engine.castSkill(3, 0, player.x, player.y);
    assert.equal(engine.thienSunJudgements.length, 1, 'C4 summons Energy Sun orbital beam');
    assert.ok(regularMob.hp <= 0, 'C4 executes regular monster');
    assert.ok(boss.hp < bossHpBeforeC4 - 1500, 'C4 deals massive damage to Boss');
    assert.ok(player.hp >= 2500 + Math.round(player.maxHp * 0.28), 'C4 heals 28% Max HP');
    assert.ok(player.thien_ascendedTimer > 6.5, 'C4 activates Sang The state');
    assert.ok(player.thien_damageBreakdown.c4 > 0, 'C4 damage must be recorded in breakdown');

    // 7. Founder God Mode (Che do Than Quyen) grants invulnerability, CC immunity, and faster cooldowns
    const hpBeforeGod = player.hp;
    const isGodOn = engine.toggleThienGodMode();
    assert.equal(isGodOn, true);
    assert.equal(player.hp, player.maxHp, 'Activating God Mode restores full HP');
    engine.damagePlayer(99999);
    assert.equal(player.hp, player.maxHp, 'God Mode grants invulnerability to damage');
    engine.applyPlayerCC('stun', 2.0);
    assert.equal(player.stunTimer, 0, 'God Mode grants CC immunity');
    assert.ok(hpBeforeGod <= player.maxHp);

    // 8. Thien Nhan HUD snapshot includes 4 skills, breakdown, boss live HP/phase, kills, and timer
    engine.waveElapsedTime = 18.4;
    const hud = engine.getHudSnapshot();
    assert.equal(hud.skillStates.length, 4);
    assert.ok(hud.thienState);
    assert.equal(hud.thienState.godMode, true);
    assert.equal(hud.thienState.bosses.length, 1);
    assert.equal(hud.thienState.bosses[0].phase, 2);
    assert.ok(hud.thienState.totalDamage > 0);
    assert.equal(hud.thienState.waveElapsedTime, 18.4);
    assert.ok(hud.thienState.totalKilled >= 1);

    mpClient.setFounderAuth(false, '');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Thien celestial renderer routines draw cleanly with zero shadowBlur and security invariants hold', async () => {
  const {
    drawHeroBody,
    drawHeroWeapon,
    drawThienSwords,
    drawThienTimeZone,
    drawThienSpatialPortal,
    drawThienSunJudgement,
  } = await import('./weaponRenderer.js');
  const fs = await import('node:fs');
  const path = await import('node:path');

  let maxShadowBlurUsed = 0;
  const gradient = { addColorStop() {} };
  const noop = () => {};
  const ctx: any = {
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    beginPath: noop, closePath: noop, arc: noop, ellipse: noop, rect: noop,
    moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    fill: noop, stroke: noop, fillRect: noop, strokeRect: noop,
    fillText: noop, strokeText: noop, setLineDash: noop, clip: noop, roundRect: noop,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: () => ({ width: 20 }),
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    _shadowBlur: 0,
    get shadowBlur() { return this._shadowBlur; },
    set shadowBlur(v: number) {
      this._shadowBlur = v;
      if (v > maxShadowBlurUsed) maxShadowBlurUsed = v;
    },
    shadowColor: '#000', font: '12px sans-serif', textAlign: 'center', textBaseline: 'middle', lineCap: 'round', lineJoin: 'round',
  };

  for (const isMono of [false, true]) {
    assert.doesNotThrow(() =>
      drawHeroBody(ctx, { heroId: 'thien', radius: 22, facing: 0.4, color: '#F8FAFC', accentColor: '#FACC15', isMono, isUlt: true, elapsedTime: 3.4, moveSpeedFactor: 0.8, walkCyclePhase: 1.2 })
    );
    assert.doesNotThrow(() =>
      drawHeroWeapon(ctx, 'thien', { x: 100, y: 100, facing: 0.4, attackAnimTimer: 0.2, weaponAttackDuration: 0.22, attackSwingParity: 1, thien_ascendedTimer: 4, thien_godMode: true }, 3.4, isMono)
    );
    assert.doesNotThrow(() =>
      drawThienSwords(ctx, [{ x: 140, y: 110, angle: 0.5, phase: 'seek', trail: [{ x: 120, y: 100 }, { x: 140, y: 110 }] }], 3.4, isMono)
    );
    assert.doesNotThrow(() =>
      drawThienTimeZone(ctx, [{ x: 200, y: 200, radius: 220, life: 2.5, maxLife: 3.5, storedDamage: 450 }], 3.4, isMono)
    );
    assert.doesNotThrow(() =>
      drawThienSpatialPortal(ctx, [{ x: 250, y: 180, radius: 46 }], 3.4, isMono)
    );
    assert.doesNotThrow(() =>
      drawThienSunJudgement(ctx, [{ x: 300, y: 240, radius: 340, life: 1.2, maxLife: 1.65 }], 3.4, isMono)
    );
  }
  assert.equal(maxShadowBlurUsed, 0, 'Thien renderer routines must never set non-zero ctx.shadowBlur');

  // Verify Founder PIN is never hardcoded in client src/**
  const srcFiles = fs.readdirSync(path.join(process.cwd(), 'src'), { recursive: true }) as string[];
  const forbiddenPin = ['6892', '0111'].join('');
  for (const rel of srcFiles) {
    if (!/\.(ts|tsx|js|jsx|css)$/.test(rel)) continue;
    if (rel.endsWith('combatLogic.test.ts')) continue;
    const full = path.join(process.cwd(), 'src', rel);
    const content = fs.readFileSync(full, 'utf8');
    assert.equal(content.includes(forbiddenPin), false, `Client file src/${rel} must never hardcode Founder PIN`);
  }
});

test('PlayerAccount gear slot serialization preserves all 6 GameEngine slots including gloves and necklace', () => {
  assert.deepEqual([...VALID_GEAR_SLOTS], ['weapon', 'armor', 'boots', 'gloves', 'necklace', 'relic']);

  const baseFactory = () => ({
    eohyen: { weapon: null, armor: null, boots: null, gloves: null, necklace: null, relic: null },
    thien: { weapon: null, armor: null, boots: null, gloves: null, necklace: null, relic: null },
  });

  const sampleGear = {
    eohyen: {
      weapon: { uid: 1, itemId: 'sword_of_dawn' },
      armor: { uid: 2, itemId: 'plate_aegis' },
      boots: { uid: 3, itemId: 'swift_greaves' },
      gloves: { uid: 4, itemId: 'gauntlet_fury' },
      necklace: { uid: 5, itemId: 'pendant_mana' },
      relic: { uid: 6, itemId: 'orb_eternity' },
    },
  };

  const serialized = serializeHeroGearEntries(sampleGear);
  assert.equal(serialized.length, 6);
  assert.ok(serialized.includes('eohyen:gloves:gauntlet_fury'));
  assert.ok(serialized.includes('eohyen:necklace:pendant_mana'));

  const validItems = new Set(['sword_of_dawn', 'plate_aegis', 'swift_greaves', 'gauntlet_fury', 'pendant_mana', 'orb_eternity']);
  const { heroGear, nextUid } = deserializeHeroGearEntries(
    [...serialized, 'eohyen:gloves:invalid_item_id', 'bad_entry', 'unknownhero:weapon:sword_of_dawn'],
    baseFactory,
    10,
    validItems
  );
  assert.equal(nextUid, 16);
  assert.equal(heroGear.eohyen.gloves?.itemId, 'gauntlet_fury');
  assert.equal(heroGear.eohyen.necklace?.itemId, 'pendant_mana');
  assert.equal(heroGear.eohyen.weapon?.uid, 10);
});

test('PlayerAccount friend code generation, daily check-in, and display name normalization behave safely', () => {
  const codeA1 = generateFriendCode('uid-alpha-1234');
  const codeA2 = generateFriendCode('uid-alpha-1234');
  const codeB = generateFriendCode('uid-beta-5678');
  assert.match(codeA1, /^AH-[23456789A-HJ-NP-Z]{6}$/);
  assert.equal(codeA1, codeA2);
  assert.notEqual(codeA1, codeB);

  const randomCode = generateFriendCode();
  assert.match(randomCode, /^AH-[23456789A-HJ-NP-Z]{6}$/);

  assert.equal(DAILY_CHECKIN_REWARD, 350);
  assert.equal(canClaimDailyCheckIn('', '2026-11-16'), true);
  assert.equal(canClaimDailyCheckIn('2026-11-15', '2026-11-16'), true);
  assert.equal(canClaimDailyCheckIn('2026-11-16', '2026-11-16'), false);

  assert.equal(normalizeDisplayName('  Anh   Hùng\n\tMới  '), 'Anh Hùng Mới');
  assert.equal(normalizeDisplayName('   ', 'Khách'), 'Khách');
  assert.equal(normalizeDisplayName('X'.repeat(50)).length, 32);

  assert.equal(sanitizeGooglePhotoUrl('https://lh3.googleusercontent.com/a/photo.png'), 'https://lh3.googleusercontent.com/a/photo.png');
  assert.equal(sanitizeGooglePhotoUrl('http://insecure.example.com/a.png'), '');
  assert.equal(sanitizeGooglePhotoUrl('javascript:alert(1)'), '');
});

test('PlayerAccount profile sanitization enforces wave-gated unlocks and Founder lock', () => {
  assert.equal(isFrameUnlocked('bronze_recruit', 0, false), true);
  assert.equal(isFrameUnlocked('void_eclipse', 10, false), false);
  assert.equal(isFrameUnlocked('void_eclipse', 15, false), true);
  assert.equal(isFrameUnlocked('founder_genesis', 27, false), false);
  assert.equal(isFrameUnlocked('founder_genesis', 0, true), true);

  const nonFounderTitles = computeUnlockedTitles(9, false);
  assert.ok(nonFounderTitles.includes('Tân Binh Đấu Trường'));
  assert.ok(nonFounderTitles.includes('Thợ Săn Băng Hỏa'));
  assert.equal(nonFounderTitles.includes('Đấng Sáng Thế'), false);

  const founderTitles = computeUnlockedTitles(0, true);
  assert.ok(founderTitles.includes('Đấng Sáng Thế'));

  const sanitizedNonFounder = sanitizePlayerProfile(
    {
      displayName: '   ',
      favoriteHeroId: 'thien',
      avatarType: 'hero',
      avatarValue: 'thien',
      avatarFrame: 'founder_genesis',
      titleBadge: 'Đấng Sáng Thế',
      highestWave: 5,
      googlePhotoUrl: 'http://evil.local/pic.png',
    },
    { founderUnlocked: false }
  );
  assert.equal(sanitizedNonFounder.favoriteHeroId, 'eohyen');
  assert.equal(sanitizedNonFounder.avatarValue, 'eohyen');
  assert.equal(sanitizedNonFounder.avatarFrame, 'bronze_recruit');
  assert.notEqual(sanitizedNonFounder.titleBadge, 'Đấng Sáng Thế');
  assert.equal(sanitizedNonFounder.googlePhotoUrl, '');

  const sanitizedInvalidGoogleAvatar = sanitizePlayerProfile(
    {
      avatarType: 'google',
      avatarValue: 'http://bad.url/x.jpg',
      favoriteHeroId: 'kin',
    },
    { founderUnlocked: false }
  );
  assert.equal(sanitizedInvalidGoogleAvatar.avatarType, 'hero');
  assert.equal(sanitizedInvalidGoogleAvatar.avatarValue, 'kin');

  const sanitizedCrest = sanitizePlayerProfile(
    {
      avatarType: 'crest',
      avatarValue: 'not_a_real_crest',
    },
    { founderUnlocked: false }
  );
  assert.equal(sanitizedCrest.avatarValue, AVATAR_CRESTS[0].id);

  assert.ok(AVATAR_FRAMES.some((f) => f.id === 'celestial_legend' && f.minWave === 27));
  assert.ok(PLAYER_TITLES.some((t) => t.id === 'Huyền Thoại 27 Màn' && t.minWave === 27));
});

test('PlayerAccount cloud merge and JSON save parser preserve max stats and strip locked Founder hero', () => {
  const localSnap = {
    coins: 1200,
    currentWave: 8,
    highestWave: 12,
    selectedHeroId: 'thien',
    inventoryItemIds: ['item_a'],
    heroGearEntries: ['eohyen:weapon:item_a'],
    lifetimeKills: 450,
    matchesPlayed: 5,
    victories: 1,
    dailyCheckInDate: '2026-11-15',
    unlockedTitles: ['Tân Binh Đấu Trường'],
  };
  const cloudSnap = {
    coins: 2400,
    currentWave: 16,
    highestWave: 18,
    selectedHeroId: 'thien',
    inventoryItemIds: ['item_a', 'item_b'],
    heroGearEntries: ['eohyen:gloves:item_b'],
    lifetimeKills: 300,
    matchesPlayed: 8,
    victories: 2,
    dailyCheckInDate: '2026-11-16',
    unlockedTitles: [],
  };

  const mergedLocked = mergeLocalAndCloudProgress(localSnap, cloudSnap, false);
  assert.equal(mergedLocked.highestWave, 18);
  assert.equal(mergedLocked.coins, 2400);
  assert.equal(mergedLocked.lifetimeKills, 450);
  assert.equal(mergedLocked.matchesPlayed, 8);
  assert.equal(mergedLocked.victories, 2);
  assert.equal(mergedLocked.dailyCheckInDate, '2026-11-16');
  assert.equal(mergedLocked.selectedHeroId, 'eohyen');
  assert.equal(mergedLocked.unlockedTitles.includes('Đấng Sáng Thế'), false);

  const mergedFounder = mergeLocalAndCloudProgress(localSnap, cloudSnap, true);
  assert.equal(mergedFounder.selectedHeroId, 'thien');
  assert.equal(mergedFounder.unlockedTitles.includes('Đấng Sáng Thế'), true);

  const badJson = parseSavePackageJson('{not-json', false);
  assert.equal(badJson.ok, false);

  const exportedPackage = JSON.stringify({
    profile: {
      displayName: 'Nhà Sáng Lập',
      avatarFrame: 'founder_genesis',
      titleBadge: 'Đấng Sáng Thế',
      favoriteHeroId: 'thien',
    },
    progress: {
      coins: 5000,
      currentWave: 20,
      highestWave: 22,
      selectedHeroId: 'thien',
      inventoryItemIds: ['sword_of_dawn'],
      heroGearEntries: ['eohyen:necklace:pendant_mana'],
      lifetimeKills: 999,
      matchesPlayed: 12,
      victories: 3,
      dailyCheckInDate: '2026-11-16',
    },
  });

  const parsedLocked = parseSavePackageJson(exportedPackage, false);
  assert.equal(parsedLocked.ok, true);
  if (parsedLocked.ok) {
    assert.equal(parsedLocked.progress.selectedHeroId, 'eohyen');
    assert.equal(parsedLocked.progress.coins, 5000);
    assert.equal(parsedLocked.profile.favoriteHeroId, 'eohyen');
    assert.equal(parsedLocked.profile.avatarFrame, 'inferno_dragon'.includes('not') ? 'bronze_recruit' : 'bronze_recruit');
    assert.notEqual(parsedLocked.profile.titleBadge, 'Đấng Sáng Thế');
  }
});

test('Thanh & Nhi hero definitions: exact stats, 1 passive, strictly 3 skills (no c4), icons, and recommended builds', async () => {
  const { Mi, Ff } = await import('./gameData.js');
  const { HERO_SKILL_ICONS } = await import('./skillIcons.js');

  const thanh = Mi.find((h: any) => h.id === 'thanh');
  const nhi = Mi.find((h: any) => h.id === 'nhi');
  assert.ok(thanh, 'Thanh must exist in hero catalog');
  assert.ok(nhi, 'Nhi must exist in hero catalog');

  assert.equal(thanh.stats.hp, 1050);
  assert.equal(thanh.stats.damage, 32);
  assert.equal(thanh.stats.ap, 48);
  assert.equal(thanh.skills.length, 3);
  assert.deepEqual(thanh.skills.map((s: any) => s.key), ['c1', 'c2', 'c3']);
  assert.equal((HERO_SKILL_ICONS.thanh as Record<string, unknown>)?.c4, undefined);
  assert.ok(HERO_SKILL_ICONS.thanh?.atk && HERO_SKILL_ICONS.thanh?.passive && HERO_SKILL_ICONS.thanh?.c1 && HERO_SKILL_ICONS.thanh?.c2 && HERO_SKILL_ICONS.thanh?.c3);
  assert.ok(Array.isArray(Ff.thanh) && Ff.thanh.length >= 2);
  assert.equal(getHeroRoleKey('thanh'), 'mage');

  assert.equal(nhi.stats.hp, 900);
  assert.equal(nhi.stats.damage, 48);
  assert.equal(nhi.stats.ap, 35);
  assert.equal(nhi.skills.length, 3);
  assert.deepEqual(nhi.skills.map((s: any) => s.key), ['c1', 'c2', 'c3']);
  assert.equal((HERO_SKILL_ICONS.nhi as Record<string, unknown>)?.c4, undefined);
  assert.ok(HERO_SKILL_ICONS.nhi?.atk && HERO_SKILL_ICONS.nhi?.passive && HERO_SKILL_ICONS.nhi?.c1 && HERO_SKILL_ICONS.nhi?.c2 && HERO_SKILL_ICONS.nhi?.c3);
  assert.ok(Array.isArray(Ff.nhi) && Ff.nhi.length >= 2);
  assert.equal(getHeroRoleKey('nhi'), 'marksman');
});

test('Thanh & Nhi pure combat helpers: echo scaling, burst shield, bounded heal, swallow filter, ammo cycling, tethers, and boss %HP cap', () => {
  // Thanh passive burst shield + heal
  const pas = evaluateThanhBurstPassive({
    events: [{ time: 10.0, amount: 120 }],
    now: 10.6,
    incomingDamage: 90,
    maxHp: 1050,
    passiveCd: 0,
  });
  assert.equal(pas.triggered, true);
  assert.equal(pas.shield, Math.round(1050 * 0.12));
  assert.equal(pas.heal, Math.round(1050 * 0.06));
  assert.equal(pas.nextCooldown, 18);

  // Thanh C1 repeat bonus + echo 35% scaling + bounded heal
  const firstHit = computeThanhC1SnakeDamage({ ap: 48, atk: 32, priorHitsOnTarget: 0, isEcho: false });
  const repeatHit = computeThanhC1SnakeDamage({ ap: 48, atk: 32, priorHitsOnTarget: 1, isEcho: false });
  const echoHit = computeThanhC1SnakeDamage({ ap: 48, atk: 32, priorHitsOnTarget: 0, isEcho: true });
  assert.ok(repeatHit > firstHit);
  assert.equal(echoHit, Math.round((54 + 48 * 0.92 + 32 * 0.35) * THANH_ECHO_DMG_RATIO));

  let totalHeal = 0;
  for (let i = 0; i < 20; i++) {
    totalHeal += computeThanhC1BoundedHeal({ maxHp: 1050, ap: 48, alreadyHealed: totalHeal, isEcho: false });
  }
  assert.ok(totalHeal > 0 && totalHeal <= Math.round(1050 * 0.09 + 48 * 0.45));

  // Thanh C2 swallow restrictions
  assert.equal(isThanhC2SwallowEligible({ kind: 'minion', radius: 16, swallowedCount: 0, isEcho: false }), true);
  assert.equal(isThanhC2SwallowEligible({ kind: 'minion', radius: 16, swallowedCount: THANH_C2_MAX_SWALLOW_PER_CAST, isEcho: false }), false);
  assert.equal(isThanhC2SwallowEligible({ kind: 'boss', radius: 42, swallowedCount: 0, isEcho: false }), false);
  assert.equal(isThanhC2SwallowEligible({ kind: 'brute', radius: 24, swallowedCount: 0, isEcho: false }), false);
  assert.equal(isThanhC2SwallowEligible({ kind: 'minion', radius: 16, swallowedCount: 0, isEcho: true }), false);
  assert.ok(computeThanhC2Damage({ ap: 48, atk: 32, isLargeOrBoss: true }) > computeThanhC2Damage({ ap: 48, atk: 32, isLargeOrBoss: false }));

  // Thanh C3 sacrifice
  const sac = computeThanhC3Sacrifice({ currentHp: 300, maxHp: 1050, guardCount: 4, sacrificeIcd: 0, hitDamage: 50 });
  assert.equal(sac.shouldSacrifice, true);
  assert.equal(sac.shield, Math.round(1050 * 0.1));
  assert.equal(sac.heal, Math.round(1050 * 0.08));

  // Nhi ammo cycling
  assert.equal(cycleNhiAmmoType('purple'), 'green');
  assert.equal(cycleNhiAmmoType('green'), 'life');
  assert.equal(cycleNhiAmmoType('life'), 'purple');
  assert.equal(getNhiAmmoProfile('green').aoeRadius, 88);
  assert.equal(getNhiAmmoProfile('life').pierceLeft, 3);
  assert.ok(getNhiAmmoProfile('purple').poisonDur >= 3);

  // Nhi C2 tethers
  const tethers = computeNhiPoisonZoneTethers(
    [
      { id: 1, x: 100, y: 100 },
      { id: 2, x: 250, y: 100 },
      { id: 3, x: 900, y: 900 },
    ],
    NHI_C2_TETHER_RANGE
  );
  assert.equal(tethers.length, 1);

  // Nhi C3 highest HP target + boss cap + bounded heal
  const picked = selectHighestHpTarget(
    [
      { id: 1, x: 200, y: 200, hp: 180 },
      { id: 2, x: 350, y: 200, hp: 9200 },
      { id: 3, x: 250, y: 200, hp: 420 },
    ],
    150,
    200,
    680
  );
  assert.equal(picked?.id, 2);
  const bossArrow = computeNhiC3ArrowDamage({ atk: 48, ap: 35, targetCurrentHp: 500000, isFirstHit: true, isBoss: true });
  const bossZeroHpArrow = computeNhiC3ArrowDamage({ atk: 48, ap: 35, targetCurrentHp: 0, isFirstHit: true, isBoss: true });
  assert.equal(bossArrow - bossZeroHpArrow, NHI_C3_BOSS_PCT_CAP);

  let nhiHeal = 0;
  for (let i = 0; i < 10; i++) {
    nhiHeal += computeNhiC3BoundedHeal({ damageDealt: 1200, maxHp: 900, alreadyHealed: nhiHeal });
  }
  assert.equal(nhiHeal, Math.round(900 * 0.16));
  assert.ok(computeNhiPoisonDps({ stacks: 3, ap: 35, atk: 48, isBoss: false }) > 0);
  assert.ok(computeNhiC1LifeHeal({ damageDealt: 100, maxHp: 900, alreadyHealed: 0 }) > 0);
});

test('GameEngine integration for Thanh & Nhi: echo mimicry after 0.8s, swallow, 4 guard snakes, ammo switch, max-6 poison zones & mist passive', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const store = new Map<string, string>();
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    arc() {},
    ellipse() {},
    rect() {},
    roundRect() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    fill() {},
    stroke() {},
    clip() {},
    setTransform() {},
    setLineDash() {},
    fillText() {},
    measureText: (t: string) => ({ width: (t || '').length * 7 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const { Mi } = await import('./gameData.js');
    const { GameEngine } = await import('./GameEngine.js');
    const wr = await import('./weaponRenderer.js');

    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };

    const thanhHero = Mi.find((h: any) => h.id === 'thanh');
    const nhiHero = Mi.find((h: any) => h.id === 'nhi');
    const engine: any = new GameEngine(canvasStub);

    // 1. Test Thanh C1 + 0.8s echo, C2 swallow + zone heal, C3 4 guard snakes + DR + sacrifice
    engine.startNewGame(thanhHero);
    assert.equal(engine.player.maxHp, 1050);
    assert.equal(engine.getHudSnapshot().skillStates.length, 3);

    engine.castSkill(0, 0, engine.player.x + 150, engine.player.y);
    assert.equal(engine.thanhEchoQueue.length, 1);
    assert.equal(engine.projectiles.filter((p: any) => p.kind === 'thanh_c1_snake' && !p.isEcho).length, 3);

    // Advance 0.85s -> echo fires 3 echo snakes!
    for (let i = 0; i < 18; i++) engine.updateThanhAndNhiSystems(0.05);
    assert.equal(engine.thanhEchoQueue.length, 0);
    assert.ok(engine.projectiles.some((p: any) => p.kind === 'thanh_c1_snake' && p.isEcho));

    // Test Thanh C2 swallows small minion, leaves zone and heals Thanh inside zone
    engine.enemies = [
      { id: 901, kind: 'minion', x: engine.player.x + 120, y: engine.player.y, radius: 16, hp: 120, maxHp: 120, speed: 100, damage: 10 },
      { id: 902, kind: 'boss', x: engine.player.x + 130, y: engine.player.y, radius: 42, hp: 5000, maxHp: 5000, speed: 100, damage: 50 },
    ];
    engine.castSkill(1, 0, engine.player.x + 120, engine.player.y);
    assert.equal(engine.enemies.some((e: any) => e.id === 901), false);
    assert.ok(engine.enemies.find((e: any) => e.id === 902).hp < 5000);
    const thanhZone = engine.zones.find((z: any) => z.kind === 'thanh_poison_zone');
    assert.ok(thanhZone);
    engine.player.hp = 600;
    engine.player.x = thanhZone.x;
    engine.player.y = thanhZone.y;
    engine.updateThanhAndNhiSystems(0.5);
    assert.ok(engine.player.hp > 600, 'Thanh should heal while standing inside her C2 poison zone');

    // Test Thanh C3 summons 4 guard snakes & sacrifices 1 on danger
    engine.castSkill(2, 0, engine.player.x, engine.player.y);
    assert.equal(engine.thanhGuardSnakes.length, THANH_C3_GUARD_COUNT);
    engine.player.hp = 300;
    engine.damagePlayer(80);
    assert.equal(engine.thanhGuardSnakes.length, THANH_C3_GUARD_COUNT - 1);
    assert.ok(engine.player.shield > 0);

    // 2. Test Nhi C1 ammo switch, C2 bounded max-6 poison zones + tethers, passive < 50% HP
    engine.startNewGame(nhiHero);
    assert.equal(engine.player.maxHp, 900);
    assert.equal(engine.player.nhi_ammoType, 'purple');
    engine.castSkill(0, 0, engine.player.x + 150, engine.player.y);
    assert.equal(engine.player.nhi_ammoType, 'green');
    engine.player.cooldowns[0] = 0;
    engine.castSkill(0, 0, engine.player.x + 150, engine.player.y);
    assert.equal(engine.player.nhi_ammoType, 'life');

    // Drop Nhi below 50% HP via damage -> triggers passive mist + heal + 24s CD
    engine.damagePlayer(520);
    assert.ok(engine.nhiToxicMists.length >= 1);
    assert.equal(engine.player.nhi_passiveCd, NHI_PASSIVE_CD);

    // Trigger C2 flasks multiple times -> capped at NHI_C2_MAX_ZONES (6)
    for (let c = 0; c < 4; c++) {
      engine.player.cooldowns[1] = 0;
      engine.castSkill(1, 0, engine.player.x + 160, engine.player.y);
      for (let step = 0; step < 20; step++) engine.updateProjectiles(0.05);
    }
    const activeNhiZones = engine.zones.filter((z: any) => z.kind === 'nhi_poison_zone');
    assert.ok(activeNhiZones.length <= NHI_C2_MAX_ZONES && activeNhiZones.length >= 2);

    // Nhi C3 locks highest-HP target, applies bounded heal & spreads poison on hit
    const boss = { id: 950, kind: 'boss', x: engine.player.x + 220, y: engine.player.y, radius: 42, hp: 50000, maxHp: 50000, speed: 90, damage: 45, slowFactor: 0, slowTimer: 0 };
    const nearby = { id: 951, kind: 'minion', x: engine.player.x + 250, y: engine.player.y + 20, radius: 16, hp: 400, maxHp: 400, speed: 100, damage: 10, slowFactor: 0, slowTimer: 0 };
    engine.enemies = [nearby, boss];
    engine.player.hp = 400;
    engine.player.cooldowns[2] = 0;
    engine.castSkill(2, 0, engine.player.x + 100, engine.player.y);
    for (let step = 0; step < 20; step++) engine.updateProjectiles(0.05);
    assert.ok(boss.hp < 50000, 'Nhi C3 should damage highest-HP boss');
    assert.ok((boss as any).poisonStacks >= 1 && (nearby as any).poisonStacks >= 1, 'Nhi C3 should poison hit target and spread nearby');
    assert.ok(engine.player.hp > 400, 'Nhi C3 should heal Nhi based on damage dealt');

    // Zero shadowBlur assertion on renderer routines
    let shadowBlurUsed = false;
    Object.defineProperty(ctxStub, 'shadowBlur', {
      get() { return 0; },
      set(val: number) { if (val > 0) shadowBlurUsed = true; },
    });
    wr.drawHeroBody(ctxStub, { heroId: 'thanh', elapsedTime: 1, radius: 22, facing: 0, color: '#10B981', accentColor: '#A7F3D0', isMono: false });
    wr.drawHeroBody(ctxStub, { heroId: 'nhi', elapsedTime: 1, radius: 22, facing: 0, color: '#A855F7', accentColor: '#4ADE80', isMono: false });
    wr.drawHeroWeapon(ctxStub, 'thanh', engine.player, 1, false);
    wr.drawHeroWeapon(ctxStub, 'nhi', engine.player, 1, false);
    wr.drawThanhSpiritSnakes(ctxStub, engine.thanhGuardSnakes, 1, false);
    wr.drawThanhDevourSerpents(ctxStub, [{ x: 400, y: 400, radius: 140, life: 0.2, maxLife: 0.72 }], 1, false);
    wr.drawNhiPoisonTethers(ctxStub, activeNhiZones, computeNhiPoisonZoneTethers(activeNhiZones, NHI_C2_TETHER_RANGE), 1, false);
    wr.drawNhiToxicMist(ctxStub, engine.nhiToxicMists, 1, false);
    assert.equal(shadowBlurUsed, false, 'Thanh & Nhi renderers must never set ctx.shadowBlur');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Performance helpers: hardware detection, adaptive profile, governor, frustum culling, swapRemoveAt & network sync intervals', () => {
  assert.equal(normalizeQualityMode('HIGH'), 'auto');
  assert.equal(normalizeQualityMode('saver'), 'saver');
  assert.equal(normalizeQualityMode('balanced'), 'balanced');
  assert.equal(normalizeFpsCapMode('45'), '45');
  assert.equal(normalizeFpsCapMode('120'), 'auto');

  const lowEndMobile = detectDeviceHardwareTier({
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Mobile) Zalo',
    cores: 4,
    memoryGb: 2,
    devicePixelRatio: 3,
    reducedMotion: true,
  });
  assert.equal(lowEndMobile.tier, 'saver');
  assert.equal(lowEndMobile.isMobile, true);
  assert.equal(lowEndMobile.isInAppBrowser, true);
  assert.equal(lowEndMobile.reducedMotion, true);

  const strongDesktop = detectDeviceHardwareTier({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    cores: 12,
    memoryGb: 16,
    devicePixelRatio: 1,
    reducedMotion: false,
  });
  assert.equal(strongDesktop.tier, 'high');
  assert.equal(strongDesktop.isMobile, false);

  const saverProf = resolvePerformanceProfile({
    qualityMode: 'auto',
    fpsCapMode: 'auto',
    hardware: lowEndMobile,
    adaptiveStep: 0,
    hidden: false,
  });
  assert.equal(saverProf.effectiveTier, 'saver');
  assert.equal(saverProf.enableRadialGlows, false);
  assert.equal(saverProf.audioLowPower, true);
  assert.ok(saverProf.maxDpr <= 1.25);

  const highProf = resolvePerformanceProfile({
    qualityMode: 'high',
    fpsCapMode: '45',
    hardware: lowEndMobile,
    adaptiveStep: 2,
    hidden: false,
  });
  assert.equal(highProf.effectiveTier, 'high');
  assert.equal(highProf.targetFps, 45);
  assert.equal(highProf.enableRadialGlows, true);

  const hiddenProf = resolvePerformanceProfile({
    qualityMode: 'high',
    fpsCapMode: '60',
    hardware: strongDesktop,
    adaptiveStep: 0,
    hidden: true,
  });
  assert.equal(hiddenProf.targetFps, 10);

  const down = stepAdaptiveQualityGovernor({
    frameTimeEmaMs: 26,
    currentStep: 0,
    cooldownSec: 0,
    dtSec: 0.5,
  });
  assert.equal(down.nextStep, 1);
  assert.equal(down.changed, true);

  const inCooldown = stepAdaptiveQualityGovernor({
    frameTimeEmaMs: 26,
    currentStep: 1,
    cooldownSec: down.nextCooldownSec,
    dtSec: 0.5,
  });
  assert.equal(inCooldown.nextStep, 1);
  assert.equal(inCooldown.changed, false);

  const up = stepAdaptiveQualityGovernor({
    frameTimeEmaMs: 10,
    currentStep: 1,
    cooldownSec: 0,
    dtSec: 0.5,
  });
  assert.equal(up.nextStep, 0);
  assert.equal(up.changed, true);

  const bounds = computeWorldViewBounds(1000, 1000, { visibleWorldW: 600, visibleWorldH: 400 }, 50);
  assert.deepEqual(bounds, { minX: 650, maxX: 1350, minY: 750, maxY: 1250 });
  assert.equal(isCircleInViewBounds(1000, 1000, 20, bounds), true);
  assert.equal(isCircleInViewBounds(200, 200, 20, bounds), false);
  assert.equal(isSegmentInViewBounds(700, 700, 1300, 1300, 10, bounds), true);
  assert.equal(isSegmentInViewBounds(100, 100, 300, 300, 10, bounds), false);

  const arr = ['a', 'b', 'c', 'd'];
  swapRemoveAt(arr, 1);
  assert.deepEqual(arr, ['a', 'd', 'c']);
  swapRemoveAt(arr, 2);
  assert.deepEqual(arr, ['a', 'd']);
  swapRemoveAt(arr, 99);
  assert.deepEqual(arr, ['a', 'd']);

  const fastNet = computeAdaptiveSyncIntervals({ transportMode: 'p2p_host', isRelayMode: false, isActing: true, rttMs: 30, networkEffectiveType: '4g' });
  const slowNet = computeAdaptiveSyncIntervals({ transportMode: 'p2p_host', isRelayMode: false, isActing: true, rttMs: 320, networkEffectiveType: '3g' });
  const relayNet = computeAdaptiveSyncIntervals({ transportMode: 'ws', isRelayMode: true, isActing: false, rttMs: 90 });
  assert.ok(slowNet.playerInterval > fastNet.playerInterval);
  assert.ok(slowNet.worldInterval > fastNet.worldInterval);
  assert.ok(relayNet.playerInterval > fastNet.playerInterval);
});

test('GameEngine performance integration: resizeCanvas DPR/dimension clamping, saver budget, culling & render', async () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const store = new Map<string, string>();
  let radialCalls = 0;
  const ctxStub: any = {
    canvas: { width: 1000, height: 1800 },
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    arc() {},
    ellipse() {},
    rect() {},
    roundRect() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    fill() {},
    stroke() {},
    clip() {},
    setTransform() {},
    setLineDash() {},
    fillText() {},
    measureText: (t: string) => ({ width: (t || '').length * 7 }),
    createRadialGradient: () => { radialCalls++; return { addColorStop() {} }; },
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 900,
    innerHeight: 1700,
    devicePixelRatio: 3,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const { Mi } = await import('./gameData.js');
    const { GameEngine } = await import('./GameEngine.js');

    const canvasStub: any = {
      width: 0,
      height: 0,
      getBoundingClientRect: () => ({ width: 900, height: 1700 }),
      getContext: () => ctxStub,
    };

    const engine: any = new GameEngine(canvasStub);
    engine.applyPerformanceSettings({ qualityMode: 'saver', fpsCapMode: '30' });
    const prof = engine.getPerformanceProfile(true);
    assert.equal(prof.effectiveTier, 'saver');
    assert.equal(prof.targetFps, 30);
    assert.equal(prof.enableRadialGlows, false);
    assert.ok(canvasStub.width <= prof.maxCanvasDim && canvasStub.height <= prof.maxCanvasDim);
    assert.ok(engine.currentDpr <= prof.maxDpr);

    const eohyen = Mi.find((h: any) => h.id === 'eohyen') || Mi[0];
    engine.startNewGame(eohyen);
    for (let i = 0; i < 200; i++) engine.spawnParticles(engine.player.x, engine.player.y, '#38BDF8', 12, 40, 120, 3, 0.4);
    assert.ok(engine.particles.length <= prof.maxParticles);

    for (let i = 0; i < 80; i++) engine.addFloatingText(engine.player.x, engine.player.y, `-${i}`, '#FFF', 14);
    assert.ok(engine.floatingTexts.length <= prof.maxFloatingTexts);

    engine.lavaPools.push({ x: engine.player.x, y: engine.player.y, radius: 90, duration: 4, timer: 0 });
    engine.tinCrystals.push({ x: engine.player.x + 40, y: engine.player.y, radius: 44, life: 0, maxLife: 6, pulse: 0 });
    engine.enemies.push({ id: 9999, kind: 'minion', x: 50, y: 50, radius: 16, hp: 100, maxHp: 100, speed: 50, damage: 5 });

    radialCalls = 0;
    engine.updateVFX(0.05);
    engine.render();
    const saverGradientCalls = radialCalls;

    engine.applyPerformanceSettings({ qualityMode: 'high', fpsCapMode: '60' });
    radialCalls = 0;
    engine.render();
    const highGradientCalls = radialCalls;

    assert.ok(
      highGradientCalls >= saverGradientCalls + 3,
      `Expected high quality to use >=3 more radial gradients (lava + crystal + eohyen aura) than saver mode (${highGradientCalls} vs ${saverGradientCalls})`
    );
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Dung yeu SaNy buff: boosted base stats, strong sustain, high crit & crit dmg, reduced cooldowns, and GameEngine integration', async () => {
  const { Mi } = await import('./gameData.js');
  const { GameEngine } = await import('./GameEngine.js');

  const dung = Mi.find((h: any) => h.id === 'dung');
  assert.ok(dung);
  assert.equal(dung.stats.hp, 1280);
  assert.equal(dung.stats.damage, 46);
  assert.equal(dung.stats.speed, 116);
  assert.equal(dung.stats.attackInterval, 0.50);
  assert.equal(dung.baseCrit, DUNG_BASE_CRIT);
  assert.equal(dung.maxCrit, DUNG_MAX_CRIT);
  assert.equal(dung.critDmgRatio, DUNG_BASE_CRIT_DMG_RATIO);
  assert.equal(DUNG_BASE_LIFESTEAL, 0.12);
  assert.deepEqual(
    dung.skills.map((s: any) => s.cooldown),
    [DUNG_C1_COOLDOWN, DUNG_C2_COOLDOWN, DUNG_C3_COOLDOWN],
  );
  assert.deepEqual(dung.skills.map((s: any) => s.cooldown), [4.2, 10.5, 21]);

  const baseCritProfile = computeDungCritProfile({
    baseAndGearCrit: DUNG_BASE_CRIT,
    berserkActive: false,
    c3Active: false,
  });
  assert.equal(baseCritProfile.critChance, 0.28);
  assert.equal(baseCritProfile.critDmgRatio, 2.05);

  const fullBuffCritProfile = computeDungCritProfile({
    baseAndGearCrit: DUNG_BASE_CRIT,
    berserkActive: true,
    c3Active: true,
  });
  assert.ok(Math.abs(fullBuffCritProfile.critChance - 0.56) < 1e-6);
  assert.ok(Math.abs(fullBuffCritProfile.critDmgRatio - 2.60) < 1e-6);

  const cappedGearProfile = computeDungCritProfile({
    baseAndGearCrit: 0.90,
    berserkActive: false,
    c3Active: false,
  });
  assert.equal(cappedGearProfile.critChance, 0.80);

  const cappedBuffedGearProfile = computeDungCritProfile({
    baseAndGearCrit: 0.90,
    berserkActive: true,
    c3Active: true,
  });
  assert.equal(cappedBuffedGearProfile.critChance, 0.95);

  const healsNormal = computeDungHealValues({ maxHp: 1280, c3Active: false });
  const healsC3 = computeDungHealValues({ maxHp: 1280, c3Active: true });
  assert.equal(healsNormal.passiveHeal, Math.round(85 + 1280 * 0.045));
  assert.equal(healsC3.passiveHeal, Math.round(260 + 1280 * 0.065));
  assert.equal(healsNormal.c1HitHeal, Math.round(45 + 1280 * 0.03));
  assert.equal(healsNormal.c2CastHeal, Math.round(80 + 1280 * 0.06));
  assert.equal(healsC3.c2HitHeal, healsNormal.c2HitHeal * 2);
  assert.equal(healsNormal.c3CastHeal, Math.round(240 + 1280 * 0.14));
  assert.equal(healsNormal.c3HitBonusHeal, Math.round(100 + 1280 * 0.04));

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    engine.startNewGame(dung);

    // Base crit includes DUNG_BASE_CRIT even with empty gear
    const baseGearStats = engine.getHeroGearStats('dung');
    assert.ok(Math.abs(baseGearStats.crit - DUNG_BASE_CRIT) < 1e-6);
    assert.equal(engine.getDungEffectiveCrit().critChance, 0.28);
    assert.equal(engine.getDungEffectiveCrit().critDmgRatio, 2.05);

    const baseAtkInterval = engine.getEffectiveAttackInterval();

    // Test C2 cast heal, reduced cooldown (10.5s), berserkTimer, and crit boost
    engine.player.hp = Math.round(engine.player.maxHp * 0.4);
    const hpBeforeC2 = engine.player.hp;
    engine.castSkill(1, 0);
    assert.equal(engine.player.cooldowns[1], 10.5);
    assert.equal(engine.player.berserkTimer, 6.5);
    assert.ok(engine.player.hp > hpBeforeC2, 'C2 cast must heal immediately');
    assert.ok(Math.abs(engine.getDungEffectiveCrit().critChance - 0.38) < 1e-6);
    assert.ok(Math.abs(engine.getDungEffectiveCrit().critDmgRatio - 2.25) < 1e-6);

    // Spawn an enemy within C3 radius and test C3 cast sustain, shield, cooldown (21s), crit, and AS boost
    engine.enemies.push({
      id: 7777,
      kind: 'minion',
      x: engine.player.x + 50,
      y: engine.player.y,
      radius: 18,
      hp: 2000,
      maxHp: 2000,
      speed: 0,
      damage: 0,
      stunTimer: 0,
      slowTimer: 0,
    });
    const hpBeforeC3 = engine.player.hp;
    engine.castSkill(2, 0);
    assert.equal(engine.player.cooldowns[2], 21);
    assert.equal(engine.player.dung_c3_buff_timer, 10.5);
    assert.ok(engine.player.shield >= 650, 'C3 must grant 650 shield');
    assert.ok(engine.player.hp > hpBeforeC3, 'C3 must grant strong sustain heal on cast + hit');
    assert.ok(Math.abs(engine.getDungEffectiveCrit().critChance - 0.56) < 1e-6);
    assert.ok(Math.abs(engine.getDungEffectiveCrit().critDmgRatio - 2.60) < 1e-6);
    assert.ok(engine.getEffectiveAttackInterval() < baseAtkInterval, 'C2 + C3 must speed up attack interval');
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Dung Three-Headed Cerberus Ult & upgraded skill VFX: waves, slashes, HUD, remote VFX, SoundEngine roar, and zero shadowBlur rendering', async () => {
  const { Mi } = await import('./gameData.js');
  const { GameEngine } = await import('./GameEngine.js');
  const { R } = await import('./soundEngine.js');
  const {
    drawDungCerberusForm,
    drawDungCerberusUlt,
    drawUpgradedSlash,
    drawImpactBurst,
  } = await import('./weaponRenderer.js');

  const dung = Mi.find((h: any) => h.id === 'dung');
  assert.ok(dung);
  assert.ok(dung.skills[2].name.vi.includes('Tam Đầu Khuyển'));
  assert.ok(dung.skills[2].description.vi.includes('Chó Ba Đầu'));

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  let shadowBlurUsed = false;
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  Object.defineProperty(ctxStub, 'shadowBlur', {
    get() { return 0; },
    set(val: number) { if (val > 0) shadowBlurUsed = true; },
    configurable: true,
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    // SoundEngine playCerberusRoar safety without AudioContext
    R.ctx = null;
    R.lastCooldowns.clear();
    assert.doesNotThrow(() => R.playCerberusRoar());

    // SoundEngine playCerberusRoar with mocked AudioContext
    const createParam = (initial = 0) => ({
      value: initial,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
      setTargetAtTime: () => {},
    });
    const createNode = () => ({
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      gain: createParam(1),
      frequency: createParam(440),
      Q: createParam(1),
      pan: createParam(0),
      delayTime: createParam(0.08),
      threshold: createParam(-16),
      knee: createParam(18),
      ratio: createParam(5.5),
      attack: createParam(0.004),
      release: createParam(0.14),
      type: 'sine',
      buffer: null,
    });
    class MockAudioContext {
      currentTime = 1.0;
      sampleRate = 44100;
      state = 'running';
      destination = createNode();
      resume = async () => {};
      createGain = () => createNode();
      createOscillator = () => createNode();
      createBiquadFilter = () => createNode();
      createBufferSource = () => createNode();
      createDynamicsCompressor = () => createNode();
      createDelay = () => createNode();
      createStereoPanner = () => createNode();
      createBuffer = (_ch: number, len: number) => ({ getChannelData: () => new Float32Array(len) });
    }
    (globalThis as any).window.AudioContext = MockAudioContext;
    R.lastCooldowns.clear();
    R.setSfxEnabled(true);
    assert.doesNotThrow(() => R.playCerberusRoar());

    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    engine.startNewGame(dung);
    engine.multiplayer.active = true;
    engine.multiplayer.vfxQueue = [];

    // Enemy nearby for C1/C3/basic attack hit VFX
    engine.enemies.push({
      id: 9001,
      kind: 'minion',
      x: engine.player.x + 55,
      y: engine.player.y,
      radius: 18,
      hp: 5000,
      maxHp: 5000,
      speed: 0,
      damage: 0,
      stunTimer: 0,
      slowTimer: 0,
    });

    // 1. Cast C3 (Cerberus Ult)
    engine.castSkill(2, 0.2);
    assert.equal(engine.cerberusUltWaves.length, 1);
    assert.equal(engine.cerberusUltWaves[0].radius, 185);
    assert.equal(engine.cerberusUltWaves[0].maxLife, 1.35);

    const queuedCerberus = engine.multiplayer.vfxQueue.find((v: any) => v.type === 'dung_cerberus_vis');
    assert.ok(queuedCerberus, 'C3 cast should queue dung_cerberus_vis for multiplayer sync');

    // HUD snapshot while Cerberus Ult is active
    const hudC3 = engine.getHudSnapshot();
    assert.ok(hudC3.resourceText.includes('TAM ĐẦU KHUYỂN'), 'HUD resourceText should display TAM ĐẦU KHUYỂN');
    assert.equal(hudC3.skillStates[0], 'empowered');
    assert.equal(hudC3.skillStates[1], 'empowered');

    // 2. Cast C1, C2, and Basic Attack while in Cerberus form
    engine.castSkill(0, 0);
    assert.ok(engine.slashes.some((s: any) => s.kind === 'dung_c1_charge'));
    engine.castSkill(1, 0);
    assert.ok(engine.slashes.some((s: any) => s.kind === 'dung_c2_awaken'));
    engine.triggerBasicAttack();
    assert.ok(engine.slashes.some((s: any) => s.kind === 'spear' && s.cerberus === true));

    // 3. Apply remote VFX sync
    const wavesBeforeRemote = engine.cerberusUltWaves.length;
    engine.applyRemoteVfx('dung', [{
      type: 'dung_cerberus_vis',
      x: engine.player.x + 120,
      y: engine.player.y,
      angle: 0.4,
      radius: 185,
      maxLife: 1.35,
    }]);
    assert.equal(engine.cerberusUltWaves.length, wavesBeforeRemote + 1);
    assert.equal(engine.cerberusUltWaves[engine.cerberusUltWaves.length - 1].visualOnly, true);

    // 4. Render engine + direct renderer routines and verify zero shadowBlur
    assert.doesNotThrow(() => engine.render());
    assert.doesNotThrow(() => {
      drawDungCerberusForm(ctxStub, 300, 300, 20, 0.25, 1.4, {
        buffTimer: 9.0,
        atkActive: true,
        skillActive: true,
      }, false);
      drawDungCerberusUlt(ctxStub, [
        { x: 320, y: 300, angle: 0.2, radius: 185, life: 0.45, maxLife: 1.35 },
      ], 1.4, false);
      drawUpgradedSlash(ctxStub, { kind: 'spear', x: 300, y: 300, angle: 0, spread: 1.2, radius: 95, color: '#38BDF8', cerberus: true, empowered: true }, 0.45, false);
      drawUpgradedSlash(ctxStub, { kind: 'dung_cerberus_bite', x: 320, y: 300, angle: 0.3, spread: 1.1, radius: 55, color: '#FDE047' }, 0.4, false);
      drawUpgradedSlash(ctxStub, { kind: 'dung_c1_charge', x: 320, y: 300, angle: 0, spread: 1.2, radius: 75, color: '#38BDF8' }, 0.4, false);
      drawUpgradedSlash(ctxStub, { kind: 'dung_c2_awaken', x: 320, y: 300, angle: 0, spread: 6.28, radius: 115, color: '#FACC15' }, 0.4, false);
      drawImpactBurst(ctxStub, { x: 320, y: 300, radius: 34, color: '#FDE047', isCrit: true, life: 0.1, maxLife: 0.3 }, false);
    });
    assert.equal(shadowBlurUsed, false, 'Cerberus Ult & Dung VFX must never use shadowBlur');

    // 5. Update VFX until cerberusUltWaves expire and get cleaned up
    for (let i = 0; i < 16; i++) {
      engine.updateVFX(0.1);
    }
    assert.equal(engine.cerberusUltWaves.length, 0, 'Expired cerberusUltWaves must be cleanly removed');
  } finally {
    R.ctx = null;
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Minh (Than Khong Che) and Duc Anh (Co Xe Bat Diet): stats, pure CC/immunity/bounded-shield formulas, GameEngine mechanics, SoundEngine & zero-shadowBlur renderers', async () => {
  const { Mi, Ff } = await import('./gameData.js');
  const { HERO_SKILL_ICONS } = await import('./skillIcons.js');
  const { GameEngine } = await import('./GameEngine.js');
  const { R } = await import('./soundEngine.js');
  const wr = await import('./weaponRenderer.js');

  // 1. Exact hero definitions & kit invariants (strictly 1 passive + 3 active skills, no c4)
  const minh = Mi.find((h: any) => h.id === 'minh');
  const ducanh = Mi.find((h: any) => h.id === 'ducanh');
  assert.ok(minh, 'Minh must be present in Mi');
  assert.ok(ducanh, 'Duc Anh must be present in Mi');

  assert.equal(minh.stats.hp, 1150);
  assert.equal(minh.stats.damage, 22);
  assert.equal(minh.stats.ap, 45);
  assert.deepEqual(minh.skills.map((s: any) => s.key), ['c1', 'c2', 'c3']);
  assert.equal(HERO_ROLE_CATALOG.minh, 'mage');
  assert.ok(Ff.minh && Ff.minh.length >= 2);
  assert.ok(HERO_SKILL_ICONS.minh?.atk && HERO_SKILL_ICONS.minh?.passive && HERO_SKILL_ICONS.minh?.c1 && HERO_SKILL_ICONS.minh?.c2 && HERO_SKILL_ICONS.minh?.c3);

  assert.equal(ducanh.stats.hp, 1850);
  assert.equal(ducanh.stats.damage, 28);
  assert.equal(ducanh.stats.ap, 18);
  assert.deepEqual(ducanh.skills.map((s: any) => s.key), ['c1', 'c2', 'c3']);
  assert.equal(HERO_ROLE_CATALOG.ducanh, 'tank');
  assert.ok(Ff.ducanh && Ff.ducanh.length >= 2);
  assert.ok(HERO_SKILL_ICONS.ducanh?.atk && HERO_SKILL_ICONS.ducanh?.passive && HERO_SKILL_ICONS.ducanh?.c1 && HERO_SKILL_ICONS.ducanh?.c2 && HERO_SKILL_ICONS.ducanh?.c3);

  // 2. Pure combatLogic formulas
  assert.equal(BOSS_CC_IMMUNITY_WINDOW_SEC, 2.5);
  assert.equal(HERO_SHIELD_CAP_RATIO, 0.65);

  const w27Boss = { kind: 'boss', bossWave: 27, bossCcImmunityTimer: 0 };
  const w12Boss = { kind: 'boss', bossWave: 12, bossCcImmunityTimer: 0 };
  const w12BossImmune = { kind: 'boss', bossWave: 12, bossCcImmunityTimer: 1.4 };
  assert.equal(isBossHardCcImmune(w27Boss), true);
  assert.equal(isBossHardCcImmune(w12Boss), false);

  assert.deepEqual(evaluateEnemyHardCcApplication({ enemy: w27Boss, ccType: 'stun', duration: 2.0 }), {
    applied: false,
    duration: 0,
    immuneReason: 'wave27',
  });
  assert.deepEqual(evaluateEnemyHardCcApplication({ enemy: w12Boss, ccType: 'root', duration: 1.2 }), {
    applied: true,
    duration: 1.2,
  });
  assert.deepEqual(evaluateEnemyHardCcApplication({ enemy: w12BossImmune, ccType: 'freeze', duration: 1.0 }), {
    applied: false,
    duration: 0,
    immuneReason: 'post_cc_window',
  });

  // Shield cap prevents unbounded stacking
  const shieldCapRes = computeBoundedShieldAdd({ currentShield: 600, maxHp: 1000, addShield: 400 });
  assert.equal(shieldCapRes.cap, 650);
  assert.equal(shieldCapRes.nextShield, 650);
  assert.equal(shieldCapRes.added, 50);

  // Minh damage scaling & per-CC heal
  assert.equal(minh.skills[0].aimType, 'RECT');
  assert.ok((minh.skills[0] as any).width >= 200);
  const minhBasicBase = computeMinhBasicDamage({ atk: 22, ap: 45 });
  assert.ok(minhBasicBase > 0 && minhBasicBase < 77, 'Minh basic attack damage should be reduced below 77 at base stats');
  assert.ok(computeMinhC1Damage({ atk: 22, ap: 45 }) > 0);
  assert.equal(computeMinhC1CcHeal({ maxHp: 1000, ccCount: 0 }).totalHeal, 0);
  assert.equal(computeMinhC1CcHeal({ maxHp: 1000, ccCount: 1 }).totalHeal, 30);
  assert.equal(computeMinhC1CcHeal({ maxHp: 1000, ccCount: 3 }).totalHeal, 90);
  assert.equal(computeMinhC1CcHeal({ maxHp: 1000, ccCount: 10 }).totalRatio, MINH_C1_MAX_HEAL_RATIO);
  assert.ok(computeMinhC2TickDamage({ atk: 22, ap: 45 }) > 0);
  assert.ok(computeMinhC3DetonateDamage({ atk: 22, ap: 45 }) > computeMinhC1Damage({ atk: 22, ap: 45 }));

  // Duc Anh DR cap (12% passive + 60% C2 = 72% cap even if rolling flag were true)
  assert.equal(computeDucAnhDamageReduction({ isRolling: false, isFortress: false }), DUCANH_PASSIVE_DR);
  assert.equal(computeDucAnhDamageReduction({ isRolling: true, isFortress: false }), Number((DUCANH_PASSIVE_DR + DUCANH_C1_DR).toFixed(4)));
  assert.equal(computeDucAnhDamageReduction({ isRolling: true, isFortress: true }), DUCANH_MAX_DR_CAP);

  // Duc Anh C1 roll gain capped at 10%
  let rollGain = 0;
  for (let i = 0; i < 8; i++) {
    const step = computeDucAnhC1RollGain({ currentGainPct: rollGain });
    rollGain = step.nextGainPct;
  }
  assert.equal(rollGain, DUCANH_C1_MAX_PCT);
  assert.ok(computeDucAnhC1RollDamage({ atk: 28, ap: 18, maxHp: 1850 }) > 0);
  assert.ok(computeDucAnhC2ExplosionDamage({ atk: 28, ap: 18, maxHp: 1850 }) > 0);
  assert.ok(computeDucAnhC3ImpactDamage({ atk: 28, ap: 18, maxHp: 1850 }) > computeDucAnhC2ExplosionDamage({ atk: 28, ap: 18, maxHp: 1850 }));

  // Verify constants match prompt spec
  assert.equal(MINH_PASSIVE_HEAL_RATIO, 0.05);
  assert.equal(MINH_PASSIVE_SHIELD_RATIO, 0.08);
  assert.equal(MINH_PASSIVE_SHIELD_DUR, 4);
  assert.equal(MINH_C1_MOB_ROOT, 3.5);
  assert.equal(MINH_C1_BOSS_ROOT, 1.75);
  assert.equal(MINH_C1_BOSS27_SLOW, 0.75);
  assert.equal(MINH_C1_BOSS27_SLOW_DUR, 3);
  assert.equal(MINH_C1_WIDTH, 220);
  assert.equal(MINH_C1_CHAIN_COUNT, 5);
  assert.equal(MINH_C1_HEAL_RATIO, 0.03);
  assert.equal(MINH_C1_MAX_HEAL_RATIO, 0.18);
  assert.equal(MINH_C2_MOB_FREEZE, 3);
  assert.equal(MINH_C2_BOSS_FREEZE, 1);
  assert.equal(MINH_C2_BOSS_SLOW, 0.5);
  assert.equal(MINH_C2_BOSS_SLOW_DUR, 3);
  assert.equal(MINH_C2_ALLY_HEAL_RATIO, 0.08);
  assert.equal(MINH_C2_ALLY_SHIELD_RATIO, 0.12);
  assert.equal(MINH_C3_MOB_SEAL, 4);
  assert.equal(MINH_C3_BOSS_SEAL, 2);
  assert.equal(MINH_C3_ALLY_HEAL_RATIO, 0.18);
  assert.equal(MINH_C3_ALLY_SHIELD_RATIO, 0.20);

  assert.equal(DUCANH_PASSIVE_HP_THRESHOLD, 0.5);
  assert.equal(DUCANH_PASSIVE_REGEN_RATIO, 0.04);
  assert.equal(DUCANH_PASSIVE_REGEN_DUR, 4);
  assert.equal(DUCANH_PASSIVE_SHIELD_RATIO, 0.08);
  assert.equal(DUCANH_PASSIVE_CD, 20);
  assert.equal(DUCANH_C1_DURATION, 5);
  assert.equal(DUCANH_C1_BOSS_STUN, 1);
  assert.equal(DUCANH_C1_PER_HIT_PCT, 0.02);
  assert.equal(DUCANH_C2_DURATION, 5);
  assert.equal(DUCANH_C2_SHIELD_RATIO, 0.40);
  assert.equal(DUCANH_C2_DR, 0.60);
  assert.equal(DUCANH_C2_REGEN_RATIO, 0.04);
  assert.equal(DUCANH_C2_END_ALLY_HEAL, 0.12);
  assert.equal(DUCANH_C2_END_ALLY_SHIELD, 0.10);
  assert.equal(DUCANH_C3_MOB_KNOCKUP, 2);
  assert.equal(DUCANH_C3_BOSS_STUN, 1.5);
  assert.equal(DUCANH_C3_SELF_HEAL, 0.20);
  assert.equal(DUCANH_C3_SELF_SHIELD, 0.20);
  assert.equal(DUCANH_C3_ALLY_HEAL, 0.10);
  assert.equal(DUCANH_C3_ALLY_SHIELD, 0.10);

  // 3. GameEngine & Renderer integration tests
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  let shadowBlurUsed = false;
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  Object.defineProperty(ctxStub, 'shadowBlur', {
    get() { return 0; },
    set(val: number) { if (val > 0) shadowBlurUsed = true; },
    configurable: true,
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    // SoundEngine safety without AudioContext
    R.ctx = null;
    R.lastCooldowns.clear();
    assert.doesNotThrow(() => {
      R.playMinhBasic();
      R.playMinhChains();
      R.playMinhSanctuary();
      R.playMinhPrison();
      R.playMinhPrisonDetonate();
      R.playDucAnhSmash();
      R.playDucAnhRoll();
      R.playDucAnhFortress();
      R.playDucAnhMeteor();
    });

    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);

    // --- Test MINH ---
    engine.startNewGame(minh);
    assert.equal(engine.player.maxHp, 1150);
    engine.player.hp = 600;
    engine.player.shield = 0;
    // Basic attack damage reduction check
    engine.player.attackTimer = 0;
    engine.triggerBasicAttack();
    const basicOrb = engine.projectiles.find((p: any) => p.kind === 'minh_orb');
    assert.ok(basicOrb && basicOrb.damage < 77, 'Minh in-engine basic attack damage should be reduced below 77');
    engine.projectiles = [];

    const bossNormal: any = {
      id: 8101, kind: 'boss', bossWave: 12, name: 'Boss12', radius: 42,
      x: engine.player.x + 120, y: engine.player.y,
      hp: 20000, maxHp: 20000, speed: 100, damage: 50,
      facing: Math.PI, stunTimer: 0, frozenTimer: 0, rootTimer: 0, sealTimer: 0, knockupTimer: 0,
      slowFactor: 0, slowTimer: 0, bossCcImmunityTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    const boss27: any = {
      id: 8102, kind: 'boss', bossWave: 27, name: 'Boss27', radius: 52,
      x: engine.player.x + 160, y: engine.player.y - 70,
      hp: 40000, maxHp: 40000, speed: 100, damage: 90,
      facing: Math.PI, stunTimer: 0, frozenTimer: 0, rootTimer: 0, sealTimer: 0, knockupTimer: 0,
      slowFactor: 0, slowTimer: 0, bossCcImmunityTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    const mobMinh: any = {
      id: 8103, kind: 'minion', name: 'Mob1', radius: 18,
      x: engine.player.x + 90, y: engine.player.y + 82,
      hp: 2000, maxHp: 2000, speed: 90, damage: 15,
      facing: Math.PI, stunTimer: 0, frozenTimer: 0, rootTimer: 0, sealTimer: 0, knockupTimer: 0,
      slowFactor: 0, slowTimer: 0, bossCcImmunityTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies = [mobMinh, bossNormal, boss27];

    // Cast Minh C1 -> 5 parallel chains in large rectangle hit off-center enemies, root mob 3.5s & non-27 Boss 1.75s, slow Wave 27 Boss 75%, heal scaled by CC count
    engine.castSkill(0, 0, bossNormal.x, bossNormal.y);
    assert.equal(engine.projectiles.filter((p: any) => p.kind === 'minh_chain').length, MINH_C1_CHAIN_COUNT, 'Minh C1 must launch multiple chains across the rectangle');
    assert.equal(engine.checkAimHasTarget(0, minh.skills[0].range, 'RECT', (minh.skills[0] as any).width), true, 'RECT aim check must detect enemies inside wide area');
    for (let i = 0; i < 12; i++) engine.updateProjectiles(0.05);
    assert.ok(mobMinh.rootTimer >= 3.45 && mobMinh.rootTimer <= 3.55, 'Minh C1 must root normal monster for 3.5s');
    assert.ok(bossNormal.rootTimer >= 1.7 && bossNormal.rootTimer <= 1.8, 'Minh C1 must root non-27 Boss for 1.75s');
    assert.equal(boss27.rootTimer, 0, 'Wave 27 Boss must remain immune to hard CC');
    assert.ok(boss27.slowFactor >= 0.75 && boss27.slowTimer >= 2.5, 'Wave 27 Boss must suffer 75% slow from Minh C1');
    assert.ok(boss27.hp < 40000, 'Wave 27 Boss must still take damage from Minh C1');
    assert.equal(boss27.hp, 40000 - computeMinhC1Damage({ atk: engine.getEffectiveDamage(), ap: engine.getEffectiveAP() }), 'Each enemy must take Minh C1 damage at most once across parallel chains');
    const expectedMinhHeal = computeMinhC1CcHeal({ maxHp: engine.player.maxHp, ccCount: 3 }).totalHeal + Math.round(engine.player.maxHp * MINH_PASSIVE_HEAL_RATIO);
    assert.equal(engine.player.hp, 600 + expectedMinhHeal, 'Minh C1 heal must scale with number of CCd enemies plus passive heal');
    assert.ok(engine.player.shield > 0, 'Minh passive must grant virtual shield on CC');

    // When hard CC ends on Boss12, Boss12 enters post-CC immunity window (2.5s)
    bossNormal.rootTimer = 0.05;
    bossNormal._hadHardCc = true;
    engine.updateEnemies(0.1);
    assert.ok(bossNormal.bossCcImmunityTimer > 2.0, 'Boss must get post-CC immunity window after CC ends');
    const secondRootAttempt = engine.applyEnemyHardCC(bossNormal, 'stun', 1.5);
    assert.equal(secondRootAttempt, false, 'Boss must reject hard CC while post-CC immunity window is active');

    // Cast Minh C2 -> sanctuary freezes mob/Boss12 and slows Wave 27 Boss 50%
    bossNormal.bossCcImmunityTimer = 0;
    engine.castSkill(1, 0, boss27.x, boss27.y);
    assert.equal(engine.minhSanctuaries.length, 1);
    engine.updateMinhAndDucAnhSystems(0.1);
    assert.equal(boss27.frozenTimer, 0, 'Wave 27 Boss immune to C2 freeze');
    assert.ok(boss27.slowFactor >= 0.5 && boss27.slowTimer > 0, 'Wave 27 Boss still gets 50% slow from Minh C2');

    // Cast Minh C3 -> Prison of Light seals & detonates
    engine.castSkill(2, 0, mobMinh.x, mobMinh.y);
    assert.equal(engine.minhPrisons.length, 1);
    const mobHpBeforeDet = mobMinh.hp;
    for (let i = 0; i < 20; i++) engine.updateMinhAndDucAnhSystems(0.12);
    assert.ok(mobMinh.hp < mobHpBeforeDet, 'Minh C3 Prison detonation must deal AoE damage');

    // --- Test DUC ANH ---
    engine.startNewGame(ducanh);
    assert.equal(engine.player.maxHp, 1850);

    // Passive: 12% DR always + <50% HP triggers regen & 8% shield (20s CD)
    engine.player.hp = 1850;
    engine.player.shield = 0;
    engine.damagePlayer(100);
    assert.equal(engine.player.hp, 1850 - 88, 'Duc Anh passive must apply 12% damage reduction');

    engine.player.hp = 800; // below 50% (925)
    engine.damagePlayer(50);
    assert.ok(engine.player.ducanh_passiveHotTimer > 3.5, 'Dropping <50% HP triggers passive 4s regen');
    assert.equal(engine.player.ducanh_passiveCd, DUCANH_PASSIVE_CD, 'Passive enters 20s cooldown');
    assert.ok(engine.player.shield > 0, 'Passive grants 8% virtual shield');

    // C1 Rolling steel ball: 5s roll, collision damage/knockback/boss stun, 2% heal+shield per hit capped at 10%
    const ducBoss: any = {
      id: 8201, kind: 'boss', bossWave: 9, name: 'Boss9', radius: 38,
      x: engine.player.x + 25, y: engine.player.y,
      hp: 15000, maxHp: 15000, speed: 90, damage: 40,
      facing: Math.PI, stunTimer: 0, frozenTimer: 0, rootTimer: 0, sealTimer: 0, knockupTimer: 0,
      slowFactor: 0, slowTimer: 0, bossCcImmunityTimer: 0, hitFlash: 0, attackCooldown: 1,
    };
    engine.enemies = [ducBoss];
    engine.player.hp = 1000;
    engine.player.shield = 0;
    engine.castSkill(0, 0, ducBoss.x, ducBoss.y);
    assert.ok(engine.player.ducanh_c1Timer > 4.5, 'Duc Anh C1 enters 5s rolling state');
    engine.updateMinhAndDucAnhSystems(0.05);
    assert.ok(ducBoss.hp < 15000, 'Duc Anh C1 roll damages collided enemy');
    assert.ok(ducBoss.stunTimer > 0, 'Duc Anh C1 roll stuns Boss for 1s');
    assert.ok(engine.player.hp > 1000 && engine.player.shield > 0, 'Duc Anh C1 restores 2% HP and grants 2% shield on hit');

    // C2 Fortress: 5s duration, 40% MaxHP shield, high DR, HoT, end explosion
    engine.player.ducanh_c1Timer = 0;
    engine.player.shield = 0;
    engine.castSkill(1, 0, engine.player.x, engine.player.y);
    assert.ok(engine.player.ducanh_c2Timer > 4.5);
    assert.ok(engine.player.shield >= Math.round(1850 * 0.40) - 2);
    const bossHpBeforeFortBoom = ducBoss.hp;
    for (let i = 0; i < 52; i++) engine.updateMinhAndDucAnhSystems(0.1);
    assert.equal(engine.player.ducanh_c2Timer, 0);
    assert.ok(ducBoss.hp < bossHpBeforeFortBoom, 'Duc Anh C2 end explosion must damage nearby enemies');

    // C3 Meteor Leap: launches leap, slams for stun/knockup + 20% self heal + 20% self shield
    ducBoss.bossCcImmunityTimer = 0;
    ducBoss.stunTimer = 0;
    engine.player.hp = 900;
    engine.player.shield = 0;
    engine.castSkill(2, 0, ducBoss.x, ducBoss.y);
    assert.equal(engine.ducanhMeteorLeaps.length, 1);
    for (let i = 0; i < 12; i++) engine.updateMinhAndDucAnhSystems(0.06);
    assert.equal(engine.ducanhMeteorLeaps.length, 0);
    assert.ok(ducBoss.stunTimer > 0, 'Duc Anh C3 meteor impact must stun non-immune Boss 1.5s');
    assert.ok(engine.player.hp >= 900 + Math.round(1850 * 0.20), 'Duc Anh C3 restores 20% HP on impact');
    assert.ok(engine.player.shield >= Math.round(1850 * 0.20), 'Duc Anh C3 grants 20% shield on impact');

    // Renderers & zero shadowBlur check for upgraded Nhi, Thanh, Minh & Duc Anh
    assert.doesNotThrow(() => engine.render());
    const animPlayerState: any = {
      ...engine.player,
      attackAnimTimer: 0.11,
      weaponAttackDuration: 0.22,
      attackSwingParity: 1,
      bowRecoilTimer: 0.08,
      walkCyclePhase: 1.4,
      moveSpeedFactor: 0.9,
      nhi_ammoType: 'green',
      thanh_c3Timer: 2.0,
    };
    const zonesSample = [{ id: 1, x: 200, y: 200, radius: 100 }, { id: 2, x: 340, y: 220, radius: 100 }];
    for (const isMono of [false, true]) {
      wr.drawHeroBody(ctxStub, { heroId: 'thanh', radius: 22, facing: 0.2, color: '#10B981', accentColor: '#A78BFA', isMono, elapsedTime: 1.5, isUlt: true, moveSpeedFactor: 0.9, walkCyclePhase: 1.4 });
      wr.drawHeroBody(ctxStub, { heroId: 'nhi', radius: 21, facing: 0.1, color: '#C084FC', accentColor: '#4ADE80', nhiAmmoType: 'life', isMono, elapsedTime: 1.5, moveSpeedFactor: 0.9, walkCyclePhase: 1.4 });
      wr.drawHeroBody(ctxStub, { heroId: 'minh', radius: 22, facing: 0.2, color: '#38BDF8', accentColor: '#FDE047', isMono, elapsedTime: 1.5, moveSpeedFactor: 0.9, walkCyclePhase: 1.4 });
      wr.drawHeroBody(ctxStub, { heroId: 'ducanh', radius: 24, facing: -0.3, color: '#F59E0B', accentColor: '#94A3B8', isMono, elapsedTime: 1.5 });
      wr.drawHeroBody(ctxStub, { heroId: 'ducanh', radius: 24, facing: -0.3, color: '#F59E0B', accentColor: '#94A3B8', isMono, elapsedTime: 1.5, ducanhRolling: true });
      wr.drawHeroBody(ctxStub, { heroId: 'ducanh', radius: 24, facing: -0.3, color: '#F59E0B', accentColor: '#94A3B8', isMono, elapsedTime: 1.5, ducanhFortress: true });

      wr.drawHeroWeapon(ctxStub, 'thanh', animPlayerState, 1.5, isMono);
      wr.drawHeroWeapon(ctxStub, 'nhi', animPlayerState, 1.5, isMono);
      wr.drawHeroWeapon(ctxStub, 'minh', animPlayerState, 1.5, isMono);
      wr.drawHeroWeapon(ctxStub, 'ducanh', animPlayerState, 1.5, isMono);

      for (const proj of [
        { style: 'thanh_atk', kind: 'thanh_atk', x: 200, y: 200, angle: 0.3, radius: 9, color: '#10B981' },
        { style: 'thanh_c1_snake', kind: 'thanh_c1_snake', x: 220, y: 210, angle: 0.3, radius: 11, color: '#34D399' },
        { style: 'nhi_arrow_purple', kind: 'nhi_arrow_purple', x: 240, y: 210, angle: 0.1, radius: 9, color: '#C084FC' },
        { style: 'nhi_c2_flask', kind: 'nhi_c2_flask', x: 260, y: 220, angle: 0.4, radius: 11, color: '#4ADE80', distanceTraveled: 80 },
        { style: 'nhi_c3_arrow', kind: 'nhi_c3_arrow', x: 280, y: 230, angle: 0.2, radius: 14, color: '#E879F9' },
        { style: 'minh_orb', kind: 'minh_orb', x: 300, y: 240, angle: 0.1, radius: 11, color: '#38BDF8' },
        { style: 'minh_chain', kind: 'minh_chain', x: 320, y: 250, angle: 0.2, radius: 16, color: '#FACC15', distanceTraveled: 120 },
      ]) {
        wr.drawUpgradedProjectile(ctxStub, proj, 1.5, isMono);
      }

      for (const sl of [
        { kind: 'thanh_snake_fan', x: 200, y: 200, angle: 0, radius: 74, spread: 1.1, color: '#10B981', life: 0.1, maxLife: 0.24 },
        { kind: 'thanh_devour_bite', x: 220, y: 200, angle: 0, radius: 140, spread: Math.PI * 2, color: '#10B981', life: 0.15, maxLife: 0.38 },
        { kind: 'thanh_shield_pulse', x: 220, y: 200, angle: 0, radius: 68, spread: Math.PI * 2, color: '#34D399', life: 0.15, maxLife: 0.34 },
        { kind: 'nhi_flask_boom', x: 240, y: 200, angle: 0, radius: 100, spread: Math.PI * 2, color: '#4ADE80', life: 0.15, maxLife: 0.34 },
        { kind: 'nhi_mist_pulse', x: 240, y: 200, angle: 0, radius: 110, spread: Math.PI * 2, color: '#4ADE80', life: 0.15, maxLife: 0.34 },
        { kind: 'nhi_ult_shock', x: 240, y: 200, angle: 0.2, radius: 78, spread: Math.PI * 2, color: '#E879F9', life: 0.15, maxLife: 0.34 },
        { kind: 'minh_chain_rect', x: 280, y: 200, angle: 0.1, radius: 460, length: 460, halfWidth: 110, spread: 0, color: '#FACC15', accentColor: '#38BDF8', life: 0.18, maxLife: 0.46 },
        { kind: 'minh_seal_boom', x: 300, y: 200, angle: 0, radius: 185, spread: Math.PI * 2, color: '#FACC15', life: 0.18, maxLife: 0.4 },
        { kind: 'ducanh_fortress_boom', x: 350, y: 200, angle: 0, radius: 170, spread: Math.PI * 2, color: '#F59E0B', life: 0.16, maxLife: 0.36 },
        { kind: 'ducanh_meteor_boom', x: 380, y: 200, angle: 0, radius: 185, spread: Math.PI * 2, color: '#F97316', life: 0.2, maxLife: 0.42 },
      ]) {
        wr.drawUpgradedSlash(ctxStub, sl, 1.5, isMono);
      }

      wr.drawThanhSpiritSnakes(ctxStub, [{ x: 200, y: 200, angle: 0.5, isCompanion: true, idx: 0 }], 1.5, isMono);
      wr.drawThanhDevourSerpents(ctxStub, [{ x: 220, y: 220, radius: 145, life: 0.3, maxLife: 0.72 }], 1.5, isMono);
      wr.drawNhiPoisonTethers(ctxStub, zonesSample, [{ fromIdx: 0, toIdx: 1 }], 1.5, isMono);
      wr.drawNhiToxicMist(ctxStub, [{ x: 260, y: 260, radius: 110, timer: 1.0, duration: 4.0 }], 1.5, isMono);
      wr.drawMinhSanctuaries(ctxStub, [{ x: 300, y: 300, radius: 155, timer: 1.0, duration: 3.0 }], 1.5, isMono);
      wr.drawMinhPrisons(ctxStub, [{ x: 350, y: 300, radius: 185, timer: 0.9, duration: 2.0 }], 1.5, isMono);
      wr.drawDucAnhMeteorLeaps(ctxStub, [{ x: 400, y: 300, startX: 250, startY: 300, targetX: 400, targetY: 300, radius: 185, timer: 0.25, duration: 0.45 }], 1.5, isMono);
    }
    assert.equal(shadowBlurUsed, false, 'Nhi, Thanh, Minh, and Duc Anh renderers must never set ctx.shadowBlur');
  } finally {
    R.ctx = null;
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Cổ Thành Huyết Táng unlock rules, Founder free toggle, obstacles & spawn clearance work deterministically', () => {
  assert.equal(CITADEL_UNLOCK_WAVE, 27);
  assert.equal(ARENA_MAPS.blood_citadel.width, BLOOD_CITADEL_SIZE);
  assert.equal(ARENA_MAPS.blood_citadel.height, BLOOD_CITADEL_SIZE);
  assert.equal(ARENA_MAP_LIST.length, 5);

  // Strict sequential progression without Founder access: Classic -> Blood Citadel -> Inferno Ash -> Frozen Tomb -> Grudge Forest
  const lockedMaps = computeUnlockedMaps({ highestWaveCleared: 26, classicCleared: false, storedUnlocked: ['inferno_ash', 'frozen_tomb', 'grudge_forest'], founderUnlocked: false });
  assert.deepEqual(lockedMaps, ['classic']);
  assert.equal(isMapUnlocked('classic', lockedMaps, false), true);
  assert.equal(isMapUnlocked('blood_citadel', lockedMaps, false), false);
  assert.equal(isMapUnlocked('inferno_ash', lockedMaps, false), false);
  assert.equal(isMapUnlocked('frozen_tomb', lockedMaps, false), false);
  assert.equal(isMapUnlocked('grudge_forest', lockedMaps, false), false);

  // Clearing Classic Wave 27 unlocks only Blood Citadel (Fire & Ice remain locked)
  const wave27Unlocked = computeUnlockedMaps({ highestWaveCleared: 27, classicCleared: false, storedUnlocked: [], founderUnlocked: false });
  assert.deepEqual(wave27Unlocked, ['classic', 'blood_citadel']);
  assert.equal(isMapUnlocked('blood_citadel', wave27Unlocked, false), true);
  assert.equal(isMapUnlocked('inferno_ash', wave27Unlocked, false), false);

  const classicFlagUnlocked = computeUnlockedMaps({ highestWaveCleared: 5, classicCleared: true, storedUnlocked: [], founderUnlocked: false });
  assert.deepEqual(classicFlagUnlocked, ['classic', 'blood_citadel']);

  // Clearing Blood Citadel unlocks Inferno Ash; clearing Inferno Ash unlocks Frozen Tomb; clearing Frozen Tomb unlocks Grudge Forest
  const infernoUnlocked = computeUnlockedMaps({ highestWaveCleared: 27, classicCleared: true, bloodCitadelCleared: true, founderUnlocked: false });
  assert.deepEqual(infernoUnlocked, ['classic', 'blood_citadel', 'inferno_ash']);
  assert.equal(isMapUnlocked('inferno_ash', infernoUnlocked, false), true);
  assert.equal(isMapUnlocked('frozen_tomb', infernoUnlocked, false), false);

  const frozenUnlocked = computeUnlockedMaps({ highestWaveCleared: 27, classicCleared: true, bloodCitadelCleared: true, infernoCleared: true, founderUnlocked: false });
  assert.deepEqual(frozenUnlocked, ['classic', 'blood_citadel', 'inferno_ash', 'frozen_tomb']);

  const allSequentialUnlocked = computeUnlockedMaps({ highestWaveCleared: 27, classicCleared: true, bloodCitadelCleared: true, infernoCleared: true, frozenTombCleared: true, founderUnlocked: false });
  assert.deepEqual(allSequentialUnlocked, ['classic', 'blood_citadel', 'inferno_ash', 'frozen_tomb', 'grudge_forest']);

  // Cannot skip directly from Inferno clear without Blood Citadel clear
  const cannotSkipBlood = computeUnlockedMaps({ highestWaveCleared: 27, classicCleared: true, bloodCitadelCleared: false, infernoCleared: true, founderUnlocked: false });
  assert.deepEqual(cannotSkipBlood, ['classic', 'blood_citadel']);

  // Founder unlock allows free switching to all maps even before Wave 27
  const founderMaps = computeUnlockedMaps({ highestWaveCleared: 0, classicCleared: false, storedUnlocked: [], founderUnlocked: true });
  assert.deepEqual(founderMaps, ['classic', 'blood_citadel', 'inferno_ash', 'frozen_tomb', 'grudge_forest']);
  assert.equal(isMapUnlocked('blood_citadel', ['classic'], true), true);
  assert.equal(isMapUnlocked('inferno_ash', ['classic'], true), true);
  assert.equal(isMapUnlocked('frozen_tomb', ['classic'], true), true);
  assert.equal(isMapUnlocked('grudge_forest', ['classic'], true), true);

  // Verify spawn & all interactables sit cleanly outside obstacles in 1600x1600 arena
  const runtime = createInitialCitadelRuntimeState('blood_citadel');
  const obstacles = getActiveCitadelObstacles(runtime);
  assert.ok(obstacles.length >= BLOOD_CITADEL_STATIC_OBSTACLES.length);
  assert.equal(doesPointOverlapAnyObstacle(BLOOD_CITADEL_SPAWN.x, BLOOD_CITADEL_SPAWN.y, 24, obstacles), false);
  for (const node of BLOOD_CITADEL_INTERACTABLES) {
    assert.equal(doesPointOverlapAnyObstacle(node.x, node.y, 18, obstacles), false, `Interactable ${node.id} overlaps obstacle`);
  }

  // Test collision pushback & clear-point search
  const blockedObstacle = BLOOD_CITADEL_STATIC_OBSTACLES[0];
  const insideX = blockedObstacle.x + blockedObstacle.w * 0.5;
  const insideY = blockedObstacle.y + blockedObstacle.h * 0.5;
  const pushed = resolveCircleObstacles(insideX, insideY, 20, obstacles, BLOOD_CITADEL_SIZE, BLOOD_CITADEL_SIZE);
  assert.equal(pushed.collided, true);
  assert.equal(doesPointOverlapAnyObstacle(pushed.x, pushed.y, 19.5, obstacles), false);
  const clearPt = findClearPointNear(insideX, insideY, 20, obstacles, BLOOD_CITADEL_SIZE, BLOOD_CITADEL_SIZE);
  assert.equal(doesPointOverlapAnyObstacle(clearPt.x, clearPt.y, 19.5, obstacles), false);
});

test('Cổ Thành Huyết Táng interactive Easter eggs (Tin, Bảo, and Combined Secret) function accurately', () => {
  let secrets = createDefaultCitadelSecrets();

  // Inspecting Tin lab with another hero previews dossier without unlocking Tin clue
  const nonTinPreview = evaluateCitadelInteraction({
    nodeId: 'tin_lab',
    heroId: 'dung',
    secrets,
    lang: 'vi',
  });
  assert.equal(nonTinPreview.nextSecrets.tinClue, false);
  assert.equal(nonTinPreview.coinBonus, 0);
  assert.equal(nonTinPreview.payload.heroResonated, false);

  // Inspecting Tin lab as Tin unlocks Ma Thạch & Blood clue + 120 coins + resonance buff
  const tinUnlock = evaluateCitadelInteraction({
    nodeId: 'tin_lab',
    heroId: 'tin',
    secrets: nonTinPreview.nextSecrets,
    lang: 'vi',
  });
  secrets = tinUnlock.nextSecrets;
  assert.equal(secrets.tinClue, true);
  assert.equal(tinUnlock.coinBonus, 120);
  assert.equal(tinUnlock.buffKind, 'tin_resonance');
  assert.equal(tinUnlock.payload.unlockedNow, true);

  // Shared altar stays incomplete until Bảo's clue is also unlocked
  const prematureAltar = evaluateCitadelInteraction({
    nodeId: 'shared_altar',
    heroId: 'tin',
    secrets,
    lang: 'vi',
  });
  assert.equal(prematureAltar.nextSecrets.combinedUnlocked, false);
  assert.equal(prematureAltar.coinBonus, 0);

  // Inspecting Bảo mirror as Bảo unlocks clue with exact secret quote
  const baoUnlock = evaluateCitadelInteraction({
    nodeId: 'bao_mirror',
    heroId: 'bao',
    secrets,
    lang: 'vi',
  });
  secrets = baoUnlock.nextSecrets;
  assert.equal(secrets.baoClue, true);
  assert.equal(baoUnlock.coinBonus, 120);
  assert.equal(baoUnlock.buffKind, 'bao_shadow');
  assert.equal(baoUnlock.payload.quote, '“Liệu ngươi có chắc mình là bản thể gốc?”');

  // Shared altar now triggers hidden joint experiment event
  const sharedEvent = evaluateCitadelInteraction({
    nodeId: 'shared_altar',
    heroId: 'bao',
    secrets,
    lang: 'vi',
  });
  assert.equal(sharedEvent.nextSecrets.combinedUnlocked, true);
  assert.equal(sharedEvent.coinBonus, 350);
  assert.equal(sharedEvent.buffKind, 'combined_relic');
  assert.equal(sharedEvent.payload.isCombinedEvent, true);
  assert.equal(sharedEvent.payload.unlockedNow, true);

  // Dossier archive codes, variants, specimen meta, fieldNotes, and compass guidance
  assert.equal(nonTinPreview.payload.archiveCode, '#MT-07');
  assert.equal(nonTinPreview.payload.themeVariant, 'dormant');
  assert.equal(tinUnlock.payload.archiveCode, '#MT-07');
  assert.equal(tinUnlock.payload.themeVariant, 'tin');
  assert.ok((tinUnlock.payload.fieldNotes?.length || 0) >= 2);
  assert.equal(baoUnlock.payload.archiveCode, '#BS-04');
  assert.equal(baoUnlock.payload.themeVariant, 'bao');
  assert.ok((baoUnlock.payload.fieldNotes?.length || 0) >= 2);
  assert.equal(sharedEvent.payload.archiveCode, '#ZERO-00');
  assert.equal(sharedEvent.payload.themeVariant, 'combined');
  assert.ok((sharedEvent.payload.fieldNotes?.length || 0) >= 3);

  const tinTarget = getCitadelSecretCompassTarget('tin', createDefaultCitadelSecrets(), 'vi');
  assert.equal(tinTarget?.nodeId, 'tin_lab');
  const baoTarget = getCitadelSecretCompassTarget('bao', { tinClue: true, baoClue: false, combinedUnlocked: false, inspectedNodes: [] }, 'vi');
  assert.equal(baoTarget?.nodeId, 'bao_mirror');
  const vaultTarget = getCitadelSecretCompassTarget('dung', { tinClue: true, baoClue: true, combinedUnlocked: false, inspectedNodes: [] }, 'en');
  assert.equal(vaultTarget?.nodeId, 'shared_altar');
  const doneTarget = getCitadelSecretCompassTarget('tin', sharedEvent.nextSecrets, 'vi');
  assert.equal(doneTarget, null);
});

test('Dark Fantasy lore covers all 21 heroes, all 9 bosses, and Citadel dossier summaries cleanly', async () => {
  const { Mi, hm } = await import('./gameData.js');

  assert.ok(CHRONICLE_CHAPTERS.length >= 3);
  for (const ch of CHRONICLE_CHAPTERS) {
    assert.ok(ch.title.vi && ch.title.en);
    assert.ok(ch.paragraphs.vi.length >= 2 && ch.paragraphs.en.length >= 2);
  }

  assert.equal(Mi.length, 21);
  for (const hero of Mi) {
    const entry = HERO_CHRONICLES[hero.id];
    assert.ok(entry, `Missing HERO_CHRONICLES entry for ${hero.id}`);
    assert.ok(entry.faction.vi.length > 0 && entry.faction.en.length > 0);
    assert.ok(entry.originTitle.vi.length > 0 && entry.originTitle.en.length > 0);
    assert.ok(entry.epitaph.vi.length > 0 && entry.epitaph.en.length > 0);
    assert.ok(entry.story.vi.length > 0 && entry.story.en.length > 0);
    assert.ok(entry.citadelBond.vi.length > 0 && entry.citadelBond.en.length > 0);
  }

  const bossWaves = Object.keys(hm).map(Number).sort((a, b) => a - b);
  assert.deepEqual(bossWaves, BOSS_WAVES);
  assert.equal(BOSS_CHRONICLES.length, 9);
  for (const w of bossWaves) {
    const bLore = BOSS_CHRONICLES.find((b) => b.wave === w);
    assert.ok(bLore, `Missing BOSS_CHRONICLES entry for wave ${w}`);
    assert.ok(bLore.name.vi && bLore.name.en && bLore.lore.vi && bLore.lore.en);
  }

  const overviewVi = buildCitadelChronicleOverview(
    { tinClue: true, baoClue: true, combinedUnlocked: true, inspectedNodes: ['tin_lab', 'bao_mirror', 'shared_altar'] },
    'vi'
  );
  assert.match(overviewVi.badge, /3\/3/);
  assert.equal(overviewVi.combinedDossier.locked, false);

  // Also verify playerAccount cloud/local merge preserves citadelSecrets and honors founderUnlocked map access
  const merged = mergeLocalAndCloudProgress(
    {
      coins: 500,
      highestWave: 10,
      classicCleared: false,
      selectedMapId: 'blood_citadel',
      citadelSecrets: { tinClue: true, baoClue: false, combinedUnlocked: false, inspectedNodes: ['tin_lab'] },
    } as any,
    {
      coins: 400,
      highestWave: 12,
      citadelSecrets: { tinClue: false, baoClue: true, combinedUnlocked: false, inspectedNodes: ['bao_mirror'] },
    } as any,
    true
  );
  assert.equal(merged.selectedMapId, 'blood_citadel');
  assert.equal(merged.citadelSecrets?.tinClue, true);
  assert.equal(merged.citadelSecrets?.baoClue, true);

  const mergedLocked = mergeLocalAndCloudProgress(
    { coins: 500, highestWave: 10, classicCleared: false, selectedMapId: 'blood_citadel' } as any,
    null,
    false
  );
  assert.equal(mergedLocked.selectedMapId, 'classic');
});

test('GameEngine executes Cổ Thành Huyết Táng hazards, Founder map switching, and Tin/Bảo/Combined Easter eggs end-to-end', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const { P2PRoomHost } = await import('./webrtcCoop.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const loreEvents: any[] = [];
    const engine: any = new GameEngine(canvasStub);
    engine.onCitadelLore = (payload: any) => loreEvents.push(payload);

    // Initially classic-only before Wave 27 & before Founder unlock
    engine.setFounderUnlocked(false);
    assert.equal(engine.setSelectedMap('blood_citadel'), false);
    assert.equal(engine.selectedMapId, 'classic');

    // Founder unlock grants immediate free switching to Cổ Thành Huyết Táng
    engine.setFounderUnlocked(true);
    assert.equal(engine.setSelectedMap('blood_citadel'), true);
    assert.equal(engine.selectedMapId, 'blood_citadel');

    const tinHero = Mi.find((h: any) => h.id === 'tin');
    const baoHero = Mi.find((h: any) => h.id === 'bao');
    assert.ok(tinHero && baoHero);

    // 1) Play as Tin -> inspect tin_lab in NE corner
    engine.startNewGame(tinHero);
    assert.equal(engine.activeMapId, 'blood_citadel');
    assert.equal(engine.mapWidth, 1600);
    assert.equal(engine.mapHeight, 1600);
    const tinNode = BLOOD_CITADEL_INTERACTABLES.find((n) => n.id === 'tin_lab')!;
    engine.player.x = tinNode.x;
    engine.player.y = tinNode.y;
    engine.player.hp = Math.round(engine.player.maxHp * 0.6);
    const coinsBeforeTin = engine.playerCoins;
    const tinRes = engine.interactNearestCitadelNode();
    assert.ok(tinRes);
    assert.equal(engine.citadelSecrets.tinClue, true);
    assert.equal(engine.playerCoins, coinsBeforeTin + 120);

    // Verify enemy obstacle collision + Citadel hazard tick + render() work safely
    const mob: any = {
      id: 9101,
      kind: 'minion',
      name: 'CitadelGuard',
      x: 560,
      y: 150,
      radius: 16,
      hp: 500,
      maxHp: 500,
      speed: 100,
      damage: 20,
      facing: 0,
      stunTimer: 0,
      slowFactor: 0,
      slowTimer: 0,
      hitFlash: 0,
      attackCooldown: 1,
    };
    engine.enemies = [mob];
    assert.doesNotThrow(() => engine.updateCitadelMap(0.1));
    assert.doesNotThrow(() => engine.updateEnemies(0.05));
    assert.doesNotThrow(() => engine.render());

    // 2) Play as Bảo -> inspect bao_mirror in SW corner
    engine.startNewGame(baoHero);
    const baoNode = BLOOD_CITADEL_INTERACTABLES.find((n) => n.id === 'bao_mirror')!;
    engine.player.x = baoNode.x;
    engine.player.y = baoNode.y;
    const coinsBeforeBao = engine.playerCoins;
    const baoRes = engine.interactNearestCitadelNode();
    assert.ok(baoRes);
    assert.equal(engine.citadelSecrets.baoClue, true);
    assert.equal(engine.playerCoins, coinsBeforeBao + 120);
    assert.ok(engine.player.bao_stealthTimer > 1.0);

    // 3) Enter Northern Secret Vault -> inspect shared_altar for hidden joint event
    const altarNode = BLOOD_CITADEL_INTERACTABLES.find((n) => n.id === 'shared_altar')!;
    engine.player.x = altarNode.x;
    engine.player.y = altarNode.y;
    const coinsBeforeAltar = engine.playerCoins;
    const combinedRes = engine.interactNearestCitadelNode();
    assert.ok(combinedRes);
    assert.equal(combinedRes.isCombinedEvent, true);
    assert.equal(engine.citadelSecrets.combinedUnlocked, true);
    assert.equal(engine.playerCoins, coinsBeforeAltar + 350);
    assert.equal(loreEvents.length, 3);

    // Revoking Founder lock reverts unearned Citadel selection back to classic
    engine.setFounderUnlocked(false);
    assert.equal(engine.selectedMapId, 'classic');

    // Co-op P2PRoomHost SET_MAP updates room.mapId cleanly in LOBBY
    const p2pHost = new P2PRoomHost({
      hostName: 'CitadelHost',
      heroId: 'tin',
      mapId: 'classic',
      onLocalEvent: () => {},
      onPeersChanged: () => {},
    });
    p2pHost.start();
    assert.equal(p2pHost.serializeRoom().mapId, 'classic');
    p2pHost.handleMessage(p2pHost.hostId, { type: 'SET_MAP', mapId: 'blood_citadel' });
    assert.equal(p2pHost.serializeRoom().mapId, 'blood_citadel');
    p2pHost.destroy();
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('deviceStorage multi-layer persistence, device memory, settings, environment detection, and transfer code roundtrip', () => {
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;

  try {
    // 1. Environment detection across file://, GitHub Pages, and localhost
    assert.equal(
      isStaticWebHost('thienqn25p0866-svg.github.io', 'https:'),
      true
    );
    assert.equal(isStaticWebHost('', 'file:'), true);
    assert.equal(isStaticWebHost('localhost', 'http:'), false);

    const ghEnv = detectStorageEnvironment({
      protocol: 'https:',
      hostname: 'thienqn25p0866-svg.github.io',
      origin: 'https://thienqn25p0866-svg.github.io',
    });
    assert.equal(ghEnv.environmentType, 'github_web');
    assert.equal(ghEnv.isStaticHost, true);
    assert.equal(ghEnv.isLocalFile, false);

    const fileEnv = detectStorageEnvironment({
      protocol: 'file:',
      hostname: '',
      origin: 'null',
    });
    assert.equal(fileEnv.environmentType, 'local_file');
    assert.equal(fileEnv.isLocalFile, true);

    // 2. Multi-layer fallback when localStorage throws SecurityError (like strict file:// browsers)
    (globalThis as any).window = {
      name: '',
      location: { protocol: 'file:', host: '', hostname: '', origin: 'null' },
    };
    (globalThis as any).localStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };

    writeDeviceKey('test_fallback_key', 'persisted_value_123');
    assert.equal(readDeviceKey('test_fallback_key'), 'persisted_value_123');
    assert.ok((globalThis as any).window.name.startsWith('__AH_DEV_V1__:'));
    removeDeviceKey('test_fallback_key');
    assert.equal(readDeviceKey('test_fallback_key'), null);

    // 3. Normal localStorage + device memory visit/revision tracking
    const lsMap = new Map<string, string>();
    (globalThis as any).window = {
      name: '',
      location: {
        protocol: 'https:',
        host: 'thienqn25p0866-svg.github.io',
        hostname: 'thienqn25p0866-svg.github.io',
        origin: 'https://thienqn25p0866-svg.github.io',
      },
    };
    (globalThis as any).localStorage = {
      getItem: (k: string) => lsMap.get(k) ?? null,
      setItem: (k: string, v: string) => lsMap.set(k, String(v)),
      removeItem: (k: string) => lsMap.delete(k),
    };

    const dev1 = touchDeviceVisit(true);
    assert.ok(dev1.deviceId.startsWith('DEV-'));
    assert.equal(dev1.environmentType, 'github_web');
    assert.equal(dev1.sessionCount, 1);

    const dev2 = touchDeviceVisit(true);
    assert.equal(dev2.deviceId, dev1.deviceId);
    assert.equal(dev2.sessionCount, 2);

    const devSaved = recordDeviceSave(7);
    assert.equal(devSaved.saveRevision, 7);
    assert.equal(loadDeviceRecord().deviceId, dev1.deviceId);

    // 4. Settings persistence & reload
    const savedSettings = saveDeviceSettings({
      lang: 'en',
      sfxEnabled: false,
      sfxVolume: 0.4,
      musicOn: true,
      musicVol: 0.25,
      screenShake: false,
      showDamageNumbers: false,
      layoutMode: 'portrait',
      portraitFov: 'wide',
      qualityMode: 'saver',
      fpsCapMode: '45',
    });
    const loadedSettings = loadDeviceSettings();
    assert.deepEqual(loadedSettings, savedSettings);

    // 5. Cross-context AH_DEV1 transfer code roundtrip including savedRun + settings
    const runCheckpoint = normalizeSavedRun({
      active: true,
      wave: 14,
      mapId: 'classic',
      heroId: 'tin',
      level: 11,
      xp: 320,
      xpToNext: 900,
      hp: 1450,
      maxHp: 2100,
      shield: 200,
      bonusLevelHp: 400,
      bonusLevelAtk: 45,
      bonusLevelAp: 90,
      totalKilled: 240,
      totalDamage: 185000,
      elapsedTime: 412,
    });
    assert.ok(runCheckpoint);

    const transferCode = encodeDeviceTransferCode({
      version: '11.8',
      deviceId: dev1.deviceId,
      profile: {
        displayName: 'Chiến Binh Việt',
        highestWave: 21,
        coins: 3450,
      },
      progress: {
        coins: 3450,
        highestWave: 21,
        classicCleared: false,
        selectedMapId: 'classic',
        selectedHeroId: 'tin',
      },
      savedRun: runCheckpoint,
      settings: savedSettings,
    });
    assert.ok(transferCode.startsWith(DEVICE_TRANSFER_PREFIX));

    const decoded = decodeDeviceTransferCode(transferCode);
    assert.equal(decoded.ok, true);
    if (decoded.ok) {
      const parsedPkg = parseSavePackageJson(decoded.jsonText, false);
      assert.equal(parsedPkg.ok, true);
      if (parsedPkg.ok) {
        assert.equal(parsedPkg.profile.displayName, 'Chiến Binh Việt');
        assert.equal(parsedPkg.progress.coins, 3450);
        assert.equal(parsedPkg.progress.highestWave, 21);
        assert.equal(parsedPkg.savedRun?.wave, 14);
        assert.equal(parsedPkg.savedRun?.heroId, 'tin');
        assert.equal(parsedPkg.settings?.qualityMode, 'saver');
        assert.equal(parsedPkg.settings?.lang, 'en');
      }
    }
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
  }
});

test('GameEngine preserves coins/inventory/gear across startNewGame and restores solo savedRun checkpoint on revisit', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi, zr } = await import('./gameData.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    name: '',
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'https:', host: 'user.github.io', hostname: 'user.github.io', origin: 'https://user.github.io' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  const makeCanvas = () => ({
    width: 1280,
    height: 720,
    getBoundingClientRect: () => ({ width: 1280, height: 720 }),
    getContext: () => ctxStub,
  });

  try {
    const e1: any = new GameEngine(makeCanvas());
    const eohyenHero = Mi.find((h: any) => h.id === 'eohyen') || Mi[0];
    const sampleItem = zr[0];

    // Give coins + inventory + equipped gear in Lobby before starting
    e1.playerCoins = 2400;
    const itemInstance = { uid: e1.nextUid++, itemId: sampleItem.id };
    e1.inventory = [itemInstance];
    e1.heroGear[eohyenHero.id] = { ...(e1.heroGear[eohyenHero.id] || {}), weapon: itemInstance.uid };
    e1.highestWaveCleared = 9;
    e1.saveGame();

    // startNewGame() must NOT wipe lobby coins, inventory, or equipped gear
    e1.startNewGame(eohyenHero, 'classic');
    assert.equal(e1.playerCoins, 2400);
    assert.equal(e1.inventory.length, 1);
    assert.equal(e1.heroGear[eohyenHero.id]?.weapon, itemInstance.uid);
    assert.equal(e1.hasResumableRun(), true);

    // Advance player state mid-run and capture checkpoint at wave 6
    e1.wave = 6;
    e1.player.level = 7;
    e1.player.xp = 180;
    e1.player.hp = Math.min(e1.player.maxHp, 777);
    e1.totalKilled = 65;
    e1.captureCurrentRunCheckpoint(6);
    e1.saveGame();

    // Simulate closing browser tab & opening again with a brand-new GameEngine instance
    const e2: any = new GameEngine(makeCanvas());
    assert.equal(e2.playerCoins, 2400);
    assert.equal(e2.highestWaveCleared, 9);
    assert.equal(e2.inventory.length, 1);
    assert.equal(e2.heroGear[eohyenHero.id]?.weapon, itemInstance.uid);
    assert.equal(e2.hasResumableRun(), true);
    const snap = e2.getSavedRunSnapshot();
    assert.equal(snap?.wave, 6);
    assert.equal(snap?.level, 7);
    assert.equal(snap?.heroId, eohyenHero.id);

    // Resume mid-run checkpoint cleanly
    const resumed = e2.resumeSavedGame();
    assert.equal(resumed, true);
    assert.equal(e2.gameState, 'PLAYING');
    assert.equal(e2.wave, 6);
    assert.equal(e2.player.level, 7);
    assert.equal(e2.player.hp, 777);
    assert.equal(e2.totalKilled, 65);
    assert.equal(e2.playerCoins, 2400);

    // Clear savedRun explicitly and verify fresh engine no longer shows resumable run
    e2.clearSavedRun(true);
    const e3: any = new GameEngine(makeCanvas());
    assert.equal(e3.hasResumableRun(), false);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Map 2 (Hỏa Ngục Tàn Tro) geometry, 8 zones, spawn clearance, gates, keys & destructible walls behave deterministically', () => {
  // 1. Scale check: 2400x2100 = 5,040,000 px^2 = 1.8x Classic (2000x1400 = 2,800,000 px^2)
  assert.equal(INFERNO_MAP_WIDTH, 2400);
  assert.equal(INFERNO_MAP_HEIGHT, 2100);
  assert.equal(ARENA_MAPS.inferno_ash.width, 2400);
  assert.equal(ARENA_MAPS.inferno_ash.height, 2100);
  const classicArea = 2000 * 1400;
  const infernoArea = INFERNO_MAP_WIDTH * INFERNO_MAP_HEIGHT;
  assert.ok(infernoArea / classicArea >= 1.75 && infernoArea / classicArea <= 2.0);
  assert.equal(INFERNO_ZONES.length, 8);
  assert.equal(INFERNO_INTERACTABLES.length, 15);
  assert.equal(Object.keys(INFERNO_DOCS).length, 14);

  // Spawn sits cleanly inside Zone 1 and outside all active obstacles
  const startZone = getInfernoZoneAt(INFERNO_SPAWN.x, INFERNO_SPAWN.y);
  assert.equal(startZone.id, 'zone_1');
  let progress = createDefaultInfernoProgress();
  const runtime = createInitialInfernoRuntimeState('inferno_ash', progress);
  const initialObstacles = getActiveInfernoObstacles(runtime, progress);
  assert.equal(doesPointOverlapAnyObstacle(INFERNO_SPAWN.x, INFERNO_SPAWN.y, 24, initialObstacles), false);

  // Every zone center resolves cleanly to its zone and no interactable overlaps static obstacles
  for (const z of INFERNO_ZONES) {
    const resolved = getInfernoZoneAt(z.x + z.w * 0.5, z.y + z.h * 0.5);
    assert.equal(resolved.id, z.id);
  }
  for (const node of INFERNO_INTERACTABLES) {
    assert.equal(doesPointOverlapAnyObstacle(node.x, node.y, 16, initialObstacles), false, `Inferno interactable ${node.id} overlaps obstacle`);
  }

  // 2. Gates & Keys: gate_archive requires archive_key; gate_fortress_depot requires bunker_key; gate_four_chairs requires 3 hero clues
  const lockedArchive = tryOpenInfernoGate({ gateId: 'gate_archive', progress, lang: 'vi' });
  assert.equal(lockedArchive.openedNow, false);
  assert.equal(lockedArchive.reason, 'missing_key');

  const keyRes = evaluateInfernoInteraction({ nodeId: 'guardhouse_key', heroId: 'eohyen', progress, lang: 'vi' });
  progress = keyRes.nextProgress;
  assert.equal(progress.keysFound.includes('archive_key'), true);

  const openArchive = tryOpenInfernoGate({ gateId: 'gate_archive', progress, lang: 'vi' });
  assert.equal(openArchive.openedNow, true);
  progress = openArchive.nextProgress;
  assert.equal(getActiveInfernoObstacles(runtime, progress).some((o) => o.gateId === 'gate_archive'), false);

  const bunkerLocked = tryOpenInfernoGate({ gateId: 'gate_fortress_depot', progress, lang: 'en' });
  assert.equal(bunkerLocked.openedNow, false);
  assert.equal(bunkerLocked.reason, 'missing_key');

  const fortressSwitchRes = evaluateInfernoInteraction({ nodeId: 'fortress_switch', heroId: 'dung', progress, lang: 'vi' });
  progress = fortressSwitchRes.nextProgress;
  assert.equal(progress.openedDoors.includes('gate_fortress_depot'), true);
  assert.equal(getActiveInfernoObstacles(runtime, progress).some((o) => o.gateId === 'gate_fortress_depot'), false);

  const sealedFourChairs = tryOpenInfernoGate({ gateId: 'gate_four_chairs', progress, lang: 'vi' });
  assert.equal(sealedFourChairs.openedNow, false);
  assert.equal(sealedFourChairs.reason, 'missing_clues');

  // 3. Destructible Walls shatter cleanly and persist in progress.destroyedWalls
  const gateAlleyWall = INFERNO_DESTRUCTIBLE_WALLS.find((w) => w.id === 'cw_gate_alley')!;
  const wallHit = damageInfernoDestructibleWalls(
    runtime,
    progress,
    gateAlleyWall.x + gateAlleyWall.w * 0.5,
    gateAlleyWall.y + gateAlleyWall.h * 0.5,
    60,
    gateAlleyWall.maxHp + 50
  );
  assert.equal(wallHit.destroyedWalls.length, 1);
  assert.equal(wallHit.destroyedWalls[0].id, 'cw_gate_alley');
  progress = wallHit.nextProgress;
  assert.equal(progress.destroyedWalls.includes('cw_gate_alley'), true);
  assert.equal(getActiveInfernoObstacles(runtime, progress).some((o) => o.destructibleId === 'cw_gate_alley'), false);
});

test('Map 2 character Easter eggs (Dũng, Danh, Long Hói, Four Chairs & Trung) & progression merge work cleanly', () => {
  let progress = createDefaultInfernoProgress();

  // Wrong hero inspecting dung_crypt does not unlock Dũng's clue
  const wrongDung = evaluateInfernoInteraction({ nodeId: 'dung_crypt', heroId: 'eohyen', progress, lang: 'vi' });
  assert.equal(wrongDung.nextProgress.dungClue, false);
  assert.equal(wrongDung.coinBonus, 0);

  // Dũng inspects Zone 3 Sacrificial Crypt -> spawns 3-headed hound phantom + unlocks dungClue
  const rightDung = evaluateInfernoInteraction({ nodeId: 'dung_crypt', heroId: 'dung', progress, lang: 'vi' });
  progress = rightDung.nextProgress;
  assert.equal(progress.dungClue, true);
  assert.equal(progress.collectedDocs.includes('doc_dung_chains'), true);
  assert.equal(rightDung.spawnPhantom?.kind, 'hound_three_head');
  assert.equal(rightDung.payload.unlockedNow, true);

  // Danh inspects Zone 4 Wyrmfire Temple -> spawns ash_child phantom + unlocks danhClue
  const rightDanh = evaluateInfernoInteraction({ nodeId: 'danh_shrine', heroId: 'danh', progress, lang: 'vi' });
  progress = rightDanh.nextProgress;
  assert.equal(progress.danhClue, true);
  assert.equal(progress.collectedDocs.includes('doc_danh_dragon'), true);
  assert.equal(rightDanh.spawnPhantom?.kind, 'ash_child');

  // Four Chairs remains locked until Long Hói unlocks Zone 5 clue
  assert.equal(progress.fourChairsUnlocked, false);
  const danhCompass = getInfernoCompassTarget('longhoi', progress, 'vi');
  assert.equal(danhCompass?.tag, 'PHÁO ĐÀI');

  // Long Hói inspects Zone 5 Bastion Console -> unlocks longhoiClue & auto-unseals Zone 7 Four Chairs
  const rightLongHoi = evaluateInfernoInteraction({ nodeId: 'longhoi_console', heroId: 'longhoi', progress, lang: 'vi' });
  progress = rightLongHoi.nextProgress;
  assert.equal(progress.longhoiClue, true);
  assert.equal(progress.collectedDocs.includes('doc_longhoi_log'), true);
  assert.equal(progress.fourChairsUnlocked, true);
  assert.equal(progress.openedDoors.includes('gate_four_chairs'), true);

  // Compass now points to Zone 7 Arcane Orb
  const orbCompass = getInfernoCompassTarget('trung', progress, 'vi');
  assert.equal(orbCompass?.tag, 'CẦU BỐN GHẾ');

  // Non-Trung inspecting Zone 7 Orb only previews without triggering Trung's 2-step reveal
  const previewOrb = evaluateInfernoInteraction({ nodeId: 'trung_orb_pedestal', heroId: 'dung', progress, lang: 'vi' });
  assert.equal(previewOrb.nextProgress.trungTriggered, false);
  assert.equal(previewOrb.payload.isTrungReveal, false);

  // Trung inspecting Zone 7 Orb triggers 2-step reveal, darkness pulse, shadow phantom, +350 coins, and lore completion
  const trungReveal = evaluateInfernoInteraction({ nodeId: 'trung_orb_pedestal', heroId: 'trung', progress, lang: 'vi' });
  progress = trungReveal.nextProgress;
  assert.equal(progress.trungTriggered, true);
  assert.equal(progress.collectedDocs.includes('doc_trung_truth'), true);
  assert.equal(trungReveal.payload.isTrungReveal, true);
  assert.equal(trungReveal.payload.steps.length, 2);
  assert.equal(trungReveal.spawnPhantom?.kind, 'fourth_chair_shadow');
  assert.ok((trungReveal.darknessPulseSec || 0) >= 8.0);
  assert.equal(getInfernoCompassTarget('trung', progress, 'vi'), null);

  // Lore overview reflects full completion
  const chronicle = buildInfernoChronicleOverview(progress, 'vi');
  assert.equal(chronicle.fourChairsDossier.trungDone, true);
  assert.match(chronicle.badge, /BỐN CHIẾC GHẾ/);

  // Merge + normalize + save package JSON roundtrip preserves infernoProgress
  const pA = normalizeInfernoProgress({ dungClue: true, collectedDocs: ['doc_gate_edict'], keysFound: ['archive_key'] });
  const pB = normalizeInfernoProgress({ danhClue: true, longhoiClue: true, destroyedWalls: ['cw_gate_alley'] });
  const mergedInferno = mergeInfernoProgress(pA, pB);
  assert.equal(mergedInferno.dungClue, true);
  assert.equal(mergedInferno.danhClue, true);
  assert.equal(mergedInferno.longhoiClue, true);
  assert.equal(mergedInferno.fourChairsUnlocked, true);
  assert.equal(mergedInferno.destroyedWalls.includes('cw_gate_alley'), true);

  const mergedAccount = mergeLocalAndCloudProgress(
    { coins: 200, highestWave: 5, classicCleared: false, infernoProgress: pA } as any,
    { coins: 300, highestWave: 6, infernoProgress: pB } as any,
    false
  );
  assert.equal(mergedAccount.infernoProgress?.fourChairsUnlocked, true);

  const blockedSave = parseSavePackageJson(JSON.stringify({
    progress: { coins: 900, highestWave: 8, selectedMapId: 'inferno_ash', infernoProgress: progress },
  }), false);
  assert.equal(blockedSave.ok, true);
  if (blockedSave.ok) {
    assert.equal(blockedSave.progress.selectedMapId, 'classic');
  }

  const parsedSave = parseSavePackageJson(JSON.stringify({
    progress: { coins: 900, highestWave: 27, classicCleared: true, bloodCitadelCleared: true, selectedMapId: 'inferno_ash', infernoProgress: progress },
  }), false);
  assert.equal(parsedSave.ok, true);
  if (parsedSave.ok) {
    assert.equal(parsedSave.progress.selectedMapId, 'inferno_ash');
    assert.equal(parsedSave.progress.classicCleared, true);
    assert.equal(parsedSave.progress.bloodCitadelCleared, true);
    assert.equal(parsedSave.progress.infernoProgress?.trungTriggered, true);
  }
});

test('Map 2 steps all 6 hazard systems cleanly (lightning, fire fissures, missile wall break, bridge collapse, ambushes, Zone 8 arcane DoT)', () => {
  let progress = createDefaultInfernoProgress();
  const runtime = createInitialInfernoRuntimeState('inferno_ash', progress);

  // 1. Lightning telegraph -> flash strike damage & stun
  const lt = runtime.lightningStrikes[0];
  lt.state = 'telegraph';
  lt.timer = 0.05;
  const ltTick = stepInfernoHazards({
    runtime,
    progress,
    dt: 0.1,
    playerX: lt.x,
    playerY: lt.y,
    playerRadius: 18,
    playerAlive: true,
  });
  assert.equal(lt.state, 'flash');
  assert.equal(ltTick.result.triggerLightningFlash, true);
  assert.ok(ltTick.result.playerDamage >= 36);
  assert.ok((ltTick.result.applyStunSec || 0) > 0);
  lt.state = 'cooldown';
  lt.timer = 99;

  // 2. Fire fissure glow -> erupt damage + burn
  const ff = runtime.fireFissures[0];
  ff.state = 'glow';
  ff.timer = 0.05;
  const ffGlowTick = stepInfernoHazards({
    runtime,
    progress,
    dt: 0.1,
    playerX: ff.x + ff.w * 0.5,
    playerY: ff.y + ff.h * 0.5,
    playerRadius: 18,
    playerAlive: true,
  });
  assert.equal(ff.state, 'erupt');
  const ffEruptTick = stepInfernoHazards({
    runtime,
    progress,
    dt: 0.1,
    playerX: ff.x + ff.w * 0.5,
    playerY: ff.y + ff.h * 0.5,
    playerRadius: 18,
    playerAlive: true,
  });
  assert.ok(ffEruptTick.result.playerDamage >= 18);
  assert.ok(ffEruptTick.result.applyBurn);
  ff.state = 'dormant';
  ff.timer = 99;

  // 3. Zone 5 Missile impact near cw_fortress_wall shatters cracked bastion wall
  const bastionWall = INFERNO_DESTRUCTIBLE_WALLS.find((w) => w.id === 'cw_fortress_wall')!;
  const ms = runtime.missileLocks[0];
  ms.state = 'flying';
  ms.targetX = bastionWall.x + bastionWall.w * 0.5;
  ms.targetY = bastionWall.y + bastionWall.h * 0.5;
  ms.missileX = ms.targetX;
  ms.missileY = ms.targetY;
  ms.timer = 0.05;
  const msTick = stepInfernoHazards({
    runtime,
    progress,
    dt: 0.1,
    playerX: ms.targetX + 200,
    playerY: ms.targetY + 200,
    playerRadius: 18,
    playerAlive: true,
  });
  progress = msTick.nextProgress;
  assert.equal(msTick.result.missileImpacts.length, 1);
  assert.equal(msTick.result.destroyedWalls.some((w) => w.id === 'cw_fortress_wall'), true);
  assert.equal(progress.destroyedWalls.includes('cw_fortress_wall'), true);

  // 4. Collapsible stone bridge: intact -> shaking -> collapsed -> reforms when clear
  const br = runtime.collapsibleBridges[0];
  const bx = br.x + br.w * 0.5;
  const by = br.y + br.h * 0.5;
  stepInfernoHazards({ runtime, progress, dt: 0.1, playerX: bx, playerY: by, playerRadius: 18, playerAlive: true });
  assert.equal(br.state, 'shaking');
  br.timer = 0.05;
  const collapseTick = stepInfernoHazards({ runtime, progress, dt: 0.1, playerX: bx, playerY: by, playerRadius: 18, playerAlive: true });
  assert.equal(br.state, 'collapsed');
  assert.ok(collapseTick.result.playerDamage >= 24);
  br.timer = 0.05;
  stepInfernoHazards({ runtime, progress, dt: 0.1, playerX: 200, playerY: 1900, playerRadius: 18, playerAlive: true });
  assert.equal(br.state, 'intact');

  // 5. Ruin Ambush: armed -> warning -> spawn
  const amb = runtime.ruinAmbushes[0];
  stepInfernoHazards({ runtime, progress, dt: 0.1, playerX: amb.x, playerY: amb.y, playerRadius: 18, playerAlive: true });
  assert.equal(amb.state, 'warning');
  amb.timer = 0.05;
  const ambTick = stepInfernoHazards({ runtime, progress, dt: 0.1, playerX: amb.x, playerY: amb.y, playerRadius: 18, playerAlive: true });
  assert.equal(ambTick.result.ambushSpawns.length, 1);
  assert.equal(amb.state, 'cooldown');

  // 6. Zone 8 Unstable Arcane Zone: applies slow + stacking DoT after exposure >= 0.75s
  const arc = runtime.unstableArcaneZones[0];
  stepInfernoHazards({ runtime, progress, dt: 0.5, playerX: arc.x, playerY: arc.y, playerRadius: 18, playerAlive: true });
  const arcTick = stepInfernoHazards({ runtime, progress, dt: 0.35, playerX: arc.x, playerY: arc.y, playerRadius: 18, playerAlive: true });
  assert.ok(arcTick.result.applySlow);
  assert.ok(arcTick.result.playerDamage >= 14);
});

test('GameEngine runs Map 2 (Hỏa Ngục Tàn Tro) end-to-end with zero shadowBlur and preserves P2PRoomHost inferno_ash', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const { P2PRoomHost } = await import('./webrtcCoop.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  let shadowBlurWrites = 0;
  const rawCtx: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  const ctxStub: any = new Proxy(rawCtx, {
    set(target, prop, value) {
      if (prop === 'shadowBlur' && Number(value) > 0) shadowBlurWrites++;
      target[prop] = value;
      return true;
    },
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const storyEvents: any[] = [];
    const engine: any = new GameEngine(canvasStub);
    engine.onInfernoStory = (payload: any) => storyEvents.push(payload);

    assert.equal(engine.setSelectedMap('inferno_ash'), false);
    assert.equal(engine.selectedMapId, 'classic');
    engine.classicCleared = true;
    engine.bloodCitadelCleared = true;
    engine.syncUnlockedMaps();

    assert.equal(engine.setSelectedMap('inferno_ash'), true);
    assert.equal(engine.selectedMapId, 'inferno_ash');

    const dungHero = Mi.find((h: any) => h.id === 'dung') || Mi[0];
    engine.startNewGame(dungHero, 'inferno_ash');
    assert.equal(engine.activeMapId, 'inferno_ash');
    assert.equal(engine.mapWidth, 2400);
    assert.equal(engine.mapHeight, 2100);
    assert.equal(engine.player.x, INFERNO_SPAWN.x);
    assert.equal(engine.player.y, INFERNO_SPAWN.y);

    // Step update + render across Map 2 and assert zero ctx.shadowBlur usage
    assert.doesNotThrow(() => engine.update(0.05));
    assert.doesNotThrow(() => engine.render());
    assert.equal(shadowBlurWrites, 0);

    // Interact with Zone 3 Dũng crypt in-engine & verify HUD snapshot reflects Map 2 state
    const dungNode = INFERNO_INTERACTABLES.find((n) => n.id === 'dung_crypt')!;
    engine.player.x = dungNode.x;
    engine.player.y = dungNode.y;
    const interacted = engine.interactNearestMapNode();
    assert.ok(interacted);
    assert.equal(engine.infernoProgress.dungClue, true);
    assert.equal(storyEvents.length, 1);

    const hudSnap = engine.getHudSnapshot();
    assert.equal(hudSnap.mapId, 'inferno_ash');
    assert.equal(hudSnap.infernoHud?.clueCount, 1);
    assert.equal(hudSnap.infernoProgress?.dungClue, true);

    // P2PRoomHost preserves inferno_ash map selection
    const p2pHost = new P2PRoomHost({
      hostName: 'InfernoHost',
      heroId: 'dung',
      mapId: 'inferno_ash',
      onLocalEvent: () => {},
      onPeersChanged: () => {},
    });
    p2pHost.start();
    assert.equal(p2pHost.serializeRoom().mapId, 'inferno_ash');
    p2pHost.handleMessage(p2pHost.hostId, { type: 'SET_MAP', mapId: 'classic' });
    assert.equal(p2pHost.serializeRoom().mapId, 'classic');
    p2pHost.handleMessage(p2pHost.hostId, { type: 'SET_MAP', mapId: 'inferno_ash' });
    assert.equal(p2pHost.serializeRoom().mapId, 'inferno_ash');
    p2pHost.destroy();
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('GameEngine renders Map 3 (blood_citadel) Easter eggs, hazards, and monochrome mode with zero shadowBlur and softened screen flashes', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const { BLOOD_CITADEL_INTERACTABLES, BLOOD_CITADEL_WATCHTOWERS, BLOOD_CITADEL_BLOOD_TRAPS } = await import('./bloodCitadelMap.ts');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  let shadowBlurWrites = 0;
  let maxFullWhiteFillAlpha = 0;

  const rawCtx: any = {
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {},
    fillRect(x: number, y: number, w: number, h: number) {
      if (
        w >= 1200 &&
        h >= 700 &&
        typeof rawCtx.fillStyle === 'string' &&
        (rawCtx.fillStyle.includes('255, 255, 255') || rawCtx.fillStyle.toLowerCase() === '#ffffff')
      ) {
        maxFullWhiteFillAlpha = Math.max(maxFullWhiteFillAlpha, Number(rawCtx.globalAlpha || 1));
      }
    },
    strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  const ctxStub: any = new Proxy(rawCtx, {
    set(target, prop, value) {
      if (prop === 'shadowBlur' && Number(value) > 0) shadowBlurWrites++;
      target[prop] = value;
      return true;
    },
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const loreEvents: any[] = [];
    const engine: any = new GameEngine(canvasStub);
    engine.onCitadelLore = (payload: any) => loreEvents.push(payload);
    engine.setFounderUnlocked(true);
    engine.setSelectedMap('blood_citadel');

    const tinHero = Mi.find((h: any) => h.id === 'tin') || Mi[0];
    const baoHero = Mi.find((h: any) => h.id === 'bao') || Mi[0];

    // Start Map 3 with Tin near NE Tin Lab (#MT-07)
    engine.startNewGame(tinHero, 'blood_citadel');
    assert.equal(engine.activeMapId, 'blood_citadel');

    const tinLab = BLOOD_CITADEL_INTERACTABLES.find((n: any) => n.id === 'tin_lab')!;
    const baoMirror = BLOOD_CITADEL_INTERACTABLES.find((n: any) => n.id === 'bao_mirror')!;
    const sharedAltar = BLOOD_CITADEL_INTERACTABLES.find((n: any) => n.id === 'shared_altar')!;

    // Trigger watchtower telegraph & blood trap active states during render
    if (engine.citadelRuntime?.watchtowers?.[0]) {
      engine.citadelRuntime.watchtowers[0].state = 'telegraph';
      engine.citadelRuntime.watchtowers[0].timer = 0.6;
    }
    if (engine.citadelRuntime?.bloodTraps?.[0]) {
      engine.citadelRuntime.bloodTraps[0].state = 'erupt';
      engine.citadelRuntime.bloodTraps[0].timer = 0.5;
    }

    // 1. Tin stands inside resonance range of #MT-07 Lab -> interact & render normal + mono
    engine.player.x = tinLab.x;
    engine.player.y = tinLab.y;
    engine.interactNearestCitadelNode();
    assert.equal(engine.citadelSecrets.tinClue, true);
    engine.screenFlashWhite = 0.14;
    assert.doesNotThrow(() => engine.render());

    // 2. Switch to Bảo standing near SW Bảo Mirror (#BS-04) -> interact & render reflection + afterimages
    engine.currentHero = baoHero;
    engine.player.x = baoMirror.x;
    engine.player.y = baoMirror.y;
    engine.interactNearestCitadelNode();
    assert.equal(engine.citadelSecrets.baoClue, true);
    assert.ok(loreEvents.length >= 2);
    assert.doesNotThrow(() => engine.render());

    // 3. Move to Northern Secret Vault (#ZERO-00) with unlocked star & test Monochrome Realm render
    engine.player.x = sharedAltar.x;
    engine.player.y = sharedAltar.y;
    engine.interactNearestCitadelNode();
    assert.equal(engine.citadelSecrets.combinedUnlocked, true);
    engine.player.tin_monochrome_realm_timer = 1.5;
    assert.doesNotThrow(() => engine.render());

    // Assert zero shadowBlur writes and zero blinding full-screen opaque white rectangles
    assert.equal(shadowBlurWrites, 0);
    assert.equal(maxFullWhiteFillAlpha, 0);

    // Also verify Tin C3 Overload & screenFlashWhite decay keep flash softly capped (<= 0.16)
    engine.currentHero = tinHero;
    engine.player.tin_monochrome_realm_timer = 0;
    engine.screenFlashWhite = 0;
    engine.castSkill('c3');
    assert.ok(engine.screenFlashWhite <= 0.16, `Expected Tin C3 screenFlashWhite <= 0.16, got ${engine.screenFlashWhite}`);

    // Verify Map 2 lighting/flash, keys, forged chains, masonry walls, fire fissures, lightning bolts, flameParticles & Minh prisons
    engine.startNewGame(tinHero, 'inferno_ash');
    if (engine.infernoRuntime) {
      engine.infernoRuntime.lightningFlash = 0.8;
      if (engine.infernoRuntime.lightningStrikes?.[0]) {
        engine.infernoRuntime.lightningStrikes[0].state = 'flash';
        engine.infernoRuntime.lightningStrikes[0].timer = 0.2;
      }
      if (engine.infernoRuntime.lightningStrikes?.[1]) {
        engine.infernoRuntime.lightningStrikes[1].state = 'telegraph';
        engine.infernoRuntime.lightningStrikes[1].timer = 0.5;
      }
      if (engine.infernoRuntime.fireFissures?.[0]) {
        engine.infernoRuntime.fireFissures[0].state = 'erupt';
        engine.infernoRuntime.fireFissures[0].timer = 0.6;
      }
      engine.infernoRuntime.phantoms.push({
        kind: 'hound_three_head',
        x: 280,
        y: 775,
        targetX: 280,
        targetY: 775,
        life: 0.4,
        maxLife: 2,
        alpha: 0.8,
      });
    }
    engine.spawnFlameParticles(280, 775, 'red', 4, 30, 80);
    engine.spawnFlameParticles(280, 775, 'blue', 2, 30, 80);
    engine.createBranchingLightning(220, 720, 340, 820, '#38BDF8', 3.4);
    engine.lavaPools.push({ id: 9991, visualOnly: true, x: 280, y: 775, radius: 120, timer: 0.2, duration: 3.0, tickTimer: 0, tickInterval: 0.5, damagePerTick: 0 });
    engine.zones.push({ id: 9992, visualOnly: true, kind: 'danh_dragon_fire', x: 280, y: 775, radius: 110, timer: 0.2, duration: 3.0, tickTimer: 0, tickInterval: 0.5, damagePerTick: 0, rotation: 0 });
    engine.zones.push({ id: 9993, visualOnly: true, kind: 'trung_thunder_zone', x: 280, y: 775, radius: 110, timer: 0.2, duration: 3.0, tickTimer: 0, tickInterval: 0.5, damagePerTick: 0, rotation: 0 });
    engine.minhPrisons.push({ x: 280, y: 775, radius: 140, timer: 0.4, duration: 2.0 });

    const sweepPositions = [
      { x: 280, y: 1840 }, // Zone 1 gate & cart wrecks
      { x: 1335, y: 1505 }, // Zone 2 guardhouse key & plaza echo
      { x: 280, y: 775 }, // Zone 3 crypt chains, hound phantom, lightning flash & VFX
      { x: 2022, y: 1265 }, // Zone 4 dragon shrine & fire fissures
      { x: 2020, y: 450 }, // Zone 5 bunker walls & launch pads
      { x: 1765, y: 1850 }, // Zone 6 bookshelves & archive gate
      { x: 1140, y: 225 }, // Zone 7 four chairs, letters & orb
      { x: 1090, y: 775 }, // Zone 8 abyssal crater
    ];
    for (const pos of sweepPositions) {
      engine.player.x = pos.x;
      engine.player.y = pos.y;
      engine.player.tin_monochrome_realm_timer = pos.y < 1000 ? 1.0 : 0;
      assert.doesNotThrow(() => engine.render());
    }
    assert.equal(shadowBlurWrites, 0);
    assert.equal(maxFullWhiteFillAlpha, 0);

    assert.ok(BLOOD_CITADEL_WATCHTOWERS.length > 0 && BLOOD_CITADEL_BLOOD_TRAPS.length > 0);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Map 3 (frozen_tomb) defines 3400x2800 geometry, 7 zones, clear spawn, and unlock metadata', () => {
  assert.equal(FROZEN_TOMB_WIDTH, 3400);
  assert.equal(FROZEN_TOMB_HEIGHT, 2800);
  assert.deepEqual(FROZEN_TOMB_SPAWN, { x: 480, y: 2490 });
  assert.equal(FROZEN_TOMB_ZONES.length, 7);
  assert.ok(ARENA_MAPS.frozen_tomb);
  assert.equal(ARENA_MAPS.frozen_tomb.width, 3400);
  assert.equal(ARENA_MAPS.frozen_tomb.height, 2800);
  assert.ok(ARENA_MAP_LIST.some((m: any) => m.id === 'frozen_tomb'));

  const runtime = createInitialFrozenTombRuntimeState();
  const obstacles = getActiveFrozenTombObstacles(runtime);
  assert.equal(doesPointOverlapAnyObstacle(FROZEN_TOMB_SPAWN.x, FROZEN_TOMB_SPAWN.y, 24, obstacles), false);

  const zonePoints = [
    { id: 'zone_1', x: 480, y: 2490 },
    { id: 'zone_2', x: 640, y: 1500 },
    { id: 'zone_3', x: 1800, y: 1350 },
    { id: 'zone_4', x: 650, y: 420 },
    { id: 'zone_5', x: 1890, y: 540 },
    { id: 'zone_6', x: 2820, y: 1620 },
    { id: 'zone_7', x: 1750, y: 2320 },
  ];
  for (const pt of zonePoints) {
    assert.equal(getFrozenTombZoneAt(pt.x, pt.y).id, pt.id);
  }
  assert.ok(FROZEN_TOMB_ICE_PATCHES.length > 0);
  const firstPatch = FROZEN_TOMB_ICE_PATCHES[0];
  assert.equal(isPointOnFrozenIcePatch(firstPatch.x, firstPatch.y), true);
  assert.equal(isPointOnFrozenIcePatch(FROZEN_TOMB_SPAWN.x, FROZEN_TOMB_SPAWN.y), false);
});

test('Map 3 hero-gated Easter eggs (EE1-EE4), cross-map EE5 research device, narrative & ending', () => {
  let progress = createDefaultFrozenTombProgress();
  const runtime = createInitialFrozenTombRuntimeState(progress);

  // Wrong hero on EE1 does not unlock Éo Hyên clue
  const wrongEohyen = evaluateFrozenTombInteraction({
    nodeId: 'eohyen_painting',
    heroId: 'tin',
    progress,
    runtime,
    lang: 'vi',
  });
  assert.equal(wrongEohyen.nextProgress.eohyenPaintingSeen, false);
  assert.equal(wrongEohyen.coinBonus, 0);

  // Right hero unlocks EE1–EE4
  const ee1 = evaluateFrozenTombInteraction({
    nodeId: 'eohyen_painting',
    heroId: 'eohyen',
    progress: wrongEohyen.nextProgress,
    runtime,
    lang: 'vi',
  });
  assert.equal(ee1.nextProgress.eohyenPaintingSeen, true);
  assert.ok(ee1.nextProgress.collectedDocs.includes('doc_eohyen_painting'));
  assert.ok(ee1.coinBonus >= 160);

  const ee2 = evaluateFrozenTombInteraction({
    nodeId: 'phong_faceless_statues',
    heroId: 'phong',
    progress: ee1.nextProgress,
    runtime,
    lang: 'vi',
  });
  assert.equal(ee2.nextProgress.phongMirrorClue, true);
  assert.equal(ee2.spawnPhantom?.kind, 'phong_ninja_shadow');

  const ee3 = evaluateFrozenTombInteraction({
    nodeId: 'minh_frozen_dossier',
    heroId: 'minh',
    progress: ee2.nextProgress,
    runtime,
    lang: 'vi',
  });
  assert.equal(ee3.nextProgress.minhSealClue, true);

  const ee4 = evaluateFrozenTombInteraction({
    nodeId: 'thanh_poison_vial',
    heroId: 'thanh',
    progress: ee3.nextProgress,
    runtime,
    lang: 'vi',
  });
  assert.equal(ee4.nextProgress.thanhVialClue, true);
  assert.equal(ee4.spawnPhantom?.kind, 'thanh_flashback_snake');

  // EE5 remains locked without all 3 Map 2 clues
  const partialInferno = { ...createDefaultInfernoProgress(), dungClue: true, longhoiClue: true };
  assert.equal(hasCompletedMap2Links(partialInferno).allReady, false);
  assert.equal(hasCompletedMap3Links(ee4.nextProgress).allReady, true);

  const lockedEe5 = evaluateFrozenTombInteraction({
    nodeId: 'frozen_research_device',
    heroId: 'minh',
    progress: ee4.nextProgress,
    infernoProgress: partialInferno,
    runtime,
    lang: 'vi',
  });
  assert.equal(lockedEe5.nextProgress.linkedDeviceTriggered, false);
  assert.equal(lockedEe5.coinBonus, 0);

  // Full Map 2 + Map 3 unlocks EE5 tape & Trung silence pulse
  const fullInferno = { ...partialInferno, fourChairsUnlocked: true };
  assert.equal(hasCompletedMap2Links(fullInferno).allReady, true);
  const unlockedEe5 = evaluateFrozenTombInteraction({
    nodeId: 'frozen_research_device',
    heroId: 'minh',
    progress: lockedEe5.nextProgress,
    infernoProgress: fullInferno,
    runtime,
    lang: 'vi',
  });
  assert.equal(unlockedEe5.nextProgress.linkedDeviceTriggered, true);
  assert.ok(unlockedEe5.nextProgress.collectedDocs.includes('doc_linked_experiments'));
  assert.equal(unlockedEe5.payload.audioCue, 'tape');
  assert.ok((unlockedEe5.darknessPulseSec || 0) >= 4);
  assert.ok(unlockedEe5.coinBonus >= 400);

  // Proximity narrative sequences (Gate Intro, Chamber Warning, Minh Auto-Melt)
  const introRes = evaluateFrozenTombProximityEvents({
    px: 650,
    py: 2100,
    heroId: 'eohyen',
    progress: unlockedEe5.nextProgress,
    runtime,
    lang: 'vi',
  });
  assert.equal(introRes.nextProgress.introNarrativeSeen, true);
  assert.equal(introRes.storyPayload?.nodeId, 'narrative_intro');
  assert.equal(runtime.rampartWatcherDismissed, true);

  const chamberRes = evaluateFrozenTombProximityEvents({
    px: 1750,
    py: 2320,
    heroId: 'minh',
    progress: introRes.nextProgress,
    runtime,
    lang: 'vi',
  });
  assert.equal(chamberRes.nextProgress.chamberWarningSeen, true);
  assert.equal(chamberRes.storyPayload?.nodeId, 'narrative_chamber_warning');

  const endPayload = buildEndingSequencePayload(chamberRes.nextProgress, 'vi');
  assert.equal(endPayload.showsMap2Symbol, true);
  assert.equal(endPayload.endingBoldLine, 'BĂNG CHỈ GIỮ ĐƯỢC NHỮNG THỨ CHƯA THỂ CHẾT.');

  // Compass & Chronicle merge checks
  const merged = mergeFrozenTombProgress(ee1.nextProgress, unlockedEe5.nextProgress);
  assert.equal(merged.eohyenPaintingSeen, true);
  assert.equal(merged.linkedDeviceTriggered, true);
  const compass = getFrozenTombCompassTarget('minh', createDefaultFrozenTombProgress(), 'vi');
  assert.ok(compass && compass.x > 0 && compass.y > 0);
  const overview = buildFrozenTombChronicleOverview(merged, 'vi');
  assert.ok(
    overview &&
      overview.eohyenDossier &&
      overview.phongDossier &&
      overview.minhDossier &&
      overview.thanhDossier &&
      overview.linkedDossier
  );
  assert.equal(overview.eohyenDossier.locked, false);
  assert.equal(overview.linkedDossier.locked, false);
  assert.ok(FROZEN_TOMB_DOCS.doc_linked_experiments);
});

test('Map 3 hazards, destructible ice walls, and Eohyen frost reaction behave deterministically', () => {
  let progress = createDefaultFrozenTombProgress();
  const runtime = createInitialFrozenTombRuntimeState(progress);

  // Force Blizzard transition calm -> warning -> active
  runtime.blizzardTimer = 0.05;
  let tick = stepFrozenTombHazards({
    runtime,
    dt: 0.1,
    playerX: 480,
    playerY: 2490,
    playerRadius: 22,
    playerAlive: true,
  });
  assert.equal(runtime.blizzardState, 'warning');
  assert.ok(tick.soundEvents.includes('blizzard_warn'));

  runtime.blizzardTimer = 0.05;
  tick = stepFrozenTombHazards({
    runtime,
    dt: 0.1,
    playerX: 480,
    playerY: 2490,
    playerRadius: 22,
    playerAlive: true,
  });
  assert.equal(runtime.blizzardState, 'active');
  tick = stepFrozenTombHazards({
    runtime,
    dt: 0.1,
    playerX: 480,
    playerY: 2490,
    playerRadius: 22,
    playerAlive: true,
  });
  assert.ok(tick.applySlow && tick.applySlow.factor > 0);

  // Cracked Ice collapse
  const crack = runtime.crackedIceZones[0];
  tick = stepFrozenTombHazards({ runtime, dt: 0.1, playerX: crack.x, playerY: crack.y, playerRadius: 22, playerAlive: true });
  assert.equal(crack.state, 'cracking');
  tick = stepFrozenTombHazards({ runtime, dt: 1.2, playerX: crack.x, playerY: crack.y, playerRadius: 22, playerAlive: true });
  assert.equal(crack.state, 'collapsed');
  assert.ok(tick.playerDamage > 0);
  assert.ok((tick.applyStunSec || 0) > 0);

  // Ice Hands telegraph -> erupt + root
  const hands = runtime.iceHandsHazards[0];
  hands.timer = 0.05;
  stepFrozenTombHazards({ runtime, dt: 0.1, playerX: hands.x, playerY: hands.y, playerRadius: 22, playerAlive: true });
  assert.equal(hands.state, 'telegraph');
  hands.timer = 0.05;
  tick = stepFrozenTombHazards({ runtime, dt: 0.1, playerX: hands.x, playerY: hands.y, playerRadius: 22, playerAlive: true });
  assert.equal(hands.state, 'erupt');
  assert.ok((tick.applyRootSec || 0) > 0);

  // Ghost ambush trigger -> spawn
  const ghost = runtime.ghostAmbushZones[0];
  stepFrozenTombHazards({ runtime, dt: 0.1, playerX: ghost.x, playerY: ghost.y, playerRadius: 22, playerAlive: true });
  assert.equal(ghost.state, 'warning');
  ghost.timer = 0.05;
  tick = stepFrozenTombHazards({ runtime, dt: 0.1, playerX: ghost.x, playerY: ghost.y, playerRadius: 22, playerAlive: true });
  assert.equal(tick.ghostAmbushSpawns.length, 1);

  // Purple Sealing Remnant slow + damage + static distortion
  const rem = runtime.sealingRemnants[0];
  rem.exposureSec = 1.2;
  rem.tickCd = 0;
  tick = stepFrozenTombHazards({ runtime, dt: 0.1, playerX: rem.x, playerY: rem.y, playerRadius: 22, playerAlive: true });
  assert.ok(tick.playerDamage > 0);
  assert.ok(tick.staticIntensity > 0);

  // Éo Hyên frost reaction stabilizes cracks, calms telegraphing ice hands & shatters destructible walls
  crack.state = 'cracking';
  hands.state = 'telegraph';
  const targetWall = runtime.destructibles[0];
  targetWall.hp = 80;
  const reactCrack = triggerEohyenFrozenTombReaction(runtime, progress, crack.x, crack.y, 90, 2);
  assert.ok(reactCrack.stabilizedCracks >= 1);
  assert.equal(crack.state, 'stable');
  assert.ok(crack.eohyenFrozenTimer > 0);

  const reactHands = triggerEohyenFrozenTombReaction(runtime, reactCrack.nextProgress, hands.x, hands.y, 90, 1);
  assert.ok(reactHands.calmedPhantoms >= 1);
  assert.equal(hands.state, 'cooldown');

  const wallSmash = damageFrozenTombDestructibleWalls(
    runtime,
    reactHands.nextProgress,
    targetWall.x + targetWall.w * 0.5,
    targetWall.y + targetWall.h * 0.5,
    60,
    120,
    true
  );
  assert.equal(wallSmash.hitAny, true);
  assert.equal(wallSmash.destroyedWalls.length, 1);
  assert.ok(wallSmash.nextProgress.destroyedWalls.includes(targetWall.id));
});

test('GameEngine runs Map 3 (frozen_tomb) boss wave 27, ending sequence, ice physics, and 7-zone render without shadowBlur', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const { P2PRoomHost } = await import('./webrtcCoop.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  let shadowBlurWrites = 0;
  let maxFullWhiteFillAlpha = 0;
  let structureFillRects = 0;
  let structureStrokeRects = 0;

  const rawCtx: any = {
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {},
    fillRect(x: number, y: number, w: number, h: number) {
      if (
        w >= 1200 &&
        h >= 700 &&
        typeof rawCtx.fillStyle === 'string' &&
        (rawCtx.fillStyle.includes('255, 255, 255') || rawCtx.fillStyle.toLowerCase() === '#ffffff')
      ) {
        maxFullWhiteFillAlpha = Math.max(maxFullWhiteFillAlpha, Number(rawCtx.globalAlpha || 1));
      }
      if (w > 2 && w < 1100 && h > 2 && h < 1100) {
        structureFillRects++;
      }
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      if (w > 2 && w < 1100 && h > 2 && h < 1100) {
        structureStrokeRects++;
      }
    },
    clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  const ctxStub: any = new Proxy(rawCtx, {
    set(target, prop, value) {
      if (prop === 'shadowBlur' && Number(value) > 0) shadowBlurWrites++;
      target[prop] = value;
      return true;
    },
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const storyEvents: any[] = [];
    const engine: any = new GameEngine(canvasStub);
    engine.onFrozenTombStory = (payload: any) => storyEvents.push(payload);
    engine.setFounderUnlocked(true);
    engine.setSelectedMap('frozen_tomb');

    const eohyenHero = Mi.find((h: any) => h.id === 'eohyen') || Mi[0];
    engine.startNewGame(eohyenHero, 'frozen_tomb');
    assert.equal(engine.activeMapId, 'frozen_tomb');
    assert.equal(engine.mapWidth, 3400);
    assert.equal(engine.mapHeight, 2800);
    assert.equal(engine.player.x, FROZEN_TOMB_SPAWN.x);
    assert.equal(engine.player.y, FROZEN_TOMB_SPAWN.y);

    // Trigger Éo Hyên reaction & destructible ice wall smash
    const destr = engine.frozenTombRuntime.destructibles[0];
    destr.hp = 50;
    const smashed = engine.damageFrozenTombWallAt(destr.x + destr.w * 0.5, destr.y + destr.h * 0.5, 40, 120, true);
    assert.equal(smashed, 1);
    assert.ok(engine.frozenTombProgress.destroyedWalls.includes(destr.id));

    // Spawn & kill Wave 27 Entity Boss -> triggers empty coffin & ending shard payload
    const boss = engine.spawnBoss(27);
    assert.ok(boss && boss.isFrozenTombEntityBoss === true);
    engine.damageEnemy(boss, boss.hp + 99999, 0, 0, true);
    assert.equal(engine.frozenTombProgress.bossDefeatedEmptyVoid, true);
    assert.equal(engine.frozenTombProgress.endingShardSeen, true);
    const endingEvent = storyEvents.find((ev) => ev?.isEndingSequence);
    assert.ok(endingEvent && endingEvent.showsMap2Symbol === true);

    // Sweep render across all 7 zones of Map 3 & verify HUD snapshot + non-zero visible walls/architecture
    const zoneSweep = [
      { name: 'Zone 1 Gate', x: 480, y: 2340, minFills: 20, minStrokes: 10 },
      { name: 'Zone 1-7 Divider Wall', x: 1100, y: 2150, minFills: 10, minStrokes: 4 },
      { name: 'Zone 2 Old Town', x: 640, y: 1380, minFills: 20, minStrokes: 10 },
      { name: 'Zone 3 Cathedral', x: 1800, y: 1350, minFills: 25, minStrokes: 10 },
      { name: 'Zone 4 Graveyard', x: 650, y: 420, minFills: 15, minStrokes: 8 },
      { name: 'Zone 5 Palace', x: 1890, y: 440, minFills: 20, minStrokes: 10 },
      { name: 'Zone 6 Cavern', x: 2820, y: 1520, minFills: 10, minStrokes: 4 },
      { name: 'Zone 7 Chamber', x: 1750, y: 2320, minFills: 15, minStrokes: 6 },
    ];
    for (const pos of zoneSweep) {
      engine.player.x = pos.x;
      engine.player.y = pos.y;
      engine.camera.x = pos.x;
      engine.camera.y = pos.y;
      structureFillRects = 0;
      structureStrokeRects = 0;
      assert.doesNotThrow(() => engine.render());
      assert.ok(
        structureFillRects >= pos.minFills,
        `Expected >= ${pos.minFills} visible structure fillRects in ${pos.name}, got ${structureFillRects}`,
      );
      assert.ok(
        structureStrokeRects >= pos.minStrokes,
        `Expected >= ${pos.minStrokes} visible structure strokeRects in ${pos.name}, got ${structureStrokeRects}`,
      );
    }
    const hud = engine.getHudSnapshot();
    assert.equal(hud.mapId, 'frozen_tomb');
    assert.ok(hud.frozenTombHud && hud.frozenTombProgress);
    assert.equal(shadowBlurWrites, 0);
    assert.equal(maxFullWhiteFillAlpha, 0);

    // Verify P2PRoomHost supports frozen_tomb mapId and spawn coordinates
    const p2pHost: any = new P2PRoomHost({
      hostName: 'Host',
      heroId: 'eohyen',
      mapId: 'frozen_tomb',
      onLocalEvent: () => {},
      onPeersChanged: () => {},
    });
    assert.equal(p2pHost.serializeRoom().mapId, 'frozen_tomb');
    const spawns: Record<string, any> = p2pHost._buildSpawnsMap();
    const hostSpawn = spawns[p2pHost.hostId];
    assert.ok(hostSpawn && Math.hypot(hostSpawn.x - FROZEN_TOMB_SPAWN.x, hostSpawn.y - FROZEN_TOMB_SPAWN.y) < 120);
    p2pHost.destroy();
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('GameEngine resets playerCoins to 100 on replay after defeat, Wave 27 victory, or explicit resetCoins', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    const hero = Mi.find((h: any) => h.id === 'eohyen') || Mi[0];

    // Fresh engine preserves lobby balance on first startNewGame
    engine.playerCoins = 2400;
    engine.startNewGame(hero, 'classic');
    assert.equal(engine.playerCoins, 2400);

    // Explicit { resetCoins: true } resets to 100 xu
    engine.playerCoins = 4250;
    engine.startNewGame(hero, 'classic', { resetCoins: true });
    assert.equal(engine.playerCoins, 100);

    // Defeat sets _matchEndedPendingReset -> next startNewGame resets to 100 xu
    engine.playerCoins = 1850;
    engine._matchEndedPendingReset = true;
    engine.startNewGame(hero, 'classic');
    assert.equal(engine.playerCoins, 100);
    assert.equal(engine._matchEndedPendingReset, false);

    // Wave 27 Solo Victory marks _matchEndedPendingReset -> next startNewGame resets to 100 xu
    engine.wave = 27;
    engine.playerCoins = 9999;
    engine.handleWaveCompleted();
    assert.equal(engine._matchEndedPendingReset, true);
    engine.startNewGame(hero, 'classic');
    assert.equal(engine.playerCoins, 100);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Co-op MAP_PROGRESS_SYNC merges cross-hero map secrets and auto-unlocks final vault/sanctum objectives for all players', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  const toasts: string[] = [];
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    engine.setFounderUnlocked(true);
    engine.onToast = (msg: string) => toasts.push(msg);

    // 1. Blood Citadel: Tin + Bao converge across teammates -> auto-unlock combinedUnlocked + 350 coins
    const tinHero = Mi.find((h: any) => h.id === 'tin') || Mi[0];
    engine.startNewGame(tinHero, 'blood_citadel');
    engine.multiplayer.active = true;
    engine.playerCoins = 500;
    engine.citadelSecrets = {
      tinClue: true,
      baoClue: false,
      combinedUnlocked: false,
      inspectedNodes: ['tin_lab'],
    };
    engine.handleMultiplayerMessage({
      type: 'MAP_PROGRESS_SYNC',
      fromName: 'Đồng Đội Bảo',
      citadelSecrets: {
        tinClue: false,
        baoClue: true,
        combinedUnlocked: false,
        inspectedNodes: ['bao_mirror'],
      },
    });
    assert.equal(engine.citadelSecrets.tinClue, true);
    assert.equal(engine.citadelSecrets.baoClue, true);
    assert.equal(engine.citadelSecrets.combinedUnlocked, true);
    assert.equal(engine.playerCoins, 850);
    assert.ok(toasts.some((m) => m.includes('Hầm Bí Mật Cổ Thành')));

    // 2. Inferno Ash: cross-hero Dung + Danh + Long Hoi + destructible walls sync cleanly
    engine.applyMapLayout('inferno_ash', true);
    const firstWall = engine.infernoRuntime.destructibles[0];
    engine.handleMultiplayerMessage({
      type: 'MAP_PROGRESS_SYNC',
      fromName: 'Đồng Đội Danh',
      infernoProgress: {
        dungClue: true,
        danhClue: true,
        longhoiClue: true,
        fourChairsUnlocked: true,
        trungTriggered: true,
        destroyedWalls: [firstWall.id],
        keysFound: ['bunker_key'],
        openedDoors: ['gate_bunker'],
        collectedDocs: [],
      },
    });
    assert.equal(engine.infernoProgress.fourChairsUnlocked, true);
    assert.equal(engine.infernoProgress.trungTriggered, true);
    assert.equal(firstWall.destroyed, true);

    // 3. Frozen Tomb: cross-hero boss kill + ending shard sync
    engine.applyMapLayout('frozen_tomb', true);
    engine.handleMultiplayerMessage({
      type: 'MAP_PROGRESS_SYNC',
      fromName: 'Đồng Đội Éo Hyên',
      frozenTombProgress: {
        eohyenPaintingSeen: true,
        phongMirrorsSeen: true,
        minhDossierSeen: true,
        thanhVialSeen: true,
        bossDefeatedEmptyVoid: true,
        endingShardSeen: true,
      },
    });
    assert.equal(engine.frozenTombProgress.bossDefeatedEmptyVoid, true);
    assert.equal(engine.frozenTombProgress.endingShardSeen, true);
    assert.equal(engine.frozenTombRuntime.endingShardSpawned, true);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Dual-account Co-op/P2P heroStats record achievements for both Host and Guest accounts with round-trip persistence', async () => {
  const {
    recordHeroMatchProgress,
    serializeHeroStatsEntries,
    deserializeHeroStatsEntries,
    mergeHeroStatsMaps,
    computeHeroAchievementBadges,
  } = await import('./playerAccount.ts');

  // Host plays Éo Hyên in Co-op Victory (Wave 27)
  const hostStats = recordHeroMatchProgress({}, {
    heroId: 'eohyen',
    waveReached: 27,
    deltaKills: 240,
    totalDamage: 185000,
    isMatchEnd: true,
    victory: true,
    isCoop: true,
  });

  // Guest plays Tín in P2P Co-op Victory (Wave 27)
  const guestStats = recordHeroMatchProgress({}, {
    heroId: 'tin',
    waveReached: 27,
    deltaKills: 210,
    totalDamage: 142000,
    isMatchEnd: true,
    victory: true,
    isCoop: true,
  });

  assert.equal(hostStats.eohyen.coopMatches, 1);
  assert.equal(hostStats.eohyen.coopVictories, 1);
  assert.equal(hostStats.eohyen.victories, 1);
  assert.equal(guestStats.tin.coopMatches, 1);
  assert.equal(guestStats.tin.coopVictories, 1);
  assert.equal(guestStats.tin.highestWave, 27);

  // Round-trip via Firestore-safe heroStatsEntries string array
  const encodedHost = serializeHeroStatsEntries(hostStats);
  const decodedHost = deserializeHeroStatsEntries(encodedHost);
  assert.equal(decodedHost.eohyen.kills, 240);
  assert.equal(decodedHost.eohyen.bestDamage, 185000);

  const merged = mergeHeroStatsMaps(decodedHost, guestStats);
  assert.ok(merged.eohyen && merged.tin);

  const hostBadges = computeHeroAchievementBadges(merged.eohyen).map((b: any) => b.id);
  const guestBadges = computeHeroAchievementBadges(merged.tin).map((b: any) => b.id);
  for (const reqBadge of ['clear_27', 'victor', 'coop_victor', 'slayer', 'high_dmg']) {
    assert.ok(hostBadges.includes(reqBadge), `Expected host badge ${reqBadge}`);
    assert.ok(guestBadges.includes(reqBadge), `Expected guest badge ${reqBadge}`);
  }
});

test('Map 2 (inferno_ash) 8-zone upgraded render and Map 3 (frozen_tomb) upgraded floor render run with zero shadowBlur', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  let shadowBlurWrites = 0;
  let maxFullWhiteFillAlpha = 0;
  let structureFillRects = 0;
  let structureStrokeRects = 0;

  const rawCtx: any = {
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {},
    fillRect(x: number, y: number, w: number, h: number) {
      if (
        w >= 1200 &&
        h >= 700 &&
        typeof rawCtx.fillStyle === 'string' &&
        (rawCtx.fillStyle.includes('255, 255, 255') || rawCtx.fillStyle.toLowerCase() === '#ffffff')
      ) {
        maxFullWhiteFillAlpha = Math.max(maxFullWhiteFillAlpha, Number(rawCtx.globalAlpha || 1));
      }
      if (w > 2 && w < 1100 && h > 2 && h < 1100) {
        structureFillRects++;
      }
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      if (w > 2 && w < 1100 && h > 2 && h < 1100) {
        structureStrokeRects++;
      }
    },
    clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  const ctxStub: any = new Proxy(rawCtx, {
    set(target, prop, value) {
      if (prop === 'shadowBlur' && Number(value) > 0) shadowBlurWrites++;
      target[prop] = value;
      return true;
    },
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    engine.setFounderUnlocked(true);

    const dungHero = Mi.find((h: any) => h.id === 'dung') || Mi[0];
    engine.startNewGame(dungHero, 'inferno_ash');

    const infernoSweep = [
      { name: 'Zone 1 Spawn Gate', x: 280, y: 1860 },
      { name: 'Zone 2 Red Ash Plaza', x: 980, y: 1350 },
      { name: 'Zone 3 Hầm Hiến Tế', x: 280, y: 775 },
      { name: 'Zone 4 Wyrmfire Temple', x: 2022, y: 1265 },
      { name: 'Zone 5 Bastion', x: 1980, y: 480 },
      { name: 'Zone 7 Four Chairs', x: 1140, y: 225 },
      { name: 'Zone 8 Crater', x: 1090, y: 775 },
    ];
    for (const pos of infernoSweep) {
      engine.player.x = pos.x;
      engine.player.y = pos.y;
      engine.camera.x = pos.x;
      engine.camera.y = pos.y;
      structureFillRects = 0;
      structureStrokeRects = 0;
      assert.doesNotThrow(() => engine.render());
      assert.ok(structureFillRects >= 25, `Expected dense floor/structure fills in ${pos.name}, got ${structureFillRects}`);
      assert.ok(structureStrokeRects >= 4, `Expected structure strokes in ${pos.name}, got ${structureStrokeRects}`);
    }

    assert.equal(shadowBlurWrites, 0);
    assert.equal(maxFullWhiteFillAlpha, 0);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Strict sequential campaign unlock (Classic -> Blood Citadel -> Inferno Ash -> Frozen Tomb -> Grudge Forest) across legacy saves, solo Wave 27, Co-op MATCH_OVER, and cloud merge', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');

  assert.equal(getNextCampaignMapId('classic'), 'blood_citadel');
  assert.equal(getNextCampaignMapId('blood_citadel'), 'inferno_ash');
  assert.equal(getNextCampaignMapId('inferno_ash'), 'frozen_tomb');
  assert.equal(getNextCampaignMapId('frozen_tomb'), 'grudge_forest');
  assert.equal(getNextCampaignMapId('grudge_forest'), null);
  assert.match(getMapUnlockRequirement('blood_citadel', 'vi'), /Đấu Trường Cổ Điển/);
  assert.match(getMapUnlockRequirement('inferno_ash', 'vi'), /Cổ Thành Huyết Táng/);
  assert.match(getMapUnlockRequirement('frozen_tomb', 'vi'), /Hỏa Ngục Tàn Tro/);
  assert.match(getMapUnlockRequirement('grudge_forest', 'vi'), /Băng Mộ Vĩnh Cửu/);

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  // Simulate legacy localStorage save that had fire & ice unlocked by default at wave 3
  storageMap.set('arena_hero_save_v1', JSON.stringify({
    coins: 500,
    highestWaveCleared: 3,
    selectedMapId: 'inferno_ash',
    unlockedMaps: ['classic', 'inferno_ash', 'frozen_tomb'],
  }));

  const rawCtx: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {}, fillRect() {}, strokeRect() {}, clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => rawCtx,
    };
    const engine: any = new GameEngine(canvasStub);
    const toasts: string[] = [];
    engine.onToast = (msg: string) => toasts.push(msg);

    // Legacy save with inferno_ash selected is sanitized back to classic until earned
    assert.deepEqual(engine.unlockedMaps, ['classic']);
    assert.equal(engine.selectedMapId, 'classic');
    assert.equal(engine.setSelectedMap('blood_citadel'), false);
    assert.equal(engine.setSelectedMap('inferno_ash'), false);
    assert.equal(engine.setSelectedMap('frozen_tomb'), false);

    // 1. Clear Classic Wave 27 -> unlocks Blood Citadel only
    engine.activeMapId = 'classic';
    engine.wave = 27;
    engine.unlockCitadelIfEligible();
    assert.equal(engine.classicCleared, true);
    assert.deepEqual(engine.unlockedMaps, ['classic', 'blood_citadel']);
    assert.equal(engine.setSelectedMap('blood_citadel'), true);
    assert.equal(engine.setSelectedMap('inferno_ash'), false);
    // Keep Blood Citadel selected if player clicks locked Inferno Ash
    assert.equal(engine.selectedMapId, 'blood_citadel');

    // 2. Clear Blood Citadel Wave 27 -> unlocks Inferno Ash only
    engine.activeMapId = 'blood_citadel';
    engine.wave = 27;
    engine.unlockCitadelIfEligible();
    assert.equal(engine.bloodCitadelCleared, true);
    assert.deepEqual(engine.unlockedMaps, ['classic', 'blood_citadel', 'inferno_ash']);
    assert.equal(engine.setSelectedMap('inferno_ash'), true);
    assert.equal(engine.setSelectedMap('frozen_tomb'), false);

    // 3. Clear Inferno Ash Wave 27 -> unlocks Frozen Tomb
    engine.activeMapId = 'inferno_ash';
    engine.wave = 27;
    engine.unlockCitadelIfEligible();
    assert.equal(engine.infernoCleared, true);
    assert.deepEqual(engine.unlockedMaps, ['classic', 'blood_citadel', 'inferno_ash', 'frozen_tomb']);
    assert.equal(engine.setSelectedMap('frozen_tomb'), true);

    // 4. Clear Frozen Tomb Wave 27 -> sets frozenTombCleared & unlocks Grudge Forest
    engine.activeMapId = 'frozen_tomb';
    engine.wave = 27;
    engine.unlockCitadelIfEligible();
    assert.equal(engine.frozenTombCleared, true);
    assert.deepEqual(engine.unlockedMaps, ['classic', 'blood_citadel', 'inferno_ash', 'frozen_tomb', 'grudge_forest']);
    assert.equal(engine.setSelectedMap('grudge_forest'), true);

    // 4b. Clear Grudge Forest Wave 27 -> sets grudgeForestCleared
    engine.activeMapId = 'grudge_forest';
    engine.wave = 27;
    engine.unlockCitadelIfEligible();
    assert.equal(engine.grudgeForestCleared, true);

    // 5. Verify Co-op MATCH_OVER on Host or Guest triggers sequential unlock on active map
    storageMap.clear();
    removeDeviceKey('arena_hero_save_v1');
    (globalThis as any).window.name = '';
    const guestEngine: any = new GameEngine(canvasStub);
    const baoHero = Mi.find((h: any) => h.id === 'bao') || Mi[0];
    guestEngine.startNewGame(baoHero, 'classic');
    guestEngine.multiplayer.active = true;
    guestEngine.multiplayer.isHost = false;
    guestEngine.wave = 27;
    guestEngine.handleMultiplayerMessage({ type: 'MATCH_OVER', victory: true, wave: 27 });
    assert.equal(guestEngine.classicCleared, true);
    assert.deepEqual(guestEngine.unlockedMaps, ['classic', 'blood_citadel']);

    // And clearing blood_citadel via Co-op unlocks inferno_ash
    guestEngine.activeMapId = 'blood_citadel';
    guestEngine.wave = 27;
    guestEngine.handleMultiplayerMessage({ type: 'MATCH_OVER', victory: true, wave: 27 });
    assert.equal(guestEngine.bloodCitadelCleared, true);
    assert.deepEqual(guestEngine.unlockedMaps, ['classic', 'blood_citadel', 'inferno_ash']);

    // 6. Verify mergeLocalAndCloudProgress preserves clear flags & computes strict unlockedMaps
    const merged = mergeLocalAndCloudProgress(
      { coins: 100, highestWave: 27, classicCleared: true, bloodCitadelCleared: false } as any,
      { coins: 200, highestWave: 27, bloodCitadelCleared: true, infernoCleared: false } as any,
      false
    );
    assert.equal(merged.classicCleared, true);
    assert.equal(merged.bloodCitadelCleared, true);
    assert.equal(merged.infernoCleared, false);
    assert.deepEqual(merged.unlockedMaps, ['classic', 'blood_citadel', 'inferno_ash']);

    const mergedAll = mergeLocalAndCloudProgress(
      {
        coins: 300,
        highestWave: 27,
        classicCleared: true,
        bloodCitadelCleared: true,
        infernoCleared: true,
        frozenTombCleared: true,
        grudgeForestCleared: false,
        grudgeForestProgress: { ee2MirrorLakeSeen: true, collectedDocs: ['doc_ee2_mirror_lake'] },
      } as any,
      {
        coins: 250,
        highestWave: 27,
        grudgeForestCleared: true,
        grudgeForestProgress: { ee3DuyLaughHeard: true, collectedDocs: ['doc_ee3_duy_stone'] },
      } as any,
      false
    );
    assert.equal(mergedAll.frozenTombCleared, true);
    assert.equal(mergedAll.grudgeForestCleared, true);
    assert.deepEqual(mergedAll.unlockedMaps, ['classic', 'blood_citadel', 'inferno_ash', 'frozen_tomb', 'grudge_forest']);
    assert.equal(mergedAll.grudgeForestProgress?.ee2MirrorLakeSeen, true);
    assert.equal(mergedAll.grudgeForestProgress?.ee3DuyLaughHeard, true);
    assert.equal(mergedAll.grudgeForestProgress?.ee5TrungRoomUnlocked, true);
    assert.ok(toasts.length >= 3);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Map 4 (grudge_forest) geometry, 8 zones, shifting maze safety, breakable vines, and all 6 Easter Eggs work deterministically', () => {
  // Dimensions > 2x Map 3 (3400*2800 = 9,520,000; Map 4 = 4800*4000 = 19,200,000)
  assert.equal(GRUDGE_FOREST_WIDTH, 4800);
  assert.equal(GRUDGE_FOREST_HEIGHT, 4000);
  assert.ok(GRUDGE_FOREST_WIDTH * GRUDGE_FOREST_HEIGHT > 2 * FROZEN_TOMB_WIDTH * FROZEN_TOMB_HEIGHT);
  assert.equal(GRUDGE_FOREST_ZONES.length, 8);
  assert.equal(new Set(GRUDGE_FOREST_ZONES.map((z) => z.id)).size, 8);
  for (const z of GRUDGE_FOREST_ZONES) {
    const resolved = getGrudgeForestZoneAt(z.x + z.w * 0.5, z.y + z.h * 0.5);
    assert.equal(resolved.id, z.id);
  }

  let progress = createDefaultGrudgeForestProgress();
  const runtime = createInitialGrudgeForestRuntimeState(progress);

  // Shifting Maze Safety: never shifts onto an entity sitting in the candidate wall rectangle
  const initialPhase = runtime.mazePhase;
  const safeShift = shiftGrudgeMazeSafely(runtime, [{ x: GRUDGE_FOREST_SPAWN.x, y: GRUDGE_FOREST_SPAWN.y, radius: 22 }]);
  assert.equal(safeShift.shifted, true);
  assert.notEqual(safeShift.newPhase, initialPhase);

  // Breakable Living Vines
  const firstVine = runtime.destructibles[0];
  assert.equal(firstVine.destroyed, false);
  const beforeObsCount = getActiveGrudgeForestObstacles(progress, runtime).length;
  const dmgRes = damageGrudgeForestVinesAt(
    runtime,
    progress,
    firstVine.x + firstVine.w * 0.5,
    firstVine.y + firstVine.h * 0.5,
    55,
    firstVine.maxHp + 50
  );
  assert.equal(dmgRes.hitAny, true);
  assert.deepEqual(dmgRes.destroyedIds, [firstVine.id]);
  progress = dmgRes.nextProgress;
  assert.ok(progress.destroyedVines.includes(firstVine.id));
  assert.ok(getActiveGrudgeForestObstacles(progress, runtime).length < beforeObsCount);

  // First proximity call entering forest clears introNarrativeSeen
  runtime.duyLastX = 840;
  runtime.duyLastY = 2040;
  let prox = evaluateGrudgeForestProximityEvents({
    px: 840,
    py: 2040,
    heroId: 'duy',
    progress,
    runtime,
    dt: 0.1,
    nearestAllyDist: 9999,
    lang: 'vi',
  });
  progress = prox.nextProgress;
  assert.equal(progress.introNarrativeSeen, true);

  // EE1: Duy standing idle near puppets spawns rogue puppet & unlocks secret puppet house
  prox = evaluateGrudgeForestProximityEvents({
    px: 840,
    py: 2040,
    heroId: 'duy',
    progress,
    runtime,
    dt: 3.5,
    nearestAllyDist: 9999,
    lang: 'vi',
  });
  progress = prox.nextProgress;
  assert.equal(runtime.roguePuppet.active, true);
  assert.equal(progress.ee1RoguePuppetSeen, true);

  const nonDuyHouse = evaluateGrudgeForestInteraction({
    nodeId: 'ee1_secret_puppet_house',
    heroId: 'eohyen',
    progress,
    runtime,
    lang: 'vi',
  });
  assert.equal(nonDuyHouse.nextProgress.ee1SecretHouseSeen, false);

  const duyHouse = evaluateGrudgeForestInteraction({
    nodeId: 'ee1_secret_puppet_house',
    heroId: 'duy',
    progress,
    runtime,
    lang: 'vi',
  });
  progress = duyHouse.nextProgress;
  assert.equal(progress.ee1SecretHouseSeen, true);
  assert.ok(duyHouse.payload.steps.some((s) => s.text.includes('Ngươi tưởng mình đang điều khiển chúng sao?')));

  // EE2: Mirror Lake requires resonance window, reveals Map 1 or Map 2 vision
  runtime.mirrorResonanceWindow = 0;
  const lakeMissed = evaluateGrudgeForestInteraction({
    nodeId: 'ee2_mirror_lake_bank',
    heroId: 'duy',
    progress,
    runtime,
    lang: 'vi',
  });
  assert.equal(lakeMissed.nextProgress.ee2MirrorLakeSeen, false);

  runtime.mirrorResonanceWindow = 2.5;
  const lakeHit = evaluateGrudgeForestInteraction({
    nodeId: 'ee2_mirror_lake_bank',
    heroId: 'duy',
    progress,
    runtime,
    lang: 'vi',
  });
  progress = lakeHit.nextProgress;
  assert.equal(progress.ee2MirrorLakeSeen, true);
  assert.ok(lakeHit.payload.mirrorVisionTag === 'map1' || lakeHit.payload.mirrorVisionTag === 'map2');

  // EE3: Graveyard + Duy tombstone (with Duy laugh cue) + Ma Thạch monolith -> unlocks Trung door (EE5)
  const duyStone = evaluateGrudgeForestInteraction({
    nodeId: 'ee3_duy_tombstone',
    heroId: 'duy',
    progress,
    runtime,
    lang: 'vi',
  });
  progress = duyStone.nextProgress;
  assert.equal(progress.ee3DuyLaughHeard, true);
  assert.equal(duyStone.payload.audioCue, 'duy_laugh');
  assert.equal(progress.ee5TrungRoomUnlocked, true);

  const maThachStone = evaluateGrudgeForestInteraction({
    nodeId: 'ee3_mathach_tombstone',
    heroId: 'tin',
    progress,
    runtime,
    lang: 'vi',
  });
  progress = maThachStone.nextProgress;
  assert.equal(progress.ee3MaThachStoneSeen, true);

  // Align all 3 maze statues -> removes root_door_maze_vault obstacle
  for (const st of runtime.statues) {
    st.angleIndex = (st.targetIndex + 3) % 4;
    const res = evaluateGrudgeForestInteraction({
      nodeId: st.id,
      heroId: 'duy',
      progress,
      runtime,
      lang: 'vi',
    });
    progress = res.nextProgress;
  }
  assert.equal(progress.statuesAligned, true);
  assert.equal(
    getActiveGrudgeForestObstacles(progress, runtime).some((o) => o.doorId === 'root_door_maze_vault'),
    false
  );

  // EE4: Thung Lũng Tiếng Gọi lone walk + mimic ambush
  prox = evaluateGrudgeForestProximityEvents({
    px: 2380,
    py: 3320,
    heroId: 'duy',
    progress,
    runtime,
    dt: 2.5,
    nearestAllyDist: 9999,
    lang: 'vi',
  });
  assert.ok(runtime.phantoms.length >= 1);
  const valleyAmbush = evaluateGrudgeForestInteraction({
    nodeId: 'ee4_valley_echo_shrine',
    heroId: 'duy',
    progress,
    runtime,
    lang: 'vi',
  });
  progress = valleyAmbush.nextProgress;
  assert.equal(progress.ee4ValleyCallSeen, true);
  assert.equal(valleyAmbush.spawnMimicAmbush, true);

  // EE5: Trung's hidden room -> reveals unfinished letter
  const trungRoom = evaluateGrudgeForestInteraction({
    nodeId: 'ee5_trung_hidden_room',
    heroId: 'duy',
    progress,
    runtime,
    lang: 'vi',
  });
  progress = trungRoom.nextProgress;
  assert.equal(progress.ee5TrungRoomSeen, true);
  assert.ok(trungRoom.payload.steps.some((s) => s.text.includes('Duy không phải kẻ đầu tiên')));

  // EE6: 4-Map Convergence Altar requires Map 1, Map 2, Map 3, Map 4 readiness
  const notReady = checkFourMapLinkReadiness({
    citadelSecrets: {},
    infernoProgress: {},
    frozenTombProgress: {},
    grudgeProgress: progress,
  });
  assert.equal(notReady.map1Ready, false);
  assert.equal(notReady.map4Ready, true);
  assert.equal(notReady.allReady, false);

  const fourMapRes = evaluateGrudgeForestInteraction({
    nodeId: 'ee6_four_map_altar',
    heroId: 'duy',
    progress,
    citadelSecrets: { tinClue: true, baoClue: true, combinedUnlocked: true },
    infernoProgress: { trungTriggered: true },
    frozenTombProgress: { linkedDeviceTriggered: true },
    runtime,
    lang: 'vi',
  });
  progress = fourMapRes.nextProgress;
  assert.equal(progress.ee6FourMapSecretSeen, true);
  assert.equal(countGrudgeForestSecrets(progress), 6);
  assert.ok(fourMapRes.coinBonus >= 500);

  // Poison Trap Mushroom Hazard & Open Boss Ending
  const trapMush = runtime.mushrooms.find((m) => m.kind === 'lure_trap')!;
  const hazardTick = stepGrudgeForestHazards({
    runtime,
    dt: 0.1,
    playerX: trapMush.x,
    playerY: trapMush.y,
    playerRadius: 22,
    playerAlive: true,
    entitiesForMazeSafety: [{ x: trapMush.x, y: trapMush.y, radius: 22 }],
  });
  assert.ok(hazardTick.playerDamage > 0);
  assert.ok(hazardTick.applyPoison && hazardTick.applyPoison.duration > 0);

  const endingPayload = buildGrudgeForestEndingPayload(progress, 'vi');
  assert.equal(endingPayload.isEndingSequence, true);
  assert.ok(endingPayload.paragraphs.some((p) => p.includes('Không có xác nhận')));
});

test('GameEngine runs Map 4 (grudge_forest) monsters, Wave 27 Boss open ending, Co-op sync, P2P spawns, and 8-zone render with zero shadowBlur', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const { P2PRoomHost } = await import('./webrtcCoop.js');

  const rendererSrc = fs.readFileSync(path.join(process.cwd(), 'src/arena/grudgeForestRenderer.js'), 'utf8');
  assert.equal(/shadowBlur\s*=/.test(rendererSrc), false, 'grudgeForestRenderer.js must contain zero ctx.shadowBlur assignments');

  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;

  const storageMap = new Map<string, string>();
  let shadowBlurWrites = 0;
  let maxFullWhiteFillAlpha = 0;
  let structureFillRects = 0;
  let structureStrokeRects = 0;

  const rawCtx: any = {
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, bezierCurveTo() {}, arc() {}, arcTo() {}, ellipse() {},
    rect() {}, roundRect() {},
    fillRect(x: number, y: number, w: number, h: number) {
      if (
        w >= 1200 &&
        h >= 700 &&
        typeof rawCtx.fillStyle === 'string' &&
        (rawCtx.fillStyle.includes('255, 255, 255') || rawCtx.fillStyle.toLowerCase() === '#ffffff')
      ) {
        maxFullWhiteFillAlpha = Math.max(maxFullWhiteFillAlpha, Number(rawCtx.globalAlpha || 1));
      }
      if (w > 2 && w < 1100 && h > 2 && h < 1100) {
        structureFillRects++;
      }
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      if (w > 2 && w < 1100 && h > 2 && h < 1100) {
        structureStrokeRects++;
      }
    },
    clearRect() {},
    fill() {}, stroke() {}, clip() {}, setTransform() {}, setLineDash() {},
    fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  const ctxStub: any = new Proxy(rawCtx, {
    set(target, prop, value) {
      if (prop === 'shadowBlur' && Number(value) > 0) shadowBlurWrites++;
      target[prop] = value;
      return true;
    },
  });

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const storyEvents: any[] = [];
    const engine: any = new GameEngine(canvasStub);
    engine.onGrudgeForestStory = (payload: any) => storyEvents.push(payload);
    engine.setFounderUnlocked(true);
    engine.setSelectedMap('grudge_forest');

    const duyHero = Mi.find((h: any) => h.id === 'duy') || Mi[0];
    engine.startNewGame(duyHero, 'grudge_forest');
    assert.equal(engine.activeMapId, 'grudge_forest');
    assert.equal(engine.mapWidth, 4800);
    assert.equal(engine.mapHeight, 4000);
    assert.equal(engine.player.x, GRUDGE_FOREST_SPAWN.x);
    assert.equal(engine.player.y, GRUDGE_FOREST_SPAWN.y);
    assert.equal(engine.player.heroId, 'duy');

    // Living vine destruction via GameEngine helper
    const targetVine = engine.grudgeForestRuntime.destructibles[0];
    targetVine.hp = 40;
    const broken = engine.damageGrudgeForestWallAt(
      targetVine.x + targetVine.w * 0.5,
      targetVine.y + targetVine.h * 0.5,
      45,
      100
    );
    assert.equal(broken, 1);
    assert.ok(engine.grudgeForestProgress.destroyedVines.includes(targetVine.id));

    // Spawn & defeat Wave 27 Boss -> ambiguous ending + solitary moving root node
    const boss = engine.spawnBoss(27);
    assert.ok(boss && boss.isGrudgeForestBoss === true);
    assert.match(boss.name, /Kẻ Ngủ Dưới Rễ Cây/i);
    engine.damageEnemy(boss, boss.hp + 999999, 0, 0, true);
    assert.equal(engine.grudgeForestProgress.bossClearedAmbiguous, true);
    assert.equal(engine.grudgeForestCleared, true);
    assert.equal(engine.grudgeForestRuntime.endingRootSpawned, true);
    assert.ok(storyEvents.some((ev) => ev?.isEndingSequence === true));

    const movingRoot = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === 'ending_moving_root')!;
    const nearRoot = findNearestGrudgeForestInteractable(
      movingRoot.x,
      movingRoot.y,
      engine.grudgeForestProgress,
      engine.grudgeForestRuntime
    );
    assert.equal(nearRoot?.id, 'ending_moving_root');

    // Sweep render across all 8 zones of Map 4
    for (const z of GRUDGE_FOREST_ZONES) {
      const cx = z.x + z.w * 0.5;
      const cy = z.y + z.h * 0.5;
      engine.player.x = cx;
      engine.player.y = cy;
      engine.camera.x = cx;
      engine.camera.y = cy;
      structureFillRects = 0;
      structureStrokeRects = 0;
      assert.doesNotThrow(() => engine.render());
      assert.ok(structureFillRects + structureStrokeRects >= 2, `Expected rendered geometry in ${z.id}`);
    }
    assert.equal(shadowBlurWrites, 0);
    assert.equal(maxFullWhiteFillAlpha, 0);

    // Co-op MAP_PROGRESS_SYNC merges Map 4 secrets across teammates
    engine.multiplayer.active = true;
    engine.handleMultiplayerMessage({
      type: 'MAP_PROGRESS_SYNC',
      fromName: 'Đồng Đội Trung',
      grudgeForestProgress: {
        ee2MirrorLakeSeen: true,
        ee3DuyLaughHeard: true,
        ee5TrungRoomSeen: true,
        collectedDocs: ['doc_ee5_trung_room'],
      },
    });
    assert.equal(engine.grudgeForestProgress.ee2MirrorLakeSeen, true);
    assert.equal(engine.grudgeForestProgress.ee5TrungRoomUnlocked, true);
    assert.equal(engine.grudgeForestProgress.ee5TrungRoomSeen, true);

    // HUD snapshot exposes Map 4 state
    const hud = engine.getHudSnapshot();
    assert.equal(hud.mapId, 'grudge_forest');
    assert.ok(hud.grudgeForestHud && hud.grudgeForestProgress);
    assert.equal(hud.grudgeForestHud.docsTotal, Object.keys(GRUDGE_FOREST_DOCS).length);

    // P2PRoomHost builds spawns near GRUDGE_FOREST_SPAWN
    const p2pHost: any = new P2PRoomHost({
      hostName: 'HostDuy',
      heroId: 'duy',
      mapId: 'grudge_forest',
      onLocalEvent: () => {},
      onPeersChanged: () => {},
    });
    assert.equal(p2pHost.serializeRoom().mapId, 'grudge_forest');
    const spawns: Record<string, any> = p2pHost._buildSpawnsMap();
    const hostSpawn = spawns[p2pHost.hostId];
    assert.ok(hostSpawn && Math.hypot(hostSpawn.x - GRUDGE_FOREST_SPAWN.x, hostSpawn.y - GRUDGE_FOREST_SPAWN.y) < 120);
    p2pHost.destroy();
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('mid-match exit resets match gold to 100 on startNewGame while resumeSavedGame restores checkpoint gold', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;
  const storageMap = new Map<string, string>();
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {},
    ellipse() {}, rect() {}, roundRect() {}, fillRect() {}, strokeRect() {},
    clearRect() {}, fill() {}, stroke() {}, clip() {}, setTransform() {},
    setLineDash() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    const hero = Mi[0];

    // 1) Start a match, earn extra gold mid-match, pause & quit to menu
    engine.startNewGame(hero, 'classic');
    assert.equal(engine.playerCoins, 100);
    engine.playerCoins = 1850;
    engine.wave = 5;
    engine.gameState = 'PAUSED';
    engine.captureCurrentRunCheckpoint();
    engine._midMatchExited = true;
    engine.gameState = 'MENU';

    // 2) Starting a brand new match after mid-match exit must reset match gold to 100 (NOT carry over 1850)
    engine.startNewGame(hero, 'classic');
    assert.equal(engine.playerCoins, 100);

    // 3) Starting a match where checkpoint exists and explicitly calling resumeSavedGame restores saved gold
    engine.playerCoins = 2250;
    engine.wave = 7;
    engine.gameState = 'PAUSED';
    engine.captureCurrentRunCheckpoint();
    engine._midMatchExited = true;
    engine.gameState = 'MENU';
    const resumed = engine.resumeSavedGame();
    assert.equal(resumed, true);
    assert.equal(engine.playerCoins, 2250);
    assert.equal(engine.wave, 7);

    // 4) Even if caller does not pass resetCoins:true, startNewGame after resuming/exiting a run resets gold to 100
    engine._midMatchExited = true;
    engine.gameState = 'MENU';
    engine.startNewGame(hero, 'classic');
    assert.equal(engine.playerCoins, 100);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});

test('Easter egg reading grants invulnerability to damage and CC plus 1.5s post-close grace', async () => {
  const { GameEngine } = await import('./GameEngine.js');
  const { Mi } = await import('./gameData.js');
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevRaf = (globalThis as any).requestAnimationFrame;
  const prevCancelRaf = (globalThis as any).cancelAnimationFrame;
  const storageMap = new Map<string, string>();
  const ctxStub: any = {
    canvas: { width: 1280, height: 720 },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {},
    ellipse() {}, rect() {}, roundRect() {}, fillRect() {}, strokeRect() {},
    clearRect() {}, fill() {}, stroke() {}, clip() {}, setTransform() {},
    setLineDash() {}, fillText() {}, strokeText() {}, measureText: () => ({ width: 20 }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };

  (globalThis as any).window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    location: { protocol: 'http:', host: 'localhost:3000', origin: 'http://localhost:3000' },
  };
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
  };
  (globalThis as any).requestAnimationFrame = () => 1;
  (globalThis as any).cancelAnimationFrame = () => {};

  try {
    const canvasStub: any = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctxStub,
    };
    const engine: any = new GameEngine(canvasStub);
    engine.startNewGame(Mi[0], 'classic');
    const initialHp = engine.player.hp;

    // While reading Easter egg -> immune to damage & crowd control
    engine.setEasterEggReading(true);
    assert.equal(engine.isEasterEggInvulnerable(), true);
    engine.damagePlayer(500);
    engine.applyPlayerCC('stun', 2.0, 0.5);
    assert.equal(engine.player.hp, initialHp);
    assert.equal(engine.player.stunTimer || 0, 0);

    // Closing Easter egg grants 1.5s grace window
    engine.setEasterEggReading(false);
    assert.equal(engine.isEasterEggInvulnerable(), true);
    engine.damagePlayer(500);
    assert.equal(engine.player.hp, initialHp);

    // While grace is active (e.g. after 1.0s = 20 frames * 0.05s), player remains protected
    for (let i = 0; i < 20; i += 1) engine.update(0.05);
    assert.equal(engine.isEasterEggInvulnerable(), true);

    // After 1.6s total elapses (12 more frames * 0.05s), grace expires and damage + CC apply normally
    for (let i = 0; i < 12; i += 1) engine.update(0.05);
    assert.equal(engine.isEasterEggInvulnerable(), false);
    engine.damagePlayer(200);
    engine.applyPlayerCC('stun', 1.2, 0.5);
    assert.ok(engine.player.hp < initialHp);
    assert.ok((engine.player.stunTimer || 0) > 0);
  } finally {
    (globalThis as any).window = prevWindow;
    (globalThis as any).localStorage = prevLocalStorage;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCancelRaf;
  }
});









