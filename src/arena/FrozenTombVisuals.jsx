import React, { useEffect, useState } from "react";
import { R } from "./gameData";
import {
  FROZEN_TOMB_WIDTH,
  FROZEN_TOMB_HEIGHT,
  FROZEN_TOMB_ZONES,
  FROZEN_TOMB_INTERACTABLES,
  FROZEN_TOMB_DOCS,
  hasCompletedMap2Links,
  hasCompletedMap3Links,
  normalizeFrozenTombProgress,
} from "./frozenTombMap";

export function FrozenTombBlueprintEmblem({ className = "w-20 h-20" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ftBg" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#0C4A6E" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#09152E" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#03050C" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="18" fill="url(#ftBg)" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="60" cy="60" r="40" stroke="#7DD3FC" strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx="60" cy="60" r="28" stroke="#A855F7" strokeOpacity="0.45" strokeWidth="1.4" />
      {/* 4 chains */}
      <line x1="22" y1="22" x2="48" y2="48" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="98" y1="22" x2="72" y2="48" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="22" y1="98" x2="48" y2="72" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 2" />
      <line x1="98" y1="98" x2="72" y2="72" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 2" />
      {/* 4 Rune pillars */}
      <circle cx="22" cy="22" r="4.5" fill="#C084FC" />
      <circle cx="98" cy="22" r="4.5" fill="#C084FC" />
      <circle cx="22" cy="98" r="4.5" fill="#C084FC" />
      <circle cx="98" cy="98" r="4.5" fill="#C084FC" />
      {/* Central ice coffin crystal */}
      <polygon points="60,26 76,46 72,88 60,96 48,88 44,46" fill="#0E7490" fillOpacity="0.65" stroke="#BAE6FD" strokeWidth="2" />
      <ellipse cx="60" cy="60" rx="8" ry="16" fill="#03050A" stroke="#C084FC" strokeWidth="1.5" />
    </svg>
  );
}

export function FrozenTombTacticalMinimap({
  hudSnapshot,
  heroId,
  lang = "vi",
  compact = false,
  isOpen = true,
  onToggle,
  onOpenJournal,
}) {
  const hud = hudSnapshot?.frozenTombHud;
  const prog = normalizeFrozenTombProgress(hudSnapshot?.frozenTombProgress);
  const px = hud?.px ?? 480;
  const py = hud?.py ?? 2490;
  const docsCount = prog.collectedDocs.length;
  const docsTotal = Object.keys(FROZEN_TOMB_DOCS).length;
  const clueCount = (prog.minhSealClue ? 1 : 0) + (prog.phongMirrorClue ? 1 : 0) + (prog.thanhVialClue ? 1 : 0);

  if (!isOpen) {
    return (
      <div className="pointer-events-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-2 py-1 rounded-md bg-slate-950/85 border border-sky-400/50 text-sky-200 text-[10px] font-moba font-bold hover:border-sky-300 cursor-pointer whitespace-nowrap"
          title={lang === "en" ? "Frozen Tomb Archive" : "Nhật Ký Băng Mộ"}
        >
          📜 {docsCount}/{docsTotal}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="px-2 py-1 rounded-md bg-slate-950/85 border border-cyan-400/55 text-cyan-200 text-[10px] font-moba font-bold hover:border-cyan-300 cursor-pointer whitespace-nowrap"
        >
          🗺️ {hud?.zoneLabel || (lang === "en" ? "Frozen Tomb" : "Băng Mộ")} ▼
        </button>
      </div>
    );
  }

  const w = compact ? 132 : 162;
  const h = compact ? 108 : 134;
  const sx = w / FROZEN_TOMB_WIDTH;
  const sy = h / FROZEN_TOMB_HEIGHT;

  return (
    <div className="pointer-events-auto rounded-xl bg-slate-950/88 border border-sky-500/45 p-1.5 shadow-[0_8px_24px_rgba(3,7,18,0.7)] flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1 text-[9.5px] font-moba font-bold text-sky-200 px-0.5">
        <span className="truncate max-w-[96px]">❄️ {hud?.zoneLabel || (lang === "en" ? "Frozen Tomb" : "Băng Mộ")}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenJournal}
            className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-400/45 text-[9px] text-sky-200 hover:text-white cursor-pointer"
            title={lang === "en" ? "Archive & Clues" : "Hồ Sơ & Manh Mối"}
          >
            📜{docsCount}
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

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="rounded-lg bg-[#050C1B] border border-slate-800/90 block">
        {FROZEN_TOMB_ZONES.map((z) => (
          <rect
            key={z.id}
            x={z.x * sx}
            y={z.y * sy}
            width={z.w * sx}
            height={z.h * sy}
            fill={z.accentColor}
            fillOpacity={hud?.zoneId === z.id ? 0.2 : 0.06}
            stroke={z.accentColor}
            strokeOpacity={0.32}
            strokeWidth="0.7"
          />
        ))}
        {/* Key EE markers */}
        {FROZEN_TOMB_INTERACTABLES.filter(
          (n) => n.kind === "ee" || n.kind === "device" || n.kind === "boss_seal"
        ).map((n) => {
          const isMyHero = n.heroIdRequired && n.heroIdRequired === heroId;
          const fill =
            n.id === "eohyen_painting"
              ? "#38BDF8"
              : n.id === "phong_faceless_statues" || n.id === "phong_mirror_room"
              ? "#22D3EE"
              : n.id === "thanh_poison_vial"
              ? "#34D399"
              : n.id === "minh_frozen_dossier"
              ? "#FACC15"
              : "#C084FC";
          return (
            <circle
              key={n.id}
              cx={n.x * sx}
              cy={n.y * sy}
              r={isMyHero ? 3.2 : 2.1}
              fill={fill}
              fillOpacity={isMyHero ? 0.95 : 0.65}
            />
          );
        })}
        {/* Player marker */}
        <circle cx={px * sx} cy={py * sy} r="3.6" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.4" />
      </svg>

      <div className="flex items-center justify-between text-[9px] font-mono-numbers text-slate-300 px-0.5">
        <span>{lang === "en" ? "Clues" : "Bí mật"}: {clueCount}/3</span>
        <span className={hud?.blizzardState === "active" ? "text-cyan-300 font-bold" : "text-slate-400"}>
          {hud?.blizzardState === "active" ? "🌨 Bão" : hud?.blizzardState === "warning" ? "🌬 Gió" : "❄ Yên"}
        </span>
      </div>
    </div>
  );
}

export function FrozenTombStoryModal({ payload, lang = "vi", onClose }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    setStepIdx(0);
    if (!payload) return;
    R.setNarrativeDuck?.(true);
    return () => R.setNarrativeDuck?.(false);
  }, [payload]);

  if (!payload) return null;
  const steps = Array.isArray(payload.steps) && payload.steps.length > 0
    ? payload.steps
    : [{ speaker: payload.title, speakerColor: "#7DD3FC", text: (payload.paragraphs || []).join("\n") }];
  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const current = steps[safeIdx];
  const isLast = safeIdx >= steps.length - 1;

  // Dramatic full-dark ending screen for final line: "BĂNG CHỈ GIỮ ĐƯỢC NHỮNG THỨ CHƯA THỂ CHẾT."
  const showEndingDarkScreen = Boolean(payload.isEndingSequence && isLast && payload.endingBoldLine);

  const borderTheme =
    payload.themeVariant === "eohyen"
      ? "border-sky-400/75 from-[#091C34] to-[#040914]"
      : payload.themeVariant === "phong"
      ? "border-cyan-400/75 from-[#071D2E] to-[#040812]"
      : payload.themeVariant === "minh"
      ? "border-amber-400/75 from-[#1B1508] to-[#060812]"
      : payload.themeVariant === "thanh"
      ? "border-emerald-400/75 from-[#062018] to-[#040A10]"
      : payload.themeVariant === "linked" || payload.themeVariant === "ending"
      ? "border-purple-400/80 from-[#170A29] to-[#030308]"
      : "border-sky-500/60 from-[#0A172B] to-[#040812]";

  return (
    <div
      className="fixed inset-x-0 bottom-2 sm:bottom-3.5 flex justify-center px-2.5 sm:px-4 pointer-events-none"
      style={{ zIndex: 10075 }}
    >
      <div className={`pointer-events-auto w-full max-w-[430px] rounded-xl bg-gradient-to-b ${borderTheme} border p-2.5 sm:p-3 text-slate-100 shadow-[0_14px_40px_rgba(0,0,0,0.88)] backdrop-blur-md relative overflow-hidden`}>
        <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono-numbers font-bold uppercase tracking-wider text-sky-300">
              <span className="truncate">{payload.code} · {payload.subtitle}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-300 shrink-0">
                🛡️ {lang === "en" ? "Invuln" : "Bất tử"}
              </span>
            </div>
            <h3 className="font-moba text-sm sm:text-base font-black text-white mt-0.5 truncate">{payload.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              R.playModalClose();
              onClose?.();
            }}
            className="btn-secondary min-h-[28px] px-2 py-0.5 text-xs shrink-0"
            aria-label={lang === "en" ? "Close" : "Đóng"}
          >
            ✕
          </button>
        </div>

        <div className="mt-2 space-y-2 max-h-[24vh] overflow-y-auto pr-0.5">
          {payload.showsMap2Symbol && (
            <div className="rounded-lg bg-[#05030C] border border-purple-500/45 p-2 flex items-center gap-2.5">
              <svg width="34" height="34" viewBox="0 0 64 64" className="shrink-0" aria-hidden="true">
                <circle cx="32" cy="32" r="24" fill="#1E1B4B" stroke="#C084FC" strokeWidth="2.5" />
                <polygon points="32,14 48,32 32,50 16,32" fill="none" stroke="#E879F9" strokeWidth="2" />
                <circle cx="32" cy="32" r="6" fill="#05030C" stroke="#38BDF8" strokeWidth="2" />
              </svg>
              <div className="text-[11px] text-purple-200 leading-snug">
                {lang === "en"
                  ? "Symbol etched onto the fallen ice shard — identical to the Arcane Orb from Inferno of Ashes."
                  : "Ký hiệu khắc trên mảnh băng rơi xuống — giống hệt Quả Cầu Ma Thuật ở Hỏa Ngục Tàn Tro."}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-950/85 border border-slate-800/90 px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-moba font-extrabold">
              <span className="truncate" style={{ color: current.speakerColor || "#7DD3FC" }}>{current.speaker}</span>
              <span className="font-mono-numbers text-[10px] text-slate-400 shrink-0 tabular-nums">
                {safeIdx + 1}/{steps.length}
              </span>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed font-medium">{current.text}</p>
            {current.subtext && (
              <p className="text-[11px] text-slate-400 italic leading-snug border-t border-slate-800/70 pt-1.5">
                {current.subtext}
              </p>
            )}
          </div>

          {showEndingDarkScreen && (
            <div className="rounded-lg bg-[#020206] border border-purple-400/75 px-3 py-2.5 text-center shadow-inner">
              <p className="font-moba text-xs sm:text-sm font-black tracking-wider text-white">
                {payload.endingBoldLine}
              </p>
            </div>
          )}

          {payload.rewardText && isLast && (
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/50 text-[11px] font-bold text-emerald-200">
              {payload.rewardText}
            </div>
          )}

          {payload.clueSummary && (
            <div className="text-[10.5px] font-mono-numbers text-slate-400">{payload.clueSummary}</div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={safeIdx === 0}
            onClick={() => {
              R.playClick();
              setStepIdx((i) => Math.max(0, i - 1));
            }}
            className="btn-secondary min-h-[34px] px-3 py-1 text-[11px] whitespace-nowrap disabled:opacity-40"
          >
            {lang === "en" ? "← Back" : "← Trước"}
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => {
                R.playClick();
                setStepIdx((i) => Math.min(steps.length - 1, i + 1));
              }}
              className="flex-1 btn-primary min-h-[34px] px-4 py-1 text-[11px] font-black whitespace-nowrap"
            >
              {lang === "en" ? "Next →" : "Tiếp Theo →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                R.playModalClose();
                onClose?.();
              }}
              className="flex-1 btn-primary min-h-[34px] px-4 py-1 text-[11px] font-black whitespace-nowrap"
            >
              {lang === "en" ? "Done Reading" : "Đóng & Chiến Tiếp"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FrozenTombJournalModal({ open, progress, infernoProgress, lang = "vi", onClose }) {
  if (!open) return null;
  const prog = normalizeFrozenTombProgress(progress);
  const map2 = hasCompletedMap2Links(infernoProgress);
  const map3 = hasCompletedMap3Links(prog);
  const allDocs = Object.values(FROZEN_TOMB_DOCS);

  return (
    <div className="modal-backdrop" style={{ zIndex: 10070 }}>
      <div className="modal-box max-w-[740px] max-h-[86vh] flex flex-col border-sky-500/60 bg-gradient-to-b from-[#0A172B] to-[#040812]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-mono-numbers font-bold uppercase tracking-wider text-sky-300">
              BĂNG MỘ VĨNH CỬU · {prog.collectedDocs.length}/{allDocs.length} HỒ SƠ
            </div>
            <h3 className="font-moba text-lg font-black text-white">
              {lang === "en" ? "Frozen Tomb Exploration Log" : "Nhật Ký Khám Phá Băng Mộ Vĩnh Cửu"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              R.playModalClose();
              onClose?.();
            }}
            className="btn-secondary px-2.5 py-1 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1 text-xs">
          {/* Easter Eggs 1-5 Tracker */}
          <div className="rounded-xl bg-slate-900/90 border border-sky-500/40 p-3 space-y-2">
            <div className="font-moba text-sm font-black text-sky-300">
              {lang === "en" ? "5 Hidden Secrets & Map 2 Cross-Link" : "5 Bí Mật Băng Mộ & Mối Liên Kết Map 2"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border ${prog.eohyenPaintingSeen ? "bg-sky-950/50 border-sky-400/60 text-sky-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE1 · Éo Hyên — Bức Tranh Cung Điện</div>
                <div className="text-[11px] mt-0.5">{prog.eohyenPaintingSeen ? "✓ Đã chứng kiến bức tranh phát sáng" : "○ Dùng Éo Hyên kiểm tra Cung Điện Phong Ấn"}</div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.phongMirrorClue ? "bg-cyan-950/50 border-cyan-400/60 text-cyan-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE2 · Phong — Những Kẻ Không Khuôn Mặt</div>
                <div className="text-[11px] mt-0.5">{prog.phongMirrorClue ? "✓ Đã mở bí mật Phòng Gương" : "○ Dùng Phong tới Tượng Không Mặt (Thánh Đường)"}</div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.minhSealClue ? "bg-amber-950/40 border-amber-400/60 text-amber-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE3 · Minh — Hồ Sơ Đóng Băng</div>
                <div className="text-[11px] mt-0.5">{prog.minhSealClue ? "✓ Băng đã tự tan chảy" : "○ Dùng Minh tiến vào Điện Phong Ấn Cuối Cùng"}</div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.thanhVialClue ? "bg-emerald-950/40 border-emerald-400/60 text-emerald-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE4 · Thanh — Lọ Độc Dược Cạn Đáy</div>
                <div className="text-[11px] mt-0.5">{prog.thanhVialClue ? "✓ Đã thấy hồi ức nghi thức" : "○ Dùng Thanh vào phòng nghi thức Cung Điện"}</div>
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${prog.linkedDeviceTriggered ? "bg-purple-950/55 border-purple-400/70 text-purple-100" : "bg-slate-950/80 border-slate-800 text-slate-300"}`}>
              <div className="font-bold text-purple-300">EE5 · Thiết Bị Nghiên Cứu Đóng Băng (Hầm Băng)</div>
              <div className="text-[11px] mt-1 font-mono-numbers">
                Map 2: Dũng {map2.dungReady ? "✓" : "○"} · Long Hói {map2.longhoiReady ? "✓" : "○"} · 4 Ghế {map2.fourChairsReady ? "✓" : "○"} |{" "}
                Map 3: Minh {map3.minhReady ? "✓" : "○"} · Phong {map3.phongReady ? "✓" : "○"} · Thanh {map3.thanhReady ? "✓" : "○"}
              </div>
              <div className="text-[11px] mt-0.5 text-slate-400">
                {prog.linkedDeviceTriggered
                  ? "✓ Đã kích hoạt cuộn băng kết nối Hỏa Ngục Tàn Tro × Băng Mộ Vĩnh Cửu."
                  : map2.allReady && map3.allReady
                  ? "★ Đủ 6/6 điều kiện! Hãy chạm vào Thiết Bị Nghiên Cứu ở Hầm Băng (Zone 6)."
                  : "Thu thập đủ 3 manh mối Map 2 & 3 bí mật Map 3 để mở khóa."}
              </div>
            </div>
          </div>

          {/* Archive Documents */}
          <div className="space-y-2">
            {allDocs.map((doc) => {
              const found = prog.collectedDocs.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`rounded-xl p-3 border ${found ? "bg-slate-900/95 border-slate-700 text-slate-200" : "bg-slate-950/55 border-slate-900 text-slate-500"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-moba font-bold text-xs text-sky-200">
                      {doc.code} · {found ? (lang === "en" ? doc.title.en : doc.title.vi) : "???"}
                    </span>
                    <span className="text-[10px] font-mono-numbers">{found ? "✓" : "○"}</span>
                  </div>
                  {found && (
                    <div className="mt-1.5 space-y-1 text-[11px] text-slate-300 leading-relaxed">
                      {doc.paragraphs.map((p, i) => (
                        <p key={i}>{lang === "en" ? p.en : p.vi}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
