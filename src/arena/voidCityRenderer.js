import { isCircleInViewBounds } from "./combatLogic";
import {
  VOID_CITY_WIDTH,
  VOID_CITY_HEIGHT,
  VOID_CITY_ZONES,
  VOID_CITY_CORRIDORS,
  VOID_CITY_INTERACTABLES,
  VOID_CITY_CHESTS,
  RELIC2_TOMB_STATUES,
  RELIC4_MASKS,
  VOID_CITY_CONSTELLATION_SYMBOLS,
  getActiveVoidCityObstacles,
  getVoidCityZoneAt,
  findNearestVoidCityInteractable,
  normalizeVoidCityProgress,
  isRelic6Accessible,
} from "./voidCityMap";

export function getVoidCityZoneLabel(x, y, lang = "vi") {
  const z = getVoidCityZoneAt(x, y);
  return lang === "en" ? `Area ${z.order} · ${z.name.en}` : `Khu ${z.order} · ${z.name.vi}`;
}

// Strictly ZERO ctx.shadowBlur usage for smooth 60fps mobile & desktop Canvas 2D performance.

function getBoundsEdges(vb) {
  if (!vb) {
    return { minX: 0, maxX: VOID_CITY_WIDTH, minY: 0, maxY: VOID_CITY_HEIGHT };
  }
  return {
    minX: vb.minX ?? vb.left ?? 0,
    maxX: vb.maxX ?? vb.right ?? VOID_CITY_WIDTH,
    minY: vb.minY ?? vb.top ?? 0,
    maxY: vb.maxY ?? vb.bottom ?? VOID_CITY_HEIGHT,
  };
}

function isRectVisible(r, vb, pad = 160) {
  const b = getBoundsEdges(vb);
  return (
    r.x + r.w >= b.minX - pad &&
    r.x <= b.maxX + pad &&
    r.y + r.h >= b.minY - pad &&
    r.y <= b.maxY + pad
  );
}

function hashCell(ix, iy) {
  let n = Math.imul(ix + 59, 73856093) ^ Math.imul(iy + 113, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

// ---------------------------------------------------------------------------
// REUSABLE GOTHIC & VOID CITY ARCHITECTURAL PRIMITIVES
// ---------------------------------------------------------------------------

function drawVoidLampPost(ctx, lamp, t, allowGlows, mono) {
  const flicker = 0.68 + 0.32 * Math.sin(t * 5.8 + lamp.phase * 4.1) * Math.cos(t * 2.1 + lamp.phase);
  ctx.save();
  ctx.translate(lamp.x, lamp.y);

  // Cast ground shadow
  ctx.fillStyle = "rgba(2, 4, 10, 0.58)";
  ctx.beginPath();
  ctx.ellipse(4, 8, 13, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warm pale-gold & cold-azure lantern light pool
  if (!mono && allowGlows) {
    const lg = ctx.createRadialGradient(0, -6, 4, 0, -6, lamp.radius);
    lg.addColorStop(0, `rgba(253, 230, 138, ${0.24 * flicker})`);
    lg.addColorStop(0.45, `rgba(56, 189, 248, ${0.12 * flicker})`);
    lg.addColorStop(0.75, `rgba(168, 85, 247, ${0.05 * flicker})`);
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(0, -6, lamp.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Carved obsidian plinth base
  ctx.fillStyle = mono ? "#475569" : "#1E293B";
  ctx.strokeStyle = mono ? "#CBD5E1" : "#475569";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tall Gothic iron lamp neck curving into suspended lantern cage
  ctx.strokeStyle = mono ? "#94A3B8" : "#334155";
  ctx.lineWidth = 3.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.quadraticCurveTo(-2, -14, 0, -26);
  ctx.quadraticCurveTo(3, -32, 9, -29);
  ctx.stroke();

  // Lantern iron housing
  const sway = Math.sin(t * 1.8 + lamp.phase) * 1.1;
  const lx = 9 + sway;
  const ly = -20;
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(9, -29);
  ctx.lineTo(lx, ly - 5);
  ctx.stroke();

  ctx.fillStyle = "#0B101B";
  ctx.strokeStyle = mono ? "#E2E8F0" : "#94A3B8";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(lx - 5.5, ly - 5, 11, 12, 2);
  ctx.fill();
  ctx.stroke();

  // Lantern glass core (pale gold wisp)
  ctx.fillStyle = mono ? "#F8FAFC" : `rgba(253, 230, 138, ${0.72 + 0.28 * flicker})`;
  ctx.beginPath();
  ctx.arc(lx, ly + 1, 3.2 * (0.85 + 0.15 * flicker), 0, Math.PI * 2);
  ctx.fill();

  // Pointed spire cap
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.moveTo(lx - 7, ly - 5);
  ctx.lineTo(lx, ly - 11);
  ctx.lineTo(lx + 7, ly - 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawGothicMasonrySlab(ctx, x, y, w, h, faceH, topCol, faceCol, strokeCol, runeCol, mono, seed = 0) {
  const topH = Math.max(4, h - faceH);
  // SE cast drop shadow
  ctx.fillStyle = "rgba(2, 4, 10, 0.65)";
  ctx.fillRect(x + 7, y + 9, w, h);

  // 2.5D vertical southern face + horizontal top slab
  ctx.fillStyle = faceCol;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = topCol;
  ctx.fillRect(x + 1, y + 1, Math.max(2, w - 2), topH);

  // Running-bond Gothic ashlar seams
  ctx.strokeStyle = "rgba(2, 6, 18, 0.56)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  const rowH = topH > 48 ? 22 : 16;
  const rows = Math.max(1, Math.floor(topH / rowH));
  for (let r = 1; r < rows; r++) {
    const ry = y + (topH * r) / rows;
    ctx.moveTo(x + 2, ry);
    ctx.lineTo(x + w - 2, ry);
  }
  const brickW = 30;
  for (let r = 0; r < rows; r++) {
    const ry0 = y + (topH * r) / rows + 1;
    const ry1 = y + (topH * (r + 1)) / rows;
    const stagger = r % 2 === 1 ? brickW * 0.5 : 0;
    for (let bx = x + 16 + stagger; bx < x + w - 10; bx += brickW) {
      ctx.moveTo(bx, ry0);
      ctx.lineTo(bx, ry1);
    }
  }
  // Ledge ridge & southern facade buttresses
  ctx.moveTo(x, y + h - faceH);
  ctx.lineTo(x + w, y + h - faceH);
  for (let bx = x + 22; bx < x + w - 10; bx += 28) {
    ctx.moveTo(bx, y + h - faceH);
    ctx.lineTo(bx, y + h - 1);
  }
  ctx.stroke();

  // Subtle silver-slate highlights & hairline cracks
  const cols = Math.max(1, Math.floor(w / 48));
  for (let i = 0; i < cols; i++) {
    const hv = hashCell(Math.round(x + i * 31 + seed), Math.round(y));
    if (hv > 0.56) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
      ctx.fillRect(x + 4 + i * (w / cols), y + 4, (w / cols) * 0.5, Math.min(10, topH * 0.4));
    }
  }

  // Top edge moonlight rim & rune trim
  ctx.strokeStyle = mono ? "#CBD5E1" : strokeCol;
  ctx.lineWidth = 2.1;
  ctx.strokeRect(x, y, w, h);

  if (runeCol && w >= 48 && topH >= 18) {
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.35)" : runeCol;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 6, y + 6, w - 12, Math.max(6, topH - 12));
  }
}

function drawFallenParchmentScatter(ctx, x, y, rot, seed, mono) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = mono ? "rgba(203, 213, 225, 0.38)" : seed > 0.5 ? "rgba(226, 232, 240, 0.42)" : "rgba(253, 230, 138, 0.36)";
  ctx.fillRect(-6, -8, 12, 16);
  ctx.strokeStyle = "rgba(15, 23, 42, 0.5)";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-6, -8, 12, 16);
  // Faint ink script lines
  ctx.fillStyle = "rgba(30, 41, 59, 0.55)";
  ctx.fillRect(-4, -5, 8, 1.3);
  ctx.fillRect(-4, -1.5, 6.5, 1.3);
  ctx.fillRect(-4, 2, 7.5, 1.3);
  ctx.restore();
}

function drawFacelessMarbleStatue(ctx, x, y, lookAngle, scale = 1, accent = "#CBD5E1", glowRing = false, t = 0, mono = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Drop shadow
  ctx.fillStyle = "rgba(2, 4, 10, 0.62)";
  ctx.beginPath();
  ctx.ellipse(4, 10, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Octagonal stone plinth
  ctx.fillStyle = mono ? "#334155" : "#182032";
  ctx.strokeStyle = mono ? "#CBD5E1" : accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (glowRing) {
    ctx.strokeStyle = mono ? "rgba(226,232,240,0.4)" : `rgba(253, 230, 138, ${0.42 + 0.25 * Math.sin(t * 2.8)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.rotate(lookAngle);
  // Draped stone cloak shoulders
  ctx.fillStyle = mono ? "#64748B" : "#475569";
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-2, 0, 11, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Smooth erased faceless head
  ctx.fillStyle = mono ? "#CBD5E1" : "#CBD5E1";
  ctx.beginPath();
  ctx.arc(3, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Blank carved-out visor plane where eyes/mouth were erased
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.roundRect(4, -5.5, 6.5, 11, 2);
  ctx.fill();

  ctx.restore();
}

function drawTheaterMaskIcon(ctx, x, y, fillCol, strokeCol, cracked = false, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = fillCol;
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Blank eye slits
  ctx.fillStyle = "#05070D";
  ctx.fillRect(-4.2, -2.5, 3, 2);
  ctx.fillRect(1.2, -2.5, 3, 2);
  if (cracked) {
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-2, -8);
    ctx.lineTo(1, -2);
    ctx.lineTo(-1, 5);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 1. FLOOR LAYER: Per-Zone Gothic Masonry, Canals, Bridges, Mirror Pool,
//    Clockwork Arena, Empty Theater Amphitheater, First-World Palace & Sanctum
// ---------------------------------------------------------------------------

export function drawVoidCityFloorScene(ctx, engine, t, viewBounds) {
  const runtime = engine.voidCityRuntime;
  const progress = normalizeVoidCityProgress(engine.voidCityProgress);
  const b = getBoundsEdges(viewBounds);
  const perf = engine.getPerformanceProfile?.() || { enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const mono = Boolean(engine.player?.tin_monochrome_realm_timer > 0);

  // Base obsidian void slate
  ctx.fillStyle = "#05060B";
  ctx.fillRect(b.minX - 60, b.minY - 60, b.maxX - b.minX + 120, b.maxY - b.minY + 120);

  // Zone background washes + distinct floor stone masonry & weathered scattered parchment
  for (const z of VOID_CITY_ZONES) {
    if (!isRectVisible(z.rect, viewBounds, 80)) continue;
    ctx.fillStyle = mono
      ? "#0F172A"
      : z.id === "zone_1"
        ? "#0A0D16"
        : z.id === "zone_2"
          ? "#0C101B"
          : z.id === "zone_3"
            ? "#08101D"
            : z.id === "zone_4"
              ? "#0C1121"
              : z.id === "zone_5"
                ? "#110B1F"
                : z.id === "zone_6"
                  ? "#160B1D"
                  : z.id === "zone_7"
                    ? "#12101A"
                    : "#080714";
    ctx.fillRect(z.rect.x, z.rect.y, z.rect.w, z.rect.h);

    // Zone-specific ambient floor sheen (radial, zero shadowBlur)
    if (!mono && allowGlows && isCircleInViewBounds(z.center.x, z.center.y, 680, viewBounds)) {
      const zg = ctx.createRadialGradient(z.center.x, z.center.y, 20, z.center.x, z.center.y, 560);
      zg.addColorStop(
        0,
        z.id === "zone_5"
          ? "rgba(168, 85, 247, 0.08)"
          : z.id === "zone_6"
            ? "rgba(192, 132, 252, 0.085)"
            : z.id === "zone_7"
              ? "rgba(253, 230, 138, 0.07)"
              : z.id === "zone_8"
                ? "rgba(56, 189, 248, 0.09)"
                : "rgba(148, 163, 184, 0.05)"
      );
      zg.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = zg;
      ctx.beginPath();
      ctx.arc(z.center.x, z.center.y, 560, 0, Math.PI * 2);
      ctx.fill();
    }

    // Running-bond Gothic flagstone grid & weathered slate variation inside viewBounds
    const stepX = z.id === "zone_4" || z.id === "zone_7" ? 80 : 100;
    const stepY = z.id === "zone_4" || z.id === "zone_7" ? 80 : 100;
    const gx0 = Math.max(z.rect.x, Math.floor(b.minX / stepX) * stepX);
    const gx1 = Math.min(z.rect.x + z.rect.w, Math.ceil(b.maxX / stepX) * stepX);
    const gy0 = Math.max(z.rect.y, Math.floor(b.minY / stepY) * stepY);
    const gy1 = Math.min(z.rect.y + z.rect.h, Math.ceil(b.maxY / stepY) * stepY);

    for (let y = gy0; y < gy1; y += stepY) {
      const rowIdx = Math.round(y / stepY);
      const stagger = rowIdx % 2 === 1 ? stepX * 0.5 : 0;
      for (let x = gx0; x < gx1; x += stepX) {
        const hv = hashCell(Math.round(x / stepX), rowIdx);
        if (hv > 0.72) {
          ctx.fillStyle = z.id === "zone_7" ? "rgba(253, 230, 138, 0.035)" : "rgba(148, 163, 184, 0.045)";
          ctx.fillRect(x + 2, y + 2, stepX - 4, stepY - 4);
        } else if (hv < 0.14) {
          ctx.fillStyle = "rgba(3, 5, 12, 0.32)";
          ctx.fillRect(x + 2, y + 2, stepX - 4, stepY - 4);
        }
        // Decorative diamond rosette inlay in Library & Palace
        if ((z.id === "zone_4" || z.id === "zone_7") && hv > 0.86) {
          const cx = x + stepX * 0.5;
          const cy = y + stepY * 0.5;
          ctx.strokeStyle = z.id === "zone_7" ? "rgba(253, 230, 138, 0.14)" : "rgba(96, 165, 250, 0.14)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 10);
          ctx.lineTo(cx + 10, cy);
          ctx.lineTo(cx, cy + 10);
          ctx.lineTo(cx - 10, cy);
          ctx.closePath();
          ctx.stroke();
        }
        // Occasional fallen archival page in Library, Palace, or Empty Town
        if ((z.id === "zone_3" || z.id === "zone_4" || z.id === "zone_7") && hv > 0.91 && !isRectVisible({ x: 3800, y: 800, w: 200, h: 200 }, { minX: x, maxX: x + 20, minY: y, maxY: y + 20 }, 0)) {
          drawFallenParchmentScatter(ctx, x + 26 + stagger * 0.3, y + 32, (hv - 0.91) * 28, hv * 7 % 1, mono);
        }
      }
    }

    // Crisp flagstone joints
    ctx.strokeStyle =
      z.id === "zone_7"
        ? "rgba(253, 230, 138, 0.075)"
        : z.id === "zone_5" || z.id === "zone_6"
          ? "rgba(192, 132, 252, 0.07)"
          : "rgba(148, 163, 184, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = gx0; x <= gx1; x += stepX) {
      ctx.moveTo(x, gy0);
      ctx.lineTo(x, gy1);
    }
    for (let y = gy0; y <= gy1; y += stepY) {
      ctx.moveTo(gx0, y);
      ctx.lineTo(gx1, y);
    }
    ctx.stroke();
  }

  // Deep Abyssal Void Canals separating Palace & Heart of the Void (with shimmering starlight currents)
  const canals = [
    { x: 2860, y: 1250, w: 280, h: 2750 },
    { x: 3140, y: 1700, w: 1660, h: 200 },
  ];
  for (const c of canals) {
    if (!isRectVisible(c, viewBounds, 80)) continue;
    ctx.fillStyle = "#020308";
    ctx.fillRect(c.x, c.y, c.w, c.h);

    // Stone quay border
    ctx.strokeStyle = mono ? "#64748B" : "rgba(56, 189, 248, 0.28)";
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x + 6, c.y + 6, Math.max(4, c.w - 12), Math.max(4, c.h - 12));

    // Drifting abyssal current ripples & drowned starlight glints
    const isVert = c.h > c.w;
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.14)" : "rgba(56, 189, 248, 0.16)";
    ctx.lineWidth = 1.4;
    if (isVert) {
      const yStart = Math.max(c.y + 20, Math.floor(b.minY / 80) * 80);
      const yEnd = Math.min(c.y + c.h - 20, b.maxY + 40);
      for (let ry = yStart; ry <= yEnd; ry += 80) {
        const wave = Math.sin(t * 1.4 + ry * 0.02) * 18;
        ctx.beginPath();
        ctx.moveTo(c.x + 48, ry + wave * 0.3);
        ctx.quadraticCurveTo(c.x + c.w * 0.5, ry - 12 + wave, c.x + c.w - 48, ry + wave * 0.3);
        ctx.stroke();
      }
    } else {
      const xStart = Math.max(c.x + 20, Math.floor(b.minX / 90) * 90);
      const xEnd = Math.min(c.x + c.w - 20, b.maxX + 40);
      for (let rx = xStart; rx <= xEnd; rx += 90) {
        const wave = Math.cos(t * 1.4 + rx * 0.02) * 14;
        ctx.beginPath();
        ctx.moveTo(rx, c.y + 38);
        ctx.quadraticCurveTo(rx + wave, c.y + c.h * 0.5, rx, c.y + c.h - 38);
        ctx.stroke();
      }
    }
  }

  // Main Boulevards, Alleys, Canal Stone Bridges, and Underground Catacombs
  for (const corr of VOID_CITY_CORRIDORS) {
    if (!isRectVisible(corr, viewBounds, 100)) continue;
    if (corr.kind === "underground_tunnel") {
      ctx.fillStyle = "#0B0E1D";
      ctx.fillRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = mono ? "#CBD5E1" : "rgba(168, 85, 247, 0.52)";
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 2.2;
      ctx.strokeRect(corr.x + 3, corr.y + 3, corr.w - 6, corr.h - 6);
      ctx.setLineDash([]);
      // Catacomb glowing stepping-rune stones along floor
      for (let sx = Math.max(corr.x + 55, Math.floor(b.minX / 110) * 110); sx < Math.min(corr.x + corr.w - 40, b.maxX + 60); sx += 110) {
        ctx.fillStyle = mono ? "rgba(226, 232, 240, 0.16)" : "rgba(192, 132, 252, 0.16)";
        ctx.beginPath();
        ctx.ellipse(sx, corr.y + corr.h * 0.5, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = mono ? "#E2E8F0" : "rgba(192, 132, 252, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // Archway threshold markers at west & east exits
      for (const ex of [corr.x + 8, corr.x + corr.w - 22]) {
        ctx.fillStyle = "#1E1B4B";
        ctx.strokeStyle = "#A855F7";
        ctx.lineWidth = 2;
        ctx.fillRect(ex, corr.y + 6, 14, corr.h - 12);
        ctx.strokeRect(ex, corr.y + 6, 14, corr.h - 12);
      }
    } else if (corr.kind === "canal_bridge") {
      // Drop shadow onto abyssal canal water
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(corr.x + 8, corr.y + 10, corr.w, corr.h);
      ctx.fillStyle = "#1A2233";
      ctx.fillRect(corr.x, corr.y, corr.w, corr.h);
      // Heavy bridge paving seams
      const horiz = corr.w > corr.h;
      ctx.strokeStyle = "rgba(15, 23, 42, 0.65)";
      ctx.lineWidth = 1.6;
      if (horiz) {
        for (let px = corr.x + 36; px < corr.x + corr.w - 20; px += 40) {
          ctx.beginPath();
          ctx.moveTo(px, corr.y + 12);
          ctx.lineTo(px, corr.y + corr.h - 12);
          ctx.stroke();
        }
      } else {
        for (let py = corr.y + 36; py < corr.y + corr.h - 20; py += 40) {
          ctx.beginPath();
          ctx.moveTo(corr.x + 12, py);
          ctx.lineTo(corr.x + corr.w - 12, py);
          ctx.stroke();
        }
      }
      // Carved stone parapets & golden filigree border
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 3.6;
      ctx.strokeRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = "rgba(253, 230, 138, 0.36)";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(corr.x + 10, corr.y + 10, corr.w - 20, corr.h - 20);
      // Corner crenellated stone posts
      for (const [cx, cy] of [
        [corr.x, corr.y],
        [corr.x + corr.w - 18, corr.y],
        [corr.x, corr.y + corr.h - 18],
        [corr.x + corr.w - 18, corr.y + corr.h - 18],
      ]) {
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#FDE68A";
        ctx.lineWidth = 1.3;
        ctx.fillRect(cx, cy, 18, 18);
        ctx.strokeRect(cx, cy, 18, 18);
      }
    } else {
      // Main Gothic Boulevards & Alleys
      ctx.fillStyle = corr.kind === "alley" ? "#0E131F" : "#131928";
      ctx.fillRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.24)";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(corr.x, corr.y, corr.w, corr.h);
      // Center inlaid brass/silver guide strip on wide avenues
      if (corr.kind === "avenue") {
        const horiz = corr.w > corr.h;
        ctx.strokeStyle = "rgba(253, 230, 138, 0.14)";
        ctx.lineWidth = 2;
        ctx.setLineDash([28, 18]);
        ctx.beginPath();
        if (horiz) {
          ctx.moveTo(corr.x + 20, corr.y + corr.h * 0.5);
          ctx.lineTo(corr.x + corr.w - 20, corr.y + corr.h * 0.5);
        } else {
          ctx.moveTo(corr.x + corr.w * 0.5, corr.y + 20);
          ctx.lineTo(corr.x + corr.w * 0.5, corr.y + corr.h - 20);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // ZONE 1: Grand Void Gate Arrival Medallion & Threshold Chains
  if (isCircleInViewBounds(560, 3350, 380, viewBounds)) {
    ctx.save();
    ctx.translate(560, 3340);
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.3)" : "rgba(56, 189, 248, 0.28)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 195, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = mono ? "rgba(203, 213, 225, 0.25)" : "rgba(148, 163, 184, 0.24)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 145, 0, Math.PI * 2);
    ctx.stroke();
    // 8 radial gate compass spokes
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 145, Math.sin(a) * 145);
      ctx.lineTo(Math.cos(a) * 195, Math.sin(a) * 195);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ZONE 2: Quảng Trường Vô Danh - Grand Gothic Star Mosaic & Sunken Crypt Steps
  if (isCircleInViewBounds(1850, 3220, 460, viewBounds)) {
    ctx.save();
    ctx.translate(1850, 3220);
    const solved2 = progress.relic2Solved;
    ctx.fillStyle = "rgba(10, 14, 24, 0.72)";
    ctx.beginPath();
    ctx.arc(0, 0, 380, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = mono ? "#CBD5E1" : solved2 ? "rgba(253, 230, 138, 0.56)" : "rgba(148, 163, 184, 0.34)";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 370, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 310, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 195, 0, Math.PI * 2);
    ctx.stroke();

    // 12 outer memorial ticks + 8-point Nameless Star inside center
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 310, Math.sin(a) * 310);
      ctx.lineTo(Math.cos(a) * 370, Math.sin(a) * 370);
      ctx.stroke();
    }
    ctx.strokeStyle = solved2 ? "rgba(253, 230, 138, 0.45)" : "rgba(96, 165, 250, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a1 = (Math.PI * 2 * k) / 8;
      const a2 = (Math.PI * 2 * (k + 3)) / 8;
      ctx.moveTo(Math.cos(a1) * 190, Math.sin(a1) * 190);
      ctx.lineTo(Math.cos(a2) * 190, Math.sin(a2) * 190);
    }
    ctx.stroke();
    ctx.restore();

    // Hidden Crypt Stairway Descent Floor (1740..1960, 3635..3785)
    if (isRectVisible({ x: 1730, y: 3630, w: 240, h: 170 }, viewBounds, 40)) {
      ctx.save();
      ctx.fillStyle = progress.relic2Solved ? "#14182B" : "#070910";
      ctx.fillRect(1750, 3635, 200, 155);
      ctx.strokeStyle = progress.relic2Solved ? "#FDE68A" : "#475569";
      ctx.lineWidth = 2;
      ctx.strokeRect(1750, 3635, 200, 155);
      for (let sy = 3648; sy < 3710; sy += 12) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
        ctx.fillRect(1785, sy, 130, 6);
      }
      ctx.restore();
    }
  }

  // ZONE 3: Phố Người Vắng - Ghostly Invisible-Resident Footsteps + First-World Mirror Pool
  if (isCircleInViewBounds(680, 1960, 650, viewBounds)) {
    // Pulsing ghostly footprints drifting between houses
    const ghostSteps = [
      { x: 350, y: 1520, a: 0.2 },
      { x: 382, y: 1532, a: 0.2 },
      { x: 414, y: 1524, a: 0.15 },
      { x: 580, y: 2080, a: -0.3 },
      { x: 612, y: 2068, a: -0.3 },
      { x: 460, y: 2240, a: 1.4 },
      { x: 454, y: 2274, a: 1.45 },
    ];
    for (let i = 0; i < ghostSteps.length; i++) {
      const gs = ghostSteps[i];
      if (!isCircleInViewBounds(gs.x, gs.y, 40, viewBounds)) continue;
      const alpha = 0.12 + 0.36 * Math.max(0, Math.sin(t * 2.1 - i * 0.75));
      ctx.save();
      ctx.translate(gs.x, gs.y);
      ctx.rotate(gs.a);
      ctx.fillStyle = mono ? `rgba(226, 232, 240, ${alpha})` : `rgba(125, 211, 252, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (isCircleInViewBounds(1175, 1475, 220, viewBounds)) {
    ctx.save();
    ctx.translate(1175, 1475);
    const pulse = 0.78 + 0.22 * Math.sin(t * 2.4);

    // Carved stone fountain coping
    ctx.fillStyle = "#182131";
    ctx.strokeStyle = "#64748B";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 128, 92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!mono && allowGlows) {
      const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 114);
      g.addColorStop(0, `rgba(56, 189, 248, ${0.46 * pulse})`);
      g.addColorStop(0.65, "rgba(14, 116, 144, 0.26)");
      g.addColorStop(1, "rgba(6, 7, 11, 0)");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = progress.relic5Solved ? "#FDE68A" : "#38BDF8";
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Animated water ripples
    ctx.strokeStyle = "rgba(186, 230, 253, 0.26)";
    ctx.lineWidth = 1.2;
    const ripple = (t * 24) % 58;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 + ripple, 16 + ripple * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp inverted First-World twin-sun & spires reflected inside Mirror Pool
    ctx.strokeStyle = "rgba(253, 230, 138, 0.42)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -16, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(186, 230, 253, 0.44)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-48, 28);
    ctx.lineTo(-32, -22);
    ctx.lineTo(-16, 28);
    ctx.lineTo(0, -40);
    ctx.lineTo(16, 28);
    ctx.lineTo(34, -26);
    ctx.lineTo(48, 28);
    ctx.stroke();

    // 4 Mirror Pedestals on the rim (#1 West 45°, #2 Center 135°, #3 Illusion no shadow!, #4 SE 225°)
    const mirrorSpots = [
      { mx: -92, my: 0, illusion: false },
      { mx: 0, my: -66, illusion: false },
      { mx: 92, my: 0, illusion: true },
      { mx: 62, my: 56, illusion: false },
    ];
    for (const ms of mirrorSpots) {
      if (!ms.illusion) {
        // Real ground shadow cast by true mirrors!
        ctx.fillStyle = "rgba(2, 4, 10, 0.72)";
        ctx.beginPath();
        ctx.ellipse(ms.mx + 7, ms.my + 7, 11, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = ms.illusion ? "rgba(244, 63, 94, 0.55)" : "#BAE6FD";
      ctx.strokeStyle = ms.illusion ? "#FB7185" : progress.relic5Solved ? "#FDE68A" : "#38BDF8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(ms.mx, ms.my, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // ZONE 4: Thư Viện Ký Ức - Velvet Study Runner Rugs & Hidden Sealed Archive Floor
  if (isCircleInViewBounds(2140, 1780, 560, viewBounds)) {
    ctx.save();
    // Main velvet library carpet runner
    ctx.fillStyle = mono ? "rgba(71, 85, 105, 0.38)" : "rgba(49, 46, 129, 0.32)";
    ctx.fillRect(2020, 1380, 160, 800);
    ctx.strokeStyle = mono ? "#CBD5E1" : "rgba(96, 165, 250, 0.42)";
    ctx.lineWidth = 2;
    ctx.strokeRect(2020, 1380, 160, 800);
    // Gold woven inner border
    ctx.strokeStyle = "rgba(253, 230, 138, 0.28)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(2030, 1390, 140, 780);

    // Hidden Sealed Room floor north of Relic 3 seal (1980..2220, 1130..1320)
    ctx.fillStyle = progress.relic3Solved ? "#121B33" : "#080B14";
    ctx.fillRect(1980, 1135, 240, 185);
    ctx.strokeStyle = progress.relic3Solved ? "#FDE68A" : "rgba(96, 165, 250, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1980, 1135, 240, 185);
    ctx.restore();
  }

  // ZONE 5: Tháp Đồng Hồ Đảo Ngược - Interlocking Clockwork Gears, Conduit Cables & Observatory
  if (isCircleInViewBounds(780, 660, 440, viewBounds)) {
    const rev = Boolean(runtime?.clockReversed);
    ctx.save();
    ctx.translate(780, 660);

    // Recessed clock pit dark metallic floor
    ctx.fillStyle = "#080714";
    ctx.beginPath();
    ctx.arc(0, 0, 345, 0, Math.PI * 2);
    ctx.fill();

    // Giant counter-rotating bronze/cyan clockwork gears under glass floor
    const drawGear = (gx, gy, gr, teeth, rot, col) => {
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(rot);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, gr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, gr * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < teeth; i++) {
        const a = (Math.PI * 2 * i) / teeth;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * gr, Math.sin(a) * gr);
        ctx.lineTo(Math.cos(a) * (gr + 12), Math.sin(a) * (gr + 12));
        ctx.stroke();
      }
      for (let s = 0; s < 4; s++) {
        const a = (Math.PI / 2) * s;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (gr * 0.42), Math.sin(a) * (gr * 0.42));
        ctx.lineTo(Math.cos(a) * gr, Math.sin(a) * gr);
        ctx.stroke();
      }
      ctx.restore();
    };
    const gearDir = rev ? -1 : 1;
    drawGear(-115, -80, 92, 16, t * 0.35 * gearDir, rev ? "rgba(56, 189, 248, 0.28)" : "rgba(168, 85, 247, 0.25)");
    drawGear(125, 95, 76, 12, -t * 0.5 * gearDir, "rgba(253, 230, 138, 0.22)");

    // Outer & inner dial rings
    ctx.strokeStyle = mono ? "#CBD5E1" : rev ? "rgba(56, 189, 248, 0.62)" : "rgba(168, 85, 247, 0.48)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, 332, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 248, 0, Math.PI * 2);
    ctx.stroke();

    // 12 Hour ticks + cardinal diamond markers
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      ctx.strokeStyle = i % 3 === 0 ? "#FDE68A" : rev ? "rgba(103, 232, 249, 0.7)" : "rgba(192, 132, 252, 0.6)";
      ctx.lineWidth = i % 3 === 0 ? 3.2 : 1.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 290, Math.sin(a) * 290);
      ctx.lineTo(Math.cos(a) * 326, Math.sin(a) * 326);
      ctx.stroke();
    }

    // Backward rotating giant Clock Hands!
    const handAngleFast = -t * (rev ? 1.85 : 0.72);
    const handAngleSlow = -t * (rev ? 0.46 : 0.16);
    ctx.strokeStyle = rev ? "#67E8F9" : "#C084FC";
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handAngleFast) * 265, Math.sin(handAngleFast) * 265);
    ctx.stroke();
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handAngleSlow) * 172, Math.sin(handAngleSlow) * 172);
    ctx.stroke();
    ctx.restore();

    // Glowing floor energy conduits linking Clock Mechanism to Time Gates
    ctx.save();
    ctx.strokeStyle = rev ? "rgba(56, 189, 248, 0.52)" : "rgba(168, 85, 247, 0.34)";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(780, 660);
    ctx.lineTo(1050, 875);
    ctx.moveTo(780, 660);
    ctx.lineTo(1390, 610);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ZONE 5 North: Lost Star Observatory Dome Floor (Relic 1)
  if (isCircleInViewBounds(790, 265, 220, viewBounds)) {
    ctx.save();
    ctx.translate(790, 265);
    ctx.fillStyle = progress.relic1Solved ? "rgba(14, 116, 144, 0.25)" : "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.arc(0, 0, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = progress.relic1Solved ? "#FDE68A" : "#38BDF8";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    for (let r of [92, 66, 40]) {
      ctx.strokeStyle = "rgba(125, 211, 252, 0.32)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ZONE 6: Nhà Hát Không Khán Giả - Proscenium Stage, Dual Spotlights, Puppet Reenactment & Velvet Stalls
  if (isCircleInViewBounds(2340, 560, 520, viewBounds)) {
    ctx.save();
    ctx.translate(2340, 560);

    // Stage floor mahogany planks + gilded apron rim
    ctx.fillStyle = "#1E0F26";
    ctx.fillRect(-320, -215, 640, 185);
    ctx.strokeStyle = "rgba(12, 6, 18, 0.65)";
    ctx.lineWidth = 1.2;
    for (let py = -195; py < -35; py += 20) {
      ctx.beginPath();
      ctx.moveTo(-318, py);
      ctx.lineTo(318, py);
      ctx.stroke();
    }
    ctx.strokeStyle = progress.map4PuppetPlaySeen ? "#FDE68A" : "#C084FC";
    ctx.lineWidth = 3.2;
    ctx.strokeRect(-320, -215, 640, 185);

    // Draped Crimson-Plum Proscenium Stage Curtains on left & right wings
    ctx.fillStyle = mono ? "#334155" : "#4C0519";
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 1.6;
    ctx.fillRect(-320, -215, 42, 185);
    ctx.strokeRect(-320, -215, 42, 185);
    ctx.fillRect(278, -215, 42, 185);
    ctx.strokeRect(278, -215, 42, 185);

    // Stage Footlights along front edge
    for (let fx = -240; fx <= 240; fx += 60) {
      ctx.fillStyle = "rgba(253, 230, 138, 0.72)";
      ctx.beginPath();
      ctx.arc(fx, -32, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sweeping Dual Stage Spotlights & Animated Reenactment Silhouettes
    const phase = runtime?.theaterReenactPhase || t;
    const spX = Math.sin(phase * 1.1) * 125;
    if (!mono && allowGlows) {
      const sg = ctx.createRadialGradient(spX, -122, 8, spX, -122, 125);
      sg.addColorStop(0, progress.map4PuppetPlaySeen ? "rgba(253, 230, 138, 0.38)" : "rgba(192, 132, 252, 0.36)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(spX, -122, 125, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reenacting Marionette & 3 watching Shadow Actors
    ctx.fillStyle = progress.map4PuppetPlaySeen ? "rgba(253, 230, 138, 0.65)" : "rgba(226, 232, 240, 0.36)";
    ctx.beginPath();
    ctx.arc(spX, -130, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(spX - 8, -117, 16, 26);
    // Faint silver marionette strings rising above actor
    ctx.strokeStyle = "rgba(248, 250, 252, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spX - 6, -112);
    ctx.lineTo(spX - 10, -172);
    ctx.moveTo(spX + 6, -112);
    ctx.lineTo(spX + 10, -172);
    ctx.stroke();

    // Velvet Audience Rows + Occasional Forgotten Blank Mask on Seats
    for (let row = 0; row < 4; row++) {
      const rw = 530 - row * 38;
      const rx = -rw * 0.5;
      const ry = 24 + row * 50;
      ctx.fillStyle = mono ? "rgba(51, 65, 85, 0.4)" : "rgba(88, 28, 135, 0.34)";
      ctx.fillRect(rx, ry, rw, 24);
      ctx.strokeStyle = "rgba(253, 230, 138, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(rx, ry, rw, 24);
      // Central crimson aisle carpet break
      ctx.fillStyle = "rgba(127, 29, 29, 0.45)";
      ctx.fillRect(-18, ry, 36, 24);
      if (row % 2 === 1) {
        drawTheaterMaskIcon(ctx, rx + 70 + row * 35, ry + 12, "#CBD5E1", "#475569", false, 0.68);
      }
    }
    ctx.restore();
  }

  // ZONE 7: Cung Điện Hồ Sơ - Imperial Gilded Hall Carpet & 4-Realm Resonance Circle
  if (isCircleInViewBounds(3760, 2880, 620, viewBounds)) {
    ctx.save();
    // Grand ceremonial navy-gold carpet running to Trung's Dossier Pedestal
    ctx.fillStyle = mono ? "rgba(71, 85, 105, 0.35)" : "rgba(30, 27, 75, 0.42)";
    ctx.fillRect(3420, 2840, 720, 160);
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(3420, 2840, 720, 160);
    ctx.strokeStyle = "rgba(253, 230, 138, 0.32)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(3432, 2852, 696, 136);

    // Pedestal floor halo around Trung's Dossier (3780, 2920)
    ctx.strokeStyle = progress.trungDossierSeen ? "#FDE68A" : "rgba(253, 230, 138, 0.52)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(3780, 2920, 105, 0, Math.PI * 2);
    ctx.stroke();

    // 4-Map Cross-Resonance Floor Emblem at (3440, 2620)
    ctx.translate(3440, 2620);
    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.stroke();
    const mapCols = ["#F43F5E", "#F97316", "#38BDF8", "#34D399"];
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + Math.PI / 4;
      ctx.fillStyle = mono ? "#CBD5E1" : mapCols[i];
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 44, Math.sin(a) * 44, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ZONE 8: Trung Tâm Hư Không - Cosmic Abyssal Rift Arena & Genesis Origin Sanctum
  if (isCircleInViewBounds(3920, 920, 560, viewBounds)) {
    ctx.save();
    ctx.translate(3920, 920);
    const unlocked6 = isRelic6Accessible(progress);

    // Abyssal void floor fractures radiating outward
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.24)" : progress.relic6Solved ? "rgba(253, 230, 138, 0.38)" : "rgba(168, 85, 247, 0.3)";
    ctx.lineWidth = 2.4;
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8 + 0.18;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 90, Math.sin(a) * 90);
      ctx.lineTo(Math.cos(a + 0.08) * 230, Math.sin(a + 0.08) * 230);
      ctx.lineTo(Math.cos(a - 0.05) * 390, Math.sin(a - 0.05) * 390);
      ctx.stroke();
    }

    // Concentric Genesis Reality Rings
    ctx.strokeStyle = progress.relic6Solved
      ? "rgba(253, 230, 138, 0.65)"
      : unlocked6
        ? "rgba(56, 189, 248, 0.52)"
        : "rgba(168, 85, 247, 0.36)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, 365, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(t * 0.24);
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, 265, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.rotate(-t * 0.38);
    ctx.strokeStyle = "rgba(253, 230, 138, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * 168;
      const py = Math.sin(a) * 168;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // East Origin Sanctum glowing chamber floor (4320..4640, 760..1020)
    if (isCircleInViewBounds(4380, 890, 240, viewBounds)) {
      ctx.save();
      ctx.fillStyle = progress.relic6Solved ? "rgba(253, 230, 138, 0.14)" : "rgba(30, 27, 75, 0.45)";
      ctx.fillRect(4310, 770, 310, 240);
      ctx.strokeStyle = progress.relic6Solved ? "#FDE68A" : unlocked6 ? "#38BDF8" : "#A855F7";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(4310, 770, 310, 240);
      ctx.restore();
    }
  }

  // Outer Void Perimeter Border (ornate double-line frame)
  ctx.strokeStyle = mono ? "#CBD5E1" : "#38BDF8";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, VOID_CITY_WIDTH - 16, VOID_CITY_HEIGHT - 16);
  ctx.strokeStyle = "rgba(168, 85, 247, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, VOID_CITY_WIDTH - 36, VOID_CITY_HEIGHT - 36);
}

// ---------------------------------------------------------------------------
// 2. STRUCTURES, 2.5D LANDMARKS, STATUES, INTERACTABLES & CHESTS
// ---------------------------------------------------------------------------

function drawVoidCityMonumentNode(ctx, node, isNearest, isSolved, chestOpened, progress, t, allowGlows, mono, lang) {
  const pulse = 0.72 + 0.28 * Math.sin(t * 3.2 + node.x * 0.01);
  const color =
    node.kind === "boss_altar"
      ? "#F43F5E"
      : isSolved || chestOpened
        ? "#FDE68A"
        : node.kind === "relic_puzzle"
          ? "#C084FC"
          : node.kind === "ancient_chest"
            ? "#F59E0B"
            : node.kind === "trung_dossier"
              ? "#FACC15"
              : "#38BDF8";

  ctx.save();
  ctx.translate(node.x, node.y);

  // Radial beacon halo on ground (ZERO shadowBlur)
  if (!mono && allowGlows) {
    const rad = node.kind === "relic_puzzle" || node.kind === "boss_altar" ? 56 : 42;
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, rad);
    g.addColorStop(
      0,
      node.kind === "boss_altar"
        ? `rgba(244, 63, 94, ${0.28 * pulse})`
        : isSolved || node.kind === "trung_dossier"
          ? `rgba(253, 230, 138, ${0.26 * pulse})`
          : node.kind === "relic_puzzle"
            ? `rgba(192, 132, 252, ${0.28 * pulse})`
            : `rgba(56, 189, 248, ${0.24 * pulse})`
    );
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer dashed or solid interaction ring
  ctx.strokeStyle = isNearest ? "#FFFFFF" : color;
  ctx.globalAlpha = isNearest ? 0.98 : 0.65 * pulse;
  ctx.lineWidth = isNearest ? 3 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, node.kind === "relic_puzzle" || node.kind === "boss_altar" ? 34 : 25, 0, Math.PI * 2);
  ctx.stroke();

  if (node.kind === "relic_puzzle") {
    ctx.save();
    ctx.rotate(t * (isSolved ? 0.55 : -0.35));
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = isSolved ? "#FDE68A" : "#38BDF8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.globalAlpha = 1;

  // Bespoke high-recognition architectural prop per node kind!
  if (node.relicId === "relic_1_astrolabe") {
    // Spinning 3-ring Celestial Brass Astrolabe Orrery
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(t * (0.9 - i * 0.45) + i * 0.7);
      ctx.strokeStyle = i === 0 ? "#FDE68A" : "#38BDF8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 - i * 3.5, 9 - i * 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = isSolved ? "#FEF08A" : "#BAE6FD";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.relicId === "relic_2_nameless_tomb") {
    // Sunken Tombstone Crypt Altar
    ctx.fillStyle = "#1E293B";
    ctx.strokeStyle = isSolved ? "#FDE68A" : "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -13, 36, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = isSolved ? "#F59E0B" : "#64748B";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();
  } else if (node.relicId === "relic_3_sealed_archive") {
    // Arcane Bookcase Vault Mechanism with 3 Recesses
    ctx.fillStyle = "#1E1B4B";
    ctx.strokeStyle = isSolved ? "#FDE68A" : "#60A5FA";
    ctx.lineWidth = 2;
    ctx.fillRect(-19, -14, 38, 28);
    ctx.strokeRect(-19, -14, 38, 28);
    for (let s = -1; s <= 1; s++) {
      ctx.fillStyle = progress.foundTornPages.length > s + 1 || isSolved ? "#FDE68A" : "#334155";
      ctx.fillRect(s * 10 - 3.5, -8, 7, 16);
    }
  } else if (node.relicId === "relic_4_theater_masks") {
    // Four Masks Pedestal Circle
    const maskCols = ["#FDE68A", "#94A3B8", "#E2E8F0", "#C084FC"];
    for (let m = 0; m < 4; m++) {
      const a = (Math.PI / 2) * m + t * 0.4;
      drawTheaterMaskIcon(ctx, Math.cos(a) * 16, Math.sin(a) * 14, maskCols[m], "#1E1B4B", m === 0, 0.72);
    }
  } else if (node.relicId === "relic_5_mirror_vault") {
    // Mirror Prism Matrix Core
    ctx.fillStyle = "#083344";
    ctx.strokeStyle = isSolved ? "#FDE68A" : "#67E8F9";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#E0F2FE";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.relicId === "relic_6_origin_sanctum") {
    // Towering Genesis Sun-Pillar
    const unlocked6 = isRelic6Accessible(progress);
    ctx.fillStyle = isSolved ? "#422006" : "#1E1B4B";
    ctx.strokeStyle = isSolved ? "#FEF08A" : unlocked6 ? "#38BDF8" : "#F43F5E";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + t * 0.8;
      ctx.fillStyle = isSolved || unlocked6 ? "#FDE68A" : "#64748B";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 13, Math.sin(a) * 13, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = isSolved ? "#FFFFFF" : "#FDE68A";
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.kind === "ancient_chest") {
    // Runic Iron & Gold Coffer
    ctx.fillStyle = chestOpened ? "#1E293B" : "#451A03";
    ctx.strokeStyle = chestOpened ? "#64748B" : "#FBBF24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-15, -11, 30, 22, 3);
    ctx.fill();
    ctx.stroke();
    // Lid split & golden lock clasp
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-15, -2);
    ctx.lineTo(15, -2);
    ctx.stroke();
    ctx.fillStyle = chestOpened ? "#34D399" : "#FEF08A";
    ctx.fillRect(-3.5, -5, 7, 7);
  } else if (node.kind === "clock_lever") {
    // Chronos Brass Lever & Spinning Hour-Ring
    ctx.fillStyle = "#1E1B4B";
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.rotate(-t * 1.4);
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.restore();
  } else if (node.kind === "trung_dossier") {
    // Floating Golden Classified File stamped TRUNG
    const bob = Math.sin(t * 2.6) * 2.5;
    ctx.fillStyle = "#FEF3C7";
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2.2;
    ctx.fillRect(-13, -15 + bob, 26, 30);
    ctx.strokeRect(-13, -15 + bob, 26, 30);
    // Crimson wax seal & text lines
    ctx.fillStyle = "#92400E";
    ctx.fillRect(-8, -9 + bob, 16, 2.2);
    ctx.fillRect(-8, -3 + bob, 12, 2.2);
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(6, 7 + bob, 4.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.kind === "boss_altar") {
    // Crimson Summon Lectern with Swirling Archive Pages
    ctx.fillStyle = "#2E0B1A";
    ctx.strokeStyle = "#F43F5E";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = t * 2 + (Math.PI / 2) * i;
      ctx.fillStyle = i % 2 === 0 ? "#FEF3C7" : "#FDA4AF";
      ctx.fillRect(Math.cos(a) * 13 - 3, Math.sin(a) * 13 - 4, 6, 8);
    }
    ctx.fillStyle = "#FFE4E6";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.kind === "torn_page") {
    // Luminous Curled Torn Parchment Page
    const bob = Math.sin(t * 3 + node.x) * 2.5;
    ctx.fillStyle = "#FEF9C3";
    ctx.strokeStyle = "#60A5FA";
    ctx.lineWidth = 1.8;
    ctx.fillRect(-9, -12 + bob, 18, 22);
    ctx.strokeRect(-9, -12 + bob, 18, 22);
    ctx.fillStyle = "#1E3A8A";
    ctx.fillRect(-5, -7 + bob, 10, 2);
    ctx.fillRect(-5, -2 + bob, 8, 2);
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(4, 5 + bob, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.kind === "constellation_clue") {
    // Star Chart Slate Tablet
    ctx.fillStyle = "#0F172A";
    ctx.strokeStyle = "#7DD3FC";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#FDE68A";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.id.includes("west") ? "✦" : "◈", 0, 4.5);
  } else if (node.kind === "theater_puppet_stage") {
    // Marionette Cross-Bar & Hanging Puppet Prop
    const sw = Math.sin(t * 2.2) * 2.5;
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -13);
    ctx.lineTo(12, -13);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -9);
    ctx.stroke();
    ctx.fillStyle = "#C084FC";
    ctx.beginPath();
    ctx.arc(sw, -2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sw - 5, 4, 10, 10);
  } else {
    // Tomb clues, Mirror plaques, Lore tablets, Cross-Map Echo seals
    ctx.fillStyle = "#111827";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -14, 24, 28, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.kind === "cross_map_seal" ? "❖" : "✧", 0, 5);
  }

  // Always show concise landmark badge when near (or important Relics/Boss)
  if (isNearest) {
    const labelText = lang === "en" ? node.label.en : node.label.vi;
    const tw = Math.min(280, Math.max(96, labelText.length * 6.8 + 20));
    ctx.fillStyle = "rgba(5, 8, 18, 0.88)";
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-tw * 0.5, -52, tw, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FEF9C3";
    ctx.font = "bold 11.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labelText, 0, -38.5);
  }

  ctx.restore();
}

export function drawVoidCityStructuresScene(ctx, engine, t, viewBounds) {
  const runtime = engine.voidCityRuntime;
  const progress = normalizeVoidCityProgress(engine.voidCityProgress);
  const perf = engine.getPerformanceProfile?.() || { enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const mono = Boolean(engine.player?.tin_monochrome_realm_timer > 0);
  const obstacles = getActiveVoidCityObstacles(progress, runtime);
  const lang = engine.currentLang === "en" ? "en" : "vi";

  // Flickering Gothic Streetlamps
  if (runtime?.lamps) {
    for (const lamp of runtime.lamps) {
      if (!isCircleInViewBounds(lamp.x, lamp.y, lamp.radius + 40, viewBounds)) continue;
      drawVoidLampPost(ctx, lamp, t, allowGlows, mono);
    }
  }

  // Active Obstacles rendered with detailed 2.5D Dark-Fantasy Architecture
  for (const ob of obstacles) {
    if (!isRectVisible(ob, viewBounds, 100)) continue;
    ctx.save();
    if (ob.kind === "secret_seal_door") {
      // Ornate Locked Vault Seal Door with Glowing Keyhole & Arcane Chains
      ctx.fillStyle = "rgba(2, 4, 10, 0.72)";
      ctx.fillRect(ob.x + 5, ob.y + 7, ob.w, ob.h);
      ctx.fillStyle = "#17133B";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = mono ? "#E2E8F0" : "#A855F7";
      ctx.lineWidth = 3;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "rgba(253, 230, 138, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(ob.x + 5, ob.y + 5, Math.max(4, ob.w - 10), Math.max(4, ob.h - 10));

      // Glowing seal sigil dots
      const horiz = ob.w >= ob.h;
      const pulse = 0.65 + 0.35 * Math.sin(t * 3.5);
      ctx.fillStyle = `rgba(216, 180, 254, ${pulse})`;
      for (let i = 1; i <= 3; i++) {
        const sx = horiz ? ob.x + (ob.w * i) / 4 : ob.x + ob.w * 0.5;
        const sy = horiz ? ob.y + ob.h * 0.5 : ob.y + (ob.h * i) / 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ob.w >= 90) {
        ctx.fillStyle = "#FEF3C7";
        ctx.font = "bold 10.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ob.label || "NIÊM PHONG", ob.x + ob.w * 0.5, ob.y + ob.h * 0.5 + 3.5);
      }
    } else if (ob.kind === "clock_reverse_gate") {
      // Chronos Phase Barrier Gate
      ctx.fillStyle = "rgba(2, 6, 18, 0.65)";
      ctx.fillRect(ob.x + 4, ob.y + 6, ob.w, ob.h);
      ctx.fillStyle = "#0B1528";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.8;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      // Horizontal chronos bars
      ctx.strokeStyle = "rgba(103, 232, 249, 0.55)";
      ctx.lineWidth = 1.6;
      for (let by = ob.y + 20; by < ob.y + ob.h - 14; by += 24) {
        ctx.beginPath();
        ctx.moveTo(ob.x + 8, by);
        ctx.lineTo(ob.x + ob.w - 8, by);
        ctx.stroke();
      }
      ctx.fillStyle = "#BAE6FD";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⏳", ob.x + ob.w * 0.5, ob.y + ob.h * 0.5 + 4);
    } else if (ob.kind === "abandoned_house") {
      // 2.5D Gothic Townhome in Phố Người Vắng (Furnished + Eerie Living Sound & Window Shadows!)
      const roofH = Math.round(ob.h * 0.6);
      const wallH = ob.h - roofH;
      const hFlick = 0.66 + 0.34 * Math.sin(t * 4.5 + ob.x * 0.08);

      // Cast drop shadow
      ctx.fillStyle = "rgba(2, 4, 10, 0.68)";
      ctx.fillRect(ob.x + 10, ob.y + 12, ob.w, ob.h);

      // Southern stone wall facade
      ctx.fillStyle = mono ? "#334155" : "#1C2333";
      ctx.fillRect(ob.x, ob.y + roofH, ob.w, wallH);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(ob.x, ob.y + roofH, ob.w, wallH);

      // Front Doorway & Threshold Step
      const cx = ob.x + ob.w * 0.5;
      ctx.fillStyle = "#090D16";
      ctx.fillRect(cx - 13, ob.y + ob.h - 34, 26, 34);
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 13, ob.y + ob.h - 34, 26, 34);

      // Lit Hearth Windows with Visible Domestic Furniture + Fleeting Resident Shadow!
      for (const wx of [ob.x + 22, ob.x + ob.w - 50]) {
        const wy = ob.y + roofH + 16;
        if (!mono && allowGlows) {
          const wg = ctx.createRadialGradient(wx + 14, wy + 10, 2, wx + 14, wy + 10, 28);
          wg.addColorStop(0, `rgba(253, 230, 138, ${0.32 * hFlick})`);
          wg.addColorStop(1, "rgba(253, 230, 138, 0)");
          ctx.fillStyle = wg;
          ctx.beginPath();
          ctx.arc(wx + 14, wy + 10, 28, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = mono ? "#CBD5E1" : `rgba(253, 230, 138, ${0.38 * hFlick})`;
        ctx.fillRect(wx, wy, 28, 18);
        // Subtle moving indoor resident silhouette inside empty house!
        if (Math.sin(t * 1.3 + wx) > 0.15) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
          ctx.fillRect(wx + 10 + Math.sin(t * 2.1) * 5, wy + 3, 7, 15);
        }
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(wx, wy, 28, 18);
        ctx.beginPath();
        ctx.moveTo(wx + 14, wy);
        ctx.lineTo(wx + 14, wy + 18);
        ctx.moveTo(wx, wy + 9);
        ctx.lineTo(wx + 28, wy + 9);
        ctx.stroke();
      }

      // Steep Gothic Slate Shingle Roof
      ctx.fillStyle = mono ? "#1E293B" : "#111624";
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(ob.x - 5, ob.y - 4, ob.w + 10, roofH + 8, 5);
      ctx.fill();
      ctx.stroke();

      // Roof ridge & slate shingle rows
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(ob.x - 2, ob.y + roofH * 0.48);
      ctx.lineTo(ob.x + ob.w + 2, ob.y + roofH * 0.48);
      ctx.stroke();

      ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
      ctx.lineWidth = 1;
      for (let sy = ob.y + 12; sy < ob.y + roofH; sy += 14) {
        ctx.beginPath();
        ctx.moveTo(ob.x + 4, sy);
        ctx.lineTo(ob.x + ob.w - 4, sy);
        ctx.stroke();
      }
      // Stone chimney stack
      ctx.fillStyle = "#263042";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 1.6;
      ctx.fillRect(ob.x + ob.w - 36, ob.y + 10, 18, 20);
      ctx.strokeRect(ob.x + ob.w - 36, ob.y + 10, 18, 20);
    } else if (ob.kind === "bookshelf_monolith") {
      // Towering 2.5D Mahogany Library Bookcase with Dossier Spines & Brass Trim
      ctx.fillStyle = "rgba(2, 4, 10, 0.65)";
      ctx.fillRect(ob.x + 6, ob.y + 8, ob.w, ob.h);

      ctx.fillStyle = "#161124";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = "#231936";
      ctx.fillRect(ob.x + 2, ob.y + 2, ob.w - 4, Math.max(8, ob.h - 28));
      ctx.strokeStyle = "#60A5FA";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

      // Colorful archived dossier spines on southern shelf face
      const spineCols = ["#38BDF8", "#94A3B8", "#A855F7", "#FDE68A", "#60A5FA"];
      let idx = 0;
      for (let bx = ob.x + 12; bx < ob.x + ob.w - 14; bx += 14) {
        ctx.fillStyle = mono ? "#64748B" : spineCols[idx % spineCols.length];
        ctx.globalAlpha = 0.72;
        ctx.fillRect(bx, ob.y + ob.h - 24, 9, 18);
        ctx.globalAlpha = 1;
        idx++;
      }
      // Gilded top crown trim
      ctx.strokeStyle = "rgba(253, 230, 138, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(ob.x + 8, ob.y + 8, ob.w - 16, Math.max(8, ob.h - 38));
    } else if (ob.kind === "gate_pillar") {
      // Colossal Zone 1 Gate Tower Pillar with Top Brazier & Rune Carvings
      drawGothicMasonrySlab(ctx, ob.x, ob.y, ob.w, ob.h, 36, "#1E293B", "#0F172A", "#94A3B8", "rgba(56, 189, 248, 0.38)", mono, ob.x);
      const bx = ob.x + ob.w * 0.5;
      const by = ob.y + ob.h * 0.42;
      const flk = 0.75 + 0.25 * Math.sin(t * 5 + ob.x);
      if (!mono && allowGlows) {
        const bg = ctx.createRadialGradient(bx, by, 4, bx, by, 54);
        bg.addColorStop(0, `rgba(56, 189, 248, ${0.42 * flk})`);
        bg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(bx, by, 54, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#0F172A";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(186, 230, 253, ${0.8 + 0.2 * flk})`;
      ctx.beginPath();
      ctx.arc(bx, by, 8 * flk, 0, Math.PI * 2);
      ctx.fill();
    } else if (ob.kind === "statue_plinth") {
      // Stepped Stone Plinth + Faceless Guard Sentinel Statue on top!
      drawGothicMasonrySlab(ctx, ob.x, ob.y, ob.w, ob.h, 24, "#1C2436", "#0F1522", "#94A3B8", "rgba(253, 230, 138, 0.24)", mono, ob.x);
      drawFacelessMarbleStatue(ctx, ob.x + ob.w * 0.5, ob.y + ob.h * 0.45, Math.PI * 0.5, 0.92, "#94A3B8", false, t, mono);
    } else if (ob.kind === "clock_cog_slab") {
      // Clockwork Gear-Housing Tower Pillar with Spinning Brass Core
      drawGothicMasonrySlab(ctx, ob.x, ob.y, ob.w, ob.h, 28, "#1A1330", "#0E0A1C", "#A855F7", "rgba(103, 232, 249, 0.32)", mono, ob.x);
      const cx = ob.x + ob.w * 0.5;
      const cy = ob.y + ob.h * 0.44;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((runtime?.clockReversed ? -1 : 1) * t * 0.9);
      ctx.strokeStyle = runtime?.clockReversed ? "#67E8F9" : "#FDE68A";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(ob.w, ob.h) * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
        ctx.stroke();
      }
      ctx.restore();
    } else if (ob.kind === "theater_partition") {
      // Gilded Velvet Opera Wing Wall with Tragic Mask Relief
      drawGothicMasonrySlab(ctx, ob.x, ob.y, ob.w, ob.h, 30, "#2A1230", "#17091C", "#C084FC", "rgba(253, 230, 138, 0.35)", mono, ob.x);
      drawTheaterMaskIcon(ctx, ob.x + ob.w * 0.5, ob.y + ob.h * 0.45, "#E2E8F0", "#FDE68A", false, 1.35);
    } else if (ob.kind === "archive_colonade") {
      // Imperial Palace Fluted Marble & Gold Column
      drawGothicMasonrySlab(ctx, ob.x, ob.y, ob.w, ob.h, 32, "#1E1B2E", "#12101D", "#FDE68A", "rgba(253, 230, 138, 0.42)", mono, ob.x);
      ctx.fillStyle = "#FDE68A";
      ctx.beginPath();
      ctx.arc(ob.x + ob.w * 0.5, ob.y + ob.h * 0.42, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (ob.kind === "void_obsidian") {
      // Levitating Faceted Void Crystal Monolith with Orbiting Splinters
      ctx.fillStyle = "rgba(2, 4, 10, 0.65)";
      ctx.beginPath();
      ctx.ellipse(ob.x + ob.w * 0.5 + 6, ob.y + ob.h * 0.5 + 10, ob.w * 0.48, ob.h * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#090717";
      ctx.strokeStyle = "#A855F7";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(ob.x + ob.w * 0.5, ob.y + 4);
      ctx.lineTo(ob.x + ob.w - 6, ob.y + ob.h * 0.45);
      ctx.lineTo(ob.x + ob.w * 0.72, ob.y + ob.h - 6);
      ctx.lineTo(ob.x + ob.w * 0.28, ob.y + ob.h - 6);
      ctx.lineTo(ob.x + 6, ob.y + ob.h * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Inner cyan-gold rune vein
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ob.x + ob.w * 0.5, ob.y + 18);
      ctx.lineTo(ob.x + ob.w * 0.5, ob.y + ob.h - 22);
      ctx.stroke();
    } else if (ob.kind === "dynamic_shift_slab") {
      // Shimmering Shifting Architectural Slab
      ctx.fillStyle = "rgba(2, 4, 10, 0.6)";
      ctx.fillRect(ob.x + 5, ob.y + 7, ob.w, ob.h);
      ctx.fillStyle = "#1B1633";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#C084FC";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ob.x + 12, ob.y + 12);
      ctx.lineTo(ob.x + ob.w - 12, ob.y + ob.h - 12);
      ctx.moveTo(ob.x + ob.w - 12, ob.y + 12);
      ctx.lineTo(ob.x + 12, ob.y + ob.h - 12);
      ctx.stroke();
    } else {
      drawGothicMasonrySlab(ctx, ob.x, ob.y, ob.w, ob.h, 20, "#182030", "#0F1520", "#64748B", null, mono, ob.x);
    }
    ctx.restore();
  }

  // ZONE 2: Shifting Nameless Tomb Statues with Recognizable Relic Clues!
  // #1 Broken Black Sword, #2 Cracked Silver Lantern, #3 Cloaked Skyward,
  // #4 Kneeling Northbound, #5 Mossy Stone Shield, #6 Grey Cloth Veil
  for (const st of RELIC2_TOMB_STATUES) {
    const sx = 1480 + ((st.id - 1) % 3) * 340;
    const sy = st.id <= 3 ? 2860 : 3440;
    if (!isCircleInViewBounds(sx, sy, 80, viewBounds)) continue;
    const ang = runtime?.statuesAngles?.[st.id] || 0;
    const highlightTrue = Boolean(st.isTrue && (progress.tombInscriptionsRead || progress.relic2Solved));

    drawFacelessMarbleStatue(ctx, sx, sy, ang, 1.28, highlightTrue ? "#FDE68A" : "#94A3B8", highlightTrue, t, mono);

    // Draw unmistakable Relic-2 identifying attribute held by each statue!
    ctx.save();
    ctx.translate(sx, sy);
    if (st.id === 1) {
      // Broken Black Sword
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(12, 10);
      ctx.lineTo(22, -4);
      ctx.stroke();
    } else if (st.id === 2) {
      // TRUE: Cracked Silver Lantern glow!
      ctx.fillStyle = "#BAE6FD";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 8, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st.id === 3) {
      // Skyward Cloak Fold
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(-10, 0, 14, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
    } else if (st.id === 4) {
      // TRUE: Kneeling Northbound Stone Chevron
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -18);
      ctx.lineTo(0, -26);
      ctx.lineTo(8, -18);
      ctx.stroke();
    } else if (st.id === 5) {
      // Mossy Stone Shield
      ctx.fillStyle = "#166534";
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(-14, 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st.id === 6) {
      // TRUE: Grey Cloth Veil band
      ctx.fillStyle = "#94A3B8";
      ctx.fillRect(-10, -4, 20, 6);
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.1;
      ctx.strokeRect(-10, -4, 20, 6);
    }

    ctx.fillStyle = highlightTrue ? "#FDE68A" : "#CBD5E1";
    ctx.font = "bold 11.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`#${st.id}`, 0, -34);
    ctx.restore();
  }

  // ZONE 4: Floating Self-Opening Mutating Codex Books in Library
  if (isCircleInViewBounds(2140, 1840, 580, viewBounds)) {
    const bp = runtime?.bookPulsePhase || t * 2;
    for (let i = 0; i < 6; i++) {
      const bx = 1780 + (i % 3) * 320 + Math.sin(bp + i) * 14;
      const by = 1660 + Math.floor(i / 3) * 340 + Math.cos(bp * 0.8 + i) * 12;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.sin(bp * 0.5 + i) * 0.25);
      // Open double-page levitating tome
      ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FEF3C7";
      ctx.fillRect(-12, -8, 11, 16);
      ctx.fillRect(1, -8, 11, 16);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-12, -8, 24, 16);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ZONE 6: Four Backstage Statue Pedestals (Visibly wearing masks once Relic 4 solved!)
  if (isCircleInViewBounds(2340, 320, 220, viewBounds)) {
    const pedPositions = [
      { dx: -95, col: "#FDE68A", crack: true },
      { dx: -32, col: "#94A3B8", crack: false },
      { dx: 32, col: "#E2E8F0", crack: false },
      { dx: 95, col: "#C084FC", crack: false },
    ];
    for (const pp of pedPositions) {
      drawFacelessMarbleStatue(ctx, 2340 + pp.dx, 305, Math.PI * 0.5, 0.85, progress.relic4Solved ? "#FDE68A" : "#64748B", progress.relic4Solved, t, mono);
      if (progress.relic4Solved) {
        drawTheaterMaskIcon(ctx, 2340 + pp.dx, 305, pp.col, "#1E1B4B", pp.crack, 0.72);
      }
    }
  }

  // Fleeting Translucent Human Silhouettes passing along deserted streets
  if (runtime?.shadowSilhouettes) {
    for (const sh of runtime.shadowSilhouettes) {
      if (!isCircleInViewBounds(sh.x, sh.y, 45, viewBounds)) continue;
      const fade = Math.sin((sh.life / Math.max(0.1, sh.maxLife)) * Math.PI);
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade * 0.58);
      ctx.translate(sh.x, sh.y);
      // Echo trail
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.beginPath();
      ctx.ellipse(-sh.vx * 0.04, -sh.vy * 0.04, 11, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#CBD5E1";
      ctx.beginPath();
      ctx.arc(0, -15, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(-10, 18);
      ctx.lineTo(-7, -7);
      ctx.lineTo(7, -7);
      ctx.lineTo(10, 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Interactive Monuments, Relics, Clues & Ancient Chests
  const nearest = engine.player ? findNearestVoidCityInteractable(engine.player.x, engine.player.y, progress, runtime) : null;
  for (const node of VOID_CITY_INTERACTABLES) {
    if (!isCircleInViewBounds(node.x, node.y, node.radius + 55, viewBounds)) continue;
    const isNearest = nearest && nearest.id === node.id;
    const isSolvedRelic =
      (node.relicId === "relic_1_astrolabe" && progress.relic1Solved) ||
      (node.relicId === "relic_2_nameless_tomb" && progress.relic2Solved) ||
      (node.relicId === "relic_3_sealed_archive" && progress.relic3Solved) ||
      (node.relicId === "relic_4_theater_masks" && progress.relic4Solved) ||
      (node.relicId === "relic_5_mirror_vault" && progress.relic5Solved) ||
      (node.relicId === "relic_6_origin_sanctum" && progress.relic6Solved);
    const chestOpened = Boolean(node.chestId && progress.openedChests.includes(node.chestId));
    drawVoidCityMonumentNode(ctx, node, isNearest, isSolvedRelic, chestOpened, progress, t, allowGlows, mono, lang);
  }

  // Boss ending dropped solitary page on floor (fixes nearest reference cleanly!)
  if (runtime?.endingPageSpawned && runtime.endingPagePos && isCircleInViewBounds(runtime.endingPagePos.x, runtime.endingPagePos.y, 80, viewBounds)) {
    const ep = runtime.endingPagePos;
    const bob = Math.sin(t * 3) * 3.5;
    ctx.save();
    ctx.translate(ep.x, ep.y + bob);
    if (!mono && allowGlows) {
      const pg = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      pg.addColorStop(0, "rgba(253, 230, 138, 0.42)");
      pg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(253, 230, 138, ${0.48 + Math.sin(t * 4) * 0.25})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 30 + Math.sin(t * 3.5) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(-11, -15, 22, 28);
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-11, -15, 22, 28);
    ctx.fillStyle = "#92400E";
    ctx.fillRect(-7, -9, 14, 2);
    ctx.fillRect(-7, -3, 12, 2);
    ctx.fillRect(-7, 3, 10, 2);
    if (nearest?.id === "ending_last_page") {
      ctx.fillStyle = "#FEF3C7";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(lang === "en" ? "Final Fallen Page" : "Trang Giấy Cuối Cùng", 0, -38);
    }
    ctx.restore();
  }

  void VOID_CITY_CHESTS;
  void VOID_CITY_CONSTELLATION_SYMBOLS;
  void RELIC4_MASKS;
}

// ---------------------------------------------------------------------------
// 3. MAP 5 HERO VISUAL AURAS (Ấn Vô Danh / Mặt Nạ Ký Ức / Mảnh Khởi Nguyên)
// ---------------------------------------------------------------------------

export function drawVoidCityHeroAura(ctx, heroX, heroY, radius, progressInput, t) {
  const p = normalizeVoidCityProgress(progressInput);
  if (!p.namelessSealActive && !p.memoryMaskActive && !p.originFragmentForged) return;
  ctx.save();
  ctx.translate(heroX, heroY);
  if (p.namelessSealActive) {
    ctx.save();
    ctx.rotate(t * 0.9);
    ctx.strokeStyle = "rgba(253, 230, 138, 0.78)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  if (p.memoryMaskActive) {
    ctx.save();
    ctx.rotate(-t * 1.4);
    ctx.strokeStyle = "rgba(192, 132, 252, 0.78)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, 0, Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, Math.PI, Math.PI * 1.75);
    ctx.stroke();
    ctx.restore();
  }
  if (p.originFragmentForged) {
    ctx.save();
    ctx.rotate(t * 0.55);
    ctx.strokeStyle = "rgba(224, 242, 254, 0.78)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 24, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (radius + 24), Math.sin(a) * (radius + 24), 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 4. MAP 5 ENEMIES & FINAL BOSS: KẺ GIỮ HỒ SƠ
// ---------------------------------------------------------------------------

export function drawVoidCityEnemySprite(ctx, enemy, t, hitFlash) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const r = enemy.radius || 20;
  const kind = enemy.voidVariant || "faceless_statue";
  const eid = Number(enemy.id) || 0;
  const pulse = 0.7 + 0.3 * Math.sin(t * 4.2 + eid);

  // Mini-Boss / Elite golden archive crown ring
  if (enemy.isMiniBoss || enemy.elite) {
    ctx.save();
    ctx.rotate(t * 1.6);
    ctx.strokeStyle = `rgba(253, 224, 71, ${0.72 * pulse})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.rotate(enemy.facing || 0);

  if (kind === "mirror_dweller") {
    // Reflective Azure Crystal Shard Being + Orbiting Glass Splinters
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r * 1.15);
    g.addColorStop(0, hitFlash ? "#FFFFFF" : "#67E8F9");
    g.addColorStop(0.55, hitFlash ? "#E0F2FE" : "#0E7490");
    g.addColorStop(1, "#083344");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#A5F3FC";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(r * 1.18, 0);
    ctx.lineTo(0, r * 0.9);
    ctx.lineTo(-r * 1.06, 0);
    ctx.lineTo(0, -r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Internal facet lines + specular diagonal
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.45);
    ctx.lineTo(r * 0.6, r * 0.22);
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(0, r * 0.65);
    ctx.stroke();
    // Twin orbiting glass splinters
    for (let si = 0; si < 2; si++) {
      const oa = t * 2.8 + eid + si * Math.PI;
      ctx.save();
      ctx.translate(Math.cos(oa) * (r + 5), Math.sin(oa) * (r + 5));
      ctx.rotate(oa + Math.PI * 0.5);
      ctx.fillStyle = "#BAE6FD";
      ctx.beginPath();
      ctx.moveTo(0, -4.5);
      ctx.lineTo(2.8, 0);
      ctx.lineTo(0, 4.5);
      ctx.lineTo(-2.8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === "shadow_clone") {
    // Assassin Shadow Reflection with Twin Crescent Blades
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r);
    g.addColorStop(0, hitFlash ? "#F5D0FE" : "#4338CA");
    g.addColorStop(0.55, hitFlash ? "#E9D5FF" : "#1E1B4B");
    g.addColorStop(1, "#09071A");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#C084FC";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Specular shoulder rim
    ctx.strokeStyle = "rgba(233, 213, 255, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    // Twin crescent shadow-blades
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(r * 0.4, 0, r * 0.86, -1.12, -0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.4, 0, r * 0.86, 0.28, 1.12);
    ctx.stroke();
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.arc(r * 0.36, -4.2, 3.2, 0, Math.PI * 2);
    ctx.arc(r * 0.36, 4.2, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(r * 0.36, -4.2, 1.3, 0, Math.PI * 2);
    ctx.arc(r * 0.36, 4.2, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "relic_guardian") {
    // Hexagonal Gilded-Obsidian Automaton with Rotating Halo
    ctx.save();
    ctx.rotate(t * 1.4);
    ctx.strokeStyle = `rgba(253, 230, 138, ${0.62 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r);
    g.addColorStop(0, hitFlash ? "#FEF3C7" : "#475569");
    g.addColorStop(0.55, hitFlash ? "#FEF3C7" : "#1E293B");
    g.addColorStop(1, "#090D16");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Glowing gilded eye lens
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(r * 0.26, 0, 5.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(r * 0.26, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "erased_shadow" || kind === "librarian_wraith") {
    // Tattered Erased Void Phantom with Floating Dossier Strips & Blank Scratched Oval
    const accent = kind === "librarian_wraith" ? "#60A5FA" : "#A855F7";
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
    g.addColorStop(0, hitFlash ? "#CBD5E1" : "#1E293B");
    g.addColorStop(0.55, hitFlash ? "#CBD5E1" : "#090D18");
    g.addColorStop(1, "#020409");
    ctx.fillStyle = g;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.94, r * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Trailing shredded parchment ribbons
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -5);
    ctx.lineTo(-r * 1.18, -9 + Math.sin(t * 7 + eid) * 3.5);
    ctx.moveTo(-r * 0.6, 5);
    ctx.lineTo(-r * 1.18, 9 + Math.cos(t * 7 + eid) * 3.5);
    ctx.stroke();
    // Blank scratched-out face oval
    ctx.fillStyle = "#E2E8F0";
    ctx.beginPath();
    ctx.ellipse(r * 0.28, 0, r * 0.34, r * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(r * 0.14, -4);
    ctx.lineTo(r * 0.42, 4);
    ctx.moveTo(r * 0.42, -4);
    ctx.lineTo(r * 0.14, 4);
    ctx.stroke();
  } else {
    // faceless_statue: Weathered Marble Sentinel with Stone Shoulder Pauldrons & Blank Visor
    const g = ctx.createRadialGradient(-r * 0.26, -r * 0.26, 2, 0, 0, r);
    g.addColorStop(0, hitFlash ? "#FFFFFF" : "#64748B");
    g.addColorStop(0.55, hitFlash ? "#FFFFFF" : "#334155");
    g.addColorStop(1, "#0F172A");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Specular chisel rim
    ctx.strokeStyle = "rgba(241, 245, 249, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, -Math.PI * 0.85, -Math.PI * 0.25);
    ctx.stroke();
    // Stone pauldrons
    ctx.fillStyle = "#475569";
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -r * 0.72, r * 0.34, 0, Math.PI * 2);
    ctx.arc(0, r * 0.72, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Smooth featureless face band
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(2, -r * 0.44, r * 0.56, r * 0.88, 3);
    ctx.fill();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVoidCityBossEntityScene(ctx, boss, t) {
  ctx.save();
  ctx.translate(boss.x, boss.y);
  const r = boss.radius || 58;
  const hit = (boss.hitFlash || 0) > 0;
  const phase = boss.phase || 1;
  const pulse = 0.72 + 0.28 * Math.sin(t * 4);
  const rimCol = phase >= 2 ? "#C084FC" : "#38BDF8";

  // Soft radial archive aura
  const auraGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.85);
  auraGrad.addColorStop(0, phase >= 2 ? "rgba(168, 85, 247, 0.28)" : "rgba(56, 189, 248, 0.22)");
  auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.85, 0, Math.PI * 2);
  ctx.fill();

  // Ground Void Archive Aura Ring
  ctx.strokeStyle = phase >= 2 ? `rgba(192, 132, 252, ${0.58 * pulse})` : `rgba(56, 189, 248, ${0.48 * pulse})`;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.68, 0, Math.PI * 2);
  ctx.stroke();

  // Outer rotating storm of Inked Dossier Pages with tiny wax seals
  ctx.save();
  ctx.rotate(t * (phase >= 2 ? 2.3 : 1.45));
  const pageCount = phase >= 2 ? 10 : 8;
  for (let i = 0; i < pageCount; i++) {
    const a = (Math.PI * 2 * i) / pageCount;
    const dist = r * 1.42 + Math.sin(t * 4 + i) * 8;
    const px = Math.cos(a) * dist;
    const py = Math.sin(a) * dist;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a + Math.PI * 0.5);
    ctx.fillStyle = i % 2 === 0 ? "#FEF3C7" : "#E2E8F0";
    ctx.fillRect(-7, -10, 14, 20);
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -10, 14, 20);
    ctx.fillStyle = "#475569";
    ctx.fillRect(-4, -6, 8, 1.5);
    ctx.fillRect(-4, -2, 6, 1.5);
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(3, 5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Giant Abyssal Archival Cloak Body with 3D radial shading
  const bodyGrad = ctx.createRadialGradient(-r * 0.22, -r * 0.22, 4, 0, 0, r * 1.12);
  bodyGrad.addColorStop(0, hit ? "#F8FAFC" : phase >= 2 ? "#3B0764" : "#1E293B");
  bodyGrad.addColorStop(0.6, hit ? "#E2E8F0" : "#090B16");
  bodyGrad.addColorStop(1, "#020308");
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = phase >= 2 ? "#A855F7" : "#94A3B8";
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = (Math.PI * 2 * k) / 12 + Math.sin(t * 2 + k) * 0.06;
    const rad = r * (k % 2 === 0 ? 1.12 : 0.88);
    if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Phase 2/3 Void Archive Fissures across Cloak
  if (phase >= 2) {
    ctx.strokeStyle = "#E879F9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.15);
    ctx.lineTo(-r * 0.48, r * 0.08);
    ctx.moveTo(r * 0.78, -r * 0.15);
    ctx.lineTo(r * 0.48, r * 0.08);
    ctx.stroke();
  }

  // Double-Bevel Gilded Celestial Brass Crown-Halo
  ctx.strokeStyle = "#FDE68A";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Swirling Paper Vortex where the Face should be
  ctx.fillStyle = "#030408";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
  ctx.fill();
  for (let f = 0; f < 6; f++) {
    const fa = -t * 3.8 + (Math.PI * 2 * f) / 6;
    ctx.save();
    ctx.rotate(fa);
    ctx.fillStyle = f % 2 === 0 ? "#FDE68A" : "#BAE6FD";
    ctx.fillRect(7, -4, 14, 7.5);
    ctx.restore();
  }

  // Piercing Phase-2 Observer Slit Eyes + sharp inner glints
  if (phase >= 2) {
    ctx.fillStyle = "#E879F9";
    ctx.beginPath();
    ctx.ellipse(-10, -3, 5.4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(10, -3, 5.4, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-10, -3, 1.4, 0, Math.PI * 2);
    ctx.arc(10, -3, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5. ATMOSPHERE OVERLAY: Twilight Beams, Tumbling Dossier Pages, Mist & Dim
// ---------------------------------------------------------------------------

export function renderVoidCityAtmosphere(ctx, engine, t, viewW, viewH) {
  const runtime = engine.voidCityRuntime;
  if (!runtime) return;
  const perf = engine.getPerformanceProfile?.() || { tier: "high", effectiveTier: "high", enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  ctx.save();

  // Diagonal Twilight Azure-Violet Cathedral Beams
  if (allowGlows && perf.effectiveTier !== "saver") {
    for (let ray = 0; ray < 3; ray++) {
      const rx = ((ray * 440 + Math.sin(t * 0.18 + ray) * 60) % (viewW + 260)) - 130;
      const g = ctx.createLinearGradient(rx, 0, rx + 200, viewH * 0.85);
      g.addColorStop(0, ray % 2 === 0 ? "rgba(186, 230, 253, 0.045)" : "rgba(192, 132, 252, 0.042)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx - 40, 0);
      ctx.lineTo(rx + 60, 0);
      ctx.lineTo(rx + 280, viewH);
      ctx.lineTo(rx + 115, viewH);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Drifting Torn Archive Pages & Pale Gold-Silver Dust Motes
  const count = perf.tier === "low" ? 12 : perf.tier === "medium" ? 20 : 30;
  for (let i = 0; i < count; i++) {
    const x = ((i * 199 + t * (14 + (i % 4) * 5) + Math.sin(t + i) * 38) % (viewW + 60)) - 30;
    const y = ((i * 131 + t * (18 + (i % 3) * 7)) % (viewH + 60)) - 30;
    if (i % 4 === 0) {
      // Drifting antique paper page
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.9 + i);
      ctx.fillStyle = "rgba(254, 243, 199, 0.28)";
      ctx.fillRect(-4, -5.5, 8, 11);
      ctx.restore();
    } else {
      ctx.fillStyle =
        i % 3 === 0
          ? "rgba(253, 230, 138, 0.36)"
          : i % 3 === 1
            ? "rgba(186, 230, 253, 0.34)"
            : "rgba(192, 132, 252, 0.3)";
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layered Drifting Void City Mist Pockets
  if (allowGlows) {
    for (let m = 0; m < 4; m++) {
      const mx = ((t * (12 + m * 5) + m * 330) % (viewW + 320)) - 160;
      const my = (m * 200 + Math.cos(t * 0.26 + m) * 42) % viewH;
      const g = ctx.createRadialGradient(mx, my, 20, mx, my, 240);
      g.addColorStop(0, m % 2 === 0 ? "rgba(56, 189, 248, 0.055)" : "rgba(168, 85, 247, 0.065)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // Vision warp / twilight vignette during zone darkness or Boss Keeper of Dossiers skills
  const dim = Math.min(0.75, (engine.voidCityVisionDim || 0) + (runtime.visionDimFactor || 0) * 0.35);
  const vg = ctx.createRadialGradient(
    viewW * 0.5,
    viewH * 0.5,
    Math.min(viewW, viewH) * Math.max(0.14, 0.36 - dim * 0.16),
    viewW * 0.5,
    viewH * 0.5,
    Math.max(viewW, viewH) * 0.72
  );
  vg.addColorStop(0, "rgba(5, 6, 11, 0)");
  vg.addColorStop(1, `rgba(3, 5, 11, ${Math.min(0.82, 0.28 + dim)})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.restore();
}
