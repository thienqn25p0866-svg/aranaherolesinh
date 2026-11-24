// Taxonomy-driven Enemy Death VFX & Multi-Stage Corpse Renderer
// Replaces the single flat-blood + red-crystal death template across all enemy tiers.
// Zero ctx.shadowBlur usage; full isMono support; safe with Node Canvas stubs.

import {
  clamp,
  safeNum,
  safeRadius,
  drawFacetedShard,
  drawVolumetricSmokeLobe,
  drawViscousDroplet,
  drawBranchingArc,
  drawWindStreamRibbon,
  drawStructuralExplosion,
} from "./vfxMaterials";
import {
  spawnElementalDeathBurst,
  renderElementalCorpseOverlay,
  resolveHeroDamageElement,
} from "./heroSkillVfx";

export const DEATH_ARCHETYPES = [
  "flesh_beast",
  "venom_insect",
  "infernal_fire",
  "frost_crystal",
  "stone_construct",
  "steel_mech",
  "wood_root",
  "celestial_arcane",
  "shadow_void",
];

/**
 * Maps any regular enemy, map mob, mini-boss, wave boss (3..27), or map finale boss
 * to a concrete material + anatomical death profile.
 */
export function classifyEnemyDeathProfile(enemy = {}) {
  const kind = String(enemy.kind || "minion").toLowerCase();
  const voidVar = String(enemy.voidVariant || "").toLowerCase();
  const miniType = String(enemy.miniBossType || "").toLowerCase();
  const bossWave = Number(enemy.bossWave || 0);
  const isBoss = kind === "boss" || bossWave > 0;
  const isMini = Boolean(enemy.isMiniBoss || miniType);
  const nameLower = String(enemy.name || "").toLowerCase();

  // Map finale bosses (Story-lore accurate death craft)
  if (enemy.isFrozenTombEntityBoss) {
    return {
      archetype: "frost_crystal",
      tier: "finale_boss",
      loreVariant: "frozen_coffin",
      primary: "#38BDF8",
      highlight: "#F0F9FF",
      shadow: "#0C4A6E",
      rim: "#BAE6FD",
      splatColor: "#082F49",
      debrisShape: "crystal",
      liquidType: "mist",
      soundElement: "frost",
    };
  }
  if (enemy.isGrudgeForestBoss) {
    return {
      archetype: "wood_root",
      tier: "finale_boss",
      loreVariant: "moving_root",
      primary: "#22C55E",
      highlight: "#BBF7D0",
      shadow: "#14532D",
      rim: "#86EFAC",
      splatColor: "#052E16",
      debrisShape: "rock",
      liquidType: "sap",
      soundElement: "wood",
    };
  }
  if (enemy.isVoidCityBoss) {
    return {
      archetype: "shadow_void",
      tier: "finale_boss",
      loreVariant: "blank_pages",
      primary: "#A855F7",
      highlight: "#FEFCE8",
      shadow: "#09090B",
      rim: "#E9D5FF",
      splatColor: "#18181B",
      debrisShape: "paper",
      liquidType: "void",
      soundElement: "void",
    };
  }

  // Wave Bosses (Waves 3..27)
  if (isBoss && bossWave === 3) {
    return {
      archetype: "stone_construct",
      tier: "boss",
      primary: "#78716C",
      highlight: "#D6D3D1",
      shadow: "#292524",
      rim: "#A8A29E",
      splatColor: "#1C1917",
      debrisShape: "rock",
      liquidType: "dust",
      soundElement: "earth",
    };
  }
  if (isBoss && bossWave === 6) {
    return {
      archetype: "infernal_fire",
      tier: "boss",
      primary: "#EA580C",
      highlight: "#FEF08A",
      shadow: "#431407",
      rim: "#FB923C",
      splatColor: "#1C0A00",
      debrisShape: "rock",
      liquidType: "lava",
      soundElement: "fire",
    };
  }
  if (isBoss && bossWave === 9) {
    return {
      archetype: "frost_crystal",
      tier: "boss",
      primary: "#0EA5E9",
      highlight: "#F0F9FF",
      shadow: "#0C4A6E",
      rim: "#BAE6FD",
      splatColor: "#082F49",
      debrisShape: "crystal",
      liquidType: "mist",
      soundElement: "frost",
    };
  }
  if (isBoss && bossWave === 12) {
    return {
      archetype: "shadow_void",
      tier: "boss",
      primary: "#9333EA",
      highlight: "#F3E8FF",
      shadow: "#0F0720",
      rim: "#C084FC",
      splatColor: "#090414",
      debrisShape: "crystal",
      liquidType: "void",
      soundElement: "void",
    };
  }
  if (isBoss && bossWave === 15) {
    return {
      archetype: "steel_mech",
      tier: "boss",
      primary: "#94A3B8",
      highlight: "#FDE047",
      shadow: "#1E293B",
      rim: "#38BDF8",
      splatColor: "#0F172A",
      debrisShape: "plate",
      liquidType: "oil_spark",
      soundElement: "plasma",
    };
  }
  if (isBoss && bossWave === 18) {
    return {
      archetype: "celestial_arcane",
      tier: "boss",
      primary: "#6366F1",
      highlight: "#FEF08A",
      shadow: "#1E1B4B",
      rim: "#38BDF8",
      splatColor: "#0F172A",
      debrisShape: "crystal",
      liquidType: "lightning",
      soundElement: "plasma",
    };
  }
  if (isBoss && bossWave === 21) {
    return {
      archetype: "infernal_fire",
      tier: "boss",
      primary: "#DC2626",
      highlight: "#FDE047",
      shadow: "#450A0A",
      rim: "#FB923C",
      splatColor: "#280505",
      debrisShape: "crystal",
      liquidType: "lava",
      soundElement: "fire",
    };
  }
  if (isBoss && bossWave === 24) {
    return {
      archetype: "flesh_beast",
      tier: "boss",
      loreVariant: "blood_moon",
      primary: "#E11D48",
      highlight: "#FFE4E6",
      shadow: "#4C0519",
      rim: "#FB7185",
      splatColor: "#450A0A",
      debrisShape: "crystal",
      liquidType: "blood",
      soundElement: "blood",
    };
  }
  if (isBoss && bossWave === 27) {
    return {
      archetype: "celestial_arcane",
      tier: "boss",
      loreVariant: "lucifer",
      primary: "#F59E0B",
      highlight: "#FEFCE8",
      shadow: "#1E1B4B",
      rim: "#F43F5E",
      splatColor: "#180A1E",
      debrisShape: "crystal",
      liquidType: "lightning",
      soundElement: "gold",
    };
  }

  // Void City / Mirror / Erased variants
  if (
    kind === "void_acolyte" ||
    kind === "void_stalker" ||
    kind === "abyss_mage" ||
    kind === "faceless_wraith" ||
    kind === "erased_shadow" ||
    kind === "shadow_clone" ||
    kind === "fog_stalker" ||
    kind === "hero_mimic" ||
    kind === "mirror_dweller" ||
    voidVar === "ink_shadow" ||
    voidVar === "mirror_fracture" ||
    voidVar === "paper_scribe" ||
    miniType === "void_weaver" ||
    miniType === "mirror_warden"
  ) {
    const isMirror = voidVar === "mirror_fracture" || kind === "mirror_dweller" || miniType === "mirror_warden";
    const isPaper = voidVar === "paper_scribe";
    return {
      archetype: "shadow_void",
      tier: isMini ? "mini_boss" : "mob",
      loreVariant: isMirror ? "mirror_glass" : isPaper ? "paper" : "void_unravel",
      primary: isMirror ? "#CBD5E1" : "#9333EA",
      highlight: isMirror ? "#FFFFFF" : "#F3E8FF",
      shadow: "#09090B",
      rim: isMirror ? "#94A3B8" : "#C084FC",
      splatColor: "#18181B",
      debrisShape: isPaper ? "paper" : "crystal",
      liquidType: "void",
      soundElement: "void",
    };
  }

  // Venom / Acid insects & arachnids
  if (kind === "venom_spider" || miniType === "plague_brood" || nameLower.includes("nhện") || nameLower.includes("độc")) {
    return {
      archetype: "venom_insect",
      tier: isMini ? "mini_boss" : "mob",
      primary: "#22C55E",
      highlight: "#ECFCCB",
      shadow: "#14532D",
      rim: "#A3E635",
      splatColor: "#14532D",
      debrisShape: "plate",
      liquidType: "venom",
      soundElement: "venom",
    };
  }

  // Frost / Ice units
  if (kind === "frost_archer" || kind === "frost_knight" || miniType === "frost_warden") {
    return {
      archetype: "frost_crystal",
      tier: isMini ? "mini_boss" : "mob",
      primary: "#38BDF8",
      highlight: "#F0F9FF",
      shadow: "#0C4A6E",
      rim: "#BAE6FD",
      splatColor: "#082F49",
      debrisShape: "crystal",
      liquidType: "mist",
      soundElement: "frost",
    };
  }

  // Infernal / Fire / Bomber units
  if (kind === "bomber" || kind === "flame_berserker" || miniType === "pyro_brute") {
    return {
      archetype: "infernal_fire",
      tier: isMini ? "mini_boss" : "mob",
      primary: "#F97316",
      highlight: "#FEF08A",
      shadow: "#431407",
      rim: "#FB923C",
      splatColor: "#1C0A00",
      debrisShape: "rock",
      liquidType: "lava",
      soundElement: "fire",
    };
  }

  // Stone Constructs & Statues
  if (kind === "stone_warden" || kind === "faceless_statue" || miniType === "stone_colossus") {
    return {
      archetype: "stone_construct",
      tier: isMini ? "mini_boss" : "mob",
      primary: "#78716C",
      highlight: "#E7E5E4",
      shadow: "#292524",
      rim: "#A8A29E",
      splatColor: "#1C1917",
      debrisShape: "rock",
      liquidType: "dust",
      soundElement: "earth",
    };
  }

  // Armored Steel & Mechs
  if (kind === "shield_knight" || kind === "iron_juggernaut" || miniType === "iron_sentinel") {
    return {
      archetype: "steel_mech",
      tier: isMini ? "mini_boss" : "mob",
      primary: "#64748B",
      highlight: "#F8FAFC",
      shadow: "#1E293B",
      rim: "#38BDF8",
      splatColor: "#0F172A",
      debrisShape: "plate",
      liquidType: "oil_spark",
      soundElement: "plasma",
    };
  }

  // Forest / Root Woodfolk
  if (kind === "root_woodfolk" || kind === "root_burrower" || miniType === "grudge_treant") {
    return {
      archetype: "wood_root",
      tier: isMini ? "mini_boss" : "mob",
      primary: "#4ADE80",
      highlight: "#DCFCE7",
      shadow: "#14532D",
      rim: "#86EFAC",
      splatColor: "#052E16",
      debrisShape: "rock",
      liquidType: "sap",
      soundElement: "wood",
    };
  }

  // Celestial / Arcane / Thunder Shamans / Paladins
  if (kind === "caster" || kind === "thunder_shaman" || kind === "solar_paladin" || kind === "relic_guardian" || miniType === "storm_archon") {
    return {
      archetype: "celestial_arcane",
      tier: isMini ? "mini_boss" : "mob",
      primary: kind === "solar_paladin" ? "#FACC15" : "#818CF8",
      highlight: "#FEFCE8",
      shadow: "#1E1B4B",
      rim: "#38BDF8",
      splatColor: "#1E1B4B",
      debrisShape: "crystal",
      liquidType: "lightning",
      soundElement: kind === "solar_paladin" ? "gold" : "arcane",
    };
  }

  // Default: Flesh Beast / Charger / Brute / Blood Reaper / Regular Assassin
  return {
    archetype: "flesh_beast",
    tier: isBoss ? "boss" : isMini ? "mini_boss" : "mob",
    primary: "#DC2626",
    highlight: "#FDA4AF",
    shadow: "#450A0A",
    rim: "#FB7185",
    splatColor: "#450A0A",
    debrisShape: kind === "blood_reaper" ? "crystal" : "rock",
    liquidType: "blood",
    soundElement: "blood",
  };
}

/**
 * Spawns bespoke death particles, directional fragments, elemental smoke/sparks,
 * and pushes a richly animated corpse/aftermath record onto engine.deadCorpses.
 */
export function spawnEnemyDeathVfx(engine, enemy, opts = {}) {
  if (!engine || !enemy) return null;
  const prof = classifyEnemyDeathProfile(enemy);
  const x = safeNum(enemy.x, 0);
  const y = safeNum(enemy.y, 0);
  const r = safeRadius(enemy.radius, 14);
  const hitDir = safeNum(opts.attackerFacing, safeNum(enemy.facing, 0));
  const isBoss = prof.tier === "boss" || prof.tier === "finale_boss";
  const isMini = prof.tier === "mini_boss";
  const isElite = Boolean(enemy.isElite);
  const countScale = isBoss ? 2.2 : isMini ? 1.5 : isElite ? 1.25 : 1.0;
  const perf = typeof engine.getPerformanceProfile === "function" ? engine.getPerformanceProfile() : null;
  const budgetScale = perf?.particleBudgetScale ?? 1;

  // 1. Directional fragment burst via redCrystals (upgraded as universal faceted shard array)
  if (Array.isArray(engine.redCrystals)) {
    const maxCrystals = perf?.maxCrystals ?? 120;
    const fragCount = Math.min(Math.max(0, maxCrystals - engine.redCrystals.length), Math.max(2, Math.round(6 * countScale * budgetScale)));
    for (let i = 0; i < fragCount; i++) {
      const spread = (Math.random() - 0.5) * 1.9;
      const a = hitDir + spread + (i % 3 === 0 ? Math.PI : 0);
      const spd = (75 + Math.random() * 145) * (isBoss ? 1.35 : 1.0);
      engine.redCrystals.push({
        x: x + (Math.random() - 0.5) * r * 0.6,
        y: y + (Math.random() - 0.5) * r * 0.6,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - (isBoss ? 65 : 40),
        size: (isBoss ? 7.5 : 4.2) + Math.random() * 4.5,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 14,
        alpha: 1,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.5,
        shape: prof.debrisShape,
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
      });
    }
  }

  // 2. Material-specific secondary fluids / smoke / flames / sparks
  if (prof.liquidType === "blood" || prof.liquidType === "venom") {
    if (Array.isArray(engine.bloodParticles)) {
      const maxBlood = perf?.maxBlood ?? 140;
      const dropCount = Math.min(Math.max(0, maxBlood - engine.bloodParticles.length), Math.max(3, Math.round(11 * countScale * budgetScale)));
      for (let i = 0; i < dropCount; i++) {
        const a = hitDir + (Math.random() - 0.5) * 2.2;
        const spd = 65 + Math.random() * 155;
        engine.bloodParticles.push({
          x: x + (Math.random() - 0.5) * r * 0.5,
          y: y + (Math.random() - 0.5) * r * 0.5,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 30,
          radius: 2.2 + Math.random() * (isBoss ? 4.2 : 2.6),
          life: 0,
          maxLife: 0.45 + Math.random() * 0.35,
          gravity: 140,
          color: prof.liquidType === "venom" ? "#22C55E" : "#991B1B",
          rimColor: prof.liquidType === "venom" ? "#ECFCCB" : "#FDA4AF",
        });
      }
    }
  } else if (prof.liquidType === "lava") {
    if (Array.isArray(engine.flameParticles)) {
      const maxFlames = perf?.maxFlames ?? 120;
      const flameCount = Math.min(Math.max(0, maxFlames - engine.flameParticles.length), Math.max(3, Math.round(9 * countScale * budgetScale)));
      for (let i = 0; i < flameCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 35 + Math.random() * 90;
        engine.flameParticles.push({
          x,
          y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 55,
          radius: 5 + Math.random() * 6,
          life: 0,
          maxLife: 0.48 + Math.random() * 0.25,
          colorMode: "red",
        });
      }
    }
  }

  // Volumetric smoke / dust / frost mist / void ink clouds
  if (Array.isArray(engine.smokePuffs)) {
    const maxSmoke = perf?.maxSmoke ?? 60;
    const rawPuffs = prof.archetype === "stone_construct" || prof.archetype === "shadow_void" || prof.archetype === "frost_crystal" || isBoss ? Math.round(5 * countScale) : 2;
    const puffCount = Math.min(Math.max(0, maxSmoke - engine.smokePuffs.length), rawPuffs);
    for (let i = 0; i < puffCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 24 + Math.random() * 65;
      engine.smokePuffs.push({
        x: x + (Math.random() - 0.5) * r * 0.7,
        y: y + (Math.random() - 0.5) * r * 0.7,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 16,
        radius: r * (0.42 + Math.random() * 0.38),
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
        color: prof.primary,
        shadowColor: prof.shadow,
        rimColor: prof.highlight,
        seed: i + x * 0.03,
      });
    }
  }

  // Structural explosion for heavy bosses and infernal elites/bombers
  if (isBoss && typeof engine.createCataclysmicExplosion === "function") {
    engine.createCataclysmicExplosion(x, y, prof.tier === "finale_boss" ? 210 : 180, prof.primary, prof.soundElement);
  } else if (prof.archetype === "infernal_fire" && typeof engine.createCataclysmicExplosion === "function") {
    engine.createCataclysmicExplosion(x, y, r * 3.1, prof.primary, "fire");
  }

  // Cause-of-death killer elemental burst fusion
  const killerHeroId = opts.killerHeroId || enemy.lastKillerHeroId || null;
  const damageElement = opts.damageElement || enemy.lastDamageElement || null;
  const elemInfo = killerHeroId ? resolveHeroDamageElement(killerHeroId, { element: damageElement }) : null;
  if (killerHeroId) {
    spawnElementalDeathBurst(engine, enemy, killerHeroId, damageElement, hitDir, perf);
  }

  // Impact burst tuned to element & enemy rank
  if (typeof engine.spawnImpactBurst === "function") {
    engine.spawnImpactBurst(
      x,
      y,
      elemInfo ? elemInfo.primary : prof.highlight,
      isBoss || isMini || isElite ? "finisher" : "heavy",
      hitDir,
      killerHeroId ? { heroId: killerHeroId, skillIdx: opts.skillIdx || 3 } : null
    );
  }

  // Spirit wisp release for elites, mini-bosses, arcane beings, and wave bosses (tuned to death archetype)
  if ((isBoss || isMini || isElite || prof.archetype === "celestial_arcane") && typeof engine.spawnParticles === "function") {
    const wispCount = isBoss ? 12 : isMini ? 7 : isElite ? 5 : 3;
    engine.spawnParticles(x, y, elemInfo ? elemInfo.highlight : prof.highlight, wispCount, 65, 220, isBoss ? 4.2 : 3.4, 0.48, "star", { drag: 0.91, gravity: -45, spin: 5, additive: true });
  }

  // 3. Push bespoke deadCorpse record for multi-stage collapse/shatter/unravel rendering
  if (Array.isArray(engine.deadCorpses)) {
    const maxCorpses = perf?.maxCorpses ?? 40;
    if (engine.deadCorpses.length >= maxCorpses) engine.deadCorpses.shift();
    engine.deadCorpses.push({
      x,
      y,
      radius: r,
      color: enemy.color || prof.primary,
      kind: enemy.kind || "minion",
      bossWave: enemy.bossWave || 0,
      name: enemy.name || "",
      facing: hitDir,
      timer: 0,
      maxLife: isBoss ? 4.2 : isMini ? 3.1 : 2.4,
      splatRadius: r * (isBoss ? 2.1 : 1.55),
      splatColor: prof.splatColor,
      deathProfile: prof,
      killerHeroId,
      damageElement: elemInfo ? elemInfo.element : damageElement,
      seed: (x * 0.13 + y * 0.07) % 10,
    });
  }

  return prof;
}

/**
 * Renders the multi-stage aftermath & death collapse of an enemy in world space.
 */
export function renderDeadCorpse(ctx, corpse, isMono = false) {
  if (!ctx || !corpse) return;
  const prof = corpse.deathProfile || classifyEnemyDeathProfile(corpse);
  const t = clamp(safeNum(corpse.timer, 0) / Math.max(0.1, safeNum(corpse.maxLife, 2.4)), 0, 1);
  const fade = t < 0.68 ? 1 : Math.max(0, (1 - t) / 0.32);
  if (fade <= 0.01) return;

  const x = safeNum(corpse.x, 0);
  const y = safeNum(corpse.y, 0);
  const r = safeRadius(corpse.radius, 14);
  const splatR = safeRadius(corpse.splatRadius, r * 1.55);
  const facing = safeNum(corpse.facing, 0);
  const pop = Math.min(1, safeNum(corpse.timer, 0) / 0.24);
  const ease = 1 - Math.pow(1 - pop, 2.2);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= fade;

  const arch = prof.archetype;

  if (arch === "frost_crystal") {
    // Frost floor patch + shattered crystal remains (or empty ice coffin for Frozen Tomb boss)
    ctx.save();
    ctx.scale(1, 0.65);
    const iceGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, splatR * ease);
    iceGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.42)" : "rgba(186, 230, 253, 0.48)");
    iceGrad.addColorStop(0.65, isMono ? "rgba(148,163,184,0.22)" : "rgba(14, 165, 233, 0.24)");
    iceGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = iceGrad;
    ctx.beginPath();
    ctx.arc(0, 0, splatR * ease, 0, Math.PI * 2);
    ctx.fill();

    if (prof.loreVariant === "frozen_coffin") {
      // Hollow shattered coffin outline — empty inside
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, -r * 0.4);
      ctx.lineTo(0, -r * 0.95);
      ctx.lineTo(r * 0.9, -r * 0.4);
      ctx.lineTo(r * 0.72, r * 0.85);
      ctx.lineTo(-r * 0.72, r * 0.85);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Settled ice crystal shards
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i + facing * 0.3;
      const dist = r * (0.35 + (i % 2) * 0.45) * ease;
      drawFacetedShard(ctx, {
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.68,
        size: r * (0.24 - i * 0.02),
        rot: a + 0.5,
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
        isMono,
      });
    }
  } else if (arch === "stone_construct") {
    // Cracked dust crater + settled rubble blocks
    ctx.save();
    ctx.scale(1, 0.68);
    ctx.fillStyle = isMono ? "rgba(30,41,59,0.5)" : "rgba(28, 25, 23, 0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, splatR * 0.86 * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
    ctx.lineWidth = 1.6;
    for (let c = 0; c < 4; c++) {
      const ca = facing + c * 1.55;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ca) * splatR * 0.55 * ease, Math.sin(ca) * splatR * 0.55 * ease);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i + facing;
      const dist = r * (0.32 + (i % 3) * 0.28) * ease;
      drawFacetedShard(ctx, {
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.68,
        size: r * (0.3 - (i % 3) * 0.05),
        rot: a * 1.4,
        shape: "rock",
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
        isMono,
      });
    }
  } else if (arch === "steel_mech") {
    // Scorched oil stain + scattered armor plates + dying electrical arc
    ctx.save();
    ctx.scale(1, 0.65);
    const oilGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, splatR * ease);
    oilGrad.addColorStop(0, isMono ? "rgba(0,0,0,0.75)" : "rgba(15, 23, 42, 0.8)");
    oilGrad.addColorStop(0.7, isMono ? "rgba(51,65,85,0.35)" : "rgba(30, 41, 59, 0.35)");
    oilGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = oilGrad;
    ctx.beginPath();
    ctx.arc(0, 0, splatR * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      const a = facing + (i - 1.5) * 1.25;
      const dist = r * (0.38 + (i % 2) * 0.42) * ease;
      drawFacetedShard(ctx, {
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.68,
        size: r * 0.32,
        rot: a + 0.8,
        shape: "plate",
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
        isMono,
      });
    }
    if (t < 0.5) {
      drawBranchingArc(ctx, {
        x1: -r * 0.35,
        y1: -r * 0.12,
        x2: r * 0.42,
        y2: r * 0.15,
        seed: corpse.timer * 15,
        width: 1.4,
        color: prof.rim,
        coreColor: prof.highlight,
        isMono,
      });
    }
  } else if (arch === "shadow_void") {
    // Void implosion / mirror glass / blank manuscript pages
    ctx.save();
    ctx.scale(1, 0.68);
    const voidGrad = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, splatR * ease);
    voidGrad.addColorStop(0, "rgba(0,0,0,0.85)");
    voidGrad.addColorStop(0.55, isMono ? "rgba(100,116,139,0.28)" : "rgba(126, 34, 206, 0.34)");
    voidGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(0, 0, splatR * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 0.5) * i + facing + t * 0.6;
      const dist = r * (0.4 + i * 0.16) * ease;
      drawFacetedShard(ctx, {
        x: Math.cos(a) * dist,
        y: Math.sin(a) * dist * 0.72 - t * 14,
        size: r * 0.28,
        rot: a + t * 2.2,
        shape: prof.loreVariant === "blank_pages" || prof.loreVariant === "paper" ? "paper" : "crystal",
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
        isMono,
      });
    }
  } else if (arch === "wood_root") {
    // Severed bark / twisted root mound (grudge_forest finale boss leaves one subtly twitching root)
    ctx.save();
    ctx.scale(1, 0.68);
    ctx.fillStyle = isMono ? "rgba(15,23,42,0.55)" : "rgba(20, 83, 45, 0.52)";
    ctx.beginPath();
    ctx.arc(0, 0, splatR * 0.85 * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const twitch = prof.loreVariant === "moving_root" ? Math.sin(corpse.timer * 7) * 5 : 0;
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#166534";
    ctx.lineWidth = Math.max(2.5, r * 0.18);
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const a = facing + (i - 1) * 1.1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.4 + twitch * (i === 1 ? 1 : 0), Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.72 + twitch);
      ctx.stroke();
    }
  } else if (arch === "celestial_arcane") {
    // Fading magic sigil circle + rising golden/arcane prisms
    ctx.save();
    ctx.scale(1, 0.68);
    ctx.strokeStyle = isMono ? "#FFFFFF" : prof.primary;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, splatR * 0.84 * (0.8 + t * 0.25), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + t;
      const px = Math.cos(a) * splatR * 0.62;
      const py = Math.sin(a) * splatR * 0.62;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 0.5) * i + t * 1.4;
      drawFacetedShard(ctx, {
        x: Math.cos(a) * r * 0.55,
        y: Math.sin(a) * r * 0.35 - t * 22,
        size: r * 0.22 * (1 - t * 0.5),
        rot: a,
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
        isMono,
      });
    }
  } else if (arch === "infernal_fire") {
    // Charred scorch crater + glowing magma fissures + rising ash/ember wisps
    ctx.save();
    ctx.scale(1, 0.66);
    const craterGrad = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, splatR * ease);
    craterGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.45)" : "rgba(251, 146, 60, 0.58)");
    craterGrad.addColorStop(0.42, isMono ? "rgba(15,23,42,0.8)" : "rgba(28, 10, 0, 0.82)");
    craterGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = craterGrad;
    ctx.beginPath();
    ctx.arc(0, 0, splatR * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawVolumetricSmokeLobe(ctx, {
      x: 0,
      y: -t * 18,
      radius: r * (0.45 + t * 0.35),
      seed: x * 0.1,
      lifeRatio: t,
      color: "#57534E",
      shadowColor: "#1C1917",
      rimColor: "#FB923C",
      isMono,
      alpha: 0.45 * (1 - t),
    });
  } else if (arch === "venom_insect") {
    // Ruptured green chitin plates + bubbling toxic ichor puddle (NO generic red blood!)
    ctx.save();
    ctx.scale(1, 0.65);
    const bileGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, splatR * ease);
    bileGrad.addColorStop(0, isMono ? "rgba(226,232,240,0.5)" : "rgba(163, 230, 53, 0.52)");
    bileGrad.addColorStop(0.6, isMono ? "rgba(51,65,85,0.45)" : "rgba(20, 83, 45, 0.62)");
    bileGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bileGrad;
    ctx.beginPath();
    ctx.arc(0, 0, splatR * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 3; i++) {
      const a = facing + (i - 1) * 1.3;
      drawFacetedShard(ctx, {
        x: Math.cos(a) * r * 0.55 * ease,
        y: Math.sin(a) * r * 0.38 * ease,
        size: r * 0.28,
        rot: a,
        shape: "plate",
        primary: prof.primary,
        highlight: prof.highlight,
        shadow: prof.shadow,
        rim: prof.rim,
        isMono,
      });
    }
  } else {
    // Flesh beast: directional arterial pool along impact vector + dark silhouette collapse (NOT a generic circle)
    ctx.save();
    ctx.rotate(facing);
    ctx.scale(1.25, 0.62);
    const bloodGrad = ctx.createRadialGradient(r * 0.25, 0, r * 0.1, r * 0.2, 0, splatR * ease);
    bloodGrad.addColorStop(0, isMono ? "rgba(15,23,42,0.85)" : "rgba(127, 29, 29, 0.85)");
    bloodGrad.addColorStop(0.62, isMono ? "rgba(51,65,85,0.45)" : "rgba(69, 10, 10, 0.58)");
    bloodGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bloodGrad;
    ctx.beginPath();
    ctx.arc(r * 0.22 * ease, 0, splatR * ease, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Collapsed torso silhouette flattened along hit direction
    ctx.save();
    ctx.rotate(facing);
    ctx.scale(1 + ease * 0.35, Math.max(0.28, 0.85 - ease * 0.57));
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.92, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#0F172A" : (corpse.color || "#3F3F46");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#CBD5E1" : prof.shadow;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  // Cause-of-death killer elemental residue fused atop archetype corpse
  if (corpse.killerHeroId) {
    renderElementalCorpseOverlay(ctx, {
      ...corpse,
      life: corpse.timer,
      angle: facing,
    }, isMono);
  }

  ctx.restore();
}
