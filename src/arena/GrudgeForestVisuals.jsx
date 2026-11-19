import React, { useEffect, useState } from "react";
import { R } from "./gameData";
import {
  GRUDGE_FOREST_WIDTH,
  GRUDGE_FOREST_HEIGHT,
  GRUDGE_FOREST_ZONES,
  GRUDGE_FOREST_INTERACTABLES,
  GRUDGE_FOREST_DOCS,
  GRUDGE_FOREST_TREE_CENTER,
  checkFourMapLinkReadiness,
  countGrudgeForestSecrets,
  normalizeGrudgeForestProgress,
} from "./grudgeForestMap";

export function GrudgeForestBlueprintEmblem({ className = "w-20 h-20" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="gfBg" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#065F46" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#140B29" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#030709" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="18" fill="url(#gfBg)" stroke="#10B981" strokeOpacity="0.6" strokeWidth="2" />
      <circle cx="60" cy="60" r="42" stroke="#A855F7" strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="5 3" />
      {/* Twisting ancient roots */}
      <path d="M60 70 C45 84, 34 94, 22 98" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 70 C75 84, 86 94, 98 98" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 68 C52 84, 48 96, 46 104" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M60 68 C68 84, 72 96, 74 104" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" />
      {/* Central Great Tree Silhouette */}
      <path d="M44 72 C40 52, 46 34, 60 24 C74 34, 80 52, 76 72 Z" fill="#091512" stroke="#6EE7B7" strokeWidth="1.8" />
      {/* Slumbering creature eyes inside trunk */}
      <ellipse cx="52" cy="52" rx="4.5" ry="2.2" transform="rotate(14 52 52)" fill="#C084FC" />
      <ellipse cx="68" cy="52" rx="4.5" ry="2.2" transform="rotate(-14 68 52)" fill="#C084FC" />
      {/* Floating fireflies */}
      <circle cx="30" cy="36" r="2.2" fill="#A3E635" />
      <circle cx="90" cy="34" r="2.2" fill="#E879F9" />
      <circle cx="84" cy="72" r="1.8" fill="#34D399" />
    </svg>
  );
}

export function GrudgeForestTacticalMinimap({
  hudSnapshot,
  heroId,
  lang = "vi",
  compact = false,
  isOpen = true,
  onToggle,
  onOpenJournal,
}) {
  const hud = hudSnapshot?.grudgeForestHud;
  const prog = normalizeGrudgeForestProgress(hudSnapshot?.grudgeForestProgress);
  const px = hud?.px ?? 460;
  const py = hud?.py ?? 3560;
  const docsCount = prog.collectedDocs.length;
  const docsTotal = Object.keys(GRUDGE_FOREST_DOCS).length;
  const secretCount = countGrudgeForestSecrets(prog);

  if (!isOpen) {
    return (
      <div className="pointer-events-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenJournal}
          className="px-2 py-1 rounded-md bg-slate-950/85 border border-emerald-400/55 text-emerald-200 text-[10px] font-moba font-bold hover:border-emerald-300 cursor-pointer whitespace-nowrap"
          title={lang === "en" ? "Grudge Forest Log" : "Nhật Ký Rừng Oán Niệm"}
        >
          🌿 {docsCount}/{docsTotal}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="px-2 py-1 rounded-md bg-slate-950/85 border border-purple-400/55 text-purple-200 text-[10px] font-moba font-bold hover:border-purple-300 cursor-pointer whitespace-nowrap"
        >
          🗺️ {hud?.zoneLabel || (lang === "en" ? "Grudge Forest" : "Rừng Oán Niệm")} ▼
        </button>
      </div>
    );
  }

  const w = compact ? 136 : 168;
  const h = compact ? 113 : 140;
  const sx = w / GRUDGE_FOREST_WIDTH;
  const sy = h / GRUDGE_FOREST_HEIGHT;

  return (
    <div className="pointer-events-auto rounded-xl bg-slate-950/88 border border-emerald-500/45 p-1.5 shadow-[0_8px_24px_rgba(3,7,18,0.75)] flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1 text-[9.5px] font-moba font-bold text-emerald-200 px-0.5">
        <span className="truncate max-w-[100px]">
          🌲 {hud?.zoneLabel || (lang === "en" ? "Grudge Forest" : "Rừng Oán Niệm")}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenJournal}
            className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-400/45 text-[9px] text-emerald-200 hover:text-white cursor-pointer"
            title={lang === "en" ? "Secrets & Notes" : "Bí Mật & Hồ Sơ"}
          >
            📜{secretCount}/6
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

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="rounded-lg bg-[#050C0A] border border-emerald-950/90 block">
        {GRUDGE_FOREST_ZONES.map((z) => (
          <rect
            key={z.id}
            x={z.x * sx}
            y={z.y * sy}
            width={z.w * sx}
            height={z.h * sy}
            fill={z.accentColor}
            fillOpacity={hud?.zoneId === z.id ? 0.22 : 0.07}
            stroke={z.accentColor}
            strokeOpacity={0.34}
            strokeWidth="0.7"
          />
        ))}
        {/* Mirror Lake oval */}
        <ellipse cx={2360 * sx} cy={600 * sy} rx={365 * sx} ry={198 * sy} fill="#0F172A" stroke="#A855F7" strokeOpacity="0.6" strokeWidth="0.8" />
        {/* Central Colossal Tree */}
        <circle cx={GRUDGE_FOREST_TREE_CENTER.x * sx} cy={GRUDGE_FOREST_TREE_CENTER.y * sy} r="4.5" fill="#10B981" stroke="#C084FC" strokeWidth="1" />
        {/* Key EE markers */}
        {GRUDGE_FOREST_INTERACTABLES.filter((n) =>
          ["ee1_secret_puppet_house", "ee2_mirror_lake_bank", "ee3_duy_tombstone", "ee4_valley_echo_shrine", "ee5_trung_hidden_room", "ee6_four_map_altar", "forest_heart_boss_altar"].includes(n.id)
        ).map((n) => {
          const isDuyTarget = heroId === "duy" && n.id === "ee1_secret_puppet_house";
          const col =
            n.kind === "ee1"
              ? "#F472B6"
              : n.kind === "ee2" || n.kind === "ee6"
              ? "#A855F7"
              : n.kind === "ee4"
              ? "#60A5FA"
              : n.kind === "ee5"
              ? "#FACC15"
              : "#34D399";
          return (
            <circle
              key={n.id}
              cx={n.x * sx}
              cy={n.y * sy}
              r={isDuyTarget ? 3.2 : 2.1}
              fill={col}
              fillOpacity="0.92"
            />
          );
        })}
        {/* Player Marker */}
        <circle cx={px * sx} cy={py * sy} r="3.6" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.4" />
      </svg>

      <div className="flex items-center justify-between text-[9px] font-mono-numbers text-slate-300 px-0.5">
        <span>EE: {secretCount}/6</span>
        <span className={hud?.inSilenceZone ? "text-purple-300 font-bold" : "text-emerald-300/80"}>
          {hud?.inSilenceZone
            ? lang === "en"
              ? "🔇 Silence"
              : "🔇 Lặng tiếng"
            : `${lang === "en" ? "Maze" : "Mê cung"} #${(hud?.mazePhase ?? 0) + 1}`}
        </span>
      </div>
    </div>
  );
}

export function GrudgeForestStoryModal({ payload, lang = "vi", onClose }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    setStepIdx(0);
    if (!payload) return;
    R.setNarrativeDuck?.(true);
    return () => R.setNarrativeDuck?.(false);
  }, [payload]);

  if (!payload) return null;
  const steps =
    Array.isArray(payload.steps) && payload.steps.length > 0
      ? payload.steps
      : [{ speaker: payload.title, speakerColor: "#34D399", text: (payload.paragraphs || []).join("\n") }];
  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const current = steps[safeIdx];
  const isLast = safeIdx >= steps.length - 1;

  const borderTheme =
    payload.themeVariant === "duy_puppet"
      ? "border-pink-400/75 from-[#230B1B] to-[#06060C]"
      : payload.themeVariant === "mirror_lake"
      ? "border-purple-400/75 from-[#180B2C] to-[#05060E]"
      : payload.themeVariant === "graveyard"
      ? "border-slate-400/70 from-[#111827] to-[#04070C]"
      : payload.themeVariant === "valley"
      ? "border-blue-400/70 from-[#0A192F] to-[#040812]"
      : payload.themeVariant === "trung_room" || payload.themeVariant === "four_maps"
      ? "border-amber-400/75 from-[#1B1308] via-[#120A22] to-[#04060A]"
      : "border-emerald-400/65 from-[#071D16] to-[#030709]";

  return (
    <div
      className="fixed inset-x-0 bottom-2 sm:bottom-3.5 flex justify-center px-2.5 sm:px-4 pointer-events-none"
      style={{ zIndex: 10075 }}
    >
      <div className={`pointer-events-auto w-full max-w-[430px] rounded-xl bg-gradient-to-b ${borderTheme} border p-2.5 sm:p-3 text-slate-100 shadow-[0_14px_40px_rgba(0,0,0,0.88)] backdrop-blur-md relative overflow-hidden`}>
        <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9.5px] font-mono-numbers font-bold uppercase tracking-wider text-emerald-300">
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
          {payload.showsFourMapMatrix && payload.fourMapStatus && (
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: "map1Ready", icon: "🩸", label: "M1" },
                { key: "map2Ready", icon: "🔥", label: "M2" },
                { key: "map3Ready", icon: "❄️", label: "M3" },
                { key: "map4Ready", icon: "🌿", label: "M4" },
              ].map((m) => {
                const ok = Boolean(payload.fourMapStatus[m.key]);
                return (
                  <div
                    key={m.key}
                    className={`rounded-md border px-1.5 py-1 text-center text-[10px] font-bold ${
                      ok
                        ? "bg-emerald-950/55 border-emerald-400/70 text-emerald-100"
                        : "bg-slate-950/75 border-slate-800 text-slate-500"
                    }`}
                  >
                    {m.icon} {m.label} {ok ? "✓" : "○"}
                  </div>
                );
              })}
            </div>
          )}

          {payload.mirrorVisionTag && (
            <div className="rounded-lg bg-[#070512] border border-purple-400/45 px-2.5 py-1.5 text-[11px] text-purple-200">
              {payload.mirrorVisionTag === "map1"
                ? lang === "en"
                  ? "Mirror Refraction: Crimson Blood Citadel ruins pierced by black tree roots."
                  : "Ảo Ảnh Mặt Hồ: Cổ Thành Huyết Táng nhuốm rễ cây đen xuyên thủng sảnh đá."
                : lang === "en"
                ? "Mirror Refraction: Inferno of Ashes overtaken by glowing emerald roots."
                : "Ảo Ảnh Mặt Hồ: Hỏa Ngục Tàn Tro bị rễ cây phát sáng phủ kín thay vì tro bụi."}
            </div>
          )}

          <div className="rounded-lg bg-slate-950/85 border border-slate-800/90 px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-moba font-extrabold">
              <span className="truncate" style={{ color: current.speakerColor || "#34D399" }}>{current.speaker}</span>
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

export function GrudgeForestJournalModal({
  open,
  progress,
  citadelSecrets,
  infernoProgress,
  frozenTombProgress,
  lang = "vi",
  onClose,
}) {
  if (!open) return null;
  const prog = normalizeGrudgeForestProgress(progress);
  const matrix = checkFourMapLinkReadiness({
    citadelSecrets,
    infernoProgress,
    frozenTombProgress,
    grudgeProgress: prog,
  });
  const allDocs = Object.values(GRUDGE_FOREST_DOCS);
  const secretCount = countGrudgeForestSecrets(prog);

  return (
    <div className="modal-backdrop" style={{ zIndex: 10070 }}>
      <div className="modal-box max-w-[760px] max-h-[86vh] flex flex-col border-emerald-500/60 bg-gradient-to-b from-[#071D16] to-[#04080C]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] font-mono-numbers font-bold uppercase tracking-wider text-emerald-300">
              RỪNG OÁN NIỆM · {secretCount}/6 BÍ MẬT · {prog.collectedDocs.length}/{allDocs.length} GHI CHÉP
            </div>
            <h3 className="font-moba text-lg font-black text-white">
              {lang === "en" ? "Grudge Forest Exploration Log" : "Nhật Ký Khám Phá Rừng Oán Niệm"}
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
          {/* 6 Easter Eggs Tracker */}
          <div className="rounded-xl bg-slate-900/90 border border-emerald-500/40 p-3 space-y-2">
            <div className="font-moba text-sm font-black text-emerald-300">
              {lang === "en" ? "6 Forest Mysteries & 4-Map Convergence" : "6 Sự Kiện Bí Ẩn & Liên Kết 4 Bản Đồ"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border ${prog.ee1SecretHouseSeen ? "bg-pink-950/45 border-pink-400/60 text-pink-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE1 · Những Con Rối Không Nghe Lời</div>
                <div className="text-[11px] mt-0.5">
                  {prog.ee1SecretHouseSeen
                    ? "✓ Đã theo con rối vào Căn Nhà Bí Mật"
                    : "○ Chơi Duy, đứng yên gần rối rồi đi theo nó"}
                </div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.ee2MirrorLakeSeen ? "bg-purple-950/45 border-purple-400/60 text-purple-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE2 · Hồ Nước Phản Chiếu</div>
                <div className="text-[11px] mt-0.5">
                  {prog.ee2MirrorLakeSeen
                    ? "✓ Đã chạm mặt hồ lúc bóng sau lưng xuất hiện"
                    : "○ Tương tác Hồ Gương (Zone 3) khi vòng tím gợn sáng"}
                </div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.ee3DuyLaughHeard || prog.ee3MaThachStoneSeen ? "bg-slate-800/75 border-slate-400/60 text-slate-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE3 · Những Bia Mộ Không Người Chết</div>
                <div className="text-[11px] mt-0.5">
                  Bia Duy {prog.ee3DuyLaughHeard ? "✓" : "○"} · Bia Ma Thạch {prog.ee3MaThachStoneSeen ? "✓" : "○"}
                </div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.ee4ValleyCallSeen ? "bg-blue-950/45 border-blue-400/60 text-blue-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE4 · Tiếng Gọi Trong Rừng</div>
                <div className="text-[11px] mt-0.5">
                  {prog.ee4ValleyCallSeen
                    ? "✓ Đã tiến lại bóng người trong Thung Lũng"
                    : "○ Đi một mình qua Thung Lũng Tiếng Gọi (Zone 7)"}
                </div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.ee5TrungRoomSeen ? "bg-amber-950/45 border-amber-400/60 text-amber-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE5 · Căn Phòng Của Trung</div>
                <div className="text-[11px] mt-0.5">
                  {prog.ee5TrungRoomSeen
                    ? "✓ Đã đọc bức thư dang dở & bản đồ 4 vùng"
                    : prog.ee5TrungRoomUnlocked
                    ? "★ Cửa rễ đã mở ở Đông Hồ Gương! Hãy vào đọc thư"
                    : "○ Kích hoạt EE2 (Hồ) + EE3 (Nghĩa Địa) để mở cửa"}
                </div>
              </div>
              <div className={`p-2 rounded-lg border ${prog.ee6FourMapSecretSeen ? "bg-emerald-950/55 border-emerald-400/70 text-emerald-100" : "bg-slate-950/70 border-slate-800 text-slate-400"}`}>
                <div className="font-bold">EE6 · Bí Mật Liên Kết 4 Bản Đồ</div>
                <div className="text-[11px] mt-0.5 font-mono-numbers">
                  M1 {matrix.map1Ready ? "✓" : "○"} · M2 {matrix.map2Ready ? "✓" : "○"} · M3 {matrix.map3Ready ? "✓" : "○"} · M4 {matrix.map4Ready ? "✓" : "○"}
                </div>
              </div>
            </div>
          </div>

          {/* Collected Logs */}
          <div className="space-y-2">
            {allDocs.map((doc) => {
              const found = prog.collectedDocs.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`rounded-xl p-3 border ${found ? "bg-slate-900/95 border-slate-700 text-slate-200" : "bg-slate-950/55 border-slate-900 text-slate-500"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-moba font-bold text-xs text-emerald-200">
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
