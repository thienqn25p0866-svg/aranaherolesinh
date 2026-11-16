// High-craft MOBA Fantasy Weapon & VFX Renderer for Arena Hero
// Zero ctx.shadowBlur usage for 60fps mobile Canvas 2D performance.

import { DUY_DECOY_REFLECT_RATIO } from "./combatLogic";

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
    let a = clamp(Math.max(flare * 0.85, isUlt ? 0.75 : 0), 0, 1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = isMono ? "#000000" : isUlt || critBoost > 0.1 ? "#FEF08A" : "#67E8F9";
    ctx.lineWidth = 1.9;
    for (let s of [-1, 1]) {
      let ph = t * 16 + s * 1.7;
      ctx.beginPath();
      ctx.moveTo(22, s * 2);
      ctx.bezierCurveTo(32, s * (10 + Math.sin(ph) * 3.5), 42, -s * (7 + Math.cos(ph) * 2.5), 56, 0);
      ctx.stroke();
    }
    if (critBoost > 0.1 || isUlt) {
      let starScale = Math.max(critBoost, isUlt ? 0.72 : 0);
      drawFourPointStar(ctx, 56, 0, 8 * starScale, 2.2 * starScale, "#FEF08A", "#FFFFFF");
    }
  }

  ctx.restore();
}

function drawTinBlades(ctx, p, t, state, isMono) {
  // Hư Không Song Đao — Void-Rift Twin Blades
  let atkProg = state.atkProg;
  let hasAtk = state.hasAtk;
  let parity = state.parity;
  let flare = clamp(state.skillAlpha + state.critAlpha * 0.9, 0, 1.2);
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

    // Subtle void trail during swing / skill
    if (hasAtk || flare > 0.2) {
      ctx.globalAlpha = clamp(0.45 + flare * 0.4, 0, 0.9);
      ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
      ctx.lineWidth = 3.2;
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

    // Sculpted Curved Void Blade (obsidian spine + luminous crimson edge)
    let bladeGrad = ctx.createLinearGradient(6, 0, 36, 0);
    if (isMono) {
      bladeGrad.addColorStop(0, "#111111");
      bladeGrad.addColorStop(0.6, "#666666");
      bladeGrad.addColorStop(1, "#FFFFFF");
    } else {
      bladeGrad.addColorStop(0, "#31102F");
      bladeGrad.addColorStop(0.45, "#E11D48");
      bladeGrad.addColorStop(1, "#FFE4E6");
    }
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = isMono ? "#000000" : "#FDA4AF";
    ctx.lineWidth = 1.4;
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
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(10, -side * 3.2);
    ctx.quadraticCurveTo(22, -side * 5.6, 35, side * 1.3);
    ctx.stroke();

    // Void crystal in guard + spatial-rift rune glow
    let gemHalo = ctx.createRadialGradient(6, 0, 0.5, 6, 0, 7 + flare * 3);
    gemHalo.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : "rgba(251, 113, 133, 0.78)");
    gemHalo.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = gemHalo;
    ctx.beginPath();
    ctx.arc(6, 0, 7 + flare * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FB7185";
    ctx.beginPath();
    ctx.arc(6, 0, 2.4 + flare * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Engraved crimson-violet rune sigils along blade spine
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDA4AF";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(18, -side * 1.4);
    ctx.lineTo(23, 0);
    ctx.lineTo(28, -side * 1.1);
    ctx.stroke();

    // Flowing dark-rose mist ribbon trailing from pommel
    let mistW = Math.sin(t * 11 + side * 2) * 3.2;
    ctx.strokeStyle = isMono ? "#333333" : "rgba(244, 63, 94, 0.72)";
    ctx.lineWidth = 1.6;
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

  // Central Blood-Fuller Groove & Glowing Dragon Runes
  ctx.strokeStyle = isMono ? "#FFFFFF" : isBuffed ? "#FEF08A" : "#EF4444";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(44, 0);
  ctx.stroke();

  // Engraved draconic teeth runes along fuller
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = 1.1;
  for (let rx = 18; rx <= 38; rx += 6.5) {
    ctx.beginPath();
    ctx.moveTo(rx, -2.5);
    ctx.lineTo(rx + 2.4, 0);
    ctx.lineTo(rx, 2.5);
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
    ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(14, -7.8);
    ctx.quadraticCurveTo(34, -9 + Math.sin(t * 15) * 2.2, 55, 0);
    ctx.quadraticCurveTo(34, 9 - Math.sin(t * 15) * 2.2, 14, 7.8);
    ctx.stroke();
  }
  if (state.critAlpha > 0.15 || isBuffed) {
    let sc = Math.max(state.critAlpha, isBuffed ? 0.65 : 0);
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
  let ink = isMono ? "#000000" : "#082F49";
  let azure = isMono ? "#94A3B8" : "#0EA5E9";
  let cyan = isMono ? "#FFFFFF" : "#22D3EE";
  let core = isMono ? "#FFFFFF" : "#E0F2FE";
  let swing = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 1.15 * state.parity : 0;
  let pulse = 0.78 + 0.22 * Math.sin(elapsedTime * 9);

  for (let side of [-1, 1]) {
    ctx.save();
    let isLead = side === 1;
    ctx.translate(isLead ? 7 : 4, side * 13);
    ctx.rotate(side * 0.26 + (isLead ? -swing : swing * 0.65));

    // Flowing cyan energy ribbon off hilt
    ctx.strokeStyle = isMono ? "#E2E8F0" : `rgba(34, 211, 238, ${0.42 * pulse})`;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-11, side * 5 + Math.sin(elapsedTime * 11 + side) * 2.4, -18, side * 3);
    ctx.stroke();

    // Sleek plasma katana energy blade
    ctx.fillStyle = azure;
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(24 + state.skillAlpha * 5, -0.6);
    ctx.lineTo(28 + state.skillAlpha * 5, 0.8);
    ctx.lineTo(18, 3.0);
    ctx.lineTo(0, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing white-cyan plasma edge
    ctx.strokeStyle = core;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(4, -0.3);
    ctx.lineTo(25 + state.skillAlpha * 4, 0.4);
    ctx.stroke();

    // Hilt + cyan guard gem
    ctx.fillStyle = ink;
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-5, -3.5, 6, 7, 2);
    ctx.fill();
    ctx.stroke();
    drawHandGrip(ctx, -1, 0, "#0284C7", "#67E8F9", 3.4, isMono);
    ctx.restore();
  }
}

function drawDangTigerGauntlets(ctx, p, elapsedTime, state, isMono) {
  let black = isMono ? "#000000" : "#09090B";
  let charcoal = isMono ? "#262626" : "#27272A";
  let white = "#F8FAFC";
  let rageReady = Boolean(p?.dang_rageReady);
  let c2Active = (p?.dang_c2_timer || 0) > 0;
  let c3Active = (p?.dang_c3_asTimer || 0) > 0;
  let stepDir = (p?.dang_basicStep || 0) % 2 === 0 ? 1 : -1;
  let punchThrust = state.hasAtk ? Math.sin(state.atkProg * Math.PI) * 10 : 0;

  for (let side of [-1, 1]) {
    ctx.save();
    let activeArm = side === stepDir ? punchThrust : punchThrust * 0.25;
    ctx.translate(9 + activeArm, side * 14);
    ctx.rotate(side * 0.14);

    // Outer white/black contrasting Tiger Qi aura around fist
    if (rageReady || c2Active || c3Active || state.skillAlpha > 0) {
      let auraR = 12 + Math.sin(elapsedTime * 14) * 2;
      let grad = ctx.createRadialGradient(3, 0, 2, 3, 0, auraR);
      grad.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : side < 0 ? "rgba(248,250,252,0.72)" : "rgba(24,24,27,0.78)");
      grad.addColorStop(0.65, isMono ? "rgba(0,0,0,0.3)" : side < 0 ? "rgba(148,163,184,0.35)" : "rgba(248,250,252,0.35)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(3, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Left fist white-accented / Right fist obsidian-accented (yin-yang tiger theme)
    let isWhiteSide = side < 0;
    ctx.fillStyle = isMono ? black : isWhiteSide ? white : charcoal;
    ctx.strokeStyle = isMono ? white : isWhiteSide ? black : white;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-4, -5.8, 12, 11.6, 4);
    ctx.fill();
    ctx.stroke();

    // Tiger stripe knuckle markings
    ctx.strokeStyle = isMono ? white : isWhiteSide ? black : white;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -3.5);
    ctx.lineTo(3, -1.8);
    ctx.moveTo(0, 0);
    ctx.lineTo(3.5, 0);
    ctx.moveTo(0, 3.5);
    ctx.lineTo(3, 1.8);
    ctx.stroke();

    // Sharp Tiger-claw energy prongs ahead of gauntlet
    ctx.fillStyle = rageReady ? "#FACC15" : isWhiteSide ? white : "#E4E4E7";
    ctx.strokeStyle = black;
    ctx.lineWidth = 1.0;
    for (let c = -1; c <= 1; c++) {
      ctx.beginPath();
      ctx.moveTo(8, c * 3.2 - 1.0);
      ctx.lineTo(13.5 + (rageReady ? 3 : 0), c * 3.4);
      ctx.lineTo(8, c * 3.2 + 1.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function drawHeroWeapon(ctx, heroId, p, elapsedTime, isMono) {
  let atkDur = Math.max(0.06, p.weaponAttackDuration || 0.22);
  let hasAtk = p.attackAnimTimer > 0;
  let atkProg = hasAtk ? clamp(1 - p.attackAnimTimer / atkDur, 0, 1) : 0;
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
    dang: 1.26
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
    default:
      break;
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
    // Barbed fox-fire arrowhead
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
    if (isFox) drawFourPointStar(ctx, 16, 0, 5.2, 1.5, "#FEF08A", "#EA580C");
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
    drawFourPointStar(ctx, 0, 0, 6, 1.9, "#FFFFFF", isMono ? null : "#FDE047");
    return;
  }

  if (h.kind === "duccong_orb") {
    // Singularity bolt with gravitational rim halo & pink-cyan trail
    let lens = ctx.createRadialGradient(0, 0, 2, 0, 0, h.radius * 2.1);
    lens.addColorStop(0, isMono ? "rgba(255,255,255,0.6)" : "rgba(232, 121, 249, 0.65)");
    lens.addColorStop(0.55, isMono ? "rgba(0,0,0,0.2)" : "rgba(56, 189, 248, 0.3)");
    lens.addColorStop(1, "rgba(124, 58, 237, 0)");
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : "rgba(192, 132, 252, 0.68)";
    ctx.lineWidth = 4.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.save();
    ctx.rotate(-elapsedTime * 10 + h.id);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.radius + 4, h.radius * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : "#0F0720";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "#F472B6";
    ctx.fill();
    return;
  }

  if (h.kind === "duccong_push_orb") {
    let pAura = ctx.createRadialGradient(0, 0, h.radius * 0.4, 0, 0, h.radius * 1.9);
    pAura.addColorStop(0, isMono ? "rgba(255,255,255,0.4)" : "rgba(192, 132, 252, 0.55)");
    pAura.addColorStop(0.6, isMono ? "rgba(0,0,0,0.2)" : "rgba(56, 189, 248, 0.25)");
    pAura.addColorStop(1, "rgba(88, 28, 135, 0)");
    ctx.fillStyle = pAura;
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : "rgba(88, 28, 135, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#E9D5FF";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.rotate(elapsedTime * 5.5);
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, h.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, h.radius * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "#030712";
    ctx.fill();
    drawFourPointStar(ctx, 0, 0, h.radius * 0.5, 1.6, "#67E8F9", null);
    return;
  }

  if (h.kind === "danh_kiem_khi") {
    let qiAura = ctx.createRadialGradient(6, 0, 2, 6, 0, 34);
    qiAura.addColorStop(0, isMono ? "rgba(255,255,255,0.45)" : "rgba(254, 240, 138, 0.45)");
    qiAura.addColorStop(0.6, isMono ? "rgba(0,0,0,0.2)" : "rgba(239, 68, 68, 0.28)");
    qiAura.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = qiAura;
    ctx.beginPath();
    ctx.arc(6, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    drawTaperedArc(ctx, -6, 0, 33, -1.14, 1.14, 12, "#EF4444", "#FEF08A", isMono);
    drawTaperedArc(ctx, 2, 0, 28, -0.94, 0.94, 6.5, "#F59E0B", "#FFFFFF", isMono);
    drawFourPointStar(ctx, 28, 0, 7, 1.8, "#FFFFFF", isMono ? "#000000" : "#EF4444");
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

    // Inner bright spatial rift edge + rift spark
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(5, -7, 12, 0);
    ctx.quadraticCurveTo(5, 7, -10, 18);
    ctx.stroke();
    drawFourPointStar(ctx, 13, 0, 5.5, 1.5, "#FFFFFF", isMono ? "#000000" : "#FB7185");
    return;
  }

  if (h.kind === "tin_crystal_throw") {
    let cGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    cGlow.addColorStop(0, isMono ? "rgba(255,255,255,0.6)" : "rgba(251, 113, 133, 0.65)");
    cGlow.addColorStop(1, "rgba(225, 29, 72, 0)");
    ctx.fillStyle = cGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(elapsedTime * 14);
    ctx.strokeStyle = isMono ? "#000000" : "rgba(253, 164, 175, 0.72)";
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isMono ? "#000000" : "#E11D48";
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(10.5, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(-10.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isMono ? "#444444" : "#FB7185";
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(10.5, 0);
    ctx.lineTo(0, 17);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#FFE4E6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(10.5, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(-10.5, 0);
    ctx.closePath();
    ctx.stroke();
    return;
  }

  if (h.kind === "luan_orb") {
    let sc = h.portalBoosted ? 1.3 : 1.0;
    let spin = elapsedTime * 11 + (h.id || 0);
    ctx.scale(sc, sc);

    // Void plasma comet wake
    let wake = ctx.createLinearGradient(-28, 0, 6, 0);
    wake.addColorStop(0, "rgba(124, 58, 237, 0)");
    wake.addColorStop(0.55, isMono ? "rgba(0,0,0,0.45)" : h.portalBoosted ? "rgba(56, 189, 248, 0.55)" : "rgba(168, 85, 247, 0.55)");
    wake.addColorStop(1, isMono ? "#222222" : "#F0ABFC");
    ctx.fillStyle = wake;
    ctx.beginPath();
    ctx.moveTo(6, -7);
    ctx.lineTo(-28, 0);
    ctx.lineTo(6, 7);
    ctx.closePath();
    ctx.fill();

    // Outer dimensional aura
    let aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
    aura.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : "rgba(245, 208, 254, 0.85)");
    aura.addColorStop(0.5, isMono ? "rgba(80,80,80,0.45)" : h.portalBoosted ? "rgba(56, 189, 248, 0.55)" : "rgba(192, 132, 252, 0.55)");
    aura.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Dual counter-rotating orbital rings
    ctx.save();
    ctx.rotate(spin);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12.5, 4.8, 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-spin * 2);
    ctx.strokeStyle = isMono ? "#CCCCCC" : "#38BDF8";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12.5, 4.8, -0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Singularity core + diamond glint
    ctx.fillStyle = isMono ? "#111111" : "#6B21A8";
    ctx.strokeStyle = isMono ? "#FFFFFF" : h.portalBoosted ? "#67E8F9" : "#F5D0FE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 6.2, 2.2, isMono ? "#FFFFFF" : "#FEF08A", null);
    return;
  }

  if (h.kind === "luan_shard") {
    let sc = h.portalBoosted ? 1.32 : 1.0;
    ctx.scale(sc, sc);
    let wake = ctx.createLinearGradient(-28, 0, 2, 0);
    wake.addColorStop(0, "rgba(168, 85, 247, 0)");
    wake.addColorStop(0.5, isMono ? "rgba(0,0,0,0.5)" : h.portalBoosted ? "rgba(56, 189, 248, 0.65)" : "rgba(192, 132, 252, 0.58)");
    wake.addColorStop(1, isMono ? "#FFFFFF" : "#F5D0FE");
    ctx.strokeStyle = wake;
    ctx.lineWidth = h.portalBoosted ? 5.2 : 3.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-2, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#111111" : "#3B0764";
    ctx.strokeStyle = isMono ? "#FFFFFF" : h.portalBoosted ? "#67E8F9" : "#E879F9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(-1, -7.5);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-1, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner prism facet & spark
    ctx.fillStyle = isMono ? "#DDDDDD" : h.portalBoosted ? "#BAE6FD" : "#F5D0FE";
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(0, -3.2);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, 3.2);
    ctx.closePath();
    ctx.fill();

    if (h.portalBoosted) {
      ctx.strokeStyle = "rgba(240, 171, 252, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      ctx.lineTo(5, -6);
      ctx.moveTo(-8, 9);
      ctx.lineTo(5, 6);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "taidu_rail") {
    ctx.strokeStyle = isMono ? "#000000" : "rgba(56, 189, 248, 0.72)";
    ctx.lineWidth = 8.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    // Side ionized rail prongs
    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(6, -6.5);
    ctx.lineTo(10, 0);
    ctx.lineTo(6, 6.5);
    ctx.closePath();
    ctx.fill();
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
    let flk = Math.sin(elapsedTime * 32 + (h.id || 0)) * 2.4;
    ctx.strokeStyle = isMono ? "#000000" : "rgba(249, 115, 22, 0.6)";
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-27, flk * 0.7);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, flk * 0.4);
    ctx.stroke();

    // Seeker warhead fuselage + stabilizer fins
    ctx.fillStyle = isMono ? "#222222" : "#0EA5E9";
    ctx.strokeStyle = "#070B14";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(7, -5.2);
    ctx.lineTo(-10, -5.2);
    ctx.lineTo(-15, -9);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 9);
    ctx.lineTo(-10, 5.2);
    ctx.lineTo(7, 5.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(10, 0, 5.2, -0.9, 0.9);
    ctx.stroke();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(9.5, 0, 2.7, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.kind === "nguyen_bolt") {
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
    drawFourPointStar(ctx, 0, 0, 5.2, 1.8, "#FEF08A", null);
    return;
  }

  if (h.kind === "boomerang_glaive") {
    ctx.rotate(elapsedTime * 16);
    ctx.strokeStyle = isMono ? "#000000" : "#FBBF24";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, -1.35, 1.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 13, Math.PI - 1.35, Math.PI + 1.35);
    ctx.stroke();
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (h.kind === "wisp_bolt") {
    ctx.beginPath();
    ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#C084FC";
    ctx.fill();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    return;
  }

  if (h.kind === "frost_bolt") {
    ctx.strokeStyle = isMono ? "#333333" : "#7DD3FC";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#000000" : "#E0F2FE";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#0284C7";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.kind === "void_bolt") {
    ctx.rotate(elapsedTime * 9);
    ctx.fillStyle = isMono ? "#000000" : "#4C1D95";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
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
    let bladeR = isUlt ? 13.5 : isC2 ? 12 : 10;
    let primary = isUlt ? "#F43F5E" : isC2 ? "#2DD4BF" : "#14B8A6";
    let edge = isUlt ? "#FDE047" : "#F0FDFA";

    // Luminous velocity wake
    let trailGrad = ctx.createLinearGradient(-28, 0, 4, 0);
    trailGrad.addColorStop(0, "rgba(20, 184, 166, 0)");
    trailGrad.addColorStop(1, isUlt ? "rgba(244, 63, 94, 0.55)" : "rgba(45, 212, 191, 0.55)");
    ctx.fillStyle = isMono ? "rgba(0,0,0,0.35)" : trailGrad;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(2, -bladeR * 0.45);
    ctx.lineTo(2, bladeR * 0.45);
    ctx.closePath();
    ctx.fill();

    // Spinning 4-blade shuriken
    ctx.save();
    ctx.rotate(elapsedTime * (isUlt ? 28 : 22) + (h.id || 0));
    ctx.fillStyle = isMono ? "#FFFFFF" : primary;
    ctx.strokeStyle = isMono ? "#000000" : edge;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let a = (Math.PI / 2) * i;
      ctx.lineTo(Math.cos(a) * bladeR, Math.sin(a) * bladeR);
      ctx.lineTo(Math.cos(a + Math.PI / 4) * (bladeR * 0.34), Math.sin(a + Math.PI / 4) * (bladeR * 0.34));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner dark ring & core gem
    ctx.fillStyle = isMono ? "#000000" : "#0F172A";
    ctx.beginPath();
    ctx.arc(0, 0, bladeR * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "#FFFFFF" : isUlt ? "#34D399" : "#F43F5E";
    ctx.beginPath();
    ctx.arc(0, 0, bladeR * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (h.kind === "phong_illusion_bolt") {
    let ang = Math.atan2(h.vy || 0, h.vx || 1);
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.strokeStyle = isMono ? "#000000" : "#E0F2FE";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-7, -4.5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (h.kind === "dang_tiger_wave") {
    let ang = Math.atan2(h.vy || 0, h.vx || 1);
    let r = h.radius || 26;
    ctx.save();
    ctx.rotate(ang);
    // Outer black shadow wave
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-8, 0, r * 1.12, -0.95, 0.95);
    ctx.stroke();
    // Bright white tiger-qi edge
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.arc(-6, 0, r * 1.12, -0.9, 0.9);
    ctx.stroke();
    // Triple tiger claw streaks inside wave
    for (let s = -1; s <= 1; s++) {
      ctx.strokeStyle = s === 0 ? "#F8FAFC" : "#18181B";
      ctx.lineWidth = s === 0 ? 3.2 : 2.4;
      ctx.beginPath();
      ctx.moveTo(-14, s * 10);
      ctx.lineTo(r * 0.72, s * 6);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (h.kind === "dang_tiger_head") {
    let ang = Math.atan2(h.vy || 0, h.vx || 1);
    let r = h.radius || 42;
    let pulse = 0.94 + 0.08 * Math.sin(elapsedTime * 18);
    ctx.save();
    ctx.rotate(ang);
    ctx.scale(pulse, pulse);

    // Trailing black-white yin-yang mane aura
    let aura = ctx.createRadialGradient(-8, 0, 8, -4, 0, r * 1.38);
    aura.addColorStop(0, isMono ? "rgba(255,255,255,0.7)" : "rgba(248, 250, 252, 0.65)");
    aura.addColorStop(0.55, isMono ? "rgba(0,0,0,0.4)" : "rgba(24, 24, 27, 0.7)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-4, 0, r * 1.38, 0, Math.PI * 2);
    ctx.fill();

    // Roaring Giant Tiger Head silhouette facing +X
    ctx.fillStyle = isMono ? "#111111" : "#18181B";
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 1.05, 0);
    ctx.lineTo(r * 0.45, -r * 0.72);
    ctx.lineTo(-r * 0.25, -r * 0.92); // Left ear peak
    ctx.lineTo(-r * 0.45, -r * 0.48);
    ctx.lineTo(-r * 0.95, -r * 0.22);
    ctx.lineTo(-r * 0.95, r * 0.22);
    ctx.lineTo(-r * 0.45, r * 0.48);
    ctx.lineTo(-r * 0.25, r * 0.92); // Right ear peak
    ctx.lineTo(r * 0.45, r * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bold white tiger crown + cheek markings
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.moveTo(r * 0.78, 0);
    ctx.lineTo(r * 0.22, -r * 0.36);
    ctx.lineTo(-r * 0.32, -r * 0.22);
    ctx.lineTo(-r * 0.08, 0);
    ctx.lineTo(-r * 0.32, r * 0.22);
    ctx.lineTo(r * 0.22, r * 0.36);
    ctx.closePath();
    ctx.fill();

    // Forehead black 王-tiger stripes
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.06, -r * 0.22);
    ctx.lineTo(-r * 0.06, r * 0.22);
    ctx.moveTo(r * 0.14, -r * 0.16);
    ctx.lineTo(-r * 0.2, -r * 0.16);
    ctx.moveTo(r * 0.14, r * 0.16);
    ctx.lineTo(-r * 0.2, r * 0.16);
    ctx.stroke();

    // Fierce glowing eyes + white fangs
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FACC15";
      ctx.beginPath();
      ctx.ellipse(r * 0.26, s * r * 0.32, 6, 3.2, s * -0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(r * 0.65, s * r * 0.26);
      ctx.lineTo(r * 1.1, s * r * 0.15);
      ctx.lineTo(r * 0.65, s * r * 0.08);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "#000000" : h.color;
  ctx.fill();
  ctx.strokeStyle = isMono ? "#333333" : "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawUpgradedSlash(ctx, h, f, isMono) {
  let alpha = Math.max(0, 1 - f);
  if (h.kind === "shockwave") {
    let r = h.radius * (0.25 + 0.75 * f);
    let ringGrad = ctx.createRadialGradient(h.x, h.y, r * 0.45, h.x, h.y, r);
    ringGrad.addColorStop(0, "rgba(255,255,255,0)");
    ringGrad.addColorStop(0.85, isMono ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.18)");
    ringGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color;
    ctx.lineWidth = 5 * alpha + 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.82, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#555555" : "#FFFFFF";
    ctx.lineWidth = 1.8 * alpha;
    ctx.stroke();
    return;
  }

  if (h.kind === "gau_shockring") {
    let v = h.radius * (0.2 + 0.8 * Math.pow(f, 0.72));
    let sGrad = ctx.createRadialGradient(h.x, h.y, v * 0.3, h.x, h.y, v);
    sGrad.addColorStop(0, "rgba(251, 191, 36, 0)");
    sGrad.addColorStop(0.7, isMono ? "rgba(0,0,0,0.22)" : `rgba(249, 115, 22, ${0.32 * alpha})`);
    sGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color;
    ctx.lineWidth = (h.heavy ? 7.5 : 5.5) * alpha + 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, v * 0.78, 0, Math.PI * 2);
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.8 * alpha + 0.8;
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      let ang = (Math.PI / 3) * i + f * 0.4;
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
      ctx.lineWidth = 2.4 * alpha;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(ang) * v * 0.82, h.y + Math.sin(ang) * v * 0.82);
      ctx.lineTo(h.x + Math.cos(ang) * v * 1.09, h.y + Math.sin(ang) * v * 1.09);
      ctx.stroke();
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
    drawTaperedArc(ctx, 0, 0, h.radius, startA, sweepEnd, 12 * alpha + 2, "#9333EA", "#F5D0FE", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.76, startA * 0.85, sweepEnd * 0.9, 6 * alpha + 1, "#E879F9", "#FFFFFF", isMono);
    if (h.crossed) {
      drawTaperedArc(ctx, 0, 0, h.radius * 0.88, h.spread * 0.5, -h.spread * 0.5, 8 * alpha + 1.5, "#E879F9", "#FFFFFF", isMono);
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * h.radius, Math.sin(sweepEnd) * h.radius, 7 * alpha, 2 * alpha, "#F5D0FE", "#9333EA");
    return;
  }

  if (h.kind === "danh_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let startA = (-h.spread / 2) * dir;
    let sweepEnd = (-h.spread / 2 + h.spread * Math.min(1, f * 1.75 + 0.35)) * dir;
    drawTaperedArc(ctx, 0, 0, h.radius, startA, sweepEnd, (h.empowered ? 14 : 11) * alpha + 2, h.color, "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.78, startA * 0.85, sweepEnd * 0.88, 6 * alpha + 1, "#F59E0B", "#FFFFFF", isMono);
    drawFourPointStar(ctx, Math.cos(sweepEnd) * h.radius, Math.sin(sweepEnd) * h.radius, 8 * alpha, 2.2 * alpha, "#FEF08A", h.color);
    return;
  }

  if (h.kind === "danh_kiem_khi_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let step = h.step || 1;
    let tilt = step === 1 ? -0.32 : step === 2 ? 0.32 : 0;
    ctx.rotate(tilt);
    ctx.scale(1, step === 3 ? 0.88 : 0.72);
    drawTaperedArc(ctx, f * 18, 0, h.radius, -h.spread / 2, h.spread / 2, (step === 3 ? 14 : 10) * alpha + 2, h.color, "#FFFFFF", isMono);
    drawTaperedArc(ctx, f * 22, 0, h.radius * 0.8, -h.spread * 0.42, h.spread * 0.42, 5.5 * alpha + 1, "#FEF08A", "#FFFFFF", isMono);
    return;
  }

  if (h.kind === "phong_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let startA = (-h.spread / 2) * dir;
    let sweepEnd = (-h.spread / 2 + h.spread * Math.min(1, f * 1.9 + 0.3)) * dir;
    drawTaperedArc(ctx, 0, 0, h.radius, startA, sweepEnd, (h.isCrit ? 14 : 10) * alpha + 2, h.isCrit ? "#FACC15" : "#0EA5E9", "#67E8F9", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.76, startA * 0.85, sweepEnd * 0.9, 5.5 * alpha + 1, "#22D3EE", "#FFFFFF", isMono);
    if (h.crossed) {
      drawTaperedArc(ctx, 0, 0, h.radius * 0.88, h.spread * 0.5, -h.spread * 0.5, 7 * alpha + 1.5, "#38BDF8", "#FFFFFF", isMono);
    }
    drawFourPointStar(ctx, Math.cos(sweepEnd) * h.radius, Math.sin(sweepEnd) * h.radius, (h.isCrit ? 10 : 7) * alpha, 2.2 * alpha, "#E0F2FE", "#0EA5E9");
    return;
  }

  if (h.kind === "phong_swap_burst") {
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.7));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.25, h.x, h.y, r);
    grad.addColorStop(0, "rgba(34, 211, 238, 0)");
    grad.addColorStop(0.7, isMono ? "rgba(255,255,255,0.28)" : `rgba(14, 165, 233, ${0.35 * alpha})`);
    grad.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 6 * alpha + 1.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2.4 * alpha;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (h.kind === "phong_c3_mark") {
    let r = (h.radius || 52) * (0.65 + 0.35 * Math.sin(f * Math.PI));
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 3 * alpha + 1;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
    ctx.lineWidth = 4.2 * alpha + 1;
    ctx.beginPath();
    ctx.moveTo(h.x - r * 0.9, h.y - r * 0.9);
    ctx.lineTo(h.x + r * 0.9, h.y + r * 0.9);
    ctx.moveTo(h.x - r * 0.9, h.y + r * 0.9);
    ctx.lineTo(h.x + r * 0.9, h.y - r * 0.9);
    ctx.stroke();
    drawFourPointStar(ctx, h.x, h.y, 12 * alpha, 3 * alpha, "#E0F2FE", "#0EA5E9");
    return;
  }

  if (h.kind === "dang_punch") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let reach = 24 + f * (h.radius * 0.78);
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 7.5 * alpha + 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(reach, -6);
    ctx.moveTo(10, 8);
    ctx.lineTo(reach, 6);
    ctx.stroke();
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 4.5 * alpha + 1;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(reach + 14, 0);
    ctx.stroke();
    drawTaperedArc(ctx, reach - 2, 0, 20, -1.1, 1.1, 8.5 * alpha + 2, "#18181B", "#F8FAFC", isMono);
    return;
  }

  if (h.kind === "dang_tiger_fist_aoe" || h.kind === "dang_black_shield_boom") {
    let isShield = h.kind === "dang_black_shield_boom";
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.68));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.25, h.x, h.y, r);
    grad.addColorStop(0, "rgba(248, 250, 252, 0)");
    grad.addColorStop(0.68, isMono ? "rgba(0,0,0,0.3)" : `rgba(24, 24, 27, ${0.42 * alpha})`);
    grad.addColorStop(1, "rgba(248, 250, 252, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = (isShield ? 9 : 11) * alpha + 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 4.5 * alpha + 1;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Tiger claw slash arcs inside the impact zone
    for (let i = -1; i <= 1; i++) {
      let off = i * r * 0.24;
      ctx.strokeStyle = i === 0 ? "#F8FAFC" : "#18181B";
      ctx.lineWidth = (i === 0 ? 4.2 : 3.2) * alpha;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(h.x - r * 0.55, h.y + off - r * 0.22);
      ctx.lineTo(h.x + r * 0.55, h.y + off + r * 0.22);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "danh_dragon_shockring") {
    let v = h.radius * (0.18 + 0.82 * Math.pow(f, 0.62));
    let shockGrad = ctx.createRadialGradient(h.x, h.y, v * 0.25, h.x, h.y, v);
    shockGrad.addColorStop(0, "rgba(254, 240, 138, 0)");
    shockGrad.addColorStop(0.65, isMono ? "rgba(0,0,0,0.18)" : "rgba(239, 68, 68, 0.24)");
    shockGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = shockGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, v, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color;
    ctx.lineWidth = 10 * alpha + 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, v * 0.74, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 4.5 * alpha + 1;
    ctx.stroke();

    // Radial draconic flame spikes bursting outward
    for (let i = 0; i < 8; i++) {
      let ang = (Math.PI * 2 / 8) * i + f * 0.6;
      let ix = h.x + Math.cos(ang) * (v * 0.78);
      let iy = h.y + Math.sin(ang) * (v * 0.78);
      let ox = h.x + Math.cos(ang) * (v * 1.12);
      let oy = h.y + Math.sin(ang) * (v * 1.12);
      ctx.strokeStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#F97316";
      ctx.lineWidth = 3.2 * alpha + 1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ox, oy);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "spear") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    // Directional spear thrust lance-wave + thunder spiral + shock cone
    let reach = h.radius * (0.55 + 0.45 * Math.min(1, f * 1.8));
    drawTaperedArc(ctx, 0, 0, reach * 0.9, -h.spread * 0.42, h.spread * 0.42, 8.5 * alpha + 1.5, h.color, "#FFFFFF", isMono);
    ctx.strokeStyle = isMono ? "#000000" : h.color;
    ctx.lineWidth = 5.5 * alpha + 1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(reach + 12, 0);
    ctx.stroke();
    // Spiral storm helix around thrust shaft
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.2 * alpha + 0.6;
    ctx.beginPath();
    ctx.moveTo(18, -6);
    ctx.bezierCurveTo(reach * 0.4, 9, reach * 0.7, -8, reach + 12, 0);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2 * alpha;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(reach + 14, 0);
    ctx.stroke();
    drawFourPointStar(ctx, reach + 14, 0, 8.5 * alpha, 2.2 * alpha, "#FFFFFF", h.color);
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
    let r = h.radius * (0.24 + 0.76 * Math.pow(f, 0.7));
    let waveGrad = ctx.createRadialGradient(h.x, h.y, r * 0.2, h.x, h.y, r);
    waveGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
    waveGrad.addColorStop(0.65, isMono ? "rgba(0,0,0,0.22)" : `rgba(192, 132, 252, ${0.32 * alpha})`);
    waveGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = waveGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : "#A855F7";
    ctx.lineWidth = 7 * alpha + 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.78, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
    ctx.lineWidth = 3.2 * alpha + 0.8;
    ctx.stroke();

    // Shattered mirror glass fragments flying outward
    for (let i = 0; i < 8; i++) {
      let ang = (Math.PI * 2 / 8) * i + f * 0.9;
      let sx = h.x + Math.cos(ang) * r * 0.92;
      let sy = h.y + Math.sin(ang) * r * 0.92;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ang + f * 3);
      ctx.fillStyle = i % 2 === 0 ? (isMono ? "#FFFFFF" : "#F5D0FE") : (isMono ? "#CCCCCC" : "#38BDF8");
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-4.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  if (h.kind === "nguyen_wave") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let reach = h.radius * (0.35 + 0.65 * Math.pow(f, 0.75));
    let half = (h.spread || Math.PI) * 0.5;
    let waveGrad = ctx.createRadialGradient(0, 0, reach * 0.15, 0, 0, reach);
    waveGrad.addColorStop(0, "rgba(16, 185, 129, 0)");
    waveGrad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.18)" : `rgba(52, 211, 153, ${0.26 * alpha})`);
    waveGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = waveGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, reach, -half, half);
    ctx.closePath();
    ctx.fill();

    drawTaperedArc(ctx, 0, 0, reach, -half, half, 11.5 * alpha + 2, "#10B981", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, reach * 0.72, -half * 0.84, half * 0.84, 6.5 * alpha + 1.2, "#34D399", "#FFFFFF", isMono);
    for (let i = -2; i <= 2; i++) {
      let pa = i * (half * 0.38);
      let pr = reach * (0.72 + f * 0.24);
      ctx.save();
      ctx.translate(Math.cos(pa) * pr, Math.sin(pa) * pr);
      ctx.rotate(pa + f * 2);
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5 * alpha + 1.5, 2.2 * alpha + 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  if (h.kind === "taidu_hex_blast") {
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.62));
    if (!Number.isFinite(h.x) || !Number.isFinite(h.y) || !Number.isFinite(r) || r <= 0) return;
    let mainCol = isMono ? "#000000" : h.color || "#F97316";
    let accentCol = isMono ? "#FFFFFF" : h.accentColor || "#38BDF8";
    let blastGrad = ctx.createRadialGradient(h.x, h.y, r * 0.12, h.x, h.y, r);
    blastGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.6)" : `rgba(254, 240, 138, ${0.55 * alpha})`);
    blastGrad.addColorStop(0.5, isMono ? "rgba(0,0,0,0.3)" : `rgba(249, 115, 22, ${0.34 * alpha})`);
    blastGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = blastGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer hexagonal tech shockwave
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(f * 0.45);
    ctx.strokeStyle = mainCol;
    ctx.lineWidth = 5.5 * alpha + 1.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      let px = Math.cos(a) * r;
      let py = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner ionized targeting ring & radial vector spikes
    ctx.strokeStyle = accentCol;
    ctx.lineWidth = 2.8 * alpha + 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i + Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48);
      ctx.lineTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (h.kind === "nguyen_lotus_boom") {
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.64));
    if (!Number.isFinite(h.x) || !Number.isFinite(h.y) || !Number.isFinite(r) || r <= 0) return;
    let lotusGrad = ctx.createRadialGradient(h.x, h.y, r * 0.12, h.x, h.y, r);
    lotusGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.5)" : `rgba(254, 240, 138, ${0.42 * alpha})`);
    lotusGrad.addColorStop(0.6, isMono ? "rgba(0,0,0,0.22)" : `rgba(16, 185, 129, ${0.28 * alpha})`);
    lotusGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = lotusGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.strokeStyle = isMono ? "#000000" : "#10B981";
    ctx.lineWidth = 6 * alpha + 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.8 * alpha + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(f * 0.8);
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI * 2 / 8) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65, r * 0.16, r * 0.06, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (h.kind === "shield_explode") {
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.65));
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMono ? "#000000" : h.color || "#38BDF8";
    ctx.lineWidth = 7 * alpha + 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 3 * alpha;
    ctx.stroke();
    return;
  }

  if (h.kind === "duy_decoy_boom") {
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.55));
    ctx.save();
    ctx.translate(h.x, h.y);
    let grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    grad.addColorStop(0, "rgba(253, 224, 71, 0.55)");
    grad.addColorStop(0.55, "rgba(244, 63, 94, 0.36)");
    grad.addColorStop(1, "rgba(20, 184, 166, 0)");
    ctx.fillStyle = isMono ? "rgba(0,0,0,0.2)" : grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
    ctx.lineWidth = 6 * alpha + 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#2DD4BF";
    ctx.lineWidth = 3.2 * alpha + 1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // 8 radial shockwave needle flares
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2.4 * alpha;
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i + f * 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
      ctx.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (h.kind === "duy_heal_lotus") {
    let r = h.radius * (0.35 + 0.65 * Math.pow(f, 0.6));
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(f * 1.4);
    ctx.globalAlpha = Math.max(0.1, alpha);
    for (let i = 0; i < 6; i++) {
      let a = (Math.PI / 3) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#34D399" : "#2DD4BF";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.38, r * 0.14, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 2.5 * alpha;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (h.kind === "duy_dash_cut") {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    drawTaperedArc(ctx, 0, 0, h.radius, -1.05, 1.05, 11 * alpha + 2, "#14B8A6", "#FDE047", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.78, 0.85, -0.85, 7 * alpha + 1.4, "#F43F5E", "#FFFFFF", isMono);
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

  // Generic slash / crossed slash (e.g. Tin, Eohyen, Kin C2)
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle);
  drawTaperedArc(ctx, 0, 0, h.radius, -h.spread / 2, h.spread / 2, 10.5 * alpha + 1.5, h.color, "#FFFFFF", isMono);
  drawTaperedArc(ctx, 0, 0, h.radius * 0.78, -h.spread * 0.36, h.spread * 0.36, 5 * alpha + 1, h.color, "#FFFFFF", isMono);
  if (h.crossed) {
    drawTaperedArc(ctx, 0, 0, h.radius * 0.88, h.spread * 0.45, -h.spread * 0.45, 7.5 * alpha + 1.2, h.color, "#FFE4E6", isMono);
  }
}

export function drawCurvedLightning(ctx, l, isMono) {
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

  // Pass 1: Wide outer ionized plasma glow (no shadowBlur)
  ctx.globalAlpha = alpha * 0.28;
  traceJaggedBolt();
  ctx.strokeStyle = isMono ? "#000000" : l.color;
  ctx.lineWidth = w * 3.4;
  ctx.stroke();

  // Pass 2: High-intensity colored electric arc
  ctx.globalAlpha = alpha * 0.92;
  traceJaggedBolt();
  ctx.strokeStyle = isMono ? "#111111" : l.color;
  ctx.lineWidth = w * 1.4;
  ctx.stroke();

  // Pass 3: Razor-hot white plasma filament core
  ctx.globalAlpha = alpha;
  traceJaggedBolt();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.15, w * 0.48);
  ctx.stroke();

  // Electric ionization nodes at jagged bends & strike endpoint
  if (alpha > 0.25 && pts.length >= 3) {
    let tip = pts[pts.length - 1];
    drawFourPointStar(ctx, tip.x, tip.y, (3.2 + w * 1.4) * alpha, 1.3 * alpha, "#FFFFFF", isMono ? "#000000" : l.color);
    ctx.fillStyle = "#FFFFFF";
    for (let i = 1; i < pts.length - 1; i += 2) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, Math.max(1.2, w * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawImpactBurst(ctx, b, isMono) {
  let f = clamp(b.life / b.maxLife, 0, 1);
  let alpha = 1 - f;
  let r = b.radius * (0.35 + 0.65 * Math.pow(f, 0.6));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);

  // Expanding shock ring + inner flash ring
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = isMono ? "#000000" : b.color;
  ctx.lineWidth = (b.isCrit ? 3.5 : 2.3) * alpha + 0.7;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.4 * alpha;
  ctx.stroke();

  // 4 radial velocity needles
  ctx.strokeStyle = isMono ? "#FFFFFF" : b.isCrit ? "#FEF08A" : b.color;
  ctx.lineWidth = 1.6 * alpha;
  for (let i = 0; i < 4; i++) {
    let sa = (Math.PI / 2) * i + 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * r * 0.5, Math.sin(sa) * r * 0.5);
    ctx.lineTo(Math.cos(sa) * r * 1.2, Math.sin(sa) * r * 1.2);
    ctx.stroke();
  }

  // Directional collision flare + sparks (lightweight)
  if (f < 0.72) {
    let starScale = (1 - f / 0.72) * (b.isCrit ? 1.4 : 0.95);
    drawFourPointStar(ctx, 0, 0, 13 * starScale, 2.6 * starScale, isMono ? "#FFFFFF" : "#FEF08A", isMono ? "#000000" : b.color);
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
    walkCyclePhase = 0
  } = opts;

  let hitWhite = hitFlash > 0;
  let fillMain = isMono ? "#000000" : hitWhite ? "#FFFFFF" : color;
  let fillAccent = isMono ? "#333333" : hitWhite ? "#FFFFFF" : accentColor;
  let trimCol = isMono ? "#444444" : borderColor || (isUlt ? "#FBBF24" : isStealth ? "#E879F9" : "#FFFFFF");
  let markCol = isMono ? "#FFFFFF" : hitWhite ? "#0F172A" : fillAccent;
  let darkInk = isMono ? "#111111" : "rgba(10, 16, 30, 0.58)";
  let moveAmt = clamp(moveSpeedFactor || 0, 0, 1);
  let sway = Math.sin(elapsedTime * (5.5 + moveAmt * 4.5) + walkCyclePhase * 0.5);

  ctx.save();
  ctx.rotate(facing);

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
    // Phong — Cyan-blue flowing ninja shadow-scarf + sharp azure shoulder blade fins
    ctx.fillStyle = isMono ? "#111111" : "#075985";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.44, -5);
    ctx.quadraticCurveTo(-radius * 1.25, -14 + sway * 5, -radius * 1.72, -5 + sway * 6);
    ctx.lineTo(-radius * 1.32, 0 + sway * 4);
    ctx.lineTo(-radius * 1.62, 8 + sway * 5);
    ctx.quadraticCurveTo(-radius * 1.05, 10, -radius * 0.44, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : "#0369A1";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(2, s * radius * 0.72);
      ctx.lineTo(-12, s * radius * 1.28);
      ctx.lineTo(-2, s * radius * 0.96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (heroId === "dang") {
    // Đăng — Stark Black & White Tiger-Fist pauldrons with tiger stripes
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#222222" : s < 0 ? "#F8FAFC" : "#18181B";
      ctx.strokeStyle = isMono ? "#FFFFFF" : s < 0 ? "#18181B" : "#F8FAFC";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(6, s * radius * 0.68);
      ctx.lineTo(-3, s * radius * 1.24);
      ctx.lineTo(-11, s * radius * 1.02);
      ctx.lineTo(-6, s * radius * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // 1. Clean circular hero body with rich 3D sphere shading
  let bodyGrad = ctx.createRadialGradient(-radius * 0.28, -radius * 0.28, radius * 0.12, 0, 0, radius);
  if (isMono) {
    bodyGrad.addColorStop(0, "#262626");
    bodyGrad.addColorStop(1, "#000000");
  } else if (hitWhite) {
    bodyGrad.addColorStop(0, "#FFFFFF");
    bodyGrad.addColorStop(1, "#E2E8F0");
  } else {
    bodyGrad.addColorStop(0, fillAccent);
    bodyGrad.addColorStop(0.32, fillMain);
    bodyGrad.addColorStop(1, fillMain);
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Crisp outer ring
  ctx.strokeStyle = trimCol;
  ctx.lineWidth = isUlt ? 3.2 : 2.6;
  ctx.stroke();

  // Subtle dark inner framing ring inside the circle
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = darkInk;
  ctx.lineWidth = 1.6;
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
    // Phong — Deep azure stealth cowl + glowing cyan phantom diamond core
    ctx.fillStyle = isMono ? "#111111" : "#082F49";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.44, 0);
    ctx.lineTo(-radius * 0.08, -radius * 0.46);
    ctx.lineTo(-radius * 0.48, 0);
    ctx.lineTo(-radius * 0.08, radius * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, 6.0, 2.2, "#E0F2FE", isMono ? "#000000" : "#0EA5E9");
  } else if (heroId === "dang") {
    // Đăng — Split Yin-Yang Black & White chest armor with tiger stripes
    ctx.fillStyle = "#09090B";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // Contrasting tiger stripes across split armor
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.36, -radius * 0.42);
    ctx.lineTo(-radius * 0.14, -radius * 0.18);
    ctx.moveTo(0, -radius * 0.48);
    ctx.lineTo(radius * 0.22, -radius * 0.2);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.36, radius * 0.42);
    ctx.lineTo(-radius * 0.14, radius * 0.18);
    ctx.moveTo(0, radius * 0.48);
    ctx.lineTo(radius * 0.22, radius * 0.2);
    ctx.stroke();

    // Small Yin-Yang dot core
    ctx.fillStyle = "#09090B";
    ctx.beginPath();
    ctx.arc(0, -radius * 0.2, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, radius * 0.2, 2.4, 0, Math.PI * 2);
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
  } else if (heroId === "tin" || heroId === "bao" || heroId === "dung" || heroId === "danh" || heroId === "gau" || heroId === "phong" || heroId === "dang") {
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
      : "#FDE68A";
    for (let s of [-1, 1]) {
      ctx.fillStyle = darkInk;
      ctx.beginPath();
      ctx.ellipse(radius * 0.56, s * radius * 0.23, 3.8, 2.5, s * -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.ellipse(radius * 0.58, s * radius * 0.23, 2.7, 1.5, s * -0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (heroId === "taidu") {
    // Cybernetic wraparound tactical HUD visor
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#020617";
    ctx.lineWidth = 5.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.52, -0.58, 0.58);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.52, -0.52, 0.52);
    ctx.stroke();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(radius * 0.68, -3.2, 1.4, 0, Math.PI * 2);
    ctx.arc(radius * 0.68, 3.2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (heroId === "kin" || heroId === "longhoi" || heroId === "eohyen" || heroId === "trung" || heroId === "duccong" || heroId === "luan" || heroId === "nguyen") {
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
      : "#67E8F9";
    for (let s of [-1, 1]) {
      ctx.fillStyle = darkInk;
      ctx.beginPath();
      if (heroId === "luan") {
        ctx.ellipse(radius * 0.56, s * radius * 0.23, 3.8, 2.3, s * -0.28, 0, Math.PI * 2);
      } else {
        ctx.arc(radius * 0.56, s * radius * 0.22, 3.4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      if (heroId === "luan") {
        ctx.ellipse(radius * 0.58, s * radius * 0.23, 2.6, 1.4, s * -0.28, 0, Math.PI * 2);
      } else {
        ctx.arc(radius * 0.58, s * radius * 0.22, 2.2, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  } else {
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.arc(radius * 0.56, -radius * 0.22, 3.2, 0, Math.PI * 2);
    ctx.arc(radius * 0.56, radius * 0.22, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(radius * 0.58, -radius * 0.22, 2.0, 0, Math.PI * 2);
    ctx.arc(radius * 0.58, radius * 0.22, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawMonsterEntity(ctx, enemy, elapsedTime, isMono) {
  let r = enemy.radius || 16;
  let facing = enemy.facing || 0;
  let hit = enemy.hitFlash > 0;
  let wobble = Math.sin((elapsedTime || 0) * 7.5 + (enemy.id || 0)) * 0.07;

  // Ground shadow
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + r * 0.75, r * 0.92, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.45)";
  ctx.fill();

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(facing + wobble);

  if (enemy.kind === "brute") {
    // Đao Phủ — Heavy Iron Executioner with Huge Double-Headed Battle Axe
    // Weapon (right arm forward swing)
    ctx.save();
    ctx.translate(r * 0.25, r * 0.75);
    ctx.rotate(0.25 + Math.sin((elapsedTime || 0) * 4.5 + enemy.id) * 0.14);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(r * 1.15, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#555555" : "#94A3B8";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // Double axe blades
    ctx.fillStyle = hit ? "#FFFFFF" : isMono ? "#222222" : "#CBD5E1";
    ctx.strokeStyle = isMono ? "#000000" : "#EF4444";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(r * 0.65, -r * 0.62);
    ctx.quadraticCurveTo(r * 1.25, -r * 0.3, r * 0.85, 0);
    ctx.quadraticCurveTo(r * 1.25, r * 0.3, r * 0.65, r * 0.62);
    ctx.lineTo(r * 0.55, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Heavy Spiked Shoulder Armor
    for (let s of [-1, 1]) {
      ctx.fillStyle = hit ? "#FFFFFF" : isMono ? "#111111" : "#9A3412";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, s * r * 0.68, r * 0.55, r * 0.36, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Core armored body + horned helm
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : enemy.color;
    ctx.fill();
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Iron Horns & glowing amber eyes
    ctx.fillStyle = "#E2E8F0";
    for (let s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.1, s * r * 0.48);
      ctx.lineTo(r * 0.65, s * r * 0.82);
      ctx.lineTo(r * 0.28, s * r * 0.28);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(r * 0.42, -r * 0.28, 4, 3);
    ctx.fillRect(r * 0.42, r * 0.14, 4, 3);
  } else if (enemy.kind === "charger") {
    // Ma Khuyển — Razor Stalker Beast with Twin Scythe-Claws
    // Twin mounted shoulder scythe blades
    for (let s of [-1, 1]) {
      ctx.fillStyle = hit ? "#FFFFFF" : isMono ? "#222222" : "#FDE047";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, s * r * 0.55);
      ctx.quadraticCurveTo(r * 0.95, s * r * 1.15, r * 1.32, s * r * 0.32);
      ctx.quadraticCurveTo(r * 0.65, s * r * 0.62, r * 0.25, s * r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Sleek predatory diamond body
    ctx.beginPath();
    ctx.moveTo(r * 1.12, 0);
    ctx.lineTo(r * 0.15, -r * 0.82);
    ctx.lineTo(-r * 0.95, -r * 0.38);
    ctx.lineTo(-r * 0.72, 0);
    ctx.lineTo(-r * 0.95, r * 0.38);
    ctx.lineTo(r * 0.15, r * 0.82);
    ctx.closePath();
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : enemy.color;
    ctx.fill();
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Glowing predator eyes
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(r * 0.48, -r * 0.24, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.48, r * 0.24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "caster") {
    // Phù Thủy — Arcane Cultist with Glowing Runic Staff
    let staffPulse = 0.8 + 0.25 * Math.sin((elapsedTime || 0) * 8 + enemy.id);
    // Runic Staff held forward
    ctx.save();
    ctx.translate(r * 0.35, r * 0.68);
    ctx.rotate(-0.15);
    ctx.strokeStyle = "#3B0764";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, 0);
    ctx.lineTo(r * 1.05, 0);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.beginPath();
    ctx.arc(r * 1.12, 0, 4.2 * staffPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Cultist Robed Hood
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : "#6B21A8";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#333333" : "#E879F9";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Pointed hood peak + dark cowl shadow + arcane eyes
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(r * 0.24, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F0ABFC";
    ctx.beginPath();
    ctx.arc(r * 0.38, -3.2, 2.1, 0, Math.PI * 2);
    ctx.arc(r * 0.38, 3.2, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "frost_archer") {
    // Xạ Thủ Băng — Ice Recurve Bow + Hooded Marksman
    ctx.save();
    ctx.translate(r * 0.55, 0);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#7DD3FC";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(-r * 0.15, 0, r * 0.85, -1.05, 1.05);
    ctx.stroke();
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-1.05) * r * 0.85 - r * 0.15, Math.sin(-1.05) * r * 0.85);
    ctx.lineTo(-r * 0.05, 0);
    ctx.lineTo(Math.cos(1.05) * r * 0.85 - r * 0.15, Math.sin(1.05) * r * 0.85);
    ctx.stroke();
    // Ice arrow nocked
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, 0);
    ctx.lineTo(r * 0.85, 0);
    ctx.stroke();
    ctx.restore();

    // Frost cloak & hood
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : "#0369A1";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#444444" : "#BAE6FD";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = "#082F49";
    ctx.beginPath();
    ctx.arc(r * 0.25, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7DD3FC";
    ctx.fillRect(r * 0.34, -3.5, 3.2, 2.2);
    ctx.fillRect(r * 0.34, 1.3, 3.2, 2.2);
  } else if (enemy.kind === "bomber") {
    // Quái Bom Cảm Tử — Unstable Volatile Bomb Carrier
    let priming = (enemy.fuseTimer || 0) > 0;
    let pulse = priming ? 0.82 + 0.35 * Math.sin((elapsedTime || 0) * 26) : 0.92 + 0.1 * Math.sin((elapsedTime || 0) * 7 + enemy.id);
    if (priming) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : priming ? "#DC2626" : "#3F3F46";
    ctx.fill();
    ctx.strokeStyle = priming ? "#FEF08A" : "#F97316";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Glowing volatile bomb core on back/center
    ctx.beginPath();
    ctx.arc(-r * 0.1, 0, r * 0.48 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = priming ? "#FEF08A" : "#F97316";
    ctx.fill();
    // Fuse spark
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.4);
    ctx.quadraticCurveTo(-r * 0.85, -r * 0.9, -r * 0.55, -r * 1.15);
    ctx.stroke();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.55, -r * 1.15, 3.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    // Crazy eyes
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(r * 0.46, -r * 0.24, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.46, r * 0.24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "assassin") {
    // Sát Thủ Bóng Đêm — Twin Shadow Blades & Sleek Cowl
    for (let s of [-1, 1]) {
      ctx.fillStyle = hit ? "#FFFFFF" : isMono ? "#222222" : "#F43F5E";
      ctx.strokeStyle = "#FDF2F8";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.25, s * r * 0.48);
      ctx.lineTo(r * 1.35, s * r * 0.72);
      ctx.lineTo(r * 0.65, s * r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(r * 1.05, 0);
    ctx.lineTo(0, -r * 0.78);
    ctx.lineTo(-r * 0.9, -r * 0.35);
    ctx.lineTo(-r * 0.9, r * 0.35);
    ctx.lineTo(0, r * 0.78);
    ctx.closePath();
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : "#311042";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#555555" : "#C084FC";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#FB7185";
    ctx.fillRect(r * 0.36, -3.5, 4, 2);
    ctx.fillRect(r * 0.36, 1.5, 4, 2);
  } else if (enemy.kind === "shield_knight") {
    // Khiên Binh Phản Chấn — Heavy Tower Shield + War Mace
    // War mace on right side
    ctx.save();
    ctx.translate(r * 0.25, r * 0.78);
    ctx.strokeStyle = "#64748B";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(r * 0.85, 0);
    ctx.stroke();
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.arc(r * 0.9, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Armored body
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : "#334155";
    ctx.fill();
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // Large Curved Tower Shield held in front
    ctx.fillStyle = isMono ? "#222222" : hit ? "#FFFFFF" : "#0EA5E9";
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(r * 0.22, 0, r * 0.95, -0.95, 0.95);
    ctx.lineTo(r * 0.52, Math.sin(0.95) * r * 0.65);
    ctx.arc(r * 0.05, 0, r * 0.68, 0.95, -0.95, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.kind === "void_acolyte") {
    // Tín Đồ Hư Không — Orbiting Runes & Abyssal Robe
    for (let k = 0; k < 3; k++) {
      let a = (elapsedTime || 0) * 3.5 + (Math.PI * 2 / 3) * k;
      let rx = Math.cos(a) * (r * 1.25);
      let ry = Math.sin(a) * (r * 1.25);
      ctx.fillStyle = "#38BDF8";
      ctx.beginPath();
      ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : "#1E1B4B";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#555555" : "#818CF8";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = "#A855F7";
    ctx.beginPath();
    ctx.moveTo(r * 0.55, 0);
    ctx.lineTo(0, -r * 0.45);
    ctx.lineTo(-r * 0.45, 0);
    ctx.lineTo(0, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#F0ABFC";
    ctx.beginPath();
    ctx.arc(r * 0.32, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Quái Nhỏ — Armed Goblin Raider with Jagged Cleaver Blade
    // Jagged Cleaver
    ctx.save();
    ctx.translate(r * 0.35, r * 0.68);
    ctx.rotate(0.28);
    ctx.fillStyle = hit ? "#FFFFFF" : isMono ? "#222222" : "#94A3B8";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(r * 0.95, -4);
    ctx.lineTo(r * 1.15, 2.5);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Goblin ears
    for (let s of [-1, 1]) {
      ctx.fillStyle = isMono ? "#111111" : hit ? "#FFFFFF" : "#16A34A";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, s * r * 0.65);
      ctx.lineTo(-r * 0.45, s * r * 1.18);
      ctx.lineTo(r * 0.25, s * r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#FFFFFF" : enemy.color;
    ctx.fill();
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing goblin eyes
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(r * 0.44, -r * 0.25, 2.1, 0, Math.PI * 2);
    ctx.arc(r * 0.44, r * 0.25, 2.1, 0, Math.PI * 2);
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
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(44, 0);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#555555" : "#78716C";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = isMono ? "#222222" : "#44403C";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#10B981";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(30, -22, 22, 44, 5);
    } else {
      const rx = 30, ry = -22, rw = 22, rh = 44, rr = 5;
      ctx.moveTo(rx + rr, ry);
      ctx.lineTo(rx + rw - rr, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
      ctx.lineTo(rx + rw, ry + rh - rr);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
      ctx.lineTo(rx + rr, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
      ctx.lineTo(rx, ry + rr);
      ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : isPhaseBoost ? "#6EE7B7" : "#10B981";
    ctx.beginPath();
    ctx.arc(41, 0, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (wave === 6) {
    // Flame Lord — Molten Magma Greatblade
    ctx.fillStyle = "#1C1917";
    ctx.fillRect(-12, -3, 16, 6);
    ctx.fillStyle = isMono ? "#333333" : "#F59E0B";
    ctx.fillRect(2, -14, 7, 28);

    let bGrad = ctx.createLinearGradient(8, 0, 78, 0);
    bGrad.addColorStop(0, isMono ? "#111111" : "#991B1B");
    bGrad.addColorStop(0.55, isMono ? "#666666" : "#EA580C");
    bGrad.addColorStop(1, "#FEF08A");
    ctx.fillStyle = bGrad;
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(54, -9);
    ctx.lineTo(78, 0);
    ctx.lineTo(54, 9);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (wave === 9) {
    // Frost Empress — Glacial Winged Halberd
    ctx.strokeStyle = isMono ? "#444444" : "#E0F2FE";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(52, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#222222" : "#38BDF8";
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(34, -4);
    ctx.quadraticCurveTo(30, -20, 48, -16);
    ctx.lineTo(44, -4);
    ctx.lineTo(76, 0);
    ctx.lineTo(44, 4);
    ctx.lineTo(48, 16);
    ctx.quadraticCurveTo(30, 20, 34, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (wave === 12) {
    // Void Horror — Voidrift Astral Scythe
    ctx.strokeStyle = "#3B0764";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(46, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#111111" : "#9333EA";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E9D5FF";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(42, -3);
    ctx.quadraticCurveTo(68, -2, 62, 34);
    ctx.quadraticCurveTo(48, 12, 34, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(43, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
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
  let recoil = Math.max(0, (turret.muzzleTimer || 0) / 0.12) * 4;

  // Faint cyan laser designator when locked on target
  if (turret.hasTarget && typeof turret.targetX === "number" && typeof turret.targetY === "number") {
    ctx.save();
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.28)" : "rgba(56, 189, 248, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(turret.x, turret.y);
    ctx.lineTo(turret.targetX, turret.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(turret.x, turret.y);

  // Deploy tech ring & lifetime gauge
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.22)" : "rgba(14, 165, 233, 0.14)";
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
  ctx.stroke();

  // Tripod anchor legs
  for (let i = 0; i < 3; i++) {
    let a = (Math.PI * 2 / 3) * i + 0.5;
    ctx.strokeStyle = isMono ? "#444444" : "#334155";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rotating turret gun assembly
  ctx.rotate(turret.angle || 0);
  // Twin plasma barrels with recoil
  ctx.fillStyle = isMono ? "#555555" : "#475569";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 1.6;
  ctx.fillRect(6 - recoil, -8, 22, 5);
  ctx.strokeRect(6 - recoil, -8, 22, 5);
  ctx.fillRect(6 - recoil, 3, 22, 5);
  ctx.strokeRect(6 - recoil, 3, 22, 5);

  if ((turret.muzzleTimer || 0) > 0) {
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(30 - recoil, -5.5, 4.5, 0, Math.PI * 2);
    ctx.arc(30 - recoil, 5.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Armored turret dome
  ctx.fillStyle = isMono ? "#111111" : "#1E293B";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#F97316";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pulsing energy core
  ctx.rotate(spin);
  ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawLuanPortal(ctx, portal, elapsedTime, isMono) {
  let r = portal.radius || 54;
  let fade = Math.min(1, Math.min((portal.life || 0.2) / 0.2, ((portal.maxLife || 9) - (portal.life || 0)) / 0.35));
  let spin = elapsedTime * 2.6;
  let remainRatio = Math.max(0, 1 - (portal.life || 0) / Math.max(0.1, portal.maxLife || 9));

  ctx.save();
  ctx.globalAlpha = Math.max(0.18, fade);
  ctx.translate(portal.x, portal.y);

  // Outer void singularity aura
  let grad = ctx.createRadialGradient(0, 0, 6, 0, 0, r * 1.24);
  grad.addColorStop(0, isMono ? "rgba(0,0,0,0.92)" : "rgba(15, 7, 36, 0.94)");
  grad.addColorStop(0.5, isMono ? "rgba(60,60,60,0.48)" : "rgba(147, 51, 234, 0.52)");
  grad.addColorStop(0.82, isMono ? "rgba(180,180,180,0.32)" : "rgba(56, 189, 248, 0.35)");
  grad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.24, 0, Math.PI * 2);
  ctx.fill();

  // Remaining lifetime gauge arc
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.45)" : "rgba(103, 232, 249, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remainRatio);
  ctx.stroke();

  // Outer rune ring
  ctx.save();
  ctx.rotate(spin);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#C084FC";
  ctx.lineWidth = 2.8;
  ctx.setLineDash([12, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orbiting shattered mirror glass shards
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI * 2 / 6) * i;
    let sx = Math.cos(a) * r;
    let sy = Math.sin(a) * r;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a + spin);
    ctx.fillStyle = i % 2 === 0 ? (isMono ? "#FFFFFF" : "#F5D0FE") : (isMono ? "#CCCCCC" : "#38BDF8");
    ctx.strokeStyle = isMono ? "#000000" : "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8.5);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 8.5);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Counter-rotating inner vortex spiral + mirror crack lines
  ctx.save();
  ctx.rotate(-spin * 1.5);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI * 2 / 3);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#E879F9";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.64, 0, Math.PI * 0.78);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#CCCCCC" : "rgba(186, 230, 253, 0.72)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(r * 0.25, 0);
    ctx.lineTo(r * 0.78, 8);
    ctx.stroke();
  }
  ctx.restore();

  // Dark portal heart with shimmering singularity star
  ctx.fillStyle = "#090418";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  drawFourPointStar(ctx, 0, 0, r * 0.2, r * 0.07, isMono ? "#FFFFFF" : "#F5D0FE", null);

  ctx.restore();
}

export function drawLuanRift(ctx, rift, isMono) {
  let alpha = Math.max(0, 1 - (rift.life || 0) / Math.max(0.1, rift.maxLife || 2.8));
  let dx = rift.x2 - rift.x1;
  let dy = rift.y2 - rift.y1;
  let len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  let offsets = rift.offsets || [-8, 10, -11, 7, -6];

  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
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

  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.65)" : "rgba(124, 58, 237, 0.52)";
  ctx.lineWidth = (rift.width || 10) * 2.1;
  trace(1.15);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#222222" : "#C084FC";
  ctx.lineWidth = rift.width || 10;
  trace(1.0);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.lineWidth = Math.max(2.2, (rift.width || 10) * 0.36);
  trace(0.8);
  ctx.stroke();

  // Anchor rift nodes at endpoints
  ctx.fillStyle = isMono ? "#FFFFFF" : "#F5D0FE";
  ctx.beginPath();
  ctx.arc(rift.x1, rift.y1, 4.2, 0, Math.PI * 2);
  ctx.arc(rift.x2, rift.y2, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawLuanBeam(ctx, beam, isMono) {
  let p = Math.min(1, (beam.life || 0) / Math.max(0.05, beam.maxLife || 0.45));
  let alpha = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) / 0.8);
  let w = (beam.width || 34) * (1.2 - 0.45 * p);
  let dx = beam.x2 - beam.x1;
  let dy = beam.y2 - beam.y1;
  let len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";

  // Outer void aura
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.72)" : (beam.isBranch ? "rgba(56, 189, 248, 0.46)" : "rgba(168, 85, 247, 0.52)");
  ctx.lineWidth = w * 2.05;
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
  ctx.lineWidth = Math.max(3.5, w * 0.38);
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  // High-voltage arcane crackle along the beam
  ctx.strokeStyle = isMono ? "#000000" : "#F5D0FE";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  for (let i = 1; i < 8; i++) {
    let t = i / 8;
    let j = (i % 2 === 0 ? 1 : -1) * w * 0.48 * Math.sin(p * 24 + i * 2.1);
    ctx.lineTo(beam.x1 + dx * t + nx * j, beam.y1 + dy * t + ny * j);
  }
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  // Origin & impact energy rings
  ctx.fillStyle = isMono ? "#FFFFFF" : "#F5D0FE";
  ctx.beginPath();
  ctx.arc(beam.x1, beam.y1, w * 0.48, 0, Math.PI * 2);
  ctx.arc(beam.x2, beam.y2, w * 0.62, 0, Math.PI * 2);
  ctx.fill();

  drawFourPointStar(ctx, beam.x1, beam.y1, w * 0.72, w * 0.2, "#FFFFFF", isMono ? "#000000" : "#38BDF8");
  drawFourPointStar(ctx, beam.x2, beam.y2, w * 0.85, w * 0.24, "#FFFFFF", isMono ? "#000000" : "#E879F9");

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

  let grad = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r);
  grad.addColorStop(0, "rgba(16, 185, 129, 0)");
  grad.addColorStop(0.65, isMono ? "rgba(255,255,255,0.18)" : "rgba(52, 211, 153, 0.25)");
  grad.addColorStop(1, isMono ? "rgba(0,0,0,0.45)" : "rgba(254, 240, 138, 0.42)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMono ? "#000000" : "#10B981";
  ctx.lineWidth = 5 * alpha + 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.lineWidth = 2.5 * alpha + 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  // 6 floating golden-emerald sanctuary petals riding the pulse
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i + p * 1.4;
    ctx.save();
    ctx.translate(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
    ctx.rotate(a);
    ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 * alpha + 2, 3 * alpha + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawTaiDuCarpetStrike(ctx, strike, elapsedTime, isMono) {
  let prog = clamp((strike.timer || 0) / Math.max(0.05, strike.delay || 0.15), 0, 1);
  let r = strike.radius || 95;

  ctx.save();
  ctx.translate(strike.x, strike.y);

  // Target zone fill & pulsing cybernetic lock reticle
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.16)" : `rgba(249, 115, 22, ${0.14 + 0.16 * prog})`;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMono ? "#000000" : "#F97316";
  ctx.lineWidth = 2.4;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Shrinking lock-on countdown ring
  ctx.strokeStyle = isMono ? "#FFFFFF" : strike.isOrbital ? "#FEF08A" : "#38BDF8";
  ctx.lineWidth = strike.isOrbital ? 3.5 : 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(8, r * (1 - prog * 0.85)), 0, Math.PI * 2);
  ctx.stroke();

  // Crosshair reticle
  ctx.strokeStyle = isMono ? "#FFFFFF" : strike.isOrbital ? "#F43F5E" : "#FEF08A";
  ctx.lineWidth = strike.isOrbital ? 2.4 : 1.6;
  let ch = strike.isOrbital ? 28 : 14;
  ctx.beginPath();
  ctx.moveTo(-ch, 0);
  ctx.lineTo(ch, 0);
  ctx.moveTo(0, -ch);
  ctx.lineTo(0, ch);
  ctx.stroke();

  if (strike.isOrbital) {
    // Vertical orbital satellite laser guide beam
    let bw = 6 + prog * 26;
    let bGrad = ctx.createLinearGradient(-bw, 0, bw, 0);
    bGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    bGrad.addColorStop(0.5, isMono ? "rgba(255,255,255,0.55)" : `rgba(56, 189, 248, ${0.22 + prog * 0.45})`);
    bGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = bGrad;
    ctx.fillRect(-bw, -480, bw * 2, 480);
  }

  // Descending aerial missile body right before detonation
  if (prog > 0.25 && !strike.isOrbital) {
    let fallY = -(1 - prog) * 360;
    ctx.save();
    ctx.translate(0, fallY);
    ctx.strokeStyle = isMono ? "#000000" : "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#F97316";
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-6, -8);
    ctx.lineTo(6, -8);
    ctx.closePath();
    ctx.fill();
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
  let grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  grad.addColorStop(0, isMono ? "rgba(255,255,255,0.16)" : "rgba(254, 240, 138, 0.22)");
  grad.addColorStop(0.55, isMono ? "rgba(0,0,0,0.18)" : "rgba(16, 185, 129, 0.20)");
  grad.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Rotating outer sanctuary glyph border
  ctx.save();
  ctx.rotate(elapsedTime * 0.85);
  ctx.strokeStyle = isMono ? "#000000" : "#10B981";
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 6-petal sacred geometry lotus inside field
  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(254, 240, 138, 0.58)";
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.44, Math.sin(a) * r * 0.44, r * 0.34, r * 0.14, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Rising golden-emerald healing motes
  for (let i = 0; i < 8; i++) {
    let phase = (elapsedTime * 0.9 + i * 0.13) % 1;
    let ma = (Math.PI * 2 / 8) * i + elapsedTime * 0.6;
    let mr = r * (0.25 + 0.62 * (i % 3) * 0.33);
    ctx.fillStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FEF08A" : "#6EE7B7";
    ctx.globalAlpha = alpha * (1 - phase);
    ctx.beginPath();
    ctx.arc(Math.cos(ma) * mr, Math.sin(ma) * mr - phase * 22, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawNguyenBastionAura(ctx, x, y, radius, elapsedTime, shieldRatio, isEmergency, isMono) {
  ctx.save();
  ctx.translate(x, y);

  // Hexagonal emerald-gold sanctuary shield dome
  let r = radius + 14;
  ctx.fillStyle = isMono ? "rgba(255,255,255,0.14)" : isEmergency ? "rgba(254, 240, 138, 0.24)" : "rgba(16, 185, 129, 0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(elapsedTime * 1.6);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#34D399";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let a = (Math.PI / 3) * i;
    let px = Math.cos(a) * r;
    let py = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Golden shield capacity arc around the octagon
  if (shieldRatio > 0) {
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, shieldRatio));
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
  ctx.strokeStyle = isMono ? "rgba(255,255,255,0.25)" : urgent ? `rgba(244, 63, 94, ${0.28 + pulse * 0.25})` : "rgba(45, 212, 191, 0.22)";
  ctx.lineWidth = urgent ? 2.2 : 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, blastR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Taunt pulse waves drawing monsters toward decoy
  let tauntWaveR = radius + 16 + ((elapsedTime * 42) % 44);
  ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(250, 204, 21, 0.45)";
  ctx.lineWidth = 2;
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
  let bodyCol = hitFlash > 0 ? "#FFFFFF" : isMono ? "#CBD5E1" : "#D97706";
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
  ctx.fillStyle = hitFlash > 0 ? "#FFFFFF" : isMono ? "#F8FAFC" : "#FDE68A";
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
  let { x, y, facing = 0, radius = 20, life = 0, maxLife = 5.5, attackAnim = 0 } = illusion;
  let remain = Math.max(0, maxLife - life);
  let fade = clamp(remain / 0.65, 0.2, 0.86);
  let pulse = 0.72 + 0.28 * Math.sin(elapsedTime * 11);

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(x, y);

  // Cyan afterimage ring underneath
  ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(34, 211, 238, ${0.55 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Translucent cyan shadow body + twin spectral energy blades
  ctx.rotate(facing);
  let glow = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.15);
  glow.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : "rgba(103, 232, 249, 0.72)");
  glow.addColorStop(0.6, isMono ? "rgba(0,0,0,0.45)" : "rgba(14, 165, 233, 0.52)");
  glow.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isMono ? "#0F172A" : "rgba(14, 165, 233, 0.72)";
  ctx.strokeStyle = isMono ? "#FFFFFF" : "#67E8F9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Spectral twin blades
  let swing = attackAnim > 0 ? Math.sin(attackAnim * 12) * 0.6 : 0;
  for (let side of [-1, 1]) {
    ctx.save();
    ctx.translate(4, side * 11);
    ctx.rotate(side * 0.28 + side * swing);
    ctx.fillStyle = isMono ? "#FFFFFF" : "#67E8F9";
    ctx.beginPath();
    ctx.moveTo(0, -1.8);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Cyan visor eyes
  ctx.fillStyle = "#E0F2FE";
  ctx.beginPath();
  ctx.arc(radius * 0.48, -radius * 0.2, 2.2, 0, Math.PI * 2);
  ctx.arc(radius * 0.48, radius * 0.2, 2.2, 0, Math.PI * 2);
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

  // Glowing emerald trail
  let grad = ctx.createLinearGradient(-22, 0, r, 0);
  grad.addColorStop(0, "rgba(52, 211, 153, 0)");
  grad.addColorStop(1, "rgba(52, 211, 153, 0.85)");
  ctx.fillStyle = isMono ? "rgba(255,255,255,0.6)" : grad;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(0, -r * 0.75);
  ctx.lineTo(0, r * 0.75);
  ctx.closePath();
  ctx.fill();

  // Rotating golden-emerald lotus seed core
  ctx.rotate(elapsedTime * 8);
  ctx.fillStyle = isMono ? "#FFFFFF" : "#34D399";
  ctx.strokeStyle = isMono ? "#000000" : "#FEF08A";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
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
      ctx.fillStyle = hit ? "#FFFFFF" : isMono ? "#1A1A1A" : "#1E293B";
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
    hullGrad.addColorStop(0, hit ? "#FFFFFF" : isMono ? "#333333" : "#475569");
    hullGrad.addColorStop(0.5, hit ? "#FFFFFF" : isMono ? "#1A1A1A" : "#1E293B");
    hullGrad.addColorStop(1, hit ? "#FFFFFF" : isMono ? "#080808" : "#0F172A");

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

    // Inner chamfered chest armor seam
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

    // Spinning Overcharged Chest Reactor Turbine
    ctx.save();
    ctx.translate(0, r * 0.14);
    let coreR = r * (0.36 + windupRatio * 0.08);
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
    ctx.arc(scanX, -r * 0.565, 4.2, 0, Math.PI * 2);
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
    let bodyGrad = ctx.createRadialGradient(0, -r * 0.2, 8, 0, 0, r);
    bodyGrad.addColorStop(0, hit ? "#FFFFFF" : isMono ? "#444444" : "#0284C7");
    bodyGrad.addColorStop(1, hit ? "#FFFFFF" : isMono ? "#090909" : "#082F49");
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = stormBlue;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

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
    drawFourPointStar(ctx, 0, r * 0.16, r * 0.34, r * 0.12, lightningCol, stormBlue);

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

    // Fierce Glowing Eyes
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.22, 4.8, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.22, 4.8, 0, Math.PI * 2);
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

    // 3. Armored Draconic Carapace
    let bodyGrad = ctx.createRadialGradient(0, -r * 0.25, 6, 0, 0, r);
    bodyGrad.addColorStop(0, hit ? "#FFFFFF" : scaleMid);
    bodyGrad.addColorStop(1, hit ? "#FFFFFF" : scaleDark);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = acidCol;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

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
    // Venomous eyes
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.3, 4.8, 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.3, 4.8, 0, Math.PI * 2);
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
    let bodyGrad = ctx.createRadialGradient(0, -r * 0.2, 6, 0, 0, r * 0.94);
    bodyGrad.addColorStop(0, hit ? "#FFFFFF" : isMono ? "#444444" : "#BE123C");
    bodyGrad.addColorStop(1, hit ? "#FFFFFF" : crimsonDark);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = roseRim;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

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

    ctx.fillStyle = "#FEF08A";
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, 4.6, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.25, 4.6, 0, Math.PI * 2);
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
  let bodyGrad = ctx.createRadialGradient(0, -r * 0.2, 6, 0, 0, r);
  bodyGrad.addColorStop(0, hit ? "#FFFFFF" : isMono ? "#333333" : "#312E81");
  bodyGrad.addColorStop(1, hit ? "#FFFFFF" : indigo);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

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
  drawFourPointStar(ctx, 0, r * 0.08, r * 0.2 * eyePulse, r * 0.07, crim, "#FEF08A");

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
  drawFourPointStar(ctx, 0, 0, 8, 2.5, gold, crim);
  ctx.restore();

  // Piercing Seraph Eyes
  ctx.fillStyle = isP3 ? "#EF4444" : "#FEF08A";
  ctx.fillRect(-r * 0.34, -r * 0.32, 9, 4.8);
  ctx.fillRect(r * 0.18, -r * 0.32, 9, 4.8);

  ctx.restore();
}


