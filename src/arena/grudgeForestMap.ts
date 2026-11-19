import {
  type CitadelSecretsProgress,
  resolveCircleObstacles,
} from "./bloodCitadelMap";
import { type InfernoProgressState } from "./infernoAshMap";
import { type FrozenTombProgressState } from "./frozenTombMap";

export const GRUDGE_FOREST_WIDTH = 4800;
export const GRUDGE_FOREST_HEIGHT = 4000;
export const GRUDGE_FOREST_SPAWN = { x: 460, y: 3560 };
export const GRUDGE_FOREST_TREE_CENTER = { x: 2360, y: 1840 };

export type GrudgeForestZoneId =
  | "zone_1"
  | "zone_2"
  | "zone_3"
  | "zone_4"
  | "zone_5"
  | "zone_6"
  | "zone_7"
  | "zone_8";

export interface GrudgeForestZoneDef {
  id: GrudgeForestZoneId;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  accentColor: string;
  name: { vi: string; en: string };
  subtitle: { vi: string; en: string };
}

export interface GrudgeForestRectObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | "ancient_trunk"
    | "stone_gate"
    | "abandoned_house"
    | "temple_wall"
    | "lake_basin"
    | "tombstone_cluster"
    | "maze_root_wall"
    | "living_vines"
    | "conditional_root_door"
    | "fallen_log"
    | "hidden_room_wall"
    | "central_great_tree";
  label: string;
  mazePhase?: number;
  destructibleId?: string;
  doorId?: "root_door_trung" | "root_door_maze_vault" | "root_door_puppet_house";
  trapIndex?: number;
}

export interface GrudgeForestVineDestructible {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  maxHp: number;
  hp: number;
  destroyed: boolean;
  hitFlash: number;
  hint: { vi: string; en: string };
}

export type GrudgeForestInteractableId =
  | "gate_signpost_south"
  | "gate_signpost_north"
  | "village_whisper_house"
  | "village_ledger_house"
  | "ee1_rogue_puppet_plaza"
  | "ee1_secret_puppet_house"
  | "ee2_mirror_lake_bank"
  | "ee3_hero_tombstones"
  | "ee3_duy_tombstone"
  | "ee3_mathach_tombstone"
  | "statue_maze_west"
  | "statue_maze_center"
  | "statue_maze_south"
  | "doll_temple_altar"
  | "doll_temple_paintings"
  | "ee4_valley_calling_point"
  | "ee4_valley_echo_shrine"
  | "ee5_trung_hidden_room"
  | "ee6_four_map_altar"
  | "forest_heart_boss_altar"
  | "ending_moving_root"
  | "maze_vault_weapon";

export interface GrudgeForestInteractableDef {
  id: GrudgeForestInteractableId;
  zoneId: GrudgeForestZoneId;
  x: number;
  y: number;
  radius: number;
  kind:
    | "signpost"
    | "house"
    | "ee1"
    | "ee2"
    | "ee3"
    | "statue"
    | "temple"
    | "ee4"
    | "ee5"
    | "ee6"
    | "boss_altar"
    | "ending_root"
    | "vault_weapon";
  heroIdRequired: "duy" | null;
  docId?: string;
  title: { vi: string; en: string };
  shortPrompt: { vi: string; en: string };
}

export interface GrudgeForestDocEntry {
  id: string;
  code: string;
  zoneId: GrudgeForestZoneId;
  category: "diary" | "letter" | "ritual" | "echo" | "archive";
  title: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  heroTag?: string;
  paragraphs: { vi: string; en: string }[];
}

export interface GrudgeForestStatueRuntime {
  id: "statue_maze_west" | "statue_maze_center" | "statue_maze_south";
  x: number;
  y: number;
  angleIndex: number; // 0..3
  targetIndex: number;
  label: { vi: string; en: string };
}

export interface GrudgeForestMushroomNode {
  id: string;
  x: number;
  y: number;
  kind: "guide" | "lure_trap";
  radius: number;
  cooldown: number;
  triggeredCount: number;
  pulsePhase: number;
}

export interface GrudgeForestRootTrap {
  id: string;
  x: number;
  y: number;
  radius: number;
  state: "cooldown" | "telegraph" | "erupt";
  timer: number;
  cooldownDuration: number;
  didRoot: boolean;
}

export interface GrudgeForestFogPocket {
  id: string;
  zoneId: GrudgeForestZoneId;
  x: number;
  y: number;
  radius: number;
  density: number;
  phase: number;
}

export interface GrudgeForestFallingTreeTrap {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  triggerX: number;
  triggerY: number;
  state: "standing" | "warning" | "fallen";
  timer: number;
  didHit: boolean;
}

export interface GrudgeForestAmbushPoint {
  id: string;
  zoneId: GrudgeForestZoneId;
  x: number;
  y: number;
  triggerRadius: number;
  spawnRadius: number;
  state: "armed" | "warning" | "cooldown";
  timer: number;
}

export interface GrudgeForestSilenceZone {
  id: string;
  zoneId: GrudgeForestZoneId;
  x: number;
  y: number;
  radius: number;
}

export interface GrudgeForestFalseMemoryZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  memoryMap: "map1_blood" | "map2_ash" | "map3_ice";
  cooldown: number;
}

export interface GrudgeForestObservingTree {
  id: string;
  x: number;
  y: number;
  scale: number;
  eyeAngle: number;
  blinkTimer: number;
}

export interface GrudgeForestDistantSilhouette {
  id: string;
  x: number;
  y: number;
  height: number;
  dismissed: boolean;
  alpha: number;
}

export interface GrudgeForestRoguePuppet {
  active: boolean;
  arrived: boolean;
  x: number;
  y: number;
  targetIndex: number;
  waypoints: Array<{ x: number; y: number }>;
  angle: number;
  stepPhase: number;
}

export interface GrudgeForestFootprint {
  x: number;
  y: number;
  angle: number;
  life: number;
  maxLife: number;
}

export interface GrudgeForestPhantom {
  kind:
    | "valley_echo"
    | "mirror_map_vision"
    | "village_shadow"
    | "root_whisper"
    | "duy_puppet_echo";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  life: number;
  maxLife: number;
  alpha: number;
  label?: string;
}

export interface GrudgeForestProgressState {
  ee1RoguePuppetSeen: boolean;
  ee1SecretHouseSeen: boolean;
  ee2MirrorLakeSeen: boolean;
  ee3HeroStonesSeen: boolean;
  ee3DuyLaughHeard: boolean;
  ee3MaThachStoneSeen: boolean;
  ee4ValleyCallSeen: boolean;
  ee5TrungRoomUnlocked: boolean;
  ee5TrungRoomSeen: boolean;
  ee6FourMapSecretSeen: boolean;
  statuesAligned: boolean;
  introNarrativeSeen: boolean;
  bossClearedAmbiguous: boolean;
  endingRootSeen: boolean;
  collectedDocs: string[];
  inspectedNodes: GrudgeForestInteractableId[];
  destroyedVines: string[];
}

export interface GrudgeForestRuntimeState {
  mapId: "grudge_forest";
  mazePhase: number;
  mazeShiftTimer: number;
  pendingMazeShift: boolean;
  signpostVariant: number;
  signpostTimer: number;
  mirrorCycleSec: number;
  mirrorResonanceWindow: number;
  mirrorVisionMap: "map1" | "map2";
  duyIdleSec: number;
  duyLastX: number;
  duyLastY: number;
  roguePuppet: GrudgeForestRoguePuppet;
  valleyAloneTimer: number;
  valleyVoiceCooldown: number;
  falseMemoryFlash: { kind: "map1_blood" | "map2_ash" | "map3_ice" | null; timer: number };
  inSilenceZone: boolean;
  statues: GrudgeForestStatueRuntime[];
  destructibles: GrudgeForestVineDestructible[];
  mushrooms: GrudgeForestMushroomNode[];
  rootTraps: GrudgeForestRootTrap[];
  fogPockets: GrudgeForestFogPocket[];
  fallingTrees: GrudgeForestFallingTreeTrap[];
  ambushPoints: GrudgeForestAmbushPoint[];
  silenceZones: GrudgeForestSilenceZone[];
  falseMemoryZones: GrudgeForestFalseMemoryZone[];
  observingTrees: GrudgeForestObservingTree[];
  distantSilhouettes: GrudgeForestDistantSilhouette[];
  trailingFootprints: GrudgeForestFootprint[];
  footprintSpawnTimer: number;
  lastPlayerAngle: number;
  phantoms: GrudgeForestPhantom[];
  villageVoiceTimer: number;
  bossSpawnedThisRun: boolean;
  bossDefeatedThisRun: boolean;
  endingRootSpawned: boolean;
  lastDiscoveryToast: string | null;
  lastDiscoveryTimer: number;
  darknessPulseSec: number;
  mazeVaultWeaponClaimed: boolean;
}

export interface GrudgeForestStoryStep {
  speaker: string;
  speakerColor: string;
  text: string;
  subtext?: string;
}

export interface GrudgeForestStoryModalPayload {
  nodeId: string;
  zoneId: GrudgeForestZoneId;
  title: string;
  subtitle: string;
  code: string;
  themeVariant:
    | "forest"
    | "duy_puppet"
    | "mirror_lake"
    | "graveyard"
    | "valley"
    | "trung_room"
    | "four_maps"
    | "ending_root";
  isSecretDiscovery: boolean;
  unlockedNow: boolean;
  isEndingSequence?: boolean;
  showsFourMapMatrix?: boolean;
  fourMapStatus?: {
    map1Ready: boolean;
    map2Ready: boolean;
    map3Ready: boolean;
    map4Ready: boolean;
  };
  mirrorVisionTag?: "map1" | "map2" | null;
  steps: GrudgeForestStoryStep[];
  paragraphs: string[];
  clueSummary: string;
  rewardText?: string;
  audioCue?:
    | "whisper"
    | "duy_laugh"
    | "flute"
    | "chime"
    | "twig"
    | "root_erupt"
    | "secret"
    | null;
  progress: GrudgeForestProgressState;
}

export const GRUDGE_FOREST_ZONES: GrudgeForestZoneDef[] = [
  {
    id: "zone_1",
    index: 1,
    x: 80,
    y: 2880,
    w: 1460,
    h: 1040,
    accentColor: "#10B981",
    name: { vi: "Cổng Rừng Không Lối Về", en: "Gate of No Return" },
    subtitle: {
      vi: "Những tấm biển chỉ đường liên tục tự thay đổi chữ viết",
      en: "Ancient stone gate with signposts that rewrite themselves",
    },
  },
  {
    id: "zone_2",
    index: 2,
    x: 80,
    y: 1460,
    w: 1460,
    h: 1380,
    accentColor: "#2DD4BF",
    name: { vi: "Làng Người Mất Tích", en: "Village of the Vanished" },
    subtitle: {
      vi: "Nhà gỗ nguyên vẹn không bóng người — vọng tiếng sinh hoạt bên trong",
      en: "Intact empty homes echoing with indoor voices",
    },
  },
  {
    id: "zone_3",
    index: 3,
    x: 1600,
    y: 100,
    w: 1520,
    h: 1300,
    accentColor: "#A855F7",
    name: { vi: "Hồ Gương Oán Niệm", en: "Mirror Lake of Grudges" },
    subtitle: {
      vi: "Mặt hồ đen phản chiếu sai lệch hành động và bóng người phía sau",
      en: "Black waters reflecting altered deeds and unseen companions",
    },
  },
  {
    id: "zone_4",
    index: 4,
    x: 80,
    y: 100,
    w: 1460,
    h: 1320,
    accentColor: "#94A3B8",
    name: { vi: "Nghĩa Địa Rễ Cây", en: "Root-Swallowed Graveyard" },
    subtitle: {
      vi: "Hàng trăm bia mộ bị rễ cây nuốt chửng cùng những cái tên quen thuộc",
      en: "Root-bound headstones engraved with familiar names",
    },
  },
  {
    id: "zone_5",
    index: 5,
    x: 3180,
    y: 100,
    w: 1540,
    h: 2120,
    accentColor: "#34D399",
    name: { vi: "Mê Cung Cổ Thụ", en: "Labyrinth of Ancient Trees" },
    subtitle: {
      vi: "Lối đi tự dịch chuyển âm thầm khi không ai quan sát",
      en: "Shifting woodland corridors anchored by rotatable stone idols",
    },
  },
  {
    id: "zone_6",
    index: 6,
    x: 3180,
    y: 2280,
    w: 1540,
    h: 1640,
    accentColor: "#F472B6",
    name: { vi: "Điện Thờ Búp Bê", en: "Shrine of Puppets" },
    subtitle: {
      vi: "Ngôi đền gỗ cũ chứa tượng gỗ, búp bê và tranh vẽ các chiến binh",
      en: "Old timber temple housing hero puppets, idols, and portraits",
    },
  },
  {
    id: "zone_7",
    index: 7,
    x: 1600,
    y: 2880,
    w: 1520,
    h: 1040,
    accentColor: "#60A5FA",
    name: { vi: "Thung Lũng Tiếng Gọi", en: "Valley of Calling Voices" },
    subtitle: {
      vi: "Khi đi một mình sẽ nghe giọng đồng đội hoặc chính mình gọi tên",
      en: "Walk alone and hear comrades—or your own voice—calling",
    },
  },
  {
    id: "zone_8",
    index: 8,
    x: 1600,
    y: 1460,
    w: 1520,
    h: 1360,
    accentColor: "#C084FC",
    name: { vi: "Trái Tim Rừng Sâu", en: "Heart of the Deep Woods" },
    subtitle: {
      vi: "Dưới gốc Cổ Thụ hình sinh vật đang ngủ — nơi an nghỉ của bí mật 4 vùng đất",
      en: "Beneath the sleeping Colossus Tree and the Four-Map Altar",
    },
  },
];

export const GRUDGE_FOREST_SIGNPOST_TEXTS: Array<{ vi: string[]; en: string[] }> = [
  {
    vi: [
      "↑ Làng Người Mất Tích (200 bước) · → Thung Lũng Tiếng Gọi",
      "Chữ khắc mới rỉ nhựa: “Đừng đi theo tiếng bước chân phía sau ngươi.”",
    ],
    en: [
      "↑ Village of the Vanished · → Valley of Calling Voices",
      "Fresh sap carving: “Do not follow footsteps behind you.”",
    ],
  },
  {
    vi: [
      "↑ Lối ra: KHÔNG TỒN TẠI · ↓ Lối quay lại: ĐÃ BỊ RỄ CÂY KHÓA",
      "Mặt sau tấm biển ghi bằng mực đen: “Ngươi đã đọc tấm biển này 4 lần rồi.”",
    ],
    en: [
      "↑ Exit: DOES NOT EXIST · ↓ Return: SEALED BY ROOTS",
      "Backside ink: “You have read this signpost four times already.”",
    ],
  },
  {
    vi: [
      "← Nghĩa Địa Rễ Cây · ↑ Trái Tim Rừng Sâu · → Điện Thờ Búp Bê",
      "Dòng chữ nhỏ ở chân gỗ: “Duy đã đổi hướng mũi tên vào lúc rễ cây ngủ.”",
    ],
    en: [
      "← Root Graveyard · ↑ Heart of Deep Woods · → Puppet Shrine",
      "Base engraving: “Duy turned the arrow while the roots slept.”",
    ],
  },
];

export const GRUDGE_FOREST_STATIC_OBSTACLES: GrudgeForestRectObstacle[] = [
  // Outer Forest Perimeter Border
  { id: "gf_border_n", x: 0, y: 0, w: 4800, h: 72, kind: "ancient_trunk", label: "Northern Ancient Canopy" },
  { id: "gf_border_s", x: 0, y: 3928, w: 4800, h: 72, kind: "ancient_trunk", label: "Southern Ancient Canopy" },
  { id: "gf_border_w", x: 0, y: 72, w: 72, h: 3856, kind: "ancient_trunk", label: "Western Ancient Canopy" },
  { id: "gf_border_e", x: 4728, y: 72, w: 72, h: 3856, kind: "ancient_trunk", label: "Eastern Ancient Canopy" },

  // Zone 1: Cổng Rừng Không Lối Về (Gate pillars around Spawn 460, 3560)
  { id: "z1_gate_pillar_w", x: 240, y: 3310, w: 96, h: 120, kind: "stone_gate", label: "Cổng Đá Tây" },
  { id: "z1_gate_pillar_e", x: 600, y: 3310, w: 96, h: 120, kind: "stone_gate", label: "Cổng Đá Đông" },
  { id: "z1_trunk_sw", x: 180, y: 3700, w: 120, h: 110, kind: "ancient_trunk", label: "Cổ Thụ Cổng" },
  { id: "z1_trunk_ne", x: 1260, y: 2940, w: 130, h: 110, kind: "ancient_trunk", label: "Cổ Thụ Ngã Ba" },
  { id: "z1_log_bridge", x: 930, y: 3560, w: 180, h: 52, kind: "fallen_log", label: "Thân Gỗ Mục" },

  // Zone 2: Làng Người Mất Tích
  { id: "z2_house_south", x: 340, y: 2460, w: 230, h: 140, kind: "abandoned_house", label: "Nhà Hoang Phía Nam" },
  { id: "z2_house_whisper", x: 860, y: 2180, w: 250, h: 150, kind: "abandoned_house", label: "Ngôi Nhà Có Tiếng Nói" },
  { id: "z2_house_ledger", x: 1120, y: 1740, w: 230, h: 145, kind: "abandoned_house", label: "Nhà Trưởng Làng" },
  // Secret Puppet House alcove walls (open doorway faces South-East)
  { id: "z2_puppet_house_n", x: 180, y: 1520, w: 300, h: 34, kind: "abandoned_house", label: "Tường Nhà Búp Bê (Bắc)" },
  { id: "z2_puppet_house_w", x: 180, y: 1554, w: 34, h: 240, kind: "abandoned_house", label: "Tường Nhà Búp Bê (Tây)" },
  { id: "z2_puppet_house_e", x: 446, y: 1554, w: 34, h: 120, kind: "abandoned_house", label: "Tường Nhà Búp Bê (Đông)" },
  { id: "z2_puppet_house_door", x: 446, y: 1674, w: 34, h: 120, kind: "conditional_root_door", doorId: "root_door_puppet_house", label: "Cửa Rễ Nhà Rối" },
  { id: "z2_puppet_house_s", x: 180, y: 1794, w: 300, h: 34, kind: "abandoned_house", label: "Tường Nhà Búp Bê (Nam)" },
  { id: "z2_trunk_mid", x: 640, y: 1940, w: 110, h: 110, kind: "ancient_trunk", label: "Cổ Thụ Giữa Làng" },

  // Zone 4: Nghĩa Địa Rễ Cây
  { id: "z4_tomb_cluster_1", x: 260, y: 980, w: 180, h: 86, kind: "tombstone_cluster", label: "Hàng Bia Mộ Rễ Đen" },
  { id: "z4_tomb_cluster_2", x: 760, y: 920, w: 190, h: 86, kind: "tombstone_cluster", label: "Bia Mộ Chiến Binh" },
  { id: "z4_tomb_cluster_3", x: 1080, y: 480, w: 180, h: 90, kind: "tombstone_cluster", label: "Khu Mộ Sương Mù" },
  { id: "z4_ancient_oak", x: 240, y: 240, w: 150, h: 140, kind: "ancient_trunk", label: "Cổ Thụ Nghĩa Địa" },
  { id: "z4_fence_div", x: 1490, y: 120, w: 46, h: 420, kind: "ancient_trunk", label: "Rễ Ranh Giới Tây-Bắc" },
  { id: "z4_fence_div_s", x: 1490, y: 780, w: 46, h: 640, kind: "ancient_trunk", label: "Rễ Ranh Giới Tây" },

  // Zone 3: Hồ Gương Oán Niệm (deep basin obstacle so pier/shores stay walkable)
  { id: "z3_lake_deep_basin", x: 2140, y: 470, w: 440, h: 250, kind: "lake_basin", label: "Lòng Hồ Gương Đen" },
  { id: "z3_trunk_nw", x: 1700, y: 240, w: 130, h: 120, kind: "ancient_trunk", label: "Cổ Thụ Bờ Tây Hồ" },
  { id: "z3_trunk_ne", x: 2880, y: 260, w: 130, h: 120, kind: "ancient_trunk", label: "Cổ Thụ Bờ Đông Hồ" },

  // EE5: Trung's Hidden Wing (between Lake/Heart/Maze: x 2840..3120, y 960..1280)
  { id: "ee5_room_n", x: 2840, y: 950, w: 280, h: 34, kind: "hidden_room_wall", label: "Tường Phòng Trung (Bắc)" },
  { id: "ee5_room_e", x: 3086, y: 984, w: 34, h: 270, kind: "hidden_room_wall", label: "Tường Phòng Trung (Đông)" },
  { id: "ee5_room_s", x: 2840, y: 1254, w: 280, h: 34, kind: "hidden_room_wall", label: "Tường Phòng Trung (Nam)" },
  { id: "ee5_room_door", x: 2840, y: 984, w: 34, h: 270, kind: "conditional_root_door", doorId: "root_door_trung", label: "Cửa Rễ Bị Niêm Phong" },

  // Zone 8: Trái Tim Rừng Sâu (Central Ancient Tree shaped like a sleeping titan)
  { id: "z8_central_great_tree", x: 2240, y: 1730, w: 240, h: 170, kind: "central_great_tree", label: "Cổ Thụ Khổng Lồ Đang Ngủ" },
  { id: "z8_root_pillar_nw", x: 1840, y: 1760, w: 96, h: 96, kind: "ancient_trunk", label: "Rễ Hộ Vệ Tây Bắc" },
  { id: "z8_root_pillar_ne", x: 2780, y: 1760, w: 96, h: 96, kind: "ancient_trunk", label: "Rễ Hộ Vệ Đông Bắc" },
  { id: "z8_root_pillar_sw", x: 1840, y: 2480, w: 96, h: 96, kind: "ancient_trunk", label: "Rễ Hộ Vệ Tây Nam" },
  { id: "z8_root_pillar_se", x: 2780, y: 2480, w: 96, h: 96, kind: "ancient_trunk", label: "Rễ Hộ Vệ Đông Nam" },

  // Zone 5 static frame & Maze Vault Door (opened by rotating 3 stone statues)
  { id: "z5_vault_n", x: 4220, y: 340, w: 340, h: 34, kind: "hidden_room_wall", label: "Kho Cổ Mê Cung (Bắc)" },
  { id: "z5_vault_e", x: 4526, y: 374, w: 34, h: 280, kind: "hidden_room_wall", label: "Kho Cổ Mê Cung (Đông)" },
  { id: "z5_vault_s", x: 4220, y: 654, w: 340, h: 34, kind: "hidden_room_wall", label: "Kho Cổ Mê Cung (Nam)" },
  { id: "z5_vault_door", x: 4220, y: 374, w: 34, h: 280, kind: "conditional_root_door", doorId: "root_door_maze_vault", label: "Cửa Tượng Đá Mê Cung" },

  // Zone 6: Điện Thờ Búp Bê (Old wooden temple with spacious West & South gates)
  { id: "z6_temple_nw", x: 3560, y: 2660, w: 420, h: 38, kind: "temple_wall", label: "Mái Hiền Điện Thờ (Tây Bắc)" },
  { id: "z6_temple_ne", x: 4160, y: 2660, w: 360, h: 38, kind: "temple_wall", label: "Mái Hiền Điện Thờ (Đông Bắc)" },
  { id: "z6_temple_e", x: 4482, y: 2698, w: 38, h: 720, kind: "temple_wall", label: "Vách Gỗ Điện Thờ (Đông)" },
  { id: "z6_temple_se", x: 4160, y: 3380, w: 360, h: 38, kind: "temple_wall", label: "Vách Gỗ Điện Thờ (Đông Nam)" },
  { id: "z6_temple_sw", x: 3560, y: 3380, w: 420, h: 38, kind: "temple_wall", label: "Vách Gỗ Điện Thờ (Tây Nam)" },
  { id: "z6_temple_w_top", x: 3560, y: 2698, w: 38, h: 240, kind: "temple_wall", label: "Cột Điện Thờ (Tây)" },
  { id: "z6_temple_w_bot", x: 3560, y: 3140, w: 38, h: 240, kind: "temple_wall", label: "Cột Điện Thờ (Tây Nam)" },

  // Zone 7: Thung Lũng Tiếng Gọi
  { id: "z7_cliff_w", x: 1760, y: 3180, w: 170, h: 96, kind: "ancient_trunk", label: "Vách Rễ Thung Lũng Tây" },
  { id: "z7_cliff_e", x: 2780, y: 3480, w: 180, h: 96, kind: "ancient_trunk", label: "Vách Rễ Thung Lũng Đông" },
  { id: "z7_divider_n_w", x: 1520, y: 2880, w: 44, h: 360, kind: "ancient_trunk", label: "Rễ Cổng Thung Lũng" },
  { id: "z7_divider_n_e", x: 3130, y: 2880, w: 44, h: 360, kind: "ancient_trunk", label: "Rễ Đường Tắt Đông" },
];

export const GRUDGE_FOREST_MAZE_WALL_SETS: GrudgeForestRectObstacle[][] = [
  // Phase 0: Open North-South Spine & Western Loop
  [
    { id: "maze_p0_1", x: 3380, y: 320, w: 42, h: 340, kind: "maze_root_wall", mazePhase: 0, label: "Rễ Mê Cung A1" },
    { id: "maze_p0_2", x: 3720, y: 540, w: 340, h: 42, kind: "maze_root_wall", mazePhase: 0, label: "Rễ Mê Cung A2" },
    { id: "maze_p0_3", x: 3560, y: 1080, w: 42, h: 380, kind: "maze_root_wall", mazePhase: 0, label: "Rễ Mê Cung A3" },
    { id: "maze_p0_4", x: 4040, y: 1260, w: 360, h: 42, kind: "maze_root_wall", mazePhase: 0, label: "Rễ Mê Cung A4" },
    { id: "maze_p0_5", x: 3440, y: 1800, w: 340, h: 42, kind: "maze_root_wall", mazePhase: 0, label: "Rễ Mê Cung A5" },
  ],
  // Phase 1: Shifted Diagonals & Eastern Loop
  [
    { id: "maze_p1_1", x: 3580, y: 260, w: 340, h: 42, kind: "maze_root_wall", mazePhase: 1, label: "Rễ Mê Cung B1" },
    { id: "maze_p1_2", x: 3920, y: 660, w: 42, h: 340, kind: "maze_root_wall", mazePhase: 1, label: "Rễ Mê Cung B2" },
    { id: "maze_p1_3", x: 3360, y: 1160, w: 360, h: 42, kind: "maze_root_wall", mazePhase: 1, label: "Rễ Mê Cung B3" },
    { id: "maze_p1_4", x: 4280, y: 1120, w: 42, h: 420, kind: "maze_root_wall", mazePhase: 1, label: "Rễ Mê Cung B4" },
    { id: "maze_p1_5", x: 3740, y: 1620, w: 42, h: 340, kind: "maze_root_wall", mazePhase: 1, label: "Rễ Mê Cung B5" },
  ],
  // Phase 2: Twisted Spiral
  [
    { id: "maze_p2_1", x: 3340, y: 540, w: 280, h: 42, kind: "maze_root_wall", mazePhase: 2, label: "Rễ Mê Cung C1" },
    { id: "maze_p2_2", x: 3760, y: 840, w: 42, h: 360, kind: "maze_root_wall", mazePhase: 2, label: "Rễ Mê Cung C2" },
    { id: "maze_p2_3", x: 4160, y: 880, w: 340, h: 42, kind: "maze_root_wall", mazePhase: 2, label: "Rễ Mê Cung C3" },
    { id: "maze_p2_4", x: 3520, y: 1460, w: 400, h: 42, kind: "maze_root_wall", mazePhase: 2, label: "Rễ Mê Cung C4" },
    { id: "maze_p2_5", x: 4180, y: 1660, w: 42, h: 340, kind: "maze_root_wall", mazePhase: 2, label: "Rễ Mê Cung C5" },
  ],
];

export const GRUDGE_FOREST_INITIAL_DESTRUCTIBLES: Array<
  Omit<GrudgeForestVineDestructible, "hp" | "destroyed" | "hitFlash">
> = [
  {
    id: "vine_shortcut_z1_z2",
    x: 680,
    y: 2840,
    w: 170,
    h: 48,
    maxHp: 140,
    hint: {
      vi: "Dây leo sống chặn đường tắt Làng Người Mất Tích — chém phá để mở!",
      en: "Living vines block the Village shortcut — strike to clear!",
    },
  },
  {
    id: "vine_shortcut_z5_z6",
    x: 3940,
    y: 2230,
    w: 220,
    h: 52,
    maxHp: 180,
    hint: {
      vi: "Dây leo gai cổ thụ nối Mê Cung & Điện Thờ Búp Bê — có thể phá hủy.",
      en: "Ancient thorny vines linking Maze & Puppet Shrine — breakable.",
    },
  },
  {
    id: "vine_shortcut_z7_z6",
    x: 3120,
    y: 3440,
    w: 52,
    h: 190,
    maxHp: 160,
    hint: {
      vi: "Rèm dây leo nối Thung Lũng Tiếng Gọi tới Điện Thờ Búp Bê.",
      en: "Vine curtain linking Calling Valley to the Puppet Shrine.",
    },
  },
];

export const GRUDGE_FOREST_INTERACTABLES: GrudgeForestInteractableDef[] = [
  // Zone 1
  {
    id: "gate_signpost_south",
    zoneId: "zone_1",
    x: 660,
    y: 3430,
    radius: 68,
    kind: "signpost",
    heroIdRequired: null,
    docId: "doc_gate_signpost",
    title: { vi: "Biển Chỉ Đường Cổng Rừng", en: "Gatehouse Signpost" },
    shortPrompt: { vi: "Đọc biển chỉ đường đang đổi chữ", en: "Read shifting signpost" },
  },
  {
    id: "gate_signpost_north",
    zoneId: "zone_1",
    x: 1140,
    y: 3140,
    radius: 68,
    kind: "signpost",
    heroIdRequired: null,
    docId: "doc_gate_signpost",
    title: { vi: "Cột Mốc Ngã Ba Sương Mù", en: "Misty Crossroad Marker" },
    shortPrompt: { vi: "Kiểm tra mũi tên chỉ đường", en: "Inspect signpost arrow" },
  },

  // Zone 2
  {
    id: "village_whisper_house",
    zoneId: "zone_2",
    x: 820,
    y: 2260,
    radius: 76,
    kind: "house",
    heroIdRequired: null,
    docId: "doc_village_whispers",
    title: { vi: "Ngôi Nhà Có Tiếng Sinh Hoạt", en: "House of Indoor Voices" },
    shortPrompt: { vi: "Áp tai nghe tiếng nói bên trong", en: "Listen at the intact door" },
  },
  {
    id: "village_ledger_house",
    zoneId: "zone_2",
    x: 1100,
    y: 1930,
    radius: 76,
    kind: "house",
    heroIdRequired: null,
    docId: "doc_village_ledger",
    title: { vi: "Sổ Điểm Danh Làng Người Mất Tích", en: "Missing Village Rollbook" },
    shortPrompt: { vi: "Mở sổ điểm danh bỏ ngỏ", en: "Inspect village rollbook" },
  },
  {
    id: "ee1_secret_puppet_house",
    zoneId: "zone_2",
    x: 330,
    y: 1680,
    radius: 76,
    kind: "ee1",
    heroIdRequired: "duy",
    docId: "doc_ee1_puppets",
    title: { vi: "Căn Nhà Bí Mật Của Những Con Rối", en: "Secret House of Disobedient Puppets" },
    shortPrompt: { vi: "Bước vào căn nhà có hình nộm các tướng", en: "Inspect the hidden puppet room" },
  },

  // Zone 3
  {
    id: "ee2_mirror_lake_bank",
    zoneId: "zone_3",
    x: 2360,
    y: 780,
    radius: 88,
    kind: "ee2",
    heroIdRequired: null,
    docId: "doc_ee2_mirror_lake",
    title: { vi: "Bờ Hồ Gương Oán Niệm", en: "Bank of the Mirror Lake" },
    shortPrompt: { vi: "Nhìn xuống mặt hồ đen phản chiếu", en: "Gaze into the black mirror water" },
  },

  // Zone 4
  {
    id: "ee3_hero_tombstones",
    zoneId: "zone_4",
    x: 520,
    y: 880,
    radius: 80,
    kind: "ee3",
    heroIdRequired: null,
    docId: "doc_ee3_graveyard",
    title: { vi: "Hàng Bia Mộ Không Có Người Chết", en: "Tombstones Without the Dead" },
    shortPrompt: { vi: "Đọc những cái tên bị cào xước trên đá", en: "Read the scratched names" },
  },
  {
    id: "ee3_duy_tombstone",
    zoneId: "zone_4",
    x: 910,
    y: 620,
    radius: 76,
    kind: "ee3",
    heroIdRequired: null,
    docId: "doc_ee3_duy_stone",
    title: { vi: "Bia Mộ Khắc Tên “DUY”", en: "Headstone Marked “DUY”" },
    shortPrompt: { vi: "Chạm vào tấm bia rễ cây quấn quanh", en: "Touch the root-bound stone" },
  },
  {
    id: "ee3_mathach_tombstone",
    zoneId: "zone_4",
    x: 420,
    y: 430,
    radius: 74,
    kind: "ee3",
    heroIdRequired: null,
    docId: "doc_ee3_mathach",
    title: { vi: "Bia Đá Khắc Ký Hiệu Ma Thạch", en: "Headstone With Ma Thạch Crest" },
    shortPrompt: { vi: "Quan sát dấu ấn cổ không lời giải", en: "Inspect the unexplained crest" },
  },

  // Zone 5
  {
    id: "statue_maze_west",
    zoneId: "zone_5",
    x: 3520,
    y: 760,
    radius: 74,
    kind: "statue",
    heroIdRequired: null,
    title: { vi: "Tượng Đá Cổ Mê Cung (Tây)", en: "Ancient Maze Idol (West)" },
    shortPrompt: { vi: "Xoay tượng đá phủ rêu", en: "Rotate mossy stone idol" },
  },
  {
    id: "statue_maze_center",
    zoneId: "zone_5",
    x: 4020,
    y: 1040,
    radius: 74,
    kind: "statue",
    heroIdRequired: null,
    title: { vi: "Tượng Đá Cổ Mê Cung (Giữa)", en: "Ancient Maze Idol (Center)" },
    shortPrompt: { vi: "Xoay tượng đá phủ rêu", en: "Rotate mossy stone idol" },
  },
  {
    id: "statue_maze_south",
    zoneId: "zone_5",
    x: 3780,
    y: 1680,
    radius: 74,
    kind: "statue",
    heroIdRequired: null,
    title: { vi: "Tượng Đá Cổ Mê Cung (Nam)", en: "Ancient Maze Idol (South)" },
    shortPrompt: { vi: "Xoay tượng đá phủ rêu", en: "Rotate mossy stone idol" },
  },
  {
    id: "maze_vault_weapon",
    zoneId: "zone_5",
    x: 4388,
    y: 514,
    radius: 74,
    kind: "vault_weapon",
    heroIdRequired: null,
    title: { vi: "Bệ Vũ Khí Huyền Thoại Cổ Xưa", en: "Ancient Mythic Weapon Pedestal" },
    shortPrompt: { vi: "Nhận Vũ Khí Huyền Thoại Ngẫu Nhiên", en: "Claim Random Mythic Weapon" },
  },

  // Zone 6
  {
    id: "ee1_rogue_puppet_plaza",
    zoneId: "zone_6",
    x: 3440,
    y: 3020,
    radius: 82,
    kind: "ee1",
    heroIdRequired: "duy",
    docId: "doc_ee1_puppets",
    title: { vi: "Sân Rối Trước Điện Thờ", en: "Shrine Puppet Courtyard" },
    shortPrompt: { vi: "Quan sát những con rối đang tự quay đầu", en: "Observe the turning puppets" },
  },
  {
    id: "doll_temple_altar",
    zoneId: "zone_6",
    x: 3980,
    y: 3020,
    radius: 84,
    kind: "temple",
    heroIdRequired: null,
    docId: "doc_doll_temple",
    title: { vi: "Bàn Thờ Búp Bê & Sợi Chỉ Vô Hình", en: "Altar of Dolls & Unseen Threads" },
    shortPrompt: { vi: "Kiểm tra những con rối gỗ trên bàn thờ", en: "Examine the wooden dolls" },
  },
  {
    id: "doll_temple_paintings",
    zoneId: "zone_6",
    x: 4280,
    y: 2820,
    radius: 76,
    kind: "temple",
    heroIdRequired: null,
    docId: "doc_temple_paintings",
    title: { vi: "Hành Lang Tranh Các Chiến Binh", en: "Gallery of Hero Portraits" },
    shortPrompt: { vi: "Xem tranh vẽ các nhân vật bị rễ cây đè nét", en: "Inspect the root-stained portraits" },
  },

  // Zone 7
  {
    id: "ee4_valley_calling_point",
    zoneId: "zone_7",
    x: 2120,
    y: 3440,
    radius: 84,
    kind: "ee4",
    heroIdRequired: null,
    docId: "doc_ee4_valley",
    title: { vi: "Khoảng Sương Tiếng Gọi", en: "Mist of Familiar Voices" },
    shortPrompt: { vi: "Lắng nghe giọng nói giữa sương mù", en: "Listen to the calling fog" },
  },
  {
    id: "ee4_valley_echo_shrine",
    zoneId: "zone_7",
    x: 2680,
    y: 3260,
    radius: 80,
    kind: "ee4",
    heroIdRequired: null,
    docId: "doc_ee4_valley",
    title: { vi: "Bóng Người Trong Thung Lũng", en: "Figure in the Echo Valley" },
    shortPrompt: { vi: "Tiến lại gần bóng dáng quen thuộc", en: "Approach the familiar figure" },
  },

  // EE5
  {
    id: "ee5_trung_hidden_room",
    zoneId: "zone_3",
    x: 2970,
    y: 1120,
    radius: 84,
    kind: "ee5",
    heroIdRequired: null,
    docId: "doc_ee5_trung_room",
    title: { vi: "Căn Phòng Bí Mật Của Trung", en: "Trung's Hidden Study" },
    shortPrompt: { vi: "Đọc bản đồ 4 vùng đất & bức thư dang dở", en: "Read the 4-region map & unfinished letter" },
  },

  // Zone 8
  {
    id: "ee6_four_map_altar",
    zoneId: "zone_8",
    x: 2640,
    y: 2060,
    radius: 84,
    kind: "ee6",
    heroIdRequired: null,
    docId: "doc_ee6_four_maps",
    title: { vi: "Đài Liên Kết Bốn Vùng Đất", en: "Altar of the Four Lands" },
    shortPrompt: { vi: "Đặt ký ức 4 bản đồ lên rễ cổ thụ", en: "Resonate all 4 map secrets" },
  },
  {
    id: "forest_heart_boss_altar",
    zoneId: "zone_8",
    x: 2360,
    y: 2180,
    radius: 92,
    kind: "boss_altar",
    heroIdRequired: null,
    title: { vi: "Rễ Tim Cổ Thụ Khổng Lồ", en: "Heart-Root of the Sleeping Tree" },
    shortPrompt: { vi: "Đánh thức thứ đang ngủ dưới gốc cổ thụ", en: "Stir what sleeps beneath the roots" },
  },
  {
    id: "ending_moving_root",
    zoneId: "zone_8",
    x: 2360,
    y: 2050,
    radius: 84,
    kind: "ending_root",
    heroIdRequired: null,
    docId: "doc_ending_root",
    title: { vi: "Sợi Rễ Duy Nhất Còn Cử Động", en: "The Single Moving Root" },
    shortPrompt: { vi: "Chạm vào sợi rễ vẫn đang thở nhẹ giữa bãi trống", en: "Inspect the slowly breathing root" },
  },
];

export const GRUDGE_FOREST_DOCS: Record<string, GrudgeForestDocEntry> = {
  doc_gate_signpost: {
    id: "doc_gate_signpost",
    code: "RON-01",
    zoneId: "zone_1",
    category: "echo",
    title: { vi: "Tấm Biển Tự Đổi Chữ", en: "The Mutating Signpost" },
    subtitle: { vi: "CỔNG RỪNG KHÔNG LỐI VỀ", en: "GATE OF NO RETURN" },
    paragraphs: [
      {
        vi: "Mũi tên gỗ mục xoay nhẹ mỗi khi người lữ hành ngoảnh mặt đi. Lớp rêu phủ kín dòng chữ cũ, để lộ những câu cảnh báo mới như vừa được móng tay cào lên.",
        en: "The rotted pointer subtly pivots whenever travelers look away, revealing fresh warnings clawed beneath old moss.",
      },
      {
        vi: "Không ai tìm thấy dấu vết của người dựng biển — chỉ có những nhánh rễ quấn chặt vào chân cột như thể chính khu rừng đang tự viết lại bản đồ của nó.",
        en: "No builder left footprints here; roots wrap the post tightly, as though the forest itself rewrites its own directions.",
      },
    ],
  },
  doc_village_whispers: {
    id: "doc_village_whispers",
    code: "RON-02",
    zoneId: "zone_2",
    category: "echo",
    title: { vi: "Tiếng Sinh Hoạt Sau Cánh Cửa Khép", en: "Voices Behind Shut Doors" },
    subtitle: { vi: "LÀNG NGƯỜI MẤT TÍCH", en: "VILLAGE OF THE VANISHED" },
    paragraphs: [
      {
        vi: "Bát đũa va chạm lách cách, tiếng ru con khe khẽ và hơi ấm bếp củi vọng qua khe cửa gỗ — nhưng ngay khi đẩy cửa bước vào, căn phòng lạnh ngắt, bụi phủ dày hàng thập kỷ.",
        en: "Clinking bowls and a soft lullaby drift from behind bolted shutters — yet opening the door reveals only dust untouched for decades.",
      },
    ],
  },
  doc_village_ledger: {
    id: "doc_village_ledger",
    code: "RON-03",
    zoneId: "zone_2",
    category: "diary",
    title: { vi: "Trang Sổ Cuối Của Trưởng Làng", en: "Last Ledger of the Vanished" },
    subtitle: { vi: "NHẬT KÝ LÀNG MẤT TÍCH", en: "MISSING VILLAGE LEDGER" },
    paragraphs: [
      {
        vi: "“Ngày 14: Người đàn ông tên Duy đến hỏi đường vào Trái Tim Rừng. Hắn mang theo ba con rối gỗ không mặt. Đêm đó cả làng nghe tiếng sáo từ phía cây cổ thụ.”",
        en: "“Day 14: A man named Duy asked the way to the Heart of the Woods, carrying three faceless wooden puppets. That night a flute echoed from the colossal tree.”",
      },
      {
        vi: "“Ngày 15: Không ai mất tích. Tất cả vẫn đang trả lời tên mình trong nhà... dù ngoài đường chẳng còn bóng ai.”",
        en: "“Day 15: Nobody went missing. Everyone still answers their names indoors... though the streets stand empty.”",
      },
    ],
  },
  doc_ee1_puppets: {
    id: "doc_ee1_puppets",
    code: "EE-01",
    zoneId: "zone_2",
    category: "ritual",
    heroTag: "DUY",
    title: { vi: "Những Con Rối Không Nghe Lời", en: "Disobedient Puppets" },
    subtitle: { vi: "CĂN NHÀ BÍ MẬT · SỢI CHỈ ĐẢO CHIỀU", en: "SECRET HOUSE · REVERSED STRINGS" },
    paragraphs: [
      {
        vi: "Khi Duy đứng bất động giữa khu rừng, một con rối gỗ tự bước khỏi hàng, rẽ qua màn sương và dẫn thẳng về căn nhà bỏ hoang bị rễ cây bao bọc.",
        en: "Standing motionless, Duy watches a single puppet step out on its own, slipping through fog toward a root-draped secret house.",
      },
      {
        vi: "Bên trong là hàng loạt con rối mang khuôn mặt của Tín, Bảo, Dũng, Long Hói, Éo Hyên, Thanh, Minh, Phong — và một con rối giống hệt Duy không có dây điều khiển. Trên tường khắc dòng chữ: “Ngươi tưởng mình đang điều khiển chúng sao?”",
        en: "Inside sit puppets carved in the likenesses of all Arena heroes — plus an unstrung puppet of Duy. Carved across the wall: “Did you think you were the one pulling their strings?”",
      },
    ],
  },
  doc_ee2_mirror_lake: {
    id: "doc_ee2_mirror_lake",
    code: "EE-02",
    zoneId: "zone_3",
    category: "ritual",
    title: { vi: "Ảo Ảnh Mặt Hồ Đen", en: "Vision in the Black Mirror" },
    subtitle: { vi: "HỒ GƯƠNG OÁN NIỆM", en: "MIRROR LAKE OF GRUDGES" },
    paragraphs: [
      {
        vi: "Mặt hồ không phản chiếu động tác hiện tại mà lặp lại một khoảnh khắc khác — đôi khi hiện thêm một bóng người đứng ngay sau lưng không hề tồn tại trên bờ.",
        en: "The obsidian water reflects lagged gestures and, during fleeting ripples, an extra figure standing silently directly behind you.",
      },
      {
        vi: "Khi chạm nước đúng thời điểm cộng hưởng, đáy hồ hiện ra Cổ Thành Huyết Táng hoặc Hỏa Ngục Tàn Tro bị rễ cây đen xuyên thủng — như thể ký ức bốn vùng đất cùng chung một mặt gương.",
        en: "Disturbing the water during resonance reveals distorted visions of the Blood Citadel or Inferno of Ashes entwined in black forest roots.",
      },
    ],
  },
  doc_ee3_graveyard: {
    id: "doc_ee3_graveyard",
    code: "EE-03A",
    zoneId: "zone_4",
    category: "archive",
    title: { vi: "Những Bia Mộ Không Có Người Chết", en: "Tombstones Without Corpses" },
    subtitle: { vi: "NGHĨA ĐỊA RỄ CÂY", en: "ROOT-SWALLOWED GRAVEYARD" },
    paragraphs: [
      {
        vi: "Trên hàng trăm tấm bia đá bị rễ cây ôm chặt hiện rõ tên của những chiến binh quen thuộc — nhiều dòng tên bị cào rách bươm như ai đó từng cố xóa bỏ số phận của chính mình.",
        en: "Root-clasped headstones carry familiar hero names — several violently gouged out, as though someone tried scratching away their own fate.",
      },
    ],
  },
  doc_ee3_duy_stone: {
    id: "doc_ee3_duy_stone",
    code: "EE-03B",
    zoneId: "zone_4",
    category: "echo",
    heroTag: "DUY",
    title: { vi: "Bia Mộ Khắc Tên Duy", en: "Headstone Bearing Duy's Name" },
    subtitle: { vi: "TIẾNG CƯỜI DƯỚI LÒNG ĐẤT", en: "LAUGHTER BENEATH THE ROOTS" },
    paragraphs: [
      {
        vi: "Tấm bia đá khắc chữ 'DUY' không có ngày mất. Ngay khi chạm vào bề mặt lạnh toát, tiếng cười khẽ quen thuộc của Duy vang lên từ mọi tán cây xung quanh — dù không thể phân biệt đó là ký ức của hắn, lời nhạo báng của khu rừng, hay một thỏa thuận từ rất lâu trước đây.",
        en: "The stone marked 'DUY' lacks a date of death. Touching it unleashes Duy's quiet, eerie laugh across the canopy — leaving no answer as to whether the forest mocks him or obeys a forgotten pact.",
      },
    ],
  },
  doc_ee3_mathach: {
    id: "doc_ee3_mathach",
    code: "EE-03C",
    zoneId: "zone_4",
    category: "archive",
    title: { vi: "Tấm Bia Mang Dấu Ấn Ma Thạch", en: "Headstone of the Ma Thạch Mark" },
    subtitle: { vi: "DẤU TÍCH TỪ CỔ THÀNH HUYẾT TÁNG", en: "RELIC OF MAP 1 · UNEXPLAINED" },
    paragraphs: [
      {
        vi: "Một tấm bia đá không ghi tên người — chỉ khắc sâu biểu tượng Ma Thạch của Cổ Thành Huyết Táng. Không có hồ sơ, không có lời giải thích nào bên cạnh.",
        en: "An unmarked monolith carved deeply with the Blood Citadel's Ma Thạch symbol. No inscription or ledger explains how it took root here.",
      },
    ],
  },
  doc_doll_temple: {
    id: "doc_doll_temple",
    code: "RON-06",
    zoneId: "zone_6",
    category: "ritual",
    title: { vi: "Nghi Thức Điều Rối Cổ Đại", en: "Rite of the Puppet Shrine" },
    subtitle: { vi: "ĐIỆN THỜ BÚP BÊ", en: "SHRINE OF PUPPETS" },
    paragraphs: [
      {
        vi: "Duy từng tin rằng chỉ cần nắm được lõi gỗ linh hồn trong Điện Thờ, hắn sẽ điều khiển toàn bộ sinh vật rừng sâu. Nhưng những mảnh gỗ dưới chân bàn thờ đều tự khâu lại thành hình dáng kẻ đang đứng nhìn chúng.",
        en: "Duy believed seizing the Shrine's core idol would bind the forest to his will — yet splintered wood beneath the altar stitches itself into whoever gazes upon it.",
      },
    ],
  },
  doc_temple_paintings: {
    id: "doc_temple_paintings",
    code: "RON-07",
    zoneId: "zone_6",
    category: "archive",
    title: { vi: "Những Bức Tranh Trong Đền Cũ", en: "Portraits Inside the Old Shrine" },
    subtitle: { vi: "ĐIỆN THỜ BÚP BÊ", en: "SHRINE OF PUPPETS" },
    paragraphs: [
      {
        vi: "Mỗi bức họa trên vách gỗ đều vẽ một chiến binh của Đấu Trường — đôi mắt trong tranh được khảm nhựa cây sẫm màu, khẽ dõi theo bước chân người đi ngang qua.",
        en: "Every wooden canvas portrays an Arena hero, eyes inlaid with dark amber resin that faintly tracks passersby.",
      },
    ],
  },
  doc_ee4_valley: {
    id: "doc_ee4_valley",
    code: "EE-04",
    zoneId: "zone_7",
    category: "echo",
    title: { vi: "Tiếng Gọi Trong Thung Lũng", en: "The Voice in the Valley" },
    subtitle: { vi: "THUNG LŨNG TIẾNG GỌI", en: "VALLEY OF CALLING VOICES" },
    paragraphs: [
      {
        vi: "Khi tách khỏi đồng đội trong làn sương xanh tím, giọng nói quen thuộc gọi đúng tên ngươi từ phía trước. Bóng người chờ sẵn ở cuối lối mòn bỗng hóa thành quái vật hoặc tan biến không dấu vết.",
        en: "Walking alone through violet fog draws a familiar voice calling your name. The waiting silhouette either twists into an ambushing mimic or vanishes without a trace.",
      },
      {
        vi: "Không có bất kỳ dấu hiệu nào chứng minh những ký ức vọng lại trong thung lũng là thật — hay chỉ do khu rừng tự dệt nên.",
        en: "Nothing confirms whether those echoed memories ever truly happened, or whether the forest weaves them out of thin air.",
      },
    ],
  },
  doc_ee5_trung_room: {
    id: "doc_ee5_trung_room",
    code: "EE-05",
    zoneId: "zone_3",
    category: "letter",
    heroTag: "TRUNG",
    title: { vi: "Căn Phòng Của Trung", en: "Trung's Hidden Chamber" },
    subtitle: { vi: "BẢN ĐỒ 4 VÙNG ĐẤT · BỨC THƯ DANG DỞ", en: "FOUR-REGION MAP · UNFINISHED LETTER" },
    paragraphs: [
      {
        vi: "Sau khi mở khóa trình tự tại Hồ Gương và Nghĩa Địa Rễ Cây, cánh cửa rễ dẫn vào căn phòng kín hé mở: trên bàn trải rộng bản đồ cả 4 vùng đất với nhiều vị trí được khoanh mực đỏ từ rất lâu, bên cạnh là một chiếc ghế trống.",
        en: "Unlocking the Mirror Lake and Root Graveyard sequence parts a sealed chamber: across the desk lies a pre-marked map of all four lands beside an empty chair.",
      },
      {
        vi: "Trên tờ giấy ngả màu đặt dưới nghiên mực còn nguyên nét bút dang dở của Trung: “Duy không phải kẻ đầu tiên muốn sở hữu khu rừng. Và cũng sẽ không phải kẻ cuối cùng.”",
        en: "Beside an untouched inkwell rests Trung's unfinished letter: “Duy is not the first who sought to possess this forest. And he will not be the last.”",
      },
    ],
  },
  doc_ee6_four_maps: {
    id: "doc_ee6_four_maps",
    code: "EE-06",
    zoneId: "zone_8",
    category: "archive",
    title: { vi: "Bí Mật Liên Kết Bốn Bản Đồ", en: "Link of the Four Realms" },
    subtitle: { vi: "TRÁI TIM RỪNG SÂU · KÝ ỨC CHUNG", en: "HEART OF THE WOODS · FOUR-MAP CONVERGENCE" },
    paragraphs: [
      {
        vi: "Khi bí mật từ Cổ Thành Huyết Táng, Hỏa Ngục Tàn Tro, Băng Mộ Vĩnh Cửu và Rừng Oán Niệm cùng cộng hưởng dưới gốc Cổ Thụ Khổng Lồ, bốn biểu tượng cổ cùng phát sáng trên mặt rễ đen.",
        en: "As secrets from Blood Citadel, Inferno of Ashes, Eternal Frozen Tomb, and Grudge Forest converge beneath the Great Tree, four ancient crests ignite across the black roots.",
      },
      {
        vi: "“Máu có thể đánh thức. Ký ức có thể thay đổi. Phong ấn có thể giam giữ. Nhưng rễ cây... có thể giữ lại những gì cả thế giới muốn quên.”",
        en: "“Blood can awaken. Memory can be altered. Seals can imprison. Yet the roots... can preserve whatever the entire world wished to forget.”",
      },
    ],
  },
  doc_ending_root: {
    id: "doc_ending_root",
    code: "END-04",
    zoneId: "zone_8",
    category: "echo",
    title: { vi: "Bãi Đất Trống Sau Trận Chiến", en: "The Empty Clearing After Battle" },
    subtitle: { vi: "KHÔNG XÁC NHẬN ĐÃ CHẾT", en: "DEATH UNCONFIRMED" },
    paragraphs: [
      {
        vi: "Sương tan nhẹ quanh gốc Cổ Thụ Khổng Lồ. Không có xác trùm, không có tro tàn hay chiến lợi phẩm — chỉ còn một bãi đất trống rộng lớn và một sợi rễ đơn độc vẫn đang khẽ cử động chậm rãi trong bóng tối.",
        en: "Mist parts around the colossal tree. Neither corpse nor ash remains — only an empty clearing and a single solitary root shifting slowly in the dark.",
      },
    ],
  },
};

export function createDefaultGrudgeForestProgress(): GrudgeForestProgressState {
  return {
    ee1RoguePuppetSeen: false,
    ee1SecretHouseSeen: false,
    ee2MirrorLakeSeen: false,
    ee3HeroStonesSeen: false,
    ee3DuyLaughHeard: false,
    ee3MaThachStoneSeen: false,
    ee4ValleyCallSeen: false,
    ee5TrungRoomUnlocked: false,
    ee5TrungRoomSeen: false,
    ee6FourMapSecretSeen: false,
    statuesAligned: false,
    introNarrativeSeen: false,
    bossClearedAmbiguous: false,
    endingRootSeen: false,
    collectedDocs: [],
    inspectedNodes: [],
    destroyedVines: [],
  };
}

export function normalizeGrudgeForestProgress(
  raw: Partial<GrudgeForestProgressState> | unknown
): GrudgeForestProgressState {
  const base = createDefaultGrudgeForestProgress();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const ee2 = Boolean(r.ee2MirrorLakeSeen);
  const ee3 = Boolean(r.ee3DuyLaughHeard) || Boolean(r.ee3MaThachStoneSeen);
  return {
    ee1RoguePuppetSeen: Boolean(r.ee1RoguePuppetSeen),
    ee1SecretHouseSeen: Boolean(r.ee1SecretHouseSeen),
    ee2MirrorLakeSeen: ee2,
    ee3HeroStonesSeen: Boolean(r.ee3HeroStonesSeen),
    ee3DuyLaughHeard: Boolean(r.ee3DuyLaughHeard),
    ee3MaThachStoneSeen: Boolean(r.ee3MaThachStoneSeen),
    ee4ValleyCallSeen: Boolean(r.ee4ValleyCallSeen),
    ee5TrungRoomUnlocked: Boolean(r.ee5TrungRoomUnlocked) || (ee2 && ee3),
    ee5TrungRoomSeen: Boolean(r.ee5TrungRoomSeen),
    ee6FourMapSecretSeen: Boolean(r.ee6FourMapSecretSeen),
    statuesAligned: Boolean(r.statuesAligned),
    introNarrativeSeen: Boolean(r.introNarrativeSeen),
    bossClearedAmbiguous: Boolean(r.bossClearedAmbiguous),
    endingRootSeen: Boolean(r.endingRootSeen),
    collectedDocs: Array.isArray(r.collectedDocs)
      ? Array.from(new Set(r.collectedDocs.map((x) => String(x)).filter(Boolean)))
      : [],
    inspectedNodes: Array.isArray(r.inspectedNodes)
      ? Array.from(new Set(r.inspectedNodes.map((x) => String(x)).filter(Boolean))) as GrudgeForestInteractableId[]
      : [],
    destroyedVines: Array.isArray(r.destroyedVines)
      ? Array.from(new Set(r.destroyedVines.map((x) => String(x)).filter(Boolean)))
      : [],
  };
}

export function mergeGrudgeForestProgress(
  a?: Partial<GrudgeForestProgressState> | null,
  b?: Partial<GrudgeForestProgressState> | null
): GrudgeForestProgressState {
  const na = normalizeGrudgeForestProgress(a);
  const nb = normalizeGrudgeForestProgress(b);
  const ee2 = na.ee2MirrorLakeSeen || nb.ee2MirrorLakeSeen;
  const ee3 =
    na.ee3DuyLaughHeard ||
    nb.ee3DuyLaughHeard ||
    na.ee3MaThachStoneSeen ||
    nb.ee3MaThachStoneSeen;
  return {
    ee1RoguePuppetSeen: na.ee1RoguePuppetSeen || nb.ee1RoguePuppetSeen,
    ee1SecretHouseSeen: na.ee1SecretHouseSeen || nb.ee1SecretHouseSeen,
    ee2MirrorLakeSeen: ee2,
    ee3HeroStonesSeen: na.ee3HeroStonesSeen || nb.ee3HeroStonesSeen,
    ee3DuyLaughHeard: na.ee3DuyLaughHeard || nb.ee3DuyLaughHeard,
    ee3MaThachStoneSeen: na.ee3MaThachStoneSeen || nb.ee3MaThachStoneSeen,
    ee4ValleyCallSeen: na.ee4ValleyCallSeen || nb.ee4ValleyCallSeen,
    ee5TrungRoomUnlocked: na.ee5TrungRoomUnlocked || nb.ee5TrungRoomUnlocked || (ee2 && ee3),
    ee5TrungRoomSeen: na.ee5TrungRoomSeen || nb.ee5TrungRoomSeen,
    ee6FourMapSecretSeen: na.ee6FourMapSecretSeen || nb.ee6FourMapSecretSeen,
    statuesAligned: na.statuesAligned || nb.statuesAligned,
    introNarrativeSeen: na.introNarrativeSeen || nb.introNarrativeSeen,
    bossClearedAmbiguous: na.bossClearedAmbiguous || nb.bossClearedAmbiguous,
    endingRootSeen: na.endingRootSeen || nb.endingRootSeen,
    collectedDocs: Array.from(new Set([...na.collectedDocs, ...nb.collectedDocs])),
    inspectedNodes: Array.from(new Set([...na.inspectedNodes, ...nb.inspectedNodes])),
    destroyedVines: Array.from(new Set([...na.destroyedVines, ...nb.destroyedVines])),
  };
}

export function countGrudgeForestSecrets(progress: Partial<GrudgeForestProgressState>): number {
  const n = normalizeGrudgeForestProgress(progress);
  let c = 0;
  if (n.ee1SecretHouseSeen) c++;
  if (n.ee2MirrorLakeSeen) c++;
  if (n.ee3DuyLaughHeard || n.ee3MaThachStoneSeen) c++;
  if (n.ee4ValleyCallSeen) c++;
  if (n.ee5TrungRoomSeen) c++;
  if (n.ee6FourMapSecretSeen) c++;
  return c;
}

export function createInitialGrudgeForestRuntimeState(
  progress?: Partial<GrudgeForestProgressState>
): GrudgeForestRuntimeState {
  const norm = normalizeGrudgeForestProgress(progress);
  return {
    mapId: "grudge_forest",
    mazePhase: 0,
    mazeShiftTimer: 16,
    pendingMazeShift: false,
    signpostVariant: 0,
    signpostTimer: 9,
    mirrorCycleSec: 0,
    mirrorResonanceWindow: 2.2,
    mirrorVisionMap: "map1",
    duyIdleSec: 0,
    duyLastX: GRUDGE_FOREST_SPAWN.x,
    duyLastY: GRUDGE_FOREST_SPAWN.y,
    roguePuppet: {
      active: false,
      arrived: false,
      x: 840,
      y: 2040,
      targetIndex: 0,
      waypoints: [
        { x: 640, y: 1860 },
        { x: 520, y: 1730 },
        { x: 350, y: 1680 },
      ],
      angle: Math.PI,
      stepPhase: 0,
    },
    valleyAloneTimer: 0,
    valleyVoiceCooldown: 0,
    falseMemoryFlash: { kind: null, timer: 0 },
    inSilenceZone: false,
    statues: [
      {
        id: "statue_maze_west",
        x: 3520,
        y: 760,
        angleIndex: norm.statuesAligned ? 2 : 0,
        targetIndex: 2,
        label: { vi: "Tượng Tây", en: "West Idol" },
      },
      {
        id: "statue_maze_center",
        x: 4020,
        y: 1040,
        angleIndex: norm.statuesAligned ? 1 : 3,
        targetIndex: 1,
        label: { vi: "Tượng Giữa", en: "Center Idol" },
      },
      {
        id: "statue_maze_south",
        x: 3780,
        y: 1680,
        angleIndex: norm.statuesAligned ? 3 : 1,
        targetIndex: 3,
        label: { vi: "Tượng Nam", en: "South Idol" },
      },
    ],
    destructibles: GRUDGE_FOREST_INITIAL_DESTRUCTIBLES.map((d) => {
      const destroyed = norm.destroyedVines.includes(d.id);
      return {
        ...d,
        hp: destroyed ? 0 : d.maxHp,
        destroyed,
        hitFlash: 0,
      };
    }),
    mushrooms: [
      { id: "mush_guide_1", x: 580, y: 2740, kind: "guide", radius: 46, cooldown: 0, triggeredCount: 0, pulsePhase: 0 },
      { id: "mush_guide_2", x: 1860, y: 1320, kind: "guide", radius: 46, cooldown: 0, triggeredCount: 0, pulsePhase: 1.4 },
      { id: "mush_guide_3", x: 3260, y: 1940, kind: "guide", radius: 46, cooldown: 0, triggeredCount: 0, pulsePhase: 2.3 },
      { id: "mush_trap_1", x: 1180, y: 2420, kind: "lure_trap", radius: 58, cooldown: 0, triggeredCount: 0, pulsePhase: 0.7 },
      { id: "mush_trap_2", x: 2640, y: 1120, kind: "lure_trap", radius: 60, cooldown: 0, triggeredCount: 0, pulsePhase: 1.9 },
      { id: "mush_trap_3", x: 3860, y: 1340, kind: "lure_trap", radius: 60, cooldown: 0, triggeredCount: 0, pulsePhase: 2.8 },
      { id: "mush_trap_4", x: 2420, y: 3140, kind: "lure_trap", radius: 58, cooldown: 0, triggeredCount: 0, pulsePhase: 3.6 },
    ],
    rootTraps: [
      { id: "root_trap_z2", x: 760, y: 2040, radius: 74, state: "cooldown", timer: 2.2, cooldownDuration: 9.5, didRoot: false },
      { id: "root_trap_z4", x: 700, y: 740, radius: 78, state: "cooldown", timer: 3.1, cooldownDuration: 9.0, didRoot: false },
      { id: "root_trap_z5", x: 3680, y: 920, radius: 76, state: "cooldown", timer: 2.5, cooldownDuration: 8.5, didRoot: false },
      { id: "root_trap_z6", x: 3740, y: 2980, radius: 78, state: "cooldown", timer: 3.6, cooldownDuration: 9.2, didRoot: false },
      { id: "root_trap_z7", x: 2340, y: 3340, radius: 78, state: "cooldown", timer: 2.9, cooldownDuration: 9.5, didRoot: false },
      { id: "root_trap_z8", x: 2140, y: 2180, radius: 80, state: "cooldown", timer: 3.4, cooldownDuration: 8.8, didRoot: false },
    ],
    fogPockets: [
      { id: "fog_z2", zoneId: "zone_2", x: 640, y: 1860, radius: 195, density: 0.72, phase: 0.4 },
      { id: "fog_z4", zoneId: "zone_4", x: 840, y: 420, radius: 210, density: 0.78, phase: 1.7 },
      { id: "fog_z5", zoneId: "zone_5", x: 3920, y: 1420, radius: 225, density: 0.76, phase: 2.9 },
      { id: "fog_z7", zoneId: "zone_7", x: 2380, y: 3420, radius: 240, density: 0.84, phase: 4.1 },
    ],
    fallingTrees: [
      { id: "fall_tree_z2", x: 1240, y: 2180, w: 190, h: 48, triggerX: 1320, triggerY: 2280, state: "standing", timer: 0, didHit: false },
      { id: "fall_tree_z5", x: 3460, y: 1440, w: 48, h: 190, triggerX: 3560, triggerY: 1520, state: "standing", timer: 0, didHit: false },
      { id: "fall_tree_z7", x: 1980, y: 3280, w: 185, h: 48, triggerX: 2040, triggerY: 3380, state: "standing", timer: 0, didHit: false },
    ],
    ambushPoints: [
      { id: "amb_z2", zoneId: "zone_2", x: 740, y: 2420, triggerRadius: 180, spawnRadius: 210, state: "armed", timer: 0 },
      { id: "amb_z4", zoneId: "zone_4", x: 680, y: 660, triggerRadius: 190, spawnRadius: 220, state: "armed", timer: 0 },
      { id: "amb_z5", zoneId: "zone_5", x: 3860, y: 1220, triggerRadius: 195, spawnRadius: 220, state: "armed", timer: 0 },
      { id: "amb_z6", zoneId: "zone_6", x: 3860, y: 2860, triggerRadius: 195, spawnRadius: 220, state: "armed", timer: 0 },
      { id: "amb_z7", zoneId: "zone_7", x: 2560, y: 3320, triggerRadius: 200, spawnRadius: 210, state: "armed", timer: 0 },
    ],
    silenceZones: [
      { id: "sil_z3", zoneId: "zone_3", x: 2360, y: 840, radius: 220 },
      { id: "sil_z4", zoneId: "zone_4", x: 880, y: 620, radius: 190 },
      { id: "sil_z8", zoneId: "zone_8", x: 2360, y: 1960, radius: 185 },
    ],
    falseMemoryZones: [
      { id: "mem_map1", x: 1240, y: 1120, radius: 125, memoryMap: "map1_blood", cooldown: 0 },
      { id: "mem_map2", x: 2120, y: 1480, radius: 125, memoryMap: "map2_ash", cooldown: 0 },
      { id: "mem_map3", x: 3280, y: 2580, radius: 125, memoryMap: "map3_ice", cooldown: 0 },
    ],
    observingTrees: [
      { id: "obs_1", x: 780, y: 3060, scale: 1.05, eyeAngle: 0, blinkTimer: 1.2 },
      { id: "obs_2", x: 520, y: 2140, scale: 1.15, eyeAngle: 0, blinkTimer: 2.5 },
      { id: "obs_3", x: 1860, y: 940, scale: 1.2, eyeAngle: 0, blinkTimer: 0.8 },
      { id: "obs_4", x: 640, y: 540, scale: 1.18, eyeAngle: 0, blinkTimer: 3.1 },
      { id: "obs_5", x: 3680, y: 920, scale: 1.22, eyeAngle: 0, blinkTimer: 1.7 },
      { id: "obs_6", x: 3820, y: 2520, scale: 1.16, eyeAngle: 0, blinkTimer: 2.1 },
      { id: "obs_7", x: 2420, y: 3020, scale: 1.24, eyeAngle: 0, blinkTimer: 0.6 },
      { id: "obs_8", x: 2040, y: 1840, scale: 1.32, eyeAngle: 0, blinkTimer: 2.9 },
    ],
    distantSilhouettes: [
      { id: "silh_gate", x: 960, y: 3180, height: 64, dismissed: false, alpha: 0.72 },
      { id: "silh_village", x: 420, y: 1960, height: 68, dismissed: false, alpha: 0.74 },
      { id: "silh_lake", x: 2680, y: 620, height: 70, dismissed: false, alpha: 0.76 },
      { id: "silh_valley", x: 2660, y: 3260, height: 66, dismissed: false, alpha: 0.78 },
    ],
    trailingFootprints: [],
    footprintSpawnTimer: 0.45,
    lastPlayerAngle: 0,
    phantoms: [],
    villageVoiceTimer: 4,
    bossSpawnedThisRun: false,
    bossDefeatedThisRun: Boolean(norm.bossClearedAmbiguous),
    endingRootSpawned: Boolean(norm.bossClearedAmbiguous),
    lastDiscoveryToast: null,
    lastDiscoveryTimer: 0,
    darknessPulseSec: 0,
    mazeVaultWeaponClaimed: false,
  };
}

export function getGrudgeForestZoneAt(x: number, y: number): GrudgeForestZoneDef {
  for (const z of GRUDGE_FOREST_ZONES) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
      return z;
    }
  }
  // Nearest zone fallback
  let best = GRUDGE_FOREST_ZONES[0];
  let bestDist = Infinity;
  for (const z of GRUDGE_FOREST_ZONES) {
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

export function isEntityOverlappingRect(
  ex: number,
  ey: number,
  er: number,
  rect: { x: number; y: number; w: number; h: number },
  padding = 10
): boolean {
  const rx1 = rect.x - padding;
  const ry1 = rect.y - padding;
  const rx2 = rect.x + rect.w + padding;
  const ry2 = rect.y + rect.h + padding;
  const cx = Math.max(rx1, Math.min(ex, rx2));
  const cy = Math.max(ry1, Math.min(ey, ry2));
  return Math.hypot(ex - cx, ey - cy) < er;
}

export function getActiveGrudgeForestObstacles(
  progress?: Partial<GrudgeForestProgressState>,
  runtime?: GrudgeForestRuntimeState | null
): GrudgeForestRectObstacle[] {
  const norm = normalizeGrudgeForestProgress(progress);
  const trungUnlocked = norm.ee5TrungRoomUnlocked;
  const statuesAligned = norm.statuesAligned;
  const puppetHouseOpen = norm.ee1RoguePuppetSeen || norm.ee1SecretHouseSeen || Boolean(runtime?.roguePuppet?.arrived);

  const list: GrudgeForestRectObstacle[] = [];
  for (const obs of GRUDGE_FOREST_STATIC_OBSTACLES) {
    if (obs.kind === "conditional_root_door") {
      if (obs.doorId === "root_door_trung" && trungUnlocked) continue;
      if (obs.doorId === "root_door_maze_vault" && statuesAligned) continue;
      if (obs.doorId === "root_door_puppet_house" && puppetHouseOpen) continue;
    }
    list.push(obs);
  }

  // Shifting Maze walls (Zone 5)
  const mazePhase = runtime ? Math.abs(runtime.mazePhase) % GRUDGE_FOREST_MAZE_WALL_SETS.length : 0;
  const mazeWalls = GRUDGE_FOREST_MAZE_WALL_SETS[mazePhase] || GRUDGE_FOREST_MAZE_WALL_SETS[0];
  for (const mw of mazeWalls) {
    list.push(mw);
  }

  // Living breakable vines
  if (runtime?.destructibles) {
    for (const v of runtime.destructibles) {
      if (!v.destroyed) {
        list.push({
          id: v.id,
          x: v.x,
          y: v.y,
          w: v.w,
          h: v.h,
          kind: "living_vines",
          label: v.hint.vi,
          destructibleId: v.id,
        });
      }
    }
  } else {
    for (const v of GRUDGE_FOREST_INITIAL_DESTRUCTIBLES) {
      if (!norm.destroyedVines.includes(v.id)) {
        list.push({
          id: v.id,
          x: v.x,
          y: v.y,
          w: v.w,
          h: v.h,
          kind: "living_vines",
          label: v.hint.vi,
          destructibleId: v.id,
        });
      }
    }
  }

  // Fallen trees (trap obstacles once fallen)
  if (runtime?.fallingTrees) {
    for (const ft of runtime.fallingTrees) {
      if (ft.state === "fallen") {
        list.push({
          id: ft.id,
          x: ft.x,
          y: ft.y,
          w: ft.w,
          h: ft.h,
          kind: "fallen_log",
          label: "Cây Đổ Chắn Lối",
        });
      }
    }
  }

  return list;
}

export function canEntitiesSafelyAcceptObstacles(
  candidateRects: Array<{ x: number; y: number; w: number; h: number }>,
  entities: Array<{ x: number; y: number; radius?: number }>
): boolean {
  for (const rect of candidateRects) {
    for (const ent of entities) {
      if (isEntityOverlappingRect(ent.x, ent.y, ent.radius || 22, rect, 12)) {
        return false;
      }
    }
  }
  return true;
}

export function shiftGrudgeMazeSafely(
  runtime: GrudgeForestRuntimeState,
  entities: Array<{ x: number; y: number; radius?: number }>
): { shifted: boolean; newPhase: number } {
  const total = GRUDGE_FOREST_MAZE_WALL_SETS.length;
  for (let offset = 1; offset < total; offset++) {
    const candidatePhase = (runtime.mazePhase + offset) % total;
    const candidateWalls = GRUDGE_FOREST_MAZE_WALL_SETS[candidatePhase];
    if (canEntitiesSafelyAcceptObstacles(candidateWalls, entities)) {
      runtime.mazePhase = candidatePhase;
      runtime.pendingMazeShift = false;
      return { shifted: true, newPhase: candidatePhase };
    }
  }
  runtime.pendingMazeShift = true;
  return { shifted: false, newPhase: runtime.mazePhase };
}

export function damageGrudgeForestVinesAt(
  runtime: GrudgeForestRuntimeState | null,
  progress: Partial<GrudgeForestProgressState>,
  hitX: number,
  hitY: number,
  hitRadius: number,
  damage: number
): {
  nextProgress: GrudgeForestProgressState;
  destroyedIds: string[];
  hitAny: boolean;
} {
  const next = normalizeGrudgeForestProgress(progress);
  if (!runtime || !runtime.destructibles?.length) {
    return { nextProgress: next, destroyedIds: [], hitAny: false };
  }
  const destroyedIds: string[] = [];
  let hitAny = false;
  for (const v of runtime.destructibles) {
    if (v.destroyed) continue;
    if (isEntityOverlappingRect(hitX, hitY, hitRadius, v, 8)) {
      v.hp = Math.max(0, v.hp - Math.max(1, damage));
      v.hitFlash = 0.25;
      hitAny = true;
      if (v.hp <= 0) {
        v.destroyed = true;
        destroyedIds.push(v.id);
        if (!next.destroyedVines.includes(v.id)) {
          next.destroyedVines.push(v.id);
        }
      }
    }
  }
  return { nextProgress: next, destroyedIds, hitAny };
}

export function findNearestGrudgeForestInteractable(
  px: number,
  py: number,
  progress?: Partial<GrudgeForestProgressState>,
  runtime?: GrudgeForestRuntimeState | null,
  maxOffset = 34
): GrudgeForestInteractableDef | null {
  const norm = normalizeGrudgeForestProgress(progress);
  const rootVisible = Boolean(
    norm.bossClearedAmbiguous || runtime?.bossDefeatedThisRun || runtime?.endingRootSpawned
  );
  let best: GrudgeForestInteractableDef | null = null;
  let bestDist = Infinity;
  for (const node of GRUDGE_FOREST_INTERACTABLES) {
    if (node.id === "ending_moving_root" && !rootVisible) continue;
    if (node.id === "forest_heart_boss_altar" && rootVisible) continue;
    if (node.id === "maze_vault_weapon" && !norm.statuesAligned) continue;
    const d = Math.hypot(px - node.x, py - node.y);
    if (d <= node.radius + maxOffset && d < bestDist) {
      bestDist = d;
      best = node;
    }
  }
  return best;
}

export function evaluateGrudgeForestProximityEvents({
  px,
  py,
  heroId,
  progress,
  runtime,
  dt,
  nearestAllyDist,
  lang = "vi",
}: {
  px: number;
  py: number;
  heroId: string;
  progress: Partial<GrudgeForestProgressState>;
  runtime: GrudgeForestRuntimeState;
  dt: number;
  nearestAllyDist: number;
  lang?: "vi" | "en";
}): {
  nextProgress: GrudgeForestProgressState;
  storyPayload: GrudgeForestStoryModalPayload | null;
  toastText: string | null;
  soundCue: "whisper" | "twig" | "flute" | "secret" | null;
} {
  const next = normalizeGrudgeForestProgress(progress);
  const isVi = lang !== "en";
  let toastText: string | null = null;
  let soundCue: "whisper" | "twig" | "flute" | "secret" | null = null;

  // Dismiss distant silhouettes when approaching
  for (const silh of runtime.distantSilhouettes) {
    if (!silh.dismissed && Math.hypot(px - silh.x, py - silh.y) < 280) {
      silh.dismissed = true;
      soundCue = soundCue || "twig";
    }
  }

  // Intro Narrative (once on stepping past ancient stone gate)
  if (!next.introNarrativeSeen && py < 3280 && px < 1450) {
    next.introNarrativeSeen = true;
    return {
      nextProgress: next,
      toastText: null,
      soundCue: "flute",
      storyPayload: {
        nodeId: "narrative_forest_intro",
        zoneId: "zone_1",
        title: isVi ? "Rừng Oán Niệm" : "Forest of Grudges",
        subtitle: isVi ? "CỔNG RỪNG KHÔNG LỐI VỀ · NHẬP RỪNG" : "GATE OF NO RETURN · ENTRY",
        code: "RON-00",
        themeVariant: "forest",
        isSecretDiscovery: false,
        unlockedNow: true,
        steps: [
          {
            speaker: isVi ? "Tiếng Rễ Chuyển Động" : "Shifting Roots",
            speakerColor: "#34D399",
            text: isVi
              ? "“Khu rừng này đã đứng hàng nghìn năm trước khi bất kỳ đấu trường hay cổ thành nào được dựng lên.”"
              : "“This woodland stood for millennia before any citadel or arena ever rose.”",
          },
          {
            speaker: isVi ? "Gió Sâu Trong Tán Lá" : "Canopy Whisper",
            speakerColor: "#C084FC",
            text: isVi
              ? "“Duy từng tin rằng mình đủ sức điều khiển mọi sinh vật ở đây... cho tới khi những con rối bắt đầu tự bước đi.”"
              : "“Duy once believed he could command every creature within... until his own puppets began walking on their own.”",
          },
        ],
        paragraphs: [
          "Khu rừng cổ đại tồn tại hàng nghìn năm.",
          "Người bước vào chưa chắc đã tìm được lối ra.",
        ],
        clueSummary: isVi ? "Đã bước qua Cổng Rừng Không Lối Về." : "Entered the Forest of Grudges.",
        audioCue: "flute",
        progress: next,
      },
    };
  }

  // EE1: Playing DUY near puppets & standing idle triggers a rogue puppet walking away
  const movedDist = Math.hypot(px - runtime.duyLastX, py - runtime.duyLastY);
  runtime.duyLastX = px;
  runtime.duyLastY = py;
  const currentZone = getGrudgeForestZoneAt(px, py);
  const nearPuppetArea =
    currentZone.id === "zone_2" ||
    currentZone.id === "zone_6" ||
    Math.hypot(px - 840, py - 2040) < 620 ||
    Math.hypot(px - 3440, py - 3020) < 620;

  if (heroId === "duy" && !runtime.roguePuppet.active && !next.ee1SecretHouseSeen && nearPuppetArea) {
    if (movedDist < 1.2) {
      runtime.duyIdleSec += dt;
      if (runtime.duyIdleSec >= 3.2) {
        runtime.roguePuppet.active = true;
        runtime.roguePuppet.arrived = false;
        runtime.roguePuppet.x = Math.max(240, Math.min(GRUDGE_FOREST_WIDTH - 240, px + 88));
        runtime.roguePuppet.y = Math.max(240, Math.min(GRUDGE_FOREST_HEIGHT - 240, py - 42));
        runtime.roguePuppet.targetIndex = 0;
        // Guide straight to the Secret Puppet House in Zone 2
        runtime.roguePuppet.waypoints = [
          { x: Math.min(px + 60, 740), y: Math.min(py, 1960) },
          { x: 540, y: 1750 },
          { x: 350, y: 1680 },
        ];
        next.ee1RoguePuppetSeen = true;
        toastText = isVi
          ? "Một con rối vừa tự ý bước đi khỏi hàng! Hãy đi theo nó!"
          : "A puppet just walked off on its own! Follow it!";
        soundCue = "twig";
      }
    } else {
      runtime.duyIdleSec = Math.max(0, runtime.duyIdleSec - dt * 1.5);
    }
  } else if (movedDist > 2) {
    runtime.duyIdleSec = 0;
  }

  // Step Rogue Puppet along its trail when active
  if (runtime.roguePuppet.active && !runtime.roguePuppet.arrived) {
    const wp = runtime.roguePuppet.waypoints[runtime.roguePuppet.targetIndex];
    if (wp) {
      const distPlayerToPuppet = Math.hypot(px - runtime.roguePuppet.x, py - runtime.roguePuppet.y);
      const dx = wp.x - runtime.roguePuppet.x;
      const dy = wp.y - runtime.roguePuppet.y;
      const d = Math.hypot(dx, dy);
      // Wait gently if player falls too far behind (>380px) so they never lose it
      const speed = distPlayerToPuppet < 390 ? 112 : 28;
      if (d <= 16) {
        runtime.roguePuppet.targetIndex++;
        if (runtime.roguePuppet.targetIndex >= runtime.roguePuppet.waypoints.length) {
          runtime.roguePuppet.arrived = true;
          toastText = isVi
            ? "Con rối đã bước vào căn nhà rễ cây ở Làng Người Mất Tích!"
            : "The rogue puppet entered the hidden house in the Village!";
          soundCue = "whisper";
        }
      } else {
        runtime.roguePuppet.angle = Math.atan2(dy, dx);
        runtime.roguePuppet.x += (dx / d) * speed * dt;
        runtime.roguePuppet.y += (dy / d) * speed * dt;
        runtime.roguePuppet.stepPhase += dt * 7;
      }
    }
  }

  // EE4: Thung Lũng Tiếng Gọi — walking alone calls hero name
  if (runtime.valleyVoiceCooldown > 0) {
    runtime.valleyVoiceCooldown = Math.max(0, runtime.valleyVoiceCooldown - dt);
  }
  const inValley = currentZone.id === "zone_7";
  const walkingAlone = nearestAllyDist > 260;
  if (inValley && walkingAlone) {
    runtime.valleyAloneTimer += dt;
    if (runtime.valleyAloneTimer >= 2.1 && runtime.valleyVoiceCooldown <= 0) {
      runtime.valleyVoiceCooldown = 18;
      soundCue = "whisper";
      toastText =
        heroId === "duy"
          ? isVi
            ? "Giọng nói giống hệt Trung vang từ làn sương: “Duy... quay đầu lại đi...”"
            : "A voice like Trung echoes from the mist: “Duy... turn back...”"
          : isVi
          ? `Giọng đồng đội thì thầm từ Thung Lũng: “Này ${heroId.toUpperCase()}... bên này!”`
          : `A comrade's voice whispers in the Valley: “Over here, ${heroId.toUpperCase()}!”`;
      if (runtime.phantoms.length < 8) {
        runtime.phantoms.push({
          kind: "valley_echo",
          x: px + 140,
          y: py - 70,
          targetX: 2680,
          targetY: 3260,
          life: 0,
          maxLife: 4.5,
          alpha: 0.85,
          label: heroId.toUpperCase(),
        });
      }
    }
  } else {
    runtime.valleyAloneTimer = Math.max(0, runtime.valleyAloneTimer - dt * 0.8);
  }

  return { nextProgress: next, storyPayload: null, toastText, soundCue };
}

export function checkFourMapLinkReadiness({
  citadelSecrets,
  infernoProgress,
  frozenTombProgress,
  grudgeProgress,
}: {
  citadelSecrets?: Partial<CitadelSecretsProgress> | unknown;
  infernoProgress?: Partial<InfernoProgressState> | unknown;
  frozenTombProgress?: Partial<FrozenTombProgressState> | unknown;
  grudgeProgress?: Partial<GrudgeForestProgressState>;
}): {
  map1Ready: boolean;
  map2Ready: boolean;
  map3Ready: boolean;
  map4Ready: boolean;
  allReady: boolean;
} {
  const c = (citadelSecrets || {}) as Partial<CitadelSecretsProgress>;
  const i = (infernoProgress || {}) as Partial<InfernoProgressState>;
  const f = (frozenTombProgress || {}) as Partial<FrozenTombProgressState>;
  const g = normalizeGrudgeForestProgress(grudgeProgress);

  const map1Ready = Boolean(c.combinedUnlocked || (c.tinClue && c.baoClue));
  const map2Ready = Boolean(
    i.trungTriggered ||
      i.fourChairsUnlocked ||
      (i.dungClue && i.danhClue && i.longhoiClue)
  );
  const map3Ready = Boolean(
    f.linkedDeviceTriggered ||
      (f.minhSealClue && f.phongMirrorClue && f.thanhVialClue) ||
      f.endingShardSeen
  );
  const map4Ready = Boolean(
    g.ee2MirrorLakeSeen &&
      (g.ee3DuyLaughHeard || g.ee3MaThachStoneSeen) &&
      (g.ee4ValleyCallSeen || g.ee5TrungRoomSeen || g.ee1SecretHouseSeen)
  );
  return {
    map1Ready,
    map2Ready,
    map3Ready,
    map4Ready,
    allReady: map1Ready && map2Ready && map3Ready && map4Ready,
  };
}

export function buildGrudgeForestEndingPayload(
  progress: GrudgeForestProgressState,
  lang: "vi" | "en" = "vi"
): GrudgeForestStoryModalPayload {
  const isVi = lang !== "en";
  return {
    nodeId: "ending_moving_root",
    zoneId: "zone_8",
    title: isVi ? "Bãi Đất Trống Dưới Gốc Cổ Thụ" : "Empty Clearing Under the Great Tree",
    subtitle: isVi ? "TRÁI TIM RỪNG SÂU · KẾT THÚC MỞ" : "HEART OF DEEP WOODS · OPEN ENDING",
    code: "RON-END",
    themeVariant: "ending_root",
    isSecretDiscovery: true,
    unlockedNow: true,
    isEndingSequence: true,
    steps: [
      {
        speaker: isVi ? "Khoảng Rừng Lặng Gió" : "Still Clearing",
        speakerColor: "#34D399",
        text: isVi
          ? "Cuộc giao chiến dừng lại. Nhưng không có thi thể, không có tro tàn, cũng không có dấu vết nào chứng minh thực thể dưới rễ cây đã chết."
          : "The battle stops — yet no body, ash, or trace remains to prove the entity beneath the roots ever died.",
      },
      {
        speaker: isVi ? "Sợi Rễ Cuối Cùng" : "The Solitary Root",
        speakerColor: "#C084FC",
        text: isVi
          ? "Giữa bãi đất trống trải, một sợi rễ đơn độc vẫn khẽ co duỗi rất chậm... như nhịp thở của một kẻ chưa từng tỉnh hẳn, hoặc chưa từng bị khuất phục."
          : "In the center of the empty ground, a single solitary root slowly curls and breathes... neither defeated nor truly asleep.",
      },
    ],
    paragraphs: [
      "Không có xác nhận thực thể đã chết.",
      "Chỉ còn một bãi đất trống và một sợi rễ vẫn đang khẽ cử động chậm rãi.",
    ],
    clueSummary: isVi ? "Đã chạm trán KẺ NGỦ DƯỚI RỄ CÂY." : "Survived the Heart of the Deep Woods.",
    audioCue: "flute",
    progress,
  };
}

export function evaluateGrudgeForestInteraction({
  nodeId,
  heroId,
  progress,
  citadelSecrets,
  infernoProgress,
  frozenTombProgress,
  runtime,
  lang = "vi",
}: {
  nodeId: GrudgeForestInteractableId;
  heroId: string;
  progress: Partial<GrudgeForestProgressState>;
  citadelSecrets?: Partial<CitadelSecretsProgress> | unknown;
  infernoProgress?: Partial<InfernoProgressState> | unknown;
  frozenTombProgress?: Partial<FrozenTombProgressState> | unknown;
  runtime?: GrudgeForestRuntimeState | null;
  lang?: "vi" | "en";
}): {
  nextProgress: GrudgeForestProgressState;
  payload: GrudgeForestStoryModalPayload;
  coinBonus: number;
  healPct?: number;
  spawnMimicAmbush?: boolean;
  spawnForestBoss?: boolean;
  spawnRootTrapWarning?: boolean;
  darknessPulseSec?: number;
  claimMazeVaultWeapon?: boolean;
} {
  const isVi = lang !== "en";
  const next = normalizeGrudgeForestProgress(progress);
  const node =
    GRUDGE_FOREST_INTERACTABLES.find((n) => n.id === nodeId) ||
    GRUDGE_FOREST_INTERACTABLES[0];
  if (!next.inspectedNodes.includes(nodeId)) {
    next.inspectedNodes.push(nodeId);
  }

  let coinBonus = 0;
  let healPct = 0;
  let unlockedNow = false;
  let isSecretDiscovery = false;
  let spawnMimicAmbush = false;
  let spawnForestBoss = false;
  let spawnRootTrapWarning = false;
  let claimMazeVaultWeapon = false;
  let darknessPulseSec = 0;
  let mirrorVisionTag: "map1" | "map2" | null = null;
  let showsFourMapMatrix = false;
  let fourMapStatus: {
    map1Ready: boolean;
    map2Ready: boolean;
    map3Ready: boolean;
    map4Ready: boolean;
  } | undefined;
  let themeVariant: GrudgeForestStoryModalPayload["themeVariant"] = "forest";
  let audioCue: GrudgeForestStoryModalPayload["audioCue"] = "whisper";
  let steps: GrudgeForestStoryStep[] = [];

  if (nodeId === "gate_signpost_south" || nodeId === "gate_signpost_north") {
    const idx = runtime ? runtime.signpostVariant % GRUDGE_FOREST_SIGNPOST_TEXTS.length : 0;
    if (runtime) {
      runtime.signpostVariant = (runtime.signpostVariant + 1) % GRUDGE_FOREST_SIGNPOST_TEXTS.length;
    }
    const entry = GRUDGE_FOREST_SIGNPOST_TEXTS[idx];
    audioCue = "twig";
    steps = (isVi ? entry.vi : entry.en).map((txt, i) => ({
      speaker: i === 0 ? (isVi ? "Mặt Biển Chỉ Đường" : "Signpost Face") : isVi ? "Dòng Chữ Mới Hiện" : "Fresh Carving",
      speakerColor: i === 0 ? "#34D399" : "#F59E0B",
      text: txt,
    }));
  } else if (nodeId === "ee1_rogue_puppet_plaza") {
    themeVariant = "duy_puppet";
    if (heroId === "duy") {
      if (runtime && !runtime.roguePuppet.active) {
        runtime.roguePuppet.active = true;
        runtime.roguePuppet.arrived = false;
        runtime.roguePuppet.x = 3420;
        runtime.roguePuppet.y = 2960;
        runtime.roguePuppet.targetIndex = 0;
        runtime.roguePuppet.waypoints = [
          { x: 2940, y: 2740 },
          { x: 1380, y: 2120 },
          { x: 540, y: 1750 },
          { x: 350, y: 1680 },
        ];
      }
      next.ee1RoguePuppetSeen = true;
      audioCue = "twig";
      steps = [
        {
          speaker: isVi ? "Đám Rối Gỗ Trong Sân" : "Courtyard Puppets",
          speakerColor: "#F472B6",
          text: isVi
            ? "Ngay khi Duy bước vào, toàn bộ những con rối gỗ đồng loạt xoay đầu nhìn thẳng về phía hắn — dù chẳng có bàn tay hay sợi chỉ nào chạm vào."
            : "The instant Duy steps near, every wooden puppet turns its head directly toward him — with no hand or thread touching them.",
        },
        {
          speaker: isVi ? "Con Rối Không Nghe Lời" : "Rogue Puppet",
          speakerColor: "#C084FC",
          text: isVi
            ? "Một con rối nhỏ bước tách khỏi hàng, lặng lẽ hướng về căn nhà bỏ hoang phía Tây Bắc Làng Người Mất Tích. (Hoặc đứng yên tại Làng để gọi một con rối khác dẫn đường gần hơn.)"
            : "One puppet steps out of formation and drifts toward the hidden house in NW Village of the Vanished.",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Những Con Rối Bất Động" : "Motionless Puppets",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Những con rối gỗ nằm bất động trên bệ đá. Nhưng ánh mắt khắc trên gỗ như đang chờ đợi một kẻ từng điều khiển chúng — Duy."
            : "The wooden puppets sit frozen, their carved eyes waiting for the one who once tried to control them — Duy.",
        },
      ];
    }
  } else if (nodeId === "ee1_secret_puppet_house") {
    themeVariant = "duy_puppet";
    isSecretDiscovery = heroId === "duy";
    if (heroId === "duy") {
      if (!next.ee1SecretHouseSeen) {
        next.ee1SecretHouseSeen = true;
        unlockedNow = true;
        coinBonus += 220;
      }
      if (!next.collectedDocs.includes("doc_ee1_puppets")) {
        next.collectedDocs.push("doc_ee1_puppets");
      }
      audioCue = "secret";
      darknessPulseSec = 2.6;
      steps = [
        {
          speaker: isVi ? "Căn Nhà Đầy Rối Hình Các Tướng" : "Room of Hero Puppets",
          speakerColor: "#F472B6",
          text: isVi
            ? "Trên giá gỗ ngồi ngay ngắn những con rối mang khuôn mặt của Tín, Bảo, Dũng, Long Hói, Éo Hyên, Thanh, Minh, Phong — và một con rối mặc áo choàng giống hệt Duy."
            : "Wooden shelves hold puppets carved in the likenesses of every Arena hero — plus one dressed identically to Duy himself.",
        },
        {
          speaker: isVi ? "Dòng Chữ Cào Trên Tường Gỗ" : "Carved Into the Wall",
          speakerColor: "#FB7185",
          text: isVi
            ? "“Ngươi tưởng mình đang điều khiển chúng sao?”"
            : "“Did you think you were the one controlling them?”",
          subtext: isVi
            ? "Từ ngoài cửa vọng lại giọng nói lặp lại y hệt mệnh lệnh cuối cùng Duy vừa nghĩ trong đầu — chẳng rõ hắn bị rừng thao túng hay đang ngầm hợp tác."
            : "Outside, another voice repeats Duy's exact unspoken command — leaving unclear whether he is controlled or complicit.",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Cửa Nhà Bị Rễ Khóa" : "Root-Sealed House",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Bên trong căn nhà gỗ tối om là hàng chục bóng rối nhỏ. Chỉ khi điều khiển DUY và đi theo con rối tự ý bước đi, cánh rễ mới mở hẳn lối vào."
            : "Play as DUY and let a rogue puppet guide you here to open the secret house fully.",
        },
      ];
    }
  } else if (nodeId === "ee2_mirror_lake_bank") {
    themeVariant = "mirror_lake";
    const inTimingWindow = runtime ? runtime.mirrorResonanceWindow > 0 : true;
    const visionKind: "map1" | "map2" =
      runtime?.mirrorVisionMap === "map2" ? "map2" : "map1";
    if (runtime) {
      runtime.mirrorVisionMap = visionKind === "map1" ? "map2" : "map1";
    }
    if (inTimingWindow) {
      mirrorVisionTag = visionKind;
      if (!next.ee2MirrorLakeSeen) {
        next.ee2MirrorLakeSeen = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 180;
      }
      if (!next.collectedDocs.includes("doc_ee2_mirror_lake")) {
        next.collectedDocs.push("doc_ee2_mirror_lake");
      }
      if (next.ee3DuyLaughHeard || next.ee3MaThachStoneSeen) {
        next.ee5TrungRoomUnlocked = true;
      }
      audioCue = "chime";
      darknessPulseSec = 2.4;
      steps = [
        {
          speaker: isVi ? "Mặt Nước Phản Chiếu Sai Lệch" : "Desynchronized Reflection",
          speakerColor: "#A855F7",
          text: isVi
            ? "Bóng của ngươi dưới mặt hồ đen đứng bất động dù ngươi vừa cử động — và ngay phía sau vai trong nước hiện thêm một bóng người lặng lẽ không hề có trên bờ."
            : "Your reflection refuses to match your posture — and directly behind your mirrored shoulder stands an extra silent figure absent from the shore.",
        },
        {
          speaker:
            visionKind === "map1"
              ? isVi
                ? "Ảo Cảnh Đáy Hồ: Cổ Thành Huyết Táng (Map 1)"
                : "Lake Vision: Blood Citadel (Map 1)"
              : isVi
              ? "Ảo Cảnh Đáy Hồ: Hỏa Ngục Tàn Tro (Map 2)"
              : "Lake Vision: Inferno of Ashes (Map 2)",
          speakerColor: visionKind === "map1" ? "#FB7185" : "#FB923C",
          text:
            visionKind === "map1"
              ? isVi
                ? "Làn nước gợn sóng biến mặt hồ thành sảnh đá đỏ máu của Cổ Thành Huyết Táng — nhưng những cột trụ đều bị rễ cây đen xuyên thủng từ bên dưới."
                : "Ripples reshape the lake into the Blood Citadel's crimson halls — pierced from below by thick black forest roots."
              : isVi
              ? "Trong khoảnh khắc nước lặng, đáy hồ phản chiếu Hỏa Ngục Tàn Tro phủ đầy rễ cây phát sáng thay vì tro tàn, cùng bốn chiếc ghế trống xếp quanh gốc cổ thụ."
              : "For a heartbeat the lake mirrors Inferno of Ashes overgrown with glowing roots instead of embers, four empty chairs ringed around an ancient trunk.",
        },
      ];
    } else {
      audioCue = "whisper";
      steps = [
        {
          speaker: isVi ? "Mặt Hồ Đen Gợn Sóng" : "Rippling Black Mirror",
          speakerColor: "#A855F7",
          text: isVi
            ? "Mặt nước chỉ lặp lại động tác chậm hơn một nhịp. Hãy chờ vòng gợn tím sáng lên khi bóng người thứ hai xuất hiện phía sau lưng trong hồ rồi tương tác lại!"
            : "The lake only lags a beat right now. Wait for the violet resonance ripple when a second figure appears behind your reflection, then interact again!",
        },
      ];
    }
  } else if (nodeId === "ee3_hero_tombstones") {
    themeVariant = "graveyard";
    if (!next.ee3HeroStonesSeen) {
      next.ee3HeroStonesSeen = true;
      coinBonus += 90;
    }
    if (!next.collectedDocs.includes("doc_ee3_graveyard")) {
      next.collectedDocs.push("doc_ee3_graveyard");
    }
    audioCue = "whisper";
    steps = [
      {
        speaker: isVi ? "Hàng Bia Mộ Rễ Quấn" : "Root-Swallowed Headstones",
        speakerColor: "#94A3B8",
        text: isVi
          ? "Trên mặt đá rêu phong hằn rõ tên của TÍN, BẢO, DŨNG, LONG HÓI, ÉO HYÊN, THANH, PHONG, MINH... nhưng phần năm sinh và năm mất đều bị rễ cây đâm nát."
          : "Mossy stone reveals familiar names — Tín, Bảo, Dũng, Long Hói, Éo Hyên, Thanh, Phong, Minh — with dates pierced away by climbing roots.",
      },
      {
        speaker: isVi ? "Vết Cào Trên Đá" : "Fresh Scratches",
        speakerColor: "#E2E8F0",
        text: isVi
          ? "Ba tấm bia bị cào xước mạnh đến mức không còn đọc rõ nét chữ, như thể có kẻ đã đứng đây lúc nửa đêm cố xóa tên mình."
          : "Three slabs are violently scratched unreadable, as though someone stood here at midnight trying to erase their own name.",
      },
    ];
  } else if (nodeId === "ee3_duy_tombstone") {
    themeVariant = "graveyard";
    isSecretDiscovery = true;
    if (!next.ee3DuyLaughHeard) {
      next.ee3DuyLaughHeard = true;
      unlockedNow = true;
      coinBonus += 160;
    }
    if (!next.collectedDocs.includes("doc_ee3_duy_stone")) {
      next.collectedDocs.push("doc_ee3_duy_stone");
    }
    if (next.ee2MirrorLakeSeen) {
      next.ee5TrungRoomUnlocked = true;
    }
    audioCue = "duy_laugh";
    darknessPulseSec = 2.2;
    steps = [
      {
        speaker: isVi ? "Bia Mộ Khắc Tên “DUY”" : "Tombstone Marked “DUY”",
        speakerColor: "#C084FC",
        text: isVi
          ? "Ngay khi ngón tay chạm vào chữ 'DUY' trên tấm bia đá cổ, không gian bỗng im bặt — rồi tiếng cười khẽ kéo dài của chính Duy vang vọng từ mọi gốc cây xung quanh."
          : "The instant stone meets hand, wind dies — followed by Duy's quiet, echoing laugh ringing out from every surrounding trunk.",
      },
      {
        speaker: isVi ? "Dư Âm Không Lời Giải" : "Unresolved Echo",
        speakerColor: "#94A3B8",
        text: isVi
          ? "Giọng cười ấy có thể là bẫy của khu rừng, cũng có thể là dấu vết do chính Duy để lại trước khi bước sâu hơn về phía Trái Tim Rừng."
          : "Nothing reveals whether that laughter is a forest mimicry or a trace Duy deliberately left before stepping deeper.",
      },
    ];
  } else if (nodeId === "ee3_mathach_tombstone") {
    themeVariant = "graveyard";
    isSecretDiscovery = true;
    if (!next.ee3MaThachStoneSeen) {
      next.ee3MaThachStoneSeen = true;
      unlockedNow = true;
      coinBonus += 160;
    }
    if (!next.collectedDocs.includes("doc_ee3_mathach")) {
      next.collectedDocs.push("doc_ee3_mathach");
    }
    if (next.ee2MirrorLakeSeen) {
      next.ee5TrungRoomUnlocked = true;
    }
    audioCue = "chime";
    steps = [
      {
        speaker: isVi ? "Bia Đá Không Tên" : "Unmarked Monolith",
        speakerColor: "#FB7185",
        text: isVi
          ? "Một tấm bia đá đen nằm lọt thỏm giữa rễ cây cổ thụ. Trên mặt đá chỉ khắc duy nhất biểu tượng Ma Thạch đỏ sẫm giống hệt trong Cổ Thành Huyết Táng."
          : "A lone black stone bears only the crimson Ma Thạch crest of the Blood Citadel.",
        subtext: isVi
          ? "Không có ngày tháng, không có chú giải. Chỉ có mùi máu cũ thoang thoảng trong sương lạnh."
          : "No dates, no explanation — only the faint scent of old blood in cold mist.",
      },
    ];
  } else if (
    nodeId === "statue_maze_west" ||
    nodeId === "statue_maze_center" ||
    nodeId === "statue_maze_south"
  ) {
    themeVariant = "forest";
    audioCue = "chime";
    if (runtime) {
      const statue = runtime.statues.find((s) => s.id === nodeId);
      if (statue) {
        statue.angleIndex = (statue.angleIndex + 1) % 4;
        const allAligned = runtime.statues.every((s) => s.angleIndex === s.targetIndex);
        if (allAligned && !next.statuesAligned) {
          next.statuesAligned = true;
          unlockedNow = true;
          coinBonus += 200;
          healPct = 0.25;
        } else if (!allAligned && statue.angleIndex === (statue.targetIndex + 2) % 4) {
          spawnRootTrapWarning = true;
        }
        const dirLabels = isVi ? ["Bắc", "Đông", "Nam", "Tây"] : ["North", "East", "South", "West"];
        steps = [
          {
            speaker: isVi ? "Tượng Đá Cổ Phủ Rêu" : "Mossy Stone Idol",
            speakerColor: allAligned ? "#34D399" : "#F59E0B",
            text: allAligned
              ? isVi
                ? "Ba bức tượng đá đồng loạt phát tiếng rắc vang vọng! Cửa Kho Cổ phía Đông Bắc Mê Cung đã mở lối tắt xuyên qua màn rễ!"
                : "All three stone idols lock into alignment! The NE Maze Vault shortcut swings open!"
              : isVi
              ? `Bức tượng xoay mặt về hướng ${dirLabels[statue.angleIndex]} (Khớp chuẩn: ${dirLabels[statue.targetIndex]}). Khi cả 3 tượng đúng hướng, cửa đá bí mật sẽ mở.`
              : `Idol rotated to face ${dirLabels[statue.angleIndex]} (Target: ${dirLabels[statue.targetIndex]}). Align all 3 idols to unseal the maze vault.`,
          },
        ];
      }
    }
    if (steps.length === 0) {
      steps = [
        {
          speaker: isVi ? "Tượng Đá Mê Cung" : "Maze Stone Idol",
          speakerColor: "#34D399",
          text: isVi ? "Tượng đá khẽ xoay kèm tiếng rễ cây cựa mình." : "The idol shifts amidst groaning roots.",
        },
      ];
    }
  } else if (nodeId === "maze_vault_weapon") {
    themeVariant = "four_maps";
    const aligned = Boolean(next.statuesAligned);
    const alreadyClaimed = Boolean(runtime?.mazeVaultWeaponClaimed);
    if (!aligned) {
      audioCue = "twig";
      steps = [
        {
          speaker: isVi ? "Bệ Thờ Phong Ấn" : "Sealed Vault Pedestal",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Phong ấn 3 bức tượng đá quanh mê cung chưa khớp — cổ vật vẫn bị khóa chặt."
            : "The three stone idols are not yet aligned — the ancient relic remains sealed.",
        },
      ];
    } else if (!alreadyClaimed) {
      claimMazeVaultWeapon = true;
      audioCue = "secret";
      isSecretDiscovery = true;
      unlockedNow = true;
      healPct = 0.2;
      steps = [
        {
          speaker: isVi ? "Bệ Vũ Khí Cổ Xưa" : "Ancient Weapon Pedestal",
          speakerColor: "#FACC15",
          text: isVi
            ? "Lớp rễ đá nứt toác, trao cho ngươi một món Vũ Khí Huyền Thoại ngủ quên trong Kho Cổ Mê Cung!"
            : "The ancient roots part and bestow a Mythic Weapon dormant inside the Maze Vault!",
        },
      ];
    } else {
      audioCue = "chime";
      steps = [
        {
          speaker: isVi ? "Bệ Đá Trống" : "Empty Stone Pedestal",
          speakerColor: "#34D399",
          text: isVi
            ? "Ngươi đã thu nhận món Vũ Khí Huyền Thoại từ căn phòng bí mật này."
            : "You have already claimed the Mythic Weapon from this secret vault.",
        },
      ];
    }
  } else if (nodeId === "ee4_valley_calling_point" || nodeId === "ee4_valley_echo_shrine") {
    themeVariant = "valley";
    if (nodeId === "ee4_valley_echo_shrine") {
      if (!next.ee4ValleyCallSeen) {
        next.ee4ValleyCallSeen = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 180;
        spawnMimicAmbush = true;
      }
      if (!next.collectedDocs.includes("doc_ee4_valley")) {
        next.collectedDocs.push("doc_ee4_valley");
      }
      audioCue = "twig";
      darknessPulseSec = 2.0;
      steps = [
        {
          speaker: isVi ? "Bóng Người Giữa Làn Sương" : "Silhouette in the Mist",
          speakerColor: "#60A5FA",
          text: isVi
            ? "Bóng người gọi tên ngươi đứng quay lưng bên phiến đá. Khi vừa tới gần, khuôn mặt quay lại méo mó thành hình nộm gỗ mọc đầy rễ — lao tới trước khi tan biến vào sương!"
            : "The calling silhouette turns — revealing a splintered puppet face bursting with roots before lunging or dissolving into fog!",
        },
        {
          speaker: isVi ? "Tiếng Vọng Không Lời Đáp" : "Unanswered Echo",
          speakerColor: "#C084FC",
          text: isVi
            ? "Không ai biết giọng nói vừa rồi có phải ký ức thật từ đồng đội năm xưa... hay chỉ là thứ âm thanh do khu rừng tự tạo để dẫn dụ kẻ lạc đường."
            : "Whether that voice was a real buried memory or a lure crafted by the forest itself remains completely unknown.",
        },
      ];
    } else {
      audioCue = "whisper";
      steps = [
        {
          speaker: isVi ? "Gió Thung Lũng" : "Valley Wind",
          speakerColor: "#60A5FA",
          text: isVi
            ? "Từ phía Đông Bắc Thung Lũng (gần Bóng Người Trong Sương) vọng lại giọng nói rất quen gọi tên ngươi. Hãy đi một mình tiến về hướng bóng mờ đó!"
            : "A familiar voice echoes from the NE Valley mist — walk alone toward the beckoning figure!",
        },
      ];
    }
  } else if (nodeId === "ee5_trung_hidden_room") {
    themeVariant = "trung_room";
    const ready = next.ee2MirrorLakeSeen && (next.ee3DuyLaughHeard || next.ee3MaThachStoneSeen);
    if (ready) {
      next.ee5TrungRoomUnlocked = true;
      if (!next.ee5TrungRoomSeen) {
        next.ee5TrungRoomSeen = true;
        unlockedNow = true;
        isSecretDiscovery = true;
        coinBonus += 260;
      }
      if (!next.collectedDocs.includes("doc_ee5_trung_room")) {
        next.collectedDocs.push("doc_ee5_trung_room");
      }
      audioCue = "secret";
      darknessPulseSec = 3.2;
      steps = [
        {
          speaker: isVi ? "Bàn Làm Việc & Chiếc Ghế Trống" : "Desk & Empty Chair",
          speakerColor: "#E879F9",
          text: isVi
            ? "Giữa căn phòng ẩn là một chiếc ghế gỗ trống và tấm bản đồ nối liền 4 vùng đất — Cổ Thành Huyết Táng, Hỏa Ngục Tàn Tro, Băng Mộ Vĩnh Cửu và Rừng Oán Niệm — với nhiều điểm đã được khoanh sẵn bằng mực đỏ."
            : "Beside an empty chair lies a joined map of all four lands — Blood Citadel, Inferno, Frozen Tomb, and Grudge Forest — with points circled long before you arrived.",
        },
        {
          speaker: isVi ? "Bức Thư Dang Dở Của Trung" : "Trung's Unfinished Letter",
          speakerColor: "#FACC15",
          text: isVi
            ? "“Duy không phải kẻ đầu tiên muốn sở hữu khu rừng. Và cũng sẽ không phải kẻ cuối cùng.”"
            : "“Duy is not the first who sought to possess this forest. And he will not be the last.”",
          subtext: isVi
            ? "Trung đã dẫn Duy đến đây bằng chính tham vọng của hắn... rồi lặng lẽ rời khỏi chiếc ghế trống trước khi rễ cây khép cửa."
            : "Trung lured Duy here through his own ambition... then vanished from the empty chair before the roots closed the door.",
        },
      ];
    } else {
      steps = [
        {
          speaker: isVi ? "Cánh Cửa Rễ Đang Khép Chặt" : "Root-Sealed Study",
          speakerColor: "#94A3B8",
          text: isVi
            ? "Cần kích hoạt bí mật tại Hồ Gương Oán Niệm (EE2) VÀ Nghĩa Địa Rễ Cây (EE3) theo đúng trình tự để rễ cây mở căn phòng của Trung."
            : "Trigger both Mirror Lake (EE2) and Root Graveyard (EE3) first to part the roots into Trung's hidden room.",
        },
      ];
    }
  } else if (nodeId === "ee6_four_map_altar") {
    themeVariant = "four_maps";
    showsFourMapMatrix = true;
    const status = checkFourMapLinkReadiness({
      citadelSecrets,
      infernoProgress,
      frozenTombProgress,
      grudgeProgress: next,
    });
    fourMapStatus = {
      map1Ready: status.map1Ready,
      map2Ready: status.map2Ready,
      map3Ready: status.map3Ready,
      map4Ready: status.map4Ready,
    };
    if (status.allReady) {
      if (!next.ee6FourMapSecretSeen) {
        next.ee6FourMapSecretSeen = true;
        unlockedNow = true;
        coinBonus += 500;
        healPct = 0.4;
      }
      isSecretDiscovery = true;
      if (!next.collectedDocs.includes("doc_ee6_four_maps")) {
        next.collectedDocs.push("doc_ee6_four_maps");
      }
      audioCue = "secret";
      darknessPulseSec = 4.5;
      steps = [
        {
          speaker: isVi ? "Bốn Ký Hiệu Cổ Hội Tụ" : "Four Ancient Crests Converge",
          speakerColor: "#FACC15",
          text: isVi
            ? "Ma Thạch Huyết Táng, Quả Cầu Hỏa Ngục, Mảnh Băng Phong Ấn và Hạt Rễ Oán Niệm cùng phát sáng quanh thân Cổ Thụ Khổng Lồ."
            : "Bloodstone, Inferno Orb, Frozen Seal Shard, and Forest Root-Seed ignite simultaneously across the Great Tree's altar.",
        },
        {
          speaker: isVi ? "Dòng Chữ Hiện Lên Trên Vỏ Cây" : "Inscription Across the Bark",
          speakerColor: "#C084FC",
          text: isVi
            ? "“Máu có thể đánh thức. Ký ức có thể thay đổi. Phong ấn có thể giam giữ. Nhưng rễ cây... có thể giữ lại những gì cả thế giới muốn quên.”"
            : "“Blood can awaken. Memory can be altered. Seals can imprison. Yet the roots... can preserve whatever the entire world wished to forget.”",
        },
      ];
    } else {
      audioCue = "chime";
      steps = [
        {
          speaker: isVi ? "Đài Liên Kết 4 Bản Đồ (Chưa Đủ Cộng Hưởng)" : "Four-Realm Altar (Incomplete)",
          speakerColor: "#C084FC",
          text: isVi
            ? `Cần hoàn thành đủ manh mối liên kết ở cả 4 bản đồ: Cổ Thành (${status.map1Ready ? "✓" : "○"}) · Hỏa Ngục (${status.map2Ready ? "✓" : "○"}) · Băng Mộ (${status.map3Ready ? "✓" : "○"}) · Rừng Oán Niệm (${status.map4Ready ? "✓" : "○"}).`
            : `Requires linked secrets from all 4 maps: Citadel (${status.map1Ready ? "✓" : "○"}) · Inferno (${status.map2Ready ? "✓" : "○"}) · Frozen Tomb (${status.map3Ready ? "✓" : "○"}) · Grudge Forest (${status.map4Ready ? "✓" : "○"}).`,
        },
      ];
    }
  } else if (nodeId === "forest_heart_boss_altar") {
    themeVariant = "four_maps";
    const bossGone = Boolean(next.bossClearedAmbiguous || runtime?.bossDefeatedThisRun);
    if (!bossGone && !runtime?.bossSpawnedThisRun) {
      spawnForestBoss = true;
      audioCue = "root_erupt";
      darknessPulseSec = 2.8;
      steps = [
        {
          speaker: isVi ? "Cổ Thụ Hình Sinh Vật Đang Ngủ" : "Sleeping Tree Colossus",
          speakerColor: "#A855F7",
          text: isVi
            ? "Những chùm rễ khổng lồ co giật dữ dội dưới mặt đất. Một đôi mắt khổng lồ chậm rãi hé mở từ lớp vỏ cây xám đen — KẺ NGỦ DƯỚI RỄ CÂY đã tỉnh giấc!"
            : "Colossal roots shudder beneath the clearing as vast glowing eyes part the dark bark — THE SLEEPER BENEATH THE ROOTS awakens!",
        },
      ];
    } else {
      audioCue = "flute";
      steps = [
        {
          speaker: isVi ? "Trái Tim Rừng Sâu" : "Heart of the Deep Woods",
          speakerColor: "#34D399",
          text: isVi
            ? "Những chùm rễ lớn đã rút xuống lòng đất... nhưng không ai biết thứ nằm bên dưới đã thực sự biến mất hay chỉ đổi chỗ."
            : "The great roots have sunken back below... leaving no proof whether it perished or moved elsewhere.",
        },
      ];
    }
  } else if (nodeId === "ending_moving_root") {
    next.endingRootSeen = true;
    if (!next.collectedDocs.includes("doc_ending_root")) {
      next.collectedDocs.push("doc_ending_root");
    }
    return {
      nextProgress: next,
      payload: buildGrudgeForestEndingPayload(next, lang),
      coinBonus: 0,
      darknessPulseSec: 3.5,
    };
  } else {
    const doc = node.docId ? GRUDGE_FOREST_DOCS[node.docId] : null;
    if (doc && !next.collectedDocs.includes(doc.id)) {
      next.collectedDocs.push(doc.id);
      coinBonus += 45;
    }
    audioCue = node.zoneId === "zone_2" ? "whisper" : "flute";
    steps = (doc?.paragraphs || []).map((p, i) => ({
      speaker: i === 0 ? (isVi ? doc!.title.vi : doc!.title.en) : isVi ? "Ghi Chép Rừng Sâu" : "Forest Log",
      speakerColor: "#34D399",
      text: isVi ? p.vi : p.en,
    }));
  }

  const docEntry = node.docId ? GRUDGE_FOREST_DOCS[node.docId] : null;
  const zone = GRUDGE_FOREST_ZONES.find((z) => z.id === node.zoneId) || GRUDGE_FOREST_ZONES[0];
  const secretCount = countGrudgeForestSecrets(next);

  return {
    nextProgress: next,
    coinBonus,
    healPct,
    spawnMimicAmbush,
    spawnForestBoss,
    spawnRootTrapWarning,
    darknessPulseSec,
    claimMazeVaultWeapon,
    payload: {
      nodeId,
      zoneId: node.zoneId,
      title: isVi ? node.title.vi : node.title.en,
      subtitle: docEntry
        ? isVi
          ? docEntry.subtitle.vi
          : docEntry.subtitle.en
        : isVi
        ? zone.name.vi
        : zone.name.en,
      code: docEntry?.code || "RON-LOG",
      themeVariant,
      isSecretDiscovery,
      unlockedNow,
      showsFourMapMatrix,
      fourMapStatus,
      mirrorVisionTag,
      steps,
      paragraphs: steps.map((s) => s.text),
      clueSummary: isVi
        ? `Bí mật Rừng Oán Niệm: ${secretCount}/6`
        : `Grudge Forest Secrets: ${secretCount}/6`,
      rewardText: coinBonus > 0 ? `+${coinBonus} ${isVi ? "Vàng" : "Gold"}` : undefined,
      audioCue,
      progress: next,
    },
  };
}

export function getGrudgeForestCompassTarget(
  heroId: string,
  progress: Partial<GrudgeForestProgressState>,
  lang: "vi" | "en" = "vi"
): { x: number; y: number; color: string; bg: string; icon: string; tag: string } | null {
  const norm = normalizeGrudgeForestProgress(progress);
  if (heroId === "duy" && !norm.ee1SecretHouseSeen) {
    const n = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === "ee1_secret_puppet_house")!;
    return {
      x: n.x,
      y: n.y,
      color: "#F472B6",
      bg: "rgba(80, 7, 36, 0.92)",
      icon: "🎭",
      tag: lang === "en" ? "PUPPET HOUSE" : "NHÀ RỐI DUY",
    };
  }
  if (!norm.ee2MirrorLakeSeen) {
    const n = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === "ee2_mirror_lake_bank")!;
    return {
      x: n.x,
      y: n.y,
      color: "#A855F7",
      bg: "rgba(59, 7, 100, 0.92)",
      icon: "🪞",
      tag: lang === "en" ? "MIRROR LAKE" : "HỒ GƯƠNG",
    };
  }
  if (!norm.ee3DuyLaughHeard) {
    const n = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === "ee3_duy_tombstone")!;
    return {
      x: n.x,
      y: n.y,
      color: "#94A3B8",
      bg: "rgba(15, 23, 42, 0.92)",
      icon: "🪦",
      tag: lang === "en" ? "DUY STONE" : "BIA MỘ DUY",
    };
  }
  if (norm.ee5TrungRoomUnlocked && !norm.ee5TrungRoomSeen) {
    const n = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === "ee5_trung_hidden_room")!;
    return {
      x: n.x,
      y: n.y,
      color: "#FACC15",
      bg: "rgba(66, 32, 6, 0.92)",
      icon: "🕯️",
      tag: lang === "en" ? "TRUNG ROOM" : "PHÒNG TRUNG",
    };
  }
  if (!norm.bossClearedAmbiguous) {
    const n = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === "forest_heart_boss_altar")!;
    return {
      x: n.x,
      y: n.y,
      color: "#34D399",
      bg: "rgba(6, 78, 59, 0.92)",
      icon: "🌳",
      tag: lang === "en" ? "FOREST HEART" : "TRÁI TIM RỪNG",
    };
  }
  if (!norm.ee6FourMapSecretSeen) {
    const n = GRUDGE_FOREST_INTERACTABLES.find((x) => x.id === "ee6_four_map_altar")!;
    return {
      x: n.x,
      y: n.y,
      color: "#FACC15",
      bg: "rgba(76, 29, 149, 0.92)",
      icon: "✦",
      tag: lang === "en" ? "4-MAP ALTAR" : "ĐÀI 4 BẢN ĐỒ",
    };
  }
  return null;
}

export interface GrudgeForestHazardTickResult {
  playerDamage: number;
  applySlow?: { duration: number; factor: number };
  applyRootSec?: number;
  applyPoison?: { dps: number; duration: number };
  mazeShifted: boolean;
  ambushSpawns: GrudgeForestAmbushPoint[];
  mushroomLureSpawns: GrudgeForestMushroomNode[];
  soundEvents: Array<"root_erupt" | "twig" | "whisper" | "chime" | "flute" | "maze_shift">;
  visionDimFactor: number;
}

export function stepGrudgeForestHazards({
  runtime,
  dt,
  playerX,
  playerY,
  playerRadius,
  playerAlive,
  entitiesForMazeSafety,
}: {
  runtime: GrudgeForestRuntimeState;
  dt: number;
  playerX: number;
  playerY: number;
  playerRadius: number;
  playerAlive: boolean;
  entitiesForMazeSafety: Array<{ x: number; y: number; radius?: number }>;
}): GrudgeForestHazardTickResult {
  const result: GrudgeForestHazardTickResult = {
    playerDamage: 0,
    mazeShifted: false,
    ambushSpawns: [],
    mushroomLureSpawns: [],
    soundEvents: [],
    visionDimFactor: 0,
  };

  if (runtime.darknessPulseSec > 0) runtime.darknessPulseSec = Math.max(0, runtime.darknessPulseSec - dt);
  if (runtime.lastDiscoveryTimer > 0) {
    runtime.lastDiscoveryTimer = Math.max(0, runtime.lastDiscoveryTimer - dt);
    if (runtime.lastDiscoveryTimer <= 0) runtime.lastDiscoveryToast = null;
  }

  for (const d of runtime.destructibles) {
    if (d.hitFlash > 0) d.hitFlash = Math.max(0, d.hitFlash - dt);
  }

  // Dynamic Gate Signposts mutation cycle
  runtime.signpostTimer -= dt;
  if (runtime.signpostTimer <= 0) {
    runtime.signpostTimer = 11;
    runtime.signpostVariant = (runtime.signpostVariant + 1) % GRUDGE_FOREST_SIGNPOST_TEXTS.length;
  }

  // Mirror Lake timing resonance window (cycles cleanly every 9.5s, open for 4.2s)
  runtime.mirrorCycleSec = (runtime.mirrorCycleSec + dt) % 9.5;
  runtime.mirrorResonanceWindow = runtime.mirrorCycleSec <= 4.2 ? 4.2 - runtime.mirrorCycleSec : 0;

  // Observing tree eyes smoothly track player angle
  for (const tree of runtime.observingTrees) {
    const targetAng = Math.atan2(playerY - tree.y, playerX - tree.x);
    let diff = targetAng - tree.eyeAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    tree.eyeAngle += diff * Math.min(1, dt * 4.5);
    tree.blinkTimer -= dt;
    if (tree.blinkTimer <= -0.18) {
      tree.blinkTimer = 3.2 + (tree.x % 2.4);
    }
  }

  // Zone 5 Shifting Maze timer
  runtime.mazeShiftTimer -= dt;
  const inZone5 = playerX >= 3120 && playerY <= 2280;
  if (runtime.mazeShiftTimer <= 0 || runtime.pendingMazeShift) {
    // Prefer shifting when player moves around or after interval
    const { shifted } = shiftGrudgeMazeSafely(runtime, entitiesForMazeSafety);
    if (shifted) {
      runtime.mazeShiftTimer = inZone5 ? 14 : 20;
      result.mazeShifted = true;
      if (inZone5) result.soundEvents.push("twig");
    } else {
      runtime.mazeShiftTimer = 2.0;
    }
  }

  // False memory brief flashbacks
  if (runtime.falseMemoryFlash.timer > 0) {
    runtime.falseMemoryFlash.timer = Math.max(0, runtime.falseMemoryFlash.timer - dt);
    if (runtime.falseMemoryFlash.timer <= 0) {
      runtime.falseMemoryFlash.kind = null;
    }
  }
  for (const fm of runtime.falseMemoryZones) {
    if (fm.cooldown > 0) fm.cooldown = Math.max(0, fm.cooldown - dt);
    if (playerAlive && fm.cooldown <= 0 && Math.hypot(playerX - fm.x, playerY - fm.y) <= fm.radius) {
      fm.cooldown = 26;
      runtime.falseMemoryFlash = { kind: fm.memoryMap, timer: 1.85 };
      result.soundEvents.push("chime");
    }
  }

  // Mushrooms: safe glowing guides heal lightly, trap mushrooms release spores & lure enemies
  for (const m of runtime.mushrooms) {
    m.pulsePhase += dt * 2.4;
    if (m.cooldown > 0) m.cooldown = Math.max(0, m.cooldown - dt);
    if (playerAlive && m.cooldown <= 0 && Math.hypot(playerX - m.x, playerY - m.y) <= m.radius + playerRadius * 0.5) {
      if (m.kind === "guide") {
        m.cooldown = 16;
        m.triggeredCount++;
        result.soundEvents.push("chime");
      } else {
        m.cooldown = 12;
        m.triggeredCount++;
        result.playerDamage += 115;
        result.applyPoison = { dps: 44, duration: 3.5 };
        result.applySlow = { duration: 1.5, factor: 0.25 };
        result.mushroomLureSpawns.push(m);
        result.soundEvents.push("twig");
      }
    }
  }

  // Erupting root traps
  for (const rt of runtime.rootTraps) {
    if (rt.state === "cooldown") {
      rt.timer -= dt;
      if (rt.timer <= 0 && playerAlive && Math.hypot(playerX - rt.x, playerY - rt.y) <= rt.radius + 140) {
        rt.state = "telegraph";
        rt.timer = 1.05;
        rt.didRoot = false;
        result.soundEvents.push("twig");
      } else if (rt.timer <= 0) {
        rt.timer = 1.2;
      }
    } else if (rt.state === "telegraph") {
      rt.timer -= dt;
      if (rt.timer <= 0) {
        rt.state = "erupt";
        rt.timer = 1.3;
        result.soundEvents.push("root_erupt");
        if (playerAlive && !rt.didRoot && Math.hypot(playerX - rt.x, playerY - rt.y) <= rt.radius + playerRadius * 0.65) {
          rt.didRoot = true;
          result.playerDamage += 155;
          result.applyRootSec = Math.max(result.applyRootSec || 0, 1.0);
        }
      }
    } else {
      rt.timer -= dt;
      if (rt.timer <= 0) {
        rt.state = "cooldown";
        rt.timer = rt.cooldownDuration;
      }
    }
  }

  // Fog pockets dimming player vision slightly
  let maxDim = 0;
  for (const fp of runtime.fogPockets) {
    fp.phase += dt * 0.9;
    if (playerAlive && Math.hypot(playerX - fp.x, playerY - fp.y) <= fp.radius) {
      maxDim = Math.max(maxDim, fp.density * 0.55);
      result.applySlow = result.applySlow || { duration: 0.35, factor: 0.1 };
    }
  }
  result.visionDimFactor = maxDim;

  // Falling trees (safe placement check when collapsing)
  for (const ft of runtime.fallingTrees) {
    if (ft.state === "standing") {
      if (playerAlive && Math.hypot(playerX - ft.triggerX, playerY - ft.triggerY) <= 130) {
        ft.state = "warning";
        ft.timer = 1.35;
        ft.didHit = false;
        result.soundEvents.push("twig");
      }
    } else if (ft.state === "warning") {
      ft.timer -= dt;
      if (ft.timer <= 0) {
        if (canEntitiesSafelyAcceptObstacles([ft], entitiesForMazeSafety)) {
          ft.state = "fallen";
          ft.timer = 14;
          result.soundEvents.push("root_erupt");
        } else {
          // If an entity sits directly under trunk, knock back/damage lightly or hold standing cleanly
          ft.state = "fallen";
          ft.timer = 14;
          if (playerAlive && !ft.didHit && isEntityOverlappingRect(playerX, playerY, playerRadius, ft, 16)) {
            ft.didHit = true;
            result.playerDamage += 145;
            result.applySlow = { duration: 1.2, factor: 0.3 };
          }
          // Push overlapping entities safely out via caller's resolveEntityObstacles
        }
      }
    } else {
      ft.timer -= dt;
      if (ft.timer <= 0) {
        ft.state = "standing";
      }
    }
  }

  // Ambush points
  for (const amb of runtime.ambushPoints) {
    if (amb.state === "armed") {
      if (playerAlive && Math.hypot(playerX - amb.x, playerY - amb.y) <= amb.triggerRadius) {
        amb.state = "warning";
        amb.timer = 1.0;
        result.soundEvents.push("whisper");
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

  // Sudden silence zones
  runtime.inSilenceZone = runtime.silenceZones.some(
    (s) => Math.hypot(playerX - s.x, playerY - s.y) <= s.radius
  );

  // Ambient village whisper cue
  const inVillage = playerX < 1540 && playerY >= 1460 && playerY <= 2840;
  if (inVillage) {
    runtime.villageVoiceTimer -= dt;
    if (runtime.villageVoiceTimer <= 0) {
      runtime.villageVoiceTimer = 11.5;
      result.soundEvents.push("whisper");
    }
  }

  // Ownerless trailing footprints appearing behind the player
  for (let i = runtime.trailingFootprints.length - 1; i >= 0; i--) {
    const f = runtime.trailingFootprints[i];
    f.life += dt;
    if (f.life >= f.maxLife) runtime.trailingFootprints.splice(i, 1);
  }
  runtime.footprintSpawnTimer -= dt;
  if (playerAlive && runtime.footprintSpawnTimer <= 0) {
    runtime.footprintSpawnTimer = 0.72;
    const backAng = runtime.lastPlayerAngle + Math.PI;
    const sideOffset = (runtime.trailingFootprints.length % 2 === 0 ? 1 : -1) * 9;
    const fx = playerX + Math.cos(backAng) * 58 + Math.cos(backAng + Math.PI / 2) * sideOffset;
    const fy = playerY + Math.sin(backAng) * 58 + Math.sin(backAng + Math.PI / 2) * sideOffset;
    if (runtime.trailingFootprints.length < 18) {
      runtime.trailingFootprints.push({
        x: fx,
        y: fy,
        angle: runtime.lastPlayerAngle,
        life: 0,
        maxLife: 4.8,
      });
    }
  }

  // Phantoms fade & motion
  for (let i = runtime.phantoms.length - 1; i >= 0; i--) {
    const ph = runtime.phantoms[i];
    ph.life += dt;
    ph.x += (ph.targetX - ph.x) * Math.min(1, dt * 1.15);
    ph.y += (ph.targetY - ph.y) * Math.min(1, dt * 1.15);
    const p = ph.life / Math.max(0.2, ph.maxLife);
    ph.alpha = p < 0.7 ? 0.85 : Math.max(0, (1 - p) / 0.3);
    if (ph.life >= ph.maxLife) runtime.phantoms.splice(i, 1);
  }

  return result;
}

export function resolveGrudgeForestObstacles(
  x: number,
  y: number,
  radius: number,
  progress?: Partial<GrudgeForestProgressState>,
  runtime?: GrudgeForestRuntimeState | null
): { x: number; y: number } {
  const obstacles = getActiveGrudgeForestObstacles(progress, runtime);
  return resolveCircleObstacles(x, y, radius, obstacles, GRUDGE_FOREST_WIDTH, GRUDGE_FOREST_HEIGHT);
}
