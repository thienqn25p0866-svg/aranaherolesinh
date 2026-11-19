import { isCircleInViewBounds } from "./combatLogic";
import {
  INFERNO_MAP_WIDTH,
  INFERNO_MAP_HEIGHT,
  INFERNO_ZONES,
  INFERNO_INTERACTABLES,
  getActiveInfernoObstacles,
  getInfernoZoneAt,
  findNearestInfernoInteractable,
  findNearbyLockedGate,
} from "./infernoAshMap";

// Zero ctx.shadowBlur usage for steady 60fps Canvas 2D performance.
// Uses strictly ctxStub-safe Canvas 2D primitives.

function hashVal(ix, iy) {
  let n = Math.imul(ix + 53, 73856093) ^ Math.imul(iy + 97, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function getInfernoZoneLabel(x, y, lang = "vi") {
  const z = getInfernoZoneAt(x, y);
  return lang === "en" ? z.name.en : z.name.vi;
}

/**
 * Draws realistic interlocking forged metallic chain links between (x1, y1) and (x2, y2).
 * Alternates horizontal oval links with foreshortened cross-bar links + specular rim highlight.
 */
function drawForgedChain(ctx, x1, y1, x2, y2, linkLen = 8, colBody = "#78716C", colSpec = "#D6D3D1", isMono = false, sag = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const steps = Math.max(2, Math.round(dist / (linkLen * 0.78)));
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
    const py = y1 + dy * f + ny * arch + Math.abs(sag) * 0.25 * Math.sin(f * Math.PI);
    // Tangent angle accounting for catenary curve
    const dt = 0.02;
    const f2 = Math.min(1, f + dt);
    const f1 = Math.max(0, f - dt);
    const ax = x1 + dx * f2 + nx * (sag * Math.sin(f2 * Math.PI)) - (x1 + dx * f1 + nx * (sag * Math.sin(f1 * Math.PI)));
    const ay = y1 + dy * f2 + ny * (sag * Math.sin(f2 * Math.PI)) - (y1 + dy * f1 + ny * (sag * Math.sin(f1 * Math.PI)));
    const ang = Math.atan2(ay, ax);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);

    if (i % 2 === 0) {
      // Flat face-on oval chain link
      ctx.strokeStyle = "rgba(0,0,0,0.58)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(0, 1.2, linkLen * 0.56, linkLen * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#94A3B8" : colBody;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, linkLen * 0.56, linkLen * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Metallic rim catchlight on upper half of link
      ctx.strokeStyle = isMono ? "#F8FAFC" : colSpec;
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.ellipse(0, -0.4, linkLen * 0.48, linkLen * 0.26, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      // Edge-on interlocking perpendicular link
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.45, 1.0);
      ctx.lineTo(linkLen * 0.45, 1.0);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#CBD5E1" : colBody;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.45, 0);
      ctx.lineTo(linkLen * 0.45, 0);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : colSpec;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.32, -0.7);
      ctx.lineTo(linkLen * 0.32, -0.7);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Multi-layered organic Dark Fantasy fire with soot bed, S-curved writhing tongues,
 * incandescent core filament, and rising detached ember sparks.
 */
function drawRealisticFire(ctx, x, y, t, scale = 1, colorMode = "fire", seed = 0, allowGlows = false) {
  const s = seed || (x * 0.13 + y * 0.07);
  const pulse = 0.88 + 0.12 * Math.sin(t * 14.5 + s);
  const h = (18 + Math.sin(t * 10.3 + s) * 4.5 + Math.cos(t * 17.1 + s * 1.7) * 2.5) * scale;
  const sway1 = (Math.sin(t * 7.8 + s) * 3.8 + Math.cos(t * 13.4 + s) * 1.6) * scale;
  const sway2 = (Math.cos(t * 9.2 + s * 1.3) * 3.2) * scale;

  const isArcane = colorMode === "arcane";
  const cGlow0 = isArcane ? "rgba(168, 85, 247, 0.28)" : "rgba(234, 88, 12, 0.30)";
  const cGlow1 = isArcane ? "rgba(88, 28, 135, 0)" : "rgba(124, 45, 18, 0)";
  const cDeep = isArcane ? "#581C87" : "#991B1B";
  const cOuter = isArcane ? "#9333EA" : "#DC2626";
  const cMid = isArcane ? "#D946EF" : "#F97316";
  const cCore = isArcane ? "#F5D0FE" : "#FEF08A";

  ctx.save();
  ctx.translate(x, y);

  // Subtle warm radial ground bounce (anti-glare safe)
  if (allowGlows) {
    const rg = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, 26 * scale * pulse);
    rg.addColorStop(0, cGlow0);
    rg.addColorStop(1, cGlow1);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * scale * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // Charred ember/coal bed underneath base
  ctx.fillStyle = "rgba(12, 6, 5, 0.78)";
  ctx.beginPath();
  ctx.ellipse(0, 2 * scale, 9.5 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isArcane ? "#7E22CE" : "#EA580C";
  for (let c = -2; c <= 2; c++) {
    ctx.beginPath();
    ctx.arc(c * 2.8 * scale, (1.5 + (c % 2) * 1.2) * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer burnt-crimson turbulent jacket (asymmetric S-curve)
  ctx.fillStyle = cDeep;
  ctx.beginPath();
  ctx.moveTo(-7.2 * scale, 1 * scale);
  ctx.bezierCurveTo(-9.2 * scale, -h * 0.35, -3.5 * scale + sway2 * 0.6, -h * 0.68, sway1 * 1.08, -h * 1.05);
  ctx.bezierCurveTo(4.2 * scale + sway1 * 0.5, -h * 0.62, 8.8 * scale, -h * 0.3, 7.2 * scale, 1 * scale);
  ctx.closePath();
  ctx.fill();

  // Secondary side flame lick (breaks symmetry so it never looks plastic!)
  ctx.fillStyle = cOuter;
  ctx.beginPath();
  ctx.moveTo(-5.5 * scale, 0);
  ctx.bezierCurveTo(-8.4 * scale, -h * 0.28, -5.2 * scale + sway2, -h * 0.56, -2.5 * scale + sway2 * 1.2, -h * 0.78);
  ctx.bezierCurveTo(-1.0 * scale, -h * 0.45, 0, -h * 0.2, 2.2 * scale, 0);
  ctx.closePath();
  ctx.fill();

  // Right swirling flame ribbon
  ctx.fillStyle = cOuter;
  ctx.beginPath();
  ctx.moveTo(-2.5 * scale, 0.5 * scale);
  ctx.bezierCurveTo(-3.5 * scale, -h * 0.36, 4.5 * scale + sway1 * 0.5, -h * 0.66, sway1 * 0.85 + 1.8 * scale, -h * 0.94);
  ctx.bezierCurveTo(7.4 * scale, -h * 0.46, 6.2 * scale, -h * 0.2, 5.4 * scale, 0.5 * scale);
  ctx.closePath();
  ctx.fill();

  // Mid molten orange-amber plasma body
  ctx.fillStyle = cMid;
  ctx.beginPath();
  ctx.moveTo(-4.4 * scale, 0.5 * scale);
  ctx.bezierCurveTo(-5.2 * scale, -h * 0.32, -1.5 * scale + sway1 * 0.6, -h * 0.58, sway1 * 0.72, -h * 0.82);
  ctx.bezierCurveTo(3.2 * scale + sway2 * 0.4, -h * 0.48, 4.8 * scale, -h * 0.25, 4.2 * scale, 0.5 * scale);
  ctx.closePath();
  ctx.fill();

  // Narrow tapered golden-white inner heat core (not a flat ball!)
  ctx.fillStyle = cCore;
  ctx.beginPath();
  ctx.moveTo(-2.1 * scale, 0.2 * scale);
  ctx.bezierCurveTo(-2.6 * scale, -h * 0.22, sway1 * 0.35 - 0.8 * scale, -h * 0.42, sway1 * 0.45, -h * 0.54);
  ctx.bezierCurveTo(1.8 * scale, -h * 0.32, 2.3 * scale, -h * 0.16, 2.1 * scale, 0.2 * scale);
  ctx.closePath();
  ctx.fill();

  // Detached rising glowing ember sparks + flame wisp droplet
  for (let i = 0; i < 3; i++) {
    const phase = ((t * 1.35 + i * 0.34 + s * 0.19) % 1);
    const ex = sway1 * phase + Math.sin(t * 5 + i * 2.4 + s) * 4.5 * scale;
    const ey = -h * (0.45 + phase * 0.85);
    const er = (1 - phase) * (i === 0 ? 1.8 : 1.3) * scale;
    if (er > 0.25) {
      ctx.globalAlpha = Math.max(0, (1 - phase) * 0.88);
      ctx.fillStyle = i === 0 ? cCore : cMid;
      ctx.beginPath();
      ctx.moveTo(ex, ey - er * 1.4);
      ctx.lineTo(ex + er, ey);
      ctx.lineTo(ex, ey + er * 1.4);
      ctx.lineTo(ex - er, ey);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRisingSmokeCurl(ctx, x, y, t, scale = 1) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const phase = (t * 0.38 + i * 0.25 + x * 0.003) % 1;
    const sy = y - 12 * scale - phase * 48 * scale;
    const sx = x + Math.sin(phase * 6.5 + t * 2.2 + i * 1.4) * 8 * scale;
    const sr = (4.5 + phase * 10) * scale;
    ctx.globalAlpha = Math.max(0, (1 - phase) * 0.22);
    ctx.fillStyle = i % 2 === 0 ? "#292524" : "#44403C";
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Multi-branched jagged cloud-to-ground thunderbolt with plasma sheath,
 * forked sub-branches, ground scorch impact, and radiating ground discharge arcs.
 */
function drawRealisticLightningBolt(ctx, x, y, radius, timer, t, isMono) {
  const seed = Math.round(x * 0.7 + y * 1.3 + Math.floor(t * 28) * 19);
  const topX = x + ((seed % 37) - 18);
  const topY = y - 270;

  // Build 9 jagged primary bolt segments from cloud corona to ground
  const pts = [{ x: topX, y: topY }];
  const segs = 9;
  for (let i = 1; i < segs; i++) {
    const f = i / segs;
    const jitter = (hashVal(seed + i * 11, i * 29) - 0.5) * 44 * (1 - f * 0.45);
    pts.push({
      x: topX + (x - topX) * f + jitter,
      y: topY + (y - topY) * f,
    });
  }
  pts.push({ x, y });

  const traceMain = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";

  // Dark electrified scorch crater & crack ring on ground impact
  const craterAlpha = Math.max(0.25, Math.min(0.85, timer * 2.6));
  ctx.fillStyle = `rgba(10, 6, 4, ${craterAlpha * 0.65})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.55, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft electric rim ring (no blinding full-disk fill)
  ctx.strokeStyle = isMono ? "rgba(226,232,240,0.45)" : `rgba(250, 204, 21, ${craterAlpha * 0.55})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // Radiating jagged surface discharge arcs across the ground
  for (let k = 0; k < 6; k++) {
    const ang = (Math.PI * 2 * k) / 6 + hashVal(seed + k, 7) * 0.4;
    const r1 = radius * 0.38;
    const r2 = radius * (0.72 + hashVal(k, seed) * 0.3);
    const midA = ang + (k % 2 === 0 ? 0.22 : -0.22);
    ctx.strokeStyle = isMono ? "#CBD5E1" : k % 2 === 0 ? "#FDE047" : "#60A5FA";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(midA) * r1, y + Math.sin(midA) * r1 * 0.72);
    ctx.lineTo(x + Math.cos(ang) * r2, y + Math.sin(ang) * r2 * 0.72);
    ctx.stroke();

    ctx.strokeStyle = "#FFFBEB";
    ctx.lineWidth = 0.95;
    ctx.stroke();
  }

  // Upper storm-cloud ionization corona vortex
  ctx.fillStyle = isMono ? "rgba(226,232,240,0.22)" : "rgba(129, 140, 248, 0.26)";
  ctx.beginPath();
  ctx.ellipse(topX, topY, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pass 1: Wide outer ionized plasma aura
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#38BDF8";
  ctx.lineWidth = 13;
  traceMain();
  ctx.stroke();

  // Pass 2: Bright electric gold/cyan arc
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = isMono ? "#E2E8F0" : "#FACC15";
  ctx.lineWidth = 5.2;
  traceMain();
  ctx.stroke();

  // Pass 3: Razor incandescent filament core
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.1;
  traceMain();
  ctx.stroke();

  // 5 Forked Secondary & Tertiary Branches off main bolt vertices
  for (let b = 2; b < pts.length - 1; b++) {
    if (hashVal(seed + b * 3, 41) > 0.72) continue;
    const orig = pts[b];
    const side = b % 2 === 0 ? 1 : -1;
    const bAngle = Math.PI * 0.5 + side * (0.45 + hashVal(b, seed) * 0.55);
    const bLen = 36 + hashVal(seed, b * 17) * 52;
    const mX = orig.x + Math.cos(bAngle) * bLen * 0.52 + side * 8;
    const mY = orig.y + Math.sin(bAngle) * bLen * 0.52;
    const eX = orig.x + Math.cos(bAngle - side * 0.18) * bLen;
    const eY = orig.y + Math.sin(bAngle - side * 0.18) * bLen;

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#FDE047";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(orig.x, orig.y);
    ctx.lineTo(mX, mY);
    ctx.lineTo(eX, eY);
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Tertiary split tip
    ctx.strokeStyle = isMono ? "#94A3B8" : "#93C5FD";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mX, mY);
    ctx.lineTo(mX + side * 16, mY + 18);
    ctx.stroke();
  }

  // Sharp flash cross-star at strike contact
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#FFFBEB";
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x + 3.2, y - 3.2);
  ctx.lineTo(x + 11, y);
  ctx.lineTo(x + 3.2, y + 3.2);
  ctx.lineTo(x, y + 11);
  ctx.lineTo(x - 3.2, y + 3.2);
  ctx.lineTo(x - 11, y);
  ctx.lineTo(x - 3.2, y - 3.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawAshFootprintsTrail(ctx, x1, y1, x2, y2, count, tint, t, isMono) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const ang = Math.atan2(dy, dx);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const f = i / Math.max(1, count - 1);
    const side = i % 2 === 0 ? -7 : 7;
    const px = x1 + dx * f - Math.sin(ang) * side;
    const py = y1 + dy * f + Math.cos(ang) * side;
    const pulse = 0.28 + 0.14 * Math.sin(t * 2.5 + i);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = isMono ? "#CBD5E1" : tint;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function renderInfernoAshFloor(ctx, state, isMono, viewBounds, prof) {
  if (!state || state.activeMapId !== "inferno_ash") return;
  const rt = state.infernoRuntime;
  const prog = state.infernoProgress || {};
  const t = state.elapsedTime || 0;
  const allowGlows = Boolean(prof?.enableRadialGlows);

  // Base scorched volcanic slate ground
  ctx.fillStyle = isMono ? "#1C222E" : "#120B0A";
  ctx.fillRect(0, 0, INFERNO_MAP_WIDTH, INFERNO_MAP_HEIGHT);

  // Zone atmospheric ground tints & district stone paving
  for (const z of INFERNO_ZONES) {
    if (!isCircleInViewBounds(z.x + z.w * 0.5, z.y + z.h * 0.5, Math.max(z.w, z.h) * 0.75, viewBounds)) {
      continue;
    }
    ctx.save();
    let fillCol = "#160D0C";
    if (z.id === "zone_1") fillCol = "#18100E";
    else if (z.id === "zone_2") fillCol = "#1C100E";
    else if (z.id === "zone_3") fillCol = "#141016";
    else if (z.id === "zone_4") fillCol = "#1D0E0A";
    else if (z.id === "zone_5") fillCol = "#161414";
    else if (z.id === "zone_6") fillCol = "#170E11";
    else if (z.id === "zone_7") fillCol = "#0D0914";
    else if (z.id === "zone_8") fillCol = "#170912";
    ctx.fillStyle = isMono ? "#232B3A" : fillCol;
    ctx.fillRect(z.x + 2, z.y + 2, z.w - 4, z.h - 4);
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.2)" : "rgba(251, 146, 60, 0.08)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(z.x + 4, z.y + 4, z.w - 8, z.h - 8);
    ctx.restore();
  }

  // Ambient Volcanic District Halos (only when glows enabled)
  if (!isMono && allowGlows) {
    const halos = [
      { x: 280, y: 1860, r: 280, c0: "rgba(234, 88, 12, 0.18)", c1: "rgba(18, 11, 10, 0)" },
      { x: 280, y: 775, r: 260, c0: "rgba(220, 38, 38, 0.2)", c1: "rgba(18, 11, 10, 0)" },
      { x: 2022, y: 1265, r: 340, c0: "rgba(249, 115, 22, 0.2)", c1: "rgba(18, 11, 10, 0)" },
      { x: 1980, y: 480, r: 320, c0: "rgba(245, 158, 11, 0.16)", c1: "rgba(18, 11, 10, 0)" },
    ];
    for (const h of halos) {
      if (!isCircleInViewBounds(h.x, h.y, h.r, viewBounds)) continue;
      const g = ctx.createRadialGradient(h.x, h.y, 18, h.x, h.y, h.r);
      g.addColorStop(0, h.c0);
      g.addColorStop(1, h.c1);
      ctx.fillStyle = g;
      ctx.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2);
    }
  }

  // Staggered Running-Bond Charred Basalt Flagstones with District Character (culled to viewBounds)
  const tileW = 104;
  const tileH = 62;
  const rowStart = Math.max(0, Math.floor(viewBounds.minY / tileH));
  const rowEnd = Math.min(Math.ceil(INFERNO_MAP_HEIGHT / tileH) - 1, Math.ceil(viewBounds.maxY / tileH));

  for (let row = rowStart; row <= rowEnd; row++) {
    const y = row * tileH;
    const offset = row % 2 === 1 ? tileW * 0.5 : 0;
    const colStart = Math.max(-1, Math.floor((viewBounds.minX - offset) / tileW));
    const colEnd = Math.min(
      Math.ceil(INFERNO_MAP_WIDTH / tileW),
      Math.ceil((viewBounds.maxX - offset) / tileW)
    );

    for (let col = colStart; col <= colEnd; col++) {
      const x = col * tileW + offset;
      if (x + tileW <= 0 || x >= INFERNO_MAP_WIDTH) continue;
      const drawX = Math.max(16, x);
      const drawW = Math.min(INFERNO_MAP_WIDTH - 16, x + tileW) - drawX;
      const drawY = Math.max(16, y);
      const drawH = Math.min(INFERNO_MAP_HEIGHT - 16, y + tileH) - drawY;
      if (drawW <= 4 || drawH <= 4) continue;

      const hv = hashVal(col, row);
      const midX = drawX + drawW * 0.5;
      const midY = drawY + drawH * 0.5;

      if (isMono) {
        const shade = 28 + Math.floor(hv * 11);
        ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 12})`;
      } else {
        const inCrypt = midX <= 620 && midY >= 460 && midY <= 1120;
        const inTemple = midX >= 1650 && midY >= 960 && midY <= 1650;
        const inBastion = midX >= 1600 && midY <= 720;
        const inSanctum = midX >= 840 && midX <= 1460 && midY <= 980;

        let r = 22 + hv * 13;
        let g = 13 + hv * 8;
        let b = 12 + hv * 7;

        if (inCrypt) {
          r += 4;
          b += 8;
        } else if (inTemple) {
          r += 11;
          g += 3;
        } else if (inBastion) {
          r += 2;
          g += 8;
          b += 10;
        } else if (inSanctum) {
          r += 4;
          g -= 3;
          b += 13;
        }
        ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
      }
      ctx.fillRect(drawX + 1.5, drawY + 1.5, drawW - 3, drawH - 3);

      // Subtle basalt top-left rim bevel
      ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.1)" : "rgba(254, 215, 170, 0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + 2, drawY + drawH - 3);
      ctx.lineTo(drawX + 2, drawY + 2);
      ctx.lineTo(drawX + drawW - 3, drawY + 2);
      ctx.stroke();

      // Occasional imperial diamond floor inlay
      if (hv > 0.43 && hv < 0.48 && drawW >= 60 && drawH >= 42) {
        ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.12)" : "rgba(217, 119, 6, 0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(midX, drawY + 11);
        ctx.lineTo(midX + 12, midY);
        ctx.lineTo(midX, drawY + drawH - 11);
        ctx.lineTo(midX - 12, midY);
        ctx.closePath();
        ctx.stroke();
      }

      // Hairline glowing magma fissures (~12% of flagstones) & dark soot craters
      if (prof?.effectiveTier !== "saver") {
        if (hv > 0.88 && drawW > 42 && drawH > 30) {
          ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.2)" : "rgba(249, 115, 22, 0.24)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          const fx = drawX + drawW * (0.24 + ((hv * 5) % 0.34));
          const fy = drawY + drawH * 0.28;
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + 16, fy + 10);
          ctx.lineTo(fx + 9, fy + 22);
          ctx.stroke();
        } else if (hv > 0.72 && hv <= 0.79 && drawW > 50) {
          ctx.fillStyle = isMono ? "rgba(15, 23, 42, 0.22)" : "rgba(8, 3, 2, 0.34)";
          ctx.beginPath();
          ctx.ellipse(midX, midY, 16 * hv, 9 * hv, hv * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Scorched Imperial War Causeways connecting Districts
  const warRoads = [
    { x: 240, y: 1340, w: 120, h: 580 }, // Spawn -> West Avenue
    { x: 300, y: 1310, w: 1620, h: 100 }, // West-East Imperial Highway (Old Town -> Plaza -> Temple)
    { x: 1075, y: 360, w: 130, h: 950 }, // Plaza -> Zone 7 Four Chairs Gate
    { x: 1840, y: 560, w: 120, h: 750 }, // Wyrmfire Temple -> Bastion Approach
  ];
  for (const rd of warRoads) {
    if (
      rd.x + rd.w < viewBounds.minX - 40 ||
      rd.x > viewBounds.maxX + 40 ||
      rd.y + rd.h < viewBounds.minY - 40 ||
      rd.y > viewBounds.maxY + 40
    ) {
      continue;
    }
    const isHorizontal = rd.w > rd.h;
    ctx.save();
    ctx.fillStyle = isMono ? "rgba(41, 50, 66, 0.52)" : "rgba(28, 16, 14, 0.65)";
    ctx.fillRect(rd.x, rd.y, rd.w, rd.h);

    // Scorched crimson-bronze runner carpet inlay
    ctx.fillStyle = isMono ? "rgba(203, 213, 225, 0.08)" : "rgba(153, 27, 27, 0.22)";
    if (isHorizontal) {
      ctx.fillRect(rd.x, rd.y + 18, rd.w, rd.h - 36);
    } else {
      ctx.fillRect(rd.x + 20, rd.y, rd.w - 40, rd.h);
    }

    // Double bronze inner trim lines
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.24)" : "rgba(217, 119, 6, 0.3)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (isHorizontal) {
      ctx.moveTo(rd.x, rd.y + 12);
      ctx.lineTo(rd.x + rd.w, rd.y + 12);
      ctx.moveTo(rd.x, rd.y + rd.h - 12);
      ctx.lineTo(rd.x + rd.w, rd.y + rd.h - 12);
    } else {
      ctx.moveTo(rd.x + 13, rd.y);
      ctx.lineTo(rd.x + 13, rd.y + rd.h);
      ctx.moveTo(rd.x + rd.w - 13, rd.y);
      ctx.lineTo(rd.x + rd.w - 13, rd.y + rd.h);
    }
    ctx.stroke();

    // Basalt mortar cross seams every 56px
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.14)" : "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (isHorizontal) {
      for (let cx = rd.x + 56; cx < rd.x + rd.w; cx += 56) {
        ctx.moveTo(cx, rd.y + 2);
        ctx.lineTo(cx, rd.y + rd.h - 2);
      }
    } else {
      for (let cy = rd.y + 56; cy < rd.y + rd.h; cy += 56) {
        ctx.moveTo(rd.x + 2, cy);
        ctx.lineTo(rd.x + rd.w - 2, cy);
      }
    }
    ctx.stroke();

    // Embossed bronze-ember diamond medallions every 168px
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.25)" : "rgba(249, 115, 22, 0.34)";
    ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.22)" : "rgba(250, 204, 21, 0.32)";
    ctx.lineWidth = 1.3;
    if (isHorizontal) {
      const midY = rd.y + rd.h * 0.5;
      for (let mx = rd.x + 84; mx < rd.x + rd.w - 60; mx += 168) {
        if (Math.abs(mx - 980) < 200) continue; // skip Red Ash Plaza
        ctx.beginPath();
        ctx.moveTo(mx, midY - 13);
        ctx.lineTo(mx + 14, midY);
        ctx.lineTo(mx, midY + 13);
        ctx.lineTo(mx - 14, midY);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, midY, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const midX = rd.x + rd.w * 0.5;
      for (let my = rd.y + 84; my < rd.y + rd.h - 60; my += 168) {
        if (Math.abs(my - 775) < 250 && Math.abs(midX - 1090) < 260) continue; // skip Crater
        ctx.beginPath();
        ctx.moveTo(midX, my - 13);
        ctx.lineTo(midX + 14, my);
        ctx.lineTo(midX, my + 13);
        ctx.lineTo(midX - 14, my);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(midX, my, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(180, 83, 9, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rd.x, rd.y, rd.w, rd.h);
    ctx.restore();
  }

  // Fortified Outer City Battlements Border (stone courses + merlon teeth)
  ctx.save();
  ctx.strokeStyle = isMono ? "#334155" : "#291512";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, INFERNO_MAP_WIDTH - 16, INFERNO_MAP_HEIGHT - 16);
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#9A3412";
  ctx.lineWidth = 2.6;
  ctx.strokeRect(16, 16, INFERNO_MAP_WIDTH - 32, INFERNO_MAP_HEIGHT - 32);

  // Perimeter battlement merlons culled to viewBounds
  ctx.fillStyle = isMono ? "#475569" : "#3F211B";
  const mStep = 90;
  for (let mx = 48; mx < INFERNO_MAP_WIDTH - 48; mx += mStep) {
    if (mx + 26 >= viewBounds.minX && mx <= viewBounds.maxX) {
      if (viewBounds.minY <= 36) ctx.fillRect(mx, 2, 26, 12);
      if (viewBounds.maxY >= INFERNO_MAP_HEIGHT - 36) ctx.fillRect(mx, INFERNO_MAP_HEIGHT - 14, 26, 12);
    }
  }
  for (let my = 48; my < INFERNO_MAP_HEIGHT - 48; my += mStep) {
    if (my + 26 >= viewBounds.minY && my <= viewBounds.maxY) {
      if (viewBounds.minX <= 36) ctx.fillRect(2, my, 12, 26);
      if (viewBounds.maxX >= INFERNO_MAP_WIDTH - 36) ctx.fillRect(INFERNO_MAP_WIDTH - 14, my, 12, 26);
    }
  }
  ctx.restore();

  // Zone 2: Red Ash Plaza Stepped Octagonal War Plaza + Dragon-Spike Pylons + Phoenix Crest
  if (isCircleInViewBounds(980, 1350, 420, viewBounds)) {
    ctx.save();
    ctx.translate(980, 1350);
    if (!isMono && allowGlows) {
      const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 240);
      g.addColorStop(0, "rgba(239, 68, 68, 0.18)");
      g.addColorStop(1, "rgba(24, 12, 10, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 240, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stepped octagonal basalt War Plaza (r=208 & r=192)
    ctx.fillStyle = isMono ? "rgba(30, 41, 59, 0.56)" : "rgba(28, 12, 11, 0.65)";
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.42)" : "rgba(234, 88, 12, 0.48)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8 + Math.PI / 8;
      const rx = Math.cos(a) * 208;
      const ry = Math.sin(a) * 208;
      if (k === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.28)" : "rgba(251, 146, 60, 0.36)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8 + Math.PI / 8;
      const rx = Math.cos(a) * 192;
      const ry = Math.sin(a) * 192;
      if (k === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();

    // 24 perimeter rune notches & 8 bronze dragon-spike corner pylons
    ctx.strokeStyle = isMono ? "rgba(203,213,225,0.35)" : "rgba(248, 113, 113, 0.38)";
    ctx.lineWidth = 1.5;
    for (let n = 0; n < 24; n++) {
      const na = (Math.PI * 2 * n) / 24;
      ctx.beginPath();
      ctx.moveTo(Math.cos(na) * 176, Math.sin(na) * 176);
      ctx.lineTo(Math.cos(na) * 188, Math.sin(na) * 188);
      ctx.stroke();
    }
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8 + Math.PI / 8;
      const px = Math.cos(a) * 202;
      const py = Math.sin(a) * 202;
      ctx.fillStyle = isMono ? "#475569" : "#451A03";
      ctx.strokeStyle = isMono ? "#E2E8F0" : "#F59E0B";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Counter-rotating scorched ember compass rings
    ctx.save();
    ctx.rotate(t * 0.12);
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.34)" : "rgba(248, 113, 113, 0.32)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, 158, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-t * 0.2);
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.26)" : "rgba(250, 204, 21, 0.3)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 125, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    // Engraved phoenix crest lines inside r=125
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.24)" : "rgba(251, 146, 60, 0.28)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -82);
    ctx.lineTo(18, -18);
    ctx.lineTo(82, 0);
    ctx.lineTo(18, 18);
    ctx.lineTo(0, 82);
    ctx.lineTo(-18, 18);
    ctx.lineTo(-82, 0);
    ctx.lineTo(-18, -18);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    drawAshFootprintsTrail(ctx, 880, 1320, 520, 1080, 10, "#FACC15", t, isMono);
    drawAshFootprintsTrail(ctx, 1120, 1345, 1650, 1320, 12, "#FB923C", t + 1, isMono);
  }

  // Zone 3: Lightning runes & old dried crimson stains in Hầm Hiến Tế
  if (isCircleInViewBounds(280, 790, 340, viewBounds)) {
    ctx.save();
    ctx.fillStyle = isMono ? "rgba(15, 23, 42, 0.45)" : "rgba(127, 29, 29, 0.36)";
    ctx.beginPath();
    ctx.ellipse(275, 795, 135, 72, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(250, 204, 21, 0.38)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(280, 775, 98, 0, Math.PI * 2);
    ctx.stroke();
    // Carved lightning sigil spokes around ritual ring
    for (let s = 0; s < 6; s++) {
      const a = (Math.PI / 3) * s;
      ctx.beginPath();
      ctx.moveTo(280 + Math.cos(a) * 86, 775 + Math.sin(a) * 86);
      ctx.lineTo(280 + Math.cos(a) * 108, 775 + Math.sin(a) * 108);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Zone 4: Wyrmfire Temple Crimson-Gold Sanctuary Runner & Scorched Ritual Mosaic
  if (isCircleInViewBounds(2020, 1270, 320, viewBounds)) {
    ctx.save();
    // Crimson-gold temple carpet runner (1860..2180, 1220..1310)
    ctx.fillStyle = isMono ? "rgba(71, 85, 105, 0.28)" : "rgba(127, 29, 29, 0.45)";
    ctx.fillRect(1860, 1220, 320, 90);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#F59E0B";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(1860, 1220, 320, 90);
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(251, 146, 60, 0.55)";
    ctx.lineWidth = 1.1;
    ctx.strokeRect(1866, 1226, 308, 78);

    ctx.translate(2022, 1265);
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(251, 146, 60, 0.38)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(0.4);
    ctx.strokeRect(-95, -95, 190, 190);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-95, -95, 190, 190);
    // 4 glowing ember corner glyphs
    ctx.fillStyle = isMono ? "#E2E8F0" : "#FB923C";
    for (const [gx, gy] of [[-110, -110], [110, -110], [-110, 110], [110, 110]]) {
      ctx.beginPath();
      ctx.arc(gx, gy, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Zone 5: Pháo Đài Thiên Hỏa Steel Deck Plating, Hazard Stripes & Rail Launch Pad
  if (isCircleInViewBounds(1980, 480, 480, viewBounds)) {
    ctx.save();
    // Riveted steel deck apron framing missile launch bay
    ctx.fillStyle = isMono ? "rgba(51, 65, 85, 0.35)" : "rgba(24, 28, 34, 0.55)";
    ctx.fillRect(1660, 355, 660, 180);
    ctx.strokeStyle = isMono ? "#94A3B8" : "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(1660, 355, 660, 180);

    // Amber-black industrial diagonal hazard bands along top/bottom bay rims
    ctx.fillStyle = isMono ? "rgba(203, 213, 225, 0.22)" : "rgba(245, 158, 11, 0.28)";
    for (let hx = 1668; hx < 2305; hx += 28) {
      ctx.fillRect(hx, 357, 14, 7);
      ctx.fillRect(hx, 526, 14, 7);
    }

    ctx.strokeStyle = isMono ? "#64748B" : "#292524";
    ctx.lineWidth = 4;
    for (let rx = 1655; rx <= 2315; rx += 22) {
      ctx.beginPath();
      ctx.moveTo(rx, 416);
      ctx.lineTo(rx, 458);
      ctx.stroke();
    }
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(1640, 425);
    ctx.lineTo(2330, 425);
    ctx.moveTo(1640, 449);
    ctx.lineTo(2330, 449);
    ctx.stroke();
    ctx.restore();
  }

  // Zone 7: Chamber of Four Chairs Obsidian-Royal Velvet Carpet & Subterranean Ring
  if (isCircleInViewBounds(1140, 220, 360, viewBounds)) {
    ctx.save();
    ctx.translate(1140, 225);
    if (!isMono && allowGlows) {
      const vg = ctx.createRadialGradient(0, 0, 12, 0, 0, 175);
      vg.addColorStop(0, prog.trungTriggered ? "rgba(168, 85, 247, 0.28)" : "rgba(192, 132, 252, 0.16)");
      vg.addColorStop(1, "rgba(13, 9, 20, 0)");
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.arc(0, 0, 175, 0, Math.PI * 2);
      ctx.fill();
    }
    // Obsidian-royal velvet carpet runner
    ctx.fillStyle = isMono ? "rgba(51, 65, 85, 0.35)" : "rgba(46, 16, 101, 0.42)";
    ctx.fillRect(-130, -110, 260, 210);
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(168, 85, 247, 0.45)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-130, -110, 260, 210);

    // 4 faint violet ritual rune sockets at carpet corners
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(216, 180, 254, 0.48)";
    for (const [sx, sy] of [[-112, -92], [112, -92], [-112, 82], [112, 82]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(192, 132, 252, 0.42)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 118, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Zone 8: Miệng Vực Tận Hỏa Giant Meteor Crater + Orbiting Obsidian Shards + Molten Core & Magma Motes
  if (isCircleInViewBounds(1090, 775, 420, viewBounds)) {
    const corePulse = 0.72 + 0.28 * Math.sin(t * 3.4);
    ctx.save();
    ctx.translate(1090, 775);
    if (!isMono && allowGlows) {
      const cg = ctx.createRadialGradient(0, 0, 40, 0, 0, 290);
      cg.addColorStop(0, "rgba(168, 85, 247, 0.26)");
      cg.addColorStop(0.5, "rgba(220, 38, 38, 0.24)");
      cg.addColorStop(1, "rgba(15, 7, 10, 0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, 290, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glowing undulating inner molten/void core (r=42)
    ctx.fillStyle = isMono ? "rgba(71, 85, 105, 0.65)" : `rgba(192, 38, 211, ${0.28 * corePulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 42 + Math.sin(t * 2.8) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "rgba(148, 163, 184, 0.5)" : `rgba(249, 115, 22, ${0.42 * corePulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    for (let ring = 0; ring < 3; ring++) {
      ctx.strokeStyle = isMono ? "#94A3B8" : ring === 0 ? "rgba(244, 63, 94, 0.45)" : ring === 1 ? "rgba(249, 115, 22, 0.34)" : "rgba(192, 132, 252, 0.3)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 115 + ring * 68, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Jagged dark obsidian caldera rim shards orbiting slowly
    for (let sh = 0; sh < 8; sh++) {
      const ang = (Math.PI * 2 * sh) / 8 + t * 0.12;
      const rad = sh % 2 === 0 ? 152 : 215;
      ctx.save();
      ctx.rotate(ang);
      ctx.translate(rad, 0);
      ctx.fillStyle = isMono ? "#334155" : "#1F122B";
      ctx.strokeStyle = isMono ? "#CBD5E1" : sh % 2 === 0 ? "#F97316" : "#C084FC";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Jagged magma fracture lines radiating from crater core + animated lava energy motes
    for (let k = 0; k < 8; k++) {
      const ang = (Math.PI * 2 * k) / 8 + 0.2;
      ctx.strokeStyle = isMono ? "#64748B" : k % 2 === 0 ? "rgba(249, 115, 22, 0.52)" : "rgba(192, 132, 252, 0.46)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 45, Math.sin(ang) * 45);
      ctx.lineTo(Math.cos(ang + 0.08) * 145, Math.sin(ang + 0.08) * 145);
      ctx.lineTo(Math.cos(ang - 0.04) * 245, Math.sin(ang - 0.04) * 245);
      ctx.stroke();

      const mf = (t * 0.5 + k * 0.17) % 1;
      const mr = 48 + mf * 195;
      ctx.fillStyle = isMono ? "#E2E8F0" : k % 2 === 0 ? "#FDBA74" : "#E879F9";
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * mr, Math.sin(ang) * mr, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (!rt) return;

  // Collapsible Stone Bridges (Detailed masonry slabs + iron parapet rails)
  for (const br of rt.collapsibleBridges || []) {
    if (!isCircleInViewBounds(br.x + br.w * 0.5, br.y + br.h * 0.5, 130, viewBounds)) continue;
    ctx.save();
    const shakeX = br.state === "shaking" ? Math.sin(t * 48) * 3.5 : 0;
    const shakeY = br.state === "shaking" ? Math.cos(t * 41) * 2.5 : 0;
    if (br.state === "collapsed") {
      ctx.fillStyle = isMono ? "#0F172A" : "#070304";
      ctx.fillRect(br.x, br.y, br.w, br.h);
      ctx.strokeStyle = isMono ? "#475569" : "#EA580C";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(br.x, br.y, br.w, br.h);
      ctx.setLineDash([]);
      ctx.fillStyle = isMono ? "rgba(148,163,184,0.2)" : "rgba(234, 88, 12, 0.24)";
      ctx.fillRect(br.x + 10, br.y + 10, br.w - 20, br.h - 20);
      drawRealisticFire(ctx, br.x + br.w * 0.5, br.y + br.h * 0.55, t, 0.85, "fire", br.x, allowGlows);
    } else {
      ctx.translate(shakeX, shakeY);
      ctx.fillStyle = isMono ? "#475569" : br.state === "shaking" ? "#57534E" : "#382E29";
      ctx.fillRect(br.x, br.y, br.w, br.h);
      // Stone plank joints
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1.4;
      const step = 20;
      if (br.axis === "h") {
        for (let sx = br.x + step; sx < br.x + br.w; sx += step) {
          ctx.beginPath();
          ctx.moveTo(sx, br.y);
          ctx.lineTo(sx, br.y + br.h);
          ctx.stroke();
        }
      } else {
        for (let sy = br.y + step; sy < br.y + br.h; sy += step) {
          ctx.beginPath();
          ctx.moveTo(br.x, sy);
          ctx.lineTo(br.x + br.w, sy);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = isMono ? "#CBD5E1" : br.state === "shaking" ? "#F97316" : "#78716C";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(br.x, br.y, br.w, br.h);
      if (br.state === "shaking") {
        ctx.strokeStyle = "#FDBA74";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(br.x + 8, br.y + 8);
        ctx.lineTo(br.x + br.w * 0.52, br.y + br.h * 0.5);
        ctx.lineTo(br.x + br.w - 8, br.y + br.h - 8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Hazard 6: Zone 8 Unstable Arcane Zones (red/violet DoT + slow pools)
  for (const arc of rt.unstableArcaneZones || []) {
    if (!isCircleInViewBounds(arc.x, arc.y, arc.radius + 30, viewBounds)) continue;
    ctx.save();
    ctx.translate(arc.x, arc.y);
    if (!isMono && allowGlows) {
      const ag = ctx.createRadialGradient(0, 0, 8, 0, 0, arc.radius);
      ag.addColorStop(0, "rgba(225, 29, 72, 0.32)");
      ag.addColorStop(0.55, "rgba(147, 51, 234, 0.26)");
      ag.addColorStop(1, "rgba(88, 28, 135, 0)");
      ctx.fillStyle = ag;
    } else {
      ctx.fillStyle = "rgba(147, 51, 234, 0.2)";
    }
    ctx.beginPath();
    ctx.arc(0, 0, arc.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(t * 1.4 + arc.phase);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#E879F9";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, arc.radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Hazard 2: Fire Fissures (volcanic cracked earth -> molten glow -> realistic turbulent eruption)
  for (const ff of rt.fireFissures || []) {
    const cx = ff.x + ff.w * 0.5;
    const cy = ff.y + ff.h * 0.5;
    if (!isCircleInViewBounds(cx, cy, ff.w, viewBounds)) continue;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ff.angle || 0);

    // Jagged dark volcanic crack trench
    ctx.fillStyle = isMono ? "#1E293B" : "#090403";
    ctx.beginPath();
    ctx.moveTo(-ff.w * 0.5, -3);
    ctx.lineTo(-ff.w * 0.24, -7);
    ctx.lineTo(0, -4);
    ctx.lineTo(ff.w * 0.28, -8);
    ctx.lineTo(ff.w * 0.5, -2);
    ctx.lineTo(ff.w * 0.46, 5);
    ctx.lineTo(ff.w * 0.16, 8);
    ctx.lineTo(-ff.w * 0.18, 4);
    ctx.lineTo(-ff.w * 0.48, 7);
    ctx.closePath();
    ctx.fill();

    // Glowing magma fissure seam inside trench
    ctx.strokeStyle = isMono ? "#94A3B8" : ff.state === "dormant" ? "#7C2D12" : "#F97316";
    ctx.lineWidth = ff.state === "erupt" ? 3.2 : 1.6;
    ctx.beginPath();
    ctx.moveTo(-ff.w * 0.46, 0);
    ctx.lineTo(-ff.w * 0.2, -3);
    ctx.lineTo(ff.w * 0.05, 2);
    ctx.lineTo(ff.w * 0.3, -2);
    ctx.lineTo(ff.w * 0.46, 1);
    ctx.stroke();

    if (ff.state === "glow") {
      const pulse = 0.45 + 0.35 * Math.sin(t * 16);
      ctx.fillStyle = `rgba(249, 115, 22, ${pulse * 0.45})`;
      ctx.fillRect(-ff.w * 0.5, -13, ff.w, 26);
      ctx.strokeStyle = "#FDBA74";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-ff.w * 0.5, -13, ff.w, 26);
    } else if (ff.state === "erupt") {
      ctx.fillStyle = "rgba(185, 28, 28, 0.38)";
      ctx.beginPath();
      ctx.ellipse(0, 0, ff.w * 0.52, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let k = -2; k <= 2; k++) {
        drawRealisticFire(ctx, k * (ff.w * 0.19), 3, t + k * 0.55, 1.32, "fire", k * 17 + ff.x, allowGlows);
      }
    }
    ctx.restore();
  }

  // Hazard 1: Lightning Strike Telegraphs & Realistic Forked Strikes
  for (const lt of rt.lightningStrikes || []) {
    if (!isCircleInViewBounds(lt.x, lt.y, lt.radius + 50, viewBounds)) continue;
    if (lt.state === "telegraph") {
      const progRatio = Math.max(0, Math.min(1, 1 - lt.timer / 1.2));
      ctx.save();
      ctx.translate(lt.x, lt.y);
      ctx.fillStyle = "rgba(239, 68, 68, 0.16)";
      ctx.beginPath();
      ctx.arc(0, 0, lt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      // Contracting static charge ring + crackling electric rim arcs
      const innerR = Math.max(6, lt.radius * (1 - progRatio));
      ctx.strokeStyle = "#FEF08A";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.stroke();
      for (let s = 0; s < 4; s++) {
        const a = t * 6 + (Math.PI * 0.5) * s;
        ctx.strokeStyle = s % 2 === 0 ? "#FDE047" : "#93C5FD";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
        ctx.lineTo(Math.cos(a + 0.15) * (innerR + 9), Math.sin(a + 0.15) * (innerR + 9));
        ctx.stroke();
      }
      ctx.restore();
    } else if (lt.state === "flash") {
      drawRealisticLightningBolt(ctx, lt.x, lt.y, lt.radius, lt.timer, t, isMono);
    }
  }
}

/**
 * Draws staggered running-bond masonry courses on top face and 2.5D southern facade,
 * with weathered cracks, corner iron brackets, and edge highlight bevel.
 */
function drawDetailedStoneMasonry(ctx, x, y, w, h, faceH, topCol, faceCol, strokeCol, isMono, seed = 0) {
  // Base vertical facade & top parapet cap
  ctx.fillStyle = faceCol;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = topCol;
  ctx.fillRect(x + 1, y + 1, Math.max(2, w - 2), Math.max(2, h - faceH));

  const topH = Math.max(4, h - faceH);
  const mortarCol = isMono ? "rgba(15, 23, 42, 0.45)" : "rgba(0, 0, 0, 0.48)";
  const bevelCol = isMono ? "rgba(255, 255, 255, 0.24)" : "rgba(255, 237, 213, 0.14)";

  // Staggered running-bond ashlar brick courses on top cap
  ctx.strokeStyle = mortarCol;
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
  // Divider ridge between parapet top & southern 2.5D vertical face
  ctx.moveTo(x, y + h - faceH);
  ctx.lineTo(x + w, y + h - faceH);

  // Vertical brick seams along southern 2.5D facade
  for (let bx = x + 22; bx < x + w - 10; bx += 26) {
    ctx.moveTo(bx, y + h - faceH);
    ctx.lineTo(bx, y + h - 1);
  }
  ctx.stroke();

  // Subtle individual stone shading variation + weathered fracture cracks
  const blockCols = Math.max(1, Math.floor(w / 48));
  for (let i = 0; i < blockCols; i++) {
    const hv = hashVal(Math.round(x + i * 31 + seed), Math.round(y));
    if (hv > 0.62) {
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.fillRect(x + 4 + i * (w / blockCols), y + 4, (w / blockCols) * 0.5, Math.min(10, topH * 0.45));
    }
    if (hv > 0.72 && w >= 40 && topH >= 18) {
      const cx = x + 14 + (w - 28) * hv;
      const cy = y + 6 + (topH - 12) * ((hv * 3.7) % 1);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 4);
      ctx.lineTo(cx, cy + 1);
      ctx.lineTo(cx + 8, cy - 2);
      ctx.stroke();
    }
  }

  // Top edge rim bevel highlight
  ctx.strokeStyle = bevelCol;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.lineTo(x + w - 2, y + 2);
  ctx.stroke();

  // Crisp outer silhouette border
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 1.9;
  ctx.strokeRect(x, y, w, h);
}

function drawInfernoObstacleBlock(ctx, ob, t, isMono, rt, allowGlows) {
  ctx.save();
  // Ground cast shadow (south-east drop shadow)
  ctx.fillStyle = "rgba(0,0,0,0.54)";
  ctx.fillRect(ob.x + 6, ob.y + 8, ob.w, ob.h);

  const faceH = Math.min(14, Math.max(7, Math.round(ob.h * 0.24)));

  if (ob.kind === "bunker_wall") {
    // Riveted military reinforced bunker wall / launch pad / control station
    const isPad = ob.id === "k5_pad_1" || ob.id === "k5_pad_2";
    const isConsoleBox = ob.id === "k5_console_box";
    ctx.fillStyle = isMono ? "#1E293B" : "#14181D";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    ctx.fillStyle = isMono ? "#334155" : "#272D35";
    ctx.fillRect(ob.x + 2, ob.y + 2, ob.w - 4, Math.max(4, ob.h - faceH));

    // Steel plate seams & rivets
    ctx.strokeStyle = isMono ? "#475569" : "#111418";
    ctx.lineWidth = 1.5;
    if (ob.w >= ob.h) {
      for (let px = ob.x + 36; px < ob.x + ob.w - 14; px += 36) {
        ctx.beginPath();
        ctx.moveTo(px, ob.y + 2);
        ctx.lineTo(px, ob.y + ob.h - 2);
        ctx.stroke();
      }
    } else {
      for (let py = ob.y + 36; py < ob.y + ob.h - 14; py += 36) {
        ctx.beginPath();
        ctx.moveTo(ob.x + 2, py);
        ctx.lineTo(ob.x + ob.w - 2, py);
        ctx.stroke();
      }
    }

    // Steel rivets along corners
    ctx.fillStyle = isMono ? "#CBD5E1" : "#94A3B8";
    for (const [rx, ry] of [
      [ob.x + 5, ob.y + 5],
      [ob.x + ob.w - 8, ob.y + 5],
      [ob.x + 5, ob.y + ob.h - faceH - 4],
      [ob.x + ob.w - 8, ob.y + ob.h - faceH - 4],
    ]) {
      ctx.fillRect(rx, ry, 2.6, 2.6);
    }

    if (isPad) {
      // Missile Launch Pad: octagonal blast pit + hazard stripes + clamps
      const cx = ob.x + ob.w * 0.5;
      const cy = ob.y + ob.h * 0.48;
      ctx.strokeStyle = isMono ? "#CBD5E1" : "#F59E0B";
      ctx.lineWidth = 2;
      ctx.strokeRect(ob.x + 7, ob.y + 7, ob.w - 14, ob.h - 14);
      ctx.fillStyle = "#0B0D10";
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#94A3B8" : "#EA580C";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      // Vent grate crossbars + faint warning core
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx + 12, cy);
      ctx.moveTo(cx, cy - 12);
      ctx.lineTo(cx, cy + 12);
      ctx.stroke();
      ctx.fillStyle = isMono ? "#F8FAFC" : `rgba(249, 115, 22, ${0.55 + 0.35 * Math.sin(t * 5)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isConsoleBox) {
      // Heavy server rack louvers
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(ob.x + 8, ob.y + 7, ob.w - 16, ob.h - 16);
      ctx.fillStyle = isMono ? "#CBD5E1" : "#22C55E";
      ctx.fillRect(ob.x + 11, ob.y + 10, 6, 3);
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(ob.x + 20, ob.y + 10, 6, 3);
    } else {
      // Rust/soot streaks + observation slits
      ctx.fillStyle = isMono ? "#0F172A" : "#0A0C0E";
      if (ob.w > 90) {
        for (let sx = ob.x + 30; sx < ob.x + ob.w - 30; sx += 64) {
          ctx.fillRect(sx, ob.y + ob.h - faceH + 2, 18, 4);
        }
      }
    }

    ctx.strokeStyle = isMono ? "#CBD5E1" : "#64748B";
    ctx.lineWidth = 2;
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
  } else if (ob.kind === "bookshelf") {
    // Charred oak library shelves packed with colored & burned book spines
    ctx.fillStyle = isMono ? "#2B3444" : "#24130D";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    ctx.fillStyle = isMono ? "#3B475C" : "#3E2016";
    ctx.fillRect(ob.x + 3, ob.y + 3, ob.w - 6, ob.h - 6);

    const horizontal = ob.w >= ob.h;
    const bookColors = ["#7F1D1D", "#9A3412", "#1E3A8A", "#713F12", "#3F3F46", "#831843"];
    if (horizontal) {
      let bx = ob.x + 6;
      let bi = 0;
      while (bx < ob.x + ob.w - 10) {
        const bw = 4 + (bi % 3);
        const burned = hashVal(Math.round(bx), ob.y) > 0.72;
        ctx.fillStyle = isMono ? "#CBD5E1" : burned ? "#1C1917" : bookColors[bi % bookColors.length];
        ctx.fillRect(bx, ob.y + 5, bw, ob.h - 11);
        ctx.fillStyle = "rgba(255,245,220,0.22)";
        ctx.fillRect(bx, ob.y + 6, 1, ob.h - 13);
        bx += bw + (bi % 4 === 2 ? 3 : 1);
        bi++;
      }
    } else {
      let by = ob.y + 6;
      let bi = 0;
      while (by < ob.y + ob.h - 10) {
        const bh = 4 + (bi % 3);
        const burned = hashVal(ob.x, Math.round(by)) > 0.72;
        ctx.fillStyle = isMono ? "#CBD5E1" : burned ? "#1C1917" : bookColors[bi % bookColors.length];
        ctx.fillRect(ob.x + 5, by, ob.w - 10, bh);
        by += bh + (bi % 4 === 2 ? 3 : 1);
        bi++;
      }
    }
    ctx.strokeStyle = isMono ? "#94A3B8" : "#9A3412";
    ctx.lineWidth = 2;
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
  } else if (ob.kind === "cart_wreck") {
    // Recognizable charred timber supply wagon with iron-rimmed spoked wheels & axle
    const cx = ob.x + ob.w * 0.5;
    const cy = ob.y + ob.h * 0.5;

    // Two protruding wooden pull shafts
    ctx.strokeStyle = isMono ? "#94A3B8" : "#451A03";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ob.x + ob.w - 4, cy - 8);
    ctx.lineTo(ob.x + ob.w + 14, cy - 6);
    ctx.moveTo(ob.x + ob.w - 4, cy + 8);
    ctx.lineTo(ob.x + ob.w + 11, cy + 12);
    ctx.stroke();

    // Two iron-rimmed spoked wheels (top & bottom edges)
    for (const wy of [ob.y - 3, ob.y + ob.h + 3]) {
      const wx = ob.x + ob.w * 0.38;
      ctx.fillStyle = "#0F0907";
      ctx.beginPath();
      ctx.ellipse(wx, wy, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = isMono ? "#94A3B8" : "#9A3412";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(wx - 9, wy);
      ctx.lineTo(wx + 9, wy);
      ctx.moveTo(wx, wy - 3.5);
      ctx.lineTo(wx, wy + 3.5);
      ctx.stroke();
    }

    // Charred wooden wagon bed + plank slats
    ctx.fillStyle = isMono ? "#334155" : "#271710";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    ctx.strokeStyle = "#110906";
    ctx.lineWidth = 1.4;
    for (let py = ob.y + 8; py < ob.y + ob.h - 4; py += 8) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 3, py);
      ctx.lineTo(ob.x + ob.w - 3, py);
      ctx.stroke();
    }
    // Iron corner bands
    ctx.fillStyle = isMono ? "#CBD5E1" : "#57534E";
    ctx.fillRect(ob.x, ob.y, 7, ob.h);
    ctx.fillRect(ob.x + ob.w - 7, ob.y, 7, ob.h);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#C2410C";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

    // Smoldering realistic fire & rising soot curls inside wagon bed
    drawRisingSmokeCurl(ctx, cx - 4, ob.y + 8, t, 1.0);
    drawRealisticFire(ctx, cx - 4, ob.y + 12, t, 0.92, "fire", ob.x, allowGlows);
  } else if (ob.kind === "destructible_wall") {
    const dw = rt?.destructibles?.find((d) => d.id === ob.destructibleId);
    const bodyCol = dw && dw.hitFlash > 0 ? "#9A3412" : "#332018";
    const topCol = dw && dw.hitFlash > 0 ? "#C2410C" : "#4A2E22";
    drawDetailedStoneMasonry(
      ctx,
      ob.x,
      ob.y,
      ob.w,
      ob.h,
      faceH,
      isMono ? "#475569" : topCol,
      isMono ? "#334155" : bodyCol,
      isMono ? "#FFFFFF" : "#F97316",
      isMono,
      19
    );

    // Glowing molten magma veins surging through cracked masonry seams
    const pulse = 0.65 + 0.35 * Math.sin(t * 6.5 + ob.x * 0.02);
    ctx.strokeStyle = isMono ? "#CBD5E1" : `rgba(251, 146, 60, ${pulse})`;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(ob.x + ob.w * 0.12, ob.y + ob.h * 0.24);
    ctx.lineTo(ob.x + ob.w * 0.45, ob.y + ob.h * 0.56);
    ctx.lineTo(ob.x + ob.w * 0.86, ob.y + ob.h * 0.32);
    ctx.moveTo(ob.x + ob.w * 0.45, ob.y + ob.h * 0.56);
    ctx.lineTo(ob.x + ob.w * 0.65, ob.y + ob.h * 0.88);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (dw && dw.hp < dw.maxHp) {
      const barW = Math.min(68, ob.w);
      ctx.fillStyle = "rgba(0,0,0,0.84)";
      ctx.fillRect(ob.x + ob.w * 0.5 - barW * 0.5, ob.y - 11, barW, 5.5);
      ctx.fillStyle = "#F97316";
      ctx.fillRect(ob.x + ob.w * 0.5 - barW * 0.5, ob.y - 11, barW * (dw.hp / dw.maxHp), 5.5);
    }
  } else if (ob.kind === "locked_gate") {
    const isArcaneGate = ob.gateId === "gate_four_chairs";
    const isHorizontal = ob.w >= ob.h;
    const cx = ob.x + ob.w * 0.5;
    const cy = ob.y + ob.h * 0.5;
    const accent = isArcaneGate ? "#C084FC" : "#F59E0B";

    // Dark iron portcullis base frame
    ctx.fillStyle = isMono ? "#1E293B" : "#160F13";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

    // Stone gatepost end-caps + forged wrought-iron bars & crossbeam
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#94A3B8";
    ctx.lineWidth = 2.8;
    const count = 7;
    for (let i = 1; i < count; i++) {
      ctx.beginPath();
      if (isHorizontal) {
        const bx = ob.x + (ob.w * i) / count;
        ctx.moveTo(bx, ob.y + 2);
        ctx.lineTo(bx, ob.y + ob.h - 2);
      } else {
        const by = ob.y + (ob.h * i) / count;
        ctx.moveTo(ob.x + 2, by);
        ctx.lineTo(ob.x + ob.w - 2, by);
      }
      ctx.stroke();
    }

    // Horizontal/Vertical riveted crossbar across portcullis
    ctx.fillStyle = isMono ? "#475569" : "#292524";
    if (isHorizontal) {
      ctx.fillRect(ob.x, cy - 4, ob.w, 8);
      ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(ob.x, cy - 4, ob.w, 8);
    } else {
      ctx.fillRect(cx - 4, ob.y, 8, ob.h);
      ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(cx - 4, ob.y, 8, ob.h);
    }

    // Draped heavy forged chains binding gate ends to center lock
    const chainHighlight = isArcaneGate ? "#E9D5FF" : "#FDE68A";
    const chainMetal = isArcaneGate ? "#9333EA" : "#94A3B8";
    drawForgedChain(ctx, ob.x + 6, ob.y + 6, cx, cy, 7.5, chainMetal, chainHighlight, isMono, 4);
    drawForgedChain(ctx, ob.x + ob.w - 6, ob.y + ob.h - 6, cx, cy, 7.5, chainMetal, chainHighlight, isMono, -4);

    ctx.strokeStyle = isMono ? "#FFFFFF" : accent;
    ctx.lineWidth = 2.4;
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

    // Center unmistakable Padlock housing with U-shackle & keyhole (or 3-sigil seal for Zone 7)
    ctx.save();
    ctx.translate(cx, cy);
    // U-shackle loop
    ctx.strokeStyle = isMono ? "#E2E8F0" : accent;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, -5, 6.5, Math.PI, 0);
    ctx.stroke();
    // Lock body
    ctx.fillStyle = isMono ? "#0F172A" : isArcaneGate ? "#2E1065" : "#451A03";
    ctx.fillRect(-9, -4, 18, 15);
    ctx.strokeStyle = isMono ? "#FFFFFF" : accent;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-9, -4, 18, 15);
    // Keyhole slot (glowing amber/violet)
    ctx.fillStyle = isMono ? "#FFFFFF" : isArcaneGate ? "#E879F9" : "#FEF08A";
    ctx.beginPath();
    ctx.arc(0, 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-1.4, 2.5, 2.8, 5);
    ctx.restore();
  } else if (ob.kind === "pillar") {
    // Carved stone column / broken monument statue / levitating crater shard
    drawDetailedStoneMasonry(
      ctx,
      ob.x,
      ob.y,
      ob.w,
      ob.h,
      faceH,
      isMono ? "#475569" : "#3E322E",
      isMono ? "#334155" : "#241B19",
      isMono ? "#CBD5E1" : "#9A3412",
      isMono,
      7
    );
    const px = ob.x + ob.w * 0.5;
    const py = ob.y + (ob.h - faceH * 0.35) * 0.5;
    const pr = Math.min(ob.w, ob.h) * 0.34;
    ctx.fillStyle = isMono ? "#64748B" : "#574944";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#E2E8F0" : "#A8A29E";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Fluted column crack lines
    ctx.strokeStyle = "rgba(0,0,0,0.58)";
    ctx.beginPath();
    ctx.arc(px, py, pr * 0.56, 0, Math.PI * 2);
    ctx.moveTo(px - pr * 0.7, py - pr * 0.3);
    ctx.lineTo(px + pr * 0.5, py + pr * 0.55);
    ctx.stroke();
  } else if (ob.kind === "altar_stone") {
    // Sacrificial stone slab / monument pedestal with carved blood channels & corner iron rings
    drawDetailedStoneMasonry(
      ctx,
      ob.x,
      ob.y,
      ob.w,
      ob.h,
      faceH,
      isMono ? "#475569" : "#3B2825",
      isMono ? "#2B3444" : "#201413",
      isMono ? "#CBD5E1" : "#B45309",
      isMono,
      31
    );
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(185, 28, 28, 0.75)";
    ctx.lineWidth = 2;
    ctx.strokeRect(ob.x + 9, ob.y + 8, ob.w - 18, ob.h - faceH - 12);
    // Corner iron tie rings
    ctx.strokeStyle = isMono ? "#E2E8F0" : "#A8A29E";
    ctx.lineWidth = 1.6;
    for (const [rx, ry] of [
      [ob.x + 7, ob.y + 7],
      [ob.x + ob.w - 7, ob.y + 7],
      [ob.x + 7, ob.y + ob.h - faceH - 4],
      [ob.x + ob.w - 7, ob.y + ob.h - faceH - 4],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // gate_wall & ruin_wall: weathered Dark Fantasy stone masonry + corner iron straps
    const isGate = ob.kind === "gate_wall";
    drawDetailedStoneMasonry(
      ctx,
      ob.x,
      ob.y,
      ob.w,
      ob.h,
      faceH,
      isMono ? "#475569" : isGate ? "#442C26" : "#382723",
      isMono ? "#334155" : isGate ? "#281916" : "#221715",
      isMono ? "#CBD5E1" : isGate ? "#B45309" : "#78350F",
      isMono,
      ob.x * 0.1
    );
    if (isGate) {
      // Crenellated battlement merlons + iron hinge brackets along collapsed city gate
      ctx.fillStyle = isMono ? "#64748B" : "#573B33";
      for (let mx = ob.x + 14; mx < ob.x + ob.w - 22; mx += 44) {
        ctx.fillRect(mx, ob.y + 5, 18, 10);
        ctx.strokeStyle = "#1C1917";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(mx, ob.y + 5, 18, 10);
      }
      ctx.fillStyle = isMono ? "#CBD5E1" : "#78716C";
      ctx.fillRect(ob.x + ob.w - 10, ob.y + 12, 8, 16);
      ctx.fillRect(ob.x + 2, ob.y + 12, 8, 16);
    }
  }

  ctx.restore();
}

function drawFourChairsSanctumProps(ctx, t, rt, prog, heroId, isMono) {
  if (!rt) return;
  const isTrungHere = heroId === "trung";
  const chairs = [
    { x: 1030, y: 185, label: isTrungHere || prog.trungTriggered ? "" : "DŨNG", angle: 0.45, isFourth: false },
    { x: 1250, y: 185, label: isTrungHere || prog.trungTriggered ? "" : "DANH", angle: -0.45, isFourth: false },
    { x: 1030, y: 275, label: isTrungHere || prog.trungTriggered ? "" : "LONG HÓI", angle: -0.45, isFourth: false },
    { x: 1140, y: 122, label: "", angle: 0, isFourth: true },
  ];

  for (const ch of chairs) {
    ctx.save();
    ctx.translate(ch.x, ch.y);
    ctx.rotate(ch.angle);
    // Floor shadow
    ctx.fillStyle = "rgba(0,0,0,0.56)";
    ctx.fillRect(-15, -13, 32, 28);

    // Carved charred wooden armrests
    const wood = isMono ? "#334155" : ch.isFourth ? "#1B1028" : "#241714";
    const trim = isMono ? "#94A3B8" : ch.isFourth ? "#A855F7" : "#9A3412";
    ctx.fillStyle = wood;
    ctx.strokeStyle = trim;
    ctx.lineWidth = 1.8;
    // Seat cushion
    ctx.fillRect(-13, -10, 26, 22);
    ctx.strokeRect(-13, -10, 26, 22);
    // Armrests left & right
    ctx.fillRect(-16, -12, 5, 22);
    ctx.strokeRect(-16, -12, 5, 22);
    ctx.fillRect(11, -12, 5, 22);
    ctx.strokeRect(11, -12, 5, 22);
    // Carved high backrest with vertical spindles
    ctx.fillStyle = isMono ? "#1E293B" : "#120B0A";
    ctx.fillRect(-15, -19, 30, 9);
    ctx.strokeRect(-15, -19, 30, 9);
    ctx.strokeStyle = trim;
    ctx.lineWidth = 1.2;
    for (let sx = -9; sx <= 9; sx += 6) {
      ctx.beginPath();
      ctx.moveTo(sx, -19);
      ctx.lineTo(sx, -10);
      ctx.stroke();
    }

    if (ch.label) {
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = "#FDBA74";
      ctx.textAlign = "center";
      ctx.fillText(ch.label, 0, 24);
    }

    // Fourth Chair brief ominous silhouette when Trung enters before vanishing
    if (ch.isFourth && isTrungHere && !rt.chairShadowVanished) {
      ctx.fillStyle = "rgba(10, 5, 18, 0.88)";
      ctx.beginPath();
      ctx.arc(0, -4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#C084FC";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Unmistakable ornate key silhouette (bow handle + collar + shaft + stepped teeth).
 */
function drawOrnateKeyIcon(ctx, x, y, scale, angle, colorMain, colorSpec, isMono) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.arc(-9, 2, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-3, -0.5, 21, 5);

  // Ornate bow ring with dark cutout hole
  ctx.strokeStyle = isMono ? "#F8FAFC" : colorMain;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(-10, 0, 6.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#18100E";
  ctx.beginPath();
  ctx.arc(-10, 0, 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Collar lugs
  ctx.fillStyle = isMono ? "#CBD5E1" : colorSpec;
  ctx.fillRect(-3, -4, 3, 8);

  // Cylindrical shaft
  ctx.fillStyle = isMono ? "#E2E8F0" : colorMain;
  ctx.fillRect(0, -2, 18, 4);
  // Metallic specular streak along shaft
  ctx.fillStyle = "#FFFBEB";
  ctx.fillRect(1, -1.5, 15, 1.3);

  // Distinct stepped key bit teeth (3 unmistakable notches!)
  ctx.fillStyle = isMono ? "#E2E8F0" : colorMain;
  ctx.fillRect(10, 2, 3, 6.5);
  ctx.fillRect(14, 2, 2.2, 4.2);
  ctx.fillRect(16.8, 2, 2.4, 7.5);
  ctx.restore();
}

function drawInfernoInteractableNode(ctx, node, t, rt, prog, heroId, isMono, allowGlows) {
  ctx.save();
  ctx.translate(node.x, node.y);

  const ringCol =
    node.heroIdRequired === "dung"
      ? "#FACC15"
      : node.heroIdRequired === "danh"
        ? "#FB923C"
        : node.heroIdRequired === "longhoi"
          ? "#F59E0B"
          : node.heroIdRequired === "trung"
            ? "#C084FC"
            : node.grantsKey
              ? "#FACC15"
              : "#94A3B8";

  // Floor stone rune medallion socket
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.14)" : "rgba(18, 10, 9, 0.62)";
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#CBD5E1" : ringCol;
  ctx.lineWidth = node.heroIdRequired === heroId || node.grantsKey ? 2.5 : 1.7;
  ctx.stroke();

  if (node.id === "trung_orb_pedestal") {
    // Carved tripod obsidian plinth + rotating brass meridian + Arcane Orb
    const pulse = 1 + 0.06 * Math.sin(t * 3.8);
    ctx.fillStyle = "#1E1B4B";
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#C084FC";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.save();
    ctx.rotate(t * 1.2);
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 9, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = heroId === "trung" || prog.trungTriggered ? "#E879F9" : "#818CF8";
    ctx.beginPath();
    ctx.arc(-5, -5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    if (heroId === "trung" || prog.trungTriggered) {
      ctx.fillStyle = "#090412";
      ctx.beginPath();
      ctx.arc(2, 2, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (node.id === "longhoi_console") {
    // Military command desk with glowing green/amber CRT radar grid + reel-to-reel audio tape!
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(-22, -16, 44, 30);
    ctx.strokeStyle = heroId === "longhoi" || prog.longhoiClue ? "#FDE047" : "#F59E0B";
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, -16, 44, 30);
    ctx.fillStyle = heroId === "longhoi" || prog.longhoiClue ? "#064E3B" : "#431407";
    ctx.fillRect(-17, -11, 22, 15);
    ctx.strokeStyle = heroId === "longhoi" || prog.longhoiClue ? "#4ADE80" : "#FB923C";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-6, -3.5, 5, 0, Math.PI * 2);
    ctx.moveTo(-11, -3.5);
    ctx.lineTo(-1, -3.5);
    ctx.moveTo(-6, -8.5);
    ctx.lineTo(-6, 1.5);
    ctx.stroke();
    // Tape deck reels on right
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.arc(13, -7, 3.5, 0, Math.PI * 2);
    ctx.arc(13, 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (node.id === "danh_shrine") {
    // Dragon pedestal with molten gold dragon scale diamond + realistic flanking braziers + coiled chains
    drawForgedChain(ctx, -22, 12, 22, 12, 6, "#78716C", "#FDBA74", isMono, 5);
    drawRealisticFire(ctx, -20, 4, t, 0.85, "fire", 11, allowGlows);
    drawRealisticFire(ctx, 20, 4, t + 1.1, 0.85, "fire", 23, allowGlows);
    ctx.fillStyle = prog.danhClue || heroId === "danh" ? "#FB923C" : "#78350F";
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Engraved dragon scale ridges inside crest
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(0, -10);
    ctx.lineTo(8, -2);
    ctx.moveTo(-7, 5);
    ctx.lineTo(0, -2);
    ctx.lineTo(7, 5);
    ctx.stroke();
  } else if (node.id === "dung_crypt") {
    // Heavy iron floor anchor ring bolted in center + 3 articulated forged chains to 3 spiked Cerberus shackles!
    const active = heroId === "dung" || prog.dungClue;
    const cBody = active ? "#D97706" : "#78716C";
    const cSpec = active ? "#FEF08A" : "#E2E8F0";

    // Central iron rosette ring
    ctx.fillStyle = "#292524";
    ctx.beginPath();
    ctx.arc(0, 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cSpec;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // 3 Forged Chain strands leading outward to 3 spiked hound shackles
    const anchors = [
      { ax: -22, ay: -18 },
      { ax: 0, ay: -24 },
      { ax: 22, ay: -18 },
    ];
    for (let i = 0; i < anchors.length; i++) {
      const { ax, ay } = anchors[i];
      drawForgedChain(ctx, 0, 10, ax, ay, 6.2, cBody, cSpec, isMono, i === 1 ? 0 : i === 0 ? -4 : 4);
      // Spiked iron Cerberus collar shackle
      ctx.fillStyle = "#1C1917";
      ctx.beginPath();
      ctx.arc(ax, ay, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cSpec;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Fang spikes sticking outward from collar
      ctx.strokeStyle = cSpec;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ax - 7, ay - 2);
      ctx.lineTo(ax - 10, ay - 5);
      ctx.moveTo(ax + 7, ay - 2);
      ctx.lineTo(ax + 10, ay - 5);
      ctx.stroke();
    }
  } else if (node.id === "guardhouse_key") {
    // Fallen sentinel cloak rag + unmistakable gleaming Ornate Archive Key!
    ctx.fillStyle = isMono ? "#334155" : "#451A1E";
    ctx.beginPath();
    ctx.moveTo(-20, 4);
    ctx.lineTo(-4, -14);
    ctx.lineTo(18, -6);
    ctx.lineTo(14, 15);
    ctx.lineTo(-14, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const bob = Math.sin(t * 4) * 2;
    drawOrnateKeyIcon(ctx, -1, -2 + bob, 1.35, -0.55, "#FACC15", "#FEF08A", isMono);
  } else if (node.id === "catacomb_switch") {
    // Iron mechanical lever cogwheel plinth + hanging bronze Bunker Key!
    const pulled = Boolean(prog?.keysFound?.includes("bunker_key"));
    ctx.fillStyle = "#27272A";
    ctx.fillRect(-20, -12, 24, 24);
    ctx.strokeStyle = "#A8A29E";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-20, -12, 24, 24);
    // Cogwheel & angled iron lever arm
    ctx.fillStyle = "#52525B";
    ctx.beginPath();
    ctx.arc(-8, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pulled ? "#22C55E" : "#F59E0B";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(pulled ? -18 : 2, pulled ? -14 : -15);
    ctx.stroke();
    ctx.fillStyle = pulled ? "#4ADE80" : "#EF4444";
    ctx.beginPath();
    ctx.arc(pulled ? -18 : 2, pulled ? -14 : -15, 3.6, 0, Math.PI * 2);
    ctx.fill();
    // Distinct bronze key resting beside switch
    drawOrnateKeyIcon(ctx, 13, 2, 1.05, 0.7, "#F59E0B", "#FDE68A", isMono);
  } else if (node.id === "fortress_switch") {
    // Hydraulic pressure valve wheel + green/red pressure gauge + armored switch box
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(-18, -14, 36, 28);
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-18, -14, 36, 28);
    // Circular red valve handwheel
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-5, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(4, 0);
    ctx.moveTo(-5, -9);
    ctx.lineTo(-5, 9);
    ctx.stroke();
    // Pressure dial gauge on right
    ctx.fillStyle = "#FEF3C7";
    ctx.beginPath();
    ctx.arc(11, -3, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(11, -3);
    ctx.lineTo(14, -7);
    ctx.stroke();
  } else if (node.id === "abandoned_house_echo") {
    // Charred wooden threshold + small rocking wooden toy + haunting ember echo rings
    ctx.fillStyle = "#2E1C15";
    ctx.fillRect(-18, 2, 36, 12);
    ctx.strokeStyle = "#78350F";
    ctx.strokeRect(-18, 2, 36, 12);
    // Expanding whisper echo ripples
    const wPhase = (t * 0.8) % 1;
    ctx.strokeStyle = `rgba(251, 146, 60, ${(1 - wPhase) * 0.65})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -4, 8 + wPhase * 22, 0, Math.PI * 2);
    ctx.stroke();
    // Small scorched wooden doll/cradle silhouette
    ctx.fillStyle = "#FDBA74";
    ctx.beginPath();
    ctx.arc(0, -6, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9A3412";
    ctx.fillRect(-5, -2, 10, 9);
  } else if (node.id === "archive_desk") {
    // Charred oak table with open torn parchment ledger book & crimson quill
    ctx.fillStyle = "#3B2016";
    ctx.fillRect(-20, -14, 40, 28);
    ctx.strokeStyle = "#9A3412";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-20, -14, 40, 28);
    // Open twin pages
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(-14, -9, 13, 18);
    ctx.fillRect(1, -9, 13, 18);
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, -9, 28, 18);
    // Text ink lines & torn page corner
    ctx.strokeStyle = "#451A03";
    ctx.beginPath();
    ctx.moveTo(-11, -5);
    ctx.lineTo(-4, -5);
    ctx.moveTo(-11, 0);
    ctx.lineTo(-4, 0);
    ctx.moveTo(4, -5);
    ctx.lineTo(11, -5);
    ctx.stroke();
    ctx.fillStyle = "#E11D48";
    ctx.fillRect(0, 7, 2.4, 7);
  } else if (node.id === "archive_vault_map") {
    // Unrolled sepia blueprint scroll with wooden rods & red ink X-mark
    ctx.fillStyle = "#D6D3D1";
    ctx.fillRect(-16, -12, 32, 24);
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(-14, -10, 28, 20);
    // Scroll dowel rods top & bottom
    ctx.fillStyle = "#78350F";
    ctx.fillRect(-18, -14, 36, 4);
    ctx.fillRect(-18, 10, 36, 4);
    // Red-ink blueprint corridors & X mark
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-9, -6, 18, 12);
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.lineTo(4, 3);
    ctx.moveTo(4, -3);
    ctx.lineTo(-4, 3);
    ctx.stroke();
  } else if (node.id === "four_chairs_letters") {
    // Three fanned sealed letters sharing crimson wax seals
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(i * 6, Math.abs(i) * 2);
      ctx.rotate(i * 0.25);
      ctx.fillStyle = "#F5F5F4";
      ctx.fillRect(-8, -6, 16, 12);
      ctx.strokeStyle = "#57534E";
      ctx.lineWidth = 1.1;
      ctx.strokeRect(-8, -6, 16, 12);
      // Envelope flap lines + red wax seal dot
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.lineTo(0, 1);
      ctx.lineTo(8, -6);
      ctx.stroke();
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.arc(0, 1, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (node.id === "crater_relic") {
    // Levitating faceted obsidian-violet meteor shard over cracked base
    const bob = Math.sin(t * 3.6) * 3;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -4 + bob);
    ctx.fillStyle = "#581C87";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(12, -2);
    ctx.lineTo(7, 13);
    ctx.lineTo(0, 17);
    ctx.lineTo(-9, 10);
    ctx.lineTo(-11, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#E879F9";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = "#F5D0FE";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 15);
    ctx.stroke();
    ctx.restore();
  } else {
    // gate_inscription / temple_tablet / wall_prophecy: Chiseled rune stone tablet/stele
    ctx.fillStyle = "#44403C";
    ctx.beginPath();
    ctx.moveTo(-11, 14);
    ctx.lineTo(-13, -10);
    ctx.lineTo(-4, -17);
    ctx.lineTo(8, -16);
    ctx.lineTo(13, -8);
    ctx.lineTo(11, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#A8A29E";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Carved glowing rune inscription grooves
    ctx.strokeStyle = node.id === "temple_tablet" ? "#FB923C" : node.id === "wall_prophecy" ? "#C084FC" : "#FDBA74";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(7, -8);
    ctx.moveTo(-7, -2);
    ctx.lineTo(6, -2);
    ctx.moveTo(-5, 4);
    ctx.lineTo(5, 4);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderInfernoAshStructuresAndProps(ctx, state, isMono, viewBounds, prof) {
  if (!state || state.activeMapId !== "inferno_ash" || !state.infernoRuntime) return;
  const rt = state.infernoRuntime;
  const prog = state.infernoProgress || {};
  const t = state.elapsedTime || 0;
  const heroId = state.currentHero?.id || state.selectedHeroId;
  const allowGlows = Boolean(prof?.enableRadialGlows);

  // 1. Destroyed secret wall rubble footprints
  for (const dw of rt.destructibles || []) {
    if (!dw.destroyed) continue;
    if (!isCircleInViewBounds(dw.x + dw.w * 0.5, dw.y + dw.h * 0.5, Math.max(dw.w, dw.h), viewBounds)) continue;
    ctx.save();
    ctx.fillStyle = "rgba(41, 37, 36, 0.45)";
    ctx.fillRect(dw.x + 2, dw.y + 2, dw.w - 4, dw.h - 4);
    ctx.strokeStyle = "rgba(251, 146, 60, 0.35)";
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(dw.x, dw.y, dw.w, dw.h);
    ctx.setLineDash([]);
    // Fallen rubble stones
    ctx.fillStyle = isMono ? "#64748B" : "#44403C";
    for (let s = 0; s < 5; s++) {
      ctx.fillRect(dw.x + 12 + (dw.w - 24) * hashVal(s, dw.x), dw.y + 8 + (dw.h - 18) * hashVal(dw.y, s), 9, 7);
    }
    ctx.restore();
  }

  // 2. Active solid obstacles, locked gates & destructible barriers
  const obstacles = getActiveInfernoObstacles(rt, prog);
  for (const ob of obstacles) {
    if (ob.kind === "chasm_void") continue;
    if (!isCircleInViewBounds(ob.x + ob.w * 0.5, ob.y + ob.h * 0.5, Math.max(ob.w, ob.h) + 20, viewBounds)) {
      continue;
    }
    drawInfernoObstacleBlock(ctx, ob, t, isMono, rt, allowGlows);
  }

  // 3. Ambient city iron braziers / persistent fires & rising smoke in visible sectors
  const braziers = [
    { x: 115, y: 1945 },
    { x: 455, y: 1945 },
    { x: 870, y: 1295 },
    { x: 1090, y: 1295 },
    { x: 1855, y: 1255 },
    { x: 2185, y: 1255 },
    { x: 1850, y: 740 },
    { x: 1525, y: 1850 },
    { x: 1045, y: 385 },
    { x: 1235, y: 385 },
    { x: 1740, y: 675 },
    { x: 1920, y: 675 },
  ];
  for (const bz of braziers) {
    if (!isCircleInViewBounds(bz.x, bz.y, 70, viewBounds)) continue;
    // Iron tripod bowl under flame
    ctx.save();
    ctx.fillStyle = isMono ? "#273142" : "#1C1917";
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(bz.x, bz.y + 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawRisingSmokeCurl(ctx, bz.x, bz.y, t, 1.05);
    drawRealisticFire(ctx, bz.x, bz.y + 2, t, 1.15, "fire", bz.x * 0.1, allowGlows);
  }

  // 4. Zone 7 Four Chairs visuals when visible
  if (isCircleInViewBounds(1140, 210, 260, viewBounds)) {
    drawFourChairsSanctumProps(ctx, t, rt, prog, heroId, isMono);
  }

  // 5. Hazard 3: Bastion Missile Target Locks & In-flight Rockets
  for (const ms of rt.missileLocks || []) {
    if (ms.state === "cooldown") continue;
    if (isCircleInViewBounds(ms.targetX, ms.targetY, ms.blastRadius + 30, viewBounds)) {
      ctx.save();
      ctx.strokeStyle = ms.state === "locked" || ms.state === "flying" ? "#FEF08A" : "#EF4444";
      ctx.lineWidth = 2.6;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(ms.targetX, ms.targetY, ms.blastRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(ms.targetX - 18, ms.targetY);
      ctx.lineTo(ms.targetX + 18, ms.targetY);
      ctx.moveTo(ms.targetX, ms.targetY - 18);
      ctx.lineTo(ms.targetX, ms.targetY + 18);
      ctx.stroke();
      ctx.restore();
    }
    if (ms.state === "flying" && isCircleInViewBounds(ms.missileX, ms.missileY, 50, viewBounds)) {
      const ang = Math.atan2(ms.targetY - ms.missileY, ms.targetX - ms.missileX);
      ctx.save();
      ctx.translate(ms.missileX, ms.missileY);
      ctx.rotate(ang);
      // Exhaust flame wake
      ctx.fillStyle = "#F97316";
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(-28 - Math.sin(t * 40) * 5, 0);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#475569";
      ctx.fillRect(-14, -5, 24, 10);
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.lineTo(22, 0);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 6. Hazard 5: Ruin Ambush trembling warning cues
  for (const amb of rt.ruinAmbushes || []) {
    if (amb.state !== "warning" || !isCircleInViewBounds(amb.x, amb.y, amb.triggerRadius + 20, viewBounds)) continue;
    ctx.save();
    ctx.strokeStyle = "#FB7185";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(amb.x, amb.y, amb.spawnRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 7. Phantoms (Detailed 3-Headed Spectral Hound with spiked collars, Ash Child, 4th Chair Shadow)
  for (const ph of rt.phantoms || []) {
    if (!isCircleInViewBounds(ph.x, ph.y, 90, viewBounds)) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, ph.alpha);
    ctx.translate(ph.x, ph.y);
    if (ph.kind === "hound_three_head") {
      // Spectral shadowy torso + trailing wisps
      ctx.fillStyle = "#1E1B4B";
      ctx.strokeStyle = "#FACC15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-4, 0, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Three distinct snarling Cerberus heads + spiked iron collars + trailing broken chains
      for (const oy of [-13, 0, 13]) {
        drawForgedChain(ctx, -20, oy * 0.4, -34, oy * 0.8 + Math.sin(t * 8 + oy) * 3, 5, "#94A3B8", "#FEF08A", isMono, 0);
        ctx.fillStyle = "#0F172A";
        ctx.strokeStyle = "#FACC15";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(12, oy - 5);
        ctx.lineTo(27, oy);
        ctx.lineTo(12, oy + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Glowing golden eye
        ctx.fillStyle = "#FEF08A";
        ctx.beginPath();
        ctx.arc(19, oy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (ph.kind === "ash_child") {
      ctx.fillStyle = "rgba(251, 146, 60, 0.72)";
      ctx.beginPath();
      ctx.arc(0, -10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-9, 14);
      ctx.lineTo(0, -3);
      ctx.lineTo(9, 14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Interactable Nodes & World-Space Hero Resonance Tether
  const nearby = findNearestInfernoInteractable(state.player?.x || 0, state.player?.y || 0, state.activeMapId);
  const nearbyGate = findNearbyLockedGate(state.player?.x || 0, state.player?.y || 0, prog);

  for (const node of INFERNO_INTERACTABLES) {
    if (!isCircleInViewBounds(node.x, node.y, 130, viewBounds)) continue;
    drawInfernoInteractableNode(ctx, node, t, rt, prog, heroId, isMono, allowGlows);

    if (node.heroIdRequired && node.heroIdRequired === heroId && state.player) {
      const dist = Math.hypot(state.player.x - node.x, state.player.y - node.y);
      if (dist <= 230) {
        ctx.save();
        ctx.strokeStyle = node.heroIdRequired === "trung" ? "rgba(192,132,252,0.5)" : "rgba(250,204,21,0.45)";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(state.player.x, state.player.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    if (nearby && nearby.id === node.id) {
      const label = "[V] " + (node.shortPrompt?.[state.currentLang === "en" ? "en" : "vi"] || "");
      ctx.save();
      ctx.translate(node.x, node.y - 52);
      ctx.font = '800 11px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 18;
      ctx.fillStyle = "rgba(12, 8, 10, 0.92)";
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-tw * 0.5, -12, tw, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FEF08A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  if (nearbyGate) {
    const gx = nearbyGate.x + nearbyGate.w * 0.5;
    const gy = nearbyGate.y + nearbyGate.h * 0.5 - 38;
    if (isCircleInViewBounds(gx, gy, 150, viewBounds)) {
      const label = "[V] " + (nearbyGate.label?.[state.currentLang === "en" ? "en" : "vi"] || "");
      ctx.save();
      ctx.font = '800 11px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 18;
      ctx.fillStyle = "rgba(15, 10, 14, 0.92)";
      ctx.strokeStyle = nearbyGate.id === "gate_four_chairs" ? "#C084FC" : "#F59E0B";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(gx - tw * 0.5, gy - 12, tw, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FDE68A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, gx, gy);
      ctx.restore();
    }
  }
}

export function renderInfernoAshAtmosphere(ctx, state, isMono, prof) {
  if (!state || state.activeMapId !== "inferno_ash") return;
  const rt = state.infernoRuntime;
  const tier = prof?.effectiveTier || "high";
  const allowGlows = Boolean(prof?.enableRadialGlows);
  const t = state.elapsedTime || 0;
  const w = state.viewW || 1280;
  const h = state.viewH || 720;

  if (!isMono) {
    // Drifting ash flakes & glowing diamond ember sparks across multiple wind vectors
    const particleCount = tier === "saver" ? 8 : tier === "balanced" ? 18 : 32;
    ctx.save();
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 17.93;
      const windX = i % 3 === 0 ? 18 : -14;
      const px = (((seed * 61.3 + t * windX + Math.sin(t * 0.8 + seed) * 26) % (w + 60)) + (w + 60)) % (w + 60) - 30;
      const py = h - (((seed * 37.1 + t * (16 + (i % 4) * 5)) % (h + 40)) - 20);
      const isEmber = i % 3 === 0;
      ctx.globalAlpha = isEmber ? 0.42 + 0.28 * Math.sin(t * 4.5 + seed) : 0.24;
      ctx.fillStyle = isEmber ? (i % 6 === 0 ? "#FDE047" : "#FB923C") : "#A8A29E";
      ctx.beginPath();
      if (isEmber) {
        const er = 2.4;
        ctx.moveTo(px, py - er * 1.3);
        ctx.lineTo(px + er, py);
        ctx.lineTo(px, py + er * 1.3);
        ctx.lineTo(px - er, py);
        ctx.closePath();
      } else {
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();

    if (allowGlows) {
      // Warm subtle volcanic heat-haze edge rim at lower viewport edge
      ctx.save();
      const heat = ctx.createLinearGradient(0, h * 0.72, 0, h);
      heat.addColorStop(0, "rgba(234, 88, 12, 0)");
      heat.addColorStop(1, "rgba(180, 45, 12, 0.09)");
      ctx.fillStyle = heat;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);

      const rad = Math.max(w, h) * 0.72;
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, rad * 0.45, w * 0.5, h * 0.5, rad);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(0.75, "rgba(28, 10, 8, 0.16)");
      vg.addColorStop(1, "rgba(12, 4, 4, 0.48)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // Soft peripheral lightning sky shimmer (keeps gameplay center comfortable)
  if (rt?.lightningFlash > 0) {
    ctx.save();
    const edgeAlpha = Math.min(0.13, rt.lightningFlash * 0.45);
    if (allowGlows) {
      const rad = Math.max(w, h) * 0.72;
      const lg = ctx.createRadialGradient(w * 0.5, h * 0.5, rad * 0.42, w * 0.5, h * 0.5, rad);
      lg.addColorStop(0, "rgba(254, 240, 138, 0)");
      lg.addColorStop(0.65, `rgba(253, 224, 71, ${edgeAlpha * 0.4})`);
      lg.addColorStop(1, `rgba(254, 240, 138, ${edgeAlpha})`);
      ctx.fillStyle = lg;
    } else {
      ctx.fillStyle = `rgba(254, 240, 138, ${Math.min(0.05, rt.lightningFlash * 0.18)})`;
    }
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Trung Zone 7 Reveal: subtle atmospheric screen darkening
  if (rt?.trungDarknessTimer > 0) {
    const fade = Math.min(1, rt.trungDarknessTimer / 1.5) * 0.38;
    ctx.save();
    ctx.fillStyle = `rgba(5, 2, 12, ${fade})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
