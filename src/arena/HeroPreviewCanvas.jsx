import React, { useEffect, useRef, useState } from "react";
import { drawHeroBody, drawHeroWeapon } from "./weaponRenderer.js";
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
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 1.12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

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
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
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
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const baseA = t * 2.4 + (Math.PI * 0.5 * i);
      const r1 = auraR * 0.85;
      const r2 = auraR * (1.05 + 0.14 * Math.sin(t * 14 + i * 2));
      ctx.beginPath();
      ctx.moveTo(Math.cos(baseA) * r1, Math.sin(baseA) * r1);
      ctx.lineTo(Math.cos(baseA + 0.2) * r2, Math.sin(baseA + 0.2) * r2);
      ctx.lineTo(Math.cos(baseA + 0.4) * r1, Math.sin(baseA + 0.4) * r1);
      ctx.stroke();
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
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, auraR * 1.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
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
  }
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
  const inViewRef = useRef(true);
  const stateRef = useRef({
    elapsed: 0,
    atkTimer: 0,
    skillTimer: 0,
    parity: 1,
    pointerAngle: null,
    sparks: Array.from({ length: compact ? 6 : 18 }, (_, idx) => ({
      angle: (Math.PI * 2 * idx) / (compact ? 6 : 18),
      dist: 0.45 + (idx % 4) * 0.14,
      speed: 0.35 + (idx % 3) * 0.18,
      size: compact ? 1.4 : 2 + (idx % 3) * 0.8,
      phase: idx * 0.9,
    })),
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(Boolean(mq.matches));
    const onChange = (e) => setReducedMotion(Boolean(e.matches));
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (attackTrigger > 0) {
      const st = stateRef.current;
      st.atkTimer = 0.28;
      st.skillTimer = 0.42;
      st.parity = -st.parity;
    }
  }, [attackTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let lastCompactRender = 0;

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              inViewRef.current = Boolean(entries[0]?.isIntersecting ?? true);
            },
            { threshold: 0.01 }
          )
        : null;
    io?.observe(canvas);

    const syncSize = () => {
      const dpr = Math.min(compact ? 1.5 : 2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(40, Math.round(rect.width || (compact ? 72 : 260)));
      const h = Math.max(40, Math.round(rect.height || (compact ? 72 : 240)));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      return { w, h, dpr };
    };

    const drawFrame = (now) => {
      if (!reducedMotion && !inViewRef.current) {
        lastTime = now;
        rafId = requestAnimationFrame(drawFrame);
        return;
      }

      if (compact && !reducedMotion && now - lastCompactRender < 32 && lastCompactRender !== 0) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      lastCompactRender = now;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const st = stateRef.current;
      if (!reducedMotion) {
        st.elapsed += dt;
      }
      if (st.atkTimer > 0) st.atkTimer = Math.max(0, st.atkTimer - dt);
      if (st.skillTimer > 0) st.skillTimer = Math.max(0, st.skillTimer - dt);

      const { w, h, dpr } = syncSize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * (compact ? 0.52 : 0.5);
      const minDim = Math.min(w, h);
      const baseRadius = compact ? minDim * 0.22 : Math.min(34, Math.max(22, minDim * 0.145));
      const scaleFactor = compact
        ? Math.max(0.58, Math.min(1.05, minDim / 78))
        : Math.max(1.0, Math.min(1.68, minDim / 165));

      const mainCol = hero.color || "#38BDF8";
      const accentCol = hero.accentColor || "#BAE6FD";
      const t = st.elapsed;

      // 1. Tactical MOBA Pedestal Glow
      const bgGlow = ctx.createRadialGradient(cx, cy + minDim * 0.04, 2, cx, cy + minDim * 0.04, minDim * 0.48);
      bgGlow.addColorStop(0, hexToRgba(mainCol, compact ? 0.26 : 0.36));
      bgGlow.addColorStop(0.55, hexToRgba(accentCol, 0.11));
      bgGlow.addColorStop(1, "rgba(7, 11, 20, 0)");
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + minDim * 0.04, minDim * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // 2. Pedestal Ring & Rotating Arcane Sigil
      ctx.save();
      ctx.translate(cx, cy + (compact ? 4 : 12));
      ctx.scale(1, compact ? 0.54 : 0.52);

      const ringR = minDim * (compact ? 0.37 : 0.34);
      ctx.strokeStyle = hexToRgba(accentCol, 0.35);
      ctx.lineWidth = compact ? 1.1 : 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(t * 0.48);
      ctx.strokeStyle = hexToRgba(mainCol, 0.56);
      ctx.lineWidth = compact ? 1.1 : 2;
      for (let i = 0; i < 4; i++) {
        const a0 = Math.PI * 0.5 * i + 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 0.82, a0, a0 + 0.72);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();

      // 3. Drifting Elemental Sparks
      if (!reducedMotion) {
        for (const sp of st.sparks) {
          const ang = sp.angle + t * sp.speed;
          const orbit = minDim * 0.37 * sp.dist;
          const sx = cx + Math.cos(ang) * orbit;
          const sy = cy + Math.sin(ang) * orbit * 0.65 - ((t * 14 + sp.phase * 10) % (compact ? 12 : 26));
          const alpha = 0.25 + 0.35 * Math.sin(t * 2.4 + sp.phase);
          ctx.fillStyle = hexToRgba(accentCol, Math.max(0.08, alpha));
          ctx.beginPath();
          ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Interactive Attack Shockwave Arc
      if (st.atkTimer > 0) {
        const prog = 1 - st.atkTimer / 0.28;
        const arcR = minDim * (0.28 + prog * 0.16);
        const facing = st.pointerAngle ?? -0.25;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = hexToRgba(accentCol, Math.max(0, 1 - prog) * 0.85);
        ctx.lineWidth = compact ? 2.4 : 4.5 * (1 - prog * 0.5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, arcR, facing - 1.15, facing + 1.15);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Render Hero Signature Aura + Body + Weapon
      const idleFacing = st.pointerAngle !== null ? st.pointerAngle : -0.22 + Math.sin(t * 1.15) * 0.18;
      const hoverBob = reducedMotion ? 0 : Math.sin(t * 2.6) * (compact ? 1.4 : 2.8);
      const fakePlayer = {
        x: 0,
        y: 0,
        radius: 22,
        facing: idleFacing,
        attackAnimTimer: st.atkTimer,
        weaponAttackDuration: 0.28,
        attackSwingParity: st.parity,
        weaponSkillTimer: st.skillTimer,
        weaponSkillDur: 0.42,
        weaponCritTimer: st.skillTimer > 0.15 ? st.skillTimer : 0,
        moveSpeedFactor: 0.28,
        walkCyclePhase: t * 3.2,
        bowRecoilTimer: st.atkTimer > 0.1 ? st.atkTimer - 0.1 : 0,
        phong_basicStep: st.parity > 0 ? 0 : 1,
        dang_basicStep: st.parity > 0 ? 0 : 1,
        dang_rageReady: hero.id === "dang" && st.skillTimer > 0,
        dang_c2_timer: 0,
        dang_c3_asTimer: hero.id === "dang" && st.skillTimer > 0 ? 1 : 0,
      };

      ctx.save();
      ctx.translate(cx, cy + hoverBob);
      ctx.scale(scaleFactor, scaleFactor);

      const auraRadius = Math.min(31, baseRadius / scaleFactor + 12);
      drawHeroSignatureAura(ctx, hero.id, t, auraRadius, idleFacing, st);

      drawHeroBody(ctx, {
        heroId: hero.id,
        radius: Math.min(24, baseRadius / scaleFactor + 8),
        facing: idleFacing,
        color: mainCol,
        accentColor: accentCol,
        isMono: false,
        hitFlash: false,
        isUlt: hero.id === "thien" || st.skillTimer > 0,
        isStealth: false,
        isDowned: false,
        elapsedTime: t,
        moveSpeedFactor: 0.24,
        walkCyclePhase: t * 3.2,
      });

      ctx.rotate(idleFacing);
      drawHeroWeapon(ctx, hero.id, fakePlayer, t, false);
      ctx.restore();

      if (locked) {
        ctx.save();
        ctx.fillStyle = "rgba(4, 7, 17, 0.56)";
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
        ctx.beginPath();
        ctx.roundRect(-11, -5, 22, 16, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#FDE047";
        ctx.beginPath();
        ctx.arc(0, 2, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const obs = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => syncSize()) : null;
    obs?.observe(canvas);

    drawFrame(performance.now());
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      obs?.disconnect();
      io?.disconnect();
    };
  }, [hero, compact, reducedMotion, locked]);

  const handleStrike = () => {
    if (!interactive || !hero) return;
    const st = stateRef.current;
    st.atkTimer = 0.28;
    st.skillTimer = 0.42;
    st.parity = -st.parity;
    R.playHeroSkillPreview(hero.id, "atk");
    onPreviewStrike?.(hero);
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
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleStrike}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label={hero?.name || "Hero showcase"}
      className={`block w-full h-full ${interactive ? "cursor-pointer" : "pointer-events-none"} ${className}`}
    />
  );
}
