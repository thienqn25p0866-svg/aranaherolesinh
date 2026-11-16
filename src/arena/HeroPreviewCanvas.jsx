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
    parity: 1,
    pointerAngle: null,
    sparks: Array.from({ length: compact ? 8 : 18 }, (_, idx) => ({
      angle: (Math.PI * 2 * idx) / (compact ? 8 : 18),
      dist: 0.45 + (idx % 4) * 0.14,
      speed: 0.35 + (idx % 3) * 0.18,
      size: compact ? 1.5 : 2 + (idx % 3) * 0.8,
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

    const syncSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(40, Math.round(rect.width || (compact ? 84 : 260)));
      const h = Math.max(40, Math.round(rect.height || (compact ? 84 : 240)));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      return { w, h, dpr };
    };

    const drawFrame = (now) => {
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
      const scaleFactor = compact ? Math.max(0.72, minDim / 78) : Math.max(1.0, Math.min(1.68, minDim / 165));

      const mainCol = hero.color || "#38BDF8";
      const accentCol = hero.accentColor || "#BAE6FD";
      const t = st.elapsed;

      // 1. Tactical MOBA Pedestal Glow (radial gradient, zero shadowBlur)
      const bgGlow = ctx.createRadialGradient(cx, cy + minDim * 0.04, 2, cx, cy + minDim * 0.04, minDim * 0.48);
      bgGlow.addColorStop(0, hexToRgba(mainCol, compact ? 0.28 : 0.34));
      bgGlow.addColorStop(0.55, hexToRgba(accentCol, 0.1));
      bgGlow.addColorStop(1, "rgba(7, 11, 20, 0)");
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + minDim * 0.04, minDim * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // 2. Pedestal Ring & Rotating Arcane Sigil
      ctx.save();
      ctx.translate(cx, cy + (compact ? 4 : 12));
      ctx.scale(1, compact ? 0.55 : 0.52);

      const ringR = minDim * (compact ? 0.36 : 0.34);
      ctx.strokeStyle = hexToRgba(accentCol, 0.35);
      ctx.lineWidth = compact ? 1.2 : 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(t * 0.45);
      ctx.strokeStyle = hexToRgba(mainCol, 0.55);
      ctx.lineWidth = compact ? 1.2 : 2;
      for (let i = 0; i < 4; i++) {
        const a0 = (Math.PI * 0.5 * i) + 0.15;
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
          const sy = cy + Math.sin(ang) * orbit * 0.65 - ((t * 14 + sp.phase * 10) % (compact ? 14 : 26));
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
        ctx.lineWidth = compact ? 2.5 : 4.5 * (1 - prog * 0.5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, arcR, facing - 1.15, facing + 1.15);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Render Hero Body + Weapon from weaponRenderer.js
      const idleFacing = st.pointerAngle !== null ? st.pointerAngle : -0.22 + Math.sin(t * 1.1) * 0.14;
      const hoverBob = reducedMotion ? 0 : Math.sin(t * 2.5) * (compact ? 1.2 : 2.6);
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
        moveSpeedFactor: 0.25,
        walkCyclePhase: t * 3.2,
        bowRecoilTimer: st.atkTimer > 0.1 ? (st.atkTimer - 0.1) : 0,
        phong_basicStep: st.parity > 0 ? 0 : 1,
        dang_basicStep: st.parity > 0 ? 0 : 1,
        dang_rageReady: hero.id === "dang" && st.skillTimer > 0,
        dang_c2_timer: 0,
        dang_c3_asTimer: hero.id === "dang" && st.skillTimer > 0 ? 1 : 0,
      };

      ctx.save();
      ctx.translate(cx, cy + hoverBob);
      ctx.scale(scaleFactor, scaleFactor);

      if (hero.id === "phong") {
        ctx.save();
        ctx.globalAlpha = st.skillTimer > 0 ? 0.55 : 0.3;
        ctx.translate(-Math.cos(idleFacing) * 10, -Math.sin(idleFacing) * 10);
        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(26, baseRadius / scaleFactor + 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (hero.id === "dang") {
        ctx.save();
        ctx.rotate(t * (st.skillTimer > 0 ? 4.5 : 1.6));
        const qiR = Math.min(28, baseRadius / scaleFactor + 12);
        ctx.strokeStyle = "#F8FAFC";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, qiR, 0, 1.8);
        ctx.stroke();
        ctx.strokeStyle = "#18181B";
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(0, 0, qiR, Math.PI, Math.PI + 1.8);
        ctx.stroke();
        ctx.restore();
      } else if (hero.id === "thien") {
        ctx.save();
        ctx.rotate(t * (st.skillTimer > 0 ? 2.4 : 0.95));
        const thienR = Math.min(32, baseRadius / scaleFactor + 14);
        ctx.strokeStyle = "#FACC15";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, thienR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.rotate(-t * 1.9);
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, thienR * 0.78, 0.2, 2.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, thienR * 0.78, Math.PI + 0.2, Math.PI + 2.2);
        ctx.stroke();
        ctx.restore();
      }

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
        moveSpeedFactor: 0.22,
        walkCyclePhase: t * 3.2,
      });

      ctx.rotate(idleFacing);
      drawHeroWeapon(ctx, hero.id, fakePlayer, t, false);
      ctx.restore();

      if (locked) {
        ctx.save();
        ctx.fillStyle = "rgba(4, 7, 17, 0.56)";
        ctx.fillRect(0, 0, w, h);
        const lockS = compact ? 0.68 : 1.08;
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
