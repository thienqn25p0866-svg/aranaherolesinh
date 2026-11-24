// Stylized-Realism 2D MOBA VFX Material & Geometry Library
// Strictly zero ctx.shadowBlur usage; safe under Node stubbed Canvas 2D contexts.

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function safeNum(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

export function safeRadius(r, minR = 0.25) {
  return Math.max(minR, Number.isFinite(r) ? r : minR);
}

export function colorWithAlpha(col, alpha = 1) {
  const a = clamp(safeNum(alpha, 1), 0, 1);
  if (typeof col !== "string") return `rgba(148, 163, 184, ${a.toFixed(3)})`;
  const s = col.trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
    } else if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
    }
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (m) {
    const r = Math.round(Number(m[1]));
    const g = Math.round(Number(m[2]));
    const b = Math.round(Number(m[3]));
    const baseA = m[4] !== undefined ? clamp(Number(m[4]), 0, 1) : 1;
    return `rgba(${r}, ${g}, ${b}, ${(baseA * a).toFixed(3)})`;
  }
  return `rgba(148, 163, 184, ${a.toFixed(3)})`;
}

export function resolvePalette(primary, highlight, shadow, rim, isMono = false) {
  if (isMono) {
    return {
      primary: "#0F172A",
      highlight: "#FFFFFF",
      shadow: "#000000",
      rim: "#CBD5E1",
    };
  }
  return {
    primary: primary || "#38BDF8",
    highlight: highlight || "#E0F2FE",
    shadow: shadow || "#0F172A",
    rim: rim || "#BAE6FD",
  };
}

// ============================================================================
// BOUNDED OFFSCREEN SPRITE-STAMP CACHE (Mobile/Android FPS optimization)
// Strictly safe when `document` is undefined (Node test environment).
// ============================================================================
const STAMP_CACHE_MAX = 96;
const stampCache = new Map();

function getCachedStamp(key, sizePx, painter) {
  if (typeof document === "undefined") return null;
  if (stampCache.has(key)) {
    const hit = stampCache.get(key);
    // Refresh LRU order
    stampCache.delete(key);
    stampCache.set(key, hit);
    return hit;
  }
  try {
    const dim = Math.max(16, Math.min(256, Math.round(sizePx)));
    const canvas = document.createElement("canvas");
    canvas.width = dim;
    canvas.height = dim;
    const c2d = canvas.getContext("2d");
    if (!c2d) return null;
    painter(c2d, dim);
    if (stampCache.size >= STAMP_CACHE_MAX) {
      const oldestKey = stampCache.keys().next().value;
      if (oldestKey !== undefined) stampCache.delete(oldestKey);
    }
    stampCache.set(key, canvas);
    return canvas;
  } catch {
    return null;
  }
}

export function drawCachedGlowPool(ctx, x, y, radius, color, alpha = 0.25, tiltY = 0.68, isMono = false) {
  const rad = safeRadius(radius, 4);
  const a = clamp(safeNum(alpha, 0.25), 0, 0.85);
  if (a <= 0.01) return;
  const col = isMono ? "#CBD5E1" : (color || "#38BDF8");
  const cx = safeNum(x, 0);
  const cy = safeNum(y, 0);
  const ty = clamp(safeNum(tiltY, 0.68), 0.35, 1.15);

  // Quantize radius into 4 buckets for high cache hit-rate on Android
  const bucket = rad < 36 ? 64 : rad < 72 ? 96 : rad < 120 ? 128 : 160;
  const stamp = typeof ctx.drawImage === "function"
    ? getCachedStamp(`glow:${col}:${bucket}`, bucket, (sCtx, dim) => {
        const half = dim * 0.5;
        const g = sCtx.createRadialGradient(half, half, 0, half, half, half);
        g.addColorStop(0, colorWithAlpha(col, 0.85));
        g.addColorStop(0.42, colorWithAlpha(col, 0.34));
        g.addColorStop(0.78, colorWithAlpha(col, 0.09));
        g.addColorStop(1, "rgba(0,0,0,0)");
        sCtx.fillStyle = g;
        sCtx.beginPath();
        sCtx.arc(half, half, half, 0, Math.PI * 2);
        sCtx.fill();
      })
    : null;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ty);
  ctx.globalAlpha *= a;
  if (stamp) {
    ctx.drawImage(stamp, -rad, -rad, rad * 2, rad * 2);
  } else {
    const g = ctx.createRadialGradient(0, 0, rad * 0.05, 0, 0, rad);
    g.addColorStop(0, colorWithAlpha(col, 0.85));
    g.addColorStop(0.45, colorWithAlpha(col, 0.32));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGroundLightPool(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const radius = safeRadius(opts.radius, 36);
  const tiltY = clamp(safeNum(opts.tiltY, 0.68), 0.35, 1.05);
  const isMono = Boolean(opts.isMono);
  const alpha = clamp(safeNum(opts.alpha, 0.34), 0, 0.72);
  if (alpha <= 0.01) return;
  const col = opts.color || "#38BDF8";
  const sec = opts.secondaryColor || col;

  // Soft outer ambient pool + crisp inner focal bounce
  drawCachedGlowPool(ctx, x, y, radius, col, alpha * 0.65, tiltY, isMono);
  drawCachedGlowPool(ctx, x, y, radius * 0.56, sec, alpha * 0.55, tiltY, isMono);
}

export function drawStage4DissipationOverlay(ctx, opts = {}) {
  const radius = safeRadius(opts.radius, 36);
  const f = clamp(safeNum(opts.progress, 0.5), 0, 1);
  const seed = safeNum(opts.seed, 1);
  const isMono = Boolean(opts.isMono);
  const primary = isMono ? "#CBD5E1" : (opts.primary || "#F97316");
  const secondary = isMono ? "#F8FAFC" : (opts.secondary || "#FDE047");
  const count = Math.max(2, Math.min(8, Math.floor(safeNum(opts.count, 5))));
  const kind = opts.kind || "ember"; // ember | frost | spore | void | spark

  // Peak atmospheric drift during cooling phase (0.18..0.85)
  const driftEnv = f < 0.15 ? f / 0.15 : Math.pow(clamp((1 - f) / 0.85, 0, 1), 1.1);
  if (driftEnv <= 0.02) return;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const frac = (i + 0.5) / count;
    const a = seed * 1.7 + frac * Math.PI * 2 + f * (kind === "void" ? -1.1 : 0.9);
    const dist = radius * (0.28 + ((i * 29) % 7) * 0.09);
    const lift = f * radius * (kind === "frost" ? 0.14 : 0.42) + Math.sin(seed + i * 2.1) * 4;
    const px = Math.cos(a) * dist;
    const py = Math.sin(a) * dist * 0.68 - lift;
    const sz = Math.max(1.2, radius * 0.055 * (1 - f * 0.55));
    ctx.globalAlpha = driftEnv * (0.45 + (i % 2) * 0.25);

    if (kind === "frost") {
      ctx.fillStyle = i % 2 === 0 ? primary : secondary;
      ctx.beginPath();
      ctx.moveTo(px, py - sz * 1.3);
      ctx.lineTo(px + sz, py);
      ctx.lineTo(px, py + sz * 1.3);
      ctx.lineTo(px - sz, py);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "spark") {
      ctx.strokeStyle = i % 2 === 0 ? secondary : primary;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(px - sz, py - sz * 0.5);
      ctx.lineTo(px + sz, py + sz * 0.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = i % 2 === 0 ? secondary : primary;
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draw a 3D multi-plane faceted shard (ice crystal, rock boulder, steel armor plate,
 * obsidian mirror glass, celestial prism, or crimson blood crystal).
 */
export function drawFacetedShard(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const size = safeRadius(opts.size, 3);
  const rot = safeNum(opts.rot, 0);
  const scaleX = safeNum(opts.scaleX, 1);
  const scaleY = safeNum(opts.scaleY, 1);
  const aspect = safeNum(opts.aspect, 1.35);
  const shape = opts.shape || "crystal"; // crystal | rock | plate | shard | paper
  const isMono = Boolean(opts.isMono);
  const pal = resolvePalette(opts.primary, opts.highlight, opts.shadow, opts.rim, isMono);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scaleX, scaleY);

  if (shape === "paper") {
    const w = size * 1.1;
    const h = size * 1.45;
    const curl = Math.sin(rot * 3.1) * size * 0.28;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.5);
    ctx.quadraticCurveTo(0, -h * 0.5 + curl, w * 0.5, -h * 0.48);
    ctx.lineTo(w * 0.45, h * 0.52);
    ctx.quadraticCurveTo(0, h * 0.46 - curl, -w * 0.48, h * 0.48);
    ctx.closePath();
    ctx.fillStyle = isMono ? "#E2E8F0" : (opts.highlight || "#FEFCE8");
    ctx.fill();
    ctx.strokeStyle = isMono ? "#0F172A" : (opts.rim || "#CA8A04");
    ctx.lineWidth = Math.max(0.9, size * 0.12);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shape === "plate") {
    // Beveled metallic armor plate
    const w = size * 1.05;
    const h = size * 0.72;
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.45);
    ctx.lineTo(-w * 0.35, -h);
    ctx.lineTo(w * 0.8, -h * 0.75);
    ctx.lineTo(w, h * 0.35);
    ctx.lineTo(w * 0.25, h);
    ctx.lineTo(-w * 0.82, h * 0.65);
    ctx.closePath();
    ctx.fillStyle = pal.shadow;
    ctx.fill();

    // Lit upper-left bevel facet
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.45);
    ctx.lineTo(-w * 0.35, -h);
    ctx.lineTo(w * 0.8, -h * 0.75);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = pal.primary;
    ctx.fill();

    // Specular ridge
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -h);
    ctx.lineTo(0, 0);
    ctx.lineTo(w * 0.8, -h * 0.75);
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = Math.max(1.0, size * 0.15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.45);
    ctx.lineTo(-w * 0.35, -h);
    ctx.lineTo(w * 0.8, -h * 0.75);
    ctx.lineTo(w, h * 0.35);
    ctx.lineTo(w * 0.25, h);
    ctx.lineTo(-w * 0.82, h * 0.65);
    ctx.closePath();
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shape === "rock") {
    // Craggy multi-plane stone chunk
    const pts = [
      [-size * 0.9, -size * 0.25],
      [-size * 0.45, -size * 0.95],
      [size * 0.55, -size * 0.78],
      [size * 0.95, size * 0.08],
      [size * 0.4, size * 0.88],
      [-size * 0.68, size * 0.72],
    ];
    ctx.beginPath();
    pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.fillStyle = pal.shadow;
    ctx.fill();

    // Lit top & left bevel facets for crisp 3D depth
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.lineTo(size * 0.12, -size * 0.05);
    ctx.lineTo(-size * 0.25, size * 0.2);
    ctx.closePath();
    ctx.fillStyle = pal.primary;
    ctx.fill();

    // Inner craggy fracture seam + rim highlight ridge
    ctx.beginPath();
    ctx.moveTo(pts[1][0], pts[1][1]);
    ctx.lineTo(size * 0.12, -size * 0.05);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.moveTo(size * 0.12, -size * 0.05);
    ctx.lineTo(pts[4][0] * 0.65, pts[4][1] * 0.65);
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = Math.max(0.9, size * 0.13);
    ctx.stroke();

    ctx.beginPath();
    pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.strokeStyle = isMono ? "#020617" : "rgba(5, 8, 17, 0.72)";
    ctx.lineWidth = Math.max(1.3, size * 0.18);
    ctx.stroke();
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Default: 3D multi-plane faceted crystal / ice prism / glass shard
  const topY = -size * aspect;
  const botY = size * aspect * 0.92;
  const wL = -size * 0.68;
  const wR = size * 0.68;
  const midX = size * 0.08;
  const midY = -size * 0.08;

  // Deep shadow underside right-bottom face
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(wR, 0);
  ctx.lineTo(0, botY);
  ctx.lineTo(wL, 0);
  ctx.closePath();
  ctx.fillStyle = pal.shadow;
  ctx.fill();

  // Mid-tone right-top refraction bevel face
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(wR, 0);
  ctx.lineTo(midX, midY);
  ctx.closePath();
  ctx.fillStyle = colorWithAlpha(pal.primary, 0.56);
  ctx.fill();

  // Lit primary left face
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(0, botY);
  ctx.lineTo(wL, 0);
  ctx.closePath();
  ctx.fillStyle = pal.primary;
  ctx.fill();

  // Upper-left specular prism face
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(wL * 0.92, -size * 0.06);
  ctx.closePath();
  ctx.fillStyle = pal.highlight;
  ctx.fill();

  // Internal crystal spine + crisp bevel rim
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(0, botY);
  ctx.moveTo(wL * 0.55, 0);
  ctx.lineTo(midX, midY);
  ctx.strokeStyle = pal.highlight;
  ctx.lineWidth = Math.max(0.85, size * 0.12);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(wR, 0);
  ctx.lineTo(0, botY);
  ctx.lineTo(wL, 0);
  ctx.closePath();
  ctx.strokeStyle = isMono ? "#020617" : "rgba(5, 8, 17, 0.72)";
  ctx.lineWidth = Math.max(1.4, size * 0.2);
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.strokeStyle = pal.rim;
  ctx.lineWidth = Math.max(0.85, size * 0.11);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw translucent, feathered "khói mờ" curling smoke/vapor mist that never blocks screen visibility.
 */
export function drawVolumetricSmokeLobe(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const radius = safeRadius(opts.radius, 6);
  const seed = safeNum(opts.seed, 1);
  const lifeRatio = clamp(safeNum(opts.lifeRatio, 0.3), 0, 1);
  const isMono = Boolean(opts.isMono);
  const fadeEnv = lifeRatio < 0.14 ? lifeRatio / 0.14 : Math.pow(Math.max(0, 1 - (lifeRatio - 0.14) / 0.86), 1.25);
  const rawAlpha = safeNum(opts.alpha, fadeEnv * 0.19);
  const alpha = clamp(Math.min(0.24, rawAlpha), 0, 0.24);
  if (alpha <= 0.008) return;

  const baseCol = isMono ? "#475569" : (opts.color || opts.primary || "#64748B");
  const shadowCol = isMono ? "#1E293B" : (opts.shadowColor || opts.shadow || "#334155");
  const rimCol = isMono ? "#CBD5E1" : (opts.rimColor || opts.highlight || "#94A3B8");
  const swirl = lifeRatio * 2.4 + seed;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;

  const wisps = [
    { ox: Math.cos(swirl) * radius * 0.26, oy: radius * 0.14, r: radius * 0.88, col: shadowCol, str: 0.78 },
    { ox: Math.sin(swirl * 1.3) * radius * 0.24, oy: -radius * 0.16, r: radius * 0.92, col: baseCol, str: 0.85 },
    { ox: -Math.cos(swirl * 0.9) * radius * 0.18, oy: -radius * 0.26, r: radius * 0.62, col: rimCol, str: 0.52 },
  ];

  for (let i = 0; i < wisps.length; i++) {
    const w = wisps[i];
    const wr = safeRadius(w.r, 2);
    const wg = ctx.createRadialGradient(w.ox, w.oy, 0, w.ox, w.oy, wr);
    wg.addColorStop(0, colorWithAlpha(w.col, 0.72 * w.str));
    wg.addColorStop(0.5, colorWithAlpha(w.col, 0.26 * w.str));
    wg.addColorStop(0.84, colorWithAlpha(w.col, 0.05 * w.str));
    wg.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.arc(w.ox, w.oy, wr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delicate curling vapor wisp rim arc (adds volumetric motion without opacity)
  ctx.strokeStyle = colorWithAlpha(rimCol, 0.42);
  ctx.lineWidth = Math.max(0.9, radius * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -radius * 0.08, safeRadius(radius * 0.68, 2), Math.PI * 1.08 + Math.sin(swirl) * 0.25, Math.PI * 1.82 + Math.sin(swirl) * 0.25);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a velocity-stretched viscous liquid droplet (blood, acid bile, molten ichor, void tar)
 * with specular highlight so liquid splatters read as wet matter rather than colored confetti.
 */
export function drawViscousDroplet(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const hasEndVec = opts.vx !== undefined || opts.vy !== undefined;
  const vx = safeNum(opts.vx, 0);
  const vy = safeNum(opts.vy, 0);
  const fallbackWidth = opts.width !== undefined ? safeRadius(opts.width, 2) * 0.55 : 2.2;
  const radius = safeRadius(opts.radius, fallbackWidth);
  const isMono = Boolean(opts.isMono);
  const speed = Math.hypot(vx, vy);
  const ang = hasEndVec && speed > 6 ? Math.atan2(vy, vx) : safeNum(opts.rot ?? opts.angle, 0);
  const stretch = opts.length !== undefined
    ? clamp(safeRadius(opts.length, 6) / Math.max(2, radius * 1.45), 1.05, 3.2)
    : speed > 18 ? clamp(1 + speed / 260, 1.05, 2.35) : 1.05;

  const bodyCol = isMono ? "#0F172A" : (opts.color || opts.primary || "#991B1B");
  const rimCol = isMono ? "#E2E8F0" : (opts.rimColor || opts.highlight || "#FCA5A5");

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);

  const len = radius * stretch * 1.45;
  ctx.beginPath();
  ctx.moveTo(radius * 1.05, 0);
  ctx.quadraticCurveTo(radius * 0.35, -radius * 0.92, -len, 0);
  ctx.quadraticCurveTo(radius * 0.35, radius * 0.92, radius * 1.05, 0);
  ctx.closePath();
  ctx.fillStyle = bodyCol;
  ctx.fill();

  // Wet specular crescent glint on head
  if (radius >= 2.0) {
    ctx.beginPath();
    ctx.ellipse(radius * 0.25, -radius * 0.28, radius * 0.42, radius * 0.18, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = rimCol;
    ctx.globalAlpha *= 0.72;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw an aerodynamic tapered wind stream S-ribbon with vacuum shadow crease + bright slipstream core.
 */
export function drawWindStreamRibbon(ctx, opts = {}) {
  const hasEndpoints = opts.x1 !== undefined && opts.x2 !== undefined;
  const x1 = safeNum(opts.x1, 0);
  const y1 = safeNum(opts.y1, 0);
  const x2 = safeNum(opts.x2, 24);
  const y2 = safeNum(opts.y2, 0);
  const x = hasEndpoints ? (x1 + x2) * 0.5 : safeNum(opts.x, 0);
  const y = hasEndpoints ? (y1 + y2) * 0.5 : safeNum(opts.y, 0);
  const angle = hasEndpoints ? Math.atan2(y2 - y1, x2 - x1) : safeNum(opts.angle, 0);
  const length = hasEndpoints ? safeRadius(Math.hypot(x2 - x1, y2 - y1), 10) : safeRadius(opts.length, 24);
  const width = safeRadius(opts.width, 6);
  const phase = safeNum(opts.phase !== undefined ? opts.phase : opts.twist, 0);
  const isMono = Boolean(opts.isMono);
  const pal = resolvePalette(opts.color || opts.primary || "#34D399", opts.coreColor || opts.highlight || "#ECFDF5", "#064E3B", "#6EE7B7", isMono);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const segs = 10;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const px = -length * 0.5 + t * length;
    const py = Math.sin(t * Math.PI * 1.65 + phase) * width * 0.9;
    const hw = Math.sin(t * Math.PI) * width * 0.52;
    pts.push({ px, py, hw });
  }

  // Tapered ribbon body
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const p = pts[i];
    if (i === 0) ctx.moveTo(p.px, p.py - p.hw);
    else ctx.lineTo(p.px, p.py - p.hw);
  }
  for (let i = segs; i >= 0; i--) {
    const p = pts[i];
    ctx.lineTo(p.px, p.py + p.hw);
  }
  ctx.closePath();
  ctx.fillStyle = pal.primary;
  ctx.fill();

  // Sharp core filament
  ctx.beginPath();
  for (let i = 1; i < segs; i++) {
    const p = pts[i];
    if (i === 1) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  }
  ctx.strokeStyle = pal.highlight;
  ctx.lineWidth = Math.max(1.0, width * 0.24);
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a forked jagged electrical discharge bolt with plasma sheath + primary bolt + 2 forks + end corona.
 */
export function drawBranchingArc(ctx, opts = {}) {
  const x1 = safeNum(opts.x1, 0);
  const y1 = safeNum(opts.y1, 0);
  const x2 = safeNum(opts.x2, 40);
  const y2 = safeNum(opts.y2, 0);
  const seed = safeNum(opts.seed, 1.3);
  const width = safeRadius(opts.width, 2.2);
  const isMono = Boolean(opts.isMono);
  const pal = resolvePalette(opts.color || "#38BDF8", opts.coreColor || "#FFFFFF", "#0284C7", "#BAE6FD", isMono);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;

  const nx = -dy / dist;
  const ny = dx / dist;
  const segs = Math.max(4, Math.min(9, Math.floor(dist / 16)));
  const amp = clamp(dist * 0.14, 4, 24);

  const nodes = [{ x: x1, y: y1 }];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const jit = Math.sin(seed * 7.3 + i * 4.17) * amp * Math.sin(t * Math.PI);
    nodes.push({ x: x1 + dx * t + nx * jit, y: y1 + dy * t + ny * jit });
  }
  nodes.push({ x: x2, y: y2 });

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const strokeBolt = () => {
    ctx.beginPath();
    nodes.forEach((n, idx) => (idx === 0 ? ctx.moveTo(n.x, n.y) : ctx.lineTo(n.x, n.y)));
    ctx.stroke();
  };

  // Outer plasma sheath
  ctx.strokeStyle = pal.primary;
  ctx.lineWidth = width * 2.4;
  ctx.globalAlpha *= 0.45;
  strokeBolt();

  // Core hot filament
  ctx.globalAlpha /= 0.45;
  ctx.strokeStyle = pal.highlight;
  ctx.lineWidth = width;
  strokeBolt();

  // 2 secondary forks branching off midpoints
  for (let f = 0; f < 2; f++) {
    const idx = Math.max(1, Math.min(nodes.length - 2, Math.floor((nodes.length - 1) * (f === 0 ? 0.38 : 0.68))));
    const base = nodes[idx];
    const forkAngle = Math.atan2(dy, dx) + (f === 0 ? 0.68 : -0.74) * (Math.sin(seed + f) >= 0 ? 1 : -1);
    const forkLen = dist * (0.2 + 0.08 * f);
    const midX = base.x + Math.cos(forkAngle + 0.18) * forkLen * 0.52;
    const midY = base.y + Math.sin(forkAngle + 0.18) * forkLen * 0.52;
    const endX = base.x + Math.cos(forkAngle) * forkLen;
    const endY = base.y + Math.sin(forkAngle) * forkLen;

    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = Math.max(1.2, width * 1.15);
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(midX, midY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = Math.max(0.7, width * 0.52);
    ctx.globalAlpha /= 0.7;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Perspective-tilted ground zone base with broken forged/carved rings, shadow grounding,
 * cardinal rune notches, and directional energy wash (replaces monotonous flat dashed circles).
 */
export function drawPerspectiveZoneBase(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const radius = safeRadius(opts.radius, 24);
  const tiltY = clamp(safeNum(opts.tiltY, 0.86), 0.45, 1.0);
  const rot = safeNum(opts.rot !== undefined ? opts.rot : (opts.pulse !== undefined ? opts.pulse * 1.4 : 0), 0);
  const primary = opts.isMono ? "#E2E8F0" : (opts.primary || "#38BDF8");
  const secondary = opts.isMono ? "#94A3B8" : (opts.secondary || opts.rim || "#0284C7");
  const darkRim = opts.isMono ? "#0F172A" : (opts.darkRim || opts.shadow || "#020617");
  const segments = Math.max(3, Math.min(8, Math.floor(safeNum(opts.segments, 4))));

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, tiltY);

  // Dark ground contact under-ring for figure-ground separation
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = darkRim;
  ctx.lineWidth = Math.max(3.5, radius * 0.055);
  ctx.globalAlpha *= 0.55;
  ctx.stroke();
  ctx.globalAlpha /= 0.55;

  // Radial atmospheric wash
  const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0, opts.isMono ? "rgba(255,255,255,0.28)" : (opts.coreWash || "rgba(56, 189, 248, 0.34)"));
  grad.addColorStop(0.62, opts.isMono ? "rgba(148,163,184,0.16)" : (opts.midWash || "rgba(2, 132, 199, 0.18)"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Tapered broken outer calligraphic arcs (replaces dashed circle!)
  const span = (Math.PI * 2) / segments;
  for (let i = 0; i < segments; i++) {
    const startA = rot + i * span + 0.08;
    const endA = rot + (i + 1) * span - 0.16;
    const arcMid = (startA + endA) * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.96, startA, endA);
    ctx.strokeStyle = i % 2 === 0 ? primary : secondary;
    ctx.lineWidth = Math.max(2.0, radius * 0.032);
    ctx.lineCap = "round";
    ctx.stroke();

    // Directional notch bevel at leading tip of each arc
    const tipX = Math.cos(endA) * radius * 0.96;
    const tipY = Math.sin(endA) * radius * 0.96;
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.arc(tipX, tipY, Math.max(2.0, radius * 0.028), 0, Math.PI * 2);
    ctx.fill();

    // Inner counter-arc rib
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.68, arcMid - 0.34, arcMid + 0.34);
      ctx.strokeStyle = secondary;
      ctx.lineWidth = Math.max(1.4, radius * 0.02);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Sculpted asymmetrical blade slash / energy wave with:
 * - Dark contrast cavity wake behind the slash
 * - Ghost motion smear after-trail sweeping behind the primary arc
 * - Asymmetric tapered thickness (razor leading edge, thick mid-belly, torn swept tail)
 * - Specular cutting bevel, cross-tension ribs & longitudinal striations
 * - Leading nose fang flare + detached kinetic blade splinters
 */
export function drawSculptedBladeSlash(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const hasStartEnd = opts.startAngle !== undefined && opts.endAngle !== undefined;
  const angle = hasStartEnd ? (safeNum(opts.startAngle, -1) + safeNum(opts.endAngle, 1)) * 0.5 : safeNum(opts.angle, 0);
  const radius = safeRadius(opts.radius, 36);
  const rawSpread = hasStartEnd ? Math.abs(safeNum(opts.endAngle, 1) - safeNum(opts.startAngle, -1)) : safeNum(opts.spread, 2.2);
  const spread = clamp(rawSpread, 0.35, Math.PI * 1.92);
  const p = clamp(safeNum(opts.progress, 0.35), 0, 1);
  const style = opts.style || "steel";
  const isMono = Boolean(opts.isMono);

  const pal = resolvePalette(opts.primary, opts.highlight, opts.shadow, opts.rim, isMono);
  // Snappy swing in first ~32%, then rich lingering dissolve
  const strikeP = clamp(p / 0.38, 0, 1);
  const fade = p < 0.32 ? 1 : Math.pow(clamp((1 - p) / 0.68, 0, 1), 1.15);
  if (fade <= 0.01) return;

  const sweepLead = clamp(strikeP * 1.18 + p * 0.16, 0.28, 1.1);
  const sweepTail = clamp((p - 0.18) * 0.85, 0, 0.56);
  const dir = opts.dir === -1 ? -1 : 1;
  const startA = (-spread * 0.5 + spread * sweepTail * 0.72) * dir;
  const endA = (-spread * 0.5 + spread * sweepLead) * dir;
  const activeSpan = endA - startA;
  if (Math.abs(activeSpan) < 0.12) return;

  const rCurr = radius * (0.8 + Math.sin(Math.min(1, strikeP) * Math.PI * 0.5) * 0.26 + p * 0.06);
  const rawThick = safeRadius(opts.thickness || radius * 0.24, 9);
  const maxThick = clamp(rawThick, 7, 42) * (1 - p * 0.28);
  const segs = 26;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (opts.tiltY && opts.tiltY < 1) {
    ctx.scale(1, clamp(opts.tiltY, 0.5, 1));
  }
  ctx.globalAlpha *= fade;

  const outerPts = [];
  const innerPts = [];
  const midPts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const a = startA + activeSpan * t;
    const env = Math.pow(Math.sin(Math.pow(t, 1.38) * Math.PI), 0.82);
    const ripple =
      style === "fire_dragon"
        ? Math.sin(t * 17 + p * 12) * maxThick * 0.14 * (1 - t * 0.45)
        : style === "void" || style === "shadow_blade" || style === "blood_crystal"
        ? Math.cos(t * 15 - p * 10) * maxThick * 0.13 * (1 - t * 0.35)
        : style === "heavy_earth"
        ? (i % 2 === 0 ? 1 : -0.6) * maxThick * 0.08 * env
        : 0;

    const rOut = Math.max(4, rCurr + maxThick * 0.62 * env + ripple);
    const rIn = Math.max(2, rCurr - maxThick * 0.46 * env);
    const rMid = rIn + (rOut - rIn) * 0.68;

    outerPts.push({ x: Math.cos(a) * rOut, y: Math.sin(a) * rOut, a, rOut, rIn, env });
    innerPts.push({ x: Math.cos(a) * rIn, y: Math.sin(a) * rIn });
    midPts.push({ x: Math.cos(a) * rMid, y: Math.sin(a) * rMid });
  }

  // Layer -1: Grounded 3D perspective drop shadow beneath floating blade arc
  ctx.save();
  ctx.translate(0, Math.max(4, maxThick * 0.24));
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const o = outerPts[i];
    if (i === 0) ctx.moveTo(o.x, o.y);
    else ctx.lineTo(o.x, o.y);
  }
  for (let i = segs; i >= 0; i--) {
    const inn = innerPts[i];
    ctx.lineTo(inn.x, inn.y);
  }
  ctx.closePath();
  ctx.fillStyle = isMono ? "rgba(0,0,0,0.18)" : "rgba(2, 6, 18, 0.22)";
  ctx.fill();
  ctx.restore();

  // Layer 0: Dark contrast under-wake for crisp figure-ground pop
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const o = outerPts[i];
    if (i === 0) ctx.moveTo(o.x, o.y);
    else ctx.lineTo(o.x, o.y);
  }
  for (let i = segs; i >= 0; i--) {
    const a = startA + activeSpan * (i / segs);
    const rWake = Math.max(2, outerPts[i].rIn - maxThick * 0.26 * outerPts[i].env);
    ctx.lineTo(Math.cos(a) * rWake, Math.sin(a) * rWake);
  }
  ctx.closePath();
  const tailPt = outerPts[0];
  const headPt = outerPts[segs];
  const wakeDist = Math.hypot(headPt.x - tailPt.x, headPt.y - tailPt.y);
  if (wakeDist > 1 && typeof ctx.createLinearGradient === "function") {
    const wakeGrad = ctx.createLinearGradient(tailPt.x, tailPt.y, headPt.x, headPt.y);
    wakeGrad.addColorStop(0, colorWithAlpha(pal.shadow, 0.06));
    wakeGrad.addColorStop(0.55, colorWithAlpha(pal.shadow, 0.42));
    wakeGrad.addColorStop(1, colorWithAlpha(pal.shadow, 0.62));
    ctx.fillStyle = wakeGrad;
  } else {
    ctx.fillStyle = colorWithAlpha(pal.shadow, 0.45);
  }
  ctx.fill();
  ctx.restore();

  // Layer 1: Ghost kinetic smear ribbon trailing slightly inside/behind
  ctx.save();
  ctx.globalAlpha *= 0.36;
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const a = startA + activeSpan * (i / segs) - activeSpan * 0.08;
    const rg = Math.max(3, rCurr * 0.9 + maxThick * 0.3 * outerPts[i].env);
    const gx = Math.cos(a) * rg;
    const gy = Math.sin(a) * rg;
    if (i === 0) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  }
  for (let i = segs; i >= 0; i--) {
    const a = startA + activeSpan * (i / segs) - activeSpan * 0.08;
    const rg = Math.max(2, rCurr * 0.9 - maxThick * 0.2 * outerPts[i].env);
    ctx.lineTo(Math.cos(a) * rg, Math.sin(a) * rg);
  }
  ctx.closePath();
  ctx.fillStyle = pal.rim;
  ctx.fill();
  ctx.restore();

  // Layer 2: Primary sculpted 3D blade ribbon with tail-to-tip energy gradient
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const o = outerPts[i];
    if (i === 0) ctx.moveTo(o.x, o.y);
    else ctx.lineTo(o.x, o.y);
  }
  for (let i = segs; i >= 0; i--) {
    const inn = innerPts[i];
    ctx.lineTo(inn.x, inn.y);
  }
  ctx.closePath();
  if (wakeDist > 1 && typeof ctx.createLinearGradient === "function") {
    const bodyGrad = ctx.createLinearGradient(tailPt.x, tailPt.y, headPt.x, headPt.y);
    bodyGrad.addColorStop(0, colorWithAlpha(pal.shadow, 0.08));
    bodyGrad.addColorStop(0.38, colorWithAlpha(pal.primary, 0.64));
    bodyGrad.addColorStop(0.78, colorWithAlpha(pal.rim, 0.88));
    bodyGrad.addColorStop(1, colorWithAlpha(pal.highlight, 0.92));
    ctx.fillStyle = bodyGrad;
  } else {
    ctx.fillStyle = colorWithAlpha(pal.primary, 0.82);
  }
  ctx.fill();

  // Recessed shadow fuller groove along inner 28% width for sculpted 3D blade depth
  ctx.beginPath();
  for (let i = 3; i <= segs - 1; i++) {
    const a = startA + activeSpan * (i / segs);
    const rGroove = outerPts[i].rIn + (outerPts[i].rOut - outerPts[i].rIn) * 0.28;
    const gx = Math.cos(a) * rGroove;
    const gy = Math.sin(a) * rGroove;
    if (i === 3) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  }
  ctx.strokeStyle = colorWithAlpha(pal.shadow, 0.48);
  ctx.lineWidth = Math.max(1.3, maxThick * 0.1);
  ctx.lineCap = "round";
  ctx.stroke();

  // Layer 3: Longitudinal kinetic striations + rim rib
  ctx.strokeStyle = pal.rim;
  ctx.lineCap = "round";
  for (let s = 0; s < 2; s++) {
    const frac = s === 0 ? 0.52 : 0.78;
    ctx.lineWidth = Math.max(1.0, maxThick * 0.08);
    ctx.globalAlpha *= 0.72;
    ctx.beginPath();
    for (let i = 4; i <= segs - 1; i++) {
      const a = startA + activeSpan * (i / segs);
      const rStr = outerPts[i].rIn + (outerPts[i].rOut - outerPts[i].rIn) * frac;
      const px = Math.cos(a) * rStr;
      const py = Math.sin(a) * rStr;
      if (i === 4) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha /= 0.72;
  }

  // Layer 4: Crisp specular cutting bevel along outer crescent (controlled alpha, zero glare)
  ctx.beginPath();
  for (let i = Math.floor(segs * 0.28); i <= segs; i++) {
    const m = midPts[i];
    const o = outerPts[i];
    const bx = m.x * 0.2 + o.x * 0.8;
    const by = m.y * 0.2 + o.y * 0.8;
    if (i === Math.floor(segs * 0.28)) ctx.moveTo(bx, by);
    else ctx.lineTo(bx, by);
  }
  ctx.strokeStyle = colorWithAlpha(pal.highlight, 0.9);
  ctx.lineWidth = Math.max(1.5, maxThick * 0.14);
  ctx.stroke();

  // Layer 5: Sharp leading nose fang & compact cross impact glint
  const tipO = outerPts[segs];
  const tipA = tipO.a;
  const tangentA = tipA + dir * Math.PI * 0.5;
  const tipX = Math.cos(tipA) * rCurr;
  const tipY = Math.sin(tipA) * rCurr;
  ctx.fillStyle = colorWithAlpha(pal.highlight, 0.88);
  ctx.beginPath();
  ctx.moveTo(tipX + Math.cos(tangentA) * maxThick * 0.62, tipY + Math.sin(tangentA) * maxThick * 0.62);
  ctx.lineTo(Math.cos(tipA + dir * 0.09) * (rCurr + maxThick * 0.26), Math.sin(tipA + dir * 0.09) * (rCurr + maxThick * 0.26));
  ctx.lineTo(Math.cos(tipA) * (rCurr - maxThick * 0.32), Math.sin(tipA) * (rCurr - maxThick * 0.32));
  ctx.closePath();
  ctx.fill();

  const starR = Math.max(4, maxThick * 0.34) * fade;
  ctx.beginPath();
  ctx.moveTo(tipX - starR, tipY);
  ctx.lineTo(tipX + starR, tipY);
  ctx.moveTo(tipX, tipY - starR * 0.65);
  ctx.lineTo(tipX, tipY + starR * 0.65);
  ctx.strokeStyle = colorWithAlpha(pal.highlight, 0.8);
  ctx.lineWidth = Math.max(1.2, starR * 0.2);
  ctx.stroke();

  // Layer 6: Detached kinetic 3D splinters / arcs / wind ribbons trailing behind edge
  for (let k = 0; k < 6; k++) {
    const t = 0.14 + k * 0.15;
    const a = startA + activeSpan * t;
    const outDist = rCurr + maxThick * (0.44 + (k % 2) * 0.3) + p * 24;
    const sx = Math.cos(a) * outDist;
    const sy = Math.sin(a) * outDist;
    if (style === "frost" || style === "crystal" || style === "steel" || style === "blood_crystal") {
      drawFacetedShard(ctx, {
        x: sx,
        y: sy,
        size: Math.max(2.6, maxThick * 0.18),
        rot: a + dir * Math.PI * 0.5 + p * 1.5,
        primary: pal.rim,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: pal.highlight,
        isMono,
      });
    } else if (style === "plasma_cyan" || style === "celestial_gold") {
      drawBranchingArc(ctx, {
        x1: Math.cos(a) * (rCurr - maxThick * 0.08),
        y1: Math.sin(a) * (rCurr - maxThick * 0.08),
        x2: sx,
        y2: sy,
        seed: k + p * 11,
        width: 1.4,
        color: pal.rim,
        coreColor: pal.highlight,
        isMono,
      });
    } else if (style === "wind_gale") {
      if (k % 2 === 0) {
        drawWindStreamRibbon(ctx, {
          x: sx,
          y: sy,
          angle: a + dir * Math.PI * 0.5,
          length: Math.max(16, maxThick * 0.85),
          width: Math.max(2.8, maxThick * 0.15),
          phase: p * 14 + k,
          color: pal.rim,
          coreColor: pal.highlight,
          isMono,
        });
      }
    } else {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a + dir * Math.PI * 0.52);
      ctx.fillStyle = k % 2 === 0 ? pal.highlight : pal.rim;
      ctx.beginPath();
      ctx.moveTo(9.5, 0);
      ctx.lineTo(-7, -2.5);
      ctx.lineTo(-3.5, 0);
      ctx.lineTo(-7, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Multi-stage 3D structural explosion with translucent "khói mờ" mist (zero opaque screen cover, zero glare):
 * Stage A (0..0.22): Crisp compact ignition star + hollow 3D compression pressure dome shell
 * Stage B (0..0.90): Sunken perspective ground scorch + 3 asymmetric shockwave crescents
 * Stage C (0.04..1): Soft feathered radial-gradient "khói mờ" mist curls + sculpted radiating energy tongues
 * Stage D (0..1): Parabolic flying 3D debris with perspective ground shadows
 */
export function drawStructuralExplosion(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const radius = safeRadius(opts.radius, 48);
  const p = clamp(safeNum(opts.progress, 0.35), 0, 1);
  const element = opts.element || "fire";
  const isMono = Boolean(opts.isMono);
  const seed = safeNum(opts.seed, (x * 0.13 + y * 0.07) % 10);

  const ELEM_PALETTES = {
    fire: { outer: "#7C2D12", mid: "#EA580C", core: "#FEF08A", rim: "#FB923C", debris: "ember" },
    plasma: { outer: "#0C4A6E", mid: "#0EA5E9", core: "#E0F2FE", rim: "#67E8F9", debris: "arc" },
    void: { outer: "#1E1B4B", mid: "#7E22CE", core: "#F5D0FE", rim: "#C084FC", debris: "shard" },
    frost: { outer: "#164E63", mid: "#0284C7", core: "#F0F9FF", rim: "#BAE6FD", debris: "crystal" },
    earth: { outer: "#292524", mid: "#B45309", core: "#FEF3C7", rim: "#F59E0B", debris: "rock" },
    gold: { outer: "#713F12", mid: "#EAB308", core: "#FEFCE8", rim: "#FDE047", debris: "shard" },
    venom: { outer: "#14532D", mid: "#22C55E", core: "#ECFCCB", rim: "#A3E635", debris: "droplet" },
    blood: { outer: "#450A0A", mid: "#DC2626", core: "#FFE4E6", rim: "#FB7185", debris: "crystal" },
    arcane: { outer: "#312E81", mid: "#6366F1", core: "#EEF2FF", rim: "#A5B4FC", debris: "shard" },
    teal: { outer: "#134E4A", mid: "#14B8A6", core: "#CCFBF1", rim: "#5EEAD4", debris: "wind" },
  };
  const ep = ELEM_PALETTES[element] || ELEM_PALETTES.fire;
  const pal = resolvePalette(opts.color || ep.mid, ep.core, ep.outer, ep.rim, isMono);

  // Fast snap-in, long lingering smooth dissolve
  const fade = p < 0.38 ? 1 : Math.pow(clamp((1 - p) / 0.62, 0, 1), 1.15);
  if (fade <= 0.01) return;

  const easeOut = 1 - Math.pow(1 - Math.min(1, p * 1.95), 2.5);
  const rBlast = radius * (0.36 + 0.66 * easeOut);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= fade;

  // 1. Perspective ground scorch basin (soft translucent center so heroes stay visible) + broken shock arcs
  ctx.save();
  ctx.scale(1, 0.72);
  const scorchGrad = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, rBlast * 0.96);
  scorchGrad.addColorStop(0, isMono ? "rgba(0,0,0,0.34)" : "rgba(2, 6, 23, 0.42)");
  scorchGrad.addColorStop(0.55, colorWithAlpha(pal.shadow, 0.22));
  scorchGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = scorchGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rBlast * 0.96, 0, Math.PI * 2);
  ctx.fill();

  for (let arcIdx = 0; arcIdx < 3; arcIdx++) {
    const a0 = seed + arcIdx * 2.1 + p * 1.15;
    const span = 1.48 - p * 0.42;
    if (span > 0.15) {
      ctx.beginPath();
      ctx.arc(0, 0, rBlast * (0.86 + arcIdx * 0.07), a0, a0 + span);
      ctx.strokeStyle = colorWithAlpha("#020617", 0.55);
      ctx.lineWidth = Math.max(2.6, (1 - p * 0.7) * radius * 0.068);
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.strokeStyle = arcIdx === 0 ? pal.highlight : pal.rim;
      ctx.lineWidth = Math.max(1.5, (1 - p * 0.7) * radius * 0.044);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 2. Hollow 3D Hemispherical Compression Shock-Dome Shell (transparent center, crisp rim highlight)
  if (p < 0.52) {
    const domeAlpha = Math.sin(clamp(p / 0.52, 0, 1) * Math.PI) * 0.48 + (1 - p / 0.52) * 0.25;
    ctx.save();
    ctx.globalAlpha = fade * clamp(domeAlpha, 0, 0.65);
    const domeR = safeRadius(rBlast * 0.88, 4);
    const domeGrad = ctx.createRadialGradient(-domeR * 0.18, -domeR * 0.22, domeR * 0.06, 0, 0, domeR);
    domeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    domeGrad.addColorStop(0.58, "rgba(0, 0, 0, 0)");
    domeGrad.addColorStop(0.8, colorWithAlpha(pal.primary, 0.24));
    domeGrad.addColorStop(0.92, colorWithAlpha(pal.rim, 0.34));
    domeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.ellipse(0, -rBlast * 0.07, domeR, safeRadius(domeR * 0.8, 3), 0, 0, Math.PI * 2);
    ctx.fill();

    // Crisp upper dome specular rim arc
    ctx.strokeStyle = colorWithAlpha(pal.highlight, 0.58);
    ctx.lineWidth = Math.max(1.4, radius * 0.026);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -rBlast * 0.06, safeRadius(domeR * 0.88, 3), Math.PI * 1.12, Math.PI * 1.84);
    ctx.stroke();
    ctx.restore();
  }

  // 3A. Translucent feathered "khói mờ" swirling smoke wisps (ZERO opaque circles!)
  const mistCount = 6;
  const mistRingScale = 0.42 + easeOut * 0.42;
  for (let i = 0; i < mistCount; i++) {
    const a = (Math.PI * 2 / mistCount) * i + seed * 0.65 + p * 0.55;
    const dist = rBlast * (0.38 + ((i * 37) % 10) * 0.03) * mistRingScale;
    const lr = safeRadius(rBlast * (0.28 + (i % 3) * 0.06), 3);
    const lx = Math.cos(a) * dist;
    const ly = Math.sin(a) * dist * 0.82 - p * radius * 0.08;
    const mg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    const mistCol = i % 2 === 0 ? pal.shadow : pal.primary;
    mg.addColorStop(0, colorWithAlpha(mistCol, 0.20));
    mg.addColorStop(0.52, colorWithAlpha(mistCol, 0.08));
    mg.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = mg;
    ctx.globalAlpha = fade * 0.85;
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3B. Sculpted radiating flame / energy tongues curving outward (keeps inner center eye open & clear!)
  const tongueCount = 7;
  for (let i = 0; i < tongueCount; i++) {
    const a = (Math.PI * 2 / tongueCount) * i + seed * 0.85 + p * 0.35;
    const innerDist = rBlast * (0.24 + p * 0.26);
    const outerDist = rBlast * (0.74 + ((i % 3) * 0.12) + p * 0.16);
    const bend = (i % 2 === 0 ? 1 : -1) * radius * 0.14;
    const perpX = -Math.sin(a);
    const perpY = Math.cos(a) * 0.82;
    const sx = Math.cos(a) * innerDist;
    const sy = Math.sin(a) * innerDist * 0.82;
    const ex = Math.cos(a) * outerDist;
    const ey = Math.sin(a) * outerDist * 0.82;
    const midX = (sx + ex) * 0.5 + perpX * bend;
    const midY = (sy + ey) * 0.5 + perpY * bend;
    const halfW = Math.max(3.5, radius * 0.11 * (1 - p * 0.55));

    ctx.globalAlpha = fade * 0.62;
    ctx.fillStyle = pal.primary;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(midX + perpX * halfW, midY + perpY * halfW, ex, ey);
    ctx.quadraticCurveTo(midX - perpX * halfW * 0.7, midY - perpY * halfW * 0.7, sx, sy);
    ctx.closePath();
    ctx.fill();

    // Crisp rim spine on each flame/energy tongue
    ctx.globalAlpha = fade * 0.52;
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = Math.max(1.0, radius * 0.022 * (1 - p * 0.5));
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.stroke();
  }

  // 4. Controlled non-blinding compact cross ignition star + radial kinetic needles
  if (p < 0.24) {
    const flash = (1 - p / 0.24) * 0.68;
    ctx.globalAlpha = flash;
    ctx.fillStyle = pal.highlight;
    const spikes = 4;
    const lenMaj = radius * (0.42 + flash * 0.26);
    const lenMin = radius * 0.085 * flash;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI / spikes) * i + seed * 0.3;
      const rr = i % 2 === 0 ? lenMaj : lenMin;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr * 0.82;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = fade * 0.68;
  ctx.strokeStyle = pal.highlight;
  ctx.lineCap = "round";
  for (let ni = 0; ni < 8; ni++) {
    const na = (Math.PI * 0.25) * ni + seed * 0.7;
    const innerR = rBlast * (0.52 + p * 0.3);
    const outerR = rBlast * (0.96 + p * 0.26);
    ctx.lineWidth = Math.max(1.0, (1 - p * 0.75) * 2.1);
    ctx.beginPath();
    ctx.moveTo(Math.cos(na) * innerR, Math.sin(na) * innerR * 0.82);
    ctx.lineTo(Math.cos(na) * outerR, Math.sin(na) * outerR * 0.82);
    ctx.stroke();
  }

  // 5. Directional 3D parabolic debris with perspective ground shadows
  ctx.globalAlpha = fade;
  const debrisCount = 12;
  for (let d = 0; d < debrisCount; d++) {
    const a = (Math.PI * 2 / debrisCount) * d + seed * 0.9 + Math.sin(d * 3.1) * 0.25;
    const travel = rBlast * (0.54 + 0.6 * easeOut + (d % 3) * 0.11);
    const dx = Math.cos(a) * travel;
    const dyFloor = Math.sin(a) * travel * 0.82;
    const arcLift = Math.sin(p * Math.PI) * radius * (0.22 + (d % 2) * 0.08);
    const dy = dyFloor - arcLift;

    if (ep.debris === "arc") {
      if (d % 2 === 0) {
        drawBranchingArc(ctx, {
          x1: Math.cos(a) * rBlast * 0.22,
          y1: Math.sin(a) * rBlast * 0.18,
          x2: dx,
          y2: dy,
          seed: seed + d * 2.3,
          width: 1.6,
          color: pal.rim,
          coreColor: pal.highlight,
          isMono,
        });
      }
    } else if (ep.debris === "rock" || ep.debris === "crystal" || ep.debris === "shard") {
      // Ground shadow dot beneath airborne 3D shard/boulder
      ctx.save();
      ctx.globalAlpha = fade * 0.34;
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.ellipse(dx, dyFloor + 2, Math.max(2, radius * 0.065), Math.max(1.2, radius * 0.032), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawFacetedShard(ctx, {
        x: dx,
        y: dy,
        size: Math.max(3.2, radius * (0.072 + (d % 2) * 0.026)),
        rot: a + p * 4.2,
        shape: ep.debris === "rock" ? "rock" : "crystal",
        primary: pal.primary,
        highlight: pal.highlight,
        shadow: pal.shadow,
        rim: pal.rim,
        isMono,
      });
    } else if (ep.debris === "droplet") {
      drawViscousDroplet(ctx, {
        x: dx,
        y: dy,
        vx: Math.cos(a) * 180,
        vy: Math.sin(a) * 140,
        radius: Math.max(2.4, radius * 0.052),
        color: pal.primary,
        rimColor: pal.highlight,
        isMono,
      });
    } else if (ep.debris === "wind") {
      if (d % 2 === 0) {
        drawWindStreamRibbon(ctx, {
          x: dx * 0.75,
          y: dy * 0.75,
          angle: a + 0.5,
          length: radius * 0.44,
          width: Math.max(3.4, radius * 0.07),
          phase: p * 8 + d,
          color: pal.rim,
          coreColor: pal.highlight,
          isMono,
        });
      }
    } else {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(a);
      ctx.fillStyle = d % 2 === 0 ? pal.highlight : pal.rim;
      ctx.beginPath();
      ctx.moveTo(radius * 0.16, 0);
      ctx.lineTo(-radius * 0.08, -radius * 0.038);
      ctx.lineTo(-radius * 0.04, 0);
      ctx.lineTo(-radius * 0.08, radius * 0.038);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Perspective-tilted multi-tier Arcane / Martial Runic Magic Circle:
 * - Dark grounding shadow collar + atmospheric gradient wash
 * - Counter-rotating calligraphic segmented rune collar with precision tick notches (zero setLineDash)
 * - Inscribed sacred geometric star / overlapping polygon sigils
 * - Perimeter faceted crystal anchor nodes
 */
export function drawArcaneMagicCircle(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const radius = safeRadius(opts.radius, 80);
  const tiltY = clamp(safeNum(opts.tiltY, 0.72), 0.42, 1.0);
  const rot = safeNum(opts.rot, 0);
  const sides = Math.max(3, Math.min(8, Math.floor(safeNum(opts.sides, 6))));
  const starMode = opts.starMode !== undefined ? opts.starMode !== false : opts.star !== false;
  const isMono = Boolean(opts.isMono);
  const pal = resolvePalette(opts.primary || "#38BDF8", opts.highlight || "#FFFFFF", opts.darkRim || opts.shadow || "#020617", opts.rim || "#BAE6FD", isMono);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, tiltY);

  // Grounding dark ring shadow & subtle inner radiant wash (non-blinding)
  const wash = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius);
  wash.addColorStop(0, isMono ? "rgba(255,255,255,0.14)" : colorWithAlpha(pal.primary, 0.18));
  wash.addColorStop(0.7, isMono ? "rgba(15,23,42,0.14)" : (opts.midWash || "rgba(15, 23, 42, 0.2)"));
  wash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Dark bevel under-stroke for crisp figure-ground contrast
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
  ctx.strokeStyle = pal.shadow;
  ctx.lineWidth = Math.max(4, radius * 0.058);
  ctx.globalAlpha *= 0.68;
  ctx.stroke();
  ctx.globalAlpha /= 0.68;

  // Outer rotating segmented calligraphic rim + rune tick marks
  ctx.save();
  ctx.rotate(rot);
  const arcSegs = Math.max(4, sides);
  const span = (Math.PI * 2) / arcSegs;
  for (let i = 0; i < arcSegs; i++) {
    const a0 = i * span + 0.1;
    const a1 = (i + 1) * span - 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.96, a0, a1);
    ctx.strokeStyle = i % 2 === 0 ? pal.primary : pal.rim;
    ctx.lineWidth = Math.max(2.2, radius * 0.028);
    ctx.lineCap = "round";
    ctx.stroke();

    const midA = (a0 + a1) * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.84, a0 + 0.08, a1 - 0.08);
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = Math.max(1.1, radius * 0.012);
    ctx.stroke();

    for (let t = -1; t <= 1; t += 2) {
      const ta = midA + t * (span * 0.22);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * radius * 0.86, Math.sin(ta) * radius * 0.86);
      ctx.lineTo(Math.cos(ta) * radius * 0.94, Math.sin(ta) * radius * 0.94);
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = Math.max(1.2, radius * 0.014);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Counter-rotating inscribed sacred geometry (double polygon / hexagram)
  ctx.save();
  ctx.rotate(-rot * 0.72);
  const polyPasses = starMode ? 2 : 1;
  for (let pass = 0; pass < polyPasses; pass++) {
    ctx.save();
    if (pass === 1) ctx.rotate(Math.PI / sides);
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = (Math.PI * 2 * i) / sides;
      const px = Math.cos(a) * radius * 0.72;
      const py = Math.sin(a) * radius * 0.72;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = pass === 0 ? pal.primary : pal.rim;
    ctx.lineWidth = Math.max(1.6, radius * 0.018);
    ctx.stroke();
    ctx.restore();
  }

  // Hovering 3D perimeter crystal anchor nodes with ground drop shadows
  const nodeCount = Math.min(6, sides);
  for (let ni = 0; ni < nodeCount; ni++) {
    const na = (Math.PI * 2 * ni) / nodeCount;
    const nx = Math.cos(na) * radius * 0.96;
    const ny = Math.sin(na) * radius * 0.96;
    const hoverOff = 6 + Math.sin(rot * 2 + ni) * 2.5;
    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 18, 0.45)";
    ctx.beginPath();
    ctx.ellipse(nx, ny + 2, 4.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawFacetedShard(ctx, {
      x: nx,
      y: ny - hoverOff,
      size: Math.max(3.5, Math.min(9.5, radius * 0.048)),
      rot: na + Math.PI * 0.5,
      shape: opts.nodeShape || "crystal",
      primary: pal.primary,
      highlight: pal.highlight,
      shadow: pal.shadow,
      rim: pal.rim,
      isMono,
    });
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Grounded 3D cylindrical Energy Vortex Pillar with ascending 3D shock ellipses,
 * back/front helical wrap ribbons, and translucent non-glaring plasma core.
 */
export function drawEnergyVortexPillar(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const baseRadius = safeRadius(opts.radius, 48);
  const height = safeRadius(opts.height, 190);
  const p = clamp(safeNum(opts.progress, 0.35), 0, 1);
  const phase = safeNum(opts.phase, 0);
  const isMono = Boolean(opts.isMono);
  const pal = resolvePalette(opts.primary || "#38BDF8", opts.highlight || "#FFFFFF", opts.shadow || "#0C4A6E", opts.rim || "#BAE6FD", isMono);

  const env = p < 0.16 ? p / 0.16 : p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.3) : 1;
  if (env <= 0.02) return;

  const colW = safeRadius(baseRadius * (0.46 + 0.2 * env), 6);
  const topY = -height * (0.55 + 0.45 * Math.min(1, p * 2.6));

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= env;

  // Grounding perspective shadow & subtle impact collar (non-blinding)
  ctx.save();
  ctx.scale(1, 0.58);
  const baseGrad = ctx.createRadialGradient(0, 0, colW * 0.15, 0, 0, baseRadius * 1.15);
  baseGrad.addColorStop(0, colorWithAlpha(pal.highlight, 0.42));
  baseGrad.addColorStop(0.45, colorWithAlpha(pal.primary, 0.38));
  baseGrad.addColorStop(0.85, colorWithAlpha(pal.shadow, 0.25));
  baseGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Back-half of 3D helical ribbons (drawn behind column core at lower depth alpha)
  const segs = 14;
  for (let helix = 0; helix < 2; helix++) {
    ctx.save();
    ctx.globalAlpha = env * 0.3;
    ctx.strokeStyle = pal.shadow;
    ctx.lineWidth = Math.max(1.8, colW * 0.14 * env);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const ang = t * Math.PI * 2.4 + phase + helix * Math.PI;
      if (Math.cos(ang) <= 0) {
        const hy = t * topY * 0.92;
        const sway = Math.sin(ang) * colW * (1.18 - t * 0.44);
        ctx.lineTo(sway, hy);
      } else {
        const hy = t * topY * 0.92;
        const sway = Math.sin(ang) * colW * (1.18 - t * 0.44);
        ctx.moveTo(sway, hy);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // Translucent outer volumetric sheath + crisp rim boundary lines
  const colGrad = ctx.createLinearGradient(0, 0, 0, topY);
  colGrad.addColorStop(0, colorWithAlpha(pal.primary, 0.36));
  colGrad.addColorStop(0.62, colorWithAlpha(pal.rim, 0.2));
  colGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = colGrad;
  ctx.beginPath();
  ctx.moveTo(-colW * 1.25, 0);
  ctx.quadraticCurveTo(-colW * 0.72, topY * 0.5, -colW * 0.52, topY);
  ctx.lineTo(colW * 0.52, topY);
  ctx.quadraticCurveTo(colW * 0.72, topY * 0.5, colW * 1.25, 0);
  ctx.closePath();
  ctx.fill();

  // Subtle translucent inner plasma spine (no blinding opaque white strip!)
  const coreGrad = ctx.createLinearGradient(0, 0, 0, topY);
  coreGrad.addColorStop(0, colorWithAlpha(pal.highlight, 0.42));
  coreGrad.addColorStop(0.68, colorWithAlpha(pal.highlight, 0.2));
  coreGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(-colW * 0.34, 0);
  ctx.lineTo(-colW * 0.14, topY);
  ctx.lineTo(colW * 0.14, topY);
  ctx.lineTo(colW * 0.34, 0);
  ctx.closePath();
  ctx.fill();

  // Crisp left & right column edge highlights
  ctx.strokeStyle = colorWithAlpha(pal.rim, 0.52);
  ctx.lineWidth = Math.max(1.2, colW * 0.07);
  ctx.beginPath();
  ctx.moveTo(-colW * 1.22, 0);
  ctx.quadraticCurveTo(-colW * 0.72, topY * 0.5, -colW * 0.52, topY);
  ctx.moveTo(colW * 1.22, 0);
  ctx.quadraticCurveTo(colW * 0.72, topY * 0.5, colW * 0.52, topY);
  ctx.stroke();

  // 3 Ascending 3D perspective shock ellipses rising up the column
  for (let ri = 0; ri < 3; ri++) {
    const rProg = (p * 1.65 + ri * 0.33) % 1;
    const ryPos = topY * rProg * 0.86;
    const ringRx = safeRadius(colW * (1.28 - rProg * 0.45), 4);
    const ringRy = safeRadius(ringRx * 0.34, 1.5);
    ctx.save();
    ctx.globalAlpha = env * (1 - rProg) * 0.65;
    ctx.strokeStyle = ri === 0 ? pal.highlight : pal.rim;
    ctx.lineWidth = Math.max(1.2, colW * 0.08 * (1 - rProg));
    ctx.beginPath();
    ctx.ellipse(0, ryPos, ringRx, ringRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Front-half helical ascent ribbons wrapping across column
  for (let helix = 0; helix < 2; helix++) {
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const hy = t * topY * 0.92;
      const sway = Math.sin(t * Math.PI * 2.4 + phase + helix * Math.PI) * colW * (1.15 - t * 0.45);
      if (i === 0) ctx.moveTo(sway, hy);
      else ctx.lineTo(sway, hy);
    }
    ctx.strokeStyle = helix === 0 ? colorWithAlpha(pal.highlight, 0.78) : colorWithAlpha(pal.rim, 0.68);
    ctx.lineWidth = Math.max(1.6, colW * 0.12 * env);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // 6 Rising 3D faceted shards lifted by column updraft
  for (let si = 0; si < 6; si++) {
    const rise = ((p * 1.7 + si * 0.167) % 1);
    const sx = Math.sin(si * 2.1 + phase) * colW * 1.05;
    const sy = topY * rise * 0.88 - 8;
    drawFacetedShard(ctx, {
      x: sx,
      y: sy,
      size: Math.max(3.2, baseRadius * 0.08) * (1 - rise * 0.42),
      rot: rise * 5 + si,
      shape: opts.debrisShape || "crystal",
      primary: pal.primary,
      highlight: pal.highlight,
      shadow: pal.shadow,
      rim: pal.rim,
      isMono,
    });
  }

  ctx.restore();
}

/**
 * Grounded 3D perspective scorched Impact Crater Decal with sunken rim relief,
 * branching secondary hairline fissures, & 3D boulders with ground contact shadows.
 */
export function drawImpactCraterDecal(ctx, opts = {}) {
  const x = safeNum(opts.x, 0);
  const y = safeNum(opts.y, 0);
  const radius = safeRadius(opts.radius, 64);
  const alpha = clamp(safeNum(opts.alpha, 0.85), 0, 1);
  if (alpha <= 0.02) return;
  const tiltY = clamp(safeNum(opts.tiltY, 0.72), 0.45, 1.0);
  const seed = safeNum(opts.seed, (x * 0.17 + y * 0.11) % 10);
  const isMono = Boolean(opts.isMono);
  const pal = resolvePalette(opts.primary || "#EA580C", opts.highlight || "#FEF08A", opts.shadow || "#090D16", opts.rim || "#F97316", isMono);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;

  // Perspective sunken crater basin with 3D rim relief (dark upper inner lip + sunlit lower lip)
  ctx.save();
  ctx.scale(1, tiltY);
  const basinGrad = ctx.createRadialGradient(0, 0, radius * 0.06, 0, 0, radius);
  basinGrad.addColorStop(0, isMono ? "rgba(0,0,0,0.58)" : "rgba(4, 6, 12, 0.65)");
  basinGrad.addColorStop(0.55, isMono ? "rgba(15,23,42,0.34)" : "rgba(15, 23, 42, 0.38)");
  basinGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = basinGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Sunken upper overhang shadow + raised lower rim lip highlight
  ctx.strokeStyle = isMono ? "rgba(0,0,0,0.55)" : "rgba(2, 6, 18, 0.62)";
  ctx.lineWidth = Math.max(2.6, radius * 0.052);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.74, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(pal.rim, 0.42);
  ctx.lineWidth = Math.max(1.8, radius * 0.032);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.76, 0.12, Math.PI - 0.12);
  ctx.stroke();

  // Jagged primary + branching secondary ground fissures radiating from crater center
  const crackCount = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  for (let i = 0; i < crackCount; i++) {
    const a = (Math.PI * 2 / crackCount) * i + seed * 0.5;
    const len = radius * (0.72 + ((i * 19) % 3) * 0.12);
    const mx = Math.cos(a + 0.12) * len * 0.52;
    const my = Math.sin(a + 0.12) * len * 0.52;
    const ex = Math.cos(a - 0.06) * len;
    const ey = Math.sin(a - 0.06) * len;
    const subA = a + (i % 2 === 0 ? 0.55 : -0.55);
    const sx2 = mx + Math.cos(subA) * len * 0.36;
    const sy2 = my + Math.sin(subA) * len * 0.36;

    // Dark chasm bed
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.moveTo(mx, my);
    ctx.lineTo(sx2, sy2);
    ctx.strokeStyle = "#060911";
    ctx.lineWidth = Math.max(3.2, radius * 0.062);
    ctx.stroke();

    // Elemental magma/mana seam
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = Math.max(1.6, radius * 0.028);
    ctx.stroke();

    // Inner glowing vein (controlled brightness)
    ctx.strokeStyle = colorWithAlpha(pal.highlight, 0.78);
    ctx.lineWidth = Math.max(0.85, radius * 0.013);
    ctx.stroke();
  }
  ctx.restore();

  // Scattered 3D rock/crystal rubble chunks around crater rim with drop shadows
  for (let r = 0; r < 6; r++) {
    const ra = (Math.PI * 2 / 6) * r + seed;
    const dist = radius * (0.64 + (r % 2) * 0.18);
    const rx = Math.cos(ra) * dist;
    const ry = Math.sin(ra) * dist * tiltY;
    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 18, 0.45)";
    ctx.beginPath();
    ctx.ellipse(rx + 2, ry + 3, Math.max(3, radius * 0.075), Math.max(1.6, radius * 0.038), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawFacetedShard(ctx, {
      x: rx,
      y: ry,
      size: Math.max(3.5, radius * 0.078),
      rot: ra + seed,
      shape: opts.debrisShape || "rock",
      primary: pal.primary,
      highlight: pal.highlight,
      shadow: pal.shadow,
      rim: pal.rim,
      isMono,
    });
  }

  ctx.restore();
}

