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
    // Luminous golden-cyan energy trail under chains
    let trailGrad = ctx.createLinearGradient(-64, 0, 14, 0);
    trailGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    trailGrad.addColorStop(1, isMono ? "rgba(255,255,255,0.5)" : "rgba(253, 224, 71, 0.55)");
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-64, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    let links = 6;
    for (let i = 1; i <= links; i++) {
      let lx = -i * 10.5;
      let ly = Math.sin(elapsedTime * 16 - i * 0.9) * 2.2;
      ctx.strokeStyle = "#1E3A8A";
      ctx.lineWidth = 4.4;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 6.4, 3.6, i % 2 === 0 ? 0.2 : -0.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isMono ? "#FFFFFF" : i % 2 === 0 ? "#FDE047" : "#38BDF8";
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    // Glowing anchor lock ring & barbed spearhead seal
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(2, 0, 8.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.strokeStyle = isMono ? "#000000" : "#1E3A8A";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(3, -8.8);
    ctx.lineTo(7, 0);
    ctx.lineTo(3, 8.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 8, 0, 7.2, 2.4, "#FFFFFF", "#38BDF8");
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
    let spin = elapsedTime * 22;
    let r = h.radius || 16;
    ctx.save();
    ctx.rotate(spin);
    // Outer wind halo
    let g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.4);
    g.addColorStop(0, "rgba(103, 232, 249, 0.55)");
    g.addColorStop(0.65, "rgba(232, 121, 249, 0.25)");
    g.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.fillStyle = isMono ? "#FFFFFF" : i === 0 ? "#67E8F9" : "#22D3EE";
      ctx.strokeStyle = isMono ? "#000000" : "#E879F9";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, -3);
      ctx.quadraticCurveTo(r * 1.15, -8, r * 1.35, 0);
      ctx.quadraticCurveTo(r * 0.72, 4, 2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    drawFourPointStar(ctx, 0, 0, 6.4, 2.2, "#FFFFFF", "#22D3EE");
    ctx.restore();
    return;
  }

  if (h.kind === "bach_dagger") {
    let tg = ctx.createLinearGradient(-44, 0, 14, 0);
    tg.addColorStop(0, "rgba(34, 211, 238, 0)");
    tg.addColorStop(1, isMono ? "rgba(255,255,255,0.65)" : "rgba(232, 121, 249, 0.7)");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-44, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#A5F3FC";
    ctx.strokeStyle = isMono ? "#000000" : "#0891B2";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-4, -5.8);
    ctx.lineTo(1, 0);
    ctx.lineTo(-4, 5.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.kind === "thai_arena_wave") {
    let tg = ctx.createLinearGradient(-50, 0, 18, 0);
    tg.addColorStop(0, "rgba(239, 68, 68, 0)");
    tg.addColorStop(1, "rgba(250, 204, 21, 0.6)");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-48, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#EF4444";
    ctx.strokeStyle = isMono ? "#000000" : "#FDE047";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(6, -24, -14, -22);
    ctx.quadraticCurveTo(2, 0, -14, 22);
    ctx.quadraticCurveTo(6, 24, 22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.kind === "khair_bullet") {
    let tg = ctx.createLinearGradient(-56, 0, 14, 0);
    tg.addColorStop(0, "rgba(56, 189, 248, 0)");
    tg.addColorStop(0.6, "rgba(56, 189, 248, 0.55)");
    tg.addColorStop(1, "#FDE047");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-56, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.strokeStyle = isMono ? "#000000" : "#0284C7";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-2, -4.5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }

  if (h.kind === "khair_c2_sniper") {
    // Colossal Elsu-style Viễn Kích Xuyên Thấu Rail-Cannon Plasma Spear
    let wake = ctx.createLinearGradient(-135, 0, 32, 0);
    wake.addColorStop(0, "rgba(56, 189, 248, 0)");
    wake.addColorStop(0.45, isMono ? "rgba(255,255,255,0.4)" : "rgba(56, 189, 248, 0.65)");
    wake.addColorStop(0.82, isMono ? "rgba(255,255,255,0.8)" : "rgba(250, 204, 21, 0.92)");
    wake.addColorStop(1, "#FFFFFF");
    ctx.strokeStyle = wake;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-135, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();

    // Inner blinding hot core beam
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo(-98, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    // Dual supersonic Mach shock cones around the round
    for (let k of [-1, 1]) {
      ctx.strokeStyle = isMono ? "#FFFFFF" : k === -1 ? "rgba(253, 224, 71, 0.85)" : "rgba(103, 232, 249, 0.8)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(-24, k * 19);
      ctx.moveTo(6, 0);
      ctx.lineTo(-42, k * 25);
      ctx.stroke();
    }

    // Massive golden armored rail-spearhead
    ctx.fillStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.strokeStyle = isMono ? "#000000" : "#0369A1";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(36, 0);
    ctx.lineTo(2, -10.5);
    ctx.lineTo(10, 0);
    ctx.lineTo(2, 10.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawFourPointStar(ctx, 18, 0, 12, 3.8, "#FFFFFF", "#FACC15");
    return;
  }

  if (h.kind === "khair_c3_shell") {
    let tg = ctx.createLinearGradient(-68, 0, 16, 0);
    tg.addColorStop(0, "rgba(249, 115, 22, 0)");
    tg.addColorStop(0.55, "rgba(250, 204, 21, 0.7)");
    tg.addColorStop(1, "#FFFFFF");
    ctx.strokeStyle = tg;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-68, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.strokeStyle = isMono ? "#000000" : "#EF4444";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-4, -8.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-4, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFourPointStar(ctx, 8, 0, 8, 2.8, "#FFFFFF", "#F97316");
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
    let r = h.radius * (0.22 + 0.78 * Math.pow(f, 0.7));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.2, h.x, h.y, r);
    grad.addColorStop(0, "rgba(34, 211, 238, 0)");
    grad.addColorStop(0.68, isMono ? "rgba(255,255,255,0.3)" : `rgba(14, 165, 233, ${0.42 * alpha})`);
    grad.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 6.5 * alpha + 1.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 2.6 * alpha;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // 6 swirling phantom blade streaks radiating out
    for (let bi = 0; bi < 6; bi++) {
      let ba = f * 3.8 + (Math.PI / 3) * bi;
      ctx.strokeStyle = bi % 2 === 0 ? "#67E8F9" : "#0EA5E9";
      ctx.lineWidth = 2.6 * alpha + 0.8;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(ba) * r * 0.32, h.y + Math.sin(ba) * r * 0.32);
      ctx.lineTo(h.x + Math.cos(ba + 0.25) * r * 0.96, h.y + Math.sin(ba + 0.25) * r * 0.96);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "phong_c3_mark") {
    let r = (h.radius || 58) * (0.68 + 0.32 * Math.sin(f * Math.PI));
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(f * 2.2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#22D3EE";
    ctx.lineWidth = 3.4 * alpha + 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#000000" : "#F43F5E";
    ctx.lineWidth = 4.6 * alpha + 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.94, -r * 0.94);
    ctx.lineTo(r * 0.94, r * 0.94);
    ctx.moveTo(-r * 0.94, r * 0.94);
    ctx.lineTo(r * 0.94, -r * 0.94);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      let ka = (Math.PI / 2) * k;
      ctx.fillStyle = k % 2 === 0 ? "#22D3EE" : "#F43F5E";
      ctx.beginPath();
      ctx.moveTo(Math.cos(ka) * r * 1.15, Math.sin(ka) * r * 1.15);
      ctx.lineTo(Math.cos(ka + 0.18) * r * 0.72, Math.sin(ka + 0.18) * r * 0.72);
      ctx.lineTo(Math.cos(ka - 0.18) * r * 0.72, Math.sin(ka - 0.18) * r * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    drawFourPointStar(ctx, 0, 0, 14 * alpha, 3.4 * alpha, "#E0F2FE", "#0EA5E9");
    ctx.restore();
    return;
  }

  if (h.kind === "dang_punch") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let dir = h.dir || 1;
    let reach = 24 + f * (h.radius * 0.84);
    // Triple Tiger-Claw qi shock lines (Black & White alternating)
    for (let ci = -1; ci <= 1; ci++) {
      let yOff = ci * 10 * dir;
      ctx.strokeStyle = ci === 0 ? "#F8FAFC" : "#09090B";
      ctx.lineWidth = (ci === 0 ? 5.2 : 7.2) * alpha + 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(10, yOff * 0.9);
      ctx.quadraticCurveTo(reach * 0.55, yOff * 1.15, reach + (ci === 0 ? 18 : 6), yOff * 0.55);
      ctx.stroke();
    }
    drawTaperedArc(ctx, reach - 4, 0, 24, -1.25, 1.25, 9.5 * alpha + 2, dir > 0 ? "#F8FAFC" : "#18181B", dir > 0 ? "#09090B" : "#F8FAFC", isMono);
    return;
  }

  if (h.kind === "dang_tiger_fist_aoe" || h.kind === "dang_black_shield_boom") {
    let isShield = h.kind === "dang_black_shield_boom";
    let r = h.radius * (0.2 + 0.8 * Math.pow(f, 0.65));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.2, h.x, h.y, r);
    grad.addColorStop(0, "rgba(248, 250, 252, 0)");
    grad.addColorStop(0.65, isMono ? "rgba(0,0,0,0.32)" : `rgba(24, 24, 27, ${0.46 * alpha})`);
    grad.addColorStop(1, "rgba(248, 250, 252, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Yin-Yang Half-Black Half-White kinetic shock ring
    ctx.lineCap = "round";
    ctx.strokeStyle = "#09090B";
    ctx.lineWidth = (isShield ? 10 : 12.5) * alpha + 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = (isShield ? 9 : 11) * alpha + 1.8;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, Math.PI, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 4.2 * alpha + 1;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // Dramatic 4-claw Tiger Raking arcs across the impact center
    for (let i = -1.5; i <= 1.5; i += 1) {
      let off = i * r * 0.2;
      ctx.strokeStyle = Math.abs(i) < 1 ? "#F8FAFC" : "#09090B";
      ctx.lineWidth = (Math.abs(i) < 1 ? 4.8 : 3.6) * alpha + 0.6;
      ctx.beginPath();
      ctx.moveTo(h.x - r * 0.62, h.y + off - r * 0.24);
      ctx.quadraticCurveTo(h.x, h.y + off - r * 0.08, h.x + r * 0.62, h.y + off + r * 0.24);
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
    // Directional spear thrust lance-wave + thunder spiral + Cerberus triple-fang streaks
    let reach = h.radius * (0.55 + 0.45 * Math.min(1, f * 1.8));
    let isCerb = Boolean(h.cerberus);
    let isEmp = Boolean(h.empowered);
    drawTaperedArc(ctx, 0, 0, reach * 0.92, -h.spread * 0.44, h.spread * 0.44, (isCerb ? 11.5 : 8.8) * alpha + 1.5, h.color, isCerb ? "#FEF08A" : "#FFFFFF", isMono);
    if (isCerb || isEmp) {
      // Triple phantom hound fang-lances fanning along spear thrust
      let fanCols = isCerb ? ["#38BDF8", "#FDE047", "#F43F5E"] : ["#38BDF8", "#FEF08A", "#67E8F9"];
      for (let idx = -1; idx <= 1; idx++) {
        let offA = idx * 0.24;
        let len = idx === 0 ? reach + 20 : reach * 0.88;
        ctx.save();
        ctx.rotate(offA);
        ctx.strokeStyle = isMono ? "#000000" : fanCols[idx + 1];
        ctx.lineWidth = (idx === 0 ? 6.5 : 4.2) * alpha + 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.8 * alpha;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(len + 2, 0);
        ctx.stroke();
        ctx.restore();
      }
      drawFourPointStar(ctx, reach + 18, 0, (isCerb ? 13 : 10) * alpha, 2.8 * alpha, "#FEF08A", isCerb ? "#F43F5E" : h.color);
    } else {
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
    }
    return;
  }

  if (h.kind === "dung_cerberus_bite") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let r = (h.radius || 68) * (0.52 + 0.48 * Math.pow(f, 0.6));
    let biteGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
    biteGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.48)" : `rgba(253, 224, 71, ${0.42 * alpha})`);
    biteGrad.addColorStop(0.65, isMono ? "rgba(0,0,0,0.22)" : `rgba(56, 189, 248, ${0.26 * alpha})`);
    biteGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = biteGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 3 ferocious Cerberus claw rakes + snapping fang arcs
    let cols = ["#38BDF8", "#FDE047", "#F43F5E"];
    for (let i = -1; i <= 1; i++) {
      let yOff = i * r * 0.25;
      ctx.strokeStyle = isMono ? "#000000" : cols[i + 1];
      ctx.lineWidth = (i === 0 ? 5.6 : 4.2) * alpha + 1.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, yOff - r * 0.28);
      ctx.quadraticCurveTo(0, yOff + r * 0.08, r * 0.78, yOff + r * 0.26);
      ctx.stroke();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.6 * alpha;
      ctx.stroke();
    }
    drawTaperedArc(ctx, 0, 0, r * 0.85, -1.1, 1.1, 7 * alpha + 1.5, h.color || "#FDE047", "#FFFFFF", isMono);
    drawFourPointStar(ctx, 0, 0, 14 * alpha, 3.2 * alpha, "#FFFFFF", "#FDE047");
    return;
  }

  if (h.kind === "dung_c1_charge") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let reach = (h.radius || 175) * (0.4 + 0.6 * Math.min(1, f * 1.5));
    let coneGrad = ctx.createLinearGradient(0, 0, reach, 0);
    coneGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    coneGrad.addColorStop(0.45, isMono ? "rgba(255,255,255,0.38)" : `rgba(56, 189, 248, ${0.42 * alpha})`);
    coneGrad.addColorStop(1, isMono ? "rgba(255,255,255,0.72)" : `rgba(253, 224, 71, ${0.72 * alpha})`);
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(reach, 0);
    ctx.lineTo(0, 28);
    ctx.closePath();
    ctx.fill();

    for (let s of [-1, 0, 1]) {
      ctx.strokeStyle = s === 0 ? "#FFFFFF" : s < 0 ? "#38BDF8" : "#FDE047";
      ctx.lineWidth = (s === 0 ? 4.8 : 3.2) * alpha + 0.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-14, s * 16);
      ctx.lineTo(reach + (s === 0 ? 18 : -10), s * 4);
      ctx.stroke();
    }
    drawFourPointStar(ctx, reach + 10, 0, 13 * alpha, 3 * alpha, "#FEF08A", "#38BDF8");
    return;
  }

  if (h.kind === "dung_c2_awaken") {
    let r = (h.radius || 125) * (0.22 + 0.78 * Math.pow(f, 0.62));
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.18, h.x, h.y, r);
    grad.addColorStop(0, "rgba(254, 240, 138, 0)");
    grad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.32)" : `rgba(249, 115, 22, ${0.38 * alpha})`);
    grad.addColorStop(0.85, isMono ? "rgba(0,0,0,0.28)" : `rgba(244, 63, 94, ${0.32 * alpha})`);
    grad.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#000000" : h.color || "#F59E0B";
    ctx.lineWidth = 8.5 * alpha + 1.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FEF08A";
    ctx.lineWidth = 3.5 * alpha + 0.8;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      let ang = (Math.PI / 4) * i + f * 0.8;
      ctx.strokeStyle = i % 2 === 0 ? "#FEF08A" : "#FB7185";
      ctx.lineWidth = 2.6 * alpha + 0.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(ang) * r * 0.55, h.y + Math.sin(ang) * r * 0.55);
      ctx.lineTo(h.x + Math.cos(ang) * r * 1.12, h.y + Math.sin(ang) * r * 1.12);
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

  if (h.kind === "thanh_snake_fan") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let r = (h.radius || 76) * (0.42 + 0.58 * f);
    let col = h.isEcho ? "#A78BFA" : h.color || "#10B981";
    let rim = h.isEcho ? "#F3E8FF" : "#A7F3D0";
    drawTaperedArc(ctx, 0, 0, r, -0.64, 0.64, 11 * alpha + 1.8, col, rim, isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.74, -0.46, 0.46, 5.5 * alpha + 1, "#FFFFFF", "#FDE047", isMono);
    for (let s of [-0.26, 0, 0.26]) {
      ctx.strokeStyle = isMono ? `rgba(255,255,255,${alpha})` : `rgba(167, 243, 208, ${alpha * 0.9})`;
      ctx.lineWidth = 2.2 * alpha + 0.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(Math.cos(s) * r * 0.3, Math.sin(s) * r * 0.3);
      ctx.lineTo(Math.cos(s) * r * 1.08, Math.sin(s) * r * 1.08);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "thanh_devour_bite") {
    let r = (h.radius || 140) * (0.5 + 0.5 * f);
    ctx.strokeStyle = isMono ? `rgba(255,255,255,${alpha})` : `rgba(52, 211, 153, ${alpha * 0.95})`;
    ctx.lineWidth = 5.2 * alpha + 1.2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? `rgba(200,200,200,${alpha * 0.75})` : `rgba(168, 85, 247, ${alpha * 0.8})`;
    ctx.lineWidth = 3.0 * alpha;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let k = 0; k < 6; k++) {
      let a = (Math.PI / 3) * k + f * 0.5;
      ctx.fillStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(a) * r * 0.85, h.y + Math.sin(a) * r * 0.85);
      ctx.lineTo(h.x + Math.cos(a + 0.08) * r * 1.06, h.y + Math.sin(a + 0.08) * r * 1.06);
      ctx.lineTo(h.x + Math.cos(a - 0.08) * r * 1.06, h.y + Math.sin(a - 0.08) * r * 1.06);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (h.kind === "thanh_shield_pulse") {
    let r = (h.radius || 64) * (0.45 + 0.55 * f);
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.22, h.x, h.y, r);
    grad.addColorStop(0, "rgba(167, 243, 208, 0)");
    grad.addColorStop(0.68, isMono ? `rgba(255,255,255,${alpha * 0.45})` : `rgba(16, 185, 129, ${alpha * 0.58})`);
    grad.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(167, 139, 250, ${alpha * 0.85})`;
    ctx.lineWidth = 2.6 * alpha;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (h.kind === "nhi_flask_boom" || h.kind === "nhi_mist_pulse") {
    let r = (h.radius || 96) * (0.35 + 0.65 * Math.min(1, f * 1.25));
    let isMist = h.kind === "nhi_mist_pulse";
    let baseCol = h.color || (isMist ? "#4ADE80" : "#C084FC");
    let grad = ctx.createRadialGradient(h.x, h.y, r * 0.12, h.x, h.y, r);
    grad.addColorStop(0, isMono ? `rgba(255,255,255,${alpha * 0.48})` : isMist ? `rgba(74, 222, 128, ${alpha * 0.48})` : `rgba(192, 132, 252, ${alpha * 0.54})`);
    grad.addColorStop(0.65, isMono ? `rgba(200,200,200,${alpha * 0.25})` : `rgba(34, 197, 94, ${alpha * 0.32})`);
    grad.addColorStop(1, "rgba(34, 197, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? `rgba(255,255,255,${alpha * 0.85})` : baseCol;
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = 2.8 * alpha + 0.9;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    // Shattered glass / alchemical droplet rays
    for (let k = 0; k < 6; k++) {
      let a = (Math.PI / 3) * k + 0.25;
      ctx.strokeStyle = isMono ? "#FFFFFF" : k % 2 === 0 ? "#E879F9" : "#4ADE80";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(a) * r * 0.42, h.y + Math.sin(a) * r * 0.42);
      ctx.lineTo(h.x + Math.cos(a) * r * 0.96, h.y + Math.sin(a) * r * 0.96);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "nhi_ult_shock") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let r = (h.radius || 82) * (0.38 + 0.62 * f);
    let grad = ctx.createRadialGradient(0, 0, r * 0.16, 0, 0, r);
    grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.72})`);
    grad.addColorStop(0.55, isMono ? `rgba(220,220,220,${alpha * 0.45})` : `rgba(217, 70, 239, ${alpha * 0.54})`);
    grad.addColorStop(1, "rgba(34, 197, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(74, 222, 128, ${alpha * 0.9})`;
    ctx.lineWidth = 3 * alpha + 1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    drawFourPointStar(ctx, 0, 0, r * 0.74 * alpha, r * 0.18 * alpha, "#E879F9", "#4ADE80");
    return;
  }

  if (h.kind === "minh_seal_boom") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 185) * (0.32 + 0.68 * f);
    let g = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    g.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.78})`);
    g.addColorStop(0.42, `rgba(250, 204, 21, ${alpha * 0.5})`);
    g.addColorStop(0.82, `rgba(56, 189, 248, ${alpha * 0.28})`);
    g.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(253, 224, 71, ${alpha})`;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isMono ? "#E5E5E5" : `rgba(56, 189, 248, ${alpha * 0.9})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    // 8-point double celestial star burst
    drawFourPointStar(ctx, 0, 0, r * 0.68 * alpha, r * 0.15 * alpha, "#FEF08A", "#FFFFFF");
    ctx.rotate(Math.PI / 4);
    drawFourPointStar(ctx, 0, 0, r * 0.52 * alpha, r * 0.12 * alpha, "#38BDF8", "#FFFFFF");
    return;
  }

  if (h.kind === "minh_chain_rect") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let len = h.length || h.radius || 460;
    let hw = h.halfWidth || 110;
    let sweep = Math.min(1, f * 2.1);

    let bgGrad = ctx.createLinearGradient(0, 0, len, 0);
    bgGrad.addColorStop(0, isMono ? `rgba(255, 255, 255, ${alpha * 0.08})` : `rgba(56, 189, 248, ${alpha * 0.12})`);
    bgGrad.addColorStop(0.55, isMono ? `rgba(229, 229, 229, ${alpha * 0.24})` : `rgba(250, 204, 21, ${alpha * 0.22})`);
    bgGrad.addColorStop(1, isMono ? `rgba(255, 255, 255, ${alpha * 0.04})` : `rgba(56, 189, 248, ${alpha * 0.05})`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, -hw, len * sweep, hw * 2);

    ctx.strokeStyle = isMono ? `rgba(255, 255, 255, ${alpha * 0.85})` : `rgba(253, 224, 71, ${alpha * 0.85})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, -hw, len, hw * 2);

    ctx.strokeStyle = isMono ? `rgba(229, 229, 229, ${alpha * 0.55})` : `rgba(56, 189, 248, ${alpha * 0.65})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    for (let i = -2; i <= 2; i++) {
      let ly = (i / 2) * (hw * 0.8);
      ctx.beginPath();
      ctx.moveTo(16, ly);
      ctx.lineTo(len * sweep, ly);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    let barX = len * sweep;
    ctx.strokeStyle = isMono ? `rgba(255, 255, 255, ${alpha})` : `rgba(254, 240, 138, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(barX, -hw);
    ctx.lineTo(barX, hw);
    ctx.stroke();
    return;
  }

  if (h.kind === "ducanh_fortress_boom" || h.kind === "ducanh_meteor_boom") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 175) * (0.3 + 0.7 * f);
    let isMeteor = h.kind === "ducanh_meteor_boom";
    let g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.72})`);
    g.addColorStop(0.55, isMeteor ? `rgba(249, 115, 22, ${alpha * 0.52})` : `rgba(96, 165, 250, ${alpha * 0.45})`);
    g.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : isMeteor ? `rgba(249, 115, 22, ${alpha})` : `rgba(147, 197, 253, ${alpha})`;
    ctx.lineWidth = isMeteor ? 5.6 : 4.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    if (!isMeteor) {
      // Hexagonal bastion shield shatter ring
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(74, 222, 128, ${alpha * 0.85})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let a = (Math.PI / 3) * i + f * 0.4;
        let px = Math.cos(a) * r * 0.78;
        let py = Math.sin(a) * r * 0.78;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    for (let k = 0; k < 8; k++) {
      let a = (Math.PI / 4) * k + (isMeteor ? 0.2 : 0);
      ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(251, 191, 36, ${alpha * 0.92})`;
      ctx.lineWidth = isMeteor ? 3.2 : 2.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36);
      ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
      ctx.stroke();
    }
    return;
  }

  if (h.kind === "bach_cross_slash") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    drawTaperedArc(ctx, 0, 0, h.radius, -h.spread * 0.55, h.spread * 0.55, 11 * alpha + 1.8, h.color || "#22D3EE", "#FFFFFF", isMono);
    drawTaperedArc(ctx, 0, 0, h.radius * 0.85, h.spread * 0.52, -h.spread * 0.52, 8.5 * alpha + 1.5, "#E879F9", "#A5F3FC", isMono);
    drawFourPointStar(ctx, Math.cos(0) * h.radius * 0.65, 0, (1 - f) * 11 + 3, 2.5, "#FFFFFF", "#22D3EE");
    return;
  }

  if (h.kind === "thai_arena_cleave") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    let r = h.radius * (0.76 + 0.24 * f);
    drawTaperedArc(ctx, 0, 0, r, -h.spread * 0.52, h.spread * 0.52, 16 * alpha + 2.5, "#EF4444", "#FDE047", isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.78, -h.spread * 0.42, h.spread * 0.42, 8 * alpha + 1.5, "#FACC15", "#FFFFFF", isMono);
    if (h.empowered) {
      for (let i = -2; i <= 2; i++) {
        let a = i * 0.22;
        ctx.strokeStyle = `rgba(253, 224, 71, ${alpha * 0.9})`;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
        ctx.lineTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08);
        ctx.stroke();
      }
    }
    return;
  }

  if (h.kind === "thai_cyclone_ring") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 170) * (0.45 + 0.55 * f);
    let g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    g.addColorStop(0, "rgba(254, 240, 138, 0)");
    g.addColorStop(0.65, `rgba(239, 68, 68, ${alpha * 0.38})`);
    g.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(f * 6.5);
    drawTaperedArc(ctx, 0, 0, r * 0.92, 0, Math.PI * 1.35, 13 * alpha + 2, "#F59E0B", "#FEF08A", isMono);
    drawTaperedArc(ctx, 0, 0, r * 0.86, Math.PI, Math.PI * 2.35, 10 * alpha + 1.5, "#EF4444", "#FFFFFF", isMono);
    return;
  }

  if (h.kind === "khair_sniper_muzzle") {
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle || 0);
    let r = (h.radius || 75) * (0.4 + 0.6 * f);
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(250, 204, 21, ${alpha})`;
    ctx.lineWidth = 4.2 * alpha + 1.2;
    ctx.beginPath();
    ctx.ellipse(10, 0, r * 0.24, r * 0.58, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.72})`;
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(r * 1.25, 0);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    drawFourPointStar(ctx, 12, 0, r * 0.42, 3, "#FFFFFF", "#FACC15");
    return;
  }

  if (h.kind === "khair_recoil_blast") {
    ctx.translate(h.x, h.y);
    let r = (h.radius || 140) * (0.3 + 0.7 * f);
    let g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.78})`);
    g.addColorStop(0.55, `rgba(249, 115, 22, ${alpha * 0.52})`);
    g.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(250, 204, 21, ${alpha})`;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i + f * 0.5;
      ctx.strokeStyle = `rgba(103, 232, 249, ${alpha * 0.9})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
      ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
      ctx.stroke();
    }
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

  // Pass 1: Subtle outer atmospheric ionization sheath (anti-glare, zero shadowBlur)
  ctx.globalAlpha = alpha * 0.22;
  traceJaggedBolt();
  ctx.strokeStyle = isMono ? "#000000" : l.color;
  ctx.lineWidth = w * 3.8;
  ctx.stroke();

  // Pass 2: Saturated electric plasma body
  ctx.globalAlpha = alpha * 0.9;
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
    drawFourPointStar(ctx, tip.x, tip.y, (3.4 + w * 1.4) * alpha, 1.3 * alpha, "#FFFFFF", isMono ? "#000000" : l.color);
  }

  ctx.restore();
}

export function drawImpactBurst(ctx, b, isMono) {
  let f = clamp(b.life / b.maxLife, 0, 1);
  let alpha = (1 - f) * 0.78;
  let r = b.radius * (0.35 + 0.65 * Math.pow(f, 0.6));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);

  // Expanding shock ring + soft inner ring
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = isMono ? "#CBD5E1" : b.color;
  ctx.lineWidth = (b.isCrit ? 3.2 : 2.1) * alpha + 0.6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(226, 232, 240, 0.55)";
  ctx.lineWidth = 1.25 * alpha;
  ctx.stroke();

  // 4 radial velocity needles
  ctx.strokeStyle = isMono ? "#E2E8F0" : b.isCrit ? "#FDE047" : b.color;
  ctx.lineWidth = 1.5 * alpha;
  for (let i = 0; i < 4; i++) {
    let sa = (Math.PI / 2) * i + 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * r * 0.5, Math.sin(sa) * r * 0.5);
    ctx.lineTo(Math.cos(sa) * r * 1.2, Math.sin(sa) * r * 1.2);
    ctx.stroke();
  }

  // Directional collision flare + soft crit slash
  if (f < 0.72) {
    let starScale = (1 - f / 0.72) * (b.isCrit ? 1.32 : 0.9);
    drawFourPointStar(ctx, 0, 0, 12 * starScale, 2.4 * starScale, isMono ? "#E2E8F0" : "#FDE68A", isMono ? "#0F172A" : b.color);
    if (b.isCrit) {
      ctx.strokeStyle = "rgba(254, 240, 138, 0.72)";
      ctx.lineWidth = 2.0 * (1 - f);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-r * 1.25, -r * 0.6);
      ctx.lineTo(r * 1.25, r * 0.6);
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
  let atkProg = attackAnimTimer > 0 ? clamp(1 - attackAnimTimer / Math.max(0.06, weaponAttackDuration || 0.22), 0, 1) : 0;
  let atkLunge = atkProg > 0 ? Math.sin(atkProg * Math.PI) * 3.8 : 0;
  let skillProg = weaponSkillTimer > 0 ? clamp(1 - weaponSkillTimer / Math.max(0.08, weaponSkillDur || 0.46), 0, 1) : 0;
  let skillFlare = skillProg > 0 ? Math.sin(skillProg * Math.PI) : 0;
  let stride = moveAmt > 0.08 ? Math.sin(walkCyclePhase || elapsedTime * 11) * moveAmt : 0;

  ctx.save();
  ctx.rotate(facing);
  if (atkLunge > 0.05) {
    ctx.translate(atkLunge, 0);
  }
  if (hitWhite) {
    ctx.scale(0.92, 1.07);
  } else if (isDowned) {
    ctx.scale(1.12, 0.82);
  } else if (skillFlare > 0.05) {
    ctx.scale(1 + skillFlare * 0.07, 1 + skillFlare * 0.07);
  }

  // Foot stride pads when walking cleanly underneath cloak/armor
  if (!isDowned && moveAmt > 0.08) {
    for (let s of [-1, 1]) {
      let footX = stride * s * 6.5;
      let footY = s * (radius * 0.48);
      ctx.fillStyle = isMono ? "#111111" : "#0F172A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : fillAccent;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(footX, footY, 4.4, 2.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (skillFlare > 0.15) {
    ctx.strokeStyle = isMono ? "#FFFFFF" : fillAccent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1.18 + skillFlare * 0.24), -0.9, 0.9);
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
      ctx.ellipse(radius * 0.56, s * radius * 0.23, 3.8, 2.5, s * -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = eyeCol;
      ctx.beginPath();
      ctx.ellipse(radius * 0.58, s * radius * 0.23, 2.7, 1.5, s * -0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (heroId === "khair") {
    // Left sharp marksman eye + Right Golden Eagle-Eye Sniper Rangefinder Monocle
    ctx.fillStyle = darkInk;
    ctx.beginPath();
    ctx.ellipse(radius * 0.56, -radius * 0.23, 3.6, 2.2, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.beginPath();
    ctx.ellipse(radius * 0.58, -radius * 0.23, 2.4, 1.3, 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.1;
    ctx.fillStyle = isMono ? "#222222" : "#0F172A";
    ctx.beginPath();
    ctx.arc(radius * 0.56, radius * 0.23, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = khairAiming ? "#FEF08A" : "#38BDF8";
    ctx.beginPath();
    ctx.arc(radius * 0.57, radius * 0.23, 2.0, 0, Math.PI * 2);
    ctx.fill();
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

  // Ground shadow
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + r * 0.75, r * (0.92 + idleBreath), r * 0.42, 0, 0, Math.PI * 2);
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.45)";
  ctx.fill();

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
      ctx.beginPath();
      ctx.ellipse(stride * s * (r * 0.34), s * r * 0.56, r * 0.22, r * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (enemy.kind === "brute") {
    // Đao Phủ — Heavy Iron Executioner with Huge Double-Headed Battle Axe
    // Weapon (right arm forward swing)
    ctx.save();
    ctx.translate(r * 0.25, r * 0.75);
    ctx.rotate(0.25 + Math.sin((elapsedTime || 0) * 4.5 + enemy.id) * 0.14 - atkSwing * 1.15);
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
    ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#CBD5E1";
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
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#111111" : "#9A3412";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : enemy.color;
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
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#FDE047";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : enemy.color;
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
    ctx.fillStyle = isMono ? "#CBD5E1" : "#E879F9";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#6B21A8";
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
    ctx.strokeStyle = isMono ? "#CBD5E1" : "#7DD3FC";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#0369A1";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : priming ? "#DC2626" : "#3F3F46";
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
      ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#F43F5E";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#311042";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#334155";
    ctx.fill();
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // Large Curved Tower Shield held in front
    ctx.fillStyle = isMono ? "#222222" : hit ? "#CBD5E1" : "#0EA5E9";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#1E1B4B";
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
  } else if (enemy.kind === "root_woodfolk") {
    // Cây Sống Bị Ám — Gnarled Bark Husk with Twisting Antler Branches & Emerald Sap Eyes
    ctx.strokeStyle = isMono ? "#333333" : "#14532D";
    ctx.lineWidth = 3.2;
    for (let s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, s * r * 0.55);
      ctx.quadraticCurveTo(r * 0.45, s * r * 1.15, r * 0.95, s * r * 0.92);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#29201B";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#444444" : "#34D399";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.arc(r * 0.44, -r * 0.25, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.44, r * 0.25, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "faceless_wraith") {
    // Bóng Ma Không Mặt — Drifting Pale Violet Shroud & Smooth Blank Mask
    ctx.beginPath();
    ctx.moveTo(r * 0.95, 0);
    ctx.lineTo(0, -r * 0.85);
    ctx.lineTo(-r * 1.05, -r * 0.42);
    ctx.lineTo(-r * 0.85, 0);
    ctx.lineTo(-r * 1.05, r * 0.42);
    ctx.lineTo(0, r * 0.85);
    ctx.closePath();
    ctx.fillStyle = isMono ? "#111111" : hit ? "#F8FAFC" : "#3B0764";
    ctx.fill();
    ctx.strokeStyle = isMono ? "#666666" : "#C084FC";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Blank faceless oval mask
    ctx.fillStyle = isMono ? "#CBD5E1" : "#E2E8F0";
    ctx.beginPath();
    ctx.ellipse(r * 0.28, 0, r * 0.36, r * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === "root_burrower") {
    // Sinh Vật Ẩn Nấp Dưới Rễ — Spiked Subterranean Burrower (renders quivering dirt mound if burrowed)
    if (enemy.burrowed) {
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
      ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#1B2E26";
      ctx.fill();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const a = -0.6 + k * 0.4;
        ctx.fillStyle = "#A3E635";
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
        ctx.lineTo(Math.cos(a + 0.16) * r * 0.7, Math.sin(a + 0.16) * r * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (enemy.kind === "hero_mimic") {
    // Rối Hóa Hình Nhân Vật — Twisted Wood-Stitched Hero Mimic with Puppet Strings
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#4A1D2C";
    ctx.fill();
    ctx.strokeStyle = "#F472B6";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = "#FDE047";
    ctx.beginPath();
    ctx.arc(r * 0.42, -r * 0.22, 2.3, 0, Math.PI * 2);
    ctx.arc(r * 0.42, r * 0.22, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F472B6";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(r * 0.25, 0, r * 0.35, -0.7, 0.7);
    ctx.stroke();
  } else if (enemy.kind === "fog_stalker") {
    // Kẻ Săn Trong Sương — Sleek Indigo-Teal Ambush Predator
    ctx.beginPath();
    ctx.moveTo(r * 1.15, 0);
    ctx.lineTo(r * 0.1, -r * 0.85);
    ctx.lineTo(-r * 0.95, -r * 0.32);
    ctx.lineTo(-r * 0.95, r * 0.32);
    ctx.lineTo(r * 0.1, r * 0.85);
    ctx.closePath();
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : "#0F2A36";
    ctx.fill();
    ctx.strokeStyle = "#2DD4BF";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#5EEAD4";
    ctx.fillRect(r * 0.38, -3.5, 4.5, 2.2);
    ctx.fillRect(r * 0.38, 1.3, 4.5, 2.2);
  } else {
    // Quái Nhỏ — Armed Goblin Raider with Jagged Cleaver Blade
    // Jagged Cleaver
    ctx.save();
    ctx.translate(r * 0.35, r * 0.68);
    ctx.rotate(0.28);
    ctx.fillStyle = hit ? "#CBD5E1" : isMono ? "#222222" : "#94A3B8";
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
      ctx.fillStyle = isMono ? "#111111" : hit ? "#CBD5E1" : "#16A34A";
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
    ctx.fillStyle = isMono ? "#000000" : hit ? "#CBD5E1" : enemy.color;
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
    bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#444444" : "#0284C7");
    bodyGrad.addColorStop(1, hit ? "#CBD5E1" : isMono ? "#090909" : "#082F49");
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
    bodyGrad.addColorStop(0, hit ? "#CBD5E1" : scaleMid);
    bodyGrad.addColorStop(1, hit ? "#CBD5E1" : scaleDark);
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
    bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#444444" : "#BE123C");
    bodyGrad.addColorStop(1, hit ? "#CBD5E1" : crimsonDark);
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
  bodyGrad.addColorStop(0, hit ? "#CBD5E1" : isMono ? "#333333" : "#312E81");
  bodyGrad.addColorStop(1, hit ? "#CBD5E1" : indigo);
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

// =====================================================================
// THIÊN – ĐẤNG SÁNG THẾ CELESTIAL VFX RENDERERS (ZERO shadowBlur)
// =====================================================================

export function drawThienSwords(ctx, swords, elapsedTime, isMono) {
  if (!Array.isArray(swords) || swords.length === 0) return;
  for (let sw of swords) {
    if (!sw) continue;
    ctx.save();
    // Luminous flight trail
    if (Array.isArray(sw.trail) && sw.trail.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < sw.trail.length; i++) {
        let pt = sw.trail[i];
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = isMono ? "rgba(255,255,255,0.5)" : sw.phase === "return" ? "rgba(250,204,21,0.55)" : "rgba(56,189,248,0.55)";
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    ctx.translate(sw.x, sw.y);
    ctx.rotate(sw.angle || 0);

    let auraGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    auraGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.8)" : "rgba(250,204,21,0.65)");
    auraGrad.addColorStop(0.55, isMono ? "rgba(255,255,255,0.25)" : "rgba(56,189,248,0.38)");
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Sword silhouette
    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-4, -4.5);
    ctx.lineTo(14, -2.5);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 2.5);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cosmic core rib
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(19, 0);
    ctx.stroke();

    ctx.fillStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.beginPath();
    ctx.arc(-5, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
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
    grad.addColorStop(0, isMono ? "rgba(255,255,255,0.16)" : `rgba(56, 189, 248, ${0.14 + storedRatio * 0.18})`);
    grad.addColorStop(0.7, isMono ? "rgba(255,255,255,0.08)" : `rgba(250, 204, 21, ${0.12 + storedRatio * 0.14})`);
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Rotating celestial astrolabe ring
    ctx.save();
    ctx.rotate(elapsedTime * 0.85);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.6;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Inner gold dial ring + 12 clock ticks
    ctx.save();
    ctx.rotate(-elapsedTime * 0.55);
    ctx.strokeStyle = isMono ? "#E5E7EB" : "#FACC15";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      let a = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66);
      ctx.lineTo(Math.cos(a) * r * 0.76, Math.sin(a) * r * 0.76);
      ctx.stroke();
    }
    ctx.restore();

    // Animated clock hands showing stored temporal reversal
    let handA1 = elapsedTime * 2.4;
    let handA2 = -elapsedTime * 1.1;
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handA1) * r * 0.55, Math.sin(handA1) * r * 0.55);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handA2) * r * 0.36, Math.sin(handA2) * r * 0.36);
    ctx.stroke();

    // Remaining duration / charge ring
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * fade);
    ctx.stroke();

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

    let grad = ctx.createRadialGradient(0, 0, 4, 0, 0, r * pulse);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.35, isMono ? "#D4D4D8" : "#38BDF8");
    grad.addColorStop(0.75, isMono ? "#52525B" : "rgba(250, 204, 21, 0.45)");
    grad.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(elapsedTime * 3.1);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.rotate(-elapsedTime * 4.2);
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let a = (Math.PI * 0.5) * i;
      ctx.arc(0, 0, r * 0.52, a, a + 0.72);
    }
    ctx.stroke();
    ctx.restore();

    drawFourPointStar(ctx, 0, 0, 12, 3.6, "#FFFFFF", isMono ? "#FFFFFF" : "#38BDF8");
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
    groundGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.65)" : `rgba(255, 255, 255, ${0.55 * lifeRatio})`);
    groundGrad.addColorStop(0.35, isMono ? "rgba(255,255,255,0.35)" : `rgba(250, 204, 21, ${0.42 * lifeRatio})`);
    groundGrad.addColorStop(0.75, isMono ? "rgba(255,255,255,0.18)" : `rgba(56, 189, 248, ${0.24 * lifeRatio})`);
    groundGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Expanding shockwave rings
    ctx.strokeStyle = isMono ? `rgba(255,255,255,${lifeRatio})` : `rgba(250, 204, 21, ${0.9 * lifeRatio})`;
    ctx.lineWidth = 5 * lifeRatio + 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.28 + expand * 0.72), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? `rgba(255,255,255,${lifeRatio * 0.7})` : `rgba(56, 189, 248, ${0.85 * lifeRatio})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.15 + expand * 0.82), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertical orbital beam descending from the Energy Sun
    let beamHalfW = (52 + Math.sin(elapsedTime * 28) * 6) * lifeRatio;
    if (beamHalfW > 2) {
      let beamGrad = ctx.createLinearGradient(-beamHalfW, 0, beamHalfW, 0);
      beamGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
      beamGrad.addColorStop(0.25, isMono ? "rgba(255,255,255,0.55)" : "rgba(56, 189, 248, 0.55)");
      beamGrad.addColorStop(0.5, "#FFFFFF");
      beamGrad.addColorStop(0.75, isMono ? "rgba(255,255,255,0.55)" : "rgba(250, 204, 21, 0.65)");
      beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(-beamHalfW, -320, beamHalfW * 2, 320);

      // Hovering Energy Sun Orb above impact
      let sunY = -170 - (1 - lifeRatio) * 35;
      let sunR = 46 * (0.65 + lifeRatio * 0.5);
      let sunGrad = ctx.createRadialGradient(0, sunY, 4, 0, sunY, sunR * 1.45);
      sunGrad.addColorStop(0, "#FFFFFF");
      sunGrad.addColorStop(0.45, "#FDE047");
      sunGrad.addColorStop(0.8, "#F59E0B");
      sunGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(0, sunY, sunR * 1.45, 0, Math.PI * 2);
      ctx.fill();

      drawFourPointStar(ctx, 0, sunY, sunR * 1.15, sunR * 0.3, "#FFFFFF", "#FACC15");
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
    let glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 19);
    glow.addColorStop(0, accent);
    glow.addColorStop(0.5, isMono ? "rgba(255,255,255,0.3)" : sn.isCompanion ? "rgba(192,132,252,0.44)" : "rgba(52,211,153,0.46)");
    glow.addColorStop(1, "rgba(16,185,129,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Dark ink outline + undulating multi-segment spirit body
    ctx.lineCap = "round";
    ctx.strokeStyle = "#042F2E";
    ctx.lineWidth = sn.isCompanion ? 5.6 : 6.2;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    for (let i = 1; i <= 8; i++) {
      let tx = 5 - i * 3.2;
      let ty = Math.sin(elapsedTime * 15 - i * 1.05 + (sn.idx || 0)) * 3.8 * (1 - i * 0.05);
      ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    ctx.strokeStyle = col;
    ctx.lineWidth = sn.isCompanion ? 3.4 : 4.0;
    ctx.stroke();

    // Inner bright venom spine
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Horned viper head + slit eyes + tongue
    ctx.fillStyle = accent;
    ctx.strokeStyle = "#042F2E";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(11.5, 0);
    ctx.lineTo(-1.5, -5.4);
    ctx.lineTo(-3.5, -3.2);
    ctx.lineTo(1.2, 0);
    ctx.lineTo(-3.5, 3.2);
    ctx.lineTo(-1.5, 5.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(3.2, -1.7, 1.3, 0, Math.PI * 2);
    ctx.arc(3.2, 1.7, 1.3, 0, Math.PI * 2);
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

    // Ground summon magic seal + rotating rune circle
    let sealGrad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    sealGrad.addColorStop(0, isMono ? "rgba(255,255,255,0.48)" : "rgba(16, 185, 129, 0.52)");
    sealGrad.addColorStop(0.62, isMono ? "rgba(200,200,200,0.24)" : "rgba(147, 51, 234, 0.32)");
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
      ctx.quadraticCurveTo(0, s * (48 * jawOpen + 16), 50, s * 7 * jawOpen);
      ctx.lineTo(24, s * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Scale crest trim
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#A78BFA";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-26, s * (16 * jawOpen + 6));
      ctx.quadraticCurveTo(6, s * (32 * jawOpen + 10), 34, s * (10 * jawOpen + 4));
      ctx.stroke();

      // Primary + secondary razor fangs
      ctx.fillStyle = fang;
      for (let fx of [32, 16]) {
        ctx.beginPath();
        ctx.moveTo(fx, s * (17 * jawOpen));
        ctx.lineTo(fx + 7, s * (3.5 * jawOpen));
        ctx.lineTo(fx - 5, s * (12 * jawOpen));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Blazing serpent slit eyes
    ctx.fillStyle = isMono ? "#FFFFFF" : "#A7F3D0";
    ctx.beginPath();
    ctx.ellipse(-10, -16 * jawOpen - 7, 5.5, 3.2, -0.35, 0, Math.PI * 2);
    ctx.ellipse(-10, 16 * jawOpen + 7, 5.5, 3.2, 0.35, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.42)" : "rgba(192, 132, 252, 0.48)";
    ctx.lineWidth = 9.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let s = 1; s <= 12; s++) {
      let t = s / 12;
      let wave = Math.sin(t * Math.PI * 4 - elapsedTime * 11) * 8;
      ctx.lineTo(a.x + dx * t + nx * wave, a.y + dy * t + ny * wave);
    }
    ctx.stroke();

    // Inner bright venom core + counter-phase emerald helix
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#CCCCCC" : "#E879F9";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let s = 1; s <= 12; s++) {
      let t = s / 12;
      let wave = -Math.sin(t * Math.PI * 4 - elapsedTime * 11) * 6.5;
      ctx.lineTo(a.x + dx * t + nx * wave, a.y + dy * t + ny * wave);
    }
    ctx.stroke();

    // Flowing reagent droplets along tether
    for (let d = 0; d < 3; d++) {
      let prog = ((elapsedTime * 0.95 + d / 3) % 1);
      let wave = Math.sin(prog * Math.PI * 4 - elapsedTime * 11) * 8;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(a.x + dx * prog + nx * wave, a.y + dy * prog + ny * wave, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

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

    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.globalAlpha = fade * 0.88;

    let grad = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    grad.addColorStop(0, mainCol + "0.38)");
    grad.addColorStop(0.62, mainCol + "0.2)");
    grad.addColorStop(1, mainCol + "0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Drifting billowing toxic spore clouds
    for (let p = 0; p < 5; p++) {
      let pa = (Math.PI * 2 / 5) * p + elapsedTime * 0.55;
      let pr = r * 0.52;
      ctx.fillStyle = mainCol + "0.14)";
      ctx.beginPath();
      ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = mainCol + "0.68)";
    ctx.lineWidth = 2.2;
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
    g.addColorStop(0, isMono ? "rgba(255,255,255,0.28)" : "rgba(186, 230, 253, 0.34)");
    g.addColorStop(0.55, isMono ? "rgba(200,200,200,0.18)" : "rgba(56, 189, 248, 0.28)");
    g.addColorStop(1, "rgba(14, 165, 233, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating sacred hexagram & celestial astrolabe ring
    ctx.save();
    ctx.rotate(elapsedTime * 1.1);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.0;
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
      drawFourPointStar(ctx, cx, cy, 7.5, 2.6, isMono ? "#FFFFFF" : "#BAE6FD", "#38BDF8");
    }
    ctx.restore();

    // Orbiting healing stars & sanctuary motes
    for (let i = 0; i < 6; i++) {
      let ang = (Math.PI / 3) * i + elapsedTime * 1.5;
      let dist = r * (0.42 + 0.24 * Math.sin(elapsedTime * 2.5 + i));
      drawFourPointStar(ctx, Math.cos(ang) * dist, Math.sin(ang) * dist, 5.2, 2.0, i % 2 === 0 ? "#4ADE80" : "#FEF08A", null);
    }
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
    g.addColorStop(0, "rgba(254, 240, 138, 0.32)");
    g.addColorStop(0.68, "rgba(56, 189, 248, 0.24)");
    g.addColorStop(1, "rgba(30, 58, 138, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Base octagonal seal perimeter
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Detonation countdown ring closing inward
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#38BDF8";
    ctx.lineWidth = 2.8;
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
      let ty = by * 0.86 - 58;
      tops.push({ x: tx, y: ty, bx, by });

      ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 6.2;
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
      drawFourPointStar(ctx, tops[i].x, tops[i].y, 6.2, 2.2, "#FFFFFF", "#FACC15");
    }

    // Converging Radiant Zenith Seal Star overhead
    let starR = 16 + prog * 14;
    drawFourPointStar(ctx, 0, -24, starR, starR * 0.3, "#FFFFFF", "#FACC15");
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

    // Target landing zone warning reticle
    ctx.save();
    ctx.translate(tx, ty);
    ctx.fillStyle = "rgba(249, 115, 22, 0.16)";
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
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, rad * t, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Ground shadow
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, Math.max(12, 32 - arcH * 0.08), Math.max(7, 16 - arcH * 0.04), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Blazing atmospheric re-entry meteor sphere + spikes
    ctx.save();
    ctx.translate(cx, cy - arcH);
    let r = 30 + Math.sin(t * Math.PI) * 11;

    // Outer fiery plasma aura
    let aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.75);
    aura.addColorStop(0, "rgba(254, 240, 138, 0.7)");
    aura.addColorStop(0.55, "rgba(249, 115, 22, 0.42)");
    aura.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(elapsedTime * 18);
    // Spiked siege shell
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i;
      ctx.fillStyle = isMono ? "#FFFFFF" : "#FBBF24";
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.14) * (r - 2), Math.sin(a - 0.14) * (r - 2));
      ctx.lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10));
      ctx.lineTo(Math.cos(a + 0.14) * (r - 2), Math.sin(a + 0.14) * (r - 2));
      ctx.closePath();
      ctx.fill();
    }

    let mg = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.12, 0, 0, r);
    mg.addColorStop(0, "#FEF08A");
    mg.addColorStop(0.42, "#F97316");
    mg.addColorStop(1, "#334155");
    ctx.fillStyle = isMono ? "#FFFFFF" : mg;
    ctx.strokeStyle = "#FDE047";
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
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(z.x, z.y);

    // Imperial crimson-gold Colosseum floor aura
    let g = ctx.createRadialGradient(0, 0, r * 0.12, 0, 0, r);
    g.addColorStop(0, "rgba(250, 204, 21, 0.08)");
    g.addColorStop(0.68, isMono ? "rgba(255,255,255,0.12)" : "rgba(220, 38, 38, 0.19)");
    g.addColorStop(0.95, isMono ? "rgba(255,255,255,0.22)" : "rgba(245, 158, 11, 0.30)");
    g.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer double arena stone & gold rings
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#F59E0B";
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "#999999" : "#EF4444";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Colosseum rune circle & crossed halberd emblem in center
    ctx.save();
    ctx.rotate(elapsedTime * 0.35);
    ctx.strokeStyle = isMono ? "#FFFFFF" : "rgba(253, 224, 71, 0.62)";
    ctx.lineWidth = 2.0;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 8 Carved Colosseum Battle Pillars on perimeter
    for (let i = 0; i < 8; i++) {
      let a = (Math.PI / 4) * i + elapsedTime * 0.08;
      let px = Math.cos(a) * r;
      let py = Math.sin(a) * r;
      ctx.fillStyle = isMono ? "#262626" : "#450A0A";
      ctx.strokeStyle = isMono ? "#FFFFFF" : "#FDE047";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawFourPointStar(ctx, px, py, 6.2, 2.2, "#FEF08A", "#EF4444");
    }

    ctx.restore();
  }
}

export function drawKhairMedBeacons(ctx, beacons, elapsedTime, isMono) {
  if (!beacons || beacons.length === 0) return;
  for (let b of beacons) {
    let r = b.radius || 220;
    let fade = Math.min(1, (b.duration - b.timer) / 0.35);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(b.x, b.y);

    // Emerald-Gold Med-Sensor Zone
    let g = ctx.createRadialGradient(0, 0, 8, 0, 0, r);
    g.addColorStop(0, "rgba(74, 222, 128, 0.28)");
    g.addColorStop(0.65, "rgba(56, 189, 248, 0.14)");
    g.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMono ? "#FFFFFF" : "#4ADE80";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating radar sweep sector
    let sweep = elapsedTime * 2.4;
    ctx.fillStyle = "rgba(250, 204, 21, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.96, sweep, sweep + 0.72);
    ctx.closePath();
    ctx.fill();

    // Expanding sonar heal pulse
    let wave = ((elapsedTime * 0.85) % 1) * r;
    ctx.strokeStyle = `rgba(74, 222, 128, ${1 - wave / r})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, wave, 0, Math.PI * 2);
    ctx.stroke();

    // Central Med-Beacon Tripod Device
    ctx.fillStyle = isMono ? "#262626" : "#0F172A";
    ctx.strokeStyle = isMono ? "#FFFFFF" : "#FACC15";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Emerald Medical Cross
    ctx.fillStyle = "#4ADE80";
    ctx.fillRect(-5.5, -2, 11, 4);
    ctx.fillRect(-2, -5.5, 4, 11);
    ctx.restore();
  }
}

export function drawBachDashRifts(ctx, rifts, elapsedTime, isMono) {
  if (!rifts || rifts.length === 0) return;
  for (let rf of rifts) {
    let f = clamp((rf.timer || 0) / Math.max(0.08, rf.duration || 0.45), 0, 1);
    let alpha = 1 - f;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = isMono ? "#FFFFFF" : rf.color || "#22D3EE";
    ctx.lineWidth = (rf.width || 16) * (1 - f * 0.65);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rf.sx, rf.sy);
    ctx.lineTo(rf.tx, rf.ty);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.5, (rf.width || 16) * 0.28 * (1 - f));
    ctx.stroke();

    let mx = (rf.sx + rf.tx) * 0.5;
    let my = (rf.sy + rf.ty) * 0.5;
    drawFourPointStar(ctx, mx, my, 12 * alpha + 3, 3.2, "#FFFFFF", "#E879F9");
    ctx.restore();
  }
}
