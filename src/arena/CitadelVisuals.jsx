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
  getCitadelSecretCompassTarget,
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
        fill={unlocked ? (active ? "#1A0914" : "#110912") : "#0B0F19"}
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
      {/* Citadel inner rampart & corner bastions */}
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="3"
        fill="none"
        stroke={unlocked ? "rgba(190, 18, 60, 0.42)" : "rgba(71, 85, 105, 0.28)"}
        strokeWidth="1.1"
      />
      <rect x="6" y="6" width="5" height="5" fill={unlocked ? "#881337" : "#334155"} />
      <rect x="53" y="6" width="5" height="5" fill={unlocked ? "#881337" : "#334155"} />
      <rect x="6" y="53" width="5" height="5" fill={unlocked ? "#881337" : "#334155"} />
      <rect x="53" y="53" width="5" height="5" fill={unlocked ? "#881337" : "#334155"} />

      {/* East-West Cross-Aisle & Grand Causeway */}
      <line
        x1="12"
        y1="34"
        x2="52"
        y2="34"
        stroke={unlocked ? "rgba(190, 18, 60, 0.24)" : "rgba(100, 116, 139, 0.18)"}
        strokeWidth="3"
      />
      <line
        x1="32"
        y1="19"
        x2="32"
        y2="55"
        stroke={unlocked ? "rgba(244, 63, 94, 0.34)" : "rgba(100, 116, 139, 0.25)"}
        strokeWidth="3.2"
      />

      {/* Northern Secret Vault chamber */}
      <rect
        x="22"
        y="8"
        width="20"
        height="11"
        rx="1.5"
        fill={sharedDone ? "rgba(250, 204, 21, 0.2)" : "rgba(147, 51, 234, 0.18)"}
        stroke={sharedDone ? "#FACC15" : unlocked ? "#C084FC" : "#475569"}
        strokeWidth="1.3"
      />
      {sharedDone && (
        <polygon points="32,10.5 34.5,13.5 32,16.5 29.5,13.5" fill="#FEF08A" />
      )}

      {/* Central Blood Ritual Seal */}
      <circle
        cx="32"
        cy="34"
        r="10"
        fill="rgba(136, 19, 55, 0.28)"
        stroke={unlocked ? "#FB7185" : "#475569"}
        strokeWidth="1.3"
      />
      <circle
        cx="32"
        cy="34"
        r="4.6"
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
      <circle cx="13" cy="14" r="2.1" fill={unlocked ? "#F43F5E" : "#475569"} />
      <circle cx="51" cy="14" r="2.1" fill={unlocked ? "#F43F5E" : "#475569"} />
      <circle cx="32" cy="49" r="2" fill={unlocked ? "#F43F5E" : "#475569"} />

      {/* Tin (#MT-07 Crimson Crystal NE) & Bao (#BS-04 Mirror Eye SW) */}
      <polygon
        points="54,7.2 56.8,10.2 54,13.2 51.2,10.2"
        fill={tinDone ? "#FDA4AF" : unlocked ? "#E11D48" : "#334155"}
        stroke={tinDone ? "#FFE4E6" : "none"}
        strokeWidth="0.6"
      />
      <ellipse
        cx="10.5"
        cy="48.5"
        rx="2.6"
        ry="3.6"
        fill={baoDone ? "#E879F9" : unlocked ? "#7E22CE" : "#334155"}
        stroke={baoDone ? "#FAE8FF" : "none"}
        strokeWidth="0.6"
      />
    </svg>
  );
}

export function CitadelLoreCrest({
  nodeId,
  resonated = false,
  combined = false,
  className = "w-12 h-12",
}) {
  if (nodeId === "tin_lab") {
    const glow = resonated ? "#FB7185" : "#9F1239";
    return (
      <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="10"
          fill="#17080F"
          stroke={resonated ? "#FB7185" : "#881337"}
          strokeWidth="1.8"
        />
        <circle cx="32" cy="32" r="22" fill="none" stroke={glow} strokeWidth="1.3" strokeDasharray="5 4" />
        <ellipse cx="32" cy="32" rx="19" ry="8" transform="rotate(-25 32 32)" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.85" />
        <ellipse cx="32" cy="32" rx="19" ry="8" transform="rotate(25 32 32)" fill="none" stroke="#FB7185" strokeWidth="1.2" opacity="0.85" />
        {/* Faceted Crimson Ma Thach Core */}
        <polygon
          points="32,12 43,32 32,52 21,32"
          fill={resonated ? "#FFE4E6" : "#E11D48"}
          stroke="#FB7185"
          strokeWidth="1.8"
        />
        <line x1="32" y1="14" x2="32" y2="50" stroke={resonated ? "#E11D48" : "#FDA4AF"} strokeWidth="1.2" />
        <line x1="23" y1="32" x2="41" y2="32" stroke={resonated ? "#E11D48" : "#FDA4AF"} strokeWidth="1.2" />
      </svg>
    );
  }

  if (nodeId === "bao_mirror") {
    const rim = resonated ? "#E879F9" : "#9333EA";
    return (
      <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="10"
          fill="#12091E"
          stroke={rim}
          strokeWidth="1.8"
        />
        {/* Raven wings mirror crest */}
        <path d="M32 10 L18 6 L23 15 L32 13 L41 15 L46 6 Z" fill="#3B0764" stroke="#E879F9" strokeWidth="1.2" />
        {/* Gothic Arch Mirror */}
        <ellipse cx="32" cy="34" rx="13" ry="19" fill="#1E1B4B" stroke="#C084FC" strokeWidth="2.2" />
        {/* Fracture cracks */}
        <polyline points="24,22 33,34 27,47" fill="none" stroke="#F5D0FE" strokeWidth="1.4" />
        <line x1="33" y1="34" x2="41" y2="28" stroke="#F5D0FE" strokeWidth="1.4" />
        {/* Twin Phantom Eyes inside the reflection */}
        <circle cx="28" cy="29" r="2" fill={resonated ? "#FFFFFF" : "#E879F9"} />
        <circle cx="36" cy="29" r="2" fill={resonated ? "#FFFFFF" : "#E879F9"} />
        {/* Crossed Shadow Daggers beneath frame */}
        <line x1="15" y1="53" x2="27" y2="41" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" />
        <line x1="49" y1="53" x2="37" y2="41" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // shared_altar (#ZERO-00)
  const borderCol = combined ? "#FACC15" : resonated ? "#F472B6" : "#64748B";
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="10"
        fill={combined ? "#1B110D" : "#120B18"}
        stroke={borderCol}
        strokeWidth="1.8"
      />
      <circle cx="32" cy="32" r="22" fill="none" stroke={borderCol} strokeWidth="1.2" strokeDasharray="6 4" />
      {/* Converging Crimson (Tin) & Violet (Bao) Leylines */}
      <line x1="12" y1="32" x2="52" y2="32" stroke={combined ? "#FDE047" : "#F472B6"} strokeWidth="2" />
      <circle cx="15" cy="32" r="5.5" fill="#F43F5E" stroke="#FDA4AF" strokeWidth="1.3" />
      <circle cx="49" cy="32" r="5.5" fill="#A855F7" stroke="#E9D5FF" strokeWidth="1.3" />
      {/* 8-point Bloodshade Star Crest */}
      <polygon
        points="32,14 35.5,27 48,32 35.5,37 32,50 28.5,37 16,32 28.5,27"
        fill={combined ? "#FEF08A" : "#334155"}
        stroke={combined ? "#F59E0B" : "#94A3B8"}
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function CitadelTacticalMinimap({
  hudSnapshot,
  heroId,
  lang = "vi",
  compact = false,
  isOpen = true,
  onToggle,
}) {
  const isEn = lang === "en";
  const citadelHud = hudSnapshot?.citadelHud;
  const secrets = hudSnapshot?.citadelSecrets || {};
  const zoneLabel = citadelHud?.zoneLabel || (isEn ? "Blood Citadel" : "Cổ Thành Huyết Táng");
  const compassTarget = getCitadelSecretCompassTarget(heroId, secrets, isEn ? "en" : "vi");

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title={isEn ? "Open Citadel Tactical Map" : "Mở Bản Đồ Cổ Thành"}
        className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#140A12]/90 hover:bg-[#1F0F1B] border border-rose-500/50 text-[10px] font-moba font-bold text-rose-100 whitespace-nowrap shrink-0 cursor-pointer shadow-md"
      >
        <span className="text-amber-300">◈</span>
        <span className="max-w-[116px] truncate">{zoneLabel}</span>
        <span className="text-[9px] text-rose-300/80">▼</span>
      </button>
    );
  }

  const sizePx = compact ? 92 : 118;
  const collapsedSet = new Set(citadelHud?.collapsedIds || []);
  const watchtowers = citadelHud?.watchtowers || BLOOD_CITADEL_WATCHTOWERS;
  const bloodTraps = citadelHud?.bloodTraps || BLOOD_CITADEL_BLOOD_TRAPS;
  const px = Number.isFinite(citadelHud?.playerX) ? citadelHud.playerX : 800;
  const py = Number.isFinite(citadelHud?.playerY) ? citadelHud.playerY : 840;
  const pAngleDeg = ((citadelHud?.playerFacing || 0) * 180) / Math.PI;
  const bossPos = citadelHud?.bossPos || null;

  return (
    <div className="pointer-events-auto flex flex-col rounded-xl bg-[#0D070F]/90 border border-rose-500/50 shadow-[0_8px_24px_rgba(0,0,0,0.75)] overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between gap-1.5 px-2 py-1 border-b border-rose-500/25 bg-[#160A15]/92">
        <span className="text-[9.5px] font-moba font-extrabold text-amber-200 truncate max-w-[96px]">
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
          {/* Ceremonial Causeway & Cross-Aisle */}
          <rect x="708" y="330" width="184" height="1110" fill="rgba(136, 19, 55, 0.14)" />
          <rect x="320" y="790" width="960" height="100" fill="rgba(136, 19, 55, 0.11)" />

          {/* Northern Vault floor */}
          <rect
            x={BLOOD_CITADEL_SECRET_VAULT_RECT.x}
            y={BLOOD_CITADEL_SECRET_VAULT_RECT.y}
            width={BLOOD_CITADEL_SECRET_VAULT_RECT.w}
            height={BLOOD_CITADEL_SECRET_VAULT_RECT.h}
            fill={secrets.combinedUnlocked ? "rgba(250, 204, 21, 0.18)" : "rgba(147, 51, 234, 0.18)"}
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
            fill="rgba(180, 83, 9, 0.48)"
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

          {/* Active Hero Easter Egg Beacon Ring */}
          {compassTarget && (
            <circle
              cx={compassTarget.x}
              cy={compassTarget.y}
              r="98"
              fill="none"
              stroke={compassTarget.color}
              strokeWidth="20"
              strokeDasharray="46 34"
            />
          )}

          {/* Interactable Lore Nodes */}
          {BLOOD_CITADEL_INTERACTABLES.map((node) => {
            if (node.id === "tin_lab") {
              return (
                <polygon
                  key={node.id}
                  points={`${node.x},${node.y - 52} ${node.x + 48},${node.y} ${node.x},${node.y + 52} ${node.x - 48},${node.y}`}
                  fill={secrets.tinClue ? "#FDA4AF" : "#F43F5E"}
                  stroke="#09050B"
                  strokeWidth="16"
                />
              );
            }
            if (node.id === "bao_mirror") {
              return (
                <ellipse
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  rx="40"
                  ry="54"
                  fill={secrets.baoClue ? "#E879F9" : "#A855F7"}
                  stroke="#09050B"
                  strokeWidth="16"
                />
              );
            }
            return (
              <polygon
                key={node.id}
                points={`${node.x},${node.y - 58} ${node.x + 18},${node.y - 18} ${node.x + 58},${node.y} ${node.x + 18},${node.y + 18} ${node.x},${node.y + 58} ${node.x - 18},${node.y + 18} ${node.x - 58},${node.y} ${node.x - 18},${node.y - 18}`}
                fill={secrets.combinedUnlocked ? "#FACC15" : "#F472B6"}
                stroke="#09050B"
                strokeWidth="14"
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
              points="78,0 -52,-46 -26,0 -52,46"
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
