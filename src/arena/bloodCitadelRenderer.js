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

function drawBraizerFlame(ctx, x, y, time, scale, isMono, colorMode = "crimson", allowGlows = false) {
  ctx.save();
  ctx.translate(x, y);
  const flicker = 0.85 + 0.15 * Math.sin(time * 13 + x * 0.1 + y * 0.07);
  const sway = Math.sin(time * 8.5 + y * 0.05) * 2.4 * scale;

  if (!isMono) {
    if (allowGlows) {
      const halo = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, 28 * scale * flicker);
      const c0 =
        colorMode === "violet"
          ? "rgba(192, 132, 252, 0.3)"
          : colorMode === "gold"
            ? "rgba(250, 204, 21, 0.34)"
            : "rgba(244, 63, 94, 0.3)";
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
          ? "rgba(168, 85, 247, 0.2)"
          : colorMode === "gold"
            ? "rgba(250, 204, 21, 0.22)"
            : "rgba(244, 63, 94, 0.2)";
    }
    ctx.beginPath();
    ctx.arc(0, 0, 24 * scale * flicker, 0, Math.PI * 2);
    ctx.fill();
  }

  // Iron tripod feet
  ctx.strokeStyle = isMono ? "#0F172A" : "#44403C";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 * i) / 3 + Math.PI / 6;
    ctx.moveTo(Math.cos(a) * 6 * scale, Math.sin(a) * 6 * scale);
    ctx.lineTo(Math.cos(a) * 12 * scale, Math.sin(a) * 12 * scale);
  }
  ctx.stroke();

  // Iron brazier bowl
  ctx.fillStyle = isMono ? "#CBD5E1" : "#1C1917";
  ctx.strokeStyle = isMono ? "#0F172A" : "#78716C";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 9.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ember core
  ctx.fillStyle = isMono
    ? "#0F172A"
    : colorMode === "violet"
      ? "#C084FC"
      : colorMode === "gold"
        ? "#FDE047"
        : "#F97316";
  ctx.beginPath();
  ctx.arc(0, 0, 5.6 * scale * flicker, 0, Math.PI * 2);
  ctx.fill();

  // Inner flame tongue
  ctx.fillStyle = isMono
    ? "#475569"
    : colorMode === "violet"
      ? "#F3E8FF"
      : colorMode === "gold"
        ? "#FEF9C3"
        : "#FDE047";
  ctx.beginPath();
  ctx.moveTo(-3.6 * scale, 1 * scale);
  ctx.quadraticCurveTo(-2 * scale, -7 * scale, sway, -13 * scale * flicker);
  ctx.quadraticCurveTo(2.5 * scale, -7 * scale, 3.6 * scale, 1 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCandleFlame(ctx, x, y, time, scale, isMono, color = "#E879F9") {
  ctx.save();
  ctx.translate(x, y);
  const flicker = 0.85 + 0.15 * Math.sin(time * 16 + x * 0.3);
  if (!isMono) {
    ctx.fillStyle = color === "#E879F9" ? "rgba(192, 132, 252, 0.22)" : "rgba(251, 113, 133, 0.22)";
    ctx.beginPath();
    ctx.arc(0, -4 * scale, 11 * scale * flicker, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wax pillar
  ctx.fillStyle = isMono ? "#CBD5E1" : "#E2E8F0";
  ctx.fillRect(-2.4 * scale, -4 * scale, 4.8 * scale, 8 * scale);
  // Tiny flame
  ctx.fillStyle = isMono ? "#0F172A" : color;
  ctx.beginPath();
  ctx.moveTo(-2 * scale, -4 * scale);
  ctx.quadraticCurveTo(0, -11 * scale * flicker, 2 * scale, -4 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFloorRelicWeapons(ctx, x, y, angle, isMono) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Broken sword blade lying on flagstones
  ctx.strokeStyle = isMono ? "#334155" : "#57534E";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-14, -3);
  ctx.lineTo(12, 2);
  ctx.moveTo(-8, -8);
  ctx.lineTo(-10, 4);
  ctx.stroke();
  // Tattered crimson war banner rag
  ctx.fillStyle = isMono ? "rgba(100,116,139,0.35)" : "rgba(136, 19, 55, 0.42)";
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

  ctx.fillStyle = isMono ? "#64748B" : color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w + swayOffset, h);
  ctx.lineTo(w * 0.5 + swayOffset * 0.6, h - 6);
  ctx.lineTo(swayOffset * 0.5, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isMono ? "#0F172A" : trimColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Center insignia stripe
  ctx.strokeStyle = isMono ? "#CBD5E1" : trimColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 3);
  ctx.lineTo(w * 0.5 + swayOffset * 0.5, h - 8);
  ctx.stroke();
  ctx.restore();
}

function drawGargoylePlinth(ctx, x, y, mirrorX, color, eyeColor, isMono) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(mirrorX, 1);

  // Pedestal shadow
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(-12, -10, 26, 26);

  // Stone base
  ctx.fillStyle = isMono ? "#475569" : "#271E2E";
  ctx.strokeStyle = isMono ? "#0F172A" : color;
  ctx.lineWidth = 1.6;
  ctx.fillRect(-13, -13, 26, 26);
  ctx.strokeRect(-13, -13, 26, 26);

  // Carved serpent / gargoyle crest
  ctx.fillStyle = isMono ? "#334155" : "#3B2846";
  ctx.beginPath();
  ctx.moveTo(-7, 6);
  ctx.lineTo(-9, -6);
  ctx.lineTo(-2, -10);
  ctx.lineTo(8, -4);
  ctx.lineTo(6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin glowing serpent eyes
  ctx.fillStyle = isMono ? "#FFFFFF" : eyeColor;
  ctx.beginPath();
  ctx.arc(0, -3, 2, 0, Math.PI * 2);
  ctx.arc(4.5, -1, 1.8, 0, Math.PI * 2);
  ctx.fill();
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

  // 1. Deep Obsidian Base
  ctx.fillStyle = isMono ? "#F8FAFC" : "#08050A";
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient gothic warmth centered on Ritual Arena, Secret Vault, Tin Lab & Bao Mirror
  if (!isMono && allowGlows) {
    const arenaGlow = ctx.createRadialGradient(
      BLOOD_CITADEL_SPAWN.x,
      BLOOD_CITADEL_SPAWN.y,
      45,
      BLOOD_CITADEL_SPAWN.x,
      BLOOD_CITADEL_SPAWN.y,
      580
    );
    arenaGlow.addColorStop(0, "rgba(159, 18, 57, 0.25)");
    arenaGlow.addColorStop(0.55, "rgba(69, 10, 28, 0.12)");
    arenaGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
    ctx.fillStyle = arenaGlow;
    ctx.fillRect(0, 0, W, H);

    const vaultGlow = ctx.createRadialGradient(800, 195, 20, 800, 195, 290);
    vaultGlow.addColorStop(
      0,
      secrets.combinedUnlocked ? "rgba(250, 204, 21, 0.22)" : "rgba(147, 51, 234, 0.2)"
    );
    vaultGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
    ctx.fillStyle = vaultGlow;
    ctx.fillRect(460, 0, 680, 500);

    // Subtle NE Crimson Lab Aura
    if (viewBounds.maxX >= 1150 && viewBounds.minY <= 440) {
      const labGlow = ctx.createRadialGradient(1440, 175, 16, 1440, 175, 220);
      labGlow.addColorStop(0, heroId === "tin" || secrets.tinClue ? "rgba(244, 63, 94, 0.24)" : "rgba(159, 18, 57, 0.15)");
      labGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
      ctx.fillStyle = labGlow;
      ctx.fillRect(1180, 0, 420, 420);
    }

    // Subtle SW Violet Mirror Aura
    if (viewBounds.minX <= 450 && viewBounds.maxY >= 960) {
      const mirGlow = ctx.createRadialGradient(165, 1215, 16, 165, 1215, 220);
      mirGlow.addColorStop(0, heroId === "bao" || secrets.baoClue ? "rgba(192, 132, 252, 0.24)" : "rgba(126, 34, 206, 0.15)");
      mirGlow.addColorStop(1, "rgba(8, 5, 10, 0)");
      ctx.fillStyle = mirGlow;
      ctx.fillRect(0, 980, 420, 480);
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
        const shade = 238 - Math.floor(hVal * 16);
        ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      } else {
        // Subtle district color grading across Map 2 quarters
        const inLabDistrict = midX >= 1200 && midY <= 380;
        const inMirrorDistrict = midX <= 380 && midY >= 1020;
        const inNorthSanctum = midY <= 380 && midX >= 520 && midX <= 1080;

        let r = 17 + hVal * 11;
        let g = 11 + hVal * 7;
        let b = 18 + hVal * 10;

        if (inLabDistrict) {
          r += 8;
          g += 1;
          b += 2;
        } else if (inMirrorDistrict) {
          r += 2;
          g += 2;
          b += 10;
        } else if (inNorthSanctum) {
          r += 4;
          b += 8;
        }
        ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
      }
      ctx.fillRect(drawX + 1.5, drawY + 1.5, drawW - 3, drawH - 3);

      // Subtle inner top-left stone bevel highlight
      ctx.strokeStyle = isMono ? "rgba(0,0,0,0.08)" : "rgba(255, 228, 230, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + 2, drawY + drawH - 3);
      ctx.lineTo(drawX + 2, drawY + 2);
      ctx.lineTo(drawX + drawW - 3, drawY + 2);
      ctx.stroke();

      // Sparse deterministic fractures / moss / crimson veins
      if (hVal > 0.76 && drawW > 40 && drawH > 30) {
        ctx.strokeStyle = isMono
          ? "rgba(0,0,0,0.16)"
          : hVal > 0.91
            ? "rgba(190, 18, 60, 0.28)"
            : hVal < 0.81
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(0, 0, 0, 0.42)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const sx = drawX + drawW * (0.22 + (hVal * 7) % 0.35);
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
    ctx.fillStyle = isMono ? "#E2E8F0" : "#180C16";
    ctx.fillRect(roadX, 330, roadW, 1110);

    // Outer stepped stone curb
    ctx.strokeStyle = isMono ? "#334155" : "rgba(159, 18, 57, 0.5)";
    ctx.lineWidth = 2.4;
    ctx.strokeRect(roadX, 330, roadW, 1110);

    // Inner ceremonial bronze/crimson runner lines
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(217, 119, 6, 0.26)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(roadX + 18, 330);
    ctx.lineTo(roadX + 18, 1440);
    ctx.moveTo(roadX + roadW - 18, 330);
    ctx.lineTo(roadX + roadW - 18, 1440);
    ctx.stroke();

    // Flagstone paver cross seams & gothic chevron inlays along causeway
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.14)" : "rgba(0, 0, 0, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let py = 360; py <= 1410; py += 60) {
      if (py < viewBounds.minY - 20 || py > viewBounds.maxY + 20) continue;
      ctx.moveTo(roadX, py);
      ctx.lineTo(roadX + roadW, py);
    }
    ctx.stroke();

    // Decorative gothic diamond medallions along causeway center
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.2)" : "rgba(225, 29, 72, 0.24)";
    ctx.lineWidth = 1.4;
    for (let cy = 390; cy <= 1350; cy += 120) {
      if (cy > 640 && cy < 1040) continue;
      if (cy < viewBounds.minY - 30 || cy > viewBounds.maxY + 30) continue;
      ctx.beginPath();
      ctx.moveTo(800, cy - 14);
      ctx.lineTo(816, cy);
      ctx.lineTo(800, cy + 14);
      ctx.lineTo(784, cy);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // East-West Cross Aisle
  const crossY = 790;
  const crossH = 100;
  if (viewBounds.maxY >= crossY - 20 && viewBounds.minY <= crossY + crossH + 20) {
    ctx.fillStyle = isMono ? "#E2E8F0" : "#150C15";
    ctx.fillRect(320, crossY, 960, crossH);
    ctx.strokeStyle = isMono ? "#475569" : "rgba(159, 18, 57, 0.34)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(320, crossY, 960, crossH);
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.16)" : "rgba(217, 119, 6, 0.16)";
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
    if (isCircleInViewBounds(bx, by, 40, viewBounds)) {
      drawBraizerFlame(ctx, bx, by, t, 0.88, isMono, "crimson", allowGlows);
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
  // Carved dark trough border
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.28)" : "rgba(28, 12, 18, 0.9)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of bloodChannels) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // Pulsing crimson blood vein inside trough
  const veinAlpha = 0.34 + 0.16 * Math.sin(t * 3.4);
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.2)" : `rgba(225, 29, 72, ${veinAlpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of bloodChannels) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // Flowing directional blood motes (skipped in saver tier)
  if (!isMono && tier !== "saver") {
    ctx.fillStyle = "#FB7185";
    for (let idx = 0; idx < bloodChannels.length; idx++) {
      const [x1, y1, x2, y2] = bloodChannels[idx];
      for (let m = 0; m < 2; m++) {
        const prog = (t * 0.48 + idx * 0.19 + m * 0.5) % 1;
        const mx = x1 + (x2 - x1) * prog;
        const my = y1 + (y2 - y1) * prog;
        if (!isCircleInViewBounds(mx, my, 12, viewBounds)) continue;
        ctx.beginPath();
        ctx.arc(mx, my, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // 5. Central Blood Ritual Seal (cx=800, cy=840)
  const cx = BLOOD_CITADEL_SPAWN.x;
  const cy = BLOOD_CITADEL_SPAWN.y;
  if (isCircleInViewBounds(cx, cy, 270, viewBounds)) {
    ctx.save();
    ctx.translate(cx, cy);

    // Outer stepped octagonal dais rim
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      const rx = Math.cos(a) * 246;
      const ry = Math.sin(a) * 246;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fillStyle = isMono ? "#E2E8F0" : "#12070F";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#334155" : "rgba(159, 18, 57, 0.45)";
    ctx.lineWidth = 2;
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
    ctx.fillStyle = isMono ? "#CBD5E1" : "#190A15";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#1E293B" : "rgba(217, 119, 6, 0.52)";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Outer & middle ritual rings
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.35)" : "rgba(225, 29, 72, 0.46)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 204, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(245, 158, 11, 0.28)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 186, 0, Math.PI * 2);
    ctx.stroke();

    // Slow-rotating rune arc ring + cardinal diamond sigils
    ctx.save();
    ctx.rotate(t * 0.16);
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.3)" : "rgba(244, 63, 94, 0.52)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 154, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      const px = Math.cos(ang) * 195;
      const py = Math.sin(ang) * 195;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = isMono ? "#0F172A" : i % 2 === 0 ? "#FB7185" : "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(0, 4.8);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, -4.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Counter-rotating inner arcane ring
    ctx.save();
    ctx.rotate(-t * 0.22);
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.25)" : "rgba(251, 191, 36, 0.35)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Inner sacred 8-point mandala geometry & core ring
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.25)" : "rgba(190, 18, 60, 0.36)";
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
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.2)" : "rgba(244, 63, 94, 0.28)";
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

    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "rgba(0,0,0,0.06)" : "rgba(159, 18, 57, 0.24)";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : "rgba(251, 113, 133, 0.5)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Center blood eclipse sigil
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#0F172A" : "rgba(250, 204, 21, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4 Corner Floor Braziers inside the octagonal dais corners
    for (const bx of [-152, 152]) {
      for (const by of [-152, 152]) {
        drawBraizerFlame(ctx, bx, by, t, 0.92, isMono, "crimson", allowGlows);
      }
    }
    ctx.restore();
  }

  // 6. Northern Secret Underground Vault Floor (x:602, y:86, w:396, h:244)
  const vr = BLOOD_CITADEL_SECRET_VAULT_RECT;
  if (isCircleInViewBounds(vr.x + vr.w * 0.5, vr.y + vr.h * 0.5, 300, viewBounds)) {
    ctx.save();
    // Stepped crypt descent stairs at southern entrance
    for (let step = 0; step < 3; step++) {
      const sy = vr.y + vr.h - 24 + step * 8;
      ctx.fillStyle = isMono ? "#94A3B8" : `rgb(${30 - step * 4}, ${14 - step * 2}, ${38 - step * 4})`;
      ctx.fillRect(vr.x + 86, sy, vr.w - 172, 7);
      ctx.strokeStyle = isMono
        ? "#0F172A"
        : secrets.combinedUnlocked
          ? "rgba(250, 204, 21, 0.4)"
          : "rgba(192, 132, 252, 0.32)";
      ctx.lineWidth = 1;
      ctx.strokeRect(vr.x + 86, sy, vr.w - 172, 7);
    }

    // Sanctum obsidian mosaic base
    ctx.fillStyle = isMono ? "#E2E8F0" : secrets.combinedUnlocked ? "#201026" : "#150B1D";
    ctx.fillRect(vr.x, vr.y, vr.w, vr.h - 24);

    // Subtle diamond mosaic grid inside vault
    ctx.strokeStyle = isMono
      ? "rgba(0,0,0,0.12)"
      : secrets.combinedUnlocked
        ? "rgba(250, 204, 21, 0.16)"
        : "rgba(168, 85, 247, 0.15)";
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
      ? "rgba(0,0,0,0.28)"
      : secrets.baoClue
        ? "rgba(232, 121, 249, 0.72)"
        : "rgba(126, 34, 206, 0.28)";
    ctx.lineWidth = secrets.baoClue ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(vr.x + 36, vr.y + vr.h - 52);
    ctx.lineTo(vr.x + 36, 185);
    ctx.lineTo(745, 185);
    ctx.stroke();

    // Right (Crimson -> Tin's #MT-07 bond)
    ctx.strokeStyle = isMono
      ? "rgba(0,0,0,0.28)"
      : secrets.tinClue
        ? "rgba(251, 113, 133, 0.72)"
        : "rgba(159, 18, 57, 0.28)";
    ctx.lineWidth = secrets.tinClue ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(vr.x + vr.w - 36, vr.y + vr.h - 52);
    ctx.lineTo(vr.x + vr.w - 36, 185);
    ctx.lineTo(855, 185);
    ctx.stroke();

    // Outer containment trim
    ctx.strokeStyle = isMono
      ? "#0F172A"
      : secrets.combinedUnlocked
        ? "#FACC15"
        : "rgba(192, 132, 252, 0.65)";
    ctx.lineWidth = secrets.combinedUnlocked ? 3 : 2.2;
    ctx.strokeRect(vr.x, vr.y, vr.w, vr.h - 24);

    // Vault arcane floor circle under Altar (800, 185)
    const acx = 800;
    const acy = 188;
    ctx.save();
    ctx.translate(acx, acy);
    ctx.rotate(t * (secrets.combinedUnlocked ? 0.35 : -0.14));
    ctx.strokeStyle = isMono
      ? "#000000"
      : secrets.combinedUnlocked
        ? "rgba(250, 204, 21, 0.7)"
        : "rgba(192, 132, 252, 0.38)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 92, 0, Math.PI * 2);
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
      isMono
    );
    drawGargoylePlinth(
      ctx,
      vr.x + vr.w - 68,
      vr.y + vr.h - 14,
      -1,
      secrets.tinClue ? "#FB7185" : "#9F1239",
      secrets.tinClue ? "#FFE4E6" : "#FB7185",
      isMono
    );

    // 4 Vault Corner Soul Braziers
    const vaultFlameMode = secrets.combinedUnlocked ? "gold" : "violet";
    drawBraizerFlame(ctx, vr.x + 26, vr.y + 28, t, 0.85, isMono, secrets.baoClue ? vaultFlameMode : "violet", allowGlows);
    drawBraizerFlame(ctx, vr.x + vr.w - 26, vr.y + 28, t, 0.85, isMono, secrets.tinClue ? (secrets.combinedUnlocked ? "gold" : "crimson") : "violet", allowGlows);
    drawBraizerFlame(ctx, vr.x + 26, vr.y + vr.h - 46, t, 0.85, isMono, secrets.baoClue ? vaultFlameMode : "violet", allowGlows);
    drawBraizerFlame(ctx, vr.x + vr.w - 26, vr.y + vr.h - 46, t, 0.85, isMono, secrets.tinClue ? (secrets.combinedUnlocked ? "gold" : "crimson") : "violet", allowGlows);

    // Engraved Title Ribbon
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(10, 6, 16, 0.88)";
    ctx.fillRect(vr.x + vr.w / 2 - 102, vr.y + 8, 204, 20);
    ctx.strokeStyle = isMono
      ? "#000000"
      : secrets.combinedUnlocked
        ? "#FACC15"
        : "rgba(192, 132, 252, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(vr.x + vr.w / 2 - 102, vr.y + 8, 204, 20);
    ctx.font = '800 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono
      ? "#FFFFFF"
      : secrets.combinedUnlocked
        ? "#FEF08A"
        : "#E9D5FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      secrets.combinedUnlocked ? "HẦM BÍ MẬT · #ZERO-00" : "HẦM BÍ MẬT CỔ THÀNH",
      vr.x + vr.w / 2,
      vr.y + 18
    );
    ctx.restore();
  }

  // 7. Southern Citadel Gate Threshold (x:650, y:1384, w:300, h:52)
  const ga = BLOOD_CITADEL_GATE_ARCH;
  if (isCircleInViewBounds(ga.x + ga.w * 0.5, ga.y + ga.h * 0.5, 240, viewBounds)) {
    ctx.save();
    ctx.fillStyle = isMono ? "#CBD5E1" : "#1C0B0E";
    ctx.fillRect(ga.x, ga.y, ga.w, ga.h);
    // Heavy wrought-iron portcullis grate bars sunk into stone
    ctx.strokeStyle = isMono ? "#334155" : "rgba(120, 113, 108, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let gx = ga.x + 18; gx <= ga.x + ga.w - 18; gx += 22) {
      ctx.moveTo(gx, ga.y + 4);
      ctx.lineTo(gx, ga.y + ga.h - 4);
    }
    ctx.moveTo(ga.x + 6, ga.y + ga.h * 0.5);
    ctx.lineTo(ga.x + ga.w - 6, ga.y + ga.h * 0.5);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#000000" : "#B45309";
    ctx.lineWidth = 2.6;
    ctx.strokeRect(ga.x, ga.y, ga.w, ga.h);

    // Engraved Gate Plaque
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(17, 7, 9, 0.92)";
    ctx.fillRect(ga.x + ga.w / 2 - 106, ga.y + ga.h / 2 - 11, 212, 22);
    ctx.strokeStyle = isMono ? "#000000" : "rgba(245, 158, 11, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(ga.x + ga.w / 2 - 106, ga.y + ga.h / 2 - 11, 212, 22);
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FCD34D";
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
      // Stepped stone foundation apron
      ctx.fillStyle = isMono ? "#CBD5E1" : "#18111A";
      ctx.strokeStyle = isMono ? "#475569" : "rgba(159, 18, 57, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, tw.radius + 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner bronze bevel ring
      ctx.strokeStyle = isMono ? "#64748B" : "rgba(180, 83, 9, 0.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, tw.radius + 12, 0, Math.PI * 2);
      ctx.stroke();

      if (tw.state === "telegraph") {
        ctx.strokeStyle = isMono ? "rgba(0,0,0,0.45)" : "rgba(244, 63, 94, 0.25)";
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
      ctx.fillStyle = isMono ? "#CBD5E1" : "#140B10";
      ctx.beginPath();
      ctx.arc(0, 0, tr.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#334155" : "#57534E";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      if (tr.state === "warning") {
        ctx.fillStyle = isMono
          ? "rgba(0,0,0,0.32)"
          : `rgba(225, 29, 72, ${0.26 + warnPulse * 0.26})`;
        ctx.strokeStyle = isMono ? "#000000" : "#FDA4AF";
        ctx.lineWidth = 3;
      } else if (tr.state === "erupt") {
        ctx.fillStyle = isMono ? "rgba(0,0,0,0.55)" : "rgba(244, 63, 94, 0.54)";
        ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
        ctx.lineWidth = 3.5;
      } else if (tr.state === "cooldown") {
        ctx.fillStyle = isMono ? "rgba(0,0,0,0.08)" : "rgba(28, 25, 23, 0.74)";
        ctx.strokeStyle = isMono ? "#64748B" : "rgba(120, 113, 108, 0.5)";
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = isMono ? "rgba(0,0,0,0.14)" : "rgba(136, 19, 55, 0.3)";
        ctx.strokeStyle = isMono ? "#1E293B" : "rgba(244, 63, 94, 0.62)";
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
      ctx.strokeStyle = isMono ? "rgba(0,0,0,0.28)" : "rgba(24, 24, 27, 0.78)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let gx = -tr.radius + 14; gx <= tr.radius - 14; gx += 16) {
        ctx.moveTo(gx, -tr.radius);
        ctx.lineTo(gx, tr.radius);
      }
      ctx.stroke();

      // Subtle rising blood bubbles when idle/warning
      if (!isMono && tr.state !== "cooldown" && tier !== "saver") {
        ctx.fillStyle = tr.state === "warning" ? "#FDA4AF" : "rgba(244, 63, 94, 0.6)";
        for (let b = 0; b < 3; b++) {
          const ba = b * 2.1 + t * 1.1;
          const br = 12 + ((t * 14 + b * 9) % (tr.radius * 0.55));
          ctx.beginPath();
          ctx.arc(Math.cos(ba) * br, Math.sin(ba) * br, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Inner ritual ring + eruption spikes / warning sweep
      ctx.strokeStyle =
        tr.state === "warning"
          ? "#FEF08A"
          : tr.state === "erupt"
            ? "#FFFFFF"
            : isMono
              ? "#475569"
              : "rgba(251, 113, 133, 0.5)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, tr.radius * 0.52, 0, Math.PI * 2);
      ctx.stroke();

      if (tr.state === "warning") {
        const prog = Math.max(0.06, Math.min(1, 1 - tr.timer / 0.95));
        ctx.beginPath();
        ctx.arc(0, 0, tr.radius * prog, 0, Math.PI * 2);
        ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
        ctx.lineWidth = 2.6;
        ctx.stroke();
      } else if (tr.state === "erupt") {
        ctx.fillStyle = isMono ? "#000000" : "#FFE4E6";
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI * 2 * k) / 6 + t * 2;
          const rIn = tr.radius * 0.25;
          const rOut = tr.radius * 0.85;
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
      // Decorative battleground debris near ambush sites
      drawFloorRelicWeapons(ctx, az.x - 42, az.y + 18, 0.4 + idx, isMono);
      drawFloorRelicWeapons(ctx, az.x + 38, az.y - 22, -0.8 - idx, isMono);

      if (az.state === "cooldown") continue;
      ctx.save();
      ctx.translate(az.x, az.y);
      const isWarn = az.state === "warning";
      ctx.strokeStyle = isMono
        ? isWarn
          ? "#000000"
          : "rgba(0,0,0,0.22)"
        : isWarn
          ? "#FB7185"
          : "rgba(168, 85, 247, 0.28)";
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
        ctx.strokeStyle = isMono ? "#000000" : "#E879F9";
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

  // 11. Environmental Floor Lore Details around Easter Egg Shrines (drawn on floor layer cleanly)
  // NE Floor Alchemy Circle & #MT-07 Conduit around Tin Lab (1440, 175)
  if (isCircleInViewBounds(1440, 175, 165, viewBounds)) {
    const tinHere = heroId === "tin";
    const active = tinHere || secrets.tinClue;
    ctx.save();
    ctx.translate(1440, 175);

    // Scorched floor alchemy perimeter
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.25)" : active ? "rgba(244, 63, 94, 0.45)" : "rgba(159, 18, 57, 0.25)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.stroke();

    // Hexagram alchemy vertices on stone floor
    ctx.save();
    ctx.rotate(t * (tinHere ? 0.32 : 0.08));
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.2)" : active ? "rgba(251, 113, 133, 0.34)" : "rgba(190, 18, 60, 0.22)";
    ctx.lineWidth = 1.3;
    for (let tri = 0; tri < 2; tri++) {
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const a = (Math.PI * 2 * v) / 3 + tri * (Math.PI / 3);
        const vx = Math.cos(a) * 76;
        const vy = Math.sin(a) * 76;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Crimson plasma conduit running from cracked stone slab into bench
    ctx.strokeStyle = isMono ? "#334155" : tinHere ? "#FB7185" : "#881337";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-78, -28);
    ctx.quadraticCurveTo(-48, -12, -28, -4);
    ctx.moveTo(64, 54);
    ctx.quadraticCurveTo(36, 36, 22, 16);
    ctx.stroke();

    // Spilled crimson splatters & glinting broken glass shards
    if (!isMono) {
      ctx.fillStyle = "rgba(190, 18, 60, 0.34)";
      ctx.beginPath();
      ctx.ellipse(-42, 34, 14, 7, 0.3, 0, Math.PI * 2);
      ctx.ellipse(46, -40, 10, 5, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = isMono ? "#94A3B8" : "rgba(254, 205, 211, 0.45)";
    for (const [sx, sy, rot] of [
      [-48, 28, 0.4],
      [-34, 42, -0.7],
      [40, -34, 0.9],
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
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(18, 7, 13, 0.84)";
    ctx.fillRect(-44, 56, 88, 16);
    ctx.strokeStyle = isMono ? "#000000" : active ? "rgba(251, 113, 133, 0.65)" : "rgba(159, 18, 57, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-44, 56, 88, 16);
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#FFFFFF" : tinHere ? "#FFE4E6" : "#FDA4AF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("#MT-07 · TIN", 0, 64);

    // Lab Crimson Corner Brazier
    drawBraizerFlame(ctx, -64, -52, t, 0.8, isMono, "crimson", allowGlows);
    ctx.restore();
  }

  // SW Floor Fractured Mirror Mosaic, Footprints & #BS-04 Stencil around Bao Mirror (165, 1215)
  if (isCircleInViewBounds(165, 1215, 165, viewBounds)) {
    const baoHere = heroId === "bao";
    const active = baoHere || secrets.baoClue;
    ctx.save();
    ctx.translate(165, 1215);

    // Fractured obsidian mosaic perimeter
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.25)" : active ? "rgba(192, 132, 252, 0.48)" : "rgba(126, 34, 206, 0.28)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.stroke();

    // Radiating mirror fracture lines across the flagstones
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : active ? "rgba(232, 121, 249, 0.34)" : "rgba(147, 51, 234, 0.2)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const a = (Math.PI * 2 * k) / 7 + 0.3;
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a + 0.14) * 52, Math.sin(a + 0.14) * 52);
      ctx.lineTo(Math.cos(a - 0.06) * 76, Math.sin(a - 0.06) * 76);
    }
    ctx.stroke();

    // Ghostly violet phantom footprints stepping out of the mirror into the room
    const fpPulse = 0.25 + 0.2 * Math.sin(t * 2.5);
    ctx.fillStyle = isMono ? "rgba(0,0,0,0.22)" : `rgba(232, 121, 249, ${baoHere ? fpPulse + 0.22 : fpPulse})`;
    for (let step = 0; step < 5; step++) {
      const ang = 0.25 + step * 0.28;
      const dist = 34 + step * 10;
      const fx = Math.cos(ang) * dist;
      const fy = Math.sin(ang) * dist;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(ang + (step % 2 === 0 ? 0.15 : -0.15));
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Glinting silver mirror shards on stone
    ctx.fillStyle = isMono ? "#94A3B8" : "rgba(243, 232, 255, 0.55)";
    for (const [sx, sy, rot] of [
      [-50, 26, 0.5],
      [48, -22, -0.4],
      [28, 44, 1.1],
      [-32, -46, -0.9],
    ]) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 3);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Etched Stone Code Plaque "#BS-04 · BẢO"
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(16, 8, 28, 0.86)";
    ctx.fillRect(-44, 56, 88, 16);
    ctx.strokeStyle = isMono ? "#000000" : active ? "rgba(232, 121, 249, 0.7)" : "rgba(147, 51, 234, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-44, 56, 88, 16);
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#FFFFFF" : baoHere ? "#FAE8FF" : "#E9D5FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("#BS-04 · BẢO", 0, 64);

    ctx.restore();
  }

  // 12. Fortified Outer Citadel Battlements Perimeter + Crenellations & Corner Bastions
  ctx.save();
  ctx.strokeStyle = isMono ? "#0F172A" : "#27141C";
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, W - 18, H - 18);

  // Inner gilded-crimson parapet trim
  ctx.strokeStyle = isMono ? "#000000" : "#9F1239";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // Repeating perimeter stone merlons (culled to visible spans)
  ctx.fillStyle = isMono ? "#334155" : "#3A1E28";
  const merlonStep = 96;
  for (let mx = 64; mx < W - 64; mx += merlonStep) {
    if (mx + 24 >= viewBounds.minX && mx <= viewBounds.maxX) {
      if (viewBounds.minY <= 40) ctx.fillRect(mx, 2, 24, 14);
      if (viewBounds.maxY >= H - 40) ctx.fillRect(mx, H - 16, 24, 14);
    }
  }
  for (let my = 64; my < H - 64; my += merlonStep) {
    if (my + 24 >= viewBounds.minY && my <= viewBounds.maxY) {
      if (viewBounds.minX <= 40) ctx.fillRect(2, my, 14, 24);
      if (viewBounds.maxX >= W - 40) ctx.fillRect(W - 16, my, 14, 24);
    }
  }

  // Corner fortified bastions with signal braziers
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
    ctx.strokeStyle = isMono ? "#000000" : "#B45309";
    ctx.lineWidth = 2;
    ctx.strokeRect(cxp, cyp, 34, 34);
    drawBraizerFlame(ctx, fx, fy, t, 0.72, isMono, "crimson", allowGlows);
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
  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
  ctx.fillRect(ob.x + 6, ob.y + 8, ob.w, ob.h);

  let topColor = "#2E2933";
  let faceColor = "#1B161E";
  let edgeColor = "#71717A";
  let trimColor = "#44403C";

  if (isMono) {
    topColor = "#475569";
    faceColor = "#1E293B";
    edgeColor = "#0F172A";
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
  ctx.fillStyle = faceColor;
  ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

  // Upper parapet roof cap
  ctx.fillStyle = topColor;
  ctx.fillRect(ob.x + 1, ob.y + 1, Math.max(2, ob.w - 2), Math.max(2, ob.h - faceH));

  // Ashlar masonry stone course lines on top cap
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(0, 0, 0, 0.38)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  if (ob.w >= ob.h) {
    for (let sx = ob.x + 28; sx < ob.x + ob.w - 12; sx += 28) {
      ctx.moveTo(sx, ob.y + 2);
      ctx.lineTo(sx, ob.y + ob.h - faceH);
    }
  } else {
    for (let sy = ob.y + 28; sy < ob.y + ob.h - faceH - 8; sy += 28) {
      ctx.moveTo(ob.x + 2, sy);
      ctx.lineTo(ob.x + ob.w - 2, sy);
    }
  }
  ctx.moveTo(ob.x, ob.y + ob.h - faceH);
  ctx.lineTo(ob.x + ob.w, ob.y + ob.h - faceH);
  ctx.stroke();

  // Top bevel highlight
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.2)" : "rgba(255, 241, 242, 0.16)";
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
    const pr = Math.min(ob.w, ob.h) * 0.34;
    ctx.fillStyle = isMono ? "#94A3B8" : "#57534E";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : "#D6D3D1";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Fluted column inner circle & fracture cross
    ctx.strokeStyle = isMono ? "#0F172A" : "#1C1917";
    ctx.beginPath();
    ctx.arc(px, py, pr * 0.56, 0, Math.PI * 2);
    ctx.moveTo(px - pr * 0.55, py - pr * 0.35);
    ctx.lineTo(px + pr * 0.45, py + pr * 0.5);
    ctx.stroke();
  } else if (ob.kind === "vault_wall") {
    // Glowing vertical containment glyphs + side bracket trims along vault monoliths
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
    // Iron battlements studs & swaying crimson banners near gate edge
    ctx.fillStyle = isMono ? "#0F172A" : trimColor;
    for (let bx = ob.x + 20; bx < ob.x + ob.w - 16; bx += 44) {
      ctx.fillRect(bx - 5, ob.y + 5, 10, 8);
    }
    const innerEdgeX = ob.id === "gate_wall_w" ? ob.x + ob.w - 24 : ob.x + 6;
    const sway = Math.sin(t * 3.2 + ob.x * 0.01) * 2.5;
    drawTatteredBanner(ctx, innerEdgeX, ob.y + ob.h - 2, 18, 22, "#9F1239", "#F59E0B", isMono, sway);
  } else if (ob.kind === "ruin_structure") {
    // Shattered roof rafters + broken slate + flickering torch sconce on courtyard side
    ctx.strokeStyle = isMono ? "#334155" : "#44403C";
    ctx.lineWidth = 2.4;
    for (let ry = ob.y + 24; ry < ob.y + ob.h - 24; ry += 34) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 8, ry);
      ctx.lineTo(ob.x + ob.w - 8, ry + 6);
      ctx.stroke();
    }
    const torchX = ob.id === "ruin_west_watch" ? ob.x + ob.w + 10 : ob.x - 10;
    drawBraizerFlame(ctx, torchX, ob.y + ob.h * 0.5, t, 0.84, isMono, "crimson", allowGlows);
  } else if (ob.kind === "stone_wall") {
    // Iron clamp brackets & hanging banner near central breach
    ctx.fillStyle = isMono ? "#334155" : "#57534E";
    ctx.fillRect(ob.x + 12, ob.y + 4, 8, 6);
    ctx.fillRect(ob.x + ob.w - 20, ob.y + 4, 8, 6);
    const breachBannerX = ob.id === "north_wall_w" ? ob.x + ob.w - 22 : ob.x + 4;
    const sway = Math.sin(t * 2.8 + ob.x * 0.02) * 2;
    drawTatteredBanner(ctx, breachBannerX, ob.y + ob.h - 2, 16, 19, "#6B21A8", "#C084FC", isMono, sway);
  } else if (isCollapsible) {
    // Glowing amber seismic fault cracks ready to collapse
    ctx.strokeStyle = isWarning ? "#FEF08A" : "rgba(251, 191, 36, 0.62)";
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
  const pulse = 0.72 + 0.28 * Math.sin(t * (tinHere ? 7 : 3));

  // Floor alchemical seal circle
  ctx.fillStyle = isMono
    ? "rgba(0,0,0,0.08)"
    : active
      ? `rgba(244, 63, 94, ${0.24 * pulse})`
      : "rgba(136, 19, 55, 0.16)";
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#0F172A" : tinHere ? "#FB7185" : secrets.tinClue ? "#F43F5E" : "#9F1239";
  ctx.lineWidth = tinHere ? 3 : 2;
  ctx.stroke();

  // Rotating outer & inner arcane tick rings
  ctx.save();
  ctx.rotate(t * (tinHere ? 1.45 : 0.42));
  ctx.strokeStyle = isMono ? "#334155" : "rgba(253, 164, 175, 0.62)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Ornate Alchemist Workbench (shadow + weathered wood + riveted iron rim)
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-30, -10, 62, 30);
  ctx.fillStyle = isMono ? "#334155" : "#2D1E1D";
  ctx.fillRect(-32, -15, 64, 28);
  ctx.strokeStyle = isMono ? "#0F172A" : "#A8A29E";
  ctx.lineWidth = 1.7;
  ctx.strokeRect(-32, -15, 64, 28);

  // Brass corner rivets on workbench
  ctx.fillStyle = isMono ? "#CBD5E1" : "#D97706";
  for (const [rx, ry] of [
    [-29, -12],
    [27, -12],
    [-29, 8],
    [27, 8],
  ]) {
    ctx.fillRect(rx, ry, 2.5, 2.5);
  }

  // Left: Rack of 3 glowing #MT-07 Crimson Blood Vials + bubbling glass retort
  const vialPulse = 0.78 + 0.22 * Math.sin(t * 5);
  for (let i = 0; i < 3; i++) {
    const vx = -25 + i * 6.5;
    const vh = 11 + (i === 1 ? 3 : 0);
    ctx.fillStyle = isMono ? "#0F172A" : `rgba(225, 29, 72, ${vialPulse})`;
    ctx.fillRect(vx, -vh + 3, 4.5, vh);
    // Cork & glass glint
    ctx.fillStyle = isMono ? "#CBD5E1" : "#FDA4AF";
    ctx.fillRect(vx + 0.6, -vh + 3, 3.2, 2.5);
    ctx.fillStyle = isMono ? "#94A3B8" : "#B45309";
    ctx.fillRect(vx + 0.8, -vh + 1, 2.8, 2);
  }

  // Coiled brass alembic tube into bubbling blood flask
  ctx.strokeStyle = isMono ? "#94A3B8" : "#F59E0B";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, -9);
  ctx.quadraticCurveTo(-5, -18, 0, -10);
  ctx.stroke();

  // Right: Open Bloodshade Grimoire + crimson rune scribble + wax seal
  ctx.fillStyle = isMono ? "#F8FAFC" : "#FEF3C7";
  ctx.fillRect(8, -11, 18, 16);
  ctx.strokeStyle = isMono ? "#475569" : "#92400E";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, -11, 18, 16);
  // Book spine
  ctx.beginPath();
  ctx.moveTo(17, -11);
  ctx.lineTo(17, 5);
  ctx.stroke();
  // Text lines & crimson sigil
  ctx.strokeStyle = isMono ? "#334155" : "#BE123C";
  ctx.beginPath();
  ctx.moveTo(10, -7);
  ctx.lineTo(15, -7);
  ctx.moveTo(10, -3);
  ctx.lineTo(15, -3);
  ctx.moveTo(19, -7);
  ctx.lineTo(24, -7);
  ctx.moveTo(19, -3);
  ctx.lineTo(24, -3);
  ctx.stroke();
  // Red wax seal
  ctx.fillStyle = isMono ? "#0F172A" : "#E11D48";
  ctx.beginPath();
  ctx.arc(21, 1, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Center: Levitating Faceted Crimson Ma Thach Core inside Dual Brass Astrolabe Rings
  const bobY = Math.sin(t * 4) * 3.2;
  if (!isMono && allowGlows) {
    const cg = ctx.createRadialGradient(0, -19 + bobY, 2, 0, -19 + bobY, 24);
    cg.addColorStop(0, tinHere ? "rgba(251, 113, 133, 0.55)" : "rgba(225, 29, 72, 0.35)");
    cg.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, -19 + bobY, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spinning astrolabe gyro rings around Ma Thach Core
  ctx.save();
  ctx.translate(0, -19 + bobY);
  ctx.save();
  ctx.rotate(t * 1.3);
  ctx.strokeStyle = isMono ? "#0F172A" : "#FBBF24";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 6.5, 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(-t * 1.1);
  ctx.strokeStyle = isMono ? "#334155" : "#FB7185";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 6, -0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Faceted Crimson Ma Thach Core
  ctx.fillStyle = isMono ? "#0F172A" : tinHere ? "#FFE4E6" : "#F43F5E";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(9.5, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-9.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Inner crystal facet line
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#FFF1F2";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(0, 11);
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.stroke();
  ctx.restore();

  // Active Resonance Badge when Tin stands in his lab
  if (tinHere) {
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#0F172A" : "#FFE4E6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♥ HUYẾT MẠCH TIN", 0, 32);
  }
}

function drawBaoMirrorShrine(ctx, node, t, rt, isMono, heroId, secrets, allowGlows) {
  const baoHere = heroId === "bao";
  const active = baoHere || secrets.baoClue;
  const phase = rt.baoShadowPhase || t;

  // Floor shadow & aura circle
  ctx.fillStyle = isMono
    ? "rgba(0,0,0,0.08)"
    : active
      ? "rgba(168, 85, 247, 0.24)"
      : "rgba(88, 28, 135, 0.14)";
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#0F172A" : baoHere ? "#E879F9" : "#9333EA";
  ctx.lineWidth = baoHere ? 3 : 2;
  ctx.stroke();

  // Scattered #BS-04 Replica dossier sheets + miniature shadow dagger pinning a page
  ctx.fillStyle = isMono ? "#E2E8F0" : "#CBD5E1";
  ctx.fillRect(-30, 12, 15, 11);
  ctx.fillRect(15, 14, 14, 10);
  // Shadow dagger hilt pinning the left #BS-04 sheet
  ctx.strokeStyle = isMono ? "#0F172A" : "#E879F9";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-25, 16);
  ctx.lineTo(-19, 10);
  ctx.moveTo(-23, 10);
  ctx.lineTo(-19, 14);
  ctx.stroke();

  // Twin flickering violet soul-candles flanking mirror base
  drawCandleFlame(ctx, -32, 8, t, 0.95, isMono, "#E879F9");
  drawCandleFlame(ctx, 32, 8, t + 0.7, 0.95, isMono, "#E879F9");

  // Ornate Gothic Pedestal Base
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-22, 6, 46, 13);
  ctx.fillStyle = isMono ? "#334155" : "#1E1630";
  ctx.strokeStyle = isMono ? "#0F172A" : "#A855F7";
  ctx.lineWidth = 1.6;
  ctx.fillRect(-23, 4, 46, 11);
  ctx.strokeRect(-23, 4, 46, 11);

  // Crowned Silver-Obsidian Arch Mirror Frame
  if (!isMono && allowGlows) {
    const mg = ctx.createRadialGradient(0, -10, 4, 0, -10, 32);
    mg.addColorStop(0, baoHere ? "rgba(232, 121, 249, 0.4)" : "rgba(147, 51, 234, 0.25)");
    mg.addColorStop(1, "rgba(88, 28, 135, 0)");
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(0, -10, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isMono ? "#1E293B" : "#150D2E";
  ctx.strokeStyle = isMono ? "#000000" : "#C084FC";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, -10, 19, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin shadow-raven wing crown atop mirror frame
  ctx.fillStyle = isMono ? "#0F172A" : "#3B0764";
  ctx.strokeStyle = isMono ? "#334155" : "#E879F9";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -39);
  ctx.lineTo(-14, -44);
  ctx.lineTo(-8, -33);
  ctx.lineTo(0, -36);
  ctx.lineTo(8, -33);
  ctx.lineTo(14, -44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Skewed lagging reflection shimmer + spiderweb fracture cracks inside glass
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -10, 16, 25, 0, 0, Math.PI * 2);
  ctx.clip();
  const shimmerShift = Math.sin(phase * 1.9) * 8;
  ctx.fillStyle = isMono ? "rgba(255,255,255,0.12)" : "rgba(192, 132, 252, 0.22)";
  ctx.fillRect(-16 + shimmerShift, -36, 7, 54);
  // Subtle trapped silhouette reflection inside mirror
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.28)" : "rgba(245, 208, 254, 0.2)";
  ctx.beginPath();
  ctx.arc(shimmerShift * 0.4, -17, 5, 0, Math.PI * 2);
  ctx.moveTo(shimmerShift * 0.4 - 7, 8);
  ctx.lineTo(shimmerShift * 0.4, -10);
  ctx.lineTo(shimmerShift * 0.4 + 7, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Glass fracture lines
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F3E8FF";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, -24);
  ctx.lineTo(3, -6);
  ctx.lineTo(-5, 13);
  ctx.moveTo(3, -6);
  ctx.lineTo(12, -13);
  ctx.stroke();

  // Trailing Phase-Glitch Afterimage behind Phantom
  const trailPhase = phase - 0.18;
  const trailX = Math.sin(trailPhase * 2.1) * (baoHere ? 32 : 24);
  const trailY = Math.cos(trailPhase * 1.6) * 14 - 8;
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.translate(trailX, trailY);
  ctx.fillStyle = isMono ? "#334155" : "#9333EA";
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(12, 9);
  ctx.lineTo(-12, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Detailed Cloaked Double-Dagger Bao Phantom stepping out of glass
  const alpha = Math.max(0.28, 0.62 + 0.36 * Math.sin(phase * 4.5));
  const offX = Math.sin(phase * 2.1) * (baoHere ? 32 : 24);
  const offY = Math.cos(phase * 1.6) * 14 - 8;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(offX, offY);

  // Flowing tattered shadow cape
  ctx.fillStyle = isMono ? "#0F172A" : "#4C1D95";
  ctx.strokeStyle = isMono ? "#475569" : "#E879F9";
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
  ctx.strokeStyle = isMono ? "#E2E8F0" : "#F5D0FE";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.lineTo(-20, -6);
  ctx.moveTo(11, 2);
  ctx.lineTo(20, -6);
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
    ctx.fillStyle = isMono ? "#0F172A" : "#F5D0FE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("“Bản thể gốc...?”", 0, -49);
  }
}

function drawSharedVaultAltarShrine(ctx, t, isMono, secrets, allowGlows) {
  const ready = Boolean(secrets.tinClue && secrets.baoClue);
  const awakened = Boolean(secrets.combinedUnlocked);

  // Outer sanctum aura
  ctx.fillStyle = isMono
    ? "rgba(0,0,0,0.1)"
    : awakened
      ? "rgba(250, 204, 21, 0.26)"
      : ready
        ? "rgba(232, 121, 249, 0.22)"
        : "rgba(30, 41, 59, 0.35)";
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#0F172A" : awakened ? "#FACC15" : ready ? "#F472B6" : "#64748B";
  ctx.lineWidth = 2.8;
  ctx.stroke();

  if (!isMono && allowGlows && (ready || awakened)) {
    const ag = ctx.createRadialGradient(0, 0, 6, 0, 0, 56);
    ag.addColorStop(0, awakened ? "rgba(250, 204, 21, 0.32)" : "rgba(244, 114, 182, 0.26)");
    ag.addColorStop(1, "rgba(10, 6, 16, 0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twin Carved Flanking Serpent Steles (Tin Crimson Left & Bao Violet Right)
  for (const side of [-1, 1]) {
    const sx = side * 52;
    const isLit = side === -1 ? secrets.tinClue : secrets.baoClue;
    const steleColor = side === -1 ? "#F43F5E" : "#C084FC";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(sx - 6, -15, 14, 32);
    ctx.fillStyle = isMono ? "#475569" : "#1F1426";
    ctx.strokeStyle = isMono ? "#0F172A" : isLit ? steleColor : "#52525B";
    ctx.lineWidth = 1.6;
    ctx.fillRect(sx - 7, -17, 14, 32);
    ctx.strokeRect(sx - 7, -17, 14, 32);

    // Carved stele crest (Diamond for Tin, Mirror Crescent for Bao)
    ctx.fillStyle = isMono ? "#CBD5E1" : isLit ? steleColor : "#3F3F46";
    ctx.beginPath();
    ctx.arc(sx, -2, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Two-stepped Obsidian Dais
  ctx.fillStyle = isMono ? "#475569" : "#120B18";
  ctx.fillRect(-38, -19, 76, 38);
  ctx.strokeStyle = isMono ? "#0F172A" : awakened ? "#F59E0B" : "#52525B";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-38, -19, 76, 38);

  ctx.fillStyle = isMono ? "#334155" : "#1A1024";
  ctx.fillRect(-32, -14, 64, 28);
  ctx.strokeStyle = isMono ? "#0F172A" : awakened ? "#FDE047" : "#71717A";
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-32, -14, 64, 28);

  // Converging crackling leyline arcs between Tin & Bao sockets
  ctx.strokeStyle = isMono
    ? "#FFFFFF"
    : awakened
      ? "#FDE047"
      : ready
        ? "#F472B6"
        : "#3F3F46";
  ctx.lineWidth = ready || awakened ? 2.4 : 1.8;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  if (ready && !awakened) {
    const jitter = Math.sin(t * 22) * 3.5;
    ctx.lineTo(-6, jitter);
    ctx.lineTo(6, -jitter);
  }
  ctx.lineTo(18, 0);
  ctx.stroke();

  // Left socket (Tin crimson #MT-07)
  ctx.fillStyle = isMono
    ? secrets.tinClue
      ? "#FFFFFF"
      : "#475569"
    : secrets.tinClue
      ? "#F43F5E"
      : "#3F3F46";
  ctx.beginPath();
  ctx.arc(-18, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#0F172A" : "#FDA4AF";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right socket (Bao violet #BS-04)
  ctx.fillStyle = isMono
    ? secrets.baoClue
      ? "#FFFFFF"
      : "#475569"
    : secrets.baoClue
      ? "#C084FC"
      : "#3F3F46";
  ctx.beginPath();
  ctx.arc(18, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#0F172A" : "#E9D5FF";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Central Levitating Bloodshade Zero Codex & 8-Point Relic Star when awakened
  if (awakened) {
    ctx.save();
    ctx.rotate(-t * 0.7);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(250, 204, 21, 0.72)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.rotate(t * 1.15);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#0F172A" : "#F59E0B";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 13.5 : 5;
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
    ctx.strokeStyle = isMono ? "#475569" : "rgba(168, 162, 158, 0.44)";
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(cw.x, cw.y, cw.w, cw.h);
    ctx.setLineDash([]);

    const count = 9;
    for (let i = 0; i < count; i++) {
      const rx = cw.x + 10 + ((cw.w - 20) * ((i * 37 + 13) % 100)) / 100;
      const ry = cw.y + 7 + ((cw.h - 14) * ((i * 53 + 7) % 100)) / 100;
      const sz = 4 + (i % 3) * 2.2;
      ctx.fillStyle = isMono ? "#64748B" : i % 2 === 0 ? "#57534E" : "#44403C";
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
      ctx.strokeStyle = isMono ? "#000000" : urgent ? "#FEF08A" : "rgba(244, 63, 94, 0.9)";
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
    ctx.beginPath();
    ctx.arc(5, 7, tw.radius + 5, 0, Math.PI * 2);
    ctx.fill();

    // Mechanical brass under-gear ring
    ctx.save();
    ctx.rotate(t * (isTele ? 1.8 : 0.35));
    ctx.strokeStyle = isMono ? "#475569" : "#92400E";
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
    ctx.fillStyle = isMono ? "#334155" : "#22121A";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : isTele ? "#FB7185" : "#9F1239";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner iron ring
    ctx.beginPath();
    ctx.arc(0, 0, tw.radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#1E293B" : "#140A10";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : "#B45309";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Rotating Twin-Arm Blood Ballista / Crystal Cannon
    ctx.rotate(tw.angle || 0);
    // Drawn bowstring
    ctx.strokeStyle = isMono ? "#CBD5E1" : "rgba(253, 164, 175, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, -tw.radius * 0.86);
    ctx.lineTo(-4, 0);
    ctx.lineTo(2, tw.radius * 0.86);
    ctx.stroke();

    // Twin ballista arms
    ctx.strokeStyle = isMono ? "#94A3B8" : "#78716C";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(10, -tw.radius * 0.65, 2, -tw.radius * 0.88);
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(10, tw.radius * 0.65, 2, tw.radius * 0.88);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#000000" : isTele ? "#FEF08A" : "#E11D48";
    ctx.fillRect(-4, -4.5, tw.radius + 11, 9);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#4C0519";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-4, -4.5, tw.radius + 11, 9);

    // Core crystal
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#FFFFFF" : isTele ? "#FFFFFF" : "#FDA4AF";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#000000" : "#E11D48";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  // 4. Interactive Easter Egg Shrines (Tin Lab, Bao Mirror, Secret Vault Altar)
  const nearby = typeof state.getNearbyCitadelInteractable === "function"
    ? state.getNearbyCitadelInteractable()
    : null;
  const heroId = state.currentHero?.id || state.selectedHeroId;

  // Active Hero Resonance Tether (World-Space connection between Tin/Bao and their shrine!)
  if (!isMono && state.player) {
    const px = state.player.x;
    const py = state.player.y;
    if (heroId === "tin") {
      const tinNode = BLOOD_CITADEL_INTERACTABLES[0];
      const d = Math.hypot(px - tinNode.x, py - tinNode.y);
      if (d <= 210 && isCircleInViewBounds(tinNode.x, tinNode.y, 240, viewBounds)) {
        const beat = 0.32 + 0.25 * Math.sin(t * 7.5);
        ctx.save();
        ctx.strokeStyle = `rgba(251, 113, 133, ${beat})`;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.moveTo(tinNode.x, tinNode.y - 16);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    } else if (heroId === "bao") {
      const baoNode = BLOOD_CITADEL_INTERACTABLES[1];
      const d = Math.hypot(px - baoNode.x, py - baoNode.y);
      if (d <= 210 && isCircleInViewBounds(baoNode.x, baoNode.y, 240, viewBounds)) {
        const beat = 0.32 + 0.25 * Math.sin(t * 6.5);
        ctx.save();
        ctx.strokeStyle = `rgba(232, 121, 249, ${beat})`;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.moveTo(baoNode.x, baoNode.y - 10);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  for (const node of BLOOD_CITADEL_INTERACTABLES) {
    if (!isCircleInViewBounds(node.x, node.y, 145, viewBounds)) continue;
    const isNear = Boolean(nearby && nearby.id === node.id);
    ctx.save();
    ctx.translate(node.x, node.y);

    if (node.id === "tin_lab") {
      drawTinLabShrine(ctx, node, t, isMono, heroId, secrets, allowGlows);
    } else if (node.id === "bao_mirror") {
      drawBaoMirrorShrine(ctx, node, t, rt, isMono, heroId, secrets, allowGlows);
    } else if (node.id === "shared_altar") {
      drawSharedVaultAltarShrine(ctx, t, isMono, secrets, allowGlows);
    }

    // Floating diegetic "[V]" signifier plaque
    if (isNear) {
      const label = "[V] " + (node.shortPrompt?.[state.currentLang === "en" ? "en" : "vi"] || "");
      ctx.font = '800 11.5px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 20;
      ctx.fillStyle = "rgba(10, 6, 16, 0.92)";
      ctx.strokeStyle =
        node.id === "tin_lab"
          ? "#FB7185"
          : node.id === "bao_mirror"
            ? "#E879F9"
            : "#FBBF24";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-tw * 0.5, -74, tw, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FEF08A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, -62);
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

  // Deterministic drifting crimson embers, mirror violet wisps & gold motes in screen space
  const emberCount = tier === "saver" ? 0 : tier === "balanced" ? 10 : 20;
  if (emberCount > 0) {
    ctx.save();
    for (let i = 0; i < emberCount; i++) {
      const seed = i * 19.37;
      const px = ((seed * 73.1 + t * (16 + (i % 5) * 4) + Math.sin(t * 0.9 + seed) * 28) % (w + 40)) - 20;
      const py = h - (((seed * 41.7 + t * (22 + (i % 4) * 6)) % (h + 40)) - 20);
      const r = 1.3 + (i % 3) * 0.75;
      ctx.globalAlpha = 0.28 + 0.25 * Math.sin(t * 3 + seed);
      ctx.fillStyle = i % 3 === 0 ? "#FDE047" : i % 2 === 0 ? "#FB7185" : "#C084FC";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Subtle gothic edge vignette framing the screen corners without obscuring combat center
  if (allowGlows) {
    ctx.save();
    const rad = Math.max(w, h) * 0.72;
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, rad * 0.48, w * 0.5, h * 0.5, rad);
    vg.addColorStop(0, "rgba(0, 0, 0, 0)");
    vg.addColorStop(0.75, "rgba(10, 4, 12, 0.14)");
    vg.addColorStop(1, "rgba(6, 2, 10, 0.42)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
