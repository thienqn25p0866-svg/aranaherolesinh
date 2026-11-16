import { Se, Ce, cm, Cf, _f, Mi, zr, Si, Ff, hm, R, Pf, xa, um } from "./gameData";
import { drawHeroWeapon, drawBaoDagger, drawUpgradedProjectile, drawUpgradedSlash, drawCurvedLightning, drawImpactBurst, drawGroundCrack, drawHeroBody, drawMonsterEntity, drawBossWeapon, drawDanhDragonForm, drawLuanPortal, drawLuanRift, drawLuanBeam, drawTaiDuDrone, drawTaiDuTurret, drawNguyenSatellites, drawNguyenSanctuaryWave, drawTaiDuCarpetStrike, drawNguyenSanctuaryField, drawNguyenBastionAura } from "./weaponRenderer";
import { MAX_WAVES, BOSS_WAVES, getBossStageCcDuration, computeLongHoiBurnApplication, computeLongHoiBurnDps, getBossCcDuration, getBossPowerModifiers, computeTinStackGain, computeTinCooldownTickRate, applyTinBasicHitCooldownRefund, TIN_EMPOWERED_SKILL_MULT, computeLuanPortalBeamTransform, computeLuanC1ShardDamage, computeLuanRiftTickDamage, LUAN_RIFT_TICK_INTERVAL, LUAN_RIFT_MAX_SEGMENTS, LUAN_C3_MONOCHROME_DURATION, computeDanhDragonFormModifiers, cycleTaiDuDroneMode, getTaiDuDroneProfile, computeNguyenOverhealConversion, computeCameraViewportConfig, screenToWorldWithCamera } from "./combatLogic";
import { mpClient } from "./multiplayerClient";
export class GameEngine {
  constructor(s) {
    this.selectedHeroId = "eohyen", this.currentLang = "vi", this.gameState = "MENU", this.playerCoins = 100, this.currentWaveNumber = 1, this.highestWaveCleared = 0, this.heroGear = um(), this.inventory = [], this.nextUid = 1, this.comboManager = new Pf(), this.moveInput = { x: 0, y: 0 }, this.tapDestination = null, this.tapRipple = null, this.aimState = { active: false, skillIdx: null, aimType: null, angle: 0, targetX: 0, targetY: 0, cancelled: false, range: 0, radius: 0, hasTargetInRange: false }, this.wave = 1, this.waveTotal = 10, this.waveSpawned = 0, this.waveKilled = 0, this.waveKilledThisWave = 0, this.waveBossKilledThisWave = false, this.waveElapsedTime = 0, this.waveRewardClaimed = false, this.totalKilled = 0, this.spawnTimer = 0, this.elapsedTime = 0, this.nextEntityId = 1, this.camera = { x: Se / 2, y: Ce / 2 }, this.shakeTimer = 0, this.shakeMagnitude = 0, this.screenFlashWhite = 0, this.waveCleared = false, this.waitingReward = false, this.enemies = [], this.projectiles = [], this.zones = [], this.icePillars = [], this.groundCracks = [], this.scorchMarks = [], this.frostTracks = [], this.spatialTears = [], this.frostBarrages = [], this.lavaPools = [], this.bossWarnings = [], this.bossBeams = [], this.bossShockRings = [], this.afterimages = [], this.lightnings = [], this.slashes = [], this.impactBursts = [], this.particles = [], this.floatingTexts = [], this.xpOrbs = [], this.deadCorpses = [], this.bloodParticles = [], this.redCrystals = [], this.flameParticles = [], this.smokePuffs = [], this.rocketProjectiles = [], this.giantMeteors = [], this.galaxyVortices = [], this.cataclysmicExplosions = [], this.tinCrystals = [], this.shadowClones = [], this.dragonWaves = [], this.skyDragons = [], this.luanPortals = [], this.luanRifts = [], this.luanBeams = [], this.taiduTurrets = [], this.taiduCarpetStrikes = [], this.nguyenSanctuaryFields = [], this.nguyenSanctuaryWaves = [], this.gameSettings = { soundEnabled: true, volume: 0.45, screenShake: true, showDamageNumbers: true, particles: true, layoutMode: "auto", portraitFov: "balanced" }, this.multiplayer = { active: false, isHost: false, roomId: null, playerCount: 1, powerMultiplier: 1, localDowned: false, remotePlayers: /* @__PURE__ */ new Map(), playerSyncTimer: 0, worldSyncTimer: 0, vfxQueue: [], burnSyncMap: /* @__PURE__ */ new Map(), burnSyncTimer: 0, seenBossHazardIds: /* @__PURE__ */ new Set(), pendingSyncMessages: [], reviveTargetId: null, reviveProgress: 0, reviveSendCooldown: 0, _lastRemoteDrawTime: 0 }, this.viewW = window.innerWidth, this.viewH = window.innerHeight, this.animFrameId = null, this.lastTime = performance.now(), this.loop = (a) => {
      let l = (a - this.lastTime) / 1e3, m = Number.isFinite(l) && l > 0 ? Math.min(l, 0.05) : 0;
      this.lastTime = a;
      try {
        this.update(m), this.render();
      } catch (err) {
        console.error("GameEngine loop error:", err);
      }
      if (this.animFrameId !== null) this.animFrameId = requestAnimationFrame(this.loop);
    }, this.canvas = s, this.ctx = s.getContext("2d"), this.currentHero = Mi[4], this.loadSave(), this.initPlayer(), this.resizeCanvas();
  }
  getCoopPowerMultiplier() {
    return this.multiplayer.active ? Math.max(1, this.multiplayer.powerMultiplier || 1) : 1;
  }
  isCoopHost() {
    return !this.multiplayer.active || this.multiplayer.isHost;
  }
  queueVfx(type, data) {
    if (!this.multiplayer.active) return;
    this.multiplayer.vfxQueue.length < 64 && this.multiplayer.vfxQueue.push({ type, ...data });
  }
  emitAllySupport({ x, y, radius = 240, heal = 0, shield = 0, label = "", color = "#34D399" }) {
    if (!this.multiplayer.active || !mpClient.isConnected()) return;
    mpClient.send({ type: "ALLY_SUPPORT", x: Math.round(x), y: Math.round(y), radius: Math.round(radius), heal: Math.round(heal), shield: Math.round(shield), label, color });
  }
  resizeCanvas() {
    let s = this.canvas.getBoundingClientRect();
    this.viewW = Math.max(1, Math.round(s.width || window.innerWidth || 1280)), this.viewH = Math.max(1, Math.round(s.height || window.innerHeight || 720));
    let a = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.viewW * a), this.canvas.height = Math.round(this.viewH * a);
  }
  getCameraViewport() {
    return computeCameraViewportConfig({
      viewW: this.viewW,
      viewH: this.viewH,
      layoutMode: this.gameSettings?.layoutMode || "auto",
      fovPreset: this.gameSettings?.portraitFov || "balanced"
    });
  }
  screenToWorld(s, a) {
    return screenToWorldWithCamera(s, a, this.camera.x, this.camera.y, this.getCameraViewport());
  }
  loadSave() {
    try {
      let s = localStorage.getItem(cm);
      if (s) {
        let a = JSON.parse(s);
        if (typeof a.coins == "number" && (this.playerCoins = Math.max(0, a.coins)), typeof a.currentWave == "number" && (this.currentWaveNumber = Math.max(1, Math.min(MAX_WAVES, a.currentWave))), typeof a.highestWave == "number" && (this.highestWaveCleared = Math.max(0, a.highestWave)), typeof a.selectedHeroId == "string") {
          let l = Mi.find((m) => m.id === a.selectedHeroId);
          l && (this.selectedHeroId = l.id, this.currentHero = l);
        }
        if (a.heroGear && typeof a.heroGear == "object") for (let l of Mi.map((m) => m.id)) a.heroGear[l] && (this.heroGear[l] = Object.assign(xa(), a.heroGear[l]));
        Array.isArray(a.inventory) && (this.inventory = a.inventory.filter((l) => !!(l && typeof l == "object" && "itemId" in l && typeof l.itemId == "string"))), typeof a.nextUid == "number" && (this.nextUid = Math.max(this.nextUid, a.nextUid));
      }
    } catch (s) {
      console.warn("Failed loading save:", s);
    }
  }
  saveGame() {
    try {
      let s = { coins: this.playerCoins, currentWave: this.currentWaveNumber, highestWave: this.highestWaveCleared, selectedHeroId: this.selectedHeroId, heroGear: this.heroGear, inventory: this.inventory, nextUid: this.nextUid };
      localStorage.setItem(cm, JSON.stringify(s));
    } catch (s) {
      console.warn("Failed saving game:", s);
    }
  }
  getHeroGearStats(s) {
    let a = this.heroGear[s] || {}, l = { atk: 0, matk: 0, hp: 0, hpRegen: 0, ms: 0, as: 0, crit: 0, critExtraDmg: 0, cdr: 0, lifesteal: 0, reflect: 0, dmgRed: 0, lightningChance: 0, lightningDmg: 0, frostThornsChance: 0, killHeal: 0, autoShield20: 0, autoShield20Cd: 45, dashAttackSpeed: 0, skillBurstChance: 0, skillBurstDmg: 0, autoShield30: 0, autoShield30Cd: 50, bossDmgBonus: 0, hitProcCount: 0, hitProcDmg: 0, healAmp: 0, bossSkillExtraDmg: 0, autoShield25: 0, frostSlowDur: 0, aoeAmp: 0, autoHeal20: 0, autoHeal20Cd: 60, waveStartShield: 0, skillMoveSpeedBonus: 0, equippedCount: 0 };
    for (let m of ["weapon", "armor", "boots", "gloves", "necklace", "relic"]) {
      let c = a[m];
      if (!c) continue;
      let g = Si[c.itemId];
      if (!g) continue;
      l.equippedCount++;
      let p = g.stats || {};
      p.atk && (l.atk += p.atk), p.matk && (l.matk += p.matk), p.hp && (l.hp += p.hp), p.hpRegen && (l.hpRegen += p.hpRegen), p.ms && (l.ms += p.ms), p.as && (l.as += p.as), p.crit && (l.crit += p.crit), p.critExtraDmg && (l.critExtraDmg += p.critExtraDmg), p.cdr && (l.cdr += p.cdr), p.lifesteal && (l.lifesteal += p.lifesteal), p.reflect && (l.reflect += p.reflect), p.dmgRed && (l.dmgRed += p.dmgRed), p.lightningChance && (l.lightningChance = p.lightningChance, l.lightningDmg = p.lightningDmg || 35), p.frostThornsChance && (l.frostThornsChance = p.frostThornsChance), p.killHeal && (l.killHeal += p.killHeal), p.autoShield20 && (l.autoShield20 = Math.max(l.autoShield20, p.autoShield20)), p.dashAttackSpeed && (l.dashAttackSpeed = Math.max(l.dashAttackSpeed, p.dashAttackSpeed)), p.skillBurstChance && (l.skillBurstChance = p.skillBurstChance, l.skillBurstDmg = p.skillBurstDmg || 40), p.autoShield30 && (l.autoShield30 = Math.max(l.autoShield30, p.autoShield30)), p.bossDmgBonus && (l.bossDmgBonus += p.bossDmgBonus), p.hitProcCount && (l.hitProcCount = p.hitProcCount, l.hitProcDmg = Math.max(l.hitProcDmg, p.hitProcDmg || 0)), p.healAmp && (l.healAmp += p.healAmp), p.bossSkillExtraDmg && (l.bossSkillExtraDmg += p.bossSkillExtraDmg), p.autoShield25 && (l.autoShield25 = Math.max(l.autoShield25, p.autoShield25)), p.frostSlowDur && (l.frostSlowDur = Math.max(l.frostSlowDur, p.frostSlowDur)), p.aoeAmp && (l.aoeAmp += p.aoeAmp), p.autoHeal20 && (l.autoHeal20 = Math.max(l.autoHeal20, p.autoHeal20), p.autoHeal20Cd && (l.autoHeal20Cd = p.autoHeal20Cd)), p.waveStartShield && (l.waveStartShield += p.waveStartShield), p.skillMoveSpeedBonus && (l.skillMoveSpeedBonus = Math.max(l.skillMoveSpeedBonus, p.skillMoveSpeedBonus));
    }
    return l.cdr = Math.min(0.45, l.cdr), l.ms = Math.min(0.5, l.ms), l.lifesteal = Math.min(0.25, l.lifesteal), l.dmgRed = Math.min(0.35, l.dmgRed), s === "kin" ? (l.as = Math.min(0.85, l.as), l.crit = Math.min(0.92, l.crit * 1.65 + 0.35), l.critExtraDmg = (l.critExtraDmg || 0) + Math.round((l.atk || 0) * 2)) : s === "longhoi" ? (l.as = Math.min(0.45, l.as), l.crit = Math.min(0.55, l.crit + 0.08)) : s === "taidu" ? (l.as = Math.min(0.65, l.as), l.crit = Math.min(0.6, l.crit + 0.14)) : s === "nguyen" ? (l.as = Math.min(0.55, l.as), l.crit = Math.min(0.4, l.crit + 0.08)) : (l.as = Math.min(0.6, l.as), l.crit = Math.min(0.5, l.crit)), l;
  }
  initPlayer() {
    let s = this.getHeroGearStats(this.currentHero.id), a = this.currentHero.stats.hp + s.hp;
    this.duccong_pads = [null, null, null];
    this.player = { x: Se / 2, y: Ce / 2, radius: 22, facing: 0, hp: a, maxHp: a, shield: 0, shieldTimer: 0, shieldExplodeDmg: 0, shieldExplodeRadius: 0, shieldDmgRed: 0, xp: 0, xpToNext: 100, level: 1, damageMultiplier: 1, attackSpeedBonus: 0, attackTimer: 0, attackAnimTimer: 0, attackAnimAngle: 0, weaponAttackDuration: 0.22, weaponSkillTimer: 0, weaponSkillDur: 0.46, weaponSkillIdx: -1, weaponCritTimer: 0, walkCyclePhase: 0, moveSpeedFactor: 0, attackSwingParity: 1, bowRecoilTimer: 0, cooldowns: [0, 0, 0], dung_passive: 0, dung_c3_buff_timer: 0, berserkTimer: 0, berserkHealPerHit: 22, tin_c1_charges: 0, tin_c1_recast_timer: 0, tin_c1_refunded_c2: false, tin_monochrome_realm_timer: 0, tin_moveAccumulator: 0, tin_resonance_stacks: 0, tin_resonance_timer: 0, tin_empowered: false, kin_passive: 0, kin_asBuffTimer: 0, kin_c2_lifestealTimer: 0, trung_passive: 0, trung_orbs: null, eohyen_passive: 0, eohyen_heal_cd: 0, longhoi_msBuffTimer: 0, longhoi_nextAtkBonus: 0, longhoi_sustain_sec_timer: 0, longhoi_sustain_pool: 0, duccong_passive: 0, duccong_regen_timer: 5, skillRefundAccumulated: [0, 0, 0], bonusLevelHp: 0, bonusLevelAtk: 0, bonusLevelAp: 0, armor: 0, gau_rage: 0, gau_cuongHungTimer: 0, gau_noDmgTimer: 0, gau_basicStep: 0, gau_basicResetTimer: 0, gau_c1_step: 0, gau_c1_windowTimer: 0, gau_c1_basicCancelPrimed: false, gau_c1_comboHits: {}, gau_c1_afterStep3Timer: 0, gau_c2_guardTimer: 0, gau_c2_stacks: 0, gau_c2_recastLock: 0, gau_c3_pendingImpact: null, gau_animTimer: 0, gau_animDur: 0.22, gau_animAngle: 0, gau_animKind: "none", gau_c2_counterWaveTimer: 0, gau_leapElapsed: 0, gau_leapDur: 0.24, gau_landBounceTimer: 0, bao_basicStep: 0, bao_basicResetTimer: 0, bao_c1_recastTimer: 0, bao_c1_awaitingSecond: false, bao_c1_refundedThisCycle: false, bao_stealthTimer: 0, bao_stealthLockTimer: 0, bao_queuedC1Hits: [], bao_queuedC3Finisher: null, bao_basicDir: 1, bao_glideTimer: 0, bao_stealthFade: 0, bao_emergeTimer: 0, danh_basicStep: 0, danh_basicResetTimer: 0, danh_basicHitCount: 0, danh_khaiSonTimer: 0, danh_c1_step: 0, danh_c1_windowTimer: 0, danh_c1_hitSteps: 0, danh_longNgamTimer: 0, danh_thienPhatTimer: 0, danh_dragonTimer: 0, danh_swingDir: 1, danh_animKind: "none", danh_animTimer: 0, danh_animDur: 0.22, luan_c2_recastLock: 0, luan_c3Charge: null, luan_lastRiftPt: null, luan_vampTextCd: 0, taidu_droneMode: "attack", taidu_droneAngle: 0, taidu_droneX: Se / 2 - 42, taidu_droneY: Ce / 2 - 30, taidu_droneFacing: 0, taidu_droneFireTimer: 0, taidu_droneHealTimer: 0, taidu_droneMuzzleTimer: 0, taidu_droneShieldAccum: 0, taidu_droneTargetX: null, taidu_droneTargetY: null, taidu_barrelParity: 1, nguyen_rescueCd: 0, nguyen_rescueFlashTimer: 0, nguyen_satellitesTimer: 0, nguyen_satellitesRot: 0, nguyen_satellitesHealTimer: 0, nguyen_hotQueue: [], chargeState: { active: false, skillIdx: 0, kind: null, elapsed: 0, maxDur: 2.5, angle: 0, targetX: Se / 2, targetY: Ce / 2 }, dashBuffAsTimer: 0, autoShield20Timer: 0, autoShield30Timer: 0, autoHeal20Timer: 0, hpRegenTick: 0, dashActive: false, dashVx: 0, dashVy: 0, dashTimer: 0, dashDamage: 0, dashHitIds: /* @__PURE__ */ new Set(), dashKind: "none", hitFlash: 0, totalDamage: 0, stunTimer: 0, rootTimer: 0, slowTimer: 0, slowFactor: 0, burnTimer: 0, burnDps: 0, burnTickTimer: 0, ccResistTimer: 0 };
  }
  computeHeroStats() {
    if (!this.currentHero) return;
    let s = this.getHeroGearStats(this.currentHero.id), a = this.player.maxHp || this.currentHero.stats.hp, l = this.currentHero.stats.hp + (this.player.bonusLevelHp || 0) + (s.hp || 0), m = l - a;
    this.player.maxHp = l, m > 0 ? this.player.hp = Math.min(this.player.maxHp, (this.player.hp || l) + m) : this.player.hp = Math.min(this.player.maxHp, this.player.hp || l);
  }
  getEffectiveDamage() {
    let s = this.getHeroGearStats(this.currentHero.id), a = this.currentHero.stats.damage + (this.player.bonusLevelAtk || 0) + s.atk;
    return Math.round(a * this.player.damageMultiplier);
  }
  getEffectiveAP() {
    let s = this.getHeroGearStats(this.currentHero.id);
    return Math.round(((this.currentHero.stats.ap || 0) + (this.player.bonusLevelAp || 0) + (s.matk || 0)) * this.player.damageMultiplier);
  }
  getEffectiveAttackInterval() {
    let s = this.getHeroGearStats(this.currentHero.id), a = 1 + this.player.attackSpeedBonus + s.as;
    this.player.berserkTimer > 0 && (a += 0.25), this.player.dung_c3_buff_timer > 0 && (a += 0.9), this.player.kin_asBuffTimer > 0 && (a += 0.35), this.player.dashBuffAsTimer > 0 && (a += 0.2), this.currentHero.id === "gau" && this.player.gau_cuongHungTimer > 0 && (a += 0.15), this.currentHero.id === "danh" && this.player.danh_dragonTimer > 0 && (a += computeDanhDragonFormModifiers(true).attackSpeedMult - 1);
    let l = this.currentHero.stats.attackInterval || 0.55;
    return Math.max(0.09, l / a);
  }
  getEffectiveMoveSpeed() {
    if (this.player.stunTimer > 0 || this.player.rootTimer > 0) return 0;
    let s = 1 + this.getHeroGearStats(this.currentHero.id).ms, tdSpeed = this.currentHero.id === "taidu" ? getTaiDuDroneProfile(this.player.taidu_droneMode || "attack").pursuitSpeedBonus || 0 : 0;
    return this.player.berserkTimer > 0 && (s += 0.15), this.player.longhoi_msBuffTimer > 0 && (s += 0.12), this.currentHero.id === "bao" && this.player.bao_stealthTimer > 0 && (s += 0.25), this.currentHero.id === "danh" && this.player.danh_dragonTimer > 0 && (s += 0.2), this.currentHero.id === "danh" && this.player.chargeState.active && (s *= 0.55), this.player.slowTimer > 0 && (s *= Math.max(0.35, 1 - this.player.slowFactor)), (this.currentHero.stats.speed + tdSpeed) * 2.15 * s;
  }
  isBossImmune(s) {
    return false;
  }
  notifyBossImmune(s, a = "MI\u1EC4N NHI\u1EC4M") {
    (s.immuneTextCd || 0) <= 0 && (s.immuneTextCd = 1.4, this.addFloatingText(s.x, s.y - s.radius - 22, `\u{1F6E1}\uFE0F ${a}`, "#FDE047", 14));
  }
  interruptPlayerChargeIfActive() {
    if (!this.player.chargeState.active) return;
    let s = this.player.chargeState.skillIdx, a = this.getHeroGearStats(this.currentHero.id), l = (this.currentHero.skills[s]?.cooldown || 10) * 0.5 * (1 - a.cdr);
    this.player.chargeState.active = false, this.player.chargeState.kind = null, this.player.chargeState.elapsed = 0, this.aimState.active = false, this.player.cooldowns[s] = Math.max(this.player.cooldowns[s], l), this.currentHero.id === "danh" && s === 0 && (this.player.danh_c1_step = 0, this.player.danh_c1_windowTimer = 0, this.player.danh_c1_hitSteps = 0), this.comboManager.record({ heroId: this.currentHero.id, action: "charge_interrupted", hitCount: 0 }), this.addFloatingText(this.player.x, this.player.y - 38, `\u26A0\uFE0F NG\u1EAET T\u1EE4 L\u1EF0C! H\u1ED2I ${l.toFixed(1)}s`, "#F87171", 15);
  }
  applyPlayerCC(s, a, l = 0, m = this.player.x, c = this.player.y) {
    if (this.currentHero.id === "dung" && this.player.dung_c3_buff_timer > 0 && s !== "burn") {
      this.player.ccResistTimer <= 0 && (this.player.ccResistTimer = 0.6, this.addFloatingText(this.player.x, this.player.y - 30, "\u{1F6E1}\uFE0F MI\u1EC4N KH\u1ED0NG!", "#FDE047", 14));
      return;
    }
    if (this.currentHero.id === "danh" && (this.player.chargeState.active || this.player.danh_animTimer > 0 || this.player.danh_dragonTimer > 0) && s !== "burn") {
      this.player.ccResistTimer <= 0 && (this.player.ccResistTimer = 0.6, this.addFloatingText(this.player.x, this.player.y - 30, "\u{1F6E1}\uFE0F MI\u1EC4N KH\u1ED0NG!", "#FBBF24", 14));
      return;
    }
    if (!(this.player.hp <= 0 || this.player.dashActive)) if (s === "knockback") {
      this.interruptPlayerChargeIfActive();
      let g = this.player.x - m, p = this.player.y - c, h = Math.hypot(g, p) || 1, f = l || 65;
      this.player.x = Math.max(this.player.radius + 14, Math.min(Se - this.player.radius - 14, this.player.x + g / h * f)), this.player.y = Math.max(this.player.radius + 14, Math.min(Ce - this.player.radius - 14, this.player.y + p / h * f)), this.tapDestination = null, this.spawnParticles(this.player.x, this.player.y, "#F8FAFC", 8, 50, 140, 3, 0.3), this.addFloatingText(this.player.x, this.player.y - 26, "\u{1F4A8} \u0110\u1EA8Y L\xD9I!", "#FCA5A5", 14);
    } else if (s === "stun") {
      if (this.player.ccResistTimer > 0) return;
      this.interruptPlayerChargeIfActive(), this.player.stunTimer = Math.max(this.player.stunTimer, a), this.player.ccResistTimer = a + 0.65, this.tapDestination = null, this.aimState.active = false, this.spawnParticles(this.player.x, this.player.y, "#FACC15", 10, 40, 130, 3.2, 0.35), this.addFloatingText(this.player.x, this.player.y - 30, `\u{1F4AB} CHO\xC1NG ${a.toFixed(1)}s!`, "#FACC15", 15);
    } else if (s === "root") this.interruptPlayerChargeIfActive(), this.player.rootTimer = Math.max(this.player.rootTimer, a), this.tapDestination = null, this.spawnParticles(this.player.x, this.player.y, "#C084FC", 10, 35, 110, 3, 0.35), this.addFloatingText(this.player.x, this.player.y - 28, `\u26D3\uFE0F TR\xD3I CH\xC2N ${a.toFixed(1)}s!`, "#C084FC", 15);
    else if (s === "slow") {
      let g = Math.min(0.65, l || 0.45);
      this.player.slowFactor = Math.max(this.player.slowFactor, g), this.player.slowTimer = Math.max(this.player.slowTimer, a), this.addFloatingText(this.player.x, this.player.y - 22, `\u2744\uFE0F L\xC0M CH\u1EACM ${Math.round(g * 100)}%`, "#38BDF8", 13);
    } else s === "burn" && (this.player.burnTimer = Math.max(this.player.burnTimer, a), this.player.burnDps = Math.max(this.player.burnDps, l || 16), this.addFloatingText(this.player.x, this.player.y - 24, "\u{1F525} THI\xCAU \u0110\u1ED0T!", "#F97316", 13));
  }
  healPlayer(s, a = "HEAL", l) {
    if (s <= 0 || this.player.hp <= 0) return 0;
    if (this.currentHero.id === "nguyen") {
      let conv = computeNguyenOverhealConversion({
        currentHp: this.player.hp,
        maxHp: this.player.maxHp,
        currentShield: this.player.shield || 0,
        rawHeal: s,
        healAmp: this.getHeroGearStats("nguyen").healAmp || 0,
        lowHpThreshold: 0.45,
        lowHpBonusAmp: 0.35,
        shieldCapRatio: 0.65,
        convertOverheal: true
      });
      let healedHp = conv.actualHpHealed || 0, gained = healedHp + conv.shieldAdded;
      if (gained <= 0) return 0;
      this.player.hp = conv.nextHp;
      if (conv.shieldAdded > 0) {
        this.player.shield = conv.nextShield;
        this.player.shieldTimer = Math.max(this.player.shieldTimer || 0, 12);
      }
      a !== "REGEN_QUIET" && a !== "LIFESTEAL_QUIET" && a !== "SILENT_VAMP" && R.playHeal();
      let msg = l || (healedHp > 0 && conv.shieldAdded > 0 ? `+${healedHp} HP · +${conv.shieldAdded} KHIÊN` : conv.shieldAdded > 0 ? `+${conv.shieldAdded} KHIÊN ẢO` : `+${healedHp} HP`);
      this.addFloatingText(this.player.x, this.player.y - 16, msg, conv.shieldAdded > 0 ? "#FDE047" : "#34D399", conv.shieldAdded > 0 ? 15 : 14);
      this.spawnParticles(this.player.x, this.player.y, conv.shieldAdded > 0 ? "#FDE047" : "#34D399", 7, 25, 95, 3, 0.4);
      return gained;
    }
    let m = this.player.maxHp - this.player.hp;
    if (m <= 0) return 0;
    let d = Math.round(s * (1 + (this.getHeroGearStats(this.currentHero.id).healAmp || 0))), c = Math.min(m, d);
    return c <= 0 ? 0 : (this.player.hp += c, a !== "REGEN_QUIET" && a !== "LIFESTEAL_QUIET" && a !== "SILENT_VAMP" && R.playHeal(), a === "SILENT_VAMP" ? this.spawnParticles(this.player.x, this.player.y, "#C084FC", 3, 18, 45, 2.2, 0.25) : a === "LIFESTEAL" || a === "LIFESTEAL_QUIET" ? (this.addFloatingText(this.player.x, this.player.y - 14, l || `+${c} H\xDAT M\xC1U`, a === "LIFESTEAL_QUIET" && this.currentHero.id === "luan" ? "#C084FC" : "#FB7185", 14), this.spawnFlameParticles(this.player.x, this.player.y, this.currentHero.id === "luan" ? "blue" : "red", 5, 20, 60)) : (this.addFloatingText(this.player.x, this.player.y - 14, l || `+${c} HP`, "#34D399", 14), this.spawnParticles(this.player.x, this.player.y, "#34D399", 7, 25, 90, 3, 0.4)), c);
  }
  addPlayerShield(s, a, l = 0, m = 0, c = 0) {
    let g = Math.round(s);
    this.player.shield = Math.max(this.player.shield, g), this.player.shieldTimer = Math.max(this.player.shieldTimer, a), l > 0 && (this.player.shieldExplodeDmg = l), m > 0 && (this.player.shieldExplodeRadius = m), c > 0 && (this.player.shieldDmgRed = Math.max(this.player.shieldDmgRed, c)), this.addFloatingText(this.player.x, this.player.y - 22, `KHI\xCAN +${g}`, "#38BDF8", 15), R.playHeal();
  }
  addShake(s, a) {
    this.gameSettings.screenShake && (this.shakeMagnitude = Math.max(this.shakeMagnitude, s), this.shakeTimer = Math.max(this.shakeTimer, a));
  }
  addFloatingText(s, a, l, m, c = 15) {
    (this.gameSettings.showDamageNumbers || l.startsWith("+") || l.includes("LV") || l.includes("M\xC0N")) && this.floatingTexts.push({ x: s + (Math.random() - 0.5) * 16, y: a - 14, vy: -42, text: l, color: m, life: 0, maxLife: 0.75, size: c });
  }
  spawnImpactBurst(x, y, color = "#38BDF8", isCrit = false, angle = 0) {
    this.impactBursts.length < 24 && this.impactBursts.push({ x, y, color, isCrit, angle, radius: isCrit ? 34 : 20, life: 0, maxLife: isCrit ? 0.24 : 0.17 });
  }
  spawnParticles(s, a, l, m, c = 40, g = 150, p = 3.5, h = 0.45) {
    let cap = Math.max(0, 140 - this.particles.length);
    for (let f = 0, lim = Math.min(m, cap); f < lim; f++) {
      let v = Math.random() * Math.PI * 2, T = c + Math.random() * (g - c);
      this.particles.push({ x: s, y: a, vx: Math.cos(v) * T, vy: Math.sin(v) * T, radius: p * (0.6 + Math.random() * 0.7), color: l, life: 0, maxLife: h * (0.7 + Math.random() * 0.5) });
    }
  }
  spawnFlameParticles(s, a, l = "red", m = 6, c = 30, g = 100) {
    for (let p = 0; p < m; p++) {
      let h = -Math.PI / 2 + (Math.random() - 0.5) * 1.5, f = c + Math.random() * (g - c);
      this.flameParticles.push({ x: s + (Math.random() - 0.5) * 12, y: a + (Math.random() - 0.5) * 12, vx: Math.cos(h) * f, vy: Math.sin(h) * f, radius: 3.5 + Math.random() * 4.5, colorMode: l, life: 0, maxLife: 0.35 + Math.random() * 0.35 });
    }
  }
  spawnRedCrystals(s, a, l = 8, m = 60, c = 180) {
    for (let g = 0; g < l; g++) {
      let p = Math.random() * Math.PI * 2, h = m + Math.random() * (c - m);
      this.redCrystals.push({ x: s, y: a, vx: Math.cos(p) * h, vy: Math.sin(p) * h, size: 4 + Math.random() * 6, rot: Math.random() * Math.PI * 2, rotSpd: (Math.random() - 0.5) * 12, alpha: 1, life: 0, maxLife: 0.5 + Math.random() * 0.4 });
    }
  }
  spawnSmokePuff(s, a, l = 7, m = "rgba(148, 163, 184, 0.5)") {
    this.smokePuffs.push({ x: s, y: a, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 - 15, radius: l, color: m, life: 0, maxLife: 0.45 + Math.random() * 0.35 });
  }
  spawnBloodSplatter(s, a, l = 12, m = null, c = Math.PI * 2) {
    if (this.gameSettings.particles) for (let g = 0; g < l; g++) {
      let p = m === null ? Math.random() * Math.PI * 2 : m - c / 2 + Math.random() * c, h = 50 + Math.random() * 160;
      this.bloodParticles.push({ x: s, y: a, vx: Math.cos(p) * h, vy: Math.sin(p) * h, radius: 2 + Math.random() * 3.5, color: Math.random() < 0.65 ? "#DC2626" : Math.random() < 0.5 ? "#991B1B" : "#7F1D1D", life: 0, maxLife: 0.6 + Math.random() * 0.45, gravity: 140 });
    }
  }
  createBranchingLightning(s, a, l, m, c = "#38BDF8", g = 3, p = 0) {
    let h = [{ x: s, y: a }], f = l - s, v = m - a, T = Math.hypot(f, v) || 1, b = -v / T, x = f / T;
    let segs = Math.max(6, Math.min(12, Math.floor(T / 30)));
    let maxJitter = Math.min(34, Math.max(10, T * 0.2));
    for (let C = 1; C < segs; C++) {
      let H = C / segs, D = (C % 2 === 0 ? 1 : -1) * (0.35 + Math.random() * 0.65) * maxJitter + (Math.random() - 0.5) * 10;
      let P = s + f * H + b * D, N = a + v * H + x * D;
      if (h.push({ x: P, y: N }), p < 1 && Math.random() < 0.42) {
        let W = T * (0.28 + Math.random() * 0.16), V = Math.atan2(v, f) + (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.55);
        this.createBranchingLightning(P, N, P + Math.cos(V) * W, N + Math.sin(V) * W, c, g * 0.58, p + 1);
      }
    }
    h.push({ x: l, y: m }), this.lightnings.push({ points: h, color: c, life: 0, maxLife: 0.22, width: g });
  }
  createCataclysmicExplosion(s, a, l = 140, m = "#EF4444") {
    this.cataclysmicExplosions.push({ x: s, y: a, radius: 0, maxRadius: l, life: 0, maxLife: 0.55, color: m }), this.addShake(16, 0.4), this.screenFlashWhite = 0.25, R.playExplosion(), this.spawnFlameParticles(s, a, "red", 18, 60, 240), this.spawnRedCrystals(s, a, 12, 80, 260);
    for (let c = 0; c < 8; c++) this.spawnSmokePuff(s + (Math.random() - 0.5) * 40, a + (Math.random() - 0.5) * 40, 14 + Math.random() * 10);
  }
  spawnGroundCrack(s, a, l, m, c = "#EA580C", g = "#FEF08A") {
    let steps = 7, points = [{ x: 0, y: 0 }];
    for (let i = 1; i < steps; i++) {
      let t = i / steps;
      points.push({ x: m * t, y: (i % 2 === 0 ? 1 : -1) * (3.5 + Math.random() * 6.5) });
    }
    points.push({ x: m, y: 0 });
    let p = 3 + Math.floor(Math.random() * 3), h = [];
    for (let f = 0; f < p; f++) {
      let idx = Math.max(1, Math.min(steps - 1, Math.floor((f + 1) / (p + 1) * steps)));
      let origin = points[idx], bAng = (f % 2 === 0 ? 1 : -1) * (0.45 + Math.random() * 0.55), bLen = m * (0.24 + Math.random() * 0.28);
      let dx = origin.x + Math.cos(bAng) * bLen, dy = origin.y + Math.sin(bAng) * bLen;
      let mx = (origin.x + dx) * 0.5 + (Math.random() - 0.5) * 8, my = (origin.y + dy) * 0.5 + (Math.random() - 0.5) * 8;
      h.push({ sx: origin.x, sy: origin.y, mx, my, dx, dy, w: 1.4 + Math.random() * 1.4 });
    }
    let rockChips = [];
    for (let r = 0; r < 5; r++) {
      let pt = points[1 + Math.floor(Math.random() * (steps - 1))];
      rockChips.push({ x: pt.x + (Math.random() - 0.5) * 14, y: pt.y + (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 7), s: 2.2 + Math.random() * 2.4, rot: Math.random() * Math.PI });
    }
    this.groundCracks.push({ id: this.nextEntityId++, x: s, y: a, angle: l, len: m, points, branches: h, rockChips, color: c, glowColor: g, life: 0, maxLife: 3.4 });
  }
  spawnSpatialTear(s, a, l, m, c = "#F43F5E", g = 10) {
    let p = l - s, h = m - a, f = Math.hypot(p, h) || 1, v = Math.atan2(h, p), T = Math.max(5, Math.floor(f / 20)), b = [];
    for (let C = 0; C <= T; C++) b.push(C === 0 || C === T ? 0 : (Math.random() - 0.5) * 22);
    let x = [];
    for (let C = 1; C < T; C++) if (Math.random() < 0.5) {
      let H = s + p / T * C, D = a + h / T * C;
      x.push({ x: H, y: D, angle: v + (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.7), len: 16 + Math.random() * 28 });
    }
    this.spatialTears.push({ id: this.nextEntityId++, x1: s, y1: a, x2: l, y2: m, life: 0, maxLife: 1.35, color: c, width: g, offsets: b, subRifts: x }), this.spawnRedCrystals((s + l) / 2, (a + m) / 2, 8, 40, 140);
  }
  createFrostExplosion(s, a, l = 110) {
    this.cataclysmicExplosions.push({ x: s, y: a, radius: 0, maxRadius: l, life: 0, maxLife: 0.45, color: "#38BDF8" }), this.spawnParticles(s, a, "#E0F2FE", 16, 60, 220, 3.8, 0.45), this.spawnFlameParticles(s, a, "blue", 10, 40, 140), this.spawnGroundCrack(s, a, Math.random() * Math.PI * 2, l * 0.8, "#38BDF8", "#E0F2FE"), R.playIceShatter();
  }
  fireRocket(s, a, l, m, c, g = false, p = "#F97316") {
    let h = Math.atan2(m - a, l - s), f = g ? 600 : 340;
    this.rocketProjectiles.push({ id: this.nextEntityId++, x: s, y: a, vx: Math.cos(h) * f, vy: Math.sin(h) * f, angle: h, damage: c, isFromPlayer: g, color: p, radius: 9, distanceTraveled: 0, maxDistance: Math.hypot(l - s, m - a) + 40, smokeTimer: 0 }), R.playFire(0.22, 0.18);
  }
  summonGiantMeteor(s, a, l, m = 215, c = true, g, p = 0, h = "#F97316", f = 46, v = 0.65) {
    this.giantMeteors.push({ id: this.nextEntityId++, startX: s - 280, startY: a - 560, targetX: s, targetY: a, currentX: s - 280, currentY: a - 560, timer: 0, duration: v, damage: l, radius: m, meteorSize: f, fromPlayer: c, ccType: g, ccDur: p, color: h }), R.playFire(0.45, 0.22);
  }
  summonBossBeam(s, a, l, m, c, g, p, h = "#EF4444", f = "#FEF08A", v, T = 0.7, b = 0.5) {
    let beam = { id: this.nextEntityId++, x1: s, y1: a, x2: l, y2: m, width: c, timer: 0, duration: g, damage: p, color: h, glowColor: f, ccType: v, ccDur: T, ccFactor: b, triggered: false, fadeTimer: 0.38 };
    this.bossBeams.push(beam);
    this.multiplayer.active && this.isCoopHost() && this.queueVfx("boss_beam", { id: beam.id, x1: s, y1: a, x2: l, y2: m, width: c, duration: g, damage: p, color: h, glowColor: f, ccType: v, ccDur: T, ccFactor: b });
  }
  summonBossShockRing(s, a, l, m, c, g = "#EF4444", p = "#F59E0B", h, f = 1.2, v = 0.45, T = 26) {
    let ring = { id: this.nextEntityId++, x: s, y: a, currentRadius: 24, maxRadius: l, ringWidth: T, speed: m, damage: c, color: g, accentColor: p, hitPlayer: false, ccType: h, ccDur: f, ccFactor: v };
    this.bossShockRings.push(ring);
    this.multiplayer.active && this.isCoopHost() && this.queueVfx("boss_ring", { id: ring.id, x: s, y: a, maxRadius: l, ringWidth: T, speed: m, damage: c, color: g, accentColor: p, ccType: h, ccDur: f, ccFactor: v });
  }
  emitBossWarning(w) {
    let warn = { id: this.nextEntityId++, ...w };
    this.bossWarnings.push(warn);
    this.multiplayer.active && this.isCoopHost() && this.queueVfx("boss_warn", { id: warn.id, x: warn.x, y: warn.y, radius: warn.radius, duration: warn.duration, damage: warn.damage, kind: warn.kind, color: warn.color, ccType: warn.ccType, ccDur: warn.ccDur });
    return warn;
  }
  summonGalaxyVortex(s, a, l, m, c, g, p = false, h = true, k = -1, ccDur = 0) {
    R.playBlackHole(), this.galaxyVortices.push({ id: this.nextEntityId++, x: s, y: a, radius: l, duration: m, timer: 0, tickTimer: 0, tickInterval: 0.4, damagePerTick: c, finalBurstDmg: g, isGalaxy: p, fromPlayer: h, skillIdx: k, ccDur, pullHealAccum: 0, pullHealTick: 0, rotation: 0, stars: Array.from({ length: p ? 45 : 25 }, () => ({ distRatio: 0.15 + Math.random() * 0.82, angle: Math.random() * Math.PI * 2, size: 1.5 + Math.random() * 2.5, color: Math.random() < 0.35 ? "#F472B6" : Math.random() < 0.6 ? "#67E8F9" : "#C084FC" })), refundedEnemyIds: /* @__PURE__ */ new Set() });
  }
  findNearestEnemy(s = 1 / 0, a = this.player.x, l = this.player.y) {
    let m = null, c = s;
    for (let g of this.enemies) {
      if (g.hp <= 0) continue;
      let p = Math.hypot(g.x - a, g.y - l) - g.radius;
      p < c && (c = p, m = g);
    }
    return m;
  }
  damageEnemy(s, a, l = 0, m = 0, c = false, g = null, p = null) {
    if (!s || s.hp <= 0 || s.mpKilled) return false;
    let h = this.getHeroGearStats(this.currentHero.id), f = Math.max(1, a), v = false;
    if (s.kind === "shield_knight") {
      let atkAng = Math.atan2(this.player.y - s.y, this.player.x - s.x);
      let diff = Math.abs(Math.atan2(Math.sin(atkAng - (s.facing || 0)), Math.cos(atkAng - (s.facing || 0))));
      if (diff < 0.95) f = Math.max(1, Math.round(f * 0.7));
    }
    if (c) {
      if (h.matk > 0 && (f += Math.round(h.matk * 0.8)), h.skillBurstChance > 0 && Math.random() < h.skillBurstChance) {
        let C = h.skillBurstDmg || 40;
        f += C, this.slashes.push({ x: s.x, y: s.y, angle: 0, radius: 70, spread: Math.PI * 2, color: "#C084FC", life: 0, maxLife: 0.25, kind: "shockwave" }), this.queueVfx("slash", { x: s.x, y: s.y, angle: 0, radius: 70, spread: Math.PI * 2, color: "#C084FC", maxLife: 0.25, kind: "shockwave" }), this.addFloatingText(s.x, s.y - 22, `TINH VÂN +${C}`, "#C084FC", 14);
      }
      if (this.currentHero.id === "duccong" && p && !p.hasHealedPlayer) {
        p.hasHealedPlayer = true;
        let C = Math.round(this.player.maxHp * 0.025);
        this.healPlayer(C, "HEAL", `+${C} HP (TINH TÚ CHIÊU)`);
      }
      this.currentHero.id === "duccong" && g !== null && p && this.applyDucCongHitRefund(g, s.id, p.refundedEnemyIds);
    } else {
      if (v = Math.random() < h.crit, v && (f = Math.round(f * (this.currentHero.critDmgRatio || 1.5)), h.critExtraDmg > 0 && (f += h.critExtraDmg), this.player.weaponCritTimer = 0.36, this.spawnRedCrystals(s.x, s.y, 4, 60, 150)), h.lightningChance > 0 && Math.random() < h.lightningChance) {
        let H = h.lightningDmg || 35;
        f += H, R.playElectricZap(), this.createBranchingLightning(this.player.x, this.player.y, s.x, s.y, "#FCD34D", 2.8), this.queueVfx("lightning", { x1: this.player.x, y1: this.player.y, x2: s.x, y2: s.y, color: "#FCD34D", width: 2.8 }), this.addFloatingText(s.x, s.y - 20, `SẤM +${H}`, "#FCD34D", 13);
      }
      let C = (h.lifesteal + (this.currentHero.id === "tin" ? 0.1 : 0)) * (this.currentHero.id === "dung" && this.player.dung_c3_buff_timer > 0 ? 2 : 1);
      if (C > 0) {
        let H = Math.min(s.hp, f);
        this.healPlayer(Math.round(H * C), "LIFESTEAL");
      }
    }
    if (this.currentHero.id === "kin") {
      let kRate = this.player.kin_c2_lifestealTimer > 0 ? 0.40 : 0.20, kHeal = Math.round(Math.min(s.hp, f) * kRate);
      kHeal > 0 && this.healPlayer(kHeal, "LIFESTEAL_QUIET");
    }
    if (c && this.currentHero.id === "luan" && this.player.hp > 0) {
      let lHeal = Math.round(Math.min(s.hp, f) * 0.12);
      if (lHeal > 0) {
        let showText = (this.player.luan_vampTextCd || 0) <= 0;
        let healed = this.healPlayer(lHeal, showText ? "LIFESTEAL_QUIET" : "SILENT_VAMP", showText ? `+${lHeal} HÚT PHÉP` : void 0);
        showText && healed > 0 && (this.player.luan_vampTextCd = 0.4);
      }
    }
    this.currentHero.id === "dung" && this.player.dung_c3_buff_timer > 0 && s.kind === "boss" && (f = Math.round(f * 1.2)), this.currentHero.id === "gau" && this.player.gau_cuongHungTimer > 0 && (f = Math.round(f * 1.25));
    let T = Math.min(s.hp, f);
    if (this.multiplayer.active) {
      let predictedKill = s.hp - f <= 0;
      s.hp = Math.max(1, s.hp - f), s.hitFlash = 0.12, this.player.totalDamage += T;
      if (l !== 0 || m !== 0) {
        let C = this.isBossImmune(s) ? 0 : s.kind === "boss" ? 0.25 : 1;
        s.x = Math.max(s.radius, Math.min(Se - s.radius, s.x + l * C)), s.y = Math.max(s.radius, Math.min(Ce - s.radius, s.y + m * C));
      }
      let hitAng = Math.atan2(s.y - this.player.y, s.x - this.player.x);
      this.spawnImpactBurst(s.x, s.y, v ? "#F59E0B" : this.currentHero.accentColor, v, hitAng);
      let b = v ? "#F59E0B" : s.kind === "boss" ? "#FBBF24" : "#F8FAFC", x = v ? 20 : f > 140 ? 18 : 14;
      this.addFloatingText(s.x, s.y - s.radius, v ? `${f}!` : `${f}`, b, x), this.spawnParticles(s.x, s.y, v ? "#F59E0B" : s.color, v ? 10 : 5, 45, 130, 3, 0.3), this.spawnBloodSplatter(s.x, s.y, v ? 8 : 4, hitAng, 0.9);
      mpClient.send({
        type: "DAMAGE_ENEMY",
        enemyId: s.id,
        dmg: Math.round(f),
        knockX: l,
        knockY: m,
        isCrit: v,
        effects: {
          slowFactor: s.slowFactor || 0,
          stunTimer: s.stunTimer || 0,
          frozenTimer: s.frozenTimer || 0,
          bao_marks: s.bao_marks || 0,
          tin_hasMark: Boolean(s.tin_hasMark),
          gau_quakeTimer: s.gau_quakeTimer || 0
        }
      });
      return predictedKill;
    }
    if (s.hp -= f, s.hitFlash = 0.12, this.player.totalDamage += T, l !== 0 || m !== 0) {
      let C = this.isBossImmune(s) ? 0 : s.kind === "boss" ? 0.25 : 1;
      s.x = Math.max(s.radius, Math.min(Se - s.radius, s.x + l * C)), s.y = Math.max(s.radius, Math.min(Ce - s.radius, s.y + m * C));
    }
    let hitAng = Math.atan2(s.y - this.player.y, s.x - this.player.x);
    this.spawnImpactBurst(s.x, s.y, v ? "#F59E0B" : this.currentHero.accentColor, v, hitAng);
    let b = v ? "#F59E0B" : s.kind === "boss" ? "#FBBF24" : "#F8FAFC", x = v ? 20 : f > 140 ? 18 : 14;
    return this.addFloatingText(s.x, s.y - s.radius, v ? `${f}!` : `${f}`, b, x), this.spawnParticles(s.x, s.y, v ? "#F59E0B" : s.color, v ? 10 : 5, 45, 130, 3, 0.3), this.spawnBloodSplatter(s.x, s.y, v ? 8 : 4, hitAng, 0.9), s.hp <= 0 && (this.handleEnemyKilled(s), true);
  }
  applyDucCongHitRefund(s, a, l) {
    if (this.currentHero.id !== "duccong" || this.player.cooldowns[s] <= 0 || l && l.has(a)) return;
    l && l.add(a);
    let m = this.player.skillRefundAccumulated[s] || 0;
    if (m >= 3) return;
    let c = Math.min(0.5, 3 - m);
    c > 0 && (this.player.skillRefundAccumulated[s] = m + c, this.player.cooldowns[s] = Math.max(0, this.player.cooldowns[s] - c), this.addFloatingText(this.player.x + (s - 1) * 22, this.player.y - 32, `-0.5s C${s + 1}`, "#C084FC", 13), R.playTone(660, 990, 0.08, "sine", 0.12));
  }
  applyDucCongKillRefundAll() {
    if (this.currentHero.id === "duccong") {
      for (let s = 0; s < 3; s++) if (this.player.cooldowns[s] > 0) {
        let a = this.player.skillRefundAccumulated[s] || 0;
        if (a < 3) {
          let l = Math.min(1, 3 - a);
          this.player.skillRefundAccumulated[s] = a + l, this.player.cooldowns[s] = Math.max(0, this.player.cooldowns[s] - l), this.addFloatingText(this.player.x + (s - 1) * 22, this.player.y - 36, `-1s C${s + 1}`, "#E9D5FF", 14);
        }
      }
    }
  }
  grantTinResonance(stacksAdded = 1, crystalReset = false) {
    if (this.currentHero.id !== "tin") return;
    let res = computeTinStackGain({
      stacks: this.player.tin_resonance_stacks || 0,
      timer: this.player.tin_resonance_timer || 0,
      empowered: Boolean(this.player.tin_empowered),
      recastTimer: this.player.tin_c1_recast_timer || 0
    }, stacksAdded, crystalReset);
    this.player.tin_resonance_stacks = res.next.stacks;
    this.player.tin_resonance_timer = res.next.timer;
    this.player.tin_empowered = res.next.empowered;
    this.player.tin_c1_recast_timer = Math.max(this.player.tin_c1_recast_timer || 0, res.next.recastTimer);
    if (res.triggeredOverload) {
      this.player.cooldowns[0] = 0;
      if (res.c2c3RefundSec > 0) {
        this.player.cooldowns[1] = Math.max(0, this.player.cooldowns[1] - res.c2c3RefundSec);
        this.player.cooldowns[2] = Math.max(0, this.player.cooldowns[2] - res.c2c3RefundSec);
      }
      R.playElectricZap();
      this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 74, spread: Math.PI * 2, color: "#FB7185", life: 0, maxLife: 0.28, kind: "shockwave" });
      this.addFloatingText(this.player.x, this.player.y - 42, "⚡ QUÁ TẢI HƯ KHÔNG! LƯỚT C1 FREE (+25% ST)", "#FB7185", 15);
    }
  }
  damagePlayer(s, a = null) {
    if (this.player.dashActive || this.player.hp <= 0 || (this.multiplayer.active && this.multiplayer.localDowned)) return;
    let l = this.getHeroGearStats(this.currentHero.id), m = l.dmgRed, tdGuardProf = this.currentHero.id === "taidu" && this.player.taidu_droneMode === "guard" ? getTaiDuDroneProfile("guard") : null;
    this.currentHero.id === "gau" && (m += 0.30), tdGuardProf && (m += tdGuardProf.guardAbsorbPct), this.currentHero.id === "nguyen" && this.player.nguyen_satellitesTimer > 0 && (m += 0.20), this.player.shieldTimer > 0 && this.player.shieldDmgRed > 0 && (m += this.player.shieldDmgRed), this.currentHero.id === "gau" && this.player.gau_c2_guardTimer > 0 && (m += 0.35, this.player.gau_c2_counterWaveTimer = 0.22, a && this.player.gau_c2_stacks < 4 && (this.player.gau_c2_stacks++, this.addFloatingText(this.player.x, this.player.y - 34, `\u{1F6E1}\uFE0F PH\u1EA2N CH\u1EA4N ${this.player.gau_c2_stacks}/4`, "#FBBF24", 13))), this.currentHero.id === "danh" && this.player.chargeState.active && this.player.chargeState.kind === "danh_c2" && (m += 0.20), this.currentHero.id === "danh" && this.player.danh_dragonTimer > 0 && (m += computeDanhDragonFormModifiers(true).damageReductionBonus), this.currentHero.id === "dung" && this.player.dung_c3_buff_timer > 0 ? (m += 0.75, m = Math.min(0.88, m)) : this.currentHero.id === "danh" && this.player.danh_dragonTimer > 0 ? m = Math.min(0.80, m) : this.currentHero.id === "nguyen" && this.player.nguyen_satellitesTimer > 0 ? m = Math.min(0.68, m) : m = Math.min(0.65, m);
    if (tdGuardProf && s > 0) {
      let absorbed = Math.max(1, Math.round(s * tdGuardProf.guardAbsorbPct));
      this.player.taidu_droneShieldAccum = (this.player.taidu_droneShieldAccum || 0) + absorbed;
      if (this.player.taidu_droneShieldAccum >= 150) {
        this.player.taidu_droneShieldAccum -= 150;
        let pulseHeal = Math.round(this.player.maxHp * 0.09);
        this.healPlayer(pulseHeal, "HEAL", `+${pulseHeal} HP (XUNG H\u1ED8 V\u1EC6)`);
        this.emitAllySupport({ x: this.player.x, y: this.player.y, radius: 260, heal: pulseHeal, label: `+${pulseHeal} HP (XUNG H\u1ED8 V\u1EC6)`, color: "#34D399" });
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 145, spread: Math.PI * 2, color: "#34D399", accentColor: "#FEF08A", life: 0, maxLife: 0.36, kind: "taidu_hex_blast" });
        this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 145, spread: Math.PI * 2, color: "#34D399", accentColor: "#FEF08A", maxLife: 0.36, kind: "taidu_hex_blast" });
        this.spawnParticles(this.player.x, this.player.y, "#34D399", 14, 50, 170, 3.2, 0.38);
        let pulseDmg = Math.round(40 + 0.42 * this.getEffectiveDamage());
        for (let e of [...this.enemies]) {
          let dx = e.x - this.player.x, dy = e.y - this.player.y, d = Math.hypot(dx, dy);
          if (d <= 145 + e.radius) {
            let kb = Math.atan2(dy, dx);
            this.damageEnemy(e, pulseDmg, Math.cos(kb) * 26, Math.sin(kb) * 26, true);
          }
        }
        R.playSanctuaryWave();
        this.comboManager.record({ heroId: "taidu", action: "passive_proc", hitCount: 1 });
      }
    }
    let c = this.player.armor > 0 ? 100 / (100 + this.player.armor) : 1, g = Math.max(1, Math.round(s * c * (1 - m)));
    if (this.currentHero.id === "gau" && a && this.player.gau_cuongHungTimer <= 0 && this.grantGauRage(5), l.frostThornsChance > 0 && Math.random() < l.frostThornsChance && a && (this.isBossImmune(a) ? this.notifyBossImmune(a, "MI\u1EC4N NHI\u1EC4M L\xC0M CH\u1EACM") : (a.slowFactor = Math.max(a.slowFactor, 0.3), a.slowTimer = Math.max(a.slowTimer, 2), this.addFloatingText(a.x, a.y - 10, "L\xC0M CH\u1EACM (KHI\xCAN B\u0102NG)", "#38BDF8", 12))), l.reflect > 0 && a) {
      let p = Math.max(1, Math.round(g * l.reflect));
      this.addFloatingText(a.x, a.y - 15, `PH\u1EA2N ${p}`, "#CBD5E1", 12);
      if (this.multiplayer.active) {
        this.damageEnemy(a, p, 0, 0, true);
      } else {
        a.hp -= p, this.player.totalDamage += p, a.hp <= 0 && this.handleEnemyKilled(a);
      }
    }
    if (this.player.shield > 0) {
      let p = Math.min(this.player.shield, g);
      if (this.player.gau_noDmgTimer = 0, this.player.shield -= p, g -= p, this.addFloatingText(this.player.x, this.player.y - 24, `KHI\xCAN -${p}`, "#38BDF8", 13), this.player.shield <= 0 && this.player.shieldExplodeDmg > 0 && this.player.shieldExplodeRadius > 0 && this.triggerShieldExplosion(), g <= 0) return;
    }
    this.player.gau_noDmgTimer = 0, this.player.hp = Math.max(0, this.player.hp - g), this.player.hitFlash = 0.14, R.playHit(), this.addShake(4, 0.12), this.addFloatingText(this.player.x, this.player.y - 24, `-${g}`, "#EF4444", 15), l.autoShield20 > 0 && this.player.autoShield20Timer <= 0 && this.player.hp > 0 && this.player.hp <= this.player.maxHp * 0.2 && (this.player.autoShield20Timer = l.autoShield20Cd || 45, this.addPlayerShield(l.autoShield20, 6), this.addFloatingText(this.player.x, this.player.y - 32, "B\xD9A H\u1ED8 M\u1EC6NH K\xCDCH HO\u1EA0T!", "#FCD34D", 15)), l.autoShield30 > 0 && this.player.autoShield30Timer <= 0 && this.player.hp > 0 && this.player.hp <= this.player.maxHp * 0.3 && (this.player.autoShield30Timer = l.autoShield30Cd || 50, this.addPlayerShield(l.autoShield30, 6), this.addFloatingText(this.player.x, this.player.y - 32, "KHI\xCAN B\u1EA4T DI\u1EC6T K\xCDCH HO\u1EA0T!", "#F59E0B", 15)), l.autoHeal20 > 0 && this.player.autoHeal20Timer <= 0 && this.player.hp > 0 && this.player.hp <= this.player.maxHp * 0.2 && (this.player.autoHeal20Timer = l.autoHeal20Cd || 60, this.healPlayer(l.autoHeal20, "HEAL", `+${l.autoHeal20} HP (\u00C1O CHO\xC0NG B\u1EA4T DI\u1EC6T)`));
    if (this.currentHero.id === "nguyen" && this.player.hp > 0 && this.player.hp <= this.player.maxHp * 0.28 && (this.player.nguyen_rescueCd || 0) <= 0) {
      this.player.nguyen_rescueCd = 45, this.player.nguyen_rescueFlashTimer = 0.9;
      let rescShield = Math.round(this.player.maxHp * 0.22), cap = Math.round(this.player.maxHp * 0.65);
      this.player.shield = Math.min(cap, (this.player.shield || 0) + rescShield), this.player.shieldTimer = Math.max(this.player.shieldTimer || 0, 10);
      this.player.nguyen_hotQueue = this.player.nguyen_hotQueue || [], this.player.nguyen_hotQueue.push({ timer: 0.25, interval: 0.9, ticksLeft: 3, healAmt: Math.round(this.player.maxHp * 0.03) });
      this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 210, spread: Math.PI * 2, color: "#10B981", life: 0, maxLife: 0.45, kind: "nguyen_lotus_boom" });
      this.nguyenSanctuaryWaves.push({ id: this.nextEntityId++, x: this.player.x, y: this.player.y, maxRadius: 210, life: 0, maxLife: 0.48 });
      this.queueVfx("nguyen_wave_vis", { x: this.player.x, y: this.player.y, maxRadius: 210, maxLife: 0.48 });
      this.emitAllySupport({ x: this.player.x, y: this.player.y, radius: 260, heal: Math.round(this.player.maxHp * 0.1), shield: rescShield, label: `+${rescShield} KHI\xCAN (C\u1EE8U NGUY)`, color: "#FDE047" });
      for (let e of [...this.enemies]) {
        let dx = e.x - this.player.x, dy = e.y - this.player.y, d = Math.hypot(dx, dy);
        if (d <= 210 + e.radius) {
          let kb = Math.atan2(dy, dx);
          this.damageEnemy(e, Math.round(35 + 0.42 * this.getEffectiveAP()), Math.cos(kb) * 44, Math.sin(kb) * 44, true);
          this.isBossImmune(e) || (e.slowFactor = Math.max(e.slowFactor || 0, 0.45), e.slowTimer = Math.max(e.slowTimer || 0, 1.8));
        }
      }
      R.playHolyLight(), R.playSanctuaryWave();
      this.addFloatingText(this.player.x, this.player.y - 42, `\u{1F6E1}\uFE0F C\u1EE8U NGUY KH\u1EA8N C\u1EA4P! +${rescShield} KHI\xCAN`, "#FDE047", 17);
      this.comboManager.record({ heroId: "nguyen", action: "passive_proc", hitCount: 1 });
    }
    if (this.player.hp <= 0 && this.gameState === "PLAYING") {
      this.player.hp = 0;
      R.playHit();
      if (this.multiplayer.active) {
        this.multiplayer.localDowned = true;
        this.player.dashActive = false;
        this.player.dashKind = "none";
        this.player.chargeState.active = false;
        this.aimState.active = false;
        this.tapDestination = null;
        this.addFloatingText(this.player.x, this.player.y - 36, "\u{1F480} \u0110\xC3 NG\xC3 XU\u1ED0NG \xB7 CH\u1EDC \u0110\u1ED2NG \u0110\u1ED8I!", "#F87171", 16);
        this.onToast && this.onToast("B\u1EA1n \u0111\xE3 ng\xE3 xu\u1ED1ng! \u0110\u1ED3ng \u0111\u1ED9i c\xF3 th\u1EC3 ho\xE0n th\xE0nh m\xE0n \u0111\u1EC3 h\u1ED3i sinh b\u1EA1n.");
        this.sendPlayerSync(false);
        this.onStateChange && this.onStateChange();
      } else {
        this.gameState = "GAME_OVER", R.setMusicMode("off"), this.onGameOver && this.onGameOver(false), this.onStateChange && this.onStateChange();
      }
    }
  }
  triggerShieldExplosion() {
    let s = this.player.shieldExplodeRadius || 100, a = this.player.shieldExplodeDmg || 70;
    this.player.shieldExplodeDmg = 0, this.player.shieldExplodeRadius = 0, this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: s, spread: Math.PI * 2, color: "#38BDF8", life: 0, maxLife: 0.3, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: s, spread: Math.PI * 2, color: "#38BDF8", maxLife: 0.3, kind: "shockwave" }), this.spawnParticles(this.player.x, this.player.y, "#38BDF8", 16, 60, 200, 4, 0.35), R.playExplosion();
    for (let l of [...this.enemies]) Math.hypot(l.x - this.player.x, l.y - this.player.y) <= s + l.radius && this.damageEnemy(l, a, 0, 0, true);
  }
  handleEnemyKilled(s, byPlayerId = null) {
    let isLocalKill = !this.multiplayer.active || !byPlayerId || byPlayerId === mpClient.playerId;
    let dropRate = s.bossWave === MAX_WAVES ? 0.75 : s.bossWave === 15 ? 0.25 : 0;
    if (this.waveKilled++, this.waveKilledThisWave++, this.totalKilled++, s.kind === "boss" && (this.waveBossKilledThisWave = true, dropRate > 0 && Math.random() < dropRate)) {
      let l = ["item_71", "item_72", "item_73", "item_74", "item_75", "item_76", "item_77", "item_78", "item_79", "item_80"], m = l[Math.floor(Math.random() * l.length)], c = Si[m];
      c && (this.inventory.push({ uid: this.nextUid++, itemId: m }), this.saveGame(), R.playLevelUp(), this.onToast && this.onToast(`\u{1F389} R\u01A0I \u0110\u1ED2 TH\u1EA6N THO\u1EA0I: ${c.name}!`), this.addFloatingText(this.player.x, this.player.y - 36, `R\u01A0I TH\u1EA6N THO\u1EA0I: ${c.name}!`, "#F59E0B", 18));
    }
    if (isLocalKill) {
      let a = this.getHeroGearStats(this.currentHero.id);
      a.killHeal > 0 && this.healPlayer(a.killHeal), this.currentHero.id === "duccong" && this.applyDucCongKillRefundAll();
    }
    this.deadCorpses.push({ x: s.x, y: s.y, radius: s.radius, color: s.color, kind: s.kind, bossWave: s.bossWave, name: s.name, facing: s.facing || 0, timer: 0, maxLife: s.kind === "boss" ? 3.5 : 2.4, splatRadius: s.radius * 1.55, splatColor: s.kind === "boss" ? "#7F1D1D" : "#5C1D1D" }), this.spawnBloodSplatter(s.x, s.y, s.kind === "boss" ? 32 : 14), this.spawnRedCrystals(s.x, s.y, s.kind === "boss" ? 16 : 6, 60, 200), s.kind === "boss" && (this.createCataclysmicExplosion(s.x, s.y, 180, "#EF4444"), this.syncMusicState(), this.onStateChange && this.onStateChange()), this.xpOrbs.push({ x: s.x, y: s.y, value: s.xpValue, radius: s.kind === "boss" ? 11 : 7, pulse: 0 });
  }
  grantXp(s) {
    for (this.player.xp += s; this.player.xp >= this.player.xpToNext; ) {
      this.player.xp -= this.player.xpToNext, this.player.level++, this.player.xpToNext = Math.round(this.player.xpToNext * 1.28 + 30);
      let a = this.currentHero.levelScaling, l = a ? Math.round(a.hp) : 130;
      a ? (this.player.bonusLevelHp += l, this.player.bonusLevelAtk += a.atk, a.ap && (this.player.bonusLevelAp += a.ap), this.player.armor += a.armor) : this.player.bonusLevelHp += l, this.computeHeroStats(), this.player.hp = this.player.maxHp, R.playLevelUp(), this.spawnParticles(this.player.x, this.player.y, "#FBBF24", 22, 70, 220, 4.5, 0.7), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 135, spread: Math.PI * 2, color: "#FBBF24", life: 0, maxLife: 0.45, kind: "shockwave" });
      let m = a ? `C\u1EA4P ${this.player.level}! +${l} HP \xB7 +${a.atk} C\xD4NG${a.ap ? ` \xB7 +${a.ap} AP` : ""} \xB7 +${a.armor} GI\xC1P` : `C\u1EA4P \u0110\u1ED8 ${this.player.level}! +${l} HP`;
      this.addFloatingText(this.player.x, this.player.y - 36, m, "#FBBF24", 17);
    }
  }
  grantGauRage(s) {
    if (this.currentHero.id !== "gau" || this.player.gau_cuongHungTimer > 0) return;
    if (this.player.gau_rage = Math.min(100, (this.player.gau_rage || 0) + s), this.player.gau_rage >= 100) {
      this.player.gau_rage = 0, this.player.gau_cuongHungTimer = 6, R.playDragonRoar(), this.addShake(10, 0.3), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 120, spread: Math.PI * 2, color: "#FBBF24", life: 0, maxLife: 0.35, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 120, spread: Math.PI * 2, color: "#FBBF24", maxLife: 0.35, kind: "shockwave" }), this.spawnFlameParticles(this.player.x, this.player.y, "red", 14, 50, 140), this.queueVfx("particles", { x: this.player.x, y: this.player.y, flame: true, flameColor: "red", count: 14, minSpd: 50, maxSpd: 140 }), this.addFloatingText(this.player.x, this.player.y - 38, "🔥 CUỒNG HÙNG BỘC PHÁT (6s)!", "#FBBF24", 17);
      let h = Math.round(this.player.maxHp * 0.10);
      this.healPlayer(h, "HEAL", `+${h} HP (CUỒNG HÙNG)`), this.comboManager.record({ heroId: "gau", action: "passive_proc", hitCount: 1, empowered: true });
    }
  }
  applyBaoMark(s, a = 1) {
    if (!s || s.hp <= 0) return false;
    if (this.isBossImmune(s)) return s.bao_marks = 0, s.bao_markTimer = 0, this.notifyBossImmune(s, "MI\u1EC4N NHI\u1EC4M \u1EA2NH \u1EA4N"), false;
    if (s.bao_marks = Math.min(3, (s.bao_marks || 0) + a), s.bao_markTimer = 6, s.bao_marks >= 3) {
      s.bao_marks = 0, s.bao_markTimer = 0, R.playDeathSeal(), this.spawnRedCrystals(s.x, s.y, 12, 80, 210), this.slashes.push({ x: s.x, y: s.y, angle: 0, radius: 68, spread: Math.PI * 2, color: "#E879F9", life: 0, maxLife: 0.28, kind: "shockwave" }), this.addFloatingText(s.x, s.y - s.radius - 26, "\u{1F480} T\u1EEC \u1EA4N +120!", "#E879F9", 16), this.damageEnemy(s, 120, 0, 0, true);
      let h = Math.round(this.player.maxHp * 0.05);
      if (this.healPlayer(h, "HEAL", `+${h} HP (T\u1EEC \u1EA4N)`), this.comboManager.record({ heroId: "bao", action: "passive_proc", hitCount: 1, empowered: true, damageDealt: 120 }), this.player.cooldowns[0] > 0.25 && !this.player.bao_c1_refundedThisCycle) {
        this.player.bao_c1_refundedThisCycle = true;
        let l = this.player.cooldowns[0] * 0.4;
        this.player.cooldowns[0] = Math.max(0.25, this.player.cooldowns[0] - l), this.addFloatingText(this.player.x, this.player.y - 34, `\u26A1 -${l.toFixed(1)}s C1`, "#E879F9", 14);
      }
      return true;
    }
    return false;
  }
  executeBaoAmbush(s) {
    if (this.currentHero.id !== "bao" || this.player.bao_stealthTimer <= 0) return false;
    let a = this.getHeroGearStats("bao");
    this.player.bao_stealthTimer = 0, this.player.bao_stealthLockTimer = 0, this.player.bao_emergeTimer = 0.24, this.player.weaponSkillTimer = 0.45, this.player.weaponSkillDur = 0.45, this.player.cooldowns[1] = (this.currentHero.skills[1]?.cooldown || 8) * (1 - a.cdr);
    for (let k = 0; k < 7; k++) this.spawnSmokePuff(this.player.x + (Math.random() - 0.5) * 28, this.player.y + (Math.random() - 0.5) * 28, 12, "rgba(147, 51, 234, 0.52)");
    this.queueVfx("particles", { x: this.player.x, y: this.player.y, smoke: true, color: "rgba(147, 51, 234, 0.52)", count: 7, size: 12 });
    let l = this.findNearestEnemy(280), m = this.getEffectiveDamage(), c = 0, g = 0;
    if (l) {
      let p = Math.atan2(l.y - this.player.y, l.x - this.player.x);
      this.afterimages.push({ x: this.player.x, y: this.player.y, facing: p, color: "#9333EA", alpha: 0.85, life: 0, maxLife: 0.38, radius: this.player.radius }), this.queueVfx("afterimage", { x: this.player.x, y: this.player.y, facing: p, color: "#9333EA", alpha: 0.85, maxLife: 0.38 }), this.player.x = Math.max(40, Math.min(Se - 40, l.x + Math.cos(p) * (l.radius + 22))), this.player.y = Math.max(40, Math.min(Ce - 40, l.y + Math.sin(p) * (l.radius + 22))), this.player.facing = p + Math.PI, this.spawnSpatialTear(this.player.x - 24, this.player.y - 24, l.x, l.y, "#E879F9", 10), this.queueVfx("tear", { x1: this.player.x - 24, y1: this.player.y - 24, x2: l.x, y2: l.y, color: "#E879F9", width: 10 }), this.slashes.push({ x: this.player.x, y: this.player.y, angle: this.player.facing, radius: 96, spread: 1.7, dir: 1, color: "#E879F9", life: 0, maxLife: 0.22, kind: "bao_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: this.player.facing, radius: 96, spread: 1.7, dir: 1, color: "#E879F9", maxLife: 0.22, kind: "bao_slash" });
      let h = (l.bao_marks || 0) >= 2 ? 45 : 0, f = Math.round(65 + 1.15 * m + h);
      g += f, c = 1, this.damageEnemy(l, f, 0, 0, true), l.hp > 0 && this.applyBaoMark(l, 1), h > 0 && this.addFloatingText(l.x, l.y - 24, `🗡️ ÁM SÁT +${h}!`, "#E879F9", 15);
      let bHeal = Math.round(this.player.maxHp * (h > 0 ? 0.08 : 0.05));
      this.healPlayer(bHeal, "HEAL", `+${bHeal} HP (ÁM SÁT)`);
    } else this.player.x = Math.max(40, Math.min(Se - 40, this.player.x + Math.cos(s) * 165)), this.player.y = Math.max(40, Math.min(Ce - 40, this.player.y + Math.sin(s) * 165));
    for (let k = 0; k < 7; k++) this.spawnSmokePuff(this.player.x + (Math.random() - 0.5) * 26, this.player.y + (Math.random() - 0.5) * 26, 13, "rgba(232, 121, 249, 0.52)");
    this.queueVfx("particles", { x: this.player.x, y: this.player.y, smoke: true, color: "rgba(232, 121, 249, 0.52)", count: 7, size: 13 });
    return this.player.attackTimer = 0, R.playAmbushSlash(), this.comboManager.record({ heroId: "bao", action: "c2_ambush", hitCount: c, inTimingWindow: true, empowered: c > 0, damageDealt: g }), true;
  }
  executeGauC2Slam() {
    if (this.currentHero.id !== "gau" || this.player.gau_c2_guardTimer <= 0) return;
    let s = this.getHeroGearStats("gau"), a = this.player.gau_c2_stacks, l = this.player.gau_cuongHungTimer > 0, m = this.player.gau_c1_afterStep3Timer > 0, c = this.getEffectiveDamage();
    this.player.gau_c2_guardTimer = 0, this.player.gau_c2_stacks = 0, this.player.gau_c2_recastLock = 0, this.player.gau_c1_afterStep3Timer = 0, this.player.gau_animKind = "c2_slam", this.player.gau_animDur = 0.26, this.player.gau_animTimer = 0.26, this.player.gau_animAngle = this.player.facing, this.player.weaponSkillTimer = 0.46, this.player.weaponSkillDur = 0.46, this.player.cooldowns[1] = (this.currentHero.skills[1]?.cooldown || 8.5) * (1 - s.cdr);
    let g = 150 * (l ? 1.2 : 1), p = Math.round(70 + 1.15 * c + 30 * a + (m ? 40 : 0));
    R.playEarthSlam(), this.addShake(m || a >= 2 ? 11 : 7, 0.28), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: g, spread: Math.PI * 2, color: l ? "#FBBF24" : "#F59E0B", life: 0, maxLife: 0.34, kind: "gau_shockring", heavy: true }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: g, spread: Math.PI * 2, color: l ? "#FBBF24" : "#F59E0B", maxLife: 0.34, kind: "gau_shockring", heavy: true }), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: g * 0.72, spread: Math.PI * 2, color: "#FEF08A", life: 0, maxLife: 0.24, kind: "shockwave" }), this.spawnParticles(this.player.x, this.player.y, "#FBBF24", 16, 70, 210, 3.5, 0.38), this.spawnGroundCrack(this.player.x, this.player.y, this.player.facing, g * 0.75, "#D97706", "#FEF08A"), this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: this.player.facing, len: g * 0.75, color: "#D97706", glowColor: "#FEF08A" });
    let h = 0;
    for (let f of [...this.enemies]) if (Math.hypot(f.x - this.player.x, f.y - this.player.y) <= g + f.radius) {
      h++;
      let v = Math.atan2(f.y - this.player.y, f.x - this.player.x);
      this.damageEnemy(f, p, Math.cos(v) * 20, Math.sin(v) * 20, true);
    }
    if (h > 0) {
      this.grantGauRage(12);
      let gHeal = Math.round(this.player.maxHp * Math.min(0.11, 0.05 + 0.015 * a));
      this.healPlayer(gHeal, "HEAL", `+${gHeal} HP (PH\u1EA2N CH\u1EA4N)`);
    }
    this.comboManager.record({ heroId: "gau", action: "c2_slam", hitCount: h, inTimingWindow: m, empowered: l || a >= 2, damageDealt: p * Math.max(1, h) });
  }
  toggleTaiDuDroneMode() {
    if (this.gameState !== "PLAYING" || this.currentHero.id !== "taidu" || (this.multiplayer.active && this.multiplayer.localDowned)) return;
    let nextMode = cycleTaiDuDroneMode(this.player.taidu_droneMode || "attack"), prof = getTaiDuDroneProfile(nextMode);
    this.player.taidu_droneMode = nextMode;
    R.playDroneSwitch();
    let col = prof.color || "#38BDF8";
    let dx = Number.isFinite(this.player.taidu_droneX) ? this.player.taidu_droneX : this.player.x - 42;
    let dy = Number.isFinite(this.player.taidu_droneY) ? this.player.taidu_droneY : this.player.y - 30;
    this.player.taidu_droneX = dx, this.player.taidu_droneY = dy;
    this.slashes.push({ x: dx, y: dy, angle: 0, radius: 56, spread: Math.PI * 2, color: col, accentColor: "#FEF08A", life: 0, maxLife: 0.28, kind: "taidu_hex_blast" });
    this.queueVfx("slash", { x: dx, y: dy, angle: 0, radius: 56, spread: Math.PI * 2, color: col, accentColor: "#FEF08A", maxLife: 0.28, kind: "taidu_hex_blast" });
    this.spawnParticles(dx, dy, col, 8, 30, 110, 2.8, 0.3);
    this.addFloatingText(this.player.x, this.player.y - 34, `\u{1F916} DRONE: ${prof.label.toUpperCase()}`, col, 15);
    this.onToast && this.onToast(`Ch\u1EBF \u0111\u1ED9 Drone: ${prof.label}`);
  }
  triggerBasicAttack() {
    if (this.gameState !== "PLAYING" || this.waitingReward || this.waveCleared || this.player.stunTimer > 0 || this.player.attackTimer > 0 || this.multiplayer.active && this.multiplayer.localDowned) return;
    let s = this.currentHero.stats.range, a = this.findNearestEnemy(s + 24), l = this.player.facing;
    a && (l = Math.atan2(a.y - this.player.y, a.x - this.player.x), this.player.facing = l), this.player.attackTimer = this.getEffectiveAttackInterval(), this.player.weaponAttackDuration = 0.22, this.player.attackAnimTimer = 0.22, this.player.attackAnimAngle = l, this.player.attackSwingParity = -(this.player.attackSwingParity || 1), (this.currentHero.id === "kin" || this.currentHero.id === "longhoi") && (this.player.bowRecoilTimer = 0.15);
    let m = this.getEffectiveDamage();
    if (this.currentHero.id === "dung") {
      this.player.dung_passive = (this.player.dung_passive || 0) + 1;
      let c = 0, g = false, p = this.player.dung_c3_buff_timer > 0;
      if (this.player.dung_passive >= 5 || p) {
        this.player.dung_passive >= 5 && (this.player.dung_passive = 0), c = 45, g = true;
        let f = p ? 230 : 55;
        this.healPlayer(f, "HEAL", `+${f} HP (${p ? "CHI\u1EBEN TH\u1EA6N S\xC9T" : "CHI\u1EBEN \xDD"})`), p ? R.playThunderStrike() : R.playElectricZap(), p || this.addFloatingText(this.player.x, this.player.y - 20, "\u26A1 S\u1EA4M S\xC9T LAN (120% + LAN 5 QU\xC1I)", "#38BDF8", 15);
      }
      R.playSpear(), this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: s + 20, spread: 1.15, color: g ? "#FCD34D" : "#38BDF8", life: 0, maxLife: 0.22, kind: "spear" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: s + 20, spread: 1.15, color: g ? "#FCD34D" : "#38BDF8", maxLife: 0.22, kind: "spear" }), this.spawnParticles(this.player.x + s * 0.7 * Math.cos(l), this.player.y + s * 0.7 * Math.sin(l), "#818CF8", 6, 40, 100, 2.5, 0.25);
      let h = [];
      for (let f of [...this.enemies]) {
        let v = f.x - this.player.x, T = f.y - this.player.y, b = Math.hypot(v, T) - f.radius;
        b <= s + 18 && (Math.abs(Math.atan2(Math.sin(Math.atan2(T, v) - l), Math.cos(Math.atan2(T, v) - l))) <= 0.75 || b < 35) && h.push(f);
      }
      for (let f of h) {
        let v = g ? Math.round(m * 1.2 + c) : m + c;
        if (this.damageEnemy(f, v, Math.cos(l) * 14, Math.sin(l) * 14), this.createBranchingLightning(this.player.x, this.player.y, f.x, f.y, g ? "#FCD34D" : "#38BDF8", 2.8), this.queueVfx("lightning", { x1: this.player.x, y1: this.player.y, x2: f.x, y2: f.y, color: g ? "#FCD34D" : "#38BDF8", width: 2.8 }), g) {
          let T = 0;
          for (let b of this.enemies) {
            if (T >= 5) break;
            if (!(b.id === f.id || b.hp <= 0) && Math.hypot(b.x - f.x, b.y - f.y) <= 280) {
              T++;
              let x = Math.round(m * 0.8);
              this.damageEnemy(b, x, 0, 0, true), this.createBranchingLightning(f.x, f.y, b.x, b.y, "#38BDF8", 2.4), this.queueVfx("lightning", { x1: f.x, y1: f.y, x2: b.x, y2: b.y, color: "#38BDF8", width: 2.4 }), this.addFloatingText(b.x, b.y - 18, `S\u1EA4M LAN ${x}`, "#38BDF8", 13);
            }
          }
        }
      }
      h.length > 0 && this.player.berserkTimer > 0 && this.healPlayer(((this.player.berserkHealPerHit || 22) + Math.round(this.player.maxHp * 0.01)) * (p ? 2 : 1), "HEAL");
    } else if (this.currentHero.id === "tin") {
      R.playSlash(), this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: s + 18, spread: 1.65, color: "#FB7185", life: 0, maxLife: 0.22, crossed: true, kind: "slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: s + 18, spread: 1.65, color: "#FB7185", maxLife: 0.22, crossed: true, kind: "slash" }), this.spawnSpatialTear(this.player.x + Math.cos(l - 0.45) * 35, this.player.y + Math.sin(l - 0.45) * 35, this.player.x + Math.cos(l + 0.45) * (s + 35), this.player.y + Math.sin(l + 0.45) * (s + 35), "#F43F5E", 8), this.queueVfx("tear", { x1: this.player.x + Math.cos(l - 0.45) * 35, y1: this.player.y + Math.sin(l - 0.45) * 35, x2: this.player.x + Math.cos(l + 0.45) * (s + 35), y2: this.player.y + Math.sin(l + 0.45) * (s + 35), color: "#F43F5E", width: 8 });
      let hitAny = false, effScale = m / Math.max(1, this.currentHero.stats.damage);
      for (let c of [...this.enemies]) {
        let g = c.x - this.player.x, p = c.y - this.player.y, h = Math.hypot(g, p) - c.radius;
        if (h <= s + 15 && (Math.abs(Math.atan2(Math.sin(Math.atan2(p, g) - l), Math.cos(Math.atan2(p, g) - l))) <= 0.95 || h < 32)) {
          hitAny = true;
          let f = 0;
          this.isBossImmune(c) ? (c.tin_hasMark = false, c.tin_hits = 0, this.notifyBossImmune(c, "MI\u1EC4N NHI\u1EC4M D\u1EA4U \u1EA4N")) : (c.tin_hits = (c.tin_hits || 0) + 1, c.tin_hasMark ? (f += Math.round(68 * effScale), c.tin_hasMark = false, c.tin_hits = 0, this.addFloatingText(c.x, c.y - 20, `K\xCDCH N\u1ED4 D\u1EA4U +${f} DMG`, "#F43F5E", 15), this.spawnRedCrystals(c.x, c.y, 8, 80, 200), this.healPlayer(28, "HEAL", "+28 HP (D\u1EA4U \u1EA4N)"), this.player.cooldowns[0] = Math.max(0, this.player.cooldowns[0] - 1.2), this.player.cooldowns[1] = Math.max(0, this.player.cooldowns[1] - 1.2), this.grantTinResonance(1, false)) : c.tin_hits >= 3 && (c.tin_hasMark = true, this.addFloatingText(c.x, c.y - 20, "HUY\u1EBET \u1EA2NH \u1EA4N!", "#F43F5E", 14), this.spawnRedCrystals(c.x, c.y, 4, 40, 100))), this.damageEnemy(c, m + f);
        }
      }
      hitAny && (this.player.cooldowns = applyTinBasicHitCooldownRefund(this.player.cooldowns));
    } else if (this.currentHero.id === "kin") {
      R.playBow(), this.player.kin_passive = (this.player.kin_passive || 0) + 1;
      let c = false, g = 1, p = 0, h = "#34D399";
      this.player.kin_passive >= 4 && (this.player.kin_passive = 0, g = 99, p = 40, h = "#10B981", c = true, R.playWhirlwind(), this.addFloatingText(this.player.x, this.player.y - 22, "\u{1F32A}\uFE0F L\u1ED0C XO\xC1Y B\xC3O T\u1ED0 (XUY\xCAN T\u1EA4T C\u1EA2)!", "#10B981", 15));
      let f = c ? 780 : 660;
      this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "kin_arrow", isWhirlwindArrow: c, hasHealed: false, x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * f, vy: Math.sin(l) * f, radius: c ? 16 : 8, damage: m + (c ? p : 0), bonusFirstDmg: p, color: h, angle: l, distanceTraveled: 0, maxDistance: s + 110, pierceLeft: g, hitIds: /* @__PURE__ */ new Set() }), this.queueVfx("proj_vis", { kind: "kin_arrow", isWhirlwindArrow: c, x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * f, vy: Math.sin(l) * f, radius: c ? 16 : 8, color: h, angle: l, maxDistance: s + 110, pierceLeft: g });
    } else if (this.currentHero.id === "trung") R.playOrb(), this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "trung_orb", x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * 480, vy: Math.sin(l) * 480, radius: 11, damage: m, color: "#A5B4FC", angle: l, distanceTraveled: 0, maxDistance: s + 65, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() }), this.queueVfx("proj_vis", { kind: "trung_orb", x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * 480, vy: Math.sin(l) * 480, radius: 11, color: "#A5B4FC", angle: l, maxDistance: s + 65, pierceLeft: 1 }), this.spawnFlameParticles(this.player.x, this.player.y, "blue", 2, 20, 50);
    else if (this.currentHero.id === "eohyen") {
      R.playIceSlash(), this.player.eohyen_passive = (this.player.eohyen_passive || 0) + 1;
      let c = 0, g = false;
      this.player.eohyen_passive >= 4 && (this.player.eohyen_passive = 0, c = 40, g = true, this.addFloatingText(this.player.x, this.player.y - 20, "H\xC0N NGUY\u1EC6T! +40 PH\xC9P", "#38BDF8", 14)), this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: s + 15, spread: 1.25, color: "#38BDF8", life: 0, maxLife: 0.2, kind: "slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: s + 15, spread: 1.25, color: "#38BDF8", maxLife: 0.2, kind: "slash" }), this.spawnFlameParticles(this.player.x, this.player.y, "blue", 3, 30, 80);
      let p = false;
      for (let h of [...this.enemies]) {
        let f = h.x - this.player.x, v = h.y - this.player.y, T = Math.hypot(f, v) - h.radius;
        T <= s + 14 && (Math.abs(Math.atan2(Math.sin(Math.atan2(v, f) - l), Math.cos(Math.atan2(v, f) - l))) <= 0.85 || T < 32) && (h.hp > 0 && (p = true), this.damageEnemy(h, m + c, 0, 0, c > 0), g && (this.isBossImmune(h) ? this.notifyBossImmune(h, "MI\u1EC4N NHI\u1EC4M L\xC0M CH\u1EACM") : (h.slowFactor = Math.max(h.slowFactor, 0.25), h.slowTimer = Math.max(h.slowTimer, 2.5), this.spawnParticles(h.x, h.y, "#E0F2FE", 8, 30, 90, 3, 0.3))));
      }
      if (p && g && R.playIceShatter(), p && this.player.eohyen_heal_cd <= 0) {
        this.player.eohyen_heal_cd = 0.8;
        let h = Math.round(this.player.maxHp * 0.025);
        this.healPlayer(h, "HEAL", `+${h} HP (B\u0102NG NGUY\u1EC6T)`), this.spawnParticles(this.player.x, this.player.y, "#38BDF8", 6, 20, 60, 2.5, 0.3);
      }
    } else if (this.currentHero.id === "longhoi") {
      R.playFox();
      let c = 0;
      this.player.longhoi_nextAtkBonus > 0 && (c = this.player.longhoi_nextAtkBonus, this.player.longhoi_nextAtkBonus = 0, this.addFloatingText(this.player.x, this.player.y - 20, `H\u1ED2 B\u1ED8 K\xCDCH +${c}`, "#F97316", 15)), this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "longhoi_arrow", isBurnArrow: true, x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * 740, vy: Math.sin(l) * 740, radius: 8, damage: m + c, color: "#FB923C", angle: l, distanceTraveled: 0, maxDistance: s + 85, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), hasLifestolen: false }), this.queueVfx("proj_vis", { kind: "longhoi_arrow", x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * 740, vy: Math.sin(l) * 740, radius: 8, color: "#FB923C", angle: l, maxDistance: s + 85, pierceLeft: 1 }), this.spawnFlameParticles(this.player.x, this.player.y, "red", 4, 30, 80);
    } else if (this.currentHero.id === "duccong") R.playCosmic(), this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "duccong_orb", x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * 500, vy: Math.sin(l) * 500, radius: 10, damage: m, color: "#A78BFA", angle: l, distanceTraveled: 0, maxDistance: s + 70, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() }), this.queueVfx("proj_vis", { kind: "duccong_orb", x: this.player.x + Math.cos(l) * 20, y: this.player.y + Math.sin(l) * 20, vx: Math.cos(l) * 500, vy: Math.sin(l) * 500, radius: 10, color: "#A78BFA", angle: l, maxDistance: s + 70, pierceLeft: 1 });
    else if (this.currentHero.id === "gau") {
      let c = this.player.gau_cuongHungTimer > 0, g = this.player.gau_basicStep, p = g === 0 ? 1 : g === 1 ? 1.05 : 1.15;
      this.player.gau_basicStep = (g + 1) % 3, this.player.gau_basicResetTimer = 1.3, this.player.gau_animKind = "basic_" + g, this.player.gau_animDur = 0.22, this.player.gau_animTimer = 0.22, this.player.gau_animAngle = l;
      let h = this.player.gau_c1_step === 2 && this.player.gau_c1_windowTimer > 0;
      h && (this.player.gau_c1_basicCancelPrimed = true, this.player.gau_c1_windowTimer = Math.max(this.player.gau_c1_windowTimer, 0.85), this.player.attackTimer = Math.min(this.player.attackTimer, 0.14)), R.playHeavyPunch(g), this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: s + (g === 2 ? 24 : 14), spread: g === 2 ? 1.5 : 1.15, color: c ? "#FBBF24" : "#F59E0B", life: 0, maxLife: 0.22, kind: "gau_punch", step: g, empowered: c }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: s + (g === 2 ? 24 : 14), spread: g === 2 ? 1.5 : 1.15, color: c ? "#FBBF24" : "#F59E0B", maxLife: 0.22, kind: "gau_punch", step: g, empowered: c }), this.spawnParticles(this.player.x + Math.cos(l) * 34, this.player.y + Math.sin(l) * 34, c ? "#FEF08A" : "#F59E0B", g === 2 ? 8 : 5, 50, 140, 2.8, 0.24);
      let f = Math.round(m * p), v = 0;
      for (let T of [...this.enemies]) {
        let b = T.x - this.player.x, x = T.y - this.player.y, C = Math.hypot(b, x) - T.radius;
        C <= s + 16 && (Math.abs(Math.atan2(Math.sin(Math.atan2(x, b) - l), Math.cos(Math.atan2(x, b) - l))) <= 0.88 || C < 34) && (v++, this.damageEnemy(T, f, Math.cos(l) * (g === 2 ? 16 : 6), Math.sin(l) * (g === 2 ? 16 : 6)));
      }
      if (g === 2 && c) {
        let T = this.player.x + Math.cos(l) * 55, b = this.player.y + Math.sin(l) * 55, x = Math.round(m * 0.55);
        this.slashes.push({ x: T, y: b, angle: 0, radius: 110, spread: Math.PI * 2, color: "#FBBF24", life: 0, maxLife: 0.28, kind: "gau_shockring" }), this.queueVfx("slash", { x: T, y: b, angle: 0, radius: 110, spread: Math.PI * 2, color: "#FBBF24", maxLife: 0.28, kind: "gau_shockring" });
        for (let C of [...this.enemies]) Math.hypot(C.x - T, C.y - b) <= 110 + C.radius && (v++, this.damageEnemy(C, x, Math.cos(l) * 18, Math.sin(l) * 18, true));
      }
      if (v > 0 && c) {
        let gh = Math.round(this.player.maxHp * 0.025);
        this.healPlayer(gh, "HEAL", `+${gh} HP (CU\u1ED2NG H\xD9NG)`);
      }
      v > 0 && this.grantGauRage(8), this.comboManager.record({ heroId: "gau", action: "basic", hitCount: v, inTimingWindow: h, empowered: c, damageDealt: f * Math.max(1, v) });
    } else if (this.currentHero.id === "bao") {
      if (this.player.bao_stealthTimer > 0) {
        this.executeBaoAmbush(l);
        return;
      }
      let c = this.player.bao_basicStep, g = c === 2 ? 1.15 : 1;
      this.player.bao_basicDir = c === 1 ? -1 : 1, this.player.bao_basicStep = (c + 1) % 3, this.player.bao_basicResetTimer = 1.25, R.playDaggerSlash(c), this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: s + 16, spread: c === 2 ? 1.65 : 1.25, dir: this.player.bao_basicDir, color: "#E879F9", life: 0, maxLife: 0.2, crossed: c === 2, kind: "bao_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: s + 16, spread: c === 2 ? 1.65 : 1.25, dir: this.player.bao_basicDir, color: "#E879F9", maxLife: 0.2, crossed: c === 2, kind: "bao_slash" });
      let p = Math.round(m * g), h = 0;
      for (let f of [...this.enemies]) {
        let v = f.x - this.player.x, T = f.y - this.player.y, b = Math.hypot(v, T) - f.radius;
        b <= s + 16 && (Math.abs(Math.atan2(Math.sin(Math.atan2(T, v) - l), Math.cos(Math.atan2(T, v) - l))) <= 0.92 || b < 34) && (h++, this.damageEnemy(f, p), f.hp > 0 && this.applyBaoMark(f, 1));
      }
      this.comboManager.record({ heroId: "bao", action: "basic", hitCount: h, damageDealt: p * Math.max(1, h) });
    } else if (this.currentHero.id === "danh") {
      let c = this.player.danh_basicStep, g = c === 0 ? 1 : c === 1 ? 1.08 : 1.22, p = this.player.danh_khaiSonTimer > 0, inDragon = this.player.danh_dragonTimer > 0;
      p && (this.player.danh_khaiSonTimer = 0), this.player.danh_swingDir = c === 1 ? -1 : 1, this.player.danh_animKind = "basic", this.player.danh_animDur = 0.22, this.player.danh_animTimer = 0.22, this.player.danh_basicStep = (c + 1) % 3, this.player.danh_basicResetTimer = 1.4;
      let reach = inDragon ? s + 95 : s + 18, slashKind = inDragon ? "danh_firebreath" : "danh_slash", slashSpread = inDragon ? 1.62 : (c === 2 ? 1.65 : 1.35);
      inDragon ? (R.playDragonBreath(), this.spawnFlameParticles(this.player.x + Math.cos(l) * 32, this.player.y + Math.sin(l) * 32, "red", 9, 45, 160)) : R.playHeavySword(c);
      this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: inDragon ? reach : s + 22, spread: slashSpread, dir: this.player.danh_swingDir, empowered: p || inDragon, color: inDragon ? "#FB923C" : p ? "#FBBF24" : "#EF4444", life: 0, maxLife: inDragon ? 0.3 : 0.22, kind: slashKind }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: inDragon ? reach : s + 22, spread: slashSpread, dir: this.player.danh_swingDir, empowered: p || inDragon, color: inDragon ? "#FB923C" : p ? "#FBBF24" : "#EF4444", maxLife: inDragon ? 0.3 : 0.22, kind: slashKind });
      let dragonMult = inDragon ? computeDanhDragonFormModifiers(true).basicDmgMult : 1;
      let h = Math.round(m * g * dragonMult * (p ? 1.3 : 1)), f = 0;
      for (let v of [...this.enemies]) {
        let T = v.x - this.player.x, b = v.y - this.player.y, x = Math.hypot(T, b) - v.radius;
        x <= reach && (Math.abs(Math.atan2(Math.sin(Math.atan2(b, T) - l), Math.cos(Math.atan2(b, T) - l))) <= (inDragon ? 0.96 : 0.92) || x < 38) && (f++, this.damageEnemy(v, h, Math.cos(l) * (inDragon ? 15 : 10), Math.sin(l) * (inDragon ? 15 : 10)), inDragon && this.spawnFlameParticles(v.x, v.y, "red", 3, 20, 75));
      }
      if (f > 0 && p) {
        let dh = Math.round(this.player.maxHp * 0.04);
        this.healPlayer(dh, "HEAL", `+${dh} HP (KHAI S\u01A0N)`);
      }
      f > 0 && !p && (this.player.danh_basicHitCount++, this.player.danh_basicHitCount >= 2 && (this.player.danh_basicHitCount = 0, this.player.danh_khaiSonTimer = 5, this.addFloatingText(this.player.x, this.player.y - 26, "\u2694\uFE0F KHAI S\u01A0N (+30% \xB7 5s)!", "#FBBF24", 14))), this.comboManager.record({ heroId: "danh", action: "basic", hitCount: f, empowered: p || inDragon, damageDealt: h * Math.max(1, f) });
    } else if (this.currentHero.id === "luan") {
      let ap = this.getEffectiveAP(), dmg = Math.round(m * 0.48 + ap * 0.54), sx = this.player.x + Math.cos(l) * 22, sy = this.player.y + Math.sin(l) * 22;
      R.playOrb();
      this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "luan_orb", x: sx, y: sy, vx: Math.cos(l) * 580, vy: Math.sin(l) * 580, radius: 12, damage: dmg, color: "#C084FC", angle: l, distanceTraveled: 0, maxDistance: s + 95, pierceLeft: 1, portalBoosted: false, passedPortalIds: /* @__PURE__ */ new Set(), hitIds: /* @__PURE__ */ new Set() });
      this.queueVfx("proj_vis", { kind: "luan_orb", x: sx, y: sy, vx: Math.cos(l) * 580, vy: Math.sin(l) * 580, radius: 12, color: "#C084FC", angle: l, maxDistance: s + 95, pierceLeft: 1 });
      this.spawnParticles(sx, sy, "#E879F9", 5, 25, 80, 2.6, 0.25);
      let rx2 = Math.max(36, Math.min(Se - 36, this.player.x + Math.cos(l) * Math.min(210, s * 0.72))), ry2 = Math.max(36, Math.min(Ce - 36, this.player.y + Math.sin(l) * Math.min(210, s * 0.72)));
      this.carveLuanRift(sx, sy, rx2, ry2, ap, 8);
    } else if (this.currentHero.id === "taidu") {
      this.player.taidu_barrelParity = -(this.player.taidu_barrelParity || 1);
      let perp = l + Math.PI / 2, off = this.player.taidu_barrelParity * 6.5, sx = this.player.x + Math.cos(l) * 32 + Math.cos(perp) * off, sy = this.player.y + Math.sin(l) * 32 + Math.sin(perp) * off, boltDmg = Math.round(m * 0.78);
      R.playTurretShot();
      this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "taidu_bolt", x: sx, y: sy, vx: Math.cos(l) * 860, vy: Math.sin(l) * 860, radius: 7, damage: boltDmg, color: "#F97316", angle: l, distanceTraveled: 0, maxDistance: s + 85, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
      this.queueVfx("proj_vis", { kind: "taidu_bolt", x: sx, y: sy, vx: Math.cos(l) * 860, vy: Math.sin(l) * 860, radius: 7, color: "#F97316", angle: l, maxDistance: s + 85, pierceLeft: 1 });
      this.spawnParticles(sx, sy, "#38BDF8", 4, 30, 95, 2.2, 0.2);
      this.comboManager.record({ heroId: "taidu", action: "basic", hitCount: 1, damageDealt: boltDmg });
    } else if (this.currentHero.id === "nguyen") {
      let ap = this.getEffectiveAP(), dir = this.player.attackSwingParity || 1, waveDmg = Math.round(m * 0.78);
      R.playShieldBlock();
      this.slashes.push({ x: this.player.x, y: this.player.y, angle: l, radius: s + 22, spread: 1.45, dir, color: "#10B981", life: 0, maxLife: 0.22, kind: "nguyen_wave" });
      this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: l, radius: s + 22, spread: 1.45, dir, color: "#10B981", maxLife: 0.22, kind: "nguyen_wave" });
      let hitCnt = 0;
      for (let e of [...this.enemies]) {
        let dx = e.x - this.player.x, dy = e.y - this.player.y, d = Math.hypot(dx, dy) - e.radius;
        d <= s + 20 && (Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - l), Math.cos(Math.atan2(dy, dx) - l))) <= 0.9 || d < 34) && (hitCnt++, this.damageEnemy(e, waveDmg, Math.cos(l) * 12, Math.sin(l) * 12));
      }
      let sx = this.player.x + Math.cos(l) * 24, sy = this.player.y + Math.sin(l) * 24, boltDmg = Math.round(0.32 * m + 0.38 * ap);
      this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "nguyen_bolt", x: sx, y: sy, vx: Math.cos(l) * 580, vy: Math.sin(l) * 580, radius: 9, damage: boltDmg, color: "#34D399", angle: l, distanceTraveled: 0, maxDistance: s + 65, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
      this.queueVfx("proj_vis", { kind: "nguyen_bolt", x: sx, y: sy, vx: Math.cos(l) * 580, vy: Math.sin(l) * 580, radius: 9, color: "#34D399", angle: l, maxDistance: s + 65, pierceLeft: 1 });
      this.comboManager.record({ heroId: "nguyen", action: "basic", hitCount: Math.max(1, hitCnt), damageDealt: waveDmg + boltDmg });
    }
  }
  getDefaultAimForSkill(s) {
    let a = this.currentHero.skills[s], l = this.findNearestEnemy(Math.max(a.range, 320)), m = l ? Math.atan2(l.y - this.player.y, l.x - this.player.x) : this.player.facing, c = l ? Math.min(a.range || 240, Math.hypot(l.x - this.player.x, l.y - this.player.y)) : Math.min(a.range || 200, 180);
    return { angle: m, targetX: Math.max(40, Math.min(Se - 40, this.player.x + Math.cos(m) * c)), targetY: Math.max(40, Math.min(Ce - 40, this.player.y + Math.sin(m) * c)) };
  }
  checkAimHasTarget(s, a, l) {
    for (let m of this.enemies) {
      if (m.hp <= 0) continue;
      let c = m.x - this.player.x, g = m.y - this.player.y, p = Math.hypot(c, g) - m.radius;
      if (p <= a + 20) if (l === "PATH") {
        if (this.pointToSegmentDist(m.x, m.y, this.player.x, this.player.y, this.player.x + Math.cos(s) * a, this.player.y + Math.sin(s) * a) <= 95 + m.radius) return true;
      } else if (l === "LINE" || l === "CONE") {
        if (Math.abs(Math.atan2(Math.sin(Math.atan2(g, c) - s), Math.cos(Math.atan2(g, c) - s))) <= (l === "CONE" ? 0.95 : 0.45) || p < 40) return true;
      } else return true;
    }
    return false;
  }
  canActivateSkill(s) {
    if (this.gameState !== "PLAYING" || this.waitingReward || this.waveCleared || this.multiplayer.active && this.multiplayer.localDowned) return false;
    let a = this.player, l = this.currentHero.id;
    return l === "gau" && s === 0 && a.gau_c1_step > 0 || l === "gau" && s === 1 && a.gau_c2_guardTimer > 0 || l === "bao" && s === 0 && a.bao_c1_recastTimer > 0 && a.bao_c1_awaitingSecond || l === "bao" && s === 1 && a.bao_stealthTimer > 0 || l === "danh" && s === 0 && a.danh_c1_step > 0 || l === "tin" && s === 0 && a.tin_c1_recast_timer > 0 || l === "luan" && s === 1 && this.luanPortals?.length > 0 && a.luan_c2_recastLock <= 0 || l === "duccong" && (s === 1 || s === 2) && a.cooldowns[s] > 0 && this.duccong_pads?.[s] && this.duccong_pads[s].teleportCd <= 0 || a.cooldowns[s] <= 0;
  }
  isSkillHoldable(s) {
    return this.currentHero.id === "danh" ? (this.player.danh_dragonTimer > 0 ? false : s === 1 || s === 0 && this.player.danh_c1_step === 2) : false;
  }
  startSkillHold(s, a, l, m) {
    if (this.gameState !== "PLAYING" || this.waitingReward || this.waveCleared || this.player.stunTimer > 0 || this.player.cooldowns[s] > 0 || !this.isSkillHoldable(s) || this.multiplayer.active && this.multiplayer.localDowned) return;
    let c = s === 1 ? "danh_c2" : "danh_c1_wave", g = s === 1 ? 2.5 : 1.5;
    this.player.chargeState = { active: true, skillIdx: s, kind: c, elapsed: 0, maxDur: g, angle: a, targetX: l, targetY: m }, this.player.facing = a;
  }
  updateSkillHoldAim(s, a, l) {
    this.player.chargeState.active && (this.player.chargeState.angle = s, this.player.chargeState.targetX = a, this.player.chargeState.targetY = l, this.player.facing = s);
  }
  releaseSkillHold(s, a, l, m, c = false) {
    if (this.player.chargeState.active && this.player.chargeState.skillIdx === s) {
      let g = this.player.chargeState.elapsed, p = this.player.chargeState.kind;
      if (this.player.chargeState.active = false, this.player.chargeState.kind = null, this.player.chargeState.elapsed = 0, c) return;
      if (p === "danh_c2") {
        this.castDanhC2Charged(a, g);
        return;
      }
      if (p === "danh_c1_wave") {
        this.castDanhC1Step3(a, g >= 0.35, g);
        return;
      }
    }
    c || this.castSkill(s, a, l, m);
  }
  castSkill(s, a, l, m) {
    if (this.gameState !== "PLAYING" || this.waitingReward || this.waveCleared || this.multiplayer.active && this.multiplayer.localDowned) return;
    if (this.player.stunTimer > 0) {
      this.addFloatingText(this.player.x, this.player.y - 24, "\u{1F4AB} \u0110ANG B\u1ECA CHO\xC1NG!", "#FACC15", 13);
      return;
    }
    let c = this.currentHero.id === "dung" && s === 0 || this.currentHero.id === "tin" && (s === 0 || s === 2) || this.currentHero.id === "kin" && s === 1 || this.currentHero.id === "longhoi" && s === 1 || this.currentHero.id === "gau" && s === 2 || this.currentHero.id === "bao" && (s === 0 || s === 1 || s === 2);
    if (this.player.rootTimer > 0 && c) {
      this.addFloatingText(this.player.x, this.player.y - 24, "\u26D3\uFE0F \u0110ANG B\u1ECA TR\xD3I CH\xC2N!", "#C084FC", 13);
      return;
    }
    if (this.currentHero.id === "gau" && s === 1 && this.player.gau_c2_guardTimer > 0) {
      this.player.gau_c2_recastLock <= 0 && this.executeGauC2Slam();
      return;
    }
    if (this.currentHero.id === "bao" && s === 1 && this.player.bao_stealthTimer > 0) {
      this.player.bao_stealthLockTimer <= 0 && this.executeBaoAmbush(a);
      return;
    }
    if (this.currentHero.id === "bao" && s === 0 && this.player.bao_c1_recastTimer > 0 && this.player.bao_c1_awaitingSecond) {
      this.castBaoC1Swap(a);
      return;
    }
    if (this.currentHero.id === "luan" && s === 1 && this.luanPortals.length > 0) {
      this.player.luan_c2_recastLock <= 0 && this.closeAndDetonateLuanPortals();
      return;
    }
    if (this.currentHero.id === "duccong" && (s === 1 || s === 2) && this.player.cooldowns[s] > 0 && this.duccong_pads?.[s]) {
      let pad = this.duccong_pads[s];
      if (pad.teleportCd > 0) {
        this.addFloatingText(this.player.x, this.player.y - 26, `\u23F3 D\u1ECACH CHUY\u1EC2N ${pad.teleportCd.toFixed(1)}s`, "#C084FC", 13);
        return;
      }
      this.afterimages.push({ x: this.player.x, y: this.player.y, facing: this.player.facing, color: "#A855F7", alpha: 0.9, life: 0, maxLife: 0.38, radius: this.player.radius }), this.queueVfx("afterimage", { x: this.player.x, y: this.player.y, facing: this.player.facing, color: "#A855F7", alpha: 0.9, maxLife: 0.38 });
      this.spawnParticles(this.player.x, this.player.y, "#C084FC", 10, 40, 140, 3, 0.35);
      this.player.x = Math.max(this.player.radius + 14, Math.min(Se - this.player.radius - 14, pad.x));
      this.player.y = Math.max(this.player.radius + 14, Math.min(Ce - this.player.radius - 14, pad.y));
      this.tapDestination = null;
      pad.teleportCd = 1.5;
      this.player.weaponSkillTimer = 0.45, this.player.weaponSkillDur = 0.45;
      R.playCosmic(), R.playDash();
      this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 64, spread: Math.PI * 2, color: "#E9D5FF", life: 0, maxLife: 0.28, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 64, spread: Math.PI * 2, color: "#E9D5FF", maxLife: 0.28, kind: "shockwave" });
      this.spawnParticles(this.player.x, this.player.y, "#E9D5FF", 14, 50, 160, 3.2, 0.38);
      this.addFloatingText(this.player.x, this.player.y - 28, `\u{1F30C} D\u1ECACH CHUY\u1EC2N \xD4 C${s + 1}!`, "#E9D5FF", 15);
      return;
    }
    if (this.player.cooldowns[s] > 0 && !(this.currentHero.id === "tin" && s === 0 && this.player.tin_c1_recast_timer > 0)) return;
    let g = this.currentHero.skills[s], p = this.getHeroGearStats(this.currentHero.id), h = this.currentHero.id === "gau" || this.currentHero.id === "bao" || this.currentHero.id === "danh" || this.currentHero.id === "luan" && s === 1, f = g.cooldown * (1 - p.cdr), isTinFreeRecast = this.currentHero.id === "tin" && s === 0 && this.player.tin_c1_recast_timer > 0;
    h || isTinFreeRecast || (this.player.cooldowns[s] = f), this.player.facing = a, this.player.weaponSkillTimer = 0.46, this.player.weaponSkillDur = 0.46, this.player.weaponSkillIdx = s, (this.currentHero.id === "kin" || this.currentHero.id === "longhoi") && (this.player.weaponAttackDuration = 0.22, this.player.attackAnimTimer = 0.22, this.player.attackAnimAngle = a, this.player.bowRecoilTimer = 0.16), this.currentHero.id === "duccong" && (this.player.skillRefundAccumulated[s] = 0);
    let v = this.getEffectiveDamage() / this.currentHero.stats.damage, T = () => {
      p.dashAttackSpeed > 0 && (this.player.dashBuffAsTimer = Math.max(this.player.dashBuffAsTimer, 2), this.addFloatingText(this.player.x, this.player.y - 15, "L\xD4I \u1EA2NH +20% T\u1ED0C \u0110\xC1NH", "#FDE68A", 13));
    };
    if (this.currentHero.id === "dung") {
      if (s === 0) {
        R.playDash(), R.playElectricZap(), T(), this.player.dashActive = true, this.player.dashKind = "dung_c1", this.player.dashTimer = 0.22;
        let b = g.range / 0.22;
        this.player.dashVx = Math.cos(a) * b, this.player.dashVy = Math.sin(a) * b, this.player.dashDamage = 85 * v, this.player.dashHitIds.clear(), this.scorchMarks.push({ x: this.player.x, y: this.player.y, angle: a, len: g.range, life: 0, maxLife: 3.5 }), this.spawnGroundCrack(this.player.x, this.player.y, a, g.range * 0.9, "#F97316", "#FDE047"), this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: a, len: g.range * 0.9, color: "#F97316", glowColor: "#FDE047" }), this.spawnParticles(this.player.x, this.player.y, "#38BDF8", 12, 50, 160, 3, 0.4), this.queueVfx("particles", { x: this.player.x, y: this.player.y, color: "#38BDF8", count: 12, minSpd: 50, maxSpd: 160, size: 3, life: 0.4 });
      } else if (s === 1) R.playLevelUp(), this.player.berserkTimer = 6, this.player.berserkHealPerHit = 22, this.spawnFlameParticles(this.player.x, this.player.y, "red", 16, 50, 150), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 85, spread: Math.PI * 2, color: "#F97316", life: 0, maxLife: 0.28, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 85, spread: Math.PI * 2, color: "#F97316", maxLife: 0.28, kind: "shockwave" }), this.queueVfx("particles", { x: this.player.x, y: this.player.y, flame: true, flameColor: "red", count: 16, minSpd: 50, maxSpd: 150 }), this.addFloatingText(this.player.x, this.player.y - 24, "CUỒNG CHIẾN HUYẾT MẠCH!", "#F59E0B", 16);
      else if (s === 2) {
        R.playThunderStrike(), this.addShake(12, 0.35);
        let b = g.radius || 160;
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: b, spread: Math.PI * 2, color: "#38BDF8", life: 0, maxLife: 0.42, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: b, spread: Math.PI * 2, color: "#38BDF8", maxLife: 0.42, kind: "shockwave" }), this.spawnGroundCrack(this.player.x, this.player.y, 0, b * 0.85, "#38BDF8", "#E0F2FE"), this.spawnGroundCrack(this.player.x, this.player.y, Math.PI / 2, b * 0.85, "#38BDF8", "#E0F2FE"), this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: 0, len: b * 0.85, color: "#38BDF8", glowColor: "#E0F2FE" }), this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: Math.PI / 2, len: b * 0.85, color: "#38BDF8", glowColor: "#E0F2FE" });
        for (let C = 0; C < 6; C++) {
          let H = Math.PI * 2 / 6 * C;
          this.createBranchingLightning(this.player.x, this.player.y, this.player.x + Math.cos(H) * b, this.player.y + Math.sin(H) * b, "#38BDF8", 3), this.queueVfx("lightning", { x1: this.player.x, y1: this.player.y, x2: this.player.x + Math.cos(H) * b, y2: this.player.y + Math.sin(H) * b, color: "#38BDF8", width: 3 });
        }
        let x = false;
        for (let C of [...this.enemies]) Math.hypot(C.x - this.player.x, C.y - this.player.y) <= b + C.radius && (x = true, this.damageEnemy(C, 180 * v, 0, 0, true));
        x && this.healPlayer(180, "HEAL", "+180 HP (CHI\u1EBEN TH\u1EA6N)"), this.addPlayerShield(500, 10), this.player.stunTimer = 0, this.player.rootTimer = 0, this.player.slowTimer = 0, this.player.slowFactor = 0, this.player.dung_c3_buff_timer = 10, this.addFloatingText(this.player.x, this.player.y - 36, "\u26A1 CHI\u1EBEN TH\u1EA6N 10s! MI\u1EC4N KH\u1ED0NG \xB7 +75% MI\u1EC4N TH\u01AF\u01A0NG \xB7 KHI\xCAN 500", "#FDE047", 15);
      }
    } else if (this.currentHero.id === "tin") {
      let empMult = this.player.tin_empowered ? (this.player.tin_empowered = false, TIN_EMPOWERED_SKILL_MULT) : 1;
      if (s === 0) {
        R.playDash(), T(), this.player.dashActive = true, this.player.dashKind = "tin_c1", this.player.dashTimer = 0.2;
        let b = g.range / 0.2;
        this.player.dashVx = Math.cos(a) * b, this.player.dashVy = Math.sin(a) * b, this.player.dashDamage = 95 * v * empMult, this.player.dashHitIds.clear(), this.player.tin_c1_refunded_c2 = false, this.player.tin_c1_charges = 0, this.player.tin_c1_recast_timer = 0, isTinFreeRecast ? this.addFloatingText(this.player.x, this.player.y - 26, "\u26A1 \u1EA2NH B\u1ED8 MI\u1EC4N PH\xCD!", "#FB7185", 14) : (this.player.cooldowns[0] = f, this.grantTinResonance(1, false)), this.spawnSpatialTear(this.player.x, this.player.y, this.player.x + Math.cos(a) * g.range, this.player.y + Math.sin(a) * g.range, "#F43F5E", 12), this.queueVfx("tear", { x1: this.player.x, y1: this.player.y, x2: this.player.x + Math.cos(a) * g.range, y2: this.player.y + Math.sin(a) * g.range, color: "#F43F5E", width: 12 });
      } else if (s === 1) {
        R.playSlash(), R.playOrb();
        let b = g.range || 270, c2Heal = Math.max(240, Math.round(this.player.maxHp * 0.18));
        this.healPlayer(c2Heal, "HEAL", `+${c2Heal} HP (MA TH\u1EA0CH)`), this.grantTinResonance(1, false);
        this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "tin_crystal_throw", x: this.player.x + Math.cos(a) * 18, y: this.player.y + Math.sin(a) * 18, vx: Math.cos(a) * 920, vy: Math.sin(a) * 920, radius: 16, damage: 155 * v * empMult, color: "#EF4444", angle: a, distanceTraveled: 0, maxDistance: b, pierceLeft: 99, hitIds: /* @__PURE__ */ new Set(), hasHealedPlayer: false }), this.queueVfx("proj_vis", { kind: "tin_crystal_throw", x: this.player.x + Math.cos(a) * 18, y: this.player.y + Math.sin(a) * 18, vx: Math.cos(a) * 920, vy: Math.sin(a) * 920, radius: 16, color: "#EF4444", angle: a, maxDistance: b, pierceLeft: 99 }), this.spawnRedCrystals(this.player.x, this.player.y, 6, 50, 140), this.queueVfx("particles", { x: this.player.x, y: this.player.y, color: "#F43F5E", count: 8, minSpd: 50, maxSpd: 140, size: 3.2, life: 0.35 });
      } else if (s === 2) {
        let b = this.findTargetForTinC3(a, g.range);
        if (!b) {
          this.player.cooldowns[2] = 0, empMult > 1 && (this.player.tin_empowered = true), this.addFloatingText(this.player.x, this.player.y - 24, "KH\xD4NG C\xD3 M\u1EE4C TI\xCAU", "#94A3B8", 13);
          return;
        }
        this.player.tin_monochrome_realm_timer = 1.25, this.screenFlashWhite = 0.35, R.playRealmSlash(), this.addShake(18, 0.55), this.grantTinResonance(1, false);
        let x = this.player.x, C = this.player.y;
        for (let P = 0; P < 7; P++) {
          let N = P / 7;
          this.afterimages.push({ x: x + (b.x - x) * N, y: C + (b.y - C) * N, facing: a, color: "#000000", alpha: 0.95, life: 0, maxLife: 0.6, radius: this.player.radius }), P % 2 === 0 && this.queueVfx("afterimage", { x: x + (b.x - x) * N, y: C + (b.y - C) * N, facing: a, color: "#000000", alpha: 0.95, maxLife: 0.6 });
        }
        let H = Math.atan2(b.y - C, b.x - x);
        this.player.x = Math.max(40, Math.min(Se - 40, b.x - Math.cos(H) * (b.radius + 20))), this.player.y = Math.max(40, Math.min(Ce - 40, b.y - Math.sin(H) * (b.radius + 20))), this.player.facing = H, this.createBranchingLightning(x, C, b.x, b.y, "#F43F5E", 4.5), this.queueVfx("lightning", { x1: x, y1: C, x2: b.x, y2: b.y, color: "#F43F5E", width: 4.5 }), this.spawnRedCrystals(b.x, b.y, 18, 90, 260), this.spawnSpatialTear(b.x - 105, b.y - 105, b.x + 105, b.y + 105, "#F43F5E", 15), this.spawnSpatialTear(b.x + 105, b.y - 105, b.x - 105, b.y + 105, "#F43F5E", 15), this.queueVfx("tear", { x1: b.x - 105, y1: b.y - 105, x2: b.x + 105, y2: b.y + 105, color: "#F43F5E", width: 15 }), this.queueVfx("tear", { x1: b.x + 105, y1: b.y - 105, x2: b.x - 105, y2: b.y + 105, color: "#F43F5E", width: 15 }), this.spawnGroundCrack(b.x, b.y, H, 85, "#BE123C", "#FDA4AF"), this.queueVfx("crack", { x: b.x, y: b.y, angle: H, len: 85, color: "#BE123C", glowColor: "#FDA4AF" });
        let D = 320 * v * empMult;
        b.hp <= b.maxHp * 0.25 && (D += 110 * v, this.addFloatingText(b.x, b.y - 28, "K\u1EBET LI\u1EC4U +110 DMG", "#F43F5E", 18)), this.healPlayer(Math.round(this.player.maxHp * 0.08), "HEAL", "+8% HP (L\xC3NH \u0110\u1ECAA)"), this.damageEnemy(b, D, 0, 0, true) && (this.player.cooldowns[0] *= 0.5, this.player.cooldowns[1] *= 0.5, this.healPlayer(Math.round(this.player.maxHp * 0.15), "HEAL", "+15% MAX HP"), R.playLevelUp(), this.addFloatingText(this.player.x, this.player.y - 36, "GI\u1EA2M 50% C1/C2 & +15% HP!", "#F43F5E", 17));
      }
    } else if (this.currentHero.id === "kin") {
      if (s === 0) {
        R.playBow();
        for (let b = -1; b <= 1; b++) {
          let x = a + b * 0.14;
          this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "pierce_arrow", x: this.player.x + Math.cos(x) * 20, y: this.player.y + Math.sin(x) * 20, vx: Math.cos(x) * 760, vy: Math.sin(x) * 760, radius: 11, damage: 52 * v, color: "#34D399", angle: x, distanceTraveled: 0, maxDistance: g.range, pierceLeft: 3, hitIds: /* @__PURE__ */ new Set() }), this.queueVfx("proj_vis", { kind: "pierce_arrow", x: this.player.x + Math.cos(x) * 20, y: this.player.y + Math.sin(x) * 20, vx: Math.cos(x) * 760, vy: Math.sin(x) * 760, radius: 11, color: "#34D399", angle: x, maxDistance: g.range, pierceLeft: 3 });
        }
      } else if (s === 1) {
        R.playWind(0.28, 0.24), R.playDash();
        let b = this.player.facing + Math.PI;
        this.player.dashActive = true, this.player.dashKind = "kin_c2", this.player.dashTimer = 0.2, this.player.dashVx = Math.cos(b) * 750, this.player.dashVy = Math.sin(b) * 750, this.player.kin_asBuffTimer = 3.5, this.player.kin_c2_lifestealTimer = 5, this.healPlayer(Math.round(this.player.maxHp * 0.05), "HEAL", "+5% HP (\u1EA2NH TI\u1EC4N)"), this.addFloatingText(this.player.x, this.player.y - 32, "\u{1FA78} H\xDAT M\xC1U 40% (5s)!", "#34D399", 15), this.slashes.push({ x: this.player.x, y: this.player.y, angle: this.player.facing, radius: 105, spread: 1.6, color: "#34D399", life: 0, maxLife: 0.28, kind: "slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: this.player.facing, radius: 105, spread: 1.6, color: "#34D399", maxLife: 0.28, kind: "slash" });
        for (let x of [...this.enemies]) Math.hypot(x.x - this.player.x, x.y - this.player.y) <= 115 + x.radius && (this.damageEnemy(x, 85 * v, Math.cos(this.player.facing) * 25, Math.sin(this.player.facing) * 25, true), this.isBossImmune(x) || (x.slowFactor = Math.max(x.slowFactor, 0.35), x.slowTimer = Math.max(x.slowTimer, 2.5)));
      } else if (s === 2) {
        R.playTornadoStorm();
        let b = Math.max(40, Math.min(Se - 40, l)), x = Math.max(40, Math.min(Ce - 40, m));
        this.zones.push({ id: this.nextEntityId++, kind: "arrow_rain", x: b, y: x, radius: g.radius || 155, timer: 0, duration: 3.5, tickTimer: 0, tickInterval: 0.45, damagePerTick: 48 * v, slowFactor: 0.45, rotation: 0 }), this.queueVfx("zone_vis", { kind: "arrow_rain", x: b, y: x, radius: g.radius || 155, duration: 3.5 });
      }
    } else if (this.currentHero.id === "trung") {
      this.player.trung_passive = (this.player.trung_passive || 0) + 1;
      let b = 0;
      if (this.player.trung_passive >= 3 && (this.player.trung_passive = 0, b = 45, this.healPlayer(Math.round(this.player.maxHp * 0.035), "HEAL", "+3.5% HP (MA L\u1EF0C)"), this.addFloatingText(this.player.x, this.player.y - 24, "MA L\u1EF0C T\xCDCH T\u1EE4! +45 DMG", "#A5B4FC", 15)), s === 0) {
        let tx = Math.max(50, Math.min(Se - 50, l)), ty = Math.max(50, Math.min(Ce - 50, m)), tr = g.radius || 108;
        R.playThunderStrike(), this.addShake(11, 0.28), this.createBranchingLightning(tx, ty - 520, tx, ty, "#FDE047", 5), this.createBranchingLightning(tx - 16, ty - 480, tx, ty, "#818CF8", 3), this.queueVfx("lightning", { x1: tx, y1: ty - 520, x2: tx, y2: ty, color: "#FDE047", width: 5 }), this.queueVfx("lightning", { x1: tx - 16, y1: ty - 480, x2: tx, y2: ty, color: "#818CF8", width: 3 }), this.slashes.push({ x: tx, y: ty, angle: 0, radius: tr, spread: Math.PI * 2, color: "#FDE047", life: 0, maxLife: 0.36, kind: "shockwave" }), this.queueVfx("slash", { x: tx, y: ty, angle: 0, radius: tr, spread: Math.PI * 2, color: "#FDE047", maxLife: 0.36, kind: "shockwave" }), this.spawnParticles(tx, ty, "#FDE047", 18, 60, 210, 3.6, 0.38), this.spawnGroundCrack(tx, ty, Math.random() * Math.PI * 2, tr * 0.85, "#6366F1", "#FEF08A"), this.queueVfx("crack", { x: tx, y: ty, angle: 0.4, len: tr * 0.85, color: "#6366F1", glowColor: "#FEF08A" });
        for (let C of [...this.enemies]) Math.hypot(C.x - tx, C.y - ty) <= tr + C.radius && this.damageEnemy(C, (195 + b) * v, 0, 0, true);
        this.zones.push({ id: this.nextEntityId++, kind: "trung_thunder_zone", x: tx, y: ty, radius: tr, timer: 0, duration: 5, tickTimer: 0, tickInterval: 0.5, damagePerTick: (18 + 0.125 * b) * v, exposureMap: {}, rotation: 0 }), this.queueVfx("zone_vis", { kind: "trung_thunder_zone", x: tx, y: ty, radius: tr, duration: 5 }), this.addFloatingText(tx, ty - 34, "\u26A1 THI\xCAN L\xD4I GI\xC1NG TH\u1EBE (5,0s)!", "#FDE047", 15);
      } else if (s === 1) R.playHeal(), this.addPlayerShield(150, 4, (70 + b) * v, 130, 0), this.player.trung_orbs = { active: true, timer: 6, duration: 6, count: 6, rot: 0, rotSpeed: Math.PI * 2 / 0.75, radius: 76, hitCooldowns: {} }, this.addFloatingText(this.player.x, this.player.y - 28, "\u{1F52E} 6 C\u1EA6U MA PH\xC1P H\u1ED8 TH\u1EC2 (H\u1ED2I 38 HP/CH\u1EA0M)", "#A5B4FC", 16);
      else if (s === 2) {
        let x = Math.max(50, Math.min(Se - 50, l)), C = Math.max(50, Math.min(Ce - 50, m));
        R.playDragonRoar(), this.summonGiantMeteor(x, C, (275 + b) * v, 215), this.queueVfx("meteor_vis", { x, y: C, radius: 215, color: "#F97316", meteorSize: 46, duration: 0.65 }), this.spawnGroundCrack(x, C, Math.random() * Math.PI * 2, 140, "#EA580C", "#FEF08A"), this.spawnGroundCrack(x, C, Math.random() * Math.PI * 2, 120, "#DC2626", "#F97316"), this.queueVfx("crack", { x, y: C, angle: 0.4, len: 140, color: "#EA580C", glowColor: "#FEF08A" }), this.queueVfx("crack", { x, y: C, angle: 2.0, len: 120, color: "#DC2626", glowColor: "#F97316" }), this.lavaPools.push({ id: this.nextEntityId++, x, y: C, radius: 215, timer: 0, duration: 4, tickTimer: 0, tickInterval: 0.5, damagePerTick: 28 * v }), this.queueVfx("lava_vis", { x, y: C, radius: 215, duration: 4 });
      }
    } else if (this.currentHero.id === "eohyen") {
      if (s === 0) {
        R.playIceSlash();
        let b = g.range || 140;
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: b, spread: 1.6, color: "#38BDF8", life: 0, maxLife: 0.28, kind: "slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: b, spread: 1.6, color: "#38BDF8", maxLife: 0.28, kind: "slash" }), this.spawnFlameParticles(this.player.x, this.player.y, "blue", 6, 40, 100);
        for (let x = -1; x <= 1; x++) if (this.icePillars.length < 30) {
          let C = a + x * 0.35, H = this.player.x + b * 0.8 * Math.cos(C), D = this.player.y + b * 0.8 * Math.sin(C), P = x === 0, pRot = Math.random() * Math.PI, pSz = 16 + Math.random() * 8;
          this.icePillars.push({ id: this.nextEntityId++, x: H, y: D, rot: pRot, size: pSz, maxSize: 22, active: true, state: P ? "plunging" : "rising", animTimer: 0, maxAnimTimer: 0.3, plungeOffset: P ? 160 : 0, riseProgress: +!!P, levitateHeight: 0, glowAlpha: 0.85 }), this.queueVfx("eohyen_pillar_vis", { ownerId: mpClient.playerId, x: H, y: D, rot: Math.round(pRot * 100) / 100, size: Math.round(pSz), state: P ? "plunging" : "rising" }), this.spawnGroundCrack(H, D, C, 38, "#38BDF8", "#E0F2FE"), this.queueVfx("crack", { x: H, y: D, angle: C, len: 38, color: "#38BDF8", glowColor: "#E0F2FE" }), this.spawnParticles(H, D, "#BAE6FD", 8, 30, 90, 3, 0.3);
        }
        for (let x of [...this.enemies]) {
          let C = x.x - this.player.x, H = x.y - this.player.y, D = Math.hypot(C, H) - x.radius;
          if (D <= b && (Math.abs(Math.atan2(Math.sin(Math.atan2(H, C) - a), Math.cos(Math.atan2(H, C) - a))) <= 0.95 || D < 32)) {
            let P = 100 * v;
            (x.slowFactor > 0 || x.slowTimer > 0) && (P += 25 * v, this.addFloatingText(x.x, x.y - 20, "+25 B\u0102NG!", "#38BDF8", 14)), this.damageEnemy(x, P, 0, 0, true), this.isBossImmune(x) ? this.notifyBossImmune(x, "MI\u1EC4N NHI\u1EC4M L\xC0M CH\u1EACM") : (x.slowFactor = Math.max(x.slowFactor, 0.3), x.slowTimer = Math.max(x.slowTimer, 2.5));
          }
        }
      } else if (s === 1) {
        let b = Math.round(this.player.maxHp * 0.08);
        R.playIceShield(), this.addPlayerShield(b, 3, 70 * v, 110, 0.15), this.spawnParticles(this.player.x, this.player.y, "#38BDF8", 14, 40, 120, 3.5, 0.4);
        for (let x = 0; x < 6; x++) if (this.icePillars.length < 30) {
          let C = Math.PI * 2 / 6 * x, H = this.player.x + Math.cos(C) * 78, D = this.player.y + Math.sin(C) * 78, P = x % 2 == 0, pRot = Math.random() * Math.PI, pSz = 16 + Math.random() * 6;
          this.icePillars.push({ id: this.nextEntityId++, x: H, y: D, rot: pRot, size: pSz, maxSize: 22, active: true, state: P ? "plunging" : "rising", animTimer: 0, maxAnimTimer: 0.28, plungeOffset: P ? 150 : 0, riseProgress: +!!P, levitateHeight: 0, glowAlpha: 0.9 }), this.queueVfx("eohyen_pillar_vis", { ownerId: mpClient.playerId, x: H, y: D, rot: Math.round(pRot * 100) / 100, size: Math.round(pSz), state: P ? "plunging" : "rising" }), this.spawnGroundCrack(H, D, C, 32, "#38BDF8", "#E0F2FE"), this.queueVfx("crack", { x: H, y: D, angle: C, len: 32, color: "#38BDF8", glowColor: "#E0F2FE" }), this.spawnParticles(H, D, "#E0F2FE", 6, 25, 75, 2.5, 0.3);
        }
        this.addFloatingText(this.player.x, this.player.y - 24, `❄️ CẮM CỌC BĂNG (${this.icePillars.filter((p) => !p.visualOnly).length}/30)`, "#BAE6FD", 14);
      } else if (s === 2) {
        let b = Math.round(this.player.maxHp * 0.18);
        this.healPlayer(b, "HEAL", `+${b} HP (BĂNG PHÁN QUYẾT)`), R.playIceStorm();
        let ownPillars = this.icePillars.filter((p) => !p.visualOnly);
        let x = Math.max(40, Math.min(Se - 40, l)), C = Math.max(40, Math.min(Ce - 40, m)), H = ownPillars.length, D = Math.max(3, Math.min(18, 3 + H / 30 * 15)), P = Math.max(25, H * 9 + 18);
        for (let N = 0; N < ownPillars.length; N++) {
          let W = ownPillars[N];
          W.state = "levitating", W.animTimer = 0, W.maxAnimTimer = 0.25 + N / Math.max(1, H) * 1.1, W.levitateHeight = 0, W.levitateTarget = { x: x + (Math.random() - 0.5) * 80, y: C + (Math.random() - 0.5) * 80, dmg: 42 * v }, this.spawnParticles(W.x, W.y, "#E0F2FE", 8, 40, 110, 3.5, 0.35), this.spawnGroundCrack(W.x, W.y, Math.random() * Math.PI * 2, 28, "#38BDF8", "#E0F2FE");
        }
        this.queueVfx("eohyen_pillars_launch_vis", { ownerId: mpClient.playerId, x, y: C });
        this.frostBarrages.push({ id: this.nextEntityId++, x, y: C, radius: 175, duration: D, timer: 0, totalIcicles: P, iciclesFired: 0, interval: D / P, tickTimer: 0, damagePerHit: 36 * v }), this.queueVfx("frost_barrage_vis", { x, y: C, radius: 175, duration: D, totalIcicles: P }), this.queueVfx("particles", { x, y: C, color: "#BAE6FD", count: 16, minSpd: 45, maxSpd: 140, size: 3.5, life: 0.4 }), this.addFloatingText(x, C - 32, `🌪️ BÃO BĂNG EVITA ${D.toFixed(1)}s! (${H} CỌC BAY LƠ LỬNG)`, "#38BDF8", 16), this.addShake(14, 0.5);
      }
    } else if (this.currentHero.id === "longhoi") {
      if (s === 0) {
        R.playFox();
        for (let b = -1; b <= 1; b++) {
          let x = a + b * 0.18;
          this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "fox_arrow", isBurnArrow: true, x: this.player.x + Math.cos(x) * 20, y: this.player.y + Math.sin(x) * 20, vx: Math.cos(x) * 750, vy: Math.sin(x) * 750, radius: 9, damage: 28 * v, color: "#FB923C", angle: x, distanceTraveled: 0, maxDistance: g.range, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), hasLifestolen: false }), this.queueVfx("proj_vis", { kind: "fox_arrow", x: this.player.x + Math.cos(x) * 20, y: this.player.y + Math.sin(x) * 20, vx: Math.cos(x) * 750, vy: Math.sin(x) * 750, radius: 9, color: "#FB923C", angle: x, maxDistance: g.range, pierceLeft: 1 });
        }
        this.spawnFlameParticles(this.player.x, this.player.y, "red", 5, 30, 80);
      } else if (s === 1) {
        R.playFire(0.26, 0.2), R.playDash(), T(), this.player.dashActive = true, this.player.dashKind = "fox_dash", this.player.dashTimer = 0.18;
        let b = g.range / 0.18;
        this.player.dashVx = Math.cos(a) * b, this.player.dashVy = Math.sin(a) * b, this.player.longhoi_msBuffTimer = 2, this.player.longhoi_nextAtkBonus = 20;
        let x = Math.round(this.player.maxHp * 0.05);
        this.addPlayerShield(x, 2), this.healPlayer(Math.round(this.player.maxHp * 0.03), "HEAL", "+3% HP (HỒ BỘ)"), this.addFloatingText(this.player.x, this.player.y - 20, "HỒ BỘ CỬU VĨ LỬA! +20 ĐÒN KẾ", "#F97316", 15), this.spawnFlameParticles(this.player.x, this.player.y, "red", 10, 40, 110);
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 85, spread: Math.PI * 2, color: "#F97316", life: 0, maxLife: 0.24, kind: "shockwave" });
        this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 85, spread: Math.PI * 2, color: "#F97316", maxLife: 0.24, kind: "shockwave" });
        this.queueVfx("afterimage", { x: this.player.x, y: this.player.y, facing: a, color: "#F97316", alpha: 0.85, maxLife: 0.34 });
        this.queueVfx("particles", { x: this.player.x, y: this.player.y, flame: true, flameColor: "red", count: 12, minSpd: 40, maxSpd: 115 });
      } else if (s === 2) {
        R.playFox(), R.playDragonRoar();
        let b = Math.max(40, Math.min(Se - 40, l)), x = Math.max(40, Math.min(Ce - 40, m));
        this.addShake(14, 0.45), this.zones.push({ id: this.nextEntityId++, kind: "fox_king_rain", x: b, y: x, radius: g.radius || 145, timer: 0, duration: 3, tickTimer: 0, tickInterval: 0.45, damagePerTick: 32 * v, maxTicksPerTarget: 6, hitCountMap: {}, rotation: 0 }), this.queueVfx("zone_vis", { kind: "fox_king_rain", x: b, y: x, radius: g.radius || 145, duration: 3 });
        for (let C = 0; C < 4; C++) setTimeout(() => {
          if (this.gameState === "PLAYING") {
            let rx = b + (Math.random() - 0.5) * 100, ry = x + (Math.random() - 0.5) * 100;
            this.fireRocket(this.player.x, this.player.y, rx, ry, 34 * v, true, "#EA580C"), this.queueVfx("rocket_vis", { sx: this.player.x, sy: this.player.y, tx: rx, ty: ry, color: "#EA580C", isFromPlayer: true });
          }
        }, C * 160);
      }
    } else if (this.currentHero.id === "duccong") {
      this.player.duccong_passive = (this.player.duccong_passive || 0) + 1;
      let b = 0;
      if (this.player.duccong_passive >= 3 && (this.player.duccong_passive = 0, b = 45, this.addFloatingText(this.player.x, this.player.y - 24, "TINH T\xDA H\u1ED8I T\u1EE4! +45 DMG PH\xC9P", "#C084FC", 15)), s === 0) R.playCosmic(), this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "duccong_push_orb", x: this.player.x + Math.cos(a) * 28, y: this.player.y + Math.sin(a) * 28, vx: Math.cos(a) * 145, vy: Math.sin(a) * 145, radius: 30, timer: 0, duration: 3.0, explodeRadius: 145, damage: (175 + b) * v, color: "#A855F7", angle: a, distanceTraveled: 0, maxDistance: 9999, pierceLeft: 999, hitIds: /* @__PURE__ */ new Set(), ccBonusDmg: 25 * v, skillIdx: 0, hasHealedPlayer: false, refundedEnemyIds: /* @__PURE__ */ new Set() }), this.queueVfx("proj_vis", { kind: "duccong_push_orb", x: this.player.x + Math.cos(a) * 28, y: this.player.y + Math.sin(a) * 28, vx: Math.cos(a) * 145, vy: Math.sin(a) * 145, radius: 30, color: "#A855F7", angle: a, maxDistance: 440, pierceLeft: 999 });
      else if (s === 1) {
        R.playBlackHole();
        let x = Math.max(40, Math.min(Se - 40, l)), C = Math.max(40, Math.min(Ce - 40, m));
        this.summonGalaxyVortex(x, C, g.radius || 145, 3, 24 * v, (65 + b) * v, false, true, 1), this.queueVfx("vortex_vis", { x, y: C, radius: g.radius || 145, duration: 3, isGalaxy: false });
      } else if (s === 2) {
        let x = Math.round(this.player.maxHp * 0.2);
        this.healPlayer(x, "HEAL", `+${x} HP (THI\xCAN H\xC0 S\u1EE4P \u0110\u1ED4)`), R.playBlackHole();
        let C = Math.max(40, Math.min(Se - 40, l)), H = Math.max(40, Math.min(Ce - 40, m));
        this.summonGalaxyVortex(C, H, g.radius || 175, 2, 32 * v, (260 + b) * v, true, true, 2), this.queueVfx("vortex_vis", { x: C, y: H, radius: g.radius || 175, duration: 2, isGalaxy: true }), this.addShake(15, 0.45);
      }
    } else if (this.currentHero.id === "gau") {
      let b = this.getEffectiveDamage(), x = this.player.gau_cuongHungTimer > 0;
      if (s === 0) {
        let C = this.player.gau_c1_step;
        if (C === 0) {
          this.player.gau_c1_step = 1, this.player.gau_c1_windowTimer = 1.8, this.player.gau_c1_comboHits = {}, this.player.gau_c1_basicCancelPrimed = false, this.player.gau_animKind = "c1_0", this.player.gau_animDur = 0.24, this.player.gau_animTimer = 0.24, this.player.gau_animAngle = a, this.player.cooldowns[0] = 0.14, R.playHeavyPunch(0), this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: 130, spread: 1.35, color: x ? "#FBBF24" : "#F59E0B", life: 0, maxLife: 0.25, kind: "gau_punch", step: 0, comboStep: 1, empowered: x }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: 130, spread: 1.35, color: x ? "#FBBF24" : "#F59E0B", maxLife: 0.25, kind: "gau_punch", step: 0, comboStep: 1, empowered: x }), this.spawnParticles(this.player.x + Math.cos(a) * 48, this.player.y + Math.sin(a) * 48, x ? "#FEF08A" : "#F59E0B", 7, 60, 160, 3, 0.26);
          let H = Math.round(78 + 1 * b), D = 0;
          for (let P of [...this.enemies]) {
            let N = P.x - this.player.x, W = P.y - this.player.y, V = Math.hypot(N, W) - P.radius, oe = Math.abs(Math.atan2(Math.sin(Math.atan2(W, N) - a), Math.cos(Math.atan2(W, N) - a)));
            if (V <= 130 && (oe <= 0.9 || V < 35)) {
              D++;
              let ye = H;
              if (P.gau_quakeTimer && P.gau_quakeTimer > 0) {
                let De = Math.round(85 + 0.75 * b);
                ye += De, P.gau_quakeTimer = 0, this.addFloatingText(P.x, P.y - 24, `\u{1F4A5} N\u1ED4 CH\u1EA4N \u0110\u1ED8NG +${De}!`, "#FBBF24", 15);
              }
              this.player.gau_c1_comboHits[P.id] = 1, this.damageEnemy(P, ye, Math.cos(a) * 10, Math.sin(a) * 10, true);
            }
          }
          D > 0 && this.grantGauRage(12), this.comboManager.record({ heroId: "gau", action: "c1_step1", hitCount: D, empowered: x, damageDealt: H * Math.max(1, D) });
        } else if (C === 1) {
          this.player.gau_c1_step = 2, this.player.gau_c1_windowTimer = 1, this.player.gau_animKind = "c1_1", this.player.gau_animDur = 0.24, this.player.gau_animTimer = 0.24, this.player.gau_animAngle = a, this.player.cooldowns[0] = 0.12, R.playHeavyPunch(1), this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: 140, spread: 1.5, color: "#FBBF24", life: 0, maxLife: 0.25, kind: "gau_punch", step: 1, comboStep: 2, empowered: x }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: 140, spread: 1.5, color: "#FBBF24", maxLife: 0.25, kind: "gau_punch", step: 1, comboStep: 2, empowered: x }), this.spawnParticles(this.player.x + Math.cos(a) * 56, this.player.y + Math.sin(a) * 56, "#FBBF24", 9, 70, 180, 3.2, 0.28);
          let H = Math.round(92 + 1.2 * b), D = 0;
          for (let P of [...this.enemies]) {
            let N = P.x - this.player.x, W = P.y - this.player.y, V = Math.hypot(N, W) - P.radius, oe = Math.abs(Math.atan2(Math.sin(Math.atan2(W, N) - a), Math.cos(Math.atan2(W, N) - a)));
            if (V <= 140 && (oe <= 0.92 || V < 38)) {
              D++;
              let ye = H;
              if (P.gau_quakeTimer && P.gau_quakeTimer > 0) {
                let De = Math.round(85 + 0.75 * b);
                ye += De, P.gau_quakeTimer = 0, this.addFloatingText(P.x, P.y - 24, `\u{1F4A5} N\u1ED4 CH\u1EA4N \u0110\u1ED8NG +${De}!`, "#FBBF24", 15);
              }
              this.player.gau_c1_comboHits[P.id] = (this.player.gau_c1_comboHits[P.id] || 0) + 1, this.damageEnemy(P, ye, Math.cos(a) * 26, Math.sin(a) * 26, true);
            }
          }
          D > 0 && this.grantGauRage(12), this.comboManager.record({ heroId: "gau", action: "c1_step2", hitCount: D, empowered: x, damageDealt: H * Math.max(1, D) });
        } else {
          let H = this.player.gau_c1_windowTimer > 0, D = this.player.gau_c1_basicCancelPrimed;
          this.player.gau_c1_step = 0, this.player.gau_c1_windowTimer = 0, this.player.gau_c1_basicCancelPrimed = false, this.player.gau_c1_afterStep3Timer = 2.5, this.player.gau_animKind = "c1_2", this.player.gau_animDur = 0.28, this.player.gau_animTimer = 0.28, this.player.gau_animAngle = a, this.player.cooldowns[0] = f, R.playEarthSlam(), this.addShake(9, 0.25);
          let P = this.player.x + Math.cos(a) * 60, N = this.player.y + Math.sin(a) * 60;
          this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: 135, spread: 1.55, color: "#FEF08A", life: 0, maxLife: 0.26, kind: "gau_punch", step: 2, comboStep: 3, empowered: x }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: 135, spread: 1.55, color: "#FEF08A", maxLife: 0.26, kind: "gau_punch", step: 2, comboStep: 3, empowered: x }), this.slashes.push({ x: P, y: N, angle: 0, radius: 145, spread: Math.PI * 2, color: x ? "#FBBF24" : "#F59E0B", life: 0, maxLife: 0.34, kind: "gau_shockring", heavy: true }), this.queueVfx("slash", { x: P, y: N, angle: 0, radius: 145, spread: Math.PI * 2, color: x ? "#FBBF24" : "#F59E0B", maxLife: 0.34, kind: "gau_shockring", heavy: true }), this.slashes.push({ x: P, y: N, angle: 0, radius: 95, spread: Math.PI * 2, color: "#FEF08A", life: 0, maxLife: 0.24, kind: "shockwave" }), this.spawnParticles(P, N, "#FBBF24", 16, 70, 210, 3.6, 0.36), this.spawnGroundCrack(P, N, a, 90, "#D97706", "#FEF08A"), this.queueVfx("crack", { x: P, y: N, angle: a, len: 90, color: "#D97706", glowColor: "#FEF08A" });
          let W = Math.round(120 + 1.5 * b), V = 0;
          for (let oe of [...this.enemies]) if (Math.hypot(oe.x - P, oe.y - N) <= 145 + oe.radius) {
            V++;
            let ye = W, De = this.player.gau_c1_comboHits[oe.id] || 0;
            if (oe.gau_quakeTimer && oe.gau_quakeTimer > 0) {
              let nt = Math.round(85 + 0.75 * b);
              ye += nt, oe.gau_quakeTimer = 0, this.addFloatingText(oe.x, oe.y - 24, `\u{1F4A5} N\u1ED4 CH\u1EA4N \u0110\u1ED8NG +${nt}!`, "#FBBF24", 15);
            }
            De >= 2 && (ye += 45, this.isBossImmune(oe) || (oe.gau_quakeTimer = 6), this.addFloatingText(oe.x, oe.y - 36, "\u26A1 TAM H\xD9NG +45 & CH\u1EA4N \u0110\u1ED8NG!", "#FDE047", 14)), this.damageEnemy(oe, ye, Math.cos(a) * 20, Math.sin(a) * 20, true);
          }
          if (x) {
            let oe = Math.round(0.45 * b);
            this.slashes.push({ x: P, y: N, angle: 0, radius: 185, spread: Math.PI * 2, color: "#FDE047", life: 0, maxLife: 0.36, kind: "gau_shockring" }), this.queueVfx("slash", { x: P, y: N, angle: 0, radius: 185, spread: Math.PI * 2, color: "#FDE047", maxLife: 0.36, kind: "gau_shockring" });
            for (let ye of [...this.enemies]) Math.hypot(ye.x - P, ye.y - N) <= 185 + ye.radius && this.damageEnemy(ye, oe, 0, 0, true);
          }
          if (this.player.gau_c1_comboHits = {}, V > 0) {
            this.grantGauRage(12);
            let gh = Math.round(this.player.maxHp * (x ? 0.05 : 0.035));
            this.healPlayer(gh, "HEAL", `+${gh} HP (H\xD9NG QUY\u1EC0N)`);
          }
          this.comboManager.record({ heroId: "gau", action: "c1_step3", hitCount: V, inTimingWindow: H || D, empowered: x, damageDealt: W * Math.max(1, V) });
        }
      } else if (s === 1) this.player.gau_c2_guardTimer = 2, this.player.gau_c2_stacks = 0, this.player.gau_c2_recastLock = 0.15, this.player.cooldowns[1] = 0.15, R.playShieldBlock(), this.addFloatingText(this.player.x, this.player.y - 26, "\u{1F6E1}\uFE0F THI\u1EBET B\xCDCH (2,0s)!", "#FBBF24", 15), this.comboManager.record({ heroId: "gau", action: "c2_guard", hitCount: 1, empowered: x });
      else if (s === 2) {
        this.player.cooldowns[2] = f;
        let C = Math.max(60, Math.min(Se - 60, l)), H = Math.max(60, Math.min(Ce - 60, m)), D = Math.hypot(C - this.player.x, H - this.player.y), P = 0.28, N = 170 * (x ? 1.25 : 1), W = Math.round((220 + 2.1 * b) * (x ? 1.3 : 1));
        R.playDash(), this.player.dashActive = true, this.player.dashKind = "gau_c3_leap", this.player.dashTimer = P, this.player.gau_leapElapsed = 0, this.player.gau_leapDur = P, this.player.dashVx = D > 5 ? (C - this.player.x) / D * (D / P) : 0, this.player.dashVy = D > 5 ? (H - this.player.y) / D * (D / P) : 0, this.player.dashDamage = 0, this.player.dashHitIds.clear(), this.player.gau_c3_pendingImpact = { targetX: C, targetY: H, radius: N, dmg: W }, this.spawnParticles(this.player.x, this.player.y, "#FBBF24", 10, 40, 130, 3, 0.28), this.queueVfx("particles", { x: this.player.x, y: this.player.y, color: "#FBBF24", count: 10, minSpd: 40, maxSpd: 130, size: 3, life: 0.28 });
      }
    } else if (this.currentHero.id === "bao") {
      let b = this.getEffectiveDamage();
      if (s === 0) {
        R.playDash(), R.playDaggerSlash(0), T(), this.player.bao_c1_refundedThisCycle = false, this.player.bao_glideTimer = 0.22, this.player.cooldowns[0] = 0.15, this.player.bao_c1_recastTimer = 5, this.player.bao_c1_awaitingSecond = true, this.player.dashActive = true, this.player.dashKind = "bao_c1", this.player.dashTimer = 0.16;
        let x = g.range / 0.16;
        this.player.dashVx = Math.cos(a) * x, this.player.dashVy = Math.sin(a) * x, this.player.dashDamage = 0, this.player.dashHitIds.clear();
        let C = Math.round(105 + 1.45 * b);
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: 118, spread: 1.55, dir: 1, color: "#E879F9", life: 0, maxLife: 0.22, kind: "bao_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: 118, spread: 1.55, dir: 1, color: "#E879F9", maxLife: 0.22, kind: "bao_slash" });
        let P = 0;
        for (let N of [...this.enemies]) Math.hypot(N.x - this.player.x, N.y - this.player.y) <= 122 + N.radius && (P++, this.damageEnemy(N, C, 0, 0, true), N.hp > 0 && this.applyBaoMark(N, 1));
        this.addFloatingText(this.player.x, this.player.y - 26, "⚡ ĐÒN 1/2 (5,0s TÁI KÍCH HOẠT)", "#E879F9", 14), this.comboManager.record({ heroId: "bao", action: "c1_step1", hitCount: P, damageDealt: C * Math.max(1, P) });
      } else if (s === 1) {
        this.player.bao_stealthTimer = 1.5, this.player.bao_stealthFade = 0, this.player.bao_stealthLockTimer = 0.15, this.player.cooldowns[1] = 0.15, R.playSmokeVanish();
        let stealthHeal = Math.round(this.player.maxHp * 0.5);
        this.healPlayer(stealthHeal, "HEAL", `+${stealthHeal} HP (ẨN THÂN)`);
        for (let x = 0; x < 12; x++) this.spawnSmokePuff(this.player.x + (Math.random() - 0.5) * 34, this.player.y + (Math.random() - 0.5) * 34, 15, "rgba(147, 51, 234, 0.62)");
        this.queueVfx("particles", { x: this.player.x, y: this.player.y, smoke: true, color: "rgba(147, 51, 234, 0.62)", count: 10, size: 15 });
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 56, spread: Math.PI * 2, color: "#A855F7", life: 0, maxLife: 0.28, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 56, spread: Math.PI * 2, color: "#A855F7", maxLife: 0.28, kind: "shockwave" }), this.addFloatingText(this.player.x, this.player.y - 26, "💨 ẨN THÂN KHÓI TÍM (1,5s)!", "#E879F9", 15), this.comboManager.record({ heroId: "bao", action: "c2_stealth", hitCount: 1 });
      } else if (s === 2) {
        let x = this.findTargetForTinC3(a, g.range);
        if (!x) {
          this.player.cooldowns[2] = 0, this.addFloatingText(this.player.x, this.player.y - 24, "KH\xD4NG C\xD3 M\u1EE4C TI\xCAU", "#94A3B8", 13);
          return;
        }
        this.player.cooldowns[2] = f, R.playAmbushSlash(), this.addShake(12, 0.38);
        let C = this.enemies.filter((D) => D.hp > 0 && Math.hypot(D.x - x.x, D.y - x.y) <= 220 + D.radius).sort((D, P) => Math.hypot(D.x - x.x, D.y - x.y) - Math.hypot(P.x - x.x, P.y - x.y)), H = Math.round(85 + 1.05 * b);
        for (let D = 0; D < 4; D++) {
          let P = C[D % C.length] || x, N = Math.PI / 2 * D + 0.35, W = Math.max(40, Math.min(Se - 40, P.x + Math.cos(N) * 105)), V = Math.max(40, Math.min(Ce - 40, P.y + Math.sin(N) * 105));
          this.shadowClones.push({ id: this.nextEntityId++, x: W, y: V, startX: W, startY: V, targetId: P.id, targetX: P.x, targetY: P.y, facing: Math.atan2(P.y - V, P.x - W), delay: D * 0.05, timer: 0, strikeDur: 0.16, struck: false, dissolved: false, cloneIdx: D, dmg: H, life: 0, maxLife: 0.56 }), this.queueVfx("shadow_clone_vis", { startX: W, startY: V, targetX: P.x, targetY: P.y, delay: D * 0.05, strikeDur: 0.16, cloneIdx: D, maxLife: 0.56 });
        }
        this.player.bao_queuedC3Finisher = { timer: 0.38, dmg: Math.round(150 + 2 * b), targetId: x.id, targetX: x.x, targetY: x.y };
      }
    } else if (this.currentHero.id === "danh") {
      let b = this.getEffectiveDamage();
      if (this.player.danh_dragonTimer > 0 && (s === 0 || s === 1)) {
        this.castDanhDragonBreathSkill(s, a, f);
        return;
      }
      if (s === 0) {
        let x = this.player.danh_c1_step;
        if (x === 0) {
          this.player.danh_c1_step = 1, this.player.danh_c1_windowTimer = 2.2, this.player.danh_c1_hitSteps = 0, this.player.danh_swingDir = 1, this.player.danh_animKind = "c1_1", this.player.danh_animDur = 0.24, this.player.danh_animTimer = 0.24, this.player.cooldowns[0] = 0.14, R.playHeavySword(0), this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: 135, spread: 1.48, dir: 1, step: 1, color: "#EF4444", life: 0, maxLife: 0.26, kind: "danh_kiem_khi_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: 135, spread: 1.48, dir: 1, step: 1, color: "#EF4444", maxLife: 0.26, kind: "danh_kiem_khi_slash" });
          let C = Math.round(65 + 1.05 * b), H = 0;
          for (let D of [...this.enemies]) {
            let P = D.x - this.player.x, N = D.y - this.player.y, W = Math.hypot(P, N) - D.radius, V = Math.abs(Math.atan2(Math.sin(Math.atan2(N, P) - a), Math.cos(Math.atan2(N, P) - a)));
            W <= 138 && (V <= 0.92 || W < 34) && (H++, this.damageEnemy(D, C, Math.cos(a) * 8, Math.sin(a) * 8, true));
          }
          this.healPlayer(150, "HEAL", "+150 HP (PH\xC1 S\u01A0N)"), H > 0 && (this.player.danh_c1_hitSteps |= 1), this.comboManager.record({ heroId: "danh", action: "c1_step1", hitCount: H, damageDealt: C * Math.max(1, H) });
        } else if (x === 1) {
          this.player.danh_c1_step = 2, this.player.danh_c1_windowTimer = 2.2, this.player.danh_swingDir = -1, this.player.danh_animKind = "c1_2", this.player.danh_animDur = 0.24, this.player.danh_animTimer = 0.24, this.player.cooldowns[0] = 0.14, R.playHeavySword(1), this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: 145, spread: 1.58, dir: -1, step: 2, color: "#FB923C", life: 0, maxLife: 0.27, kind: "danh_kiem_khi_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: 145, spread: 1.58, dir: -1, step: 2, color: "#FB923C", maxLife: 0.27, kind: "danh_kiem_khi_slash" });
          let C = Math.round(85 + 1.25 * b), H = 0;
          for (let D of [...this.enemies]) {
            let P = D.x - this.player.x, N = D.y - this.player.y, W = Math.hypot(P, N) - D.radius, V = Math.abs(Math.atan2(Math.sin(Math.atan2(N, P) - a), Math.cos(Math.atan2(N, P) - a)));
            W <= 148 && (V <= 0.94 || W < 36) && (H++, this.damageEnemy(D, C, Math.cos(a) * 12, Math.sin(a) * 12, true));
          }
          this.healPlayer(150, "HEAL", "+150 HP (PH\xC1 S\u01A0N)"), H > 0 && (this.player.danh_c1_hitSteps |= 2), this.comboManager.record({ heroId: "danh", action: "c1_step2", hitCount: H, damageDealt: C * Math.max(1, H) });
        } else this.castDanhC1Step3(a, false, 0);
      } else if (s === 1) this.castDanhC2Charged(a, 0.2);
      else if (s === 2) {
        this.player.cooldowns[2] = f;
        this.player.stunTimer = 0, this.player.rootTimer = 0, this.player.slowTimer = 0, this.player.slowFactor = 0;
        let dMod = computeDanhDragonFormModifiers(true), H = this.player.danh_thienPhatTimer > 0;
        H && (this.player.danh_thienPhatTimer = 0);
        this.player.danh_dragonTimer = dMod.duration;
        this.player.danh_animKind = "c3", this.player.danh_animDur = 0.34, this.player.danh_animTimer = 0.34;
        let D = Math.round((g.radius || 210) * (H ? 1.15 : 1)), P = Math.round(220 + 2.2 * b + (H ? 100 + 1 * b : 0)), N = Math.round(45 + 0.45 * b);
        this.healPlayer(380, "HEAL", "+380 HP (H\xD3A R\u1ED2NG)");
        R.playDragonRoar(), R.playExplosion(), this.addShake(16, 0.45);
        this.createCataclysmicExplosion(this.player.x, this.player.y, D, "#F59E0B");
        this.queueVfx("explosion", { x: this.player.x, y: this.player.y, radius: D, color: "#F59E0B" });
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: D * 1.15, spread: Math.PI * 2, color: "#FBBF24", life: 0, maxLife: 0.48, kind: "danh_dragon_shockring" });
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: D * 0.78, spread: Math.PI * 2, color: "#FEF08A", life: 0, maxLife: 0.34, kind: "shockwave" });
        this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: D * 1.15, spread: Math.PI * 2, color: "#FBBF24", maxLife: 0.48, kind: "danh_dragon_shockring" });
        for (let C = 0; C < 6; C++) {
          let ang = Math.PI * 2 / 6 * C;
          this.spawnGroundCrack(this.player.x, this.player.y, ang, D * 0.85, "#DC2626", "#FDE047");
          this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: ang, len: D * 0.85, color: "#DC2626", glowColor: "#FDE047" });
        }
        this.spawnFlameParticles(this.player.x, this.player.y, "red", 24, 65, 220);
        this.queueVfx("particles", { x: this.player.x, y: this.player.y, flame: true, flameColor: "red", count: 20, minSpd: 65, maxSpd: 220 });
        let hitCnt = 0;
        for (let C of [...this.enemies]) {
          let dx = C.x - this.player.x, dy = C.y - this.player.y, dist = Math.hypot(dx, dy);
          if (dist <= D + C.radius) {
            hitCnt++;
            let kbAng = Math.atan2(dy, dx);
            this.damageEnemy(C, P, Math.cos(kbAng) * 32, Math.sin(kbAng) * 32, true);
          }
        }
        this.zones.push({ id: this.nextEntityId++, kind: "danh_dragon_fire", x: this.player.x, y: this.player.y, radius: D * 0.85, timer: 0, duration: 3.5, tickTimer: 0, tickInterval: 0.5, damagePerTick: Math.round(N * 0.5), rotation: 0 });
        this.queueVfx("zone_vis", { kind: "danh_dragon_fire", x: this.player.x, y: this.player.y, radius: D * 0.85, duration: 3.5 });
        this.addFloatingText(this.player.x, this.player.y - 42, "\u{1F525} H\xD3A R\u1ED2NG (12s)! MI\u1EC4N KH\u1ED0NG \xB7 +35% ST/T\u0110/MT!", "#FBBF24", 17);
        this.comboManager.record({ heroId: "danh", action: "c3", hitCount: hitCnt, empowered: true, damageDealt: P * Math.max(1, hitCnt) });
      }
    } else if (this.currentHero.id === "luan") {
      let ap = this.getEffectiveAP();
      if (s === 0) {
        let sx = this.player.x + Math.cos(a) * 20, sy = this.player.y + Math.sin(a) * 20, dmg = computeLuanC1ShardDamage(ap), maxDist = g.range || 360;
        R.playCosmic(), R.playOrb();
        for (let off of [-0.28, -0.14, 0, 0.14, 0.28]) {
          let ang = a + off;
          this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "luan_shard", x: sx, y: sy, vx: Math.cos(ang) * 740, vy: Math.sin(ang) * 740, radius: 12, damage: dmg, color: "#E879F9", angle: ang, distanceTraveled: 0, maxDistance: maxDist, pierceLeft: 99, portalBoosted: false, passedPortalIds: /* @__PURE__ */ new Set(), hitIds: /* @__PURE__ */ new Set() });
          this.queueVfx("proj_vis", { kind: "luan_shard", x: sx, y: sy, vx: Math.cos(ang) * 740, vy: Math.sin(ang) * 740, radius: 12, color: "#E879F9", angle: ang, maxDistance: maxDist, pierceLeft: 99 });
        }
        let rx2 = Math.max(40, Math.min(Se - 40, this.player.x + Math.cos(a) * maxDist * 0.82)), ry2 = Math.max(40, Math.min(Ce - 40, this.player.y + Math.sin(a) * maxDist * 0.82));
        this.carveLuanRift(sx, sy, rx2, ry2, ap, 12);
        this.spawnParticles(sx, sy, "#C084FC", 10, 40, 140, 3, 0.3);
        this.comboManager.record({ heroId: "luan", action: "c1", hitCount: 1 });
      } else if (s === 1) {
        let distTarget = Math.min(g.range || 560, Math.hypot(l - this.player.x, m - this.player.y));
        let tx = Math.max(70, Math.min(Se - 70, this.player.x + Math.cos(a) * distTarget)), ty = Math.max(70, Math.min(Ce - 70, this.player.y + Math.sin(a) * distTarget));
        this.luanPortals = [];
        let pRadius = g.radius || 54, pDmg = Math.round(24 + 0.30 * ap), detDmg = Math.round(80 + 0.85 * ap);
        let pts = [
          { x: tx, y: ty },
          { x: Math.max(70, Math.min(Se - 70, tx + Math.cos(a + 2.2) * 135)), y: Math.max(70, Math.min(Ce - 70, ty + Math.sin(a + 2.2) * 135)) },
          { x: Math.max(70, Math.min(Se - 70, tx + Math.cos(a - 2.2) * 135)), y: Math.max(70, Math.min(Ce - 70, ty + Math.sin(a - 2.2) * 135)) }
        ];
        for (let pt of pts) {
          this.luanPortals.push({ id: this.nextEntityId++, x: pt.x, y: pt.y, radius: pRadius, life: 0, maxLife: 9, damage: pDmg, detDmg });
          this.slashes.push({ x: pt.x, y: pt.y, angle: 0, radius: pRadius * 1.45, spread: Math.PI * 2, color: "#C084FC", life: 0, maxLife: 0.34, kind: "luan_portal_wave" });
          this.queueVfx("luan_portal_vis", { x: pt.x, y: pt.y, radius: pRadius, maxLife: 9 });
        }
        this.carveLuanRift(pts[0].x, pts[0].y, pts[1].x, pts[1].y, ap, 10);
        this.carveLuanRift(pts[1].x, pts[1].y, pts[2].x, pts[2].y, ap, 10);
        this.player.luan_c2_recastLock = 0.28;
        R.playPortalOpen();
        this.addFloatingText(tx, ty - pRadius - 18, "\u{1FA9E} M\u1EDE 3 C\u1ED4NG KHÔNG GIAN (9s)! B\u1EA5m C2 l\u1EA7n n\u1EEFa \u0111\u1EC3 K\xCDCH N\u1ED4!", "#E879F9", 15);
        this.comboManager.record({ heroId: "luan", action: "c2_open", hitCount: 1 });
      } else if (s === 2) {
        this.player.luan_c3Charge = { timer: 0.35, maxTimer: 0.35, angle: a };
        R.playCosmic();
        this.spawnParticles(this.player.x, this.player.y, "#E879F9", 14, 30, 120, 3.2, 0.38);
        this.addFloatingText(this.player.x, this.player.y - 34, "\u{1F52E} T\u1EE4 TIA H\u1EE6Y DI\u1EC6T...", "#67E8F9", 16);
      }
    } else if (this.currentHero.id === "taidu") {
      let effAtk = this.getEffectiveDamage();
      if (s === 0) {
        let dx = l - this.player.x, dy = m - this.player.y, dist = Math.hypot(dx, dy), maxR = g.range || 420;
        let tx = dist > maxR ? this.player.x + dx / (dist || 1) * maxR : l, ty = dist > maxR ? this.player.y + dy / (dist || 1) * maxR : m;
        tx = Math.max(40, Math.min(Se - 40, tx)), ty = Math.max(40, Math.min(Ce - 40, ty));
        if (this.taiduTurrets.length >= 2) this.taiduTurrets.shift();
        let dmg = Math.round(32 + 0.44 * effAtk);
        this.taiduTurrets.push({ id: this.nextEntityId++, x: tx, y: ty, angle: a, life: 0, maxLife: 8, fireTimer: 0.12, fireInterval: 0.68, range: 350, damage: dmg, muzzleTimer: 0, hasTarget: false, targetX: tx + Math.cos(a) * 60, targetY: ty + Math.sin(a) * 60 });
        this.slashes.push({ x: tx, y: ty, angle: 0, radius: 52, spread: Math.PI * 2, color: "#38BDF8", accentColor: "#F97316", life: 0, maxLife: 0.28, kind: "taidu_hex_blast" });
        this.queueVfx("taidu_turret_vis", { x: tx, y: ty, angle: a, maxLife: 8 });
        this.spawnParticles(tx, ty, "#38BDF8", 12, 40, 140, 2.8, 0.32);
        R.playDroneSwitch(), R.playTurretShot();
        this.addFloatingText(tx, ty - 28, "\u{1F52B} PH\xC1O T\u1EF0 \u0110\u1ED8NG!", "#38BDF8", 14);
        this.comboManager.record({ heroId: "taidu", action: "c1", hitCount: 1 });
      } else if (s === 1) {
        this.player.attackAnimTimer = 0.22, this.player.attackAnimAngle = a;
        let dmg = Math.round(52 + 0.62 * effAtk), maxDist = g.range || 440;
        let cands = this.enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= maxDist + 140).sort((ea, eb) => Math.hypot(ea.x - this.player.x, ea.y - this.player.y) - Math.hypot(eb.x - this.player.x, eb.y - this.player.y));
        let offsets = [-0.28, 0, 0.28];
        R.playMissileBarrage();
        for (let i = 0; i < 3; i++) {
          let ang = a + offsets[i], sx = this.player.x + Math.cos(ang) * 24, sy = this.player.y + Math.sin(ang) * 24, tgt = cands[i % Math.max(1, cands.length)] || null;
          this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "taidu_missile", targetId: tgt ? tgt.id : null, aoeRadius: 80, x: sx, y: sy, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620, radius: 12, damage: dmg, color: "#F97316", angle: ang, distanceTraveled: 0, maxDistance: maxDist, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
          this.queueVfx("proj_vis", { kind: "taidu_missile", x: sx, y: sy, vx: Math.cos(ang) * 620, vy: Math.sin(ang) * 620, radius: 12, color: "#F97316", angle: ang, maxDistance: maxDist, pierceLeft: 1 });
        }
        this.spawnParticles(this.player.x + Math.cos(a) * 24, this.player.y + Math.sin(a) * 24, "#F97316", 10, 40, 130, 3, 0.3);
        this.comboManager.record({ heroId: "taidu", action: "c2", hitCount: 1 });
      } else if (s === 2) {
        let maxR = g.range || 560, blastR = g.radius || 95, dmg = Math.round(74 + 0.78 * effAtk);
        R.playMissileBarrage(), this.addShake(10, 0.35);
        for (let i = 0; i < 7; i++) {
          let d = 85 + (maxR - 85) * (i / 6), sx = Math.max(45, Math.min(Se - 45, this.player.x + Math.cos(a) * d)), sy = Math.max(45, Math.min(Ce - 45, this.player.y + Math.sin(a) * d)), delay = 0.14 + i * 0.11;
          this.taiduCarpetStrikes.push({ id: this.nextEntityId++, x: sx, y: sy, radius: blastR, damage: dmg, timer: 0, delay, healRate: 0.08 });
          this.queueVfx("taidu_carpet_vis", { x: sx, y: sy, radius: blastR, delay });
        }
        this.addFloatingText(this.player.x, this.player.y - 36, "\u{1F680} OANH T\u1EA0C TH\u1EA2M T\xCAN L\u1EEDA (7 \u0110\u1EE2T)!", "#F97316", 16);
        this.comboManager.record({ heroId: "taidu", action: "c3", hitCount: 1, empowered: true });
      }
    } else if (this.currentHero.id === "nguyen") {
      let ap = this.getEffectiveAP();
      if (s === 0) {
        let range = g.range || 175, dmg = Math.round(58 + 0.65 * ap), instHeal = Math.round(135 + 0.90 * ap), tickHeal = Math.round(40 + 0.28 * ap);
        R.playSanctuaryWave();
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius: range + 18, spread: 1.75, dir: 1, color: "#34D399", life: 0, maxLife: 0.3, kind: "nguyen_wave" });
        this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius: range + 18, spread: 1.75, dir: 1, color: "#34D399", maxLife: 0.3, kind: "nguyen_wave" });
        let hitCnt = 0;
        for (let e of [...this.enemies]) {
          let dx = e.x - this.player.x, dy = e.y - this.player.y, d = Math.hypot(dx, dy) - e.radius;
          if (d <= range + 10 && (Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a))) <= 0.95 || d < 36)) {
            hitCnt++;
            let kbAng = Math.atan2(dy, dx);
            this.damageEnemy(e, dmg, Math.cos(kbAng) * 58, Math.sin(kbAng) * 58, true);
            this.isBossImmune(e) || (e.slowFactor = Math.max(e.slowFactor || 0, 0.35), e.slowTimer = Math.max(e.slowTimer || 0, 1.5));
          }
        }
        this.healPlayer(instHeal, "HEAL");
        this.emitAllySupport({ x: this.player.x, y: this.player.y, radius: 260, heal: instHeal, label: `+${instHeal} HP (TH\xC1NH \xC2N C1)`, color: "#34D399" });
        this.player.nguyen_hotQueue = this.player.nguyen_hotQueue || [], this.player.nguyen_hotQueue.push({ timer: 0.75, interval: 0.75, ticksLeft: 3, healAmt: tickHeal });
        this.comboManager.record({ heroId: "nguyen", action: "c1", hitCount: Math.max(1, hitCnt), damageDealt: dmg * Math.max(1, hitCnt) });
      } else if (s === 1) {
        this.player.nguyen_satellitesTimer = 6, this.player.nguyen_satellitesHealTimer = 1.0;
        R.playHolyLight(), R.playShieldBlock();
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 95, spread: Math.PI * 2, color: "#34D399", life: 0, maxLife: 0.34, kind: "nguyen_lotus_boom" });
        this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 95, spread: Math.PI * 2, color: "#34D399", maxLife: 0.34, kind: "nguyen_lotus_boom" });
        this.spawnParticles(this.player.x, this.player.y, "#FDE047", 12, 40, 140, 3, 0.36);
        this.addFloatingText(this.player.x, this.player.y - 34, "\u{1F6F0}\uFE0F TAM V\u1EC6 TINH H\u1ED8 M\u1EC6NH (6s)!", "#34D399", 16);
        this.comboManager.record({ heroId: "nguyen", action: "c2", hitCount: 1 });
      } else if (s === 2) {
        let radius = g.radius || 230, dmg = Math.round(125 + 1.05 * ap), instHeal = Math.round(250 + 1.45 * ap + this.player.maxHp * 0.12), shieldAmt = Math.round(this.player.maxHp * 0.15);
        R.playHolyLight(), R.playSanctuaryWave(), this.addShake(12, 0.35);
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius, spread: Math.PI * 2, color: "#10B981", life: 0, maxLife: 0.45, kind: "nguyen_lotus_boom" });
        this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius, spread: Math.PI * 2, color: "#10B981", maxLife: 0.45, kind: "nguyen_lotus_boom" });
        this.nguyenSanctuaryWaves.push({ id: this.nextEntityId++, x: this.player.x, y: this.player.y, maxRadius: radius, life: 0, maxLife: 0.54 });
        this.queueVfx("nguyen_wave_vis", { x: this.player.x, y: this.player.y, maxRadius: radius, maxLife: 0.54 });
        let hitCnt = 0;
        for (let e of [...this.enemies]) {
          let dx = e.x - this.player.x, dy = e.y - this.player.y, d = Math.hypot(dx, dy);
          if (d <= radius + e.radius) {
            hitCnt++;
            let kbAng = Math.atan2(dy, dx);
            this.damageEnemy(e, dmg, Math.cos(kbAng) * 65, Math.sin(kbAng) * 65, true);
            this.isBossImmune(e) || (e.slowFactor = Math.max(e.slowFactor || 0, 0.45), e.slowTimer = Math.max(e.slowTimer || 0, 2));
          }
        }
        this.healPlayer(instHeal, "HEAL");
        this.emitAllySupport({ x: this.player.x, y: this.player.y, radius: radius + 50, heal: instHeal, shield: shieldAmt, label: `+${instHeal} HP \xB7 +${shieldAmt} KHI\xCAN (TH\xC1NH \u0110\u1ECAA)`, color: "#FEF08A" });
        this.player.shield = Math.min(Math.round(this.player.maxHp * 0.65), (this.player.shield || 0) + shieldAmt);
        this.player.shieldTimer = Math.max(this.player.shieldTimer || 0, 12);
        let waveHeal = Math.round(64 + 0.42 * ap + this.player.maxHp * 0.035), waveDmg = Math.round(30 + 0.25 * ap);
        this.nguyenSanctuaryFields.push({ id: this.nextEntityId++, x: this.player.x, y: this.player.y, radius, timer: 0, duration: 3.2, tickTimer: 0.75, tickInterval: 0.75, pulsesLeft: 4, healAmt: waveHeal, dmgAmt: waveDmg });
        this.queueVfx("nguyen_field_vis", { x: this.player.x, y: this.player.y, radius, duration: 3.2 });
        this.addFloatingText(this.player.x, this.player.y - 40, `\u2728 \u0110\u1EA0I TH\xC1NH \u0110\u1ECAA SINH M\u1EC6NH (+${shieldAmt} KHI\xCAN)!`, "#FEF08A", 17);
        this.comboManager.record({ heroId: "nguyen", action: "c3", hitCount: Math.max(1, hitCnt), empowered: true, damageDealt: dmg * Math.max(1, hitCnt) });
      }
    }
  }
  carveLuanRift(x1, y1, x2, y2, ap, width = 10) {
    let segDmg = computeLuanRiftTickDamage(ap), offsets = [-7, 9, -11, 8, -6].map((v) => v + (Math.random() - 0.5) * 6);
    this.luanRifts.push({ id: this.nextEntityId++, x1, y1, x2, y2, width, life: 0, maxLife: 2.8, tickTimer: 0.2, tickInterval: LUAN_RIFT_TICK_INTERVAL, damage: segDmg, offsets });
    this.queueVfx("luan_rift_vis", { x1, y1, x2, y2, width, maxLife: 2.8, offsets });
    let prev = this.player.luan_lastRiftPt;
    if (prev && this.elapsedTime - prev.time <= 3.5) {
      let dist = Math.hypot(x1 - prev.x, y1 - prev.y);
      if (dist >= 28 && dist <= 560) {
        let linkOff = [-9, 10, -8, 9, -5].map((v) => v + (Math.random() - 0.5) * 6);
        this.luanRifts.push({ id: this.nextEntityId++, x1: prev.x, y1: prev.y, x2: x1, y2: y1, width: Math.max(8, width - 1), life: 0, maxLife: 2.8, tickTimer: 0.2, tickInterval: LUAN_RIFT_TICK_INTERVAL, damage: segDmg, offsets: linkOff });
        this.queueVfx("luan_rift_vis", { x1: prev.x, y1: prev.y, x2: x1, y2: y1, width: Math.max(8, width - 1), maxLife: 2.8, offsets: linkOff });
      }
    }
    this.player.luan_lastRiftPt = { x: x2, y: y2, time: this.elapsedTime };
    if (this.luanRifts.length > LUAN_RIFT_MAX_SEGMENTS) this.luanRifts.splice(0, this.luanRifts.length - LUAN_RIFT_MAX_SEGMENTS);
  }
  closeAndDetonateLuanPortals() {
    if (!this.luanPortals || this.luanPortals.length === 0) return;
    let portals = [...this.luanPortals];
    this.luanPortals = [];
    this.queueVfx("luan_portal_detonate_vis", {});
    let gear = this.getHeroGearStats("luan");
    this.player.cooldowns[1] = (this.currentHero.skills[1]?.cooldown || 8) * (1 - gear.cdr);
    R.playExplosion(), R.playCosmic(), this.addShake(12, 0.32);
    let hitOnce = /* @__PURE__ */ new Set(), totalHits = 0;
    for (let pt of portals) {
      let burstR = pt.radius * 2.15;
      this.createCataclysmicExplosion(pt.x, pt.y, burstR, "#A855F7");
      this.slashes.push({ x: pt.x, y: pt.y, angle: 0, radius: burstR, spread: Math.PI * 2, color: "#67E8F9", life: 0, maxLife: 0.42, kind: "luan_portal_wave" });
      this.queueVfx("slash", { x: pt.x, y: pt.y, angle: 0, radius: burstR, spread: Math.PI * 2, color: "#67E8F9", maxLife: 0.42, kind: "luan_portal_wave" });
      for (let e of [...this.enemies]) {
        if (hitOnce.has(e.id)) continue;
        if (Math.hypot(e.x - pt.x, e.y - pt.y) <= burstR + e.radius) {
          hitOnce.add(e.id), totalHits++;
          this.damageEnemy(e, pt.detDmg, 0, 0, true);
        }
      }
    }
    this.addFloatingText(this.player.x, this.player.y - 34, `\u{1F4A5} \u0110\xD3NG N\u1ED4 ${portals.length} C\u1ED4NG!`, "#E879F9", 16);
    this.comboManager.record({ heroId: "luan", action: "c2_detonate", hitCount: totalHits, empowered: true });
  }
  pointToSegmentDist(px, py, x1, y1, x2, y2) {
    let dx = x2 - x1, dy = y2 - y1, lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.0001) return Math.hypot(px - x1, py - y1);
    let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  fireLuanC3Beam(angle) {
    let ap = this.getEffectiveAP(), g = this.currentHero.skills[2], baseRange = g?.range || 520, baseDmg = Math.round(420 + 3.6 * ap);
    let x1 = this.player.x + Math.cos(angle) * 20, y1 = this.player.y + Math.sin(angle) * 20;
    let x2 = Math.max(20, Math.min(Se - 20, this.player.x + Math.cos(angle) * baseRange)), y2 = Math.max(20, Math.min(Ce - 20, this.player.y + Math.sin(angle) * baseRange));
    this.player.tin_monochrome_realm_timer = Math.max(this.player.tin_monochrome_realm_timer || 0, LUAN_C3_MONOCHROME_DURATION);
    this.screenFlashWhite = Math.max(this.screenFlashWhite || 0, 0.36);
    this.luanBeams.push({ id: this.nextEntityId++, x1, y1, x2, y2, width: 52, life: 0, maxLife: 0.62, isBranch: false });
    this.queueVfx("luan_beam_vis", { x1, y1, x2, y2, width: 52, maxLife: 0.62, isBranch: false });
    this.carveLuanRift(x1, y1, x2, y2, ap, 14);
    R.playRealmSlash(), R.playLaserRay(), this.addShake(18, 0.45);
    this.addFloatingText(this.player.x, this.player.y - 48, "\u26AB\u26AA H\u1EE6Y DI\u1EC6T KH\xD4NG GIAN (1,5s TR\u1EAENG \u0110EN)!", "#FFFFFF", 17);
    let totalHits = 0;
    for (let e of [...this.enemies]) {
      if (this.pointToSegmentDist(e.x, e.y, x1, y1, x2, y2) <= 32 + e.radius) {
        totalHits++;
        this.damageEnemy(e, baseDmg, Math.cos(angle) * 18, Math.sin(angle) * 18, true);
      }
    }
    if (this.luanPortals.length > 0) {
      let hitPortals = this.luanPortals.filter((pt) => this.pointToSegmentDist(pt.x, pt.y, x1, y1, x2, y2) <= pt.radius + 26);
      if (hitPortals.length > 0) {
        let tx = computeLuanPortalBeamTransform({ baseDamage: baseDmg, baseRange, portalCount: this.luanPortals.length, passThroughCount: hitPortals.length });
        let exitPortals = this.luanPortals.filter((pt) => !hitPortals.includes(pt));
        if (exitPortals.length === 0) exitPortals = hitPortals;
        for (let hp of hitPortals) {
          this.slashes.push({ x: hp.x, y: hp.y, angle: 0, radius: hp.radius * 1.75, spread: Math.PI * 2, color: "#67E8F9", life: 0, maxLife: 0.38, kind: "luan_portal_wave" });
          this.queueVfx("slash", { x: hp.x, y: hp.y, angle: 0, radius: hp.radius * 1.75, spread: Math.PI * 2, color: "#67E8F9", maxLife: 0.38, kind: "luan_portal_wave" });
        }
        let branchIdx = 0;
        for (let ep of exitPortals) {
          let targets = exitPortals.length === 1 ? [angle - 0.34, angle + 0.34] : [null];
          for (let forcedAng of targets) {
            let bAng = forcedAng;
            if (bAng === null) {
              let nearest = this.findNearestEnemy(tx.range, ep.x, ep.y);
              bAng = nearest ? Math.atan2(nearest.y - ep.y, nearest.x - ep.x) : angle + (branchIdx % 2 === 0 ? 0.28 : -0.28);
            }
            branchIdx++;
            let bx2 = Math.max(20, Math.min(Se - 20, ep.x + Math.cos(bAng) * tx.range)), by2 = Math.max(20, Math.min(Ce - 20, ep.y + Math.sin(bAng) * tx.range));
            this.luanBeams.push({ id: this.nextEntityId++, x1: ep.x, y1: ep.y, x2: bx2, y2: by2, width: 40, life: 0, maxLife: 0.65, isBranch: true });
            this.queueVfx("luan_beam_vis", { x1: ep.x, y1: ep.y, x2: bx2, y2: by2, width: 40, maxLife: 0.65, isBranch: true });
            this.carveLuanRift(ep.x, ep.y, bx2, by2, ap, 11);
            for (let e of [...this.enemies]) {
              if (this.pointToSegmentDist(e.x, e.y, ep.x, ep.y, bx2, by2) <= 28 + e.radius) {
                totalHits++;
                this.damageEnemy(e, tx.damage, Math.cos(bAng) * 14, Math.sin(bAng) * 14, true);
              }
            }
          }
        }
        this.addFloatingText(this.player.x, this.player.y - 68, `\u{1F4A0} PH\xC2N NH\xC1NH C\u1ED4NG (+28% ST \xB7 +45% T\u1EA6M)!`, "#67E8F9", 16);
      }
    }
    this.comboManager.record({ heroId: "luan", action: "c3_beam", hitCount: totalHits, empowered: this.luanPortals.length > 0, damageDealt: baseDmg * Math.max(1, totalHits) });
  }
  castDanhDragonBreathSkill(s, a, f) {
    let b = this.getEffectiveDamage(), isC2 = s === 1, hasLongNgam = isC2 && this.player.danh_longNgamTimer > 0;
    hasLongNgam && (this.player.danh_longNgamTimer = 0);
    this.player.cooldowns[s] = f;
    this.player.danh_c1_step = 0, this.player.danh_c1_windowTimer = 0, this.player.danh_c1_hitSteps = 0;
    this.player.danh_animKind = isC2 ? "c2" : "c1_3", this.player.danh_animDur = 0.3, this.player.danh_animTimer = 0.3;
    let radius = isC2 ? 285 : 235, spread = isC2 ? 1.9 : 1.78, dmg = Math.round((isC2 ? 165 + 1.85 * b : 135 + 1.65 * b) + (hasLongNgam ? 45 + 0.55 * b : 0));
    let healAmt = hasLongNgam ? 380 : isC2 ? 280 : 260;
    this.healPlayer(healAmt, "HEAL", `+${healAmt} HP (KH\u1EA0T L\u1EECA R\u1ED2NG)`);
    R.playDragonBreath(), R.playDragonRoar(), this.addShake(isC2 ? 13 : 9, 0.3);
    this.slashes.push({ x: this.player.x, y: this.player.y, angle: a, radius, spread, empowered: true, color: hasLongNgam ? "#FEF08A" : "#F97316", life: 0, maxLife: 0.38, kind: "danh_firebreath" });
    this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: a, radius, spread, empowered: true, color: hasLongNgam ? "#FEF08A" : "#F97316", maxLife: 0.38, kind: "danh_firebreath" });
    this.spawnGroundCrack(this.player.x, this.player.y, a, radius * 0.72, "#DC2626", "#FDE047");
    this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: a, len: radius * 0.72, color: "#DC2626", glowColor: "#FDE047" });
    this.spawnFlameParticles(this.player.x + Math.cos(a) * 45, this.player.y + Math.sin(a) * 45, "red", isC2 ? 18 : 13, 60, 210);
    let hits = 0;
    for (let D of [...this.enemies]) {
      let P = D.x - this.player.x, N = D.y - this.player.y, W = Math.hypot(P, N) - D.radius, V = Math.abs(Math.atan2(Math.sin(Math.atan2(N, P) - a), Math.cos(Math.atan2(N, P) - a)));
      W <= radius && (V <= spread * 0.54 || W < 42) && (hits++, this.damageEnemy(D, dmg, Math.cos(a) * 22, Math.sin(a) * 22, true), this.spawnFlameParticles(D.x, D.y, "red", 5, 30, 100));
    }
    if (!isC2) {
      this.grantDanhLongNgam();
      this.addFloatingText(this.player.x, this.player.y - 34, "\u{1F525} KH\u1EA0T L\u1EECA PH\xC1 S\u01A0N!", "#FB923C", 16);
    } else {
      let wDmg = Math.round(95 + 1.15 * b + (hasLongNgam ? 45 + 0.55 * b : 0)), spd = hasLongNgam ? 860 : 780;
      this.dragonWaves.push({ id: this.nextEntityId++, x: this.player.x + Math.cos(a) * 26, y: this.player.y + Math.sin(a) * 26, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, angle: a, width: 58, damage: wDmg, distanceTraveled: 0, maxDistance: 440, empowered: true, chargeBonus: true, hasHealed: false, grantedThienPhat: false, hitIds: /* @__PURE__ */ new Set() });
      this.queueVfx("dragon_wave_vis", { x: this.player.x + Math.cos(a) * 26, y: this.player.y + Math.sin(a) * 26, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, angle: a, width: 58, maxDistance: 440, empowered: true });
      this.addFloatingText(this.player.x, this.player.y - 34, hasLongNgam ? "\u{1F409} LONG VI\xCAM H\u1EE6Y DI\u1EC6T!" : "\u{1F525} KH\u1EA0T L\u1EECA LONG H\u1ED2N!", "#FBBF24", 17);
    }
    this.comboManager.record({ heroId: "danh", action: isC2 ? "dragon_c2" : "dragon_c1", hitCount: hits, empowered: true, damageDealt: dmg * Math.max(1, hits) });
  }
  castBaoC1Swap(s) {
    let a = this.getHeroGearStats("bao");
    this.player.bao_c1_recastTimer = 0, this.player.bao_c1_awaitingSecond = false, this.player.bao_emergeTimer = 0.2, this.player.weaponSkillTimer = 0.45, this.player.weaponSkillDur = 0.45;
    let l = this.getEffectiveDamage(), m = this.findNearestEnemy(260), c = m ? Math.atan2(m.y - this.player.y, m.x - this.player.x) : s, g = this.player.x, p = this.player.y;
    for (let k = 0; k < 6; k++) this.spawnSmokePuff(g + (Math.random() - 0.5) * 24, p + (Math.random() - 0.5) * 24, 11, "rgba(147, 51, 234, 0.5)");
    this.afterimages.push({ x: g, y: p, facing: c, color: "#E879F9", alpha: 0.9, life: 0, maxLife: 0.35, radius: this.player.radius }), this.queueVfx("afterimage", { x: g, y: p, facing: c, color: "#E879F9", alpha: 0.9, maxLife: 0.35 }), m ? (this.player.x = Math.max(40, Math.min(Se - 40, m.x + Math.cos(c) * (m.radius + 18))), this.player.y = Math.max(40, Math.min(Ce - 40, m.y + Math.sin(c) * (m.radius + 18))), this.player.facing = c + Math.PI) : (this.player.x = Math.max(40, Math.min(Se - 40, this.player.x + Math.cos(c) * 140)), this.player.y = Math.max(40, Math.min(Ce - 40, this.player.y + Math.sin(c) * 140)), this.player.facing = c), this.spawnSpatialTear(g, p, this.player.x, this.player.y, "#E879F9", 10), this.queueVfx("tear", { x1: g, y1: p, x2: this.player.x, y2: this.player.y, color: "#E879F9", width: 10 }), this.slashes.push({ x: this.player.x, y: this.player.y, angle: this.player.facing, radius: 108, spread: 1.7, dir: -1, crossed: true, color: "#E879F9", life: 0, maxLife: 0.22, kind: "bao_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: this.player.facing, radius: 108, spread: 1.7, dir: -1, crossed: true, color: "#E879F9", maxLife: 0.22, kind: "bao_slash" });
    let h = Math.round(135 + 1.7 * l), f = 0;
    for (let v of [...this.enemies]) Math.hypot(v.x - this.player.x, v.y - this.player.y) <= 112 + v.radius && (f++, this.damageEnemy(v, h, 0, 0, true), v.hp > 0 && this.applyBaoMark(v, 1));
    this.player.attackTimer = 0, this.player.cooldowns[0] = (this.currentHero.skills[0]?.cooldown || 5) * (1 - a.cdr), R.playDaggerSlash(2), R.playDash(), this.addFloatingText(this.player.x, this.player.y - 26, "\u26A1 SONG TR\u1EA2M 2/2!", "#E879F9", 14), this.comboManager.record({ heroId: "bao", action: "c1_recast", hitCount: f, inTimingWindow: true, damageDealt: h * Math.max(1, f) });
  }
  castDanhC1Step3(s, a, heldSec = 0) {
    let l = this.getHeroGearStats("danh"), m = this.getEffectiveDamage(), c = this.player.danh_c1_hitSteps;
    this.player.danh_c1_step = 0, this.player.danh_c1_windowTimer = 0, this.player.danh_c1_hitSteps = 0, this.player.danh_swingDir = 1, this.player.danh_animKind = "c1_3", this.player.danh_animDur = 0.26, this.player.danh_animTimer = 0.26, this.player.weaponSkillTimer = 0.46, this.player.weaponSkillDur = 0.46, this.player.cooldowns[0] = (this.currentHero.skills[0]?.cooldown || 5) * (1 - l.cdr);
    let g = 0, p = 0;
    if (a) {
      let c1Heal = 150 + Math.round(Math.min(1, Math.max(0, (heldSec - 0.35) / 1.15)) * 230);
      this.healPlayer(c1Heal, "HEAL", `+${c1Heal} HP (KI\u1EBEM KH\xCD)`);
      R.playFire(0.3, 0.22), R.playHeavySword(2), this.addShake(8, 0.22), this.slashes.push({ x: this.player.x, y: this.player.y, angle: s, radius: 138, spread: 1.75, dir: 1, step: 3, color: "#FEF08A", life: 0, maxLife: 0.26, kind: "danh_kiem_khi_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: s, radius: 138, spread: 1.75, dir: 1, step: 3, color: "#FEF08A", maxLife: 0.26, kind: "danh_kiem_khi_slash" });
      let f = Math.round(145 + 1.75 * m);
      p = f, this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "danh_kiem_khi", x: this.player.x + Math.cos(s) * 24, y: this.player.y + Math.sin(s) * 24, vx: Math.cos(s) * 760, vy: Math.sin(s) * 760, radius: 26, damage: f, color: "#F59E0B", angle: s, distanceTraveled: 0, maxDistance: 460, pierceLeft: 99, hitIds: /* @__PURE__ */ new Set() }), this.queueVfx("proj_vis", { kind: "danh_kiem_khi", x: this.player.x + Math.cos(s) * 24, y: this.player.y + Math.sin(s) * 24, vx: Math.cos(s) * 760, vy: Math.sin(s) * 760, radius: 26, color: "#F59E0B", angle: s, maxDistance: 460, pierceLeft: 99 }), this.addFloatingText(this.player.x, this.player.y - 28, "\u2694\uFE0F KI\u1EBEM KH\xCD XUY\xCAN PH\xC1!", "#FBBF24", 15), (c & 3) == 3 && this.grantDanhLongNgam(), this.comboManager.record({ heroId: "danh", action: "c1_step3", hitCount: 1, inTimingWindow: true, empowered: true, damageDealt: f });
      return;
    }
    this.healPlayer(150, "HEAL", "+150 HP (PH\xC1 S\u01A0N)"), R.playEarthSlam(), this.addShake(7, 0.2);
    let h = Math.round(115 + 1.55 * m);
    p = h, this.slashes.push({ x: this.player.x, y: this.player.y, angle: s, radius: 158, spread: 1.78, dir: 1, step: 3, color: "#FBBF24", life: 0, maxLife: 0.28, kind: "danh_kiem_khi_slash" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: s, radius: 158, spread: 1.78, dir: 1, step: 3, color: "#FBBF24", maxLife: 0.28, kind: "danh_kiem_khi_slash" }), this.spawnGroundCrack(this.player.x, this.player.y, s, 110, "#DC2626", "#FBBF24"), this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: s, len: 110, color: "#DC2626", glowColor: "#FBBF24" });
    for (let f of [...this.enemies]) {
      let v = f.x - this.player.x, T = f.y - this.player.y, b = Math.hypot(v, T) - f.radius, x = Math.abs(Math.atan2(Math.sin(Math.atan2(T, v) - s), Math.cos(Math.atan2(T, v) - s)));
      b <= 158 && (x <= 0.98 || b < 38) && (g++, this.damageEnemy(f, h, Math.cos(s) * 18, Math.sin(s) * 18, true));
    }
    g > 0 && (c & 3) == 3 && this.grantDanhLongNgam(), this.comboManager.record({ heroId: "danh", action: "c1_step3", hitCount: g, inTimingWindow: g > 0, damageDealt: p * Math.max(1, g) });
  }
  grantDanhLongNgam() {
    this.player.danh_longNgamTimer = 3, this.player.cooldowns[1] = Math.max(0, this.player.cooldowns[1] - 2), this.addFloatingText(this.player.x, this.player.y - 34, "\u{1F409} LONG NG\xC2M (3s) \xB7 -2s C2!", "#FBBF24", 15), R.playDragonRoar();
  }
  castDanhC2Charged(s, a) {
    let l = this.getHeroGearStats("danh"), m = this.getEffectiveDamage(), c = this.player.danh_longNgamTimer > 0;
    c && (this.player.danh_longNgamTimer = 0), this.player.danh_swingDir = 1, this.player.danh_animKind = "c2", this.player.danh_animDur = 0.26, this.player.danh_animTimer = 0.26, this.player.weaponSkillTimer = 0.48, this.player.weaponSkillDur = 0.48, this.player.cooldowns[1] = (this.currentHero.skills[1]?.cooldown || 9.5) * (1 - l.cdr);
    let c2Heal = 150 + Math.round(Math.min(1, Math.max(0, (a - 0.2) / 2.3)) * 230);
    this.healPlayer(c2Heal, "HEAL", `+${c2Heal} HP (LONG H\u1ED2N)`);
    let g = 80 + 1.1 * m, p = 300, h = 34;
    a >= 2.5 ? (g = 170 + 1.85 * m, p = 420, h = 50) : a >= 1.5 && (g = 125 + 1.45 * m, p = 365, h = 42), c && (g += 45 + 0.55 * m, p += 65, h += 18);
    let f = Math.round(g), v = c ? 860 : 720;
    (c || a >= 1.5 ? R.playDragonRoar() : R.playFireball()), this.addShake(c || a >= 1.5 ? 12 : 7, 0.28), this.dragonWaves.push({ id: this.nextEntityId++, x: this.player.x + Math.cos(s) * 24, y: this.player.y + Math.sin(s) * 24, vx: Math.cos(s) * v, vy: Math.sin(s) * v, angle: s, width: h, damage: f, distanceTraveled: 0, maxDistance: p, empowered: c, chargeBonus: a >= 1.5 || c, hasHealed: false, grantedThienPhat: false, hitIds: /* @__PURE__ */ new Set() }), this.queueVfx("dragon_wave_vis", { x: this.player.x + Math.cos(s) * 24, y: this.player.y + Math.sin(s) * 24, vx: Math.cos(s) * v, vy: Math.sin(s) * v, angle: s, width: h, maxDistance: p, empowered: c }), this.addFloatingText(this.player.x, this.player.y - 30, c ? "\u{1F409} R\u1ED2NG \u0110\u1ECE LONG NG\xC2M!" : a >= 2.5 ? "\u{1F525} LONG H\u1ED2N T\u1ED0I \u0110A!" : "\u2694\uFE0F LONG H\u1ED2N PH\xC1 TR\u1EACN!", c ? "#FBBF24" : "#EF4444", 16), this.comboManager.record({ heroId: "danh", action: "c2_charge", hitCount: 1, inTimingWindow: a >= 1.5, empowered: c, damageDealt: f });
  }
  findTargetForTinC3(s, a) {
    let l = null, m = 1 / 0;
    for (let c of this.enemies) {
      if (c.hp <= 0) continue;
      let g = c.x - this.player.x, p = c.y - this.player.y, h = Math.hypot(g, p);
      if (h <= a + c.radius) {
        let f = h + Math.abs(Math.atan2(Math.sin(Math.atan2(p, g) - s), Math.cos(Math.atan2(p, g) - s))) * 180;
        f < m && (m = f, l = c);
      }
    }
    return l;
  }
  syncMusicState() {
    this.gameState === "PLAYING" && R.setMusicMode(this.enemies.some((e) => e.kind === "boss" && e.hp > 0) ? "boss" : "battle");
  }
  getNearestAlivePlayer(x, y) {
    let best = { id: mpClient.playerId || "local", x: this.player.x, y: this.player.y, radius: this.player.radius, facing: this.player.facing, hp: this.player.hp, alive: !this.multiplayer.localDowned && this.player.hp > 0, isLocal: true };
    if (!this.multiplayer.active) return best;
    let candidates = [];
    if (best.alive) candidates.push(best);
    for (let rp of this.multiplayer.remotePlayers.values()) {
      if (rp && rp.alive && rp.hp > 0) {
        candidates.push({ id: rp.id, x: rp.x, y: rp.y, radius: 22, facing: rp.facing || 0, hp: rp.hp, alive: true, isLocal: false });
      }
    }
    if (candidates.length === 0) return best;
    let minD = Infinity;
    let chosen = candidates[0];
    for (let c of candidates) {
      let d = Math.hypot(c.x - x, c.y - y);
      if (d < minD) {
        minD = d;
        chosen = c;
      }
    }
    return chosen;
  }
  startCoopMatch(hero, roomData, spawns = {}) {
    if (hero) {
      this.currentHero = hero;
      this.selectedHeroId = hero.id;
    }
    let playerCount = Math.max(1, roomData?.matchPlayerCount || roomData?.playerCount || 1);
    let powerMult = Math.max(1, roomData?.powerMultiplier || (1 + 0.5 * (playerCount - 1)));
    let myId = mpClient.playerId;
    let isHost = roomData?.hostId === myId;
    this.multiplayer.active = true;
    this.multiplayer.isHost = isHost;
    this.multiplayer.roomId = roomData?.roomId || null;
    this.multiplayer.playerCount = playerCount;
    this.multiplayer.powerMultiplier = powerMult;
    this.multiplayer.localDowned = false;
    this.multiplayer.remotePlayers.clear();
    this.multiplayer.vfxQueue = [];
    this.multiplayer.burnSyncMap.clear();
    this.multiplayer.seenBossHazardIds = /* @__PURE__ */ new Set();
    this.multiplayer.playerSyncTimer = 0;
    this.multiplayer.worldSyncTimer = 0;
    this.multiplayer.reviveTargetId = null;
    this.multiplayer.reviveProgress = 0;
    this.multiplayer.reviveSendCooldown = 0;
    this.multiplayer._lastRemoteDrawTime = 0;

    this.playerCoins = 100;
    this.inventory = [];
    this.heroGear = um();
    this.duccong_pads = [null, null, null];
    this.initPlayer();
    if (myId && spawns[myId]) {
      this.player.x = spawns[myId].x;
      this.player.y = spawns[myId].y;
    }
    if (Array.isArray(roomData?.members)) {
      for (let m of roomData.members) {
        if (!m || m.id === myId) continue;
        let sp = spawns[m.id] || { x: m.x || Se / 2, y: m.y || Ce / 2 };
        let hObj = Mi.find((h) => h.id === m.heroId) || Mi[0];
        this.multiplayer.remotePlayers.set(m.id, {
          id: m.id,
          name: m.name,
          heroId: m.heroId,
          slot: m.slot,
          isHost: m.isHost,
          alive: true,
          x: sp.x,
          y: sp.y,
          targetX: sp.x,
          targetY: sp.y,
          facing: 0,
          targetFacing: 0,
          hp: hObj.stats.hp,
          maxHp: hObj.stats.hp,
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
          buffs: {}
        });
      }
    }

    this.comboManager.fullReset();
    this.totalKilled = 0;
    this.elapsedTime = 0;
    this.enemies = [];
    this.projectiles = [];
    this.zones = [];
    this.icePillars = [];
    this.groundCracks = [];
    this.scorchMarks = [];
    this.frostTracks = [];
    this.spatialTears = [];
    this.frostBarrages = [];
    this.lavaPools = [];
    this.bossWarnings = [];
    this.bossBeams = [];
    this.bossShockRings = [];
    this.afterimages = [];
    this.lightnings = [];
    this.slashes = [];
    this.impactBursts = [];
    this.particles = [];
    this.floatingTexts = [];
    this.xpOrbs = [];
    this.deadCorpses = [];
    this.bloodParticles = [];
    this.redCrystals = [];
    this.flameParticles = [];
    this.smokePuffs = [];
    this.rocketProjectiles = [];
    this.giantMeteors = [];
    this.galaxyVortices = [];
    this.cataclysmicExplosions = [];
    this.tinCrystals = [];
    this.shadowClones = [];
    this.dragonWaves = [];
    this.skyDragons = [];
    this.luanPortals = [];
    this.luanRifts = [];
    this.luanBeams = [];
    this.taiduTurrets = [];
    this.taiduCarpetStrikes = [];
    this.nguyenSanctuaryFields = [];
    this.nguyenSanctuaryWaves = [];
    this.waveCleared = false;
    this.waitingReward = false;
    this.camera = { x: this.player.x, y: this.player.y };
    this.startWave(1);
    this.gameState = "PLAYING";
    this.syncMusicState();
    let buffered = Array.isArray(this.multiplayer.pendingSyncMessages) ? this.multiplayer.pendingSyncMessages.splice(0) : [];
    for (let m of buffered) {
      if (m?.type === "WORLD_SYNC" && typeof m.wave === "number" && m.wave < this.wave) continue;
      this.handleMultiplayerMessage(m);
    }
    this.sendPlayerSync(true);
    this.onStateChange && this.onStateChange();
  }
  stopCoopMode() {
    this.multiplayer.active = false;
    this.multiplayer.isHost = false;
    this.multiplayer.roomId = null;
    this.multiplayer.playerCount = 1;
    this.multiplayer.powerMultiplier = 1;
    this.multiplayer.localDowned = false;
    this.multiplayer.remotePlayers.clear();
    this.multiplayer.vfxQueue = [];
    this.multiplayer.burnSyncMap.clear();
    this.multiplayer.seenBossHazardIds = /* @__PURE__ */ new Set();
    this.multiplayer.pendingSyncMessages = [];
    this.multiplayer.reviveTargetId = null;
    this.multiplayer.reviveProgress = 0;
    this.multiplayer.reviveSendCooldown = 0;
  }
  startWave(s) {
    this.wave = s, this.currentWaveNumber = s, this.waveSpawned = 0, this.waveKilled = 0, this.waveKilledThisWave = 0, this.waveBossKilledThisWave = false, this.waveElapsedTime = 0, this.waveRewardClaimed = false, this.waveCleared = false, this.waitingReward = false, this.spawnTimer = 0.4;
    this.multiplayer.seenBossHazardIds && this.multiplayer.seenBossHazardIds.clear();
    if (this.multiplayer.active && this.multiplayer.localDowned) {
      this.multiplayer.localDowned = false;
      this.player.hp = this.player.maxHp;
      this.player.stunTimer = 0;
      this.player.rootTimer = 0;
      this.player.slowTimer = 0;
      this.player.burnTimer = 0;
      this.addFloatingText(this.player.x, this.player.y - 34, "✨ HỒI SINH SANG MÀN MỚI!", "#34D399", 16);
    } else if (this.multiplayer.active && this.player.hp > 0) {
      this.player.hp = this.player.maxHp;
    }
    let a = this.getHeroGearStats(this.currentHero.id);
    a.waveStartShield > 0 && (this.addPlayerShield(a.waveStartShield, 999), this.addFloatingText(this.player.x, this.player.y - 20, `KHIÊN THẦN VỰC +${a.waveStartShield}`, "#38BDF8", 15));
    let l = BOSS_WAVES.includes(s);
    let mult = this.getCoopPowerMultiplier();
    l ? (this.waveTotal = Math.round((6 + Math.floor(s * 0.65)) * mult) + 1) : this.waveTotal = Math.round((7 + Math.min(MAX_WAVES, s) * 2.4) * mult);
    let m = l ? this.currentLang === "vi" ? `TRÙM MÀN ${s}!` : `BOSS WAVE ${s}!` : this.currentLang === "vi" ? `MÀN ${s}` : `WAVE ${s}`;
    this.addFloatingText(this.player.x, this.player.y - 48, m, "#F59E0B", 22), this.syncMusicState();
    this.multiplayer.active && this.isCoopHost() && mpClient.send({ type: "WAVE_META", wave: this.wave, waveTotal: this.waveTotal, waveSpawned: this.waveSpawned });
    l && this.isCoopHost() && this.spawnBoss(s);
  }
  spawnBoss(s) {
    if (!this.isCoopHost()) return;
    let a = Math.random() * Math.PI * 2, l = Math.max(120, Math.min(Se - 120, this.player.x + Math.cos(a) * 360)), m = Math.max(120, Math.min(Ce - 120, this.player.y + Math.sin(a) * 360)), c = hm[s] || hm[3], mult = this.getCoopPowerMultiplier(), bMod = getBossPowerModifiers(s), g = Math.round(c.baseHP * (1 + 0.25 * (s - 1)) * mult * bMod.hpMultiplier), p = Math.round(c.baseDMG * (1 + 0.1 * (s - 1)) * (1 + (mult - 1) * 0.45) * bMod.damageMultiplier), bSpd = Math.round(c.spd * bMod.speedMultiplier);
    let boss = { id: this.nextEntityId++, kind: "boss", bossWave: s, name: this.currentLang === "vi" ? c.name : c.enName, x: l, y: m, vx: 0, vy: 0, radius: c.radius, hp: g, maxHp: g, baseDamage: p, damage: p, speed: bSpd, baseSpeed: bSpd, xpValue: 300 + s * 40, color: c.color, accentColor: c.accentColor, attackCooldown: 1, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, aoeTimer: 2.2, facing: 0, phase: 1, phase2Triggered: false, phase3Triggered: false };
    this.enemies.push(boss), this.waveSpawned++, R.playBossWarn(), this.addShake(14, 0.45), this.syncMusicState();
    this.addFloatingText(boss.x, boss.y - boss.radius - 26, `👑 ${boss.name} XUẤT HIỆN!`, "#EF4444", 20);
    if (this.multiplayer.active) {
      mpClient.send({ type: "SPAWN_ENEMIES", enemies: [boss], waveSpawned: this.waveSpawned });
      this.queueVfx("boss_callout", { x: boss.x, y: boss.y - boss.radius - 26, text: `👑 ${boss.name} XUẤT HIỆN!`, color: "#EF4444", size: 20, sound: "bossWarn", shakeMag: 14, shakeDur: 0.45 });
    }
    this.onStateChange && this.onStateChange();
  }
  spawnEnemy() {
    if (!this.isCoopHost() || this.waveSpawned >= this.waveTotal) return;
    let s = Math.random() * Math.PI * 2, a = 400 + Math.random() * 200, l = Math.max(60, Math.min(Se - 60, this.player.x + Math.cos(s) * a)), m = Math.max(60, Math.min(Ce - 60, this.player.y + Math.sin(s) * a)), c = 1 + (this.wave - 1) * 0.22, mult = this.getCoopPowerMultiplier(), dmgMult = 1 + (mult - 1) * 0.45;
    let pool = ["minion"];
    this.wave >= 2 && pool.push("brute");
    this.wave >= 3 && pool.push("frost_archer");
    this.wave >= 4 && pool.push("charger");
    this.wave >= 5 && pool.push("bomber");
    this.wave >= 6 && pool.push("caster");
    this.wave >= 7 && pool.push("assassin");
    this.wave >= 8 && pool.push("shield_knight");
    this.wave >= 10 && pool.push("void_acolyte");
    let g = pool[Math.floor(Math.random() * pool.length)];
    let h = {
      minion: { hp: 130, dmg: 21, spd: 125, r: 16, xp: 24, color: "#22C55E", name: "Quái Nhỏ" },
      brute: { hp: 295, dmg: 34, spd: 88, r: 24, xp: 44, color: "#EA580C", name: "Đao Phủ" },
      charger: { hp: 180, dmg: 28, spd: 162, r: 18, xp: 34, color: "#EAB308", name: "Ma Khuyển" },
      caster: { hp: 160, dmg: 32, spd: 95, r: 18, xp: 40, color: "#C084FC", name: "Phù Thủy" },
      frost_archer: { hp: 150, dmg: 27, spd: 108, r: 17, xp: 38, color: "#38BDF8", name: "Xạ Thủ Băng" },
      bomber: { hp: 135, dmg: 38, spd: 168, r: 17, xp: 42, color: "#F97316", name: "Quái Bom Cảm Tử" },
      assassin: { hp: 165, dmg: 34, spd: 154, r: 17, xp: 46, color: "#A855F7", name: "Sát Thủ Bóng Đêm" },
      shield_knight: { hp: 375, dmg: 30, spd: 84, r: 24, xp: 52, color: "#0EA5E9", name: "Khiên Binh Phản Chấn" },
      void_acolyte: { hp: 190, dmg: 35, spd: 96, r: 19, xp: 54, color: "#818CF8", name: "Tín Đồ Hư Không" }
    }[g];
    let enemy = { id: this.nextEntityId++, kind: g, name: h.name, x: l, y: m, vx: 0, vy: 0, radius: h.r, hp: Math.round(h.hp * c * mult), maxHp: Math.round(h.hp * c * mult), speed: h.spd + Math.min(48, this.wave * 2.2), damage: Math.round(h.dmg * (1 + (this.wave - 1) * 0.13) * dmgMult), xpValue: Math.round(h.xp * (1 + (this.wave - 1) * 0.06)), color: h.color, attackCooldown: 0.6, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, aoeTimer: 0, facing: 0, fuseTimer: 0, dashCd: 2.2 + Math.random() * 2 };
    this.enemies.push(enemy), this.waveSpawned++;
    this.multiplayer.active && mpClient.send({ type: "SPAWN_ENEMIES", enemies: [enemy], waveSpawned: this.waveSpawned });
  }
  startNewGame(s) {
    this.stopCoopMode();
    s && (this.currentHero = s, this.selectedHeroId = s.id), this.playerCoins = 100, this.inventory = [], this.heroGear = um(), this.duccong_pads = [null, null, null], this.saveGame(), this.initPlayer(), this.comboManager.fullReset(), this.totalKilled = 0, this.elapsedTime = 0, this.enemies = [], this.projectiles = [], this.zones = [], this.icePillars = [], this.groundCracks = [], this.scorchMarks = [], this.frostTracks = [], this.spatialTears = [], this.frostBarrages = [], this.lavaPools = [], this.bossWarnings = [], this.bossBeams = [], this.bossShockRings = [], this.afterimages = [], this.lightnings = [], this.slashes = [], this.impactBursts = [], this.particles = [], this.floatingTexts = [], this.xpOrbs = [], this.deadCorpses = [], this.bloodParticles = [], this.redCrystals = [], this.flameParticles = [], this.smokePuffs = [], this.rocketProjectiles = [], this.giantMeteors = [], this.galaxyVortices = [], this.cataclysmicExplosions = [], this.tinCrystals = [], this.shadowClones = [], this.dragonWaves = [], this.skyDragons = [], this.luanPortals = [], this.luanRifts = [], this.luanBeams = [], this.taiduTurrets = [], this.taiduCarpetStrikes = [], this.nguyenSanctuaryFields = [], this.nguyenSanctuaryWaves = [], this.waveCleared = false, this.waitingReward = false, this.camera = { x: this.player.x, y: this.player.y }, this.startWave(1), this.gameState = "PLAYING", this.syncMusicState(), this.onStateChange && this.onStateChange();
  }
  update(s) {
    if (this.gameState !== "PLAYING") return;
    let a = Math.min(s, 0.05);
    !this.waitingReward && !this.waveCleared && (this.elapsedTime += a, this.waveElapsedTime += a);
    if (this.multiplayer.active && this.multiplayer.localDowned) {
      this.syncMultiplayerState(a);
      this.updateProjectiles(a), this.updateZones(a), this.updateFrostBarrages(a), this.updateIcePillars(a), this.updateLavaPools(a), this.updateBossWarnings(a), this.updateBossBeams(a), this.updateBossShockRings(a), this.updateEnemies(a), this.updateVFX(a);
      this.enemies = this.enemies.filter((m) => m.hp > 0);
      return;
    }
    let cdTick = this.currentHero.id === "tin" ? a * computeTinCooldownTickRate(this.player.tin_resonance_stacks || 0) : a;
    for (let m = 0; m < 3; m++) this.player.cooldowns[m] > 0 && (this.player.cooldowns[m] = Math.max(0, this.player.cooldowns[m] - cdTick));
    if (this.currentHero.id === "tin") {
      this.player.tin_c1_recast_timer > 0 && (this.player.tin_c1_recast_timer = Math.max(0, this.player.tin_c1_recast_timer - a));
      this.player.tin_resonance_timer > 0 && (this.player.tin_resonance_timer = Math.max(0, this.player.tin_resonance_timer - a), this.player.tin_resonance_timer === 0 && (this.player.tin_resonance_stacks = 0));
    }
    if (this.duccong_pads) for (let m of [1, 2]) {
      let pad = this.duccong_pads[m];
      pad && (this.player.cooldowns[m] <= 0 ? this.duccong_pads[m] = null : pad.teleportCd > 0 && (pad.teleportCd = Math.max(0, pad.teleportCd - a)));
    }
    if (this.player.autoHeal20Timer > 0 && (this.player.autoHeal20Timer = Math.max(0, this.player.autoHeal20Timer - a)), this.player.hpRegenTick = (this.player.hpRegenTick || 0) + a, this.player.hpRegenTick >= 1) {
      this.player.hpRegenTick -= 1;
      let gRegen = this.getHeroGearStats(this.currentHero.id);
      gRegen.hpRegen > 0 && this.player.hp > 0 && this.player.hp < this.player.maxHp && this.healPlayer(Math.max(1, Math.round(this.player.maxHp * (gRegen.hpRegen / 500))), "REGEN_QUIET");
    }
    if (this.player.weaponSkillTimer > 0 && (this.player.weaponSkillTimer = Math.max(0, this.player.weaponSkillTimer - a)), this.player.weaponCritTimer > 0 && (this.player.weaponCritTimer = Math.max(0, this.player.weaponCritTimer - a)), this.player.bowRecoilTimer > 0 && (this.player.bowRecoilTimer = Math.max(0, this.player.bowRecoilTimer - a)), this.player.attackTimer > 0 && (this.player.attackTimer = Math.max(0, this.player.attackTimer - a)), this.player.attackAnimTimer > 0 && (this.player.attackAnimTimer = Math.max(0, this.player.attackAnimTimer - a)), this.player.hitFlash > 0 && (this.player.hitFlash = Math.max(0, this.player.hitFlash - a)), this.shakeTimer > 0 && (this.shakeTimer = Math.max(0, this.shakeTimer - a), this.shakeTimer === 0 && (this.shakeMagnitude = 0)), this.screenFlashWhite > 0 && (this.screenFlashWhite = Math.max(0, this.screenFlashWhite - a)), this.player.berserkTimer > 0 && (this.player.berserkTimer = Math.max(0, this.player.berserkTimer - a), this.player.berserkTimer === 0 && this.currentHero.id === "dung")) {
      this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 95, spread: Math.PI * 2, color: "#F59E0B", life: 0, maxLife: 0.28, kind: "shockwave" });
      this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: 95, spread: Math.PI * 2, color: "#F59E0B", maxLife: 0.28, kind: "shockwave" });
      for (let m of [...this.enemies]) Math.hypot(m.x - this.player.x, m.y - this.player.y) <= 95 + m.radius && this.damageEnemy(m, 45, 0, 0, true);
    }
    if (this.player.dung_c3_buff_timer > 0 && (this.player.dung_c3_buff_timer = Math.max(0, this.player.dung_c3_buff_timer - a)), this.player.kin_asBuffTimer > 0 && (this.player.kin_asBuffTimer = Math.max(0, this.player.kin_asBuffTimer - a)), this.player.kin_c2_lifestealTimer > 0 && (this.player.kin_c2_lifestealTimer = Math.max(0, this.player.kin_c2_lifestealTimer - a)), this.player.longhoi_msBuffTimer > 0 && (this.player.longhoi_msBuffTimer = Math.max(0, this.player.longhoi_msBuffTimer - a)), this.player.dashBuffAsTimer > 0 && (this.player.dashBuffAsTimer = Math.max(0, this.player.dashBuffAsTimer - a)), this.player.autoShield20Timer > 0 && (this.player.autoShield20Timer = Math.max(0, this.player.autoShield20Timer - a)), this.player.autoShield30Timer > 0 && (this.player.autoShield30Timer = Math.max(0, this.player.autoShield30Timer - a)), this.player.ccResistTimer > 0 && (this.player.ccResistTimer = Math.max(0, this.player.ccResistTimer - a)), this.player.stunTimer > 0 && (this.player.stunTimer = Math.max(0, this.player.stunTimer - a), this.player.dashActive = false, this.player.dashKind = "none"), this.player.rootTimer > 0 && (this.player.rootTimer = Math.max(0, this.player.rootTimer - a), this.player.dashActive && (this.player.dashActive = false, this.player.dashKind = "none")), this.player.slowTimer > 0 && (this.player.slowTimer = Math.max(0, this.player.slowTimer - a), this.player.slowTimer === 0 && (this.player.slowFactor = 0)), this.player.burnTimer > 0 && (this.player.burnTimer = Math.max(0, this.player.burnTimer - a), this.player.burnTickTimer += a, Math.random() < 0.28 && this.spawnFlameParticles(this.player.x, this.player.y, "red", 1, 20, 55), this.player.burnTickTimer >= 0.5 && (this.player.burnTickTimer -= 0.5, this.damagePlayer(Math.max(4, Math.round(this.player.burnDps * 0.5)))), this.player.burnTimer === 0 && (this.player.burnDps = 0, this.player.burnTickTimer = 0)), this.player.shieldTimer > 0 && (this.player.shieldTimer = Math.max(0, this.player.shieldTimer - a), this.player.shieldTimer === 0 && this.player.shield > 0 && (this.player.shield = 0, this.player.shieldExplodeDmg > 0 && this.player.shieldExplodeRadius > 0 && this.triggerShieldExplosion())), this.comboManager.update(a), this.currentHero.id === "gau") {
      if (this.player.hp > 0 && this.player.hp < this.player.maxHp) {
        this.player.gau_noDmgTimer = (this.player.gau_noDmgTimer || 0) + a;
        if (this.player.gau_noDmgTimer >= 3) {
          this.player.gau_noDmgTimer -= 3;
          let gh = Math.round(this.player.maxHp * 0.2);
          this.healPlayer(gh, "HEAL", `\u{1F6E1}\uFE0F B\u1EA4T KHU\u1EA4T +${gh} HP`);
        }
      } else this.player.gau_noDmgTimer = 0;
      if (this.player.gau_animTimer > 0 && (this.player.gau_animTimer = Math.max(0, this.player.gau_animTimer - a), this.player.gau_animTimer === 0 && (this.player.gau_animKind = "none")), this.player.gau_c2_counterWaveTimer > 0 && (this.player.gau_c2_counterWaveTimer = Math.max(0, this.player.gau_c2_counterWaveTimer - a)), this.player.gau_landBounceTimer > 0 && (this.player.gau_landBounceTimer = Math.max(0, this.player.gau_landBounceTimer - a)), this.player.gau_cuongHungTimer > 0 && (this.player.gau_cuongHungTimer = Math.max(0, this.player.gau_cuongHungTimer - a)), this.player.gau_basicResetTimer > 0 && (this.player.gau_basicResetTimer = Math.max(0, this.player.gau_basicResetTimer - a), this.player.gau_basicResetTimer === 0 && (this.player.gau_basicStep = 0)), this.player.gau_c1_afterStep3Timer > 0 && (this.player.gau_c1_afterStep3Timer = Math.max(0, this.player.gau_c1_afterStep3Timer - a)), this.player.gau_c1_windowTimer > 0 && (this.player.gau_c1_windowTimer = Math.max(0, this.player.gau_c1_windowTimer - a), this.player.gau_c1_windowTimer === 0 && this.player.gau_c1_step > 0)) {
        let m = this.player.gau_c1_step;
        this.player.gau_c1_step = 0, this.player.gau_c1_basicCancelPrimed = false, this.player.gau_c1_comboHits = {};
        let c = this.getHeroGearStats("gau");
        this.player.cooldowns[0] = (this.currentHero.skills[0]?.cooldown || 5) * (1 - c.cdr), m === 2 && (this.comboManager.record({ heroId: "gau", action: "window_expired", hitCount: 0 }), this.addFloatingText(this.player.x, this.player.y - 26, "\u231B L\u1EC6CH NH\u1ECAP C1!", "#94A3B8", 13));
      }
      this.player.gau_c2_recastLock > 0 && (this.player.gau_c2_recastLock = Math.max(0, this.player.gau_c2_recastLock - a)), this.player.gau_c2_guardTimer > 0 && (this.player.gau_c2_guardTimer = Math.max(0, this.player.gau_c2_guardTimer - a), this.player.gau_c2_guardTimer === 0 && this.executeGauC2Slam());
    }
    if (this.currentHero.id === "bao") {
      if (this.player.bao_glideTimer > 0 && (this.player.bao_glideTimer = Math.max(0, this.player.bao_glideTimer - a)), this.player.bao_emergeTimer > 0 && (this.player.bao_emergeTimer = Math.max(0, this.player.bao_emergeTimer - a)), this.player.bao_stealthTimer > 0 ? this.player.bao_stealthFade = Math.min(1, (this.player.bao_stealthFade || 0) + a * 6.5) : this.player.bao_stealthFade > 0 && (this.player.bao_stealthFade = Math.max(0, this.player.bao_stealthFade - a * 5)), this.player.bao_basicResetTimer > 0 && (this.player.bao_basicResetTimer = Math.max(0, this.player.bao_basicResetTimer - a), this.player.bao_basicResetTimer === 0 && (this.player.bao_basicStep = 0)), this.player.bao_c1_recastTimer > 0 && (this.player.bao_c1_recastTimer = Math.max(0, this.player.bao_c1_recastTimer - a), this.player.bao_c1_recastTimer === 0 && this.player.bao_c1_awaitingSecond && (this.player.bao_c1_awaitingSecond = false, this.player.cooldowns[0] = (this.currentHero.skills[0]?.cooldown || 5) * (1 - this.getHeroGearStats("bao").cdr))), this.player.bao_stealthLockTimer > 0 && (this.player.bao_stealthLockTimer = Math.max(0, this.player.bao_stealthLockTimer - a)), this.player.bao_stealthTimer > 0 && (this.player.bao_stealthTimer = Math.max(0, this.player.bao_stealthTimer - a), Math.random() < 0.42 && this.spawnSmokePuff(this.player.x + (Math.random() - 0.5) * 18, this.player.y + (Math.random() - 0.5) * 18, 10, "rgba(147, 51, 234, 0.42)"), this.player.bao_stealthTimer === 0)) {
        let m = this.getHeroGearStats("bao");
        this.player.bao_emergeTimer = 0.22, this.player.cooldowns[1] = (this.currentHero.skills[1]?.cooldown || 8) * (1 - m.cdr);
        for (let k = 0; k < 6; k++) this.spawnSmokePuff(this.player.x + (Math.random() - 0.5) * 24, this.player.y + (Math.random() - 0.5) * 24, 12, "rgba(232, 121, 249, 0.48)");
      }
      if (this.player.bao_queuedC3Finisher) {
        let m = this.player.bao_queuedC3Finisher;
        if (m.timer -= a, m.timer <= 0) {
          this.player.bao_queuedC3Finisher = null, this.player.bao_emergeTimer = 0.24;
          let c = (m.targetId ? this.enemies.find((T) => T.id === m.targetId && T.hp > 0) : null) || this.findNearestEnemy(320), g = c ? c.x : m.targetX, p = c ? c.y : m.targetY, h = Math.atan2(p - this.player.y, g - this.player.x);
          this.afterimages.push({ x: this.player.x, y: this.player.y, facing: h, color: "#9333EA", alpha: 0.9, life: 0, maxLife: 0.4, radius: this.player.radius }), this.queueVfx("afterimage", { x: this.player.x, y: this.player.y, facing: h, color: "#9333EA", alpha: 0.9, maxLife: 0.4 }), c && (this.player.x = Math.max(40, Math.min(Se - 40, c.x - Math.cos(h) * (c.radius + 18))), this.player.y = Math.max(40, Math.min(Ce - 40, c.y - Math.sin(h) * (c.radius + 18)))), this.player.facing = h, this.slashes.push({ x: g, y: p, angle: h, radius: 105, spread: 2.1, dir: 1, crossed: true, color: "#E879F9", life: 0, maxLife: 0.26, kind: "bao_slash" }), this.queueVfx("slash", { x: g, y: p, angle: h, radius: 105, spread: 2.1, dir: 1, crossed: true, color: "#E879F9", maxLife: 0.26, kind: "bao_slash" }), this.spawnSpatialTear(g - 70, p - 70, g + 70, p + 70, "#E879F9", 13), this.spawnSpatialTear(g + 70, p - 70, g - 70, p + 70, "#9333EA", 13), this.queueVfx("tear", { x1: g - 70, y1: p - 70, x2: g + 70, y2: p + 70, color: "#E879F9", width: 13 }), this.queueVfx("tear", { x1: g + 70, y1: p - 70, x2: g - 70, y2: p + 70, color: "#9333EA", width: 13 }), this.spawnRedCrystals(g, p, 14, 70, 210), R.playDeathSeal(), this.addShake(14, 0.35);
          let f = m.dmg, v = false;
          if (c && c.hp > 0) {
            (c.bao_marks || 0) >= 3 && (f += 95, v = true, this.addFloatingText(c.x, c.y - 38, "\u{1F480} V\u1EA0N \u1EA2NH T\u1EEC \u1EA4N +95!", "#E879F9", 17));
            let steal = Math.max(Math.round(this.player.maxHp * 0.08), Math.round(Math.min(c.hp, f) * 0.18));
            this.damageEnemy(c, f, 0, 0, true), this.healPlayer(steal, "LIFESTEAL"), c.hp > 0 && this.applyBaoMark(c, 1);
          }
          this.comboManager.record({ heroId: "bao", action: "c3", hitCount: +!!c, empowered: v, damageDealt: f });
        }
      }
    }
    if (this.currentHero.id === "danh") {
      if (this.player.danh_dragonTimer > 0 && (this.player.danh_dragonTimer = Math.max(0, this.player.danh_dragonTimer - a), this.player.stunTimer = 0, this.player.rootTimer = 0, this.player.slowTimer = 0, this.player.slowFactor = 0, Math.random() < 0.35 && this.spawnFlameParticles(this.player.x + (Math.random() - 0.5) * 26, this.player.y + (Math.random() - 0.5) * 26, "red", 1, 20, 65), this.player.danh_dragonTimer === 0 && this.addFloatingText(this.player.x, this.player.y - 32, "H\u1EBFt H\xF3a R\u1ED3ng", "#FCA5A5", 14)), this.player.danh_animTimer > 0 && (this.player.danh_animTimer = Math.max(0, this.player.danh_animTimer - a), this.player.danh_animTimer === 0 && (this.player.danh_animKind = "none")), this.player.danh_basicResetTimer > 0 && (this.player.danh_basicResetTimer = Math.max(0, this.player.danh_basicResetTimer - a), this.player.danh_basicResetTimer === 0 && (this.player.danh_basicStep = 0, this.player.danh_basicHitCount = 0)), this.player.danh_khaiSonTimer > 0 && (this.player.danh_khaiSonTimer = Math.max(0, this.player.danh_khaiSonTimer - a)), this.player.danh_longNgamTimer > 0 && (this.player.danh_longNgamTimer = Math.max(0, this.player.danh_longNgamTimer - a)), this.player.danh_thienPhatTimer > 0 && (this.player.danh_thienPhatTimer = Math.max(0, this.player.danh_thienPhatTimer - a)), this.player.danh_c1_windowTimer > 0 && !(this.player.chargeState.active && this.player.chargeState.kind === "danh_c1_wave") && (this.player.danh_c1_windowTimer = Math.max(0, this.player.danh_c1_windowTimer - a), this.player.danh_c1_windowTimer === 0 && this.player.danh_c1_step > 0)) {
        this.player.danh_c1_step = 0, this.player.danh_c1_hitSteps = 0;
        let m = this.getHeroGearStats("danh");
        this.player.cooldowns[0] = (this.currentHero.skills[0]?.cooldown || 5) * (1 - m.cdr);
      }
      this.player.chargeState.active && (this.player.chargeState.elapsed = Math.min(this.player.chargeState.maxDur, this.player.chargeState.elapsed + a), Math.random() < 0.35 && this.spawnFlameParticles(this.player.x, this.player.y, "red", 1, 25, 65));
    }
    if (this.player.luan_c2_recastLock > 0 && (this.player.luan_c2_recastLock = Math.max(0, this.player.luan_c2_recastLock - a)), this.player.luan_vampTextCd > 0 && (this.player.luan_vampTextCd = Math.max(0, this.player.luan_vampTextCd - a)), this.player.luan_c3Charge) {
      this.player.luan_c3Charge.timer -= a;
      Math.random() < 0.7 && this.spawnParticles(this.player.x + (Math.random() - 0.5) * 28, this.player.y + (Math.random() - 0.5) * 28, "#E879F9", 2, 20, 75, 2.5, 0.25);
      if (this.player.luan_c3Charge.timer <= 0) {
        let ang = this.player.luan_c3Charge.angle;
        this.player.luan_c3Charge = null;
        this.fireLuanC3Beam(ang);
      }
    }
    if (this.luanPortals.length > 0) {
      let expired = false;
      for (let idx = 0; idx < this.luanPortals.length; idx++) {
        let pt = this.luanPortals[idx];
        pt.life += a;
        if (pt.life >= pt.maxLife) {
          expired = true;
          break;
        }
        if (!pt.visualOnly && this.luanPortals.length >= 2) {
          let nextPt = this.luanPortals[(idx + 1) % this.luanPortals.length];
          for (let e of [...this.enemies]) {
            if (e.hp <= 0 || (e.luan_warpCd || 0) > 0) continue;
            if (Math.hypot(e.x - pt.x, e.y - pt.y) <= pt.radius + e.radius * 0.4) {
              e.luan_warpCd = 1.6;
              this.slashes.push({ x: pt.x, y: pt.y, angle: 0, radius: pt.radius * 1.2, spread: Math.PI * 2, color: "#C084FC", life: 0, maxLife: 0.28, kind: "luan_portal_wave" });
              if (!this.isBossImmune(e) && e.kind !== "boss") {
                e.x = Math.max(e.radius + 20, Math.min(Se - e.radius - 20, nextPt.x + (Math.random() - 0.5) * 24));
                e.y = Math.max(e.radius + 20, Math.min(Ce - e.radius - 20, nextPt.y + (Math.random() - 0.5) * 24));
              }
              this.slashes.push({ x: e.x, y: e.y, angle: 0, radius: 52, spread: Math.PI * 2, color: "#67E8F9", life: 0, maxLife: 0.28, kind: "luan_portal_wave" });
              this.spawnParticles(e.x, e.y, "#E879F9", 8, 35, 110, 2.8, 0.3);
              this.damageEnemy(e, pt.damage, 0, 0, true);
              R.playCosmic();
            }
          }
        }
      }
      if (expired) {
        if (this.luanPortals[0]?.visualOnly) this.luanPortals = [];
        else this.closeAndDetonateLuanPortals();
      }
    }
    for (let i = this.luanRifts.length - 1; i >= 0; i--) {
      let rf = this.luanRifts[i];
      rf.life += a;
      if (!rf.visualOnly && rf.damage > 0) {
        rf.tickTimer += a;
        if (rf.tickTimer >= rf.tickInterval) {
          rf.tickTimer -= rf.tickInterval;
          for (let e of [...this.enemies]) {
            if (e.hp > 0 && this.pointToSegmentDist(e.x, e.y, rf.x1, rf.y1, rf.x2, rf.y2) <= 28 + e.radius) {
              this.damageEnemy(e, rf.damage, 0, 0, true);
            }
          }
        }
      }
      rf.life >= rf.maxLife && this.luanRifts.splice(i, 1);
    }
    for (let i = this.luanBeams.length - 1; i >= 0; i--) {
      let bm = this.luanBeams[i];
      bm.life += a;
      bm.life >= bm.maxLife && this.luanBeams.splice(i, 1);
    }
    if (this.currentHero.id === "taidu" && this.player.hp > 0) {
      let dProf = getTaiDuDroneProfile(this.player.taidu_droneMode || "attack");
      let orbitDist = Number.isFinite(dProf.orbitDist) ? dProf.orbitDist : (dProf.orbitRadius ?? 56);
      let scanRange = Number.isFinite(dProf.scanRange) ? dProf.scanRange : 390;
      let dmgRatio = Number.isFinite(dProf.dmgRatio) ? dProf.dmgRatio : (dProf.damageScale ?? 0.5);
      let healPct = Number.isFinite(dProf.healPct) ? dProf.healPct : (dProf.healPctMaxHp ?? 0);
      let drCol = dProf.color || "#38BDF8";
      this.player.taidu_droneAngle = (this.player.taidu_droneAngle || 0) + a * (this.player.taidu_droneMode === "pursuit" ? 3.2 : 2.1);
      let orbX = this.player.x + Math.cos(this.player.taidu_droneAngle) * orbitDist, orbY = this.player.y + Math.sin(this.player.taidu_droneAngle) * orbitDist;
      let prevDrX = Number.isFinite(this.player.taidu_droneX) ? this.player.taidu_droneX : orbX;
      let prevDrY = Number.isFinite(this.player.taidu_droneY) ? this.player.taidu_droneY : orbY;
      this.player.taidu_droneX = prevDrX + (orbX - prevDrX) * Math.min(1, a * 12);
      this.player.taidu_droneY = prevDrY + (orbY - prevDrY) * Math.min(1, a * 12);
      this.player.taidu_droneMuzzleTimer > 0 && (this.player.taidu_droneMuzzleTimer = Math.max(0, this.player.taidu_droneMuzzleTimer - a));
      let drX = this.player.taidu_droneX, drY = this.player.taidu_droneY, drTarget = null, bestScore = Infinity;
      for (let e of this.enemies) {
        if (e.hp <= 0) continue;
        let dist = Math.hypot(e.x - drX, e.y - drY);
        if (dist > scanRange) continue;
        let score = dProf.prioritizeLowHp ? (e.hp / Math.max(1, e.maxHp)) * 1000 + dist * 0.25 : dist;
        score < bestScore && (bestScore = score, drTarget = e);
      }
      if (drTarget) {
        this.player.taidu_droneTargetX = drTarget.x, this.player.taidu_droneTargetY = drTarget.y;
        this.player.taidu_droneFacing = Math.atan2(drTarget.y - drY, drTarget.x - drX);
      } else {
        this.player.taidu_droneTargetX = null, this.player.taidu_droneTargetY = null;
        this.player.taidu_droneFacing = this.player.facing;
      }
      this.player.taidu_droneFireTimer = (this.player.taidu_droneFireTimer || 0) - a;
      if (drTarget && this.player.taidu_droneFireTimer <= 0) {
        this.player.taidu_droneFireTimer = dProf.fireInterval;
        this.player.taidu_droneMuzzleTimer = 0.11;
        let ang = this.player.taidu_droneFacing, dmg = Math.round(this.getEffectiveDamage() * dmgRatio), spd = this.player.taidu_droneMode === "pursuit" ? 900 : 780;
        this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "turret_shot", x: drX + Math.cos(ang) * 14, y: drY + Math.sin(ang) * 14, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, radius: 7, damage: dmg, color: drCol, angle: ang, distanceTraveled: 0, maxDistance: scanRange + 80, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
        this.queueVfx("proj_vis", { kind: "turret_shot", x: drX + Math.cos(ang) * 14, y: drY + Math.sin(ang) * 14, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, radius: 7, color: drCol, angle: ang, maxDistance: scanRange + 80, pierceLeft: 1 });
        R.playTurretShot();
      }
      if (dProf.healInterval > 0 && healPct > 0) {
        this.player.taidu_droneHealTimer = (this.player.taidu_droneHealTimer || 0) + a;
        if (this.player.taidu_droneHealTimer >= dProf.healInterval) {
          this.player.taidu_droneHealTimer -= dProf.healInterval;
          this.player.hp < this.player.maxHp && this.healPlayer(Math.round(this.player.maxHp * healPct), "HEAL", `+${Math.round(this.player.maxHp * healPct)} HP (DRONE H\u1ED8 V\u1EC6)`);
        }
      }
    }
    for (let i = this.taiduTurrets.length - 1; i >= 0; i--) {
      let tr = this.taiduTurrets[i];
      tr.life += a;
      tr.muzzleTimer > 0 && (tr.muzzleTimer = Math.max(0, tr.muzzleTimer - a));
      if (!tr.visualOnly) {
        let tgt = this.findNearestEnemy(tr.range, tr.x, tr.y);
        tr.hasTarget = Boolean(tgt);
        if (tgt) {
          tr.targetX = tgt.x, tr.targetY = tgt.y;
          tr.angle = Math.atan2(tgt.y - tr.y, tgt.x - tr.x);
          tr.fireTimer -= a;
          if (tr.fireTimer <= 0) {
            tr.fireTimer = tr.fireInterval, tr.muzzleTimer = 0.12;
            let sx = tr.x + Math.cos(tr.angle) * 28, sy = tr.y + Math.sin(tr.angle) * 28;
            this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: "turret_shot", x: sx, y: sy, vx: Math.cos(tr.angle) * 840, vy: Math.sin(tr.angle) * 840, radius: 8, damage: tr.damage, color: "#38BDF8", angle: tr.angle, distanceTraveled: 0, maxDistance: tr.range + 60, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
            this.queueVfx("proj_vis", { kind: "turret_shot", x: sx, y: sy, vx: Math.cos(tr.angle) * 840, vy: Math.sin(tr.angle) * 840, radius: 8, color: "#38BDF8", angle: tr.angle, maxDistance: tr.range + 60, pierceLeft: 1 });
            R.playTurretShot();
          }
        }
      } else {
        let tgt = this.findNearestEnemy(tr.range, tr.x, tr.y);
        tr.hasTarget = Boolean(tgt);
        if (tgt) {
          tr.targetX = tgt.x, tr.targetY = tgt.y;
          tr.angle = Math.atan2(tgt.y - tr.y, tgt.x - tr.x);
          tr.fireTimer -= a;
          if (tr.fireTimer <= 0) tr.fireTimer = tr.fireInterval, tr.muzzleTimer = 0.12;
        }
      }
      tr.life >= tr.maxLife && this.taiduTurrets.splice(i, 1);
    }
    for (let i = this.taiduCarpetStrikes.length - 1; i >= 0; i--) {
      let st = this.taiduCarpetStrikes[i];
      st.timer += a;
      if (st.timer >= st.delay) {
        this.slashes.push({ x: st.x, y: st.y, angle: 0, radius: st.radius * 1.15, spread: Math.PI * 2, color: "#F97316", accentColor: "#FEF08A", life: 0, maxLife: 0.36, kind: "taidu_hex_blast" });
        this.spawnFlameParticles(st.x, st.y, "red", 8, 40, 145);
        this.spawnParticles(st.x, st.y, "#38BDF8", 6, 40, 130, 2.8, 0.32);
        this.spawnGroundCrack(st.x, st.y, Math.random() * Math.PI * 2, st.radius * 0.65, "#EA580C", "#FEF08A");
        R.playExplosion(), this.addShake(7, 0.16);
        if (!st.visualOnly) {
          let totalDealt = 0;
          for (let e of [...this.enemies]) {
            if (e.hp > 0 && Math.hypot(e.x - st.x, e.y - st.y) <= st.radius + e.radius) {
              totalDealt += Math.min(e.hp, st.damage);
              this.damageEnemy(e, st.damage, 0, 0, true);
            }
          }
          totalDealt > 0 && this.healPlayer(Math.max(14, Math.round(totalDealt * (st.healRate || 0.08))), "HEAL");
        }
        this.taiduCarpetStrikes.splice(i, 1);
      }
    }
    if (this.currentHero.id === "nguyen") {
      this.player.nguyen_rescueCd > 0 && (this.player.nguyen_rescueCd = Math.max(0, this.player.nguyen_rescueCd - a));
      this.player.nguyen_rescueFlashTimer > 0 && (this.player.nguyen_rescueFlashTimer = Math.max(0, this.player.nguyen_rescueFlashTimer - a));
      if (this.player.nguyen_hotQueue && this.player.nguyen_hotQueue.length > 0) {
        for (let i = this.player.nguyen_hotQueue.length - 1; i >= 0; i--) {
          let h = this.player.nguyen_hotQueue[i];
          h.timer -= a;
          if (h.timer <= 0) {
            h.timer = h.interval, h.ticksLeft--;
            this.player.hp > 0 && this.healPlayer(h.healAmt, "HEAL");
            h.ticksLeft <= 0 && this.player.nguyen_hotQueue.splice(i, 1);
          }
        }
      }
      if (this.player.nguyen_satellitesTimer > 0) {
        this.player.nguyen_satellitesTimer = Math.max(0, this.player.nguyen_satellitesTimer - a);
        this.player.nguyen_satellitesRot = (this.player.nguyen_satellitesRot || 0) + a * 3.2;
        this.player.nguyen_satellitesHealTimer = (this.player.nguyen_satellitesHealTimer || 0) - a;
        if (this.player.nguyen_satellitesHealTimer <= 0 && this.player.hp > 0) {
          this.player.nguyen_satellitesHealTimer = 1.0;
          let satHeal = Math.round(46 + 0.34 * this.getEffectiveAP());
          this.healPlayer(satHeal, "HEAL");
        }
        if (this.player.nguyen_satellitesTimer === 0 && this.player.hp > 0) {
          let ap = this.getEffectiveAP(), boomDmg = Math.round(85 + 0.72 * ap), boomHeal = Math.round(115 + 0.80 * ap);
          R.playSanctuaryWave();
          this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 180, spread: Math.PI * 2, color: "#10B981", life: 0, maxLife: 0.42, kind: "nguyen_lotus_boom" });
          this.nguyenSanctuaryWaves.push({ id: this.nextEntityId++, x: this.player.x, y: this.player.y, maxRadius: 180, life: 0, maxLife: 0.48 });
          this.queueVfx("nguyen_wave_vis", { x: this.player.x, y: this.player.y, maxRadius: 180, maxLife: 0.48 });
          this.healPlayer(boomHeal, "HEAL");
          this.emitAllySupport({ x: this.player.x, y: this.player.y, radius: 240, heal: boomHeal, label: `+${boomHeal} HP (TAM V\u1EC6 TINH)`, color: "#34D399" });
          for (let e of [...this.enemies]) {
            let dx = e.x - this.player.x, dy = e.y - this.player.y;
            if (Math.hypot(dx, dy) <= 180 + e.radius) {
              let kb = Math.atan2(dy, dx);
              this.damageEnemy(e, boomDmg, Math.cos(kb) * 32, Math.sin(kb) * 32, true);
            }
          }
        }
      }
    }
    for (let i = this.nguyenSanctuaryFields.length - 1; i >= 0; i--) {
      let fd = this.nguyenSanctuaryFields[i];
      fd.timer += a;
      if (!fd.visualOnly && fd.pulsesLeft > 0) {
        fd.tickTimer += a;
        if (fd.tickTimer >= fd.tickInterval) {
          fd.tickTimer -= fd.tickInterval, fd.pulsesLeft--;
          this.nguyenSanctuaryWaves.push({ id: this.nextEntityId++, x: fd.x, y: fd.y, maxRadius: fd.radius, life: 0, maxLife: 0.48 });
          this.queueVfx("nguyen_wave_vis", { x: fd.x, y: fd.y, maxRadius: fd.radius, maxLife: 0.48 });
          Math.hypot(this.player.x - fd.x, this.player.y - fd.y) <= fd.radius + this.player.radius && this.player.hp > 0 && this.healPlayer(fd.healAmt, "HEAL");
          this.emitAllySupport({ x: fd.x, y: fd.y, radius: fd.radius, heal: fd.healAmt, label: `+${fd.healAmt} HP (TH\xC1NH \u0110\u1ECAA)`, color: "#34D399" });
          for (let e of [...this.enemies]) e.hp > 0 && Math.hypot(e.x - fd.x, e.y - fd.y) <= fd.radius + e.radius && this.damageEnemy(e, fd.dmgAmt, 0, 0, true);
          R.playSanctuaryWave();
        }
      }
      fd.timer >= fd.duration && this.nguyenSanctuaryFields.splice(i, 1);
    }
    for (let i = this.nguyenSanctuaryWaves.length - 1; i >= 0; i--) {
      let wv = this.nguyenSanctuaryWaves[i];
      wv.life += a;
      wv.life >= wv.maxLife && this.nguyenSanctuaryWaves.splice(i, 1);
    }
    if (this.player.tin_monochrome_realm_timer > 0 && (this.player.tin_monochrome_realm_timer = Math.max(0, this.player.tin_monochrome_realm_timer - a)), this.player.eohyen_heal_cd > 0 && (this.player.eohyen_heal_cd = Math.max(0, this.player.eohyen_heal_cd - a)), this.currentHero.id === "longhoi" && (this.player.longhoi_sustain_sec_timer += a, this.player.longhoi_sustain_sec_timer >= 1 && (this.player.longhoi_sustain_sec_timer = 0, this.player.longhoi_sustain_pool = 0)), this.currentHero.id === "duccong" && this.player.hp > 0 && (this.player.duccong_regen_timer -= a, this.player.duccong_regen_timer <= 0)) {
      this.player.duccong_regen_timer = 5;
      let m = Math.round(this.player.maxHp * 0.03);
      this.healPlayer(m, "HEAL", `+${m} HP (TINH T\xDA T\u1EF0 H\u1ED2I)`), this.spawnParticles(this.player.x, this.player.y, "#C084FC", 8, 30, 80, 3, 0.4);
    }
    if (this.player.trung_orbs && this.player.trung_orbs.active) {
      this.player.trung_orbs.timer -= a, this.player.trung_orbs.rot += this.player.trung_orbs.rotSpeed * a;
      for (let m in this.player.trung_orbs.hitCooldowns) this.player.trung_orbs.hitCooldowns[m] -= a, this.player.trung_orbs.hitCooldowns[m] <= 0 && delete this.player.trung_orbs.hitCooldowns[m];
      for (let m = 0; m < this.player.trung_orbs.count; m++) {
        let c = this.player.trung_orbs.rot + Math.PI * 2 / this.player.trung_orbs.count * m, g = this.player.x + Math.cos(c) * this.player.trung_orbs.radius, p = this.player.y + Math.sin(c) * this.player.trung_orbs.radius;
        for (let h of this.enemies) if (!(h.hp <= 0) && !this.player.trung_orbs.hitCooldowns[h.id] && Math.hypot(h.x - g, h.y - p) <= 12 + h.radius) {
          this.player.trung_orbs.hitCooldowns[h.id] = 0.35;
          let f = 36 * (this.getEffectiveDamage() / this.currentHero.stats.damage);
          this.damageEnemy(h, f, 0, 0, true), this.healPlayer(38, "HEAL", "+38 HP (CẦU MA PHÁP)"), this.spawnFlameParticles(g, p, "blue", 4, 30, 70), this.queueVfx("particles", { x: g, y: p, flame: true, flameColor: "blue", count: 4, minSpd: 30, maxSpd: 70 }), R.playOrb();
        }
      }
      this.player.trung_orbs.timer <= 0 && (this.player.trung_orbs = null);
    }
    if (this.player.dashActive) {
      this.player.dashTimer -= a, this.player.dashKind === "gau_c3_leap" && (this.player.gau_leapElapsed = (this.player.gau_leapElapsed || 0) + a);
      let m = this.player.dashVx * a, c = this.player.dashVy * a;
      if (this.player.x += m, this.player.y += c, (this.player.dashKind === "bao_c1" || Math.random() < 0.75) && (this.afterimages.push({ x: this.player.x, y: this.player.y, facing: this.player.facing, color: this.player.dashKind === "bao_c1" ? "#A855F7" : this.currentHero.color, alpha: this.player.dashKind === "bao_c1" ? 0.55 : 0.65, life: 0, maxLife: 0.34, radius: this.player.radius }), this.multiplayer.active && Math.random() < 0.5 && this.queueVfx("afterimage", { x: this.player.x, y: this.player.y, facing: this.player.facing, color: this.player.dashKind === "bao_c1" ? "#A855F7" : this.player.dashKind === "fox_dash" ? "#F97316" : this.currentHero.color, alpha: 0.6, maxLife: 0.32 })), this.player.dashKind === "fox_dash" ? this.spawnFlameParticles(this.player.x, this.player.y, "red", 3, 20, 60) : this.player.dashKind === "dung_c1" ? this.spawnParticles(this.player.x, this.player.y, "#38BDF8", 2, 20, 80, 2, 0.2) : this.player.dashKind === "bao_c1" && Math.random() < 0.55 && this.spawnSmokePuff(this.player.x, this.player.y, 9, "rgba(192, 132, 252, 0.38)"), this.player.dashKind === "dung_c1" || this.player.dashKind === "tin_c1") {
        for (let g of [...this.enemies]) if (!this.player.dashHitIds.has(g.id) && Math.hypot(g.x - this.player.x, g.y - this.player.y) <= this.player.radius + g.radius + 20) {
          this.player.dashHitIds.add(g.id);
          let p = Math.atan2(this.player.dashVy, this.player.dashVx), h = this.player.dashDamage, hadMark = !!g.tin_hasMark;
          this.player.dashKind === "tin_c1" && hadMark && (h += Math.round(68 * (this.getEffectiveDamage() / this.currentHero.stats.damage)), g.tin_hasMark = false), this.damageEnemy(g, h, this.player.dashKind === "dung_c1" ? Math.cos(p) * 32 : 0, this.player.dashKind === "dung_c1" ? Math.sin(p) * 32 : 0, true), this.player.dashKind === "dung_c1" && (this.isBossImmune(g) ? this.notifyBossImmune(g, "MIỄN NHIỄM CHOÁNG") : g.stunTimer = Math.max(g.stunTimer, 0.5)), this.player.dashKind === "tin_c1" && hadMark && !this.player.tin_c1_refunded_c2 && (this.player.tin_c1_refunded_c2 = true, this.player.cooldowns[1] = 0, this.grantTinResonance(1, false), this.addFloatingText(this.player.x, this.player.y - 34, "⚡ PHÁ ẤN HỒI C2!", "#FB7185", 15));
        }
      }
      if (this.player.dashTimer <= 0) {
        let g = this.player.dashKind;
        if (this.player.dashActive = false, this.player.dashKind = "none", g === "gau_c3_leap" && this.player.gau_c3_pendingImpact) {
          let p = this.player.gau_c3_pendingImpact;
          this.player.gau_c3_pendingImpact = null, this.player.gau_landBounceTimer = 0.28, this.player.x = Math.max(this.player.radius + 14, Math.min(Se - this.player.radius - 14, p.targetX)), this.player.y = Math.max(this.player.radius + 14, Math.min(Ce - this.player.radius - 14, p.targetY)), R.playEarthSlam(), this.addShake(16, 0.4), this.createCataclysmicExplosion(this.player.x, this.player.y, p.radius, "#F59E0B"), this.queueVfx("explosion", { x: this.player.x, y: this.player.y, radius: p.radius, color: "#F59E0B" }), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: p.radius * 1.12, spread: Math.PI * 2, color: "#FBBF24", life: 0, maxLife: 0.4, kind: "gau_shockring", heavy: true }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: p.radius * 1.12, spread: Math.PI * 2, color: "#FBBF24", maxLife: 0.4, kind: "gau_shockring", heavy: true }), this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: p.radius * 0.72, spread: Math.PI * 2, color: "#FEF08A", life: 0, maxLife: 0.28, kind: "shockwave" }), this.queueVfx("slash", { x: this.player.x, y: this.player.y, angle: 0, radius: p.radius * 0.72, spread: Math.PI * 2, color: "#FEF08A", maxLife: 0.28, kind: "shockwave" });
          for (let v = 0; v < 4; v++) this.spawnGroundCrack(this.player.x, this.player.y, Math.PI / 2 * v + 0.3, p.radius * 0.78, "#D97706", "#FEF08A"), this.queueVfx("crack", { x: this.player.x, y: this.player.y, angle: Math.PI / 2 * v + 0.3, len: p.radius * 0.78, color: "#D97706", glowColor: "#FEF08A" });
          let h = 0;
          for (let v of [...this.enemies]) Math.hypot(v.x - this.player.x, v.y - this.player.y) <= p.radius + v.radius && (h++, this.isBossImmune(v) || (v.stunTimer = Math.max(v.stunTimer, 0.55), v.gau_quakeTimer = 6), this.damageEnemy(v, p.dmg, 0, 0, true));
          let f = this.getEffectiveDamage();
          if (this.zones.push({ id: this.nextEntityId++, kind: "gau_tremor", x: this.player.x, y: this.player.y, radius: p.radius * 0.9, timer: 0, duration: 3, tickTimer: 0, tickInterval: 0.6, damagePerTick: Math.round(25 + 0.25 * f), slowFactor: 0.3, rotation: 0 }), this.queueVfx("zone_vis", { kind: "gau_tremor", x: this.player.x, y: this.player.y, radius: p.radius * 0.9, duration: 3 }), h > 0) {
            this.grantGauRage(12);
            let gh = Math.round(this.player.maxHp * 0.08);
            this.healPlayer(gh, "HEAL", `+${gh} HP (GI\xC1NG L\xC2M)`);
          }
          this.comboManager.record({ heroId: "gau", action: "c3", hitCount: h, empowered: this.player.gau_cuongHungTimer > 0, damageDealt: p.dmg * Math.max(1, h) });
        }
      }
      this.player.moveSpeedFactor = 1, this.player.walkCyclePhase = (this.player.walkCyclePhase || 0) + a * 18;
    } else if (this.player.stunTimer <= 0 && this.player.rootTimer <= 0) {
      let m = this.moveInput.x, c = this.moveInput.y;
      if (m === 0 && c === 0 && this.tapDestination) {
        let p = this.tapDestination.x - this.player.x, h = this.tapDestination.y - this.player.y, f = Math.hypot(p, h);
        f > 14 ? (m = p / f, c = h / f) : this.tapDestination = null;
      }
      let g = Math.hypot(m, c);
      if (g > 0.05) {
        let p = m / Math.max(1, g), h = c / Math.max(1, g), f = this.getEffectiveMoveSpeed() * Math.min(1, g), v = p * f * a, T = h * f * a;
        this.player.x += v, this.player.y += T, this.player.facing = Math.atan2(h, p);
        this.player.moveSpeedFactor = Math.min(1, g), this.player.walkCyclePhase = (this.player.walkCyclePhase || 0) + a * 13 * this.player.moveSpeedFactor;
      } else {
        this.player.moveSpeedFactor = Math.max(0, (this.player.moveSpeedFactor || 0) - a * 8);
      }
    } else {
      this.player.moveSpeedFactor = Math.max(0, (this.player.moveSpeedFactor || 0) - a * 8);
    }
    if (this.currentHero.id === "tin" && this.tinCrystals.length > 0) for (let m = this.tinCrystals.length - 1; m >= 0; m--) {
      let c = this.tinCrystals[m];
      c.life += a, c.pulse += a * 6;
      let g = c.radius + this.player.radius + 32;
      if (!c.visualOnly && this.player.dashActive && this.player.dashKind === "tin_c1" && Math.hypot(this.player.x - c.x, this.player.y - c.y) <= g) {
        let crystalHeal = Math.max(160, Math.round(this.player.maxHp * 0.22));
        this.player.cooldowns[0] = 0, this.player.cooldowns[1] = 0, this.player.tin_c1_charges = 0, this.grantTinResonance(1, true), this.healPlayer(crystalHeal, "HEAL", `+${crystalHeal} HP (TINH TH\u1EC2 \u0110\u1ECE)`) === 0 ? this.addFloatingText(c.x, c.y - 22, `+${crystalHeal} HP \xB7 H\u1ED2I C1 & C2!`, "#FB7185", 15) : this.addFloatingText(c.x, c.y - 36, "\u26A1 H\u1ED2I NGAY C1 & C2!", "#F43F5E", 15), this.spawnRedCrystals(c.x, c.y, 14, 70, 210), this.spawnSpatialTear(c.x - 40, c.y - 40, c.x + 40, c.y + 40, "#F43F5E", 10), this.queueVfx("tin_crystal_pop_vis", { x: c.x, y: c.y }), R.playLevelUp(), this.tinCrystals.splice(m, 1);
      } else c.life >= c.maxLife && this.tinCrystals.splice(m, 1);
    }
    else if (this.tinCrystals.length > 0) for (let m = this.tinCrystals.length - 1; m >= 0; m--) this.tinCrystals[m].life += a, this.tinCrystals[m].pulse += a * 6, this.tinCrystals[m].life >= this.tinCrystals[m].maxLife && this.tinCrystals.splice(m, 1);
    this.player.x = Math.max(this.player.radius + 14, Math.min(Se - this.player.radius - 14, this.player.x)), this.player.y = Math.max(this.player.radius + 14, Math.min(Ce - this.player.radius - 14, this.player.y));
    let l = 1 - 1e-3 ** a;
    this.camera.x += (this.player.x - this.camera.x) * l, this.camera.y += (this.player.y - this.camera.y) * l, this.isCoopHost() && !this.waitingReward && !this.waveCleared && this.waveSpawned < this.waveTotal && (this.spawnTimer -= a, this.spawnTimer <= 0 && (this.spawnEnemy(), this.spawnTimer = Math.max(0.45, 1.45 - this.wave * 0.06))), this.updateProjectiles(a), this.updateZones(a), this.updateFrostBarrages(a), this.updateIcePillars(a), this.updateLavaPools(a), this.updateBossWarnings(a), this.updateBossBeams(a), this.updateBossShockRings(a), this.updateEnemies(a), this.updateVFX(a);
    for (let m = this.xpOrbs.length - 1; m >= 0; m--) {
      let c = this.xpOrbs[m];
      c.pulse += a * 5;
      let g = this.player.x - c.x, p = this.player.y - c.y, h = Math.hypot(g, p);
      if (h < 185) {
        let f = 360 * (1 - h / 220);
        c.x += g / (h || 1) * f * a, c.y += p / (h || 1) * f * a;
      }
      h < this.player.radius + c.radius + 8 && (this.grantXp(c.value), this.xpOrbs.splice(m, 1));
    }
    this.enemies = this.enemies.filter((m) => m.hp > 0);
    if (this.multiplayer.active) {
      this.multiplayer.reviveSendCooldown > 0 && (this.multiplayer.reviveSendCooldown = Math.max(0, this.multiplayer.reviveSendCooldown - a));
      let revTarget = null, bestRevDist = 95;
      if (!this.multiplayer.localDowned && this.player.hp > 0) {
        for (let rp of this.multiplayer.remotePlayers.values()) {
          if (!rp || (rp.alive && rp.hp > 0)) continue;
          let d = Math.hypot(rp.x - this.player.x, rp.y - this.player.y);
          if (d <= bestRevDist) bestRevDist = d, revTarget = rp;
        }
      }
      if (revTarget) {
        if (this.multiplayer.reviveTargetId !== revTarget.id) {
          this.multiplayer.reviveTargetId = revTarget.id;
          this.multiplayer.reviveProgress = 0;
        }
        this.multiplayer.reviveProgress = Math.min(1, (this.multiplayer.reviveProgress || 0) + a / 2.4);
        if (this.multiplayer.reviveProgress >= 1 && this.multiplayer.reviveSendCooldown <= 0 && mpClient.isConnected()) {
          mpClient.send({ type: "REVIVE_PLAYER", targetPlayerId: revTarget.id });
          this.multiplayer.reviveSendCooldown = 1.0;
        }
      } else {
        this.multiplayer.reviveTargetId = null;
        this.multiplayer.reviveProgress = 0;
      }
      this.syncMultiplayerState(a);
    } else {
      !this.waitingReward && !this.waveCleared && this.waveSpawned >= this.waveTotal && this.enemies.length === 0 && this.handleWaveCompleted();
    }
  }
  handleWaveCompleted(serverReward = null) {
    if (this.multiplayer.active && !serverReward) return;
    this.waveCleared = true, this.waitingReward = true;
    if (serverReward) {
      let earned = serverReward.totalEarned || 0;
      this.waveRewardClaimed || (this.waveRewardClaimed = true, this.playerCoins += earned, this.wave > this.highestWaveCleared && (this.highestWaveCleared = this.wave), this.saveGame(), R.playFanfare());
      this.onWaveReward && this.onWaveReward({ ...serverReward, currentBalance: this.playerCoins });
      return;
    }
    let s = 100 + 100 * (this.wave - 1), a = Cf[this.wave] || 35, l = 0, m = "B\xECnh th\u01B0\u1EDDng", c = "speed-normal";
    this.waveElapsedTime <= a * 0.6 ? (l = 40, m = "R\u1EA5t nhanh \xB7 +40 Xu", c = "speed-super") : this.waveElapsedTime <= a * 0.85 ? (l = 30, m = "Nhanh \xB7 +30 Xu", c = "speed-fast") : this.waveElapsedTime <= a ? (l = 20, m = "Kh\xE1 nhanh \xB7 +20 Xu", c = "speed-fair") : this.waveElapsedTime <= a * 1.35 ? (l = 10, m = "B\xECnh th\u01B0\u1EDDng \xB7 +10 Xu", c = "speed-normal") : (l = 0, m = "Ch\u1EADm \xB7 +0 Xu", c = "speed-slow");
    let g = 0;
    BOSS_WAVES.includes(this.wave) && (g = _f[this.wave] || 160);
    let p = s + l + g;
    this.waveRewardClaimed || (this.waveRewardClaimed = true, this.playerCoins += p, this.wave > this.highestWaveCleared && (this.highestWaveCleared = this.wave), this.saveGame(), R.playFanfare());
    let h = Math.floor(this.waveElapsedTime / 60), f = Math.floor(this.waveElapsedTime % 60), v = Math.floor(a / 60), T = Math.floor(a % 60);
    this.onWaveReward && this.onWaveReward({ wave: this.wave, baseCoins: s, speedCoins: l, bossCoins: g, totalEarned: p, currentBalance: this.playerCoins, speedText: m, speedClass: c, elapsedFormatted: `${h.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`, targetFormatted: `${v.toString().padStart(2, "0")}:${T.toString().padStart(2, "0")}`, kills: this.waveKilled, isFinalWave: this.wave >= MAX_WAVES });
  }
  updateProjectiles(s) {
    for (let a = this.projectiles.length - 1; a >= 0; a--) {
      let l = this.projectiles[a], m = l.vx * s, c = l.vy * s;
      if (l.fromPlayer && l.kind === "duccong_push_orb") {
        l.timer = (l.timer || 0) + s;
        if (!l.visualOnly) {
          let spd = Math.hypot(l.vx, l.vy) || 1, nx = l.vx / spd, ny = l.vy / spd;
          for (let p of [...this.enemies]) if (p.hp > 0 && Math.hypot(p.x - l.x, p.y - l.y) <= l.radius + p.radius + 14) {
            p.x = Math.max(p.radius + 14, Math.min(Se - p.radius - 14, p.x + m + nx * 18 * s)), p.y = Math.max(p.radius + 14, Math.min(Ce - p.radius - 14, p.y + c + ny * 18 * s)), p.slowFactor = Math.max(p.slowFactor, 0.35), p.slowTimer = Math.max(p.slowTimer, 0.25), this.applyDucCongHitRefund(0, p.id, l.refundedEnemyIds);
          }
        } else {
          l.x += m, l.y += c;
        }
        Math.random() < 0.65 && this.spawnParticles(l.x, l.y, "#C084FC", 2, 20, 70, 2.8, 0.28);
        if (l.timer >= (l.duration || 3) || l.x <= 30 || l.x >= Se - 30 || l.y <= 30 || l.y >= Ce - 30) {
          let er = l.explodeRadius || 145;
          this.createCataclysmicExplosion(l.x, l.y, er, "#A855F7"), this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: er, spread: Math.PI * 2, color: "#C084FC", life: 0, maxLife: 0.35, kind: "shockwave" });
          if (!l.visualOnly) {
            for (let p of [...this.enemies]) Math.hypot(p.x - l.x, p.y - l.y) <= er + p.radius && this.damageEnemy(p, l.damage + (p.slowFactor > 0 || p.stunTimer > 0 || p.rootTimer > 0 ? l.ccBonusDmg || 0 : 0), 0, 0, true, 0, l);
          }
          this.projectiles.splice(a, 1);
        }
        continue;
      }
      if (l.fromPlayer && l.kind === "taidu_missile" && !l.visualOnly) {
        let tgt = l.targetId ? this.enemies.find((e) => e.id === l.targetId && e.hp > 0) : null;
        tgt || (tgt = this.findNearestEnemy(440, l.x, l.y));
        if (tgt) {
          l.targetId = tgt.id;
          let spd = Math.hypot(l.vx, l.vy) || 620, want = Math.atan2(tgt.y - l.y, tgt.x - l.x), cur = Math.atan2(l.vy, l.vx), diff = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)), turn = Math.max(-5.8 * s, Math.min(5.8 * s, diff));
          l.angle = cur + turn, l.vx = Math.cos(l.angle) * spd, l.vy = Math.sin(l.angle) * spd, m = l.vx * s, c = l.vy * s;
        }
      }
      if (l.x += m, l.y += c, l.distanceTraveled += Math.hypot(m, c), l.fromPlayer) {
        if (!l.visualOnly && (l.kind === "luan_orb" || l.kind === "luan_shard") && this.luanPortals.length > 0) {
          for (let pt of this.luanPortals) {
            if (l.passedPortalIds?.has(pt.id)) continue;
            if (Math.hypot(l.x - pt.x, l.y - pt.y) <= pt.radius + l.radius) {
              let allIds = new Set(this.luanPortals.map((pItem) => pItem.id));
              l.passedPortalIds = allIds;
              let tx = computeLuanPortalBeamTransform({ baseDamage: l.damage, baseRange: l.maxDistance, portalCount: this.luanPortals.length, passThroughCount: 1 });
              l.damage = tx.damage, l.maxDistance = tx.range, l.portalBoosted = true;
              this.slashes.push({ x: pt.x, y: pt.y, angle: 0, radius: pt.radius * 1.45, spread: Math.PI * 2, color: "#67E8F9", life: 0, maxLife: 0.3, kind: "luan_portal_wave" });
              this.spawnParticles(pt.x, pt.y, "#67E8F9", 8, 35, 130, 2.8, 0.3);
              R.playCosmic();
              let spd = Math.hypot(l.vx, l.vy) || 640, otherPortals = this.luanPortals.filter((pItem) => pItem.id !== pt.id);
              for (let k = 0; k < tx.splitStreams - 1; k++) {
                let emitPt = otherPortals.length > 0 ? otherPortals[k % otherPortals.length] : pt;
                let near = this.findNearestEnemy(tx.range, emitPt.x, emitPt.y);
                let bAng = emitPt.id !== pt.id && near ? Math.atan2(near.y - emitPt.y, near.x - emitPt.x) : l.angle + (k === 0 ? -0.24 : 0.24);
                this.projectiles.push({ id: this.nextEntityId++, fromPlayer: true, kind: l.kind, x: emitPt.x, y: emitPt.y, vx: Math.cos(bAng) * spd, vy: Math.sin(bAng) * spd, radius: l.radius, damage: tx.damage, color: "#67E8F9", angle: bAng, distanceTraveled: 0, maxDistance: tx.range, pierceLeft: l.pierceLeft, portalBoosted: true, passedPortalIds: allIds, hitIds: new Set(l.hitIds) });
                this.queueVfx("proj_vis", { kind: l.kind, portalBoosted: true, x: emitPt.x, y: emitPt.y, vx: Math.cos(bAng) * spd, vy: Math.sin(bAng) * spd, radius: l.radius, color: "#67E8F9", angle: bAng, maxDistance: tx.range, pierceLeft: l.pierceLeft });
              }
              break;
            }
          }
        }
        let g = false;
        for (let p of [...this.enemies]) if (!l.hitIds.has(p.id) && Math.hypot(p.x - l.x, p.y - l.y) <= l.radius + p.radius) {
          if (l.hitIds.add(p.id), l.visualOnly) {
            if (l.kind === "energy_orb") {
              this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: l.aoeRadius || 120, spread: Math.PI * 2, color: "#818CF8", life: 0, maxLife: 0.35, kind: "shockwave" }), this.spawnFlameParticles(l.x, l.y, "blue", 12, 40, 120);
              g = true;
              break;
            }
            if (l.kind === "taidu_missile") {
              this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: l.aoeRadius || 84, spread: Math.PI * 2, color: "#F97316", accentColor: "#FEF08A", life: 0, maxLife: 0.3, kind: "taidu_hex_blast" }), this.spawnFlameParticles(l.x, l.y, "red", 6, 30, 100);
              g = true;
              break;
            }
            if (l.pierceLeft--, l.pierceLeft <= 0) {
              g = true;
              break;
            }
            continue;
          }
          if (l.kind === "energy_orb") {
            R.playIceShatter(); R.playExplosion();
            let h = l.aoeRadius || 120;
            this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: h, spread: Math.PI * 2, color: "#818CF8", life: 0, maxLife: 0.35, kind: "shockwave" }), this.spawnFlameParticles(l.x, l.y, "blue", 12, 40, 120);
            for (let f of [...this.enemies]) Math.hypot(f.x - l.x, f.y - l.y) <= h + f.radius && (this.damageEnemy(f, l.damage, 0, 0, true), l.slowFactor && (this.isBossImmune(f) ? this.notifyBossImmune(f, "MI\u1EC4N NHI\u1EC4M L\xC0M CH\u1EACM") : (f.slowFactor = Math.max(f.slowFactor, l.slowFactor), f.slowTimer = Math.max(f.slowTimer, 2.5))));
            g = true;
            break;
          }
          if (l.isWhirlwindArrow) {
            let h = Math.atan2(l.vy, l.vx);
            if (this.damageEnemy(p, l.damage, Math.cos(h) * 35, Math.sin(h) * 35, true), this.isBossImmune(p) ? this.notifyBossImmune(p, "MI\u1EC4N NHI\u1EC4M L\xC0M CH\u1EACM") : (p.slowFactor = Math.max(p.slowFactor, 0.35), p.slowTimer = Math.max(p.slowTimer, 1.5)), this.spawnParticles(p.x, p.y, "#34D399", 6, 40, 100, 2.5, 0.25), !l.hasHealed) {
              l.hasHealed = true;
              let kh = Math.round(this.player.maxHp * 0.03);
              this.healPlayer(kh, "HEAL", `+${kh} HP (L\u1ED0C XO\xC1Y)`);
            }
          } else {
            let h = l.damage;
            if (l.bonusFirstDmg && l.hitIds.size === 1 && (h += l.bonusFirstDmg), (l.kind === "longhoi_arrow" || l.kind === "fox_arrow")) {
              if (this.isBossImmune(p)) {
                p.longhoiBurnStacks = 0, p.longhoiBurnTimer = 0, p.longhoiBurnAmpTimer = 0, this.notifyBossImmune(p, "MIỄN NHIỄM THIÊU ĐỐT");
              } else {
                let effDmg = this.getEffectiveDamage();
                let res = computeLongHoiBurnApplication({
                  currentStacks: p.longhoiBurnStacks || 0,
                  wasBurning: (p.longhoiBurnTimer || 0) > 0,
                  currentAmpTimer: p.longhoiBurnAmpTimer || 0,
                  stacksToAdd: l.kind === "fox_arrow" ? 2 : 1,
                  effectiveDamage: effDmg
                });
                p.longhoiBurnStacks = res.newStacks;
                p.longhoiBurnTimer = res.newBurnTimer;
                p.longhoiBurnAmpTimer = res.newBurnAmpTimer;
                p.longhoiBurnEffDmg = effDmg;
                this.addFloatingText(p.x, p.y - 18, `🔥 THIÊU ĐỐT x${p.longhoiBurnStacks}`, "#EA580C", 12);
                this.spawnFlameParticles(p.x, p.y, "red", 4, 30, 80);
                if (res.detonationsTriggered > 0 && res.detonationDamage > 0) {
                  R.playFire(0.28, 0.22);
                  this.slashes.push({ x: p.x, y: p.y, angle: 0, radius: 90, spread: Math.PI * 2, color: "#F97316", life: 0, maxLife: 0.26, kind: "shockwave" });
                  this.queueVfx("slash", { x: p.x, y: p.y, angle: 0, radius: 90, spread: Math.PI * 2, color: "#F97316", maxLife: 0.26, kind: "shockwave" });
                  this.spawnFlameParticles(p.x, p.y, "red", 12, 45, 140);
                  this.queueVfx("particles", { x: p.x, y: p.y, flame: true, flameColor: "red", count: 12, minSpd: 45, maxSpd: 140 });
                  this.addFloatingText(p.x, p.y - 34, `💥 HỎA BỘC PHÁT +${res.detonationDamage}!`, "#FEF08A", 15);
                  this.damageEnemy(p, res.detonationDamage, 0, 0, true);
                  for (let f of [...this.enemies]) {
                    if (f !== p && Math.hypot(f.x - p.x, f.y - p.y) <= 90 + f.radius) {
                      this.damageEnemy(f, Math.round(res.detonationDamage * 0.75), 0, 0, true);
                      if (!this.isBossImmune(f)) {
                        f.longhoiBurnStacks = Math.min(100, (f.longhoiBurnStacks || 0) + 2);
                        f.longhoiBurnTimer = Math.max(f.longhoiBurnTimer || 0, 3);
                        f.longhoiBurnEffDmg = effDmg;
                      }
                    }
                  }
                }
              }
              if (!l.hasLifestolen && p.hp > 0 && this.currentHero.id === "longhoi") {
                l.hasLifestolen = true;
                let f = Math.min(p.hp, h);
                if (f > 0) {
                  let v = this.getHeroGearStats("longhoi"), T = f * (Math.random() < v.crit ? 0.045 : 0.03), b = this.player.maxHp * 0.03, x = Math.max(0, b - this.player.longhoi_sustain_pool), C = Math.min(T, x);
                  C > 0 && (this.player.longhoi_sustain_pool += C, this.healPlayer(C, "LIFESTEAL", `+${Math.round(C)} HÚT MÁU`));
                }
              }
            }
            if (l.kind === "taidu_missile") {
              R.playExplosion();
              let mr = l.aoeRadius || 84;
              this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: mr, spread: Math.PI * 2, color: "#F97316", accentColor: "#FEF08A", life: 0, maxLife: 0.32, kind: "taidu_hex_blast" }), this.queueVfx("slash", { x: l.x, y: l.y, angle: 0, radius: mr, spread: Math.PI * 2, color: "#F97316", accentColor: "#FEF08A", maxLife: 0.32, kind: "taidu_hex_blast" }), this.spawnFlameParticles(l.x, l.y, "red", 8, 35, 115), this.spawnParticles(l.x, l.y, "#38BDF8", 6, 30, 110, 2.5, 0.28);
              for (let f of [...this.enemies]) Math.hypot(f.x - l.x, f.y - l.y) <= mr + f.radius && this.damageEnemy(f, l.damage, 0, 0, true);
              g = true;
              break;
            }
            l.kind === "danh_kiem_khi" ? (this.damageEnemy(p, h, Math.cos(l.angle) * 14, Math.sin(l.angle) * 14, true), this.spawnFlameParticles(p.x, p.y, "red", 4, 30, 80)) : l.kind === "cosmic_pursuit" && this.currentHero.id === "duccong" ? (l.ccBonusDmg && (p.slowFactor > 0 || p.stunTimer > 0) && (h += l.ccBonusDmg), this.damageEnemy(p, h, 0, 0, true, 0, l)) : this.damageEnemy(p, h, 0, 0, l.kind !== "kin_arrow" && l.kind !== "longhoi_arrow" && l.kind !== "trung_orb" && l.kind !== "taidu_bolt" && l.kind !== "nguyen_bolt");
          }
          if (l.pierceLeft--, l.pierceLeft <= 0) {
            g = true;
            break;
          }
        }
        if (!g && (l.distanceTraveled >= l.maxDistance || l.kind === "tin_crystal_throw" && (l.x <= 36 || l.x >= 1964 || l.y <= 36 || l.y >= 1364)) && (g = true), g) {
          if (l.kind === "tin_crystal_throw" && !l.visualOnly) {
            let p = Math.max(40, Math.min(Se - 40, l.x)), h = Math.max(40, Math.min(Ce - 40, l.y));
            this.tinCrystals.push({ id: this.nextEntityId++, x: p, y: h, radius: 44, life: 0, maxLife: 3.75, pulse: 0 }), this.queueVfx("tin_crystal_vis", { x: p, y: h, radius: 44, maxLife: 3.75 }), this.spawnRedCrystals(p, h, 10, 50, 160), this.spawnGroundCrack(p, h, l.angle, 44, "#E11D48", "#FDA4AF"), this.queueVfx("crack", { x: p, y: h, angle: l.angle, len: 44, color: "#E11D48", glowColor: "#FDA4AF" }), R.playTone(520, 920, 0.14, "triangle", 0.22);
          } else if (l.kind === "taidu_missile" && !l.visualOnly && l.hitIds.size === 0) {
            R.playExplosion();
            let mr = l.aoeRadius || 84;
            this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: mr, spread: Math.PI * 2, color: "#F97316", accentColor: "#FEF08A", life: 0, maxLife: 0.32, kind: "taidu_hex_blast" }), this.queueVfx("slash", { x: l.x, y: l.y, angle: 0, radius: mr, spread: Math.PI * 2, color: "#F97316", accentColor: "#FEF08A", maxLife: 0.32, kind: "taidu_hex_blast" }), this.spawnFlameParticles(l.x, l.y, "red", 8, 35, 115);
            for (let f of [...this.enemies]) Math.hypot(f.x - l.x, f.y - l.y) <= mr + f.radius && this.damageEnemy(f, l.damage, 0, 0, true);
          }
          this.projectiles.splice(a, 1);
        }
      } else {
        if (l.life = (l.life || 0) + s, l.isHoming) {
          let g = Math.hypot(l.vx, l.vy) || 220, p = Math.atan2(this.player.y - l.y, this.player.x - l.x), h = Math.atan2(l.vy, l.vx), f = Math.atan2(Math.sin(p - h), Math.cos(p - h)), v = 2 * s;
          f = Math.max(-v, Math.min(v, f));
          let T = h + f;
          l.vx = Math.cos(T) * g, l.vy = Math.sin(T) * g, l.angle = T;
        }
        if (Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius) {
          this.damagePlayer(l.damage), l.ccType && this.applyPlayerCC(l.ccType, l.ccDur || 1.2, l.ccFactor || 0.45, l.x, l.y), l.kind !== "enemy_orb" && (this.spawnParticles(l.x, l.y, l.color, 10, 45, 160, 3.5, 0.35), this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: 48, spread: Math.PI * 2, color: l.color, life: 0, maxLife: 0.24, kind: "shockwave" })), this.projectiles.splice(a, 1);
          continue;
        }
        (l.distanceTraveled >= (l.maxDistance || 500) || l.x < -100 || l.x > 2100 || l.y < -100 || l.y > 1500) && this.projectiles.splice(a, 1);
      }
    }
  }
  updateZones(s) {
    for (let a = this.zones.length - 1; a >= 0; a--) {
      let l = this.zones[a];
      if (l.timer += s, l.tickTimer += s, l.rotation += s * 1.5, !l.visualOnly && l.kind === "arrow_rain") for (let m of this.enemies) {
        if (m.kind === "boss" || m.hp <= 0) continue;
        let c = l.x - m.x, g = l.y - m.y, p = Math.hypot(c, g);
        if (p > 8 && p <= l.radius + 35) {
          let h = 50 * (1 - p / (l.radius + 45));
          m.x += c / p * h * s, m.y += g / p * h * s;
        }
      }
      if (l.kind === "blizzard_vortex") {
        let m = this.player.x - l.x, c = this.player.y - l.y, g = Math.hypot(m, c) || 1;
        g > 14 && (l.x += m / g * 44 * s, l.y += c / g * 44 * s);
      }
      if (!l.visualOnly && l.kind === "trung_thunder_zone") {
        l.exposureMap = l.exposureMap || {};
        for (let m of this.enemies) {
          if (m.hp <= 0) continue;
          Math.hypot(m.x - l.x, m.y - l.y) <= l.radius + m.radius ? !(m.stunTimer > 0) && (l.exposureMap[m.id] = (l.exposureMap[m.id] || 0) + s, l.exposureMap[m.id] >= 0.75 && (l.exposureMap[m.id] = 0, m.stunTimer = Math.max(m.stunTimer || 0, 2), this.createBranchingLightning(l.x, l.y, m.x, m.y, "#FDE047", 3.2), this.queueVfx("lightning", { x1: l.x, y1: l.y, x2: m.x, y2: m.y, color: "#FDE047", width: 3.2 }), this.addFloatingText(m.x, m.y - m.radius - 18, "⚡ CHOÁNG 2.0s!", "#FDE047", 14))) : l.exposureMap[m.id] = 0;
        }
      }
      if (l.tickTimer >= l.tickInterval) {
        l.tickTimer -= l.tickInterval;
        l.kind === "blizzard_vortex" && Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius && (this.damagePlayer(l.damagePerTick), this.applyPlayerCC("slow", l.ccDur || 1.4, 0.55, l.x, l.y));
        l.kind === "acid_pool" && Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius && (this.damagePlayer(l.damagePerTick), this.applyPlayerCC("slow", Math.min(2.6, l.ccDur || 1.2), 0.45, l.x, l.y));
        if (l.kind === "blood_sanctuary") {
          Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius && (this.damagePlayer(l.damagePerTick), this.applyPlayerCC("slow", Math.min(2.6, l.ccDur || 1.2), 0.35, l.x, l.y));
          if (this.isCoopHost() && !l.visualOnly) {
            for (let m of this.enemies) if (m.kind === "boss" && m.hp > 0 && m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + Math.round(l.damagePerTick * 1.5));
          }
        }
        if (!l.visualOnly && l.kind !== "blizzard_vortex" && l.kind !== "acid_pool" && l.kind !== "blood_sanctuary") {
          for (let m of [...this.enemies]) Math.hypot(m.x - l.x, m.y - l.y) <= l.radius + m.radius && (l.slowFactor && (this.isBossImmune(m) ? this.notifyBossImmune(m, "MI\u1EC4N NHI\u1EC4M L\xC0M CH\u1EACM") : (m.slowFactor = Math.max(m.slowFactor, l.slowFactor), m.slowTimer = Math.max(m.slowTimer, 0.7))), l.kind === "fox_king_rain" ? (l.hitCountMap = l.hitCountMap || {}, l.hitCountMap[m.id] = (l.hitCountMap[m.id] || 0) + 1, l.hitCountMap[m.id] <= (l.maxTicksPerTarget || 6) && this.damageEnemy(m, l.damagePerTick, 0, 0, true)) : this.damageEnemy(m, l.damagePerTick, 0, 0, true));
        }
      }
      l.timer >= l.duration && this.zones.splice(a, 1);
    }
  }
  updateFrostBarrages(s) {
    for (let a = this.frostBarrages.length - 1; a >= 0; a--) {
      let l = this.frostBarrages[a];
      l.timer += s, l.tickTimer += s;
      if (!l.visualOnly) {
        for (let m of [...this.enemies]) m.hp <= 0 || Math.hypot(m.x - l.x, m.y - l.y) <= l.radius + m.radius && (this.isBossImmune(m) ? (m.frostUltExposeTimer = 0, m.frozenTimer = 0, this.notifyBossImmune(m, "MI\u1EC4N NHI\u1EC4M \u0110\xD3NG B\u0102NG")) : (m.slowFactor = Math.max(m.slowFactor, 0.6), m.slowTimer = Math.max(m.slowTimer, 1.8), (!m.frozenTimer || m.frozenTimer <= 0) && (m.frostUltExposeTimer = (m.frostUltExposeTimer || 0) + s, m.frostUltExposeTimer >= 2 && (m.frostUltExposeTimer = 0, m.frozenTimer = 3, this.createFrostExplosion(m.x, m.y, m.kind === "boss" ? m.radius * 1.9 : 65), this.addFloatingText(m.x, m.y - m.radius - 20, "\u2744\uFE0F \u0110\xD3NG B\u0102NG 3s!", "#E0F2FE", m.kind === "boss" ? 18 : 15)))));
      }
      if (l.tickTimer >= l.interval && l.iciclesFired < l.totalIcicles) {
        l.tickTimer -= l.interval, l.iciclesFired++;
        let m = Math.random() * Math.PI * 2, c = Math.random() * l.radius, g = l.x + Math.cos(m) * c, p = l.y + Math.sin(m) * c;
        this.spawnParticles(g, p, "#BAE6FD", 4, 30, 90, 2.5, 0.25);
        if (!l.visualOnly) {
          for (let h of [...this.enemies]) Math.hypot(h.x - g, h.y - p) <= 45 + h.radius && (this.damageEnemy(h, l.damagePerHit, 0, 0, true), this.isBossImmune(h) || (h.slowFactor = Math.max(h.slowFactor, 0.6), h.slowTimer = Math.max(h.slowTimer, 1.8)));
        }
      }
      l.timer >= l.duration && (this.createCataclysmicExplosion(l.x, l.y, l.radius * 0.9, "#38BDF8"), this.frostBarrages.splice(a, 1));
    }
  }
  updateIcePillars(s) {
    for (let a = this.icePillars.length - 1; a >= 0; a--) {
      let l = this.icePillars[a];
      if (l.visualOnly && l.state === "planted") {
        l.life = (l.life || 0) + s;
        if (l.life >= (l.maxLife || 18)) {
          this.icePillars.splice(a, 1);
          continue;
        }
      }
      if (l.animTimer += s, l.state === "plunging") l.plungeOffset = Math.max(0, l.plungeOffset - s * 550), l.plungeOffset === 0 && (l.state = "planted", this.createFrostExplosion(l.x, l.y, 45), this.spawnGroundCrack(l.x, l.y, Math.random() * Math.PI * 2, 35, "#38BDF8", "#E0F2FE"));
      else if (l.state === "rising") l.riseProgress = Math.min(1, l.riseProgress + s * 3.8), l.riseProgress >= 1 && (l.state = "planted", this.spawnParticles(l.x, l.y, "#BAE6FD", 6, 20, 60, 2, 0.2));
      else if (l.state === "levitating") {
        if (l.levitateHeight = Math.min(60, l.levitateHeight + s * 130), l.levitateTarget && (l.rot = Math.atan2(l.levitateTarget.y - l.y, l.levitateTarget.x - l.x)), l.animTimer >= l.maxAnimTimer && (l.state = "launching", l.levitateTarget)) {
          let m = l.levitateTarget.x - l.x, c = l.levitateTarget.y - l.y, g = Math.hypot(m, c) || 1;
          l.launchVx = m / g * 720, l.launchVy = c / g * 720;
        }
      } else if (l.state === "launching" && l.launchVx !== void 0 && l.launchVy !== void 0 && l.levitateTarget && (l.x += l.launchVx * s, l.y += l.launchVy * s, l.levitateHeight = Math.max(8, l.levitateHeight - s * 50), Math.random() < 0.65 && this.spawnParticles(l.x, l.y - l.levitateHeight, "#BAE6FD", 3, 20, 60, 2.5, 0.25), Math.hypot(l.levitateTarget.x - l.x, l.levitateTarget.y - l.y) <= 35)) {
        this.createFrostExplosion(l.x, l.y, 75);
        if (!l.visualOnly) {
          for (let m of this.enemies) Math.hypot(m.x - l.x, m.y - l.y) <= 85 + m.radius && (this.damageEnemy(m, l.levitateTarget.dmg, 0, 0, true), this.isBossImmune(m) || (m.slowFactor = Math.max(m.slowFactor, 0.4), m.slowTimer = Math.max(m.slowTimer, 2)));
        }
        this.icePillars.splice(a, 1);
      }
    }
  }
  updateLavaPools(s) {
    for (let a = this.lavaPools.length - 1; a >= 0; a--) {
      let l = this.lavaPools[a];
      if (l.timer += s, l.tickTimer += s, l.tickTimer >= l.tickInterval) {
        l.tickTimer -= l.tickInterval;
        if (!l.visualOnly) {
          for (let m of [...this.enemies]) Math.hypot(m.x - l.x, m.y - l.y) <= l.radius + m.radius && (this.damageEnemy(m, l.damagePerTick, 0, 0, true), this.spawnFlameParticles(m.x, m.y, "red", 2, 20, 60));
        }
      }
      l.timer >= l.duration && this.lavaPools.splice(a, 1);
    }
  }
  updateBossWarnings(s) {
    for (let a = this.bossWarnings.length - 1; a >= 0; a--) {
      let l = this.bossWarnings[a];
      if (l.timer += s, l.timer >= l.duration) {
        R.playExplosion(), this.addShake(12, 0.34);
        let m = l.color || "#EF4444";
        if (l.kind === "ice_prison") this.createFrostExplosion(l.x, l.y, l.radius * 1.15);
        else {
          this.createCataclysmicExplosion(l.x, l.y, l.radius, m), this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: l.radius * 1.25, spread: Math.PI * 2, color: m, life: 0, maxLife: 0.35, kind: "shockwave" });
          for (let c = 0; c < 3; c++) this.spawnGroundCrack(l.x, l.y, Math.PI * 2 / 3 * c + Math.random() * 0.6, l.radius * 0.85, m, "#FEF08A");
        }
        Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius * 0.75 && (this.damagePlayer(l.damage), l.ccType && this.applyPlayerCC(l.ccType, l.ccDur || 0.85, l.ccFactor || 0.5, l.x, l.y)), this.bossWarnings.splice(a, 1);
      }
    }
  }
  updateBossBeams(s) {
    for (let a = this.bossBeams.length - 1; a >= 0; a--) {
      let l = this.bossBeams[a];
      if (l.triggered) l.fadeTimer -= s, l.fadeTimer <= 0 && this.bossBeams.splice(a, 1);
      else if (l.timer += s, l.timer >= l.duration) {
        l.triggered = true, R.playLightning(), R.playExplosion(), this.addShake(16, 0.45), this.screenFlashWhite = Math.max(this.screenFlashWhite, 0.28);
        let m = l.x2 - l.x1, c = l.y2 - l.y1, g = Math.atan2(c, m);
        for (let T = 0; T < 4; T++) {
          let b = (T + 0.5) / 4, x = l.x1 + m * b, C = l.y1 + c * b;
          this.spawnGroundCrack(x, C, g + (Math.random() - 0.5) * 0.35, 90, l.color, l.glowColor), this.spawnFlameParticles(x, C, "red", 6, 40, 140);
        }
        let p = m * m + c * c || 1, h = Math.max(0, Math.min(1, ((this.player.x - l.x1) * m + (this.player.y - l.y1) * c) / p)), f = l.x1 + h * m, v = l.y1 + h * c;
        Math.hypot(this.player.x - f, this.player.y - v) <= l.width * 0.52 + this.player.radius * 0.8 && (this.damagePlayer(l.damage), l.ccType && this.applyPlayerCC(l.ccType, l.ccDur || 0.85, l.ccFactor || 0.5, f, v));
      }
    }
  }
  updateBossShockRings(s) {
    for (let a = this.bossShockRings.length - 1; a >= 0; a--) {
      let l = this.bossShockRings[a];
      if (l.currentRadius += l.speed * s, !l.hitPlayer) {
        let m = Math.hypot(this.player.x - l.x, this.player.y - l.y);
        Math.abs(m - l.currentRadius) <= l.ringWidth + this.player.radius * 0.7 && (l.hitPlayer = true, this.damagePlayer(l.damage), l.ccType && this.applyPlayerCC(l.ccType, l.ccDur || 1.4, l.ccFactor || 0.5, l.x, l.y));
      }
      l.currentRadius >= l.maxRadius && this.bossShockRings.splice(a, 1);
    }
  }
  updateEnemies(s) {
    for (let a of this.enemies) {
      if (a.hp <= 0) continue;
      a.hitFlash > 0 && (a.hitFlash = Math.max(0, a.hitFlash - s)), a.attackCooldown > 0 && (a.attackCooldown = Math.max(0, a.attackCooldown - s)), a.immuneTextCd && a.immuneTextCd > 0 && (a.immuneTextCd = Math.max(0, a.immuneTextCd - s)), a.luan_warpCd && a.luan_warpCd > 0 && (a.luan_warpCd = Math.max(0, a.luan_warpCd - s));
      let l = this.isBossImmune(a);
      if (l && (a.stunTimer = 0, a.slowTimer = 0, a.slowFactor = 0, a.frozenTimer = 0, a.frostUltExposeTimer = 0, a.eohyenAuraSlow = 0, a.tin_hasMark = false, a.tin_hits = 0, a.longhoiBurnStacks = 0, a.longhoiBurnTimer = 0, a.longhoiBurnAmpTimer = 0), a.slowTimer > 0 && (a.slowTimer = Math.max(0, a.slowTimer - s), a.slowTimer === 0 && (a.slowFactor = 0)), a.gau_quakeTimer && a.gau_quakeTimer > 0 && (a.gau_quakeTimer = Math.max(0, a.gau_quakeTimer - s)), a.bao_markTimer && a.bao_markTimer > 0 && (a.bao_markTimer = Math.max(0, a.bao_markTimer - s), a.bao_markTimer === 0 && (a.bao_marks = 0)), (a.longhoiBurnStacks || 0) > 0 && (a.longhoiBurnTimer || 0) > 0) {
        a.longhoiBurnTimer = Math.max(0, a.longhoiBurnTimer - s);
        a.longhoiBurnAmpTimer > 0 && (a.longhoiBurnAmpTimer = Math.max(0, a.longhoiBurnAmpTimer - s));
        a.longhoiBurnTick = (a.longhoiBurnTick || 0) + s;
        Math.random() < 0.22 && this.spawnFlameParticles(a.x, a.y, "red", 2, 20, 50);
        if (a.longhoiBurnTick >= 0.25) {
          a.longhoiBurnTick -= 0.25;
          let dps = computeLongHoiBurnDps({
            stacks: a.longhoiBurnStacks,
            targetCurrentHp: a.hp,
            effectiveDamage: a.longhoiBurnEffDmg || this.getEffectiveDamage(),
            isBoss: a.kind === "boss",
            burnAmpActive: (a.longhoiBurnAmpTimer || 0) > 0
          });
          let tickDmg = Math.max(1, Math.round(dps * 0.25));
          if (this.multiplayer.active) {
            this.isCoopHost() && (a.hp = Math.max(1, a.hp - tickDmg), this.multiplayer.burnSyncMap.set(a.id, (this.multiplayer.burnSyncMap.get(a.id) || 0) + tickDmg));
          } else {
            a.hp -= tickDmg, this.player.totalDamage += tickDmg;
          }
        }
        if (a.longhoiBurnTimer === 0) a.longhoiBurnStacks = 0, a.longhoiBurnAmpTimer = 0, a.longhoiBurnTick = 0;
        if (!this.multiplayer.active && a.hp <= 0) {
          this.handleEnemyKilled(a);
          continue;
        }
      }
      if (a.frozenTimer && a.frozenTimer > 0) {
        a.frozenTimer = Math.max(0, a.frozenTimer - s), Math.random() < 0.16 && this.spawnParticles(a.x + (Math.random() - 0.5) * a.radius, a.y - a.radius * 0.5, "#BAE6FD", 1, 12, 40, 2.5, 0.3);
        continue;
      }
      if (a.stunTimer > 0) {
        a.stunTimer = Math.max(0, a.stunTimer - s);
        continue;
      }
      if (!this.isCoopHost()) {
        if (typeof a.mpTargetX == "number" && typeof a.mpTargetY == "number") {
          let dist = Math.hypot(a.mpTargetX - a.x, a.mpTargetY - a.y);
          if (dist > 280) a.x = a.mpTargetX, a.y = a.mpTargetY;
          else {
            let lerp = 1 - Math.exp(-16 * s);
            a.x += (a.mpTargetX - a.x) * lerp, a.y += (a.mpTargetY - a.y) * lerp;
          }
        }
        let dLocal = Math.hypot(this.player.x - a.x, this.player.y - a.y);
        !l && this.currentHero.id === "eohyen" && !this.multiplayer.localDowned && this.player.hp > 0 && dLocal <= 320 && (a.eohyenAuraSlow = Math.max(a.eohyenAuraSlow || 0, 0.12 + Math.max(0, 1 - dLocal / 320) * 0.43));
        if (!this.multiplayer.localDowned && this.player.hp > 0 && a.kind !== "caster" && a.kind !== "frost_archer" && a.kind !== "void_acolyte" && a.kind !== "bomber" && !(this.currentHero.id === "bao" && this.player.bao_stealthTimer > 0 && a.kind !== "boss") && dLocal <= a.radius + this.player.radius + 8 && a.attackCooldown <= 0) {
          a.attackCooldown = a.kind === "boss" ? 1.15 : 0.95, this.damagePlayer(a.damage, a);
        }
        continue;
      }
      let target = this.getNearestAlivePlayer(a.x, a.y), m = target.x - a.x, c = target.y - a.y, g = Math.hypot(m, c) || 1;
      a.facing = Math.atan2(c, m);
      let p = 0;
      if (!l) {
        if (this.currentHero.id === "eohyen" && !this.multiplayer.localDowned && this.player.hp > 0) {
          let dSelf = Math.hypot(this.player.x - a.x, this.player.y - a.y);
          dSelf <= 320 && (p = Math.max(p, 0.12 + Math.max(0, 1 - dSelf / 320) * 0.43));
        }
        if (this.multiplayer.active) for (let rp of this.multiplayer.remotePlayers.values()) {
          if (rp && rp.alive && rp.hp > 0 && rp.heroId === "eohyen") {
            let dRp = Math.hypot(rp.x - a.x, rp.y - a.y);
            dRp <= 320 && (p = Math.max(p, 0.12 + Math.max(0, 1 - dRp / 320) * 0.43));
          }
        }
      }
      a.eohyenAuraSlow = p;
      let h = l ? 0 : Math.min(0.85, Math.max(a.slowFactor, p)), f = a.speed * (1 - h);
      let targetHiddenByBao = target.isLocal && this.currentHero.id === "bao" && this.player.bao_stealthTimer > 0 && a.kind !== "boss";
      if (!targetHiddenByBao) {
        if (a.kind === "caster") {
          g > 250 && (a.x += m / g * f * s, a.y += c / g * f * s);
          if (a.attackCooldown <= 0 && g < 390) {
            a.attackCooldown = 2.2;
            this.projectiles.push({ id: this.nextEntityId++, fromPlayer: false, kind: "enemy_orb", x: a.x, y: a.y, vx: m / g * 250, vy: c / g * 250, radius: 8, damage: a.damage, color: "#C084FC", angle: a.facing, distanceTraveled: 0, maxDistance: 440, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
            this.queueVfx("enemy_proj", { kind: "enemy_orb", x: a.x, y: a.y, vx: m / g * 250, vy: c / g * 250, radius: 8, damage: a.damage, color: "#C084FC", angle: a.facing, maxDistance: 440 });
          }
        } else if (a.kind === "frost_archer") {
          g > 280 && (a.x += m / g * f * s, a.y += c / g * f * s);
          g < 170 && (a.x -= m / g * f * 0.55 * s, a.y -= c / g * f * 0.55 * s);
          if (a.attackCooldown <= 0 && g < 430) {
            a.attackCooldown = 1.95;
            let vx = m / g * 315, vy = c / g * 315;
            this.projectiles.push({ id: this.nextEntityId++, fromPlayer: false, kind: "frost_bolt", x: a.x, y: a.y, vx, vy, radius: 8, damage: a.damage, color: "#38BDF8", angle: a.facing, distanceTraveled: 0, maxDistance: 470, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: 0.75, ccFactor: 0.3 });
            this.queueVfx("enemy_proj", { kind: "frost_bolt", x: a.x, y: a.y, vx, vy, radius: 8, damage: a.damage, color: "#38BDF8", angle: a.facing, maxDistance: 470, ccType: "slow", ccDur: 0.75, ccFactor: 0.3 });
          }
        } else if (a.kind === "bomber") {
          if (g > a.radius + target.radius + 10) {
            a.x += m / g * f * s, a.y += c / g * f * s;
          }
          if (g <= 92 || (a.fuseTimer || 0) > 0) {
            a.fuseTimer = (a.fuseTimer || 0) + s;
            if (a.fuseTimer >= 1.05) {
              let blastR = 105, blastDmg = Math.round(a.damage * 1.55);
              R.playExplosion();
              this.createCataclysmicExplosion(a.x, a.y, blastR, "#F97316");
              this.slashes.push({ x: a.x, y: a.y, angle: 0, radius: blastR, spread: Math.PI * 2, color: "#F97316", life: 0, maxLife: 0.3, kind: "shockwave" });
              this.queueVfx("slash", { x: a.x, y: a.y, angle: 0, radius: blastR, spread: Math.PI * 2, color: "#F97316", maxLife: 0.3, kind: "shockwave" });
              this.queueVfx("bomber_boom", { x: a.x, y: a.y, radius: blastR, dmg: blastDmg });
              if (!this.multiplayer.localDowned && this.player.hp > 0 && Math.hypot(this.player.x - a.x, this.player.y - a.y) <= blastR + this.player.radius) {
                this.damagePlayer(blastDmg, a);
                this.applyPlayerCC("knockback", 0, 50, a.x, a.y);
              }
              if (this.multiplayer.active) {
                mpClient.send({ type: "DAMAGE_ENEMY", enemyId: a.id, dmg: a.hp + 999, knockX: 0, knockY: 0, isCrit: false });
              } else {
                a.hp = 0;
                this.handleEnemyKilled(a);
              }
              continue;
            }
          }
        } else if (a.kind === "assassin") {
          a.dashCd = Math.max(0, (a.dashCd || 0) - s);
          if (a.dashCd <= 0 && g <= 260 && g >= 65) {
            a.dashCd = 4.5;
            this.afterimages.push({ x: a.x, y: a.y, facing: a.facing, color: "#A855F7", alpha: 0.85, life: 0, maxLife: 0.35, radius: a.radius });
            this.queueVfx("afterimage", { x: a.x, y: a.y, facing: a.facing, color: "#A855F7", alpha: 0.85, maxLife: 0.35 });
            a.x = Math.max(a.radius + 18, Math.min(Se - a.radius - 18, target.x + (m / g) * (target.radius + 22)));
            a.y = Math.max(a.radius + 18, Math.min(Ce - a.radius - 18, target.y + (c / g) * (target.radius + 22)));
            R.playAmbushSlash();
            if (target.isLocal) this.damagePlayer(Math.round(a.damage * 1.15), a);
            a.attackCooldown = 1.0;
          } else {
            g > a.radius + target.radius - 4 && (a.x += m / g * f * s, a.y += c / g * f * s);
            target.isLocal ? g <= a.radius + this.player.radius + 8 && a.attackCooldown <= 0 && (a.attackCooldown = 0.85, this.damagePlayer(a.damage, a)) : g <= a.radius + target.radius + 8 && a.attackCooldown <= 0 && (a.attackCooldown = 0.85);
          }
        } else if (a.kind === "void_acolyte") {
          g > 265 && (a.x += m / g * f * s, a.y += c / g * f * s);
          if (a.attackCooldown <= 0 && g < 410) {
            a.attackCooldown = 2.4;
            a.aoeTimer = (a.aoeTimer || 0) + 1;
            if (a.aoeTimer % 2 === 0) {
              this.emitBossWarning({ x: target.x, y: target.y, radius: 58, timer: 0, duration: 0.9, damage: Math.round(a.damage * 1.2), kind: "meteor", color: "#818CF8", ccType: "slow", ccDur: 0.9 });
            } else {
              let vx = m / g * 265, vy = c / g * 265;
              this.projectiles.push({ id: this.nextEntityId++, fromPlayer: false, kind: "void_bolt", x: a.x, y: a.y, vx, vy, radius: 9, damage: a.damage, color: "#818CF8", angle: a.facing, distanceTraveled: 0, maxDistance: 450, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set() });
              this.queueVfx("enemy_proj", { kind: "void_bolt", x: a.x, y: a.y, vx, vy, radius: 9, damage: a.damage, color: "#818CF8", angle: a.facing, maxDistance: 450 });
            }
          }
        } else {
          g > a.radius + target.radius - 4 && (a.x += m / g * f * s, a.y += c / g * f * s);
          if (target.isLocal) {
            if (g <= a.radius + this.player.radius + 8 && a.attackCooldown <= 0) {
              a.attackCooldown = a.kind === "boss" ? 1.15 : a.kind === "shield_knight" ? 1.25 : 0.95;
              this.damagePlayer(a.damage, a);
              a.kind === "shield_knight" && this.applyPlayerCC("knockback", 0, 34, a.x, a.y);
            }
          } else {
            g <= a.radius + target.radius + 8 && a.attackCooldown <= 0 && (a.attackCooldown = a.kind === "boss" ? 1.15 : 0.95);
          }
        }
        if (a.kind === "boss") {
          let v = a.hp / a.maxHp, bw = a.bossWave || 3, bp = a.phase || 1, ccD = getBossStageCcDuration(bw);
          if (v <= 0.6 && !a.phase2Triggered && (a.phase2Triggered = true, a.phase = 2, a.damage = Math.round((a.baseDamage || a.damage) * 1.15), a.speed = Math.round((a.baseSpeed || a.speed) * 1.1), R.playThunderStrike(), this.addShake(18, 0.6), this.screenFlashWhite = 0.35, this.addFloatingText(a.x, a.y - 45, "\u26A0\uFE0F TR\xD9M CU\u1ED2NG N\u1ED8 (PHASE 2)!", "#EF4444", 20), this.slashes.push({ x: a.x, y: a.y, angle: 0, radius: 280, spread: Math.PI * 2, color: "#EF4444", life: 0, maxLife: 0.5, kind: "shockwave" }), this.queueVfx("slash", { x: a.x, y: a.y, angle: 0, radius: 280, spread: Math.PI * 2, color: "#EF4444", maxLife: 0.5, kind: "shockwave" }), this.queueVfx("boss_phase", { phase: 2, x: a.x, y: a.y }), this.summonBossShockRing(a.x, a.y, 380, 460, Math.round(a.damage * 0.9), "#EF4444", "#F59E0B", "knockback", 0, 85), this.spawnFlameParticles(a.x, a.y, "red", 24, 60, 200), this.queueVfx("particles", { x: a.x, y: a.y, flame: true, flameColor: "red", count: 24, minSpd: 60, maxSpd: 200 }), this.onStateChange && this.onStateChange()), v <= 0.25 && !a.phase3Triggered && (a.phase3Triggered = true, a.phase = 3, a.damage = Math.round((a.baseDamage || a.damage) * 1.3), a.speed = Math.round((a.baseSpeed || a.speed) * 1.18), R.playDragonRoar(), this.addShake(22, 0.7), this.screenFlashWhite = 0.45, this.addFloatingText(a.x, a.y - 50, "\u{1F525} TR\xD9M TUY\u1EC6T V\u1ECCNG (PHASE 3)!", "#F59E0B", 22), this.slashes.push({ x: a.x, y: a.y, angle: 0, radius: 340, spread: Math.PI * 2, color: "#F59E0B", life: 0, maxLife: 0.55, kind: "shockwave" }), this.queueVfx("slash", { x: a.x, y: a.y, angle: 0, radius: 340, spread: Math.PI * 2, color: "#F59E0B", maxLife: 0.55, kind: "shockwave" }), this.queueVfx("boss_phase", { phase: 3, x: a.x, y: a.y }), this.summonBossShockRing(a.x, a.y, 440, 520, Math.round(a.damage * 1), "#F59E0B", "#DC2626", "stun", ccD, 0), this.spawnRedCrystals(a.x, a.y, 20, 80, 260), this.queueVfx("particles", { x: a.x, y: a.y, color: "#F87171", count: 22, minSpd: 80, maxSpd: 250, size: 4.2, maxLife: 0.45 }), this.onStateChange && this.onStateChange()), a.aoeTimer -= s, a.aoeTimer <= 0) {
            let T = a.bossWave === 27;
            a.aoeTimer = T ? a.phase === 3 ? 1.25 : a.phase === 2 ? 1.55 : 1.9 : a.phase === 3 ? 1.55 : a.phase === 2 ? 2.15 : 2.75;
            let b = T ? a.phase === 3 ? 0.78 : a.phase === 2 ? 0.88 : 0.98 : a.phase === 3 ? 0.65 : a.phase === 2 ? 0.82 : 1, x = T ? 6 : 3;
            a.bossSkillCycle = ((a.bossSkillCycle || 0) + 1) % x;
            let C = a.bossSkillCycle, H = Math.atan2(target.y - a.y, target.x - a.x);
            if (bw === 3) {
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u26A0\uFE0F \u0110\u1EACP \u0110\u1EA4T N\u1EE8T N\u1EBA!", "#10B981", 16), R.playEarthSlam(), this.addShake(15, 0.45), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u26A0\uFE0F \u0110\u1EACP \u0110\u1EA4T N\u1EE8T N\u1EBA!", color: "#10B981", size: 16, sound: "earthSlam", shakeMag: 15, shakeDur: 0.45 });
                for (let W of [-0.5, -0.25, 0, 0.25, 0.5]) {
                  let V = H + W;
                  this.spawnGroundCrack(a.x, a.y, V, 290, "#78716C", "#10B981"), this.slashes.push({ x: a.x + Math.cos(V) * 145, y: a.y + Math.sin(V) * 145, angle: V, radius: 155, spread: 0.65, color: "#10B981", life: 0, maxLife: 0.38, kind: "slash" });
                }
                this.createCataclysmicExplosion(a.x + Math.cos(H) * 110, a.y + Math.sin(H) * 110, 95, "#10B981"), this.queueVfx("boss_cone_slam", { x: a.x, y: a.y, angle: H, dmg: Math.round(a.damage * 1.25), ccDur: ccD });
                let D = Math.hypot(this.player.x - a.x, this.player.y - a.y), P = Math.atan2(this.player.y - a.y, this.player.x - a.x), N = Math.abs(Math.atan2(Math.sin(P - H), Math.cos(P - H)));
                D <= 300 && N <= 0.68 && (this.damagePlayer(Math.round(a.damage * 1.25)), this.applyPlayerCC("stun", ccD, 0, a.x, a.y), this.applyPlayerCC("knockback", 0, 55, a.x, a.y));
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1FAA8} L\u0102N \u0110\xC1 CU\u1ED2NG N\u1ED8!", "#F59E0B", 16), R.playRockRoll(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1FAA8} L\u0102N \u0110\xC1 CU\u1ED2NG N\u1ED8!", color: "#F59E0B", size: 16, sound: "rockRoll" });
                let D = a.x + Math.cos(H) * 250, P = a.y + Math.sin(H) * 250;
                this.spawnGroundCrack(a.x, a.y, H, 250, "#78716C", "#F59E0B"), this.queueVfx("crack", { x: a.x, y: a.y, angle: H, len: 250, color: "#78716C", glowColor: "#F59E0B" }), a.x = Math.max(a.radius + 20, Math.min(Se - a.radius - 20, D)), a.y = Math.max(a.radius + 20, Math.min(Ce - a.radius - 20, P)), this.addShake(16, 0.45), this.createCataclysmicExplosion(a.x, a.y, 110, "#10B981"), this.summonBossShockRing(a.x, a.y, 260, 420, Math.round(a.damage * 0.95), "#10B981", "#F59E0B", "slow", ccD, 0.45), this.queueVfx("boss_roll_slam", { x: a.x, y: a.y, radius: a.radius, dmg: Math.round(a.damage * 1.2) }), Math.hypot(this.player.x - a.x, this.player.y - a.y) <= a.radius + this.player.radius + 35 && (this.damagePlayer(Math.round(a.damage * 1.2)), this.applyPlayerCC("knockback", 0, 75, a.x, a.y));
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u26F0\uFE0F M\u01AFA \u0110\xC1 TINH TH\u1EC2!", "#34D399", 16), R.playRockRoll(), R.playBossWarn(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u26F0\uFE0F M\u01AFA \u0110\xC1 TINH TH\u1EC2!", color: "#34D399", size: 16, sound: "bossWarn" });
                for (let D = 0; D < 5; D++) {
                  let P = Math.PI * 2 / 5 * D + Math.random() * 0.35, N = D === 0 ? 0 : 75 + Math.random() * 65, W = Math.max(60, Math.min(Se - 60, target.x + Math.cos(P) * N)), V = Math.max(60, Math.min(Ce - 60, target.y + Math.sin(P) * N)), cAng = Math.random() * Math.PI * 2;
                  this.emitBossWarning({ x: W, y: V, radius: 80, timer: 0, duration: b, damage: Math.round(a.damage * 1.25), kind: "meteor", color: "#10B981", ccType: "stun", ccDur: ccD }), this.spawnGroundCrack(W, V, cAng, 50, "#78716C", "#10B981"), this.queueVfx("crack", { x: W, y: V, angle: cAng, len: 50, color: "#78716C", glowColor: "#10B981" });
                }
              }
            } else if (bw === 6) {
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F525} H\u01A0I TH\u1EDE R\u1ED2NG L\u1EECA!", "#EF4444", 16), R.playDragonRoar(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F525} H\u01A0I TH\u1EDE R\u1ED2NG L\u1EECA!", color: "#EF4444", size: 16, sound: "dragonRoar" });
                let D = a.phase === 3 ? 10 : 7;
                for (let W = 0; W < D; W++) {
                  let V = H - 0.65 + 1.3 / (D - 1) * W;
                  let px = a.x + Math.cos(V) * (a.radius + 15), py = a.y + Math.sin(V) * (a.radius + 15), pvx = Math.cos(V) * 290, pvy = Math.sin(V) * 290, pdmg = Math.round(a.damage * 0.85);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "dragon_flame", fromPlayer: false, x: px, y: py, vx: pvx, vy: pvy, radius: 13, damage: pdmg, color: "#EF4444", angle: V, distanceTraveled: 0, maxDistance: 460, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "burn", ccDur: ccD, ccFactor: 18 }), this.queueVfx("enemy_proj", { kind: "dragon_flame", x: px, y: py, vx: pvx, vy: pvy, radius: 13, damage: pdmg, color: "#EF4444", angle: V, maxDistance: 460, ccType: "burn", ccDur: ccD, ccFactor: 18 });
                }
                let P = a.x + Math.cos(H) * 165, N = a.y + Math.sin(H) * 165;
                this.lavaPools.push({ id: this.nextEntityId++, x: P, y: N, radius: 145, timer: 0, duration: 3.5, tickTimer: 0, tickInterval: 0.5, damagePerTick: 26 }), this.queueVfx("lava_vis", { x: P, y: N, radius: 145, duration: 3.5 }), this.createCataclysmicExplosion(a.x + Math.cos(H) * 90, a.y + Math.sin(H) * 90, 90, "#F97316"), this.queueVfx("explosion", { x: a.x + Math.cos(H) * 90, y: a.y + Math.sin(H) * 90, maxRadius: 90, color: "#F97316" });
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F4A5} C\xC1NH GI\xD3 H\u1ECEA NG\u1EE4C!", "#F97316", 16), R.playFire(0.45, 0.28), R.playExplosion(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F4A5} C\xC1NH GI\xD3 H\u1ECEA NG\u1EE4C!", color: "#F97316", size: 16, sound: "explosion" });
                for (let D = 0; D < 14; D++) {
                  let P = Math.PI * 2 / 14 * D, pvx = Math.cos(P) * 245, pvy = Math.sin(P) * 245, pdmg = Math.round(a.damage * 0.78);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "inferno_orb", fromPlayer: false, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#F97316", angle: P, distanceTraveled: 0, maxDistance: 420, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.4 }), this.queueVfx("enemy_proj", { kind: "inferno_orb", x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#F97316", angle: P, maxDistance: 420, ccType: "slow", ccDur: ccD, ccFactor: 0.4 });
                }
                this.summonBossShockRing(a.x, a.y, 320, 440, Math.round(a.damage * 0.9), "#EF4444", "#FEF08A", "knockback", 0, 85), this.spawnFlameParticles(a.x, a.y, "red", 24, 60, 200), this.queueVfx("particles", { x: a.x, y: a.y, flame: true, flameColor: "red", count: 24, minSpd: 60, maxSpd: 200 });
              } else {
                let cAng = Math.random() * Math.PI * 2;
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u2604\uFE0F LAO L\u1EECA DI\u1EC6T TH\u1EBE!", "#DC2626", 18), R.playDragonRoar(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u2604\uFE0F LAO L\u1EECA DI\u1EC6T TH\u1EBE!", color: "#DC2626", size: 18, sound: "dragonRoar" }), this.emitBossWarning({ x: target.x, y: target.y, radius: 155, timer: 0, duration: b + 0.15, damage: Math.round(a.damage * 1.45), kind: "meteor", color: "#DC2626", ccType: "stun", ccDur: ccD }), this.summonGiantMeteor(target.x, target.y, Math.round(a.damage * 0.9), 155, false, "knockback", 75, "#EF4444", 44, b + 0.15), this.queueVfx("enemy_meteor", { x: target.x, y: target.y, damage: Math.round(a.damage * 0.9), radius: 155, ccType: "knockback", ccDur: 75, color: "#EF4444", meteorSize: 44, duration: b + 0.15 }), this.spawnGroundCrack(target.x, target.y, cAng, 125, "#DC2626", "#FEF08A"), this.queueVfx("crack", { x: target.x, y: target.y, angle: cAng, len: 125, color: "#DC2626", glowColor: "#FEF08A" });
              }
            } else if (bw === 9) {
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u2744\uFE0F B\u0102NG TH\xC1P GI\u1EA2O S\xC1T!", "#38BDF8", 16), R.playIceShatter(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u2744\uFE0F B\u0102NG TH\xC1P GI\u1EA2O S\xC1T!", color: "#38BDF8", size: 16, sound: "iceShatter" });
                for (let D = 0; D < 8; D++) {
                  let P = Math.PI * 2 / 8 * D, N = Math.max(60, Math.min(Se - 60, target.x + Math.cos(P) * 115)), W = Math.max(60, Math.min(Ce - 60, target.y + Math.sin(P) * 115));
                  this.emitBossWarning({ x: N, y: W, radius: 68, timer: 0, duration: b, damage: Math.round(a.damage * 1.05), kind: "ice_prison", color: "#38BDF8", ccType: "root", ccDur: ccD }), this.spawnGroundCrack(N, W, P, 40, "#38BDF8", "#E0F2FE"), this.queueVfx("crack", { x: N, y: W, angle: P, len: 40, color: "#38BDF8", glowColor: "#E0F2FE" });
                }
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F32A}\uFE0F B\xC3O TUY\u1EBET XO\xC1Y L\u1ED0C!", "#BAE6FD", 16), R.playIceStorm(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F32A}\uFE0F B\xC3O TUY\u1EBET XO\xC1Y L\u1ED0C!", color: "#BAE6FD", size: 16, sound: "iceStorm" }), this.zones.push({ id: this.nextEntityId++, kind: "blizzard_vortex", x: target.x, y: target.y, radius: 150, timer: 0, duration: 4.5, tickTimer: 0, tickInterval: 0.45, damagePerTick: Math.round(a.damage * 0.38), slowFactor: 0.55, ccDur: ccD, rotation: 0 }), this.queueVfx("enemy_zone", { kind: "blizzard_vortex", x: target.x, y: target.y, radius: 150, duration: 4.5, tickInterval: 0.45, damagePerTick: Math.round(a.damage * 0.38), slowFactor: 0.55, ccDur: ccD }), this.summonBossShockRing(a.x, a.y, 300, 400, Math.round(a.damage * 0.8), "#38BDF8", "#E0F2FE", "slow", ccD, 0.55), this.spawnParticles(target.x, target.y, "#E0F2FE", 22, 40, 140, 3.8, 0.45), this.queueVfx("particles", { x: target.x, y: target.y, color: "#E0F2FE", count: 22, minSpd: 40, maxSpd: 140, size: 3.8, maxLife: 0.45 });
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F4A0} B\u0102NG TI\u1EC4N & TIA H\xC0N B\u0102NG!", "#67E8F9", 16), R.playIce(), R.playElectricZap(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F4A0} B\u0102NG TI\u1EC4N & TIA H\xC0N B\u0102NG!", color: "#67E8F9", size: 16, sound: "ice" });
                for (let D = 0; D < 12; D++) {
                  let P = Math.PI * 2 / 12 * D, pvx = Math.cos(P) * 260, pvy = Math.sin(P) * 260, pdmg = Math.round(a.damage * 0.8);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "ice_star", fromPlayer: false, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 9, damage: pdmg, color: "#38BDF8", angle: P, distanceTraveled: 0, maxDistance: 480, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.55 }), this.queueVfx("enemy_proj", { kind: "ice_star", x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 9, damage: pdmg, color: "#38BDF8", angle: P, maxDistance: 480, ccType: "slow", ccDur: ccD, ccFactor: 0.55 });
                }
                this.summonBossBeam(target.x - Math.cos(H + Math.PI / 2) * 320, target.y - Math.sin(H + Math.PI / 2) * 320, target.x + Math.cos(H + Math.PI / 2) * 320, target.y + Math.sin(H + Math.PI / 2) * 320, 42, b, Math.round(a.damage * 1.15), "#0284C7", "#E0F2FE", "root", ccD);
              }
            } else if (bw === 12) {
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F441}\uFE0F D\u1ECACH CHUY\u1EC2N TR\u1EA2M K\xCDCH!", "#C084FC", 16), R.playAmbushSlash(), R.playBlackHole(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F441}\uFE0F D\u1ECACH CHUY\u1EC2N TR\u1EA2M K\xCDCH!", color: "#C084FC", size: 16, sound: "ambushSlash", shakeMag: 15, shakeDur: 0.45 });
                let D = (target.facing || 0) + Math.PI;
                a.x = Math.max(a.radius + 30, Math.min(Se - a.radius - 30, target.x + Math.cos(D) * 80)), a.y = Math.max(a.radius + 30, Math.min(Ce - a.radius - 30, target.y + Math.sin(D) * 80)), this.spawnSpatialTear(target.x - 105, target.y - 105, target.x + 105, target.y + 105, "#C084FC", 16), this.spawnSpatialTear(target.x + 105, target.y - 105, target.x - 105, target.y + 105, "#C084FC", 16), this.queueVfx("tear", { x1: target.x - 105, y1: target.y - 105, x2: target.x + 105, y2: target.y + 105, color: "#C084FC", width: 16 }), this.queueVfx("tear", { x1: target.x + 105, y1: target.y - 105, x2: target.x - 105, y2: target.y + 105, color: "#C084FC", width: 16 }), this.summonBossBeam(target.x - 240, target.y - 240, target.x + 240, target.y + 240, 44, b, Math.round(a.damage * 1.25), "#9333EA", "#E9D5FF", "root", ccD), this.summonBossBeam(target.x + 240, target.y - 240, target.x - 240, target.y + 240, 44, b, Math.round(a.damage * 1.25), "#9333EA", "#E9D5FF", "root", ccD), this.addShake(15, 0.45);
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u26A1 CH\xD9M TIA H\u01AF KH\xD4NG!", "#A855F7", 16), R.playBlackHole(), R.playElectricZap(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u26A1 CH\xD9M TIA H\u01AF KH\xD4NG!", color: "#A855F7", size: 16, sound: "blackHole" }), this.summonGalaxyVortex(target.x, target.y, 130, 3.2, Math.round(a.damage * 0.35), Math.round(a.damage * 1.15), false, false, -1, ccD), this.queueVfx("enemy_vortex", { x: target.x, y: target.y, radius: 130, duration: 3.2, damagePerTick: Math.round(a.damage * 0.35), finalBurstDmg: Math.round(a.damage * 1.15), isGalaxy: false, ccDur: ccD }), this.summonBossBeam(a.x, a.y, a.x + Math.cos(H) * 520, a.y + Math.sin(H) * 520, 48, b, Math.round(a.damage * 1.2), "#A855F7", "#F0ABFC", "stun", ccD);
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F52E} \u0110\xC0N C\u1EA6U T\u1EA6M NHI\u1EC6T!", "#E9D5FF", 16), R.playCosmic(), R.playBlackHole(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F52E} \u0110\xC0N C\u1EA6U T\u1EA6M NHI\u1EC6T!", color: "#E9D5FF", size: 16, sound: "cosmic" });
                for (let D = 0; D < 7; D++) {
                  let P = Math.PI * 2 / 7 * D, pvx = Math.cos(P) * 235, pvy = Math.sin(P) * 235, pdmg = Math.round(a.damage * 0.78);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "void_orb", fromPlayer: false, isHoming: true, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 12, damage: pdmg, color: "#C084FC", angle: P, distanceTraveled: 0, maxDistance: 540, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.45 }), this.queueVfx("enemy_proj", { kind: "void_orb", isHoming: true, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 12, damage: pdmg, color: "#C084FC", angle: P, maxDistance: 540, ccType: "slow", ccDur: ccD, ccFactor: 0.45 });
                }
                this.summonBossShockRing(a.x, a.y, 330, 450, Math.round(a.damage * 0.9), "#9333EA", "#E9D5FF", "stun", ccD, 0);
              }
            } else if (bw === 15) {
              // Wave 15 Mid-Boss: Siege Automaton Rex (3 mechanical siege skills, ccD = 1.8s)
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u2699\uFE0F LI\xCAN THANH XUNG PLASMA!", "#38BDF8", 16), R.playElectricZap(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u2699\uFE0F LI\xCAN THANH XUNG PLASMA!", color: "#38BDF8", size: 16, sound: "electricZap" });
                a.x = Math.max(a.radius + 20, Math.min(Se - a.radius - 20, a.x + Math.cos(H) * 85));
                a.y = Math.max(a.radius + 20, Math.min(Ce - a.radius - 20, a.y + Math.sin(H) * 85));
                for (let P = -2; P <= 2; P++) {
                  let N = H + P * 0.16, pvx = Math.cos(N) * 345, pvy = Math.sin(N) * 345, pdmg = Math.round(a.damage * 0.75);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "cyber_bolt", fromPlayer: false, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 10, damage: pdmg, color: "#38BDF8", angle: N, distanceTraveled: 0, maxDistance: 520, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.45 });
                  this.queueVfx("enemy_proj", { kind: "cyber_bolt", x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 10, damage: pdmg, color: "#38BDF8", angle: N, maxDistance: 520, ccType: "slow", ccDur: ccD, ccFactor: 0.45 });
                }
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F680} OANH T\u1EA0C TH\u1EA2M PH\xC1O!", "#F59E0B", 16), R.playBossWarn(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F680} OANH T\u1EA0C TH\u1EA2M PH\xC1O!", color: "#F59E0B", size: 16, sound: "bossWarn" });
                for (let step = 0; step < 4; step++) {
                  let dist = -75 + step * 95;
                  let wx = Math.max(70, Math.min(Se - 70, target.x + Math.cos(H) * dist));
                  let wy = Math.max(70, Math.min(Ce - 70, target.y + Math.sin(H) * dist));
                  this.emitBossWarning({ x: wx, y: wy, radius: 85, timer: 0, duration: b + step * 0.12, damage: Math.round(a.damage * 1.15), kind: "meteor", color: "#38BDF8", ccType: "stun", ccDur: ccD });
                  this.fireRocket(a.x, a.y, wx, wy, Math.round(a.damage * 0.65), false, "#38BDF8");
                  this.queueVfx("rocket_vis", { sx: a.x, sy: a.y, tx: wx, ty: wy, damage: Math.round(a.damage * 0.65), color: "#38BDF8", isFromPlayer: false });
                }
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u26A1 XUNG \u0110I\u1EC6N T\u1EEA L\xD5I L\xD2!", "#FEF08A", 16), R.playThunderStrike(), this.addShake(14, 0.4), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u26A1 XUNG \u0110I\u1EC6N T\u1EEA L\xD5I L\xD2!", color: "#FEF08A", size: 16, sound: "thunderStrike", shakeMag: 14, shakeDur: 0.4 });
                this.summonBossShockRing(a.x, a.y, 350, 440, Math.round(a.damage * 0.92), "#38BDF8", "#FDE047", "stun", ccD, 0);
                for (let k = 0; k < 6; k++) {
                  let ang = Math.PI * 2 / 6 * k;
                  this.createBranchingLightning(a.x, a.y, a.x + Math.cos(ang) * 190, a.y + Math.sin(ang) * 190, "#38BDF8", 3.2);
                  this.queueVfx("lightning", { x1: a.x, y1: a.y, x2: a.x + Math.cos(ang) * 190, y2: a.y + Math.sin(ang) * 190, color: "#38BDF8", width: 3.2 });
                }
              }
            } else if (bw === 18) {
              // Wave 18 Boss: Thunder Archon Raijin (3 thunder skills, ccD = 2.0s)
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u26A1 C\u1ED8T S\xC9T THI\xCAN L\xD4I!", "#FDE047", 17), R.playThunderStrike(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u26A1 C\u1ED8T S\xC9T THI\xCAN L\xD4I!", color: "#FDE047", size: 17, sound: "thunderStrike" });
                let count = a.phase === 3 ? 7 : 5;
                for (let D = 0; D < count; D++) {
                  let P = Math.PI * 2 / count * D + this.elapsedTime * 0.3, N = D === 0 ? 0 : 120 + (D % 2) * 60;
                  let wx = Math.max(70, Math.min(Se - 70, target.x + Math.cos(P) * N)), wy = Math.max(70, Math.min(Ce - 70, target.y + Math.sin(P) * N));
                  this.emitBossWarning({ x: wx, y: wy, radius: 82, timer: 0, duration: b, damage: Math.round(a.damage * 1.1), kind: "sword_strike", color: "#FDE047", ccType: "stun", ccDur: ccD });
                  this.createBranchingLightning(a.x, a.y, wx, wy, "#FDE047", 3.8);
                  this.queueVfx("lightning", { x1: a.x, y1: a.y, x2: wx, y2: wy, color: "#FDE047", width: 3.8 });
                }
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F329}\uFE0F L\u01AF\u1EDAI TIA L\xD4I C\u1EF0C QUANG!", "#38BDF8", 17), R.playElectricZap(), R.playBossWarn(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F329}\uFE0F L\u01AF\u1EDAI TIA L\xD4I C\u1EF0C QUANG!", color: "#38BDF8", size: 17, sound: "electricZap" });
                for (let W = 0; W < 3; W++) {
                  let V = H + (W - 1) * (Math.PI / 3);
                  this.summonBossBeam(target.x - Math.cos(V) * 440, target.y - Math.sin(V) * 440, target.x + Math.cos(V) * 440, target.y + Math.sin(V) * 440, 44, b + 0.08, Math.round(a.damage * 1.15), "#0284C7", "#FDE047", "root", ccD);
                }
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u26A1 B\xC3O T\u1EEA TR\u01AF\u1EDDNG & TH\u01AF\u01A0NG S\xC9T!", "#FACC15", 17), R.playThunderStrike(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u26A1 B\xC3O T\u1EEA TR\u01AF\u1EDDNG & TH\u01AF\u01A0NG S\xC9T!", color: "#FACC15", size: 17, sound: "thunderStrike" });
                for (let D = 0; D < 10; D++) {
                  let P = Math.PI * 2 / 10 * D, pvx = Math.cos(P) * 315, pvy = Math.sin(P) * 315, pdmg = Math.round(a.damage * 0.8);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "thunder_lance", fromPlayer: false, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 10, damage: pdmg, color: "#FDE047", angle: P, distanceTraveled: 0, maxDistance: 540, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                  this.queueVfx("enemy_proj", { kind: "thunder_lance", x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 10, damage: pdmg, color: "#FDE047", angle: P, maxDistance: 540, ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                }
                this.summonBossShockRing(a.x, a.y, 380, 470, Math.round(a.damage * 0.9), "#0284C7", "#FDE047", "stun", ccD, 0);
              }
            } else if (bw === 21) {
              // Wave 21 Boss: Abyssal Venom Wyrm (3 venom skills, ccD = 2.2s)
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u2620\uFE0F \u0110\u1EA6M AXIT \u0102N M\xD2N!", "#A3E635", 17), R.playFire(0.35, 0.22), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u2620\uFE0F \u0110\u1EA6M AXIT \u0102N M\xD2N!", color: "#A3E635", size: 17, sound: "fire" });
                for (let offset of [-75, 75]) {
                  let px = Math.max(90, Math.min(Se - 90, target.x + Math.cos(H + Math.PI / 2) * offset));
                  let py = Math.max(90, Math.min(Ce - 90, target.y + Math.sin(H + Math.PI / 2) * offset));
                  this.zones.push({ id: this.nextEntityId++, kind: "acid_pool", x: px, y: py, radius: 120, timer: 0, duration: 4.8, tickTimer: 0, tickInterval: 0.5, damagePerTick: Math.round(a.damage * 0.34), slowFactor: 0.45, ccDur: ccD, rotation: 0 });
                  this.queueVfx("enemy_zone", { kind: "acid_pool", x: px, y: py, radius: 120, duration: 4.8, tickInterval: 0.5, damagePerTick: Math.round(a.damage * 0.34), slowFactor: 0.45, ccDur: ccD });
                }
                this.slashes.push({ x: a.x, y: a.y, angle: H, radius: 220, spread: 1.4, color: "#A3E635", life: 0, maxLife: 0.35, kind: "slash" });
                this.queueVfx("slash", { x: a.x, y: a.y, angle: H, radius: 220, spread: 1.4, color: "#A3E635", maxLife: 0.35, kind: "slash" });
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F40D} M\u01AFA NANH \u0110\u1ED8C XO\u1EAEN \u1ED0C!", "#84CC16", 17), R.playExplosion(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F40D} M\u01AFA NANH \u0110\u1ED8C XO\u1EAEN \u1ED0C!", color: "#84CC16", size: 17, sound: "explosion" });
                for (let D = 0; D < 12; D++) {
                  let P = Math.PI * 2 / 12 * D + this.elapsedTime * 0.6, pvx = Math.cos(P) * 265, pvy = Math.sin(P) * 265, pdmg = Math.round(a.damage * 0.78);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "venom_fang", fromPlayer: false, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#A3E635", angle: P, distanceTraveled: 0, maxDistance: 510, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                  this.queueVfx("enemy_proj", { kind: "venom_fang", x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#A3E635", angle: P, maxDistance: 510, ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                }
                this.summonBossShockRing(a.x, a.y, 350, 440, Math.round(a.damage * 0.85), "#16A34A", "#BEF264", "slow", ccD, 0.5);
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u2604\uFE0F THI\xCAN TH\u1EA0CH B\xC0O T\u1EEC \u0110\u1ED8C!", "#4ADE80", 17), R.playDragonRoar(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u2604\uFE0F THI\xCAN TH\u1EA0CH B\xC0O T\u1EEC \u0110\u1ED8C!", color: "#4ADE80", size: 17, sound: "dragonRoar" });
                for (let D = 0; D < 3; D++) {
                  let P = Math.PI * 2 / 3 * D + Math.random() * 0.4, N = D === 0 ? 0 : 120;
                  let wx = Math.max(80, Math.min(Se - 80, target.x + Math.cos(P) * N)), wy = Math.max(80, Math.min(Ce - 80, target.y + Math.sin(P) * N));
                  this.emitBossWarning({ x: wx, y: wy, radius: 110, timer: 0, duration: b + 0.12, damage: Math.round(a.damage * 1.1), kind: "meteor", color: "#22C55E", ccType: "stun", ccDur: ccD });
                  this.summonGiantMeteor(wx, wy, Math.round(a.damage * 0.8), 110, false, "knockback", 70, "#22C55E", 40, b + 0.12);
                  this.queueVfx("enemy_meteor", { x: wx, y: wy, damage: Math.round(a.damage * 0.8), radius: 110, ccType: "knockback", ccDur: 70, color: "#22C55E", meteorSize: 40, duration: b + 0.12 });
                }
              }
            } else if (bw === 24) {
              // Wave 24 Boss: Crimson Blood Sovereign (3 blood skills, ccD = 2.4s)
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1FA78} HUY\u1EBET NGUY\u1EC6T \u1EA2NH TR\u1EA2M!", "#FB7185", 17), R.playAmbushSlash(), R.playRealmSlash(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1FA78} HUY\u1EBET NGUY\u1EC6T \u1EA2NH TR\u1EA2M!", color: "#FB7185", size: 17, sound: "realmSlash" });
                let D = (target.facing || 0) + Math.PI;
                a.x = Math.max(a.radius + 30, Math.min(Se - a.radius - 30, target.x + Math.cos(D) * 90));
                a.y = Math.max(a.radius + 30, Math.min(Ce - a.radius - 30, target.y + Math.sin(D) * 90));
                this.spawnSpatialTear(target.x - 135, target.y - 135, target.x + 135, target.y + 135, "#FB7185", 16);
                this.spawnSpatialTear(target.x + 135, target.y - 135, target.x - 135, target.y + 135, "#FB7185", 16);
                this.queueVfx("tear", { x1: target.x - 135, y1: target.y - 135, x2: target.x + 135, y2: target.y + 135, color: "#FB7185", width: 16 });
                this.queueVfx("tear", { x1: target.x + 135, y1: target.y - 135, x2: target.x - 135, y2: target.y + 135, color: "#FB7185", width: 16 });
                this.summonBossBeam(target.x - 280, target.y - 280, target.x + 280, target.y + 280, 46, b, Math.round(a.damage * 1.25), "#BE123C", "#FDA4AF", "root", ccD);
                this.summonBossBeam(target.x + 280, target.y - 280, target.x - 280, target.y + 280, 46, b, Math.round(a.damage * 1.25), "#BE123C", "#FDA4AF", "root", ccD);
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F319} TH\xC1NH \u0110\u1ECAA H\xDAT HUY\u1EBET!", "#F43F5E", 17), R.playDragonRoar(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F319} TH\xC1NH \u0110\u1ECAA H\xDAT HUY\u1EBET!", color: "#F43F5E", size: 17, sound: "dragonRoar" });
                this.zones.push({ id: this.nextEntityId++, kind: "blood_sanctuary", x: target.x, y: target.y, radius: 175, timer: 0, duration: 4.5, tickTimer: 0, tickInterval: 0.55, damagePerTick: Math.round(a.damage * 0.36), slowFactor: 0.35, ccDur: ccD, rotation: 0 });
                this.queueVfx("enemy_zone", { kind: "blood_sanctuary", x: target.x, y: target.y, radius: 175, duration: 4.5, tickInterval: 0.55, damagePerTick: Math.round(a.damage * 0.36), slowFactor: 0.35, ccDur: ccD });
                this.summonBossShockRing(a.x, a.y, 380, 460, Math.round(a.damage * 0.88), "#BE123C", "#FDA4AF", "stun", ccD, 0);
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 18, "\u{1F48E} B\xC3O HUY\u1EBET TINH T\u1EA6M NHI\u1EC6T!", "#FDA4AF", 17), R.playCosmic(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 18, text: "\u{1F48E} B\xC3O HUY\u1EBET TINH T\u1EA6M NHI\u1EC6T!", color: "#FDA4AF", size: 17, sound: "cosmic" });
                for (let D = 0; D < 8; D++) {
                  let P = Math.PI * 2 / 8 * D, pvx = Math.cos(P) * 245, pvy = Math.sin(P) * 245, pdmg = Math.round(a.damage * 0.8);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "blood_crystal", fromPlayer: false, isHoming: true, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#FB7185", angle: P, distanceTraveled: 0, maxDistance: 560, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                  this.queueVfx("enemy_proj", { kind: "blood_crystal", isHoming: true, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#FB7185", angle: P, maxDistance: 560, ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                }
              }
            } else {
              // Wave 27 Final Boss: Fallen Seraphim Lucifer (6 apocalypse skills, ccD = 2.6s)
              if (C === 0) {
                this.addFloatingText(a.x, a.y - a.radius - 22, "\u2694\uFE0F LI\xCAN TR\u1EA2M L\u1EE4C D\u1EF0C T\u1EACN TH\u1EBE!", "#FBBF24", 19), R.playRealmSlash(), this.addShake(18, 0.5), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 22, text: "\u2694\uFE0F LI\xCAN TR\u1EA2M L\u1EE4C D\u1EF0C T\u1EACN TH\u1EBE!", color: "#FBBF24", size: 19, sound: "realmSlash", shakeMag: 18, shakeDur: 0.5 });
                let D = Math.min(140, Math.max(0, g - 75));
                a.x += Math.cos(H) * D, a.y += Math.sin(H) * D;
                for (let P = 0; P < 3; P++) this.slashes.push({ x: a.x, y: a.y, angle: H + (P - 1) * 0.28, radius: 275 + P * 25, spread: Math.PI * 1.2, color: P % 2 == 0 ? "#FBBF24" : "#DC2626", life: 0, maxLife: 0.45, kind: "slash" }), this.queueVfx("slash", { x: a.x, y: a.y, angle: H + (P - 1) * 0.28, radius: 275 + P * 25, spread: Math.PI * 1.2, color: P % 2 == 0 ? "#FBBF24" : "#DC2626", maxLife: 0.45, kind: "slash" });
                for (let P = -2; P <= 2; P++) {
                  let N = H + P * 0.22, pvx = Math.cos(N) * 330, pvy = Math.sin(N) * 330, pdmg = Math.round(a.damage * 0.72);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "seraph_spear", fromPlayer: false, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 12, damage: pdmg, color: "#FBBF24", angle: N, distanceTraveled: 0, maxDistance: 600, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.55 }), this.queueVfx("enemy_proj", { kind: "seraph_spear", x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 12, damage: pdmg, color: "#FBBF24", angle: N, maxDistance: 600, ccType: "slow", ccDur: ccD, ccFactor: 0.55 });
                }
                this.spawnGroundCrack(a.x, a.y, H, 260, "#DC2626", "#FBBF24"), this.queueVfx("crack", { x: a.x, y: a.y, angle: H, len: 260, color: "#DC2626", glowColor: "#FBBF24" }), this.emitBossWarning({ x: target.x, y: target.y, radius: 140, timer: 0, duration: b, damage: Math.round(a.damage * 0.98), kind: "apocalypse", color: "#DC2626", ccType: "stun", ccDur: ccD });
              } else if (C === 1) {
                this.addFloatingText(a.x, a.y - a.radius - 22, "\u26A1 C\u1ED4NG PH\xC1N QUY\u1EBET L\u1EE4C D\u1EF0C!", "#FDE047", 19), R.playThunderStrike(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 22, text: "\u26A1 C\u1ED4NG PH\xC1N QUY\u1EBET L\u1EE4C D\u1EF0C!", color: "#FDE047", size: 19, sound: "thunderStrike" });
                let D = a.phase === 3 ? 8 : 6;
                for (let P = 0; P < D; P++) {
                  let N = Math.PI * 2 / D * P + this.elapsedTime * 0.4, W = P % 2 == 0 ? 130 : 215, V = Math.max(70, Math.min(Se - 70, target.x + Math.cos(N) * W)), oe = Math.max(70, Math.min(Ce - 70, target.y + Math.sin(N) * W));
                  this.emitBossWarning({ x: V, y: oe, radius: 82, timer: 0, duration: b, damage: Math.round(a.damage * 0.9), kind: "sword_strike", color: "#FBBF24", ccType: "root", ccDur: ccD }), this.createBranchingLightning(a.x, a.y, V, oe, "#FBBF24", 4.0), this.queueVfx("lightning", { x1: a.x, y1: a.y, x2: V, y2: oe, color: "#FBBF24", width: 4.0 }), this.spawnGroundCrack(V, oe, N, 58, "#DC2626", "#FEF08A"), this.queueVfx("crack", { x: V, y: oe, angle: N, len: 58, color: "#DC2626", glowColor: "#FEF08A" });
                }
              } else if (C === 2) {
                this.addFloatingText(a.x, a.y - a.radius - 22, "\u{1F30C} H\u1ED0 \u0110EN NH\u1EACT TH\u1EF0C H\u1ED6N MANG!", "#A855F7", 20), R.playBlackHole(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 22, text: "\u{1F30C} H\u1ED0 \u0110EN NH\u1EACT TH\u1EF0C H\u1ED6N MANG!", color: "#A855F7", size: 20, sound: "blackHole", shakeMag: 20, shakeDur: 0.65 });
                let D = (a.x + target.x) * 0.5, P = (a.y + target.y) * 0.5;
                this.summonGalaxyVortex(D, P, 220, 3.2, Math.round(a.damage * 0.32), Math.round(a.damage * 1.08), true, false, -1, ccD), this.queueVfx("enemy_vortex", { x: D, y: P, radius: 220, duration: 3.2, damagePerTick: Math.round(a.damage * 0.32), finalBurstDmg: Math.round(a.damage * 1.08), isGalaxy: true, ccDur: ccD });
                for (let N = 0; N < 8; N++) {
                  let W = Math.PI * 2 / 8 * N + this.elapsedTime, pvx = Math.cos(W) * 245, pvy = Math.sin(W) * 245, pdmg = Math.round(a.damage * 0.65);
                  this.projectiles.push({ id: this.nextEntityId++, kind: "seraph_spear", fromPlayer: false, isHoming: true, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#FBBF24", angle: W, distanceTraveled: 0, maxDistance: 580, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: "slow", ccDur: ccD, ccFactor: 0.5 }), this.queueVfx("enemy_proj", { kind: "seraph_spear", isHoming: true, x: a.x, y: a.y, vx: pvx, vy: pvy, radius: 11, damage: pdmg, color: "#FBBF24", angle: W, maxDistance: 580, ccType: "slow", ccDur: ccD, ccFactor: 0.5 });
                }
                this.addShake(20, 0.65);
              } else if (C === 3) {
                this.addFloatingText(a.x, a.y - a.radius - 22, "\u{1F4A5} TH\u1EACP T\u1EF0 THI\xCAN PH\u1EA0T T\u1ED0I TH\u01AF\u1EE2NG!", "#FEF08A", 20), R.playElectricZap(), R.playBossWarn(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 22, text: "\u{1F4A5} TH\u1EACP T\u1EF0 THI\xCAN PH\u1EA0T T\u1ED0I TH\u01AF\u1EE2NG!", color: "#FEF08A", size: 20, sound: "electricZap" });
                let D = target.x, P = target.y, N = (a.phase || 1) % 2 == 0 ? Math.PI / 4 : 0;
                for (let W = 0; W < 4; W++) {
                  let V = N + Math.PI / 4 * W;
                  this.summonBossBeam(D - Math.cos(V) * 540, P - Math.sin(V) * 540, D + Math.cos(V) * 540, P + Math.sin(V) * 540, 54, b + 0.12, Math.round(a.damage * 0.98), W % 2 == 0 ? "#DC2626" : "#FBBF24", "#FEF08A", "stun", ccD);
                }
              } else if (C === 4) {
                this.addFloatingText(a.x, a.y - a.radius - 22, "\u2604\uFE0F M\u01AFA SAO B\u0102NG SA NG\xC3!", "#EF4444", 20), R.playDragonRoar(), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 22, text: "\u2604\uFE0F M\u01AFA SAO B\u0102NG SA NG\xC3!", color: "#EF4444", size: 20, sound: "dragonRoar" });
                let D = a.phase === 3 ? 5 : 4;
                for (let P = 0; P < D; P++) {
                  let N = Math.PI * 2 / D * P + Math.random() * 0.4, W = P === 0 ? 0 : 115 + Math.random() * 90, V = Math.max(80, Math.min(Se - 80, target.x + Math.cos(N) * W)), oe = Math.max(80, Math.min(Ce - 80, target.y + Math.sin(N) * W));
                  this.emitBossWarning({ x: V, y: oe, radius: 120, timer: 0, duration: b + 0.12, damage: Math.round(a.damage * 0.88), kind: "meteor", color: "#DC2626", ccType: "stun", ccDur: ccD }), this.summonGiantMeteor(V, oe, Math.round(a.damage * 0.72), 120, false, "knockback", 80, "#FBBF24", 44, b + 0.12), this.queueVfx("enemy_meteor", { x: V, y: oe, damage: Math.round(a.damage * 0.72), radius: 120, ccType: "knockback", ccDur: 80, color: "#FBBF24", meteorSize: 44, duration: b + 0.12 });
                }
              } else {
                this.addFloatingText(a.x, a.y - a.radius - 22, "\u{1F525} \u0110\u1EA0I B\xD9NG N\u1ED4 L\u1EE4C D\u1EF0C!", "#FBBF24", 20), R.playEarthSlam(), R.playFire(0.4, 0.25), this.queueVfx("boss_callout", { x: a.x, y: a.y - a.radius - 22, text: "\u{1F525} \u0110\u1EA0I B\xD9NG N\u1ED4 L\u1EE4C D\u1EF0C!", color: "#FBBF24", size: 20, sound: "earthSlam" }), this.summonBossShockRing(a.x, a.y, 480, 500, Math.round(a.damage * 0.85), "#DC2626", "#FEF08A", "knockback", 0, 95, 30), this.summonBossShockRing(a.x, a.y, 400, 350, Math.round(a.damage * 0.75), "#FBBF24", "#EF4444", "slow", ccD, 0.55, 24);
                for (let D = 0; D < 6; D++) {
                  let P = H + (D - 2.5) * 0.34, N = a.x + Math.cos(P) * 540, W = a.y + Math.sin(P) * 540;
                  this.fireRocket(a.x, a.y, N, W, Math.round(a.damage * 0.78), false, "#FBBF24"), this.queueVfx("rocket_vis", { sx: a.x, sy: a.y, tx: N, ty: W, damage: Math.round(a.damage * 0.78), color: "#FBBF24", isFromPlayer: false });
                }
                for (let D = 0; D < 8; D++) {
                  let P = Math.PI * 2 / 8 * D;
                  this.createBranchingLightning(a.x, a.y, a.x + Math.cos(P) * 210, a.y + Math.sin(P) * 210, "#FBBF24", 3.6), this.queueVfx("lightning", { x1: a.x, y1: a.y, x2: a.x + Math.cos(P) * 210, y2: a.y + Math.sin(P) * 210, color: "#FBBF24", width: 3.6 });
                }
              }
            }
          }
        }
        a.x = Math.max(a.radius + 14, Math.min(Se - a.radius - 14, a.x)), a.y = Math.max(a.radius + 14, Math.min(Ce - a.radius - 14, a.y));
      }
    }
    if (this.isCoopHost()) {
      for (let a = 0; a < this.enemies.length; a++) for (let l = a + 1; l < this.enemies.length; l++) {
        let m = this.enemies[a], c = this.enemies[l], g = c.x - m.x, p = c.y - m.y, h = Math.hypot(g, p) || 0.01, f = m.radius + c.radius;
        if (h < f) {
          let v = (f - h) * 0.35, T = g / h, b = p / h;
          m.x -= T * v, m.y -= b * v, c.x += T * v, c.y += b * v;
        }
      }
    }
  }
  updateVFX(s) {
    for (let a = this.redCrystals.length - 1; a >= 0; a--) {
      let l = this.redCrystals[a];
      l.life += s, l.x += l.vx * s, l.y += l.vy * s, l.vx *= 0.92, l.vy *= 0.92, l.rot += l.rotSpd * s, l.life >= l.maxLife && this.redCrystals.splice(a, 1);
    }
    for (let a = this.flameParticles.length - 1; a >= 0; a--) {
      let l = this.flameParticles[a];
      l.life += s, l.x += l.vx * s, l.y += l.vy * s, l.radius *= 0.96, l.life >= l.maxLife && this.flameParticles.splice(a, 1);
    }
    for (let a = this.smokePuffs.length - 1; a >= 0; a--) {
      let l = this.smokePuffs[a];
      l.life += s, l.x += l.vx * s, l.y += l.vy * s, l.radius += 18 * s, l.life >= l.maxLife && this.smokePuffs.splice(a, 1);
    }
    for (let a = this.scorchMarks.length - 1; a >= 0; a--) this.scorchMarks[a].life += s, this.scorchMarks[a].life >= this.scorchMarks[a].maxLife && this.scorchMarks.splice(a, 1);
    for (let a = this.frostTracks.length - 1; a >= 0; a--) this.frostTracks[a].life += s, this.frostTracks[a].life >= this.frostTracks[a].maxLife && this.frostTracks.splice(a, 1);
    for (let a = this.spatialTears.length - 1; a >= 0; a--) this.spatialTears[a].life += s, this.spatialTears[a].life >= this.spatialTears[a].maxLife && this.spatialTears.splice(a, 1);
    for (let a = this.groundCracks.length - 1; a >= 0; a--) this.groundCracks[a].life += s, this.groundCracks[a].life >= this.groundCracks[a].maxLife && this.groundCracks.splice(a, 1);
    for (let a = this.rocketProjectiles.length - 1; a >= 0; a--) {
      let l = this.rocketProjectiles[a], m = Math.hypot(l.vx * s, l.vy * s);
      if (l.x += l.vx * s, l.y += l.vy * s, l.distanceTraveled += m, l.smokeTimer += s, l.smokeTimer >= 0.03) {
        l.smokeTimer = 0;
        let g = l.x - Math.cos(l.angle) * 14, p = l.y - Math.sin(l.angle) * 14;
        this.spawnSmokePuff(g, p, 7), this.spawnFlameParticles(g, p, "red", 2, 20, 60);
      }
      let c = false;
      if (l.isFromPlayer) {
        for (let g of [...this.enemies]) if (Math.hypot(g.x - l.x, g.y - l.y) <= l.radius + g.radius) {
          c = true;
          break;
        }
      } else !l.visualOnly && Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius && (this.damagePlayer(l.damage), c = true);
      if (c || l.distanceTraveled >= l.maxDistance) {
        if (this.createCataclysmicExplosion(l.x, l.y, 90, l.color), l.isFromPlayer && !l.visualOnly) for (let g of [...this.enemies]) Math.hypot(g.x - l.x, g.y - l.y) <= 85 + g.radius && this.damageEnemy(g, l.damage, 0, 0, true);
        this.rocketProjectiles.splice(a, 1);
      }
    }
    for (let a = this.giantMeteors.length - 1; a >= 0; a--) {
      let l = this.giantMeteors[a];
      l.timer += s;
      let m = Math.min(1, l.timer / l.duration);
      if (l.currentX = l.startX + (l.targetX - l.startX) * m, l.currentY = l.startY + (l.targetY - l.startY) * m, this.spawnSmokePuff(l.currentX, l.currentY, 18), this.spawnFlameParticles(l.currentX, l.currentY, "red", 4, 40, 120), l.timer >= l.duration) {
        this.createCataclysmicExplosion(l.targetX, l.targetY, l.radius, l.color || "#F97316"), this.slashes.push({ x: l.targetX, y: l.targetY, angle: 0, radius: l.radius * 1.15, spread: Math.PI * 2, color: l.color || "#F97316", life: 0, maxLife: 0.4, kind: "shockwave" });
        for (let c = 0; c < 4; c++) this.spawnGroundCrack(l.targetX, l.targetY, Math.PI / 2 * c + 0.35, l.radius * 0.75, l.color || "#EA580C", "#FEF08A");
        if (!l.visualOnly) {
          if (l.fromPlayer === false) Math.hypot(this.player.x - l.targetX, this.player.y - l.targetY) <= l.radius + this.player.radius * 0.7 && (this.damagePlayer(l.damage), l.ccType && this.applyPlayerCC(l.ccType, l.ccDur || 0.75, 80, l.targetX, l.targetY)), this.lavaPools.push({ id: this.nextEntityId++, visualOnly: true, x: l.targetX, y: l.targetY, radius: l.radius * 0.65, timer: 0, duration: 2.6, tickTimer: 0, tickInterval: 0.5, damagePerTick: 22 });
          else for (let c of [...this.enemies]) {
            let g = Math.hypot(c.x - l.targetX, c.y - l.targetY);
            if (g <= l.radius + c.radius) {
              let p = l.damage;
              g <= 60 && (p += 45), c.kind !== "boss" && (c.stunTimer = Math.max(c.stunTimer, 1)), this.damageEnemy(c, p, 0, 0, true);
            }
          }
        }
        this.giantMeteors.splice(a, 1);
      }
    }
    for (let a = this.galaxyVortices.length - 1; a >= 0; a--) {
      let l = this.galaxyVortices[a];
      if (l.timer += s, l.tickTimer += s, l.rotation += s * (l.isGalaxy ? 2.5 : 4.6), l.fromPlayer) {
        if (l.visualOnly) {
          l.timer >= l.duration && (this.createCataclysmicExplosion(l.x, l.y, l.radius * 1.15, l.isGalaxy ? "#C084FC" : "#7C3AED"), this.galaxyVortices.splice(a, 1));
          continue;
        }
        let m = l.radius + 115, pulledMaxHp = 0;
        for (let c of this.enemies) {
          if (c.hp <= 0) continue;
          let g = l.x - c.x, p = l.y - c.y, h = Math.hypot(g, p);
          if (h <= m) {
            pulledMaxHp += c.maxHp || 0;
            if (h > 6) {
              if (this.isBossImmune(c)) this.notifyBossImmune(c, "MI\u1EC4N NHI\u1EC4M H\xDAT K\xC9O");
              else if (c.kind === "boss") {
                let f = 48 * (1 - h / (m + 40));
                c.x += g / h * f * s, c.y += p / h * f * s, c.slowFactor = Math.max(c.slowFactor, 0.45), c.slowTimer = Math.max(c.slowTimer, 0.3);
              } else {
                let f = (l.isGalaxy ? 290 : 380) + 190 * (1 - h / (m + 20)), v = g / h, T = p / h;
                c.x += v * f * s - T * 75 * s, c.y += T * f * s + v * 75 * s, c.slowFactor = Math.max(c.slowFactor, 0.55), c.slowTimer = Math.max(c.slowTimer, 0.3);
              }
            }
          }
        }
        if (this.currentHero.id === "duccong" && pulledMaxHp > 0) {
          l.pullHealAccum = (l.pullHealAccum || 0) + pulledMaxHp * 0.03 * s, l.pullHealTick = (l.pullHealTick || 0) + s;
          if (l.pullHealTick >= 0.25) {
            l.pullHealTick -= 0.25;
            let amt = Math.floor(l.pullHealAccum);
            amt >= 1 && (l.pullHealAccum -= amt, this.healPlayer(amt, "HEAL", `+${amt} HP (H\xDAT TINH T\xDA)`));
          }
        }
        if (l.tickTimer >= l.tickInterval) {
          l.tickTimer -= l.tickInterval;
          for (let c of [...this.enemies]) Math.hypot(c.x - l.x, c.y - l.y) <= l.radius + c.radius && (this.damageEnemy(c, l.damagePerTick, 0, 0, true, l.isGalaxy ? 2 : 1, l), this.isBossImmune(c) || (c.slowFactor = Math.max(c.slowFactor, 0.5), c.slowTimer = Math.max(c.slowTimer, 0.8)));
        }
        if (l.timer >= l.duration) {
          this.createCataclysmicExplosion(l.x, l.y, l.radius * 1.15, l.isGalaxy ? "#C084FC" : "#7C3AED");
          for (let c of [...this.enemies]) {
            let g = Math.hypot(c.x - l.x, c.y - l.y);
            if (g <= l.radius + c.radius) {
              let p = l.finalBurstDmg;
              g <= 65 && (p += 45), this.damageEnemy(c, p, 0, 0, true, l.isGalaxy ? 2 : 1, l);
            }
          }
          if (this.currentHero.id === "duccong" && (l.skillIdx === 1 || l.skillIdx === 2) && this.player.cooldowns[l.skillIdx] > 0.15 && this.duccong_pads) {
            this.duccong_pads[l.skillIdx] = { x: l.x, y: l.y, radius: 36, skillIdx: l.skillIdx, teleportCd: 0 };
            this.addFloatingText(l.x, l.y - 26, `\u{1F300} \xD4 D\u1ECACH CHUY\u1EC2N C${l.skillIdx + 1}`, "#C084FC", 14);
          }
          this.galaxyVortices.splice(a, 1);
        }
      } else {
        let m = l.x - this.player.x, c = l.y - this.player.y, g = Math.hypot(m, c);
        if (g > 10 && g <= l.radius + 95 && !this.player.dashActive && !(this.currentHero.id === "dung" && this.player.dung_c3_buff_timer > 0)) {
          let p = (l.isGalaxy ? 135 : 105) * (1 - g / (l.radius + 115));
          this.player.x += m / g * p * s, this.player.y += c / g * p * s;
        }
        l.tickTimer >= l.tickInterval && (l.tickTimer -= l.tickInterval, Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius && (this.damagePlayer(l.damagePerTick), this.applyPlayerCC("slow", l.ccDur ? Math.min(2.6, Math.max(0.8, l.ccDur * 0.65)) : 0.9, 0.45, l.x, l.y))), l.timer >= l.duration && (this.createCataclysmicExplosion(l.x, l.y, l.radius * 1.15, "#7C3AED"), Math.hypot(this.player.x - l.x, this.player.y - l.y) <= l.radius + this.player.radius && (this.damagePlayer(l.finalBurstDmg), this.applyPlayerCC("stun", l.ccDur || 1.6, 0, l.x, l.y)), this.galaxyVortices.splice(a, 1));
      }
    }
    for (let a = this.cataclysmicExplosions.length - 1; a >= 0; a--) {
      let l = this.cataclysmicExplosions[a];
      l.life += s, l.radius = l.maxRadius * (l.life / l.maxLife), l.life >= l.maxLife && this.cataclysmicExplosions.splice(a, 1);
    }
    for (let a = this.shadowClones.length - 1; a >= 0; a--) {
      let l = this.shadowClones[a];
      if (l.life += s, l.delay > 0) l.delay -= s;
      else if (!l.struck) {
        l.timer += s;
        let m = l.targetId ? this.enemies.find((g) => g.id === l.targetId && g.hp > 0) : null;
        m && (l.targetX = m.x, l.targetY = m.y);
        let c = Math.min(1, l.timer / l.strikeDur);
        if (Math.random() < 0.5 && this.afterimages.push({ x: l.x, y: l.y, facing: l.facing, color: "#7E22CE", alpha: 0.42, life: 0, maxLife: 0.22, radius: 17 }), l.x = l.startX + (l.targetX - l.startX) * c, l.y = l.startY + (l.targetY - l.startY) * c, l.facing = Math.atan2(l.targetY - l.startY, l.targetX - l.startX), c >= 1) {
          l.struck = true, R.playDaggerSlash(l.cloneIdx % 3), this.slashes.push({ x: l.targetX, y: l.targetY, angle: l.facing, radius: 82, spread: 1.55, dir: l.cloneIdx % 2 === 0 ? 1 : -1, color: "#E879F9", life: 0, maxLife: 0.22, kind: "bao_slash" });
          if (!l.visualOnly) {
            let g = m || this.findNearestEnemy(90, l.targetX, l.targetY);
            g && (this.damageEnemy(g, l.dmg, 0, 0, true), g.hp > 0 && this.applyBaoMark(g, 1));
          }
        }
      } else if (!l.dissolved && l.life >= l.maxLife - 0.14) {
        l.dissolved = true;
        for (let k = 0; k < 4; k++) this.spawnSmokePuff(l.x + (Math.random() - 0.5) * 18, l.y + (Math.random() - 0.5) * 18, 10, "rgba(168, 85, 247, 0.45)");
      }
      l.life >= l.maxLife && this.shadowClones.splice(a, 1);
    }
    for (let a = this.dragonWaves.length - 1; a >= 0; a--) {
      let l = this.dragonWaves[a], m = l.vx * s, c = l.vy * s;
      l.x += m, l.y += c, l.distanceTraveled += Math.hypot(m, c), Math.random() < 0.65 && this.spawnFlameParticles(l.x, l.y, "red", 2, 30, 90);
      if (!l.visualOnly) {
        for (let g of [...this.enemies]) l.hitIds.has(g.id) || Math.hypot(g.x - l.x, g.y - l.y) <= l.width + g.radius && (l.hitIds.add(g.id), this.damageEnemy(g, l.damage, Math.cos(l.angle) * 20, Math.sin(l.angle) * 20, true), l.empowered && !l.grantedThienPhat && this.currentHero.id === "danh" && (l.grantedThienPhat = true, this.player.danh_thienPhatTimer = 4, this.addFloatingText(this.player.x, this.player.y - 36, "\u{1F525} THI\xCAN PH\u1EA0T (4s)!", "#FBBF24", 15)));
      }
      l.distanceTraveled >= l.maxDistance && this.dragonWaves.splice(a, 1);
    }
    for (let a = this.skyDragons.length - 1; a >= 0; a--) {
      let l = this.skyDragons[a];
      if (l.timer += s, !l.impacted && l.timer >= l.duration) {
        l.impacted = true, R.playDragonRoar(), R.playExplosion(), this.addShake(l.empowered ? 20 : 14, 0.45), this.createCataclysmicExplosion(l.x, l.y, l.radius, l.empowered ? "#FBBF24" : "#DC2626"), this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: l.radius * 1.15, spread: Math.PI * 2, color: l.empowered ? "#FBBF24" : "#EF4444", life: 0, maxLife: 0.45, kind: "danh_dragon_shockring" }), this.slashes.push({ x: l.x, y: l.y, angle: 0, radius: l.radius * 0.78, spread: Math.PI * 2, color: "#FEF08A", life: 0, maxLife: 0.34, kind: "shockwave" });
        for (let c = 0; c < 5; c++) this.spawnGroundCrack(l.x, l.y, Math.PI * 2 / 5 * c, l.radius * 0.85, "#DC2626", "#FDE047");
        if (!l.visualOnly) {
          let m = 0;
          for (let c of [...this.enemies]) Math.hypot(c.x - l.x, c.y - l.y) <= l.radius + c.radius && (m++, this.damageEnemy(c, l.damage, 0, 0, true));
          this.zones.push({ id: this.nextEntityId++, kind: "danh_dragon_fire", x: l.x, y: l.y, radius: l.radius * 0.88, timer: 0, duration: 3, tickTimer: 0, tickInterval: 0.5, damagePerTick: Math.round(l.burnDps * 0.5), rotation: 0 }), this.comboManager.record({ heroId: "danh", action: "c3", hitCount: m, empowered: l.empowered, damageDealt: l.damage * Math.max(1, m) });
        } else {
          this.zones.push({ id: this.nextEntityId++, visualOnly: true, kind: "danh_dragon_fire", x: l.x, y: l.y, radius: l.radius * 0.88, timer: 0, duration: 3, tickTimer: 0, tickInterval: 0.5, damagePerTick: 0, rotation: 0 });
        }
      }
      l.timer >= l.duration + 0.45 && this.skyDragons.splice(a, 1);
    }
    for (let a = this.deadCorpses.length - 1; a >= 0; a--) this.deadCorpses[a].timer += s, this.deadCorpses[a].timer >= this.deadCorpses[a].maxLife && this.deadCorpses.splice(a, 1);
    for (let a = this.bloodParticles.length - 1; a >= 0; a--) {
      let l = this.bloodParticles[a];
      l.life += s, l.x += l.vx * s, l.y += l.vy * s, l.vy += l.gravity * s, l.vx *= 0.92, l.vy *= 0.92, l.life >= l.maxLife && this.bloodParticles.splice(a, 1);
    }
    for (let a = this.afterimages.length - 1; a >= 0; a--) this.afterimages[a].life += s, this.afterimages[a].life >= this.afterimages[a].maxLife && this.afterimages.splice(a, 1);
    for (let a = this.lightnings.length - 1; a >= 0; a--) this.lightnings[a].life += s, this.lightnings[a].life >= this.lightnings[a].maxLife && this.lightnings.splice(a, 1);
    for (let a = this.slashes.length - 1; a >= 0; a--) this.slashes[a].life += s, this.slashes[a].life >= this.slashes[a].maxLife && this.slashes.splice(a, 1);
    for (let a = this.impactBursts.length - 1; a >= 0; a--) this.impactBursts[a].life += s, this.impactBursts[a].life >= this.impactBursts[a].maxLife && this.impactBursts.splice(a, 1);
    for (let a = this.particles.length - 1; a >= 0; a--) {
      let l = this.particles[a];
      l.life += s, l.x += l.vx * s, l.y += l.vy * s, l.vx *= 0.94, l.vy *= 0.94, l.life >= l.maxLife && this.particles.splice(a, 1);
    }
    for (let a = this.floatingTexts.length - 1; a >= 0; a--) {
      let l = this.floatingTexts[a];
      l.life += s, l.y += l.vy * s, l.vy *= 0.94, l.life >= l.maxLife && this.floatingTexts.splice(a, 1);
    }
  }
  drawAimIndicator() {
    let s = this.aimState.cancelled, a = this.checkAimHasTarget(this.aimState.angle, this.aimState.range, this.aimState.aimType || "LINE");
    this.aimState.hasTargetInRange = a;
    let l = s ? "#EF4444" : a ? "#F59E0B" : this.currentHero.accentColor, m = s ? "rgba(239, 68, 68, 0.25)" : a ? "rgba(245, 158, 11, 0.22)" : "rgba(56, 189, 248, 0.16)", c = this.ctx;
    if (c.save(), this.aimState.aimType === "LINE") {
      c.translate(this.player.x, this.player.y), c.rotate(this.aimState.angle);
      let g = this.aimState.range, p = g - Math.min(75, g * 0.28), h = c.createLinearGradient(0, 0, g, 0);
      h.addColorStop(0, "rgba(15, 23, 42, 0.1)"), h.addColorStop(0.6, m), h.addColorStop(1, a ? "rgba(245, 158, 11, 0.45)" : "rgba(56, 189, 248, 0.45)"), c.fillStyle = h, c.strokeStyle = l, c.lineWidth = 3, c.beginPath(), c.moveTo(0, -16), c.lineTo(p, -16), c.lineTo(p, -29), c.lineTo(g, 0), c.lineTo(p, 29), c.lineTo(p, 16), c.lineTo(0, 16), c.closePath(), c.fill(), c.stroke(), c.beginPath(), c.moveTo(p + 10, -21), c.lineTo(g - 22, 0), c.lineTo(p + 10, 21), c.strokeStyle = s ? "#FCA5A5" : a ? "#FEF08A" : "#FFFFFF", c.lineWidth = 3.2, c.stroke();
      let f = Math.max(2, Math.floor(p / 42)), v = this.elapsedTime * 3.5 % 1;
      for (let T = 1; T <= f; T++) {
        let b = (T + v) % (f + 1) * (p / f);
        b > 10 && b < p - 5 && (c.beginPath(), c.moveTo(b - 10, -10), c.lineTo(b + 5, 0), c.lineTo(b - 10, 10), c.strokeStyle = s ? "rgba(239, 68, 68, 0.7)" : a ? "rgba(254, 240, 138, 0.75)" : "rgba(255, 255, 255, 0.65)", c.lineWidth = 2.4, c.stroke());
      }
    } else if (this.aimState.aimType === "CONE") {
      c.translate(this.player.x, this.player.y), c.beginPath(), c.moveTo(0, 0), c.arc(0, 0, this.aimState.range, this.aimState.angle - 0.85, this.aimState.angle + 0.85), c.closePath(), c.fillStyle = m, c.fill(), c.strokeStyle = l, c.lineWidth = 3, c.stroke(), c.beginPath();
      let g = this.aimState.angle, p = this.aimState.range * 0.85;
      c.arc(0, 0, p, g - 0.5, g + 0.5), c.strokeStyle = a ? "#FEF08A" : "rgba(255, 255, 255, 0.6)", c.lineWidth = 2.5, c.stroke();
    } else if (this.aimState.aimType === "CIRCLE_SELF") c.beginPath(), c.arc(this.player.x, this.player.y, this.aimState.radius, 0, Math.PI * 2), c.fillStyle = m, c.fill(), c.strokeStyle = l, c.lineWidth = 3, c.stroke();
    else if (this.aimState.aimType === "CIRCLE_FREE") c.setLineDash([8, 6]), c.strokeStyle = l, c.lineWidth = 2, c.beginPath(), c.moveTo(this.player.x, this.player.y), c.lineTo(this.aimState.targetX, this.aimState.targetY), c.stroke(), c.setLineDash([]), c.beginPath(), c.arc(this.aimState.targetX, this.aimState.targetY, this.aimState.radius, 0, Math.PI * 2), c.fillStyle = m, c.fill(), c.strokeStyle = l, c.lineWidth = 3, c.stroke(), c.strokeStyle = s ? "#EF4444" : a ? "#FEF08A" : "#FFFFFF", c.lineWidth = 1.8, c.beginPath(), c.moveTo(this.aimState.targetX - 18, this.aimState.targetY), c.lineTo(this.aimState.targetX + 18, this.aimState.targetY), c.moveTo(this.aimState.targetX, this.aimState.targetY - 18), c.lineTo(this.aimState.targetX, this.aimState.targetY + 18), c.stroke(), c.beginPath(), c.arc(this.aimState.targetX, this.aimState.targetY, 12, 0, Math.PI * 2), c.stroke();
    else if (this.aimState.aimType === "TARGET") {
      c.beginPath(), c.arc(this.player.x, this.player.y, this.aimState.range, 0, Math.PI * 2), c.strokeStyle = "rgba(244, 63, 94, 0.35)", c.lineWidth = 2, c.stroke();
      let g = this.findTargetForTinC3(this.aimState.angle, this.aimState.range);
      g && (c.beginPath(), c.moveTo(this.player.x, this.player.y), c.lineTo(g.x, g.y), c.strokeStyle = l, c.lineWidth = 2.5, c.stroke(), c.beginPath(), c.arc(g.x, g.y, g.radius + 14, 0, Math.PI * 2), c.stroke());
    }
    c.restore();
  }
  drawBossEntity(s) {
    let safeR = Math.max(24, Number(s.radius) || 46);
    if (!(s.radius >= 24)) s = { ...s, radius: safeR };
    let a = this.ctx;
    a.save(), a.translate(s.x, s.y);
    let l = s.hitFlash > 0, m = this.elapsedTime;
    a.save(), a.rotate(m * 0.45), a.beginPath(), a.arc(0, 0, safeR * 1.55, 0, Math.PI * 2), a.strokeStyle = "rgba(239, 68, 68, 0.45)", a.lineWidth = 2.5, a.setLineDash([14, 8, 4, 8]), a.stroke();
    for (let c = 0; c < 8; c++) {
      let g = Math.PI * 2 / 8 * c, p = Math.cos(g) * (safeR * 1.55), h = Math.sin(g) * (safeR * 1.55);
      a.beginPath(), a.arc(p, h, 4, 0, Math.PI * 2), a.fillStyle = "#EF4444", a.fill();
    }
    if (a.restore(), a.beginPath(), a.ellipse(0, safeR * 0.78, safeR * 1.05, safeR * 0.45, 0, 0, Math.PI * 2), a.fillStyle = "rgba(0, 0, 0, 0.55)", a.fill(), s.bossWave === 3) {
      a.beginPath();
      let c = s.radius;
      a.moveTo(-c * 0.75, -c * 0.8), a.lineTo(c * 0.75, -c * 0.8), a.lineTo(c * 1.05, 0), a.lineTo(c * 0.8, c * 0.95), a.lineTo(-c * 0.8, c * 0.95), a.lineTo(-c * 1.05, 0), a.closePath(), a.fillStyle = l ? "#FFFFFF" : s.phase === 3 ? "#44403C" : "#57534E", a.fill(), a.strokeStyle = "#10B981", a.lineWidth = 3.5, a.stroke(), a.fillStyle = "#15803D", a.beginPath(), a.arc(-c * 0.35, -c * 0.45, c * 0.28, 0, Math.PI * 2), a.fill(), a.beginPath(), a.arc(c * 0.4, c * 0.35, c * 0.22, 0, Math.PI * 2), a.fill();
      for (let p of [-1, 1]) a.save(), a.translate(p * c * 0.95, -c * 0.35), a.fillStyle = "#292524", a.beginPath(), a.arc(0, 0, c * 0.48, 0, Math.PI * 2), a.fill(), a.strokeStyle = "#78716C", a.lineWidth = 3, a.stroke(), a.fillStyle = "#10B981", a.beginPath(), a.moveTo(0, -c * 0.4), a.lineTo(p * c * 0.3, -c * 0.85), a.lineTo(p * c * 0.5, -c * 0.3), a.closePath(), a.fill(), a.strokeStyle = "#6EE7B7", a.lineWidth = 1.8, a.stroke(), a.restore();
      let g = 0.82 + 0.24 * Math.sin(m * 5);
      a.beginPath(), a.arc(0, 0, c * 0.38 * g, 0, Math.PI * 2), a.fillStyle = "#10B981", a.fill(), a.strokeStyle = "#A7F3D0", a.lineWidth = 3, a.stroke(), a.beginPath(), a.arc(0, 0, c * 0.18, 0, Math.PI * 2), a.fillStyle = "#FFFFFF", a.fill(), a.fillStyle = "#34D399", a.fillRect(-c * 0.42, -c * 0.6, c * 0.26, 6), a.fillRect(c * 0.16, -c * 0.6, c * 0.26, 6);
    } else if (s.bossWave === 6) {
      let c = Math.sin(m * 7) * 0.38;
      for (let g of [-1, 1]) {
        a.save(), a.translate(g * s.radius * 0.55, -s.radius * 0.15), a.rotate(g * (0.45 + c)), a.beginPath(), a.moveTo(0, 0), a.lineTo(g * s.radius * 1.6, -s.radius * 1.25), a.lineTo(g * s.radius * 1.2, -s.radius * 0.1), a.lineTo(g * s.radius * 1.45, s.radius * 0.55), a.closePath();
        let p = a.createLinearGradient(0, 0, g * s.radius * 1.6, -s.radius * 1.2);
        p.addColorStop(0, "#991B1B"), p.addColorStop(0.5, "#EA580C"), p.addColorStop(1, "#FEF08A"), a.fillStyle = p, a.fill(), a.strokeStyle = "#EF4444", a.lineWidth = 3, a.stroke(), a.restore();
      }
      a.beginPath(), a.arc(0, 0, s.radius, 0, Math.PI * 2), a.fillStyle = l ? "#FFFFFF" : "#7F1D1D", a.fill(), a.strokeStyle = "#F97316", a.lineWidth = 4, a.stroke(), a.fillStyle = "#F59E0B", a.beginPath(), a.ellipse(0, s.radius * 0.15, s.radius * 0.45, s.radius * 0.65, 0, 0, Math.PI * 2), a.fill();
      for (let g of [-1, 1]) a.strokeStyle = "#FDE047", a.lineWidth = 4.5, a.beginPath(), a.moveTo(g * s.radius * 0.4, -s.radius * 0.65), a.quadraticCurveTo(g * s.radius * 1.05, -s.radius * 1.35, g * s.radius * 0.75, -s.radius * 1.7), a.stroke();
      a.fillStyle = "#FEF08A", a.beginPath(), a.arc(-s.radius * 0.28, -s.radius * 0.35, 5.5, 0, Math.PI * 2), a.fill(), a.beginPath(), a.arc(s.radius * 0.28, -s.radius * 0.35, 5.5, 0, Math.PI * 2), a.fill(), a.fillStyle = "#EA580C", a.beginPath(), a.arc(0, s.radius * 0.35, 8.5, 0, Math.PI * 2), a.fill();
    } else if (s.bossWave === 9) {
      let c = Math.sin(m * 3) * 5;
      a.translate(0, c);
      for (let p = 0; p < 4; p++) {
        let h = m * 2.2 + Math.PI * 2 / 4 * p, f = Math.cos(h) * (s.radius * 1.55), v = Math.sin(h) * (s.radius * 1.55) * 0.6;
        a.save(), a.translate(f, v), a.rotate(m * 4), a.fillStyle = "#BAE6FD", a.beginPath(), a.moveTo(0, -7), a.lineTo(7, 0), a.lineTo(0, 7), a.lineTo(-7, 0), a.closePath(), a.fill(), a.strokeStyle = "#FFFFFF", a.lineWidth = 1.8, a.stroke(), a.restore();
      }
      a.beginPath(), a.moveTo(0, -s.radius * 0.5), a.lineTo(s.radius * 0.95, s.radius * 0.85), a.lineTo(s.radius * 0.45, s.radius * 1.15), a.lineTo(0, s.radius * 0.9), a.lineTo(-s.radius * 0.45, s.radius * 1.15), a.lineTo(-s.radius * 0.95, s.radius * 0.85), a.closePath();
      let g = a.createLinearGradient(0, -s.radius, 0, s.radius);
      g.addColorStop(0, "#E0F2FE"), g.addColorStop(0.5, "#38BDF8"), g.addColorStop(1, "#0284C7"), a.fillStyle = l ? "#FFFFFF" : g, a.fill(), a.strokeStyle = "#E0F2FE", a.lineWidth = 3.5, a.stroke(), a.beginPath(), a.arc(0, -s.radius * 0.25, s.radius * 0.42, 0, Math.PI * 2), a.fillStyle = l ? "#FFFFFF" : "#BAE6FD", a.fill(), a.strokeStyle = "#38BDF8", a.lineWidth = 2.5, a.stroke(), a.fillStyle = "#FFFFFF";
      for (let p = -2; p <= 2; p++) a.beginPath(), a.moveTo(p * 7, -s.radius * 0.6), a.lineTo(p * 7, -s.radius * 0.6 - (14 - Math.abs(p) * 3)), a.lineTo(p * 7 + 4, -s.radius * 0.6), a.closePath(), a.fill();
      a.fillStyle = "#0284C7", a.fillRect(-8, -s.radius * 0.28, 4, 3), a.fillRect(4, -s.radius * 0.28, 4, 3);
    } else if (s.bossWave === 12) {
      for (let c = 0; c < 6; c++) {
        let g = Math.PI * 2 / 6 * c, p = Math.sin(m * 4.5 + c * 1.2) * 16;
        a.save(), a.rotate(g), a.strokeStyle = "#A855F7", a.lineWidth = 3.5, a.beginPath(), a.moveTo(s.radius * 0.6, 0), a.bezierCurveTo(s.radius * 1.1, p, s.radius * 1.4, -p, s.radius * 1.75, p * 0.5), a.stroke(), a.fillStyle = "#E9D5FF", a.beginPath(), a.arc(s.radius * 1.75, p * 0.5, 4, 0, Math.PI * 2), a.fill(), a.restore();
      }
      a.beginPath(), a.arc(0, 0, s.radius, 0, Math.PI * 2), a.fillStyle = l ? "#FFFFFF" : "#1E1B4B", a.fill(), a.strokeStyle = "#9333EA", a.lineWidth = 4, a.stroke(), a.beginPath(), a.arc(0, 0, s.radius * 0.55, 0, Math.PI * 2), a.fillStyle = "#3B0764", a.fill(), a.strokeStyle = "#C084FC", a.lineWidth = 2.5, a.stroke(), a.fillStyle = "#F8FAFC", a.beginPath(), a.ellipse(0, -s.radius * 0.1, s.radius * 0.38, s.radius * 0.5, 0, 0, Math.PI * 2), a.fill(), a.strokeStyle = "#38BDF8", a.lineWidth = 1.5, a.beginPath(), a.moveTo(-6, -s.radius * 0.35), a.lineTo(3, 0), a.lineTo(-2, s.radius * 0.2), a.stroke(), a.fillStyle = "#06B6D4", a.beginPath(), a.arc(-8, -s.radius * 0.12, 3.5, 0, Math.PI * 2), a.fill(), a.beginPath(), a.arc(8, -s.radius * 0.12, 3.5, 0, Math.PI * 2), a.fill(), a.beginPath(), a.arc(0, -s.radius * 0.3, 4, 0, Math.PI * 2), a.fill();
    } else if (s.bossWave === 15) {
      // Wave 15 Mid-Boss: Pháo Vương Cơ Giới Rex — Armored Siege Automaton
      let r = s.radius;
      a.save();
      a.rotate(m * 1.2);
      a.strokeStyle = "#38BDF8";
      a.lineWidth = 2.6;
      a.setLineDash([10, 6]);
      a.beginPath();
      a.arc(0, 0, r * 1.38, 0, Math.PI * 2);
      a.stroke();
      a.setLineDash([]);
      a.restore();
      // Shoulder exhaust pistons
      for (let p of [-1, 1]) {
        a.fillStyle = "#1E293B";
        a.strokeStyle = "#64748B";
        a.lineWidth = 2.4;
        a.fillRect(p * r * 0.75 - 10, -r * 0.55, 20, r * 0.85);
        a.strokeRect(p * r * 0.75 - 10, -r * 0.55, 20, r * 0.85);
      }
      // Octagonal steel hull
      a.beginPath();
      for (let i = 0; i < 8; i++) {
        let ang = Math.PI / 4 * i + Math.PI / 8;
        let px = Math.cos(ang) * r, py = Math.sin(ang) * r;
        i === 0 ? a.moveTo(px, py) : a.lineTo(px, py);
      }
      a.closePath();
      a.fillStyle = l ? "#FFFFFF" : "#334155";
      a.fill();
      a.strokeStyle = "#38BDF8";
      a.lineWidth = 3.5;
      a.stroke();
      // Glowing arc reactor core
      a.beginPath();
      a.arc(0, 0, r * 0.42, 0, Math.PI * 2);
      a.fillStyle = s.phase >= 2 ? "#F59E0B" : "#0EA5E9";
      a.fill();
      a.strokeStyle = "#E0F2FE";
      a.lineWidth = 2.2;
      a.stroke();
      a.fillStyle = "#FEF08A";
      a.fillRect(-r * 0.32, -r * 0.48, r * 0.64, 5);
    } else if (s.bossWave === 18) {
      // Wave 18 Boss: Lôi Thần Thiên Khải — Thunder Archon Raijin
      let r = s.radius;
      // Orbiting 6 thunder drums halo behind boss
      for (let i = 0; i < 6; i++) {
        let ang = m * 1.4 + Math.PI * 2 / 6 * i;
        let dx = Math.cos(ang) * r * 1.35, dy = Math.sin(ang) * r * 1.35;
        a.fillStyle = "#0369A1";
        a.strokeStyle = "#FDE047";
        a.lineWidth = 2;
        a.beginPath();
        a.arc(dx, dy, 8.5, 0, Math.PI * 2);
        a.fill();
        a.stroke();
      }
      a.beginPath();
      a.arc(0, 0, r, 0, Math.PI * 2);
      a.fillStyle = l ? "#FFFFFF" : "#0C4A6E";
      a.fill();
      a.strokeStyle = "#38BDF8";
      a.lineWidth = 4;
      a.stroke();
      // Golden lightning crest
      a.strokeStyle = "#FDE047";
      a.lineWidth = 3.5;
      a.beginPath();
      a.moveTo(-r * 0.5, -r * 0.55);
      a.lineTo(0, -r * 1.25);
      a.lineTo(r * 0.5, -r * 0.55);
      a.stroke();
      a.fillStyle = "#FDE047";
      a.beginPath();
      a.arc(-r * 0.25, -r * 0.2, 4.5, 0, Math.PI * 2);
      a.arc(r * 0.25, -r * 0.2, 4.5, 0, Math.PI * 2);
      a.fill();
    } else if (s.bossWave === 21) {
      // Wave 21 Boss: Độc Long Ác Ma — Abyssal Venom Wyrm
      let r = s.radius;
      // Serrated toxic dorsal fins
      for (let p of [-1, 1]) {
        a.fillStyle = "#166534";
        a.strokeStyle = "#A3E635";
        a.lineWidth = 2.4;
        a.beginPath();
        a.moveTo(p * r * 0.5, -r * 0.4);
        a.lineTo(p * r * 1.45, -r * 0.9);
        a.lineTo(p * r * 1.15, r * 0.3);
        a.closePath();
        a.fill();
        a.stroke();
      }
      a.beginPath();
      a.arc(0, 0, r, 0, Math.PI * 2);
      a.fillStyle = l ? "#FFFFFF" : "#14532D";
      a.fill();
      a.strokeStyle = "#84CC16";
      a.lineWidth = 4;
      a.stroke();
      // Pulsing venom sacs
      let vp = 0.85 + 0.2 * Math.sin(m * 6);
      a.fillStyle = "#A3E635";
      a.beginPath();
      a.arc(0, r * 0.2, r * 0.38 * vp, 0, Math.PI * 2);
      a.fill();
      a.fillStyle = "#BEF264";
      a.beginPath();
      a.arc(-r * 0.28, -r * 0.3, 4.8, 0, Math.PI * 2);
      a.arc(r * 0.28, -r * 0.3, 4.8, 0, Math.PI * 2);
      a.fill();
    } else if (s.bossWave === 24) {
      // Wave 24 Boss: Huyết Ma Bá Chủ — Crimson Blood Sovereign
      let r = s.radius;
      // Sweeping bat-wing crimson cloak
      for (let p of [-1, 1]) {
        a.fillStyle = "#4C0519";
        a.strokeStyle = "#FB7185";
        a.lineWidth = 2.6;
        a.beginPath();
        a.moveTo(0, -r * 0.2);
        a.lineTo(p * r * 1.65, -r * 1.05);
        a.lineTo(p * r * 1.3, 0);
        a.lineTo(p * r * 1.45, r * 0.75);
        a.lineTo(p * r * 0.5, r * 0.45);
        a.closePath();
        a.fill();
        a.stroke();
      }
      // Blood-moon crescent sigil behind head
      a.strokeStyle = "#F43F5E";
      a.lineWidth = 4;
      a.beginPath();
      a.arc(0, -r * 0.35, r * 0.9, 0.35, Math.PI - 0.35, true);
      a.stroke();
      a.beginPath();
      a.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      a.fillStyle = l ? "#FFFFFF" : "#881337";
      a.fill();
      a.strokeStyle = "#FDA4AF";
      a.lineWidth = 3.5;
      a.stroke();
      a.fillStyle = "#FEF08A";
      a.beginPath();
      a.arc(-r * 0.26, -r * 0.24, 4.5, 0, Math.PI * 2);
      a.arc(r * 0.26, -r * 0.24, 4.5, 0, Math.PI * 2);
      a.fill();
    } else {
      // Wave 27 Final Boss: Thiên Thần Sa Ngã Lucifer — Six-Winged Fallen Seraphim
      let r = s.radius;
      a.save();
      a.rotate(m * 0.85);
      a.beginPath();
      a.arc(0, 0, r * 1.7, 0, Math.PI * 2);
      a.strokeStyle = "#FBBF24";
      a.lineWidth = 3;
      a.setLineDash([14, 7]);
      a.stroke();
      a.setLineDash([]);
      for (let g = 0; g < 12; g++) {
        let p = Math.PI * 2 / 12 * g, h = Math.cos(p) * (r * 1.7), f = Math.sin(p) * (r * 1.7);
        a.fillStyle = g % 2 == 0 ? "#FBBF24" : "#DC2626";
        a.beginPath();
        a.arc(h, f, 4.8, 0, Math.PI * 2);
        a.fill();
      }
      a.restore();
      // 6 sweeping Seraphim wings (3 pairs!)
      for (let g of [-1, 1]) {
        for (let idx = 0; idx < 3; idx++) {
          let p = 0.65 + idx * 0.32;
          let wy = -r * 0.35 + idx * r * 0.26;
          a.save();
          a.translate(g * r * 0.55, wy);
          a.rotate(g * (0.45 * p + Math.sin(m * 4.2 + idx) * 0.16));
          a.fillStyle = idx === 1 ? "#311042" : "#09090B";
          a.beginPath();
          a.moveTo(0, 0);
          a.lineTo(g * r * 1.55 * p, -r * 1.1 * p);
          a.lineTo(g * r * 1.15 * p, r * 0.15);
          a.closePath();
          a.fill();
          a.strokeStyle = idx === 0 ? "#FBBF24" : "#DC2626";
          a.lineWidth = 2.6;
          a.stroke();
          a.restore();
        }
      }
      // Celestial-obsidian armor core & broken golden halo crown
      a.beginPath();
      a.arc(0, 0, r, 0, Math.PI * 2);
      a.fillStyle = l ? "#FFFFFF" : "#1E1B4B";
      a.fill();
      a.strokeStyle = "#FBBF24";
      a.lineWidth = 4.5;
      a.stroke();
      a.strokeStyle = "#DC2626";
      a.lineWidth = 2.6;
      a.strokeRect(-r * 0.42, -r * 0.42, r * 0.84, r * 0.84);
      // Floating halo crown
      a.strokeStyle = "#FEF08A";
      a.lineWidth = 3.2;
      a.beginPath();
      a.ellipse(0, -r * 1.18, r * 0.58, r * 0.2, 0, 0, Math.PI * 2);
      a.stroke();
      a.fillStyle = "#FBBF24";
      a.fillRect(-r * 0.32, -r * 0.32, 7.5, 4.5);
      a.fillRect(r * 0.16, -r * 0.32, 7.5, 4.5);
    }
    drawBossWeapon(a, s, m, this.player.tin_monochrome_realm_timer > 0);
    a.restore();
  }
  render() {
    let s = Math.min(window.devicePixelRatio || 1, 2), a = this.ctx;
    a.save(), a.setTransform(s, 0, 0, s, 0, 0), a.fillStyle = "#070B14", a.fillRect(0, 0, this.viewW, this.viewH);
    let l = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMagnitude * 2 : 0, m = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMagnitude * 2 : 0;
    let vp = this.getCameraViewport();
    a.translate(Math.round(vp.focusX + l), Math.round(vp.focusY + m));
    if (vp.zoom !== 1) a.scale(vp.zoom, vp.zoom);
    a.translate(-this.camera.x, -this.camera.y);
    let c = this.player.tin_monochrome_realm_timer > 0;
    a.fillStyle = c ? "#FFFFFF" : "#0F172A", a.fillRect(0, 0, Se, Ce), a.strokeStyle = c ? "rgba(0, 0, 0, 0.25)" : "rgba(148, 163, 184, 0.07)", a.lineWidth = 1, a.beginPath();
    for (let h = 0; h <= Se; h += 100) a.moveTo(h, 0), a.lineTo(h, Ce);
    for (let h = 0; h <= Ce; h += 100) a.moveTo(0, h), a.lineTo(Se, h);
    a.stroke();
    let g = Se / 2, p = Ce / 2;
    a.strokeStyle = c ? "rgba(0, 0, 0, 0.35)" : "rgba(245, 158, 11, 0.18)", a.lineWidth = 2, a.beginPath(), a.arc(g, p, 240, 0, Math.PI * 2), a.stroke(), a.strokeStyle = c ? "#000000" : "#F59E0B", a.lineWidth = 4, a.strokeRect(8, 8, Se - 16, Ce - 16);
    for (let h of this.scorchMarks) {
      let f = Math.max(0, 1 - h.life / h.maxLife);
      a.save(), a.globalAlpha = f * 0.7, a.translate(h.x, h.y), a.rotate(h.angle), a.fillStyle = "#1C1917", a.fillRect(0, -12, h.len, 24), a.strokeStyle = "#F97316", a.lineWidth = 2, a.strokeRect(0, -12, h.len, 24), a.restore();
    }
    for (let h of this.groundCracks) drawGroundCrack(a, h, this.elapsedTime, c);
    for (let h of this.lavaPools) {
      a.save(), a.globalAlpha = Math.min(1, (h.duration - h.timer) / 0.5);
      let f = a.createRadialGradient(h.x, h.y, 10, h.x, h.y, h.radius);
      f.addColorStop(0, "#FEF08A"), f.addColorStop(0.3, "#F97316"), f.addColorStop(0.7, "#DC2626"), f.addColorStop(1, "rgba(69, 26, 3, 0)"), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = f, a.fill(), a.strokeStyle = "#EA580C", a.lineWidth = 3, a.stroke(), a.restore();
    }
    for (let h of this.icePillars) {
      a.save();
      let f = h.x, v = h.y, T = 1, b = h.rot;
      if (h.state === "rising") T = Math.max(0.08, h.riseProgress);
      else if (h.state === "plunging") v = h.y - h.plungeOffset;
      else if (h.state === "levitating") {
        let x = Math.sin(this.elapsedTime * 8 + h.x * 0.1) * 4;
        v = h.y - h.levitateHeight + x, h.levitateTarget && (b = Math.atan2(h.levitateTarget.y - h.y, h.levitateTarget.x - h.x) + Math.PI / 2);
      } else h.state === "launching" && (b = Math.atan2(h.launchVy || 0, h.launchVx || 1) + Math.PI / 2);
      a.save(), a.translate(h.x, h.y), a.beginPath(), a.ellipse(0, 3, h.size * 1.2, h.size * 0.45, 0, 0, Math.PI * 2), a.fillStyle = "rgba(0, 0, 0, 0.4)", a.fill(), a.strokeStyle = "rgba(56, 189, 248, 0.45)", a.lineWidth = 1.5, a.beginPath(), a.arc(0, 0, h.size * 1.3, 0, Math.PI * 2), a.stroke();
      for (let x = 0; x < 4; x++) {
        let C = Math.PI / 2 * x;
        a.beginPath(), a.moveTo(0, 0), a.lineTo(Math.cos(C) * h.size * 1.2, Math.sin(C) * h.size * 1.2), a.stroke();
      }
      if (a.restore(), a.translate(f, v), a.rotate(b), a.scale(1, T), h.state === "plunging") a.strokeStyle = "rgba(186, 230, 253, 0.6)", a.lineWidth = 3, a.beginPath(), a.moveTo(0, 0), a.lineTo(0, -60), a.stroke();
      else if (h.state === "launching") {
        let x = a.createLinearGradient(0, 0, 0, h.size * 3.5);
        x.addColorStop(0, "rgba(56, 189, 248, 0.85)"), x.addColorStop(1, "rgba(255, 255, 255, 0)"), a.fillStyle = x, a.beginPath(), a.moveTo(-h.size * 0.4, 0), a.lineTo(h.size * 0.4, 0), a.lineTo(0, h.size * 3.5), a.closePath(), a.fill();
      } else h.state === "levitating" && (a.save(), a.rotate(this.elapsedTime * 5), a.strokeStyle = "#BAE6FD", a.lineWidth = 2, a.beginPath(), a.arc(0, -h.size * 0.5, h.size * 1.2, 0, Math.PI * 2), a.setLineDash([4, 4]), a.stroke(), a.restore());
      a.fillStyle = c ? "#333333" : "#0284C7", a.beginPath(), a.moveTo(0, -h.size * 2.2), a.lineTo(-h.size * 0.7, -h.size * 0.2), a.lineTo(-h.size * 0.5, h.size * 0.6), a.lineTo(0, h.size * 0.8), a.closePath(), a.fill(), a.fillStyle = c ? "#111111" : "#38BDF8", a.beginPath(), a.moveTo(0, -h.size * 2.2), a.lineTo(h.size * 0.7, -h.size * 0.2), a.lineTo(h.size * 0.5, h.size * 0.6), a.lineTo(0, h.size * 0.8), a.closePath(), a.fill(), a.fillStyle = c ? "#555555" : "#7DD3FC", a.beginPath(), a.moveTo(0, -h.size * 2.2), a.lineTo(h.size * 0.25, -h.size * 0.1), a.lineTo(0, h.size * 0.8), a.lineTo(-h.size * 0.25, -h.size * 0.1), a.closePath(), a.fill(), a.strokeStyle = c ? "#000000" : "#E0F2FE", a.lineWidth = 1.8, a.beginPath(), a.moveTo(0, -h.size * 2.2), a.lineTo(h.size * 0.7, -h.size * 0.2), a.lineTo(h.size * 0.5, h.size * 0.6), a.lineTo(0, h.size * 0.8), a.lineTo(-h.size * 0.5, h.size * 0.6), a.lineTo(-h.size * 0.7, -h.size * 0.2), a.closePath(), a.stroke(), a.strokeStyle = "#FFFFFF", a.lineWidth = 1.5, a.beginPath(), a.moveTo(0, -h.size * 2.2), a.lineTo(0, h.size * 0.8), a.stroke(), a.fillStyle = "#FFFFFF", a.beginPath(), a.arc(0, -h.size * 2.2, 2.5, 0, Math.PI * 2), a.fill(), a.restore();
    }
    for (let h of this.spatialTears) {
      let f = Math.max(0, 1 - h.life / h.maxLife);
      a.save(), a.globalAlpha = f;
      let v = h.x2 - h.x1, T = h.y2 - h.y1, b = Math.atan2(T, v), x = -Math.sin(b), C = Math.cos(b), H = h.offsets && h.offsets.length > 0 ? h.offsets : [-6, 9, -12, 8, -4], D = H.length;
      a.strokeStyle = c ? "rgba(0, 0, 0, 0.6)" : h.color || "#E11D48", a.lineWidth = (h.width || 12) * 1.8, a.lineCap = "round", a.beginPath(), a.moveTo(h.x1, h.y1);
      for (let N = 0; N < D; N++) {
        let W = h.x1 + v / (D + 1) * (N + 1) + x * H[N] * 1.2, V = h.y1 + T / (D + 1) * (N + 1) + C * H[N] * 1.2;
        a.lineTo(W, V);
      }
      a.lineTo(h.x2, h.y2), a.stroke(), a.strokeStyle = c ? "#000000" : "#FB7185", a.lineWidth = h.width || 12, a.beginPath(), a.moveTo(h.x1, h.y1);
      for (let N = 0; N < D; N++) {
        let W = h.x1 + v / (D + 1) * (N + 1) + x * H[N], V = h.y1 + T / (D + 1) * (N + 1) + C * H[N];
        a.lineTo(W, V);
      }
      a.lineTo(h.x2, h.y2), a.stroke(), a.strokeStyle = "#FFFFFF", a.lineWidth = Math.max(2, (h.width || 12) * 0.28), a.beginPath(), a.moveTo(h.x1, h.y1);
      for (let N = 0; N < D; N++) {
        let W = h.x1 + v / (D + 1) * (N + 1) + x * H[N] * 0.7, V = h.y1 + T / (D + 1) * (N + 1) + C * H[N] * 0.7;
        a.lineTo(W, V);
      }
      if (a.lineTo(h.x2, h.y2), a.stroke(), h.subRifts) {
        a.strokeStyle = c ? "#222222" : "#F43F5E", a.lineWidth = 2.5;
        for (let N of h.subRifts) a.beginPath(), a.moveTo(N.x, N.y), a.lineTo(N.x + Math.cos(N.angle) * N.len, N.y + Math.sin(N.angle) * N.len), a.stroke();
      }
      let P = h.x1 * 0.05 + h.y1 * 0.05;
      for (let N = 0; N < 5; N++) {
        let W = (N + 1) / 6, V = h.x1 + v * W + Math.sin(P + N * 2.3 + this.elapsedTime * 4) * 16, oe = h.y1 + T * W + Math.cos(P + N * 3.1 + this.elapsedTime * 4) * 16, ye = this.elapsedTime * 6 + N * 1.5;
        a.save(), a.translate(V, oe), a.rotate(ye), a.fillStyle = c ? "#000000" : "#FDA4AF", a.beginPath(), a.moveTo(0, -6), a.lineTo(5, 0), a.lineTo(0, 7), a.lineTo(-4, 1), a.closePath(), a.fill(), a.strokeStyle = "#FFFFFF", a.lineWidth = 1, a.stroke(), a.restore();
      }
      a.restore();
    }
    for (let h of this.luanRifts) drawLuanRift(a, h, c);
    if (this.luanPortals.length > 1) {
      a.save();
      a.strokeStyle = c ? "rgba(0,0,0,0.45)" : "rgba(192, 132, 252, 0.35)";
      a.lineWidth = 2;
      a.setLineDash([10, 8]);
      a.beginPath();
      for (let i = 0; i < this.luanPortals.length; i++) {
        let p1 = this.luanPortals[i], p2 = this.luanPortals[(i + 1) % this.luanPortals.length];
        a.moveTo(p1.x, p1.y), a.lineTo(p2.x, p2.y);
      }
      a.stroke();
      a.setLineDash([]);
      a.restore();
    }
    for (let h of this.luanPortals) drawLuanPortal(a, h, this.elapsedTime, c);
    for (let h of this.tinCrystals) {
      let f = Math.min(1, (h.maxLife - h.life) / 1.2), v = Math.sin(h.pulse) * 4, T = h.radius + Math.sin(h.pulse * 1.5) * 4;
      a.save(), a.globalAlpha = f, a.translate(h.x, h.y);
      let b = a.createRadialGradient(0, 0, 6, 0, 0, T);
      b.addColorStop(0, c ? "rgba(0,0,0,0.28)" : "rgba(244, 63, 94, 0.38)"), b.addColorStop(0.7, c ? "rgba(0,0,0,0.12)" : "rgba(225, 29, 72, 0.16)"), b.addColorStop(1, "rgba(244, 63, 94, 0)"), a.fillStyle = b, a.beginPath(), a.arc(0, 0, T, 0, Math.PI * 2), a.fill(), a.strokeStyle = c ? "#000000" : "rgba(251, 113, 133, 0.85)", a.lineWidth = 2, a.setLineDash([7, 5]), a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.stroke(), a.setLineDash([]), a.fillStyle = "rgba(0, 0, 0, 0.5)", a.beginPath(), a.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2), a.fill(), a.translate(0, v - 4), a.fillStyle = c ? "#000000" : "#E11D48", a.beginPath(), a.moveTo(0, -24), a.lineTo(12, -4), a.lineTo(7, 10), a.lineTo(0, 14), a.lineTo(-7, 10), a.lineTo(-12, -4), a.closePath(), a.fill(), a.fillStyle = c ? "#444444" : "#FB7185", a.beginPath(), a.moveTo(0, -24), a.lineTo(12, -4), a.lineTo(0, 14), a.closePath(), a.fill(), a.strokeStyle = "#FFE4E6", a.lineWidth = 1.8, a.beginPath(), a.moveTo(0, -24), a.lineTo(12, -4), a.lineTo(7, 10), a.lineTo(0, 14), a.lineTo(-7, 10), a.lineTo(-12, -4), a.closePath(), a.stroke(), a.beginPath(), a.moveTo(0, -20), a.lineTo(0, 10), a.strokeStyle = "#FFFFFF", a.lineWidth = 1.5, a.stroke(), a.restore();
    }
    for (let h of this.frostBarrages) a.save(), a.globalAlpha = Math.min(1, (h.duration - h.timer) / 0.5), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = "rgba(56, 189, 248, 0.22)", a.fill(), a.strokeStyle = "#38BDF8", a.lineWidth = 2.5, a.setLineDash([8, 6]), a.stroke(), a.restore();
    this.tapRipple && (a.save(), a.beginPath(), a.arc(this.tapRipple.x, this.tapRipple.y, this.tapRipple.radius, 0, Math.PI * 2), a.strokeStyle = `rgba(52, 211, 153, ${Math.max(0, this.tapRipple.alpha)})`, a.lineWidth = 2.5, a.stroke(), a.restore(), this.tapRipple.radius += 2.2, this.tapRipple.alpha -= 0.04, this.tapRipple.alpha <= 0 && (this.tapRipple = null));
    for (let h of this.deadCorpses) {
      let f = Math.min(1, h.timer / 0.2), v = Math.max(0, 1 - h.timer / h.maxLife);
      a.save(), a.translate(h.x, h.y), a.globalAlpha = v, a.beginPath(), a.ellipse(0, 3, h.splatRadius * (0.6 + f * 0.65), h.splatRadius * (0.28 + f * 0.32), 0, 0, Math.PI * 2), a.fillStyle = c ? "#000000" : h.splatColor, a.fill(), a.scale(1 + f * 0.58, Math.max(0.14, 1 - f * 0.86)), a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fillStyle = c ? "#111111" : h.color, a.fill(), a.strokeStyle = "#000000", a.lineWidth = 2.5, a.stroke(), a.restore();
    }
    for (let h of this.bloodParticles) a.save(), a.globalAlpha = Math.max(0, 1 - h.life / h.maxLife), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = c ? "#000000" : h.color, a.fill(), a.restore();
    for (let h of this.redCrystals) {
      let f = Math.max(0, 1 - h.life / h.maxLife);
      a.save(), a.translate(h.x, h.y), a.rotate(h.rot), a.globalAlpha = f, a.beginPath(), a.moveTo(0, -h.size), a.lineTo(h.size * 0.7, 0), a.lineTo(0, h.size * 1.3), a.lineTo(-h.size * 0.7, 0), a.closePath(), a.fillStyle = c ? "#000000" : "#EF4444", a.fill(), a.strokeStyle = c ? "#333333" : "#FCA5A5", a.lineWidth = 1.2, a.stroke(), a.restore();
    }
    for (let h of this.flameParticles) {
      let f = Math.max(0, 1 - h.life / h.maxLife);
      a.save(), a.globalAlpha = f, a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = c ? "#000000" : h.colorMode === "blue" ? h.life < h.maxLife * 0.4 ? "#BAE6FD" : "#0284C7" : h.life < h.maxLife * 0.4 ? "#FEF08A" : "#EA580C", a.fill(), a.restore();
    }
    for (let h of this.smokePuffs) {
      let f = Math.max(0, 0.4 * (1 - h.life / h.maxLife));
      a.save(), a.globalAlpha = f, a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = h.color, a.fill(), a.restore();
    }
    for (let h of this.galaxyVortices) {
      a.save(), a.translate(h.x, h.y), a.rotate(h.rotation);
      let f = a.createRadialGradient(0, 0, 10, 0, 0, h.radius);
      f.addColorStop(0, "rgba(15, 23, 42, 0.95)"), f.addColorStop(0.3, h.isGalaxy ? "rgba(192, 132, 252, 0.35)" : "rgba(147, 51, 234, 0.35)"), f.addColorStop(0.7, h.isGalaxy ? "rgba(56, 189, 248, 0.25)" : "rgba(88, 28, 135, 0.25)"), f.addColorStop(1, "rgba(15, 23, 42, 0)"), a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fillStyle = f, a.fill();
      let v = h.isGalaxy ? 4 : 2;
      for (let T = 0; T < v; T++) a.save(), a.rotate(Math.PI * 2 / v * T), a.beginPath(), a.moveTo(0, 0), a.bezierCurveTo(h.radius * 0.4, h.radius * 0.3, h.radius * 0.7, -h.radius * 0.2, h.radius * 0.95, h.radius * 0.1), a.strokeStyle = T % 2 == 0 ? "#E9D5FF" : "#38BDF8", a.lineWidth = h.isGalaxy ? 3.5 : 2.5, a.stroke(), a.restore();
      for (let T of h.stars) {
        let b = h.radius * T.distRatio, x = T.angle + h.rotation * 0.6, C = Math.cos(x) * b, H = Math.sin(x) * b;
        a.beginPath(), a.arc(C, H, T.size, 0, Math.PI * 2), a.fillStyle = T.color, a.fill();
      }
      a.beginPath(), a.arc(0, 0, 20, 0, Math.PI * 2), a.fillStyle = "#030712", a.fill(), a.strokeStyle = h.isGalaxy ? "#F472B6" : "#C084FC", a.lineWidth = 2.5, a.stroke(), a.restore();
    }
    for (let h of this.zones) {
      if (a.save(), a.globalAlpha = Math.min(1, (h.duration - h.timer) / 0.5), h.kind === "arrow_rain") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 15, 0, 0, h.radius);
        v.addColorStop(0, "rgba(52, 211, 153, 0.45)"), v.addColorStop(0.35, "rgba(16, 185, 129, 0.25)"), v.addColorStop(0.7, "rgba(5, 150, 105, 0.14)"), v.addColorStop(1, "rgba(6, 78, 59, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill();
        let T = [{ r: h.radius * 0.95, spd: 3.5, dash: [14, 10], col: "rgba(52, 211, 153, 0.7)", w: 3 }, { r: h.radius * 0.72, spd: -4.8, dash: [18, 12], col: "rgba(110, 231, 183, 0.85)", w: 3.5 }, { r: h.radius * 0.48, spd: 6.2, dash: [10, 8], col: "rgba(167, 243, 208, 0.9)", w: 4 }, { r: h.radius * 0.28, spd: -8, dash: [8, 6], col: "#FFFFFF", w: 3 }];
        for (let H of T) a.save(), a.rotate(f * H.spd), a.strokeStyle = H.col, a.lineWidth = H.w, a.setLineDash(H.dash), a.beginPath(), a.arc(0, 0, H.r, 0, Math.PI * 2), a.stroke(), a.restore();
        for (let H = 0; H < 4; H++) {
          let D = Math.PI * 2 / 4 * H + h.rotation * 1.8;
          a.beginPath();
          for (let P = 0; P <= 25; P++) {
            let N = P / 25, W = h.radius * (1 - N * 0.88), V = D + N * 3.8, oe = Math.cos(V) * W, ye = Math.sin(V) * W;
            P === 0 ? a.moveTo(oe, ye) : a.lineTo(oe, ye);
          }
          a.strokeStyle = H % 2 == 0 ? "rgba(110, 231, 183, 0.85)" : "rgba(209, 250, 229, 0.95)", a.lineWidth = 3.2, a.stroke();
        }
        for (let H = 0; H < 12; H++) {
          let D = (f * 0.6 + H * 0.08) % 1, P = h.radius * (1 - D * 0.85), N = f * (4 + H * 0.5) + Math.PI * 2 / 12 * H, W = Math.cos(N) * P, V = Math.sin(N) * P;
          a.save(), a.translate(W, V), a.rotate(N + Math.PI / 2), a.fillStyle = "#ECFDF5", a.beginPath(), a.ellipse(0, 0, 7, 2.5, 0, 0, Math.PI * 2), a.fill(), a.restore();
        }
        let b = Math.floor(f * 24);
        for (let H = 0; H < 16; H++) {
          let D = Math.sin(b + H * 41) * 0.82 * h.radius, P = Math.cos(b * 1.4 + H * 29) * 0.82 * h.radius, N = 1.35;
          a.strokeStyle = "#FDE68A", a.lineWidth = 2.4, a.beginPath(), a.moveTo(D - Math.cos(N) * 38, P - Math.sin(N) * 38), a.lineTo(D, P), a.stroke(), a.fillStyle = "#FFFFFF", a.beginPath(), a.arc(D, P, 3.5, 0, Math.PI * 2), a.fill(), a.strokeStyle = "rgba(52, 211, 153, 0.6)", a.lineWidth = 1.6, a.beginPath(), a.ellipse(D, P, 8, 4, 0, 0, Math.PI * 2), a.stroke();
        }
        let x = 18 + Math.sin(f * 12) * 5, C = a.createRadialGradient(0, 0, 2, 0, 0, x);
        C.addColorStop(0, "#FFFFFF"), C.addColorStop(0.5, "#6EE7B7"), C.addColorStop(1, "rgba(52, 211, 153, 0)"), a.fillStyle = C, a.beginPath(), a.arc(0, 0, x, 0, Math.PI * 2), a.fill(), a.restore();
      } else if (h.kind === "fox_king_rain") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y), a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fillStyle = "rgba(249, 115, 22, 0.22)", a.fill(), a.strokeStyle = "#FB923C", a.lineWidth = 3, a.stroke();
        for (let T = 0; T < 9; T++) {
          let b = f * 3.5 + Math.PI * 2 / 9 * T, x = h.radius * (0.5 + 0.4 * Math.sin(f * 2 + T));
          a.fillStyle = T % 2 == 0 ? "#F97316" : "#EF4444", a.beginPath(), a.arc(Math.cos(b) * x, Math.sin(b) * x, 8, 0, Math.PI * 2), a.fill();
        }
        let v = Math.floor(f * 22);
        for (let T = 0; T < 14; T++) {
          let b = Math.sin(v + T * 37) * 0.85 * h.radius, x = Math.cos(v * 1.5 + T * 23) * 0.85 * h.radius;
          a.strokeStyle = "#FDE68A", a.lineWidth = 2.5, a.beginPath(), a.moveTo(b + 12, x - 32), a.lineTo(b, x), a.stroke();
        }
        a.restore();
      } else if (h.kind === "blizzard_vortex") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 10, 0, 0, h.radius);
        v.addColorStop(0, "rgba(224, 242, 254, 0.55)"), v.addColorStop(0.5, "rgba(56, 189, 248, 0.3)"), v.addColorStop(1, "rgba(14, 165, 233, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill();
        for (let T = 0; T < 6; T++) {
          a.save(), a.rotate(f * 4.2 + Math.PI / 3 * T), a.strokeStyle = "#BAE6FD", a.lineWidth = 2.8, a.beginPath(), a.moveTo(0, 0), a.lineTo(h.radius * 0.9, 0), a.stroke();
          for (let b = 1; b <= 3; b++) {
            let x = h.radius * 0.9 / 4 * b;
            a.beginPath(), a.moveTo(x, 0), a.lineTo(x + 12, 12), a.moveTo(x, 0), a.lineTo(x + 12, -12), a.stroke();
          }
          a.restore();
        }
        for (let T = 0; T < 10; T++) {
          let b = f * 6 + Math.PI * 2 / 10 * T, x = h.radius * (0.3 + 0.6 * ((f + T) % 1));
          a.fillStyle = "#FFFFFF", a.beginPath(), a.arc(Math.cos(b) * x, Math.sin(b) * x, 3.5, 0, Math.PI * 2), a.fill();
        }
        a.restore();
      } else if (h.kind === "gau_tremor") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 12, 0, 0, h.radius);
        v.addColorStop(0, "rgba(251, 191, 36, 0.34)"), v.addColorStop(0.6, "rgba(217, 119, 6, 0.22)"), v.addColorStop(1, "rgba(180, 83, 9, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill(), a.strokeStyle = "rgba(251, 191, 36, 0.72)", a.lineWidth = 2.5, a.setLineDash([12, 8]), a.beginPath(), a.arc(0, 0, h.radius * (0.85 + 0.1 * Math.sin(f * 8)), 0, Math.PI * 2), a.stroke(), a.setLineDash([]), a.restore();
      } else if (h.kind === "danh_dragon_fire") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 10, 0, 0, h.radius);
        v.addColorStop(0, "rgba(254, 240, 138, 0.45)"), v.addColorStop(0.45, "rgba(239, 68, 68, 0.32)"), v.addColorStop(1, "rgba(153, 27, 27, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill(), a.strokeStyle = "#F59E0B", a.lineWidth = 2.6, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.stroke();
        for (let T = 0; T < 6; T++) {
          let b = f * 3.2 + Math.PI * 2 / 6 * T, x = h.radius * (0.35 + 0.45 * ((f * 0.7 + T * 0.2) % 1));
          a.fillStyle = T % 2 == 0 ? "#FEF08A" : "#FB923C", a.beginPath(), a.arc(Math.cos(b) * x, Math.sin(b) * x, 4, 0, Math.PI * 2), a.fill();
        }
        a.restore();
      } else if (h.kind === "trung_thunder_zone") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 8, 0, 0, h.radius);
        v.addColorStop(0, "rgba(254, 240, 138, 0.32)"), v.addColorStop(0.55, "rgba(129, 140, 248, 0.25)"), v.addColorStop(1, "rgba(79, 70, 229, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill(), a.strokeStyle = "#818CF8", a.lineWidth = 2.8, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.stroke(), a.strokeStyle = "#FDE047", a.lineWidth = 2, a.setLineDash([10, 8]), a.beginPath(), a.arc(0, 0, h.radius * (0.72 + 0.08 * Math.sin(f * 10)), 0, Math.PI * 2), a.stroke(), a.setLineDash([]);
        for (let T = 0; T < 5; T++) {
          let b = f * 4.5 + Math.PI * 2 / 5 * T, x = h.radius * 0.78;
          a.strokeStyle = "#FEF08A", a.lineWidth = 1.8, a.beginPath(), a.moveTo(0, 0), a.lineTo(Math.cos(b + 0.2) * x * 0.5, Math.sin(b + 0.2) * x * 0.5), a.lineTo(Math.cos(b) * x, Math.sin(b) * x), a.stroke();
        }
        a.restore();
      } else if (h.kind === "acid_pool") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 8, 0, 0, h.radius);
        v.addColorStop(0, "rgba(190, 242, 100, 0.42)"), v.addColorStop(0.6, "rgba(34, 197, 94, 0.28)"), v.addColorStop(1, "rgba(20, 83, 45, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill(), a.strokeStyle = "#A3E635", a.lineWidth = 2.4, a.stroke();
        for (let T = 0; T < 7; T++) {
          let b = f * 2 + Math.PI * 2 / 7 * T, x = h.radius * (0.25 + 0.55 * ((f * 0.5 + T * 0.17) % 1));
          a.fillStyle = "#BEF264", a.beginPath(), a.arc(Math.cos(b) * x, Math.sin(b) * x, 4.2, 0, Math.PI * 2), a.fill();
        }
        a.restore();
      } else if (h.kind === "blood_sanctuary") {
        let f = this.elapsedTime;
        a.save(), a.translate(h.x, h.y);
        let v = a.createRadialGradient(0, 0, 10, 0, 0, h.radius);
        v.addColorStop(0, "rgba(251, 113, 133, 0.38)"), v.addColorStop(0.55, "rgba(190, 18, 60, 0.26)"), v.addColorStop(1, "rgba(76, 5, 25, 0)"), a.fillStyle = v, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.fill(), a.strokeStyle = "#FB7185", a.lineWidth = 2.8, a.beginPath(), a.arc(0, 0, h.radius, 0, Math.PI * 2), a.stroke(), a.strokeStyle = "#F43F5E", a.lineWidth = 1.8, a.setLineDash([10, 8]), a.beginPath(), a.arc(0, 0, h.radius * (0.7 + 0.08 * Math.sin(f * 8)), 0, Math.PI * 2), a.stroke(), a.setLineDash([]);
        a.restore();
      }
      a.restore();
    }
    for (let h of this.nguyenSanctuaryFields) drawNguyenSanctuaryField(a, h, this.elapsedTime, c);
    for (let h of this.taiduCarpetStrikes) drawTaiDuCarpetStrike(a, h, this.elapsedTime, c);
    if (this.duccong_pads) for (let m of [1, 2]) {
      let pad = this.duccong_pads[m];
      if (!pad) continue;
      let ready = pad.teleportCd <= 0, pulse = 1 + 0.1 * Math.sin(this.elapsedTime * 7);
      a.save(), a.translate(pad.x, pad.y), a.beginPath(), a.arc(0, 0, pad.radius * pulse, 0, Math.PI * 2), a.fillStyle = ready ? "rgba(168, 85, 247, 0.25)" : "rgba(148, 163, 184, 0.14)", a.fill(), a.strokeStyle = ready ? "#E879F9" : "#94A3B8", a.lineWidth = 2.6, a.setLineDash([7, 5]), a.stroke(), a.setLineDash([]), a.beginPath(), a.arc(0, 0, 12, 0, Math.PI * 2), a.fillStyle = ready ? "#C084FC" : "#64748B", a.fill(), a.font = '800 10px "JetBrains Mono", monospace', a.textAlign = "center", a.fillStyle = "#F5D0FE", a.fillText(ready ? `D\u1ECACH C${m + 1}` : `${pad.teleportCd.toFixed(1)}s`, 0, -pad.radius - 6), a.restore();
    }
    for (let h of this.bossWarnings) {
      let f = Math.min(1, h.timer / h.duration), v = 0.5 + 0.4 * Math.sin(h.timer * 20), T = h.color || "#EF4444";
      a.save(), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = h.kind === "ice_prison" ? `rgba(56, 189, 248, ${0.18 * v})` : `rgba(239, 68, 68, ${0.18 * v})`, a.fill(), a.strokeStyle = T, a.globalAlpha = 0.85 * v, a.lineWidth = 3, a.stroke(), a.globalAlpha = 0.95, a.beginPath(), a.arc(h.x, h.y, Math.max(4, h.radius * (1 - f)), 0, Math.PI * 2), a.strokeStyle = "#FEF08A", a.lineWidth = 3, a.stroke(), a.strokeStyle = T, a.lineWidth = 1.6, a.beginPath(), a.moveTo(h.x - 16, h.y), a.lineTo(h.x + 16, h.y), a.moveTo(h.x, h.y - 16), a.lineTo(h.x, h.y + 16), a.stroke(), a.restore();
    }
    for (let h of this.bossShockRings) {
      let f = Math.max(0.15, 1 - h.currentRadius / h.maxRadius);
      a.save(), a.globalAlpha = f, a.beginPath(), a.arc(h.x, h.y, h.currentRadius, 0, Math.PI * 2), a.strokeStyle = h.color, a.lineWidth = h.ringWidth * 0.75, a.stroke(), a.beginPath(), a.arc(h.x, h.y, Math.max(4, h.currentRadius - 6), 0, Math.PI * 2), a.strokeStyle = h.accentColor, a.lineWidth = 4, a.stroke(), a.restore();
    }
    for (let h of this.bossBeams) {
      if (a.save(), h.triggered) {
        let f = Math.max(0, h.fadeTimer / 0.38);
        a.globalAlpha = f, a.lineCap = "round", a.strokeStyle = h.color, a.lineWidth = h.width * (0.85 + 0.45 * f), a.beginPath(), a.moveTo(h.x1, h.y1), a.lineTo(h.x2, h.y2), a.stroke(), a.strokeStyle = h.glowColor, a.lineWidth = h.width * 0.55 * f, a.beginPath(), a.moveTo(h.x1, h.y1), a.lineTo(h.x2, h.y2), a.stroke(), a.strokeStyle = "#FFFFFF", a.lineWidth = Math.max(3, h.width * 0.22 * f), a.beginPath(), a.moveTo(h.x1, h.y1), a.lineTo(h.x2, h.y2), a.stroke();
      } else {
        let f = Math.min(1, h.timer / h.duration), v = 0.45 + 0.45 * Math.sin(h.timer * 24);
        a.strokeStyle = h.color, a.globalAlpha = 0.25 * v, a.lineWidth = h.width, a.lineCap = "round", a.beginPath(), a.moveTo(h.x1, h.y1), a.lineTo(h.x2, h.y2), a.stroke(), a.globalAlpha = 0.85, a.strokeStyle = h.glowColor, a.lineWidth = Math.max(2, h.width * 0.25 * f), a.setLineDash([14, 10]), a.beginPath(), a.moveTo(h.x1, h.y1), a.lineTo(h.x2, h.y2), a.stroke(), a.setLineDash([]);
      }
      a.restore();
    }
    for (let h of this.xpOrbs) a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = "#2DD4BF", a.fill(), a.strokeStyle = "#CCFBF1", a.lineWidth = 1.5, a.stroke();
    this.aimState.active && this.drawAimIndicator();
    for (let h of this.afterimages) a.save(), a.globalAlpha = h.alpha * (1 - h.life / h.maxLife), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = c ? "#000000" : h.color, a.fill(), a.restore();
    for (let h of this.enemies) {
      if (h.kind === "boss" ? this.drawBossEntity(h) : drawMonsterEntity(a, h, this.elapsedTime, c), h.eohyenAuraSlow && h.eohyenAuraSlow > 0.15 && (!h.frozenTimer || h.frozenTimer <= 0) && (a.save(), a.strokeStyle = "rgba(125, 211, 252, 0.55)", a.lineWidth = 2, a.beginPath(), a.ellipse(h.x, h.y + h.radius * 0.55, h.radius * 1.15, h.radius * 0.5, 0, 0, Math.PI * 2), a.stroke(), a.restore()), h.frozenTimer && h.frozenTimer > 0) {
        a.save();
        let f = h.kind === "boss", v = f ? 1.55 : 1.35, T = h.radius * v, b = h.frozenTimer < 0.45 ? (Math.random() - 0.5) * 4 : 0;
        a.translate(h.x + b, h.y), a.fillStyle = "rgba(14, 165, 233, 0.35)", a.beginPath(), a.ellipse(0, T * 0.72, T * 1.18, T * 0.45, 0, 0, Math.PI * 2), a.fill(), a.beginPath();
        for (let C = 0; C < 7; C++) {
          let H = Math.PI * 2 / 7 * C - Math.PI / 2, D = (C % 2 == 0 ? 1.08 : 0.92) * T, P = Math.cos(H) * D, N = Math.sin(H) * D * 1.05 - T * 0.08;
          C === 0 ? a.moveTo(P, N) : a.lineTo(P, N);
        }
        a.closePath();
        let x = a.createLinearGradient(-T, -T, T, T);
        x.addColorStop(0, "rgba(224, 242, 254, 0.72)"), x.addColorStop(0.5, "rgba(56, 189, 248, 0.52)"), x.addColorStop(1, "rgba(2, 132, 199, 0.65)"), a.fillStyle = c ? "rgba(0, 0, 0, 0.45)" : x, a.fill(), a.strokeStyle = c ? "#000000" : "#E0F2FE", a.lineWidth = f ? 3.5 : 2.2, a.stroke(), a.strokeStyle = "rgba(255, 255, 255, 0.75)", a.lineWidth = f ? 2.4 : 1.4, a.beginPath(), a.moveTo(-T * 0.45, -T * 0.55), a.lineTo(T * 0.1, T * 0.35), a.moveTo(-T * 0.15, -T * 0.7), a.lineTo(T * 0.4, 0), a.stroke();
        for (let C = 0; C < (f ? 6 : 3); C++) {
          let H = this.elapsedTime * 2.5 + Math.PI * 2 / (f ? 6 : 3) * C, D = T * 1.08 * Math.cos(H), P = T * 0.65 * Math.sin(H);
          a.fillStyle = "#FFFFFF", a.beginPath(), a.arc(D, P, f ? 3.5 : 2.2, 0, Math.PI * 2), a.fill();
        }
        a.restore();
      }
      if (h.tin_hasMark) a.fillStyle = "#F43F5E", a.font = "700 13px sans-serif", a.textAlign = "center", a.fillText("\u{1FA78}", h.x, h.y - h.radius - 12);
      else if (h.gau_quakeTimer && h.gau_quakeTimer > 0) a.fillStyle = "#FBBF24", a.font = '800 12px "JetBrains Mono", monospace', a.textAlign = "center", a.fillText("\u26A1 CH\u1EA4N", h.x, h.y - h.radius - 13);
      else if (h.bao_marks && h.bao_marks > 0) {
        let f = h.bao_marks, v = h.y - h.radius - 17, T = f >= 2 ? "#F43F5E" : "#E879F9", b = this.elapsedTime * 2.4;
        a.save(), a.translate(h.x, v);
        a.strokeStyle = T, a.lineWidth = 1.6, a.beginPath(), a.arc(0, 0, 7.5, b, b + Math.PI * 1.45), a.stroke();
        a.fillStyle = f >= 3 ? "#FFFFFF" : T, a.beginPath(), a.moveTo(0, -5.5), a.lineTo(4.8, 0), a.lineTo(0, 5.5), a.lineTo(-4.8, 0), a.closePath(), a.fill();
        a.strokeStyle = "#581C87", a.lineWidth = 1, a.stroke();
        for (let x = 0; x < f; x++) {
          let C = -Math.PI / 2 + Math.PI * 2 / 3 * x;
          a.beginPath(), a.arc(Math.cos(C) * 10.5, Math.sin(C) * 10.5, 2.3, 0, Math.PI * 2), a.fillStyle = T, a.fill();
        }
        a.restore();
      } else (h.longhoiBurnStacks || 0) > 0 && (a.fillStyle = (h.longhoiBurnAmpTimer || 0) > 0 ? "#FDE047" : "#FB923C", a.font = '800 11px "JetBrains Mono", monospace', a.textAlign = "center", a.fillText(`🔥x${h.longhoiBurnStacks}`, h.x, h.y - h.radius - 12));
      if (h.hp < h.maxHp && h.kind !== "boss") {
        let f = Math.max(28, h.radius * 1.6);
        a.fillStyle = "rgba(15, 23, 42, 0.8)", a.fillRect(h.x - f / 2, h.y - h.radius - 8, f, 4), a.fillStyle = "#EF4444", a.fillRect(h.x - f / 2, h.y - h.radius - 8, f * (h.hp / h.maxHp), 4);
      }
    }
    for (let h of this.shadowClones) {
      if (h.delay > 0) continue;
      let f = Math.min(1, h.life / 0.1), v = Math.max(0, 1 - Math.max(0, h.life - (h.maxLife - 0.16)) / 0.16), T = f * v;
      a.save(), a.globalAlpha = T * 0.88, a.translate(h.x, h.y), a.rotate(h.facing), a.scale(0.85 + f * 0.15, 0.85 + f * 0.15);
      a.beginPath(), a.arc(0, 0, 22, 0, Math.PI * 2), a.strokeStyle = "rgba(232, 121, 249, 0.45)", a.lineWidth = 2, a.stroke();
      a.beginPath(), a.arc(0, 0, 18.5, 0, Math.PI * 2), a.fillStyle = "#4C1D95", a.fill(), a.strokeStyle = "#E879F9", a.lineWidth = 2.5, a.stroke();
      a.beginPath(), a.arc(0, 0, 8, 0, Math.PI * 2), a.fillStyle = "#A855F7", a.fill();
      a.beginPath(), a.arc(12, 0, 3.2, 0, Math.PI * 2), a.fillStyle = "#FFFFFF", a.fill();
      let b = h.struck ? 0.55 : h.timer > 0 ? 0.28 : 0;
      for (let x of [-1, 1]) a.save(), a.translate(10, x * 15), a.rotate(x * (0.38 + b)), drawBaoDagger(a, x, true, h.struck ? 0.65 : 0.25, 0, c), a.restore();
      a.restore();
    }
    for (let h of this.taiduTurrets) drawTaiDuTurret(a, h, this.elapsedTime, c);
    this.multiplayer.active && this.drawRemotePlayers();
    this.drawPlayer();
    for (let h of this.dragonWaves) {
      a.save(), a.translate(h.x, h.y), a.rotate(h.angle);
      let f = h.empowered ? 1.38 : 1.05;
      a.scale(f, f);
      a.beginPath();
      for (let v = 8; v >= 0; v--) {
        let T = -v * 14, b = v === 0 ? 0 : Math.sin(this.elapsedTime * 20 - v * 0.85) * (5 + v * 1.4);
        v === 8 ? a.moveTo(T, b) : a.lineTo(T, b);
      }
      a.strokeStyle = h.empowered ? "rgba(251, 191, 36, 0.5)" : "rgba(239, 68, 68, 0.45)", a.lineWidth = 18, a.lineCap = "round", a.lineJoin = "round", a.stroke();
      for (let v = 7; v >= 1; v--) {
        let T = Math.sin(this.elapsedTime * 20 - v * 0.85) * (5 + v * 1.4), b = Math.max(4, 16 - v * 1.55);
        a.beginPath(), a.arc(-v * 14, T, b, 0, Math.PI * 2), a.fillStyle = v % 2 === 0 ? "#DC2626" : h.empowered ? "#FBBF24" : "#F97316", a.fill();
        a.beginPath(), a.arc(-v * 14, T, b * 0.48, 0, Math.PI * 2), a.fillStyle = "#FEF08A", a.fill();
      }
      a.fillStyle = h.empowered ? "#FEF08A" : "#EF4444", a.beginPath(), a.moveTo(32, 0), a.lineTo(4, -19), a.lineTo(-10, -10), a.lineTo(-10, 10), a.lineTo(4, 19), a.closePath(), a.fill(), a.strokeStyle = "#FBBF24", a.lineWidth = 2.6, a.stroke();
      a.strokeStyle = "#FEF08A", a.lineWidth = 3.2, a.beginPath(), a.moveTo(-4, -13), a.lineTo(-24, -27), a.moveTo(-4, 13), a.lineTo(-24, 27), a.moveTo(14, -7), a.lineTo(-2, -22), a.moveTo(14, 7), a.lineTo(-2, 22), a.stroke();
      a.fillStyle = "#FFFFFF", a.beginPath(), a.arc(13, -6, 3.2, 0, Math.PI * 2), a.arc(13, 6, 3.2, 0, Math.PI * 2), a.fill(), a.restore();
    }
    for (let h of this.skyDragons) {
      let f = Math.min(1, h.timer / h.duration), v = h.y - Math.pow(1 - f, 1.4) * 420, T = h.empowered ? "#FBBF24" : "#EF4444", b = Math.max(0, 1 - Math.max(0, h.timer - h.duration) / 0.45);
      a.save(), a.globalAlpha = b;
      a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = h.empowered ? "rgba(251, 191, 36, 0.2)" : "rgba(220, 38, 38, 0.18)", a.fill(), a.strokeStyle = T, a.lineWidth = 3, a.stroke();
      a.save(), a.translate(h.x, h.y), a.rotate(this.elapsedTime * 2.2), a.strokeStyle = h.empowered ? "#FEF08A" : "#FB923C", a.lineWidth = 2, a.setLineDash([14, 8]), a.beginPath(), a.arc(0, 0, h.radius * 0.78, 0, Math.PI * 2), a.stroke(), a.setLineDash([]);
      a.beginPath();
      for (let x = 0; x < 6; x++) {
        let C = Math.PI / 3 * x, H = Math.cos(C) * h.radius * 0.56, D = Math.sin(C) * h.radius * 0.56;
        x === 0 ? a.moveTo(H, D) : a.lineTo(H, D);
      }
      a.closePath(), a.strokeStyle = "rgba(254, 240, 138, 0.55)", a.lineWidth = 1.8, a.stroke(), a.restore();
      if (!h.impacted) {
        a.save(), a.translate(h.x, v);
        let x = h.empowered ? 1.75 : 1.35;
        a.scale(x, x);
        for (let C = 4; C >= 1; C--) {
          let H = Math.sin(this.elapsedTime * 18 + C) * (4 + C * 1.5);
          a.beginPath(), a.arc(H, -C * 16 - 14, Math.max(5, 16 - C * 2.5), 0, Math.PI * 2), a.fillStyle = C % 2 === 0 ? "#DC2626" : "#F97316", a.fill();
        }
        a.strokeStyle = h.empowered ? "#FEF08A" : "#F59E0B", a.lineWidth = 3, a.beginPath(), a.moveTo(-12, -16), a.lineTo(-42, -34), a.lineTo(-26, -6), a.moveTo(12, -16), a.lineTo(42, -34), a.lineTo(26, -6), a.stroke();
        a.fillStyle = "#DC2626", a.beginPath(), a.moveTo(0, 36), a.lineTo(-22, -10), a.lineTo(-10, -28), a.lineTo(10, -28), a.lineTo(22, -10), a.closePath(), a.fill(), a.strokeStyle = "#FEF08A", a.lineWidth = 2.8, a.stroke();
        a.fillStyle = "#FFFFFF", a.beginPath(), a.arc(-7, 6, 2.8, 0, Math.PI * 2), a.arc(7, 6, 2.8, 0, Math.PI * 2), a.fill(), a.restore();
      }
      a.restore();
    }
    for (let h of this.rocketProjectiles) a.save(), a.translate(h.x, h.y), a.rotate(h.angle), a.fillStyle = "#334155", a.fillRect(-12, -4, 20, 8), a.fillStyle = h.color, a.beginPath(), a.moveTo(8, -4), a.lineTo(16, 0), a.lineTo(8, 4), a.fill(), a.fillStyle = "#FEF08A", a.beginPath(), a.moveTo(-12, -3), a.lineTo(-19, 0), a.lineTo(-12, 3), a.fill(), a.restore();
    for (let h of this.giantMeteors) {
      a.save(), a.translate(h.currentX, h.currentY);
      let f = Math.atan2(h.targetY - h.startY, h.targetX - h.startX);
      a.rotate(f);
      let v = a.createLinearGradient(-180, 0, 0, 0);
      v.addColorStop(0, "rgba(249, 115, 22, 0)"), v.addColorStop(0.6, "rgba(239, 68, 68, 0.45)"), v.addColorStop(1, "#FEF08A"), a.fillStyle = v, a.beginPath(), a.moveTo(0, -h.meteorSize * 0.7), a.lineTo(-220, 0), a.lineTo(0, h.meteorSize * 0.7), a.closePath(), a.fill(), a.beginPath(), a.arc(0, 0, h.meteorSize, 0, Math.PI * 2), a.fillStyle = "#451A03", a.fill(), a.strokeStyle = "#F97316", a.lineWidth = 4, a.stroke(), a.restore();
    }
    for (let h of this.cataclysmicExplosions) {
      let f = h.life / h.maxLife;
      a.save(), a.globalAlpha = Math.max(0, 1 - f), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.strokeStyle = h.color, a.lineWidth = 5 * (1 - f) + 1, a.stroke(), a.beginPath(), a.arc(h.x, h.y, h.radius * 0.65, 0, Math.PI * 2), a.fillStyle = f < 0.3 ? "#FEF08A" : f < 0.6 ? "#F97316" : "#7F1D1D", a.fill(), a.restore();
    }
    for (let h of this.luanBeams) drawLuanBeam(a, h, c);
    for (let h of this.nguyenSanctuaryWaves) drawNguyenSanctuaryWave(a, h, c);
    if (this.currentHero.id === "luan" && this.player.luan_c3Charge) {
      let ch = this.player.luan_c3Charge, prog = Math.min(1, 1 - ch.timer / Math.max(0.05, ch.maxTimer)), bLen = this.currentHero.skills[2]?.range || 520;
      let ex = this.player.x + Math.cos(ch.angle) * bLen, ey = this.player.y + Math.sin(ch.angle) * bLen;
      a.save();
      a.strokeStyle = c ? "rgba(0,0,0,0.55)" : "rgba(192, 132, 252, 0.55)", a.lineWidth = 4 + prog * 14, a.lineCap = "round";
      a.beginPath(), a.moveTo(this.player.x, this.player.y), a.lineTo(ex, ey), a.stroke();
      a.strokeStyle = c ? "#FFFFFF" : "#67E8F9", a.lineWidth = 2 + prog * 3, a.setLineDash([12, 8]);
      a.beginPath(), a.moveTo(this.player.x, this.player.y), a.lineTo(ex, ey), a.stroke();
      a.setLineDash([]);
      a.fillStyle = c ? "#FFFFFF" : "#F5D0FE", a.beginPath(), a.arc(this.player.x + Math.cos(ch.angle) * 20, this.player.y + Math.sin(ch.angle) * 20, 8 + prog * 10, 0, Math.PI * 2), a.fill();
      a.restore();
    }
    for (let h of this.projectiles) {
      a.save(), a.translate(h.x, h.y), a.rotate(h.angle);
      drawUpgradedProjectile(a, h, this.elapsedTime, c);
      a.restore();
    }
    for (let h of this.slashes) {
      let f = h.life / h.maxLife;
      a.save(), a.globalAlpha = Math.max(0, 1 - f);
      drawUpgradedSlash(a, h, f, c);
      a.restore();
    }
    for (let h of this.lightnings) drawCurvedLightning(a, h, c);
    for (let h of this.impactBursts) drawImpactBurst(a, h, c);
    for (let h of this.particles) a.save(), a.globalAlpha = Math.max(0, 1 - h.life / h.maxLife), a.beginPath(), a.arc(h.x, h.y, h.radius, 0, Math.PI * 2), a.fillStyle = c ? "#000000" : h.color, a.fill(), a.restore();
    a.textAlign = "center", a.textBaseline = "middle";
    for (let h of this.floatingTexts) a.save(), a.globalAlpha = Math.max(0, 1 - h.life / h.maxLife), a.font = `800 ${h.size}px "JetBrains Mono", monospace`, a.fillStyle = "#070B14", a.fillText(h.text, h.x + 1, h.y + 1), a.fillStyle = c ? "#000000" : h.color, a.fillText(h.text, h.x, h.y), a.restore();
    this.screenFlashWhite > 0 && (a.save(), a.setTransform(1, 0, 0, 1, 0, 0), a.fillStyle = `rgba(255, 255, 255, ${Math.min(0.65, this.screenFlashWhite * 2)})`, a.fillRect(0, 0, this.canvas.width, this.canvas.height), a.restore());
    if (this.gameState === "PLAYING") {
      a.save();
      a.setTransform(s, 0, 0, s, 0, 0);
      let markers = [];
      let liveBoss = this.enemies.find((e) => e.kind === "boss" && e.hp > 0);
      liveBoss && markers.push({ wx: liveBoss.x, wy: liveBoss.y, color: "#EF4444", bg: "rgba(127, 29, 29, 0.9)", icon: "\u{1F451}", tag: "BOSS", urgent: true });
      if (this.multiplayer.active) {
        for (let rp of this.multiplayer.remotePlayers.values()) {
          if (!rp) continue;
          let downed = !rp.alive || rp.hp <= 0;
          let shortName = (rp.name || "\u0110\u1ED2NG \u0110\u1ED8I").slice(0, 8);
          markers.push({ wx: rp.x, wy: rp.y, color: downed ? "#FB7185" : "#38BDF8", bg: downed ? "rgba(136, 19, 55, 0.92)" : "rgba(12, 74, 110, 0.88)", icon: downed ? "\u{1F198}" : "\u{1F6E1}\uFE0F", tag: downed ? "C\u1EE8U" : shortName, urgent: downed });
        }
      }
      for (let mk of markers) {
        let sx = vp.focusX + (mk.wx - this.camera.x) * vp.zoom;
        let sy = vp.focusY + (mk.wy - this.camera.y) * vp.zoom;
        if (sx >= 26 && sx <= this.viewW - 26 && sy >= 26 && sy <= this.viewH - 26) continue;
        let dx = sx - vp.focusX, dy = sy - vp.focusY;
        let maxX = Math.max(40, this.viewW / 2 - 42), maxY = Math.max(40, this.viewH / 2 - 42);
        let scale = Math.max(Math.abs(dx) / maxX, Math.abs(dy) / maxY, 1);
        let ix = Math.max(36, Math.min(this.viewW - 36, vp.focusX + dx / scale));
        let iy = Math.max(36, Math.min(this.viewH - 36, vp.focusY + dy / scale));
        let ang = Math.atan2(dy, dx);
        let distM = Math.max(1, Math.round(Math.hypot(mk.wx - this.player.x, mk.wy - this.player.y) / 30));
        let pulse = mk.urgent ? 0.82 + 0.18 * Math.sin(this.elapsedTime * 8) : 0.92;
        a.save();
        a.globalAlpha = pulse;
        a.save();
        a.translate(ix + Math.cos(ang) * 18, iy + Math.sin(ang) * 18);
        a.rotate(ang);
        a.fillStyle = mk.color;
        a.beginPath(), a.moveTo(8, 0), a.lineTo(-5, -5.5), a.lineTo(-5, 5.5), a.closePath(), a.fill();
        a.restore();
        let text = `${mk.icon} ${mk.tag} ${distM}m`;
        a.font = '800 10px "JetBrains Mono", monospace';
        let tw = a.measureText(text).width + 14;
        a.fillStyle = mk.bg;
        a.strokeStyle = mk.color;
        a.lineWidth = 1.8;
        a.beginPath(), a.roundRect(ix - tw / 2, iy - 12, tw, 24, 6), a.fill(), a.stroke();
        a.fillStyle = "#F8FAFC", a.textAlign = "center", a.textBaseline = "middle";
        a.fillText(text, ix, iy + 0.5);
        a.restore();
      }
      a.restore();
    }
    a.restore();
  }
  drawPlayer() {
    let s = this.ctx, a = this.player.tin_monochrome_realm_timer > 0, l = 1 + 0.08 * Math.sin(this.elapsedTime * 6), hid = this.currentHero.id;
    let vx = this.player.x, vy = this.player.y, sx = 1, sy = 1, shadowScale = 1, bodyAlpha = 1, ringStroke = a ? "#000000" : this.currentHero.accentColor;
    if (hid === "gau") {
      if (this.player.gau_animTimer > 0) {
        let u = 1 - this.player.gau_animTimer / Math.max(0.05, this.player.gau_animDur || 0.22), jolt = Math.sin(u * Math.PI) * (this.player.gau_animKind === "c1_heavy" ? 8 : 5);
        vx += Math.cos(this.player.gau_animAngle || this.player.facing) * jolt, vy += Math.sin(this.player.gau_animAngle || this.player.facing) * jolt;
        let sq = Math.sin(u * Math.PI) * 0.08;
        sx *= 1 + sq, sy *= 1 - sq * 0.5;
      }
      if (this.player.dashActive && this.player.dashKind === "gau_c3_leap") {
        let t = Math.min(1, (this.player.gau_leapElapsed || 0) / Math.max(0.05, this.player.gau_leapDur || 0.28));
        vy -= Math.sin(t * Math.PI) * 44, shadowScale = 1 - Math.sin(t * Math.PI) * 0.35;
        if (t < 0.32) sx *= 0.94, sy *= 1.07;
        else if (t > 0.62) {
          let shrink = 1 - (t - 0.62) / 0.38 * 0.18;
          sx *= shrink, sy *= shrink;
        }
      } else if (this.player.gau_landBounceTimer > 0) {
        let b = 1 - this.player.gau_landBounceTimer / 0.28, exp = Math.sin(b * Math.PI) * 0.22;
        sx *= 1 + exp, sy *= 1 + exp * 0.85;
      }
    } else if (hid === "bao") {
      let fade = this.player.bao_stealthFade || 0;
      if (fade > 0) bodyAlpha = 1 - 0.72 * fade, sx *= 1 - 0.08 * fade, sy *= 1 - 0.08 * fade;
      if (this.player.bao_glideTimer > 0) {
        let gp = Math.sin(this.player.bao_glideTimer / 0.22 * Math.PI);
        sx *= 1 + gp * 0.12, sy *= 1 - gp * 0.08;
      }
    }
    if (s.beginPath(), s.ellipse(this.player.x, this.player.y + this.player.radius * 0.72, this.player.radius * 1.15 * shadowScale, this.player.radius * 0.52 * shadowScale, 0, 0, Math.PI * 2), s.fillStyle = "rgba(0, 0, 0, 0.55)", s.fill(), s.beginPath(), s.arc(vx, vy, (this.player.radius + 6) * l, 0, Math.PI * 2), s.strokeStyle = hid === "gau" && this.player.gau_cuongHungTimer > 0 ? "#F97316" : ringStroke, s.lineWidth = 2.5, s.stroke(), hid === "trung" && this.player.trung_orbs && this.player.trung_orbs.active) {
      s.save();
      for (let f = 0; f < this.player.trung_orbs.count; f++) {
        let v = this.player.trung_orbs.rot + Math.PI * 2 / this.player.trung_orbs.count * f, T = this.player.x + Math.cos(v) * this.player.trung_orbs.radius, b = this.player.y + Math.sin(v) * this.player.trung_orbs.radius;
        s.beginPath(), s.arc(T, b, 12, 0, Math.PI * 2), s.fillStyle = "#818CF8", s.fill(), s.strokeStyle = "#E0E7FF", s.lineWidth = 2.5, s.stroke(), s.beginPath(), s.arc(T, b, 5, 0, Math.PI * 2), s.fillStyle = "#FFFFFF", s.fill();
      }
      s.restore();
    }
    if (hid === "gau" && this.player.gau_cuongHungTimer > 0) {
      s.save();
      let pulse = 0.85 + 0.15 * Math.sin(this.elapsedTime * 10), behindA = this.player.facing + Math.PI;
      s.translate(vx + Math.cos(behindA) * 14, vy + Math.sin(behindA) * 14);
      s.rotate(this.player.facing);
      s.globalAlpha = 0.42 * pulse;
      s.fillStyle = "#EA580C", s.strokeStyle = "#FDE047", s.lineWidth = 2;
      s.beginPath(), s.arc(-4, 0, this.player.radius * 1.18, 0, Math.PI * 2), s.fill(), s.stroke();
      for (let ear of [-1, 1]) s.beginPath(), s.arc(-10, ear * (this.player.radius * 0.95), 9, 0, Math.PI * 2), s.fill(), s.stroke();
      s.restore();
      s.save(), s.translate(vx, vy), s.rotate(this.elapsedTime * 3.2), s.strokeStyle = "#FB923C", s.lineWidth = 3, s.setLineDash([12, 8]), s.beginPath(), s.arc(0, 0, this.player.radius + 15 + Math.sin(this.elapsedTime * 12) * 2.5, 0, Math.PI * 2), s.stroke(), s.setLineDash([]), s.restore();
    }
    if (hid === "danh" && this.player.chargeState.active) {
      s.save();
      let cp = Math.min(1, this.player.chargeState.elapsed / Math.max(0.1, this.player.chargeState.maxDur)), cc = cp >= 1 ? "#FBBF24" : cp >= 0.6 ? "#F97316" : "#EF4444", cr = this.player.radius + 14 + cp * 10;
      s.translate(vx, vy), s.rotate(-this.elapsedTime * (2.5 + cp * 3));
      s.fillStyle = cp >= 1 ? "rgba(251, 191, 36, 0.16)" : "rgba(239, 68, 68, 0.12)", s.beginPath(), s.arc(0, 0, cr, 0, Math.PI * 2), s.fill();
      s.strokeStyle = cc, s.lineWidth = 2.6, s.setLineDash([10, 6]), s.beginPath(), s.arc(0, 0, cr, 0, Math.PI * 2), s.stroke(), s.setLineDash([]);
      s.strokeStyle = "#FEF08A", s.lineWidth = 3.2, s.beginPath(), s.arc(0, 0, cr - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp), s.stroke();
      s.restore();
    }
    if (hid === "dung" && this.player.dung_c3_buff_timer > 0) {
      s.save(), s.translate(this.player.x, this.player.y), s.rotate(this.elapsedTime * 3.5), s.strokeStyle = "#FDE047", s.lineWidth = 2.8, s.setLineDash([10, 6]), s.beginPath(), s.arc(0, 0, this.player.radius + 16, 0, Math.PI * 2), s.stroke(), s.setLineDash([]);
      for (let f = 0; f < 4; f++) {
        let v = Math.PI / 2 * f;
        s.fillStyle = "#38BDF8", s.beginPath(), s.arc(Math.cos(v) * (this.player.radius + 16), Math.sin(v) * (this.player.radius + 16), 3.5, 0, Math.PI * 2), s.fill();
      }
      s.restore();
    }
    if (hid === "eohyen") {
      s.save();
      let f = s.createRadialGradient(this.player.x, this.player.y, 40, this.player.x, this.player.y, 260);
      f.addColorStop(0, "rgba(56, 189, 248, 0.10)"), f.addColorStop(0.65, "rgba(186, 230, 253, 0.05)"), f.addColorStop(1, "rgba(56, 189, 248, 0)"), s.fillStyle = f, s.beginPath(), s.arc(this.player.x, this.player.y, 260, 0, Math.PI * 2), s.fill(), s.restore();
    }
    if (this.player.shield > 0) {
      if (hid === "nguyen") {
        drawNguyenBastionAura(s, vx, vy, this.player.radius, this.elapsedTime, this.player.shield / Math.max(1, this.player.maxHp), this.player.nguyen_rescueFlashTimer > 0, a);
      } else {
        if (s.save(), s.beginPath(), s.arc(vx, vy, this.player.radius + 12, 0, Math.PI * 2), s.fillStyle = "rgba(56, 189, 248, 0.18)", s.fill(), s.strokeStyle = "#38BDF8", s.lineWidth = 2, s.stroke(), hid === "eohyen") {
          s.translate(this.player.x, this.player.y), s.rotate(this.elapsedTime * 2);
          for (let f = 0; f < 6; f++) {
            let v = Math.PI * 2 / 6 * f;
            s.fillStyle = "#BAE6FD", s.beginPath(), s.arc(Math.cos(v) * (this.player.radius + 12), Math.sin(v) * (this.player.radius + 12), 3, 0, Math.PI * 2), s.fill();
          }
        }
        s.restore();
      }
    }
    if (hid === "nguyen" && this.player.nguyen_satellitesTimer > 0) {
      drawNguyenSatellites(s, vx, vy, this.player.nguyen_satellitesRot || 0, this.elapsedTime, 56, a);
    }
    s.save(), s.globalAlpha = bodyAlpha, s.translate(vx, vy);
    let m = this.player.attackAnimTimer > 0 ? this.player.attackAnimAngle : this.player.facing;
    s.rotate(m);
    drawHeroWeapon(s, hid, this.player, this.elapsedTime, a);
    s.restore();
    if (hid === "taidu" && this.player.hp > 0) {
      let drX = Number.isFinite(this.player.taidu_droneX) ? this.player.taidu_droneX : vx - 42;
      let drY = Number.isFinite(this.player.taidu_droneY) ? this.player.taidu_droneY : vy - 30;
      drawTaiDuDrone(s, drX, drY, this.player.taidu_droneMode || "attack", Number.isFinite(this.player.taidu_droneFacing) ? this.player.taidu_droneFacing : m, this.elapsedTime, (this.player.taidu_droneShieldAccum || 0) / 150, a, { playerX: vx, playerY: vy, targetX: this.player.taidu_droneTargetX, targetY: this.player.taidu_droneTargetY, muzzleTimer: this.player.taidu_droneMuzzleTimer || 0 });
    }
    if (hid === "gau" && this.player.gau_c2_guardTimer > 0) {
      s.save(), s.translate(vx, vy), s.fillStyle = "rgba(245, 158, 11, 0.2)", s.strokeStyle = "#FBBF24", s.lineWidth = 3, s.beginPath(), s.arc(0, 0, this.player.radius + 16, 0, Math.PI * 2), s.fill(), s.stroke();
      s.rotate(this.elapsedTime * 2.8), s.strokeStyle = "#FEF08A", s.lineWidth = 3.2, s.setLineDash([14, 10]), s.beginPath(), s.arc(0, 0, this.player.radius + 20, 0, Math.PI * 2), s.stroke(), s.setLineDash([]);
      let stacks = Math.min(4, this.player.gau_c2_stacks || 0);
      for (let i = 0; i < stacks; i++) {
        let sa = Math.PI * 2 / 4 * i;
        s.fillStyle = "#FDE047", s.beginPath(), s.arc(Math.cos(sa) * (this.player.radius + 20), Math.sin(sa) * (this.player.radius + 20), 4, 0, Math.PI * 2), s.fill();
      }
      s.restore();
    }
    if (hid === "gau" && this.player.gau_c2_counterWaveTimer > 0) {
      let cw = 1 - this.player.gau_c2_counterWaveTimer / 0.22;
      s.save(), s.globalAlpha = 1 - cw, s.strokeStyle = "#FEF08A", s.lineWidth = 4 * (1 - cw) + 1, s.beginPath(), s.arc(vx, vy, this.player.radius + 16 + cw * 36, 0, Math.PI * 2), s.stroke(), s.restore();
    }
    if (hid === "bao" && this.player.bao_emergeTimer > 0) {
      let ep = 1 - this.player.bao_emergeTimer / 0.24;
      s.save(), s.globalAlpha = 1 - ep, s.strokeStyle = "#F5D0FE", s.lineWidth = 3.5 * (1 - ep) + 1, s.beginPath(), s.arc(vx, vy, this.player.radius + 6 + ep * 26, 0, Math.PI * 2), s.stroke(), s.restore();
    }
    if (hid === "danh" && this.player.danh_dragonTimer > 0) drawDanhDragonForm(s, vx, vy, this.player.radius, this.player.facing, this.elapsedTime, a);
    let g = hid === "bao" && (this.player.bao_stealthTimer > 0 || (this.player.bao_stealthFade || 0) > 0.05), p = Math.hypot(this.moveInput.x, this.moveInput.y) > 0.1 || this.tapDestination ? 1 + Math.sin(this.elapsedTime * 14) * 0.04 : 1 + Math.sin(this.elapsedTime * 3) * 0.02;
    if (s.save(), (bodyAlpha < 1 || (this.multiplayer.active && this.multiplayer.localDowned)) && (s.globalAlpha = this.multiplayer.active && this.multiplayer.localDowned ? 0.36 : bodyAlpha), s.translate(vx, vy), s.scale(sx, sy), drawHeroBody(s, { heroId: hid, elapsedTime: this.elapsedTime, radius: this.player.radius * p, facing: this.player.facing, color: this.currentHero.color, accentColor: this.currentHero.accentColor, isMono: a, hitFlash: this.player.hitFlash, moveSpeedFactor: this.player.moveSpeedFactor, walkCyclePhase: this.player.walkCyclePhase, isUlt: hid === "dung" ? this.player.dung_c3_buff_timer > 0 : hid === "gau" ? this.player.gau_cuongHungTimer > 0 : hid === "danh" ? this.player.danh_dragonTimer > 0 || this.player.danh_thienPhatTimer > 0 : false, isStealth: g, isDowned: Boolean(this.multiplayer.active && this.multiplayer.localDowned), borderColor: a ? "#333333" : hid === "gau" && this.player.gau_cuongHungTimer > 0 ? "#FBBF24" : hid === "danh" && this.player.danh_dragonTimer > 0 ? "#FEF08A" : g ? "#E879F9" : "#FFFFFF" }), s.restore(), hid === "danh") {
      let stances = [
        { active: this.player.danh_khaiSonTimer > 0, color: "#F59E0B", rim: "#FEF08A" },
        { active: this.player.danh_longNgamTimer > 0, color: "#EF4444", rim: "#FB923C" },
        { active: this.player.danh_thienPhatTimer > 0, color: "#FBBF24", rim: "#FFFFFF" }
      ];
      s.save(), s.translate(vx, vy);
      for (let i = 0; i < 3; i++) {
        let st = stances[i], ang = this.elapsedTime * 1.8 + i * (Math.PI * 2 / 3), ox = Math.cos(ang) * (this.player.radius + 16), oy = Math.sin(ang) * (this.player.radius + 16);
        s.save(), s.translate(ox, oy), s.rotate(ang + this.elapsedTime * 2);
        if (st.active) {
          s.fillStyle = st.color, s.strokeStyle = st.rim, s.lineWidth = 1.6;
          s.beginPath(), s.moveTo(0, -5.5), s.lineTo(5, 0), s.lineTo(0, 5.5), s.lineTo(-5, 0), s.closePath(), s.fill(), s.stroke();
        } else {
          s.strokeStyle = "rgba(255, 255, 255, 0.22)", s.lineWidth = 1.2, s.beginPath(), s.arc(0, 0, 3, 0, Math.PI * 2), s.stroke();
        }
        s.restore();
      }
      s.restore();
      if (this.player.chargeState.active) {
        let f = Math.min(1, this.player.chargeState.elapsed / Math.max(0.1, this.player.chargeState.maxDur)), v = vx - 31, T = vy - this.player.radius - 30;
        s.fillStyle = "rgba(15, 23, 42, 0.92)", s.fillRect(v - 1, T - 1, 64, 8), s.fillStyle = f >= 1 ? "#FBBF24" : f >= 0.6 ? "#F97316" : "#EF4444", s.fillRect(v, T, 62 * f, 6);
        s.fillStyle = "rgba(255, 255, 255, 0.45)", s.fillRect(v + 62 * 0.2, T, 1, 6), s.fillRect(v + 62 * 0.6, T, 1, 6);
      }
    }
    if (this.player.slowTimer > 0 && (s.save(), s.strokeStyle = "rgba(56, 189, 248, 0.75)", s.lineWidth = 2.5, s.setLineDash([6, 4]), s.beginPath(), s.ellipse(this.player.x, this.player.y + this.player.radius * 0.65, this.player.radius * 1.35, this.player.radius * 0.58, 0, 0, Math.PI * 2), s.stroke(), s.restore()), this.player.rootTimer > 0) {
      s.save(), s.translate(this.player.x, this.player.y), s.rotate(this.elapsedTime * 2.5), s.strokeStyle = "#C084FC", s.lineWidth = 3, s.beginPath(), s.arc(0, 0, this.player.radius + 9, 0, Math.PI * 2), s.stroke();
      for (let f = 0; f < 4; f++) {
        let v = Math.PI / 2 * f;
        s.beginPath(), s.moveTo(Math.cos(v) * (this.player.radius + 2), Math.sin(v) * (this.player.radius + 2)), s.lineTo(Math.cos(v) * (this.player.radius + 16), Math.sin(v) * (this.player.radius + 16)), s.stroke();
      }
      s.restore();
    }
    if (this.player.stunTimer > 0) {
      s.save();
      let f = vy - this.player.radius - 26;
      s.strokeStyle = "#FACC15", s.lineWidth = 2, s.beginPath(), s.ellipse(vx, f, 18, 6, 0, 0, Math.PI * 2), s.stroke();
      for (let v = 0; v < 3; v++) {
        let T = this.elapsedTime * 7 + Math.PI * 2 / 3 * v, b = vx + Math.cos(T) * 18, x = f + Math.sin(T) * 6;
        s.fillStyle = "#FEF08A", s.beginPath(), s.arc(b, x, 3.8, 0, Math.PI * 2), s.fill();
      }
      s.restore();
    }
    let h = vy - this.player.radius - 14;
    s.fillStyle = "rgba(15, 23, 42, 0.85)", s.fillRect(vx - 24 - 1, h - 1, 50, 6), s.fillStyle = this.multiplayer.active && this.multiplayer.localDowned ? "#64748B" : "#10B981", s.fillRect(vx - 24, h, 48 * Math.max(0, Math.min(1, this.player.hp / this.player.maxHp)), 4), s.font = '700 11px "Outfit", sans-serif', s.textAlign = "center", s.fillStyle = "#0F172A", s.fillText(this.multiplayer.active && this.multiplayer.localDowned ? "\u{1F480} \u0110\xC3 NG\xC3 XU\u1ED0NG" : `${this.currentHero.name.split("(")[0].trim()} Lv.${this.player.level}`, vx + 1, h - 4), s.fillStyle = this.multiplayer.active && this.multiplayer.localDowned ? "#F87171" : "#FDE68A", s.fillText(this.multiplayer.active && this.multiplayer.localDowned ? "\u{1F480} \u0110\xC3 NG\xC3 XU\u1ED0NG" : `${this.currentHero.name.split("(")[0].trim()} Lv.${this.player.level}`, vx, h - 5);
  }
  drawRemotePlayers() {
    let s = this.ctx, a = this.player.tin_monochrome_realm_timer > 0;
    let now = performance.now();
    let dt = this.multiplayer._lastRemoteDrawTime > 0 ? Math.min(0.05, Math.max(0.001, (now - this.multiplayer._lastRemoteDrawTime) / 1000)) : 0.016;
    this.multiplayer._lastRemoteDrawTime = now;
    let posLerp = 1 - Math.exp(-18 * dt);
    let angLerp = 1 - Math.exp(-20 * dt);
    for (let rp of this.multiplayer.remotePlayers.values()) {
      if (!rp) continue;
      if (typeof rp.targetX == "number" && typeof rp.targetY == "number") {
        let d = Math.hypot(rp.targetX - rp.x, rp.targetY - rp.y);
        if (d > 280) rp.x = rp.targetX, rp.y = rp.targetY;
        else rp.x += (rp.targetX - rp.x) * posLerp, rp.y += (rp.targetY - rp.y) * posLerp;
      }
      if (typeof rp.targetFacing == "number") {
        let diff = Math.atan2(Math.sin(rp.targetFacing - (rp.facing || 0)), Math.cos(rp.targetFacing - (rp.facing || 0)));
        rp.facing = (rp.facing || 0) + diff * angLerp;
      }
      rp.attackAnimTimer > 0 && (rp.attackAnimTimer = Math.max(0, rp.attackAnimTimer - dt));
      rp.weaponSkillTimer > 0 && (rp.weaponSkillTimer = Math.max(0, rp.weaponSkillTimer - dt));
      rp.weaponCritTimer > 0 && (rp.weaponCritTimer = Math.max(0, rp.weaponCritTimer - dt));
      rp.bowRecoilTimer > 0 && (rp.bowRecoilTimer = Math.max(0, rp.bowRecoilTimer - dt));
      if (rp.moveSpeedFactor > 0.05) rp.walkCyclePhase = (rp.walkCyclePhase || 0) + 11 * dt * rp.moveSpeedFactor;
      let heroObj = Mi.find((h) => h.id === rp.heroId) || Mi[0];
      let radius = 22, vx = rp.x, vy = rp.y, downed = !rp.alive || rp.hp <= 0;
      let bodyAlpha = downed ? 0.34 : rp.buffs?.bao_stealth ? 0.32 : 1;
      let yOffset = !downed && heroObj.id === "gau" && rp.buffs?.gau_leap ? -28 * Math.sin((this.elapsedTime * 8) % Math.PI) : 0;
      let drawY = vy + yOffset;
      s.save();
      if (!downed && heroObj.id === "duccong" && Array.isArray(rp.buffs?.duccong_pads)) {
        for (let pad of rp.buffs.duccong_pads) {
          if (!pad) continue;
          let pulse = 1 + 0.08 * Math.sin(this.elapsedTime * 7);
          s.save(), s.translate(pad.x, pad.y), s.beginPath(), s.arc(0, 0, (pad.radius || 46) * pulse, 0, Math.PI * 2), s.fillStyle = pad.ready ? "rgba(168, 85, 247, 0.22)" : "rgba(148, 163, 184, 0.12)", s.fill(), s.strokeStyle = pad.ready ? "#E879F9" : "#94A3B8", s.lineWidth = 2.2, s.setLineDash([7, 5]), s.stroke(), s.setLineDash([]), s.restore();
        }
      }
      s.beginPath(), s.ellipse(vx, vy + radius * 0.72, radius * 1.15, radius * 0.52, 0, 0, Math.PI * 2), s.fillStyle = "rgba(0, 0, 0, 0.48)", s.fill();
      s.beginPath(), s.arc(vx, drawY, radius + 6, 0, Math.PI * 2), s.strokeStyle = downed ? "rgba(248, 113, 113, 0.55)" : heroObj.id === "gau" && rp.buffs?.gau_cuong ? "#F97316" : "#38BDF8", s.lineWidth = 2, s.setLineDash([6, 4]), s.stroke(), s.setLineDash([]);
      if (!downed && heroObj.id === "eohyen") {
        s.save();
        let fg = s.createRadialGradient(vx, drawY, 40, vx, drawY, 260);
        fg.addColorStop(0, "rgba(56, 189, 248, 0.09)"), fg.addColorStop(0.65, "rgba(186, 230, 253, 0.04)"), fg.addColorStop(1, "rgba(56, 189, 248, 0)"), s.fillStyle = fg, s.beginPath(), s.arc(vx, drawY, 260, 0, Math.PI * 2), s.fill(), s.restore();
      }
      if (!downed && rp.buffs?.dung_berserk) {
        s.save(), s.translate(vx, drawY), s.rotate(-this.elapsedTime * 4), s.strokeStyle = "#F97316", s.lineWidth = 2.4, s.setLineDash([8, 6]), s.beginPath(), s.arc(0, 0, radius + 12, 0, Math.PI * 2), s.stroke(), s.setLineDash([]), s.restore();
      }
      if (!downed && rp.buffs?.tin_mono) {
        s.save(), s.translate(vx, drawY), s.strokeStyle = "#F43F5E", s.lineWidth = 2.6, s.beginPath(), s.arc(0, 0, radius + 14 + Math.sin(this.elapsedTime * 10) * 2, 0, Math.PI * 2), s.stroke(), s.restore();
      }
      if (!downed && heroObj.id === "trung" && rp.buffs?.trung_orbs) {
        s.save();
        for (let oi = 0; oi < 6; oi++) {
          let oAng = this.elapsedTime * (Math.PI * 2 / 0.75) + Math.PI * 2 / 6 * oi, ox = vx + Math.cos(oAng) * 76, oy = drawY + Math.sin(oAng) * 76;
          s.beginPath(), s.arc(ox, oy, 11, 0, Math.PI * 2), s.fillStyle = "#818CF8", s.fill(), s.strokeStyle = "#E0E7FF", s.lineWidth = 2.2, s.stroke(), s.beginPath(), s.arc(ox, oy, 4.5, 0, Math.PI * 2), s.fillStyle = "#FFFFFF", s.fill();
        }
        s.restore();
      }
      if (!downed && heroObj.id === "gau" && rp.buffs?.gau_cuong) {
        s.save(), s.translate(vx, drawY), s.rotate(this.elapsedTime * 3.2), s.strokeStyle = "#FB923C", s.lineWidth = 2.8, s.setLineDash([12, 8]), s.beginPath(), s.arc(0, 0, radius + 15 + Math.sin(this.elapsedTime * 12) * 2.5, 0, Math.PI * 2), s.stroke(), s.setLineDash([]), s.restore();
      }
      if (!downed && rp.shield > 0) {
        if (heroObj.id === "nguyen") drawNguyenBastionAura(s, vx, drawY, radius, this.elapsedTime, rp.shield / Math.max(1, rp.maxHp || 1500), Boolean(rp.buffs?.nguyen_rescue), a);
        else {
          s.save(), s.beginPath(), s.arc(vx, drawY, radius + 12, 0, Math.PI * 2), s.fillStyle = "rgba(56, 189, 248, 0.16)", s.fill(), s.strokeStyle = "#38BDF8", s.lineWidth = 2, s.stroke();
          if (heroObj.id === "eohyen") {
            s.translate(vx, drawY), s.rotate(this.elapsedTime * 2);
            for (let f = 0; f < 6; f++) {
              let v = Math.PI * 2 / 6 * f;
              s.fillStyle = "#BAE6FD", s.beginPath(), s.arc(Math.cos(v) * (radius + 12), Math.sin(v) * (radius + 12), 3, 0, Math.PI * 2), s.fill();
            }
          }
          s.restore();
        }
      }
      if (!downed) {
        let rpState = {
          facing: rp.facing || 0,
          attackAnimTimer: rp.attackAnimTimer || 0,
          attackAnimAngle: rp.attackAnimAngle || rp.facing || 0,
          weaponAttackDuration: 0.22,
          attackSwingParity: rp.attackSwingParity || 1,
          weaponSkillTimer: rp.weaponSkillTimer || 0,
          weaponSkillDur: rp.weaponSkillDur || 0.46,
          weaponCritTimer: rp.weaponCritTimer || 0,
          bowRecoilTimer: rp.bowRecoilTimer || 0,
          walkCyclePhase: rp.walkCyclePhase || 0,
          moveSpeedFactor: rp.moveSpeedFactor || 0,
          dung_c3_buff_timer: rp.buffs?.dung_c3 ? 1 : 0,
          gau_cuongHungTimer: rp.buffs?.gau_cuong ? 1 : 0,
          bao_stealthFade: rp.buffs?.bao_stealth ? 0.85 : 0,
          danh_khaiSonTimer: rp.buffs?.danh_khaiSon ? 1 : 0,
          danh_dragonTimer: rp.buffs?.danh_dragon ? 1 : 0,
          taidu_droneMode: rp.buffs?.taidu_droneMode || "attack",
          taidu_barrelParity: rp.buffs?.taidu_barrelParity || 1,
          chargeState: rp.buffs?.danh_charge > 0 ? { active: true, elapsed: rp.buffs.danh_charge, maxDur: 1 } : { active: false }
        };
        if (heroObj.id === "nguyen" && rp.buffs?.nguyen_satellites) drawNguyenSatellites(s, vx, drawY, this.elapsedTime * 3.2, this.elapsedTime, 56, a);
        if (heroObj.id === "danh" && rp.buffs?.danh_dragon) drawDanhDragonForm(s, vx, drawY, radius, rp.facing || 0, this.elapsedTime, a);
        if (heroObj.id === "luan" && rp.buffs?.luan_c3_charge > 0) {
          let lAng = typeof rp.buffs.luan_c3_angle == "number" ? rp.buffs.luan_c3_angle : (rp.facing || 0), bLen = 520;
          s.save(), s.strokeStyle = "rgba(192, 132, 252, 0.55)", s.lineWidth = 6 + rp.buffs.luan_c3_charge * 12, s.lineCap = "round", s.beginPath(), s.moveTo(vx, drawY), s.lineTo(vx + Math.cos(lAng) * bLen, drawY + Math.sin(lAng) * bLen), s.stroke(), s.strokeStyle = "#67E8F9", s.lineWidth = 2.5, s.setLineDash([12, 8]), s.beginPath(), s.moveTo(vx, drawY), s.lineTo(vx + Math.cos(lAng) * bLen, drawY + Math.sin(lAng) * bLen), s.stroke(), s.setLineDash([]), s.restore();
        }
        s.save(), s.globalAlpha = bodyAlpha, s.translate(vx, drawY), s.rotate(rpState.attackAnimTimer > 0 ? rpState.attackAnimAngle : rpState.facing), drawHeroWeapon(s, heroObj.id, rpState, this.elapsedTime, a), s.restore();
        if (heroObj.id === "taidu") {
          let drMode = rp.buffs?.taidu_droneMode || "attack", prof = getTaiDuDroneProfile(drMode), drAng = this.elapsedTime * 2.2, drOrbit = prof.orbitDist ?? prof.orbitRadius ?? 56;
          drawTaiDuDrone(s, vx + Math.cos(drAng) * drOrbit, drawY + Math.sin(drAng) * drOrbit, drMode, rpState.facing, this.elapsedTime, 0, a, { playerX: vx, playerY: drawY });
        }
        if (heroObj.id === "gau" && rp.buffs?.gau_c2_guard) {
          s.save(), s.translate(vx, drawY), s.fillStyle = "rgba(245, 158, 11, 0.18)", s.strokeStyle = "#FBBF24", s.lineWidth = 2.8, s.beginPath(), s.arc(0, 0, radius + 16, 0, Math.PI * 2), s.fill(), s.stroke();
          let stacks = Math.min(4, rp.buffs?.gau_c2_stacks || 0);
          for (let i = 0; i < stacks; i++) {
            let sa = Math.PI * 2 / 4 * i + this.elapsedTime * 2.8;
            s.fillStyle = "#FDE047", s.beginPath(), s.arc(Math.cos(sa) * (radius + 20), Math.sin(sa) * (radius + 20), 4, 0, Math.PI * 2), s.fill();
          }
          s.restore();
        }
        if (heroObj.id === "gau" && rp.buffs?.gau_c2_counter) {
          s.save(), s.strokeStyle = "#FEF08A", s.lineWidth = 3, s.beginPath(), s.arc(vx, drawY, radius + 24, 0, Math.PI * 2), s.stroke(), s.restore();
        }
        if (heroObj.id === "bao" && rp.buffs?.bao_emerge) {
          s.save(), s.strokeStyle = "#F5D0FE", s.lineWidth = 3, s.beginPath(), s.arc(vx, drawY, radius + 18, 0, Math.PI * 2), s.stroke(), s.restore();
        }
      }
      s.save(), s.globalAlpha = bodyAlpha, s.translate(vx, drawY), drawHeroBody(s, { heroId: heroObj.id, elapsedTime: this.elapsedTime, radius, facing: rp.facing || 0, color: heroObj.color, accentColor: heroObj.accentColor, isMono: a, hitFlash: 0, moveSpeedFactor: rp.moveSpeedFactor || 0, walkCyclePhase: rp.walkCyclePhase || 0, isUlt: Boolean(rp.buffs?.dung_c3 || rp.buffs?.gau_cuong || rp.buffs?.danh_dragon || rp.buffs?.danh_thienPhat), isStealth: Boolean(rp.buffs?.bao_stealth), isDowned: downed, borderColor: downed ? "#F87171" : "#38BDF8" }), s.restore();
      if (!downed && heroObj.id === "danh") {
        let stances = [
          { active: Boolean(rp.buffs?.danh_khaiSon), color: "#F59E0B", rim: "#FEF08A" },
          { active: Boolean(rp.buffs?.danh_longNgam), color: "#EF4444", rim: "#FB923C" },
          { active: Boolean(rp.buffs?.danh_thienPhat), color: "#FBBF24", rim: "#FFFFFF" }
        ];
        s.save(), s.translate(vx, drawY);
        for (let i = 0; i < 3; i++) {
          let st = stances[i], ang = this.elapsedTime * 1.8 + i * (Math.PI * 2 / 3), ox = Math.cos(ang) * (radius + 16), oy = Math.sin(ang) * (radius + 16);
          if (st.active) {
            s.save(), s.translate(ox, oy), s.rotate(ang + this.elapsedTime * 2), s.fillStyle = st.color, s.strokeStyle = st.rim, s.lineWidth = 1.6, s.beginPath(), s.moveTo(0, -5), s.lineTo(4.5, 0), s.lineTo(0, 5), s.lineTo(-4.5, 0), s.closePath(), s.fill(), s.stroke(), s.restore();
          }
        }
        s.restore();
        if ((rp.buffs?.danh_charge || 0) > 0) {
          let cp = Math.min(1, rp.buffs.danh_charge), bx = vx - 28, by = drawY - radius - 28;
          s.fillStyle = "rgba(15, 23, 42, 0.9)", s.fillRect(bx - 1, by - 1, 58, 7), s.fillStyle = cp >= 1 ? "#FBBF24" : "#F97316", s.fillRect(bx, by, 56 * cp, 5);
        }
      }
      if (!downed && rp.buffs?.cc_root) {
        s.save(), s.translate(vx, drawY), s.rotate(this.elapsedTime * 2.5), s.strokeStyle = "#C084FC", s.lineWidth = 2.6, s.beginPath(), s.arc(0, 0, radius + 9, 0, Math.PI * 2), s.stroke(), s.restore();
      }
      if (!downed && rp.buffs?.cc_stun) {
        s.save();
        let sy = drawY - radius - 26;
        s.strokeStyle = "#FACC15", s.lineWidth = 1.8, s.beginPath(), s.ellipse(vx, sy, 16, 5, 0, 0, Math.PI * 2), s.stroke();
        for (let v = 0; v < 3; v++) {
          let stA = this.elapsedTime * 7 + Math.PI * 2 / 3 * v;
          s.fillStyle = "#FEF08A", s.beginPath(), s.arc(vx + Math.cos(stA) * 16, sy + Math.sin(stA) * 5, 3.2, 0, Math.PI * 2), s.fill();
        }
        s.restore();
      }
      if (downed && this.multiplayer.reviveTargetId === rp.id && this.multiplayer.reviveProgress > 0) {
        let prog = Math.min(1, this.multiplayer.reviveProgress);
        s.save();
        s.strokeStyle = "rgba(52, 211, 153, 0.3)", s.lineWidth = 4, s.beginPath(), s.arc(vx, drawY, radius + 16, 0, Math.PI * 2), s.stroke();
        s.strokeStyle = "#34D399", s.lineWidth = 4.5, s.beginPath(), s.arc(vx, drawY, radius + 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog), s.stroke();
        s.font = '800 11px "JetBrains Mono", monospace', s.textAlign = "center", s.fillStyle = "#34D399";
        s.fillText(`\u2728 H\u1ED2I SINH ${Math.round(prog * 100)}%`, vx, drawY + radius + 24);
        s.restore();
      }
      let h = drawY - radius - 14;
      s.fillStyle = "rgba(15, 23, 42, 0.85)", s.fillRect(vx - 25, h - 1, 50, 6), s.fillStyle = downed ? "#64748B" : "#38BDF8", s.fillRect(vx - 24, h, 48 * Math.max(0, Math.min(1, (rp.hp || 0) / Math.max(1, rp.maxHp || 1))), 4);
      let label = downed ? `\u{1F480} ${rp.name}` : `${rp.name} Lv.${rp.level || 1}`;
      s.font = '700 11px "Outfit", sans-serif', s.textAlign = "center", s.fillStyle = "#0F172A", s.fillText(label, vx + 1, h - 4), s.fillStyle = downed ? "#FCA5A5" : "#7DD3FC", s.fillText(label, vx, h - 5);
      s.restore();
    }
  }
  syncMultiplayerState(dt) {
    if (!this.multiplayer.active || !mpClient.isConnected()) return;
    this.multiplayer.playerSyncTimer += dt;
    if (this.multiplayer.playerSyncTimer >= 0.05) {
      this.multiplayer.playerSyncTimer = 0;
      this.sendPlayerSync(false);
    }
    this.multiplayer.burnSyncTimer += dt;
    if (this.isCoopHost() && this.multiplayer.burnSyncTimer >= 0.25 && this.multiplayer.burnSyncMap.size > 0) {
      this.multiplayer.burnSyncTimer = 0;
      for (let [eid, dmg] of this.multiplayer.burnSyncMap.entries()) {
        let rounded = Math.round(dmg);
        rounded >= 1 && mpClient.send({ type: "DAMAGE_ENEMY", enemyId: eid, dmg: rounded, quiet: true });
      }
      this.multiplayer.burnSyncMap.clear();
    }
    if (this.isCoopHost()) {
      this.multiplayer.worldSyncTimer += dt;
      if (this.multiplayer.worldSyncTimer >= 0.05) {
        this.multiplayer.worldSyncTimer = 0;
        this.sendWorldSnapshot();
      }
    }
  }
  sendPlayerSync() {
    if (!this.multiplayer.active || !mpClient.isConnected()) return;
    mpClient.send({
      type: "SYNC_PLAYER",
      state: {
        x: Math.round(this.player.x * 10) / 10,
        y: Math.round(this.player.y * 10) / 10,
        facing: Math.round(this.player.facing * 100) / 100,
        hp: Math.round(this.player.hp),
        maxHp: Math.round(this.player.maxHp),
        shield: Math.round(this.player.shield || 0),
        level: this.player.level,
        alive: !this.multiplayer.localDowned && this.player.hp > 0,
        moveSpeedFactor: Math.round((this.player.moveSpeedFactor || 0) * 100) / 100,
        walkCyclePhase: Math.round((this.player.walkCyclePhase || 0) * 100) / 100,
        attackAnimTimer: Math.round((this.player.attackAnimTimer || 0) * 100) / 100,
        attackAnimAngle: Math.round((this.player.attackAnimAngle || 0) * 100) / 100,
        attackSwingParity: this.player.attackSwingParity || 1,
        weaponSkillTimer: Math.round((this.player.weaponSkillTimer || 0) * 100) / 100,
        weaponSkillDur: Math.round((this.player.weaponSkillDur || 0.46) * 100) / 100,
        weaponCritTimer: Math.round((this.player.weaponCritTimer || 0) * 100) / 100,
        bowRecoilTimer: Math.round((this.player.bowRecoilTimer || 0) * 100) / 100,
        buffs: {
          dung_c3: (this.player.dung_c3_buff_timer || 0) > 0,
          dung_berserk: (this.player.berserkTimer || 0) > 0,
          tin_mono: (this.player.tin_monochrome_realm_timer || 0) > 0,
          trung_orbs: Boolean(this.player.trung_orbs && this.player.trung_orbs.active),
          gau_cuong: (this.player.gau_cuongHungTimer || 0) > 0,
          gau_c2_guard: (this.player.gau_c2_guardTimer || 0) > 0,
          gau_c2_stacks: this.player.gau_c2_stacks || 0,
          gau_c2_counter: (this.player.gau_c2_counterWaveTimer || 0) > 0,
          gau_leap: this.player.dashActive && this.player.dashKind === "gau_c3_leap",
          bao_stealth: (this.player.bao_stealthTimer || 0) > 0,
          bao_emerge: (this.player.bao_emergeTimer || 0) > 0,
          danh_khaiSon: (this.player.danh_khaiSonTimer || 0) > 0,
          danh_longNgam: (this.player.danh_longNgamTimer || 0) > 0,
          danh_thienPhat: (this.player.danh_thienPhatTimer || 0) > 0,
          danh_dragon: (this.player.danh_dragonTimer || 0) > 0,
          danh_charge: this.player.chargeState?.active ? Math.min(1, Math.round((this.player.chargeState.elapsed / Math.max(0.1, this.player.chargeState.maxDur)) * 100) / 100) : 0,
          luan_c3_charge: this.player.luan_c3Charge ? Math.min(1, Math.round((1 - this.player.luan_c3Charge.timer / Math.max(0.05, this.player.luan_c3Charge.maxTimer)) * 100) / 100) : 0,
          luan_c3_angle: this.player.luan_c3Charge ? Math.round(this.player.luan_c3Charge.angle * 100) / 100 : 0,
          duccong_pads: this.currentHero.id === "duccong" && this.duccong_pads ? [1, 2].map((idx) => this.duccong_pads[idx] && (this.player.cooldowns[idx] || 0) > 0 ? { idx, x: Math.round(this.duccong_pads[idx].x), y: Math.round(this.duccong_pads[idx].y), radius: Math.round(this.duccong_pads[idx].radius || 46), ready: (this.duccong_pads[idx].teleportCd || 0) <= 0 } : null).filter(Boolean) : null,
          taidu_droneMode: this.player.taidu_droneMode || "attack",
          taidu_barrelParity: this.player.taidu_barrelParity || 1,
          nguyen_satellites: (this.player.nguyen_satellitesTimer || 0) > 0,
          nguyen_rescue: (this.player.nguyen_rescueFlashTimer || 0) > 0,
          cc_stun: (this.player.stunTimer || 0) > 0,
          cc_root: (this.player.rootTimer || 0) > 0
        }
      }
    });
    if (this.multiplayer.vfxQueue.length > 0) {
      mpClient.send({ type: "PLAYER_VFX", events: this.multiplayer.vfxQueue.splice(0, 120) });
    }
  }
  sendWorldSnapshot() {
    if (!this.multiplayer.active || !this.isCoopHost() || !mpClient.isConnected()) return;
    let enemiesPayload = [];
    for (let e of this.enemies) {
      if (e.hp <= 0 || e.mpKilled) continue;
      enemiesPayload.push({
        id: e.id,
        kind: e.kind,
        bossWave: e.bossWave,
        name: e.name,
        radius: e.radius,
        color: e.color,
        accentColor: e.accentColor,
        speed: e.speed,
        damage: e.damage,
        xpValue: e.xpValue,
        hp: Math.round(e.hp),
        maxHp: Math.round(e.maxHp),
        x: Math.round(e.x * 10) / 10,
        y: Math.round(e.y * 10) / 10,
        facing: Math.round((e.facing || 0) * 100) / 100,
        phase: e.phase || 1,
        stunTimer: Math.round((e.stunTimer || 0) * 100) / 100,
        slowFactor: Math.round((e.slowFactor || 0) * 100) / 100,
        frozenTimer: Math.round((e.frozenTimer || 0) * 100) / 100,
        bao_marks: e.bao_marks || 0,
        gau_quakeTimer: Math.round((e.gau_quakeTimer || 0) * 100) / 100,
        tin_hasMark: Boolean(e.tin_hasMark),
        burnCount: e.longhoiBurnStacks || 0
      });
    }
    mpClient.send({
      type: "WORLD_SNAPSHOT",
      wave: this.wave,
      fullList: true,
      waveSpawned: this.waveSpawned,
      enemies: enemiesPayload,
      bossWarnings: this.bossWarnings.map((w) => ({ id: w.id, x: w.x, y: w.y, radius: w.radius, timer: w.timer, duration: w.duration, damage: w.damage, kind: w.kind, color: w.color, ccType: w.ccType, ccDur: w.ccDur })),
      bossBeams: this.bossBeams.map((b) => ({ id: b.id, x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, width: b.width, timer: b.timer, duration: b.duration, damage: b.damage, color: b.color, glowColor: b.glowColor, ccType: b.ccType, ccDur: b.ccDur, ccFactor: b.ccFactor })),
      bossShockRings: this.bossShockRings.map((r) => ({ id: r.id, x: r.x, y: r.y, currentRadius: r.currentRadius, maxRadius: r.maxRadius, ringWidth: r.ringWidth, speed: r.speed, damage: r.damage, color: r.color, accentColor: r.accentColor, ccType: r.ccType, ccDur: r.ccDur, ccFactor: r.ccFactor }))
    });
  }
  handleMultiplayerMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === "MATCH_OVER" && this.multiplayer.active) {
      this.gameState = msg.victory ? "VICTORY" : "GAME_OVER", R.setMusicMode("off");
      this.onGameOver && this.onGameOver(Boolean(msg.victory), msg);
      this.onStateChange && this.onStateChange();
      return;
    }
    if (!this.multiplayer.active) {
      if (mpClient.room && ["WAVE_META_SYNC", "ENEMIES_SPAWNED", "WORLD_SYNC", "ENEMY_HIT", "PLAYER_STATE", "REMOTE_VFX", "PLAYER_DOWNED", "PLAYER_REVIVED", "ALLY_SUPPORT"].includes(msg.type)) {
        this.multiplayer.pendingSyncMessages.length < 120 && this.multiplayer.pendingSyncMessages.push(msg);
      }
      return;
    }
    if (msg.type === "WAVE_META_SYNC" && !this.isCoopHost()) {
      if (typeof msg.wave == "number" && msg.wave > this.wave) {
        this.enemies = [], this.bossWarnings = [], this.bossBeams = [], this.bossShockRings = [];
        this.startWave(msg.wave);
      }
      if (typeof msg.waveTotal == "number") this.waveTotal = msg.waveTotal;
      if (typeof msg.waveSpawned == "number") this.waveSpawned = msg.waveSpawned;
    } else if (msg.type === "ENEMIES_SPAWNED" && !this.isCoopHost()) {
      if (typeof msg.waveTotal == "number") this.waveTotal = msg.waveTotal;
      if (typeof msg.waveSpawned == "number") this.waveSpawned = Math.max(this.waveSpawned, msg.waveSpawned);
      let bossSpawned = false;
      for (let raw of msg.enemies || []) {
        if (!raw || this.enemies.some((e) => e.id === raw.id)) continue;
        this.enemies.push({ ...raw, vx: 0, vy: 0, mpTargetX: raw.x, mpTargetY: raw.y, stunTimer: 0, slowFactor: 0, slowTimer: 0, hitFlash: 0, attackCooldown: 0.5, aoeTimer: 2.2, longhoiBurnStacks: 0, longhoiBurnTimer: 0, longhoiBurnAmpTimer: 0, longhoiBurnTick: 0 });
        if (raw.kind === "boss") {
          R.playBossWarn(), this.addShake(14, 0.45);
          this.addFloatingText(raw.x, raw.y - (raw.radius || 46) - 26, `\u26A0\uFE0F TR\xD9M: ${raw.name || "\u0110\u1EA0I TR\xD9M"}!`, "#EF4444", 19);
          bossSpawned = true;
        }
      }
      this.syncMusicState();
      bossSpawned && this.onStateChange && this.onStateChange();
    } else if (msg.type === "ENEMY_HIT") {
      let enemy = this.enemies.find((e) => e.id === msg.enemyId);
      if (enemy && !enemy.mpKilled) {
        enemy.hp = Math.max(0, msg.hp), enemy.hitFlash = 0.12;
        if (!this.isCoopHost() && (msg.knockX || msg.knockY)) {
          let f = enemy.kind === "boss" ? 0.25 : 1;
          enemy.x = Math.max(enemy.radius, Math.min(Se - enemy.radius, enemy.x + (msg.knockX || 0) * f));
          enemy.y = Math.max(enemy.radius, Math.min(Ce - enemy.radius, enemy.y + (msg.knockY || 0) * f));
        }
        if (msg.effects && typeof msg.effects == "object") {
          typeof msg.effects.slowFactor == "number" && (enemy.slowFactor = Math.max(enemy.slowFactor || 0, msg.effects.slowFactor), enemy.slowTimer = Math.max(enemy.slowTimer || 0, 1.5));
          typeof msg.effects.stunTimer == "number" && (enemy.stunTimer = Math.max(enemy.stunTimer || 0, msg.effects.stunTimer));
          typeof msg.effects.frozenTimer == "number" && (enemy.frozenTimer = Math.max(enemy.frozenTimer || 0, msg.effects.frozenTimer));
          typeof msg.effects.bao_marks == "number" && (enemy.bao_marks = msg.effects.bao_marks, enemy.bao_markTimer = 6);
          typeof msg.effects.tin_hasMark == "boolean" && (enemy.tin_hasMark = msg.effects.tin_hasMark);
          typeof msg.effects.gau_quakeTimer == "number" && (enemy.gau_quakeTimer = Math.max(enemy.gau_quakeTimer || 0, msg.effects.gau_quakeTimer));
        }
        if (msg.byPlayerId !== mpClient.playerId && !msg.quiet) {
          this.spawnImpactBurst(enemy.x, enemy.y, msg.isCrit ? "#F59E0B" : "#38BDF8", Boolean(msg.isCrit), 0);
          this.addFloatingText(enemy.x, enemy.y - enemy.radius, msg.isCrit ? `${msg.dmg}!` : `${msg.dmg}`, msg.isCrit ? "#F59E0B" : "#E2E8F0", msg.isCrit ? 18 : 13);
        }
        if (msg.killed) {
          enemy.mpKilled = true, enemy.hp = 0;
          this.handleEnemyKilled(enemy, msg.byPlayerId);
          this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
          if (typeof msg.waveKilled == "number") this.waveKilled = Math.max(this.waveKilled, msg.waveKilled);
          if (enemy.kind === "boss") {
            this.syncMusicState();
            this.onStateChange && this.onStateChange();
          }
        }
      }
    } else if (msg.type === "WORLD_SYNC" && !this.isCoopHost()) {
      if (typeof msg.wave == "number" && msg.wave < this.wave) return;
      if (typeof msg.wave == "number" && msg.wave > this.wave) {
        this.enemies = [], this.bossWarnings = [], this.bossBeams = [], this.bossShockRings = [];
        this.startWave(msg.wave);
        this.onStateChange && this.onStateChange();
      }
      if (typeof msg.waveTotal == "number") this.waveTotal = msg.waveTotal;
      if (typeof msg.waveSpawned == "number") this.waveSpawned = Math.max(this.waveSpawned, msg.waveSpawned);
      if (typeof msg.waveKilled == "number") this.waveKilled = Math.max(this.waveKilled, msg.waveKilled);
      let serverMap = new Map();
      for (let se of msg.enemies || []) serverMap.set(se.id, se);
      let localIds = new Set();
      let musicDirty = false;
      for (let e of this.enemies) {
        localIds.add(e.id);
        let se = serverMap.get(e.id);
        if (se) {
          if (Math.hypot(se.x - e.x, se.y - e.y) > 280) e.x = se.x, e.y = se.y;
          let phaseChanged = Boolean(se.phase && e.phase !== se.phase);
          e.mpTargetX = se.x, e.mpTargetY = se.y, e.facing = se.facing, e.hp = se.hp, e.maxHp = se.maxHp, e.phase = se.phase, e.stunTimer = se.stunTimer, e.slowFactor = se.slowFactor, e.frozenTimer = se.frozenTimer, e.bao_marks = se.bao_marks, e.gau_quakeTimer = se.gau_quakeTimer, e.tin_hasMark = se.tin_hasMark, e.longhoiBurnStacks = se.burnCount || 0;
          if (se.kind) e.kind = se.kind;
          if (se.bossWave) e.bossWave = se.bossWave;
          if (se.name) e.name = se.name;
          if (se.radius) e.radius = se.radius;
          if (se.color) e.color = se.color;
          if (se.accentColor) e.accentColor = se.accentColor;
          if (phaseChanged) musicDirty = true;
        }
      }
      for (let se of msg.enemies || []) {
        if (!se || localIds.has(se.id) || (se.hp !== undefined && se.hp <= 0)) continue;
        let isBoss = se.kind === "boss" || Boolean(se.bossWave);
        let fallbackR = isBoss ? 46 : 18;
        let upserted = {
          ...se,
          kind: se.kind || (se.bossWave ? "boss" : "minion"),
          radius: Math.max(12, Number(se.radius) || fallbackR),
          color: se.color || (isBoss ? "#EF4444" : "#22C55E"),
          accentColor: se.accentColor || "#F59E0B",
          speed: se.speed || 100,
          damage: se.damage || 25,
          xpValue: se.xpValue || 25,
          hp: Math.max(1, Number(se.hp) || 100),
          maxHp: Math.max(1, Number(se.maxHp) || Number(se.hp) || 100),
          vx: 0,
          vy: 0,
          mpTargetX: se.x,
          mpTargetY: se.y,
          stunTimer: se.stunTimer || 0,
          slowFactor: se.slowFactor || 0,
          slowTimer: 0,
          frozenTimer: se.frozenTimer || 0,
          hitFlash: 0,
          attackCooldown: 0.5,
          aoeTimer: 2.2,
          longhoiBurnStacks: se.burnCount || 0,
          longhoiBurnTimer: 0,
          longhoiBurnAmpTimer: 0,
          longhoiBurnTick: 0
        };
        this.enemies.push(upserted);
        if (isBoss) {
          R.playBossWarn(), this.addShake(14, 0.45);
          this.addFloatingText(upserted.x, upserted.y - upserted.radius - 26, `\u26A0\uFE0F TR\xD9M: ${upserted.name || "\u0110\u1EA0I TR\xD9M"}!`, "#EF4444", 19);
          musicDirty = true;
        }
      }
      if (msg.fullList !== false) {
        let beforeLen = this.enemies.length;
        this.enemies = this.enemies.filter((e) => serverMap.has(e.id));
        this.enemies.length !== beforeLen && (musicDirty = true);
      }
      if (musicDirty) {
        this.syncMusicState();
        this.onStateChange && this.onStateChange();
      }
      for (let w of msg.bossWarnings || []) {
        let key = `w_${w.id}`;
        if (!this.multiplayer.seenBossHazardIds.has(key)) {
          this.multiplayer.seenBossHazardIds.add(key);
          this.bossWarnings.push({ ...w });
        }
      }
      for (let b of msg.bossBeams || []) {
        let key = `b_${b.id}`;
        if (!this.multiplayer.seenBossHazardIds.has(key)) {
          this.multiplayer.seenBossHazardIds.add(key);
          this.bossBeams.push({ ...b, triggered: false, fadeTimer: 0.38 });
        }
      }
      for (let r of msg.bossShockRings || []) {
        let key = `r_${r.id}`;
        if (!this.multiplayer.seenBossHazardIds.has(key)) {
          this.multiplayer.seenBossHazardIds.add(key);
          this.bossShockRings.push({ ...r, hitPlayer: false });
        }
      }
    } else if (msg.type === "PLAYER_STATE" && msg.player) {
      let p = msg.player;
      if (p.id === mpClient.playerId) return;
      let existing = this.multiplayer.remotePlayers.get(p.id);
      if (existing) {
        existing.targetX = p.x, existing.targetY = p.y, existing.targetFacing = p.facing, existing.hp = p.hp, existing.maxHp = p.maxHp, existing.shield = p.shield, existing.level = p.level, existing.alive = p.alive, existing.heroId = p.heroId, existing.moveSpeedFactor = p.moveSpeedFactor, existing.walkCyclePhase = p.walkCyclePhase, p.attackAnimTimer > existing.attackAnimTimer && (existing.attackAnimTimer = p.attackAnimTimer, existing.attackAnimAngle = p.attackAnimAngle, existing.attackSwingParity = p.attackSwingParity), p.weaponSkillTimer > existing.weaponSkillTimer && (existing.weaponSkillTimer = p.weaponSkillTimer, existing.weaponSkillDur = p.weaponSkillDur), p.weaponCritTimer > existing.weaponCritTimer && (existing.weaponCritTimer = p.weaponCritTimer), p.bowRecoilTimer > existing.bowRecoilTimer && (existing.bowRecoilTimer = p.bowRecoilTimer), existing.buffs = p.buffs || {};
      } else {
        this.multiplayer.remotePlayers.set(p.id, { ...p, targetX: p.x, targetY: p.y, targetFacing: p.facing || 0 });
      }
    } else if (msg.type === "REMOTE_VFX") {
      this.applyRemoteVfx(msg.heroId, msg.events || []);
    } else if (msg.type === "PLAYER_DOWNED") {
      let rp = this.multiplayer.remotePlayers.get(msg.playerId);
      rp && (rp.alive = false, rp.hp = 0);
      this.onToast && this.onToast(`\u{1F480} ${msg.playerName} \u0111\xE3 ng\xE3 xu\u1ED1ng!`);
    } else if (msg.type === "PLAYER_REVIVED") {
      let hpRatio = typeof msg.hpRatio == "number" ? msg.hpRatio : 0.45;
      if (msg.targetPlayerId === mpClient.playerId) {
        this.multiplayer.localDowned = false;
        this.player.hp = Math.max(1, Math.round(this.player.maxHp * hpRatio));
        this.player.stunTimer = 0, this.player.rootTimer = 0, this.player.slowTimer = 0, this.player.burnTimer = 0;
        R.playHolyLight();
        this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 110, spread: Math.PI * 2, color: "#34D399", life: 0, maxLife: 0.4, kind: "shockwave" });
        this.addFloatingText(this.player.x, this.player.y - 34, "\u2728 \u0110\u01AF\u1EE2C \u0110\u1ED2NG \u0110\u1ED8I H\u1ED2I SINH!", "#34D399", 17);
        this.sendPlayerSync(true);
        this.onToast && this.onToast(`${msg.reviverName || "\u0110\u1ED3ng \u0111\u1ED9i"} \u0111\xE3 h\u1ED3i sinh b\u1EA1n!`);
        this.onStateChange && this.onStateChange();
      } else {
        let rp = this.multiplayer.remotePlayers.get(msg.targetPlayerId);
        if (rp) {
          rp.alive = true;
          rp.hp = Math.max(1, Math.round((rp.maxHp || 1200) * hpRatio));
          this.slashes.push({ x: rp.x, y: rp.y, angle: 0, radius: 110, spread: Math.PI * 2, color: "#34D399", life: 0, maxLife: 0.4, kind: "shockwave" });
          this.addFloatingText(rp.x, rp.y - 34, `\u2728 ${rp.name} H\u1ED2I SINH!`, "#34D399", 16);
        }
        this.multiplayer.reviveTargetId === msg.targetPlayerId && (this.multiplayer.reviveTargetId = null, this.multiplayer.reviveProgress = 0);
      }
    } else if (msg.type === "ALLY_SUPPORT") {
      let senderId = msg.fromPlayerId ?? msg.byPlayerId;
      if (!this.multiplayer.localDowned && this.player.hp > 0 && senderId !== mpClient.playerId) {
        if (Math.hypot(this.player.x - (msg.x || 0), this.player.y - (msg.y || 0)) <= (msg.radius || 240) + this.player.radius) {
          let allyHeal = Math.max(0, Math.round((msg.heal || 0) * 0.75)), allyShield = Math.max(0, Math.round((msg.shield || 0) * 0.75));
          let didHeal = allyHeal > 0 ? this.healPlayer(allyHeal, "HEAL", msg.label || undefined) : 0;
          if (allyShield > 0) {
            let cap = Math.round(this.player.maxHp * 0.65);
            this.player.shield = Math.min(cap, (this.player.shield || 0) + allyShield);
            this.player.shieldTimer = Math.max(this.player.shieldTimer || 0, 10);
            if (!didHeal && msg.label) {
              R.playHeal();
              this.addFloatingText(this.player.x, this.player.y - 22, msg.label, msg.color || "#FDE047", 15);
              this.spawnParticles(this.player.x, this.player.y, msg.color || "#FDE047", 7, 25, 95, 3, 0.4);
            }
          }
          if (didHeal > 0 || allyShield > 0) {
            this.slashes.push({ x: this.player.x, y: this.player.y, angle: 0, radius: 74, spread: Math.PI * 2, color: msg.color || "#34D399", life: 0, maxLife: 0.32, kind: "shockwave" });
          }
        }
      }
    } else if (msg.type === "PLAYER_LEFT") {
      this.multiplayer.remotePlayers.delete(msg.playerId);
      msg.room && (this.multiplayer.isHost = msg.room.hostId === mpClient.playerId);
      this.onToast && this.onToast(`${msg.playerName || "\u0110\u1ED3ng \u0111\u1ED9i"} \u0111\xE3 r\u1EDDi ph\xF2ng.`);
    } else if (msg.type === "ROOM_UPDATE" && msg.room) {
      this.multiplayer.isHost = msg.room.hostId === mpClient.playerId;
    } else if (msg.type === "WAVE_COMPLETED" && msg.reward) {
      this.handleWaveCompleted(msg.reward);
    } else if (msg.type === "WAVE_STARTED") {
      msg.room && (this.multiplayer.isHost = msg.room.hostId === mpClient.playerId);
      if (typeof msg.wave == "number" && (msg.wave > this.wave || (msg.wave === 1 && this.wave <= 1 && this.waveSpawned === 0 && this.enemies.length === 0))) {
        this.enemies = [], this.bossWarnings = [], this.bossBeams = [], this.bossShockRings = [];
        this.startWave(msg.wave);
        this.onStateChange && this.onStateChange();
      }
    }
  }
  applyRemoteVfx(heroId, events) {
    for (let ev of events) {
      if (!ev || !ev.type) continue;
      if (ev.type === "slash") {
        this.slashes.push({ x: ev.x, y: ev.y, angle: ev.angle || 0, radius: ev.radius || 80, spread: ev.spread || 1.2, dir: ev.dir || 1, step: ev.step, comboStep: ev.comboStep, empowered: ev.empowered, crossed: ev.crossed, heavy: ev.heavy, color: ev.color || "#38BDF8", accentColor: ev.accentColor, life: 0, maxLife: ev.maxLife || 0.24, kind: ev.kind || "slash" });
      } else if (ev.type === "lightning") {
        this.createBranchingLightning(ev.x1, ev.y1, ev.x2, ev.y2, ev.color || "#38BDF8", ev.width || 3);
      } else if (ev.type === "tear") {
        this.spawnSpatialTear(ev.x1, ev.y1, ev.x2, ev.y2, ev.color || "#F43F5E", ev.width || 10);
      } else if (ev.type === "crack") {
        this.spawnGroundCrack(ev.x, ev.y, ev.angle || 0, ev.len || 80, ev.color || "#EA580C", ev.glowColor || "#FEF08A");
      } else if (ev.type === "afterimage") {
        this.afterimages.push({ x: ev.x, y: ev.y, facing: ev.facing || 0, color: ev.color || "#A855F7", alpha: ev.alpha || 0.8, life: 0, maxLife: ev.maxLife || 0.35, radius: 22 });
      } else if (ev.type === "proj_vis") {
        this.projectiles.push({ id: this.nextEntityId++, visualOnly: true, fromPlayer: true, kind: ev.kind || "kin_arrow", isWhirlwindArrow: ev.isWhirlwindArrow, portalBoosted: Boolean(ev.portalBoosted), x: ev.x, y: ev.y, vx: ev.vx, vy: ev.vy, radius: ev.radius || 9, damage: 0, color: ev.color || "#34D399", angle: ev.angle || 0, distanceTraveled: 0, maxDistance: ev.maxDistance || 400, pierceLeft: ev.pierceLeft || 1, hitIds: /* @__PURE__ */ new Set() });
      } else if (ev.type === "tin_crystal_vis") {
        this.tinCrystals.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 44, life: 0, maxLife: ev.maxLife || 3.75, pulse: 0 });
      } else if (ev.type === "tin_crystal_pop_vis") {
        for (let ci = this.tinCrystals.length - 1; ci >= 0; ci--) {
          let tc = this.tinCrystals[ci];
          if (tc.visualOnly && Math.hypot(tc.x - ev.x, tc.y - ev.y) <= 64) {
            this.tinCrystals.splice(ci, 1);
            break;
          }
        }
        this.spawnRedCrystals(ev.x, ev.y, 12, 65, 190);
        this.spawnSpatialTear(ev.x - 40, ev.y - 40, ev.x + 40, ev.y + 40, "#F43F5E", 10);
      } else if (ev.type === "eohyen_pillar_vis") {
        if (this.icePillars.length < 44) {
          this.icePillars.push({ id: this.nextEntityId++, visualOnly: true, ownerId: ev.ownerId || null, x: ev.x, y: ev.y, rot: ev.rot || 0, size: ev.size || 18, maxSize: 22, active: true, state: ev.state || "rising", animTimer: 0, maxAnimTimer: 0.3, plungeOffset: ev.state === "plunging" ? 160 : 0, riseProgress: ev.state === "plunging" ? 1 : 0, levitateHeight: 0, glowAlpha: 0.85, life: 0, maxLife: 18 });
        }
      } else if (ev.type === "eohyen_pillars_launch_vis") {
        let visPillars = this.icePillars.filter((p) => p.visualOnly && (!ev.ownerId || !p.ownerId || p.ownerId === ev.ownerId));
        for (let idx = 0; idx < visPillars.length; idx++) {
          let W = visPillars[idx];
          W.state = "levitating", W.animTimer = 0, W.maxAnimTimer = 0.25 + idx / Math.max(1, visPillars.length) * 1.1, W.levitateHeight = 0, W.levitateTarget = { x: ev.x + (Math.random() - 0.5) * 80, y: ev.y + (Math.random() - 0.5) * 80, dmg: 0 };
        }
      } else if (ev.type === "luan_portal_vis") {
        this.luanPortals.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 54, life: 0, maxLife: ev.maxLife || 9, damage: 0, detDmg: 0 });
      } else if (ev.type === "luan_portal_detonate_vis") {
        this.luanPortals = this.luanPortals.filter((pt) => !pt.visualOnly);
      } else if (ev.type === "luan_rift_vis") {
        this.luanRifts.push({ id: this.nextEntityId++, visualOnly: true, x1: ev.x1, y1: ev.y1, x2: ev.x2, y2: ev.y2, width: ev.width || 10, life: 0, maxLife: ev.maxLife || 2.8, damage: 0, offsets: ev.offsets });
      } else if (ev.type === "luan_beam_vis") {
        this.luanBeams.push({ id: this.nextEntityId++, visualOnly: true, x1: ev.x1, y1: ev.y1, x2: ev.x2, y2: ev.y2, width: ev.width || 36, life: 0, maxLife: ev.maxLife || 0.52, isBranch: Boolean(ev.isBranch) });
      } else if (ev.type === "zone_vis") {
        this.zones.push({ id: this.nextEntityId++, visualOnly: true, kind: ev.kind || "arrow_rain", x: ev.x, y: ev.y, radius: ev.radius || 140, timer: 0, duration: ev.duration || 3, tickTimer: 0, tickInterval: 0.5, damagePerTick: 0, rotation: 0 });
      } else if (ev.type === "lava_vis") {
        this.lavaPools.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 145, timer: 0, duration: ev.duration || 3.5, tickTimer: 0, tickInterval: 0.5, damagePerTick: 0 });
      } else if (ev.type === "meteor_vis") {
        this.giantMeteors.push({ id: this.nextEntityId++, visualOnly: true, startX: ev.x - 280, startY: ev.y - 560, targetX: ev.x, targetY: ev.y, currentX: ev.x - 280, currentY: ev.y - 560, timer: 0, duration: ev.duration || 0.65, damage: 0, radius: ev.radius || 215, meteorSize: ev.meteorSize || 46, fromPlayer: true, color: ev.color || "#F97316" });
      } else if (ev.type === "frost_barrage_vis") {
        let P = ev.totalIcicles || 30, D = ev.duration || 3;
        this.frostBarrages.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 175, duration: D, timer: 0, totalIcicles: P, iciclesFired: 0, interval: D / P, tickTimer: 0, damagePerHit: 0 });
      } else if (ev.type === "vortex_vis") {
        this.galaxyVortices.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 145, duration: ev.duration || 3, timer: 0, tickTimer: 0, tickInterval: 0.4, damagePerTick: 0, finalBurstDmg: 0, isGalaxy: Boolean(ev.isGalaxy), fromPlayer: true, skillIdx: -1, rotation: 0, stars: Array.from({ length: ev.isGalaxy ? 40 : 22 }, () => ({ distRatio: 0.15 + Math.random() * 0.82, angle: Math.random() * Math.PI * 2, size: 1.5 + Math.random() * 2.5, color: "#C084FC" })) });
      } else if (ev.type === "rocket_vis") {
        let ang = Math.atan2(ev.ty - ev.sy, ev.tx - ev.sx), spd = ev.isFromPlayer ? 600 : 340;
        this.rocketProjectiles.push({ id: this.nextEntityId++, visualOnly: Boolean(ev.isFromPlayer), x: ev.sx, y: ev.sy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, angle: ang, damage: ev.damage || 0, isFromPlayer: Boolean(ev.isFromPlayer), color: ev.color || "#EA580C", radius: 9, distanceTraveled: 0, maxDistance: Math.hypot(ev.tx - ev.sx, ev.ty - ev.sy) + 40, smokeTimer: 0 });
      } else if (ev.type === "shadow_clone_vis") {
        this.shadowClones.push({ id: this.nextEntityId++, visualOnly: true, x: ev.startX, y: ev.startY, startX: ev.startX, startY: ev.startY, targetX: ev.targetX, targetY: ev.targetY, facing: Math.atan2(ev.targetY - ev.startY, ev.targetX - ev.startX), delay: ev.delay || 0, timer: 0, strikeDur: ev.strikeDur || 0.16, struck: false, dissolved: false, cloneIdx: ev.cloneIdx || 0, dmg: 0, life: 0, maxLife: ev.maxLife || 0.56 });
      } else if (ev.type === "dragon_wave_vis") {
        this.dragonWaves.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, vx: ev.vx, vy: ev.vy, angle: ev.angle || 0, width: ev.width || 46, damage: 0, distanceTraveled: 0, maxDistance: ev.maxDistance || 420, empowered: Boolean(ev.empowered), hitIds: /* @__PURE__ */ new Set() });
      } else if (ev.type === "sky_dragon_vis") {
        this.skyDragons.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 160, timer: 0, duration: ev.duration || 0.45, damage: 0, burnDps: 0, empowered: Boolean(ev.empowered), impacted: false });
      } else if (ev.type === "taidu_turret_vis") {
        if (this.taiduTurrets.length >= 2) this.taiduTurrets.shift();
        this.taiduTurrets.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, angle: ev.angle || 0, life: 0, maxLife: ev.maxLife || 10, fireTimer: 0, fireInterval: 0.52, range: 360, damage: 0, muzzleTimer: 0, hasTarget: false });
      } else if (ev.type === "taidu_carpet_vis") {
        this.taiduCarpetStrikes.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 95, damage: 0, timer: 0, delay: ev.delay || 0.25 });
      } else if (ev.type === "nguyen_wave_vis") {
        this.nguyenSanctuaryWaves.push({ id: this.nextEntityId++, x: ev.x, y: ev.y, maxRadius: ev.maxRadius || 210, life: 0, maxLife: ev.maxLife || 0.48 });
      } else if (ev.type === "nguyen_field_vis") {
        this.nguyenSanctuaryFields.push({ id: this.nextEntityId++, visualOnly: true, x: ev.x, y: ev.y, radius: ev.radius || 230, timer: 0, duration: ev.duration || 3.2, tickTimer: 0, tickInterval: 0.75, pulsesLeft: 0, healAmt: 0, dmgAmt: 0 });
      } else if (ev.type === "enemy_proj") {
        this.projectiles.push({ id: this.nextEntityId++, kind: ev.kind || "enemy_orb", fromPlayer: false, isHoming: Boolean(ev.isHoming), x: ev.x, y: ev.y, vx: ev.vx, vy: ev.vy, radius: ev.radius || 9, damage: ev.damage || 25, color: ev.color || "#C084FC", angle: ev.angle || 0, distanceTraveled: 0, maxDistance: ev.maxDistance || 460, pierceLeft: 1, hitIds: /* @__PURE__ */ new Set(), ccType: ev.ccType, ccDur: ev.ccDur, ccFactor: ev.ccFactor });
      } else if (ev.type === "enemy_zone") {
        this.zones.push({ id: this.nextEntityId++, kind: ev.kind || "blizzard_vortex", x: ev.x, y: ev.y, radius: ev.radius || 150, timer: 0, duration: ev.duration || 4.5, tickTimer: 0, tickInterval: ev.tickInterval || 0.45, damagePerTick: ev.damagePerTick || 20, slowFactor: ev.slowFactor || 0.5, ccDur: ev.ccDur || 1.2, rotation: 0 });
      } else if (ev.type === "enemy_meteor") {
        this.summonGiantMeteor(ev.x, ev.y, ev.damage || 40, ev.radius || 135, false, ev.ccType, ev.ccDur, ev.color || "#EF4444", ev.meteorSize || 44, ev.duration || 0.8);
      } else if (ev.type === "enemy_vortex") {
        this.summonGalaxyVortex(ev.x, ev.y, ev.radius || 140, ev.duration || 3, ev.damagePerTick || 20, ev.finalBurstDmg || 60, Boolean(ev.isGalaxy), false, -1, ev.ccDur || 1.6);
      } else if (ev.type === "bomber_boom") {
        R.playExplosion(), this.createCataclysmicExplosion(ev.x, ev.y, ev.radius || 105, "#F97316");
        !this.multiplayer.localDowned && this.player.hp > 0 && Math.hypot(this.player.x - ev.x, this.player.y - ev.y) <= (ev.radius || 105) + this.player.radius && (this.damagePlayer(ev.dmg || 45), this.applyPlayerCC("knockback", 0, 50, ev.x, ev.y));
      } else if (ev.type === "boss_cone_slam") {
        for (let W of [-0.5, -0.25, 0, 0.25, 0.5]) {
          let V = ev.angle + W;
          this.spawnGroundCrack(ev.x, ev.y, V, 290, "#78716C", "#10B981"), this.slashes.push({ x: ev.x + Math.cos(V) * 145, y: ev.y + Math.sin(V) * 145, angle: V, radius: 155, spread: 0.65, color: "#10B981", life: 0, maxLife: 0.38, kind: "slash" });
        }
        this.createCataclysmicExplosion(ev.x + Math.cos(ev.angle) * 110, ev.y + Math.sin(ev.angle) * 110, 95, "#10B981");
        let D = Math.hypot(this.player.x - ev.x, this.player.y - ev.y), P = Math.atan2(this.player.y - ev.y, this.player.x - ev.x), N = Math.abs(Math.atan2(Math.sin(P - ev.angle), Math.cos(P - ev.angle)));
        D <= 300 && N <= 0.68 && (this.damagePlayer(ev.dmg), this.applyPlayerCC("stun", ev.ccDur || getBossStageCcDuration(3), 0, ev.x, ev.y), this.applyPlayerCC("knockback", 0, 55, ev.x, ev.y));
      } else if (ev.type === "boss_roll_slam") {
        this.addShake(16, 0.45), this.createCataclysmicExplosion(ev.x, ev.y, 110, "#10B981");
        Math.hypot(this.player.x - ev.x, this.player.y - ev.y) <= (ev.radius || 45) + this.player.radius + 35 && (this.damagePlayer(ev.dmg), this.applyPlayerCC("knockback", 0, 75, ev.x, ev.y));
      } else if (ev.type === "boss_phase") {
        R.playDragonRoar(), this.addShake(18, 0.6), this.screenFlashWhite = 0.35;
        this.addFloatingText(ev.x, ev.y - 48, ev.phase === 3 ? "\u{1F525} TR\xD9M TUY\u1EC6T V\u1ECCNG (PHASE 3)!" : "\u26A0\uFE0F TR\xD9M CU\u1ED2NG N\u1ED8 (PHASE 2)!", ev.phase === 3 ? "#F59E0B" : "#EF4444", 20);
      } else if (ev.type === "boss_callout") {
        this.addFloatingText(ev.x, ev.y, ev.text || "", ev.color || "#EF4444", ev.size || 16);
        ev.shakeMag > 0 && this.addShake(ev.shakeMag, ev.shakeDur || 0.4);
        switch (ev.sound) {
          case "bossWarn": R.playBossWarn(); break;
          case "earthSlam": R.playEarthSlam(); break;
          case "rockRoll": R.playRockRoll(); break;
          case "dragonRoar": R.playDragonRoar(); break;
          case "thunderStrike": R.playThunderStrike(); break;
          case "electricZap": R.playElectricZap(); break;
          case "fire": R.playFire(0.35, 0.22); break;
          case "explosion": R.playExplosion(); break;
          case "iceShatter": R.playIceShatter(); break;
          case "iceStorm": R.playIceStorm(); break;
          case "ice": R.playIce(); break;
          case "ambushSlash": R.playAmbushSlash(); break;
          case "blackHole": R.playBlackHole(); break;
          case "cosmic": R.playCosmic(); break;
          case "realmSlash": R.playRealmSlash(); break;
        }
      } else if (ev.type === "boss_warn") {
        let key = `w_${ev.id}`;
        if (!this.multiplayer.seenBossHazardIds.has(key)) {
          this.multiplayer.seenBossHazardIds.add(key);
          this.bossWarnings.push({ id: ev.id, x: ev.x, y: ev.y, radius: ev.radius, timer: 0, duration: ev.duration, damage: ev.damage, kind: ev.kind, color: ev.color, ccType: ev.ccType, ccDur: ev.ccDur });
        }
      } else if (ev.type === "boss_beam") {
        let key = `b_${ev.id}`;
        if (!this.multiplayer.seenBossHazardIds.has(key)) {
          this.multiplayer.seenBossHazardIds.add(key);
          this.bossBeams.push({ id: ev.id, x1: ev.x1, y1: ev.y1, x2: ev.x2, y2: ev.y2, width: ev.width, timer: 0, duration: ev.duration, damage: ev.damage, color: ev.color, glowColor: ev.glowColor, ccType: ev.ccType, ccDur: ev.ccDur, ccFactor: ev.ccFactor, triggered: false, fadeTimer: 0.38 });
        }
      } else if (ev.type === "boss_ring") {
        let key = `r_${ev.id}`;
        if (!this.multiplayer.seenBossHazardIds.has(key)) {
          this.multiplayer.seenBossHazardIds.add(key);
          this.bossShockRings.push({ id: ev.id, x: ev.x, y: ev.y, currentRadius: 24, maxRadius: ev.maxRadius, ringWidth: ev.ringWidth || 26, speed: ev.speed, damage: ev.damage, color: ev.color || "#EF4444", accentColor: ev.accentColor || "#F59E0B", hitPlayer: false, ccType: ev.ccType, ccDur: ev.ccDur, ccFactor: ev.ccFactor });
        }
      } else if (ev.type === "explosion") {
        this.createCataclysmicExplosion(ev.x, ev.y, ev.maxRadius || ev.radius || 90, ev.color || "#F97316");
      } else if (ev.type === "frost_boom") {
        this.createFrostExplosion(ev.x, ev.y, ev.maxRadius || ev.radius || 110);
      } else if (ev.type === "particles") {
        if (ev.smoke) {
          this.spawnSmokePuff(ev.x, ev.y, ev.radius || 18);
        } else if (ev.flame) {
          this.spawnFlameParticles(ev.x, ev.y, ev.flameColor || "red", ev.count || 12, ev.minSpd || 40, ev.maxSpd || 140);
        } else {
          this.spawnParticles(ev.x, ev.y, ev.color || "#FBBF24", ev.count || 12, ev.minSpd || 40, ev.maxSpd || 160, ev.size || 3.5, ev.maxLife || 0.4);
        }
      }
    }
  }
  start() {
    this.animFrameId || (this.animFrameId = (this.lastTime = performance.now(), requestAnimationFrame(this.loop)));
  }
  getHudSnapshot() {
    let s = this.player, a = [s.cooldowns[0] > 0 ? "cooldown" : "ready", s.cooldowns[1] > 0 ? "cooldown" : "ready", s.cooldowns[2] > 0 ? "cooldown" : "ready"], l = "", pads = [0, 0, 0];
    if (this.currentHero.id === "gau") l = s.gau_cuongHungTimer > 0 ? `\u{1F525} CU\u1ED2NG H\xD9NG ${s.gau_cuongHungTimer.toFixed(1)}s` : `N\u1ED8: ${s.gau_rage}/100`, s.gau_c1_step > 0 && (a[0] = "recast"), s.gau_c2_guardTimer > 0 && (a[1] = "recast"), s.gau_cuongHungTimer > 0 && (a[0] === "ready" && (a[0] = "empowered"), a[1] === "ready" && (a[1] = "empowered"), a[2] === "ready" && (a[2] = "empowered"));
    else if (this.currentHero.id === "bao") l = s.bao_stealthTimer > 0 ? `\u{1F4A8} T\xC0NG H\xCCNH ${s.bao_stealthTimer.toFixed(1)}s` : s.bao_c1_recastTimer > 0 && s.bao_c1_awaitingSecond ? `\u2694\uFE0F CH\u00C9M L\u1EA6N 2 (${s.bao_c1_recastTimer.toFixed(1)}s)` : "\u1EA2NH \u1EA4N (T\u1ED0I \u0110A 3)", s.bao_c1_recastTimer > 0 && s.bao_c1_awaitingSecond && (a[0] = "recast"), s.bao_stealthTimer > 0 && (a[1] = "recast");
    else if (this.currentHero.id === "danh") {
      let g = [];
      s.danh_dragonTimer > 0 && (g.push(`\u{1F525} H\xD3A R\u1ED2NG ${s.danh_dragonTimer.toFixed(1)}s`), a[0] === "ready" && (a[0] = "empowered"), a[1] === "ready" && (a[1] = "empowered")), s.danh_khaiSonTimer > 0 && g.push(`KHAI S\u01A0N ${s.danh_khaiSonTimer.toFixed(1)}s`), s.danh_longNgamTimer > 0 && (g.push(`LONG NG\xC2M ${s.danh_longNgamTimer.toFixed(1)}s`), a[1] === "ready" && (a[1] = "empowered")), s.danh_thienPhatTimer > 0 && (g.push(`THI\xCAN PH\u1EA0T ${s.danh_thienPhatTimer.toFixed(1)}s`), a[2] === "ready" && (a[2] = "empowered")), s.danh_c1_step > 0 && s.danh_dragonTimer <= 0 && (a[0] = "recast"), s.chargeState.active && (a[s.chargeState.skillIdx] = "charging"), l = g.join(" \xB7 ") || "TAM KI\u1EBEM TH\u1EBE";
    } else if (this.currentHero.id === "luan") {
      this.luanPortals.length > 0 && (a[1] = "recast");
      s.luan_c3Charge && (a[2] = "charging");
      let rem = this.luanPortals.length > 0 ? Math.max(0, (this.luanPortals[0].maxLife || 9) - this.luanPortals[0].life) : 0;
      l = this.luanPortals.length > 0 ? `\u{1F300} ${this.luanPortals.length} C\u1ED4NG (${rem.toFixed(1)}s) \xB7 H\xDAT PH\xC9P 12%` : "\u{1F300} V\u1EBET N\u1EE8T \xB7 H\xDAT PH\xC9P 12%";
    } else if (this.currentHero.id === "kin") {
      l = `\u{1FA78} H\xDAT M\xC1U ${s.kin_c2_lifestealTimer > 0 ? "40%" : "20%"}${s.kin_c2_lifestealTimer > 0 ? ` (${s.kin_c2_lifestealTimer.toFixed(1)}s)` : ""}`;
    } else if (this.currentHero.id === "duccong" && this.duccong_pads) {
      let activePads = [];
      for (let i of [1, 2]) {
        let pd = this.duccong_pads[i];
        if (pd && s.cooldowns[i] > 0) {
          pads[i] = pd.teleportCd || 0;
          pd.teleportCd <= 0 && (a[i] = "recast");
          activePads.push(`C${i + 1}`);
        }
      }
      activePads.length > 0 && (l = `\u{1F300} \xD4 D\u1ECACH: ${activePads.join(" & ")}`);
    } else if (this.currentHero.id === "tin") {
      let parts = [`⚡ CỘNG HƯỞNG ${s.tin_resonance_stacks || 0}/4`];
      s.tin_empowered && parts.push("QUÁ TẢI +25%");
      s.tin_c1_recast_timer > 0 && (a[0] = "recast", parts.push(`LƯỚT C1 FREE (${s.tin_c1_recast_timer.toFixed(1)}s)`));
      if (s.tin_empowered) {
        for (let i = 0; i < 3; i++) a[i] === "ready" && (a[i] = "empowered");
      }
      l = parts.join(" · ");
    } else if (this.currentHero.id === "taidu") {
      let prof = getTaiDuDroneProfile(s.taidu_droneMode || "attack"), parts = [`\u{1F916} DRONE: ${prof.label.toUpperCase()}`];
      this.taiduTurrets.length > 0 && parts.push(`PH\xC1O ${this.taiduTurrets.length}/2`);
      s.taidu_droneMode === "guard" && parts.push(`H\u1EA4P TH\u1EE4 ${Math.round(s.taidu_droneShieldAccum || 0)}/140`);
      l = parts.join(" \xB7 ");
    } else if (this.currentHero.id === "nguyen") {
      let parts = [`\u{1F6E1}\uFE0F KHI\xCAN \u1EA2O ${Math.round(s.shield || 0)}/${Math.round(s.maxHp || 1500)}`];
      s.nguyen_satellitesTimer > 0 && parts.push(`3 V\u1EC6 TINH ${s.nguyen_satellitesTimer.toFixed(1)}s`);
      s.nguyen_rescueCd > 0 ? parts.push(`C\u1EE8U NGUY ${s.nguyen_rescueCd.toFixed(0)}s`) : parts.push("C\u1EE8U NGUY S\u1EB4N S\xC0NG");
      l = parts.join(" \xB7 ");
    }
    let dProf = this.currentHero.id === "taidu" ? getTaiDuDroneProfile(s.taidu_droneMode || "attack") : null;
    let m = s.chargeState.active ? Math.min(1, s.chargeState.elapsed / Math.max(0.1, s.chargeState.maxDur)) : 0, c = "";
    return s.chargeState.active && (c = s.chargeState.kind === "danh_c2" ? `T\u1EE4 L\u1EF0C LONG H\u1ED2N \xB7 ${s.chargeState.elapsed >= 2.5 ? "T\u1EA6NG 3 (T\u1ED0I \u0110A)" : s.chargeState.elapsed >= 1.5 ? "T\u1EA6NG 2" : "T\u1EA6NG 1"}` : s.chargeState.elapsed >= 0.35 ? "KI\u1EBEM KH\xCD S\u1EB4N S\xC0NG!" : "GI\u1EEE \u0110\u1EC2 PH\xD3NG KI\u1EBEM KH\xCD..."), { skillStates: a, padTeleportCds: pads, chargeProgress: m, chargeActive: s.chargeState.active, chargeLabel: c, resourceText: l, droneMode: s.taidu_droneMode || "attack", droneLabel: dProf?.label || "T\u1EA5n C\xF4ng", droneColor: dProf?.color || "#38BDF8", combo: this.comboManager.getSnapshot() };
  }
  stop() {
    this.animFrameId && (this.animFrameId = (cancelAnimationFrame(this.animFrameId), null));
  }
}
