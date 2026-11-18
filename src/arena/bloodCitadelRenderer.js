import {
  BLOOD_CITADEL_SPAWN,
  BLOOD_CITADEL_SECRET_VAULT_RECT,
  BLOOD_CITADEL_GATE_ARCH,
  BLOOD_CITADEL_INTERACTABLES,
  getActiveCitadelObstacles,
} from "./bloodCitadelMap";
import { isCircleInViewBounds } from "./combatLogic";

// Zero ctx.shadowBlur usage for steady 60fps Canvas 2D performance on desktop and mobile.
// Uses strictly ctxStub-safe Canvas 2D primitives for deterministic headless & browser rendering.

function hashCell(ix, iy) {
  let n = Math.imul(ix + 37, 73856093) ^ Math.imul(iy + 91, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function drawCitadelChain(ctx, x1, y1, x2, y2, linkLen = 7.5, colBody = "#78716C", colSpec = "#E2E8F0", isMono = false, sag = 0) {
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
    const py = y1 + dy * f + ny * arch + Math.abs(sag) * 0.22 * Math.sin(f * Math.PI);
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
      ctx.strokeStyle = "rgba(0,0,0,0.58)";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.ellipse(0, 1.1, linkLen * 0.56, linkLen * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#94A3B8" : colBody;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, linkLen * 0.56, linkLen * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : colSpec;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(0, -0.35, linkLen * 0.46, linkLen * 0.24, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.58)";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.44, 0.9);
      ctx.lineTo(linkLen * 0.44, 0.9);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#CBD5E1" : colBody;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.44, 0);
      ctx.lineTo(linkLen * 0.44, 0);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : colSpec;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-linkLen * 0.3, -0.65);
      ctx.lineTo(linkLen * 0.3, -0.65);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawBraizerFlame(ctx, x, y, time, scale, isMono, colorMode = "crimson", allowGlows = false) {
  ctx.save();
  ctx.translate(x, y);
  const seed = x * 0.11 + y * 0.07;
  const flicker = 0.86 + 0.14 * Math.sin(time * 13.5 + seed);
  const sway1 = (Math.sin(time * 8.2 + seed) * 3.1 + Math.cos(time * 14.3 + seed) * 1.3) * scale;
  const sway2 = Math.cos(time * 10.1 + seed * 1.4) * 2.6 * scale;

  if (!isMono) {
    if (allowGlows) {
      const halo = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, 32 * scale * flicker);
      const c0 =
        colorMode === "violet"
          ? "rgba(192, 132, 252, 0.30)"
          : colorMode === "gold"
            ? "rgba(250, 204, 21, 0.30)"
            : "rgba(244, 63, 94, 0.28)";
      const c1 =
        colorMode === "violet"
          ? "rgba(168, 85, 247, 0)"
          : colorMode === "gold"
            ? "rgba(245, 158, 11, 0)"
            : "rgba(190, 18, 60, 0)";
      halo.addColorStop(0, c0);
      halo.addColorStop(1, c1);
      ctx.fillStyle = halo;
    } else {
      ctx.fillStyle =
        colorMode === "violet"
          ? "rgba(168, 85, 247, 0.18)"
          : colorMode === "gold"
            ? "rgba(250, 204, 21, 0.18)"
            : "rgba(244, 63, 94, 0.18)";
    }
    ctx.beginPath();
    ctx.arc(0, 0, 26 * scale * flicker, 0, Math.PI * 2);
    ctx.fill();
  }

  // Iron tripod feet
  ctx.strokeStyle = isMono ? "#94A3B8" : "#44403C";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 * i) / 3 + Math.PI / 6;
    ctx.moveTo(Math.cos(a) * 6 * scale, Math.sin(a) * 6 * scale);
    ctx.lineTo(Math.cos(a) * 13 * scale, Math.sin(a) * 13 * scale);
  }
  ctx.stroke();

  // Riveted iron brazier bowl
  ctx.fillStyle = isMono ? "#273142" : "#1C1917";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#78716C";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(0, 0, 9.8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Iron rim studs
  ctx.fillStyle = isMono ? "#CBD5E1" : "#A8A29E";
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 0.5) * i + 0.4;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 8.2 * scale, Math.sin(a) * 8.2 * scale, 1.1 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  const cDeep = colorMode === "violet" ? "#6B21A8" : colorMode === "gold" ? "#B45309" : "#9F1239";
  const cMid = colorMode === "violet" ? "#C084FC" : colorMode === "gold" ? "#F59E0B" : "#F97316";
  const cCore = colorMode === "violet" ? "#F5D0FE" : colorMode === "gold" ? "#FEF9C3" : "#FDE047";

  // Glowing ember bed
  ctx.fillStyle = isMono ? "#94A3B8" : cDeep;
  ctx.beginPath();
  ctx.ellipse(0, 0.5 * scale, 6.2 * scale, 4.2 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer asymmetric S-curved flame tongue
  ctx.fillStyle = isMono ? "#CBD5E1" : cMid;
  ctx.beginPath();
  ctx.moveTo(-5.2 * scale, 1 * scale);
  ctx.bezierCurveTo(-6.8 * scale, -5 * scale, -2.2 * scale + sway2 * 0.6, -11 * scale, sway1, -17 * scale * flicker);
  ctx.bezierCurveTo(3.4 * scale + sway1 * 0.4, -10 * scale, 6.4 * scale, -4.5 * scale, 5.2 * scale, 1 * scale);
  ctx.closePath();
  ctx.fill();

  // Secondary side lick
  ctx.beginPath();
  ctx.moveTo(-4.0 * scale, 0.5 * scale);
  ctx.bezierCurveTo(-6.2 * scale, -4 * scale, -4.2 * scale + sway2, -8 * scale, -2.0 * scale + sway2 * 1.1, -12 * scale * flicker);
  ctx.bezierCurveTo(-0.5 * scale, -6 * scale, 1 * scale, -2 * scale, 1.5 * scale, 0.5 * scale);
  ctx.closePath();
  ctx.fill();

  // Narrow tapered bright inner core
  ctx.fillStyle = isMono ? "#F8FAFC" : cCore;
  ctx.beginPath();
  ctx.moveTo(-2.4 * scale, 0.4 * scale);
  ctx.bezierCurveTo(-3.0 * scale, -3.8 * scale, sway1 * 0.45 - 0.8 * scale, -7.8 * scale, sway1 * 0.55, -10.5 * scale * flicker);
  ctx.bezierCurveTo(1.8 * scale, -6.5 * scale, 2.8 * scale, -3.2 * scale, 2.4 * scale, 0.4 * scale);
  ctx.closePath();
  ctx.fill();

  // Detached rising micro-spark
  if (!isMono) {
    const sp = (time * 1.4 + seed) % 1;
    ctx.globalAlpha = Math.max(0, (1 - sp) * 0.85);
    ctx.fillStyle = cCore;
    ctx.beginPath();
    ctx.arc(sway1 * sp + Math.sin(time * 6 + seed) * 2 * scale, -12 * scale - sp * 11 * scale, 1.15 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCandleFlame(ctx, x, y, time, scale, isMono, color = "#E879F9") {
  ctx.save();
  ctx.translate(x, y);
  const flicker = 0.85 + 0.15 * Math.sin(time * 16 + x * 0.3);
  const sway = Math.sin(time * 11 + y * 0.2) * 1.4 * scale;
  if (!isMono) {
    ctx.fillStyle = color === "#E879F9" ? "rgba(192, 132, 252, 0.22)" : "rgba(251, 113, 133, 0.22)";
    ctx.beginPath();
    ctx.arc(0, -5 * scale, 12 * scale * flicker, 0, Math.PI * 2);
    ctx.fill();
  }
  // Melted wax puddle + pillar with drips
  ctx.fillStyle = isMono ? "#94A3B8" : "rgba(226, 232, 240, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 4 * scale, 4.6 * scale, 2.2 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isMono ? "#CBD5E1" : "#E2E8F0";
  ctx.fillRect(-2.4 * scale, -4 * scale, 4.8 * scale, 8 * scale);
  ctx.fillRect(-2.8 * scale, -2 * scale, 1.3 * scale, 3.8 * scale);
  // Organic dual-tone teardrop flame
  ctx.fillStyle = isMono ? "#E2E8F0" : color;
  ctx.beginPath();
  ctx.moveTo(-2.2 * scale, -4 * scale);
  ctx.bezierCurveTo(-2.6 * scale, -7.2 * scale, -0.6 * scale + sway * 0.5, -10.5 * scale, sway, -12.2 * scale * flicker);
  ctx.bezierCurveTo(1.8 * scale + sway * 0.4, -9.8 * scale, 2.6 * scale, -7.2 * scale, 2.2 * scale, -4 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FFFBEB";
  ctx.beginPath();
  ctx.arc(0, -5.6 * scale, 1.1 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFloorRelicWeapons(ctx, x, y, angle, isMono) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Broken sword blade lying on flagstones
  ctx.strokeStyle = isMono ? "#94A3B8" : "#57534E";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-14, -3);
  ctx.lineTo(12, 2);
  ctx.moveTo(-8, -8);
  ctx.lineTo(-10, 4);
  ctx.stroke();
  // Tattered crimson war banner rag
  ctx.fillStyle = isMono ? "rgba(148,163,184,0.28)" : "rgba(136, 19, 55, 0.42)";
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.lineTo(18, 9);
  ctx.lineTo(13, 17);
  ctx.lineTo(-5, 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTatteredBanner(ctx, x, y, w, h, color, trimColor, isMono, swayOffset = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(w + 2, 2);
  ctx.lineTo(w + 2 + swayOffset, h + 2);
  ctx.lineTo(w * 0.5 + 2 + swayOffset * 0.6, h - 5);
  ctx.lineTo(2 + swayOffset * 0.5, h + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isMono ? "#334155" : color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w + swayOffset, h);
  ctx.lineTo(w * 0.5 + swayOffset * 0.6, h - 6);
  ctx.lineTo(swayOffset * 0.5, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isMono ? "#CBD5E1" : trimColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Center insignia stripe
  ctx.strokeStyle = isMono ? "#E2E8F0" : trimColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 3);
  ctx.lineTo(w * 0.5 + swayOffset * 0.5, h - 8);
  ctx.stroke();
  ctx.restore();
}

function drawGargoylePlinth(ctx, x, y, mirrorX, color, eyeColor, isMono, lit = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(mirrorX, 1);

  // Pedestal shadow
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(-12, -10, 26, 26);

  // Stone base
  ctx.fillStyle = isMono ? "#2B3444" : "#271E2E";
  ctx.strokeStyle = isMono ? "#CBD5E1" : color;
  ctx.lineWidth = lit ? 2.1 : 1.6;
  ctx.fillRect(-13, -13, 26, 26);
  ctx.strokeRect(-13, -13, 26, 26);

  // Carved serpent / gargoyle crest & folded wing ridge
  ctx.fillStyle = isMono ? "#3F4B5E" : "#3B2846";
  ctx.beginPath();
  ctx.moveTo(-8, 7);
  ctx.lineTo(-10, -7);
  ctx.lineTo(-2, -11);
  ctx.lineTo(9, -4);
  ctx.lineTo(7, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin glowing serpent eyes
  ctx.fillStyle = isMono ? "#F8FAFC" : eyeColor;
  ctx.beginPath();
  ctx.arc(0, -3, lit ? 2.4 : 2.0, 0, Math.PI * 2);
  ctx.arc(4.5, -1, lit ? 2.1 : 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrystalShard(ctx, x, y, r, rot, fillCol, strokeCol) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = fillCol;
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.56, 0);
  ctx.lineTo(0, r * 0.85);
  ctx.lineTo(-r * 0.56, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function getBloodCitadelZoneLabel(x, y, lang = "vi") {
  const isEn = lang === "en";
  const vr = BLOOD_CITADEL_SECRET_VAULT_RECT;
  if (x >= vr.x && x <= vr.x + vr.w && y >= vr.y && y <= vr.y + vr.h) {
    return isEn ? "Northern Secret Vault" : "Hầm Bí Mật Phía Bắc";
  }
  if (x >= 1270 && y <= 340) {
    return isEn ? "Bloodstone Lab #MT-07" : "Phòng Thí Nghiệm #MT-07";
  }
  if (x <= 340 && y >= 1080) {
    return isEn ? "Mirror Alcove #BS-04" : "Gương Sai Lệch #BS-04";
  }
  if (Math.hypot(x - BLOOD_CITADEL_SPAWN.x, y - BLOOD_CITADEL_SPAWN.y) <= 235) {
    return isEn ? "Crimson Ritual Dais" : "Đại Điện Huyết Ấn";
  }
  if (y >= 1330 && x >= 520 && x <= 1080) {
    return isEn ? "Southern Gatehouse" : "Cổng Thành Nam";
  }
  if (x <= 420) {
    return isEn ? "West Watch Gallery" : "Hành Lang Tây";
  }
  if (x >= 1180) {
    return isEn ? "East Barracks Ruin" : "Hành Lang Đông";
  }
  if (y <= 540) {
    return isEn ? "Northern Breach" : "Tiền Sảnh Cửa Hầm";
  }
  return isEn ? "Citadel Courtyard" : "Sân Trong Cổ Thành";
}

export function renderBloodCitadelFloor(ctx, state, isMono, viewBounds, prof) {
  const W = state.mapWidth;
  const H = state.mapHeight;
  const t = state.elapsedTime || 0;
  const allowGlows = Boolean(prof?.enableRadialGlows);
  const tier = prof?.effectiveTier || "high";
  const secrets = state.citadelSecrets || {};
  const heroId = state.currentHero?.id || state.selectedHeroId;

  // 1. Deep Obsidian Base (Ink-noir slate in monochrome mode to eliminate glare)
  ctx.fillStyle = isMono ? "#171C26" : "#08050A";
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient gothic warmth centered on Ritual Arena, Secret Vault, Tin Lab & Bao Mirror
  if (!isMono && allowGlows) {
    const arenaGlow = ctx.createRadialGradient(
      BLOOD_CITADEL_SPAWN.x,
      BLOOD_CITADEL_SPAWN.y,
      45,
      BLOOD_CITADEL_SPAWN.x,
      BLOOD_CITADEL_SPAWN.y,
      620
    );
    arenaGlow.addColorStop(0, "rgba(159, 18, 57, 0.28)");
    arenaGlow.addColorStop(0.55, "rgba(69, 10, 28, 0.14)");
    arenaGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
    ctx.fillStyle = arenaGlow;
    ctx.fillRect(0, 0, W, H);

    const vaultGlow = ctx.createRadialGradient(800, 195, 20, 800, 195, 310);
    vaultGlow.addColorStop(
      0,
      secrets.combinedUnlocked ? "rgba(250, 204, 21, 0.26)" : "rgba(147, 51, 234, 0.22)"
    );
    vaultGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
    ctx.fillStyle = vaultGlow;
    ctx.fillRect(460, 0, 680, 520);

    // NE Crimson Lab Aura
    if (viewBounds.maxX >= 1150 && viewBounds.minY <= 440) {
      const labGlow = ctx.createRadialGradient(1440, 175, 16, 1440, 175, 240);
      labGlow.addColorStop(
        0,
        heroId === "tin" || secrets.tinClue ? "rgba(244, 63, 94, 0.28)" : "rgba(159, 18, 57, 0.18)"
      );
      labGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
      ctx.fillStyle = labGlow;
      ctx.fillRect(1160, 0, 440, 440);
    }

    // SW Violet Mirror Aura
    if (viewBounds.minX <= 450 && viewBounds.maxY >= 960) {
      const mirGlow = ctx.createRadialGradient(165, 1215, 16, 165, 1215, 240);
      mirGlow.addColorStop(
        0,
        heroId === "bao" || secrets.baoClue ? "rgba(192, 132, 252, 0.28)" : "rgba(126, 34, 206, 0.18)"
      );
      mirGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
      ctx.fillStyle = mirGlow;
      ctx.fillRect(0, 960, 440, 500);
    }
  }

  // 2. Staggered Running-Bond Ashlar Stone Flagstones with District Character (culled to viewBounds)
  const tileW = 100;
  const tileH = 60;
  const rowStart = Math.max(0, Math.floor(viewBounds.minY / tileH));
  const rowEnd = Math.min(Math.ceil(H / tileH) - 1, Math.ceil(viewBounds.maxY / tileH));

  for (let row = rowStart; row <= rowEnd; row++) {
    const y = row * tileH;
    const offset = row % 2 === 1 ? tileW * 0.5 : 0;
    const colStart = Math.max(-1, Math.floor((viewBounds.minX - offset) / tileW));
    const colEnd = Math.min(Math.ceil(W / tileW), Math.ceil((viewBounds.maxX - offset) / tileW));

    for (let col = colStart; col <= colEnd; col++) {
      const x = col * tileW + offset;
      if (x + tileW <= 0 || x >= W) continue;
      const drawX = Math.max(16, x);
      const drawW = Math.min(W - 16, x + tileW) - drawX;
      const drawY = Math.max(16, y);
      const drawH = Math.min(H - 16, y + tileH) - drawY;
      if (drawW <= 2 || drawH <= 2) continue;

      const hVal = hashCell(col, row);
      const midX = drawX + drawW * 0.5;
      const midY = drawY + drawH * 0.5;

      if (isMono) {
        const shade = 29 + Math.floor(hVal * 12);
        ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 13})`;
      } else {
        const inLabDistrict = midX >= 1200 && midY <= 380;
        const inMirrorDistrict = midX <= 380 && midY >= 1020;
        const inNorthSanctum = midY <= 380 && midX >= 520 && midX <= 1080;

        let r = 17 + hVal * 12;
        let g = 11 + hVal * 7;
        let b = 18 + hVal * 10;

        if (inLabDistrict) {
          r += 10;
          g += 1;
          b += 3;
        } else if (inMirrorDistrict) {
          r += 3;
          g += 2;
          b += 12;
        } else if (inNorthSanctum) {
          r += 5;
          b += 10;
        }
        ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
      }
      ctx.fillRect(drawX + 1.5, drawY + 1.5, drawW - 3, drawH - 3);

      // Subtle inner top-left stone bevel highlight & bottom-right shadow seam
      ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.1)" : "rgba(255, 228, 230, 0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + 2, drawY + drawH - 3);
      ctx.lineTo(drawX + 2, drawY + 2);
      ctx.lineTo(drawX + drawW - 3, drawY + 2);
      ctx.stroke();

      // Occasional gothic diamond floor inlay on courtyard flagstones
      if (hVal > 0.42 && hVal < 0.48 && drawW >= 60 && drawH >= 44) {
        ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.1)" : "rgba(180, 83, 9, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(midX, drawY + 12);
        ctx.lineTo(midX + 12, midY);
        ctx.lineTo(midX, drawY + drawH - 12);
        ctx.lineTo(midX - 12, midY);
        ctx.closePath();
        ctx.stroke();
      }

      // Sparse deterministic fractures / moss / crimson veins
      if (hVal > 0.74 && drawW > 40 && drawH > 30) {
        ctx.strokeStyle = isMono
          ? "rgba(203, 213, 225, 0.16)"
          : hVal > 0.9
            ? "rgba(225, 29, 72, 0.3)"
            : hVal < 0.8
              ? "rgba(16, 185, 129, 0.12)"
              : "rgba(0, 0, 0, 0.48)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        const sx = drawX + drawW * (0.22 + ((hVal * 7) % 0.35));
        const sy = drawY + drawH * 0.24;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 16, sy + 11);
        ctx.lineTo(sx + 9, sy + 24);
        ctx.stroke();
      }
    }
  }

  // 3. Grand Ceremonial Causeway (South Gate -> Central Arena -> Northern Vault) & Cross-Aisle
  ctx.save();
  const roadX = 708;
  const roadW = 184;
  if (viewBounds.maxX >= roadX - 30 && viewBounds.minX <= roadX + roadW + 30) {
    ctx.fillStyle = isMono ? "#212836" : "#180C16";
    ctx.fillRect(roadX, 330, roadW, 1110);

    // Crimson ceremonial velvet runner inlay down center of causeway
    ctx.fillStyle = isMono ? "rgba(203, 213, 225, 0.08)" : "rgba(136, 19, 55, 0.22)";
    ctx.fillRect(roadX + 26, 330, roadW - 52, 1110);

    // Outer stepped stone curb
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(159, 18, 57, 0.56)";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(roadX, 330, roadW, 1110);

    // Inner ceremonial bronze/crimson runner lines
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.28)" : "rgba(217, 119, 6, 0.34)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(roadX + 18, 330);
    ctx.lineTo(roadX + 18, 1440);
    ctx.moveTo(roadX + roadW - 18, 330);
    ctx.lineTo(roadX + roadW - 18, 1440);
    ctx.stroke();

    // Flagstone paver cross seams along causeway
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.14)" : "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let py = 360; py <= 1410; py += 60) {
      if (py < viewBounds.minY - 20 || py > viewBounds.maxY + 20) continue;
      ctx.moveTo(roadX, py);
      ctx.lineTo(roadX + roadW, py);
    }
    ctx.stroke();

    // Ornate double-nested gothic medallions along causeway center
    for (let cy = 390; cy <= 1350; cy += 120) {
      if (cy > 640 && cy < 1040) continue;
      if (cy < viewBounds.minY - 30 || cy > viewBounds.maxY + 30) continue;
      ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.25)" : "rgba(225, 29, 72, 0.32)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(800, cy - 16);
      ctx.lineTo(818, cy);
      ctx.lineTo(800, cy + 16);
      ctx.lineTo(782, cy);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.22)" : "rgba(245, 158, 11, 0.32)";
      ctx.beginPath();
      ctx.arc(800, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // East-West Cross Aisle
  const crossY = 790;
  const crossH = 100;
  if (viewBounds.maxY >= crossY - 20 && viewBounds.minY <= crossY + crossH + 20) {
    ctx.fillStyle = isMono ? "#1F2634" : "#150C15";
    ctx.fillRect(320, crossY, 960, crossH);
    ctx.fillStyle = isMono ? "rgba(203, 213, 225, 0.06)" : "rgba(136, 19, 55, 0.14)";
    ctx.fillRect(320, crossY + 18, 960, crossH - 36);
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(159, 18, 57, 0.38)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(320, crossY, 960, crossH);
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.22)" : "rgba(217, 119, 6, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(320, crossY + 12);
    ctx.lineTo(1280, crossY + 12);
    ctx.moveTo(320, crossY + crossH - 12);
    ctx.lineTo(1280, crossY + crossH - 12);
    ctx.stroke();
  }

  // Flanking Grand Causeway Braziers (safe courtyard edges)
  const aisleBraziers = [
    [684, 575],
    [916, 575],
    [684, 1085],
    [916, 1085],
  ];
  for (const [bx, by] of aisleBraziers) {
    if (isCircleInViewBounds(bx, by, 44, viewBounds)) {
      drawBraizerFlame(ctx, bx, by, t, 0.92, isMono, "crimson", allowGlows);
    }
  }
  ctx.restore();

  // 4. Engraved Animated Blood Channels linking Central Arena toward the 5 Blood Traps
  const bloodChannels = [
    [800, 640, 800, 515],
    [600, 840, 420, 830],
    [1000, 840, 1180, 830],
    [665, 995, 560, 1235],
    [935, 995, 1040, 1235],
  ];
  ctx.save();
  ctx.strokeStyle = isMono ? "rgba(15, 23, 42, 0.72)" : "rgba(28, 12, 18, 0.92)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of bloodChannels) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  const veinAlpha = 0.36 + 0.18 * Math.sin(t * 3.4);
  ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.32)" : `rgba(225, 29, 72, ${veinAlpha})`;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of bloodChannels) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // Flowing directional blood motes
  if (!isMono && tier !== "saver") {
    for (let idx = 0; idx < bloodChannels.length; idx++) {
      const [x1, y1, x2, y2] = bloodChannels[idx];
      for (let m = 0; m < 3; m++) {
        const prog = (t * 0.52 + idx * 0.19 + m * 0.33) % 1;
        const mx = x1 + (x2 - x1) * prog;
        const my = y1 + (y2 - y1) * prog;
        if (!isCircleInViewBounds(mx, my, 12, viewBounds)) continue;
        ctx.fillStyle = m === 0 ? "#FDA4AF" : "#FB7185";
        ctx.beginPath();
        ctx.arc(mx, my, m === 0 ? 2.6 : 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // 5. Central Blood Ritual Seal (cx=800, cy=840) — Grand Multi-Tiered Obsidian Altar Plaza
  const cx = BLOOD_CITADEL_SPAWN.x;
  const cy = BLOOD_CITADEL_SPAWN.y;
  if (isCircleInViewBounds(cx, cy, 280, viewBounds)) {
    ctx.save();
    ctx.translate(cx, cy);

    // Outer stepped octagonal dais rim
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      const rx = Math.cos(a) * 248;
      const ry = Math.sin(a) * 248;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fillStyle = isMono ? "#1E2534" : "#12070F";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(159, 18, 57, 0.52)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Inner octagonal dais slab
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      const rx = Math.cos(a) * 232;
      const ry = Math.sin(a) * 232;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fillStyle = isMono ? "#242C3D" : "#190A15";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(217, 119, 6, 0.58)";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 8 Cardinal Obsidian Bloodstone Corner Pylons on Octagon Vertices
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      const px = Math.cos(a) * 230;
      const py = Math.sin(a) * 230;
      ctx.fillStyle = isMono ? "#334155" : "#27141F";
      ctx.strokeStyle = isMono ? "#CBD5E1" : i % 2 === 0 ? "#F43F5E" : "#F59E0B";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isMono ? "#F8FAFC" : i % 2 === 0 ? "#FDA4AF" : "#FDE047";
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer rune script ring & middle ritual rings
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.25)" : "rgba(225, 29, 72, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 218, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 24; k++) {
      const a = (Math.PI * 2 * k) / 24;
      const r0 = k % 3 === 0 ? 206 : 210;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * 218, Math.sin(a) * 218);
      ctx.stroke();
    }

    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.38)" : "rgba(225, 29, 72, 0.5)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 202, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.25)" : "rgba(245, 158, 11, 0.32)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 184, 0, Math.PI * 2);
    ctx.stroke();

    // Slow-rotating rune arc ring + cardinal diamond sigils
    ctx.save();
    ctx.rotate(t * 0.16);
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.35)" : "rgba(244, 63, 94, 0.56)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 154, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      const px = Math.cos(ang) * 193;
      const py = Math.sin(ang) * 193;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = isMono ? "#CBD5E1" : i % 2 === 0 ? "#FB7185" : "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(8.5, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-8.5, 0);
      ctx.lineTo(0, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Counter-rotating inner arcane ring
    ctx.save();
    ctx.rotate(-t * 0.24);
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.3)" : "rgba(251, 191, 36, 0.42)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Inner sacred 8-point mandala geometry & core ring
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.28)" : "rgba(190, 18, 60, 0.42)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 112, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 2;
      ctx.moveTo(Math.cos(a) * 112, Math.sin(a) * 112);
      ctx.lineTo(Math.cos(a + Math.PI) * 112, Math.sin(a + Math.PI) * 112);
    }
    ctx.stroke();

    // Diamond mandala square
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.25)" : "rgba(244, 63, 94, 0.34)";
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 2 + Math.PI / 4;
      const sx = Math.cos(a) * 108;
      const sy = Math.sin(a) * 108;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.stroke();

    // Pulsing center ritual sanctuary core
    const daisPulse = 0.8 + 0.2 * Math.sin(t * 2.8);
    if (!isMono && allowGlows) {
      const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
      cg.addColorStop(0, `rgba(244, 63, 94, ${0.32 * daisPulse})`);
      cg.addColorStop(1, "rgba(136, 19, 55, 0)");
      ctx.fillStyle = cg;
    } else {
      ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.08)" : "rgba(159, 18, 57, 0.26)";
    }
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(251, 113, 133, 0.56)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Center blood eclipse 8-point crest
    ctx.save();
    ctx.rotate(t * 0.2);
    ctx.strokeStyle = isMono ? "#E2E8F0" : "rgba(250, 204, 21, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 === 0 ? 24 : 9;
      const aa = (Math.PI * i) / 4;
      const sx = Math.cos(aa) * rr;
      const sy = Math.sin(aa) * rr;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 4 Corner Floor Braziers inside the octagonal dais corners
    for (const bx of [-152, 152]) {
      for (const by of [-152, 152]) {
        drawBraizerFlame(ctx, bx, by, t, 0.94, isMono, "crimson", allowGlows);
      }
    }
    ctx.restore();
  }

  // 6. Northern Secret Underground Vault Floor (x:602, y:86, w:396, h:244)
  const vr = BLOOD_CITADEL_SECRET_VAULT_RECT;
  if (isCircleInViewBounds(vr.x + vr.w * 0.5, vr.y + vr.h * 0.5, 310, viewBounds)) {
    ctx.save();
    // Stepped crypt descent stairs at southern entrance
    for (let step = 0; step < 3; step++) {
      const sy = vr.y + vr.h - 24 + step * 8;
      ctx.fillStyle = isMono ? "#293242" : `rgb(${30 - step * 4}, ${14 - step * 2}, ${38 - step * 4})`;
      ctx.fillRect(vr.x + 86, sy, vr.w - 172, 7);
      ctx.strokeStyle = isMono
        ? "#CBD5E1"
        : secrets.combinedUnlocked
          ? "rgba(250, 204, 21, 0.5)"
          : "rgba(192, 132, 252, 0.36)";
      ctx.lineWidth = 1;
      ctx.strokeRect(vr.x + 86, sy, vr.w - 172, 7);
    }

    // Sanctum obsidian mosaic base
    ctx.fillStyle = isMono ? "#1D2433" : secrets.combinedUnlocked ? "#221028" : "#150B1D";
    ctx.fillRect(vr.x, vr.y, vr.w, vr.h - 24);

    // Interlocking Dual-Seal Mosaic on Vault Floor: Bao Amethyst Left + Tin Crimson Right
    if (!isMono) {
      ctx.strokeStyle = secrets.baoClue ? "rgba(232, 121, 249, 0.36)" : "rgba(147, 51, 234, 0.16)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(768, 188, 72, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      ctx.strokeStyle = secrets.tinClue ? "rgba(251, 113, 133, 0.36)" : "rgba(190, 18, 60, 0.16)";
      ctx.beginPath();
      ctx.arc(832, 188, 72, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
    }

    // Subtle diamond mosaic grid inside vault
    ctx.strokeStyle = isMono
      ? "rgba(226, 232, 240, 0.14)"
      : secrets.combinedUnlocked
        ? "rgba(250, 204, 21, 0.18)"
        : "rgba(168, 85, 247, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let mx = vr.x + 24; mx < vr.x + vr.w; mx += 44) {
      ctx.moveTo(mx, vr.y + 8);
      ctx.lineTo(mx, vr.y + vr.h - 28);
    }
    for (let my = vr.y + 24; my < vr.y + vr.h - 28; my += 44) {
      ctx.moveTo(vr.x + 8, my);
      ctx.lineTo(vr.x + vr.w - 8, my);
    }
    ctx.stroke();

    // Dual Easter-Egg Floor Leyline Conduits linking Vault corners -> Altar (800, 185)
    // Left (Violet -> Bảo's #BS-04 bond)
    ctx.strokeStyle = isMono
      ? "rgba(226, 232, 240, 0.35)"
      : secrets.baoClue
        ? "rgba(232, 121, 249, 0.78)"
        : "rgba(126, 34, 206, 0.28)";
    ctx.lineWidth = secrets.baoClue ? 3.2 : 2;
    ctx.beginPath();
    ctx.moveTo(vr.x + 36, vr.y + vr.h - 52);
    ctx.lineTo(vr.x + 36, 185);
    ctx.lineTo(745, 185);
    ctx.stroke();

    // Right (Crimson -> Tin's #MT-07 bond)
    ctx.strokeStyle = isMono
      ? "rgba(226, 232, 240, 0.35)"
      : secrets.tinClue
        ? "rgba(251, 113, 133, 0.78)"
        : "rgba(159, 18, 57, 0.28)";
    ctx.lineWidth = secrets.tinClue ? 3.2 : 2;
    ctx.beginPath();
    ctx.moveTo(vr.x + vr.w - 36, vr.y + vr.h - 52);
    ctx.lineTo(vr.x + vr.w - 36, 185);
    ctx.lineTo(855, 185);
    ctx.stroke();

    // Traveling energy beads along Vault Conduits when Tin or Bảo clue unlocked
    if (!isMono && tier !== "saver") {
      if (secrets.baoClue) {
        const p = (t * 0.7) % 1;
        const bx = vr.x + 36 + p * (745 - (vr.x + 36));
        ctx.fillStyle = "#F5D0FE";
        ctx.beginPath();
        ctx.arc(bx, 185, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      if (secrets.tinClue) {
        const p = (t * 0.7 + 0.35) % 1;
        const tx = vr.x + vr.w - 36 - p * (vr.x + vr.w - 36 - 855);
        ctx.fillStyle = "#FFE4E6";
        ctx.beginPath();
        ctx.arc(tx, 185, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Outer containment trim
    ctx.strokeStyle = isMono
      ? "#CBD5E1"
      : secrets.combinedUnlocked
        ? "#FACC15"
        : "rgba(192, 132, 252, 0.7)";
    ctx.lineWidth = secrets.combinedUnlocked ? 3 : 2.2;
    ctx.strokeRect(vr.x, vr.y, vr.w, vr.h - 24);

    // Vault arcane floor circle under Altar (800, 188)
    const acx = 800;
    const acy = 188;
    ctx.save();
    ctx.translate(acx, acy);
    ctx.rotate(t * (secrets.combinedUnlocked ? 0.38 : -0.14));
    ctx.strokeStyle = isMono
      ? "#E2E8F0"
      : secrets.combinedUnlocked
        ? "rgba(250, 204, 21, 0.75)"
        : "rgba(192, 132, 252, 0.42)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 94, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Twin Serpent-Gargoyle Entrance Plinths flanking stairs
    drawGargoylePlinth(
      ctx,
      vr.x + 68,
      vr.y + vr.h - 14,
      1,
      secrets.baoClue ? "#E879F9" : "#9333EA",
      secrets.baoClue ? "#F5D0FE" : "#C084FC",
      isMono,
      Boolean(secrets.baoClue)
    );
    drawGargoylePlinth(
      ctx,
      vr.x + vr.w - 68,
      vr.y + vr.h - 14,
      -1,
      secrets.tinClue ? "#FB7185" : "#9F1239",
      secrets.tinClue ? "#FFE4E6" : "#FB7185",
      isMono,
      Boolean(secrets.tinClue)
    );

    // 4 Vault Corner Soul Braziers
    const vaultFlameMode = secrets.combinedUnlocked ? "gold" : "violet";
    drawBraizerFlame(ctx, vr.x + 26, vr.y + 28, t, 0.88, isMono, secrets.baoClue ? vaultFlameMode : "violet", allowGlows);
    drawBraizerFlame(ctx, vr.x + vr.w - 26, vr.y + 28, t, 0.88, isMono, secrets.tinClue ? (secrets.combinedUnlocked ? "gold" : "crimson") : "violet", allowGlows);
    drawBraizerFlame(ctx, vr.x + 26, vr.y + vr.h - 46, t, 0.88, isMono, secrets.baoClue ? vaultFlameMode : "violet", allowGlows);
    drawBraizerFlame(ctx, vr.x + vr.w - 26, vr.y + vr.h - 46, t, 0.88, isMono, secrets.tinClue ? (secrets.combinedUnlocked ? "gold" : "crimson") : "violet", allowGlows);

    // Engraved Title Ribbon
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(10, 6, 16, 0.9)";
    ctx.fillRect(vr.x + vr.w / 2 - 110, vr.y + 8, 220, 20);
    ctx.strokeStyle = isMono
      ? "#CBD5E1"
      : secrets.combinedUnlocked
        ? "#FACC15"
        : "rgba(192, 132, 252, 0.6)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(vr.x + vr.w / 2 - 110, vr.y + 8, 220, 20);
    ctx.font = '800 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono
      ? "#F8FAFC"
      : secrets.combinedUnlocked
        ? "#FEF08A"
        : "#E9D5FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      secrets.combinedUnlocked ? "HẦM BÍ MẬT · DỰ ÁN #ZERO-00" : "HẦM BÍ MẬT CỔ THÀNH",
      vr.x + vr.w / 2,
      vr.y + 18
    );
    ctx.restore();
  }

  // 7. Southern Citadel Gate Threshold (x:650, y:1384, w:300, h:52)
  const ga = BLOOD_CITADEL_GATE_ARCH;
  if (isCircleInViewBounds(ga.x + ga.w * 0.5, ga.y + ga.h * 0.5, 240, viewBounds)) {
    ctx.save();
    ctx.fillStyle = isMono ? "#212836" : "#1C0B0E";
    ctx.fillRect(ga.x, ga.y, ga.w, ga.h);
    // Heavy wrought-iron portcullis grate bars sunk into stone
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(120, 113, 108, 0.56)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let gx = ga.x + 18; gx <= ga.x + ga.w - 18; gx += 22) {
      ctx.moveTo(gx, ga.y + 4);
      ctx.lineTo(gx, ga.y + ga.h - 4);
    }
    ctx.moveTo(ga.x + 6, ga.y + ga.h * 0.5);
    ctx.lineTo(ga.x + ga.w - 6, ga.y + ga.h * 0.5);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#CBD5E1" : "#B45309";
    ctx.lineWidth = 2.6;
    ctx.strokeRect(ga.x, ga.y, ga.w, ga.h);

    // Engraved Gate Plaque
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(17, 7, 9, 0.92)";
    ctx.fillRect(ga.x + ga.w / 2 - 110, ga.y + ga.h / 2 - 11, 220, 22);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(245, 158, 11, 0.72)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(ga.x + ga.w / 2 - 110, ga.y + ga.h / 2 - 11, 220, 22);
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#F8FAFC" : "#FCD34D";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CỔNG THÀNH HUYẾT TÁNG", ga.x + ga.w / 2, ga.y + ga.h / 2);

    // Twin gatehouse braziers flanking threshold
    drawBraizerFlame(ctx, ga.x + 16, ga.y + ga.h + 15, t, 1.0, isMono, "crimson", allowGlows);
    drawBraizerFlame(ctx, ga.x + ga.w - 16, ga.y + ga.h + 15, t, 1.0, isMono, "crimson", allowGlows);
    ctx.restore();
  }

  // 8. Watchtower Stone Paved Aprons & Telegraph Danger Rings
  const rt = state.citadelRuntime;
  if (rt && rt.mapId === "blood_citadel") {
    for (const tw of rt.watchtowers || []) {
      if (!isCircleInViewBounds(tw.x, tw.y, tw.range + 24, viewBounds)) continue;
      ctx.save();
      ctx.translate(tw.x, tw.y);
      ctx.fillStyle = isMono ? "#232B3A" : "#18111A";
      ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(159, 18, 57, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, tw.radius + 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Buttress radial floor ribs
      ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.2)" : "rgba(180, 83, 9, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ra = (Math.PI * 2 * i) / 8;
        ctx.moveTo(Math.cos(ra) * (tw.radius + 4), Math.sin(ra) * (tw.radius + 4));
        ctx.lineTo(Math.cos(ra) * (tw.radius + 21), Math.sin(ra) * (tw.radius + 21));
      }
      ctx.stroke();

      // Inner bronze bevel ring
      ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(217, 119, 6, 0.48)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, tw.radius + 12, 0, Math.PI * 2);
      ctx.stroke();

      if (tw.state === "telegraph") {
        ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.45)" : "rgba(244, 63, 94, 0.28)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, tw.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // 9. Blood Traps (Iron Grates + Bubbling Crimson Core + Telegraph Countdown)
    for (const tr of rt.bloodTraps || []) {
      if (!isCircleInViewBounds(tr.x, tr.y, tr.radius + 24, viewBounds)) continue;
      ctx.save();
      ctx.translate(tr.x, tr.y);
      const warnPulse = 0.55 + 0.45 * Math.sin(t * 16);

      // Outer stone socket ring + rivets
      ctx.fillStyle = isMono ? "#212836" : "#140B10";
      ctx.beginPath();
      ctx.arc(0, 0, tr.radius + 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#94A3B8" : "#57534E";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 8 Iron rim rivets
      ctx.fillStyle = isMono ? "#CBD5E1" : "#78716C";
      for (let rv = 0; rv < 8; rv++) {
        const ra = (Math.PI * 2 * rv) / 8;
        ctx.beginPath();
        ctx.arc(Math.cos(ra) * (tr.radius + 3.5), Math.sin(ra) * (tr.radius + 3.5), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tr.state === "warning") {
        ctx.fillStyle = isMono
          ? "rgba(203, 213, 225, 0.28)"
          : `rgba(225, 29, 72, ${0.26 + warnPulse * 0.24})`;
        ctx.strokeStyle = isMono ? "#F8FAFC" : "#FDA4AF";
        ctx.lineWidth = 3;
      } else if (tr.state === "erupt") {
        ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.36)" : "rgba(244, 63, 94, 0.48)";
        ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
        ctx.lineWidth = 3.2;
      } else if (tr.state === "cooldown") {
        ctx.fillStyle = isMono ? "rgba(15, 23, 42, 0.45)" : "rgba(28, 25, 23, 0.74)";
        ctx.strokeStyle = isMono ? "#64748B" : "rgba(120, 113, 108, 0.5)";
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = isMono ? "rgba(15, 23, 42, 0.28)" : "rgba(136, 19, 55, 0.34)";
        ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(244, 63, 94, 0.64)";
        ctx.lineWidth = 2.2;
      }

      ctx.beginPath();
      ctx.arc(0, 0, tr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cast-iron drainage bars across blood basin
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, tr.radius - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = isMono ? "rgba(15, 23, 42, 0.7)" : "rgba(24, 24, 27, 0.8)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let gx = -tr.radius + 14; gx <= tr.radius - 14; gx += 16) {
        ctx.moveTo(gx, -tr.radius);
        ctx.lineTo(gx, tr.radius);
      }
      ctx.stroke();

      // Swirling rising blood bubbles when idle/warning
      if (!isMono && tr.state !== "cooldown" && tier !== "saver") {
        ctx.fillStyle = tr.state === "warning" ? "#FDA4AF" : "rgba(244, 63, 94, 0.68)";
        for (let b = 0; b < 4; b++) {
          const ba = b * 1.57 + t * (tr.state === "warning" ? 2.8 : 1.1);
          const br = 10 + ((t * 15 + b * 9) % (tr.radius * 0.6));
          ctx.beginPath();
          ctx.arc(Math.cos(ba) * br, Math.sin(ba) * br, b === 0 ? 2.6 : 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Inner ritual ring + eruption spikes / warning sweep
      ctx.strokeStyle =
        tr.state === "warning"
          ? "#FDE047"
          : tr.state === "erupt"
            ? "#FECDD3"
            : isMono
              ? "#94A3B8"
              : "rgba(251, 113, 133, 0.54)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, tr.radius * 0.52, 0, Math.PI * 2);
      ctx.stroke();

      if (tr.state === "warning") {
        const prog = Math.max(0.06, Math.min(1, 1 - tr.timer / 0.95));
        ctx.beginPath();
        ctx.arc(0, 0, tr.radius * prog, 0, Math.PI * 2);
        ctx.strokeStyle = isMono ? "#F8FAFC" : "#FDE047";
        ctx.lineWidth = 2.6;
        ctx.stroke();
      } else if (tr.state === "erupt") {
        ctx.fillStyle = isMono ? "#E2E8F0" : "#FDA4AF";
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI * 2 * k) / 6 + t * 2.4;
          const rIn = tr.radius * 0.25;
          const rOut = tr.radius * 0.86;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang - 0.14) * rIn, Math.sin(ang - 0.14) * rIn);
          ctx.lineTo(Math.cos(ang) * rOut, Math.sin(ang) * rOut);
          ctx.lineTo(Math.cos(ang + 0.14) * rIn, Math.sin(ang + 0.14) * rIn);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 10. Ambush Zones (Summoning Sigils + Fallen Weapons/Banners Storytelling)
    for (let idx = 0; idx < (rt.ambushZones || []).length; idx++) {
      const az = rt.ambushZones[idx];
      if (!isCircleInViewBounds(az.x, az.y, az.triggerRadius + 28, viewBounds)) continue;
      drawFloorRelicWeapons(ctx, az.x - 42, az.y + 18, 0.4 + idx, isMono);
      drawFloorRelicWeapons(ctx, az.x + 38, az.y - 22, -0.8 - idx, isMono);

      if (az.state === "cooldown") continue;
      ctx.save();
      ctx.translate(az.x, az.y);
      const isWarn = az.state === "warning";
      ctx.strokeStyle = isMono
        ? isWarn
          ? "#F8FAFC"
          : "rgba(203, 213, 225, 0.25)"
        : isWarn
          ? "#FB7185"
          : "rgba(168, 85, 247, 0.32)";
      ctx.lineWidth = isWarn ? 3 : 1.5;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, az.triggerRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isWarn) {
        ctx.rotate(t * 2.2);
        ctx.fillStyle = "rgba(190, 18, 60, 0.14)";
        ctx.beginPath();
        ctx.arc(0, 0, az.triggerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isMono ? "#E2E8F0" : "#E879F9";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i) / 6;
          ctx.moveTo(Math.cos(a) * az.triggerRadius * 0.45, Math.sin(a) * az.triggerRadius * 0.45);
          ctx.lineTo(
            Math.cos(a + Math.PI * 0.66) * az.triggerRadius * 0.88,
            Math.sin(a + Math.PI * 0.66) * az.triggerRadius * 0.88
          );
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 11. Environmental Floor Lore Details around Easter Egg Shrines (Ultra-Detailed Tin #MT-07 & Bảo #BS-04)
  // NE Floor Alchemy Sanctuary & Ma Thach Conduit around Tin Lab (1440, 175)
  if (isCircleInViewBounds(1440, 175, 185, viewBounds)) {
    const tinHere = heroId === "tin";
    const active = tinHere || secrets.tinClue;
    ctx.save();
    ctx.translate(1440, 175);

    // Outer double alchemical sanctuary circle + etched cardinal tick notches
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.35)" : active ? "rgba(244, 63, 94, 0.56)" : "rgba(159, 18, 57, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 96, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.25)" : active ? "rgba(251, 191, 36, 0.42)" : "rgba(190, 18, 60, 0.24)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.stroke();

    for (let tick = 0; tick < 12; tick++) {
      const ta = (Math.PI * 2 * tick) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * 82, Math.sin(ta) * 82);
      ctx.lineTo(Math.cos(ta) * 96, Math.sin(ta) * 96);
      ctx.stroke();
    }

    // Rotating Hexagram Transmutation Seal on stone floor
    ctx.save();
    ctx.rotate(t * (tinHere ? 0.38 : 0.09));
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.28)" : active ? "rgba(251, 113, 133, 0.42)" : "rgba(190, 18, 60, 0.24)";
    ctx.lineWidth = 1.4;
    for (let tri = 0; tri < 2; tri++) {
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const a = (Math.PI * 2 * v) / 3 + tri * (Math.PI / 3);
        const vx = Math.cos(a) * 78;
        const vy = Math.sin(a) * 78;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Branching Crimson Ma Thach Capillary Conduits feeding into Workbench + animated plasma motes
    const conduits = [
      [-88, -32, -52, -16, -30, -5],
      [74, 58, 40, 38, 24, 15],
      [-76, 52, -46, 30, -24, 12],
      [68, -62, 42, -32, 22, -12],
    ];
    for (let ci = 0; ci < conduits.length; ci++) {
      const [sx, sy, cx1, cy1, ex, ey] = conduits[ci];
      ctx.strokeStyle = isMono ? "#475569" : tinHere ? "#FB7185" : active ? "#E11D48" : "#881337";
      ctx.lineWidth = tinHere ? 3.4 : 2.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cx1, cy1, ex, ey);
      ctx.stroke();

      // Traveling crimson Ma Thach droplet flowing into bench
      if (!isMono && tier !== "saver") {
        const p = (t * 0.65 + ci * 0.25) % 1;
        const ip = 1 - p;
        const mx = ip * ip * sx + 2 * ip * p * cx1 + p * p * ex;
        const my = ip * ip * sy + 2 * ip * p * cy1 + p * p * ey;
        ctx.fillStyle = tinHere ? "#FFE4E6" : "#FDA4AF";
        ctx.beginPath();
        ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spilled crimson elixir puddles, Ma Thach crystal outcrops & glinting glass shards
    if (!isMono) {
      ctx.fillStyle = "rgba(190, 18, 60, 0.38)";
      ctx.beginPath();
      ctx.ellipse(-44, 34, 15, 7.5, 0.3, 0, Math.PI * 2);
      ctx.ellipse(48, -42, 11, 5.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Natural Ma Thach floor crystal clusters sprouting in corner
    drawCrystalShard(ctx, -68, 44, 8, -0.4, isMono ? "#94A3B8" : "#E11D48", isMono ? "#E2E8F0" : "#FDA4AF");
    drawCrystalShard(ctx, -58, 52, 6, 0.35, isMono ? "#CBD5E1" : "#F43F5E", isMono ? "#F8FAFC" : "#FFE4E6");
    drawCrystalShard(ctx, 64, -54, 7.5, 0.6, isMono ? "#94A3B8" : "#E11D48", isMono ? "#E2E8F0" : "#FDA4AF");

    // Glinting broken glass shards
    ctx.fillStyle = isMono ? "#CBD5E1" : "rgba(254, 205, 211, 0.55)";
    for (const [sx, sy, rot] of [
      [-48, 28, 0.4],
      [-34, 42, -0.7],
      [40, -34, 0.9],
      [28, 42, -0.3],
    ]) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(3, 3);
      ctx.lineTo(-3, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Etched Stone Code Plaque "#MT-07 · TIN"
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(18, 7, 13, 0.88)";
    ctx.fillRect(-48, 60, 96, 17);
    ctx.strokeStyle = isMono ? "#CBD5E1" : active ? "rgba(251, 113, 133, 0.72)" : "rgba(159, 18, 57, 0.5)";
    ctx.lineWidth = 1.1;
    ctx.strokeRect(-48, 60, 96, 17);
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#F8FAFC" : tinHere ? "#FFE4E6" : "#FDA4AF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("#MT-07 · TIN", 0, 68.5);

    // Lab Crimson Corner Braziers
    drawBraizerFlame(ctx, -68, -56, t, 0.84, isMono, "crimson", allowGlows);
    drawBraizerFlame(ctx, 64, 52, t + 0.5, 0.74, isMono, tinHere ? "gold" : "crimson", allowGlows);
    ctx.restore();
  }

  // SW Floor Fractured Mirror Mosaic, Diverging Footprints & #BS-04 Stencil around Bao Mirror (165, 1215)
  if (isCircleInViewBounds(165, 1215, 185, viewBounds)) {
    const baoHere = heroId === "bao";
    const active = baoHere || secrets.baoClue;
    ctx.save();
    ctx.translate(165, 1215);

    // Outer double fractured obsidian mosaic perimeter
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.35)" : active ? "rgba(192, 132, 252, 0.56)" : "rgba(126, 34, 206, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 94, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.24)" : active ? "rgba(232, 121, 249, 0.42)" : "rgba(147, 51, 234, 0.24)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Radiating spiderweb mirror fracture lines across the flagstones (10 jagged seams)
    ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.3)" : active ? "rgba(232, 121, 249, 0.38)" : "rgba(147, 51, 234, 0.22)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (Math.PI * 2 * k) / 10 + 0.24;
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a + 0.13) * 52, Math.sin(a + 0.13) * 52);
      ctx.lineTo(Math.cos(a - 0.06) * 82, Math.sin(a - 0.06) * 82);
    }
    ctx.stroke();

    // Diverging Twin Footprints: Solid shadow trail vs Lagging Violet Phantom trail stepping out of mirror!
    const fpPulse = 0.28 + 0.22 * Math.sin(t * 2.5);
    for (let step = 0; step < 5; step++) {
      const angA = 0.18 + step * 0.24;
      const distA = 34 + step * 11;
      const fx = Math.cos(angA) * distA;
      const fy = Math.sin(angA) * distA;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(angA + (step % 2 === 0 ? 0.15 : -0.15));
      ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.26)" : `rgba(232, 121, 249, ${baoHere ? fpPulse + 0.24 : fpPulse})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Secondary diverging phantom trail drifting toward SE
      const angB = 0.65 + step * 0.18;
      const distB = 38 + step * 12;
      ctx.save();
      ctx.translate(Math.cos(angB) * distB, Math.sin(angB) * distB);
      ctx.rotate(angB + (step % 2 === 0 ? -0.15 : 0.15));
      ctx.fillStyle = isMono ? "rgba(148, 163, 184, 0.22)" : `rgba(168, 85, 247, ${(baoHere ? fpPulse + 0.18 : fpPulse) * 0.72})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Glinting silver mirror shards on stone
    ctx.fillStyle = isMono ? "#CBD5E1" : "rgba(243, 232, 255, 0.62)";
    for (const [sx, sy, rot] of [
      [-52, 28, 0.5],
      [50, -24, -0.4],
      [30, 46, 1.1],
      [-34, -48, -0.9],
      [58, 18, 0.2],
    ]) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.lineTo(4.2, 3);
      ctx.lineTo(-3.2, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Etched Stone Code Plaque "#BS-04 · BẢO"
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(16, 8, 28, 0.88)";
    ctx.fillRect(-48, 60, 96, 17);
    ctx.strokeStyle = isMono ? "#CBD5E1" : active ? "rgba(232, 121, 249, 0.76)" : "rgba(147, 51, 234, 0.5)";
    ctx.lineWidth = 1.1;
    ctx.strokeRect(-48, 60, 96, 17);
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#F8FAFC" : baoHere ? "#FAE8FF" : "#E9D5FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("#BS-04 · BẢO", 0, 68.5);

    ctx.restore();
  }

  // 12. Fortified Outer Citadel Battlements Perimeter + Crenellations & Corner Bastions
  ctx.save();
  ctx.strokeStyle = isMono ? "#334155" : "#27141C";
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, W - 18, H - 18);

  // Masonry joint seams along outer parapet wall
  ctx.strokeStyle = isMono ? "rgba(15,23,42,0.4)" : "rgba(0,0,0,0.48)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let px = 60; px < W - 40; px += 48) {
    if (px >= viewBounds.minX && px <= viewBounds.maxX) {
      if (viewBounds.minY <= 36) { ctx.moveTo(px, 2); ctx.lineTo(px, 18); }
      if (viewBounds.maxY >= H - 36) { ctx.moveTo(px, H - 18); ctx.lineTo(px, H - 2); }
    }
  }
  for (let py = 60; py < H - 40; py += 48) {
    if (py >= viewBounds.minY && py <= viewBounds.maxY) {
      if (viewBounds.minX <= 36) { ctx.moveTo(2, py); ctx.lineTo(18, py); }
      if (viewBounds.maxX >= W - 36) { ctx.moveTo(W - 18, py); ctx.lineTo(W - 2, py); }
    }
  }
  ctx.stroke();

  // Inner gilded-crimson parapet trim
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#9F1239";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // Repeating perimeter stone merlons (culled to visible spans) with bevel outline
  ctx.fillStyle = isMono ? "#475569" : "#3A1E28";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#6D283A";
  ctx.lineWidth = 1;
  const merlonStep = 96;
  for (let mx = 64; mx < W - 64; mx += merlonStep) {
    if (mx + 24 >= viewBounds.minX && mx <= viewBounds.maxX) {
      if (viewBounds.minY <= 40) { ctx.fillRect(mx, 2, 24, 14); ctx.strokeRect(mx, 2, 24, 14); }
      if (viewBounds.maxY >= H - 40) { ctx.fillRect(mx, H - 16, 24, 14); ctx.strokeRect(mx, H - 16, 24, 14); }
    }
  }
  for (let my = 64; my < H - 64; my += merlonStep) {
    if (my + 24 >= viewBounds.minY && my <= viewBounds.maxY) {
      if (viewBounds.minX <= 40) { ctx.fillRect(2, my, 14, 24); ctx.strokeRect(2, my, 14, 24); }
      if (viewBounds.maxX >= W - 40) { ctx.fillRect(W - 16, my, 14, 24); ctx.strokeRect(W - 16, my, 14, 24); }
    }
  }

  // Corner fortified bastions with iron corner studs & signal braziers
  const corners = [
    [14, 14, 34, 34],
    [W - 48, 14, W - 34, 34],
    [14, H - 48, 34, H - 34],
    [W - 48, H - 48, W - 34, H - 34],
  ];
  for (const [cxp, cyp, fx, fy] of corners) {
    if (!isCircleInViewBounds(cxp + 17, cyp + 17, 56, viewBounds)) continue;
    ctx.fillStyle = isMono ? "#334155" : "#311B24";
    ctx.fillRect(cxp, cyp, 34, 34);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#B45309";
    ctx.lineWidth = 2;
    ctx.strokeRect(cxp, cyp, 34, 34);
    drawBraizerFlame(ctx, fx, fy, t, 0.74, isMono, "crimson", allowGlows);
  }
  ctx.restore();
}

function drawExtrudedStoneObstacle(ctx, ob, rt, t, isMono, secrets, allowGlows) {
  const isCollapsible = ob.kind === "collapsible_wall";
  const cwRef = isCollapsible ? rt.collapsibleWalls.find((c) => c.id === ob.id) : null;
  const isWarning = Boolean(cwRef && cwRef.state === "warning");
  const shakeX = isWarning ? Math.sin(t * 72) * 2.5 : 0;
  const shakeY = isWarning ? Math.cos(t * 64) * 2.0 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Ground cast shadow (bottom-right)
  ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
  ctx.fillRect(ob.x + 6, ob.y + 8, ob.w, ob.h);

  let topColor = "#2E2933";
  let faceColor = "#1B161E";
  let edgeColor = "#71717A";
  let trimColor = "#44403C";

  if (isMono) {
    topColor = "#2E384B";
    faceColor = "#161D29";
    edgeColor = "#CBD5E1";
    trimColor = "#64748B";
  } else if (ob.kind === "vault_wall") {
    topColor = secrets?.combinedUnlocked ? "#3B174E" : "#281340";
    faceColor = "#150924";
    edgeColor = secrets?.combinedUnlocked ? "#FACC15" : "#C084FC";
    trimColor = "#6B21A8";
  } else if (ob.kind === "gate_wall") {
    topColor = "#3A2024";
    faceColor = "#1F0E12";
    edgeColor = "#B45309";
    trimColor = "#9F1239";
  } else if (ob.kind === "ruin_structure") {
    topColor = "#2C252B";
    faceColor = "#181317";
    edgeColor = "#78716C";
    trimColor = "#57534E";
  } else if (ob.kind === "ruin_pillar") {
    topColor = "#3F3A42";
    faceColor = "#1F1B22";
    edgeColor = "#A8A29E";
    trimColor = "#78716C";
  } else if (isCollapsible) {
    topColor = isWarning ? "#574131" : "#3F3834";
    faceColor = "#241E1B";
    edgeColor = isWarning ? "#FDE047" : "#A8A29E";
    trimColor = "#78716C";
  }

  // Southern vertical masonry facade inside lower slice for crisp 2.5D top-down depth
  const faceH = Math.min(15, Math.max(8, Math.round(ob.h * 0.28)));
  const topH = Math.max(4, ob.h - faceH);
  ctx.fillStyle = faceColor;
  ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

  // Upper parapet roof cap
  ctx.fillStyle = topColor;
  ctx.fillRect(ob.x + 1, ob.y + 1, Math.max(2, ob.w - 2), Math.max(2, topH));

  // Staggered running-bond ashlar masonry stone courses on BOTH top cap AND front vertical facade
  ctx.strokeStyle = isMono ? "rgba(203, 213, 225, 0.24)" : "rgba(0, 0, 0, 0.45)";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  const rowH = topH > 46 ? 20 : 15;
  const rows = Math.max(1, Math.floor(topH / rowH));
  for (let r = 1; r < rows; r++) {
    const ry = ob.y + (topH * r) / rows;
    ctx.moveTo(ob.x + 2, ry);
    ctx.lineTo(ob.x + ob.w - 2, ry);
  }
  const brickW = 28;
  for (let r = 0; r < rows; r++) {
    const ry0 = ob.y + (topH * r) / rows + 1;
    const ry1 = ob.y + (topH * (r + 1)) / rows;
    const stagger = r % 2 === 1 ? brickW * 0.5 : 0;
    for (let sx = ob.x + 16 + stagger; sx < ob.x + ob.w - 10; sx += brickW) {
      ctx.moveTo(sx, ry0);
      ctx.lineTo(sx, ry1);
    }
  }
  // Ridge seam & vertical front-facade masonry joints
  ctx.moveTo(ob.x, ob.y + topH);
  ctx.lineTo(ob.x + ob.w, ob.y + topH);
  for (let fx = ob.x + 22; fx < ob.x + ob.w - 8; fx += 24) {
    ctx.moveTo(fx, ob.y + topH);
    ctx.lineTo(fx, ob.y + ob.h - 1);
  }
  ctx.stroke();

  // Subtle individual block tone & weathered surface cracks
  const blockCols = Math.max(1, Math.floor(ob.w / 46));
  for (let i = 0; i < blockCols; i++) {
    const hv = hashCell(Math.round(ob.x + i * 29), Math.round(ob.y));
    if (hv > 0.6) {
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.fillRect(ob.x + 3 + i * (ob.w / blockCols), ob.y + 3, (ob.w / blockCols) * 0.48, Math.min(9, topH * 0.45));
    }
    if (hv > 0.72 && ob.w >= 42 && topH >= 18) {
      const cx = ob.x + 12 + (ob.w - 24) * hv;
      const cy = ob.y + 6 + (topH - 12) * ((hv * 3.1) % 1);
      ctx.strokeStyle = "rgba(0,0,0,0.52)";
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 3);
      ctx.lineTo(cx, cy + 1);
      ctx.lineTo(cx + 7, cy - 2);
      ctx.stroke();
    }
  }

  // Iron/Bronze corner clamp plates on walls
  if (ob.w >= 48 && ob.h >= 24) {
    ctx.fillStyle = isMono ? "#94A3B8" : "#57534E";
    ctx.fillRect(ob.x + 2, ob.y + 2, 5, 5);
    ctx.fillRect(ob.x + ob.w - 7, ob.y + 2, 5, 5);
  }

  // Top bevel highlight
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.22)" : "rgba(255, 241, 242, 0.16)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ob.x + 2, ob.y + 2);
  ctx.lineTo(ob.x + ob.w - 2, ob.y + 2);
  ctx.stroke();

  // Outer silhouette border (collision box exact)
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = isWarning ? 3 : 2.1;
  ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

  // Kind-specific architectural ornaments
  if (ob.kind === "ruin_pillar") {
    const px = ob.x + ob.w * 0.5;
    const py = ob.y + (ob.h - faceH * 0.4) * 0.5;
    const pr = Math.min(ob.w, ob.h) * 0.36;
    ctx.fillStyle = isMono ? "#475569" : "#57534E";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#E2E8F0" : "#D6D3D1";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#0F172A" : "#1C1917";
    ctx.beginPath();
    ctx.arc(px, py, pr * 0.58, 0, Math.PI * 2);
    ctx.moveTo(px - pr * 0.55, py - pr * 0.35);
    ctx.lineTo(px + pr * 0.45, py + pr * 0.5);
    ctx.stroke();
  } else if (ob.kind === "vault_wall") {
    const pulse = 0.65 + 0.35 * Math.sin(t * 3.5);
    ctx.fillStyle = isMono
      ? "#E2E8F0"
      : secrets?.combinedUnlocked
        ? "#FDE047"
        : `rgba(216, 180, 254, ${pulse})`;
    for (let gy = ob.y + 28; gy < ob.y + ob.h - 24; gy += 42) {
      ctx.beginPath();
      ctx.moveTo(ob.x + ob.w * 0.5, gy - 5.5);
      ctx.lineTo(ob.x + ob.w * 0.5 + 5.5, gy);
      ctx.lineTo(ob.x + ob.w * 0.5, gy + 5.5);
      ctx.lineTo(ob.x + ob.w * 0.5 - 5.5, gy);
      ctx.closePath();
      ctx.fill();
    }
  } else if (ob.kind === "gate_wall") {
    ctx.fillStyle = isMono ? "#475569" : trimColor;
    for (let bx = ob.x + 20; bx < ob.x + ob.w - 16; bx += 44) {
      ctx.fillRect(bx - 5, ob.y + 5, 10, 8);
    }
    const innerEdgeX = ob.id === "gate_wall_w" ? ob.x + ob.w - 24 : ob.x + 6;
    const sway = Math.sin(t * 3.2 + ob.x * 0.01) * 2.5;
    drawTatteredBanner(ctx, innerEdgeX, ob.y + ob.h - 2, 18, 22, "#9F1239", "#F59E0B", isMono, sway);
  } else if (ob.kind === "ruin_structure") {
    ctx.strokeStyle = isMono ? "#64748B" : "#44403C";
    ctx.lineWidth = 2.4;
    for (let ry = ob.y + 24; ry < ob.y + ob.h - 24; ry += 34) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 8, ry);
      ctx.lineTo(ob.x + ob.w - 8, ry + 6);
      ctx.stroke();
    }
    const torchX = ob.id === "ruin_west_watch" ? ob.x + ob.w + 10 : ob.x - 10;
    drawBraizerFlame(ctx, torchX, ob.y + ob.h * 0.5, t, 0.86, isMono, "crimson", allowGlows);
  } else if (ob.kind === "stone_wall") {
    ctx.fillStyle = isMono ? "#64748B" : "#57534E";
    ctx.fillRect(ob.x + 12, ob.y + 4, 10, 7);
    ctx.fillRect(ob.x + ob.w - 22, ob.y + 4, 10, 7);
    const breachBannerX = ob.id === "north_wall_w" ? ob.x + ob.w - 22 : ob.x + 4;
    const sway = Math.sin(t * 2.8 + ob.x * 0.02) * 2;
    drawTatteredBanner(ctx, breachBannerX, ob.y + ob.h - 2, 16, 19, "#6B21A8", "#C084FC", isMono, sway);
  } else if (isCollapsible) {
    ctx.strokeStyle = isWarning ? "#FDE047" : "rgba(251, 191, 36, 0.68)";
    ctx.lineWidth = isWarning ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.moveTo(ob.x + 8, ob.y + 5);
    ctx.lineTo(ob.x + ob.w * 0.34, ob.y + ob.h * 0.62);
    ctx.lineTo(ob.x + ob.w * 0.58, ob.y + ob.h * 0.32);
    ctx.lineTo(ob.x + ob.w - 10, ob.y + ob.h - 5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTinLabShrine(ctx, node, t, isMono, heroId, secrets, allowGlows) {
  const tinHere = heroId === "tin";
  const active = tinHere || secrets.tinClue;
  const pulse = 0.74 + 0.26 * Math.sin(t * (tinHere ? 7 : 3));

  // Floor alchemical seal circle
  ctx.fillStyle = isMono
    ? "rgba(226, 232, 240, 0.08)"
    : active
      ? `rgba(244, 63, 94, ${0.25 * pulse})`
      : "rgba(136, 19, 55, 0.16)";
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#CBD5E1" : tinHere ? "#FB7185" : secrets.tinClue ? "#F43F5E" : "#9F1239";
  ctx.lineWidth = tinHere ? 3 : 2;
  ctx.stroke();

  // Rotating outer & inner arcane tick rings
  ctx.save();
  ctx.rotate(t * (tinHere ? 1.55 : 0.45));
  ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(253, 164, 175, 0.68)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Ornate Alchemist Workbench (shadow + weathered mahogany + riveted iron rim)
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(-32, -10, 66, 31);
  ctx.fillStyle = isMono ? "#2B3444" : "#2D1E1D";
  ctx.fillRect(-34, -15, 68, 29);
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#A8A29E";
  ctx.lineWidth = 1.7;
  ctx.strokeRect(-34, -15, 68, 29);

  // Brass corner rivets on workbench
  ctx.fillStyle = isMono ? "#E2E8F0" : "#D97706";
  for (const [rx, ry] of [
    [-31, -12],
    [28.5, -12],
    [-31, 9],
    [28.5, 9],
  ]) {
    ctx.fillRect(rx, ry, 2.5, 2.5);
  }

  // Left: Rack of 4 glowing #MT-07 Crimson Blood Vials (Specimen #07 glows brightest)
  const vialPulse = 0.78 + 0.22 * Math.sin(t * 5);
  for (let i = 0; i < 4; i++) {
    const vx = -28 + i * 5.6;
    const vh = i === 3 ? 15 : 10 + (i % 2) * 2.5;
    ctx.fillStyle = isMono ? "#CBD5E1" : i === 3 ? "#FB7185" : `rgba(225, 29, 72, ${vialPulse})`;
    ctx.fillRect(vx, -vh + 3, 4.2, vh);
    // Cork & glass meniscus glint
    ctx.fillStyle = isMono ? "#F8FAFC" : i === 3 ? "#FFE4E6" : "#FDA4AF";
    ctx.fillRect(vx + 0.5, -vh + 3, 3.0, 2.5);
    ctx.fillStyle = isMono ? "#94A3B8" : "#B45309";
    ctx.fillRect(vx + 0.7, -vh + 1, 2.6, 2);
  }

  // Coiled brass alembic distillation tube + rising crimson bubbles into flask
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#F59E0B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.quadraticCurveTo(-3, -20, 3, -10);
  ctx.stroke();

  if (!isMono) {
    const bY = -12 - ((t * 14) % 9);
    ctx.fillStyle = "rgba(251, 113, 133, 0.85)";
    ctx.beginPath();
    ctx.arc(-3, bY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Right: Open Bloodshade Grimoire + scarlet ribbon + Ma Thach diagram + wax seal
  ctx.fillStyle = isMono ? "#E2E8F0" : "#FEF3C7";
  ctx.fillRect(8, -11, 20, 16);
  ctx.strokeStyle = isMono ? "#475569" : "#92400E";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, -11, 20, 16);
  // Book spine
  ctx.beginPath();
  ctx.moveTo(18, -11);
  ctx.lineTo(18, 5);
  ctx.stroke();
  // Text lines & Ma Thach diamond diagram
  ctx.strokeStyle = isMono ? "#1E293B" : "#BE123C";
  ctx.beginPath();
  ctx.moveTo(10, -7);
  ctx.lineTo(16, -7);
  ctx.moveTo(10, -3);
  ctx.lineTo(16, -3);
  ctx.moveTo(20, -7);
  ctx.lineTo(26, -7);
  ctx.moveTo(20, -3);
  ctx.lineTo(26, -3);
  ctx.stroke();
  // Scarlet bookmark ribbon & wax seal
  ctx.fillStyle = isMono ? "#475569" : "#E11D48";
  ctx.fillRect(16.5, 4, 3, 6);
  ctx.beginPath();
  ctx.arc(23, 1.5, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Center: Levitating Faceted Crimson Ma Thach Core + 4 Orbiting Shards inside Dual Brass Astrolabe
  const bobY = Math.sin(t * 4) * 3.4;
  if (!isMono && allowGlows) {
    const cg = ctx.createRadialGradient(0, -21 + bobY, 2, 0, -21 + bobY, 28);
    cg.addColorStop(0, tinHere ? "rgba(251, 113, 133, 0.58)" : "rgba(225, 29, 72, 0.36)");
    cg.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, -21 + bobY, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(0, -21 + bobY);

  // Orbiting miniature crystallized Ma Thach shard satellites
  for (let si = 0; si < 4; si++) {
    const sang = t * (tinHere ? 2.2 : 1.1) + (Math.PI * 2 * si) / 4;
    const ox = Math.cos(sang) * 20;
    const oy = Math.sin(sang) * 9;
    drawCrystalShard(
      ctx,
      ox,
      oy,
      si % 2 === 0 ? 4.4 : 3.5,
      sang + Math.PI * 0.5,
      isMono ? "#CBD5E1" : "#F43F5E",
      isMono ? "#F8FAFC" : "#FDE047"
    );
  }

  // Dual spinning brass astrolabe gyro rings
  ctx.save();
  ctx.rotate(t * 1.35);
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#FBBF24";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 6.8, 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(-t * 1.15);
  ctx.strokeStyle = isMono ? "#94A3B8" : "#FB7185";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 6.2, -0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Faceted Crimson Ma Thach Core
  ctx.fillStyle = isMono ? "#E2E8F0" : tinHere ? "#FECDD3" : "#F43F5E";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -13.5);
  ctx.lineTo(9.8, 0);
  ctx.lineTo(0, 13.5);
  ctx.lineTo(-9.8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Inner crystal facet lines
  ctx.strokeStyle = isMono ? "#1E293B" : "#FFF1F2";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -11.5);
  ctx.lineTo(0, 11.5);
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.stroke();
  ctx.restore();

  // Active Resonance Badge when Tin stands in his lab
  if (tinHere) {
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#F8FAFC" : "#FFE4E6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♥ HUYẾT MẠCH TIN · #MT-07", 0, 34);
  }
}

function drawBaoMirrorShrine(ctx, node, t, rt, isMono, heroId, secrets, allowGlows, playerRelX = 0, playerRelY = 0) {
  const baoHere = heroId === "bao";
  const active = baoHere || secrets.baoClue;
  const phase = rt.baoShadowPhase || t;

  // Floor shadow & aura circle
  ctx.fillStyle = isMono
    ? "rgba(226, 232, 240, 0.08)"
    : active
      ? "rgba(168, 85, 247, 0.26)"
      : "rgba(88, 28, 135, 0.16)";
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#CBD5E1" : baoHere ? "#E879F9" : "#9333EA";
  ctx.lineWidth = baoHere ? 3 : 2;
  ctx.stroke();

  // Scattered #BS-04 Replica dossier sheets + miniature shadow dagger pinning a page
  ctx.fillStyle = isMono ? "#94A3B8" : "#CBD5E1";
  ctx.fillRect(-32, 13, 15, 11);
  ctx.fillRect(16, 15, 14, 10);
  ctx.strokeStyle = isMono ? "#F8FAFC" : "#E879F9";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-27, 17);
  ctx.lineTo(-21, 11);
  ctx.moveTo(-25, 11);
  ctx.lineTo(-21, 15);
  ctx.stroke();

  // Four flickering violet soul-candles forming crescent around mirror
  drawCandleFlame(ctx, -35, 8, t, 0.95, isMono, "#E879F9");
  drawCandleFlame(ctx, 35, 8, t + 0.7, 0.95, isMono, "#E879F9");
  drawCandleFlame(ctx, -44, -6, t + 1.3, 0.8, isMono, "#C084FC");
  drawCandleFlame(ctx, 44, -6, t + 2.1, 0.8, isMono, "#C084FC");

  // Ornate Gothic Pedestal Base
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(-23, 6, 48, 14);
  ctx.fillStyle = isMono ? "#2B3444" : "#1E1630";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#A855F7";
  ctx.lineWidth = 1.6;
  ctx.fillRect(-24, 4, 48, 12);
  ctx.strokeRect(-24, 4, 48, 12);

  // Orbiting 5 Razor Mirror Glass Shards suspended around frame
  for (let si = 0; si < 5; si++) {
    const ang = phase * (baoHere ? 1.35 : 0.75) + (Math.PI * 2 * si) / 5;
    const sx = Math.cos(ang) * 32;
    const sy = -10 + Math.sin(ang) * 14;
    drawCrystalShard(
      ctx,
      sx,
      sy,
      si % 2 === 0 ? 4.8 : 3.6,
      ang + phase * 1.4,
      isMono ? "#E2E8F0" : "rgba(245, 208, 254, 0.78)",
      isMono ? "#475569" : "#C084FC"
    );
  }

  // Crowned Silver-Obsidian Arch Mirror Frame
  if (!isMono && allowGlows) {
    const mg = ctx.createRadialGradient(0, -10, 4, 0, -10, 36);
    mg.addColorStop(0, baoHere ? "rgba(232, 121, 249, 0.44)" : "rgba(147, 51, 234, 0.28)");
    mg.addColorStop(1, "rgba(88, 28, 135, 0)");
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(0, -10, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isMono ? "#161D29" : "#150D2E";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#C084FC";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, -10, 20, 29, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin shadow-raven wing crown atop mirror frame
  ctx.fillStyle = isMono ? "#2B3444" : "#3B0764";
  ctx.strokeStyle = isMono ? "#E2E8F0" : "#E879F9";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(-16, -45);
  ctx.lineTo(-9, -34);
  ctx.lineTo(0, -37);
  ctx.lineTo(9, -34);
  ctx.lineTo(16, -45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Skewed lagging reflection shimmer + uncanny moving silhouette inside glass
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -10, 17, 26, 0, 0, Math.PI * 2);
  ctx.clip();
  const shimmerShift = Math.sin(phase * 1.9) * 8;
  const trackX = baoHere ? Math.max(-7, Math.min(7, -playerRelX * 0.04)) : shimmerShift * 0.45;
  ctx.fillStyle = isMono ? "rgba(226, 232, 240, 0.14)" : "rgba(192, 132, 252, 0.24)";
  ctx.fillRect(-17 + shimmerShift, -37, 7, 56);
  // Trapped silhouette reflection inside mirror (misaligned from Bao!)
  ctx.fillStyle = isMono ? "rgba(203, 213, 225, 0.28)" : "rgba(245, 208, 254, 0.24)";
  ctx.beginPath();
  ctx.arc(trackX, -18, 5.2, 0, Math.PI * 2);
  ctx.moveTo(trackX - 8, 9);
  ctx.lineTo(trackX, -11);
  ctx.lineTo(trackX + 8, 9);
  ctx.closePath();
  ctx.fill();
  // Uncanny glowing reflection eyes inside mirror
  ctx.fillStyle = isMono ? "#FFFFFF" : "#E879F9";
  ctx.beginPath();
  ctx.arc(trackX - 2, -18, 1.3, 0, Math.PI * 2);
  ctx.arc(trackX + 2, -18, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Glass fracture lines (glow brighter when Bao stands close)
  ctx.strokeStyle = isMono ? "#F8FAFC" : baoHere ? "#FAE8FF" : "#F3E8FF";
  ctx.lineWidth = baoHere ? 1.7 : 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, -25);
  ctx.lineTo(3, -6);
  ctx.lineTo(-5, 14);
  ctx.moveTo(3, -6);
  ctx.lineTo(13, -13);
  ctx.moveTo(3, -6);
  ctx.lineTo(10, 9);
  ctx.stroke();

  // Two Trailing Phase-Glitch Afterimages behind Phantom
  for (let ai = 2; ai >= 1; ai--) {
    const trailPhase = phase - ai * 0.16;
    const trailX = Math.sin(trailPhase * 2.1) * (baoHere ? 34 : 25);
    const trailY = Math.cos(trailPhase * 1.6) * 14 - 8;
    ctx.save();
    ctx.globalAlpha = ai === 2 ? 0.14 : 0.26;
    ctx.translate(trailX, trailY);
    ctx.fillStyle = isMono ? "#475569" : "#9333EA";
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(12, 9);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Detailed Cloaked Double-Dagger Bao Phantom stepping out of glass
  const alpha = Math.max(0.32, 0.65 + 0.32 * Math.sin(phase * 4.5));
  const offX = Math.sin(phase * 2.1) * (baoHere ? 34 : 25);
  const offY = Math.cos(phase * 1.6) * 14 - 8;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(offX, offY);

  // Flowing tattered shadow cape
  ctx.fillStyle = isMono ? "#1E293B" : "#4C1D95";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#E879F9";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(14, 9);
  ctx.lineTo(5, 15);
  ctx.lineTo(0, 11);
  ctx.lineTo(-5, 15);
  ctx.lineTo(-14, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin shadow daggers held at ready
  ctx.strokeStyle = isMono ? "#F8FAFC" : "#F5D0FE";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.lineTo(-21, -7);
  ctx.moveTo(11, 2);
  ctx.lineTo(21, -7);
  ctx.stroke();

  // Piercing phantom eyes
  ctx.fillStyle = isMono ? "#FFFFFF" : "#F5D0FE";
  ctx.beginPath();
  ctx.arc(-3.5, -4, 1.9, 0, Math.PI * 2);
  ctx.arc(3.5, -4, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle floating whisper when Bao approaches his mirror
  if (baoHere) {
    ctx.font = 'italic 700 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#F8FAFC" : "#F5D0FE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("“Bản thể gốc... #BS-04?”", 0, -52);
  }
}

function drawSharedVaultAltarShrine(ctx, t, isMono, secrets, allowGlows) {
  const ready = Boolean(secrets.tinClue && secrets.baoClue);
  const awakened = Boolean(secrets.combinedUnlocked);

  // Outer sanctum aura
  ctx.fillStyle = isMono
    ? "rgba(226, 232, 240, 0.1)"
    : awakened
      ? "rgba(250, 204, 21, 0.28)"
      : ready
        ? "rgba(232, 121, 249, 0.24)"
        : "rgba(30, 41, 59, 0.35)";
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#CBD5E1" : awakened ? "#FACC15" : ready ? "#F472B6" : "#64748B";
  ctx.lineWidth = 2.8;
  ctx.stroke();

  if (!isMono && allowGlows && (ready || awakened)) {
    const ag = ctx.createRadialGradient(0, 0, 6, 0, 0, 62);
    ag.addColorStop(0, awakened ? "rgba(250, 204, 21, 0.36)" : "rgba(244, 114, 182, 0.28)");
    ag.addColorStop(1, "rgba(10, 6, 16, 0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twin Carved Flanking Serpent Steles (Tin Crimson Left & Bao Violet Right) + orbiting soul-wisps when unlocked
  for (const side of [-1, 1]) {
    const sx = side * 54;
    const isLit = side === -1 ? secrets.tinClue : secrets.baoClue;
    const steleColor = side === -1 ? "#F43F5E" : "#C084FC";
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(sx - 6, -15, 14, 34);
    ctx.fillStyle = isMono ? "#2B3444" : "#1F1426";
    ctx.strokeStyle = isMono ? "#CBD5E1" : isLit ? steleColor : "#52525B";
    ctx.lineWidth = 1.6;
    ctx.fillRect(sx - 7, -18, 14, 34);
    ctx.strokeRect(sx - 7, -18, 14, 34);

    // Carved stele crest
    ctx.fillStyle = isMono ? "#E2E8F0" : isLit ? steleColor : "#3F3F46";
    ctx.beginPath();
    ctx.arc(sx, -2, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting wisp around awakened stele
    if (isLit && !isMono) {
      const wa = t * 2.4 + side * 1.5;
      ctx.fillStyle = side === -1 ? "#FFE4E6" : "#F5D0FE";
      ctx.beginPath();
      ctx.arc(sx + Math.cos(wa) * 11, -2 + Math.sin(wa) * 11, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Two-stepped Obsidian Dais
  ctx.fillStyle = isMono ? "#242C3D" : "#120B18";
  ctx.fillRect(-38, -19, 76, 38);
  ctx.strokeStyle = isMono ? "#94A3B8" : awakened ? "#F59E0B" : "#52525B";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-38, -19, 76, 38);

  ctx.fillStyle = isMono ? "#1B2230" : "#1A1024";
  ctx.fillRect(-32, -14, 64, 28);
  ctx.strokeStyle = isMono ? "#CBD5E1" : awakened ? "#FDE047" : "#71717A";
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-32, -14, 64, 28);

  // Ancient Forged Seal Chains binding the Vault Altar until combinedUnlocked!
  if (!awakened) {
    const cBody = ready ? "#D97706" : "#71717A";
    const cSpec = ready ? "#FEF08A" : "#CBD5E1";
    drawCitadelChain(ctx, -35, -16, 35, 16, 6.5, cBody, cSpec, isMono, 3);
    drawCitadelChain(ctx, 35, -16, -35, 16, 6.5, cBody, cSpec, isMono, -3);
    // Corner anchor iron rings
    ctx.strokeStyle = isMono ? "#E2E8F0" : cSpec;
    ctx.lineWidth = 1.6;
    for (const [ax, ay] of [[-35, -16], [35, -16], [-35, 16], [35, 16]]) {
      ctx.beginPath();
      ctx.arc(ax, ay, 3.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Central arcane seal padlock over crossed chains
    ctx.fillStyle = isMono ? "#0F172A" : "#2E1065";
    ctx.strokeStyle = isMono ? "#FFFFFF" : ready ? "#FACC15" : "#A855F7";
    ctx.lineWidth = 1.8;
    ctx.fillRect(-6, -5, 12, 11);
    ctx.strokeRect(-6, -5, 12, 11);
    ctx.beginPath();
    ctx.arc(0, -6, 4.2, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = ready ? "#FDE047" : "#E879F9";
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Shattered forged chain segments coiled around dais corners
    drawCitadelChain(ctx, -38, -20, -48, -28, 5.5, "#D97706", "#FEF08A", isMono, 2);
    drawCitadelChain(ctx, 38, -20, 49, -27, 5.5, "#D97706", "#FEF08A", isMono, -2);
    drawCitadelChain(ctx, -38, 20, -49, 27, 5.5, "#D97706", "#FEF08A", isMono, -2);
    drawCitadelChain(ctx, 38, 20, 48, 28, 5.5, "#D97706", "#FEF08A", isMono, 2);
  }

  // Converging crackling Dual-Helix leyline arc between Tin & Bao sockets
  ctx.strokeStyle = isMono
    ? "#F8FAFC"
    : awakened
      ? "#FDE047"
      : ready
        ? "#F472B6"
        : "#3F3F46";
  ctx.lineWidth = ready || awakened ? 2.5 : 1.8;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  if (ready) {
    const jitter = Math.sin(t * 22) * (awakened ? 4.2 : 3.5);
    ctx.lineTo(-6, jitter);
    ctx.lineTo(6, -jitter);
  }
  ctx.lineTo(18, 0);
  ctx.stroke();

  // Left socket (Tin crimson #MT-07)
  ctx.fillStyle = isMono
    ? secrets.tinClue
      ? "#F8FAFC"
      : "#475569"
    : secrets.tinClue
      ? "#F43F5E"
      : "#3F3F46";
  ctx.beginPath();
  ctx.arc(-18, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#FDA4AF";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right socket (Bao violet #BS-04)
  ctx.fillStyle = isMono
    ? secrets.baoClue
      ? "#F8FAFC"
      : "#475569"
    : secrets.baoClue
      ? "#C084FC"
      : "#3F3F46";
  ctx.beginPath();
  ctx.arc(18, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#E9D5FF";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Central Levitating Bloodshade Zero Codex & Twin-Orbiting 8-Point Relic Star when awakened
  if (awakened) {
    const bob = Math.sin(t * 3.5) * 2.5;
    ctx.save();
    ctx.translate(0, -4 + bob);

    ctx.save();
    ctx.rotate(-t * 0.8);
    ctx.strokeStyle = isMono ? "#F8FAFC" : "rgba(250, 204, 21, 0.78)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Twin orbiting crimson + violet gems around the golden Zero Star
    if (!isMono) {
      const ca = t * 2.1;
      ctx.fillStyle = "#FB7185";
      ctx.beginPath();
      ctx.arc(Math.cos(ca) * 23, Math.sin(ca) * 23, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#E879F9";
      ctx.beginPath();
      ctx.arc(Math.cos(ca + Math.PI) * 23, Math.sin(ca + Math.PI) * 23, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.rotate(t * 1.2);
    ctx.fillStyle = isMono ? "#F8FAFC" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#0F172A" : "#F59E0B";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 14 : 5.2;
      const a = (Math.PI * i) / 4;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}

export function renderBloodCitadelStructuresAndProps(ctx, state, isMono, viewBounds) {
  if (!state || state.activeMapId !== "blood_citadel" || !state.citadelRuntime) return;
  const rt = state.citadelRuntime;
  const t = state.elapsedTime || 0;
  const secrets = state.citadelSecrets || {};
  const obstacles = getActiveCitadelObstacles(rt);
  const allowGlows = Boolean(state.getPerformanceProfile?.().enableRadialGlows);

  // 1. Collapsed rubble footprints (scattered broken stone debris)
  for (const cw of rt.collapsibleWalls || []) {
    if (cw.state !== "collapsed") continue;
    if (!isCircleInViewBounds(cw.x + cw.w * 0.5, cw.y + cw.h * 0.5, Math.max(cw.w, cw.h), viewBounds)) {
      continue;
    }
    ctx.save();
    ctx.fillStyle = isMono ? "rgba(100,116,139,0.28)" : "rgba(41, 37, 36, 0.58)";
    ctx.fillRect(cw.x + 2, cw.y + 2, cw.w - 4, cw.h - 4);
    ctx.strokeStyle = isMono ? "#94A3B8" : "rgba(168, 162, 158, 0.44)";
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(cw.x, cw.y, cw.w, cw.h);
    ctx.setLineDash([]);

    const count = 9;
    for (let i = 0; i < count; i++) {
      const rx = cw.x + 10 + ((cw.w - 20) * ((i * 37 + 13) % 100)) / 100;
      const ry = cw.y + 7 + ((cw.h - 14) * ((i * 53 + 7) % 100)) / 100;
      const sz = 4 + (i % 3) * 2.2;
      ctx.fillStyle = isMono ? "#475569" : i % 2 === 0 ? "#57534E" : "#44403C";
      ctx.beginPath();
      ctx.rect(rx - sz * 0.6, ry - sz * 0.5, sz * 1.2, sz);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Solid Extruded Stone Obstacles
  for (const ob of obstacles) {
    if (ob.id.startsWith("tower_")) continue;
    if (!isCircleInViewBounds(ob.x + ob.w * 0.5, ob.y + ob.h * 0.5, Math.max(ob.w, ob.h) + 20, viewBounds)) {
      continue;
    }
    drawExtrudedStoneObstacle(ctx, ob, rt, t, isMono, secrets, allowGlows);
  }

  // 3. Fortified Watchtowers & Rotating Ballista Turrets
  for (const tw of rt.watchtowers || []) {
    if (!isCircleInViewBounds(tw.x, tw.y, tw.range + 40, viewBounds)) continue;
    const isTele = tw.state === "telegraph";

    if (isTele) {
      ctx.save();
      const urgent = tw.timer < 0.35;
      ctx.strokeStyle = isMono ? "#F8FAFC" : urgent ? "#FDE047" : "rgba(244, 63, 94, 0.9)";
      ctx.lineWidth = urgent ? 3.2 : 2.2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(tw.x, tw.y);
      ctx.lineTo(tw.targetX, tw.targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      const lockR = 16 + Math.max(0, tw.timer) * 10;
      ctx.beginPath();
      ctx.arc(tw.targetX, tw.targetY, lockR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tw.targetX - 10, tw.targetY);
      ctx.lineTo(tw.targetX + 10, tw.targetY);
      ctx.moveTo(tw.targetX, tw.targetY - 10);
      ctx.lineTo(tw.targetX, tw.targetY + 10);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(tw.x, tw.y);
    // Cast shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
    ctx.beginPath();
    ctx.arc(5, 7, tw.radius + 5, 0, Math.PI * 2);
    ctx.fill();

    // Mechanical brass under-gear ring
    ctx.save();
    ctx.rotate(t * (isTele ? 1.8 : 0.35));
    ctx.strokeStyle = isMono ? "#94A3B8" : "#92400E";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, tw.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Octagonal stone turret body
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      const vx = Math.cos(a) * tw.radius;
      const vy = Math.sin(a) * tw.radius;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = isMono ? "#2B3444" : "#22121A";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#CBD5E1" : isTele ? "#FB7185" : "#9F1239";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner iron ring
    ctx.beginPath();
    ctx.arc(0, 0, tw.radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#171C26" : "#140A10";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#94A3B8" : "#B45309";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Rotating Twin-Arm Blood Ballista / Crystal Cannon
    ctx.rotate(tw.angle || 0);
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(253, 164, 175, 0.72)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, -tw.radius * 0.86);
    ctx.lineTo(-4, 0);
    ctx.lineTo(2, tw.radius * 0.86);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#94A3B8" : "#78716C";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(10, -tw.radius * 0.65, 2, -tw.radius * 0.88);
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(10, tw.radius * 0.65, 2, tw.radius * 0.88);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#E2E8F0" : isTele ? "#FDE047" : "#E11D48";
    ctx.fillRect(-4, -4.5, tw.radius + 11, 9);
    ctx.strokeStyle = isMono ? "#0F172A" : "#4C0519";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-4, -4.5, tw.radius + 11, 9);

    // Core crystal
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#F8FAFC" : isTele ? "#FDE68A" : "#FDA4AF";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : "#E11D48";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  // 4. Interactive Easter Egg Shrines (Tin Lab, Bao Mirror, Secret Vault Altar)
  const nearby = typeof state.getNearbyCitadelInteractable === "function"
    ? state.getNearbyCitadelInteractable()
    : null;
  const heroId = state.currentHero?.id || state.selectedHeroId;
  const px = state.player ? state.player.x : 0;
  const py = state.player ? state.player.y : 0;

  // Active Hero Resonance Tether (World-Space connection between Tin/Bao and their shrine!)
  if (!isMono && state.player) {
    if (heroId === "tin") {
      const tinNode = BLOOD_CITADEL_INTERACTABLES[0];
      const d = Math.hypot(px - tinNode.x, py - tinNode.y);
      if (d <= 260 && isCircleInViewBounds(tinNode.x, tinNode.y, 260, viewBounds)) {
        const beat = 0.36 + 0.25 * Math.sin(t * 7.5);
        ctx.save();
        ctx.strokeStyle = `rgba(251, 113, 133, ${beat})`;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.moveTo(tinNode.x, tinNode.y - 16);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        // Traveling resonance spark toward Tin
        const prog = (t * 0.9) % 1;
        ctx.fillStyle = "#FFE4E6";
        ctx.beginPath();
        ctx.arc(
          tinNode.x + (px - tinNode.x) * prog,
          tinNode.y - 16 + (py - (tinNode.y - 16)) * prog,
          2.6,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    } else if (heroId === "bao") {
      const baoNode = BLOOD_CITADEL_INTERACTABLES[1];
      const d = Math.hypot(px - baoNode.x, py - baoNode.y);
      if (d <= 260 && isCircleInViewBounds(baoNode.x, baoNode.y, 260, viewBounds)) {
        const beat = 0.36 + 0.25 * Math.sin(t * 6.5);
        ctx.save();
        ctx.strokeStyle = `rgba(232, 121, 249, ${beat})`;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.moveTo(baoNode.x, baoNode.y - 10);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        const prog = (t * 0.85) % 1;
        ctx.fillStyle = "#FAE8FF";
        ctx.beginPath();
        ctx.arc(
          baoNode.x + (px - baoNode.x) * prog,
          baoNode.y - 10 + (py - (baoNode.y - 10)) * prog,
          2.6,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    }
  }

  for (const node of BLOOD_CITADEL_INTERACTABLES) {
    if (!isCircleInViewBounds(node.x, node.y, 165, viewBounds)) continue;
    const isNear = Boolean(nearby && nearby.id === node.id);
    ctx.save();
    ctx.translate(node.x, node.y);

    if (node.id === "tin_lab") {
      drawTinLabShrine(ctx, node, t, isMono, heroId, secrets, allowGlows);
    } else if (node.id === "bao_mirror") {
      drawBaoMirrorShrine(ctx, node, t, rt, isMono, heroId, secrets, allowGlows, px - node.x, py - node.y);
    } else if (node.id === "shared_altar") {
      drawSharedVaultAltarShrine(ctx, t, isMono, secrets, allowGlows);
    }

    // Floating diegetic "[V]" signifier plaque
    if (isNear) {
      const label = "[V] " + (node.shortPrompt?.[state.currentLang === "en" ? "en" : "vi"] || "");
      ctx.font = '800 11.5px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 20;
      ctx.fillStyle = "rgba(10, 6, 16, 0.94)";
      ctx.strokeStyle =
        node.id === "tin_lab"
          ? "#FB7185"
          : node.id === "bao_mirror"
            ? "#E879F9"
            : "#FBBF24";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-tw * 0.5, -78, tw, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FEF08A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, -66);
    }

    ctx.restore();
  }
}

export function renderBloodCitadelAtmosphere(ctx, state, isMono, prof) {
  if (!state || state.activeMapId !== "blood_citadel" || isMono) return;
  const tier = prof?.effectiveTier || "high";
  const allowGlows = Boolean(prof?.enableRadialGlows);
  const t = state.elapsedTime || 0;
  const w = state.viewW || 1280;
  const h = state.viewH || 720;

  // 1. Subtle drifting gothic mist wisps along outer corners (soft crimson/amethyst fog)
  if (allowGlows && tier !== "saver") {
    ctx.save();
    for (let m = 0; m < 3; m++) {
      const mx = ((w * (0.2 + m * 0.32) + Math.sin(t * 0.25 + m * 2.1) * 90) % w + w) % w;
      const my = ((h * (0.18 + m * 0.28) + Math.cos(t * 0.2 + m * 1.7) * 55) % h + h) % h;
      const mr = 160 + m * 35;
      const mg = ctx.createRadialGradient(mx, my, 12, mx, my, mr);
      mg.addColorStop(0, m === 1 ? "rgba(168, 85, 247, 0.055)" : "rgba(190, 18, 60, 0.055)");
      mg.addColorStop(1, "rgba(8, 5, 10, 0)");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Deterministic drifting crimson embers, mirror violet wisps & gold motes in screen space
  const emberCount = tier === "saver" ? 0 : tier === "balanced" ? 12 : 24;
  if (emberCount > 0) {
    ctx.save();
    for (let i = 0; i < emberCount; i++) {
      const seed = i * 19.37;
      const px = ((seed * 73.1 + t * (16 + (i % 5) * 4) + Math.sin(t * 0.9 + seed) * 28) % (w + 40)) - 20;
      const py = h - (((seed * 41.7 + t * (22 + (i % 4) * 6)) % (h + 40)) - 20);
      const r = 1.2 + (i % 3) * 0.7;
      ctx.globalAlpha = 0.26 + 0.22 * Math.sin(t * 3 + seed);
      ctx.fillStyle = i % 4 === 0 ? "#FDE047" : i % 2 === 0 ? "#FB7185" : "#C084FC";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Subtle gothic edge vignette framing the screen corners without obscuring combat center
  if (allowGlows) {
    ctx.save();
    const rad = Math.max(w, h) * 0.72;
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, rad * 0.48, w * 0.5, h * 0.5, rad);
    vg.addColorStop(0, "rgba(0, 0, 0, 0)");
    vg.addColorStop(0.74, "rgba(18, 5, 14, 0.16)");
    vg.addColorStop(1, "rgba(6, 2, 10, 0.46)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
