import React, { useEffect, useState } from "react";
import { Mi } from "./gameData";
import {
  WORLD_CHRONICLE_TITLE,
  WORLD_CHRONICLE_SUBTITLE,
  CHRONICLE_CHAPTERS,
  HERO_CHRONICLES,
  BOSS_CHRONICLES,
  buildCitadelChronicleOverview,
  buildInfernoChronicleOverview,
} from "./darkFantasyLore";
import { CitadelBlueprintEmblem, CitadelLoreCrest } from "./CitadelVisuals";
import { InfernoBlueprintEmblem } from "./InfernoVisuals";

const TAB_LABELS = {
  world: { vi: "Biên Niên Sử", en: "World Lore" },
  heroes: { vi: "21 Anh Hùng", en: "21 Heroes" },
  bosses: { vi: "9 Đại Trùm", en: "9 Bosses" },
  inferno: { vi: "Hỏa Ngục Tàn Tro", en: "Inferno of Ashes" },
  citadel: { vi: "Cổ Thành Huyết Táng", en: "Blood Citadel" },
};

export function ChroniclesModal({
  open,
  lang = "vi",
  heroes = Mi,
  initialTab = "world",
  focusHeroId = null,
  founderUnlocked = false,
  citadelUnlocked = false,
  citadelSecrets = { tinClue: false, baoClue: false, combinedUnlocked: false, inspectedNodes: [] },
  infernoProgress = null,
  onSelectHero,
  onSelectInfernoMap,
  onSelectCitadelMap,
  onClose,
}) {
  const safeLang = lang === "en" ? "en" : "vi";
  const [tab, setTab] = useState(initialTab);
  const [selectedHeroId, setSelectedHeroId] = useState(focusHeroId || heroes[0]?.id || "tin");

  useEffect(() => {
    if (!open) return;
    if (focusHeroId) {
      setSelectedHeroId(focusHeroId);
      setTab("heroes");
    } else if (initialTab) {
      setTab(initialTab);
    }
  }, [open, focusHeroId, initialTab]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const isVi = safeLang === "vi";
  const activeHero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];
  const heroLore = HERO_CHRONICLES[activeHero?.id] || HERO_CHRONICLES.dung;
  const citadelOverview = buildCitadelChronicleOverview(citadelSecrets, safeLang);
  const infernoOverview = buildInfernoChronicleOverview(infernoProgress, safeLang);
  const canPickHero = activeHero && (!activeHero.isSecretFounder || founderUnlocked);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-rose-500/35 bg-[#070b14] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(190, 18, 60, 0.14), transparent 46%), radial-gradient(circle at 88% 100%, rgba(124, 58, 237, 0.14), transparent 45%)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 border-b border-rose-500/20 bg-slate-950/75">
          <div>
            <div className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-rose-400">
              {WORLD_CHRONICLE_SUBTITLE[safeLang]}
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-amber-100">
              {WORLD_CHRONICLE_TITLE[safeLang]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-rose-400/60 hover:text-white transition"
          >
            {isVi ? "Đóng [ESC]" : "Close [ESC]"}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/55">
          {Object.entries(TAB_LABELS).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition border ${
                  active
                    ? "bg-rose-950/80 border-rose-400/70 text-amber-200 shadow-[0_0_16px_rgba(244,63,94,0.22)]"
                    : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {label[safeLang]}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === "world" && (
            <div className="space-y-4">
              {CHRONICLE_CHAPTERS.map((chap) => (
                <article
                  key={chap.id}
                  className="rounded-xl border border-slate-800/90 bg-slate-950/65 p-4 sm:p-5"
                >
                  <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400/90">
                    {chap.eraTag[safeLang]}
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-white">
                    {chap.title[safeLang]}
                  </h3>
                  <blockquote className="mt-2.5 border-l-2 border-rose-500/70 pl-3 text-sm italic text-rose-200/90">
                    {chap.epigraph[safeLang]}
                  </blockquote>
                  <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-300">
                    {chap.paragraphs[safeLang].map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === "heroes" && (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
              {/* Hero Selector Rail */}
              <div className="max-h-[240px] lg:max-h-[58vh] overflow-y-auto pr-1 space-y-1.5 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-3 lg:pb-0 lg:pr-3">
                {heroes.map((hero, idx) => {
                  const selected = hero.id === activeHero?.id;
                  const shortName = String(hero.name || "").split("(")[0].trim();
                  const lockedSecret = Boolean(hero.isSecretFounder && !founderUnlocked);
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => setSelectedHeroId(hero.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center justify-between gap-2 ${
                        selected
                          ? "bg-rose-950/65 border-rose-400/75 text-white"
                          : "bg-slate-900/55 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: hero.color || "#38BDF8" }}
                          />
                          <span>
                            {String(idx + 1).padStart(2, "0")}. {shortName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {hero.title?.[safeLang] || hero.role?.[safeLang]}
                        </div>
                      </div>
                      {lockedSecret && (
                        <span className="text-[10px] font-mono text-amber-400 shrink-0">
                          {isVi ? "BÍ MẬT" : "SECRET"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Hero Dossier */}
              {activeHero && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6 flex flex-col justify-between gap-5">
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-400">
                      {heroLore.faction[safeLang]} · {activeHero.role?.[safeLang]}
                    </div>
                    <h3 className="mt-1 text-2xl font-black text-amber-100">
                      {String(activeHero.name || "").split("(")[0].trim()} —{" "}
                      <span style={{ color: activeHero.color || "#FBBF24" }}>
                        {activeHero.title?.[safeLang]}
                      </span>
                    </h3>
                    <div className="mt-1 text-xs font-semibold text-slate-400">
                      {heroLore.originTitle[safeLang]}
                    </div>

                    <blockquote className="mt-4 border-l-2 border-amber-400/75 pl-3.5 text-sm italic text-amber-100/90">
                      {heroLore.epitaph[safeLang]}
                    </blockquote>

                    <p className="mt-4 text-sm leading-relaxed text-slate-200">
                      {heroLore.story[safeLang]}
                    </p>

                    <div className="mt-4 rounded-lg border border-rose-500/25 bg-rose-950/20 p-3.5">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300">
                        {isVi ? "LIÊN KẾT VỚI CỔ THÀNH HUYẾT TÁNG" : "BOND TO BLOODSOAKED CITADEL"}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {heroLore.citadelBond[safeLang]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      HP {activeHero.stats?.hp} · ATK {activeHero.stats?.damage} · AP {activeHero.stats?.ap || 0} · SPD {activeHero.stats?.speed}
                    </div>
                    {canPickHero && onSelectHero ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectHero(activeHero.id);
                          onClose?.();
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 text-xs font-extrabold text-white shadow-lg hover:brightness-110 transition"
                      >
                        {isVi ? "Chọn Tướng Này Vào Đấu Trường" : "Deploy This Hero"}
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-amber-400">
                        {isVi
                          ? "Yêu cầu Mật Khẩu Nhà Sáng Lập để điều khiển Thiên"
                          : "Founder authentication required to command Thiên"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "bosses" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {BOSS_CHRONICLES.map((boss) => (
                <div
                  key={boss.wave}
                  className={`rounded-xl border p-4 bg-slate-950/70 ${
                    boss.wave === 27
                      ? "md:col-span-2 border-amber-500/45 bg-gradient-to-br from-rose-950/35 to-slate-950"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">
                    <span>
                      {isVi ? `MÀN ${boss.wave}` : `WAVE ${boss.wave}`} · {boss.domain[safeLang]}
                    </span>
                    {boss.wave === 27 && (
                      <span className="text-amber-300">
                        {isVi ? "PHONG ẤN CUỐI" : "FINAL SEAL"}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 text-base font-extrabold text-white">
                    {boss.name[safeLang]}
                  </h4>
                  <p className="mt-1.5 text-xs italic text-rose-200/85">
                    {boss.omen[safeLang]}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {boss.lore[safeLang]}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "inferno" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-950/35 via-slate-950 to-slate-950 p-4 sm:p-5 flex items-start gap-4">
                <InfernoBlueprintEmblem
                  progress={infernoProgress}
                  active={true}
                  className="w-16 h-16 sm:w-[72px] sm:h-[72px] hidden sm:block"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-orange-100">
                      {infernoOverview.title}
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {infernoOverview.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {infernoOverview.summary}
                  </p>
                  <div className="mt-2 text-xs font-mono text-orange-300">
                    {infernoOverview.docsProgress}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className={`rounded-xl border p-4 ${infernoOverview.dungDossier.locked ? "border-slate-800 bg-slate-950/60" : "border-yellow-500/55 bg-yellow-950/20"}`}>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-yellow-300">
                    ⛓ DŨNG · {isVi ? "KHU 3 HẦM HIẾN TẾ" : "ZONE 3 CRYPT"}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {infernoOverview.dungDossier.text}
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${infernoOverview.danhDossier.locked ? "border-slate-800 bg-slate-950/60" : "border-orange-500/55 bg-orange-950/20"}`}>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-300">
                    🐉 DANH · {isVi ? "KHU 4 ĐIỆN RỒNG" : "ZONE 4 TEMPLE"}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {infernoOverview.danhDossier.text}
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${infernoOverview.longhoiDossier.locked ? "border-slate-800 bg-slate-950/60" : "border-amber-500/55 bg-amber-950/20"}`}>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    📡 LONG HÓI · {isVi ? "KHU 5 PHÁO ĐÀI" : "ZONE 5 BASTION"}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {infernoOverview.longhoiDossier.text}
                  </p>
                </div>
              </div>

              <div className={`rounded-xl border p-4 sm:p-5 ${infernoOverview.fourChairsDossier.trungDone ? "border-purple-400/75 bg-purple-950/25" : infernoOverview.fourChairsDossier.locked ? "border-slate-800 bg-slate-950/65" : "border-fuchsia-400/65 bg-fuchsia-950/20"}`}>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300">
                  🔮 {isVi ? "ĐÔNG PHỤC CHÍNH · KHU 7 CĂN PHÒNG BỐN CHIẾC GHẾ & TRUNG" : "FINAL EASTER EGG · ZONE 7 FOUR CHAIRS & TRUNG"}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-100">
                  {infernoOverview.fourChairsDossier.text}
                </p>
                {onSelectInfernoMap && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      {isVi ? "Bản đồ mở sẵn cho mọi người chơi (2400×2100 · 8 Khu Vực)." : "Available immediately for all players (2400×2100 · 8 Zones)."}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectInfernoMap();
                        onClose?.();
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-xs font-extrabold text-white hover:brightness-110 transition cursor-pointer"
                    >
                      {isVi ? "Chọn Map Hỏa Ngục Tàn Tro" : "Select Inferno of Ashes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "citadel" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-500/35 bg-gradient-to-br from-rose-950/35 via-slate-950 to-slate-950 p-4 sm:p-5 flex items-start gap-4">
                <CitadelBlueprintEmblem
                  secrets={citadelSecrets}
                  unlocked={citadelUnlocked}
                  active={true}
                  className="w-16 h-16 sm:w-[72px] sm:h-[72px] hidden sm:block"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-amber-100">
                      {citadelOverview.title}
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {citadelOverview.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {citadelOverview.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div
                  className={`rounded-xl border p-4 ${
                    citadelOverview.tinDossier.locked
                      ? "border-slate-800 bg-slate-950/60"
                      : "border-rose-500/55 bg-rose-950/25"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CitadelLoreCrest
                      nodeId="tin_lab"
                      resonated={!citadelOverview.tinDossier.locked}
                      className="w-11 h-11"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">
                        #MT-07 · {isVi ? "EASTER EGG · TIN (MA THẠCH & MÁU)" : "EASTER EGG · TIN (MA THACH & BLOOD)"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {isVi ? "Đông Bắc · Tọa độ (1440, 175)" : "NE Ruins · Coords (1440, 175)"}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-200">
                    {citadelOverview.tinDossier.text}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    citadelOverview.baoDossier.locked
                      ? "border-slate-800 bg-slate-950/60"
                      : "border-purple-500/55 bg-purple-950/25"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CitadelLoreCrest
                      nodeId="bao_mirror"
                      resonated={!citadelOverview.baoDossier.locked}
                      className="w-11 h-11"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300">
                        #BS-04 · {isVi ? "EASTER EGG · BẢO (TÀNG HÌNH & PHÂN THÂN)" : "EASTER EGG · BAO (STEALTH & REPLICA)"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {isVi ? "Tây Nam · Tọa độ (165, 1215)" : "SW Alcove · Coords (165, 1215)"}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-200">
                    {citadelOverview.baoDossier.text}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 sm:p-5 ${
                  citadelOverview.combinedDossier.locked
                    ? "border-slate-800 bg-slate-950/65"
                    : "border-amber-400/70 bg-amber-950/20"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <CitadelLoreCrest
                    nodeId="shared_altar"
                    resonated={!citadelOverview.tinDossier.locked && !citadelOverview.baoDossier.locked}
                    combined={!citadelOverview.combinedDossier.locked}
                    className="w-12 h-12"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                      #ZERO-00 · {isVi ? "BÍ MẬT CHUNG · HẦM BÍ MẬT PHÍA BẮC" : "SHARED SECRET · NORTHERN SECRET VAULT"}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {isVi ? "Hầm Bắc · Tọa độ (800, 185)" : "North Vault · Coords (800, 185)"}
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-100">
                  {citadelOverview.combinedDossier.text}
                </p>

                {onSelectCitadelMap && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      {citadelUnlocked
                        ? founderUnlocked
                          ? isVi
                            ? "Đang bật quyền Nhà Sáng Lập: có thể chuyển tự do giữa Cổ Thành & Cổ Điển."
                            : "Founder access active: free map switching unlocked."
                          : isVi
                          ? "Đã mở khóa vĩnh viễn sau khi vượt Màn 27 Đấu Trường Cổ Điển."
                          : "Unlocked permanently by clearing Classic Wave 27."
                        : isVi
                        ? "Bị khóa: cần hoàn thành Màn 27 Đấu Trường Cổ Điển (hoặc mở khóa tướng Thiên)."
                        : "Locked: clear Classic Wave 27 (or unlock Founder hero Thiên)."}
                    </span>
                    {citadelUnlocked && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCitadelMap();
                          onClose?.();
                        }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 text-xs font-extrabold text-white hover:brightness-110 transition"
                      >
                        {isVi ? "Chọn Map Cổ Thành Huyết Táng" : "Select Bloodsoaked Citadel"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChroniclesModal;
