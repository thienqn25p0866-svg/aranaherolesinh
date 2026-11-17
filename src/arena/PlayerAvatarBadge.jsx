import React, { useState } from "react";
import { AVATAR_CRESTS, AVATAR_FRAMES } from "./playerAccount.ts";
import { SKILL_ICON_DATA_URLS } from "./skillIcons.js";
import HeroPreviewCanvas from "./HeroPreviewCanvas.jsx";

export function CrestSvg({ crestId, size = 32 }) {
  const crest = AVATAR_CRESTS.find((c) => c.id === crestId) || AVATAR_CRESTS[0];
  const p = crest.primary;
  const s = crest.secondary;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="block">
      <defs>
        <radialGradient id={`crest-bg-${crest.id}`} cx="50%" cy="35%" r="68%">
          <stop offset="0%" stopColor={p} stopOpacity="0.34" />
          <stop offset="100%" stopColor={s} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#crest-bg-${crest.id})`} stroke={p} strokeWidth="1.4" />
      {crest.id === "shield_gold" && (
        <path d="M20 7 L31 12 V20 C31 27 26 32 20 34 C14 32 9 27 9 20 V12 Z" fill="none" stroke={p} strokeWidth="2.4" />
      )}
      {crest.id === "twin_blades" && (
        <g stroke={p} strokeWidth="2.4" strokeLinecap="round">
          <line x1="11" y1="29" x2="28" y2="10" />
          <line x1="29" y1="29" x2="12" y2="10" />
          <circle cx="20" cy="20" r="3.2" fill={p} />
        </g>
      )}
      {crest.id === "arcane_orb" && (
        <g>
          <circle cx="20" cy="20" r="7" fill={p} fillOpacity="0.35" stroke={p} strokeWidth="2" />
          <ellipse cx="20" cy="20" rx="13" ry="5" fill="none" stroke="#E9D5FF" strokeWidth="1.5" transform="rotate(-24 20 20)" />
        </g>
      )}
      {crest.id === "dragon_flame" && (
        <path
          d="M20 7 C24 13, 29 17, 27 24 C25 29, 22 32, 20 33 C17 31, 13 28, 13 22 C13 17, 17 14, 20 7 Z"
          fill={p}
          fillOpacity="0.45"
          stroke="#FED7AA"
          strokeWidth="1.8"
        />
      )}
      {crest.id === "frost_star" && (
        <g stroke={p} strokeWidth="2" strokeLinecap="round">
          <line x1="20" y1="7" x2="20" y2="33" />
          <line x1="8" y1="14" x2="32" y2="26" />
          <line x1="32" y1="14" x2="8" y2="26" />
          <circle cx="20" cy="20" r="4" fill="#CFFAFE" />
        </g>
      )}
      {crest.id === "shadow_mask" && (
        <g>
          <path d="M10 15 Q20 9 30 15 L27 29 Q20 33 13 29 Z" fill="#1E1B4B" stroke={p} strokeWidth="2" />
          <path d="M14 19 L18 21 L14 22 Z M26 19 L22 21 L26 22 Z" fill="#E9D5FF" />
        </g>
      )}
      {crest.id === "mech_core" && (
        <g stroke={p} strokeWidth="2" fill="none">
          <polygon points="20,7 31,13 31,27 20,33 9,27 9,13" />
          <circle cx="20" cy="20" r="5" fill={p} fillOpacity="0.55" />
        </g>
      )}
      {crest.id === "celestial_sun" && (
        <g>
          <circle cx="20" cy="20" r="6.5" fill="#FEF08A" stroke="#FACC15" strokeWidth="2" />
          <circle cx="20" cy="20" r="12.5" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
      )}
    </svg>
  );
}

export default function PlayerAvatarBadge({
  avatarType = "hero",
  avatarValue = "eohyen",
  avatarFrame = "bronze_recruit",
  displayName = "Chiến Binh",
  heroes = [],
  size = 44,
  animated = false,
  className = "",
}) {
  const [imgError, setImgError] = useState(false);
  const frame = AVATAR_FRAMES.find((f) => f.id === avatarFrame) || AVATAR_FRAMES[0];
  const matchedHero = heroes.find((h) => h.id === avatarValue) || heroes[0];
  const heroKey = matchedHero ? `${matchedHero.id}_${matchedHero.skills?.length >= 4 ? "c4" : "c3"}` : "";
  const heroIconSrc = (heroKey && SKILL_ICON_DATA_URLS[heroKey]) || "";
  const isGoogle = avatarType === "google" && avatarValue && !imgError;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 p-[2px] ${className}`}
      style={{
        width: size,
        height: size,
        background: frame.gradient,
        boxShadow: `0 0 14px ${frame.glow}`,
      }}
      title={displayName}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-[#080F20] flex items-center justify-center relative">
        {isGoogle ? (
          <img
            src={avatarValue}
            alt={displayName}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : avatarType === "hero" && matchedHero ? (
          animated ? (
            <HeroPreviewCanvas hero={matchedHero} compact interactive={false} />
          ) : heroIconSrc ? (
            <img
              src={heroIconSrc}
              alt={matchedHero.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <CrestSvg crestId="shield_gold" size={size - 4} />
          )
        ) : (
          <CrestSvg crestId={avatarType === "crest" ? avatarValue : "shield_gold"} size={size - 4} />
        )}
      </div>
    </div>
  );
}
