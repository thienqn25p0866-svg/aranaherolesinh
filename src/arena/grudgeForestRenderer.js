import { isCircleInViewBounds } from "./combatLogic";
import {
  GRUDGE_FOREST_WIDTH,
  GRUDGE_FOREST_HEIGHT,
  GRUDGE_FOREST_ZONES,
  GRUDGE_FOREST_INTERACTABLES,
  getGrudgeForestZoneAt,
  getActiveGrudgeForestObstacles,
  findNearestGrudgeForestInteractable,
  normalizeGrudgeForestProgress,
} from "./grudgeForestMap";

// Strictly ZERO ctx.shadowBlur usage for steady 60fps Canvas 2D performance.

export function getGrudgeForestZoneLabel(x, y, lang = "vi") {
  const z = getGrudgeForestZoneAt(x, y);
  return lang === "en" ? z.name.en : z.name.vi;
}

function getBoundsEdges(vb) {
  if (!vb) return null;
  const minX = vb.minX ?? vb.left ?? 0;
  const maxX = vb.maxX ?? vb.right ?? GRUDGE_FOREST_WIDTH;
  const minY = vb.minY ?? vb.top ?? 0;
  const maxY = vb.maxY ?? vb.bottom ?? GRUDGE_FOREST_HEIGHT;
  return { minX, maxX, minY, maxY };
}

function isRectVisible(r, vb, pad = 140) {
  const b = getBoundsEdges(vb);
  if (!b) return true;
  return (
    r.x + r.w >= b.minX - pad &&
    r.x <= b.maxX + pad &&
    r.y + r.h >= b.minY - pad &&
    r.y <= b.maxY + pad
  );
}

function hashCell(ix, iy) {
  let n = Math.imul(ix + 53, 73856093) ^ Math.imul(iy + 109, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function hashPair(a, b, salt = 0) {
  return hashCell(Math.round(a * 0.73) + salt * 31, Math.round(b * 0.79) - salt * 17);
}

// ---------------------------------------------------------------------------
// Reusable Woodland & Dark-Fantasy Illustration Primitives
// ---------------------------------------------------------------------------

function drawForestLanternPost(ctx, x, y, colorType, t, allowGlows, mono, swaySeed = 0) {
  ctx.save();
  ctx.translate(x, y);
  const flicker = 0.78 + 0.22 * Math.sin(t * 5.2 + x * 0.09 + swaySeed);
  const sway = Math.sin(t * 1.9 + swaySeed) * 1.4;

  // Ground shadow
  ctx.fillStyle = "rgba(2, 6, 12, 0.55)";
  ctx.beginPath();
  ctx.ellipse(4, 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft radial light pool on soil
  if (!mono && allowGlows) {
    const g = ctx.createRadialGradient(0, -6, 2, 0, -6, 42);
    if (colorType === "amber") {
      g.addColorStop(0, `rgba(251, 191, 36, ${0.28 * flicker})`);
      g.addColorStop(1, "rgba(251, 191, 36, 0)");
    } else if (colorType === "rose") {
      g.addColorStop(0, `rgba(244, 114, 182, ${0.28 * flicker})`);
      g.addColorStop(1, "rgba(244, 114, 182, 0)");
    } else if (colorType === "violet") {
      g.addColorStop(0, `rgba(192, 132, 252, ${0.3 * flicker})`);
      g.addColorStop(1, "rgba(192, 132, 252, 0)");
    } else {
      g.addColorStop(0, `rgba(52, 211, 153, ${0.28 * flicker})`);
      g.addColorStop(1, "rgba(52, 211, 153, 0)");
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -6, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mossy stone base + crooked iron-wood post
  ctx.fillStyle = mono ? "#475569" : "#28323B";
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = mono ? "#94A3B8" : "#3E2C22";
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(-3, -9, 2, -22);
  ctx.lineTo(10, -24);
  ctx.stroke();

  // Ivy wrap
  ctx.strokeStyle = mono ? "#64748B" : "#15803D";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2, 2);
  ctx.quadraticCurveTo(3, -5, -1, -13);
  ctx.stroke();

  // Hanging lantern cage
  const lx = 10 + sway * 0.6;
  const ly = -15;
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(10, -24);
  ctx.lineTo(lx, ly - 5);
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.strokeStyle = mono ? "#CBD5E1" : "#64748B";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(lx - 5, ly - 5, 10, 11, 2);
  ctx.fill();
  ctx.stroke();

  // Flame / spirit wisp core
  ctx.fillStyle = mono
    ? "#F8FAFC"
    : colorType === "amber"
      ? "#FDE047"
      : colorType === "rose"
        ? "#F472B6"
        : colorType === "violet"
          ? "#E879F9"
          : "#6EE7B7";
  ctx.beginPath();
  ctx.arc(lx, ly + 0.5, 3 * flicker, 0, Math.PI * 2);
  ctx.fill();

  // Pointed iron cap
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.moveTo(lx - 7, ly - 5);
  ctx.lineTo(lx, ly - 10);
  ctx.lineTo(lx + 7, ly - 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFernCluster(ctx, x, y, scale = 1, rot = 0, mono = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  const fronds = 6;
  for (let i = 0; i < fronds; i++) {
    const a = (Math.PI * 2 * i) / fronds + (i % 2) * 0.14;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = mono
      ? i % 2 === 0
        ? "rgba(148, 163, 184, 0.42)"
        : "rgba(100, 116, 139, 0.36)"
      : i % 2 === 0
        ? "rgba(16, 94, 67, 0.56)"
        : "rgba(13, 148, 136, 0.42)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -5, 19, 0);
    ctx.quadraticCurveTo(8, 5, 0, 0);
    ctx.fill();

    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.3)" : "rgba(52, 211, 153, 0.32)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(17, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawWoodlandRockAndMoss(ctx, x, y, r, seed, mono) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((seed - 0.5) * 1.4);

  // Shadow
  ctx.fillStyle = "rgba(2, 6, 12, 0.48)";
  ctx.beginPath();
  ctx.ellipse(3, 3, r * 1.05, r * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cracked slate stone
  ctx.fillStyle = mono ? "#475569" : "#1F2937";
  ctx.strokeStyle = mono ? "#94A3B8" : "#374151";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(-r * 0.6, -r * 0.72);
  ctx.lineTo(r * 0.4, -r * 0.65);
  ctx.lineTo(r, 0.1 * r);
  ctx.lineTo(r * 0.5, r * 0.62);
  ctx.lineTo(-r * 0.55, r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Emerald moss cushion across top-left face
  ctx.fillStyle = mono ? "rgba(203, 213, 225, 0.35)" : "rgba(16, 185, 129, 0.38)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.28, r * 0.52, r * 0.28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEerieWoodlandFlower(ctx, x, y, variant, t, mono) {
  const pulse = 0.55 + 0.45 * Math.sin(t * 2.3 + x * 0.04 + y * 0.03);
  ctx.save();
  ctx.translate(x, y);

  // Thin dark leaves
  ctx.fillStyle = mono ? "#475569" : "#064E3B";
  ctx.beginPath();
  ctx.ellipse(-5, 3, 6, 2.2, -0.5, 0, Math.PI * 2);
  ctx.ellipse(5, 3, 6, 2.2, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow ring (no shadowBlur)
  ctx.fillStyle = mono
    ? `rgba(226, 232, 240, ${0.14 * pulse})`
    : variant === 0
      ? `rgba(192, 132, 252, ${0.22 * pulse})`
      : variant === 1
        ? `rgba(52, 211, 153, ${0.22 * pulse})`
        : `rgba(244, 114, 182, ${0.2 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, -1, 11, 0, Math.PI * 2);
  ctx.fill();

  // 5-petal blossom
  const petalCol = mono
    ? "#CBD5E1"
    : variant === 0
      ? "#C084FC"
      : variant === 1
        ? "#34D399"
        : "#F472B6";
  ctx.fillStyle = petalCol;
  for (let p = 0; p < 5; p++) {
    const a = (Math.PI * 2 * p) / 5 + t * 0.25;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 3.6, -1 + Math.sin(a) * 3.6, 3.1, 1.8, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(0, -1, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeroPuppetFigure(ctx, x, y, lookAngle, color, scale = 1, t = 0, mono = false, withStrings = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Wooden base shadow
  ctx.fillStyle = "rgba(4, 8, 12, 0.58)";
  ctx.beginPath();
  ctx.ellipse(2, 13, 12, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle cross-shaped control threads rising up into darkness
  if (withStrings) {
    const sway = Math.sin(t * 2.1 + x * 0.07) * 2.5;
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.3)" : "rgba(248, 250, 252, 0.25)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-8 + sway, -34);
    ctx.moveTo(6, -2);
    ctx.lineTo(8 + sway, -34);
    ctx.moveTo(0, -15);
    ctx.lineTo(sway, -37);
    ctx.stroke();

    // Wooden marionette cross-bar above puppet
    ctx.strokeStyle = mono ? "#94A3B8" : "#785337";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10 + sway, -34);
    ctx.lineTo(10 + sway, -34);
    ctx.moveTo(sway - 2, -37);
    ctx.lineTo(sway + 2, -31);
    ctx.stroke();
  }

  // Articulated wooden legs & arms
  ctx.strokeStyle = mono ? "#64748B" : "#4A3222";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, 9);
  ctx.lineTo(-5, 14);
  ctx.moveTo(4, 9);
  ctx.lineTo(5, 14);
  ctx.moveTo(-7, 0);
  ctx.lineTo(-10, 6);
  ctx.moveTo(7, 0);
  ctx.lineTo(10, 6);
  ctx.stroke();

  // Jointed wooden torso
  ctx.fillStyle = mono ? "#475569" : "#5C4033";
  ctx.strokeStyle = "#1E1B18";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-7, -3, 14, 14, 3);
  ctx.fill();
  ctx.stroke();

  // Wooden chest peg & painted hero scarf
  ctx.fillStyle = mono ? "#CBD5E1" : color;
  ctx.fillRect(-6, -1, 12, 4.5);
  ctx.fillStyle = "#1E1B18";
  ctx.fillRect(-1.5, 5, 3, 3);

  // Turning carved wooden head with joint seam
  ctx.save();
  ctx.translate(0, -10.5);
  ctx.fillStyle = mono ? "#94A3B8" : "#8B6F56";
  ctx.beginPath();
  ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hair / hood silhouette hint
  ctx.fillStyle = mono ? "#334155" : "#271C17";
  ctx.beginPath();
  ctx.arc(0, -1.5, 7.4, Math.PI, 0);
  ctx.fill();

  const ex = Math.cos(lookAngle) * 3.1;
  const ey = Math.sin(lookAngle) * 2.1;
  ctx.fillStyle = "#090D16";
  ctx.beginPath();
  ctx.arc(ex - 1.9, ey + 0.5, 1.35, 0, Math.PI * 2);
  ctx.arc(ex + 1.9, ey + 0.5, 1.35, 0, Math.PI * 2);
  ctx.fill();

  // Faint glint in puppet eye
  ctx.fillStyle = mono ? "#F8FAFC" : color;
  ctx.beginPath();
  ctx.arc(ex - 1.9, ey + 0.5, 0.55, 0, Math.PI * 2);
  ctx.arc(ex + 1.9, ey + 0.5, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawAncientForestTree(ctx, obs, t, mono, perf, allowGlows) {
  const cx = obs.x + obs.w * 0.5;
  const cy = obs.y + obs.h * 0.5;
  const rx = Math.max(24, obs.w * 0.44);
  const ry = Math.max(22, obs.h * 0.42);
  const seed = hashPair(obs.x, obs.y, 3);
  const swayX = Math.sin(t * 0.95 + seed * 6.28) * 2.4;
  const swayY = Math.cos(t * 0.75 + seed * 6.28) * 1.4;

  ctx.save();
  ctx.translate(cx, cy);

  // Soft canopy cast shadow SE
  ctx.fillStyle = "rgba(2, 6, 10, 0.56)";
  ctx.beginPath();
  ctx.ellipse(10, 14, rx * 1.25, ry * 1.08, 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Gnarled spreading buttress roots gripping soil
  const rootCount = perf.effectiveTier === "saver" ? 4 : 6;
  ctx.lineCap = "round";
  for (let i = 0; i < rootCount; i++) {
    const a = (Math.PI * 2 * i) / rootCount + seed * 1.5;
    const len = Math.max(rx, ry) * (1.02 + hashPair(obs.x, i, 7) * 0.36);
    const mx = Math.cos(a + 0.22) * len * 0.62;
    const my = Math.sin(a + 0.22) * len * 0.62;
    const ex = Math.cos(a) * len;
    const ey = Math.sin(a) * len;

    ctx.strokeStyle = mono ? "#1E293B" : "#18120F";
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rx * 0.35, Math.sin(a) * ry * 0.35);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    ctx.strokeStyle = mono ? "#475569" : "#3B2D24";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rx * 0.35, Math.sin(a) * ry * 0.35 - 1);
    ctx.quadraticCurveTo(mx, my - 1, ex, ey);
    ctx.stroke();
  }

  // Deep fissured gnarled trunk body (matches collision rect clearly)
  ctx.fillStyle = mono ? "#334155" : "#241914";
  ctx.strokeStyle = mono ? "#64748B" : "#4A362A";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 3, rx * 0.78, ry * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bark grain fissures & glowing shelf mushrooms
  ctx.strokeStyle = mono ? "#0F172A" : "#140D0A";
  ctx.lineWidth = 1.6;
  for (let b = -2; b <= 2; b++) {
    ctx.beginPath();
    ctx.moveTo(b * (rx * 0.2), -ry * 0.45);
    ctx.quadraticCurveTo(b * (rx * 0.16) + 3, 0, b * (rx * 0.24), ry * 0.5);
    ctx.stroke();
  }
  if (seed > 0.45) {
    ctx.fillStyle = mono ? "#CBD5E1" : "#34D399";
    ctx.beginPath();
    ctx.ellipse(-rx * 0.52, ry * 0.22, 6, 3, -0.3, Math.PI, 0);
    ctx.ellipse(-rx * 0.42, ry * 0.34, 4.5, 2.4, -0.2, Math.PI, 0);
    ctx.fill();
  }

  // Multi-layered swaying ancient canopy crowns (offset slightly North for 2.5D perspective)
  const lobes = [
    { dx: -rx * 0.36, dy: -ry * 0.24, cr: rx * 0.68, col: mono ? "#1E293B" : "#0B241C" },
    { dx: rx * 0.34, dy: -ry * 0.18, cr: rx * 0.64, col: mono ? "#1E293B" : "#0E2D23" },
    { dx: 0, dy: -ry * 0.44, cr: rx * 0.72, col: mono ? "#334155" : "#11372A" },
    { dx: 0, dy: -ry * 0.1, cr: rx * 0.58, col: mono ? "#475569" : "#174636" },
  ];
  for (let i = 0; i < lobes.length; i++) {
    const lb = lobes[i];
    const ox = lb.dx + swayX * (0.6 + i * 0.15);
    const oy = lb.dy + swayY * (0.6 + i * 0.15);
    ctx.fillStyle = lb.col;
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.25)" : "rgba(52, 211, 153, 0.22)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(ox, oy, lb.cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Sunlit/moonlit jade & twilight-violet foliage crown rim + subtle glowing sap bud
  ctx.fillStyle = mono ? "rgba(226, 232, 240, 0.16)" : "rgba(45, 212, 191, 0.16)";
  ctx.beginPath();
  ctx.arc(-rx * 0.15 + swayX, -ry * 0.4 + swayY, rx * 0.38, 0, Math.PI * 2);
  ctx.fill();

  if (allowGlows && seed > 0.65 && !mono) {
    const pulse = 0.4 + 0.4 * Math.sin(t * 2.2 + seed * 10);
    ctx.fillStyle = `rgba(192, 132, 252, ${pulse * 0.65})`;
    ctx.beginPath();
    ctx.arc(rx * 0.25 + swayX, -ry * 0.2 + swayY, 2.8, 0, Math.PI * 2);
    ctx.arc(-rx * 0.22 + swayX, -ry * 0.08 + swayY, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawContinuousForestBorder(ctx, obs, t, viewBounds, mono, perf, allowGlows) {
  const b = getBoundsEdges(viewBounds) || { minX: 0, maxX: GRUDGE_FOREST_WIDTH, minY: 0, maxY: GRUDGE_FOREST_HEIGHT };
  const isHoriz = obs.w > obs.h;

  // Deep forest canopy base wall
  ctx.save();
  ctx.fillStyle = mono ? "#0F172A" : "#07130F";
  ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

  // Inner mossy barrier trim
  ctx.strokeStyle = mono ? "#475569" : "#1E3A2F";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

  const step = 84;
  if (isHoriz) {
    const x0 = Math.max(obs.x + 28, Math.floor((b.minX - 120) / step) * step);
    const x1 = Math.min(obs.x + obs.w - 28, b.maxX + 120);
    const cy = obs.y + obs.h * 0.5;
    for (let tx = x0; tx <= x1; tx += step) {
      const hv = hashPair(tx, obs.y, 11);
      const r = 34 + hv * 18;
      // Gnarled trunk cylinder
      ctx.fillStyle = mono ? "#1E293B" : "#1C1410";
      ctx.beginPath();
      ctx.ellipse(tx, cy + 4, 15 + hv * 6, obs.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Overlapping dark foliage crown
      ctx.fillStyle = mono ? "#334155" : hv > 0.5 ? "#0D2B21" : "#123428";
      ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.18)" : "rgba(52, 211, 153, 0.2)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(tx + (hv - 0.5) * 14, cy - 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Occasional eerie eyes peering from boundary thicket
      if (!mono && allowGlows && hv > 0.84 && perf.effectiveTier !== "saver") {
        const blink = Math.sin(t * 1.4 + tx * 0.05) > -0.75;
        if (blink) {
          ctx.fillStyle = "rgba(192, 132, 252, 0.72)";
          ctx.fillRect(tx - 5, cy + 3, 2.5, 2.2);
          ctx.fillRect(tx + 2.5, cy + 3, 2.5, 2.2);
        }
      }
    }
  } else {
    const y0 = Math.max(obs.y + 28, Math.floor((b.minY - 120) / step) * step);
    const y1 = Math.min(obs.y + obs.h - 28, b.maxY + 120);
    const cx = obs.x + obs.w * 0.5;
    for (let ty = y0; ty <= y1; ty += step) {
      const hv = hashPair(obs.x, ty, 13);
      const r = 34 + hv * 16;
      ctx.fillStyle = mono ? "#1E293B" : "#1C1410";
      ctx.beginPath();
      ctx.ellipse(cx, ty + 4, obs.w * 0.42, 16 + hv * 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = mono ? "#334155" : hv > 0.5 ? "#0D2B21" : "#123428";
      ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.18)" : "rgba(52, 211, 153, 0.2)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, ty + (hv - 0.5) * 14, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMegalithicGatePillar(ctx, obs, t, allowGlows, mono) {
  const cx = obs.x + obs.w * 0.5;
  const cy = obs.y + obs.h * 0.5;
  const flicker = 0.72 + 0.28 * Math.sin(t * 5.6 + obs.x);

  ctx.save();
  // Cast shadow
  ctx.fillStyle = "rgba(2, 6, 12, 0.62)";
  ctx.fillRect(obs.x + 8, obs.y + 10, obs.w, obs.h);

  // Stepped mossy granite base
  ctx.fillStyle = mono ? "#334155" : "#1E293B";
  ctx.strokeStyle = mono ? "#94A3B8" : "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(obs.x - 4, obs.y + obs.h - 24, obs.w + 8, 26, 6);
  ctx.fill();
  ctx.stroke();

  // Main carved monolith body
  ctx.fillStyle = mono ? "#475569" : "#293548";
  ctx.strokeStyle = mono ? "#CBD5E1" : "#10B981";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(obs.x + 4, obs.y, obs.w - 8, obs.h - 10, 8);
  ctx.fill();
  ctx.stroke();

  // Ashlar stone joints & cracks
  ctx.strokeStyle = "rgba(2, 6, 12, 0.5)";
  ctx.lineWidth = 1.2;
  for (let sy = obs.y + 24; sy < obs.y + obs.h - 20; sy += 24) {
    ctx.beginPath();
    ctx.moveTo(obs.x + 6, sy);
    ctx.lineTo(obs.x + obs.w - 6, sy);
    ctx.stroke();
  }

  // Carved glowing forest rune sigil in stone center
  const glowA = 0.45 + 0.35 * Math.sin(t * 2.1 + obs.x * 0.02);
  ctx.strokeStyle = mono ? `rgba(226, 232, 240, ${glowA})` : `rgba(52, 211, 153, ${glowA})`;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 22);
  ctx.lineTo(cx + 12, cy);
  ctx.lineTo(cx, cy + 22);
  ctx.lineTo(cx - 12, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = mono ? "#F8FAFC" : "#6EE7B7";
  ctx.fill();

  // Clinging ivy vines draped over top & corners
  ctx.strokeStyle = mono ? "#64748B" : "#15803D";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(obs.x + 10, obs.y + 4);
  ctx.quadraticCurveTo(obs.x + 24, obs.y + 28, obs.x + 14, obs.y + 58);
  ctx.moveTo(obs.x + obs.w - 14, obs.y + 8);
  ctx.quadraticCurveTo(obs.x + obs.w - 26, obs.y + 34, obs.x + obs.w - 16, obs.y + 66);
  ctx.stroke();

  // Brazier flame crowning top of gate stone
  if (!mono && allowGlows) {
    const g = ctx.createRadialGradient(cx, obs.y + 12, 2, cx, obs.y + 12, 34);
    g.addColorStop(0, `rgba(16, 185, 129, ${0.42 * flicker})`);
    g.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, obs.y + 12, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.ellipse(cx, obs.y + 14, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mono ? "#F8FAFC" : "#34D399";
  ctx.beginPath();
  ctx.arc(cx, obs.y + 11, 5.5 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAbandonedWoodenHouse(ctx, obs, t, allowGlows, mono) {
  const isWallSegment = obs.w < 70 || obs.h < 70;
  ctx.save();

  if (isWallSegment) {
    // Secret Puppet House perimeter timber wall with roof eaves & moss
    ctx.fillStyle = "rgba(2, 6, 12, 0.56)";
    ctx.fillRect(obs.x + 5, obs.y + 6, obs.w, obs.h);
    ctx.fillStyle = mono ? "#475569" : "#3A281F";
    ctx.strokeStyle = mono ? "#CBD5E1" : "#6B4C38";
    ctx.lineWidth = 2;
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

    // Timber log beam lines
    ctx.strokeStyle = "rgba(12, 8, 6, 0.55)";
    ctx.lineWidth = 1.4;
    if (obs.w > obs.h) {
      for (let bx = obs.x + 28; bx < obs.x + obs.w - 10; bx += 32) {
        ctx.beginPath();
        ctx.moveTo(bx, obs.y + 2);
        ctx.lineTo(bx, obs.y + obs.h - 2);
        ctx.stroke();
      }
    } else {
      for (let by = obs.y + 28; by < obs.y + obs.h - 10; by += 32) {
        ctx.beginPath();
        ctx.moveTo(obs.x + 2, by);
        ctx.lineTo(obs.x + obs.w - 2, by);
        ctx.stroke();
      }
    }
    // Moss tufts
    ctx.fillStyle = mono ? "rgba(203,213,225,0.28)" : "rgba(16, 185, 129, 0.34)";
    ctx.fillRect(obs.x + 6, obs.y + 4, Math.min(28, obs.w * 0.4), Math.min(10, obs.h * 0.4));
    ctx.restore();
    return;
  }

  // Full 2.5D Abandoned Village Cottage!
  const roofH = Math.round(obs.h * 0.62);
  const wallH = obs.h - roofH;
  const cx = obs.x + obs.w * 0.5;
  const flicker = 0.68 + 0.32 * Math.sin(t * 7.4 + obs.x * 0.1);
  const isWhisperHouse = obs.id === "z2_house_whisper";

  // Cast shadow SE
  ctx.fillStyle = "rgba(2, 6, 12, 0.65)";
  ctx.fillRect(obs.x + 10, obs.y + 12, obs.w, obs.h);

  // Wooden front porch deck protruding slightly South
  ctx.fillStyle = mono ? "#334155" : "#2D1E16";
  ctx.strokeStyle = "#18100C";
  ctx.lineWidth = 1.6;
  ctx.fillRect(obs.x + 18, obs.y + obs.h - 6, obs.w - 36, 18);
  ctx.strokeRect(obs.x + 18, obs.y + obs.h - 6, obs.w - 36, 18);

  // Southern timber wall facade
  ctx.fillStyle = mono ? "#475569" : "#3E2B21";
  ctx.fillRect(obs.x, obs.y + roofH, obs.w, wallH);
  ctx.strokeStyle = mono ? "#94A3B8" : "#5D4233";
  ctx.lineWidth = 2;
  ctx.strokeRect(obs.x, obs.y + roofH, obs.w, wallH);

  // Horizontal log siding lines
  ctx.strokeStyle = "rgba(15, 10, 8, 0.5)";
  ctx.lineWidth = 1.2;
  for (let ly = obs.y + roofH + 12; ly < obs.y + obs.h - 4; ly += 12) {
    ctx.beginPath();
    ctx.moveTo(obs.x + 3, ly);
    ctx.lineTo(obs.x + obs.w - 3, ly);
    ctx.stroke();
  }

  // Front Doorway (crooked slightly ajar)
  const doorW = 28;
  const doorH = Math.min(40, wallH - 6);
  ctx.fillStyle = "#120B08";
  ctx.fillRect(cx - doorW * 0.5, obs.y + obs.h - doorH, doorW, doorH);
  ctx.fillStyle = mono ? "#64748B" : "#4E3426";
  ctx.fillRect(cx - doorW * 0.5 + 2, obs.y + obs.h - doorH + 2, doorW - 6, doorH - 2);

  // Warm flickering shuttered windows (+ passing shadow in Whisper House!)
  const winPositions = [obs.x + obs.w * 0.2, obs.x + obs.w * 0.72];
  for (const wx of winPositions) {
    const wy = obs.y + roofH + wallH * 0.28;
    if (!mono && allowGlows) {
      const wg = ctx.createRadialGradient(wx + 12, wy + 8, 2, wx + 12, wy + 8, 28);
      wg.addColorStop(0, `rgba(251, 191, 36, ${0.32 * flicker})`);
      wg.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(wx + 12, wy + 8, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = mono ? "#CBD5E1" : `rgba(251, 191, 36, ${0.42 * flicker})`;
    ctx.fillRect(wx, wy, 24, 16);
    if (isWhisperHouse && Math.sin(t * 1.4 + wx) > 0.25) {
      // Faint indoor shadow passing behind window!
      ctx.fillStyle = "rgba(15, 10, 12, 0.72)";
      ctx.fillRect(wx + 8 + Math.sin(t * 2.2) * 5, wy + 2, 7, 14);
    }
    ctx.strokeStyle = "#1C120C";
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, 24, 16);
    // Window crossbars
    ctx.beginPath();
    ctx.moveTo(wx + 12, wy);
    ctx.lineTo(wx + 12, wy + 16);
    ctx.moveTo(wx, wy + 8);
    ctx.lineTo(wx + 24, wy + 8);
    ctx.stroke();
  }

  // Pitched dark cedar-shingle roof
  ctx.fillStyle = mono ? "#1E293B" : "#1F1716";
  ctx.strokeStyle = mono ? "#94A3B8" : "#4A362C";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(obs.x - 6, obs.y - 4, obs.w + 12, roofH + 10, 6);
  ctx.fill();
  ctx.stroke();

  // Roof ridge beam & shingle courses
  ctx.strokeStyle = mono ? "#64748B" : "#6B4E3B";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(obs.x - 4, obs.y + roofH * 0.45);
  ctx.lineTo(obs.x + obs.w + 4, obs.y + roofH * 0.45);
  ctx.stroke();

  ctx.strokeStyle = "rgba(8, 6, 6, 0.55)";
  ctx.lineWidth = 1.2;
  for (let sy = obs.y + 10; sy < obs.y + roofH; sy += 13) {
    ctx.beginPath();
    ctx.moveTo(obs.x, sy);
    ctx.lineTo(obs.x + obs.w, sy);
    ctx.stroke();
    for (let sx = obs.x + ((sy % 26) === 0 ? 12 : 24); sx < obs.x + obs.w - 8; sx += 24) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, Math.min(obs.y + roofH + 4, sy + 13));
      ctx.stroke();
    }
  }

  // Moss patches & creeping vines across roof slope
  ctx.fillStyle = mono ? "rgba(203, 213, 225, 0.2)" : "rgba(16, 185, 129, 0.28)";
  ctx.beginPath();
  ctx.ellipse(obs.x + obs.w * 0.28, obs.y + roofH * 0.35, 34, 14, -0.2, 0, Math.PI * 2);
  ctx.ellipse(obs.x + obs.w * 0.74, obs.y + roofH * 0.65, 28, 11, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Stone chimney stack
  ctx.fillStyle = mono ? "#334155" : "#2D3748";
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.8;
  ctx.fillRect(obs.x + obs.w - 42, obs.y + 10, 22, 22);
  ctx.strokeRect(obs.x + obs.w - 42, obs.y + 10, 22, 22);

  ctx.restore();
}

function drawDollTempleWall(ctx, obs, t, allowGlows, mono) {
  ctx.save();
  ctx.fillStyle = "rgba(2, 4, 10, 0.65)";
  ctx.fillRect(obs.x + 7, obs.y + 9, obs.w, obs.h);

  // Lacquered crimson-mahogany temple eaves & pillars
  ctx.fillStyle = mono ? "#334155" : "#3A1522";
  ctx.strokeStyle = mono ? "#CBD5E1" : "#F472B6";
  ctx.lineWidth = 2.2;
  ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
  ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

  // Inner dark pagoda roof tile ridge
  ctx.fillStyle = mono ? "#1E293B" : "#1F0D15";
  ctx.fillRect(obs.x + 4, obs.y + 4, Math.max(4, obs.w - 8), Math.max(4, obs.h - 8));

  // Decorative gold-rose temple beams & paper talismans
  ctx.strokeStyle = mono ? "rgba(226,232,240,0.35)" : "rgba(251, 191, 36, 0.34)";
  ctx.lineWidth = 1.5;
  if (obs.w > obs.h) {
    for (let px = obs.x + 36; px < obs.x + obs.w - 24; px += 72) {
      ctx.beginPath();
      ctx.moveTo(px, obs.y + 2);
      ctx.lineTo(px, obs.y + obs.h - 2);
      ctx.stroke();

      // White paper ritual talisman slip hanging off eaves
      ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
      ctx.fillRect(px - 3, obs.y + obs.h - 2, 6, 9);
    }
  } else {
    for (let py = obs.y + 36; py < obs.y + obs.h - 24; py += 72) {
      ctx.beginPath();
      ctx.moveTo(obs.x + 2, py);
      ctx.lineTo(obs.x + obs.w - 2, py);
      ctx.stroke();
    }
  }

  // Hanging crimson lanterns near temple gate ends
  if (!mono && allowGlows && (obs.id === "z6_temple_w_top" || obs.id === "z6_temple_w_bot" || obs.id === "z6_temple_nw")) {
    const lx = obs.x + (obs.w > obs.h ? obs.w - 18 : obs.w * 0.5);
    const ly = obs.y + (obs.w > obs.h ? obs.h + 10 : obs.h - 14);
    const flicker = 0.78 + 0.22 * Math.sin(t * 4.2 + lx);
    const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 34);
    lg.addColorStop(0, `rgba(244, 114, 182, ${0.35 * flicker})`);
    lg.addColorStop(1, "rgba(244, 114, 182, 0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#BE185D";
    ctx.beginPath();
    ctx.ellipse(lx, ly, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FBCFE8";
    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRootSwallowedTombstoneCluster(ctx, obs, t, allowGlows, mono) {
  ctx.save();
  // Cast shadow
  ctx.fillStyle = "rgba(2, 6, 12, 0.58)";
  ctx.beginPath();
  ctx.roundRect(obs.x + 6, obs.y + 8, obs.w, obs.h, 10);
  ctx.fill();

  // Raised mossy slate graveyard plinth
  ctx.fillStyle = mono ? "#1E293B" : "#151D29";
  ctx.strokeStyle = mono ? "#64748B" : "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 10);
  ctx.fill();
  ctx.stroke();

  // Moss patches across slate bed
  ctx.fillStyle = mono ? "rgba(148,163,184,0.2)" : "rgba(16, 185, 129, 0.22)";
  ctx.beginPath();
  ctx.ellipse(obs.x + obs.w * 0.3, obs.y + obs.h * 0.65, 34, 14, 0.2, 0, Math.PI * 2);
  ctx.ellipse(obs.x + obs.w * 0.72, obs.y + obs.h * 0.4, 28, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Carved individual headstones wrapped in thick black tree roots
  let idx = 0;
  for (let gx = obs.x + 30; gx < obs.x + obs.w - 20; gx += 46) {
    const tilt = ((idx % 3) - 1) * 0.08;
    const gy = obs.y + 18 + (idx % 2) * 5;
    ctx.save();
    ctx.translate(gx, gy + 18);
    ctx.rotate(tilt);

    // Stone shadow
    ctx.fillStyle = "rgba(2, 6, 12, 0.6)";
    ctx.fillRect(-10, -14, 24, 34);

    // Headstone body (alternating arched, cross, and obelisk silhouettes)
    ctx.fillStyle = mono ? "#64748B" : "#475569";
    ctx.strokeStyle = mono ? "#CBD5E1" : "#94A3B8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (idx % 3 === 1) {
      // Stepped cross slab
      ctx.roundRect(-12, -16, 24, 32, 4);
    } else {
      // Gothic arched slab
      ctx.moveTo(-12, 16);
      ctx.lineTo(-12, -8);
      ctx.arc(0, -8, 12, Math.PI, 0);
      ctx.lineTo(12, 16);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // Scratched epitaph lines
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.moveTo(-6, 2);
    ctx.lineTo(5, 2);
    ctx.moveTo(-8, 7);
    ctx.lineTo(6, 7);
    ctx.stroke();

    // Black twisted root coiling up and choking the tombstone
    ctx.strokeStyle = mono ? "#0F172A" : "#1C130E";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-15, 16);
    ctx.quadraticCurveTo(0, 6, 13, -6);
    ctx.moveTo(14, 15);
    ctx.quadraticCurveTo(-2, 1, -11, -11);
    ctx.stroke();

    // Flickering small spirit-candle beside tombstone
    if (!mono && allowGlows && idx % 2 === 0) {
      const flk = 0.7 + 0.3 * Math.sin(t * 6.5 + gx);
      ctx.fillStyle = `rgba(147, 197, 253, ${0.28 * flk})`;
      ctx.beginPath();
      ctx.arc(14, 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#E0F2FE";
      ctx.beginPath();
      ctx.arc(14, 12, 2.1 * flk, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    idx++;
  }
  ctx.restore();
}

function drawMazeRootWall(ctx, obs, t, allowGlows, mono) {
  const isHoriz = obs.w > obs.h;
  ctx.save();
  // Cast shadow
  ctx.fillStyle = "rgba(2, 6, 10, 0.58)";
  ctx.beginPath();
  ctx.roundRect(obs.x + 5, obs.y + 7, obs.w, obs.h, 12);
  ctx.fill();

  // Twisted woody core
  ctx.fillStyle = mono ? "#1E293B" : "#17261F";
  ctx.strokeStyle = mono ? "#94A3B8" : "#2D6A4F";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 12);
  ctx.fill();
  ctx.stroke();

  // Braided serpentine root strands running along the wall
  const count = Math.max(3, Math.floor((isHoriz ? obs.w : obs.h) / 48));
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const f0 = i / count;
    const f1 = (i + 1) / count;
    const wave = Math.sin(i * 1.9 + obs.x) * 8;
    ctx.strokeStyle = mono ? "#475569" : i % 2 === 0 ? "#2D211A" : "#114232";
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    if (isHoriz) {
      const x0 = obs.x + 10 + f0 * (obs.w - 20);
      const x1 = obs.x + 10 + f1 * (obs.w - 20);
      const cy = obs.y + obs.h * 0.5;
      ctx.moveTo(x0, cy - wave * 0.6);
      ctx.quadraticCurveTo((x0 + x1) * 0.5, cy + wave, x1, cy - wave * 0.5);
    } else {
      const y0 = obs.y + 10 + f0 * (obs.h - 20);
      const y1 = obs.y + 10 + f1 * (obs.h - 20);
      const cx = obs.x + obs.w * 0.5;
      ctx.moveTo(cx - wave * 0.6, y0);
      ctx.quadraticCurveTo(cx + wave, (y0 + y1) * 0.5, cx - wave * 0.5, y1);
    }
    ctx.stroke();

    // Glowing arcane sap bud & thorn spikes
    const bx = isHoriz ? obs.x + 20 + f0 * (obs.w - 40) : obs.x + obs.w * 0.5 + wave * 0.35;
    const by = isHoriz ? obs.y + obs.h * 0.5 + wave * 0.35 : obs.y + 20 + f0 * (obs.h - 40);
    if (!mono && allowGlows) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + i + obs.x);
      ctx.fillStyle = i % 2 === 0 ? `rgba(52, 211, 153, ${0.42 * pulse})` : `rgba(192, 132, 252, ${0.42 * pulse})`;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = mono ? "#CBD5E1" : i % 2 === 0 ? "#6EE7B7" : "#E879F9";
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLivingVines(ctx, obs, destruct, t, mono) {
  const flash = destruct && destruct.hitFlash > 0;
  const isHoriz = obs.w > obs.h;
  ctx.save();
  ctx.fillStyle = "rgba(2, 8, 5, 0.5)";
  ctx.beginPath();
  ctx.roundRect(obs.x + 4, obs.y + 5, obs.w, obs.h, 10);
  ctx.fill();

  ctx.fillStyle = flash ? "#86EFAC" : mono ? "#334155" : "#113D23";
  ctx.strokeStyle = flash ? "#FFFFFF" : mono ? "#E2E8F0" : "#4ADE80";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 10);
  ctx.fill();
  ctx.stroke();

  // Braided thorny tendrils + glowing purple pods
  const segs = Math.max(3, Math.floor((isHoriz ? obs.w : obs.h) / 36));
  for (let i = 0; i < segs; i++) {
    const f = (i + 0.5) / segs;
    const vx = isHoriz ? obs.x + f * obs.w : obs.x + obs.w * 0.5;
    const vy = isHoriz ? obs.y + obs.h * 0.5 : obs.y + f * obs.h;
    const wiggle = Math.sin(t * 3.5 + i * 1.4) * 4;
    ctx.strokeStyle = mono ? "#CBD5E1" : "#22C55E";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    if (isHoriz) {
      ctx.moveTo(vx - 16, vy - 8);
      ctx.quadraticCurveTo(vx, vy + wiggle + 10, vx + 16, vy - 8);
    } else {
      ctx.moveTo(vx - 8, vy - 16);
      ctx.quadraticCurveTo(vx + wiggle + 10, vy, vx - 8, vy + 16);
    }
    ctx.stroke();

    // Thorn & glowing pod
    ctx.fillStyle = mono ? "#E2E8F0" : "#D946EF";
    ctx.beginPath();
    ctx.arc(vx + wiggle * 0.3, vy, 3.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (destruct && destruct.hp < destruct.maxHp) {
    const pct = Math.max(0, destruct.hp / destruct.maxHp);
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(obs.x + 8, obs.y - 10, obs.w - 16, 5);
    ctx.fillStyle = "#4ADE80";
    ctx.fillRect(obs.x + 8, obs.y - 10, (obs.w - 16) * pct, 5);
  }
  ctx.restore();
}

function drawCentralSleepingGreatTree(ctx, obs, t, allowGlows, mono, perf) {
  const cx = obs.x + obs.w * 0.5;
  const cy = obs.y + obs.h * 0.5;
  const breath = 1 + Math.sin(t * 0.9) * 0.025;
  const sapPulse = 0.5 + 0.5 * Math.sin(t * 1.6);

  ctx.save();
  ctx.translate(cx, cy);

  // Monumental ambient bioluminescent aura under the Sleeping Great Tree
  if (!mono && allowGlows) {
    const g = ctx.createRadialGradient(0, 10, 40, 0, 10, 265);
    g.addColorStop(0, `rgba(168, 85, 247, ${0.22 + sapPulse * 0.1})`);
    g.addColorStop(0.55, `rgba(16, 185, 129, ${0.14 + sapPulse * 0.06})`);
    g.addColorStop(1, "rgba(6, 10, 14, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 10, 265, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.scale(breath, breath);

  // Colossal cast shadow
  ctx.fillStyle = "rgba(2, 4, 10, 0.68)";
  ctx.beginPath();
  ctx.ellipse(14, 18, 152, 108, 0, 0, Math.PI * 2);
  ctx.fill();

  // 12 sweeping braided buttress roots gripping the Heart clearing
  ctx.lineCap = "round";
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12 + 0.18;
    const reach = i % 2 === 0 ? 185 : 152;
    const ctrlA = a + (i % 2 === 0 ? 0.24 : -0.22);
    const sx = Math.cos(a) * 52;
    const sy = Math.sin(a) * 38;
    const mx = Math.cos(ctrlA) * (reach * 0.65);
    const my = Math.sin(ctrlA) * (reach * 0.52);
    const ex = Math.cos(a) * reach;
    const ey = Math.sin(a) * (reach * 0.78);

    // Outer root silhouette
    ctx.strokeStyle = mono ? "#1E293B" : "#17110E";
    ctx.lineWidth = i % 2 === 0 ? 16 : 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    // Inner gnarled bark highlight
    ctx.strokeStyle = mono ? "#475569" : "#3A2A22";
    ctx.lineWidth = i % 2 === 0 ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 2);
    ctx.quadraticCurveTo(mx, my - 2, ex, ey);
    ctx.stroke();

    // Pulsing sap vein running down alternate roots
    if (!mono && i % 2 === 0) {
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.26 + sapPulse * 0.28})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, ex * 0.85, ey * 0.85);
      ctx.stroke();
    }
  }

  // Sleeping Titan hunched shoulder-boughs & curled rib-bark body
  ctx.fillStyle = mono ? "#334155" : "#221815";
  ctx.strokeStyle = mono ? "#94A3B8" : "#4A362C";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 126, 92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Deep rib-like bark plates forming a sleeping creature silhouette
  ctx.strokeStyle = mono ? "#0F172A" : "#130D0B";
  ctx.lineWidth = 3;
  for (let r = -2; r <= 2; r++) {
    ctx.beginPath();
    ctx.moveTo(r * 28, -68);
    ctx.quadraticCurveTo(r * 36, -6, r * 24, 62);
    ctx.stroke();
  }

  // Crowned canopy antlers & dark jade-violet foliage tufts framing the head
  if (perf.effectiveTier !== "saver") {
    const canopyTufts = [
      { x: -78, y: -42, r: 44, col: mono ? "#1E293B" : "#0B2920" },
      { x: 78, y: -42, r: 44, col: mono ? "#1E293B" : "#0B2920" },
      { x: -38, y: -68, r: 52, col: mono ? "#334155" : "#12382B" },
      { x: 38, y: -68, r: 52, col: mono ? "#334155" : "#12382B" },
      { x: 0, y: -56, r: 58, col: mono ? "#475569" : "#1B2E36" },
    ];
    for (const ct of canopyTufts) {
      const sway = Math.sin(t * 0.9 + ct.x * 0.05) * 2.5;
      ctx.fillStyle = ct.col;
      ctx.strokeStyle = mono ? "rgba(226,232,240,0.2)" : "rgba(52, 211, 153, 0.24)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(ct.x + sway, ct.y, ct.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Hollowed slumbering titan face plate
  ctx.fillStyle = mono ? "#0F172A" : "#110B14";
  ctx.strokeStyle = mono ? "#64748B" : "#3B2742";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 18, 76, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Furrowed bark brow ridge & horn-boughs
  ctx.strokeStyle = mono ? "#64748B" : "#4A362C";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-54, 4);
  ctx.quadraticCurveTo(-24, 16, 0, 10);
  ctx.quadraticCurveTo(24, 16, 54, 4);
  ctx.stroke();

  // Half-slumbering colossal amethyst eyes weeping faint glowing sap
  const eyeAlpha = 0.45 + 0.35 * Math.sin(t * 1.4);
  ctx.fillStyle = mono ? `rgba(226, 232, 240, ${eyeAlpha})` : `rgba(192, 132, 252, ${eyeAlpha})`;
  ctx.beginPath();
  ctx.ellipse(-28, 22, 13.5, 4.8, 0.2, 0, Math.PI * 2);
  ctx.ellipse(28, 22, 13.5, 4.8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Inner slit-glow + sap tear trails
  ctx.fillStyle = mono ? "#FFFFFF" : "#F5D0FE";
  ctx.beginPath();
  ctx.ellipse(-28, 22, 5.5, 2, 0.2, 0, Math.PI * 2);
  ctx.ellipse(28, 22, 5.5, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  if (!mono) {
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.35 + sapPulse * 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-29, 27);
    ctx.quadraticCurveTo(-32, 42, -26, 52);
    ctx.moveTo(29, 27);
    ctx.quadraticCurveTo(32, 42, 26, 52);
    ctx.stroke();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 1. FLOOR LAYER: Terrain, Biomes, Paths, Mirror Lake, Courtyards, Flora
// ---------------------------------------------------------------------------

export function renderGrudgeForestFloor(ctx, engine, t, viewBounds) {
  const perf = engine.getPerformanceProfile?.() || { tier: "high", effectiveTier: "high", enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const mono = Boolean(engine.player?.tin_monochrome_realm_timer > 0);
  const b = getBoundsEdges(viewBounds) || {
    minX: 0,
    maxX: GRUDGE_FOREST_WIDTH,
    minY: 0,
    maxY: GRUDGE_FOREST_HEIGHT,
  };
  const runtime = engine.grudgeForestRuntime;
  const progress = normalizeGrudgeForestProgress(engine.grudgeForestProgress);
  const player = engine.player;
  const heroId = player?.heroId || player?.id || "";

  ctx.save();

  // Deep Dark-Fantasy Woodland Base Gradient
  const clampX0 = Math.max(0, b.minX - 80);
  const clampY0 = Math.max(0, b.minY - 80);
  const clampX1 = Math.min(GRUDGE_FOREST_WIDTH, b.maxX + 80);
  const clampY1 = Math.min(GRUDGE_FOREST_HEIGHT, b.maxY + 80);
  if (mono) {
    ctx.fillStyle = "#0F172A";
  } else {
    const bg = ctx.createLinearGradient(0, 0, GRUDGE_FOREST_WIDTH, GRUDGE_FOREST_HEIGHT);
    bg.addColorStop(0, "#091310");
    bg.addColorStop(0.45, "#07100E");
    bg.addColorStop(0.75, "#0A0916");
    bg.addColorStop(1, "#060D0B");
    ctx.fillStyle = bg;
  }
  ctx.fillRect(clampX0, clampY0, clampX1 - clampX0, clampY1 - clampY0);

  // Distinct Biome Zone Terrain Beds & Mosaic Inlays
  for (const z of GRUDGE_FOREST_ZONES) {
    if (!isRectVisible(z, viewBounds, 150)) continue;
    ctx.fillStyle = mono
      ? "rgba(30, 41, 59, 0.35)"
      : z.id === "zone_1"
        ? "rgba(11, 36, 26, 0.42)"
        : z.id === "zone_2"
          ? "rgba(13, 38, 34, 0.42)"
          : z.id === "zone_3"
            ? "rgba(28, 16, 48, 0.44)"
            : z.id === "zone_4"
              ? "rgba(22, 27, 38, 0.48)"
              : z.id === "zone_5"
                ? "rgba(10, 34, 24, 0.46)"
                : z.id === "zone_6"
                  ? "rgba(42, 18, 32, 0.38)"
                  : z.id === "zone_7"
                    ? "rgba(14, 24, 46, 0.42)"
                    : "rgba(24, 14, 42, 0.5)";
    ctx.fillRect(z.x, z.y, z.w, z.h);

    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.1)" : "rgba(52, 211, 153, 0.08)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(z.x + 4, z.y + 4, z.w - 8, z.h - 8);
  }

  // Ambient Radial Zone Halos (culled & skipped on low/no-glows)
  if (!mono && allowGlows) {
    const halos = [
      { x: 460, y: 3560, r: 340, c0: "rgba(16, 185, 129, 0.13)", c1: "rgba(6, 14, 11, 0)" },
      { x: 740, y: 2200, r: 420, c0: "rgba(45, 212, 191, 0.11)", c1: "rgba(6, 14, 11, 0)" },
      { x: 2360, y: 600, r: 520, c0: "rgba(168, 85, 247, 0.18)", c1: "rgba(10, 9, 22, 0)" },
      { x: 740, y: 740, r: 420, c0: "rgba(148, 163, 184, 0.1)", c1: "rgba(6, 14, 11, 0)" },
      { x: 3820, y: 1080, r: 500, c0: "rgba(52, 211, 153, 0.11)", c1: "rgba(6, 14, 11, 0)" },
      { x: 3980, y: 3020, r: 480, c0: "rgba(244, 114, 182, 0.14)", c1: "rgba(10, 9, 22, 0)" },
      { x: 2360, y: 3340, r: 440, c0: "rgba(96, 165, 250, 0.14)", c1: "rgba(6, 14, 11, 0)" },
      { x: 2360, y: 2040, r: 540, c0: "rgba(192, 132, 252, 0.2)", c1: "rgba(10, 9, 22, 0)" },
    ];
    for (const h of halos) {
      if (!isCircleInViewBounds(h.x, h.y, h.r, viewBounds)) continue;
      const g = ctx.createRadialGradient(h.x, h.y, 20, h.x, h.y, h.r);
      g.addColorStop(0, h.c0);
      g.addColorStop(1, h.c1);
      ctx.fillStyle = g;
      ctx.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2);
    }
  }

  // Dense Procedural Woodland Floor Layer: Roots, Ferns, Moss, Puddles, Leaves, Flowers
  const cell = perf.effectiveTier === "saver" ? 210 : 150;
  const ix0 = Math.max(0, Math.floor(b.minX / cell));
  const ix1 = Math.min(Math.ceil(GRUDGE_FOREST_WIDTH / cell), Math.ceil(b.maxX / cell));
  const iy0 = Math.max(0, Math.floor(b.minY / cell));
  const iy1 = Math.min(Math.ceil(GRUDGE_FOREST_HEIGHT / cell), Math.ceil(b.maxY / cell));

  for (let iy = iy0; iy <= iy1; iy++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const h = hashCell(ix, iy);
      const h2 = hashCell(ix + 19, iy + 7);
      const h3 = hashCell(ix + 43, iy + 29);
      const cx = ix * cell + (0.16 + h * 0.68) * cell;
      const cy = iy * cell + (0.16 + h2 * 0.68) * cell;

      // Avoid placing heavy clutter directly over Mirror Lake center
      if (Math.hypot(cx - 2360, cy - 600) < 380) continue;

      if (h < 0.26) {
        // Multi-branched twisting sub-surface roots with moss highlight
        ctx.strokeStyle = mono ? "rgba(71, 85, 105, 0.65)" : "rgba(28, 22, 18, 0.85)";
        ctx.lineWidth = 4.6 + h2 * 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 48, cy - 14 * (h3 - 0.5));
        ctx.quadraticCurveTo(cx - 4, cy + 18 * Math.sin(ix + iy), cx + 48, cy + 12);
        ctx.stroke();

        ctx.strokeStyle = mono ? "rgba(148, 163, 184, 0.25)" : "rgba(16, 185, 129, 0.22)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy - 4);
        ctx.quadraticCurveTo(cx, cy + 10 * Math.sin(ix + iy), cx + 26, cy + 6);
        ctx.stroke();
      } else if (h < 0.48) {
        // Lush dark woodland fern cluster + moss cushion
        ctx.fillStyle = mono ? "rgba(100, 116, 139, 0.16)" : "rgba(16, 185, 129, 0.12)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 34, 21, h3 * 3, 0, Math.PI * 2);
        ctx.fill();
        if (perf.effectiveTier !== "saver") {
          drawFernCluster(ctx, cx, cy, 0.8 + h2 * 0.45, h3 * Math.PI * 2, mono);
        }
      } else if (h < 0.66) {
        // Reflective woodland mud puddle or mossy slate stones
        if (h2 > 0.55) {
          ctx.fillStyle = mono ? "rgba(15, 23, 42, 0.55)" : "rgba(6, 18, 28, 0.68)";
          ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.18)" : "rgba(168, 85, 247, 0.22)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 26 + h3 * 14, 15 + h2 * 8, h3 * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          drawWoodlandRockAndMoss(ctx, cx, cy, 11 + h3 * 7, h2, mono);
        }
      } else if (h < 0.84) {
        // Glowing haunted woodland flower cluster
        const variant = (ix + iy) % 3;
        drawEerieWoodlandFlower(ctx, cx, cy, variant, t, mono);
        if (h2 > 0.5) {
          drawEerieWoodlandFlower(ctx, cx + 14, cy + 7, (variant + 1) % 3, t + 1, mono);
        }
      } else {
        // Scattered fallen dry leaves & creeping bioluminescent spore vein
        ctx.fillStyle = mono ? "rgba(148,163,184,0.22)" : "rgba(120, 53, 15, 0.42)";
        for (let lf = 0; lf < 4; lf++) {
          const lx = cx + Math.cos(lf * 1.7 + h2 * 6) * 18;
          const ly = cy + Math.sin(lf * 1.9 + h3 * 6) * 12;
          ctx.beginPath();
          ctx.ellipse(lx, ly, 4.5, 2.2, lf + h, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Winding Multi-Layered Forest Paths Connecting All 8 Zones
  const pathPoints = [
    [
      { x: 460, y: 3560 },
      { x: 720, y: 2900 },
      { x: 740, y: 2000 },
      { x: 680, y: 740 },
      { x: 1550, y: 660 },
      { x: 2360, y: 880 },
      { x: 2360, y: 1580 },
    ],
    [
      { x: 2360, y: 2220 },
      { x: 2360, y: 3360 },
      { x: 3540, y: 3140 },
      { x: 3920, y: 2320 },
      { x: 3840, y: 960 },
      { x: 2980, y: 840 },
    ],
    [
      { x: 720, y: 3340 },
      { x: 2120, y: 3440 },
    ],
  ];

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Pass 1: Wide outer leaf-mulch shoulder
  ctx.strokeStyle = mono ? "rgba(30, 41, 59, 0.55)" : "rgba(24, 21, 16, 0.72)";
  ctx.lineWidth = 92;
  ctx.beginPath();
  for (const chain of pathPoints) {
    chain.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
  }
  ctx.stroke();

  // Pass 2: Worn sunken dirt footpath
  ctx.strokeStyle = mono ? "rgba(51, 65, 85, 0.52)" : "rgba(48, 39, 30, 0.68)";
  ctx.lineWidth = 56;
  ctx.stroke();

  // Pass 3: Subtle dashed wheel-rut / stepping stone spine along trail
  ctx.strokeStyle = mono ? "rgba(148, 163, 184, 0.16)" : "rgba(120, 100, 80, 0.22)";
  ctx.lineWidth = 18;
  ctx.setLineDash([12, 26]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Zone 1: Ancient Stone Gate Plaza Paving & Carved Threshold Sigil
  if (isRectVisible({ x: 200, y: 3260, w: 560, h: 460 }, viewBounds, 80)) {
    ctx.save();
    ctx.fillStyle = mono ? "rgba(51, 65, 85, 0.45)" : "rgba(30, 41, 48, 0.58)";
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.2)" : "rgba(16, 185, 129, 0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(270, 3360, 400, 290, 24);
    ctx.fill();
    ctx.stroke();

    // Mossy threshold flagstones
    for (let px = 295; px < 640; px += 52) {
      for (let py = 3385; py < 3625; py += 48) {
        if (hashPair(px, py, 2) > 0.22) {
          ctx.fillStyle = mono ? "rgba(71, 85, 105, 0.55)" : "rgba(44, 56, 62, 0.55)";
          ctx.fillRect(px, py, 42, 38);
          ctx.strokeStyle = "rgba(6, 14, 12, 0.5)";
          ctx.strokeRect(px, py, 42, 38);
        }
      }
    }

    // Faded ancient gate warning mandala on cobblestones
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.28)" : "rgba(52, 211, 153, 0.28)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(468, 3440, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(468, 3440, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Zone 2: Abandoned Village Plaza, Well, Wooden Crates & Secret Puppet House Floorboards
  if (isRectVisible({ x: 180, y: 1520, w: 1180, h: 1140 }, viewBounds, 80)) {
    // Village well at (690, 2340) with timber roof & hanging bucket
    if (isCircleInViewBounds(690, 2340, 95, viewBounds)) {
      ctx.save();
      ctx.translate(690, 2340);
      ctx.fillStyle = "rgba(2, 6, 12, 0.55)";
      ctx.beginPath();
      ctx.ellipse(4, 6, 36, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mono ? "#475569" : "#334155";
      ctx.strokeStyle = mono ? "#CBD5E1" : "#64748B";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#04070D";
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      // Well mossy stones rim
      ctx.fillStyle = mono ? "rgba(203,213,225,0.22)" : "rgba(16, 185, 129, 0.3)";
      ctx.beginPath();
      ctx.arc(-14, -14, 7, 0, Math.PI * 2);
      ctx.arc(16, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      // Wooden crossbeam & small shingle awning
      ctx.strokeStyle = "#5C4033";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
      ctx.fillStyle = mono ? "#334155" : "#2D1E16";
      ctx.strokeStyle = "#1C120C";
      ctx.lineWidth = 1.6;
      ctx.fillRect(-20, -13, 40, 14);
      ctx.strokeRect(-20, -13, 40, 14);
      ctx.restore();
    }

    // Broken Abandoned Supply Cart & Barrels at (990, 2490)
    if (isCircleInViewBounds(990, 2490, 95, viewBounds)) {
      ctx.save();
      ctx.translate(990, 2490);
      ctx.rotate(-0.24);
      ctx.fillStyle = "rgba(2, 6, 12, 0.5)";
      ctx.fillRect(-28, -14, 58, 32);
      ctx.fillStyle = mono ? "#475569" : "#4A3222";
      ctx.strokeStyle = "#1E120C";
      ctx.lineWidth = 2;
      ctx.fillRect(-26, -15, 52, 28);
      ctx.strokeRect(-26, -15, 52, 28);
      // Plank seams
      ctx.beginPath();
      ctx.moveTo(-26, -5);
      ctx.lineTo(26, -5);
      ctx.moveTo(-26, 4);
      ctx.lineTo(26, 4);
      ctx.stroke();
      // Tilted broken wooden wheel
      ctx.strokeStyle = "#785337";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(-18, 17, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(18, 16, 10, 0, Math.PI * 1.5);
      ctx.stroke();
      // Mossy supply barrels beside cart
      ctx.fillStyle = mono ? "#64748B" : "#5C4033";
      ctx.beginPath();
      ctx.arc(38, -6, 9, 0, Math.PI * 2);
      ctx.arc(42, 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Secret Puppet House interior wooden floorboards + chalk ritual circle + wall plaque & loose spools
    if (isRectVisible({ x: 185, y: 1530, w: 295, h: 290 }, viewBounds, 80)) {
      ctx.save();
      ctx.fillStyle = mono ? "rgba(30, 41, 59, 0.85)" : "rgba(32, 20, 16, 0.86)";
      ctx.fillRect(198, 1538, 268, 272);
      ctx.strokeStyle = "rgba(12, 8, 6, 0.65)";
      ctx.lineWidth = 1.2;
      for (let py = 1554; py < 1805; py += 16) {
        ctx.beginPath();
        ctx.moveTo(200, py);
        ctx.lineTo(464, py);
        ctx.stroke();
      }
      // Faint rose-chalk puppet control circle
      ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.35)" : "rgba(244, 114, 182, 0.42)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(330, 1680, 62, 0, Math.PI * 2);
      ctx.stroke();

      // Wall carving plaque on North wall: “Ngươi tưởng mình đang điều khiển chúng sao?”
      ctx.fillStyle = "#1E1410";
      ctx.strokeStyle = "#F472B6";
      ctx.lineWidth = 1.4;
      ctx.fillRect(244, 1558, 172, 20);
      ctx.strokeRect(244, 1558, 172, 20);
      ctx.fillStyle = "#FBCFE8";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("“NGƯƠI TƯỞNG MÌNH ĐIỀU KHIỂN?”", 330, 1571);
      ctx.restore();
    }
  }

  // Zone 3: Black Mirror Lake & Desynchronized Reflection + Submerged Mirage Ruins
  if (isCircleInViewBounds(2360, 620, 560, viewBounds)) {
    const resWin = runtime?.mirrorResonanceWindow || 0;
    const visionMap = runtime?.mirrorVisionMap || "map1";

    // Outer damp muddy bank + wet pebble ring
    ctx.fillStyle = mono ? "rgba(30, 41, 59, 0.72)" : "rgba(18, 22, 34, 0.82)";
    ctx.beginPath();
    ctx.ellipse(2360, 610, 425, 245, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shallow dark translucent lake rim
    ctx.fillStyle = mono ? "rgba(15, 23, 42, 0.86)" : "rgba(13, 18, 36, 0.88)";
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.24)" : "rgba(168, 85, 247, 0.3)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(2360, 600, 385, 212, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Obsidian black water mirror core
    ctx.fillStyle = mono ? "#090D16" : resWin > 0 ? "#0B041B" : "#03060C";
    ctx.beginPath();
    ctx.ellipse(2360, 600, 352, 186, 0, 0, Math.PI * 2);
    ctx.fill();

    // Submerged drowned ruins & gnarled underwater roots faintly visible beneath mirror surface
    ctx.save();
    ctx.strokeStyle = mono ? "rgba(100, 116, 139, 0.16)" : "rgba(88, 28, 135, 0.24)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(2120, 560);
    ctx.quadraticCurveTo(2240, 520, 2300, 580);
    ctx.moveTo(2430, 635);
    ctx.quadraticCurveTo(2540, 560, 2610, 610);
    ctx.stroke();

    // Moonlit shimmer streaks across mirror water
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.12)" : "rgba(216, 180, 254, 0.16)";
    ctx.lineWidth = 1.4;
    for (let ms = 0; ms < 5; ms++) {
      const sy = 505 + ms * 44;
      const sx = 2280 + Math.sin(t * 0.9 + ms) * 32;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 68 + ms * 8, sy);
      ctx.stroke();
    }

    // Underwater mirage shards of Map 1 (Blood Citadel) / Map 2 (Inferno Ash) during resonance!
    if (resWin > 0 && !mono) {
      ctx.strokeStyle = visionMap === "map1" ? "rgba(244, 63, 94, 0.36)" : "rgba(251, 146, 60, 0.36)";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(2235, 515, 76, 54);
      ctx.strokeRect(2415, 525, 68, 48);
      ctx.beginPath();
      ctx.moveTo(2273, 495);
      ctx.lineTo(2245, 515);
      ctx.lineTo(2300, 515);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Swaying shoreline reeds & mossy lakeside boulders
    const reedClusters = [
      { x: 1995, y: 580 },
      { x: 2045, y: 695 },
      { x: 2715, y: 575 },
      { x: 2670, y: 695 },
      { x: 2210, y: 425 },
      { x: 2510, y: 425 },
    ];
    for (const rc of reedClusters) {
      drawWoodlandRockAndMoss(ctx, rc.x - 10, rc.y + 6, 12, rc.x * 0.01, mono);
      ctx.strokeStyle = mono ? "#64748B" : "#15803D";
      ctx.lineWidth = 2;
      for (let st = -2; st <= 2; st++) {
        const sway = Math.sin(t * 2 + rc.x + st) * 3.5;
        ctx.beginPath();
        ctx.moveTo(rc.x + st * 5, rc.y + 4);
        ctx.quadraticCurveTo(rc.x + st * 6 + sway * 0.5, rc.y - 10, rc.x + st * 7 + sway, rc.y - 22);
        ctx.stroke();
      }
    }

    // Drifting ghostly water lily pads around lake margins
    const lilies = [
      { x: 2070, y: 555, r: 12 },
      { x: 2110, y: 655, r: 10 },
      { x: 2645, y: 540, r: 13 },
      { x: 2615, y: 665, r: 11 },
    ];
    for (const li of lilies) {
      ctx.fillStyle = mono ? "rgba(100, 116, 139, 0.45)" : "rgba(16, 94, 67, 0.65)";
      ctx.beginPath();
      ctx.arc(li.x, li.y, li.r, 0.25, Math.PI * 2 - 0.25);
      ctx.lineTo(li.x, li.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mono ? "#CBD5E1" : "#E879F9";
      ctx.beginPath();
      ctx.arc(li.x + 2, li.y - 2, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Concentric Water Ripples
    ctx.strokeStyle = mono
      ? "rgba(203, 213, 225, 0.22)"
      : resWin > 0
        ? visionMap === "map1"
          ? "rgba(244, 63, 94, 0.45)"
          : "rgba(251, 146, 60, 0.45)"
        : "rgba(168, 85, 247, 0.26)";
    ctx.lineWidth = resWin > 0 ? 2.4 : 1.5;
    for (let r = 0; r < 3; r++) {
      const rr = ((t * 28 + r * 70) % 210) + 40;
      ctx.beginPath();
      ctx.ellipse(2360, 600, rr * 1.4, rr * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Weathered Wooden Boardwalk Pier with Rope Bollards extending South
    ctx.fillStyle = "rgba(2, 6, 12, 0.55)";
    ctx.fillRect(2331, 680, 70, 128);
    ctx.fillStyle = mono ? "#475569" : "#3B271C";
    ctx.fillRect(2324, 674, 72, 130);
    ctx.strokeStyle = "#1C120C";
    ctx.lineWidth = 2;
    ctx.strokeRect(2324, 674, 72, 130);
    for (let py = 684; py < 800; py += 14) {
      ctx.beginPath();
      ctx.moveTo(2326, py);
      ctx.lineTo(2394, py);
      ctx.stroke();
    }
    // Pier mooring posts
    for (const [bx, by] of [[2326, 678], [2394, 678], [2326, 742], [2394, 742], [2326, 798], [2394, 798]]) {
      ctx.fillStyle = "#573B26";
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Altered Reflection when player approaches Mirror Lake shore
    if (player && Math.hypot(player.x - 2360, player.y - 680) < 420) {
      const rx = player.x + Math.sin(t * 1.4) * 14;
      const ry = 600 - Math.min(115, Math.max(-75, (player.y - 680) * 0.55));
      ctx.save();
      ctx.globalAlpha = 0.66;
      ctx.fillStyle = mono ? "#CBD5E1" : "#A855F7";
      ctx.beginPath();
      ctx.arc(rx, ry, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1E1B4B";
      ctx.beginPath();
      ctx.roundRect(rx - 10, ry + 11, 20, 20, 4);
      ctx.fill();

      // Extra figure standing quietly behind the player's reflection during resonance!
      if (resWin > 0) {
        const bx = rx + 24 * Math.sin(t * 0.9);
        const by = ry - 28;
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = "#090D16";
        ctx.strokeStyle = mono ? "#F8FAFC" : "#E879F9";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(bx, by, 12.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx - 12, by + 34);
        ctx.lineTo(bx - 9, by + 11);
        ctx.lineTo(bx + 9, by + 11);
        ctx.lineTo(bx + 12, by + 34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Glowing eyes on the reflection watcher
        ctx.fillStyle = "#F472B6";
        ctx.fillRect(bx - 4, by - 2, 2.2, 2);
        ctx.fillRect(bx + 2, by - 2, 2.2, 2);
      }
      ctx.restore();
    }
  }

  // EE5: Trung's Hidden Study Interior Floorboards + 4-Region Desk Map & Empty Chair (2874..3086, 984..1254)
  if (isRectVisible({ x: 2860, y: 970, w: 240, h: 295 }, viewBounds, 80)) {
    ctx.save();
    ctx.fillStyle = mono ? "#1E293B" : "#1D1624";
    ctx.fillRect(2870, 982, 218, 272);
    ctx.strokeStyle = "rgba(12, 10, 18, 0.7)";
    ctx.lineWidth = 1.2;
    for (let py = 1000; py < 1250; py += 16) {
      ctx.beginPath();
      ctx.moveTo(2872, py);
      ctx.lineTo(3086, py);
      ctx.stroke();
    }

    // Wooden scholar desk at (2975, 1070)
    ctx.fillStyle = "#4A3222";
    ctx.strokeStyle = "#1E120C";
    ctx.lineWidth = 2;
    ctx.fillRect(2932, 1044, 86, 44);
    ctx.strokeRect(2932, 1044, 86, 44);

    // Unrolled 4-Region Parchment Map with red ink rings + unfinished letter + empty chair
    ctx.fillStyle = "#E7D5B3";
    ctx.fillRect(2942, 1052, 46, 28);
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(2953, 1061, 4.5, 0, Math.PI * 2);
    ctx.arc(2973, 1068, 5, 0, Math.PI * 2);
    ctx.stroke();
    // Unfinished white letter sheet
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(2994, 1054, 16, 20);
    // Empty angled wooden chair below desk
    ctx.fillStyle = "#3A2518";
    ctx.fillRect(2964, 1094, 24, 20);
    ctx.strokeStyle = "#1E120C";
    ctx.strokeRect(2964, 1094, 24, 20);
    ctx.restore();
  }

  // Zone 4: Root Graveyard Secondary Headstones, Rusted Iron Fence & Spirit Candles
  if (isRectVisible({ x: 140, y: 200, w: 1280, h: 1120 }, viewBounds, 80)) {
    // Rusted wrought-iron cemetery fence rail segments
    const fenceRails = [
      { x: 240, y: 1140, w: 420 },
      { x: 840, y: 1140, w: 420 },
    ];
    ctx.save();
    ctx.strokeStyle = mono ? "#64748B" : "#334155";
    ctx.lineWidth = 2.2;
    for (const fr of fenceRails) {
      if (!isRectVisible({ x: fr.x, y: fr.y - 20, w: fr.w, h: 40 }, viewBounds, 40)) continue;
      ctx.beginPath();
      ctx.moveTo(fr.x, fr.y);
      ctx.lineTo(fr.x + fr.w, fr.y);
      for (let px = fr.x; px <= fr.x + fr.w; px += 22) {
        ctx.moveTo(px, fr.y + 6);
        ctx.lineTo(px, fr.y - 12);
      }
      ctx.stroke();
    }
    ctx.restore();

    const miniGraves = [
      { x: 520, y: 880, name: "DUY?", rot: -0.06 },
      { x: 910, y: 620, name: "DUY", rot: 0.04 },
      { x: 420, y: 430, name: "MA THẠCH", rot: -0.03 },
      { x: 640, y: 740, name: "", rot: 0.14 },
      { x: 990, y: 820, name: "", rot: -0.12 },
      { x: 580, y: 540, name: "", rot: 0.08 },
      { x: 840, y: 380, name: "", rot: -0.1 },
    ];
    for (const mg of miniGraves) {
      if (!isCircleInViewBounds(mg.x, mg.y, 48, viewBounds)) continue;
      ctx.save();
      ctx.translate(mg.x, mg.y);
      ctx.rotate(mg.rot);
      ctx.fillStyle = "rgba(2, 6, 12, 0.48)";
      ctx.beginPath();
      ctx.ellipse(2, 10, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mono ? "#475569" : "#334155";
      ctx.strokeStyle = mg.name === "DUY" ? "#F472B6" : mg.name === "MA THẠCH" ? "#F43F5E" : "#64748B";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-14, -18, 28, 30, 6);
      ctx.fill();
      ctx.stroke();
      // Special engraved diamond on Ma Thach tombstone or scratched name on Duy's stone
      if (mg.name === "MA THẠCH") {
        ctx.fillStyle = "#F43F5E";
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(6, -3);
        ctx.lineTo(0, 5);
        ctx.lineTo(-6, -3);
        ctx.closePath();
        ctx.fill();
      } else if (mg.name === "DUY") {
        ctx.fillStyle = "#FBCFE8";
        ctx.font = "bold 8px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("DUY", 0, -2);
      }
      // Twisted root over base
      ctx.strokeStyle = "#1E140E";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.quadraticCurveTo(0, -2, 15, 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Zone 5: Rotatable Idol Compass Circles & Maze Vault Sacred Floor
  if (isRectVisible({ x: 3300, y: 260, w: 1320, h: 1600 }, viewBounds, 80)) {
    const idolPads = [
      { x: 3520, y: 760 },
      { x: 4020, y: 1040 },
      { x: 3780, y: 1680 },
    ];
    for (const ip of idolPads) {
      if (!isCircleInViewBounds(ip.x, ip.y, 70, viewBounds)) continue;
      ctx.save();
      ctx.translate(ip.x, ip.y);
      ctx.fillStyle = "rgba(15, 23, 30, 0.68)";
      ctx.strokeStyle = progress.statuesAligned ? "rgba(52, 211, 153, 0.6)" : "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let d = 0; d < 4; d++) {
        const a = (Math.PI * d) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 34);
        ctx.lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (progress.statuesAligned) {
      ctx.save();
      ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.35)" : "rgba(52, 211, 153, 0.38)";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(3520, 760);
      ctx.lineTo(4020, 1040);
      ctx.lineTo(3780, 1680);
      ctx.moveTo(4020, 1040);
      ctx.lineTo(4360, 510);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Maze Vault inner floor circle (4240..4520, 380..650)
    if (isCircleInViewBounds(4380, 514, 160, viewBounds)) {
      ctx.save();
      ctx.fillStyle = mono ? "#1E293B" : "#12211C";
      ctx.fillRect(4254, 376, 270, 276);
      ctx.strokeStyle = mono ? "#CBD5E1" : "rgba(52, 211, 153, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(4388, 514, 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4388, 514, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Zone 6: Doll Temple Courtyard Floor, Woven Runner, Fate Threads & Portrait Gallery
  if (isRectVisible({ x: 3560, y: 2660, w: 960, h: 760 }, viewBounds, 80)) {
    ctx.save();
    ctx.fillStyle = mono ? "rgba(30, 41, 59, 0.78)" : "rgba(38, 19, 22, 0.82)";
    ctx.fillRect(3575, 2675, 920, 720);

    // Lacquered wooden floorboards
    ctx.strokeStyle = "rgba(12, 6, 8, 0.55)";
    ctx.lineWidth = 1.2;
    for (let ty = 2695; ty < 3380; ty += 24) {
      ctx.beginPath();
      ctx.moveTo(3580, ty);
      ctx.lineTo(4480, ty);
      ctx.stroke();
    }

    // Crimson ceremonial temple runner rug leading to the Altar
    ctx.fillStyle = mono ? "rgba(71, 85, 105, 0.45)" : "rgba(131, 24, 67, 0.42)";
    ctx.fillRect(3605, 2978, 420, 84);
    ctx.strokeStyle = mono ? "#CBD5E1" : "rgba(244, 114, 182, 0.42)";
    ctx.lineWidth = 2;
    ctx.strokeRect(3605, 2978, 420, 84);

    // Delicate crimson puppet-threads radiating across courtyard floor from the Altar
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.25)" : "rgba(244, 63, 94, 0.34)";
    ctx.lineWidth = 1.2;
    const threadTargets = [
      { x: 3360, y: 2940 },
      { x: 3440, y: 2920 },
      { x: 3510, y: 2980 },
      { x: 3390, y: 3110 },
    ];
    for (const tt of threadTargets) {
      ctx.beginPath();
      ctx.moveTo(3980, 3020);
      ctx.quadraticCurveTo(3720, 3010 + Math.sin(t * 1.4 + tt.y) * 14, tt.x, tt.y);
      ctx.stroke();
    }

    // Altar platform (3980, 3020) with Twin Brass Incense Burners & Glowing Soul-Wood Core
    ctx.fillStyle = mono ? "#334155" : "#4A182B";
    ctx.strokeStyle = mono ? "#E2E8F0" : "#F472B6";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(3936, 2976, 88, 88, 12);
    ctx.fill();
    ctx.stroke();
    // Soul-wood core on altar center
    ctx.fillStyle = mono ? "#CBD5E1" : "#F472B6";
    ctx.beginPath();
    ctx.arc(3980, 3020, 10 + Math.sin(t * 2.8) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Twin incense burners
    ctx.fillStyle = "#B45309";
    ctx.beginPath();
    ctx.arc(3950, 2992, 5.5, 0, Math.PI * 2);
    ctx.arc(4010, 2992, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Gallery of Hero Portraits along NE temple wall (4205..4420, 2742)
    const frameColors = ["#38BDF8", "#F43F5E", "#F59E0B", "#A855F7"];
    for (let f = 0; f < 4; f++) {
      const fx = 4205 + f * 52;
      const fy = 2742;
      ctx.fillStyle = "#4A3222";
      ctx.fillRect(fx, fy, 38, 46);
      ctx.fillStyle = "#1E1624";
      ctx.fillRect(fx + 4, fy + 4, 30, 38);
      ctx.fillStyle = frameColors[f];
      ctx.beginPath();
      ctx.arc(fx + 19, fy + 19, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(fx + 11, fy + 26, 16, 13);
      ctx.fillStyle = "#FACC15";
      ctx.fillRect(fx + 15, fy + 18, 2, 2);
      ctx.fillRect(fx + 21, fy + 18, 2, 2);
    }

    ctx.strokeStyle = "rgba(244, 114, 182, 0.24)";
    ctx.lineWidth = 2;
    ctx.strokeRect(3600, 2700, 870, 670);
    ctx.restore();
  }

  // Zone 7: Calling Valley Acoustic Mist Rings + Bleached Bone-Root Ribs & Wind Chimes
  if (isCircleInViewBounds(2380, 3360, 520, viewBounds)) {
    ctx.save();
    // Bleached pale root ribs curving out of fog bank
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.35)" : "rgba(148, 163, 184, 0.34)";
    ctx.lineWidth = 6.5;
    ctx.lineCap = "round";
    for (let rb = 0; rb < 4; rb++) {
      const rx = 2030 + rb * 220;
      const ry = 3550 - (rb % 2) * 320;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 28, ry - 48, rx + 58, ry - 14);
      ctx.stroke();
    }

    for (const [vx, vy] of [[2120, 3440], [2680, 3260]]) {
      if (!isCircleInViewBounds(vx, vy, 130, viewBounds)) continue;
      for (let r = 0; r < 3; r++) {
        const rr = 32 + ((t * 18 + r * 28) % 86);
        ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.16)" : `rgba(96, 165, 250, ${0.28 * (1 - rr / 120)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(vx, vy, rr * 1.2, rr * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Swaying bone spirit chime post
      const sw = Math.sin(t * 2.2 + vx) * 2.4;
      ctx.fillStyle = "#3B271C";
      ctx.fillRect(vx - 3, vy - 26, 6, 30);
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(vx - 10, vy - 24);
      ctx.lineTo(vx + 10, vy - 24);
      ctx.moveTo(vx - 5, vy - 24);
      ctx.lineTo(vx - 5 + sw, vy - 12);
      ctx.moveTo(vx + 5, vy - 24);
      ctx.lineTo(vx + 5 + sw, vy - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Zone 8: Sacred Clearing Under Colossal Tree + 4-Map Convergence Pedestals
  if (isCircleInViewBounds(2360, 2080, 480, viewBounds)) {
    ctx.save();
    // Double ritual clearing circles
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.26)" : "rgba(168, 85, 247, 0.3)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(2360, 2120, 245, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.2)" : "rgba(52, 211, 153, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2360, 2120, 165, 0, Math.PI * 2);
    ctx.stroke();

    // 8 radial root-veins linking Central Tree (2360, 1840) to the Clearing
    ctx.strokeStyle = mono ? "rgba(148, 163, 184, 0.22)" : "rgba(168, 85, 247, 0.24)";
    ctx.lineWidth = 2.2;
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8;
      ctx.beginPath();
      ctx.moveTo(2360 + Math.cos(a) * 40, 2120 + Math.sin(a) * 40);
      ctx.lineTo(2360 + Math.cos(a) * 245, 2120 + Math.sin(a) * 245);
      ctx.stroke();
    }

    // 4-Map Convergence Altar at (2640, 2060): Blood / Ash / Ice / Forest runes
    if (isCircleInViewBounds(2640, 2060, 110, viewBounds)) {
      ctx.translate(2640, 2060);
      ctx.fillStyle = mono ? "#1E293B" : "#151226";
      ctx.strokeStyle = mono ? "#CBD5E1" : "#FACC15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const realmColors = ["#F43F5E", "#FB923C", "#38BDF8", "#34D399"];
      for (let m = 0; m < 4; m++) {
        const ma = (Math.PI * m) / 2 + Math.PI / 4;
        ctx.fillStyle = mono ? "#CBD5E1" : realmColors[m];
        ctx.beginPath();
        ctx.arc(Math.cos(ma) * 28, Math.sin(ma) * 28, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.restore();
    }
  }

  // Bioluminescent Mushrooms (guide vs toxic lure trap with glowing spore rings)
  if (runtime?.mushrooms) {
    for (const m of runtime.mushrooms) {
      if (!isCircleInViewBounds(m.x, m.y, 75, viewBounds)) continue;
      const pulse = 0.55 + 0.45 * Math.sin(m.pulsePhase);
      const isGuide = m.kind === "guide";
      ctx.save();
      ctx.fillStyle = mono
        ? `rgba(203, 213, 225, ${0.15 + pulse * 0.1})`
        : isGuide
          ? `rgba(52, 211, 153, ${0.16 + pulse * 0.14})`
          : `rgba(217, 70, 239, ${0.16 + pulse * 0.16})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * (m.cooldown > 0 ? 0.55 : 1), 0, Math.PI * 2);
      ctx.fill();

      // Ring of small spore dots around mushroom cluster
      ctx.strokeStyle = isGuide ? "rgba(52, 211, 153, 0.32)" : "rgba(217, 70, 239, 0.32)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const pts = [
        { dx: 0, dy: -7, r: 10 },
        { dx: -11, dy: 4, r: 7 },
        { dx: 11, dy: 5, r: 6.5 },
      ];
      for (const p of pts) {
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(m.x + p.dx - 2.2, m.y + p.dy, 4.4, 9);
        ctx.fillStyle = mono ? "#CBD5E1" : isGuide ? "#10B981" : "#C026D3";
        ctx.beginPath();
        ctx.arc(m.x + p.dx, m.y + p.dy, p.r, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        // Glowing speckles on mushroom cap
        ctx.fillStyle = mono ? "#F8FAFC" : isGuide ? "#A7F3D0" : "#F5D0FE";
        ctx.beginPath();
        ctx.arc(m.x + p.dx - p.r * 0.3, m.y + p.dy - p.r * 0.45, 1.6, 0, Math.PI * 2);
        ctx.arc(m.x + p.dx + p.r * 0.25, m.y + p.dy - p.r * 0.35, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Sudden Erupting Root Traps
  if (runtime?.rootTraps) {
    for (const rt of runtime.rootTraps) {
      if (!isCircleInViewBounds(rt.x, rt.y, rt.radius + 30, viewBounds)) continue;
      if (rt.state === "cooldown") {
        ctx.strokeStyle = "rgba(52, 211, 153, 0.16)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rt.x, rt.y, rt.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (rt.state === "telegraph") {
        ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
        ctx.strokeStyle = "#FB7185";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(rt.x, rt.y, rt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(120, 53, 15, 0.45)";
        ctx.beginPath();
        ctx.arc(rt.x, rt.y, rt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#451A03";
        ctx.lineWidth = 5.5;
        for (let k = 0; k < 7; k++) {
          const a = (Math.PI * 2 * k) / 7 + 0.3;
          ctx.beginPath();
          ctx.moveTo(rt.x, rt.y);
          ctx.quadraticCurveTo(
            rt.x + Math.cos(a + 0.25) * rt.radius * 0.6,
            rt.y + Math.sin(a + 0.25) * rt.radius * 0.6,
            rt.x + Math.cos(a) * rt.radius,
            rt.y + Math.sin(a) * rt.radius
          );
          ctx.stroke();
        }
      }
    }
  }

  // Ownerless Trailing Footprints appearing behind the player
  if (runtime?.trailingFootprints) {
    for (const fp of runtime.trailingFootprints) {
      if (!isCircleInViewBounds(fp.x, fp.y, 24, viewBounds)) continue;
      const alpha = Math.max(0, 1 - fp.life / Math.max(0.1, fp.maxLife)) * 0.58;
      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.rotate(fp.angle);
      ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.8, 3.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Distant Hero Puppets in Doll Courtyard & Secret House (turn heads toward Duy!)
  if (isCircleInViewBounds(3440, 3020, 240, viewBounds)) {
    const spots = [
      { x: 3360, y: 2940, col: "#EF4444" },
      { x: 3440, y: 2920, col: "#A855F7" },
      { x: 3510, y: 2980, col: "#38BDF8" },
      { x: 3390, y: 3110, col: "#F59E0B" },
    ];
    for (const sp of spots) {
      const look =
        heroId === "duy" && player
          ? Math.atan2(player.y - sp.y, player.x - sp.x)
          : Math.PI * 0.5;
      drawHeroPuppetFigure(ctx, sp.x, sp.y, look, sp.col, 1.08, t, mono, true);
    }
  }
  if (isCircleInViewBounds(330, 1660, 240, viewBounds)) {
    const housePuppets = [
      { x: 250, y: 1610, col: "#EF4444" },
      { x: 300, y: 1595, col: "#A855F7" },
      { x: 350, y: 1595, col: "#38BDF8" },
      { x: 400, y: 1610, col: "#10B981" },
    ];
    for (const hp of housePuppets) {
      const look =
        heroId === "duy" && player
          ? Math.atan2(player.y - hp.y, player.x - hp.x)
          : Math.PI * 0.5;
      drawHeroPuppetFigure(ctx, hp.x, hp.y, look, hp.col, 0.98, t, mono, true);
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 2. STRUCTURES, TREES, SHRINES & INTERACTABLE LANDMARKS
// ---------------------------------------------------------------------------

export function renderGrudgeForestStructures(ctx, engine, t, viewBounds) {
  const perf = engine.getPerformanceProfile?.() || { tier: "high", effectiveTier: "high", enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const mono = Boolean(engine.player?.tin_monochrome_realm_timer > 0);
  const runtime = engine.grudgeForestRuntime;
  const progress = normalizeGrudgeForestProgress(engine.grudgeForestProgress);
  const obstacles = getActiveGrudgeForestObstacles(progress, runtime);
  const player = engine.player;

  ctx.save();
  for (const obs of obstacles) {
    if (!isRectVisible(obs, viewBounds, 140)) continue;

    if (obs.kind === "lake_basin") {
      continue; // rendered in floor layer
    } else if (obs.kind === "central_great_tree") {
      drawCentralSleepingGreatTree(ctx, obs, t, allowGlows, mono, perf);
    } else if (obs.kind === "ancient_trunk") {
      if (obs.w > 400 || obs.h > 400) {
        drawContinuousForestBorder(ctx, obs, t, viewBounds, mono, perf, allowGlows);
      } else {
        drawAncientForestTree(ctx, obs, t, mono, perf, allowGlows);
      }
    } else if (obs.kind === "maze_root_wall") {
      drawMazeRootWall(ctx, obs, t, allowGlows, mono);
    } else if (obs.kind === "stone_gate") {
      drawMegalithicGatePillar(ctx, obs, t, allowGlows, mono);
    } else if (obs.kind === "abandoned_house") {
      drawAbandonedWoodenHouse(ctx, obs, t, allowGlows, mono);
    } else if (obs.kind === "temple_wall") {
      drawDollTempleWall(ctx, obs, t, allowGlows, mono);
    } else if (obs.kind === "hidden_room_wall") {
      // Mossy ancient chamber stone masonry
      ctx.fillStyle = "rgba(2, 6, 12, 0.56)";
      ctx.fillRect(obs.x + 5, obs.y + 6, obs.w, obs.h);
      ctx.fillStyle = mono ? "#334155" : "#251E2E";
      ctx.strokeStyle = mono ? "#CBD5E1" : "#7C3AED";
      ctx.lineWidth = 2;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = mono ? "rgba(203,213,225,0.22)" : "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(obs.x + 8, obs.y + 4, Math.min(34, obs.w * 0.4), Math.min(12, obs.h * 0.4));
    } else if (obs.kind === "tombstone_cluster") {
      drawRootSwallowedTombstoneCluster(ctx, obs, t, allowGlows, mono);
    } else if (obs.kind === "living_vines") {
      const destruct = runtime?.destructibles?.find((d) => d.id === obs.destructibleId);
      drawLivingVines(ctx, obs, destruct, t, mono);
    } else if (obs.kind === "conditional_root_door") {
      ctx.fillStyle = mono ? "#1E293B" : "#3B0764";
      ctx.strokeStyle = mono ? "#E2E8F0" : "#E879F9";
      ctx.lineWidth = 2.6;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      // 3 glowing seal sigils
      const isHoriz = obs.w > obs.h;
      for (let s = 1; s <= 3; s++) {
        const sx = isHoriz ? obs.x + (obs.w * s) / 4 : obs.x + obs.w * 0.5;
        const sy = isHoriz ? obs.y + obs.h * 0.5 : obs.y + (obs.h * s) / 4;
        ctx.fillStyle = mono ? "#F8FAFC" : "#F0ABFC";
        ctx.beginPath();
        ctx.arc(sx, sy, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obs.kind === "fallen_log") {
      ctx.save();
      ctx.fillStyle = "rgba(2, 6, 12, 0.52)";
      ctx.beginPath();
      ctx.roundRect(obs.x + 5, obs.y + 6, obs.w, obs.h, 12);
      ctx.fill();
      ctx.fillStyle = mono ? "#475569" : "#3F2310";
      ctx.strokeStyle = mono ? "#CBD5E1" : "#78350F";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 12);
      ctx.fill();
      ctx.stroke();
      // Bark grain ridges & moss cushion
      ctx.strokeStyle = "#1E1008";
      ctx.lineWidth = 1.4;
      const horiz = obs.w > obs.h;
      if (horiz) {
        for (let lx = obs.x + 18; lx < obs.x + obs.w - 14; lx += 22) {
          ctx.beginPath();
          ctx.moveTo(lx, obs.y + 5);
          ctx.lineTo(lx + 8, obs.y + obs.h - 5);
          ctx.stroke();
        }
      } else {
        for (let ly = obs.y + 18; ly < obs.y + obs.h - 14; ly += 22) {
          ctx.beginPath();
          ctx.moveTo(obs.x + 5, ly);
          ctx.lineTo(obs.x + obs.w - 5, ly + 8);
          ctx.stroke();
        }
      }
      ctx.fillStyle = mono ? "rgba(203,213,225,0.28)" : "rgba(16, 185, 129, 0.38)";
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w * 0.45, obs.y + obs.h * 0.45, Math.min(24, obs.w * 0.25), Math.min(12, obs.h * 0.25), 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Ambient Woodland Lantern Posts at Zone Landmarks & Paths
  const trailLanterns = [
    { x: 350, y: 3440, col: "emerald" },
    { x: 580, y: 3440, col: "emerald" },
    { x: 675, y: 2770, col: "amber" },
    { x: 830, y: 2330, col: "amber" },
    { x: 1095, y: 1920, col: "amber" },
    { x: 2310, y: 790, col: "violet" },
    { x: 2410, y: 790, col: "violet" },
    { x: 3540, y: 2955, col: "rose" },
    { x: 3540, y: 3115, col: "rose" },
    { x: 2150, y: 3410, col: "violet" },
    { x: 2210, y: 2130, col: "emerald" },
    { x: 2510, y: 2130, col: "violet" },
  ];
  for (const tl of trailLanterns) {
    if (isCircleInViewBounds(tl.x, tl.y, 60, viewBounds)) {
      drawForestLanternPost(ctx, tl.x, tl.y, tl.col, t, allowGlows, mono, tl.x * 0.03);
    }
  }

  // Falling Tree Warning indicators
  if (runtime?.fallingTrees) {
    for (const ft of runtime.fallingTrees) {
      if (ft.state === "warning" && isRectVisible(ft, viewBounds, 80)) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2.4;
        ctx.fillRect(ft.x, ft.y, ft.w, ft.h);
        ctx.strokeRect(ft.x, ft.y, ft.w, ft.h);
      }
    }
  }

  // Observing Trees with Detailed Bark & Slit Eyes Tracking the Player
  if (runtime?.observingTrees) {
    for (const tree of runtime.observingTrees) {
      if (!isCircleInViewBounds(tree.x, tree.y, 75, viewBounds)) continue;
      ctx.save();
      ctx.translate(tree.x, tree.y);
      ctx.scale(tree.scale, tree.scale);

      // Shadow
      ctx.fillStyle = "rgba(2, 6, 10, 0.56)";
      ctx.beginPath();
      ctx.ellipse(5, 8, 30, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Root flare + bark trunk
      ctx.fillStyle = mono ? "#334155" : "#1A1412";
      ctx.strokeStyle = mono ? "#94A3B8" : "#3E2E26";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Canopy halo behind trunk top
      ctx.fillStyle = mono ? "rgba(51, 65, 85, 0.65)" : "rgba(11, 41, 31, 0.72)";
      ctx.beginPath();
      ctx.arc(-10, -14, 18, 0, Math.PI * 2);
      ctx.arc(10, -14, 18, 0, Math.PI * 2);
      ctx.fill();

      if (tree.blinkTimer > 0) {
        const px = Math.cos(tree.eyeAngle) * 4.5;
        const py = Math.sin(tree.eyeAngle) * 4.5;
        ctx.fillStyle = mono ? "#CBD5E1" : "#A855F7";
        ctx.beginPath();
        ctx.ellipse(-7, -2, 4.6, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(7, -2, 4.6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#F8FAFC";
        ctx.beginPath();
        ctx.arc(-7 + px * 0.4, -2 + py * 0.4, 1.6, 0, Math.PI * 2);
        ctx.arc(7 + px * 0.4, -2 + py * 0.4, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Rotatable Carved Stone Guardian Statues in Zone 5
  if (runtime?.statues) {
    const dirAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    for (const st of runtime.statues) {
      if (!isCircleInViewBounds(st.x, st.y, 75, viewBounds)) continue;
      const aligned = st.angleIndex === st.targetIndex;
      ctx.save();
      ctx.translate(st.x, st.y);

      ctx.fillStyle = "rgba(2, 6, 12, 0.56)";
      ctx.beginPath();
      ctx.ellipse(4, 7, 29, 23, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stepped octagonal mossy stone plinth
      ctx.fillStyle = aligned ? "#064E3B" : "#1E293B";
      ctx.strokeStyle = aligned ? "#34D399" : "#94A3B8";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating Owl-Idol Head & Carved Directional Arrow
      const ang = dirAngles[st.angleIndex % 4];
      ctx.rotate(ang);
      ctx.fillStyle = aligned ? "#10B981" : "#475569";
      ctx.strokeStyle = aligned ? "#A7F3D0" : "#E2E8F0";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(21, 0);
      ctx.lineTo(-9, -11);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing directional eye-gem
      ctx.fillStyle = aligned ? "#6EE7B7" : "#FDE047";
      ctx.beginPath();
      ctx.arc(6, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // EE1 Rogue Puppet Walking on its Own
  if (runtime?.roguePuppet?.active && !runtime.roguePuppet.arrived) {
    const rp = runtime.roguePuppet;
    if (isCircleInViewBounds(rp.x, rp.y, 60, viewBounds)) {
      const bob = Math.sin(rp.stepPhase) * 3;
      drawHeroPuppetFigure(ctx, rp.x, rp.y + bob, rp.angle, "#F472B6", 1.18, t, mono, true);
      ctx.fillStyle = "rgba(244, 114, 182, 0.92)";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("...", rp.x, rp.y - 28 + bob);
    }
  }

  // Distant Vanishing Silhouettes with Tattered Forest Cloaks
  if (runtime?.distantSilhouettes) {
    for (const silh of runtime.distantSilhouettes) {
      if (silh.dismissed || !isCircleInViewBounds(silh.x, silh.y, 90, viewBounds)) continue;
      ctx.save();
      ctx.globalAlpha = silh.alpha * (0.65 + 0.25 * Math.sin(t * 2));
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.arc(silh.x, silh.y - 25, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(silh.x - 15, silh.y + 20);
      ctx.lineTo(silh.x - 9, silh.y - 12);
      ctx.lineTo(silh.x + 9, silh.y - 12);
      ctx.lineTo(silh.x + 15, silh.y + 20);
      ctx.lineTo(silh.x + 5, silh.y + 14);
      ctx.lineTo(silh.x, silh.y + 21);
      ctx.lineTo(silh.x - 6, silh.y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#C084FC";
      ctx.fillRect(silh.x - 4, silh.y - 27, 2.2, 2.2);
      ctx.fillRect(silh.x + 2, silh.y - 27, 2.2, 2.2);
      ctx.restore();
    }
  }

  // Translucent Phantoms
  if (runtime?.phantoms) {
    for (const ph of runtime.phantoms) {
      if (!isCircleInViewBounds(ph.x, ph.y, 70, viewBounds)) continue;
      ctx.save();
      ctx.globalAlpha = ph.alpha;
      ctx.fillStyle = ph.kind === "valley_echo" ? "#60A5FA" : "#C084FC";
      ctx.beginPath();
      ctx.arc(ph.x, ph.y - 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(ph.x - 8, ph.y - 2, 16, 20);
      ctx.restore();
    }
  }

  // Interactable Nodes + Solitary Moving Root after Wave 27 Boss
  const nearest = player
    ? findNearestGrudgeForestInteractable(player.x, player.y, progress, runtime)
    : null;
  const rootVisible = Boolean(
    progress.bossClearedAmbiguous || runtime?.bossDefeatedThisRun || runtime?.endingRootSpawned
  );

  for (const node of GRUDGE_FOREST_INTERACTABLES) {
    if (node.id === "ending_moving_root" && !rootVisible) continue;
    if (node.id === "forest_heart_boss_altar" && rootVisible) continue;
    if (!isCircleInViewBounds(node.x, node.y, 90, viewBounds)) continue;

    if (node.id === "ending_moving_root") {
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      const curl = Math.sin(t * 1.3) * 14;
      ctx.beginPath();
      ctx.moveTo(-28, 12);
      ctx.quadraticCurveTo(0, -18 + curl, 28, 8 - curl * 0.5);
      ctx.stroke();
      ctx.fillStyle = "rgba(192, 132, 252, 0.72)";
      ctx.beginPath();
      ctx.arc(0, 0, 5.5 + Math.sin(t * 2) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      const isNear = nearest?.id === node.id;
      const ringColor =
        node.kind === "ee1"
          ? "#F472B6"
          : node.kind === "ee2" || node.kind === "ee6"
            ? "#A855F7"
            : node.kind === "ee4"
              ? "#60A5FA"
              : node.kind === "ee5"
                ? "#FACC15"
                : "#34D399";
      ctx.save();
      ctx.strokeStyle = isNear ? "#FDE047" : ringColor;
      ctx.globalAlpha = isNear ? 0.94 : 0.48 + 0.2 * Math.sin(t * 2.5 + node.x);
      ctx.lineWidth = isNear ? 2.8 : 1.6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 24 + (isNear ? 6 : 0), 0, Math.PI * 2);
      ctx.stroke();

      if (node.kind === "signpost") {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#4A3222";
        ctx.fillRect(node.x - 4, node.y - 25, 8, 34);
        ctx.strokeStyle = "#15803D";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(node.x - 5, node.y + 8);
        ctx.quadraticCurveTo(node.x, node.y - 2, node.x + 6, node.y + 8);
        ctx.stroke();

        const dir = (runtime?.signpostVariant || 0) % 2 === 0 ? 1 : -1;
        ctx.fillStyle = "#785337";
        ctx.strokeStyle = "#1E120C";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(node.x - 18 * dir, node.y - 21);
        ctx.lineTo(node.x + 15 * dir, node.y - 21);
        ctx.lineTo(node.x + 24 * dir, node.y - 14);
        ctx.lineTo(node.x + 15 * dir, node.y - 7);
        ctx.lineTo(node.x - 18 * dir, node.y - 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

export function renderGrudgeForestPlayerEffects(ctx, player, t, runtime) {
  if (!player) return;
  if ((player.rootTimer || 0) > 0) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = "#34D399";
    ctx.lineWidth = 3.2;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 2 + Math.sin(t * 3 + i) * 0.15;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, 14);
      ctx.quadraticCurveTo(Math.cos(a) * 24, 0, Math.cos(a) * 14, -12);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (runtime?.inSilenceZone) {
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function renderGrudgeForestBossEntity(ctx, boss, t) {
  if (!boss) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);

  const pulse = 0.5 + 0.5 * Math.sin(t * 3.6);
  // Multi-ring spore aura
  ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius + 26 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(192, 132, 252, 0.34)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius + 18 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();

  // Writhing colossal root tentacles
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + t * 0.55;
    const wave = Math.sin(t * 4.5 + i * 1.3) * 15;
    ctx.strokeStyle = "#1E1612";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(a) * 34 + wave * 0.4,
      Math.sin(a) * 34,
      Math.cos(a) * (boss.radius + 28) + wave,
      Math.sin(a) * (boss.radius + 28)
    );
    ctx.stroke();

    ctx.strokeStyle = i % 2 === 0 ? "#34D399" : "#C084FC";
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Bark carapace body
  ctx.fillStyle = "#171C19";
  ctx.strokeStyle = "#34D399";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI * 2 * k) / 10 + Math.sin(t * 1.4 + k) * 0.05;
    const r = boss.radius * (k % 2 === 0 ? 1.08 : 0.86);
    if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hollow purple-jade core face & glowing eyes
  ctx.fillStyle = "#05070A";
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius * 0.52, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(192, 132, 252, ${0.72 + pulse * 0.28})`;
  ctx.beginPath();
  ctx.ellipse(-10, -4, 6.2, 3.5, 0.25, 0, Math.PI * 2);
  ctx.ellipse(10, -4, 6.2, 3.5, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 3. ATMOSPHERE LAYER: Moonbeams, Fireflies, Tumbling Leaves, Mist, Vignette
// ---------------------------------------------------------------------------

export function renderGrudgeForestAtmosphere(ctx, engine, t, viewW, viewH) {
  const runtime = engine.grudgeForestRuntime;
  if (!runtime) return;

  const perf = engine.getPerformanceProfile?.() || { tier: "high", effectiveTier: "high", enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  ctx.save();

  // Subtle diagonal crepuscular moonbeams filtering through the ancient canopy
  if (allowGlows && perf.effectiveTier !== "saver") {
    for (let ray = 0; ray < 3; ray++) {
      const rx = ((ray * 430 + Math.sin(t * 0.22 + ray) * 70) % (viewW + 260)) - 130;
      const g = ctx.createLinearGradient(rx, 0, rx + 190, viewH * 0.85);
      g.addColorStop(0, ray % 2 === 0 ? "rgba(167, 243, 208, 0.055)" : "rgba(216, 180, 254, 0.05)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx - 45, 0);
      ctx.lineTo(rx + 65, 0);
      ctx.lineTo(rx + 290, viewH);
      ctx.lineTo(rx + 120, viewH);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Tumbling Falling Cursed Woodland Leaves
  const leafCount = perf.tier === "low" ? 8 : perf.tier === "medium" ? 16 : 24;
  for (let i = 0; i < leafCount; i++) {
    const lx = ((i * 193 + Math.sin(t * 0.9 + i) * 55 + t * (16 + (i % 3) * 7)) % (viewW + 80)) - 40;
    const ly = ((i * 137 + t * (26 + (i % 4) * 8)) % (viewH + 60)) - 30;
    const rot = t * (1.2 + (i % 3) * 0.4) + i;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle =
      i % 3 === 0
        ? "rgba(52, 211, 153, 0.38)"
        : i % 3 === 1
          ? "rgba(192, 132, 252, 0.34)"
          : "rgba(217, 119, 6, 0.36)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.2, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Two-Stage Bioluminescent Fireflies (soft halo + bright core, ZERO shadowBlur)
  const fireflyCount = perf.tier === "low" ? 16 : perf.tier === "medium" ? 28 : 44;
  for (let i = 0; i < fireflyCount; i++) {
    const fx =
      ((i * 211.7 + Math.sin(t * 0.65 + i) * 60 + t * (12 + (i % 4) * 6)) % (viewW + 80)) - 40;
    const fy =
      ((i * 149.3 + Math.cos(t * 0.55 + i * 1.4) * 44 + t * (8 + (i % 3) * 5)) % (viewH + 60)) - 30;
    const blink = 0.25 + 0.65 * Math.max(0, Math.sin(t * 2.3 + i * 1.7));
    const isViolet = i % 3 === 0;
    ctx.fillStyle = isViolet
      ? `rgba(192, 132, 252, ${blink * 0.26})`
      : `rgba(163, 230, 53, ${blink * 0.26})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 6.2 + (i % 2) * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isViolet ? `rgba(233, 213, 255, ${blink})` : `rgba(217, 249, 157, ${blink})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 2 + (i % 2) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layered drifting green & dark-violet forest mist
  if (allowGlows) {
    for (let m = 0; m < 4; m++) {
      const mx = ((t * (14 + m * 6) + m * 310) % (viewW + 320)) - 160;
      const my = (m * 190 + Math.sin(t * 0.3 + m) * 40) % viewH;
      const grad = ctx.createRadialGradient(mx, my, 20, mx, my, 230);
      grad.addColorStop(
        0,
        m % 2 === 0 ? "rgba(16, 185, 129, 0.085)" : "rgba(126, 34, 206, 0.095)"
      );
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // Peripheral Vignette (thickens subtly inside Fog Pockets)
  const fogDim = engine.grudgeForestVisionDim || 0;
  const vigAlpha = Math.min(0.74, 0.28 + fogDim * 0.65);
  const vg = ctx.createRadialGradient(
    viewW * 0.5,
    viewH * 0.5,
    Math.min(viewW, viewH) * (0.34 - fogDim * 0.14),
    viewW * 0.5,
    viewH * 0.5,
    Math.max(viewW, viewH) * 0.72
  );
  vg.addColorStop(0, "rgba(2, 8, 6, 0)");
  vg.addColorStop(1, `rgba(4, 10, 14, ${vigAlpha})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, viewW, viewH);

  // Brief False Memory Flashes mimicking Map 1 / Map 2 / Map 3
  if (runtime.falseMemoryFlash?.kind && runtime.falseMemoryFlash.timer > 0) {
    const a = Math.min(0.24, runtime.falseMemoryFlash.timer * 0.14);
    ctx.fillStyle =
      runtime.falseMemoryFlash.kind === "map1_blood"
        ? `rgba(225, 29, 72, ${a})`
        : runtime.falseMemoryFlash.kind === "map2_ash"
          ? `rgba(234, 88, 12, ${a})`
          : `rgba(56, 189, 248, ${a})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  if (runtime.darknessPulseSec > 0) {
    const fade = Math.min(0.8, runtime.darknessPulseSec * 0.28);
    ctx.fillStyle = `rgba(3, 5, 10, ${fade})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  ctx.restore();
}
