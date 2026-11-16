import React, { useMemo, useState } from "react";
import HeroPreviewCanvas from "./HeroPreviewCanvas.jsx";
import { R } from "./soundEngine.js";
import {
  HERO_ROLE_LABELS,
  HERO_ROLE_ORDER,
  filterHeroesByRole,
  getHeroRoleKey,
} from "./combatLogic.ts";

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
}) {
  const [attackTrigger, setAttackTrigger] = useState(0);
  const [previewSkillKey, setPreviewSkillKey] = useState("c3");

  const currentIdx = Math.max(
    0,
    heroes.findIndex((h) => h.id === selectedHero?.id)
  );
  const hero = heroes[currentIdx] || selectedHero || heroes[0];
  const heroShortName = (hero?.name || "").split("(")[0].trim();
  const roleLabel = HERO_ROLE_LABELS[lang]?.[getHeroRoleKey(hero.id)] || hero.role?.[lang] || "";

  const skillEntries = useMemo(() => {
    if (!hero) return [];
    return [
      {
        key: "passive",
        label: lang === "vi" ? "Nội tại" : "Passive",
        name: lang === "vi" ? "Nội Tại" : "Passive",
        desc: hero.passive?.[lang] || "",
      },
      {
        key: "atk",
        label: lang === "vi" ? "Đánh" : "ATK",
        name: hero.weapon?.[lang] || (lang === "vi" ? "Đánh Thường" : "Basic Attack"),
        desc:
          lang === "vi"
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
  }, [hero, lang]);

  const activeSkill =
    skillEntries.find((s) => s.key === previewSkillKey) || skillEntries[skillEntries.length - 1];

  const cycleHero = (delta) => {
    if (!heroes.length) return;
    const nextIdx = (currentIdx + delta + heroes.length) % heroes.length;
    const nextHero = heroes[nextIdx];
    R.playHeroSelect(nextHero.id);
    setAttackTrigger((n) => n + 1);
    onSelectHero(nextHero);
  };

  const handlePreviewSkill = (key) => {
    setPreviewSkillKey(key);
    setAttackTrigger((n) => n + 1);
    R.playHeroSkillPreview(hero.id, key);
  };

  return (
    <div className="screen moba-lobby-screen">
      <div className="bg-radial-glow" />

      {/* Top MOBA Command Bar (3 balanced zones) */}
      <header className="moba-topbar relative z-10">
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-amber-500/50 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-title text-base sm:text-lg font-extrabold text-white tracking-wide whitespace-nowrap shrink-0">
            Arena Hero 11.8
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300">
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenPatchNotes();
            }}
            onMouseEnter={() => R.playHover()}
            className="hover:text-amber-300 transition-colors py-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === "vi" ? "Bản Cập Nhật 11.8" : "Patch 11.8"}
          </button>
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenShop();
            }}
            onMouseEnter={() => R.playHover()}
            className="hover:text-amber-300 transition-colors py-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === "vi" ? "Kho Trang Bị" : "Armory"}
          </button>
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenGuide();
            }}
            onMouseEnter={() => R.playHover()}
            className="hover:text-cyan-300 transition-colors py-2 whitespace-nowrap shrink-0 cursor-pointer"
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
            className="hover:text-cyan-300 transition-colors py-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {strings.settings}
          </button>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => {
              R.playModalOpen();
              onOpenShop();
            }}
            className="btn-secondary min-h-[40px] px-2.5 sm:px-3 text-xs font-mono-numbers font-bold text-amber-300 border-amber-500/40 whitespace-nowrap shrink-0"
            title={lang === "vi" ? "Mở Kho Trang Bị" : "Open Armory"}
          >
            <span className="tabular-nums">{coins.toLocaleString()} Xu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              R.playClick();
              onToggleSfx();
            }}
            className={`btn-secondary min-h-[40px] px-2 sm:px-2.5 text-xs whitespace-nowrap shrink-0 ${
              sfxEnabled ? "text-emerald-300 border-emerald-500/40" : "text-slate-400"
            }`}
            title={lang === "vi" ? "Bật/Tắt Hiệu Ứng Âm Thanh" : "Toggle SFX"}
          >
            {sfxEnabled ? "SFX ON" : "SFX OFF"}
          </button>

          <button
            type="button"
            onClick={() => {
              R.playClick();
              onToggleMusic();
            }}
            className={`btn-secondary min-h-[40px] px-2 sm:px-2.5 text-xs whitespace-nowrap shrink-0 ${
              musicEnabled ? "text-cyan-300 border-cyan-500/40" : "text-slate-400"
            }`}
            title={lang === "vi" ? "Bật/Tắt Nhạc Nền" : "Toggle Music"}
          >
            {musicEnabled ? "BGM ON" : "BGM OFF"}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? (lang === "vi" ? "Thu nhỏ màn hình" : "Exit fullscreen") : (lang === "vi" ? "Phóng to màn hình" : "Fullscreen")}
            title={isFullscreen ? (lang === "vi" ? "Thu nhỏ màn hình" : "Exit fullscreen") : (lang === "vi" ? "Phóng to màn hình" : "Fullscreen")}
            className="btn-secondary min-h-[40px] px-2.5 text-xs font-moba font-bold text-emerald-200 border-emerald-500/50 bg-emerald-950/35 hover:bg-emerald-900/50 whitespace-nowrap shrink-0 inline-flex"
          >
            {isFullscreen
              ? lang === "vi"
                ? "⤢ Thu Nhỏ"
                : "⤢ Exit Full"
              : lang === "vi"
              ? "⛶ Phóng To"
              : "⛶ Fullscreen"}
          </button>

          <button
            type="button"
            onClick={() => {
              R.playTabSwitch();
              onToggleLang();
            }}
            className="btn-secondary min-h-[40px] px-2.5 text-xs whitespace-nowrap shrink-0"
          >
            {lang === "vi" ? "VI" : "EN"}
          </button>
        </div>
      </header>

      {/* Main MOBA Command Hall Body */}
      <main className="moba-lobby-grid relative z-10 flex-1 min-h-0 overflow-y-auto">
        {/* Left/Center: Live Animated Hero Showcase Stage */}
        <section className="moba-showcase-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-400 truncate">
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
                aria-label={lang === "vi" ? "Tướng trước" : "Previous hero"}
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
                aria-label={lang === "vi" ? "Tướng tiếp theo" : "Next hero"}
              >
                ›
              </button>
            </div>
          </div>

          {/* Live Animated Hero Canvas */}
          <div className="moba-stage-canvas-wrap relative flex-1 min-h-[168px] my-2 rounded-xl border border-slate-800/80 bg-slate-950/65 overflow-hidden">
            <HeroPreviewCanvas
              hero={hero}
              attackTrigger={attackTrigger}
              onPreviewStrike={() => {}}
            />
            <button
              type="button"
              onClick={() => handlePreviewSkill("atk")}
              className="btn-secondary absolute bottom-2.5 right-2.5 min-h-[36px] px-3 text-[11px] text-amber-200 border-amber-500/40 bg-slate-900/85"
            >
              {lang === "vi" ? "Thử Đánh" : "Test Strike"}
            </button>
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
              <div className="text-[11px] text-slate-400">
                {hero.stats.ap > 0 ? "AP" : strings.range}
              </div>
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
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors shrink-0 min-h-[42px] cursor-pointer ${
                      isSelected
                        ? "bg-slate-800/95 border-amber-400/80 text-white"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <SkillIcon heroId={hero.id} skillId={sk.key} size={28} roundedClass="rounded-md" />
                    <span className="font-mono-numbers text-xs font-bold whitespace-nowrap">
                      {sk.label}
                    </span>
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

        {/* Right: MOBA Battle Command Dock */}
        <aside className="moba-command-dock">
          <div className="border-b border-slate-800/90 pb-3">
            <h2 className="font-title text-lg sm:text-xl font-extrabold text-white">
              {lang === "vi" ? "Sảnh Chiến Đấu" : "Battle Command"}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {lang === "vi"
                ? "Đấu trường 27 màn sinh tồn · 9 chủng quái · 9 Đại Trùm độc bản"
                : "27 survival waves · 9 monster classes · 9 unique major bosses"}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 my-3">
            {/* Single Dominant Primary CTA */}
            <button
              type="button"
              onClick={() => {
                R.playHeroLockIn();
                R.playMatchStart();
                onEnterArena(hero);
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-primary min-h-[54px] text-base tracking-wide shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>
                {lang === "vi"
                  ? `VÀO TRẬN · ${heroShortName.toUpperCase()}`
                  : `ENTER ARENA · ${heroShortName.toUpperCase()}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                R.playTabSwitch();
                onOpenHeroSelect();
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-secondary min-h-[46px] text-sm font-moba font-bold border-amber-500/45 text-amber-200 hover:border-amber-400"
            >
              <span>
                {lang === "vi"
                  ? `Chọn Anh Hùng (${heroes.length} Vị Tướng)`
                  : `Champion Select (${heroes.length} Heroes)`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenCoop();
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-secondary min-h-[46px] text-sm font-moba font-bold border-cyan-500/50 bg-cyan-950/35 text-cyan-200 hover:bg-cyan-900/50"
            >
              <span>
                {mpRoom
                  ? `${lang === "vi" ? "Phòng Co-op" : "Co-op Room"} ${mpRoom.roomId} · ${mpRoom.playerCount}/4`
                  : lang === "vi"
                  ? "Tổ Đội Co-op 4 Người"
                  : "4-Player Co-op Squad"}
              </span>
            </button>
          </div>

          {/* 2-up Secondary Feature Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenShop();
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-secondary min-h-[44px] text-xs font-bold border-amber-500/35 text-amber-100"
            >
              {lang === "vi" ? "Kho Trang Bị (220)" : "Armory (220)"}
            </button>
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenGuide();
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-secondary min-h-[44px] text-xs font-bold"
            >
              {strings.guide}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenSettings();
              }}
              onMouseEnter={() => R.playHover()}
              className="btn-secondary min-h-[42px] text-xs"
            >
              {strings.settings}
            </button>
            <button
              type="button"
              onClick={onDownloadOrShare}
              onMouseEnter={() => R.playHover()}
              className="btn-secondary min-h-[42px] text-xs border-sky-500/40 text-sky-200"
            >
              {envInfo?.isInAppBrowser || envInfo?.isIOS
                ? lang === "vi"
                  ? "Mở Safari / Chia sẻ"
                  : "Safari / Share"
                : strings.downloadHtml}
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleFullscreen}
            onMouseEnter={() => R.playHover()}
            className="btn-secondary min-h-[42px] w-full mt-2.5 text-xs font-moba font-bold border-emerald-500/50 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/45"
          >
            {isFullscreen
              ? lang === "vi"
                ? "⤢ Thu Nhỏ Màn Hình"
                : "⤢ Exit Fullscreen"
              : lang === "vi"
              ? "⛶ Phóng To Màn Hình"
              : "⛶ Fullscreen Mode"}
          </button>

          <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => {
                R.playModalOpen();
                onOpenPatchNotes();
              }}
              className="hover:text-amber-300 transition-colors py-1 cursor-pointer"
            >
              {lang === "vi" ? "Chi tiết bản 11.8" : "Patch 11.8 Notes"}
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
                {lang === "vi" ? "Hướng dẫn Zalo / iOS" : "Mobile / iOS Guide"}
              </button>
            )}
          </div>
        </aside>
      </main>

      <footer className="relative z-10 text-center text-xs text-slate-500 pt-2">
        16 Tướng Huyền Thoại · 220 Trang Bị 6 Cấp · 27 Màn Sinh Tồn · 9 Đại Trùm Độc Bản
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
}) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [attackTrigger, setAttackTrigger] = useState(0);

  const filteredHeroes = useMemo(
    () => filterHeroesByRole(heroes, roleFilter),
    [heroes, roleFilter]
  );

  const hero = selectedHero || heroes[0];
  const roleLabels = HERO_ROLE_LABELS[lang] || HERO_ROLE_LABELS.vi;

  const handlePickHero = (candidate) => {
    R.playHeroSelect(candidate.id);
    setAttackTrigger((n) => n + 1);
    onSelectHero(candidate);
  };

  return (
    <div className="screen moba-hero-select-screen">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-2.5 gap-2 shrink-0">
        <button
          type="button"
          className="btn-secondary min-h-[40px] text-xs px-3 shrink-0"
          onClick={() => {
            R.playModalClose();
            onBack();
          }}
        >
          ← {strings.back}
        </button>

        <h2 className="font-title text-base sm:text-xl font-extrabold text-white truncate min-w-0">
          {strings.heroSelect}
        </h2>

        <div className="flex gap-2 shrink-0 flex-wrap items-center">
          <button
            type="button"
            className="btn-secondary min-h-[40px] text-xs px-2.5 border-emerald-500/50 bg-emerald-950/30 text-emerald-200 inline-flex"
            onClick={onToggleFullscreen}
            title={isFullscreen ? (lang === "vi" ? "Thu nhỏ màn hình" : "Exit fullscreen") : (lang === "vi" ? "Phóng to màn hình" : "Fullscreen")}
          >
            {isFullscreen ? (lang === "vi" ? "⤢ Thu Nhỏ" : "⤢ Exit") : (lang === "vi" ? "⛶ Phóng To" : "⛶ Full")}
          </button>
          <button
            type="button"
            className="btn-secondary min-h-[40px] text-xs px-3 border-amber-500/40 text-amber-200 font-mono-numbers tabular-nums"
            onClick={() => {
              R.playModalOpen();
              onOpenShop();
            }}
          >
            {lang === "vi" ? `Trang Bị (${coins.toLocaleString()} Xu)` : `Armory (${coins.toLocaleString()})`}
          </button>
          <button
            type="button"
            className="btn-primary min-h-[40px] text-xs px-4"
            onClick={() => {
              R.playHeroLockIn();
              R.playMatchStart();
              onEnterArena(hero);
            }}
          >
            {lang === "vi" ? "KHÓA TƯỚNG & VÀO TRẬN" : "LOCK IN & FIGHT"} →
          </button>
        </div>
      </header>

      {/* Interactive Role Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 shrink-0 border-b border-slate-800/70">
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
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-moba font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
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
      <div className="flex-1 min-h-0 overflow-y-auto py-3 flex flex-col lg:grid lg:grid-cols-12 gap-3.5">
        {/* Roster Grid (5 cols desktop) */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 max-h-[34dvh] lg:max-h-full overflow-y-auto pr-1 content-start">
          {filteredHeroes.map((candidate) => {
            const isSel = candidate.id === hero.id;
            const cName = candidate.name.split("(")[0].trim();
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => handlePickHero(candidate)}
                onMouseEnter={() => R.playHover()}
                className={`hero-card text-left w-full ${isSel ? "selected" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <SkillIcon
                    heroId={candidate.id}
                    skillId="c3"
                    size={36}
                    roundedClass="rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-moba text-sm font-bold text-white truncate leading-snug">
                      {cName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {candidate.role?.[lang]}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1">
                  {["passive", "atk", "c1", "c2", "c3"].map((skId) => (
                    <SkillIcon
                      key={skId}
                      heroId={candidate.id}
                      skillId={skId}
                      size={24}
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
                <HeroPreviewCanvas hero={hero} attackTrigger={attackTrigger} />
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
              </div>
            </div>

            {/* Passive + Basic + 3 Skills (clickable for SFX preview) */}
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
                              sk.key === "c3"
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
                R.playHeroLockIn();
                R.playMatchStart();
                onEnterArena(hero);
              }}
            >
              {lang === "vi" ? "KHÓA TƯỚNG & VÀO TRẬN" : "LOCK IN & ENTER ARENA"} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
