import { isCircleInViewBounds } from "./combatLogic";
import {
  FROZEN_TOMB_WIDTH,
  FROZEN_TOMB_HEIGHT,
  FROZEN_TOMB_ZONES,
  FROZEN_TOMB_INTERACTABLES,
  FROZEN_TOMB_ICE_PATCHES,
  FROZEN_TOMB_RUNE_PILLARS,
  getFrozenTombZoneAt,
  getActiveFrozenTombObstacles,
  findNearestFrozenTombInteractable,
  normalizeFrozenTombProgress,
} from "./frozenTombMap";

// Zero ctx.shadowBlur usage for smooth 60fps Canvas 2D performance on Android & desktop.

export function getFrozenTombZoneLabel(x, y, lang = "vi") {
  const z = getFrozenTombZoneAt(x, y);
  return lang === "en" ? z.name.en : z.name.vi;
}

function getBoundsEdges(vb) {
  if (!vb) return null;
  const minX = vb.minX ?? vb.left ?? 0;
  const maxX = vb.maxX ?? vb.right ?? FROZEN_TOMB_WIDTH;
  const minY = vb.minY ?? vb.top ?? 0;
  const maxY = vb.maxY ?? vb.bottom ?? FROZEN_TOMB_HEIGHT;
  return { minX, maxX, minY, maxY };
}

function isRectVisible(r, vb, pad = 90) {
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
  let n = Math.imul(ix + 41, 73856093) ^ Math.imul(iy + 97, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function drawForgedChain(ctx, x1, y1, x2, y2, linkLen = 9, colBody = "#64748B", colSpec = "#E0F2FE", isMono = false, sag = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const steps = Math.max(2, Math.round(dist / (linkLen * 0.8)));
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const arch = sag * Math.sin(f * Math.PI);
    const px = x1 + dx * f + nx * arch;
    const py = y1 + dy * f + ny * arch + Math.abs(sag) * 0.2 * Math.sin(f * Math.PI);
    const ang = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    if (i % 2 === 0) {
      ctx.strokeStyle = "rgba(2, 6, 23, 0.72)";
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.ellipse(0, 1.2, linkLen * 0.56, linkLen * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#94A3B8" : colBody;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, linkLen * 0.56, linkLen * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#F8FAFC" : colSpec;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(0, -0.4, linkLen * 0.45, linkLen * 0.22, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.strokeStyle = isMono ? "#CBD5E1" : colBody;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.44, 0);
      ctx.lineTo(linkLen * 0.44, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawIceCrystalCluster(ctx, x, y, scale = 1, rot = 0, tintBody = "#0E7490", tintSpec = "#E0F2FE", isMono = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  const shards = [
    { a: -0.45, len: 14, w: 4.5 },
    { a: 0.04, len: 20, w: 5.5 },
    { a: 0.52, len: 12, w: 4.0 },
  ];
  for (const s of shards) {
    ctx.save();
    ctx.rotate(s.a);
    ctx.fillStyle = isMono ? "rgba(148, 163, 184, 0.6)" : tintBody;
    ctx.strokeStyle = isMono ? "#F8FAFC" : tintSpec;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -s.len);
    ctx.lineTo(s.w, -s.len * 0.28);
    ctx.lineTo(s.w * 0.7, 3);
    ctx.lineTo(-s.w * 0.7, 3);
    ctx.lineTo(-s.w, -s.len * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright crystal facet line
    ctx.strokeStyle = "rgba(240, 249, 255, 0.55)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -s.len + 2);
    ctx.lineTo(0, 1);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawIcicleFringe(ctx, x, y, w, spacing = 16, maxLen = 11, isMono = false) {
  ctx.save();
  ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.72)" : "rgba(186, 230, 253, 0.72)";
  ctx.strokeStyle = isMono ? "#F8FAFC" : "rgba(240, 249, 255, 0.85)";
  ctx.lineWidth = 0.8;
  for (let ix = x + 6; ix < x + w - 5; ix += spacing) {
    const hv = hashCell(Math.round(ix), Math.round(y));
    const len = 5 + hv * (maxLen - 5);
    const hw = 2.2 + hv * 1.4;
    ctx.beginPath();
    ctx.moveTo(ix - hw, y);
    ctx.lineTo(ix + hw, y);
    ctx.lineTo(ix + (hv - 0.5) * 1.6, y + len);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnowCapRim(ctx, x, y, w, h, seed = 0, isMono = false) {
  const capH = Math.min(9, Math.max(4, h * 0.22));
  ctx.save();
  ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.65)" : "rgba(224, 242, 254, 0.68)";
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 1);
  ctx.lineTo(x + w - 1, y + 1);
  ctx.lineTo(x + w - 1, y + capH);
  const segs = Math.max(3, Math.floor(w / 22));
  for (let i = segs; i >= 0; i--) {
    const px = x + 1 + ((w - 2) * i) / segs;
    const wave = hashCell(i + Math.round(seed), Math.round(y)) * 4.5;
    ctx.lineTo(px, y + capH + wave);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1.5);
  ctx.lineTo(x + w - 2, y + 1.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * 2.5D Dark-Fantasy Glacial Stone Masonry with running-bond ashlar seams, frost cracks, snow cornice & icicles.
 */
function drawIceGlazedMasonry(ctx, x, y, w, h, faceH, topCol, faceCol, strokeCol, isMono, seed = 0, addIcicles = true) {
  const topH = Math.max(4, h - faceH);
  // Base cast shadow SE
  ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
  ctx.fillRect(x + 6, y + 8, w, h);

  // 2.5D vertical southern face + top parapet slab
  ctx.fillStyle = faceCol;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = topCol;
  ctx.fillRect(x + 1, y + 1, Math.max(2, w - 2), topH);

  // Ashlar brick courses on top cap + facade seams
  ctx.strokeStyle = isMono ? "rgba(15, 23, 42, 0.5)" : "rgba(2, 6, 23, 0.52)";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  const rowH = topH > 46 ? 20 : 15;
  const rows = Math.max(1, Math.floor(topH / rowH));
  for (let r = 1; r < rows; r++) {
    const ry = y + (topH * r) / rows;
    ctx.moveTo(x + 2, ry);
    ctx.lineTo(x + w - 2, ry);
  }
  const brickW = 28;
  for (let r = 0; r < rows; r++) {
    const ry0 = y + (topH * r) / rows + 1;
    const ry1 = y + (topH * (r + 1)) / rows;
    const stagger = r % 2 === 1 ? brickW * 0.5 : 0;
    for (let bx = x + 16 + stagger; bx < x + w - 10; bx += brickW) {
      ctx.moveTo(bx, ry0);
      ctx.lineTo(bx, ry1);
    }
  }
  // Ledge ridge & vertical southern face courses
  ctx.moveTo(x, y + h - faceH);
  ctx.lineTo(x + w, y + h - faceH);
  for (let bx = x + 22; bx < x + w - 10; bx += 26) {
    ctx.moveTo(bx, y + h - faceH);
    ctx.lineTo(bx, y + h - 1);
  }
  ctx.stroke();

  // Frosted stone shading variation & rime veins
  const cols = Math.max(1, Math.floor(w / 44));
  for (let i = 0; i < cols; i++) {
    const hv = hashCell(Math.round(x + i * 29 + seed), Math.round(y));
    if (hv > 0.58) {
      ctx.fillStyle = "rgba(186, 230, 253, 0.14)";
      ctx.fillRect(x + 4 + i * (w / cols), y + 4, (w / cols) * 0.55, Math.min(11, topH * 0.45));
    }
    if (hv > 0.7 && w >= 42 && topH >= 16) {
      const fx = x + 14 + (w - 28) * hv;
      const fy = y + 6 + (topH - 12) * ((hv * 3.1) % 1);
      ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.45)" : "rgba(125, 211, 252, 0.42)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(fx - 7, fy - 3);
      ctx.lineTo(fx, fy + 2);
      ctx.lineTo(fx + 8, fy - 2);
      ctx.stroke();
    }
  }

  // Accumulated snow cap along top edge
  drawSnowCapRim(ctx, x, y, w, h, seed, isMono);

  // Outer icy stone outline
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  // Hanging icicles along southern ledge
  if (addIcicles && w >= 36) {
    drawIcicleFringe(ctx, x + 4, y + h, w - 8, 18, 9, isMono);
  }
}

function drawFrozenLantern(ctx, x, y, color, t, allowGlows, isMono) {
  ctx.save();
  ctx.translate(x, y);
  const flicker = 0.78 + 0.22 * Math.sin(t * 4.5 + x * 0.1 + y * 0.07);
  if (!isMono && allowGlows) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
    g.addColorStop(0, color === "violet" ? `rgba(168, 85, 247, ${0.34 * flicker})` : `rgba(56, 189, 248, ${0.34 * flicker})`);
    g.addColorStop(1, "rgba(8, 22, 46, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
  }
  // Iron lantern cage + ghostly eternal blue flame
  ctx.fillStyle = "#0F172A";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#94A3B8";
  ctx.lineWidth = 1.4;
  ctx.fillRect(-5, -6, 10, 12);
  ctx.strokeRect(-5, -6, 10, 12);
  ctx.fillStyle = isMono ? "#F8FAFC" : color === "violet" ? "#E879F9" : "#7DD3FC";
  ctx.beginPath();
  ctx.arc(0, 0, 3.2 * flicker, 0, Math.PI * 2);
  ctx.fill();
  // Frost cap on lantern roof
  ctx.fillStyle = "#E0F2FE";
  ctx.fillRect(-6, -8, 12, 2.6);
  ctx.restore();
}

function drawFrozenCorpse(ctx, x, y, rot = 0, sitting = false, standing = false, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  if (standing) {
    // Faceted translucent ice monolith encasing upright figure
    ctx.fillStyle = "rgba(14, 116, 144, 0.36)";
    ctx.strokeStyle = "rgba(186, 230, 253, 0.65)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, -6);
    ctx.lineTo(12, 12);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-15, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Upright shrouded torso & frosted head
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#BAE6FD";
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sitting) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.arc(0, -2, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(125, 211, 252, 0.62)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
  } else {
    // Fallen warrior half-buried in snowdrift + broken shield + frosted spear
    ctx.fillStyle = "rgba(224, 242, 254, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 18, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Shield rim
    ctx.fillStyle = "#1E293B";
    ctx.strokeStyle = "#7DD3FC";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-9, 6, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Armored torso & helm
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.ellipse(-1, 0, 11, 5.5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.arc(9, -1, 4.6, 0, Math.PI * 2);
    ctx.fill();
    // Frozen spear / blade glint
    const gl = 0.35 + 0.2 * Math.sin(t * 2 + x);
    ctx.strokeStyle = `rgba(186, 230, 253, ${gl})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-14, 9);
    ctx.lineTo(16, -11);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrozenWarriorStatue(ctx, ob, isMono) {
  const cx = ob.x + ob.w * 0.5;
  const cy = ob.y + ob.h * 0.5;
  ctx.save();
  // Cast shadow
  ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
  ctx.fillRect(ob.x + 6, ob.y + 8, ob.w, ob.h);

  // Stepped granite pedestal encased in ice
  drawIceGlazedMasonry(
    ctx,
    ob.x,
    ob.y,
    ob.w,
    ob.h,
    10,
    isMono ? "#475569" : "#1E3A5F",
    isMono ? "#334155" : "#0F2138",
    isMono ? "#E2E8F0" : "#7DD3FC",
    isMono,
    ob.x,
    false
  );

  // Carved frozen knight shoulders, cloak, crossed greatsword & glacier shell
  ctx.fillStyle = isMono ? "#64748B" : "#334155";
  ctx.strokeStyle = isMono ? "#F8FAFC" : "#BAE6FD";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crossed sword blade across statue chest
  ctx.strokeStyle = isMono ? "#E2E8F0" : "#E0F2FE";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 12);
  ctx.lineTo(cx + 12, cy - 12);
  ctx.moveTo(cx - 9, cy - 4);
  ctx.lineTo(cx - 3, cy - 10);
  ctx.stroke();

  // Frosted blank-faced knight helm
  ctx.fillStyle = isMono ? "#CBD5E1" : "#64748B";
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#E0F2FE";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Translucent ice shroud over face
  ctx.fillStyle = "rgba(125, 211, 252, 0.34)";
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 11, 0, Math.PI * 2);
  ctx.fill();

  drawIceCrystalCluster(ctx, ob.x + 8, ob.y + ob.h - 4, 0.72, -0.3, "#0E7490", "#BAE6FD", isMono);
  drawIceCrystalCluster(ctx, ob.x + ob.w - 8, ob.y + ob.h - 4, 0.72, 0.3, "#0E7490", "#BAE6FD", isMono);
  ctx.restore();
}

export function renderFrozenTombFloor(ctx, engine, t, viewBounds) {
  const perf = engine.getPerformanceProfile?.() || { tier: "high", enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const mono = Boolean(engine.player?.tin_monochrome_realm_timer > 0);
  const runtime = engine.frozenTombRuntime;
  const vb = getBoundsEdges(viewBounds);

  // Base frozen abyssal ground gradient
  const bg = ctx.createLinearGradient(0, 0, FROZEN_TOMB_WIDTH, FROZEN_TOMB_HEIGHT);
  if (mono) {
    bg.addColorStop(0, "#0F172A");
    bg.addColorStop(1, "#020617");
  } else {
    bg.addColorStop(0, "#0A172B");
    bg.addColorStop(0.45, "#071224");
    bg.addColorStop(0.75, "#0B0D21");
    bg.addColorStop(1, "#06040E");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, FROZEN_TOMB_WIDTH, FROZEN_TOMB_HEIGHT);

  // Zone ambient floor plates + district ice mosaic borders (view-culled)
  for (const z of FROZEN_TOMB_ZONES) {
    if (!isRectVisible(z, vb, 60)) continue;
    ctx.save();
    if (z.id === "zone_1") ctx.fillStyle = "rgba(56, 189, 248, 0.055)";
    else if (z.id === "zone_2") ctx.fillStyle = "rgba(103, 232, 249, 0.048)";
    else if (z.id === "zone_3") ctx.fillStyle = "rgba(99, 102, 241, 0.065)";
    else if (z.id === "zone_4") ctx.fillStyle = "rgba(147, 197, 253, 0.045)";
    else if (z.id === "zone_5") ctx.fillStyle = "rgba(129, 140, 248, 0.06)";
    else if (z.id === "zone_6") ctx.fillStyle = "rgba(147, 51, 234, 0.07)";
    else ctx.fillStyle = "rgba(88, 28, 135, 0.1)";
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = mono ? "rgba(226,232,240,0.12)" : "rgba(125, 211, 252, 0.09)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(z.x + 2, z.y + 2, z.w - 4, z.h - 4);
    ctx.restore();
  }

  // Deep cavern transition darkness gradient on Zone 6 South
  if (!mono && isRectVisible({ x: 2350, y: 1250, w: 1050, h: 1550 }, vb, 60)) {
    const gCav = ctx.createLinearGradient(2350, 1300, 3250, 2550);
    gCav.addColorStop(0, "rgba(12, 74, 110, 0.05)");
    gCav.addColorStop(0.5, "rgba(59, 7, 100, 0.24)");
    gCav.addColorStop(1, "rgba(3, 5, 10, 0.62)");
    ctx.fillStyle = gCav;
    ctx.fillRect(2350, 1250, 1050, 1550);
  }

  // Staggered snow flagstone masonry grid & subtle snowdrifts inside visible viewport
  if (vb) {
    const startX = Math.max(0, Math.floor(vb.minX / 140) * 140);
    const endX = Math.min(FROZEN_TOMB_WIDTH, Math.ceil(vb.maxX / 140) * 140);
    const startY = Math.max(0, Math.floor(vb.minY / 140) * 140);
    const endY = Math.min(FROZEN_TOMB_HEIGHT, Math.ceil(vb.maxY / 140) * 140);

    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.09)" : "rgba(125, 211, 252, 0.075)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = startX; gx <= endX; gx += 140) {
      ctx.moveTo(gx, startY);
      ctx.lineTo(gx, endY);
    }
    for (let gy = startY; gy <= endY; gy += 140) {
      ctx.moveTo(startX, gy);
      ctx.lineTo(endX, gy);
    }
    ctx.stroke();

    if (perf.effectiveTier !== "saver") {
      for (let gx = startX; gx < endX; gx += 140) {
        for (let gy = startY; gy < endY; gy += 140) {
          const hv = hashCell(gx / 140, gy / 140);
          if (hv > 0.68) {
            ctx.fillStyle = mono ? "rgba(226,232,240,0.08)" : "rgba(186, 230, 253, 0.085)";
            ctx.beginPath();
            ctx.ellipse(gx + 70, gy + 70, 38 * hv, 16 * hv, hv * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  // Outer Frozen Kingdom Battlement Perimeter Walls (clearly visible edge boundary!)
  ctx.save();
  ctx.strokeStyle = mono ? "#334155" : "#0F2942";
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, FROZEN_TOMB_WIDTH - 18, FROZEN_TOMB_HEIGHT - 18);
  ctx.strokeStyle = mono ? "#CBD5E1" : "#38BDF8";
  ctx.lineWidth = 2.6;
  ctx.strokeRect(18, 18, FROZEN_TOMB_WIDTH - 36, FROZEN_TOMB_HEIGHT - 36);
  if (vb) {
    ctx.fillStyle = mono ? "#64748B" : "#1E3A5F";
    const step = 110;
    for (let mx = 48; mx < FROZEN_TOMB_WIDTH - 48; mx += step) {
      if (mx + 28 >= vb.minX && mx <= vb.maxX) {
        if (vb.minY <= 40) ctx.fillRect(mx, 2, 28, 14);
        if (vb.maxY >= FROZEN_TOMB_HEIGHT - 40) ctx.fillRect(mx, FROZEN_TOMB_HEIGHT - 16, 28, 14);
      }
    }
    for (let my = 48; my < FROZEN_TOMB_HEIGHT - 48; my += step) {
      if (my + 28 >= vb.minY && my <= vb.maxY) {
        if (vb.minX <= 40) ctx.fillRect(2, my, 14, 28);
        if (vb.maxX >= FROZEN_TOMB_WIDTH - 40) ctx.fillRect(FROZEN_TOMB_WIDTH - 16, my, 14, 28);
      }
    }
  }
  ctx.restore();

  // Royal Cobblestone Roads + Curb Stones connecting Gate -> Old Town -> Cathedral -> Palace -> Graveyard
  const roads = [
    { x: 410, y: 1740, w: 140, h: 920 },
    { x: 480, y: 1380, w: 940, h: 120 },
    { x: 1710, y: 740, w: 180, h: 1220 },
    { x: 640, y: 420, w: 1120, h: 110 },
  ];
  for (const rd of roads) {
    if (!isRectVisible(rd, vb, 60)) continue;
    ctx.fillStyle = mono ? "rgba(51, 65, 85, 0.42)" : "rgba(23, 46, 77, 0.48)";
    ctx.fillRect(rd.x, rd.y, rd.w, rd.h);
    // Cobblestone tile lines
    ctx.strokeStyle = "rgba(186, 230, 253, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (rd.w > rd.h) {
      for (let cx = rd.x + 36; cx < rd.x + rd.w; cx += 36) {
        ctx.moveTo(cx, rd.y + 4);
        ctx.lineTo(cx, rd.y + rd.h - 4);
      }
    } else {
      for (let cy = rd.y + 36; cy < rd.y + rd.h; cy += 36) {
        ctx.moveTo(rd.x + 4, cy);
        ctx.lineTo(rd.x + rd.w - 4, cy);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.3)" : "rgba(186, 230, 253, 0.28)";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(rd.x, rd.y, rd.w, rd.h);
  }

  // Old Town Plaza Square Fountain Ruin at intersection (640, 1440)
  if (isCircleInViewBounds(640, 1440, 140, viewBounds)) {
    ctx.save();
    ctx.translate(640, 1440);
    ctx.strokeStyle = mono ? "#CBD5E1" : "rgba(125, 211, 252, 0.35)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Smooth Slippery Ice Patches
  for (const patch of FROZEN_TOMB_ICE_PATCHES) {
    if (!isCircleInViewBounds(patch.x, patch.y, Math.max(patch.rx, patch.ry) + 20, viewBounds)) continue;
    ctx.save();
    ctx.translate(patch.x, patch.y);
    ctx.rotate(patch.angle);
    ctx.fillStyle = mono ? "rgba(203, 213, 225, 0.25)" : "rgba(56, 189, 248, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 0, patch.rx, patch.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mono ? "#E2E8F0" : "rgba(186, 230, 253, 0.55)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Specular ice mirror streaks
    ctx.strokeStyle = "rgba(240, 249, 255, 0.38)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-patch.rx * 0.48, -patch.ry * 0.26);
    ctx.lineTo(patch.rx * 0.38, -patch.ry * 0.08);
    ctx.moveTo(-patch.rx * 0.22, patch.ry * 0.22);
    ctx.lineTo(patch.rx * 0.52, patch.ry * 0.08);
    ctx.stroke();
    ctx.restore();
  }

  // Enterable Buildings Floor Interiors (Inn, Clock House, Herbalist, Cathedral Nave, Palace Dais & Trung Archive)
  const interiors = [
    { id: "inn", x: 162, y: 1362, w: 296, h: 250, base: "#111827", glow: "rgba(56, 189, 248, 0.22)", wood: true },
    { id: "clock", x: 817, y: 1152, w: 276, h: 258, base: "#0E1729", glow: "rgba(103, 232, 249, 0.24)", wood: true },
    { id: "herb", x: 162, y: 1019, w: 246, h: 160, base: "#0F1B2E", glow: "rgba(52, 211, 153, 0.16)", wood: true },
    { id: "cath", x: 1422, y: 1042, w: 756, h: 678, base: "#090D1F", glow: "rgba(99, 102, 241, 0.18)", wood: false },
    { id: "palace_main", x: 1480, y: 190, w: 880, h: 530, base: "#0B1126", glow: "rgba(129, 140, 248, 0.15)", wood: false },
    { id: "palace_secret", x: 2698, y: 178, w: 502, h: 402, base: "#0D0A1E", glow: "rgba(168, 85, 247, 0.2)", wood: false },
  ];
  for (const room of interiors) {
    if (!isRectVisible(room, vb, 60)) continue;
    ctx.save();
    ctx.fillStyle = mono ? "#1E293B" : room.base;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    if (room.wood) {
      // Frosted wooden plank floor boards inside Old Town houses
      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let py = room.y + 18; py < room.y + room.h; py += 18) {
        ctx.moveTo(room.x + 2, py);
        ctx.lineTo(room.x + room.w - 2, py);
      }
      ctx.stroke();
    }
    if (allowGlows) {
      const rg = ctx.createRadialGradient(
        room.x + room.w * 0.5,
        room.y + room.h * 0.5,
        12,
        room.x + room.w * 0.5,
        room.y + room.h * 0.5,
        Math.max(room.w, room.h) * 0.62
      );
      rg.addColorStop(0, room.glow);
      rg.addColorStop(1, "rgba(8, 18, 36, 0)");
      ctx.fillStyle = rg;
      ctx.fillRect(room.x, room.y, room.w, room.h);
    }
    ctx.restore();
  }

  // ZONE 3: CATHEDRAL INTERIOR DETAILS — Marble Checkered Nave, Frozen Altar Carpet, Rose Mosaic, Stained Glass Light Beams & Overturned Pews!
  if (isRectVisible({ x: 1420, y: 1040, w: 760, h: 680 }, vb, 90)) {
    ctx.save();
    // Marble sanctuary stone tile pattern
    const tileS = 54;
    for (let tx = 1428; tx < 2168; tx += tileS) {
      for (let ty = 1048; ty < 1712; ty += tileS) {
        if (((Math.floor(tx / tileS) + Math.floor(ty / tileS)) & 1) === 0) {
          ctx.fillStyle = mono ? "rgba(148, 163, 184, 0.08)" : "rgba(129, 140, 248, 0.08)";
          ctx.fillRect(tx, ty, tileS, tileS);
        }
      }
    }

    // Grand Frosted Royal-Indigo Cathedral Runner Carpet leading North->South
    ctx.fillStyle = mono ? "rgba(100, 116, 139, 0.35)" : "rgba(49, 46, 129, 0.52)";
    ctx.fillRect(1748, 1052, 104, 658);
    ctx.strokeStyle = mono ? "#CBD5E1" : "#818CF8";
    ctx.lineWidth = 2;
    ctx.strokeRect(1748, 1052, 104, 658);
    ctx.strokeStyle = mono ? "#94A3B8" : "rgba(186, 230, 253, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(1756, 1058, 88, 646);

    // Central Gothic Rose-Window Floor Mosaic under Belfry Crossing (1800, 1350)
    ctx.save();
    ctx.translate(1800, 1350);
    ctx.fillStyle = mono ? "rgba(30, 41, 59, 0.6)" : "rgba(15, 23, 66, 0.65)";
    ctx.beginPath();
    ctx.arc(0, 0, 116, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mono ? "#E2E8F0" : "#818CF8";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = mono ? "#94A3B8" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * k) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.lineTo(Math.cos(a) * 114, Math.sin(a) * 114);
      ctx.stroke();
    }
    ctx.restore();

    // Blue & Violet Stained Glass Sunbeams streaming across both West & East Nave floors
    const beamOffsets = [1155, 1345, 1545];
    beamOffsets.forEach((by, idx) => {
      // West stained glass lancet beam
      ctx.fillStyle = idx % 2 === 0 ? "rgba(56, 189, 248, 0.16)" : "rgba(168, 85, 247, 0.14)";
      ctx.beginPath();
      ctx.moveTo(1424, by - 28);
      ctx.lineTo(1755, by + 56);
      ctx.lineTo(1755, by + 116);
      ctx.lineTo(1424, by + 26);
      ctx.closePath();
      ctx.fill();

      // East stained glass lancet beam
      ctx.fillStyle = idx % 2 === 0 ? "rgba(129, 140, 248, 0.14)" : "rgba(56, 189, 248, 0.13)";
      ctx.beginPath();
      ctx.moveTo(2176, by - 26);
      ctx.lineTo(1852, by + 54);
      ctx.lineTo(1852, by + 112);
      ctx.lineTo(2176, by + 24);
      ctx.closePath();
      ctx.fill();
    });

    // Overturned & Intact Wooden Cathedral Pews + Cracked Saint Fragments
    const pews = [
      { x: 1645, y: 1320, rot: 0.18, knocked: true },
      { x: 1955, y: 1315, rot: -0.24, knocked: true },
      { x: 1645, y: 1585, rot: -0.04, knocked: false },
      { x: 1955, y: 1595, rot: 0.34, knocked: true },
    ];
    for (const pw of pews) {
      ctx.save();
      ctx.translate(pw.x, pw.y);
      ctx.rotate(pw.rot);
      ctx.fillStyle = "rgba(0,0,0,0.48)";
      ctx.fillRect(-40, -8, 84, 22);
      ctx.fillStyle = "#2A1F1C";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.fillRect(-42, -10, 84, 20);
      ctx.strokeRect(-42, -10, 84, 20);
      // Pew backrest ridge & frost sheen
      ctx.fillStyle = "#171110";
      ctx.fillRect(-40, pw.knocked ? 2 : -8, 80, 5);
      ctx.fillStyle = "rgba(186, 230, 253, 0.3)";
      ctx.fillRect(-38, -9, 58, 3);
      ctx.restore();
    }

    // Cracked marble saint pedestal rubble on west aisle
    ctx.fillStyle = "#1E293B";
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(1515, 1380, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#38BDF8";
    ctx.beginPath();
    ctx.moveTo(1507, 1373);
    ctx.lineTo(1522, 1388);
    ctx.stroke();
    ctx.restore();
  }

  // ZONE 5: PALACE ROYAL FLOOR CARPET & FROZEN HALL ACCENTS
  if (isRectVisible({ x: 1480, y: 190, w: 920, h: 530 }, vb, 60)) {
    ctx.save();
    ctx.fillStyle = mono ? "rgba(100,116,139,0.28)" : "rgba(30, 58, 138, 0.42)";
    ctx.fillRect(1840, 195, 120, 520);
    ctx.strokeStyle = mono ? "#CBD5E1" : "#A5B4FC";
    ctx.lineWidth = 2;
    ctx.strokeRect(1840, 195, 120, 520);
    // Frosted magic seal circle around EE4 Thanh Ritual Corner (2140, 590)
    ctx.strokeStyle = "rgba(52, 211, 153, 0.34)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(2140, 590, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ZONE 2: OLD TOWN INN FROZEN DINING TABLES, SOUP BOWLS & SEATED CORPSES
  if (isCircleInViewBounds(310, 1475, 220, viewBounds)) {
    const tables = [
      { x: 248, y: 1450 },
      { x: 372, y: 1520 },
    ];
    for (const tb of tables) {
      ctx.fillStyle = "#291D16";
      ctx.strokeStyle = "rgba(125, 211, 252, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(tb.x, tb.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Frosted ceramic soup bowls on table
      ctx.fillStyle = "#CBD5E1";
      ctx.beginPath();
      ctx.arc(tb.x - 9, tb.y - 4, 4.2, 0, Math.PI * 2);
      ctx.arc(tb.x + 10, tb.y + 5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      drawFrozenCorpse(ctx, tb.x - 32, tb.y, 0.2, true, false, t);
      drawFrozenCorpse(ctx, tb.x + 32, tb.y - 4, -0.3, true, false, t);
    }
    drawFrozenLantern(ctx, 185, 1385, "cyan", t, allowGlows, mono);
    drawFrozenLantern(ctx, 435, 1385, "cyan", t, allowGlows, mono);
    drawFrozenLantern(ctx, 845, 1175, "cyan", t, allowGlows, mono);
  }

  // ZONE 1: GATE FALLEN WARRIORS & WEAPONS NEAR SPAWN
  if (isCircleInViewBounds(480, 2480, 420, viewBounds)) {
    drawFrozenCorpse(ctx, 320, 2490, 0.6, false, false, t);
    drawFrozenCorpse(ctx, 645, 2395, -0.8, false, false, t);
    drawFrozenCorpse(ctx, 415, 2610, 1.3, false, false, t);
    drawFrozenLantern(ctx, 370, 2262, "cyan", t, allowGlows, mono);
    drawFrozenLantern(ctx, 590, 2262, "cyan", t, allowGlows, mono);
  }

  // ZONE 4: GRAVEYARD GLOWING CRACKED GRAVES, UPRIGHT CORPSES & VANISHING FOOTPRINTS
  if (isRectVisible({ x: 100, y: 80, w: 1120, h: 780 }, vb, 80)) {
    const crackedGraves = [
      { x: 350, y: 310 },
      { x: 560, y: 295 },
      { x: 790, y: 310 },
      { x: 360, y: 650 },
      { x: 795, y: 650 },
    ];
    for (const gr of crackedGraves) {
      const pulse = 0.34 + 0.24 * Math.sin(t * 2.5 + gr.x);
      ctx.fillStyle = "#030712";
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + pulse})`;
      ctx.lineWidth = 2;
      ctx.fillRect(gr.x - 24, gr.y - 13, 48, 26);
      ctx.strokeRect(gr.x - 24, gr.y - 13, 48, 26);
      // Cracked open stone grave lid glowing blue from inside
      ctx.fillStyle = `rgba(103, 232, 249, ${pulse})`;
      ctx.fillRect(gr.x - 16, gr.y - 5, 32, 10);
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(gr.x - 24, gr.y - 17, 46, 6);
    }
    drawFrozenCorpse(ctx, 360, 445, 0, false, true, t);
    drawFrozenCorpse(ctx, 895, 255, 0.2, false, true, t);
    drawFrozenCorpse(ctx, 945, 305, -0.15, false, true, t);

    if (runtime?.ghostFootprints) {
      for (const fp of runtime.ghostFootprints) {
        const a = Math.max(0, 1 - fp.life / Math.max(0.2, fp.maxLife)) * 0.62;
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.rotate(fp.angle);
        ctx.fillStyle = `rgba(186, 230, 253, ${a})`;
        ctx.beginPath();
        ctx.ellipse(0, -4, 5, 2.6, 0, 0, Math.PI * 2);
        ctx.ellipse(6, 4, 5, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ZONE 7: FINAL SEALING CHAMBER RITUAL FLOOR & 4 RUNE PILLARS RESONANCE
  if (isCircleInViewBounds(1750, 2320, 480, viewBounds)) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    ctx.save();
    ctx.fillStyle = mono ? "rgba(15,23,42,0.45)" : "rgba(17, 7, 36, 0.55)";
    ctx.beginPath();
    ctx.arc(1750, 2320, 305, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.4)" : `rgba(168, 85, 247, ${0.34 + pulse * 0.28})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1750, 2320, 290, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = mono ? "rgba(226, 232, 240, 0.26)" : "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(1750, 2320, 195, 0, Math.PI * 2);
    ctx.stroke();

    for (const rp of FROZEN_TOMB_RUNE_PILLARS) {
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.26 + pulse * 0.22})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(rp.x, rp.y);
      ctx.lineTo(1750, 2320);
      ctx.stroke();
    }
    ctx.restore();
  }

  // HAZARDS GROUND LAYER: Cracked Ice, Ice Hands, Sealing Remnants
  if (runtime) {
    for (const cr of runtime.crackedIceZones) {
      if (!isCircleInViewBounds(cr.x, cr.y, cr.radius + 20, viewBounds)) continue;
      ctx.save();
      ctx.translate(cr.x, cr.y);
      const isFrozenSolid = cr.eohyenFrozenTimer > 0;
      if (isFrozenSolid) {
        ctx.fillStyle = "rgba(186, 230, 253, 0.28)";
        ctx.strokeStyle = "#7DD3FC";
      } else if (cr.state === "cracking") {
        ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
        ctx.strokeStyle = "#38BDF8";
      } else if (cr.state === "collapsed") {
        ctx.fillStyle = "rgba(3, 7, 18, 0.9)";
        ctx.strokeStyle = "#60A5FA";
      } else {
        ctx.fillStyle = "rgba(14, 116, 144, 0.2)";
        ctx.strokeStyle = "rgba(125, 211, 252, 0.58)";
      }
      ctx.lineWidth = cr.state === "cracking" ? 2.6 : 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, cr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!isFrozenSolid) {
        ctx.strokeStyle = cr.state === "cracking" ? "#E0F2FE" : "rgba(125, 211, 252, 0.68)";
        ctx.lineWidth = cr.state === "cracking" ? 2.1 : 1.2;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI * 2 * k) / 6 + 0.3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * cr.radius * 0.45, Math.sin(a) * cr.radius * 0.45);
          ctx.lineTo(Math.cos(a + 0.22) * cr.radius * 0.88, Math.sin(a + 0.22) * cr.radius * 0.88);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const hz of runtime.iceHandsHazards) {
      if (hz.state === "cooldown") continue;
      if (!isCircleInViewBounds(hz.x, hz.y, hz.radius + 20, viewBounds)) continue;
      ctx.save();
      ctx.translate(hz.x, hz.y);
      const warnPct = hz.state === "telegraph" ? 1 - Math.max(0, hz.timer / 1.1) : 1;
      ctx.fillStyle = hz.state === "erupt" ? "rgba(56, 189, 248, 0.3)" : `rgba(125, 211, 252, ${0.14 + warnPct * 0.2})`;
      ctx.strokeStyle = hz.state === "erupt" ? "#E0F2FE" : "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (hz.state === "erupt") {
        for (let f = 0; f < 5; f++) {
          const ang = -Math.PI * 0.85 + f * 0.42;
          ctx.strokeStyle = "#BAE6FD";
          ctx.fillStyle = "#0284C7";
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 14, 14);
          ctx.lineTo(Math.cos(ang) * 32, -26 - (f % 2) * 8);
          ctx.lineTo(Math.cos(ang + 0.18) * 18, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    for (const rem of runtime.sealingRemnants) {
      if (!isCircleInViewBounds(rem.x, rem.y, rem.radius + 20, viewBounds)) continue;
      const pulse = 0.45 + 0.35 * Math.sin(t * 2.8 + rem.phase);
      ctx.save();
      ctx.translate(rem.x, rem.y);
      if (allowGlows) {
        const rg = ctx.createRadialGradient(0, 0, 10, 0, 0, rem.radius);
        rg.addColorStop(0, `rgba(168, 85, 247, ${0.34 * pulse})`);
        rg.addColorStop(0.7, "rgba(126, 34, 206, 0.18)");
        rg.addColorStop(1, "rgba(59, 7, 100, 0)");
        ctx.fillStyle = rg;
      } else {
        ctx.fillStyle = "rgba(147, 51, 234, 0.22)";
      }
      ctx.beginPath();
      ctx.arc(0, 0, rem.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.46 + pulse * 0.28})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 5]);
      ctx.stroke();
      ctx.restore();
    }

    for (const sp of runtime.frostSpikes) {
      if (!isCircleInViewBounds(sp.x, sp.y, 32, viewBounds)) continue;
      const alpha = Math.min(1, sp.life * 4) * Math.max(0, 1 - Math.max(0, sp.life - (sp.maxLife - 0.8)) / 0.8);
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.angle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sp.fromEohyen ? "#7DD3FC" : "#C084FC";
      ctx.strokeStyle = "#F0F9FF";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -sp.height);
      ctx.lineTo(6, 4);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function renderFrozenTombStructuresAndProps(ctx, engine, t, viewBounds) {
  const perf = engine.getPerformanceProfile?.() || { enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const runtime = engine.frozenTombRuntime;
  const prog = normalizeFrozenTombProgress(engine.frozenTombProgress);
  const obstacles = getActiveFrozenTombObstacles(runtime);
  const mono = Boolean(engine.player?.tin_monochrome_realm_timer > 0);
  const nearby = findNearestFrozenTombInteractable(
    engine.player?.x || 0,
    engine.player?.y || 0,
    prog,
    runtime,
    38
  );
  const vb = getBoundsEdges(viewBounds);

  // Monumental Frozen Gate Overhead Archway (non-blocking visual archway at x=360..600, y=2200)
  if (isCircleInViewBounds(480, 2224, 210, viewBounds)) {
    ctx.save();
    // Overhead frost-draped iron portcullis teeth & stone keystone lintel
    ctx.fillStyle = mono ? "rgba(51, 65, 85, 0.55)" : "rgba(15, 34, 62, 0.72)";
    ctx.fillRect(360, 2196, 240, 14);
    ctx.strokeStyle = mono ? "#E2E8F0" : "#7DD3FC";
    ctx.lineWidth = 2;
    ctx.strokeRect(360, 2196, 240, 14);
    // Raised iron portcullis spikes frozen mid-drop
    ctx.fillStyle = "#64748B";
    for (let sx = 380; sx <= 580; sx += 28) {
      ctx.beginPath();
      ctx.moveTo(sx - 4, 2210);
      ctx.lineTo(sx + 4, 2210);
      ctx.lineTo(sx, 2223);
      ctx.closePath();
      ctx.fill();
    }
    drawIceCrystalCluster(ctx, 368, 2206, 0.9, -0.2, "#0284C7", "#E0F2FE", mono);
    drawIceCrystalCluster(ctx, 592, 2206, 0.9, 0.2, "#0284C7", "#E0F2FE", mono);
    ctx.restore();
  }

  // Cathedral North-South Facade Gothic Buttress Arches & Grand Bell Frame
  if (isCircleInViewBounds(1800, 1340, 480, viewBounds)) {
    ctx.save();
    // Forged bronze chains suspending Cathedral Giant Bell (1800, 1165)
    drawForgedChain(ctx, 1740, 1085, 1800, 1160, 8, "#475569", "#BAE6FD", mono, 6);
    drawForgedChain(ctx, 1860, 1085, 1800, 1160, 8, "#475569", "#BAE6FD", mono, -6);
    ctx.restore();
  }

  // Zone 7: 4 Forged Sealing Chains linking Rune Pillars -> Central Ice Coffin
  if (isCircleInViewBounds(1750, 2320, 440, viewBounds)) {
    for (const rp of FROZEN_TOMB_RUNE_PILLARS) {
      drawForgedChain(ctx, rp.x, rp.y, 1750, 2320, 10, "#475569", "#BAE6FD", mono, 14);
    }
  }

  // Obstacles & Architectural Structures (properly culled against viewBounds.minX/maxX!)
  for (const ob of obstacles) {
    if (!isRectVisible(ob, vb, 95)) continue;
    ctx.save();
    const faceH = Math.min(14, Math.max(7, Math.round(ob.h * 0.22)));

    if (ob.kind === "wood_house") {
      // Frosted Old Town Timber Walls + Dark Oak Beams + Snow Roof Cornice + Pale Blue Eerie Windows!
      ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
      ctx.fillRect(ob.x + 5, ob.y + 6, ob.w, ob.h);

      ctx.fillStyle = mono ? "#2B3444" : "#1F1612";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = mono ? "#3B475C" : "#35241C";
      ctx.fillRect(ob.x + 2, ob.y + 2, ob.w - 4, Math.max(4, ob.h - faceH));

      // Timber beam studs along wall
      ctx.strokeStyle = "#120B08";
      ctx.lineWidth = 1.6;
      if (ob.w >= ob.h) {
        for (let bx = ob.x + 24; bx < ob.x + ob.w - 10; bx += 26) {
          ctx.beginPath();
          ctx.moveTo(bx, ob.y + 2);
          ctx.lineTo(bx, ob.y + ob.h - 2);
          ctx.stroke();
        }
        // Eerie blue frosted window panes glowing faintly in Old Town walls!
        for (let wx = ob.x + 42; wx < ob.x + ob.w - 48; wx += 92) {
          ctx.fillStyle = mono ? "#CBD5E1" : "rgba(56, 189, 248, 0.62)";
          ctx.fillRect(wx, ob.y + ob.h - faceH - 1, 22, 6);
          ctx.strokeStyle = "#E0F2FE";
          ctx.lineWidth = 1;
          ctx.strokeRect(wx, ob.y + ob.h - faceH - 1, 22, 6);
        }
      } else {
        for (let by = ob.y + 24; by < ob.y + ob.h - 10; by += 26) {
          ctx.beginPath();
          ctx.moveTo(ob.x + 2, by);
          ctx.lineTo(ob.x + ob.w - 2, by);
          ctx.stroke();
        }
        for (let wy = ob.y + 42; wy < ob.y + ob.h - 48; wy += 84) {
          ctx.fillStyle = mono ? "#CBD5E1" : "rgba(56, 189, 248, 0.62)";
          ctx.fillRect(ob.x + ob.w - 7, wy, 5, 22);
        }
      }

      drawSnowCapRim(ctx, ob.x, ob.y, ob.w, ob.h, ob.x, mono);
      ctx.strokeStyle = mono ? "#CBD5E1" : "#67E8F9";
      ctx.lineWidth = 1.9;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      if (ob.w >= 48) drawIcicleFringe(ctx, ob.x + 4, ob.y + ob.h, ob.w - 8, 16, 8, mono);
    } else if (ob.kind === "cathedral_wall") {
      // Gothic Cathedral Stone Walls + Buttresses + Stained-Glass Blue/Violet Lancet Windows + Icicles!
      drawIceGlazedMasonry(
        ctx,
        ob.x,
        ob.y,
        ob.w,
        ob.h,
        faceH,
        mono ? "#475569" : "#21264A",
        mono ? "#334155" : "#11152E",
        mono ? "#E2E8F0" : "#818CF8",
        mono,
        ob.x * 0.2 + ob.y * 0.1,
        true
      );
      // Gothic stone buttress piers & glowing stained glass embrasures
      if (ob.w >= ob.h && ob.w >= 140) {
        for (let bx = ob.x + 28; bx < ob.x + ob.w - 36; bx += 78) {
          // Pointed-top stained glass bay (alternating cyan & violet)
          const isViolet = Math.floor(bx / 78) % 2 === 1;
          ctx.fillStyle = mono ? "#CBD5E1" : isViolet ? "rgba(168, 85, 247, 0.72)" : "rgba(56, 189, 248, 0.75)";
          ctx.fillRect(bx, ob.y + ob.h - faceH - 2, 30, 8);
          ctx.strokeStyle = "#E0F2FE";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(bx, ob.y + ob.h - faceH - 2, 30, 8);
          // Buttress rib pilaster
          ctx.fillStyle = "#312E81";
          ctx.fillRect(bx - 12, ob.y - 4, 10, ob.h + 8);
          ctx.strokeStyle = "#A5B4FC";
          ctx.strokeRect(bx - 12, ob.y - 4, 10, ob.h + 8);
        }
      } else if (ob.h > ob.w && ob.h >= 140) {
        for (let by = ob.y + 30; by < ob.y + ob.h - 36; by += 72) {
          const isViolet = Math.floor(by / 72) % 2 === 1;
          ctx.fillStyle = mono ? "#CBD5E1" : isViolet ? "rgba(168, 85, 247, 0.72)" : "rgba(56, 189, 248, 0.75)";
          ctx.fillRect(ob.x + ob.w - 10, by, 7, 30);
          ctx.strokeStyle = "#E0F2FE";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(ob.x + ob.w - 10, by, 7, 30);
          // East/West Gothic buttress spur
          ctx.fillStyle = "#312E81";
          ctx.fillRect(ob.x - 5, by - 10, ob.w + 10, 9);
          ctx.strokeStyle = "#A5B4FC";
          ctx.strokeRect(ob.x - 5, by - 10, ob.w + 10, 9);
        }
      }
      drawIceCrystalCluster(ctx, ob.x + 12, ob.y + 8, 0.75, -0.25, "#3730A3", "#BAE6FD", mono);
    } else if (ob.kind === "palace_wall") {
      // Regal Obsidian-Indigo Royal Palace Masonry with Silver/Ice Filigree Trim
      drawIceGlazedMasonry(
        ctx,
        ob.x,
        ob.y,
        ob.w,
        ob.h,
        faceH,
        mono ? "#475569" : "#1E294F",
        mono ? "#334155" : "#0F1630",
        mono ? "#E2E8F0" : "#A5B4FC",
        mono,
        ob.x + ob.y,
        true
      );
      // Regal filigree trim line
      ctx.strokeStyle = mono ? "#CBD5E1" : "rgba(199, 210, 254, 0.45)";
      ctx.lineWidth = 1.3;
      if (ob.w > 60 && ob.h - faceH > 12) {
        ctx.strokeRect(ob.x + 6, ob.y + 6, ob.w - 12, ob.h - faceH - 8);
      }
    } else if (ob.kind === "brittle_ice_wall") {
      // Destructible Brittle Ice Barrier (shining faceted blue glacier with obvious fracture veins!)
      const dw = runtime?.destructibles?.find((d) => d.id === ob.destructibleId);
      const flash = dw && dw.hitFlash > 0;
      ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
      ctx.fillRect(ob.x + 5, ob.y + 6, ob.w, ob.h);
      ctx.fillStyle = flash ? "#E0F2FE" : "rgba(14, 165, 233, 0.58)";
      ctx.strokeStyle = "#BAE6FD";
      ctx.lineWidth = 2.6;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      // Jagged crystal highlights + crack lines
      ctx.strokeStyle = "#F0F9FF";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ob.x + 5, ob.y + 10);
      ctx.lineTo(ob.x + ob.w * 0.72, ob.y + ob.h * 0.38);
      ctx.lineTo(ob.x + ob.w * 0.25, ob.y + ob.h * 0.68);
      ctx.lineTo(ob.x + ob.w - 6, ob.y + ob.h - 10);
      ctx.stroke();
      drawIceCrystalCluster(ctx, ob.x + ob.w * 0.5, ob.y + 4, 0.8, 0, "#0284C7", "#F0F9FF", mono);
      if (dw && dw.hp < dw.maxHp) {
        const barW = Math.min(64, Math.max(36, ob.w));
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(ob.x + ob.w * 0.5 - barW * 0.5, ob.y - 10, barW, 5);
        ctx.fillStyle = "#38BDF8";
        ctx.fillRect(ob.x + ob.w * 0.5 - barW * 0.5, ob.y - 10, barW * (dw.hp / dw.maxHp), 5);
      }
    } else if (ob.kind === "ice_coffin") {
      // Zone 7 Central Faceted Ice Coffin Sarcophagus
      const bossDead = Boolean(prog.bossDefeatedEmptyVoid || runtime?.bossDefeatedThisRun);
      const cx = ob.x + ob.w * 0.5;
      const cy = ob.y + ob.h * 0.5;
      ctx.fillStyle = "rgba(2, 6, 23, 0.7)";
      ctx.fillRect(ob.x + 7, ob.y + 9, ob.w, ob.h);
      if (bossDead) {
        ctx.fillStyle = "#020308";
        ctx.strokeStyle = "#7DD3FC";
        ctx.lineWidth = 2.6;
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
        ctx.fillStyle = "rgba(168, 85, 247, 0.16)";
        ctx.fillRect(ob.x + 10, ob.y + 12, ob.w - 20, ob.h - 24);
        // Shattered ice shards on rim
        drawIceCrystalCluster(ctx, ob.x + 8, ob.y + 8, 0.85, -0.5, "#3B0764", "#E0F2FE", mono);
        drawIceCrystalCluster(ctx, ob.x + ob.w - 8, ob.y + ob.h - 6, 0.85, 0.6, "#3B0764", "#E0F2FE", mono);
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
        ctx.fillStyle = "rgba(14, 116, 144, 0.68)";
        ctx.strokeStyle = "#BAE6FD";
        ctx.lineWidth = 2.8;
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
        // Beveled coffin lid ribs
        ctx.strokeStyle = "rgba(224, 242, 254, 0.55)";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(ob.x + 12, ob.y + 14, ob.w - 24, ob.h - 28);
        // Shifting indistinct silhouette inside frozen coffin
        ctx.fillStyle = "rgba(9, 7, 22, 0.86)";
        ctx.beginPath();
        ctx.ellipse(cx + Math.sin(t * 2) * 3, cy, 20, 42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(192, 132, 252, ${0.42 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 12 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        drawIceCrystalCluster(ctx, ob.x + 6, ob.y + ob.h - 6, 0.9, -0.35, "#0284C7", "#E0F2FE", mono);
        drawIceCrystalCluster(ctx, ob.x + ob.w - 6, ob.y + 12, 0.9, 0.35, "#0284C7", "#E0F2FE", mono);
      }
    } else if (ob.kind === "rune_pillar") {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + ob.x);
      drawIceGlazedMasonry(
        ctx,
        ob.x,
        ob.y,
        ob.w,
        ob.h,
        10,
        "#2E1065",
        "#1E1B4B",
        `rgba(192, 132, 252, ${0.65 + pulse * 0.35})`,
        mono,
        ob.x,
        false
      );
      ctx.fillStyle = `rgba(168, 85, 247, ${0.5 + pulse * 0.38})`;
      ctx.beginPath();
      ctx.arc(ob.x + ob.w * 0.5, ob.y + ob.h * 0.45, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F5D0FE";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (ob.id === "ft_statue_w" || ob.id === "ft_statue_e") {
      drawFrozenWarriorStatue(ctx, ob, mono);
    } else if (ob.kind === "ice_pillar") {
      // Fluted Cathedral / Palace Marble Column Encased in Jagged Ice Shards!
      const px = ob.x + ob.w * 0.5;
      const py = ob.y + ob.h * 0.46;
      const pr = Math.min(ob.w, ob.h) * 0.42;
      ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
      ctx.fillRect(ob.x + 5, ob.y + 7, ob.w, ob.h);
      drawIceGlazedMasonry(ctx, ob.x, ob.y, ob.w, ob.h, 10, "#1E3A5F", "#0F243D", "#7DD3FC", mono, ob.x, false);
      ctx.fillStyle = mono ? "#475569" : "#334155";
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#BAE6FD";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // Fluted frost crystal sheath on column top
      drawIceCrystalCluster(ctx, px, py - 2, 0.85, 0.15, "#0284C7", "#E0F2FE", mono);
    } else if (ob.kind === "tombstone") {
      // Gothic Engraved Tombstone / Cemetery Obelisk with Snow Cap & Ice Crystals
      const cx = ob.x + ob.w * 0.5;
      ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
      ctx.fillRect(ob.x + 5, ob.y + 7, ob.w, ob.h);
      // Base plinth
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(ob.x, ob.y + ob.h - 14, ob.w, 14);
      ctx.strokeStyle = "#93C5FD";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ob.x, ob.y + ob.h - 14, ob.w, 14);
      // Arched headstone slab
      ctx.fillStyle = mono ? "#334155" : "#273549";
      ctx.beginPath();
      ctx.moveTo(ob.x + 4, ob.y + ob.h - 14);
      ctx.lineTo(ob.x + 4, ob.y + 18);
      ctx.arc(cx, ob.y + 18, ob.w * 0.5 - 4, Math.PI, 0);
      ctx.lineTo(ob.x + ob.w - 4, ob.y + ob.h - 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Carved cross & faded epitaph lines
      ctx.strokeStyle = "rgba(186, 230, 253, 0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, ob.y + 14);
      ctx.lineTo(cx, ob.y + 34);
      ctx.moveTo(cx - 7, ob.y + 21);
      ctx.lineTo(cx + 7, ob.y + 21);
      ctx.stroke();
      // Snow cap resting on headstone arch
      ctx.fillStyle = "rgba(224, 242, 254, 0.72)";
      ctx.beginPath();
      ctx.arc(cx, ob.y + 14, ob.w * 0.42, Math.PI * 1.1, Math.PI * 1.9);
      ctx.fill();
    } else if (ob.kind === "cavern_rock") {
      // Faceted Glacial Cavern Monolith / Basalt Ice Formation
      const isDeep = ob.y > 1400;
      drawIceGlazedMasonry(
        ctx,
        ob.x,
        ob.y,
        ob.w,
        ob.h,
        faceH,
        mono ? "#334155" : isDeep ? "#23123E" : "#0F2F4C",
        mono ? "#1E293B" : isDeep ? "#130824" : "#081C30",
        mono ? "#CBD5E1" : isDeep ? "#A855F7" : "#38BDF8",
        mono,
        ob.x,
        true
      );
      if (ob.id === "ft_cav_r3") {
        // Translucent strange creature shadow shifting behind ice facets!
        const shift = Math.sin(t * 1.8) * 6;
        ctx.fillStyle = "rgba(3, 5, 12, 0.78)";
        ctx.beginPath();
        ctx.ellipse(ob.x + ob.w * 0.5 + shift, ob.y + ob.h * 0.5, 26, 19, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      drawIceCrystalCluster(ctx, ob.x + 18, ob.y + 12, 1.05, -0.3, isDeep ? "#581C87" : "#0369A1", "#E0F2FE", mono);
      drawIceCrystalCluster(ctx, ob.x + ob.w - 20, ob.y + ob.h - 14, 0.95, 0.4, isDeep ? "#581C87" : "#0369A1", "#E0F2FE", mono);
    } else if (ob.kind === "cart_wreck") {
      // Frosted Shattered Medieval Supply Wagon with Spoked Wheels, Timber Planks & Snow Drift
      const cx = ob.x + ob.w * 0.5;
      const cy = ob.y + ob.h * 0.5;
      ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
      ctx.fillRect(ob.x + 4, ob.y + 6, ob.w, ob.h);
      // Protruding wagon pull shafts
      ctx.strokeStyle = "#451A03";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ob.x + ob.w - 4, cy - 8);
      ctx.lineTo(ob.x + ob.w + 14, cy - 5);
      ctx.moveTo(ob.x + ob.w - 4, cy + 8);
      ctx.lineTo(ob.x + ob.w + 12, cy + 12);
      ctx.stroke();
      // Spoked wheels top/bottom
      for (const wy of [ob.y - 3, ob.y + ob.h + 3]) {
        const wx = ob.x + ob.w * 0.36;
        ctx.fillStyle = "#0F172A";
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(wx, wy, 13, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // Wooden wagon hull & plank lines + snow pile
      ctx.fillStyle = "#2E2018";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#18100C";
      ctx.lineWidth = 1.4;
      for (let py = ob.y + 8; py < ob.y + ob.h - 4; py += 8) {
        ctx.beginPath();
        ctx.moveTo(ob.x + 3, py);
        ctx.lineTo(ob.x + ob.w - 3, py);
        ctx.stroke();
      }
      ctx.strokeStyle = "#93C5FD";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      drawSnowCapRim(ctx, ob.x, ob.y, ob.w, ob.h, ob.x, mono);
    } else {
      // frozen_wall: Massive Snow-Covered City Ramparts & Dividing Ice-Stone Walls
      drawIceGlazedMasonry(
        ctx,
        ob.x,
        ob.y,
        ob.w,
        ob.h,
        faceH,
        mono ? "#475569" : "#18304F",
        mono ? "#334155" : "#0D1C33",
        mono ? "#CBD5E1" : "#38BDF8",
        mono,
        ob.x * 0.1 + ob.y * 0.1,
        true
      );
      if (ob.w > 120) {
        for (let mx = ob.x + 22; mx < ob.x + ob.w - 28; mx += 58) {
          ctx.fillStyle = "#27476E";
          ctx.fillRect(mx, ob.y + 4, 22, 10);
          ctx.strokeStyle = "#7DD3FC";
          ctx.lineWidth = 1.1;
          ctx.strokeRect(mx, ob.y + 4, 22, 10);
        }
      }
      drawIceCrystalCluster(ctx, ob.x + 14, ob.y + ob.h - 4, 0.85, -0.25, "#0369A1", "#E0F2FE", mono);
      drawIceCrystalCluster(ctx, ob.x + ob.w - 14, ob.y + 10, 0.85, 0.25, "#0369A1", "#E0F2FE", mono);
    }
    ctx.restore();
  }

  // Zone 5 Secret Archive Furniture Props (bookshelves & study desk inside Trung's room)
  if (isCircleInViewBounds(2960, 360, 260, viewBounds)) {
    ctx.save();
    // Frost-rimed oak bookshelves lining North wall inside Secret Archive
    for (const bx of [2740, 2860, 3040]) {
      ctx.fillStyle = "#1E1B2E";
      ctx.fillRect(bx, 184, 86, 20);
      ctx.strokeStyle = "#A5B4FC";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx, 184, 86, 20);
      for (let kx = bx + 6; kx < bx + 78; kx += 7) {
        ctx.fillStyle = kx % 14 === 0 ? "#38BDF8" : kx % 21 === 0 ? "#A855F7" : "#475569";
        ctx.fillRect(kx, 187, 4, 14);
      }
    }
    ctx.restore();
  }

  // Zone 2 Animated Backwards Grandfather Clock Face (955, 1220)
  if (isCircleInViewBounds(955, 1265, 120, viewBounds)) {
    ctx.save();
    ctx.translate(955, 1220);
    ctx.fillStyle = "#0F172A";
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Clock numeral ticks
    ctx.strokeStyle = "rgba(186, 230, 253, 0.65)";
    ctx.lineWidth = 1.2;
    for (let h = 0; h < 12; h++) {
      const a = (Math.PI * 2 * h) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a) * 21.5, Math.sin(a) * 21.5);
      ctx.stroke();
    }
    // Counter-clockwise hands!
    const secAng = -t * 1.4;
    const minAng = -t * 0.22;
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(minAng) * 13, Math.sin(minAng) * 13);
    ctx.stroke();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(secAng) * 18, Math.sin(secAng) * 18);
    ctx.stroke();
    ctx.restore();
  }

  // DISTINCT ARTIFACT VISUALS FOR EVERY INTERACTABLE NODE (Cathedral Bell, EE1 Portrait, EE2 Statues/Mirrors, EE4 Vial, EE5 Device, etc.)
  const shardVisible = Boolean(prog.bossDefeatedEmptyVoid || runtime?.bossDefeatedThisRun || runtime?.endingShardSpawned);
  for (const node of FROZEN_TOMB_INTERACTABLES) {
    if (node.id === "ending_ice_shard" && !shardVisible) continue;
    if (!isCircleInViewBounds(node.x, node.y, 95, viewBounds)) continue;

    const isNear = nearby?.id === node.id;
    const pulse = 0.55 + 0.45 * Math.sin(t * 3.4 + node.x * 0.02);
    let ringCol = "#38BDF8";
    if (node.id === "eohyen_painting") ringCol = prog.eohyenPaintingSeen ? "#BAE6FD" : "#38BDF8";
    else if (node.id === "phong_faceless_statues" || node.id === "phong_mirror_room") ringCol = "#22D3EE";
    else if (node.id === "minh_frozen_dossier") ringCol = "#FACC15";
    else if (node.id === "thanh_poison_vial") ringCol = "#34D399";
    else if (node.id === "frozen_research_device" || node.id === "final_seal_coffin" || node.id === "ending_ice_shard") ringCol = "#C084FC";

    ctx.save();
    ctx.translate(node.x, node.y);

    // Interaction floor aura ring
    ctx.strokeStyle = ringCol;
    ctx.lineWidth = isNear ? 2.6 : 1.5;
    ctx.globalAlpha = isNear ? 0.92 : 0.38 + pulse * 0.24;
    ctx.beginPath();
    ctx.arc(0, 0, isNear ? 30 + pulse * 4 : 22 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Detailed bespoke relic icon per node!
    if (node.id === "cathedral_bell" || node.id === "gate_self_bell") {
      const rScale = node.id === "cathedral_bell" ? 1.45 : 0.85;
      const sway = Math.sin(t * (node.id === "gate_self_bell" ? 2.8 : 1.3)) * 0.12;
      ctx.save();
      ctx.scale(rScale, rScale);
      ctx.rotate(sway);
      // Bronze cathedral bell dome & rim
      ctx.fillStyle = "#B45309";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.quadraticCurveTo(-11, -12, 0, -14);
      ctx.quadraticCurveTo(11, -12, 12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Frost rim & clapper
      ctx.fillStyle = "#BAE6FD";
      ctx.fillRect(-13, 8, 26, 3);
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(0, 12, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (node.id === "eohyen_painting") {
      // Ornate Royal Easel & Scraped Three-Silhouette Portrait!
      ctx.fillStyle = "#2E1E16";
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.fillRect(-20, -15, 40, 30);
      ctx.strokeRect(-20, -15, 40, 30);
      ctx.fillStyle = "#0C192C";
      ctx.fillRect(-16, -11, 32, 22);
      // 3 painted shadows + clawed scratch lines across center
      ctx.fillStyle = "#64748B";
      ctx.beginPath();
      ctx.arc(-8, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(8, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = prog.eohyenPaintingSeen ? "#7DD3FC" : "#1E293B";
      ctx.beginPath();
      ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#BAE6FD";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(6, 7);
      ctx.moveTo(5, -7);
      ctx.lineTo(-5, 6);
      ctx.stroke();
    } else if (node.id === "phong_faceless_statues") {
      // Trio of featureless pale marble busts
      for (const sx of [-13, 0, 13]) {
        ctx.fillStyle = "#475569";
        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 1.4;
        ctx.fillRect(sx - 5, -2, 10, 11);
        ctx.beginPath();
        ctx.arc(sx, -6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (node.id === "phong_mirror_room") {
      // Tall silver gothic mirror reflecting cyan phantom shimmer
      ctx.fillStyle = "#0F172A";
      ctx.strokeStyle = "#22D3EE";
      ctx.lineWidth = 2;
      ctx.fillRect(-13, -18, 26, 36);
      ctx.strokeRect(-13, -18, 26, 36);
      ctx.fillStyle = "rgba(34, 211, 238, 0.25)";
      ctx.fillRect(-9, -14, 18, 28);
      ctx.strokeStyle = "#E0F2FE";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(6, 4);
      ctx.stroke();
    } else if (node.id === "minh_frozen_dossier") {
      // Ice-encased royal dossier scroll with gold seal
      ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
      ctx.strokeStyle = "#FACC15";
      ctx.lineWidth = 2;
      ctx.fillRect(-15, -12, 30, 24);
      ctx.strokeRect(-15, -12, 30, 24);
      ctx.fillStyle = "#FEF3C7";
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = "#EAB308";
      ctx.beginPath();
      ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.id === "thanh_poison_vial") {
      // Tipped emerald glass poison flask + dried green droplet
      ctx.fillStyle = "#064E3B";
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-2, 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#6EE7B7";
      ctx.fillRect(4, -7, 8, 5);
      ctx.beginPath();
      ctx.arc(12, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.id === "frozen_research_device") {
      // Cross-Map Brass & Obsidian Reel-to-Reel Frozen Research Console!
      ctx.fillStyle = "#1E1B4B";
      ctx.strokeStyle = prog.linkedDeviceTriggered ? "#E879F9" : "#C084FC";
      ctx.lineWidth = 2.2;
      ctx.fillRect(-20, -14, 40, 28);
      ctx.strokeRect(-20, -14, 40, 28);
      // Twin tape reels
      ctx.strokeStyle = "#BAE6FD";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-8, -3, 6, 0, Math.PI * 2);
      ctx.arc(8, -3, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = prog.linkedDeviceTriggered ? "#4ADE80" : "#A855F7";
      ctx.fillRect(-12, 7, 24, 4);
    } else if (node.id === "ending_ice_shard") {
      // Glowing purple Ice Shard etched with Map 2 Arcane Orb symbol!
      ctx.fillStyle = "#4C1D95";
      ctx.strokeStyle = "#E879F9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(11, 2);
      ctx.lineTo(0, 16);
      ctx.lineTo(-11, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#F5D0FE";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (node.id !== "final_seal_coffin") {
      // Parchment ledger / ritual lectern / archive file icon
      ctx.fillStyle = "#1E293B";
      ctx.strokeStyle = ringCol;
      ctx.lineWidth = 1.8;
      ctx.fillRect(-13, -10, 26, 20);
      ctx.strokeRect(-13, -10, 26, 20);
      ctx.fillStyle = "#FEF3C7";
      ctx.fillRect(-9, -6, 18, 12);
    }
    ctx.restore();
  }

  // Bell Ripples
  if (runtime?.bellRipples) {
    for (const rp of runtime.bellRipples) {
      if (!isCircleInViewBounds(rp.x, rp.y, rp.radius + 20, viewBounds)) continue;
      ctx.save();
      ctx.globalAlpha = rp.alpha * 0.58;
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Translucent Phantoms (Rampart Watcher, Window Ghost, Ninja Shadow, Éo Hyên Ring, Thanh Viper)
  if (runtime?.phantoms) {
    for (const ph of runtime.phantoms) {
      if (!isCircleInViewBounds(ph.x, ph.y, 80, viewBounds)) continue;
      ctx.save();
      ctx.translate(ph.x, ph.y);
      ctx.globalAlpha = ph.alpha * (0.75 + 0.25 * Math.sin(t * 4));
      if (ph.kind === "eohyen_ice_ring") {
        ctx.strokeStyle = "#7DD3FC";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, 32 + Math.sin(t * 4) * 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ph.kind === "thanh_flashback_snake") {
        ctx.strokeStyle = "#34D399";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let k = -24; k <= 24; k += 6) {
          ctx.lineTo(k, Math.sin(k * 0.25 + t * 5) * 9);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = ph.kind === "phong_ninja_shadow" ? "#22D3EE" : "#BAE6FD";
        ctx.beginPath();
        ctx.arc(0, -14, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-11, 16);
        ctx.lineTo(-7, -4);
        ctx.lineTo(7, -4);
        ctx.lineTo(11, 16);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

export function renderFrozenTombPlayerEffects(ctx, player, t) {
  if (!player) return;
  const frostBuild = Math.min(1, Number(player.frozenTombFrostBuildup) || 0);
  const onIce = Boolean(player.frozenTombOnIce);
  const rooted = (player.rootTimer || 0) > 0;

  if (onIce) {
    ctx.save();
    ctx.strokeStyle = "rgba(186, 230, 253, 0.58)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 18, 22, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (frostBuild > 0.08) {
    ctx.save();
    ctx.globalAlpha = frostBuild * 0.65;
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + t * 0.4;
      const r1 = 16;
      const r2 = 22 + frostBuild * 6;
      ctx.beginPath();
      ctx.moveTo(player.x + Math.cos(a) * r1, player.y + Math.sin(a) * r1);
      ctx.lineTo(player.x + Math.cos(a) * r2, player.y + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (rooted) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = "rgba(56, 189, 248, 0.34)";
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(22, -10);
    ctx.lineTo(16, 22);
    ctx.lineTo(-16, 22);
    ctx.lineTo(-22, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function renderFrozenTombEntityBoss(ctx, boss, t) {
  if (!boss) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);

  const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
  ctx.fillStyle = "rgba(59, 7, 100, 0.35)";
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius + 18 + pulse * 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(15, 10, 32, 0.9)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const baseA = (Math.PI * 2 * i) / 6 + t * 0.9;
    const wave = Math.sin(t * 5 + i * 1.4) * 14;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(baseA) * 28 + wave * 0.4,
      Math.sin(baseA) * 28,
      Math.cos(baseA) * (boss.radius + 22) + wave,
      Math.sin(baseA) * (boss.radius + 22)
    );
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(14, 116, 144, 0.48)";
  ctx.strokeStyle = "#BAE6FD";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (Math.PI * 2 * k) / 8 + Math.sin(t * 1.5 + k) * 0.06;
    const r = boss.radius * (k % 2 === 0 ? 1.08 : 0.88);
    if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#03050A";
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius * 0.56, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(192, 132, 252, ${0.65 + pulse * 0.35})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function renderFrozenTombAtmosphere(ctx, engine, t, viewW, viewH) {
  const runtime = engine.frozenTombRuntime;
  if (!runtime) return;

  const perf = engine.getPerformanceProfile?.() || { tier: "high" };
  const snowCount = perf.tier === "low" ? 28 : perf.tier === "medium" ? 48 : 76;
  const bliz = runtime.blizzardIntensity || 0.12;
  const count = Math.round(snowCount * (0.65 + bliz * 0.8));

  ctx.save();
  for (let i = 0; i < count; i++) {
    const speed = 190 + (i % 5) * 65 + bliz * 260;
    const sx = ((i * 193.7 - t * speed * (0.9 + bliz * 0.7)) % (viewW + 120) + (viewW + 120)) % (viewW + 120) - 60;
    const sy = ((i * 97.3 + t * (65 + (i % 4) * 28)) % (viewH + 60)) - 30;
    const len = 6 + bliz * 14 + (i % 3) * 3;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(224, 242, 254, 0.52)" : "rgba(186, 230, 253, 0.32)";
    ctx.lineWidth = i % 4 === 0 ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - len, sy + len * 0.34);
    ctx.stroke();
  }

  const inDanger = (engine.player?.y || 0) > 1750 && (engine.player?.x || 0) > 1150;
  const vigAlpha = Math.min(0.58, 0.16 + bliz * 0.32 + (inDanger ? 0.14 : 0));
  if (vigAlpha > 0.05) {
    const vg = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      Math.min(viewW, viewH) * 0.32,
      viewW * 0.5,
      viewH * 0.5,
      Math.max(viewW, viewH) * 0.72
    );
    vg.addColorStop(0, "rgba(2, 6, 23, 0)");
    vg.addColorStop(1, inDanger ? `rgba(18, 7, 36, ${vigAlpha})` : `rgba(8, 22, 46, ${vigAlpha})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  if (runtime.staticDistortionIntensity > 0.06) {
    const sInt = runtime.staticDistortionIntensity;
    ctx.fillStyle = `rgba(192, 132, 252, ${0.12 * sInt})`;
    for (let k = 0; k < 10; k++) {
      const ly = ((Math.sin(t * 23 + k * 4.1) * 0.5 + 0.5) * viewH) | 0;
      ctx.fillRect(0, ly, viewW, 2);
    }
  }

  if (runtime.darknessPulseSec > 0) {
    const fade = Math.min(0.84, runtime.darknessPulseSec * 0.3);
    ctx.fillStyle = `rgba(2, 3, 10, ${fade})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  ctx.restore();
}
