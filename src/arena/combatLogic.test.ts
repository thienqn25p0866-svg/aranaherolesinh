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
  THIEN_GOD_MODE_REGEN_PER_SEC,
  THIEN_C1_SWORD_COUNT,
  computeThienPassiveGain,
  computeThienCooldownTickRate,
  computeThienAscendedModifiers,
  computeThienC1SwordDamage,
  computeThienC2Detonation,
  computeThienC4JudgementDamage,
  computeThienDamageBreakdownTotal,
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

test('Upgraded Arena Hero roster (16 standard + 1 secret Founder = 17 heroes) and 220-item catalog satisfy exact design specs', async () => {
  const { Mi, zr, Ff } = await import('./gameData.js');
  const { HERO_SKILL_ICONS } = await import('./skillIcons.js');

  assert.equal(Mi.length, 17, 'Must preserve all 16 standard heroes + secret Founder hero Thien');
  assert.equal(Mi.filter((h: any) => !h.isSecretFounder).length, 16, 'Standard unlocked roster must remain 16 heroes');
  const heroIds = new Set(Mi.map((h: any) => h.id));
  assert.equal(heroIds.size, 17);
  for (const id of ['dung', 'tin', 'kin', 'trung', 'eohyen', 'longhoi', 'duccong', 'gau', 'bao', 'danh', 'luan', 'taidu', 'nguyen', 'duy', 'phong', 'dang', 'thien']) {
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

test('MOBA hero role classification & filtering covers all 17 champions accurately', async () => {
  const { Mi } = await import('./gameData.js');
  assert.equal(Mi.length, 17);
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
    const heroIds = ['dung', 'tin', 'kin', 'trung', 'eohyen', 'longhoi', 'gau', 'duccong', 'bao', 'luan', 'danh', 'taidu', 'nguyen', 'duy', 'phong', 'dang', 'thien'];
    for (const id of heroIds) {
      R.lastCooldowns.clear();
      R.playHeroSelect(id);
      R.playHeroSkillPreview(id, 'passive');
      R.playHeroSkillPreview(id, 'atk');
      R.playHeroSkillPreview(id, 'c3');
    }
    R.lastCooldowns.clear();
    R.playHeroSkillPreview('thien', 'c1');
    R.playHeroSkillPreview('thien', 'c2');
    R.playHeroSkillPreview('thien', 'c4');
    R.playThienBasic();
    R.playThienSwords();
    R.playThienTimeZone();
    R.playThienPortal();
    R.playThienSunUlt();
    R.playThienAscend();
    R.playThienGodMode();
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






