import React, { useEffect, useMemo, useState } from "react";
import {
  INFERNO_DESTRUCTIBLE_WALLS,
  INFERNO_DOCS,
  INFERNO_GATES,
  INFERNO_INTERACTABLES,
  INFERNO_MAP_HEIGHT,
  INFERNO_MAP_WIDTH,
  INFERNO_STATIC_OBSTACLES,
  INFERNO_ZONES,
  getInfernoCompassTarget,
  normalizeInfernoProgress,
} from "./infernoAshMap";
import { R } from "./soundEngine.js";

export function InfernoBlueprintEmblem({
  progress = null,
  active = false,
  className = "",
}) {
  const safe = normalizeInfernoProgress(progress);
  const dungDone = Boolean(safe.dungClue);
  const danhDone = Boolean(safe.danhClue);
  const longDone = Boolean(safe.longhoiClue);
  const chairsOpen = Boolean(safe.fourChairsUnlocked);
  const trungDone = Boolean(safe.trungTriggered);

  return (
    <svg
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="6"
        fill={active ? "#1D0B08" : "#12090B"}
        stroke={
          trungDone
            ? "#C084FC"
            : chairsOpen
            ? "#F59E0B"
            : active
            ? "#FB923C"
            : "#9A3412"
        }
        strokeWidth="1.8"
      />
      {/* Ruined City District Grid */}
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="3"
        fill="none"
        stroke="rgba(249, 115, 22, 0.35)"
        strokeWidth="1"
      />
      <line x1="23" y1="7" x2="23" y2="57" stroke="rgba(180, 83, 9, 0.25)" strokeWidth="1.1" />
      <line x1="41" y1="7" x2="41" y2="57" stroke="rgba(180, 83, 9, 0.25)" strokeWidth="1.1" />
      <line x1="7" y1="25" x2="57" y2="25" stroke="rgba(180, 83, 9, 0.25)" strokeWidth="1.1" />
      <line x1="7" y1="42" x2="57" y2="42" stroke="rgba(180, 83, 9, 0.25)" strokeWidth="1.1" />

      {/* Zone 8 Central Meteor Crater */}
      <circle
        cx="32"
        cy="31"
        r="9.5"
        fill="rgba(127, 29, 29, 0.48)"
        stroke="#F97316"
        strokeWidth="1.4"
      />
      <circle
        cx="32"
        cy="31"
        r="4.2"
        fill={trungDone ? "#A855F7" : "#EF4444"}
        stroke="#FDBA74"
        strokeWidth="1"
      />

      {/* Zone 7 Four Chairs Sanctum (bottom-center hidden orb) */}
      <rect
        x="24"
        y="46"
        width="16"
        height="9"
        rx="1.5"
        fill={chairsOpen ? "rgba(168, 85, 247, 0.3)" : "rgba(30, 27, 75, 0.45)"}
        stroke={trungDone ? "#E879F9" : chairsOpen ? "#C084FC" : "#475569"}
        strokeWidth="1.2"
      />
      <circle
        cx="32"
        cy="50.5"
        r="2.2"
        fill={trungDone ? "#FDE047" : chairsOpen ? "#C084FC" : "#64748B"}
      />

      {/* 3 Hero Clues Beacons: Dung (W), Danh (E), Long Hoi (NE) */}
      <circle
        cx="13"
        cy="28"
        r="3"
        fill={dungDone ? "#FACC15" : "#475569"}
        stroke="#09070B"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="34"
        r="3"
        fill={danhDone ? "#FB923C" : "#475569"}
        stroke="#09070B"
        strokeWidth="1"
      />
      <circle
        cx="49"
        cy="14"
        r="3"
        fill={longDone ? "#F59E0B" : "#475569"}
        stroke="#09070B"
        strokeWidth="1"
      />
    </svg>
  );
}

export function InfernoTacticalMinimap({
  hudSnapshot,
  heroId,
  lang = "vi",
  compact = false,
  isOpen = true,
  onToggle,
  onOpenJournal,
}) {
  const isEn = lang === "en";
  const infernoHud = hudSnapshot?.infernoHud;
  const progress = normalizeInfernoProgress(hudSnapshot?.infernoProgress);
  const zoneLabel = infernoHud?.zoneLabel || (isEn ? "Inferno of Ashes" : "Hỏa Ngục Tàn Tro");
  const compassTarget = getInfernoCompassTarget(heroId, progress, isEn ? "en" : "vi");
  const destroyedSet = new Set(infernoHud?.destroyedWalls || progress.destroyedWalls || []);
  const openedDoorsSet = new Set(infernoHud?.openedDoors || progress.openedDoors || []);
  const inspectedSet = new Set(progress.inspectedNodes || []);

  if (!isOpen) {
    return (
      <div className="pointer-events-auto flex items-center gap-1">
        {onOpenJournal && (
          <button
            type="button"
            onClick={onOpenJournal}
            title={isEn ? "Investigation Dossier" : "Hồ Sơ Điều Tra"}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1A0B08]/92 hover:bg-[#2B120C] border border-orange-500/55 text-[10px] font-moba font-bold text-amber-200 cursor-pointer shadow-md"
          >
            <span>📜</span>
            <span className="font-mono-numbers tabular-nums">
              {progress.collectedDocs.length}/{Object.keys(INFERNO_DOCS).length}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={isEn ? "Expand Inferno Tactical Map" : "Mở Bản Đồ Hỏa Ngục"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#160A08]/92 hover:bg-[#25100C] border border-orange-500/55 text-[10px] font-moba font-bold text-orange-100 whitespace-nowrap shrink-0 cursor-pointer shadow-md"
        >
          <span className="text-orange-400">🔥</span>
          <span className="max-w-[122px] truncate">{zoneLabel}</span>
          <span className="text-[9px] text-orange-300/80">▼</span>
        </button>
      </div>
    );
  }

  const mapW = compact ? 112 : 144;
  const mapH = Math.round((mapW * INFERNO_MAP_HEIGHT) / INFERNO_MAP_WIDTH);
  const px = Number.isFinite(infernoHud?.playerX) ? infernoHud.playerX : 280;
  const py = Number.isFinite(infernoHud?.playerY) ? infernoHud.playerY : 1840;
  const pAngleDeg = ((infernoHud?.playerFacing || 0) * 180) / Math.PI;
  const bossPos = infernoHud?.bossPos || null;
  const bridges = infernoHud?.bridges || [];
  const lightningTelegraphs = infernoHud?.lightningTelegraphs || [];

  return (
    <div className="pointer-events-auto flex flex-col rounded-xl bg-[#0D080A]/92 border border-orange-500/55 shadow-[0_10px_28px_rgba(0,0,0,0.82)] overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between gap-1.5 px-2 py-1 border-b border-orange-500/25 bg-[#190B09]/95">
        <span className="text-[9.5px] font-moba font-extrabold text-orange-200 truncate max-w-[106px]">
          {zoneLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {onOpenJournal && (
            <button
              type="button"
              onClick={onOpenJournal}
              title={isEn ? "Open Investigation Dossier" : "Mở Hồ Sơ Điều Tra"}
              className="text-[9.5px] font-mono-numbers tabular-nums px-1.5 py-0.5 rounded border border-amber-500/45 bg-amber-950/60 text-amber-200 hover:bg-amber-900/75 cursor-pointer leading-none"
            >
              📜 {progress.collectedDocs.length}/{Object.keys(INFERNO_DOCS).length}
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            title={isEn ? "Minimize map" : "Thu gọn bản đồ"}
            className="text-[10px] font-mono-numbers text-orange-300 hover:text-white px-1 cursor-pointer leading-none shrink-0"
          >
            ▲
          </button>
        </div>
      </div>

      <div className="p-1.5 flex flex-col items-center">
        <svg
          width={mapW}
          height={mapH}
          viewBox={`0 0 ${INFERNO_MAP_WIDTH} ${INFERNO_MAP_HEIGHT}`}
          className="rounded-md bg-[#080507] border border-orange-950/80"
        >
          {/* 8 District Regions */}
          {INFERNO_ZONES.map((z) => {
            const isCurrent = infernoHud?.zoneId === z.id;
            return (
              <rect
                key={z.id}
                x={z.x + 8}
                y={z.y + 8}
                width={z.w - 16}
                height={z.h - 16}
                fill={isCurrent ? "rgba(249, 115, 22, 0.14)" : "rgba(30, 15, 16, 0.35)"}
                stroke={isCurrent ? z.accentColor : "rgba(120, 53, 15, 0.38)"}
                strokeWidth={isCurrent ? "16" : "8"}
              />
            );
          })}

          {/* Zone 8 Crater Center Accent */}
          <circle
            cx="1060"
            cy="920"
            r="260"
            fill="rgba(127, 29, 29, 0.25)"
            stroke="rgba(192, 132, 252, 0.45)"
            strokeWidth="16"
          />

          {/* Static Obstacles */}
          {INFERNO_STATIC_OBSTACLES.map((ob) => (
            <rect
              key={ob.id}
              x={ob.x}
              y={ob.y}
              width={ob.w}
              height={ob.h}
              fill={ob.kind === "chasm_void" ? "#050205" : "#44403C"}
            />
          ))}

          {/* Intact Cracked / Destructible Walls */}
          {INFERNO_DESTRUCTIBLE_WALLS.map((dw) =>
            destroyedSet.has(dw.id) ? null : (
              <rect
                key={dw.id}
                x={dw.x}
                y={dw.y}
                width={dw.w}
                height={dw.h}
                fill="#D97706"
                stroke="#FDE68A"
                strokeWidth="10"
              />
            )
          )}

          {/* Locked Gates */}
          {INFERNO_GATES.map((gt) =>
            openedDoorsSet.has(gt.id) ? null : (
              <rect
                key={gt.id}
                x={gt.x}
                y={gt.y}
                width={gt.w}
                height={gt.h}
                fill="#DC2626"
                stroke="#FCA5A5"
                strokeWidth="10"
              />
            )
          )}

          {/* Collapsible Bridges */}
          {bridges.map((br) => (
            <rect
              key={br.id}
              x={br.x}
              y={br.y}
              width={br.w}
              height={br.h}
              fill={
                br.state === "collapsed"
                  ? "rgba(220, 38, 38, 0.25)"
                  : br.state === "shaking"
                  ? "#F59E0B"
                  : "#78716C"
              }
              stroke={br.state === "collapsed" ? "#EF4444" : "#A8A29E"}
              strokeWidth="8"
            />
          ))}

          {/* Lightning Telegraphs */}
          {lightningTelegraphs.map((lt) => (
            <circle
              key={lt.id}
              cx={lt.x}
              cy={lt.y}
              r="72"
              fill="rgba(239, 68, 68, 0.3)"
              stroke="#F87171"
              strokeWidth="18"
            />
          ))}

          {/* Compass Target Beacon */}
          {compassTarget && (
            <circle
              cx={compassTarget.x}
              cy={compassTarget.y}
              r="118"
              fill="none"
              stroke={compassTarget.color}
              strokeWidth="22"
              strokeDasharray="52 34"
            />
          )}

          {/* Interactable Clues & Docs */}
          {INFERNO_INTERACTABLES.map((node) => {
            const done = inspectedSet.has(node.id);
            let col = "#94A3B8";
            if (node.id === "dung_crypt") col = done ? "#FEF08A" : "#FACC15";
            else if (node.id === "danh_shrine") col = done ? "#FED7AA" : "#FB923C";
            else if (node.id === "longhoi_console") col = done ? "#FDE68A" : "#F59E0B";
            else if (node.id === "trung_orb_pedestal" || node.id === "four_chairs_letters") {
              col = progress.fourChairsUnlocked ? "#E879F9" : "#6B21A8";
            } else if (node.grantsKey) {
              col = done ? "#6EE7B7" : "#10B981";
            } else {
              col = done ? "#64748B" : "#FDBA74";
            }
            return (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.heroIdRequired || node.grantsKey ? 44 : 30}
                fill={col}
                stroke="#080507"
                strokeWidth="14"
              />
            );
          })}

          {/* Active Boss Marker */}
          {bossPos && (
            <g transform={`translate(${bossPos.x}, ${bossPos.y})`}>
              <polygon
                points="0,-90 80,0 0,90 -80,0"
                fill="#EF4444"
                stroke="#FEF08A"
                strokeWidth="20"
              />
            </g>
          )}

          {/* Player Arrow */}
          <g transform={`translate(${px}, ${py}) rotate(${pAngleDeg})`}>
            <polygon
              points="92,0 -62,-54 -30,0 -62,54"
              fill="#FDE047"
              stroke="#080507"
              strokeWidth="20"
            />
          </g>
        </svg>

        {/* Zero-pill exploration progress bar */}
        <div className="w-full flex items-center justify-between gap-1 mt-1 px-0.5 text-[8.5px] font-mono-numbers tabular-nums text-slate-300">
          <span className={progress.dungClue ? "text-yellow-300 font-bold" : "text-slate-400"}>
            Dũng {progress.dungClue ? "✓" : "○"}
          </span>
          <span className="text-slate-600">·</span>
          <span className={progress.danhClue ? "text-orange-300 font-bold" : "text-slate-400"}>
            Danh {progress.danhClue ? "✓" : "○"}
          </span>
          <span className="text-slate-600">·</span>
          <span className={progress.longhoiClue ? "text-amber-300 font-bold" : "text-slate-400"}>
            Long {progress.longhoiClue ? "✓" : "○"}
          </span>
          <span className="text-slate-600">·</span>
          <span className={progress.trungTriggered ? "text-purple-300 font-bold" : progress.fourChairsUnlocked ? "text-fuchsia-300 font-bold" : "text-slate-400"}>
            4G {progress.trungTriggered ? "★" : progress.fourChairsUnlocked ? "✓" : "○"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function InfernoStoryModal({ payload, lang = "vi", onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const isEn = lang === "en";

  useEffect(() => {
    setStepIdx(0);
  }, [payload?.nodeId, payload?.title]);

  useEffect(() => {
    if (!payload) return;
    R.setNarrativeDuck?.(true);
    return () => {
      R.setNarrativeDuck?.(false);
    };
  }, [payload]);

  if (!payload) return null;

  const steps =
    Array.isArray(payload.steps) && payload.steps.length > 0
      ? payload.steps
      : [{ speaker: payload.title, text: (payload.paragraphs || [])[0] || "" }];
  const safeIdx = Math.max(0, Math.min(steps.length - 1, stepIdx));
  const currentStep = steps[safeIdx];
  const isLast = safeIdx >= steps.length - 1;
  const isTrung = Boolean(payload.isTrungReveal);

  const borderClass =
    payload.themeVariant === "trung"
      ? "border-purple-400/80 bg-gradient-to-b from-[#11081A] via-[#0B0612] to-[#050308]"
      : payload.themeVariant === "dung"
      ? "border-yellow-400/75 bg-gradient-to-b from-[#1B1307] via-[#100B06] to-[#070506]"
      : payload.themeVariant === "danh"
      ? "border-orange-400/75 bg-gradient-to-b from-[#1F0D07] via-[#130806] to-[#070506]"
      : payload.themeVariant === "longhoi"
      ? "border-amber-400/75 bg-gradient-to-b from-[#1D1006] via-[#110A06] to-[#070506]"
      : "border-rose-500/70 bg-gradient-to-b from-[#180A0C] to-[#070507]";

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-3 sm:p-5 ${
        isTrung ? "bg-black/92 backdrop-blur-md" : "bg-black/82 backdrop-blur-sm"
      }`}
      style={{ zIndex: 10070 }}
    >
      <div
        className={`w-full max-w-[580px] rounded-2xl border p-4 sm:p-5 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.9)] ${borderClass}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono-numbers font-bold uppercase tracking-widest text-orange-300">
              <span>{payload.code || "HN-LOG"}</span>
              <span className="text-slate-600">·</span>
              <span className="truncate">{payload.subtitle}</span>
            </div>
            <h3 className="mt-1 font-moba text-lg sm:text-xl font-black text-white leading-tight">
              {payload.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              R.playModalClose();
              onClose?.();
            }}
            className="btn-secondary px-2.5 py-1 text-xs shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Sequential Story Step Body */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono-numbers">
            <span
              className="font-extrabold uppercase tracking-wider"
              style={{ color: currentStep.speakerColor || "#FDBA74" }}
            >
              ▸ {currentStep.speaker}
            </span>
            <span className="text-slate-400 tabular-nums">
              {safeIdx + 1} / {steps.length}
            </span>
          </div>

          <div
            className={`rounded-xl border p-4 text-sm leading-relaxed ${
              isTrung
                ? "border-purple-500/45 bg-black/70 text-purple-100"
                : "border-white/10 bg-black/45 text-slate-200"
            }`}
          >
            <p>{currentStep.text}</p>
            {currentStep.subtext && (
              <p className="mt-2.5 pt-2.5 border-t border-white/10 text-xs italic text-amber-200/90">
                {currentStep.subtext}
              </p>
            )}
          </div>

          {isLast && payload.clueSummary && (
            <div className="rounded-xl border border-orange-500/35 bg-orange-950/25 px-3 py-2 text-xs font-semibold text-amber-200">
              {payload.clueSummary}
            </div>
          )}

          {isLast && payload.rewardText && (
            <div className="rounded-xl border border-emerald-400/45 bg-emerald-950/30 px-3 py-2 text-xs font-bold text-emerald-200">
              {payload.rewardText}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={safeIdx === 0}
            onClick={() => {
              R.playClick();
              setStepIdx((i) => Math.max(0, i - 1));
            }}
            className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
          >
            ← {isEn ? "Prev" : "Trước"}
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => {
                R.playInfernoTerminalLog?.();
                setStepIdx((i) => Math.min(steps.length - 1, i + 1));
              }}
              className="flex-1 btn-primary py-2 text-xs font-black"
            >
              {isEn ? "Next Log Entry →" : "Đọc Tiếp →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                R.playModalClose();
                onClose?.();
              }}
              className="flex-1 btn-primary py-2 text-xs font-black"
            >
              {isEn ? "Resume Battle" : "Tiếp Tục Chiến Đấu"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InfernoJournalModal({
  open,
  progress,
  lang = "vi",
  onClose,
}) {
  const safe = normalizeInfernoProgress(progress);
  const allDocs = useMemo(() => Object.values(INFERNO_DOCS), []);
  const [selectedDocId, setSelectedDocId] = useState(
    safe.collectedDocs[0] || allDocs[0]?.id || ""
  );

  useEffect(() => {
    if (!open) return;
    if (safe.collectedDocs.length > 0 && !safe.collectedDocs.includes(selectedDocId)) {
      setSelectedDocId(safe.collectedDocs[0]);
    }
  }, [open, safe.collectedDocs, selectedDocId]);

  if (!open) return null;

  const isVi = lang !== "en";
  const collectedSet = new Set(safe.collectedDocs);
  const activeDoc = INFERNO_DOCS[selectedDocId] || allDocs[0];
  const isDocCollected = activeDoc ? collectedSet.has(activeDoc.id) : false;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4"
      style={{ zIndex: 10065 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-orange-500/45 bg-[#090609] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-orange-500/25 bg-[#150909]">
          <div>
            <div className="text-[10px] font-mono-numbers font-bold uppercase tracking-[0.2em] text-orange-400">
              {isVi ? "MAP 2 · HỎA NGỤC TÀN TRO · HỒ SƠ ĐIỀU TRA" : "MAP 2 · INFERNO OF ASHES · INVESTIGATION"}
            </div>
            <h2 className="mt-1 font-moba text-lg sm:text-xl font-black text-amber-100">
              {isVi ? "Bảng Manh Mối & Tài Liệu Bị Thiêu" : "Clues & Scorched Archives"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              R.playModalClose();
              onClose?.();
            }}
            className="btn-secondary px-3 py-1.5 text-xs shrink-0"
          >
            {isVi ? "Đóng" : "Close"}
          </button>
        </div>

        {/* Status Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-black/40 text-xs">
          <div className={`rounded-lg border px-2.5 py-2 ${safe.dungClue ? "border-yellow-500/60 bg-yellow-950/25 text-yellow-200" : "border-slate-800 bg-slate-950/60 text-slate-400"}`}>
            <div className="text-[10px] font-mono-numbers font-bold">KHU 3 · DŨNG</div>
            <div className="font-moba font-bold mt-0.5">{safe.dungClue ? "✓ Đã giải mã" : "○ Chưa mở"}</div>
          </div>
          <div className={`rounded-lg border px-2.5 py-2 ${safe.danhClue ? "border-orange-500/60 bg-orange-950/25 text-orange-200" : "border-slate-800 bg-slate-950/60 text-slate-400"}`}>
            <div className="text-[10px] font-mono-numbers font-bold">KHU 4 · DANH</div>
            <div className="font-moba font-bold mt-0.5">{safe.danhClue ? "✓ Đã giải mã" : "○ Chưa mở"}</div>
          </div>
          <div className={`rounded-lg border px-2.5 py-2 ${safe.longhoiClue ? "border-amber-500/60 bg-amber-950/25 text-amber-200" : "border-slate-800 bg-slate-950/60 text-slate-400"}`}>
            <div className="text-[10px] font-mono-numbers font-bold">KHU 5 · LONG HÓI</div>
            <div className="font-moba font-bold mt-0.5">{safe.longhoiClue ? "✓ Đã giải mã" : "○ Chưa mở"}</div>
          </div>
          <div className={`rounded-lg border px-2.5 py-2 ${safe.trungTriggered ? "border-purple-400/70 bg-purple-950/30 text-purple-200" : safe.fourChairsUnlocked ? "border-fuchsia-500/60 bg-fuchsia-950/25 text-fuchsia-200" : "border-slate-800 bg-slate-950/60 text-slate-400"}`}>
            <div className="text-[10px] font-mono-numbers font-bold">KHU 7 · 4 CHIẾC GHẾ</div>
            <div className="font-moba font-bold mt-0.5">
              {safe.trungTriggered ? "★ Sự thật Trung" : safe.fourChairsUnlocked ? "🔓 Đã mở cửa" : "🔒 Cần 3 manh mối"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 p-4 sm:p-5">
          {/* Doc List */}
          <div className="space-y-1.5 max-h-[220px] md:max-h-[48vh] overflow-y-auto pr-1">
            {allDocs.map((doc) => {
              const found = collectedSet.has(doc.id);
              const selected = doc.id === activeDoc?.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    R.playClick();
                    setSelectedDocId(doc.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition cursor-pointer ${
                    selected
                      ? "bg-orange-950/70 border-orange-400/75 text-white"
                      : found
                      ? "bg-slate-900/75 border-slate-700/80 text-slate-200 hover:border-orange-500/50"
                      : "bg-slate-950/50 border-slate-800/70 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 font-mono-numbers text-[10px]">
                    <span>{doc.code}</span>
                    <span>{found ? "✓" : "🔒"}</span>
                  </div>
                  <div className="font-moba font-bold truncate mt-0.5">
                    {found ? (isVi ? doc.title.vi : doc.title.en) : isVi ? "Tài liệu chưa thu thập" : "Uncollected Record"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Doc Reader */}
          {activeDoc && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between gap-3">
              {isDocCollected ? (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-mono-numbers font-bold uppercase tracking-widest text-orange-400">
                    {activeDoc.code} · {isVi ? activeDoc.subtitle.vi : activeDoc.subtitle.en}
                  </div>
                  <h3 className="font-moba text-lg font-black text-amber-100">
                    {isVi ? activeDoc.title.vi : activeDoc.title.en}
                  </h3>
                  <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                    {activeDoc.paragraphs.map((p, idx) => (
                      <p key={idx}>{isVi ? p.vi : p.en}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="text-2xl">🔥</div>
                  <div className="font-moba text-sm font-bold text-slate-300">
                    {isVi ? "Hồ sơ này vẫn nằm trong đống tro tàn" : "This record still lies within the ashes"}
                  </div>
                  <p className="text-xs text-slate-400">
                    {isVi
                      ? `Hãy khám phá ${INFERNO_ZONES.find((z) => z.id === activeDoc.zoneId)?.name.vi || "thành phố"} và nhấn [V] tại các điểm phát sáng.`
                      : `Explore ${INFERNO_ZONES.find((z) => z.id === activeDoc.zoneId)?.name.en || "the ruined city"} and press [V] at glowing nodes.`}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[11px] font-mono-numbers text-slate-400">
                <span>
                  {isVi ? "Chìa khóa:" : "Keys:"}{" "}
                  {safe.keysFound.length > 0 ? safe.keysFound.join(", ") : isVi ? "Chưa có" : "None"}
                </span>
                <span className="text-slate-700">·</span>
                <span>
                  {isVi ? "Tường phá:" : "Walls Broken:"} {safe.destroyedWalls.length}/4
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
