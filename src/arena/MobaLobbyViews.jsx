import React, { useMemo, useState } from "react";
import HeroPreviewCanvas from "./HeroPreviewCanvas.jsx";
import PlayerAvatarBadge from "./PlayerAvatarBadge.jsx";
import AuthErrorBanner from "./AuthErrorBanner.jsx";
import { DAILY_CHECKIN_REWARD } from "./playerAccount.ts";
import { R } from "./soundEngine.js";
import {
  HERO_ROLE_LABELS,
  HERO_ROLE_ORDER,
  filterHeroesByRole,
  getHeroRoleKey,
} from "./combatLogic.ts";
import { ARENA_MAP_LIST, getMapUnlockRequirement, isMapUnlocked } from "./bloodCitadelMap.ts";
import { HERO_CHRONICLES } from "./darkFantasyLore.ts";
import { CitadelBlueprintEmblem } from "./CitadelVisuals.jsx";
import { InfernoBlueprintEmblem } from "./InfernoVisuals.jsx";
import { FrozenTombBlueprintEmblem } from "./FrozenTombVisuals.jsx";
import { GrudgeForestBlueprintEmblem } from "./GrudgeForestVisuals.jsx";
import { VoidCityBlueprintEmblem } from "./VoidCityVisuals.jsx";
import { countVoidCityRelics } from "./voidCityMap";

export function MobaLobbyMenu({
  lang,
  strings,
  heroes,
  selectedHero,
  coins,
  sfxEnabled,
  musicEnabled,
  isFullscreen,
  mpRoom,
  envInfo,
  SkillIcon,
  onSelectHero,
  onEnterArena,
  onOpenHeroSelect,
  onOpenCoop,
  onOpenShop,
  onOpenGuide,
  onOpenSettings,
  onOpenPatchNotes,
  onOpenShareGuide,
  onDownloadOrShare,
  onToggleSfx,
  onToggleMusic,
  onToggleFullscreen,
  onToggleLang,
  founderUnlocked = false,
  onRequireFounderAuth,
  playerProfile,
  googleUser = null,
  highestWave = 0,
  canDailyCheckIn = false,
  onClaimDailyCheckIn,
  onOpenAccountModal,
  onSignInGoogle,
  authError = "",
  authDetails = null,
  onClearAuthError,
  onCopyText,
  selectedMapId = "classic",
  unlockedMaps = ["classic"],
  citadelSecrets = null,
  infernoProgress = null,
  frozenTombProgress = null,
  grudgeForestProgress = null,
  voidCityProgress = null,
  onSelectMap,
  onOpenChronicles,
  onOpenVoidCityRelics,
  resumableRun = null,
  onResumeRun,
}) {
  const [attackTrigger, setAttackTrigger] = useState(0);
  const [previewSkillKey, setPreviewSkillKey] = useState("c3");
  const isVi = lang === "vi";
  const resumeHero = useMemo(
    () => (resumableRun?.active ? heroes.find((h) => h.id === resumableRun.heroId) || null : null),
    [resumableRun, heroes]
  );
  const resumeMap = useMemo(
    () => (resumableRun?.active ? ARENA_MAP_LIST.find((m) => m.id === resumableRun.mapId) || ARENA_MAP_LIST[0] : null),
    [resumableRun]
  );
  const resumeHeroName = ((resumeHero?.name || resumableRun?.heroId || "Anh Hùng") + "").split("(")[0].trim();
  const resumeMapName = resumeMap?.name?.[lang] || resumeMap?.name?.vi || resumableRun?.mapId || "Classic";

  const currentIdx = Math.max(
    0,
    heroes.findIndex((h) => h.id === selectedHero?.id)
  );
  const hero = heroes[currentIdx] || selectedHero || heroes[0];
  const isHeroLocked = Boolean(hero?.isSecretFounder && !founderUnlocked);
  const heroShortName = (hero?.name || "").split("(")[0].trim();
  const roleLabel = HERO_ROLE_LABELS[lang]?.[getHeroRoleKey(hero.id)] || hero.role?.[lang] || "";
  const effectiveBestWave = Math.max(Number(highestWave) || 0, Number(playerProfile?.highestWave) || 0);

  const skillEntries = useMemo(() => {
    if (!hero) return [];
    return [
      {
        key: "passive",
        label: isVi ? "Nội tại" : "Passive",
        name: isVi ? "Nội Tại" : "Passive",
        desc: hero.passive?.[lang] || "",
      },
      {
        key: "atk",
        label: isVi ? "Đánh" : "ATK",
        name: hero.weapon?.[lang] || (isVi ? "Đánh Thường" : "Basic Attack"),
        desc: isVi
          ? `Tầm ${hero.stats.range}px · ${(1 / hero.stats.attackInterval).toFixed(2)} đòn/s · Chí mạng ${Math.round((hero.baseCrit || 0.1) * 100)}%`
          : `Range ${hero.stats.range}px · ${(1 / hero.stats.attackInterval).toFixed(2)} hits/s · Crit ${Math.round((hero.baseCrit || 0.1) * 100)}%`,
      },
      ...(hero.skills || []).map((sk) => ({
        key: sk.key,
        label: sk.label,
        name: sk.name?.[lang] || sk.label,
        desc: sk.description?.[lang] || "",
        cooldown: sk.cooldown,
      })),
    ];
  }, [hero, lang, isVi]);

  const activeSkill =
    skillEntries.find((s) => s.key === previewSkillKey) || skillEntries[skillEntries.length - 1];

  const selectHeroWithPreview = (targetHero) => {
    if (!targetHero) return;
    R.playHeroSelect(targetHero.id);
    setAttackTrigger((n) => n + 1);
    onSelectHero(targetHero);
  };

  const cycleHero = (delta) => {
    if (!heroes.length) return;
    const nextIdx = (currentIdx + delta + heroes.length) % heroes.length;
    selectHeroWithPreview(heroes[nextIdx]);
  };

  const handlePreviewSkill = (key) => {
    setPreviewSkillKey(key);
    setAttackTrigger((n) => n + 1);
    R.playHeroSkillPreview(hero.id, key);
  };

  return (
    <div className="screen moba-lobby-screen">
      <div className="bg-radial-glow" />

      {/* Top MOBA Command Bar */}
      <header className="moba-topbar relative z-10">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-title text-base sm:text-lg font-extrabold text-white tracking-wide whitespace-nowrap shrink-0">
            Arena Hero 11.8
          </span>
        </div>

        <nav className="hidden xl:flex items-center gap-5 text-xs font-moba font-bold uppercase tracking-wider text-slate-300">
          <button
            type="button"
            onClick={() => {
              R.playTabSwitch();
              onOpenHeroSelect();
            }}
            onMouseEnter={() => R.playHover()}
            className="hover:text-amber-300 transition-colors py-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isVi ? `Tướng (${heroes.length})` : `Heroes (${heroes.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenShop();
            }}
            onMouseEnter={() => R.playHover()}
            className="hover:text-amber-300 transition-colors py-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isVi ? "Kho Trang Bị" : "Armory"}
          </button>
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenCoop();
            }}
            onMouseEnter={() => R.playHover()}
            className="hover:text-cyan-300 transition-colors py-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {mpRoom
              ? `${isVi ? "Co-op" : "Co-op"} ${mpRoom.roomId}`
              : isVi
              ? "Tổ Đội Co-op"
              : "Co-op"}
          </button>
        </nav>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Player Profile & Sync Hub Button */}
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenAccountModal?.("profile");
            }}
            className="min-h-[36px] pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
            title={isVi ? "Mở Hồ Sơ, Lưu Trữ & Bạn Bè" : "Open Profile, Save & Friends"}
          >
            <PlayerAvatarBadge
              avatarType={playerProfile?.avatarType || "hero"}
              avatarValue={playerProfile?.avatarValue || hero.id}
              avatarFrame={playerProfile?.avatarFrame || "bronze_recruit"}
              displayName={playerProfile?.displayName || "Chiến Binh"}
              heroes={heroes}
              size={26}
            />
            <span className="font-moba text-xs font-extrabold text-white truncate hidden sm:inline max-w-[110px]">
              {playerProfile?.displayName || "Chiến Binh"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenShop();
            }}
            className="btn-secondary min-h-[36px] px-2.5 text-xs font-mono-numbers font-bold text-amber-300 border-amber-500/40 whitespace-nowrap shrink-0"
            title={isVi ? "Mở Kho Trang Bị" : "Open Armory"}
          >
            <span className="tabular-nums">{coins.toLocaleString()} Xu</span>
          </button>

          {/* Grouped Utility Controls */}
          <div className="moba-utility-group shrink-0">
            <button
              type="button"
              onClick={() => {
                R.playClick();
                onToggleSfx();
              }}
              className={`moba-utility-btn ${sfxEnabled ? "text-emerald-300" : "text-slate-500"}`}
              title={isVi ? "Bật/Tắt Hiệu Ứng Âm Thanh" : "Toggle SFX"}
            >
              {sfxEnabled ? "SFX" : "SFX×"}
            </button>
            <button
              type="button"
              onClick={() => {
                R.playClick();
                onToggleMusic();
              }}
              className={`moba-utility-btn border-l border-slate-700/80 ${
                musicEnabled ? "text-cyan-300" : "text-slate-500"
              }`}
              title={isVi ? "Bật/Tắt Nhạc Nền" : "Toggle Music"}
            >
              {musicEnabled ? "BGM" : "BGM×"}
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? (isVi ? "Thu nhỏ màn hình" : "Exit fullscreen") : (isVi ? "Phóng to màn hình" : "Fullscreen")}
              title={isFullscreen ? (isVi ? "Thu nhỏ màn hình" : "Exit fullscreen") : (isVi ? "Phóng to màn hình" : "Fullscreen")}
              className="moba-utility-btn border-l border-slate-700/80 text-emerald-300"
            >
              {isFullscreen ? "⤢" : "⛶"}
            </button>
            <button
              type="button"
              onClick={() => {
                R.playTabSwitch();
                onToggleLang();
              }}
              className="moba-utility-btn border-l border-slate-700/80 text-slate-200"
              title={isVi ? "Chuyển ngôn ngữ" : "Switch Language"}
            >
              {isVi ? "VI" : "EN"}
            </button>
          </div>
        </div>
      </header>

      {/* Main MOBA Command Hall Body */}
      <main className="moba-lobby-grid relative z-10 flex-1 min-h-0 overflow-y-auto">
        {/* Left/Center: Live Animated Hero Showcase Stage + Animated 17-Hero Strip */}
        <section className="moba-showcase-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-amber-300/90 truncate">
                {roleLabel} · {hero.title?.[lang]} · {hero.weapon?.[lang]}
              </div>
              <h1 className="font-title text-2xl sm:text-3xl font-black text-white mt-0.5 leading-tight truncate">
                {heroShortName}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => cycleHero(-1)}
                className="btn-secondary min-h-[40px] w-10 px-0 text-base font-bold"
                aria-label={isVi ? "Tướng trước" : "Previous hero"}
              >
                ‹
              </button>
              <span className="font-mono-numbers text-xs text-slate-400 px-1.5 tabular-nums">
                {currentIdx + 1}/{heroes.length}
              </span>
              <button
                type="button"
                onClick={() => cycleHero(1)}
                className="btn-secondary min-h-[40px] w-10 px-0 text-base font-bold"
                aria-label={isVi ? "Tướng tiếp theo" : "Next hero"}
              >
                ›
              </button>
            </div>
          </div>

          {/* Live Animated Hero Canvas */}
          <div className="moba-stage-canvas-wrap relative flex-1 min-h-[160px] my-2 rounded-xl border border-slate-800/80 overflow-hidden">
            <HeroPreviewCanvas
              hero={hero}
              attackTrigger={attackTrigger}
              locked={isHeroLocked}
              onPreviewStrike={() => {}}
            />
            {isHeroLocked && (
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/60 text-amber-300 text-[11px] font-moba font-bold flex items-center gap-1.5">
                <span>🔒</span>
                <span>{isVi ? "Tướng Bí Mật · Nhà Sáng Lập" : "Secret Founder Hero"}</span>
              </div>
            )}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePreviewSkill(hero.skills?.length >= 4 ? "c4" : "c3")}
                className="btn-secondary min-h-[36px] px-3 text-[11px] text-cyan-200 border-cyan-500/40 bg-slate-900/90"
              >
                {isVi ? "Thử Chiêu Cuối" : "Ultimate SFX"}
              </button>
              <button
                type="button"
                onClick={() => handlePreviewSkill("atk")}
                className="btn-secondary min-h-[36px] px-3 text-[11px] text-amber-200 border-amber-500/40 bg-slate-900/90"
              >
                {isVi ? "Thử Đánh" : "Test Strike"}
              </button>
            </div>
          </div>

          {/* Animated Hero Portraits Quick-Carousel */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-0.5">
              <span className="font-moba font-bold text-slate-300">
                {isVi ? "Chọn Nhanh Tướng Động" : "Animated Champions"}
              </span>
              <button
                type="button"
                onClick={() => {
                  R.playTabSwitch();
                  onOpenHeroSelect();
                }}
                className="text-amber-300 hover:text-amber-200 font-moba font-bold cursor-pointer"
              >
                {isVi ? `Xem chi tiết cả ${heroes.length} →` : `Full Roster (${heroes.length}) →`}
              </button>
            </div>

            <div className="moba-hero-strip">
              {heroes.map((candidate) => {
                const active = candidate.id === hero.id;
                const locked = Boolean(candidate.isSecretFounder && !founderUnlocked);
                const short = candidate.name.split("(")[0].trim();
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => selectHeroWithPreview(candidate)}
                    className={`w-[64px] shrink-0 rounded-xl p-1 border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? "bg-[#16294E] border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.22)]"
                        : "bg-slate-950/75 border-slate-800/90 hover:border-slate-600"
                    }`}
                  >
                    <div className="w-[46px] h-[46px] rounded-lg overflow-hidden bg-[#060B16] relative">
                      <HeroPreviewCanvas hero={candidate} compact interactive={false} locked={locked} />
                    </div>
                    <span
                      className={`text-[10px] font-moba font-bold truncate w-full text-center ${
                        active ? "text-amber-200" : "text-slate-300"
                      }`}
                    >
                      {locked ? `🔒 ${short}` : short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stat Strip + Interactive 5-Skill Preview Bar */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono-numbers tabular-nums border-t border-slate-800/80 pt-2.5">
            <div>
              <div className="text-[11px] text-slate-400">{strings.hp}</div>
              <div className="text-sm font-bold text-emerald-400">{hero.stats.hp}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{strings.damage}</div>
              <div className="text-sm font-bold text-rose-400">{hero.stats.damage}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{hero.stats.ap > 0 ? "AP" : strings.range}</div>
              <div className="text-sm font-bold text-violet-300">
                {hero.stats.ap > 0 ? hero.stats.ap : hero.stats.range}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{strings.speed}</div>
              <div className="text-sm font-bold text-cyan-300">{hero.stats.speed}</div>
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {skillEntries.map((sk) => {
                const isSelected = activeSkill?.key === sk.key;
                return (
                  <button
                    key={sk.key}
                    type="button"
                    onClick={() => handlePreviewSkill(sk.key)}
                    onMouseEnter={() => R.playHover()}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors shrink-0 min-h-[40px] cursor-pointer ${
                      isSelected
                        ? "bg-slate-800/95 border-amber-400/80 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <SkillIcon heroId={hero.id} skillId={sk.key} size={26} roundedClass="rounded-md" />
                    <span className="font-mono-numbers text-xs font-bold whitespace-nowrap">{sk.label}</span>
                  </button>
                );
              })}
            </div>

            {activeSkill && (
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-2">
                <span className="font-moba font-bold text-amber-300">{activeSkill.name}</span>
                {activeSkill.cooldown ? (
                  <span className="font-mono-numbers text-slate-400"> · {activeSkill.cooldown}s</span>
                ) : null}
                <span className="text-slate-500"> — </span>
                <span>{activeSkill.desc}</span>
              </div>
            )}
          </div>
        </section>

        {/* Right: MOBA Battle Command Dock + Player Account Hub */}
        <aside className="moba-command-dock">
          {/* Group 1: Compact Player Account Card */}
          <div className="rounded-xl border border-slate-700/75 bg-[#0A1328]/90 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  R.playModalOpen();
                  onOpenAccountModal?.("profile");
                }}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
              >
                <PlayerAvatarBadge
                  avatarType={playerProfile?.avatarType || "hero"}
                  avatarValue={playerProfile?.avatarValue || hero.id}
                  avatarFrame={playerProfile?.avatarFrame || "bronze_recruit"}
                  displayName={playerProfile?.displayName || "Chiến Binh"}
                  heroes={heroes}
                  size={42}
                  animated={playerProfile?.avatarType === "hero"}
                />
                <div className="min-w-0">
                  <div className="font-moba text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">
                    {playerProfile?.displayName || "Chiến Binh"}
                  </div>
                  <div className="text-[10.5px] font-mono-numbers text-slate-400 truncate tabular-nums">
                    {playerProfile?.titleBadge || "Tân Binh"} ·{" "}
                    {isVi ? `Màn ${effectiveBestWave}/27` : `Wave ${effectiveBestWave}/27`} ·{" "}
                    {(playerProfile?.lifetimeKills || 0).toLocaleString()} {isVi ? "quái" : "kills"}
                  </div>
                </div>
              </button>

              {canDailyCheckIn ? (
                <button
                  type="button"
                  onClick={() => {
                    R.playCoinPickup();
                    onClaimDailyCheckIn?.();
                  }}
                  className="moba-bronze-btn min-h-[36px] px-3 rounded-xl font-moba text-[11px] font-black shrink-0"
                >
                  +{DAILY_CHECKIN_REWARD} Xu
                </button>
              ) : !googleUser ? (
                <button
                  type="button"
                  onClick={() => {
                    R.playClick();
                    onSignInGoogle?.();
                  }}
                  className="btn-secondary min-h-[36px] px-2.5 text-[11px] font-moba font-bold border-cyan-500/45 text-cyan-200 shrink-0"
                >
                  {isVi ? "Google" : "Google"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    R.playModalOpen();
                    onOpenAccountModal?.("friends");
                  }}
                  className="btn-secondary min-h-[36px] px-2.5 text-[11px] font-moba font-bold border-cyan-500/45 text-cyan-200 shrink-0"
                >
                  {isVi ? "Bạn Bè" : "Friends"}
                </button>
              )}
            </div>

            {!googleUser && authError && (
              <AuthErrorBanner
                lang={lang}
                authError={authError}
                authDetails={authDetails}
                onClear={onClearAuthError}
                onCopyText={onCopyText}
                compact
              />
            )}
          </div>

          {/* Group 2: Battleground Map Selector */}
          <div className="rounded-xl bg-[#070B16]/90 border border-slate-800/90 p-2.5 mt-2.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-moba font-bold tracking-wider uppercase text-slate-300 truncate">
                {isVi ? "Bản Đồ Chiến Trường" : "Battleground Map"}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    R.playModalOpen();
                    onOpenChronicles?.("world");
                  }}
                  className="text-[10.5px] font-moba font-bold text-rose-300 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  {isVi ? "📜 Biên Niên Sử" : "📜 Chronicles"}
                </button>
                <span className="text-[10px] font-mono-numbers text-slate-400 tabular-nums">
                  {founderUnlocked ? `${ARENA_MAP_LIST.length}/${ARENA_MAP_LIST.length}` : `${unlockedMaps.length}/${ARENA_MAP_LIST.length}`}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ARENA_MAP_LIST.map((m) => {
                const unlocked = isMapUnlocked(m.id, unlockedMaps, founderUnlocked);
                const active = selectedMapId === m.id;
                const isCitadel = m.id === "blood_citadel";
                const isInferno = m.id === "inferno_ash";
                const isFrozen = m.id === "frozen_tomb";
                const isForest = m.id === "grudge_forest";
                const isVoidCity = m.id === "void_city";
                const mapName = m.name?.[lang] || m.name?.vi || m.id;
                const mapSub = m.subtitle?.[lang] || m.subtitle?.vi || "";

                let secretSummary = "";
                if (unlocked && isCitadel) {
                  const cnt = [citadelSecrets?.tinClue, citadelSecrets?.baoClue, citadelSecrets?.combinedUnlocked].filter(Boolean).length;
                  secretSummary = isVi ? `Bí mật ${cnt}/3` : `Secrets ${cnt}/3`;
                } else if (unlocked && isInferno) {
                  const cnt = [infernoProgress?.dungClue, infernoProgress?.danhClue, infernoProgress?.longhoiClue, infernoProgress?.fourChairsUnlocked || infernoProgress?.trungTriggered].filter(Boolean).length;
                  secretSummary = isVi ? `Bí mật ${cnt}/4` : `Secrets ${cnt}/4`;
                } else if (unlocked && isFrozen) {
                  const cnt = [frozenTombProgress?.eohyenPaintingSeen, frozenTombProgress?.phongMirrorClue, frozenTombProgress?.minhSealClue, frozenTombProgress?.thanhVialClue, frozenTombProgress?.linkedDeviceTriggered].filter(Boolean).length;
                  secretSummary = isVi ? `Bí mật ${cnt}/5` : `Secrets ${cnt}/5`;
                } else if (unlocked && isForest) {
                  const cnt = [
                    grudgeForestProgress?.ee1SecretHouseSeen,
                    grudgeForestProgress?.ee2MirrorLakeSeen,
                    grudgeForestProgress?.ee3DuyLaughHeard || grudgeForestProgress?.ee3MaThachStoneSeen,
                    grudgeForestProgress?.ee5TrungRoomSeen,
                    grudgeForestProgress?.ee6FourMapSecretSeen,
                  ].filter(Boolean).length;
                  secretSummary = isVi ? `Bí mật ${cnt}/5` : `Secrets ${cnt}/5`;
                } else if (unlocked && isVoidCity) {
                  const cnt = countVoidCityRelics(voidCityProgress);
                  secretSummary = isVi ? `Di tích ${cnt}/6` : `Relics ${cnt}/6`;
                }

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (!unlocked) {
                        R.playError();
                        onSelectMap?.(m.id);
                        return;
                      }
                      R.playTabSwitch();
                      onSelectMap?.(m.id);
                    }}
                    className={`text-left rounded-xl p-2 border transition cursor-pointer flex items-center gap-2 ${
                      active
                        ? isCitadel
                          ? "bg-gradient-to-br from-[#230916]/95 via-[#150814] to-[#0B0712] border-rose-400/80 text-rose-50 shadow-[0_0_16px_rgba(225,29,72,0.18)]"
                          : isInferno
                          ? "bg-gradient-to-br from-[#260D08]/95 via-[#170907] to-[#0B0709] border-orange-400/85 text-orange-50 shadow-[0_0_16px_rgba(249,115,22,0.2)]"
                          : isFrozen
                          ? "bg-gradient-to-br from-[#081C33]/95 via-[#071124] to-[#050814] border-sky-400/85 text-sky-50 shadow-[0_0_16px_rgba(56,189,248,0.2)]"
                          : isForest
                          ? "bg-gradient-to-br from-[#062319]/95 via-[#130921] to-[#04080B] border-emerald-400/85 text-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                          : isVoidCity
                          ? "bg-gradient-to-br from-[#13172C]/95 via-[#0C0F1E] to-[#05060B] border-indigo-400/85 text-indigo-50 shadow-[0_0_16px_rgba(129,140,248,0.22)]"
                          : "bg-gradient-to-br from-amber-950/65 to-slate-950 border-amber-400/80 text-amber-50 shadow-[0_0_14px_rgba(245,158,11,0.15)]"
                        : unlocked
                          ? isCitadel
                            ? "bg-[#110812]/90 border-rose-900/50 hover:border-rose-500/60 text-slate-200"
                            : isInferno
                            ? "bg-[#140908]/90 border-orange-900/55 hover:border-orange-500/65 text-slate-200"
                            : isFrozen
                            ? "bg-[#071120]/90 border-sky-900/55 hover:border-sky-400/65 text-slate-200"
                            : isForest
                            ? "bg-[#071913]/90 border-emerald-900/55 hover:border-emerald-400/65 text-slate-200"
                            : isVoidCity
                            ? "bg-[#0B0E1A]/90 border-indigo-900/60 hover:border-indigo-400/70 text-slate-200"
                            : "bg-slate-900/90 border-slate-700/80 hover:border-slate-500 text-slate-200"
                          : "bg-slate-950/60 border-slate-800/70 text-slate-500 opacity-80"
                    }`}
                  >
                    {isCitadel ? (
                      <CitadelBlueprintEmblem
                        secrets={citadelSecrets}
                        unlocked={unlocked}
                        active={active}
                        className="w-9 h-9 shrink-0"
                      />
                    ) : isInferno ? (
                      <InfernoBlueprintEmblem
                        progress={infernoProgress}
                        active={active}
                        className="w-9 h-9 shrink-0"
                      />
                    ) : isFrozen ? (
                      <FrozenTombBlueprintEmblem className="w-9 h-9 shrink-0" />
                    ) : isForest ? (
                      <GrudgeForestBlueprintEmblem className="w-9 h-9 shrink-0" />
                    ) : isVoidCity ? (
                      <VoidCityBlueprintEmblem className="w-9 h-9 shrink-0" />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-md border flex items-center justify-center text-sm shrink-0 ${
                          active
                            ? "bg-amber-950/70 border-amber-400/70 text-amber-200"
                            : "bg-slate-900/90 border-slate-700/70 text-slate-300"
                        }`}
                      >
                        ⚔
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-moba font-extrabold leading-tight truncate">
                          {unlocked ? "" : "🔒 "}
                          {mapName}
                        </span>
                        {active && (
                          <span
                            className={`text-[9px] font-mono-numbers font-black uppercase tracking-wider shrink-0 ${
                              isCitadel ? "text-rose-300" : isInferno ? "text-orange-300" : isFrozen ? "text-sky-300" : isForest ? "text-emerald-300" : isVoidCity ? "text-indigo-300" : "text-amber-300"
                            }`}
                          >
                            ●
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug truncate">
                        {unlocked ? (secretSummary || mapSub) : getMapUnlockRequirement(m.id, lang)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {onOpenVoidCityRelics && isMapUnlocked("void_city", unlockedMaps, founderUnlocked) && (
              <button
                type="button"
                onClick={() => {
                  R.playModalOpen?.();
                  onOpenVoidCityRelics();
                }}
                className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#13172C] to-[#1D1234] border border-sky-400/45 hover:border-amber-300/75 text-[11px] font-moba font-bold text-amber-200 flex items-center justify-between cursor-pointer"
              >
                <span>❖ {isVi ? "Xưởng Di Tích Vạn Không (Phần Thưởng & Hồ Sơ)" : "Void City Relics Workshop (Upgrades & Dossiers)"}</span>
                <span className="font-mono-numbers text-sky-300">{countVoidCityRelics(voidCityProgress)}/6 ↗</span>
              </button>
            )}
          </div>

          {/* Group 3: Primary CTA + Grouped Secondary & Utility Controls */}
          <div className="flex flex-col gap-2 my-2.5">
            {resumableRun?.active && (
              <button
                type="button"
                onClick={() => {
                  R.playHeroLockIn();
                  onResumeRun?.();
                }}
                onMouseEnter={() => R.playHover()}
                className="w-full min-h-[46px] px-3 py-1.5 rounded-xl border border-emerald-400/75 bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-cyan-950/90 hover:from-emerald-900/95 hover:to-cyan-900/95 text-left shadow-lg transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-moba text-xs font-black text-emerald-200 tracking-wide truncate">
                    {resumableRun.heroId === "thien" && !founderUnlocked ? "🔒 " : "▶ "}
                    {isVi
                      ? `CHƠI TIẾP · MÀN ${resumableRun.wave}/27`
                      : `RESUME · WAVE ${resumableRun.wave}/27`}
                  </div>
                  <div className="text-[10px] font-mono-numbers text-cyan-200/90 truncate">
                    {resumeHeroName} · Lv.{resumableRun.level} · {resumeMapName}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-400/20 border border-emerald-400/50 text-[10px] font-moba font-black text-emerald-200">
                  {isVi ? "TIẾP TỤC" : "RESUME"}
                </span>
              </button>
            )}

            {/* Single Dominant Primary CTA */}
            <button
              type="button"
              onClick={() => {
                if (isHeroLocked) {
                  R.playError();
                  onRequireFounderAuth?.(hero);
                  return;
                }
                R.playHeroLockIn();
                R.playMatchStart();
                onEnterArena(hero);
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-primary min-h-[50px] text-base tracking-wide shadow-lg"
            >
              {isHeroLocked ? (
                <span>
                  🔒{" "}
                  {isVi
                    ? `MỞ KHÓA · ${heroShortName.toUpperCase()}`
                    : `UNLOCK · ${heroShortName.toUpperCase()}`}
                </span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>
                    {isVi
                      ? `VÀO TRẬN · ${heroShortName.toUpperCase()}`
                      : `ENTER ARENA · ${heroShortName.toUpperCase()}`}
                  </span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  R.playTabSwitch();
                  onOpenHeroSelect();
                }}
                onMouseEnter={() => R.playHover()}
                className="btn-secondary min-h-[40px] text-xs font-moba font-bold border-amber-500/40 text-amber-200 hover:border-amber-400"
              >
                {isVi ? `Đổi Tướng (${heroes.length})` : `Heroes (${heroes.length})`}
              </button>

              <button
                type="button"
                onClick={() => {
                  R.playModalOpen();
                  onOpenCoop();
                }}
                onMouseEnter={() => R.playHover()}
                className="btn-secondary min-h-[40px] text-xs font-moba font-bold border-cyan-500/45 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/45"
              >
                {mpRoom
                  ? `${isVi ? "Co-op" : "Co-op"} ${mpRoom.roomId} (${mpRoom.playerCount}/4)`
                  : isVi
                  ? "Tổ Đội Co-op 4P"
                  : "4P Co-op"}
              </button>
            </div>
          </div>

          {/* Grouped System Toolbar */}
          <div className="grid grid-cols-4 rounded-xl border border-slate-800 bg-slate-950/80 divide-x divide-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenShop();
              }}
              onMouseEnter={() => R.playHover()}
              className="min-h-[38px] px-1.5 text-[11px] font-moba font-bold text-amber-200 hover:bg-slate-800/70 transition-colors cursor-pointer truncate"
            >
              {isVi ? "Trang Bị" : "Armory"}
            </button>
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenAccountModal?.("leaderboard");
              }}
              onMouseEnter={() => R.playHover()}
              className="min-h-[38px] px-1.5 text-[11px] font-moba font-bold text-violet-200 hover:bg-slate-800/70 transition-colors cursor-pointer truncate"
            >
              {isVi ? "Xếp Hạng" : "Rank"}
            </button>
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenGuide();
              }}
              onMouseEnter={() => R.playHover()}
              className="min-h-[38px] px-1.5 text-[11px] font-moba font-bold text-slate-200 hover:bg-slate-800/70 transition-colors cursor-pointer truncate"
            >
              {strings.guide}
            </button>
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenSettings();
              }}
              onMouseEnter={() => R.playHover()}
              className="min-h-[38px] px-1.5 text-[11px] font-moba font-bold text-slate-200 hover:bg-slate-800/70 transition-colors cursor-pointer truncate"
            >
              {strings.settings}
            </button>
          </div>

          <div className="mt-auto pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenPatchNotes();
              }}
              className="hover:text-amber-300 transition-colors py-1 cursor-pointer"
            >
              {isVi ? "Bản 11.8" : "Patch 11.8"}
            </button>
            <button
              type="button"
              onClick={onDownloadOrShare}
              className="hover:text-sky-300 text-sky-200/90 transition-colors py-1 cursor-pointer"
            >
              {envInfo?.isInAppBrowser || envInfo?.isIOS
                ? isVi
                  ? "Mở Safari / Chia sẻ"
                  : "Safari / Share"
                : strings.downloadHtml}
            </button>
            {!(envInfo?.isInAppBrowser || envInfo?.isIOS) && (
              <button
                type="button"
                onClick={() => {
                  R.playModalOpen();
                  onOpenShareGuide();
                }}
                className="hover:text-cyan-300 transition-colors py-1 cursor-pointer"
              >
                {isVi ? "Zalo / iOS" : "Mobile Guide"}
              </button>
            )}
          </div>
        </aside>
      </main>

      <footer className="relative z-10 text-center text-[11px] text-slate-500 pt-1.5">
        {heroes.length} Tướng · 220 Trang Bị · 27 Màn · 9 Đại Trùm
      </footer>
    </div>
  );
}

export function MobaHeroSelect({
  lang,
  strings,
  heroes,
  selectedHero,
  coins,
  equippedCount,
  isFullscreen,
  SkillIcon,
  getSkillAimMeta,
  onSelectHero,
  onEnterArena,
  onOpenShop,
  onBack,
  onToggleFullscreen,
  founderUnlocked = false,
  onRequireFounderAuth,
  onOpenChronicles,
}) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [attackTrigger, setAttackTrigger] = useState(0);

  const filteredHeroes = useMemo(
    () => filterHeroesByRole(heroes, roleFilter),
    [heroes, roleFilter]
  );

  const hero = selectedHero || heroes[0];
  const isSelectedLocked = Boolean(hero?.isSecretFounder && !founderUnlocked);
  const roleLabels = HERO_ROLE_LABELS[lang] || HERO_ROLE_LABELS.vi;

  const handlePickHero = (candidate) => {
    if (candidate?.isSecretFounder && !founderUnlocked) {
      R.playModalOpen();
      onRequireFounderAuth?.(candidate);
      return;
    }
    R.playHeroSelect(candidate.id);
    setAttackTrigger((n) => n + 1);
    onSelectHero(candidate);
  };

  return (
    <div className="screen moba-hero-select-screen">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-2 gap-2 shrink-0">
        <button
          type="button"
          className="btn-secondary min-h-[36px] text-xs px-3 shrink-0"
          onClick={() => {
            R.playModalClose();
            onBack();
          }}
        >
          ← {strings.back}
        </button>

        <h2 className="font-title text-base sm:text-lg font-extrabold text-white truncate min-w-0">
          {strings.heroSelect}
        </h2>

        <div className="moba-utility-group shrink-0">
          <button
            type="button"
            className="moba-utility-btn text-amber-300 font-mono-numbers tabular-nums px-2.5"
            onClick={() => {
              R.playModalOpen();
              onOpenShop();
            }}
          >
            {lang === "vi" ? `Trang Bị (${coins.toLocaleString()} Xu)` : `Armory (${coins.toLocaleString()})`}
          </button>
          <button
            type="button"
            className="moba-utility-btn border-l border-slate-700/80 text-emerald-300 px-2.5"
            onClick={onToggleFullscreen}
            title={isFullscreen ? (lang === "vi" ? "Thu nhỏ màn hình" : "Exit fullscreen") : (lang === "vi" ? "Phóng to màn hình" : "Fullscreen")}
          >
            {isFullscreen ? "⤢" : "⛶"}
          </button>
        </div>
      </header>

      {/* Interactive Role Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0 border-b border-slate-800/70">
        {HERO_ROLE_ORDER.map((rKey) => {
          const active = roleFilter === rKey;
          const count = filterHeroesByRole(heroes, rKey).length;
          return (
            <button
              key={rKey}
              type="button"
              onClick={() => {
                R.playTabSwitch();
                setRoleFilter(rKey);
              }}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-moba font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                active
                  ? "bg-amber-500/20 border-amber-400 text-amber-200"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-600"
              }`}
            >
              {roleLabels[rKey]} ({count})
            </button>
          );
        })}
      </div>

      {/* Main 2-column Champion Roster & Live Stage */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2.5 flex flex-col lg:grid lg:grid-cols-12 gap-3">
        {/* Roster Grid (5 cols desktop) with Animated Portrait Thumbnails */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 max-h-[34dvh] lg:max-h-full overflow-y-auto pr-1 content-start">
          {filteredHeroes.map((candidate) => {
            const isSel = candidate.id === hero.id;
            const cName = candidate.name.split("(")[0].trim();
            const isLocked = Boolean(candidate.isSecretFounder && !founderUnlocked);
            const isFounderUnlocked = Boolean(candidate.isSecretFounder && founderUnlocked);
            const iconKeys = ["passive", "atk", ...(candidate.skills || []).map((sk) => sk.key)];
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => handlePickHero(candidate)}
                onMouseEnter={() => R.playHover()}
                className={`hero-card text-left w-full relative ${isSel ? "selected" : ""} ${
                  candidate.isSecretFounder
                    ? isLocked
                      ? "border-amber-500/45 bg-gradient-to-br from-slate-900/95 via-slate-950 to-amber-950/25"
                      : "border-amber-400/70 bg-gradient-to-br from-slate-900/95 via-sky-950/35 to-amber-950/30"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#060B16] border border-slate-700/70 shrink-0">
                    <HeroPreviewCanvas hero={candidate} compact interactive={false} locked={isLocked} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-moba text-sm font-bold text-white truncate leading-snug">
                        {cName}
                      </div>
                      {isLocked && (
                        <span className="text-[10px] font-moba font-extrabold text-amber-300 shrink-0">
                          🔒 KHÓA
                        </span>
                      )}
                      {isFounderUnlocked && (
                        <span className="text-[10px] font-moba font-extrabold text-sky-300 shrink-0">
                          ★ ĐÃ MỞ
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {candidate.role?.[lang]}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1">
                  {iconKeys.map((skId) => (
                    <SkillIcon
                      key={skId}
                      heroId={candidate.id}
                      skillId={skId}
                      size={iconKeys.length >= 6 ? 21 : 24}
                      roundedClass="rounded"
                    />
                  ))}
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono-numbers tabular-nums text-slate-400">
                  <span>
                    HP <b className="text-emerald-400">{candidate.stats.hp}</b>
                  </span>
                  <span>
                    ATK <b className="text-rose-400">{candidate.stats.damage}</b>
                  </span>
                  {candidate.stats.ap > 0 && (
                    <span>
                      AP <b className="text-violet-400">{candidate.stats.ap}</b>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Champion Stage & Detailed Kit (7 cols desktop) */}
        <div className="lg:col-span-7 hud-card flex-1 min-h-0 flex flex-col justify-between p-3.5 sm:p-4 overflow-y-auto">
          <div>
            {/* Live Preview + Header */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 border-b border-slate-800 pb-3">
              <div className="sm:col-span-5 relative h-[156px] sm:h-[168px] rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <HeroPreviewCanvas hero={hero} attackTrigger={attackTrigger} locked={isSelectedLocked} />
                <button
                  type="button"
                  onClick={() => {
                    setAttackTrigger((n) => n + 1);
                    R.playHeroSkillPreview(hero.id, "atk");
                  }}
                  className="btn-secondary absolute bottom-2 right-2 min-h-[34px] px-2.5 text-[11px] text-amber-200 border-amber-500/40 bg-slate-900/85"
                >
                  {lang === "vi" ? "Thử Chiêu" : "Test Skill"}
                </button>
              </div>

              <div className="sm:col-span-7 flex flex-col justify-between min-w-0">
                <div>
                  <div className="text-xs text-amber-400 font-moba font-semibold truncate">
                    {hero.title?.[lang]} · {hero.role?.[lang]} · {hero.weapon?.[lang]}
                  </div>
                  <h3 className="font-title text-xl font-extrabold text-white mt-0.5 leading-snug">
                    {hero.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs font-mono-numbers tabular-nums">
                  <div>
                    <div className="text-[11px] text-slate-400">{strings.hp}</div>
                    <div className="font-bold text-emerald-400">{hero.stats.hp}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">{strings.damage}</div>
                    <div className="font-bold text-rose-400">{hero.stats.damage}</div>
                  </div>
                  {hero.stats.ap > 0 ? (
                    <div>
                      <div className="text-[11px] text-slate-400">AP</div>
                      <div className="font-bold text-violet-400">{hero.stats.ap}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[11px] text-slate-400">{strings.range}</div>
                      <div className="font-bold text-amber-300">{hero.stats.range}px</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] text-slate-400">{strings.speed}</div>
                    <div className="font-bold text-cyan-400">{hero.stats.speed}</div>
                  </div>
                </div>

                {hero.levelScaling && (
                  <div className="text-[11px] font-mono-numbers text-slate-400 mt-1.5 tabular-nums">
                    {lang === "vi" ? "Tăng mỗi cấp:" : "Per level:"} +{hero.levelScaling.hp} HP · +
                    {hero.levelScaling.atk} ATK
                    {hero.levelScaling.ap > 0 ? ` · +${hero.levelScaling.ap} AP` : ""} · +
                    {hero.levelScaling.armor} {lang === "vi" ? "Giáp" : "Armor"}
                  </div>
                )}

                {HERO_CHRONICLES[hero.id] && (
                  <div className="mt-2.5 rounded-lg border border-rose-500/25 bg-rose-950/15 px-2.5 py-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300">
                        {HERO_CHRONICLES[hero.id].faction?.[lang] || ""}
                      </div>
                      <p className="text-[11px] text-slate-300 italic line-clamp-2 mt-0.5">
                        {HERO_CHRONICLES[hero.id].epitaph?.[lang] || ""}
                      </p>
                    </div>
                    {onOpenChronicles && (
                      <button
                        type="button"
                        onClick={() => {
                          R.playModalOpen();
                          onOpenChronicles("heroes", hero.id);
                        }}
                        className="shrink-0 text-[10px] font-bold px-2 py-1 rounded border border-rose-400/40 bg-rose-950/50 text-rose-200 hover:text-white transition cursor-pointer"
                      >
                        {lang === "vi" ? "Tiểu Sử" : "Lore"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Passive + Basic + Skills */}
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setAttackTrigger((n) => n + 1);
                  R.playHeroSkillPreview(hero.id, "passive");
                }}
                className="text-left bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/70 transition-colors p-2.5 rounded-xl flex items-start gap-3 cursor-pointer"
              >
                <SkillIcon heroId={hero.id} skillId="passive" size={44} roundedClass="rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-amber-400 font-moba">
                    {lang === "vi" ? "Nội tại (Bị động)" : "Passive"}
                  </div>
                  <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                    {hero.passive?.[lang]}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttackTrigger((n) => n + 1);
                  R.playHeroSkillPreview(hero.id, "atk");
                }}
                className="text-left bg-slate-900/80 border border-slate-800 hover:border-slate-600 transition-colors p-2.5 rounded-xl flex items-start gap-3 cursor-pointer"
              >
                <SkillIcon heroId={hero.id} skillId="atk" size={44} roundedClass="rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="font-bold text-white font-moba truncate">
                      {lang === "vi" ? "Đánh thường" : "Basic Attack"} · {hero.weapon?.[lang]}
                    </span>
                    <span className="font-mono-numbers text-slate-400 text-[11px] tabular-nums shrink-0">
                      {lang === "vi" ? "Tầm" : "Range"} {hero.stats.range}px
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {lang === "vi"
                      ? `Sát thương cơ bản ${hero.stats.damage}${hero.stats.ap > 0 ? ` · Phép ${hero.stats.ap}` : ""} · Tốc độ ${(1 / hero.stats.attackInterval).toFixed(2)} đòn/s · Chí mạng ${Math.round(hero.baseCrit * 100)}%.`
                      : `Base damage ${hero.stats.damage}${hero.stats.ap > 0 ? ` · AP ${hero.stats.ap}` : ""} · Speed ${(1 / hero.stats.attackInterval).toFixed(2)}/s · Crit ${Math.round(hero.baseCrit * 100)}%.`}
                  </p>
                </div>
              </button>

              {(hero.skills || []).map((sk) => {
                const aimMeta = getSkillAimMeta(hero.id, sk.key, lang);
                return (
                  <button
                    key={sk.key}
                    type="button"
                    onClick={() => {
                      setAttackTrigger((n) => n + 1);
                      R.playHeroSkillPreview(hero.id, sk.key);
                    }}
                    className="text-left bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-colors rounded-xl p-2.5 flex items-start gap-3 cursor-pointer"
                  >
                    <SkillIcon heroId={hero.id} skillId={sk.key} size={48} roundedClass="rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-xs gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`font-mono-numbers text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                              sk.key === "c3" || sk.key === "c4"
                                ? "bg-amber-500 text-slate-950"
                                : "bg-cyan-500 text-slate-950"
                            }`}
                          >
                            {sk.label}
                          </span>
                          <span className="font-bold text-white font-moba truncate">
                            {sk.name?.[lang]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                          <span className="font-semibold" style={{ color: aimMeta.color }}>
                            {aimMeta.label}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono-numbers text-slate-400 tabular-nums">
                            {sk.cooldown}s
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {sk.description?.[lang]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2">
            <span className="text-xs text-slate-400 font-moba tabular-nums">
              {lang === "vi"
                ? `Trang bị sẵn sàng: ${equippedCount || 0}/6 món`
                : `Gear equipped: ${equippedCount || 0}/6`}
            </span>
            <button
              type="button"
              className="btn-primary min-h-[44px] text-xs px-6"
              onClick={() => {
                if (isSelectedLocked) {
                  R.playError();
                  onRequireFounderAuth?.(hero);
                  return;
                }
                R.playHeroLockIn();
                R.playMatchStart();
                onEnterArena(hero);
              }}
            >
              {isSelectedLocked
                ? lang === "vi"
                  ? "🔒 XÁC THỰC ĐỂ MỞ KHÓA THIÊN"
                  : "🔒 VERIFY TO UNLOCK THIÊN"
                : lang === "vi"
                ? "KHÓA TƯỚNG & VÀO TRẬN →"
                : "LOCK IN & ENTER ARENA →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
