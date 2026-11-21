import type { CitadelSecretsProgress } from "./bloodCitadelMap";
import type { InfernoProgressState } from "./infernoAshMap";
import type { FrozenTombProgressState } from "./frozenTombMap";
import type { GrudgeForestProgressState } from "./grudgeForestMap";

export const VOID_CITY_WIDTH = 4800;
export const VOID_CITY_HEIGHT = 4000;
export const VOID_CITY_SPAWN = { x: 460, y: 3420 };

export type VoidCityLang = "vi" | "en";

export interface VoidCityZone {
  id:
    | "zone_1"
    | "zone_2"
    | "zone_3"
    | "zone_4"
    | "zone_5"
    | "zone_6"
    | "zone_7"
    | "zone_8";
  order: number;
  name: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  rect: { x: number; y: number; w: number; h: number };
  center: { x: number; y: number };
  accentColor: string;
}

export interface VoidCityObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | "gothic_wall"
    | "gate_pillar"
    | "statue_plinth"
    | "abandoned_house"
    | "bookshelf_monolith"
    | "clock_cog_slab"
    | "theater_partition"
    | "archive_colonade"
    | "void_obsidian"
    | "secret_seal_door"
    | "clock_reverse_gate"
    | "dynamic_shift_slab";
  label?: string;
  destructible?: boolean;
  hp?: number;
  maxHp?: number;
  opensOnRelicId?: string;
  opensWhenClockReversed?: boolean;
  closesWhenClockReversed?: boolean;
  shiftGroup?: string;
  color?: string;
}

export interface VoidCityCorridor {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "avenue" | "alley" | "canal_bridge" | "underground_tunnel" | "plaza_stone";
  label?: string;
}

export interface VoidCityInteractable {
  id: string;
  x: number;
  y: number;
  radius: number;
  zoneId: VoidCityZone["id"];
  kind:
    | "relic_puzzle"
    | "clue_note"
    | "tomb_clue"
    | "constellation_clue"
    | "torn_page"
    | "mask_clue"
    | "mirror_clue"
    | "clock_lever"
    | "theater_puppet_stage"
    | "trung_dossier"
    | "cross_map_seal"
    | "ancient_chest"
    | "boss_altar"
    | "lore_echo";
  relicId?:
    | "relic_1_astrolabe"
    | "relic_2_nameless_tomb"
    | "relic_3_sealed_archive"
    | "relic_4_theater_masks"
    | "relic_5_mirror_vault"
    | "relic_6_origin_sanctum";
  chestId?: string;
  docId?: string;
  label: { vi: string; en: string };
}

export interface VoidCityChestDef {
  id: string;
  x: number;
  y: number;
  zoneId: VoidCityZone["id"];
  name: { vi: string; en: string };
  requiresMemoryKey: boolean;
  requiresPuppetShow?: boolean;
  goldReward: number;
  starShardBonus: number;
  tierPreference: "mythic" | "epic";
}

export type ReflectionSubstatKey = "atk" | "matk" | "hp" | "crit" | "cdr" | "lifesteal";

export interface VoidCityProgressState {
  introSeen: boolean;
  trungDossierSeen: boolean;
  bossClearedVoidCity: boolean;
  endingDossierSeen: boolean;
  pheDoRevealed: boolean;

  // Discovered clues & collectibles
  foundConstellations: string[];
  tombInscriptionsRead: boolean;
  foundTornPages: string[];
  foundMasks: string[];
  theaterScriptRead: boolean;
  mirrorClueRead: boolean;

  // 6 Secret Relics solved flags
  relic1Solved: boolean; // Đài Thiên Văn Mất Sao
  relic2Solved: boolean; // Lăng Mộ Những Kẻ Vô Danh
  relic3Solved: boolean; // Kho Lưu Trữ Bị Niêm Phong
  relic4Solved: boolean; // Nhà Hát Bốn Bóng Người
  relic5Solved: boolean; // Hầm Gương Đảo Ngược
  relic6Solved: boolean; // Điện Thờ Khởi Nguyên

  // Real persistent rewards & active toggles
  starShardCount: number;
  starShardTotalEarned: number;
  starForgedSlots: string[];
  starExchangeCount: number;

  namelessSealUnlocked: boolean;
  namelessSealActive: boolean;

  memoryKeys: number;
  memoryKeysTotalEarned: number;
  openedChests: string[];

  memoryMaskUnlocked: boolean;
  memoryMaskActive: boolean;

  reflectionCoreCount: number;
  reflectionCoreTotalEarned: number;
  reflectionSubstats: Record<ReflectionSubstatKey, number>;

  originFragmentUnlocked: boolean;
  originFragmentForged: boolean;

  // Cross-map & dynamic world flags
  map1EchoSeen: boolean;
  map2EchoSeen: boolean;
  map3EchoSeen: boolean;
  map4PuppetPlaySeen: boolean;
  clockReversedEver: boolean;
  collectedDocIds: string[];
  visitedZoneIds: string[];
}

export const VOID_CITY_CONSTELLATION_SYMBOLS = [
  { id: 0, symbol: "⚇", name: { vi: "Kẻ Vô Diện", en: "Faceless" } },
  { id: 1, symbol: "◈", name: { vi: "Hư Không", en: "Void Crown" } },
  { id: 2, symbol: "✦", name: { vi: "Thiên Cầm", en: "Lyra" } },
  { id: 3, symbol: "☼", name: { vi: "Đèn Cổ", en: "Old Lantern" } },
  { id: 4, symbol: "✧", name: { vi: "Bắc Đẩu", en: "Ursa" } },
  { id: 5, symbol: "☽", name: { vi: "Nhật Nguyệt", en: "Eclipse" } },
] as const;

export const RELIC1_TARGET_RINGS = [2, 4, 1, 5] as const; // Thiên Cầm, Bắc Đẩu, Hư Không, Nhật Nguyệt

export const RELIC2_TOMB_STATUES = [
  { id: 1, name: { vi: "Tượng #1 · Kiếm Gãy Đen", en: "Statue #1 · Broken Black Sword" }, isTrue: false },
  { id: 2, name: { vi: "Tượng #2 · Cầm Đèn Vỡ", en: "Statue #2 · Cracked Lantern Bearer" }, isTrue: true },
  { id: 3, name: { vi: "Tượng #3 · Áo Choàng Ngước Trời", en: "Statue #3 · Skyward Cloaked" }, isTrue: false },
  { id: 4, name: { vi: "Tượng #4 · Quỳ Gối Quay Bắc", en: "Statue #4 · Kneeling Northbound" }, isTrue: true },
  { id: 5, name: { vi: "Tượng #5 · Khiên Đá Rêu", en: "Statue #5 · Mossy Stone Shield" }, isTrue: false },
  { id: 6, name: { vi: "Tượng #6 · Che Mặt Khăn Xám", en: "Statue #6 · Grey-Veiled Face" }, isTrue: true },
] as const;
export const RELIC2_TARGET_IDS = [2, 4, 6] as const;

export const RELIC3_ARCHIVE_PAGES = [
  {
    id: "page_genesis",
    order: 1,
    title: { vi: "Trang Rách I · Bản Thiết Kế Thứ Nhất", en: "Torn Page I · First World Blueprint" },
    excerpt: {
      vi: "\"Kỷ nguyên thứ nhất được dựng từ Tháp Đồng Hồ Đảo Ngược khi bầu trời chưa nứt.\"",
      en: "\"The First Era rose from the Inverted Clock Tower before the sky cracked.\"",
    },
  },
  {
    id: "page_trung",
    order: 2,
    title: { vi: "Trang Rách II · Nhật Ký Trước Tái Lập", en: "Torn Page II · Pre-Reset Log" },
    excerpt: {
      vi: "\"Đối tượng Trung đã tồn tại từ thế giới cũ, trước cả khi thực thể mới được viết đè.\"",
      en: "\"Subject Trung already existed in the old world before the new entities were overwritten.\"",
    },
  },
  {
    id: "page_erasure",
    order: 3,
    title: { vi: "Trang Rách III · Sắc Lệnh Xóa Sổ Vạn Không", en: "Torn Page III · Edict of Endless Erasure" },
    excerpt: {
      vi: "\"Niêm phong toàn bộ cư dân, xóa khuôn mặt tượng đá, chôn vùi Thành Phố Vạn Không.\"",
      en: "\"Seal all citizens, erase the statue faces, bury the City of Endless Void.\"",
    },
  },
] as const;
export const RELIC3_TARGET_ORDER = ["page_genesis", "page_trung", "page_erasure"] as const;

export const RELIC4_PEDESTALS = [
  { id: "creator", role: { vi: "Bệ I · Kẻ Tạo Thế", en: "Pedestal I · World Creator" } },
  { id: "survivor", role: { vi: "Bệ II · Kẻ Sống Sót", en: "Pedestal II · The Survivor" } },
  { id: "observer", role: { vi: "Bệ III · Người Quan Sát", en: "Pedestal III · The Observer" } },
  { id: "vessel", role: { vi: "Bệ IV · Vật Dẫn Cuối", en: "Pedestal IV · Final Vessel" } },
] as const;

export const RELIC4_MASKS = [
  { id: "m_gold_crack", name: { vi: "Mặt Nạ Vàng Nứt", en: "Cracked Gold Mask" }, clueTag: { vi: "Dành cho Kẻ Tạo Thế", en: "For World Creator" } },
  { id: "m_ash_tear", name: { vi: "Mặt Nạ Tro Đổ Lệ", en: "Weeping Ash Mask" }, clueTag: { vi: "Dành cho Kẻ Sống Sót", en: "For The Survivor" } },
  { id: "m_silver_blank", name: { vi: "Mặt Nạ Bạc Vô Diện", en: "Blank Silver Mask" }, clueTag: { vi: "Dành cho Người Quan Sát", en: "For The Observer" } },
  { id: "m_violet_twin", name: { vi: "Mặt Nạ Tím Song Sinh", en: "Twin Violet Mask" }, clueTag: { vi: "Dành cho Vật Dẫn Cuối", en: "For Final Vessel" } },
] as const;

export const RELIC4_TARGET_MAPPING: Record<string, string> = {
  creator: "m_gold_crack",
  survivor: "m_ash_tear",
  observer: "m_silver_blank",
  vessel: "m_violet_twin",
};

export const RELIC5_MIRRORS = [
  { id: 1, name: { vi: "Gương Tây (Có bóng đổ thật)", en: "West Mirror (Real Shadow)" }, isIllusion: false, targetAngle: 45 },
  { id: 2, name: { vi: "Gương Tâm Hồ (Phản chiếu kép)", en: "Center Mirror (Twin Reflection)" }, isIllusion: false, targetAngle: 135 },
  { id: 3, name: { vi: "Gương Ảo Ảnh (Không có bóng đất)", en: "Illusion Mirror (No Ground Shadow)" }, isIllusion: true, targetAngle: 0 },
  { id: 4, name: { vi: "Gương Đông Nam (Khắc ký hiệu cổ)", en: "SE Mirror (Ancient Rune)" }, isIllusion: false, targetAngle: 225 },
] as const;

export const RELIC6_CONDUIT_TOKENS = [
  { id: "sky_other", label: { vi: "Bầu Trời Thuộc Thế Giới Khác", en: "Sky of Another World" } },
  { id: "erased_name", label: { vi: "Những Tên Bị Xóa Khỏi Sử", en: "Names Erased From History" } },
  { id: "pre_reset", label: { vi: "Hồ Sơ Trước Lần Tái Lập", en: "Record Before First Reset" } },
  { id: "observer_choice", label: { vi: "Phán Quyết Của Kẻ Quan Sát", en: "Judgment of the Watcher" } },
] as const;
export const RELIC6_TARGET_SEQUENCE = ["sky_other", "erased_name", "pre_reset", "observer_choice"] as const;

export const VOID_CITY_ZONES: VoidCityZone[] = [
  {
    id: "zone_1",
    order: 1,
    name: { vi: "Cổng Thành Vạn Không", en: "Gate of Endless Void" },
    subtitle: { vi: "Tượng Đá Không Mặt & Cổng Cổ Khổng Lồ", en: "Faceless Statues & Colossal Gate" },
    rect: { x: 0, y: 2700, w: 1200, h: 1300 },
    center: { x: 560, y: 3350 },
    accentColor: "#94A3B8",
  },
  {
    id: "zone_2",
    order: 2,
    name: { vi: "Quảng Trường Vô Danh", en: "Plaza of the Nameless" },
    subtitle: { vi: "Hàng Trăm Tượng Đá Đổi Tư Thế & Lăng Mộ Ngầm", en: "Shifting Statues & Hidden Tomb" },
    rect: { x: 1200, y: 2450, w: 1300, h: 1550 },
    center: { x: 1850, y: 3220 },
    accentColor: "#CBD5E1",
  },
  {
    id: "zone_3",
    order: 3,
    name: { vi: "Phố Người Vắng", en: "Empty Town" },
    subtitle: { vi: "Nhà Nguyên Đồ Đạc · Tiếng Bước Chân Vô Hình · Hồ Gương", en: "Furnished Empty Homes · Ghostly Steps · Mirror Pool" },
    rect: { x: 0, y: 1250, w: 1450, h: 1450 },
    center: { x: 700, y: 1960 },
    accentColor: "#38BDF8",
  },
  {
    id: "zone_4",
    order: 4,
    name: { vi: "Thư Viện Ký Ức", en: "Library of Memory" },
    subtitle: { vi: "Hàng Nghìn Hồ Sơ Người Biến Mất & Kho Niêm Phong", en: "Erased Archives & Sealed Vault" },
    rect: { x: 1450, y: 1250, w: 1400, h: 1200 },
    center: { x: 2140, y: 1840 },
    accentColor: "#60A5FA",
  },
  {
    id: "zone_5",
    order: 5,
    name: { vi: "Tháp Đồng Hồ Đảo Ngược", en: "Inverted Clock Tower" },
    subtitle: { vi: "Bánh Răng Chạy Ngược · Đài Thiên Văn Tầng Hầm", en: "Backward Clockwork · Lost Observatory" },
    rect: { x: 0, y: 0, w: 1550, h: 1250 },
    center: { x: 760, y: 620 },
    accentColor: "#A855F7",
  },
  {
    id: "zone_6",
    order: 6,
    name: { vi: "Nhà Hát Không Khán Giả", en: "Empty Theater" },
    subtitle: { vi: "Sân Khấu Tự Diễn Kịch Quá Khứ & Bốn Bóng Người", en: "Self-Playing Stage & Four Shadows" },
    rect: { x: 1550, y: 0, w: 1600, h: 1250 },
    center: { x: 2340, y: 620 },
    accentColor: "#C084FC",
  },
  {
    id: "zone_7",
    order: 7,
    name: { vi: "Cung Điện Hồ Sơ", en: "Palace of Dossiers" },
    subtitle: { vi: "Tài Liệu Thế Giới Thứ Nhất & Hồ Sơ Trung", en: "First World Classified Files & Trung's Dossier" },
    rect: { x: 2850, y: 1850, w: 1950, h: 2150 },
    center: { x: 3760, y: 2920 },
    accentColor: "#FDE68A",
  },
  {
    id: "zone_8",
    order: 8,
    name: { vi: "Trung Tâm Hư Không", en: "Heart of the Void" },
    subtitle: { vi: "Điện Thờ Khởi Nguyên & Kẻ Giữ Hồ Sơ", en: "Origin Sanctum & Keeper of Dossiers" },
    rect: { x: 3150, y: 0, w: 1650, h: 1850 },
    center: { x: 3980, y: 920 },
    accentColor: "#E2E8F0",
  },
];

export const VOID_CITY_CORRIDORS: VoidCityCorridor[] = [
  { id: "ave_west", x: 320, y: 380, w: 260, h: 3220, kind: "avenue", label: "Đại Lộ Tây Vạn Không" },
  { id: "ave_south", x: 320, y: 3120, w: 3680, h: 240, kind: "avenue", label: "Đại Lộ Nam Cổng Thành" },
  { id: "ave_mid", x: 540, y: 1800, w: 3340, h: 210, kind: "avenue", label: "Trục Thư Viện - Cung Điện" },
  { id: "ave_north", x: 640, y: 520, w: 3420, h: 220, kind: "avenue", label: "Đại Lộ Bắc Đồng Hồ - Nhà Hát" },
  { id: "alley_empty_town", x: 860, y: 1180, w: 145, h: 1740, kind: "alley", label: "Ngõ Người Vắng" },
  { id: "alley_archive", x: 2280, y: 740, w: 165, h: 2260, kind: "alley", label: "Hành Lang Lưu Trữ" },
  { id: "bridge_east_canal", x: 2800, y: 2740, w: 460, h: 170, kind: "canal_bridge", label: "Cầu Đá Kênh Hư Không" },
  { id: "bridge_sanctum", x: 3740, y: 1580, w: 220, h: 520, kind: "canal_bridge", label: "Cầu Nối Trung Tâm Hư Không" },
  { id: "tunnel_catacomb", x: 1820, y: 2040, w: 1360, h: 135, kind: "underground_tunnel", label: "Đường Ngầm Cổ Đại" },
];

export const VOID_CITY_STATIC_OBSTACLES: VoidCityObstacle[] = [
  // Zone 1 - Cổng Thành Vạn Không (monolithic gate arches & plinths well clear of x:460,y:3420)
  { id: "vc_gate_nw", x: 110, y: 2860, w: 160, h: 180, kind: "gate_pillar" },
  { id: "vc_gate_ne", x: 880, y: 2860, w: 160, h: 180, kind: "gate_pillar" },
  { id: "vc_gate_statue_1", x: 240, y: 3650, w: 80, h: 80, kind: "statue_plinth" },
  { id: "vc_gate_statue_2", x: 720, y: 3650, w: 80, h: 80, kind: "statue_plinth" },

  // Zone 2 - Quảng Trường Vô Danh
  { id: "vc_plaza_pillar_1", x: 1320, y: 2660, w: 110, h: 110, kind: "statue_plinth" },
  { id: "vc_plaza_pillar_2", x: 2280, y: 2660, w: 110, h: 110, kind: "statue_plinth" },
  { id: "vc_plaza_pillar_3", x: 1320, y: 3560, w: 110, h: 110, kind: "statue_plinth" },
  { id: "vc_plaza_pillar_4", x: 2280, y: 3560, w: 110, h: 110, kind: "statue_plinth" },
  {
    id: "vc_relic2_tomb_seal",
    x: 1740,
    y: 3580,
    w: 220,
    h: 55,
    kind: "secret_seal_door",
    opensOnRelicId: "relic_2_nameless_tomb",
    label: "Lăng Mộ Vô Danh",
  },

  // Zone 3 - Phố Người Vắng (Gothic houses + alleyways)
  { id: "vc_house_1", x: 120, y: 1420, w: 180, h: 180, kind: "abandoned_house" },
  { id: "vc_house_2", x: 120, y: 2140, w: 180, h: 190, kind: "abandoned_house" },
  { id: "vc_house_3", x: 640, y: 1420, w: 180, h: 165, kind: "abandoned_house" },
  { id: "vc_house_4", x: 640, y: 2180, w: 180, h: 175, kind: "abandoned_house" },
  {
    id: "vc_relic5_mirror_seal",
    x: 1090,
    y: 1380,
    w: 170,
    h: 54,
    kind: "secret_seal_door",
    opensOnRelicId: "relic_5_mirror_vault",
    label: "Cửa Hầm Gương",
  },

  // Zone 4 - Thư Viện Ký Ức
  { id: "vc_shelf_nw", x: 1520, y: 1360, w: 230, h: 90, kind: "bookshelf_monolith" },
  { id: "vc_shelf_ne", x: 2480, y: 1360, w: 230, h: 90, kind: "bookshelf_monolith" },
  { id: "vc_shelf_sw", x: 1520, y: 2140, w: 230, h: 90, kind: "bookshelf_monolith" },
  { id: "vc_shelf_se", x: 2480, y: 2140, w: 230, h: 90, kind: "bookshelf_monolith" },
  {
    id: "vc_relic3_archive_seal",
    x: 1990,
    y: 1320,
    w: 220,
    h: 54,
    kind: "secret_seal_door",
    opensOnRelicId: "relic_3_sealed_archive",
    label: "Kho Lưu Trữ Niêm Phong",
  },

  // Zone 5 - Tháp Đồng Hồ Đảo Ngược
  { id: "vc_clock_pillar_1", x: 130, y: 190, w: 150, h: 150, kind: "clock_cog_slab" },
  { id: "vc_clock_pillar_2", x: 1210, y: 190, w: 150, h: 150, kind: "clock_cog_slab" },
  { id: "vc_clock_pillar_3", x: 130, y: 920, w: 150, h: 150, kind: "clock_cog_slab" },
  {
    id: "vc_relic1_astrolabe_seal",
    x: 680,
    y: 170,
    w: 220,
    h: 54,
    kind: "secret_seal_door",
    opensOnRelicId: "relic_1_astrolabe",
    label: "Hầm Đài Thiên Văn",
  },
  {
    id: "vc_clock_gate_north",
    x: 1020,
    y: 780,
    w: 60,
    h: 190,
    kind: "clock_reverse_gate",
    opensWhenClockReversed: true,
    label: "Cổng Thời Gian Nghịch",
  },
  {
    id: "vc_clock_gate_forward",
    x: 1360,
    y: 520,
    w: 60,
    h: 180,
    kind: "clock_reverse_gate",
    closesWhenClockReversed: true,
    label: "Chắn Nhịp Thuận",
  },

  // Zone 6 - Nhà Hát Không Khán Giả
  { id: "vc_theater_wall_w", x: 1640, y: 180, w: 130, h: 210, kind: "theater_partition" },
  { id: "vc_theater_wall_e", x: 2880, y: 180, w: 130, h: 210, kind: "theater_partition" },
  {
    id: "vc_relic4_backstage_seal",
    x: 2220,
    y: 160,
    w: 240,
    h: 56,
    kind: "secret_seal_door",
    opensOnRelicId: "relic_4_theater_masks",
    label: "Hậu Trường Bốn Bóng Người",
  },

  // Zone 7 - Cung Điện Hồ Sơ
  { id: "vc_palace_col_1", x: 3180, y: 2140, w: 120, h: 180, kind: "archive_colonade" },
  { id: "vc_palace_col_2", x: 4320, y: 2140, w: 120, h: 180, kind: "archive_colonade" },
  { id: "vc_palace_col_3", x: 3180, y: 3420, w: 120, h: 180, kind: "archive_colonade" },
  { id: "vc_palace_col_4", x: 4320, y: 3420, w: 120, h: 180, kind: "archive_colonade" },

  // Zone 8 - Trung Tâm Hư Không (spacious boss arena with void pillars)
  { id: "vc_void_monolith_nw", x: 3340, y: 240, w: 110, h: 110, kind: "void_obsidian" },
  { id: "vc_void_monolith_ne", x: 4440, y: 240, w: 110, h: 110, kind: "void_obsidian" },
  { id: "vc_void_monolith_sw", x: 3340, y: 1380, w: 110, h: 110, kind: "void_obsidian" },
  { id: "vc_void_monolith_se", x: 4440, y: 1380, w: 110, h: 110, kind: "void_obsidian" },
  {
    id: "vc_relic6_origin_seal",
    x: 4460,
    y: 780,
    w: 62,
    h: 220,
    kind: "secret_seal_door",
    opensOnRelicId: "relic_6_origin_sanctum",
    label: "Cửa Điện Thờ Khởi Nguyên",
  },
];

// Zone-shift walls (subtle architectural shifts when leaving zones — never overlaps player/spawn/nodes)
export const VOID_CITY_DYNAMIC_SHIFT_SLABS: VoidCityObstacle[] = [
  { id: "shift_plaza_a", x: 1580, y: 2820, w: 96, h: 96, kind: "dynamic_shift_slab", shiftGroup: "A" },
  { id: "shift_plaza_b", x: 2040, y: 3480, w: 96, h: 96, kind: "dynamic_shift_slab", shiftGroup: "B" },
  { id: "shift_library_a", x: 1860, y: 1620, w: 86, h: 86, kind: "dynamic_shift_slab", shiftGroup: "A" },
  { id: "shift_library_b", x: 2320, y: 1960, w: 86, h: 86, kind: "dynamic_shift_slab", shiftGroup: "B" },
];

export const VOID_CITY_CHESTS: VoidCityChestDef[] = [
  {
    id: "chest_library_vault",
    x: 2100,
    y: 1210,
    zoneId: "zone_4",
    name: { vi: "Rương Cổ Kho Lưu Trữ", en: "Sealed Archive Ancient Chest" },
    requiresMemoryKey: true,
    goldReward: 620,
    starShardBonus: 1,
    tierPreference: "mythic",
  },
  {
    id: "chest_tomb_crypt",
    x: 1850,
    y: 3720,
    zoneId: "zone_2",
    name: { vi: "Rương Hầm Mộ Vô Danh", en: "Nameless Crypt Ancient Chest" },
    requiresMemoryKey: true,
    goldReward: 540,
    starShardBonus: 1,
    tierPreference: "epic",
  },
  {
    id: "chest_palace_first_world",
    x: 4160,
    y: 2560,
    zoneId: "zone_7",
    name: { vi: "Rương Mật Cung Điện Hồ Sơ", en: "First World Classified Chest" },
    requiresMemoryKey: true,
    goldReward: 780,
    starShardBonus: 1,
    tierPreference: "mythic",
  },
  {
    id: "chest_theater_puppet",
    x: 2340,
    y: 270,
    zoneId: "zone_6",
    name: { vi: "Rương Kịch Bản Ẩn (Con Rối M4)", en: "Secret Play Chest (M4 Puppet)" },
    requiresMemoryKey: false,
    requiresPuppetShow: true,
    goldReward: 850,
    starShardBonus: 1,
    tierPreference: "mythic",
  },
];

export interface VoidCityDoc {
  id: string;
  tag: { vi: string; en: string };
  title: { vi: string; en: string };
  body: { vi: string; en: string };
  highlightQuote?: { vi: string; en: string };
}

export const VOID_CITY_DOCS: Record<string, VoidCityDoc> = {
  doc_gate_welcome: {
    id: "doc_gate_welcome",
    tag: { vi: "BIÊN NIÊN CỔ · KHU 1", en: "CHRONICLE · ZONE 1" },
    title: { vi: "Cổng Thành Vạn Không — Thành Phố Bị Xóa", en: "Gate of Endless Void — The Erased City" },
    body: {
      vi: "Những bức tượng đá không mặt đứng sừng sững hai bên cổng thành. Mặt đá nhẵn bóng không phải bị mài mòn bởi gió cát — mà bị xóa sạch khỏi ký ức của thế giới này.",
      en: "Faceless stone statues tower beside the city gates. Their smooth faces were not weathered by wind — they were deliberately scrubbed from this world's memory.",
    },
  },
  doc_tomb_clues: {
    id: "doc_tomb_clues",
    tag: { vi: "BIA MỘ VÔ DANH · DI TÍCH 2", en: "TOMBSTONE CLUES · RELIC 2" },
    title: { vi: "Ký Hiệu Ba Kẻ Bị Xóa Tên", en: "Marks of Three Nameless Souls" },
    body: {
      vi: "Trên bia đá nứt ghi rõ dấu tích của ba bức tượng thật dẫn xuống Lăng Mộ:\n• Tượng #2: Tay cầm chiếc đèn vỡ ánh bạc.\n• Tượng #4: Quỳ gối hướng mặt về phía Bắc.\n• Tượng #6: Dùng khăn xám che nửa khuôn mặt.",
      en: "The cracked tombstone describes the three true statues guarding the tomb:\n• Statue #2: Holds a broken silver lantern.\n• Statue #4: Kneels facing due North.\n• Statue #6: Veils its face in a grey cloth.",
    },
    highlightQuote: {
      vi: "Có những người đã bị xóa khỏi lịch sử, nhưng không phải tất cả đều biến mất.",
      en: "Some were erased from history, yet not all of them vanished.",
    },
  },
  doc_constellation_west: {
    id: "doc_constellation_west",
    tag: { vi: "MÁI NHÀ PHỐ VẮNG · DI TÍCH 1", en: "ROOFTOP CHART · RELIC 1" },
    title: { vi: "Khắc Chòm Sao I & II Trên Mái Ngói", en: "Rooftop Star Carvings I & II" },
    body: {
      vi: "Trên mái ngói phủ sương của Phố Người Vắng có hai vòng sao bạc còn sót lại:\n• Vòng Ngoài (I): ✦ Thiên Cầm.\n• Vòng Giữa (II): ✧ Bắc Đẩu.",
      en: "Frost-silver tiles on Empty Town's roofs preserve two sky glyphs:\n• Outer Ring (I): ✦ Lyra.\n• Mid Ring (II): ✧ Ursa.",
    },
  },
  doc_constellation_library: {
    id: "doc_constellation_library",
    tag: { vi: "THƯ VIỆN KÝ Ức · DI TÍCH 1", en: "LIBRARY CHART · RELIC 1" },
    title: { vi: "Bản Đồ Bầu Trời Đã Đổi", en: "Chart of an Altered Sky" },
    body: {
      vi: "Sách cổ ghi lại hai vòng trong cùng của Đài Thiên Văn dưới Tháp Đồng Hồ:\n• Vòng Trong (III): ◈ Hư Không.\n• Tâm Vòng (IV): ☽ Nhật Nguyệt.",
      en: "An ancient codex records the innermost astrolabe rings beneath the Clock Tower:\n• Inner Ring (III): ◈ Void Crown.\n• Core Ring (IV): ☽ Eclipse.",
    },
    highlightQuote: {
      vi: "Bầu trời này từng thuộc về một thế giới khác.",
      en: "This sky once belonged to another world.",
    },
  },
  doc_torn_page_1: {
    id: "doc_torn_page_1",
    tag: { vi: "MẢNH LƯU TRỮ I · DI TÍCH 3", en: "TORN PAGE I · RELIC 3" },
    title: { vi: "Trang Rách I — Bản Thiết Kế Thế Giới Thứ Nhất", en: "Torn Page I — First World Blueprint" },
    body: {
      vi: "Mốc thời gian sớm nhất trước khi vòng lặp hình thành: \"Kỷ nguyên thứ nhất được dựng từ Tháp Đồng Hồ Đảo Ngược khi bầu trời chưa nứt.\"",
      en: "Earliest timestamp before the cycle began: \"The First Era rose from the Inverted Clock Tower before the sky cracked.\"",
    },
  },
  doc_torn_page_2: {
    id: "doc_torn_page_2",
    tag: { vi: "MẢNH LƯU TRỮ II · DI TÍCH 3", en: "TORN PAGE II · RELIC 3" },
    title: { vi: "Trang Rách II — Dấu Vết Trung Trước Tái Lập", en: "Torn Page II — Pre-Reset Record of Trung" },
    body: {
      vi: "Mốc thời gian thứ hai (giữa hai kỷ nguyên): \"Đối tượng Trung đã tồn tại từ thế giới cũ, trước cả khi thực thể mới được viết đè.\"",
      en: "Second chronological entry: \"Subject Trung existed in the old world, even before new beings were overwritten.\"",
    },
  },
  doc_torn_page_3: {
    id: "doc_torn_page_3",
    tag: { vi: "MẢNH LƯỮU TRỮ III · DI TÍCH 3", en: "TORN PAGE III · RELIC 3" },
    title: { vi: "Trang Rách III — Sắc Lệnh Xóa Sổ Thành Phố", en: "Torn Page III — City Erasure Edict" },
    body: {
      vi: "Mốc thời gian cuối cùng: \"Niêm phong toàn bộ cư dân, xóa khuôn mặt tượng đá, chôn vùi Thành Phố Vạn Không để che giấu lần tái lập thứ nhất.\"",
      en: "Final chronological entry: \"Seal all citizens, erase the statue faces, bury the City of Endless Void to hide the first reset.\"",
    },
  },
  doc_theater_script: {
    id: "doc_theater_script",
    tag: { vi: "KỊCH BẢN HẬU TRƯỜNG · DI TÍCH 4", en: "BACKSTAGE SCRIPT · RELIC 4" },
    title: { vi: "Kịch Bản Vở Diễn 'Bốn Bóng Người'", en: "Script of 'The Four Shadows'" },
    body: {
      vi: "Trên bục đạo diễn còn ghi rõ vai diễn của bốn bức tượng:\n• Kẻ Tạo Thế đeo Mặt Nạ Vàng Nứt.\n• Kẻ Sống Sót đeo Mặt Nạ Tro Đổ Lệ.\n• Người Quan Sát đeo Mặt Nạ Bạc Vô Diện.\n• Vật Dẫn Cuối đeo Mặt Nạ Tím Song Sinh.",
      en: "The director's ledger assigns masks to the four statues:\n• World Creator: Cracked Gold Mask.\n• The Survivor: Weeping Ash Mask.\n• The Observer: Blank Silver Mask.\n• Final Vessel: Twin Violet Mask.",
    },
    highlightQuote: {
      vi: "Một người tạo ra thế giới. Một người sống sót sau khi nó kết thúc. Nhưng ai đã quyết định người nào được sống?",
      en: "One created the world. One survived its end. Yet who decided which soul got to live?",
    },
  },
  doc_mirror_plaque: {
    id: "doc_mirror_plaque",
    tag: { vi: "VĂN BIA HỒ GƯƠNG · DI TÍCH 5", en: "MIRROR POOL PLAQUE · RELIC 5" },
    title: { vi: "Luật Phản Chiếu Của Thế Giới Trước", en: "Reflection Law of the Former World" },
    body: {
      vi: "Gương thật của Phố Người Vắng phản chiếu thành phố cổ với kiến trúc của Thế Giới Thứ Nhất (Gương Tây 45°, Gương Tâm Hồ 135°, Gương Đông Nam 225°). Gương Ảo Ảnh (Vị trí 3) không có bóng đổ xuống mặt đất — hãy tắt nó đi.",
      en: "True mirrors reflect an ancient city built with First World architecture (West 45°, Center 135°, SE 225°). The Illusion Mirror (Slot 3) casts no shadow on the stone — leave it deactivated.",
    },
  },
  doc_trung_dossier: {
    id: "doc_trung_dossier",
    tag: { vi: "HỒ SƠ TỐI MẬT · CUNG ĐIỆN HỒ SƠ", en: "CLASSIFIED FILE · PALACE OF DOSSIERS" },
    title: { vi: "Hồ Sơ Đối Tượng: TRUNG", en: "Subject Dossier: TRUNG" },
    body: {
      vi: "Tập tài liệu bằng giấy vàng cổ nằm trên bệ niêm phong:\n• Đối tượng: Trung.\n• Trạng thái: Đã chết.\n• Thời điểm: Trước lần tái lập thứ nhất.\n• Dữ liệu linh hồn: Không thể xác định.\n\nGhi chú phụ lục: Một \"vật dẫn\" vô danh có liên kết trực tiếp với năng lượng Khởi Nguyên đã tiếp nhận dấu ấn còn sót lại...",
      en: "Aged gold-trimmed parchment upon the sealed pedestal:\n• Subject: Trung.\n• Status: Deceased.\n• Timestamp: Prior to the First Reset.\n• Soul Signature: Indeterminable.\n\nAppendix: An unnamed 'vessel' tethered to Genesis energy absorbed a lingering imprint...",
    },
    highlightQuote: {
      vi: "Đối tượng: Trung. Trạng thái: Đã chết. Thời điểm: Trước lần tái lập thứ nhất. Dữ liệu linh hồn: Không thể xác định.",
      en: "Subject: Trung. Status: Deceased. Time: Before the First Reset. Soul Data: Indeterminable.",
    },
  },
  doc_cross_map_1_3: {
    id: "doc_cross_map_1_3",
    tag: { vi: "LIÊN KẾT KÝ ỨC · MAP 1 → 3", en: "CROSS-WORLD ARCHIVE · MAPS 1–3" },
    title: { vi: "Mạch Hồ Sơ Liên Thông Ba Thế Giới Cũ", en: "Connected Archive of the Three Former Realms" },
    body: {
      vi: "Cung Điện Hồ Sơ lưu lại ba ấn ký từ những vùng đất cũ:\n• Map 1 (Huyết Táng): Ma Thạch thử nghiệm tách mảnh linh hồn.\n• Map 2 (Địa Ngục Tro Tàn): Quả cầu ma thuật & Bốn Chiếc Ghế đối thoại.\n• Map 3 (Hầm Mộ Băng Giá): Phép phong ấn và tẩy sửa ký ức lịch sử.",
      en: "Three resonance seals from past battlefields echo inside this vault:\n• Map 1: Blood Stone soul-splitting trials.\n• Map 2: Magic Orb & The Four Chairs council.\n• Map 3: Sealing arrays and historical memory edits.",
    },
  },
  doc_origin_sanctum: {
    id: "doc_origin_sanctum",
    tag: { vi: "DI TÍCH 6 · ĐIỆN THỜ KHỞI NGUYÊN", en: "RELIC 6 · ORIGIN SANCTUM" },
    title: { vi: "Ánh Sáng Khởi Nguyên Của Sự Kết Thúc", en: "Genesis Light of the Ending" },
    body: {
      vi: "Khi ánh sáng trắng vàng tràn ngập Điện Thờ, những dòng chữ khắc từ thời sơ khai hiện lên rõ rệt. Mảnh Khởi Nguyên chỉ dùng để tôi luyện trang bị và vũ khí — không thể đánh thức người sáng lập.",
      en: "White-gold radiance fills the Sanctum, unveiling primordial script. The Origin Fragment forges your equipped relics and weapons with transcendent power.",
    },
    highlightQuote: {
      vi: "Khởi đầu không phải lúc nào cũng là sự sống. Đôi khi, nó cũng là khởi đầu của một kết thúc.",
      en: "Beginning is not always life. Sometimes, it is also the beginning of an ending.",
    },
  },
  doc_boss_last_page: {
    id: "doc_boss_last_page",
    tag: { vi: "TRANG GIẤY CUỐI CÙNG · BOSS MAP 5", en: "THE LAST FALLEN PAGE · BOSS" },
    title: { vi: "Trang Giấy Rơi Lại Sau Khi Kẻ Giữ Hồ Sơ Tan Biến", en: "The Solitary Page Left Behind" },
    body: {
      vi: "Hàng nghìn trang giấy bay vút lên bầu trời đêm tím lạnh rồi tan biến hết. Chỉ còn duy nhất một tờ giấy đáp nhẹ xuống nền đá trước mặt bạn:",
      en: "Thousands of pages spiral upward into the violet night sky and dissolve. Only a single sheet drifts gently onto the stone floor:",
    },
    highlightQuote: {
      vi: "Hắn đã chết ở thế giới trước. Vậy thứ đang đi lại trong thế giới này là ai?",
      en: "He died in the previous world. Then who is the one walking in this world right now?",
    },
  },
  doc_ending_phe_do: {
    id: "doc_ending_phe_do",
    tag: { vi: "TỔNG KẾT · BẢN ĐỒ TIẾP THEO", en: "EPILOGUE · NEXT CHAPTER" },
    title: { vi: "PHẾ ĐÔ THIÊN CƠ — HỒ SƠ MỚI MỞ RA", en: "PHẾ ĐÔ THIÊN CƠ — THE NEXT REALM" },
    body: {
      vi: "HỒ SƠ CUỐI CÙNG:\n• Thế giới thứ nhất: Đã kết thúc.\n• Vật dẫn: Đã được xác lập.\n• Đối tượng sống sót: Không thể xác định.\n• Ý chí Khởi Nguyên: Vẫn còn hoạt động.\n\nMột giọng nói trầm vang lên giữa Thành Phố Vạn Không: \"Ta từng nghĩ mình là người bảo vệ thế giới này... cho đến khi ta thấy tên mình trong danh sách bị xóa.\"",
      en: "FINAL DOSSIER:\n• First World: Terminated.\n• Vessel: Established.\n• Surviving Subject: Indeterminable.\n• Genesis Will: Still Active.\n\nTrung's voice echoes through the empty avenue: \"I once thought I was the guardian of this world... until I found my own name on the erasure list.\"",
    },
    highlightQuote: {
      vi: "BẢN ĐỒ TIẾP THEO ĐƯỢC MỞ LỘ DIỆN: PHẾ ĐÔ THIÊN CƠ",
      en: "NEXT REALM REVEALED: PHẾ ĐÔ THIÊN CƠ",
    },
  },
};

export const VOID_CITY_INTERACTABLES: VoidCityInteractable[] = [
  {
    id: "vc_node_gate",
    x: 560,
    y: 3180,
    radius: 75,
    zoneId: "zone_1",
    kind: "lore_echo",
    docId: "doc_gate_welcome",
    label: { vi: "Bia Cổng Vạn Không", en: "Void Gate Tablet" },
  },
  {
    id: "vc_node_tomb_clue",
    x: 1580,
    y: 3160,
    radius: 78,
    zoneId: "zone_2",
    kind: "tomb_clue",
    docId: "doc_tomb_clues",
    label: { vi: "Bia Mộ Khắc Ký Hiệu (Di Tích 2)", en: "Inscribed Tombstone (Relic 2 Clue)" },
  },
  {
    id: "vc_node_relic2",
    x: 1850,
    y: 3500,
    radius: 82,
    zoneId: "zone_2",
    kind: "relic_puzzle",
    relicId: "relic_2_nameless_tomb",
    label: { vi: "Lăng Mộ Những Kẻ Vô Danh (Di Tích 2)", en: "Tomb of the Nameless (Relic 2)" },
  },
  {
    id: "vc_node_constellation_west",
    x: 420,
    y: 1620,
    radius: 78,
    zoneId: "zone_3",
    kind: "constellation_clue",
    docId: "doc_constellation_west",
    label: { vi: "Khắc Chòm Sao Mái Nhà (Di Tích 1)", en: "Rooftop Star Glyph (Relic 1 Clue)" },
  },
  {
    id: "vc_node_mirror_clue",
    x: 920,
    y: 1680,
    radius: 75,
    zoneId: "zone_3",
    kind: "mirror_clue",
    docId: "doc_mirror_plaque",
    label: { vi: "Văn Bia Hồ Gương (Di Tích 5)", en: "Mirror Pool Plaque (Relic 5 Clue)" },
  },
  {
    id: "vc_node_relic5",
    x: 1175,
    y: 1475,
    radius: 82,
    zoneId: "zone_3",
    kind: "relic_puzzle",
    relicId: "relic_5_mirror_vault",
    label: { vi: "Hầm Gương Đảo Ngược (Di Tích 5)", en: "Inverted Mirror Vault (Relic 5)" },
  },
  {
    id: "vc_node_torn_1",
    x: 520,
    y: 2440,
    radius: 74,
    zoneId: "zone_3",
    kind: "torn_page",
    docId: "doc_torn_page_1",
    label: { vi: "Trang Rách I (Di Tích 3)", en: "Torn Page I (Relic 3 Clue)" },
  },
  {
    id: "vc_node_constellation_lib",
    x: 1860,
    y: 1880,
    radius: 78,
    zoneId: "zone_4",
    kind: "constellation_clue",
    docId: "doc_constellation_library",
    label: { vi: "Sách Cổ Chòm Sao (Di Tích 1)", en: "Ancient Star Codex (Relic 1 Clue)" },
  },
  {
    id: "vc_node_torn_2",
    x: 1710,
    y: 1560,
    radius: 74,
    zoneId: "zone_4",
    kind: "torn_page",
    docId: "doc_torn_page_2",
    label: { vi: "Trang Rách II (Di Tích 3)", en: "Torn Page II (Relic 3 Clue)" },
  },
  {
    id: "vc_node_torn_3",
    x: 2560,
    y: 1720,
    radius: 74,
    zoneId: "zone_4",
    kind: "torn_page",
    docId: "doc_torn_page_3",
    label: { vi: "Trang Rách III (Di Tích 3)", en: "Torn Page III (Relic 3 Clue)" },
  },
  {
    id: "vc_node_relic3",
    x: 2100,
    y: 1410,
    radius: 84,
    zoneId: "zone_4",
    kind: "relic_puzzle",
    relicId: "relic_3_sealed_archive",
    label: { vi: "Kho Lưu Trữ Bị Niêm Phong (Di Tích 3)", en: "Sealed Archive Room (Relic 3)" },
  },
  {
    id: "vc_node_clock_lever",
    x: 780,
    y: 660,
    radius: 82,
    zoneId: "zone_5",
    kind: "clock_lever",
    label: { vi: "Cơ Quan Đảo Ngược Thời Gian", en: "Clock Time-Reversal Mechanism" },
  },
  {
    id: "vc_node_relic1",
    x: 790,
    y: 265,
    radius: 84,
    zoneId: "zone_5",
    kind: "relic_puzzle",
    relicId: "relic_1_astrolabe",
    label: { vi: "Đài Thiên Văn Mất Sao (Di Tích 1)", en: "Lost Star Observatory (Relic 1)" },
  },
  {
    id: "vc_node_theater_script",
    x: 1960,
    y: 660,
    radius: 78,
    zoneId: "zone_6",
    kind: "mask_clue",
    docId: "doc_theater_script",
    label: { vi: "Kịch Bản Bốn Mặt Nạ (Di Tích 4)", en: "Four-Mask Play Script (Relic 4 Clue)" },
  },
  {
    id: "vc_node_relic4",
    x: 2340,
    y: 360,
    radius: 84,
    zoneId: "zone_6",
    kind: "relic_puzzle",
    relicId: "relic_4_theater_masks",
    label: { vi: "Nhà Hát Bốn Bóng Người (Di Tích 4)", en: "Theater of Four Shadows (Relic 4)" },
  },
  {
    id: "vc_node_theater_puppet",
    x: 2560,
    y: 620,
    radius: 82,
    zoneId: "zone_6",
    kind: "theater_puppet_stage",
    label: { vi: "Sân Khấu Tái Hiện (Con Rối M4)", en: "Reenactment Stage (M4 Puppet)" },
  },
  {
    id: "vc_node_trung_dossier",
    x: 3780,
    y: 2920,
    radius: 86,
    zoneId: "zone_7",
    kind: "trung_dossier",
    docId: "doc_trung_dossier",
    label: { vi: "Bệ Hồ Sơ Trung (Cung Điện)", en: "Trung's Dossier Pedestal" },
  },
  {
    id: "vc_node_cross_map",
    x: 3440,
    y: 2620,
    radius: 82,
    zoneId: "zone_7",
    kind: "cross_map_seal",
    docId: "doc_cross_map_1_3",
    label: { vi: "Ấn Ký Liên Thông Map 1–3", en: "Maps 1–3 Echo Seal" },
  },
  {
    id: "vc_node_relic6",
    x: 4380,
    y: 890,
    radius: 88,
    zoneId: "zone_8",
    kind: "relic_puzzle",
    relicId: "relic_6_origin_sanctum",
    label: { vi: "Điện Thờ Khởi Nguyên (Di Tích 6)", en: "Origin Sanctum (Relic 6)" },
  },
  {
    id: "vc_node_boss_altar",
    x: 3920,
    y: 920,
    radius: 90,
    zoneId: "zone_8",
    kind: "boss_altar",
    label: { vi: "Đài Triệu Hồi Kẻ Giữ Hồ Sơ", en: "Keeper of Dossiers Summon Altar" },
  },
  // Ancient Chests as world interactables
  ...VOID_CITY_CHESTS.map((ch) => ({
    id: ch.id,
    x: ch.x,
    y: ch.y,
    radius: 74,
    zoneId: ch.zoneId,
    kind: "ancient_chest" as const,
    chestId: ch.id,
    label: ch.name,
  })),
];

export function createDefaultVoidCityProgress(): VoidCityProgressState {
  return {
    introSeen: false,
    trungDossierSeen: false,
    bossClearedVoidCity: false,
    endingDossierSeen: false,
    pheDoRevealed: false,
    foundConstellations: [],
    tombInscriptionsRead: false,
    foundTornPages: [],
    foundMasks: [],
    theaterScriptRead: false,
    mirrorClueRead: false,
    relic1Solved: false,
    relic2Solved: false,
    relic3Solved: false,
    relic4Solved: false,
    relic5Solved: false,
    relic6Solved: false,
    starShardCount: 0,
    starShardTotalEarned: 0,
    starForgedSlots: [],
    starExchangeCount: 0,
    namelessSealUnlocked: false,
    namelessSealActive: false,
    memoryKeys: 0,
    memoryKeysTotalEarned: 0,
    openedChests: [],
    memoryMaskUnlocked: false,
    memoryMaskActive: false,
    reflectionCoreCount: 0,
    reflectionCoreTotalEarned: 0,
    reflectionSubstats: {
      atk: 0,
      matk: 0,
      hp: 0,
      crit: 0,
      cdr: 0,
      lifesteal: 0,
    },
    originFragmentUnlocked: false,
    originFragmentForged: false,
    map1EchoSeen: false,
    map2EchoSeen: false,
    map3EchoSeen: false,
    map4PuppetPlaySeen: false,
    clockReversedEver: false,
    collectedDocIds: [],
    visitedZoneIds: ["zone_1"],
  };
}

export function normalizeVoidCityProgress(raw: unknown): VoidCityProgressState {
  const base = createDefaultVoidCityProgress();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<VoidCityProgressState>;
  const uniq = (arr: unknown, max = 32): string[] =>
    Array.isArray(arr)
      ? Array.from(new Set(arr.filter((x): x is string => typeof x === "string" && x.length > 0))).slice(0, max)
      : [];
  const rs = (r.reflectionSubstats && typeof r.reflectionSubstats === "object"
    ? r.reflectionSubstats
    : {}) as Partial<Record<ReflectionSubstatKey, number>>;
  return {
    introSeen: Boolean(r.introSeen),
    trungDossierSeen: Boolean(r.trungDossierSeen),
    bossClearedVoidCity: Boolean(r.bossClearedVoidCity),
    endingDossierSeen: Boolean(r.endingDossierSeen),
    pheDoRevealed: Boolean(r.pheDoRevealed),
    foundConstellations: uniq(r.foundConstellations, 10),
    tombInscriptionsRead: Boolean(r.tombInscriptionsRead),
    foundTornPages: uniq(r.foundTornPages, 10),
    foundMasks: uniq(r.foundMasks, 10),
    theaterScriptRead: Boolean(r.theaterScriptRead),
    mirrorClueRead: Boolean(r.mirrorClueRead),
    relic1Solved: Boolean(r.relic1Solved),
    relic2Solved: Boolean(r.relic2Solved),
    relic3Solved: Boolean(r.relic3Solved),
    relic4Solved: Boolean(r.relic4Solved),
    relic5Solved: Boolean(r.relic5Solved),
    relic6Solved: Boolean(r.relic6Solved),
    starShardCount: Math.max(0, Math.min(99, Math.floor(Number(r.starShardCount) || 0))),
    starShardTotalEarned: Math.max(0, Math.min(99, Math.floor(Number(r.starShardTotalEarned) || 0))),
    starForgedSlots: uniq(r.starForgedSlots, 6),
    starExchangeCount: Math.max(0, Math.min(99, Math.floor(Number(r.starExchangeCount) || 0))),
    namelessSealUnlocked: Boolean(r.namelessSealUnlocked),
    namelessSealActive: Boolean(r.namelessSealUnlocked && (r.namelessSealActive ?? true)),
    memoryKeys: Math.max(0, Math.min(99, Math.floor(Number(r.memoryKeys) || 0))),
    memoryKeysTotalEarned: Math.max(0, Math.min(99, Math.floor(Number(r.memoryKeysTotalEarned) || 0))),
    openedChests: uniq(r.openedChests, 12),
    memoryMaskUnlocked: Boolean(r.memoryMaskUnlocked),
    memoryMaskActive: Boolean(r.memoryMaskUnlocked && (r.memoryMaskActive ?? true)),
    reflectionCoreCount: Math.max(0, Math.min(99, Math.floor(Number(r.reflectionCoreCount) || 0))),
    reflectionCoreTotalEarned: Math.max(0, Math.min(99, Math.floor(Number(r.reflectionCoreTotalEarned) || 0))),
    reflectionSubstats: {
      atk: Math.max(0, Math.min(10, Math.floor(Number(rs.atk) || 0))),
      matk: Math.max(0, Math.min(10, Math.floor(Number(rs.matk) || 0))),
      hp: Math.max(0, Math.min(10, Math.floor(Number(rs.hp) || 0))),
      crit: Math.max(0, Math.min(10, Math.floor(Number(rs.crit) || 0))),
      cdr: Math.max(0, Math.min(10, Math.floor(Number(rs.cdr) || 0))),
      lifesteal: Math.max(0, Math.min(10, Math.floor(Number(rs.lifesteal) || 0))),
    },
    originFragmentUnlocked: Boolean(r.originFragmentUnlocked),
    originFragmentForged: Boolean(r.originFragmentUnlocked && r.originFragmentForged),
    map1EchoSeen: Boolean(r.map1EchoSeen),
    map2EchoSeen: Boolean(r.map2EchoSeen),
    map3EchoSeen: Boolean(r.map3EchoSeen),
    map4PuppetPlaySeen: Boolean(r.map4PuppetPlaySeen),
    clockReversedEver: Boolean(r.clockReversedEver),
    collectedDocIds: uniq(r.collectedDocIds, 32),
    visitedZoneIds: uniq(r.visitedZoneIds, 12).length > 0 ? uniq(r.visitedZoneIds, 12) : ["zone_1"],
  };
}

export function mergeVoidCityProgress(aRaw: unknown, bRaw: unknown): VoidCityProgressState {
  const a = normalizeVoidCityProgress(aRaw);
  const b = normalizeVoidCityProgress(bRaw);
  const uniqMerge = (x: string[], y: string[], max = 32) => Array.from(new Set([...x, ...y])).slice(0, max);
  return normalizeVoidCityProgress({
    introSeen: a.introSeen || b.introSeen,
    trungDossierSeen: a.trungDossierSeen || b.trungDossierSeen,
    bossClearedVoidCity: a.bossClearedVoidCity || b.bossClearedVoidCity,
    endingDossierSeen: a.endingDossierSeen || b.endingDossierSeen,
    pheDoRevealed: a.pheDoRevealed || b.pheDoRevealed,
    foundConstellations: uniqMerge(a.foundConstellations, b.foundConstellations, 10),
    tombInscriptionsRead: a.tombInscriptionsRead || b.tombInscriptionsRead,
    foundTornPages: uniqMerge(a.foundTornPages, b.foundTornPages, 10),
    foundMasks: uniqMerge(a.foundMasks, b.foundMasks, 10),
    theaterScriptRead: a.theaterScriptRead || b.theaterScriptRead,
    mirrorClueRead: a.mirrorClueRead || b.mirrorClueRead,
    relic1Solved: a.relic1Solved || b.relic1Solved,
    relic2Solved: a.relic2Solved || b.relic2Solved,
    relic3Solved: a.relic3Solved || b.relic3Solved,
    relic4Solved: a.relic4Solved || b.relic4Solved,
    relic5Solved: a.relic5Solved || b.relic5Solved,
    relic6Solved: a.relic6Solved || b.relic6Solved,
    starShardCount: Math.max(a.starShardCount, b.starShardCount),
    starShardTotalEarned: Math.max(a.starShardTotalEarned, b.starShardTotalEarned),
    starForgedSlots: uniqMerge(a.starForgedSlots, b.starForgedSlots, 6),
    starExchangeCount: Math.max(a.starExchangeCount, b.starExchangeCount),
    namelessSealUnlocked: a.namelessSealUnlocked || b.namelessSealUnlocked,
    namelessSealActive: a.namelessSealActive || b.namelessSealActive,
    memoryKeys: Math.max(a.memoryKeys, b.memoryKeys),
    memoryKeysTotalEarned: Math.max(a.memoryKeysTotalEarned, b.memoryKeysTotalEarned),
    openedChests: uniqMerge(a.openedChests, b.openedChests, 12),
    memoryMaskUnlocked: a.memoryMaskUnlocked || b.memoryMaskUnlocked,
    memoryMaskActive: a.memoryMaskActive || b.memoryMaskActive,
    reflectionCoreCount: Math.max(a.reflectionCoreCount, b.reflectionCoreCount),
    reflectionCoreTotalEarned: Math.max(a.reflectionCoreTotalEarned, b.reflectionCoreTotalEarned),
    reflectionSubstats: {
      atk: Math.max(a.reflectionSubstats.atk, b.reflectionSubstats.atk),
      matk: Math.max(a.reflectionSubstats.matk, b.reflectionSubstats.matk),
      hp: Math.max(a.reflectionSubstats.hp, b.reflectionSubstats.hp),
      crit: Math.max(a.reflectionSubstats.crit, b.reflectionSubstats.crit),
      cdr: Math.max(a.reflectionSubstats.cdr, b.reflectionSubstats.cdr),
      lifesteal: Math.max(a.reflectionSubstats.lifesteal, b.reflectionSubstats.lifesteal),
    },
    originFragmentUnlocked: a.originFragmentUnlocked || b.originFragmentUnlocked,
    originFragmentForged: a.originFragmentForged || b.originFragmentForged,
    map1EchoSeen: a.map1EchoSeen || b.map1EchoSeen,
    map2EchoSeen: a.map2EchoSeen || b.map2EchoSeen,
    map3EchoSeen: a.map3EchoSeen || b.map3EchoSeen,
    map4PuppetPlaySeen: a.map4PuppetPlaySeen || b.map4PuppetPlaySeen,
    clockReversedEver: a.clockReversedEver || b.clockReversedEver,
    collectedDocIds: uniqMerge(a.collectedDocIds, b.collectedDocIds, 32),
    visitedZoneIds: uniqMerge(a.visitedZoneIds, b.visitedZoneIds, 12),
  });
}

export function countVoidCityBaseRelics(progress: VoidCityProgressState): number {
  let c = 0;
  if (progress.relic1Solved) c++;
  if (progress.relic2Solved) c++;
  if (progress.relic3Solved) c++;
  if (progress.relic4Solved) c++;
  if (progress.relic5Solved) c++;
  return c;
}

export function countVoidCityRelics(progress: VoidCityProgressState): number {
  return countVoidCityBaseRelics(progress) + (progress.relic6Solved ? 1 : 0);
}

export function isRelic6Accessible(progress: VoidCityProgressState): boolean {
  return countVoidCityBaseRelics(progress) >= 3;
}

export function computeVoidCityRewardStatBonuses(progressInput: VoidCityProgressState | unknown) {
  const p = normalizeVoidCityProgress(progressInput);
  const starCount = p.starForgedSlots.length;
  const sub = p.reflectionSubstats;
  return {
    atk: starCount * 22 + sub.atk * 40 + (p.originFragmentForged ? 55 : 0),
    matk: starCount * 26 + sub.matk * 50 + (p.originFragmentForged ? 68 : 0),
    hp: starCount * 110 + sub.hp * 300 + (p.originFragmentForged ? 260 : 0),
    ms: p.memoryMaskActive ? 0.08 : 0,
    dmgRed: p.memoryMaskActive ? 0.06 : 0,
    crit: sub.crit * 0.05 + (p.originFragmentForged ? 0.05 : 0),
    cdr: sub.cdr * 0.04,
    lifesteal: sub.lifesteal * 0.04,
    bossDmgBonus: p.originFragmentForged ? 0.12 : 0,
  };
}

export interface VoidCityShadowSilhouette {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  facing: number;
}

export interface VoidCityFlickerLamp {
  x: number;
  y: number;
  phase: number;
  radius: number;
}

export interface VoidCityRuntimeState {
  mapId: "void_city";
  currentZoneId: VoidCityZone["id"];
  clockReversed: boolean;
  clockReverseCycleTimer: number;
  shiftActive: boolean;
  shiftCooldown: number;
  statuesAngles: Record<number, number>;
  shadowSilhouettes: VoidCityShadowSilhouette[];
  shadowSpawnTimer: number;
  footstepPulseTimer: number;
  bookPulsePhase: number;
  theaterReenactPhase: number;
  lamps: VoidCityFlickerLamp[];
  visionDimFactor: number;
  bossSpawnedThisRun: boolean;
  bossDefeatedThisRun: boolean;
  endingPageSpawned: boolean;
  endingPagePos: { x: number; y: number } | null;
  lastDiscoveryToast: string | null;
  lastDiscoveryTimer: number;
  lastPlayerAngle: number;
}

export function createInitialVoidCityRuntimeState(progressInput?: VoidCityProgressState): VoidCityRuntimeState {
  void progressInput;
  const lamps: VoidCityFlickerLamp[] = [
    { x: 430, y: 3140, phase: 0.2, radius: 130 },
    { x: 950, y: 2920, phase: 1.4, radius: 135 },
    { x: 1460, y: 3180, phase: 2.3, radius: 140 },
    { x: 2150, y: 2950, phase: 0.7, radius: 145 },
    { x: 520, y: 1850, phase: 3.1, radius: 135 },
    { x: 960, y: 1620, phase: 1.9, radius: 130 },
    { x: 1860, y: 1920, phase: 2.8, radius: 145 },
    { x: 2440, y: 1780, phase: 0.5, radius: 145 },
    { x: 760, y: 620, phase: 1.1, radius: 155 },
    { x: 2320, y: 640, phase: 2.2, radius: 160 },
    { x: 3560, y: 2780, phase: 0.9, radius: 155 },
    { x: 3920, y: 920, phase: 1.7, radius: 170 },
  ];
  return {
    mapId: "void_city",
    currentZoneId: "zone_1",
    clockReversed: false,
    clockReverseCycleTimer: 0,
    shiftActive: false,
    shiftCooldown: 0,
    statuesAngles: { 1: 0, 2: Math.PI * 0.5, 3: Math.PI, 4: -Math.PI * 0.5, 5: 0.6, 6: -0.8 },
    shadowSilhouettes: [],
    shadowSpawnTimer: 1.8,
    footstepPulseTimer: 0,
    bookPulsePhase: 0,
    theaterReenactPhase: 0,
    lamps,
    visionDimFactor: 0,
    bossSpawnedThisRun: false,
    bossDefeatedThisRun: false,
    endingPageSpawned: false,
    endingPagePos: null,
    lastDiscoveryToast: null,
    lastDiscoveryTimer: 0,
    lastPlayerAngle: 0,
  };
}

export function getVoidCityZoneAt(x: number, y: number): VoidCityZone {
  for (const z of VOID_CITY_ZONES) {
    if (x >= z.rect.x && x <= z.rect.x + z.rect.w && y >= z.rect.y && y <= z.rect.y + z.rect.h) {
      return z;
    }
  }
  return VOID_CITY_ZONES[0];
}

export function getVoidCityCompassTarget(
  progressInput: VoidCityProgressState | unknown,
  runtime?: VoidCityRuntimeState | null,
  lang: VoidCityLang = "vi"
): { x: number; y: number; color: string; bg: string; icon: string; tag: string } | null {
  const p = normalizeVoidCityProgress(progressInput);
  const isEn = lang === "en";
  if (runtime?.endingPageSpawned && runtime.endingPagePos) {
    return {
      x: runtime.endingPagePos.x,
      y: runtime.endingPagePos.y,
      color: "#FDE68A",
      bg: "rgba(30, 27, 75, 0.92)",
      icon: "📜",
      tag: isEn ? "FINAL" : "TRANG CUỐI",
    };
  }
  const byId = (id: string) => VOID_CITY_INTERACTABLES.find((n) => n.id === id);
  if (!p.relic1Solved) {
    const target =
      !p.foundConstellations.includes("doc_constellation_west")
        ? byId("vc_node_constellation_west")
        : !p.foundConstellations.includes("doc_constellation_library")
        ? byId("vc_node_constellation_lib")
        : byId("vc_node_relic1");
    if (target) return { x: target.x, y: target.y, color: "#38BDF8", bg: "rgba(12, 74, 110, 0.9)", icon: "🔭", tag: isEn ? "RELIC 1" : "DI TÍCH 1" };
  }
  if (!p.relic2Solved) {
    const target = !p.tombInscriptionsRead ? byId("vc_node_tomb_clue") : byId("vc_node_relic2");
    if (target) return { x: target.x, y: target.y, color: "#CBD5E1", bg: "rgba(30, 41, 59, 0.9)", icon: "⚰️", tag: isEn ? "RELIC 2" : "DI TÍCH 2" };
  }
  if (!p.relic3Solved) {
    const target =
      !p.foundTornPages.includes("page_genesis")
        ? byId("vc_node_torn_1")
        : !p.foundTornPages.includes("page_trung")
        ? byId("vc_node_torn_2")
        : !p.foundTornPages.includes("page_erasure")
        ? byId("vc_node_torn_3")
        : byId("vc_node_relic3");
    if (target) return { x: target.x, y: target.y, color: "#60A5FA", bg: "rgba(30, 58, 138, 0.9)", icon: "📖", tag: isEn ? "RELIC 3" : "DI TÍCH 3" };
  }
  if (!p.relic4Solved) {
    const target = !p.theaterScriptRead ? byId("vc_node_theater_script") : byId("vc_node_relic4");
    if (target) return { x: target.x, y: target.y, color: "#C084FC", bg: "rgba(88, 28, 135, 0.9)", icon: "🎭", tag: isEn ? "RELIC 4" : "DI TÍCH 4" };
  }
  if (!p.relic5Solved) {
    const target = !p.mirrorClueRead ? byId("vc_node_mirror_clue") : byId("vc_node_relic5");
    if (target) return { x: target.x, y: target.y, color: "#67E8F9", bg: "rgba(14, 116, 144, 0.9)", icon: "🪞", tag: isEn ? "RELIC 5" : "DI TÍCH 5" };
  }
  if (!p.relic6Solved && isRelic6Accessible(p)) {
    const target = byId("vc_node_relic6");
    if (target) return { x: target.x, y: target.y, color: "#FDE68A", bg: "rgba(120, 53, 15, 0.9)", icon: "✨", tag: isEn ? "RELIC 6" : "DI TÍCH 6" };
  }
  if (!p.bossClearedVoidCity && !runtime?.bossSpawnedThisRun) {
    const bossAltar = byId("vc_node_boss_altar");
    if (bossAltar) return { x: bossAltar.x, y: bossAltar.y, color: "#F43F5E", bg: "rgba(136, 19, 55, 0.9)", icon: "📜", tag: isEn ? "ALTAR" : "ĐÀI BOSS" };
  }
  return null;
}

export function isVoidCityObstacleOpen(
  ob: VoidCityObstacle,
  progress: VoidCityProgressState,
  runtime?: VoidCityRuntimeState | null
): boolean {
  if (ob.opensOnRelicId) {
    if (ob.opensOnRelicId === "relic_1_astrolabe" && progress.relic1Solved) return true;
    if (ob.opensOnRelicId === "relic_2_nameless_tomb" && progress.relic2Solved) return true;
    if (ob.opensOnRelicId === "relic_3_sealed_archive" && progress.relic3Solved) return true;
    if (ob.opensOnRelicId === "relic_4_theater_masks" && progress.relic4Solved) return true;
    if (ob.opensOnRelicId === "relic_5_mirror_vault" && progress.relic5Solved) return true;
    if (ob.opensOnRelicId === "relic_6_origin_sanctum" && progress.relic6Solved) return true;
  }
  const reversed = Boolean(runtime?.clockReversed);
  if (ob.opensWhenClockReversed && reversed) return true;
  if (ob.closesWhenClockReversed && !reversed) return true;
  return false;
}

export function getActiveVoidCityObstacles(
  progressInput: VoidCityProgressState | unknown,
  runtime?: VoidCityRuntimeState | null
): VoidCityObstacle[] {
  const progress = normalizeVoidCityProgress(progressInput);
  const res: VoidCityObstacle[] = [];
  for (const ob of VOID_CITY_STATIC_OBSTACLES) {
    if (!isVoidCityObstacleOpen(ob, progress, runtime)) {
      res.push(ob);
    }
  }
  const activeGroup = runtime?.shiftActive ? "B" : "A";
  for (const slab of VOID_CITY_DYNAMIC_SHIFT_SLABS) {
    if (slab.shiftGroup === activeGroup) {
      res.push(slab);
    }
  }
  return res;
}

function doesRectOverlapEntities(
  rect: { x: number; y: number; w: number; h: number },
  entities: Array<{ x: number; y: number; radius: number }>
): boolean {
  for (const e of entities) {
    const pad = (e.radius || 22) + 16;
    if (
      e.x >= rect.x - pad &&
      e.x <= rect.x + rect.w + pad &&
      e.y >= rect.y - pad &&
      e.y <= rect.y + rect.h + pad
    ) {
      return true;
    }
  }
  return false;
}

export function toggleVoidCityClockReversal(
  runtime: VoidCityRuntimeState,
  progress: VoidCityProgressState,
  entities: Array<{ x: number; y: number; radius: number }> = []
): { toggled: boolean; reversed: boolean; nextProgress: VoidCityProgressState } {
  const nextReversed = !runtime.clockReversed;
  // Verify closing gate doesn't crush entities — if overlap, keep gate harmless by pushing entities in engine
  void entities;
  runtime.clockReversed = nextReversed;
  const nextProgress = normalizeVoidCityProgress({
    ...progress,
    clockReversedEver: progress.clockReversedEver || nextReversed,
  });
  return { toggled: true, reversed: nextReversed, nextProgress };
}

export function stepVoidCityHazards({
  runtime,
  progress,
  dt,
  playerX,
  playerY,
  playerRadius = 22,
  entitiesForShiftSafety = [],
}: {
  runtime: VoidCityRuntimeState;
  progress: VoidCityProgressState;
  dt: number;
  playerX: number;
  playerY: number;
  playerRadius?: number;
  entitiesForShiftSafety?: Array<{ x: number; y: number; radius: number }>;
}) {
  void progress;
  void playerRadius;
  const soundEvents: string[] = [];
  let zoneChanged = false;
  let clockAutoFlipped = false;
  let shiftOccurred = false;

  if (runtime.lastDiscoveryTimer > 0) {
    runtime.lastDiscoveryTimer = Math.max(0, runtime.lastDiscoveryTimer - dt);
    if (runtime.lastDiscoveryTimer <= 0) runtime.lastDiscoveryToast = null;
  }

  runtime.bookPulsePhase += dt * 1.9;
  runtime.theaterReenactPhase += dt * 1.3;
  runtime.shiftCooldown = Math.max(0, runtime.shiftCooldown - dt);

  // Subtle backward clock cycle in Zone 5 every 22s if player hasn't toggled recently
  runtime.clockReverseCycleTimer += dt;
  if (runtime.clockReverseCycleTimer >= 22) {
    runtime.clockReverseCycleTimer = 0;
    if (runtime.currentZoneId === "zone_5") {
      runtime.clockReversed = !runtime.clockReversed;
      clockAutoFlipped = true;
      soundEvents.push("clock_chime");
    }
  }

  // Zone detection + dynamic zone-leave architectural shift
  const zone = getVoidCityZoneAt(playerX, playerY);
  if (runtime.currentZoneId !== zone.id) {
    runtime.currentZoneId = zone.id;
    zoneChanged = true;
    if (runtime.shiftCooldown <= 0) {
      const candidateGroup = runtime.shiftActive ? "A" : "B";
      const candidateSlabs = VOID_CITY_DYNAMIC_SHIFT_SLABS.filter((s) => s.shiftGroup === candidateGroup);
      const blocked = candidateSlabs.some((s) => doesRectOverlapEntities(s, entitiesForShiftSafety));
      if (!blocked) {
        runtime.shiftActive = !runtime.shiftActive;
        runtime.shiftCooldown = 4.0;
        shiftOccurred = true;
      }
    }
  }

  // Zone 2 statues subtly turn toward player when not looked at / off-axis
  if (zone.id === "zone_2") {
    for (const stId of [1, 2, 3, 4, 5, 6]) {
      const sx = 1480 + ((stId - 1) % 3) * 340;
      const sy = stId <= 3 ? 2860 : 3440;
      const angToPlayer = Math.atan2(playerY - sy, playerX - sx);
      const cur = runtime.statuesAngles[stId] || 0;
      const lookDot = Math.cos(runtime.lastPlayerAngle) * (sx - playerX) + Math.sin(runtime.lastPlayerAngle) * (sy - playerY);
      if (lookDot < 0) {
        const diff = Math.atan2(Math.sin(angToPlayer - cur), Math.cos(angToPlayer - cur));
        runtime.statuesAngles[stId] = cur + diff * Math.min(1, dt * 2.4);
      }
    }
  }

  // Zone 3 Empty Town invisible footsteps
  if (zone.id === "zone_3") {
    runtime.footstepPulseTimer -= dt;
    if (runtime.footstepPulseTimer <= 0) {
      runtime.footstepPulseTimer = 4.5 + Math.random() * 2.5;
      soundEvents.push("empty_footsteps");
    }
  }

  // Fleeting translucent human silhouettes across streets
  runtime.shadowSpawnTimer -= dt;
  if (runtime.shadowSpawnTimer <= 0) {
    runtime.shadowSpawnTimer = 2.6 + Math.random() * 2.2;
    if (runtime.shadowSilhouettes.length < 5) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 260 + Math.random() * 190;
      const sx = Math.max(80, Math.min(VOID_CITY_WIDTH - 80, playerX + Math.cos(ang) * dist));
      const sy = Math.max(80, Math.min(VOID_CITY_HEIGHT - 80, playerY + Math.sin(ang) * dist));
      const moveAng = ang + (Math.random() > 0.5 ? 1.4 : -1.4);
      runtime.shadowSilhouettes.push({
        id: `sh_${Date.now()}_${Math.random()}`,
        x: sx,
        y: sy,
        vx: Math.cos(moveAng) * 78,
        vy: Math.sin(moveAng) * 78,
        alpha: 0.42,
        life: 0,
        maxLife: 1.8 + Math.random() * 1.1,
        facing: moveAng,
      });
    }
  }
  for (let i = runtime.shadowSilhouettes.length - 1; i >= 0; i--) {
    const sh = runtime.shadowSilhouettes[i];
    sh.life += dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    if (sh.life >= sh.maxLife) {
      runtime.shadowSilhouettes.splice(i, 1);
    }
  }

  // Subtle zone darkness factor in Zone 8 / Zone 2 / Zone 3
  const targetDim = zone.id === "zone_8" ? 0.34 : zone.id === "zone_3" || zone.id === "zone_5" ? 0.2 : 0.12;
  runtime.visionDimFactor += (targetDim - runtime.visionDimFactor) * Math.min(1, dt * 2.8);

  return {
    zone,
    zoneChanged,
    clockAutoFlipped,
    shiftOccurred,
    soundEvents,
    visionDimFactor: runtime.visionDimFactor,
  };
}

export function findNearestVoidCityInteractable(
  px: number,
  py: number,
  progressInput: VoidCityProgressState | unknown,
  runtime?: VoidCityRuntimeState | null
): VoidCityInteractable | null {
  void progressInput;
  let best: VoidCityInteractable | null = null;
  let bestD = Infinity;
  if (runtime?.endingPageSpawned && runtime.endingPagePos) {
    const dPage = Math.hypot(px - runtime.endingPagePos.x, py - runtime.endingPagePos.y);
    if (dPage <= 115) {
      bestD = dPage;
      best = {
        id: "ending_last_page",
        x: runtime.endingPagePos.x,
        y: runtime.endingPagePos.y,
        radius: 75,
        zoneId: "zone_8",
        kind: "lore_echo",
        docId: "doc_ending_phe_do",
        label: { vi: "Trang Giấy Cuối Cùng · Hồ Sơ Kết", en: "The Last Fallen Page · Final Dossier" },
      };
    }
  }
  for (const node of VOID_CITY_INTERACTABLES) {
    const d = Math.hypot(px - node.x, py - node.y);
    if (d <= node.radius + 46 && d < bestD) {
      bestD = d;
      best = node;
    }
  }
  return best;
}

export interface VoidCityModalPayload {
  kind: "story" | "puzzle" | "ending";
  relicId?: VoidCityInteractable["relicId"];
  title: string;
  tag: string;
  body: string;
  quote?: string;
  rewardText?: string;
  audioCue?: string;
  themeVariant?: "void" | "gold" | "crimson" | "origin";
}

function appendDoc(progress: VoidCityProgressState, docId?: string): string[] {
  if (!docId || progress.collectedDocIds.includes(docId)) return progress.collectedDocIds;
  return [...progress.collectedDocIds, docId].slice(0, 32);
}

export function evaluateVoidCityInteraction({
  nodeId,
  progress: progInput,
  citadelSecrets,
  infernoProgress,
  frozenTombProgress,
  grudgeForestProgress,
  runtime,
  lang = "vi",
}: {
  nodeId: string;
  progress: VoidCityProgressState | unknown;
  citadelSecrets?: CitadelSecretsProgress | null;
  infernoProgress?: InfernoProgressState | null;
  frozenTombProgress?: FrozenTombProgressState | null;
  grudgeForestProgress?: GrudgeForestProgressState | null;
  runtime?: VoidCityRuntimeState | null;
  lang?: VoidCityLang;
}): {
  nextProgress: VoidCityProgressState;
  payload: VoidCityModalPayload;
  coinBonus: number;
  spawnBoss: boolean;
  spawnAmbush: boolean;
  claimChestDef?: VoidCityChestDef;
  toggledClockReversed?: boolean;
} {
  let progress = normalizeVoidCityProgress(progInput);
  const isEn = lang === "en";
  if (nodeId === "ending_last_page") {
    let nextCols = appendDoc(progress, "doc_boss_last_page");
    progress = normalizeVoidCityProgress({
      ...progress,
      endingDossierSeen: true,
      pheDoRevealed: true,
      collectedDocIds: nextCols.includes("doc_ending_phe_do") ? nextCols : [...nextCols, "doc_ending_phe_do"].slice(0, 32),
    });
    return {
      nextProgress: progress,
      coinBonus: 0,
      spawnBoss: false,
      spawnAmbush: false,
      payload: buildVoidCityEndingPayload(progress, lang),
    };
  }
  const node = VOID_CITY_INTERACTABLES.find((n) => n.id === nodeId);
  if (!node) {
    return {
      nextProgress: progress,
      payload: {
        kind: "story",
        title: isEn ? "Silent Echo" : "Tiếng Vọng Tĩnh Lặng",
        tag: "VOID CITY",
        body: isEn ? "Only cold mist drifts across the stone." : "Chỉ có sương lạnh lững lờ trôi trên nền đá cổ.",
      },
      coinBonus: 0,
      spawnBoss: false,
      spawnAmbush: false,
    };
  }

  // 1. Clock Tower Time-Reversal Mechanism
  if (node.kind === "clock_lever" && runtime) {
    const toggled = toggleVoidCityClockReversal(runtime, progress);
    progress = toggled.nextProgress;
    return {
      nextProgress: progress,
      toggledClockReversed: toggled.reversed,
      payload: {
        kind: "story",
        tag: isEn ? "CLOCK TOWER MECHANISM" : "CƠ QUAN THÁP ĐỒNG HỒ",
        title: toggled.reversed
          ? (isEn ? "Time Flow Reversed!" : "Dòng Thời Gian Đã Đảo Ngược!")
          : (isEn ? "Time Flow Restored!" : "Nhịp Đồng Hồ Đã Trở Lại!"),
        body: toggled.reversed
          ? (isEn
              ? "Colossal gears spin backward! The North Time-Reversal Gate opens and sealed bridges realign."
              : "Bánh răng khổng lồ quay ngược chiều kim! Cổng Thời Gian Nghịch phía bắc đã mở ra và các nhịp cầu đá dịch chuyển.")
          : (isEn
              ? "The pendulum snaps forward. North Clock Gate seals while the East Pass opens."
              : "Con lắc trở về nhịp thuận. Cổng Thời Gian Nghịch đóng lại trong khi Lối Đông mở thông."),
        audioCue: "clock_chime",
      },
      coinBonus: 0,
      spawnBoss: false,
      spawnAmbush: false,
    };
  }

  // 2. Boss Altar
  if (node.kind === "boss_altar") {
    return {
      nextProgress: progress,
      spawnBoss: true,
      spawnAmbush: false,
      coinBonus: 0,
      payload: {
        kind: "story",
        tag: isEn ? "HEART OF THE VOID · BOSS" : "TRUNG TÂM HƯ KHÔNG · BOSS",
        title: isEn ? "Kẻ Giữ Hồ Sơ Awakens!" : "KẺ GIỮ HỒ SƠ THỨC TỈNH!",
        body: isEn
          ? "Thousands of blank pages swirl out of the abyss, forming a towering cloaked figure whose face is a storm of torn archives!"
          : "Hàng nghìn trang giấy trắng cuộn trào từ vực sâu, ngưng tụ thành một bóng người khoác áo choàng khổng lồ với khuôn mặt là cơn lốc trang sách!",
        quote: isEn ? "\"All erased names remain within my ledger.\"" : "\"Mọi cái tên bị xóa đều nằm trong tập hồ sơ của ta.\"",
        audioCue: "page_storm",
        themeVariant: "crimson",
      },
    };
  }

  // 3. Relic Puzzle Entrances -> open genuine interactive puzzle modal
  if (node.kind === "relic_puzzle" && node.relicId) {
    const relicTitles: Record<NonNullable<VoidCityInteractable["relicId"]>, { vi: string; en: string }> = {
      relic_1_astrolabe: { vi: "Di Tích 1 · Đài Thiên Văn Mất Sao", en: "Relic 1 · Lost Star Observatory" },
      relic_2_nameless_tomb: { vi: "Di Tích 2 · Lăng Mộ Những Kẻ Vô Danh", en: "Relic 2 · Tomb of the Nameless" },
      relic_3_sealed_archive: { vi: "Di Tích 3 · Kho Lưu Trữ Bị Niêm Phong", en: "Relic 3 · Sealed Archive Room" },
      relic_4_theater_masks: { vi: "Di Tích 4 · Nhà Hát Bốn Bóng Người", en: "Relic 4 · Theater of Four Shadows" },
      relic_5_mirror_vault: { vi: "Di Tích 5 · Hầm Gương Đảo Ngược", en: "Relic 5 · Inverted Mirror Vault" },
      relic_6_origin_sanctum: { vi: "Di Tích 6 · Điện Thờ Khởi Nguyên", en: "Relic 6 · Origin Sanctum" },
    };
    return {
      nextProgress: progress,
      spawnBoss: false,
      spawnAmbush: false,
      coinBonus: 0,
      payload: {
        kind: "puzzle",
        relicId: node.relicId,
        tag: isEn ? "SECRET RELIC PUZZLE" : "CƠ QUAN DI TÍCH BÍ MẬT",
        title: isEn ? relicTitles[node.relicId].en : relicTitles[node.relicId].vi,
        body: "",
        audioCue: "secret_chime",
      },
    };
  }

  // 4. Theater Special Puppet Stage (Cross-Map 4 Secret!)
  if (node.kind === "theater_puppet_stage") {
    const hasPuppet = Boolean(
      grudgeForestProgress?.ee1RoguePuppetSeen || grudgeForestProgress?.ee1SecretHouseSeen
    );
    if (hasPuppet) {
      const firstPlay = !progress.map4PuppetPlaySeen;
      progress = normalizeVoidCityProgress({
        ...progress,
        map4PuppetPlaySeen: true,
        foundMasks: Array.from(new Set([...progress.foundMasks, "m_violet_twin"])),
      });
      return {
        nextProgress: progress,
        coinBonus: firstPlay ? 450 : 0,
        spawnBoss: false,
        spawnAmbush: false,
        payload: {
          kind: "story",
          tag: isEn ? "CROSS-MAP 4 SECRET · THEATER" : "LIÊN THÔNG MAP 4 · SÂN KHẤU",
          title: isEn ? "Special Puppet Play: The Rewritten Act" : "Vở Kịch Ẩn: Màn Diễn Con Rối Map 4",
          body: isEn
            ? "You place the Special Puppet from Grudge Forest onto the empty stage. Spotlights turn pale gold — the puppet reenacts an unrecorded scene where the World Creator hesitates before erasing the city, unlocking the Secret Play Chest nearby!"
            : "Bạn đặt Con Rối Đặc Biệt từ Rừng Oán Niệm lên sân khấu trống. Đèn rọi chuyển vàng nhạt — con rối tự diễn lại cảnh chưa từng có trong hồ sơ: người tạo thế giới đã chần chừ trước khi xóa thành phố, đồng thời mở khóa Rương Kịch Bản Ẩn ngay cạnh sân khấu!",
          quote: isEn
            ? "\"Even a wooden puppet remembers the hand that did not wish to burn it.\""
            : "\"Ngay cả con rối gỗ cũng nhớ bàn tay đã từng chần chừ không muốn thiêu hủy nó.\"",
          rewardText: firstPlay ? (isEn ? "+450 Gold · Secret Chest Unlocked!" : "+450 Vàng · Mở Rương Kịch Bản Ẩn!") : undefined,
          audioCue: "theater_chord",
          themeVariant: "gold",
        },
      };
    }
    return {
      nextProgress: progress,
      coinBonus: 0,
      spawnBoss: false,
      spawnAmbush: false,
      payload: {
        kind: "story",
        tag: isEn ? "EMPTY THEATER STAGE" : "SÂN KHẤU TỰ DIỄN",
        title: isEn ? "Ghostly Automated Reenactment" : "Vở Diễn Quá Khứ Tự Động Lặp Lại",
        body: isEn
          ? "Shadow figures bow to an empty auditorium. An empty pedestal waits for a 'Special Puppet' from Grudge Forest (Map 4) to trigger the hidden act."
          : "Những bóng mờ cúi chào hàng ghế không người. Một bục gỗ trống dường như đang chờ 'Con Rối Đặc Biệt' từ Rừng Oán Niệm (Map 4) để kích hoạt kịch bản ẩn.",
        audioCue: "theater_chord",
      },
    };
  }

  // 5. Ancient Chests (opened with Memory Keys or Puppet Play)
  if (node.kind === "ancient_chest" && node.chestId) {
    const chestDef = VOID_CITY_CHESTS.find((c) => c.id === node.chestId);
    if (!chestDef) {
      return {
        nextProgress: progress,
        coinBonus: 0,
        spawnBoss: false,
        spawnAmbush: false,
        payload: { kind: "story", tag: "CHEST", title: "Empty", body: "" },
      };
    }
    const alreadyOpened = progress.openedChests.includes(chestDef.id);
    if (alreadyOpened) {
      return {
        nextProgress: progress,
        coinBonus: 0,
        spawnBoss: false,
        spawnAmbush: false,
        payload: {
          kind: "story",
          tag: isEn ? "ANCIENT CHEST" : "RƯƠNG CỔ ĐẠI",
          title: isEn ? chestDef.name.en : chestDef.name.vi,
          body: isEn ? "This ancient vault chest has already been claimed." : "Rương cổ đại này đã được mở khóa và thu thập phần thưởng.",
        },
      };
    }
    if (chestDef.requiresPuppetShow && !progress.map4PuppetPlaySeen) {
      return {
        nextProgress: progress,
        coinBonus: 0,
        spawnBoss: false,
        spawnAmbush: false,
        payload: {
          kind: "story",
          tag: isEn ? "SEALED STAGE CHEST" : "RƯƠNG NIÊM PHONG SÂN KHẤU",
          title: isEn ? chestDef.name.en : chestDef.name.vi,
          body: isEn
            ? "Sealed by a velvet script lock. Perform the Map 4 Special Puppet scene on the Theater stage nearby to unlock it!"
            : "Bị khóa bằng ấn kịch bản nhung đỏ. Hãy kích hoạt Sân Khấu Tái Hiện bằng Con Rối Đặc Biệt (Map 4) gần đây để mở!",
        },
      };
    }
    if (chestDef.requiresMemoryKey && progress.memoryKeys <= 0) {
      return {
        nextProgress: progress,
        coinBonus: 0,
        spawnBoss: false,
        spawnAmbush: false,
        payload: {
          kind: "story",
          tag: isEn ? "MEMORY KEY REQUIRED" : "CẦN CHÌA KHÓA KÝ ỨC",
          title: isEn ? chestDef.name.en : chestDef.name.vi,
          body: isEn
            ? "Requires 1 Memory Key! Solve Relic 3 (Sealed Archive Room in Zone 4 Library) to obtain Memory Keys."
            : "Cần 1 Chìa Khóa Ký Ức! Hãy giải Di Tích 3 (Kho Lưu Trữ Bị Niêm Phong tại Thư Viện Khu 4) để nhận Chìa Khóa Ký Ức.",
        },
      };
    }
    progress = normalizeVoidCityProgress({
      ...progress,
      memoryKeys: chestDef.requiresMemoryKey ? Math.max(0, progress.memoryKeys - 1) : progress.memoryKeys,
      openedChests: [...progress.openedChests, chestDef.id],
      starShardCount: progress.starShardCount + chestDef.starShardBonus,
      starShardTotalEarned: progress.starShardTotalEarned + chestDef.starShardBonus,
    });
    return {
      nextProgress: progress,
      coinBonus: chestDef.goldReward,
      claimChestDef: chestDef,
      spawnBoss: false,
      spawnAmbush: false,
      payload: {
        kind: "story",
        tag: isEn ? "ANCIENT CHEST UNLOCKED" : "ĐÃ MỞ RƯƠNG CỔ ĐẠI",
        title: isEn ? chestDef.name.en : chestDef.name.vi,
        body: isEn
          ? "The ancient brass lock clicks open, revealing preserved First World armaments and a glowing Star Shard!"
          : "Ổ khóa đồng cổ bật mở, để lộ trang bị quý giá từ Thế Giới Thứ Nhất cùng một Mảnh Thiên Thạch phát sáng!",
        rewardText: isEn
          ? `+${chestDef.goldReward} Gold · +${chestDef.starShardBonus} Star Shard · Rare Gear!`
          : `+${chestDef.goldReward} Vàng · +${chestDef.starShardBonus} Mảnh Thiên Thạch · Trang Bị Hiếm!`,
        audioCue: "secret_chime",
        themeVariant: "gold",
      },
    };
  }

  // 6. Cross-Map 1–3 Echo Seal
  if (node.kind === "cross_map_seal") {
    const m1 = Boolean(citadelSecrets?.combinedUnlocked || citadelSecrets?.tinClue || citadelSecrets?.baoClue);
    const m2 = Boolean(infernoProgress?.trungTriggered || infernoProgress?.fourChairsUnlocked);
    const m3 = Boolean(frozenTombProgress?.linkedDeviceTriggered || frozenTombProgress?.endingShardSeen);
    progress = normalizeVoidCityProgress({
      ...progress,
      map1EchoSeen: progress.map1EchoSeen || m1,
      map2EchoSeen: progress.map2EchoSeen || m2,
      map3EchoSeen: progress.map3EchoSeen || m3,
      collectedDocIds: appendDoc(progress, node.docId),
    });
    const activeCount = [m1, m2, m3].filter(Boolean).length;
    const bonusGold = activeCount > 0 ? activeCount * 120 : 0;
    const doc = VOID_CITY_DOCS.doc_cross_map_1_3;
    return {
      nextProgress: progress,
      coinBonus: bonusGold,
      spawnBoss: false,
      spawnAmbush: false,
      payload: {
        kind: "story",
        tag: isEn ? doc.tag.en : doc.tag.vi,
        title: isEn ? doc.title.en : doc.title.vi,
        body:
          (isEn ? doc.body.en : doc.body.vi) +
          `\n\n[${isEn ? "Resonances active" : "Ấn ký đang cộng hưởng"}: ${activeCount}/3 — Map 1: ${m1 ? "✓" : "○"} · Map 2: ${m2 ? "✓" : "○"} · Map 3: ${m3 ? "✓" : "○"}]`,
        rewardText: bonusGold > 0 ? `+${bonusGold} ${isEn ? "Gold Resonance" : "Vàng Cộng Hưởng"}` : undefined,
        audioCue: "secret_chime",
        themeVariant: activeCount === 3 ? "gold" : "void",
      },
    };
  }

  // 7. Clue Documents & Trung Dossier
  const doc = node.docId ? VOID_CITY_DOCS[node.docId] : null;
  let coinBonus = 0;
  let nextFoundConst = progress.foundConstellations;
  let nextPages = progress.foundTornPages;
  let nextMasks = progress.foundMasks;
  let nextTombRead = progress.tombInscriptionsRead;
  let nextScriptRead = progress.theaterScriptRead;
  let nextMirrorRead = progress.mirrorClueRead;
  let nextTrungSeen = progress.trungDossierSeen;

  if (node.kind === "constellation_clue" && node.docId) {
    if (!nextFoundConst.includes(node.docId)) {
      nextFoundConst = [...nextFoundConst, node.docId];
      coinBonus = 120;
    }
  } else if (node.kind === "tomb_clue") {
    if (!nextTombRead) coinBonus = 120;
    nextTombRead = true;
  } else if (node.kind === "torn_page" && node.docId) {
    const pageKey =
      node.docId === "doc_torn_page_1"
        ? "page_genesis"
        : node.docId === "doc_torn_page_2"
        ? "page_trung"
        : "page_erasure";
    if (!nextPages.includes(pageKey)) {
      nextPages = [...nextPages, pageKey];
      coinBonus = 140;
    }
  } else if (node.kind === "mask_clue") {
    if (!nextScriptRead) coinBonus = 140;
    nextScriptRead = true;
    nextMasks = Array.from(new Set([...nextMasks, "m_gold_crack", "m_ash_tear", "m_silver_blank", "m_violet_twin"]));
  } else if (node.kind === "mirror_clue") {
    if (!nextMirrorRead) coinBonus = 140;
    nextMirrorRead = true;
  } else if (node.kind === "trung_dossier") {
    if (!nextTrungSeen) coinBonus = 240;
    nextTrungSeen = true;
  }

  progress = normalizeVoidCityProgress({
    ...progress,
    foundConstellations: nextFoundConst,
    foundTornPages: nextPages,
    foundMasks: nextMasks,
    tombInscriptionsRead: nextTombRead,
    theaterScriptRead: nextScriptRead,
    mirrorClueRead: nextMirrorRead,
    trungDossierSeen: nextTrungSeen,
    collectedDocIds: appendDoc(progress, node.docId),
  });

  return {
    nextProgress: progress,
    coinBonus,
    spawnBoss: false,
    spawnAmbush: false,
    payload: {
      kind: "story",
      tag: doc ? (isEn ? doc.tag.en : doc.tag.vi) : "VOID CITY",
      title: doc ? (isEn ? doc.title.en : doc.title.vi) : isEn ? node.label.en : node.label.vi,
      body: doc ? (isEn ? doc.body.en : doc.body.vi) : "",
      quote: doc?.highlightQuote ? (isEn ? doc.highlightQuote.en : doc.highlightQuote.vi) : undefined,
      rewardText: coinBonus > 0 ? `+${coinBonus} ${isEn ? "Gold & Clue Saved" : "Vàng & Đã Lưu Manh Mối"}` : undefined,
      audioCue: node.kind === "trung_dossier" ? "secret_chime" : "page_rustle",
      themeVariant: node.kind === "trung_dossier" ? "gold" : "void",
    },
  };
}

// ---------- PUZZLE SOLVERS FOR THE 6 RELICS ----------

export function solveVoidCityRelicPuzzle({
  relicId,
  submission,
  progress: progInput,
  lang = "vi",
}: {
  relicId: NonNullable<VoidCityInteractable["relicId"]>;
  submission: unknown;
  progress: VoidCityProgressState | unknown;
  lang?: VoidCityLang;
}): {
  solved: boolean;
  alreadySolved: boolean;
  spawnAmbush: boolean;
  nextProgress: VoidCityProgressState;
  coinBonus: number;
  message: string;
  doc?: VoidCityDoc;
} {
  let progress = normalizeVoidCityProgress(progInput);
  const isEn = lang === "en";

  if (relicId === "relic_1_astrolabe") {
    if (progress.relic1Solved) {
      return { solved: true, alreadySolved: true, spawnAmbush: false, nextProgress: progress, coinBonus: 0, message: isEn ? "Observatory already unlocked." : "Đài Thiên Văn đã mở khóa." };
    }
    const rings = Array.isArray((submission as { rings?: unknown })?.rings)
      ? ((submission as { rings: number[] }).rings).map(Number)
      : [];
    const ok = rings.length === 4 && RELIC1_TARGET_RINGS.every((v, i) => rings[i] === v);
    if (!ok) {
      return {
        solved: false,
        alreadySolved: false,
        spawnAmbush: false,
        nextProgress: progress,
        coinBonus: 0,
        message: isEn ? "The astronomical rings misalign and grind back. Check Phố Người Vắng rooftop & Library star charts!" : "Các vòng thiên văn lệch nhịp và xoay trả lại. Hãy kiểm tra manh mối chòm sao ở Phố Người Vắng & Thư Viện!",
      };
    }
    progress = normalizeVoidCityProgress({
      ...progress,
      relic1Solved: true,
      starShardCount: progress.starShardCount + 2,
      starShardTotalEarned: progress.starShardTotalEarned + 2,
      collectedDocIds: appendDoc(progress, "doc_constellation_library"),
    });
    return {
      solved: true,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 400,
      doc: VOID_CITY_DOCS.doc_constellation_library,
      message: isEn
        ? "Star seal unlocked! Earned +2 Star Shards (Mảnh Thiên Thạch) & +400 Gold."
        : "Đã giải mở Đài Thiên Văn Mất Sao! Nhận +2 Mảnh Thiên Thạch & +400 Vàng.",
    };
  }

  if (relicId === "relic_2_nameless_tomb") {
    if (progress.relic2Solved) {
      return { solved: true, alreadySolved: true, spawnAmbush: false, nextProgress: progress, coinBonus: 0, message: isEn ? "Nameless Tomb already open." : "Lăng Mộ đã mở." };
    }
    const selected = Array.isArray((submission as { statueIds?: unknown })?.statueIds)
      ? Array.from(new Set(((submission as { statueIds: number[] }).statueIds).map(Number))).sort((a, b) => a - b)
      : [];
    const ok = selected.length === 3 && RELIC2_TARGET_IDS.every((v, i) => selected[i] === v);
    if (!ok) {
      return {
        solved: false,
        alreadySolved: false,
        spawnAmbush: false,
        nextProgress: progress,
        coinBonus: 0,
        message: isEn ? "Wrong statues selected. Read the Tombstone Inscriptions in Zone 2 carefully." : "Sai 3 bức tượng vô danh. Hãy đọc kỹ Bia Mộ Khắc Ký Hiệu tại Quảng Trường Khu 2!",
      };
    }
    progress = normalizeVoidCityProgress({
      ...progress,
      relic2Solved: true,
      namelessSealUnlocked: true,
      namelessSealActive: true,
      collectedDocIds: appendDoc(progress, "doc_tomb_clues"),
    });
    return {
      solved: true,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 420,
      doc: VOID_CITY_DOCS.doc_tomb_clues,
      message: isEn
        ? "Nameless Tomb unsealed! Unlocked Ấn Vô Danh (Visual Aura & Title) +420 Gold."
        : "Lăng Mộ Những Kẻ Vô Danh đã mở! Nhận Ấn Vô Danh (Hiệu ứng hào quang & Danh hiệu) +420 Vàng.",
    };
  }

  if (relicId === "relic_3_sealed_archive") {
    if (progress.relic3Solved) {
      return { solved: true, alreadySolved: true, spawnAmbush: false, nextProgress: progress, coinBonus: 0, message: isEn ? "Sealed Archive already open." : "Kho Lưu Trữ đã mở." };
    }
    const order = Array.isArray((submission as { pageOrder?: unknown })?.pageOrder)
      ? ((submission as { pageOrder: string[] }).pageOrder).map(String)
      : [];
    const ok = order.length === 3 && RELIC3_TARGET_ORDER.every((v, i) => order[i] === v);
    if (!ok) {
      return {
        solved: false,
        alreadySolved: false,
        spawnAmbush: false,
        nextProgress: progress,
        coinBonus: 0,
        message: isEn ? "Chronological sequence incorrect! Arrange from First Era -> Pre-Reset Trung -> Erasure Edict." : "Thứ tự thời gian chưa đúng! Sắp xếp từ Bản Thiết Kế Thứ Nhất -> Hồ Sơ Trung -> Sắc Lệnh Xóa Sổ.",
      };
    }
    progress = normalizeVoidCityProgress({
      ...progress,
      relic3Solved: true,
      memoryKeys: progress.memoryKeys + 3,
      memoryKeysTotalEarned: progress.memoryKeysTotalEarned + 3,
      collectedDocIds: appendDoc(
        { ...progress, collectedDocIds: appendDoc(progress, "doc_torn_page_2") },
        "doc_torn_page_3"
      ),
    });
    return {
      solved: true,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 450,
      doc: VOID_CITY_DOCS.doc_torn_page_2,
      message: isEn
        ? "Hidden bookshelves slide open! Earned +3 Memory Keys (Chìa Khóa Ký Ức) to open Ancient Chests!"
        : "Giá sách bí mật trượt mở! Nhận +3 Chìa Khóa Ký Ức để mở các Rương Cổ Đại trên bản đồ!",
    };
  }

  if (relicId === "relic_4_theater_masks") {
    if (progress.relic4Solved) {
      return { solved: true, alreadySolved: true, spawnAmbush: false, nextProgress: progress, coinBonus: 0, message: isEn ? "Backstage chamber already unlocked." : "Hậu trường đã mở." };
    }
    const mapping = (submission as { mapping?: Record<string, string> })?.mapping || {};
    const ok = Object.entries(RELIC4_TARGET_MAPPING).every(([ped, mask]) => mapping[ped] === mask);
    if (!ok) {
      return {
        solved: false,
        alreadySolved: false,
        spawnAmbush: true,
        nextProgress: progress,
        coinBonus: 0,
        message: isEn
          ? "Wrong mask placement! Crimson spotlights flare as Shadow Guardians ambush the stage!"
          : "Đặt sai mặt nạ! Ánh đèn sân khấu đỏ rực, Bóng Tối & Linh Hồn Bảo Vệ Di Tích lao ra phục kích!",
      };
    }
    progress = normalizeVoidCityProgress({
      ...progress,
      relic4Solved: true,
      memoryMaskUnlocked: true,
      memoryMaskActive: true,
      collectedDocIds: appendDoc(progress, "doc_theater_script"),
    });
    return {
      solved: true,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 480,
      doc: VOID_CITY_DOCS.doc_theater_script,
      message: isEn
        ? "Theater curtain parts! Unlocked Mặt Nạ Ký Ức (+8% Move Speed, +6% DMG Red & Spectral Aura)!"
        : "Màn nhung hậu trường tách ra! Nhận Mặt Nạ Ký Ức (+8% Tốc Chạy, +6% Giảm Sát Thương & Hào Quang)!",
    };
  }

  if (relicId === "relic_5_mirror_vault") {
    if (progress.relic5Solved) {
      return { solved: true, alreadySolved: true, spawnAmbush: false, nextProgress: progress, coinBonus: 0, message: isEn ? "Mirror Vault already unsealed." : "Hầm Gương đã mở." };
    }
    const angles = (submission as { angles?: Record<number, number> })?.angles || {};
    const illusionDisabled = Boolean((submission as { illusionDisabled?: boolean })?.illusionDisabled);
    const ok =
      illusionDisabled &&
      Number(angles[1]) === 45 &&
      Number(angles[2]) === 135 &&
      Number(angles[4]) === 225;
    if (!ok) {
      return {
        solved: false,
        alreadySolved: false,
        spawnAmbush: false,
        nextProgress: progress,
        coinBonus: 0,
        message: isEn
          ? "Beam dispersed by the illusion mirror! Disable the Shadowless Mirror (#3) and set true mirrors to 45° / 135° / 225°."
          : "Tia sáng bị Gương Ảo Ảnh làm nhiễu! Hãy tắt Gương #3 (không bóng đất) và xoay Gương thật về 45° / 135° / 225°.",
      };
    }
    progress = normalizeVoidCityProgress({
      ...progress,
      relic5Solved: true,
      reflectionCoreCount: progress.reflectionCoreCount + 2,
      reflectionCoreTotalEarned: progress.reflectionCoreTotalEarned + 2,
      collectedDocIds: appendDoc(progress, "doc_mirror_plaque"),
    });
    return {
      solved: true,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 480,
      doc: VOID_CITY_DOCS.doc_mirror_plaque,
      message: isEn
        ? "Mirror Pool parts into ancient ruins! Earned +2 Reflection Cores (Lõi Phản Chiếu) for permanent stat upgrades!"
        : "Mặt Hồ Gương tách làm đôi! Nhận +2 Lõi Phản Chiếu để nâng cấp chỉ số vĩnh viễn cho tướng!",
    };
  }

  // Relic 6: Điện Thờ Khởi Nguyên (requires >= 3 base relics solved)
  if (progress.relic6Solved) {
    return { solved: true, alreadySolved: true, spawnAmbush: false, nextProgress: progress, coinBonus: 0, message: isEn ? "Origin Sanctum already awakened." : "Điện Thờ Khởi Nguyên đã thức tỉnh." };
  }
  if (!isRelic6Accessible(progress)) {
    const cur = countVoidCityBaseRelics(progress);
    return {
      solved: false,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 0,
      message: isEn
        ? `Origin Sanctum Locked! Solve at least 3 earlier Relics first (${cur}/3).`
        : `Điện Thờ Đang Khóa! Cần giải ít nhất 3 Di Tích trước đó (${cur}/3).`,
    };
  }
  const seq = Array.isArray((submission as { sequence?: unknown })?.sequence)
    ? ((submission as { sequence: string[] }).sequence).map(String)
    : [];
  const ok = seq.length === 4 && RELIC6_TARGET_SEQUENCE.every((v, i) => seq[i] === v);
  if (!ok) {
    return {
      solved: false,
      alreadySolved: false,
      spawnAmbush: false,
      nextProgress: progress,
      coinBonus: 0,
      message: isEn
        ? "Origin runes fail to resonate! Place truths in causal order: Sky -> Erased Names -> Pre-Reset Record -> Observer's Judgment."
        : "Ấn Khởi Nguyên chưa cộng hưởng! Đặt đúng trình tự: Bầu Trời Khác -> Tên Bị Xóa -> Trước Tái Lập -> Phán Quyết.",
    };
  }
  progress = normalizeVoidCityProgress({
    ...progress,
    relic6Solved: true,
    originFragmentUnlocked: true,
    originFragmentForged: true,
    collectedDocIds: appendDoc(progress, "doc_origin_sanctum"),
  });
  return {
    solved: true,
    alreadySolved: false,
    spawnAmbush: false,
    nextProgress: progress,
    coinBonus: 800,
    doc: VOID_CITY_DOCS.doc_origin_sanctum,
    message: isEn
      ? "White-gold Genesis light floods the Sanctum! Unlocked & Forged Origin Fragment (Mảnh Khởi Nguyên)!"
      : "Ánh sáng Khởi Nguyên bừng sáng! Đã mở khóa & tôi luyện Mảnh Khởi Nguyên (+12% Sát Thương Boss, +55 ATK, +68 AP, +260 HP, +5% Chí Mạng)!",
  };
}

// ---------- REWARD WORKSHOP ACTIONS ----------

export function applyStarShardUpgrade(
  progressInput: VoidCityProgressState | unknown,
  slotId: string,
  lang: VoidCityLang = "vi"
): { ok: boolean; nextProgress: VoidCityProgressState; message: string } {
  const progress = normalizeVoidCityProgress(progressInput);
  const isEn = lang === "en";
  if (!["weapon", "armor", "boots", "gloves", "necklace", "relic"].includes(slotId)) {
    return { ok: false, nextProgress: progress, message: isEn ? "Invalid gear slot." : "Ô trang bị không hợp lệ." };
  }
  if (progress.starShardCount < 1) {
    return { ok: false, nextProgress: progress, message: isEn ? "Not enough Star Shards!" : "Không đủ Mảnh Thiên Thạch!" };
  }
  if (progress.starForgedSlots.includes(slotId)) {
    return { ok: false, nextProgress: progress, message: isEn ? "Slot already Star-Forged." : "Ô trang bị này đã được cường hóa sao!" };
  }
  const nextProgress = normalizeVoidCityProgress({
    ...progress,
    starShardCount: progress.starShardCount - 1,
    starForgedSlots: [...progress.starForgedSlots, slotId],
  });
  return {
    ok: true,
    nextProgress,
    message: isEn ? `Star-Forged ${slotId} (+22 ATK, +26 AP, +110 HP)!` : `Đã tôi luyện Thiên Thạch cho ${slotId} (+22 Công, +26 Phép, +110 Máu)!`,
  };
}

export function exchangeStarShardForGold(
  progressInput: VoidCityProgressState | unknown,
  lang: VoidCityLang = "vi"
): { ok: boolean; nextProgress: VoidCityProgressState; goldGranted: number; message: string } {
  const progress = normalizeVoidCityProgress(progressInput);
  const isEn = lang === "en";
  if (progress.starShardCount < 1) {
    return { ok: false, nextProgress: progress, goldGranted: 0, message: isEn ? "No Star Shards left." : "Không còn Mảnh Thiên Thạch." };
  }
  const goldGranted = 480;
  const nextProgress = normalizeVoidCityProgress({
    ...progress,
    starShardCount: progress.starShardCount - 1,
    starExchangeCount: progress.starExchangeCount + 1,
  });
  return {
    ok: true,
    nextProgress,
    goldGranted,
    message: isEn ? `Exchanged 1 Star Shard for +${goldGranted} Gold!` : `Đã đổi 1 Mảnh Thiên Thạch lấy +${goldGranted} Vàng!`,
  };
}

export function applyReflectionCoreSubstat(
  progressInput: VoidCityProgressState | unknown,
  statKey: ReflectionSubstatKey,
  lang: VoidCityLang = "vi"
): { ok: boolean; nextProgress: VoidCityProgressState; message: string } {
  const progress = normalizeVoidCityProgress(progressInput);
  const isEn = lang === "en";
  if (progress.reflectionCoreCount < 1) {
    return { ok: false, nextProgress: progress, message: isEn ? "No Reflection Cores left." : "Không còn Lõi Phản Chiếu." };
  }
  const curLevel = progress.reflectionSubstats[statKey] || 0;
  if (curLevel >= 5) {
    return { ok: false, nextProgress: progress, message: isEn ? "Sub-stat maxed out (5/5)." : "Chỉ số phụ này đã đạt tối đa (5/5)." };
  }
  const nextProgress = normalizeVoidCityProgress({
    ...progress,
    reflectionCoreCount: progress.reflectionCoreCount - 1,
    reflectionSubstats: {
      ...progress.reflectionSubstats,
      [statKey]: curLevel + 1,
    },
  });
  return {
    ok: true,
    nextProgress,
    message: isEn ? `Imbued Reflection Core into ${statKey.toUpperCase()}!` : `Đã khảm Lõi Phản Chiếu tăng vĩnh viễn ${statKey.toUpperCase()}!`,
  };
}

export function toggleVoidCityCollectiblePerk(
  progressInput: VoidCityProgressState | unknown,
  perk: "namelessSeal" | "memoryMask" | "originFragment",
  lang: VoidCityLang = "vi"
): { ok: boolean; nextProgress: VoidCityProgressState; active: boolean; message: string } {
  const p = normalizeVoidCityProgress(progressInput);
  const isEn = lang === "en";
  if (perk === "namelessSeal") {
    if (!p.namelessSealUnlocked) {
      return { ok: false, nextProgress: p, active: false, message: isEn ? "Solve Relic 2 first." : "Hãy giải Di Tích 2 trước." };
    }
    const next = !p.namelessSealActive;
    return {
      ok: true,
      active: next,
      nextProgress: normalizeVoidCityProgress({ ...p, namelessSealActive: next }),
      message: isEn ? (next ? "Nameless Seal aura equipped." : "Nameless Seal aura hidden.") : (next ? "Đã bật hào quang Ấn Vô Danh." : "Đã tắt hào quang Ấn Vô Danh."),
    };
  }
  if (perk === "memoryMask") {
    if (!p.memoryMaskUnlocked) {
      return { ok: false, nextProgress: p, active: false, message: isEn ? "Solve Relic 4 first." : "Hãy giải Di Tích 4 trước." };
    }
    const next = !p.memoryMaskActive;
    return {
      ok: true,
      active: next,
      nextProgress: normalizeVoidCityProgress({ ...p, memoryMaskActive: next }),
      message: isEn ? (next ? "Memory Mask equipped (+8% MS, +6% DMG Red)." : "Memory Mask removed.") : (next ? "Đã trang bị Mặt Nạ Ký Ức (+8% Tốc Chạy, +6% Giảm ST)." : "Đã tháo Mặt Nạ Ký Ức."),
    };
  }
  if (!p.originFragmentUnlocked) {
    return { ok: false, nextProgress: p, active: false, message: isEn ? "Solve Relic 6 first." : "Hãy giải Di Tích 6 trước." };
  }
  const next = !p.originFragmentForged;
  return {
    ok: true,
    active: next,
    nextProgress: normalizeVoidCityProgress({ ...p, originFragmentForged: next }),
    message: isEn ? (next ? "Origin Blessing activated on gear!" : "Origin Blessing suspended.") : (next ? "Đã kích hoạt Khảm Khởi Nguyên lên trang bị!" : "Đã tạm ngưng Khảm Khởi Nguyên."),
  };
}

export function buildVoidCityEndingPayload(
  progressInput: VoidCityProgressState | unknown,
  lang: VoidCityLang = "vi"
): VoidCityModalPayload {
  const p = normalizeVoidCityProgress(progressInput);
  const isEn = lang === "en";
  const solvedCount = countVoidCityRelics(p);
  const doc = VOID_CITY_DOCS.doc_ending_phe_do;
  return {
    kind: "ending",
    tag: isEn ? "BOSS DEFEATED · PHẾ ĐÔ THIÊN CƠ" : "CHIẾN THẮNG BOSS · PHẾ ĐÔ THIÊN CƠ",
    title: isEn ? doc.title.en : doc.title.vi,
    body:
      (isEn ? VOID_CITY_DOCS.doc_boss_last_page.body.en : VOID_CITY_DOCS.doc_boss_last_page.body.vi) +
      "\n\"" +
      (isEn ? VOID_CITY_DOCS.doc_boss_last_page.highlightQuote!.en : VOID_CITY_DOCS.doc_boss_last_page.highlightQuote!.vi) +
      "\"\n\n" +
      (isEn ? doc.body.en : doc.body.vi) +
      `\n\n[${isEn ? "Relics Solved" : "Di Tích Đã Giải"}: ${solvedCount}/6]`,
    quote: isEn ? doc.highlightQuote!.en : doc.highlightQuote!.vi,
    rewardText: isEn ? "Unlocked Ending Archive & Next Realm Reveal: PHẾ ĐÔ THIÊN CƠ" : "Mở Khóa Hồ Sơ Kết & Lộ Diện Map Tiếp Theo: PHẾ ĐÔ THIÊN CƠ",
    audioCue: "secret_chime",
    themeVariant: "origin",
  };
}
