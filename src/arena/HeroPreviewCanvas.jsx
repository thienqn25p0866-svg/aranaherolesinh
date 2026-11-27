import React, { useEffect, useRef } from "react";
import { drawHeroBody, drawHeroWeapon, drawDungCerberusForm, drawDanhDragonForm, drawUpgradedSlash } from "./weaponRenderer.js";
import { R } from "./soundEngine.js";

function hexToRgba(hex, alpha) {
  const clean = (hex || "#38BDF8").replace("#", "");
  if (clean.length !== 6) return `rgba(56, 189, 248, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16) || 56;
  const g = parseInt(clean.slice(2, 4), 16) || 189;
  const b = parseInt(clean.slice(4, 6), 16) || 248;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawHeroSignatureAura(ctx, heroId, t, auraR, idleFacing, st) {
  const pulse = 1 + Math.sin(t * 3.1) * 0.08;
  const activeBoost = st.skillTimer > 0 ? 1.8 : 1;

  if (heroId === "thien") {
    ctx.save();
    ctx.rotate(t * 0.8 * activeBoost);
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 6; seg++) {
      const a0 = (Math.PI * 2 * seg) / 6;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.12, a0, a0 + 0.65);
      ctx.stroke();
    }

    ctx.rotate(-t * 1.7 * activeBoost);
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 0.88, 0.25, 2.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 0.88, Math.PI + 0.25, Math.PI + 2.25);
    ctx.stroke();

    // Orbiting mini divine swords (6 on compact, 12 on spotlight)
    const count = 8;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + t * 1.25;
      const sx = Math.cos(a) * (auraR * 1.18);
      const sy = Math.sin(a) * (auraR * 1.18);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a + Math.PI * 0.5);
      ctx.fillStyle = i % 2 === 0 ? "#FEF08A" : "#7DD3FC";
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(2, 2);
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (heroId === "phong") {
    ctx.save();
    ctx.globalAlpha = st.skillTimer > 0 ? 0.58 : 0.34;
    ctx.translate(-Math.cos(idleFacing) * 9, -Math.sin(idleFacing) * 9);
    ctx.strokeStyle = "#22D3EE";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 5; seg++) {
      const a0 = t * 2.2 + (Math.PI * 2 * seg) / 5;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, a0, a0 + 0.72);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "dang") {
    ctx.save();
    ctx.rotate(t * (st.skillTimer > 0 ? 4.2 : 1.7));
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, 1.85);
    ctx.stroke();
    ctx.strokeStyle = "#18181B";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, Math.PI, Math.PI + 1.85);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (heroId === "dung") {
    ctx.save();
    const triCols = ["#38BDF8", "#FDE047", "#F43F5E"];
    for (let i = 0; i < 3; i++) {
      const baseA = t * 2.1 * activeBoost + ((Math.PI * 2) / 3) * i;
      const r1 = auraR * 0.88;
      const r2 = auraR * (1.12 + 0.14 * Math.sin(t * 14 + i * 2.1));
      ctx.strokeStyle = triCols[i];
      ctx.lineWidth = i === 1 ? 2.1 : 1.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(baseA) * r1, Math.sin(baseA) * r1);
      ctx.lineTo(Math.cos(baseA + 0.24) * r2, Math.sin(baseA + 0.24) * r2);
      ctx.lineTo(Math.cos(baseA + 0.48) * r1, Math.sin(baseA + 0.48) * r1);
      ctx.stroke();

      const fx = Math.cos(baseA + 0.24) * (auraR * 1.08);
      const fy = Math.sin(baseA + 0.24) * (auraR * 1.08);
      ctx.fillStyle = triCols[i];
      ctx.beginPath();
      ctx.arc(fx, fy, st.skillTimer > 0 ? 3.2 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "tin") {
    ctx.save();
    ctx.rotate(-t * 1.45 * activeBoost);
    ctx.strokeStyle = "rgba(244, 63, 94, 0.72)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 * i) / 3;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.02, a, a + 0.85);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "kin") {
    ctx.save();
    ctx.rotate(t * 2.3 * activeBoost);
    ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
    ctx.lineWidth = 1.7;
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 * i) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, auraR * 0.96, a, a + 1.2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "trung") {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const a = t * 1.45 * activeBoost + (Math.PI * 2 * i) / 6;
      const sx = Math.cos(a) * (auraR * 1.02);
      const sy = Math.sin(a) * (auraR * 1.02);
      ctx.fillStyle = i % 2 === 0 ? "#C084FC" : "#FDE047";
      ctx.beginPath();
      ctx.arc(sx, sy, i % 2 === 0 ? 3 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "eohyen") {
    ctx.save();
    ctx.rotate(t * 0.85 * activeBoost);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const sx = Math.cos(a) * (auraR * 1.04);
      const sy = Math.sin(a) * (auraR * 1.04);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a + Math.PI * 0.25);
      ctx.fillStyle = "#BAE6FD";
      ctx.fillRect(-2.4, -2.4, 4.8, 4.8);
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (heroId === "longhoi") {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const a = t * 1.9 * activeBoost + (Math.PI * 2 * i) / 5;
      const sx = Math.cos(a) * (auraR * 1.05);
      const sy = Math.sin(a) * (auraR * 1.05);
      ctx.fillStyle = i % 2 === 0 ? "#F97316" : "#FDE047";
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "duccong") {
    ctx.save();
    ctx.rotate(-t * 1.3 * activeBoost);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.72)";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 6; seg++) {
      const a0 = (Math.PI * 2 * seg) / 6;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.08, a0, a0 + 0.52);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 * i) / 3;
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * auraR * 1.08, Math.sin(a) * auraR * 1.08, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "gau") {
    ctx.save();
    ctx.strokeStyle = "rgba(249, 115, 22, 0.65)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, auraR * (0.94 + Math.sin(t * 4) * 0.08), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (heroId === "bao") {
    ctx.save();
    ctx.rotate(t * 2.1 * activeBoost);
    ctx.strokeStyle = "rgba(192, 132, 252, 0.75)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 1.0, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 1.0, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (heroId === "danh") {
    ctx.save();
    ctx.rotate(t * 1.6 * activeBoost);
    for (let i = 0; i < 2; i++) {
      const a = Math.PI * i;
      ctx.strokeStyle = i === 0 ? "#F59E0B" : "#EF4444";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.04, a, a + 1.5);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "luan") {
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const a = t * 1.2 + Math.PI * i;
      const px = Math.cos(a) * auraR * 0.98;
      const py = Math.sin(a) * auraR * 0.98;
      ctx.strokeStyle = "#67E8F9";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "taidu") {
    ctx.save();
    const a = t * 1.8 * activeBoost;
    const dx = Math.cos(a) * auraR * 1.08;
    const dy = Math.sin(a) * auraR * 0.86;
    ctx.fillStyle = "#38BDF8";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(dx, dy, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (heroId === "nguyen") {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = t * 1.6 * activeBoost + (Math.PI * 2 * i) / 3;
      const sx = Math.cos(a) * auraR * 1.05;
      const sy = Math.sin(a) * auraR * 1.05;
      ctx.fillStyle = "#4ADE80";
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "duy") {
    ctx.save();
    const a = -t * 1.85 * activeBoost;
    const sx = Math.cos(a) * auraR * 1.04;
    const sy = Math.sin(a) * auraR * 1.04;
    ctx.fillStyle = "rgba(167, 139, 250, 0.7)";
    ctx.beginPath();
    ctx.arc(sx, sy, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (heroId === "thanh") {
    ctx.save();
    // Twin counter-orbiting spirit serpents (jade emerald & abyssal amethyst)
    for (let pair = 0; pair < 2; pair++) {
      const baseAng = t * (2.25 * activeBoost) + pair * Math.PI;
      const orbR = auraR * (pair === 0 ? 1.08 : 0.96);
      for (let s = 0; s < 6; s++) {
        const sa = baseAng - s * 0.21;
        const sx = Math.cos(sa) * orbR;
        const sy = Math.sin(sa) * orbR;
        ctx.fillStyle = s === 0
          ? (pair === 0 ? "#A7F3D0" : "#F3E8FF")
          : (pair === 0 ? "rgba(16, 185, 129, 0.78)" : "rgba(168, 85, 247, 0.72)");
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1.8, 4.6 - s * 0.48), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  if (heroId === "nhi") {
    ctx.save();
    // Tri-elixir orbiting reagent ring + corked mini-flasks
    ctx.strokeStyle = "rgba(192, 132, 252, 0.4)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 6; seg++) {
      const a0 = t * 0.9 + (Math.PI * 2 * seg) / 6;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.06, a0, a0 + 0.56);
      ctx.stroke();
    }

    const cols = ["#E879F9", "#4ADE80", "#2DD4BF"];
    for (let i = 0; i < 3; i++) {
      const a = t * 1.9 * activeBoost + (Math.PI * 2 * i) / 3;
      const vx = Math.cos(a) * auraR * 1.06;
      const vy = Math.sin(a) * auraR * 1.06;
      ctx.fillStyle = cols[i];
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(vx, vy, 4.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(vx - 1.5, vy - 6.0, 3, 2.2);
    }
    ctx.restore();
    return;
  }

  if (heroId === "minh") {
    ctx.save();
    // Counter-rotating Sacred Celestial Astrolabe Seal Rings
    ctx.save();
    ctx.rotate(t * 1.25 * activeBoost);
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 4; seg++) {
      const a0 = (Math.PI * 0.5) * seg + 0.12;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.12, a0, a0 + 1.1);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      const sx = Math.cos(a) * auraR * 1.12;
      const sy = Math.sin(a) * auraR * 1.12;
      ctx.fillStyle = i % 2 === 0 ? "#FDE047" : "#38BDF8";
      ctx.beginPath();
      ctx.moveTo(sx, sy - 4.8);
      ctx.lineTo(sx + 4.8, sy);
      ctx.lineTo(sx, sy + 4.8);
      ctx.lineTo(sx - 4.8, sy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(-t * 1.45 * activeBoost);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 0.94, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    return;
  }

  if (heroId === "ducanh") {
    ctx.save();
    // Interlocking Orbiting Siege Riot Shields + Molten Gear Ring
    ctx.rotate(-t * 1.55 * activeBoost);
    ctx.strokeStyle = "rgba(245, 158, 11, 0.55)";
    ctx.lineWidth = 1.8;
    for (let seg = 0; seg < 4; seg++) {
      const a0 = (Math.PI * 0.5) * seg + 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.05, a0, a0 + 1.05);
      ctx.stroke();
    }

    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(auraR * 0.94, -7.5, 7.2, 15, 2.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#F97316";
      ctx.beginPath();
      ctx.arc(auraR * 0.94 + 3.6, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (heroId === "bach") {
    ctx.save();
    // Counter-rotating cyan-orchid phantom wind ribbons & crescent shuriken arcs
    ctx.rotate(t * 2.5 * activeBoost);
    ctx.strokeStyle = "rgba(34, 211, 238, 0.58)";
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 3; seg++) {
      const a0 = (Math.PI * 2 * seg) / 3 + 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.08, a0, a0 + 1.35);
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 * i) / 3;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = i % 2 === 0 ? "#67E8F9" : "#E879F9";
      ctx.beginPath();
      ctx.moveTo(auraR * 1.06, -5.5);
      ctx.quadraticCurveTo(auraR * 1.28, 0, auraR * 1.06, 5.5);
      ctx.quadraticCurveTo(auraR * 1.14, 0, auraR * 1.06, -5.5);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (heroId === "thai") {
    ctx.save();
    // Imperial crimson-gold Colosseum boundary ring & 6 arena pillars
    ctx.rotate(t * 1.05 * activeBoost);
    ctx.strokeStyle = "rgba(245, 158, 11, 0.72)";
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 6; seg++) {
      const a0 = (Math.PI / 3) * seg + 0.14;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.12, a0, a0 + 0.72);
      ctx.stroke();
    }

    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * auraR * 1.12;
      const py = Math.sin(a) * auraR * 1.12;
      ctx.fillStyle = i % 2 === 0 ? "#EF4444" : "#FDE047";
      ctx.strokeStyle = "#7F1D1D";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py - 4.4);
      ctx.lineTo(px + 4.4, py);
      ctx.lineTo(px, py + 4.4);
      ctx.lineTo(px - 4.4, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "khair") {
    ctx.save();
    // High-tech rotating golden-sky ballistic rangefinder reticle
    ctx.rotate(-t * 1.3 * activeBoost);
    ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 4; seg++) {
      const a0 = (Math.PI * 0.5) * seg + 0.22;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.1, a0, a0 + 1.0);
      ctx.stroke();
    }

    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.strokeStyle = i % 2 === 0 ? "#FACC15" : "#38BDF8";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * auraR * 0.94, Math.sin(a) * auraR * 0.94);
      ctx.lineTo(Math.cos(a) * auraR * 1.22, Math.sin(a) * auraR * 1.22);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (heroId === "uyen") {
    ctx.save();
    // Celestial Fate-Thread Lyre Rings & orbiting resonance notes
    ctx.rotate(t * 0.85 * activeBoost);
    ctx.strokeStyle = "rgba(45, 212, 191, 0.72)";
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    for (let seg = 0; seg < 4; seg++) {
      const a0 = (Math.PI * 0.5) * seg + 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.1, a0, a0 + 0.95);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 * i) / 3 + t * 1.1;
      const nx = Math.cos(a) * auraR * 1.12;
      const ny = Math.sin(a) * auraR * 1.12;
      ctx.fillStyle = i === 0 ? "#FDE68A" : "#2DD4BF";
      ctx.beginPath();
      ctx.arc(nx, ny, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "hau") {
    ctx.save();
    // 4-Directional Vital Bearing Compass & Crimson Chain Pips
    ctx.rotate(-t * 1.15 * activeBoost);
    ctx.strokeStyle = "rgba(225, 29, 72, 0.72)";
    ctx.lineWidth = 2.0;
    for (let seg = 0; seg < 4; seg++) {
      const a0 = (Math.PI * 0.5) * seg - 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, auraR * 1.1, a0, a0 + 0.7);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 0.5) * i;
      const vx = Math.cos(a) * auraR * 1.15;
      const vy = Math.sin(a) * auraR * 1.15;
      ctx.fillStyle = i === 0 ? "#F43F5E" : "#CBD5E1";
      ctx.beginPath();
      ctx.moveTo(vx, vy - 4);
      ctx.lineTo(vx + 4, vy);
      ctx.lineTo(vx, vy + 4);
      ctx.lineTo(vx - 4, vy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (heroId === "lam") {
    ctx.save();
    // Rotating Calligraphy Bagua Octagon & Tri-Element Seals (Fire, Thunder, Void)
    ctx.rotate(t * 0.9 * activeBoost);
    ctx.strokeStyle = "rgba(37, 99, 235, 0.7)";
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      const px = Math.cos(a) * auraR * 1.12;
      const py = Math.sin(a) * auraR * 1.12;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    const sealCols = ["#F97316", "#38BDF8", "#A855F7"];
    for (let i = 0; i < 3; i++) {
      const a = t * 1.4 + (Math.PI * 2 * i) / 3;
      ctx.fillStyle = sealCols[i];
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * auraR * 1.12, Math.sin(a) * auraR * 1.12, 4.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function traceRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export default function HeroPreviewCanvas({
  hero,
  compact = false,
  attackTrigger = 0,
  interactive = true,
  locked = false,
  className = "",
  onPreviewStrike,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    elapsed: 0,
    atkTimer: 0,
    skillTimer: 0,
    autoFlourishTimer: 1.4,
    parity: 1,
    pointerAngle: null,
    sparks: Array.from({ length: compact ? 8 : 20 }, (_, idx) => ({
      angle: (Math.PI * 2 * idx) / (compact ? 8 : 20),
      dist: 0.42 + (idx % 4) * 0.14,
      speed: 0.48 + (idx % 3) * 0.22,
      size: compact ? 1.5 : 2.1 + (idx % 3) * 0.85,
      phase: idx * 0.85,
    })),
  });

  useEffect(() => {
    const st = stateRef.current;
    st.autoFlourishTimer = 1.1;
  }, [hero?.id]);

  useEffect(() => {
    if (attackTrigger > 0) {
      const st = stateRef.current;
      st.atkTimer = 0.3;
      st.skillTimer = 0.46;
      st.autoFlourishTimer = 3.2;
      st.parity = -st.parity;
    }
  }, [attackTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let lastCompactRender = 0;
    let cachedW = compact ? 56 : 260;
    let cachedH = compact ? 56 : 220;
    let hasBox = false;
    let isIntersecting = true;
    let hovered = false;
    let compactWakeUntil = performance.now() + (attackTrigger > 0 ? 700 : 80);

    const measureBox = () => {
      const rect = canvas.getBoundingClientRect();
      const parentRect = canvas.parentElement?.getBoundingClientRect();
      const rawW = rect.width >= 8 ? rect.width : parentRect?.width || (compact ? 56 : 260);
      const rawH = rect.height >= 8 ? rect.height : parentRect?.height || (compact ? 56 : 220);
      cachedW = Math.max(40, Math.round(rawW));
      cachedH = Math.max(40, Math.round(rawH));
      hasBox = rawW >= 8 && rawH >= 8;
    };

    const getCanvasBox = () => {
      if (!hasBox) measureBox();
      const dprCap = compact ? 1.35 : 1.75;
      const dpr = Math.min(dprCap, window.devicePixelRatio || 1);
      return { w: cachedW, h: cachedH, dpr, visible: hasBox };
    };

    const syncSize = () => {
      const { w, h, dpr, visible } = getCanvasBox();
      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      return { w, h, dpr, visible };
    };

    const wakeLoop = (durationMs = 0) => {
      if (disposed) return;
      if (durationMs > 0) {
        compactWakeUntil = Math.max(compactWakeUntil, performance.now() + durationMs);
      }
      if (!rafId && isIntersecting && !(typeof document !== "undefined" && document.hidden)) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    canvas.__arenaWakePreview = wakeLoop;
    canvas.__arenaSetHover = (nextHovered) => {
      hovered = Boolean(nextHovered);
      if (hovered) wakeLoop(350);
    };

    const renderScene = (w, h, dpr) => {
      const st = stateRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * (compact ? 0.52 : 0.5);
      const minDim = Math.min(w, h);
      const baseRadius = compact ? minDim * 0.22 : Math.min(34, Math.max(22, minDim * 0.145));
      const scaleFactor = compact
        ? Math.max(0.52, Math.min(0.95, minDim / 84))
        : Math.max(0.96, Math.min(1.52, minDim / 172));

      const mainCol = hero.color || "#38BDF8";
      const accentCol = hero.accentColor || "#BAE6FD";
      const t = st.elapsed;

      // 1. Overhead MOBA Stage Spotlight Beam (non-compact hero showcase)
      if (!compact) {
        const beamGrad = ctx.createLinearGradient(cx, 0, cx, cy + minDim * 0.28);
        beamGrad.addColorStop(0, hexToRgba(accentCol, 0.18));
        beamGrad.addColorStop(0.55, hexToRgba(mainCol, 0.08));
        beamGrad.addColorStop(1, "rgba(7, 11, 20, 0)");
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(cx - minDim * 0.14, 0);
        ctx.lineTo(cx + minDim * 0.14, 0);
        ctx.lineTo(cx + minDim * 0.36, cy + minDim * 0.26);
        ctx.lineTo(cx - minDim * 0.36, cy + minDim * 0.26);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Tactical MOBA Pedestal Glow (gentle breathing pulse)
      const glowPulse = 1 + Math.sin(t * 2.5) * 0.06;
      const bgGlow = ctx.createRadialGradient(
        cx,
        cy + minDim * 0.06,
        2,
        cx,
        cy + minDim * 0.06,
        minDim * 0.48 * glowPulse
      );
      bgGlow.addColorStop(0, hexToRgba(mainCol, compact ? 0.28 : 0.42));
      bgGlow.addColorStop(0.55, hexToRgba(accentCol, 0.15));
      bgGlow.addColorStop(1, "rgba(7, 11, 20, 0)");
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + minDim * 0.06, minDim * 0.48 * glowPulse, 0, Math.PI * 2);
      ctx.fill();

      // 3. 3D Perspective Stone-and-Gold MOBA Dais + Rotating Arcane Sigil
      ctx.save();
      ctx.translate(cx, cy + (compact ? 6 : 22));
      ctx.scale(1, compact ? 0.54 : 0.48);

      const ringR = minDim * (compact ? 0.38 : 0.36);

      if (!compact) {
        // Stepped obsidian stone dais plinth beneath sigil
        ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
        ctx.beginPath();
        ctx.arc(0, 10, ringR * 1.08, 0, Math.PI * 2);
        ctx.fill();

        const daisGrad = ctx.createRadialGradient(-ringR * 0.2, -ringR * 0.2, 4, 0, 0, ringR * 1.04);
        daisGrad.addColorStop(0, "#1E293B");
        daisGrad.addColorStop(0.7, "#0F172A");
        daisGrad.addColorStop(1, "#020617");
        ctx.fillStyle = daisGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 1.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(mainCol, 0.5);
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Carved octagonal gold-accent inlay on plinth
        ctx.strokeStyle = "rgba(245, 158, 11, 0.34)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const oa = (Math.PI / 4) * i + Math.PI / 8;
          const ox = Math.cos(oa) * ringR * 0.92;
          const oy = Math.sin(oa) * ringR * 0.92;
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.strokeStyle = hexToRgba(accentCol, 0.44);
      ctx.lineWidth = compact ? 1.1 : 1.9;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(t * 0.72);
      ctx.strokeStyle = hexToRgba(mainCol, 0.68);
      ctx.lineWidth = compact ? 1.2 : 2.3;
      for (let i = 0; i < 4; i++) {
        const a0 = Math.PI * 0.5 * i + 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 0.8, a0, a0 + 0.72);
        ctx.stroke();
      }
      ctx.restore();

      // Grounded cast shadow right under hero feet on top of dais
      ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
      ctx.beginPath();
      ctx.arc(0, 0, ringR * (compact ? 0.44 : 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Drifting Elemental Sparks
      for (const sp of st.sparks) {
        const ang = sp.angle + t * sp.speed;
        const orbit = minDim * 0.38 * sp.dist;
        const sx = cx + Math.cos(ang) * orbit;
        const sy = cy + Math.sin(ang) * orbit * 0.65 - ((t * 16 + sp.phase * 10) % (compact ? 13 : 28));
        const alpha = 0.28 + 0.38 * Math.sin(t * 2.8 + sp.phase);
        ctx.fillStyle = hexToRgba(accentCol, Math.max(0.1, alpha));
        ctx.beginPath();
        ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Hero Signature Aura + Body + Weapon + Archetype-Specific Attack VFX
      const idleFacing =
        st.pointerAngle !== null ? st.pointerAngle : -0.22 + Math.sin(t * 1.45) * 0.24;
      const hoverBob = Math.sin(t * 2.9) * (compact ? 1.8 : 3.5);
      const breatheScale = 1 + Math.sin(t * 2.9) * (compact ? 0.015 : 0.024);
      const previewNhiAmmo = hero.id === "nhi" ? ["purple", "green", "life"][Math.floor(t / 2.2) % 3] : "purple";
      const fakePlayer = {
        x: 0,
        y: 0,
        radius: 22,
        facing: idleFacing,
        attackAnimTimer: st.atkTimer,
        weaponAttackDuration: 0.58,
        attackSwingParity: st.parity,
        weaponSkillTimer: st.skillTimer,
        weaponSkillDur: 0.88,
        weaponCritTimer: st.skillTimer > 0.25 ? st.skillTimer : 0,
        moveSpeedFactor: 0.36,
        walkCyclePhase: t * 3.8,
        bowRecoilTimer: st.atkTimer > 0.18 ? st.atkTimer - 0.18 : 0,
        phong_basicStep: st.parity > 0 ? 0 : 1,
        dang_basicStep: st.parity > 0 ? 0 : 1,
        dang_rageReady: hero.id === "dang" && st.skillTimer > 0,
        dang_c2_timer: 0,
        dang_c3_asTimer: hero.id === "dang" && st.skillTimer > 0 ? 1 : 0,
        dung_c3_buff_timer: hero.id === "dung" && st.skillTimer > 0 ? 1 : 0,
        thanh_c3Timer: hero.id === "thanh" && st.skillTimer > 0 ? 1 : 0,
        nhi_ammoType: previewNhiAmmo,
        bachDashing: hero.id === "bach" && st.skillTimer > 0,
        thai_inArena: hero.id === "thai" && st.skillTimer > 0,
        khair_aimZoomBlend: hero.id === "khair" && st.skillTimer > 0 ? 1 : 0,
        uyen_c3Timer: hero.id === "uyen" && st.skillTimer > 0 ? 1 : 0,
        hau_parryTimer: hero.id === "hau" && st.skillTimer > 0 ? 1 : 0,
        lam_queuedSeal: hero.id === "lam" ? ["hoa", "loi", "huyen"][Math.floor(t / 1.4) % 3] : "hoa",
      };

      if (st.atkTimer > 0) {
        const prog = Math.max(0, Math.min(1, 1 - st.atkTimer / 0.58));
        const previewSlashMap = {
          dung: "spear",
          gau: "gau_punch",
          dang: "dang_punch",
          ducanh: "ducanh_hammer_cleave",
          thai: "thai_arena_cleave",
          danh: !compact && st.skillTimer > 0 ? "danh_firebreath" : "danh_slash",
          tin: "tin_spatial_slash",
          eohyen: "eohyen_frost_slash",
          bao: "bao_slash",
          phong: "phong_slash",
          nguyen: "nguyen_wave",
          thien: "thien_sword_slash",
          bach: "bach_cross_slash",
          khair: "khair_sniper_muzzle",
          uyen: "uyen_note_cast",
          hau: "hau_sickle_sweep",
          lam: "lam_ink_cast",
        };
        const slashKind = previewSlashMap[hero.id] || "cast_muzzle";
        const isMuzzleKind = slashKind === "cast_muzzle" || slashKind === "khair_sniper_muzzle";
        const muzzleDist = slashKind === "khair_sniper_muzzle" ? 34 : 28;
        const slashX = isMuzzleKind ? Math.cos(idleFacing) * muzzleDist : 0;
        const slashY = isMuzzleKind ? Math.sin(idleFacing) * muzzleDist : 0;
        const slashRadius =
          slashKind === "khair_sniper_muzzle"
            ? 42
            : slashKind === "cast_muzzle"
            ? 28
            : slashKind === "ducanh_hammer_cleave"
            ? Math.min(102, Math.max(88, ((minDim * 0.46) / scaleFactor)))
            : Math.min(72, Math.max(46, (minDim * 0.36) / scaleFactor));
        ctx.save();
        ctx.translate(cx, cy + hoverBob);
        ctx.scale(scaleFactor * breatheScale, scaleFactor * breatheScale);
        ctx.globalAlpha = prog < 0.28 ? 1 : Math.pow(Math.max(0, (1 - prog) / 0.72), 1.1);
        drawUpgradedSlash(
          ctx,
          {
            kind: slashKind,
            x: slashX,
            y: slashY,
            angle: idleFacing,
            radius: slashRadius,
            spread: 1.45,
            dir: st.parity,
            step: st.parity > 0 ? 0 : 1,
            empowered: st.skillTimer > 0,
            color: mainCol,
            accentColor: accentCol,
            life: prog * 0.58,
            maxLife: 0.58,
          },
          prog,
          false,
          true
        );
        ctx.restore();
      }

      ctx.save();
      ctx.translate(cx, cy + hoverBob);
      ctx.scale(scaleFactor * breatheScale, scaleFactor * breatheScale);

      try {
        const auraRadius = Math.min(31, baseRadius / scaleFactor + 12);
        const bodyRadius = Math.min(24, baseRadius / scaleFactor + 8);
        const isDanhDragonPreview = !compact && hero.id === "danh" && st.skillTimer > 0;
        if (!isDanhDragonPreview) {
          drawHeroSignatureAura(ctx, hero.id, t, auraRadius, idleFacing, st);
        }
        if (!compact && hero.id === "dung" && st.skillTimer > 0) {
          drawDungCerberusForm(
            ctx,
            0,
            0,
            bodyRadius,
            idleFacing,
            t,
            { atkActive: st.atkTimer > 0, skillActive: true, berserkActive: false, ratio: Math.min(1, st.skillTimer / 0.15) },
            false
          );
        }

        if (isDanhDragonPreview) {
          drawDanhDragonForm(ctx, 0, 0, bodyRadius, idleFacing, t, false, {
            isAttacking: st.atkTimer > 0,
            atkProg: st.atkTimer > 0 ? 1 - st.atkTimer / 0.58 : 0,
            atkParity: st.parity,
            isMoving: true,
          });
        } else {
          drawHeroBody(ctx, {
            heroId: hero.id,
            radius: bodyRadius,
            facing: idleFacing,
            color: mainCol,
            accentColor: accentCol,
            nhiAmmoType: previewNhiAmmo,
            bachDashing: hero.id === "bach" && st.skillTimer > 0,
            thaiInArena: hero.id === "thai" && st.skillTimer > 0,
            khairAiming: hero.id === "khair" && st.skillTimer > 0,
            uyenActive: hero.id === "uyen" && st.skillTimer > 0,
            hauParrying: hero.id === "hau" && st.skillTimer > 0,
            lamSeal: fakePlayer.lam_queuedSeal,
            isMono: false,
            hitFlash: false,
            isUlt: hero.id === "thien" || st.skillTimer > 0,
            isStealth: false,
            isDowned: false,
            elapsedTime: t,
            moveSpeedFactor: 0.34,
            walkCyclePhase: t * 3.8,
          });

          ctx.rotate(idleFacing);
          drawHeroWeapon(ctx, hero.id, fakePlayer, t, false);
        }
      } catch (err) {
        if (typeof console !== "undefined") {
          console.warn("HeroPreviewCanvas render fallback:", hero.id, err);
        }
      }
      ctx.restore();

      if (locked) {
        ctx.save();
        ctx.fillStyle = "rgba(4, 7, 17, 0.54)";
        ctx.fillRect(0, 0, w, h);
        const lockS = compact ? 0.62 : 1.08;
        ctx.translate(cx, cy);
        ctx.scale(lockS, lockS);
        ctx.strokeStyle = "#FACC15";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, -6, 8, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = "#0F172A";
        ctx.strokeStyle = "#FACC15";
        ctx.lineWidth = 2.2;
        traceRoundedRect(ctx, -11, -5, 22, 16, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#FDE047";
        ctx.beginPath();
        ctx.arc(0, 2, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawFrame = (now) => {
      rafId = 0;
      if (disposed || !isIntersecting) return;
      if (typeof document !== "undefined" && document.hidden) return;

      if (compact && !hovered && now > compactWakeUntil && stateRef.current.atkTimer <= 0 && stateRef.current.skillTimer <= 0) {
        return;
      }

      if (compact && now - lastCompactRender < 32 && lastCompactRender !== 0) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const st = stateRef.current;
      st.elapsed += dt;
      if (st.atkTimer > 0) st.atkTimer = Math.max(0, st.atkTimer - dt);
      if (st.skillTimer > 0) st.skillTimer = Math.max(0, st.skillTimer - dt);

      // Visual-only periodic showcase combat flourish on main stage
      if (!compact && !locked) {
        st.autoFlourishTimer -= dt;
        if (st.autoFlourishTimer <= 0) {
          st.autoFlourishTimer = 3.6;
          st.atkTimer = 0.58;
          st.skillTimer = 0.88;
          st.parity = -st.parity;
        }
      }

      const { w, h, dpr, visible } = syncSize();
      if (visible) {
        lastCompactRender = now;
        renderScene(w, h, dpr);
      }

      if (!compact || hovered || now < compactWakeUntil || st.atkTimer > 0 || st.skillTimer > 0) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden && isIntersecting) {
        wakeLoop(compact ? 120 : 0);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (disposed) return;
              const entry = entries[0];
              isIntersecting = Boolean(entry?.isIntersecting);
              if (isIntersecting) {
                measureBox();
                const box = syncSize();
                if (box.visible) renderScene(box.w, box.h, box.dpr);
                if (!compact || hovered || performance.now() < compactWakeUntil) {
                  wakeLoop(0);
                }
              } else if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = 0;
              }
            },
            { threshold: 0.01 }
          )
        : null;
    io?.observe(canvas);

    const obs =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (disposed) return;
            const prevW = cachedW;
            const prevH = cachedH;
            measureBox();
            const { w, h, dpr, visible } = syncSize();
            if (visible && (w !== prevW || h !== prevH)) {
              renderScene(w, h, dpr);
            }
          })
        : null;
    obs?.observe(canvas);
    if (canvas.parentElement) obs?.observe(canvas.parentElement);

    measureBox();
    const initBox = syncSize();
    if (initBox.visible) {
      renderScene(initBox.w, initBox.h, initBox.dpr);
    }
    if (!compact || attackTrigger > 0) {
      rafId = requestAnimationFrame(drawFrame);
    }

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      io?.disconnect();
      obs?.disconnect();
      delete canvas.__arenaWakePreview;
      delete canvas.__arenaSetHover;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [hero, compact, locked, attackTrigger]);

  const handleStrike = () => {
    if (!interactive || !hero) return;
    const st = stateRef.current;
    st.atkTimer = 0.58;
    st.skillTimer = 0.88;
    st.autoFlourishTimer = 3.6;
    st.parity = -st.parity;
    canvasRef.current?.__arenaWakePreview?.(1100);
    R.playHeroSkillPreview(hero.id, "atk");
    onPreviewStrike?.(hero);
  };

  const handlePointerEnter = () => {
    canvasRef.current?.__arenaSetHover?.(true);
  };

  const handlePointerMove = (e) => {
    if (!interactive || compact) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width * 0.5);
    const dy = e.clientY - (rect.top + rect.height * 0.5);
    if (Math.hypot(dx, dy) > 8) {
      stateRef.current.pointerAngle = Math.atan2(dy, dx);
    }
  };

  const handlePointerLeave = () => {
    stateRef.current.pointerAngle = null;
    canvasRef.current?.__arenaSetHover?.(false);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleStrike}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label={hero?.name || "Hero showcase"}
      className={`block w-full h-full ${interactive ? "cursor-pointer" : "pointer-events-none"} ${className}`}
    />
  );
}
