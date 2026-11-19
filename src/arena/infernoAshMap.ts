export const INFERNO_MAP_WIDTH = 2400;
export const INFERNO_MAP_HEIGHT = 2100;
export const INFERNO_SPAWN = { x: 280, y: 1840 };

export type InfernoZoneId =
  | "zone_1"
  | "zone_2"
  | "zone_3"
  | "zone_4"
  | "zone_5"
  | "zone_6"
  | "zone_7"
  | "zone_8";

export interface InfernoZoneDef {
  id: InfernoZoneId;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  accentColor: string;
  name: { vi: string; en: string };
  subtitle: { vi: string; en: string };
}

export interface InfernoRectObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | "gate_wall"
    | "ruin_wall"
    | "pillar"
    | "altar_stone"
    | "cart_wreck"
    | "bookshelf"
    | "bunker_wall"
    | "locked_gate"
    | "destructible_wall"
    | "chasm_void";
  label: string;
  gateId?: InfernoGateId;
  destructibleId?: string;
}

export type InfernoGateId = "gate_archive" | "gate_fortress_depot" | "gate_four_chairs";

export interface InfernoGateDef {
  id: InfernoGateId;
  x: number;
  y: number;
  w: number;
  h: number;
  requiredKey?: string;
  requiresThreeClues?: boolean;
  label: { vi: string; en: string };
}

export interface InfernoDestructibleWallDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  maxHp: number;
  hint: { vi: string; en: string };
}

export interface InfernoDestructibleRuntime extends InfernoDestructibleWallDef {
  hp: number;
  destroyed: boolean;
  hitFlash: number;
}

export type InfernoInteractableId =
  | "gate_inscription"
  | "abandoned_house_echo"
  | "guardhouse_key"
  | "dung_crypt"
  | "catacomb_switch"
  | "danh_shrine"
  | "temple_tablet"
  | "longhoi_console"
  | "fortress_switch"
  | "archive_desk"
  | "archive_vault_map"
  | "four_chairs_letters"
  | "trung_orb_pedestal"
  | "wall_prophecy"
  | "crater_relic";

export interface InfernoInteractableDef {
  id: InfernoInteractableId;
  zoneId: InfernoZoneId;
  x: number;
  y: number;
  radius: number;
  kind: "clue" | "doc" | "key" | "switch" | "gate_seal" | "orb" | "echo";
  heroIdRequired: "dung" | "danh" | "longhoi" | "trung" | null;
  docId?: string;
  grantsKey?: string;
  unlocksGate?: InfernoGateId;
  title: { vi: string; en: string };
  shortPrompt: { vi: string; en: string };
}

export interface InfernoDocEntry {
  id: string;
  code: string;
  zoneId: InfernoZoneId;
  category: "letter" | "journal" | "audio" | "map" | "dossier";
  title: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  heroTag?: string;
  paragraphs: { vi: string; en: string }[];
}

export interface InfernoLightningHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  state: "cooldown" | "telegraph" | "flash";
  timer: number;
  cooldownDuration: number;
  didHit: boolean;
}

export interface InfernoFireFissureHazard {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  state: "dormant" | "glow" | "erupt";
  timer: number;
  tickCd: number;
}

export interface InfernoMissileLockHazard {
  id: string;
  padX: number;
  padY: number;
  targetX: number;
  targetY: number;
  missileX: number;
  missileY: number;
  state: "cooldown" | "tracking" | "locked" | "flying";
  timer: number;
  blastRadius: number;
}

export interface InfernoCollapsibleBridge {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  axis: "h" | "v";
  state: "intact" | "shaking" | "collapsed";
  timer: number;
}

export interface InfernoRuinAmbushZone {
  id: string;
  zoneId: InfernoZoneId;
  x: number;
  y: number;
  triggerRadius: number;
  spawnRadius: number;
  state: "armed" | "warning" | "cooldown";
  timer: number;
}

export interface InfernoArcaneZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  phase: number;
  exposureSec: number;
  tickCd: number;
}

export interface InfernoPhantomEntity {
  kind: "hound_three_head" | "ash_child" | "fourth_chair_shadow";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface InfernoProgressState {
  dungClue: boolean;
  danhClue: boolean;
  longhoiClue: boolean;
  fourChairsUnlocked: boolean;
  trungTriggered: boolean;
  collectedDocs: string[];
  keysFound: string[];
  openedDoors: InfernoGateId[];
  destroyedWalls: string[];
  inspectedNodes: InfernoInteractableId[];
}

export interface InfernoDialogStep {
  speaker: string;
  speakerColor?: string;
  text: string;
  subtext?: string;
}

export interface InfernoStoryPayload {
  nodeId: InfernoInteractableId;
  zoneId: InfernoZoneId;
  title: string;
  subtitle: string;
  code: string;
  themeVariant: "dung" | "danh" | "longhoi" | "trung" | "archive" | "neutral";
  isSecretDiscovery: boolean;
  unlockedNow: boolean;
  isTrungReveal: boolean;
  steps: InfernoDialogStep[];
  paragraphs: string[];
  clueSummary: string;
  rewardText?: string;
  audioCue?: "thunder" | "whisper" | "terminal" | "trung_laugh" | "secret" | "door" | "doc";
  progress: InfernoProgressState;
}

export interface InfernoRuntimeState {
  mapId: string;
  currentZoneId: InfernoZoneId;
  destructibles: InfernoDestructibleRuntime[];
  lightningStrikes: InfernoLightningHazard[];
  fireFissures: InfernoFireFissureHazard[];
  missileLocks: InfernoMissileLockHazard[];
  collapsibleBridges: InfernoCollapsibleBridge[];
  ruinAmbushes: InfernoRuinAmbushZone[];
  unstableArcaneZones: InfernoArcaneZone[];
  phantoms: InfernoPhantomEntity[];
  lightningFlash: number;
  trungDarknessTimer: number;
  chairShadowVanished: boolean;
  orbReflectedTrung: boolean;
  lastDiscoveryToast: string | null;
  lastDiscoveryTimer: number;
  activeStoryModal: InfernoStoryPayload | null;
  _seenZoneEntries: Set<string>;
}

export const INFERNO_ZONES: InfernoZoneDef[] = [
  {
    id: "zone_1",
    index: 1,
    x: 0,
    y: 1560,
    w: 860,
    h: 540,
    accentColor: "#F97316",
    name: { vi: "Khu 1 · Cổng Thành Tro Tàn", en: "Zone 1 · Gate of Cinders" },
    subtitle: { vi: "Cổng thành sập, xe cháy đen & lối phụ nứt vỡ", en: "Sundered gate, charred carts & secret alleys" },
  },
  {
    id: "zone_2",
    index: 2,
    x: 520,
    y: 1080,
    w: 980,
    h: 500,
    accentColor: "#EF4444",
    name: { vi: "Khu 2 · Quảng Trường Tro Đỏ", en: "Zone 2 · Red Ash Plaza" },
    subtitle: { vi: "Tượng đổ nát, dấu chân lạ & tiếng trẻ con vọng từ nhà hoang", en: "Ruined monument, eerie footprints & hollow echoes" },
  },
  {
    id: "zone_3",
    index: 3,
    x: 0,
    y: 560,
    w: 620,
    h: 1000,
    accentColor: "#FACC15",
    name: { vi: "Khu 3 · Hầm Hiến Tế", en: "Zone 3 · Sacrificial Crypt" },
    subtitle: { vi: "Ba bệ đá, xiềng xích khổng lồ & ấn ký sấm sét", en: "Three stone altars, chained names & lightning runes" },
  },
  {
    id: "zone_4",
    index: 4,
    x: 1520,
    y: 980,
    w: 880,
    h: 640,
    accentColor: "#FB923C",
    name: { vi: "Khu 4 · Điện Thờ Long Hỏa", en: "Zone 4 · Wyrmfire Temple" },
    subtitle: { vi: "Tượng rồng nung chảy, cột đá nứt & tro tàn nghi lễ", en: "Melted dragon idol, cracked columns & ritual scars" },
  },
  {
    id: "zone_5",
    index: 5,
    x: 1560,
    y: 0,
    w: 840,
    h: 980,
    accentColor: "#F59E0B",
    name: { vi: "Khu 5 · Pháo Đài Thiên Hỏa", en: "Zone 5 · Skyfire Bastion" },
    subtitle: { vi: "Bệ phóng tên lửa, kho đạn, đường ray & phòng điều khiển", en: "Missile pads, ammo depot, rail tracks & control bunker" },
  },
  {
    id: "zone_6",
    index: 6,
    x: 1340,
    y: 1620,
    w: 1060,
    h: 480,
    accentColor: "#E11D48",
    name: { vi: "Khu 6 · Thư Khố Bị Thiêu", en: "Zone 6 · Scorched Archives" },
    subtitle: { vi: "Hồ sơ thảm họa bị xé bỏ & những trang sử bị xóa", en: "Torn catastrophe files & erased city chronicles" },
  },
  {
    id: "zone_7",
    index: 7,
    x: 780,
    y: 0,
    w: 760,
    h: 430,
    accentColor: "#A855F7",
    name: { vi: "Khu 7 · Căn Phòng Bốn Chiếc Ghế", en: "Zone 7 · Chamber of Four Chairs" },
    subtitle: { vi: "Mật thất dưới lòng đất · Ba lá thư cùng nét chữ & quả cầu ma thuật", en: "Hidden underground sanctum · Three identical letters & arcane orb" },
  },
  {
    id: "zone_8",
    index: 8,
    x: 620,
    y: 430,
    w: 940,
    h: 650,
    accentColor: "#C084FC",
    name: { vi: "Khu 8 · Miệng Vực Tận Hỏa", en: "Zone 8 · Abyssal Crater" },
    subtitle: { vi: "Hố thiên thạch khổng lồ · Đá lơ lửng & năng lượng ma thuật bất ổn", en: "Giant meteor crater · Floating stones & unstable rifts" },
  },
];

export const INFERNO_GATES: InfernoGateDef[] = [
  {
    id: "gate_archive",
    x: 1380,
    y: 1790,
    w: 38,
    h: 150,
    requiredKey: "archive_key",
    label: { vi: "Cổng Sắt Thư Khố (Cần Chìa Khóa Thư Khố)", en: "Scorched Archive Iron Gate (Requires Archive Key)" },
  },
  {
    id: "gate_fortress_depot",
    x: 1680,
    y: 590,
    w: 38,
    h: 150,
    requiredKey: "bunker_key",
    label: { vi: "Cửa Kho Đạn Pháo Đài (Cần Chìa Hầm / Công Tắc)", en: "Bastion Munitions Door (Requires Bunker Key / Switch)" },
  },
  {
    id: "gate_four_chairs",
    x: 1050,
    y: 405,
    w: 180,
    h: 36,
    requiresThreeClues: true,
    label: { vi: "Cổng Mật Thất Bốn Chiếc Ghế (Cần Đủ 3 Manh Mối Dũng · Danh · Long Hói)", en: "Chamber of Four Chairs Seal (Requires All 3 Clues)" },
  },
];

export const INFERNO_DESTRUCTIBLE_WALLS: InfernoDestructibleWallDef[] = [
  {
    id: "cw_gate_alley",
    x: 120,
    y: 1530,
    w: 150,
    h: 40,
    maxHp: 120,
    hint: { vi: "Tường nứt thông sang Hầm Hiến Tế (Phá bằng chiêu thức)", en: "Cracked wall leading to Sacrificial Crypt" },
  },
  {
    id: "cw_archive_back",
    x: 1860,
    y: 1595,
    w: 150,
    h: 40,
    maxHp: 140,
    hint: { vi: "Đống đổ nát nối Điện Thờ sang Thư Khố Bị Thiêu", en: "Collapsed rubble linking Temple to Scorched Archives" },
  },
  {
    id: "cw_fortress_wall",
    x: 1550,
    y: 470,
    w: 44,
    h: 150,
    maxHp: 180,
    hint: { vi: "Tường bê tông nứt · Dụ Tên Lửa Pháo Đài hoặc dùng chiêu phá vỡ!", en: "Cracked blast wall · Bait a Bastion Missile or strike with skills!" },
  },
  {
    id: "cw_crater_flank",
    x: 595,
    y: 800,
    w: 40,
    h: 140,
    maxHp: 130,
    hint: { vi: "Vách đá nứt mở lối tắt giữa Hầm Hiến Tế và Miệng Vực", en: "Fractured obsidian wall between Crypt and Crater" },
  },
];

export const INFERNO_STATIC_OBSTACLES: InfernoRectObstacle[] = [
  // Khu 1: Cổng Thành Tro Tàn (South-West collapsed gate & carts)
  { id: "k1_gate_left", x: 30, y: 1985, w: 190, h: 72, kind: "gate_wall", label: "Trụ Cổng Sập Tây" },
  { id: "k1_gate_right", x: 340, y: 1985, w: 210, h: 72, kind: "gate_wall", label: "Trụ Cổng Sập Đông" },
  { id: "k1_cart_1", x: 145, y: 1710, w: 72, h: 42, kind: "cart_wreck", label: "Xe Cháy Đen" },
  { id: "k1_cart_2", x: 515, y: 1875, w: 68, h: 44, kind: "cart_wreck", label: "Xe Tiếp Tế Cháy" },
  { id: "k1_statue_wreck", x: 475, y: 1690, w: 60, h: 58, kind: "pillar", label: "Xác Tượng Đá" },
  { id: "k1_div_west", x: 0, y: 1530, w: 120, h: 42, kind: "ruin_wall", label: "Tường Thành Tây" },
  { id: "k1_div_mid", x: 270, y: 1530, w: 140, h: 42, kind: "ruin_wall", label: "Tường Vỡ" },
  { id: "k1_div_east", x: 640, y: 1530, w: 220, h: 42, kind: "ruin_wall", label: "Tường Đổ Quảng Trường" },

  // Khu 2: Quảng Trường Tro Đỏ
  { id: "k2_monument", x: 942, y: 1312, w: 76, h: 76, kind: "altar_stone", label: "Tượng Đá Vỡ Quảng Trường" },
  { id: "k2_house_nw", x: 590, y: 1125, w: 130, h: 86, kind: "ruin_wall", label: "Nhà Hoang Tro Bụi" },
  { id: "k2_guardhouse", x: 1275, y: 1395, w: 118, h: 72, kind: "ruin_wall", label: "Trạm Gác Cháy Dở" },
  { id: "k2_nwall_l", x: 550, y: 1055, w: 290, h: 36, kind: "ruin_wall", label: "Lan Can Bắc Tây" },
  { id: "k2_nwall_r", x: 1160, y: 1055, w: 360, h: 36, kind: "ruin_wall", label: "Lan Can Bắc Đông" },

  // Khu 3: Hầm Hiến Tế
  { id: "k3_wall_e1", x: 595, y: 580, w: 42, h: 220, kind: "ruin_wall", label: "Vách Hầm Đông" },
  { id: "k3_wall_e2", x: 595, y: 940, w: 42, h: 170, kind: "ruin_wall", label: "Vách Hầm Nam" },
  { id: "k3_altar_1", x: 140, y: 655, w: 58, h: 52, kind: "altar_stone", label: "Bệ Hiến Tế I" },
  { id: "k3_altar_2", x: 252, y: 635, w: 58, h: 52, kind: "altar_stone", label: "Bệ Hiến Tế II" },
  { id: "k3_altar_3", x: 364, y: 655, w: 58, h: 52, kind: "altar_stone", label: "Bệ Hiến Tế III" },
  { id: "k3_pillar_s", x: 430, y: 985, w: 46, h: 46, kind: "pillar", label: "Trụ Xiềng Xích" },

  // Khu 4: Điện Thờ Long Hỏa
  { id: "k4_dragon_base", x: 1986, y: 1152, w: 72, h: 64, kind: "altar_stone", label: "Bệ Tượng Rồng Nung Chảy" },
  { id: "k4_col_1", x: 1800, y: 1110, w: 46, h: 46, kind: "pillar", label: "Cột Đá Long Hỏa" },
  { id: "k4_col_2", x: 2210, y: 1110, w: 46, h: 46, kind: "pillar", label: "Cột Đá Long Hỏa" },
  { id: "k4_col_3", x: 1800, y: 1410, w: 46, h: 46, kind: "pillar", label: "Cột Đá Nứt" },
  { id: "k4_col_4", x: 2210, y: 1410, w: 46, h: 46, kind: "pillar", label: "Cột Đá Nứt" },
  { id: "k4_south_w1", x: 1380, y: 1595, w: 480, h: 40, kind: "ruin_wall", label: "Tường Nam Điện Thờ" },
  { id: "k4_south_w2", x: 2010, y: 1595, w: 390, h: 40, kind: "ruin_wall", label: "Tường Nam Điện Thờ" },

  // Khu 5: Pháo Đài Thiên Hỏa
  { id: "k5_bunker_w1", x: 1550, y: 620, w: 44, h: 320, kind: "bunker_wall", label: "Tường Pháo Đài Tây" },
  { id: "k5_bunker_w2", x: 1550, y: 120, w: 44, h: 350, kind: "bunker_wall", label: "Tường Pháo Đài Tây Bắc" },
  { id: "k5_depot_top", x: 1680, y: 548, w: 280, h: 42, kind: "bunker_wall", label: "Tường Kho Đạn" },
  { id: "k5_pad_1", x: 1885, y: 265, w: 68, h: 68, kind: "bunker_wall", label: "Bệ Phóng Tên Lửa Alpha" },
  { id: "k5_pad_2", x: 2150, y: 265, w: 68, h: 68, kind: "bunker_wall", label: "Bệ Phóng Tên Lửa Beta" },
  { id: "k5_console_box", x: 2092, y: 618, w: 62, h: 44, kind: "bunker_wall", label: "Trạm Máy Tính Thiên Hỏa" },

  // Khu 6: Thư Khố Bị Thiêu
  { id: "k6_wall_w1", x: 1380, y: 1595, w: 38, h: 195, kind: "ruin_wall", label: "Tường Thư Khố" },
  { id: "k6_wall_w2", x: 1380, y: 1940, w: 38, h: 160, kind: "ruin_wall", label: "Tường Thư Khố" },
  { id: "k6_shelf_1", x: 1605, y: 1715, w: 110, h: 36, kind: "bookshelf", label: "Kệ Sách Cháy" },
  { id: "k6_shelf_2", x: 1875, y: 1715, w: 110, h: 36, kind: "bookshelf", label: "Kệ Hồ Sơ Đổ" },
  { id: "k6_shelf_3", x: 1605, y: 1965, w: 110, h: 36, kind: "bookshelf", label: "Giá Sách Tro Tàn" },
  { id: "k6_shelf_4", x: 2085, y: 1785, w: 40, h: 135, kind: "bookshelf", label: "Tủ Lưu Trữ Sắt" },

  // Khu 7: Căn Phòng Bốn Chiếc Ghế
  { id: "k7_wall_n", x: 785, y: 0, w: 710, h: 36, kind: "bunker_wall", label: "Vách Mật Thất Bắc" },
  { id: "k7_wall_w", x: 785, y: 0, w: 40, h: 441, kind: "bunker_wall", label: "Vách Mật Thất Tây" },
  { id: "k7_wall_e", x: 1455, y: 0, w: 40, h: 441, kind: "bunker_wall", label: "Vách Mật Thất Đông" },
  { id: "k7_wall_sw", x: 825, y: 405, w: 225, h: 36, kind: "bunker_wall", label: "Cổng Mật Thất Trái" },
  { id: "k7_wall_se", x: 1230, y: 405, w: 225, h: 36, kind: "bunker_wall", label: "Cổng Mật Thất Phải" },

  // Khu 8: Miệng Vực Tận Hỏa (Floating crater monoliths on rim, keeping center clear for final boss fight)
  { id: "k8_rock_nw", x: 735, y: 555, w: 58, h: 52, kind: "pillar", label: "Tảng Đá Lơ Lửng" },
  { id: "k8_rock_ne", x: 1390, y: 555, w: 58, h: 52, kind: "pillar", label: "Tảng Đá Lơ Lửng" },
  { id: "k8_rock_sw", x: 735, y: 895, w: 58, h: 52, kind: "pillar", label: "Mảnh Vỡ Thiên Thạch" },
  { id: "k8_rock_se", x: 1390, y: 895, w: 58, h: 52, kind: "pillar", label: "Mảnh Vỡ Thiên Thạch" },
];

export const INFERNO_COLLAPSIBLE_BRIDGE_DEFS: Omit<InfernoCollapsibleBridge, "state" | "timer">[] = [
  { id: "bridge_east_temple", x: 1470, y: 905, w: 120, h: 72, axis: "h" },
  { id: "bridge_north_crater", x: 1085, y: 445, w: 110, h: 86, axis: "v" },
];

export const INFERNO_INTERACTABLES: InfernoInteractableDef[] = [
  {
    id: "gate_inscription",
    zoneId: "zone_1",
    x: 410,
    y: 1935,
    radius: 76,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_gate_edict",
    title: { vi: "Bia Đá Cổng Thành Cháy Sém", en: "Scorched Gatehouse Stele" },
    shortPrompt: { vi: "Đọc bia đá Cổng Thành", en: "Read Gate Stele" },
  },
  {
    id: "abandoned_house_echo",
    zoneId: "zone_2",
    x: 735,
    y: 1245,
    radius: 78,
    kind: "echo",
    heroIdRequired: null,
    docId: "doc_plaza_whispers",
    title: { vi: "Ngôi Nhà Hoang Trong Tro Đỏ", en: "Abandoned House in Red Ash" },
    shortPrompt: { vi: "Lắng nghe âm thanh trong nhà hoang", en: "Inspect Abandoned House" },
  },
  {
    id: "guardhouse_key",
    zoneId: "zone_2",
    x: 1335,
    y: 1505,
    radius: 72,
    kind: "key",
    heroIdRequired: null,
    grantsKey: "archive_key",
    docId: "doc_guard_ledger",
    title: { vi: "Xác Lính Gác & Chìa Khóa Thư Khố", en: "Fallen Sentinel & Archive Key" },
    shortPrompt: { vi: "Nhặt Chìa Khóa Thư Khố", en: "Take Archive Key" },
  },
  {
    id: "dung_crypt",
    zoneId: "zone_3",
    x: 280,
    y: 775,
    radius: 88,
    kind: "clue",
    heroIdRequired: "dung",
    docId: "doc_dung_chains",
    title: { vi: "Hầm Hiến Tế · Ba Sợi Xiềng Khổng Lồ", en: "Sacrificial Crypt · Three Colossal Chains" },
    shortPrompt: { vi: "Khảo sát xiềng xích (Bí mật Dũng)", en: "Inspect Chains (Dũng Secret)" },
  },
  {
    id: "catacomb_switch",
    zoneId: "zone_3",
    x: 135,
    y: 970,
    radius: 74,
    kind: "key",
    heroIdRequired: null,
    grantsKey: "bunker_key",
    title: { vi: "Cơ Quan Hầm & Chìa Kho Đạn", en: "Crypt Mechanism & Bunker Key" },
    shortPrompt: { vi: "Kéo cần gạt & lấy Chìa Kho Đạn", en: "Pull Lever & Take Bunker Key" },
  },
  {
    id: "danh_shrine",
    zoneId: "zone_4",
    x: 2022,
    y: 1265,
    radius: 88,
    kind: "clue",
    heroIdRequired: "danh",
    docId: "doc_danh_dragon",
    title: { vi: "Điện Thờ Long Hỏa · Tượng Rồng Bị Xiềng", en: "Wyrmfire Temple · Chained Dragon Idol" },
    shortPrompt: { vi: "Chạm vảy rồng cháy sáng (Bí mật Danh)", en: "Touch Glowing Scales (Danh Secret)" },
  },
  {
    id: "temple_tablet",
    zoneId: "zone_4",
    x: 2240,
    y: 1500,
    radius: 72,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_dragon_ritual",
    title: { vi: "Phiến Đá Nghi Lễ Rồng Lửa", en: "Wyrmfire Ritual Tablet" },
    shortPrompt: { vi: "Thu thập phiến đá nghi lễ", en: "Collect Ritual Tablet" },
  },
  {
    id: "longhoi_console",
    zoneId: "zone_5",
    x: 2124,
    y: 705,
    radius: 90,
    kind: "clue",
    heroIdRequired: "longhoi",
    docId: "doc_longhoi_log",
    title: { vi: "Phòng Điều Khiển · Màn Hình Tọa Độ Cũ", en: "Bastion Control · Coordinates Terminal" },
    shortPrompt: { vi: "Bật máy điều khiển & băng ghi âm (Long Hói)", en: "Activate Terminal & Tape (Long Hói)" },
  },
  {
    id: "fortress_switch",
    zoneId: "zone_5",
    x: 1755,
    y: 210,
    radius: 78,
    kind: "switch",
    heroIdRequired: null,
    unlocksGate: "gate_fortress_depot",
    docId: "doc_bombardment_order",
    title: { vi: "Công Tắc Thủy Lực & Lệnh Khai Hỏa", en: "Hydraulic Switch & Fire Order" },
    shortPrompt: { vi: "Mở cửa Kho Đạn & lấy hồ sơ", en: "Open Munitions Door & Read Order" },
  },
  {
    id: "archive_desk",
    zoneId: "zone_6",
    x: 1765,
    y: 1850,
    radius: 82,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_erased_chronicle",
    title: { vi: "Bàn Lưu Trữ · Trang Sử Bị Xé", en: "Archive Desk · Torn Chronicles" },
    shortPrompt: { vi: "Đọc hồ sơ thảm họa bị xóa", en: "Read Erased Disaster File" },
  },
  {
    id: "archive_vault_map",
    zoneId: "zone_6",
    x: 1995,
    y: 1935,
    radius: 76,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_city_blueprint",
    title: { vi: "Bản Đồ Mật Đạo Thành Phố Cổ", en: "Ancient City Subterranean Map" },
    shortPrompt: { vi: "Nhặt bản đồ ngầm thành phố", en: "Collect Subterranean Map" },
  },
  {
    id: "four_chairs_letters",
    zoneId: "zone_7",
    x: 985,
    y: 225,
    radius: 80,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_four_chairs_letters",
    title: { vi: "Ba Lá Thư Cùng Nét Chữ", en: "Three Letters, One Handwriting" },
    shortPrompt: { vi: "Đọc ba lá thư trên bàn đá", en: "Read Three Identical Letters" },
  },
  {
    id: "trung_orb_pedestal",
    zoneId: "zone_7",
    x: 1140,
    y: 225,
    radius: 92,
    kind: "orb",
    heroIdRequired: "trung",
    docId: "doc_trung_truth",
    title: { vi: "Quả Cầu Ma Thuật · Căn Phòng Bốn Chiếc Ghế", en: "Arcane Orb · Chamber of Four Chairs" },
    shortPrompt: { vi: "Nhìn vào quả cầu ma thuật", en: "Gaze into the Arcane Orb" },
  },
  {
    id: "wall_prophecy",
    zoneId: "zone_7",
    x: 1320,
    y: 165,
    radius: 76,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_wall_inscription",
    title: { vi: "Dòng Chữ Khắc Sâu Trên Tường Cháy", en: "Carved Inscription on Charred Wall" },
    shortPrompt: { vi: "Đọc dòng chữ khắc trên tường", en: "Read Wall Inscription" },
  },
  {
    id: "crater_relic",
    zoneId: "zone_8",
    x: 1090,
    y: 775,
    radius: 82,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_crater_core",
    title: { vi: "Mảnh Vỡ Lõi Thiên Thạch Tận Hỏa", en: "Inferno Meteor Core Shard" },
    shortPrompt: { vi: "Khảo sát dị năng Miệng Vực", en: "Inspect Crater Anomaly" },
  },
];

export const INFERNO_DOCS: Record<string, InfernoDocEntry> = {
  doc_gate_edict: {
    id: "doc_gate_edict",
    code: "HN-01",
    zoneId: "zone_1",
    category: "dossier",
    title: { vi: "Bia Lệnh Phong Tỏa Cổng Thành", en: "City Gate Lockdown Edict" },
    subtitle: { vi: "Khu 1 · Cổng Thành Tro Tàn", en: "Zone 1 · Gate of Cinders" },
    paragraphs: [
      {
        vi: "Lệnh khẩn của Hội Đồng Phòng Thủ: Mọi cổng thành phải sập xuống trước nửa đêm. Không ai được phép rời khỏi vành đai nội thành, kể cả trẻ em ở Khu Dân Cư Cũ.",
        en: "Emergency Defense Council Order: All city gates must seal before midnight. None may cross the inner perimeter, including civilians of the Old Residential Ward.",
      },
      {
        vi: "Bên cạnh bia đá vẫn còn hằn vết cào của móng sắt và mùi lưu huỳnh đặc quánh — như thể thứ thiêu rụi thành phố không chỉ đến từ trên trời.",
        en: "Deep iron claw gouges scar the stone beside thick sulfur residue — as if the calamity rose from beneath as well as above.",
      },
    ],
  },
  doc_plaza_whispers: {
    id: "doc_plaza_whispers",
    code: "HN-02",
    zoneId: "zone_2",
    category: "journal",
    title: { vi: "Nhật Ký Mẹ Con Trong Nhà Hoang", en: "Abandoned House Ash Journal" },
    subtitle: { vi: "Khu 2 · Quảng Trường Tro Đỏ", en: "Zone 2 · Red Ash Plaza" },
    paragraphs: [
      {
        vi: "“Lũ trẻ vẫn đếm từng tiếng bước chân ngoài quảng trường. Có người mặc giáp rồng đỏ đứng trước cửa thề sẽ quay lại dắt chúng đi...”",
        en: "“The children still count footsteps in the plaza. A warrior in ember-dragon armor swore at our door he would return to lead them out...”",
      },
      {
        vi: "Dưới lớp tro dày trước hiên nhà hằn hai hàng dấu chân: một dấu chân khổng lồ ba móng hướng về Hầm Tây, dấu còn lại bén lửa dẫn thẳng sang Điện Thờ Đông.",
        en: "Two distinct trails remain pressed into deep ash: triple-clawed tracks heading West toward the Crypt, and scorched bootprints leading East to the Temple.",
      },
    ],
  },
  doc_guard_ledger: {
    id: "doc_guard_ledger",
    code: "HN-03",
    zoneId: "zone_2",
    category: "dossier",
    title: { vi: "Sổ Trực Đội Tuần Tra & Chìa Thư Khố", en: "Patrol Ledger & Archive Key" },
    subtitle: { vi: "Khu 2 · Trạm Gác Cháy Dở", en: "Zone 2 · Burned Guardhouse" },
    paragraphs: [
      {
        vi: "“Thư Khố phía Đông Nam đã khóa trái theo lệnh mật. Ai giữ Chìa Khóa Sắt mới được đọc phần biên niên sử chưa bị đốt.”",
        en: "“The Southeast Archives were locked down by sealed decree. Only the Iron Key holder may read what survived the purge.”",
      },
    ],
  },
  doc_dung_chains: {
    id: "doc_dung_chains",
    code: "DŨNG · K3",
    zoneId: "zone_3",
    category: "dossier",
    heroTag: "dung",
    title: { vi: "Hồ Sơ Xiềng Xích Ba Đầu", en: "Three-Headed Chains Record" },
    subtitle: { vi: "Bí mật Dũng · Khu 3 Hầm Hiến Tế", en: "Dũng Secret · Zone 3 Crypt" },
    paragraphs: [
      {
        vi: "Ba sợi xiềng khổng lồ nối liền ba bệ đá mang những cái tên bị đục xóa gần hết: chỉ còn loáng thoáng chữ 'D...NG', 'V...' và 'H...'.",
        en: "Three massive iron chains bind the altars, etched with nearly erased names: only faint 'D...NG', 'V...' and 'H...' remain.",
      },
      {
        vi: "Bóng ảnh Chó Ba Đầu rít lên trong tiếng sấm dội hầm đá — ký ức về nghi thức hiến tế linh hồn thú dữ để đánh đổi sức mạnh sấm sét của Dũng.",
        en: "A phantom three-headed hound howls through subterranean thunder — echoing the ritual sacrifice that forged Dũng's thunderous might.",
      },
    ],
  },
  doc_danh_dragon: {
    id: "doc_danh_dragon",
    code: "DANH · K4",
    zoneId: "zone_4",
    category: "journal",
    heroTag: "danh",
    title: { vi: "Lời Thì Thầm Trong Vảy Rồng Lửa", en: "Whispers Within Molten Scales" },
    subtitle: { vi: "Bí mật Danh · Khu 4 Điện Thờ Long Hỏa", en: "Danh Secret · Zone 4 Temple" },
    paragraphs: [
      {
        vi: "Bức tượng rồng nung chảy vẫn quấn chặt xiềng xích nóng đỏ. Khi Danh chạm vào lớp vảy cháy sáng, tiếng trẻ con vang lên từ đống tro:",
        en: "Glowing molten scales cling to the chained dragon idol. As Danh touches the blackened crest, children's voices rise from the ashes:",
      },
      {
        vi: "“Ngươi đã hứa sẽ đưa chúng ta ra ngoài... Tại sao ngọn lửa của ngươi lại bùng cháy ngay lúc cánh cổng khép lại?”",
        en: "“You promised to lead us out... Why did your dragonfire erupt the moment the gates slammed shut?”",
      },
    ],
  },
  doc_dragon_ritual: {
    id: "doc_dragon_ritual",
    code: "HN-04",
    zoneId: "zone_4",
    category: "dossier",
    title: { vi: "Phiến Đá Luyện Hồn Long Hỏa", en: "Wyrmfire Soul-Transmutation Slab" },
    subtitle: { vi: "Khu 4 · Điện Thờ Long Hỏa", en: "Zone 4 · Wyrmfire Temple" },
    paragraphs: [
      {
        vi: "“Muốn hóa Rồng Lửa không cần huyết long cổ đại — chỉ cần bảy mươi hai linh hồn còn sống làm mồi lửa trong điện thờ kín.”",
        en: "“Draconic ascension requires no ancient wyrm blood — merely seventy-two living souls sealed as tinder inside the temple.”",
      },
    ],
  },
  doc_longhoi_log: {
    id: "doc_longhoi_log",
    code: "L.HÓI · K5",
    zoneId: "zone_5",
    category: "audio",
    heroTag: "longhoi",
    title: { vi: "Băng Ghi Âm Pháo Đài · Tọa Độ Khu Dân Cư", en: "Bastion Audio Log · Residential Coordinates" },
    subtitle: { vi: "Bí mật Long Hói · Khu 5 Pháo Đài Thiên Hỏa", en: "Long Hói Secret · Zone 5 Bastion" },
    paragraphs: [
      {
        vi: "[MÀN HÌNH KHÓA MỤC TIÊU]: 14°22'B · Khu Dân Cư Cũ · Xác nhận khai hỏa loạt tên lửa số 04.",
        en: "[TARGET LOCK TERMINAL]: 14°22'N · Old Residential District · Salvo #04 Impact Confirmed.",
      },
      {
        vi: "[BĂNG GHI ÂM 3 GIỌNG]: Giọng 1 (Lạ): 'Dân thường vẫn còn trong khu đó!' — Giọng 2 (Lạ): 'Lệnh từ phòng bốn ghế không được chậm trễ.' — Giọng 3 (Long Hói): '...Khai hỏa đi. Lịch sử sẽ ghi là thiên thạch rơi.'",
        en: "[3-VOICE RECORDING]: Voice 1: 'Civilians are still inside!' — Voice 2: 'Orders from the Four Chairs allow zero delay.' — Voice 3 (Long Hói): '...Fire. History will remember a meteor.'",
      },
    ],
  },
  doc_bombardment_order: {
    id: "doc_bombardment_order",
    code: "HN-05",
    zoneId: "zone_5",
    category: "dossier",
    title: { vi: "Mật Lệnh Pháo Kích Nội Thành", en: "Inner-City Bombardment Order" },
    subtitle: { vi: "Khu 5 · Kho Đạn Thiên Hỏa", en: "Zone 5 · Munitions Bunker" },
    paragraphs: [
      {
        vi: "Ký hiệu xác nhận khớp với một tên lửa chưa phát nổ từng bắn phá tường thành phía Tây. Đạn pháo ở đây đủ sức xé toạc cả những bức tường bê tông cốt đá.",
        en: "Warhead stamps match shells capable of shattering reinforced stone blast walls when lured to impact.",
      },
    ],
  },
  doc_erased_chronicle: {
    id: "doc_erased_chronicle",
    code: "HN-06",
    zoneId: "zone_6",
    category: "dossier",
    title: { vi: "Biên Niên Sử Bị Đốt Cháy Một Nửa", en: "Half-Burned City Chronicle" },
    subtitle: { vi: "Khu 6 · Thư Khố Bị Thiêu", en: "Zone 6 · Scorched Archives" },
    paragraphs: [
      {
        vi: "“Ngày 14 tháng Mười Một: Không hề có thiên thạch nào rơi xuống lúc 21 giờ. Cột lửa đầu tiên bùng phát từ ba hướng cùng lúc: Hầm Hiến Tế, Điện Thờ Long Hỏa và Pháo Đài Thiên Hỏa.”",
        en: "“November 14th: No meteor struck at 21:00. The first firestorm erupted from three points simultaneously: the Crypt, the Temple, and the Skyfire Bastion.”",
      },
      {
        vi: "Trang tiếp theo bị xé rách hoàn toàn, chỉ còn lại dấu mực đỏ: 'Hội đồng Bốn Ghế chỉ có ba người được ghi tên.'",
        en: "The next page is ripped away, leaving one red-ink margin note: 'The Council of Four Chairs had only three names written down.'",
      },
    ],
  },
  doc_city_blueprint: {
    id: "doc_city_blueprint",
    code: "HN-07",
    zoneId: "zone_6",
    category: "map",
    title: { vi: "Bản Đồ Tầng Ngầm Căn Phòng Bốn Ghế", en: "Blueprint of the Four Chairs Sanctum" },
    subtitle: { vi: "Khu 6 · Thư Khố Bị Thiêu", en: "Zone 6 · Scorched Archives" },
    paragraphs: [
      {
        vi: "Bản vẽ đánh dấu một mật thất nằm phía Bắc Miệng Vực Tận Hỏa. Cánh cửa chỉ mở khi người mang đủ ba chứng cứ từ Dũng, Danh và Long Hói bước tới.",
        en: "Marks a hidden underground chamber north of the Abyssal Crater. Its stone seal opens only after gathering all three clues from Dũng, Danh, and Long Hói.",
      },
    ],
  },
  doc_four_chairs_letters: {
    id: "doc_four_chairs_letters",
    code: "HN-08",
    zoneId: "zone_7",
    category: "letter",
    title: { vi: "Ba Lá Thư Cùng Một Nét Chữ", en: "Three Letters in Identical Ink" },
    subtitle: { vi: "Khu 7 · Căn Phòng Bốn Chiếc Ghế", en: "Zone 7 · Chamber of Four Chairs" },
    paragraphs: [
      {
        vi: "Cả ba phong thư đặt trước ghế của Dũng, Danh và Long Hói đều do CÙNG MỘT BÀN TAY viết trước thảm họa ba tháng:",
        en: "All three sealed letters resting before Dũng, Danh, and Long Hói's chairs share ONE IDENTICAL HANDWRITING, dated three months before the ashfall:",
      },
      {
        vi: "“Mỗi người nhận lấy ngọn lửa của riêng mình. Khi thành phố này thành tro, bốn chiếc ghế sẽ chỉ còn lại bóng của kẻ quan sát.”",
        en: "“Each shall claim his own flame. When this city turns to ash, four chairs will keep only the shadow of the watcher.”",
      },
    ],
  },
  doc_wall_inscription: {
    id: "doc_wall_inscription",
    code: "HN-09",
    zoneId: "zone_7",
    category: "dossier",
    title: { vi: "Khắc Tường Mật Thất", en: "Sanctum Wall Carving" },
    subtitle: { vi: "Khu 7 · Căn Phòng Bốn Chiếc Ghế", en: "Zone 7 · Chamber of Four Chairs" },
    paragraphs: [
      {
        vi: "“Ba chiếc ghế khắc tên kẻ gây hỏa. Chiếc ghế thứ tư không tên — dành cho kẻ chưa từng bước vào phòng, nhưng đã sắp đặt cả bàn cờ từ đầu.”",
        en: "“Three chairs bear the arsonists' names. The fourth chair has none — reserved for the one who arranged the board before entering.”",
      },
    ],
  },
  doc_trung_truth: {
    id: "doc_trung_truth",
    code: "TRUNG · ∅",
    zoneId: "zone_7",
    category: "dossier",
    heroTag: "trung",
    title: { vi: "Lời Nhắn Trong Quả Cầu · Sự Thật Của Trung", en: "Orb Reflection · Trung's Truth" },
    subtitle: { vi: "Sự kiện đặc biệt Trung · Khu 7", en: "Special Trung Event · Zone 7" },
    paragraphs: [
      {
        vi: "Trong khoảnh khắc quả cầu sáng lên, mọi trang giấy cũ hóa trắng xóa. Ba chiếc ghế khắc tên trống không, còn bóng người ngồi ở chiếc ghế thứ tư tan biến ngay khi ánh mắt chạm tới.",
        en: "As the arcane orb awakens, every prior letter turns blank. Three named chairs sit empty; the silhouette on the fourth chair vanishes at a glance.",
      },
      {
        vi: "Mặt cầu phản chiếu Trung đang đứng ngay phía sau lưng ngươi: “Ngươi đến muộn rồi. Ta đã biết ngươi sẽ đến, từ trước cả khi ngươi được sinh ra.”",
        en: "The orb reflects Trung standing directly behind you: “You arrived too late. I knew you would come long before you were born.”",
      },
    ],
  },
  doc_crater_core: {
    id: "doc_crater_core",
    code: "HN-10",
    zoneId: "zone_8",
    category: "dossier",
    title: { vi: "Dị Năng Lõi Vực Tận Hỏa", en: "Abyssal Crater Resonance Log" },
    subtitle: { vi: "Khu 8 · Miệng Vực Tận Hỏa", en: "Zone 8 · Abyssal Crater" },
    paragraphs: [
      {
        vi: "Đất đá xung quanh hố sâu không mang dấu va chạm từ vũ trụ — năng lượng đỏ tím bùng ra từ dưới lòng đất lên, xé nát cả trọng lực.",
        en: "Fractured bedrock shows no cosmic impact — crimson-violet energy erupted upward from underground, wrenching stones into mid-air.",
      },
    ],
  },
};

export function createDefaultInfernoProgress(): InfernoProgressState {
  return {
    dungClue: false,
    danhClue: false,
    longhoiClue: false,
    fourChairsUnlocked: false,
    trungTriggered: false,
    collectedDocs: [],
    keysFound: [],
    openedDoors: [],
    destroyedWalls: [],
    inspectedNodes: [],
  };
}

export function normalizeInfernoProgress(raw: unknown): InfernoProgressState {
  if (!raw || typeof raw !== "object") return createDefaultInfernoProgress();
  const r = raw as Record<string, unknown>;
  const validDocs = new Set(Object.keys(INFERNO_DOCS));
  const validNodeIds = new Set(INFERNO_INTERACTABLES.map((n) => n.id));
  const validGates = new Set<InfernoGateId>(["gate_archive", "gate_fortress_depot", "gate_four_chairs"]);
  const validWalls = new Set(INFERNO_DESTRUCTIBLE_WALLS.map((w) => w.id));

  const collectedDocs = Array.isArray(r.collectedDocs)
    ? Array.from(new Set(r.collectedDocs.filter((x): x is string => typeof x === "string" && validDocs.has(x))))
    : [];
  const keysFound = Array.isArray(r.keysFound)
    ? Array.from(new Set(r.keysFound.filter((x): x is string => typeof x === "string" && x.length > 0)))
    : [];
  const openedDoors = Array.isArray(r.openedDoors)
    ? Array.from(new Set(r.openedDoors.filter((x): x is InfernoGateId => typeof x === "string" && validGates.has(x as InfernoGateId))))
    : [];
  const destroyedWalls = Array.isArray(r.destroyedWalls)
    ? Array.from(new Set(r.destroyedWalls.filter((x): x is string => typeof x === "string" && validWalls.has(x))))
    : [];
  const inspectedNodes = Array.isArray(r.inspectedNodes)
    ? Array.from(new Set(r.inspectedNodes.filter((x): x is InfernoInteractableId => typeof x === "string" && validNodeIds.has(x as InfernoInteractableId))))
    : [];

  const dungClue = Boolean(r.dungClue || collectedDocs.includes("doc_dung_chains"));
  const danhClue = Boolean(r.danhClue || collectedDocs.includes("doc_danh_dragon"));
  const longhoiClue = Boolean(r.longhoiClue || collectedDocs.includes("doc_longhoi_log"));
  const fourChairsUnlocked = Boolean(
    r.fourChairsUnlocked || openedDoors.includes("gate_four_chairs") || (dungClue && danhClue && longhoiClue)
  );
  if (fourChairsUnlocked && !openedDoors.includes("gate_four_chairs")) {
    openedDoors.push("gate_four_chairs");
  }

  return {
    dungClue,
    danhClue,
    longhoiClue,
    fourChairsUnlocked,
    trungTriggered: Boolean(r.trungTriggered || collectedDocs.includes("doc_trung_truth")),
    collectedDocs,
    keysFound,
    openedDoors,
    destroyedWalls,
    inspectedNodes,
  };
}

export function mergeInfernoProgress(
  local: InfernoProgressState | undefined,
  cloud: InfernoProgressState | undefined
): InfernoProgressState {
  const a = normalizeInfernoProgress(local);
  const b = normalizeInfernoProgress(cloud);
  return normalizeInfernoProgress({
    dungClue: a.dungClue || b.dungClue,
    danhClue: a.danhClue || b.danhClue,
    longhoiClue: a.longhoiClue || b.longhoiClue,
    fourChairsUnlocked: a.fourChairsUnlocked || b.fourChairsUnlocked,
    trungTriggered: a.trungTriggered || b.trungTriggered,
    collectedDocs: [...a.collectedDocs, ...b.collectedDocs],
    keysFound: [...a.keysFound, ...b.keysFound],
    openedDoors: [...a.openedDoors, ...b.openedDoors],
    destroyedWalls: [...a.destroyedWalls, ...b.destroyedWalls],
    inspectedNodes: [...a.inspectedNodes, ...b.inspectedNodes],
  });
}

export function createInitialInfernoRuntimeState(
  mapId = "classic",
  savedProgress?: InfernoProgressState
): InfernoRuntimeState {
  const prog = normalizeInfernoProgress(savedProgress);
  const destroyedSet = new Set(prog.destroyedWalls);
  return {
    mapId,
    currentZoneId: "zone_1",
    destructibles: INFERNO_DESTRUCTIBLE_WALLS.map((w) => ({
      ...w,
      hp: destroyedSet.has(w.id) ? 0 : w.maxHp,
      destroyed: destroyedSet.has(w.id),
      hitFlash: 0,
    })),
    lightningStrikes: [
      { id: "lt_crater_w", x: 920, y: 690, radius: 74, state: "cooldown", timer: 2.8, cooldownDuration: 5.5, didHit: false },
      { id: "lt_crater_e", x: 1270, y: 780, radius: 78, state: "cooldown", timer: 4.9, cooldownDuration: 6.0, didHit: false },
      { id: "lt_plaza_n", x: 1090, y: 1210, radius: 68, state: "cooldown", timer: 6.4, cooldownDuration: 7.2, didHit: false },
    ],
    fireFissures: [
      { id: "ff_plaza_s", x: 760, y: 1455, w: 120, h: 36, angle: 0.14, state: "dormant", timer: 1.5, tickCd: 0 },
      { id: "ff_temple_w", x: 1715, y: 1265, w: 132, h: 38, angle: -0.22, state: "dormant", timer: 3.1, tickCd: 0 },
      { id: "ff_crater_s", x: 1040, y: 955, w: 145, h: 38, angle: 0.05, state: "dormant", timer: 2.2, tickCd: 0 },
      { id: "ff_archive_mid", x: 1850, y: 1810, w: 118, h: 36, angle: -0.18, state: "dormant", timer: 4.0, tickCd: 0 },
    ],
    missileLocks: [
      {
        id: "ms_bastion_1",
        padX: 1920,
        padY: 300,
        targetX: 1730,
        targetY: 460,
        missileX: 1920,
        missileY: 300,
        state: "cooldown",
        timer: 3.4,
        blastRadius: 88,
      },
      {
        id: "ms_bastion_2",
        padX: 2185,
        padY: 300,
        targetX: 2050,
        targetY: 540,
        missileX: 2185,
        missileY: 300,
        state: "cooldown",
        timer: 6.2,
        blastRadius: 88,
      },
    ],
    collapsibleBridges: INFERNO_COLLAPSIBLE_BRIDGE_DEFS.map((b, idx) => ({
      ...b,
      state: "intact",
      timer: 4 + idx * 3,
    })),
    ruinAmbushes: [
      { id: "amb_plaza_e", zoneId: "zone_2", x: 1210, y: 1230, triggerRadius: 128, spawnRadius: 96, state: "armed", timer: 0 },
      { id: "amb_temple_n", zoneId: "zone_4", x: 2020, y: 1070, triggerRadius: 132, spawnRadius: 100, state: "armed", timer: 0 },
      { id: "amb_archive_e", zoneId: "zone_6", x: 1960, y: 1790, triggerRadius: 128, spawnRadius: 96, state: "armed", timer: 0 },
    ],
    unstableArcaneZones: [
      { id: "arc_crater_c", x: 1090, y: 745, radius: 108, phase: 0, exposureSec: 0, tickCd: 0 },
      { id: "arc_crater_ne", x: 1315, y: 650, radius: 92, phase: 1.7, exposureSec: 0, tickCd: 0 },
    ],
    phantoms: [],
    lightningFlash: 0,
    trungDarknessTimer: 0,
    chairShadowVanished: prog.trungTriggered,
    orbReflectedTrung: prog.trungTriggered,
    lastDiscoveryToast: null,
    lastDiscoveryTimer: 0,
    activeStoryModal: null,
    _seenZoneEntries: new Set(["zone_1"]),
  };
}

export function getInfernoZoneAt(x: number, y: number): InfernoZoneDef {
  for (const z of INFERNO_ZONES) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
      return z;
    }
  }
  let best = INFERNO_ZONES[0];
  let bestDist = Infinity;
  for (const z of INFERNO_ZONES) {
    const cx = z.x + z.w * 0.5;
    const cy = z.y + z.h * 0.5;
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best;
}

export function getActiveInfernoObstacles(
  runtime: InfernoRuntimeState | null | undefined,
  progress?: InfernoProgressState | null
): InfernoRectObstacle[] {
  const list: InfernoRectObstacle[] = [...INFERNO_STATIC_OBSTACLES];
  const prog = normalizeInfernoProgress(progress);

  for (const gate of INFERNO_GATES) {
    const isUnlocked =
      prog.openedDoors.includes(gate.id) ||
      (gate.id === "gate_four_chairs" && (prog.fourChairsUnlocked || (prog.dungClue && prog.danhClue && prog.longhoiClue)));
    if (!isUnlocked) {
      list.push({
        id: gate.id,
        x: gate.x,
        y: gate.y,
        w: gate.w,
        h: gate.h,
        kind: "locked_gate",
        label: gate.label.vi,
        gateId: gate.id,
      });
    }
  }

  const destrList = runtime?.destructibles || [];
  for (const dw of INFERNO_DESTRUCTIBLE_WALLS) {
    const rtItem = destrList.find((d) => d.id === dw.id);
    const destroyed = rtItem ? rtItem.destroyed : prog.destroyedWalls.includes(dw.id);
    if (!destroyed) {
      list.push({
        id: dw.id,
        x: dw.x,
        y: dw.y,
        w: dw.w,
        h: dw.h,
        kind: "destructible_wall",
        label: dw.hint.vi,
        destructibleId: dw.id,
      });
    }
  }

  if (runtime?.collapsibleBridges) {
    for (const br of runtime.collapsibleBridges) {
      if (br.state === "collapsed") {
        list.push({
          id: `${br.id}_chasm`,
          x: br.x,
          y: br.y,
          w: br.w,
          h: br.h,
          kind: "chasm_void",
          label: "Cầu Đá Đã Sập",
        });
      }
    }
  }

  return list;
}

export function findNearestInfernoInteractable(
  px: number,
  py: number,
  mapId: string
): InfernoInteractableDef | null {
  if (mapId !== "inferno_ash") return null;
  let best: InfernoInteractableDef | null = null;
  let bestDist = Infinity;
  for (const node of INFERNO_INTERACTABLES) {
    const d = Math.hypot(px - node.x, py - node.y);
    if (d <= node.radius && d < bestDist) {
      best = node;
      bestDist = d;
    }
  }
  return best;
}

export function findNearbyLockedGate(
  px: number,
  py: number,
  progress: InfernoProgressState
): InfernoGateDef | null {
  const prog = normalizeInfernoProgress(progress);
  for (const g of INFERNO_GATES) {
    if (prog.openedDoors.includes(g.id)) continue;
    const cx = g.x + g.w * 0.5;
    const cy = g.y + g.h * 0.5;
    const reach = Math.max(g.w, g.h) * 0.5 + 56;
    if (Math.hypot(px - cx, py - cy) <= reach) {
      return g;
    }
  }
  return null;
}

export function tryOpenInfernoGate({
  gateId,
  progress,
  lang = "vi",
}: {
  gateId: InfernoGateId;
  progress: InfernoProgressState;
  lang?: "vi" | "en";
}): {
  openedNow: boolean;
  reason: "opened" | "missing_key" | "missing_clues" | "already_open";
  nextProgress: InfernoProgressState;
  message: string;
} {
  const next = normalizeInfernoProgress(progress);
  if (next.openedDoors.includes(gateId)) {
    return { openedNow: false, reason: "already_open", nextProgress: next, message: "" };
  }
  const gate = INFERNO_GATES.find((g) => g.id === gateId);
  if (!gate) {
    return { openedNow: false, reason: "already_open", nextProgress: next, message: "" };
  }
  if (gate.requiresThreeClues) {
    const count = (next.dungClue ? 1 : 0) + (next.danhClue ? 1 : 0) + (next.longhoiClue ? 1 : 0);
    if (count < 3) {
      return {
        openedNow: false,
        reason: "missing_clues",
        nextProgress: next,
        message:
          lang === "en"
            ? `Sealed (${count}/3 Clues): Collect secrets with Dũng, Danh & Long Hói.`
            : `Phong ấn (${count}/3 Manh Mối): Hãy chơi Dũng (Khu 3), Danh (Khu 4) & Long Hói (Khu 5).`,
      };
    }
    next.fourChairsUnlocked = true;
    next.openedDoors.push(gateId);
    return {
      openedNow: true,
      reason: "opened",
      nextProgress: next,
      message:
        lang === "en"
          ? "🔓 Chamber of Four Chairs Unsealed!"
          : "🔓 Cánh cửa Căn Phòng Bốn Chiếc Ghế đã mở khóa!",
    };
  }
  if (gate.requiredKey && !next.keysFound.includes(gate.requiredKey)) {
    const keyNameVi = gate.requiredKey === "archive_key" ? "Chìa Khóa Thư Khố (ở Trạm Gác Khu 2)" : "Chìa Kho Đạn (ở Khu 3 hoặc Công Tắc Khu 5)";
    const keyNameEn = gate.requiredKey === "archive_key" ? "Archive Key (Zone 2 Guardhouse)" : "Bunker Key (Zone 3 / Zone 5 Switch)";
    return {
      openedNow: false,
      reason: "missing_key",
      nextProgress: next,
      message: lang === "en" ? `Locked! Need ${keyNameEn}.` : `Cửa khóa! Cần ${keyNameVi}.`,
    };
  }
  next.openedDoors.push(gateId);
  return {
    openedNow: true,
    reason: "opened",
    nextProgress: next,
    message: lang === "en" ? `🔓 Unlocked: ${gate.label.en}` : `🔓 Đã mở cửa: ${gate.label.vi}`,
  };
}

export function damageInfernoDestructibleWalls(
  runtime: InfernoRuntimeState,
  progress: InfernoProgressState,
  x: number,
  y: number,
  radius: number,
  dmg: number
): { destroyedWalls: InfernoDestructibleRuntime[]; nextProgress: InfernoProgressState } {
  const next = normalizeInfernoProgress(progress);
  const newlyDestroyed: InfernoDestructibleRuntime[] = [];
  if (!runtime?.destructibles) return { destroyedWalls: newlyDestroyed, nextProgress: next };

  for (const dw of runtime.destructibles) {
    if (dw.destroyed) continue;
    const cx = Math.max(dw.x, Math.min(dw.x + dw.w, x));
    const cy = Math.max(dw.y, Math.min(dw.y + dw.h, y));
    if (Math.hypot(x - cx, y - cy) <= radius) {
      dw.hp = Math.max(0, dw.hp - Math.max(12, dmg));
      dw.hitFlash = 0.16;
      if (dw.hp <= 0) {
        dw.destroyed = true;
        if (!next.destroyedWalls.includes(dw.id)) {
          next.destroyedWalls.push(dw.id);
        }
        newlyDestroyed.push(dw);
      }
    }
  }
  return { destroyedWalls: newlyDestroyed, nextProgress: next };
}

export function evaluateInfernoInteraction({
  nodeId,
  heroId,
  progress,
  lang = "vi",
}: {
  nodeId: InfernoInteractableId;
  heroId: string;
  progress: InfernoProgressState;
  lang?: "vi" | "en";
}): {
  nextProgress: InfernoProgressState;
  payload: InfernoStoryPayload;
  coinBonus: number;
  spawnPhantom?: InfernoPhantomEntity;
  darknessPulseSec?: number;
} {
  const next = normalizeInfernoProgress(progress);
  if (!next.inspectedNodes.includes(nodeId)) {
    next.inspectedNodes.push(nodeId);
  }
  const node = INFERNO_INTERACTABLES.find((n) => n.id === nodeId) || INFERNO_INTERACTABLES[0];
  const isVi = lang !== "en";
  let coinBonus = 0;
  let unlockedNow = false;
  let isSecretDiscovery = false;
  let isTrungReveal = false;
  let spawnPhantom: InfernoPhantomEntity | undefined;
  let darknessPulseSec: number | undefined;
  let audioCue: InfernoStoryPayload["audioCue"] = "doc";
  let steps: InfernoDialogStep[] = [];
  let themeVariant: InfernoStoryPayload["themeVariant"] = "neutral";

  if (node.grantsKey && !next.keysFound.includes(node.grantsKey)) {
    next.keysFound.push(node.grantsKey);
    isSecretDiscovery = true;
    unlockedNow = true;
    audioCue = "secret";
    coinBonus += 60;
  }

  if (node.unlocksGate && !next.openedDoors.includes(node.unlocksGate)) {
    next.openedDoors.push(node.unlocksGate);
    isSecretDiscovery = true;
    unlockedNow = true;
    audioCue = "door";
  }

  if (node.docId && !next.collectedDocs.includes(node.docId)) {
    if (nodeId !== "dung_crypt" && nodeId !== "danh_shrine" && nodeId !== "longhoi_console" && nodeId !== "trung_orb_pedestal") {
      next.collectedDocs.push(node.docId);
      coinBonus += 45;
      if (!unlockedNow) unlockedNow = true;
    }
  }

  if (nodeId === "dung_crypt") {
    themeVariant = "dung";
    if (heroId === "dung") {
      if (!next.dungClue) {
        next.dungClue = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 150;
      }
      if (!next.collectedDocs.includes("doc_dung_chains")) {
        next.collectedDocs.push("doc_dung_chains");
      }
      audioCue = "thunder";
      spawnPhantom = {
        kind: "hound_three_head",
        x: 280,
        y: 740,
        targetX: 525,
        targetY: 645,
        life: 0,
        maxLife: 2.6,
        alpha: 0.95,
      };
      steps = [
        {
          speaker: isVi ? "Dũng" : "Dũng",
          speakerColor: "#FACC15",
          text: isVi
            ? "Ba sợi xiềng này... tại sao tên của ta lại bị đục nát trên bệ đá?"
            : "These three iron chains... why is my name carved and half-erased on the altar?",
          subtext: isVi ? "Tiếng sấm vang dội trong hầm đá — bóng Chó Ba Đầu vụt chạy về cuối phòng rồi tan biến." : "Subterranean thunder cracks — a three-headed phantom hound darts down the crypt and dissolves.",
        },
        {
          speaker: isVi ? "Ký Ức Xiềng Xích" : "Echo of Chains",
          speakerColor: "#F59E0B",
          text: isVi
            ? "“Một mạng thú đổi một luồng sấm. Người đầu tiên ký tên vào khế ước đã không quay đầu.”"
            : "“A beast's soul for thunder's wrath. The first to sign never looked back.”",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Ghi Chú Hiện Trường" : "Field Observation",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Ba sợi xiềng sắt khổng lồ mang những cái tên bị xóa gần hết và dấu chân chó ba đầu hằn sâu trong tro."
            : "Three giant chains bear nearly erased names and triple-pawed hound tracks burned into stone.",
          subtext: isVi ? "Hãy dùng Dũng đến Hầm Hiến Tế để đánh thức ký ức." : "Return here playing Dũng to awaken this secret.",
        },
      ];
    }
  } else if (nodeId === "danh_shrine") {
    themeVariant = "danh";
    if (heroId === "danh") {
      if (!next.danhClue) {
        next.danhClue = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 150;
      }
      if (!next.collectedDocs.includes("doc_danh_dragon")) {
        next.collectedDocs.push("doc_danh_dragon");
      }
      audioCue = "whisper";
      spawnPhantom = {
        kind: "ash_child",
        x: 1965,
        y: 1290,
        targetX: 2075,
        targetY: 1320,
        life: 0,
        maxLife: 3.0,
        alpha: 0.9,
      };
      steps = [
        {
          speaker: isVi ? "Tiếng Thì Thầm Trong Tro" : "Whispers in the Ash",
          speakerColor: "#FB7185",
          text: isVi
            ? "“Ngươi đã hứa sẽ đưa chúng ta ra ngoài...”"
            : "“You promised to lead us out...”",
          subtext: isVi ? "Lớp vảy rồng cháy đen trên bức tượng xiềng xích bừng sáng rực đỏ." : "Charred dragon scales glow crimson beneath the melted chains.",
        },
        {
          speaker: "Danh",
          speakerColor: "#FB923C",
          text: isVi
            ? "Ta... ta không hề nhớ mình từng khóa cửa điện thờ này..."
            : "I... I do not remember sealing this temple's doors...",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Tượng Rồng Nung Chảy" : "Melted Dragon Statue",
          speakerColor: "#FB923C",
          text: isVi
            ? "Bức tượng rồng bị xích chặt, vảy rồng nung chảy vẫn còn hơi ấm kỳ lạ. Có tiếng trẻ con nghẹn ngào lẫn trong gió tro."
            : "A chained molten dragon idol radiates faint heat while childlike echoes drift in the ash.",
          subtext: isVi ? "Hãy dùng Danh chạm vào bức tượng để kích hoạt ký ức." : "Inspect as Danh to trigger the hidden resonance.",
        },
      ];
    }
  } else if (nodeId === "longhoi_console") {
    themeVariant = "longhoi";
    if (heroId === "longhoi") {
      if (!next.longhoiClue) {
        next.longhoiClue = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 150;
      }
      if (!next.collectedDocs.includes("doc_longhoi_log")) {
        next.collectedDocs.push("doc_longhoi_log");
      }
      audioCue = "terminal";
      steps = [
        {
          speaker: isVi ? "Màn Hình Tác Chiến" : "Tactical Monitor",
          speakerColor: "#F59E0B",
          text: isVi
            ? "[HIỂN THỊ TỌA ĐỘ CŨ]: 14°22'B · KHU DÂN CƯ CŨ · LOẠT TÊN LỬA 04 ĐÃ PHÓNG."
            : "[DISPLAYING COORDINATES]: 14°22'N · OLD RESIDENTIAL WARD · SALVO 04 LAUNCHED.",
          subtext: isVi ? "Máy điều khiển tự động khởi động và phát lại đoạn băng 3 giọng nói." : "The terminal boots up automatically, replaying a corrupted 3-voice tape.",
        },
        {
          speaker: isVi ? "Băng Ghi Âm (3 Giọng Nói)" : "Audio Log (3 Voices)",
          speakerColor: "#FDE047",
          text: isVi
            ? "“Dân thường vẫn chưa sơ tán hết!” — “Lệnh phòng bốn ghế không cho phép do dự.” — Giọng Long Hói: “...Khai hỏa. Lịch sử sẽ chỉ ghi là thiên thạch.”"
            : "“Civilians haven't evacuated!” — “Four Chairs directive forbids hesitation.” — Long Hói: “...Fire. History will blame a meteor.”",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Trạm Điều Khiển Bỏ Hoang" : "Abandoned Control Terminal",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Bàn điều khiển quân sự bám tro dày đặc, nút xác nhận phóng tên lửa chỉ nhận dấu vân tay của Long Hói."
            : "A dust-choked military terminal awaiting Long Hói's biometric override.",
          subtext: isVi ? "Hãy điều khiển Long Hói đến đây để giải mã tọa độ & băng ghi âm." : "Play as Long Hói to unlock the coordinates and 3-voice recording.",
        },
      ];
    }
  } else if (nodeId === "trung_orb_pedestal") {
    themeVariant = "trung";
    const hasAllThree = next.dungClue && next.danhClue && next.longhoiClue;
    if (heroId === "trung") {
      isTrungReveal = true;
      isSecretDiscovery = true;
      unlockedNow = !next.trungTriggered;
      if (!next.trungTriggered) {
        next.trungTriggered = true;
        coinBonus += 350;
      }
      if (!next.collectedDocs.includes("doc_trung_truth")) {
        next.collectedDocs.push("doc_trung_truth");
      }
      audioCue = "trung_laugh";
      darknessPulseSec = 8.5;
      spawnPhantom = {
        kind: "fourth_chair_shadow",
        x: 1140,
        y: 125,
        targetX: 1140,
        targetY: 125,
        life: 0,
        maxLife: 1.8,
        alpha: 0.9,
      };
      steps = [
        {
          speaker: isVi ? "Ảo Ảnh Quả Cầu Ma Thuật" : "Arcane Orb Reflection",
          speakerColor: "#C084FC",
          text: isVi ? "“Ngươi đến muộn rồi.”" : "“You arrived too late.”",
          subtext: isVi
            ? "Mọi tài liệu cũ bỗng hóa trắng xóa. Ba chiếc ghế trống trơn, còn cái bóng trên chiếc ghế thứ tư vừa tan biến ngay trước mắt."
            : "All prior documents turn blank. Three chairs sit empty while the shadow on the fourth chair vanishes — and the orb reflects Trung behind you.",
        },
        {
          speaker: isVi ? "Trung (Phản Chiếu Sau Lưng)" : "Trung (Behind You)",
          speakerColor: "#A855F7",
          text: isVi
            ? "“Ta đã biết ngươi sẽ đến, từ trước cả khi ngươi được sinh ra.”"
            : "“I knew you would come, long before you were ever born.”",
          subtext: isVi ? "Ánh sáng lịm dần · Một tiếng cười khẽ vang lên từ bóng tối." : "The chamber dims subtly · A faint laugh echoes through the gloom.",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Quả Cầu Ma Thuật Bốn Chiếc Ghế" : "Chamber Arcane Orb",
          speakerColor: "#C084FC",
          text: isVi
            ? hasAllThree
              ? "Mặt cầu tối thẫm phản chiếu bốn chiếc ghế cháy đen — chiếc thứ tư không khắc tên như đang chờ một kẻ khác bước vào."
              : "Quả cầu lạnh buốt rung nhẹ giữa ba chiếc ghế cháy đen."
            : "The cold obsidian orb reflects four charred chairs — the fourth unnamed seat waits for someone else.",
          subtext: isVi ? "Hãy dùng Trung bước vào Căn Phòng Bốn Chiếc Ghế để chứng kiến sự thật." : "Enter as Trung to witness the hidden truth.",
        },
      ];
    }
  } else {
    themeVariant = node.zoneId === "zone_6" || node.zoneId === "zone_7" ? "archive" : "neutral";
    const doc = node.docId ? INFERNO_DOCS[node.docId] : null;
    if (doc) {
      steps = doc.paragraphs.map((p, idx) => ({
        speaker: idx === 0 ? (isVi ? doc.title.vi : doc.title.en) : isVi ? "Manh Mối Ghi Nhận" : "Clue Recorded",
        speakerColor: themeVariant === "archive" ? "#FB7185" : "#F59E0B",
        text: isVi ? p.vi : p.en,
      }));
    } else {
      steps = [
        {
          speaker: isVi ? node.title.vi : node.title.en,
          speakerColor: "#F59E0B",
          text: unlockedNow
            ? isVi
              ? "Cơ chế đã kích hoạt và chìa khóa được thu giữ thành công."
              : "Mechanism activated and key secured."
            : isVi
              ? "Cơ chế cổ đã được kích hoạt từ trước."
              : "This mechanism is already active.",
        },
      ];
    }
  }

  // Auto-open Four Chairs seal when all 3 hero clues are gathered
  let unlockedFourChairsNow = false;
  if (next.dungClue && next.danhClue && next.longhoiClue && !next.fourChairsUnlocked) {
    next.fourChairsUnlocked = true;
    if (!next.openedDoors.includes("gate_four_chairs")) {
      next.openedDoors.push("gate_four_chairs");
    }
    unlockedFourChairsNow = true;
    audioCue = "door";
  }

  const clueCount = (next.dungClue ? 1 : 0) + (next.danhClue ? 1 : 0) + (next.longhoiClue ? 1 : 0);
  const docEntry = node.docId ? INFERNO_DOCS[node.docId] : null;
  const paragraphs = steps.map((s) => s.text);
  const rewardParts: string[] = [];
  if (coinBonus > 0) rewardParts.push(`+${coinBonus} ${isVi ? "Vàng" : "Gold"}`);
  if (unlockedFourChairsNow) {
    rewardParts.push(isVi ? "🔓 Mở Khóa Khu 7: Căn Phòng Bốn Chiếc Ghế!" : "🔓 Zone 7 Chamber of Four Chairs Unlocked!");
  }
  if (node.grantsKey && unlockedNow) {
    rewardParts.push(
      node.grantsKey === "archive_key"
        ? isVi ? "🔑 Nhận Chìa Khóa Thư Khố" : "🔑 Archive Key Acquired"
        : isVi ? "🔑 Nhận Chìa Kho Đạn" : "🔑 Bunker Key Acquired"
    );
  }

  return {
    nextProgress: next,
    coinBonus,
    spawnPhantom,
    darknessPulseSec,
    payload: {
      nodeId,
      zoneId: node.zoneId,
      title: isVi ? node.title.vi : node.title.en,
      subtitle: docEntry ? (isVi ? docEntry.subtitle.vi : docEntry.subtitle.en) : getInfernoZoneAt(node.x, node.y).name[isVi ? "vi" : "en"],
      code: docEntry?.code || "HN-LOG",
      themeVariant,
      isSecretDiscovery,
      unlockedNow,
      isTrungReveal,
      steps,
      paragraphs,
      clueSummary: isVi
        ? `Manh mối Anh Hùng: ${clueCount}/3 (Dũng ${next.dungClue ? "✓" : "○"} · Danh ${next.danhClue ? "✓" : "○"} · Long Hói ${next.longhoiClue ? "✓" : "○"}) · Hồ sơ: ${next.collectedDocs.length}/${Object.keys(INFERNO_DOCS).length}`
        : `Hero Clues: ${clueCount}/3 · Files: ${next.collectedDocs.length}/${Object.keys(INFERNO_DOCS).length}`,
      rewardText: rewardParts.join(" · ") || undefined,
      audioCue,
      progress: next,
    },
  };
}

export function getInfernoCompassTarget(
  heroId: string,
  progress: InfernoProgressState,
  lang: "vi" | "en" = "vi"
): { x: number; y: number; color: string; bg: string; icon: string; tag: string } | null {
  const next = normalizeInfernoProgress(progress);
  if (heroId === "dung" && !next.dungClue) {
    const n = INFERNO_INTERACTABLES.find((x) => x.id === "dung_crypt")!;
    return { x: n.x, y: n.y, color: "#FACC15", bg: "rgba(66, 32, 6, 0.9)", icon: "⛓", tag: lang === "en" ? "CRYPT" : "HẦM DŨNG" };
  }
  if (heroId === "danh" && !next.danhClue) {
    const n = INFERNO_INTERACTABLES.find((x) => x.id === "danh_shrine")!;
    return { x: n.x, y: n.y, color: "#FB923C", bg: "rgba(67, 20, 7, 0.9)", icon: "🐉", tag: lang === "en" ? "TEMPLE" : "ĐIỆN RỒNG" };
  }
  if (heroId === "longhoi" && !next.longhoiClue) {
    const n = INFERNO_INTERACTABLES.find((x) => x.id === "longhoi_console")!;
    return { x: n.x, y: n.y, color: "#F59E0B", bg: "rgba(69, 26, 3, 0.9)", icon: "📡", tag: lang === "en" ? "BASTION" : "PHÁO ĐÀI" };
  }
  if (next.fourChairsUnlocked && !next.trungTriggered) {
    const n = INFERNO_INTERACTABLES.find((x) => x.id === "trung_orb_pedestal")!;
    return {
      x: n.x,
      y: n.y,
      color: "#C084FC",
      bg: "rgba(59, 7, 100, 0.9)",
      icon: "🔮",
      tag: heroId === "trung" ? (lang === "en" ? "TRUNG ORB" : "CẦU BỐN GHẾ") : (lang === "en" ? "ZONE 7" : "4 CHIẾC GHẾ"),
    };
  }
  return null;
}

export interface InfernoHazardTickResult {
  playerDamage: number;
  applyBurn?: { duration: number; dps: number };
  applySlow?: { duration: number; factor: number };
  applyStunSec?: number;
  triggerLightningFlash?: boolean;
  missileImpacts: Array<{ x: number; y: number; radius: number; damage: number }>;
  ambushSpawns: InfernoRuinAmbushZone[];
  destroyedWalls: InfernoDestructibleRuntime[];
  soundEvents: Array<"lightning" | "fire" | "missile_lock" | "missile_boom" | "bridge_crack" | "ambush">;
}

export function stepInfernoHazards({
  runtime,
  progress,
  dt,
  playerX,
  playerY,
  playerRadius,
  playerAlive,
}: {
  runtime: InfernoRuntimeState;
  progress: InfernoProgressState;
  dt: number;
  playerX: number;
  playerY: number;
  playerRadius: number;
  playerAlive: boolean;
}): { result: InfernoHazardTickResult; nextProgress: InfernoProgressState } {
  const result: InfernoHazardTickResult = {
    playerDamage: 0,
    missileImpacts: [],
    ambushSpawns: [],
    destroyedWalls: [],
    soundEvents: [],
  };
  let nextProg = normalizeInfernoProgress(progress);

  if (runtime.lightningFlash > 0) runtime.lightningFlash = Math.max(0, runtime.lightningFlash - dt);
  if (runtime.trungDarknessTimer > 0) runtime.trungDarknessTimer = Math.max(0, runtime.trungDarknessTimer - dt);
  if (runtime.lastDiscoveryTimer > 0) {
    runtime.lastDiscoveryTimer = Math.max(0, runtime.lastDiscoveryTimer - dt);
    if (runtime.lastDiscoveryTimer <= 0) runtime.lastDiscoveryToast = null;
  }

  for (const dw of runtime.destructibles) {
    if (dw.hitFlash > 0) dw.hitFlash = Math.max(0, dw.hitFlash - dt);
  }

  for (let i = runtime.phantoms.length - 1; i >= 0; i--) {
    const ph = runtime.phantoms[i];
    ph.life += dt;
    const p = Math.min(1, ph.life / Math.max(0.2, ph.maxLife));
    ph.x = ph.x + (ph.targetX - ph.x) * Math.min(1, dt * 1.4);
    ph.y = ph.y + (ph.targetY - ph.y) * Math.min(1, dt * 1.4);
    ph.alpha = p < 0.7 ? 0.92 : Math.max(0, (1 - p) / 0.3);
    if (ph.life >= ph.maxLife) {
      if (ph.kind === "fourth_chair_shadow") runtime.chairShadowVanished = true;
      runtime.phantoms.splice(i, 1);
    }
  }

  // 1. Lightning Strikes: 1.2s red ground circle -> strike + screen flash
  for (const lt of runtime.lightningStrikes) {
    if (lt.state === "cooldown") {
      lt.timer -= dt;
      if (lt.timer <= 0) {
        lt.state = "telegraph";
        lt.timer = 1.2;
        lt.didHit = false;
      }
    } else if (lt.state === "telegraph") {
      lt.timer -= dt;
      if (lt.timer <= 0) {
        lt.state = "flash";
        lt.timer = 0.28;
        runtime.lightningFlash = 0.24;
        result.triggerLightningFlash = true;
        result.soundEvents.push("lightning");
        if (playerAlive && !lt.didHit && Math.hypot(playerX - lt.x, playerY - lt.y) <= lt.radius + playerRadius * 0.7) {
          lt.didHit = true;
          result.playerDamage += 78;
          result.applyStunSec = Math.max(result.applyStunSec || 0, 0.35);
        }
      }
    } else {
      lt.timer -= dt;
      if (lt.timer <= 0) {
        lt.state = "cooldown";
        lt.timer = lt.cooldownDuration;
      }
    }
  }

  // 2. Fire Fissures: orange warning glow -> eruption
  for (const ff of runtime.fireFissures) {
    if (ff.state === "dormant") {
      ff.timer -= dt;
      if (ff.timer <= 0) {
        ff.state = "glow";
        ff.timer = 1.15;
      }
    } else if (ff.state === "glow") {
      ff.timer -= dt;
      if (ff.timer <= 0) {
        ff.state = "erupt";
        ff.timer = 1.65;
        ff.tickCd = 0;
        result.soundEvents.push("fire");
      }
    } else {
      ff.timer -= dt;
      ff.tickCd -= dt;
      if (playerAlive && ff.tickCd <= 0) {
        const cx = ff.x + ff.w * 0.5;
        const cy = ff.y + ff.h * 0.5;
        const hitX = Math.abs(playerX - cx) <= ff.w * 0.5 + playerRadius * 0.65;
        const hitY = Math.abs(playerY - cy) <= ff.h * 0.5 + playerRadius * 0.65;
        if (hitX && hitY) {
          ff.tickCd = 0.45;
          result.playerDamage += 38;
          result.applyBurn = { duration: 2.0, dps: 24 };
        }
      }
      if (ff.timer <= 0) {
        ff.state = "dormant";
        ff.timer = 4.2;
      }
    }
  }

  // 3. Zone 5 Missile Target Locks (can break cracked fortress wall on impact!)
  const inBastionZone = playerX >= 1460 && playerY <= 1040;
  for (const ms of runtime.missileLocks) {
    if (ms.state === "cooldown") {
      ms.timer -= dt;
      if (ms.timer <= 0 && playerAlive && inBastionZone) {
        ms.state = "tracking";
        ms.timer = 1.35;
        ms.targetX = playerX;
        ms.targetY = playerY;
        result.soundEvents.push("missile_lock");
      } else if (ms.timer <= 0) {
        ms.timer = 1.2;
      }
    } else if (ms.state === "tracking") {
      ms.timer -= dt;
      if (playerAlive) {
        ms.targetX += (playerX - ms.targetX) * Math.min(1, dt * 3.8);
        ms.targetY += (playerY - ms.targetY) * Math.min(1, dt * 3.8);
      }
      if (ms.timer <= 0) {
        ms.state = "locked";
        ms.timer = 0.55;
      }
    } else if (ms.state === "locked") {
      ms.timer -= dt;
      if (ms.timer <= 0) {
        ms.state = "flying";
        ms.timer = 0.6;
        ms.missileX = ms.padX;
        ms.missileY = ms.padY;
      }
    } else if (ms.state === "flying") {
      ms.timer -= dt;
      const dx = ms.targetX - ms.missileX;
      const dy = ms.targetY - ms.missileY;
      const dist = Math.hypot(dx, dy);
      const stepDist = 560 * dt;
      if (dist <= stepDist || ms.timer <= 0) {
        result.missileImpacts.push({ x: ms.targetX, y: ms.targetY, radius: ms.blastRadius, damage: 92 });
        result.soundEvents.push("missile_boom");
        if (playerAlive && Math.hypot(playerX - ms.targetX, playerY - ms.targetY) <= ms.blastRadius + playerRadius * 0.65) {
          result.playerDamage += 92;
        }
        const smash = damageInfernoDestructibleWalls(runtime, nextProg, ms.targetX, ms.targetY, ms.blastRadius + 16, 220);
        nextProg = smash.nextProgress;
        if (smash.destroyedWalls.length > 0) {
          result.destroyedWalls.push(...smash.destroyedWalls);
        }
        ms.state = "cooldown";
        ms.timer = 5.4;
      } else {
        ms.missileX += (dx / dist) * stepDist;
        ms.missileY += (dy / dist) * stepDist;
      }
    }
  }

  // 4. Collapsible Stone Bridges: shake -> collapse -> rebuild safely
  for (const br of runtime.collapsibleBridges) {
    const cx = br.x + br.w * 0.5;
    const cy = br.y + br.h * 0.5;
    const onBridge =
      playerAlive &&
      playerX >= br.x - 10 &&
      playerX <= br.x + br.w + 10 &&
      playerY >= br.y - 10 &&
      playerY <= br.y + br.h + 10;

    if (br.state === "intact") {
      if (onBridge) {
        br.state = "shaking";
        br.timer = 1.05;
        result.soundEvents.push("bridge_crack");
      }
    } else if (br.state === "shaking") {
      br.timer -= dt;
      if (br.timer <= 0) {
        br.state = "collapsed";
        br.timer = 5.5;
        result.soundEvents.push("bridge_crack");
        if (onBridge) {
          result.playerDamage += 64;
          result.applySlow = { duration: 1.0, factor: 0.35 };
        }
      }
    } else {
      br.timer -= dt;
      if (br.timer <= 0 && (!playerAlive || Math.hypot(playerX - cx, playerY - cy) > Math.max(br.w, br.h) * 0.6 + playerRadius)) {
        br.state = "intact";
        br.timer = 4;
      }
    }
  }

  // 5. Ruin Ambush Spawns
  for (const amb of runtime.ruinAmbushes) {
    if (amb.state === "armed") {
      if (playerAlive && Math.hypot(playerX - amb.x, playerY - amb.y) <= amb.triggerRadius) {
        amb.state = "warning";
        amb.timer = 1.15;
        result.soundEvents.push("ambush");
      }
    } else if (amb.state === "warning") {
      amb.timer -= dt;
      if (amb.timer <= 0) {
        amb.state = "cooldown";
        amb.timer = 26;
        result.ambushSpawns.push(amb);
      }
    } else {
      amb.timer -= dt;
      if (amb.timer <= 0) amb.state = "armed";
    }
  }

  // 6. Zone 8 Unstable Arcane Zones: slow + stacking DoT when standing inside
  for (const arc of runtime.unstableArcaneZones) {
    arc.phase += dt * 2.2;
    arc.tickCd = Math.max(0, arc.tickCd - dt);
    if (playerAlive && Math.hypot(playerX - arc.x, playerY - arc.y) <= arc.radius + playerRadius * 0.5) {
      arc.exposureSec += dt;
      result.applySlow = { duration: 0.45, factor: 0.28 };
      if (arc.exposureSec >= 0.75 && arc.tickCd <= 0) {
        arc.tickCd = 0.55;
        result.playerDamage += Math.round(32 + Math.min(44, arc.exposureSec * 10));
      }
    } else {
      arc.exposureSec = Math.max(0, arc.exposureSec - dt * 1.5);
    }
  }

  return { result, nextProgress: nextProg };
}
