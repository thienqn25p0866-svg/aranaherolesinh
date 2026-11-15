import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BOSS_CC_SEC,
  TIN_RESONANCE_MAX,
  LONGHOI_MAX_BURN_STACKS,
  clampBossCcDuration,
  getBossCcDuration,
  getBossPowerModifiers,
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
} from './combatLogic.ts';

test('Boss CC scaling increases with wave and phase while strictly capped at 2.5s', () => {
  const w3p1 = getBossCcDuration(0.85, 3, 1, 'stun');
  const w9p2 = getBossCcDuration(0.85, 9, 2, 'stun');
  const w15p3 = getBossCcDuration(1.4, 15, 3, 'stun');
  const w30p3 = getBossCcDuration(3.0, 30, 3, 'slow');

  assert.ok(w9p2 > w3p1, 'Wave 9 phase 2 CC should exceed Wave 3 phase 1 CC');
  assert.ok(w15p3 > w9p2, 'Wave 15 phase 3 CC should exceed Wave 9 phase 2 CC');
  assert.ok(w15p3 <= MAX_BOSS_CC_SEC, 'Wave 15 CC must not exceed 2.5s');
  assert.equal(w30p3, MAX_BOSS_CC_SEC, 'Extreme wave/base CC must clamp at 2.5s');
  assert.equal(clampBossCcDuration(99), 2.5);
  assert.equal(clampBossCcDuration(-1), 0);
});

test('Boss power modifiers grant a subtle HP and damage boost across waves', () => {
  const early = getBossPowerModifiers(3);
  const late = getBossPowerModifiers(15);
  assert.ok(early.hpMultiplier >= 1.15);
  assert.ok(early.damageMultiplier >= 1.12);
  assert.ok(late.hpMultiplier > early.hpMultiplier);
  assert.ok(late.damageMultiplier > early.damageMultiplier);
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
  assert.equal(overload.c2c3RefundSec, 1.5);

  const refunded = applyTinBasicHitCooldownRefund([4.0, 6.0, 10.0]);
  assert.equal(refunded[0], 3.65);
  assert.equal(refunded[1], 5.65);
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
    assert.equal(mpClient.getCustomServerUrl(), '');
    const res = await mpClient.createRoom('MobileHero', 'tin');
    assert.equal(res.mode, 'p2p');
    assert.ok(res.room?.roomId?.startsWith('P2-'));
    mpClient.leaveRoom();
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

    // Host starts match -> BOTH Host and Peer must receive MATCH_STARTED
    host.startMatch();
    await new Promise((r) => setTimeout(r, 40));

    const hostStarted = hostEvents.find((e) => e.type === 'MATCH_STARTED');
    const peerStarted = peerEvents.find((e) => e.type === 'MATCH_STARTED');
    assert.ok(hostStarted, 'Host must receive MATCH_STARTED');
    assert.ok(peerStarted, 'Peer must receive MATCH_STARTED automatically when host starts');
    assert.equal(peerStarted.room.status, 'PLAYING');
    assert.ok(peerStarted.spawns[peer.playerId!], 'Peer spawn coordinates must be present');

    // Late P2P_HELLO recovery while match is already PLAYING also delivers MATCH_STARTED
    const beforeCount = peerEvents.filter((e) => e.type === 'MATCH_STARTED').length;
    host.handleMessage(peer.playerId!, { type: 'P2P_HELLO', playerName: 'DongDoi', heroId: 'tin' });
    await new Promise((r) => setTimeout(r, 30));
    const afterCount = peerEvents.filter((e) => e.type === 'MATCH_STARTED').length;
    assert.equal(afterCount, beforeCount + 1, 'Late P2P_HELLO during PLAYING must re-sync MATCH_STARTED');

    peer.destroy();
    host.destroy();
  } finally {
    (globalThis as any).RTCPeerConnection = prevRTC;
  }
});

test('Nguyen overheal converts 100% into stackable shield and scales strongly at low HP', async () => {
  const { computeNguyenOverhealConversion } = await import('./combatLogic.ts');

  // Full HP overheal -> 100% becomes shield up to cap (maxHp * 1.0 = 1500)
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
  assert.equal(overhealRes.nextHp, 1500);
  assert.equal(overhealRes.shieldAdded, 380);
  assert.equal(overhealRes.nextShield, 580);

  // Low HP triggers +60% healing amplification
  const lowHpRes = computeNguyenOverhealConversion({
    currentHp: 450,
    maxHp: 1500,
    currentShield: 0,
    rawHeal: 300,
    lowHpBonusAmp: 0.6,
  });
  assert.equal(lowHpRes.isLowHp, true);
  assert.equal(lowHpRes.totalEffectiveHeal, 480);
  assert.equal(lowHpRes.actualHpHealed, 480);
  assert.equal(lowHpRes.nextHp, 930);
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

test('Upgraded Arena Hero roster (13 heroes) and 220-item catalog satisfy exact design specs', async () => {
  const { Mi, zr, Ff } = await import('./gameData.js');
  const { HERO_SKILL_ICONS } = await import('./skillIcons.js');

  assert.equal(Mi.length, 13, 'Must preserve all 10 heroes + add Luan, Tai Du, Nguyen');
  const heroIds = new Set(Mi.map((h: any) => h.id));
  assert.equal(heroIds.size, 13);
  for (const id of ['dung', 'tin', 'kin', 'trung', 'eohyen', 'longhoi', 'duccong', 'gau', 'bao', 'danh', 'luan', 'taidu', 'nguyen']) {
    assert.ok(heroIds.has(id), `Missing hero ${id}`);
  }

  const danh = Mi.find((h: any) => h.id === 'danh');
  assert.ok(danh);
  assert.equal(danh.skills[2].cooldown, 22);

  const luan = Mi.find((h: any) => h.id === 'luan');
  assert.ok(luan);
  assert.equal(luan.stats.hp, 950);
  assert.equal(luan.stats.damage, 40);
  assert.equal(luan.stats.ap, 55);
  assert.equal(luan.skills[1].aimType, 'CIRCLE_FREE');

  const taidu = Mi.find((h: any) => h.id === 'taidu');
  assert.ok(taidu);
  assert.equal(taidu.stats.hp, 1050);
  assert.equal(taidu.stats.damage, 52);
  assert.equal(taidu.skills[2].aimType, 'PATH');

  const nguyen = Mi.find((h: any) => h.id === 'nguyen');
  assert.ok(nguyen);
  assert.equal(nguyen.stats.hp, 1500);
  assert.equal(nguyen.stats.damage, 35);
  assert.equal(nguyen.stats.ap, 45);

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

  for (const h of Mi) {
    assert.ok(Array.isArray(Ff[h.id]) && Ff[h.id].length >= 1, `Missing build presets for ${h.id}`);
    for (const preset of Ff[h.id]) {
      for (const itemId of preset.items) {
        assert.ok(itemIds.has(itemId), `Preset ${preset.id} references unknown item ${itemId}`);
      }
    }
  }

  for (const id of heroIds) {
    assert.ok(HERO_SKILL_ICONS[id], `Missing skill icon entries for ${id}`);
    for (const k of ['atk', 'passive', 'c1', 'c2', 'c3']) {
      assert.ok(HERO_SKILL_ICONS[id][k], `Missing ${id}.${k} icon`);
    }
  }
});




