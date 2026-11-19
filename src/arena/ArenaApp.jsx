import * as ie from "react";
import * as u from "react/jsx-runtime";
import { Mi, zr, Si, Ff, Ef, R, um } from "./gameData";
import { GameEngine as Hf } from "./GameEngine";
import { SKILL_ICON_DATA_URLS, HERO_SKILL_ICONS } from "./skillIcons";
import { mpClient } from "./multiplayerClient";
import { MultiplayerLobbyModal } from "./MultiplayerLobbyModal";
import { detectClientEnvironment, isPrivateOrDevOrigin, classifyJoinCode, sortItemsByRarityAsc, sortItemsByRarityDesc, isSixDigitCode, computeCameraViewportConfig, computeJoystickDragRadius, DUY_DECOY_REFLECT_RATIO, normalizeQualityMode, normalizeFpsCapMode } from "./combatLogic";
import { MobaLobbyMenu, MobaHeroSelect } from "./MobaLobbyViews";
import PlayerAccountModal from "./PlayerAccountModal";
import AuthErrorBanner from "./AuthErrorBanner";
import ChroniclesModal from "./ChroniclesModal";
import { CitadelTacticalMinimap, CitadelLoreCrest } from "./CitadelVisuals";
import { InfernoTacticalMinimap, InfernoStoryModal, InfernoJournalModal } from "./InfernoVisuals";
import { FrozenTombTacticalMinimap, FrozenTombStoryModal, FrozenTombJournalModal } from "./FrozenTombVisuals";
import { GrudgeForestTacticalMinimap, GrudgeForestStoryModal, GrudgeForestJournalModal } from "./GrudgeForestVisuals";
import {
  ARENA_MAPS,
  CITADEL_UNLOCK_WAVE,
  createDefaultCitadelSecrets,
  normalizeCitadelSecrets,
  computeUnlockedMaps,
  getMapUnlockRequirement,
  getNextCampaignMapId,
  isMapUnlocked,
  normalizeArenaMapId,
} from "./bloodCitadelMap";
import {
  createDefaultInfernoProgress,
  mergeInfernoProgress,
  normalizeInfernoProgress,
} from "./infernoAshMap";
import {
  createDefaultFrozenTombProgress,
  mergeFrozenTombProgress,
  normalizeFrozenTombProgress,
  FROZEN_TOMB_DOCS,
} from "./frozenTombMap";
import {
  createDefaultGrudgeForestProgress,
  mergeGrudgeForestProgress,
  normalizeGrudgeForestProgress,
  GRUDGE_FOREST_DOCS,
  countGrudgeForestSecrets,
} from "./grudgeForestMap";
import {
  GAME_SAVE_STORAGE_KEY,
  MP_PLAYER_NAME_STORAGE_KEY,
  PLAYER_PROFILE_STORAGE_KEY,
  DAILY_CHECKIN_REWARD,
  canClaimDailyCheckIn,
  computeUnlockedTitles,
  deserializeHeroGearEntries,
  deserializeHeroStatsEntries,
  getTodayDateKey,
  loadLocalPlayerProfile,
  mergeHeroStatsMaps,
  mergeLocalAndCloudProgress,
  normalizeDisplayName,
  parseSavePackageJson,
  recordHeroMatchProgress,
  sanitizeGooglePhotoUrl,
  saveLocalPlayerProfile,
  serializeHeroGearEntries,
  serializeHeroStatsEntries,
} from "./playerAccount";
import {
  DEVICE_SETTINGS_STORAGE_KEY,
  decodeDeviceTransferCode,
  encodeDeviceTransferCode,
  hydrateDeviceStorageAsync,
  isStaticWebHost,
  loadDeviceRecord,
  loadDeviceSettings,
  readDeviceKey,
  requestPersistentStorage,
  saveDeviceSettings,
  touchDeviceVisit,
  writeDeviceKey,
} from "./deviceStorage";
import {
  FOUNDER_EMAIL,
  fetchOwnPublicProfile,
  fetchPrivatePlayerSave,
  logFounderAuditEvent,
  savePrivatePlayerSave,
  signInFounderWithGoogle,
  signInPlayerWithGoogle,
  signOutFounderAuth,
  signOutPlayer,
  subscribeToAuthChanges,
  syncFounderUnlockToFirestore,
  upsertPublicPlayerProfile,
} from "../firebase";
var Df = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), If = (s) => s.replace(/^([A-Z])|[\s-_]+(\w)/g, (a, l, m) => m ? m.toUpperCase() : l.toLowerCase()), dm = (s) => {
  let a = If(s);
  return a.charAt(0).toUpperCase() + a.slice(1);
}, Tm = (...s) => s.filter((a, l, m) => !!a && a.trim() !== "" && m.indexOf(a) === l).join(" ").trim(), Lf = (s) => {
  for (let a in s) if (a.startsWith("aria-") || a === "role" || a === "title") return true;
}, Bf = { xmlns: "http://www.w3.org/2000/svg", width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, Af = (0, ie.forwardRef)(({ color: s = "currentColor", size: a = 24, strokeWidth: l = 2, absoluteStrokeWidth: m, className: c = "", children: g, iconNode: p, ...h }, f) => (0, ie.createElement)("svg", { ref: f, ...Bf, width: a, height: a, stroke: s, strokeWidth: m ? Number(l) * 24 / Number(a) : l, className: Tm("lucide", c), ...!g && !Lf(h) && { "aria-hidden": "true" }, ...h }, [...p.map(([v, T]) => (0, ie.createElement)(v, T)), ...Array.isArray(g) ? g : [g]])), _t = (s, a) => {
  let l = (0, ie.forwardRef)(({ className: m, ...c }, g) => (0, ie.createElement)(Af, { ref: g, iconNode: a, className: Tm(`lucide-${Df(dm(s))}`, `lucide-${s}`, m), ...c }));
  return l.displayName = dm(s), l;
}, jf = _t("arrow-up-down", [["path", { d: "m21 16-4 4-4-4", key: "f6ql7i" }], ["path", { d: "M17 20V4", key: "1ejh1v" }], ["path", { d: "m3 8 4-4 4 4", key: "11wl7u" }], ["path", { d: "M7 4v16", key: "1glfcx" }]]), Rf = _t("briefcase", [["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "jecpp" }], ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2", key: "i6l2r4" }]]), zf = _t("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]), ml = _t("coins", [["circle", { cx: "8", cy: "8", r: "6", key: "3yglwk" }], ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18", key: "t5s6rm" }], ["path", { d: "M7 6h1v4", key: "1obek4" }], ["path", { d: "m16.71 13.88.7.71-2.82 2.82", key: "1rbuyh" }]]), $f = _t("heart-pulse", [["path", { d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5", key: "mvr1a0" }], ["path", { d: "M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27", key: "auskq0" }]]), Of = _t("layers", [["path", { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z", key: "zw3jo" }], ["path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12", key: "1wduqc" }], ["path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17", key: "kqbvx6" }]]), Gf = _t("layout-grid", [["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }], ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }], ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }], ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }]]), Wf = _t("lightbulb", [["path", { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5", key: "1gvzjb" }], ["path", { d: "M9 18h6", key: "x1upvd" }], ["path", { d: "M10 22h4", key: "ceow96" }]]), Kf = _t("package-check", [["path", { d: "m16 16 2 2 4-4", key: "gfu2re" }], ["path", { d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14", key: "e7tb2h" }], ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }], ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }], ["line", { x1: "12", x2: "12", y1: "22", y2: "12", key: "a4e8g8" }]]), mm = _t("rotate-ccw", [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }], ["path", { d: "M3 3v5h5", key: "1xhq8a" }]]), pm = _t("search", [["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }], ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]]), Uf = _t("shield", [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", key: "oel41y" }]]), gm = _t("shopping-bag", [["path", { d: "M16 10a4 4 0 0 1-8 0", key: "1ltviw" }], ["path", { d: "M3.103 6.034h17.794", key: "awc11p" }], ["path", { d: "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z", key: "o988cm" }]]), Vf = _t("sparkles", [["path", { d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z", key: "1s2grr" }], ["path", { d: "M20 2v4", key: "1rf3ol" }], ["path", { d: "M22 4h-4", key: "gwowj6" }], ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]]), Mm = _t("sword", [["path", { d: "m11 19-6-6", key: "s7kpr" }], ["path", { d: "m5 21-2-2", key: "1kw20b" }], ["path", { d: "m8 16-4 4", key: "1oqv8h" }], ["path", { d: "M9.5 17.5 21 6V3h-3L6.5 14.5", key: "pkxemp" }]]), Gc = _t("x", [["path", { d: "M18 6 6 18", key: "1bl5f8" }], ["path", { d: "m6 6 12 12", key: "d8bk6v" }]]), qf = _t("zap", [["path", { d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z", key: "1xq2db" }]]), Wn = { basic: { key: "basic", label: "Th\u01B0\u1EDDng \xB7 C\u01A1 B\u1EA3n", shortLabel: "Th\u01B0\u1EDDng", rank: 1, color: "#94A3B8", border: "rgba(148, 163, 184, 0.35)", glow: "rgba(148, 163, 184, 0.16)", bgTint: "rgba(148, 163, 184, 0.08)" }, intermediate: { key: "intermediate", label: "Trung C\u1EA5p \xB7 Tinh Luy\u1EC7n", shortLabel: "Trung C\u1EA5p", rank: 2, color: "#60A5FA", border: "rgba(59, 130, 246, 0.55)", glow: "rgba(59, 130, 246, 0.25)", bgTint: "rgba(59, 130, 246, 0.10)" }, advanced: { key: "advanced", label: "Cao C\u1EA5p \xB7 Tinh Anh", shortLabel: "Cao C\u1EA5p", rank: 3, color: "#34D399", border: "rgba(16, 185, 129, 0.55)", glow: "rgba(16, 185, 129, 0.25)", bgTint: "rgba(16, 185, 129, 0.10)" }, rare: { key: "rare", label: "Hi\u1EBFm \xB7 Lam B\u1EA3o", shortLabel: "Hi\u1EBFm", rank: 4, color: "#38BDF8", border: "rgba(6, 182, 212, 0.65)", glow: "rgba(6, 182, 212, 0.30)", bgTint: "rgba(6, 182, 212, 0.12)" }, epic: { key: "epic", label: "S\u1EED Thi \xB7 T\u1EED Quang", shortLabel: "S\u1EED Thi", rank: 5, color: "#C084FC", border: "rgba(168, 85, 247, 0.7)", glow: "rgba(168, 85, 247, 0.35)", bgTint: "rgba(168, 85, 247, 0.14)" }, mythic: { key: "mythic", label: "Th\u1EA7n Tho\u1EA1i \xB7 Ch\xED T\xF4n", shortLabel: "Th\u1EA7n Tho\u1EA1i", rank: 6, color: "#FBBF24", border: "rgba(245, 158, 11, 0.85)", glow: "rgba(245, 158, 11, 0.45)", bgTint: "linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(220, 38, 38, 0.14))" } }, Gn = { weapon: "V\u0169 Kh\xED", armor: "Gi\xE1p Tr\u1EE5", boots: "Gi\xE0y Chi\u1EBFn", gloves: "G\u0103ng Tay", necklace: "Trang S\u1EE9c", relic: "Th\xE1nh V\u1EADt" };
function fm(s) {
  let a = s.stats || {}, l = /* @__PURE__ */ new Set();
  if (a.atk || a.crit || a.critExtraDmg || a.as || a.attackRampAs || a.lightningChance || a.bossDmgBonus || a.hitProcCount || a.skillBurstChance || a.bossSkillExtraDmg || a.bleedDps || s.activeSkill?.kind === "blood_frenzy" || s.activeSkill?.kind === "emperor_ascension") l.add("attack");
  if (a.hp || a.dmgRed || a.ccReduce || a.reflect || a.frostThornsChance || a.thornsBurstDmg || a.lowHpDmgRed || a.autoShield20 || a.autoShield25 || a.autoShield30 || a.waveStartShield || a.skillHitShield || a.excessHealShield || a.revivePct || s.activeSkill?.kind === "aegis_barrier" || s.activeSkill?.kind === "frost_stasis" || s.activeSkill?.kind === "crimson_phase" || s.activeSkill?.kind === "immortal_dome") l.add("defense");
  if (a.matk || a.aoeAmp || a.skillBurstChance || a.bossSkillExtraDmg || a.lightningChance || a.cdr || s.activeSkill?.kind === "storm_wrath") l.add("magic");
  if (a.ms || a.as || a.attackRampAs || a.cdr || a.killCdrRefund || a.dashAttackSpeed || a.skillMoveSpeedBonus) l.add("speed");
  if (a.hpRegen || a.lifesteal || a.lowHpLifesteal || a.critLifestealHeal || a.killHeal || a.healAmp || a.autoHeal20 || a.autoShield20 || a.autoShield25 || a.autoShield30 || a.excessHealShield || a.revivePct || s.activeSkill?.kind === "soul_surge") l.add("recovery");
  let m = !!(s.activeSkill || a.lightningChance || a.frostThornsChance || a.thornsBurstDmg || a.killHeal || a.reflect || a.ccReduce || a.lowHpDmgRed || a.autoShield20 || a.autoShield25 || a.autoShield30 || a.dashAttackSpeed || a.skillBurstChance || a.bossDmgBonus || a.hitProcCount || a.healAmp || a.bossSkillExtraDmg || a.aoeAmp || a.autoHeal20 || a.waveStartShield || a.skillMoveSpeedBonus || a.excessHealShield || a.skillHitShield || a.revivePct || a.bleedDps || a.killCdrRefund || a.lowHpLifesteal || a.attackRampAs || a.critLifestealHeal);
  if (l.size >= 2 || m) l.add("utility");
  return Array.from(l);
}
function ym(s) {
  let a = s.stats || {}, l = [];
  if (a.atk) l.push({ label: "Sức mạnh công kích", value: `+${a.atk}`, color: "#FB7185" });
  if (a.matk) l.push({ label: "Sức mạnh phép thuật", value: `+${a.matk}`, color: "#A78BFA" });
  if (a.hp) l.push({ label: "Máu tối đa", value: `+${a.hp} HP`, color: "#34D399" });
  if (a.hpRegen) l.push({ label: "Hồi máu cơ bản", value: `+${a.hpRegen}%`, color: "#4ADE80" });
  if (a.as) l.push({ label: "Tốc độ đánh", value: `+${Math.round(a.as * 100)}%`, color: "#FBBF24" });
  if (a.crit) l.push({ label: "Tỷ lệ chí mạng", value: `+${Math.round(a.crit * 100)}%`, color: "#F97316" });
  if (a.ms) l.push({ label: "Tốc độ di chuyển", value: `+${Math.round(a.ms * 100)}%`, color: "#38BDF8" });
  if (a.cdr) l.push({ label: "Giảm hồi chiêu", value: `+${Math.round(a.cdr * 100)}%`, color: "#60A5FA" });
  if (a.lifesteal) l.push({ label: "Hút máu", value: `+${Math.round(a.lifesteal * 100)}%`, color: "#F43F5E" });
  if (a.dmgRed) l.push({ label: "Giảm sát thương nhận", value: `+${Math.round(a.dmgRed * 100)}%`, color: "#94A3B8" });
  if (a.ccReduce) l.push({ label: "Kháng khống chế", value: `+${Math.round(a.ccReduce * 100)}%`, color: "#2DD4BF" });
  if (a.reflect) l.push({ label: "Phản sát thương", value: `${Math.round(a.reflect * 100)}%`, color: "#FDBA74" });
  if (a.healAmp) l.push({ label: "Hiệu quả hồi phục", value: `+${Math.round(a.healAmp * 100)}%`, color: "#6EE7B7" });
  if (a.bossDmgBonus) l.push({ label: "Sát thương lên Boss", value: `+${Math.round(a.bossDmgBonus * 100)}%`, color: "#FCA5A5" });
  if (a.aoeAmp) l.push({ label: "Phạm vi nổ kỹ năng", value: `+${Math.round(a.aoeAmp * 100)}%`, color: "#C084FC" });
  return l;
}
function getItemPassives(s) {
  let a = s.stats || {}, list = [];
  if (a.revivePct) list.push({ name: "Nội tại · Phượng Hoàng Tái Sinh", trigger: "Khi nhận sát thương chí tử", effect: `Hồi sinh với ${Math.round(a.revivePct * 100)}% HP tối đa & bất tử tạm thời.`, cooldown: `Hồi chiêu: ${a.reviveCd || 120}s` });
  if (a.lightningChance) list.push({ name: "Nội tại · Sấm Sét Dẫn Truyền", trigger: "Khi đánh thường trúng mục tiêu", effect: `Có ${Math.round(a.lightningChance * 100)}% cơ hội giật tia sét gây thêm ${a.lightningDmg || 35} sát thương.` });
  if (a.frostThornsChance) list.push({ name: "Nội tại · Gai Băng Phản Chấn", trigger: "Khi chịu đòn tấn công từ kẻ địch", effect: `Có ${Math.round(a.frostThornsChance * 100)}% cơ hội làm chậm kẻ tấn công${a.frostSlowDur ? ` trong ${a.frostSlowDur.toFixed(1)} giây` : ""}.` });
  if (a.thornsBurstDmg) list.push({ name: "Nội tại · Phản Chấn Bùng Nổ", trigger: "Khi chịu sát thương từ kẻ địch", effect: `Phát nổ xung kích gây ${a.thornsBurstDmg} sát thương xung quanh.` });
  if (a.skillHitShield) list.push({ name: "Nội tại · Hộ Thuẫn Kỹ Năng", trigger: "Khi kỹ năng đánh trúng kẻ địch", effect: `Tạo ngay lá chắn hấp thụ ${a.skillHitShield} HP.`, cooldown: `Hồi chiêu: ${a.skillHitShieldCd || 8}s` });
  if (a.excessHealShield) list.push({ name: "Nội tại · Sinh Lực Tràn Đầy", trigger: "Khi nhận hồi máu vượt quá HP tối đa", effect: `Chuyển hóa ${Math.round(a.excessHealShield * 100)}% lượng hồi vượt mức thành lá chắn.` });
  if (a.lowHpDmgRed) list.push({ name: "Nội tại · Ý Chí Bất Khuất", trigger: "Khi HP giảm xuống dưới 40%", effect: `Nhận thêm +${Math.round(a.lowHpDmgRed * 100)}% miễn thương.` });
  if (a.lowHpLifesteal) list.push({ name: "Nội tại · Khát Máu Sinh Tồn", trigger: "Khi HP giảm xuống dưới 45%", effect: `Nhận thêm +${Math.round(a.lowHpLifesteal * 100)}% hút máu.` });
  if (a.bleedDps) list.push({ name: "Nội tại · Vết Thương Sâu", trigger: "Khi đòn đánh trúng mục tiêu", effect: `Gây xuất huyết ${a.bleedDps} sát thương/giây trong 3 giây.` });
  if (a.killCdrRefund) list.push({ name: "Nội tại · Đoạt Mệnh Hồi Chiêu", trigger: "Khi hạ gục kẻ địch", effect: `Giảm ngay ${Number(a.killCdrRefund).toFixed(1)}s thời gian hồi chiêu.` });
  if (a.attackRampAs) list.push({ name: "Nội tại · Cuồng Phong Liên Kích", trigger: "Mỗi đòn đánh trúng mục tiêu", effect: `Tăng +${Math.round(a.attackRampAs * 100)}% tốc độ đánh (tối đa 5 tầng).` });
  if (a.critLifestealHeal) list.push({ name: "Nội tại · Huyết Ảnh Chí Mạng", trigger: "Khi kích hoạt đòn đánh chí mạng", effect: `Hồi phục thêm ${a.critLifestealHeal} HP.` });
  if (a.killHeal) list.push({ name: "Nội tại · Thu Hoạch Linh Hồn", trigger: "Khi hạ gục quái vật", effect: `Lập tức hồi phục ${a.killHeal} HP cho bản thân.` });
  if (a.autoShield20) list.push({ name: "Nội tại · Hộ Mệnh Sinh Tử", trigger: "Khi HP giảm xuống dưới 20%", effect: `Tự động kích hoạt lá chắn hấp thụ ${a.autoShield20} sát thương.`, cooldown: `Hồi chiêu: ${a.autoShield20Cd || 45}s` });
  if (a.autoShield25) list.push({ name: "Nội tại · Kết Giới Sinh Mệnh", trigger: "Khi HP giảm xuống dưới 25%", effect: `Tạo lá chắn ${a.autoShield25} HP duy trì trong ${a.autoShield25Dur || 3} giây.`, cooldown: `Hồi chiêu: ${a.autoShield25Cd || 45}s` });
  if (a.autoShield30) list.push({ name: "Nội tại · Linh Hồn Bất Khuất", trigger: "Khi HP giảm xuống dưới 30%", effect: `Tạo lá chắn ${a.autoShield30} HP${a.autoShield30Dur ? ` trong ${a.autoShield30Dur} giây` : ""}.`, cooldown: `Hồi chiêu: ${a.autoShield30Cd || 40}s` });
  if (a.autoHeal20) list.push({ name: "Nội tại · Tái Sinh Bất Diệt", trigger: "Khi HP giảm xuống dưới 20%", effect: `Lập tức hồi phục ${a.autoHeal20} HP sinh lực.`, cooldown: `Hồi chiêu: ${a.autoHeal20Cd || 60}s` });
  if (a.dashAttackSpeed) list.push({ name: "Nội tại · Lôi Ảnh Truy Kích", trigger: "Sau khi sử dụng kỹ năng lướt", effect: `Tăng thêm ${Math.round(a.dashAttackSpeed * 100)}% tốc độ đánh trong ${a.dashBuffDur || 2} giây.` });
  if (a.skillBurstChance) list.push({ name: "Nội tại · Tinh Vân Bùng Nổ", trigger: "Khi kỹ năng đánh trúng kẻ địch", effect: `Có ${Math.round(a.skillBurstChance * 100)}% xác suất kích nổ năng lượng gây thêm ${a.skillBurstDmg || 40} sát thương.` });
  if (a.critExtraDmg) list.push({ name: "Nội tại · Xuyên Thấu Chí Mạng", trigger: "Khi kích hoạt đòn đánh chí mạng", effect: `Gây thêm ${a.critExtraDmg} sát thương cộng thêm lên mục tiêu.` });
  if (a.hitProcCount) list.push({ name: "Nội tại · Tích Tụ Liên Kích", trigger: `Mỗi ${a.hitProcCount} đòn đánh thường trúng đích`, effect: `Giải phóng xung lực gây thêm ${a.hitProcDmg || 30} sát thương trực diện.` });
  if (a.bossSkillExtraDmg) list.push({ name: "Nội tại · Thiên Hà Trừng Phạt", trigger: "Khi tung kỹ năng trúng Boss", effect: `Gây thêm ${a.bossSkillExtraDmg} sát thương chuẩn xác lên Trùm.` });
  if (a.bossDmgBonus) list.push({ name: "Nội tại · Sát Thủ Diệt Trùm", trigger: "Thường trực khi tấn công Boss", effect: `Gia tăng thêm ${Math.round(a.bossDmgBonus * 100)}% tổng sát thương lên mục tiêu Boss.` });
  if (a.waveStartShield) list.push({ name: "Nội tại · Thần Vực Khai Trận", trigger: "Khi bắt đầu mỗi màn đấu mới", effect: `Tự động ban tặng lá chắn bảo hộ ${a.waveStartShield} HP.` });
  if (a.skillMoveSpeedBonus) list.push({ name: "Nội tại · Thần Hành Bộ Pháp", trigger: "Sau khi thi triển kỹ năng bất kỳ", effect: `Tăng ${Math.round(a.skillMoveSpeedBonus * 100)}% tốc độ di chuyển trong ${a.skillMoveSpeedDur || 2} giây.` });
  if (a.reflect) list.push({ name: "Nội tại · Gai Giáp Phản Đòn", trigger: "Khi nhận sát thương từ kẻ địch", effect: `Phản lại ${Math.round(a.reflect * 100)}% lượng sát thương nhận vào lên mục tiêu tấn công.` });
  if (a.aoeAmp) list.push({ name: "Nội tại · Khuếch Đại Trường Năng", trigger: "Thường trực khi dùng kỹ năng diện rộng", effect: `Mở rộng ${Math.round(a.aoeAmp * 100)}% bán kính nổ kỹ năng.` });
  return list;
}
function xm(s) {
  return getItemPassives(s)[0] || null;
}
function getItemActiveSkill(s) {
  let ak = s?.activeSkill;
  if (!ak) return null;
  let descText = s.desc || "";
  let idx = descText.indexOf("KÍCH HOẠT:");
  let effect = idx >= 0 ? descText.slice(idx + "KÍCH HOẠT:".length).trim() : "";
  if (!effect) {
    let parts = [];
    if (ak.invuln) parts.push(`Bất tử ${ak.duration}s`);
    if (ak.ccImmune) parts.push("Miễn khống chế");
    if (ak.shield) parts.push(`Khiên ${ak.shield} HP`);
    if (ak.heal) parts.push(`Hồi ${ak.heal} HP`);
    if (ak.dmg) parts.push(`Gây ${ak.dmg} ST xung quanh`);
    if (ak.stun) parts.push(`Choáng ${ak.stun}s`);
    if (ak.atkBonus) parts.push(`+${ak.atkBonus} Công`);
    if (ak.asBonus) parts.push(`+${Math.round(ak.asBonus * 100)}% Tốc đánh`);
    if (ak.msBonus) parts.push(`+${Math.round(ak.msBonus * 100)}% Tốc chạy`);
    if (ak.lifestealBonus) parts.push(`+${Math.round(ak.lifestealBonus * 100)}% Hút máu`);
    if (ak.dr || ak.drBonus) parts.push(`+${Math.round((ak.dr || ak.drBonus) * 100)}% Miễn thương`);
    if (ak.healAmpBonus) parts.push(`+${Math.round(ak.healAmpBonus * 100)}% Hiệu quả hồi máu`);
    effect = parts.join(", ");
  }
  return {
    label: ak.label || "Kích Hoạt",
    duration: ak.duration,
    cooldown: ak.cooldown,
    color: ak.color || "#38BDF8",
    effect
  };
}
function Yf(s) {
  return `${s.desc}. ${{ weapon: "Trang bị vũ khí chủ lực giúp gia tăng hỏa lực trong giao tranh.", armor: "Giáp trụ gia cố sinh lực và khả năng đứng vững trước đợt tấn công dồn dập.", boots: "Giày chiến cải thiện độ cơ động, giúp né chiêu và giữ vị trí tối ưu.", gloves: "Găng chiến cường hóa nhịp ra đòn và uy lực từng phát đánh.", necklace: "Trang sức tinh xảo bổ trợ nhịp hồi chiêu, chí mạng và duy trì sinh tồn.", relic: "Thánh vật cổ đại mang lại hiệu ứng chiến đấu đặc thù ở giai đoạn giữa và cuối trận." }[s.slot]}`;
}
var Qf = [
  { key: "all", label: "Tất Cả", Icon: Gf },
  { key: "attack", label: "Công Kích", Icon: Mm },
  { key: "defense", label: "Phòng Thủ", Icon: Uf },
  { key: "magic", label: "Phép Thuật", Icon: Vf },
  { key: "speed", label: "Tốc Độ", Icon: qf },
  { key: "recovery", label: "Hồi Phục", Icon: $f },
  { key: "utility", label: "Đa Dụng", Icon: Of },
  { key: "owned", label: "Đã Sở Hữu", Icon: Kf }
], Zf = [
  { key: "all", label: "Mọi Ô" },
  { key: "weapon", label: "Vũ Khí" },
  { key: "armor", label: "Giáp" },
  { key: "boots", label: "Giày" },
  { key: "gloves", label: "Găng" },
  { key: "necklace", label: "Trang Sức" },
  { key: "relic", label: "Thánh Vật" }
];
var SHOP_SLOT_ORDER = ["weapon", "armor", "boots", "gloves", "necklace", "relic"];
var IconSort = jf, IconCheck = zf, IconCoins = ml, IconUndo = mm, IconSearch = pm, IconBag = gm, IconZap = qf;
function ShopItemIcon({ item: s, sizeClass: a = "w-14 h-14", showActiveMark: mActive = false }) {
  let [l, m] = (0, ie.useState)(false), c = Wn[s.tier];
  return (
    <div
      className={`${a} relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-[#060B18]`}
      style={{
        border: `1.5px solid ${c.border}`,
        boxShadow: `inset 0 0 12px rgba(200, 155, 60, 0.14), 0 0 14px ${c.glow}`
      }}
    >
      {!l && s.icon ? (
        <img
          src={s.icon}
          alt={s.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain block p-0.5"
          onError={() => m(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <Mm className="w-6 h-6" />
        </div>
      )}
      {mActive && s.activeSkill && (
        <span
          title={`Kỹ năng chủ động: ${s.activeSkill.label}`}
          className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-md bg-[#09142A]/95 border border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow"
        >
          <IconZap className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );
}
var pl = ShopItemIcon;
var SHOP_SLOT_SHORT = { weapon: "V.Khí", armor: "Giáp", boots: "Giày", gloves: "Găng", necklace: "T.Sức", relic: "T.Vật" };
var Jf = ({ engine: s, coins: a, shopHeroId: l, buildRevision: m = 0, founderUnlocked = false, onChangeHero: c, onClose: g, onOpenBuilds: p, onCoinsChange: h, onShowToast: f }) => {
  let [v, T] = (0, ie.useState)("all"),
    [b, x] = (0, ie.useState)("all"),
    [C, H] = (0, ie.useState)(""),
    [D, P] = (0, ie.useState)("default"),
    [N, W] = (0, ie.useState)(() => ({ item: sortItemsByRarityAsc(zr)[0] || zr[0], source: "shop" })),
    [V, oe] = (0, ie.useState)(false),
    [bagOpen, setBagOpen] = (0, ie.useState)(false),
    [, nt] = (0, ie.useState)(0),
    ce = (0, ie.useRef)(false),
    Me = () => nt((A) => A + 1);

  (0, ie.useEffect)(() => {
    let A = (O) => {
      if (O.key === "Escape") {
        if (bagOpen) setBagOpen(false);
        else if (V) oe(false);
        else g();
      }
    };
    window.addEventListener("keydown", A);
    return () => window.removeEventListener("keydown", A);
  }, [V, bagOpen, g]);

  let ht = (0, ie.useMemo)(() => Mi.find((A) => A.id === l) || Mi[0], [l]),
    je = (0, ie.useMemo)(() => {
      let A = new Set();
      if (!s) return A;
      let O = s.heroGear[l];
      if (O) {
        Object.values(O).forEach((K) => {
          if (K?.itemId) A.add(K.itemId);
        });
      }
      return A;
    }, [s, l, a, N, m]),
    qe = (0, ie.useMemo)(() => {
      let A = new Set();
      if (s) {
        s.inventory.forEach((O) => {
          if (O?.itemId) A.add(O.itemId);
        });
      }
      return A;
    }, [s, a, N, m]),
    bt = (A) => je.has(A) || qe.has(A),
    Ft = (0, ie.useMemo)(() => {
      let A = { all: zr.length, attack: 0, defense: 0, magic: 0, speed: 0, recovery: 0, utility: 0, owned: 0 };
      for (let O of zr) {
        let K = fm(O);
        for (let ge of K) A[ge]++;
        if (je.has(O.id) || qe.has(O.id)) A.owned++;
      }
      return A;
    }, [je, qe]),
    Nt = (0, ie.useMemo)(() => {
      let A = C.trim().toLowerCase(),
        O = [
          ...zr.filter((K) => {
            if (v === "owned") {
              if (!je.has(K.id) && !qe.has(K.id)) return false;
            } else if (v !== "all" && !fm(K).includes(v)) {
              return false;
            }
            if (b !== "all" && K.slot !== b) return false;
            if (A) {
              let ge = getItemPassives(K).map((ps) => `${ps.name} ${ps.trigger} ${ps.effect}`).join(" ").toLowerCase(),
                ut = ym(K).map((Be) => `${Be.label} ${Be.value}`).join(" ").toLowerCase(),
                pt = Gn[K.slot].toLowerCase(),
                Ye = Wn[K.tier].label.toLowerCase(),
                ak = getItemActiveSkill(K),
                akText = ak ? `${ak.label} ${ak.effect}`.toLowerCase() : "";
              if (!(K.name.toLowerCase().includes(A) || K.desc.toLowerCase().includes(A) || pt.includes(A) || Ye.includes(A) || ut.includes(A) || ge.includes(A) || akText.includes(A))) {
                return false;
              }
            }
            return true;
          })
        ];
      if (D === "price_asc") O.sort((K, ge) => K.cost - ge.cost);
      else if (D === "price_desc") O.sort((K, ge) => ge.cost - K.cost);
      else if (D === "rarity_desc") O = sortItemsByRarityDesc(O);
      else if (D === "newest") {
        O.sort((K, ge) => (parseInt(ge.id.replace("item_", ""), 10) || 0) - (parseInt(K.id.replace("item_", ""), 10) || 0));
      } else if (D === "owned_first") {
        O.sort((K, ge) => +!!bt(ge.id) - +!!bt(K.id) || K.cost - ge.cost);
      } else {
        O = sortItemsByRarityAsc(O);
      }
      return O;
    }, [v, b, C, D, je, qe]);

  let U = (A) => {
      if (!s || ce.current) return;
      ce.current = true;
      setTimeout(() => {
        ce.current = false;
      }, 180);
      if (bt(A.id)) {
        R.playClick();
        f(`Bạn đã sở hữu ${A.name}!`);
        return;
      }
      if (s.playerCoins < A.cost) {
        R.playError();
        f(`Không đủ vàng! Cần ${A.cost} Xu`);
        return;
      }
      s.playerCoins -= A.cost;
      h(s.playerCoins);
      let O = s.heroGear[l][A.slot];
      if (O) s.inventory.push(O);
      s.heroGear[l][A.slot] = { uid: s.nextUid++, itemId: A.id };
      s.saveGame();
      s.computeHeroStats();
      R.playBuy();
      f(`Đã mua & trang bị ${A.name}!`);
      W({ item: A, source: "gear", slotKey: A.slot });
      Me();
    },
    pe = (A, O) => {
      if (!s) return;
      let K = s.heroGear[l][A.slot];
      if (K) s.inventory.push(K);
      s.inventory = s.inventory.filter((ge) => ge.uid !== O);
      s.heroGear[l][A.slot] = { uid: s.nextUid++, itemId: A.id };
      s.saveGame();
      s.computeHeroStats();
      R.playEquip();
      f(`Đã trang bị ${A.name}!`);
      W({ item: A, source: "gear", slotKey: A.slot });
      Me();
    },
    ne = (A, O) => {
      if (!s) return;
      let K = s.heroGear[l][O];
      if (K) s.inventory.push(K);
      s.heroGear[l][O] = null;
      s.saveGame();
      s.computeHeroStats();
      R.playUnequip();
      f(`Đã tháo ${A.name} vào túi đồ!`);
      W(K ? { item: A, source: "inventory", invUid: K.uid } : { item: A, source: "shop" });
      Me();
    },
    _e = (A, O, K, ge) => {
      if (!s) return;
      let ut = Math.floor(A.cost * 0.6);
      if (O === "inventory" && ge) s.inventory = s.inventory.filter((pt) => pt.uid !== ge);
      else if (O === "gear" && K) {
        s.heroGear[l][K] = null;
        s.computeHeroStats();
      }
      s.playerCoins += ut;
      h(s.playerCoins);
      s.saveGame();
      R.playCoin();
      f(`Đã bán ${A.name} (+${ut} Xu)!`);
      W({ item: A, source: "shop" });
      Me();
    };

  let Z = N.item,
    tt = Wn[Z.tier],
    re = ym(Z),
    passivesList = getItemPassives(Z),
    activeSkillInfo = getItemActiveSkill(Z),
    mt = bt(Z.id),
    S = je.has(Z.id),
    G = s?.heroGear[l]?.[Z.slot] ? Si[s.heroGear[l][Z.slot].itemId] : null,
    J = Math.floor(Z.cost * 0.6),
    ae = s ? Object.values(s.heroGear[l] || {}).filter(Boolean).length : 0,
    invCount = s?.inventory?.length || 0,
    ke = (0, ie.useMemo)(() => {
      if (!s) return;
      let A = s.heroGear[l];
      if (A) return Object.keys(A).find((O) => A[O]?.itemId === Z.id);
    }, [s, l, Z.id, je]),
    ve = (0, ie.useMemo)(() => {
      if (s) return s.inventory.find((A) => A.itemId === Z.id);
    }, [s, Z.id, qe]);

  let renderDetailPanel = (isMobileOverlay = false) => (
    <div className="flex flex-col h-full min-h-0 bg-[#070E1F]">
      {/* Detail Top Header */}
      <div className="p-2.5 sm:p-3 border-b border-[#C89B3C]/25 bg-gradient-to-b from-[#0E1A35] to-[#081022] shrink-0">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <ShopItemIcon item={Z} sizeClass="w-14 h-14 sm:w-16 sm:h-16" showActiveMark key={Z.id} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold truncate">
                <span style={{ color: tt.color }}>{tt.shortLabel}</span>
                <span className="text-[#C89B3C]/60">·</span>
                <span className="text-slate-300">{Gn[Z.slot]}</span>
              </div>
              {isMobileOverlay && (
                <button
                  type="button"
                  onClick={() => oe(false)}
                  className="min-w-[36px] min-h-[36px] rounded-lg bg-[#0D1930] border border-[#C89B3C]/50 text-[#FDE68A] flex items-center justify-center shrink-0"
                  aria-label="Đóng bảng chi tiết"
                >
                  <Gc className="w-4 h-4" />
                </button>
              )}
            </div>
            <h4 className="font-moba text-sm sm:text-base font-extrabold text-white leading-snug mt-0.5 line-clamp-2">
              {Z.name}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1 font-mono-numbers text-xs sm:text-sm font-black text-[#FBBF24] tabular-nums">
                <IconCoins className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>{Z.cost.toLocaleString()} Xu</span>
              </div>
              {S ? (
                <span className="text-[10px] font-bold text-emerald-400">· Đang trang bị</span>
              ) : mt ? (
                <span className="text-[10px] font-bold text-sky-400">· Có trong túi</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Info: Chỉ số, Nội tại, Kỹ năng chủ động, Mô tả */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 moba-shop-scroll">
        {/* Chỉ số */}
        <div>
          <div className="text-[11px] font-moba font-bold uppercase tracking-wider text-[#E5C16C] mb-1.5">
            Chỉ Số Trang Bị
          </div>
          {re.length > 0 ? (
            <div className="space-y-1">
              {re.map((A, O) => (
                <div
                  key={O}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#0B162C] border border-[#C89B3C]/20"
                >
                  <span className="text-slate-200">{A.label}</span>
                  <span className="font-mono-numbers font-extrabold tabular-nums" style={{ color: A.color }}>
                    {A.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-300 bg-[#0B162C]/80 border border-[#C89B3C]/20 rounded-lg px-2.5 py-2">
              Trang bị kích hoạt hiệu ứng chiến đấu chuyên biệt
            </div>
          )}
        </div>

        {/* Nội tại */}
        {passivesList.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-moba font-bold uppercase tracking-wider text-[#FBBF24]">
              Nội Tại
            </div>
            {passivesList.map((ps, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-gradient-to-br from-[#C89B3C]/12 via-[#0C172E] to-[#081022] border border-[#C89B3C]/45 p-2.5 space-y-1"
              >
                <div className="text-xs font-moba font-extrabold text-[#FDE68A]">{ps.name}</div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-[#E5C16C] font-semibold">Điều kiện:</span> {ps.trigger}
                </div>
                <p className="text-xs text-slate-100 leading-relaxed">{ps.effect}</p>
                {ps.cooldown && (
                  <div className="text-[11px] font-mono-numbers font-bold text-cyan-300 tabular-nums pt-0.5">
                    {ps.cooldown}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Kỹ năng chủ động */}
        {activeSkillInfo && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-moba font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <IconZap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Kỹ Năng Chủ Động</span>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-cyan-500/12 via-[#0A1830] to-[#C89B3C]/10 border border-cyan-400/55 p-2.5 space-y-1.5 shadow-[0_0_16px_rgba(56,189,248,0.12)]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-moba font-extrabold text-white">
                  Kích hoạt · {activeSkillInfo.label}
                </span>
                <div className="flex items-center gap-2 font-mono-numbers text-[11px] font-bold tabular-nums">
                  {activeSkillInfo.duration ? (
                    <span className="text-amber-300">{activeSkillInfo.duration}s</span>
                  ) : null}
                  {activeSkillInfo.cooldown ? (
                    <span className="text-cyan-300">Hồi {activeSkillInfo.cooldown}s</span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-cyan-50/95 leading-relaxed">{activeSkillInfo.effect}</p>
            </div>
          </div>
        )}

        {/* Mô tả tổng quan */}
        <div>
          <div className="text-[11px] font-moba font-bold uppercase tracking-wider text-slate-400 mb-1">
            Chi Tiết & Công Dụng
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#091326] border border-slate-800/90 rounded-lg p-2.5">
            {Yf(Z)}
          </p>
        </div>

        {/* Ghi chú thay thế ô đang mặc */}
        {N.source === "shop" && !mt && G && (
          <div className="text-[11px] text-slate-300 bg-[#0B162C] border border-[#C89B3C]/30 rounded-lg px-2.5 py-2">
            Ô <span className="text-white font-semibold">{Gn[Z.slot]}</span> đang mang{" "}
            <span className="text-[#FDE68A] font-semibold">{G.name}</span> — sẽ tự động cất vào Túi đồ khi mua.
          </div>
        )}
      </div>

      {/* Sticky Footer Action Buttons (MUA / TRANG BỊ / THÁO / BÁN) */}
      <div className="p-2.5 sm:p-3 border-t border-[#C89B3C]/35 bg-[#060C1A] shrink-0 space-y-2">
        {N.source === "shop" && (
          <>
            {mt ? (
              <div className="space-y-1.5">
                <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/45 font-moba text-[11px] font-extrabold flex items-center justify-center gap-1.5">
                  <IconCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{S ? "ĐANG TRANG BỊ TRÊN TƯỚNG" : "ĐÃ SỞ HỮU TRONG TÚI ĐỒ"}</span>
                </div>
                {ke ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => ne(Z, ke)}
                      className="min-h-[42px] rounded-xl bg-[#11203D] hover:bg-[#192D54] border border-[#C89B3C]/50 text-[#FDE68A] font-moba font-bold text-xs flex items-center justify-center gap-1.5 px-2"
                    >
                      <IconUndo className="w-3.5 h-3.5 shrink-0" />
                      <span>Tháo Ra Túi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => _e(Z, "gear", ke)}
                      className="min-h-[42px] btn-danger rounded-xl text-xs font-extrabold tabular-nums px-2"
                    >
                      <span>Bán (+{J} Xu)</span>
                    </button>
                  </div>
                ) : ve ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => pe(Z, ve.uid)}
                      className="min-h-[42px] moba-bronze-btn rounded-xl font-moba text-xs font-black px-2"
                    >
                      Trang Bị Ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => _e(Z, "inventory", undefined, ve.uid)}
                      className="min-h-[42px] btn-danger rounded-xl text-xs font-extrabold tabular-nums px-2"
                    >
                      <span>Bán (+{J} Xu)</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                disabled={a < Z.cost}
                onClick={() => U(Z)}
                className={`w-full min-h-[44px] sm:min-h-[46px] px-4 rounded-xl font-moba text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-transform ${
                  a < Z.cost
                    ? "bg-rose-950/65 text-rose-200/90 border border-rose-700/60 cursor-not-allowed"
                    : "moba-bronze-btn"
                }`}
              >
                {a < Z.cost ? (
                  <>
                    <IconCoins className="w-4 h-4 shrink-0" />
                    <span className="tabular-nums">THIẾU VÀNG · {Z.cost.toLocaleString()} Xu</span>
                  </>
                ) : (
                  <>
                    <IconBag className="w-4 h-4 shrink-0" />
                    <span className="tabular-nums">MUA · {Z.cost.toLocaleString()} Xu</span>
                  </>
                )}
              </button>
            )}
          </>
        )}

        {N.source === "gear" && N.slotKey && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => ne(Z, N.slotKey)}
              className="min-h-[44px] rounded-xl bg-[#11203D] hover:bg-[#192D54] border border-[#C89B3C]/55 text-[#FDE68A] font-moba font-bold text-xs flex items-center justify-center gap-1.5 px-2"
            >
              <IconUndo className="w-3.5 h-3.5 shrink-0" />
              <span>Tháo Ra Túi</span>
            </button>
            <button
              type="button"
              onClick={() => _e(Z, "gear", N.slotKey)}
              className="min-h-[44px] btn-danger rounded-xl text-xs font-extrabold tabular-nums px-2"
            >
              <span>Bán (+{J} Xu)</span>
            </button>
          </div>
        )}

        {N.source === "inventory" && N.invUid && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pe(Z, N.invUid)}
              className="min-h-[44px] moba-bronze-btn rounded-xl font-moba text-xs font-black px-2"
            >
              Trang Bị Ngay
            </button>
            <button
              type="button"
              onClick={() => _e(Z, "inventory", undefined, N.invUid)}
              className="min-h-[44px] btn-danger rounded-xl text-xs font-extrabold tabular-nums px-2"
            >
              <span>Bán (+{J} Xu)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="modal-backdrop moba-shop-backdrop p-0 sm:p-2 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cửa Hàng Trang Bị Arena Hero"
    >
      <div className="relative w-full h-full sm:h-[95dvh] max-w-[1440px] moba-shop-shell sm:rounded-2xl flex flex-col overflow-hidden">
        {/* TOP BAR: Title, Hero Selector, Build Suggestions, Close */}
        <header className="moba-shop-header px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#C89B3C]/30 to-[#785A28]/20 border border-[#C89B3C]/80 flex items-center justify-center text-[#FDE68A] shrink-0 shadow-[0_0_12px_rgba(200,155,60,0.3)]">
              <IconBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex items-center gap-2 sm:gap-3">
              <h2 className="font-title text-xs sm:text-base font-black tracking-wider text-[#FDE68A] whitespace-nowrap drop-shadow">
                <span className="sm:hidden">CỬA HÀNG</span>
                <span className="hidden sm:inline">CỬA HÀNG TRANG BỊ</span>
              </h2>
              <div className="flex items-center gap-1.5 bg-[#060C1B] border border-[#C89B3C]/45 rounded-lg px-2 py-1 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ht.color }}
                />
                <select
                  value={l}
                  onChange={(A) => {
                    R.playClick();
                    c(A.target.value);
                  }}
                  aria-label="Chọn tướng trang bị"
                  className="bg-transparent text-[11px] sm:text-xs font-moba font-bold text-slate-100 outline-none cursor-pointer max-w-[115px] sm:max-w-[180px] truncate"
                >
                  {Mi.map((A) => (
                    <option key={A.id} value={A.id} className="bg-[#081022] text-white">
                      {A.isSecretFounder && !founderUnlocked ? `🔒 ${A.name.split("(")[0].trim()}` : A.name.split("(")[0].trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                R.playClick();
                p();
              }}
              className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3.5 rounded-xl bg-[#0D1933] hover:bg-[#15274D] border border-[#C89B3C]/55 text-[#FDE68A] text-xs font-moba font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Wf className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
              <span className="hidden sm:inline">Gợi Ý Lên Đồ</span>
              <span className="sm:hidden">Gợi Ý</span>
            </button>
            <button
              type="button"
              onClick={g}
              className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-4 rounded-xl bg-[#1A1423] hover:bg-rose-950/90 border border-[#C89B3C]/55 hover:border-rose-400/80 text-slate-100 font-moba text-xs font-extrabold flex items-center gap-1.5 shrink-0"
              aria-label="Đóng cửa hàng"
            >
              <Gc className="w-4 h-4 text-rose-300 shrink-0" />
              <span>ĐÓNG</span>
            </button>
          </div>
        </header>

        {/* 3-COLUMN MOBA WORKSPACE */}
        <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
          {/* LEFT: Vertical Category Column */}
          <aside
            aria-label="Danh mục trang bị"
            className="w-[92px] sm:w-[132px] md:w-[154px] lg:w-[186px] bg-[#050A17]/95 border-r border-[#C89B3C]/35 p-1.5 sm:p-2 flex flex-col gap-1 overflow-y-auto min-h-0 shrink-0 moba-shop-scroll"
          >
            {Qf.map(({ key: A, label: O, Icon: K }) => {
              let ge = v === A;
              return (
                <button
                  key={A}
                  type="button"
                  onClick={() => {
                    R.playTabSwitch();
                    T(A);
                  }}
                  className={`w-full min-h-[38px] sm:min-h-[42px] flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-moba font-bold transition-colors border text-left shrink-0 ${
                    ge
                      ? "bg-gradient-to-r from-[#C89B3C]/28 to-[#C89B3C]/8 text-[#FDE68A] border-[#EAB308]/80 shadow-[inset_3px_0_0_#FBBF24]"
                      : "bg-[#091225]/80 text-slate-300 border-transparent hover:bg-[#0F1C36] hover:text-white hover:border-[#C89B3C]/25"
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <K className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${ge ? "text-[#FBBF24]" : "text-slate-400"}`} />
                    <span className="truncate">{O}</span>
                  </span>
                  <span
                    className={`hidden sm:inline font-mono-numbers text-[10px] tabular-nums shrink-0 ${
                      ge ? "text-[#FDE68A]" : "text-slate-500"
                    }`}
                  >
                    {Ft[A]}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* CENTER: Search, Slot Filters & Large-Icon Item Grid */}
          <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#040915]/90">
            {/* Compact Filter Toolbar */}
            <div className="px-2 sm:px-3 pt-2 pb-1.5 border-b border-[#C89B3C]/20 flex flex-col gap-1.5 shrink-0 bg-[#060D1D]/70">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative flex-1 min-w-0">
                  <IconSearch className="w-3.5 h-3.5 text-[#C89B3C]/80 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={C}
                    onChange={(A) => H(A.target.value)}
                    placeholder="Tìm tên, chỉ số, nội tại..."
                    className="w-full bg-[#091226] border border-[#C89B3C]/35 focus:border-[#FBBF24] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 outline-none"
                  />
                  {C && (
                    <button
                      type="button"
                      onClick={() => H("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Xóa tìm kiếm"
                    >
                      <Gc className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-[#091226] border border-[#C89B3C]/35 rounded-lg px-2 py-1.5 shrink-0">
                  <IconSort className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                  <select
                    value={D}
                    onChange={(A) => P(A.target.value)}
                    aria-label="Sắp xếp trang bị"
                    className="bg-transparent text-[11px] sm:text-xs text-slate-100 outline-none cursor-pointer max-w-[96px] sm:max-w-none"
                  >
                    <option value="default" className="bg-[#081022]">Hiếm dần (Mặc định)</option>
                    <option value="price_asc" className="bg-[#081022]">Giá thấp → cao</option>
                    <option value="price_desc" className="bg-[#081022]">Giá cao → thấp</option>
                    <option value="rarity_desc" className="bg-[#081022]">Độ hiếm giảm dần</option>
                    <option value="newest" className="bg-[#081022]">Mới nhất</option>
                    <option value="owned_first" className="bg-[#081022]">Đã sở hữu</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {Zf.map((A) => {
                  let O = b === A.key;
                  return (
                    <button
                      key={A.key}
                      type="button"
                      onClick={() => {
                        R.playClick();
                        x(A.key);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-moba font-bold whitespace-nowrap shrink-0 transition-colors border ${
                        O
                          ? "bg-[#C89B3C]/22 text-[#FDE68A] border-[#C89B3C]/75"
                          : "bg-[#091326] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-[#C89B3C]/30"
                      }`}
                    >
                      {A.label}
                    </button>
                  );
                })}
                <span className="ml-auto text-[11px] text-[#E5C16C]/80 font-mono-numbers tabular-nums whitespace-nowrap shrink-0 pl-1">
                  {Nt.length} món
                </span>
              </div>
            </div>

            {/* Scrollable Item Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 moba-shop-scroll">
              {Nt.length === 0 ? (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <IconSearch className="w-7 h-7 text-[#C89B3C]/50 mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Không tìm thấy trang bị phù hợp</p>
                  <p className="text-xs text-slate-400 mt-1">Thử đổi danh mục hoặc từ khóa khác.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 pb-2">
                  {Nt.map((A) => {
                    let O = Wn[A.tier],
                      K = bt(A.id),
                      ge = je.has(A.id),
                      ut = a >= A.cost,
                      pt = N.source === "shop" && N.item.id === A.id;
                    return (
                      <button
                        key={A.id}
                        type="button"
                        title={A.name}
                        onClick={() => {
                          R.playClick();
                          W({ item: A, source: "shop" });
                          oe(true);
                        }}
                        className={`group relative flex flex-col items-center text-center p-2 sm:p-2.5 rounded-xl transition-transform duration-150 border focus-visible:outline-2 focus-visible:outline-amber-400 ${
                          pt
                            ? "bg-[#122242] ring-2 ring-[#FBBF24] -translate-y-0.5 shadow-[0_0_20px_rgba(251,191,36,0.28)]"
                            : "bg-[#091225] hover:bg-[#0E1A35] hover:-translate-y-0.5"
                        }`}
                        style={{
                          borderColor: pt ? "#FBBF24" : O.border,
                          backgroundImage: A.tier === "mythic" ? O.bgTint : undefined
                        }}
                      >
                        <div className="w-full flex items-center justify-between text-[10px] font-bold mb-1 px-0.5 gap-1">
                          <span className="truncate" style={{ color: O.color }}>
                            {O.shortLabel}
                          </span>
                          {ge ? (
                            <span className="text-emerald-400 shrink-0">Đang mặc</span>
                          ) : K ? (
                            <span className="text-sky-400 shrink-0">Trong túi</span>
                          ) : (
                            <span className="text-slate-400 shrink-0">{Gn[A.slot]}</span>
                          )}
                        </div>

                        <div className="my-0.5 transition-transform duration-150 group-hover:scale-105">
                          <ShopItemIcon item={A} sizeClass="w-14 h-14 sm:w-16 sm:h-16" showActiveMark />
                        </div>

                        <div className="text-[11px] sm:text-xs font-moba font-bold text-white leading-tight mt-1.5 line-clamp-2 min-h-[2rem] flex items-center justify-center">
                          {A.name}
                        </div>

                        <div
                          className={`mt-1.5 pt-1 w-full border-t border-[#C89B3C]/20 flex items-center justify-center gap-1 font-mono-numbers text-xs font-extrabold tabular-nums ${
                            K ? "text-emerald-400" : ut ? "text-[#FBBF24]" : "text-rose-400"
                          }`}
                        >
                          <IconCoins className="w-3.5 h-3.5 shrink-0" />
                          <span>{A.cost.toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Docked Detail Panel (Always visible in Mobile Landscape, Tablet & Desktop) */}
          <aside
            role="complementary"
            aria-label="Chi tiết trang bị"
            className="moba-detail-docked w-[228px] sm:w-[252px] md:w-[285px] lg:w-[330px] shrink-0 min-h-0 flex-col border-l border-[#C89B3C]/40 shadow-[-10px_0_28px_rgba(0,0,0,0.45)]"
          >
            {renderDetailPanel(false)}
          </aside>

          {/* MOBILE PORTRAIT DETAIL SHEET (<560px width portrait only) */}
          {V && (
            <div className="moba-detail-mobile-overlay fixed inset-0 z-[80] flex flex-col justify-end bg-black/65">
              <div
                className="flex-1"
                onClick={() => oe(false)}
                aria-hidden="true"
              />
              <div className="h-[78dvh] w-full rounded-t-2xl border-t-2 border-[#C89B3C]/70 overflow-hidden shadow-2xl">
                {renderDetailPanel(true)}
              </div>
            </div>
          )}

          {/* BAG POPOVER DRAWER (Anchored cleanly above Bottom Bar) */}
          {bagOpen && (
            <div className="absolute inset-x-0 bottom-0 z-[70] bg-[#060C1C]/98 border-t-2 border-[#C89B3C]/70 shadow-[0_-16px_40px_rgba(0,0,0,0.85)] max-h-[58%] flex flex-col">
              <div className="px-3 sm:px-4 py-2 border-b border-[#C89B3C]/30 flex items-center justify-between gap-2 bg-[#0A152B] shrink-0">
                <div className="flex items-center gap-2">
                  <Rf className="w-4 h-4 text-[#FBBF24]" />
                  <span className="font-moba text-xs sm:text-sm font-extrabold text-[#FDE68A]">
                    TÚI ĐỒ SỞ HỮU ({invCount})
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    · Chạm trang bị để xem chi tiết, trang bị ngay hoặc bán
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBagOpen(false)}
                  className="min-h-[34px] px-3 rounded-lg bg-[#11203D] border border-[#C89B3C]/45 text-xs font-moba font-bold text-slate-200 flex items-center gap-1"
                >
                  <Gc className="w-3.5 h-3.5" />
                  <span>Đóng Túi</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 moba-shop-scroll">
                {s?.inventory && s.inventory.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {s.inventory.map((A) => {
                      let O = Si[A.itemId];
                      if (!O) return null;
                      let sel = N.source === "inventory" && N.invUid === A.uid;
                      return (
                        <button
                          key={A.uid}
                          type="button"
                          onClick={() => {
                            R.playClick();
                            W({ item: O, source: "inventory", invUid: A.uid });
                            setBagOpen(false);
                            oe(true);
                          }}
                          className={`flex flex-col items-center p-2 rounded-xl border text-center transition-colors ${
                            sel
                              ? "bg-[#15264A] border-[#FBBF24]"
                              : "bg-[#091225] border-[#C89B3C]/30 hover:border-[#FBBF24]"
                          }`}
                        >
                          <ShopItemIcon item={O} sizeClass="w-11 h-11" showActiveMark />
                          <span className="text-[11px] font-moba font-bold text-white mt-1 line-clamp-1 w-full">
                            {O.name}
                          </span>
                          <span className="text-[10px] text-[#E5C16C]">{Gn[O.slot]}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">
                    Túi đồ đang trống. Khi mua trang bị cùng ô, đồ cũ sẽ tự động được cất vào đây.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM BAR: Owned Equipped Gear (6 Slots), Bag Toggle, Current Gold & Clear ĐÓNG Button */}
        <footer className="moba-shop-footer px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 shrink-0">
          {/* 6 Equipped Gear Slots + Bag */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto py-0.5">
            <div className="hidden md:flex flex-col pr-1.5 border-r border-[#C89B3C]/25 shrink-0">
              <span className="text-[10px] font-moba font-bold uppercase tracking-wider text-[#E5C16C]">
                Đang Sở Hữu
              </span>
              <span className="text-[11px] font-mono-numbers font-bold text-white tabular-nums">
                {ae}/6 Ô · {invCount} Túi
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {SHOP_SLOT_ORDER.map((slotKey) => {
                let eq = s?.heroGear[l]?.[slotKey];
                let eqItem = eq ? Si[eq.itemId] : null;
                let isSelected = N.source === "gear" && N.slotKey === slotKey;
                let tierStyle = eqItem ? Wn[eqItem.tier] : null;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    title={eqItem ? `${Gn[slotKey]}: ${eqItem.name}` : `Ô ${Gn[slotKey]} (Trống)`}
                    onClick={() => {
                      if (eqItem) {
                        R.playClick();
                        W({ item: eqItem, source: "gear", slotKey });
                        setBagOpen(false);
                        oe(true);
                      } else {
                        R.playClick();
                        x(slotKey);
                      }
                    }}
                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                      eqItem
                        ? isSelected
                          ? "bg-[#16274B] ring-2 ring-[#FBBF24] scale-105"
                          : "bg-[#091326] hover:bg-[#101E3A]"
                        : "bg-[#060B18] border border-dashed border-[#C89B3C]/35 hover:border-[#C89B3C]/75"
                    }`}
                    style={
                      eqItem && tierStyle
                        ? {
                            border: `1.5px solid ${isSelected ? "#FBBF24" : tierStyle.border}`,
                            boxShadow: `0 0 10px ${tierStyle.glow}`
                          }
                        : undefined
                    }
                  >
                    {eqItem ? (
                      <img
                        src={eqItem.icon}
                        alt={eqItem.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-0.5 rounded-lg"
                      />
                    ) : (
                      <span className="text-[9px] font-moba font-bold text-slate-500 leading-none text-center px-0.5">
                        {SHOP_SLOT_SHORT[slotKey]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                R.playClick();
                setBagOpen((prev) => !prev);
              }}
              className={`min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3 rounded-lg border font-moba text-[11px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                bagOpen
                  ? "bg-[#C89B3C] text-[#090D16] border-[#FDE68A]"
                  : "bg-[#0D1933] hover:bg-[#15274D] text-[#FDE68A] border-[#C89B3C]/50"
              }`}
            >
              <Rf className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">Túi ({invCount})</span>
            </button>
          </div>

          {/* Current Gold + Quick Close */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 px-2.5 sm:px-3.5 rounded-lg bg-[#050914] border border-[#C89B3C]/70 shadow-[inset_0_0_12px_rgba(200,155,60,0.16)]">
              <IconCoins className="w-4 h-4 text-[#FBBF24] shrink-0" />
              <span className="font-mono-numbers text-xs sm:text-sm font-black text-[#FBBF24] tabular-nums whitespace-nowrap">
                {a.toLocaleString()} Xu
              </span>
            </div>

            <button
              type="button"
              onClick={g}
              className="hidden sm:inline-flex min-h-[44px] px-4 rounded-lg bg-[#1A1423] hover:bg-rose-950/90 border border-[#C89B3C]/55 hover:border-rose-400/80 text-white font-moba text-xs font-extrabold items-center gap-1.5 shrink-0"
            >
              <Gc className="w-4 h-4 text-rose-300" />
              <span>ĐÓNG</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
var ey = { basic: { vi: "\u0110\xE1nh Th\u01B0\u1EDDng", en: "Basic Attack", color: "#CBD5E1" }, passive: { vi: "B\u1ECB \u0110\u1ED9ng", en: "Passive", color: "#38BDF8" }, active: { vi: "Ch\u1EE7 \u0110\u1ED9ng", en: "Active", color: "#FBBF24" }, movement: { vi: "Di Chuy\u1EC3n", en: "Mobility", color: "#34D399" }, defense: { vi: "Ph\xF2ng Th\u1EE7", en: "Defense", color: "#60A5FA" }, ultimate: { vi: "Tuy\u1EC7t K\u1EF9", en: "Ultimate", color: "#F59E0B" } };
function Bt(s, a, l, m = false) {
  let c = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128"><defs><radialGradient id="bg" cx="50%" cy="45%" r="65%"><stop offset="0%" stop-color="${s}"/><stop offset="100%" stop-color="#050811"/></radialGradient></defs><rect x="2" y="2" width="60" height="60" rx="12" fill="url(#bg)" stroke="${m ? "#FBBF24" : a}" stroke-width="2.6"/><rect x="5" y="5" width="54" height="54" rx="9" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>${m ? '<circle cx="12" cy="12" r="2.2" fill="#FEF08A"/><circle cx="52" cy="12" r="2.2" fill="#FEF08A"/><circle cx="12" cy="52" r="2.2" fill="#FEF08A"/><circle cx="52" cy="52" r="2.2" fill="#FEF08A"/>' : ""}${l}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(c)}`;
}
function At(s, a) {
  return s === "gau" ? a === "atk" ? Bt("#431407", "#F59E0B", '<path d="M18 40 L22 24 L30 20 L38 22 L46 28 L44 42 L24 46 Z" fill="#D97706" stroke="#FEF08A" stroke-width="2"/><path d="M22 28 L42 30 M20 35 L43 37" stroke="#78350F" stroke-width="2.4"/><path d="M13 18 C22 10 42 10 51 18" fill="none" stroke="#FBBF24" stroke-width="2.8" stroke-linecap="round"/>') : a === "passive" ? Bt("#450A0A", "#F97316", '<circle cx="32" cy="34" r="18" fill="none" stroke="#F97316" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M32 11 C38 20 46 25 45 36 C44 45 38 51 32 52 C26 51 20 45 19 36 C18 25 26 20 32 11 Z" fill="#EA580C" stroke="#FEF08A" stroke-width="2"/><path d="M32 22 C36 28 38 35 32 45 C26 35 28 28 32 22 Z" fill="#FDE047"/>') : a === "c1" ? Bt("#431407", "#FBBF24", '<path d="M14 44 L26 32 L18 24" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/><path d="M25 38 L37 26 L29 18" fill="none" stroke="#FBBF24" stroke-width="3.2" stroke-linecap="round"/><path d="M34 46 L50 28 L41 18" fill="none" stroke="#FEF08A" stroke-width="3.8" stroke-linecap="round"/><circle cx="48" cy="24" r="5" fill="#FFFFFF" opacity="0.85"/>') : a === "c2" ? Bt("#1E293B", "#F59E0B", '<path d="M32 11 L49 18 V33 C49 44 41 51 32 54 C23 51 15 44 15 33 V18 Z" fill="#78350F" stroke="#FBBF24" stroke-width="2.8"/><path d="M32 17 L43 22 V33 C43 40 38 45 32 48 C26 45 21 40 21 33 V22 Z" fill="#B45309"/><path d="M24 31 L32 24 L40 31 L32 39 Z" fill="#FEF08A"/>') : Bt("#450A0A", "#F59E0B", '<ellipse cx="32" cy="46" rx="21" ry="7" fill="none" stroke="#F97316" stroke-width="2.6"/><path d="M21 15 L32 38 L43 15" fill="none" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/><path d="M14 44 L26 40 L32 51 L38 40 L50 44" fill="none" stroke="#FEF08A" stroke-width="2.5"/><circle cx="32" cy="36" r="7" fill="#EF4444" stroke="#FEF08A" stroke-width="2"/>', true) : s === "bao" ? a === "atk" ? Bt("#2E1065", "#C084FC", '<path d="M14 46 Q30 28 48 14 L50 22 Q34 36 18 50 Z" fill="#E9D5FF" stroke="#A855F7" stroke-width="1.8"/><path d="M18 16 Q34 30 48 48 L41 50 Q28 34 14 22 Z" fill="#C084FC" stroke="#F5D0FE" stroke-width="1.6"/>') : a === "passive" ? Bt("#3B0764", "#E879F9", '<circle cx="32" cy="32" r="18" fill="none" stroke="#A855F7" stroke-width="2" stroke-dasharray="4 4"/><polygon points="32,12 46,32 32,52 18,32" fill="#7E22CE" stroke="#F0ABFC" stroke-width="2.4"/><circle cx="32" cy="32" r="5" fill="#F43F5E" stroke="#FFFFFF" stroke-width="1.5"/>') : a === "c1" ? Bt("#2E1065", "#38BDF8", '<path d="M13 42 C24 38 30 22 44 16" fill="none" stroke="#7E22CE" stroke-width="5" stroke-linecap="round"/><path d="M18 48 C30 42 36 26 51 20" fill="none" stroke="#E879F9" stroke-width="3" stroke-linecap="round"/><polygon points="48,14 54,22 44,24" fill="#E0F2FE"/>') : a === "c2" ? Bt("#1E1B4B", "#A855F7", '<circle cx="24" cy="36" r="10" fill="rgba(168,85,247,0.45)"/><circle cx="37" cy="30" r="12" fill="rgba(192,132,252,0.5)"/><circle cx="42" cy="40" r="9" fill="rgba(126,34,206,0.65)"/><path d="M22 22 L42 42 M42 22 L22 42" stroke="#F0ABFC" stroke-width="2.6" stroke-linecap="round"/>') : Bt("#3B0764", "#F43F5E", '<polygon points="22,18 28,28 22,38 16,28" fill="#A855F7" opacity="0.75"/><polygon points="42,18 48,28 42,38 36,28" fill="#A855F7" opacity="0.75"/><polygon points="32,10 40,26 32,48 24,26" fill="#F43F5E" stroke="#FEF08A" stroke-width="2"/><path d="M12 46 L52 18" stroke="#E879F9" stroke-width="2.8" stroke-linecap="round"/>', true) : a === "atk" ? Bt("#450A0A", "#EF4444", '<path d="M15 49 L44 14 L51 15 L50 22 L21 51 Z" fill="#E2E8F0" stroke="#EF4444" stroke-width="2"/><path d="M14 40 L24 50" stroke="#F59E0B" stroke-width="3.6" stroke-linecap="round"/><path d="M26 36 L44 18" stroke="#F87171" stroke-width="2"/>') : a === "passive" ? Bt("#431407", "#F59E0B", '<polygon points="32,12 50,45 14,45" fill="none" stroke="#F59E0B" stroke-width="2.6"/><circle cx="32" cy="14" r="4" fill="#38BDF8"/><circle cx="16" cy="44" r="4" fill="#F59E0B"/><circle cx="48" cy="44" r="4" fill="#EF4444"/><circle cx="32" cy="33" r="6" fill="#FEF08A"/>') : a === "c1" ? Bt("#450A0A", "#F97316", '<path d="M14 44 C26 42 36 32 48 16" fill="none" stroke="#F97316" stroke-width="4.5" stroke-linecap="round"/><path d="M16 50 C30 48 40 38 52 24" fill="none" stroke="#FEF08A" stroke-width="2.4" stroke-linecap="round"/><path d="M36 14 L50 14 L46 28 Z" fill="#EF4444"/>') : a === "c2" ? Bt("#450A0A", "#EF4444", '<path d="M13 38 C22 20 36 18 49 26 C44 33 44 40 50 46 C36 46 24 46 13 38 Z" fill="#DC2626" stroke="#FEF08A" stroke-width="2"/><circle cx="42" cy="29" r="3" fill="#FEF08A"/><path d="M18 32 L34 32" stroke="#FDE047" stroke-width="2.5" stroke-linecap="round"/>') : Bt("#450A0A", "#F59E0B", '<path d="M32 10 L39 26 L53 32 L39 38 L32 54 L25 38 L11 32 L25 26 Z" fill="#DC2626" stroke="#FEF08A" stroke-width="2.2"/><path d="M22 18 C28 12 38 12 43 20 C38 25 35 32 32 44 C29 32 26 25 22 18 Z" fill="#F97316" stroke="#FFFFFF" stroke-width="1.5"/>', true);
}
var me = (s, a, l, m, c, g, p, h) => ({ id: `${s}_${a}`, heroId: s, skillId: a, category: l, elementColor: m, bgDark: c, png512: `/assets/skills/${s}_${a}.png`, png128: `/assets/skills/128/${s}_${a}.png`, svgDataUrl: h, concept: { vi: g, en: p } }), bm = { dung: { atk: me("dung", "atk", "basic", "#38BDF8", "#0B3A5C", "L\xF4i Long Th\u01B0\u01A1ng ph\xF3ng tia s\xE9t ch\xE9m d\u1ECDc", "Thunder spear thrust with electric arc"), passive: me("dung", "passive", "passive", "#FDE047", "#0A2E4D", "L\xF4i s\u1EA5m s\xE9t ph\xE2n nh\xE1nh 6 tia, h\xFAt m\xE1u 12% & ch\xED m\u1EA1ng cao", "6-branch chain lightning, 12% lifesteal & crit mastery"), c1: me("dung", "c1", "movement", "#38BDF8", "#0D3B66", "Chi\u1EBFn th\u1EA7n ch\u1ED1ng th\u01B0\u01A1ng l\u01B0\u1EDBt b\u1ECDc s\xE9t c\u1EF1c quang", "Aurora lightning spear dash leaving scorch"), c2: me("dung", "c2", "defense", "#F59E0B", "#45120A", "Cu\u1ED3ng chi\u1EBFn huy\u1EBFt m\u1EA1ch b\xF9ng ch\xE1y s\u1EA5m l\u1EEDa & h\u1ED3i m\xE1u m\u1EA1nh", "Crimson rage, crit surge & heavy lightning sustain"), c3: me("dung", "c3", "ultimate", "#FDE047", "#083D6E", "Tri\u1EC7u h\u1ED3i Ch\xF3 3 \u0110\u1EA7u Cerberus L\xF4i Th\u1EA7n gi\xE1ng s\xE9t b\xE1 kh\xED", "Three-Headed Thunder Cerberus War God summon") }, tin: { atk: me("tin", "atk", "basic", "#F43F5E", "#4C0519", "Song \u0111ao h\u01B0 kh\xF4ng ch\xE9m ch\xE9o ch\u1EEF X \u0111\u1ECF r\u1EF1c", "Void dual blades crossing in crimson tear"), passive: me("tin", "passive", "passive", "#FB7185", "#3B0718", "V\u1EBFt r\xE1ch kh\xF4ng gian c\xF9ng 3 \u1EA5n k\xFD huy\u1EBFt \u1EA3nh", "Floating spatial rift & 3 blood marks"), c1: me("tin", "c1", "movement", "#F43F5E", "#450A1F", "Hai b\xF3ng \u1EA3nh s\xE1t th\u1EE7 l\u01B0\u1EDBt x\xE9 kh\xF4ng gian", "Two-charge shadow phantom dash trails"), c2: me("tin", "c2", "active", "#FB7185", "#4C0519", "Tinh th\u1EC3 \u0111\u1ECF r\u1EF1c ghim ch\u1EB7t t\u1ECFa v\xF2ng t\u1EEB tr\u01B0\u1EDDng", "Pinned crimson crystal radiating pulse ring"), c3: me("tin", "c3", "ultimate", "#F43F5E", "#18181B", "L\xE3nh \u0111\u1ECBa \u0111\u1EA3o s\u1EAFc Tr\u1EAFng-\u0110en v\u1EDBi nh\xE1t ch\xE9m x\xE9 m\xE0n", "Monochrome Sumi-e realm razor slashes") }, kin: { atk: me("kin", "atk", "basic", "#34D399", "#064E3B", "M\u0169i t\xEAn phong th\u1EA7n xanh ng\u1ECDc mang lu\u1ED3ng gi\xF3 xo\xE1y", "Jade wind arrow cutting with slipstream"), passive: me("kin", "passive", "passive", "#6EE7B7", "#064E3B", "M\u0169i t\xEAn xuy\xEAn t\xE2m cu\u1ED9n trong c\u01A1n l\u1ED1c xo\xE1y nhi\u1EC1u t\u1EA7ng", "Giant arrow wrapped in layered tornado vortex"), c1: me("kin", "c1", "active", "#34D399", "#065F46", "Cung th\u1EA7n b\u1EAFn ra 3 m\u0169i t\xEAn b\xE3o t\u1ED1 x\u1EBFp qu\u1EA1t", "Triple skybreaker arrows fanning outward"), c2: me("kin", "c2", "movement", "#6EE7B7", "#044E3C", "\u0110\xF4i c\xE1nh gi\xF3 phong linh tung lu\u1ED3ng kh\xED tho\xE1i b\u1ED9", "Radiant jade wind wings vaulting backward"), c3: me("kin", "c3", "ultimate", "#FDE047", "#064E3B", "C\u01A1n b\xE3o l\u1ED1c xo\xE1y kh\u1ED5ng l\u1ED3 tr\xFAt v\u1EA1n m\u0169i t\xEAn gi\xF3", "Colossal tornado storm raining wind arrows") }, trung: { atk: me("trung", "atk", "basic", "#818CF8", "#1E1B4B", "Qu\u1EA3 c\u1EA7u tinh v\xE2n tr\u1ECDng l\u1EF1c xoay v\xF2ng \xE1nh s\xE1ng", "Cosmic gravity orb with planetary ring"), passive: me("trung", "passive", "passive", "#A5B4FC", "#1E1B4B", "Tam gi\xE1c 3 \u1EA5n ma l\u1EF1c h\u1ED9i t\u1EE5 ph\xE1t n\u1ED5 trung t\xE2m", "3-node arcane triangle converging star burst"), c1: me("trung", "c1", "active", "#38BDF8", "#0C3B5E", "Tinh c\u1EA7u b\u0103ng ng\u1ECDc b\u1ED9c ph\xE1 tinh th\u1EC3 lam-t\xEDm", "Glacial jade orb shattering in frost spikes"), c2: me("trung", "c2", "defense", "#A5B4FC", "#1E1B4B", "Khi\xEAn h\u1ED9 v\u1EC7 c\xF9ng 6 c\u1EA7u ma ph\xE1p xoay tr\xF2n quanh t\xE2m", "Guardian shield encircled by 6 revolving orbs"), c3: me("trung", "c3", "ultimate", "#F97316", "#4A1206", "\u0110\u1EA1i thi\xEAn th\u1EA1ch r\u1EF1c l\u1EEDa lao xu\u1ED1ng h\u1ED1 dung nham", "Flaming meteor crashing into molten crater") }, eohyen: { atk: me("eohyen", "atk", "basic", "#38BDF8", "#083358", "B\u0103ng Nguy\u1EC7t Ki\u1EBFm vung nh\xE1t tr\u0103ng khuy\u1EBFt h\xE0n b\u0103ng", "Glacial blade crescent frost slash"), passive: me("eohyen", "passive", "passive", "#BAE6FD", "#063B59", "B\xF4ng tuy\u1EBFt h\xE0n kh\xED t\u1ECFa v\xF2ng s\u01B0\u01A1ng & l\xF5i h\u1ED3i ph\u1EE5c", "Frost snowflake chill aura & emerald core"), c1: me("eohyen", "c1", "active", "#38BDF8", "#08375C", "Nguy\u1EC7t tr\u1EA3m ghim 3 c\u1ECDc b\u0103ng nh\u1ECDn xu\u1ED1ng m\u1EB7t \u0111\u1EA5t", "Crescent slash pinning 3 sharp ice spikes"), c2: me("eohyen", "c2", "defense", "#7DD3FC", "#07365B", "Gi\xE1p l\u1EE5c gi\xE1c b\u0103ng t\xE2m ph\xF3ng 6 c\u1ECDc b\u0103ng h\u1ED9 th\u1EC3", "Hexagonal frost heart barrier & 6 radial spikes"), c3: me("eohyen", "c3", "ultimate", "#E0F2FE", "#06325C", "M\u01B0a c\u1ECDc b\u0103ng d\u1ED3n d\u1EADp & kh\u1ED1i pha l\xEA \u0111\xF3ng b\u0103ng c\u1EE9ng", "Icicle barrage encasing target in ice prison") }, longhoi: { atk: me("longhoi", "atk", "basic", "#F97316", "#451205", "M\u0169i t\xEAn h\u1ECFa h\u1ED3 b\xF9ng ch\xE1y \u0111u\xF4i l\u1EEDa cam-\u0111\u1ECF", "Blazing fox fire arrow with flame plume"), passive: me("longhoi", "passive", "passive", "#EF4444", "#4C0D07", "H\u1ECFa h\u1ED3 r\u1EF1c ch\xE1y v\u1EDBi v\xF2ng h\xFAt m\xE1u & thi\xEAu \u0111\u1ED1t", "Inferno fox crest with lifesteal flame ring"), c1: me("longhoi", "c1", "active", "#F97316", "#450F06", "H\u1ED3 H\u1ECFa Cung b\u1EAFn 3 m\u0169i h\u1ECFa ti\u1EC5n thi\xEAu \u0111\u1ED1t song song", "Triple flaming fox fire arrows volley"), c2: me("longhoi", "c2", "movement", "#FB923C", "#4A0B0A", "\u1EA2o \u1EA3nh h\u1ED3 ly 9 \u0111u\xF4i r\u1EF1c l\u1EEDa l\u01B0\u1EDBt x\xE9 gi\xF3", "Nine-tailed blazing fox phantom dash"), c3: me("longhoi", "c3", "ultimate", "#FEF08A", "#450A05", "T\xEAn l\u1EEDa h\u1ECFa h\u1ED3 bay ziczac t\u1EA1o bi\u1EC3n l\u1EEDa li\u1EC7t di\u1EC5m", "Zigzag fox missiles diving into inferno sea") }, duccong: { atk: me("duccong", "atk", "basic", "#A78BFA", "#2E1065", "Tr\u01B0\u1EE3ng h\u1ED1 \u0111en b\u1EAFn tia n\u0103ng l\u01B0\u1EE3ng tinh v\xE2n t\xEDm", "Nebula black hole staff firing void ray"), passive: me("duccong", "passive", "passive", "#C084FC", "#270E59", "Ch\xF2m sao tinh t\xFA h\u1ED9i t\u1EE5 c\xF9ng l\xF5i sinh m\u1EC7nh l\u1EE5c-t\xEDm", "3-star cosmic constellation & life core"), c1: me("duccong", "c1", "active", "#A78BFA", "#2B0D61", "Tinh c\u1EA7u sao ch\u1ED5i t\xEDm truy k\xEDch xuy\xEAn m\u1EE5c ti\xEAu", "Piercing violet cosmic comet orb"), c2: me("duccong", "c2", "active", "#C084FC", "#240954", "H\u1ED1 \u0111en ch\xE2n tr\u1EDDi s\u1EF1 ki\u1EC7n h\xFAt xo\xE1y c\u1EF1c m\u1EA1nh v\xE0o t\xE2m", "Event horizon black hole pulling inward"), c3: me("duccong", "c3", "ultimate", "#FDE047", "#2E0A5E", "D\u1EA3i ng\xE2n h\xE0 xo\xE1y tr\xF2n s\u1EE5p \u0111\u1ED5 b\xF9ng n\u1ED5 b\u1EE5i sao t\xEDm", "Spiral galaxy collapsing in stardust explosion") }, gau: { atk: me("gau", "atk", "basic", "#F59E0B", "#431407", "Thi\u1EBFt quy\u1EC1n chi\u1EBFn gi\xE1p tung li\xEAn ho\xE0n 3 c\xFA \u0111\u1EA5m", "Iron bear gauntlet 3-punch chain", At("gau", "atk")), passive: me("gau", "passive", "passive", "#F97316", "#450A0A", "L\u1EEDa Cu\u1ED3ng H\xF9ng b\xF9ng ch\xE1y khi \u0111\u1EA1t 100 \u0111i\u1EC3m N\u1ED9", "Berserk Bear flame core at 100 Rage", At("gau", "passive")), c1: me("gau", "c1", "active", "#FBBF24", "#431407", "H\xF9ng Quy\u1EC1n Li\xEAn K\xEDch 3 nh\u1ECBp ch\u1EA5n \u0111\u1ED9ng m\u1EB7t \u0111\u1EA5t", "3-step Bear Combo smashing ground", At("gau", "c1")), c2: me("gau", "c2", "defense", "#F59E0B", "#1E293B", "Khi\xEAn Thi\u1EBFt B\xEDch ph\u1EA3n ch\u1EA5n 4 t\u1EA7ng s\u1EE9c m\u1EA1nh", "Iron Bastion guard & counter slam", At("gau", "c2")), c3: me("gau", "c3", "ultimate", "#EF4444", "#450A0A", "Cu\u1ED3ng H\xF9ng Gi\xE1ng L\xE2m nh\u1EA3y \u0111\u1EADp v\u1EE1 \u0111\u1ECBa ch\u1EA5n", "Meteor bear leap slamming seismic field", At("gau", "c3")) }, bao: { atk: me("bao", "atk", "basic", "#C084FC", "#2E1065", "Song \u0111ao nguy\u1EC7t \u1EA3nh kh\u1EAFc d\u1EA5u \u1EA2nh \u1EA4n", "Twin shadow daggers carving Shadow Marks", At("bao", "atk")), passive: me("bao", "passive", "passive", "#E879F9", "#3B0764", "\u1EA2nh \u1EA4n 5 t\u1EA7ng k\xEDch n\u1ED5 T\u1EED \u1EA4n & h\u1ED3i 40% C1", "5-stack Shadow Mark Death Seal trigger", At("bao", "passive")), c1: me("bao", "c1", "movement", "#38BDF8", "#2E1065", "\u1EA2nh B\u1ED9 Tam Tr\u1EA3m l\u01B0\u1EDBt ch\xE9m 3 nh\xE1t + Ho\xE1n V\u1ECB", "Shadow 3-slash dash with quick recast", At("bao", "c1")), c2: me("bao", "c2", "active", "#A855F7", "#1E1B4B", "V\xF4 \u1EA2nh Ho\xE1n V\u1ECB kh\xF3i t\xEDm t\xE0ng h\xECnh 1.5s t\u1EADp k\xEDch", "Purple smoke 1.5s stealth backstab", At("bao", "c2")), c3: me("bao", "c3", "ultimate", "#F43F5E", "#3B0764", "V\u1EA1n \u1EA2nh T\xE0n S\xE1t g\u1ECDi 4 ph\xE2n th\xE2n k\u1EBFt li\u1EC5u", "Four shadow clones finishing Death Seal", At("bao", "c3")) }, danh: { atk: me("danh", "atk", "basic", "#EF4444", "#450A0A", "Tr\u1ECDng ki\u1EBFm Long H\u1ED3n ch\xE9m 3 nh\xE1t r\u1ED9ng", "Dragon greatsword 3-hit wide cleave", At("danh", "atk")), passive: me("danh", "passive", "passive", "#F59E0B", "#431407", "Tam Ki\u1EBFm Th\u1EBF: Khai S\u01A1n, Long Ng\xE2m, Thi\xEAn Ph\u1EA1t", "Three Sword Stances chain emblem", At("danh", "passive")), c1: me("danh", "c1", "active", "#F97316", "#450A0A", "Ph\xE1 S\u01A1n Tam Tr\u1EA3m t\u1EE5 l\u1EF1c b\u1EAFn Ki\u1EBFm Kh\xED xa", "3-step cleave with hold-charged aura wave", At("danh", "c1")), c2: me("danh", "c2", "movement", "#EF4444", "#450A0A", "Long H\u1ED3n Ph\xE1 Tr\u1EADn t\u1EE5 l\u1EF1c ph\xF3ng R\u1ED3ng \u0110\u1ECF", "Hold-to-charge Red Dragon breakthrough", At("danh", "c2")), c3: me("danh", "c3", "ultimate", "#FEF08A", "#450A0A", "H\xF3a R\u1ED3ng (Ch\xE2n Long Gi\xE1ng Th\u1EBF) kh\u1EA1t l\u1EEDa & mi\u1EC5n kh\u1ED1ng", "Dragon Ascension transforming attacks into fire breath", HERO_SKILL_ICONS.danh.c3) }, luan: { atk: me("luan", "atk", "basic", "#C084FC", "#2E1065", "L\xF5i C\u1EA7u H\u1EE7y Di\u1EC7t ph\xF3ng c\u1EA7u ph\xE9p & kh\u1EAFc v\u1EBFt n\u1EE9t", "Void orb firing & carving spatial rifts", HERO_SKILL_ICONS.luan.atk), passive: me("luan", "passive", "passive", "#E879F9", "#3B0764", "V\u1EBFt N\u1EE9t Kh\xF4ng Gian k\u1EBFt n\u1ED1i & H\xFAt 18% s\xE1t th\u01B0\u01A1ng ph\xE9p", "Connected rifts & 18% magic spell vamp", HERO_SKILL_ICONS.luan.passive), c1: me("luan", "c1", "active", "#E879F9", "#2E1065", "B\u1EAFn 5 M\u1EA3nh V\u1EE1 Kh\xF4ng Gian xuy\xEAn qu\xE1i & t\xE1ch lu\u1ED3ng qua c\u1ED5ng", "5-shard piercing arcane fan splitting through portals", HERO_SKILL_ICONS.luan.c1), c2: me("luan", "c2", "active", "#67E8F9", "#1E1B4B", "M\u1EDF 3 C\u1ED5ng G\u01B0\u01A1ng Kh\xF4ng Gian d\u1ECBch chuy\u1EC3n & t\xE1i k\xEDch n\u1ED5", "3 linked spatial portals warping foes & recast detonation", HERO_SKILL_ICONS.luan.c2), c3: me("luan", "c3", "ultimate", "#67E8F9", "#2E1065", "Tia H\u1EE7y Di\u1EC7t Ph\xE2n Nh\xE1nh xuy\xEAn c\u1ED5ng qu\xE9t to\xE0n \u0111\u1EA5u tr\u01B0\u1EDDng", "Annihilation laser branching across all portals", HERO_SKILL_ICONS.luan.c3) }, taidu: { atk: me("taidu", "atk", "basic", "#F59E0B", "#2B1806", "Li\xEAn thanh ph\xE1o c\u01A1 gi\u1EDBi x\u1EA3 \u0111\u1EA1n li\xEAn t\u1EE5c", "Rapid rotary twin cannon barrage", HERO_SKILL_ICONS.taidu.atk), passive: me("taidu", "passive", "passive", "#38BDF8", "#0C2D48", "3 Drone V\u1EC7 Tinh: T\u1EA5n C\xF4ng, B\u1EA3o V\u1EC7, Truy S\xE1t", "Triple tactical drones cycling modes", HERO_SKILL_ICONS.taidu.passive), c1: me("taidu", "c1", "active", "#38BDF8", "#082F49", "Ph\xE1o T\u1EF1 \u0110\u1ED9ng chuy\u1EC3n ch\u1EBF \u0111\u1ED9 Drone \u0111a n\u0103ng", "Switch tactical drone mode & auto-turret", HERO_SKILL_ICONS.taidu.c1), c2: me("taidu", "c2", "active", "#F97316", "#431407", "Tam T\xEAn L\u1EEDa T\u1EA7m Nhi\u1EC7t truy \u0111u\u1ED5i m\u1EE5c ti\xEAu", "Triple homing heat-seeking missiles", HERO_SKILL_ICONS.taidu.c2), c3: me("taidu", "c3", "ultimate", "#EF4444", "#450A0A", "M\u01B0a T\xEAn L\u1EEDa Oanh T\u1EA1c r\u1EA3i th\u1EA3m h\u1EE7y di\u1EC7t", "Carpet missile strike across target lane", HERO_SKILL_ICONS.taidu.c3) }, nguyen: { atk: me("nguyen", "atk", "basic", "#34D399", "#064E3B", "Tr\u01B0\u1EE3ng sinh m\u1EC7nh qu\u1EA9t s\xF3ng l\u1EE5c quang", "Emerald life staff wave strike", HERO_SKILL_ICONS.nguyen.atk), passive: me("nguyen", "passive", "passive", "#6EE7B7", "#044E3C", "Chuy\u1EC3n 100% h\u1ED3i m\xE1u d\u01B0 th\xE0nh l\xE1 ch\u1EAFn +60% khi th\u1EA5p m\xE1u", "100% overheal shield & +60% low-HP heal amp", HERO_SKILL_ICONS.nguyen.passive), c1: me("nguyen", "c1", "active", "#34D399", "#064E3B", "S\xF3ng Sinh M\u1EC7nh h\u1ED3i m\xE1u \u0111\u1ED3ng minh & s\xE1t th\u01B0\u01A1ng qu\xE1i", "Life wave healing allies & damaging enemies", HERO_SKILL_ICONS.nguyen.c1), c2: me("nguyen", "c2", "defense", "#6EE7B7", "#065F46", "Tam V\u1EC7 Tinh H\u1ED9 M\u1EC7nh xoay quanh h\u1ED3i ph\u1EE5c", "Three orbiting healing guardian satellites", HERO_SKILL_ICONS.nguyen.c2), c3: me("nguyen", "c3", "ultimate", "#FDE047", "#064E3B", "\u0110\u1EA1i H\u1ED3i Ph\u1EE5c b\xF9ng n\u1ED5 v\xF2ng th\xE1nh quang t\u1EA1o khi\xEAn", "Grand restorative field & AoE blast", HERO_SKILL_ICONS.nguyen.c3) }, phong: { atk: me("phong", "atk", "basic", "#22D3EE", "#082F49", "Song ki\u1EBFm n\u0103ng l\u01B0\u1EE3ng xanh ch\xE9m b\xF3ng \u1EA3nh t\u1ED1c \u0111\u1ED9", "Twin azure energy blades speed slash", HERO_SKILL_ICONS.phong.atk), passive: me("phong", "passive", "passive", "#0EA5E9", "#082F49", "\u1EA2nh \u1EA3o xanh t\u1EF1 \u0111\u1ED9ng t\u1EA5n c\xF4ng & h\u1ED3i m\xE1u gi\u1EA3m h\u1ED3i chi\xEAu khi h\u1EA1 g\u1EE5c", "Autonomous cyan illusion & kill heal/CD refund", HERO_SKILL_ICONS.phong.passive), c1: me("phong", "c1", "movement", "#22D3EE", "#082F49", "Tam \u1EA2nh Tr\u1EA3m l\u01B0\u1EDBt ch\xE9m 3 l\u1EA7n v\u1EDBi nh\xE1t cu\u1ED1i ch\xED m\u1EA1ng", "Triple dash slash with guaranteed final crit", HERO_SKILL_ICONS.phong.c1), c2: me("phong", "c2", "movement", "#38BDF8", "#0C4A6E", "Ho\xE1n \u1EA2nh \u0111\u1ED5i v\u1ECB tr\xED v\u1EDBi \u1EA3nh \u1EA3o b\xF9ng n\u1ED5 s\xE1t th\u01B0\u01A1ng", "Swap with nearest shadow illusion & AoE burst", HERO_SKILL_ICONS.phong.c2), c3: me("phong", "c3", "ultimate", "#F43F5E", "#082F49", "T\u1EED Th\u1EA7n Gi\xE1ng L\xE2m \u0111\xE1nh d\u1EA5u & k\u1EBFt li\u1EC5u theo m\xE1u \u0111\xE3 m\u1EA5t", "Mark & execute flurry scaling by missing HP", HERO_SKILL_ICONS.phong.c3) }, dang: { atk: me("dang", "atk", "basic", "#F8FAFC", "#18181B", "Song quy\u1EC1n h\u1ED5 kh\xED tr\u1EAFng \u0111en t\u1EA5n c\xF4ng c\u1EADn chi\u1EBFn", "Yin-Yang tiger energy gauntlets strike", HERO_SKILL_ICONS.dang.atk), passive: me("dang", "passive", "passive", "#F8FAFC", "#09090B", "H\u1ED5 Ph\xE1ch Cu\u1ED3ng Quy\u1EC1n t\xEDch n\u1ED9 tung H\u1ED5 Quy\u1EC1n di\u1EC7n r\u1ED9ng", "Rage-fueled empowered AoE Tiger Fist & heal", HERO_SKILL_ICONS.dang.passive), c1: me("dang", "c1", "active", "#F8FAFC", "#18181B", "B\u1EA1ch H\u1ED5 Ph\xE1 S\u01A1n ph\xF3ng 3 s\xF3ng quy\u1EC1n kh\xED h\xECnh h\u1ED5", "Triple tiger-qi waves healing per target hit", HERO_SKILL_ICONS.dang.c1), c2: me("dang", "c2", "defense", "#CBD5E1", "#09090B", "H\u1EAFc H\u1ED5 H\u1ED9 Th\u1EC3 gi\xE1p kh\xED gi\u1EA3m s\xE1t th\u01B0\u01A1ng & ph\u1EA3n \u0111\xF2n", "Black-white qi armor DR, counter & knockback boom", HERO_SKILL_ICONS.dang.c2), c3: me("dang", "c3", "ultimate", "#F8FAFC", "#09090B", "H\u1ED5 Quy\u1EC1n Di\u1EC7t Th\u1EBF 5 quy\u1EC1n li\xEAn ho\xE0n & \u0111\u1EA7u h\u1ED5 kh\u1ED5ng l\u1ED3", "5-punch flurry summoning giant roaring tiger head", HERO_SKILL_ICONS.dang.c3) }, thien: { atk: me("thien", "atk", "basic", "#FACC15", "#091428", "Thi\xEAn Ki\u1EBFm Th\xE1nh Quang vung lu\u1ED3ng s\xE1ng tr\u1EAFng - v\xE0ng - thi\xEAn h\xE0", "Celestial blade arc in white, gold & galaxy blue", HERO_SKILL_ICONS.thien?.atk), passive: me("thien", "passive", "passive", "#38BDF8", "#0A1733", "Quy\u1EC1n N\u0103ng Kh\u1EDFi Nguy\xEAn t\xEDch Nguy\xEAn L\u1EF1c k\xEDch ho\u1EA1t S\xE1ng Th\u1EBF", "Primordial Core building energy into Genesis State", HERO_SKILL_ICONS.thien?.passive), c1: me("thien", "c1", "active", "#38BDF8", "#071429", "V\u1EA1n Ki\u1EBFm Khai Thi\xEAn tri\u1EC7u h\u1ED3i 12 th\u1EA7n ki\u1EBFm truy \u0111u\u1ED5i & h\u1ED3i m\xE1u", "Twelve divine swords orbiting, homing & healing", HERO_SKILL_ICONS.thien?.c1), c2: me("thien", "c2", "defense", "#FDE047", "#0F172A", "Thi\xEAn M\u1EC7nh \u0110\u1EA3o Chi\u1EC1u v\xF9ng th\u1EDDi gian l\xE0m ch\u1EADm & t\xE1i k\xEDch n\u1ED5 khi\xEAn", "Chronosphere slow & recast explosion with heal/shield", HERO_SKILL_ICONS.thien?.c2), c3: me("thien", "c3", "movement", "#7DD3FC", "#081226", "V\u1EA1n Gi\u1EDBi Du H\xE0nh m\u1EDF c\u1ED5ng kh\xF4ng gian & t\xE1i k\xEDch quay v\u1EC1", "Cosmic portal warp with 4s return blast", HERO_SKILL_ICONS.thien?.c3), c4: me("thien", "c4", "ultimate", "#FACC15", "#1A1204", "Ph\xE1n Quy\u1EBFt S\xE1ng Th\u1EBF tri\u1EC7u h\u1ED3i M\u1EB7t Tr\u1EDDi N\u0103ng L\u01B0\u1EE3ng h\u1EE7y di\u1EC7t", "Genesis Judgement Solar Beam executing & blasting", HERO_SKILL_ICONS.thien?.c4) } };
function gl(s, a) {
  return bm[s]?.[a] || bm.dung.atk;
}
function ty(s, a, l = 128) {
  let m = gl(s, a);
  return m.svgDataUrl ? m.svgDataUrl : l === 512 ? m.png512 : m.png128;
}
function ay(s, a) {
  return gl(s, a).category;
}
function vm(s, a, l) {
  let m = ey[ay(s, a)];
  return { label: m[l], color: m.color };
}
function iy(s, a) {
  let l = gl(s, a);
  if (l.svgDataUrl) return l.svgDataUrl;
  let m = l.elementColor, c = l.bgDark, isUlt = a === "c3" || a === "c4", g = isUlt ? "#F59E0B" : m, p = `<circle cx="32" cy="32" r="14" fill="${m}" opacity="0.85"/><circle cx="32" cy="32" r="6" fill="#FFFFFF"/>`;
  a === "atk" ? p = `<path d="M16 48 L46 14 L50 18 L20 52 Z" fill="${m}" stroke="#FFF" stroke-width="1.5"/><path d="M14 40 L24 50" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>` : a === "passive" ? p = `<polygon points="32,12 48,32 32,52 16,32" fill="none" stroke="${m}" stroke-width="3"/><circle cx="32" cy="32" r="7" fill="#FFF"/>` : isUlt && (p = `<polygon points="32,8 38,24 56,32 38,40 32,56 26,40 8,32 26,24" fill="${m}" stroke="#FEF08A" stroke-width="1.8"/><circle cx="32" cy="32" r="6" fill="#FFF"/>`);
  let h = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="#050811"/></radialGradient></defs><rect x="1" y="1" width="62" height="62" rx="11" fill="url(#g)" stroke="${g}" stroke-width="2.5"/>${p}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(h)}`;
}
var Wt = ({ heroId: s, skillId: a, size: l = 48, hiRes: m = false, roundedClass: c = "rounded-xl", className: g = "", alt: p }) => {
  let h = gl(s, a), f = SKILL_ICON_DATA_URLS?.[`${s}_${a}`] || HERO_SKILL_ICONS?.[s]?.[a] || (typeof window < "u" ? window.__SKILL_ICON_DATA_URLS__ : void 0)?.[`${s}_${a}`], T = h.svgDataUrl ? h.svgDataUrl : f ? f : ty(s, a, m || l >= 140 ? 512 : 128), [b, x] = (0, ie.useState)(T);
  (0, ie.useEffect)(() => {
    x(T);
  }, [T]);
  let C = a === "c3" || a === "c4";
  return (0, u.jsx)("div", { className: `relative shrink-0 overflow-hidden select-none bg-[#0f172a] ${c} ${g}`, style: { width: l, height: l, boxShadow: C ? `0 0 18px ${h.elementColor}88, inset 0 0 0 1.5px rgba(251, 191, 36, 0.72)` : `0 0 12px ${h.elementColor}55, inset 0 0 0 1px rgba(255, 255, 255, 0.16)` }, "aria-label": p || void 0, children: (0, u.jsx)("img", { src: b, alt: "", width: l, height: l, referrerPolicy: "no-referrer", draggable: false, className: `w-full h-full object-contain block ${c === "rounded-full" ? "scale-[1.14]" : ""}`, onError: () => {
    let H = iy(s, a);
    f && b !== f ? x(f) : b !== H && x(H);
  } }) });
};
function formatWaveClock(sec) {
  let s = Math.max(0, Number(sec) || 0);
  let m = Math.floor(s / 60);
  let r = s - m * 60;
  return `${String(m).padStart(2, "0")}:${r < 10 ? "0" : ""}${r.toFixed(1)}`;
}
function ny() {
  const [initialDeviceSettings] = (0, ie.useState)(() => loadDeviceSettings());
  let s = (0, ie.useRef)(null), a = (0, ie.useRef)(null), [l, m] = (0, ie.useState)("MENU"), [c, g] = (0, ie.useState)(() => initialDeviceSettings.lang || "vi"), [p, h] = (0, ie.useState)(Mi[4]), [f, v] = (0, ie.useState)(100), [T, b] = (0, ie.useState)(false), [x, C] = (0, ie.useState)(false), [H, D] = (0, ie.useState)(false), [P, N] = (0, ie.useState)(false), [W, V] = (0, ie.useState)(false), [oe, ye] = (0, ie.useState)(false), [De, nt] = (0, ie.useState)(false), [ce, Me] = (0, ie.useState)(null), [ht, je] = (0, ie.useState)("eohyen"), [qe, bt] = (0, ie.useState)(0), [Ft, Nt] = (0, ie.useState)(() => initialDeviceSettings.sfxEnabled), [U, pe] = (0, ie.useState)(() => initialDeviceSettings.sfxVolume), [musicOn, setMusicOn] = (0, ie.useState)(() => initialDeviceSettings.musicOn), [musicVol, setMusicVol] = (0, ie.useState)(() => initialDeviceSettings.musicVol), [ne, _e] = (0, ie.useState)(() => initialDeviceSettings.screenShake), [Z, tt] = (0, ie.useState)(() => initialDeviceSettings.showDamageNumbers), [layoutMode, setLayoutMode] = (0, ie.useState)(() => initialDeviceSettings.layoutMode), [portraitFov, setPortraitFov] = (0, ie.useState)(() => initialDeviceSettings.portraitFov), [qualityMode, setQualityMode] = (0, ie.useState)(() => initialDeviceSettings.qualityMode), [fpsCapMode, setFpsCapMode] = (0, ie.useState)(() => initialDeviceSettings.fpsCapMode), [viewportSize, setViewportSize] = (0, ie.useState)(() => ({
    w: typeof window !== "undefined" ? window.innerWidth || 1280 : 1280,
    h: typeof window !== "undefined" ? window.innerHeight || 720 : 720
  })), [isFullscreen, setIsFullscreen] = (0, ie.useState)(false), [isPseudoFullscreen, setIsPseudoFullscreen] = (0, ie.useState)(false), [shareGuideOpen, setShareGuideOpen] = (0, ie.useState)(false), [shareCopied, setShareCopied] = (0, ie.useState)(false), [mpLobbyOpen, setMpLobbyOpen] = (0, ie.useState)(false), [mpRoom, setMpRoom] = (0, ie.useState)(null), [mpName, setMpName] = (0, ie.useState)(() => {
    try {
      return readDeviceKey(MP_PLAYER_NAME_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  }), [mpJoinCode, setMpJoinCode] = (0, ie.useState)(""), [mpBusy, setMpBusy] = (0, ie.useState)(false), [mpError, setMpError] = (0, ie.useState)(""), [mpCopied, setMpCopied] = (0, ie.useState)(false), [mpMenuOpen, setMpMenuOpen] = (0, ie.useState)(false), [mpMatchResult, setMpMatchResult] = (0, ie.useState)(null), [p2pInviteCode, setP2pInviteCode] = (0, ie.useState)(""), [p2pManualOfferCode, setP2pManualOfferCode] = (0, ie.useState)(""), [p2pHasServerSignal, setP2pHasServerSignal] = (0, ie.useState)(false), [p2pAnswerCode, setP2pAnswerCode] = (0, ie.useState)(""), [p2pAutoPaired, setP2pAutoPaired] = (0, ie.useState)(false), [p2pIncomingOffer, setP2pIncomingOffer] = (0, ie.useState)(""), [p2pIncomingAnswer, setP2pIncomingAnswer] = (0, ie.useState)(""), [p2pBusy, setP2pBusy] = (0, ie.useState)(false), [customServerUrl, setCustomServerUrl] = (0, ie.useState)(() => mpClient.getCustomServerUrl()), [lanUrls, setLanUrls] = (0, ie.useState)([]),
    [founderUnlocked, setFounderUnlocked] = (0, ie.useState)(false),
    [founderToken, setFounderToken] = (0, ie.useState)(""),
    [founderAuthSource, setFounderAuthSource] = (0, ie.useState)(""),
    [founderModalOpen, setFounderModalOpen] = (0, ie.useState)(false),
    [founderPinInput, setFounderPinInput] = (0, ie.useState)(""),
    [founderAuthBusy, setFounderAuthBusy] = (0, ie.useState)(false),
    [founderAuthError, setFounderAuthError] = (0, ie.useState)(""),
    [founderAuthDetails, setFounderAuthDetails] = (0, ie.useState)(null),
    [thienEyeOpen, setThienEyeOpen] = (0, ie.useState)(true),
    [accountModalOpen, setAccountModalOpen] = (0, ie.useState)(false),
    [accountModalTab, setAccountModalTab] = (0, ie.useState)("profile"),
    [googleUser, setGoogleUser] = (0, ie.useState)(null),
    [playerProfile, setPlayerProfile] = (0, ie.useState)(() => loadLocalPlayerProfile()),
    [accountSyncBusy, setAccountSyncBusy] = (0, ie.useState)(false),
    [accountAuthError, setAccountAuthError] = (0, ie.useState)(""),
    [accountAuthDetails, setAccountAuthDetails] = (0, ie.useState)(null),
    [deviceInfo, setDeviceInfo] = (0, ie.useState)(() => touchDeviceVisit()),
    [resumableRun, setResumableRun] = (0, ie.useState)(null),
    [selectedMapId, setSelectedMapId] = (0, ie.useState)("classic"),
    [unlockedMaps, setUnlockedMaps] = (0, ie.useState)(["classic"]),
    [citadelSecrets, setCitadelSecrets] = (0, ie.useState)(() => createDefaultCitadelSecrets()),
    [citadelLoreModal, setCitadelLoreModal] = (0, ie.useState)(null),
    [citadelMinimapOpen, setCitadelMinimapOpen] = (0, ie.useState)(true),
    [infernoProgress, setInfernoProgress] = (0, ie.useState)(() => createDefaultInfernoProgress()),
    [infernoStoryModal, setInfernoStoryModal] = (0, ie.useState)(null),
    [infernoJournalOpen, setInfernoJournalOpen] = (0, ie.useState)(false),
    [infernoMinimapOpen, setInfernoMinimapOpen] = (0, ie.useState)(true),
    [frozenTombProgress, setFrozenTombProgress] = (0, ie.useState)(() => createDefaultFrozenTombProgress()),
    [frozenTombStoryModal, setFrozenTombStoryModal] = (0, ie.useState)(null),
    [frozenTombJournalOpen, setFrozenTombJournalOpen] = (0, ie.useState)(false),
    [frozenTombMinimapOpen, setFrozenTombMinimapOpen] = (0, ie.useState)(true),
    [grudgeForestProgress, setGrudgeForestProgress] = (0, ie.useState)(() => createDefaultGrudgeForestProgress()),
    [grudgeForestStoryModal, setGrudgeForestStoryModal] = (0, ie.useState)(null),
    [grudgeForestJournalOpen, setGrudgeForestJournalOpen] = (0, ie.useState)(false),
    [grudgeForestMinimapOpen, setGrudgeForestMinimapOpen] = (0, ie.useState)(true),
    [chroniclesOpen, setChroniclesOpen] = (0, ie.useState)(false),
    [chroniclesTab, setChroniclesTab] = (0, ie.useState)("world"),
    [chroniclesFocusHeroId, setChroniclesFocusHeroId] = (0, ie.useState)(null),
    [re, vt] = (0, ie.useState)({ heroName: "\xC9o hy\xEAn", level: 1, hp: 960, maxHp: 960, shield: 0, xpPct: 0, wave: 1, kills: 0, waveTotal: 10, totalKilled: 0, totalDamage: 0, waveElapsedTime: 0, lastWaveClearTime: 0, buffsText: "", resourceText: "", thienState: null, droneMode: "attack", droneLabel: "T\u1EA5n C\xF4ng", droneColor: "#38BDF8", cooldowns: [0, 0, 0, 0], padTeleportCds: [0, 0, 0, 0], skillStates: ["ready", "ready", "ready", "ready"], chargeActive: false, chargeProgress: 0, chargeLabel: "", combo: { active: false, rank: "D", hits: 0, score: 0, timer: 0, maxTimer: 3.5, comboName: "", efficiency: 100 }, coopActive: false, localDowned: false, powerMultiplier: 1, teammates: [], boss: null, mapId: "classic", nearbyInteractable: null, citadelSecrets: createDefaultCitadelSecrets(), citadelHud: null, infernoProgress: createDefaultInfernoProgress(), infernoHud: null, frozenTombProgress: createDefaultFrozenTombProgress(), frozenTombHud: null, grudgeForestProgress: createDefaultGrudgeForestProgress(), grudgeForestHud: null }),
    [mt, S] = (0, ie.useState)(null),
    selectedHeroRef = (0, ie.useRef)(p),
    citadelLorePausedRef = (0, ie.useRef)(false),
    infernoStoryPausedRef = (0, ie.useRef)(false),
    frozenTombStoryPausedRef = (0, ie.useRef)(false),
    grudgeForestStoryPausedRef = (0, ie.useRef)(false),
    founderUnlockedRef = (0, ie.useRef)(false),
    founderPendingActionRef = (0, ie.useRef)(null),
    mpBusyTimerRef = (0, ie.useRef)(null),
    toastTimerRef = (0, ie.useRef)(null),
    googleUserRef = (0, ie.useRef)(null),
    playerProfileRef = (0, ie.useRef)(playerProfile),
    lastTrackedMatchKillsRef = (0, ie.useRef)(0),
    lastRecordedEndKeyRef = (0, ie.useRef)(""),
    syncedBootUidRef = (0, ie.useRef)(null),
    cloudPullInFlightRef = (0, ie.useRef)(null),
    perfPrefsRef = (0, ie.useRef)({ qualityMode, fpsCapMode }),
    G = (0, ie.useCallback)((w, durationMs = 2400) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      S(w);
      toastTimerRef.current = setTimeout(() => {
        toastTimerRef.current = null;
        S((j) => j === w ? null : j);
      }, durationMs);
    }, []);
  founderUnlockedRef.current = founderUnlocked;
  googleUserRef.current = googleUser;
  playerProfileRef.current = playerProfile;
  perfPrefsRef.current = { qualityMode, fpsCapMode };
  const resolveFounderApiBase = (0, ie.useCallback)(() => {
    if (
      typeof window !== "undefined" &&
      /^https?:$/i.test(window.location?.protocol || "") &&
      !isStaticWebHost(window.location?.hostname || "", window.location?.protocol || "")
    ) {
      return { canFetch: true, base: "" };
    }
    const base = mpClient.getHttpBaseResult().baseUrl || "";
    return { canFetch: Boolean(base), base };
  }, []);
  const applyFounderUnlockState = (0, ie.useCallback)((unlocked, token = "", source = "") => {
    const nextUnlocked = Boolean(unlocked);
    const nextToken = nextUnlocked && typeof token === "string" ? token : "";
    founderUnlockedRef.current = nextUnlocked;
    mpClient.setFounderAuth(nextUnlocked, nextToken);
    setFounderUnlocked(nextUnlocked);
    setFounderToken(nextToken);
    setFounderAuthSource(nextUnlocked ? source : "");
    a.current?.setFounderUnlocked?.(nextUnlocked);
  }, []);
  let requireFounderUnlock = (0, ie.useCallback)((onSuccessAction) => {
    if (founderUnlockedRef.current) {
      onSuccessAction?.();
      return true;
    }
    founderPendingActionRef.current = onSuccessAction || null;
    setFounderAuthError("");
    setFounderPinInput("");
    setFounderModalOpen(true);
    return false;
  }, []);
  let envInfo = (0, ie.useMemo)(() => {
    if (typeof window === "undefined") {
      return { isIOS: false, isZalo: false, isMessenger: false, isInAppBrowser: false, isFileProtocol: false, isStandalonePwa: false, supportsNativeFullscreen: true };
    }
    const hasNativeFs = Boolean(document.documentElement?.requestFullscreen || document.documentElement?.webkitRequestFullscreen);
    const isStandalone = Boolean(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone);
    return detectClientEnvironment({
      userAgent: navigator.userAgent || "",
      protocol: window.location.protocol || "http:",
      hasNativeFullscreen: hasNativeFs,
      isStandalone,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    });
  }, []);
  selectedHeroRef.current = p;
  (0, ie.useEffect)(() => {
    let active = true;
    const { canFetch, base } = resolveFounderApiBase();
    if (!canFetch) {
      if (!founderUnlockedRef.current) {
        applyFounderUnlockState(false, "", "");
      }
      return () => { active = false; };
    }
    const headers = mpClient.founderToken ? { "X-Founder-Token": mpClient.founderToken } : {};
    fetch(`${base}/api/founder/status`, { cache: "no-store", credentials: "include", headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const unlocked = Boolean(data?.unlocked);
        if (!unlocked && founderUnlockedRef.current) {
          return;
        }
        const token = unlocked ? (data?.founderToken || data?.token || mpClient.founderToken || "") : "";
        applyFounderUnlockState(unlocked, token, data?.source || (unlocked ? "session" : ""));
        if (!unlocked && (selectedHeroRef.current?.isSecretFounder || a.current?.currentHero?.isSecretFounder)) {
          const fallbackHero = Mi[4];
          h(fallbackHero);
          if (a.current) {
            a.current.currentHero = fallbackHero;
            a.current.selectedHeroId = fallbackHero.id;
          }
        }
      })
      .catch(() => {
        if (active && !founderUnlockedRef.current) mpClient.setFounderAuth(false, "");
      });
    return () => { active = false; };
  }, [applyFounderUnlockState, resolveFounderApiBase]);
  (0, ie.useEffect)(() => {
    const stateMap = { MENU: "title", HERO_SELECT: "title", PLAYING: "playing", PAUSED: "paused", GAME_OVER: "gameover", VICTORY: "gameover" };
    document.body.dataset.state = stateMap[l] || "title";
  }, [l]);
  (0, ie.useEffect)(() => {
    if (!s.current) return;
    let w = new Hf(s.current);
    w.currentLang = initialDeviceSettings.lang || "vi";
    w.applyPerformanceSettings?.(perfPrefsRef.current);
    a.current = w, w.onToast = G, w.onSaveUpdated = () => {
      setDeviceInfo(loadDeviceRecord());
      setResumableRun(w.getSavedRunSnapshot?.() || null);
    }, w.onStateChange = () => {
      m(w.gameState), v(w.playerCoins);
      setSelectedMapId(w.selectedMapId || "classic");
      setUnlockedMaps([...(w.unlockedMaps || ["classic"])]);
      setCitadelSecrets(normalizeCitadelSecrets(w.citadelSecrets));
      setInfernoProgress(normalizeInfernoProgress(w.infernoProgress));
      setFrozenTombProgress(normalizeFrozenTombProgress(w.frozenTombProgress));
      setGrudgeForestProgress(normalizeGrudgeForestProgress(w.grudgeForestProgress));
      setResumableRun(w.getSavedRunSnapshot?.() || null);
    };
    w.onCitadelLore = (lorePayload) => {
      if (!lorePayload) return;
      if (w.citadelSecrets) setCitadelSecrets(normalizeCitadelSecrets(w.citadelSecrets));
      v(w.playerCoins);
      if (!w.multiplayer?.active && w.gameState === "PLAYING") {
        citadelLorePausedRef.current = true;
        w.gameState = "PAUSED";
        w.moveInput = { x: 0, y: 0 };
        w.tapDestination = null;
        w.aimState.active = false;
      } else {
        citadelLorePausedRef.current = false;
      }
      setCitadelLoreModal(lorePayload);
    };
    w.onInfernoStory = (storyPayload) => {
      if (!storyPayload) return;
      if (storyPayload.progress || w.infernoProgress) {
        setInfernoProgress(normalizeInfernoProgress(storyPayload.progress || w.infernoProgress));
      }
      v(w.playerCoins);
      if (!w.multiplayer?.active && w.gameState === "PLAYING") {
        infernoStoryPausedRef.current = true;
        w.gameState = "PAUSED";
        w.moveInput = { x: 0, y: 0 };
        w.tapDestination = null;
        w.aimState.active = false;
      } else {
        infernoStoryPausedRef.current = false;
      }
      setInfernoStoryModal(storyPayload);
    };
    w.onFrozenTombStory = (storyPayload) => {
      if (!storyPayload) return;
      if (storyPayload.progress || w.frozenTombProgress) {
        setFrozenTombProgress(normalizeFrozenTombProgress(storyPayload.progress || w.frozenTombProgress));
      }
      v(w.playerCoins);
      if (!w.multiplayer?.active && w.gameState === "PLAYING") {
        frozenTombStoryPausedRef.current = true;
        w.gameState = "PAUSED";
        w.moveInput = { x: 0, y: 0 };
        w.tapDestination = null;
        w.aimState.active = false;
      } else {
        frozenTombStoryPausedRef.current = false;
      }
      setFrozenTombStoryModal(storyPayload);
    };
    w.onGrudgeForestStory = (storyPayload) => {
      if (!storyPayload) return;
      if (storyPayload.progress || w.grudgeForestProgress) {
        setGrudgeForestProgress(normalizeGrudgeForestProgress(storyPayload.progress || w.grudgeForestProgress));
      }
      v(w.playerCoins);
      if (!w.multiplayer?.active && w.gameState === "PLAYING") {
        grudgeForestStoryPausedRef.current = true;
        w.gameState = "PAUSED";
        w.moveInput = { x: 0, y: 0 };
        w.tapDestination = null;
        w.aimState.active = false;
      } else {
        grudgeForestStoryPausedRef.current = false;
      }
      setGrudgeForestStoryModal(storyPayload);
    };
    const recordCareerProgress = (waveReached, isMatchEnd, victory) => {
      if (isMatchEnd) {
        const endKey = w.multiplayer?.active
          ? `mp:${w.multiplayer.roomId || ""}:${w.multiplayer.matchNonce || ""}:${Math.round(w.elapsedTime || 0)}:${Boolean(victory)}`
          : `solo:${Math.round(w.elapsedTime || 0)}:${waveReached || w.wave}:${Boolean(victory)}`;
        if (lastRecordedEndKeyRef.current === endKey) {
          return;
        }
        lastRecordedEndKeyRef.current = endKey;
      }
      const totalKilledNow = Number(w.totalKilled) || 0;
      if (totalKilledNow < lastTrackedMatchKillsRef.current) {
        lastTrackedMatchKillsRef.current = 0;
      }
      const deltaKills = Math.max(0, totalKilledNow - lastTrackedMatchKillsRef.current);
      lastTrackedMatchKillsRef.current = isMatchEnd ? 0 : totalKilledNow;

      const curProf = playerProfileRef.current || loadLocalPlayerProfile();
      const nextHighestWave = Math.max(curProf.highestWave || 0, w.highestWaveCleared || 0, waveReached || 0);
      w.highestWaveCleared = Math.max(w.highestWaveCleared || 0, nextHighestWave);
      if (victory && waveReached >= CITADEL_UNLOCK_WAVE) {
        const clearedMap = normalizeArenaMapId(w.activeMapId || "classic");
        if (clearedMap === "classic") {
          w.classicCleared = true;
        } else if (clearedMap === "blood_citadel") {
          w.classicCleared = true;
          w.bloodCitadelCleared = true;
        } else if (clearedMap === "inferno_ash") {
          w.classicCleared = true;
          w.bloodCitadelCleared = true;
          w.infernoCleared = true;
        } else if (clearedMap === "frozen_tomb") {
          w.classicCleared = true;
          w.bloodCitadelCleared = true;
          w.infernoCleared = true;
          w.frozenTombCleared = true;
        } else if (clearedMap === "grudge_forest") {
          w.classicCleared = true;
          w.bloodCitadelCleared = true;
          w.infernoCleared = true;
          w.frozenTombCleared = true;
          w.grudgeForestCleared = true;
        }
      }
      w.unlockedMaps = computeUnlockedMaps({
        classicCleared: Boolean(w.classicCleared),
        bloodCitadelCleared: Boolean(w.bloodCitadelCleared),
        infernoCleared: Boolean(w.infernoCleared),
        frozenTombCleared: Boolean(w.frozenTombCleared),
        grudgeForestCleared: Boolean(w.grudgeForestCleared),
        highestWaveCleared: w.highestWaveCleared,
        storedUnlocked: w.unlockedMaps,
        founderUnlocked: founderUnlockedRef.current,
      });
      w.saveGame();
      setUnlockedMaps([...w.unlockedMaps]);
      setCitadelSecrets(normalizeCitadelSecrets(w.citadelSecrets));
      setInfernoProgress(normalizeInfernoProgress(w.infernoProgress));
      setFrozenTombProgress(normalizeFrozenTombProgress(w.frozenTombProgress));
      setGrudgeForestProgress(normalizeGrudgeForestProgress(w.grudgeForestProgress));
      const activeHeroId = w.currentHero?.id || w.selectedHeroId || "eohyen";
      const nextHeroStats = recordHeroMatchProgress(curProf.heroStats, {
        heroId: activeHeroId,
        waveReached: Math.max(Number(waveReached) || 0, Number(w.wave) || 1),
        deltaKills,
        totalDamage: Number(w.player?.totalDamage) || 0,
        isMatchEnd: Boolean(isMatchEnd),
        victory: Boolean(victory),
        isCoop: Boolean(w.multiplayer?.active),
      });
      const saved = saveLocalPlayerProfile(
        {
          ...curProf,
          highestWave: nextHighestWave,
          lifetimeKills: (curProf.lifetimeKills || 0) + deltaKills,
          matchesPlayed: (curProf.matchesPlayed || 0) + (isMatchEnd ? 1 : 0),
          victories: (curProf.victories || 0) + (isMatchEnd && victory ? 1 : 0),
          unlockedTitles: computeUnlockedTitles(nextHighestWave, founderUnlockedRef.current),
          heroStats: nextHeroStats,
        },
        { founderUnlocked: founderUnlockedRef.current, minHighestWave: nextHighestWave }
      );
      setPlayerProfile(saved);
      const signedUser = googleUserRef.current;
      if (signedUser?.uid) {
        const snapshot = {
          coins: Math.max(0, Math.floor(Number(w.playerCoins) || 0)),
          currentWave: Math.max(1, Math.min(27, Math.floor(Number(w.currentWaveNumber || w.wave) || 1))),
          highestWave: nextHighestWave,
          selectedHeroId:
            w.selectedHeroId === "thien" && !founderUnlockedRef.current ? "eohyen" : w.selectedHeroId || "eohyen",
          inventoryItemIds: (w.inventory || [])
            .map((it) => it?.itemId)
            .filter((id) => typeof id === "string" && Boolean(Si[id]))
            .slice(0, 250),
          heroGearEntries: serializeHeroGearEntries(w.heroGear),
          lifetimeKills: saved.lifetimeKills,
          matchesPlayed: saved.matchesPlayed,
          victories: saved.victories,
          dailyCheckInDate: saved.dailyCheckInDate || "",
          unlockedTitles: saved.unlockedTitles || [],
          heroStatsEntries: serializeHeroStatsEntries(saved.heroStats),
          selectedMapId: w.selectedMapId || "classic",
          classicCleared: Boolean(w.classicCleared),
          bloodCitadelCleared: Boolean(w.bloodCitadelCleared),
          infernoCleared: Boolean(w.infernoCleared),
          frozenTombCleared: Boolean(w.frozenTombCleared),
          grudgeForestCleared: Boolean(w.grudgeForestCleared),
          unlockedMaps: [...w.unlockedMaps],
          citadelSecrets: normalizeCitadelSecrets(w.citadelSecrets),
          infernoProgress: normalizeInfernoProgress(w.infernoProgress),
          frozenTombProgress: normalizeFrozenTombProgress(w.frozenTombProgress),
          grudgeForestProgress: normalizeGrudgeForestProgress(w.grudgeForestProgress),
        };
        Promise.allSettled([
          savePrivatePlayerSave(signedUser.uid, snapshot, founderUnlockedRef.current),
          upsertPublicPlayerProfile(signedUser.uid, { ...saved, uid: signedUser.uid }, founderUnlockedRef.current),
        ]).catch(() => {});
      }
    };
    if ((w.highestWaveCleared || 0) > (playerProfileRef.current?.highestWave || 0)) {
      const syncedLocal = saveLocalPlayerProfile(
        { ...playerProfileRef.current, highestWave: w.highestWaveCleared },
        { founderUnlocked: founderUnlockedRef.current, minHighestWave: w.highestWaveCleared }
      );
      setPlayerProfile(syncedLocal);
    } else if ((playerProfileRef.current?.highestWave || 0) > (w.highestWaveCleared || 0)) {
      w.highestWaveCleared = playerProfileRef.current.highestWave;
      w.unlockedMaps = computeUnlockedMaps({
        classicCleared: Boolean(w.classicCleared),
        bloodCitadelCleared: Boolean(w.bloodCitadelCleared),
        infernoCleared: Boolean(w.infernoCleared),
        frozenTombCleared: Boolean(w.frozenTombCleared),
        grudgeForestCleared: Boolean(w.grudgeForestCleared),
        highestWaveCleared: w.highestWaveCleared,
        storedUnlocked: w.unlockedMaps,
        founderUnlocked: founderUnlockedRef.current,
      });
      w.saveGame();
    }
    setSelectedMapId(w.selectedMapId || "classic");
    setUnlockedMaps([...(w.unlockedMaps || ["classic"])]);
    setCitadelSecrets(normalizeCitadelSecrets(w.citadelSecrets));
    setInfernoProgress(normalizeInfernoProgress(w.infernoProgress));
    setFrozenTombProgress(normalizeFrozenTombProgress(w.frozenTombProgress));
    setGrudgeForestProgress(normalizeGrudgeForestProgress(w.grudgeForestProgress));
    setResumableRun(w.getSavedRunSnapshot?.() || null);
    setDeviceInfo(loadDeviceRecord());
    v(w.playerCoins);
    if (w.currentHero && !(w.currentHero.isSecretFounder && !founderUnlockedRef.current)) {
      h(w.currentHero);
    }
    w.onWaveReward = (le) => {
      Me(le), v(le.currentBalance), nt(true);
      recordCareerProgress(le?.wave || w.wave, false, false);
    }, w.onGameOver = (victory, extra) => {
      extra && setMpMatchResult(extra);
      m(w.gameState);
      recordCareerProgress(w.wave, true, Boolean(victory));
    }, w.start();
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("autostart") === "1") {
        const heroParam = sp.get("hero");
        const requestedHero = (heroParam && Mi.find((hr) => hr.id === heroParam)) || selectedHeroRef.current || Mi[4];
        if (requestedHero?.isSecretFounder && !founderUnlockedRef.current) {
          const safeHero = Mi[4];
          h(safeHero);
          founderPendingActionRef.current = () => {
            h(requestedHero);
            w.startNewGame(requestedHero);
            m("PLAYING");
            v(w.playerCoins);
          };
          setFounderModalOpen(true);
        } else {
          h(requestedHero);
          w.startNewGame(requestedHero);
          m("PLAYING");
          v(w.playerCoins);
        }
      }
    } catch {
    }
    let hudTimerId = null, hudStopped = false;
    requestPersistentStorage().then((granted) => {
      if (!hudStopped && granted) {
        setDeviceInfo(loadDeviceRecord());
      }
    }).catch(() => {});
    hydrateDeviceStorageAsync().then((res) => {
      if (hudStopped || !res?.recoveredKeys?.length) return;
      if (res.recoveredKeys.includes(GAME_SAVE_STORAGE_KEY)) {
        const recoveredRaw = readDeviceKey(GAME_SAVE_STORAGE_KEY);
        if (recoveredRaw && w.applyHydratedSaveData?.(recoveredRaw)) {
          v(w.playerCoins);
          setSelectedMapId(w.selectedMapId || "classic");
          setUnlockedMaps([...(w.unlockedMaps || ["classic"])]);
          setCitadelSecrets(normalizeCitadelSecrets(w.citadelSecrets));
          setInfernoProgress(normalizeInfernoProgress(w.infernoProgress));
          setFrozenTombProgress(normalizeFrozenTombProgress(w.frozenTombProgress));
          setGrudgeForestProgress(normalizeGrudgeForestProgress(w.grudgeForestProgress));
          setResumableRun(w.getSavedRunSnapshot?.() || null);
          bt((n) => n + 1);
        }
      }
      if (res.recoveredKeys.includes(PLAYER_PROFILE_STORAGE_KEY)) {
        const recoveredProf = loadLocalPlayerProfile({
          founderUnlocked: founderUnlockedRef.current,
          minHighestWave: w.highestWaveCleared,
        });
        setPlayerProfile(recoveredProf);
        if (recoveredProf.displayName) setMpName(recoveredProf.displayName);
      }
      if (res.recoveredKeys.includes(DEVICE_SETTINGS_STORAGE_KEY)) {
        const ds = loadDeviceSettings();
        g(ds.lang);
        Nt(ds.sfxEnabled);
        pe(ds.sfxVolume);
        setMusicOn(ds.musicOn);
        setMusicVol(ds.musicVol);
        _e(ds.screenShake);
        tt(ds.showDamageNumbers);
        setLayoutMode(ds.layoutMode);
        setPortraitFov(ds.portraitFov);
        setQualityMode(ds.qualityMode);
        setFpsCapMode(ds.fpsCapMode);
      }
      setDeviceInfo(loadDeviceRecord());
    }).catch(() => {});
    const flushDeviceCheckpoint = () => {
      if (!hudStopped && (w.gameState === "PLAYING" || w.gameState === "PAUSED") && !w.multiplayer?.active && w.player && w.player.hp > 0) {
        w.captureCurrentRunCheckpoint?.();
        w.saveGame();
      }
    };
    const autoSaveTimer = setInterval(() => {
      if (!hudStopped && w.gameState === "PLAYING" && !w.multiplayer?.active && w.player && w.player.hp > 0) {
        w.captureCurrentRunCheckpoint?.();
        w.saveGame();
      }
    }, 8000);
    const tickHud = () => {
      if (hudStopped) return;
      const isHidden = typeof document !== "undefined" && Boolean(document.hidden);
      if (!isHidden && w.gameState === "PLAYING") {
        let le = w.enemies.find((rt) => rt.kind === "boss"), X = [];
        w.player.berserkTimer > 0 && X.push(`CU\u1ED2NG CHI\u1EBEN ${w.player.berserkTimer.toFixed(1)}s`), w.player.dung_c3_buff_timer > 0 && X.push(`\u{1F43A} TAM \u0110\u1EA6U KHUY\u1EC2N ${w.player.dung_c3_buff_timer.toFixed(1)}s`), w.player.dung_passive > 0 && X.push(`CHI\u1EBEN \xDD ${w.player.dung_passive}/5`), w.currentHero.id === "tin" && (w.player.tin_resonance_stacks > 0 && X.push(`\u26A1 C\u1ED8NG H\u01AF\u1EDENG ${w.player.tin_resonance_stacks}/4`), w.player.tin_c1_recast_timer > 0 && X.push(`\u2728 L\u01AF\u1EDAT T\xC1I ${w.player.tin_c1_recast_timer.toFixed(1)}s`), w.player.tin_empowered && X.push("\u{1F525} C\u01AF\u1EDCNG H\xD3A +15%"), w.player.tin_monochrome_realm_timer > 0 && X.push(`\u{1F311} L\xC3NH \u0110\u1ECAA ${w.player.tin_monochrome_realm_timer.toFixed(1)}s`)), w.player.kin_passive > 0 && X.push(`XUY\xCAN T\xC2M ${w.player.kin_passive}/4`), w.currentHero.id === "kin" && w.player.kin_c2_lifestealTimer > 0 && X.push(`\u{1FA78} H\xDAT 40% ${w.player.kin_c2_lifestealTimer.toFixed(1)}s`), w.player.trung_passive > 0 && X.push(`MA L\u1EF0C ${w.player.trung_passive}/3`), w.player.eohyen_passive > 0 && X.push(`H\xC0N KH\xCD ${w.player.eohyen_passive}/4`), w.player.eohyen_heal_cd > 0 && X.push(`H\u1ED2I \u0110\xD2N ${w.player.eohyen_heal_cd.toFixed(1)}s`), w.currentHero.id === "longhoi" && X.push(`H\xDAT M\xC1U: ${w.player.longhoi_sustain_pool.toFixed(0)}/${(w.player.maxHp * 0.03).toFixed(0)} HP/s`), w.player.duccong_passive > 0 && X.push(`TINH T\xDA ${w.player.duccong_passive}/3`), w.currentHero.id === "duccong" && X.push(`T\u1EF0 H\u1ED2I: ${w.player.duccong_regen_timer.toFixed(1)}s`), w.currentHero.id === "gau" ? (w.player.gau_c2_guardTimer > 0 && X.push(`\u{1F6E1}\uFE0F TH\u1EE6 TH\u1EBE (${w.player.gau_c2_stacks}/4)`), w.player.gau_c1_step > 0 && X.push(`\u{1F94A} NH\u1ECAP ${w.player.gau_c1_step + 1}/3`), w.player.hp < w.player.maxHp && w.player.gau_noDmgTimer > 0 && X.push(`\u{1F6E1}\uFE0F H\u1ED2I ${Math.max(0, 3 - w.player.gau_noDmgTimer).toFixed(1)}s`)) : w.currentHero.id === "bao" ? (w.player.bao_stealthTimer > 0 && X.push(`\u{1F4A8} T\xC0NG H\xCCNH ${w.player.bao_stealthTimer.toFixed(1)}s`), w.player.bao_c1_recastTimer > 0 && w.player.bao_c1_awaitingSecond && X.push(`\u2694\uFE0F CH\xC9M 2 (${w.player.bao_c1_recastTimer.toFixed(1)}s)`)) : w.currentHero.id === "danh" ? (w.player.danh_dragonTimer > 0 && X.push(`\u{1F525} H\xD3A R\u1ED2NG ${w.player.danh_dragonTimer.toFixed(1)}s`), w.player.danh_khaiSonTimer > 0 && X.push(`\u2694\uFE0F KHAI S\u01A0N ${w.player.danh_khaiSonTimer.toFixed(1)}s`), w.player.danh_longNgamTimer > 0 && X.push(`\u{1F409} LONG NG\xC2M ${w.player.danh_longNgamTimer.toFixed(1)}s`), w.player.danh_thienPhatTimer > 0 && X.push(`\u26A1 THI\xCAN PH\u1EA0T ${w.player.danh_thienPhatTimer.toFixed(1)}s`), w.player.danh_c1_step > 0 && w.player.danh_dragonTimer <= 0 && X.push(`\u2694\uFE0F TAM LI\xCAN ${w.player.danh_c1_step + 1}/3`)) : w.currentHero.id === "luan" ? (w.luanPortals?.length > 0 && X.push(`\u{1FA9E} ${w.luanPortals.length} C\u1ED4NG (${Math.max(0, (w.luanPortals[0].maxLife || 9) - w.luanPortals[0].life).toFixed(1)}s)`), w.luanRifts?.length > 0 && X.push(`\u{1F300} ${w.luanRifts.length} V\u1EBET N\u1EE8T`)) : w.currentHero.id === "taidu" ? ((w.taiduTurrets?.length || 0) > 0 && X.push(`\u{1F52B} ${w.taiduTurrets.length}/2 PH\xC1O`), w.player.taidu_droneOverdriveTimer > 0 && X.push(`\u26A1 SI\xCAU T\u1EA2I ${w.player.taidu_droneOverdriveTimer.toFixed(1)}s`), w.player.taidu_droneMode === "guard" && X.push(`\u{1F6E1}\uFE0F H\u1EA4P TH\u1EE4 ${Math.round(w.player.taidu_droneShieldAccum || 0)}/160`)) : w.currentHero.id === "nguyen" && (w.player.nguyen_satellitesTimer > 0 && X.push(`\u{1F6F0}\uFE0F 3 V\u1EC6 TINH ${w.player.nguyen_satellitesTimer.toFixed(1)}s`), w.player.hp <= w.player.maxHp * 0.45 && X.push("\u{1F49A} H\u1ED2I +60%")), w.currentHero.id === "duy" && ((() => { let _dm = Math.round((1 + Math.min(1, (w.player.duy_idleTime || 0) / 4.5) * 3.5) * 100); X.push(`\u{1F5E1}\uFE0F T\u1EE4 S\xC1T ${_dm}%/450%`); (w.player.duy_idleTime || 0) >= 1.2 && X.push("\u{1F343} T\u0128NH S\xC1T +18%SPD"); let _dc = (w.duyDecoys || []).find((d) => !d.visualOnly && d.life < d.maxLife); _dc && X.push(`\u{1FA86} N\u1ED8M ${Math.max(0, _dc.maxLife - _dc.life).toFixed(1)}s (${Math.round((_dc.absorbedDamage || 0) * DUY_DECOY_REFLECT_RATIO * ((_dc.passiveMult || 1) > 1 ? _dc.passiveMult : 1))})`); })()), w.currentHero.id === "phong" && ((() => { let _pi = (w.phongIllusions || []).filter((il) => !il.visualOnly).length; _pi > 0 && X.push(`\u{1F300} \u1EA2NH \u1EA2O ${_pi}/4`); })()), w.currentHero.id === "dang" && ((() => { X.push(w.player.dang_rageReady ? "\u26A1 H\u1ED4 QUY\u1EC0N S\u1EB4N S\xC0NG" : `\u{1F42F} N\u1ED8 ${Math.round(w.player.dang_rage || 0)}/100`); w.player.dang_c2_timer > 0 && X.push(`\u{1F6E1}\uFE0F H\u1EAEC H\u1ED4 ${w.player.dang_c2_timer.toFixed(1)}s`); w.player.dang_c3_asTimer > 0 && X.push(`\u{1F4A5} +50% T\u0110 ${w.player.dang_c3_asTimer.toFixed(1)}s`); })()), w.player.stunTimer > 0 ? X.unshift(`\u{1F4AB} CHO\xC1NG ${w.player.stunTimer.toFixed(1)}s`) : w.player.rootTimer > 0 ? X.unshift(`\u26D3\uFE0F TR\xD3I CH\xC2N ${w.player.rootTimer.toFixed(1)}s`) : w.player.slowTimer > 0 && X.unshift(`\u2744\uFE0F CH\u1EACM ${Math.round(w.player.slowFactor * 100)}%`), w.player.burnTimer > 0 && X.push(`\u{1F525} THI\xCAU \u0110\u1ED0T ${w.player.burnTimer.toFixed(1)}s`), w.player.poisonTimer > 0 && X.push(`☠️ TRÚNG ĐỘC ${w.player.poisonTimer.toFixed(1)}s`);
        let we = w.getHudSnapshot();
        let mates = [];
        if (w.multiplayer?.active && mpClient.room?.members) {
          for (let mem of mpClient.room.members) {
            if (mem.id === mpClient.playerId) continue;
            let rp = w.multiplayer.remotePlayers.get(mem.id);
            let mHp = rp ? rp.hp : mem.hp ?? 960;
            let mMaxHp = rp ? rp.maxHp : mem.maxHp ?? 960;
            let mAlive = rp ? rp.alive && rp.hp > 0 : mem.alive !== false && mHp > 0;
            mates.push({ id: mem.id, name: mem.name, heroId: rp?.heroId || mem.heroId, isHost: mem.isHost, hp: Math.max(0, Math.ceil(mHp)), maxHp: Math.max(1, Math.ceil(mMaxHp)), level: rp?.level || mem.level || 1, alive: mAlive });
          }
        }
        vt({ heroName: w.currentHero.name.split("(")[0].trim(), level: w.player.level, hp: Math.ceil(w.player.hp), maxHp: w.player.maxHp, shield: Math.ceil(w.player.shield), xpPct: Math.min(100, w.player.xp / w.player.xpToNext * 100), wave: w.wave, kills: w.waveKilled, waveTotal: w.waveTotal, totalKilled: w.totalKilled || 0, totalDamage: Math.round(w.player.totalDamage || 0), waveElapsedTime: w.waveElapsedTime || 0, lastWaveClearTime: w.lastWaveClearTime || 0, buffsText: X.join(" \xB7 "), resourceText: we.resourceText, thienState: we.thienState || null, droneMode: we.droneMode || "attack", droneLabel: we.droneLabel || "T\u1EA5n C\xF4ng", droneColor: we.droneColor || "#38BDF8", cooldowns: [...w.player.cooldowns], padTeleportCds: we.padTeleportCds || [0, 0, 0, 0], skillStates: we.skillStates, chargeActive: we.chargeActive, chargeProgress: we.chargeProgress, chargeLabel: we.chargeLabel, combo: we.combo, coopActive: Boolean(w.multiplayer?.active), localDowned: Boolean(w.multiplayer?.localDowned), powerMultiplier: w.multiplayer?.powerMultiplier || 1, teammates: mates, boss: le && le.hp > 0 ? { name: le.name, hp: Math.ceil(le.hp), maxHp: le.maxHp, immune: false, phase: le.phase || 1 } : null, mapId: we.mapId || w.activeMapId || "classic", nearbyInteractable: we.nearbyInteractable || null, citadelSecrets: we.citadelSecrets || w.citadelSecrets || createDefaultCitadelSecrets(), citadelHud: we.citadelHud || null, infernoProgress: we.infernoProgress || normalizeInfernoProgress(w.infernoProgress), infernoHud: we.infernoHud || null, frozenTombProgress: we.frozenTombProgress || normalizeFrozenTombProgress(w.frozenTombProgress), frozenTombHud: we.frozenTombHud || null, grudgeForestProgress: we.grudgeForestProgress || normalizeGrudgeForestProgress(w.grudgeForestProgress), grudgeForestHud: we.grudgeForestHud || null }), v(w.playerCoins);
      }
      const nextMs = isHidden || w.gameState !== "PLAYING" ? 280 : (w.getPerformanceProfile?.().hudIntervalMs || 80);
      hudTimerId = setTimeout(tickHud, nextMs);
    };
    hudTimerId = setTimeout(tickHud, 70);
    const onVisHud = () => {
      if (hudStopped || typeof document === "undefined") return;
      if (document.hidden) {
        flushDeviceCheckpoint();
      } else if (hudTimerId !== null) {
        clearTimeout(hudTimerId);
        hudTimerId = setTimeout(tickHud, 20);
      }
    };
    typeof document !== "undefined" && document.addEventListener("visibilitychange", onVisHud);
    window.addEventListener("pagehide", flushDeviceCheckpoint);
    window.addEventListener("beforeunload", flushDeviceCheckpoint);
    let ee = () => w.resizeCanvas();
    window.addEventListener("resize", ee);
    let he = null;
    return typeof ResizeObserver < "u" && s.current && (he = new ResizeObserver(() => w.resizeCanvas()), he.observe(s.current)), () => {
      hudStopped = true, clearInterval(autoSaveTimer), hudTimerId !== null && clearTimeout(hudTimerId), typeof document !== "undefined" && document.removeEventListener("visibilitychange", onVisHud), window.removeEventListener("pagehide", flushDeviceCheckpoint), window.removeEventListener("beforeunload", flushDeviceCheckpoint), window.removeEventListener("resize", ee), he?.disconnect(), w.stop();
    };
  }, [G]), (0, ie.useEffect)(() => {
    let unsub = mpClient.subscribe((msg) => {
      a.current?.handleMultiplayerMessage(msg);
      if (msg.type === "ROOM_JOINED") {
        setMpRoom(msg.room || null);
        setMpBusy(false);
        setP2pBusy(false);
        setMpError("");
        setP2pAnswerCode("");
        setP2pIncomingOffer("");
        if (
          msg.room?.status === "PLAYING" &&
          a.current &&
          (!a.current.multiplayer?.active || a.current.gameState !== "PLAYING")
        ) {
          setMpLobbyOpen(false);
          setMpMenuOpen(false);
          nt(false);
          setMpMatchResult(null);
          let myMem = msg.room?.members?.find((mem) => mem.id === mpClient.playerId);
          let chosen = (myMem && Mi.find((hr) => hr.id === myMem.heroId)) || selectedHeroRef.current || Mi[4];
          if (chosen?.isSecretFounder && !founderUnlockedRef.current) chosen = Mi[4];
          h(chosen);
          a.current.startCoopMatch(chosen, msg.room, msg.spawns || {});
          a.current.multiplayer.matchNonce = msg.matchNonce || null;
          v(a.current.playerCoins);
          m("PLAYING");
          return;
        }
        if (a.current?.gameState !== "PLAYING") {
          setMpLobbyOpen(true);
        }
        if (msg.room?.hostId && msg.room.hostId !== mpClient.playerId) {
          G(`Đã vào phòng ${msg.room.roomId}! Hãy chọn tướng & bấm Sẵn Sàng.`);
        }
      } else if (msg.type === "P2P_INVITE_READY") {
        if (msg.inviteCode) setP2pInviteCode(msg.inviteCode);
        if (typeof msg.manualOfferCode === "string") setP2pManualOfferCode(msg.manualOfferCode);
        if (typeof msg.hasServerSignaling === "boolean") setP2pHasServerSignal(msg.hasServerSignaling);
      } else if (msg.type === "P2P_AUTO_PAIRED") {
        G("Đồng đội đã tự động ghép đôi P2P vào phòng!");
      } else if (msg.type === "P2P_RELAY_ACTIVE") {
        setMpBusy(false);
        setP2pBusy(false);
        G("Đã bật cầu nối P2P tương thích iPhone/Messenger! Đang đồng bộ phòng...");
      } else if (msg.type === "ROOM_UPDATE" || msg.type === "PLAYER_DOWNED" || msg.type === "PLAYER_REVIVED" || msg.type === "WAVE_COMPLETED") {
        msg.room && setMpRoom(msg.room);
        if (
          msg.type === "ROOM_UPDATE" &&
          msg.room?.status === "PLAYING" &&
          a.current &&
          (!a.current.multiplayer?.active || a.current.gameState !== "PLAYING") &&
          msg.room.members?.some((mem) => mem.id === mpClient.playerId)
        ) {
          setMpLobbyOpen(false);
          setMpMenuOpen(false);
          setMpBusy(false);
          setP2pBusy(false);
          setP2pAnswerCode("");
          setP2pIncomingOffer("");
          nt(false);
          setMpMatchResult(null);
          let myMem = msg.room.members.find((mem) => mem.id === mpClient.playerId);
          let chosen = (myMem && Mi.find((hr) => hr.id === myMem.heroId)) || selectedHeroRef.current || Mi[4];
          h(chosen);
          a.current.startCoopMatch(chosen, msg.room, msg.spawns || {});
          v(a.current.playerCoins);
          m("PLAYING");
        }
      } else if (msg.type === "PLAYER_LEFT") {
        msg.room && setMpRoom(msg.room);
        msg.newHostId === mpClient.playerId && G("B\u1EA1n \u0111\xE3 tr\u1EDF th\xE0nh \u0110\u1ED9i tr\u01B0\u1EDFng m\u1EDBi!");
      } else if (msg.type === "ROOM_ERROR") {
        setMpBusy(false);
        setP2pBusy(false);
        let errTxt = msg.message || "L\u1ED7i k\u1EBFt n\u1ED1i ph\xF2ng ch\u01A1i.";
        if (msg.code === "FOUNDER_LOCKED") {
          applyFounderUnlockState(false, "", "");
          setFounderAuthError(errTxt);
          setFounderModalOpen(true);
        }
        setMpError(errTxt);
        G(errTxt);
      } else if (msg.type === "LEFT_ROOM") {
        setMpRoom(null);
        setMpBusy(false);
        setP2pBusy(false);
        setMpError("");
      } else if (msg.type === "WS_CLOSE") {
        setMpBusy(false);
        setP2pBusy(false);
        a.current?.multiplayer?.active && G("M\u1EA5t k\u1EBFt n\u1ED1i m\xE1y ch\u1EE7 Co-op!");
      } else if (msg.type === "MATCH_STARTED") {
        setMpRoom(msg.room || null);
        setMpLobbyOpen(false);
        setMpMenuOpen(false);
        setMpBusy(false);
        setP2pBusy(false);
        setP2pAnswerCode("");
        setP2pIncomingOffer("");
        nt(false);
        setMpMatchResult(null);
        if (
          msg.matchNonce &&
          a.current?.multiplayer?.active &&
          a.current.gameState === "PLAYING" &&
          a.current.multiplayer.roomId === msg.room?.roomId &&
          a.current.multiplayer.matchNonce === msg.matchNonce
        ) {
          return;
        }
        let myMem = msg.room?.members?.find((mem) => mem.id === mpClient.playerId);
        let chosen = (myMem && Mi.find((hr) => hr.id === myMem.heroId)) || selectedHeroRef.current || Mi[4];
        if (chosen?.isSecretFounder && !founderUnlockedRef.current) chosen = Mi[4];
        h(chosen);
        lastTrackedMatchKillsRef.current = 0;
        lastRecordedEndKeyRef.current = "";
        if (a.current) {
          a.current.startCoopMatch(chosen, msg.room, msg.spawns || {});
          a.current.multiplayer.matchNonce = msg.matchNonce || null;
          v(a.current.playerCoins);
        }
        m("PLAYING");
      } else if (msg.type === "WAVE_STARTED") {
        msg.room && setMpRoom(msg.room);
        nt(false);
      } else if (msg.type === "MATCH_OVER") {
        msg.room && setMpRoom(msg.room);
        nt(false);
        setMpMenuOpen(false);
        setMpMatchResult(msg);
        m(msg.victory ? "VICTORY" : "GAME_OVER");
      }
    });
    return () => {
      unsub();
    };
  }, [G]), (0, ie.useEffect)(() => {
    a.current && (a.current.currentLang = c, a.current.gameSettings.soundEnabled = Ft, a.current.gameSettings.volume = U, a.current.gameSettings.screenShake = ne, a.current.gameSettings.showDamageNumbers = Z, a.current.gameSettings.layoutMode = layoutMode, a.current.gameSettings.portraitFov = portraitFov, a.current.applyPerformanceSettings?.({ qualityMode, fpsCapMode })), R.setSfxEnabled(Ft), R.setSfxVolume(U), R.setMusicEnabled(musicOn), R.setMusicVolume(musicVol);
    saveDeviceSettings({
      lang: c,
      sfxEnabled: Ft,
      sfxVolume: U,
      musicOn,
      musicVol,
      screenShake: ne,
      showDamageNumbers: Z,
      layoutMode,
      portraitFov,
      qualityMode,
      fpsCapMode,
    });
  }, [c, Ft, U, musicOn, musicVol, ne, Z, layoutMode, portraitFov, qualityMode, fpsCapMode]), (0, ie.useEffect)(() => {
    if (l === "MENU" || l === "HERO_SELECT") R.setMusicMode("menu");
    else if (l === "PAUSED") R.setMusicMode("paused");
    else if (l === "GAME_OVER" || l === "VICTORY") R.setMusicMode("off");
    else if (l === "PLAYING") {
      let hasBoss = !!(re.boss && re.boss.hp > 0);
      R.setMusicMode(hasBoss ? "boss" : "battle");
    }
  }, [l, re.wave, re.boss?.hp]), (0, ie.useEffect)(() => {
    let syncViewport = () => {
      let inIframe = false;
      try {
        inIframe = window.self !== window.top;
      } catch {
        inIframe = true;
      }
      let docW = document.documentElement?.clientWidth || 0;
      let docH = document.documentElement?.clientHeight || 0;
      let winW = window.innerWidth || docW;
      let winH = window.innerHeight || docH;
      let vv = !inIframe ? window.visualViewport : null;
      let w = vv && vv.width >= 100 ? Math.round(vv.width) : Math.round(winW);
      let h = vv && vv.height >= 100 ? Math.round(vv.height) : Math.round(winH);
      setViewportSize({ w: Math.max(1, w || winW || 1280), h: Math.max(1, h || winH || 720) });
      if (w >= 100) {
        document.documentElement.style.setProperty("--app-w", `${w}px`);
      } else {
        document.documentElement.style.removeProperty("--app-w");
      }
      if (h >= 100) {
        document.documentElement.style.setProperty("--app-h", `${h}px`);
      } else {
        document.documentElement.style.removeProperty("--app-h");
      }
      let fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      a.current?.resizeCanvas();
    };
    syncViewport();
    let rootObs = null;
    if (typeof ResizeObserver !== "undefined" && document.documentElement) {
      rootObs = new ResizeObserver(() => syncViewport());
      rootObs.observe(document.documentElement);
    }
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    document.addEventListener("fullscreenchange", syncViewport);
    document.addEventListener("webkitfullscreenchange", syncViewport);
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    return () => {
      rootObs?.disconnect();
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      document.removeEventListener("fullscreenchange", syncViewport);
      document.removeEventListener("webkitfullscreenchange", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
    };
  }, []);
  (0, ie.useEffect)(() => {
    if (!mpLobbyOpen || typeof window === "undefined" || !/^https?:$/i.test(window.location.protocol)) return;
    let active = true;
    const base = mpClient.getHttpBaseResult().baseUrl || "";
    fetch(`${base}/api/lan-info`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.lanUrls)) {
          setLanUrls(data.lanUrls);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mpLobbyOpen]);
  let toggleFullscreen = (0, ie.useCallback)(async () => {
    R.playClick();
    let activatePseudoFs = (nextVal) => {
      setIsPseudoFullscreen(nextVal);
      try {
        window.scrollTo(0, 1);
      } catch {
      }
      setTimeout(() => a.current?.resizeCanvas(), 60);
      if (nextVal) {
        if (envInfo.isInAppBrowser) {
          G("Đã bật chế độ Tập Trung Toàn Khung! Để ẩn thanh Zalo/Messenger trên iOS, hãy bấm ⋯ → Mở bằng Safari → Thêm vào MH chính.");
        } else if (envInfo.isIOS) {
          G("Đã bật chế độ Tập Trung iOS! Chọn Chia sẻ ⬆ → 'Thêm vào MH chính' để chơi full màn hình chuẩn 100%.");
        } else {
          G("Đã bật chế độ Toàn Khung Tập Trung!");
        }
      } else {
        G("Đã thoát chế độ Toàn Khung.");
      }
    };

    try {
      let fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (envInfo.supportsNativeFullscreen && !envInfo.isInAppBrowser) {
        if (!fsEl) {
          let root = document.documentElement;
          if (root.requestFullscreen) await root.requestFullscreen();
          else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
          let nowFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
          if (nowFs) {
            try {
              if (layoutMode === "standard") {
                await screen.orientation?.lock?.("landscape");
              }
            } catch {
            }
            setIsPseudoFullscreen(false);
            return;
          }
        } else {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
          setIsPseudoFullscreen(false);
          return;
        }
      }
      activatePseudoFs(!isPseudoFullscreen);
    } catch {
      activatePseudoFs(!isPseudoFullscreen);
    }
  }, [G, envInfo, isPseudoFullscreen, layoutMode]);

  (0, ie.useEffect)(() => {
    document.body.classList.toggle("ios-focus-mode", isPseudoFullscreen);
    return () => document.body.classList.remove("ios-focus-mode");
  }, [isPseudoFullscreen]);

  (0, ie.useEffect)(() => {
    if (mpBusyTimerRef.current) {
      clearTimeout(mpBusyTimerRef.current);
      mpBusyTimerRef.current = null;
    }
    if (mpBusy) {
      mpBusyTimerRef.current = setTimeout(() => {
        setMpBusy(false);
        setMpError((prev) => prev || "Hết thời gian chờ phản hồi từ máy chủ Co-op (16s). Bấm 'Thử Kết Nối Lại' để tạo/vào phòng.");
      }, 16000);
    }
    return () => {
      if (mpBusyTimerRef.current) {
        clearTimeout(mpBusyTimerRef.current);
        mpBusyTimerRef.current = null;
      }
    };
  }, [mpBusy]);

  let handleVerifyFounderPin = async (e) => {
    e?.preventDefault?.();
    const pin = founderPinInput.replace(/\D/g, "").trim();
    if (!pin) {
      R.playError();
      setFounderAuthError("Vui lòng nhập mật khẩu 8 số của Nhà Sáng Lập.");
      return;
    }
    const { canFetch: hasHttpBackend, base } = resolveFounderApiBase();
    if (!hasHttpBackend) {
      R.playError();
      const env = detectStorageEnvironment();
      setFounderAuthError(
        env.isStaticHost
          ? "Bản Web tĩnh / HTML cục bộ không chạy backend PIN. Hãy dùng Google Nhà Sáng Lập hoặc gắn máy chủ Co-op."
          : "Xác thực mật khẩu yêu cầu kết nối máy chủ backend hoặc đăng nhập Google Nhà Sáng Lập."
      );
      return;
    }
    setFounderAuthBusy(true);
    setFounderAuthError("");
    try {
      const res = await fetch(`${base}/api/founder/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.unlocked) {
        R.playError();
        setFounderAuthError(data?.message || data?.error || "Mật khẩu Nhà Sáng Lập không chính xác.");
        return;
      }
      const token = data?.founderToken || data?.token || "";
      applyFounderUnlockState(true, token, data.source || "pin");
      setFounderPinInput("");
      setFounderModalOpen(false);
      R.playHeroLockIn();
      R.playThienAscend();
      syncFounderUnlockToFirestore("backend_pin").catch(() => {});
      G("Xác thực thành công! Đã mở khóa THIÊN – ĐẤNG SÁNG THẾ.");
      const pending = founderPendingActionRef.current;
      founderPendingActionRef.current = null;
      pending?.();
    } catch {
      R.playError();
      setFounderAuthError("Không thể kết nối máy chủ xác thực Founder. Hãy thử lại hoặc dùng Google Nhà Sáng Lập.");
    } finally {
      setFounderAuthBusy(false);
    }
  }, handleVerifyFounderGoogle = async () => {
    setFounderAuthBusy(true);
    setFounderAuthError("");
    setFounderAuthDetails(null);
    try {
      const authRes = await signInFounderWithGoogle();
      if (!authRes?.isFounder) {
        await signOutFounderAuth().catch(() => {});
        R.playError();
        setFounderAuthError(`Chỉ tài khoản Nhà Sáng Lập (${FOUNDER_EMAIL}) mới có quyền mở khóa Thiên.`);
        return;
      }
      const { canFetch: hasHttpBackend, base } = resolveFounderApiBase();
      let token = "";
      if (hasHttpBackend) {
        const res = await fetch(`${base}/api/founder/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ firebaseIdToken: authRes.idToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.unlocked) {
          R.playError();
          setFounderAuthError(data?.message || data?.error || "Backend từ chối xác thực tài khoản Founder.");
          return;
        }
        token = data?.founderToken || data?.token || "";
      }
      await syncFounderUnlockToFirestore("firebase_google").catch(() => {});
      applyFounderUnlockState(true, token, "firebase");
      setFounderPinInput("");
      setFounderModalOpen(false);
      R.playHeroLockIn();
      R.playThienAscend();
      G("Đã xác thực Nhà Sáng Lập qua Google & Firebase!");
      const pending = founderPendingActionRef.current;
      founderPendingActionRef.current = null;
      pending?.();
    } catch (err) {
      R.playError();
      setFounderAuthError(err?.message || "Đăng nhập Google Nhà Sáng Lập thất bại hoặc đã bị hủy.");
      setFounderAuthDetails(err?.details || null);
    } finally {
      setFounderAuthBusy(false);
    }
  }, handleLogoutFounder = async () => {
    R.playClick();
    setFounderAuthBusy(true);
    try {
      const { canFetch: hasHttpBackend, base } = resolveFounderApiBase();
      const activeToken = founderToken || mpClient.founderToken || "";
      if (hasHttpBackend) {
        await fetch(`${base}/api/founder/logout`, {
          method: "POST",
          credentials: "include",
          headers: activeToken ? { "x-founder-token": activeToken } : {},
        }).catch(() => {});
      }
      await signOutFounderAuth().catch(() => {});
      applyFounderUnlockState(false, "", "");
      setFounderPinInput("");
      setFounderModalOpen(false);
      if (selectedHeroRef.current?.isSecretFounder) {
        const fallbackHero = Mi[4];
        h(fallbackHero);
        if (a.current) {
          a.current.currentHero = fallbackHero;
          a.current.selectedHeroId = fallbackHero.id;
          a.current.saveGame();
        }
      }
      G("Đã khóa lại tướng bí mật THIÊN.");
    } finally {
      setFounderAuthBusy(false);
    }
  }, handleMpNameChange = (val) => {
    setMpName(val);
    try {
      writeDeviceKey(MP_PLAYER_NAME_STORAGE_KEY, val);
    } catch {
    }
  };
  let buildProgressSnapshot = (0, ie.useCallback)((profileOverride) => {
    const w = a.current;
    const prof = profileOverride || playerProfileRef.current || loadLocalPlayerProfile();
    const highestWave = Math.max(
      0,
      Math.min(27, Math.floor(Math.max(w?.highestWaveCleared || 0, prof.highestWave || 0)))
    );
    const rawHeroId = w?.selectedHeroId || selectedHeroRef.current?.id || "eohyen";
    const selectedHeroId = rawHeroId === "thien" && !founderUnlockedRef.current ? "eohyen" : rawHeroId;
    return {
      coins: Math.max(0, Math.floor(Number(w?.playerCoins ?? 100) || 0)),
      currentWave: Math.max(1, Math.min(27, Math.floor(Number(w?.currentWaveNumber || w?.wave) || 1))),
      highestWave,
      selectedHeroId,
      inventoryItemIds: (w?.inventory || [])
        .map((it) => it?.itemId)
        .filter((id) => typeof id === "string" && Boolean(Si[id]))
        .slice(0, 250),
      heroGearEntries: serializeHeroGearEntries(w?.heroGear),
      lifetimeKills: Math.max(0, Math.floor(Number(prof.lifetimeKills) || 0)),
      matchesPlayed: Math.max(0, Math.floor(Number(prof.matchesPlayed) || 0)),
      victories: Math.max(0, Math.floor(Number(prof.victories) || 0)),
      dailyCheckInDate: String(prof.dailyCheckInDate || ""),
      unlockedTitles: computeUnlockedTitles(highestWave, founderUnlockedRef.current),
      heroStatsEntries: serializeHeroStatsEntries(prof.heroStats),
      selectedMapId: w?.selectedMapId || "classic",
      classicCleared: Boolean(w?.classicCleared),
      bloodCitadelCleared: Boolean(w?.bloodCitadelCleared),
      infernoCleared: Boolean(w?.infernoCleared),
      frozenTombCleared: Boolean(w?.frozenTombCleared),
      grudgeForestCleared: Boolean(w?.grudgeForestCleared),
      unlockedMaps: computeUnlockedMaps({
        classicCleared: Boolean(w?.classicCleared),
        bloodCitadelCleared: Boolean(w?.bloodCitadelCleared),
        infernoCleared: Boolean(w?.infernoCleared),
        frozenTombCleared: Boolean(w?.frozenTombCleared),
        grudgeForestCleared: Boolean(w?.grudgeForestCleared),
        highestWaveCleared: highestWave,
        storedUnlocked: w?.unlockedMaps,
        founderUnlocked: founderUnlockedRef.current,
      }),
      citadelSecrets: normalizeCitadelSecrets(w?.citadelSecrets),
      infernoProgress: normalizeInfernoProgress(w?.infernoProgress),
      frozenTombProgress: normalizeFrozenTombProgress(w?.frozenTombProgress),
      grudgeForestProgress: normalizeGrudgeForestProgress(w?.grudgeForestProgress),
    };
  }, []);
  let applyProgressSnapshotToEngine = (0, ie.useCallback)((snapshot) => {
    const w = a.current;
    if (!w || !snapshot) return;
    const validIds = new Set(Object.keys(Si));
    let nextUid = Math.max(w.nextUid || 1, 1);
    const restoredInv = [];
    for (const itemId of snapshot.inventoryItemIds || []) {
      if (validIds.has(itemId)) {
        restoredInv.push({ uid: nextUid++, itemId });
      }
    }
    const gearRes = deserializeHeroGearEntries(snapshot.heroGearEntries || [], um, nextUid, validIds);
    w.nextUid = gearRes.nextUid;
    w.heroGear = gearRes.heroGear;
    w.inventory = restoredInv;
    w.playerCoins = Math.max(0, Math.floor(Number(snapshot.coins) || 0));
    w.currentWaveNumber = Math.max(1, Math.min(27, Math.floor(Number(snapshot.currentWave) || 1)));
    w.highestWaveCleared = Math.max(w.highestWaveCleared || 0, Number(snapshot.highestWave) || 0);
    w.classicCleared = Boolean(w.classicCleared || snapshot.classicCleared);
    w.bloodCitadelCleared = Boolean(w.bloodCitadelCleared || snapshot.bloodCitadelCleared);
    w.infernoCleared = Boolean(w.infernoCleared || snapshot.infernoCleared);
    w.frozenTombCleared = Boolean(w.frozenTombCleared || snapshot.frozenTombCleared);
    w.grudgeForestCleared = Boolean(w.grudgeForestCleared || snapshot.grudgeForestCleared);
    w.unlockedMaps = computeUnlockedMaps({
      classicCleared: w.classicCleared,
      bloodCitadelCleared: w.bloodCitadelCleared,
      infernoCleared: w.infernoCleared,
      frozenTombCleared: w.frozenTombCleared,
      grudgeForestCleared: w.grudgeForestCleared,
      highestWaveCleared: w.highestWaveCleared,
      storedUnlocked: [...(w.unlockedMaps || []), ...(snapshot.unlockedMaps || [])],
      founderUnlocked: founderUnlockedRef.current,
    });
    w.citadelSecrets = normalizeCitadelSecrets({
      ...w.citadelSecrets,
      ...(snapshot.citadelSecrets || {}),
    });
    w.infernoProgress = mergeInfernoProgress(w.infernoProgress, snapshot.infernoProgress);
    w.frozenTombProgress = mergeFrozenTombProgress(w.frozenTombProgress, snapshot.frozenTombProgress);
    w.grudgeForestProgress = mergeGrudgeForestProgress(w.grudgeForestProgress, snapshot.grudgeForestProgress);
    const reqMap = normalizeArenaMapId(snapshot.selectedMapId || w.selectedMapId);
    w.selectedMapId = isMapUnlocked(reqMap, w.unlockedMaps, founderUnlockedRef.current) ? reqMap : "classic";
    let candidate = Mi.find((hr) => hr.id === snapshot.selectedHeroId) || Mi[4];
    if (candidate?.isSecretFounder && !founderUnlockedRef.current) {
      candidate = Mi[4];
    }
    w.currentHero = candidate;
    w.selectedHeroId = candidate.id;
    h(candidate);
    w.saveGame();
    w.computeHeroStats();
    setSelectedMapId(w.selectedMapId);
    setUnlockedMaps([...w.unlockedMaps]);
    setCitadelSecrets(normalizeCitadelSecrets(w.citadelSecrets));
    setInfernoProgress(normalizeInfernoProgress(w.infernoProgress));
    setFrozenTombProgress(normalizeFrozenTombProgress(w.frozenTombProgress));
    setGrudgeForestProgress(normalizeGrudgeForestProgress(w.grudgeForestProgress));
    v(w.playerCoins);
    bt((n) => n + 1);
  }, []);
  let syncCloudProgress = (0, ie.useCallback)(
    async (userObj, profileOverride, snapshotOverride, notifyOnError = false) => {
      const targetUser = userObj || googleUserRef.current;
      const baseProfile = profileOverride || playerProfileRef.current;
      if (!targetUser?.uid || !baseProfile) return null;
      const snapshot = snapshotOverride || buildProgressSnapshot(baseProfile);
      try {
        await savePrivatePlayerSave(targetUser.uid, snapshot, founderUnlockedRef.current);
        const pub = await upsertPublicPlayerProfile(
          targetUser.uid,
          {
            ...baseProfile,
            uid: targetUser.uid,
            highestWave: snapshot.highestWave,
            lifetimeKills: snapshot.lifetimeKills,
            victories: snapshot.victories,
            unlockedTitles: snapshot.unlockedTitles,
          },
          founderUnlockedRef.current
        );
        const stamped = saveLocalPlayerProfile(
          {
            ...baseProfile,
            uid: targetUser.uid,
            friendCode: pub?.friendCode || baseProfile.friendCode,
            highestWave: snapshot.highestWave,
            lifetimeKills: snapshot.lifetimeKills,
            matchesPlayed: snapshot.matchesPlayed,
            victories: snapshot.victories,
            dailyCheckInDate: snapshot.dailyCheckInDate,
            unlockedTitles: snapshot.unlockedTitles,
            accountSource: "google",
            googlePhotoUrl: sanitizeGooglePhotoUrl(targetUser.photoURL) || baseProfile.googlePhotoUrl,
            lastSyncedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          },
          { founderUnlocked: founderUnlockedRef.current, minHighestWave: snapshot.highestWave }
        );
        setPlayerProfile(stamped);
        return stamped;
      } catch (err) {
        if (notifyOnError) {
          G("Không thể đồng bộ lên Cloud lúc này — tiến trình vẫn đã được lưu an toàn trên trình duyệt!");
        }
        console.warn("Cloud sync error:", err);
        return null;
      }
    },
    [G, buildProgressSnapshot]
  );
  let pullAndMergeCloudSave = (0, ie.useCallback)(
    async (userObj, explicitAction = false) => {
      if (!userObj?.uid) return;
      if (cloudPullInFlightRef.current && cloudPullInFlightRef.current.uid === userObj.uid) {
        try {
          await cloudPullInFlightRef.current.promise;
          if (explicitAction) {
            R.playHeroLockIn();
            G("Đã kết nối Google & đồng bộ tiến trình thành công!");
          }
        } catch {
          if (explicitAction) {
            R.playError();
            G("Đã đăng nhập Google! Dữ liệu trình duyệt vẫn được giữ nguyên.");
          }
        }
        return;
      }
      setAccountAuthError("");
      setAccountSyncBusy(true);
      const run = (async () => {
        try {
        const [privRes, pubRes] = await Promise.allSettled([
          fetchPrivatePlayerSave(userObj.uid),
          fetchOwnPublicProfile(userObj.uid),
        ]);
        const cloudPrivate = privRes.status === "fulfilled" ? privRes.value : null;
        const cloudPublic = pubRes.status === "fulfilled" ? pubRes.value : null;
        const localProf = playerProfileRef.current || loadLocalPlayerProfile();
        const localSnapshot = buildProgressSnapshot(localProf);
        const merged = mergeLocalAndCloudProgress(localSnapshot, cloudPrivate, founderUnlockedRef.current);
        applyProgressSnapshotToEngine(merged);

        const googlePhoto = sanitizeGooglePhotoUrl(userObj.photoURL);
        const currentDefaultName = localProf.displayName === "Chiến Binh" || !localProf.displayName;
        const resolvedName = cloudPublic?.displayName
          ? cloudPublic.displayName
          : currentDefaultName && userObj.displayName
          ? normalizeDisplayName(userObj.displayName, "Chiến Binh")
          : localProf.displayName;

        const mergedHeroStats = mergeHeroStatsMaps(
          localProf.heroStats,
          deserializeHeroStatsEntries(merged.heroStatsEntries)
        );
        const mergedProf = saveLocalPlayerProfile(
          {
            ...localProf,
            uid: userObj.uid,
            friendCode: cloudPublic?.friendCode || localProf.friendCode,
            displayName: resolvedName,
            bio: cloudPublic?.bio ?? localProf.bio,
            avatarType: cloudPublic?.avatarType || localProf.avatarType,
            avatarValue: cloudPublic?.avatarValue || localProf.avatarValue,
            avatarFrame: cloudPublic?.avatarFrame || localProf.avatarFrame,
            titleBadge: cloudPublic?.titleBadge || localProf.titleBadge,
            favoriteHeroId: cloudPublic?.favoriteHeroId || localProf.favoriteHeroId,
            isPublic: cloudPublic ? cloudPublic.isPublic !== false : localProf.isPublic,
            highestWave: merged.highestWave,
            lifetimeKills: merged.lifetimeKills,
            matchesPlayed: merged.matchesPlayed,
            victories: merged.victories,
            dailyCheckInDate: merged.dailyCheckInDate,
            unlockedTitles: merged.unlockedTitles,
            heroStats: mergedHeroStats,
            accountSource: "google",
            googlePhotoUrl: googlePhoto || localProf.googlePhotoUrl,
          },
          { founderUnlocked: founderUnlockedRef.current, minHighestWave: merged.highestWave }
        );
        setPlayerProfile(mergedProf);
        handleMpNameChange(mergedProf.displayName);
        await syncCloudProgress(userObj, mergedProf, merged, explicitAction);
        if (explicitAction) {
          R.playHeroLockIn();
          G("Đã kết nối Google & đồng bộ tiến trình thành công!");
        }
        } catch (err) {
          console.warn("Pull/merge cloud error:", err);
          if (explicitAction) {
            R.playError();
            G("Đã đăng nhập Google! Dữ liệu trình duyệt vẫn được giữ nguyên.");
          }
        } finally {
          if (cloudPullInFlightRef.current?.uid === userObj.uid) {
            cloudPullInFlightRef.current = null;
          }
          setAccountSyncBusy(false);
        }
      })();
      cloudPullInFlightRef.current = { uid: userObj.uid, promise: run };
      await run;
    },
    [G, applyProgressSnapshotToEngine, buildProgressSnapshot, syncCloudProgress]
  );
  (0, ie.useEffect)(() => {
    const unsub = subscribeToAuthChanges((fbUser) => {
      setGoogleUser(fbUser || null);
      if (fbUser) {
        setAccountAuthError("");
        setAccountAuthDetails(null);
      }
      if (fbUser?.uid && syncedBootUidRef.current !== fbUser.uid) {
        syncedBootUidRef.current = fbUser.uid;
        void pullAndMergeCloudSave(fbUser, false);
      } else if (!fbUser) {
        syncedBootUidRef.current = null;
      }
    });
    return () => unsub();
  }, [pullAndMergeCloudSave]);
  let handleOpenAccountModal = (0, ie.useCallback)((tab = "profile") => {
    if (googleUserRef.current) {
      setAccountAuthError("");
      setAccountAuthDetails(null);
    }
    setAccountModalTab(tab || "profile");
    setAccountModalOpen(true);
  }, []);
  let handleSaveProfile = async (draft) => {
    setAccountSyncBusy(true);
    try {
      const curSnapshot = buildProgressSnapshot(playerProfileRef.current);
      const saved = saveLocalPlayerProfile(
        {
          ...playerProfileRef.current,
          ...draft,
          uid: googleUserRef.current?.uid || playerProfileRef.current?.uid || null,
          highestWave: curSnapshot.highestWave,
          accountSource: googleUserRef.current ? "google" : "local",
        },
        { founderUnlocked: founderUnlockedRef.current, minHighestWave: curSnapshot.highestWave }
      );
      setPlayerProfile(saved);
      handleMpNameChange(saved.displayName);
      if (googleUserRef.current?.uid) {
        await syncCloudProgress(googleUserRef.current, saved, curSnapshot, true);
        G("Đã lưu hồ sơ & đồng bộ lên Google Cloud!");
      } else {
        G("Đã lưu hồ sơ & avatar trên trình duyệt!");
      }
    } finally {
      setAccountSyncBusy(false);
    }
  };
  let handleClaimDailyCheckIn = async () => {
    const curProf = playerProfileRef.current || loadLocalPlayerProfile();
    const today = getTodayDateKey();
    if (!canClaimDailyCheckIn(curProf.dailyCheckInDate, today)) {
      R.playError();
      G("Bạn đã điểm danh hôm nay rồi. Hẹn gặp lại ngày mai!");
      return;
    }
    const w = a.current;
    if (w) {
      w.playerCoins = (w.playerCoins || 0) + DAILY_CHECKIN_REWARD;
      w.saveGame();
      v(w.playerCoins);
    }
    const saved = saveLocalPlayerProfile(
      { ...curProf, dailyCheckInDate: today },
      { founderUnlocked: founderUnlockedRef.current, minHighestWave: w?.highestWaveCleared || curProf.highestWave }
    );
    setPlayerProfile(saved);
    R.playCoinPickup();
    G(`Điểm danh thành công! Nhận +${DAILY_CHECKIN_REWARD} Xu thưởng!`);
    if (googleUserRef.current?.uid) {
      await syncCloudProgress(googleUserRef.current, saved, null, false);
    }
  };
  let handlePlayerGoogleSignIn = async () => {
    if (accountSyncBusy) return;
    setAccountAuthError("");
    setAccountAuthDetails(null);
    setAccountSyncBusy(true);
    try {
      const authRes = await signInPlayerWithGoogle();
      setGoogleUser(authRes.user);
      if (authRes.isFounder) {
        const { canFetch: hasHttpBackend, base } = resolveFounderApiBase();
        if (hasHttpBackend) {
          fetch(`${base}/api/founder/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ firebaseIdToken: authRes.idToken }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.unlocked) {
                const token = data.founderToken || data.token || "";
                applyFounderUnlockState(true, token, "firebase");
              }
            })
            .catch(() => {});
        }
      }
      syncedBootUidRef.current = authRes.user.uid;
      await pullAndMergeCloudSave(authRes.user, true);
    } catch (err) {
      R.playError();
      const errMsg = err?.message || "Đăng nhập Google đã bị hủy hoặc chưa hoàn tất.";
      setAccountAuthError(errMsg);
      setAccountAuthDetails(err?.details || null);
      G(errMsg, 5000);
    } finally {
      setAccountSyncBusy(false);
    }
  };
  let handlePlayerGoogleSignOut = async () => {
    setAccountSyncBusy(true);
    try {
      await signOutPlayer().catch(() => {});
      setGoogleUser(null);
      syncedBootUidRef.current = null;
      if (founderAuthSource === "firebase") {
        const { canFetch: hasHttpBackend, base } = resolveFounderApiBase();
        const activeToken = founderToken || mpClient.founderToken || "";
        if (hasHttpBackend) {
          await fetch(`${base}/api/founder/logout`, {
            method: "POST",
            credentials: "include",
            headers: activeToken ? { "x-founder-token": activeToken } : {},
          }).catch(() => {});
        }
        applyFounderUnlockState(false, "", "");
        if (selectedHeroRef.current?.isSecretFounder) {
          const fallbackHero = Mi[4];
          h(fallbackHero);
          if (a.current) {
            a.current.currentHero = fallbackHero;
            a.current.selectedHeroId = fallbackHero.id;
            a.current.saveGame();
          }
        }
      }
      const downgraded = saveLocalPlayerProfile(
        {
          ...playerProfileRef.current,
          uid: null,
          accountSource: "local",
          avatarType: playerProfileRef.current?.avatarType === "google" ? "hero" : playerProfileRef.current?.avatarType,
          avatarValue:
            playerProfileRef.current?.avatarType === "google"
              ? playerProfileRef.current?.favoriteHeroId || "eohyen"
              : playerProfileRef.current?.avatarValue,
        },
        { founderUnlocked: founderUnlockedRef.current }
      );
      setPlayerProfile(downgraded);
      G("Đã đăng xuất Google. Tiến trình chơi trên trình duyệt vẫn được giữ nguyên.");
    } finally {
      setAccountSyncBusy(false);
    }
  };
  let handlePushCloudSave = async () => {
    if (!googleUserRef.current?.uid) return;
    setAccountSyncBusy(true);
    try {
      const res = await syncCloudProgress(googleUserRef.current, playerProfileRef.current, null, true);
      if (res) {
        R.playHeroLockIn();
        G("Đã sao lưu toàn bộ tiến trình lên Google Cloud!");
      }
    } finally {
      setAccountSyncBusy(false);
    }
  };
  let handlePullCloudSave = async () => {
    if (!googleUserRef.current?.uid) return;
    await pullAndMergeCloudSave(googleUserRef.current, true);
  };
  let handleExportSaveJson = () => {
    const snapshot = buildProgressSnapshot(playerProfileRef.current);
    const curDev = loadDeviceRecord();
    const payload = {
      version: "11.8",
      deviceId: curDev.deviceId,
      exportedAt: new Date().toISOString(),
      profile: playerProfileRef.current,
      progress: snapshot,
      savedRun: a.current?.getSavedRunSnapshot?.() || null,
      settings: {
        lang: c,
        sfxEnabled: Ft,
        sfxVolume: U,
        musicOn,
        musicVol,
        screenShake: ne,
        showDamageNumbers: Z,
        layoutMode,
        portraitFov,
        qualityMode,
        fpsCapMode,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `arena_hero_save_${getTodayDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    G("Đã tải xuống file sao lưu tiến trình (.json)!");
  };
  let handleGenerateTransferCode = () => {
    const snapshot = buildProgressSnapshot(playerProfileRef.current);
    const curDev = loadDeviceRecord();
    return encodeDeviceTransferCode({
      version: "11.8",
      deviceId: curDev.deviceId,
      exportedAt: new Date().toISOString(),
      profile: playerProfileRef.current,
      progress: snapshot,
      savedRun: a.current?.getSavedRunSnapshot?.() || null,
      settings: {
        lang: c,
        sfxEnabled: Ft,
        sfxVolume: U,
        musicOn,
        musicVol,
        screenShake: ne,
        showDamageNumbers: Z,
        layoutMode,
        portraitFov,
        qualityMode,
        fpsCapMode,
      },
    });
  };
  let handleImportSaveJson = async (rawText) => {
    const decoded = decodeDeviceTransferCode(rawText);
    if (!decoded.ok) {
      R.playError();
      G(decoded.error);
      return;
    }
    const parsed = parseSavePackageJson(decoded.jsonText, founderUnlockedRef.current);
    if (!parsed.ok) {
      R.playError();
      G(parsed.error);
      return;
    }
    const mergedProgress = mergeLocalAndCloudProgress(
      buildProgressSnapshot(playerProfileRef.current),
      parsed.progress,
      founderUnlockedRef.current
    );
    applyProgressSnapshotToEngine(mergedProgress);
    if (parsed.savedRun && a.current) {
      a.current.savedRun = parsed.savedRun;
      a.current.saveGame();
      setResumableRun(a.current.getSavedRunSnapshot?.() || null);
    }
    if (parsed.settings) {
      const ds = saveDeviceSettings(parsed.settings);
      g(ds.lang);
      Nt(ds.sfxEnabled);
      pe(ds.sfxVolume);
      setMusicOn(ds.musicOn);
      setMusicVol(ds.musicVol);
      _e(ds.screenShake);
      tt(ds.showDamageNumbers);
      setLayoutMode(ds.layoutMode);
      setPortraitFov(ds.portraitFov);
      setQualityMode(ds.qualityMode);
      setFpsCapMode(ds.fpsCapMode);
    }
    const nextProf = saveLocalPlayerProfile(
      {
        ...playerProfileRef.current,
        ...parsed.profile,
        uid: googleUserRef.current?.uid || playerProfileRef.current?.uid || null,
        highestWave: mergedProgress.highestWave,
        lifetimeKills: mergedProgress.lifetimeKills,
        matchesPlayed: mergedProgress.matchesPlayed,
        victories: mergedProgress.victories,
        dailyCheckInDate: mergedProgress.dailyCheckInDate,
        unlockedTitles: mergedProgress.unlockedTitles,
        heroStats: mergeHeroStatsMaps(playerProfileRef.current?.heroStats, parsed.profile?.heroStats),
        accountSource: googleUserRef.current ? "google" : "local",
      },
      { founderUnlocked: founderUnlockedRef.current, minHighestWave: mergedProgress.highestWave }
    );
    setPlayerProfile(nextProf);
    handleMpNameChange(nextProf.displayName);
    setDeviceInfo(loadDeviceRecord());
    R.playHeroLockIn();
    G(parsed.savedRun ? `Đã khôi phục toàn bộ tiến trình & màn đang chơi (Màn ${parsed.savedRun.wave})!` : "Đã khôi phục tiến trình thành công!");
    if (googleUserRef.current?.uid) {
      await syncCloudProgress(googleUserRef.current, nextProf, mergedProgress, false);
    }
  };
  let handleOpenCoopWithFriend = (friend) => {
    setAccountModalOpen(false);
    setMpError("");
    setMpLobbyOpen(true);
    if (friend?.displayName) {
      G(`Tạo phòng Co-op 6 số và gửi mã mời cho ${friend.displayName} (${friend.friendCode || ""})!`);
    }
  };
  let handleCreateRoom = () => {
    const safeHeroId = p.isSecretFounder && !founderUnlockedRef.current ? Mi[4].id : p.id;
    const safeMapId = isMapUnlocked(selectedMapId, unlockedMaps, founderUnlockedRef.current) ? selectedMapId : "classic";
    R.playClick();
    setMpError("");
    setP2pAnswerCode("");
    setP2pAutoPaired(false);
    setMpBusy(true);
    mpClient.createRoom(mpName.trim() || "Chi\u1EBFn Binh 1", safeHeroId, safeMapId).then((res) => {
      setMpBusy(false);
      if (res?.mode === "p2p") {
        setP2pInviteCode(res.inviteCode || res.room?.roomId || "");
        setP2pManualOfferCode(res.manualOfferCode || "");
        setP2pHasServerSignal(Boolean(res.hasServerSignaling));
        setP2pIncomingAnswer("");
        if (res.inviteError) {
          G(`\u0110\xE3 t\u1EA1o ph\xF2ng P2P! (${res.inviteError})`);
        } else {
          G(`\u0110\xE3 t\u1EA1o ph\xF2ng P2P m\xE3 ${res.inviteCode || res.room?.roomId}! G\u1EEDi m\xE3 6 s\u1ED1 cho b\u1EA1n b\xE8.`);
        }
      }
    }).catch((err) => {
      setMpBusy(false);
      R.playError();
      setMpError(err?.message || "Kh\xF4ng th\u1EC3 t\u1EA1o ph\xF2ng.");
    });
  }, handleJoinRoom = () => {
    const safeHeroId = p.isSecretFounder && !founderUnlockedRef.current ? Mi[4].id : p.id;
    let classified = classifyJoinCode(mpJoinCode);
    if (classified.kind === "empty") {
      R.playError();
      setMpError("Vui l\xF2ng nh\u1EADp m\xE3 ph\xF2ng 6 s\u1ED1 ho\u1EB7c m\xE3 th\u1EE7 c\u00F4ng (AH1...).");
      return;
    }
    R.playClick();
    setMpError("");
    if (classified.kind === "p2p_signal") {
      setP2pAnswerCode("");
      setP2pAutoPaired(false);
      setP2pBusy(true);
      mpClient.joinP2PWithOffer(classified.normalized, mpName.trim() || "Chi\u1EBFn Binh", safeHeroId).then((res) => {
        setP2pBusy(false);
        setP2pIncomingOffer(classified.normalized);
        setP2pAnswerCode(res?.answerCode || "");
        const autoPaired = Boolean(res?.autoPairedViaServer || res?.autoPairedViaLocal || res?.autoPairedViaMqtt);
        setP2pAutoPaired(autoPaired);
        G(autoPaired ? "\u0110ang t\u1EF1 \u0111\u1ED9ng gh\xE9p \u0111\xF4i v\xE0o ph\xF2ng..." : "\u0110\xE3 t\u1EA1o M\xE3 Ph\u1EA3n H\u1ED3i! H\xE3y sao ch\xE9p g\u1EEDi l\u1EA1i cho Ch\u1EE7 ph\xF2ng.");
      }).catch((err) => {
        setP2pBusy(false);
        R.playError();
        setMpError(err?.message || "Kh\xF4ng th\u1EC3 x\u1EED l\xFD M\xE3 M\u1EDDi P2P.");
      });
      return;
    }
    setMpBusy(true);
    mpClient.joinRoom(classified.normalized, mpName.trim() || "Chi\u1EBFn Binh", safeHeroId).then((res) => {
      setMpBusy(false);
      if (res?.mode === "p2p") {
        setP2pIncomingOffer(classified.normalized);
        setP2pAnswerCode(res.answerCode || "");
        const autoPaired = Boolean(res?.autoPairedViaServer || res?.autoPairedViaLocal || res?.autoPairedViaMqtt);
        setP2pAutoPaired(autoPaired);
        G(autoPaired ? "\u0110ang t\u1EF1 \u0111\u1ED9ng gh\xE9p \u0111\xF4i v\xE0o ph\xF2ng 6 s\u1ED1..." : "\u0110\xE3 t\u1EA1o M\xE3 Ph\u1EA3n H\u1ED3i! H\xE3y g\u1EEDi l\u1EA1i cho Ch\u1EE7 ph\xF2ng.");
      }
    }).catch((err) => {
      setMpBusy(false);
      R.playError();
      setMpError(err?.message || "Kh\xF4ng th\u1EC3 tham gia ph\xF2ng.");
    });
  }, handleRetryMpConnect = () => {
    R.playClick();
    setMpError("");
    setMpBusy(true);
    mpClient.reconnect().then(() => {
      setMpBusy(false);
      G("Đã kết nối lại máy chủ Co-op thành công!");
    }).catch((err) => {
      setMpBusy(false);
      R.playError();
      setMpError(err?.message || "Không thể kết nối lại máy chủ Co-op.");
    });
  }, handleCopyText = (textToCopy, toastLabel) => {
    if (!textToCopy) return;
    R.playCopy();
    const done = () => G(toastLabel || "Đã sao chép!");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(done).catch(() => {
        try {
          const ta = document.createElement("textarea");
          ta.value = textToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          done();
        } catch {
        }
      });
    } else {
      try {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch {
      }
    }
  }, handleStartP2PHost = async () => {
    const safeHeroId = p.isSecretFounder && !founderUnlockedRef.current ? Mi[4].id : p.id;
    const safeMapId = isMapUnlocked(selectedMapId, unlockedMaps, founderUnlockedRef.current) ? selectedMapId : "classic";
    R.playClick();
    setMpError("");
    setP2pAnswerCode("");
    setP2pAutoPaired(false);
    setP2pBusy(true);
    try {
      const res = await mpClient.startP2PHost(mpName.trim() || "Chiến Binh 1", safeHeroId, safeMapId);
      setP2pInviteCode(res.inviteCode || res.room?.roomId || "");
      setP2pManualOfferCode(res.manualOfferCode || "");
      setP2pHasServerSignal(Boolean(res.hasServerSignaling));
      setP2pIncomingAnswer("");
      G(`Đã mở phòng P2P mã ${res.inviteCode || res.room?.roomId}! Chia sẻ mã 6 số cho bạn bè.`);
    } catch (err) {
      R.playError();
      setMpError(err?.message || "Không thể khởi tạo phòng P2P.");
    } finally {
      setP2pBusy(false);
    }
  }, handleCreateP2PInvite = async () => {
    R.playClick();
    setMpError("");
    setP2pBusy(true);
    try {
      const res = await mpClient.createP2PInviteOffer();
      setP2pInviteCode(res.code || "");
      setP2pManualOfferCode(res.rawCode || "");
      setP2pHasServerSignal(Boolean(res.hasServerSignaling));
      setP2pIncomingAnswer("");
      G("Đã làm mới phiên kết nối P2P!");
    } catch (err) {
      R.playError();
      setMpError(err?.message || "Không thể làm mới mã mời.");
    } finally {
      setP2pBusy(false);
    }
  }, handleAcceptP2PAnswer = async () => {
    R.playClick();
    setMpError("");
    setP2pBusy(true);
    try {
      await mpClient.acceptP2PAnswer(p2pIncomingAnswer);
      setP2pIncomingAnswer("");
      G("Đang ghép đôi P2P với đồng đội...");
    } catch (err) {
      R.playError();
      setMpError(err?.message || "Mã Phản Hồi không hợp lệ.");
    } finally {
      setP2pBusy(false);
    }
  }, handleJoinP2POffer = async () => {
    const safeHeroId = p.isSecretFounder && !founderUnlockedRef.current ? Mi[4].id : p.id;
    R.playClick();
    setMpError("");
    setP2pAnswerCode("");
    setP2pAutoPaired(false);
    setP2pBusy(true);
    try {
      const res = await mpClient.joinP2PWithOffer(p2pIncomingOffer, mpName.trim() || "Chiến Binh", safeHeroId);
      setP2pAnswerCode(res.answerCode || "");
      const autoPaired = Boolean(res?.autoPairedViaServer || res?.autoPairedViaLocal || res?.autoPairedViaMqtt);
      setP2pAutoPaired(autoPaired);
      G(autoPaired ? "Đang tự động ghép đôi vào phòng 6 số..." : "Đã tạo Mã Phản Hồi! Hãy sao chép gửi lại cho Chủ phòng.");
    } catch (err) {
      R.playError();
      setMpError(err?.message || "Không thể xử lý Mã Mời P2P.");
    } finally {
      setP2pBusy(false);
    }
  }, handleApplyCustomServerUrl = () => {
    R.playClick();
    mpClient.setCustomServerUrl(customServerUrl);
    handleRetryMpConnect();
  }, handleCopyRoomId = () => {
    const isP2P = Boolean(mpRoom?.isP2P);
    const codeToCopy = isP2P && isSixDigitCode(p2pInviteCode) ? p2pInviteCode : mpRoom?.roomId;
    if (!codeToCopy) return;
    let copyDone = () => {
      setMpCopied(true);
      G(`\u0110\xE3 sao ch\xE9p m\xE3 ph\xF2ng: ${codeToCopy}`);
      setTimeout(() => setMpCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(codeToCopy).then(copyDone).catch(() => {
        try {
          let ta = document.createElement("textarea");
          ta.value = codeToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          copyDone();
        } catch {
        }
      });
    } else {
      try {
        let ta = document.createElement("textarea");
        ta.value = codeToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        copyDone();
      } catch {
      }
    }
  }, handleMpSelectHero = (hero) => {
    if (hero?.isSecretFounder && !founderUnlockedRef.current) {
      requireFounderUnlock(() => handleMpSelectHero(hero));
      return;
    }
    h(hero);
    a.current && (a.current.currentHero = hero, a.current.selectedHeroId = hero.id, a.current.saveGame());
    mpClient.selectHero(hero.id);
  }, handleLeaveRoom = () => {
    mpClient.leaveRoom();
    a.current?.stopCoopMode();
    setMpRoom(null);
    setMpMatchResult(null);
    setMpMenuOpen(false);
    setP2pInviteCode("");
    setP2pManualOfferCode("");
    setP2pHasServerSignal(false);
    setP2pAnswerCode("");
    setP2pAutoPaired(false);
    setP2pIncomingOffer("");
    setP2pIncomingAnswer("");
  };
  let J = () => {
    let w = c === "vi" ? "en" : "vi";
    g(w), a.current && (a.current.currentLang = w);
  }, ae = () => {
    R.playClick(), m("HERO_SELECT");
  }, ke = (w) => {
    if (w?.isSecretFounder && !founderUnlockedRef.current) {
      requireFounderUnlock(() => ke(w));
      return;
    }
    lastTrackedMatchKillsRef.current = 0;
    lastRecordedEndKeyRef.current = "";
    R.playClick(), h(w), a.current && (a.current.startNewGame(w), m("PLAYING"), v(a.current.playerCoins), setResumableRun(a.current.getSavedRunSnapshot?.() || null));
    if (w?.isSecretFounder) logFounderAuditEvent("MATCH_STARTED", "solo").catch(() => {});
  }, handleResumeSavedRun = () => {
    const w = a.current;
    if (!w) return;
    const snap = w.getSavedRunSnapshot?.();
    if (!snap) return;
    if (snap.heroId === "thien" && !founderUnlockedRef.current) {
      requireFounderUnlock(() => handleResumeSavedRun());
      return;
    }
    lastTrackedMatchKillsRef.current = snap.totalKilled || 0;
    lastRecordedEndKeyRef.current = "";
    R.playHeroLockIn();
    R.playMatchStart();
    if (w.resumeSavedGame?.(snap)) {
      h(w.currentHero);
      v(w.playerCoins);
      setSelectedMapId(w.selectedMapId || "classic");
      setResumableRun(w.getSavedRunSnapshot?.() || null);
      m("PLAYING");
      G(c === "vi" ? `Tiếp tục Màn ${snap.wave} cùng ${w.currentHero.name.split("(")[0].trim()}!` : `Resumed Wave ${snap.wave}!`);
    }
  }, ve = (0, ie.useCallback)(() => {
    let w = a.current;
    w && (R.playClick(), w.multiplayer?.active ? setMpMenuOpen((prev) => !prev) : w.gameState === "PLAYING" ? (w.gameState = "PAUSED", w.moveInput = { x: 0, y: 0 }, w.tapDestination = null, w.aimState.active = false, m("PAUSED")) : w.gameState === "PAUSED" && (w.gameState = "PLAYING", m("PLAYING")));
  }, []), A = (0, ie.useRef)({ pointerId: null, center: { x: 0, y: 0 }, dragRadius: 42 }), O = (0, ie.useRef)(null), K = (w) => {
    let j = a.current;
    if (!j || j.gameState !== "PLAYING" || w.pointerType === "mouse" && w.button !== 0) return;
    w.preventDefault(), w.stopPropagation();
    let ee = w.currentTarget;
    try {
      ee.setPointerCapture(w.pointerId);
    } catch {
    }
    A.current.pointerId = w.pointerId;
    let he = ee.getBoundingClientRect();
    A.current.dragRadius = computeJoystickDragRadius(he.width);
    A.current.center = { x: he.left + he.width / 2, y: he.top + he.height / 2 }, j.tapDestination = null, ge(w);
  }, ge = (w) => {
    if (A.current.pointerId !== w.pointerId) return;
    let maxR = A.current.dragRadius || 42;
    let j = w.clientX - A.current.center.x, ee = w.clientY - A.current.center.y, he = Math.hypot(j, ee) || 1, le = Math.min(maxR, he), X = j / he * le, we = ee / he * le;
    O.current && (O.current.style.transform = `translate(${X}px, ${we}px)`), a.current && (a.current.moveInput = { x: X / maxR, y: we / maxR });
  }, ut = (w) => {
    if (A.current.pointerId === w.pointerId) {
      A.current.pointerId = null;
      try {
        w.currentTarget.hasPointerCapture(w.pointerId) && w.currentTarget.releasePointerCapture(w.pointerId);
      } catch {
      }
      O.current && (O.current.style.transform = "translate(0px, 0px)"), a.current && (a.current.moveInput = { x: 0, y: 0 });
    }
  }, pt = (0, ie.useRef)(null), Ye = (0, ie.useRef)(null), at = (w, j) => {
    if (!Ye.current) return false;
    let ee = Ye.current.getBoundingClientRect();
    return w >= ee.left - 25 && w <= ee.right + 25 && j >= ee.top - 20 && j <= ee.bottom + 35;
  }, Be = (w, j) => {
    let ee = a.current;
    if (!ee || !ee.canActivateSkill(w) || j.pointerType === "mouse" && j.button !== 0) return;
    j.preventDefault(), j.stopPropagation();
    let he = j.currentTarget;
    try {
      he.setPointerCapture(j.pointerId);
    } catch {
    }
    let le = he.getBoundingClientRect();
    pt.current = { idx: w, pointerId: j.pointerId, originX: le.left + le.width / 2, originY: le.top + le.height / 2 };
    let X = ee.currentHero.skills[w], we = ee.getDefaultAimForSkill(w);
    ee.aimState = { active: true, skillIdx: w, aimType: X.aimType, angle: we.angle, targetX: we.targetX, targetY: we.targetY, cancelled: false, range: X.range, radius: X.radius || 0, width: X.width || 0, hasTargetInRange: ee.checkAimHasTarget(we.angle, X.range, X.aimType, X.width || 0) }, ee.startSkillHold(w, we.angle, we.targetX, we.targetY), Ye.current && (Ye.current.style.display = "block", Ye.current.classList.remove("hover-cancel"));
  }, ta = (w) => {
    let j = a.current, ee = pt.current;
    if (!j || !ee || ee.pointerId !== w.pointerId || !j.aimState.active) return;
    let he = w.clientX - ee.originX, le = w.clientY - ee.originY, X = Math.hypot(he, le), we = at(w.clientX, w.clientY);
    Ye.current && Ye.current.classList.toggle("hover-cancel", we), j.aimState.cancelled = we;
    let rt = j.currentHero.skills[ee.idx];
    if (X >= 6) {
      let Et = Math.atan2(le, he);
      if (j.aimState.angle = Et, j.player.facing = Et, rt.aimType === "CIRCLE_FREE") {
        let ue = Math.min(1, Math.max(0.12, X / 110)), fe = rt.range * ue;
        let maxW = (j.mapWidth || 2000) - 30, maxH = (j.mapHeight || 1400) - 30;
        j.aimState.targetX = Math.max(30, Math.min(maxW, j.player.x + Math.cos(Et) * fe)), j.aimState.targetY = Math.max(30, Math.min(maxH, j.player.y + Math.sin(Et) * fe));
      } else if (rt.aimType === "PATH" || rt.aimType === "RECT") {
        let fe = rt.range || 560;
        let maxW = (j.mapWidth || 2000) - 30, maxH = (j.mapHeight || 1400) - 30;
        j.aimState.targetX = Math.max(30, Math.min(maxW, j.player.x + Math.cos(Et) * fe)), j.aimState.targetY = Math.max(30, Math.min(maxH, j.player.y + Math.sin(Et) * fe));
      } else j.aimState.targetX = j.player.x + Math.cos(Et) * (rt.range || 120), j.aimState.targetY = j.player.y + Math.sin(Et) * (rt.range || 120);
      j.updateSkillHoldAim(j.aimState.angle, j.aimState.targetX, j.aimState.targetY);
    }
  }, Ha = (w) => {
    let j = a.current, ee = pt.current;
    if (!j || !ee || ee.pointerId !== w.pointerId) return;
    let he = ee.idx, le = w.type === "pointercancel" || w.type === "lostpointercapture" || j.aimState.cancelled, X = j.aimState.angle, we = j.aimState.targetX, rt = j.aimState.targetY;
    try {
      let Et = w.currentTarget;
      Et.hasPointerCapture(w.pointerId) && Et.releasePointerCapture(w.pointerId);
    } catch {
    }
    j.aimState.active = false, j.aimState.cancelled = false, pt.current = null, Ye.current && (Ye.current.style.display = "none", Ye.current.classList.remove("hover-cancel")), j.releaseSkillHold(he, X, we, rt, le);
  }, handleCopyPlayLink = async () => {
    R.playClick();
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Arena Hero 11.8 — Đấu Trường MOBA 2D",
          text: "Vào chơi Arena Hero 11.8 cùng mình nhé! (Nếu mở trên Zalo/Messenger, hãy chọn Mở bằng Safari/Chrome)",
          url: shareUrl,
        });
        return;
      }
    } catch {
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setShareCopied(true);
      G("Đã sao chép link chơi ngay! Gửi link này qua Zalo/Messenger để mở thẳng trên Safari.");
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      G("Hãy sao chép đường dẫn trên thanh địa chỉ trình duyệt!");
    }
  }, ba = async () => {
    R.playClick();
    if (envInfo.isInAppBrowser || envInfo.isIOS) {
      setShareGuideOpen(true);
      return;
    }
    if (typeof window < "u" && !/^https?:$/i.test(window.location.protocol || "")) {
      G("Bạn đang mở bản HTML offline hoàn chỉnh!");
      return;
    }
    try {
      G("Đang chuẩn bị file HTML...");
      let ts = Date.now(), urls = [
        `./assets/arena_hero_11_8.txt?v=${ts}`,
        `/assets/arena_hero_11_8.txt?v=${ts}`,
        `./assets/arena_hero_11_8.html?v=${ts}`,
        `/assets/arena_hero_11_8.html?v=${ts}`,
        `./assets/arena_hero_5_0.txt?v=${ts}`,
        `/assets/arena_hero_5_0.txt?v=${ts}`,
        `./assets/arena_hero_5_0.html?v=${ts}`,
        `/assets/arena_hero_5_0.html?v=${ts}`
      ];
      for (let url of urls) {
        try {
          let w = await fetch(url, { cache: "no-store" });
          if (w.ok) {
            let j = await w.text();
            if (/^\s*<!doctype\s+html/i.test(j) && !/<script\b[^>]*src=["'][^"']*(@vite\/client|\/src\/main\.tsx)/i.test(j) && j.length > 1e5) {
              const liveOrigin = typeof window !== "undefined" && /^https?:$/i.test(window.location.protocol) ? window.location.origin : "";
              if (liveOrigin) {
                const isLanWiFi = /^https?:\/\/(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[a-zA-Z0-9-]+\.local)(?::\d+)?$/i.test(liveOrigin);
                const authUrls = [];
                if (/^https:\/\/ais-dev-([^.]+)\.(.+)$/i.test(liveOrigin)) {
                  authUrls.push(liveOrigin.replace(/^https:\/\/ais-dev-/i, "https://ais-pre-"));
                } else if (/^https:\/\//i.test(liveOrigin) && !isLanWiFi && !isPrivateOrDevOrigin(liveOrigin)) {
                  authUrls.push(liveOrigin);
                }
                if (authUrls.length > 0 && !j.includes("window.__ARENA_AUTH_URL__")) {
                  const authInjected = `<script>window.__ARENA_AUTH_URL__=${JSON.stringify(authUrls[0])};window.__ARENA_AUTH_URLS__=${JSON.stringify(authUrls)};<\/script>`;
                  j = /<\/head>/i.test(j) ? j.replace(/<\/head>/i, () => `${authInjected}\n</head>`) : `${authInjected}\n${j}`;
                }
                if (!isPrivateOrDevOrigin(liveOrigin) && !isStaticWebHost(window.location?.hostname || "", window.location?.protocol || "") && !j.includes("window.__ARENA_API_URL__")) {
                  const injected = `<script>window.__ARENA_API_URL__=${JSON.stringify(liveOrigin)};<\/script>`;
                  j = /<\/head>/i.test(j) ? j.replace(/<\/head>/i, () => `${injected}\n</head>`) : `${injected}\n${j}`;
                } else if (isLanWiFi && !j.includes("window.__ARENA_LAN_URL__")) {
                  const injected = `<script>window.__ARENA_LAN_URL__=${JSON.stringify(liveOrigin)};<\/script>`;
                  j = /<\/head>/i.test(j) ? j.replace(/<\/head>/i, () => `${injected}\n</head>`) : `${injected}\n${j}`;
                } else if (Array.isArray(lanUrls) && lanUrls[0] && !j.includes("window.__ARENA_LAN_URL__")) {
                  const injected = `<script>window.__ARENA_LAN_URL__=${JSON.stringify(lanUrls[0])};<\/script>`;
                  j = /<\/head>/i.test(j) ? j.replace(/<\/head>/i, () => `${injected}\n</head>`) : `${injected}\n${j}`;
                }
              }
              let ee = new Blob([j], { type: "text/html;charset=utf-8" }), he = URL.createObjectURL(ee), le = document.createElement("a");
              le.style.display = "none", le.href = he, le.download = "arena_hero_11_8.html", le.rel = "noopener", document.body.appendChild(le), le.click(), document.body.removeChild(le), setTimeout(() => URL.revokeObjectURL(he), 6e4), G("Đã tải xuống Arena Hero 11.8 HTML thành công! File hỗ trợ P2P Trực Tiếp để chơi Co-op cùng bạn bè.");
              return;
            }
          }
        } catch (innerErr) {
          console.warn("HTML fetch attempt failed:", url, innerErr);
        }
      }
    } catch (w) {
      console.error(w);
    }
    setShareGuideOpen(true);
  }, Kt = (0, ie.useRef)(null), Ci = (0, ie.useRef)(/* @__PURE__ */ new Set()), Da = (0, ie.useRef)(/* @__PURE__ */ new Map()), Xa = T || x || H || P || W || oe || De || mpLobbyOpen || mpMenuOpen || shareGuideOpen || founderModalOpen || accountModalOpen || chroniclesOpen || Boolean(citadelLoreModal) || Boolean(infernoStoryModal) || infernoJournalOpen || Boolean(frozenTombStoryModal) || frozenTombJournalOpen || Boolean(grudgeForestStoryModal) || grudgeForestJournalOpen, _i = (0, ie.useRef)(Xa);
  (0, ie.useEffect)(() => {
    _i.current = Xa, Xa && (Ci.current.clear(), Da.current.clear(), a.current && (a.current.moveInput = { x: 0, y: 0 }, a.current.tapDestination = null, a.current.aimState.active = false, a.current.player.chargeState.active && a.current.releaseSkillHold(a.current.player.chargeState.skillIdx, a.current.player.facing, a.current.player.x, a.current.player.y, true)));
  }, [Xa]), (0, ie.useEffect)(() => {
    let w = Ci.current, j = Da.current, ee = /* @__PURE__ */ new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]), he = (ue) => {
      let fe = 0, Ie = 0;
      if ((w.has("KeyA") || w.has("ArrowLeft")) && --fe, (w.has("KeyD") || w.has("ArrowRight")) && (fe += 1), (w.has("KeyW") || w.has("ArrowUp")) && --Ie, (w.has("KeyS") || w.has("ArrowDown")) && (Ie += 1), fe !== 0 && Ie !== 0) {
        let Xe = 1 / Math.SQRT2;
        fe *= Xe, Ie *= Xe;
      }
      ue.moveInput = { x: fe, y: Ie };
    }, le = (ue, fe) => {
      let Ie = ue.currentHero.skills[fe];
      if (!Ie) return ue.getDefaultAimForSkill(fe);
      if (Kt.current) {
        let Xe = ue.screenToWorld(Kt.current.x, Kt.current.y), Qa = Xe.x - ue.player.x, Kn = Xe.y - ue.player.y, va = Math.atan2(Kn, Qa), Fi = Xe.x, Za = Xe.y;
        let maxW = (ue.mapWidth || 2000) - 30, maxH = (ue.mapHeight || 1400) - 30;
        if (Ie.aimType === "CIRCLE_FREE") {
          let Un = Ie.range || 240;
          Math.hypot(Qa, Kn) > Un && (Fi = ue.player.x + Math.cos(va) * Un, Za = ue.player.y + Math.sin(va) * Un), Fi = Math.max(30, Math.min(maxW, Fi)), Za = Math.max(30, Math.min(maxH, Za));
        } else if (Ie.aimType === "PATH" || Ie.aimType === "RECT") {
          let Un = Ie.range || 560;
          Fi = Math.max(30, Math.min(maxW, ue.player.x + Math.cos(va) * Un)), Za = Math.max(30, Math.min(maxH, ue.player.y + Math.sin(va) * Un));
        } else Fi = ue.player.x + Math.cos(va) * (Ie.range || 120), Za = ue.player.y + Math.sin(va) * (Ie.range || 120);
        return { angle: va, targetX: Fi, targetY: Za };
      }
      return ue.getDefaultAimForSkill(fe);
    }, X = (ue, fe, Ie) => {
      if (!ue.canActivateSkill(fe)) return;
      let Xe = le(ue, fe);
      ue.isSkillHoldable(fe) ? (j.set(Ie, fe), ue.startSkillHold(fe, Xe.angle, Xe.targetX, Xe.targetY)) : ue.castSkill(fe, Xe.angle, Xe.targetX, Xe.targetY);
    }, we = (ue) => {
      let fe = a.current;
      if (!fe) return;
      if (ue.code === "Escape") {
        if (grudgeForestStoryModal) {
          setGrudgeForestStoryModal(null);
          if (grudgeForestStoryPausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
            grudgeForestStoryPausedRef.current = false;
            a.current.gameState = "PLAYING";
          }
          return;
        }
        if (grudgeForestJournalOpen) {
          setGrudgeForestJournalOpen(false);
          return;
        }
        if (frozenTombStoryModal) {
          setFrozenTombStoryModal(null);
          if (frozenTombStoryPausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
            frozenTombStoryPausedRef.current = false;
            a.current.gameState = "PLAYING";
          }
          return;
        }
        if (frozenTombJournalOpen) {
          setFrozenTombJournalOpen(false);
          return;
        }
        if (infernoStoryModal) {
          setInfernoStoryModal(null);
          if (infernoStoryPausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
            infernoStoryPausedRef.current = false;
            a.current.gameState = "PLAYING";
          }
          return;
        }
        if (infernoJournalOpen) {
          setInfernoJournalOpen(false);
          return;
        }
        if (citadelLoreModal) {
          setCitadelLoreModal(null);
          if (citadelLorePausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
            citadelLorePausedRef.current = false;
            a.current.gameState = "PLAYING";
          }
          return;
        }
        if (chroniclesOpen) {
          setChroniclesOpen(false);
          return;
        }
        if (founderModalOpen) {
          setFounderModalOpen(false);
          return;
        }
        if (accountModalOpen) {
          setAccountModalOpen(false);
          return;
        }
        if (mpLobbyOpen) {
          setMpLobbyOpen(false);
          return;
        }
        if (mpMenuOpen) {
          setMpMenuOpen(false);
          return;
        }
        if (W) {
          V(false);
          return;
        }
        if (oe) {
          ye(false);
          return;
        }
        if (P) {
          N(false);
          return;
        }
        if (T) {
          b(false);
          return;
        }
        if (x) {
          C(false);
          return;
        }
        if (H) {
          D(false);
          return;
        }
        De || fe.gameState !== "PLAYING" && fe.gameState !== "PAUSED" || ve();
        return;
      }
      let Ie = ue.target, Xe = Ie?.tagName;
      if (!(Xe === "INPUT" || Xe === "TEXTAREA" || Xe === "SELECT" || Ie?.isContentEditable) && !(_i.current || fe.gameState !== "PLAYING")) if (ee.has(ue.code)) ue.preventDefault(), w.add(ue.code), fe.tapDestination = null, he(fe);
      else if (ue.code === "Space" || ue.code === "KeyJ") {
        if (ue.preventDefault(), Kt.current && !fe.findNearestEnemy(fe.currentHero.stats.range + 24)) {
          let Qa = fe.screenToWorld(Kt.current.x, Kt.current.y);
          fe.player.facing = Math.atan2(Qa.y - fe.player.y, Qa.x - fe.player.x);
        }
        fe.triggerBasicAttack();
      } else ue.repeat || (ue.code === "Digit1" || ue.code === "KeyQ" ? (ue.preventDefault(), X(fe, 0, ue.code)) : ue.code === "Digit2" || ue.code === "KeyE" ? (ue.preventDefault(), X(fe, 1, ue.code)) : ue.code === "Digit3" || ue.code === "KeyR" ? (ue.preventDefault(), X(fe, 2, ue.code)) : (ue.code === "Digit4" || ue.code === "KeyF") && fe.currentHero.skills.length >= 4 ? (ue.preventDefault(), X(fe, 3, ue.code)) : ue.code === "KeyV" ? (ue.preventDefault(), fe.interactNearestMapNode ? fe.interactNearestMapNode() : fe.interactNearestCitadelNode?.()) : ue.code === "KeyG" && fe.currentHero.id === "thien" ? (ue.preventDefault(), (() => { const gVal = fe.toggleThienGodMode(); if (typeof gVal === "boolean") logFounderAuditEvent("GOD_MODE_TOGGLED", gVal ? "god_on" : "god_off").catch(() => {}); })()) : ue.code === "KeyT" && fe.currentHero.id === "taidu" && (ue.preventDefault(), fe.toggleTaiDuDroneMode()));
    }, rt = (ue) => {
      let fe = a.current;
      if (j.has(ue.code)) {
        let Ie = j.get(ue.code);
        if (j.delete(ue.code), fe) {
          let Xe = le(fe, Ie);
          fe.releaseSkillHold(Ie, Xe.angle, Xe.targetX, Xe.targetY, false);
        }
      } else ee.has(ue.code) && (w.delete(ue.code), fe && he(fe));
    }, Et = () => {
      w.clear(), j.clear(), a.current && (a.current.moveInput = { x: 0, y: 0 }, a.current.player.chargeState.active && a.current.releaseSkillHold(a.current.player.chargeState.skillIdx, a.current.player.facing, a.current.player.x, a.current.player.y, true));
    };
    return window.addEventListener("keydown", we), window.addEventListener("keyup", rt), window.addEventListener("blur", Et), () => {
      window.removeEventListener("keydown", we), window.removeEventListener("keyup", rt), window.removeEventListener("blur", Et);
    };
  }, [ve, W, oe, P, T, x, H, De, mpLobbyOpen, mpMenuOpen, founderModalOpen, accountModalOpen, chroniclesOpen, citadelLoreModal, infernoStoryModal, infernoJournalOpen, frozenTombStoryModal, frozenTombJournalOpen, grudgeForestStoryModal, grudgeForestJournalOpen]);
  let ze = Ef[c];
  let fsActive = isFullscreen || isPseudoFullscreen;
  let portraitVp = computeCameraViewportConfig({ viewW: viewportSize.w, viewH: viewportSize.h, layoutMode, fovPreset: portraitFov });
  let isPortraitHud = portraitVp.isPortrait;
  return (0, u.jsxs)("div", { className: `app-shell select-none ${isPseudoFullscreen ? "ios-focus-mode" : ""} ${isPortraitHud ? "portrait-ui" : ""}`, children: [(0, u.jsx)("canvas", { ref: s, id: "gameCanvas", onContextMenu: (w) => w.preventDefault(), onPointerMove: (w) => {
    let j = a.current, ee = w.currentTarget.getBoundingClientRect(), he = w.clientX - ee.left, le = w.clientY - ee.top;
    if (Kt.current = { x: he, y: le }, j && j.gameState === "PLAYING" && j.player.chargeState.active) {
      let X = j.screenToWorld(he, le), we = Math.atan2(X.y - j.player.y, X.x - j.player.x);
      j.updateSkillHoldAim(we, X.x, X.y);
    }
    if (j && j.gameState === "PLAYING" && !j.waitingReward && !j.waveCleared && !j.aimState.active && w.buttons === 1) {
      let X = j.screenToWorld(he, le);
      j.tapDestination = { x: X.x, y: X.y };
    }
  }, onPointerDown: (w) => {
    let j = a.current;
    if (!j || j.gameState !== "PLAYING" || j.waitingReward || j.waveCleared) return;
    let ee = w.currentTarget.getBoundingClientRect(), he = w.clientX - ee.left, le = w.clientY - ee.top;
    Kt.current = { x: he, y: le };
    let X = j.screenToWorld(he, le);
    w.button === 2 ? (w.preventDefault(), j.player.facing = Math.atan2(X.y - j.player.y, X.x - j.player.x), j.triggerBasicAttack()) : (w.pointerType === "touch" || w.button === 0) && (j.tapDestination = { x: X.x, y: X.y }, j.tapRipple = { x: X.x, y: X.y, radius: 10, alpha: 1 });
  } }), l === "PLAYING" && (0, u.jsxs)("div", { id: "hudLayer", className: isPortraitHud ? "hud-portrait" : void 0, children: [isPortraitHud ? (0, u.jsxs)("div", { className: "hud-portrait-topbar", children: [(0, u.jsxs)("div", { className: "hud-portrait-row", children: [(0, u.jsxs)("div", { className: "hud-portrait-hero", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between gap-1 text-[11px] font-bold leading-none", children: [(0, u.jsx)("span", { className: "text-white font-moba text-neon-cyan truncate", children: re.heroName }), (0, u.jsxs)("span", { className: "text-[#F59E0B] font-mono-numbers shrink-0 tabular-nums", children: ["Lv.", re.level] })] }), (0, u.jsxs)("div", { className: "bar-container h-[8px] mt-1", children: [(0, u.jsx)("div", { className: "bar-fill hp-fill", style: { width: `${re.hp / re.maxHp * 100}%` } }), (0, u.jsx)("div", { className: "shield-fill", style: { width: `${Math.min(100, re.shield / re.maxHp * 100)}%` } })] }), (0, u.jsxs)("div", { className: "flex items-center justify-between text-[9px] text-slate-300 mt-0.5 font-mono-numbers tabular-nums leading-none", children: [(0, u.jsxs)("span", { children: [re.hp, "/", re.maxHp] }), re.shield > 0 && (0, u.jsxs)("span", { className: "text-[#38BDF8]", children: ["+", re.shield] })] }), (0, u.jsx)("div", { className: "bar-container h-[3px] mt-0.5", children: (0, u.jsx)("div", { className: "bar-fill xp-fill", style: { width: `${re.xpPct}%` } }) })] }), (0, u.jsxs)("div", { className: "hud-portrait-wave", children: [(0, u.jsxs)("div", { className: "text-[11px] font-black text-[#F59E0B] font-mono-numbers leading-tight tabular-nums", children: [c === "vi" ? "M" : "W", re.wave, "/27"] }), (0, u.jsxs)("div", { className: "text-[9px] text-slate-300 font-mono-numbers leading-tight tabular-nums", children: [re.kills, "/", re.waveTotal] })] }), (0, u.jsxs)("div", { className: "hud-portrait-actions", children: [(0, u.jsxs)("button", { type: "button", className: "hud-portrait-btn border-amber-500/55 text-amber-300", onClick: () => {
    R.playClick(), je(p.id), N(true);
  }, title: "Cửa Hàng Trang Bị", children: [(0, u.jsx)("span", { children: "🪙" }), (0, u.jsx)("span", { className: "font-mono-numbers tabular-nums", children: f })] }), (0, u.jsx)("button", { type: "button", className: "hud-portrait-btn border-cyan-500/45 text-cyan-200", onClick: () => {
    R.playClick(), ye(true);
  }, title: "Bảng Kỹ Năng", children: "📖" }), (0, u.jsx)("button", { type: "button", className: "hud-portrait-btn", onClick: ve, title: "Tạm dừng / Cài đặt", children: "❚❚" })] })] }), re.mapId === "blood_citadel" && (0, u.jsxs)("div", { className: "px-2 py-0.5 flex items-center justify-between gap-2 text-[9px] font-moba bg-rose-950/55 border-t border-rose-500/30 text-rose-200", children: [(0, u.jsx)("span", { className: "font-bold truncate", children: c === "vi" ? "🏰 Cổ Thành Huyết Táng" : "🏰 Bloodsoaked Citadel" }), (0, u.jsxs)("span", { className: "font-mono-numbers shrink-0", children: ["Tin ", re.citadelSecrets?.tinClue ? "✓" : "?", " · Bảo ", re.citadelSecrets?.baoClue ? "✓" : "?", " · Ẩn ", re.citadelSecrets?.combinedUnlocked ? "✓" : "?"] })] }), re.mapId === "inferno_ash" && (0, u.jsxs)("div", { className: "px-2 py-0.5 flex items-center justify-between gap-2 text-[9px] font-moba bg-orange-950/60 border-t border-orange-500/35 text-orange-100 pointer-events-auto", children: [(0, u.jsxs)("span", { className: "font-bold truncate", children: ["🔥 ", re.infernoHud?.zoneLabel || (c === "vi" ? "Hỏa Ngục Tàn Tro" : "Inferno of Ashes")] }), (0, u.jsx)("button", { type: "button", onClick: () => { R.playModalOpen(); setInfernoJournalOpen(true); }, className: "font-mono-numbers text-amber-200 hover:text-white shrink-0 cursor-pointer", children: `📜 ${re.infernoHud?.docsCount || 0}/${re.infernoHud?.docsTotal || 13}` })] }), re.mapId === "frozen_tomb" && (0, u.jsxs)("div", { className: "px-2 py-0.5 flex items-center justify-between gap-2 text-[9px] font-moba bg-sky-950/70 border-t border-sky-400/35 text-sky-100 pointer-events-auto", children: [(0, u.jsxs)("span", { className: "font-bold truncate", children: ["❄️ ", re.frozenTombHud?.zoneLabel || (c === "vi" ? "Băng Mộ Vĩnh Cửu" : "Eternal Frozen Tomb"), re.frozenTombHud?.frostBuildup > 0 ? ` · 🥶${Math.round(re.frozenTombHud.frostBuildup * 100)}%` : ""] }), (0, u.jsx)("button", { type: "button", onClick: () => { R.playModalOpen(); setFrozenTombJournalOpen(true); }, className: "font-mono-numbers text-cyan-200 hover:text-white shrink-0 cursor-pointer", children: `📜 ${re.frozenTombProgress?.collectedDocs?.length || 0}/${Object.keys(FROZEN_TOMB_DOCS).length}` })] }), re.mapId === "grudge_forest" && (0, u.jsxs)("div", { className: "px-2 py-0.5 flex items-center justify-between gap-2 text-[9px] font-moba bg-emerald-950/75 border-t border-emerald-400/35 text-emerald-100 pointer-events-auto", children: [(0, u.jsxs)("span", { className: "font-bold truncate", children: ["🌿 ", re.grudgeForestHud?.zoneLabel || (c === "vi" ? "Rừng Oán Niệm" : "Forest of Grudges"), re.grudgeForestHud?.inSilenceZone ? (c === "vi" ? " · 🤫 CÂM LẶNG" : " · 🤫 SILENCE") : ""] }), (0, u.jsx)("button", { type: "button", onClick: () => { R.playModalOpen(); setGrudgeForestJournalOpen(true); }, className: "font-mono-numbers text-emerald-200 hover:text-white shrink-0 cursor-pointer", children: `📜 ${re.grudgeForestHud?.docsCount ?? (re.grudgeForestProgress?.collectedDocs?.length || 0)}/${re.grudgeForestHud?.docsTotal || Object.keys(GRUDGE_FOREST_DOCS).length}` })] }), re.boss && (0, u.jsxs)("div", { className: "hud-portrait-boss", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center text-[10px] font-bold text-red-300 gap-2 leading-tight", children: [(0, u.jsxs)("span", { className: "font-moba truncate", children: [re.boss.name, re.boss.phase > 1 ? ` · GĐ ${re.boss.phase}` : ""] }), (0, u.jsxs)("span", { className: "font-mono-numbers shrink-0 tabular-nums", children: [re.boss.hp, "/", re.boss.maxHp] })] }), (0, u.jsx)("div", { className: "bar-container h-[6px] mt-0.5 border-red-800", children: (0, u.jsx)("div", { className: "bar-fill boss-hp-fill", style: { width: `${Math.max(0, re.boss.hp / re.boss.maxHp * 100)}%` } }) })]  }), (re.resourceText || re.buffsText || re.combo.active || (re.coopActive && re.teammates && re.teammates.length > 0) || (p.id === "thien" && re.thienState) || re.mapId === "blood_citadel" || re.mapId === "inferno_ash" || re.mapId === "frozen_tomb" || re.mapId === "grudge_forest") && (0, u.jsxs)("div", { className: "hud-portrait-subrow", children: [(0, u.jsxs)("div", { className: "flex flex-col items-start gap-1 max-w-[60vw]", children: [(re.resourceText || re.buffsText) && (0, u.jsx)("div", { className: "px-2 py-0.5 rounded-md bg-slate-950/65 border border-slate-700/50 text-[9px] font-mono-numbers font-bold text-amber-200 truncate max-w-full", children: [re.resourceText, re.buffsText].filter(Boolean).join(" \xB7 ") }), p.id === "thien" && re.thienState && (0, u.jsxs)("div", { className: "thien-eye-wrap pointer-events-auto", children: [(0, u.jsxs)("button", { type: "button", className: "thien-eye-toggle", onClick: () => { R.playTabSwitch(); setThienEyeOpen((vOpen) => !vOpen); }, children: [(0, u.jsx)("span", { children: "👁" }), (0, u.jsx)("span", { children: c === "vi" ? "THIÊN NHÃN" : "HEAVENLY EYE" }), (0, u.jsx)("span", { className: "font-mono-numbers text-sky-300", children: formatWaveClock(re.thienState.waveElapsedTime) }), (0, u.jsx)("span", { className: "text-[9px] opacity-80", children: thienEyeOpen ? "▲" : "▼" })] }), thienEyeOpen && (0, u.jsxs)("div", { className: "thien-eye-panel thien-eye-compact", children: [(0, u.jsxs)("div", { className: "thien-eye-row", children: [(0, u.jsx)("span", { className: "text-slate-400", children: "Boss HP" }), (0, u.jsx)("span", { className: "font-mono-numbers text-rose-300 font-bold truncate max-w-[140px]", children: re.thienState.bosses?.length > 0 ? re.thienState.bosses.map((b) => `${b.name.split(" ")[0]} ${b.hp}/${b.maxHp}`).join(" · ") : (c === "vi" ? "Chưa xuất hiện" : "None") })] }), (0, u.jsxs)("div", { className: "thien-eye-skills", children: [(0, u.jsxs)("span", { children: ["ATK ", (re.thienState.breakdown?.atk || 0).toLocaleString()] }), (0, u.jsxs)("span", { children: ["C1 ", (re.thienState.breakdown?.c1 || 0).toLocaleString()] }), (0, u.jsxs)("span", { children: ["C2 ", (re.thienState.breakdown?.c2 || 0).toLocaleString()] }), (0, u.jsxs)("span", { children: ["C3 ", (re.thienState.breakdown?.c3 || 0).toLocaleString()] }), (0, u.jsxs)("span", { className: "text-amber-300 font-bold", children: ["C4 ", (re.thienState.breakdown?.c4 || 0).toLocaleString()] })] }), (0, u.jsxs)("div", { className: "thien-eye-row pt-0.5 border-t border-sky-500/20", children: [(0, u.jsxs)("span", { className: "font-mono-numbers text-amber-200 font-bold", children: ["Σ ", (re.thienState.totalDamage || 0).toLocaleString()] }), (0, u.jsxs)("span", { className: "font-mono-numbers text-emerald-300", children: ["💀 ", re.thienState.totalKilled || 0] }), (0, u.jsxs)("span", { className: "font-mono-numbers text-cyan-200", children: ["⏱ ", re.thienState.lastWaveClearTime > 0 ? formatWaveClock(re.thienState.lastWaveClearTime) : formatWaveClock(re.thienState.waveElapsedTime)] })] })] })] }), re.coopActive && re.teammates && re.teammates.length > 0 && (0, u.jsx)("div", { className: "flex flex-col gap-0.5 w-[136px]", children: re.teammates.map((mate) => {
    let mateHero = Mi.find((hr) => hr.id === mate.heroId) || Mi[0];
    return (0, u.jsxs)("div", { className: "px-1.5 py-0.5 rounded-md bg-slate-950/68 border border-cyan-500/40", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between text-[9px] gap-1", children: [(0, u.jsxs)("span", { className: "flex items-center gap-1 font-moba font-bold text-slate-100 truncate", children: [(0, u.jsx)("span", { className: "w-1.5 h-1.5 rounded-full shrink-0", style: { backgroundColor: mateHero.color } }), (0, u.jsx)("span", { className: "truncate", children: mate.name })] }), (0, u.jsx)("span", { className: `font-mono-numbers shrink-0 ${mate.alive ? "text-cyan-300" : "text-rose-400"}`, children: mate.alive ? `Lv.${mate.level}` : "💀" })] }), (0, u.jsx)("div", { className: "bar-container h-[3px] mt-0.5", children: (0, u.jsx)("div", { className: `bar-fill ${mate.alive ? "bg-gradient-to-r from-cyan-500 to-sky-400" : "bg-slate-600"}`, style: { width: `${mate.alive ? Math.max(0, Math.min(100, mate.hp / mate.maxHp * 100)) : 0}%` } }) })] }, mate.id);
  }) })] }), (0, u.jsxs)("div", { className: "flex flex-col items-end gap-1", children: [re.combo.active && (0, u.jsxs)("div", { className: "combo-hud", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, u.jsx)("span", { className: `combo-rank-badge combo-rank-${re.combo.rank}`, children: re.combo.rank }), (0, u.jsxs)("div", { className: "text-right font-mono-numbers leading-tight", children: [(0, u.jsxs)("div", { className: "text-[11px] font-black text-white tabular-nums", children: [re.combo.hits, " HIT"] }), (0, u.jsxs)("div", { className: "text-[9px] text-amber-300 tabular-nums", children: [re.combo.efficiency, "%"] })] })] }), (0, u.jsx)("div", { className: "bar-container h-[3px] mt-0.5", children: (0, u.jsx)("div", { className: "bar-fill bg-gradient-to-r from-amber-400 to-rose-500", style: { width: `${Math.min(100, re.combo.timer / Math.max(0.1, re.combo.maxTimer) * 100)}%` } }) })] }), re.mapId === "blood_citadel" && (0, u.jsx)(CitadelTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: true, isOpen: citadelMinimapOpen, onToggle: () => { R.playTabSwitch(); setCitadelMinimapOpen((vOpen) => !vOpen); } }), re.mapId === "inferno_ash" && (0, u.jsx)(InfernoTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: true, isOpen: infernoMinimapOpen, onToggle: () => { R.playTabSwitch(); setInfernoMinimapOpen((vOpen) => !vOpen); }, onOpenJournal: () => { R.playModalOpen(); setInfernoJournalOpen(true); } }), re.mapId === "frozen_tomb" && (0, u.jsx)(FrozenTombTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: true, isOpen: frozenTombMinimapOpen, onToggle: () => { R.playTabSwitch(); setFrozenTombMinimapOpen((vOpen) => !vOpen); }, onOpenJournal: () => { R.playModalOpen(); setFrozenTombJournalOpen(true); } }), re.mapId === "grudge_forest" && (0, u.jsx)(GrudgeForestTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: true, isOpen: grudgeForestMinimapOpen, onToggle: () => { R.playTabSwitch(); setGrudgeForestMinimapOpen((vOpen) => !vOpen); }, onOpenJournal: () => { R.playModalOpen(); setGrudgeForestJournalOpen(true); } })] })] })]  }) : (0, u.jsxs)("div", { className: "hud-header", children: [(0, u.jsxs)("div", { className: "flex flex-col items-start pointer-events-none", children: [(0, u.jsxs)("div", { className: "hud-card hud-hero-card w-[184px]", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center text-[11px] font-bold leading-tight", children: [(0, u.jsx)("span", { className: "text-white font-moba text-xs text-neon-cyan truncate", children: re.heroName }), (0, u.jsxs)("span", { className: "text-[#F59E0B] font-mono-numbers text-[11px] shrink-0", children: ["Lv.", re.level] })] }), (0, u.jsxs)("div", { className: "bar-container h-[7px] mt-1", children: [(0, u.jsx)("div", { className: "bar-fill hp-fill", style: { width: `${re.hp / re.maxHp * 100}%` } }), (0, u.jsx)("div", { className: "shield-fill", style: { width: `${Math.min(100, re.shield / re.maxHp * 100)}%` } })] }), (0, u.jsxs)("div", { className: "flex justify-between text-[9.5px] text-slate-400 mt-0.5 font-mono-numbers leading-tight", children: [(0, u.jsxs)("span", { children: [re.hp, " / ", re.maxHp] }), re.shield > 0 && (0, u.jsxs)("span", { className: "text-[#38BDF8]", children: ["Khi\xEAn: ", re.shield] })] }), re.resourceText && (0, u.jsx)("div", { className: "text-[9.5px] font-mono-numbers font-extrabold text-amber-300 mt-0.5 truncate leading-tight", children: re.resourceText }), re.buffsText && (0, u.jsx)("div", { className: "text-[9.5px] text-[#FDE68A] mt-0.5 truncate font-semibold leading-tight", children: re.buffsText }), (0, u.jsx)("div", { className: "bar-container h-[3px] mt-0.5", children: (0, u.jsx)("div", { className: "bar-fill xp-fill", style: { width: `${re.xpPct}%` } }) })] }), p.id === "thien" && re.thienState && (0, u.jsxs)("div", { className: "thien-eye-wrap mt-1 pointer-events-auto", children: [(0, u.jsxs)("button", { type: "button", className: "thien-eye-toggle", onClick: () => { R.playTabSwitch(); setThienEyeOpen((vOpen) => !vOpen); }, children: [(0, u.jsx)("span", { children: "👁" }), (0, u.jsx)("span", { children: c === "vi" ? "THIÊN NHÃN" : "HEAVENLY EYE" }), (0, u.jsx)("span", { className: "font-mono-numbers text-sky-300", children: formatWaveClock(re.thienState.waveElapsedTime) }), (0, u.jsx)("span", { className: "text-[9px] opacity-80", children: thienEyeOpen ? "▲" : "▼" })] }), thienEyeOpen && (0, u.jsxs)("div", { className: "thien-eye-panel", children: [(0, u.jsxs)("div", { className: "thien-eye-row", children: [(0, u.jsx)("span", { className: "text-slate-400", children: c === "vi" ? "HP Boss:" : "Boss HP:" }), (0, u.jsx)("span", { className: "font-mono-numbers text-rose-300 font-bold truncate max-w-[140px]", children: re.thienState.bosses?.length > 0 ? re.thienState.bosses.map((b) => `${b.name} ${b.hp.toLocaleString()}/${b.maxHp.toLocaleString()}`).join(" · ") : (c === "vi" ? "Chưa xuất hiện" : "None") })] }), (0, u.jsxs)("div", { className: "thien-eye-skills", children: [(0, u.jsxs)("span", { children: ["ATK: ", (re.thienState.breakdown?.atk || 0).toLocaleString()] }), (0, u.jsxs)("span", { children: ["C1: ", (re.thienState.breakdown?.c1 || 0).toLocaleString()] }), (0, u.jsxs)("span", { children: ["C2: ", (re.thienState.breakdown?.c2 || 0).toLocaleString()] }), (0, u.jsxs)("span", { children: ["C3: ", (re.thienState.breakdown?.c3 || 0).toLocaleString()] }), (0, u.jsxs)("span", { className: "text-amber-300 font-bold", children: ["C4: ", (re.thienState.breakdown?.c4 || 0).toLocaleString()] })] }), (0, u.jsxs)("div", { className: "thien-eye-row pt-1 border-t border-sky-500/20", children: [(0, u.jsx)("span", { className: "text-slate-400", children: c === "vi" ? "Tổng ST:" : "Total DMG:" }), (0, u.jsx)("span", { className: "font-mono-numbers text-amber-300 font-black", children: (re.thienState.totalDamage || 0).toLocaleString() })] }), (0, u.jsxs)("div", { className: "thien-eye-row", children: [(0, u.jsx)("span", { className: "text-slate-400", children: c === "vi" ? "Quái hạ gục:" : "Kills:" }), (0, u.jsxs)("span", { className: "font-mono-numbers text-emerald-300 font-bold", children: [re.kills, "/", re.waveTotal, " (Tổng ", re.thienState.totalKilled || 0, ")"] })] }), (0, u.jsxs)("div", { className: "thien-eye-row", children: [(0, u.jsx)("span", { className: "text-slate-400", children: c === "vi" ? "Hoàn thành màn:" : "Wave Clear:" }), (0, u.jsxs)("span", { className: "font-mono-numbers text-cyan-200 font-bold", children: [formatWaveClock(re.thienState.waveElapsedTime), re.thienState.lastWaveClearTime > 0 ? ` · Trước ${formatWaveClock(re.thienState.lastWaveClearTime)}` : ""] })] })] })] }), re.coopActive && re.teammates && re.teammates.length > 0 && (0, u.jsx)("div", { className: "mt-1 flex flex-col gap-1 w-[152px] sm:w-[178px] pointer-events-none", children: re.teammates.map((mate) => {
    let mateHero = Mi.find((hr) => hr.id === mate.heroId) || Mi[0];
    return (0, u.jsxs)("div", { className: "hud-card py-0.5 px-2 border-cyan-500/40", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between text-[9.5px] gap-1", children: [(0, u.jsxs)("span", { className: "flex items-center gap-1 font-moba font-bold text-slate-100 truncate", children: [(0, u.jsx)("span", { className: "w-1.5 h-1.5 rounded-full shrink-0", style: { backgroundColor: mateHero.color } }), (0, u.jsx)("span", { className: "truncate", children: mate.name })] }), (0, u.jsx)("span", { className: `font-mono-numbers shrink-0 ${mate.alive ? "text-cyan-300" : "text-rose-400"}`, children: mate.alive ? `Lv.${mate.level}` : "\u{1F480} Ng\xE3" })] }), (0, u.jsx)("div", { className: "bar-container h-[3px] mt-0.5", children: (0, u.jsx)("div", { className: `bar-fill ${mate.alive ? "bg-gradient-to-r from-cyan-500 to-sky-400" : "bg-slate-600"}`, style: { width: `${mate.alive ? Math.max(0, Math.min(100, mate.hp / mate.maxHp * 100)) : 0}%` } }) })] }, mate.id);
  }) }), re.combo.active && (0, u.jsxs)("div", { className: "combo-hud", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [(0, u.jsx)("span", { className: `combo-rank-badge combo-rank-${re.combo.rank}`, children: re.combo.rank }), (0, u.jsxs)("div", { className: "text-right font-mono-numbers leading-tight", children: [(0, u.jsxs)("div", { className: "text-[11px] font-black text-white tabular-nums", children: [re.combo.hits, " HIT"] }), (0, u.jsxs)("div", { className: "text-[9px] text-amber-300 tabular-nums", children: ["Hi\u1EC7u su\u1EA5t ", re.combo.efficiency, "%"] })] })] }), re.combo.comboName && (0, u.jsx)("div", { className: "text-[9.5px] font-moba font-bold text-cyan-300 mt-0.5 truncate", children: re.combo.comboName }), (0, u.jsx)("div", { className: "bar-container h-[3px] mt-0.5", children: (0, u.jsx)("div", { className: "bar-fill bg-gradient-to-r from-amber-400 to-rose-500", style: { width: `${Math.min(100, re.combo.timer / Math.max(0.1, re.combo.maxTimer) * 100)}%` } }) })] })] }), (0, u.jsxs)("div", { className: "flex flex-col items-center gap-1 pointer-events-none", children: [(0, u.jsxs)("div", { className: "hud-card hud-wave-card text-center px-3 py-1 border-amber-500/50", children: [(0, u.jsxs)("div", { className: "text-xs font-black text-[#F59E0B] font-mono-numbers tracking-wider leading-tight", children: [c === "vi" ? "M\xC0N" : "WAVE", " ", re.wave, " / 27"] }), (0, u.jsxs)("div", { className: "text-[10px] text-slate-300 font-mono-numbers mt-0.5 leading-tight", children: [c === "vi" ? "Ti\xEAu di\u1EC7t" : "Slain", ": ", re.kills, " / ", re.waveTotal] }), re.mapId === "blood_citadel" && (0, u.jsxs)("div", { className: "text-[9.5px] font-mono-numbers font-bold text-rose-300 mt-0.5", children: ["🏰 ", c === "vi" ? "Cổ Thành" : "Citadel", " · Tin ", re.citadelSecrets?.tinClue ? "✓" : "?", " · Bảo ", re.citadelSecrets?.baoClue ? "✓" : "?", " · Ẩn ", re.citadelSecrets?.combinedUnlocked ? "✓" : "?"] }), re.mapId === "inferno_ash" && (0, u.jsxs)("div", { className: "text-[9.5px] font-mono-numbers font-bold text-orange-300 mt-0.5", children: ["🔥 ", re.infernoHud?.zoneLabel || (c === "vi" ? "Hỏa Ngục" : "Inferno"), ` · ${re.infernoHud?.clueCount || 0}/3 · 📜${re.infernoHud?.docsCount || 0}/${re.infernoHud?.docsTotal || 13}`] }), re.mapId === "frozen_tomb" && (0, u.jsxs)("div", { className: "text-[9.5px] font-mono-numbers font-bold text-sky-300 mt-0.5", children: ["❄️ ", re.frozenTombHud?.zoneLabel || (c === "vi" ? "Băng Mộ" : "Frozen Tomb"), ` · 📜${re.frozenTombProgress?.collectedDocs?.length || 0}/${Object.keys(FROZEN_TOMB_DOCS).length}`, re.frozenTombHud?.frostBuildup > 0 ? ` · 🥶${Math.round(re.frozenTombHud.frostBuildup * 100)}%` : ""] }), re.mapId === "grudge_forest" && (0, u.jsxs)("div", { className: "text-[9.5px] font-mono-numbers font-bold text-emerald-300 mt-0.5", children: ["🌿 ", re.grudgeForestHud?.zoneLabel || (c === "vi" ? "Rừng Oán Niệm" : "Grudge Forest"), ` · EE ${re.grudgeForestHud?.secretCount ?? countGrudgeForestSecrets(re.grudgeForestProgress)}/6 · 📜${re.grudgeForestHud?.docsCount ?? (re.grudgeForestProgress?.collectedDocs?.length || 0)}/${re.grudgeForestHud?.docsTotal || Object.keys(GRUDGE_FOREST_DOCS).length}`] }), re.coopActive && mpRoom && (0, u.jsxs)("div", { className: "text-[9px] font-mono-numbers font-bold text-cyan-300 mt-0.5", children: ["CO-OP ", mpRoom.roomId, " \xB7 Qu\xE1i ", Math.round((re.powerMultiplier || 1) * 100), "%"] })] }), re.boss && (0, u.jsxs)("div", { className: "hud-card hud-boss-card w-[228px] text-center py-1 px-2.5 border-red-500/70", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center text-[11px] font-bold text-red-300 gap-2 leading-tight", children: [(0, u.jsxs)("span", { className: "font-moba truncate", children: [re.boss.name, re.boss.phase > 1 ? ` · GĐ ${re.boss.phase}` : ""] }), (0, u.jsxs)("span", { className: "font-mono-numbers shrink-0", children: [re.boss.hp, "/", re.boss.maxHp] })] }), (0, u.jsx)("div", { className: "bar-container h-[6px] mt-0.5 border-red-800", children: (0, u.jsx)("div", { className: "bar-fill boss-hp-fill", style: { width: `${Math.max(0, re.boss.hp / re.boss.maxHp * 100)}%` } }) })] })] }), (0, u.jsxs)("div", { className: "flex flex-col items-end gap-1.5 pointer-events-none", children: [(0, u.jsxs)("div", { className: "hud-actions-bar flex items-center gap-1 sm:gap-1.5 pointer-events-auto", children: [(0, u.jsxs)("button", { type: "button", className: "hud-card hud-coin-pill flex items-center gap-1 px-2 py-1 cursor-pointer border-amber-500/40 hover:border-amber-400", onClick: () => {
    R.playClick(), je(p.id), N(true);
  }, title: "M\u1EDF C\u1EEDa H\xE0ng Trang B\u1ECB", children: [(0, u.jsx)("span", { className: "text-xs sm:text-sm", children: "\u{1FA99}" }), (0, u.jsx)("span", { className: "font-mono-numbers text-[11px] sm:text-xs font-extrabold text-[#F59E0B]", children: f })] }), (0, u.jsx)("button", { type: "button", className: "btn-secondary hud-menu-btn text-[11px] px-2.5 py-1 border-cyan-500/40 text-cyan-200", onClick: () => {
    R.playClick(), ye(true);
  }, children: "K\u1EF9 N\u0103ng" }), (0, u.jsx)("button", { type: "button", className: "btn-secondary hud-menu-btn text-[11px] px-2.5 py-1 border-amber-500/40 text-amber-200", onClick: () => {
    R.playClick(), je(p.id), N(true);
  }, children: "C\u1EEDa H\xE0ng" }), (0, u.jsx)("button", { type: "button", className: "btn-secondary hud-menu-btn text-[11px] px-2 py-1 border-emerald-500/40 text-emerald-200", onClick: toggleFullscreen, title: fsActive ? "Tho\xE1t to\xE0n m\xE0n h\xECnh" : "To\xE0n m\xE0n h\xECnh", children: fsActive ? "\u2922" : "\u26F6" }), (0, u.jsx)("button", { type: "button", className: "btn-secondary hud-menu-btn text-[11px] px-2 py-1", onClick: ve, title: "T\u1EA1m d\u1EEBng", children: "\u275A\u275A" })] }), re.mapId === "blood_citadel" && (0, u.jsx)(CitadelTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: false, isOpen: citadelMinimapOpen, onToggle: () => { R.playTabSwitch(); setCitadelMinimapOpen((vOpen) => !vOpen); } }), re.mapId === "inferno_ash" && (0, u.jsx)(InfernoTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: false, isOpen: infernoMinimapOpen, onToggle: () => { R.playTabSwitch(); setInfernoMinimapOpen((vOpen) => !vOpen); }, onOpenJournal: () => { R.playModalOpen(); setInfernoJournalOpen(true); } }), re.mapId === "frozen_tomb" && (0, u.jsx)(FrozenTombTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: false, isOpen: frozenTombMinimapOpen, onToggle: () => { R.playTabSwitch(); setFrozenTombMinimapOpen((vOpen) => !vOpen); }, onOpenJournal: () => { R.playModalOpen(); setFrozenTombJournalOpen(true); } }), re.mapId === "grudge_forest" && (0, u.jsx)(GrudgeForestTacticalMinimap, { hudSnapshot: re, heroId: p?.id, lang: c, compact: false, isOpen: grudgeForestMinimapOpen, onToggle: () => { R.playTabSwitch(); setGrudgeForestMinimapOpen((vOpen) => !vOpen); }, onOpenJournal: () => { R.playModalOpen(); setGrudgeForestJournalOpen(true); } })] })] }), re.coopActive && re.localDowned && (0, u.jsx)("div", { className: "pointer-events-none absolute top-[92px] left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-rose-950/90 border border-rose-400/70 text-rose-100 text-xs font-moba font-bold text-center shadow-lg", children: "\u{1F480} B\u1EA1n \u0111\xE3 ng\xE3 xu\u1ED1ng \u2014 \u0110\u1ED3ng \u0111\u1ED9i \u0111\u1EE9ng g\u1EA7n 2,4s \u0111\u1EC3 h\u1ED3i sinh ngay, ho\u1EB7c ch\u1EDD qua m\xE0n m\u1EDBi!" }), re.mapId === "inferno_ash" && re.infernoHud?.discoveryToast && (0, u.jsx)("div", { className: "pointer-events-none absolute top-[108px] left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-[#1C0A08]/92 border border-orange-400/75 text-amber-100 text-xs font-moba font-extrabold text-center shadow-[0_0_24px_rgba(249,115,22,0.35)]", children: re.infernoHud.discoveryToast }), re.mapId === "frozen_tomb" && re.frozenTombHud?.discoveryToast && (0, u.jsx)("div", { className: "pointer-events-none absolute top-[108px] left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-[#07162A]/92 border border-sky-400/75 text-sky-100 text-xs font-moba font-extrabold text-center shadow-[0_0_24px_rgba(56,189,248,0.35)]", children: re.frozenTombHud.discoveryToast }), re.mapId === "grudge_forest" && re.grudgeForestHud?.discoveryToast && (0, u.jsx)("div", { className: "pointer-events-none absolute top-[108px] left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-[#061D17]/92 border border-emerald-400/75 text-emerald-100 text-xs font-moba font-extrabold text-center shadow-[0_0_24px_rgba(52,211,153,0.35)]", children: re.grudgeForestHud.discoveryToast }), re.nearbyInteractable && (0, u.jsxs)("button", { type: "button", className: `pointer-events-auto absolute bottom-[126px] sm:bottom-[142px] left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl border text-xs sm:text-sm font-moba font-extrabold flex items-center gap-2 hover:brightness-110 active:scale-95 transition cursor-pointer ${re.mapId === "inferno_ash" ? "bg-gradient-to-r from-[#280D08]/95 via-[#1C090C]/95 to-[#18081C]/95 border-orange-400/85 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.38)]" : re.mapId === "frozen_tomb" ? "bg-gradient-to-r from-[#07182C]/95 via-[#091E3A]/95 to-[#160B2B]/95 border-sky-400/85 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.38)]" : re.mapId === "grudge_forest" ? "bg-gradient-to-r from-[#061D17]/95 via-[#0B1420]/95 to-[#1B0A2B]/95 border-emerald-400/85 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.38)]" : "bg-gradient-to-r from-rose-950/95 via-amber-950/95 to-purple-950/95 border-amber-400/80 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.35)]"}`, onPointerDown: (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    a.current?.interactNearestMapNode ? a.current.interactNearestMapNode() : a.current?.interactNearestCitadelNode?.();
  }, children: [(0, u.jsx)("span", { className: `px-1.5 py-0.5 rounded font-mono-numbers text-[11px] font-black ${re.mapId === "inferno_ash" ? "bg-orange-400 text-slate-950" : re.mapId === "frozen_tomb" ? "bg-sky-400 text-slate-950" : re.mapId === "grudge_forest" ? "bg-emerald-400 text-slate-950" : "bg-amber-400 text-slate-950"}`, children: "V" }), (0, u.jsx)("span", { children: re.nearbyInteractable.shortPrompt?.[c === "en" ? "en" : "vi"] || re.nearbyInteractable.label?.[c === "en" ? "en" : "vi"] || (c === "vi" ? "Tương tác" : "Interact") })] }), (0, u.jsx)("div", { id: "joystickZone", onPointerDown: K, onPointerMove: ge, onPointerUp: ut, onPointerCancel: ut, onLostPointerCapture: ut, children: (0, u.jsx)("div", { id: "joystickKnob", ref: O }) }), re.chargeActive && (0, u.jsxs)("div", { className: "charge-bar-hud", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center text-[11px] font-moba font-bold text-amber-200", children: [(0, u.jsx)("span", { children: re.chargeLabel }), (0, u.jsxs)("span", { className: "font-mono-numbers tabular-nums text-amber-400", children: [Math.round(re.chargeProgress * 100), "%"] })] }), (0, u.jsx)("div", { className: "charge-bar-track", children: (0, u.jsx)("div", { className: "charge-bar-fill", style: { width: `${Math.min(100, re.chargeProgress * 100)}%` } }) })] }), (0, u.jsxs)("div", { id: "actionControls", className: p.skills.length >= 4 ? "four-skills" : void 0, children: [p.skills.map((skItem, w) => {
    let j = skItem, ee = re.cooldowns[w] || 0, he = j.cooldown, le = re.skillStates[w] || "ready", padCd = re.padTeleportCds?.[w] || 0, isPadWaiting = p.id === "duccong" && w > 0 && padCd > 0, X = isPadWaiting || ee > 0 && le !== "recast" && le !== "charging", displayCd = isPadWaiting ? padCd : ee, displayMax = isPadWaiting ? 1.5 : he, we = X ? "state-cooldown" : le === "empowered" ? "state-empowered state-ready" : le === "recast" ? "state-recast state-ready" : le === "charging" ? "state-charging state-ready" : "state-ready";
    let btnIconSize = isPortraitHud ? (p.skills.length >= 4 ? (w === 3 ? 52 : 48) : (w === 2 ? 58 : 54)) : 78;
    return (0, u.jsxs)("button", { className: `btn-skill c${w + 1} ${we}`, onPointerDown: (rt) => Be(w, rt), onPointerMove: ta, onPointerUp: Ha, onPointerCancel: Ha, onLostPointerCapture: Ha, title: j.name[c], children: [(0, u.jsx)(Wt, { heroId: p.id, skillId: j.key, size: btnIconSize, roundedClass: "rounded-full", className: "pointer-events-none", alt: j.name[c] }), X && (0, u.jsx)("div", { className: "cooldown-overlay", style: { height: `${Math.min(100, displayCd / Math.max(0.1, displayMax) * 100)}%` } }), X && (0, u.jsx)("span", { className: `absolute inset-0 z-10 flex items-center justify-center font-mono-numbers ${isPortraitHud ? "text-xs" : "text-sm"} font-black text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] tabular-nums pointer-events-none`, children: displayCd.toFixed(1) }), (0, u.jsx)("span", { className: `absolute bottom-0.5 inset-x-0 text-center z-10 font-mono-numbers ${isPortraitHud ? "text-[10px]" : "text-[11px]"} font-black text-amber-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] pointer-events-none`, children: p.id === "duccong" && le === "recast" ? "D\u1ECACH" : p.id === "luan" && w === 1 && le === "recast" ? "\u0110\xD3NG" : le === "recast" ? "T\xC1I" : j.label })] }, w);
  }), p.id === "thien" && (0, u.jsxs)("button", { type: "button", className: `btn-thien-god ${re.thienState?.godMode ? "active-on" : ""}`, onPointerDown: (w) => {
    w.preventDefault();
    w.stopPropagation();
    const gVal = a.current?.toggleThienGodMode();
    if (typeof gVal === "boolean") logFounderAuditEvent("GOD_MODE_TOGGLED", gVal ? "god_on" : "god_off").catch(() => {});
  }, title: c === "vi" ? "Bật/Tắt Chế độ Thần Quyền (Phím G)" : "Toggle God Mode (Key G)", children: [(0, u.jsx)("span", { children: "👑" }), (0, u.jsx)("span", { children: re.thienState?.godMode ? (c === "vi" ? "THẦN QUYỀN: BẬT" : "GOD: ON") : (c === "vi" ? "THẦN QUYỀN" : "GOD MODE") })] }), p.id === "taidu" && (0, u.jsxs)("button", { className: "btn-drone-mode", style: { borderColor: re.droneColor || "#38BDF8" }, onPointerDown: (w) => {
    w.preventDefault(), w.stopPropagation(), a.current?.toggleTaiDuDroneMode();
  }, title: "\u0110\u1ED5i ch\u1EBF \u0111\u1ED9 Drone (Ph\xEDm T)", children: [(0, u.jsx)(Wt, { heroId: "taidu", skillId: "passive", size: isPortraitHud ? 24 : 36, roundedClass: "rounded-full", className: "pointer-events-none", alt: "Drone" }), (0, u.jsx)("span", { className: `${isPortraitHud ? "text-[11px]" : "text-xs"} font-moba font-black tracking-tight leading-none`, style: { color: re.droneColor || "#38BDF8" }, children: re.droneLabel || "T\u1EA5n C\xF4ng" })] }), (0, u.jsx)("button", { className: "btn-attack", onPointerDown: (w) => {
    w.preventDefault(), w.stopPropagation(), a.current?.triggerBasicAttack();
  }, title: p.weapon[c], children: [(0, u.jsx)(Wt, { heroId: p.id, skillId: "atk", size: isPortraitHud ? 96 : 136, roundedClass: "rounded-full", className: "pointer-events-none", alt: p.weapon[c] }), (0, u.jsx)("span", { className: `absolute bottom-1.5 inset-x-0 text-center font-moba ${isPortraitHud ? "text-[11px]" : "text-xs"} font-black text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] pointer-events-none`, children: ze.atk })] })] }), (0, u.jsx)("div", { id: "cancelSkillZone", ref: Ye, children: ze.cancelSkill })] }), l === "MENU" && (0, u.jsx)(MobaLobbyMenu, { lang: c, strings: ze, heroes: Mi, selectedHero: p, coins: f, sfxEnabled: Ft, musicEnabled: musicOn, isFullscreen: fsActive, mpRoom, envInfo, SkillIcon: Wt, founderUnlocked, playerProfile, googleUser, highestWave: Math.max(a.current?.highestWaveCleared || 0, playerProfile?.highestWave || 0), canDailyCheckIn: canClaimDailyCheckIn(playerProfile?.dailyCheckInDate || "", getTodayDateKey()), onClaimDailyCheckIn: handleClaimDailyCheckIn, onOpenAccountModal: handleOpenAccountModal, onSignInGoogle: handlePlayerGoogleSignIn, authError: accountAuthError, authDetails: accountAuthDetails, onClearAuthError: () => { setAccountAuthError(""); setAccountAuthDetails(null); }, onCopyText: handleCopyText, onRequireFounderAuth: (candidate) => requireFounderUnlock(() => { const target = candidate || Mi.find((hr) => hr.id === "thien"); if (target) { h(target); a.current && (a.current.currentHero = target, a.current.selectedHeroId = target.id, a.current.saveGame()); } }), onSelectHero: (w) => {
    h(w);
    if (!(w?.isSecretFounder && !founderUnlockedRef.current) && a.current) {
      a.current.currentHero = w;
      a.current.selectedHeroId = w.id;
      a.current.saveGame();
    }
  }, onEnterArena: (w) => ke(w), resumableRun, onResumeRun: handleResumeSavedRun, deviceInfo, onOpenHeroSelect: () => m("HERO_SELECT"), selectedMapId, unlockedMaps, citadelSecrets, infernoProgress, frozenTombProgress, grudgeForestProgress, onSelectMap: (nextMapId) => {
    if (a.current?.setSelectedMap?.(nextMapId)) {
      setSelectedMapId(a.current.selectedMapId);
    } else {
      G(getMapUnlockRequirement(nextMapId, c));
    }
  }, onOpenCoop: () => {
    setMpError("");
    setMpLobbyOpen(true);
  }, onOpenShop: () => {
    je(p.isSecretFounder && !founderUnlockedRef.current ? Mi[4].id : p.id);
    N(true);
  }, onOpenGuide: () => C(true), onOpenSettings: () => D(true), onOpenPatchNotes: () => b(true), onOpenChronicles: (tabName = "world", heroIdArg = null) => { setChroniclesTab(tabName); setChroniclesFocusHeroId(heroIdArg); setChroniclesOpen(true); }, onOpenShareGuide: () => setShareGuideOpen(true), onDownloadOrShare: ba, onToggleSfx: () => Nt((prev) => !prev), onToggleMusic: () => setMusicOn((prev) => !prev), onToggleFullscreen: toggleFullscreen, onToggleLang: J }), l === "HERO_SELECT" && (0, u.jsx)(MobaHeroSelect, { lang: c, strings: ze, heroes: Mi, selectedHero: p, coins: f, equippedCount: a.current ? Object.values(a.current.heroGear[p.id] || {}).filter(Boolean).length : 0, isFullscreen: fsActive, SkillIcon: Wt, getSkillAimMeta: vm, founderUnlocked, onRequireFounderAuth: (candidate) => requireFounderUnlock(() => { const target = candidate || Mi.find((hr) => hr.id === "thien"); if (target) { h(target); a.current && (a.current.currentHero = target, a.current.selectedHeroId = target.id, a.current.saveGame()); } }), onSelectHero: (w) => {
    if (w?.isSecretFounder && !founderUnlockedRef.current) {
      requireFounderUnlock(() => {
        h(w);
        a.current && (a.current.currentHero = w, a.current.selectedHeroId = w.id, a.current.saveGame());
      });
      return;
    }
    h(w);
    a.current && (a.current.currentHero = w, a.current.selectedHeroId = w.id, a.current.saveGame());
  }, onEnterArena: (w) => ke(w), onOpenShop: () => {
    je(p.isSecretFounder && !founderUnlockedRef.current ? Mi[4].id : p.id);
    N(true);
  }, onOpenChronicles: (tabName = "heroes", heroIdArg = null) => {
    setChroniclesTab(tabName);
    setChroniclesFocusHeroId(heroIdArg || p.id);
    setChroniclesOpen(true);
  }, onBack: () => m("MENU"), onToggleFullscreen: toggleFullscreen }), T && (0, u.jsx)("div", { className: "modal-backdrop", children: (0, u.jsxs)("div", { className: "modal-box max-w-[680px]", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center border-b border-slate-800 pb-3", children: [(0, u.jsxs)("div", { className: "flex items-center gap-2", children: [(0, u.jsx)("span", { className: "text-2xl", children: "\u{1F4CB}" }), (0, u.jsxs)("div", { children: [(0, u.jsx)("h3", { className: "font-moba text-lg font-black text-white", children: "Arena Hero 11.8 \u2014 C\xE2n B\u1EB1ng Lu\u1EADn, Buff Boss & 27 M\xE0n" }), (0, u.jsx)("span", { className: "text-[11px] text-amber-400 font-bold", children: "NERF LU\u1EACN (V\u1EBET N\u1EE8T & C1) \xB7 T\u0102NG S\u1EE8C M\u1EA0NH 9 BOSS \xB7 27 M\xC0N & 9 CH\u1EE6NG QU\xC1I \xB7 CO-OP 6 S\u1ED0" })] })] }), (0, u.jsx)("button", { className: "btn-secondary px-2.5 py-1 text-sm", onClick: () => {
    R.playModalClose(), b(false);
  }, children: "\u2715" })] }), (0, u.jsxs)("div", { className: "mt-4 flex flex-col gap-3 text-xs leading-relaxed text-slate-300", children: [(0, u.jsxs)("div", { className: "bg-slate-900 border border-rose-500/60 rounded-xl p-3", children: [(0, u.jsxs)("div", { className: "font-extrabold text-rose-400 text-sm flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "\u2696\uFE0F" }), " C\xC2N B\u1EB0NG T\u01AF\u1EDANG (11.8) \u2014 GI\u1EA2M S\xC1T TH\u01AF\u01A0NG LU\u1EACN"] }), (0, u.jsxs)("p", { className: "mt-1", children: [(0, u.jsx)("b", { children: "N\u1ED9i t\u1EA1i V\u1EBFt N\u1EE9t Kh\xF4ng Gian:" }), " Gi\u1EA3m s\xE1t th\u01B0\u01A1ng m\u1ED7i nh\u1ECBp v\u1EBFt n\u1EE9t t\u1EEB 11 + 22% AP (m\u1ED7i 0,45s) xu\u1ED1ng c\u00F2n 7 + 13% AP (m\u1ED7i 0,5s), gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a 14 \u0111o\u1EA1n v\u1EBFt n\u1EE9t ch\u1ED3ng ch\xE9o.", (0, u.jsx)("br", {}), (0, u.jsx)("b", { children: "Chi\xEAu 1 \u2014 M\u1EA3nh V\u1EE1 Kh\xF4ng Gian (C1):" }), " Gi\u1EA3m s\xE1t th\u01B0\u01A1ng m\u1ED7i m\u1EA3nh n\u0103ng l\u01B0\u1EE3ng t\u1EEB 42 + 58% AP xu\u1ED1ng c\u00F2n 28 + 38% AP (v\u1EABn gi\u1EEF xuy\xEAn th\u1EA5u v\xE0 ph\xE2n nh\xE1nh qua C\u1ED5ng C2)."] })] }), (0, u.jsxs)("div", { className: "bg-slate-900 border border-amber-500/60 rounded-xl p-3", children: [(0, u.jsxs)("div", { className: "font-extrabold text-amber-400 text-sm flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "\u{1F451}" }), " T\u0102NG S\u1EE8C M\u1EA0NH BOSS & 9 \u0110\u1EA0I TR\xD9M \u0110\u1ED8C B\u1EA2N"] }), (0, u.jsxs)("p", { className: "mt-1", children: [(0, u.jsx)("b", { children: "Buff S\u1EE9c M\u1EA1nh Boss (11.8):" }), " T\u0103ng nh\u1EB9 m\xE1u (+11% \u2192 +14%), s\xE1t th\u01B0\u01A1ng (+9% \u2192 +11%) v\xE0 t\u1ED1c \u0111\u1ED9 truy \u0111u\u1ED5i cho to\xE0n b\u1ED9 9 \u0110\u1EA1i Tr\xF9m.", (0, u.jsx)("br", {}), (0, u.jsx)("b", { children: "Boss M\xE0n 15 & Tr\xF9m Cu\u1ED1i M\xE0n 27:" }), " Thay Boss M\xE0n 15 th\xE0nh Trung Boss Ph\xE1o V\u01B0\u01A1ng C\u01A1 Gi\u1EDBi Rex (3 chi\xEAu); M\xE0n 27 l\xE0 Thi\xEAn Th\u1EA7n Sa Ng\xE3 Lucifer (6 chi\xEAu, 6 c\xE1nh).", (0, u.jsx)("br", {}), (0, u.jsx)("b", { children: "Kh\u1ED1ng ch\u1EBF Boss:" }), " B\u1EAFt \u0111\u1EA7u t\u1EEB 1,0s \u1EDF Boss 1 (M\xE0n 3) v\xE0 t\u0103ng \u0111\u1EC1u +0,2s m\u1ED7i c\u1EA5p l\xEAn 2,6s \u1EDF Boss 9 (M\xE0n 27)."] })] }), (0, u.jsxs)("div", { className: "bg-slate-900 border border-cyan-500/50 rounded-xl p-3", children: [(0, u.jsxs)("div", { className: "font-extrabold text-cyan-400 text-sm flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "\u2694\uFE0F" }), " 27 M\xC0N \xB7 9 CH\u1EE6NG QU\xC1I \xB7 CO-OP 6 S\u1ED0 (11.8)"] }), (0, u.jsxs)("p", { className: "mt-1", children: [(0, u.jsx)("b", { children: "5 Ch\u1EE7ng Qu\xE1i M\u1EDBi:" }), " X\u1EA1 Th\u1EE7 B\u0103ng, Qu\xE1i C\u1EA3m T\u1EED, S\xE1t Th\u1EE7 B\xF3ng \u0110\xEAm, Hi\u1EC7p S\u0129 Khi\xEAn (gi\u1EA3m 30% ST tr\u01B0\u1EDBc m\u1EB7t) v\xE0 T\xEDn \u0110\u1ED3 H\u01B0 Kh\xF4ng.", (0, u.jsx)("br", {}), (0, u.jsx)("b", { children: "Trang b\u1ECB & Co-op Online:" }), " S\u1EAFp x\u1EBFp kho trang b\u1ECB theo \u0111\u1ED9 hi\u1EBFm chu\u1EA9n x\xE1c; h\u1ED7 tr\u1EE3 m\xE3 ph\xF2ng/P2P 6 s\u1ED1 ng\u1EABu nhi\xEAn v\xE0 t\u1EF1 \u0111\u1ED9ng chuy\u1EC3n kh\xE1ch v\xE0o ph\xF2ng & tr\u1EADn \u0111\u1EA5u."] })] })] }), (0, u.jsx)("div", { className: "mt-4 text-right", children: (0, u.jsx)("button", { className: "btn-primary text-xs px-6 py-2", onClick: () => {
    R.playModalClose(), b(false);
  }, children: "\u0110\xE3 Hi\u1EC3u" }) })] }) }), shareGuideOpen && (0, u.jsx)("div", { className: "modal-backdrop", style: { zIndex: 95 }, children: (0, u.jsxs)("div", { className: "modal-box max-w-[520px]", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center border-b border-slate-800 pb-3", children: [(0, u.jsxs)("div", { className: "flex items-center gap-2", children: [(0, u.jsx)("span", { className: "text-2xl", children: "\u{1F4F1}" }), (0, u.jsxs)("div", { children: [(0, u.jsx)("h3", { className: "font-moba text-lg font-black text-white", children: "Ch\u01A1i Tr\xEAn iPhone / Zalo / Messenger" }), (0, u.jsx)("span", { className: "text-[11px] text-cyan-300 font-bold", children: "M\u1EDE B\u1EB0NG SAFARI & TO\xC0N M\xC0N H\xCCNH 100%" })] })] }), (0, u.jsx)("button", { className: "btn-secondary px-2.5 py-1 text-sm", onClick: () => {
    R.playModalClose(), setShareGuideOpen(false);
  }, children: "\u2715" })] }), (0, u.jsxs)("div", { className: "mt-3.5 space-y-3 text-xs leading-relaxed text-slate-300", children: [(0, u.jsxs)("div", { className: "rounded-xl bg-amber-950/40 border border-amber-400/50 p-3 text-amber-100", children: [(0, u.jsx)("div", { className: "font-bold text-amber-300 mb-1", children: "\u26A0\uFE0F V\u00EC sao kh\xF4ng m\u1EDF \u0111\u01B0\u1EE3c file .html g\u1EEDi qua Zalo / Messenger tr\xEAn iOS?" }), (0, u.jsx)("p", { children: "iOS v\xE0 tr\xECnh duy\u1EC7t trong app Zalo/Messenger ch\u1EB7n ch\u1EA1y JavaScript t\u1EEB file .html t\u1EA3i v\u1EC1 v\xE0 ch\u1EB7n API to\xE0n m\xE0n h\xECnh. H\xE3y g\u1EEDi Link Web ch\u01A1i ngay d\u01B0\u1EDBi \u0111\xE2y \u0111\u1EC3 b\u1EA1n b\u00E8 m\u1EDF tr\u1EF1c ti\u1EBFp tr\xEAn Safari!" })] }), (0, u.jsxs)("div", { className: "rounded-xl bg-slate-900 border border-slate-700 p-3 space-y-1.5", children: [(0, u.jsx)("div", { className: "font-bold text-white", children: "C\xE1ch m\u1EDF t\u1EEB Zalo / Messenger tr\xEAn iPhone/iPad:" }), (0, u.jsx)("div", { children: "1. B\u1EA5m v\xE0o link game trong tin nh\u1EAFn Zalo ho\u1EB7c Messenger." }), (0, u.jsx)("div", { children: "2. Ch\u1ECDn bi\u1EC3u t\u01B0\u1EE3ng \u22EF ho\u1EB7c \u22EE \u1EDF g\xF3c tr\xEAn b\xEAn ph\u1EA3i \u2192 ch\u1ECDn 'M\u1EDF b\u1EB1ng tr\xECnh duy\u1EC7t' (Safari)." }), (0, u.jsx)("div", { children: "3. Tr\xEAn Safari, b\u1EA5m n\xFAt Chia s\u1EBB \u2B06 \u2192 'Th\xEAm v\xE0o M\xE0n h\xECnh ch\xEDnh' \u0111\u1EC3 ch\u01A1i full m\xE0n h\xECnh nh\u01B0 app!" })] }), (0, u.jsxs)("div", { className: "flex flex-col sm:flex-row gap-2 pt-1", children: [(0, u.jsx)("button", { className: "btn-primary flex-1 py-2.5 text-xs", onClick: handleCopyPlayLink, children: shareCopied ? "\u2713 \u0110\xE3 Sao Ch\xE9p Link!" : "\u{1F517} Chia S\u1EBB / Copy Link Ch\u01A1i Ngay" }), (0, u.jsx)("button", { className: "btn-secondary flex-1 py-2.5 text-xs border-emerald-500/50 text-emerald-200", onClick: () => {
    setShareGuideOpen(false);
    toggleFullscreen();
  }, children: "\u26F6 B\u1EADt To\xE0n Khung Ngay" })] })] })] }) }), x && (0, u.jsx)("div", { className: "modal-backdrop", children: (0, u.jsxs)("div", { className: "modal-box", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center border-b border-slate-800 pb-3", children: [(0, u.jsx)("h3", { className: "font-moba text-lg font-bold text-white", children: ze.guide }), (0, u.jsx)("button", { className: "btn-secondary px-2.5 py-1 text-sm", onClick: () => {
    R.playModalClose(), C(false);
  }, children: "\u2715" })] }), (0, u.jsx)("div", { className: "mt-4 text-xs leading-relaxed text-slate-300", children: (0, u.jsx)("ol", { className: "list-decimal pl-5 flex flex-col gap-2", children: ze.guideItems.map((w, j) => (0, u.jsx)("li", { children: w }, j)) }) }), (0, u.jsx)("div", { className: "mt-5 text-right", children: (0, u.jsx)("button", { className: "btn-primary text-xs px-6 py-2", onClick: () => {
    R.playModalClose(), C(false);
  }, children: "\u0110\xE3 Hi\u1EC3u" }) })] }) }), H && (0, u.jsx)("div", { className: "modal-backdrop", children: (0, u.jsxs)("div", { className: "modal-box max-w-[420px]", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center border-b border-slate-800 pb-3", children: [(0, u.jsx)("h3", { className: "font-moba text-lg font-bold text-white", children: ze.settings }), (0, u.jsx)("button", { className: "btn-secondary px-2.5 py-1 text-sm", onClick: () => {
    R.playModalClose(), D(false);
  }, children: "\u2715" })] }), (0, u.jsxs)("div", { className: "mt-4 flex flex-col gap-4 text-xs", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-300", children: "Ng\xF4n Ng\u1EEF" }), (0, u.jsx)("button", { className: "btn-secondary text-xs px-3 py-1", onClick: () => {
    R.playTabSwitch(), J();
  }, children: c === "vi" ? "Ti\u1EBFng Vi\u1EC7t" : "English" })] }), (0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-300", children: "Hi\u1EC7u \u1EE8ng \xC2m Thanh (SFX)" }), (0, u.jsxs)("div", { className: "flex items-center gap-1.5", children: [(0, u.jsx)("button", { type: "button", className: "btn-secondary text-xs px-2.5 py-1 border-amber-500/40 text-amber-200", onClick: () => R.playTestSample(), children: c === "vi" ? "Th\u1EED \xC2m Thanh" : "Test SFX" }), (0, u.jsx)("button", { className: `btn-secondary text-xs px-3 py-1 ${Ft ? "text-emerald-400" : "text-slate-500"}`, onClick: () => {
    R.playClick(), Nt(!Ft);
  }, children: Ft ? "B\u1EACT" : "T\u1EAET" })] })] }), (0, u.jsxs)("div", { children: [(0, u.jsxs)("div", { className: "flex justify-between text-xs text-slate-400 mb-1 font-mono-numbers", children: [(0, u.jsx)("span", { children: "\xC2m L\u01B0\u1EE3ng Hi\u1EC7u \u1EE8ng" }), (0, u.jsxs)("span", { children: [Math.round(U * 100), "%"] })] }), (0, u.jsx)("input", { type: "range", min: "0", max: "1", step: "0.05", value: U, onChange: (w) => pe(parseFloat(w.target.value)), className: "w-full accent-amber-500" })] }), (0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-300", children: "Nh\u1EA1c N\u1EC1n (BGM)" }), (0, u.jsx)("button", { className: `btn-secondary text-xs px-3 py-1 ${musicOn ? "text-emerald-400" : "text-slate-500"}`, onClick: () => {
    R.playClick(), setMusicOn(!musicOn);
  }, children: musicOn ? "B\u1EACT" : "T\u1EAET" })] }), (0, u.jsxs)("div", { children: [(0, u.jsxs)("div", { className: "flex justify-between text-xs text-slate-400 mb-1 font-mono-numbers", children: [(0, u.jsx)("span", { children: "\xC2m L\u01B0\u1EE3ng Nh\u1EA1c N\u1EC1n" }), (0, u.jsxs)("span", { children: [Math.round(musicVol * 100), "%"] })] }), (0, u.jsx)("input", { type: "range", min: "0", max: "1", step: "0.05", value: musicVol, onChange: (w) => setMusicVol(parseFloat(w.target.value)), className: "w-full accent-cyan-400" })] }), (0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-300", children: "Rung M\xE0n H\xECnh" }), (0, u.jsx)("button", { className: `btn-secondary text-xs px-3 py-1 ${ne ? "text-emerald-400" : "text-slate-500"}`, onClick: () => _e(!ne), children: ne ? "B\u1EACT" : "T\u1EAET" })] }), (0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-300", children: "S\u1ED1 S\xE1t Th\u01B0\u01A1ng Bay" }), (0, u.jsx)("button", { className: `btn-secondary text-xs px-3 py-1 ${Z ? "text-emerald-400" : "text-slate-500"}`, onClick: () => tt(!Z), children: Z ? "B\u1EACT" : "T\u1EAET" })] }), (0, u.jsxs)("div", { className: "pt-2 border-t border-slate-800 flex flex-col gap-2", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-200 font-semibold", children: "Giao Di\u1EC7n M\xE0n H\xECnh" }), (0, u.jsx)("span", { className: "text-[11px] text-cyan-300 font-moba font-bold", children: isPortraitHud ? "\u0110ang d\xF9ng: \u0110i\u1EC7n Tho\u1EA1i \u0110\u1EE9ng" : "\u0110ang d\xF9ng: Ti\xEAu Chu\u1EA9n" })] }), (0, u.jsx)("div", { className: "grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800", children: [{ k: "auto", label: "T\u1EF1 \u0111\u1ED9ng" }, { k: "portrait", label: "\u0110i\u1EC7n tho\u1EA1i \u0111\u1EE9ng" }, { k: "standard", label: "Ti\xEAu chu\u1EA9n" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-2 px-1.5 rounded-md text-[11px] font-moba font-bold transition-colors ${layoutMode === opt.k ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`, onClick: () => {
    R.playClick(), setLayoutMode(opt.k);
  }, children: opt.label }, opt.k)) })]  }), (0, u.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-200 font-semibold", children: "T\u1EA7m Nh\xECn Camera (\u0110\u1EE9ng)" }), (0, u.jsxs)("span", { className: "text-[11px] text-amber-300 font-mono-numbers", children: [portraitVp.visibleWorldW, "px ngang"] })] }), (0, u.jsx)("div", { className: "grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800", children: [{ k: "wide", label: "Si\xEAu r\u1ED9ng" }, { k: "balanced", label: "C\xE2n b\u1EB1ng" }, { k: "close", label: "G\u1EA7n (R\xF5)" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-2 px-1.5 rounded-md text-[11px] font-moba font-bold transition-colors ${portraitFov === opt.k ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`, onClick: () => {
    R.playClick(), setPortraitFov(opt.k);
  }, children: opt.label }, opt.k)) })] }), (0, u.jsxs)("div", { className: "pt-2 border-t border-slate-800 flex flex-col gap-2", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-200 font-semibold", children: "Ch\u1EA5t L\u01B0\u1EE3ng \u0110\u1ED3 H\u1ECDa" }), (0, u.jsx)("span", { className: "text-[11px] text-emerald-300 font-moba font-bold", children: qualityMode === "auto" ? "T\u1EF1 \u0111\u1ED9ng t\u1ED1i \u01B0u" : qualityMode === "high" ? "Hi\u1EC7u \u1EE9ng t\u1ED1i \u0111a" : qualityMode === "balanced" ? "C\xE2n b\u1EB1ng m\u01B0\u1EE3t" : "Ti\u1EBFt ki\u1EC7m pin" })] }), (0, u.jsx)("div", { className: "grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800", children: [{ k: "auto", label: "T\u1EF1 \u0111\u1ED9ng" }, { k: "high", label: "Cao" }, { k: "balanced", label: "C\xE2n b\u1EB1ng" }, { k: "saver", label: "M\u01B0\u1EE3t/Pin" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-2 px-1 rounded-md text-[10px] font-moba font-bold transition-colors ${qualityMode === opt.k ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`, onClick: () => {
    R.playClick(), setQualityMode(opt.k);
  }, children: opt.label }, opt.k)) })] }), (0, u.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center", children: [(0, u.jsx)("span", { className: "text-slate-200 font-semibold", children: "Gi\u1EDBi H\u1EA1n FPS" }), (0, u.jsx)("span", { className: "text-[11px] text-amber-300 font-mono-numbers font-bold", children: fpsCapMode === "auto" ? "T\u1EF1 \u0111\u1ED9ng theo m\xE1y" : `${fpsCapMode} FPS` })] }), (0, u.jsx)("div", { className: "grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800", children: [{ k: "auto", label: "T\u1EF1 \u0111\u1ED9ng" }, { k: "60", label: "60 FPS" }, { k: "45", label: "45 FPS" }, { k: "30", label: "30 FPS" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-2 px-1 rounded-md text-[10px] font-moba font-bold transition-colors ${fpsCapMode === opt.k ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`, onClick: () => {
    R.playClick(), setFpsCapMode(opt.k);
  }, children: opt.label }, opt.k)) })] })] }), (0, u.jsx)("div", { className: "mt-5 text-right", children: (0, u.jsx)("button", { className: "btn-primary text-xs px-6 py-2", onClick: () => {
    R.playModalClose(), D(false);
  }, children: "\u0110\xF3ng" }) })] }) }), (l === "PAUSED" || l === "PLAYING" && mpMenuOpen) && (0, u.jsx)("div", { className: "modal-backdrop", children: (0, u.jsxs)("div", { className: "modal-box pause-modal-box max-w-[340px] text-center", children: [(0, u.jsx)("h3", { className: "font-moba text-xl font-black text-white", children: a.current?.multiplayer?.active ? `PH\xD2NG CO-OP ${mpRoom?.roomId || ""}` : ze.pause }), (0, u.jsxs)("div", { className: "mt-3.5 flex flex-col gap-2", children: [(0, u.jsx)("button", { className: "btn-primary py-2 text-xs sm:text-sm", onClick: ve, children: ze.resume }), (0, u.jsxs)("div", { className: "bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-left flex flex-col gap-1.5", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between text-[11px]", children: [(0, u.jsx)("span", { className: "text-slate-300 font-semibold", children: "Giao di\u1EC7n chi\u1EBFn \u0111\u1EA5u" }), (0, u.jsx)("span", { className: "text-cyan-300 font-moba font-bold", children: isPortraitHud ? "\u0110\u1EE9ng (T\u1EA7m nh\xECn r\u1ED9ng)" : "Ti\xEAu chu\u1EA9n" })] }), (0, u.jsx)("div", { className: "grid grid-cols-3 gap-1", children: [{ k: "auto", label: "T\u1EF1 \u0111\u1ED9ng" }, { k: "portrait", label: "\u0110\u1EE9ng" }, { k: "standard", label: "Chu\u1EA9n" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-1 rounded-lg text-[11px] font-moba font-bold ${layoutMode === opt.k ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`, onClick: () => {
    R.playClick(), setLayoutMode(opt.k);
  }, children: opt.label }, opt.k)) }), isPortraitHud && (0, u.jsx)("div", { className: "grid grid-cols-3 gap-1 pt-1 border-t border-slate-800", children: [{ k: "wide", label: "R\u1ED9ng 820" }, { k: "balanced", label: "C\xE2n b\u1EB1ng" }, { k: "close", label: "G\u1EA7n 560" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-1 rounded-lg text-[11px] font-moba font-bold ${portraitFov === opt.k ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300"}`, onClick: () => {
    R.playClick(), setPortraitFov(opt.k);
  }, children: opt.label }, opt.k)) }), (0, u.jsxs)("div", { className: "pt-1.5 border-t border-slate-800 flex flex-col gap-1", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between text-[11px]", children: [(0, u.jsx)("span", { className: "text-slate-300 font-semibold", children: "\u0110\u1ED3 h\u1ECDa & Pin" }), (0, u.jsx)("span", { className: "text-emerald-300 font-moba font-bold", children: fpsCapMode === "auto" ? "FPS T\u1EF1 \u0111\u1ED9ng" : `${fpsCapMode} FPS` })] }), (0, u.jsx)("div", { className: "grid grid-cols-4 gap-1", children: [{ k: "auto", label: "T\u1EF1 \u0111\u1ED9ng" }, { k: "high", label: "Cao" }, { k: "balanced", label: "V\u1EEBa" }, { k: "saver", label: "M\u01B0\u1EE3t" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-1 rounded-lg text-[10px] font-moba font-bold ${qualityMode === opt.k ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`, onClick: () => {
    R.playClick(), setQualityMode(opt.k);
  }, children: opt.label }, opt.k)) }), (0, u.jsx)("div", { className: "grid grid-cols-4 gap-1", children: [{ k: "auto", label: "Auto" }, { k: "60", label: "60" }, { k: "45", label: "45" }, { k: "30", label: "30" }].map((opt) => (0, u.jsx)("button", { type: "button", className: `py-1 rounded-lg text-[10px] font-mono-numbers font-bold ${fpsCapMode === opt.k ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`, onClick: () => {
    R.playClick(), setFpsCapMode(opt.k);
  }, children: opt.k === "auto" ? "Auto" : `${opt.label}fps` }, opt.k)) })] })] }), (0, u.jsx)("button", { className: "btn-secondary py-2 text-xs sm:text-sm border-emerald-500/40 text-emerald-200", onClick: toggleFullscreen, children: fsActive ? "\u2922 Tho\xE1t To\xE0n M\xE0n H\xECnh" : "\u26F6 B\u1EADt To\xE0n M\xE0n H\xECnh" }), (0, u.jsx)("button", { className: "btn-secondary py-2 text-xs sm:text-sm border-cyan-500/40 text-cyan-200", onClick: () => ye(true), children: "B\u1EA3ng K\u1EF9 N\u0103ng & Ch\u1EC9 S\u1ED1" }), (0, u.jsx)("button", { className: "btn-secondary py-2 text-xs sm:text-sm border-amber-500/40 text-amber-200", onClick: () => {
    je(p.id), N(true);
  }, children: "\u{1FA99} C\u1EEDa H\xE0ng Trang B\u1ECB" }), a.current?.multiplayer?.active ? (0, u.jsxs)(u.Fragment, { children: [mpRoom?.hostId === mpClient.playerId && (0, u.jsx)("button", { className: "btn-secondary py-2 text-xs sm:text-sm border-emerald-500/40 text-emerald-200", onClick: () => {
    R.playClick();
    mpClient.restartMatch();
    setMpMenuOpen(false);
  }, children: "\u{1F501} Ch\u01A1i L\u1EA1i C\u1EA3 \u0110\u1ED9i" }), (0, u.jsx)("button", { className: "btn-danger py-2.5 text-sm", onClick: () => {
    handleLeaveRoom();
    m("MENU");
  }, children: "\u{1F6AA} R\u1EDDi Ph\xF2ng Co-op" })] }) : (0, u.jsxs)(u.Fragment, { children: [(0, u.jsx)("button", { className: "btn-secondary py-2.5 text-sm", onClick: () => {
    a.current && (lastTrackedMatchKillsRef.current = 0, lastRecordedEndKeyRef.current = "", a.current.startNewGame(p, a.current.selectedMapId, { resetCoins: true }), v(a.current.playerCoins)), m("PLAYING");
  }, children: ze.restart }), (0, u.jsx)("button", { className: "btn-secondary py-2.5 text-sm text-slate-400", onClick: () => {
    a.current && (a.current.captureCurrentRunCheckpoint?.(), a.current.saveGame(), a.current.gameState = "MENU", setResumableRun(a.current.getSavedRunSnapshot?.() || null)), m("MENU");
  }, children: ze.mainMenu })] })] })] }) }), De && ce && (0, u.jsx)("div", { className: "modal-backdrop", children: (0, u.jsxs)("div", { className: "modal-box max-w-[480px] text-center", children: [(0, u.jsx)("div", { className: "text-amber-400 font-mono-numbers text-xs font-bold tracking-wider", children: c === "vi" ? "CHI\u1EBEN TH\u1EAENG \u0110\u1EE2T QU\xC1I" : "WAVE CLEARED" }), (0, u.jsx)("h3", { className: "font-moba text-2xl font-black text-white mt-1", children: c === "vi" ? `Ho\xE0n Th\xE0nh M\xE0n ${ce.wave}` : `Wave ${ce.wave} Complete` }), (0, u.jsxs)("div", { className: `speed-badge ${ce.speedClass} my-3 mx-auto`, children: [(0, u.jsx)("span", { children: "\u26A1" }), (0, u.jsx)("span", { children: ce.speedText })] }), (0, u.jsxs)("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-left text-xs text-slate-300", children: [(0, u.jsxs)("div", { className: "flex justify-between py-1 border-b border-slate-800", children: [(0, u.jsx)("span", { className: "text-slate-400", children: "Th\u1EDDi gian:" }), (0, u.jsxs)("span", { className: "font-mono-numbers font-bold text-cyan-400", children: [ce.elapsedFormatted, " / ", ce.targetFormatted] })] }), (0, u.jsxs)("div", { className: "flex justify-between py-1 border-b border-slate-800", children: [(0, u.jsx)("span", { className: "text-slate-400", children: "Qu\xE1i ti\xEAu di\u1EC7t:" }), (0, u.jsx)("span", { className: "font-mono-numbers font-bold text-white", children: ce.kills })] }), (0, u.jsxs)("div", { className: "flex justify-between py-1", children: [(0, u.jsx)("span", { children: "Xu c\u01A1 b\u1EA3n:" }), (0, u.jsxs)("span", { className: "font-mono-numbers font-bold text-amber-300", children: ["+", ce.baseCoins, " Xu"] })] }), (0, u.jsxs)("div", { className: "flex justify-between py-1", children: [(0, u.jsx)("span", { children: "Th\u01B0\u1EDFng t\u1ED1c \u0111\u1ED9:" }), (0, u.jsxs)("span", { className: "font-mono-numbers font-bold text-cyan-300", children: ["+", ce.speedCoins, " Xu"] })] }), ce.bossCoins > 0 && (0, u.jsxs)("div", { className: "flex justify-between py-1 text-red-300 font-bold", children: [(0, u.jsx)("span", { children: "Th\u01B0\u1EDFng h\u1EA1 g\u1EE5c Boss:" }), (0, u.jsxs)("span", { className: "font-mono-numbers", children: ["+", ce.bossCoins, " Xu"] })] }), (0, u.jsxs)("div", { className: "mt-2 pt-2 border-t border-slate-800 flex justify-between items-baseline font-black", children: [(0, u.jsx)("span", { className: "text-white text-sm", children: "T\u1ED5ng Xu Nh\u1EADn \u0110\u01B0\u1EE3c:" }), (0, u.jsxs)("span", { className: "font-mono-numbers text-xl text-amber-400", children: ["+", ce.totalEarned, " \u{1FA99}"] })] })] }), a.current?.multiplayer?.active && mpRoom?.members && (0, u.jsxs)("div", { className: "mt-2.5 bg-slate-900/90 border border-cyan-500/35 rounded-xl p-2.5 text-left text-[11px]", children: [(0, u.jsx)("div", { className: "font-moba font-bold text-cyan-300 mb-1.5", children: "TR\u1EA0NG TH\xC1I \u0110\u1ED2NG \u0110\u1ED8I" }), (0, u.jsx)("div", { className: "grid grid-cols-2 gap-1.5", children: mpRoom.members.map((mem) => (0, u.jsxs)("div", { className: "flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 gap-1", children: [(0, u.jsx)("span", { className: "truncate text-slate-200 font-semibold", children: mem.name }), (0, u.jsx)("span", { className: `shrink-0 font-bold ${mem.isHost ? "text-amber-300" : mem.readyNextWave ? "text-emerald-400" : "text-slate-400"}`, children: mem.isHost ? "\u{1F451} Ch\u1EE7" : mem.readyNextWave ? "\u2713 S\u1EB5n" : "\u23F3 Ch\u1EDD" })] }, mem.id)) })] }), (0, u.jsxs)("div", { className: "mt-4 flex gap-2.5", children: [(0, u.jsx)("button", { className: "btn-secondary flex-1 py-2.5 text-xs border-amber-500/40 text-amber-200", onClick: () => {
    je(p.id), N(true);
  }, children: "\u{1FA99} V\xE0o C\u1EEDa H\xE0ng" }), a.current?.multiplayer?.active && mpRoom ? (() => {
    let isHost = mpRoom.hostId === mpClient.playerId;
    let myMem = mpRoom.members?.find((mem) => mem.id === mpClient.playerId);
    return isHost ? (0, u.jsx)("button", { className: "btn-primary flex-1 py-2.5 text-xs font-bold", onClick: () => {
      R.playClick();
      mpClient.nextWave();
    }, children: ce.isFinalWave ? c === "vi" ? "Chinh Ph\u1EE5c!" : "Victory!" : c === "vi" ? "M\xE0n Ti\u1EBFp Theo \u2192" : "Next Wave \u2192" }) : (0, u.jsx)("button", { className: `flex-1 py-2.5 text-xs font-bold rounded-xl border ${myMem?.readyNextWave ? "bg-emerald-600/25 border-emerald-400 text-emerald-200" : "btn-primary"}`, onClick: () => {
      R.playClick();
      mpClient.setWaveReady(!myMem?.readyNextWave);
    }, children: myMem?.readyNextWave ? "\u2713 \u0110\xE3 S\u1EB5n S\xE0ng (Ch\u1EDD \u0110\u1ED9i Tr\u01B0\u1EDFng)" : "S\u1EB5n S\xE0ng M\xE0n Ti\u1EBFp \u2192" });
  })() : (0, u.jsx)("button", { className: "btn-primary flex-1 py-2.5 text-xs font-bold", onClick: () => {
    nt(false);
    let w = a.current;
    w && (w.waitingReward = false, w.waveCleared = false, w.wave >= 27 ? (w._matchEndedPendingReset = true, w.gameState = "VICTORY", w.clearSavedRun?.(false), w.unlockCitadelIfEligible?.(), w.saveGame(), w.onGameOver?.(true), m("VICTORY")) : w.startWave(w.wave + 1));
  }, children: ce.isFinalWave ? c === "vi" ? "Chinh Ph\u1EE5c!" : "Victory!" : c === "vi" ? "M\xE0n Ti\u1EBFp Theo \u2192" : "Next Wave \u2192" })] })] }) }), (l === "GAME_OVER" || l === "VICTORY") && (0, u.jsx)("div", { className: "modal-backdrop", children: (0, u.jsxs)("div", { className: "modal-box max-w-[460px] text-center", children: [(0, u.jsx)("div", { className: "w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400 text-3xl", children: l === "VICTORY" ? "\u{1F451}" : "\u{1F480}" }), (0, u.jsx)("h3", { className: "font-moba text-2xl font-black text-white", children: l === "VICTORY" ? ze.victory : ze.defeat }), (0, u.jsx)("p", { className: "text-xs text-slate-400 mt-1", children: l === "VICTORY" ? ze.victorySub : ze.defeatSub }), (() => {
    if (l !== "VICTORY") return null;
    const nextMapId = getNextCampaignMapId(a.current?.activeMapId || "classic");
    if (nextMapId && isMapUnlocked(nextMapId, unlockedMaps, founderUnlocked)) {
      const nextMeta = ARENA_MAPS[nextMapId];
      const nextName = (nextMeta?.name?.[c === "en" ? "en" : "vi"] || nextMapId).toUpperCase();
      return (0, u.jsx)("div", { className: "mt-2 px-3 py-2 rounded-xl bg-rose-950/75 border border-rose-400/60 text-rose-100 text-xs font-moba font-bold", children: c === "vi" ? `🗺️ Bản đồ tiếp theo ĐÃ MỞ KHÓA: ${nextName}! Chọn trong Sảnh Chính.` : `🗺️ Next Map UNLOCKED: ${nextName}! Select it in the Lobby.` });
    }
    if (!nextMapId) {
      return (0, u.jsx)("div", { className: "mt-2 px-3 py-2 rounded-xl bg-sky-950/75 border border-sky-400/60 text-sky-100 text-xs font-moba font-bold", children: c === "vi" ? "🏆 CHÚC MỪNG! Bạn đã chinh phục trọn vẹn cả 4 Bản Đồ Chiến Trường!" : "🏆 CONGRATULATIONS! You conquered all 4 Campaign Battlegrounds!" });
    }
    return null;
  })(), (0, u.jsxs)("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-3 my-3 grid grid-cols-2 gap-2 text-left text-xs font-mono-numbers", children: [(0, u.jsxs)("div", { children: [(0, u.jsx)("span", { className: "text-slate-400 text-[10px]", children: "M\xE0n ch\u01A1i:" }), (0, u.jsxs)("div", { className: "text-amber-400 font-bold text-sm", children: [a.current?.wave || 1, " / 27"] })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("span", { className: "text-slate-400 text-[10px]", children: "Ti\xEAu di\u1EC7t:" }), (0, u.jsx)("div", { className: "text-white font-bold text-sm", children: a.current?.totalKilled || 0 })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("span", { className: "text-slate-400 text-[10px]", children: "C\u1EA5p \u0111\u1ED9:" }), (0, u.jsx)("div", { className: "text-emerald-400 font-bold text-sm", children: ["Lv.", a.current?.player?.level || 1] })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("span", { className: "text-slate-400 text-[10px]", children: "T\u1ED5ng s\xE1t th\u01B0\u01A1ng:" }), (0, u.jsx)("div", { className: "text-rose-400 font-bold text-sm", children: (a.current?.player?.totalDamage || 0).toLocaleString() })] })] }), (a.current?.multiplayer?.active || mpMatchResult) && (mpMatchResult?.room?.members || mpRoom?.members) && (0, u.jsxs)("div", { className: "bg-slate-900/90 border border-cyan-500/35 rounded-xl p-2.5 mb-3 text-left text-xs", children: [(0, u.jsx)("div", { className: "text-[10px] font-moba font-bold text-cyan-300 uppercase tracking-wider mb-1.5", children: "B\u1EA3ng S\xE1t Th\u01B0\u01A1ng \u0110\u1ED3ng \u0110\u1ED9i" }), (0, u.jsx)("div", { className: "space-y-1", children: (mpMatchResult?.room?.members || mpRoom?.members || []).map((mem) => (0, u.jsxs)("div", { className: "flex items-center justify-between font-mono-numbers text-[11px]", children: [(0, u.jsxs)("span", { className: "text-slate-200 truncate", children: [mem.isHost ? "\u{1F451} " : "", mem.name] }), (0, u.jsx)("span", { className: "text-rose-400 font-bold", children: [(mem.totalDamage || 0).toLocaleString(), " DMG"] })] }, mem.id)) })] }), (0, u.jsxs)("div", { className: "flex flex-col gap-2", children: [a.current?.multiplayer?.active || mpMatchResult ? (0, u.jsxs)(u.Fragment, { children: [(mpMatchResult?.room?.hostId || mpRoom?.hostId) === mpClient.playerId && (0, u.jsx)("button", { className: "btn-primary py-2.5 text-xs font-bold", onClick: () => {
    R.playClick();
    mpClient.restartMatch();
  }, children: "\u{1F501} Ch\u01A1i L\u1EA1i (C\xF9ng Ph\xF2ng)" }), (0, u.jsx)("button", { className: "btn-secondary py-2.5 text-xs border-cyan-500/50 text-cyan-200", onClick: () => {
    R.playClick();
    a.current?.stopCoopMode();
    setMpMatchResult(null);
    m("MENU");
    setMpLobbyOpen(true);
  }, children: "\u{1F310} V\u1EC1 S\u1EA3nh Ph\xF2ng" }), (0, u.jsx)("button", { className: "btn-secondary py-2.5 text-xs text-slate-400", onClick: () => {
    handleLeaveRoom();
    m("MENU");
  }, children: "\u{1F3E0} R\u1EDDi Ph\xF2ng V\u1EC1 Menu" })] }) : (0, u.jsxs)(u.Fragment, { children: [(0, u.jsx)("button", { className: "btn-primary py-2.5 text-xs font-bold", onClick: () => {
    a.current && (lastTrackedMatchKillsRef.current = 0, lastRecordedEndKeyRef.current = "", a.current.startNewGame(p, a.current.selectedMapId, { resetCoins: true }), v(a.current.playerCoins)), m("PLAYING");
  }, children: ze.restart }), (0, u.jsx)("button", { className: "btn-secondary py-2.5 text-xs", onClick: () => m("HERO_SELECT"), children: ze.changeHero }), (0, u.jsx)("button", { className: "btn-secondary py-2.5 text-xs text-slate-400", onClick: () => m("MENU"), children: ze.mainMenu })] })] })] })  }), P && (0, u.jsx)(Jf, { engine: a.current, coins: f, shopHeroId: ht, buildRevision: qe, founderUnlocked, onChangeHero: (w) => {
    if (w === "thien" && !founderUnlockedRef.current) {
      requireFounderUnlock(() => je("thien"));
      return;
    }
    je(w);
  }, onClose: () => {
    R.playModalClose(), N(false);
    if (googleUserRef.current?.uid) {
      void syncCloudProgress(googleUserRef.current, playerProfileRef.current, null, false);
    }
  }, onOpenBuilds: () => {
    R.playModalOpen(), V(true);
  }, onCoinsChange: (w) => v(w), onShowToast: G }), W && (0, u.jsx)("div", { className: "modal-backdrop", style: { zIndex: 1e4 }, children: (0, u.jsxs)("div", { className: "modal-box max-w-[760px] max-h-[85vh] flex flex-col", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center border-b border-slate-800 pb-2.5", children: [(0, u.jsxs)("div", { children: [(0, u.jsx)("h3", { className: "font-moba text-lg font-black text-white", children: "G\u1EE3i \xDD L\u1ED1i L\xEAn \u0110\u1ED3" }), (0, u.jsx)("p", { className: "text-[11px] text-slate-400", children: "Trang b\u1ECB nhanh c\xE1c m\xF3n \u0111\u1ED3 b\u1EA1n \u0110\xC3 C\xD3 trong kho \u0111\u1ED3 m\xE0 kh\xF4ng t\u1EF1 \u0111\u1ED9ng mua m\xF3n ch\u01B0a s\u1EDF h\u1EEFu." })] }), (0, u.jsx)("button", { className: "btn-secondary px-2.5 py-1 text-sm", onClick: () => {
    R.playModalClose(), V(false);
  }, children: "\u2715" })] }), (0, u.jsx)("div", { className: "flex-1 overflow-y-auto mt-3 flex flex-col gap-3", children: (Ff[ht] || []).map((w) => (0, u.jsxs)("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-3", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, u.jsxs)("div", { children: [(0, u.jsx)("h4", { className: "font-moba text-sm font-bold text-amber-400", children: w.name }), (0, u.jsx)("p", { className: "text-[10px] text-slate-400", children: w.desc })] }), (0, u.jsx)("button", { className: "btn-primary text-xs px-3 py-1.5", onClick: () => {
    let j = a.current;
    if (!j) return;
    let ee = 0;
    w.items.forEach((he) => {
      let le = Si[he];
      if (!le) return;
      let X = j.inventory.findIndex((we) => we.itemId === he);
      if (X !== -1) {
        let we = le.slot, rt = j.heroGear[ht][we];
        rt && j.inventory.push(rt), j.inventory.splice(X, 1), j.heroGear[ht][we] = { uid: j.nextUid++, itemId: le.id }, ee++;
      }
    }), j.saveGame(), j.computeHeroStats(), bt((he) => he + 1), ee > 0 ? (R.playEquip(), G(`\u0110\xE3 trang b\u1ECB ${ee} m\xF3n \u0111\u1ED3 c\xF3 s\u1EB5n!`)) : (R.playError(), G("Kh\xF4ng c\xF3 m\xF3n \u0111\u1ED3 n\xE0o c\u1EE7a b\u1ED9 n\xE0y trong t\xFAi."));
  }, children: "Trang B\u1ECB \u0110\u1ED3 \u0110\xE3 C\xF3" })] }), (0, u.jsx)("div", { className: "grid grid-cols-3 sm:grid-cols-6 gap-2", children: w.items.map((j) => {
    let ee = Si[j];
    if (!ee) return null;
    let he = a.current?.inventory?.some((X) => X.itemId === j), le = a.current?.heroGear[ht] && Object.values(a.current.heroGear[ht]).some((X) => X && X.itemId === j);
    return (0, u.jsxs)("div", { className: "bg-slate-950 p-2 rounded-lg text-center border border-slate-800 flex flex-col items-center gap-1", children: [(0, u.jsx)("img", { src: ee.icon, alt: ee.name, referrerPolicy: "no-referrer", className: "w-9 h-9 rounded-md object-contain bg-[#090D16] border border-slate-700" }), (0, u.jsx)("div", { className: "text-[10px] font-bold text-white truncate w-full", children: ee.name }), (0, u.jsx)("div", { className: "text-[9px]", children: le ? (0, u.jsx)("span", { className: "text-emerald-400", children: "\u0110ang m\u1EB7c" }) : he ? (0, u.jsx)("span", { className: "text-amber-400", children: "C\xF3 trong t\xFAi" }) : (0, u.jsx)("span", { className: "text-slate-500", children: "Ch\u01B0a c\xF3" }) })] }, j);
  }) })] }, w.id)) })] }) }), oe && (0, u.jsx)("div", { className: "modal-backdrop", style: { zIndex: 1e4 }, children: (0, u.jsxs)("div", { className: "modal-box max-w-[780px] max-h-[88vh] flex flex-col", children: [(0, u.jsxs)("div", { className: "flex justify-between items-center border-b border-slate-800 pb-3 gap-2", children: [(0, u.jsxs)("div", { className: "flex items-center gap-3", children: [(0, u.jsx)(Wt, { heroId: p.id, skillId: p.skills.length >= 4 ? "c4" : "c3", size: 44, roundedClass: "rounded-xl" }), (0, u.jsxs)("div", { children: [(0, u.jsxs)("h3", { className: "font-moba text-lg font-black text-white", children: ["B\u1EA3ng K\u1EF9 N\u0103ng & N\xE2ng C\u1EA5p \xB7 ", p.name.split("(")[0].trim()] }), (0, u.jsxs)("div", { className: "text-xs text-amber-400 font-semibold", children: [p.title[c], " \xB7 C\u1EA5p ", a.current?.player?.level || 1] })] })] }), (0, u.jsx)("button", { className: "btn-secondary px-3 py-1.5 text-sm", onClick: () => {
    R.playModalClose(), ye(false);
  }, children: "\u2715" })] }), a.current && (() => {
    let w = a.current, j = w.getHeroGearStats(p.id), ee = Math.round(w.getEffectiveDamage()), he = Math.round(w.getEffectiveMoveSpeed()), le = (1 / Math.max(0.09, w.getEffectiveAttackInterval())).toFixed(2), X = p.id === "dung" && typeof w.getDungEffectiveCrit === "function" ? Math.round(w.getDungEffectiveCrit().critChance * 100) : Math.round(Math.min(p.maxCrit, p.baseCrit + j.crit) * 100), we = Math.round(Math.min(0.45, j.cdr) * 100);
    return (0, u.jsxs)("div", { className: "grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center font-mono-numbers tabular-nums", children: [(0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] text-slate-400", children: "HP T\u1ED1i \u0110a" }), (0, u.jsx)("div", { className: "text-xs font-bold text-emerald-400", children: w.player.maxHp })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] text-slate-400", children: "S\xE1t Th\u01B0\u01A1ng" }), (0, u.jsx)("div", { className: "text-xs font-bold text-rose-400", children: ee })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] text-slate-400", children: "T\u1ED1c \u0110\xE1nh" }), (0, u.jsxs)("div", { className: "text-xs font-bold text-amber-300", children: [le, "/s"] })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] text-slate-400", children: "T\u1ED1c Ch\u1EA1y" }), (0, u.jsx)("div", { className: "text-xs font-bold text-cyan-300", children: he })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] text-slate-400", children: "Ch\xED M\u1EA1ng" }), (0, u.jsxs)("div", { className: "text-xs font-bold text-orange-400", children: [X, "%"] })] }), (0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] text-slate-400", children: "Gi\u1EA3m H\u1ED3i" }), (0, u.jsxs)("div", { className: "text-xs font-bold text-violet-300", children: [we, "%"] })] })] });
  })(), (0, u.jsxs)("div", { className: "flex-1 overflow-y-auto mt-3 flex flex-col gap-2.5 pr-1", children: [(0, u.jsxs)("div", { className: "bg-amber-500/10 border border-amber-500/35 rounded-xl p-3 flex items-start gap-3", children: [(0, u.jsx)(Wt, { heroId: p.id, skillId: "passive", size: 56, roundedClass: "rounded-xl" }), (0, u.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, u.jsx)("div", { className: "flex items-center gap-2 text-xs", children: (0, u.jsx)("span", { className: "font-bold text-amber-300 font-moba", children: "N\u1ED9i T\u1EA1i (B\u1ECB \u0110\u1ED9ng)" }) }), (0, u.jsx)("p", { className: "text-xs text-slate-200 mt-1 leading-relaxed", children: p.passive[c] })] })] }), (0, u.jsxs)("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3", children: [(0, u.jsx)(Wt, { heroId: p.id, skillId: "atk", size: 56, roundedClass: "rounded-xl" }), (0, u.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between text-xs", children: [(0, u.jsxs)("span", { className: "font-bold text-white font-moba", children: ["\u0110\xE1nh Th\u01B0\u1EDDng \xB7 ", p.weapon[c]] }), (0, u.jsxs)("span", { className: "font-mono-numbers text-slate-400 tabular-nums", children: ["T\u1EA7m ", p.stats.range, "px"] })] }), (0, u.jsx)("p", { className: "text-xs text-slate-300 mt-1 leading-relaxed", children: "\u0110\xF2n \u0111\xE1nh c\u01A1 b\u1EA3n theo v\u0169 kh\xED \u0111\u1EB7c tr\u01B0ng c\u1EE7a t\u01B0\u1EDBng, c\u1ED9ng d\u1ED3n s\xE1t th\u01B0\u01A1ng theo c\u1EA5p \u0111\u1ED9 v\xE0 trang b\u1ECB." })] })] }), p.skills.map((w) => {
    let j = vm(p.id, w.key, c), ee = a.current ? Math.min(0.45, a.current.getHeroGearStats(p.id).cdr) : 0, he = (w.cooldown * (1 - ee)).toFixed(1), isUltSkill = w.key === "c4" || (w.key === "c3" && p.skills.length === 3);
    return (0, u.jsxs)("div", { className: `rounded-xl p-3 flex items-start gap-3 border ${isUltSkill ? "bg-amber-950/20 border-amber-500/45" : "bg-slate-900 border-slate-800"}`, children: [(0, u.jsx)(Wt, { heroId: p.id, skillId: w.key, size: 56, roundedClass: "rounded-xl" }), (0, u.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, u.jsxs)("div", { className: "flex items-center justify-between text-xs gap-2 flex-wrap", children: [(0, u.jsxs)("div", { className: "flex items-center gap-2", children: [(0, u.jsx)("span", { className: `font-mono-numbers text-[11px] font-black px-1.5 py-0.5 rounded ${isUltSkill ? "bg-amber-500 text-slate-950" : "bg-cyan-500 text-slate-950"}`, children: w.label }), (0, u.jsx)("span", { className: "font-bold text-white font-moba text-sm", children: w.name[c] })] }), (0, u.jsxs)("div", { className: "flex items-center gap-2 font-mono-numbers text-[11px] tabular-nums", children: [(0, u.jsx)("span", { style: { color: j.color }, className: "font-semibold", children: j.label }), (0, u.jsx)("span", { className: "text-slate-600", children: "\xB7" }), (0, u.jsxs)("span", { className: "text-slate-300", children: ["H\u1ED3i ", he, "s"] })] })] }), (0, u.jsx)("p", { className: "text-xs text-slate-300 mt-1 leading-relaxed", children: w.description[c] })] })] }, w.key);
  })] })] }) }), mpLobbyOpen && (0, u.jsx)(MultiplayerLobbyModal, { lang: c, heroes: Mi, selectedHero: p, room: mpRoom, playerId: mpClient.playerId, playerName: mpName, joinCode: mpJoinCode, busy: mpBusy, error: mpError, copied: mpCopied, SkillIcon: Wt, founderUnlocked, onRequireFounderAuth: (hr) => requireFounderUnlock(() => handleMpSelectHero(hr || Mi.find((xHero) => xHero.id === "thien"))), onChangeName: handleMpNameChange, onChangeJoinCode: setMpJoinCode, onCreateRoom: handleCreateRoom, onJoinRoom: handleJoinRoom, onCopyRoomId: handleCopyRoomId, onSelectHero: handleMpSelectHero, onToggleReady: () => {
    mpClient.toggleReady();
  }, onStartMatch: () => {
    if (p.isSecretFounder && !founderUnlockedRef.current) {
      requireFounderUnlock(() => { setMpError(""); mpClient.startMatch(); });
      return;
    }
    setMpError("");
    mpClient.startMatch();
  }, onLeaveRoom: () => {
    R.playModalClose();
    handleLeaveRoom();
  }, onRetryConnect: handleRetryMpConnect, envInfo, p2pInviteCode, p2pManualOfferCode, p2pHasServerSignal, p2pAnswerCode, p2pAutoPaired, p2pIncomingOffer, p2pIncomingAnswer, p2pBusy, customServerUrl, lanUrls, isFullscreen: fsActive, onToggleFullscreen: toggleFullscreen, onChangeCustomServerUrl: setCustomServerUrl, onApplyCustomServerUrl: handleApplyCustomServerUrl, onStartP2PHost: handleStartP2PHost, onCreateP2PInvite: handleCreateP2PInvite, onAcceptP2PAnswer: handleAcceptP2PAnswer, onChangeP2PIncomingOffer: setP2pIncomingOffer, onChangeP2PIncomingAnswer: setP2pIncomingAnswer, onJoinP2POffer: handleJoinP2POffer, onCopyText: handleCopyText, onClose: () => {
    setMpLobbyOpen(false);
  }, unlockedMaps, onChangeRoomMap: (nextMapId) => {
    if (!isMapUnlocked(nextMapId, unlockedMaps, founderUnlockedRef.current)) {
      G(getMapUnlockRequirement(nextMapId, c));
      return;
    }
    mpClient.setMap(nextMapId);
  } }), accountModalOpen && (0, u.jsx)(PlayerAccountModal, { lang: c, initialTab: accountModalTab, profile: playerProfile, heroes: Mi, coins: f, highestWave: Math.max(a.current?.highestWaveCleared || 0, playerProfile?.highestWave || 0), googleUser, founderUnlocked, syncBusy: accountSyncBusy, authError: accountAuthError, authDetails: accountAuthDetails, onClearAuthError: () => { setAccountAuthError(""); setAccountAuthDetails(null); }, onSaveProfile: handleSaveProfile, onSignInGoogle: handlePlayerGoogleSignIn, onSignOutGoogle: handlePlayerGoogleSignOut, onPushCloudSave: handlePushCloudSave, onPullCloudSave: handlePullCloudSave, onClaimDailyCheckIn: handleClaimDailyCheckIn, onExportSaveJson: handleExportSaveJson, onImportSaveJson: handleImportSaveJson, deviceInfo, resumableRun, onGenerateTransferCode: handleGenerateTransferCode, onOpenCoopWithFriend: handleOpenCoopWithFriend, onCopyText: handleCopyText, onShowToast: G, onClose: () => setAccountModalOpen(false) }), founderModalOpen && (0, u.jsx)("div", { className: "modal-backdrop", style: { zIndex: 10050 }, children: (0, u.jsxs)("div", { className: "modal-box max-w-[440px] border-amber-400/70 bg-gradient-to-b from-[#0b152b] to-[#050811]", children: [(0, u.jsxs)("div", { className: "flex items-start justify-between gap-3 border-b border-slate-800 pb-3", children: [(0, u.jsxs)("div", { children: [(0, u.jsx)(Wt, { heroId: "thien", skillId: "c4", size: 48, roundedClass: "rounded-xl" }), (0, u.jsxs)("div", { children: [(0, u.jsx)("div", { className: "text-[10px] font-moba font-extrabold uppercase tracking-wider text-amber-300", children: "CHỈ DÀNH CHO NHÀ SÁNG LẬP" }), (0, u.jsx)("h3", { className: "font-title text-lg font-black text-white", children: "THIÊN – ĐẤNG SÁNG THẾ" })] })], className: "flex items-center gap-3" }), (0, u.jsx)("button", { type: "button", className: "btn-secondary px-2.5 py-1 text-sm", onClick: () => { R.playModalClose(); setFounderModalOpen(false); }, children: "✕" })] }), (0, u.jsxs)("div", { className: "mt-3.5 space-y-3 text-xs", children: [(0, u.jsx)("p", { className: "text-slate-300 leading-relaxed", children: "Tướng bí mật này được bảo vệ bởi máy chủ & Firebase. Nhập mật khẩu 8 số của Nhà Sáng Lập hoặc xác thực bằng tài khoản Google chính chủ." }), (0, u.jsxs)("form", { onSubmit: handleVerifyFounderPin, className: "space-y-2.5", children: [(0, u.jsxs)("div", { children: [(0, u.jsx)("label", { className: "block text-[11px] font-moba font-bold text-sky-200 mb-1", children: "Mật khẩu Nhà Sáng Lập (8 chữ số)" }), (0, u.jsx)("input", { type: "password", inputMode: "numeric", autoComplete: "off", maxLength: 8, value: founderPinInput, onChange: (e) => setFounderPinInput(e.target.value.replace(/\D/g, "").slice(0, 8)), placeholder: "••••••••", autoFocus: true, className: "w-full min-h-[46px] rounded-xl bg-[#040814] border border-amber-400/55 focus:border-amber-300 px-3 py-2 text-center font-mono-numbers text-lg font-black tracking-[0.35em] text-amber-100 outline-none" })] }), (0, u.jsx)("button", { type: "submit", disabled: founderAuthBusy || founderPinInput.length < 8, className: "w-full min-h-[44px] moba-bronze-btn rounded-xl font-moba text-xs sm:text-sm font-black tracking-wide disabled:opacity-55", children: founderAuthBusy ? "ĐANG XÁC THỰC MÁY CHỦ..." : "XÁC NHẬN MỞ KHÓA THIÊN" })] }), (0, u.jsxs)("div", { className: "relative flex items-center py-1", children: [(0, u.jsx)("div", { className: "flex-1 border-t border-slate-800" }), (0, u.jsx)("span", { className: "px-2.5 text-[10px] uppercase tracking-wider text-slate-500 font-moba font-bold", children: "Hoặc qua Firebase" }), (0, u.jsx)("div", { className: "flex-1 border-t border-slate-800" })] }), (0, u.jsx)("button", { type: "button", disabled: founderAuthBusy, onClick: handleVerifyFounderGoogle, className: "w-full min-h-[42px] rounded-xl bg-sky-950/60 hover:bg-sky-900/70 border border-sky-400/60 text-sky-100 font-moba text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-55", children: ["🔐 Đăng nhập Google Nhà Sáng Lập"] }), founderAuthError && (0, u.jsx)(AuthErrorBanner, { lang: c, authError: founderAuthError, authDetails: founderAuthDetails, onClear: () => { setFounderAuthError(""); setFounderAuthDetails(null); }, onCopyText: handleCopyText, compact: true }), founderUnlocked && (0, u.jsxs)("div", { className: "pt-2 border-t border-slate-800 flex items-center justify-between gap-2", children: [(0, u.jsxs)("span", { className: "text-emerald-300 font-semibold", children: ["✓ Đã mở khóa (", founderAuthSource || "verified", ")"] }), (0, u.jsx)("button", { type: "button", disabled: founderAuthBusy, onClick: handleLogoutFounder, className: "btn-danger text-[11px] px-3 py-1.5", children: "Khóa Lại" })] })] })] }) }), citadelLoreModal && (0, u.jsx)("div", { className: "modal-backdrop", style: { zIndex: 10060 }, children: (0, u.jsxs)("div", { className: `modal-box max-w-[560px] relative overflow-hidden ${citadelLoreModal.themeVariant === "bao" ? "border-purple-400/75 bg-gradient-to-b from-[#170b24] to-[#080710]" : citadelLoreModal.themeVariant === "combined" ? "border-amber-400/80 bg-gradient-to-b from-[#1e101b] via-[#130a18] to-[#080910]" : "border-rose-500/75 bg-gradient-to-b from-[#190b18] to-[#080910]"}`, children: [(0, u.jsx)("div", { className: "h-0.5 w-full bg-gradient-to-r from-rose-500/85 via-amber-400/80 to-purple-500/85 mb-3 rounded-sm" }), (0, u.jsxs)("div", { className: "flex items-start justify-between gap-3 border-b border-slate-800/90 pb-3", children: [(0, u.jsxs)("div", { className: "flex items-center gap-3 min-w-0", children: [(0, u.jsx)(CitadelLoreCrest, { nodeId: citadelLoreModal.nodeId, resonated: citadelLoreModal.heroResonated, combined: citadelLoreModal.isCombinedEvent, className: "w-14 h-14" }), (0, u.jsxs)("div", { className: "min-w-0", children: [(0, u.jsxs)("div", { className: `text-[10px] font-moba font-extrabold uppercase tracking-wider truncate ${citadelLoreModal.themeVariant === "bao" ? "text-purple-300" : citadelLoreModal.themeVariant === "combined" ? "text-amber-300" : "text-rose-300"}`, children: [citadelLoreModal.archiveCode ? `${citadelLoreModal.archiveCode} · ` : "", citadelLoreModal.subtitle] }), (0, u.jsx)("h3", { className: "font-moba text-lg font-black text-white mt-0.5 truncate", children: citadelLoreModal.title }), citadelLoreModal.specimenMeta && (0, u.jsx)("div", { className: "text-[10px] font-mono-numbers tabular-nums text-slate-400 mt-0.5 truncate", children: citadelLoreModal.specimenMeta })] })] }), (0, u.jsx)("button", { type: "button", className: "btn-secondary px-2.5 py-1 text-sm shrink-0", onClick: () => {
    R.playModalClose();
    setCitadelLoreModal(null);
    if (citadelLorePausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
      citadelLorePausedRef.current = false;
      a.current.gameState = "PLAYING";
    }
  }, children: "✕" })] }), (0, u.jsxs)("div", { className: "mt-3.5 space-y-2.5 text-xs leading-relaxed text-slate-200", children: [citadelLoreModal.quote && (0, u.jsx)("div", { className: `px-3 py-2 rounded-lg border font-moba font-bold italic ${citadelLoreModal.themeVariant === "bao" ? "bg-purple-500/12 border-purple-400/45 text-purple-200" : "bg-amber-500/10 border-amber-400/45 text-amber-200"}`, children: citadelLoreModal.quote }), (citadelLoreModal.paragraphs || []).map((para, idx) => (0, u.jsx)("p", { className: "text-slate-300", children: para }, idx)), Array.isArray(citadelLoreModal.fieldNotes) && citadelLoreModal.fieldNotes.length > 0 && (0, u.jsxs)("div", { className: "px-3 py-2 rounded-lg bg-slate-950/75 border border-slate-800/90 space-y-1", children: [(0, u.jsx)("div", { className: "text-[10px] font-mono-numbers font-bold uppercase tracking-wider text-slate-400", children: c === "vi" ? "GHI CHÚ THỰC ĐỊA CỔ THÀNH" : "CITADEL FIELD NOTES" }), citadelLoreModal.fieldNotes.map((note, nIdx) => (0, u.jsxs)("div", { className: "text-[11px] text-slate-300 font-mono-numbers leading-snug", children: ["› ", note] }, nIdx))] }), citadelLoreModal.clueSummary && (0, u.jsx)("div", { className: "px-3 py-2 rounded-lg bg-slate-900/85 border border-slate-700/80 text-sky-200 font-semibold", children: citadelLoreModal.clueSummary }), citadelLoreModal.rewardText && (0, u.jsx)("div", { className: "px-3 py-2 rounded-lg bg-emerald-500/12 border border-emerald-400/45 text-emerald-200 font-bold", children: citadelLoreModal.rewardText }), citadelLoreModal.secrets && (0, u.jsxs)("div", { className: "flex flex-wrap items-center gap-3 pt-1.5 border-t border-slate-800/80 text-[11px] font-mono-numbers tabular-nums text-slate-300", children: [(0, u.jsxs)("span", { className: citadelLoreModal.secrets.tinClue ? "text-rose-300 font-bold" : "text-slate-500", children: ["Tin #MT-07: ", citadelLoreModal.secrets.tinClue ? "✓ Đã mở" : "○ Chưa mở"] }), (0, u.jsx)("span", { className: "text-slate-700", children: "·" }), (0, u.jsxs)("span", { className: citadelLoreModal.secrets.baoClue ? "text-purple-300 font-bold" : "text-slate-500", children: ["Bảo #BS-04: ", citadelLoreModal.secrets.baoClue ? "✓ Đã mở" : "○ Chưa mở"] }), (0, u.jsx)("span", { className: "text-slate-700", children: "·" }), (0, u.jsxs)("span", { className: citadelLoreModal.secrets.combinedUnlocked ? "text-amber-300 font-bold" : "text-slate-500", children: [c === "vi" ? "Hầm #ZERO-00: " : "Vault #ZERO-00: ", citadelLoreModal.secrets.combinedUnlocked ? (c === "vi" ? "✓ Đã mở" : "✓ Unlocked") : (c === "vi" ? "○ Khóa" : "○ Locked")] })] }), (0, u.jsx)("button", { type: "button", className: "w-full btn-primary py-2.5 text-xs font-black mt-1", onClick: () => {
    R.playModalClose();
    setCitadelLoreModal(null);
    if (citadelLorePausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
      citadelLorePausedRef.current = false;
      a.current.gameState = "PLAYING";
    }
  }, children: c === "vi" ? "Tiếp Tục Chiến Đấu" : "Continue Fighting" })] })] }) }), infernoStoryModal && (0, u.jsx)(InfernoStoryModal, { payload: infernoStoryModal, lang: c, onClose: () => {
    setInfernoStoryModal(null);
    if (infernoStoryPausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
      infernoStoryPausedRef.current = false;
      a.current.gameState = "PLAYING";
    }
  } }), infernoJournalOpen && (0, u.jsx)(InfernoJournalModal, { open: infernoJournalOpen, progress: infernoProgress, lang: c, onClose: () => setInfernoJournalOpen(false) }), frozenTombStoryModal && (0, u.jsx)(FrozenTombStoryModal, { payload: frozenTombStoryModal, lang: c, onClose: () => {
    setFrozenTombStoryModal(null);
    if (frozenTombStoryPausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
      frozenTombStoryPausedRef.current = false;
      a.current.gameState = "PLAYING";
    }
  } }), frozenTombJournalOpen && (0, u.jsx)(FrozenTombJournalModal, { open: frozenTombJournalOpen, progress: frozenTombProgress, infernoProgress, lang: c, onClose: () => setFrozenTombJournalOpen(false) }), grudgeForestStoryModal && (0, u.jsx)(GrudgeForestStoryModal, { payload: grudgeForestStoryModal, lang: c, onClose: () => {
    setGrudgeForestStoryModal(null);
    if (grudgeForestStoryPausedRef.current && a.current && !a.current.multiplayer?.active && a.current.gameState === "PAUSED") {
      grudgeForestStoryPausedRef.current = false;
      a.current.gameState = "PLAYING";
    }
  } }), grudgeForestJournalOpen && (0, u.jsx)(GrudgeForestJournalModal, { open: grudgeForestJournalOpen, progress: grudgeForestProgress, citadelSecrets, infernoProgress, frozenTombProgress, lang: c, onClose: () => setGrudgeForestJournalOpen(false) }), chroniclesOpen && (0, u.jsx)(ChroniclesModal, { open: chroniclesOpen, lang: c, heroes: Mi, initialTab: chroniclesTab, focusHeroId: chroniclesFocusHeroId, founderUnlocked, citadelUnlocked: isMapUnlocked("blood_citadel", unlockedMaps, founderUnlocked), infernoUnlocked: isMapUnlocked("inferno_ash", unlockedMaps, founderUnlocked), frozenTombUnlocked: isMapUnlocked("frozen_tomb", unlockedMaps, founderUnlocked), grudgeForestUnlocked: isMapUnlocked("grudge_forest", unlockedMaps, founderUnlocked), citadelSecrets, infernoProgress, frozenTombProgress, grudgeForestProgress, onSelectHero: (heroIdArg) => {
    const found = Mi.find((hr) => hr.id === heroIdArg);
    if (!found) return;
    if (found.isSecretFounder && !founderUnlockedRef.current) return;
    h(found);
    if (a.current) {
      a.current.currentHero = found;
      a.current.selectedHeroId = found.id;
      a.current.saveGame();
    }
  }, onSelectInfernoMap: () => {
    if (a.current?.setSelectedMap?.("inferno_ash")) {
      setSelectedMapId("inferno_ash");
      G(c === "vi" ? "Đã chọn map: Hỏa Ngục Tàn Tro!" : "Selected map: Inferno of Ashes!");
    } else {
      G(getMapUnlockRequirement("inferno_ash", c));
    }
  }, onSelectFrozenTombMap: () => {
    if (a.current?.setSelectedMap?.("frozen_tomb")) {
      setSelectedMapId("frozen_tomb");
      G(c === "vi" ? "Đã chọn map: Băng Mộ Vĩnh Cửu!" : "Selected map: Eternal Frozen Tomb!");
    } else {
      G(getMapUnlockRequirement("frozen_tomb", c));
    }
  }, onSelectGrudgeForestMap: () => {
    if (a.current?.setSelectedMap?.("grudge_forest")) {
      setSelectedMapId("grudge_forest");
      G(c === "vi" ? "Đã chọn map: Rừng Oán Niệm!" : "Selected map: Forest of Grudges!");
    } else {
      G(getMapUnlockRequirement("grudge_forest", c));
    }
  }, onSelectCitadelMap: () => {
    if (a.current?.setSelectedMap?.("blood_citadel")) {
      setSelectedMapId("blood_citadel");
      G(c === "vi" ? "Đã chọn map: Cổ Thành Huyết Táng!" : "Selected map: Bloodsoaked Ancient Citadel!");
    } else {
      G(getMapUnlockRequirement("blood_citadel", c));
    }
  }, onClose: () => setChroniclesOpen(false) }), mt && (0, u.jsx)("div", { className: "toast-message show", children: mt })] });
}
export default ny;
