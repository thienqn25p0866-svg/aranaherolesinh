import test from "node:test";
import assert from "node:assert/strict";
import {
  HERO_SKILL_VFX_PROFILES,
  resolveHeroDamageElement,
  drawHeroWeaponSkillAura,
  drawHeroSkillWindup,
  drawHeroSkillSlash,
  drawHeroImpactSignature,
  drawEnemyHitReaction,
  drawHeroGroundDecal,
  spawnElementalDeathBurst,
  renderElementalCorpseOverlay,
} from "./heroSkillVfx";
import { spawnEnemyDeathVfx, renderDeadCorpse } from "./deathVfx";
import { drawUpgradedSlash } from "./weaponRenderer";

const ALL_27_HEROES = [
  "dung",
  "tin",
  "kin",
  "trung",
  "eohyen",
  "longhoi",
  "duccong",
  "gau",
  "bao",
  "danh",
  "luan",
  "taidu",
  "nguyen",
  "duy",
  "phong",
  "dang",
  "thien",
  "thanh",
  "nhi",
  "minh",
  "ducanh",
  "bach",
  "thai",
  "khair",
  "uyen",
  "hau",
  "lam",
] as const;

const HERO_SLASH_KINDS: Record<string, string[]> = {
  dung: ["dung_c1_charge", "dung_cerberus_bite", "dung_c2_awaken", "dung_c3_howl_ring"],
  tin: ["tin_c1_blood_rift", "tin_c2_twin_shard_cast", "tin_c3_monochrome_cross", "tin_resonance_surge"],
  kin: ["kin_gale_slash", "kin_c2_recoil_gale", "kin_c3_tempest_seal"],
  trung: ["trung_c1_sky_thunder_seal", "trung_c2_orb_ward", "trung_c2_orb_detonate", "arcane_orb_burst", "trung_c3_meteor_crater"],
  eohyen: ["eohyen_frost_slash", "eohyen_c2_ice_bastion", "eohyen_c3_blizzard_crown"],
  longhoi: ["longhoi_c1_fox_fan", "longhoi_c2_fox_step", "longhoi_c3_nine_tails_pyre", "longhoi_burn_detonate"],
  duccong: ["duccong_c1_orb_launch", "duccong_c1_orb_nova", "duccong_c2_singularity", "duccong_c3_galaxy_collapse", "duccong_pad_warp"],
  gau: ["gau_punch", "gau_c1_seismic_slap", "gau_c2_counter_guard", "gau_shockring", "gau_c3_quake_crater", "gau_rage_eruption"],
  bao: ["bao_slash", "bao_c1_shadow_crescent", "bao_c2_smoke_vanish", "bao_c3_clone_lattice", "bao_mark_shatter"],
  danh: ["danh_kiem_khi_slash", "danh_c2_dragon_launch", "danh_firebreath", "danh_dragon_shockring", "danh_c3_dragon_nova", "danh_sky_dragon_impact"],
  luan: ["luan_c1_rift_fan", "luan_portal_wave", "luan_c3_prism_fracture"],
  taidu: ["taidu_hex_blast", "taidu_c2_emp_salvo", "taidu_c3_orbital_lock"],
  nguyen: ["nguyen_wave", "nguyen_c2_lotus_ward", "nguyen_lotus_boom", "nguyen_c3_sanctuary_bloom"],
  duy: ["duy_c1_substitute_seal", "duy_c2_shuriken_fan", "duy_c3_cyclone_storm"],
  phong: ["phong_c1_shadow_slash", "phong_swap_burst", "phong_c3_mark", "phong_c3_death_ring"],
  dang: ["dang_punch", "dang_c1_tiger_roar", "dang_black_shield_boom", "dang_c3_frenzy_sigil"],
  thien: [
    "thien_c1_sword_halo",
    "thien_ascend_halo",
    "thien_god_halo",
    "thien_c2_time_dome",
    "thien_c2_time_shatter",
    "thien_c3_gate_arrival",
    "thien_c3_gate_return",
    "thien_c4_solar_judgement",
  ],
  thanh: ["thanh_snake_fan", "thanh_devour_bite", "thanh_shield_pulse"],
  nhi: ["nhi_c1_revolver_snap", "nhi_c2_flask_scatter", "nhi_c3_hunt_lock", "nhi_mist_pulse"],
  minh: ["minh_chain_rect", "minh_c2_banishment_seal", "minh_c3_celestial_jail"],
  ducanh: ["ducanh_c1_ignition_wheel", "ducanh_c2_anvil_bastion", "ducanh_c3_meteor_slam", "ducanh_passive_iron_shell"],
  bach: ["bach_cross_slash", "bach_c1_wind_terminus", "bach_c2_fan_recoil", "bach_c3_phantom_matrix"],
  thai: ["thai_arena_cleave", "thai_cyclone_ring", "thai_c3_colosseum_brand"],
  khair: ["khair_c1_beacon_deploy", "khair_sniper_muzzle", "khair_recoil_blast"],
  uyen: ["uyen_note_cast", "uyen_boomerang_cast", "uyen_dome_burst", "uyen_symphony_beat", "uyen_death_save"],
  hau: ["hau_sickle_sweep", "hau_chain_cast", "hau_parry_stance", "hau_parry_riposte", "hau_exec_finisher"],
  lam: ["lam_ink_cast", "lam_pincer_cast", "lam_bagua_cast", "lam_pentagram_pulse", "lam_seal_reaction"],
};

function createStrictCanvasCtx(label: string) {
  let shadowBlurVal = 0;
  let gcoVal = "source-over";
  let stackDepth = 0;
  let calls = 0;

  const assertFiniteNums = (fnName: string, nums: number[]) => {
    for (let i = 0; i < nums.length; i++) {
      assert.ok(
        Number.isFinite(nums[i]),
        `[${label}] ${fnName} arg #${i} must be finite, got ${nums[i]}`
      );
    }
  };

  const makeGrad = () => ({
    addColorStop(offset: number, color: string) {
      assert.ok(Number.isFinite(offset) && offset >= 0 && offset <= 1, `[${label}] invalid gradient stop ${offset}`);
      assert.equal(typeof color, "string");
    },
  });

  const ctx: any = {
    fillStyle: "#FFFFFF",
    strokeStyle: "#FFFFFF",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    globalAlpha: 1,
    font: "12px sans-serif",
    textAlign: "left",
    textBaseline: "alphabetic",
    get shadowBlur() {
      return shadowBlurVal;
    },
    set shadowBlur(v: number) {
      assert.ok(Number.isFinite(v) && v <= 0, `[${label}] forbidden ctx.shadowBlur > 0: ${v}`);
      shadowBlurVal = v;
    },
    get globalCompositeOperation() {
      return gcoVal;
    },
    set globalCompositeOperation(v: string) {
      assert.notEqual(v, "lighter", `[${label}] forbidden globalCompositeOperation = "lighter"`);
      gcoVal = v;
    },
    save() {
      stackDepth++;
      calls++;
    },
    restore() {
      stackDepth = Math.max(0, stackDepth - 1);
      calls++;
    },
    translate(x: number, y: number) {
      assertFiniteNums("translate", [x, y]);
      calls++;
    },
    rotate(a: number) {
      assertFiniteNums("rotate", [a]);
      calls++;
    },
    scale(sx: number, sy: number) {
      assertFiniteNums("scale", [sx, sy]);
      calls++;
    },
    beginPath() {
      calls++;
    },
    closePath() {
      calls++;
    },
    moveTo(x: number, y: number) {
      assertFiniteNums("moveTo", [x, y]);
      calls++;
    },
    lineTo(x: number, y: number) {
      assertFiniteNums("lineTo", [x, y]);
      calls++;
    },
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
      assertFiniteNums("quadraticCurveTo", [cpx, cpy, x, y]);
      calls++;
    },
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
      assertFiniteNums("bezierCurveTo", [cp1x, cp1y, cp2x, cp2y, x, y]);
      calls++;
    },
    arc(x: number, y: number, r: number, startAngle: number, endAngle: number) {
      assertFiniteNums("arc", [x, y, r, startAngle, endAngle]);
      assert.ok(r >= 0.25, `[${label}] arc radius must be >= 0.25, got ${r}`);
      calls++;
    },
    ellipse(x: number, y: number, rx: number, ry: number, rot: number, sa: number, ea: number) {
      assertFiniteNums("ellipse", [x, y, rx, ry, rot, sa, ea]);
      assert.ok(rx >= 0.25 && ry >= 0.25, `[${label}] ellipse radii must be >= 0.25, got ${rx}, ${ry}`);
      calls++;
    },
    rect(x: number, y: number, w: number, h: number) {
      assertFiniteNums("rect", [x, y, w, h]);
      calls++;
    },
    roundRect(x: number, y: number, w: number, h: number, r: number | number[] = 0) {
      assertFiniteNums("roundRect", [x, y, w, h]);
      if (typeof r === "number") assertFiniteNums("roundRect.r", [r]);
      calls++;
    },
    fillRect(x: number, y: number, w: number, h: number) {
      assertFiniteNums("fillRect", [x, y, w, h]);
      calls++;
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      assertFiniteNums("strokeRect", [x, y, w, h]);
      calls++;
    },
    fill() {
      calls++;
    },
    stroke() {
      calls++;
    },
    clip() {
      calls++;
    },
    setLineDash() {
      assert.fail(`[${label}] forbidden ctx.setLineDash call`);
    },
    createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
      assertFiniteNums("createLinearGradient", [x0, y0, x1, y1]);
      return makeGrad();
    },
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
      assertFiniteNums("createRadialGradient", [x0, y0, r0, x1, y1, r1]);
      assert.ok(r0 >= 0 && r1 >= 0.25, `[${label}] radial gradient invalid radii ${r0}, ${r1}`);
      return makeGrad();
    },
    getStats: () => ({ calls, stackDepth }),
  };

  return ctx;
}

test("all 27 heroes have complete, distinct VFX profiles", () => {
  assert.equal(Object.keys(HERO_SKILL_VFX_PROFILES).length, 27);
  const motifs = new Set<string>();
  const elements = new Set<string>();
  const deathStyles = new Set<string>();

  for (const heroId of ALL_27_HEROES) {
    const prof = HERO_SKILL_VFX_PROFILES[heroId];
    assert.ok(prof, `Missing VFX profile for ${heroId}`);
    assert.ok(prof.element, `Missing element for ${heroId}`);
    assert.ok(prof.motif, `Missing motif for ${heroId}`);
    assert.ok(prof.deathStyle, `Missing deathStyle for ${heroId}`);
    motifs.add(prof.motif);
    elements.add(prof.element);
    deathStyles.add(prof.deathStyle);

    const resolved = resolveHeroDamageElement(heroId);
    assert.equal(resolved.heroId, heroId);
    assert.equal(resolved.element, prof.element);
    assert.equal(resolved.deathStyle, prof.deathStyle);
  }

  assert.equal(motifs.size, 27, "All 27 heroes must have unique decals/motifs");
  assert.equal(elements.size, 27, "All 27 heroes must have distinct elemental tags");
  assert.equal(deathStyles.size, 27, "All 27 heroes must have unique death dissolve styles");
});

test("Stage 1A weapon skill aura & Stage 1B windup render safely across all 27 heroes (color & monochrome)", () => {
  for (const isMono of [false, true]) {
    for (const heroId of ALL_27_HEROES) {
      for (const skillIdx of [1, 2, 3, 4]) {
        const ctx = createStrictCanvasCtx(`aura:${heroId}:c${skillIdx}:mono=${isMono}`);
        const drawn = drawHeroWeaponSkillAura(
          ctx,
          heroId,
          { weaponSkillIdx: skillIdx, weaponSkillTimer: 0.22, weaponSkillDur: 0.36, facing: 0.4, radius: 22 },
          12.5,
          { atkProg: 0.5 },
          isMono
        );
        assert.equal(drawn, true, `Expected weapon aura draw for ${heroId}`);
        assert.ok(ctx.getStats().calls > 0);
        assert.equal(ctx.getStats().stackDepth, 0);

        const wCtx = createStrictCanvasCtx(`windup:${heroId}:c${skillIdx}:mono=${isMono}`);
        drawHeroSkillWindup(
          wCtx,
          { x: 420, y: 310, radius: 74, angle: 0.75, heroId, skillIdx, life: 0.08, maxLife: 0.24 },
          12.5,
          isMono
        );
        assert.ok(wCtx.getStats().calls > 0);
        assert.equal(wCtx.getStats().stackDepth, 0);
      }
    }
  }
});

test("Stage 2 bespoke C1/C2/C3 slash kinds render safely via drawHeroSkillSlash & drawUpgradedSlash", () => {
  for (const isMono of [false, true]) {
    for (const heroId of ALL_27_HEROES) {
      const kinds = HERO_SLASH_KINDS[heroId];
      assert.ok(kinds && kinds.length >= 3, `Expected >= 3 bespoke slash kinds for ${heroId}`);
      for (const kind of kinds) {
        for (const f of [0.18, 0.62]) {
          const ctx = createStrictCanvasCtx(`slash:${heroId}:${kind}:f=${f}:mono=${isMono}`);
          const slashObj = {
            x: 500,
            y: 360,
            angle: 0.85,
            radius: 135,
            length: 190,
            halfWidth: 42,
            spread: 1.55,
            dir: 1,
            step: 1,
            comboStep: 2,
            empowered: true,
            crossed: true,
            heavy: true,
            color: HERO_SKILL_VFX_PROFILES[heroId].primary,
            accentColor: HERO_SKILL_VFX_PROFILES[heroId].secondary,
            kind,
            heroId,
          };
          const handled = drawHeroSkillSlash(ctx, slashObj, f, 8.4, isMono);
          assert.equal(handled, true, `drawHeroSkillSlash must handle ${kind} directly`);
          assert.ok(ctx.getStats().calls > 0);
          assert.equal(ctx.getStats().stackDepth, 0);

          const upCtx = createStrictCanvasCtx(`upgradedSlash:${heroId}:${kind}:f=${f}:mono=${isMono}`);
          drawUpgradedSlash(upCtx, slashObj, f, isMono, false, 8.4);
          assert.ok(upCtx.getStats().calls > 0);
          assert.equal(upCtx.getStats().stackDepth, 0);
        }
      }
    }
  }
});

test("Stage 3 impacts, hit reactions, and Stage 4 ground decals render safely for all 27 heroes", () => {
  for (const isMono of [false, true]) {
    for (const heroId of ALL_27_HEROES) {
      const prof = HERO_SKILL_VFX_PROFILES[heroId];

      for (const tier of ["light", "heavy", "finisher"]) {
        const iCtx = createStrictCanvasCtx(`impact:${heroId}:${tier}:mono=${isMono}`);
        const drawn = drawHeroImpactSignature(
          iCtx,
          { x: 640, y: 420, heroId, skillIdx: 2, tier, radius: 42, angle: -0.6, color: prof.primary },
          0.45,
          isMono
        );
        assert.equal(drawn, true);
        assert.ok(iCtx.getStats().calls > 0);
        assert.equal(iCtx.getStats().stackDepth, 0);
      }

      const hCtx = createStrictCanvasCtx(`hitReact:${heroId}:mono=${isMono}`);
      drawEnemyHitReaction(
        hCtx,
        { x: 650, y: 410, radius: 22, angle: 0.4, heroId, color: prof.primary, life: 0.09, maxLife: 0.26 },
        5.2,
        isMono
      );
      assert.ok(hCtx.getStats().calls > 0);
      assert.equal(hCtx.getStats().stackDepth, 0);

      const dCtx = createStrictCanvasCtx(`decal:${heroId}:mono=${isMono}`);
      drawHeroGroundDecal(
        dCtx,
        { x: 660, y: 430, radius: 74, angle: 1.1, heroId, motif: prof.element, color: prof.primary, secondaryColor: prof.secondary, alpha: 0.72, life: 0.65, maxLife: 2.8 },
        5.2,
        isMono
      );
      assert.ok(dCtx.getStats().calls > 0);
      assert.equal(dCtx.getStats().stackDepth, 0);
    }
  }
});

test("Stage 5 elemental death bursts and corpse overlays diversify kills cleanly across all 27 heroes", () => {
  const archetypes = [
    { kind: "minion", radius: 18 },
    { kind: "venom_spider", radius: 20 },
    { kind: "frost_knight", radius: 24 },
    { kind: "stone_warden", radius: 26 },
    { kind: "boss", bossWave: 9, radius: 46 },
  ];

  for (const heroId of ALL_27_HEROES) {
    for (const enemyTemplate of archetypes) {
      const decals: any[] = [];
      const engineStub: any = {
        redCrystals: [],
        bloodParticles: [],
        flameParticles: [],
        smokePuffs: [],
        particles: [],
        deadCorpses: [],
        getPerformanceProfile: () => ({
          particleBudgetScale: 1,
          maxCrystals: 120,
          maxBlood: 140,
          maxFlames: 120,
          maxSmoke: 60,
          maxCorpses: 40,
          particlesScale: 1,
        }),
        spawnSkillDecal: (d: any) => decals.push(d),
        spawnImpactBurst: () => {},
        spawnParticles: (_x: number, _y: number, color: string) => engineStub.particles.push({ x: _x, y: _y, color }),
        createCataclysmicExplosion: () => {},
      };

      const enemy = {
        x: 320,
        y: 280,
        facing: 0.5,
        lastKillerHeroId: heroId,
        lastDamageElement: resolveHeroDamageElement(heroId).element,
        ...enemyTemplate,
      };

      spawnEnemyDeathVfx(engineStub, enemy, { attackerFacing: 0.5, killerHeroId: heroId });
      assert.equal(engineStub.deadCorpses.length, 1);
      assert.equal(engineStub.deadCorpses[0].killerHeroId, heroId);
      assert.ok(engineStub.particles.length >= 3, `Expected elemental particles for ${heroId}`);
      assert.ok(decals.length >= 1, `Expected elemental death decal for ${heroId}`);

      for (const isMono of [false, true]) {
        const cCtx = createStrictCanvasCtx(`corpse:${heroId}:${enemy.kind}:mono=${isMono}`);
        const corpse = { ...engineStub.deadCorpses[0], timer: 0.45, life: 0.45 };
        renderDeadCorpse(cCtx, corpse, isMono);
        renderElementalCorpseOverlay(cCtx, corpse, isMono);
        assert.ok(cCtx.getStats().calls > 0);
        assert.equal(cCtx.getStats().stackDepth, 0);
      }
    }
  }
});
