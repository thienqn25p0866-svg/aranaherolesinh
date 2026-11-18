export type ArenaMapId = "classic" | "inferno_ash" | "blood_citadel";

export interface ArenaMapMetadata {
  id: ArenaMapId;
  width: number;
  height: number;
  name: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  unlockWaveRequired: number;
  unlockFromMap: ArenaMapId | null;
}

export interface CitadelRectObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "stone_wall" | "ruin_structure" | "ruin_pillar" | "gate_wall" | "vault_wall" | "collapsible_wall";
  label: string;
}

export interface CitadelWatchtowerDef {
  id: string;
  x: number;
  y: number;
  radius: number;
  range: number;
  label: string;
}

export interface CitadelBloodTrapDef {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: string;
}

export interface CitadelAmbushZoneDef {
  id: string;
  x: number;
  y: number;
  triggerRadius: number;
  spawnRadius: number;
  label: string;
}

export type CitadelInteractableId = "tin_lab" | "bao_mirror" | "shared_altar";

export interface CitadelInteractableDef {
  id: CitadelInteractableId;
  x: number;
  y: number;
  radius: number;
  heroIdRequired: "tin" | "bao" | null;
  title: { vi: string; en: string };
  shortPrompt: { vi: string; en: string };
}

export interface CitadelSecretsProgress {
  tinClue: boolean;
  baoClue: boolean;
  combinedUnlocked: boolean;
  inspectedNodes: CitadelInteractableId[];
}

export interface CitadelWatchtowerRuntime extends CitadelWatchtowerDef {
  state: "idle" | "telegraph" | "cooldown";
  timer: number;
  targetX: number;
  targetY: number;
  angle: number;
}

export interface CitadelBloodTrapRuntime extends CitadelBloodTrapDef {
  state: "idle" | "warning" | "erupt" | "cooldown";
  timer: number;
  didHitThisErupt: boolean;
}

export interface CitadelCollapsibleWallRuntime extends CitadelRectObstacle {
  state: "intact" | "warning" | "collapsed";
  timer: number;
  didDamageThisCollapse: boolean;
}

export interface CitadelAmbushRuntime extends CitadelAmbushZoneDef {
  state: "armed" | "warning" | "cooldown";
  timer: number;
}

export interface CitadelRuntimeState {
  mapId: ArenaMapId;
  watchtowers: CitadelWatchtowerRuntime[];
  bloodTraps: CitadelBloodTrapRuntime[];
  collapsibleWalls: CitadelCollapsibleWallRuntime[];
  ambushZones: CitadelAmbushRuntime[];
  baoShadowPhase: number;
  activeStoryEvent: CitadelLoreModalPayload | null;
}

export interface CitadelLoreModalPayload {
  nodeId: CitadelInteractableId;
  unlockedNow: boolean;
  isCombinedEvent: boolean;
  heroResonated: boolean;
  heroName: string;
  title: string;
  subtitle: string;
  archiveCode?: string;
  themeVariant?: "tin" | "bao" | "combined" | "dormant";
  specimenMeta?: string;
  quote?: string;
  paragraphs: string[];
  fieldNotes?: string[];
  clueSummary: string;
  rewardText?: string;
  secrets: CitadelSecretsProgress;
}

export const CLASSIC_MAP_WIDTH = 2000;
export const CLASSIC_MAP_HEIGHT = 1400;
export const INFERNO_ASH_WIDTH = 2400;
export const INFERNO_ASH_HEIGHT = 2100;
export const BLOOD_CITADEL_SIZE = 1600;
export const CITADEL_UNLOCK_WAVE = 27;

export const ARENA_MAPS: Record<ArenaMapId, ArenaMapMetadata> = {
  classic: {
    id: "classic",
    width: CLASSIC_MAP_WIDTH,
    height: CLASSIC_MAP_HEIGHT,
    name: {
      vi: "Đấu Trường Cổ Điển",
      en: "Classic Arena",
    },
    subtitle: {
      vi: "2000×1400 · Đấu trường sinh tồn nguyên bản 27 Màn",
      en: "2000×1400 · Original 27-Wave Survival Arena",
    },
    unlockWaveRequired: 0,
    unlockFromMap: null,
  },
  inferno_ash: {
    id: "inferno_ash",
    width: INFERNO_ASH_WIDTH,
    height: INFERNO_ASH_HEIGHT,
    name: {
      vi: "Hỏa Ngục Tàn Tro",
      en: "Inferno of Ashes",
    },
    subtitle: {
      vi: "2400×2100 · Thành phố tro tàn 8 khu vực, mật thất 4 ghế & bí mật thảm họa",
      en: "2400×2100 · 8-zone ruined city, Four Chairs Sanctum & catastrophe secrets",
    },
    unlockWaveRequired: 0,
    unlockFromMap: null,
  },
  blood_citadel: {
    id: "blood_citadel",
    width: BLOOD_CITADEL_SIZE,
    height: BLOOD_CITADEL_SIZE,
    name: {
      vi: "Cổ Thành Huyết Táng",
      en: "Bloodsoaked Ancient Citadel",
    },
    subtitle: {
      vi: "1600×1600 · Thành cổ đổ nát, hầm bí mật, tháp canh & bẫy máu",
      en: "1600×1600 · Ruined citadel, secret vault, watchtowers & blood traps",
    },
    unlockWaveRequired: CITADEL_UNLOCK_WAVE,
    unlockFromMap: "classic",
  },
};

export const ARENA_MAP_LIST: ArenaMapMetadata[] = Object.values(ARENA_MAPS);

export const BLOOD_CITADEL_SPAWN = { x: 800, y: 840 };

export const BLOOD_CITADEL_SECRET_VAULT_RECT = {
  x: 602,
  y: 86,
  w: 396,
  h: 244,
};

export const BLOOD_CITADEL_GATE_ARCH = {
  x: 650,
  y: 1384,
  w: 300,
  h: 52,
};

// Static stone walls & small ruins spaced generously (>= 200px lanes) to prevent getting stuck.
export const BLOOD_CITADEL_STATIC_OBSTACLES: CitadelRectObstacle[] = [
  // Secret Underground Vault side walls (Northern sanctum)
  {
    id: "vault_wall_w",
    x: 556,
    y: 92,
    w: 44,
    h: 224,
    kind: "vault_wall",
    label: "Tường Hầm Bí Mật Tây",
  },
  {
    id: "vault_wall_e",
    x: 1000,
    y: 92,
    w: 44,
    h: 224,
    kind: "vault_wall",
    label: "Tường Hầm Bí Mật Đông",
  },
  // Inner northern curtain wall flanking the central 420px breach
  {
    id: "north_wall_w",
    x: 330,
    y: 410,
    w: 240,
    h: 44,
    kind: "stone_wall",
    label: "Tường Đá Bắc Tây",
  },
  {
    id: "north_wall_e",
    x: 1030,
    y: 410,
    w: 240,
    h: 44,
    kind: "stone_wall",
    label: "Tường Đá Bắc Đông",
  },
  // Two small ruined structures flanking the courtyard
  {
    id: "ruin_west_watch",
    x: 245,
    y: 675,
    w: 68,
    h: 180,
    kind: "ruin_structure",
    label: "Phế Tích Trạm Gác Tây",
  },
  {
    id: "ruin_east_barracks",
    x: 1287,
    y: 675,
    w: 68,
    h: 180,
    kind: "ruin_structure",
    label: "Phế Tích Doanh Trại Đông",
  },
  // Ruined courtyard stone pillars
  {
    id: "pillar_sw",
    x: 505,
    y: 1020,
    w: 64,
    h: 64,
    kind: "ruin_pillar",
    label: "Trụ Đá Vỡ Tây Nam",
  },
  {
    id: "pillar_se",
    x: 1031,
    y: 1020,
    w: 64,
    h: 64,
    kind: "ruin_pillar",
    label: "Trụ Đá Vỡ Đông Nam",
  },
  // Southern Citadel Gate flanking ramparts (300px open gate in center x=650..950)
  {
    id: "gate_wall_w",
    x: 340,
    y: 1384,
    w: 310,
    h: 48,
    kind: "gate_wall",
    label: "Cổng Thành Tây",
  },
  {
    id: "gate_wall_e",
    x: 950,
    y: 1384,
    w: 310,
    h: 48,
    kind: "gate_wall",
    label: "Cổng Thành Đông",
  },
];

export const BLOOD_CITADEL_COLLAPSIBLE_DEFS: CitadelRectObstacle[] = [
  {
    id: "collapse_west",
    x: 420,
    y: 610,
    w: 120,
    h: 38,
    kind: "collapsible_wall",
    label: "Tường Sụp Tây",
  },
  {
    id: "collapse_east",
    x: 1060,
    y: 610,
    w: 120,
    h: 38,
    kind: "collapsible_wall",
    label: "Tường Sụp Đông",
  },
  {
    id: "collapse_gate",
    x: 740,
    y: 1185,
    w: 120,
    h: 36,
    kind: "collapsible_wall",
    label: "Chướng Ngại Cổng Thành",
  },
];

export const BLOOD_CITADEL_WATCHTOWERS: CitadelWatchtowerDef[] = [
  { id: "tower_nw", x: 300, y: 270, radius: 26, range: 520, label: "Tháp Canh Tây Bắc" },
  { id: "tower_ne", x: 1300, y: 270, radius: 26, range: 520, label: "Tháp Canh Đông Bắc" },
  { id: "tower_south", x: 800, y: 1315, radius: 26, range: 500, label: "Tháp Canh Cổng Nam" },
];

export const BLOOD_CITADEL_BLOOD_TRAPS: CitadelBloodTrapDef[] = [
  { id: "trap_c_w", x: 420, y: 830, radius: 58, label: "Bẫy Máu Hành Lang Tây" },
  { id: "trap_c_e", x: 1180, y: 830, radius: 58, label: "Bẫy Máu Hành Lang Đông" },
  { id: "trap_n_mid", x: 800, y: 515, radius: 60, label: "Bẫy Máu Cửa Hầm" },
  { id: "trap_sw", x: 560, y: 1235, radius: 56, label: "Bẫy Máu Phía Tây Cổng" },
  { id: "trap_se", x: 1040, y: 1235, radius: 56, label: "Bẫy Máu Phía Đông Cổng" },
];

export const BLOOD_CITADEL_AMBUSH_ZONES: CitadelAmbushZoneDef[] = [
  { id: "ambush_gate", x: 800, y: 1475, triggerRadius: 155, spawnRadius: 130, label: "Phục Kích Cổng Thành" },
  { id: "ambush_crypt", x: 800, y: 365, triggerRadius: 145, spawnRadius: 125, label: "Phục Kích Hầm Cổ" },
  { id: "ambush_east", x: 1420, y: 950, triggerRadius: 150, spawnRadius: 120, label: "Phục Kích Phế Tích Đông" },
];

export const BLOOD_CITADEL_INTERACTABLES: CitadelInteractableDef[] = [
  {
    id: "tin_lab",
    x: 1440,
    y: 175,
    radius: 62,
    heroIdRequired: "tin",
    title: {
      vi: "Dấu Tích Thí Nghiệm Ma Thạch",
      en: "Bloodstone Experiment Remnant",
    },
    shortPrompt: {
      vi: "Kiểm Tra Dấu Tích Ma Thạch",
      en: "Inspect Bloodstone Remnant",
    },
  },
  {
    id: "bao_mirror",
    x: 165,
    y: 1215,
    radius: 62,
    heroIdRequired: "bao",
    title: {
      vi: "Gương Sai Lệch & Bóng Phân Thân",
      en: "Distorted Mirror & Phantom",
    },
    shortPrompt: {
      vi: "Kiểm Tra Chiếc Gương Sai Lệch",
      en: "Inspect Distorted Mirror",
    },
  },
  {
    id: "shared_altar",
    x: 800,
    y: 185,
    radius: 68,
    heroIdRequired: null,
    title: {
      vi: "Bệ Thờ Hầm Bí Mật",
      en: "Secret Vault Altar",
    },
    shortPrompt: {
      vi: "Khám Phá Bệ Thờ Hầm Bí Mật",
      en: "Inspect Secret Vault Altar",
    },
  },
];

export function createDefaultCitadelSecrets(): CitadelSecretsProgress {
  return {
    tinClue: false,
    baoClue: false,
    combinedUnlocked: false,
    inspectedNodes: [],
  };
}

export function normalizeCitadelSecrets(raw: unknown): CitadelSecretsProgress {
  const base = createDefaultCitadelSecrets();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const validNodes = new Set<CitadelInteractableId>(["tin_lab", "bao_mirror", "shared_altar"]);
  const inspected = Array.isArray(r.inspectedNodes)
    ? Array.from(
        new Set(
          r.inspectedNodes.filter(
            (n): n is CitadelInteractableId => typeof n === "string" && validNodes.has(n as CitadelInteractableId)
          )
        )
      )
    : [];
  return {
    tinClue: Boolean(r.tinClue),
    baoClue: Boolean(r.baoClue),
    combinedUnlocked: Boolean(r.combinedUnlocked),
    inspectedNodes: inspected,
  };
}

export function normalizeArenaMapId(raw: unknown): ArenaMapId {
  if (raw === "blood_citadel") return "blood_citadel";
  if (raw === "inferno_ash") return "inferno_ash";
  return "classic";
}

export function computeUnlockedMaps({
  highestWaveCleared = 0,
  classicCleared = false,
  storedUnlocked = [],
  founderUnlocked = false,
}: {
  highestWaveCleared?: number;
  classicCleared?: boolean;
  storedUnlocked?: unknown;
  founderUnlocked?: boolean;
}): ArenaMapId[] {
  const set = new Set<ArenaMapId>(["classic", "inferno_ash"]);
  if (Array.isArray(storedUnlocked)) {
    for (const m of storedUnlocked) {
      if (m === "blood_citadel") set.add("blood_citadel");
      if (m === "inferno_ash") set.add("inferno_ash");
    }
  }
  if (classicCleared || highestWaveCleared >= CITADEL_UNLOCK_WAVE || founderUnlocked) {
    set.add("blood_citadel");
  }
  return Array.from(set);
}

export function isMapUnlocked(
  mapId: ArenaMapId,
  unlockedMaps: ArenaMapId[],
  founderUnlocked = false
): boolean {
  if (mapId === "classic" || mapId === "inferno_ash") return true;
  if (founderUnlocked && mapId === "blood_citadel") return true;
  return Array.isArray(unlockedMaps) && unlockedMaps.includes(mapId);
}

export function createInitialCitadelRuntimeState(mapId: ArenaMapId): CitadelRuntimeState {
  return {
    mapId,
    watchtowers: BLOOD_CITADEL_WATCHTOWERS.map((t, i) => ({
      ...t,
      state: "cooldown",
      timer: 2.4 + i * 1.1,
      targetX: t.x,
      targetY: t.y,
      angle: 0,
    })),
    bloodTraps: BLOOD_CITADEL_BLOOD_TRAPS.map((tr) => ({
      ...tr,
      state: "idle",
      timer: 0,
      didHitThisErupt: false,
    })),
    collapsibleWalls: BLOOD_CITADEL_COLLAPSIBLE_DEFS.map((cw, i) => ({
      ...cw,
      state: "intact",
      timer: 10 + i * 5.5,
      didDamageThisCollapse: false,
    })),
    ambushZones: BLOOD_CITADEL_AMBUSH_ZONES.map((az) => ({
      ...az,
      state: "armed",
      timer: 0,
    })),
    baoShadowPhase: 0,
    activeStoryEvent: null,
  };
}

export function getActiveCitadelObstacles(runtime: CitadelRuntimeState | null | undefined): CitadelRectObstacle[] {
  if (!runtime || runtime.mapId !== "blood_citadel") return [];
  const list: CitadelRectObstacle[] = [...BLOOD_CITADEL_STATIC_OBSTACLES];
  for (const cw of runtime.collapsibleWalls || []) {
    if (cw.state !== "collapsed") {
      list.push(cw);
    }
  }
  for (const tw of runtime.watchtowers || []) {
    list.push({
      id: tw.id,
      x: tw.x - tw.radius,
      y: tw.y - tw.radius,
      w: tw.radius * 2,
      h: tw.radius * 2,
      kind: "ruin_pillar",
      label: tw.label,
    });
  }
  return list;
}

export function resolveCircleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: { x: number; y: number; w: number; h: number }
): { x: number; y: number; collided: boolean } {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { x: cx, y: cy, collided: false };
  }

  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    const push = radius - dist;
    return {
      x: cx + (dx / dist) * push,
      y: cy + (dy / dist) * push,
      collided: true,
    };
  }

  // Circle center is inside the rectangle: push out via minimum penetration face.
  const leftPen = cx - rect.x;
  const rightPen = rect.x + rect.w - cx;
  const topPen = cy - rect.y;
  const bottomPen = rect.y + rect.h - cy;
  const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
  if (minPen === leftPen) return { x: rect.x - radius, y: cy, collided: true };
  if (minPen === rightPen) return { x: rect.x + rect.w + radius, y: cy, collided: true };
  if (minPen === topPen) return { x: cx, y: rect.y - radius, collided: true };
  return { x: cx, y: rect.y + rect.h + radius, collided: true };
}

export function resolveCircleObstacles(
  cx: number,
  cy: number,
  radius: number,
  obstacles: ReadonlyArray<{ x: number; y: number; w: number; h: number }>,
  mapWidth: number,
  mapHeight: number,
  margin = 16
): { x: number; y: number; collided: boolean } {
  let x = cx;
  let y = cy;
  let anyCollision = false;

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < obstacles.length; i++) {
      const r = obstacles[i];
      if (
        x + radius <= r.x ||
        x - radius >= r.x + r.w ||
        y + radius <= r.y ||
        y - radius >= r.y + r.h
      ) {
        continue;
      }
      const res = resolveCircleRectCollision(x, y, radius, r);
      if (res.collided) {
        x = res.x;
        y = res.y;
        anyCollision = true;
      }
    }
    x = Math.max(radius + margin, Math.min(mapWidth - radius - margin, x));
    y = Math.max(radius + margin, Math.min(mapHeight - radius - margin, y));
  }

  return { x, y, collided: anyCollision };
}

export function doesPointOverlapAnyObstacle(
  x: number,
  y: number,
  radius: number,
  obstacles: ReadonlyArray<{ x: number; y: number; w: number; h: number }>
): boolean {
  for (let i = 0; i < obstacles.length; i++) {
    const r = obstacles[i];
    const closestX = Math.max(r.x, Math.min(x, r.x + r.w));
    const closestY = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

export function findClearPointNear(
  x: number,
  y: number,
  radius: number,
  obstacles: ReadonlyArray<{ x: number; y: number; w: number; h: number }>,
  mapWidth: number,
  mapHeight: number,
  margin = 24
): { x: number; y: number } {
  const clampedX = Math.max(radius + margin, Math.min(mapWidth - radius - margin, x));
  const clampedY = Math.max(radius + margin, Math.min(mapHeight - radius - margin, y));
  if (obstacles.length === 0) return { x: clampedX, y: clampedY };
  const resolved = resolveCircleObstacles(clampedX, clampedY, radius, obstacles, mapWidth, mapHeight, margin);
  if (!doesPointOverlapAnyObstacle(resolved.x, resolved.y, radius, obstacles)) {
    return { x: resolved.x, y: resolved.y };
  }
  for (let dist = 48; dist <= 280; dist += 48) {
    for (let step = 0; step < 8; step++) {
      const ang = (Math.PI * 2 * step) / 8;
      const candX = Math.max(radius + margin, Math.min(mapWidth - radius - margin, clampedX + Math.cos(ang) * dist));
      const candY = Math.max(radius + margin, Math.min(mapHeight - radius - margin, clampedY + Math.sin(ang) * dist));
      if (!doesPointOverlapAnyObstacle(candX, candY, radius, obstacles)) {
        return { x: candX, y: candY };
      }
    }
  }
  return { x: BLOOD_CITADEL_SPAWN.x, y: BLOOD_CITADEL_SPAWN.y };
}

export function findNearestCitadelInteractable(
  px: number,
  py: number,
  mapId: ArenaMapId,
  maxDistOffset = 34
): CitadelInteractableDef | null {
  if (mapId !== "blood_citadel") return null;
  let best: CitadelInteractableDef | null = null;
  let bestD = Infinity;
  for (const node of BLOOD_CITADEL_INTERACTABLES) {
    const d = Math.hypot(px - node.x, py - node.y);
    if (d <= node.radius + maxDistOffset && d < bestD) {
      bestD = d;
      best = node;
    }
  }
  return best;
}

export function evaluateCitadelInteraction({
  nodeId,
  heroId,
  secrets,
  lang = "vi",
}: {
  nodeId: CitadelInteractableId;
  heroId: string;
  secrets: CitadelSecretsProgress;
  lang?: "vi" | "en";
}): {
  nextSecrets: CitadelSecretsProgress;
  payload: CitadelLoreModalPayload;
  coinBonus: number;
  buffKind: "tin_resonance" | "bao_shadow" | "combined_relic" | null;
} {
  const next: CitadelSecretsProgress = {
    tinClue: Boolean(secrets.tinClue),
    baoClue: Boolean(secrets.baoClue),
    combinedUnlocked: Boolean(secrets.combinedUnlocked),
    inspectedNodes: Array.from(new Set([...(secrets.inspectedNodes || []), nodeId])),
  };

  if (nodeId === "tin_lab") {
    const isTin = heroId === "tin";
    const newlyUnlocked = isTin && !next.tinClue;
    if (isTin) next.tinClue = true;

    return {
      nextSecrets: next,
      coinBonus: newlyUnlocked ? 120 : 0,
      buffKind: isTin ? "tin_resonance" : null,
      payload: {
        nodeId,
        unlockedNow: newlyUnlocked,
        isCombinedEvent: false,
        heroResonated: isTin,
        heroName: "Tin",
        archiveCode: "#MT-07",
        themeVariant: isTin ? "tin" : "dormant",
        specimenMeta: isTin
          ? lang === "vi"
            ? "ĐỒNG BỘ HUYẾT MẠCH: 99.4% · LÕI MA THẠCH ĐỎ"
            : "BLOOD SYNC: 99.4% · CRIMSON MA THACH CORE"
          : lang === "vi"
          ? "YÊU CẦU ĐỐI TƯỢNG: TIN · KHU ĐÔNG BẮC (1440, 175)"
          : "SUBJECT REQUIRED: TIN · NE RUINS (1440, 175)",
        title: isTin
          ? lang === "vi"
            ? "Ấn Ký Huyết Thạch Thức Tỉnh"
            : "Bloodstone Sigil Awakened"
          : lang === "vi"
          ? "Dấu Tích Thí Nghiệm Ma Thạch"
          : "Bloodstone Experiment Remnant",
        subtitle:
          lang === "vi"
            ? "HỒ SƠ MẬT #MT-07 · PHÒNG THÍ NGHIỆM MA THẠCH & MÁU"
            : "CLASSIFIED DOSSIER #MT-07 · BLOOD & MA THACH LAB",
        quote: isTin
          ? lang === "vi"
            ? "“Mẫu vật số 07 — Tin — có huyết mạch cộng hưởng trực tiếp với Lõi Ma Thạch Đỏ.”"
            : "“Subject 07 — Tin — exhibits direct blood resonance with the Crimson Ma Thach Core.”"
          : undefined,
        paragraphs: isTin
          ? [
              lang === "vi"
                ? "Ngay khi Tin chạm vào bàn thí nghiệm đổ nát, những bình máu khô và ký hiệu Ma Thạch cổ bỗng phát sáng rực đỏ theo nhịp tim của anh."
                : "As Tin touches the ruined lab bench, the dried blood vials and ancient Ma Thach runes ignite in crimson rhythm with his pulse.",
              lang === "vi"
                ? "Tập hồ sơ cháy xém xác nhận Tin từng là đối tượng của một thí nghiệm dùng máu sống để kích hoạt và khai thác sức mạnh Ma Thạch — nguồn gốc thật sự của Huyết Ảnh Thuật."
                : "Scorched records confirm Tin was tied to a forbidden experiment extracting Ma Thach energy through living blood — the true origin of his Bloodshade powers.",
            ]
          : [
              lang === "vi"
                ? "Trong góc phế tích là những bình máu đóng cặn, ký hiệu hình học khắc sâu trên đá và xấp hồ sơ thí nghiệm dùng máu để khai thác Ma Thạch."
                : "Hidden in the corner ruins sit blood vials, carved arcane runes, and dossiers detailing blood-catalyzed Ma Thach extraction.",
              lang === "vi"
                ? "Trên bìa hồ sơ còn sót lại cái tên 'TIN'. Dấu ấn Ma Thạch vẫn đang ngủ yên — hãy đưa tướng TIN đến đây để kích hoạt cộng hưởng thật sự!"
                : "A burned label bears the name 'TIN'. Bring hero TIN here to resonate with the dormant blood sigil!",
            ],
        fieldNotes: isTin
          ? lang === "vi"
            ? [
                "Ống nghiệm #MT-07A: Huyết tương tự kết tinh thành lưỡi cắt không gian mỗi khi tiếp xúc Ma Thạch.",
                "Chú thích biên: 'Chuyển bản ghi kết nối sang nhánh #BS-04 (Bảo) tại Hầm Bí Mật phía Bắc.'",
              ]
            : [
                "Vial #MT-07A: Blood plasma self-crystallizes into spatial blades upon Ma Thach contact.",
                "Margin Note: 'Cross-link telemetry to #BS-04 (Bảo) inside the Northern Secret Vault.'",
              ]
          : lang === "vi"
          ? [
              "Ghi chú rách góc: '...mẫu vật #07 chỉ đáp ứng khi chính Tin đứng trước vòng tròn Ma Thạch...'",
            ]
          : [
              "Torn margin: '...Specimen #07 awakens only when Tin himself steps within the Ma Thach circle...'",
            ],
        clueSummary: isTin
          ? lang === "vi"
            ? "Đã giải mã manh mối của Tin (Ma Thạch & Máu)."
            : "Unlocked Tin's Bloodstone & Blood clue."
          : lang === "vi"
          ? "Cần dùng tướng Tin để giải mã hoàn toàn dấu ấn Ma Thạch."
          : "Use hero Tin to fully unlock this Bloodstone clue.",
        rewardText: newlyUnlocked
          ? lang === "vi"
            ? "+120 Xu & Kích hoạt Cộng Hưởng Huyết Thạch (+2 Cộng Hưởng)"
            : "+120 Coins & Bloodstone Resonance (+2 Resonance)"
          : isTin
          ? lang === "vi"
            ? "Cộng Hưởng Huyết Thạch: +2 Cộng Hưởng & Hồi nhẹ"
            : "Bloodstone Resonance: +2 Resonance & Light Heal"
          : undefined,
        secrets: next,
      },
    };
  }

  if (nodeId === "bao_mirror") {
    const isBao = heroId === "bao";
    const newlyUnlocked = isBao && !next.baoClue;
    if (isBao) next.baoClue = true;

    return {
      nextSecrets: next,
      coinBonus: newlyUnlocked ? 120 : 0,
      buffKind: isBao ? "bao_shadow" : null,
      payload: {
        nodeId,
        unlockedNow: newlyUnlocked,
        isCombinedEvent: false,
        heroResonated: isBao,
        heroName: "Bảo",
        archiveCode: "#BS-04",
        themeVariant: isBao ? "bao" : "dormant",
        specimenMeta: isBao
          ? lang === "vi"
            ? "ĐỘ LỆCH PHẢN CHIẾU: 0.42s · NHÁNH BẢN SAO ẢNH"
            : "MIRROR LAG: 0.42s · SHADOW REPLICA BRANCH"
          : lang === "vi"
          ? "YÊU CẦU ĐỐI TƯỢNG: BẢO · KHU TÂY NAM (165, 1215)"
          : "SUBJECT REQUIRED: BẢO · SW ALCOVE (165, 1215)",
        title: isBao
          ? lang === "vi"
            ? "Phân Thân Trong Chiếc Gương Sai Lệch"
            : "Phantom in the Distorted Mirror"
          : lang === "vi"
          ? "Chiếc Gương Phản Chiếu Sai Lệch"
          : "The Distorted Mirror",
        subtitle:
          lang === "vi"
            ? "HỒ SƠ MẬT #BS-04 · DỰ ÁN TẠO BẢN SAO CON NGƯỜI"
            : "CLASSIFIED DOSSIER #BS-04 · HUMAN REPLICA PROJECT",
        quote: isBao
          ? lang === "vi"
            ? "“Liệu ngươi có chắc mình là bản thể gốc?”"
            : "“Are you truly certain that you are the original?”"
          : undefined,
        paragraphs: isBao
          ? [
              lang === "vi"
                ? "Khi Bảo đứng trước mặt gương rạn nứt, hình phản chiếu không cử động theo anh mà tách hẳn ra ngoài dưới dạng một bóng phân thân tím thẫm."
                : "Standing before the cracked glass, Bảo's reflection moves independently and steps out as a dark violet phantom clone.",
              lang === "vi"
                ? "Hồ sơ dưới chân gương ghi chép về Dự Án Tạo Bản Sao Con Người bằng kỹ thuật tách ảnh và tàng hình. Bóng phân thân thì thầm trước khi tan biến: “Liệu ngươi có chắc mình là bản thể gốc?”"
                : "Files beneath the mirror document a Human Replica Project built from stealth-split shadows. Before fading, the phantom whispers: “Are you truly certain that you are the original?”",
            ]
          : [
              lang === "vi"
                ? "Một bóng người mờ ảo giống hệt Bảo thoắt ẩn thoắt hiện quanh chiếc gương rạn nứt phản chiếu sai lệch mọi chuyển động."
                : "A flickering silhouette resembling Bảo phases around a cracked mirror whose reflection lags and distorts reality.",
              lang === "vi"
                ? "Bên cạnh là hồ sơ rách nát về 'Dự Án Tạo Bản Sao Con Người'. Hãy dùng tướng BẢO đến đây để đối mặt trực tiếp với bóng phân thân!"
                : "Torn dossiers mention a 'Human Replica Project'. Bring hero BẢO here to confront the mirror phantom!",
            ],
        fieldNotes: isBao
          ? lang === "vi"
            ? [
                "Nhật ký Gương #BS-04: Bản sao thứ 4 giữ nguyên kỹ thuật song đoản đao và tàng hình tuyệt đối.",
                "Ghi chú cuối trang: 'Khi bản thể #MT-07 và #BS-04 hội tụ, Bệ Thờ Hầm Bắc sẽ tự khai mở.'",
              ]
            : [
                "Mirror Log #BS-04: Replica 04 retains full twin-dagger arts and total shadow concealment.",
                "Bottom Margin: 'When #MT-07 and #BS-04 converge, the Northern Vault Altar unseals.'",
              ]
          : lang === "vi"
          ? [
              "Mảnh giấy bị ghim bởi đoản đao: '...chiếc gương chỉ phản hồi trước chính chủ nhân của cái bóng — Bảo...'",
            ]
          : [
              "Dagger-pinned note: '...the fractured glass answers only the shadow's true bearer — Bảo...'",
            ],
        clueSummary: isBao
          ? lang === "vi"
            ? "Đã giải mã manh mối của Bảo (Tàng Hình & Phân Thân)."
            : "Unlocked Bảo's Stealth & Replica clue."
          : lang === "vi"
          ? "Cần dùng tướng Bảo để đối mặt bóng phân thân trong gương."
          : "Use hero Bảo to trigger the mirror phantom clue.",
        rewardText: newlyUnlocked
          ? lang === "vi"
            ? "+120 Xu & Kích hoạt Nhận Thức Ảnh Thật (+Tàng hình & Tốc độ)"
            : "+120 Coins & True Shadow Awareness"
          : isBao
          ? lang === "vi"
            ? "Nhận Thức Ảnh Thật: +Tốc độ & Tàng hình tức thì"
            : "True Shadow Awareness: Speed & Brief Stealth"
          : undefined,
        secrets: next,
      },
    };
  }

  // Combined secret altar ("shared_altar")
  const bothReady = next.tinClue && next.baoClue;
  const newlyCombined = bothReady && !next.combinedUnlocked;
  if (bothReady) {
    next.combinedUnlocked = true;
  }

  return {
    nextSecrets: next,
    coinBonus: newlyCombined ? 350 : 0,
    buffKind: bothReady ? "combined_relic" : null,
    payload: {
      nodeId,
      unlockedNow: newlyCombined,
      isCombinedEvent: bothReady,
      heroResonated: bothReady,
      heroName: "Tin & Bảo",
      archiveCode: bothReady ? "#ZERO-00" : "#VAULT-SEAL",
      themeVariant: bothReady ? "combined" : "dormant",
      specimenMeta: bothReady
        ? lang === "vi"
          ? "CHỨNG NHÂN HUYẾT ẢNH · HAI NHÁNH SỐNG SÓT DUY NHẤT"
          : "BLOODSHADE WITNESS · SOLE SURVIVING BRANCHES"
        : lang === "vi"
        ? `PHONG ẤN HẦM BẮC · ${(next.tinClue ? 1 : 0) + (next.baoClue ? 1 : 0)}/2 ẤN KÝ`
        : `NORTHERN VAULT SEAL · ${(next.tinClue ? 1 : 0) + (next.baoClue ? 1 : 0)}/2 SIGILS`,
      title: bothReady
        ? lang === "vi"
          ? "SỰ KIỆN ẨN: HỒ SƠ BỊ XÓA KHỎI LỊCH SỬ"
          : "HIDDEN EVENT: THE ERASED EXPERIMENT"
        : lang === "vi"
        ? "Bệ Thờ Hầm Bí Mật (Chưa Đủ Manh Mối)"
        : "Secret Vault Altar (Clues Incomplete)",
      subtitle: bothReady
        ? lang === "vi"
          ? "DỰ ÁN HUYẾT ẢNH SỐ 0 · TIN × BẢO"
          : "PROJECT BLOODSHADE ZERO · TIN × BẢO"
        : lang === "vi"
        ? "HAI KHE ẤN ĐANG CHỜ ĐƯỢC KHAI MỞ"
        : "TWO SEALS AWAIT AWAKENING",
      quote: bothReady
        ? lang === "vi"
          ? "“Một kẻ mang máu của Ma Thạch. Một kẻ là cái bóng không còn bản gốc. Cả hai được sinh ra từ cùng một thí nghiệm mà Cổ Thành đã chôn vùi.”"
          : "“One carries the blood of Ma Thach. One is a shadow severed from its original. Both were born from the same buried Citadel experiment.”"
        : undefined,
      paragraphs: bothReady
        ? [
            lang === "vi"
              ? "Khi cả Ấn Ký Ma Thạch của Tin và Ký Ức Bản Sao của Bảo được đặt lên bệ thờ trong Hầm Bí Mật, phiến đá cổ nứt ra để lộ kho lưu trữ tối mật từng bị xóa sạch khỏi biên niên sử."
              : "With both Tin's Ma Thach sigil and Bảo's Replica memory placed upon the Vault Altar, the ancient stone parts to reveal archives erased from history.",
            lang === "vi"
              ? "Hồ sơ gốc tiết lộ: Dự Án Huyết Ảnh Số 0 tại Cổ Thành Huyết Táng từng dùng máu huyết Ma Thạch để tạo ra những chiến binh bất tử, đồng thời tách linh hồn thành các bản sao ảnh sát. Tin và Bảo chính là hai nhánh sống sót duy nhất của cùng một cuộc thí nghiệm định mệnh ấy!"
              : "Original logs reveal Project Bloodshade Zero inside the Citadel used Ma Thach blood to forge immortal hosts while splitting consciousness into shadow replicas. Tin and Bảo are the sole surviving branches of that single erased experiment!",
          ]
        : [
            lang === "vi"
              ? "Trên bệ đá sâu trong Hầm Bí Mật có hai hốc phong ấn: một rực màu đỏ máu Ma Thạch, một phản chiếu ánh tím sai lệch của gương cổ."
              : "Deep inside the Secret Vault, the altar holds two sockets: one stained with Ma Thach crimson, the other gleaming with distorted violet glass.",
            lang === "vi"
              ? `Trạng thái hiện tại: ${next.tinClue ? "✓ Đã có manh mối của Tin" : "○ Chưa mở manh mối Tin (góc Đông Bắc, dùng Tin)"} · ${next.baoClue ? "✓ Đã có manh mối của Bảo" : "○ Chưa mở manh mối Bảo (góc Tây Nam, dùng Bảo)"}.`
              : `Progress: ${next.tinClue ? "✓ Tin clue found" : "○ Tin clue missing (NE corner as Tin)"} · ${next.baoClue ? "✓ Bảo clue found" : "○ Bảo clue missing (SW corner as Bảo)"}.`,
          ],
      fieldNotes: bothReady
        ? lang === "vi"
          ? [
              "Nhánh Huyết (#MT-07 · Tin): Tái tạo sức mạnh Ma Thạch trực tiếp từ huyết tương chủ thể.",
              "Nhánh Ảnh (#BS-04 · Bảo): Phân tách ý thức qua gương sai lệch, tạo bản thể ẩn mình không dấu vết.",
              "Kết luận Sổ Cái 0: Không thể tách rời — máu gọi bóng, bóng phản chiếu máu.",
            ]
          : [
              "Blood Branch (#MT-07 · Tin): Channelled raw Ma Thach energy directly through living veins.",
              "Shadow Branch (#BS-04 · Bảo): Split consciousness through distorted mirrors into traceless stealth replicas.",
              "Ledger 0 Conclusion: Inseparable — the blood calls the shadow, and the shadow reflects the blood.",
            ]
        : undefined,
      clueSummary: bothReady
        ? lang === "vi"
          ? "Đã khám phá trọn vẹn Bí Mật Chung của Tin & Bảo!"
          : "Uncovered the Shared Secret of Tin & Bảo!"
        : lang === "vi"
        ? "Tìm đủ cả manh mối của Tin và Bảo để kích hoạt Sự Kiện Ẩn."
        : "Find both Tin's and Bảo's clues to unlock the Hidden Event.",
      rewardText: newlyCombined
        ? lang === "vi"
          ? "+350 Xu · Danh hiệu bí mật 'Chứng Nhân Huyết Ảnh' & Hồi sinh lực!"
          : "+350 Coins · 'Bloodshade Witness' Relic & Full Surge!"
        : bothReady
        ? lang === "vi"
          ? "Phước Lành Huyết Ảnh: Hồi 25% HP & Lá chắn cổ đại"
          : "Bloodshade Blessing: +25% HP & Ancient Shield"
        : undefined,
      secrets: next,
    },
  };
}

export function getCitadelSecretCompassTarget(
  heroId: string | undefined,
  secrets: CitadelSecretsProgress | undefined,
  lang: "vi" | "en" = "vi"
): {
  nodeId: CitadelInteractableId;
  x: number;
  y: number;
  icon: string;
  tag: string;
  color: string;
  bg: string;
} | null {
  if (!secrets) return null;
  if (heroId === "tin" && !secrets.tinClue) {
    const node = BLOOD_CITADEL_INTERACTABLES[0];
    return {
      nodeId: node.id,
      x: node.x,
      y: node.y,
      icon: "🩸",
      tag: lang === "en" ? "MA THACH #MT-07" : "MA THẠCH #MT-07",
      color: "#FB7185",
      bg: "rgba(136, 19, 55, 0.9)",
    };
  }
  if (heroId === "bao" && !secrets.baoClue) {
    const node = BLOOD_CITADEL_INTERACTABLES[1];
    return {
      nodeId: node.id,
      x: node.x,
      y: node.y,
      icon: "🪞",
      tag: lang === "en" ? "MIRROR #BS-04" : "GƯƠNG #BS-04",
      color: "#E879F9",
      bg: "rgba(88, 28, 135, 0.9)",
    };
  }
  if (secrets.tinClue && secrets.baoClue && !secrets.combinedUnlocked) {
    const node = BLOOD_CITADEL_INTERACTABLES[2];
    return {
      nodeId: node.id,
      x: node.x,
      y: node.y,
      icon: "✦",
      tag: lang === "en" ? "VAULT #ZERO-00" : "HẦM BÍ MẬT",
      color: "#FACC15",
      bg: "rgba(120, 53, 15, 0.92)",
    };
  }
  return null;
}
