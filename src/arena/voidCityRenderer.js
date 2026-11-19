import { isCircleInViewBounds } from "./combatLogic";
import {
  VOID_CITY_WIDTH,
  VOID_CITY_HEIGHT,
  VOID_CITY_ZONES,
  VOID_CITY_CORRIDORS,
  VOID_CITY_INTERACTABLES,
  VOID_CITY_CHESTS,
  RELIC2_TOMB_STATUES,
  getActiveVoidCityObstacles,
  findNearestVoidCityInteractable,
  normalizeVoidCityProgress,
  isRelic6Accessible,
} from "./voidCityMap";

// Strictly ZERO ctx.shadowBlur usage for smooth 60fps mobile Canvas 2D performance.

function getBoundsEdges(vb) {
  if (!vb) {
    return { minX: 0, maxX: VOID_CITY_WIDTH, minY: 0, maxY: VOID_CITY_HEIGHT };
  }
  return {
    minX: vb.minX ?? vb.left ?? 0,
    maxX: vb.maxX ?? vb.right ?? VOID_CITY_WIDTH,
    minY: vb.minY ?? vb.top ?? 0,
    maxY: vb.maxY ?? vb.bottom ?? VOID_CITY_HEIGHT,
  };
}

function isRectVisible(r, vb, pad = 160) {
  const b = getBoundsEdges(vb);
  return (
    r.x + r.w >= b.minX - pad &&
    r.x <= b.maxX + pad &&
    r.y + r.h >= b.minY - pad &&
    r.y <= b.maxY + pad
  );
}

// ---------------------------------------------------------------------------
// 1. FLOOR LAYER: Cobblestones, Gothic Plazas, Canals, Bridges, Mirror Pool,
//    Clock Dial, Theater Amphitheater, First-World Sanctum
// ---------------------------------------------------------------------------

export function drawVoidCityFloorScene(ctx, engine, t, viewBounds) {
  const runtime = engine.voidCityRuntime;
  const progress = normalizeVoidCityProgress(engine.voidCityProgress);
  const b = getBoundsEdges(viewBounds);
  const perf = engine.getPerformanceProfile?.() || { enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;

  // Base obsidian stone slate
  ctx.fillStyle = "#06070B";
  ctx.fillRect(b.minX - 60, b.minY - 60, b.maxX - b.minX + 120, b.maxY - b.minY + 120);

  // Zone background washes
  for (const z of VOID_CITY_ZONES) {
    if (!isRectVisible(z.rect, viewBounds, 80)) continue;
    ctx.fillStyle =
      z.id === "zone_1"
        ? "#0A0D14"
        : z.id === "zone_2"
        ? "#0C101A"
        : z.id === "zone_3"
        ? "#09101C"
        : z.id === "zone_4"
        ? "#0A1120"
        : z.id === "zone_5"
        ? "#100B1C"
        : z.id === "zone_6"
        ? "#140B1A"
        : z.id === "zone_7"
        ? "#111018"
        : "#090812";
    ctx.fillRect(z.rect.x, z.rect.y, z.rect.w, z.rect.h);

    // Subtle Gothic floor masonry grid inside viewBounds
    const step = 120;
    const gx0 = Math.max(z.rect.x, Math.floor(b.minX / step) * step);
    const gx1 = Math.min(z.rect.x + z.rect.w, Math.ceil(b.maxX / step) * step);
    const gy0 = Math.max(z.rect.y, Math.floor(b.minY / step) * step);
    const gy1 = Math.min(z.rect.y + z.rect.h, Math.ceil(b.maxY / step) * step);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.065)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = gx0; x <= gx1; x += step) {
      ctx.moveTo(x, gy0);
      ctx.lineTo(x, gy1);
    }
    for (let y = gy0; y <= gy1; y += step) {
      ctx.moveTo(gx0, y);
      ctx.lineTo(gx1, y);
    }
    ctx.stroke();
  }

  // Deep Abyssal Void Canals separating Palace & Heart of the Void (under bridges)
  const canals = [
    { x: 2860, y: 1250, w: 280, h: 2750 },
    { x: 3140, y: 1700, w: 1660, h: 200 },
  ];
  for (const c of canals) {
    if (!isRectVisible(c, viewBounds, 80)) continue;
    ctx.fillStyle = "#030407";
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }

  // Main Boulevards, Alleys, Canal Stone Bridges, and Underground Catacombs
  for (const corr of VOID_CITY_CORRIDORS) {
    if (!isRectVisible(corr, viewBounds, 100)) continue;
    if (corr.kind === "underground_tunnel") {
      ctx.fillStyle = "#0E1322";
      ctx.fillRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.38)";
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 2;
      ctx.strokeRect(corr.x + 3, corr.y + 3, corr.w - 6, corr.h - 6);
      ctx.setLineDash([]);
    } else if (corr.kind === "canal_bridge") {
      ctx.fillStyle = "#1E2534";
      ctx.fillRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 3;
      ctx.strokeRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = "rgba(253, 230, 138, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(corr.x + 8, corr.y + 8, corr.w - 16, corr.h - 16);
    } else {
      ctx.fillStyle = corr.kind === "alley" ? "#101520" : "#151B29";
      ctx.fillRect(corr.x, corr.y, corr.w, corr.h);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(corr.x, corr.y, corr.w, corr.h);
    }
  }

  // Zone 2 Plaza Magic Mosaic
  if (isCircleInViewBounds(1850, 3220, 420, viewBounds)) {
    ctx.save();
    ctx.translate(1850, 3220);
    ctx.strokeStyle = progress.relic2Solved ? "rgba(253, 230, 138, 0.45)" : "rgba(148, 163, 184, 0.26)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 340, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 210, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Zone 3 Phố Người Vắng - Small Mirror Pool (Relic 5 entrance)
  if (isCircleInViewBounds(1175, 1475, 160, viewBounds)) {
    ctx.save();
    ctx.translate(1175, 1475);
    const pulse = 0.78 + 0.22 * Math.sin(t * 2.4);
    if (allowGlows) {
      const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 110);
      g.addColorStop(0, `rgba(56, 189, 248, ${0.42 * pulse})`);
      g.addColorStop(0.65, "rgba(14, 116, 144, 0.22)");
      g.addColorStop(1, "rgba(6, 7, 11, 0)");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 108, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = progress.relic5Solved ? "#FDE68A" : "#38BDF8";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    // Subtle inverted First-World city spires reflected inside water
    ctx.strokeStyle = "rgba(186, 230, 253, 0.34)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-40, 20);
    ctx.lineTo(-22, -26);
    ctx.lineTo(-6, 20);
    ctx.lineTo(14, -34);
    ctx.lineTo(34, 20);
    ctx.stroke();
    ctx.restore();
  }

  // Zone 5 Inverted Clock Tower Giant Backward Clockwork Dial on floor
  if (isCircleInViewBounds(780, 660, 380, viewBounds)) {
    const rev = Boolean(runtime?.clockReversed);
    ctx.save();
    ctx.translate(780, 660);
    ctx.strokeStyle = rev ? "rgba(56, 189, 248, 0.52)" : "rgba(168, 85, 247, 0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 320, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.stroke();
    // Tick marks
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 285, Math.sin(a) * 285);
      ctx.lineTo(Math.cos(a) * 316, Math.sin(a) * 316);
      ctx.stroke();
    }
    // Backward rotating hands!
    const handAngleFast = -t * (rev ? 1.8 : 0.7);
    const handAngleSlow = -t * (rev ? 0.45 : 0.16);
    ctx.strokeStyle = rev ? "#67E8F9" : "#C084FC";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handAngleFast) * 255, Math.sin(handAngleFast) * 255);
    ctx.stroke();
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handAngleSlow) * 165, Math.sin(handAngleSlow) * 165);
    ctx.stroke();
    ctx.restore();
  }

  // Zone 6 Nhà Hát Không Khán Giả - Stage & Empty Velvet Stalls
  if (isCircleInViewBounds(2340, 560, 480, viewBounds)) {
    ctx.save();
    ctx.translate(2340, 560);
    // Stage floor
    ctx.fillStyle = "#1E1024";
    ctx.fillRect(-310, -210, 620, 175);
    ctx.strokeStyle = progress.map4PuppetPlaySeen ? "#FDE68A" : "#C084FC";
    ctx.lineWidth = 3;
    ctx.strokeRect(-310, -210, 620, 175);
    // Theater Spotlights pulsing automatically
    const spX = Math.sin((runtime?.theaterReenactPhase || t) * 1.1) * 120;
    if (allowGlows) {
      const sg = ctx.createRadialGradient(spX, -120, 8, spX, -120, 115);
      sg.addColorStop(0, progress.map4PuppetPlaySeen ? "rgba(253, 230, 138, 0.36)" : "rgba(192, 132, 252, 0.34)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(spX, -120, 115, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ghostly puppet silhouette re-enacting
    ctx.fillStyle = progress.map4PuppetPlaySeen ? "rgba(253, 230, 138, 0.55)" : "rgba(203, 213, 225, 0.25)";
    ctx.beginPath();
    ctx.arc(spX, -128, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(spX - 9, -114, 18, 28);
    // Empty audience rows (dark silver-crimson benches)
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = "rgba(88, 28, 135, 0.28)";
      ctx.fillRect(-260 + row * 18, 25 + row * 48, 520 - row * 36, 22);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-260 + row * 18, 25 + row * 48, 520 - row * 36, 22);
    }
    ctx.restore();
  }

  // Zone 8 Heart of the Void Boss Sigil & Origin Sanctum Floor
  if (isCircleInViewBounds(3920, 920, 480, viewBounds)) {
    ctx.save();
    ctx.translate(3920, 920);
    const unlocked6 = isRelic6Accessible(progress);
    ctx.strokeStyle = progress.relic6Solved ? "rgba(253, 230, 138, 0.55)" : unlocked6 ? "rgba(56, 189, 248, 0.45)" : "rgba(168, 85, 247, 0.32)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 350, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.rotate(t * 0.24);
    ctx.setLineDash([16, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.restore();
  }

  // Outer Void Border
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, VOID_CITY_WIDTH - 16, VOID_CITY_HEIGHT - 16);
}

// ---------------------------------------------------------------------------
// 2. STRUCTURES, STATUES, HOUSES, SHELVES, INTERACTABLES, CHESTS & SHADOWS
// ---------------------------------------------------------------------------

export function drawVoidCityStructuresScene(ctx, engine, t, viewBounds) {
  const runtime = engine.voidCityRuntime;
  const progress = normalizeVoidCityProgress(engine.voidCityProgress);
  const perf = engine.getPerformanceProfile?.() || { enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  const obstacles = getActiveVoidCityObstacles(progress, runtime);

  // Flickering Gothic Streetlamps
  if (runtime?.lamps) {
    for (const lamp of runtime.lamps) {
      if (!isCircleInViewBounds(lamp.x, lamp.y, lamp.radius + 30, viewBounds)) continue;
      const flicker = 0.65 + 0.35 * Math.sin(t * 6.4 + lamp.phase * 4.1) * Math.cos(t * 2.1 + lamp.phase);
      if (allowGlows) {
        const lg = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.radius);
        lg.addColorStop(0, `rgba(253, 230, 138, ${0.22 * flicker})`);
        lg.addColorStop(0.5, `rgba(56, 189, 248, ${0.1 * flicker})`);
        lg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#1E293B";
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(253, 230, 138, ${0.7 + 0.3 * flicker})`;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Active Obstacles (Gothic houses, bookshelves, pillars, clock barriers, secret seals)
  for (const ob of obstacles) {
    if (!isRectVisible(ob, viewBounds, 80)) continue;
    ctx.save();
    if (ob.kind === "secret_seal_door") {
      ctx.fillStyle = "#1E1B4B";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#A855F7";
      ctx.lineWidth = 3;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = "#E9D5FF";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ob.label || "NIÊM PHONG", ob.x + ob.w * 0.5, ob.y + ob.h * 0.5 + 4);
    } else if (ob.kind === "clock_reverse_gate") {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 3;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      ctx.fillStyle = "#BAE6FD";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⏳", ob.x + ob.w * 0.5, ob.y + ob.h * 0.5 + 4);
    } else if (ob.kind === "abandoned_house") {
      // Gothic townhome roof + lit ghostly interior window
      ctx.fillStyle = "#151923";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      // Interior ghostly hearth glow (invisible resident house)
      const hFlick = 0.65 + 0.35 * Math.sin(t * 4.5 + ob.x);
      ctx.fillStyle = `rgba(253, 230, 138, ${0.28 * hFlick})`;
      ctx.fillRect(ob.x + 22, ob.y + 22, 34, 24);
      // Furnishings outline on doorway window
      ctx.strokeStyle = "rgba(56, 189, 248, 0.32)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ob.x + 16, ob.y + 16, ob.w - 32, ob.h - 32);
    } else if (ob.kind === "bookshelf_monolith") {
      ctx.fillStyle = "#171422";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = "#60A5FA";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      // Spines of archived dossiers
      for (let bx = ob.x + 12; bx < ob.x + ob.w - 14; bx += 16) {
        ctx.fillStyle = bx % 32 === 0 ? "#475569" : "#334155";
        ctx.fillRect(bx, ob.y + 12, 10, ob.h - 24);
      }
    } else {
      ctx.fillStyle = ob.kind === "void_obsidian" ? "#0D0A18" : "#182030";
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeStyle = ob.kind === "dynamic_shift_slab" ? "#A855F7" : "#64748B";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
    }
    ctx.restore();
  }

  // Zone 2 Shifting Nameless Statues (visually face current statue angle)
  for (const st of RELIC2_TOMB_STATUES) {
    const sx = 1480 + ((st.id - 1) % 3) * 340;
    const sy = st.id <= 3 ? 2860 : 3440;
    if (!isCircleInViewBounds(sx, sy, 60, viewBounds)) continue;
    const ang = runtime?.statuesAngles?.[st.id] || 0;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = progress.relic2Solved && st.isTrue ? "#FDE68A" : "#94A3B8";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.rotate(ang);
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    // Faceless blank stone band
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(4, -5, 7, 10);
    ctx.restore();
    ctx.fillStyle = st.isTrue && progress.tombInscriptionsRead ? "#FDE68A" : "#CBD5E1";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`#${st.id}`, sx, sy - 32);
  }

  // Floating self-opening mutating books in Library (Zone 4)
  if (isCircleInViewBounds(2140, 1840, 560, viewBounds)) {
    const bp = runtime?.bookPulsePhase || t * 2;
    for (let i = 0; i < 6; i++) {
      const bx = 1780 + (i % 3) * 320 + Math.sin(bp + i) * 14;
      const by = 1660 + Math.floor(i / 3) * 340 + Math.cos(bp * 0.8 + i) * 12;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.sin(bp * 0.5 + i) * 0.25);
      ctx.fillStyle = "#E2E8F0";
      ctx.fillRect(-10, -7, 20, 14);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -7, 20, 14);
      ctx.restore();
    }
  }

  // Fleeting Translucent Human Silhouettes
  if (runtime?.shadowSilhouettes) {
    for (const sh of runtime.shadowSilhouettes) {
      if (!isCircleInViewBounds(sh.x, sh.y, 40, viewBounds)) continue;
      const fade = Math.sin((sh.life / sh.maxLife) * Math.PI);
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade * 0.55);
      ctx.translate(sh.x, sh.y);
      ctx.fillStyle = "#94A3B8";
      ctx.beginPath();
      ctx.arc(0, -14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.ellipse(0, 4, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Interactive Nodes & Ancient Chests
  const nearest = engine.player ? findNearestVoidCityInteractable(engine.player.x, engine.player.y, progress, runtime) : null;
  for (const node of VOID_CITY_INTERACTABLES) {
    if (!isCircleInViewBounds(node.x, node.y, node.radius + 40, viewBounds)) continue;
    const isNearest = nearest && nearest.id === node.id;
    const pulse = 0.72 + 0.28 * Math.sin(t * 3.5 + node.x * 0.01);
    const isSolvedRelic =
      (node.relicId === "relic_1_astrolabe" && progress.relic1Solved) ||
      (node.relicId === "relic_2_nameless_tomb" && progress.relic2Solved) ||
      (node.relicId === "relic_3_sealed_archive" && progress.relic3Solved) ||
      (node.relicId === "relic_4_theater_masks" && progress.relic4Solved) ||
      (node.relicId === "relic_5_mirror_vault" && progress.relic5Solved) ||
      (node.relicId === "relic_6_origin_sanctum" && progress.relic6Solved);
    const chestOpened = node.chestId && progress.openedChests.includes(node.chestId);

    ctx.save();
    ctx.translate(node.x, node.y);
    const color =
      node.kind === "boss_altar"
        ? "#EF4444"
        : isSolvedRelic || chestOpened
        ? "#FDE68A"
        : node.kind === "relic_puzzle"
        ? "#C084FC"
        : node.kind === "ancient_chest"
        ? "#F59E0B"
        : "#38BDF8";

    ctx.strokeStyle = isNearest ? "#FFFFFF" : color;
    ctx.globalAlpha = isNearest ? 0.95 : 0.62 * pulse;
    ctx.lineWidth = isNearest ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, node.kind === "relic_puzzle" ? 30 : 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.88;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    const glyph =
      node.kind === "ancient_chest"
        ? (chestOpened ? "📭" : "🧰")
        : node.kind === "clock_lever"
        ? "⏳"
        : node.kind === "boss_altar"
        ? "📜"
        : node.kind === "relic_puzzle"
        ? (isSolvedRelic ? "✦" : "❖")
        : node.kind === "trung_dossier"
        ? "🗂️"
        : "✧";
    ctx.fillText(glyph, 0, 5);

    if (isNearest) {
      ctx.fillStyle = "#F8FAFC";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(engine.currentLang === "en" ? node.label.en : node.label.vi, 0, -34);
    }
    ctx.restore();
  }

  // Boss ending dropped single page on floor
  if (runtime?.endingPageSpawned && runtime.endingPagePos && isCircleInViewBounds(runtime.endingPagePos.x, runtime.endingPagePos.y, 40, viewBounds)) {
    const ep = runtime.endingPagePos;
    ctx.save();
    ctx.translate(ep.x, ep.y + Math.sin(t * 3) * 3);
    ctx.fillStyle = "#FEF3C7";
    ctx.fillRect(-10, -14, 20, 26);
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -14, 20, 26);
    ctx.restore();
  }

  void VOID_CITY_CHESTS;
}

// ---------------------------------------------------------------------------
// 3. MAP 5 HERO VISUAL AURAS (Ấn Vô Danh / Mặt Nạ Ký Ức / Mảnh Khởi Nguyên)
// ---------------------------------------------------------------------------

export function drawVoidCityHeroAura(ctx, heroX, heroY, radius, progressInput, t) {
  const p = normalizeVoidCityProgress(progressInput);
  if (!p.namelessSealActive && !p.memoryMaskActive && !p.originFragmentForged) return;
  ctx.save();
  ctx.translate(heroX, heroY);
  if (p.namelessSealActive) {
    ctx.save();
    ctx.rotate(t * 0.9);
    ctx.strokeStyle = "rgba(253, 230, 138, 0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  if (p.memoryMaskActive) {
    ctx.save();
    ctx.rotate(-t * 1.4);
    ctx.strokeStyle = "rgba(192, 132, 252, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, 0, Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, Math.PI, Math.PI * 1.75);
    ctx.stroke();
    ctx.restore();
  }
  if (p.originFragmentForged) {
    ctx.save();
    ctx.rotate(t * 0.5);
    ctx.strokeStyle = "rgba(224, 242, 254, 0.78)";
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.fillStyle = "#FEF08A";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (radius + 23), Math.sin(a) * (radius + 23), 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 4. MAP 5 ENEMIES & FINAL BOSS: KẺ GIỮ HỒ SƠ
// ---------------------------------------------------------------------------

export function drawVoidCityEnemySprite(ctx, enemy, t, hitFlash) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.facing || 0);
  const r = enemy.radius || 20;
  const kind = enemy.voidVariant || "faceless_statue";

  if (kind === "mirror_dweller") {
    ctx.fillStyle = hitFlash ? "#FFFFFF" : "#0E7490";
    ctx.strokeStyle = "#67E8F9";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(r * 1.1, 0);
    ctx.lineTo(0, r * 0.85);
    ctx.lineTo(-r, 0);
    ctx.lineTo(0, -r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "shadow_clone") {
    ctx.fillStyle = hitFlash ? "#E9D5FF" : "#1E1B4B";
    ctx.strokeStyle = "#A855F7";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(r * 0.35, -4, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.35, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "relic_guardian") {
    ctx.fillStyle = hitFlash ? "#FEF3C7" : "#334155";
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "erased_shadow") {
    ctx.fillStyle = hitFlash ? "#CBD5E1" : "#090D16";
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Blank scratched face oval
    ctx.fillStyle = "#E2E8F0";
    ctx.beginPath();
    ctx.ellipse(r * 0.25, 0, r * 0.32, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // faceless_statue
    ctx.fillStyle = hitFlash ? "#FFFFFF" : "#475569";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Smooth featureless face band
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(2, -r * 0.42, r * 0.55, r * 0.84);
  }
  void t;
  ctx.restore();
}

export function drawVoidCityBossEntityScene(ctx, boss, t) {
  ctx.save();
  ctx.translate(boss.x, boss.y);
  const r = boss.radius || 58;
  const hit = (boss.hitFlash || 0) > 0;
  const phase = boss.phase || 1;

  // Outer rotating page-storm ring
  ctx.save();
  ctx.rotate(t * (phase >= 2 ? 2.4 : 1.5));
  const pageCount = phase >= 2 ? 10 : 7;
  for (let i = 0; i < pageCount; i++) {
    const a = (Math.PI * 2 * i) / pageCount;
    const dist = r * 1.42 + Math.sin(t * 4 + i) * 8;
    const px = Math.cos(a) * dist;
    const py = Math.sin(a) * dist;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a + Math.PI * 0.5);
    ctx.fillStyle = i % 2 === 0 ? "#FEF3C7" : "#E2E8F0";
    ctx.fillRect(-7, -10, 14, 20);
    ctx.strokeStyle = phase >= 2 ? "#C084FC" : "#38BDF8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -10, 14, 20);
    ctx.restore();
  }
  ctx.restore();

  // Giant Abyssal Cloak Body
  ctx.fillStyle = hit ? "#E2E8F0" : "#0B0D18";
  ctx.strokeStyle = phase >= 2 ? "#A855F7" : "#94A3B8";
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = (Math.PI * 2 * k) / 12 + Math.sin(t * 2 + k) * 0.06;
    const rad = r * (k % 2 === 0 ? 1.1 : 0.88);
    if (k === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swirling Paper Vortex where the Face should be
  ctx.fillStyle = "#030408";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
  ctx.fill();
  for (let f = 0; f < 5; f++) {
    const fa = -t * 3.8 + (Math.PI * 2 * f) / 5;
    ctx.save();
    ctx.rotate(fa);
    ctx.fillStyle = f % 2 === 0 ? "#FDE68A" : "#BAE6FD";
    ctx.fillRect(6, -4, 14, 8);
    ctx.restore();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5. ATMOSPHERE OVERLAY: Silver-Azure Dust Motes, Drifting Fog, Boss/Zone Dim
// ---------------------------------------------------------------------------

export function renderVoidCityAtmosphere(ctx, engine, t, viewW, viewH) {
  const runtime = engine.voidCityRuntime;
  if (!runtime) return;
  const perf = engine.getPerformanceProfile?.() || { tier: "high", enableRadialGlows: true };
  const allowGlows = perf.enableRadialGlows !== false;
  ctx.save();

  // Pale silver-azure ash & page-flakes drifting through twilight air
  const count = perf.tier === "low" ? 10 : perf.tier === "medium" ? 18 : 26;
  for (let i = 0; i < count; i++) {
    const x = ((i * 199 + t * (14 + (i % 4) * 5) + Math.sin(t + i) * 38) % (viewW + 60)) - 30;
    const y = ((i * 131 + t * (18 + (i % 3) * 7)) % (viewH + 60)) - 30;
    ctx.fillStyle =
      i % 3 === 0
        ? "rgba(253, 230, 138, 0.34)"
        : i % 3 === 1
        ? "rgba(186, 230, 253, 0.32)"
        : "rgba(192, 132, 252, 0.28)";
    ctx.fillRect(x, y, 4, 5);
  }

  // Drifting Fog Pockets
  if (allowGlows) {
    for (let m = 0; m < 3; m++) {
      const mx = ((t * (12 + m * 5) + m * 360) % (viewW + 300)) - 150;
      const my = (m * 220 + Math.cos(t * 0.28 + m) * 40) % viewH;
      const g = ctx.createRadialGradient(mx, my, 20, mx, my, 250);
      g.addColorStop(0, m % 2 === 0 ? "rgba(56, 189, 248, 0.06)" : "rgba(168, 85, 247, 0.07)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // Vision warp / dim during zone darkness or Boss Keeper of Dossiers skills
  const dim = Math.min(0.75, (engine.voidCityVisionDim || 0) + (runtime.visionDimFactor || 0) * 0.35);
  const vg = ctx.createRadialGradient(
    viewW * 0.5,
    viewH * 0.5,
    Math.min(viewW, viewH) * Math.max(0.14, 0.36 - dim * 0.16),
    viewW * 0.5,
    viewH * 0.5,
    Math.max(viewW, viewH) * 0.72
  );
  vg.addColorStop(0, "rgba(6, 7, 11, 0)");
  vg.addColorStop(1, `rgba(4, 5, 10, ${Math.min(0.82, 0.26 + dim)})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.restore();
}
