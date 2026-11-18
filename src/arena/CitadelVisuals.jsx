import React from "react";
import {
  BLOOD_CITADEL_SIZE,
  BLOOD_CITADEL_STATIC_OBSTACLES,
  BLOOD_CITADEL_COLLAPSIBLE_DEFS,
  BLOOD_CITADEL_SECRET_VAULT_RECT,
  BLOOD_CITADEL_GATE_ARCH,
  BLOOD_CITADEL_INTERACTABLES,
  BLOOD_CITADEL_WATCHTOWERS,
  BLOOD_CITADEL_BLOOD_TRAPS,
} from "./bloodCitadelMap";

export function CitadelBlueprintEmblem({
  secrets = {},
  unlocked = true,
  active = false,
  className = "",
}) {
  const tinDone = Boolean(secrets?.tinClue);
  const baoDone = Boolean(secrets?.baoClue);
  const sharedDone = Boolean(secrets?.combinedUnlocked);

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
        fill={unlocked ? (active ? "#190A13" : "#110912") : "#0B0F19"}
        stroke={
          !unlocked
            ? "#334155"
            : sharedDone
              ? "#FACC15"
              : active
                ? "#FB7185"
                : "#881337"
        }
        strokeWidth="1.8"
      />
      {/* Citadel inner rampart */}
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="3"
        fill="none"
        stroke={unlocked ? "rgba(190, 18, 60, 0.35)" : "rgba(71, 85, 105, 0.28)"}
        strokeWidth="1"
      />
      {/* Northern Secret Vault chamber */}
      <rect
        x="22"
        y="8"
        width="20"
        height="11"
        rx="1.5"
        fill={sharedDone ? "rgba(250, 204, 21, 0.16)" : "rgba(147, 51, 234, 0.18)"}
        stroke={sharedDone ? "#FACC15" : unlocked ? "#C084FC" : "#475569"}
        strokeWidth="1.2"
      />
      {/* Central Causeway */}
      <line
        x1="32"
        y1="19"
        x2="32"
        y2="55"
        stroke={unlocked ? "rgba(244, 63, 94, 0.3)" : "rgba(100, 116, 139, 0.25)"}
        strokeWidth="3"
      />
      {/* Central Blood Ritual Seal */}
      <circle
        cx="32"
        cy="34"
        r="9.5"
        fill="rgba(136, 19, 55, 0.24)"
        stroke={unlocked ? "#FB7185" : "#475569"}
        strokeWidth="1.3"
      />
      <circle
        cx="32"
        cy="34"
        r="4.5"
        fill="none"
        stroke={unlocked ? "#F59E0B" : "#64748B"}
        strokeWidth="1"
      />
      {/* Southern Gate Arch */}
      <rect
        x="24"
        y="52"
        width="16"
        height="4"
        rx="1"
        fill={unlocked ? "#B45309" : "#475569"}
      />
      {/* Three Watchtower Bastions */}
      <circle cx="13" cy="14" r="2.2" fill={unlocked ? "#F43F5E" : "#475569"} />
      <circle cx="51" cy="14" r="2.2" fill={unlocked ? "#F43F5E" : "#475569"} />
      <circle cx="32" cy="49" r="2" fill={unlocked ? "#F43F5E" : "#475569"} />
      {/* Tin & Bao Secret Nodes */}
      <circle
        cx="54"
        cy="10"
        r="2.4"
        fill={tinDone ? "#FDA4AF" : unlocked ? "rgba(244, 63, 94, 0.45)" : "#334155"}
      />
      <circle
        cx="10"
        cy="49"
        r="2.4"
        fill={baoDone ? "#E879F9" : unlocked ? "rgba(168, 85, 247, 0.45)" : "#334155"}
      />
    </svg>
  );
}

export function CitadelTacticalMinimap({
  hudSnapshot,
  lang = "vi",
  compact = false,
  isOpen = true,
  onToggle,
}) {
  const isEn = lang === "en";
  const citadelHud = hudSnapshot?.citadelHud;
  const secrets = hudSnapshot?.citadelSecrets || {};
  const zoneLabel = citadelHud?.zoneLabel || (isEn ? "Blood Citadel" : "Cổ Thành Huyết Táng");

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title={isEn ? "Open Citadel Tactical Map" : "Mở Bản Đồ Cổ Thành"}
        className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#140A12]/90 hover:bg-[#1F0F1B] border border-rose-500/50 text-[10.5px] font-moba font-bold text-rose-100 whitespace-nowrap shrink-0 cursor-pointer shadow-md"
      >
        <span className="text-amber-300">◈</span>
        <span>{zoneLabel}</span>
        <span className="text-[9px] text-rose-300/80">▼</span>
      </button>
    );
  }

  const sizePx = compact ? 92 : 114;
  const collapsedSet = new Set(citadelHud?.collapsedIds || []);
  const watchtowers = citadelHud?.watchtowers || BLOOD_CITADEL_WATCHTOWERS;
  const bloodTraps = citadelHud?.bloodTraps || BLOOD_CITADEL_BLOOD_TRAPS;
  const px = Number.isFinite(citadelHud?.playerX) ? citadelHud.playerX : 800;
  const py = Number.isFinite(citadelHud?.playerY) ? citadelHud.playerY : 840;
  const pAngleDeg = ((citadelHud?.playerFacing || 0) * 180) / Math.PI;
  const bossPos = citadelHud?.bossPos || null;

  return (
    <div className="pointer-events-auto flex flex-col rounded-xl bg-[#0D070F]/88 border border-rose-500/45 shadow-[0_8px_24px_rgba(0,0,0,0.72)] overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between gap-1.5 px-2 py-1 border-b border-rose-500/25 bg-[#160A15]/90">
        <span className="text-[9.5px] font-moba font-extrabold text-amber-200 truncate max-w-[84px]">
          {zoneLabel}
        </span>
        <button
          type="button"
          onClick={onToggle}
          title={isEn ? "Minimize map" : "Thu gọn bản đồ"}
          className="text-[10px] font-mono-numbers text-rose-300 hover:text-white px-1 cursor-pointer leading-none shrink-0"
        >
          ▲
        </button>
      </div>

      <div className="p-1.5 flex flex-col items-center">
        <svg
          width={sizePx}
          height={sizePx}
          viewBox={`0 0 ${BLOOD_CITADEL_SIZE} ${BLOOD_CITADEL_SIZE}`}
          className="rounded-md bg-[#09050B] border border-rose-900/60"
        >
          {/* Northern Vault floor */}
          <rect
            x={BLOOD_CITADEL_SECRET_VAULT_RECT.x}
            y={BLOOD_CITADEL_SECRET_VAULT_RECT.y}
            width={BLOOD_CITADEL_SECRET_VAULT_RECT.w}
            height={BLOOD_CITADEL_SECRET_VAULT_RECT.h}
            fill={secrets.combinedUnlocked ? "rgba(250, 204, 21, 0.16)" : "rgba(147, 51, 234, 0.18)"}
            stroke={secrets.combinedUnlocked ? "#FACC15" : "#A855F7"}
            strokeWidth="18"
          />

          {/* Central Ritual Ring */}
          <circle
            cx="800"
            cy="840"
            r="204"
            fill="rgba(136, 19, 55, 0.18)"
            stroke="rgba(225, 29, 72, 0.45)"
            strokeWidth="16"
          />

          {/* Southern Gate Threshold */}
          <rect
            x={BLOOD_CITADEL_GATE_ARCH.x}
            y={BLOOD_CITADEL_GATE_ARCH.y}
            width={BLOOD_CITADEL_GATE_ARCH.w}
            height={BLOOD_CITADEL_GATE_ARCH.h}
            fill="rgba(180, 83, 9, 0.45)"
          />

          {/* Static Stone Obstacles */}
          {BLOOD_CITADEL_STATIC_OBSTACLES.map((ob) => (
            <rect
              key={ob.id}
              x={ob.x}
              y={ob.y}
              width={ob.w}
              height={ob.h}
              fill={ob.kind === "vault_wall" ? "#6B21A8" : "#52525B"}
            />
          ))}

          {/* Intact Collapsible Walls */}
          {BLOOD_CITADEL_COLLAPSIBLE_DEFS.map((cw) =>
            collapsedSet.has(cw.id) ? null : (
              <rect
                key={cw.id}
                x={cw.x}
                y={cw.y}
                width={cw.w}
                height={cw.h}
                fill="#A8A29E"
              />
            )
          )}

          {/* Blood Traps */}
          {bloodTraps.map((tr) => {
            const activeWarn = tr.state === "warning" || tr.state === "erupt";
            return (
              <circle
                key={tr.id}
                cx={tr.x}
                cy={tr.y}
                r={activeWarn ? 54 : 38}
                fill={activeWarn ? "#FB7185" : "rgba(190, 18, 60, 0.42)"}
              />
            );
          })}

          {/* Watchtowers */}
          {watchtowers.map((tw) => {
            const tele = tw.state === "telegraph";
            return (
              <g key={tw.id} transform={`translate(${tw.x}, ${tw.y})`}>
                {tele && (
                  <circle
                    r="86"
                    fill="none"
                    stroke="#FDE047"
                    strokeWidth="22"
                  />
                )}
                <circle r="38" fill={tele ? "#FEF08A" : "#E11D48"} />
              </g>
            );
          })}

          {/* Interactable Lore Nodes */}
          {BLOOD_CITADEL_INTERACTABLES.map((node) => {
            const color =
              node.id === "tin_lab"
                ? secrets.tinClue
                  ? "#FDA4AF"
                  : "#F43F5E"
                : node.id === "bao_mirror"
                  ? secrets.baoClue
                    ? "#E879F9"
                    : "#A855F7"
                  : secrets.combinedUnlocked
                    ? "#FACC15"
                    : "#F472B6";
            return (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r="42"
                fill={color}
                stroke="#09050B"
                strokeWidth="16"
              />
            );
          })}

          {/* Active Boss Marker */}
          {bossPos && (
            <g transform={`translate(${bossPos.x}, ${bossPos.y})`}>
              <polygon
                points="0,-78 68,0 0,78 -68,0"
                fill="#EF4444"
                stroke="#FEF08A"
                strokeWidth="20"
              />
            </g>
          )}

          {/* Player Arrow */}
          <g transform={`translate(${px}, ${py}) rotate(${pAngleDeg})`}>
            <polygon
              points="76,0 -52,-46 -26,0 -52,46"
              fill="#FDE047"
              stroke="#09050B"
              strokeWidth="18"
            />
          </g>
        </svg>

        {/* Secret progress legend without pills */}
        <div className="w-full flex items-center justify-between gap-1 mt-1 px-0.5 text-[8.5px] font-mono-numbers tabular-nums text-slate-300">
          <span className={secrets.tinClue ? "text-rose-300 font-bold" : "text-slate-400"}>
            Tin {secrets.tinClue ? "✓" : "○"}
          </span>
          <span className="text-slate-600">·</span>
          <span className={secrets.baoClue ? "text-purple-300 font-bold" : "text-slate-400"}>
            Bảo {secrets.baoClue ? "✓" : "○"}
          </span>
          <span className="text-slate-600">·</span>
          <span className={secrets.combinedUnlocked ? "text-amber-300 font-bold" : "text-slate-400"}>
            {isEn ? "Vault" : "Hầm"} {secrets.combinedUnlocked ? "✓" : "○"}
          </span>
        </div>
      </div>
    </div>
  );
}
