import React, { useEffect, useState } from "react";
import { R } from "./gameData";
import {
  VOID_CITY_WIDTH,
  VOID_CITY_HEIGHT,
  VOID_CITY_ZONES,
  VOID_CITY_INTERACTABLES,
  VOID_CITY_DOCS,
  VOID_CITY_CHESTS,
  VOID_CITY_CONSTELLATION_SYMBOLS,
  RELIC2_TOMB_STATUES,
  RELIC3_ARCHIVE_PAGES,
  RELIC4_PEDESTALS,
  RELIC4_MASKS,
  RELIC5_MIRRORS,
  RELIC6_CONDUIT_TOKENS,
  countVoidCityRelics,
  countVoidCityBaseRelics,
  isRelic6Accessible,
  normalizeVoidCityProgress,
  computeVoidCityRewardStatBonuses,
} from "./voidCityMap";

export function VoidCityBlueprintEmblem({ className = "w-20 h-20" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="vcBg" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.96" />
          <stop offset="65%" stopColor="#0F172A" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#05060A" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="18" fill="url(#vcBg)" stroke="#38BDF8" strokeOpacity="0.65" strokeWidth="2" />
      <circle cx="60" cy="48" r="24" stroke="#A855F7" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="4 3" />
      {/* Gothic spires */}
      <path d="M24 94 L32 48 L40 94 Z" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.4" />
      <path d="M80 94 L88 48 L96 94 Z" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.4" />
      <path d="M46 96 L60 22 L74 96 Z" fill="#0F172A" stroke="#FDE68A" strokeWidth="1.8" />
      {/* Inverted Clock face */}
      <circle cx="60" cy="56" r="10" fill="#090D16" stroke="#38BDF8" strokeWidth="1.6" />
      <path d="M60 56 L60 49 M60 56 L55 59" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
      {/* Swirling Archive Pages */}
      <rect x="28" y="28" width="8" height="11" rx="1" transform="rotate(-18 28 28)" fill="#E2E8F0" fillOpacity="0.78" />
      <rect x="82" y="24" width="8" height="11" rx="1" transform="rotate(22 82 24)" fill="#FDE68A" fillOpacity="0.82" />
    </svg>
  );
}

export function VoidCityTacticalMinimap({
  hudSnapshot,
  lang = "vi",
  compact = false,
  isOpen = true,
  onToggle,
  onOpenRelics,
}) {
  const hud = hudSnapshot?.voidCityHud;
  const prog = normalizeVoidCityProgress(hudSnapshot?.voidCityProgress);
  const px = hud?.px ?? 460;
  const py = hud?.py ?? 3420;
  const relicCount = countVoidCityRelics(prog);

  if (!isOpen) {
    return (
      <div className="pointer-events-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenRelics}
          className="px-2 py-1 rounded-md bg-slate-950/88 border border-amber-400/55 text-amber-200 text-[10px] font-moba font-bold hover:border-amber-300 cursor-pointer whitespace-nowrap"
        >
          ❖ {relicCount}/6
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="px-2 py-1 rounded-md bg-slate-950/88 border border-sky-400/55 text-sky-200 text-[10px] font-moba font-bold hover:border-sky-300 cursor-pointer whitespace-nowrap"
        >
          🗺️ {hud?.zoneLabel || (lang === "en" ? "Void City" : "TP Vạn Không")} ▼
        </button>
      </div>
    );
  }

  const w = compact ? 136 : 168;
  const h = compact ? 113 : 140;
  const sx = w / VOID_CITY_WIDTH;
  const sy = h / VOID_CITY_HEIGHT;

  return (
    <div className="pointer-events-auto rounded-xl bg-slate-950/90 border border-sky-500/45 p-1.5 shadow-[0_8px_24px_rgba(3,7,18,0.82)] flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1 text-[9.5px] font-moba font-bold text-sky-200 px-0.5">
        <span className="truncate max-w-[100px]">
          🏛️ {hud?.zoneLabel || (lang === "en" ? "Void City" : "TP Vạn Không")}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenRelics}
            className="px-1.5 py-0.5 rounded bg-indigo-950/90 border border-amber-400/50 text-[9px] text-amber-200 hover:text-white cursor-pointer"
            title={lang === "en" ? "Relics & Dossiers" : "Di Tích & Hồ Sơ"}
          >
            ❖{relicCount}/6
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] text-slate-300 hover:text-white cursor-pointer"
          >
            ▲
          </button>
        </div>
      </div>

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="rounded-lg bg-[#05060B] border border-slate-800 block">
        {VOID_CITY_ZONES.map((z) => (
          <rect
            key={z.id}
            x={z.rect.x * sx}
            y={z.rect.y * sy}
            width={z.rect.w * sx}
            height={z.rect.h * sy}
            fill={z.accentColor}
            fillOpacity={hud?.zoneId === z.id ? 0.24 : 0.08}
            stroke={z.accentColor}
            strokeOpacity={0.38}
            strokeWidth="0.7"
          />
        ))}
        {VOID_CITY_INTERACTABLES.filter(
          (n) => n.kind === "relic_puzzle" || n.kind === "boss_altar" || n.kind === "trung_dossier" || n.kind === "ancient_chest"
        ).map((n) => {
          const solved =
            (n.relicId === "relic_1_astrolabe" && prog.relic1Solved) ||
            (n.relicId === "relic_2_nameless_tomb" && prog.relic2Solved) ||
            (n.relicId === "relic_3_sealed_archive" && prog.relic3Solved) ||
            (n.relicId === "relic_4_theater_masks" && prog.relic4Solved) ||
            (n.relicId === "relic_5_mirror_vault" && prog.relic5Solved) ||
            (n.relicId === "relic_6_origin_sanctum" && prog.relic6Solved);
          const col =
            n.kind === "boss_altar"
              ? "#EF4444"
              : n.kind === "trung_dossier"
              ? "#FDE68A"
              : n.kind === "ancient_chest"
              ? "#F59E0B"
              : solved
              ? "#34D399"
              : "#C084FC";
          return (
            <circle
              key={n.id}
              cx={n.x * sx}
              cy={n.y * sy}
              r={n.kind === "relic_puzzle" || n.kind === "boss_altar" ? 2.5 : 1.7}
              fill={col}
            />
          );
        })}
        <circle cx={px * sx} cy={py * sy} r="3.6" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.4" />
      </svg>

      <div className="flex items-center justify-between text-[9px] font-mono-numbers text-slate-300 px-0.5">
        <span>🔑{prog.memoryKeys} · ☄️{prog.starShardCount} · 🪞{prog.reflectionCoreCount}</span>
        <span className={hud?.clockReversed ? "text-cyan-300 font-bold" : "text-purple-300"}>
          {hud?.clockReversed ? "↺ REV" : "⏳"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STORY / INTERACTIVE RELIC PUZZLE MODAL
// ---------------------------------------------------------------------------

export function VoidCityStoryModal({
  payload,
  progressInput,
  lang = "vi",
  onSolveRelic,
  onOpenRelicsWorkshop,
  onClose,
}) {
  const isEn = lang === "en";
  const prog = normalizeVoidCityProgress(progressInput);
  const [feedback, setFeedback] = useState("");
  const [rings, setRings] = useState([0, 0, 0, 0]);
  const [statueIds, setStatueIds] = useState([]);
  const [pageOrder, setPageOrder] = useState(["page_erasure", "page_genesis", "page_trung"]);
  const [maskMap, setMaskMap] = useState({
    creator: "m_silver_blank",
    survivor: "m_violet_twin",
    observer: "m_gold_crack",
    vessel: "m_ash_tear",
  });
  const [mirrorAngles, setMirrorAngles] = useState({ 1: 0, 2: 0, 4: 0 });
  const [illusionDisabled, setIllusionDisabled] = useState(false);
  const [originSeq, setOriginSeq] = useState([]);

  useEffect(() => {
    setFeedback("");
    setStatueIds([]);
    setOriginSeq([]);
    if (!payload) return;
    R.setNarrativeDuck?.(true);
    return () => R.setNarrativeDuck?.(false);
  }, [payload]);

  if (!payload) return null;

  const isPuzzle = payload.kind === "puzzle" && payload.relicId;
  const relicId = payload.relicId;

  const submitPuzzle = (submission) => {
    if (!onSolveRelic || !relicId) return;
    const res = onSolveRelic(relicId, submission);
    if (res) {
      setFeedback(res.message || "");
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-2 sm:bottom-4 flex justify-center px-2.5 sm:px-4 pointer-events-none"
      style={{ zIndex: 10075 }}
    >
      <div
        className={`pointer-events-auto w-full ${
          isPuzzle ? "max-w-[500px]" : "max-w-[440px]"
        } rounded-xl bg-gradient-to-b from-[#111322] via-[#0B0D18] to-[#05060B] border ${
          payload.themeVariant === "gold" || payload.themeVariant === "origin"
            ? "border-amber-400/75"
            : payload.themeVariant === "crimson"
            ? "border-rose-400/75"
            : "border-sky-400/65"
        } p-3 text-slate-100 shadow-[0_16px_44px_rgba(0,0,0,0.9)] backdrop-blur-md`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-numbers font-bold uppercase tracking-wider text-sky-300">
              <span>{payload.tag}</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-300">🛡️ {isEn ? "Invuln" : "Bất tử"}</span>
            </div>
            <h3 className="font-moba text-sm sm:text-base font-black text-white mt-0.5 truncate">
              {payload.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              R.playModalClose?.();
              onClose?.();
            }}
            className="btn-secondary min-h-[28px] px-2 py-0.5 text-xs shrink-0"
          >
            ✕
          </button>
        </div>

        {/* STORY / ENDING CONTENT */}
        {!isPuzzle && (
          <div className="mt-2.5 space-y-2 max-h-[34vh] overflow-y-auto pr-1 text-xs leading-relaxed text-slate-200 whitespace-pre-line">
            <p>{payload.body}</p>
            {payload.quote && (
              <div className="rounded-lg border border-amber-400/40 bg-amber-950/25 px-2.5 py-2 italic text-amber-200 font-medium">
                {payload.quote}
              </div>
            )}
            {payload.rewardText && (
              <div className="rounded-lg border border-emerald-400/45 bg-emerald-950/30 px-2.5 py-1.5 text-emerald-200 font-bold">
                ✦ {payload.rewardText}
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE PUZZLE CONTENT */}
        {isPuzzle && (
          <div className="mt-2.5 space-y-2.5 max-h-[54vh] overflow-y-auto pr-1 text-xs">
            {/* RELIC 1: ASTROLABE */}
            {relicId === "relic_1_astrolabe" && (
              <div className="space-y-2">
                <p className="text-slate-300">
                  {isEn
                    ? "Rotate all 4 Astronomical Rings to the constellation sequence recorded on Empty Town roofs & Library Codex:"
                    : "Xoay 4 Vòng Thiên Văn theo đúng thứ tự chòm sao ghi trên mái Phố Người Vắng & Sách Cổ Thư Viện:"}
                </p>
                <div className="text-[11px] rounded-lg bg-slate-900/90 border border-sky-500/30 px-2.5 py-1.5 text-sky-200">
                  {prog.foundConstellations.length >= 2
                    ? (isEn
                        ? "Clue Collected: I. Lyra (✦) → II. Ursa (✧) → III. Void Crown (◈) → IV. Eclipse (☽)"
                        : "Manh mối đã tìm: I. Thiên Cầm (✦) → II. Bắc Đẩu (✧) → III. Hư Không (◈) → IV. Nhật Nguyệt (☽)")
                    : (isEn
                        ? `Star charts found: ${prog.foundConstellations.length}/2 (Check Phố Người Vắng rooftop & Thư Viện Ký Ức codex!)`
                        : `Bản đồ sao đã tìm: ${prog.foundConstellations.length}/2 (Kiểm tra Mái Nhà Phố Vắng Khu 3 & Sách Cổ Thư Viện Khu 4!)`)}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((ri) => {
                    const sym = VOID_CITY_CONSTELLATION_SYMBOLS[rings[ri]];
                    return (
                      <button
                        key={ri}
                        type="button"
                        onClick={() => {
                          const next = [...rings];
                          next[ri] = (next[ri] + 1) % VOID_CITY_CONSTELLATION_SYMBOLS.length;
                          setRings(next);
                        }}
                        className="rounded-lg border border-purple-400/50 bg-slate-900 p-2 text-center hover:border-sky-300 cursor-pointer"
                      >
                        <div className="text-[10px] text-slate-400">Vòng {ri + 1}</div>
                        <div className="text-lg font-bold text-amber-200">{sym.symbol}</div>
                        <div className="text-[11px] text-sky-200 font-semibold">{isEn ? sym.name.en : sym.name.vi}</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => submitPuzzle({ rings })}
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  ✦ {prog.relic1Solved ? (isEn ? "Already Unlocked" : "Đã Mở Khóa") : (isEn ? "Align Astronomical Rings" : "Xác Nhận Xoay Vòng Thiên Văn")}
                </button>
              </div>
            )}

            {/* RELIC 2: NAMELESS TOMB */}
            {relicId === "relic_2_nameless_tomb" && (
              <div className="space-y-2">
                <p className="text-slate-300">
                  {isEn
                    ? "Select the exact 3 true nameless statues matching the Tombstone Inscriptions:"
                    : "Chọn đúng 3 bức tượng vô danh thật sự khớp với ký hiệu trên Bia Mộ Quảng Trường:"}
                </p>
                <div className="text-[11px] rounded-lg bg-slate-900/90 border border-amber-500/30 px-2.5 py-1.5 text-amber-200">
                  {prog.tombInscriptionsRead
                    ? (isEn
                        ? "Tomb Clue: Lantern Bearer (#2) · Kneeling Northbound (#4) · Grey-Veiled Face (#6)"
                        : "Manh mối Bia Mộ: Cầm Đèn Vỡ (#2) · Quỳ Quay Bắc (#4) · Che Mặt Khăn Xám (#6)")
                    : (isEn
                        ? "Hint: Inspect Bia Mộ Khắc Ký Hiệu in Plaza Zone 2 first to be certain!"
                        : "Gợi ý: Hãy đọc Bia Mộ Khắc Ký Hiệu tại Quảng Trường Khu 2 gần đây để biết đặc điểm!")}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {RELIC2_TOMB_STATUES.map((st) => {
                    const active = statueIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setStatueIds((prev) =>
                            prev.includes(st.id)
                              ? prev.filter((x) => x !== st.id)
                              : prev.length < 3
                              ? [...prev, st.id]
                              : prev
                          );
                        }}
                        className={`rounded-lg border px-2 py-1.5 text-left text-[11px] cursor-pointer ${
                          active ? "border-amber-400 bg-amber-950/40 text-amber-100 font-bold" : "border-slate-700 bg-slate-900/80 text-slate-300"
                        }`}
                      >
                        {isEn ? st.name.en : st.name.vi}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => submitPuzzle({ statueIds })}
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  ❖ {prog.relic2Solved ? (isEn ? "Tomb Open" : "Lăng Mộ Đã Mở") : (isEn ? `Unseal Tomb (${statueIds.length}/3)` : `Mở Lăng Mộ (${statueIds.length}/3)`)}
                </button>
              </div>
            )}

            {/* RELIC 3: SEALED ARCHIVE */}
            {relicId === "relic_3_sealed_archive" && (
              <div className="space-y-2">
                <p className="text-slate-300">
                  {isEn
                    ? "Arrange the 3 Torn Archive Pages in strict chronological order (oldest -> newest):"
                    : "Sắp xếp 3 Trang Hồ Sơ Bị Rách theo đúng trình tự thời gian (sớm nhất → sau cùng):"}
                </p>
                <div className="text-[11px] text-sky-300">
                  {isEn ? `Pages discovered in city: ${prog.foundTornPages.length}/3` : `Số trang rách đã tìm trong thành phố: ${prog.foundTornPages.length}/3`}
                </div>
                <div className="space-y-1.5">
                  {pageOrder.map((pid, idx) => {
                    const pDef = RELIC3_ARCHIVE_PAGES.find((x) => x.id === pid);
                    return (
                      <div key={pid} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5">
                        <div className="min-w-0">
                          <div className="font-bold text-amber-200">{idx + 1}. {isEn ? pDef?.title.en : pDef?.title.vi}</div>
                          <div className="text-[10.5px] text-slate-400 truncate">{isEn ? pDef?.excerpt.en : pDef?.excerpt.vi}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const arr = [...pageOrder];
                              [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                              setPageOrder(arr);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-xs disabled:opacity-40 cursor-pointer"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === pageOrder.length - 1}
                            onClick={() => {
                              const arr = [...pageOrder];
                              [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                              setPageOrder(arr);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-xs disabled:opacity-40 cursor-pointer"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => submitPuzzle({ pageOrder })}
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  🗝️ {prog.relic3Solved ? (isEn ? "Archive Open" : "Kho Đã Mở") : (isEn ? "Confirm Archive Chronology" : "Xác Nhận Trình Tự Hồ Sơ")}
                </button>
              </div>
            )}

            {/* RELIC 4: THEATER FOUR MASKS */}
            {relicId === "relic_4_theater_masks" && (
              <div className="space-y-2">
                <p className="text-slate-300">
                  {isEn
                    ? "Assign the 4 Masks to the 4 Stage Statues per the Theater Script. Warning: wrong placement summons an ambush!"
                    : "Đặt đúng 4 Mặt Nạ lên 4 Bức Tượng Sân Khấu theo Kịch Bản. Cảnh báo: đặt sai sẽ bị quái vật phục kích!"}
                </p>
                {prog.theaterScriptRead && (
                  <div className="text-[10.5px] rounded-lg bg-purple-950/40 border border-purple-400/40 px-2.5 py-1.5 text-purple-200">
                    {isEn
                      ? "Script: Creator = Gold Crack · Survivor = Ash Tear · Observer = Silver Blank · Vessel = Violet Twin"
                      : "Kịch bản: Tạo Thế = Vàng Nứt · Sống Sót = Tro Đổ Lệ · Quan Sát = Bạc Vô Diện · Vật Dẫn = Tím Song Sinh"}
                  </div>
                )}
                <div className="space-y-1.5">
                  {RELIC4_PEDESTALS.map((ped) => {
                    const curMask = RELIC4_MASKS.find((m) => m.id === maskMap[ped.id]);
                    return (
                      <div key={ped.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5">
                        <span className="font-bold text-slate-200">{isEn ? ped.role.en : ped.role.vi}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const idx = RELIC4_MASKS.findIndex((m) => m.id === maskMap[ped.id]);
                            const nextM = RELIC4_MASKS[(idx + 1) % RELIC4_MASKS.length];
                            setMaskMap((prev) => ({ ...prev, [ped.id]: nextM.id }));
                          }}
                          className="px-2 py-1 rounded bg-indigo-950 border border-purple-400/50 text-amber-200 text-[11px] font-semibold cursor-pointer"
                        >
                          🎭 {isEn ? curMask?.name.en : curMask?.name.vi} ↻
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => submitPuzzle({ mapping: maskMap })}
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  🎭 {prog.relic4Solved ? (isEn ? "Stage Secret Open" : "Hậu Trường Đã Mở") : (isEn ? "Raise Theater Curtain" : "Đặt Mặt Nạ & Kéo Màn Sân Khấu")}
                </button>
              </div>
            )}

            {/* RELIC 5: MIRROR VAULT */}
            {relicId === "relic_5_mirror_vault" && (
              <div className="space-y-2">
                <p className="text-slate-300">
                  {isEn
                    ? "Rotate the 3 true mirrors to focus the azure ray onto the sealed emblem, and disable the shadowless Illusion Mirror:"
                    : "Xoay 3 tấm gương có bóng thật để hội tụ tia sáng lam vào ấn tường, đồng thời tắt Gương Ảo Ảnh không bóng đất:"}
                </p>
                {prog.mirrorClueRead && (
                  <div className="text-[10.5px] rounded-lg bg-sky-950/40 border border-sky-400/40 px-2.5 py-1.5 text-sky-200">
                    {isEn
                      ? "Plaque: True angles 45° / 135° / 225°. Turn OFF Mirror #3."
                      : "Văn Bia: Góc đúng lần lượt là 45° / 135° / 225°. Tắt Gương Ảo Ảnh #3."}
                  </div>
                )}
                <div className="space-y-1.5">
                  {RELIC5_MIRRORS.map((mir) =>
                    mir.isIllusion ? (
                      <button
                        key={mir.id}
                        type="button"
                        onClick={() => setIllusionDisabled((v) => !v)}
                        className={`w-full flex items-center justify-between rounded-lg border px-2.5 py-1.5 cursor-pointer ${
                          illusionDisabled ? "border-emerald-400 bg-emerald-950/35 text-emerald-200" : "border-rose-400/50 bg-rose-950/25 text-rose-200"
                        }`}
                      >
                        <span>🪞 {isEn ? mir.name.en : mir.name.vi}</span>
                        <span className="font-bold">{illusionDisabled ? (isEn ? "DISABLED ✓" : "ĐÃ TẮT ✓") : (isEn ? "ACTIVE (TAP TO DISABLE)" : "ĐANG BẬT (NHẤN TẮT)")}</span>
                      </button>
                    ) : (
                      <div key={mir.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5">
                        <span className="text-slate-200">🪞 {isEn ? mir.name.en : mir.name.vi}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const opts = [0, 45, 90, 135, 180, 225, 270];
                            const cur = mirrorAngles[mir.id] || 0;
                            const nextA = opts[(opts.indexOf(cur) + 1) % opts.length];
                            setMirrorAngles((prev) => ({ ...prev, [mir.id]: nextA }));
                          }}
                          className="px-2 py-0.5 rounded bg-sky-950 border border-sky-400/60 text-sky-200 font-bold cursor-pointer"
                        >
                          {mirrorAngles[mir.id] || 0}° ↻
                        </button>
                      </div>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => submitPuzzle({ angles: mirrorAngles, illusionDisabled })}
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  🔮 {prog.relic5Solved ? (isEn ? "Mirror Vault Open" : "Hầm Gương Đã Mở") : (isEn ? "Fire Reflection Ray" : "Kích Hoạt Tia Phản Chiếu")}
                </button>
              </div>
            )}

            {/* RELIC 6: ORIGIN SANCTUM */}
            {relicId === "relic_6_origin_sanctum" && (
              <div className="space-y-2">
                {!isRelic6Accessible(prog) && !prog.relic6Solved ? (
                  <div className="rounded-lg border border-rose-400/50 bg-rose-950/35 p-2.5 text-rose-200 font-semibold">
                    🔒 {isEn
                      ? `Requires at least 3 earlier Relics solved (${countVoidCityBaseRelics(prog)}/3). Explore the city first!`
                      : `Cần giải tối thiểu 3 Di Tích trước đó để mở phong ấn (${countVoidCityBaseRelics(prog)}/3).`}
                  </div>
                ) : (
                  <>
                    <p className="text-slate-300">
                      {isEn
                        ? "Tap the 4 Relic Truths in causal order to awaken the Origin Sanctum (Sky → Names → Reset → Watcher):"
                        : "Chọn lần lượt 4 mảnh chân lý từ các Di Tích theo trình tự nhân quả (Bầu Trời → Tên Bị Xóa → Tái Lập → Phán Quyết):"}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {RELIC6_CONDUIT_TOKENS.map((tok) => {
                        const orderIdx = originSeq.indexOf(tok.id);
                        return (
                          <button
                            key={tok.id}
                            type="button"
                            onClick={() => {
                              setOriginSeq((prev) =>
                                prev.includes(tok.id) ? prev.filter((x) => x !== tok.id) : [...prev, tok.id]
                              );
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-left text-[11px] cursor-pointer ${
                              orderIdx >= 0 ? "border-amber-400 bg-amber-950/40 text-amber-100 font-bold" : "border-slate-700 bg-slate-900 text-slate-300"
                            }`}
                          >
                            {orderIdx >= 0 ? `#${orderIdx + 1} · ` : ""}
                            {isEn ? tok.label.en : tok.label.vi}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={originSeq.length !== 4}
                      onClick={() => submitPuzzle({ sequence: originSeq })}
                      className="btn-primary w-full py-2 text-xs font-bold disabled:opacity-45"
                    >
                      ☀️ {prog.relic6Solved ? (isEn ? "Sanctum Awakened" : "Điện Thờ Đã Thức Tỉnh") : (isEn ? "Synthesize Origin Fragment" : "Hợp Nhất Mảnh Khởi Nguyên")}
                    </button>
                  </>
                )}
              </div>
            )}

            {feedback && (
              <div className="rounded-lg border border-amber-400/50 bg-slate-950 px-2.5 py-2 text-[11.5px] font-semibold text-amber-200">
                {feedback}
              </div>
            )}
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          {onOpenRelicsWorkshop && (
            <button
              type="button"
              onClick={onOpenRelicsWorkshop}
              className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-amber-400/50 text-amber-200 text-xs font-bold hover:border-amber-300 cursor-pointer"
            >
              ⚒️ {isEn ? "Relics Workshop" : "Xưởng Di Tích"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              R.playModalClose?.();
              onClose?.();
            }}
            className="btn-primary px-4 py-1 text-xs font-bold ml-auto"
          >
            {isEn ? "Continue" : "Tiếp Tục"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RELICS WORKSHOP & DOSSIERS MODAL (Lobby + In-Game Functional Rewards)
// ---------------------------------------------------------------------------

export function VoidCityRelicsModal({
  isOpen,
  progressInput,
  lang = "vi",
  onAction,
  onClose,
}) {
  const [tab, setTab] = useState("rewards");
  const [statusMsg, setStatusMsg] = useState("");
  const isEn = lang === "en";

  useEffect(() => {
    setStatusMsg("");
  }, [isOpen, tab]);

  if (!isOpen) return null;
  const p = normalizeVoidCityProgress(progressInput);
  const bonuses = computeVoidCityRewardStatBonuses(p);
  const solvedCount = countVoidCityRelics(p);

  const runAction = (actionType, payload) => {
    if (!onAction) return;
    const res = onAction(actionType, payload);
    if (res?.message) setStatusMsg(res.message);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-950/82 backdrop-blur-md p-3"
      style={{ zIndex: 10090 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-[660px] max-h-[88vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#101324] to-[#06070B] border border-sky-400/55 shadow-[0_24px_60px_rgba(0,0,0,0.92)] text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="text-[10px] font-mono-numbers font-bold uppercase tracking-widest text-sky-300">
              MAP 5 · THÀNH PHỐ VẠN KHÔNG ({solvedCount}/6 {isEn ? "RELICS" : "DI TÍCH"})
            </div>
            <h2 className="font-moba text-base sm:text-lg font-black text-amber-200">
              {isEn ? "Secret Relics Workshop & Dossiers" : "Xưởng Phần Thưởng Di Tích & Hồ Sơ Vạn Không"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary min-h-[32px] px-2.5 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1.5 px-4 pt-2.5 border-b border-slate-800/80 pb-2">
          <button
            type="button"
            onClick={() => setTab("rewards")}
            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
              tab === "rewards" ? "bg-sky-500/20 border border-sky-400 text-sky-200" : "bg-slate-900 border border-slate-700 text-slate-400"
            }`}
          >
            ⚒️ {isEn ? "Relic Rewards & Upgrades" : "Sử Dụng Phần Thưởng"}
          </button>
          <button
            type="button"
            onClick={() => setTab("docs")}
            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
              tab === "docs" ? "bg-purple-500/20 border border-purple-400 text-purple-200" : "bg-slate-900 border border-slate-700 text-slate-400"
            }`}
          >
            📜 {isEn ? `Dossiers (${p.collectedDocIds.length})` : `Hồ Sơ (${p.collectedDocIds.length})`}
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 text-xs">
          {statusMsg && (
            <div className="rounded-lg border border-emerald-400/60 bg-emerald-950/40 px-3 py-2 text-emerald-200 font-bold">
              {statusMsg}
            </div>
          )}

          {tab === "rewards" ? (
            <>
              {/* Active Bonus Summary */}
              <div className="rounded-xl border border-amber-400/35 bg-slate-900/85 p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono-numbers">
                <div><div className="text-[10px] text-slate-400">ATK</div><div className="font-bold text-amber-200">+{bonuses.atk}</div></div>
                <div><div className="text-[10px] text-slate-400">AP</div><div className="font-bold text-sky-300">+{bonuses.matk}</div></div>
                <div><div className="text-[10px] text-slate-400">HP</div><div className="font-bold text-emerald-300">+{bonuses.hp}</div></div>
                <div><div className="text-[10px] text-slate-400">CRIT</div><div className="font-bold text-rose-300">+{Math.round(bonuses.crit * 100)}%</div></div>
                <div><div className="text-[10px] text-slate-400">MS/DR</div><div className="font-bold text-purple-300">+{Math.round(bonuses.ms * 100)}%/{Math.round(bonuses.dmgRed * 100)}%</div></div>
                <div><div className="text-[10px] text-slate-400">BOSS</div><div className="font-bold text-yellow-300">+{Math.round(bonuses.bossDmgBonus * 100)}%</div></div>
              </div>

              {/* Relic 1: Star Shards */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/75 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-200">☄️ Di Tích 1 · Mảnh Thiên Thạch ({p.starShardCount})</span>
                  <span className="text-[10px] text-slate-400">{p.relic1Solved ? "Đã Mở" : "Chưa giải"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["weapon", "armor", "boots", "gloves", "necklace", "relic"].map((sl) => {
                    const forged = p.starForgedSlots.includes(sl);
                    return (
                      <button
                        key={sl}
                        type="button"
                        disabled={forged || p.starShardCount < 1}
                        onClick={() => runAction("forgeStarShard", sl)}
                        className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer ${
                          forged
                            ? "border-emerald-400/60 bg-emerald-950/35 text-emerald-200"
                            : "border-sky-400/45 bg-slate-950 text-sky-200 disabled:opacity-45"
                        }`}
                      >
                        {forged ? `✓ ${sl}` : `☄️ ${sl}`}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={p.starShardCount < 1}
                    onClick={() => runAction("exchangeStarShard")}
                    className="px-2.5 py-1 rounded border border-amber-400/55 bg-amber-950/35 text-amber-200 text-[11px] font-bold disabled:opacity-45 cursor-pointer"
                  >
                    🪙 {isEn ? "Exchange +480G" : "Đổi +480 Vàng"}
                  </button>
                </div>
              </div>

              {/* Relic 2, 4, 6 Toggles */}
              <div className="grid sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!p.namelessSealUnlocked}
                  onClick={() => runAction("togglePerk", "namelessSeal")}
                  className={`rounded-xl border p-2.5 text-left cursor-pointer disabled:opacity-45 ${
                    p.namelessSealActive ? "border-amber-400 bg-amber-950/30" : "border-slate-700 bg-slate-900/75"
                  }`}
                >
                  <div className="font-bold text-amber-200">💠 Di Tích 2 · Ấn Vô Danh</div>
                  <div className="text-[10.5px] text-slate-300 mt-1">
                    {p.namelessSealUnlocked
                      ? (p.namelessSealActive ? "Đang bật hào quang & mở danh hiệu 'Kẻ Mang Ấn Vô Danh'" : "Đã tắt hào quang")
                      : "Chưa giải Di Tích 2"}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!p.memoryMaskUnlocked}
                  onClick={() => runAction("togglePerk", "memoryMask")}
                  className={`rounded-xl border p-2.5 text-left cursor-pointer disabled:opacity-45 ${
                    p.memoryMaskActive ? "border-purple-400 bg-purple-950/30" : "border-slate-700 bg-slate-900/75"
                  }`}
                >
                  <div className="font-bold text-purple-200">🎭 Di Tích 4 · Mặt Nạ Ký Ức</div>
                  <div className="text-[10.5px] text-slate-300 mt-1">
                    {p.memoryMaskUnlocked
                      ? (p.memoryMaskActive ? "Đang đeo (+8% Tốc Chạy, +6% Giảm ST)" : "Đã tháo mặt nạ")
                      : "Chưa giải Di Tích 4"}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!p.originFragmentUnlocked}
                  onClick={() => runAction("togglePerk", "originFragment")}
                  className={`rounded-xl border p-2.5 text-left cursor-pointer disabled:opacity-45 ${
                    p.originFragmentForged ? "border-yellow-300 bg-amber-950/40" : "border-slate-700 bg-slate-900/75"
                  }`}
                >
                  <div className="font-bold text-yellow-200">☀️ Di Tích 6 · Mảnh Khởi Nguyên</div>
                  <div className="text-[10.5px] text-slate-300 mt-1">
                    {p.originFragmentUnlocked
                      ? (p.originFragmentForged ? "Đang khảm Trang Bị (+12% Boss, +55 ATK, +68 AP)" : "Chưa khảm")
                      : "Cần ≥3 Di Tích & giải Khu 8"}
                  </div>
                </button>
              </div>

              {/* Relic 3 Memory Keys & Chests */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/75 p-3">
                <div className="font-bold text-amber-200">
                  🗝️ Di Tích 3 · Chìa Khóa Ký Ức: {p.memoryKeys} | Rương Cổ Đã Mở: {p.openedChests.length}/{VOID_CITY_CHESTS.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isEn
                    ? "Use Memory Keys on Ancient Chests in Library, Tomb & Palace inside Map 5."
                    : "Mang Chìa Khóa Ký Ức đến mở các Rương Cổ Đại tại Thư Viện, Lăng Mộ & Cung Điện Hồ Sơ trong Map 5."}
                </p>
              </div>

              {/* Relic 5 Reflection Cores */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/75 p-3 space-y-2">
                <div className="font-bold text-cyan-200">🪞 Di Tích 5 · Lõi Phản Chiếu ({p.reflectionCoreCount})</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { k: "atk", label: "+40 ATK" },
                    { k: "matk", label: "+50 AP" },
                    { k: "hp", label: "+300 HP" },
                    { k: "crit", label: "+5% CRIT" },
                    { k: "cdr", label: "+4% CDR" },
                    { k: "lifesteal", label: "+4% HÚT" },
                  ].map((s) => (
                    <button
                      key={s.k}
                      type="button"
                      disabled={p.reflectionCoreCount < 1 || (p.reflectionSubstats[s.k] || 0) >= 5}
                      onClick={() => runAction("applyReflectionCore", s.k)}
                      className="rounded border border-cyan-400/50 bg-slate-950 px-1.5 py-1.5 text-center disabled:opacity-45 cursor-pointer hover:border-cyan-300"
                    >
                      <div className="font-bold text-cyan-200">{s.label}</div>
                      <div className="text-[10px] text-slate-400">Lv.{p.reflectionSubstats[s.k] || 0}/5</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {p.collectedDocIds.length === 0 ? (
                <div className="text-slate-400 italic p-3 text-center">
                  {isEn ? "No dossiers collected yet inside City of Endless Void." : "Chưa thu thập tài liệu nào trong Thành Phố Vạn Không."}
                </div>
              ) : (
                p.collectedDocIds.map((docId) => {
                  const doc = VOID_CITY_DOCS[docId];
                  if (!doc) return null;
                  return (
                    <div key={docId} className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 space-y-1">
                      <div className="text-[10px] font-bold text-sky-300">{isEn ? doc.tag.en : doc.tag.vi}</div>
                      <div className="font-bold text-amber-200">{isEn ? doc.title.en : doc.title.vi}</div>
                      <p className="text-slate-300 whitespace-pre-line">{isEn ? doc.body.en : doc.body.vi}</p>
                      {doc.highlightQuote && (
                        <div className="italic text-amber-300 pt-1">"{isEn ? doc.highlightQuote.en : doc.highlightQuote.vi}"</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
