import { isCircleInViewBounds } from "./combatLogic";

// Classic Sanctum Colosseum Renderer (AoV / MLBB-inspired carved stone courtyard)
// Strictly zero ctx.shadowBlur and zero ctx.setLineDash; safe under headless Node ctxStub.

function hashCell(ix, iy) {
  let n = Math.imul(ix + 41, 73856093) ^ Math.imul(iy + 83, 19349663);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function drawArenaBrazier(ctx, x, y, elapsedTime, isMono, allowGlows) {
  const seed = x * 0.07 + y * 0.11;
  const flicker = 0.88 + 0.12 * Math.sin(elapsedTime * 11.5 + seed);
  const sway = Math.sin(elapsedTime * 7.8 + seed) * 2.4;

  ctx.save();
  ctx.translate(x, y);

  // Warm ambient ground light pool
  if (!isMono && allowGlows) {
    const glowR = 96 * flicker;
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, glowR);
    g.addColorStop(0, "rgba(251, 146, 60, 0.24)");
    g.addColorStop(0.5, "rgba(217, 119, 6, 0.09)");
    g.addColorStop(1, "rgba(217, 119, 6, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground contact shadow
  ctx.fillStyle = "rgba(2, 6, 23, 0.56)";
  ctx.beginPath();
  ctx.ellipse(2, 6, 17, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Carved octagonal stone pedestal + bronze bowl
  ctx.fillStyle = isMono ? "#1E293B" : "#273248";
  ctx.strokeStyle = isMono ? "#94A3B8" : "#0B111E";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Top-left stone bevel highlight
  ctx.strokeStyle = isMono ? "#E2E8F0" : "rgba(226, 232, 240, 0.28)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 12.2, Math.PI * 0.9, Math.PI * 1.85);
  ctx.stroke();

  // Bronze rim ring
  ctx.fillStyle = isMono ? "#0F172A" : "#451A03";
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#D97706";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -1, 8.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Animated multi-layer brazier flame
  ctx.fillStyle = isMono ? "#CBD5E1" : "#EA580C";
  ctx.beginPath();
  ctx.moveTo(-5.5, 0);
  ctx.quadraticCurveTo(-5, -9 * flicker, sway, -16 * flicker);
  ctx.quadraticCurveTo(5, -9 * flicker, 5.5, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isMono ? "#FFFFFF" : "#FEF08A";
  ctx.beginPath();
  ctx.moveTo(-2.8, 0);
  ctx.quadraticCurveTo(-2.2, -5.5 * flicker, sway * 0.6, -10.5 * flicker);
  ctx.quadraticCurveTo(2.2, -5.5 * flicker, 2.8, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawClassicArenaFloor(ctx, mapWidth, mapHeight, viewBounds, elapsedTime = 0, isMono = false, prof = {}) {
  const tileSize = prof?.effectiveTier === "saver" ? 120 : 100;
  const minX = Math.max(0, Math.floor((viewBounds?.minX ?? 0) / tileSize) * tileSize);
  const maxX = Math.min(mapWidth, Math.ceil((viewBounds?.maxX ?? mapWidth) / tileSize) * tileSize);
  const minY = Math.max(0, Math.floor((viewBounds?.minY ?? 0) / tileSize) * tileSize);
  const maxY = Math.min(mapHeight, Math.ceil((viewBounds?.maxY ?? mapHeight) / tileSize) * tileSize);

  const cx = mapWidth * 0.5;
  const cy = mapHeight * 0.5;
  const allowGlows = Boolean(prof?.enableRadialGlows);
  const isHighDetail = prof?.effectiveTier !== "saver";

  // 1. Deep basalt courtyard sub-base
  ctx.fillStyle = isMono ? "#141A24" : "#0A101D";
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // 2. Culled 2.5D Beveled Stone Flagstones
  for (let y = minY; y < maxY; y += tileSize) {
    const iy = Math.round(y / tileSize);
    for (let x = minX; x < maxX; x += tileSize) {
      const ix = Math.round(x / tileSize);
      const h = hashCell(ix, iy);
      const onHorizontalLane = Math.abs(y + tileSize * 0.5 - cy) <= 105;
      const onVerticalLane = Math.abs(x + tileSize * 0.5 - cx) <= 105;
      const isLane = onHorizontalLane || onVerticalLane;

      if (isMono) {
        ctx.fillStyle = h > 0.65 ? "#202736" : h > 0.3 ? "#1A202E" : "#151B28";
      } else if (isLane) {
        ctx.fillStyle = h > 0.5 ? "#192338" : "#151E31";
      } else {
        ctx.fillStyle = h > 0.72 ? "#141D30" : h > 0.36 ? "#101828" : "#0D1422";
      }
      ctx.fillRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);

      // Stone slab 3D top-left lit bevel & bottom-right recessed mortar shadow
      ctx.strokeStyle = isMono
        ? "rgba(226, 232, 240, 0.10)"
        : isLane
          ? "rgba(217, 119, 6, 0.11)"
          : "rgba(148, 163, 184, 0.065)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + tileSize - 2.5);
      ctx.lineTo(x + 2, y + 2);
      ctx.lineTo(x + tileSize - 2.5, y + 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(2, 6, 23, 0.65)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + tileSize - 1.5, y + 2.5);
      ctx.lineTo(x + tileSize - 1.5, y + tileSize - 1.5);
      ctx.lineTo(x + 2.5, y + tileSize - 1.5);
      ctx.stroke();

      // Secondary flagstone split + weathered surface crack / bronze inlay
      if (isHighDetail) {
        const subEdge = x + tileSize * (0.38 + (h * 0.28));
        ctx.strokeStyle = "rgba(2, 6, 23, 0.42)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        if ((ix + iy) % 2 === 0) {
          ctx.moveTo(subEdge, y + 3);
          ctx.lineTo(subEdge, y + tileSize - 3);
        } else {
          const subY = y + tileSize * (0.36 + (h * 0.28));
          ctx.moveTo(x + 3, subY);
          ctx.lineTo(x + tileSize - 3, subY);
        }
        ctx.stroke();

        // Subtle stone micro-fissure or subtle moss accent
        if (h > 0.78) {
          ctx.strokeStyle = isMono ? "rgba(255,255,255,0.08)" : "rgba(4, 8, 18, 0.55)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x + tileSize * 0.22, y + tileSize * 0.28);
          ctx.lineTo(x + tileSize * 0.44, y + tileSize * 0.41);
          ctx.lineTo(x + tileSize * 0.52, y + tileSize * 0.58);
          ctx.stroke();
        } else if (!isMono && !isLane && h < 0.14) {
          ctx.fillStyle = "rgba(20, 83, 45, 0.16)";
          ctx.beginPath();
          ctx.ellipse(x + tileSize * 0.25, y + tileSize * 0.78, 14, 7, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // 3. Carved Battle Avenues (N/S/E/W Sanctuary Corridors leading to Center Altar)
  const laneHalf = 92;
  ctx.save();
  ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.16)" : "rgba(217, 119, 6, 0.24)";
  ctx.lineWidth = 2.2;
  // Horizontal curb rails
  for (const sy of [cy - laneHalf, cy + laneHalf]) {
    ctx.beginPath();
    ctx.moveTo(28, sy);
    ctx.lineTo(cx - 256, sy);
    ctx.moveTo(cx + 256, sy);
    ctx.lineTo(mapWidth - 28, sy);
    ctx.stroke();
  }
  // Vertical curb rails
  for (const sx of [cx - laneHalf, cx + laneHalf]) {
    ctx.beginPath();
    ctx.moveTo(sx, 28);
    ctx.lineTo(sx, cy - 256);
    ctx.moveTo(sx, cy + 256);
    ctx.lineTo(sx, mapHeight - 28);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Grand Central MOBA Sanctum Altar
  if (isCircleInViewBounds(cx, cy, 310, viewBounds)) {
    ctx.save();
    ctx.translate(cx, cy);

    if (!isMono && allowGlows) {
      const altarGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, 290);
      altarGlow.addColorStop(0, "rgba(245, 158, 11, 0.14)");
      altarGlow.addColorStop(0.55, "rgba(56, 189, 248, 0.05)");
      altarGlow.addColorStop(1, "rgba(10, 16, 29, 0)");
      ctx.fillStyle = altarGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 290, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer stepped dark stone ring
    ctx.fillStyle = isMono ? "#1E293B" : "#131C30";
    ctx.strokeStyle = "rgba(2, 6, 23, 0.85)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 252, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bronze inlaid outer rim + top-left directional bevel
    ctx.strokeStyle = isMono ? "rgba(226, 232, 240, 0.42)" : "rgba(217, 119, 6, 0.42)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 250, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isMono ? "rgba(255,255,255,0.22)" : "rgba(253, 224, 71, 0.24)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 224, 0, Math.PI * 2);
    ctx.stroke();

    // Inner recessed sanctum basin
    ctx.fillStyle = isMono ? "#111827" : "#0D1526";
    ctx.beginPath();
    ctx.arc(0, 0, 168, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMono ? "rgba(203,213,225,0.28)" : "rgba(56, 189, 248, 0.22)";
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 8 Carved Sanctuary Compass Spokes & Diamond Nodes
    ctx.strokeStyle = isMono ? "rgba(226,232,240,0.26)" : "rgba(245, 158, 11, 0.26)";
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 86, Math.sin(a) * 86);
      ctx.lineTo(Math.cos(a) * 244, Math.sin(a) * 244);
      ctx.stroke();

      const nx = Math.cos(a) * 236;
      const ny = Math.sin(a) * 236;
      ctx.fillStyle = isMono ? "#E2E8F0" : "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(nx + Math.cos(a) * 7, ny + Math.sin(a) * 7);
      ctx.lineTo(nx + Math.cos(a + 1.57) * 4.5, ny + Math.sin(a + 1.57) * 4.5);
      ctx.lineTo(nx - Math.cos(a) * 7, ny - Math.sin(a) * 7);
      ctx.lineTo(nx - Math.cos(a + 1.57) * 4.5, ny - Math.sin(a + 1.57) * 4.5);
      ctx.closePath();
      ctx.fill();
    }

    // Center Sanctum Seal Emblem
    const pulse = 0.72 + 0.28 * Math.sin(elapsedTime * 2.2);
    ctx.strokeStyle = isMono ? "#FFFFFF" : `rgba(250, 204, 21, ${(0.35 * pulse).toFixed(3)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      const px = Math.cos(a) * 64;
      const py = Math.sin(a) * 64;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // 5. Perimeter Sanctuary Stone Braziers (8 architectural torches)
  const braziers = [
    { x: cx - 235, y: cy - 235 },
    { x: cx + 235, y: cy - 235 },
    { x: cx - 235, y: cy + 235 },
    { x: cx + 235, y: cy + 235 },
    { x: 110, y: 110 },
    { x: mapWidth - 110, y: 110 },
    { x: 110, y: mapHeight - 110 },
    { x: mapWidth - 110, y: mapHeight - 110 },
  ];
  for (let i = 0; i < braziers.length; i++) {
    const b = braziers[i];
    if (isCircleInViewBounds(b.x, b.y, 110, viewBounds)) {
      drawArenaBrazier(ctx, b.x, b.y, elapsedTime, isMono, allowGlows);
    }
  }

  // 6. 3D Beveled Fortress Parapet Border Walls
  ctx.save();
  // Inner parapet drop shadow on stone courtyard
  ctx.strokeStyle = "rgba(2, 6, 23, 0.72)";
  ctx.lineWidth = 24;
  ctx.strokeRect(18, 18, mapWidth - 36, mapHeight - 36);

  // Raised stone parapet coping
  ctx.strokeStyle = isMono ? "#334155" : "#1E293B";
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, mapWidth - 14, mapHeight - 14);

  // Gold/Bronze inner battlement trim
  ctx.strokeStyle = isMono ? "#CBD5E1" : "#D97706";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(14, 14, mapWidth - 28, mapHeight - 28);
  ctx.restore();
}

export function drawClassicArenaAtmosphereScene(ctx, engine, isMono = false, prof = {}) {
  const w = engine?.viewW || 1280;
  const h = engine?.viewH || 720;
  const t = engine?.elapsedTime || 0;

  ctx.save();
  // Subtle edge depth vignette (leaves playfield crisp & readable)
  if (prof?.enableRadialGlows) {
    const rad = Math.max(w, h) * 0.76;
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, rad * 0.42, w * 0.5, h * 0.5, rad);
    vg.addColorStop(0, "rgba(0, 0, 0, 0)");
    vg.addColorStop(0.74, "rgba(4, 7, 16, 0.14)");
    vg.addColorStop(1, "rgba(2, 5, 12, 0.36)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // Gentle drifting golden sanctuary dust motes (desktop / balanced+ tiers)
  if (prof?.effectiveTier !== "saver") {
    const moteCount = prof?.effectiveTier === "high" ? 16 : 9;
    for (let i = 0; i < moteCount; i++) {
      const seed = i * 17.31;
      const mx = ((Math.sin(seed * 1.7) * 0.5 + 0.5) * w + t * (12 + (i % 4) * 5)) % w;
      const my = ((Math.cos(seed * 2.3) * 0.5 + 0.5) * h - t * (8 + (i % 3) * 4) + h * 10) % h;
      const pulse = 0.16 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.4 + seed));
      ctx.fillStyle = isMono
        ? `rgba(226, 232, 240, ${pulse.toFixed(3)})`
        : i % 3 === 0
          ? `rgba(125, 211, 252, ${pulse.toFixed(3)})`
          : `rgba(253, 224, 71, ${pulse.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(mx, my, i % 3 === 0 ? 1.5 : 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
