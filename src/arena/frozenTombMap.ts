import { type InfernoProgressState, normalizeInfernoProgress } from "./infernoAshMap";

export const FROZEN_TOMB_WIDTH = 3400;
export const FROZEN_TOMB_HEIGHT = 2800;
export const FROZEN_TOMB_SPAWN = { x: 480, y: 2490 };

export type FrozenTombZoneId =
  | "zone_1"
  | "zone_2"
  | "zone_3"
  | "zone_4"
  | "zone_5"
  | "zone_6"
  | "zone_7";

export interface FrozenTombZoneDef {
  id: FrozenTombZoneId;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  accentColor: string;
  name: { vi: string; en: string };
  subtitle: { vi: string; en: string };
}

export interface FrozenTombRectObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | "frozen_wall"
    | "ice_pillar"
    | "wood_house"
    | "cathedral_wall"
    | "palace_wall"
    | "cavern_rock"
    | "tombstone"
    | "cart_wreck"
    | "rune_pillar"
    | "ice_coffin"
    | "brittle_ice_wall";
  label: string;
  destructibleId?: string;
}

export interface FrozenTombDestructibleDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  maxHp: number;
  hint: { vi: string; en: string };
}

export interface FrozenTombDestructibleRuntime extends FrozenTombDestructibleDef {
  hp: number;
  destroyed: boolean;
  hitFlash: number;
  frostCrackPct: number;
}

export type FrozenTombInteractableId =
  | "gate_self_bell"
  | "inn_frozen_ledger"
  | "reverse_clock_house"
  | "apothecary_letter"
  | "cathedral_bell"
  | "cathedral_ritual_notes"
  | "phong_faceless_statues"
  | "phong_mirror_room"
  | "graveyard_epitaph"
  | "graveyard_standing_corpses"
  | "eohyen_painting"
  | "thanh_poison_vial"
  | "trung_palace_archive"
  | "whispering_ice_blocks"
  | "frozen_research_device"
  | "minh_frozen_dossier"
  | "final_seal_coffin"
  | "ending_ice_shard";

export interface FrozenTombInteractableDef {
  id: FrozenTombInteractableId;
  zoneId: FrozenTombZoneId;
  x: number;
  y: number;
  radius: number;
  kind: "ee" | "doc" | "bell" | "clock" | "device" | "boss_seal" | "ending_shard";
  heroIdRequired: "eohyen" | "phong" | "minh" | "thanh" | null;
  docId?: string;
  title: { vi: string; en: string };
  shortPrompt: { vi: string; en: string };
}

export interface FrozenTombDocEntry {
  id: string;
  code: string;
  zoneId: FrozenTombZoneId;
  category: "diary" | "letter" | "ritual" | "audio" | "dossier";
  title: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  heroTag?: string;
  paragraphs: { vi: string; en: string }[];
}

export interface FrozenTombIcePatch {
  id: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  angle: number;
}

export interface FrozenTombCrackedIceHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  state: "stable" | "cracking" | "collapsed" | "refreezing";
  timer: number;
  eohyenFrozenTimer: number;
  didHit: boolean;
}

export interface FrozenTombIceHandsHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  state: "cooldown" | "telegraph" | "erupt";
  timer: number;
  cooldownDuration: number;
  didRoot: boolean;
}

export interface FrozenTombSealingRemnantZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  phase: number;
  exposureSec: number;
  tickCd: number;
}

export interface FrozenTombGhostAmbushZone {
  id: string;
  zoneId: FrozenTombZoneId;
  x: number;
  y: number;
  triggerRadius: number;
  spawnRadius: number;
  state: "armed" | "warning" | "cooldown";
  timer: number;
}

export interface FrozenTombPhantom {
  kind:
    | "rampart_watcher"
    | "window_ghost"
    | "phong_ninja_shadow"
    | "cathedral_choir_ghost"
    | "thanh_flashback_snake"
    | "eohyen_ice_ring"
    | "shadowless_walker";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface FrozenTombBellRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface FrozenTombFootprint {
  x: number;
  y: number;
  angle: number;
  life: number;
  maxLife: number;
}

export interface FrozenTombIceCrystalSpike {
  x: number;
  y: number;
  angle: number;
  height: number;
  life: number;
  maxLife: number;
  fromEohyen: boolean;
}

export interface FrozenTombProgressState {
  eohyenPaintingSeen: boolean;
  phongMirrorClue: boolean;
  minhSealClue: boolean;
  thanhVialClue: boolean;
  linkedDeviceTriggered: boolean;
  introNarrativeSeen: boolean;
  chamberWarningSeen: boolean;
  endingShardSeen: boolean;
  bossDefeatedEmptyVoid: boolean;
  collectedDocs: string[];
  inspectedNodes: FrozenTombInteractableId[];
  destroyedWalls: string[];
}

export interface FrozenTombRuntimeState {
  mapId: "frozen_tomb";
  blizzardState: "calm" | "warning" | "active";
  blizzardTimer: number;
  blizzardIntensity: number;
  bellCooldown: number;
  bellShakeTimer: number;
  crackedIceZones: FrozenTombCrackedIceHazard[];
  iceHandsHazards: FrozenTombIceHandsHazard[];
  sealingRemnants: FrozenTombSealingRemnantZone[];
  ghostAmbushZones: FrozenTombGhostAmbushZone[];
  destructibles: FrozenTombDestructibleRuntime[];
  phantoms: FrozenTombPhantom[];
  bellRipples: FrozenTombBellRipple[];
  ghostFootprints: FrozenTombFootprint[];
  frostSpikes: FrozenTombIceCrystalSpike[];
  staticDistortionIntensity: number;
  darknessPulseSec: number;
  rampartWatcherDismissed: boolean;
  bossSpawnedThisRun: boolean;
  bossDefeatedThisRun: boolean;
  endingShardSpawned: boolean;
  eohyenResonanceBannerTimer: number;
  lastDiscoveryToast: string | null;
  lastDiscoveryTimer: number;
  trungAudioSilenceSec: number;
}

export interface FrozenTombStoryStep {
  speaker: string;
  speakerColor: string;
  text: string;
  subtext?: string;
}

export interface FrozenTombStoryModalPayload {
  nodeId: string;
  zoneId: FrozenTombZoneId;
  title: string;
  subtitle: string;
  code: string;
  themeVariant: "ice" | "eohyen" | "phong" | "minh" | "thanh" | "linked" | "ending" | "cathedral" | "palace";
  isSecretDiscovery: boolean;
  unlockedNow: boolean;
  isEndingSequence?: boolean;
  endingBoldLine?: string;
  showsMap2Symbol?: boolean;
  steps: FrozenTombStoryStep[];
  paragraphs: string[];
  clueSummary: string;
  rewardText?: string;
  audioCue?: "bell" | "whisper" | "clock" | "ice_crack" | "tape" | "ending" | "blizzard" | null;
  progress: FrozenTombProgressState;
}

export const FROZEN_TOMB_ZONES: FrozenTombZoneDef[] = [
  {
    id: "zone_1",
    index: 1,
    x: 0,
    y: 1850,
    w: 1150,
    h: 950,
    accentColor: "#38BDF8",
    name: { vi: "Cổng Thành Băng Giá", en: "Frozen Kingdom Gate" },
    subtitle: {
      vi: "Cánh cổng đóng băng, hai tượng chiến binh & tiếng chuông tự ngân",
      en: "Icebound fortress gate, frozen guardians & self-ringing bell",
    },
  },
  {
    id: "zone_2",
    index: 2,
    x: 0,
    y: 920,
    w: 1250,
    h: 930,
    accentColor: "#67E8F9",
    name: { vi: "Phố Cổ Vĩnh Đông", en: "Eternal Frost Old Town" },
    subtitle: {
      vi: "Những căn nhà gỗ có ánh đèn xanh & chiếc đồng hồ chạy ngược",
      en: "Frozen wooden houses glowing blue & the backwards-running clock",
    },
  },
  {
    id: "zone_3",
    index: 3,
    x: 1250,
    y: 920,
    w: 1100,
    h: 930,
    accentColor: "#818CF8",
    name: { vi: "Thánh Đường Chuông Câm", en: "Cathedral of the Silent Bell" },
    subtitle: {
      vi: "Kính màu lam tím, quả chuông khổng lồ & hành lang tượng không mặt",
      en: "Blue-violet stained glass, giant bell & faceless statues corridor",
    },
  },
  {
    id: "zone_4",
    index: 4,
    x: 0,
    y: 0,
    w: 1350,
    h: 920,
    accentColor: "#93C5FD",
    name: { vi: "Nghĩa Địa Ngàn Người", en: "Graveyard of a Thousand" },
    subtitle: {
      vi: "Hàng bia mộ phát sáng, thi thể đứng đóng băng & dấu chân tự xóa",
      en: "Glowing cracked graves, upright frozen dead & vanishing footprints",
    },
  },
  {
    id: "zone_5",
    index: 5,
    x: 1350,
    y: 0,
    w: 2050,
    h: 920,
    accentColor: "#A5B4FC",
    name: { vi: "Cung Điện Phong Ấn", en: "Palace of Sealing" },
    subtitle: {
      vi: "Phòng nghi thức, bức tranh bị cào & căn phòng mật của Trung",
      en: "Ritual halls, scraped portraits & Trung's secret archive room",
    },
  },
  {
    id: "zone_6",
    index: 6,
    x: 2350,
    y: 920,
    w: 1050,
    h: 1880,
    accentColor: "#A855F7",
    name: { vi: "Hầm Băng Dưới Lòng Đất", en: "Subterranean Ice Caverns" },
    subtitle: {
      vi: "Khối băng giam sinh vật dị dạng & thiết bị thí nghiệm đóng băng",
      en: "Ice blocks sealing strange creatures & the frozen research device",
    },
  },
  {
    id: "zone_7",
    index: 7,
    x: 1150,
    y: 1850,
    w: 1200,
    h: 950,
    accentColor: "#C084FC",
    name: { vi: "Điện Phong Ấn Cuối Cùng", en: "Final Sealing Chamber" },
    subtitle: {
      vi: "Khối băng quan tài khổng lồ, 4 cột đá cổ ngữ & xiềng xích từ trần",
      en: "Giant ice coffin, 4 glowing rune pillars & overhead chains",
    },
  },
];

export const FROZEN_TOMB_STATIC_OBSTACLES: FrozenTombRectObstacle[] = [
  // Zone 1: Frozen Gate rampart wall (wide 240px gateway open at x=360..600)
  { id: "ft_gate_w", x: 60, y: 2200, w: 300, h: 48, kind: "frozen_wall", label: "Tường Thành Băng Tây" },
  { id: "ft_gate_e", x: 600, y: 2200, w: 470, h: 48, kind: "frozen_wall", label: "Tường Thành Băng Đông" },
  { id: "ft_statue_w", x: 298, y: 2272, w: 52, h: 52, kind: "ice_pillar", label: "Tượng Chiến Binh Đóng Băng Tây" },
  { id: "ft_statue_e", x: 610, y: 2272, w: 52, h: 52, kind: "ice_pillar", label: "Tượng Chiến Binh Đóng Băng Đông" },
  { id: "ft_cart_1", x: 180, y: 2545, w: 96, h: 46, kind: "cart_wreck", label: "Xác Xe Ngựa Đóng Băng" },
  { id: "ft_cart_2", x: 750, y: 2475, w: 96, h: 46, kind: "cart_wreck", label: "Xác Xe Tiếp Tế Cổ" },
  // Barrier separating Zone 1 from Zone 7 abyssal chamber so player journeys through the kingdom first
  { id: "ft_z1_z7_wall_top", x: 1126, y: 1850, w: 48, h: 440, kind: "frozen_wall", label: "Vách Đá Ngăn Điện Ngầm Bắc" },
  { id: "ft_z1_z7_wall_bot", x: 1126, y: 2330, w: 48, h: 430, kind: "frozen_wall", label: "Vách Đá Ngăn Điện Ngầm Nam" },

  // Zone 2: Phố Cổ Vĩnh Đông — Enterable Frozen Inn (doorway South x=240..390)
  { id: "ft_inn_n", x: 130, y: 1330, w: 360, h: 32, kind: "wood_house", label: "Quán Trọ Đêm Đông (Bắc)" },
  { id: "ft_inn_w", x: 130, y: 1362, w: 32, h: 250, kind: "wood_house", label: "Quán Trọ Đêm Đông (Tây)" },
  { id: "ft_inn_e", x: 458, y: 1362, w: 32, h: 250, kind: "wood_house", label: "Quán Trọ Đêm Đông (Đông)" },
  { id: "ft_inn_sw", x: 130, y: 1612, w: 110, h: 32, kind: "wood_house", label: "Quán Trọ Đêm Đông (Nam Tây)" },
  { id: "ft_inn_se", x: 380, y: 1612, w: 110, h: 32, kind: "wood_house", label: "Quán Trọ Đêm Đông (Nam Đông)" },

  // Zone 2: Reverse Clock House (doorway West y=1240..1365)
  { id: "ft_clock_n", x: 785, y: 1120, w: 340, h: 32, kind: "wood_house", label: "Nhà Đồng Hồ Ngược (Bắc)" },
  { id: "ft_clock_s", x: 785, y: 1410, w: 340, h: 32, kind: "wood_house", label: "Nhà Đồng Hồ Ngược (Nam)" },
  { id: "ft_clock_e", x: 1093, y: 1152, w: 32, h: 258, kind: "wood_house", label: "Nhà Đồng Hồ Ngược (Đông)" },
  { id: "ft_clock_wt", x: 785, y: 1152, w: 32, h: 90, kind: "wood_house", label: "Nhà Đồng Hồ Ngược (Tây Bắc)" },
  { id: "ft_clock_wb", x: 785, y: 1358, w: 32, h: 52, kind: "wood_house", label: "Nhà Đồng Hồ Ngược (Tây Nam)" },

  // Zone 2: Frozen Herbalist Shop facade
  { id: "ft_herb_n", x: 160, y: 985, w: 280, h: 34, kind: "wood_house", label: "Tiệm Dược Thảo Băng (Bắc)" },
  { id: "ft_herb_e", x: 408, y: 1019, w: 32, h: 160, kind: "wood_house", label: "Tiệm Dược Thảo Băng (Đông)" },

  // Zone 3: Thánh Đường Chuông Câm (wide N/S/E/W nave openings >= 200px)
  { id: "ft_cath_nw", x: 1380, y: 1000, w: 320, h: 42, kind: "cathedral_wall", label: "Tường Thánh Đường Tây Bắc" },
  { id: "ft_cath_ne", x: 1920, y: 1000, w: 300, h: 42, kind: "cathedral_wall", label: "Tường Thánh Đường Đông Bắc" },
  { id: "ft_cath_sw", x: 1380, y: 1720, w: 320, h: 42, kind: "cathedral_wall", label: "Tường Thánh Đường Tây Nam" },
  { id: "ft_cath_se", x: 1920, y: 1720, w: 300, h: 42, kind: "cathedral_wall", label: "Tường Thánh Đường Đông Nam" },
  { id: "ft_cath_wt", x: 1380, y: 1042, w: 42, h: 270, kind: "cathedral_wall", label: "Cánh Tây Thánh Đường (Bắc)" },
  { id: "ft_cath_wb", x: 1380, y: 1510, w: 42, h: 210, kind: "cathedral_wall", label: "Cánh Tây Thánh Đường (Nam)" },
  { id: "ft_cath_et", x: 2178, y: 1042, w: 42, h: 260, kind: "cathedral_wall", label: "Cánh Đông Thánh Đường (Bắc)" },
  { id: "ft_cath_eb", x: 2178, y: 1510, w: 42, h: 210, kind: "cathedral_wall", label: "Cánh Đông Thánh Đường (Nam)" },
  // Ice-covered cathedral pillars inside nave
  { id: "ft_cath_p1", x: 1585, y: 1200, w: 50, h: 50, kind: "ice_pillar", label: "Cột Đá Băng Thánh Đường I" },
  { id: "ft_cath_p2", x: 1985, y: 1200, w: 50, h: 50, kind: "ice_pillar", label: "Cột Đá Băng Thánh Đường II" },
  { id: "ft_cath_p3", x: 1585, y: 1500, w: 50, h: 50, kind: "ice_pillar", label: "Cột Đá Băng Thánh Đường III" },
  { id: "ft_cath_p4", x: 1985, y: 1500, w: 50, h: 50, kind: "ice_pillar", label: "Cột Đá Băng Thánh Đường IV" },
  // Mirror side-corridor frame (Phong EE2)
  { id: "ft_mirror_w", x: 2180, y: 945, w: 165, h: 32, kind: "cathedral_wall", label: "Vách Phòng Gương Bắc" },

  // Zone 4: Nghĩa Địa Ngàn Người — ordered tomb pillars (ample lane widths)
  { id: "ft_tomb_1", x: 240, y: 220, w: 44, h: 66, kind: "tombstone", label: "Bia Mộ Cổ I" },
  { id: "ft_tomb_2", x: 460, y: 220, w: 44, h: 66, kind: "tombstone", label: "Bia Mộ Cổ II" },
  { id: "ft_tomb_3", x: 680, y: 220, w: 44, h: 66, kind: "tombstone", label: "Bia Mộ Cổ III" },
  { id: "ft_tomb_4", x: 240, y: 580, w: 44, h: 66, kind: "tombstone", label: "Bia Mộ Cổ IV" },
  { id: "ft_tomb_5", x: 680, y: 580, w: 44, h: 66, kind: "tombstone", label: "Bia Mộ Cổ V" },
  { id: "ft_tomb_6", x: 1030, y: 390, w: 48, h: 70, kind: "tombstone", label: "Đài Tưởng Niệm Ngàn Người" },

  // Zone 5: Cung Điện Phong Ấn — grand royal hall & Trung's secret archive room
  { id: "ft_pal_nw", x: 1480, y: 150, w: 320, h: 40, kind: "palace_wall", label: "Tường Cung Điện Bắc Tây" },
  { id: "ft_pal_ne", x: 2020, y: 150, w: 340, h: 40, kind: "palace_wall", label: "Tường Cung Điện Bắc Đông" },
  { id: "ft_pal_sw", x: 1480, y: 720, w: 310, h: 40, kind: "palace_wall", label: "Tường Cung Điện Nam Tây" },
  { id: "ft_pal_se", x: 2020, y: 720, w: 340, h: 40, kind: "palace_wall", label: "Tường Cung Điện Nam Đông" },
  { id: "ft_pal_p1", x: 1650, y: 365, w: 48, h: 48, kind: "ice_pillar", label: "Cột Cung Điện Tây" },
  { id: "ft_pal_p2", x: 2140, y: 365, w: 48, h: 48, kind: "ice_pillar", label: "Cột Cung Điện Đông" },
  // Secret Archive Wing (opening West blocked by destructible brittle ice wall `ice_wall_palace_secret`)
  { id: "ft_sec_n", x: 2660, y: 140, w: 580, h: 38, kind: "palace_wall", label: "Mật Thất Trung (Bắc)" },
  { id: "ft_sec_e", x: 3200, y: 178, w: 40, h: 440, kind: "palace_wall", label: "Mật Thất Trung (Đông)" },
  { id: "ft_sec_s", x: 2660, y: 580, w: 580, h: 38, kind: "palace_wall", label: "Mật Thất Trung (Nam)" },
  { id: "ft_sec_wt", x: 2660, y: 178, w: 38, h: 120, kind: "palace_wall", label: "Mật Thất Trung (Tây Bắc)" },
  { id: "ft_sec_wb", x: 2660, y: 460, w: 38, h: 120, kind: "palace_wall", label: "Mật Thất Trung (Tây Nam)" },

  // Zone 6: Hầm Băng Dưới Lòng Đất — glacial cavern rock formations & sealed specimen blocks
  { id: "ft_cav_r1", x: 2475, y: 1080, w: 120, h: 80, kind: "cavern_rock", label: "Vách Băng Cổ I" },
  { id: "ft_cav_r2", x: 3040, y: 1090, w: 140, h: 86, kind: "cavern_rock", label: "Vách Băng Cổ II" },
  { id: "ft_cav_r3", x: 2640, y: 1520, w: 135, h: 90, kind: "cavern_rock", label: "Khối Băng Giam Sinh Vật" },
  { id: "ft_cav_r4", x: 3120, y: 1490, w: 120, h: 140, kind: "cavern_rock", label: "Mỏm Đá Tím Hầm Sâu" },
  { id: "ft_cav_r5", x: 2540, y: 2300, w: 180, h: 85, kind: "cavern_rock", label: "Vách Băng Sụp Đông Nam" },

  // Zone 7: Điện Phong Ấn Cuối Cùng — 4 Rune Pillars + Central Ice Coffin
  { id: "ft_rune_nw", x: 1485, y: 2085, w: 52, h: 52, kind: "rune_pillar", label: "Trụ Cổ Ngữ Tây Bắc" },
  { id: "ft_rune_ne", x: 1965, y: 2085, w: 52, h: 52, kind: "rune_pillar", label: "Trụ Cổ Ngữ Đông Bắc" },
  { id: "ft_rune_sw", x: 1485, y: 2505, w: 52, h: 52, kind: "rune_pillar", label: "Trụ Cổ Ngữ Tây Nam" },
  { id: "ft_rune_se", x: 1965, y: 2505, w: 52, h: 52, kind: "rune_pillar", label: "Trụ Cổ Ngữ Đông Nam" },
  { id: "ft_ice_coffin", x: 1705, y: 2255, w: 90, h: 130, kind: "ice_coffin", label: "Khối Băng Quan Tài Trung Tâm" },
];

export const FROZEN_TOMB_DESTRUCTIBLES: FrozenTombDestructibleDef[] = [
  {
    id: "ice_wall_palace_secret",
    x: 2660,
    y: 298,
    w: 38,
    h: 162,
    maxHp: 220,
    hint: {
      vi: "Tường băng giòn che phòng bí mật của Trung — đánh vỡ để mở lối!",
      en: "Brittle ice wall hiding Trung's secret archive — attack to shatter!",
    },
  },
  {
    id: "ice_wall_cavern_west",
    x: 2330,
    y: 2050,
    w: 40,
    h: 170,
    maxHp: 240,
    hint: {
      vi: "Lối thông bí mật nối Hầm Băng tới Điện Phong Ấn — có thể phá bằng kỹ năng!",
      en: "Secret frozen passage connecting Caverns to Final Chamber!",
    },
  },
  {
    id: "ice_wall_catacomb_shortcut",
    x: 1126,
    y: 2290,
    w: 48,
    h: 40,
    maxHp: 180,
    hint: {
      vi: "Khe băng mỏng gần Cổng Thành dẫn thẳng vào Điện Ngầm.",
      en: "Thin ice fissure near Gate leading toward Deep Chamber.",
    },
  },
];

export const FROZEN_TOMB_INTERACTABLES: FrozenTombInteractableDef[] = [
  {
    id: "gate_self_bell",
    zoneId: "zone_1",
    x: 356,
    y: 2268,
    radius: 58,
    kind: "bell",
    heroIdRequired: null,
    docId: "doc_gate_bell",
    title: { vi: "Chiếc Chuông Tự Ngân Trên Cổng Thành", en: "Self-Ringing Gate Bell" },
    shortPrompt: { vi: "Lắng Nghe Chiếc Chuông Nhỏ", en: "Inspect Gate Bell" },
  },
  {
    id: "inn_frozen_ledger",
    zoneId: "zone_2",
    x: 305,
    y: 1475,
    radius: 64,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_inn_last_supper",
    title: { vi: "Bàn Ăn Băng Giá — Quán Trọ Đêm Đông", en: "Frozen Dining Table — Winter Inn" },
    shortPrompt: { vi: "Đọc Sổ Quán Trọ", en: "Read Inn Ledger" },
  },
  {
    id: "reverse_clock_house",
    zoneId: "zone_2",
    x: 955,
    y: 1265,
    radius: 66,
    kind: "clock",
    heroIdRequired: null,
    docId: "doc_reverse_clock",
    title: { vi: "Chiếc Đồng Hồ Chạy Ngược", en: "The Backwards-Running Clock" },
    shortPrompt: { vi: "Quan Sát Đồng Hồ Ngược", en: "Inspect Backwards Clock" },
  },
  {
    id: "apothecary_letter",
    zoneId: "zone_2",
    x: 290,
    y: 1110,
    radius: 58,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_apothecary_frost",
    title: { vi: "Thư Bỏ Dở Trong Tiệm Dược", en: "Unfinished Apothecary Letter" },
    shortPrompt: { vi: "Đọc Lá Thư Đóng Băng", en: "Read Frozen Letter" },
  },
  {
    id: "cathedral_bell",
    zoneId: "zone_3",
    x: 1800,
    y: 1165,
    radius: 68,
    kind: "bell",
    heroIdRequired: null,
    docId: "doc_cathedral_bell",
    title: { vi: "Quả Chuông Khổng Lồ Thánh Đường", en: "Cathedral Great Bell" },
    shortPrompt: { vi: "Chạm Vào Chuông Thánh Đường", en: "Touch Cathedral Bell" },
  },
  {
    id: "cathedral_ritual_notes",
    zoneId: "zone_3",
    x: 1800,
    y: 1455,
    radius: 64,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_sealing_ritual",
    title: { vi: "Bia Kinh Nghi Thức Phong Ấn", en: "Sealing Ritual Pedestal" },
    shortPrompt: { vi: "Đọc Ghi Chép Nghi Thức", en: "Read Ritual Pedestal" },
  },
  {
    id: "phong_faceless_statues",
    zoneId: "zone_3",
    x: 2110,
    y: 1185,
    radius: 64,
    kind: "ee",
    heroIdRequired: "phong",
    docId: "doc_phong_mirror",
    title: { vi: "Hàng Tượng Không Có Khuôn Mặt", en: "Row of Faceless Statues" },
    shortPrompt: { vi: "Quan Sát Tượng Không Mặt (Phong)", en: "Inspect Faceless Statues" },
  },
  {
    id: "phong_mirror_room",
    zoneId: "zone_3",
    x: 2265,
    y: 1035,
    radius: 64,
    kind: "ee",
    heroIdRequired: "phong",
    docId: "doc_phong_mirror",
    title: { vi: "Phòng Gương Sai Nhịp (Phong)", en: "Room of Unsynced Mirrors (Phong)" },
    shortPrompt: { vi: "Soi Gương Phòng Kín", en: "Inspect Mirror Reflection" },
  },
  {
    id: "graveyard_epitaph",
    zoneId: "zone_4",
    x: 520,
    y: 445,
    radius: 64,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_graveyard_names",
    title: { vi: "Bia Mộ Không Năm Sinh Tử", en: "Dateless Mass Grave Epitaph" },
    shortPrompt: { vi: "Đọc Bia Mộ Ngàn Người", en: "Read Mass Grave Epitaph" },
  },
  {
    id: "graveyard_standing_corpses",
    zoneId: "zone_4",
    x: 895,
    y: 255,
    radius: 62,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_standing_corpses",
    title: { vi: "Những Thi Thể Đứng Đóng Băng", en: "Frozen Standing Corpses" },
    shortPrompt: { vi: "Kiểm Tra Dấu Chân Biến Mất", en: "Inspect Vanishing Footprints" },
  },
  {
    id: "eohyen_painting",
    zoneId: "zone_5",
    x: 1860,
    y: 295,
    radius: 68,
    kind: "ee",
    heroIdRequired: "eohyen",
    docId: "doc_eohyen_painting",
    title: { vi: "Bức Tranh Ba Bóng Đen Bị Cào Rách", en: "Scraped Portrait of Three Shadows" },
    shortPrompt: { vi: "Chạm Vào Bức Tranh (Éo Hyên)", en: "Inspect Portrait" },
  },
  {
    id: "thanh_poison_vial",
    zoneId: "zone_5",
    x: 2140,
    y: 590,
    radius: 64,
    kind: "ee",
    heroIdRequired: "thanh",
    docId: "doc_thanh_vial",
    title: { vi: "Lọ Độc Dược Cạn Đáy (Thanh)", en: "Empty Poison Vial (Thanh)" },
    shortPrompt: { vi: "Kiểm Tra Lọ Độc Cổ", en: "Inspect Empty Vial" },
  },
  {
    id: "trung_palace_archive",
    zoneId: "zone_5",
    x: 2960,
    y: 360,
    radius: 72,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_trung_palace_file",
    title: { vi: "Hồ Sơ Nghiên Cứu Kín Của Trung", en: "Trung's Sealed Palace Archive" },
    shortPrompt: { vi: "Đọc Hồ Sơ Thí Nghiệm Ngầm", en: "Read Sealed Archive" },
  },
  {
    id: "whispering_ice_blocks",
    zoneId: "zone_6",
    x: 2860,
    y: 1295,
    radius: 68,
    kind: "doc",
    heroIdRequired: null,
    docId: "doc_cavern_specimens",
    title: { vi: "Khối Băng Giam Sinh Vật Dị Dạng", en: "Ice Monolith with Distorted Shapes" },
    shortPrompt: { vi: "Lắng Nghe Tiếng Thì Thầm Trong Băng", en: "Listen to Ice Monolith" },
  },
  {
    id: "frozen_research_device",
    zoneId: "zone_6",
    x: 3060,
    y: 1845,
    radius: 74,
    kind: "device",
    heroIdRequired: null,
    docId: "doc_linked_experiments",
    title: { vi: "Thiết Bị Nghiên Cứu Đóng Băng (Liên Kết Map 2)", en: "Frozen Research Device (Map 2 Link)" },
    shortPrompt: { vi: "Kích Hoạt Thiết Bị Nghiên Cứu", en: "Activate Research Device" },
  },
  {
    id: "minh_frozen_dossier",
    zoneId: "zone_7",
    x: 1465,
    y: 2565,
    radius: 68,
    kind: "ee",
    heroIdRequired: "minh",
    docId: "doc_minh_seal",
    title: { vi: "Tập Hồ Sơ Bọc Băng (Minh)", en: "Icebound Seal Dossier (Minh)" },
    shortPrompt: { vi: "Mở Hồ Sơ Phong Ấn Của Minh", en: "Inspect Seal Dossier" },
  },
  {
    id: "final_seal_coffin",
    zoneId: "zone_7",
    x: 1750,
    y: 2320,
    radius: 108,
    kind: "boss_seal",
    heroIdRequired: null,
    title: { vi: "Khối Băng Quan Tài Trung Tâm", en: "Central Ice Coffin Seal" },
    shortPrompt: { vi: "Chạm Vào Khối Băng Quan Tài", en: "Confront the Ice Coffin" },
  },
  {
    id: "ending_ice_shard",
    zoneId: "zone_7",
    x: 1750,
    y: 2445,
    radius: 66,
    kind: "ending_shard",
    heroIdRequired: null,
    docId: "doc_ending_shard",
    title: { vi: "Mảnh Băng Khắc Ký Hiệu Lạ", en: "Ice Shard Bearing Arcane Symbol" },
    shortPrompt: { vi: "Nhặt Mảnh Băng Sau Trận Chiến", en: "Examine Dropped Ice Shard" },
  },
];

export const FROZEN_TOMB_DOCS: Record<string, FrozenTombDocEntry> = {
  doc_gate_bell: {
    id: "doc_gate_bell",
    code: "BM-01",
    zoneId: "zone_1",
    category: "diary",
    title: { vi: "Nhật Ký Lính Gác Cổng Thành", en: "Gatekeeper's Frozen Journal" },
    subtitle: { vi: "CỔNG THÀNH BĂNG GIÁ · TRƯỚC ĐÊM PHONG ẤN", en: "FROZEN GATE · EVE OF THE SEAL" },
    paragraphs: [
      {
        vi: "“Chiếc chuông đồng nhỏ ngoài cổng vẫn tự ngân lên mỗi khi gió Bắc thổi qua, dù dây kéo đã đứt lìa từ ba trăm năm trước.”",
        en: "“The small bronze gate bell still chimes on northern gusts, though its pull-cord snapped three centuries ago.”",
      },
      {
        vi: "“Ca gác cuối ghi lại một bóng người đứng trên đỉnh tường thành quay mặt vào trong — đến khi đội tuần tra chạy lên, mặt tuyết trên thành không hề có dấu chân.”",
        en: "“The final watch logged a silhouette standing atop the rampart facing inward — yet when guards climbed up, the snow bore zero footprints.”",
      },
    ],
  },
  doc_inn_last_supper: {
    id: "doc_inn_last_supper",
    code: "BM-02",
    zoneId: "zone_2",
    category: "diary",
    title: { vi: "Sổ Quán Trọ Đêm Đông", en: "Winter Inn Ledger" },
    subtitle: { vi: "PHỐ CỔ VĨNH ĐÔNG · NHỮNG VỊ KHÁCH NGỒI BÊN BÀN ĂN", en: "OLD TOWN · FROZEN DINERS" },
    paragraphs: [
      {
        vi: "Các thi thể vẫn ngồi ngay ngắn quanh bàn gỗ dưới ánh đèn xanh nhợt nhạt — bát súp chưa cạn, nét mặt không hề hoảng loạn như thể cái chết ập xuống nhanh hơn một cái chớp mắt.",
        en: "Seated around wooden tables bathed in pale blue lantern light, their expressions carry zero panic — as if frost overtook them between heartbeats.",
      },
      {
        vi: "Trang cuối sổ viết nguệch ngoạc: “Đừng nhìn lên cửa sổ tầng hai. Những người gõ kính ban đêm không còn là hàng xóm của chúng ta nữa.”",
        en: "The final ledger line warns: “Do not look at second-floor windows. Whatever taps on the glass at night is no longer our neighbors.”",
      },
    ],
  },
  doc_reverse_clock: {
    id: "doc_reverse_clock",
    code: "BM-03",
    zoneId: "zone_2",
    category: "letter",
    title: { vi: "Ghi Chú Dưới Chiếc Đồng Hồ Chạy Ngược", en: "Note Beneath the Backwards Clock" },
    subtitle: { vi: "PHỐ CỔ VĨNH ĐÔNG · NGÔI NHÀ KỲ LẠ", en: "OLD TOWN · ANOMALY RESIDENCE" },
    paragraphs: [
      {
        vi: "Kim đồng hồ bằng đồng vẫn nhích ngược từng giây một, phát ra tiếng tích tắc lạnh lẽo vang khắp căn nhà bỏ hoang.",
        en: "The brass clock hands still tick steadily counter-clockwise through the abandoned wooden house.",
      },
      {
        vi: "“Từ ngày đội khảo sát của Trung mang khối mẫu từ dưới lòng đất lên, đồng hồ trong nhà bắt đầu chạy lùi. Nó không đếm thời gian trôi đi — nó đang đếm ngược tới lúc thứ bên dưới tỉnh dậy.”",
        en: "“Ever since Trung's team brought that specimen up from below, the clock runs in reverse. It isn't counting time passing — it's counting back to when whatever sleeps beneath wakes up.”",
      },
    ],
  },
  doc_apothecary_frost: {
    id: "doc_apothecary_frost",
    code: "BM-04",
    zoneId: "zone_2",
    category: "letter",
    title: { vi: "Lá Thư Bỏ Dở Trong Tiệm Dược", en: "Unfinished Apothecary Letter" },
    subtitle: { vi: "PHỐ CỔ VĨNH ĐÔNG · DẤU VẾT ĐỘC DƯỢC", en: "OLD TOWN · POISON TRACES" },
    paragraphs: [
      {
        vi: "“Kẻ mặc áo choàng tối đã mua sạch tinh chất làm tê liệt linh mạch trước đêm đại lễ. Hắn trả bằng vàng cổ nhưng để lại mùi nọc rắn xanh rất gắt.”",
        en: "“A dark-cloaked buyer cleared out every nerve-numbing reagent before the ceremony night, leaving behind the sharp stench of green serpent venom.”",
      },
    ],
  },
  doc_cathedral_bell: {
    id: "doc_cathedral_bell",
    code: "BM-05",
    zoneId: "zone_3",
    category: "ritual",
    title: { vi: "Khắc Văn Quả Chuông Câm", en: "Inscription on the Silent Bell" },
    subtitle: { vi: "THÁNH ĐƯỜNG CHUÔNG CÂM · ÂM VANG GỌI HỒN", en: "CATHEDRAL · SPECTRAL TOLL" },
    paragraphs: [
      {
        vi: "“Quả chuông này từng được đúc để báo hiệu nghi thức phong ấn hoàn tất. Nhưng khi nghi thức bị tráo đổi giữa chừng, tiếng chuông lại trở thành vết nứt đánh thức những linh hồn bị chôn.”",
        en: "“Cast to proclaim the completed seal, the great bell turned into a fracture calling forth buried ghosts once the ritual was hijacked mid-chant.”",
      },
    ],
  },
  doc_sealing_ritual: {
    id: "doc_sealing_ritual",
    code: "BM-06",
    zoneId: "zone_3",
    category: "ritual",
    title: { vi: "Bia Kinh Nghi Thức Phong Ấn", en: "Sealing Ritual Pedestal" },
    subtitle: { vi: "THÁNH ĐƯỜNG CHUÔNG CÂM · MẢNH GHÉP NGHI LỄ", en: "CATHEDRAL · BROKEN RITE" },
    paragraphs: [
      {
        vi: "“Nghi thức gốc yêu cầu một Pháp Sư Hàn Băng thuần khiết giữ lõi phong ấn sống — Éo Hyên đã bước vào vòng tròn tự nguyện để đóng băng cơn ác mộng.”",
        en: "“The original rite required a pure Frost Mage to anchor the living seal — Éo Hyên stepped into the circle willingly.”",
      },
      {
        vi: "“Nhưng chén thánh bị nhiễm độc khiến nàng gục ngã đúng khắc thứ ba. Minh bước lên thay thế, đóng sập toàn bộ vương quốc xuống dưới tầng băng vĩnh cửu.”",
        en: "“Poison in the chalice felled her on the third chime. Minh seized control in her stead, burying the entire kingdom beneath eternal ice.”",
      },
    ],
  },
  doc_phong_mirror: {
    id: "doc_phong_mirror",
    code: "EE-02",
    zoneId: "zone_3",
    category: "diary",
    heroTag: "Phong",
    title: { vi: "Bí Mật Của Phong — Những Kẻ Không Có Khuôn Mặt", en: "Phong's Secret — The Faceless Ones" },
    subtitle: { vi: "EASTER EGG #2 · PHÒNG GƯƠNG THÁNH ĐƯỜNG", en: "EASTER EGG #2 · CATHEDRAL MIRROR ROOM" },
    paragraphs: [
      {
        vi: "“Ta đã tạo ra những hình ảnh để che giấu sự thật. Nhưng có những thứ không cần hình dạng vẫn có thể nhìn thấy chúng ta.”",
        en: "“I forged illusions to conceal the truth. Yet some things need no form to see right through us.”",
      },
      {
        vi: "Phong: “Ta đã xóa dấu vết của hắn... nhưng không thể xóa những gì ta đã nhìn thấy.”",
        en: "Phong: “I erased his tracks... yet I could never erase what I witnessed.”",
      },
    ],
  },
  doc_graveyard_names: {
    id: "doc_graveyard_names",
    code: "BM-07",
    zoneId: "zone_4",
    category: "diary",
    title: { vi: "Bia Đá Nghĩa Địa Ngàn Người", en: "Graveyard of a Thousand Stone" },
    subtitle: { vi: "NGHĨA ĐỊA NGÀN NGƯỜI · ĐÊM KHÔNG TANG LỄ", en: "GRAVEYARD · NO FUNERAL" },
    paragraphs: [
      {
        vi: "Hàng trăm bia mộ được khắc cùng một ngày, nhưng nhiều ngôi mộ đã nứt toác từ bên trong, hắt ra thứ ánh sáng xanh lạnh lẽo.",
        en: "Hundreds of headstones share a single date, many cracked open from inside, spilling pale cyan light.",
      },
      {
        vi: "Một số thi thể không nằm dưới đất mà đứng thẳng giữa băng — hướng mắt cùng nhìn về phía Cung Điện Phong Ấn.",
        en: "Frozen corpses stand upright inside pillars of ice, all staring silently toward the Palace of Sealing.",
      },
    ],
  },
  doc_standing_corpses: {
    id: "doc_standing_corpses",
    code: "BM-08",
    zoneId: "zone_4",
    category: "diary",
    title: { vi: "Ghi Chép Về Dấu Chân Không Bóng", en: "Record of Shadowless Walkers" },
    subtitle: { vi: "NGHĨA ĐỊA NGÀN NGƯỜI · HIỆN TƯỢNG LẠ", en: "GRAVEYARD · ANOMALY" },
    paragraphs: [
      {
        vi: "Dấu chân in mới trên tuyết kéo dài mười bước rồi biến mất đột ngột giữa khoảng trống — dù gió bão chưa kịp thổi lấp.",
        en: "Fresh footprints cross the snow for ten paces before ending abruptly in empty air.",
      },
    ],
  },
  doc_eohyen_painting: {
    id: "doc_eohyen_painting",
    code: "EE-01",
    zoneId: "zone_5",
    category: "ritual",
    heroTag: "Éo Hyên",
    title: { vi: "Người Đứng Sau Lớp Băng", en: "The One Behind the Ice" },
    subtitle: { vi: "EASTER EGG #1 · BỨC TRANH TRONG CUNG ĐIỆN", en: "EASTER EGG #1 · PALACE PORTRAIT" },
    paragraphs: [
      {
        vi: "Bức tranh bị cào xước để lộ hình ảnh một người phụ nữ bị những vòng băng siết chặt giữa trung tâm nghi thức. Tiếng thì thầm vang lên: “Ngươi vẫn còn nhớ ta chứ?”",
        en: "Beneath the scratches, the portrait glows blue: a woman bound in ice rings whispers, “Do you still remember me?”",
      },
      {
        vi: "Éo Hyên: “Ta đã từng đứng ở đây... nhưng tại sao ta không thể nhớ mình đã làm gì?”",
        en: "Éo Hyên: “I stood here once... yet why can I no longer remember what I did?”",
      },
    ],
  },
  doc_thanh_vial: {
    id: "doc_thanh_vial",
    code: "EE-04",
    zoneId: "zone_5",
    category: "ritual",
    heroTag: "Thanh",
    title: { vi: "Thanh Đã Đến Đây", en: "Thanh Was Here" },
    subtitle: { vi: "EASTER EGG #4 · LỌ ĐỘC DƯỢC TRONG PHÒNG NGHI THỨC", en: "EASTER EGG #4 · RITUAL POISON VIAL" },
    paragraphs: [
      {
        vi: "Hồi ức hiện lên trong băng: Éo Hyên đứng giữa vòng tròn phong ấn, phía sau là bóng dáng Thanh cùng con rắn xanh nhỏ giọt độc vào vật phát sáng.",
        en: "A frozen flashback reveals Éo Hyên inside the sealing circle while Thanh stands behind with a green serpent dripping poison into the glowing focus.",
      },
      {
        vi: "Thanh: “Đừng trách ta. Ngươi không biết thứ mình định giải phóng là gì.”",
        en: "Thanh: “Do not blame me. You have no idea what you were about to set free.”",
      },
    ],
  },
  doc_trung_palace_file: {
    id: "doc_trung_palace_file",
    code: "BM-09",
    zoneId: "zone_5",
    category: "dossier",
    heroTag: "Trung",
    title: { vi: "Phòng Bí Mật Của Trung — Dự Án Dưới Lớp Băng", en: "Trung's Secret Room — Sub-Glacial Project" },
    subtitle: { vi: "CUNG ĐIỆN PHONG ẤN · MẬT THẤT TỐI MẬT", en: "PALACE OF SEALING · CLASSIFIED ROOM" },
    paragraphs: [
      {
        vi: "Các bản vẽ chồng chéo mô tả một thực thể không có hình dạng ổn định, có khả năng ăn mòn ký ức và thay thế ý thức của những kẻ tiếp xúc gần.",
        en: "Layered blueprints outline an unstable entity capable of eroding memory and rewriting consciousness on proximity.",
      },
      {
        vi: "Dòng ghi chú tay của Trung bị cắt ngang: “Ngay cả ta cũng không chắc thứ đang trả lời dưới tầng hầm có còn là sản phẩm ta tạo ra hay không...”",
        en: "Trung's handwritten margin stops abruptly: “Even I am no longer certain whether what answers from beneath is still what I created...”",
      },
    ],
  },
  doc_cavern_specimens: {
    id: "doc_cavern_specimens",
    code: "BM-10",
    zoneId: "zone_6",
    category: "dossier",
    title: { vi: "Khối Băng Thì Thầm Trong Hầm Sâu", en: "Whispering Ice Monoliths" },
    subtitle: { vi: "HẦM BĂNG DƯỚI LÒNG ĐẤT · VÙNG TỐI TÍM", en: "SUBTERRANEAN CAVERNS · DEEP VIOLET ZONE" },
    paragraphs: [
      {
        vi: "Bên trong các khối băng trong mờ không chỉ có lính gác hoàng gia mà còn có những bóng hình dị dạng với quá nhiều cánh tay cong vẹo.",
        en: "Inside translucent glacial blocks lie both royal guards and warped silhouettes with too many limbs shifting faintly in purple glow.",
      },
    ],
  },
  doc_linked_experiments: {
    id: "doc_linked_experiments",
    code: "EE-05",
    zoneId: "zone_6",
    category: "audio",
    heroTag: "Liên Kết Map 2 × Map 3",
    title: { vi: "Băng Ghi Âm Thiết Bị Đóng Băng", en: "Frozen Research Device Audio Log" },
    subtitle: { vi: "EASTER EGG #5 · MỐI LIÊN KẾT VỚI HỎA NGỤC TÀN TRO", en: "EASTER EGG #5 · INFERNO OF ASHES LINK" },
    paragraphs: [
      {
        vi: "“Thí nghiệm thứ nhất: phản ứng của Ma Thạch với máu đã được xác nhận.” · “Thí nghiệm thứ hai: ký ức và ý thức có thể bị biến đổi.” · “Thí nghiệm thứ ba: một vật chủ có thể bị phong ấn cùng thực thể.”",
        en: "“Experiment One: Ma Thach reaction with blood confirmed.” · “Experiment Two: memory and consciousness can be altered.” · “Experiment Three: a host can be sealed alongside the entity.”",
      },
      {
        vi: "Giọng Trung: “Thú vị thật... các ngươi vẫn nghĩ đây là những sự kiện riêng biệt sao? Thành phố ấy, vương quốc này... tất cả chỉ là những phần khác nhau của cùng một câu chuyện.”",
        en: "Trung: “How amusing... you still thought these were separate tragedies? That city, this kingdom... all merely chapters of the same story.”",
      },
    ],
  },
  doc_minh_seal: {
    id: "doc_minh_seal",
    code: "EE-03",
    zoneId: "zone_7",
    category: "dossier",
    heroTag: "Minh",
    title: { vi: "Bí Mật Của Minh — Quyết Định Đóng Cánh Cửa", en: "Minh's Secret — Closing the Door" },
    subtitle: { vi: "EASTER EGG #3 · ĐIỆN PHONG ẤN CUỐI CÙNG", en: "EASTER EGG #3 · FINAL SEALING CHAMBER" },
    paragraphs: [
      {
        vi: "“Nếu ta không đóng cánh cửa ấy, thứ bên dưới sẽ bước ra. Ta biết sẽ có người phải chết. Ta biết nàng sẽ không tha thứ cho ta. Nhưng ta không còn lựa chọn.”",
        en: "“If I had not shut that door, what waits beneath would have stepped out. I knew lives would be lost. I knew she would never forgive me. Yet I had no choice.”",
      },
      {
        vi: "Minh: “Ta không cứu được vương quốc này. Ta chỉ ngăn nó trở thành một thứ còn tồi tệ hơn.”",
        en: "Minh: “I did not save this kingdom. I only stopped it from becoming something far worse.”",
      },
    ],
  },
  doc_ending_shard: {
    id: "doc_ending_shard",
    code: "BM-END",
    zoneId: "zone_7",
    category: "ritual",
    title: { vi: "Mảnh Băng Khắc Ký Hiệu Cầu Ma Thuật", en: "Ice Shard Bearing Arcane Symbol" },
    subtitle: { vi: "KẾT THÚC BĂNG MỘ VĨNH CỬU · SỰ TRỐNG RỖNG", en: "FROZEN TOMB ENDING · THE EMPTY VOID" },
    paragraphs: [
      {
        vi: "Khối băng quan tài nứt toác để lộ khoảng không trống rỗng bên trong. Mảnh băng rơi lại mang ký hiệu giống hệt Quả Cầu Ma Thuật ở Map 2.",
        en: "The ice coffin splits open to reveal only an empty void. A fallen ice shard bears the exact symbol of Map 2's Arcane Orb.",
      },
      {
        vi: "“BĂNG CHỈ GIỮ ĐƯỢC NHỮNG THỨ CHƯA THỂ CHẾT.”",
        en: "“ICE CAN ONLY HOLD WHAT CANNOT DIE.”",
      },
    ],
  },
};

export const FROZEN_TOMB_ICE_PATCHES: FrozenTombIcePatch[] = [
  { id: "ip_1", x: 480, y: 2040, rx: 145, ry: 78, angle: -0.15 },
  { id: "ip_2", x: 640, y: 1580, rx: 165, ry: 95, angle: 0.25 },
  { id: "ip_3", x: 1800, y: 1365, rx: 170, ry: 120, angle: 0 },
  { id: "ip_4", x: 560, y: 420, rx: 155, ry: 85, angle: -0.3 },
  { id: "ip_5", x: 1880, y: 480, rx: 190, ry: 95, angle: 0.1 },
  { id: "ip_6", x: 2820, y: 1350, rx: 155, ry: 105, angle: -0.2 },
  { id: "ip_7", x: 1750, y: 2320, rx: 220, ry: 145, angle: 0 },
];

export const FROZEN_TOMB_RUNE_PILLARS = [
  { x: 1511, y: 2111 },
  { x: 1991, y: 2111 },
  { x: 1511, y: 2531 },
  { x: 1991, y: 2531 },
];

export function createDefaultFrozenTombProgress(): FrozenTombProgressState {
  return {
    eohyenPaintingSeen: false,
    phongMirrorClue: false,
    minhSealClue: false,
    thanhVialClue: false,
    linkedDeviceTriggered: false,
    introNarrativeSeen: false,
    chamberWarningSeen: false,
    endingShardSeen: false,
    bossDefeatedEmptyVoid: false,
    collectedDocs: [],
    inspectedNodes: [],
    destroyedWalls: [],
  };
}

export function normalizeFrozenTombProgress(raw: unknown): FrozenTombProgressState {
  const base = createDefaultFrozenTombProgress();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const validDocs = new Set(Object.keys(FROZEN_TOMB_DOCS));
  const validNodes = new Set<FrozenTombInteractableId>(FROZEN_TOMB_INTERACTABLES.map((n) => n.id));
  const validWalls = new Set(FROZEN_TOMB_DESTRUCTIBLES.map((w) => w.id));

  return {
    eohyenPaintingSeen: Boolean(r.eohyenPaintingSeen),
    phongMirrorClue: Boolean(r.phongMirrorClue),
    minhSealClue: Boolean(r.minhSealClue),
    thanhVialClue: Boolean(r.thanhVialClue),
    linkedDeviceTriggered: Boolean(r.linkedDeviceTriggered),
    introNarrativeSeen: Boolean(r.introNarrativeSeen),
    chamberWarningSeen: Boolean(r.chamberWarningSeen),
    endingShardSeen: Boolean(r.endingShardSeen),
    bossDefeatedEmptyVoid: Boolean(r.bossDefeatedEmptyVoid),
    collectedDocs: Array.isArray(r.collectedDocs)
      ? Array.from(new Set(r.collectedDocs.filter((x): x is string => typeof x === "string" && validDocs.has(x))))
      : [],
    inspectedNodes: Array.isArray(r.inspectedNodes)
      ? Array.from(
          new Set(
            r.inspectedNodes.filter(
              (x): x is FrozenTombInteractableId => typeof x === "string" && validNodes.has(x as FrozenTombInteractableId)
            )
          )
        )
      : [],
    destroyedWalls: Array.isArray(r.destroyedWalls)
      ? Array.from(new Set(r.destroyedWalls.filter((x): x is string => typeof x === "string" && validWalls.has(x))))
      : [],
  };
}

export function mergeFrozenTombProgress(a: unknown, b: unknown): FrozenTombProgressState {
  const pa = normalizeFrozenTombProgress(a);
  const pb = normalizeFrozenTombProgress(b);
  return {
    eohyenPaintingSeen: pa.eohyenPaintingSeen || pb.eohyenPaintingSeen,
    phongMirrorClue: pa.phongMirrorClue || pb.phongMirrorClue,
    minhSealClue: pa.minhSealClue || pb.minhSealClue,
    thanhVialClue: pa.thanhVialClue || pb.thanhVialClue,
    linkedDeviceTriggered: pa.linkedDeviceTriggered || pb.linkedDeviceTriggered,
    introNarrativeSeen: pa.introNarrativeSeen || pb.introNarrativeSeen,
    chamberWarningSeen: pa.chamberWarningSeen || pb.chamberWarningSeen,
    endingShardSeen: pa.endingShardSeen || pb.endingShardSeen,
    bossDefeatedEmptyVoid: pa.bossDefeatedEmptyVoid || pb.bossDefeatedEmptyVoid,
    collectedDocs: Array.from(new Set([...pa.collectedDocs, ...pb.collectedDocs])),
    inspectedNodes: Array.from(new Set([...pa.inspectedNodes, ...pb.inspectedNodes])),
    destroyedWalls: Array.from(new Set([...pa.destroyedWalls, ...pb.destroyedWalls])),
  };
}

export function hasCompletedMap2Links(infernoProgress: Partial<InfernoProgressState> | unknown): {
  dungReady: boolean;
  longhoiReady: boolean;
  fourChairsReady: boolean;
  allReady: boolean;
} {
  const inf = normalizeInfernoProgress(infernoProgress);
  const dungReady = Boolean(inf.dungClue || inf.collectedDocs.includes("doc_dung_chains"));
  const longhoiReady = Boolean(inf.longhoiClue || inf.collectedDocs.includes("doc_longhoi_log"));
  const fourChairsReady = Boolean(
    inf.collectedDocs.includes("doc_four_chairs_letters") ||
      inf.fourChairsUnlocked ||
      inf.trungTriggered ||
      inf.danhClue
  );
  return {
    dungReady,
    longhoiReady,
    fourChairsReady,
    allReady: dungReady && longhoiReady && fourChairsReady,
  };
}

export function hasCompletedMap3Links(progress: Partial<FrozenTombProgressState> | unknown): {
  minhReady: boolean;
  phongReady: boolean;
  thanhReady: boolean;
  allReady: boolean;
} {
  const p = normalizeFrozenTombProgress(progress);
  const minhReady = Boolean(p.minhSealClue);
  const phongReady = Boolean(p.phongMirrorClue);
  const thanhReady = Boolean(p.thanhVialClue);
  return {
    minhReady,
    phongReady,
    thanhReady,
    allReady: minhReady && phongReady && thanhReady,
  };
}

export function getFrozenTombZoneAt(x: number, y: number): FrozenTombZoneDef {
  if (x < 1150 && y >= 1850) return FROZEN_TOMB_ZONES[0];
  if (x >= 1150 && x < 2350 && y >= 1850) return FROZEN_TOMB_ZONES[6];
  if (x < 1250 && y >= 920 && y < 1850) return FROZEN_TOMB_ZONES[1];
  if (x >= 1250 && x < 2350 && y >= 920 && y < 1850) return FROZEN_TOMB_ZONES[2];
  if (x < 1350 && y < 920) return FROZEN_TOMB_ZONES[3];
  if (x >= 1350 && y < 920) return FROZEN_TOMB_ZONES[4];
  return FROZEN_TOMB_ZONES[5];
}

export function isPointOnFrozenIcePatch(x: number, y: number): boolean {
  for (const patch of FROZEN_TOMB_ICE_PATCHES) {
    const dx = x - patch.x;
    const dy = y - patch.y;
    const cos = Math.cos(-patch.angle);
    const sin = Math.sin(-patch.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if ((lx * lx) / (patch.rx * patch.rx) + (ly * ly) / (patch.ry * patch.ry) <= 1) {
      return true;
    }
  }
  return false;
}

export function createInitialFrozenTombRuntimeState(
  progress?: Partial<FrozenTombProgressState>
): FrozenTombRuntimeState {
  const norm = normalizeFrozenTombProgress(progress);
  const destroyedSet = new Set(norm.destroyedWalls);
  return {
    mapId: "frozen_tomb",
    blizzardState: "calm",
    blizzardTimer: 11,
    blizzardIntensity: 0.12,
    bellCooldown: 14,
    bellShakeTimer: 0,
    crackedIceZones: [
      { id: "crack_gate", x: 480, y: 1960, radius: 74, state: "stable", timer: 0, eohyenFrozenTimer: 0, didHit: false },
      { id: "crack_town", x: 640, y: 1480, radius: 78, state: "stable", timer: 0, eohyenFrozenTimer: 0, didHit: false },
      { id: "crack_cath", x: 1800, y: 1580, radius: 76, state: "stable", timer: 0, eohyenFrozenTimer: 0, didHit: false },
      { id: "crack_grave", x: 650, y: 420, radius: 80, state: "stable", timer: 0, eohyenFrozenTimer: 0, didHit: false },
      { id: "crack_palace", x: 1890, y: 540, radius: 78, state: "stable", timer: 0, eohyenFrozenTimer: 0, didHit: false },
      { id: "crack_cavern", x: 2740, y: 1750, radius: 82, state: "stable", timer: 0, eohyenFrozenTimer: 0, didHit: false },
    ],
    iceHandsHazards: [
      { id: "hands_town", x: 560, y: 1220, radius: 66, state: "cooldown", timer: 3.5, cooldownDuration: 7.5, didRoot: false },
      { id: "hands_grave1", x: 410, y: 360, radius: 68, state: "cooldown", timer: 2.0, cooldownDuration: 6.8, didRoot: false },
      { id: "hands_grave2", x: 830, y: 480, radius: 68, state: "cooldown", timer: 5.0, cooldownDuration: 7.0, didRoot: false },
      { id: "hands_cavern", x: 2880, y: 1540, radius: 72, state: "cooldown", timer: 4.2, cooldownDuration: 7.2, didRoot: false },
      { id: "hands_chamber", x: 1580, y: 2320, radius: 70, state: "cooldown", timer: 4.6, cooldownDuration: 7.6, didRoot: false },
    ],
    sealingRemnants: [
      { id: "remnant_palace", x: 2040, y: 560, radius: 88, phase: 0, exposureSec: 0, tickCd: 0 },
      { id: "remnant_cavern1", x: 2860, y: 1880, radius: 98, phase: 1.4, exposureSec: 0, tickCd: 0 },
      { id: "remnant_cavern2", x: 2920, y: 2180, radius: 94, phase: 2.6, exposureSec: 0, tickCd: 0 },
      { id: "remnant_chamber_e", x: 1945, y: 2320, radius: 92, phase: 3.1, exposureSec: 0, tickCd: 0 },
    ],
    ghostAmbushZones: [
      { id: "ghost_town", zoneId: "zone_2", x: 640, y: 1520, triggerRadius: 170, spawnRadius: 145, state: "armed", timer: 0 },
      { id: "ghost_cath", zoneId: "zone_3", x: 1800, y: 1350, triggerRadius: 185, spawnRadius: 155, state: "armed", timer: 0 },
      { id: "ghost_grave", zoneId: "zone_4", x: 620, y: 410, triggerRadius: 195, spawnRadius: 160, state: "armed", timer: 0 },
      { id: "ghost_cavern", zoneId: "zone_6", x: 2820, y: 1620, triggerRadius: 180, spawnRadius: 155, state: "armed", timer: 0 },
    ],
    destructibles: FROZEN_TOMB_DESTRUCTIBLES.map((d) => ({
      ...d,
      hp: destroyedSet.has(d.id) ? 0 : d.maxHp,
      destroyed: destroyedSet.has(d.id),
      hitFlash: 0,
      frostCrackPct: 0,
    })),
    phantoms: [
      {
        kind: "rampart_watcher",
        x: 655,
        y: 2175,
        targetX: 655,
        targetY: 2175,
        life: 0,
        maxLife: 9999,
        alpha: 0.85,
      },
      {
        kind: "window_ghost",
        x: 310,
        y: 1345,
        targetX: 310,
        targetY: 1345,
        life: 0,
        maxLife: 9999,
        alpha: 0.72,
      },
    ],
    bellRipples: [],
    ghostFootprints: [],
    frostSpikes: [],
    staticDistortionIntensity: 0,
    darknessPulseSec: 0,
    rampartWatcherDismissed: false,
    bossSpawnedThisRun: false,
    bossDefeatedThisRun: Boolean(norm.bossDefeatedEmptyVoid),
    endingShardSpawned: Boolean(norm.bossDefeatedEmptyVoid),
    eohyenResonanceBannerTimer: 0,
    lastDiscoveryToast: null,
    lastDiscoveryTimer: 0,
    trungAudioSilenceSec: 0,
  };
}

export function getActiveFrozenTombObstacles(
  runtime: FrozenTombRuntimeState | null | undefined
): FrozenTombRectObstacle[] {
  const list: FrozenTombRectObstacle[] = [...FROZEN_TOMB_STATIC_OBSTACLES];
  if (runtime?.destructibles) {
    for (const d of runtime.destructibles) {
      if (!d.destroyed) {
        list.push({
          id: d.id,
          x: d.x,
          y: d.y,
          w: d.w,
          h: d.h,
          kind: "brittle_ice_wall",
          label: d.hint.vi,
          destructibleId: d.id,
        });
      }
    }
  }
  return list;
}

export function damageFrozenTombDestructibleWalls(
  runtime: FrozenTombRuntimeState | null | undefined,
  progress: FrozenTombProgressState,
  x: number,
  y: number,
  radius: number,
  damage: number,
  isEohyenFrost = false
): {
  nextProgress: FrozenTombProgressState;
  destroyedWalls: FrozenTombDestructibleRuntime[];
  hitAny: boolean;
} {
  const nextProg = normalizeFrozenTombProgress(progress);
  const destroyedWalls: FrozenTombDestructibleRuntime[] = [];
  let hitAny = false;
  if (!runtime?.destructibles) return { nextProgress: nextProg, destroyedWalls, hitAny };

  const dmgMult = isEohyenFrost ? 1.85 : 1;
  for (const wall of runtime.destructibles) {
    if (wall.destroyed) continue;
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    if (Math.hypot(x - closestX, y - closestY) <= radius + 14) {
      hitAny = true;
      wall.hp = Math.max(0, wall.hp - Math.max(12, Math.round(damage * dmgMult)));
      wall.hitFlash = 0.25;
      if (wall.hp <= 0) {
        wall.destroyed = true;
        if (!nextProg.destroyedWalls.includes(wall.id)) {
          nextProg.destroyedWalls.push(wall.id);
        }
        destroyedWalls.push(wall);
      }
    }
  }
  return { nextProgress: nextProg, destroyedWalls, hitAny };
}

export function triggerEohyenFrozenTombReaction(
  runtime: FrozenTombRuntimeState | null | undefined,
  progress: FrozenTombProgressState,
  x: number,
  y: number,
  radius: number,
  skillIdx: number
): {
  nextProgress: FrozenTombProgressState;
  stabilizedCracks: number;
  destroyedWalls: FrozenTombDestructibleRuntime[];
  calmedPhantoms: number;
} {
  const nextProg = normalizeFrozenTombProgress(progress);
  if (!runtime) {
    return { nextProgress: nextProg, stabilizedCracks: 0, destroyedWalls: [], calmedPhantoms: 0 };
  }

  let stabilizedCracks = 0;
  for (const cr of runtime.crackedIceZones) {
    if (Math.hypot(x - cr.x, y - cr.y) <= cr.radius + radius + 36) {
      cr.state = "stable";
      cr.timer = 0;
      cr.eohyenFrozenTimer = Math.max(cr.eohyenFrozenTimer, skillIdx === 2 ? 7.5 : 4.8);
      stabilizedCracks++;
    }
  }

  const wallSmash = damageFrozenTombDestructibleWalls(
    runtime,
    nextProg,
    x,
    y,
    radius + 24,
    skillIdx === 2 ? 180 : 110,
    true
  );

  // Add subtle ice spire resonance marks where Éo Hyên casts on Map 3
  if (runtime.frostSpikes.length < 36) {
    const spikeCount = skillIdx === 2 ? 4 : 2;
    for (let i = 0; i < spikeCount; i++) {
      const ang = (Math.PI * 2 * i) / spikeCount + (x + y) * 0.01;
      runtime.frostSpikes.push({
        x: x + Math.cos(ang) * Math.min(48, radius * 0.45),
        y: y + Math.sin(ang) * Math.min(48, radius * 0.45),
        angle: ang,
        height: 16 + skillIdx * 4,
        life: 0,
        maxLife: 4.5,
        fromEohyen: true,
      });
    }
  }

  let calmedPhantoms = 0;
  for (const hz of runtime.iceHandsHazards) {
    if (hz.state === "telegraph" && Math.hypot(x - hz.x, y - hz.y) <= hz.radius + radius + 32) {
      hz.state = "cooldown";
      hz.timer = hz.cooldownDuration;
      calmedPhantoms++;
    }
  }

  if (stabilizedCracks > 0 || calmedPhantoms > 0) {
    runtime.eohyenResonanceBannerTimer = 2.6;
  }

  return {
    nextProgress: wallSmash.nextProgress,
    stabilizedCracks,
    destroyedWalls: wallSmash.destroyedWalls,
    calmedPhantoms,
  };
}

export function findNearestFrozenTombInteractable(
  px: number,
  py: number,
  progress?: Partial<FrozenTombProgressState>,
  runtime?: FrozenTombRuntimeState | null,
  maxOffset = 34
): FrozenTombInteractableDef | null {
  const norm = normalizeFrozenTombProgress(progress);
  const shardVisible = Boolean(norm.bossDefeatedEmptyVoid || runtime?.bossDefeatedThisRun || runtime?.endingShardSpawned);
  let best: FrozenTombInteractableDef | null = null;
  let bestDist = Infinity;

  for (const node of FROZEN_TOMB_INTERACTABLES) {
    if (node.id === "ending_ice_shard" && !shardVisible) continue;
    const d = Math.hypot(px - node.x, py - node.y);
    if (d <= node.radius + maxOffset && d < bestDist) {
      bestDist = d;
      best = node;
    }
  }
  return best;
}

export function evaluateFrozenTombProximityEvents({
  px,
  py,
  heroId,
  progress,
  runtime,
  lang = "vi",
}: {
  px: number;
  py: number;
  heroId: string;
  progress: FrozenTombProgressState;
  runtime: FrozenTombRuntimeState;
  lang?: "vi" | "en";
}): {
  nextProgress: FrozenTombProgressState;
  storyPayload: FrozenTombStoryModalPayload | null;
  autoMinhInteraction: boolean;
} {
  const next = normalizeFrozenTombProgress(progress);
  const isVi = lang !== "en";

  // Rampart watcher disappears when player gets close
  if (!runtime.rampartWatcherDismissed && Math.hypot(px - 655, py - 2175) < 260) {
    runtime.rampartWatcherDismissed = true;
    runtime.phantoms = runtime.phantoms.filter((p) => p.kind !== "rampart_watcher");
  }

  // 1. Intro Narrative Sequence (once, on passing Frozen Kingdom Gate)
  if (!next.introNarrativeSeen && py < 2145 && px < 1150) {
    next.introNarrativeSeen = true;
    return {
      nextProgress: next,
      autoMinhInteraction: false,
      storyPayload: {
        nodeId: "narrative_intro",
        zoneId: "zone_1",
        title: isVi ? "Băng Mộ Vĩnh Cửu" : "Eternal Frozen Tomb",
        subtitle: isVi ? "CỔNG THÀNH BĂNG GIÁ · MỞ ĐẦU" : "FROZEN GATE · OPENING",
        code: "NARR-01",
        themeVariant: "ice",
        isSecretDiscovery: false,
        unlockedNow: true,
        steps: [
          {
            speaker: isVi ? "Giọng Kể Cổ Xưa" : "Ancient Voice",
            speakerColor: "#7DD3FC",
            text: isVi
              ? "“Người ta nói vương quốc này đã chết từ ba trăm năm trước.”"
              : "“They say this kingdom perished three hundred years ago.”",
          },
          {
            speaker: isVi ? "Gió Tuyết Thì Thầm" : "Snowwind Whisper",
            speakerColor: "#BAE6FD",
            text: isVi
              ? "“Nhưng khi bước qua cánh cổng này... Ngươi sẽ nhận ra thứ đáng sợ nhất không phải là cái chết.”"
              : "“Yet once you cross this gate... you will realize death is not the most terrifying fate.”",
          },
          {
            speaker: isVi ? "Ký Ức Bị Chôn Vùi" : "Buried Memory",
            speakerColor: "#C084FC",
            text: isVi
              ? "“Mà là... có những người chưa từng chết, lại không còn nhớ mình là ai.”"
              : "“It is... that some who never died no longer remember who they are.”",
          },
        ],
        paragraphs: [
          "Người ta nói vương quốc này đã chết từ ba trăm năm trước.",
          "Nhưng khi bước qua cánh cổng này...",
          "Ngươi sẽ nhận ra thứ đáng sợ nhất không phải là cái chết.",
          "Mà là... có những người chưa từng chết, lại không còn nhớ mình là ai.",
        ],
        clueSummary: isVi ? "Đã tiến vào vương quốc đóng băng." : "Entered the frozen kingdom.",
        audioCue: "whisper",
        progress: next,
      },
    };
  }

  // 2. Near Final Sealing Chamber warning (once, on approaching center)
  if (!next.chamberWarningSeen && Math.hypot(px - 1750, py - 2320) <= 360) {
    next.chamberWarningSeen = true;
    return {
      nextProgress: next,
      autoMinhInteraction: false,
      storyPayload: {
        nodeId: "narrative_chamber_warning",
        zoneId: "zone_7",
        title: isVi ? "Tiếng Nói Từ Điện Phong Ấn" : "Voice from the Sealing Chamber",
        subtitle: isVi ? "ĐIỆN PHONG ẤN CUỐI CÙNG · LỜI CẢNH BÁO" : "FINAL CHAMBER · WARNING",
        code: "NARR-02",
        themeVariant: "linked",
        isSecretDiscovery: false,
        unlockedNow: true,
        steps: [
          {
            speaker: isVi ? "Giọng Vô Tính Trong Băng" : "Genderless Voice in the Ice",
            speakerColor: "#E879F9",
            text: isVi ? "“Đừng mở nó.”" : "“Do not open it.”",
            subtext: isVi
              ? "Khối băng quan tài khổng lồ giữa bốn cột cổ ngữ rung khẽ theo từng nhịp tim."
              : "The colossal ice coffin between four rune pillars pulses faintly like a slowed heartbeat.",
          },
          {
            speaker: isVi ? "Giọng Vô Tính Trong Băng" : "Genderless Voice in the Ice",
            speakerColor: "#C084FC",
            text: isVi
              ? "“Chúng ta đã phải mất bao nhiêu người... chỉ để giữ nó ngủ yên.”"
              : "“How many of us had to fall... just to keep it asleep.”",
          },
        ],
        paragraphs: [
          "Đừng mở nó.",
          "Chúng ta đã phải mất bao nhiêu người... chỉ để giữ nó ngủ yên.",
        ],
        clueSummary: isVi ? "Lời cảnh báo trước Khối Băng Quan Tài." : "Warning heard before the Ice Coffin.",
        audioCue: "whisper",
        progress: next,
      },
    };
  }

  // 3. Minh auto-melting ice dossier when nearby
  if (heroId === "minh" && !next.minhSealClue && Math.hypot(px - 1465, py - 2565) <= 105) {
    return {
      nextProgress: next,
      storyPayload: null,
      autoMinhInteraction: true,
    };
  }

  return { nextProgress: next, storyPayload: null, autoMinhInteraction: false };
}

export function buildEndingSequencePayload(
  progress: FrozenTombProgressState,
  lang: "vi" | "en" = "vi"
): FrozenTombStoryModalPayload {
  const isVi = lang !== "en";
  return {
    nodeId: "ending_ice_shard",
    zoneId: "zone_7",
    title: isVi ? "Mảnh Băng Khắc Ký Hiệu Cầu Ma Thuật" : "Ice Shard Bearing Arcane Symbol",
    subtitle: isVi ? "KẾT THÚC BĂNG MỘ VĨNH CỬU · DƯ ÂM" : "FROZEN TOMB · POST-BATTLE ECHO",
    code: "BM-END",
    themeVariant: "ending",
    isSecretDiscovery: true,
    unlockedNow: true,
    isEndingSequence: true,
    showsMap2Symbol: true,
    endingBoldLine: isVi
      ? "BĂNG CHỈ GIỮ ĐƯỢC NHỮNG THỨ CHƯA THỂ CHẾT."
      : "ICE CAN ONLY HOLD WHAT CANNOT DIE.",
    steps: [
      {
        speaker: isVi ? "Khoảng Trống Trong Quan Tài" : "The Hollow Coffin",
        speakerColor: "#94A3B8",
        text: isVi
          ? "Lớp băng quan tài nứt vỡ hoàn toàn... nhưng bên trong trống rỗng. Không ai biết nó đã bị tiêu diệt hay đã thoát ra."
          : "The ice coffin fractures open... yet inside lies only emptiness. No sign confirms whether it perished or escaped.",
      },
      {
        speaker: isVi ? "Mảnh Băng Rơi Lại" : "Dropped Ice Shard",
        speakerColor: "#C084FC",
        text: isVi
          ? "Trên mảnh băng nhỏ còn sót lại hiện rõ một ký hiệu giống hệt Quả Cầu Ma Thuật tại Hỏa Ngục Tàn Tro."
          : "Upon a small fallen ice shard glows a symbol identical to the Arcane Orb from Inferno of Ashes.",
      },
      {
        speaker: isVi ? "Lời Thì Thầm Cuối" : "Final Whisper",
        speakerColor: "#E879F9",
        text: isVi
          ? "“Ngươi đã nhìn thấy hai nơi. Nhưng vẫn chưa hiểu điều gì đang được chôn giấu.”"
          : "“You have seen two places. Yet still do not understand what lies buried.”",
      },
    ],
    paragraphs: [
      "Ngươi đã nhìn thấy hai nơi.",
      "Nhưng vẫn chưa hiểu điều gì đang được chôn giấu.",
      "BĂNG CHỈ GIỮ ĐƯỢC NHỮNG THỨ CHƯA THỂ CHẾT.",
    ],
    clueSummary: isVi ? "Hoàn tất Điện Phong Ấn Cuối Cùng." : "Completed the Final Sealing Chamber.",
    audioCue: "ending",
    progress,
  };
}

export function evaluateFrozenTombInteraction({
  nodeId,
  heroId,
  progress,
  infernoProgress,
  runtime,
  lang = "vi",
}: {
  nodeId: FrozenTombInteractableId;
  heroId: string;
  progress: FrozenTombProgressState;
  infernoProgress?: Partial<InfernoProgressState> | unknown;
  runtime?: FrozenTombRuntimeState | null;
  lang?: "vi" | "en";
}): {
  nextProgress: FrozenTombProgressState;
  payload: FrozenTombStoryModalPayload;
  coinBonus: number;
  spawnPhantom?: FrozenTombPhantom;
  darknessPulseSec?: number;
  ringCathedralBell?: boolean;
  spawnFinalBoss?: boolean;
} {
  const isVi = lang !== "en";
  const next = normalizeFrozenTombProgress(progress);
  const node = FROZEN_TOMB_INTERACTABLES.find((n) => n.id === nodeId) || FROZEN_TOMB_INTERACTABLES[0];
  if (!next.inspectedNodes.includes(nodeId)) {
    next.inspectedNodes.push(nodeId);
  }

  let coinBonus = 0;
  let unlockedNow = false;
  let isSecretDiscovery = false;
  let themeVariant: FrozenTombStoryModalPayload["themeVariant"] = "ice";
  let audioCue: FrozenTombStoryModalPayload["audioCue"] = null;
  let spawnPhantom: FrozenTombPhantom | undefined;
  let darknessPulseSec = 0;
  let ringCathedralBell = false;
  let spawnFinalBoss = false;
  let steps: FrozenTombStoryStep[] = [];

  if (node.docId && !next.collectedDocs.includes(node.docId)) {
    // Only award EE hero docs or EE5 doc when actually unlocked
    const gatedByHero =
      nodeId === "eohyen_painting" ||
      nodeId === "phong_faceless_statues" ||
      nodeId === "phong_mirror_room" ||
      nodeId === "minh_frozen_dossier" ||
      nodeId === "thanh_poison_vial" ||
      nodeId === "frozen_research_device";
    if (!gatedByHero) {
      next.collectedDocs.push(node.docId);
      coinBonus += 35;
      unlockedNow = true;
    }
  }

  if (nodeId === "eohyen_painting") {
    themeVariant = "eohyen";
    if (heroId === "eohyen") {
      if (!next.eohyenPaintingSeen) {
        next.eohyenPaintingSeen = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 160;
      }
      if (!next.collectedDocs.includes("doc_eohyen_painting")) {
        next.collectedDocs.push("doc_eohyen_painting");
      }
      audioCue = "whisper";
      spawnPhantom = {
        kind: "eohyen_ice_ring",
        x: 1860,
        y: 295,
        targetX: 1860,
        targetY: 295,
        life: 0,
        maxLife: 3.4,
        alpha: 0.95,
      };
      steps = [
        {
          speaker: isVi ? "Tiếng Thì Thầm Từ Bức Tranh" : "Whisper from the Portrait",
          speakerColor: "#38BDF8",
          text: isVi ? "“Ngươi vẫn còn nhớ ta chứ?”" : "“Do you still remember me?”",
          subtext: isVi
            ? "Lớp sơn bị cào xước bỗng bừng sáng lam băng, hiện ra hình ảnh người phụ nữ bị giam giữa những vòng băng lạnh lẽo."
            : "Beneath the scraped canvas, ice-blue light reveals a woman bound inside frost rings.",
        },
        {
          speaker: "Éo Hyên",
          speakerColor: "#BAE6FD",
          text: isVi
            ? "“Ta đã từng đứng ở đây... nhưng tại sao ta không thể nhớ mình đã làm gì?”"
            : "“I stood here once... yet why can I no longer remember what I did?”",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Bức Tranh Ba Bóng Đen" : "Portrait of Three Shadows",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Trên bức tranh chỉ còn ba bóng đen mờ đục, phần mặt và chữ ký ở giữa đã bị ai đó cào nát."
            : "Three indistinct dark silhouettes remain on the scraped painting; the center figure is clawed away.",
          subtext: isVi
            ? "Hãy đưa Éo Hyên tới bức tranh này để đánh thức lớp băng ký ức."
            : "Bring Éo Hyên to this portrait to awaken its frozen resonance.",
        },
      ];
    }
  } else if (nodeId === "phong_faceless_statues" || nodeId === "phong_mirror_room") {
    themeVariant = "phong";
    if (heroId === "phong") {
      if (!next.phongMirrorClue) {
        next.phongMirrorClue = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 160;
      }
      if (!next.collectedDocs.includes("doc_phong_mirror")) {
        next.collectedDocs.push("doc_phong_mirror");
      }
      audioCue = "whisper";
      spawnPhantom = {
        kind: "phong_ninja_shadow",
        x: 2110,
        y: 1185,
        targetX: 2265,
        targetY: 1035,
        life: 0,
        maxLife: 2.8,
        alpha: 0.92,
      };
      steps = [
        {
          speaker: isVi ? "Bản Ghi Trong Phòng Gương" : "Mirror Room Record",
          speakerColor: "#22D3EE",
          text: isVi
            ? "“Ta đã tạo ra những hình ảnh để che giấu sự thật. Nhưng có những thứ không cần hình dạng vẫn có thể nhìn thấy chúng ta.”"
            : "“I forged illusions to conceal the truth. Yet some things need no form to see right through us.”",
          subtext: isVi
            ? "Bóng ninja thoáng chạy dọc hành lang vào Phòng Gương — hình phản chiếu của Phong trong gương cử động lệch nhịp hoàn toàn!"
            : "A distant ninja silhouette glides down the corridor into the Mirror Room — Phong's reflection moves out of sync.",
        },
        {
          speaker: "Phong",
          speakerColor: "#38BDF8",
          text: isVi
            ? "“Ta đã xóa dấu vết của hắn... nhưng không thể xóa những gì ta đã nhìn thấy.”"
            : "“I erased his tracks... yet I could never erase what I witnessed.”",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Hàng Tượng Không Có Khuôn Mặt" : "Faceless Statues",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Những bức tượng đá dọc cánh Đông Thánh Đường đều có gương mặt phẳng lì như bị gọt sạch bằng ảo thuật."
            : "Every stone statue along the east cathedral wing has a featureless face as if erased by illusion.",
          subtext: isVi
            ? "Hãy điều khiển Phong tới đây để lần theo bóng ninja về Phòng Gương."
            : "Bring hero Phong here to follow the phantom into the Mirror Room.",
        },
      ];
    }
  } else if (nodeId === "minh_frozen_dossier") {
    themeVariant = "minh";
    if (heroId === "minh") {
      if (!next.minhSealClue) {
        next.minhSealClue = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 160;
      }
      if (!next.collectedDocs.includes("doc_minh_seal")) {
        next.collectedDocs.push("doc_minh_seal");
      }
      audioCue = "whisper";
      steps = [
        {
          speaker: isVi ? "Bản Ghi Của Minh (Băng Tự Tan Chảy)" : "Minh's Record (Ice Melts Automatically)",
          speakerColor: "#FACC15",
          text: isVi
            ? "“Nếu ta không đóng cánh cửa ấy, thứ bên dưới sẽ bước ra. Ta biết sẽ có người phải chết. Ta biết nàng sẽ không tha thứ cho ta. Nhưng ta không còn lựa chọn.”"
            : "“If I had not shut that door, what waits beneath would have stepped out. I knew lives would be lost. I knew she would never forgive me. Yet I had no choice.”",
        },
        {
          speaker: "Minh",
          speakerColor: "#FDE047",
          text: isVi
            ? "“Ta không cứu được vương quốc này. Ta chỉ ngăn nó trở thành một thứ còn tồi tệ hơn.”"
            : "“I did not save this kingdom. I only stopped it from becoming something far worse.”",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Tập Hồ Sơ Bọc Băng Dày" : "Icebound Dossier",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Một tập hồ sơ cổ bị khóa chặt trong khối băng xanh dày đặc, chỉ tan chảy trước dấu ấn của Minh."
            : "A royal dossier encased in dense glacial ice that refuses to thaw for anyone else.",
          subtext: isVi
            ? "Hãy đưa Minh vào Điện Phong Ấn Cuối Cùng để băng tự tan chảy."
            : "Bring hero Minh here so the ice melts automatically.",
        },
      ];
    }
  } else if (nodeId === "thanh_poison_vial") {
    themeVariant = "thanh";
    if (heroId === "thanh") {
      if (!next.thanhVialClue) {
        next.thanhVialClue = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 160;
      }
      if (!next.collectedDocs.includes("doc_thanh_vial")) {
        next.collectedDocs.push("doc_thanh_vial");
      }
      audioCue = "whisper";
      spawnPhantom = {
        kind: "thanh_flashback_snake",
        x: 2140,
        y: 590,
        targetX: 2140,
        targetY: 590,
        life: 0,
        maxLife: 3.4,
        alpha: 0.92,
      };
      steps = [
        {
          speaker: isVi ? "Hồi Ức Trong Lọ Độc Dược" : "Poison Vial Flashback",
          speakerColor: "#34D399",
          text: isVi
            ? "Cảnh tượng năm xưa hiện lên trong sương băng: Éo Hyên đứng giữa vòng tròn phong ấn, phía sau là Thanh cùng con rắn xanh đang nhỏ độc vào vật phát sáng."
            : "A frost vision unfolds: Éo Hyên stands within the sealing circle while Thanh stands behind with a green serpent dripping venom into a glowing relic.",
        },
        {
          speaker: "Thanh",
          speakerColor: "#6EE7B7",
          text: isVi
            ? "“Đừng trách ta. Ngươi không biết thứ mình định giải phóng là gì.”"
            : "“Do not blame me. You have no idea what you were about to set free.”",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Chiếc Lọ Thủy Tinh Cạn Đáy" : "Empty Glass Poison Vial",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Trong góc phòng nghi thức là một chiếc lọ thủy tinh nhỏ đã cạn, thành lọ vẫn vương vết lục bảo lạnh lẽo."
            : "An empty glass vial sits in the ritual room corner, rimmed with dried emerald residue.",
          subtext: isVi
            ? "Hãy đưa Thanh tới đây để đối diện hồi ức năm xưa."
            : "Bring hero Thanh here to trigger the hidden flashback.",
        },
      ];
    }
  } else if (nodeId === "frozen_research_device") {
    themeVariant = "linked";
    const map2 = hasCompletedMap2Links(infernoProgress);
    const map3 = hasCompletedMap3Links(next);
    if (map2.allReady && map3.allReady) {
      if (!next.linkedDeviceTriggered) {
        next.linkedDeviceTriggered = true;
        unlockedNow = true;
        coinBonus += 420;
      }
      isSecretDiscovery = true;
      if (!next.collectedDocs.includes("doc_linked_experiments")) {
        next.collectedDocs.push("doc_linked_experiments");
      }
      audioCue = "tape";
      darknessPulseSec = 5.0;
      steps = [
        {
          speaker: isVi ? "Băng Ghi Âm Thí Nghiệm (1/3)" : "Experiment Audio Log (1/3)",
          speakerColor: "#38BDF8",
          text: isVi
            ? "“Thí nghiệm thứ nhất: phản ứng của Ma Thạch với máu đã được xác nhận.”"
            : "“Experiment One: Ma Thach reaction with blood confirmed.”",
          subtext: isVi
            ? "Thiết bị đóng băng rung lên khi nhận đủ 6 mảnh ký ức từ Hỏa Ngục Tàn Tro & Băng Mộ Vĩnh Cửu."
            : "The frozen apparatus thaws as all 6 clues from Map 2 and Map 3 synchronize.",
        },
        {
          speaker: isVi ? "Băng Ghi Âm Thí Nghiệm (2–3/3)" : "Experiment Audio Log (2–3/3)",
          speakerColor: "#A855F7",
          text: isVi
            ? "“Thí nghiệm thứ hai: ký ức và ý thức có thể bị biến đổi.” — “Thí nghiệm thứ ba: một vật chủ có thể bị phong ấn cùng thực thể.”"
            : "“Experiment Two: memory and consciousness can be altered.” — “Experiment Three: a host can be sealed alongside the entity.”",
        },
        {
          speaker: isVi ? "Giọng Nói Của Trung" : "Voice of Trung",
          speakerColor: "#E879F9",
          text: isVi
            ? "“Thú vị thật... các ngươi vẫn nghĩ đây là những sự kiện riêng biệt sao? Thành phố ấy, vương quốc này... tất cả chỉ là những phần khác nhau của cùng một câu chuyện.”"
            : "“How amusing... you still thought these were separate events? That city, this kingdom... all merely different parts of one story.”",
          subtext: isVi
            ? "Màn hình tắt phụt · Toàn bộ thiết bị lại chìm vào bóng tối đóng băng."
            : "The monitor cuts dark · The device falls silent once more.",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Thiết Bị Nghiên Cứu Đóng Băng (Chưa Đủ Điều Kiện)" : "Frozen Research Device (Locked)",
          speakerColor: "#C084FC",
          text: isVi
            ? `Cần thu thập đủ 3 manh mối Map 2 (Bản ghi Dũng ${map2.dungReady ? "✓" : "○"} · Tọa độ Long Hói ${map2.longhoiReady ? "✓" : "○"} · Tài liệu 4 Chiếc Ghế ${map2.fourChairsReady ? "✓" : "○"}) VÀ 3 bí mật Map 3 (Minh ${map3.minhReady ? "✓" : "○"} · Phong ${map3.phongReady ? "✓" : "○"} · Thanh ${map3.thanhReady ? "✓" : "○"}).`
            : `Requires all 3 Map 2 clues (${(map2.dungReady ? 1 : 0) + (map2.longhoiReady ? 1 : 0) + (map2.fourChairsReady ? 1 : 0)}/3) AND 3 Map 3 secrets (${(map3.minhReady ? 1 : 0) + (map3.phongReady ? 1 : 0) + (map3.thanhReady ? 1 : 0)}/3).`,
          subtext: isVi
            ? "Lớp băng bao quanh lõi thiết bị vẫn còn quá dày để đọc cuộn băng bên trong."
            : "The glacial casing remains too thick to access the core tape.",
        },
      ];
    }
  } else if (nodeId === "final_seal_coffin") {
    themeVariant = "linked";
    const bossDead = Boolean(runtime?.bossDefeatedThisRun || next.bossDefeatedEmptyVoid);
    if (!bossDead && !runtime?.bossSpawnedThisRun) {
      spawnFinalBoss = true;
      audioCue = "bell";
      darknessPulseSec = 2.5;
      steps = [
        {
          speaker: isVi ? "Khối Băng Quan Tài Trung Tâm" : "Central Ice Coffin",
          speakerColor: "#C084FC",
          text: isVi
            ? "Những sợi xiềng xích treo từ trần rung chuyển dữ dội. Một bóng dáng không rõ hình hài đang vùng vẫy sau lớp băng dày!"
            : "Ceiling chains rattle violently. An indistinct silhouette thrashes behind the thick ice!",
          subtext: isVi
            ? "Cẩn thận: Thực Thể Băng Phong Vô Danh đã thức tỉnh trong Điện Phong Ấn!"
            : "Beware: The Nameless Frozen Entity has awakened inside the Sealing Chamber!",
        },
      ];
    } else if (bossDead) {
      steps = [
        {
          speaker: isVi ? "Khối Băng Quan Tài Đã Nứt Vỡ" : "Fractured Ice Coffin",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Quan tài băng đã nứt toác hoàn toàn. Bên trong chỉ là một khoảng trống đen sâu thẳm — không có thi thể, không có tro tàn."
            : "The ice coffin stands cracked wide open. Inside lies nothing but deep emptiness.",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Phong Ấn Đang Vỡ" : "Shattering Seal",
          speakerColor: "#C084FC",
          text: isVi
            ? "Thực Thể Băng Phong Vô Danh vẫn đang hoành hành trong Điện Phong Ấn! Hãy đánh bại nó để xem thứ gì nằm bên trong khối băng."
            : "The Nameless Frozen Entity still roams this chamber — defeat it to uncover what sleeps inside!",
        },
      ];
    }
  } else if (nodeId === "ending_ice_shard") {
    next.endingShardSeen = true;
    const endPayload = buildEndingSequencePayload(next, lang);
    return {
      nextProgress: next,
      payload: endPayload,
      coinBonus: 0,
      darknessPulseSec: 6.0,
    };
  } else if (nodeId === "cathedral_bell" || nodeId === "gate_self_bell") {
    themeVariant = "cathedral";
    audioCue = "bell";
    ringCathedralBell = true;
    const doc = node.docId ? FROZEN_TOMB_DOCS[node.docId] : null;
    steps = (doc?.paragraphs || []).map((p, idx) => ({
      speaker: idx === 0 ? (isVi ? doc!.title.vi : doc!.title.en) : isVi ? "Tiếng Chuông Vang" : "Bell Echo",
      speakerColor: "#818CF8",
      text: isVi ? p.vi : p.en,
    }));
  } else if (nodeId === "reverse_clock_house") {
    themeVariant = "ice";
    audioCue = "clock";
    const doc = FROZEN_TOMB_DOCS.doc_reverse_clock;
    steps = doc.paragraphs.map((p, idx) => ({
      speaker: idx === 0 ? (isVi ? doc.title.vi : doc.title.en) : isVi ? "Kim Đồng Hồ Ngược" : "Reversed Hands",
      speakerColor: "#67E8F9",
      text: isVi ? p.vi : p.en,
    }));
  } else {
    themeVariant = node.zoneId === "zone_5" ? "palace" : "ice";
    audioCue = "whisper";
    const doc = node.docId ? FROZEN_TOMB_DOCS[node.docId] : null;
    steps = (doc?.paragraphs || []).map((p, idx) => ({
      speaker: idx === 0 ? (isVi ? doc!.title.vi : doc!.title.en) : isVi ? "Ghi Chép Băng Mộ" : "Tomb Record",
      speakerColor: themeVariant === "palace" ? "#A5B4FC" : "#7DD3FC",
      text: isVi ? p.vi : p.en,
    }));
  }

  const clueCount = (next.minhSealClue ? 1 : 0) + (next.phongMirrorClue ? 1 : 0) + (next.thanhVialClue ? 1 : 0);
  const docEntry = node.docId ? FROZEN_TOMB_DOCS[node.docId] : null;
  const zone = FROZEN_TOMB_ZONES.find((z) => z.id === node.zoneId) || FROZEN_TOMB_ZONES[0];

  return {
    nextProgress: next,
    coinBonus,
    spawnPhantom,
    darknessPulseSec,
    ringCathedralBell,
    spawnFinalBoss,
    payload: {
      nodeId,
      zoneId: node.zoneId,
      title: isVi ? node.title.vi : node.title.en,
      subtitle: docEntry ? (isVi ? docEntry.subtitle.vi : docEntry.subtitle.en) : (isVi ? zone.name.vi : zone.name.en),
      code: docEntry?.code || "BM-LOG",
      themeVariant,
      isSecretDiscovery,
      unlockedNow,
      steps,
      paragraphs: steps.map((s) => s.text),
      clueSummary: isVi
        ? `Manh mối Băng Mộ: ${clueCount}/3 (Minh ${next.minhSealClue ? "✓" : "○"} · Phong ${next.phongMirrorClue ? "✓" : "○"} · Thanh ${next.thanhVialClue ? "✓" : "○"} · Tranh Éo Hyên ${next.eohyenPaintingSeen ? "✓" : "○"})`
        : `Tomb Clues: ${clueCount}/3 · Portrait: ${next.eohyenPaintingSeen ? "✓" : "○"}`,
      rewardText: coinBonus > 0 ? `+${coinBonus} ${isVi ? "Vàng" : "Gold"}` : undefined,
      audioCue,
      progress: next,
    },
  };
}

export function getFrozenTombCompassTarget(
  heroId: string,
  progress: FrozenTombProgressState,
  lang: "vi" | "en" = "vi"
): { x: number; y: number; color: string; bg: string; icon: string; tag: string } | null {
  const next = normalizeFrozenTombProgress(progress);
  if (heroId === "eohyen" && !next.eohyenPaintingSeen) {
    const n = FROZEN_TOMB_INTERACTABLES.find((x) => x.id === "eohyen_painting")!;
    return { x: n.x, y: n.y, color: "#38BDF8", bg: "rgba(8, 47, 73, 0.92)", icon: "🖼️", tag: lang === "en" ? "PORTRAIT" : "TRANH BĂNG" };
  }
  if (heroId === "phong" && !next.phongMirrorClue) {
    const n = FROZEN_TOMB_INTERACTABLES.find((x) => x.id === "phong_faceless_statues")!;
    return { x: n.x, y: n.y, color: "#22D3EE", bg: "rgba(12, 74, 110, 0.92)", icon: "🪞", tag: lang === "en" ? "MIRROR" : "TƯỢNG & GƯƠNG" };
  }
  if (heroId === "thanh" && !next.thanhVialClue) {
    const n = FROZEN_TOMB_INTERACTABLES.find((x) => x.id === "thanh_poison_vial")!;
    return { x: n.x, y: n.y, color: "#34D399", bg: "rgba(6, 78, 59, 0.92)", icon: "🧪", tag: lang === "en" ? "VIAL" : "LỌ ĐỘC" };
  }
  if (heroId === "minh" && !next.minhSealClue) {
    const n = FROZEN_TOMB_INTERACTABLES.find((x) => x.id === "minh_frozen_dossier")!;
    return { x: n.x, y: n.y, color: "#FACC15", bg: "rgba(66, 32, 6, 0.92)", icon: "📜", tag: lang === "en" ? "SEAL LOG" : "HỒ SƠ MINH" };
  }
  if (next.minhSealClue && next.phongMirrorClue && next.thanhVialClue && !next.linkedDeviceTriggered) {
    const n = FROZEN_TOMB_INTERACTABLES.find((x) => x.id === "frozen_research_device")!;
    return { x: n.x, y: n.y, color: "#C084FC", bg: "rgba(59, 7, 100, 0.92)", icon: "📟", tag: lang === "en" ? "LINK DEVICE" : "THIẾT BỊ KÍN" };
  }
  if (!next.bossDefeatedEmptyVoid) {
    const n = FROZEN_TOMB_INTERACTABLES.find((x) => x.id === "final_seal_coffin")!;
    return { x: n.x, y: n.y, color: "#A855F7", bg: "rgba(30, 27, 75, 0.92)", icon: "⚰️", tag: lang === "en" ? "ICE COFFIN" : "QUAN TÀI BĂNG" };
  }
  return null;
}

export interface FrozenTombHazardTickResult {
  playerDamage: number;
  applySlow?: { duration: number; factor: number };
  applyRootSec?: number;
  applyStunSec?: number;
  ringCathedralBell: boolean;
  ghostAmbushSpawns: FrozenTombGhostAmbushZone[];
  soundEvents: Array<"blizzard_warn" | "ice_crack" | "ice_hands" | "bell" | "ghost_whisper">;
  staticIntensity: number;
}

export function stepFrozenTombHazards({
  runtime,
  dt,
  playerX,
  playerY,
  playerRadius,
  playerAlive,
}: {
  runtime: FrozenTombRuntimeState;
  dt: number;
  playerX: number;
  playerY: number;
  playerRadius: number;
  playerAlive: boolean;
}): FrozenTombHazardTickResult {
  const result: FrozenTombHazardTickResult = {
    playerDamage: 0,
    ringCathedralBell: false,
    ghostAmbushSpawns: [],
    soundEvents: [],
    staticIntensity: 0,
  };

  if (runtime.bellShakeTimer > 0) runtime.bellShakeTimer = Math.max(0, runtime.bellShakeTimer - dt);
  if (runtime.darknessPulseSec > 0) runtime.darknessPulseSec = Math.max(0, runtime.darknessPulseSec - dt);
  if (runtime.trungAudioSilenceSec > 0) runtime.trungAudioSilenceSec = Math.max(0, runtime.trungAudioSilenceSec - dt);
  if (runtime.eohyenResonanceBannerTimer > 0) {
    runtime.eohyenResonanceBannerTimer = Math.max(0, runtime.eohyenResonanceBannerTimer - dt);
  }
  if (runtime.lastDiscoveryTimer > 0) {
    runtime.lastDiscoveryTimer = Math.max(0, runtime.lastDiscoveryTimer - dt);
    if (runtime.lastDiscoveryTimer <= 0) runtime.lastDiscoveryToast = null;
  }

  for (const d of runtime.destructibles) {
    if (d.hitFlash > 0) d.hitFlash = Math.max(0, d.hitFlash - dt);
  }

  for (let i = runtime.phantoms.length - 1; i >= 0; i--) {
    const ph = runtime.phantoms[i];
    if (ph.maxLife < 900) {
      ph.life += dt;
      const p = Math.min(1, ph.life / Math.max(0.2, ph.maxLife));
      ph.x = ph.x + (ph.targetX - ph.x) * Math.min(1, dt * 1.6);
      ph.y = ph.y + (ph.targetY - ph.y) * Math.min(1, dt * 1.6);
      ph.alpha = p < 0.7 ? 0.9 : Math.max(0, (1 - p) / 0.3);
      if (ph.life >= ph.maxLife) runtime.phantoms.splice(i, 1);
    } else {
      ph.life += dt;
    }
  }

  for (let i = runtime.bellRipples.length - 1; i >= 0; i--) {
    const rp = runtime.bellRipples[i];
    rp.radius += 260 * dt;
    rp.alpha = Math.max(0, 1 - rp.radius / Math.max(1, rp.maxRadius));
    if (rp.radius >= rp.maxRadius) runtime.bellRipples.splice(i, 1);
  }

  for (let i = runtime.ghostFootprints.length - 1; i >= 0; i--) {
    const fp = runtime.ghostFootprints[i];
    fp.life += dt;
    if (fp.life >= fp.maxLife) runtime.ghostFootprints.splice(i, 1);
  }

  for (let i = runtime.frostSpikes.length - 1; i >= 0; i--) {
    const sp = runtime.frostSpikes[i];
    sp.life += dt;
    if (sp.life >= sp.maxLife) runtime.frostSpikes.splice(i, 1);
  }

  // Unpredictable Cathedral Bell tolling
  runtime.bellCooldown -= dt;
  if (runtime.bellCooldown <= 0) {
    runtime.bellCooldown = 22 + ((Math.floor(playerX + playerY) % 11) + 3);
    runtime.bellShakeTimer = 0.65;
    result.ringCathedralBell = true;
    result.soundEvents.push("bell");
    runtime.bellRipples.push({
      x: 1800,
      y: 1165,
      radius: 18,
      maxRadius: 560,
      alpha: 0.9,
      color: "#818CF8",
    });
    runtime.bellRipples.push({
      x: 356,
      y: 2268,
      radius: 12,
      maxRadius: 280,
      alpha: 0.75,
      color: "#38BDF8",
    });
    if (runtime.phantoms.length < 10) {
      runtime.phantoms.push({
        kind: "cathedral_choir_ghost",
        x: 1620 + (Math.floor(playerX) % 320),
        y: 1260 + (Math.floor(playerY) % 240),
        targetX: 1800,
        targetY: 1420,
        life: 0,
        maxLife: 3.5,
        alpha: 0.8,
      });
    }
  }

  // Spawn vanishing ghost footprints near Graveyard when player explores zone_4
  if (playerAlive && playerX < 1350 && playerY < 920 && runtime.ghostFootprints.length < 18 && Math.random() < dt * 2.2) {
    const step = runtime.ghostFootprints.length * 24;
    runtime.ghostFootprints.push({
      x: 420 + (step % 360),
      y: 340 + Math.sin(step * 0.04) * 55,
      angle: 0.15,
      life: 0,
      maxLife: 4.5,
    });
  }

  // 1. Bão Tuyết (Blizzard Waves): calm -> wind warning -> active sweeping snow
  runtime.blizzardTimer -= dt;
  if (runtime.blizzardState === "calm") {
    runtime.blizzardIntensity = Math.max(0.12, runtime.blizzardIntensity - dt * 0.25);
    if (runtime.blizzardTimer <= 0) {
      runtime.blizzardState = "warning";
      runtime.blizzardTimer = 2.6;
      result.soundEvents.push("blizzard_warn");
    }
  } else if (runtime.blizzardState === "warning") {
    runtime.blizzardIntensity = Math.min(0.45, runtime.blizzardIntensity + dt * 0.22);
    if (runtime.blizzardTimer <= 0) {
      runtime.blizzardState = "active";
      runtime.blizzardTimer = 7.5;
    }
  } else {
    runtime.blizzardIntensity = Math.min(1.0, runtime.blizzardIntensity + dt * 0.5);
    if (playerAlive) {
      result.applySlow = { duration: 0.3, factor: 0.12 };
    }
    if (runtime.blizzardTimer <= 0) {
      runtime.blizzardState = "calm";
      runtime.blizzardTimer = 17;
    }
  }

  // 2. Băng Nứt (Cracked Ice Zones): stable -> cracking -> collapsed (stagger + dmg)
  for (const cr of runtime.crackedIceZones) {
    if (cr.eohyenFrozenTimer > 0) {
      cr.eohyenFrozenTimer = Math.max(0, cr.eohyenFrozenTimer - dt);
      cr.state = "stable";
      continue;
    }
    const onIce = playerAlive && Math.hypot(playerX - cr.x, playerY - cr.y) <= cr.radius + playerRadius * 0.6;
    if (cr.state === "stable") {
      if (onIce) {
        cr.state = "cracking";
        cr.timer = 1.05;
        cr.didHit = false;
        result.soundEvents.push("ice_crack");
      }
    } else if (cr.state === "cracking") {
      cr.timer -= dt;
      if (cr.timer <= 0) {
        cr.state = "collapsed";
        cr.timer = 4.2;
        result.soundEvents.push("ice_crack");
        if (onIce && !cr.didHit) {
          cr.didHit = true;
          result.playerDamage += 68;
          result.applyStunSec = Math.max(result.applyStunSec || 0, 0.35);
          result.applySlow = { duration: 1.4, factor: 0.35 };
        }
      }
    } else if (cr.state === "collapsed") {
      cr.timer -= dt;
      if (cr.timer <= 0) {
        cr.state = "refreezing";
        cr.timer = 1.6;
      }
    } else {
      cr.timer -= dt;
      if (cr.timer <= 0) {
        cr.state = "stable";
      }
    }
  }

  // 3. Bàn Tay Từ Băng (Ice Hands): ground telegraph -> hands burst & root briefly
  for (const hz of runtime.iceHandsHazards) {
    if (hz.state === "cooldown") {
      hz.timer -= dt;
      if (hz.timer <= 0 && playerAlive && Math.hypot(playerX - hz.x, playerY - hz.y) <= hz.radius + 145) {
        hz.state = "telegraph";
        hz.timer = 1.1;
        hz.didRoot = false;
        result.soundEvents.push("ice_hands");
      } else if (hz.timer <= 0) {
        hz.timer = 1.2;
      }
    } else if (hz.state === "telegraph") {
      hz.timer -= dt;
      if (hz.timer <= 0) {
        hz.state = "erupt";
        hz.timer = 1.4;
        if (playerAlive && !hz.didRoot && Math.hypot(playerX - hz.x, playerY - hz.y) <= hz.radius + playerRadius * 0.7) {
          hz.didRoot = true;
          result.playerDamage += 64;
          result.applyRootSec = Math.max(result.applyRootSec || 0, 1.05);
        }
      }
    } else {
      hz.timer -= dt;
      if (hz.timer <= 0) {
        hz.state = "cooldown";
        hz.timer = hz.cooldownDuration;
      }
    }
  }

  // 4. Hồn Ma Đóng Băng (Frozen Ghost Ambush Spawners)
  for (const amb of runtime.ghostAmbushZones) {
    if (amb.state === "armed") {
      if (playerAlive && Math.hypot(playerX - amb.x, playerY - amb.y) <= amb.triggerRadius) {
        amb.state = "warning";
        amb.timer = 1.1;
        result.soundEvents.push("ghost_whisper");
      }
    } else if (amb.state === "warning") {
      amb.timer -= dt;
      if (amb.timer <= 0) {
        amb.state = "cooldown";
        amb.timer = 24;
        result.ghostAmbushSpawns.push(amb);
      }
    } else {
      amb.timer -= dt;
      if (amb.timer <= 0) amb.state = "armed";
    }
  }

  // 5. Tàn Dư Phong Ấn (Purple Sealing Energy Zones -> prolonged stay slows & adds subtle visual static)
  let maxStatic = 0;
  for (const rem of runtime.sealingRemnants) {
    rem.phase += dt * 2.1;
    rem.tickCd = Math.max(0, rem.tickCd - dt);
    if (playerAlive && Math.hypot(playerX - rem.x, playerY - rem.y) <= rem.radius + playerRadius * 0.5) {
      rem.exposureSec += dt;
      maxStatic = Math.max(maxStatic, Math.min(1, rem.exposureSec / 2.4));
      if (rem.exposureSec >= 0.45) {
        result.applySlow = { duration: 0.45, factor: Math.min(0.42, 0.18 + rem.exposureSec * 0.08) };
      }
      if (rem.exposureSec >= 1.1 && rem.tickCd <= 0) {
        rem.tickCd = 0.65;
        result.playerDamage += Math.round(28 + Math.min(38, rem.exposureSec * 9));
      }
    } else {
      rem.exposureSec = Math.max(0, rem.exposureSec - dt * 1.4);
    }
  }
  runtime.staticDistortionIntensity = runtime.staticDistortionIntensity + (maxStatic - runtime.staticDistortionIntensity) * Math.min(1, dt * 4);
  result.staticIntensity = runtime.staticDistortionIntensity;

  return result;
}
