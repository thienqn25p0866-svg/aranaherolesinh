// High-craft MOBA Fantasy Weapon & VFX Renderer for Arena Hero
// Zero ctx.shadowBlur usage for 60fps mobile Canvas 2D performance.

import { DUY_DECOY_REFLECT_RATIO } from "./combatLogic";
import { drawVoidCityEnemySprite } from "./voidCityRenderer";

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function drawHandGrip(ctx, x, y, color, rim, radius = 4.2, isMono = false) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "#111111" : color;
  ctx.fill();
  ctx.strokeStyle = isMono ? "#FFFFFF" : rim;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

function drawTaperedArc(ctx, cx, cy, r, startAng, endAng, maxWidth, color, coreColor, isMono = false) {
  let steps = 12;
  let dir = endAng >= startAng ? 1 : -1;
  let span = endAng - startAng;
  if (Math.abs(span) < 0.05) return;

  ctx.save();
  // Outer crescent polygon (tapered at both ends, thickest near leading edge)
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let ang = startAng + span * t;
    let profile = Math.sin(Math.pow(t, 0.72) * Math.PI);
    let ro = r + maxWidth * 0.55 * profile;
    let px = cx + Math.cos(ang) * ro;
    let py = cy + Math.sin(ang) * ro;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    let t = i / steps;
    let ang = startAng + span * t;
    let profile = Math.sin(Math.pow(t, 0.72) * Math.PI);
    let ri = r - maxWidth * 0.45 * profile;
    let px = cx + Math.cos(ang) * ri;
    let py = cy + Math.sin(ang) * ri;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = isMono ? "#000000" : color;
  ctx.fill();

  // Crisp bright inner spine along leading half
  ctx.beginPath();
  for (let i = 3; i <= steps; i++) {
    let t = i / steps;
    let ang = startAng + span * t;
    let profile = Math.sin(Math.pow(t, 0.72) * Math.PI);
    let rm = r + maxWidth * 0.16 * profile;
    let px = cx + Math.cos(ang) * rm;
    let py = cy + Math.sin(ang) * rm;
    if (i === 3) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = isMono ? "#FFFFFF" : coreColor;
  ctx.lineWidth = Math.max(1.5, maxWidth * 0.24);
  ctx.lineCap = "round";
  ctx.stroke();

  // Tip spark chevron
  let tipX = cx + Math.cos(endAng) * r;
  let tipY = cy + Math.sin(endAng) * r;
  let tang = endAng + (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  ctx.fillStyle = isMono ? "#FFFFFF" : coreColor;
  ctx.beginPath();
  ctx.moveTo(tipX + Math.cos(tang) * 5, tipY + Math.sin(tang) * 5);
  ctx.lineTo(tipX + Math.cos(endAng) * 3, tipY + Math.sin(endAng) * 3);
  ctx.lineTo(tipX - Math.cos(tang) * 4, tipY - Math.sin(tang) * 4);
  ctx.lineTo(tipX - Math.cos(endAng) * 3, tipY - Math.sin(endAng) * 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFourPointStar(ctx, x, y, rOuter, rInner, color, strokeColor) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    let ang = (Math.PI / 4) * i;
    let rad = i % 2 === 0 ? rOuter : rInner;
    let px = x + Math.cos(ang) * rad;
    let py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// =====================================================================
// AAA COMBAT VFX HELPERS (Zero ctx.shadowBlur, ctxStub-safe)
// =====================================================================

function getCosmicSwingEase(p) {
  // Anticipation pullback (0..0.16) -> explosive snap (0.16..0.58) -> smooth follow-through
  let t = clamp(p, 0, 1);
  if (t < 0.16) {
    let u = t / 0.16;
    return -0.12 * Math.sin(u * Math.PI);
  }
  if (t < 0.58) {
    let u = (t - 0.16) / 0.42;
    return Math.sin(u * Math.PI * 0.5) * 1.06;
  }
  let u = (t - 0.58) / 0.42;
  return 1.06 - u * 0.06;
}

function drawWeaponArcLightning(ctx, reach, intensity, elapsedTime, color, accentColor, isMono, enableAdditive = true) {
  if (intensity <= 0.04) return;
  let alpha = clamp(intensity, 0, 1);
  ctx.save();
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  let segs = 6;
  let phase = Math.floor(elapsedTime * 28);
  for (let strand = 0; strand < 2; strand++) {
    ctx.beginPath();
    let startX = 6;
    let startY = strand === 0 ? -4 : 4;
    ctx.moveTo(startX, startY);
    for (let i = 1; i <= segs; i++) {
      let u = i / segs;
      let jSeed = Math.sin(phase * 1.9 + i * 3.7 + strand * 5.3);
      let px = startX + u * reach;
      let py = startY * (1 - u) + jSeed * (4.5 + 3.5 * alpha) * Math.sin(u * Math.PI);
      ctx.lineTo(px, py);
    }
    ctx.globalAlpha = alpha * (strand === 0 ? 0.55 : 0.4);
    ctx.strokeStyle = isMono ? "#FFFFFF" : (strand === 0 ? color : accentColor);
    ctx.lineWidth = strand === 0 ? 3.4 : 2.4;
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  if (alpha > 0.35) {
    let sparkAng = Math.sin(elapsedTime * 22) * 0.5;
    let sx = 6 + reach * 0.82;
    let sy = Math.sin(elapsedTime * 31) * 5;
    ctx.globalAlpha = alpha * 0.8;
    drawFourPointStar(ctx, sx, sy, 4.5 + alpha * 3, 1.4, "#FFFFFF", isMono ? "#000000" : accentColor);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(sparkAng) * 10, sy + Math.sin(sparkAng) * 10);
    ctx.strokeStyle = isMono ? "#FFFFFF" : accentColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlassShards(ctx, cx, cy, r, startAng, endAng, f, color, accentColor, isMono, seed = 1) {
  let alpha = clamp(1 - f, 0, 1);
  if (alpha <= 0.04) return;
  let span = endAng - startAng;
  let count = 6;
  ctx.save();
  for (let i = 0; i < count; i++) {
    let t = (i + 0.5) / count;
    let ang = startAng + span * t;
    let drift = (0.85 + 0.45 * f) * r + Math.sin(i * 4.3 + seed) * 10 * f;
    let sx = cx + Math.cos(ang) * drift;
    let sy = cy + Math.sin(ang) * drift;
    let sz = (3.2 + (i % 3) * 1.6) * (0.4 + 0.6 * alpha);
    let rot = ang + f * (i % 2 === 0 ? 4.5 : -4.5) + seed;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha * 0.92;
    ctx.fillStyle = isMono ? (i % 2 === 0 ? "#FFFFFF" : "#1E293B") : (i % 2 === 0 ? accentColor : color);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 1.4);
    ctx.lineTo(sz * 0.85, 0);
    ctx.lineTo(0, sz * 1.1);
    ctx.lineTo(-sz * 0.65, -sz * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawCosmicSlashLayer(ctx, opts) {
  let {
    cx = 0,
    cy = 0,
    radius = 100,
    startAng = -0.8,
    endAng = 0.8,
    f = 0,
    color = "#38BDF8",
    accentColor = "#E879F9",
    isMono = false,
    enableAdditive = true,
    tiltY = 0.86,
    crackStrength = 1,
    seed = 1
  } = opts;
  let alpha = clamp(1 - f, 0, 1);
  let span = endAng - startAng;
  if (Math.abs(span) < 0.05 || alpha <= 0.02) return;

  ctx.save();
  ctx.scale(1, tiltY);

  // 1. Cosmic Glass Tear Cavity (deep nebula space void torn open behind the slash)
  let steps = 14;
  let tearThick = (9.5 * crackStrength) * Math.sin(Math.min(1, alpha * 1.15) * Math.PI * 0.5) + 1.5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    let u = i / steps;
    let ang = startAng + span * u;
    let prof = Math.sin(Math.pow(u, 0.78) * Math.PI);
    let jag = ((i % 2 === 0 ? 1 : -1) * 2.2) * prof;
    let ro = radius + tearThick * 0.62 * prof + jag;
    let px = cx + Math.cos(ang) * ro;
    let py = cy + Math.sin(ang) * ro;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i--) {
    let u = i / steps;
    let ang = startAng + span * u;
    let prof = Math.sin(Math.pow(u, 0.78) * Math.PI);
    let jag = ((i % 2 === 0 ? -1 : 1) * 1.8) * prof;
    let ri = radius - tearThick * 0.58 * prof + jag;
    let px = cx + Math.cos(ang) * ri;
    let py = cy + Math.sin(ang) * ri;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.globalAlpha = alpha * 0.88;
  ctx.fillStyle = isMono ? "#020617" : "#060414";
  ctx.fill();

  // Twinkling cosmic micro-stars suspended inside the torn void cavity
  ctx.globalAlpha = alpha * 0.95;
  for (let si = 1; si <= 5; si++) {
    let u = si / 6;
    let ang = startAng + span * u;
    let sr = radius + Math.sin(si * 3.1 + seed) * (tearThick * 0.25);
    let px = cx + Math.cos(ang) * sr;
    let py = cy + Math.sin(ang) * sr;
    drawFourPointStar(ctx, px, py, (2.4 + (si % 2) * 1.4) * alpha + 0.8, 0.8, "#FFFFFF", isMono ? "#94A3B8" : accentColor);
  }

  // 2. Layered Additive Neon Edge Rim & Hot White Core
  ctx.save();
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.min(startAng, endAng), Math.max(startAng, endAng));
  ctx.globalAlpha = alpha * 0.42;
  ctx.strokeStyle = isMono ? "#CBD5E1" : color;
  ctx.lineWidth = (12 + 4 * crackStrength) * alpha + 2;
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.78;
  ctx.strokeStyle = isMono ? "#FFFFFF" : accentColor;
  ctx.lineWidth = (5.2 + 2 * crackStrength) * alpha + 1.2;
  ctx.stroke();

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.4, 2.5 * alpha);
  ctx.stroke();

  // 3. Trailing Energy Wake Ribbon behind outer rim
  ctx.globalAlpha = alpha * 0.58;
  ctx.strokeStyle = isMono ? "#E2E8F0" : accentColor;
  ctx.lineWidth = 1.6 * alpha + 0.6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * (1.07 + 0.05 * f), Math.min(startAng, endAng), Math.max(startAng, endAng));
  ctx.stroke();
  ctx.restore();

  // 4. Branching Spatial Edge Cracks sprouting from the tear
  if (crackStrength >= 0.6 && alpha > 0.14) {
    ctx.globalAlpha = alpha * 0.82;
    ctx.lineCap = "round";
    for (let bi = 1; bi <= 4; bi++) {
      let u = bi / 5;
      let ang = startAng + span * u;
      let side = bi % 2 === 0 ? 1 : -1;
      let bx = cx + Math.cos(ang) * radius;
      let by = cy + Math.sin(ang) * radius;
      let bLen = (12 + (bi % 2) * 8) * crackStrength * (0.6 + 0.4 * alpha);
      let bAng = ang + side * 0.52;
      let mx = bx + Math.cos(bAng) * bLen * 0.55;
      let my = by + Math.sin(bAng) * bLen * 0.55;
      let ex = bx + Math.cos(bAng - side * 0.28) * bLen;
      let ey = by + Math.sin(bAng - side * 0.28) * bLen;
      ctx.strokeStyle = isMono ? "#FFFFFF" : accentColor;
      ctx.lineWidth = 2.0 * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 0.9 * alpha;
      ctx.stroke();
    }
  }

  // 5. Shattered Cosmic Glass Shards flying from blade arc
  drawGlassShards(ctx, cx, cy, radius, startAng, endAng, f, color, accentColor, isMono, seed);

  ctx.restore();
}

export function drawWindRibbon(ctx, r, elapsedTime, isMono, enableAdditive = true) {
  let f = clamp((r.life || 0) / Math.max(0.08, r.maxLife || 0.42), 0, 1);
  let alpha = (1 - f) * (r.alpha || 0.85);
  if (alpha <= 0.02) return;

  let sx = r.sx ?? r.x ?? 0;
  let sy = r.sy ?? r.y ?? 0;
  let tx = r.tx ?? (sx + Math.cos(r.angle || 0) * (r.len || 110));
  let ty = r.ty ?? (sy + Math.sin(r.angle || 0) * (r.len || 110));
  let dx = tx - sx, dy = ty - sy;
  let len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  let mainCol = isMono ? "#E2E8F0" : (r.color || "#67E8F9");
  let accentCol = isMono ? "#FFFFFF" : (r.accentColor || "#F8FAFC");
  let waveSign = r.side || 1;
  let waveAmp = (12 + Math.min(18, len * 0.14)) * (0.45 + 0.55 * Math.sin(f * Math.PI));

  ctx.save();
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.lineCap = "round";

  // 3 layered sinuous Bezier wind filaments
  for (let layer = 0; layer < 3; layer++) {
    let shift = (layer - 1) * 7 * waveSign;
    let c1x = sx + dx * 0.32 + nx * (waveAmp * waveSign + shift);
    let c1y = sy + dy * 0.32 + ny * (waveAmp * waveSign + shift);
    let c2x = sx + dx * 0.68 - nx * (waveAmp * 0.72 * waveSign - shift);
    let c2y = sy + dy * 0.68 - ny * (waveAmp * 0.72 * waveSign - shift);

    ctx.globalAlpha = alpha * (layer === 1 ? 0.86 : 0.48);
    ctx.strokeStyle = layer === 1 ? accentCol : mainCol;
    ctx.lineWidth = (layer === 1 ? 3.2 : 1.9) * (1 - f * 0.65) + 0.6;
    ctx.beginPath();
    ctx.moveTo(sx + nx * shift * 0.5, sy + ny * shift * 0.5);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx + nx * shift * 0.25, ty + ny * shift * 0.25);
    ctx.stroke();
  }

  // Origin acceleration vortex curl
  if (f < 0.75) {
    let vr = (10 + (r.width || 10) * 0.4) * (0.6 + 0.6 * f);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(elapsedTime * 9 * waveSign);
    ctx.globalAlpha = alpha * 0.65;
    ctx.strokeStyle = mainCol;
    ctx.lineWidth = 1.8 * (1 - f) + 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, vr, 0, Math.PI * 1.35);
    ctx.stroke();
    ctx.restore();
  }

  // Swept dust/leaf/spark motes flowing along wind spine
  for (let mi = 0; mi < 3; mi++) {
    let u = clamp((mi * 0.28 + f * 0.55) % 1, 0.08, 0.96);
    let mx = sx + dx * u + nx * Math.sin(u * Math.PI * 2 + elapsedTime * 12) * 8 * waveSign;
    let my = sy + dy * u + ny * Math.sin(u * Math.PI * 2 + elapsedTime * 12) * 8 * waveSign;
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = mi === 1 ? "#FFFFFF" : mainCol;
    ctx.beginPath();
    ctx.ellipse(mx, my, 3.2 * (1 - f * 0.5), 1.4, Math.atan2(dy, dx), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawStylizedAfterimage(ctx, img, isMono, enableAdditive = true) {
  let f = clamp((img.life || 0) / Math.max(0.05, img.maxLife || 0.3), 0, 1);
  let alpha = clamp((img.alpha || 0.7) * (1 - f), 0, 1);
  if (alpha <= 0.02) return;

  let r = (img.radius || 22) * (1 - f * 0.14);
  let ang = img.facing || 0;
  let fillCol = isMono ? "#0F172A" : (img.color || "#A855F7");
  let rimCol = isMono ? "#FFFFFF" : (img.accentColor || "#E0F2FE");

  ctx.save();
  ctx.translate(img.x, img.y);
  ctx.rotate(ang);
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }

  // Swept cloak & shoulder motion streaks trailing behind facing vector
  ctx.globalAlpha = alpha * 0.48;
  ctx.fillStyle = fillCol;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.95);
  ctx.quadraticCurveTo(-r * 1.45, -r * 0.72, -r * 2.15, -r * 0.18);
  ctx.lineTo(-r * 1.65, 0);
  ctx.lineTo(-r * 2.15, r * 0.18);
  ctx.quadraticCurveTo(-r * 1.45, r * 0.72, -r * 0.2, r * 0.95);
  ctx.closePath();
  ctx.fill();

  // Translucent hero silhouette & pauldron arcs
  ctx.globalAlpha = alpha * 0.56;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.fillStyle = fillCol;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.9;
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 1.8 * (1 - f * 0.4) + 0.5;
  ctx.stroke();

  // Ghost weapon slash silhouette ahead of hero body
  ctx.globalAlpha = alpha * 0.72;
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 2.6 * (1 - f * 0.5) + 0.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(r * 0.22, 0, r * 1.05, -0.78, 0.78);
  ctx.stroke();

  // Trailing eye/core glint
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(r * 0.34, -r * 0.22, 1.8, 0, Math.PI * 2);
  ctx.arc(r * 0.34, r * 0.22, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawWarpRing(ctx, ring, isMono, enableAdditive = true) {
  let f = clamp((ring.life || 0) / Math.max(0.08, ring.maxLife || 0.32), 0, 1);
  let alpha = (1 - f) * (ring.alpha || 0.85);
  if (alpha <= 0.02) return;

  let maxR = ring.maxRadius || ring.radius || 110;
  let r = maxR * (0.24 + 0.76 * Math.pow(f, 0.55));
  let tilt = ring.tiltY || 0.72;
  let col1 = isMono ? "#FFFFFF" : (ring.color || "#38BDF8");
  let col2 = isMono ? "#94A3B8" : (ring.accentColor || "#E879F9");

  ctx.save();
  ctx.translate(ring.x, ring.y);
  ctx.rotate(ring.angle || 0);
  ctx.scale(1, tilt);
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }

  // Chromatic aberration outer & inner spatial distortion ellipses
  ctx.globalAlpha = alpha * 0.62;
  ctx.strokeStyle = col2;
  ctx.lineWidth = (4.5 * (1 - f)) + 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.88;
  ctx.strokeStyle = col1;
  ctx.lineWidth = (3.4 * (1 - f)) + 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.92;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.0, 2.0 * (1 - f));
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
  ctx.stroke();

  // Radial spatial shear tick marks
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = col1;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 8; i++) {
    let ang = (Math.PI / 4) * i + f * 0.9;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 0.86, Math.sin(ang) * r * 0.86);
    ctx.lineTo(Math.cos(ang) * r * 1.12, Math.sin(ang) * r * 1.12);
    ctx.stroke();
  }

  ctx.restore();
}

function drawUltPolygon(ctx, cx, cy, sides, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    let ang = rot + (Math.PI * 2 * i) / sides;
    let px = cx + Math.cos(ang) * r;
    let py = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
}

function drawUltDiamondShard(ctx, x, y, len, wid, rot, fillCol, strokeCol) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(0, -wid);
  ctx.lineTo(-len * 0.72, 0);
  ctx.lineTo(0, wid);
  ctx.closePath();
  ctx.fillStyle = fillCol;
  ctx.fill();
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawUltPetal(ctx, ang, innerR, outerR, width, fillCol, strokeCol) {
  ctx.save();
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(innerR, 0);
  ctx.quadraticCurveTo((innerR + outerR) * 0.5, -width, outerR, 0);
  ctx.quadraticCurveTo((innerR + outerR) * 0.5, width, innerR, 0);
  ctx.closePath();
  ctx.fillStyle = fillCol;
  ctx.fill();
  if (strokeCol) {
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawUltJaggedBolt(ctx, x1, y1, x2, y2, amp, segs, seed, strokeCol, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  let dx = x2 - x1;
  let dy = y2 - y1;
  let len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  for (let i = 1; i < segs; i++) {
    let t = i / segs;
    let off = Math.sin(seed * 2.7 + i * 4.1) * amp * Math.sin(t * Math.PI);
    ctx.lineTo(x1 + dx * t + nx * off, y1 + dy * t + ny * off);
  }
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawUltimateSequence(ctx, seq, elapsedTime, isMono, enableAdditive = true) {
  let f = clamp((seq.life || 0) / Math.max(0.2, seq.maxLife || 1.35), 0, 1);
  let r = seq.radius || 210;
  let heroId = seq.heroId || "dung";
  let mainCol = isMono ? "#FFFFFF" : (seq.color || "#FACC15");
  let accentCol = isMono ? "#94A3B8" : (seq.accentColor || "#38BDF8");
  let hotCol = isMono ? "#FFFFFF" : "#FEF9C3";

  // 5-Stage Progression Envelopes:
  // 1. Awakening (0.00..0.18), 2. Gathering (0.10..0.34), 3. Release (0.26..0.54),
  // 4. Impact (0.42..0.78), 5. Aftermath (0.68..1.00)
  let wakeW = f < 0.18 ? Math.sin(clamp(f / 0.18, 0, 1) * Math.PI) : 0;
  let gatherW = f >= 0.08 && f <= 0.36 ? Math.sin(clamp((f - 0.08) / 0.28, 0, 1) * Math.PI) : 0;
  let releaseW = f >= 0.24 && f <= 0.56 ? Math.sin(clamp((f - 0.24) / 0.32, 0, 1) * Math.PI) : 0;
  let impactW = f >= 0.4 && f <= 0.8 ? Math.sin(clamp((f - 0.4) / 0.4, 0, 1) * Math.PI) : 0;
  let afterW = f >= 0.66 ? clamp((f - 0.66) / 0.14, 0, 1) * clamp(1 - (f - 0.72) / 0.28, 0, 1) : 0;
  let fadeOut = f > 0.72 ? clamp(1 - (f - 0.72) / 0.28, 0, 1) : 1;
  let domainAlpha = (f < 0.12 ? f / 0.12 : fadeOut) * 0.85;
  let baseAngle = seq.angle || 0;

  ctx.save();
  ctx.translate(seq.x, seq.y);
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }

  switch (heroId) {
    case "dung": {
      // Tam Đầu Khuyển · Chiến Thần: Triple Cerberus fang jaws, chained storm spears & crackling arcs
      let sr = r * (0.65 + 0.35 * Math.min(1, f * 2.2));
      ctx.globalAlpha = domainAlpha * 0.75;
      ctx.save();
      ctx.rotate(elapsedTime * 1.8);
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 3 hound head lightning crest chevrons (120 deg apart)
      for (let hi = 0; hi < 3; hi++) {
        let ha = baseAngle + (Math.PI * 2 * hi) / 3 + (gatherW * 0.35);
        let reach = sr * (0.48 + 0.54 * clamp(f * 1.8, 0, 1));
        ctx.save();
        ctx.rotate(ha);
        ctx.globalAlpha = domainAlpha * 0.9;
        ctx.fillStyle = isMono ? "#CBD5E1" : hi === 0 ? "#FDE047" : mainCol;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(reach * 0.96, 0);
        ctx.lineTo(reach * 0.42, -22 * (0.7 + releaseW * 0.6));
        ctx.lineTo(reach * 0.56, 0);
        ctx.lineTo(reach * 0.42, 22 * (0.7 + releaseW * 0.6));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (gatherW > 0.05 || impactW > 0.05) {
          drawUltJaggedBolt(ctx, 16, 0, reach * 0.95, 0, 14, 5, elapsedTime * 18 + hi * 3, accentCol, 2.6 * (gatherW + impactW));
        }
        ctx.restore();
      }
      if (releaseW > 0.05 || impactW > 0.05) {
        let wave = Math.max(releaseW, impactW);
        ctx.globalAlpha = wave * 0.9;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4.2 * wave;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.35 + f * 0.72), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (afterW > 0.05) {
        ctx.globalAlpha = afterW * 0.85;
        for (let si = 0; si < 6; si++) {
          let sa = (Math.PI / 3) * si + elapsedTime * 3;
          drawUltJaggedBolt(ctx, Math.cos(sa) * r * 0.25, Math.sin(sa) * r * 0.25, Math.cos(sa) * r * 0.85, Math.sin(sa) * r * 0.85, 11, 4, elapsedTime * 20 + si, mainCol, 1.8 * afterW);
        }
      }
      break;
    }

    case "tin": {
      // Lãnh Địa Trắng Đen: Vạn Trảm — Crimson-obsidian X spatial fissure & shattered Ma Thạch shards
      let tearLen = r * (0.55 + clamp(f * 2.1, 0, 1) * 0.62);
      ctx.globalAlpha = domainAlpha * 0.82;
      ctx.save();
      ctx.rotate(-elapsedTime * 1.4);
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
      ctx.lineWidth = 2.2;
      drawUltPolygon(ctx, 0, 0, 4, r * 0.76, Math.PI / 4);
      ctx.stroke();
      ctx.restore();

      // Twin crossed dimensional slash tears
      for (let xi = 0; xi < 2; xi++) {
        let xa = baseAngle + (xi === 0 ? 0.62 : -0.62);
        let openW = (8 + 20 * Math.max(releaseW, impactW)) * fadeOut;
        ctx.save();
        ctx.rotate(xa);
        ctx.globalAlpha = domainAlpha;
        ctx.fillStyle = isMono ? "#0F172A" : "#31102F";
        ctx.strokeStyle = isMono ? "#FFFFFF" : "#F43F5E";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-tearLen, 0);
        ctx.quadraticCurveTo(0, -openW, tearLen, 0);
        ctx.quadraticCurveTo(0, openW, -tearLen, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-tearLen * 0.92, 0);
        ctx.lineTo(tearLen * 0.92, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Orbiting / shattering Ma Thạch shards
      let shardCount = 8;
      ctx.globalAlpha = domainAlpha * 0.92;
      for (let si = 0; si < shardCount; si++) {
        let sa = (Math.PI * 2 * si) / shardCount + elapsedTime * 2.6;
        let dist = gatherW > 0.1
          ? r * (0.95 - gatherW * 0.6)
          : r * (0.35 + f * 0.72);
        drawUltDiamondShard(
          ctx,
          Math.cos(sa) * dist,
          Math.sin(sa) * dist,
          14 * fadeOut + 4,
          5.5 * fadeOut + 1.5,
          sa + f * 3,
          si % 2 === 0 ? mainCol : "#FFFFFF",
          isMono ? "#0F172A" : "#9F1239"
        );
      }
      if (wakeW > 0.05 || releaseW > 0.05) {
        drawFourPointStar(ctx, 0, 0, r * 0.36 * (wakeW + releaseW) + 10, 4.5, "#FFFFFF", mainCol);
      }
      break;
    }

    case "kin": {
      // Vạn Tiễn Thiên Không — Triple spiral emerald gale compass, crescent wind blades & arrow fan
      ctx.globalAlpha = domainAlpha * 0.85;
      for (let ring = 0; ring < 3; ring++) {
        let rr = r * (0.36 + ring * 0.28) * (0.7 + 0.3 * clamp(f * 2, 0, 1));
        let dir = ring % 2 === 0 ? 1 : -1;
        ctx.save();
        ctx.rotate(elapsedTime * (2.6 + ring * 1.1) * dir);
        ctx.strokeStyle = ring === 1 ? accentCol : mainCol;
        ctx.lineWidth = (3.4 - ring * 0.6) * fadeOut + 0.8;
        for (let arc = 0; arc < 3; arc++) {
          let a0 = (Math.PI * 2 * arc) / 3;
          ctx.beginPath();
          ctx.arc(0, 0, rr, a0, a0 + 1.25);
          ctx.stroke();
        }
        ctx.restore();
      }
      // 8 Emerald Feather / Arrow Blades radiating in cyclone fan
      for (let fi = 0; fi < 8; fi++) {
        let fa = baseAngle + (Math.PI * 2 * fi) / 8 + f * 2.2;
        let fr = r * (0.25 + clamp(f * 1.5, 0, 1) * 0.72);
        ctx.save();
        ctx.translate(Math.cos(fa) * fr, Math.sin(fa) * fr);
        ctx.rotate(fa + 0.35);
        ctx.globalAlpha = domainAlpha * 0.92;
        ctx.fillStyle = fi % 2 === 0 ? mainCol : "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-8, -5.5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 5.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      if (impactW > 0.05) {
        drawFourPointStar(ctx, 0, 0, r * 0.3 * impactW + 10, 3.5, "#FFFFFF", mainCol);
      }
      break;
    }

    case "trung": {
      // Đại Thiên Thạch Hủy Diệt — Tilted 3D Orbital Astrolabe + 6 Astral Planets + Supernova Core
      ctx.globalAlpha = domainAlpha * 0.88;
      for (let orbit = 0; orbit < 2; orbit++) {
        ctx.save();
        ctx.rotate(baseAngle + (orbit === 0 ? 0.42 : -0.42) + elapsedTime * (orbit === 0 ? 1.3 : -1.1));
        ctx.scale(1, 0.56);
        ctx.strokeStyle = orbit === 0 ? mainCol : accentCol;
        ctx.lineWidth = 2.8 * fadeOut + 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.86 - orbit * 0.14), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // 6 Orbiting Astral Spheres collapsing then bursting outward
      let orbitScale = gatherW > 0.05 ? 1 - gatherW * 0.55 : releaseW > 0.05 ? 0.45 + releaseW * 0.65 : 0.92 + afterW * 0.2;
      for (let pi = 0; pi < 6; pi++) {
        let pa = elapsedTime * 3.4 + (Math.PI * 2 * pi) / 6;
        let px = Math.cos(pa) * r * 0.62 * orbitScale;
        let py = Math.sin(pa) * r * 0.62 * orbitScale;
        ctx.fillStyle = pi % 2 === 0 ? mainCol : accentCol;
        ctx.beginPath();
        ctx.arc(px, py, 8 * fadeOut + 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 3.5 * fadeOut + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      // Impact supernova meteor ring
      if (impactW > 0.05 || releaseW > 0.05) {
        let p = Math.max(impactW, releaseW);
        ctx.globalAlpha = p * 0.92;
        drawFourPointStar(ctx, 0, 0, r * 0.42 * p + 12, r * 0.1 * p + 3, "#FFFFFF", accentCol);
        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 4.2 * p;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.28 + f * 0.78), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "eohyen": {
      // Bão Băng Oanh Tạc — 6-branch Crystal Snowflake Mandala + Frost Shatter Hail
      let sr = r * (0.48 + 0.52 * clamp(f * 1.9, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.9;
      ctx.save();
      ctx.rotate(elapsedTime * 0.9);
      // 6 Glacial Crystal Branches with sub-twigs
      for (let b = 0; b < 6; b++) {
        let ba = (Math.PI / 3) * b;
        ctx.save();
        ctx.rotate(ba);
        ctx.strokeStyle = b % 2 === 0 ? "#E0F2FE" : mainCol;
        ctx.lineWidth = 2.8 * fadeOut + 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sr * 0.94, 0);
        ctx.moveTo(sr * 0.46, 0);
        ctx.lineTo(sr * 0.64, -sr * 0.16);
        ctx.moveTo(sr * 0.46, 0);
        ctx.lineTo(sr * 0.64, sr * 0.16);
        ctx.moveTo(sr * 0.7, 0);
        ctx.lineTo(sr * 0.84, -sr * 0.11);
        ctx.moveTo(sr * 0.7, 0);
        ctx.lineTo(sr * 0.84, sr * 0.11);
        ctx.stroke();
        drawUltDiamondShard(ctx, sr * 0.96, 0, 10 * fadeOut + 3, 4.5, 0, "#FFFFFF", mainCol);
        ctx.restore();
      }
      drawUltPolygon(ctx, 0, 0, 6, sr * 0.52, 0);
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      if (impactW > 0.05) {
        ctx.globalAlpha = impactW * 0.85;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4 * impactW;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.4 + f * 0.65), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "longhoi": {
      // Hỏa Hồ Liệt Diễm — 9-Tail Fox-Fire Lotus Petals unfurling + Swirling Solar Embers
      ctx.globalAlpha = domainAlpha * 0.9;
      let petalReach = r * (0.5 + 0.54 * clamp(f * 1.75, 0, 1));
      ctx.save();
      ctx.rotate(elapsedTime * 1.6);
      for (let ti = 0; ti < 9; ti++) {
        let ta = (Math.PI * 2 * ti) / 9 + Math.sin(elapsedTime * 5 + ti) * 0.08;
        drawUltPetal(
          ctx,
          ta,
          r * 0.16,
          petalReach,
          20 * (0.65 + releaseW * 0.55),
          isMono ? "rgba(255,255,255,0.45)" : ti % 2 === 0 ? "rgba(249, 115, 22, 0.55)" : "rgba(239, 68, 68, 0.48)",
          ti % 3 === 0 ? "#FFFFFF" : accentCol
        );
      }
      ctx.restore();
      // Blazing wildfire shock ring
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = (4.5 * Math.max(releaseW, impactW)) + 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.34 + f * 0.72), 0, Math.PI * 2);
      ctx.stroke();
      drawFourPointStar(ctx, 0, 0, r * 0.24 * (0.5 + impactW) + 8, 4, "#FFFFFF", mainCol);
      break;
    }

    case "duccong": {
      // Thiên Hà Sụp Đổ — Dark Singularity Event Horizon + Tilted Accretion Disk + Inward Gravity Streaks
      let pullR = r * (f < 0.45 ? 1.0 - f * 1.15 : 0.48 + (f - 0.45) * 1.1);
      ctx.globalAlpha = domainAlpha * 0.92;
      // Dark singularity pit (even in additive, crisp dark-violet ring contrast)
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = isMono ? "rgba(15, 23, 42, 0.62)" : "rgba(24, 6, 46, 0.65)";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(18, r * 0.34 * (1 - gatherW * 0.35)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Tilted twin accretion disks
      for (let di = 0; di < 2; di++) {
        ctx.save();
        ctx.rotate(baseAngle + (di === 0 ? 0.3 : -0.55) + elapsedTime * (di === 0 ? 2.4 : -1.9));
        ctx.scale(1.15, 0.42);
        ctx.strokeStyle = di === 0 ? mainCol : accentCol;
        ctx.lineWidth = (3.8 - di) * fadeOut + 1.1;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(24, pullR * 0.85), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // Swirling spiral gravity threads
      for (let gi = 0; gi < 8; gi++) {
        let ga = (Math.PI * 2 * gi) / 8 - elapsedTime * 3.8;
        ctx.strokeStyle = gi % 2 === 0 ? accentCol : "#FFFFFF";
        ctx.lineWidth = 2 * fadeOut + 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ga) * r * 0.96, Math.sin(ga) * r * 0.96);
        ctx.quadraticCurveTo(Math.cos(ga + 0.65) * r * 0.45, Math.sin(ga + 0.65) * r * 0.45, Math.cos(ga + 1.2) * 18, Math.sin(ga + 1.2) * 18);
        ctx.stroke();
      }
      if (impactW > 0.05) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4.5 * impactW;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.2 + (f - 0.4) * 1.45), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "gau": {
      // Cuồng Hùng Giáng Lâm — Triple Amber Bear-Claw Tears + Seismic Anvil Impact Ring
      ctx.globalAlpha = domainAlpha * 0.92;
      let slamScale = f < 0.35 ? 1.25 - f * 1.4 : 0.76 + (f - 0.35) * 0.45;
      ctx.save();
      ctx.rotate(baseAngle);
      // 3 deep parallel claw gouges
      for (let ci = -1; ci <= 1; ci++) {
        let oy = ci * 28;
        let clen = r * (0.72 + clamp(f * 2.1, 0, 1) * 0.32);
        ctx.strokeStyle = ci === 0 ? "#FFFFFF" : mainCol;
        ctx.lineWidth = (ci === 0 ? 7.5 : 5.5) * fadeOut + 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-clen * 0.62, oy - 16);
        ctx.quadraticCurveTo(0, oy + 6, clen * 0.72, oy - 6);
        ctx.stroke();
      }
      ctx.restore();
      // Jagged seismic anvil fracture ring
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 3.4 * fadeOut + 1;
      ctx.beginPath();
      for (let si = 0; si <= 16; si++) {
        let sa = (Math.PI * 2 * si) / 16;
        let sr = r * (si % 2 === 0 ? 0.88 : 0.72) * slamScale;
        let sx = Math.cos(sa) * sr;
        let sy = Math.sin(sa) * sr;
        if (si === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case "bao": {
      // Vạn Ảnh Tàn Sát — Shattered Violet-Magenta Prism Mirrors + 6 Converging Phantom Daggers
      ctx.globalAlpha = domainAlpha * 0.9;
      for (let mi = 0; mi < 6; mi++) {
        let ma = baseAngle + (Math.PI * 2 * mi) / 6 + elapsedTime * 1.4;
        let rad = f < 0.4 ? r * (0.92 - f * 1.35) : r * (0.38 + (f - 0.4) * 1.05);
        ctx.save();
        ctx.translate(Math.cos(ma) * rad, Math.sin(ma) * rad);
        ctx.rotate(ma + Math.PI);
        // Mirror shard triangle + phantom dagger
        ctx.fillStyle = isMono ? "rgba(255,255,255,0.45)" : mi % 2 === 0 ? "rgba(168, 85, 247, 0.55)" : "rgba(244, 63, 94, 0.5)";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -11);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-10, 11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // Prism web connections
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 1.8 * fadeOut + 0.5;
      drawUltPolygon(ctx, 0, 0, 6, r * (0.68 + releaseW * 0.22), elapsedTime * 1.2);
      ctx.stroke();
      if (impactW > 0.05) {
        drawFourPointStar(ctx, 0, 0, r * 0.34 * impactW + 10, 3.2, "#FFFFFF", mainCol);
      }
      break;
    }

    case "danh": {
      // Hóa Rồng · Chân Long Giáng Thế — Coiling Imperial Crimson-Gold Dragon Rune Wheel & Twin Crescent Claws
      let sr = r * (0.58 + 0.42 * clamp(f * 1.8, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      ctx.save();
      ctx.rotate(elapsedTime * 2.1);
      // Coiling double-helix dragon energy arcs
      for (let arc = 0; arc < 2; arc++) {
        ctx.save();
        ctx.rotate(arc * Math.PI);
        ctx.strokeStyle = arc === 0 ? accentCol : mainCol;
        ctx.lineWidth = 5.5 * fadeOut + 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.82, 0.15, Math.PI * 0.85);
        ctx.stroke();
        // Dragon head chevron at leading edge
        let hx = Math.cos(0.15) * sr * 0.82;
        let hy = Math.sin(0.15) * sr * 0.82;
        drawUltDiamondShard(ctx, hx, hy, 16, 7, 0.15 - Math.PI / 2, "#FFFFFF", accentCol);
        ctx.restore();
      }
      drawUltPolygon(ctx, 0, 0, 8, sr * 0.56, 0);
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      if (releaseW > 0.05 || impactW > 0.05) {
        let p = Math.max(releaseW, impactW);
        drawFourPointStar(ctx, 0, 0, r * 0.42 * p + 12, 5, "#FFFFFF", mainCol);
      }
      break;
    }

    case "luan": {
      // Tia Hủy Diệt Phân Nhánh — Asymmetrical Fractured Dimensional Mirror Web + Prism Convergence Beams
      ctx.globalAlpha = domainAlpha * 0.9;
      let shardAngles = [0.2, 0.95, 1.85, 2.7, 3.55, 4.45, 5.3];
      for (let i = 0; i < shardAngles.length; i++) {
        let a1 = shardAngles[i] + baseAngle;
        let a2 = shardAngles[(i + 1) % shardAngles.length] + baseAngle;
        let r1 = r * (0.58 + (i % 3) * 0.14);
        let r2 = r * (0.58 + ((i + 1) % 3) * 0.14);
        ctx.strokeStyle = i % 2 === 0 ? mainCol : accentCol;
        ctx.lineWidth = 2.2 * fadeOut + 0.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
        ctx.stroke();
      }
      // Primary directional laser split flash
      ctx.save();
      ctx.rotate(baseAngle);
      for (let branch of [-0.42, 0, 0.42]) {
        ctx.strokeStyle = branch === 0 ? "#FFFFFF" : accentCol;
        ctx.lineWidth = (branch === 0 ? 5.5 : 3) * (0.4 + Math.max(releaseW, impactW));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(branch) * r * 1.08, Math.sin(branch) * r * 1.08);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case "taidu": {
      // Oanh Tạc Vệ Tinh — Tactical Hex Grid + Lock-On Crosshairs + Orbital Carpet Shock Rings
      ctx.globalAlpha = domainAlpha * 0.9;
      let sr = r * (0.64 + 0.36 * clamp(f * 2, 0, 1));
      ctx.save();
      ctx.rotate(elapsedTime * 1.2);
      drawUltPolygon(ctx, 0, 0, 6, sr * 0.88, 0);
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      drawUltPolygon(ctx, 0, 0, 6, sr * 0.56, Math.PI / 6);
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      // 4 Tactical Target Brackets
      for (let bi = 0; bi < 4; bi++) {
        let ba = (Math.PI / 2) * bi + Math.PI / 4;
        ctx.save();
        ctx.rotate(ba);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.5 * fadeOut + 0.8;
        ctx.beginPath();
        ctx.moveTo(sr * 0.35, 0);
        ctx.lineTo(sr * 1.02, 0);
        ctx.moveTo(sr * 0.72, -12);
        ctx.lineTo(sr * 0.82, 0);
        ctx.lineTo(sr * 0.72, 12);
        ctx.stroke();
        ctx.restore();
      }
      if (impactW > 0.05) {
        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 4.4 * impactW;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.25 + f * 0.8), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "nguyen": {
      // Đại Hồi Phục — 8-Petal Emerald-Gold Sanctuary Lotus unfolding + Floating Life Seed Motes
      ctx.globalAlpha = domainAlpha * 0.9;
      let petalR = r * (0.45 + 0.52 * clamp(f * 1.7, 0, 1));
      ctx.save();
      ctx.rotate(elapsedTime * 0.8);
      for (let pi = 0; pi < 8; pi++) {
        let pa = (Math.PI / 4) * pi;
        drawUltPetal(
          ctx,
          pa,
          r * 0.14,
          petalR,
          24 * (0.7 + impactW * 0.4),
          isMono ? "rgba(255,255,255,0.4)" : pi % 2 === 0 ? "rgba(16, 185, 129, 0.48)" : "rgba(250, 204, 21, 0.42)",
          pi % 2 === 0 ? mainCol : accentCol
        );
      }
      ctx.restore();
      // Concentric protective sanctuary dome rings
      for (let ri = 0; ri < 2; ri++) {
        ctx.strokeStyle = ri === 0 ? mainCol : accentCol;
        ctx.lineWidth = (3.2 - ri) * fadeOut + 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.58 + ri * 0.34) * (0.85 + Math.sin(f * Math.PI) * 0.15), 0, Math.PI * 2);
        ctx.stroke();
      }
      drawFourPointStar(ctx, 0, 0, 18 * fadeOut + 6, 5, "#FFFFFF", mainCol);
      break;
    }

    case "duy": {
      // Bão Tiêu Diệt Thế — Spinning 8-Blade Jade-Crimson Shuriken Wheel & Blood-Seal Crosshairs
      let spin = elapsedTime * 6.8;
      let sr = r * (0.45 + 0.55 * clamp(f * 2, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      ctx.save();
      ctx.rotate(spin);
      for (let bi = 0; bi < 8; bi++) {
        let ba = (Math.PI / 4) * bi;
        ctx.save();
        ctx.rotate(ba);
        ctx.fillStyle = bi % 2 === 0 ? mainCol : accentCol;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sr * 0.96, 0);
        ctx.lineTo(sr * 0.38, -14);
        ctx.lineTo(sr * 0.52, 0);
        ctx.lineTo(sr * 0.32, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.6 * fadeOut + 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case "phong": {
      // Tử Thần Giáng Lâm — Twin Opposing Cyan-Crimson Crescent Blades forming Razor X-Cut
      let sr = r * (0.52 + 0.52 * clamp(f * 1.9, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      for (let ci = 0; ci < 2; ci++) {
        let ca = baseAngle + (ci === 0 ? 0.55 : -0.55) + f * 0.8 * (ci === 0 ? 1 : -1);
        ctx.save();
        ctx.rotate(ca);
        ctx.strokeStyle = ci === 0 ? mainCol : accentCol;
        ctx.lineWidth = 6.5 * fadeOut + 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.78, -0.95, 0.95);
        ctx.stroke();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.4 * fadeOut + 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.78, -0.75, 0.75);
        ctx.stroke();
        ctx.restore();
      }
      if (releaseW > 0.05 || impactW > 0.05) {
        drawFourPointStar(ctx, 0, 0, r * 0.36 * Math.max(releaseW, impactW) + 8, 3.8, "#FFFFFF", accentCol);
      }
      break;
    }

    case "dang": {
      // Hổ Quyền Diệt Thế — Rotating Yin-Yang Taiji Ring + Opposing White & Black Tiger Fang Shockwaves
      let sr = r * (0.52 + 0.48 * clamp(f * 1.85, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      ctx.save();
      ctx.rotate(elapsedTime * 3.4);
      // White Yang half-arc + Black Yin half-arc
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 6.2 * fadeOut + 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.82, 0, Math.PI);
      ctx.stroke();
      ctx.strokeStyle = isMono ? "#475569" : "#18181B";
      ctx.lineWidth = 7.2 * fadeOut + 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.82, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.82, Math.PI, Math.PI * 2);
      ctx.stroke();
      // Yin-Yang focus orbs
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(sr * 0.42, 0, 9 * fadeOut + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isMono ? "#1E293B" : "#090D16";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(-sr * 0.42, 0, 9 * fadeOut + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (impactW > 0.05) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4 * impactW;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.3 + f * 0.72), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "thanh": {
      // Xà Linh Hộ Thể — Ouroboros Twin Emerald-Violet Serpent Coils + Venom Fang Core
      let sr = r * (0.55 + 0.45 * clamp(f * 1.9, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.9;
      ctx.save();
      ctx.rotate(elapsedTime * 2.8);
      for (let si = 0; si < 2; si++) {
        ctx.save();
        ctx.rotate(si * Math.PI);
        ctx.strokeStyle = si === 0 ? mainCol : accentCol;
        ctx.lineWidth = 5.2 * fadeOut + 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.78, 0.12, Math.PI * 0.92);
        ctx.stroke();
        // Serpent head fang silhouette
        drawUltDiamondShard(ctx, Math.cos(0.12) * sr * 0.78, Math.sin(0.12) * sr * 0.78, 15, 6.5, 0.12 - Math.PI / 2, "#FFFFFF", mainCol);
        ctx.restore();
      }
      ctx.restore();
      // Venom ripple ring
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 2.2 * fadeOut + 0.6;
      ctx.setLineDash([10, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    case "nhi": {
      // Độc Tiễn Truy Sát — Tri-Elixir Alchemy Transmutation Circle (Purple/Green/Rose nodes at 120 deg)
      let sr = r * (0.54 + 0.46 * clamp(f * 1.9, 0, 1));
      let elixirCols = isMono ? ["#FFFFFF", "#CBD5E1", "#94A3B8"] : ["#C084FC", "#4ADE80", "#FB7185"];
      ctx.globalAlpha = domainAlpha * 0.92;
      ctx.save();
      ctx.rotate(elapsedTime * 2.2);
      drawUltPolygon(ctx, 0, 0, 3, sr * 0.82, 0);
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 2.8;
      ctx.stroke();
      drawUltPolygon(ctx, 0, 0, 3, sr * 0.82, Math.PI);
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      for (let ei = 0; ei < 3; ei++) {
        let ea = (Math.PI * 2 * ei) / 3;
        let ex = Math.cos(ea) * sr * 0.82;
        let ey = Math.sin(ea) * sr * 0.82;
        ctx.fillStyle = elixirCols[ei];
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, 9 * fadeOut + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      if (impactW > 0.05) {
        drawFourPointStar(ctx, 0, 0, r * 0.28 * impactW + 8, 4, "#FFFFFF", elixirCols[1]);
      }
      break;
    }

    case "thien": {
      // Vạn Giới Du Hành / Phán Quyết Sáng Thế — 12-Sword Celestial Sundial Halo + Golden Crown
      let sr = r * (0.58 + 0.42 * clamp(f * 1.85, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.94;
      ctx.save();
      ctx.rotate(elapsedTime * 1.1);
      for (let sw = 0; sw < 12; sw++) {
        let sa = (Math.PI / 6) * sw;
        let reach = sr * (sw % 2 === 0 ? 0.98 : 0.76);
        drawUltDiamondShard(
          ctx,
          Math.cos(sa) * reach,
          Math.sin(sa) * reach,
          (sw % 2 === 0 ? 16 : 11) * fadeOut + 4,
          4.2,
          sa,
          sw % 2 === 0 ? mainCol : accentCol,
          "#FFFFFF"
        );
      }
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 3 * fadeOut + 1;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawFourPointStar(ctx, 0, 0, r * 0.32 * (0.55 + Math.max(releaseW, impactW)) + 10, 5, "#FFFFFF", mainCol);
      break;
    }

    case "minh": {
      // Thiên Lao Giáng Lâm — Heavenly Golden Lock Chains crisscrossing Sacred Bell Sigil + 6 Decree Pillars
      let sr = r * (0.56 + 0.44 * clamp(f * 1.9, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      // 3 crisscrossing lock chains
      for (let ci = 0; ci < 3; ci++) {
        let ca = baseAngle + (Math.PI / 3) * ci;
        ctx.save();
        ctx.rotate(ca);
        ctx.strokeStyle = ci === 0 ? mainCol : accentCol;
        ctx.lineWidth = 3.2 * fadeOut + 0.8;
        ctx.setLineDash([12, 6]);
        ctx.beginPath();
        ctx.moveTo(-sr, 0);
        ctx.lineTo(sr, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      // 6 Sacred Decree Pillars
      for (let pi = 0; pi < 6; pi++) {
        let pa = (Math.PI / 3) * pi + elapsedTime * 0.7;
        let px = Math.cos(pa) * sr * 0.85;
        let py = Math.sin(pa) * sr * 0.85;
        drawUltDiamondShard(ctx, px, py, 11 * fadeOut + 3, 5, pa + Math.PI / 2, mainCol, "#FFFFFF");
      }
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.8 * fadeOut + 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case "ducanh": {
      // Thiên Thạch Lăn Cuồng Nộ — Interlocking Golden Siege-Gear Fortress Rings & Meteor Anvil Crosshair
      let sr = r * (0.55 + 0.45 * clamp(f * 2, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      ctx.save();
      ctx.rotate(elapsedTime * 2.2);
      // Outer notched siege gear teeth
      let teeth = 12;
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 4.2 * fadeOut + 1.2;
      ctx.beginPath();
      for (let ti = 0; ti <= teeth * 2; ti++) {
        let ta = (Math.PI * ti) / teeth;
        let tr = ti % 2 === 0 ? sr * 0.92 : sr * 0.78;
        let tx = Math.cos(ta) * tr;
        let ty = Math.sin(ta) * tr;
        if (ti === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      // Inner molten anvil impact burst
      if (impactW > 0.05 || releaseW > 0.05) {
        let p = Math.max(impactW, releaseW);
        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 4.6 * p;
        ctx.beginPath();
        ctx.arc(0, 0, sr * (0.28 + f * 0.68), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "bach": {
      // Vạn Ảnh Tuyệt Diệt — 4 Gale-Petal Wind Talisman Seals rotating in opposing layers + Razor Slipstreams
      let sr = r * (0.54 + 0.46 * clamp(f * 2, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      for (let layer = 0; layer < 2; layer++) {
        ctx.save();
        ctx.rotate(elapsedTime * (layer === 0 ? 4.2 : -3.4));
        for (let si = 0; si < 4; si++) {
          let sa = (Math.PI / 2) * si;
          ctx.save();
          ctx.rotate(sa);
          ctx.strokeStyle = layer === 0 ? mainCol : accentCol;
          ctx.lineWidth = (layer === 0 ? 4.4 : 3.2) * fadeOut + 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, sr * (layer === 0 ? 0.86 : 0.56), 0.1, 1.12);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      drawFourPointStar(ctx, 0, 0, r * 0.34 * (0.5 + Math.max(releaseW, impactW)) + 8, 4.2, "#FFFFFF", accentCol);
      break;
    }

    case "thai": {
      // Đấu Trường Sinh Tử — Octagonal Gladiator Colosseum Ring + 8 War-Banners + Champion Crown
      let sr = r * (0.68 + 0.32 * clamp(f * 2.2, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      drawUltPolygon(ctx, 0, 0, 8, sr * 0.92, Math.PI / 8);
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 4 * fadeOut + 1.2;
      ctx.stroke();
      drawUltPolygon(ctx, 0, 0, 8, sr * 0.72, 0);
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 2.4 * fadeOut + 0.8;
      ctx.stroke();
      for (let bi = 0; bi < 8; bi++) {
        let ba = (Math.PI / 4) * bi + Math.PI / 8;
        drawUltDiamondShard(ctx, Math.cos(ba) * sr * 0.92, Math.sin(ba) * sr * 0.92, 12 * fadeOut + 3, 5, ba, accentCol, mainCol);
      }
      if (impactW > 0.05) {
        drawFourPointStar(ctx, 0, 0, r * 0.36 * impactW + 10, 5, "#FFFFFF", accentCol);
      }
      break;
    }

    case "khair":
    default: {
      // Pháo Kích Giật Lùi — Precision Emerald-Gold Sniper Rangefinder Dial + Mach-Cone Shock Diamonds
      let sr = r * (0.55 + 0.45 * clamp(f * 2, 0, 1));
      ctx.globalAlpha = domainAlpha * 0.92;
      ctx.save();
      ctx.rotate(baseAngle);
      // Sniper mil-dot reticle arcs
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 2.8 * fadeOut + 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.82, -0.7, 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, sr * 0.82, Math.PI - 0.7, Math.PI + 0.7);
      ctx.stroke();
      // Directional railgun cone & shock diamonds
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 3.2 * fadeOut + 0.8;
      ctx.beginPath();
      ctx.moveTo(-sr * 0.95, 0);
      ctx.lineTo(sr * 1.05, 0);
      ctx.moveTo(0, -sr * 0.75);
      ctx.lineTo(0, sr * 0.75);
      ctx.stroke();
      drawUltDiamondShard(ctx, sr * 0.45, 0, 14 * fadeOut + 3, 5.5, 0, "#FFFFFF", accentCol);
      drawUltDiamondShard(ctx, sr * 0.82, 0, 11 * fadeOut + 3, 4.2, 0, accentCol, mainCol);
      ctx.restore();
      if (impactW > 0.05) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3.6 * impactW;
        ctx.beginPath();
        ctx.arc(0, 0, sr * (0.3 + f * 0.65), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
  }

  // Subtle shared Stage 1 awakening spark & Stage 5 dissipating ember motes tuned to hero palette
  if (wakeW > 0.08) {
    ctx.globalAlpha = wakeW * 0.85;
    ctx.strokeStyle = hotCol;
    ctx.lineWidth = 2.4 * wakeW;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22 * (1 + wakeW), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (afterW > 0.05) {
    ctx.globalAlpha = afterW * 0.78;
    for (let ei = 0; ei < 4; ei++) {
      let ea = (Math.PI / 2) * ei - elapsedTime * 2.2 + baseAngle;
      let er = r * (0.62 + (f - 0.66) * 0.65);
      drawFourPointStar(ctx, Math.cos(ea) * er, Math.sin(ea) * er, 5 * afterW + 1.5, 1.5, "#FFFFFF", mainCol);
    }
  }

  ctx.restore();
}

export function drawCosmicSpatialTear(ctx, h, elapsedTime, isMono, enableAdditive = true) {
  let maxLife = Math.max(0.1, h.maxLife || 1.35);
  let p = clamp((h.life || 0) / maxLife, 0, 1);
  // Expand (0..0.14) -> Tremble/Vibrate (0.14..0.76) -> Snap shut (0.76..1.0)
  let widthEnv = p < 0.14 ? p / 0.14 : p > 0.76 ? Math.max(0, 1 - (p - 0.76) / 0.24) : 1;
  let alpha = p > 0.8 ? clamp(1 - (p - 0.8) / 0.2, 0, 1) : 1;
  if (alpha <= 0.02 || widthEnv <= 0.02) return;

  let dx = h.x2 - h.x1, dy = h.y2 - h.y1;
  let len = Math.hypot(dx, dy) || 1;
  let ang = Math.atan2(dy, dx);
  let nx = -Math.sin(ang), ny = Math.cos(ang);
  let offsets = h.offsets && h.offsets.length > 0 ? h.offsets : [-6, 9, -12, 8, -4];
  let D = offsets.length;
  let tremble = p >= 0.14 && p <= 0.78 ? Math.sin(elapsedTime * 42 + (h.x1 || 0)) * 2.2 : 0;
  let baseW = (h.width || 12) * (0.35 + 0.65 * widthEnv);
  let mainCol = isMono ? "#FFFFFF" : (h.color || "#F43F5E");
  let rimCol = isMono ? "#CBD5E1" : (h.accentColor || "#E879F9");

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const traceSpine = (mult = 1) => {
    ctx.beginPath();
    ctx.moveTo(h.x1, h.y1);
    for (let i = 0; i < D; i++) {
      let u = (i + 1) / (D + 1);
      let off = offsets[i] * mult + tremble * (i % 2 === 0 ? 1 : -1);
      ctx.lineTo(h.x1 + dx * u + nx * off, h.y1 + dy * u + ny * off);
    }
    ctx.lineTo(h.x2, h.y2);
  };

  // Deep dark cosmic dimensional void cavity inside fissure
  ctx.strokeStyle = isMono ? "#020617" : "#070312";
  ctx.lineWidth = baseW * 2.15;
  traceSpine(1.1);
  ctx.stroke();

  // Twinkling cosmic stars inside the tear void
  let starCount = Math.min(5, Math.max(2, Math.floor(len / 48)));
  for (let si = 0; si < starCount; si++) {
    let u = (si + 0.5) / starCount;
    let oi = Math.min(D - 1, Math.floor(u * D));
    let sx = h.x1 + dx * u + nx * (offsets[oi] * 0.55);
    let sy = h.y1 + dy * u + ny * (offsets[oi] * 0.55);
    drawFourPointStar(ctx, sx, sy, 2.8 * widthEnv + 0.8, 0.9, "#FFFFFF", rimCol);
  }

  // Additive neon dimensional glow rim
  ctx.save();
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.strokeStyle = mainCol;
  ctx.lineWidth = baseW * 1.15;
  traceSpine(1.0);
  ctx.stroke();

  ctx.strokeStyle = rimCol;
  ctx.lineWidth = Math.max(2.2, baseW * 0.58);
  traceSpine(0.82);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.5, baseW * 0.26);
  traceSpine(0.65);
  ctx.stroke();
  ctx.restore();

  // Branching jagged dimensional sub-cracks
  if (h.subRifts && h.subRifts.length > 0) {
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 2.2 * widthEnv + 0.5;
    for (let sr of h.subRifts) {
      let mx = sr.x + Math.cos(sr.angle + 0.18) * sr.len * 0.52;
      let my = sr.y + Math.sin(sr.angle + 0.18) * sr.len * 0.52;
      let ex = sr.x + Math.cos(sr.angle) * sr.len;
      let ey = sr.y + Math.sin(sr.angle) * sr.len;
      ctx.beginPath();
      ctx.moveTo(sr.x, sr.y);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  // Orbiting shattered dimension crystal motes being pulled along tear
  let P = (h.x1 || 0) * 0.05 + (h.y1 || 0) * 0.05;
  for (let N = 0; N < 5; N++) {
    let W = (N + 0.5) / 5;
    let pull = (1 - widthEnv) * 10;
    let V = h.x1 + dx * W + Math.sin(P + N * 2.3 + elapsedTime * 4) * Math.max(4, 15 - pull);
    let oe = h.y1 + dy * W + Math.cos(P + N * 3.1 + elapsedTime * 4) * Math.max(4, 15 - pull);
    let ye = elapsedTime * 6 + N * 1.5;
    ctx.save();
    ctx.translate(V, oe);
    ctx.rotate(ye);
    ctx.fillStyle = isMono ? "#FFFFFF" : rimCol;
    ctx.beginPath();
    ctx.moveTo(0, -5.8 * widthEnv);
    ctx.lineTo(4.6 * widthEnv, 0);
    ctx.lineTo(0, 6.2 * widthEnv);
    ctx.lineTo(-4.0 * widthEnv, 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isMono ? "#000000" : "#FFFFFF";
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// =====================================================================
// HERO WEAPON RENDERERS (Local space: centered on player, rotated to aim)
// =====================================================================

function drawDungSpear(ctx, p, t, state, isMono) {
  // Lôi Long Thương — Dragon Storm Halberd-Spear
  let isUlt = p.dung_c3_buff_timer > 0;
  let isBerserk = p.berserkTimer > 0;
  let skillBoost = state.skillAlpha;
  let critBoost = state.critAlpha;
  let atkProg = state.atkProg;
  let hasAtk = state.hasAtk;
  let parity = state.parity;

  let idleBob = Math.sin(t * 3.4) * 1.4;
  let walkTilt = state.moveAmt * Math.sin(state.walkPhase) * 0.08;
  let thrust = hasAtk ? Math.sin(atkProg * Math.PI) * 20 : 0;
  let swingTilt = hasAtk ? Math.sin(atkProg * Math.PI) * 0.22 * parity : 0;
  let flare = clamp(skillBoost + critBoost * 0.8 + (isUlt ? 0.55 : 0) + (isBerserk ? 0.25 : 0), 0, 1.3);

  ctx.save();
  ctx.translate(thrust + state.moveAmt * 2, 15 + idleBob);
  ctx.rotate(0.08 * (1 - (hasAtk ? Math.sin(atkProg * Math.PI) : 0)) + walkTilt + swingTilt);

  // Flowing tail tassel behind pommel
  let wave1 = Math.sin(t * 11 + state.walkPhase) * (3.5 + state.moveAmt * 3);
  let wave2 = Math.cos(t * 9 + state.walkPhase) * (4.5 + state.moveAmt * 3.5);
  ctx.strokeStyle = isMono ? "#000000" : isUlt ? "#FDE047" : "#06B6D4";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-30, wave1 * 0.7, -39, wave2);
  ctx.stroke();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#E0F2FE";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-29, wave1 * 0.5, -36, wave2 * 0.8);
  ctx.stroke();

  // Dark outline + sculpted titanium-bronze shaft
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 6.2;
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(25, 0);
  ctx.stroke();

  let shaftGrad = ctx.createLinearGradient(-21, -2.5, 25, 2.5);
  shaftGrad.addColorStop(0, isMono ? "#111111" : "#334155");
  shaftGrad.addColorStop(0.55, isMono ? "#444444" : "#94A3B8");
  shaftGrad.addColorStop(1, isMono ? "#222222" : "#F59E0B");
  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(25, 0);
  ctx.stroke();

  // Gold pommel cap
  ctx.fillStyle = isMono ? "#222222" : "#F59E0B";
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.lineTo(-19, -3.5);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-19, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold-wrapped grip collar & gauntlet hand
  ctx.fillStyle = isMono ? "#333333" : "#D97706";
  ctx.fillRect(-4, -2.8, 10, 5.6);
  drawHandGrip(ctx, 1, 0.5, "#0E7490", "#67E8F9", 4.3, isMono);

  // Swept crescent halberd wing blades behind dragon guard
  ctx.fillStyle = isMono ? "#111111" : "#0284C7";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
  ctx.lineWidth = 1.3;
  for (let s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(21, s * 2);
    ctx.quadraticCurveTo(16, s * 10.5, 27, s * 12.5);
    ctx.quadraticCurveTo(25, s * 6.5, 28, s * 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Sculpted Dragon-Maw Guard
  ctx.fillStyle = isMono ? "#333333" : "#F59E0B";
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(19, -5.5);
  ctx.lineTo(29, -7.2);
  ctx.lineTo(34, -3.2);
  ctx.lineTo(31, 0);
  ctx.lineTo(34, 3.2);
  ctx.lineTo(29, 7.2);
  ctx.lineTo(19, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Main Faceted Storm Spearhead
  let headGrad = ctx.createLinearGradient(29, -7, 56, 7);
  if (isMono) {
    headGrad.addColorStop(0, "#111111");
    headGrad.addColorStop(1, "#FFFFFF");
  } else {
    headGrad.addColorStop(0, isUlt ? "#FEF08A" : "#38BDF8");
    headGrad.addColorStop(0.55, "#E0F2FE");
    headGrad.addColorStop(1, "#FFFFFF");
  }
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = isMono ? "#000000" : isUlt ? "#F59E0B" : "#0284C7";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(29, -3.6);
  ctx.lineTo(37, -7.2);
  ctx.lineTo(56, 0);
  ctx.lineTo(37, 7.2);
  ctx.lineTo(29, 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Lightning Spine inside spearhead
  ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#FEF08A" : "#FFFFFF";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(52, 0);
  ctx.stroke();

  // Dragon-Maw Thunder Core + soft outer halo (no shadowBlur)
  let corePulse = 3.3 + Math.sin(t * 9) * 0.7 + flare * 1.5;
  let coreHalo = ctx.createRadialGradient(26, 0, 1, 26, 0, corePulse * 3.1);
  coreHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : isUlt ? "rgba(254, 240, 138, 0.85)" : "rgba(56, 189, 248, 0.75)");
  coreHalo.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = coreHalo;
  ctx.beginPath();
  ctx.arc(26, 0, corePulse * 3.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : isUlt ? "#FEF08A" : "#38BDF8";
  ctx.beginPath();
  ctx.arc(26, 0, corePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(26, 0, corePulse * 0.48, 0, Math.PI * 2);
  ctx.fill();

  // Engraved lightning runes along spearhead flanks
  ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#FEF08A" : "#BAE6FD";
  ctx.lineWidth = 1.1;
  for (let s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(33, s * 3.4);
    ctx.lineTo(39, s * 2.1);
    ctx.lineTo(42, s * 3.5);
    ctx.lineTo(47, s * 1.2);
    ctx.stroke();
  }

  // Dual spiraling lightning ribbons during Ult / Skill / Crit / Berserk
  if (flare > 0.1 || isUlt) {
    let a = clamp(Math.max(flare * 0.85, isUlt ? 0.78 : 0), 0, 1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = isMono ? "#000000" : isUlt || critBoost > 0.1 ? "#FEF08A" : "#67E8F9";
    ctx.lineWidth = isUlt ? 2.2 : 1.9;
    for (let s of [-1, 1]) {
      let ph = t * 16 + s * 1.7;
      ctx.beginPath();
      ctx.moveTo(22, s * 2);
      ctx.bezierCurveTo(32, s * (10 + Math.sin(ph) * 3.5), 42, -s * (7 + Math.cos(ph) * 2.5), 56, 0);
      ctx.stroke();
    }
    if (isUlt) {
      // Cerberus Phantom Fang Halberd Aura along spear tip
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
      ctx.lineWidth = 1.6;
      for (let s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(30, s * 6);
        ctx.quadraticCurveTo(44, s * 12, 60, s * 2.2);
        ctx.stroke();
      }
      ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(26, 0, 11.5, -0.9, 0.9);
      ctx.stroke();
    }
    if (critBoost > 0.1 || isUlt) {
      let starScale = Math.max(critBoost, isUlt ? 0.82 : 0);
      drawFourPointStar(ctx, 56, 0, 8.5 * starScale, 2.3 * starScale, "#FEF08A", "#FFFFFF");
    }
  }

  ctx.restore();
}

function drawTinBlades(ctx, p, t, state, isMono) {
  // Hư Không Song Đao — Void-Rift Twin Blades with Ma Thạch Resonance Veins
  let atkProg = state.atkProg;
  let hasAtk = state.hasAtk;
  let parity = state.parity;
  let resStacks = clamp(p.tin_resonance_stacks || 0, 0, 4);
  let empowered = Boolean(p.tin_empowered);
  let resRatio = resStacks / 4;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.9 + resRatio * 0.35 + (empowered ? 0.45 : 0), 0, 1.5);
  let idleWave = Math.sin(t * 4.5) * 0.05;
  let walkSweep = state.moveAmt * 0.24;

  for (let side of [-1, 1]) {
    ctx.save();
    let swing = 0;
    let lunge = 0;
    if (hasAtk) {
      let s = Math.sin(atkProg * Math.PI);
      if (side === parity || state.skillAlpha > 0.2) {
        swing = -side * (-0.35 + atkProg * 1.55);
        lunge = s * 8;
      } else {
        swing = side * s * 0.25;
        lunge = s * 3;
      }
    }
    // Hand anchor cleanly outside hero circle (radius 22)
    let anchorX = 11 + lunge;
    let anchorY = side * 17;
    ctx.translate(anchorX, anchorY);
    ctx.rotate(side * (0.34 + idleWave - walkSweep) + swing);

    // Subtle void trail during swing / skill / overdrive
    if (hasAtk || flare > 0.2) {
      ctx.globalAlpha = clamp(0.45 + flare * 0.4, 0, 0.92);
      ctx.strokeStyle = isMono ? "#000000" : empowered ? "#FB7185" : "#F43F5E";
      ctx.lineWidth = empowered ? 3.8 : 3.2;
      ctx.beginPath();
      ctx.moveTo(2, side * 1.5);
      ctx.quadraticCurveTo(18, -side * 7, 34, side * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Hilt + Pommel spike
    ctx.fillStyle = isMono ? "#111111" : "#1E1B4B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-4, -2.5);
    ctx.lineTo(4, -2);
    ctx.lineTo(4, 2);
    ctx.lineTo(-4, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jagged Void Crossguard
    ctx.fillStyle = isMono ? "#333333" : "#9F1239";
    ctx.strokeStyle = "#070B14";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(2, -7.5);
    ctx.lineTo(8, -3.5);
    ctx.lineTo(9, 0);
    ctx.lineTo(8, 3.5);
    ctx.lineTo(2, 7.5);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sculpted Curved Void Blade (obsidian spine + luminous crimson-obsidian Ma Thạch veins)
    let bladeGrad = ctx.createLinearGradient(6, 0, 36, 0);
    if (isMono) {
      bladeGrad.addColorStop(0, "#111111");
      bladeGrad.addColorStop(0.6, "#666666");
      bladeGrad.addColorStop(1, "#FFFFFF");
    } else if (empowered) {
      bladeGrad.addColorStop(0, "#1E0922");
      bladeGrad.addColorStop(0.38, "#BE123C");
      bladeGrad.addColorStop(0.75, "#FB7185");
      bladeGrad.addColorStop(1, "#FFF1F2");
    } else {
      bladeGrad.addColorStop(0, "#31102F");
      bladeGrad.addColorStop(0.45, "#E11D48");
      bladeGrad.addColorStop(1, "#FFE4E6");
    }
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = isMono ? "#000000" : empowered ? "#FFF1F2" : "#FDA4AF";
    ctx.lineWidth = empowered ? 1.7 : 1.4;
    ctx.beginPath();
    ctx.moveTo(6, -side * 2.2);
    ctx.quadraticCurveTo(20, -side * 6.5, 36, side * 1.5);
    ctx.quadraticCurveTo(22, side * 3.8, 12, side * 2.6);
    ctx.lineTo(10, side * 4.4);
    ctx.lineTo(6, side * 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing spatial-tear edge highlight
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FFF1F2";
    ctx.lineWidth = 1.4 + resRatio * 0.5;
    ctx.beginPath();
    ctx.moveTo(10, -side * 3.2);
    ctx.quadraticCurveTo(22, -side * 5.6, 35, side * 1.3);
    ctx.stroke();

    // Void crystal in guard + spatial-rift rune glow scaling with resonance stacks
    let gemHalo = ctx.createRadialGradient(6, 0, 0.5, 6, 0, 7 + flare * 3);
    gemHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : empowered ? "rgba(255, 228, 230, 0.9)" : "rgba(251, 113, 133, 0.78)");
    gemHalo.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = gemHalo;
    ctx.beginPath();
    ctx.arc(6, 0, 7 + flare * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : empowered ? "#FFF1F2" : "#FB7185";
    ctx.beginPath();
    ctx.arc(6, 0, 2.4 + flare * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Engraved crimson-obsidian Ma Thạch vein sigils along blade spine
    ctx.strokeStyle = isMono ? "#FFFFFF" : empowered ? "#FFFFFF" : resStacks > 0 ? "#FB7185" : "#FDA4AF";
    ctx.lineWidth = 1.1 + resRatio * 0.7;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(18, -side * 1.6);
    ctx.lineTo(23, 0);
    ctx.lineTo(28, -side * 1.3);
    if (resStacks >= 2 || empowered) {
      ctx.lineTo(33, 0);
    }
    ctx.stroke();

    // Flowing dark-rose mist ribbon trailing from pommel
    let mistW = Math.sin(t * 11 + side * 2) * 3.2;
    ctx.strokeStyle = isMono ? "#333333" : empowered ? "rgba(251, 113, 133, 0.88)" : "rgba(244, 63, 94, 0.72)";
    ctx.lineWidth = empowered ? 2.1 : 1.6;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.quadraticCurveTo(-15, mistW, -21, -mistW * 0.7);
    ctx.stroke();

    drawHandGrip(ctx, -1, 0, "#4C0519", "#FB7185", 3.8, isMono);
    if (state.critAlpha > 0.15 || flare > 0.45) {
      let sc = Math.max(state.critAlpha, flare * 0.65);
      drawFourPointStar(ctx, 35, side * 1.3, 6.5 * sc, 1.8 * sc, "#FEF08A", "#FFFFFF");
    }
    ctx.restore();
  }
}

function drawKinBow(ctx, p, t, state, isMono) {
  // Cung Thần Cuồng Phong — Gale Sovereign Bow
  let drawAmt = state.hasAtk ? Math.sin(clamp(state.atkProg * 1.15, 0, 1) * Math.PI) : 0;
  let recoil = state.bowRecoil > 0 ? Math.sin(state.bowRecoil * 48) * state.bowRecoil * 5 : 0;
  let isEmpowered = p.kin_c2_lifestealTimer > 0 || p.kin_passive >= 3;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (isEmpowered ? 0.45 : 0), 0, 1.2);
  let idleBob = Math.sin(t * 3.8) * 1.2;
  let walkTilt = state.moveAmt * Math.sin(state.walkPhase) * 0.06;

  ctx.save();
  ctx.translate(15 - drawAmt * 2 + recoil * 0.35, idleBob);
  ctx.rotate(walkTilt);

  // Subtle spinning gale sigil behind riser when C2 lifesteal / passive ready
  if (flare > 0.2) {
    ctx.save();
    ctx.translate(8, 0);
    ctx.rotate(t * 5);
    ctx.globalAlpha = clamp(flare * 0.7, 0, 0.85);
    ctx.strokeStyle = isMono ? "#000000" : "#6EE7B7";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 12 + flare * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // String tip positions (flex slightly backward on draw)
  let tipX = 4 - drawAmt * 3.2;
  let tipY = 25 - drawAmt * 1.5;
  let nockX = tipX - 5 - drawAmt * 13 + recoil;

  // Bowstring (glows emerald-gold when drawn)
  ctx.strokeStyle = isMono ? "#000000" : drawAmt > 0.15 ? "#FEF08A" : "#A7F3D0";
  ctx.lineWidth = drawAmt > 0.15 ? 2.1 : 1.4;
  ctx.beginPath();
  ctx.moveTo(tipX, -tipY);
  ctx.lineTo(nockX, 0);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Compound Recurve Limbs (upper & lower sculpted jade-gold wings)
  for (let s of [-1, 1]) {
    // Dark rim outline
    ctx.strokeStyle = "#070B14";
    ctx.lineWidth = 6.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(11, s * 5);
    ctx.bezierCurveTo(19, s * 11, 16, s * 19, tipX, s * tipY);
    ctx.stroke();

    // Emerald-jade inner limb
    let limbGrad = ctx.createLinearGradient(10, 0, 4, s * tipY);
    limbGrad.addColorStop(0, isMono ? "#222222" : "#047857");
    limbGrad.addColorStop(0.6, isMono ? "#555555" : "#10B981");
    limbGrad.addColorStop(1, isMono ? "#FFFFFF" : "#A7F3D0");
    ctx.strokeStyle = limbGrad;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(11, s * 5);
    ctx.bezierCurveTo(19, s * 11, 16, s * 19, tipX, s * tipY);
    ctx.stroke();

    // Gold inner filigree accent + aerodynamic wind-fin tip
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, s * 7);
    ctx.quadraticCurveTo(16, s * 14, tipX + 2, s * (tipY - 4));
    ctx.stroke();

    // Wing-shaped tip ornament + flowing emerald wind-stream ribbon
    ctx.fillStyle = isMono ? "#333333" : "#F59E0B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(tipX, s * tipY);
    ctx.lineTo(tipX - 5, s * (tipY + 4.5));
    ctx.lineTo(tipX + 4, s * (tipY + 1.5));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    let wWave = Math.sin(t * 13 + s * 1.6) * (2.6 + state.moveAmt * 2.5);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(110, 231, 183, 0.78)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX - 3, s * (tipY + 3));
    ctx.quadraticCurveTo(tipX - 10, s * (tipY + 4) + wWave, tipX - 17 - flare * 4, s * (tipY + 1) - wWave * 0.6);
    ctx.stroke();
  }

  // Sculpted Riser / Grip Guard + Gale Wing Fins + Emerald Wind Jewel Core
  ctx.fillStyle = isMono ? "#222222" : "#065F46";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(8, -7);
  ctx.lineTo(15, -4);
  ctx.lineTo(18, 0);
  ctx.lineTo(15, 4);
  ctx.lineTo(8, 7);
  ctx.lineTo(10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pulsing emerald core + soft wind halo
  let jewelR = 3.2 + Math.sin(t * 8) * 0.5 + flare * 1.2;
  let jHalo = ctx.createRadialGradient(13.5, 0, 0.5, 13.5, 0, jewelR * 3);
  jHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : "rgba(52, 211, 153, 0.8)");
  jHalo.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = jHalo;
  ctx.beginPath();
  ctx.arc(13.5, 0, jewelR * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : "#34D399";
  ctx.beginPath();
  ctx.arc(13.5, 0, jewelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(13.5, 0, jewelR * 0.45, 0, Math.PI * 2);
  ctx.fill();

  drawHandGrip(ctx, 10, 0, "#047857", "#6EE7B7", 4.1, isMono);

  // Nocked Energy Wind Arrow (visible when drawing or resting with wind-passive ready)
  if (drawAmt > 0.12 || isEmpowered) {
    let arrowAlpha = drawAmt > 0.12 ? clamp(drawAmt * 1.4, 0.3, 1) : 0.72;
    let axStart = drawAmt > 0.12 ? nockX : 2;
    let axTip = axStart + 29;
    ctx.save();
    ctx.globalAlpha = arrowAlpha;
    // Arrow shaft
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#ECFDF5";
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(axStart, 0);
    ctx.lineTo(axTip - 6, 0);
    ctx.stroke();
    // Fletching
    ctx.fillStyle = isMono ? "#000000" : "#10B981";
    ctx.beginPath();
    ctx.moveTo(axStart + 4, 0);
    ctx.lineTo(axStart - 3, -3.5);
    ctx.lineTo(axStart + 1, 0);
    ctx.lineTo(axStart - 3, 3.5);
    ctx.closePath();
    ctx.fill();
    // Sculpted jade-gold broadhead
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(axTip + 4, 0);
    ctx.lineTo(axTip - 6, -4.5);
    ctx.lineTo(axTip - 4, 0);
    ctx.lineTo(axTip - 6, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (state.critAlpha > 0.15) {
    drawFourPointStar(ctx, 20, 0, 7 * state.critAlpha, 2 * state.critAlpha, "#FEF08A", "#FFFFFF");
  }
  ctx.restore();
}

function drawTrungOrb(ctx, p, t, state, isMono) {
  // Cầu Ma Pháp Vũ Trụ — Celestial Astrolabe Magic Orb
  let hasAtk = state.hasAtk;
  let atkSurge = hasAtk ? Math.sin(state.atkProg * Math.PI) * 9 : 0;
  let orbActive = p.trung_orbs && p.trung_orbs.active;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (orbActive ? 0.55 : 0), 0, 1.3);
  let floatX = Math.cos(t * 2.6) * 1.3;
  let floatY = Math.sin(t * 3.8) * 2.4 - state.moveAmt * 1.5;

  // Caster hand sigil ring
  drawHandGrip(ctx, 21 + atkSurge * 0.3, 6, "#3730A3", "#A5B4FC", 3.9, isMono);

  ctx.save();
  ctx.translate(31 + atkSurge + floatX, floatY);

  // Expanding Arcane Magic Circle on Skill Cast / C2 Active
  if (flare > 0.15) {
    ctx.save();
    ctx.rotate(t * 4.5);
    ctx.globalAlpha = clamp(flare * 0.78, 0, 0.9);
    let sigR = 14.5 + flare * 5;
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, sigR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      let ang = (Math.PI / 3) * i;
      let px = Math.cos(ang) * sigR;
      let py = Math.sin(ang) * sigR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = isMono ? "#444444" : "#818CF8";
    ctx.stroke();
    ctx.restore();
  }

  // Outer rotating astrolabe ring (tilted ellipse 1)
  ctx.save();
  ctx.rotate(t * (2.2 + flare * 3));
  ctx.scale(1, 0.58);
  ctx.strokeStyle = isMono ? "#000000" : "#A5B4FC";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner counter-rotating gold rune ring (tilted ellipse 2)
  ctx.save();
  ctx.rotate(-t * (2.9 + flare * 3.5) + 0.9);
  ctx.scale(0.62, 1);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Luminous Cosmic Orb Sphere + soft radial aura
  let coreR = 8.4 + Math.sin(t * 7) * 0.6 + flare * 1.4;
  let orbAura = ctx.createRadialGradient(0, 0, coreR * 0.5, 0, 0, coreR * 2.5);
  orbAura.addColorStop(0, isMono ? "rgba(255,255,255,0.55)" : "rgba(129, 140, 248, 0.6)");
  orbAura.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(253, 224, 71, 0.22)");
  orbAura.addColorStop(1, "rgba(99, 102, 241, 0)");
  ctx.fillStyle = orbAura;
  ctx.beginPath();
  ctx.arc(0, 0, coreR * 2.5, 0, Math.PI * 2);
  ctx.fill();

  let orbGrad = ctx.createRadialGradient(-2.2, -2.2, 1, 0, 0, coreR);
  if (isMono) {
    orbGrad.addColorStop(0, "#FFFFFF");
    orbGrad.addColorStop(0.55, "#444444");
    orbGrad.addColorStop(1, "#000000");
  } else {
    orbGrad.addColorStop(0, "#FFFFFF");
    orbGrad.addColorStop(0.32, "#E0E7FF");
    orbGrad.addColorStop(0.72, "#6366F1");
    orbGrad.addColorStop(1, "#312E81");
  }
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fillStyle = orbGrad;
  ctx.fill();
  ctx.strokeStyle = isMono ? "#000000" : "#C7D2FE";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Rotating Starburst core inside the orb
  ctx.save();
  ctx.rotate(t * 1.6);
  drawFourPointStar(ctx, 0, 0, 5.6 + flare * 2, 1.7, "#FFFFFF", isMono ? "#000000" : "#FDE047");
  ctx.restore();

  // 3 Orbiting Celestial Shards with short comet tails
  for (let i = 0; i < 3; i++) {
    let ang = t * (3.8 + flare * 2.5) + (Math.PI * 2 / 3) * i;
    let rOrb = 13.6 + flare * 2.2;
    let ox = Math.cos(ang) * rOrb;
    let oy = Math.sin(ang) * rOrb;
    let tx = Math.cos(ang - 0.42) * rOrb;
    let ty = Math.sin(ang - 0.42) * rOrb;
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.4)" : i === 0 ? "rgba(253, 224, 71, 0.55)" : "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#000000" : i === 0 ? "#FDE047" : "#38BDF8";
    ctx.beginPath();
    ctx.arc(ox, oy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEohyenBlade(ctx, p, t, state, isMono) {
  // Băng Nguyệt Kiếm — Frost Crescent Runeblade
  let hasAtk = state.hasAtk;
  let atkProg = state.atkProg;
  let parity = state.parity;
  let isEmpowered = p.eohyen_passive >= 3;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (isEmpowered ? 0.4 : 0), 0, 1.2);
  let idleBob = Math.sin(t * 3.2) * 1.2;
  let walkTilt = state.moveAmt * (-0.18 + Math.sin(state.walkPhase) * 0.06);

  let swAngle = hasAtk ? (-0.95 + 1.9 * clamp(atkProg * 1.15, 0, 1)) * parity : -0.22;

  ctx.save();
  if (hasAtk) {
    drawTaperedArc(
      ctx,
      0,
      0,
      36,
      -0.95 * parity,
      swAngle,
      8 * (1 - atkProg * 0.6),
      "rgba(56, 189, 248, 0.55)",
      "#E0F2FE",
      isMono
    );
  }

  // Pivot around front-right shoulder grip so blade never cuts through body
  ctx.translate(10, 14 + idleBob);
  ctx.rotate(swAngle + walkTilt);

  // Frost ribbon tassel at pommel
  let tailW = Math.sin(t * 9 + state.walkPhase) * 3.5;
  ctx.strokeStyle = isMono ? "#000000" : "#7DD3FC";
  ctx.lineWidth = 1.9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-18, tailW, -25, -tailW * 0.7);
  ctx.stroke();

  // Silver-cobalt hilt
  ctx.fillStyle = isMono ? "#111111" : "#1E293B";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
  ctx.lineWidth = 1.2;
  ctx.fillRect(-10, -2, 12, 4);
  ctx.strokeRect(-10, -2, 12, 4);

  // Crescent Frost-Lotus Crossguard
  ctx.fillStyle = isMono ? "#333333" : "#0284C7";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#E0F2FE";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(6, -5, 5, 0);
  ctx.quadraticCurveTo(6, 5, 0, 8);
  ctx.quadraticCurveTo(2, 0, 0, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Faceted Crystal Ice Blade (slightly curved katana/runeblade profile)
  let iceGrad = ctx.createLinearGradient(4, -4, 46, 4);
  if (isMono) {
    iceGrad.addColorStop(0, "#222222");
    iceGrad.addColorStop(0.55, "#888888");
    iceGrad.addColorStop(1, "#FFFFFF");
  } else {
    iceGrad.addColorStop(0, "#0369A1");
    iceGrad.addColorStop(0.5, "#38BDF8");
    iceGrad.addColorStop(0.88, "#BAE6FD");
    iceGrad.addColorStop(1, "#FFFFFF");
  }
  ctx.fillStyle = iceGrad;
  ctx.strokeStyle = isMono ? "#000000" : "#E0F2FE";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, -2.5);
  ctx.quadraticCurveTo(24, -4.2, 46, -0.5);
  ctx.lineTo(39, 3.6);
  ctx.quadraticCurveTo(20, 2.8, 4, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Razor frost spine, engraved glacial runes & diamond ice gem
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(6, -1.6);
  ctx.quadraticCurveTo(25, -3.1, 44, -0.5);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(224, 242, 254, 0.85)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(11, 0.4);
  ctx.lineTo(16, -0.8);
  ctx.lineTo(22, 0.6);
  ctx.lineTo(28, -0.6);
  ctx.stroke();

  let gemHalo = ctx.createRadialGradient(3, 0, 0.5, 3, 0, 7.5 + flare * 2.5);
  gemHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : "rgba(186, 230, 253, 0.78)");
  gemHalo.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = gemHalo;
  ctx.beginPath();
  ctx.arc(3, 0, 7.5 + flare * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : "#E0F2FE";
  ctx.beginPath();
  ctx.moveTo(3, -3.5);
  ctx.lineTo(6.6, 0);
  ctx.lineTo(3, 3.5);
  ctx.lineTo(-0.6, 0);
  ctx.closePath();
  ctx.fill();

  drawHandGrip(ctx, -4, 0.5, "#0369A1", "#BAE6FD", 3.9, isMono);

  // Drifting frost crystal diamonds around blade tip
  let moteAng = t * 4;
  for (let i = 0; i < 3; i++) {
    let mx = 22 + i * 9 + Math.cos(moteAng + i * 2) * 3;
    let my = Math.sin(moteAng * 1.3 + i * 2.4) * (4.5 + flare * 3);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(t * 2 + i);
    ctx.fillStyle = isMono ? "#000000" : "#E0F2FE";
    ctx.fillRect(-1.5, -1.5, 3, 3);
    ctx.restore();
  }
  if (flare > 0.25) {
    drawFourPointStar(ctx, 44, -0.5, 6 + flare * 2.5, 1.8, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
  }
  ctx.restore();
}

function drawLonghoiBow(ctx, p, t, state, isMono) {
  // Hồ Hỏa Cung — Nine-Tails Spirit Flame Bow
  let drawAmt = state.hasAtk ? Math.sin(clamp(state.atkProg * 1.15, 0, 1) * Math.PI) : 0;
  let recoil = state.bowRecoil > 0 ? Math.sin(state.bowRecoil * 48) * state.bowRecoil * 5 : 0;
  let hasBonus = p.longhoi_nextAtkBonus > 0 || p.longhoi_msBuffTimer > 0;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (hasBonus ? 0.5 : 0), 0, 1.25);
  let idleBob = Math.sin(t * 4) * 1.2;
  let walkTilt = state.moveAmt * Math.sin(state.walkPhase) * 0.06;

  ctx.save();
  ctx.translate(15 - drawAmt * 2 + recoil * 0.35, idleBob);
  ctx.rotate(walkTilt);

  let tipX = 3 - drawAmt * 3;
  let tipY = 26 - drawAmt * 1.6;
  let nockX = tipX - 5 - drawAmt * 13 + recoil;

  // Fiery golden-ember bowstring
  ctx.strokeStyle = isMono ? "#000000" : drawAmt > 0.15 ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = drawAmt > 0.15 ? 2.2 : 1.4;
  ctx.beginPath();
  ctx.moveTo(tipX, -tipY);
  ctx.lineTo(nockX, 0);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Fox-Tail Flame Limbs
  for (let s of [-1, 1]) {
    ctx.strokeStyle = "#070B14";
    ctx.lineWidth = 6.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(12, s * 5);
    ctx.bezierCurveTo(22, s * 10, 19, s * 21, tipX, s * tipY);
    ctx.stroke();

    let fGrad = ctx.createLinearGradient(12, 0, 2, s * tipY);
    fGrad.addColorStop(0, isMono ? "#222222" : "#9A3412");
    fGrad.addColorStop(0.5, isMono ? "#666666" : "#EA580C");
    fGrad.addColorStop(1, isMono ? "#FFFFFF" : "#FEF08A");
    ctx.strokeStyle = fGrad;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(12, s * 5);
    ctx.bezierCurveTo(22, s * 10, 19, s * 21, tipX, s * tipY);
    ctx.stroke();

    // Dual-layered flickering fox-fire flame plumes at bow limb tips
    let flick = Math.sin(t * 16 + s * 2.1) * 2.6;
    ctx.fillStyle = isMono ? "#111111" : "#F97316";
    ctx.beginPath();
    ctx.moveTo(tipX, s * tipY);
    ctx.quadraticCurveTo(tipX - 6, s * (tipY + 5.5) + flick, tipX - 12 - flare * 4.5, s * (tipY + 2));
    ctx.quadraticCurveTo(tipX - 3, s * (tipY - 2), tipX, s * tipY);
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.beginPath();
    ctx.moveTo(tipX, s * tipY);
    ctx.quadraticCurveTo(tipX - 4, s * (tipY + 3) + flick * 0.6, tipX - 7.5 - flare * 2, s * (tipY + 1));
    ctx.quadraticCurveTo(tipX - 2, s * (tipY - 1), tipX, s * tipY);
    ctx.fill();
  }

  // Fox-Crest Riser Guard + Ember Jewel + Radial Solar Halo
  ctx.fillStyle = isMono ? "#222222" : "#7C2D12";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(9, -8);
  ctx.lineTo(17, -4);
  ctx.lineTo(20, 0);
  ctx.lineTo(17, 4);
  ctx.lineTo(9, 8);
  ctx.lineTo(11.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  let coreR = 3.4 + Math.sin(t * 10) * 0.6 + flare * 1.2;
  let coreGlow = ctx.createRadialGradient(15, 0, 0.5, 15, 0, coreR * 3.2);
  coreGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : "rgba(254, 240, 138, 0.8)");
  coreGlow.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(249, 115, 22, 0.35)");
  coreGlow.addColorStop(1, "rgba(234, 88, 12, 0)");
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(15, 0, coreR * 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
  ctx.beginPath();
  ctx.arc(15, 0, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(15, 0, coreR * 0.52, 0, Math.PI * 2);
  ctx.fill();

  drawHandGrip(ctx, 11, 0, "#9A3412", "#FDBA74", 4.1, isMono);

  // Nocked Blazing Fox-Fire Arrow
  if (drawAmt > 0.12 || hasBonus) {
    let alpha = drawAmt > 0.12 ? clamp(drawAmt * 1.4, 0.35, 1) : 0.78;
    let axStart = drawAmt > 0.12 ? nockX : 2;
    let axTip = axStart + 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(axStart, 0);
    ctx.lineTo(axTip - 6, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#000000" : "#EF4444";
    ctx.beginPath();
    ctx.moveTo(axStart + 5, 0);
    ctx.lineTo(axStart - 4, -4);
    ctx.lineTo(axStart + 1, 0);
    ctx.lineTo(axStart - 4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : "#EA580C";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(axTip + 5, 0);
    ctx.lineTo(axTip - 6, -4.8);
    ctx.lineTo(axTip - 3, 0);
    ctx.lineTo(axTip - 6, 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (state.critAlpha > 0.15) {
    drawFourPointStar(ctx, 21, 0, 7 * state.critAlpha, 2 * state.critAlpha, "#FEF08A", "#EA580C");
  }
  ctx.restore();
}

function drawDuccongStaffOrb(ctx, p, t, state, isMono) {
  // Trượng Hố Đen Tinh Vân — Nebula Singularity Scepter & Black-Hole Orb
  let hasAtk = state.hasAtk;
  let atkSurge = hasAtk ? Math.sin(state.atkProg * Math.PI) * 10 : 0;
  let isChargedPassive = p.duccong_passive >= 2;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (isChargedPassive ? 0.4 : 0), 0, 1.3);
  let idleBob = Math.sin(t * 3.1) * 1.5;
  let walkTilt = state.moveAmt * Math.sin(state.walkPhase) * 0.08;

  ctx.save();
  ctx.translate(atkSurge, 13 + idleBob);
  ctx.rotate(-0.18 + walkTilt);

  // Scepter shaft
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 5.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();

  let rodGrad = ctx.createLinearGradient(-10, 0, 22, 0);
  rodGrad.addColorStop(0, isMono ? "#111111" : "#3B0764");
  rodGrad.addColorStop(0.65, isMono ? "#555555" : "#7C3AED");
  rodGrad.addColorStop(1, isMono ? "#FFFFFF" : "#C084FC");
  ctx.strokeStyle = rodGrad;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();

  // Gold-amethyst twin crescent cradle at scepter crown
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.arc(27, 0, 10.5, Math.PI * 0.58, Math.PI * 1.42);
  ctx.stroke();

  drawHandGrip(ctx, 4, 0, "#581C87", "#E9D5FF", 4, isMono);

  // Hovering Black-Hole Singularity Orb at crown
  ctx.translate(31, 0);

  if (flare > 0.15) {
    ctx.save();
    ctx.rotate(-t * 5);
    ctx.globalAlpha = clamp(flare * 0.8, 0, 0.9);
    ctx.strokeStyle = isMono ? "#000000" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 15.5 + flare * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Tilted Violet-Cyan Accretion Disk
  ctx.save();
  ctx.rotate(t * (2.6 + flare * 2.5));
  ctx.scale(1.15, 0.48);
  ctx.strokeStyle = isMono ? "#000000" : "#38BDF8";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F472B6";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Event Horizon Singularity Sphere + gravitational lensing halo
  let coreR = 7.2 + Math.sin(t * 7) * 0.4 + flare * 1.2;
  let lensHalo = ctx.createRadialGradient(0, 0, coreR * 0.7, 0, 0, coreR * 2.6);
  lensHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(192, 132, 252, 0.7)");
  lensHalo.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(56, 189, 248, 0.3)");
  lensHalo.addColorStop(1, "rgba(124, 58, 237, 0)");
  ctx.fillStyle = lensHalo;
  ctx.beginPath();
  ctx.arc(0, 0, coreR * 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "#000000" : "#090418";
  ctx.fill();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner photon arc
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, coreR - 2, -0.7 + t * 2, 1.3 + t * 2);
  ctx.stroke();

  // Orbiting star shards with warp streaks
  for (let i = 0; i < 3; i++) {
    let ang = -t * 4.2 + (Math.PI * 2 / 3) * i;
    let ox = Math.cos(ang) * 12.5;
    let oy = Math.sin(ang) * 12.5;
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.45)" : i === 0 ? "rgba(103, 232, 249, 0.6)" : "rgba(244, 114, 182, 0.6)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang + 0.35) * 12.5, Math.sin(ang + 0.35) * 12.5);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#000000" : i === 0 ? "#67E8F9" : "#F472B6";
    ctx.beginPath();
    ctx.arc(ox, oy, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.critAlpha > 0.15) {
    drawFourPointStar(ctx, 0, 0, 8 * state.critAlpha, 2.2 * state.critAlpha, "#E9D5FF", "#38BDF8");
  }
  ctx.restore();
}

function drawGauGauntlets(ctx, p, t, state, isMono) {
  // Quyền Giáp Thiết Hùng — Iron-Bear Molten Gauntlets
  let isRage = p.gau_cuongHungTimer > 0;
  let isGuard = p.gau_c2_guardTimer > 0;
  let gDur = Math.max(0.05, p.gau_animDur || 0.22);
  let hasGauAnim = p.gau_animTimer > 0;
  let gProg = hasGauAnim ? 1 - p.gau_animTimer / gDur : state.hasAtk ? state.atkProg : 0;
  let punchArc = hasGauAnim || state.hasAtk ? Math.sin(clamp(gProg, 0, 1) * Math.PI) : 0;
  let activeLead = p.gau_basicStep % 2 === 1 ? -1 : 1;
  let bothSlam = p.gau_animKind === "c1_2" || p.gau_animKind === "c2_slam";
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (isRage ? 0.65 : 0), 0, 1.3);

  for (let side of [-1, 1]) {
    ctx.save();
    let isLead = bothSlam || side === activeLead;
    let punchExt = isLead ? punchArc * 17 : -punchArc * 3;
    let walkBob = state.moveAmt * Math.sin(state.walkPhase + (side > 0 ? 0 : Math.PI)) * 3.5;
    let idleBob = Math.sin(t * 4.2 + side) * 1.1;

    // During C2 guard, cross gauntlets forward in shield wall brace
    let gx = isGuard ? 22 : 19 + punchExt + walkBob;
    let gy = isGuard ? side * 9.5 : side * 17 + idleBob;
    let rot = isGuard ? -side * 0.35 : isLead && punchArc > 0.1 ? -side * 0.12 * punchArc : side * 0.08;
    let sc = isLead && punchArc > 0.15 ? 1 + punchArc * 0.16 : 1;

    ctx.translate(gx, gy);
    ctx.rotate(rot);
    ctx.scale(sc, sc);

    // Armored Forearm Cuff + Bronze Shoulder Plate
    ctx.fillStyle = isMono ? "#111111" : "#451A03";
    ctx.strokeStyle = isMono ? "#FFFFFF" : isRage ? "#FDE047" : "#D97706";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-10, -6.5);
    ctx.lineTo(1, -8);
    ctx.lineTo(3, 8);
    ctx.lineTo(-10, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy Armored Bear-Fist Housing
    let fistGrad = ctx.createLinearGradient(-2, -9, 12, 9);
    if (isMono) {
      fistGrad.addColorStop(0, "#222222");
      fistGrad.addColorStop(1, "#CCCCCC");
    } else if (isRage) {
      fistGrad.addColorStop(0, "#EA580C");
      fistGrad.addColorStop(0.55, "#F59E0B");
      fistGrad.addColorStop(1, "#FEF08A");
    } else {
      fistGrad.addColorStop(0, "#78350F");
      fistGrad.addColorStop(0.55, "#B45309");
      fistGrad.addColorStop(1, "#F59E0B");
    }
    ctx.fillStyle = fistGrad;
    ctx.strokeStyle = "#070B14";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(0, -8.5);
    ctx.lineTo(9, -7.5);
    ctx.lineTo(12.5, 0);
    ctx.lineTo(9, 7.5);
    ctx.lineTo(0, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3 Steel-Molten Bear Claw Knuckle Spikes
    for (let k of [-4.6, 0, 4.6]) {
      ctx.fillStyle = isMono ? "#FFFFFF" : isRage || flare > 0.35 ? "#FEF08A" : "#E2E8F0";
      ctx.strokeStyle = "#070B14";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10.5, k - 1.8);
      ctx.lineTo(16.5 + (k === 0 ? 2 : 0), k);
      ctx.lineTo(10.5, k + 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Molten Magma Core Vent on Knuckle Bridge + seismic halo
    let ventR = 2.9 + flare * 1.1;
    let ventGlow = ctx.createRadialGradient(5, 0, 0.5, 5, 0, ventR * 3);
    ventGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : isRage ? "rgba(254, 240, 138, 0.85)" : "rgba(249, 115, 22, 0.7)");
    ventGlow.addColorStop(1, "rgba(234, 88, 12, 0)");
    ctx.fillStyle = ventGlow;
    ctx.beginPath();
    ctx.arc(5, 0, ventR * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : isRage || flare > 0.2 ? "#FEF08A" : "#F97316";
    ctx.beginPath();
    ctx.arc(5, 0, ventR, 0, Math.PI * 2);
    ctx.fill();

    // Rage magma flame arcs flaring off gauntlets during C3 Cuồng Hùng
    if (isRage) {
      let fLen = 8 + Math.sin(t * 18 + side) * 2.5;
      ctx.fillStyle = isMono ? "#FFFFFF" : "rgba(251, 146, 60, 0.72)";
      ctx.beginPath();
      ctx.moveTo(2, -side * 8);
      ctx.quadraticCurveTo(-5, -side * (12 + fLen * 0.4), -10 - fLen, -side * 5);
      ctx.quadraticCurveTo(-3, -side * 4, 2, -side * 8);
      ctx.fill();
    }

    if (isLead && state.critAlpha > 0.15) {
      drawFourPointStar(ctx, 17, 0, 7 * state.critAlpha, 2 * state.critAlpha, "#FEF08A", "#EA580C");
    }
    ctx.restore();
  }
}

export function drawBaoDagger(ctx, side, isStealth, flare, critAlpha, isMono) {
  // Shared high-craft Lunar Crescent Dagger (used by Bao AND his Shadow Clones!)
  // Hilt with ring pommel
  ctx.fillStyle = isMono ? "#111111" : "#2E1065";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
  ctx.lineWidth = 1.2;
  ctx.fillRect(-9, -1.8, 11, 3.6);
  ctx.strokeRect(-9, -1.8, 11, 3.6);

  ctx.beginPath();
  ctx.arc(-11, 0, 2.6, 0, Math.PI * 2);
  ctx.stroke();

  // Crescent Moon Guard
  ctx.fillStyle = isMono ? "#333333" : "#6B21A8";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F5D0FE";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1, -6.5);
  ctx.quadraticCurveTo(6.5, -3.5, 5.5, 0);
  ctx.quadraticCurveTo(6.5, 3.5, 1, 6.5);
  ctx.quadraticCurveTo(3, 0, 1, -6.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Curved Amethyst Lunar Blade
  let dGrad = ctx.createLinearGradient(4, 0, 31, 0);
  if (isMono) {
    dGrad.addColorStop(0, "#111111");
    dGrad.addColorStop(0.6, "#666666");
    dGrad.addColorStop(1, "#FFFFFF");
  } else {
    dGrad.addColorStop(0, "#3B0764");
    dGrad.addColorStop(0.55, "#A855F7");
    dGrad.addColorStop(1, "#F5D0FE");
  }
  ctx.fillStyle = dGrad;
  ctx.strokeStyle = isMono ? "#000000" : isStealth ? "#F5D0FE" : "#E879F9";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(4, -side * 1.8);
  ctx.quadraticCurveTo(17, -side * 5.8, 31, side * 1.2);
  ctx.quadraticCurveTo(18, side * 3.4, 5, side * 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bright lunar inner edge + engraved amethyst shadow runes
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8, -side * 2.6);
  ctx.quadraticCurveTo(19, -side * 4.8, 30, side * 1.1);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F5D0FE";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(15, -side * 1.2);
  ctx.lineTo(20, side * 0.6);
  ctx.stroke();

  // Moonstone jewel with soft purple-pink halo
  let mHalo = ctx.createRadialGradient(4.2, 0, 0.4, 4.2, 0, 6.8 + flare * 2.5);
  mHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : "rgba(232, 121, 249, 0.8)");
  mHalo.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = mHalo;
  ctx.beginPath();
  ctx.arc(4.2, 0, 6.8 + flare * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : "#E879F9";
  ctx.beginPath();
  ctx.arc(4.2, 0, 2.1 + flare * 0.7, 0, Math.PI * 2);
  ctx.fill();

  drawHandGrip(ctx, -2, 0, "#581C87", "#E879F9", 3.6, isMono);
  if (critAlpha > 0.15 || isStealth) {
    let sc = Math.max(critAlpha, isStealth ? 0.65 : 0);
    drawFourPointStar(ctx, 30, side * 1.1, 6 * sc, 1.7 * sc, "#F5D0FE", "#FFFFFF");
  }
}

function drawBaoDaggers(ctx, p, t, state, isMono) {
  // Song Đao Nguyệt Ảnh — Shadow-Moon Twin Daggers
  let dir = p.bao_basicDir || 1;
  let hasAtk = state.hasAtk;
  let atkProg = state.atkProg;
  let isStealth = p.bao_stealthTimer > 0 || (p.bao_stealthFade || 0) > 0.1;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.85, 0, 1.2);
  let idleWave = Math.sin(t * 5) * 0.06;
  let walkSweep = state.moveAmt * 0.25;

  for (let side of [-1, 1]) {
    ctx.save();
    let sw = 0;
    let ext = 0;
    if (hasAtk) {
      let s = Math.sin(atkProg * Math.PI);
      if (side === dir || state.skillAlpha > 0.2) {
        sw = s * 0.85 * side;
        ext = s * 6;
      } else {
        sw = -s * 0.35 * side;
      }
    }
    ctx.translate(10 + ext, side * 16.5);
    ctx.rotate(side * (0.36 + idleWave - walkSweep) + sw);
    drawBaoDagger(ctx, side, isStealth, flare, side === dir ? state.critAlpha : 0, isMono);
    ctx.restore();
  }
}

function drawDanhGreatsword(ctx, p, t, state, isMono) {
  // Trọng Kiếm Long Hồn — Dragon-Soul Greatsword
  let dDir = p.danh_swingDir || 1;
  let dur = Math.max(0.05, p.danh_animDur || 0.22);
  let hasDanhAnim = p.danh_animTimer > 0;
  let hasSwing = hasDanhAnim || state.hasAtk;
  let prog = hasDanhAnim ? 1 - p.danh_animTimer / dur : state.hasAtk ? state.atkProg : 0;

  let isCharging = p.chargeState && p.chargeState.active;
  let chargeRatio = isCharging ? clamp(p.chargeState.elapsed / Math.max(0.1, p.chargeState.maxDur), 0, 1) : 0;
  let isBuffed =
    p.danh_dragonTimer > 0 ||
    p.danh_khaiSonTimer > 0 ||
    p.danh_longNgamTimer > 0 ||
    p.danh_thienPhatTimer > 0 ||
    isCharging;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.85 + (isBuffed ? 0.55 : 0) + chargeRatio * 0.5, 0, 1.4);

  let idleSway = Math.sin(t * 2.8) * 0.04;
  let walkSway = state.moveAmt * Math.sin(state.walkPhase) * 0.07;
  let swAngle = hasSwing
    ? (-1.22 + 2.44 * clamp(prog * 1.15, 0, 1)) * dDir
    : isCharging
    ? -0.78 - chargeRatio * 0.25
    : -0.44 + idleSway + walkSway;

  ctx.save();
  if (hasSwing) {
    drawTaperedArc(
      ctx,
      0,
      0,
      43,
      -1.22 * dDir,
      swAngle,
      (isBuffed ? 12 : 9) * (1 - prog * 0.6),
      isBuffed ? "rgba(251, 191, 36, 0.72)" : "rgba(239, 68, 68, 0.62)",
      "#FEF08A",
      isMono
    );
  }

  // Offset pivot outside player body so heavy hilt never clips into torso
  ctx.rotate(swAngle);
  ctx.translate(15, 0);

  // Dragon-claw pommel & crimson leather grip
  ctx.fillStyle = isMono ? "#222222" : "#B45309";
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-7, -4);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-7, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isMono ? "#111111" : "#7F1D1D";
  ctx.fillRect(-6, -2.5, 11, 5);

  // Monumental Dragon-Wing Crossguard
  ctx.fillStyle = isMono ? "#333333" : "#F59E0B";
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.lineTo(1, -13);
  ctx.lineTo(9, -8);
  ctx.lineTo(11, 0);
  ctx.lineTo(9, 8);
  ctx.lineTo(1, 13);
  ctx.lineTo(4, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wide Two-Handed Dragon Greatsword Blade
  let bladeGrad = ctx.createLinearGradient(8, -6, 52, 6);
  if (isMono) {
    bladeGrad.addColorStop(0, "#111111");
    bladeGrad.addColorStop(0.55, "#777777");
    bladeGrad.addColorStop(1, "#FFFFFF");
  } else if (isBuffed) {
    bladeGrad.addColorStop(0, "#B91C1C");
    bladeGrad.addColorStop(0.5, "#F59E0B");
    bladeGrad.addColorStop(1, "#FEF08A");
  } else {
    bladeGrad.addColorStop(0, "#475569");
    bladeGrad.addColorStop(0.55, "#CBD5E1");
    bladeGrad.addColorStop(1, "#F8FAFC");
  }
  ctx.fillStyle = bladeGrad;
  ctx.strokeStyle = isMono ? "#000000" : isBuffed ? "#FEF08A" : "#DC2626";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(8, -5.2);
  ctx.lineTo(16, -6.6);
  ctx.lineTo(41, -5);
  ctx.lineTo(54, 0);
  ctx.lineTo(41, 5);
  ctx.lineTo(16, 6.6);
  ctx.lineTo(8, 5.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central Blood-Fuller Groove & Glowing Dragon Runes (progressively heats up while charging)
  let heatCol = isMono ? "#FFFFFF" : chargeRatio >= 0.85 ? "#FFFFFF" : chargeRatio >= 0.45 ? "#FEF08A" : isBuffed ? "#FEF08A" : "#EF4444";
  ctx.strokeStyle = heatCol;
  ctx.lineWidth = 2.1 + chargeRatio * 1.6;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(44, 0);
  ctx.stroke();

  // Engraved draconic teeth runes along fuller
  ctx.strokeStyle = isMono ? "#FFFFFF" : chargeRatio >= 0.6 ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = 1.1 + chargeRatio * 0.7;
  for (let rx = 18; rx <= 38; rx += 6.5) {
    ctx.beginPath();
    ctx.moveTo(rx, -2.5 - chargeRatio * 0.9);
    ctx.lineTo(rx + 2.4, 0);
    ctx.lineTo(rx, 2.5 + chargeRatio * 0.9);
    ctx.stroke();
  }

  // Dragon-Heart Gem at crossguard + radial flame halo
  let gemR = 3.5 + Math.sin(t * 8) * 0.5 + flare * 1.1;
  let dHalo = ctx.createRadialGradient(7.5, 0, 0.5, 7.5, 0, gemR * 3.2);
  dHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : isBuffed ? "rgba(254, 240, 138, 0.85)" : "rgba(239, 68, 68, 0.75)");
  dHalo.addColorStop(1, "rgba(220, 38, 38, 0)");
  ctx.fillStyle = dHalo;
  ctx.beginPath();
  ctx.arc(7.5, 0, gemR * 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : isBuffed ? "#FEF08A" : "#EF4444";
  ctx.beginPath();
  ctx.arc(7.5, 0, gemR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(7.5, 0, gemR * 0.45, 0, Math.PI * 2);
  ctx.fill();

  drawHandGrip(ctx, -1, 0, "#991B1B", "#FBBF24", 4.1, isMono);

  if (flare > 0.2) {
    ctx.globalAlpha = clamp(flare * 0.85, 0, 1);
    ctx.strokeStyle = isMono ? "#000000" : chargeRatio >= 0.85 ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 1.8 + chargeRatio * 1.4;
    ctx.beginPath();
    ctx.moveTo(14, -7.8 - chargeRatio * 1.6);
    ctx.quadraticCurveTo(34, -9 + Math.sin(t * 15) * 2.2, 55 + chargeRatio * 4, 0);
    ctx.quadraticCurveTo(34, 9 - Math.sin(t * 15) * 2.2, 14, 7.8 + chargeRatio * 1.6);
    ctx.stroke();
  }
  if (state.critAlpha > 0.15 || isBuffed) {
    let sc = Math.max(state.critAlpha, isBuffed ? 0.65 + chargeRatio * 0.55 : 0);
    drawFourPointStar(ctx, 54, 0, 8.5 * sc, 2.3 * sc, "#FEF08A", "#DC2626");
  }
  ctx.restore();
}

function drawLuanCoreOrb(ctx, p, t, state, isMono) {
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.9 + (state.hasAtk ? 0.55 : 0), 0, 1.35);
  let thrust = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 10 : 0;
  let hover = Math.sin(t * 4.2) * 2.4;
  let ox = 25 + thrust;
  let oy = hover;

  ctx.save();
  // Soft void-magenta radial aura around core orb (no shadowBlur)
  if (!isMono) {
    let halo = ctx.createRadialGradient(ox, oy, 2, ox, oy, 19 + flare * 5);
    halo.addColorStop(0, "rgba(232, 121, 249, 0.42)");
    halo.addColorStop(0.55, "rgba(56, 189, 248, 0.16)");
    halo.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(ox, oy, 19 + flare * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twin tilted dimensional orbital rings + 3-prism shards around Luận's floating core orb
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(t * 2.4);
  ctx.strokeStyle = isMono ? "#111111" : "#A855F7";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14.5 + flare * 2.2, 5.4, 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(-t * 4.2 + 1.1);
  ctx.strokeStyle = isMono ? "#555555" : "#38BDF8";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12 + flare * 1.8, 4.6, -0.5, 0, Math.PI * 2);
  ctx.stroke();

  // Orbiting fractured mirror shards
  for (let i = 0; i < 3; i++) {
    let sa = t * 3.1 + (Math.PI * 2 / 3) * i;
    let sx = Math.cos(sa) * (12.5 + flare * 1.5);
    let sy = Math.sin(sa) * (12.5 + flare * 1.5);
    ctx.fillStyle = isMono ? "#FFFFFF" : i === 0 ? "#67E8F9" : "#F5D0FE";
    ctx.beginPath();
    ctx.moveTo(sx, sy - 2.6);
    ctx.lineTo(sx + 2.2, sy);
    ctx.lineTo(sx, sy + 2.6);
    ctx.lineTo(sx - 2.2, sy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Dark void-violet core sphere with dimensional crack lines
  let orbR = 8.0 + flare * 1.7;
  let orbGrad = ctx.createRadialGradient(ox - 2.2, oy - 2.2, 1, ox, oy, orbR);
  if (isMono) {
    orbGrad.addColorStop(0, "#FFFFFF");
    orbGrad.addColorStop(1, "#000000");
  } else {
    orbGrad.addColorStop(0, "#FDF4FF");
    orbGrad.addColorStop(0.35, "#C084FC");
    orbGrad.addColorStop(0.75, "#6B21A8");
    orbGrad.addColorStop(1, "#170930");
  }
  ctx.beginPath();
  ctx.arc(ox, oy, orbR, 0, Math.PI * 2);
  ctx.fillStyle = orbGrad;
  ctx.fill();
  ctx.strokeStyle = isMono ? "#000000" : "#E879F9";
  ctx.lineWidth = 1.9;
  ctx.stroke();

  // Crystalline fracture core star
  drawFourPointStar(ctx, ox, oy, 6.8 + flare * 3.2, 2.2, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
  drawHandGrip(ctx, 13, 8, "#4C1D95", "#E879F9", 3.6, isMono);
  ctx.restore();
}

function drawTaiDuTechRifle(ctx, p, t, state, isMono) {
  let recoil = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 6.5 : 0;
  let skillPulse = state.skillAlpha > 0 ? Math.sin(state.skillAlpha * Math.PI) * 3 : 0;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.8 + (state.hasAtk ? 0.65 : 0), 0, 1.4);
  let mode = p.taidu_droneMode || "attack";
  let barrelParity = p.taidu_barrelParity || 1;
  let coreCol = isMono ? "#FFFFFF" : mode === "guard" ? "#34D399" : mode === "pursuit" ? "#FBBF24" : "#38BDF8";

  ctx.save();
  ctx.translate(10 - recoil - skillPulse * 0.5, 6);

  // Soft plasma muzzle aura (zero shadowBlur)
  if (!isMono && flare > 0.15) {
    let g = ctx.createRadialGradient(34, 0, 1, 34, 0, 14 + flare * 6);
    g.addColorStop(0, mode === "guard" ? "rgba(52,211,153,0.45)" : mode === "pursuit" ? "rgba(251,191,36,0.45)" : "rgba(56,189,248,0.48)");
    g.addColorStop(1, "rgba(56,189,248,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(34, 0, 14 + flare * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted carbon-slate stock & tactical grip
  ctx.fillStyle = isMono ? "#111111" : "#1E293B";
  ctx.strokeStyle = "#070B14";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-7, -3.6);
  ctx.lineTo(14, -4.8);
  ctx.lineTo(14, 4.8);
  ctx.lineTo(-4, 4.4);
  ctx.lineTo(-10, 6.8);
  ctx.lineTo(-10, -1.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Heavy orange-blue pulse barrel shroud with cooling vents
  ctx.fillStyle = isMono ? "#333333" : "#EA580C";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(10, -5.2, 23, 10.4, 2.6) : ctx.rect(10, -5.2, 23, 10.4);
  ctx.fill();
  ctx.stroke();

  // Crisp metallic upper shroud highlight & cooling vent slits
  ctx.fillStyle = isMono ? "#666666" : "#FB923C";
  ctx.fillRect(12, -4.4, 18, 1.8);
  ctx.fillStyle = isMono ? "#000000" : "#0F172A";
  for (let vx = 13; vx <= 25; vx += 4) {
    ctx.fillRect(vx, -3.7, 2.2, 1.4);
    ctx.fillRect(vx, 2.5, 2.2, 1.4);
  }

  // Mode-reactive capacitor strip & pulsing plasma core
  ctx.fillStyle = coreCol;
  ctx.fillRect(11, -1.8, 19, 3.6);
  ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.fillRect(13 + (Math.sin(t * 9) * 0.5 + 0.5) * 10, -1.1, 5.5, 2.2);

  // Holographic targeting optic + front cyber-sight on top rail
  ctx.fillStyle = isMono ? "#000000" : "#0F172A";
  ctx.fillRect(13, -7.8, 11, 2.6);
  ctx.fillStyle = coreCol;
  ctx.fillRect(15, -7.1, 7, 1.3);

  // Extended twin railgun muzzle prongs (alternating kickback per shot)
  let topKick = state.hasAtk && barrelParity < 0 ? recoil * 0.45 : 0;
  let botKick = state.hasAtk && barrelParity > 0 ? recoil * 0.45 : 0;
  ctx.fillStyle = isMono ? "#777777" : "#38BDF8";
  ctx.fillRect(32 - topKick, -4.1, 8.2, 2.4);
  ctx.fillRect(32 - botKick, 1.7, 8.2, 2.4);
  ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.fillRect(37.5 - topKick, -3.7, 2.4, 1.6);
  ctx.fillRect(37.5 - botKick, 2.1, 2.4, 1.6);

  if (flare > 0.22) {
    let muzzleY = state.hasAtk ? (barrelParity < 0 ? -2.9 : 2.9) : 0;
    drawFourPointStar(ctx, 41, muzzleY, 8.6 * flare, 2.5 * flare, "#FEF08A", mode === "guard" ? "#34D399" : "#F97316");
  }
  drawHandGrip(ctx, 2, 2, "#EA580C", coreCol, 3.8, isMono);
  ctx.restore();
}

function drawNguyenLifeAegis(ctx, p, t, state, isMono) {
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.75 + (state.hasAtk ? 0.55 : 0), 0, 1.35);
  let parity = p.attackSwingParity || 1;
  let sweep = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 0.52 * parity : Math.sin(t * 2.4) * 0.05;
  let bucklerPush = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 4.5 : state.skillAlpha > 0 ? Math.sin(state.skillAlpha * Math.PI) * 5.5 : 0;

  ctx.save();
  ctx.rotate(sweep);
  ctx.translate(14, 0);

  // Emerald & Gold Sanctuary Staff / Conduit Shaft
  ctx.strokeStyle = isMono ? "#111111" : "#D97706";
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-11, 10);
  ctx.lineTo(15, -6);
  ctx.stroke();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.lineTo(13, -4.5);
  ctx.stroke();

  // Floating Golden-Emerald Life Crest Ring + soft halo + 6-petal spinning lotus
  ctx.save();
  ctx.translate(16, -7);
  if (!isMono) {
    let halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 + flare * 4);
    halo.addColorStop(0, "rgba(254, 240, 138, 0.44)");
    halo.addColorStop(0.55, "rgba(16, 185, 129, 0.24)");
    halo.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + flare * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.rotate(t * (1.5 + flare * 2.2));
  ctx.strokeStyle = isMono ? "#000000" : "#10B981";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, 9.8 + flare * 1.6, -2.2, 2.2);
  ctx.stroke();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 7.0 + flare * 1.2, 0.7, 5.2);
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    let pa = (Math.PI / 3) * i;
    ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#34D399" : "#FEF08A";
    ctx.beginPath();
    ctx.ellipse(Math.cos(pa) * 6.2, Math.sin(pa) * 6.2, 3.0, 1.4, pa, 0, Math.PI * 2);
    ctx.fill();
  }

  // Radiant golden life core inside ring
  ctx.beginPath();
  ctx.arc(0, 0, 4.5 + flare * 1.1, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.fill();
  ctx.strokeStyle = isMono ? "#000000" : "#059669";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  drawFourPointStar(ctx, 0, 0, 5.2 + flare * 2, 1.5, "#FFFFFF", isMono ? "#000000" : "#10B981");
  ctx.restore();

  // Off-hand glowing reactive energy buckler on left side with golden filigree rib
  ctx.save();
  ctx.translate(5 + bucklerPush, -13);
  ctx.rotate(-0.42);
  if (flare > 0.2) {
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(52, 211, 153, 0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, 0, 11 + flare * 2.5, -1.15, 1.15);
    ctx.stroke();
  }
  ctx.fillStyle = isMono ? "#222222" : "rgba(16, 185, 129, 0.85)";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-2, -9.5);
  ctx.quadraticCurveTo(10, 0, -2, 9.5);
  ctx.quadraticCurveTo(2.8, 0, -2, -9.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.beginPath();
  ctx.arc(3.4, 0, 2.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawHandGrip(ctx, 2, 2, "#059669", "#FDE047", 3.8, isMono);
  ctx.restore();
}

function drawDuyAssassinArms(ctx, p, elapsedTime, state, isMono) {
  let ink = isMono ? "#000000" : "#042F2E";
  let teal = isMono ? "#E2E8F0" : "#14B8A6";
  let brightTeal = isMono ? "#FFFFFF" : "#2DD4BF";
  let crimson = isMono ? "#333333" : "#F43F5E";
  let gold = isMono ? "#FFFFFF" : "#FDE047";

  let throwSwing = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 0.9 * state.parity : 0;
  let idleSpin = elapsedTime * (state.skillAlpha > 0 ? 11 : 4.2);

  // Flowing shadow-teal phantom trail behind hands when passive charged
  let passRatio = clamp((p.duy_idleTime || 0) / 4.5, 0, 1);

  // Back hand holding glowing emerald-crimson 4-blade shuriken ready to throw
  ctx.save();
  ctx.translate(4, -14);
  ctx.rotate(-0.35 + throwSwing * 0.7);
  ctx.fillStyle = ink;
  ctx.strokeStyle = brightTeal;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(9, -1);
  ctx.rotate(idleSpin + (state.hasAtk ? state.atkProg * 8 : 0));
  let shR = 8.5 + passRatio * 2.5;
  ctx.fillStyle = passRatio >= 0.98 ? gold : teal;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    let a = (Math.PI / 2) * i;
    ctx.lineTo(Math.cos(a) * shR, Math.sin(a) * shR);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * (shR * 0.32), Math.sin(a + Math.PI / 4) * (shR * 0.32));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = crimson;
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Front assassin wrist-blade & crimson shuriken grip
  ctx.save();
  ctx.translate(8, 13);
  ctx.rotate(0.28 - throwSwing * 0.85);
  ctx.fillStyle = ink;
  ctx.strokeStyle = crimson;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(10, 1);
  ctx.rotate(-idleSpin * 1.15);
  let fR = 7.5 + state.skillAlpha * 3;
  ctx.fillStyle = crimson;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    let a = (Math.PI / 2) * i;
    ctx.lineTo(Math.cos(a) * fR, Math.sin(a) * fR);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * (fR * 0.34), Math.sin(a + Math.PI / 4) * (fR * 0.34));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = brightTeal;
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawPhongEnergyBlades(ctx, p, elapsedTime, state, isMono) {
  let ink = isMono ? "#000000" : "#06182C";
  let deepAzure = isMono ? "#334155" : "#0284C7";
  let azure = isMono ? "#94A3B8" : "#0EA5E9";
  let cyan = isMono ? "#FFFFFF" : "#22D3EE";
  let core = isMono ? "#FFFFFF" : "#E0F2FE";
  let step = p?.phong_basicStep || 0;
  let atkPhase = state.hasAtk ? Math.sin(state.atkProg * Math.PI) : 0;
  let pulse = 0.78 + 0.22 * Math.sin(elapsedTime * 9.5);
  let ultGlow = state.skillAlpha > 0 || state.critAlpha > 0 ? 1 : 0;

  for (let side of [-1, 1]) {
    ctx.save();
    let isLead = side === 1;
    let isActiveBlade = (step === 2) || (step === 0 && isLead) || (step === 1 && !isLead);
    let swing = atkPhase * (isActiveBlade ? 1.28 : 0.48) * (isLead ? -state.parity : state.parity);
    let lunge = atkPhase * (isActiveBlade ? 4.5 : 1.5);
    ctx.translate((isLead ? 7 : 5) + lunge, side * 13.5);
    ctx.rotate(side * (isLead ? 0.24 : 0.42) + swing);

    // Translucent cyan energy halo along blade spine (zero shadowBlur)
    let bladeLen = (isLead ? 29 : 25) + state.skillAlpha * 6 + ultGlow * 2;
    let haloGrad = ctx.createLinearGradient(-4, 0, bladeLen + 4, 0);
    haloGrad.addColorStop(0, "rgba(14, 165, 233, 0)");
    haloGrad.addColorStop(0.35, isMono ? "rgba(255,255,255,0.28)" : `rgba(34, 211, 238, ${0.32 * pulse})`);
    haloGrad.addColorStop(1, "rgba(224, 242, 254, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.ellipse(bladeLen * 0.45, 0, bladeLen * 0.62, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flowing cyan shadow ribbon trailing off hilt
    ctx.strokeStyle = isMono ? "#E2E8F0" : `rgba(34, 211, 238, ${0.52 * pulse})`;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-13, side * 6 + Math.sin(elapsedTime * 12 + side) * 2.8, -22, side * 2.5);
    ctx.stroke();

    // Sleek curved plasma assassin blade
    ctx.fillStyle = azure;
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.65;
    ctx.beginPath();
    ctx.moveTo(0, -2.8);
    ctx.quadraticCurveTo(bladeLen * 0.55, -3.4 * side, bladeLen, 0.4);
    ctx.lineTo(bladeLen * 0.72, 3.3);
    ctx.lineTo(0, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual plasma fuller + glowing edge core
    ctx.strokeStyle = deepAzure;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, 1.0);
    ctx.lineTo(bladeLen * 0.68, 1.3);
    ctx.stroke();

    ctx.strokeStyle = core;
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.moveTo(3, -0.4);
    ctx.quadraticCurveTo(bladeLen * 0.54, -1.6 * side, bladeLen - 1.5, 0.35);
    ctx.stroke();

    // Cyber-ninja crossguard & glowing emitter gem
    ctx.fillStyle = ink;
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, -5.2);
    ctx.lineTo(3, -3.2);
    ctx.lineTo(3, 3.2);
    ctx.lineTo(-2, 5.2);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(1, 0, 1.7, 0, Math.PI * 2);
    ctx.fill();

    drawHandGrip(ctx, -1.5, 0, "#0284C7", "#67E8F9", 3.5, isMono);
    ctx.restore();
  }
}

function drawDangTigerGauntlets(ctx, p, elapsedTime, state, isMono) {
  let black = isMono ? "#000000" : "#09090B";
  let charcoal = isMono ? "#262626" : "#18181B";
  let white = "#F8FAFC";
  let rageReady = Boolean(p?.dang_rageReady);
  let c2Active = (p?.dang_c2_timer || 0) > 0;
  let c3Active = (p?.dang_c3_asTimer || 0) > 0;
  let empowered = rageReady || c2Active || c3Active || state.skillAlpha > 0;
  let stepDir = (p?.dang_basicStep || 0) % 2 === 0 ? 1 : -1;
  let punchThrust = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 12.5 : 0;
  let punchTilt = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 0.22 : 0;

  for (let side of [-1, 1]) {
    ctx.save();
    let isActiveFist = side === stepDir;
    let activeArm = isActiveFist ? punchThrust : punchThrust * 0.2;
    ctx.translate(9 + activeArm, side * 14.5);
    ctx.rotate(side * 0.14 + (isActiveFist ? -side * punchTilt : 0));

    // Left fist = White Tiger (Bạch Hổ), Right fist = Black Tiger (Hắc Hổ)
    let isWhiteTiger = side < 0;
    let shellFill = isMono ? black : isWhiteTiger ? white : charcoal;
    let shellStroke = isMono ? white : isWhiteTiger ? black : white;
    let stripeCol = isMono ? white : isWhiteTiger ? black : white;

    // Swirling Black-White Tiger Qi flames around each fist
    let auraR = (empowered ? 16 : 12.5) + Math.sin(elapsedTime * 14 + side) * 2;
    let grad = ctx.createRadialGradient(4, 0, 2, 4, 0, auraR);
    grad.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : isWhiteTiger ? "rgba(248,250,252,0.82)" : "rgba(24,24,27,0.86)");
    grad.addColorStop(0.6, isMono ? "rgba(0,0,0,0.35)" : isWhiteTiger ? "rgba(203,213,225,0.42)" : "rgba(248,250,252,0.42)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(4, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Trailing black-white qi flame wisps behind wrist
    let wispWave = Math.sin(elapsedTime * 16 + side * 2) * 2.4;
    ctx.strokeStyle = isMono ? white : isWhiteTiger ? "rgba(248,250,252,0.8)" : "rgba(24,24,27,0.88)";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -3.5);
    ctx.quadraticCurveTo(-9, -6 + wispWave, -15, -3 + wispWave * 0.7);
    ctx.moveTo(-2, 3.5);
    ctx.quadraticCurveTo(-9, 6 - wispWave, -15, 3 - wispWave * 0.7);
    ctx.stroke();

    // Sculpted Tiger-Head Energy Gauntlet shell (ears + snout + jawline)
    ctx.fillStyle = shellFill;
    ctx.strokeStyle = shellStroke;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-5, -5.2);
    ctx.lineTo(-2, -9.2); // outer tiger ear
    ctx.lineTo(3, -6.5);
    ctx.lineTo(10.5, -5.4); // snout brow
    ctx.lineTo(13, 0); // tiger nose tip
    ctx.lineTo(10.5, 5.4);
    ctx.lineTo(3, 6.5);
    ctx.lineTo(-2, 9.2); // inner tiger ear
    ctx.lineTo(-5, 5.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Contrasting jagged tiger stripes across gauntlet crown
    ctx.strokeStyle = stripeCol;
    ctx.lineWidth = 1.65;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-1, -4.5);
    ctx.lineTo(2.5, -2.1);
    ctx.moveTo(-2, 0);
    ctx.lineTo(3.2, 0);
    ctx.moveTo(-1, 4.5);
    ctx.lineTo(2.5, 2.1);
    ctx.stroke();

    // Glowing fierce tiger eyes on gauntlet
    ctx.fillStyle = rageReady ? "#FACC15" : isWhiteTiger ? "#09090B" : "#F8FAFC";
    ctx.beginPath();
    ctx.ellipse(4.8, -2.9, 2.1, 1.1, -0.35, 0, Math.PI * 2);
    ctx.ellipse(4.8, 2.9, 2.1, 1.1, 0.35, 0, Math.PI * 2);
    ctx.fill();
    if (rageReady || c3Active) {
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.arc(5.1, -2.9, 0.8, 0, Math.PI * 2);
      ctx.arc(5.1, 2.9, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Razor glowing Tiger Fangs / Claws extending ahead of fist
    ctx.fillStyle = rageReady ? "#FACC15" : white;
    ctx.strokeStyle = black;
    ctx.lineWidth = 1.05;
    for (let c = -1; c <= 1; c++) {
      let len = (c === 0 ? 16.5 : 14.5) + (rageReady ? 3.5 : 0) + (c3Active ? 2 : 0);
      ctx.beginPath();
      ctx.moveTo(9.5, c * 3.3 - 1.1);
      ctx.lineTo(len, c * 3.5);
      ctx.lineTo(9.5, c * 3.3 + 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawThienCelestialWeapon(ctx, p, elapsedTime, state, isMono) {
  let { hasAtk, atkProg, parity, skillAlpha, critAlpha } = state;
  let ascended = Boolean(p.thien_godMode || (p.thien_ascendedTimer || 0) > 0);
  let white = "#F8FAFC";
  let gold = isMono ? "#FFFFFF" : "#FACC15";
  let deepGold = isMono ? "#CCCCCC" : "#D97706";
  let cosmic = isMono ? "#FFFFFF" : "#38BDF8";
  let darkInk = isMono ? "#000000" : "#0F172A";

  let swingRot = 0;
  let thrust = 0;
  if (hasAtk) {
    let ease = Math.sin(atkProg * Math.PI);
    swingRot = parity * (-1.3 + atkProg * 2.65);
    thrust = ease * 9;
  } else if (skillAlpha > 0) {
    swingRot = Math.sin(skillAlpha * Math.PI * 3) * 0.55;
    thrust = skillAlpha * 6;
  }

  // Twin floating Celestial Orbit Blades flanking Thiên's hands
  for (let side of [-1, 1]) {
    let hover = Math.sin(elapsedTime * 5 + side * 1.4) * 2.2;
    ctx.save();
    ctx.translate(10 + thrust * 0.5, side * 15 + hover);
    ctx.rotate(swingRot * 0.65 + side * 0.12);

    ctx.fillStyle = side < 0 ? white : cosmic;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(3, -3.2);
    ctx.lineTo(18, 0);
    ctx.lineTo(3, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(1, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Primary Hand: Sovereign Genesis Blade-Scepter
  ctx.save();
  ctx.translate(14 + thrust, 0);
  ctx.rotate(swingRot);

  // Radiant tip halo on strike or Ascension
  if (hasAtk || ascended || skillAlpha > 0) {
    let haloGrad = ctx.createRadialGradient(18, 0, 2, 18, 0, ascended ? 22 : 16);
    haloGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.85)" : "rgba(250,204,21,0.75)");
    haloGrad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.3)" : "rgba(56,189,248,0.4)");
    haloGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(18, 0, ascended ? 22 : 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hilt & gold filigree crossguard
  ctx.fillStyle = deepGold;
  ctx.strokeStyle = darkInk;
  ctx.lineWidth = 1.1;
  ctx.fillRect(-10, -2.2, 11, 4.4);
  ctx.strokeRect(-10, -2.2, 11, 4.4);

  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(0, -8.5);
  ctx.lineTo(4.2, -3);
  ctx.lineTo(4.2, 3);
  ctx.lineTo(0, 8.5);
  ctx.lineTo(-2.6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crystalline White-Gold Celestial Blade
  ctx.fillStyle = white;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(3, -3.6);
  ctx.lineTo(25, -2.4);
  ctx.lineTo(34, 0);
  ctx.lineTo(25, 2.4);
  ctx.lineTo(3, 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner Cosmic Blue energy vein
  ctx.strokeStyle = cosmic;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(29, 0);
  ctx.stroke();

  if (critAlpha > 0 || ascended) {
    drawFourPointStar(ctx, 27, 0, 6.5, 2.0, gold, white);
  }
  ctx.restore();
}

function drawThanhSerpentStaff(ctx, p, elapsedTime, state, isMono) {
  let isUlt = (p?.thanh_c3Timer || 0) > 0;
  let jade = isMono ? "#FFFFFF" : "#10B981";
  let emerald = isMono ? "#E5E5E5" : "#34D399";
  let mint = isMono ? "#FFFFFF" : "#A7F3D0";
  let violet = isMono ? "#BBBBBB" : "#A855F7";
  let gold = isMono ? "#FFFFFF" : "#FDE047";
  let dark = "#042F2E";

  let atkSin = state.hasAtk ? Math.sin(state.atkProg * Math.PI) : 0;
  let swing = atkSin * 0.56 * state.parity;
  let thrust = atkSin * 6.5;
  let bob = Math.sin(elapsedTime * 3.6 + state.walkPhase) * (1.2 + state.moveAmt * 1.1);
  let swayRot = state.moveAmt * Math.sin(state.walkPhase) * 0.08;
  let glow = clamp(state.skillAlpha * 0.65 + state.critAlpha * 0.45 + (isUlt ? 0.4 : 0), 0, 1.3);
  let jawOpen = clamp(0.18 + atkSin * 0.65 + state.skillAlpha * 0.55 + (isUlt ? 0.2 : 0), 0.15, 1.15);

  ctx.save();
  ctx.rotate(swing + swayRot);
  ctx.translate(10 + thrust, 5 + bob);

  // Flowing shadow-jade ribbon from staff pommel
  let tailW1 = Math.sin(elapsedTime * 9.5 + state.walkPhase) * (3.2 + state.moveAmt * 3);
  let tailW2 = Math.cos(elapsedTime * 8 + state.walkPhase) * (4.5 + state.moveAmt * 3.2);
  ctx.strokeStyle = isMono ? "#888888" : violet;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.quadraticCurveTo(-25, tailW1, -34, tailW2);
  ctx.stroke();

  // Heavy dark outline + metallic jade-obsidian shaft
  ctx.strokeStyle = dark;
  ctx.lineWidth = 6.2;
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();

  let shaftGrad = ctx.createLinearGradient(-17, -2, 22, 2);
  shaftGrad.addColorStop(0, isMono ? "#222222" : "#064E3B");
  shaftGrad.addColorStop(0.55, jade);
  shaftGrad.addColorStop(1, gold);
  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();

  // Golden pommel spike
  ctx.fillStyle = gold;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(-15, -3.4);
  ctx.lineTo(-13, 0);
  ctx.lineTo(-15, 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin intertwined serpents coiling around shaft
  for (let s of [-1, 1]) {
    ctx.strokeStyle = s > 0 ? emerald : violet;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      let t = i / 14;
      let sx = -12 + t * 30;
      let sy = Math.sin(t * Math.PI * 3.2 - elapsedTime * 5) * 4.0 * s;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // Gauntleted hand grip
  drawHandGrip(ctx, -1, 0.5, "#065F46", mint, 4.1, isMono);

  // Sculpted Viper Crown Collar
  ctx.fillStyle = gold;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(16, -5.5);
  ctx.lineTo(21, -7.2);
  ctx.lineTo(23, 0);
  ctx.lineTo(21, 7.2);
  ctx.lineTo(16, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Articulated Twin-Fang Serpent Jaws that snap open on strike/cast
  for (let s of [-1, 1]) {
    ctx.fillStyle = dark;
    ctx.strokeStyle = emerald;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, s * 2.5);
    ctx.quadraticCurveTo(27, s * (7.2 + jawOpen * 4.5), 35, s * (2.8 + jawOpen * 4.2));
    ctx.lineTo(29, s * (1.2 + jawOpen * 2.0));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Razor golden venom fang inside jaw
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(31, s * (2.6 + jawOpen * 3.6));
    ctx.lineTo(34.5, s * (0.6 + jawOpen * 1.2));
    ctx.lineTo(28.5, s * (1.8 + jawOpen * 2.5));
    ctx.closePath();
    ctx.fill();
  }

  // Floating Venom-Soul Crystal Eye inside jaws
  let orbX = 27.5;
  let orbR = 4.5 + glow * 2.4 + Math.sin(elapsedTime * 6.5) * 0.45;
  let orbGrad = ctx.createRadialGradient(orbX, 0, 0.5, orbX, 0, orbR * 2.1);
  orbGrad.addColorStop(0, "#FFFFFF");
  orbGrad.addColorStop(0.35, mint);
  orbGrad.addColorStop(0.7, isUlt ? violet : jade);
  orbGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(orbX, 0, orbR * 2.1, 0, Math.PI * 2);
  ctx.fill();

  drawFourPointStar(ctx, orbX, 0, orbR * 1.15, orbR * 0.38, "#FFFFFF", isUlt ? violet : emerald);
  ctx.restore();
}

function drawNhiVenomCrossbow(ctx, p, elapsedTime, state, isMono) {
  let ammo = p?.nhi_ammoType || "purple";
  let coreCol = isMono
    ? "#FFFFFF"
    : ammo === "green"
    ? "#4ADE80"
    : ammo === "life"
    ? "#2DD4BF"
    : "#E879F9";
  let accentCol = isMono
    ? "#CCCCCC"
    : ammo === "green"
    ? "#16A34A"
    : ammo === "life"
    ? "#0D9488"
    : "#9333EA";
  let brass = isMono ? "#E5E5E5" : "#F59E0B";
  let dark = "#1E1B2E";
  let atkSin = state.hasAtk ? Math.sin(state.atkProg * Math.PI) : 0;
  let recoil = state.bowRecoil * 22 + atkSin * 4.2;
  let limbFlex = atkSin * 2.6 + state.bowRecoil * 10;
  let walkTilt = state.moveAmt * Math.sin(state.walkPhase) * 0.06;

  ctx.save();
  ctx.rotate(walkTilt);
  ctx.translate(11 - recoil, 2 + Math.sin(elapsedTime * 3.5) * 0.8);

  // Glow aura around active elixir canister
  let glowR = 13 + state.skillAlpha * 5 + state.critAlpha * 4;
  let glow = ctx.createRadialGradient(8, 0, 1, 8, 0, glowR);
  glow.addColorStop(0, isMono ? "rgba(255,255,255,0.45)" : `${coreCol}66`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(8, 0, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Rear Tri-Elixir Revolving Drum (3 tiny color pips showing alchemist kit)
  const drumCols = isMono ? ["#FFFFFF", "#CCCCCC", "#999999"] : ["#C084FC", "#4ADE80", "#2DD4BF"];
  for (let i = 0; i < 3; i++) {
    let dy = (i - 1) * 3.2;
    ctx.fillStyle = drumCols[i];
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(-5.5, dy, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Sculpted twin recurve composite crossbow prod limbs with brass tips
  for (let s of [-1, 1]) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 5.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(13, s * 2);
    ctx.quadraticCurveTo(16 - limbFlex * 0.4, s * 10.5, 6 - limbFlex * 0.8, s * (16.5 - limbFlex * 0.3));
    ctx.stroke();

    ctx.strokeStyle = accentCol;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(13, s * 2);
    ctx.quadraticCurveTo(15.5 - limbFlex * 0.4, s * 10.5, 6.5 - limbFlex * 0.8, s * (16 - limbFlex * 0.3));
    ctx.stroke();

    // Glowing elixir node on limb tip
    ctx.fillStyle = coreCol;
    ctx.beginPath();
    ctx.arc(6.5 - limbFlex * 0.8, s * (16 - limbFlex * 0.3), 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Taut energy bowstring
  let pull = state.hasAtk ? -5.2 * (1 - state.atkProg) : 0;
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F8FAFC";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(6.5 - limbFlex * 0.8, -(16 - limbFlex * 0.3));
  ctx.lineTo(1 + pull, 0);
  ctx.lineTo(6.5 - limbFlex * 0.8, 16 - limbFlex * 0.3);
  ctx.stroke();

  // Main Crossbow rail stock + brass sight frame
  ctx.fillStyle = dark;
  ctx.strokeStyle = brass;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-8, -3.6, 26, 7.2, 2.6);
  ctx.fill();
  ctx.stroke();

  // Pressurized Glass Venom Canister with animated liquid level & glass highlight
  ctx.fillStyle = "#090D16";
  ctx.beginPath();
  ctx.roundRect(-2, -2.5, 11, 5.0, 1.8);
  ctx.fill();
  ctx.fillStyle = coreCol;
  ctx.beginPath();
  ctx.roundRect(-1.5, -2.0, 9.8, 4.0, 1.4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillRect(0, -1.5, 6.5, 1.0);

  // Hand grip under stock
  drawHandGrip(ctx, -2, 3.8, "#3B0764", coreCol, 3.4, isMono);

  // Loaded Alchemical Crystal Quarrel Bolt
  let boltX = 16 + Math.sin(elapsedTime * 8) * 0.4;
  ctx.strokeStyle = coreCol;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(4 + pull, 0);
  ctx.lineTo(boltX + 9, 0);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(boltX + 14.5, 0);
  ctx.lineTo(boltX + 6, -3.8);
  ctx.lineTo(boltX + 8.2, 0);
  ctx.lineTo(boltX + 6, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawHeroWeapon(ctx, heroId, p, elapsedTime, isMono) {
  let atkDur = Math.max(0.06, p.weaponAttackDuration || 0.22);
  let hasAtk = p.attackAnimTimer > 0;
  let rawAtkProg = hasAtk ? clamp(1 - p.attackAnimTimer / atkDur, 0, 1) : 0;
  let atkProg = hasAtk ? clamp(getCosmicSwingEase(rawAtkProg), -0.15, 1.08) : 0;
  let skillDur = Math.max(0.08, p.weaponSkillDur || 0.45);
  let skillAlpha = p.weaponSkillTimer > 0 ? clamp(p.weaponSkillTimer / skillDur, 0, 1) : 0;
  let critAlpha = p.weaponCritTimer > 0 ? clamp(p.weaponCritTimer / 0.36, 0, 1) : 0;

  let state = {
    hasAtk,
    atkProg,
    parity: p.attackSwingParity || 1,
    skillAlpha,
    critAlpha,
    moveAmt: clamp(p.moveSpeedFactor || 0, 0, 1),
    walkPhase: p.walkCyclePhase || 0,
    bowRecoil: clamp(p.bowRecoilTimer || 0, 0, 0.2)
  };

  // Enlarge swords, blades, spears, bows, staves & gauntlets cleanly for unmistakable silhouette clarity
  let scaleMap = {
    dung: 1.28,
    tin: 1.32,
    kin: 1.24,
    trung: 1.22,
    eohyen: 1.32,
    longhoi: 1.26,
    duccong: 1.24,
    gau: 1.22,
    bao: 1.30,
    danh: 1.30,
    luan: 1.24,
    taidu: 1.28,
    nguyen: 1.26,
    duy: 1.28,
    phong: 1.30,
    dang: 1.26,
    thien: 1.32,
    thanh: 1.28,
    nhi: 1.26,
    minh: 1.26,
    ducanh: 1.28,
    bach: 1.22,
    thai: 1.32,
    khair: 1.26
  };
  let sc = scaleMap[heroId] || 1.26;
  ctx.save();
  ctx.scale(sc, sc);

  switch (heroId) {
    case "dung":
      drawDungSpear(ctx, p, elapsedTime, state, isMono);
      break;
    case "tin":
      drawTinBlades(ctx, p, elapsedTime, state, isMono);
      break;
    case "kin":
      drawKinBow(ctx, p, elapsedTime, state, isMono);
      break;
    case "trung":
      drawTrungOrb(ctx, p, elapsedTime, state, isMono);
      break;
    case "eohyen":
      drawEohyenBlade(ctx, p, elapsedTime, state, isMono);
      break;
    case "longhoi":
      drawLonghoiBow(ctx, p, elapsedTime, state, isMono);
      break;
    case "duccong":
      drawDuccongStaffOrb(ctx, p, elapsedTime, state, isMono);
      break;
    case "gau":
      drawGauGauntlets(ctx, p, elapsedTime, state, isMono);
      break;
    case "bao":
      drawBaoDaggers(ctx, p, elapsedTime, state, isMono);
      break;
    case "danh":
      drawDanhGreatsword(ctx, p, elapsedTime, state, isMono);
      break;
    case "luan":
      drawLuanCoreOrb(ctx, p, elapsedTime, state, isMono);
      break;
    case "taidu":
      drawTaiDuTechRifle(ctx, p, elapsedTime, state, isMono);
      break;
    case "nguyen":
      drawNguyenLifeAegis(ctx, p, elapsedTime, state, isMono);
      break;
    case "duy":
      drawDuyAssassinArms(ctx, p, elapsedTime, state, isMono);
      break;
    case "phong":
      drawPhongEnergyBlades(ctx, p, elapsedTime, state, isMono);
      break;
    case "dang":
      drawDangTigerGauntlets(ctx, p, elapsedTime, state, isMono);
      break;
    case "thien":
      drawThienCelestialWeapon(ctx, p, elapsedTime, state, isMono);
      break;
    case "thanh":
      drawThanhSerpentStaff(ctx, p, elapsedTime, state, isMono);
      break;
    case "nhi":
      drawNhiVenomCrossbow(ctx, p, elapsedTime, state, isMono);
      break;
    case "minh":
      drawMinhSealScepter(ctx, p, elapsedTime, state, isMono);
      break;
    case "ducanh":
      if (!p.ducanhRolling && !p.ducanhFortress) {
        drawDucAnhSiegeGauntlets(ctx, p, elapsedTime, state, isMono);
      }
      break;
    case "bach":
      drawBachPhantomBlades(ctx, p, elapsedTime, state, isMono);
      break;
    case "thai":
      drawThaiColosseumHalberd(ctx, p, elapsedTime, state, isMono);
      break;
    case "khair":
      drawKhairRailSniper(ctx, p, elapsedTime, state, isMono);
      break;
    default:
      break;
  }

  // Crawling neon electrical arcs along weapon reach during skills/crits/ultimates + swing wake crescent
  let arcPower = Math.max(skillAlpha * 0.9, critAlpha);
  if (arcPower > 0.08) {
    let wColors = {
      dung: ["#38BDF8", "#FDE047"],
      tin: ["#F43F5E", "#FDA4AF"],
      kin: ["#34D399", "#FEF08A"],
      trung: ["#818CF8", "#FDE047"],
      eohyen: ["#38BDF8", "#E0F2FE"],
      longhoi: ["#F97316", "#FEF08A"],
      duccong: ["#C084FC", "#38BDF8"],
      gau: ["#F59E0B", "#FEF08A"],
      bao: ["#A855F7", "#F5D0FE"],
      danh: ["#EF4444", "#FBBF24"],
      luan: ["#C084FC", "#67E8F9"],
      taidu: ["#38BDF8", "#F97316"],
      nguyen: ["#10B981", "#FEF08A"],
      duy: ["#14B8A6", "#F43F5E"],
      phong: ["#22D3EE", "#F43F5E"],
      dang: ["#F8FAFC", "#94A3B8"],
      thien: ["#FACC15", "#38BDF8"],
      thanh: ["#34D399", "#A78BFA"],
      nhi: ["#4ADE80", "#E879F9"],
      minh: ["#FACC15", "#38BDF8"],
      ducanh: ["#F59E0B", "#FEF08A"],
      bach: ["#22D3EE", "#E879F9"],
      thai: ["#EF4444", "#FDE047"],
      khair: ["#4ADE80", "#FACC15"]
    }[heroId] || ["#38BDF8", "#FFFFFF"];
    drawWeaponArcLightning(ctx, 32, arcPower, elapsedTime, wColors[0], wColors[1], isMono, true);
  }
  if (hasAtk && rawAtkProg > 0.14 && rawAtkProg < 0.85) {
    let swingA = Math.sin((rawAtkProg - 0.14) / 0.71 * Math.PI);
    ctx.save();
    if (!isMono) ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = swingA * 0.45;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E0F2FE";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(10, 0, 26, -0.7 * state.parity, 0.7 * state.parity, state.parity < 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// =====================================================================
// UPGRADED PROJECTILE, SLASH, LIGHTNING & IMPACT VFX RENDERERS
// =====================================================================

export function drawUpgradedProjectile(ctx, h, elapsedTime, isMono) {
  if (h.isWhirlwindArrow) {
    // Kin 4th-shot Tornado Storm Arrow — multi-ring gale vortex + emerald wake
    let spin = elapsedTime * 15;
    let galeHalo = ctx.createRadialGradient(0, 0, 3, 0, 0, 26);
    galeHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.55)" : "rgba(167, 243, 208, 0.55)");
    galeHalo.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(16, 185, 129, 0.25)");
    galeHalo.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = galeHalo;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, -1.65 + Math.sin(spin) * 0.25, 1.65 + Math.sin(spin) * 0.25);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#444444" : "#6EE7B7";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-6, 0, 24, -1.95, 1.95);
    ctx.stroke();

    // Glowing slipstream wake
    ctx.strokeStyle = isMono ? "#000000" : "rgba(167, 243, 208, 0.8)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-30, -7);
    ctx.quadraticCurveTo(-8, -2, 12, 0);
    ctx.quadraticCurveTo(-8, 2, -30, 7);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#ECFDF5";
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-14, -8.5);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-14, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 22, 0, 6.2, 1.8, "#FEF08A", isMono ? "#000000" : "#10B981");
    return;
  }

  if (h.kind === "kin_arrow" || h.kind === "pierce_arrow") {
    let isPierce = h.kind === "pierce_arrow";
    let sc = isPierce ? 1.42 : 1.15;
    ctx.scale(sc, sc);
    // Gradient wind wake
    let wake = ctx.createLinearGradient(-30, 0, 14, 0);
    wake.addColorStop(0, "rgba(16, 185, 129, 0)");
    wake.addColorStop(1, isMono ? "rgba(0,0,0,0.45)" : isPierce ? "rgba(254, 240, 138, 0.55)" : "rgba(52, 211, 153, 0.5)");
    ctx.strokeStyle = wake;
    ctx.lineWidth = isPierce ? 4.2 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    // Wind slipstream chevron wake
    ctx.strokeStyle = isMono ? "#000000" : isPierce ? "rgba(254, 240, 138, 0.72)" : "rgba(52, 211, 153, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-26, -5.2);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-26, 5.2);
    ctx.stroke();
    // Luminous jade shaft
    ctx.strokeStyle = isMono ? "#000000" : "#ECFDF5";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();
    // Feathered fletching
    ctx.fillStyle = isMono ? "#111111" : "#10B981";
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-21, -5.5);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-21, 5.5);
    ctx.closePath();
    ctx.fill();
    if (isPierce) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#6EE7B7";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(4, 0, 7.5, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = isMono ? "#CCCCCC" : "rgba(254, 240, 138, 0.78)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-24, -4.5);
      ctx.bezierCurveTo(-12, 6, 0, -6, 12, 0);
      ctx.stroke();
    }
    // Sculpted emerald-gold arrowhead
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(7, -5);
    ctx.lineTo(9.5, 0);
    ctx.lineTo(7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 15, 0, isPierce ? 6.4 : 4.2, isPierce ? 1.9 : 1.3, "#FFFFFF", isMono ? "#000000" : "#10B981");
    return;
  }

  if (h.kind === "fox_arrow" || h.kind === "longhoi_arrow") {
    let isFox = h.kind === "fox_arrow";
    let sc = isFox ? 1.24 : 1.12;
    ctx.scale(sc, sc);
    // Soft ember aura + fiery fox-tail wake
    let fHalo = ctx.createRadialGradient(4, 0, 1, 4, 0, 18);
    fHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.5)" : "rgba(254, 240, 138, 0.55)");
    fHalo.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = fHalo;
    ctx.beginPath();
    ctx.arc(4, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    let flick = Math.sin(elapsedTime * 22 + h.id) * 2.8;
    ctx.strokeStyle = isMono ? "#000000" : "rgba(249, 115, 22, 0.8)";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-22, flick, -32, -flick * 0.65);
    ctx.stroke();
    // Glowing amber shaft
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();
    // Flame fletching
    ctx.fillStyle = isMono ? "#111111" : "#EA580C";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, -5.8);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-20, 5.8);
    ctx.closePath();
    ctx.fill();
    // Barbed fox-fire arrowhead + trailing ember sparks
    for (let ei = 0; ei < 3; ei++) {
      let ex = -14 - ei * 6.5;
      let ey = Math.sin(elapsedTime * 26 + (h.id || 0) + ei * 2.1) * (3 + ei * 1.1);
      ctx.fillStyle = isMono ? "#FFFFFF" : ei === 0 ? "#FEF08A" : "#FB923C";
      ctx.beginPath();
      ctx.arc(ex, ey, 1.8 - ei * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : "#EF4444";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(6, -5.4);
    ctx.lineTo(9, 0);
    ctx.lineTo(6, 5.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 16, 0, isFox ? 5.8 : 4.2, isFox ? 1.7 : 1.2, "#FEF08A", isMono ? "#000000" : "#EA580C");
    return;
  }

  if (h.kind === "trung_orb") {
    // Cosmic astrolabe bolt with soft radial aura & dual orbital rings
    let aura = ctx.createRadialGradient(0, 0, 2, 0, 0, h.radius * 2.1);
    aura.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(224, 231, 255, 0.7)");
    aura.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(99, 102, 241, 0.35)");
    aura.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 2.1, 0, Math.PI * 2);
    ctx.fill();

    let wake = ctx.createLinearGradient(-24, 0, 4, 0);
    wake.addColorStop(0, "rgba(99, 102, 241, 0)");
    wake.addColorStop(1, isMono ? "rgba(0,0,0,0.5)" : "rgba(129, 140, 248, 0.75)");
    ctx.strokeStyle = wake;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.save();
    ctx.rotate(elapsedTime * 9 + h.id);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius + 3.5, h.radius * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-elapsedTime * 15);
    ctx.strokeStyle = isMono ? "#CCCCCC" : "#A5B4FC";
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius + 2.5, h.radius * 0.44, 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : "#6366F1";
    ctx.fill();
    ctx.strokeStyle = "#E0E7FF";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    for (let mi = 0; mi < 3; mi++) {
      let ma = elapsedTime * 7 + (Math.PI * 2 / 3) * mi + (h.id || 0);
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.beginPath();
      ctx.arc(Math.cos(ma) * (h.radius + 3.2), Math.sin(ma) * (h.radius + 3.2), 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFourPointStar(ctx, 0, 0, 6.4, 2.0, "#FFFFFF", isMono ? null : "#FDE047");
    return;
  }

  if (h.kind === "duccong_orb") {
    // Singularity bolt with gravitational rim halo & pink-cyan trail
    let lens = ctx.createRadialGradient(0, 0, 2, 0, 0, h.radius * 2.2);
    lens.addColorStop(0, isMono ? "rgba(255,255,255,0.6)" : "rgba(232, 121, 249, 0.65)");
    lens.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(56, 189, 248, 0.3)");
    lens.addColorStop(1, "rgba(124, 58, 237, 0)");
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : "rgba(192, 132, 252, 0.68)";
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.save();
    ctx.rotate(-elapsedTime * 10 + (h.id || 0));
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius + 4, h.radius * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(elapsedTime * 18);
    ctx.strokeStyle = isMono ? "#CCCCCC" : "#F472B6";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius + 3, h.radius * 0.42, 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : "#0F0720";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 5.2, 1.7, "#FFFFFF", isMono ? "#000000" : "#F472B6");
    return;
  }

  if (h.kind === "duccong_push_orb") {
    let spin = elapsedTime * 7.5;
    let pAura = ctx.createRadialGradient(0, 0, h.radius * 0.2, 0, 0, h.radius * 2.35);
    pAura.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(232, 121, 249, 0.72)");
    pAura.addColorStop(0.45, isMono ? "rgba(180,180,180,0.38)" : "rgba(56, 189, 248, 0.42)");
    pAura.addColorStop(0.8, isMono ? "rgba(0,0,0,0.18)" : "rgba(124, 58, 237, 0.18)");
    pAura.addColorStop(1, "rgba(88, 28, 135, 0)");
    ctx.fillStyle = pAura;
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 2.35, 0, Math.PI * 2);
    ctx.fill();

    // Gravitational comet tail wake
    let wake = ctx.createLinearGradient(-h.radius * 3.2, 0, h.radius, 0);
    wake.addColorStop(0, "rgba(124, 58, 237, 0)");
    wake.addColorStop(0.55, isMono ? "rgba(0,0,0,0.45)" : "rgba(168, 85, 247, 0.5)");
    wake.addColorStop(1, isMono ? "#FFFFFF" : "#67E8F9");
    ctx.fillStyle = wake;
    ctx.beginPath();
    ctx.moveTo(-h.radius * 3.2, 0);
    ctx.quadraticCurveTo(-h.radius, -h.radius * 0.9, h.radius * 0.4, -h.radius * 0.65);
    ctx.quadraticCurveTo(-h.radius, h.radius * 0.9, -h.radius * 3.2, 0);
    ctx.fill();

    // Dual tilted relativistic accretion rings
    ctx.save();
    ctx.rotate(spin);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius * 1.48, h.radius * 0.54, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-spin * 1.9);
    ctx.strokeStyle = isMono ? "#CCCCCC" : "#F472B6";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius * 1.42, h.radius * 0.5, -0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Singularity sphere + bright photon rim
    let coreG = ctx.createRadialGradient(-h.radius * 0.2, -h.radius * 0.2, 1, 0, 0, h.radius);
    coreG.addColorStop(0, isMono ? "#333333" : "#1E1B4B");
    coreG.addColorStop(0.68, isMono ? "#000000" : "#581C87");
    coreG.addColorStop(1, isMono ? "#FFFFFF" : "#E9D5FF");
    ctx.beginPath();
    ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
    ctx.fillStyle = coreG;
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F5D0FE";
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Orbiting nebula sparks + inner black hole heart
    for (let i = 0; i < 4; i++) {
      let a = spin * 1.2 + (Math.PI / 2) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#67E8F9" : "#F472B6";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (h.radius + 5), Math.sin(a) * (h.radius + 5), 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "#030712";
    ctx.fill();
    drawFourPointStar(ctx, 0, 0, h.radius * 0.62, 1.8, "#67E8F9", "#FFFFFF");
    return;
  }

  if (h.kind === "danh_kiem_khi") {
    let qiAura = ctx.createRadialGradient(8, 0, 2, 8, 0, 42);
    qiAura.addColorStop(0, isMono ? "rgba(255,255,255,0.62)" : "rgba(254, 240, 138, 0.65)");
    qiAura.addColorStop(0.5, isMono ? "rgba(120,120,120,0.32)" : "rgba(239, 68, 68, 0.42)");
    qiAura.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = qiAura;
    ctx.beginPath();
    ctx.arc(8, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    // Blazing crimson-gold flame-qi wake ribbons
    for (let s of [-1, 1]) {
      let fWake = ctx.createLinearGradient(-34, s * 14, 16, s * 18);
      fWake.addColorStop(0, "rgba(239, 68, 68, 0)");
      fWake.addColorStop(1, isMono ? "rgba(255,255,255,0.7)" : "rgba(251, 146, 60, 0.85)");
      ctx.strokeStyle = fWake;
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-34, s * 16 + Math.sin(elapsedTime * 22 + s) * 3);
      ctx.quadraticCurveTo(-8, s * 22, 16, s * 18);
      ctx.stroke();
    }

    drawTaperedArc(ctx, -10, 0, 39, -1.16, 1.16, 15.5, "#DC2626", "#FEF08A", isMono);
    drawTaperedArc(ctx, -1, 0, 33, -1.02, 1.02, 8.5, "#F97316", "#FFFFFF", isMono);
    drawTaperedArc(ctx, 5, 0, 27, -0.82, 0.82, 4.2, "#FEF08A", "#FFFFFF", isMono);
    drawFourPointStar(ctx, 32, 0, 9.5, 2.4, "#FFFFFF", isMono ? "#000000" : "#EF4444");
    return;
  }

  if (h.kind === "tin_slash_wave") {
    let sc = h.empowered ? 1.28 : 1.05;
    ctx.scale(sc, sc);
    let glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
    glow.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(251, 113, 133, 0.65)");
    glow.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // Outer crimson crescent blade
    ctx.fillStyle = isMono ? "#000000" : "#E11D48";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDA4AF";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.quadraticCurveTo(4, -23, -17, -25);
    ctx.quadraticCurveTo(1, -9, 1, 0);
    ctx.quadraticCurveTo(1, 9, -17, 25);
    ctx.quadraticCurveTo(4, 23, 15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright spatial rift edge + trailing blood sparks
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(5, -7, 12, 0);
    ctx.quadraticCurveTo(5, 7, -10, 18);
    ctx.stroke();
    for (let si of [-1, 1]) {
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.55)" : "rgba(251, 113, 133, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-26, si * 11);
      ctx.lineTo(-9, si * 15);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 13, 0, 6.2, 1.7, "#FFFFFF", isMono ? "#000000" : "#FB7185");
    return;
  }

  if (h.kind === "tin_crystal_throw") {
    let cGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 29);
    cGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : "rgba(254, 205, 211, 0.8)");
    cGlow.addColorStop(0.52, isMono ? "rgba(100,100,100,0.35)" : "rgba(244, 63, 94, 0.45)");
    cGlow.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, Math.PI * 2);
    ctx.fill();

    // Directional crimson rift tail
    let cTail = ctx.createLinearGradient(-32, 0, 6, 0);
    cTail.addColorStop(0, "rgba(225, 29, 72, 0)");
    cTail.addColorStop(1, isMono ? "rgba(0,0,0,0.65)" : "rgba(251, 113, 133, 0.78)");
    ctx.strokeStyle = cTail;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();

    ctx.rotate(elapsedTime * 14);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(253, 164, 175, 0.85)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Orbiting mini ruby shards
    for (let si = 0; si < 3; si++) {
      let sa = (Math.PI * 2 / 3) * si;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FDA4AF";
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * 20, Math.sin(sa) * 20, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sculpted 6-point blood crystal monolith
    ctx.fillStyle = isMono ? "#000000" : "#9F1239";
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(12, -3);
    ctx.lineTo(9, 11);
    ctx.lineTo(0, 19);
    ctx.lineTo(-9, 11);
    ctx.lineTo(-12, -3);
    ctx.closePath();
    ctx.fill();

    // Specular prism facets
    ctx.fillStyle = isMono ? "#555555" : "#F43F5E";
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(12, -3);
    ctx.lineTo(0, 19);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FFE4E6";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(4.5, -2);
    ctx.lineTo(0, 12);
    ctx.lineTo(-3, -2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#FFE4E6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(12, -3);
    ctx.lineTo(9, 11);
    ctx.lineTo(0, 19);
    ctx.lineTo(-9, 11);
    ctx.lineTo(-12, -3);
    ctx.closePath();
    ctx.stroke();
    drawFourPointStar(ctx, 0, -4, 6.5, 1.8, "#FFFFFF", isMono ? "#000000" : "#E11D48");
    return;
  }

  if (h.kind === "luan_orb") {
    let sc = h.portalBoosted ? 1.38 : 1.08;
    let spin = elapsedTime * 11 + (h.id || 0);
    ctx.scale(sc, sc);

    // Dual-layer void plasma comet wake + mirror refraction sparks
    let wake = ctx.createLinearGradient(-38, 0, 8, 0);
    wake.addColorStop(0, "rgba(124, 58, 237, 0)");
    wake.addColorStop(0.55, isMono ? "rgba(0,0,0,0.45)" : h.portalBoosted ? "rgba(56, 189, 248, 0.65)" : "rgba(168, 85, 247, 0.65)");
    wake.addColorStop(1, isMono ? "#FFFFFF" : "#F0ABFC");
    ctx.fillStyle = wake;
    ctx.beginPath();
    ctx.moveTo(8, -9);
    ctx.lineTo(-38, 0);
    ctx.lineTo(8, 9);
    ctx.closePath();
    ctx.fill();

    // Outer dimensional aura
    let aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    aura.addColorStop(0, isMono ? "rgba(255,255,255,0.88)" : "rgba(245, 208, 254, 0.9)");
    aura.addColorStop(0.5, isMono ? "rgba(80,80,80,0.45)" : h.portalBoosted ? "rgba(56, 189, 248, 0.65)" : "rgba(192, 132, 252, 0.65)");
    aura.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Dual counter-rotating orbital rings + 3 orbiting mirror shards
    ctx.save();
    ctx.rotate(spin);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14.5, 5.4, 0.45, 0, Math.PI * 2);
    ctx.stroke();
    for (let mi = 0; mi < 3; mi++) {
      let ma = (Math.PI * 2 / 3) * mi;
      ctx.fillStyle = isMono ? "#FFFFFF" : mi % 2 === 0 ? "#67E8F9" : "#F5D0FE";
      ctx.beginPath();
      ctx.arc(Math.cos(ma) * 14, Math.sin(ma) * 14, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.rotate(-spin * 2);
    ctx.strokeStyle = isMono ? "#CCCCCC" : "#38BDF8";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14.5, 5.4, -0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Singularity core + diamond glint
    ctx.fillStyle = isMono ? "#111111" : "#3B0764";
    ctx.strokeStyle = isMono ? "#FFFFFF" : h.portalBoosted ? "#67E8F9" : "#F5D0FE";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 8.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 7.6, 2.4, isMono ? "#FFFFFF" : "#FEF08A", null);
    return;
  }

  if (h.kind === "luan_shard") {
    let sc = h.portalBoosted ? 1.38 : 1.06;
    ctx.scale(sc, sc);
    let wake = ctx.createLinearGradient(-36, 0, 4, 0);
    wake.addColorStop(0, "rgba(168, 85, 247, 0)");
    wake.addColorStop(0.5, isMono ? "rgba(0,0,0,0.5)" : h.portalBoosted ? "rgba(56, 189, 248, 0.72)" : "rgba(192, 132, 252, 0.65)");
    wake.addColorStop(1, isMono ? "#FFFFFF" : "#F5D0FE");
    ctx.strokeStyle = wake;
    ctx.lineWidth = h.portalBoosted ? 6.2 : 4.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(-2, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#111111" : "#3B0764";
    ctx.strokeStyle = isMono ? "#FFFFFF" : h.portalBoosted ? "#67E8F9" : "#E879F9";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(0, -8.8);
    ctx.lineTo(-14, 0);
    ctx.lineTo(0, 8.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner prism facet & spark
    ctx.fillStyle = isMono ? "#DDDDDD" : h.portalBoosted ? "#BAE6FD" : "#F5D0FE";
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(1, -3.8);
    ctx.lineTo(-7, 0);
    ctx.lineTo(1, 3.8);
    ctx.closePath();
    ctx.fill();

    if (h.portalBoosted) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(240, 171, 252, 0.9)";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(-10, -11);
      ctx.lineTo(7, -7);
      ctx.moveTo(-10, 11);
      ctx.lineTo(7, 7);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 13, 0, 5.4, 1.6, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "taidu_rail") {
    let rGlow = ctx.createRadialGradient(8, 0, 2, 8, 0, 32);
    rGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.72)" : "rgba(254, 240, 138, 0.72)");
    rGlow.addColorStop(0.5, isMono ? "rgba(100,100,100,0.32)" : "rgba(56, 189, 248, 0.42)");
    rGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = rGlow;
    ctx.beginPath();
    ctx.arc(8, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    let wake = ctx.createLinearGradient(-56, 0, 22, 0);
    wake.addColorStop(0, "rgba(56, 189, 248, 0)");
    wake.addColorStop(0.6, isMono ? "rgba(0,0,0,0.65)" : "rgba(56, 189, 248, 0.78)");
    wake.addColorStop(1, isMono ? "#FFFFFF" : "#FEF08A");
    ctx.strokeStyle = wake;
    ctx.lineWidth = 11.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-56, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Helical electromagnetic coil along slug wake
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      let sx = 14 - i * 7.5;
      let sy = Math.sin(elapsedTime * 28 + i * 1.1) * 5.8;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();

    // Mach shock cone + ionized rail prongs
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.85)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(0, -14);
    ctx.moveTo(26, 0);
    ctx.lineTo(0, 14);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(6, -8);
    ctx.lineTo(11, 0);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 18, 0, 7.2, 2.2, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "taidu_turret_rocket") {
    ctx.strokeStyle = isMono ? "#000000" : "rgba(249, 115, 22, 0.65)";
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-4, 0);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#222222" : "#F97316";
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-2, -4.5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.kind === "taidu_bolt" || h.kind === "turret_shot") {
    let isTurret = h.kind === "turret_shot";
    let mainCol = h.color || (isTurret ? "#38BDF8" : "#F97316");
    ctx.strokeStyle = isMono ? "#000000" : isTurret ? "rgba(56, 189, 248, 0.65)" : "rgba(249, 115, 22, 0.68)";
    ctx.lineWidth = isTurret ? 3.2 : 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = isTurret ? 1.4 : 1.8;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : isTurret ? "#BAE6FD" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : mainCol;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(2, -4.4);
    ctx.lineTo(5, 0);
    ctx.lineTo(2, 4.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.kind === "taidu_missile") {
    let flk = Math.sin(elapsedTime * 34 + (h.id || 0)) * 2.8;
    let mGlow = ctx.createRadialGradient(-4, 0, 2, -4, 0, 26);
    mGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(254, 240, 138, 0.72)");
    mGlow.addColorStop(0.5, isMono ? "rgba(120,120,120,0.3)" : "rgba(249, 115, 22, 0.42)");
    mGlow.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = mGlow;
    ctx.beginPath();
    ctx.arc(-4, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Multi-stage plasma exhaust plume
    let exhaust = ctx.createLinearGradient(-42, 0, -8, 0);
    exhaust.addColorStop(0, "rgba(249, 115, 22, 0)");
    exhaust.addColorStop(0.55, isMono ? "rgba(180,180,180,0.6)" : "rgba(249, 115, 22, 0.78)");
    exhaust.addColorStop(1, "#FEF08A");
    ctx.fillStyle = exhaust;
    ctx.beginPath();
    ctx.moveTo(-10, -5.5);
    ctx.quadraticCurveTo(-24, -4 + flk * 0.45, -42, flk);
    ctx.quadraticCurveTo(-24, 4 + flk * 0.45, -10, 5.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-26, flk * 0.45);
    ctx.stroke();

    // Mach shock rings behind warhead
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.6)" : "rgba(56, 189, 248, 0.72)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(-18, 0, 3.2, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Armored aerospace seeker fuselage + swept wings
    ctx.fillStyle = isMono ? "#1E293B" : "#0284C7";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(8, -5.8);
    ctx.lineTo(-10, -5.8);
    ctx.lineTo(-16, -11.5);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-16, 11.5);
    ctx.lineTo(-10, 5.8);
    ctx.lineTo(8, 5.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metallic dorsal stripe + glowing optical seeker lens
    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.fillRect(-7, -1.8, 15, 3.6);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.beginPath();
    ctx.arc(12, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, 13, 0, 5.5, 1.6, "#FEF08A", isMono ? "#000000" : "#F97316");
    return;
  }

  if (h.kind === "nguyen_bolt") {
    let nAura = ctx.createRadialGradient(0, 0, 2, 0, 0, 17);
    nAura.addColorStop(0, isMono ? "rgba(255,255,255,0.55)" : "rgba(254, 240, 138, 0.52)");
    nAura.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(52, 211, 153, 0.3)");
    nAura.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = nAura;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : "rgba(52, 211, 153, 0.62)";
    ctx.lineWidth = 4.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.rotate(elapsedTime * 8);
    for (let i = 0; i < 4; i++) {
      let a = (Math.PI / 2) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#34D399";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 5.2, Math.sin(a) * 5.2, 3.6, 1.8, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(5.5, (h.radius || 8) * 0.72), 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : "#10B981";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 5.4, 1.8, "#FEF08A", null);
    return;
  }

  if (h.kind === "boomerang_glaive") {
    let bgAura = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    bgAura.addColorStop(0, isMono ? "rgba(255,255,255,0.5)" : "rgba(56, 189, 248, 0.5)");
    bgAura.addColorStop(0.6, isMono ? "rgba(0,0,0,0.2)" : "rgba(251, 191, 36, 0.28)");
    bgAura.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = bgAura;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(elapsedTime * 16);
    drawTaperedArc(ctx, 0, 0, 14, -1.35, 1.35, 5.2, "#FBBF24", "#FFFFFF", isMono);
    drawTaperedArc(ctx, 0, 0, 14, Math.PI - 1.35, Math.PI + 1.35, 5.2, "#FBBF24", "#FFFFFF", isMono);
    ctx.fillStyle = isMono ? "#000000" : "#38BDF8";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 6.2, 1.8, "#FFFFFF", isMono ? "#000000" : "#FBBF24");
    return;
  }

  if (h.kind === "wisp_bolt") {
    let wGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 17);
    wGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.68)" : "rgba(232, 121, 249, 0.65)");
    wGlow.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(56, 189, 248, 0.3)");
    wGlow.addColorStop(1, "rgba(192, 132, 252, 0)");
    ctx.fillStyle = wGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();

    let wTail = ctx.createLinearGradient(-22, 0, 4, 0);
    wTail.addColorStop(0, "rgba(192, 132, 252, 0)");
    wTail.addColorStop(1, isMono ? "#FFFFFF" : "#C084FC");
    ctx.strokeStyle = wTail;
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 6.4, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#111111" : "#C084FC";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    for (let wi = 0; wi < 2; wi++) {
      let wa = elapsedTime * 11 + wi * Math.PI + (h.id || 0);
      ctx.fillStyle = isMono ? "#FFFFFF" : "#67E8F9";
      ctx.beginPath();
      ctx.arc(Math.cos(wa) * 9.5, Math.sin(wa) * 9.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFourPointStar(ctx, 0, 0, 5.2, 1.6, "#FFFFFF", isMono ? "#000000" : "#C084FC");
    return;
  }

  if (h.kind === "frost_bolt") {
    let fTail = ctx.createLinearGradient(-24, 0, 6, 0);
    fTail.addColorStop(0, "rgba(125, 211, 252, 0)");
    fTail.addColorStop(1, isMono ? "#CCCCCC" : "#7DD3FC");
    ctx.strokeStyle = fTail;
    ctx.lineWidth = 4.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#000000" : "#0284C7";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E0F2FE";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(1, -6.2);
    ctx.lineTo(-10, -2.5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 2.5);
    ctx.lineTo(1, 6.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#E0F2FE";
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(2, -2.8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(2, 2.8);
    ctx.closePath();
    ctx.fill();
    drawFourPointStar(ctx, 11, 0, 4.8, 1.4, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "void_bolt") {
    let vAura = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    vAura.addColorStop(0, isMono ? "rgba(255,255,255,0.55)" : "rgba(232, 121, 249, 0.58)");
    vAura.addColorStop(0.6, isMono ? "rgba(0,0,0,0.2)" : "rgba(76, 29, 149, 0.35)");
    vAura.addColorStop(1, "rgba(76, 29, 149, 0)");
    ctx.fillStyle = vAura;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(elapsedTime * 9);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(56, 189, 248, 0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 5.2, 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#000000" : "#4C1D95";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -9.5);
    ctx.lineTo(9.5, 0);
    ctx.lineTo(0, 9.5);
    ctx.lineTo(-9.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    drawFourPointStar(ctx, 0, 0, 5.6, 1.8, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "cyber_bolt") {
    // Glowing plasma thruster wake
    let trail = ctx.createLinearGradient(-32, 0, 8, 0);
    trail.addColorStop(0, "rgba(56, 189, 248, 0)");
    trail.addColorStop(0.6, isMono ? "rgba(0,0,0,0.45)" : "rgba(14, 165, 233, 0.55)");
    trail.addColorStop(1, isMono ? "#FFFFFF" : "#BAE6FD");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(-4, -5.5);
    ctx.lineTo(-4, 5.5);
    ctx.closePath();
    ctx.fill();

    // Twin stabilizer fins & armored plasma dart
    ctx.fillStyle = isMono ? "#111111" : "#0F172A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(4, -7);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-14, 6);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner ionized arc core
    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(2, -3.4);
    ctx.lineTo(-7, 0);
    ctx.lineTo(2, 3.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(5, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.kind === "thunder_lance") {
    let pulse = 0.85 + 0.2 * Math.sin(elapsedTime * 22 + (h.id || 0));
    // Crackling lightning tail wake
    ctx.strokeStyle = isMono ? "#000000" : "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-15, -5.5 * pulse);
    ctx.lineTo(-6, 5.5 * pulse);
    ctx.lineTo(4, -3.5);
    ctx.lineTo(18, 0);
    ctx.stroke();

    // White-hot core filament
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();

    // Storm arrowhead
    ctx.fillStyle = isMono ? "#000000" : "#0284C7";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(6, -7);
    ctx.lineTo(11, 0);
    ctx.lineTo(6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 11, 0, 5.5 * pulse, 1.8, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "venom_fang") {
    // Acidic mist wake
    let vTrail = ctx.createLinearGradient(-28, 0, 8, 0);
    vTrail.addColorStop(0, "rgba(163, 230, 53, 0)");
    vTrail.addColorStop(1, isMono ? "rgba(0,0,0,0.45)" : "rgba(132, 204, 22, 0.55)");
    ctx.fillStyle = vTrail;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.quadraticCurveTo(-8, -7, 4, -4);
    ctx.quadraticCurveTo(-8, 7, -28, 0);
    ctx.fill();

    // Curved bio-chitinous fang
    ctx.fillStyle = isMono ? "#111111" : "#14532D";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#A3E635";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.quadraticCurveTo(4, -9.5, -13, -4);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-13, 4);
    ctx.quadraticCurveTo(4, 9.5, 19, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing toxic nerve vein + droplet
    ctx.fillStyle = isMono ? "#FFFFFF" : "#BEF264";
    ctx.beginPath();
    ctx.ellipse(3, 0, 6.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "#DDDDDD" : "#4ADE80";
    ctx.beginPath();
    ctx.arc(-15, Math.sin(elapsedTime * 14 + (h.id || 0)) * 3, 2.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.kind === "blood_crystal") {
    // Crimson mist wake
    let bTrail = ctx.createLinearGradient(-26, 0, 4, 0);
    bTrail.addColorStop(0, "rgba(225, 29, 72, 0)");
    bTrail.addColorStop(1, isMono ? "rgba(0,0,0,0.45)" : "rgba(251, 113, 133, 0.58)");
    ctx.fillStyle = bTrail;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(-2, -5.5);
    ctx.lineTo(-2, 5.5);
    ctx.closePath();
    ctx.fill();

    // Multi-faceted ruby prism shard
    ctx.fillStyle = isMono ? "#000000" : "#9F1239";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDA4AF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(1, -7.5);
    ctx.lineTo(-13, -2.5);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-13, 2.5);
    ctx.lineTo(1, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper facet highlight
    ctx.fillStyle = isMono ? "#555555" : "#F43F5E";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(1, -7.5);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(3, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.kind === "seraph_spear") {
    let spin = elapsedTime * 7 + (h.id || 0);
    // Radiant gold-crimson wake ribbon
    let sTrail = ctx.createLinearGradient(-34, 0, 6, 0);
    sTrail.addColorStop(0, "rgba(220, 38, 38, 0)");
    sTrail.addColorStop(0.55, isMono ? "rgba(0,0,0,0.45)" : "rgba(220, 38, 38, 0.52)");
    sTrail.addColorStop(1, isMono ? "#FFFFFF" : "rgba(251, 191, 36, 0.8)");
    ctx.fillStyle = sTrail;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(-4, -6.5);
    ctx.lineTo(-4, 6.5);
    ctx.closePath();
    ctx.fill();

    // Feather-finned tail
    ctx.fillStyle = isMono ? "#FFFFFF" : "#DC2626";
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-22, -7.5);
    ctx.lineTo(-17, 0);
    ctx.lineTo(-22, 7.5);
    ctx.closePath();
    ctx.fill();

    // Golden lance shaft
    ctx.strokeStyle = isMono ? "#000000" : "#FBBF24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-21, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();

    // Celestial diamond blade
    ctx.fillStyle = isMono ? "#FFFFFF" : "#DC2626";
    ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(6, -8);
    ctx.lineTo(10, 0);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rotating sacred halo ring around spear shaft
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(spin);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawFourPointStar(ctx, 11, 0, 6, 1.8, "#FEF08A", isMono ? "#000000" : "#DC2626");
    return;
  }


  if (h.kind === "duy_atk_shuriken" || h.kind === "duy_shuriken" || h.kind === "duy_c3_shuriken") {
    let isUlt = h.kind === "duy_c3_shuriken";
    let isC2 = h.kind === "duy_shuriken";
    let bladeR = isUlt ? 15.5 : isC2 ? 13 : 10.5;
    let primary = isUlt ? "#F43F5E" : isC2 ? "#2DD4BF" : "#14B8A6";
    let edge = isUlt ? "#FDE047" : "#F0FDFA";

    // Luminous velocity wake + twin chakra ribbons
    let trailGrad = ctx.createLinearGradient(-42, 0, 6, 0);
    trailGrad.addColorStop(0, "rgba(20, 184, 166, 0)");
    trailGrad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.35)" : isUlt ? "rgba(244, 63, 94, 0.6)" : "rgba(45, 212, 191, 0.55)");
    trailGrad.addColorStop(1, isMono ? "#FFFFFF" : edge);
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(4, -bladeR * 0.52);
    ctx.lineTo(4, bladeR * 0.52);
    ctx.closePath();
    ctx.fill();

    if (isC2 || isUlt) {
      let sAura = ctx.createRadialGradient(0, 0, 2, 0, 0, bladeR * 1.9);
      sAura.addColorStop(0, isMono ? "rgba(255,255,255,0.5)" : isUlt ? "rgba(253, 224, 71, 0.55)" : "rgba(45, 212, 191, 0.5)");
      sAura.addColorStop(1, "rgba(20, 184, 166, 0)");
      ctx.fillStyle = sAura;
      ctx.beginPath();
      ctx.arc(0, 0, bladeR * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Motion-blur spin halo ring
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.55)" : isUlt ? "rgba(251, 113, 133, 0.72)" : "rgba(94, 234, 212, 0.65)";
    ctx.lineWidth = isUlt ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, bladeR * 1.18, 0, Math.PI * 2);
    ctx.stroke();

    // Spinning 4-blade hooked ninja shuriken
    ctx.save();
    ctx.rotate(elapsedTime * (isUlt ? 30 : 22) + (h.id || 0));
    ctx.fillStyle = isMono ? "#FFFFFF" : primary;
    ctx.strokeStyle = isMono ? "#000000" : edge;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let a = (Math.PI / 2) * i;
      ctx.lineTo(Math.cos(a) * bladeR, Math.sin(a) * bladeR);
      ctx.lineTo(Math.cos(a + Math.PI / 5) * (bladeR * 0.42), Math.sin(a + Math.PI / 5) * (bladeR * 0.42));
      ctx.lineTo(Math.cos(a + Math.PI / 4) * (bladeR * 0.3), Math.sin(a + Math.PI / 4) * (bladeR * 0.3));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isUlt || isC2) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = isMono ? "#CCCCCC" : isUlt ? "#FDE047" : "#99F6E4";
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        let a = (Math.PI / 2) * i;
        ctx.lineTo(Math.cos(a) * (bladeR * 0.78), Math.sin(a) * (bladeR * 0.78));
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (bladeR * 0.22), Math.sin(a + Math.PI / 4) * (bladeR * 0.22));
      }
      ctx.closePath();
      ctx.fill();
    }

    // Inner dark ring & glowing jade/ruby core
    ctx.fillStyle = isMono ? "#000000" : "#0F172A";
    ctx.beginPath();
    ctx.arc(0, 0, bladeR * 0.3, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, 0, 0, bladeR * 0.45, bladeR * 0.14, "#FFFFFF", isMono ? "#000000" : isUlt ? "#34D399" : "#F43F5E");
    ctx.restore();
    return;
  }

  if (h.kind === "phong_illusion_bolt") {
    let ang = Math.atan2(h.vy || 0, h.vx || 1);
    ctx.save();
    ctx.rotate(ang);
    // Trailing cyan soul-blade plasma wake
    let trailGrad = ctx.createLinearGradient(-22, 0, 14, 0);
    trailGrad.addColorStop(0, "rgba(14, 165, 233, 0)");
    trailGrad.addColorStop(0.65, isMono ? "rgba(255,255,255,0.45)" : "rgba(34, 211, 238, 0.65)");
    trailGrad.addColorStop(1, "rgba(224, 242, 254, 0.95)");
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#0EA5E9";
    ctx.strokeStyle = isMono ? "#000000" : "#E0F2FE";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-4, -6.2);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-4, 6.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 2, 0, 5.2, 1.8, "#E0F2FE", isMono ? "#000000" : "#22D3EE");
    ctx.restore();
    return;
  }

  if (h.kind === "dang_tiger_wave") {
    let ang = Math.atan2(h.vy || 0, h.vx || 1);
    let r = h.radius || 30;
    let pulse = 0.94 + 0.06 * Math.sin(elapsedTime * 20);
    ctx.save();
    ctx.rotate(ang);
    ctx.scale(pulse, pulse);

    // Trailing black & white qi streaks behind tiger wave
    let qiGrad = ctx.createLinearGradient(-r * 1.4, 0, r * 0.6, 0);
    qiGrad.addColorStop(0, "rgba(24, 24, 27, 0)");
    qiGrad.addColorStop(0.6, isMono ? "rgba(0,0,0,0.45)" : "rgba(24, 24, 27, 0.55)");
    qiGrad.addColorStop(1, "rgba(248, 250, 252, 0.72)");
    ctx.fillStyle = qiGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 1.35, -r * 0.55);
    ctx.lineTo(r * 0.5, -r * 0.9);
    ctx.lineTo(r * 0.95, 0);
    ctx.lineTo(r * 0.5, r * 0.9);
    ctx.lineTo(-r * 1.35, r * 0.55);
    ctx.closePath();
    ctx.fill();

    // Roaring Tiger-Shaped Qi Silhouette Wave (White Tiger body + Black Tiger rim & stripes)
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F8FAFC";
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(r * 1.05, 0);
    ctx.lineTo(r * 0.45, -r * 0.68);
    ctx.lineTo(-r * 0.25, -r * 0.92); // Left tiger ear
    ctx.lineTo(-r * 0.18, -r * 0.44);
    ctx.lineTo(-r * 0.68, -r * 0.28);
    ctx.lineTo(-r * 0.38, 0);
    ctx.lineTo(-r * 0.68, r * 0.28);
    ctx.lineTo(-r * 0.18, r * 0.44);
    ctx.lineTo(-r * 0.25, r * 0.92); // Right tiger ear
    ctx.lineTo(r * 0.45, r * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bold black tiger stripes & fangs inside wave
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r * 0.15, -r * 0.44);
    ctx.lineTo(-r * 0.12, -r * 0.22);
    ctx.moveTo(r * 0.15, r * 0.44);
    ctx.lineTo(-r * 0.12, r * 0.22);
    ctx.moveTo(r * 0.42, 0);
    ctx.lineTo(-r * 0.08, 0);
    ctx.stroke();

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#000000" : "#09090B";
      ctx.beginPath();
      ctx.ellipse(r * 0.36, s * r * 0.28, 3.6, 1.8, s * -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#F8FAFC";
      ctx.beginPath();
      ctx.moveTo(r * 0.62, s * r * 0.24);
      ctx.lineTo(r * 1.12, s * r * 0.14);
      ctx.lineTo(r * 0.62, s * r * 0.06);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (h.kind === "dang_tiger_head") {
    let ang = Math.atan2(h.vy || 0, h.vx || 1);
    let r = h.radius || 50;
    let pulse = 0.94 + 0.08 * Math.sin(elapsedTime * 20);
    ctx.save();
    ctx.rotate(ang);
    ctx.scale(pulse, pulse);

    // Trailing black-white yin-yang mane & speed shock rings behind giant tiger head
    for (let ring = 1; ring <= 3; ring++) {
      let rx = -r * (0.55 + ring * 0.42);
      let rr = r * (0.98 - ring * 0.18);
      ctx.strokeStyle = ring % 2 === 1 ? "rgba(248, 250, 252, 0.72)" : "rgba(24, 24, 27, 0.85)";
      ctx.lineWidth = 4.8 - ring;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(rx, 0, rr, -0.92, 0.92);
      ctx.stroke();
    }

    let aura = ctx.createRadialGradient(-8, 0, 8, -4, 0, r * 1.48);
    aura.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : "rgba(248, 250, 252, 0.72)");
    aura.addColorStop(0.55, isMono ? "rgba(0,0,0,0.45)" : "rgba(24, 24, 27, 0.75)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-4, 0, r * 1.48, 0, Math.PI * 2);
    ctx.fill();

    // Roaring Giant Tiger Head silhouette facing +X
    ctx.fillStyle = isMono ? "#111111" : "#18181B";
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(r * 1.12, 0);
    ctx.lineTo(r * 0.48, -r * 0.76);
    ctx.lineTo(-r * 0.28, -r * 0.98); // Left ear peak
    ctx.lineTo(-r * 0.48, -r * 0.52);
    ctx.lineTo(-r * 1.05, -r * 0.28);
    ctx.lineTo(-r * 1.05, r * 0.28);
    ctx.lineTo(-r * 0.48, r * 0.52);
    ctx.lineTo(-r * 0.28, r * 0.98); // Right ear peak
    ctx.lineTo(r * 0.48, r * 0.76);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bold white tiger crown + cheek markings
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.moveTo(r * 0.84, 0);
    ctx.lineTo(r * 0.24, -r * 0.4);
    ctx.lineTo(-r * 0.36, -r * 0.24);
    ctx.lineTo(-r * 0.08, 0);
    ctx.lineTo(-r * 0.36, r * 0.24);
    ctx.lineTo(r * 0.24, r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Forehead black 王-tiger stripes + cheek stripes
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.06, -r * 0.24);
    ctx.lineTo(-r * 0.06, r * 0.24);
    ctx.moveTo(r * 0.16, -r * 0.18);
    ctx.lineTo(-r * 0.22, -r * 0.18);
    ctx.moveTo(r * 0.16, r * 0.18);
    ctx.lineTo(-r * 0.22, r * 0.18);
    ctx.stroke();

    // Fierce glowing amber eyes + razor white fangs
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FACC15";
      ctx.beginPath();
      ctx.ellipse(r * 0.28, s * r * 0.34, 6.8, 3.4, s * -0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#09090B";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.68, s * r * 0.28);
      ctx.lineTo(r * 1.18, s * r * 0.16);
      ctx.lineTo(r * 0.68, s * r * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (h.style === "thanh_atk" || h.style === "thanh_c1_snake" || h.style === "thanh_guard_bolt") {
    let isC1 = h.style === "thanh_c1_snake";
    let isGuard = h.style === "thanh_guard_bolt";
    let isEcho = !!h.isEcho;
    let bodyCol = isMono ? "#FFFFFF" : isEcho ? "#A78BFA" : isC1 ? "#34D399" : "#10B981";
    let coreCol = isMono ? "#FFFFFF" : isEcho ? "#F3E8FF" : "#A7F3D0";
    let finCol = isMono ? "#CCCCCC" : isEcho ? "#C084FC" : "#FDE047";
    let r = h.radius || (isC1 ? 11 : 7);

    // Venom mist halo
    let halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.4);
    halo.addColorStop(0, coreCol);
    halo.addColorStop(0.48, isMono ? "rgba(255,255,255,0.38)" : isEcho ? "rgba(167,139,250,0.48)" : "rgba(16,185,129,0.5)");
    halo.addColorStop(1, "rgba(16,185,129,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Dark outline + undulating scaled spirit snake body
    let tailLen = isC1 ? 34 : isGuard ? 19 : 24;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#042F2E";
    ctx.lineWidth = isC1 ? 7.2 : 5.0;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    for (let i = 1; i <= 8; i++) {
      let sx = 4 - (i / 8) * tailLen;
      let sy = Math.sin(elapsedTime * 19 - i * 1.05) * (isC1 ? 5.2 : 3.2) * (1 - i * 0.04);
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = isC1 ? 4.4 : 2.8;
    ctx.stroke();

    // Inner glowing spine streak
    ctx.strokeStyle = coreCol;
    ctx.lineWidth = isC1 ? 1.8 : 1.2;
    ctx.stroke();

    // Flickering forked serpent tongue
    let tongueWag = Math.sin(elapsedTime * 28) * 1.4;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(r * 1.15, 0);
    ctx.lineTo(r * 1.65, tongueWag * 0.4);
    ctx.lineTo(r * 2.0, -2.0 + tongueWag);
    ctx.moveTo(r * 1.65, tongueWag * 0.4);
    ctx.lineTo(r * 2.0, 2.0 + tongueWag);
    ctx.stroke();

    // Horned viper head + glowing slit eyes
    ctx.fillStyle = bodyCol;
    ctx.strokeStyle = "#042F2E";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r * 1.32, 0);
    ctx.lineTo(-r * 0.15, -r * 0.78);
    ctx.lineTo(-r * 0.45, -r * 0.45);
    ctx.lineTo(-r * 0.08, 0);
    ctx.lineTo(-r * 0.45, r * 0.45);
    ctx.lineTo(-r * 0.15, r * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = finCol;
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.24, r * 0.17, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.24, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.style === "nhi_arrow_purple" || h.style === "nhi_arrow_green" || h.style === "nhi_arrow_life") {
    let isPurple = h.style === "nhi_arrow_purple";
    let isGreen = h.style === "nhi_arrow_green";
    let col = isMono ? "#FFFFFF" : isPurple ? "#E879F9" : isGreen ? "#4ADE80" : "#2DD4BF";
    let dark = isMono ? "#111111" : isPurple ? "#581C87" : isGreen ? "#14532D" : "#115E59";

    // Spiral elixir wake behind bolt
    let wake = ctx.createLinearGradient(-24, 0, 12, 0);
    wake.addColorStop(0, "rgba(0,0,0,0)");
    wake.addColorStop(1, isMono ? "rgba(255,255,255,0.75)" : `${col}BB`);
    ctx.strokeStyle = wake;
    ctx.lineWidth = 4.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    let aura = ctx.createRadialGradient(4, 0, 1, 4, 0, 15);
    aura.addColorStop(0, "#FFFFFF");
    aura.addColorStop(0.45, col);
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(4, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Fletching tail fins
    ctx.fillStyle = col;
    for (let s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-22, s * 4.2);
      ctx.lineTo(-14, s * 1.4);
      ctx.closePath();
      ctx.fill();
    }

    // Venom arrow shaft
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    // Barbed crystal broadhead
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(5, -5.2);
    ctx.lineTo(8, 0);
    ctx.lineTo(5, 5.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.style === "nhi_c2_flask") {
    let spin = elapsedTime * 10.5;
    ctx.save();
    ctx.rotate(spin);
    let glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 19);
    glow.addColorStop(0, isMono ? "#FFFFFF" : "#D9F99D");
    glow.addColorStop(0.55, isMono ? "#BBBBBB" : "#22C55E");
    glow.addColorStop(1, "rgba(34,197,94,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Glass venom bottle silhouette + cork + liquid fill
    ctx.fillStyle = isMono ? "#222222" : "#1E1B2E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#D8B4FE";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 2, 7.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Swirling dual-tone reagent inside glass sphere
    ctx.fillStyle = isMono ? "#FFFFFF" : "#A855F7";
    ctx.beginPath();
    ctx.arc(0, 2.2, 5.8, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isMono ? "#E5E5E5" : "#4ADE80";
    ctx.beginPath();
    ctx.arc(0, 2.2, 5.2, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Neck & amber cork stopper
    ctx.fillStyle = isMono ? "#CCCCCC" : "#F59E0B";
    ctx.strokeStyle = "#052E16";
    ctx.lineWidth = 1.1;
    ctx.fillRect(-2.6, -9.5, 5.2, 4.5);
    ctx.strokeRect(-2.6, -9.5, 5.2, 4.5);
    // Specular glass reflection dot
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-2.5, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (h.style === "nhi_c3_arrow") {
    let glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    glow.addColorStop(0, "#FFFFFF");
    glow.addColorStop(0.32, isMono ? "#E5E5E5" : "#E879F9");
    glow.addColorStop(0.68, isMono ? "#999999" : "#22C55E");
    glow.addColorStop(1, "rgba(34,197,94,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Triple-helix venom contrail + sonic shock rings
    ctx.lineCap = "round";
    for (let s of [-1, 1]) {
      ctx.strokeStyle = s > 0 ? (isMono ? "#FFFFFF" : "#E879F9") : (isMono ? "#CCCCCC" : "#4ADE80");
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        let sx = 8 - i * 4.4;
        let sy = Math.sin(elapsedTime * 24 + i * 0.85) * 6.4 * s;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Sonic shock chevrons behind lance head
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(240, 171, 252, 0.85)";
    ctx.lineWidth = 2.0;
    for (let cx of [2, -8]) {
      ctx.beginPath();
      ctx.moveTo(cx - 5, -9);
      ctx.lineTo(cx + 4, 0);
      ctx.lineTo(cx - 5, 9);
      ctx.stroke();
    }

    // Piercing crystalline execution lance head
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = isMono ? "#000000" : "#581C87";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(4, -8.5);
    ctx.lineTo(9, 0);
    ctx.lineTo(4, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 11, 0, 6.2, 2.0, "#E879F9", "#FFFFFF");
    return;
  }

  if (h.kind === "minh_orb") {
    let r = h.radius || 9;
    let halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.2);
    halo.addColorStop(0, "#FFFFFF");
    halo.addColorStop(0.45, isMono ? "rgba(255,255,255,0.55)" : "rgba(56, 189, 248, 0.6)");
    halo.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    let grad = ctx.createLinearGradient(-28, 0, 10, 0);
    grad.addColorStop(0, "rgba(56, 189, 248, 0)");
    grad.addColorStop(0.6, isMono ? "rgba(255,255,255,0.45)" : "rgba(56, 189, 248, 0.65)");
    grad.addColorStop(1, isMono ? "#FFFFFF" : "#FDE047");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 4.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Rotating sacred seal ring around orb
    ctx.save();
    ctx.rotate(elapsedTime * 7);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#1D4ED8";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, 0, 0, r * 1.28, r * 0.42, "#FEF08A", "#FFFFFF");
    return;
  }

  if (h.kind === "minh_chain") {
    let cGlow = ctx.createRadialGradient(8, 0, 2, 8, 0, 26);
    cGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(254, 240, 138, 0.72)");
    cGlow.addColorStop(0.55, isMono ? "rgba(120,120,120,0.3)" : "rgba(56, 189, 248, 0.38)");
    cGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(8, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Luminous golden-cyan energy trail under chains
    let trailGrad = ctx.createLinearGradient(-76, 0, 18, 0);
    trailGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    trailGrad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.45)" : "rgba(56, 189, 248, 0.52)");
    trailGrad.addColorStop(1, isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.72)");
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 10.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-76, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    // Orbiting sacred seal halo behind anchor head
    ctx.save();
    ctx.translate(-8, 0);
    ctx.rotate(elapsedTime * 8);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    let links = 7;
    for (let i = 1; i <= links; i++) {
      let lx = -i * 10.5;
      let ly = Math.sin(elapsedTime * 17 - i * 0.9) * 2.8;
      ctx.strokeStyle = isMono ? "#111111" : "#1E3A8A";
      ctx.lineWidth = 5.0;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 6.8, 3.8, i % 2 === 0 ? 0.22 : -0.22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FDE047" : "#38BDF8";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Glowing anchor lock ring & barbed spearhead seal
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(2, 0, 9.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.strokeStyle = isMono ? "#000000" : "#1E3A8A";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(3, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(3, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 10, 0, 8.8, 2.6, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "citadel_tower_bolt") {
    let trailGrad = ctx.createLinearGradient(-34, 0, 12, 0);
    trailGrad.addColorStop(0, "rgba(127, 29, 29, 0)");
    trailGrad.addColorStop(0.6, isMono ? "rgba(0,0,0,0.45)" : "rgba(220, 38, 38, 0.55)");
    trailGrad.addColorStop(1, isMono ? "#000000" : "#FCA5A5");
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 6.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#111111" : "#991B1B";
    ctx.strokeStyle = isMono ? "#000000" : "#FCA5A5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-4, -7.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-4, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEE2E2";
    ctx.beginPath();
    ctx.arc(3, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.kind === "bach_gale_blade") {
    let spin = elapsedTime * 26;
    let r = h.radius || 18;
    ctx.save();
    // Dual sonic wind slipstream ribbons trailing the spinning cyclone shuriken
    let wake = ctx.createLinearGradient(-68, 0, 16, 0);
    wake.addColorStop(0, "rgba(34, 211, 238, 0)");
    wake.addColorStop(0.5, isMono ? "rgba(255,255,255,0.34)" : "rgba(34, 211, 238, 0.56)");
    wake.addColorStop(1, isMono ? "rgba(255,255,255,0.78)" : "rgba(232, 121, 249, 0.85)");
    ctx.strokeStyle = wake;
    ctx.lineWidth = r * 0.92;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-66, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    for (let s of [-1, 1]) {
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.65)" : s < 0 ? "rgba(103, 232, 249, 0.8)" : "rgba(232, 121, 249, 0.8)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-54, s * (r * 0.72));
      ctx.quadraticCurveTo(-18, s * (r * 0.25), 14, s * (r * 0.85));
      ctx.stroke();
    }

    ctx.rotate(spin);
    // Outer wind vortex halo
    let g = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r * 1.78);
    g.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    g.addColorStop(0.38, isMono ? "rgba(255,255,255,0.42)" : "rgba(103, 232, 249, 0.62)");
    g.addColorStop(0.74, isMono ? "rgba(120,120,120,0.18)" : "rgba(232, 121, 249, 0.36)");
    g.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.78, 0, Math.PI * 2);
    ctx.fill();

    // Swept dual outer gale ring arcs
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(165, 243, 252, 0.85)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.42, 0, Math.PI * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.42, Math.PI, Math.PI * 1.85);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#67E8F9" : "#E879F9";
      ctx.strokeStyle = isMono ? "#000000" : "#FFFFFF";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, -3.5);
      ctx.quadraticCurveTo(r * 1.35, -11, r * 1.62, 0);
      ctx.quadraticCurveTo(r * 0.78, 4.8, 2, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, 9.2, 2.8, "#FFFFFF", isMono ? "#000000" : "#22D3EE");
    ctx.restore();
    return;
  }

  if (h.kind === "bach_dagger") {
    let tg = ctx.createLinearGradient(-64, 0, 18, 0);
    tg.addColorStop(0, "rgba(34, 211, 238, 0)");
    tg.addColorStop(0.5, isMono ? "rgba(255,255,255,0.45)" : "rgba(34, 211, 238, 0.65)");
    tg.addColorStop(1, isMono ? "rgba(255,255,255,0.9)" : "rgba(232, 121, 249, 0.92)");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 7.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-64, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    // Twin edge wind-ribbons & afterimage chevron
    for (let s of [-1, 1]) {
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.58)" : "rgba(165, 243, 252, 0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-42, s * 7.5);
      ctx.quadraticCurveTo(-14, s * 2.5, 10, s * 5.2);
      ctx.stroke();
    }

    ctx.fillStyle = isMono ? "#FFFFFF" : "#A5F3FC";
    ctx.strokeStyle = isMono ? "#000000" : "#E879F9";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(-6, -7.2);
    ctx.lineTo(2, 0);
    ctx.lineTo(-6, 7.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 9, 0, 6.4, 2.0, "#FFFFFF", isMono ? "#000000" : "#22D3EE");
    return;
  }

  if (h.kind === "thai_arena_wave") {
    let wGlow = ctx.createRadialGradient(8, 0, 4, 8, 0, 42);
    wGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.68)" : "rgba(254, 240, 138, 0.72)");
    wGlow.addColorStop(0.55, isMono ? "rgba(120,120,120,0.34)" : "rgba(239, 68, 68, 0.44)");
    wGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = wGlow;
    ctx.beginPath();
    ctx.arc(8, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    let tg = ctx.createLinearGradient(-74, 0, 22, 0);
    tg.addColorStop(0, "rgba(239, 68, 68, 0)");
    tg.addColorStop(0.55, isMono ? "rgba(180,180,180,0.5)" : "rgba(239, 68, 68, 0.65)");
    tg.addColorStop(1, isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.94)");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 17;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-74, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    // Shock cone + blazing war-ember trails around the imperial crescent
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.85)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(-22, -31);
    ctx.moveTo(28, 0);
    ctx.lineTo(-22, 31);
    ctx.stroke();

    let cg = ctx.createLinearGradient(-18, -28, 28, 28);
    cg.addColorStop(0, "#DC2626");
    cg.addColorStop(0.55, "#F59E0B");
    cg.addColorStop(1, "#FEF08A");
    ctx.fillStyle = isMono ? "#FFFFFF" : cg;
    ctx.strokeStyle = isMono ? "#000000" : "#FFFFFF";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(29, 0);
    ctx.quadraticCurveTo(9, -32, -19, -29);
    ctx.quadraticCurveTo(4, 0, -19, 29);
    ctx.quadraticCurveTo(9, 32, 29, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawTaperedArc(ctx, 4, 0, 26, -0.88, 0.88, 5.2, "#FEF08A", "#FFFFFF", isMono);
    drawFourPointStar(ctx, 16, 0, 11.2, 3.2, "#FFFFFF", isMono ? "#000000" : "#F59E0B");
    return;
  }

  if (h.kind === "khair_bullet") {
    let tg = ctx.createLinearGradient(-72, 0, 16, 0);
    tg.addColorStop(0, "rgba(16, 185, 129, 0)");
    tg.addColorStop(0.55, isMono ? "rgba(255,255,255,0.55)" : "rgba(74, 222, 128, 0.7)");
    tg.addColorStop(1, isMono ? "#FFFFFF" : "#FEF08A");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 5.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-72, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Crisp hot tracer core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    // Micro supersonic chevron
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(250, 204, 21, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-10, -9);
    ctx.moveTo(12, 0);
    ctx.lineTo(-10, 9);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-2, -4.8);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-2, 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 8, 0, 5.5, 1.8, "#FFFFFF", isMono ? "#000000" : "#4ADE80");
    return;
  }

  if (h.kind === "khair_c2_sniper") {
    // Colossal Viễn Kích Xuyên Thấu Rail-Cannon Plasma Spear with plasma helix & double Mach cones
    let cGlow = ctx.createRadialGradient(14, 0, 3, 14, 0, 38);
    cGlow.addColorStop(0, "#FFFFFF");
    cGlow.addColorStop(0.45, isMono ? "rgba(255,255,255,0.6)" : "rgba(250, 204, 21, 0.68)");
    cGlow.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(14, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    let wake = ctx.createLinearGradient(-185, 0, 36, 0);
    wake.addColorStop(0, "rgba(16, 185, 129, 0)");
    wake.addColorStop(0.32, isMono ? "rgba(255,255,255,0.38)" : "rgba(74, 222, 128, 0.68)");
    wake.addColorStop(0.75, isMono ? "rgba(255,255,255,0.82)" : "rgba(250, 204, 21, 0.96)");
    wake.addColorStop(1, "#FFFFFF");
    ctx.strokeStyle = wake;
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-185, 0);
    ctx.lineTo(28, 0);
    ctx.stroke();

    // Twin helical ionized filaments twisting along sniper path
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      let px = 20 - i * 12;
      let py = Math.sin(elapsedTime * 30 + i * 0.75) * 9.5;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Inner blinding hot core beam
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6.8;
    ctx.beginPath();
    ctx.moveTo(-125, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();

    // Sonic Mach compression rings along trail
    for (let mr of [-96, -54, -22]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(74, 222, 128, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(mr, 0, 5, mr === -22 ? 18 : mr === -54 ? 14 : 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dual supersonic Mach shock cones around the round
    for (let k of [-1, 1]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : k === -1 ? "rgba(253, 224, 71, 0.94)" : "rgba(74, 222, 128, 0.9)";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(-28, k * 23);
      ctx.moveTo(8, 0);
      ctx.lineTo(-52, k * 30);
      ctx.stroke();
    }

    // Massive emerald-gold armored rail-spearhead
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(42, 0);
    ctx.lineTo(3, -12.5);
    ctx.lineTo(12, 0);
    ctx.lineTo(3, 12.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawFourPointStar(ctx, 22, 0, 15, 4.5, "#FFFFFF", isMono ? "#000000" : "#FACC15");
    return;
  }

  if (h.kind === "khair_c3_shell") {
    let tg = ctx.createLinearGradient(-96, 0, 20, 0);
    tg.addColorStop(0, "rgba(16, 185, 129, 0)");
    tg.addColorStop(0.45, isMono ? "rgba(255,255,255,0.45)" : "rgba(74, 222, 128, 0.72)");
    tg.addColorStop(0.8, isMono ? "rgba(255,255,255,0.8)" : "rgba(250, 204, 21, 0.92)");
    tg.addColorStop(1, "#FFFFFF");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-96, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-54, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();

    // Shock ring + supersonic fin chevron
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(74, 222, 128, 0.85)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(-22, 0, 4.5, 13, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(-5, -10.5);
    ctx.lineTo(2, 0);
    ctx.lineTo(-5, 10.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 12, 0, 11, 3.3, "#FFFFFF", isMono ? "#000000" : "#4ADE80");
    return;
  }

  if (h.kind === "slash_wave") {
    let sc = Math.max(1.0, (h.radius || 18) / 16);
    ctx.scale(sc, sc);
    let cGlow = ctx.createRadialGradient(4, 0, 2, 4, 0, 32);
    cGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.68)" : "rgba(254, 240, 138, 0.58)");
    cGlow.addColorStop(0.55, isMono ? "rgba(0,0,0,0.24)" : "rgba(56, 189, 248, 0.36)");
    cGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(4, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    let wake = ctx.createLinearGradient(-46, 0, 16, 0);
    wake.addColorStop(0, "rgba(56, 189, 248, 0)");
    wake.addColorStop(0.55, isMono ? "rgba(0,0,0,0.42)" : "rgba(56, 189, 248, 0.52)");
    wake.addColorStop(1, isMono ? "#FFFFFF" : "#FACC15");
    ctx.strokeStyle = wake;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    // Twin celestial starlight flanking ribbons
    for (let s of [-1, 1]) {
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.55)" : "rgba(186, 230, 253, 0.72)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-28, s * 14);
      ctx.quadraticCurveTo(-4, s * 7, 16, s * 10);
      ctx.stroke();
    }

    drawTaperedArc(ctx, -2, 0, 28, -1.08, 1.08, 10.5, "#38BDF8", "#FACC15", isMono);
    drawTaperedArc(ctx, 4, 0, 24, -0.88, 0.88, 5.4, "#FACC15", "#FFFFFF", isMono);
    drawFourPointStar(ctx, 22, 0, 8.2, 2.3, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  let pr = Math.max(4, h.radius || 7);
  let glow = ctx.createRadialGradient(0, 0, 1, 0, 0, pr * 2.1);
  glow.addColorStop(0, isMono ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.65)");
  glow.addColorStop(0.55, isMono ? "rgba(0,0,0,0.22)" : `${h.color || "#38BDF8"}55`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, pr * 2.1, 0, Math.PI * 2);
  ctx.fill();

  let tailG = ctx.createLinearGradient(-pr * 2.8, 0, pr, 0);
  tailG.addColorStop(0, "rgba(0,0,0,0)");
  tailG.addColorStop(1, isMono ? "rgba(255,255,255,0.75)" : h.color || "#38BDF8");
  ctx.strokeStyle = tailG;
  ctx.lineWidth = pr * 1.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-pr * 2.6, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  let coreG = ctx.createRadialGradient(-pr * 0.25, -pr * 0.25, 1, 0, 0, pr);
  coreG.addColorStop(0, "#FFFFFF");
  coreG.addColorStop(0.5, isMono ? "#333333" : h.color || "#38BDF8");
  coreG.addColorStop(1, isMono ? "#000000" : "#0F172A");
  ctx.beginPath();
  ctx.arc(0, 0, pr, 0, Math.PI * 2);
  ctx.fillStyle = coreG;
  ctx.fill();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FFFFFF";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  drawFourPointStar(ctx, 0, 0, pr * 0.85, pr * 0.28, "#FFFFFF", isMono ? "#000000" : h.color || "#38BDF8");
}

export function drawUpgradedSlash(ctx, h, f, isMono, enableAdditive = true) {
  let alpha = Math.max(0, 1 - f);
  if (h.kind === "shockwave") {
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.68));
    let accent = isMono ? "#FFFFFF" : h.accentColor || "#FFFFFF";
    let main = isMono ? "#000000" : h.color || "#38BDF8";
    let ringGrad = ctx.createRadialGradient(h.x, h.y, r * 0.25, h.x, h.y, r);
    ringGrad.addColorStop(0, "rgba(255,255,255,0)");
    ringGrad.addColorStop(0.55, isMono ? `rgba(255,255,255,${0.12 * alpha})` : `rgba(255,255,255,${0.14 * alpha})`);
    ringGrad.addColorStop(0.82, isMono ? `rgba(0,0,0,${0.26 * alpha})` : `rgba(255,255,255,${0.28 * alpha})`);
    ringGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Primary shock ring + additive neon pressure aura
    ctx.save();
    if (!isMono && enableAdditive) ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = main;
    ctx.lineWidth = 6.6 * alpha + 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.84, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.8 * alpha + 0.8;
    ctx.stroke();
    ctx.restore();

    // Rotating arcane shock segments + outward speed rays
    ctx.save();
    ctx.strokeStyle = isMono ? "#CCCCCC" : h.color;
    ctx.lineWidth = 1.8 * alpha + 0.5;
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.64, f * 1.8, f * 1.8 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    for (let si = 0; si < 12; si++) {
      let sa = (Math.PI / 6) * si + f * 0.6;
      ctx.strokeStyle = si % 2 === 0 ? accent : main;
      ctx.lineWidth = (si % 2 === 0 ? 2.0 : 1.3) * alpha;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(sa) * r * 0.72, h.y + Math.sin(sa) * r * 0.72);
      ctx.lineTo(h.x + Math.cos(sa) * r * 1.12, h.y + Math.sin(sa) * r * 1.12);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "gau_shockring") {
    let v = h.radius * (0.18 + 0.82 * Math.pow(f, 0.66));
    let sGrad = ctx.createRadialGradient(h.x, h.y, v * 0.18, h.x, h.y, v);
    sGrad.addColorStop(0, "rgba(251, 191, 36, 0)");
    sGrad.addColorStop(0.55, isMono ? "rgba(120,120,120,0.22)" : `rgba(249, 115, 22, ${0.38 * alpha})`);
    sGrad.addColorStop(0.85, isMono ? "rgba(0,0,0,0.3)" : `rgba(234, 88, 12, ${0.32 * alpha})`);
    sGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.fill();

    // Jagged seismic shock rim
    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color;
    ctx.lineWidth = (h.heavy ? 9.0 : 6.4) * alpha + 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, v * 0.78, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.2 * alpha + 0.9;
    ctx.stroke();

    // Tectonic crack spokes + flying shattered rock chips
    for (let i = 0; i < 8; i++) {
      let ang = (Math.PI / 4) * i + f * 0.35;
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 2.8 * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(ang) * v * 0.45, h.y + Math.sin(ang) * v * 0.45);
      ctx.lineTo(h.x + Math.cos(ang + 0.08) * v * 0.8, h.y + Math.sin(ang + 0.08) * v * 0.8);
      ctx.lineTo(h.x + Math.cos(ang) * v * 1.12, h.y + Math.sin(ang) * v * 1.12);
      ctx.stroke();

      let rx = h.x + Math.cos(ang + 0.2) * v * (0.76 + f * 0.28);
      let ry = h.y + Math.sin(ang + 0.2) * v * (0.76 + f * 0.28);
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(ang + f * 4);
      ctx.fillStyle = isMono ? "#333333" : "#78350F";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, -4.5 * alpha);
      ctx.lineTo(4 * alpha, 2 * alpha);
      ctx.lineTo(-3.5 * alpha, 3.5 * alpha);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  if (h.kind === "gau_punch") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let v = h.comboStep || 0;
    let T = 26 + f * (h.radius * 0.72);
    let pAura = ctx.createRadialGradient(T * 0.7, 0, 4, T * 0.7, 0, 32);
    pAura.addColorStop(0, isMono ? "rgba(255,255,255,0.45)" : `rgba(254, 240, 138, ${0.42 * alpha})`);
    pAura.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = pAura;
    ctx.beginPath();
    ctx.arc(T * 0.7, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    if (v > 0) {
      for (let b = -1; b <= 1; b++) {
        let y = b * 15;
        let C = T - Math.abs(b) * 14;
        ctx.strokeStyle = b === 0 ? "#FEF08A" : h.color;
        ctx.lineWidth = (b === 0 ? 5.5 : 3.2) * alpha + 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(Math.max(12, C - 38), y);
        ctx.lineTo(C + 12, y);
        ctx.stroke();
      }
      drawTaperedArc(ctx, T - 4, 0, 22, -1.15, 1.15, (v === 3 ? 11 : 7.5) * alpha + 2, h.color, "#FEF08A", isMono);
      drawFourPointStar(ctx, T + 14, 0, 8 * alpha, 2.2 * alpha, "#FEF08A", h.color);
    } else {
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 4.8 * alpha + 1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(14, -7);
      ctx.lineTo(T, -7);
      ctx.moveTo(10, 0);
      ctx.lineTo(T + 14, 0);
      ctx.moveTo(14, 7);
      ctx.lineTo(T, 7);
      ctx.stroke();
      drawTaperedArc(ctx, T - 4, 0, 17, -1.05, 1.05, 7.5 * alpha + 2, h.color, "#FEF08A", isMono);
    }
    return;
  }

  if (h.kind === "bao_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let startA = (-h.spread / 2) * dir;
    let sweepEnd = (-h.spread / 2 + h.spread * Math.min(1, f * 1.85 + 0.35)) * dir;
    let bGrad = ctx.createRadialGradient(0, 0, h.radius * 0.25, 0, 0, h.radius * 1.1);
    bGrad.addColorStop(0, "rgba(147, 51, 234, 0)");
    bGrad.addColorStop(0.68, isMono ? `rgba(255,255,255,${0.2 * alpha})` : `rgba(168, 85, 247, ${0.32 * alpha})`);
    bGrad.addColorStop(1, "rgba(232, 121, 249, 0)");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, h.radius * 1.1, Math.min(startA, sweepEnd), Math.max(startA, sweepEnd));
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: h.radius * 0.96, startAng: startA, endAng: sweepEnd, f, color: "#9333EA", accentColor: "#E879F9", isMono, enableAdditive, tiltY: 0.84, crackStrength: h.crossed ? 1.15 : 0.78, seed: 3 });
    drawTaperedArc(ctx, 0, 0, h.radius, startA, sweepEnd, 12.5 * alpha + 2, "#9333EA", "#F5D0FE", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.76, startA * 0.85, sweepEnd * 0.9, 6.2 * alpha + 1, "#E879F9", "#FFFFFF", isMono);
    for (let si = -1; si <= 1; si++) {
      let sa = si * h.spread * 0.28 * dir;
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(245, 208, 254, ${0.75 * alpha})`;
      ctx.lineWidth = 1.6 * alpha + 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * h.radius * 0.55, Math.sin(sa) * h.radius * 0.55);
      ctx.lineTo(Math.cos(sa) * h.radius * 1.12, Math.sin(sa) * h.radius * 1.12);
      ctx.stroke();
    }
    if (h.crossed) {
      drawTaperedArc(ctx, 0, 0, h.radius * 0.88, h.spread * 0.5, -h.spread * 0.5, 8.5 * alpha + 1.5, "#E879F9", "#FFFFFF", isMono);
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * h.radius, Math.sin(sweepEnd) * h.radius, 8 * alpha, 2.2 * alpha, "#F5D0FE", isMono ? "#000000" : "#9333EA");
    return;
  }

  if (h.kind === "danh_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let startA = (-h.spread / 2) * dir;
    let sweepEnd = (-h.spread / 2 + h.spread * Math.min(1, f * 1.75 + 0.35)) * dir;
    let dGrad = ctx.createRadialGradient(0, 0, h.radius * 0.25, 0, 0, h.radius * 1.12);
    dGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
    dGrad.addColorStop(0.68, isMono ? `rgba(255,255,255,${0.2 * alpha})` : `rgba(249, 115, 22, ${0.32 * alpha})`);
    dGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, h.radius * 1.12, Math.min(startA, sweepEnd), Math.max(startA, sweepEnd));
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: h.radius * 0.96, startAng: startA, endAng: sweepEnd, f, color: h.color || "#EF4444", accentColor: "#FBBF24", isMono, enableAdditive, tiltY: 0.86, crackStrength: h.empowered ? 1.15 : 0.72, seed: 5 });
    drawTaperedArc(ctx, 0, 0, h.radius, startA, sweepEnd, (h.empowered ? 14.5 : 11.5) * alpha + 2, h.color, "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.78, startA * 0.85, sweepEnd * 0.88, 6.2 * alpha + 1, "#F59E0B", "#FFFFFF", isMono);
    for (let fi = -1; fi <= 1; fi++) {
      let fa = fi * h.spread * 0.26;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.beginPath();
      ctx.arc(Math.cos(fa) * h.radius * (0.94 + f * 0.14), Math.sin(fa) * h.radius * (0.94 + f * 0.14), 2.4 * alpha + 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * h.radius, Math.sin(sweepEnd) * h.radius, 8.5 * alpha, 2.4 * alpha, "#FEF08A", isMono ? "#000000" : h.color);
    return;
  }

  if (h.kind === "danh_kiem_khi_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let step = h.step || 1;
    let tilt = step === 1 ? -0.32 : step === 2 ? 0.32 : 0;
    ctx.rotate(tilt);
    ctx.scale(1, step === 3 ? 0.88 : 0.72);
    let kGrad = ctx.createRadialGradient(f * 18, 0, h.radius * 0.3, f * 18, 0, h.radius * 1.08);
    kGrad.addColorStop(0, "rgba(251, 146, 60, 0)");
    kGrad.addColorStop(0.7, isMono ? `rgba(255,255,255,${0.22 * alpha})` : `rgba(239, 68, 68, ${0.34 * alpha})`);
    kGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = kGrad;
    ctx.beginPath();
    ctx.moveTo(f * 18, 0);
    ctx.arc(f * 18, 0, h.radius * 1.08, -h.spread / 2, h.spread / 2);
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: f * 18, cy: 0, radius: h.radius * 0.98, startAng: -h.spread / 2, endAng: h.spread / 2, f, color: h.color || "#EF4444", accentColor: "#FEF08A", isMono, enableAdditive, tiltY: 0.92, crackStrength: step === 3 ? 1.25 : 0.82, seed: step + 7 });
    drawTaperedArc(ctx, f * 18, 0, h.radius, -h.spread / 2, h.spread / 2, (step === 3 ? 15 : 11) * alpha + 2, h.color, "#FFFFFF", isMono);
    drawTaperedArc(ctx, f * 22, 0, h.radius * 0.8, -h.spread * 0.42, h.spread * 0.42, 6 * alpha + 1, "#FEF08A", "#FFFFFF", isMono);
    drawFourPointStar(ctx, f * 20 + h.radius, 0, (step === 3 ? 11 : 8) * alpha, 2.4 * alpha, "#FEF08A", isMono ? "#000000" : h.color);
    return;
  }

  if (h.kind === "phong_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let startA = (-h.spread / 2) * dir;
    let sweepEnd = (-h.spread / 2 + h.spread * Math.min(1, f * 1.9 + 0.3)) * dir;
    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: h.radius * 0.96, startAng: startA, endAng: sweepEnd, f, color: h.isCrit ? "#FACC15" : h.color || "#0EA5E9", accentColor: h.isCrit ? "#F43F5E" : "#67E8F9", isMono, enableAdditive, tiltY: 0.84, crackStrength: h.isCrit ? 1.22 : 0.82, seed: 11 });
    drawTaperedArc(ctx, 0, 0, h.radius, startA, sweepEnd, (h.isCrit ? 15.5 : 11) * alpha + 2, h.isCrit ? "#FACC15" : h.color || "#0EA5E9", "#67E8F9", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.78, startA * 0.85, sweepEnd * 0.9, 6 * alpha + 1.2, "#22D3EE", "#FFFFFF", isMono);
    if (h.crossed) {
      drawTaperedArc(ctx, 0, 0, h.radius * 0.92, h.spread * 0.52, -h.spread * 0.52, 8.5 * alpha + 1.5, h.isCrit ? "#38BDF8" : "#0EA5E9", "#FFFFFF", isMono);
      drawFourPointStar(ctx, h.radius * 0.48, 0, 12 * alpha, 3 * alpha, "#E0F2FE", h.isCrit ? "#FACC15" : "#22D3EE");
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * h.radius, Math.sin(sweepEnd) * h.radius, (h.isCrit ? 12 : 7.5) * alpha, 2.4 * alpha, "#E0F2FE", "#0EA5E9");
    return;
  }

  if (h.kind === "phong_swap_burst") {
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.65));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.15, h.x, h.y, r);
    grad.addColorStop(0, "rgba(224, 242, 254, 0)");
    grad.addColorStop(0.58, isMono ? `rgba(255,255,255,${0.32 * alpha})` : `rgba(14, 165, 233, ${0.46 * alpha})`);
    grad.addColorStop(0.86, isMono ? `rgba(0,0,0,${0.22 * alpha})` : `rgba(34, 211, 238, ${0.34 * alpha})`);
    grad.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 7.2 * alpha + 1.6;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 3.0 * alpha + 0.6;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    // 8 swirling phantom shadow-blade crescents radiating out
    for (let bi = 0; bi < 8; bi++) {
      let ba = f * 4.2 + (Math.PI / 4) * bi;
      ctx.strokeStyle = isMono ? "#FFFFFF" : bi % 2 === 0 ? "#67E8F9" : "#0EA5E9";
      ctx.lineWidth = 2.8 * alpha + 0.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(ba) * r * 0.25, h.y + Math.sin(ba) * r * 0.25);
      ctx.quadraticCurveTo(
        h.x + Math.cos(ba + 0.28) * r * 0.64,
        h.y + Math.sin(ba + 0.28) * r * 0.64,
        h.x + Math.cos(ba + 0.14) * r * 1.04,
        h.y + Math.sin(ba + 0.14) * r * 1.04
      );
      ctx.stroke();
    }
    drawFourPointStar(ctx, h.x, h.y, r * 0.28 * alpha + 5, 3.0, "#FFFFFF", isMono ? "#000000" : "#22D3EE");
    return;
  }

  if (h.kind === "phong_c3_mark") {
    let r = (h.radius || 58) * (0.64 + 0.36 * Math.sin(f * Math.PI));
    ctx.save();
    ctx.translate(h.x, h.y);
    let mGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    mGrad.addColorStop(0, isMono ? `rgba(255,255,255,${0.28 * alpha})` : `rgba(244, 63, 94, ${0.3 * alpha})`);
    mGrad.addColorStop(0.7, isMono ? `rgba(0,0,0,${0.18 * alpha})` : `rgba(34, 211, 238, ${0.22 * alpha})`);
    mGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(f * 2.6);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 3.8 * alpha + 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#CCCCCC" : "#FACC15";
    ctx.lineWidth = 2.0 * alpha;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
    ctx.lineWidth = 5.4 * alpha + 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 1.02, -r * 1.02);
    ctx.lineTo(r * 1.02, r * 1.02);
    ctx.moveTo(-r * 1.02, r * 1.02);
    ctx.lineTo(r * 1.02, -r * 1.02);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8 * alpha;
    ctx.stroke();

    for (let k = 0; k < 4; k++) {
      let ka = (Math.PI / 2) * k;
      ctx.fillStyle = isMono ? "#FFFFFF" : k % 2 === 0 ? "#22D3EE" : "#F43F5E";
      ctx.beginPath();
      ctx.moveTo(Math.cos(ka) * r * 1.22, Math.sin(ka) * r * 1.22);
      ctx.lineTo(Math.cos(ka + 0.16) * r * 0.72, Math.sin(ka + 0.16) * r * 0.72);
      ctx.lineTo(Math.cos(ka - 0.16) * r * 0.72, Math.sin(ka - 0.16) * r * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    drawFourPointStar(ctx, 0, 0, 16 * alpha, 3.8 * alpha, "#E0F2FE", isMono ? "#000000" : "#0EA5E9");
    ctx.restore();
    return;
  }

  if (h.kind === "dang_punch") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let reach = 24 + f * (h.radius * 0.84);
    // Ink-wash Tiger-Claw qi shock lines (Black & White alternating)
    for (let ci = -1; ci <= 1; ci++) {
      let yOff = ci * 11 * dir;
      ctx.strokeStyle = ci === 0 ? "#F8FAFC" : "#09090B";
      ctx.lineWidth = (ci === 0 ? 5.6 : 7.8) * alpha + 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(10, yOff * 0.9);
      ctx.quadraticCurveTo(reach * 0.55, yOff * 1.18, reach + (ci === 0 ? 20 : 8), yOff * 0.52);
      ctx.stroke();
    }
    drawTaperedArc(ctx, reach - 4, 0, 26, -1.25, 1.25, 10.5 * alpha + 2, dir > 0 ? "#F8FAFC" : "#18181B", dir > 0 ? "#09090B" : "#F8FAFC", isMono);
    drawFourPointStar(ctx, reach + 18, 0, 9.5 * alpha, 2.5 * alpha, "#FFFFFF", "#09090B");
    return;
  }

  if (h.kind === "dang_tiger_fist_aoe" || h.kind === "dang_black_shield_boom") {
    let isShield = h.kind === "dang_black_shield_boom";
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.65));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.15, h.x, h.y, r);
    grad.addColorStop(0, "rgba(248, 250, 252, 0)");
    grad.addColorStop(0.58, isMono ? "rgba(0,0,0,0.34)" : `rgba(24, 24, 27, ${0.52 * alpha})`);
    grad.addColorStop(0.88, isMono ? "rgba(255,255,255,0.22)" : `rgba(248, 250, 252, ${0.26 * alpha})`);
    grad.addColorStop(1, "rgba(248, 250, 252, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Yin-Yang Half-Black Half-White kinetic shock ring
    ctx.lineCap = "round";
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = (isShield ? 11 : 13.5) * alpha + 2.2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = (isShield ? 10 : 12) * alpha + 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, Math.PI, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 4.6 * alpha + 1;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // Dramatic 4-claw Tiger Raking arcs across the impact center
    for (let i = -1.5; i <= 1.5; i += 1) {
      let off = i * r * 0.2;
      ctx.strokeStyle = Math.abs(i) < 1 ? "#F8FAFC" : "#09090B";
      ctx.lineWidth = (Math.abs(i) < 1 ? 5.2 : 4.0) * alpha + 0.8;
      ctx.beginPath();
      ctx.moveTo(h.x - r * 0.65, h.y + off - r * 0.26);
      ctx.quadraticCurveTo(h.x, h.y + off - r * 0.08, h.x + r * 0.65, h.y + off + r * 0.26);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "danh_dragon_shockring") {
    let v = h.radius * (0.18 + 0.82 * Math.pow(f, 0.6));
    let shockGrad = ctx.createRadialGradient(h.x, h.y, v * 0.2, h.x, h.y, v);
    shockGrad.addColorStop(0, "rgba(254, 240, 138, 0)");
    shockGrad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.22)" : `rgba(239, 68, 68, ${0.36 * alpha})`);
    shockGrad.addColorStop(0.85, isMono ? "rgba(255,255,255,0.25)" : `rgba(249, 115, 22, ${0.34 * alpha})`);
    shockGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = shockGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color;
    ctx.lineWidth = 11 * alpha + 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, v * 0.74, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 4.8 * alpha + 1.2;
    ctx.stroke();

    // Radial curving draconic flame tongues bursting outward
    for (let i = 0; i < 10; i++) {
      let ang = (Math.PI * 2 / 10) * i + f * 0.65;
      let ix = h.x + Math.cos(ang) * (v * 0.72);
      let iy = h.y + Math.sin(ang) * (v * 0.72);
      let mx = h.x + Math.cos(ang + 0.12) * (v * 0.94);
      let my = h.y + Math.sin(ang + 0.12) * (v * 0.94);
      let ox = h.x + Math.cos(ang) * (v * 1.16);
      let oy = h.y + Math.sin(ang) * (v * 1.16);
      ctx.strokeStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#F97316";
      ctx.lineWidth = 3.6 * alpha + 1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.quadraticCurveTo(mx, my, ox, oy);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "spear") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = h.radius * (0.55 + 0.45 * Math.min(1, f * 1.8));
    let isCerb = Boolean(h.cerberus);
    let isEmp = Boolean(h.empowered);
    drawTaperedArc(ctx, 0, 0, reach * 0.92, -h.spread * 0.44, h.spread * 0.44, (isCerb ? 12.5 : 9.4) * alpha + 1.6, h.color, isCerb ? "#FEF08A" : "#FFFFFF", isMono);
    if (isCerb || isEmp) {
      let fanCols = isCerb ? ["#38BDF8", "#FDE047", "#F43F5E"] : ["#38BDF8", "#FEF08A", "#67E8F9"];
      for (let idx = -1; idx <= 1; idx++) {
        let offA = idx * 0.24;
        let len = idx === 0 ? reach + 22 : reach * 0.9;
        ctx.save();
        ctx.rotate(offA);
        ctx.strokeStyle = isMono ? "#000000" : fanCols[idx + 1];
        ctx.lineWidth = (idx === 0 ? 7.2 : 4.6) * alpha + 1.1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.0 * alpha;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(len + 3, 0);
        ctx.stroke();
        ctx.restore();
      }
      drawFourPointStar(ctx, reach + 20, 0, (isCerb ? 14 : 11) * alpha, 3.0 * alpha, "#FEF08A", isCerb ? "#F43F5E" : h.color);
    } else {
      ctx.strokeStyle = isMono ? "#000000" : h.color;
      ctx.lineWidth = 6.0 * alpha + 1.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(reach + 14, 0);
      ctx.stroke();
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 2.4 * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(18, -6);
      ctx.bezierCurveTo(reach * 0.4, 9, reach * 0.7, -8, reach + 14, 0);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.1 * alpha;
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(reach + 16, 0);
      ctx.stroke();
      drawFourPointStar(ctx, reach + 16, 0, 9.2 * alpha, 2.4 * alpha, "#FFFFFF", h.color);
    }
    return;
  }

  if (h.kind === "dung_cerberus_bite") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let r = (h.radius || 68) * (0.5 + 0.5 * Math.pow(f, 0.58));
    let biteGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
    biteGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.52)" : `rgba(253, 224, 71, ${0.46 * alpha})`);
    biteGrad.addColorStop(0.65, isMono ? "rgba(0,0,0,0.24)" : `rgba(56, 189, 248, ${0.3 * alpha})`);
    biteGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = biteGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 3 ferocious Cerberus claw rakes + snapping abyssal fang arcs
    let cols = ["#38BDF8", "#FDE047", "#F43F5E"];
    for (let i = -1; i <= 1; i++) {
      let yOff = i * r * 0.25;
      ctx.strokeStyle = isMono ? "#000000" : cols[i + 1];
      ctx.lineWidth = (i === 0 ? 6.2 : 4.6) * alpha + 1.3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 0.74, yOff - r * 0.28);
      ctx.quadraticCurveTo(0, yOff + r * 0.08, r * 0.82, yOff + r * 0.26);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.8 * alpha;
      ctx.stroke();
    }
    // Snapping upper/lower hound fangs
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
      for (let fx of [-0.36, 0, 0.36]) {
        ctx.beginPath();
        ctx.moveTo(r * fx - 5, s * r * 0.58 * (1 - f * 0.4));
        ctx.lineTo(r * fx, s * r * 0.14);
        ctx.lineTo(r * fx + 5, s * r * 0.58 * (1 - f * 0.4));
        ctx.closePath();
        ctx.fill();
      }
    }
    drawTaperedArc(ctx, 0, 0, r * 0.88, -1.15, 1.15, 8 * alpha + 1.6, h.color || "#FDE047", "#FFFFFF", isMono);
    drawFourPointStar(ctx, 0, 0, 15 * alpha, 3.4 * alpha, "#FFFFFF", "#FDE047");
    return;
  }

  if (h.kind === "dung_c1_charge") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let reach = (h.radius || 175) * (0.4 + 0.6 * Math.min(1, f * 1.5));
    let coneGrad = ctx.createLinearGradient(0, 0, reach, 0);
    coneGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    coneGrad.addColorStop(0.45, isMono ? "rgba(255,255,255,0.42)" : `rgba(56, 189, 248, ${0.46 * alpha})`);
    coneGrad.addColorStop(1, isMono ? "rgba(255,255,255,0.78)" : `rgba(253, 224, 71, ${0.78 * alpha})`);
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(reach, 0);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.fill();

    for (let s of [-1, 0, 1]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : s === 0 ? "#FFFFFF" : s < 0 ? "#38BDF8" : "#FDE047";
      ctx.lineWidth = (s === 0 ? 5.4 : 3.6) * alpha + 0.9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-14, s * 18);
      ctx.lineTo(reach + (s === 0 ? 22 : -10), s * 4);
      ctx.stroke();
    }
    // Sonic shock chevrons along spear lunge
    for (let k = 0; k < 2; k++) {
      let cx = reach * (0.45 + k * 0.3);
      ctx.strokeStyle = isMono ? "#FFFFFF" : k === 0 ? "#38BDF8" : "#FEF08A";
      ctx.lineWidth = 2.4 * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - 18, -22);
      ctx.lineTo(cx + 8, 0);
      ctx.lineTo(cx - 18, 22);
      ctx.stroke();
    }
    drawFourPointStar(ctx, reach + 12, 0, 15 * alpha, 3.4 * alpha, "#FEF08A", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "dung_c2_awaken") {
    let r = (h.radius || 125) * (0.2 + 0.8 * Math.pow(f, 0.6));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.14, h.x, h.y, r);
    grad.addColorStop(0, "rgba(254, 240, 138, 0)");
    grad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.34)" : `rgba(249, 115, 22, ${0.42 * alpha})`);
    grad.addColorStop(0.85, isMono ? "rgba(0,0,0,0.28)" : `rgba(244, 63, 94, ${0.36 * alpha})`);
    grad.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : h.color || "#F59E0B";
    ctx.lineWidth = 9.5 * alpha + 1.8;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.8 * alpha + 0.9;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      let ang = (Math.PI / 5) * i + f * 0.85;
      ctx.strokeStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#FB7185";
      ctx.lineWidth = 2.8 * alpha + 0.9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(ang) * r * 0.48, h.y + Math.sin(ang) * r * 0.48);
      ctx.lineTo(h.x + Math.cos(ang) * r * 1.15, h.y + Math.sin(ang) * r * 1.15);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "danh_firebreath") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = h.radius * (0.42 + 0.58 * Math.pow(Math.min(1, f * 1.35), 0.72));
    let half = h.spread * 0.5;
    let coneGrad = ctx.createRadialGradient(10, 0, 8, 10, 0, reach);
    coneGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.85)" : `rgba(254, 249, 195, ${0.82 * alpha})`);
    coneGrad.addColorStop(0.45, isMono ? "rgba(120,120,120,0.6)" : `rgba(249, 115, 22, ${0.65 * alpha})`);
    coneGrad.addColorStop(0.82, isMono ? "rgba(0,0,0,0.45)" : `rgba(220, 38, 38, ${0.42 * alpha})`);
    coneGrad.addColorStop(1, "rgba(153, 27, 27, 0)");

    // Outer crimson dragon-blaze cone
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.arc(0, 0, reach, -half, half);
    ctx.closePath();
    ctx.fill();

    // Inner blazing flame tongues
    for (let i = -2; i <= 2; i++) {
      let ta = i * (half * 0.36);
      let tr = reach * (0.78 + (1 - Math.abs(i) * 0.14) * 0.18);
      ctx.strokeStyle = isMono ? "#FFFFFF" : i === 0 ? `rgba(254, 249, 195, ${0.9 * alpha})` : `rgba(251, 191, 36, ${0.72 * alpha})`;
      ctx.lineWidth = (i === 0 ? 7 : 4.5) * alpha + 1.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.quadraticCurveTo(Math.cos(ta) * tr * 0.52, Math.sin(ta) * tr * 0.52 + Math.sin(f * 16 + i) * 7, Math.cos(ta) * tr, Math.sin(ta) * tr);
      ctx.stroke();
    }

    drawTaperedArc(ctx, 0, 0, reach * 0.94, -half, half, 13 * alpha + 2, h.empowered ? "#EF4444" : "#F97316", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.68, -half * 0.78, half * 0.78, 7 * alpha + 1.5, "#FBBF24", "#FFFFFF", isMono);
    return;
  }

  if (h.kind === "luan_portal_wave") {
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.66));
    let waveGrad = ctx.createRadialGradient(h.x, h.y, r * 0.14, h.x, h.y, r);
    waveGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
    waveGrad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.28)" : `rgba(192, 132, 252, ${0.42 * alpha})`);
    waveGrad.addColorStop(0.86, isMono ? "rgba(255,255,255,0.2)" : `rgba(56, 189, 248, ${0.32 * alpha})`);
    waveGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = waveGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : "#A855F7";
    ctx.lineWidth = 8.5 * alpha + 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.78, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
    ctx.lineWidth = 3.8 * alpha + 0.9;
    ctx.stroke();

    // Rotating dimensional mirror hexagram inside shockwave
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(f * 1.4);
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(245, 208, 254, ${alpha * 0.75})`;
    ctx.lineWidth = 2.0 * alpha;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      let a = (Math.PI / 3) * k;
      let px = Math.cos(a) * r * 0.68, py = Math.sin(a) * r * 0.68;
      k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Shattered mirror glass fragments & cyan rift flares flying outward
    for (let i = 0; i < 10; i++) {
      let ang = (Math.PI * 2 / 10) * i + f * 1.05;
      let sx = h.x + Math.cos(ang) * r * 0.95;
      let sy = h.y + Math.sin(ang) * r * 0.95;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ang + f * 3.2);
      ctx.fillStyle = i % 2 === 0 ? (isMono ? "#FFFFFF" : "#F5D0FE") : (isMono ? "#CCCCCC" : "#38BDF8");
      ctx.strokeStyle = isMono ? "#000000" : "#7C3AED";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, -7.5 * alpha - 2);
      ctx.lineTo(5 * alpha + 1.5, 0);
      ctx.lineTo(0, 7.5 * alpha + 2);
      ctx.lineTo(-5 * alpha - 1.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    drawFourPointStar(ctx, h.x, h.y, r * 0.24 * alpha + 4, 2.8, "#FFFFFF", isMono ? "#000000" : "#A855F7");
    return;
  }

  if (h.kind === "nguyen_wave") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let reach = h.radius * (0.35 + 0.65 * Math.pow(f, 0.72));
    let half = (h.spread || Math.PI) * 0.5;
    let waveGrad = ctx.createRadialGradient(0, 0, reach * 0.12, 0, 0, reach);
    waveGrad.addColorStop(0, "rgba(16, 185, 129, 0)");
    waveGrad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.22)" : `rgba(52, 211, 153, ${0.34 * alpha})`);
    waveGrad.addColorStop(0.85, isMono ? "rgba(255,255,255,0.22)" : `rgba(254, 240, 138, ${0.28 * alpha})`);
    waveGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = waveGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, reach, -half, half);
    ctx.closePath();
    ctx.fill();

    drawTaperedArc(ctx, 0, 0, reach, -half, half, 13.5 * alpha + 2.2, "#10B981", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.74, -half * 0.86, half * 0.86, 7.5 * alpha + 1.4, "#34D399", "#FFFFFF", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.52, -half * 0.65, half * 0.65, 4.0 * alpha + 0.8, "#FACC15", "#FFFFFF", isMono);
    for (let i = -3; i <= 3; i++) {
      let pa = i * (half * 0.28);
      let pr = reach * (0.68 + f * 0.28);
      ctx.save();
      ctx.translate(Math.cos(pa) * pr, Math.sin(pa) * pr);
      ctx.rotate(pa + f * 2.2);
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
      ctx.strokeStyle = isMono ? "#000000" : "#059669";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.2 * alpha + 1.8, 2.8 * alpha + 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    drawFourPointStar(ctx, reach * 0.94, 0, 10 * alpha + 2, 2.6, "#FEF08A", isMono ? "#000000" : "#10B981");
    return;
  }

  if (h.kind === "taidu_hex_blast") {
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.58));
    if (!Number.isFinite(h.x) || !Number.isFinite(h.y) || !Number.isFinite(r) || r <= 0) return;
    let mainCol = isMono ? "#000000" : h.color || "#F97316";
    let accentCol = isMono ? "#FFFFFF" : h.accentColor || "#38BDF8";
    let blastGrad = ctx.createRadialGradient(h.x, h.y, r * 0.08, h.x, h.y, r);
    blastGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : `rgba(254, 240, 138, ${0.7 * alpha})`);
    blastGrad.addColorStop(0.48, isMono ? "rgba(0,0,0,0.34)" : `rgba(249, 115, 22, ${0.44 * alpha})`);
    blastGrad.addColorStop(0.84, isMono ? "rgba(255,255,255,0.18)" : `rgba(56, 189, 248, ${0.28 * alpha})`);
    blastGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = blastGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer hexagonal tech shockwave + counter-rotating inner tactical hex
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(f * 0.55);
    ctx.strokeStyle = mainCol;
    ctx.lineWidth = 6.2 * alpha + 1.6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      let px = Math.cos(a) * r, py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.rotate(-f * 1.1);
    ctx.strokeStyle = accentCol;
    ctx.lineWidth = 3.2 * alpha + 0.9;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      let px = Math.cos(a) * r * 0.72, py = Math.sin(a) * r * 0.72;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Ionized targeting circle + radial vector spikes
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.4 * alpha + 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i + Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
      ctx.lineTo(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, r * 0.28 * alpha + 6, 3.2, "#FFFFFF", accentCol);
    ctx.restore();
    return;
  }

  if (h.kind === "nguyen_lotus_boom") {
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.62));
    if (!Number.isFinite(h.x) || !Number.isFinite(h.y) || !Number.isFinite(r) || r <= 0) return;
    let lotusGrad = ctx.createRadialGradient(h.x, h.y, r * 0.1, h.x, h.y, r);
    lotusGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.62)" : `rgba(254, 240, 138, ${0.55 * alpha})`);
    lotusGrad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.26)" : `rgba(16, 185, 129, ${0.36 * alpha})`);
    lotusGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = lotusGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 6.8 * alpha + 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.2 * alpha + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(f * 0.9);
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI * 2 / 8) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
      ctx.strokeStyle = isMono ? "#000000" : "#059669";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64, r * 0.2, r * 0.075, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, r * 0.26 * alpha + 5, 2.8, "#FFFFFF", isMono ? "#000000" : "#10B981");
    ctx.restore();
    return;
  }

  if (h.kind === "shield_explode") {
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.62));
    let sg = ctx.createRadialGradient(h.x, h.y, r * 0.14, h.x, h.y, r);
    sg.addColorStop(0, isMono ? "rgba(255,255,255,0.5)" : `rgba(254, 240, 138, ${0.42 * alpha})`);
    sg.addColorStop(0.6, isMono ? "rgba(0,0,0,0.25)" : `rgba(56, 189, 248, ${0.34 * alpha})`);
    sg.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color || "#38BDF8";
    ctx.lineWidth = 8.2 * alpha + 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.4 * alpha + 0.6;
    ctx.stroke();

    // Hexagonal barrier fracture rays
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i + f * 0.5;
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
      ctx.lineWidth = 2.4 * alpha;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(a) * r * 0.42, h.y + Math.sin(a) * r * 0.42);
      ctx.lineTo(h.x + Math.cos(a) * r * 1.08, h.y + Math.sin(a) * r * 1.08);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "duy_decoy_boom") {
    let r = h.radius * (0.18 + 0.82 * Math.pow(f, 0.55));
    ctx.save();
    ctx.translate(h.x, h.y);
    let grad = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
    grad.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(253, 224, 71, 0.68)");
    grad.addColorStop(0.5, isMono ? "rgba(100,100,100,0.4)" : "rgba(244, 63, 94, 0.44)");
    grad.addColorStop(1, "rgba(20, 184, 166, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
    ctx.lineWidth = 7.2 * alpha + 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#2DD4BF";
    ctx.lineWidth = 3.6 * alpha + 1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // 12 radial shockwave needle flares + spinning shuriken sparks
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.6 * alpha;
    for (let i = 0; i < 12; i++) {
      let a = (Math.PI / 6) * i + f * 0.75;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, r * 0.34 * alpha + 6, 3.5, "#FFFFFF", isMono ? "#000000" : "#F43F5E");
    ctx.restore();
    return;
  }

  if (h.kind === "duy_heal_lotus") {
    let r = h.radius * (0.35 + 0.65 * Math.pow(f, 0.6));
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(f * 1.5);
    ctx.globalAlpha = Math.max(0.1, alpha);
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#34D399" : "#2DD4BF";
      ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.54, Math.sin(a) * r * 0.54, r * 0.4, r * 0.14, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 2.8 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, r * 0.28, r * 0.09, "#FFFFFF", isMono ? "#000000" : "#34D399");
    ctx.restore();
    return;
  }

  if (h.kind === "duy_dash_cut") {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let dAura = ctx.createRadialGradient(0, 0, h.radius * 0.2, 0, 0, h.radius * 1.12);
    dAura.addColorStop(0, "rgba(20, 184, 166, 0)");
    dAura.addColorStop(0.68, isMono ? `rgba(255,255,255,${0.24 * alpha})` : `rgba(20, 184, 166, ${0.36 * alpha})`);
    dAura.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = dAura;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, h.radius * 1.12, -1.08, 1.08);
    ctx.closePath();
    ctx.fill();

    drawTaperedArc(ctx, 0, 0, h.radius, -1.08, 1.08, 13 * alpha + 2.2, "#14B8A6", "#FDE047", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.78, 0.88, -0.88, 8.2 * alpha + 1.5, "#F43F5E", "#FFFFFF", isMono);
    for (let wi = -1; wi <= 1; wi++) {
      let wa = wi * 0.36;
      ctx.strokeStyle = isMono ? "#FFFFFF" : wi === 0 ? "#FEF08A" : "#2DD4BF";
      ctx.lineWidth = 2.2 * alpha + 0.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(wa) * h.radius * 0.35, Math.sin(wa) * h.radius * 0.35);
      ctx.lineTo(Math.cos(wa) * h.radius * 1.15, Math.sin(wa) * h.radius * 1.15);
      ctx.stroke();
    }
    drawFourPointStar(ctx, h.radius * 0.9, 0, 12 * alpha + 2, 2.8 * alpha, "#FFFFFF", isMono ? "#000000" : "#14B8A6");
    ctx.restore();
    return;
  }

  if (h.kind === "boss_cyber_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = h.radius * (0.45 + 0.55 * Math.min(1, f * 1.6));
    drawTaperedArc(ctx, 0, 0, reach, -h.spread * 0.5, h.spread * 0.5, 13 * alpha + 2, "#0284C7", "#E0F2FE", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.78, -h.spread * 0.4, h.spread * 0.4, 6.5 * alpha + 1.2, "#F59E0B", "#FFFFFF", isMono);
    drawFourPointStar(ctx, Math.cos(h.spread * 0.42) * reach, Math.sin(h.spread * 0.42) * reach, 8 * alpha, 2.2 * alpha, "#FEF08A", "#38BDF8");
    return;
  }

  if (h.kind === "boss_thunder_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = h.radius * (0.4 + 0.6 * Math.min(1, f * 1.65));
    drawTaperedArc(ctx, 0, 0, reach, -h.spread * 0.5, h.spread * 0.5, 14 * alpha + 2, "#0284C7", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.82, h.spread * 0.42, -h.spread * 0.42, 7.5 * alpha + 1.4, "#FDE047", "#FFFFFF", isMono);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.4 * alpha + 0.6;
    for (let i = -2; i <= 2; i++) {
      let a = i * (h.spread * 0.2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * reach * 0.55, Math.sin(a) * reach * 0.55);
      ctx.lineTo(Math.cos(a + 0.08) * reach * 0.82, Math.sin(a + 0.08) * reach * 0.82);
      ctx.lineTo(Math.cos(a) * reach * 1.08, Math.sin(a) * reach * 1.08);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "boss_venom_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = h.radius * (0.38 + 0.62 * Math.min(1, f * 1.65));
    drawTaperedArc(ctx, 0, 0, reach, -h.spread * 0.5, h.spread * 0.5, 14.5 * alpha + 2, "#16A34A", "#BEF264", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.78, -h.spread * 0.42, h.spread * 0.42, 7 * alpha + 1.2, "#84CC16", "#ECFCCB", isMono);
    for (let i = 0; i < 6; i++) {
      let a = -h.spread * 0.42 + (h.spread * 0.84 * i) / 5;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#BEF264";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (reach * (0.9 + (i % 2) * 0.14)), Math.sin(a) * (reach * (0.9 + (i % 2) * 0.14)), 3.6 * alpha + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (h.kind === "boss_blood_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = h.radius * (0.36 + 0.64 * Math.min(1, f * 1.7));
    drawTaperedArc(ctx, 0, 0, reach, -h.spread * 0.5, h.spread * 0.5, 15 * alpha + 2, "#9F1239", "#FDA4AF", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.82, h.spread * 0.45, -h.spread * 0.45, 9.5 * alpha + 1.5, "#FB7185", "#FEF08A", isMono);
    drawFourPointStar(ctx, Math.cos(h.spread * 0.44) * reach, Math.sin(h.spread * 0.44) * reach, 9 * alpha, 2.4 * alpha, "#FDA4AF", "#9F1239");
    return;
  }

  if (h.kind === "boss_seraph_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let reach = h.radius * (0.35 + 0.65 * Math.min(1, f * 1.72));
    drawTaperedArc(ctx, 0, 0, reach, (-h.spread / 2) * dir, (h.spread / 2) * dir, 17 * alpha + 2.2, h.color || "#DC2626", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.78, (-h.spread * 0.4) * dir, (h.spread * 0.4) * dir, 9 * alpha + 1.5, "#FBBF24", "#FFFFFF", isMono);
    drawFourPointStar(ctx, Math.cos((h.spread * 0.45) * dir) * reach, Math.sin((h.spread * 0.45) * dir) * reach, 11 * alpha, 3 * alpha, "#FEF08A", "#DC2626");
    return;
  }

  if (h.kind === "thanh_snake_fan") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let r = (h.radius || 76) * (0.4 + 0.6 * f);
    let col = h.isEcho ? "#A78BFA" : h.color || "#10B981";
    let rim = h.isEcho ? "#F3E8FF" : "#A7F3D0";
    let tGrad = ctx.createRadialGradient(0, 0, r * 0.18, 0, 0, r);
    tGrad.addColorStop(0, "rgba(16, 185, 129, 0)");
    tGrad.addColorStop(0.65, isMono ? `rgba(255,255,255,${0.22 * alpha})` : `rgba(52, 211, 153, ${0.32 * alpha})`);
    tGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -0.7, 0.7);
    ctx.closePath();
    ctx.fill();

    drawTaperedArc(ctx, 0, 0, r, -0.68, 0.68, 12.5 * alpha + 2.0, col, rim, isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.74, -0.5, 0.5, 6.2 * alpha + 1.2, "#FFFFFF", "#FDE047", isMono);
    for (let s of [-0.3, 0, 0.3]) {
      ctx.strokeStyle = isMono ? `rgba(255,255,255,${alpha})` : `rgba(167, 243, 208, ${alpha * 0.94})`;
      ctx.lineWidth = 2.4 * alpha + 0.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(Math.cos(s) * r * 0.26, Math.sin(s) * r * 0.26);
      ctx.quadraticCurveTo(Math.cos(s + 0.08) * r * 0.7, Math.sin(s + 0.08) * r * 0.7, Math.cos(s) * r * 1.12, Math.sin(s) * r * 1.12);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "thanh_devour_bite") {
    let r = (h.radius || 140) * (0.48 + 0.52 * f);
    let dGrad = ctx.createRadialGradient(h.x, h.y, r * 0.15, h.x, h.y, r);
    dGrad.addColorStop(0, "rgba(16, 185, 129, 0)");
    dGrad.addColorStop(0.62, isMono ? `rgba(255,255,255,${0.25 * alpha})` : `rgba(16, 185, 129, ${0.34 * alpha})`);
    dGrad.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? `rgba(255,255,255,${alpha})` : `rgba(52, 211, 153, ${alpha * 0.95})`;
    ctx.lineWidth = 6.2 * alpha + 1.4;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? `rgba(200,200,200,${alpha * 0.85})` : `rgba(168, 85, 247, ${alpha * 0.88})`;
    ctx.lineWidth = 3.2 * alpha;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let k = 0; k < 8; k++) {
      let a = (Math.PI / 4) * k + f * 0.55;
      ctx.fillStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${alpha * 0.94})`;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(a) * r * 0.82, h.y + Math.sin(a) * r * 0.82);
      ctx.lineTo(h.x + Math.cos(a + 0.08) * r * 1.09, h.y + Math.sin(a + 0.08) * r * 1.09);
      ctx.lineTo(h.x + Math.cos(a - 0.08) * r * 1.09, h.y + Math.sin(a - 0.08) * r * 1.09);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (h.kind === "thanh_shield_pulse") {
    let r = (h.radius || 64) * (0.45 + 0.55 * f);
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.22, h.x, h.y, r);
    grad.addColorStop(0, "rgba(167, 243, 208, 0)");
    grad.addColorStop(0.68, isMono ? `rgba(255,255,255,${alpha * 0.45})` : `rgba(16, 185, 129, ${alpha * 0.62})`);
    grad.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(167, 139, 250, ${alpha * 0.9})`;
    ctx.lineWidth = 3.0 * alpha;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (h.kind === "nhi_flask_boom" || h.kind === "nhi_mist_pulse") {
    let r = (h.radius || 96) * (0.32 + 0.68 * Math.min(1, f * 1.25));
    let isMist = h.kind === "nhi_mist_pulse";
    let baseCol = h.color || (isMist ? "#4ADE80" : "#C084FC");
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.1, h.x, h.y, r);
    grad.addColorStop(0, isMono ? `rgba(255,255,255,${alpha * 0.52})` : isMist ? `rgba(74, 222, 128, ${alpha * 0.55})` : `rgba(192, 132, 252, ${alpha * 0.6})`);
    grad.addColorStop(0.65, isMono ? `rgba(200,200,200,${alpha * 0.28})` : `rgba(34, 197, 94, ${alpha * 0.38})`);
    grad.addColorStop(1, "rgba(34, 197, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? `rgba(255,255,255,${alpha * 0.9})` : baseCol;
    ctx.lineWidth = 3.4 * alpha + 1.0;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    // Shattered glass shards + alchemical droplet rays
    for (let k = 0; k < 8; k++) {
      let a = (Math.PI / 4) * k + 0.25 + f * 0.4;
      ctx.strokeStyle = isMono ? "#FFFFFF" : k % 2 === 0 ? "#E879F9" : "#4ADE80";
      ctx.lineWidth = 2.4 * alpha + 0.5;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(a) * r * 0.36, h.y + Math.sin(a) * r * 0.36);
      ctx.lineTo(h.x + Math.cos(a) * r * 1.02, h.y + Math.sin(a) * r * 1.02);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "nhi_ult_shock") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let r = (h.radius || 82) * (0.35 + 0.65 * f);
    let grad = ctx.createRadialGradient(0, 0, r * 0.14, 0, 0, r);
    grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.78})`);
    grad.addColorStop(0.55, isMono ? `rgba(220,220,220,${alpha * 0.5})` : `rgba(217, 70, 239, ${alpha * 0.62})`);
    grad.addColorStop(1, "rgba(34, 197, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(74, 222, 128, ${alpha * 0.94})`;
    ctx.lineWidth = 3.6 * alpha + 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, r * 0.82 * alpha, r * 0.2 * alpha, isMono ? "#FFFFFF" : "#E879F9", isMono ? "#000000" : "#4ADE80");
    return;
  }

  if (h.kind === "minh_seal_boom") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 185) * (0.28 + 0.72 * f);
    let g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.85})`);
    g.addColorStop(0.42, isMono ? `rgba(200,200,200,${alpha * 0.55})` : `rgba(250, 204, 21, ${alpha * 0.58})`);
    g.addColorStop(0.82, isMono ? `rgba(100,100,100,${alpha * 0.3})` : `rgba(56, 189, 248, ${alpha * 0.34})`);
    g.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${alpha})`;
    ctx.lineWidth = 5.4 * alpha + 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#E5E5E5" : `rgba(56, 189, 248, ${alpha * 0.94})`;
    ctx.lineWidth = 3.0 * alpha + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    // 8-point double celestial star burst + rotating sacred talisman rune ring
    drawFourPointStar(ctx, 0, 0, r * 0.74 * alpha, r * 0.17 * alpha, "#FEF08A", "#FFFFFF");
    ctx.rotate(Math.PI / 4 + f * 0.6);
    drawFourPointStar(ctx, 0, 0, r * 0.58 * alpha, r * 0.14 * alpha, isMono ? "#FFFFFF" : "#38BDF8", "#FFFFFF");
    return;
  }

  if (h.kind === "minh_chain_rect") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let len = h.length || h.radius || 460;
    let hw = h.halfWidth || 110;
    let sweep = Math.min(1, f * 2.1);

    let bgGrad = ctx.createLinearGradient(0, 0, len, 0);
    bgGrad.addColorStop(0, isMono ? `rgba(255, 255, 255, ${alpha * 0.12})` : `rgba(56, 189, 248, ${alpha * 0.18})`);
    bgGrad.addColorStop(0.55, isMono ? `rgba(229, 229, 229, ${alpha * 0.28})` : `rgba(250, 204, 21, ${alpha * 0.28})`);
    bgGrad.addColorStop(1, isMono ? `rgba(255, 255, 255, ${alpha * 0.06})` : `rgba(56, 189, 248, ${alpha * 0.08})`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, -hw, len * sweep, hw * 2);

    ctx.strokeStyle = isMono ? `rgba(255, 255, 255, ${alpha * 0.92})` : `rgba(253, 224, 71, ${alpha * 0.92})`;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(0, -hw, len, hw * 2);

    ctx.strokeStyle = isMono ? `rgba(229, 229, 229, ${alpha * 0.62})` : `rgba(56, 189, 248, ${alpha * 0.72})`;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([12, 8]);
    for (let i = -2; i <= 2; i++) {
      let ly = (i / 2) * (hw * 0.82);
      ctx.beginPath();
      ctx.moveTo(16, ly);
      ctx.lineTo(len * sweep, ly);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    let barX = len * sweep;
    ctx.strokeStyle = isMono ? `rgba(255, 255, 255, ${alpha})` : `rgba(254, 240, 138, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(barX, -hw);
    ctx.lineTo(barX, hw);
    ctx.stroke();
    drawFourPointStar(ctx, barX, -hw, 9 * alpha, 2.5, "#FFFFFF", "#FACC15");
    drawFourPointStar(ctx, barX, hw, 9 * alpha, 2.5, "#FFFFFF", "#FACC15");
    return;
  }

  if (h.kind === "ducanh_fortress_boom" || h.kind === "ducanh_meteor_boom") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 175) * (0.28 + 0.72 * f);
    let isMeteor = h.kind === "ducanh_meteor_boom";
    let g = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
    g.addColorStop(0, isMono ? `rgba(255,255,255,${alpha * 0.8})` : `rgba(254, 240, 138, ${alpha * 0.82})`);
    g.addColorStop(0.55, isMono ? `rgba(120,120,120,${alpha * 0.45})` : isMeteor ? `rgba(249, 115, 22, ${alpha * 0.62})` : `rgba(96, 165, 250, ${alpha * 0.55})`);
    g.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : isMeteor ? `rgba(249, 115, 22, ${alpha})` : `rgba(147, 197, 253, ${alpha})`;
    ctx.lineWidth = (isMeteor ? 6.5 : 5.0) * alpha + 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    if (!isMeteor) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(74, 222, 128, ${alpha * 0.9})`;
      ctx.lineWidth = 3.2 * alpha + 0.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let a = (Math.PI / 3) * i + f * 0.45;
        let px = Math.cos(a) * r * 0.78;
        let py = Math.sin(a) * r * 0.78;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    for (let k = 0; k < 10; k++) {
      let a = (Math.PI / 5) * k + (isMeteor ? 0.2 : 0);
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(251, 191, 36, ${alpha * 0.95})`;
      ctx.lineWidth = (isMeteor ? 3.8 : 3.0) * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28);
      ctx.lineTo(Math.cos(a) * r * 1.06, Math.sin(a) * r * 1.06);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "bach_cross_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let r = h.radius * (0.85 + 0.15 * f);
    let bGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.12);
    bGrad.addColorStop(0, "rgba(34, 211, 238, 0)");
    bGrad.addColorStop(0.65, isMono ? `rgba(255,255,255,${0.25 * alpha})` : `rgba(34, 211, 238, ${0.34 * alpha})`);
    bGrad.addColorStop(1, "rgba(232, 121, 249, 0)");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 1.12, -h.spread * 0.6, h.spread * 0.6);
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: r * 0.96, startAng: -h.spread * 0.56, endAng: h.spread * 0.56, f, color: h.color || "#22D3EE", accentColor: h.accentColor || "#E879F9", isMono, enableAdditive, tiltY: 0.85, crackStrength: 1.05, seed: 13 });
    drawTaperedArc(ctx, 0, 0, r, -h.spread * 0.56, h.spread * 0.56, 14 * alpha + 2.2, h.color || "#22D3EE", "#FFFFFF", isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.82, h.spread * 0.52, -h.spread * 0.52, 10.5 * alpha + 1.8, h.accentColor || "#E879F9", "#A5F3FC", isMono);
    for (let wi = -2; wi <= 2; wi++) {
      let wa = wi * h.spread * 0.18;
      ctx.strokeStyle = isMono ? "#FFFFFF" : wi === 0 ? `rgba(255,255,255,${alpha * 0.92})` : `rgba(103, 232, 249, ${alpha * 0.78})`;
      ctx.lineWidth = 2.2 * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(wa) * r * 0.4, Math.sin(wa) * r * 0.4);
      ctx.lineTo(Math.cos(wa) * r * 1.15, Math.sin(wa) * r * 1.15);
      ctx.stroke();
    }
    drawFourPointStar(ctx, r * 0.84, 0, (1 - f) * 15 + 4, 3.2, "#FFFFFF", isMono ? "#000000" : "#E879F9");
    return;
  }

  if (h.kind === "thai_arena_cleave") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let r = h.radius * (0.76 + 0.24 * f);
    let cGrad = ctx.createRadialGradient(0, 0, r * 0.18, 0, 0, r * 1.14);
    cGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
    cGrad.addColorStop(0.62, isMono ? `rgba(255,255,255,${0.26 * alpha})` : `rgba(239, 68, 68, ${0.38 * alpha})`);
    cGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 1.14, -h.spread * 0.56, h.spread * 0.56);
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: r * 0.98, startAng: -h.spread * 0.54, endAng: h.spread * 0.54, f, color: "#EF4444", accentColor: "#FDE047", isMono, enableAdditive, tiltY: 0.88, crackStrength: h.empowered ? 1.25 : 0.85, seed: 17 });
    drawTaperedArc(ctx, 0, 0, r, -h.spread * 0.54, h.spread * 0.54, 18.5 * alpha + 2.8, "#EF4444", "#FDE047", isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.78, -h.spread * 0.44, h.spread * 0.44, 10.5 * alpha + 1.8, "#FACC15", "#FFFFFF", isMono);
    if (h.empowered) {
      drawTaperedArc(ctx, 0, 0, r * 1.08, -h.spread * 0.38, h.spread * 0.38, 7.2 * alpha + 1.4, "#FEF08A", "#FFFFFF", isMono);
      for (let i = -2; i <= 2; i++) {
        let a = i * 0.24;
        ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${alpha * 0.94})`;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28);
        ctx.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
        ctx.stroke();
      }
      drawFourPointStar(ctx, r * 0.96, 0, 14 * alpha + 3, 3.6, "#FFFFFF", isMono ? "#000000" : "#F59E0B");
    }
    return;
  }

  if (h.kind === "thai_cyclone_ring") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 170) * (0.4 + 0.6 * f);
    let g = ctx.createRadialGradient(0, 0, r * 0.14, 0, 0, r);
    g.addColorStop(0, "rgba(254, 240, 138, 0)");
    g.addColorStop(0.62, isMono ? `rgba(255,255,255,${alpha * 0.32})` : `rgba(239, 68, 68, ${alpha * 0.48})`);
    g.addColorStop(0.92, isMono ? `rgba(180,180,180,${alpha * 0.28})` : `rgba(245, 158, 11, ${alpha * 0.34})`);
    g.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${alpha * 0.88})`;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(f * 7.8);
    drawTaperedArc(ctx, 0, 0, r * 0.92, 0, Math.PI * 1.45, 16 * alpha + 2.4, "#F59E0B", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.84, Math.PI, Math.PI * 2.45, 12.5 * alpha + 1.8, "#EF4444", "#FFFFFF", isMono);
    for (let si = 0; si < 6; si++) {
      let sa = (Math.PI / 3) * si;
      drawFourPointStar(ctx, Math.cos(sa) * r * 0.9, Math.sin(sa) * r * 0.9, 8 * alpha + 2, 2.2, "#FEF08A", isMono ? "#000000" : "#EF4444");
    }
    return;
  }

  if (h.kind === "khair_sniper_muzzle") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let r = (h.radius || 75) * (0.4 + 0.6 * f);
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(250, 204, 21, ${alpha})`;
    ctx.lineWidth = 5.0 * alpha + 1.4;
    ctx.beginPath();
    ctx.ellipse(12, 0, r * 0.25, r * 0.66, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(74, 222, 128, ${alpha * 0.92})`;
    ctx.lineWidth = 3.0 * alpha + 1;
    ctx.beginPath();
    ctx.ellipse(28, 0, r * 0.16, r * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? `rgba(255,255,255,${alpha * 0.78})` : `rgba(74, 222, 128, ${alpha * 0.82})`;
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.lineTo(r * 1.45, 0);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();
    drawFourPointStar(ctx, 16, 0, r * 0.5, 3.6, "#FFFFFF", isMono ? "#000000" : "#FACC15");
    return;
  }

  if (h.kind === "khair_recoil_blast") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 140) * (0.26 + 0.74 * f);
    let g = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
    g.addColorStop(0, isMono ? `rgba(255,255,255,${alpha * 0.85})` : `rgba(254, 240, 138, ${alpha * 0.88})`);
    g.addColorStop(0.5, isMono ? `rgba(180,180,180,${alpha * 0.5})` : `rgba(74, 222, 128, ${alpha * 0.58})`);
    g.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(250, 204, 21, ${alpha})`;
    ctx.lineWidth = 5.0 * alpha + 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(74, 222, 128, ${alpha * 0.9})`;
    ctx.lineWidth = 2.8 * alpha + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      let a = (Math.PI / 5) * i + f * 0.7;
      ctx.strokeStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? `rgba(74, 222, 128, ${alpha * 0.94})` : `rgba(254, 240, 138, ${alpha * 0.94})`;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
      ctx.lineTo(Math.cos(a) * r * 1.06, Math.sin(a) * r * 1.06);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, r * 0.32 * alpha + 7, 3.6, "#FFFFFF", isMono ? "#000000" : "#FACC15");
    return;
  }

  if (h.kind === "tin_spatial_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let sr = h.radius || 90;
    let sp = h.spread || 1.75;
    let tg = ctx.createRadialGradient(0, 0, sr * 0.18, 0, 0, sr * 1.18);
    tg.addColorStop(0, "rgba(225, 29, 72, 0)");
    tg.addColorStop(0.58, isMono ? `rgba(0,0,0,${0.32 * alpha})` : `rgba(244, 63, 94, ${0.44 * alpha})`);
    tg.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sr * 1.18, -sp / 2, sp / 2);
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: sr * 0.98, startAng: -sp / 2, endAng: sp / 2, f, color: "#E11D48", accentColor: "#FDA4AF", isMono, enableAdditive, tiltY: 0.84, crackStrength: 1.32, seed: 19 });
    drawTaperedArc(ctx, 0, 0, sr, -sp / 2, sp / 2, 15 * alpha + 2.4, "#E11D48", "#FDA4AF", isMono);
    drawTaperedArc(ctx, 0, 0, sr * 0.79, -sp * 0.44, sp * 0.44, 7.5 * alpha + 1.4, "#FB7185", "#FFFFFF", isMono);
    if (h.crossed) {
      drawTaperedArc(ctx, 0, 0, sr * 0.94, sp * 0.5, -sp * 0.5, 10.5 * alpha + 1.6, "#F43F5E", "#FFE4E6", isMono);
    }
    // Jagged spatial rift fracture arc + shattered ruby dimension shards
    ctx.strokeStyle = isMono ? "#000000" : "#09040A";
    ctx.lineWidth = 3.0 * alpha + 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      let a = -sp * 0.44 + (sp * 0.88 * i) / 8;
      let rj = sr * (i % 2 === 0 ? 0.86 : 0.99);
      i === 0 ? ctx.moveTo(Math.cos(a) * rj, Math.sin(a) * rj) : ctx.lineTo(Math.cos(a) * rj, Math.sin(a) * rj);
    }
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2 * alpha;
    ctx.stroke();
    for (let di = -1; di <= 1; di++) {
      let da = di * sp * 0.3;
      drawFourPointStar(ctx, Math.cos(da) * sr * 0.98, Math.sin(da) * sr * 0.98, 8.2 * alpha + 1.8, 2.2 * alpha, "#FFFFFF", isMono ? "#000000" : "#E11D48");
    }
    return;
  }

  if (h.kind === "eohyen_frost_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let sr = h.radius || 90;
    let sp = h.spread || 1.35;
    let fg = ctx.createRadialGradient(0, 0, sr * 0.2, 0, 0, sr * 1.18);
    fg.addColorStop(0, "rgba(56, 189, 248, 0)");
    fg.addColorStop(0.62, isMono ? `rgba(255,255,255,${0.26 * alpha})` : `rgba(56, 189, 248, ${0.42 * alpha})`);
    fg.addColorStop(1, "rgba(224, 242, 254, 0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sr * 1.18, -sp / 2, sp / 2);
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: sr * 0.97, startAng: -sp / 2, endAng: sp / 2, f, color: "#0284C7", accentColor: "#BAE6FD", isMono, enableAdditive, tiltY: 0.88, crackStrength: 0.95, seed: 23 });
    drawTaperedArc(ctx, 0, 0, sr, -sp / 2, sp / 2, 14 * alpha + 2.2, "#0284C7", "#E0F2FE", isMono);
    drawTaperedArc(ctx, 0, 0, sr * 0.78, -sp * 0.42, sp * 0.42, 7.0 * alpha + 1.3, "#7DD3FC", "#FFFFFF", isMono);
    for (let si = -2; si <= 2; si++) {
      let sa = si * sp * 0.2;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#E0F2FE";
      ctx.strokeStyle = isMono ? "#000000" : "#0284C7";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * sr * 1.18, Math.sin(sa) * sr * 1.18);
      ctx.lineTo(Math.cos(sa - 0.06) * sr * 0.84, Math.sin(sa - 0.06) * sr * 0.84);
      ctx.lineTo(Math.cos(sa + 0.06) * sr * 0.84, Math.sin(sa + 0.06) * sr * 0.84);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    drawFourPointStar(ctx, Math.cos(sp * 0.28) * sr, Math.sin(sp * 0.28) * sr, 10 * alpha + 2, 2.5 * alpha, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
    return;
  }

  if (h.kind === "kin_gale_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let sr = h.radius || 105;
    let sp = h.spread || 1.6;
    let kg = ctx.createRadialGradient(0, 0, sr * 0.2, 0, 0, sr * 1.16);
    kg.addColorStop(0, "rgba(16, 185, 129, 0)");
    kg.addColorStop(0.62, isMono ? `rgba(255,255,255,${0.25 * alpha})` : `rgba(52, 211, 153, ${0.4 * alpha})`);
    kg.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = kg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sr * 1.16, -sp / 2, sp / 2);
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: sr * 0.96, startAng: -sp / 2, endAng: sp / 2, f, color: "#10B981", accentColor: "#FEF08A", isMono, enableAdditive, tiltY: 0.84, crackStrength: 0.78, seed: 29 });
    drawTaperedArc(ctx, 0, 0, sr, -sp / 2, sp / 2, 14 * alpha + 2.2, "#10B981", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, sr * 0.78, -sp * 0.44, sp * 0.44, 7.2 * alpha + 1.4, "#6EE7B7", "#FFFFFF", isMono);
    for (let wi of [-1, 1]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(254, 240, 138, ${0.84 * alpha})`;
      ctx.lineWidth = 2.4 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, sr * 1.09, wi * sp * 0.12 - 0.3, wi * sp * 0.12 + 0.3);
      ctx.stroke();
    }
    drawFourPointStar(ctx, sr * 0.96, 0, 11 * alpha + 2.4, 2.8 * alpha, "#FEF08A", isMono ? "#000000" : "#10B981");
    return;
  }

  if (h.kind === "thien_sword_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let sr = h.radius || 96;
    let sp = h.spread || 1.6;
    let dir = h.dir || 1;
    let mainCol = h.color || "#FACC15";
    let accentCol = h.accentColor || "#38BDF8";
    let startA = (-sp / 2) * dir;
    let sweepEnd = (-sp / 2 + sp * Math.min(1, f * 1.8 + 0.35)) * dir;

    let tg = ctx.createRadialGradient(0, 0, sr * 0.18, 0, 0, sr * 1.18);
    tg.addColorStop(0, "rgba(250, 204, 21, 0)");
    tg.addColorStop(0.58, isMono ? `rgba(255,255,255,${0.28 * alpha})` : `rgba(250, 204, 21, ${0.38 * alpha})`);
    tg.addColorStop(0.86, isMono ? `rgba(0,0,0,${0.22 * alpha})` : `rgba(56, 189, 248, ${0.32 * alpha})`);
    tg.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sr * 1.18, Math.min(startA, sweepEnd), Math.max(startA, sweepEnd));
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: sr * 0.98, startAng: startA, endAng: sweepEnd, f, color: mainCol, accentColor: accentCol, isMono, enableAdditive, tiltY: 0.86, crackStrength: 1.18, seed: 31 });
    drawTaperedArc(ctx, 0, 0, sr, startA, sweepEnd, 16 * alpha + 2.4, mainCol, "#FFFFFF", isMono);
    drawTaperedArc(ctx, 0, 0, sr * 0.79, startA * 0.88, sweepEnd * 0.92, 8.8 * alpha + 1.6, accentCol, "#FEF08A", isMono);
    for (let si = -2; si <= 2; si++) {
      let sa = si * sp * 0.19 * dir;
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(254, 240, 138, ${0.88 * alpha})`;
      ctx.lineWidth = 2.2 * alpha;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * sr * 0.52, Math.sin(sa) * sr * 0.52);
      ctx.lineTo(Math.cos(sa) * sr * 1.14, Math.sin(sa) * sr * 1.14);
      ctx.stroke();
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * sr, Math.sin(sweepEnd) * sr, 12.5 * alpha + 2.5, 3.2 * alpha, "#FFFFFF", isMono ? "#000000" : accentCol);
    drawFourPointStar(ctx, sr * 0.65, 0, 8.0 * alpha + 1.5, 2.1 * alpha, "#FEF08A", isMono ? "#000000" : mainCol);
    return;
  }

  if (h.kind === "ducanh_hammer_cleave") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let sr = h.radius || 96;
    let sp = h.spread || 1.4;
    let dir = h.dir || 1;
    let startA = (-sp / 2) * dir;
    let sweepEnd = (-sp / 2 + sp * Math.min(1, f * 1.7 + 0.38)) * dir;
    let dg = ctx.createRadialGradient(0, 0, sr * 0.2, 0, 0, sr * 1.18);
    dg.addColorStop(0, "rgba(245, 158, 11, 0)");
    dg.addColorStop(0.6, isMono ? `rgba(255,255,255,${0.26 * alpha})` : `rgba(245, 158, 11, ${0.44 * alpha})`);
    dg.addColorStop(1, "rgba(234, 88, 12, 0)");
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sr * 1.18, Math.min(startA, sweepEnd), Math.max(startA, sweepEnd));
    ctx.closePath();
    ctx.fill();

    drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: sr * 0.96, startAng: startA, endAng: sweepEnd, f, color: "#D97706", accentColor: "#FEF08A", isMono, enableAdditive, tiltY: 0.84, crackStrength: 0.92, seed: 37 });
    drawTaperedArc(ctx, 0, 0, sr, startA, sweepEnd, 17 * alpha + 2.5, "#D97706", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, sr * 0.76, startA * 0.85, sweepEnd * 0.88, 8.5 * alpha + 1.6, "#F59E0B", "#FFFFFF", isMono);
    for (let si = -2; si <= 2; si++) {
      let sa = si * sp * 0.2;
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(254, 240, 138, ${0.86 * alpha})`;
      ctx.lineWidth = 2.6 * alpha;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * sr * 0.58, Math.sin(sa) * sr * 0.58);
      ctx.lineTo(Math.cos(sa) * sr * 1.16, Math.sin(sa) * sr * 1.16);
      ctx.stroke();
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * sr, Math.sin(sweepEnd) * sr, 11 * alpha + 2.5, 2.8 * alpha, "#FEF08A", isMono ? "#000000" : "#EA580C");
    return;
  }

  // Generic slash / crossed slash (fallback with Cosmic Slash layer)
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle);
  let sr = h.radius || 70;
  let sg = ctx.createRadialGradient(0, 0, sr * 0.35, 0, 0, sr * 1.12);
  sg.addColorStop(0, "rgba(255,255,255,0)");
  sg.addColorStop(0.7, isMono ? `rgba(255,255,255,${0.18 * alpha})` : `${h.color || "#38BDF8"}30`);
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, sr * 1.12, -h.spread / 2, h.spread / 2);
  ctx.closePath();
  ctx.fill();

  drawCosmicSlashLayer(ctx, { cx: 0, cy: 0, radius: sr * 0.96, startAng: -h.spread / 2, endAng: h.spread / 2, f, color: h.color || "#38BDF8", accentColor: h.accentColor || "#E0F2FE", isMono, enableAdditive, tiltY: 0.88, crackStrength: h.crossed ? 1.08 : 0.65, seed: 41 });
  drawTaperedArc(ctx, 0, 0, sr, -h.spread / 2, h.spread / 2, 11.5 * alpha + 1.6, h.color, "#FFFFFF", isMono);
  drawTaperedArc(ctx, 0, 0, sr * 0.78, -h.spread * 0.38, h.spread * 0.38, 5.5 * alpha + 1.1, h.color, "#FFFFFF", isMono);
  for (let si = -1; si <= 1; si++) {
    let sa = si * h.spread * 0.28 + (f - 0.5) * 0.12;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.6 * alpha + 0.6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * sr * 0.62, Math.sin(sa) * sr * 0.62);
    ctx.lineTo(Math.cos(sa) * sr * 1.08, Math.sin(sa) * sr * 1.08);
    ctx.stroke();
  }
  if (h.crossed) {
    drawTaperedArc(ctx, 0, 0, sr * 0.9, h.spread * 0.46, -h.spread * 0.46, 8.2 * alpha + 1.3, h.color, "#FFE4E6", isMono);
  }
  let tipAng = h.spread * (f * 0.5 - 0.1);
  drawFourPointStar(ctx, Math.cos(tipAng) * sr, Math.sin(tipAng) * sr, 8.5 * alpha + 2, 2.3 * alpha + 0.8, "#FFFFFF", isMono ? "#000000" : h.color);
}

export function drawCurvedLightning(ctx, l, isMono, enableAdditive = true) {
  let pts = l.points;
  if (!pts || pts.length < 2) return;
  let alpha = clamp(1 - l.life / l.maxLife, 0, 1);
  let w = l.width || 2.8;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  const traceJaggedBolt = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
  };

  // Pass 1: Layered additive electric plasma ionization sheath (zero shadowBlur)
  ctx.save();
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.globalAlpha = alpha * 0.32;
  traceJaggedBolt();
  ctx.strokeStyle = isMono ? "#FFFFFF" : l.color;
  ctx.lineWidth = w * 4.2;
  ctx.stroke();
  ctx.restore();

  // Pass 2: Saturated electric plasma body
  ctx.globalAlpha = alpha * 0.92;
  traceJaggedBolt();
  ctx.strokeStyle = isMono ? "#111111" : l.color;
  ctx.lineWidth = w * 1.55;
  ctx.stroke();

  // Pass 3: Razor-hot incandescent plasma filament core
  ctx.globalAlpha = alpha;
  traceJaggedBolt();
  ctx.strokeStyle = "#FFFBEB";
  ctx.lineWidth = Math.max(1.15, w * 0.46);
  ctx.stroke();

  // Procedural forked electrical sub-branches sprouting from jagged bend vertices
  if (pts.length >= 3 && alpha > 0.14) {
    for (let i = 1; i < pts.length - 1; i += 2) {
      let prev = pts[i - 1];
      let curr = pts[i];
      let segAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      let side = i % 4 === 1 ? 1 : -1;
      let forkAng = segAngle + side * (0.48 + ((i * 19) % 7) * 0.06);
      let forkLen = Math.min(34, Math.max(12, Math.hypot(curr.x - prev.x, curr.y - prev.y) * 0.85));
      let mx = curr.x + Math.cos(forkAng) * forkLen * 0.55 - Math.sin(forkAng) * side * 4.5;
      let my = curr.y + Math.sin(forkAng) * forkLen * 0.55 + Math.cos(forkAng) * side * 4.5;
      let ex = curr.x + Math.cos(forkAng - side * 0.18) * forkLen;
      let ey = curr.y + Math.sin(forkAng - side * 0.18) * forkLen;

      ctx.globalAlpha = alpha * 0.72;
      ctx.strokeStyle = isMono ? "#1E293B" : l.color;
      ctx.lineWidth = Math.max(1.0, w * 0.65);
      ctx.beginPath();
      ctx.moveTo(curr.x, curr.y);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.92;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = Math.max(0.7, w * 0.24);
      ctx.stroke();
    }
  }

  // Strike endpoint discharge crown: radial surface spark arcs + sharp flash star
  if (alpha > 0.2 && pts.length >= 2) {
    let tip = pts[pts.length - 1];
    let prev = pts[pts.length - 2];
    let baseAng = Math.atan2(tip.y - prev.y, tip.x - prev.x);
    for (let s = 0; s < 4; s++) {
      let sa = baseAng + (Math.PI * 0.5) * s + 0.35;
      let sr = (8 + w * 3.2) * alpha;
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = isMono ? "#0F172A" : l.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x + Math.cos(sa + 0.22) * sr * 0.55, tip.y + Math.sin(sa + 0.22) * sr * 0.55);
      ctx.lineTo(tip.x + Math.cos(sa) * sr, tip.y + Math.sin(sa) * sr);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    drawFourPointStar(ctx, pts[0].x, pts[0].y, (2.6 + w * 0.9) * alpha, 1.0 * alpha, "#FFFFFF", isMono ? "#000000" : l.color);
    drawFourPointStar(ctx, tip.x, tip.y, (3.6 + w * 1.5) * alpha, 1.4 * alpha, "#FFFFFF", isMono ? "#000000" : l.color);
  }

  ctx.restore();
}

export function drawImpactBurst(ctx, b, isMono, enableAdditive = true) {
  let f = clamp(b.life / Math.max(0.05, b.maxLife), 0, 1);
  let tier = b.tier || (b.isCrit ? "heavy" : "light");
  let isFinisher = tier === "finisher";
  let isHeavy = tier === "heavy" || b.isCrit || isFinisher;
  let alpha = (1 - Math.pow(f, 1.25)) * (isFinisher ? 0.96 : 0.86);
  let r = b.radius * (0.28 + 0.72 * Math.pow(f, 0.55));
  let mainCol = isMono ? "#CBD5E1" : (b.color || "#38BDF8");
  let hotCol = isMono ? "#FFFFFF" : (isFinisher ? "#F43F5E" : isHeavy ? "#FDE047" : mainCol);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);

  // Soft radial impact flash (stronger core flash at impact onset)
  let iGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * (isFinisher ? 1.38 : 1.15));
  iGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.68)" : isFinisher ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.52)");
  iGrad.addColorStop(0.5, isMono ? "rgba(180,180,180,0.22)" : `${mainCol}48`);
  iGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = iGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * (isFinisher ? 1.38 : 1.15), 0, Math.PI * 2);
  ctx.fill();

  // Layered additive neon shockwave rings
  ctx.save();
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = mainCol;
  ctx.lineWidth = (isFinisher ? 5.2 : isHeavy ? 3.8 : 2.3) * alpha + 0.6;
  ctx.stroke();

  if (isHeavy) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.strokeStyle = isFinisher ? hotCol : "rgba(226, 232, 240, 0.72)";
    ctx.lineWidth = (isFinisher ? 2.6 : 1.5) * alpha;
    ctx.stroke();
  }

  // Finisher: 3D tilted ground shock ring + upward soul-shard wisps
  if (isFinisher) {
    ctx.save();
    ctx.scale(1, 0.62);
    ctx.strokeStyle = hotCol;
    ctx.lineWidth = 3.2 * alpha + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Staggered directional velocity needles
  let needleCount = isFinisher ? 10 : isHeavy ? 8 : 5;
  ctx.strokeStyle = hotCol;
  ctx.lineWidth = (isFinisher ? 2.1 : 1.5) * alpha + 0.4;
  ctx.lineCap = "round";
  for (let i = 0; i < needleCount; i++) {
    let sa = (Math.PI * 2 / needleCount) * i + 0.24;
    let out = i % 2 === 0 ? (isFinisher ? 1.42 : 1.25) : 1.04;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * r * 0.44, Math.sin(sa) * r * 0.44);
    ctx.lineTo(Math.cos(sa) * r * out, Math.sin(sa) * r * out);
    ctx.stroke();
  }

  // Spinning shattered cosmic shards for Heavy & Finisher tiers
  if (isHeavy && f < 0.88) {
    let sCount = isFinisher ? 6 : 3;
    for (let si = 0; si < sCount; si++) {
      let sa = (Math.PI * 2 / sCount) * si + f * 2.4;
      let sd = r * (0.55 + f * 0.65);
      let sx = Math.cos(sa) * sd;
      let sy = Math.sin(sa) * sd;
      let sz = (isFinisher ? 5.2 : 3.6) * (1 - f);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sa + f * 6);
      ctx.fillStyle = isMono ? "#FFFFFF" : (si % 2 === 0 ? hotCol : mainCol);
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.7, 0);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Elemental / Hero signature silhouette micro-accent on impact
  let sigCol = (b.color || "").toUpperCase();
  if (f < 0.85) {
    if (sigCol === "#F43F5E" || sigCol === "#E11D48" || b.heroId === "tin") {
      // Crimson Ma Thạch razor X-splinters
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
      ctx.lineWidth = (isHeavy ? 2.6 : 1.7) * (1 - f);
      ctx.beginPath();
      ctx.moveTo(-r * 1.15, -r * 0.38);
      ctx.lineTo(r * 1.15, r * 0.38);
      ctx.moveTo(r * 0.38, -r * 1.05);
      ctx.lineTo(-r * 0.38, r * 1.05);
      ctx.stroke();
    } else if (sigCol === "#38BDF8" || sigCol === "#7DD3FC" || b.heroId === "eohyen" || b.heroId === "dung") {
      // Glacial/storm diamond facets
      for (let fi = 0; fi < 4; fi++) {
        let fa = (Math.PI / 2) * fi + f * 1.5;
        drawUltDiamondShard(ctx, Math.cos(fa) * r * 0.88, Math.sin(fa) * r * 0.88, 6.5 * (1 - f) + 2, 2.4 * (1 - f) + 0.8, fa, "#FFFFFF", mainCol);
      }
    } else if (sigCol === "#34D399" || sigCol === "#22D3EE" || b.heroId === "kin" || b.heroId === "bach") {
      // Twin gale crescent wakes
      ctx.strokeStyle = isMono ? "#FFFFFF" : mainCol;
      ctx.lineWidth = 2.2 * (1 - f) + 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.12, -0.75, 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.12, Math.PI - 0.75, Math.PI + 0.75);
      ctx.stroke();
    } else if (sigCol === "#A855F7" || sigCol === "#C084FC" || b.heroId === "duccong" || b.heroId === "bao" || b.heroId === "luan") {
      // Singularity / mirror prism diamond bracket
      ctx.strokeStyle = isMono ? "#FFFFFF" : mainCol;
      ctx.lineWidth = 1.8 * (1 - f) + 0.5;
      drawUltPolygon(ctx, 0, 0, 4, r * 0.84, f * 2);
      ctx.stroke();
    } else if (sigCol === "#F97316" || sigCol === "#EA580C" || b.heroId === "longhoi" || b.heroId === "danh") {
      // Blazing solar ember petal flares
      for (let pi = 0; pi < 3; pi++) {
        let pa = (Math.PI * 2 * pi) / 3 + f * 1.2;
        drawUltPetal(ctx, pa, r * 0.28, r * 1.12, 5.5 * (1 - f) + 1.5, isMono ? "rgba(255,255,255,0.5)" : "rgba(251, 146, 60, 0.6)", "#FEF08A");
      }
    }
  }

  // Directional collision flare + twin X-cross slash (Heavy & Finisher)
  if (f < 0.78) {
    let starScale = (1 - f / 0.78) * (isFinisher ? 1.75 : isHeavy ? 1.38 : 0.92);
    drawFourPointStar(ctx, 0, 0, 12.5 * starScale, 2.5 * starScale, isMono ? "#E2E8F0" : "#FEF08A", isMono ? "#0F172A" : mainCol);
    if (isHeavy) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : (isFinisher ? "#FFFFFF" : "rgba(254, 240, 138, 0.88)");
      ctx.lineWidth = (isFinisher ? 3.2 : 2.1) * (1 - f);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 1.32, -r * 0.64);
      ctx.lineTo(r * 1.32, r * 0.64);
      ctx.moveTo(-r * 0.92, r * 0.68);
      ctx.lineTo(r * 0.92, -r * 0.68);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawGroundCrack(ctx, h, elapsedTime, isMono) {
  let f = Math.max(0, 1 - h.life / h.maxLife);
  if (f <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = f;
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle || 0);

  let pts = h.points;
  if (!pts || pts.length < 2) {
    pts = [];
    let steps = 7;
    let stepLen = (h.len || 80) / steps;
    for (let i = 0; i <= steps; i++) {
      let off = i === 0 || i === steps ? 0 : Math.sin(i * 2.7 + (h.x || 0) * 0.13) * 6.5;
      pts.push({ x: i * stepLen, y: off });
    }
  }

  let pulse = 0.72 + 0.28 * Math.sin((elapsedTime || 0) * 7 + (h.id || 0));

  // 1. Stone rim bevel shadow (creates sunken 3D fissure depth)
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y + 2.2);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y + 2.2);
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.45)" : "rgba(148, 163, 184, 0.28)";
  ctx.lineWidth = 7.5;
  ctx.stroke();

  // 2. Deep dark fractured earth chasm polygon/path
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = "#060911";
  ctx.lineWidth = 6.2;
  ctx.stroke();

  // 3. Outer elemental glow seam inside the fracture
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = isMono ? "#222222" : h.color || "#EA580C";
  ctx.lineWidth = 3.2;
  ctx.stroke();

  // 4. Inner hot glowing core fissure vein
  ctx.save();
  ctx.globalAlpha = f * pulse;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = isMono ? "#777777" : h.glowColor || "#FEF08A";
  ctx.lineWidth = 1.45;
  ctx.stroke();
  ctx.restore();

  // 5. Jagged secondary branches tapering into hairline fractures
  if (Array.isArray(h.branches)) {
    for (let b of h.branches) {
      let sx = b.sx !== undefined ? b.sx : 0;
      let sy = b.sy !== undefined ? b.sy : 0;
      let mx = b.mx !== undefined ? b.mx : (sx + b.dx) * 0.52;
      let my = b.my !== undefined ? b.my : (sy + b.dy) * 0.52 + 3;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx, my);
      ctx.lineTo(b.dx, b.dy);
      ctx.strokeStyle = "#060911";
      ctx.lineWidth = (b.w || 2) + 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx, my);
      ctx.lineTo(b.dx, b.dy);
      ctx.strokeStyle = isMono ? "#111111" : h.color || "#EA580C";
      ctx.lineWidth = b.w || 1.8;
      ctx.stroke();
    }
  }

  // 6. Scattered angular stone debris chips around crack rim
  if (Array.isArray(h.rockChips)) {
    for (let rc of h.rockChips) {
      ctx.save();
      ctx.translate(rc.x, rc.y);
      ctx.rotate(rc.rot || 0);
      let s = rc.s || 3.5;
      ctx.fillStyle = isMono ? "#222222" : "#334155";
      ctx.strokeStyle = "#090D16";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.5);
      ctx.lineTo(s * 0.8, -s * 0.7);
      ctx.lineTo(s, s * 0.6);
      ctx.lineTo(-s * 0.5, s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

export function drawHeroBody(ctx, opts) {
  let {
    heroId = "",
    radius = 22,
    facing = 0,
    color = "#38BDF8",
    accentColor = "#BAE6FD",
    isMono = false,
    hitFlash = false,
    isUlt = false,
    isStealth = false,
    isDowned = false,
    borderColor = null,
    elapsedTime = 0,
    moveSpeedFactor = 0,
    walkCyclePhase = 0,
    nhiAmmoType = "purple",
    ducanhRolling = false,
    ducanhFortress = false,
    bachDashing = false,
    thaiInArena = false,
    khairAiming = false,
    attackAnimTimer = 0,
    weaponAttackDuration = 0.22,
    weaponSkillTimer = 0,
    weaponSkillDur = 0.46
  } = opts;

  let hitWhite = hitFlash > 0;
  let fillMain = isMono ? "#090D16" : hitWhite ? "#FCA5A5" : color;
  let fillAccent = isMono ? "#334155" : hitWhite ? "#E2E8F0" : accentColor;
  let trimCol = isMono ? "#94A3B8" : borderColor || (isUlt ? "#FBBF24" : isStealth ? "#E879F9" : "#E2E8F0");
  let markCol = isMono ? "#FFFFFF" : hitWhite ? "#0F172A" : fillAccent;
  let darkInk = isMono ? "#111111" : "rgba(10, 16, 30, 0.58)";
  let moveAmt = clamp(moveSpeedFactor || 0, 0, 1);
  let sway = Math.sin(elapsedTime * (5.5 + moveAmt * 4.5) + walkCyclePhase * 0.5);
  let rawAtkProg = attackAnimTimer > 0 ? clamp(1 - attackAnimTimer / Math.max(0.06, weaponAttackDuration || 0.22), 0, 1) : 0;
  let atkProg = rawAtkProg > 0 ? clamp(getCosmicSwingEase(rawAtkProg), -0.1, 1.06) : 0;
  let atkLunge = rawAtkProg > 0 ? Math.sin(Math.max(0, atkProg) * Math.PI) * 4.4 : 0;
  let skillProg = weaponSkillTimer > 0 ? clamp(1 - weaponSkillTimer / Math.max(0.08, weaponSkillDur || 0.46), 0, 1) : 0;
  let skillFlare = skillProg > 0 ? Math.sin(skillProg * Math.PI) : 0;
  let stride = moveAmt > 0.08 ? Math.sin(walkCyclePhase || elapsedTime * 11) * moveAmt : 0;

  ctx.save();
  ctx.rotate(facing);
  if (Math.abs(atkLunge) > 0.05) {
    ctx.translate(atkLunge, 0);
  }
  if (hitWhite) {
    ctx.scale(0.92, 1.07);
  } else if (isDowned) {
    ctx.scale(1.12, 0.82);
  } else if (skillFlare > 0.05) {
    ctx.scale(1 + skillFlare * 0.075, 1 + skillFlare * 0.075);
  }

  // Soft ambient glow + Ult orbital crown + orbiting neon motes beneath circular hero body
  if (isUlt || skillFlare > 0.12) {
    let auraR = radius * (isUlt ? 1.58 : 1.36);
    let uGrad = ctx.createRadialGradient(0, 0, radius * 0.55, 0, 0, auraR);
    uGrad.addColorStop(0, "rgba(0,0,0,0)");
    uGrad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.22)" : isUlt ? "rgba(251, 191, 36, 0.3)" : `${fillAccent}40`);
    uGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = uGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    if (!isDowned) {
      ctx.save();
      if (!isMono) ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = isUlt ? 0.65 : skillFlare * 0.65;
      for (let mi = 0; mi < 3; mi++) {
        let ma = elapsedTime * 4.8 + (Math.PI * 2 / 3) * mi;
        let mr = radius * (isUlt ? 1.38 : 1.24);
        ctx.fillStyle = isMono ? "#FFFFFF" : fillAccent;
        ctx.beginPath();
        ctx.arc(Math.cos(ma) * mr, Math.sin(ma) * mr, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  if (isUlt && !isDowned) {
    ctx.save();
    ctx.rotate(elapsedTime * 2.2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let oi = 0; oi < 4; oi++) {
      let oa = (Math.PI / 2) * oi;
      drawFourPointStar(ctx, Math.cos(oa) * radius * 1.28, Math.sin(oa) * radius * 1.28, 4.2, 1.4, "#FEF08A", isMono ? "#000000" : trimCol);
    }
    ctx.restore();
  }

  // Foot stride pads when walking cleanly underneath cloak/armor
  if (!isDowned && moveAmt > 0.08) {
    for (let s of [-1, 1]) {
      let footX = stride * s * 6.5;
      let footY = s * (radius * 0.48);
      ctx.fillStyle = isMono ? "#111111" : "#0F172A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : fillAccent;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(footX, footY, 4.6, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (skillFlare > 0.15) {
    ctx.strokeStyle = isMono ? "#FFFFFF" : fillAccent;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1.18 + skillFlare * 0.24), -0.95, 0.95);
    ctx.stroke();
  }

  // 0. Back/Outer Silhouette Layer (capes, tails, halos, shoulder armor — outside radius)
  if (heroId === "dung") {
    // Thunder War-God flowing azure-gold cape + spiked lightning pauldrons
    ctx.fillStyle = isMono ? "#1A1A1A" : isUlt ? "#1E3A8A" : "#0C4A6E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#FDE047" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, -radius * 0.72);
    ctx.quadraticCurveTo(-radius * 1.35, -radius * 0.8 + sway * 4, -radius * 1.62, -radius * 0.25 + sway * 5);
    ctx.lineTo(-radius * 1.38, 0 + sway * 3);
    ctx.lineTo(-radius * 1.62, radius * 0.25 + sway * 5);
    ctx.quadraticCurveTo(-radius * 1.35, radius * 0.8 + sway * 4, -radius * 0.4, radius * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin armored shoulder pauldrons with gold thunder fins
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#0369A1";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, s * (radius * 0.68));
      ctx.lineTo(-10, s * (radius * 1.24));
      ctx.lineTo(5, s * (radius * 1.12));
      ctx.lineTo(8, s * (radius * 0.72));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "tin") {
    // Rift Reaper tattered crimson-obsidian scarf + twin floating void blade fins
    ctx.fillStyle = isMono ? "#111111" : "#881337";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, -5);
    ctx.quadraticCurveTo(-radius * 1.2, -13 + sway * 5, -radius * 1.68, -6 + sway * 6);
    ctx.lineTo(-radius * 1.32, 0 + sway * 4);
    ctx.lineTo(-radius * 1.56, 8 + sway * 5);
    ctx.quadraticCurveTo(-radius * 1.0, 9, -radius * 0.48, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#4C0519";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F43F5E";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-2, s * radius * 0.78);
      ctx.lineTo(-12, s * radius * 1.28);
      ctx.lineTo(2, s * radius * 1.02);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "kin") {
    // Gale Sovereign emerald-gold twin wind ribbons & ranger shoulder mantle
    for (let s of [-1, 1]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-radius * 0.45, s * 6);
      ctx.quadraticCurveTo(-radius * 1.1, s * 14 + sway * 4, -radius * 1.62, s * 8 + sway * 6);
      ctx.stroke();
      ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = isMono ? "#222222" : "#065F46";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#6EE7B7";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(4, s * radius * 0.72);
      ctx.lineTo(-9, s * radius * 1.18);
      ctx.lineTo(-4, s * radius * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "trung") {
    // Celestial Archmage rotating golden astrolabe ring halo + indigo cloak
    ctx.fillStyle = isMono ? "#111111" : "#1E1B4B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#818CF8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, -radius * 0.7);
    ctx.quadraticCurveTo(-radius * 1.25, -radius * 0.65 + sway * 3, -radius * 1.48, 0 + sway * 3);
    ctx.quadraticCurveTo(-radius * 1.25, radius * 0.65 + sway * 3, -radius * 0.4, radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(elapsedTime * 1.4);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      let ha = (Math.PI / 2) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#38BDF8";
      ctx.beginPath();
      ctx.arc(Math.cos(ha) * radius * 1.26, Math.sin(ha) * radius * 1.26, 2.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (heroId === "eohyen") {
    // Frost Empress flowing glacial cape + twin crystalline ice crown wings
    ctx.fillStyle = isMono ? "#1A1A1A" : "#0C4A6E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, -radius * 0.72);
    ctx.quadraticCurveTo(-radius * 1.25, -radius * 0.8 + sway * 4, -radius * 1.55, 0 + sway * 3);
    ctx.quadraticCurveTo(-radius * 1.25, radius * 0.8 + sway * 4, -radius * 0.38, radius * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#444444" : "#38BDF8";
      ctx.strokeStyle = "#E0F2FE";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(2, s * radius * 0.78);
      ctx.lineTo(-10, s * radius * 1.28);
      ctx.lineTo(-3, s * radius * 1.06);
      ctx.lineTo(-14, s * radius * 1.12);
      ctx.lineTo(-5, s * radius * 0.74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "longhoi") {
    // Nine-Tailed Blazing Fox Marksman: 5 fanned blazing spirit fox-tails + sharp fox ears!
    for (let ti = -2; ti <= 2; ti++) {
      let baseA = Math.PI + ti * 0.34 + sway * 0.08 * (1 + Math.abs(ti) * 0.2);
      let len = radius * (1.42 - Math.abs(ti) * 0.1);
      let tx = Math.cos(baseA) * len;
      let ty = Math.sin(baseA) * len;
      let cx = Math.cos(baseA - 0.16) * (len * 0.65);
      let cy = Math.sin(baseA - 0.16) * (len * 0.65);
      let cx2 = Math.cos(baseA + 0.16) * (len * 0.65);
      let cy2 = Math.sin(baseA + 0.16) * (len * 0.65);

      ctx.fillStyle = isMono ? "#222222" : Math.abs(ti) % 2 === 0 ? "#EA580C" : "#F97316";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.45, ti * 2.5);
      ctx.quadraticCurveTo(cx, cy, tx, ty);
      ctx.quadraticCurveTo(cx2, cy2, -radius * 0.45, ti * 2.5);
      ctx.fill();
      ctx.stroke();

      // White-gold flame tip on each tail
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.beginPath();
      ctx.arc(tx * 0.9, ty * 0.9, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sharp Fox Ears
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#111111" : "#9A3412";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDBA74";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, s * radius * 0.72);
      ctx.lineTo(-10, s * radius * 1.22);
      ctx.lineTo(8, s * radius * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "duccong") {
    // Singularity Mage dark cosmic mantle + tilted purple-cyan accretion halo
    ctx.fillStyle = isMono ? "#111111" : "#1E1038";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#A78BFA";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.74);
    ctx.quadraticCurveTo(-radius * 1.3, -radius * 0.72 + sway * 3, -radius * 1.52, 0 + sway * 3);
    ctx.quadraticCurveTo(-radius * 1.3, radius * 0.72 + sway * 3, -radius * 0.42, radius * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(elapsedTime * 1.9);
    ctx.scale(0.82, 1.22);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (heroId === "gau") {
    // Berserk Bear Titan: massive bronze-iron pauldrons + bear ears + molten vents when Ult!
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : isUlt ? "#9A3412" : "#78350F";
      ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#FEF08A" : "#F59E0B";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-2, s * (radius * 0.88), radius * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bear ear crest
      ctx.fillStyle = isMono ? "#111111" : "#B45309";
      ctx.beginPath();
      ctx.arc(-7, s * (radius * 0.74), 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "bao") {
    // Phantom Shadow Assassin: billowing eclipse shadow cloak + twin shadow-crescent wings
    ctx.fillStyle = isMono ? "#111111" : "#2E1065";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, -radius * 0.68);
    ctx.quadraticCurveTo(-radius * 1.28, -radius * 0.88 + sway * 5, -radius * 1.65, -radius * 0.22 + sway * 6);
    ctx.lineTo(-radius * 1.22, 0 + sway * 3);
    ctx.lineTo(-radius * 1.65, radius * 0.22 + sway * 6);
    ctx.quadraticCurveTo(-radius * 1.28, radius * 0.88 + sway * 5, -radius * 0.4, radius * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (heroId === "danh") {
    // Crimson Dragon Blade: imperial crimson-gold warlord cape + dragon shoulder plates & curved dragon horns
    ctx.fillStyle = isMono ? "#1A1A1A" : "#7F1D1D";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.74);
    ctx.quadraticCurveTo(-radius * 1.34, -radius * 0.84 + sway * 4, -radius * 1.58, -radius * 0.18 + sway * 5);
    ctx.lineTo(-radius * 1.32, 0 + sway * 3);
    ctx.lineTo(-radius * 1.58, radius * 0.18 + sway * 5);
    ctx.quadraticCurveTo(-radius * 1.34, radius * 0.84 + sway * 4, -radius * 0.42, radius * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#333333" : "#B45309";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, s * radius * 0.7);
      ctx.lineTo(-10, s * radius * 1.24);
      ctx.lineTo(7, s * radius * 1.06);
      ctx.lineTo(9, s * radius * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Swept dragon horns
      ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#FEF08A" : "#F59E0B";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(4, s * radius * 0.56);
      ctx.quadraticCurveTo(-4, s * radius * 1.05, -13, s * radius * 0.96);
      ctx.stroke();
    }
  } else if (heroId === "luan") {
    // Annihilation Archmage: jagged dimensional rift cloak + counter-rotating void-rune halo + hovering mirror prisms
    ctx.fillStyle = isMono ? "#141414" : "#2E1065";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, -radius * 0.74);
    ctx.quadraticCurveTo(-radius * 1.32, -radius * 0.88 + sway * 4.5, -radius * 1.62, -radius * 0.26 + sway * 5);
    ctx.lineTo(-radius * 1.28, -radius * 0.08 + sway * 2.5);
    ctx.lineTo(-radius * 1.66, 0 + sway * 3.5);
    ctx.lineTo(-radius * 1.28, radius * 0.08 + sway * 2.5);
    ctx.lineTo(-radius * 1.62, radius * 0.26 + sway * 5);
    ctx.quadraticCurveTo(-radius * 1.32, radius * 0.88 + sway * 4.5, -radius * 0.4, radius * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle spatial rift halo behind shoulders
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(-elapsedTime * 1.7);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Twin levitating fractured mirror shards flanking shoulders
    for (let s of [-1, 1]) {
      let bob = Math.sin(elapsedTime * 3.6 + s * 1.4) * 2.2;
      ctx.fillStyle = isMono ? "#333333" : "#7E22CE";
      ctx.strokeStyle = isMono ? "#FFFFFF" : s < 0 ? "#67E8F9" : "#F5D0FE";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(2, s * (radius * 0.88 + bob));
      ctx.lineTo(-6, s * (radius * 1.26 + bob));
      ctx.lineTo(-12, s * (radius * 0.96 + bob));
      ctx.lineTo(-4, s * (radius * 0.74 + bob));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "taidu") {
    // Tech Gunner Commander: twin plasma jet-thruster flames + angular exo-pauldrons + cybernetic comms fin
    let jetLen = radius * (0.45 + moveAmt * 0.42 + Math.sin(elapsedTime * 26) * 0.12);
    for (let s of [-1, 1]) {
      // Thruster exhaust flame
      ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
      ctx.beginPath();
      ctx.moveTo(-radius * 0.78, s * 7.5);
      ctx.lineTo(-radius * 0.78 - jetLen, s * 10.5);
      ctx.lineTo(-radius * 0.72, s * 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isMono ? "#CCCCCC" : "#FEF08A";
      ctx.beginPath();
      ctx.moveTo(-radius * 0.78, s * 6.8);
      ctx.lineTo(-radius * 0.78 - jetLen * 0.55, s * 9.2);
      ctx.lineTo(-radius * 0.74, s * 4.6);
      ctx.closePath();
      ctx.fill();

      // Armored slate-orange exo-pauldron with cyan energy vent
      ctx.fillStyle = isMono ? "#222222" : "#1E293B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(7, s * radius * 0.7);
      ctx.lineTo(3, s * radius * 1.18);
      ctx.lineTo(-10, s * radius * 1.12);
      ctx.lineTo(-12, s * radius * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, s * radius * 0.98);
      ctx.lineTo(-7, s * radius * 0.96);
      ctx.stroke();
    }
    // Right-shoulder holographic targeting antenna fin
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -radius * 1.05);
    ctx.lineTo(-11, -radius * 1.38);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.beginPath();
    ctx.arc(-11, -radius * 1.38, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "nguyen") {
    // Sanctuary Guardian: royal emerald-gold cloak + sculpted golden wing-pauldrons + radiant lotus halo
    ctx.fillStyle = isMono ? "#141414" : "#064E3B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, -radius * 0.72);
    ctx.quadraticCurveTo(-radius * 1.28, -radius * 0.8 + sway * 3.5, -radius * 1.54, 0 + sway * 3);
    ctx.quadraticCurveTo(-radius * 1.28, radius * 0.8 + sway * 3.5, -radius * 0.38, radius * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle rotating golden sanctuary crest behind shoulders
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(elapsedTime * 0.9);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.75)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      let la = (Math.PI / 2) * i;
      ctx.beginPath();
      ctx.ellipse(Math.cos(la) * radius * 1.12, Math.sin(la) * radius * 1.12, 4.5, 2.2, la, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Sculpted emerald-gold sanctuary shoulder wings
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#047857";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(6, s * radius * 0.68);
      ctx.quadraticCurveTo(2, s * radius * 1.28, -11, s * radius * 1.14);
      ctx.lineTo(-6, s * radius * 0.74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "phong") {
    // Phong — Glowing blue-cyan shadow mist halo + dual flowing ninja scarves + azure blade pauldrons
    let auraR = radius * (isUlt ? 1.65 : 1.42) + Math.sin(elapsedTime * 7) * 1.5;
    let aura = ctx.createRadialGradient(-2, 0, radius * 0.35, -2, 0, auraR);
    aura.addColorStop(0, "rgba(14, 165, 233, 0)");
    aura.addColorStop(0.65, isMono ? "rgba(255,255,255,0.2)" : "rgba(34, 211, 238, 0.28)");
    aura.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-2, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Flowing blue-cyan dual shadow scarf tails
    ctx.fillStyle = isMono ? "#111111" : "#075985";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -6);
    ctx.quadraticCurveTo(-radius * 1.35, -16 + sway * 5.5, -radius * 1.92, -6 + sway * 6.5);
    ctx.lineTo(-radius * 1.38, 0 + sway * 4);
    ctx.lineTo(-radius * 1.78, 9 + sway * 5.5);
    ctx.quadraticCurveTo(-radius * 1.15, 11, -radius * 0.42, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright cyan energy trail ribbon on scarf
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.55, 0);
    ctx.quadraticCurveTo(-radius * 1.18, sway * 4, -radius * 1.62, -2 + sway * 5);
    ctx.stroke();

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#0369A1";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(5, s * radius * 0.68);
      ctx.lineTo(-14, s * radius * 1.34);
      ctx.lineTo(-3, s * radius * 0.98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "dang") {
    // Đăng — Swirling Black & White Tiger Qi aura + stark Bạch/Hắc Hổ pauldrons with tiger stripes
    let qiR = radius * (isUlt ? 1.68 : 1.44);
    ctx.save();
    ctx.rotate(elapsedTime * (isUlt ? 3.8 : 1.9));
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(248, 250, 252, 0.72)";
    ctx.lineWidth = isUlt ? 2.8 : 1.9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, qiR, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#222222" : "rgba(24, 24, 27, 0.88)";
    ctx.lineWidth = isUlt ? 3.2 : 2.1;
    ctx.beginPath();
    ctx.arc(0, 0, qiR, Math.PI + 0.15, Math.PI * 2 - 0.15);
    ctx.stroke();
    ctx.restore();

    for (let s of [-1, 1]) {
      let isWhite = s < 0;
      ctx.fillStyle = isMono ? "#222222" : isWhite ? "#F8FAFC" : "#18181B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : isWhite ? "#18181B" : "#F8FAFC";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(7, s * radius * 0.66);
      ctx.lineTo(1, s * radius * 1.32);
      ctx.lineTo(-12, s * radius * 1.1);
      ctx.lineTo(-7, s * radius * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Contrasting tiger stripe on each pauldron
      ctx.strokeStyle = isMono ? "#FFFFFF" : isWhite ? "#09090B" : "#F8FAFC";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, s * radius * 0.88);
      ctx.lineTo(-6, s * radius * 1.06);
      ctx.stroke();
    }
  } else if (heroId === "thien") {
    // Thiên — Boss-tier Creator Deity: cosmic aura, counter-rotating dual astrolabe rings & 6 luminous celestial wings
    let auraR = radius * (isUlt ? 2.1 : 1.78) + Math.sin(elapsedTime * 4.5) * 2.2;
    let aura = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, auraR);
    aura.addColorStop(0, "rgba(250, 204, 21, 0)");
    aura.addColorStop(0.55, isMono ? "rgba(255,255,255,0.22)" : "rgba(56, 189, 248, 0.25)");
    aura.addColorStop(0.82, isMono ? "rgba(255,255,255,0.12)" : "rgba(250, 204, 21, 0.2)");
    aura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Outer celestial astrolabe ring (gold)
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(elapsedTime * (isUlt ? 1.75 : 0.95));
    let ringR = radius * (isUlt ? 1.56 : 1.4);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = isUlt ? 2.4 : 1.9;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      let sx = Math.cos(a) * ringR;
      let sy = Math.sin(a) * ringR;
      drawFourPointStar(ctx, sx, sy, i % 2 === 0 ? 5.2 : 3.6, 1.6, i % 2 === 0 ? "#FDE047" : "#38BDF8", "#FFFFFF");
    }
    ctx.restore();

    // Inner counter-rotating galaxy rune ring (cosmic cyan)
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(-elapsedTime * (isUlt ? 2.1 : 1.25));
    let innerR = radius * (isUlt ? 1.26 : 1.15);
    ctx.strokeStyle = isMono ? "#E5E7EB" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let a0 = (Math.PI * 0.5) * i + 0.12;
      ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.arc(0, 0, innerR, a0, a0 + 0.85);
    }
    ctx.stroke();
    ctx.restore();

    // Six Luminous Celestial Wings behind shoulders
    for (let s of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        let flap = Math.sin(elapsedTime * 3.8 + w * 0.8) * 0.1;
        let len = radius * (1.58 - w * 0.24) * (isUlt ? 1.14 : 1.0);
        let spread = (0.62 + w * 0.42) + flap;
        ctx.save();
        ctx.translate(-4, s * (4 + w * 2.5));
        ctx.rotate(s * (Math.PI - spread));
        let wGrad = ctx.createLinearGradient(0, 0, len, 0);
        wGrad.addColorStop(0, "#FFFFFF");
        wGrad.addColorStop(0.55, w === 1 ? "#38BDF8" : "#FDE047");
        wGrad.addColorStop(1, "rgba(248, 250, 252, 0.25)");
        ctx.fillStyle = wGrad;
        ctx.strokeStyle = w === 1 ? "#38BDF8" : "#FACC15";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, -2.2);
        ctx.quadraticCurveTo(len * 0.55, -s * 7.5, len, 0);
        ctx.quadraticCurveTo(len * 0.5, s * 4.5, 0, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  } else if (heroId === "thanh") {
    // Thanh — Shadow Serpent Sovereign: venomous jade-amethyst aura, twin undulating cobra cloak tails & horned serpent pauldrons
    let auraR = radius * (isUlt ? 1.85 : 1.48) + Math.sin(elapsedTime * 5.2) * 1.8;
    let aura = ctx.createRadialGradient(-2, 0, radius * 0.32, -2, 0, auraR);
    aura.addColorStop(0, "rgba(16, 185, 129, 0)");
    aura.addColorStop(0.58, isMono ? "rgba(255,255,255,0.18)" : isUlt ? "rgba(168, 85, 247, 0.34)" : "rgba(16, 185, 129, 0.26)");
    aura.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-2, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Twin undulating serpent-scale cape ribbons
    ctx.fillStyle = isMono ? "#111111" : "#022C22";
    ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#C084FC" : "#34D399";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, -radius * 0.68);
    ctx.quadraticCurveTo(-radius * 1.32, -radius * 0.85 + sway * 5.2, -radius * 1.85, -radius * 0.34 + sway * 6.0);
    ctx.lineTo(-radius * 1.25, sway * 3.5);
    ctx.lineTo(-radius * 1.82, radius * 0.38 + sway * 5.8);
    ctx.quadraticCurveTo(-radius * 1.3, radius * 0.85 + sway * 5.2, -radius * 0.38, radius * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hooded Cobra Shoulder Fangs
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#064E3B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#A7F3D0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, s * radius * 0.68);
      ctx.quadraticCurveTo(-2, s * radius * 1.34, -14, s * radius * 1.12);
      ctx.lineTo(-7, s * radius * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "nhi") {
    // Nhi — Arcane Alchemist Marksman: reagent-tinted scholar cape + twin glowing shoulder elixir vials
    let elixirCol = isMono
      ? "#FFFFFF"
      : nhiAmmoType === "green"
      ? "#4ADE80"
      : nhiAmmoType === "life"
      ? "#2DD4BF"
      : "#E879F9";
    let auraR = radius * 1.46 + Math.sin(elapsedTime * 4.4) * 1.6;
    let aura = ctx.createRadialGradient(-2, 0, radius * 0.35, -2, 0, auraR);
    aura.addColorStop(0, "rgba(0,0,0,0)");
    aura.addColorStop(0.65, isMono ? "rgba(255,255,255,0.16)" : `${elixirCol}38`);
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-2, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Swallowtail alchemist cloak
    ctx.fillStyle = isMono ? "#141414" : "#2E1065";
    ctx.strokeStyle = isMono ? "#FFFFFF" : elixirCol;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, -radius * 0.7);
    ctx.quadraticCurveTo(-radius * 1.28, -radius * 0.8 + sway * 4, -radius * 1.62, -radius * 0.28 + sway * 4.5);
    ctx.lineTo(-radius * 1.18, sway * 3);
    ctx.lineTo(-radius * 1.62, radius * 0.28 + sway * 4.5);
    ctx.quadraticCurveTo(-radius * 1.28, radius * 0.8 + sway * 4, -radius * 0.4, radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin glowing glass shoulder reagent vials
    for (let s of [-1, 1]) {
      let vy = s * radius * 0.94;
      ctx.fillStyle = isMono ? "#222222" : "#0F172A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-4, vy, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = elixirCol;
      ctx.beginPath();
      ctx.arc(-4, vy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (heroId === "minh") {
    // Minh — Celestial Arbiter: royal sapphire-gold mantle + solar halo crown + counter-rotating astrolabe seal ring
    let auraR = radius * 1.54 + Math.sin(elapsedTime * 4) * 1.6;
    let aura = ctx.createRadialGradient(-2, 0, radius * 0.3, -2, 0, auraR);
    aura.addColorStop(0, "rgba(250, 204, 21, 0)");
    aura.addColorStop(0.62, isMono ? "rgba(255,255,255,0.22)" : "rgba(56, 189, 248, 0.24)");
    aura.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-2, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Flowing sapphire & gold-trimmed Arbiter Cloak
    ctx.fillStyle = isMono ? "#111111" : "#1E3A8A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.36, -radius * 0.74);
    ctx.quadraticCurveTo(-radius * 1.35, -radius * 0.84 + sway * 4, -radius * 1.68, 0 + sway * 3.5);
    ctx.quadraticCurveTo(-radius * 1.35, radius * 0.84 + sway * 4, -radius * 0.36, radius * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sculpted Gold & Ivory Shoulder Epaulets
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#262626" : "#F8FAFC";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, s * radius * 0.66);
      ctx.quadraticCurveTo(0, s * radius * 1.24, -10, s * radius * 1.06);
      ctx.lineTo(-5, s * radius * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Orbiting golden celestial seal ring & diamond nodes
    ctx.save();
    ctx.rotate(elapsedTime * 1.55);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 1.9;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      let a = (Math.PI / 2) * i;
      let sx = Math.cos(a) * radius * 1.36;
      let sy = Math.sin(a) * radius * 1.36;
      drawFourPointStar(ctx, sx, sy, 4.6, 1.7, i % 2 === 0 ? "#FDE047" : "#38BDF8", "#FFFFFF");
    }
    ctx.restore();
  } else if (heroId === "ducanh") {
    if (ducanhRolling) {
      // C1 Thiết Cầu Xung Phong — Blazing Turbine Saw-Spiked Siege Wrecking Ball
      let rollR = radius * 1.34;
      let spin = elapsedTime * 15;

      // Speed trail flames behind the rolling boulder
      for (let t = 1; t <= 3; t++) {
        ctx.fillStyle = isMono ? `rgba(255,255,255,${0.25 / t})` : `rgba(249, 115, 22, ${0.34 / t})`;
        ctx.beginPath();
        ctx.arc(-t * 10, 0, rollR * (1 - t * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }

      let rg = ctx.createRadialGradient(-rollR * 0.28, -rollR * 0.28, rollR * 0.08, 0, 0, rollR);
      rg.addColorStop(0, hitWhite ? "#FFFFFF" : "#E2E8F0");
      rg.addColorStop(0.5, hitWhite ? "#E2E8F0" : "#475569");
      rg.addColorStop(1, "#0F172A");
      ctx.fillStyle = isMono ? "#1F2937" : rg;
      ctx.beginPath();
      ctx.arc(0, 0, rollR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Rotating curved turbine saw-spikes & molten furnace core
      ctx.save();
      ctx.rotate(spin);
      for (let i = 0; i < 8; i++) {
        let sa = (Math.PI / 4) * i;
        ctx.save();
        ctx.rotate(sa);
        ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rollR - 3, -5.2);
        ctx.quadraticCurveTo(rollR + 5, -2.5, rollR + 10, 2);
        ctx.lineTo(rollR - 2, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-rollR * 0.76, 0);
      ctx.lineTo(rollR * 0.76, 0);
      ctx.moveTo(0, -rollR * 0.76);
      ctx.lineTo(0, rollR * 0.76);
      ctx.stroke();

      let coreG = ctx.createRadialGradient(0, 0, 1, 0, 0, 10);
      coreG.addColorStop(0, "#FEF08A");
      coreG.addColorStop(0.65, "#F97316");
      coreG.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = coreG;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
      return;
    }

    if (ducanhFortress) {
      // C2 Pháo Đài Thiết Giáp — Multi-Shield Interlocking Citadel Dome
      let fortR = radius * 1.42;
      let pulse = 1 + 0.045 * Math.sin(elapsedTime * 8);
      ctx.save();
      ctx.scale(pulse, pulse);

      ctx.fillStyle = isMono ? "#111111" : "rgba(30, 58, 138, 0.36)";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#60A5FA";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(0, 0, fortR * 1.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 6 Orbiting Riot Tower Shields locked around perimeter
      ctx.save();
      ctx.rotate(elapsedTime * 0.85);
      for (let i = 0; i < 6; i++) {
        let a = (Math.PI / 3) * i;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = isMono ? "#333333" : "#475569";
        ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(fortR * 0.92, -9, 8.5, 18, 2.5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Inner Armored Hexagon Citadel + Glowing Vitality Core
      ctx.fillStyle = isMono ? "#262626" : "#334155";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#E2E8F0";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let a = (Math.PI / 3) * i;
        let px = Math.cos(a) * fortR * 0.92;
        let py = Math.sin(a) * fortR * 0.92;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1E3A8A";
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let a = (Math.PI / 3) * i + Math.PI / 6;
        let px = Math.cos(a) * fortR * 0.56;
        let py = Math.sin(a) * fortR * 0.56;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#4ADE80";
      ctx.beginPath();
      ctx.arc(0, 0, 5.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
      return;
    }

    // Normal stance: massive heavy dreadnought iron-amber siege pauldrons + furnace exhaust vents
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#334155";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(9, s * radius * 0.62);
      ctx.lineTo(4, s * radius * 1.28);
      ctx.lineTo(-14, s * radius * 1.15);
      ctx.lineTo(-9, s * radius * 0.66);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Molten vent grille + shoulder rivet
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
      ctx.beginPath();
      ctx.arc(-4, s * radius * 0.96, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (heroId === "bach") {
    // Bach — Flowing Twin Cyan-Orchid Wind Scarves + Razor Agile Pauldrons + CC-Immune Dash Halo
    if (bachDashing || isUlt) {
      let dashAura = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.65);
      dashAura.addColorStop(0, "rgba(103, 232, 249, 0)");
      dashAura.addColorStop(0.65, isMono ? "rgba(255,255,255,0.28)" : "rgba(34, 211, 238, 0.34)");
      dashAura.addColorStop(1, "rgba(232, 121, 249, 0)");
      ctx.fillStyle = dashAura;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.32, -1.25, 1.25);
      ctx.stroke();
    }

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#1F2937" : s === -1 ? "#0891B2" : "#701A75";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.32, s * radius * 0.38);
      ctx.quadraticCurveTo(-radius * 1.28, s * (radius * 0.72 + sway * 4.5), -radius * 1.72, s * (radius * 0.32 - sway * 3));
      ctx.quadraticCurveTo(-radius * 1.02, s * radius * 0.22, -radius * 0.38, s * radius * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sleek wind-wing shoulder blade
      ctx.fillStyle = isMono ? "#262626" : "#0F172A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(6, s * radius * 0.64);
      ctx.lineTo(-4, s * radius * 1.18);
      ctx.lineTo(-14, s * radius * 0.94);
      ctx.lineTo(-6, s * radius * 0.66);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "thai") {
    // Thai — Imperial Crimson-Gold Gladiator Mantle + Colosseum Spiked Pauldrons
    if (thaiInArena || isUlt) {
      let warAura = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 1.7);
      warAura.addColorStop(0, "rgba(250, 204, 21, 0)");
      warAura.addColorStop(0.62, isMono ? "rgba(255,255,255,0.28)" : "rgba(239, 68, 68, 0.36)");
      warAura.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = warAura;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.lineWidth = 2.1;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Crimson imperial arena cape
    ctx.fillStyle = isMono ? "#111111" : "#7F1D1D";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.34, -radius * 0.74);
    ctx.quadraticCurveTo(-radius * 1.38, -radius * 0.88 + sway * 3.5, -radius * 1.66, sway * 3);
    ctx.quadraticCurveTo(-radius * 1.38, radius * 0.88 + sway * 3.5, -radius * 0.34, radius * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy spiked Colosseum pauldrons
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#262626" : "#450A0A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(9, s * radius * 0.62);
      ctx.lineTo(3, s * radius * 1.28);
      ctx.lineTo(-13, s * radius * 1.12);
      ctx.lineTo(-8, s * radius * 0.66);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.beginPath();
      ctx.moveTo(2, s * radius * 1.22);
      ctx.lineTo(0, s * radius * 1.52);
      ctx.lineTo(-6, s * radius * 1.16);
      ctx.closePath();
      ctx.fill();
    }
  } else if (heroId === "khair") {
    // Khair — Navy-Gold Ballistic Sniper Mantle, Ammo Quiver & Focusing Lens Halo
    if (khairAiming || isUlt) {
      ctx.save();
      ctx.rotate(elapsedTime * 1.8);
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Tactical hooded marksman half-cloak
    ctx.fillStyle = isMono ? "#171717" : "#0F172A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.34, -radius * 0.72);
    ctx.quadraticCurveTo(-radius * 1.3, -radius * 0.68 + sway * 3, -radius * 1.56, sway * 2.5);
    ctx.quadraticCurveTo(-radius * 1.3, radius * 0.68 + sway * 3, -radius * 0.34, radius * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right shoulder ballistic stabilizer + gold rail cell
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#262626" : "#1E293B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : s === 1 ? "#FACC15" : "#38BDF8";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(-9, s * radius * 0.66 - (s === 1 ? 0 : 7), 14, 7, 2.5);
      ctx.fill();
      ctx.stroke();
    }
  }

  // 1. Clean circular hero body with multi-stop 3D sphere shading & specular rim
  let bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.08, 0, 0, radius);
  if (isMono) {
    bodyGrad.addColorStop(0, "#525252");
    bodyGrad.addColorStop(0.55, "#171717");
    bodyGrad.addColorStop(1, "#000000");
  } else if (hitWhite) {
    bodyGrad.addColorStop(0, "#FFFFFF");
    bodyGrad.addColorStop(0.65, "#F8FAFC");
    bodyGrad.addColorStop(1, "#CBD5E1");
  } else {
    bodyGrad.addColorStop(0, "#FFFFFF");
    bodyGrad.addColorStop(0.18, fillAccent);
    bodyGrad.addColorStop(0.58, fillMain);
    bodyGrad.addColorStop(1, "#090D16");
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Crisp double-bevel circular framing rim
  ctx.strokeStyle = "#050811";
  ctx.lineWidth = isUlt ? 4.4 : 3.8;
  ctx.stroke();
  ctx.strokeStyle = trimCol;
  ctx.lineWidth = isUlt ? 2.8 : 2.3;
  ctx.stroke();

  // Top-left curved specular sheen & bottom-right bounce rim inside the circle
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.5)" : "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(-radius * 0.14, -radius * 0.14, radius * 0.72, -2.55, -0.78);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.22)" : `${fillAccent}66`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0.35, 1.45);
  ctx.stroke();

  // Subtle dark inner framing ring inside the circle
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.76, 0, Math.PI * 2);
  ctx.strokeStyle = darkInk;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Hero-specific distinctive markings ON the circle (all clipped neatly within radius)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius - 1.5, 0, Math.PI * 2);
  ctx.clip();

  if (heroId === "dung") {
    // Armored War-God breastplate + twin golden-cyan lightning emblem
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(-radius * 0.15, 0, radius * 0.68, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.lineTo(-radius * 0.7, radius * 0.6);
    ctx.lineTo(-radius * 0.7, -radius * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isUlt ? "#FEF08A" : "#E0F2FE";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.34, -radius * 0.42);
    ctx.lineTo(radius * 0.08, -radius * 0.08);
    ctx.lineTo(-radius * 0.1, radius * 0.08);
    ctx.lineTo(radius * 0.24, radius * 0.44);
    ctx.stroke();
    drawFourPointStar(ctx, -radius * 0.05, 0, 4.4, 1.5, isUlt ? "#FEF08A" : "#FFFFFF", null);
  } else if (heroId === "tin") {
    // Void Assassin obsidian hood & crimson X-rift scar + glowing blood-crystal core
    ctx.fillStyle = isMono ? "#111111" : "#1E1028";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.66, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#0F172A";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.46, -radius * 0.42);
    ctx.lineTo(radius * 0.34, radius * 0.38);
    ctx.moveTo(-radius * 0.46, radius * 0.42);
    ctx.lineTo(radius * 0.34, -radius * 0.38);
    ctx.stroke();
    ctx.strokeStyle = markCol;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 5.4, 2.0, "#FFF1F2", isMono ? "#000000" : "#F43F5E");
  } else if (heroId === "kin") {
    // Gale Archer emerald hood trim + twin wind-wing arcs + golden gale chevron
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, Math.PI * 0.52, Math.PI * 1.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = markCol;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    for (let s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(-radius * 0.1, s * radius * 0.14, radius * 0.5, s * 0.35, s * 2.15, s < 0);
      ctx.stroke();
    }
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.beginPath();
    ctx.moveTo(radius * 0.28, 0);
    ctx.lineTo(-radius * 0.16, -radius * 0.24);
    ctx.lineTo(-radius * 0.04, 0);
    ctx.lineTo(-radius * 0.16, radius * 0.24);
    ctx.closePath();
    ctx.fill();
  } else if (heroId === "trung") {
    // Celestial Mage indigo vestments + golden orbit ring + 3 planetary pips
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    let spin = elapsedTime * 2.1;
    for (let i = 0; i < 3; i++) {
      let a = spin + (Math.PI * 2 / 3) * i;
      ctx.fillStyle = i === 0 ? "#FEF08A" : markCol;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * radius * 0.52, Math.sin(a) * radius * 0.52, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFourPointStar(ctx, 0, 0, radius * 0.3, radius * 0.11, "#FFFFFF", isMono ? "#000000" : "#818CF8");
  } else if (heroId === "eohyen") {
    // Frost Queen royal sapphire collar + crisp 6-point ice crystal star
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(-radius * 0.15, 0, radius * 0.64, Math.PI * 0.5, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      let a = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * -radius * 0.52, Math.sin(a) * -radius * 0.52);
      ctx.lineTo(Math.cos(a) * radius * 0.52, Math.sin(a) * radius * 0.52);
      ctx.stroke();
    }
    ctx.fillStyle = "#E0F2FE";
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
  } else if (heroId === "longhoi") {
    // Flame Fox triple ember crest + crimson headband sash
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#EF4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, -Math.PI * 0.72, Math.PI * 0.72);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    for (let i = -1; i <= 1; i++) {
      let ang = i * 0.52 + Math.PI;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        Math.cos(ang - 0.28) * radius * 0.58,
        Math.sin(ang - 0.28) * radius * 0.58,
        Math.cos(ang) * radius * 0.66,
        Math.sin(ang) * radius * 0.66
      );
      ctx.quadraticCurveTo(
        Math.cos(ang + 0.28) * radius * 0.58,
        Math.sin(ang + 0.28) * radius * 0.58,
        0,
        0
      );
      ctx.fill();
    }
    ctx.fillStyle = isMono ? "#000000" : "#EA580C";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "duccong") {
    // Singularity Mage dark event-horizon center + luminous violet-cyan ring & core star
    ctx.fillStyle = "#090418";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = markCol;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.36, 0, Math.PI);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 4.2, 1.4, "#F5D0FE", null);
  } else if (heroId === "gau") {
    // Bear Brawler armor plate + bold triple claw scars + molten rage core
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(-radius * 0.12, 0, radius * 0.68, Math.PI * 0.45, Math.PI * 1.55);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#FEF08A" : "#451A03";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let k of [-0.32, 0, 0.32]) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.4, radius * k - 2);
      ctx.lineTo(radius * 0.24, radius * k + 2);
      ctx.stroke();
    }
    if (isUlt) {
      ctx.strokeStyle = "#F97316";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (heroId === "bao") {
    // Shadow Assassin split shadow-half + luminous lunar crescent mark
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI * 0.5, Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F5D0FE";
    ctx.beginPath();
    ctx.arc(-radius * 0.14, 0, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fillMain;
    ctx.beginPath();
    ctx.arc(-radius * 0.01, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "danh") {
    // Dragon Swordsman imperial armor chest + golden chevron + glowing dragon core
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(-radius * 0.1, 0, radius * 0.66, Math.PI * 0.48, Math.PI * 1.52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, -radius * 0.46);
    ctx.lineTo(radius * 0.2, 0);
    ctx.lineTo(-radius * 0.38, radius * 0.46);
    ctx.stroke();
    if (isUlt) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.5);
      ctx.lineTo(-radius * 0.55, -radius * 0.74);
      ctx.moveTo(0, radius * 0.5);
      ctx.lineTo(-radius * 0.55, radius * 0.74);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, 5.2, 2.0, isMono ? "#FFFFFF" : "#FEF08A", isMono ? "#000000" : "#EF4444");
  } else if (heroId === "luan") {
    // Luận — Deep violet-dark spatial fracture cowl + dual arcane crescent trim + glowing magenta-cyan prism core
    ctx.fillStyle = isMono ? "#111111" : "#170930";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.66, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.66, Math.PI * 0.48, Math.PI * 1.52);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.54, -radius * 0.36);
    ctx.lineTo(-radius * 0.14, -radius * 0.08);
    ctx.lineTo(-radius * 0.46, radius * 0.34);
    ctx.moveTo(radius * 0.18, -radius * 0.48);
    ctx.lineTo(-radius * 0.04, 0);
    ctx.lineTo(radius * 0.22, radius * 0.46);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 6.2, 2.2, "#FFFFFF", isMono ? "#000000" : "#C084FC");
  } else if (heroId === "taidu") {
    // Tài Du — Segmented cybernetic slate-orange helmet & chest armor + glowing cyan reactor core
    ctx.fillStyle = isMono ? "#222222" : "#0F172A";
    ctx.beginPath();
    ctx.arc(-radius * 0.06, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.52, -radius * 0.32);
    ctx.lineTo(-radius * 0.1, 0);
    ctx.lineTo(-radius * 0.52, radius * 0.32);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.beginPath();
    ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "nguyen") {
    // Nguyên — Emerald-gold sanctuary armor collar + double sacred filigree rings + 8-point radiant lotus core
    ctx.fillStyle = isMono ? "#111111" : "#064E3B";
    ctx.beginPath();
    ctx.arc(-radius * 0.12, 0, radius * 0.66, Math.PI * 0.48, Math.PI * 1.52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.48);
    ctx.lineTo(radius * 0.15, -radius * 0.15);
    ctx.lineTo(radius * 0.48, 0);
    ctx.lineTo(radius * 0.15, radius * 0.15);
    ctx.lineTo(0, radius * 0.48);
    ctx.lineTo(-radius * 0.15, radius * 0.15);
    ctx.lineTo(-radius * 0.48, 0);
    ctx.lineTo(-radius * 0.15, -radius * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isMono ? "#000000" : "#10B981";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "duy") {
    // Duy — Flowing crimson ninja scarf + stealth hood V-fold + emerald-gold diamond core
    let dSway = Math.sin(elapsedTime * 7.5) * 4;
    ctx.fillStyle = isMono ? "#333333" : "#F43F5E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.52, -4);
    ctx.quadraticCurveTo(-radius * 1.15, -10 + dSway, -radius * 1.55, -2 + dSway * 1.2);
    ctx.lineTo(-radius * 1.22, 4 + dSway * 0.8);
    ctx.quadraticCurveTo(-radius * 0.9, 6, -radius * 0.52, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#0F172A";
    ctx.strokeStyle = isMono ? "#000000" : "#2DD4BF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.42, 0);
    ctx.lineTo(-radius * 0.1, -radius * 0.42);
    ctx.lineTo(-radius * 0.44, 0);
    ctx.lineTo(-radius * 0.1, radius * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isMono ? "#000000" : "#FDE047";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "phong") {
    // Phong — Deep azure stealth hood/cowl + glowing cyan runic phantom diamond core
    ctx.fillStyle = isMono ? "#111111" : "#06182C";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(radius * 0.48, 0);
    ctx.lineTo(0, -radius * 0.56);
    ctx.lineTo(-radius * 0.56, -radius * 0.24);
    ctx.lineTo(-radius * 0.56, radius * 0.24);
    ctx.lineTo(0, radius * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin cyan assassin cowl stripes
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#0EA5E9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.1, -radius * 0.42);
    ctx.lineTo(-radius * 0.4, -radius * 0.14);
    ctx.moveTo(-radius * 0.1, radius * 0.42);
    ctx.lineTo(-radius * 0.4, radius * 0.14);
    ctx.stroke();

    drawFourPointStar(ctx, 0, 0, isUlt ? 7.6 : 6.4, 2.3, "#E0F2FE", isMono ? "#000000" : "#0EA5E9");
  } else if (heroId === "dang") {
    // Đăng — Split Yin-Yang Black & White martial artist armor with bold tiger stripes & Tiger brow crest
    ctx.fillStyle = "#09090B";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.76, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.76, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // Jagged contrasting tiger stripes across split armor
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 2.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.44);
    ctx.lineTo(-radius * 0.18, -radius * 0.22);
    ctx.lineTo(-radius * 0.24, -radius * 0.12);
    ctx.moveTo(0, -radius * 0.54);
    ctx.lineTo(radius * 0.24, -radius * 0.22);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, radius * 0.44);
    ctx.lineTo(-radius * 0.18, radius * 0.22);
    ctx.lineTo(-radius * 0.24, radius * 0.12);
    ctx.moveTo(0, radius * 0.54);
    ctx.lineTo(radius * 0.24, radius * 0.22);
    ctx.stroke();

    // Yin-Yang martial core + golden/white center when Ult
    ctx.strokeStyle = isUlt ? "#FACC15" : "#94A3B8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#09090B";
    ctx.beginPath();
    ctx.arc(0, -radius * 0.18, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, radius * 0.18, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "thien") {
    // Thiên — Pearl-white & imperial gold divine crest + radiant cosmic-blue Primordial Core
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#111111" : "#0F172A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(radius * 0.5, 0);
    ctx.lineTo(0, -radius * 0.5);
    ctx.lineTo(-radius * 0.5, 0);
    ctx.lineTo(0, radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pulsing cosmic energy core
    let pulse = 1 + Math.sin(elapsedTime * 6.5) * 0.14 + (isUlt ? 0.2 : 0);
    let coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.42 * pulse);
    coreGrad.addColorStop(0, "#FFFFFF");
    coreGrad.addColorStop(0.45, "#FDE047");
    coreGrad.addColorStop(0.85, "#38BDF8");
    coreGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.42 * pulse, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, 0, 0, radius * 0.34 * pulse, radius * 0.12, "#FFFFFF", "#FACC15");
  } else if (heroId === "thanh") {
    // Horned Serpent Sovereign crest + twin golden-jade fangs & pulsing amethyst venom heart
    ctx.strokeStyle = isMono ? "#FFFFFF" : isUlt ? "#C084FC" : "#A7F3D0";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.74, -1.12, 1.12);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#042F2E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(radius * 0.52, 0);
    ctx.lineTo(-radius * 0.22, -radius * 0.5);
    ctx.lineTo(radius * 0.04, 0);
    ctx.lineTo(-radius * 0.22, radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawFourPointStar(ctx, 0, 0, radius * 0.34, radius * 0.13, isMono ? "#FFFFFF" : isUlt ? "#C084FC" : "#34D399", "#FDE047");
  } else if (heroId === "nhi") {
    // Alchemist Tri-Elixir Diamond Alembic Brooch & pulsing ammo-tinted core
    let eCol = isMono ? "#CCCCCC" : nhiAmmoType === "green" ? "#4ADE80" : nhiAmmoType === "life" ? "#2DD4BF" : "#E879F9";
    ctx.strokeStyle = isMono ? "#FFFFFF" : eCol;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, Math.PI * 0.58, Math.PI * 1.42);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#1E1B2E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(radius * 0.48, 0);
    ctx.lineTo(0, -radius * 0.4);
    ctx.lineTo(-radius * 0.44, 0);
    ctx.lineTo(0, radius * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = eCol;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-radius * 0.06, -radius * 0.06, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "minh") {
    // Minh — Sacred Celestial Octagram Seal Crest & luminous Sky-Gold Core
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#222222" : "#0F172A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(radius * 0.48, 0);
    ctx.lineTo(0, -radius * 0.48);
    ctx.lineTo(-radius * 0.48, 0);
    ctx.lineTo(0, radius * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawFourPointStar(ctx, 0, 0, radius * 0.36, radius * 0.14, isMono ? "#FFFFFF" : "#FEF08A", "#38BDF8");
  } else if (heroId === "ducanh") {
    // Duc Anh — Heavy Bolted Dreadnought Chest Plate & Incandescent Furnace Core
    ctx.fillStyle = isMono ? "#222222" : "#1E293B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#CBD5E1";
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.48, -radius * 0.48, radius * 0.96, radius * 0.96, 4);
    ctx.fill();
    ctx.stroke();

    // Diagonal armor seam & 4 corner rivets
    ctx.strokeStyle = isMono ? "#999999" : "#475569";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, 0);
    ctx.lineTo(radius * 0.38, 0);
    ctx.stroke();

    let furnacePulse = 1 + Math.sin(elapsedTime * 7) * 0.12;
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25 * furnacePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "bach") {
    // Bach — Twin Wind-Blade Crest & Cyan Vortex Core
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.38);
    ctx.lineTo(radius * 0.42, radius * 0.38);
    ctx.moveTo(-radius * 0.42, radius * 0.38);
    ctx.lineTo(radius * 0.42, -radius * 0.38);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, radius * 0.34, radius * 0.12, "#FFFFFF", "#E879F9");
  } else if (heroId === "thai") {
    // Thai — Imperial Crowned Colosseum Shield Crest
    ctx.fillStyle = isMono ? "#222222" : "#991B1B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(radius * 0.46, 0);
    ctx.lineTo(0, -radius * 0.44);
    ctx.lineTo(-radius * 0.46, 0);
    ctx.lineTo(0, radius * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, radius * 0.32, radius * 0.13, "#FEF08A", "#EF4444");
  } else if (heroId === "khair") {
    // Khair — Hexagonal Optical Chassis & Golden Sniper Core
    ctx.fillStyle = isMono ? "#222222" : "#0C4A6E";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      let px = Math.cos(a) * radius * 0.44;
      let py = Math.sin(a) * radius * 0.44;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = markCol;
    ctx.fill();
  }
  ctx.restore();

  // 3. Distinctive forward-facing eyes / visors inside circle edge
  if (isDowned) {
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(radius * 0.56, -radius * 0.22, 3.2, 0, Math.PI * 2);
    ctx.arc(radius * 0.56, radius * 0.22, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94A3B8";
    ctx.beginPath();
    ctx.arc(radius * 0.58, -radius * 0.22, 2.0, 0, Math.PI * 2);
    ctx.arc(radius * 0.58, radius * 0.22, 2.0, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "tin" || heroId === "bao" || heroId === "dung" || heroId === "danh" || heroId === "gau" || heroId === "phong" || heroId === "dang" || heroId === "thien" || heroId === "thanh" || heroId === "nhi" || heroId === "bach" || heroId === "thai") {
    // Fierce angled MOBA warrior / assassin visor eyes
    let eyeCol = isMono
      ? "#FFFFFF"
      : heroId === "tin"
      ? "#FFE4E6"
      : heroId === "bao"
      ? "#F5D0FE"
      : heroId === "dung"
      ? isUlt ? "#FEF08A" : "#E0F2FE"
      : heroId === "phong"
      ? "#67E8F9"
      : heroId === "danh"
      ? "#FEF08A"
      : heroId === "dang"
      ? isUlt ? "#FACC15" : "#FFFFFF"
      : heroId === "thien"
      ? isUlt ? "#FDE047" : "#38BDF8"
      : heroId === "thanh"
      ? isUlt ? "#E879F9" : "#A7F3D0"
      : heroId === "nhi"
      ? nhiAmmoType === "green" ? "#4ADE80" : nhiAmmoType === "life" ? "#2DD4BF" : "#E879F9"
      : heroId === "bach"
      ? "#67E8F9"
      : heroId === "thai"
      ? thaiInArena || isUlt ? "#FEF08A" : "#FCA5A5"
      : "#FDE68A";
    for (let s of [-1, 1]) {
      ctx.fillStyle = darkInk;
      ctx.beginPath();
      ctx.ellipse(radius * 0.56, s * radius * 0.23, 4.1, 2.7, s * -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.ellipse(radius * 0.58, s * radius * 0.23, 2.9, 1.6, s * -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(radius * 0.62, s * radius * 0.23 - 0.3, 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (heroId === "khair") {
    // Left sharp marksman eye + Right Golden Eagle-Eye Sniper Rangefinder Monocle
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.ellipse(radius * 0.56, -radius * 0.23, 3.8, 2.3, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.beginPath();
    ctx.ellipse(radius * 0.58, -radius * 0.23, 2.6, 1.4, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(radius * 0.61, -radius * 0.23, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.2;
    ctx.fillStyle = isMono ? "#222222" : "#0F172A";
    ctx.beginPath();
    ctx.arc(radius * 0.56, radius * 0.23, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = khairAiming ? "#FEF08A" : "#38BDF8";
    ctx.beginPath();
    ctx.arc(radius * 0.57, radius * 0.23, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(radius * 0.59, radius * 0.21, 0.95, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "taidu") {
    // Cybernetic wraparound tactical HUD visor
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#020617";
    ctx.lineWidth = 5.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.52, -0.58, 0.58);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.52, -0.52, 0.52);
    ctx.stroke();
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.52, -0.45, -0.1);
    ctx.stroke();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(radius * 0.68, -3.2, 1.5, 0, Math.PI * 2);
    ctx.arc(radius * 0.68, 3.2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "kin" || heroId === "longhoi" || heroId === "eohyen" || heroId === "trung" || heroId === "duccong" || heroId === "luan" || heroId === "nguyen" || heroId === "minh" || heroId === "ducanh") {
    // Luminous elemental / arcane / sanctuary eyes
    let eyeCol = isMono
      ? "#FFFFFF"
      : heroId === "kin"
      ? "#A7F3D0"
      : heroId === "longhoi"
      ? "#FEF08A"
      : heroId === "eohyen"
      ? "#E0F2FE"
      : heroId === "trung"
      ? "#FEF08A"
      : heroId === "luan"
      ? "#F5D0FE"
      : heroId === "nguyen"
      ? "#FEF08A"
      : heroId === "minh"
      ? "#FDE047"
      : heroId === "ducanh"
      ? "#F59E0B"
      : "#67E8F9";
    for (let s of [-1, 1]) {
      ctx.fillStyle = darkInk;
      ctx.beginPath();
      if (heroId === "luan") {
        ctx.ellipse(radius * 0.56, s * radius * 0.23, 4.0, 2.4, s * -0.28, 0, Math.PI * 2);
      } else {
        ctx.arc(radius * 0.56, s * radius * 0.22, 3.6, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      if (heroId === "luan") {
        ctx.ellipse(radius * 0.58, s * radius * 0.23, 2.7, 1.5, s * -0.28, 0, Math.PI * 2);
      } else {
        ctx.arc(radius * 0.58, s * radius * 0.22, 2.3, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(radius * 0.61, s * radius * 0.22 - 0.3, 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(radius * 0.56, -radius * 0.22, 3.4, 0, Math.PI * 2);
    ctx.arc(radius * 0.56, radius * 0.22, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(radius * 0.58, -radius * 0.22, 2.1, 0, Math.PI * 2);
    ctx.arc(radius * 0.58, radius * 0.22, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawMonsterEntity(ctx, enemy, elapsedTime, isMono) {
  if (enemy?.voidVariant) {
    let vr = enemy.radius || 20;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + vr * 0.75, vr * 0.92, vr * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.45)";
    ctx.fill();
    drawVoidCityEnemySprite(ctx, enemy, elapsedTime || 0, (enemy.hitFlash || 0) > 0);
    return;
  }
  let r = enemy.radius || 16;
  let facing = enemy.facing || 0;
  let hit = enemy.hitFlash > 0;
  let speedMag = Math.hypot(enemy.vx || 0, enemy.vy || 0);
  let isMoving = speedMag > 8;
  let walkPhase = enemy.animWalkPhase || (elapsedTime || 0) * 7.5 + (enemy.id || 0);
  let stride = isMoving ? Math.sin(walkPhase) : 0;
  let idleBreath = Math.sin((elapsedTime || 0) * 4.2 + (enemy.id || 0)) * 0.035;
  let atkTimer = enemy.attackAnimTimer || 0;
  let atkDur = Math.max(0.08, enemy.attackAnimDur || 0.28);
  let atkProg = atkTimer > 0 ? clamp(1 - atkTimer / atkDur, 0, 1) : 0;
  let atkSwing = atkProg > 0 ? Math.sin(atkProg * Math.PI) : 0;
  let wobble = isMoving ? stride * 0.095 : idleBreath;

  let isElite = Boolean(enemy.isMiniBoss || enemy.elite);
  // Ground shadow + Mini-Boss / Elite sacred crown aura beneath monster
  if (isElite) {
    let eR = r * 1.48;
    let eGrad = ctx.createRadialGradient(enemy.x, enemy.y, r * 0.55, enemy.x, enemy.y, eR);
    eGrad.addColorStop(0, "rgba(0,0,0,0)");
    eGrad.addColorStop(0.6, isMono ? "rgba(255,255,255,0.22)" : "rgba(251, 191, 36, 0.28)");
    eGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = eGrad;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, eR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate((elapsedTime || 0) * 1.9);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FBBF24";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let ei = 0; ei < 4; ei++) {
      let ea = (Math.PI / 2) * ei;
      drawFourPointStar(ctx, Math.cos(ea) * r * 1.32, Math.sin(ea) * r * 1.32, 4.4, 1.5, "#FEF08A", isMono ? "#000000" : "#D97706");
    }
    ctx.restore();
  }

  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + r * 0.75, r * (0.94 + idleBreath), r * 0.43, 0, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.48)";
  ctx.fill();

  const makeMobGrad = (cLight, cMid, cDark) => {
    let g = ctx.createRadialGradient(-r * 0.26, -r * 0.26, r * 0.1, 0, 0, r);
    if (isMono) {
      g.addColorStop(0, "#404040");
      g.addColorStop(0.6, "#171717");
      g.addColorStop(1, "#000000");
    } else if (hit) {
      g.addColorStop(0, "#FFFFFF");
      g.addColorStop(1, "#CBD5E1");
    } else {
      g.addColorStop(0, cLight);
      g.addColorStop(0.55, cMid);
      g.addColorStop(1, cDark);
    }
    return g;
  };

  ctx.save();
  ctx.translate(enemy.x + Math.cos(facing) * (atkSwing * r * 0.34), enemy.y + Math.sin(facing) * (atkSwing * r * 0.34));
  ctx.rotate(facing + wobble);
  if (hit) {
    ctx.scale(0.9, 1.09);
  } else if (atkSwing > 0.05) {
    ctx.scale(1 + atkSwing * 0.1, 1 - atkSwing * 0.05);
  }
  if (isMoving) {
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#111111" : "#18181B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(stride * s * (r * 0.34), s * r * 0.56, r * 0.23, r * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (enemy.kind === "brute") {
    // Đao Phủ — Heavy Iron Executioner with Huge Double-Headed Battle Axe
    ctx.save();
    ctx.translate(r * 0.25, r * 0.75);
    ctx.rotate(0.25 + Math.sin((elapsedTime || 0) * 4.5 + (enemy.id || 0)) * 0.14 - atkSwing * 1.15);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, 0);
    ctx.lineTo(r * 1.2, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#555555" : "#94A3B8";
    ctx.lineWidth = 2.8;
    ctx.stroke();
    // Glowing crimson-steel double axe blades
    let axeGrad = ctx.createLinearGradient(r * 0.5, -r * 0.65, r * 1.25, r * 0.65);
    axeGrad.addColorStop(0, hit ? "#FFFFFF" : isMono ? "#1F1F1F" : "#475569");
    axeGrad.addColorStop(0.55, hit ? "#CBD5E1" : isMono ? "#525252" : "#CBD5E1");
    axeGrad.addColorStop(1, isMono ? "#FFFFFF" : "#FCA5A5");
    ctx.fillStyle = axeGrad;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#EF4444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(r * 0.65, -r * 0.68);
    ctx.quadraticCurveTo(r * 1.32, -r * 0.32, r * 0.88, 0);
    ctx.quadraticCurveTo(r * 1.32, r * 0.32, r * 0.65, r * 0.68);
    ctx.lineTo(r * 0.54, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Axe blood-rune glint
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F87171";
    ctx.beginPath();
    ctx.arc(r * 0.72, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Heavy Spiked Shoulder Pauldrons
    for (let s of [-1, 1]) {
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#111111" : "#9A3412";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, s * r * 0.68, r * 0.56, r * 0.38, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.beginPath();
      ctx.arc(r * 0.14, s * r * 0.76, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core armored body + specular bevel + horned helm
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#FB923C", enemy.color || "#EA580C", "#431407");
    ctx.fill();
    ctx.strokeStyle = isElite ? "#FBBF24" : "#1E293B";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Iron Horns & glowing amber eyes
    ctx.fillStyle = "#E2E8F0";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.3;
    for (let s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.1, s * r * 0.48);
      ctx.lineTo(r * 0.72, s * r * 0.86);
      ctx.lineTo(r * 0.28, s * r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(r * 0.42, -r * 0.28, 4.5, 3.2);
    ctx.fillRect(r * 0.42, r * 0.14, 4.5, 3.2);
  } else if (enemy.kind === "charger") {
    // Ma Khuyển — Razor Stalker Beast with Twin Scythe-Claws & Dorsal Spine
    for (let s of [-1, 1]) {
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#FDE047";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, s * r * 0.55);
      ctx.quadraticCurveTo(r * 1.0, s * r * 1.18, r * 1.38, s * r * 0.32);
      ctx.quadraticCurveTo(r * 0.65, s * r * 0.62, r * 0.25, s * r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(r * 1.16, 0);
    ctx.lineTo(r * 0.15, -r * 0.84);
    ctx.lineTo(-r * 0.98, -r * 0.4);
    ctx.lineTo(-r * 0.72, 0);
    ctx.lineTo(-r * 0.98, r * 0.4);
    ctx.lineTo(r * 0.15, r * 0.84);
    ctx.closePath();
    ctx.fillStyle = makeMobGrad("#FCA5A5", enemy.color || "#F59E0B", "#451A03");
    ctx.fill();
    ctx.strokeStyle = isElite ? "#FBBF24" : "#0F172A";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Dorsal ridge streak & glowing predator eyes
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(r * 0.25, 0);
    ctx.stroke();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.24, 2.8, 0, Math.PI * 2);
    ctx.arc(r * 0.5, r * 0.24, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(r * 0.54, -r * 0.24, 1.0, 0, Math.PI * 2);
    ctx.arc(r * 0.54, r * 0.24, 1.0, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "caster") {
    // Phù Thủy — Arcane Cultist with Glowing Runic Staff
    let staffPulse = 0.85 + 0.25 * Math.sin((elapsedTime || 0) * 8 + (enemy.id || 0));
    ctx.save();
    ctx.translate(r * 0.35, r * 0.68);
    ctx.rotate(-0.15);
    ctx.strokeStyle = "#3B0764";
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, 0);
    ctx.lineTo(r * 1.05, 0);
    ctx.stroke();
    let orbHalo = ctx.createRadialGradient(r * 1.12, 0, 1, r * 1.12, 0, 10 * staffPulse);
    orbHalo.addColorStop(0, "#FFFFFF");
    orbHalo.addColorStop(0.45, isMono ? "rgba(255,255,255,0.6)" : "rgba(232, 121, 249, 0.75)");
    orbHalo.addColorStop(1, "rgba(232, 121, 249, 0)");
    ctx.fillStyle = orbHalo;
    ctx.beginPath();
    ctx.arc(r * 1.12, 0, 10 * staffPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "#CBD5E1" : "#E879F9";
    ctx.beginPath();
    ctx.arc(r * 1.12, 0, 4.4 * staffPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();

    // Cultist Robed Hood with arcane gradient
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#C084FC", "#6B21A8", "#1E0538");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Gold trim collar + dark cowl shadow + arcane eyes
    ctx.strokeStyle = isMono ? "#999999" : "#FDE047";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0.8, Math.PI * 2 - 0.8);
    ctx.stroke();
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(r * 0.24, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F0ABFC";
    ctx.beginPath();
    ctx.arc(r * 0.38, -3.2, 2.3, 0, Math.PI * 2);
    ctx.arc(r * 0.38, 3.2, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "frost_archer") {
    // Xạ Thủ Băng — Ice Recurve Bow + Hooded Marksman
    ctx.save();
    ctx.translate(r * 0.55, 0);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#7DD3FC";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(-r * 0.15, 0, r * 0.85, -1.08, 1.08);
    ctx.stroke();
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-1.05) * r * 0.85 - r * 0.15, Math.sin(-1.05) * r * 0.85);
    ctx.lineTo(-r * 0.05, 0);
    ctx.lineTo(Math.cos(1.05) * r * 0.85 - r * 0.15, Math.sin(1.05) * r * 0.85);
    ctx.stroke();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, 0);
    ctx.lineTo(r * 0.88, 0);
    ctx.stroke();
    drawFourPointStar(ctx, r * 0.88, 0, 4.5, 1.4, "#FFFFFF", "#38BDF8");
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#7DD3FC", "#0369A1", "#082F49");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#BAE6FD";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = "#082F49";
    ctx.beginPath();
    ctx.arc(r * 0.25, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7DD3FC";
    ctx.fillRect(r * 0.34, -3.5, 3.6, 2.4);
    ctx.fillRect(r * 0.34, 1.3, 3.6, 2.4);
  } else if (enemy.kind === "bomber") {
    // Quái Bom Cảm Tử — Unstable Volatile Bomb Carrier
    let priming = (enemy.fuseTimer || 0) > 0;
    let pulse = priming ? 0.82 + 0.35 * Math.sin((elapsedTime || 0) * 26) : 0.92 + 0.1 * Math.sin((elapsedTime || 0) * 7 + (enemy.id || 0));
    if (priming) {
      let bHalo = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.65 * pulse);
      bHalo.addColorStop(0, "rgba(239, 68, 68, 0.35)");
      bHalo.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = bHalo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.65 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad(priming ? "#FCA5A5" : "#71717A", priming ? "#DC2626" : "#3F3F46", "#18181B");
    ctx.fill();
    ctx.strokeStyle = priming ? "#FEF08A" : "#F97316";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-r * 0.1, 0, r * 0.48 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = priming ? "#FEF08A" : "#F97316";
    ctx.fill();
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.4);
    ctx.quadraticCurveTo(-r * 0.85, -r * 0.9, -r * 0.55, -r * 1.15);
    ctx.stroke();
    drawFourPointStar(ctx, -r * 0.55, -r * 1.15, 5.2 * pulse, 1.8, "#FFFFFF", "#F97316");
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(r * 0.46, -r * 0.24, 2.7, 0, Math.PI * 2);
    ctx.arc(r * 0.46, r * 0.24, 2.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "assassin") {
    // Sát Thủ Bóng Đêm — Twin Shadow Blades & Sleek Cowl
    for (let s of [-1, 1]) {
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#F43F5E";
      ctx.strokeStyle = "#FDF2F8";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(r * 0.25, s * r * 0.48);
      ctx.lineTo(r * 1.4, s * r * 0.72);
      ctx.lineTo(r * 0.65, s * r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(r * 1.08, 0);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(-r * 0.92, -r * 0.35);
    ctx.lineTo(-r * 0.92, r * 0.35);
    ctx.lineTo(0, r * 0.8);
    ctx.closePath();
    ctx.fillStyle = makeMobGrad("#9333EA", "#311042", "#090414");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = "#FB7185";
    ctx.fillRect(r * 0.36, -3.5, 4.4, 2.2);
    ctx.fillRect(r * 0.36, 1.5, 4.4, 2.2);
  } else if (enemy.kind === "shield_knight") {
    // Khiên Binh Phản Chấn — Heavy Tower Shield + War Mace
    ctx.save();
    ctx.translate(r * 0.25, r * 0.78);
    ctx.rotate(-atkSwing * 0.85);
    ctx.strokeStyle = "#64748B";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(r * 0.88, 0);
    ctx.stroke();
    ctx.fillStyle = "#CBD5E1";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(r * 0.92, 0, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#94A3B8", "#334155", "#0F172A");
    ctx.fill();
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2.8;
    ctx.stroke();
    let shGrad = ctx.createLinearGradient(r * 0.1, -r * 0.8, r * 1.1, r * 0.8);
    shGrad.addColorStop(0, isMono ? "#FFFFFF" : "#BAE6FD");
    shGrad.addColorStop(0.55, isMono ? "#444444" : "#0EA5E9");
    shGrad.addColorStop(1, isMono ? "#111111" : "#0369A1");
    ctx.fillStyle = hit ? "#CBD5E1" : shGrad;
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r * 0.22, 0, r * 0.96, -0.96, 0.96);
    ctx.lineTo(r * 0.52, Math.sin(0.96) * r * 0.65);
    ctx.arc(r * 0.05, 0, r * 0.68, 0.96, -0.96, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.kind === "void_acolyte") {
    // Tín Đồ Hư Không — Orbiting Runes & Abyssal Robe
    for (let k = 0; k < 3; k++) {
      let a = (elapsedTime || 0) * 3.5 + (Math.PI * 2 / 3) * k;
      let rx = Math.cos(a) * (r * 1.25);
      let ry = Math.sin(a) * (r * 1.25);
      drawFourPointStar(ctx, rx, ry, 4.6, 1.5, "#38BDF8", "#E879F9");
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#6366F1", "#1E1B4B", "#09061A");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#818CF8";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = "#A855F7";
    ctx.strokeStyle = "#E9D5FF";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.58, 0);
    ctx.lineTo(0, -r * 0.48);
    ctx.lineTo(-r * 0.46, 0);
    ctx.lineTo(0, r * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F0ABFC";
    ctx.beginPath();
    ctx.arc(r * 0.32, 0, 2.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "root_woodfolk") {
    // Cây Sống Bị Ám — Gnarled Bark Husk with Twisting Antler Branches & Emerald Sap Eyes
    ctx.strokeStyle = isMono ? "#333333" : "#14532D";
    ctx.lineWidth = 3.5;
    for (let s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, s * r * 0.55);
      ctx.quadraticCurveTo(r * 0.45, s * r * 1.15, r * 0.98, s * r * 0.92);
      ctx.stroke();
      ctx.fillStyle = "#34D399";
      ctx.beginPath();
      ctx.arc(r * 0.98, s * r * 0.92, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#57534E", "#29201B", "#14100E");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.arc(r * 0.44, -r * 0.25, 2.8, 0, Math.PI * 2);
    ctx.arc(r * 0.44, r * 0.25, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "faceless_wraith") {
    // Bóng Ma Không Mặt — Drifting Pale Violet Shroud & Smooth Blank Mask
    ctx.beginPath();
    ctx.moveTo(r * 0.98, 0);
    ctx.lineTo(0, -r * 0.86);
    ctx.lineTo(-r * 1.08, -r * 0.44);
    ctx.lineTo(-r * 0.85, 0);
    ctx.lineTo(-r * 1.08, r * 0.44);
    ctx.lineTo(0, r * 0.86);
    ctx.closePath();
    ctx.fillStyle = makeMobGrad("#7E22CE", "#3B0764", "#120324");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = isMono ? "#CBD5E1" : "#E2E8F0";
    ctx.strokeStyle = "#4C1D95";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(r * 0.28, 0, r * 0.36, r * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.kind === "root_burrower") {
    // Sinh Vật Ẩn Nấp Dưới Rễ — Spiked Subterranean Burrower
    if (enemy.burrowed) {
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
      ctx.fillStyle = makeMobGrad("#34D399", "#1B2E26", "#07140F");
      ctx.fill();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const a = -0.6 + k * 0.4;
        ctx.fillStyle = "#A3E635";
        ctx.strokeStyle = "#052E16";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.lineTo(Math.cos(a) * r * 1.28, Math.sin(a) * r * 1.28);
        ctx.lineTo(Math.cos(a + 0.16) * r * 0.7, Math.sin(a + 0.16) * r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (enemy.kind === "hero_mimic") {
    // Rối Hóa Hình Nhân Vật — Twisted Wood-Stitched Hero Mimic
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#9D174D", "#4A1D2C", "#1F0912");
    ctx.fill();
    ctx.strokeStyle = "#F472B6";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#FDE047";
    ctx.beginPath();
    ctx.arc(r * 0.42, -r * 0.22, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.42, r * 0.22, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F472B6";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(r * 0.25, 0, r * 0.35, -0.7, 0.7);
    ctx.stroke();
  } else if (enemy.kind === "fog_stalker") {
    // Kẻ Săn Trong Sương — Sleek Indigo-Teal Ambush Predator
    ctx.beginPath();
    ctx.moveTo(r * 1.18, 0);
    ctx.lineTo(r * 0.1, -r * 0.86);
    ctx.lineTo(-r * 0.96, -r * 0.34);
    ctx.lineTo(-r * 0.96, r * 0.34);
    ctx.lineTo(r * 0.1, r * 0.86);
    ctx.closePath();
    ctx.fillStyle = makeMobGrad("#14B8A6", "#0F2A36", "#041219");
    ctx.fill();
    ctx.strokeStyle = "#2DD4BF";
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.fillStyle = "#5EEAD4";
    ctx.fillRect(r * 0.38, -3.5, 4.8, 2.3);
    ctx.fillRect(r * 0.38, 1.3, 4.8, 2.3);
  } else {
    // Quái Nhỏ — Armed Goblin Raider with Jagged Cleaver Blade
    ctx.save();
    ctx.translate(r * 0.35, r * 0.68);
    ctx.rotate(0.28 - atkSwing * 0.95);
    ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#94A3B8";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2, -2.5);
    ctx.lineTo(r * 0.98, -4.5);
    ctx.lineTo(r * 1.18, 2.5);
    ctx.lineTo(2, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#111111" : hit ? "#CBD5E1" : "#16A34A";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, s * r * 0.65);
      ctx.lineTo(-r * 0.48, s * r * 1.2);
      ctx.lineTo(r * 0.25, s * r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = makeMobGrad("#86EFAC", enemy.color || "#22C55E", "#14532D");
    ctx.fill();
    ctx.strokeStyle = isElite ? "#FBBF24" : "#0F172A";
    ctx.lineWidth = 2.3;
    ctx.stroke();

    // Specular rim inside goblin head
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.1, r * 0.68, -2.4, -0.8);
    ctx.stroke();

    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(r * 0.44, -r * 0.25, 2.4, 0, Math.PI * 2);
    ctx.arc(r * 0.44, r * 0.25, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(r * 0.47, -r * 0.25, 0.9, 0, Math.PI * 2);
    ctx.arc(r * 0.47, r * 0.25, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawBossWeapon(ctx, boss, elapsedTime, isMono) {
  let wave = boss.bossWave || 3;
  let r = Math.max(24, Number(boss.radius) || 46);
  let t = elapsedTime || 0;
  let facing = boss.facing || 0;
  let idleSwing = Math.sin(t * 3.4) * 0.14;
  let phase = boss.phase || 1;
  let isPhaseBoost = phase >= 2;
  let isPhase3 = phase >= 3;

  // Live melee, windup anticipation, and skill release animation curves
  let windupRatio =
    boss.castWindupTimer > 0 && boss.castWindupTotal > 0
      ? clamp(1 - boss.castWindupTimer / boss.castWindupTotal, 0, 1)
      : 0;
  let releaseRatio =
    boss.skillReleaseTimer > 0 && boss.skillReleaseTotal > 0
      ? clamp(1 - boss.skillReleaseTimer / boss.skillReleaseTotal, 0, 1)
      : -1;
  let atkRatio =
    boss.attackAnimTimer > 0 && boss.attackAnimDur > 0
      ? clamp(1 - boss.attackAnimTimer / boss.attackAnimDur, 0, 1)
      : -1;

  let animRot = 0;
  let animThrustX = 0;
  let animThrustY = 0;
  let chargeGlow = windupRatio;

  if (windupRatio > 0) {
    // Windup pull-back & raise before striking
    animRot = -0.78 * Math.sin(windupRatio * Math.PI * 0.5);
    animThrustX = -r * 0.14 * windupRatio;
    animThrustY = -r * 0.1 * windupRatio;
  } else if (releaseRatio >= 0) {
    // High-impact forward cleave or cannon recoil kickback
    if (wave === 15) {
      let kick = Math.sin(releaseRatio * Math.PI);
      animThrustX = -15 * (1 - releaseRatio);
      animRot = -0.18 * kick;
    } else {
      let dir = boss.attackSwingDir || 1;
      animRot = (-0.95 + releaseRatio * 2.25) * dir;
      animThrustX = r * 0.28 * Math.sin(releaseRatio * Math.PI);
    }
    chargeGlow = Math.max(chargeGlow, (1 - releaseRatio) * 0.85);
  } else if (atkRatio >= 0) {
    if (wave === 15) {
      animThrustX = -10 * Math.sin(atkRatio * Math.PI);
    } else {
      let dir = boss.attackSwingDir || 1;
      animRot = (-0.6 + atkRatio * 1.45) * dir;
      animThrustX = r * 0.18 * Math.sin(atkRatio * Math.PI);
    }
  }

  ctx.save();
  ctx.rotate(facing);
  ctx.translate(r * 0.86 + animThrustX, r * 0.42 + animThrustY);
  ctx.rotate(0.28 + idleSwing + animRot);

  if (wave === 3) {
    // Stone Titan — Crystal Runic Greathammer
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(44, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#666666" : "#78716C";
    ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#10B981";
    ctx.beginPath();
    ctx.arc(-20, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    let hGrad = ctx.createLinearGradient(30, -22, 52, 22);
    hGrad.addColorStop(0, isMono ? "#333333" : "#57534E");
    hGrad.addColorStop(0.5, isMono ? "#1A1A1A" : "#44403C");
    hGrad.addColorStop(1, isMono ? "#050505" : "#1C1917");
    ctx.fillStyle = hGrad;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#10B981";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(30, -23, 24, 46, 5);
    } else {
      ctx.rect(30, -23, 24, 46);
    }
    ctx.fill();
    ctx.stroke();

    drawFourPointStar(ctx, 42, 0, 10.5, 3.2, isMono ? "#FFFFFF" : isPhaseBoost ? "#6EE7B7" : "#10B981", "#FFFFFF");
  } else if (wave === 6) {
    // Flame Lord — Molten Magma Greatblade
    ctx.fillStyle = "#1C1917";
    ctx.fillRect(-14, -3.5, 18, 7);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(2, -16);
    ctx.lineTo(10, -10);
    ctx.lineTo(10, 10);
    ctx.lineTo(2, 16);
    ctx.closePath();
    ctx.fill();

    let bGrad = ctx.createLinearGradient(8, 0, 82, 0);
    bGrad.addColorStop(0, isMono ? "#111111" : "#991B1B");
    bGrad.addColorStop(0.55, isMono ? "#666666" : "#EA580C");
    bGrad.addColorStop(1, "#FEF08A");
    ctx.fillStyle = bGrad;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, -9);
    ctx.lineTo(56, -10);
    ctx.lineTo(82, 0);
    ctx.lineTo(56, 10);
    ctx.lineTo(8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(66, 0);
    ctx.stroke();
    drawFourPointStar(ctx, 82, 0, 6.5 + chargeGlow * 5, 2.0, "#FEF08A", "#EF4444");
  } else if (wave === 9) {
    // Frost Empress — Glacial Winged Halberd
    ctx.strokeStyle = isMono ? "#444444" : "#E0F2FE";
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(54, 0);
    ctx.stroke();

    let iGrad = ctx.createLinearGradient(34, -18, 78, 18);
    iGrad.addColorStop(0, isMono ? "#111111" : "#0284C7");
    iGrad.addColorStop(0.55, isMono ? "#555555" : "#38BDF8");
    iGrad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = iGrad;
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(34, -4);
    ctx.quadraticCurveTo(30, -22, 50, -17);
    ctx.lineTo(44, -4);
    ctx.lineTo(80, 0);
    ctx.lineTo(44, 4);
    ctx.lineTo(50, 17);
    ctx.quadraticCurveTo(30, 22, 34, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 45, 0, 7.5, 2.2, "#FFFFFF", "#38BDF8");
  } else if (wave === 12) {
    // Void Horror — Voidrift Astral Scythe
    ctx.strokeStyle = "#3B0764";
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(48, 0);
    ctx.stroke();

    let vGrad = ctx.createLinearGradient(34, -4, 68, 36);
    vGrad.addColorStop(0, isMono ? "#111111" : "#4C1D95");
    vGrad.addColorStop(0.55, isMono ? "#555555" : "#9333EA");
    vGrad.addColorStop(1, isMono ? "#FFFFFF" : "#38BDF8");
    ctx.fillStyle = vGrad;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E9D5FF";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(42, -4);
    ctx.quadraticCurveTo(72, -3, 64, 38);
    ctx.quadraticCurveTo(48, 14, 34, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38BDF8";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(43, 0, 6.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 43, 0, 7.5, 2.0, "#FFFFFF", "#A855F7");
  } else if (wave === 15) {
    // Wave 15: Pháo Vương Cơ Giới Rex — Overcharged Twin-Rail Siege Plasma Cannon
    let accent = isMono ? "#FFFFFF" : isPhase3 ? "#EF4444" : isPhaseBoost ? "#F59E0B" : "#38BDF8";
    let bodyGrad = ctx.createLinearGradient(-16, -18, 48, 18);
    bodyGrad.addColorStop(0, isMono ? "#111111" : "#0F172A");
    bodyGrad.addColorStop(0.5, isMono ? "#2B2B2B" : "#334155");
    bodyGrad.addColorStop(1, isMono ? "#0A0A0A" : "#1E293B");

    // Heavy armored cannon chassis with chamfered edges
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(38, -17);
    ctx.lineTo(48, -11);
    ctx.lineTo(48, 11);
    ctx.lineTo(38, 17);
    ctx.lineTo(-18, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cooling vents along receiver
    ctx.fillStyle = isMono ? "#FFFFFF" : accent;
    for (let vi = 0; vi < 4; vi++) {
      ctx.fillRect(-8 + vi * 9, -12, 5, 3.5);
      ctx.fillRect(-8 + vi * 9, 8.5, 5, 3.5);
    }

    // Twin magnetic plasma rail barrels
    for (let by of [-11, 4]) {
      ctx.fillStyle = isMono ? "#333333" : "#64748B";
      ctx.fillRect(42, by, 40, 7);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(42, by, 40, 7);
      // Glowing rail slot
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.fillRect(45, by + 2.4, 34, 2.2);
    }

    // 3 Electromagnetic accelerator rings pulsing down the barrels
    for (let ri = 0; ri < 3; ri++) {
      let pulse = 0.65 + 0.35 * Math.sin(t * 14 - ri * 1.4);
      ctx.strokeStyle = isMono ? "#FFFFFF" : accent;
      ctx.globalAlpha = clamp(pulse + chargeGlow * 0.4, 0.35, 1);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(52 + ri * 11, -14);
      ctx.lineTo(52 + ri * 11, 14);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Spinning Plasma Reactor Chamber inside receiver
    ctx.save();
    ctx.translate(15, 0);
    ctx.rotate(t * (isPhaseBoost ? 9 : 5));
    ctx.fillStyle = isMono ? "#000000" : "#0F172A";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let bi = 0; bi < 4; bi++) {
      let ba = (Math.PI / 2) * bi;
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ba) * 7.5, Math.sin(ba) * 7.5);
      ctx.stroke();
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Target lock laser sight during windup + muzzle burst on release
    if (windupRatio > 0) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(244, 63, 94, ${0.4 + 0.5 * windupRatio})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(84, 0);
      ctx.lineTo(84 + 190 * windupRatio, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      drawFourPointStar(ctx, 84, 0, 9 * windupRatio, 2.5, "#FEF08A", accent);
    } else if (releaseRatio >= 0 && releaseRatio < 0.65) {
      let ms = 1 - releaseRatio / 0.65;
      drawFourPointStar(ctx, 86, -7.5, 13 * ms, 3.5 * ms, "#FEF08A", accent);
      drawFourPointStar(ctx, 86, 7.5, 13 * ms, 3.5 * ms, "#FEF08A", accent);
    }
  } else if (wave === 18) {
    // Wave 18: Lôi Thần Thiên Khải — Storm-Forged Raijin Thunder Halberd
    let shaftColor = isMono ? "#222222" : "#0369A1";
    let rimColor = isMono ? "#FFFFFF" : isPhase3 ? "#FEF08A" : "#FDE047";
    let arcColor = isMono ? "#FFFFFF" : "#38BDF8";

    // Polearm grip & dragon pommel
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(48, 0);
    ctx.stroke();
    ctx.strokeStyle = shaftColor;
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Twin golden pommel orb
    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(-28, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Thunder Drum Ring Crossguard
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(40, 0, 11.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#000000" : "#0EA5E9";
    ctx.beginPath();
    ctx.arc(40, 0, 6.2, 0, Math.PI * 2);
    ctx.fill();

    // Crescent storm back-spike
    ctx.fillStyle = isMono ? "#333333" : "#0284C7";
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(35, 7);
    ctx.quadraticCurveTo(44, 22, 57, 17);
    ctx.quadraticCurveTo(46, 11, 44, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Elongated lightning-forged naginata blade with gradient
    let bladeGrad = ctx.createLinearGradient(42, -16, 98, 6);
    bladeGrad.addColorStop(0, isMono ? "#000000" : "#0284C7");
    bladeGrad.addColorStop(0.55, isMono ? "#555555" : "#38BDF8");
    bladeGrad.addColorStop(1, isMono ? "#FFFFFF" : "#FEF08A");
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(42, -5);
    ctx.quadraticCurveTo(64, -20, 96, -8);
    ctx.quadraticCurveTo(84, 2, 68, 7);
    ctx.lineTo(42, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Live crackling electric filament along blade spine
    let zOff = Math.sin(t * 28) * 3.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(46, -1);
    ctx.lineTo(62, -9 + zOff);
    ctx.lineTo(78, -4 - zOff);
    ctx.lineTo(95, -8);
    ctx.stroke();

    if (chargeGlow > 0.1 || isPhaseBoost) {
      let sSize = (isPhaseBoost ? 7 : 5) + chargeGlow * 8;
      drawFourPointStar(ctx, 96, -8, sSize, sSize * 0.28, "#FFFFFF", arcColor);
    }
  } else if (wave === 21) {
    // Wave 21: Độc Long Ác Ma — Living Abyssal Venom-Fang Scythe
    let acidEdge = isMono ? "#FFFFFF" : isPhase3 ? "#D9F99D" : "#A3E635";
    let scaleColor = isMono ? "#222222" : "#14532D";

    // Twisted chitinous bone shaft
    ctx.strokeStyle = "#052E16";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-24, 2);
    ctx.quadraticCurveTo(10, -5, 46, 0);
    ctx.stroke();
    ctx.strokeStyle = scaleColor;
    ctx.lineWidth = 4.6;
    ctx.stroke();

    // Glowing venom nerve spine along haft
    ctx.strokeStyle = acidEdge;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, 1);
    ctx.quadraticCurveTo(14, -4, 42, 0);
    ctx.stroke();

    // Main curved serrated venom-fang reaper blade
    let vGrad = ctx.createLinearGradient(36, -16, 86, 32);
    vGrad.addColorStop(0, isMono ? "#111111" : "#166534");
    vGrad.addColorStop(0.55, isMono ? "#444444" : "#22C55E");
    vGrad.addColorStop(1, acidEdge);
    ctx.fillStyle = vGrad;
    ctx.strokeStyle = acidEdge;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(36, -6);
    ctx.quadraticCurveTo(64, -22, 86, 10);
    ctx.quadraticCurveTo(83, 28, 74, 34);
    ctx.quadraticCurveTo(68, 16, 56, 11);
    ctx.lineTo(44, 15);
    ctx.lineTo(46, 7);
    ctx.lineTo(34, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Secondary lower mandible fang
    ctx.fillStyle = isMono ? "#333333" : "#4ADE80";
    ctx.beginPath();
    ctx.moveTo(40, -6);
    ctx.lineTo(54, -20);
    ctx.lineTo(50, -4);
    ctx.closePath();
    ctx.fill();

    // Pulsing bio-venom gland orb in scythe socket
    let gPulse = 1 + 0.22 * Math.sin(t * 7);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#BEF264";
    ctx.strokeStyle = isMono ? "#000000" : "#14532D";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(42, 0, 6.2 * gPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dripping acid droplet from fang tip
    let dropProg = (t * 1.8) % 1;
    ctx.fillStyle = acidEdge;
    ctx.globalAlpha = 1 - dropProg;
    ctx.beginPath();
    ctx.arc(74, 34 + dropProg * 14, 2.8 * (1 - dropProg * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (wave === 24) {
    // Wave 24: Huyết Ma Bá Chủ — Blood-Moon Crescent Sovereign Glaive
    let rim = isMono ? "#FFFFFF" : isPhase3 ? "#FEF08A" : "#FDA4AF";
    let crimson = isMono ? "#000000" : "#9F1239";

    // Ornate obsidian-gold polearm shaft
    ctx.strokeStyle = "#1F030B";
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(56, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#444444" : "#881337";
    ctx.lineWidth = 4.2;
    ctx.stroke();

    // Bat-wing golden crossguard
    ctx.fillStyle = isMono ? "#666666" : "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(40, -14);
    ctx.lineTo(48, -5);
    ctx.lineTo(48, 5);
    ctx.lineTo(40, 14);
    ctx.lineTo(44, 0);
    ctx.closePath();
    ctx.fill();

    // Twin-horned Blood-Moon crescent glaive head
    let gGrad = ctx.createLinearGradient(44, -26, 90, 26);
    gGrad.addColorStop(0, crimson);
    gGrad.addColorStop(0.55, isMono ? "#555555" : "#E11D48");
    gGrad.addColorStop(1, rim);
    ctx.fillStyle = gGrad;
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(44, -27);
    ctx.quadraticCurveTo(78, -14, 92, 0);
    ctx.quadraticCurveTo(78, 14, 44, 27);
    ctx.quadraticCurveTo(60, 8, 52, 0);
    ctx.quadraticCurveTo(60, -8, 44, -27);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central piercing spear point
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FFE4E6";
    ctx.beginPath();
    ctx.moveTo(64, -4);
    ctx.lineTo(98, 0);
    ctx.lineTo(64, 4);
    ctx.closePath();
    ctx.fill();

    // Suspended Ruby Blood-Core Orb inside crescent cradle
    let heartPulse = 1 + 0.25 * Math.pow(Math.abs(Math.sin(t * 4.5)), 4);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F43F5E";
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(57, 0, 5.5 * heartPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (chargeGlow > 0.1) {
      drawFourPointStar(ctx, 98, 0, 8 + chargeGlow * 8, 2.4, "#FDA4AF", "#9F1239");
    }
  } else {
    // Wave 27 Final Boss: Thiên Thần Sa Ngã Lucifer — Fallen Judgment Dual-Aspect Greatsword
    let gold = isMono ? "#FFFFFF" : "#FBBF24";
    let crim = isMono ? "#222222" : "#DC2626";
    let pulse = 0.8 + 0.2 * Math.sin(t * 9);

    // Imperial hilt & eclipse pommel
    ctx.strokeStyle = isMono ? "#333333" : "#451A03";
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(-24, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Asymmetric Fallen Seraph Crossguard (Upper Celestial Gold Wing + Lower Abyssal Crimson Thorn)
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(8, -24);
    ctx.quadraticCurveTo(22, -16, 22, -2);
    ctx.lineTo(12, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = crim;
    ctx.beginPath();
    ctx.moveTo(8, 24);
    ctx.quadraticCurveTo(22, 16, 22, 2);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();

    // Massive Dual-Aspect Greatsword Blade (Upper Radiant Gold-Indigo, Lower Crimson-Void)
    ctx.fillStyle = isMono ? "#111111" : "#1E1B4B";
    ctx.beginPath();
    ctx.moveTo(18, -10.5);
    ctx.lineTo(74, -12.5);
    ctx.lineTo(106, 0);
    ctx.lineTo(74, 12.5);
    ctx.lineTo(18, 10.5);
    ctx.closePath();
    ctx.fill();

    // Split elemental blade bevels
    ctx.fillStyle = isMono ? "#555555" : "rgba(251, 191, 36, 0.35)";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(106, 0);
    ctx.lineTo(74, -12.5);
    ctx.lineTo(18, -10.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isMono ? "#222222" : "rgba(220, 38, 38, 0.42)";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(106, 0);
    ctx.lineTo(74, 12.5);
    ctx.lineTo(18, 10.5);
    ctx.closePath();
    ctx.fill();

    // Golden & crimson edge trims
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(18, -10.5);
    ctx.lineTo(74, -12.5);
    ctx.lineTo(106, 0);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#AAAAAA" : "#EF4444";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(18, 10.5);
    ctx.lineTo(74, 12.5);
    ctx.lineTo(106, 0);
    ctx.stroke();

    // Glowing Judgment Rune Spine down center
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.2 * pulse;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(88, 0);
    ctx.stroke();

    // Blazing Eclipse Gem in crossguard
    drawFourPointStar(ctx, 18, 0, 8.5 * pulse, 3.2, "#FEF08A", crim);
    if (chargeGlow > 0.1 || isPhase3) {
      let sSize = (isPhase3 ? 8 : 5) + chargeGlow * 10;
      drawFourPointStar(ctx, 106, 0, sSize, sSize * 0.28, "#FEF08A", "#DC2626");
    }
  }

  ctx.restore();
}

export function drawDanhDragonForm(ctx, x, y, radius, facing, elapsedTime, isMono) {
  ctx.save();
  ctx.translate(x, y);
  let pulse = 0.88 + 0.12 * Math.sin(elapsedTime * 11);

  // Outer fiery dragon aura ring
  let aura = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 2.75);
  aura.addColorStop(0, isMono ? "rgba(0,0,0,0.16)" : "rgba(254, 240, 138, 0.38)");
  aura.addColorStop(0.48, isMono ? "rgba(0,0,0,0.10)" : "rgba(239, 68, 68, 0.32)");
  aura.addColorStop(0.78, isMono ? "rgba(0,0,0,0.04)" : "rgba(249, 115, 22, 0.14)");
  aura.addColorStop(1, "rgba(220, 38, 38, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.75, 0, Math.PI * 2);
  ctx.fill();

  // Rotating draconic sigil ring + counter-rotating inner rune ring
  ctx.save();
  ctx.rotate(elapsedTime * 2.8);
  ctx.strokeStyle = isMono ? "#000000" : "#F59E0B";
  ctx.lineWidth = 2.6;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, radius + 19, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI * 2 / 6) * i;
    ctx.fillStyle = i % 2 === 0 ? (isMono ? "#FFFFFF" : "#FEF08A") : (isMono ? "#000000" : "#EF4444");
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (radius + 19), Math.sin(a) * (radius + 19), 3.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.rotate(-elapsedTime * 2.1);
  ctx.strokeStyle = isMono ? "#444444" : "rgba(254, 240, 138, 0.6)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI * 2 / 6) * i;
    let px = Math.cos(a) * (radius + 13);
    let py = Math.sin(a) * (radius + 13);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Rising dragon ember sparks
  for (let i = 0; i < 6; i++) {
    let spA = elapsedTime * 3.4 + i * 1.05;
    let spR = radius + 12 + ((elapsedTime * 22 + i * 7) % 16);
    ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#FB923C";
    ctx.beginPath();
    ctx.arc(Math.cos(spA) * spR, Math.sin(spA) * spR, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Undulating fiery dragon tail & blazing wings + sweeping golden dragon horns
  ctx.save();
  ctx.rotate(facing);

  // Articulated flaming dragon tail with dorsal spikes
  for (let seg = 6; seg >= 1; seg--) {
    let tx = -radius - seg * 8.2;
    let ty = Math.sin(elapsedTime * 11 - seg * 0.72) * (4 + seg * 1.45);
    let tr = Math.max(3.4, 10.5 - seg * 1.15);
    ctx.fillStyle = isMono ? "#222222" : seg % 2 === 0 ? "#DC2626" : "#F97316";
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.beginPath();
    ctx.arc(tx, ty, tr * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }

  let flap = Math.sin(elapsedTime * 12) * 0.28;
  for (let side of [-1, 1]) {
    ctx.save();
    ctx.translate(-5, side * (radius * 0.55));
    ctx.rotate(side * (0.42 + flap));
    let wGrad = ctx.createLinearGradient(0, 0, -58, side * 42);
    wGrad.addColorStop(0, isMono ? "#222222" : "rgba(185, 28, 28, 0.96)");
    wGrad.addColorStop(0.55, isMono ? "#666666" : "rgba(249, 115, 22, 0.88)");
    wGrad.addColorStop(1, isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.94)");
    ctx.fillStyle = wGrad;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-26, side * 39 * pulse);
    ctx.lineTo(-38, side * 16);
    ctx.lineTo(-58, side * 32 * pulse);
    ctx.lineTo(-44, side * 5);
    ctx.lineTo(-18, -side * 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing wing rib veins
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(254, 249, 195, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-26, side * 39 * pulse);
    ctx.moveTo(0, 0);
    ctx.lineTo(-58, side * 32 * pulse);
    ctx.stroke();
    ctx.restore();

    // Sweeping golden-crimson dragon horns ahead of brow
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(6, side * 9);
    ctx.quadraticCurveTo(19, side * 20, 32, side * 13);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

export function drawTaiDuDrone(ctx, x, y, mode, facing, elapsedTime, shieldProgress, isMono, opts = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  let colPrimary = isMono ? "#FFFFFF" : mode === "guard" ? "#34D399" : mode === "pursuit" ? "#F97316" : "#38BDF8";
  let colGlow = isMono ? "#CCCCCC" : mode === "guard" ? "#A7F3D0" : mode === "pursuit" ? "#FEF08A" : "#BAE6FD";
  let bob = Math.sin(elapsedTime * 6.5) * 3.5;

  // Guard energy tether or Pursuit laser designator in world space
  if (mode === "guard" && typeof opts.playerX === "number" && typeof opts.playerY === "number") {
    ctx.save();
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.4)" : "rgba(52, 211, 153, 0.45)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y + bob);
    ctx.lineTo(opts.playerX, opts.playerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  } else if (mode === "pursuit" && typeof opts.targetX === "number" && typeof opts.targetY === "number") {
    ctx.save();
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.35)" : "rgba(249, 115, 22, 0.32)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(x, y + bob);
    ctx.lineTo(opts.targetX, opts.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y + bob);

  // Ground shadow beneath hovering drone
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 18 - bob, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer rotating energy ring + Overdrive aura + guard absorb charge gauge
  if ((opts.overdrive || 0) > 0) {
    ctx.save();
    ctx.rotate(-elapsedTime * 6.5);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  ctx.save();
  ctx.rotate(elapsedTime * (mode === "pursuit" || (opts.overdrive || 0) > 0 ? 6.2 : 3.2));
  ctx.strokeStyle = colPrimary;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  if (mode === "guard" && shieldProgress > 0) {
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 18.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, shieldProgress));
    ctx.stroke();
  }

  // Hex chassis oriented toward target/facing
  ctx.rotate(facing);
  if (mode === "pursuit") {
    // High-velocity plasma jet flames behind thrusters
    let flk = 4 + Math.sin(elapsedTime * 28) * 2.5;
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-19 - flk, -7);
    ctx.lineTo(-12, -2);
    ctx.moveTo(-12, 5);
    ctx.lineTo(-19 - flk, 7);
    ctx.lineTo(-12, 2);
    ctx.fill();
  }
  ctx.fillStyle = isMono ? "#111111" : "#0F172A";
  ctx.strokeStyle = colPrimary;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(5, -10);
  ctx.lineTo(-9, -8);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-9, 8);
  ctx.lineTo(5, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side thruster fins
  ctx.fillStyle = colPrimary;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-14, -14);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4, 10);
  ctx.lineTo(-14, 14);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();

  // Central optic lens + optional muzzle star
  ctx.fillStyle = colGlow;
  ctx.beginPath();
  ctx.arc(2, 0, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(3.5, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  if ((opts.muzzleTimer || 0) > 0) {
    drawFourPointStar(ctx, 16, 0, 6.2, 2.0, "#FEF08A", colPrimary);
  }

  ctx.restore();
}

export function drawTaiDuTurret(ctx, turret, elapsedTime, isMono) {
  let lifeRatio = Math.max(0, 1 - (turret.life || 0) / Math.max(0.1, turret.maxLife || 10));
  let spin = elapsedTime * 3.0;
  let recoil = Math.max(0, (turret.muzzleTimer || 0) / 0.12) * 4.5;

  // High-tech cyan-orange laser designator & target lock reticle
  if (turret.hasTarget && typeof turret.targetX === "number" && typeof turret.targetY === "number") {
    ctx.save();
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.34)" : "rgba(56, 189, 248, 0.36)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(turret.x, turret.y);
    ctx.lineTo(turret.targetX, turret.targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(turret.targetX, turret.targetY);
    ctx.rotate(elapsedTime * 2.5);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      let ra = (Math.PI / 2) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * 9, Math.sin(ra) * 9);
      ctx.lineTo(Math.cos(ra) * 17, Math.sin(ra) * 17);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(turret.x, turret.y);

  // Volumetric cyber deploy pad + remaining life arc
  let padG = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
  padG.addColorStop(0, isMono ? "rgba(255,255,255,0.22)" : "rgba(56, 189, 248, 0.28)");
  padG.addColorStop(0.65, isMono ? "rgba(120,120,120,0.16)" : "rgba(14, 165, 233, 0.16)");
  padG.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = padG;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  // Hexagonal tactical baseplate
  ctx.fillStyle = isMono ? "rgba(20,20,20,0.6)" : "rgba(15, 23, 42, 0.72)";
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.5)" : "rgba(56, 189, 248, 0.48)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let hi = 0; hi < 6; hi++) {
    let ha = (Math.PI / 3) * hi;
    let hx = Math.cos(ha) * 26, hy = Math.sin(ha) * 26;
    hi === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.25)" : "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 31, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
  ctx.stroke();

  // Tripod anchor legs with glowing clamp pads
  for (let i = 0; i < 3; i++) {
    let a = (Math.PI * 2 / 3) * i + 0.5;
    let lx = Math.cos(a) * 22, ly = Math.sin(a) * 22;
    ctx.strokeStyle = isMono ? "#444444" : "#334155";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(lx, ly, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Rotating turret gun assembly
  ctx.rotate(turret.angle || 0);
  // Twin plasma rail barrels with cooling heat-sink ribs + recoil
  ctx.fillStyle = isMono ? "#555555" : "#475569";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 1.6;
  ctx.fillRect(6 - recoil, -8.5, 24, 5.2);
  ctx.strokeRect(6 - recoil, -8.5, 24, 5.2);
  ctx.fillRect(6 - recoil, 3.3, 24, 5.2);
  ctx.strokeRect(6 - recoil, 3.3, 24, 5.2);
  ctx.fillStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.fillRect(10 - recoil, -6.6, 16, 1.5);
  ctx.fillRect(10 - recoil, 5.1, 16, 1.5);

  if ((turret.muzzleTimer || 0) > 0) {
    let mfCol = isMono ? "#FFFFFF" : "#FEF08A";
    let mfSec = isMono ? "#555555" : "#38BDF8";
    drawFourPointStar(ctx, 32 - recoil, -5.9, 8.5, 2.4, mfCol, mfSec);
    drawFourPointStar(ctx, 32 - recoil, 5.9, 8.5, 2.4, mfCol, mfSec);
  }

  // Armored turret dome with beveled inner rim
  ctx.fillStyle = isMono ? "#111111" : "#1E293B";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#999999" : "rgba(56, 189, 248, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Pulsing optical plasma core
  ctx.rotate(spin);
  drawFourPointStar(ctx, 0, 0, 7.8, 2.6, isMono ? "#FFFFFF" : "#E0F2FE", isMono ? "#333333" : "#38BDF8");

  ctx.restore();
}

export function drawLuanPortal(ctx, portal, elapsedTime, isMono) {
  let r = portal.radius || 54;
  let fade = Math.min(1, Math.min((portal.life || 0.2) / 0.2, ((portal.maxLife || 9) - (portal.life || 0)) / 0.35));
  let spin = elapsedTime * 2.8;
  let remainRatio = Math.max(0, 1 - (portal.life || 0) / Math.max(0.1, portal.maxLife || 9));

  ctx.save();
  ctx.globalAlpha = Math.max(0.18, fade);
  ctx.translate(portal.x, portal.y);

  // Outer void singularity nebula halo
  let grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r * 1.38);
  grad.addColorStop(0, isMono ? "rgba(0,0,0,0.95)" : "rgba(15, 7, 36, 0.96)");
  grad.addColorStop(0.46, isMono ? "rgba(60,60,60,0.52)" : "rgba(147, 51, 234, 0.56)");
  grad.addColorStop(0.76, isMono ? "rgba(180,180,180,0.34)" : "rgba(56, 189, 248, 0.38)");
  grad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2);
  ctx.fill();

  // Remaining lifetime gauge arc
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.48)" : "rgba(103, 232, 249, 0.62)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remainRatio);
  ctx.stroke();

  // Event horizon 4-arm swirling mirror nebula + outer rune ring
  ctx.save();
  ctx.rotate(spin);
  for (let arm = 0; arm < 4; arm++) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * arm);
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.35)" : arm % 2 === 0 ? "rgba(232, 121, 249, 0.55)" : "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(r * 0.32, 0);
    ctx.quadraticCurveTo(r * 0.72, r * 0.34, r * 1.04, r * 0.08);
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
  ctx.lineWidth = 2.8;
  ctx.setLineDash([12, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orbiting faceted shattered mirror glass shards
  for (let i = 0; i < 8; i++) {
    let a = (Math.PI * 2 / 8) * i;
    let sx = Math.cos(a) * r;
    let sy = Math.sin(a) * r;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a + spin * 1.2);
    ctx.fillStyle = i % 2 === 0 ? (isMono ? "#FFFFFF" : "#F5D0FE") : (isMono ? "#CCCCCC" : "#38BDF8");
    ctx.strokeStyle = isMono ? "#000000" : "#FFFFFF";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6.2, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Counter-rotating inner vortex spiral + mirror fracture ribs
  ctx.save();
  ctx.rotate(-spin * 1.65);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI * 2 / 3);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.64, 0, Math.PI * 0.78);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#CCCCCC" : "rgba(186, 230, 253, 0.78)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.25, 0);
    ctx.lineTo(r * 0.56, 6);
    ctx.lineTo(r * 0.84, 12);
    ctx.stroke();
  }
  ctx.restore();

  // Dark portal heart with shimmering singularity star
  ctx.fillStyle = isMono ? "#000000" : "#090418";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  drawFourPointStar(ctx, 0, 0, r * 0.24, r * 0.08, "#FFFFFF", isMono ? "#333333" : "#E879F9");

  ctx.restore();
}

export function drawLuanRift(ctx, rift, isMono) {
  let maxLife = Math.max(0.1, rift.maxLife || 2.8);
  let prog = clamp((rift.life || 0) / maxLife, 0, 1);
  let widthEnv = prog < 0.12 ? prog / 0.12 : prog > 0.78 ? Math.max(0, 1 - (prog - 0.78) / 0.22) : 1;
  let alpha = Math.max(0, 1 - prog);
  let dx = rift.x2 - rift.x1;
  let dy = rift.y2 - rift.y1;
  let len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  let offsets = rift.offsets || [-8, 10, -11, 7, -6];

  ctx.save();
  ctx.globalAlpha = alpha * 0.94;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const trace = (scale) => {
    ctx.beginPath();
    ctx.moveTo(rift.x1, rift.y1);
    for (let i = 0; i < offsets.length; i++) {
      let t = (i + 1) / (offsets.length + 1);
      ctx.lineTo(rift.x1 + dx * t + nx * offsets[i] * scale, rift.y1 + dy * t + ny * offsets[i] * scale);
    }
    ctx.lineTo(rift.x2, rift.y2);
  };

  // Cosmic dimensional void interior
  ctx.strokeStyle = isMono ? "#020617" : "#070314";
  ctx.lineWidth = (rift.width || 10) * 2.4 * (0.4 + 0.6 * widthEnv);
  trace(1.2);
  ctx.stroke();

  ctx.save();
  if (!isMono) ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(124, 58, 237, 0.62)";
  ctx.lineWidth = (rift.width || 10) * 1.9 * (0.5 + 0.5 * widthEnv);
  trace(1.12);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#CBD5E1" : "#C084FC";
  ctx.lineWidth = (rift.width || 10) * (0.5 + 0.5 * widthEnv);
  trace(1.0);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.lineWidth = Math.max(2.2, (rift.width || 10) * 0.36);
  trace(0.8);
  ctx.stroke();
  ctx.restore();

  // Branching hairline void fractures & floating mirror motes at vertices
  for (let i = 0; i < offsets.length; i++) {
    let t = (i + 1) / (offsets.length + 1);
    let vx = rift.x1 + dx * t + nx * offsets[i];
    let vy = rift.y1 + dy * t + ny * offsets[i];
    let dirSign = i % 2 === 0 ? 1 : -1;
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.65)" : "rgba(245, 208, 254, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + nx * dirSign * 16 + (dx / len) * 10, vy + ny * dirSign * 16 + (dy / len) * 10);
    ctx.stroke();
    if (i % 2 === 0) drawFourPointStar(ctx, vx, vy, 6.2 * widthEnv + 1, 2.0, "#FFFFFF", isMono ? "#333333" : "#C084FC");
  }

  // Anchor rift star flares at endpoints
  drawFourPointStar(ctx, rift.x1, rift.y1, 9.5, 2.8, "#FFFFFF", isMono ? "#333333" : "#38BDF8");
  drawFourPointStar(ctx, rift.x2, rift.y2, 9.5, 2.8, "#FFFFFF", isMono ? "#333333" : "#E879F9");

  ctx.restore();
}

export function drawLuanBeam(ctx, beam, isMono) {
  let p = Math.min(1, (beam.life || 0) / Math.max(0.05, beam.maxLife || 0.45));
  let alpha = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) / 0.8);
  let w = (beam.width || 34) * (1.24 - 0.45 * p);
  let dx = beam.x2 - beam.x1;
  let dy = beam.y2 - beam.y1;
  let len = Math.hypot(dx, dy) || 1;
  let ang = Math.atan2(dy, dx);
  let nx = -dy / len;
  let ny = dx / len;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";

  // Outer void aura
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.75)" : (beam.isBranch ? "rgba(56, 189, 248, 0.5)" : "rgba(168, 85, 247, 0.56)");
  ctx.lineWidth = w * 2.25;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  // Mid plasma beam
  ctx.strokeStyle = isMono ? "#000000" : (beam.isBranch ? "#38BDF8" : "#A855F7");
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  // Blinding core
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(3.8, w * 0.42);
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  // Dual counter-phase high-voltage arcane ribbons along the beam
  for (let phase of [1, -1]) {
    ctx.strokeStyle = isMono ? (phase > 0 ? "#000000" : "#E5E7EB") : (phase > 0 ? "#F5D0FE" : "#67E8F9");
    ctx.lineWidth = phase > 0 ? 2.4 : 1.8;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    for (let i = 1; i < 10; i++) {
      let t = i / 10;
      let j = phase * w * 0.56 * Math.sin(t * Math.PI * 5 + p * 22);
      ctx.lineTo(beam.x1 + dx * t + nx * j, beam.y1 + dy * t + ny * j);
    }
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
  }

  // Supersonic dimensional shockwave rings perpendicular to the beam
  let shockStep = Math.max(70, len / 4);
  for (let d = shockStep * 0.6; d < len - 25; d += shockStep) {
    let sx = beam.x1 + (dx / len) * d, sy = beam.y1 + (dy / len) * d;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    ctx.strokeStyle = isMono ? "#FFFFFF" : beam.isBranch ? "#67E8F9" : "#F5D0FE";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.24, w * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Origin & impact energy rings + celestial star flares
  ctx.fillStyle = isMono ? "#FFFFFF" : "#F5D0FE";
  ctx.beginPath();
  ctx.arc(beam.x1, beam.y1, w * 0.48, 0, Math.PI * 2);
  ctx.arc(beam.x2, beam.y2, w * 0.65, 0, Math.PI * 2);
  ctx.fill();

  drawFourPointStar(ctx, beam.x1, beam.y1, w * 0.78, w * 0.22, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
  drawFourPointStar(ctx, beam.x2, beam.y2, w * 0.96, w * 0.26, "#FFFFFF", isMono ? "#000000" : "#E879F9");

  ctx.restore();
}

export function drawNguyenSatellites(ctx, x, y, baseAngle, elapsedTime, orbitRadius, isMono) {
  ctx.save();
  ctx.translate(x, y);

  // Subtle emerald-gold sanctuary orbit ring
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.4)" : "rgba(52, 211, 153, 0.45)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Harmonic golden triangle links connecting the 3 satellites
  let pts = [];
  for (let i = 0; i < 3; i++) {
    let a = baseAngle + (Math.PI * 2 / 3) * i;
    pts.push({ x: Math.cos(a) * orbitRadius, y: Math.sin(a) * orbitRadius });
  }
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.35)" : "rgba(253, 224, 71, 0.36)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.lineTo(pts[2].x, pts[2].y);
  ctx.closePath();
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    let sx = pts[i].x;
    let sy = pts[i].y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(elapsedTime * 3.5 + i);

    // Outer radiant glow disc
    ctx.fillStyle = isMono ? "rgba(255,255,255,0.22)" : "rgba(16, 185, 129, 0.32)";
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Rotating diamond emerald-gold guardian satellite
    ctx.fillStyle = isMono ? "#FFFFFF" : "#10B981";
    ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright life core
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawNguyenSanctuaryWave(ctx, wave, isMono) {
  let p = Math.min(1, (wave.life || 0) / Math.max(0.08, wave.maxLife || 0.52));
  let r = (wave.maxRadius || 230) * (0.25 + 0.75 * Math.pow(p, 0.7));
  let alpha = Math.max(0, 1 - p);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(wave.x, wave.y);

  let grad = ctx.createRadialGradient(0, 0, Math.max(2, r * 0.25), 0, 0, r);
  grad.addColorStop(0, "rgba(16, 185, 129, 0)");
  grad.addColorStop(0.58, isMono ? "rgba(255,255,255,0.2)" : "rgba(52, 211, 153, 0.28)");
  grad.addColorStop(0.88, isMono ? "rgba(255,255,255,0.38)" : "rgba(254, 240, 138, 0.45)");
  grad.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMono ? "#000000" : "#10B981";
  ctx.lineWidth = 5.4 * alpha + 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = 2.8 * alpha + 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // 8 outlined sanctuary petals + celestial starlight sparkles riding the shockwave
  for (let i = 0; i < 8; i++) {
    let a = (Math.PI / 4) * i + p * 1.6;
    ctx.save();
    ctx.translate(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
    ctx.rotate(a);
    ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
    ctx.strokeStyle = isMono ? "#000000" : "#047857";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 * alpha + 2.5, 3.6 * alpha + 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (i % 2 === 0) {
      let sa = a + Math.PI / 8;
      drawFourPointStar(ctx, Math.cos(sa) * r * 0.72, Math.sin(sa) * r * 0.72, 6 * alpha + 2, 1.8, "#FFFFFF", isMono ? "#333333" : "#10B981");
    }
  }

  ctx.restore();
}

export function drawTaiDuCarpetStrike(ctx, strike, elapsedTime, isMono) {
  let prog = clamp((strike.timer || 0) / Math.max(0.05, strike.delay || 0.15), 0, 1);
  let r = strike.radius || 95;

  ctx.save();
  ctx.translate(strike.x, strike.y);

  // Target zone volumetric danger glow
  let tzG = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
  tzG.addColorStop(0, isMono ? "rgba(255,255,255,0.22)" : `rgba(254, 240, 138, ${0.14 + 0.2 * prog})`);
  tzG.addColorStop(0.65, isMono ? "rgba(0,0,0,0.2)" : `rgba(249, 115, 22, ${0.16 + 0.18 * prog})`);
  tzG.addColorStop(1, "rgba(249, 115, 22, 0)");
  ctx.fillStyle = tzG;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
  ctx.lineWidth = 2.6;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rotating 4-corner cybernetic targeting lock brackets
  ctx.save();
  ctx.rotate(elapsedTime * 2.2);
  ctx.strokeStyle = isMono ? "#FFFFFF" : strike.isOrbital ? "#38BDF8" : "#FEF08A";
  ctx.lineWidth = 2.2;
  for (let bi = 0; bi < 4; bi++) {
    let ba = (Math.PI / 2) * bi;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, ba - 0.18, ba + 0.18);
    ctx.stroke();
  }
  ctx.restore();

  // Shrinking lock-on countdown ring
  ctx.strokeStyle = isMono ? "#FFFFFF" : strike.isOrbital ? "#FEF08A" : "#38BDF8";
  ctx.lineWidth = strike.isOrbital ? 3.8 : 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(8, r * (1 - prog * 0.85)), 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair reticle
  ctx.strokeStyle = isMono ? "#FFFFFF" : strike.isOrbital ? "#F43F5E" : "#FEF08A";
  ctx.lineWidth = strike.isOrbital ? 2.6 : 1.8;
  let ch = strike.isOrbital ? 30 : 16;
  ctx.beginPath();
  ctx.moveTo(-ch, 0);
  ctx.lineTo(ch, 0);
  ctx.moveTo(0, -ch);
  ctx.lineTo(0, ch);
  ctx.stroke();

  if (strike.isOrbital) {
    // Vertical orbital satellite laser guide beam + ion core + shock rings
    let bw = 8 + prog * 30;
    let bGrad = ctx.createLinearGradient(-bw, 0, bw, 0);
    bGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    bGrad.addColorStop(0.28, isMono ? "rgba(255,255,255,0.45)" : `rgba(56, 189, 248, ${0.28 + prog * 0.45})`);
    bGrad.addColorStop(0.5, isMono ? "#FFFFFF" : "#FEF08A");
    bGrad.addColorStop(0.72, isMono ? "rgba(255,255,255,0.45)" : `rgba(249, 115, 22, ${0.28 + prog * 0.45})`);
    bGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = bGrad;
    ctx.fillRect(-bw, -480, bw * 2, 480);

    for (let ringI = 0; ringI < 3; ringI++) {
      let ry = -60 - ringI * 110 + (elapsedTime * 180) % 90;
      ctx.strokeStyle = isMono ? "#FFFFFF" : ringI % 2 === 0 ? "#67E8F9" : "#FEF08A";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, ry, bw * 0.9, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, 14 + prog * 14, 4, "#FFFFFF", isMono ? "#333333" : "#F97316");
  }

  // Descending aerial missile body with Mach plume right before detonation
  if (prog > 0.25 && !strike.isOrbital) {
    let fallY = -(1 - prog) * 360;
    ctx.save();
    ctx.translate(0, fallY);
    let mGrad = ctx.createLinearGradient(0, -68, 0, 0);
    mGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    mGrad.addColorStop(0.65, isMono ? "rgba(255,255,255,0.5)" : "rgba(56, 189, 248, 0.72)");
    mGrad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(0, -72);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(-6.5, -6);
    ctx.lineTo(-9, -12);
    ctx.lineTo(9, -12);
    ctx.lineTo(6.5, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function drawNguyenSanctuaryField(ctx, field, elapsedTime, isMono) {
  let remainFade = Math.min(1, ((field.duration || 3.2) - (field.timer || 0)) / 0.45);
  let fadeIn = Math.min(1, (field.timer || 0.2) / 0.22);
  let alpha = Math.max(0, Math.min(fadeIn, remainFade));
  let r = field.radius || 230;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(field.x, field.y);

  // Soft sanctuary floor aura
  let grad = ctx.createRadialGradient(0, 0, Math.max(4, r * 0.1), 0, 0, r);
  grad.addColorStop(0, isMono ? "rgba(255,255,255,0.22)" : "rgba(254, 240, 138, 0.28)");
  grad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.18)" : "rgba(16, 185, 129, 0.24)");
  grad.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Solid luminous border + rotating outer sanctuary glyph border
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.rotate(elapsedTime * 0.85);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#10B981";
  ctx.lineWidth = 3.2;
  ctx.setLineDash([16, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Outer 6-petal emerald lotus + inner golden 6-petal lotus
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.55)" : "rgba(52, 211, 153, 0.65)";
  ctx.lineWidth = 2.0;
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.36, r * 0.15, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(-elapsedTime * 1.4);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.72)";
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i + Math.PI / 6;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32, r * 0.22, r * 0.1, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 6 Vertical Ascending Sanctuary Light Ribbons at perimeter nodes
  for (let i = 0; i < 6; i++) {
    let la = (Math.PI / 3) * i + elapsedTime * 0.45;
    let lx = Math.cos(la) * r * 0.88, ly = Math.sin(la) * r * 0.88;
    let colGrad = ctx.createLinearGradient(lx, ly, lx, ly - 38);
    colGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.55)" : "rgba(110, 231, 183, 0.62)");
    colGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = colGrad;
    ctx.fillRect(lx - 3, ly - 38, 6, 38);
    drawFourPointStar(ctx, lx, ly, 6.2, 2.0, "#FFFFFF", isMono ? "#333333" : "#10B981");
  }

  // Rising golden-emerald healing motes + central beacon star
  for (let i = 0; i < 10; i++) {
    let phase = (elapsedTime * 0.9 + i * 0.11) % 1;
    let ma = (Math.PI * 2 / 10) * i + elapsedTime * 0.6;
    let mr = r * (0.22 + 0.64 * (i % 3) * 0.33);
    ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
    ctx.globalAlpha = alpha * (1 - phase);
    ctx.beginPath();
    ctx.arc(Math.cos(ma) * mr, Math.sin(ma) * mr - phase * 26, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
  drawFourPointStar(ctx, 0, 0, 16, 4.5, isMono ? "#FFFFFF" : "#FEF08A", isMono ? "#333333" : "#10B981");

  ctx.restore();
}

export function drawNguyenBastionAura(ctx, x, y, radius, elapsedTime, shieldRatio, isEmergency, isMono) {
  ctx.save();
  ctx.translate(x, y);

  // Hexagonal emerald-gold sanctuary shield dome with beveled gradient
  let r = radius + 15;
  let domeG = ctx.createRadialGradient(0, 0, radius * 0.45, 0, 0, r);
  domeG.addColorStop(0, "rgba(16, 185, 129, 0)");
  domeG.addColorStop(0.75, isMono ? "rgba(255,255,255,0.16)" : isEmergency ? "rgba(254, 240, 138, 0.28)" : "rgba(16, 185, 129, 0.22)");
  domeG.addColorStop(1, isMono ? "rgba(255,255,255,0.34)" : isEmergency ? "rgba(254, 240, 138, 0.48)" : "rgba(52, 211, 153, 0.38)");
  ctx.fillStyle = domeG;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(elapsedTime * 1.6);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i;
    let px = Math.cos(a) * r;
    let py = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  for (let i = 0; i < 6; i += 2) {
    let a = (Math.PI / 3) * i;
    drawFourPointStar(ctx, Math.cos(a) * r, Math.sin(a) * r, 5.2, 1.8, "#FFFFFF", isMono ? "#333333" : "#10B981");
  }

  // Golden shield capacity arc around the hexagon
  if (shieldRatio > 0) {
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, shieldRatio));
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

export function drawDuyDecoy(ctx, decoy, elapsedTime, isMono) {
  if (!decoy) return;
  let { x, y, radius = 30, life = 0, maxLife = 5, absorbedDamage = 0, hitFlash = 0, passiveMult = 1 } = decoy;
  let remain = Math.max(0, maxLife - life);
  let ratio = clamp(remain / Math.max(0.1, maxLife), 0, 1);
  let urgent = remain < 1.1;
  let pulse = 0.5 + 0.5 * Math.sin(elapsedTime * (urgent ? 18 : 7));
  let wobble = hitFlash > 0 ? Math.sin(elapsedTime * 48) * 0.18 * hitFlash : Math.sin(elapsedTime * 3.8) * 0.04;

  ctx.save();
  ctx.translate(x, y);

  // Outer taunt shockwave range ring (195px blast preview + taunt aura)
  let blastR = decoy.blastRadius || 195;
  let dAura = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, blastR);
  dAura.addColorStop(0, isMono ? "rgba(255,255,255,0.16)" : "rgba(20, 184, 166, 0.16)");
  dAura.addColorStop(0.75, isMono ? "rgba(255,255,255,0.06)" : urgent ? "rgba(244, 63, 94, 0.14)" : "rgba(20, 184, 166, 0.08)");
  dAura.addColorStop(1, "rgba(20, 184, 166, 0)");
  ctx.fillStyle = dAura;
  ctx.beginPath();
  ctx.arc(0, 0, blastR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.28)" : urgent ? `rgba(244, 63, 94, ${0.32 + pulse * 0.25})` : "rgba(45, 212, 191, 0.28)";
  ctx.lineWidth = urgent ? 2.4 : 1.6;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, blastR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orbiting chakra kunai seal tags + swirling substitution smoke
  for (let si = 0; si < 4; si++) {
    let sa = elapsedTime * 2.1 + (Math.PI / 2) * si;
    let sx = Math.cos(sa) * (radius + 22), sy = Math.sin(sa) * (radius + 22);
    ctx.fillStyle = isMono ? "rgba(255,255,255,0.22)" : "rgba(94, 234, 212, 0.28)";
    ctx.beginPath();
    ctx.arc(sx * 0.72, sy * 0.72, 6.5, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, sx, sy, 5.5, 1.8, isMono ? "#FFFFFF" : "#FDE047", isMono ? "#333333" : "#14B8A6");
  }

  // Taunt pulse waves drawing monsters toward decoy
  let tauntWaveR = radius + 16 + ((elapsedTime * 42) % 44);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(250, 204, 21, 0.52)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, tauntWaveR, 0, Math.PI * 2);
  ctx.stroke();

  // Floor shadow & 5s countdown ring
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, 16, radius * 0.9, radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMono ? "#FFFFFF" : urgent ? "#F43F5E" : "#14B8A6";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
  ctx.stroke();

  // Puppet / Straw Ninja Decoy silhouette
  ctx.save();
  ctx.rotate(wobble);
  let bodyCol = hitFlash > 0 ? "#CBD5E1" : isMono ? "#CBD5E1" : "#D97706";
  let wrapCol = isMono ? "#000000" : "#14B8A6";

  // Wooden crossbar / ninja post arms
  ctx.strokeStyle = isMono ? "#000000" : "#78350F";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, -4);
  ctx.lineTo(22, -4);
  ctx.moveTo(0, 18);
  ctx.lineTo(0, -16);
  ctx.stroke();

  // Straw torso with crimson/teal sash
  ctx.fillStyle = bodyCol;
  ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-12, -10, 24, 24, 6);
  ctx.fill();
  ctx.stroke();

  // Diagonal assassin belt
  ctx.strokeStyle = isMono ? "#333333" : "#F43F5E";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, -7);
  ctx.lineTo(10, 10);
  ctx.stroke();

  // Decoy head + ninja headband
  ctx.fillStyle = hitFlash > 0 ? "#E2E8F0" : isMono ? "#F8FAFC" : "#FDE68A";
  ctx.strokeStyle = isMono ? "#000000" : "#F59E0B";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = wrapCol;
  ctx.fillRect(-12, -23, 24, 5);
  // Floating ribbon tails on headband
  ctx.strokeStyle = wrapCol;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-12, -21);
  ctx.lineTo(-22, -25 + Math.sin(elapsedTime * 10) * 3);
  ctx.stroke();

  // Cute X-eyes + smug target grin on decoy
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-6, -18);
  ctx.lineTo(-2, -14);
  ctx.moveTo(-2, -18);
  ctx.lineTo(-6, -14);
  ctx.moveTo(2, -18);
  ctx.lineTo(6, -14);
  ctx.moveTo(6, -18);
  ctx.lineTo(2, -14);
  ctx.stroke();
  ctx.restore();

  // Floating counter: absorbed damage & countdown
  ctx.font = "bold 12px var(--font-mono, monospace)";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3.5;
  let dmgNum = Math.round(absorbedDamage * DUY_DECOY_REFLECT_RATIO * (passiveMult > 1 ? passiveMult : 1));
  let label = dmgNum > 0 ? `💥 ${dmgNum} · ${remain.toFixed(1)}s` : `🪆 ${remain.toFixed(1)}s`;
  ctx.strokeText(label, 0, -radius - 15);
  ctx.fillStyle = dmgNum > 0 ? "#FDE047" : "#5EEAD4";
  ctx.fillText(label, 0, -radius - 15);

  ctx.restore();
}

export function drawPhongIllusion(ctx, illusion, elapsedTime, isMono) {
  if (!illusion) return;
  let { x, y, facing = 0, radius = 21, life = 0, maxLife = 5.5, attackAnim = 0 } = illusion;
  let remain = Math.max(0, maxLife - life);
  let fade = clamp(remain / 0.65, 0.22, 0.9);
  let pulse = 0.74 + 0.26 * Math.sin(elapsedTime * 11);
  let sway = Math.sin(elapsedTime * 9 + (illusion.id || 0));

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(x, y);

  // Cyan afterimage & remaining duration ring underneath
  ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(34, 211, 238, ${0.58 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, radius + 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  let lifeRatio = clamp(remain / Math.max(0.1, maxLife), 0, 1);
  ctx.strokeStyle = isMono ? "#E2E8F0" : "#0EA5E9";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
  ctx.stroke();

  // Translucent cyan phantom assassin silhouette + scarf + twin energy blades
  ctx.rotate(facing);
  let glow = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.28);
  glow.addColorStop(0, isMono ? "rgba(255,255,255,0.7)" : "rgba(103, 232, 249, 0.78)");
  glow.addColorStop(0.6, isMono ? "rgba(0,0,0,0.45)" : "rgba(14, 165, 233, 0.5)");
  glow.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.28, 0, Math.PI * 2);
  ctx.fill();

  // Flowing cyan phantom scarf
  ctx.fillStyle = isMono ? "#1E293B" : "rgba(2, 132, 199, 0.65)";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.4, -5);
  ctx.quadraticCurveTo(-radius * 1.2, -12 + sway * 4, -radius * 1.68, -4 + sway * 5);
  ctx.lineTo(-radius * 1.25, 2 + sway * 3);
  ctx.quadraticCurveTo(-radius * 0.9, 8, -radius * 0.4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isMono ? "#0F172A" : "rgba(8, 47, 73, 0.8)";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.86, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Spectral twin plasma blades with lunge swing when firing
  let swing = attackAnim > 0 ? Math.sin(attackAnim * 13) * 0.75 : 0;
  let lunge = attackAnim > 0 ? 4 : 0;
  for (let side of [-1, 1]) {
    ctx.save();
    ctx.translate(4 + lunge, side * 11.5);
    ctx.rotate(side * 0.28 + side * swing);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.strokeStyle = isMono ? "#000000" : "#E0F2FE";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -2.1);
    ctx.lineTo(22, 0.2);
    ctx.lineTo(15, 2.4);
    ctx.lineTo(0, 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Cyan visor eyes
  ctx.fillStyle = "#E0F2FE";
  ctx.beginPath();
  ctx.ellipse(radius * 0.48, -radius * 0.2, 3.0, 1.5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.48, radius * 0.2, 3.0, 1.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawDuyHealOrb(ctx, orb, elapsedTime, isMono) {
  if (!orb) return;
  ctx.save();
  ctx.translate(orb.x, orb.y);
  let r = orb.radius || 7;
  let angle = Math.atan2(orb.vy || 0, orb.vx || 1);
  ctx.rotate(angle);

  // Volumetric emerald lotus glow halo
  let halo = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.4);
  halo.addColorStop(0, isMono ? "rgba(255,255,255,0.75)" : "rgba(167, 243, 208, 0.8)");
  halo.addColorStop(0.5, isMono ? "rgba(180,180,180,0.3)" : "rgba(52, 211, 153, 0.4)");
  halo.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Glowing emerald comet trail
  let grad = ctx.createLinearGradient(-26, 0, r, 0);
  grad.addColorStop(0, "rgba(52, 211, 153, 0)");
  grad.addColorStop(1, isMono ? "rgba(255,255,255,0.72)" : "rgba(52, 211, 153, 0.88)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(0, -r * 0.9);
  ctx.lineTo(0, r * 0.9);
  ctx.closePath();
  ctx.fill();

  // Rotating golden-emerald 4-petal lotus seed core
  ctx.rotate(elapsedTime * 8);
  for (let pi = 0; pi < 4; pi++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#6EE7B7";
    ctx.beginPath();
    ctx.ellipse(r * 0.65, 0, r * 0.55, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = isMono ? "#FFFFFF" : "#34D399";
  ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawFourPointStar(ctx, 0, 0, r * 0.72, r * 0.26, isMono ? "#000000" : "#FEF08A", null);
  ctx.restore();
}

// =====================================================================
// UPGRADED BOSS BODY RENDERER (WAVES 15, 18, 21, 24, 27)
// Articulated silhouettes, Phase 2/3 visual evolution & windup telegraphs
// =====================================================================

export function drawUpgradedBossBody(ctx, boss, elapsedTime, isMono) {
  let wave = boss.bossWave || 15;
  let r = Math.max(24, Number(boss.radius) || 46);
  let t = elapsedTime || 0;
  let facing = boss.facing || 0;
  let hit = (boss.hitFlash || 0) > 0;
  let phase = boss.phase || 1;
  let isP2 = phase >= 2;
  let isP3 = phase >= 3;
  let walk = boss.animWalkPhase || t * 5;
  let windupRatio =
    boss.castWindupTimer > 0 && boss.castWindupTotal > 0
      ? clamp(1 - boss.castWindupTimer / boss.castWindupTotal, 0, 1)
      : 0;
  let releaseRatio =
    boss.skillReleaseTimer > 0 && boss.skillReleaseTotal > 0
      ? clamp(1 - boss.skillReleaseTimer / boss.skillReleaseTotal, 0, 1)
      : -1;

  // Phase 2/3 & Windup aura sigil beneath boss
  if (isP2 || windupRatio > 0) {
    let auraColor =
      wave === 15
        ? isP3 ? "#EF4444" : "#38BDF8"
        : wave === 18
        ? "#FDE047"
        : wave === 21
        ? "#A3E635"
        : wave === 24
        ? "#FB7185"
        : isP3 ? "#DC2626" : "#FBBF24";
    let auraScale = 1 + windupRatio * 0.25 + 0.05 * Math.sin(t * 8);
    let auraR = r * 1.48 * auraScale;
    let auraGrad = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, auraR);
    auraGrad.addColorStop(0, "rgba(0,0,0,0)");
    auraGrad.addColorStop(0.65, isMono ? "rgba(255,255,255,0.16)" : `${auraColor}30`);
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    if (windupRatio > 0) {
      ctx.save();
      ctx.rotate(t * 4.5);
      ctx.strokeStyle = isMono ? "#FFFFFF" : auraColor;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r * (1.58 - windupRatio * 0.35), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  if (wave === 15) {
    // -----------------------------------------------------------------
    // WAVE 15: Pháo Vương Cơ Giới Rex — Overcharged Siege Automaton
    // -----------------------------------------------------------------
    let accent = isMono ? "#FFFFFF" : isP3 ? "#EF4444" : isP2 ? "#F59E0B" : "#38BDF8";
    let bob = Math.sin(walk * 2) * 2.5;
    ctx.save();
    ctx.translate(0, bob);

    // Outer counter-rotating targeting HUD ring
    ctx.save();
    ctx.rotate(t * (isP2 ? 2.1 : 1.2));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([12, 6, 3, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      let ta = (Math.PI / 2) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.beginPath();
      ctx.arc(Math.cos(ta) * r * 1.42, Math.sin(ta) * r * 1.42, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Dual Hover-Jet Thrusters spewing plasma exhaust
    for (let side of [-1, 1]) {
      let jetLen = (14 + 7 * Math.sin(t * 24 + side)) * (isP2 ? 1.3 : 1);
      let jGrad = ctx.createLinearGradient(side * r * 0.56, r * 0.72, side * r * 0.56, r * 0.72 + jetLen);
      jGrad.addColorStop(0, isMono ? "#FFFFFF" : "#FEF08A");
      jGrad.addColorStop(0.5, accent);
      jGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = jGrad;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.44, r * 0.68);
      ctx.lineTo(side * r * 0.56, r * 0.72 + jetLen);
      ctx.lineTo(side * r * 0.68, r * 0.68);
      ctx.closePath();
      ctx.fill();
    }

    // Articulated Twin Shoulder Mortar / Missile Pods
    let podRecoil = windupRatio > 0 ? -4 * windupRatio : releaseRatio >= 0 ? 5 * Math.sin(releaseRatio * Math.PI) : 0;
    for (let side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * r * 0.88, -r * 0.14 + podRecoil);
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#1A1A1A" : "#1E293B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#94A3B8";
      ctx.lineWidth = 2.4;
      ctx.fillRect(-12, -r * 0.48, 24, r * 0.92);
      ctx.strokeRect(-12, -r * 0.48, 24, r * 0.92);
      // 3 Glowing missile tubes per pod
      for (let ti = 0; ti < 3; ti++) {
        ctx.fillStyle = isMono ? "#FFFFFF" : accent;
        ctx.beginPath();
        ctx.arc(0, -r * 0.3 + ti * (r * 0.28), 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Main Octagonal Dreadnought Steel Hull with metallic gradient
    let hullGrad = ctx.createLinearGradient(-r, -r, r, r);
    hullGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#333333" : "#475569");
    hullGrad.addColorStop(0.5, hit ? "#CBD5E1" : isMono ? "#1A1A1A" : "#1E293B");
    hullGrad.addColorStop(1, hit ? "#CBD5E1" : isMono ? "#080808" : "#0F172A");

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      let ang = (Math.PI / 4) * i + Math.PI / 8;
      let px = Math.cos(ang) * r;
      let py = Math.sin(ang) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = hullGrad;
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner chamfered chest armor seam + specular top-left bevel highlight
    ctx.strokeStyle = isMono ? "#888888" : "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      let ang = (Math.PI / 4) * i + Math.PI / 8;
      let px = Math.cos(ang) * (r * 0.76);
      let py = Math.sin(ang) * (r * 0.76);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(226, 232, 240, 0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, -Math.PI * 0.88, -Math.PI * 0.18);
    ctx.stroke();

    // Phase 2/3 superheated reactor hull fissures
    if (isP2) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : isP3 ? "#FCA5A5" : "#FDE047";
      ctx.lineWidth = isP3 ? 2.4 : 1.7;
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, -r * 0.2);
      ctx.lineTo(-r * 0.42, -r * 0.04);
      ctx.lineTo(-r * 0.25, r * 0.18);
      ctx.moveTo(r * 0.72, -r * 0.18);
      ctx.lineTo(r * 0.4, 0.05 * r);
      ctx.lineTo(r * 0.22, r * 0.22);
      ctx.stroke();
    }

    // Spinning Overcharged Chest Reactor Turbine
    ctx.save();
    ctx.translate(0, r * 0.14);
    let coreR = r * (0.36 + windupRatio * 0.08);
    let reactGlow = ctx.createRadialGradient(0, 0, coreR * 0.15, 0, 0, coreR * 1.45);
    reactGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.4)" : `${accent}66`);
    reactGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = reactGlow;
    ctx.beginPath();
    ctx.arc(0, 0, coreR * 1.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isMono ? "#000000" : "#020617";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(t * (isP3 ? 11 : isP2 ? 7 : 4));
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.4;
    for (let bi = 0; bi < 4; bi++) {
      let ba = (Math.PI / 2) * bi;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ba) * coreR * 0.85, Math.sin(ba) * coreR * 0.85);
      ctx.stroke();
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(0, 0, coreR * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Armored Visor Slit + Sweeping Laser Scanner Eye
    ctx.fillStyle = "#020617";
    ctx.fillRect(-r * 0.48, -r * 0.62, r * 0.96, 11);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-r * 0.48, -r * 0.62, r * 0.96, 11);
    let scanX = Math.sin(t * (windupRatio > 0 ? 12 : 4)) * r * 0.34;
    ctx.fillStyle = windupRatio > 0 || isP3 ? "#EF4444" : "#FEF08A";
    ctx.beginPath();
    ctx.arc(scanX, -r * 0.565, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(scanX, -r * 0.565, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (wave === 18) {
    // -----------------------------------------------------------------
    // WAVE 18: Lôi Thần Thiên Khải — Thunder Archon Raijin
    // -----------------------------------------------------------------
    let hover = Math.sin(t * 3.6) * 5;
    let lightningCol = isMono ? "#FFFFFF" : "#FDE047";
    let stormBlue = isMono ? "#444444" : "#38BDF8";

    ctx.save();
    ctx.translate(0, hover);

    // Swirling storm cloud plinth beneath Raijin
    for (let ci = -2; ci <= 2; ci++) {
      let cx = ci * r * 0.36 + Math.sin(t * 2.5 + ci) * 3;
      let cy = r * 0.68 + Math.abs(ci) * 3;
      ctx.fillStyle = isMono ? "#222222" : ci % 2 === 0 ? "#1E293B" : "#0F172A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(56, 189, 248, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.34 - Math.abs(ci) * 0.04), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Flowing Celestial Lightning Scarf / Ribbons behind shoulders
    for (let side of [-1, 1]) {
      let waveA = Math.sin(t * 6.5 + side * 1.4) * 14;
      let waveB = Math.cos(t * 5.2 + side) * 18;
      ctx.strokeStyle = isMono ? "#FFFFFF" : isP2 ? "#FEF08A" : "#38BDF8";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(side * r * 0.45, -r * 0.35);
      ctx.bezierCurveTo(side * r * 1.15, -r * 0.8 + waveA, side * r * 1.65, r * 0.15 + waveB, side * r * 1.35, r * 0.72 + waveA * 0.6);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Ring of 8 Floating Taiko Storm Drums connected by live lightning arcs
    let drumCount = 8;
    let drumOrbit = r * (1.38 + windupRatio * 0.14);
    let drumPts = [];
    for (let i = 0; i < drumCount; i++) {
      let ang = t * (isP2 ? 1.85 : 1.2) + ((Math.PI * 2) / drumCount) * i;
      drumPts.push({ x: Math.cos(ang) * drumOrbit, y: Math.sin(ang) * drumOrbit, ang });
    }
    // Live electric chain connecting drums
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.72)";
    ctx.lineWidth = windupRatio > 0 ? 2.6 : 1.6;
    for (let i = 0; i < drumCount; i++) {
      let p1 = drumPts[i];
      let p2 = drumPts[(i + 1) % drumCount];
      let mx = (p1.x + p2.x) * 0.5 + Math.sin(t * 24 + i) * 6;
      let my = (p1.y + p2.y) * 0.5 + Math.cos(t * 24 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(mx, my);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let i = 0; i < drumCount; i++) {
      let dp = drumPts[i];
      ctx.save();
      ctx.translate(dp.x, dp.y);
      ctx.rotate(dp.ang + t * 2);
      ctx.fillStyle = isMono ? "#111111" : "#0C4A6E";
      ctx.strokeStyle = lightningCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Inner golden drumhead symbol
      ctx.fillStyle = i % 2 === 0 ? lightningCol : stormBlue;
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Storm Avatar Body & Armored Cobalt Pauldrons
    let bodyGrad = ctx.createRadialGradient(-r * 0.22, -r * 0.25, 6, 0, 0, r);
    bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#555555" : "#38BDF8");
    bodyGrad.addColorStop(0.5, hit ? "#CBD5E1" : isMono ? "#2B2B2B" : "#0284C7");
    bodyGrad.addColorStop(1, hit ? "#CBD5E1" : isMono ? "#090909" : "#082F49");
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = stormBlue;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Specular rim & Phase 2/3 crackling lightning veins
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.5)" : "rgba(224, 242, 254, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, -Math.PI * 0.82, -Math.PI * 0.22);
    ctx.stroke();

    if (isP2) {
      ctx.strokeStyle = lightningCol;
      ctx.lineWidth = isP3 ? 2.4 : 1.7;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.05);
      ctx.lineTo(-r * 0.35, r * 0.08);
      ctx.lineTo(-r * 0.16, r * 0.28);
      ctx.moveTo(r * 0.65, -r * 0.05);
      ctx.lineTo(r * 0.35, r * 0.1);
      ctx.lineTo(r * 0.16, r * 0.28);
      ctx.stroke();
    }

    // Pauldron thunder shoulder plates
    for (let side of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#0F172A";
      ctx.strokeStyle = lightningCol;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.55, -r * 0.55);
      ctx.lineTo(side * r * 1.18, -r * 0.35);
      ctx.lineTo(side * r * 0.92, r * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Golden Lightning Chest Core
    drawFourPointStar(ctx, 0, r * 0.16, r * 0.36, r * 0.13, lightningCol, stormBlue);

    // Jagged Twin Golden Kabuto Lightning Horns
    for (let side of [-1, 1]) {
      ctx.strokeStyle = lightningCol;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.28, -r * 0.62);
      ctx.lineTo(side * r * 0.72, -r * 1.05);
      ctx.lineTo(side * r * 0.48, -r * 1.25);
      ctx.lineTo(side * r * 0.85, -r * 1.56);
      ctx.stroke();
    }

    // Fierce Glowing Eyes + luminous pupils
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.22, 6.2, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.22, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.22, 4.0, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.22, 4.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (wave === 21) {
    // -----------------------------------------------------------------
    // WAVE 21: Độc Long Ác Ma — Abyssal Venom Wyrm
    // -----------------------------------------------------------------
    let acidCol = isMono ? "#FFFFFF" : isP3 ? "#D9F99D" : "#A3E635";
    let scaleDark = isMono ? "#111111" : "#052E16";
    let scaleMid = isMono ? "#333333" : "#15803D";

    // 1. Articulated 6-Segment Serpentine Wyrm Tail trailing opposite facing
    ctx.save();
    let tailBaseAng = facing + Math.PI;
    ctx.rotate(tailBaseAng);
    let prevX = r * 0.45;
    let prevY = 0;
    for (let seg = 1; seg <= 6; seg++) {
      let segX = r * 0.45 + seg * (r * 0.3);
      let segY = Math.sin(t * 5.6 - seg * 0.9) * (6 + seg * 3.2);
      let segR = r * (0.44 - seg * 0.048);
      ctx.strokeStyle = acidCol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(segX, segY);
      ctx.stroke();

      ctx.fillStyle = seg % 2 === 0 ? scaleDark : scaleMid;
      ctx.strokeStyle = acidCol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(segX, segY, segR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (seg === 6) {
        // Barbed stinger tail tip
        ctx.fillStyle = acidCol;
        ctx.beginPath();
        ctx.moveTo(segX, segY - segR * 0.8);
        ctx.lineTo(segX + 20, segY);
        ctx.lineTo(segX, segY + segR * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      prevX = segX;
      prevY = segY;
    }
    ctx.restore();

    // 2. Sweeping Membrane Toxic Wyrm Wings
    let flap = Math.sin(t * 6.2) * 0.22 + windupRatio * 0.32;
    for (let side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * r * 0.45, -r * 0.1);
      ctx.rotate(side * (0.28 + flap));
      let wingGrad = ctx.createLinearGradient(0, 0, side * r * 1.45, -r * 0.8);
      wingGrad.addColorStop(0, scaleDark);
      wingGrad.addColorStop(0.65, scaleMid);
      wingGrad.addColorStop(1, isMono ? "#AAAAAA" : "rgba(163, 230, 53, 0.72)");
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = acidCol;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * r * 1.55, -r * 1.05);
      ctx.lineTo(side * r * 1.2, -r * 0.15);
      ctx.lineTo(side * r * 1.38, r * 0.35);
      ctx.lineTo(side * r * 0.75, r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Wing vein ribs
      ctx.strokeStyle = acidCol;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * r * 1.2, -r * 0.15);
      ctx.moveTo(0, 0);
      ctx.lineTo(side * r * 1.38, r * 0.35);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Armored Draconic Carapace + Phase 2/3 caustic fractures
    let bodyGrad = ctx.createRadialGradient(-r * 0.24, -r * 0.28, 5, 0, 0, r);
    bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#555555" : "#22C55E");
    bodyGrad.addColorStop(0.55, hit ? "#CBD5E1" : scaleMid);
    bodyGrad.addColorStop(1, hit ? "#CBD5E1" : scaleDark);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = acidCol;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(217, 249, 157, 0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, -Math.PI * 0.82, -Math.PI * 0.2);
    ctx.stroke();

    if (isP2) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#ECFCCB";
      ctx.lineWidth = isP3 ? 2.4 : 1.7;
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, -r * 0.55);
      ctx.lineTo(-r * 0.18, -r * 0.2);
      ctx.lineTo(-r * 0.3, r * 0.12);
      ctx.moveTo(r * 0.42, -r * 0.55);
      ctx.lineTo(r * 0.18, -r * 0.2);
      ctx.lineTo(r * 0.3, r * 0.12);
      ctx.stroke();
    }

    // 4. Pulsing Caustic Bio-Sacs on shoulders & chest
    let sacPulse = 0.88 + 0.18 * Math.sin(t * 7);
    for (let sac of [
      { x: 0, y: r * 0.24, rad: r * 0.34 },
      { x: -r * 0.48, y: -r * 0.08, rad: r * 0.2 },
      { x: r * 0.48, y: -r * 0.08, rad: r * 0.2 },
    ]) {
      ctx.fillStyle = acidCol;
      ctx.beginPath();
      ctx.arc(sac.x, sac.y, sac.rad * sacPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ECFCCB";
      ctx.beginPath();
      ctx.arc(sac.x, sac.y, sac.rad * 0.42 * sacPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swept Bone-Obsidian Horns & Glowing Fangs
    for (let side of [-1, 1]) {
      ctx.fillStyle = isMono ? "#FFFFFF" : "#D9F99D";
      ctx.strokeStyle = scaleDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.3, -r * 0.65);
      ctx.quadraticCurveTo(side * r * 0.9, -r * 1.2, side * r * 0.65, -r * 1.48);
      ctx.quadraticCurveTo(side * r * 0.45, -r * 1.05, side * r * 0.14, -r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Venomous eyes + sharp pupils
    ctx.fillStyle = isMono ? "#FFFFFF" : "#A3E635";
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.3, 6.0, 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.3, 6.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.3, 3.6, 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.3, 3.6, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (wave === 24) {
    // -----------------------------------------------------------------
    // WAVE 24: Huyết Ma Bá Chủ — Crimson Blood Sovereign
    // -----------------------------------------------------------------
    let roseRim = isMono ? "#FFFFFF" : "#FDA4AF";
    let crimsonBright = isMono ? "#666666" : "#F43F5E";
    let crimsonDark = isMono ? "#111111" : "#4C0519";
    let hover = Math.sin(t * 3.2) * 4;

    ctx.save();
    ctx.translate(0, hover);

    // 1. Multi-Fold Billowing Crimson Vampire Cloak
    let cloakFlap = Math.sin(t * 4.8) * 0.12 + windupRatio * 0.25;
    for (let side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * cloakFlap);
      let cGrad = ctx.createLinearGradient(0, -r * 0.4, side * r * 1.7, r * 0.9);
      cGrad.addColorStop(0, crimsonDark);
      cGrad.addColorStop(0.6, isMono ? "#333333" : "#881337");
      cGrad.addColorStop(1, crimsonBright);
      ctx.fillStyle = cGrad;
      ctx.strokeStyle = roseRim;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.25);
      ctx.lineTo(side * r * 1.65, -r * 1.15);
      ctx.lineTo(side * r * 1.32, -r * 0.1);
      ctx.lineTo(side * r * 1.52, r * 0.62);
      ctx.lineTo(side * r * 0.85, r * 0.95);
      ctx.lineTo(side * r * 0.35, r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Orbiting Ruby Blood-Crystal Shards (6 in Phase 2/3, 4 in Phase 1)
    let shardCount = isP2 ? 6 : 4;
    for (let i = 0; i < shardCount; i++) {
      let ang = -t * 2.1 + ((Math.PI * 2) / shardCount) * i;
      let sx = Math.cos(ang) * r * 1.45;
      let sy = Math.sin(ang) * r * 1.15 - r * 0.1;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = isMono ? "#FFFFFF" : "#E11D48";
      ctx.strokeStyle = "#FEF08A";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(5.5, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-5.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Shattered Blood-Moon Crescent Halo behind Crown
    ctx.strokeStyle = crimsonBright;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, -r * 0.32, r * 1.02, 0.28, Math.PI - 0.28, true);
    ctx.stroke();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 4. Crimson-Obsidian Vampire Sovereign Armor
    let bodyGrad = ctx.createRadialGradient(-r * 0.22, -r * 0.24, 5, 0, 0, r * 0.94);
    bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#555555" : "#FB7185");
    bodyGrad.addColorStop(0.45, hit ? "#CBD5E1" : isMono ? "#333333" : "#BE123C");
    bodyGrad.addColorStop(1, hit ? "#CBD5E1" : crimsonDark);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = roseRim;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(255, 228, 230, 0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, -Math.PI * 0.84, -Math.PI * 0.2);
    ctx.stroke();

    if (isP2) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDA4AF";
      ctx.lineWidth = isP3 ? 2.4 : 1.7;
      ctx.beginPath();
      ctx.moveTo(-r * 0.58, -r * 0.14);
      ctx.lineTo(-r * 0.28, r * 0.08);
      ctx.lineTo(-r * 0.42, r * 0.42);
      ctx.moveTo(r * 0.58, -r * 0.14);
      ctx.lineTo(r * 0.28, r * 0.08);
      ctx.lineTo(r * 0.42, r * 0.42);
      ctx.stroke();
    }

    // Beating Ruby Heartstone Core
    let beat = 1 + 0.24 * Math.pow(Math.abs(Math.sin(t * 4.2)), 4);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F43F5E";
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.04 - 11 * beat);
    ctx.lineTo(9 * beat, r * 0.04);
    ctx.lineTo(0, r * 0.04 + 13 * beat);
    ctx.lineTo(-9 * beat, r * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sovereign Crown Spires & Glowing Eyes
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.65);
    ctx.lineTo(-r * 0.28, -r * 1.05);
    ctx.lineTo(-r * 0.1, -r * 0.78);
    ctx.lineTo(0, -r * 1.2);
    ctx.lineTo(r * 0.1, -r * 0.78);
    ctx.lineTo(r * 0.28, -r * 1.05);
    ctx.lineTo(r * 0.42, -r * 0.65);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#F43F5E";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, 6.2, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.25, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, 3.6, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.25, 3.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // -----------------------------------------------------------------
  // WAVE 27 FINAL BOSS: Thiên Thần Sa Ngã Lucifer — Six-Winged Seraphim
  // -----------------------------------------------------------------
  let gold = isMono ? "#FFFFFF" : "#FBBF24";
  let crim = isMono ? "#444444" : "#DC2626";
  let indigo = isMono ? "#111111" : "#1E1B4B";
  let hover = Math.sin(t * 2.8) * 5.5;

  ctx.save();
  ctx.translate(0, hover);

  // 1. Dual Counter-Rotating 12-Sigil Apocalypse Judgment Rings
  ctx.save();
  ctx.rotate(t * (isP3 ? 1.55 : 0.9));
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.74, 0, Math.PI * 2);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 7, 4, 7]);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let g = 0; g < 12; g++) {
    let p = ((Math.PI * 2) / 12) * g;
    let hx = Math.cos(p) * r * 1.74;
    let hy = Math.sin(p) * r * 1.74;
    drawFourPointStar(ctx, hx, hy, g % 2 === 0 ? 7.5 : 5.2, 2.2, g % 2 === 0 ? gold : crim);
  }
  ctx.restore();

  ctx.save();
  ctx.rotate(-t * (isP3 ? 1.9 : 1.15));
  ctx.strokeStyle = isMono ? "#AAAAAA" : "rgba(220, 38, 38, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let sa = ((Math.PI * 2) / 6) * i;
    let sx = Math.cos(sa) * r * 1.42;
    let sy = Math.sin(sa) * r * 1.42;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 2. Six Articulated Layered Seraphim Wings (3 pairs per side!)
  let wingSpreadBoost = windupRatio * 0.38 + (isP3 ? 0.16 : 0);
  for (let side of [-1, 1]) {
    for (let idx = 0; idx < 3; idx++) {
      let scale = 0.72 + idx * 0.28;
      let wy = -r * 0.4 + idx * r * 0.28;
      let flap = Math.sin(t * 4.4 + idx * 1.15) * 0.18;
      ctx.save();
      ctx.translate(side * r * 0.52, wy);
      ctx.rotate(side * (0.42 * scale + wingSpreadBoost + flap));

      let wGrad = ctx.createLinearGradient(0, 0, side * r * 1.65 * scale, -r * 1.05 * scale);
      if (idx === 0) {
        // Upper Seraph Gold Wings
        wGrad.addColorStop(0, isMono ? "#222222" : "#78350F");
        wGrad.addColorStop(0.65, isMono ? "#666666" : "#F59E0B");
        wGrad.addColorStop(1, "#FEF08A");
      } else if (idx === 1) {
        // Middle Twilight Amethyst Wings
        wGrad.addColorStop(0, isMono ? "#111111" : "#1E1B4B");
        wGrad.addColorStop(0.7, isMono ? "#444444" : "#6D28D9");
        wGrad.addColorStop(1, isMono ? "#FFFFFF" : "#C084FC");
      } else {
        // Lower Abyssal Crimson Blade-Wings
        wGrad.addColorStop(0, "#09090B");
        wGrad.addColorStop(0.65, isMono ? "#333333" : "#991B1B");
        wGrad.addColorStop(1, isMono ? "#FFFFFF" : "#EF4444");
      }

      ctx.fillStyle = wGrad;
      ctx.strokeStyle = idx === 0 ? gold : idx === 1 ? (isMono ? "#FFFFFF" : "#A855F7") : crim;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * r * 1.65 * scale, -r * 1.12 * scale);
      ctx.lineTo(side * r * 1.32 * scale, -r * 0.28 * scale);
      ctx.lineTo(side * r * 1.48 * scale, r * 0.18);
      ctx.lineTo(side * r * 0.95 * scale, r * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Feather vane ribs
      ctx.strokeStyle = idx === 0 ? "#FEF08A" : crim;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * r * 1.32 * scale, -r * 0.28 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Fallen Seraph Royal Celestial-Obsidian Armor Body
  let bodyGrad = ctx.createRadialGradient(-r * 0.24, -r * 0.26, 6, 0, 0, r);
  bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#555555" : "#4F46E5");
  bodyGrad.addColorStop(0.5, hit ? "#CBD5E1" : isMono ? "#2B2B2B" : "#312E81");
  bodyGrad.addColorStop(1, hit ? "#CBD5E1" : indigo);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.5)" : "rgba(254, 240, 138, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.87, -Math.PI * 0.84, -Math.PI * 0.18);
  ctx.stroke();

  // Phase 2/3 Celestial Apocalypse Fissures
  if (isP2) {
    ctx.strokeStyle = isP3 ? crim : gold;
    ctx.lineWidth = isP3 ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.moveTo(-r * 0.66, -r * 0.15);
    ctx.lineTo(-r * 0.38, r * 0.05);
    ctx.lineTo(-r * 0.52, r * 0.42);
    ctx.moveTo(r * 0.66, -r * 0.15);
    ctx.lineTo(r * 0.38, r * 0.05);
    ctx.lineTo(r * 0.52, r * 0.42);
    ctx.stroke();
  }

  // Crossed Apocalypse Armor Plate + Beating Eclipse Eye Core
  ctx.strokeStyle = crim;
  ctx.lineWidth = 2.8;
  ctx.strokeRect(-r * 0.44, -r * 0.44, r * 0.88, r * 0.88);
  let eyePulse = 0.88 + 0.18 * Math.sin(t * 7);
  ctx.fillStyle = isMono ? "#000000" : "#09090B";
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r * 0.24 * eyePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawFourPointStar(ctx, 0, r * 0.08, r * 0.22 * eyePulse, r * 0.08, crim, "#FEF08A");

  // Twin Curved Obsidian Seraph Horns & Shattered Crown Halo
  for (let side of [-1, 1]) {
    ctx.fillStyle = "#09090B";
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.34, -r * 0.68);
    ctx.quadraticCurveTo(side * r * 0.95, -r * 1.05, side * r * 0.72, -r * 1.56);
    ctx.quadraticCurveTo(side * r * 0.56, -r * 1.05, side * r * 0.2, -r * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Shattered rotating golden halo crown
  ctx.save();
  ctx.translate(0, -r * 1.2);
  ctx.strokeStyle = "#FEF08A";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.64, r * 0.22, 0, 0.25, Math.PI * 1.85);
  ctx.stroke();
  drawFourPointStar(ctx, 0, 0, 8.5, 2.7, gold, crim);
  ctx.restore();

  // Piercing Seraph Eyes + luminous glints
  ctx.fillStyle = isP3 ? "#EF4444" : "#F59E0B";
  ctx.fillRect(-r * 0.36, -r * 0.34, 11, 6.2);
  ctx.fillRect(r * 0.16, -r * 0.34, 11, 6.2);
  ctx.fillStyle = "#FEF08A";
  ctx.fillRect(-r * 0.34, -r * 0.32, 7.5, 3.2);
  ctx.fillRect(r * 0.18, -r * 0.32, 7.5, 3.2);

  ctx.restore();
}

// =====================================================================
// THIÊN – ĐẤNG SÁNG THẾ CELESTIAL VFX RENDERERS (ZERO shadowBlur)
// =====================================================================

export function drawThienSwords(ctx, swords, elapsedTime, isMono) {
  if (!Array.isArray(swords) || swords.length === 0) return;
  for (let sw of swords) {
    if (!sw) continue;
    ctx.save();
    // Dual-layer luminous celestial flight trail
    if (Array.isArray(sw.trail) && sw.trail.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < sw.trail.length; i++) {
        let pt = sw.trail[i];
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.38)" : sw.phase === "return" ? "rgba(250,204,21,0.42)" : "rgba(56,189,248,0.45)";
      ctx.lineWidth = 6.2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.strokeStyle = isMono ? "#FFFFFF" : sw.phase === "return" ? "#FEF08A" : "#E0F2FE";
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    ctx.translate(sw.x, sw.y);
    ctx.rotate(sw.angle || 0);

    let auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 23);
    auraGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.85)" : "rgba(250,204,21,0.72)");
    auraGrad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.28)" : "rgba(56,189,248,0.42)");
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();

    // Ornate celestial sword silhouette + crossguard wings
    ctx.fillStyle = isMono ? "#E2E8F0" : "#FACC15";
    ctx.beginPath();
    ctx.moveTo(-6, -8.5);
    ctx.lineTo(-2, -3.5);
    ctx.lineTo(-2, 3.5);
    ctx.lineTo(-6, 8.5);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = isMono ? "#000000" : "#FACC15";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-4, -4.8);
    ctx.lineTo(15, -2.6);
    ctx.lineTo(26, 0);
    ctx.lineTo(15, 2.6);
    ctx.lineTo(-4, 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cosmic core rib & pommel star
    ctx.strokeStyle = isMono ? "#000000" : "#38BDF8";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    drawFourPointStar(ctx, -5, 0, 5.2, 1.8, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    ctx.restore();
  }
}

export function drawThienTimeZone(ctx, zones, elapsedTime, isMono) {
  if (!Array.isArray(zones) || zones.length === 0) return;
  for (let z of zones) {
    if (!z) continue;
    let r = z.radius || 220;
    let storedRatio = clamp((z.storedDamage || 0) / 1200, 0, 1);
    let fade = clamp((z.life || 1) / Math.max(0.1, z.maxLife || 3.5), 0, 1);

    ctx.save();
    ctx.translate(z.x, z.y);

    // Translucent cosmic-gold chronosphere field
    let grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    grad.addColorStop(0, isMono ? "rgba(255,255,255,0.2)" : `rgba(56, 189, 248, ${0.18 + storedRatio * 0.2})`);
    grad.addColorStop(0.68, isMono ? "rgba(255,255,255,0.1)" : `rgba(250, 204, 21, ${0.15 + storedRatio * 0.16})`);
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Rotating outer celestial astrolabe ring + zodiac gear teeth
    ctx.save();
    ctx.rotate(elapsedTime * 0.85);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.8;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(56, 189, 248, 0.52)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.91, 0, Math.PI * 2);
    ctx.stroke();
    for (let gi = 0; gi < 4; gi++) {
      let ga = (Math.PI / 2) * gi;
      drawFourPointStar(ctx, Math.cos(ga) * r * 0.91, Math.sin(ga) * r * 0.91, 7.5, 2.2, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    }
    ctx.restore();

    // Inner gold dial ring + 12 clock ticks + cosmic starlight hexagram
    ctx.save();
    ctx.rotate(-elapsedTime * 0.55);
    ctx.strokeStyle = isMono ? "#E5E7EB" : "#FACC15";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      let a = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
      ctx.lineTo(Math.cos(a) * r * 0.77, Math.sin(a) * r * 0.77);
      ctx.stroke();
    }
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.34)" : "rgba(254, 240, 138, 0.38)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let hi = 0; hi < 6; hi++) {
      let ha = (Math.PI / 3) * hi;
      let hx = Math.cos(ha) * r * 0.52, hy = Math.sin(ha) * r * 0.52;
      hi === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Animated clock hands showing stored temporal reversal
    let handA1 = elapsedTime * 2.4;
    let handA2 = -elapsedTime * 1.1;
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handA1) * r * 0.55, Math.sin(handA1) * r * 0.55);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handA2) * r * 0.36, Math.sin(handA2) * r * 0.36);
    ctx.stroke();

    // Remaining duration / charge ring + center chronos star
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * fade);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 10, 3, "#FFFFFF", isMono ? "#333333" : "#38BDF8");

    ctx.restore();
  }
}

export function drawThienSpatialPortal(ctx, portals, elapsedTime, isMono) {
  if (!Array.isArray(portals) || portals.length === 0) return;
  for (let pt of portals) {
    if (!pt) continue;
    let r = pt.radius || 46;
    let pulse = 1 + Math.sin(elapsedTime * 7) * 0.08;
    ctx.save();
    ctx.translate(pt.x, pt.y);

    let grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r * pulse * 1.15);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.35, isMono ? "#D4D4D8" : "#38BDF8");
    grad.addColorStop(0.72, isMono ? "#52525B" : "rgba(250, 204, 21, 0.48)");
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(elapsedTime * 3.1);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.6;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let si = 0; si < 4; si++) {
      let sa = (Math.PI / 2) * si;
      drawFourPointStar(ctx, Math.cos(sa) * r * 0.86, Math.sin(sa) * r * 0.86, 5.5, 1.8, "#FFFFFF", isMono ? "#333333" : "#38BDF8");
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(-elapsedTime * 4.2);
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let a = (Math.PI * 0.5) * i;
      ctx.arc(0, 0, r * 0.52, a, a + 0.72);
    }
    ctx.stroke();
    ctx.restore();

    drawFourPointStar(ctx, 0, 0, 14, 4.0, "#FFFFFF", isMono ? "#333333" : "#38BDF8");
    ctx.restore();
  }
}

export function drawThienSunJudgement(ctx, suns, elapsedTime, isMono) {
  if (!Array.isArray(suns) || suns.length === 0) return;
  for (let sn of suns) {
    if (!sn) continue;
    let r = sn.radius || 340;
    let lifeRatio = clamp((sn.life || 0) / Math.max(0.1, sn.maxLife || 1.65), 0, 1);
    let expand = clamp(1 - lifeRatio, 0, 1);

    ctx.save();
    ctx.translate(sn.x, sn.y);

    // Wide ground solar judgement scorch + cosmic shockwave
    let groundGrad = ctx.createRadialGradient(0, 0, 14, 0, 0, r);
    groundGrad.addColorStop(0, isMono ? `rgba(255,255,255,${0.65 * lifeRatio})` : `rgba(255, 255, 255, ${0.58 * lifeRatio})`);
    groundGrad.addColorStop(0.35, isMono ? `rgba(220,220,220,${0.36 * lifeRatio})` : `rgba(250, 204, 21, ${0.46 * lifeRatio})`);
    groundGrad.addColorStop(0.75, isMono ? `rgba(180,180,180,${0.2 * lifeRatio})` : `rgba(56, 189, 248, ${0.28 * lifeRatio})`);
    groundGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Expanding shockwave rings + radial divine judgement rays
    ctx.strokeStyle = isMono ? `rgba(255,255,255,${lifeRatio})` : `rgba(250, 204, 21, ${0.92 * lifeRatio})`;
    ctx.lineWidth = 5.4 * lifeRatio + 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.28 + expand * 0.72), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? `rgba(255,255,255,${lifeRatio * 0.72})` : `rgba(56, 189, 248, ${0.88 * lifeRatio})`;
    ctx.lineWidth = 3.2;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.15 + expand * 0.82), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = isMono ? `rgba(255,255,255,${0.48 * lifeRatio})` : `rgba(254, 240, 138, ${0.55 * lifeRatio})`;
    ctx.lineWidth = 2.0;
    for (let ri = 0; ri < 8; ri++) {
      let ra = (Math.PI / 4) * ri + elapsedTime * 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * r * 0.2, Math.sin(ra) * r * 0.2);
      ctx.lineTo(Math.cos(ra) * r * (0.55 + 0.4 * expand), Math.sin(ra) * r * (0.55 + 0.4 * expand));
      ctx.stroke();
    }

    // Vertical orbital beam descending from the Energy Sun + concentric descent rings
    let beamHalfW = (56 + Math.sin(elapsedTime * 28) * 6) * lifeRatio;
    if (beamHalfW > 2) {
      let beamGrad = ctx.createLinearGradient(-beamHalfW, 0, beamHalfW, 0);
      beamGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
      beamGrad.addColorStop(0.25, isMono ? "rgba(255,255,255,0.55)" : "rgba(56, 189, 248, 0.58)");
      beamGrad.addColorStop(0.5, "#FFFFFF");
      beamGrad.addColorStop(0.75, isMono ? "rgba(255,255,255,0.55)" : "rgba(250, 204, 21, 0.68)");
      beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(-beamHalfW, -320, beamHalfW * 2, 320);

      for (let hi = 0; hi < 3; hi++) {
        let hy = -30 - hi * 58 + (elapsedTime * 160) % 58;
        ctx.strokeStyle = isMono ? "#FFFFFF" : hi % 2 === 0 ? "#FEF08A" : "#67E8F9";
        ctx.lineWidth = 2.2 * lifeRatio;
        ctx.beginPath();
        ctx.ellipse(0, hy, beamHalfW * 1.15, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Hovering Energy Sun Orb above impact with blazing corona flare rays
      let sunY = -170 - (1 - lifeRatio) * 35;
      let sunR = 48 * (0.65 + lifeRatio * 0.5);
      let sunGrad = ctx.createRadialGradient(0, sunY, 4, 0, sunY, sunR * 1.6);
      sunGrad.addColorStop(0, "#FFFFFF");
      sunGrad.addColorStop(0.45, isMono ? "#E2E8F0" : "#FDE047");
      sunGrad.addColorStop(0.8, isMono ? "#64748B" : "#F59E0B");
      sunGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(0, sunY, sunR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(0, sunY);
      ctx.rotate(elapsedTime * 1.8);
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 2.4;
      for (let ci = 0; ci < 12; ci++) {
        let ca = (Math.PI / 6) * ci;
        let rayLen = ci % 2 === 0 ? sunR * 1.48 : sunR * 1.15;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ca) * sunR * 0.72, Math.sin(ca) * sunR * 0.72);
        ctx.lineTo(Math.cos(ca) * rayLen, Math.sin(ca) * rayLen);
        ctx.stroke();
      }
      ctx.restore();

      drawFourPointStar(ctx, 0, sunY, sunR * 1.25, sunR * 0.32, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    }

    ctx.restore();
  }
}

export function drawThanhSpiritSnakes(ctx, snakes, elapsedTime, isMono) {
  if (!snakes || snakes.length === 0) return;
  for (let sn of snakes) {
    let sx = sn.x;
    let sy = sn.y;
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
    let ang = sn.angle || 0;
    let ratio = sn.maxLife > 0 ? clamp(1 - sn.life / sn.maxLife, 0, 1) : 1;
    let col = isMono ? "#FFFFFF" : sn.isCompanion ? "#C084FC" : "#34D399";
    let accent = isMono ? "#DDDDDD" : sn.isCompanion ? "#F3E8FF" : "#A7F3D0";
    let gold = isMono ? "#FFFFFF" : "#FDE047";

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    ctx.globalAlpha = 0.78 + 0.22 * ratio;

    // Aura glow (no shadowBlur)
    let glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    glow.addColorStop(0, accent);
    glow.addColorStop(0.5, isMono ? "rgba(255,255,255,0.34)" : sn.isCompanion ? "rgba(192,132,252,0.48)" : "rgba(52,211,153,0.5)");
    glow.addColorStop(1, "rgba(16,185,129,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Dark ink outline + undulating multi-segment spirit body
    ctx.lineCap = "round";
    ctx.strokeStyle = isMono ? "#000000" : "#042F2E";
    ctx.lineWidth = sn.isCompanion ? 5.8 : 6.4;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    for (let i = 1; i <= 8; i++) {
      let tx = 5 - i * 3.4;
      let ty = Math.sin(elapsedTime * 15 - i * 1.05 + (sn.idx || 0)) * 4.0 * (1 - i * 0.05);
      ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    ctx.strokeStyle = col;
    ctx.lineWidth = sn.isCompanion ? 3.5 : 4.2;
    ctx.stroke();

    // Inner bright venom spine
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Forked flicking serpent tongue
    let flick = 4 + Math.sin(elapsedTime * 22 + (sn.idx || 0)) * 2.5;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10 + flick, 0);
    ctx.lineTo(13 + flick, -2.5);
    ctx.moveTo(10 + flick, 0);
    ctx.lineTo(13 + flick, 2.5);
    ctx.stroke();

    // Horned viper head + slit eyes
    ctx.fillStyle = accent;
    ctx.strokeStyle = isMono ? "#000000" : "#042F2E";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-1.5, -5.6);
    ctx.lineTo(-3.8, -3.2);
    ctx.lineTo(1.2, 0);
    ctx.lineTo(-3.8, 3.2);
    ctx.lineTo(-1.5, 5.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(3.4, -1.7, 1.4, 0, Math.PI * 2);
    ctx.arc(3.4, 1.7, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawThanhDevourSerpents(ctx, serpents, elapsedTime, isMono) {
  if (!serpents || serpents.length === 0) return;
  for (let sp of serpents) {
    let p = sp.maxLife > 0 ? clamp(sp.life / sp.maxLife, 0, 1) : 0;
    let alpha = p < 0.18 ? p / 0.18 : clamp(1 - (p - 0.18) / 0.82, 0, 1);
    let r = sp.radius || 140;
    let surgeY = Math.sin(Math.min(1, p * 1.5) * Math.PI) * 44;

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.globalAlpha = alpha;

    // Ground summon magic seal + rotating hexagonal fang rune circle
    let sealGrad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    sealGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.52)" : "rgba(16, 185, 129, 0.56)");
    sealGrad.addColorStop(0.62, isMono ? "rgba(200,200,200,0.24)" : "rgba(147, 51, 234, 0.34)");
    sealGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(elapsedTime * 2.2);
    ctx.strokeStyle = isMono ? "#E5E5E5" : "#C084FC";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(167, 243, 208, 0.52)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let hi = 0; hi < 6; hi++) {
      let ha = (Math.PI / 3) * hi;
      let hx = Math.cos(ha) * r * 0.68, hy = Math.sin(ha) * r * 0.68;
      hi === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Giant Mãng Xà twin abyssal jaws erupting from center
    ctx.save();
    ctx.translate(0, -surgeY);
    let jawOpen = Math.max(0.14, 1 - Math.abs(p - 0.36) * 2.15);
    let col = isMono ? "#FFFFFF" : "#10B981";
    let fang = isMono ? "#EEEEEE" : "#FDE047";

    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#DDDDDD" : "#064E3B";
      ctx.strokeStyle = col;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(-42, s * 11 * jawOpen);
      ctx.quadraticCurveTo(0, s * (50 * jawOpen + 16), 52, s * 7 * jawOpen);
      ctx.lineTo(24, s * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Scale crest trim
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#A78BFA";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(-26, s * (16 * jawOpen + 6));
      ctx.quadraticCurveTo(6, s * (34 * jawOpen + 10), 36, s * (10 * jawOpen + 4));
      ctx.stroke();

      // Primary + secondary razor fangs
      ctx.fillStyle = fang;
      for (let fx of [34, 18, 2]) {
        ctx.beginPath();
        ctx.moveTo(fx, s * (17 * jawOpen));
        ctx.lineTo(fx + 7, s * (3.5 * jawOpen));
        ctx.lineTo(fx - 5, s * (12 * jawOpen));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Blazing serpent slit eyes & center devour star
    ctx.fillStyle = isMono ? "#FFFFFF" : "#A7F3D0";
    ctx.beginPath();
    ctx.ellipse(-10, -16 * jawOpen - 7, 5.8, 3.3, -0.35, 0, Math.PI * 2);
    ctx.ellipse(-10, 16 * jawOpen + 7, 5.8, 3.3, 0.35, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, 18, 0, 14 * (1 - jawOpen * 0.4), 3.6, "#FFFFFF", isMono ? "#333333" : "#C084FC");

    ctx.restore();
    ctx.restore();
  }
}

export function drawNhiPoisonTethers(ctx, zones, tethers, elapsedTime, isMono) {
  if (!tethers || tethers.length === 0) return;
  for (let pair of tethers) {
    let a = pair.a || (zones ? zones[pair.i] : null);
    let b = pair.b || (zones ? zones[pair.j] : null);
    if (!a || !b) continue;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 4) continue;
    let nx = -dy / dist;
    let ny = dx / dist;

    ctx.save();
    ctx.lineCap = "round";

    // Outer toxic energy halo
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(192, 132, 252, 0.52)";
    ctx.lineWidth = 10.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let s = 1; s <= 12; s++) {
      let t = s / 12;
      let wave = Math.sin(t * Math.PI * 4 - elapsedTime * 11) * 8.5;
      ctx.lineTo(a.x + dx * t + nx * wave, a.y + dy * t + ny * wave);
    }
    ctx.stroke();

    // Inner bright venom core + counter-phase emerald helix
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.lineWidth = 3.0;
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#CCCCCC" : "#E879F9";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let s = 1; s <= 12; s++) {
      let t = s / 12;
      let wave = -Math.sin(t * Math.PI * 4 - elapsedTime * 11) * 7.0;
      ctx.lineTo(a.x + dx * t + nx * wave, a.y + dy * t + ny * wave);
    }
    ctx.stroke();

    // Flowing reagent droplets along tether + star nodes at zone centers
    for (let d = 0; d < 4; d++) {
      let prog = ((elapsedTime * 0.95 + d / 4) % 1);
      let wave = Math.sin(prog * Math.PI * 4 - elapsedTime * 11) * 8.5;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(a.x + dx * prog + nx * wave, a.y + dy * prog + ny * wave, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFourPointStar(ctx, a.x, a.y, 7.5, 2.2, "#FFFFFF", isMono ? "#333333" : "#C084FC");
    drawFourPointStar(ctx, b.x, b.y, 7.5, 2.2, "#FFFFFF", isMono ? "#333333" : "#4ADE80");

    ctx.restore();
  }
}

export function drawNhiToxicMist(ctx, mists, elapsedTime, isMono) {
  if (!mists || mists.length === 0) return;
  for (let m of mists) {
    let ratio = m.maxLife > 0 ? clamp(1 - m.timer / m.maxLife, 0, 1) : 1;
    let fade = m.timer < 0.25 ? m.timer / 0.25 : ratio < 0.25 ? ratio / 0.25 : 1;
    let r = m.radius || 165;
    let elixir = m.elixir || "purple";
    let mainCol = isMono
      ? "rgba(255,255,255,"
      : elixir === "green"
      ? "rgba(74, 222, 128,"
      : elixir === "life"
      ? "rgba(45, 212, 191,"
      : "rgba(192, 132, 252,";
    let secCol = isMono ? "#CBD5E1" : elixir === "green" ? "#4ADE80" : elixir === "life" ? "#2DD4BF" : "#E879F9";

    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.globalAlpha = fade * 0.9;

    let grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    grad.addColorStop(0, mainCol + "0.42)");
    grad.addColorStop(0.6, mainCol + "0.24)");
    grad.addColorStop(1, mainCol + "0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Drifting billowing toxic spore clouds & swirling mist arcs
    for (let p = 0; p < 5; p++) {
      let pa = (Math.PI * 2 / 5) * p + elapsedTime * 0.55;
      let pr = r * 0.52;
      ctx.fillStyle = mainCol + "0.16)";
      ctx.beginPath();
      ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }

    // Popping toxic bubbles with white specular glints + elixir sparkles
    for (let bi = 0; bi < 7; bi++) {
      let bPh = (elapsedTime * 0.7 + bi * 0.14) % 1;
      let ba = (Math.PI * 2 / 7) * bi - elapsedTime * 0.45;
      let br = r * (0.24 + 0.58 * bPh);
      let bx = Math.cos(ba) * br, by = Math.sin(ba) * br;
      let bSize = 3 + Math.sin(bPh * Math.PI) * 4;
      ctx.strokeStyle = secCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(bx, by, bSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(bx - bSize * 0.32, by - bSize * 0.32, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = mainCol + "0.74)";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([12, 8]);
    ctx.rotate(elapsedTime * 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

// =====================================================================
// DŨNG YÊU SANY — SIGMA WIBU THREE-HEADED CERBERUS ULTIMATE RENDERERS
// =====================================================================

function drawSingleCerberusHead(ctx, {
  x = 0,
  y = 0,
  scale = 1,
  tilt = 0,
  side = 0, // -1 left cyan-frost wolf, 0 center imperial gold-alpha wolf, 1 right crimson-void wolf
  jawOpen = 0.25,
  elapsedTime = 0,
  isMono = false,
  eyeTrailScale = 1,
}) {
  const furDark = isMono
    ? "#18181B"
    : side === 0
    ? "#0F172A"
    : side < 0
    ? "#082F49"
    : "#2E072D";
  const furMid = isMono
    ? "#3F3F46"
    : side === 0
    ? "#1E293B"
    : side < 0
    ? "#0C4A6E"
    : "#4C0519";
  const rimCol = isMono
    ? "#FFFFFF"
    : side === 0
    ? "#FDE047"
    : side < 0
    ? "#38BDF8"
    : "#FB7185";
  const eyeCol = isMono
    ? "#FFFFFF"
    : side === 0
    ? "#FEF08A"
    : side < 0
    ? "#67E8F9"
    : "#F43F5E";
  const maneCol = isMono
    ? "#71717A"
    : side === 0
    ? "#F59E0B"
    : side < 0
    ? "#0284C7"
    : "#9333EA";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);

  // 1. Spiked Sigma Wolf Mane & Shoulder Ruff
  ctx.fillStyle = maneCol;
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-22, -16);
  ctx.lineTo(-32, -26);
  ctx.lineTo(-14, -22);
  ctx.lineTo(-6, -33);
  ctx.lineTo(6, -33);
  ctx.lineTo(14, -22);
  ctx.lineTo(32, -26);
  ctx.lineTo(22, -16);
  ctx.lineTo(26, 2);
  ctx.lineTo(16, 16);
  ctx.lineTo(-16, 16);
  ctx.lineTo(-26, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Razor Wolf Ears (tall, swept back, glowing inner ear trim)
  for (let s of [-1, 1]) {
    ctx.fillStyle = furDark;
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(s * 9, -15);
    ctx.lineTo(s * 24, -40);
    ctx.lineTo(s * 21, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = eyeCol;
    ctx.beginPath();
    ctx.moveTo(s * 12, -16);
    ctx.lineTo(s * 21, -33);
    ctx.lineTo(s * 18, -14);
    ctx.closePath();
    ctx.fill();
  }

  // Alpha center head floating Sigma Thunder Crown
  if (side === 0) {
    let crownY = -36 + Math.sin(elapsedTime * 8) * 2.2;
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : "#F97316";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, crownY - 12);
    ctx.lineTo(5.5, crownY - 1);
    ctx.lineTo(14, crownY - 7);
    ctx.lineTo(9, crownY + 4);
    ctx.lineTo(-9, crownY + 4);
    ctx.lineTo(-14, crownY - 7);
    ctx.lineTo(-5.5, crownY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 3. Lower Jaw & Razor Fangs (articulates downward when roaring/attacking)
  let jawDrop = clamp(jawOpen, 0, 1) * 11.5;
  ctx.save();
  ctx.translate(0, jawDrop);
  ctx.fillStyle = furMid;
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 4);
  ctx.lineTo(-7, 22);
  ctx.lineTo(0, 26);
  ctx.lineTo(7, 22);
  ctx.lineTo(12, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner roaring abyss mouth + lower fangs
  ctx.fillStyle = isMono ? "#000000" : "#450A0A";
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(0, 21);
  ctx.lineTo(8, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  for (let f of [-5, 5]) {
    ctx.beginPath();
    ctx.moveTo(f - 2.2, 11);
    ctx.lineTo(f, 4);
    ctx.lineTo(f + 2.2, 11);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. Sculpted Angular Skull, Cheek Armor Plates & Snout
  ctx.fillStyle = furDark;
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(18, -14);
  ctx.lineTo(20, 1);
  ctx.lineTo(11, 14);
  ctx.lineTo(0, 19);
  ctx.lineTo(-11, 14);
  ctx.lineTo(-20, 1);
  ctx.lineTo(-18, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Upper snout bridge & gleaming fangs
  ctx.fillStyle = furMid;
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(8, -8);
  ctx.lineTo(10, 11);
  ctx.lineTo(0, 17);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  for (let f of [-6.5, 6.5]) {
    ctx.beginPath();
    ctx.moveTo(f - 2.4, 12);
    ctx.lineTo(f, 20);
    ctx.lineTo(f + 2.4, 12);
    ctx.closePath();
    ctx.fill();
  }

  // Forehead Sigma Lightning Mark
  ctx.strokeStyle = eyeCol;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-2, -18);
  ctx.lineTo(2, -12);
  ctx.lineTo(-2, -9);
  ctx.lineTo(2, -3);
  ctx.stroke();

  // 5. Fierce Slitted Anime Glowing Eyes + Trailing Eye-Flare Ribbons!
  for (let s of [-1, 1]) {
    ctx.fillStyle = eyeCol;
    ctx.beginPath();
    ctx.moveTo(s * 4.5, -2);
    ctx.lineTo(s * 13.5, -6.5);
    ctx.lineTo(s * 12, -1.5);
    ctx.lineTo(s * 5.5, 1.2);
    ctx.closePath();
    ctx.fill();

    // Sigma Anime Eye Light-Trail streaming outward
    if (eyeTrailScale > 0.1) {
      let trailLen = (16 + Math.sin(elapsedTime * 15 + s) * 3) * eyeTrailScale;
      ctx.strokeStyle = eyeCol;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(s * 12.5, -5.5);
      ctx.quadraticCurveTo(s * (14 + trailLen * 0.5), -11, s * (14 + trailLen), -6);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawDungCerberusForm(ctx, x, y, radius, facing, elapsedTime, opts = {}, isMono = false) {
  const atkActive = Boolean(opts.atkActive);
  const skillActive = Boolean(opts.skillActive);
  const berserkActive = Boolean(opts.berserkActive);
  const ratio = opts.ratio !== undefined ? clamp(opts.ratio, 0, 1) : 1;
  const fadeAlpha = ratio < 0.08 ? ratio / 0.08 : 1;

  ctx.save();
  ctx.globalAlpha = fadeAlpha;
  ctx.translate(x, y);

  // 1. Sigma Abyssal Lightning Runic Ground Aura (Imperial Gold + Cyan + Crimson)
  let auraR = radius * 2.95;
  let auraGrad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, auraR);
  auraGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.22)" : "rgba(253, 224, 71, 0.28)");
  auraGrad.addColorStop(0.5, isMono ? "rgba(0,0,0,0.12)" : berserkActive ? "rgba(244, 63, 94, 0.24)" : "rgba(56, 189, 248, 0.22)");
  auraGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Outer rotating Sigma rune gear ring
  ctx.save();
  ctx.rotate(elapsedTime * 2.4);
  ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
  ctx.lineWidth = 2.4;
  ctx.setLineDash([14, 7, 4, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, radius + 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 3; i++) {
    let a = (Math.PI * 2 / 3) * i;
    let ox = Math.cos(a) * (radius + 21);
    let oy = Math.sin(a) * (radius + 21);
    drawFourPointStar(ctx, ox, oy, 6.5, 2.0, i === 0 ? "#FDE047" : i === 1 ? "#38BDF8" : "#F43F5E", "#FFFFFF");
  }
  ctx.restore();

  // Counter-rotating obsidian-cyan hexagram frame
  ctx.save();
  ctx.rotate(-elapsedTime * 1.85);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(56, 189, 248, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i;
    let px = Math.cos(a) * (radius + 14);
    let py = Math.sin(a) * (radius + 14);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 2. Spectral Guardian Three-Headed Cerberus Manifestation Behind Dũng
  ctx.save();
  ctx.rotate(facing);
  let hover = Math.sin(elapsedTime * 6.5) * 3.2;
  let lunge = atkActive || skillActive ? 9 : 0;
  let jawAmt = atkActive || skillActive ? 0.85 : 0.25 + 0.14 * Math.sin(elapsedTime * 7);

  // Flowing broken abyssal demon chains / shadow-thunder mantle
  for (let s of [-1, 1]) {
    let whip = Math.sin(elapsedTime * 11 + s * 1.5) * 6;
    ctx.strokeStyle = isMono ? "#FFFFFF" : s < 0 ? "rgba(56, 189, 248, 0.72)" : "rgba(244, 63, 94, 0.72)";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, s * (radius * 0.8));
    ctx.quadraticCurveTo(-radius * 1.5, s * (radius * 1.3) + whip, -radius * 2.25, s * (radius * 0.9) - whip * 0.7);
    ctx.stroke();
  }

  // Dark spectral Cerberus shoulder silhouette behind player
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.45)" : "rgba(15, 23, 42, 0.68)";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.65 + lunge * 0.35, 0, radius * 0.85, radius * 1.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Three articulated Cerberus heads oriented forward along hero's facing (+90deg aligns upward head template -> +X facing!)
  const headConfigs = [
    { side: -1, ox: -radius * 0.35 + lunge * 0.7, oy: -radius * 1.15 - hover * 0.4, tilt: Math.PI / 2 - 0.34, sc: 0.56 },
    { side: 1, ox: -radius * 0.35 + lunge * 0.7, oy: radius * 1.15 + hover * 0.4, tilt: Math.PI / 2 + 0.34, sc: 0.56 },
    { side: 0, ox: -radius * 0.65 + lunge, oy: hover * 0.3, tilt: Math.PI / 2, sc: 0.72 },
  ];
  for (let hc of headConfigs) {
    drawSingleCerberusHead(ctx, {
      x: hc.ox,
      y: hc.oy,
      scale: hc.sc,
      tilt: hc.tilt,
      side: hc.side,
      jawOpen: jawAmt,
      elapsedTime,
      isMono,
      eyeTrailScale: atkActive || skillActive ? 1.35 : 0.9,
    });
  }
  ctx.restore();

  ctx.restore();
}

export function drawDungCerberusUlt(ctx, bursts, elapsedTime, isMono) {
  if (!Array.isArray(bursts) || bursts.length === 0) return;
  for (let b of bursts) {
    if (!b) continue;
    let maxL = Math.max(0.2, b.maxLife || 1.35);
    let p = clamp((b.life || 0) / maxL, 0, 1);
    let fadeOut = p > 0.72 ? clamp(1 - (p - 0.72) / 0.28, 0, 1) : 1;
    let appear = clamp(p / 0.16, 0, 1);
    let r = b.radius || 185;
    let surgeY = Math.sin(Math.min(1, p * 1.35) * Math.PI * 0.65) * 44;
    let scalePop = 0.65 + 0.55 * Math.sin(Math.min(1, p * 2.2) * Math.PI * 0.5);
    let roarJaw = p < 0.58 ? 0.45 + 0.55 * Math.sin(clamp(p / 0.58, 0, 1) * Math.PI) : 0.35;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = fadeOut;

    // 1. Abyssal Thunder Seal / Sigma Magic Circle on the arena floor
    let sealGrad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r * 1.12);
    sealGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.68)" : `rgba(253, 224, 71, ${0.58 * appear})`);
    sealGrad.addColorStop(0.38, isMono ? "rgba(180,180,180,0.4)" : `rgba(56, 189, 248, ${0.42 * appear})`);
    sealGrad.addColorStop(0.74, isMono ? "rgba(0,0,0,0.32)" : `rgba(147, 51, 234, ${0.32 * appear})`);
    sealGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2);
    ctx.fill();

    // Triple staggered expanding shockwaves
    for (let wi = 0; wi < 3; wi++) {
      let wp = clamp((p - wi * 0.08) / 0.65, 0, 1);
      if (wp <= 0 || wp >= 1) continue;
      let wr = r * (0.25 + wp * 0.92);
      ctx.strokeStyle = isMono
        ? "#FFFFFF"
        : wi === 0
        ? "#FDE047"
        : wi === 1
        ? "#38BDF8"
        : "#F43F5E";
      ctx.lineWidth = (7.5 - wi * 1.5) * (1 - wp) + 1;
      ctx.beginPath();
      ctx.arc(0, 0, wr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rotating Sigma Magic Hexagram + Cerberus Runic Tri-Ring
    ctx.save();
    ctx.rotate(elapsedTime * 1.9);
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([16, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Twin interlocking triangles (Seal of the Hound)
    for (let tIdx = 0; tIdx < 2; tIdx++) {
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        let ang = (Math.PI * 2 / 3) * k + (tIdx * Math.PI / 3);
        let px = Math.cos(ang) * r * 0.78;
        let py = Math.sin(ang) * r * 0.78;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = tIdx === 0 ? (isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.82)") : (isMono ? "#000000" : "rgba(244, 63, 94, 0.75)");
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    ctx.restore();

    // 2. Anime Impact Speedlines Radiating Outward
    if (p < 0.75) {
      let rayAlpha = 1 - p / 0.75;
      ctx.save();
      ctx.globalAlpha = fadeOut * rayAlpha;
      for (let ri = 0; ri < 12; ri++) {
        let ra = (Math.PI * 2 / 12) * ri + p * 0.45;
        let rIn = r * (0.35 + p * 0.25);
        let rOut = r * (0.98 + (ri % 2) * 0.24);
        ctx.strokeStyle = isMono ? "#FFFFFF" : ri % 3 === 0 ? "#FEF08A" : ri % 3 === 1 ? "#38BDF8" : "#F43F5E";
        ctx.lineWidth = (ri % 2 === 0 ? 4.2 : 2.6) * rayAlpha + 0.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(Math.cos(ra) * rIn, Math.sin(ra) * rIn);
        ctx.lineTo(Math.cos(ra) * rOut, Math.sin(ra) * rOut);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Towering Three-Headed Cerberus Avatar Erupting Above the Arena!
    ctx.save();
    ctx.translate(0, -surgeY - 12);
    ctx.scale(scalePop, scalePop);

    // Snapping Abyssal Demon Chains around Cerberus torso
    for (let ci of [-1, 1]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.lineWidth = 3.2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(ci * 22, 24);
      ctx.quadraticCurveTo(ci * 78, -6 + Math.sin(elapsedTime * 16) * 8, ci * 108, 36);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Twin spectral colossal claws slamming outward
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#18181B" : s < 0 ? "#0C4A6E" : "#4C0519";
      ctx.strokeStyle = isMono ? "#FFFFFF" : s < 0 ? "#38BDF8" : "#FB7185";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(s * 34, 14);
      ctx.lineTo(s * 82, 34);
      ctx.lineTo(s * 96, 52);
      ctx.lineTo(s * 76, 46);
      ctx.lineTo(s * 84, 62);
      ctx.lineTo(s * 64, 48);
      ctx.lineTo(s * 54, 64);
      ctx.lineTo(s * 42, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Armored Cerberus Abyssal Torso Silhouette
    let torsoGrad = ctx.createRadialGradient(0, 6, 8, 0, 6, 62);
    torsoGrad.addColorStop(0, isMono ? "#3F3F46" : "#1E293B");
    torsoGrad.addColorStop(0.65, isMono ? "#18181B" : "#0F172A");
    torsoGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, 12, 58, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Roaring Sound-Wave Cones blasting from the 3 mouths during peak roar
    if (p > 0.12 && p < 0.72) {
      let rp = (p - 0.12) / 0.6;
      let coneR = 46 + rp * 65;
      for (let mc of [
        { x: -46, y: 12, ang: Math.PI * 0.64, col: "#38BDF8" },
        { x: 46, y: 12, ang: Math.PI * 0.36, col: "#FB7185" },
        { x: 0, y: -10, ang: Math.PI * 0.5, col: "#FDE047" },
      ]) {
        ctx.save();
        ctx.globalAlpha = fadeOut * (1 - rp) * 0.85;
        ctx.strokeStyle = isMono ? "#FFFFFF" : mc.col;
        ctx.lineWidth = 3.2 * (1 - rp) + 1;
        ctx.beginPath();
        ctx.arc(mc.x, mc.y, coneR, mc.ang - 0.42, mc.ang + 0.42);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Left (Cyan Frost-Lightning), Right (Crimson Void), Center (Imperial Alpha Gold) Heads
    drawSingleCerberusHead(ctx, {
      x: -44,
      y: 2,
      scale: 0.96,
      tilt: -0.36,
      side: -1,
      jawOpen: roarJaw,
      elapsedTime,
      isMono,
      eyeTrailScale: 1.4,
    });
    drawSingleCerberusHead(ctx, {
      x: 44,
      y: 2,
      scale: 0.96,
      tilt: 0.36,
      side: 1,
      jawOpen: roarJaw,
      elapsedTime,
      isMono,
      eyeTrailScale: 1.4,
    });
    drawSingleCerberusHead(ctx, {
      x: 0,
      y: -18,
      scale: 1.24,
      tilt: 0,
      side: 0,
      jawOpen: Math.min(1, roarJaw * 1.15),
      elapsedTime,
      isMono,
      eyeTrailScale: 1.65,
    });

    ctx.restore();
    ctx.restore();
  }
}

export function drawMinhSealScepter(ctx, p, elapsedTime, state, isMono) {
  let atkProg = state?.atkProg || 0;
  let atkSin = state?.hasAtk ? Math.sin(atkProg * Math.PI) : 0;
  let thrust = atkSin * 11;
  let bob = Math.sin(elapsedTime * 3.4 + (state?.walkPhase || 0)) * 1.4;
  let parity = state?.parity || 1;
  let gold = isMono ? "#FFFFFF" : "#FDE047";
  let azure = isMono ? "#E5E5E5" : "#38BDF8";
  let dark = "#0F172A";

  ctx.save();
  ctx.rotate(0.18 * parity - atkSin * 0.36 * parity);
  ctx.translate(14 + thrust, 7 + bob);

  // Flowing Celestial Talisman Ribbon behind pommel
  let w1 = Math.sin(elapsedTime * 8.5 + (state?.walkPhase || 0)) * 4;
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.quadraticCurveTo(-26, w1, -34, -w1 * 0.7);
  ctx.stroke();

  // Dark outline + Pearl-Gold Astrolabe Staff Shaft
  ctx.strokeStyle = dark;
  ctx.lineWidth = 5.8;
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();

  let shaftGrad = ctx.createLinearGradient(-17, 0, 18, 0);
  shaftGrad.addColorStop(0, isMono ? "#333333" : "#1E3A8A");
  shaftGrad.addColorStop(0.65, gold);
  shaftGrad.addColorStop(1, "#FFFFFF");
  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();

  // Gauntlet grip
  drawHandGrip(ctx, -2, 0.5, "#1E40AF", gold, 3.8, isMono);

  // Crescent Winged Gold Cradle at Scepter Head
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(21, 0, 8.8, Math.PI * 0.58, Math.PI * 1.42);
  ctx.stroke();

  // Counter-rotating Dual Armillary Rings + Sapphire Prism Star
  let headX = 24.5;
  let glowR = 14 + (state?.skillAlpha || 0) * 5 + (state?.critAlpha || 0) * 4;
  let hGrad = ctx.createRadialGradient(headX, 0, 1, headX, 0, glowR);
  hGrad.addColorStop(0, "#FFFFFF");
  hGrad.addColorStop(0.45, isMono ? "rgba(255,255,255,0.45)" : "rgba(56, 189, 248, 0.52)");
  hGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.arc(headX, 0, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(headX, 0);
  ctx.rotate(elapsedTime * 2.6);
  ctx.strokeStyle = azure;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.6, 4.6, 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(-elapsedTime * 5.2);
  ctx.strokeStyle = gold;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.6, 4.6, -0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawFourPointStar(ctx, headX, 0, 6.8 + Math.sin(elapsedTime * 5) * 0.9, 2.4, "#FEF08A", azure);
  ctx.restore();
}

export function drawDucAnhSiegeGauntlets(ctx, p, elapsedTime, state, isMono) {
  let atkProg = state?.atkProg || 0;
  let atkSin = state?.hasAtk ? Math.sin(atkProg * Math.PI) : 0;
  let parity = state?.parity || 1;
  let walkSway = (state?.moveAmt || 0) * Math.sin(state?.walkPhase || 0) * 2.5;
  let flare = clamp((state?.skillAlpha || 0) + (state?.critAlpha || 0), 0, 1);

  for (let s of [-1, 1]) {
    let isLead = s * parity > 0;
    let punch = isLead ? atkSin * 15 : -atkSin * 3.5;
    let sideBob = s * walkSway;

    ctx.save();
    ctx.translate(15 + punch + sideBob * 0.4, s * 16.5);
    ctx.rotate(isLead ? -s * atkSin * 0.14 : s * 0.08);

    // Hydraulic piston strut behind gauntlet
    ctx.strokeStyle = isMono ? "#999999" : "#94A3B8";
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-3, 0);
    ctx.stroke();

    // Heavy beveled titanium siege ram gauntlet body
    ctx.fillStyle = isMono ? "#262626" : "#334155";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, -7.5);
    ctx.lineTo(9, -7.5);
    ctx.lineTo(13, -4);
    ctx.lineTo(13, 4);
    ctx.lineTo(9, 7.5);
    ctx.lineTo(-6, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Armored knuckle bumper plates + molten amber vents
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
    ctx.fillRect(8, -5.2, 3.2, 10.4);

    // Glowing furnace vent core on dorsal armor
    let ventR = 3.0 + flare * 1.4;
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.beginPath();
    ctx.arc(1.5, 0, ventR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(1.5, 0, ventR * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Shock ring flash at peak of lead punch
    if (isLead && atkSin > 0.35) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${atkSin * 0.9})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(13, 0, 8 + atkSin * 6, -1.0, 1.0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawMinhSanctuaries(ctx, zones, elapsedTime, isMono) {
  if (!zones || zones.length === 0) return;
  for (let z of zones) {
    let r = z.radius || 155;
    let fade = Math.min(1, (z.duration - z.timer) / 0.35);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(z.x, z.y);

    let g = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
    g.addColorStop(0, isMono ? "rgba(255,255,255,0.32)" : "rgba(186, 230, 253, 0.38)");
    g.addColorStop(0.55, isMono ? "rgba(200,200,200,0.2)" : "rgba(56, 189, 248, 0.3)");
    g.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating sacred hexagram & celestial astrolabe ring
    ctx.save();
    ctx.rotate(elapsedTime * 1.1);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([12, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let t = 0; t < 2; t++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        let a = (Math.PI * 2 / 3) * i + (t * Math.PI) / 3;
        let px = Math.cos(a) * r * 0.72;
        let py = Math.sin(a) * r * 0.72;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Counter-rotating frost-crystalline cardinal ticks
    ctx.save();
    ctx.rotate(-elapsedTime * 0.75);
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      let cx = Math.cos(a) * r * 0.94;
      let cy = Math.sin(a) * r * 0.94;
      drawFourPointStar(ctx, cx, cy, 8.2, 2.8, isMono ? "#FFFFFF" : "#BAE6FD", isMono ? "#333333" : "#38BDF8");
    }
    ctx.restore();

    // Orbiting healing stars & central sanctuary emblem
    for (let i = 0; i < 6; i++) {
      let ang = (Math.PI / 3) * i + elapsedTime * 1.5;
      let dist = r * (0.42 + 0.24 * Math.sin(elapsedTime * 2.5 + i));
      drawFourPointStar(ctx, Math.cos(ang) * dist, Math.sin(ang) * dist, 5.6, 2.1, isMono ? "#FFFFFF" : (i % 2 === 0 ? "#4ADE80" : "#FEF08A"), null);
    }
    drawFourPointStar(ctx, 0, 0, 14, 4.2, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    ctx.restore();
  }
}

export function drawMinhPrisons(ctx, prisons, elapsedTime, isMono) {
  if (!prisons || prisons.length === 0) return;
  for (let p of prisons) {
    let r = p.radius || 185;
    let prog = Math.min(1, p.timer / Math.max(0.1, p.duration));
    ctx.save();
    ctx.translate(p.x, p.y);

    let g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, isMono ? "rgba(255,255,255,0.28)" : "rgba(254, 240, 138, 0.34)");
    g.addColorStop(0.68, isMono ? "rgba(180,180,180,0.2)" : "rgba(56, 189, 248, 0.26)");
    g.addColorStop(1, "rgba(30, 58, 138, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Base octagonal seal perimeter
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Detonation countdown ring closing inward
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(12, r * (1 - prog * 0.78)), 0, Math.PI * 2);
    ctx.stroke();

    // 8 Celestial Light Pillars + Top Canopy Seal Chains
    let tops = [];
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i + elapsedTime * 0.38;
      let bx = Math.cos(a) * r;
      let by = Math.sin(a) * r;
      let tx = bx * 0.86;
      let ty = by * 0.86 - 60;
      tops.push({ x: tx, y: ty, bx, by });

      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.65)" : "rgba(56, 189, 248, 0.68)";
      ctx.lineWidth = 6.8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }

    // Interlocking Forged Golden Seal Chains linking the 8 canopy pillar crowns
    for (let i = 0; i < 8; i++) {
      let curr = tops[i];
      let next = tops[(i + 1) % 8];
      let dx = next.x - curr.x;
      let dy = next.y - curr.y;
      let dist = Math.hypot(dx, dy) || 1;
      let steps = Math.max(4, Math.round(dist / 9));
      let ang = Math.atan2(dy, dx);
      for (let s = 0; s <= steps; s++) {
        let f = s / steps;
        let lx = curr.x + dx * f;
        let ly = curr.y + dy * f + Math.sin(f * Math.PI) * 5;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(ang);
        ctx.strokeStyle = isMono ? "#FFFFFF" : s % 2 === 0 ? "#FACC15" : "#FEF08A";
        ctx.lineWidth = s % 2 === 0 ? 1.8 : 2.1;
        if (s % 2 === 0) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.6, 2.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(-3.6, 0);
          ctx.lineTo(3.6, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < 8; i++) {
      drawFourPointStar(ctx, tops[i].x, tops[i].y, 6.8, 2.3, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    }

    // Converging Radiant Zenith Seal Star overhead
    let starR = 18 + prog * 16;
    drawFourPointStar(ctx, 0, -24, starR, starR * 0.3, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    ctx.restore();
  }
}

export function drawDucAnhMeteorLeaps(ctx, leaps, elapsedTime, isMono) {
  if (!leaps || leaps.length === 0) return;
  for (let l of leaps) {
    let sx = l.sx ?? l.startX ?? l.x ?? 0;
    let sy = l.sy ?? l.startY ?? l.y ?? 0;
    let tx = l.tx ?? l.targetX ?? l.x ?? sx;
    let ty = l.ty ?? l.targetY ?? l.y ?? sy;
    let rad = l.radius || 185;
    let t = Math.min(1, (l.timer || 0) / Math.max(0.05, l.duration || 0.45));
    let arcH = Math.sin(t * Math.PI) * 175;
    let cx = sx + (tx - sx) * t;
    let cy = sy + (ty - sy) * t;

    // Target landing zone warning reticle + glowing seismic impact fissures
    ctx.save();
    ctx.translate(tx, ty);
    let tGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, rad);
    tGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.22)" : "rgba(254, 240, 138, 0.24)");
    tGrad.addColorStop(0.65, isMono ? "rgba(180,180,180,0.14)" : "rgba(249, 115, 22, 0.2)");
    tGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Rotating tactical siege target brackets
    ctx.save();
    ctx.rotate(elapsedTime * 3.5);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Expanding impact progress ring
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, rad * t), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Ground shadow + parabolic magma trail arc behind meteor
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, Math.max(12, 32 - arcH * 0.08), Math.max(7, 16 - arcH * 0.04), 0, 0, Math.PI * 2);
    ctx.fill();

    for (let ti = 1; ti <= 3; ti++) {
      let bt = Math.max(0, t - ti * 0.055);
      let bArc = Math.sin(bt * Math.PI) * 175;
      let bx = sx + (tx - sx) * bt;
      let by = sy + (ty - sy) * bt - bArc;
      ctx.fillStyle = isMono ? `rgba(255,255,255,${0.4 - ti * 0.1})` : `rgba(249, 115, 22, ${0.5 - ti * 0.12})`;
      ctx.beginPath();
      ctx.arc(bx, by, 26 - ti * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Blazing atmospheric re-entry meteor sphere + spikes
    ctx.save();
    ctx.translate(cx, cy - arcH);
    let r = 30 + Math.sin(t * Math.PI) * 11;

    // Outer fiery plasma aura
    let aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.85);
    aura.addColorStop(0, isMono ? "rgba(255,255,255,0.72)" : "rgba(254, 240, 138, 0.75)");
    aura.addColorStop(0.55, isMono ? "rgba(180,180,180,0.42)" : "rgba(249, 115, 22, 0.45)");
    aura.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(elapsedTime * 18);
    // Spiked siege shell
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.14) * (r - 2), Math.sin(a - 0.14) * (r - 2));
      ctx.lineTo(Math.cos(a) * (r + 11), Math.sin(a) * (r + 11));
      ctx.lineTo(Math.cos(a + 0.14) * (r - 2), Math.sin(a + 0.14) * (r - 2));
      ctx.closePath();
      ctx.fill();
    }

    let mg = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.12, 0, 0, r);
    mg.addColorStop(0, "#FEF08A");
    mg.addColorStop(0.42, "#F97316");
    mg.addColorStop(1, "#334155");
    ctx.fillStyle = isMono ? "#FFFFFF" : mg;
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function drawBachPhantomBlades(ctx, p, elapsedTime, state, isMono) {
  let atkProg = state?.atkProg || 0;
  let atkSin = state?.hasAtk ? Math.sin(atkProg * Math.PI) : 0;
  let parity = state?.parity || 1;
  let flare = clamp((state?.skillAlpha || 0) + (state?.critAlpha || 0) + (p?.bachDashing ? 0.55 : 0), 0, 1);

  for (let s of [-1, 1]) {
    let isLead = s * parity > 0;
    let thrust = isLead ? atkSin * 11 : -atkSin * 3;
    ctx.save();
    ctx.translate(10 + thrust, s * 16);
    ctx.rotate((isLead ? -s * atkSin * 0.65 : s * 0.22) + s * 0.26);

    // Reverse-grip wind ribbon trailing from hilt
    ctx.strokeStyle = isMono ? "#FFFFFF" : s === -1 ? "rgba(103, 232, 249, 0.7)" : "rgba(232, 121, 249, 0.65)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-18, s * 5 + Math.sin(elapsedTime * 10) * 3, -27, s * 2);
    ctx.stroke();

    // Hilt & wind-rune guard
    ctx.fillStyle = isMono ? "#262626" : "#0F172A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
    ctx.lineWidth = 1.6;
    ctx.fillRect(-7, -2.5, 9, 5);
    ctx.strokeRect(-7, -2.5, 9, 5);

    // Curved phantom wind katar-blade
    let bg = ctx.createLinearGradient(0, -5, 24, 5);
    bg.addColorStop(0, "#0891B2");
    bg.addColorStop(0.55, "#67E8F9");
    bg.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = isMono ? "#FFFFFF" : bg;
    ctx.strokeStyle = isMono ? "#000000" : "#E879F9";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, -4.2);
    ctx.quadraticCurveTo(16, -7.2 * s, 25, 0);
    ctx.quadraticCurveTo(12, 4.4 * s, 2, 4.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (flare > 0.15) {
      drawFourPointStar(ctx, 13, 0, 4.5 + flare * 3, 1.5, "#FFFFFF", "#22D3EE");
    }
    ctx.restore();
  }
}

export function drawThaiColosseumHalberd(ctx, p, elapsedTime, state, isMono) {
  let atkProg = state?.atkProg || 0;
  let atkSin = state?.hasAtk ? Math.sin(atkProg * Math.PI) : 0;
  let parity = state?.parity || 1;
  let inArena = Boolean(p?.thai_inArena);
  let swing = state?.hasAtk ? (-0.7 + atkProg * 1.85) * parity : Math.sin(elapsedTime * 2.4) * 0.06;

  ctx.save();
  ctx.translate(12, 11 * parity);
  ctx.rotate(swing);

  // Heavy gilded war-shaft
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#7F1D1D";
  ctx.lineWidth = 4.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();
  ctx.strokeStyle = isMono ? "#999999" : "#F59E0B";
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Flowing crimson war-tassel
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#EF4444";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(10, 2);
  ctx.quadraticCurveTo(4, 9 + Math.sin(elapsedTime * 9) * 2.5, -2, 12);
  ctx.stroke();

  // Crescent Colosseum War-Axe Head + Spear Spike
  let axeG = ctx.createLinearGradient(12, -14, 30, 14);
  axeG.addColorStop(0, inArena ? "#FEF08A" : "#E2E8F0");
  axeG.addColorStop(0.5, "#EF4444");
  axeG.addColorStop(1, "#F59E0B");
  ctx.fillStyle = isMono ? "#FFFFFF" : axeG;
  ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(13, -4);
  ctx.quadraticCurveTo(22, -17, 29, -12);
  ctx.quadraticCurveTo(22, 0, 29, 12);
  ctx.quadraticCurveTo(22, 17, 13, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Imperial halberd spear tip
  ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.beginPath();
  ctx.moveTo(22, -4);
  ctx.lineTo(38, 0);
  ctx.lineTo(22, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (inArena || atkSin > 0.25) {
    drawFourPointStar(ctx, 20, 0, inArena ? 6.8 : 4.5, 2.0, "#FFFFFF", "#FDE047");
  }
  ctx.restore();
}

export function drawKhairRailSniper(ctx, p, elapsedTime, state, isMono) {
  let recoil = clamp((state?.bowRecoil || 0) * 32, 0, 8);
  let aimCharge = clamp(p?.khair_aimZoomBlend || 0, 0, 1);

  ctx.save();
  ctx.translate(10 - recoil, 9);

  // Sniper rifle stock & chassis
  ctx.fillStyle = isMono ? "#171717" : "#0F172A";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-14, -4.2, 22, 8.4, 2.5);
  ctx.fill();
  ctx.stroke();

  // Dual magnetic rail accelerator barrels
  for (let s of [-1, 1]) {
    ctx.fillStyle = isMono ? "#404040" : "#1E293B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : aimCharge > 0.2 ? "#FACC15" : "#38BDF8";
    ctx.lineWidth = 1.5;
    ctx.fillRect(6, s * 2.8 - 1.4, 27, 2.8);
    ctx.strokeRect(6, s * 2.8 - 1.4, 27, 2.8);
  }

  // Glowing golden-cyan plasma energy chamber along the center rail
  ctx.fillStyle = isMono ? "#FFFFFF" : aimCharge > 0.2 ? "#FEF08A" : "#38BDF8";
  ctx.fillRect(4, -1.3, 24, 2.6);

  // Telescopic Eagle-Eye optical scope mounted top-side
  ctx.fillStyle = isMono ? "#262626" : "#334155";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-2, -7.8, 15, 4.2, 1.5);
  ctx.fill();
  ctx.stroke();

  // Muzzle focusing core when aiming C2
  if (aimCharge > 0.08) {
    let pulse = 4.5 + aimCharge * 5 + Math.sin(elapsedTime * 16) * 1.4;
    drawFourPointStar(ctx, 35, 0, pulse, pulse * 0.32, "#FFFFFF", "#FACC15");
  }
  ctx.restore();
}

export function drawThaiArenaDomains(ctx, zones, elapsedTime, isMono) {
  if (!zones || zones.length === 0) return;
  for (let z of zones) {
    let r = z.radius || 410;
    let fade = Math.min(1, (z.duration - z.timer) / 0.45);
    let pulse = 0.88 + 0.12 * Math.sin(elapsedTime * 5);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(z.x, z.y);

    // Imperial crimson-gold Colosseum floor aura
    let g = ctx.createRadialGradient(0, 0, r * 0.06, 0, 0, r);
    g.addColorStop(0, isMono ? "rgba(255,255,255,0.18)" : "rgba(253, 224, 71, 0.22)");
    g.addColorStop(0.42, isMono ? "rgba(255,255,255,0.08)" : "rgba(185, 28, 28, 0.16)");
    g.addColorStop(0.78, isMono ? "rgba(255,255,255,0.16)" : "rgba(220, 38, 38, 0.26)");
    g.addColorStop(0.95, isMono ? "rgba(255,255,255,0.3)" : "rgba(245, 158, 11, 0.38)");
    g.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Expanding Colosseum sovereign heartbeat pulse ring
    let waveR = ((elapsedTime * 0.58) % 1) * r;
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.38)" : `rgba(253, 224, 71, ${(1 - waveR / r) * 0.62})`;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.stroke();

    // Outer double arena stone & gold rings
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#999999" : "#EF4444";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    // Colosseum Arena radial sunbeams & rotating rune circle
    ctx.save();
    ctx.rotate(elapsedTime * 0.32);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.72)";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([20, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.24)" : "rgba(245, 158, 11, 0.36)";
    ctx.lineWidth = 2.0;
    for (let si = 0; si < 8; si++) {
      let sa = (Math.PI / 4) * si;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * r * 0.24, Math.sin(sa) * r * 0.24);
      ctx.lineTo(Math.cos(sa) * r * 0.9, Math.sin(sa) * r * 0.9);
      ctx.stroke();
    }
    ctx.restore();

    // Inner Octagon Champion Ring & Imperial Emblem Crown
    ctx.save();
    ctx.rotate(-elapsedTime * 0.45);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.58)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let oi = 0; oi < 8; oi++) {
      let oa = (Math.PI / 4) * oi;
      let ox = Math.cos(oa) * r * 0.34, oy = Math.sin(oa) * r * 0.34;
      oi === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
    }
    ctx.closePath();
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 22 * pulse, 6.0, isMono ? "#FFFFFF" : "#FEF08A", isMono ? "#333333" : "#EF4444");
    ctx.restore();

    // 8 Carved Colosseum Battle Pillars & glowing barrier chains between adjacent pillars
    let pillars = [];
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i + elapsedTime * 0.08;
      pillars.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a });
    }
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.42)" : `rgba(253, 224, 71, ${0.42 + 0.16 * Math.sin(elapsedTime * 7)})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([12, 8]);
    for (let i = 0; i < 8; i++) {
      let p1 = pillars[i], p2 = pillars[(i + 1) % 8];
      let mx = (p1.x + p2.x) * 0.48, my = (p1.y + p2.y) * 0.48;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(mx, my, p2.x, p2.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    for (let i = 0; i < 8; i++) {
      let pt = pillars[i];
      ctx.fillStyle = isMono ? "#262626" : "#450A0A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Gilded gladiator torch plume on pillar
      ctx.fillStyle = isMono ? "rgba(255,255,255,0.55)" : "rgba(249, 115, 22, 0.72)";
      ctx.beginPath();
      ctx.moveTo(pt.x - 5, pt.y - 4);
      ctx.quadraticCurveTo(pt.x, pt.y - 24 - Math.sin(elapsedTime * 11 + i) * 4, pt.x + 5, pt.y - 4);
      ctx.closePath();
      ctx.fill();
      drawFourPointStar(ctx, pt.x, pt.y, 8.2 * pulse, 2.6, isMono ? "#FFFFFF" : "#FEF08A", isMono ? "#333333" : "#EF4444");
    }

    // Rising Colosseum war-ember sparks around perimeter
    for (let ei = 0; ei < 12; ei++) {
      let ea = (Math.PI * 2 / 12) * ei + elapsedTime * 0.42;
      let er = r * (0.82 + 0.12 * Math.sin(elapsedTime * 3 + ei));
      let ex = Math.cos(ea) * er, ey = Math.sin(ea) * er - ((elapsedTime * 22 + ei * 11) % 16);
      ctx.fillStyle = isMono ? "#FFFFFF" : ei % 2 === 0 ? "#FEF08A" : "#FB7185";
      ctx.beginPath();
      ctx.arc(ex, ey, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function drawKhairMedBeacons(ctx, beacons, elapsedTime, isMono, ownerPos = null) {
  if (!beacons || beacons.length === 0) return;
  for (let b of beacons) {
    let r = b.radius || 175;
    let fade = Math.min(1, (b.duration - b.timer) / 0.35);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(b.x, b.y);

    // Emerald-Gold Med-Sensor Zone with full isMono support
    let g = ctx.createRadialGradient(0, 0, 8, 0, 0, r);
    g.addColorStop(0, isMono ? "rgba(255,255,255,0.28)" : "rgba(74, 222, 128, 0.36)");
    g.addColorStop(0.55, isMono ? "rgba(180,180,180,0.16)" : "rgba(16, 185, 129, 0.2)");
    g.addColorStop(0.88, isMono ? "rgba(255,255,255,0.14)" : "rgba(250, 204, 21, 0.16)");
    g.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Counter-rotating tactical emerald & gold perimeter rings + corner brackets
    ctx.save();
    ctx.rotate(elapsedTime * 0.85);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.lineWidth = 2.8;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.0;
    for (let bi = 0; bi < 4; bi++) {
      let ba = (Math.PI / 2) * bi;
      ctx.beginPath();
      ctx.arc(0, 0, r + 5, ba - 0.15, ba + 0.15);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(-elapsedTime * 1.15);
    ctx.strokeStyle = isMono ? "#CCCCCC" : "rgba(250, 204, 21, 0.72)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Rotating radar sweep sector
    let sweep = elapsedTime * 2.5;
    ctx.fillStyle = isMono ? "rgba(255,255,255,0.16)" : "rgba(74, 222, 128, 0.22)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.96, sweep, sweep + 0.78);
    ctx.closePath();
    ctx.fill();

    // Expanding sonar heal pulse
    let wave = ((elapsedTime * 0.9) % 1) * r;
    ctx.strokeStyle = isMono ? `rgba(255,255,255,${1 - wave / r})` : `rgba(74, 222, 128, ${1 - wave / r})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, wave, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting miniature healing "+" motes
    for (let hi = 0; hi < 4; hi++) {
      let ha = elapsedTime * 1.4 + (Math.PI / 2) * hi;
      let hr = r * (0.45 + 0.15 * Math.sin(elapsedTime * 3 + hi));
      let hx = Math.cos(ha) * hr, hy = Math.sin(ha) * hr - ((elapsedTime * 18 + hi * 9) % 14);
      ctx.fillStyle = isMono ? "#FFFFFF" : hi % 2 === 0 ? "#4ADE80" : "#FEF08A";
      ctx.fillRect(hx - 4, hy - 1.2, 8, 2.4);
      ctx.fillRect(hx - 1.2, hy - 4, 2.4, 8);
    }

    // 2 Orbiting Tactical Med-Drone Satellites
    for (let di = 0; di < 2; di++) {
      let da = elapsedTime * 2.1 + di * Math.PI;
      let dx = Math.cos(da) * (r * 0.32), dy = Math.sin(da) * (r * 0.32);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(da + Math.PI * 0.5);
      ctx.fillStyle = isMono ? "#FFFFFF" : "#34D399";
      ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Live Emerald Regen Tether connecting Beacon to Khair when inside zone
    if (ownerPos && !b.visualOnly) {
      let rx = ownerPos.x - b.x, ry = ownerPos.y - b.y;
      let dist = Math.hypot(rx, ry);
      if (dist <= r + 26 && dist > 6) {
        ctx.strokeStyle = isMono ? "rgba(255,255,255,0.55)" : "rgba(74, 222, 128, 0.55)";
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -elapsedTime * 55;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rx, ry);
        ctx.stroke();
        ctx.setLineDash([]);

        let tP = (elapsedTime * 1.9) % 1;
        drawFourPointStar(ctx, rx * tP, ry * tP, 6.6, 2.1, "#FFFFFF", isMono ? "#333333" : "#4ADE80");
      }
    }

    // Central Med-Beacon Tripod Device
    ctx.fillStyle = isMono ? "#262626" : "#064E3B";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Emerald Medical Cross
    ctx.fillStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.fillRect(-6.5, -2.2, 13, 4.4);
    ctx.fillRect(-2.2, -6.5, 4.4, 13);
    ctx.restore();
  }
}

export function drawBachDashRifts(ctx, rifts, elapsedTime, isMono) {
  if (!rifts || rifts.length === 0) return;
  for (let rf of rifts) {
    let f = clamp((rf.timer || 0) / Math.max(0.08, rf.duration || 0.45), 0, 1);
    let alpha = 1 - f;
    let dx = rf.tx - rf.sx, dy = rf.ty - rf.sy;
    let len = Math.hypot(dx, dy) || 1;
    let ang = Math.atan2(dy, dx);
    let nx = -dy / len, ny = dx / len;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";

    // Dark dimensional glass seam core
    ctx.strokeStyle = isMono ? "#020617" : "#060414";
    ctx.lineWidth = (rf.width || 16) * (2.25 - f * 0.9);
    ctx.beginPath();
    ctx.moveTo(rf.sx, rf.sy);
    ctx.lineTo(rf.tx, rf.ty);
    ctx.stroke();

    // Wide outer luminous wind-rift halo + additive neon glow
    ctx.save();
    if (!isMono) ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.4)" : (rf.color ? `${rf.color}66` : "rgba(34, 211, 238, 0.46)");
    ctx.lineWidth = (rf.width || 16) * (2.05 - f * 0.85);
    ctx.beginPath();
    ctx.moveTo(rf.sx, rf.sy);
    ctx.lineTo(rf.tx, rf.ty);
    ctx.stroke();

    // Outer cyan-magenta wind-rift slash
    ctx.strokeStyle = isMono ? "#FFFFFF" : rf.color || "#22D3EE";
    ctx.lineWidth = (rf.width || 16) * (1.35 - f * 0.65);
    ctx.beginPath();
    ctx.moveTo(rf.sx, rf.sy);
    ctx.lineTo(rf.tx, rf.ty);
    ctx.stroke();
    ctx.restore();

    // Flanking twin wind ribbons + crescent phantom wind blades along dash wake
    for (let s of [-1, 1]) {
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.62)" : s === -1 ? "rgba(103, 232, 249, 0.78)" : "rgba(232, 121, 249, 0.78)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(rf.sx + nx * s * 12, rf.sy + ny * s * 12);
      ctx.quadraticCurveTo(
        (rf.sx + rf.tx) * 0.5 + nx * s * (22 * alpha),
        (rf.sy + rf.ty) * 0.5 + ny * s * (22 * alpha),
        rf.tx + nx * s * 6,
        rf.ty + ny * s * 6
      );
      ctx.stroke();
    }
    for (let bi = 1; bi <= 2; bi++) {
      let bt = bi / 3;
      let bx = rf.sx + dx * bt, by = rf.sy + dy * bt;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(ang);
      ctx.strokeStyle = isMono ? "#FFFFFF" : bi === 1 ? "#67E8F9" : "#E879F9";
      ctx.lineWidth = 2.4 * alpha + 0.6;
      ctx.beginPath();
      ctx.arc(-8, 0, 18, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();
      ctx.restore();
    }

    // Jagged inner spatial lightning-wind fissure
    ctx.strokeStyle = isMono ? "#000000" : "#E879F9";
    ctx.lineWidth = Math.max(2, (rf.width || 16) * 0.48 * (1 - f * 0.4));
    ctx.beginPath();
    ctx.moveTo(rf.sx, rf.sy);
    for (let k = 1; k <= 3; k++) {
      let t = k / 4;
      let off = (k % 2 === 0 ? 1 : -1) * (10 * alpha);
      ctx.lineTo(rf.sx + dx * t + nx * off, rf.sy + dy * t + ny * off);
    }
    ctx.lineTo(rf.tx, rf.ty);
    ctx.stroke();

    // Crisp white core flash
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.8, (rf.width || 16) * 0.3 * (1 - f));
    ctx.beginPath();
    ctx.moveTo(rf.sx, rf.sy);
    ctx.lineTo(rf.tx, rf.ty);
    ctx.stroke();

    let mx = (rf.sx + rf.tx) * 0.5;
    let my = (rf.sy + rf.ty) * 0.5;
    drawFourPointStar(ctx, mx, my, 16 * alpha + 3, 4.0, "#FFFFFF", isMono ? "#333333" : "#E879F9");
    drawFourPointStar(ctx, rf.tx, rf.ty, 11 * alpha + 2, 2.8, "#FFFFFF", isMono ? "#333333" : rf.color || "#22D3EE");
    ctx.restore();
  }
}

export function drawBachWindSeals(ctx, seals, elapsedTime, isMono) {
  if (!seals || seals.length === 0) return;
  for (let sl of seals) {
    let dur = Math.max(0.15, sl.duration || 0.42);
    let p = clamp((sl.timer || 0) / dur, 0, 1);
    let r = sl.radius || 145;
    let isUlt = sl.kind === "ult_domain";
    let fade = isUlt ? Math.min(1, (dur - (sl.timer || 0)) / 0.3) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(sl.x, sl.y);

    if (isUlt) {
      // Vạn Ảnh Tuyệt Diệt spatial wind-seal matrix domain
      let g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      g.addColorStop(0, isMono ? "rgba(255,255,255,0.16)" : "rgba(34, 211, 238, 0.22)");
      g.addColorStop(0.65, isMono ? "rgba(255,255,255,0.1)" : "rgba(232, 121, 249, 0.18)");
      g.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(elapsedTime * 1.45);
      ctx.strokeStyle = isMono ? "#CCCCCC" : "#E879F9";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([16, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Swirling cyclone wind ribbons + blade hexagram
      for (let hi = 0; hi < 6; hi++) {
        let ha = (Math.PI / 3) * hi;
        ctx.strokeStyle = isMono ? "rgba(255,255,255,0.48)" : hi % 2 === 0 ? "rgba(103, 232, 249, 0.62)" : "rgba(232, 121, 249, 0.62)";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ha) * r * 0.25, Math.sin(ha) * r * 0.25);
        ctx.quadraticCurveTo(Math.cos(ha + 0.32) * r * 0.62, Math.sin(ha + 0.32) * r * 0.62, Math.cos(ha) * r * 0.94, Math.sin(ha) * r * 0.94);
        ctx.stroke();
        drawFourPointStar(ctx, Math.cos(ha) * r * 0.94, Math.sin(ha) * r * 0.94, 6.2, 2.0, "#FFFFFF", isMono ? "#333333" : "#22D3EE");
      }
      ctx.restore();

      drawFourPointStar(ctx, 0, 0, 19, 4.8, "#FFFFFF", isMono ? "#555555" : "#E879F9");
    } else {
      // C2 Explosive Wind Decoy Seal (Bùa Phong Ảnh Bộc Phá)
      let g = ctx.createRadialGradient(0, 0, 6, 0, 0, r);
      g.addColorStop(0, isMono ? "rgba(255,255,255,0.3)" : "rgba(232, 121, 249, 0.38)");
      g.addColorStop(0.58, isMono ? "rgba(255,255,255,0.16)" : "rgba(34, 211, 238, 0.24)");
      g.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer hazard perimeter ring + crescent vortex sweep
      ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(103, 232, 249, 0.85)";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Converging implosion countdown ring
      let convR = Math.max(8, r * (1 - p));
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.arc(0, 0, convR, 0, Math.PI * 2);
      ctx.stroke();

      // Swirling 4-dagger phantom seal in the middle
      ctx.save();
      ctx.rotate(elapsedTime * 8.5 + p * 6);
      for (let di = 0; di < 4; di++) {
        ctx.rotate(Math.PI / 2);
        ctx.strokeStyle = isMono ? "rgba(255,255,255,0.55)" : di % 2 === 0 ? "rgba(103, 232, 249, 0.65)" : "rgba(232, 121, 249, 0.65)";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0.15, 0.95);
        ctx.stroke();
        ctx.fillStyle = isMono ? "#FFFFFF" : di % 2 === 0 ? "#22D3EE" : "#E879F9";
        ctx.strokeStyle = isMono ? "#000000" : "#FFFFFF";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(29, 0);
        ctx.lineTo(10, -4.8);
        ctx.lineTo(14, 0);
        ctx.lineTo(10, 4.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      drawFourPointStar(ctx, 0, 0, 13 + p * 9, 3.4, "#FFFFFF", isMono ? "#333333" : "#E879F9");
    }

    ctx.restore();
  }
}

export function drawKhairRailBeams(ctx, beams, elapsedTime, isMono) {
  if (!beams || beams.length === 0) return;
  for (let bm of beams) {
    let dur = Math.max(0.12, bm.maxLife || 0.48);
    let f = clamp((bm.life || 0) / dur, 0, 1);
    let alpha = 1 - f;
    let dx = bm.ex - bm.sx, dy = bm.ey - bm.sy;
    let len = Math.hypot(dx, dy) || 1;
    let ang = Math.atan2(dy, dx);
    let isFull = (bm.chargeRatio || 0) >= 0.85;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(bm.sx, bm.sy);
    ctx.rotate(ang);

    // Outer Emerald-Gold Ionization Beam Sheath
    let sheathG = ctx.createLinearGradient(0, -16, len, 16);
    sheathG.addColorStop(0, isMono ? "#FFFFFF" : isFull ? "#FACC15" : "#4ADE80");
    sheathG.addColorStop(0.65, isMono ? "rgba(255,255,255,0.68)" : "rgba(16, 185, 129, 0.75)");
    sheathG.addColorStop(1, "rgba(74, 222, 128, 0)");
    ctx.strokeStyle = sheathG;
    ctx.lineWidth = (isFull ? 22 : 16) * (1 - f * 0.65);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();

    // Helical plasma ribbon twisting along sniper trajectory
    ctx.strokeStyle = isMono ? "#FFFFFF" : isFull ? "#FEF08A" : "#86EFAC";
    ctx.lineWidth = (isFull ? 3.4 : 2.4) * alpha + 0.8;
    ctx.beginPath();
    let stepPx = 42;
    let steps = Math.max(6, Math.min(28, Math.floor(len / stepPx)));
    for (let si = 0; si <= steps; si++) {
      let t = si / steps;
      let px = len * t;
      let py = Math.sin(t * Math.PI * 6 - elapsedTime * 18) * ((isFull ? 11.5 : 7.5) * alpha);
      si === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Blinding White-Hot Laser Core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = (isFull ? 6.8 : 4.5) * (1 - f * 0.7);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();

    // Supersonic Mach Compression Rings + Plasma Shock Diamonds spaced along trajectory
    for (let mr = 140; mr < len - 60; mr += 210) {
      let ringScale = 1 + f * 0.85;
      ctx.strokeStyle = isMono ? "#FFFFFF" : isFull ? "rgba(253, 224, 71, 0.86)" : "rgba(74, 222, 128, 0.82)";
      ctx.lineWidth = 2.2 * alpha + 0.6;
      ctx.beginPath();
      ctx.ellipse(mr, 0, 5.5, (isFull ? 20 : 15) * ringScale, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isMono ? "#FFFFFF" : isFull ? "#FEF08A" : "#86EFAC";
      ctx.beginPath();
      ctx.moveTo(mr + 12, 0);
      ctx.lineTo(mr, -4.5 * alpha);
      ctx.lineTo(mr - 10, 0);
      ctx.lineTo(mr, 4.5 * alpha);
      ctx.closePath();
      ctx.fill();
    }

    drawFourPointStar(ctx, 16, 0, (isFull ? 19 : 14) * alpha + 4, 3.8, "#FFFFFF", isMono ? "#333333" : "#FACC15");
    drawFourPointStar(ctx, len - 8, 0, (isFull ? 16 : 11) * alpha + 3, 3.2, "#FFFFFF", isMono ? "#333333" : "#4ADE80");
    ctx.restore();
  }
}

export function drawHeroPassiveAura(ctx, opts = {}) {
  let {
    heroId,
    x = 0,
    y = 0,
    radius = 22,
    facing = 0,
    elapsedTime = 0,
    isMono = false,
    enableAdditive = true,
    player = null,
    buffs = null
  } = opts;
  if (!heroId) return;

  let p = player || {};
  let b = buffs || {};
  ctx.save();
  ctx.translate(x, y);
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }

  switch (heroId) {
    case "tin": {
      // Orbiting crimson-obsidian Ma Thạch crystals (0..4) + Overdrive crystalline ring
      let stacks = clamp(p.tin_resonance_stacks ?? b.tin_resonance ?? 0, 0, 4);
      let empowered = Boolean(p.tin_empowered ?? b.tin_empowered);
      let thirdHitReady = (p.tin_basicCount || 0) >= 2;
      if (stacks > 0 || empowered || thirdHitReady) {
        let orbitR = radius + 15;
        if (empowered) {
          ctx.save();
          ctx.rotate(-elapsedTime * 3.4);
          ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
          ctx.lineWidth = 2.4;
          drawUltPolygon(ctx, 0, 0, 4, orbitR + 4, 0);
          ctx.stroke();
          ctx.strokeStyle = isMono ? "#94A3B8" : "#F43F5E";
          ctx.lineWidth = 1.6;
          drawUltPolygon(ctx, 0, 0, 4, orbitR + 4, Math.PI / 4);
          ctx.stroke();
          ctx.restore();
        }
        let count = Math.max(stacks, empowered ? 4 : 0);
        for (let i = 0; i < count; i++) {
          let ang = elapsedTime * (empowered ? 4.4 : 2.6) + (Math.PI * 2 * i) / Math.max(1, count);
          let sx = Math.cos(ang) * orbitR;
          let sy = Math.sin(ang) * orbitR;
          drawUltDiamondShard(
            ctx,
            sx,
            sy,
            empowered ? 8.5 : 7,
            empowered ? 4 : 3.2,
            ang + Math.PI / 2,
            isMono ? "#FFFFFF" : empowered ? "#FFF1F2" : "#F43F5E",
            isMono ? "#0F172A" : "#9F1239"
          );
        }
        if (thirdHitReady) {
          ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDA4AF";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, radius + 9, facing - 0.55, facing + 0.55);
          ctx.stroke();
        }
      }
      break;
    }

    case "bao": {
      // Refractive prism glass stealth arcs & inward converging emergence mirage shards
      let isStealth = (p.bao_stealthTimer || 0) > 0 || (p.bao_stealthFade || 0) > 0.05 || Boolean(b.bao_stealth);
      let emergeT = p.bao_emergeTimer || (b.bao_emerge ? 0.14 : 0);
      if (isStealth) {
        let pulse = 0.7 + 0.3 * Math.sin(elapsedTime * 7.5);
        ctx.globalAlpha = 0.65 * pulse;
        for (let arc = 0; arc < 3; arc++) {
          let a0 = elapsedTime * (arc % 2 === 0 ? 2.8 : -2.2) + (Math.PI * 2 * arc) / 3;
          ctx.strokeStyle = isMono ? "#FFFFFF" : arc === 0 ? "#E879F9" : "#38BDF8";
          ctx.lineWidth = 2.1;
          ctx.beginPath();
          ctx.arc(0, 0, radius + 11 + arc * 3, a0, a0 + 0.95);
          ctx.stroke();
        }
      }
      if (emergeT > 0) {
        let ep = clamp(emergeT / 0.24, 0, 1);
        ctx.globalAlpha = ep * 0.9;
        for (let si = 0; si < 6; si++) {
          let sa = (Math.PI / 3) * si + ep * 1.4;
          let dist = radius + 6 + ep * 34;
          drawUltDiamondShard(
            ctx,
            Math.cos(sa) * dist,
            Math.sin(sa) * dist,
            9 * ep + 3,
            3.6,
            sa + Math.PI,
            isMono ? "#FFFFFF" : "#F5D0FE",
            isMono ? "#111111" : "#A855F7"
          );
        }
      }
      break;
    }

    case "longhoi": {
      // Orbiting Fox-Fire flame wisps + glowing nine-tail ready arc when C2/bonus shot primed
      let hasBonus = (p.longhoi_nextAtkBonus || 0) > 0 || (p.longhoi_msBuffTimer || 0) > 0 || Boolean(b.longhoi_bonus);
      let wispCount = hasBonus ? 5 : 3;
      let orbitR = radius + (hasBonus ? 16 : 13);
      for (let wi = 0; wi < wispCount; wi++) {
        let wa = elapsedTime * (hasBonus ? 4.2 : 2.3) + (Math.PI * 2 * wi) / wispCount;
        let wx = Math.cos(wa) * orbitR;
        let wy = Math.sin(wa) * orbitR;
        drawUltPetal(
          ctx,
          wa + Math.PI / 2,
          orbitR - 4,
          orbitR + (hasBonus ? 9 : 6),
          hasBonus ? 4.5 : 3.2,
          isMono ? "#FFFFFF" : wi % 2 === 0 ? "#F97316" : "#FEF08A",
          isMono ? "#0F172A" : "#EA580C"
        );
        if (hasBonus && wi % 2 === 0) {
          drawFourPointStar(ctx, wx, wy, 4.5, 1.5, "#FFFFFF", "#F97316");
        }
      }
      break;
    }

    case "danh": {
      // Progressive Dragon-Qi Charge Threads converging into blade when charging + empowered halo
      let charging = p.chargeState?.active || (b.danh_charge || 0) > 0;
      let cp = p.chargeState?.active
        ? clamp(p.chargeState.elapsed / Math.max(0.1, p.chargeState.maxDur), 0, 1)
        : clamp(b.danh_charge || 0, 0, 1);
      if (charging && cp > 0.02) {
        let threadCount = 6;
        let col = isMono ? "#FFFFFF" : cp >= 0.85 ? "#FEF08A" : cp >= 0.45 ? "#F59E0B" : "#EF4444";
        ctx.globalAlpha = 0.55 + cp * 0.4;
        for (let ti = 0; ti < threadCount; ti++) {
          let ta = (Math.PI * 2 * ti) / threadCount + elapsedTime * (2.5 + cp * 3.5);
          let outerR = radius + 28 * (1 - (elapsedTime * 2 + ti * 0.2) % 1);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.6 + cp * 1.4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ta) * outerR, Math.sin(ta) * outerR);
          ctx.quadraticCurveTo(Math.cos(ta + 0.5) * (radius + 6), Math.sin(ta + 0.5) * (radius + 6), Math.cos(facing) * 14, Math.sin(facing) * 14);
          ctx.stroke();
        }
      }
      break;
    }

    case "dung": {
      // 0..5 Electric Cerberus Passive Stacks orbiting as cyan-gold storm sparks
      let stacks = clamp(p.dung_passive ?? b.dung_passive ?? 0, 0, 5);
      if (stacks > 0) {
        let full = stacks >= 5;
        let orbitR = radius + 14;
        for (let i = 0; i < stacks; i++) {
          let ang = elapsedTime * 3.1 + (Math.PI * 2 * i) / 5;
          let sx = Math.cos(ang) * orbitR;
          let sy = Math.sin(ang) * orbitR;
          drawFourPointStar(ctx, sx, sy, full ? 6.2 : 4.5, 1.7, "#FFFFFF", isMono ? "#0F172A" : full ? "#FDE047" : "#38BDF8");
        }
      }
      break;
    }

    case "kin": {
      // 0..4 Emerald Wind Stacks orbiting + crimson-emerald lifesteal ring
      let stacks = clamp(p.kin_passive ?? b.kin_passive ?? 0, 0, 4);
      let lsActive = (p.kin_c2_lifestealTimer || 0) > 0 || Boolean(b.kin_ls);
      if (stacks > 0) {
        for (let i = 0; i < stacks; i++) {
          let ang = elapsedTime * 3.8 + (Math.PI * 2 * i) / 4;
          drawUltDiamondShard(ctx, Math.cos(ang) * (radius + 14), Math.sin(ang) * (radius + 14), 6.5, 2.6, ang + 0.5, isMono ? "#FFFFFF" : "#34D399", "#FFFFFF");
        }
      }
      if (lsActive) {
        ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 16, elapsedTime * 3, elapsedTime * 3 + Math.PI * 1.2);
        ctx.stroke();
      }
      break;
    }

    case "trung": {
      // 0..3 Astral Spell-Stack sigil pips
      let stacks = clamp(p.trung_passive ?? b.trung_passive ?? 0, 0, 3);
      if (stacks > 0) {
        let ready = stacks >= 3;
        for (let i = 0; i < stacks; i++) {
          let ang = elapsedTime * 2.4 + (Math.PI * 2 * i) / 3;
          let ox = Math.cos(ang) * (radius + 14);
          let oy = Math.sin(ang) * (radius + 14);
          ctx.fillStyle = isMono ? "#FFFFFF" : ready ? "#FDE047" : "#818CF8";
          ctx.beginPath();
          ctx.arc(ox, oy, ready ? 4.2 : 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case "eohyen": {
      // 0..4 Glacial Frost Crystal Pips orbiting
      let stacks = clamp(p.eohyen_passive ?? b.eohyen_passive ?? 0, 0, 4);
      for (let i = 0; i < stacks; i++) {
        let ang = -elapsedTime * 2.1 + (Math.PI * 2 * i) / 4;
        drawUltDiamondShard(ctx, Math.cos(ang) * (radius + 15), Math.sin(ang) * (radius + 15), 6.5, 2.8, ang, "#E0F2FE", isMono ? "#0F172A" : "#38BDF8");
      }
      break;
    }

    case "duccong": {
      // Orbiting Dark-Violet Singularity Motes + Siphon charge ring
      let stacks = clamp(p.duccong_passive ?? b.duccong_passive ?? 0, 0, 3);
      let count = Math.max(2, stacks + 1);
      for (let i = 0; i < count; i++) {
        let ang = -elapsedTime * 2.4 + (Math.PI * 2 * i) / count;
        ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#C084FC" : "#38BDF8";
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * (radius + 13), Math.sin(ang) * (radius + 13), 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "gau": {
      // Rage meter ember arc around feet (0..100)
      let rage = clamp((p.gau_rage ?? b.gau_rage ?? 0) / 100, 0, 1);
      if (rage > 0.05) {
        ctx.strokeStyle = isMono ? "#FFFFFF" : rage >= 0.85 ? "#F97316" : "#FBBF24";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rage);
        ctx.stroke();
      }
      break;
    }

    case "luan": {
      // 3 Drifting Dimensional Mirror Prism Shards
      for (let i = 0; i < 3; i++) {
        let ang = elapsedTime * 2.2 + (Math.PI * 2 * i) / 3;
        drawUltDiamondShard(ctx, Math.cos(ang) * (radius + 15), Math.sin(ang) * (radius + 15), 6, 2.4, ang + elapsedTime, isMono ? "#FFFFFF" : i === 0 ? "#67E8F9" : "#C084FC", "#FFFFFF");
      }
      break;
    }

    case "taidu": {
      // 3rd-shot EMP capacitor lock glint
      if ((p.taidu_basicCount || 0) >= 2) {
        ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 13, facing - 0.6, facing + 0.6);
        ctx.stroke();
      }
      break;
    }

    case "nguyen": {
      // Low-HP Emergency Rescue Aura Shimmer
      let lowHp = p.maxHp > 0 && p.hp / p.maxHp <= 0.45;
      if (lowHp || (p.nguyen_rescueFlashTimer || 0) > 0) {
        ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 15 + Math.sin(elapsedTime * 8) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "phong": {
      // Twin shadow-blade orbit wisps
      for (let i = 0; i < 2; i++) {
        let ang = elapsedTime * 4.2 + i * Math.PI;
        ctx.strokeStyle = isMono ? "#FFFFFF" : i === 0 ? "#22D3EE" : "#F43F5E";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 13, ang, ang + 0.65);
        ctx.stroke();
      }
      break;
    }

    case "nhi": {
      // Active Tri-Elixir Ammo Indicator Pip (purple / green / life)
      let ammo = p.nhi_ammoType || b.nhi_ammo || "purple";
      let col = isMono ? "#FFFFFF" : ammo === "green" ? "#4ADE80" : ammo === "life" ? "#FB7185" : "#C084FC";
      let ang = elapsedTime * 3.0;
      ctx.fillStyle = col;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * (radius + 14), Math.sin(ang) * (radius + 14), 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case "minh": {
      // Rotating Heavenly Decree Seal Halo
      ctx.save();
      ctx.rotate(elapsedTime * 1.6);
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      break;
    }

    case "ducanh": {
      // Siege Armor Gear Aura + Molten Hot-Regen Sparks
      let hot = (p.ducanh_passiveHotTimer || 0) > 0;
      ctx.save();
      ctx.rotate(-elapsedTime * (hot ? 3.2 : 1.2));
      ctx.strokeStyle = isMono ? "#FFFFFF" : hot ? "#FEF08A" : "#F59E0B";
      ctx.lineWidth = hot ? 2.6 : 1.8;
      ctx.setLineDash([9, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      break;
    }

    case "duy":
    case "dang":
    case "thanh":
    case "thien":
    case "bach":
    case "thai":
    case "khair":
    default: {
      // Subtle signature directional trim arc so every hero has crisp ground presence
      let trimCol = isMono ? "#FFFFFF" : {
        duy: "#14B8A6",
        dang: "#F8FAFC",
        thanh: "#34D399",
        thien: "#FACC15",
        bach: "#22D3EE",
        thai: "#FDE047",
        khair: "#4ADE80"
      }[heroId] || "#38BDF8";
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 13, facing - 0.5, facing + 0.5);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function drawEnemyStatusVfx(ctx, enemy, elapsedTime, isMono, enableAdditive = true) {
  if (!enemy) return;
  let r = enemy.radius || 20;
  let ex = enemy.x || 0;
  let ey = enemy.y || 0;

  ctx.save();
  ctx.translate(ex, ey);
  if (!isMono && enableAdditive) {
    ctx.globalCompositeOperation = "lighter";
  }

  // 1. Long Hói Burn Escalation (1..9 orange embers -> 10..24 crimson molten rings -> 25..100 bright yellow-white flares)
  let burnStacks = enemy.longhoiBurnStacks || 0;
  if (burnStacks > 0) {
    let tier = burnStacks >= 25 ? 3 : burnStacks >= 10 ? 2 : 1;
    let isAmp = (enemy.longhoiBurnAmpTimer || 0) > 0;
    let flameCol = isMono ? "#FFFFFF" : tier === 3 ? "#FEF08A" : tier === 2 ? "#EF4444" : "#FB923C";
    let rimCol = isMono ? "#CBD5E1" : tier === 3 ? "#FFFFFF" : tier === 2 ? "#F97316" : "#EA580C";

    // Ground/collar thermal ring
    ctx.save();
    ctx.globalAlpha = tier === 3 ? 0.85 : tier === 2 ? 0.72 : 0.56;
    ctx.strokeStyle = rimCol;
    ctx.lineWidth = tier === 3 ? 3 : tier === 2 ? 2.2 : 1.5;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.52, r * 1.12, r * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Rising flame wisps / flare sparks around enemy silhouette
    let moteCount = tier === 3 ? 6 : tier === 2 ? 4 : 3;
    for (let mi = 0; mi < moteCount; mi++) {
      let ang = elapsedTime * (2.6 + tier * 1.1) + (Math.PI * 2 * mi) / moteCount;
      let mx = Math.cos(ang) * (r * 0.88);
      let my = Math.sin(ang) * (r * 0.45) - ((elapsedTime * 28 + mi * 9) % (r * 0.9));
      if (tier === 3) {
        drawFourPointStar(ctx, mx, my, isAmp ? 5.8 : 4.6, 1.5, "#FFFFFF", flameCol);
      } else {
        ctx.fillStyle = flameCol;
        ctx.beginPath();
        ctx.arc(mx, my, tier === 2 ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. Tin Crimson-Obsidian Ma Thạch Mark (replaces bare emoji with crisp geometric sigil)
  if (enemy.tin_hasMark) {
    ctx.save();
    ctx.translate(0, -r - 17);
    ctx.rotate(elapsedTime * 2.2);
    drawUltDiamondShard(ctx, 0, 0, 8.5, 4.5, 0, isMono ? "#FFFFFF" : "#F43F5E", isMono ? "#0F172A" : "#FFE4E6");
    drawUltDiamondShard(ctx, 0, 0, 8.5, 4.5, Math.PI / 2, isMono ? "#CBD5E1" : "#9F1239", "#FFFFFF");
    ctx.restore();
  } else if ((enemy.tin_hits || 0) > 0) {
    // Pre-mark hit pips (1..2)
    ctx.save();
    ctx.translate(0, -r - 16);
    for (let hi = 0; hi < Math.min(2, enemy.tin_hits); hi++) {
      let ox = (hi - 0.5) * 9;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FB7185";
      ctx.beginPath();
      ctx.arc(ox, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}


