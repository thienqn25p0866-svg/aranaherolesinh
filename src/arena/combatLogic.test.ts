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
} from './combatLogic.ts';

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

test('Upgraded Arena Hero roster (14 heroes) and 220-item catalog satisfy exact design specs', async () => {
  const { Mi, zr, Ff } = await import('./gameData.js');
  const { HERO_SKILL_ICONS } = await import('./skillIcons.js');

  assert.equal(Mi.length, 14, 'Must preserve all 13 heroes + add Duy');
  const heroIds = new Set(Mi.map((h: any) => h.id));
  assert.equal(heroIds.size, 14);
  for (const id of ['dung', 'tin', 'kin', 'trung', 'eohyen', 'longhoi', 'duccong', 'gau', 'bao', 'danh', 'luan', 'taidu', 'nguyen', 'duy']) {
    assert.ok(heroIds.has(id), `Missing hero ${id}`);
  }

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

  assert.equal(computeDuyPassiveMultiplier(0), 1);
  assert.equal(computeDuyPassiveMultiplier(2.25), 2.75);
  assert.equal(computeDuyPassiveMultiplier(4.5), 4.5);
  assert.equal(computeDuyPassiveMultiplier(9.0), 4.5);

  assert.equal(DUY_DECOY_REFLECT_RATIO, 0.3);
  assert.equal(computeDuyDecoyBlastDamage(1000, 1, 100), 300);
  assert.equal(computeDuyDecoyBlastDamage(1000, 4.5, 100), 1350);
  assert.equal(computeDuyDecoyBlastDamage(0, 1, 100), 120);

  assert.equal(computeDuyC2ShurikenCount(0), 3);
  assert.equal(computeDuyC2ShurikenCount(29), 3);
  assert.equal(computeDuyC2ShurikenCount(30), 4);
  assert.equal(computeDuyC2ShurikenCount(95), 6);

  assert.equal(computeDuyC3ShurikenCount(0), 40);
  assert.equal(computeDuyC3ShurikenCount(30), 43);
  assert.equal(computeDuyC3ShurikenCount(120), 52);

  assert.equal(computeDuyC3ShurikenDamage(100, 1), 80); // 35 + 45
  assert.equal(computeDuyC3ShurikenDamage(100, 4.5), 360); // round(80 * 4.5)
  assert.equal(DUY_C3_HEAL_PER_HIT, 100);

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
