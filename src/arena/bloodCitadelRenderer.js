import {
  BLOOD_CITADEL_SPAWN,
  BLOOD_CITADEL_SECRET_VAULT_RECT,
  BLOOD_CITADEL_GATE_ARCH,
  BLOOD_CITADEL_INTERACTABLES,
  getActiveCitadelObstacles,
} from "./bloodCitadelMap";
import { isCircleInViewBounds } from "./combatLogic";

// Zero ctx.shadowBlur usage for steady 60fps Canvas 2D performance on desktop and mobile.

function hashCell(ix, iy) {
  let n = Math.imul(ix + 37, 73856093) ^ Math.imul(iy + 91, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function drawBraizerFlame(ctx, x, y, time, scale, isMono, colorMode = "crimson") {
  ctx.save();
  ctx.translate(x, y);
  const flicker = 0.85 + 0.15 * Math.sin(time * 13 + x * 0.1 + y * 0.07);
  const sway = Math.sin(time * 8.5 + y * 0.05) * 2.2 * scale;

  if (!isMono) {
    const outerCol =
      colorMode === "violet"
        ? "rgba(168, 85, 247, 0.22)"
        : colorMode === "gold"
          ? "rgba(250, 204, 21, 0.24)"
          : "rgba(244, 63, 94, 0.22)";
    ctx.fillStyle = outerCol;
    ctx.beginPath();
    ctx.arc(0, 0, 22 * scale * flicker, 0, Math.PI * 2);
    ctx.fill();
  }

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
  ctx.arc(0, 0, 5.5 * scale * flicker, 0, Math.PI * 2);
  ctx.fill();

  // Flame tongue
  ctx.fillStyle = isMono
    ? "#475569"
    : colorMode === "violet"
      ? "#F3E8FF"
      : colorMode === "gold"
        ? "#FEF9C3"
        : "#FDE047";
  ctx.beginPath();
  ctx.moveTo(-3.6 * scale, 1 * scale);
  ctx.quadraticCurveTo(-2 * scale, -7 * scale, sway, -12.5 * scale * flicker);
  ctx.quadraticCurveTo(2.5 * scale, -7 * scale, 3.6 * scale, 1 * scale);
  ctx.closePath();
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
    return isEn ? "Bloodstone Lab Ruin" : "Dấu Tích Ma Thạch";
  }
  if (x <= 340 && y >= 1080) {
    return isEn ? "Mirror Alcove" : "Góc Gương Ảo Ảnh";
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
  const secrets = state.citadelSecrets || {};

  // 1. Deep Obsidian Base
  ctx.fillStyle = isMono ? "#F8FAFC" : "#0A060B";
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient gothic warmth centered on Ritual Arena & Secret Vault (radial gradients only if enabled)
  if (!isMono && allowGlows) {
    const arenaGlow = ctx.createRadialGradient(
      BLOOD_CITADEL_SPAWN.x,
      BLOOD_CITADEL_SPAWN.y,
      40,
      BLOOD_CITADEL_SPAWN.x,
      BLOOD_CITADEL_SPAWN.y,
      540
    );
    arenaGlow.addColorStop(0, "rgba(136, 19, 55, 0.24)");
    arenaGlow.addColorStop(0.55, "rgba(69, 10, 28, 0.11)");
    arenaGlow.addColorStop(1, "rgba(10, 6, 11, 0)");
    ctx.fillStyle = arenaGlow;
    ctx.fillRect(0, 0, W, H);

    const vaultGlow = ctx.createRadialGradient(800, 200, 20, 800, 200, 260);
    vaultGlow.addColorStop(
      0,
      secrets.combinedUnlocked ? "rgba(250, 204, 21, 0.16)" : "rgba(147, 51, 234, 0.18)"
    );
    vaultGlow.addColorStop(1, "rgba(10, 6, 11, 0)");
    ctx.fillStyle = vaultGlow;
    ctx.fillRect(480, 0, 640, 480);
  }

  // 2. Staggered Running-Bond Ashlar Stone Flagstones (culled to viewBounds)
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
      if (isMono) {
        const shade = 238 - Math.floor(hVal * 16);
        ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      } else {
        // Dark obsidian-slate flagstones with subtle warm crimson undertone near center
        const r = Math.floor(17 + hVal * 12);
        const g = Math.floor(11 + hVal * 7);
        const b = Math.floor(19 + hVal * 10);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }
      ctx.fillRect(drawX + 1.5, drawY + 1.5, drawW - 3, drawH - 3);

      // Subtle inner top-left stone bevel highlight
      ctx.strokeStyle = isMono ? "rgba(0,0,0,0.08)" : "rgba(255, 228, 230, 0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + 2, drawY + drawH - 3);
      ctx.lineTo(drawX + 2, drawY + 2);
      ctx.lineTo(drawX + drawW - 3, drawY + 2);
      ctx.stroke();

      // Sparse deterministic fractures / crimson veins (keeps readability spotless)
      if (hVal > 0.78 && drawW > 40 && drawH > 30) {
        ctx.strokeStyle = isMono
          ? "rgba(0,0,0,0.16)"
          : hVal > 0.91
            ? "rgba(190, 18, 60, 0.24)"
            : "rgba(0, 0, 0, 0.38)";
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
  if (viewBounds.maxX >= roadX - 20 && viewBounds.minX <= roadX + roadW + 20) {
    ctx.fillStyle = isMono ? "#E2E8F0" : "#180D16";
    ctx.fillRect(roadX, 330, roadW, 1110);
    // Border trim along causeway
    ctx.strokeStyle = isMono ? "#334155" : "rgba(159, 18, 57, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(roadX, 330, roadW, 1110);
    // Inner ceremonial bronze/crimson runner lines
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(217, 119, 6, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(roadX + 18, 330);
    ctx.lineTo(roadX + 18, 1440);
    ctx.moveTo(roadX + roadW - 18, 330);
    ctx.lineTo(roadX + roadW - 18, 1440);
    ctx.stroke();

    // Flagstone paver cross seams along causeway
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.14)" : "rgba(0, 0, 0, 0.38)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let py = 360; py <= 1410; py += 60) {
      if (py < viewBounds.minY - 20 || py > viewBounds.maxY + 20) continue;
      ctx.moveTo(roadX, py);
      ctx.lineTo(roadX + roadW, py);
    }
    ctx.stroke();
  }

  // East-West Cross Aisle
  const crossY = 790;
  const crossH = 100;
  if (viewBounds.maxY >= crossY - 20 && viewBounds.minY <= crossY + crossH + 20) {
    ctx.fillStyle = isMono ? "#E2E8F0" : "#150C15";
    ctx.fillRect(320, crossY, 960, crossH);
    ctx.strokeStyle = isMono ? "#475569" : "rgba(159, 18, 57, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(320, crossY, 960, crossH);
  }
  ctx.restore();

  // 4. Engraved Blood Channels linking Central Arena toward the 5 Blood Traps
  ctx.save();
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.2)" : "rgba(190, 18, 60, 0.26)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(800, 640);
  ctx.lineTo(800, 515);
  ctx.moveTo(600, 840);
  ctx.lineTo(420, 830);
  ctx.moveTo(1000, 840);
  ctx.lineTo(1180, 830);
  ctx.moveTo(665, 995);
  ctx.lineTo(560, 1235);
  ctx.moveTo(935, 995);
  ctx.lineTo(1040, 1235);
  ctx.stroke();
  ctx.restore();

  // 5. Central Blood Ritual Seal (cx=800, cy=840)
  const cx = BLOOD_CITADEL_SPAWN.x;
  const cy = BLOOD_CITADEL_SPAWN.y;
  if (isCircleInViewBounds(cx, cy, 260, viewBounds)) {
    ctx.save();
    ctx.translate(cx, cy);

    // Sunken octagonal dais slab
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      const rx = Math.cos(a) * 235;
      const ry = Math.sin(a) * 235;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fillStyle = isMono ? "#CBD5E1" : "#180A14";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#1E293B" : "rgba(180, 83, 9, 0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Outer & middle ritual rings
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.35)" : "rgba(225, 29, 72, 0.42)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 204, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(245, 158, 11, 0.25)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 186, 0, Math.PI * 2);
    ctx.stroke();

    // Slow-rotating rune arc ring
    ctx.save();
    ctx.rotate(t * 0.16);
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.3)" : "rgba(244, 63, 94, 0.48)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 154, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 8 Cardinal diamond sigils around the outer annulus
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      const px = Math.cos(ang) * 195;
      const py = Math.sin(ang) * 195;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = isMono ? "#0F172A" : i % 2 === 0 ? "#FB7185" : "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(0, 4.5);
      ctx.lineTo(-7, 0);
      ctx.lineTo(0, -4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Inner sacred geometry star & core ring
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.25)" : "rgba(190, 18, 60, 0.34)";
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

    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "rgba(0,0,0,0.06)" : "rgba(159, 18, 57, 0.2)";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : "rgba(251, 113, 133, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4 Corner Floor Braziers inside the octagonal dais corners (safe decorative edges)
    for (const bx of [-152, 152]) {
      for (const by of [-152, 152]) {
        drawBraizerFlame(ctx, bx, by, t, 0.9, isMono, "crimson");
      }
    }
    ctx.restore();
  }

  // 6. Northern Secret Underground Vault Floor (x:602, y:86, w:396, h:244)
  const vr = BLOOD_CITADEL_SECRET_VAULT_RECT;
  if (isCircleInViewBounds(vr.x + vr.w * 0.5, vr.y + vr.h * 0.5, 280, viewBounds)) {
    ctx.save();
    // Stepped crypt descent stairs at southern entrance
    for (let step = 0; step < 3; step++) {
      const sy = vr.y + vr.h - 24 + step * 8;
      ctx.fillStyle = isMono ? "#94A3B8" : `rgb(${28 - step * 4}, ${14 - step * 2}, ${36 - step * 4})`;
      ctx.fillRect(vr.x + 86, sy, vr.w - 172, 7);
      ctx.strokeStyle = isMono ? "#0F172A" : "rgba(192, 132, 252, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(vr.x + 86, sy, vr.w - 172, 7);
    }

    // Sanctum obsidian mosaic base
    ctx.fillStyle = isMono ? "#E2E8F0" : secrets.combinedUnlocked ? "#1E1024" : "#150B1D";
    ctx.fillRect(vr.x, vr.y, vr.w, vr.h - 24);

    // Subtle diamond mosaic grid inside vault
    ctx.strokeStyle = isMono ? "rgba(0,0,0,0.12)" : "rgba(168, 85, 247, 0.14)";
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

    // Outer containment trim
    ctx.strokeStyle = isMono
      ? "#0F172A"
      : secrets.combinedUnlocked
        ? "#FACC15"
        : "rgba(192, 132, 252, 0.6)";
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
        ? "rgba(250, 204, 21, 0.65)"
        : "rgba(192, 132, 252, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Engraved Title Ribbon
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(10, 6, 16, 0.85)";
    ctx.fillRect(vr.x + vr.w / 2 - 96, vr.y + 8, 192, 20);
    ctx.strokeStyle = isMono
      ? "#000000"
      : secrets.combinedUnlocked
        ? "#FACC15"
        : "rgba(192, 132, 252, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(vr.x + vr.w / 2 - 96, vr.y + 8, 192, 20);
    ctx.font = '800 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono
      ? "#FFFFFF"
      : secrets.combinedUnlocked
        ? "#FEF08A"
        : "#E9D5FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HẦM BÍ MẬT CỔ THÀNH", vr.x + vr.w / 2, vr.y + 18);
    ctx.restore();
  }

  // 7. Southern Citadel Gate Threshold (x:650, y:1384, w:300, h:52)
  const ga = BLOOD_CITADEL_GATE_ARCH;
  if (isCircleInViewBounds(ga.x + ga.w * 0.5, ga.y + ga.h * 0.5, 220, viewBounds)) {
    ctx.save();
    ctx.fillStyle = isMono ? "#CBD5E1" : "#1C0B0E";
    ctx.fillRect(ga.x, ga.y, ga.w, ga.h);
    // Heavy wrought-iron portcullis grate bars sunk into stone
    ctx.strokeStyle = isMono ? "#334155" : "rgba(120, 113, 108, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let gx = ga.x + 18; gx <= ga.x + ga.w - 18; gx += 22) {
      ctx.moveTo(gx, ga.y + 4);
      ctx.lineTo(gx, ga.y + ga.h - 4);
    }
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#000000" : "#B45309";
    ctx.lineWidth = 2.6;
    ctx.strokeRect(ga.x, ga.y, ga.w, ga.h);

    // Engraved Gate Plaque
    ctx.fillStyle = isMono ? "#0F172A" : "rgba(17, 7, 9, 0.9)";
    ctx.fillRect(ga.x + ga.w / 2 - 102, ga.y + ga.h / 2 - 11, 204, 22);
    ctx.strokeStyle = isMono ? "#000000" : "rgba(245, 158, 11, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(ga.x + ga.w / 2 - 102, ga.y + ga.h / 2 - 11, 204, 22);
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FCD34D";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CỔNG THÀNH HUYẾT TÁNG", ga.x + ga.w / 2, ga.y + ga.h / 2);

    // Twin gatehouse braziers flanking threshold
    drawBraizerFlame(ctx, ga.x + 16, ga.y + ga.h + 14, t, 1.0, isMono, "crimson");
    drawBraizerFlame(ctx, ga.x + ga.w - 16, ga.y + ga.h + 14, t, 1.0, isMono, "crimson");
    ctx.restore();
  }

  // 8. Watchtower Stone Paved Aprons & Telegraph Danger Rings
  const rt = state.citadelRuntime;
  if (rt && rt.mapId === "blood_citadel") {
    for (const tw of rt.watchtowers || []) {
      if (!isCircleInViewBounds(tw.x, tw.y, tw.range + 24, viewBounds)) continue;
      ctx.save();
      ctx.translate(tw.x, tw.y);
      ctx.fillStyle = isMono ? "#CBD5E1" : "#18111A";
      ctx.strokeStyle = isMono ? "#475569" : "rgba(159, 18, 57, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, tw.radius + 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (tw.state === "telegraph") {
        ctx.strokeStyle = isMono ? "rgba(0,0,0,0.45)" : "rgba(244, 63, 94, 0.24)";
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

      // Outer stone socket ring
      ctx.fillStyle = isMono ? "#CBD5E1" : "#140B10";
      ctx.beginPath();
      ctx.arc(0, 0, tr.radius + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#334155" : "#57534E";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner state fill
      if (tr.state === "warning") {
        ctx.fillStyle = isMono
          ? "rgba(0,0,0,0.32)"
          : `rgba(225, 29, 72, ${0.24 + warnPulse * 0.26})`;
        ctx.strokeStyle = isMono ? "#000000" : "#FDA4AF";
        ctx.lineWidth = 3;
      } else if (tr.state === "erupt") {
        ctx.fillStyle = isMono ? "rgba(0,0,0,0.55)" : "rgba(244, 63, 94, 0.52)";
        ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
        ctx.lineWidth = 3.5;
      } else if (tr.state === "cooldown") {
        ctx.fillStyle = isMono ? "rgba(0,0,0,0.08)" : "rgba(28, 25, 23, 0.72)";
        ctx.strokeStyle = isMono ? "#64748B" : "rgba(120, 113, 108, 0.5)";
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = isMono ? "rgba(0,0,0,0.14)" : "rgba(136, 19, 55, 0.28)";
        ctx.strokeStyle = isMono ? "#1E293B" : "rgba(244, 63, 94, 0.58)";
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
      ctx.strokeStyle = isMono ? "rgba(0,0,0,0.28)" : "rgba(24, 24, 27, 0.75)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let gx = -tr.radius + 14; gx <= tr.radius - 14; gx += 16) {
        ctx.moveTo(gx, -tr.radius);
        ctx.lineTo(gx, tr.radius);
      }
      ctx.stroke();
      ctx.restore();

      // Inner ritual ring + eruption spikes / warning sweep
      ctx.strokeStyle =
        tr.state === "warning"
          ? "#FEF08A"
          : tr.state === "erupt"
            ? "#FFFFFF"
            : isMono
              ? "#475569"
              : "rgba(251, 113, 133, 0.45)";
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
        // Jagged blood crystal spikes inside circle
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

    // 10. Ambush Zones (Summoning Sigils)
    for (const az of rt.ambushZones || []) {
      if (!isCircleInViewBounds(az.x, az.y, az.triggerRadius + 24, viewBounds)) continue;
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
          : "rgba(168, 85, 247, 0.25)";
      ctx.lineWidth = isWarn ? 3 : 1.5;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, az.triggerRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isWarn) {
        ctx.rotate(t * 2.2);
        ctx.fillStyle = "rgba(190, 18, 60, 0.12)";
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

  // 11. Fortified Outer Citadel Battlements Perimeter
  ctx.save();
  // Outer thick stone rampart rim
  ctx.strokeStyle = isMono ? "#0F172A" : "#27141C";
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, W - 18, H - 18);

  // Inner gilded-crimson parapet trim
  ctx.strokeStyle = isMono ? "#000000" : "#9F1239";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // Corner fortified bastions
  const corners = [
    [16, 16],
    [W - 44, 16],
    [16, H - 44],
    [W - 44, H - 44],
  ];
  for (const [cxp, cyp] of corners) {
    if (!isCircleInViewBounds(cxp + 14, cyp + 14, 48, viewBounds)) continue;
    ctx.fillStyle = isMono ? "#334155" : "#311B24";
    ctx.fillRect(cxp, cyp, 28, 28);
    ctx.strokeStyle = isMono ? "#000000" : "#B45309";
    ctx.lineWidth = 2;
    ctx.strokeRect(cxp, cyp, 28, 28);
  }
  ctx.restore();
}

function drawExtrudedStoneObstacle(ctx, ob, rt, t, isMono, secrets) {
  const isCollapsible = ob.kind === "collapsible_wall";
  const cwRef = isCollapsible ? rt.collapsibleWalls.find((c) => c.id === ob.id) : null;
  const isWarning = Boolean(cwRef && cwRef.state === "warning");
  const shakeX = isWarning ? (Math.sin(t * 72) * 2.5) : 0;
  const shakeY = isWarning ? (Math.cos(t * 64) * 2.0) : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Ground cast shadow (bottom-right)
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(ob.x + 6, ob.y + 8, ob.w, ob.h);

  // Color palette per obstacle architectural kind
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
  const faceH = Math.min(14, Math.max(8, Math.round(ob.h * 0.28)));
  ctx.fillStyle = faceColor;
  ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

  // Upper parapet roof cap
  ctx.fillStyle = topColor;
  ctx.fillRect(ob.x + 1, ob.y + 1, Math.max(2, ob.w - 2), Math.max(2, ob.h - faceH));

  // Ashlar masonry stone course lines on top cap
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(0, 0, 0, 0.35)";
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
  // Face course line separating top cap & vertical front wall
  ctx.moveTo(ob.x, ob.y + ob.h - faceH);
  ctx.lineTo(ob.x + ob.w, ob.y + ob.h - faceH);
  ctx.stroke();

  // Top bevel highlight
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.2)" : "rgba(255, 241, 242, 0.14)";
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
    const pr = Math.min(ob.w, ob.h) * 0.32;
    ctx.fillStyle = isMono ? "#94A3B8" : "#57534E";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : "#D6D3D1";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Broken column fracture cross
    ctx.strokeStyle = isMono ? "#0F172A" : "#1C1917";
    ctx.beginPath();
    ctx.moveTo(px - pr * 0.55, py - pr * 0.35);
    ctx.lineTo(px + pr * 0.45, py + pr * 0.5);
    ctx.stroke();
  } else if (ob.kind === "vault_wall") {
    // Glowing vertical containment glyphs along vault monoliths
    ctx.fillStyle = isMono ? "#E2E8F0" : secrets?.combinedUnlocked ? "#FDE047" : "#D8B4FE";
    for (let gy = ob.y + 28; gy < ob.y + ob.h - 24; gy += 42) {
      ctx.beginPath();
      ctx.arc(ob.x + ob.w * 0.5, gy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ob.kind === "gate_wall") {
    // Iron battlements studs & blood banner near central gate edge
    ctx.fillStyle = isMono ? "#0F172A" : trimColor;
    for (let bx = ob.x + 20; bx < ob.x + ob.w - 16; bx += 44) {
      ctx.fillRect(bx - 5, ob.y + 5, 10, 8);
    }
    const innerEdgeX = ob.id === "gate_wall_w" ? ob.x + ob.w - 22 : ob.x + 6;
    ctx.fillStyle = isMono ? "#64748B" : "#9F1239";
    ctx.fillRect(innerEdgeX, ob.y + ob.h - 2, 16, 18);
    ctx.strokeStyle = isMono ? "#0F172A" : "#F59E0B";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(innerEdgeX, ob.y + ob.h - 2, 16, 18);
  } else if (ob.kind === "ruin_structure") {
    // Shattered roof rafters + flickering torch sconce on courtyard side
    ctx.strokeStyle = isMono ? "#334155" : "#44403C";
    ctx.lineWidth = 2.4;
    for (let ry = ob.y + 24; ry < ob.y + ob.h - 24; ry += 34) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 8, ry);
      ctx.lineTo(ob.x + ob.w - 8, ry + 6);
      ctx.stroke();
    }
    const torchX = ob.id === "ruin_west_watch" ? ob.x + ob.w + 10 : ob.x - 10;
    drawBraizerFlame(ctx, torchX, ob.y + ob.h * 0.5, t, 0.82, isMono, "crimson");
  } else if (isCollapsible) {
    // Glowing amber fault cracks ready to collapse
    ctx.strokeStyle = isWarning ? "#FEF08A" : "rgba(251, 191, 36, 0.58)";
    ctx.lineWidth = isWarning ? 2.4 : 1.7;
    ctx.beginPath();
    ctx.moveTo(ob.x + 8, ob.y + 5);
    ctx.lineTo(ob.x + ob.w * 0.34, ob.y + ob.h * 0.62);
    ctx.lineTo(ob.x + ob.w * 0.58, ob.y + ob.h * 0.32);
    ctx.lineTo(ob.x + ob.w - 10, ob.y + ob.h - 5);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderBloodCitadelStructuresAndProps(ctx, state, isMono, viewBounds) {
  if (!state || state.activeMapId !== "blood_citadel" || !state.citadelRuntime) return;
  const rt = state.citadelRuntime;
  const t = state.elapsedTime || 0;
  const secrets = state.citadelSecrets || {};
  const obstacles = getActiveCitadelObstacles(rt);

  // 1. Collapsed rubble footprints (scattered broken stone debris)
  for (const cw of rt.collapsibleWalls || []) {
    if (cw.state !== "collapsed") continue;
    if (!isCircleInViewBounds(cw.x + cw.w * 0.5, cw.y + cw.h * 0.5, Math.max(cw.w, cw.h), viewBounds)) {
      continue;
    }
    ctx.save();
    ctx.fillStyle = isMono ? "rgba(100,116,139,0.28)" : "rgba(41, 37, 36, 0.55)";
    ctx.fillRect(cw.x + 2, cw.y + 2, cw.w - 4, cw.h - 4);
    ctx.strokeStyle = isMono ? "#475569" : "rgba(168, 162, 158, 0.42)";
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(cw.x, cw.y, cw.w, cw.h);
    ctx.setLineDash([]);

    // Scattered broken masonry chunks
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
    drawExtrudedStoneObstacle(ctx, ob, rt, t, isMono, secrets);
  }

  // 3. Fortified Watchtowers & Rotating Ballista Turrets
  for (const tw of rt.watchtowers || []) {
    if (!isCircleInViewBounds(tw.x, tw.y, tw.range + 40, viewBounds)) continue;
    const isTele = tw.state === "telegraph";

    if (isTele) {
      ctx.save();
      const urgent = tw.timer < 0.35;
      ctx.strokeStyle = isMono ? "#000000" : urgent ? "#FEF08A" : "rgba(244, 63, 94, 0.88)";
      ctx.lineWidth = urgent ? 3.2 : 2.2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(tw.x, tw.y);
      ctx.lineTo(tw.targetX, tw.targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Target reticle + closing ring
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.beginPath();
    ctx.arc(5, 7, tw.radius + 5, 0, Math.PI * 2);
    ctx.fill();

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

  for (const node of BLOOD_CITADEL_INTERACTABLES) {
    if (!isCircleInViewBounds(node.x, node.y, 130, viewBounds)) continue;
    const isNear = Boolean(nearby && nearby.id === node.id);
    ctx.save();
    ctx.translate(node.x, node.y);

    if (node.id === "tin_lab") {
      const tinHere = heroId === "tin";
      const active = tinHere || secrets.tinClue;
      const pulse = 0.72 + 0.28 * Math.sin(t * (tinHere ? 7 : 3));

      // Floor alchemical seal circle
      ctx.fillStyle = isMono
        ? "rgba(0,0,0,0.08)"
        : active
          ? `rgba(244, 63, 94, ${0.22 * pulse})`
          : "rgba(136, 19, 55, 0.16)";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#0F172A" : tinHere ? "#FB7185" : secrets.tinClue ? "#F43F5E" : "#9F1239";
      ctx.lineWidth = tinHere ? 3 : 2;
      ctx.stroke();

      // Rotating arcane tick marks
      ctx.save();
      ctx.rotate(t * (tinHere ? 1.4 : 0.4));
      ctx.strokeStyle = isMono ? "#334155" : "rgba(253, 164, 175, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Ornate Alchemist Workbench (shadow + wood + iron frame)
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-26, -10, 54, 28);
      ctx.fillStyle = isMono ? "#334155" : "#29201E";
      ctx.fillRect(-28, -14, 56, 26);
      ctx.strokeStyle = isMono ? "#0F172A" : "#A8A29E";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-28, -14, 56, 26);

      // Crimson Blood Vials
      ctx.fillStyle = isMono ? "#0F172A" : "#E11D48";
      ctx.fillRect(-20, -10, 6, 13);
      ctx.fillRect(-10, -12, 6, 15);
      ctx.fillStyle = isMono ? "#CBD5E1" : "#FDA4AF";
      ctx.fillRect(-19, -10, 4, 3);
      ctx.fillRect(-9, -12, 4, 3);

      // Parchment research scroll on right
      ctx.fillStyle = isMono ? "#F8FAFC" : "#FEF3C7";
      ctx.fillRect(6, -10, 15, 16);
      ctx.strokeStyle = isMono ? "#475569" : "#92400E";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(9, -6);
      ctx.lineTo(18, -6);
      ctx.moveTo(9, -2);
      ctx.lineTo(18, -2);
      ctx.moveTo(9, 2);
      ctx.lineTo(16, 2);
      ctx.stroke();

      // Levitating faceted Crimson Ma Thach Crystal
      const bobY = Math.sin(t * 4) * 3;
      ctx.fillStyle = isMono ? "#0F172A" : tinHere ? "#FFE4E6" : "#F43F5E";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FB7185";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -29 + bobY);
      ctx.lineTo(8.5, -17 + bobY);
      ctx.lineTo(0, -5 + bobY);
      ctx.lineTo(-8.5, -17 + bobY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (node.id === "bao_mirror") {
      const baoHere = heroId === "bao";
      const active = baoHere || secrets.baoClue;

      ctx.fillStyle = isMono
        ? "rgba(0,0,0,0.08)"
        : active
          ? "rgba(168, 85, 247, 0.22)"
          : "rgba(88, 28, 135, 0.14)";
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#0F172A" : baoHere ? "#E879F9" : "#9333EA";
      ctx.lineWidth = baoHere ? 3 : 2;
      ctx.stroke();

      // Scattered Project Replica parchment sheets
      ctx.fillStyle = isMono ? "#E2E8F0" : "#CBD5E1";
      ctx.fillRect(-28, 10, 14, 10);
      ctx.fillRect(14, 12, 13, 9);

      // Ornate Gothic Standing Mirror
      ctx.fillStyle = isMono ? "#1E293B" : "#1E1B4B";
      ctx.strokeStyle = isMono ? "#000000" : "#C084FC";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, -8, 18, 27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner skewed reflection glint + fracture cracks
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#E9D5FF";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.lineTo(3, -5);
      ctx.lineTo(-4, 14);
      ctx.moveTo(3, -5);
      ctx.lineTo(11, -11);
      ctx.stroke();

      // Flickering Cloaked Double-Dagger Bao Phantom Silhouette
      const phase = rt.baoShadowPhase || t;
      const alpha = Math.max(0.2, 0.56 + 0.4 * Math.sin(phase * 4.5));
      const offX = Math.sin(phase * 2.1) * (baoHere ? 31 : 23);
      const offY = Math.cos(phase * 1.6) * 14 - 8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(offX, offY);
      // Phantom cloak & hood
      ctx.fillStyle = isMono ? "#0F172A" : "#581C87";
      ctx.strokeStyle = isMono ? "#475569" : "#E879F9";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 8);
      ctx.lineTo(4, 13);
      ctx.lineTo(-4, 13);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glowing twin eyes
      ctx.fillStyle = isMono ? "#FFFFFF" : "#F5D0FE";
      ctx.beginPath();
      ctx.arc(-3.5, -3, 1.8, 0, Math.PI * 2);
      ctx.arc(3.5, -3, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (node.id === "shared_altar") {
      const ready = Boolean(secrets.tinClue && secrets.baoClue);
      const awakened = Boolean(secrets.combinedUnlocked);

      ctx.fillStyle = isMono
        ? "rgba(0,0,0,0.1)"
        : awakened
          ? "rgba(250, 204, 21, 0.24)"
          : ready
            ? "rgba(232, 121, 249, 0.2)"
            : "rgba(30, 41, 59, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMono ? "#0F172A" : awakened ? "#FACC15" : ready ? "#F472B6" : "#64748B";
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Stepped Obsidian Dais
      ctx.fillStyle = isMono ? "#334155" : "#181020";
      ctx.fillRect(-34, -16, 68, 32);
      ctx.strokeStyle = isMono ? "#0F172A" : awakened ? "#FDE047" : "#71717A";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-34, -16, 68, 32);

      // Connecting leyline filaments between Tin & Bao sockets
      ctx.strokeStyle = isMono
        ? "#FFFFFF"
        : awakened
          ? "#FDE047"
          : ready
            ? "#F472B6"
            : "#3F3F46";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();

      // Left socket (Tin crimson)
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
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Right socket (Bao violet)
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
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Central Golden-Rose Star Crest when awakened
      if (awakened) {
        ctx.save();
        ctx.rotate(t * 1.1);
        ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? 12 : 4.5;
          const a = (Math.PI * i) / 4;
          const sx = Math.cos(a) * r;
          const sy = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Floating diegetic "[V]" signifier plaque
    if (isNear) {
      const label = "[V] " + (node.shortPrompt?.[state.currentLang === "en" ? "en" : "vi"] || "");
      ctx.font = '800 11.5px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 18;
      ctx.fillStyle = "rgba(10, 6, 16, 0.9)";
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-tw * 0.5, -72, tw, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FEF08A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, -60);
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

  // Deterministic drifting crimson embers / ash motes in screen space (zero allocations)
  const emberCount = tier === "saver" ? 0 : tier === "balanced" ? 8 : 16;
  if (emberCount > 0) {
    ctx.save();
    for (let i = 0; i < emberCount; i++) {
      const seed = i * 19.37;
      const px = ((seed * 73.1 + t * (16 + (i % 5) * 4) + Math.sin(t * 0.9 + seed) * 28) % (w + 40)) - 20;
      const py = h - (((seed * 41.7 + t * (22 + (i % 4) * 6)) % (h + 40)) - 20);
      const r = 1.3 + (i % 3) * 0.7;
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
