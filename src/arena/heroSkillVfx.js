// Extreme VFX Overhaul: 24-Hero Bespoke 4-Stage Visual Language Engine
// Zero ctx.shadowBlur, zero ctx.setLineDash, zero "lighter" composite mode.
// Full isMono monochrome realm support & mobile-safe finite/radius guards.

import {
  clamp,
  safeNum,
  safeRadius,
  colorWithAlpha,
  resolvePalette,
  drawFacetedShard,
  drawVolumetricSmokeLobe,
  drawViscousDroplet,
  drawWindStreamRibbon,
  drawBranchingArc,
  drawPerspectiveZoneBase,
  drawSculptedBladeSlash,
  drawStructuralExplosion,
  drawArcaneMagicCircle,
  drawEnergyVortexPillar,
  drawImpactCraterDecal,
} from "./vfxMaterials";

const SAFE_MIN_R = 0.25;

function safeR(val, fallback = 1) {
  const n = Number(val);
  if (!Number.isFinite(n)) return Math.max(SAFE_MIN_R, fallback);
  return Math.max(SAFE_MIN_R, n);
}

function safeCoord(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function drawPolygonRing(ctx, cx, cy, r, sides, rot, strokeStyle, lineWidth, fillStyle = null) {
  const rad = safeR(r, 4);
  const count = Math.max(3, Math.floor(sides));
  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const a = rot + (Math.PI * 2 * i) / count;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = Math.max(0.8, safeNum(lineWidth, 1.5));
    ctx.stroke();
  }
}

function drawStarFlare(ctx, x, y, outerR, innerR, points, rot, fill, stroke, lineWidth = 1.2) {
  const oR = safeR(outerR, 6);
  const iR = safeR(innerR, oR * 0.32);
  const pts = Math.max(3, Math.floor(points));
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? oR : iR;
    const a = rot + (i * Math.PI) / pts;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(0.6, lineWidth);
    ctx.stroke();
  }
}

function drawSegmentedArcs(ctx, cx, cy, r, segs, gapRad, rot, stroke, lineWidth, tiltY = 1) {
  const rad = safeR(r, 4);
  const n = Math.max(2, Math.floor(segs));
  const span = (Math.PI * 2) / n;
  const g = clamp(gapRad, 0.04, span * 0.45);
  ctx.save();
  ctx.translate(cx, cy);
  if (tiltY !== 1) ctx.scale(1, clamp(tiltY, 0.3, 1.2));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(0.8, lineWidth);
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const a0 = rot + i * span + g * 0.5;
    const a1 = rot + (i + 1) * span - g * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, rad, a0, a1);
    ctx.stroke();
  }
  ctx.restore();
}

export const HERO_SKILL_VFX_PROFILES = {
  dung: {
    element: "lightning",
    primary: "#F59E0B",
    secondary: "#38BDF8",
    highlight: "#FEF9C3",
    shadow: "#0C4A6E",
    rim: "#7DD3FC",
    debrisShape: "shard",
    motif: "cerberus_lightning",
    deathStyle: "electro_char",
  },
  tin: {
    element: "blood_rift",
    primary: "#F43F5E",
    secondary: "#E879F9",
    highlight: "#FFE4E6",
    shadow: "#4C0519",
    rim: "#FDA4AF",
    debrisShape: "crystal",
    motif: "crimson_crystal",
    deathStyle: "crystal_shatter",
  },
  kin: {
    element: "gale",
    primary: "#34D399",
    secondary: "#FEF08A",
    highlight: "#ECFDF5",
    shadow: "#064E3B",
    rim: "#6EE7B7",
    debrisShape: "feather",
    motif: "gale_chevron",
    deathStyle: "wind_disperse",
  },
  trung: {
    element: "arcane_meteor",
    primary: "#818CF8",
    secondary: "#FDE047",
    highlight: "#EEF2FF",
    shadow: "#1E1B4B",
    rim: "#C7D2FE",
    debrisShape: "rock",
    motif: "astrolabe_meteor",
    deathStyle: "arcane_vaporize",
  },
  eohyen: {
    element: "frost",
    primary: "#38BDF8",
    secondary: "#E0F2FE",
    highlight: "#FFFFFF",
    shadow: "#082F49",
    rim: "#BAE6FD",
    debrisShape: "crystal",
    motif: "glacial_hex",
    deathStyle: "frost_shatter",
  },
  longhoi: {
    element: "fox_fire",
    primary: "#FB923C",
    secondary: "#FEF08A",
    highlight: "#FFFBEB",
    shadow: "#7C2D12",
    rim: "#FDBA74",
    debrisShape: "ember",
    motif: "nine_tails_pyre",
    deathStyle: "fox_incinerate",
  },
  duccong: {
    element: "cosmos",
    primary: "#A855F7",
    secondary: "#67E8F9",
    highlight: "#F3E8FF",
    shadow: "#1E103C",
    rim: "#D8B4FE",
    debrisShape: "crystal",
    motif: "singularity_orbit",
    deathStyle: "gravity_collapse",
  },
  gau: {
    element: "iron_quake",
    primary: "#FBBF24",
    secondary: "#EA580C",
    highlight: "#FEF3C7",
    shadow: "#451A03",
    rim: "#FDE68A",
    debrisShape: "rock",
    motif: "tectonic_knuckle",
    deathStyle: "seismic_crush",
  },
  bao: {
    element: "shadow_blade",
    primary: "#E879F9",
    secondary: "#9333EA",
    highlight: "#FAE8FF",
    shadow: "#1E0536",
    rim: "#F0ABFC",
    debrisShape: "shard",
    motif: "phantom_mark",
    deathStyle: "shadow_dissolve",
  },
  danh: {
    element: "dragon_fire",
    primary: "#EF4444",
    secondary: "#FBBF24",
    highlight: "#FEF08A",
    shadow: "#450A0A",
    rim: "#FCA5A5",
    debrisShape: "ember",
    motif: "dragon_cleave",
    deathStyle: "dragon_cremate",
  },
  luan: {
    element: "void_prism",
    primary: "#C084FC",
    secondary: "#67E8F9",
    highlight: "#F8FAFC",
    shadow: "#1E1B4B",
    rim: "#E9D5FF",
    debrisShape: "crystal",
    motif: "prism_rift",
    deathStyle: "void_fracture",
  },
  taidu: {
    element: "mecha_emp",
    primary: "#38BDF8",
    secondary: "#F97316",
    highlight: "#E0F2FE",
    shadow: "#0F172A",
    rim: "#7DD3FC",
    debrisShape: "shard",
    motif: "hex_turret_emp",
    deathStyle: "emp_overload",
  },
  nguyen: {
    element: "sanctuary_flora",
    primary: "#10B981",
    secondary: "#FEF08A",
    highlight: "#ECFDF5",
    shadow: "#064E3B",
    rim: "#6EE7B7",
    debrisShape: "feather",
    motif: "lotus_sanctuary",
    deathStyle: "petal_purify",
  },
  duy: {
    element: "shinobi_decoy",
    primary: "#14B8A6",
    secondary: "#F43F5E",
    highlight: "#CCFBF1",
    shadow: "#134E4A",
    rim: "#5EEAD4",
    debrisShape: "shard",
    motif: "shinobi_seal",
    deathStyle: "paper_seal_burst",
  },
  phong: {
    element: "reaper_dual",
    primary: "#22D3EE",
    secondary: "#F43F5E",
    highlight: "#ECFEFF",
    shadow: "#083344",
    rim: "#67E8F9",
    debrisShape: "shard",
    motif: "reaper_crescent",
    deathStyle: "soul_reap",
  },
  dang: {
    element: "tiger_steel",
    primary: "#F8FAFC",
    secondary: "#F59E0B",
    highlight: "#FFFFFF",
    shadow: "#0F172A",
    rim: "#CBD5E1",
    debrisShape: "rock",
    motif: "tiger_fang",
    deathStyle: "steel_rend",
  },
  thien: {
    element: "chrono_sword",
    primary: "#FACC15",
    secondary: "#38BDF8",
    highlight: "#FEFCE8",
    shadow: "#422006",
    rim: "#FDE047",
    debrisShape: "crystal",
    motif: "chrono_gate",
    deathStyle: "chrono_erasure",
  },
  thanh: {
    element: "abyss_serpent",
    primary: "#34D399",
    secondary: "#A78BFA",
    highlight: "#ECFDF5",
    shadow: "#022C22",
    rim: "#6EE7B7",
    debrisShape: "droplet",
    motif: "serpent_fang",
    deathStyle: "venom_dissolve",
  },
  nhi: {
    element: "alchemy_toxin",
    primary: "#E879F9",
    secondary: "#4ADE80",
    highlight: "#FAE8FF",
    shadow: "#3B0764",
    rim: "#86EFAC",
    debrisShape: "droplet",
    motif: "alchemical_vial",
    deathStyle: "acid_melt",
  },
  minh: {
    element: "celestial_chain",
    primary: "#FACC15",
    secondary: "#38BDF8",
    highlight: "#FEF9C3",
    shadow: "#1E3A8A",
    rim: "#93C5FD",
    debrisShape: "crystal",
    motif: "celestial_jail",
    deathStyle: "judgment_seal",
  },
  ducanh: {
    element: "molten_anvil",
    primary: "#F97316",
    secondary: "#FDE047",
    highlight: "#FFF7ED",
    shadow: "#431407",
    rim: "#FDBA74",
    debrisShape: "rock",
    motif: "forge_boulder",
    deathStyle: "anvil_shatter",
  },
  bach: {
    element: "wind_phantom",
    primary: "#22D3EE",
    secondary: "#E879F9",
    highlight: "#ECFEFF",
    shadow: "#164E63",
    rim: "#A5F3FC",
    debrisShape: "feather",
    motif: "phantom_x",
    deathStyle: "gale_rend",
  },
  thai: {
    element: "gladiator_gold",
    primary: "#FDE047",
    secondary: "#EF4444",
    highlight: "#FEFCE8",
    shadow: "#450A0A",
    rim: "#FCA5A5",
    debrisShape: "rock",
    motif: "colosseum_crest",
    deathStyle: "arena_execute",
  },
  khair: {
    element: "emerald_rail",
    primary: "#4ADE80",
    secondary: "#FDE047",
    highlight: "#F0FDF4",
    shadow: "#052E16",
    rim: "#86EFAC",
    debrisShape: "shard",
    motif: "emerald_railgun",
    deathStyle: "rail_pierce",
  },
};

export function resolveHeroDamageElement(heroId, opts = {}) {
  const prof = HERO_SKILL_VFX_PROFILES[heroId] || HERO_SKILL_VFX_PROFILES.eohyen;
  return {
    heroId: heroId || "eohyen",
    element: opts.element || prof.element,
    deathStyle: opts.deathStyle || prof.deathStyle,
    primary: opts.primary || prof.primary,
    secondary: opts.secondary || prof.secondary,
    highlight: opts.highlight || prof.highlight,
    shadow: opts.shadow || prof.shadow,
    rim: opts.rim || prof.rim,
    debrisShape: prof.debrisShape,
    motif: prof.motif,
  };
}

// ============================================================================
// STAGE 1A: WEAPON SKILL AURA (Drawn at hero weapon mount during windup/buff)
// ============================================================================
export function drawHeroWeaponSkillAura(ctx, heroId, p, elapsedTime, state = {}, isMono = false) {
  const skillIdx = Number(p?.weaponSkillIdx || 0);
  const timer = safeNum(p?.weaponSkillTimer, 0);
  if (skillIdx <= 0 || timer <= 0) return false;

  const prof = HERO_SKILL_VFX_PROFILES[heroId] || HERO_SKILL_VFX_PROFILES.eohyen;
  const pal = resolvePalette(prof.primary, prof.highlight, prof.shadow, prof.rim, isMono);
  const sec = isMono ? "#E2E8F0" : prof.secondary;
  const t = safeNum(elapsedTime, 0);
  const alpha = clamp(timer * 1.4, 0.28, 0.95);
  const radius = safeR(p?.radius, 22);
  const aimAng = safeNum(p?.facingAngle, 0);
  const pulse = 1 + Math.sin(t * 14) * 0.12;

  ctx.save();
  ctx.globalAlpha *= alpha;

  // Skill intensity multiplier: C1 sharp focus, C2 surge/defense, C3/C4 cataclysm
  const scale = skillIdx === 1 ? 1.0 : skillIdx === 2 ? 1.18 : 1.35;
  const reach = radius * (1.28 + skillIdx * 0.16) * pulse;

  switch (heroId) {
    case "dung": {
      const fangs = skillIdx === 3 ? 3 : 2;
      for (let i = 0; i < fangs; i++) {
        const ang = aimAng + (i - (fangs - 1) * 0.5) * 0.48;
        drawBranchingArc(ctx, {
          x1: Math.cos(ang) * radius * 0.45,
          y1: Math.sin(ang) * radius * 0.45,
          x2: Math.cos(ang) * (reach + 14),
          y2: Math.sin(ang) * (reach + 14),
          color: i % 2 === 0 ? pal.primary : sec,
          coreColor: pal.highlight,
          width: 2.2 * scale,
          seed: t * 24 + i * 7,
          jaggedness: 9 * scale,
          isMono,
        });
      }
      break;
    }
    case "tin": {
      drawStarFlare(ctx, Math.cos(aimAng) * radius * 0.9, Math.sin(aimAng) * radius * 0.9, 13 * scale, 3.5, 4, t * 5, pal.highlight, pal.primary, 1.5);
      drawSegmentedArcs(ctx, 0, 0, radius * 1.35, 3, 0.7, t * 4.5, sec, 2.0);
      break;
    }
    case "kin": {
      for (let i = -1; i <= 1; i += 2) {
        drawWindStreamRibbon(ctx, {
          x1: Math.cos(aimAng + i * 0.65) * radius * 0.85,
          y1: Math.sin(aimAng + i * 0.65) * radius * 0.85,
          x2: Math.cos(aimAng) * (reach + 12),
          y2: Math.sin(aimAng) * (reach + 12),
          color: pal.primary,
          highlight: pal.highlight,
          width: 3.2 * scale,
          twist: Math.sin(t * 16 + i) * 7,
          isMono,
        });
      }
      break;
    }
    case "trung": {
      drawPolygonRing(ctx, 0, 0, reach * 0.9, skillIdx === 3 ? 6 : 4, t * 3.5, pal.primary, 1.8);
      drawPolygonRing(ctx, 0, 0, reach * 0.62, 3, -t * 5.2, sec, 1.4);
      break;
    }
    case "eohyen": {
      const shards = skillIdx + 2;
      for (let i = 0; i < shards; i++) {
        const a = aimAng + (i - (shards - 1) * 0.5) * 0.52 + Math.sin(t * 6 + i) * 0.08;
        drawFacetedShard(ctx, {
          x: Math.cos(a) * reach * 0.92,
          y: Math.sin(a) * reach * 0.92,
          size: 7.5 * scale,
          rot: a + Math.PI * 0.5,
          shape: "crystal",
          primary: pal.primary,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: pal.rim,
          isMono,
        });
      }
      break;
    }
    case "longhoi": {
      const tails = skillIdx === 3 ? 5 : skillIdx + 2;
      for (let i = 0; i < tails; i++) {
        const a = aimAng + Math.PI + (i - (tails - 1) * 0.5) * 0.34;
        const sway = Math.sin(t * 13 + i * 1.4) * 7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.2) * reach * 0.85 + sway,
          Math.sin(a + 0.2) * reach * 0.85,
          Math.cos(a) * (reach + 14),
          Math.sin(a) * (reach + 14)
        );
        ctx.strokeStyle = i % 2 === 0 ? pal.primary : sec;
        ctx.lineWidth = 3.2 * scale;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      break;
    }
    case "duccong": {
      drawSegmentedArcs(ctx, 0, 0, reach, 4, 0.35, t * 4, pal.primary, 2.2, 0.56);
      const orbAng = t * 5.5;
      drawStarFlare(ctx, Math.cos(orbAng) * reach, Math.sin(orbAng) * reach * 0.56, 7 * scale, 2.2, 4, t * 6, pal.highlight, sec, 1.1);
      break;
    }
    case "gau":
    case "ducanh": {
      drawSegmentedArcs(ctx, 0, 0, reach * 0.88, 6, 0.25, -t * 3.5, pal.primary, 2.8 * scale, 0.85);
      for (let i = -1; i <= 1; i += 2) {
        drawFacetedShard(ctx, {
          x: Math.cos(aimAng + i * 0.45) * radius * 1.15,
          y: Math.sin(aimAng + i * 0.45) * radius * 1.15,
          size: 7.5 * scale,
          rot: aimAng + t * 5,
          shape: "rock",
          primary: pal.primary,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: sec,
          isMono,
        });
      }
      break;
    }
    case "bao":
    case "phong":
    case "bach": {
      for (let i = -1; i <= 1; i += 2) {
        drawSculptedBladeSlash(ctx, {
          x: 0,
          y: 0,
          radius: reach * 0.96,
          startAngle: aimAng + i * 0.95 - 0.55,
          endAngle: aimAng + i * 0.95 + 0.55,
          thickness: 6.5 * scale,
          primary: i < 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: pal.rim,
          progress: 0.42,
          isMono,
        });
      }
      break;
    }
    case "danh":
    case "thai": {
      drawSculptedBladeSlash(ctx, {
        x: 0,
        y: 0,
        radius: reach * 1.08,
        startAngle: aimAng - 1.15,
        endAngle: aimAng + 1.15,
        thickness: 9 * scale,
        primary: pal.primary,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: sec,
        progress: 0.45,
        isMono,
      });
      break;
    }
    case "luan": {
      for (let i = 0; i < 3; i++) {
        const a = aimAng + (i - 1) * 0.68 + t * 2.2;
        drawFacetedShard(ctx, {
          x: Math.cos(a) * reach,
          y: Math.sin(a) * reach,
          size: 8.5 * scale,
          rot: a + t * 4,
          shape: "crystal",
          primary: i === 1 ? sec : pal.primary,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: pal.rim,
          isMono,
        });
      }
      break;
    }
    case "taidu":
    case "khair": {
      drawPolygonRing(ctx, Math.cos(aimAng) * radius * 0.9, Math.sin(aimAng) * radius * 0.9, 13 * scale, 6, t * 4.5, pal.primary, 1.9);
      drawSegmentedArcs(ctx, 0, 0, reach * 0.92, 3, 0.55, aimAng - 0.5, sec, 2.0);
      break;
    }
    case "nguyen": {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.8 + (Math.PI * 0.5 * i);
        drawViscousDroplet(ctx, {
          x: Math.cos(a) * reach * 0.9,
          y: Math.sin(a) * reach * 0.9,
          angle: a + Math.PI * 0.5,
          length: 11 * scale,
          width: 5 * scale,
          primary: pal.primary,
          highlight: pal.highlight,
          shadow: pal.shadow,
          isMono,
        });
      }
      break;
    }
    case "duy": {
      for (let i = 0; i < 3; i++) {
        const a = t * 6.5 + (Math.PI * 2 * i) / 3;
        drawStarFlare(ctx, Math.cos(a) * reach, Math.sin(a) * reach, 8.5 * scale, 2.8, 4, a + t * 8, pal.primary, pal.highlight, 1.2);
      }
      break;
    }
    case "dang": {
      const col = skillIdx === 2 ? (isMono ? "#94A3B8" : "#1E293B") : pal.primary;
      const rimCol = skillIdx === 2 ? sec : pal.rim;
      drawSegmentedArcs(ctx, 0, 0, reach * 0.95, 2, 0.85, aimAng - Math.PI * 0.5, col, 3.2 * scale);
      drawSegmentedArcs(ctx, 0, 0, reach * 0.78, 2, 0.95, aimAng + Math.PI * 0.3, rimCol, 2.0 * scale);
      break;
    }
    case "thien": {
      const swCount = skillIdx + 2;
      for (let i = 0; i < swCount; i++) {
        const a = t * 3.8 + (Math.PI * 2 * i) / swCount;
        const sx = Math.cos(a) * reach;
        const sy = Math.sin(a) * reach;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a + Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, -10 * scale);
        ctx.lineTo(3.2 * scale, 2);
        ctx.lineTo(0, 7 * scale);
        ctx.lineTo(-3.2 * scale, 2);
        ctx.closePath();
        ctx.fillStyle = pal.highlight;
        ctx.fill();
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case "thanh":
    case "nhi": {
      for (let i = 0; i < 4; i++) {
        const a = t * 4.2 + i * 1.57;
        drawViscousDroplet(ctx, {
          x: Math.cos(a) * reach * 0.86,
          y: Math.sin(a) * reach * 0.86,
          angle: a + Math.PI * 0.4,
          length: 10 * scale,
          width: 4.5 * scale,
          primary: i % 2 === 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          isMono,
        });
      }
      break;
    }
    case "minh": {
      drawPolygonRing(ctx, 0, 0, reach * 0.92, 4, t * 2.5, pal.primary, 2.2);
      drawSegmentedArcs(ctx, 0, 0, reach * 1.08, 4, 0.45, -t * 3.2, sec, 1.8);
      break;
    }
    default: {
      drawSegmentedArcs(ctx, 0, 0, reach, 4, 0.4, t * 4, pal.primary, 2.2);
      break;
    }
  }

  ctx.restore();
  return true;
}

// ============================================================================
// STAGE 1B: SKILL CAST WINDUP / ANTICIPATION (Ground lock & convergence)
// ============================================================================
export function drawHeroSkillWindup(ctx, w, elapsedTime, isMono = false) {
  if (!w) return;
  const maxLife = Math.max(0.08, safeNum(w.maxLife, 0.28));
  const f = clamp(safeNum(w.life, 0) / maxLife, 0, 1);
  if (f >= 1) return;

  const prof = HERO_SKILL_VFX_PROFILES[w.heroId] || HERO_SKILL_VFX_PROFILES.eohyen;
  const pal = resolvePalette(w.color || prof.primary, prof.highlight, prof.shadow, w.secondaryColor || prof.rim, isMono);
  const sec = isMono ? "#E2E8F0" : (w.secondaryColor || prof.secondary);
  const x = safeCoord(w.x, 0);
  const y = safeCoord(w.y, 0);
  const rad = safeR(w.radius, 52);
  const ang = safeNum(w.angle, 0);
  const skillIdx = Number(w.skillIdx || 1);
  const env = f < 0.28 ? f / 0.28 : 1 - (f - 0.28) / 0.72;
  const converge = 1 - f * 0.62;
  const t = safeNum(elapsedTime, 0);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= clamp(env, 0, 1) * (skillIdx === 3 || skillIdx === 4 ? 0.92 : 0.78);

  // Ground perspective aura base + unique hero telegraph geometry
  drawPerspectiveZoneBase(ctx, {
    x: 0,
    y: 0,
    radius: rad * converge,
    tiltY: 0.68,
    primary: pal.primary,
    highlight: pal.highlight,
    shadow: pal.shadow,
    rim: pal.rim,
    pulse: 0.5 + f * 0.5,
    isMono,
  });

  switch (prof.element) {
    case "lightning":
    case "chrono_sword":
    case "celestial_chain": {
      drawSegmentedArcs(ctx, 0, 0, rad * converge, skillIdx === 3 ? 6 : 4, 0.34, t * 5 + f * 3, pal.primary, 2.4, 0.68);
      for (let i = 0; i < 3; i++) {
        const a = ang + (i - 1) * 1.15 + f * 1.2;
        drawBranchingArc(ctx, {
          x1: Math.cos(a) * rad * converge,
          y1: Math.sin(a) * rad * converge * 0.68,
          x2: 0,
          y2: 0,
          color: i === 1 ? pal.primary : sec,
          coreColor: pal.highlight,
          width: 2.0,
          seed: w.seed + i * 11,
          jaggedness: 10,
          isMono,
        });
      }
      break;
    }
    case "frost":
    case "void_prism":
    case "blood_rift": {
      ctx.save();
      ctx.scale(1, 0.68);
      drawPolygonRing(ctx, 0, 0, rad * converge, 6, ang + f * 1.4, pal.primary, 2.4, colorWithAlpha(pal.shadow, 0.24));
      drawPolygonRing(ctx, 0, 0, rad * converge * 0.64, 3, -ang - f * 2.1, sec, 1.8);
      ctx.restore();
      break;
    }
    case "fox_fire":
    case "dragon_fire":
    case "molten_anvil":
    case "iron_quake":
    case "gladiator_gold": {
      // Converging directional wedge / molten pressure arc
      drawSculptedBladeSlash(ctx, {
        x: 0,
        y: 0,
        radius: rad * converge,
        startAngle: ang - 0.95,
        endAngle: ang + 0.95,
        thickness: 9 * (1 - f * 0.45),
        primary: pal.primary,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: sec,
        progress: f * 0.7,
        isMono,
      });
      for (let i = 0; i < 4; i++) {
        const a = ang + (i - 1.5) * 0.75;
        const dist = rad * (1.1 - f * 0.75);
        drawFacetedShard(ctx, {
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist * 0.68,
          size: 6.5 * (1 - f * 0.3),
          rot: a,
          shape: prof.debrisShape,
          primary: pal.primary,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: sec,
          isMono,
        });
      }
      break;
    }
    case "gale":
    case "wind_phantom":
    case "reaper_dual":
    case "shadow_blade":
    case "shinobi_decoy": {
      // Directional focus chevrons converging toward cast direction
      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * 0.55;
        drawWindStreamRibbon(ctx, {
          x1: Math.cos(ang + offset + Math.PI) * rad * 0.9 * converge,
          y1: Math.sin(ang + offset + Math.PI) * rad * 0.62 * converge,
          x2: Math.cos(ang) * rad * 0.65,
          y2: Math.sin(ang) * rad * 0.44,
          color: i === 1 ? sec : pal.primary,
          highlight: pal.highlight,
          width: 4.2,
          twist: offset * 14 * (1 - f),
          isMono,
        });
      }
      break;
    }
    case "cosmos":
    case "arcane_meteor":
    case "mecha_emp":
    case "emerald_rail": {
      drawArcaneMagicCircle(ctx, {
        x: 0,
        y: 0,
        radius: rad * converge,
        rot: t * 3 + f * 2,
        sides: prof.element === "mecha_emp" ? 6 : 5,
        star: true,
        primary: pal.primary,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: sec,
        nodeShape: prof.debrisShape,
        alpha: 0.75,
        isMono,
      });
      break;
    }
    default: {
      // Flora / Serpent / Alchemy / Tiger Steel
      drawSegmentedArcs(ctx, 0, 0, rad * converge, 5, 0.35, t * 4, pal.primary, 2.6, 0.68);
      drawStarFlare(ctx, 0, 0, rad * 0.42 * (1 - f * 0.35), rad * 0.14, 5, t * 3, pal.highlight, sec, 1.3);
      break;
    }
  }

  // Central focal glint
  drawStarFlare(ctx, 0, -4, 14 * (0.4 + f * 0.75), 3.2, 4, ang + f * 1.5, pal.highlight, pal.primary, 1.1);
  ctx.restore();
}

// ============================================================================
// STAGE 2 & 3: HERO SKILL SLASHES / SHAPED BURSTS (ALL 24 HEROES BESPOKE)
// ============================================================================
export function drawHeroSkillSlash(ctx, h, f, elapsedTime, isMono = false) {
  if (!h || !h.kind) return false;
  const kind = h.kind;
  const x = safeCoord(h.x, 0);
  const y = safeCoord(h.y, 0);
  const maxR = safeR(h.maxRadius || h.radius, 64);
  const ang = safeNum(h.angle, 0);
  const easeOut = 1 - Math.pow(1 - clamp(f, 0, 1), 2.4);
  const fade = f < 0.12 ? f / 0.12 : clamp(1 - (f - 0.12) / 0.88, 0, 1);
  const t = safeNum(elapsedTime, 0);

  // Resolve palette from heroId or slash metadata
  const heroProf = HERO_SKILL_VFX_PROFILES[h.heroId] || {};
  const pal = resolvePalette(
    h.color || heroProf.primary || "#38BDF8",
    h.highlight || heroProf.highlight || "#FFFFFF",
    heroProf.shadow || "#0F172A",
    h.secondaryColor || heroProf.rim || "#BAE6FD",
    isMono
  );
  const sec = isMono ? "#E2E8F0" : (h.secondaryColor || heroProf.secondary || pal.rim);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= fade;

  switch (kind) {
    // -----------------------------------------------------------------------
    // 1. DŨNG (THẦN SÉT / TAM ĐẦU KHUYỂN)
    // -----------------------------------------------------------------------
    case "dung_c1_charge": {
      // Stage 2 Thunder Fang Dash Corridor + Jagged Arc Lance
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 16);
      ctx.save();
      ctx.rotate(ang);
      for (let i = -1; i <= 1; i++) {
        drawWindStreamRibbon(ctx, {
          x1: -curR * 0.55,
          y1: i * 16,
          x2: curR * 0.95,
          y2: i * 5,
          color: i === 0 ? pal.primary : sec,
          highlight: pal.highlight,
          width: i === 0 ? 11 : 5.5,
          twist: Math.sin(t * 24 + i * 2) * 8,
          isMono,
        });
      }
      drawBranchingArc(ctx, { x1: -curR * 0.4, y1: 0, x2: curR, y2: 0, color: sec, coreColor: pal.highlight, width: 3.4, seed: f * 30 + x, jaggedness: 14, isMono });
      // Lightning fang chevron head
      ctx.beginPath();
      ctx.moveTo(curR + 18, 0);
      ctx.lineTo(curR - 22, -24);
      ctx.lineTo(curR - 8, 0);
      ctx.lineTo(curR - 22, 24);
      ctx.closePath();
      ctx.fillStyle = pal.highlight;
      ctx.fill();
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      return true;
    }
    case "dung_cerberus_bite": {
      // Twin opposing lightning jaws clamping down
      const jawOpen = Math.max(0.08, (1 - easeOut) * 0.85);
      for (let side = -1; side <= 1; side += 2) {
        drawSculptedBladeSlash(ctx, {
          x: 0,
          y: side * 8 * (1 - f),
          radius: maxR * (0.72 + 0.28 * easeOut),
          startAngle: ang + side * jawOpen - 0.9,
          endAngle: ang + side * jawOpen + 0.9,
          thickness: 15 * (1 - f * 0.4),
          primary: side < 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: sec,
          progress: f,
          isMono,
        });
      }
      drawBranchingArc(ctx, { x1: Math.cos(ang - 0.6) * maxR * 0.7, y1: Math.sin(ang - 0.6) * maxR * 0.7, x2: Math.cos(ang + 0.6) * maxR * 0.7, y2: Math.sin(ang + 0.6) * maxR * 0.7, color: sec, coreColor: pal.highlight, width: 3.2, seed: f * 21, jaggedness: 12, isMono });
      ctx.restore();
      return true;
    }
    case "dung_c2_awaken": {
      // Cuồng Chiến golden-sky lightning surge crown + 6 radial discharges
      const curR = safeR(maxR * (0.3 + 0.7 * easeOut), 18);
      drawEnergyVortexPillar(ctx, { x: 0, y: 0, radius: maxR * 0.42, height: 155, progress: f, phase: t * 8, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "shard", isMono });
      drawSegmentedArcs(ctx, 0, 0, curR, 6, 0.26, f * 4.5, sec, 3.2, 0.7);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + f * 0.8;
        drawBranchingArc(ctx, { x1: 0, y1: 0, x2: Math.cos(a) * curR, y2: Math.sin(a) * curR * 0.72, color: i % 2 === 0 ? pal.primary : sec, coreColor: pal.highlight, width: 2.5, seed: i * 13 + x, jaggedness: 11, isMono });
      }
      ctx.restore();
      return true;
    }
    case "dung_c3_howl_ring": {
      // Tri-head Cerberus storm seal + radial thunder teeth
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 22);
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.68, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      drawSegmentedArcs(ctx, 0, 0, curR * 0.94, 3, 0.4, -t * 5, pal.primary, 4.5, 0.68);
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 * i) / 3 + ang;
        drawBranchingArc(ctx, { x1: 0, y1: 0, x2: Math.cos(a) * curR, y2: Math.sin(a) * curR * 0.68, color: sec, coreColor: pal.highlight, width: 3.4, seed: i * 19 + f * 15, jaggedness: 15, isMono });
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.85, y: Math.sin(a) * curR * 0.58, size: 12 * (1 - f * 0.4), rot: a + Math.PI * 0.5, shape: "shard", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 2. TÍN (HUYẾT ẢNH / MA THẠCH)
    // -----------------------------------------------------------------------
    case "tin_c1_blood_rift": {
      // Crimson crystal spatial tear bisecting dash line
      const len = maxR * (0.45 + 0.65 * easeOut);
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(-len * 0.45, 0);
      ctx.lineTo(0, -14 * (1 - f * 0.45));
      ctx.lineTo(len, 0);
      ctx.lineTo(0, 14 * (1 - f * 0.45));
      ctx.closePath();
      ctx.fillStyle = pal.shadow;
      ctx.fill();
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 3.2;
      ctx.stroke();
      // White core slash
      ctx.beginPath();
      ctx.moveTo(-len * 0.35, 0);
      ctx.lineTo(len * 0.92, 0);
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        drawFacetedShard(ctx, { x: len * (0.25 + i * 0.24), y: (i % 2 === 0 ? 1 : -1) * 14, size: 9.5 * (1 - f * 0.35), rot: i * 0.9, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      ctx.restore();
      return true;
    }
    case "tin_c2_twin_shard_cast": {
      // Twin boomerang blood-crystal launch wings
      const spread = safeR(maxR * (0.35 + 0.65 * easeOut), 16);
      for (let side = -1; side <= 1; side += 2) {
        drawSculptedBladeSlash(ctx, {
          x: 0,
          y: 0,
          radius: spread,
          startAngle: ang + side * 0.25 - 0.65,
          endAngle: ang + side * 0.25 + 0.65,
          thickness: 12 * (1 - f * 0.4),
          primary: side < 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: pal.rim,
          progress: f,
          isMono,
        });
      }
      drawStarFlare(ctx, Math.cos(ang) * spread * 0.5, Math.sin(ang) * spread * 0.5, 16, 4, 4, ang, pal.highlight, pal.primary, 1.5);
      ctx.restore();
      return true;
    }
    case "tin_c3_monochrome_cross": {
      // Cross-dimension monochrome execution X-rift
      const curR = safeR(maxR * (0.42 + 0.58 * easeOut), 28);
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.72, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      for (let k = -1; k <= 1; k += 2) {
        ctx.save();
        ctx.rotate(ang + k * 0.78);
        ctx.beginPath();
        ctx.moveTo(-curR, 0);
        ctx.lineTo(0, -13 * (1 - f * 0.5));
        ctx.lineTo(curR, 0);
        ctx.lineTo(0, 13 * (1 - f * 0.5));
        ctx.closePath();
        ctx.fillStyle = pal.highlight;
        ctx.fill();
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 3.2;
        ctx.stroke();
        ctx.restore();
      }
      drawSegmentedArcs(ctx, 0, 0, curR * 0.88, 4, 0.35, t * 4, pal.primary, 3.0, 0.72);
      ctx.restore();
      return true;
    }
    case "tin_resonance_surge": {
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 20);
      drawSegmentedArcs(ctx, 0, 0, curR, 5, 0.3, -t * 5, pal.primary, 3.0, 0.72);
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 + f * 1.2;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.85, y: Math.sin(a) * curR * 0.61, size: 10 * (1 - f * 0.4), rot: a, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 3. KIN (PHONG CUNG)
    // -----------------------------------------------------------------------
    case "kin_gale_slash": {
      // Multi-chevron emerald sonic wind bow arc + streaming wind ribbons
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 18);
      for (let i = -1; i <= 1; i++) {
        drawSculptedBladeSlash(ctx, {
          x: Math.cos(ang) * (i === 0 ? 10 : -4),
          y: Math.sin(ang) * (i === 0 ? 10 : -4),
          radius: curR * (i === 0 ? 1.0 : 0.82),
          startAngle: ang - 0.85 + i * 0.14,
          endAngle: ang + 0.85 + i * 0.14,
          thickness: (i === 0 ? 13 : 7.5) * (1 - f * 0.4),
          primary: i === 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: pal.rim,
          progress: f,
          isMono,
        });
      }
      drawWindStreamRibbon(ctx, { x1: Math.cos(ang - 0.7) * curR * 0.4, y1: Math.sin(ang - 0.7) * curR * 0.4, x2: Math.cos(ang) * curR * 1.12, y2: Math.sin(ang) * curR * 1.12, color: sec, highlight: pal.highlight, width: 4.5, twist: 10, isMono });
      ctx.restore();
      return true;
    }
    case "kin_c2_recoil_gale": {
      // Backdash vortex blast cone + feather-emerald gale ring
      const curR = safeR(maxR * (0.32 + 0.68 * easeOut), 20);
      drawSegmentedArcs(ctx, 0, 0, curR, 4, 0.35, ang + f * 3.5, pal.primary, 3.2, 0.7);
      for (let i = -1; i <= 1; i += 2) {
        drawWindStreamRibbon(ctx, { x1: 0, y1: 0, x2: Math.cos(ang + i * 0.55) * curR, y2: Math.sin(ang + i * 0.55) * curR * 0.72, color: sec, highlight: pal.highlight, width: 5.5 * (1 - f * 0.35), twist: i * 14, isMono });
      }
      ctx.restore();
      return true;
    }
    case "kin_c3_tempest_seal": {
      // Tempest cyclone eye + spiral wind blades
      const curR = safeR(maxR * (0.4 + 0.6 * easeOut), 28);
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.68, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      drawEnergyVortexPillar(ctx, { x: 0, y: 0, radius: curR * 0.45, height: 170, progress: f, phase: t * 9, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "feather", isMono });
      drawSegmentedArcs(ctx, 0, 0, curR * 0.94, 6, 0.28, -t * 6, sec, 3.0, 0.68);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 4. TRUNG (MA PHÁP SƯ)
    // -----------------------------------------------------------------------
    case "trung_c1_sky_thunder_seal": {
      // Orbital arcane sky-bolt + concentric rune ring
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 22);
      drawEnergyVortexPillar(ctx, { x: 0, y: 0, radius: curR * 0.36, height: 220, progress: f, phase: t * 7, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "shard", isMono });
      drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR, rot: t * 2.5, sides: 6, star: true, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.75, isMono });
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 0.5 * i) + f * 2;
        drawBranchingArc(ctx, { x1: 0, y1: -120 * (1 - f * 0.5), x2: Math.cos(a) * curR * 0.8, y2: Math.sin(a) * curR * 0.54, color: sec, coreColor: pal.highlight, width: 2.6, seed: i * 17 + x, jaggedness: 13, isMono });
      }
      ctx.restore();
      return true;
    }
    case "trung_c2_orb_ward": {
      // 6-sided astrolabe shield ward expanding around Trung
      const curR = safeR(maxR * (0.45 + 0.55 * easeOut), 20);
      drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR, rot: -t * 3.5, sides: 6, star: false, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.85, isMono });
      drawSegmentedArcs(ctx, 0, 0, curR * 1.12, 6, 0.25, t * 4, sec, 2.8, 0.72);
      ctx.restore();
      return true;
    }
    case "trung_c2_orb_detonate":
    case "arcane_orb_burst": {
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 16);
      drawStructuralExplosion(ctx, { x: 0, y: 0, radius: curR, progress: f, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "crystal", isMono });
      drawPolygonRing(ctx, 0, 0, curR * 0.9, 5, f * 3, sec, 2.2);
      ctx.restore();
      return true;
    }
    case "trung_c3_meteor_crater": {
      const curR = safeR(maxR * (0.4 + 0.6 * easeOut), 32);
      drawStructuralExplosion(ctx, { x: 0, y: 0, radius: curR, progress: f, primary: "#EA580C", highlight: "#FEF08A", shadow: "#431407", rim: pal.primary, debrisShape: "rock", isMono });
      drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR * 1.05, rot: f * 2.2, sides: 8, star: true, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.72, isMono });
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 5. EOHYEN (BĂNG KIẾM / EVITA)
    // -----------------------------------------------------------------------
    case "eohyen_frost_slash": {
      const curR = safeR(maxR * (0.34 + 0.66 * easeOut), 18);
      drawSculptedBladeSlash(ctx, {
        x: 0,
        y: 0,
        radius: curR,
        startAngle: ang - 1.15,
        endAngle: ang + 1.15,
        thickness: 16 * (1 - f * 0.35),
        primary: pal.primary,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: sec,
        progress: f,
        isMono,
      });
      // Trailing crystal snowflakes along slash arc
      for (let i = -2; i <= 2; i++) {
        const a = ang + i * 0.42;
        drawFacetedShard(ctx, {
          x: Math.cos(a) * curR * (0.88 + (i % 2) * 0.1),
          y: Math.sin(a) * curR * (0.88 + (i % 2) * 0.1),
          size: 8.5 * (1 - f * 0.4),
          rot: a + Math.PI * 0.5,
          shape: "crystal",
          primary: pal.primary,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: sec,
          isMono,
        });
      }
      ctx.restore();
      return true;
    }
    case "eohyen_c2_ice_bastion": {
      // Hexagonal frost crystal bastion perimeter
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 24);
      ctx.save();
      ctx.scale(1, 0.7);
      drawPolygonRing(ctx, 0, 0, curR, 6, f * 0.8, pal.primary, 3.4, colorWithAlpha(pal.shadow, 0.25));
      drawPolygonRing(ctx, 0, 0, curR * 0.74, 6, -f * 1.1, pal.highlight, 1.8);
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR, y: Math.sin(a) * curR * 0.7, size: 12 * (1 - f * 0.35), rot: 0, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }
    case "eohyen_c3_blizzard_crown": {
      const curR = safeR(maxR * (0.4 + 0.6 * easeOut), 32);
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.68, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      drawSegmentedArcs(ctx, 0, 0, curR, 8, 0.22, t * 4, pal.highlight, 3.0, 0.68);
      drawStarFlare(ctx, 0, 0, curR * 0.48, curR * 0.14, 6, t * 1.5, colorWithAlpha(pal.highlight, 0.6), pal.primary, 2.0);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 6. LONG HÓI (HỎA HỒ / CỬU VĨ)
    // -----------------------------------------------------------------------
    case "longhoi_c1_fox_fan": {
      // Triple fiery fox-tail crescent fan
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 18);
      for (let i = -1; i <= 1; i++) {
        const a = ang + i * 0.32;
        drawWindStreamRibbon(ctx, {
          x1: Math.cos(a) * 10,
          y1: Math.sin(a) * 10,
          x2: Math.cos(a) * curR,
          y2: Math.sin(a) * curR,
          color: i === 0 ? pal.primary : sec,
          highlight: pal.highlight,
          width: i === 0 ? 10 : 7,
          twist: Math.sin(t * 20 + i) * 11,
          isMono,
        });
      }
      ctx.restore();
      return true;
    }
    case "longhoi_c2_fox_step": {
      // Spinning fox-flame dash cloak + ember trail petals
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 20);
      for (let i = 0; i < 3; i++) {
        const a = ang + (Math.PI * 2 * i) / 3 + f * 4;
        drawSculptedBladeSlash(ctx, {
          x: 0,
          y: 0,
          radius: curR * 0.9,
          startAngle: a - 0.55,
          endAngle: a + 0.55,
          thickness: 10 * (1 - f * 0.4),
          primary: i === 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: pal.rim,
          progress: f,
          isMono,
        });
      }
      ctx.restore();
      return true;
    }
    case "longhoi_c3_nine_tails_pyre":
    case "longhoi_burn_detonate": {
      const isUlt = kind === "longhoi_c3_nine_tails_pyre";
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 20);
      drawStructuralExplosion(ctx, { x: 0, y: 0, radius: curR, progress: f, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "ember", isMono });
      const petals = isUlt ? 9 : 5;
      for (let i = 0; i < petals; i++) {
        const a = (Math.PI * 2 * i) / petals + f * 1.4;
        drawViscousDroplet(ctx, { x: Math.cos(a) * curR * 0.78, y: Math.sin(a) * curR * 0.56, angle: a, length: 18 * (1 - f * 0.4), width: 7 * (1 - f * 0.4), primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 7. ĐỨC CÔNG (TINH TÚ PHÁP SƯ)
    // -----------------------------------------------------------------------
    case "duccong_c1_orb_launch": {
      // Cosmic orbital propulsion ring
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 18);
      drawSegmentedArcs(ctx, 0, 0, curR, 3, 0.35, ang + f * 4.5, pal.primary, 3.2, 0.62);
      drawStarFlare(ctx, Math.cos(ang) * curR * 0.55, Math.sin(ang) * curR * 0.34, 15, 4, 4, ang, pal.highlight, sec, 1.4);
      ctx.restore();
      return true;
    }
    case "duccong_c1_orb_nova":
    case "duccong_c2_singularity":
    case "duccong_c3_galaxy_collapse": {
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 22);
      const isGalaxy = kind === "duccong_c3_galaxy_collapse";
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.58, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      drawSegmentedArcs(ctx, 0, 0, curR * 0.96, isGalaxy ? 6 : 4, 0.25, t * 5, pal.primary, 3.4, 0.58);
      drawSegmentedArcs(ctx, 0, 0, curR * 0.65, 3, 0.35, -t * 6.5, sec, 2.4, 0.58);
      // Black hole event horizon core
      ctx.beginPath();
      ctx.ellipse(0, 0, safeR(curR * 0.22, 4), safeR(curR * 0.13, 2.5), 0, 0, Math.PI * 2);
      ctx.fillStyle = isMono ? "#000000" : "#090418";
      ctx.fill();
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
      return true;
    }
    case "duccong_pad_warp": {
      drawEnergyVortexPillar(ctx, { x: 0, y: 0, radius: maxR * 0.55, height: 140, progress: f, phase: t * 8, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "crystal", isMono });
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 8. GẤU (CUỒNG CHIẾN KHUYỂN / BRAWLER)
    // -----------------------------------------------------------------------
    case "gau_punch":
    case "gau_c1_seismic_slap": {
      // Heavy gauntlet shock-knuckle pressure wave + faceted granite rubble
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 18);
      drawSculptedBladeSlash(ctx, {
        x: 0,
        y: 0,
        radius: curR,
        startAngle: ang - 0.72,
        endAngle: ang + 0.72,
        thickness: 22 * (1 - f * 0.35),
        primary: pal.primary,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: sec,
        progress: f,
        isMono,
      });
      for (let i = -2; i <= 2; i++) {
        const a = ang + i * 0.24;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.92, y: Math.sin(a) * curR * 0.92, size: 10 * (1 - f * 0.35), rot: a + f * 4, shape: "rock", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }
    case "gau_c2_counter_guard": {
      // Thiết Bích iron-gold octagonal shield barrier
      const curR = safeR(maxR * (0.5 + 0.5 * easeOut), 22);
      ctx.save();
      ctx.scale(1, 0.76);
      drawPolygonRing(ctx, 0, 0, curR, 8, f * 0.7, pal.primary, 4.0, colorWithAlpha(pal.shadow, 0.28));
      drawPolygonRing(ctx, 0, 0, curR * 0.78, 8, -f * 0.9, sec, 2.2);
      ctx.restore();
      ctx.restore();
      return true;
    }
    case "gau_shockring":
    case "gau_c3_quake_crater":
    case "gau_rage_eruption": {
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 24);
      drawImpactCraterDecal(ctx, { x: 0, y: 0, radius: curR * 0.95, alpha: clamp(fade * 1.1, 0, 1), tiltY: 0.7, seed: x * 0.1 + y * 0.2, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "rock", isMono });
      drawSegmentedArcs(ctx, 0, 0, curR, 6, 0.24, f * 2.5, pal.primary, 4.4, 0.7);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 9. BẢO (ÁM ẢNH SÁT THỦ)
    // -----------------------------------------------------------------------
    case "bao_slash":
    case "bao_c1_shadow_crescent": {
      // Double asymmetric violet shadow-dagger crescent + smoke wisps
      const curR = safeR(maxR * (0.34 + 0.66 * easeOut), 18);
      drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR, startAngle: ang - 1.05, endAngle: ang + 1.05, thickness: 14 * (1 - f * 0.35), primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, progress: f, isMono });
      drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR * 0.75, startAngle: ang + 0.85, endAngle: ang - 0.85, thickness: 7.5 * (1 - f * 0.4), primary: sec, highlight: pal.highlight, shadow: pal.shadow, rim: pal.rim, progress: f, isMono });
      ctx.restore();
      return true;
    }
    case "bao_c2_smoke_vanish": {
      // Volumetric purple smoke bomb cloud + shadow dagger decoy burst
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 22);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + f * 1.2;
        drawVolumetricSmokeLobe(ctx, { x: Math.cos(a) * curR * 0.55, y: Math.sin(a) * curR * 0.42, radius: curR * 0.32 * (1 - f * 0.25), primary: pal.primary, shadow: pal.shadow, highlight: pal.rim, isMono });
      }
      drawStarFlare(ctx, 0, 0, curR * 0.55, 6, 4, f * 3, pal.highlight, pal.primary, 1.5);
      ctx.restore();
      return true;
    }
    case "bao_c3_clone_lattice":
    case "bao_mark_shatter": {
      // Crossed assassin mark detonation + 4-way shadow lattice
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 24);
      for (let i = 0; i < 4; i++) {
        const a = ang + (Math.PI * 0.5 * i) + Math.PI * 0.25;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-curR * 0.9, 0);
        ctx.lineTo(0, -8 * (1 - f * 0.45));
        ctx.lineTo(curR * 0.9, 0);
        ctx.lineTo(0, 8 * (1 - f * 0.45));
        ctx.closePath();
        ctx.fillStyle = pal.highlight;
        ctx.fill();
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.restore();
      }
      drawSegmentedArcs(ctx, 0, 0, curR * 0.85, 4, 0.45, -t * 5, sec, 2.8, 0.72);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 10. DANH (HỎA LONG ĐẠI KIẾM)
    // -----------------------------------------------------------------------
    case "danh_kiem_khi_slash": {
      // Heavy Greatsword Phá Sơn Flame Cleave + Dragon Fang Edge
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 22);
      drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR, startAngle: ang - 1.25, endAngle: ang + 1.25, thickness: 22 * (1 - f * 0.35), primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, progress: f, isMono });
      for (let i = -2; i <= 2; i++) {
        const a = ang + i * 0.35;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.96, y: Math.sin(a) * curR * 0.96, size: 10.5 * (1 - f * 0.4), rot: a, shape: "ember", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }
    case "danh_c2_dragon_launch":
    case "danh_firebreath": {
      // Forward roaring dragon jaw flame wave cone
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 24);
      ctx.save();
      ctx.rotate(ang);
      for (let i = -2; i <= 2; i++) {
        drawWindStreamRibbon(ctx, { x1: 8, y1: i * 6, x2: curR, y2: i * 24, color: i % 2 === 0 ? pal.primary : sec, highlight: pal.highlight, width: (i === 0 ? 13 : 8) * (1 - f * 0.35), twist: Math.sin(t * 20 + i) * 10, isMono });
      }
      ctx.restore();
      ctx.restore();
      return true;
    }
    case "danh_dragon_shockring":
    case "danh_c3_dragon_nova":
    case "danh_sky_dragon_impact": {
      const curR = safeR(maxR * (0.4 + 0.6 * easeOut), 30);
      drawStructuralExplosion(ctx, { x: 0, y: 0, radius: curR, progress: f, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "ember", isMono });
      drawSegmentedArcs(ctx, 0, 0, curR * 1.05, 5, 0.28, f * 3.5, sec, 3.8, 0.7);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 11. LUÂN (HƯ KHÔNG PHẢN CHIẾU)
    // -----------------------------------------------------------------------
    case "luan_c1_rift_fan": {
      // 5-prism glass-void mirror fan
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 20);
      for (let i = -2; i <= 2; i++) {
        const a = ang + i * 0.24;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(curR * 0.55, -7);
        ctx.lineTo(curR, 0);
        ctx.lineTo(curR * 0.55, 7);
        ctx.closePath();
        ctx.fillStyle = colorWithAlpha(i === 0 ? sec : pal.primary, 0.55);
        ctx.fill();
        ctx.strokeStyle = pal.highlight;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      return true;
    }
    case "luan_portal_wave":
    case "luan_c3_prism_fracture": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 22);
      ctx.save();
      ctx.scale(1, 0.72);
      drawPolygonRing(ctx, 0, 0, curR, 3, ang + f * 2.2, pal.primary, 3.4, colorWithAlpha(pal.shadow, 0.28));
      drawPolygonRing(ctx, 0, 0, curR * 0.82, 3, ang - f * 2.2 + Math.PI, sec, 2.4);
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + f * 1.5;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR, y: Math.sin(a) * curR * 0.72, size: 11 * (1 - f * 0.35), rot: a + t * 4, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 12. TÀI DỰ (KỸ SƯ CƠ KHÍ / DRONE)
    // -----------------------------------------------------------------------
    case "taidu_hex_blast":
    case "taidu_c2_emp_salvo":
    case "taidu_c3_orbital_lock": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 20);
      ctx.save();
      ctx.scale(1, 0.72);
      drawPolygonRing(ctx, 0, 0, curR, 6, f * 1.5, pal.primary, 3.2, colorWithAlpha(pal.shadow, 0.24));
      drawPolygonRing(ctx, 0, 0, curR * 0.62, 6, -f * 2.0, sec, 2.0);
      ctx.restore();
      if (kind === "taidu_c3_orbital_lock") {
        drawEnergyVortexPillar(ctx, { x: 0, y: 0, radius: curR * 0.42, height: 220, progress: f, phase: t * 9, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "shard", isMono });
      } else {
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 0.5 * i) + f * 3;
          drawBranchingArc(ctx, { x1: 0, y1: 0, x2: Math.cos(a) * curR * 0.9, y2: Math.sin(a) * curR * 0.65, color: i % 2 === 0 ? pal.primary : sec, coreColor: pal.highlight, width: 2.2, seed: i * 11 + x, jaggedness: 9, isMono });
        }
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 13. NGUYÊN (THÁNH ÂN / SINH MỆNH)
    // -----------------------------------------------------------------------
    case "nguyen_wave":
    case "nguyen_c2_lotus_ward":
    case "nguyen_lotus_boom":
    case "nguyen_c3_sanctuary_bloom": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 22);
      const petals = kind === "nguyen_c3_sanctuary_bloom" ? 8 : 6;
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.7, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      for (let i = 0; i < petals; i++) {
        const a = (Math.PI * 2 * i) / petals + f * 0.9;
        drawViscousDroplet(ctx, { x: Math.cos(a) * curR * 0.74, y: Math.sin(a) * curR * 0.52, angle: a, length: curR * 0.42, width: curR * 0.14, primary: i % 2 === 0 ? pal.primary : sec, highlight: pal.highlight, shadow: pal.shadow, isMono });
      }
      drawSegmentedArcs(ctx, 0, 0, curR * 0.98, 4, 0.25, -t * 3, pal.highlight, 2.6, 0.7);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 14. DUY (NHẪN GIẢ THẾ THÂN)
    // -----------------------------------------------------------------------
    case "duy_c1_substitute_seal": {
      // Shinobi log-substitute smoke + fluttering sealing talismans
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 20);
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 + f * 1.6;
        drawVolumetricSmokeLobe(ctx, { x: Math.cos(a) * curR * 0.48, y: Math.sin(a) * curR * 0.36, radius: curR * 0.28 * (1 - f * 0.3), primary: pal.rim, shadow: pal.shadow, highlight: pal.highlight, isMono });
        ctx.save();
        ctx.translate(Math.cos(a) * curR * 0.85, Math.sin(a) * curR * 0.6);
        ctx.rotate(a + f * 4);
        ctx.fillStyle = sec;
        ctx.fillRect(-4, -9, 8, 18);
        ctx.strokeStyle = pal.highlight;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-4, -9, 8, 18);
        ctx.restore();
      }
      ctx.restore();
      return true;
    }
    case "duy_c2_shuriken_fan":
    case "duy_c3_cyclone_storm": {
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 20);
      const blades = kind === "duy_c3_cyclone_storm" ? 6 : 4;
      drawSegmentedArcs(ctx, 0, 0, curR, blades, 0.32, t * 8, pal.primary, 3.0, 0.72);
      for (let i = 0; i < blades; i++) {
        const a = (Math.PI * 2 * i) / blades + t * 9;
        drawStarFlare(ctx, Math.cos(a) * curR * 0.85, Math.sin(a) * curR * 0.62, 13 * (1 - f * 0.35), 4, 4, a + t * 12, i % 2 === 0 ? pal.primary : sec, pal.highlight, 1.4);
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 15. PHONG (TỬ THẦN SONG ĐAO)
    // -----------------------------------------------------------------------
    case "phong_c1_shadow_slash": {
      // Twin crimson-cyan death-scythe dash arcs
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 18);
      drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR, startAngle: ang - 1.1, endAngle: ang + 1.1, thickness: 15 * (1 - f * 0.35), primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, progress: f, isMono });
      drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR * 0.78, startAngle: ang + 0.9, endAngle: ang - 0.9, thickness: 9 * (1 - f * 0.4), primary: sec, highlight: pal.highlight, shadow: pal.shadow, rim: pal.rim, progress: f, isMono });
      ctx.restore();
      return true;
    }
    case "phong_swap_burst":
    case "phong_c3_mark":
    case "phong_c3_death_ring": {
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 22);
      for (let i = -1; i <= 1; i += 2) {
        drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR, startAngle: ang + i * 1.1 - 0.8, endAngle: ang + i * 1.1 + 0.8, thickness: 14 * (1 - f * 0.35), primary: i < 0 ? pal.primary : sec, highlight: pal.highlight, shadow: pal.shadow, rim: pal.rim, progress: f, isMono });
      }
      drawStarFlare(ctx, 0, 0, curR * 0.48, 5, 4, ang + f * 2, sec, pal.highlight, 1.5);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 16. ĐĂNG (BẠCH HỔ / HẮC HỔ)
    // -----------------------------------------------------------------------
    case "dang_punch":
    case "dang_c1_tiger_roar": {
      // Triple claw-mark tiger crescent strike
      const curR = safeR(maxR * (0.34 + 0.66 * easeOut), 20);
      for (let c = -1; c <= 1; c++) {
        drawSculptedBladeSlash(ctx, {
          x: Math.cos(ang + Math.PI * 0.5) * c * 14,
          y: Math.sin(ang + Math.PI * 0.5) * c * 14,
          radius: curR * (c === 0 ? 1.05 : 0.88),
          startAngle: ang - 0.78,
          endAngle: ang + 0.78,
          thickness: (c === 0 ? 13 : 8.5) * (1 - f * 0.35),
          primary: c === 0 ? pal.primary : sec,
          highlight: pal.highlight,
          shadow: pal.shadow,
          rim: sec,
          progress: f,
          isMono,
        });
      }
      ctx.restore();
      return true;
    }
    case "dang_black_shield_boom":
    case "dang_c3_frenzy_sigil": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 24);
      const isBlack = kind === "dang_black_shield_boom";
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.7, primary: isBlack ? "#1E293B" : pal.primary, highlight: pal.highlight, shadow: "#020617", rim: sec, pulse: 1 - f, isMono });
      drawSegmentedArcs(ctx, 0, 0, curR, 3, 0.38, ang + f * 3.5, sec, 4.2, 0.7);
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 * i) / 3 + f * 2;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.86, y: Math.sin(a) * curR * 0.6, size: 13 * (1 - f * 0.35), rot: a + Math.PI * 0.5, shape: "shard", primary: isBlack ? "#0F172A" : pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 17. THIÊN (THIÊN KIẾM / THỜI KHÔNG)
    // -----------------------------------------------------------------------
    case "thien_c1_sword_halo":
    case "thien_ascend_halo":
    case "thien_god_halo": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 22);
      const count = kind === "thien_c1_sword_halo" ? 6 : 8;
      drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR, rot: t * 3, sides: count, star: true, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.82, isMono });
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + f * 1.4;
        ctx.save();
        ctx.translate(Math.cos(a) * curR * 0.9, Math.sin(a) * curR * 0.65);
        ctx.rotate(a + Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(4, 2);
        ctx.lineTo(0, 8);
        ctx.lineTo(-4, 2);
        ctx.closePath();
        ctx.fillStyle = pal.highlight;
        ctx.fill();
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      return true;
    }
    case "thien_c2_time_dome":
    case "thien_c2_time_shatter": {
      // Clockwork time-reversal dome & glass fracture
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 26);
      drawSegmentedArcs(ctx, 0, 0, curR, 12, 0.16, -t * 2.5, pal.primary, 2.8, 0.72);
      drawPolygonRing(ctx, 0, 0, curR * 0.74, 4, t * 2, sec, 2.0);
      // Clock hands
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(-t * 4) * curR * 0.68, Math.sin(-t * 4) * curR * 0.48);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(-t * 1.2) * curR * 0.45, Math.sin(-t * 1.2) * curR * 0.32);
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
      return true;
    }
    case "thien_c3_gate_arrival":
    case "thien_c3_gate_return":
    case "thien_c4_solar_judgement": {
      const curR = safeR(maxR * (0.4 + 0.6 * easeOut), 28);
      drawEnergyVortexPillar(ctx, { x: 0, y: 0, radius: curR * 0.42, height: kind === "thien_c4_solar_judgement" ? 260 : 185, progress: f, phase: t * 7, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "crystal", isMono });
      drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR, rot: -t * 3, sides: 6, star: true, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.85, isMono });
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 18. THANH (XÀ VƯƠNG)
    // -----------------------------------------------------------------------
    case "thanh_snake_fan": {
      // Triple sinusoidal venom-serpent launch ribbons
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 20);
      for (let i = -1; i <= 1; i++) {
        const a = ang + i * 0.28;
        drawWindStreamRibbon(ctx, { x1: 6, y1: 0, x2: Math.cos(a) * curR, y2: Math.sin(a) * curR, color: i === 0 ? pal.primary : sec, highlight: pal.highlight, width: i === 0 ? 10 : 7, twist: Math.sin(t * 18 + i * 2) * 14, isMono });
      }
      ctx.restore();
      return true;
    }
    case "thanh_devour_bite":
    case "thanh_shield_pulse": {
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 24);
      drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.7, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
      for (let side = -1; side <= 1; side += 2) {
        drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR * 0.92, startAngle: ang + side * 0.4 - 0.8, endAngle: ang + side * 0.4 + 0.8, thickness: 13 * (1 - f * 0.35), primary: side < 0 ? pal.primary : sec, highlight: pal.highlight, shadow: pal.shadow, rim: pal.rim, progress: f, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 19. NHI (ĐỘC NỎ / GIẢ KIM)
    // -----------------------------------------------------------------------
    case "nhi_c1_revolver_snap":
    case "nhi_c2_flask_scatter":
    case "nhi_c3_hunt_lock":
    case "nhi_mist_pulse": {
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 20);
      if (kind === "nhi_c1_revolver_snap") {
        // Ammo-revolver chamber snap + 3 toxic bolt wakes
        drawSegmentedArcs(ctx, 0, 0, curR * 0.55, 3, 0.4, ang + f * 4, pal.primary, 3.0);
        for (let i = -1; i <= 1; i++) {
          const a = ang + i * 0.2;
          drawWindStreamRibbon(ctx, { x1: 8, y1: 0, x2: Math.cos(a) * curR, y2: Math.sin(a) * curR, color: i === 0 ? sec : pal.primary, highlight: pal.highlight, width: 6, twist: i * 8, isMono });
        }
      } else {
        drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.7, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i) / 6 + f * 1.5;
          drawViscousDroplet(ctx, { x: Math.cos(a) * curR * 0.75, y: Math.sin(a) * curR * 0.54, angle: a, length: 14 * (1 - f * 0.3), width: 6.5, primary: i % 2 === 0 ? pal.primary : sec, highlight: pal.highlight, shadow: pal.shadow, isMono });
        }
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 20. MINH (THIÊN LAO SCEPTER)
    // -----------------------------------------------------------------------
    case "minh_chain_rect": {
      // Golden celestial chain corridor with interlocking diamond links
      const len = safeR(h.length || maxR, 180);
      const hw = safeR(h.halfWidth || 44, 24);
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = colorWithAlpha(pal.shadow, 0.34);
      ctx.fillRect(0, -hw, len, hw * 2);
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 2.8;
      ctx.strokeRect(0, -hw, len, hw * 2);
      const links = 5;
      for (let i = 0; i < links; i++) {
        const lx = ((i + 0.5) / links) * len;
        drawPolygonRing(ctx, lx, 0, hw * 0.48, 4, f * 2 + i * 0.5, i % 2 === 0 ? pal.primary : sec, 2.2);
      }
      ctx.restore();
      ctx.restore();
      return true;
    }
    case "minh_c2_banishment_seal":
    case "minh_c3_celestial_jail": {
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 26);
      drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR, rot: t * 2.4, sides: 8, star: true, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.85, isMono });
      drawSegmentedArcs(ctx, 0, 0, curR * 1.06, 4, 0.3, -t * 3.5, sec, 3.6, 0.7);
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 21. ĐỨC ANH (THIẾT CẦU / LĂN BÚA)
    // -----------------------------------------------------------------------
    case "ducanh_c1_ignition_wheel":
    case "ducanh_c2_anvil_bastion":
    case "ducanh_c3_meteor_slam":
    case "ducanh_passive_iron_shell": {
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 22);
      if (kind === "ducanh_c3_meteor_slam") {
        drawImpactCraterDecal(ctx, { x: 0, y: 0, radius: curR, alpha: clamp(fade * 1.1, 0, 1), tiltY: 0.72, seed: x * 0.2 + y, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "rock", isMono });
      }
      ctx.save();
      ctx.scale(1, 0.72);
      drawPolygonRing(ctx, 0, 0, curR, 8, t * 4.5, pal.primary, 4.0, colorWithAlpha(pal.shadow, 0.26));
      drawPolygonRing(ctx, 0, 0, curR * 0.7, 6, -t * 3.5, sec, 2.4);
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + f * 2;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.9, y: Math.sin(a) * curR * 0.65, size: 11 * (1 - f * 0.35), rot: a + f * 3, shape: "rock", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 22. BÁCH (PHONG ẢNH SONG ĐAO)
    // -----------------------------------------------------------------------
    case "bach_cross_slash":
    case "bach_c1_wind_terminus":
    case "bach_c2_fan_recoil":
    case "bach_c3_phantom_matrix": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 22);
      const crossCount = kind === "bach_c3_phantom_matrix" ? 4 : 2;
      for (let i = 0; i < crossCount; i++) {
        const a = ang + (Math.PI / crossCount) * i + 0.52;
        drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR, startAngle: a - 0.85, endAngle: a + 0.85, thickness: 12 * (1 - f * 0.35), primary: i % 2 === 0 ? pal.primary : sec, highlight: pal.highlight, shadow: pal.shadow, rim: pal.rim, progress: f, isMono });
      }
      drawWindStreamRibbon(ctx, { x1: Math.cos(ang + Math.PI) * curR * 0.5, y1: Math.sin(ang + Math.PI) * curR * 0.5, x2: Math.cos(ang) * curR * 0.95, y2: Math.sin(ang) * curR * 0.95, color: sec, highlight: pal.highlight, width: 5.5, twist: 12, isMono });
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 23. THÁI (ĐẤU SĨ BÁ CHỦ)
    // -----------------------------------------------------------------------
    case "thai_arena_cleave":
    case "thai_cyclone_ring":
    case "thai_c3_colosseum_brand": {
      const curR = safeR(maxR * (0.36 + 0.64 * easeOut), 24);
      if (kind === "thai_arena_cleave") {
        drawSculptedBladeSlash(ctx, { x: 0, y: 0, radius: curR, startAngle: ang - 1.35, endAngle: ang + 1.35, thickness: 20 * (1 - f * 0.35), primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, progress: f, isMono });
      } else {
        drawPerspectiveZoneBase(ctx, { x: 0, y: 0, radius: curR, tiltY: 0.72, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, pulse: 1 - f, isMono });
        drawSegmentedArcs(ctx, 0, 0, curR, 8, 0.22, t * 4, pal.primary, 4.0, 0.72);
        drawSegmentedArcs(ctx, 0, 0, curR * 0.72, 4, 0.35, -t * 5, sec, 2.8, 0.72);
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 24. KHAIR (XẠ THỦ BẮN TỈA)
    // -----------------------------------------------------------------------
    case "khair_c1_beacon_deploy":
    case "khair_sniper_muzzle":
    case "khair_recoil_blast": {
      const curR = safeR(maxR * (0.35 + 0.65 * easeOut), 18);
      if (kind === "khair_c1_beacon_deploy") {
        drawArcaneMagicCircle(ctx, { x: 0, y: 0, radius: curR, rot: t * 2.5, sides: 6, star: false, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, alpha: 0.8, isMono });
      } else {
        // Supersonic emerald railgun muzzle cone + shock rings
        ctx.save();
        ctx.rotate(ang);
        for (let r = 0; r < 3; r++) {
          const rx = (r + 1) * curR * 0.34;
          const ry = (r + 1) * 14 * (1 - f * 0.3);
          ctx.beginPath();
          ctx.ellipse(rx, 0, Math.max(2.5, ry * 0.34), Math.max(4, ry), 0, 0, Math.PI * 2);
          ctx.strokeStyle = r === 0 ? pal.highlight : pal.primary;
          ctx.lineWidth = 2.6 - r * 0.5;
          ctx.stroke();
        }
        drawWindStreamRibbon(ctx, { x1: -12, y1: 0, x2: curR * 1.25, y2: 0, color: sec, highlight: pal.highlight, width: 7 * (1 - f * 0.35), twist: 4, isMono });
        ctx.restore();
      }
      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // SHARED SYSTEM UTILITIES (Non-hero item/levelup)
    // -----------------------------------------------------------------------
    case "shield_burst":
    case "levelup_halo": {
      const curR = safeR(maxR * (0.38 + 0.62 * easeOut), 20);
      drawSegmentedArcs(ctx, 0, 0, curR, 6, 0.28, t * 4, pal.primary, 3.2, 0.72);
      drawStarFlare(ctx, 0, 0, curR * 0.45, 5, 4, t * 3, pal.highlight, sec, 1.4);
      ctx.restore();
      return true;
    }

    default:
      ctx.restore();
      return false;
  }
}

// ============================================================================
// STAGE 3A: BESPOKE PER-HERO IMPACT SIGNATURES (Inside drawImpactBurst)
// ============================================================================
export function drawHeroImpactSignature(ctx, b, f, isMono = false) {
  if (!b || !b.heroId) return false;
  const prof = HERO_SKILL_VFX_PROFILES[b.heroId];
  if (!prof) return false;

  const pal = resolvePalette(b.color || prof.primary, prof.highlight, prof.shadow, prof.rim, isMono);
  const sec = isMono ? "#E2E8F0" : prof.secondary;
  const maxR = safeR(b.maxRadius, 36);
  const curR = safeR(maxR * (0.28 + 0.72 * Math.sin(clamp(f, 0, 1) * Math.PI * 0.5)), 8);
  const fade = clamp(1 - f, 0, 1);
  const ang = safeNum(b.angle, 0);
  const skillIdx = Number(b.skillIdx || 0);
  const scale = skillIdx === 3 || skillIdx === 4 ? 1.25 : skillIdx === 2 ? 1.12 : 1.0;

  ctx.save();
  ctx.globalAlpha *= clamp(fade * 1.15, 0, 1);

  switch (prof.element) {
    case "lightning":
    case "mecha_emp": {
      for (let i = 0; i < 3; i++) {
        const a = ang + (i - 1) * 1.45 + f * 0.8;
        drawBranchingArc(ctx, { x1: 0, y1: 0, x2: Math.cos(a) * curR * scale, y2: Math.sin(a) * curR * scale, color: i === 0 ? pal.primary : sec, coreColor: pal.highlight, width: 2.3, seed: (b.x || 0) + i * 17, jaggedness: 9, isMono });
      }
      drawPolygonRing(ctx, 0, 0, curR * 0.52 * scale, 6, ang, pal.highlight, 1.6);
      break;
    }
    case "frost":
    case "void_prism":
    case "blood_rift": {
      const count = 4;
      for (let i = 0; i < count; i++) {
        const a = ang + (Math.PI * 0.5 * i) + 0.4;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.72 * scale, y: Math.sin(a) * curR * 0.72 * scale, size: 7.5 * scale * (1 - f * 0.4), rot: a + Math.PI * 0.5, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      drawStarFlare(ctx, 0, 0, curR * 0.65 * scale, 3, 4, ang + Math.PI * 0.25, pal.highlight, pal.primary, 1.3);
      break;
    }
    case "fox_fire":
    case "dragon_fire": {
      for (let i = 0; i < 5; i++) {
        const a = ang + (Math.PI * 2 * i) / 5 + f * 0.9;
        drawViscousDroplet(ctx, { x: Math.cos(a) * curR * 0.65 * scale, y: Math.sin(a) * curR * 0.65 * scale, angle: a, length: 12 * scale * (1 - f * 0.4), width: 5.5, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, isMono });
      }
      break;
    }
    case "iron_quake":
    case "molten_anvil":
    case "gladiator_gold":
    case "tiger_steel": {
      for (let i = 0; i < 5; i++) {
        const a = ang + (i - 2) * 0.65;
        drawFacetedShard(ctx, { x: Math.cos(a) * curR * 0.8 * scale, y: Math.sin(a) * curR * 0.8 * scale, size: 8.5 * scale * (1 - f * 0.35), rot: a + f * 5, shape: "rock", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      drawSegmentedArcs(ctx, 0, 0, curR * 0.85 * scale, 4, 0.35, ang, sec, 2.8);
      break;
    }
    case "gale":
    case "wind_phantom":
    case "reaper_dual":
    case "shadow_blade":
    case "shinobi_decoy": {
      for (let i = -1; i <= 1; i += 2) {
        ctx.save();
        ctx.rotate(ang + i * 0.68);
        ctx.beginPath();
        ctx.moveTo(-curR * 0.9 * scale, 0);
        ctx.lineTo(0, -4.5 * (1 - f * 0.45));
        ctx.lineTo(curR * 0.9 * scale, 0);
        ctx.lineTo(0, 4.5 * (1 - f * 0.45));
        ctx.closePath();
        ctx.fillStyle = pal.highlight;
        ctx.fill();
        ctx.strokeStyle = i < 0 ? pal.primary : sec;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case "abyss_serpent":
    case "alchemy_toxin":
    case "sanctuary_flora": {
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 + f * 1.2;
        drawViscousDroplet(ctx, { x: Math.cos(a) * curR * 0.72 * scale, y: Math.sin(a) * curR * 0.72 * scale, angle: a, length: 10 * scale, width: 5, primary: i % 2 === 0 ? pal.primary : sec, highlight: pal.highlight, shadow: pal.shadow, isMono });
      }
      break;
    }
    default: {
      // cosmos, arcane_meteor, chrono_sword, celestial_chain, emerald_rail
      drawStarFlare(ctx, 0, 0, curR * 0.85 * scale, curR * 0.2 * scale, 4, ang + f, pal.highlight, pal.primary, 1.5);
      drawSegmentedArcs(ctx, 0, 0, curR * 0.75 * scale, 3, 0.4, ang - f * 2, sec, 2.2);
      break;
    }
  }

  ctx.restore();
  return true;
}

// ============================================================================
// STAGE 3B: TARGET HIT REACTION OVERLAY ON STRUCK ENEMY
// ============================================================================
export function drawEnemyHitReaction(ctx, react, elapsedTime, isMono = false) {
  if (!react) return;
  const maxLife = Math.max(0.06, safeNum(react.maxLife, 0.24));
  const f = clamp(safeNum(react.life, 0) / maxLife, 0, 1);
  if (f >= 1) return;

  const prof = HERO_SKILL_VFX_PROFILES[react.heroId] || HERO_SKILL_VFX_PROFILES.eohyen;
  const pal = resolvePalette(react.color || prof.primary, prof.highlight, prof.shadow, prof.rim, isMono);
  const sec = isMono ? "#E2E8F0" : prof.secondary;
  const x = safeCoord(react.x, 0);
  const y = safeCoord(react.y, 0);
  const rad = safeR(react.radius, 18);
  const ang = safeNum(react.angle, 0);
  const fade = clamp(1 - f, 0, 1);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= fade * 0.92;

  switch (prof.element) {
    case "frost":
      drawPolygonRing(ctx, 0, 0, rad * (0.95 + f * 0.32), 6, ang + f * 0.8, pal.highlight, 2.1);
      drawFacetedShard(ctx, { x: Math.cos(ang) * rad * 0.7, y: Math.sin(ang) * rad * 0.7, size: 8 * fade, rot: ang, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      break;
    case "lightning":
    case "mecha_emp":
      drawBranchingArc(ctx, { x1: -rad * 0.85, y1: -rad * 0.4, x2: rad * 0.85, y2: rad * 0.4, color: pal.primary, coreColor: pal.highlight, width: 2.4, seed: elapsedTime * 30 + x, jaggedness: 9, isMono });
      break;
    case "fox_fire":
    case "dragon_fire":
    case "molten_anvil":
      drawVolumetricSmokeLobe(ctx, { x: Math.cos(ang) * 4, y: -rad * 0.4 - f * 12, radius: rad * 0.45 * fade, primary: pal.primary, shadow: pal.shadow, highlight: pal.highlight, isMono });
      drawStarFlare(ctx, 0, -4, rad * 0.7 * fade, 3, 4, ang, pal.highlight, pal.primary, 1.3);
      break;
    case "alchemy_toxin":
    case "abyss_serpent":
      for (let i = 0; i < 3; i++) {
        const a = ang + (i - 1) * 0.9;
        drawViscousDroplet(ctx, { x: Math.cos(a) * rad * (0.65 + f * 0.4), y: Math.sin(a) * rad * (0.65 + f * 0.4), angle: a, length: 9 * fade, width: 4.5, primary: i === 1 ? sec : pal.primary, highlight: pal.highlight, shadow: pal.shadow, isMono });
      }
      break;
    default:
      // Directional kinetic recoil cut / shock flare
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(-rad * 1.15, 0);
      ctx.lineTo(0, -3.5 * fade);
      ctx.lineTo(rad * 1.15, 0);
      ctx.lineTo(0, 3.5 * fade);
      ctx.closePath();
      ctx.fillStyle = pal.highlight;
      ctx.fill();
      ctx.strokeStyle = pal.primary;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      break;
  }

  ctx.restore();
}

// ============================================================================
// STAGE 4: PERSISTENT GROUND AFTERMATH DECALS (heroSkillDecals)
// ============================================================================
export function drawHeroGroundDecal(ctx, d, elapsedTime, isMono = false) {
  if (!d) return;
  const maxLife = Math.max(0.25, safeNum(d.maxLife, 2.4));
  const f = clamp(safeNum(d.life, 0) / maxLife, 0, 1);
  if (f >= 1) return;

  const prof = HERO_SKILL_VFX_PROFILES[d.heroId] || HERO_SKILL_VFX_PROFILES.eohyen;
  const pal = resolvePalette(d.color || prof.primary, prof.highlight, prof.shadow, d.secondaryColor || prof.rim, isMono);
  const sec = isMono ? "#E2E8F0" : (d.secondaryColor || prof.secondary);
  const x = safeCoord(d.x, 0);
  const y = safeCoord(d.y, 0);
  const rad = safeR(d.radius, 44);
  const ang = safeNum(d.angle, 0);
  const alpha = (f < 0.1 ? f / 0.1 : clamp(1 - (f - 0.1) / 0.9, 0, 1)) * clamp(safeNum(d.alpha, 0.78), 0.1, 1);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;

  switch (d.motif || prof.element) {
    case "molten_tread":
    case "molten_anvil":
    case "iron_quake":
    case "gladiator_gold": {
      ctx.save();
      ctx.rotate(ang);
      ctx.scale(1, 0.72);
      ctx.fillStyle = isMono ? "rgba(15,23,42,0.48)" : "rgba(18, 8, 4, 0.52)";
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 0.9, rad * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colorWithAlpha(pal.primary, 0.78);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-rad * 0.65, -rad * 0.18);
      ctx.lineTo(rad * 0.65, -rad * 0.18);
      ctx.moveTo(-rad * 0.65, rad * 0.18);
      ctx.lineTo(rad * 0.65, rad * 0.18);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "frost": {
      ctx.save();
      ctx.scale(1, 0.68);
      drawPolygonRing(ctx, 0, 0, rad * 0.9, 6, ang, colorWithAlpha(pal.primary, 0.65), 2.2, colorWithAlpha(pal.shadow, 0.34));
      for (let i = 0; i < 6; i++) {
        const a = ang + (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * rad * 0.88, Math.sin(a) * rad * 0.88);
        ctx.strokeStyle = colorWithAlpha(pal.highlight, 0.55);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "fox_fire":
    case "dragon_fire":
    case "arcane_meteor": {
      drawImpactCraterDecal(ctx, { x: 0, y: 0, radius: rad, alpha: alpha * 0.85, tiltY: 0.68, seed: d.seed || x, primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, debrisShape: "ember", isMono });
      break;
    }
    case "lightning":
    case "mecha_emp":
    case "emerald_rail": {
      ctx.save();
      ctx.scale(1, 0.68);
      ctx.fillStyle = "rgba(4, 9, 20, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.82, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const a = ang + (Math.PI * 0.5 * i) + 0.3;
        drawBranchingArc(ctx, { x1: 0, y1: 0, x2: Math.cos(a) * rad * 0.9, y2: Math.sin(a) * rad * 0.9, color: i % 2 === 0 ? pal.primary : sec, coreColor: pal.highlight, width: 1.8, seed: (d.seed || 1) + i * 7, jaggedness: 7, isMono });
      }
      ctx.restore();
      break;
    }
    case "alchemy_toxin":
    case "abyss_serpent": {
      ctx.save();
      ctx.scale(1, 0.68);
      const puddle = ctx.createRadialGradient(0, 0, rad * 0.1, 0, 0, rad);
      puddle.addColorStop(0, colorWithAlpha(sec, 0.48));
      puddle.addColorStop(0.65, colorWithAlpha(pal.primary, 0.34));
      puddle.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = puddle;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "blood_rift":
    case "void_prism":
    case "shadow_blade":
    case "reaper_dual":
    case "wind_phantom":
    case "gale": {
      // Ground slash scar gouge + fading prism/gale residue
      ctx.save();
      ctx.rotate(ang);
      ctx.scale(1, 0.72);
      ctx.beginPath();
      ctx.moveTo(-rad, 0);
      ctx.lineTo(0, -6.5);
      ctx.lineTo(rad, 0);
      ctx.lineTo(0, 6.5);
      ctx.closePath();
      ctx.fillStyle = isMono ? "rgba(0,0,0,0.65)" : "rgba(6, 6, 16, 0.68)";
      ctx.fill();
      ctx.strokeStyle = colorWithAlpha(pal.primary, 0.72);
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
      break;
    }
    default: {
      // cosmos, sanctuary_flora, chrono_sword, celestial_chain, shinobi_decoy, tiger_steel
      ctx.save();
      ctx.scale(1, 0.68);
      drawPolygonRing(ctx, 0, 0, rad * 0.85, 6, ang + safeNum(elapsedTime, 0) * 0.35, colorWithAlpha(pal.primary, 0.58), 2.0, colorWithAlpha(pal.shadow, 0.22));
      drawSegmentedArcs(ctx, 0, 0, rad * 0.62, 3, 0.45, -ang, colorWithAlpha(sec, 0.55), 1.6);
      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

// ============================================================================
// STAGE 5: CAUSE-OF-DEATH ENEMY BURST & CORPSE RESIDUE
// ============================================================================
export function spawnElementalDeathBurst(engine, enemy, killerHeroId, damageElement, hitDir = 0, perf = {}) {
  if (!engine || !enemy) return;
  const resolved = resolveHeroDamageElement(killerHeroId, { element: damageElement });
  const x = safeCoord(enemy.x, 0);
  const y = safeCoord(enemy.y, 0);
  const rad = safeR(enemy.radius, 18);
  const count = perf.particlesScale ? Math.max(3, Math.round(7 * perf.particlesScale)) : 6;

  if (Array.isArray(engine.particles)) {
    for (let i = 0; i < count; i++) {
      const a = hitDir + (i - count * 0.5) * 0.45 + (Math.random() - 0.5) * 0.35;
      const spd = 70 + Math.random() * 135;
      engine.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 20,
        radius: 3 + Math.random() * 4.5,
        color: i % 2 === 0 ? resolved.primary : resolved.secondary,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        shape: resolved.debrisShape,
      });
    }
  }

  if (typeof engine.spawnSkillDecal === "function" && rad >= 14) {
    engine.spawnSkillDecal({
      x,
      y,
      radius: Math.min(54, rad * 1.45),
      angle: hitDir,
      heroId: resolved.heroId,
      motif: resolved.element,
      color: resolved.primary,
      secondaryColor: resolved.secondary,
      maxLife: 2.2,
      alpha: 0.65,
    });
  }
}

export function renderElementalCorpseOverlay(ctx, corpse, isMono = false) {
  if (!corpse || !corpse.killerHeroId) return;
  const resolved = resolveHeroDamageElement(corpse.killerHeroId, { element: corpse.damageElement });
  const pal = resolvePalette(resolved.primary, resolved.highlight, resolved.shadow, resolved.rim, isMono);
  const sec = isMono ? "#CBD5E1" : resolved.secondary;
  const f = clamp(safeNum(corpse.life, 0) / Math.max(0.5, safeNum(corpse.maxLife, 1.8)), 0, 1);
  const fade = clamp(1 - f, 0, 1);
  const rad = safeR(corpse.radius, 18);

  ctx.save();
  ctx.globalAlpha *= fade * 0.78;

  switch (resolved.deathStyle) {
    case "frost_shatter":
    case "crystal_shatter":
    case "void_fracture": {
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 0.5 * i) + (corpse.seed || 0.4);
        drawFacetedShard(ctx, { x: Math.cos(a) * rad * 0.55, y: Math.sin(a) * rad * 0.4, size: 6.5 * fade, rot: a, shape: "crystal", primary: pal.primary, highlight: pal.highlight, shadow: pal.shadow, rim: sec, isMono });
      }
      break;
    }
    case "fox_incinerate":
    case "dragon_cremate":
    case "arcane_vaporize": {
      drawVolumetricSmokeLobe(ctx, { x: 0, y: -f * 16, radius: rad * 0.48 * fade, primary: pal.primary, shadow: pal.shadow, highlight: pal.highlight, isMono });
      break;
    }
    case "electro_char":
    case "emp_overload": {
      drawBranchingArc(ctx, { x1: -rad * 0.6, y1: -4, x2: rad * 0.6, y2: 4, color: sec, coreColor: pal.highlight, width: 1.6, seed: (corpse.x || 0) + f * 10, jaggedness: 6, isMono });
      break;
    }
    case "venom_dissolve":
    case "acid_melt": {
      ctx.save();
      ctx.scale(1, 0.68);
      ctx.fillStyle = colorWithAlpha(pal.primary, 0.42);
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    default: {
      drawSegmentedArcs(ctx, 0, 0, rad * 0.72, 3, 0.55, corpse.angle || 0, colorWithAlpha(pal.primary, 0.6), 1.8, 0.68);
      break;
    }
  }

  ctx.restore();
}
