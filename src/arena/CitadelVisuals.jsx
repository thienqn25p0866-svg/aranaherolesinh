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
      <defs>
        <radialGradient id="citadelEmblemGlow" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor={sharedDone ? "rgba(250,204,21,0.22)" : "rgba(225,29,72,0.2)"} />
          <stop offset="100%" stopColor="rgba(17,9,18,0)" />
        </radialGradient>
      </defs>
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
      {unlocked && <rect x="4" y="4" width="56" height="56" rx="4" fill="url(#citadelEmblemGlow)" />}

      {/* Citadel inner rampart & corner bastions */}
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="3"
        fill="none"
        stroke={unlocked ? "rgba(190, 18, 60, 0.45)" : "rgba(71, 85, 105, 0.28)"}
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
        stroke={unlocked ? "rgba(190, 18, 60, 0.26)" : "rgba(100, 116, 139, 0.18)"}
        strokeWidth="3"
      />
      <line
        x1="32"
        y1="19"
        x2="32"
        y2="55"
        stroke={unlocked ? "rgba(244, 63, 94, 0.36)" : "rgba(100, 116, 139, 0.25)"}
        strokeWidth="3.2"
      />

      {/* Converging Crimson (Tin) & Violet (Bao) Easter Egg Conduits into Vault */}
      {unlocked && (
        <>
          <path
            d="M52 12 L42 12 L39 14"
            fill="none"
            stroke={tinDone ? "rgba(251, 113, 133, 0.85)" : "rgba(225, 29, 72, 0.35)"}
            strokeWidth="1"
            strokeDasharray={tinDone ? undefined : "2 1.5"}
          />
          <path
            d="M11 45 L11 16 L22 14"
            fill="none"
            stroke={baoDone ? "rgba(216, 180, 254, 0.85)" : "rgba(147, 51, 234, 0.35)"}
            strokeWidth="1"
            strokeDasharray={baoDone ? undefined : "2 1.5"}
          />
        </>
      )}

      {/* Northern Secret Vault chamber */}
      <rect
        x="22"
        y="8"
        width="20"
        height="11"
        rx="1.5"
        fill={sharedDone ? "rgba(250, 204, 21, 0.22)" : "rgba(147, 51, 234, 0.2)"}
        stroke={sharedDone ? "#FACC15" : unlocked ? "#C084FC" : "#475569"}
        strokeWidth="1.3"
      />
      {sharedDone ? (
        <polygon
          points="32,9.8 33.4,12.4 36.2,13.5 33.4,14.6 32,17.2 30.6,14.6 27.8,13.5 30.6,12.4"
          fill="#FEF08A"
        />
      ) : (
        <circle cx="32" cy="13.5" r="2.2" fill="none" stroke={unlocked ? "#A855F7" : "#475569"} strokeWidth="0.9" />
      )}

      {/* Central Blood Ritual Seal & Octagon */}
      <circle
        cx="32"
        cy="34"
        r="10.2"
        fill="rgba(136, 19, 55, 0.3)"
        stroke={unlocked ? "#FB7185" : "#475569"}
        strokeWidth="1.3"
      />
      <polygon
        points="32,25.6 38,28 40.4,34 38,40 32,42.4 26,40 23.6,34 26,28"
        fill="none"
        stroke={unlocked ? "rgba(251, 191, 36, 0.45)" : "rgba(100, 116, 139, 0.28)"}
        strokeWidth="0.8"
      />
      <circle
        cx="32"
        cy="34"
        r="4.5"
        fill="rgba(190, 18, 60, 0.35)"
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

      {/* Tin (#MT-07 Crimson Crystal Cluster NE) */}
      <polygon
        points="54,6.8 57.2,10.2 54,13.6 50.8,10.2"
        fill={tinDone ? "#FDA4AF" : unlocked ? "#E11D48" : "#334155"}
        stroke={tinDone ? "#FFE4E6" : "none"}
        strokeWidth="0.7"
      />
      <polygon points="57.8,11.6 59.4,13.4 57.8,15.2 56.2,13.4" fill={tinDone ? "#FB7185" : "#9F1239"} opacity="0.85" />

      {/* Bao (#BS-04 Mirror Eye SW) */}
      <ellipse
        cx="10.5"
        cy="48.5"
        rx="2.8"
        ry="3.9"
        fill={baoDone ? "#D946EF" : unlocked ? "#7E22CE" : "#334155"}
        stroke={baoDone ? "#FAE8FF" : "none"}
        strokeWidth="0.7"
      />
      <ellipse cx="10.5" cy="48.5" rx="0.9" ry="2.2" fill={baoDone ? "#FEF08A" : "#C084FC"} opacity="0.85" />
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
        <defs>
          <radialGradient id="tinCrestGrad" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor={resonated ? "rgba(244,63,94,0.36)" : "rgba(159,18,57,0.26)"} />
            <stop offset="100%" stopColor="rgba(23,8,15,0)" />
          </radialGradient>
        </defs>
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
        <rect x="4" y="4" width="56" height="56" rx="8" fill="url(#tinCrestGrad)" />
        {/* 12 Astrolabe cardinal compass ticks */}
        <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(245,158,11,0.38)" strokeWidth="0.8" />
        <circle cx="32" cy="32" r="21" fill="none" stroke={glow} strokeWidth="1.2" strokeDasharray="5 3.5" />
        <line x1="32" y1="6" x2="32" y2="10.5" stroke="#F59E0B" strokeWidth="1.1" />
        <line x1="32" y1="53.5" x2="32" y2="58" stroke="#F59E0B" strokeWidth="1.1" />
        <line x1="6" y1="32" x2="10.5" y2="32" stroke="#F59E0B" strokeWidth="1.1" />
        <line x1="53.5" y1="32" x2="58" y2="32" stroke="#F59E0B" strokeWidth="1.1" />
        <ellipse cx="32" cy="32" rx="19.5" ry="7.8" transform="rotate(-26 32 32)" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.88" />
        <ellipse cx="32" cy="32" rx="19.5" ry="7.8" transform="rotate(26 32 32)" fill="none" stroke="#FB7185" strokeWidth="1.2" opacity="0.88" />
        {/* Orbiting micro-shards */}
        <polygon points="14,15 16.5,18.5 14,22 11.5,18.5" fill="#FB7185" opacity="0.9" />
        <polygon points="50,15 52.5,18.5 50,22 47.5,18.5" fill="#FBBF24" opacity="0.9" />
        <polygon points="14,42 16.5,45.5 14,49 11.5,45.5" fill="#FBBF24" opacity="0.8" />
        <polygon points="50,42 52.5,45.5 50,49 47.5,45.5" fill="#FB7185" opacity="0.8" />
        {/* Faceted Crimson Ma Thach Core */}
        <polygon
          points="32,11 43.5,32 32,53 20.5,32"
          fill={resonated ? "#FFE4E6" : "#E11D48"}
          stroke="#FB7185"
          strokeWidth="1.8"
        />
        <polygon points="32,18 37.5,32 32,46 26.5,32" fill={resonated ? "#FDA4AF" : "#9F1239"} opacity="0.65" />
        <line x1="32" y1="13" x2="32" y2="51" stroke={resonated ? "#BE123C" : "#FDA4AF"} strokeWidth="1.1" />
        <line x1="22" y1="32" x2="42" y2="32" stroke={resonated ? "#BE123C" : "#FDA4AF"} strokeWidth="1.1" />
      </svg>
    );
  }

  if (nodeId === "bao_mirror") {
    const rim = resonated ? "#E879F9" : "#9333EA";
    return (
      <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
        <defs>
          <radialGradient id="baoCrestGrad" cx="50%" cy="52%" r="50%">
            <stop offset="0%" stopColor={resonated ? "rgba(217,70,239,0.34)" : "rgba(126,34,206,0.26)"} />
            <stop offset="100%" stopColor="rgba(18,9,30,0)" />
          </radialGradient>
        </defs>
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
        <rect x="4" y="4" width="56" height="56" rx="8" fill="url(#baoCrestGrad)" />
        {/* Raven wings mirror crest */}
        <path d="M32 10 L16 6 L22 15.5 L32 13 L42 15.5 L48 6 Z" fill="#3B0764" stroke="#E879F9" strokeWidth="1.2" />
        {/* Double-bezel Gothic Arch Mirror */}
        <ellipse cx="32" cy="34" rx="14.5" ry="20.5" fill="none" stroke="rgba(192,132,252,0.4)" strokeWidth="1" />
        <ellipse cx="32" cy="34" rx="12.5" ry="18.2" fill="#17133B" stroke="#C084FC" strokeWidth="2.1" />
        {/* Uncanny reflection silhouette */}
        <path d="M24 47 Q25 36 32 35 Q39 36 40 47" fill="rgba(88, 28, 135, 0.55)" />
        {/* Spiderweb fracture cracks */}
        <polyline points="23.5,21.5 32.5,34 26.5,47.5" fill="none" stroke="#F5D0FE" strokeWidth="1.3" />
        <line x1="32.5" y1="34" x2="41.5" y2="27" stroke="#F5D0FE" strokeWidth="1.3" />
        <line x1="32.5" y1="34" x2="22" y2="36.5" stroke="#E879F9" strokeWidth="0.9" opacity="0.8" />
        {/* Twin Phantom Eyes inside reflection */}
        <ellipse cx="28" cy="28.5" rx="2.1" ry="1.5" fill={resonated ? "#FEF08A" : "#E879F9"} />
        <ellipse cx="36" cy="28.5" rx="2.1" ry="1.5" fill={resonated ? "#FEF08A" : "#E879F9"} />
        {/* Suspended glass shards outside mirror */}
        <polygon points="10,27 13,24 12,30" fill="#E879F9" opacity="0.85" />
        <polygon points="54,27 51,24 52,30" fill="#E879F9" opacity="0.85" />
        <polygon points="12,42 15,40 13.5,45" fill="#C084FC" opacity="0.75" />
        <polygon points="52,42 49,40 50.5,45" fill="#C084FC" opacity="0.75" />
        {/* Crossed Shadow Daggers beneath frame */}
        <line x1="15" y1="54" x2="27" y2="42" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" />
        <line x1="49" y1="54" x2="37" y2="42" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // shared_altar (#ZERO-00)
  const borderCol = combined ? "#FACC15" : resonated ? "#F472B6" : "#64748B";
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <radialGradient id="vaultCrestGrad" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stopColor={combined ? "rgba(250,204,21,0.34)" : "rgba(244,114,182,0.2)"} />
          <stop offset="100%" stopColor="rgba(18,11,24,0)" />
        </radialGradient>
      </defs>
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
      <rect x="4" y="4" width="56" height="56" rx="8" fill="url(#vaultCrestGrad)" />
      <circle cx="32" cy="32" r="24" fill="none" stroke={borderCol} strokeWidth="1" strokeDasharray="5 4" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="rgba(250,204,21,0.32)" strokeWidth="0.9" />
      {/* Dual-helix Crimson (Tin) & Violet (Bao) Leylines */}
      <path d="M15 32 Q23 22 32 32 T49 32" fill="none" stroke="#FB7185" strokeWidth="1.6" opacity="0.9" />
      <path d="M15 32 Q23 42 32 32 T49 32" fill="none" stroke="#C084FC" strokeWidth="1.6" opacity="0.9" />
      <circle cx="13.5" cy="32" r="5" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1.3" />
      <circle cx="50.5" cy="32" r="5" fill="#9333EA" stroke="#E9D5FF" strokeWidth="1.3" />
      {/* 8-point Bloodshade Relic Star Crest */}
      <polygon
        points="32,12.5 35.8,26.8 49.5,32 35.8,37.2 32,51.5 28.2,37.2 14.5,32 28.2,26.8"
        fill={combined ? "#FEF08A" : "#334155"}
        stroke={combined ? "#F59E0B" : "#94A3B8"}
        strokeWidth="1.4"
      />
      <polygon points="32,23 35,32 32,41 29,32" fill={combined ? "#F59E0B" : "#475569"} opacity="0.7" />
      {/* Orbiting Relic Sparks */}
      <circle cx="32" cy="9" r="1.4" fill={combined ? "#FEF08A" : "#94A3B8"} />
      <circle cx="32" cy="55" r="1.4" fill={combined ? "#FEF08A" : "#94A3B8"} />
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
    <div className="pointer-events-auto flex flex-col rounded-xl bg-[#0D070F]/92 border border-rose-500/50 shadow-[0_8px_24px_rgba(0,0,0,0.75)] overflow-hidden backdrop-blur-sm">
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

          {/* Converging Crimson (Tin NE) & Violet (Bao SW) Leylines to Northern Vault */}
          <polyline
            points="1440,175 1120,175 800,185"
            fill="none"
            stroke={secrets.tinClue ? "rgba(251, 113, 133, 0.52)" : "rgba(190, 18, 60, 0.24)"}
            strokeWidth="12"
            strokeDasharray={secrets.tinClue ? undefined : "28 24"}
          />
          <polyline
            points="165,1215 165,420 460,185 800,185"
            fill="none"
            stroke={secrets.baoClue ? "rgba(216, 180, 254, 0.52)" : "rgba(147, 51, 234, 0.24)"}
            strokeWidth="12"
            strokeDasharray={secrets.baoClue ? undefined : "28 24"}
          />

          {/* Northern Vault floor */}
          <rect
            x={BLOOD_CITADEL_SECRET_VAULT_RECT.x}
            y={BLOOD_CITADEL_SECRET_VAULT_RECT.y}
            width={BLOOD_CITADEL_SECRET_VAULT_RECT.w}
            height={BLOOD_CITADEL_SECRET_VAULT_RECT.h}
            fill={secrets.combinedUnlocked ? "rgba(250, 204, 21, 0.2)" : "rgba(147, 51, 234, 0.18)"}
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
          <circle
            cx="800"
            cy="840"
            r="116"
            fill="none"
            stroke="rgba(245, 158, 11, 0.28)"
            strokeWidth="10"
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
              r="102"
              fill="none"
              stroke={compassTarget.color}
              strokeWidth="20"
              strokeDasharray="46 34"
            />
          )}

          {/* Interactable Lore Nodes & Subtle Corner Aura Halos */}
          {BLOOD_CITADEL_INTERACTABLES.map((node) => {
            if (node.id === "tin_lab") {
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="86"
                    fill={secrets.tinClue ? "rgba(251,113,133,0.16)" : "rgba(225,29,72,0.1)"}
                    stroke={secrets.tinClue ? "rgba(253,164,175,0.65)" : "rgba(244,63,94,0.35)"}
                    strokeWidth="10"
                  />
                  <polygon
                    points={`${node.x},${node.y - 54} ${node.x + 50},${node.y} ${node.x},${node.y + 54} ${node.x - 50},${node.y}`}
                    fill={secrets.tinClue ? "#FDA4AF" : "#F43F5E"}
                    stroke="#09050B"
                    strokeWidth="16"
                  />
                </g>
              );
            }
            if (node.id === "bao_mirror") {
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="86"
                    fill={secrets.baoClue ? "rgba(232,121,249,0.16)" : "rgba(147,51,234,0.1)"}
                    stroke={secrets.baoClue ? "rgba(240,171,252,0.65)" : "rgba(168,85,247,0.35)"}
                    strokeWidth="10"
                  />
                  <ellipse
                    cx={node.x}
                    cy={node.y}
                    rx="42"
                    ry="56"
                    fill={secrets.baoClue ? "#E879F9" : "#A855F7"}
                    stroke="#09050B"
                    strokeWidth="16"
                  />
                </g>
              );
            }
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="90"
                  fill={secrets.combinedUnlocked ? "rgba(250,204,21,0.18)" : "rgba(244,114,182,0.08)"}
                  stroke={secrets.combinedUnlocked ? "rgba(253,224,71,0.7)" : "rgba(244,114,182,0.35)"}
                  strokeWidth="10"
                />
                <polygon
                  points={`${node.x},${node.y - 60} ${node.x + 19},${node.y - 19} ${node.x + 60},${node.y} ${node.x + 19},${node.y + 19} ${node.x},${node.y + 60} ${node.x - 19},${node.y + 19} ${node.x - 60},${node.y} ${node.x - 19},${node.y - 19}`}
                  fill={secrets.combinedUnlocked ? "#FACC15" : "#F472B6"}
                  stroke="#09050B"
                  strokeWidth="14"
                />
              </g>
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
            #MT {secrets.tinClue ? "✓" : "○"}
          </span>
          <span className="text-slate-600">·</span>
          <span className={secrets.baoClue ? "text-purple-300 font-bold" : "text-slate-400"}>
            #BS {secrets.baoClue ? "✓" : "○"}
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
