import React from "react";

export function MultiplayerLobbyModal({
  lang = "vi",
  heroes = [],
  selectedHero,
  room,
  playerId,
  playerName,
  joinCode,
  busy,
  error,
  copied,
  SkillIcon,
  onChangeName,
  onChangeJoinCode,
  onCreateRoom,
  onJoinRoom,
  onCopyRoomId,
  onSelectHero,
  onToggleReady,
  onStartMatch,
  onLeaveRoom,
  onClose,
  onRetryConnect,
  envInfo,
  p2pInviteCode,
  p2pManualOfferCode,
  p2pHasServerSignal,
  p2pAnswerCode,
  p2pAutoPaired,
  p2pIncomingOffer,
  p2pIncomingAnswer,
  p2pBusy,
  customServerUrl,
  onChangeCustomServerUrl,
  onApplyCustomServerUrl,
  onStartP2PHost,
  onCreateP2PInvite,
  onAcceptP2PAnswer,
  onChangeP2PIncomingOffer,
  onChangeP2PIncomingAnswer,
  onJoinP2POffer,
  onCopyText,
  lanUrls = [],
}) {
  const [showManualP2P, setShowManualP2P] = React.useState(false);
  const isVi = lang === "vi";
  const members = room?.members || [];
  const myMember = members.find((m) => m.id === playerId) || null;
  const isHost = Boolean(room && room.hostId === playerId);
  const notReadyMembers = members.filter((m) => !m.isHost && (m.joinedRoom === false || !m.ready));
  const canHostStart = isHost && members.length >= 1 && notReadyMembers.length === 0;
  const powerPct = Math.round((room?.powerMultiplier || 1) * 100);
  const isP2PRoom = Boolean(room?.isP2P);
  const displayShareCode = room?.roomId || p2pInviteCode || "";

  return (
    <div
      className="modal-backdrop p-2 sm:p-4"
      style={{ zIndex: 90 }}
      role="dialog"
      aria-modal="true"
      aria-label="Chế độ Chơi Nhiều Người"
    >
      <div className="moba-shop-shell w-full max-w-[920px] max-h-[94dvh] rounded-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <header className="moba-shop-header px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C89B3C]/20 border border-[#C89B3C]/70 flex items-center justify-center text-base sm:text-lg shrink-0">
              🌐
            </div>
            <div className="min-w-0">
              <h2 className="font-title text-sm sm:text-base font-black text-[#FDE68A] tracking-wide truncate">
                {isVi ? "CHƠI NHIỀU NGƯỜI (CO-OP)" : "MULTIPLAYER CO-OP"}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {room
                  ? isVi
                    ? `Phòng ${room.roomId} · Tối đa 4 người · Sức mạnh quái ${powerPct}%`
                    : `Room ${room.roomId} · Up to 4 players · Monster Power ${powerPct}%`
                  : isVi
                  ? "Tạo phòng, nhập ID phòng hoặc kết nối P2P trực tiếp với bạn bè (tối đa 4 người)"
                  : "Create/Join a room or connect directly via P2P with friends (up to 4 players)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] px-3 rounded-xl bg-[#1A1423] hover:bg-rose-950/90 border border-[#C89B3C]/50 hover:border-rose-400/80 text-xs font-moba font-extrabold text-slate-100 shrink-0"
          >
            ✕ {isVi ? "ĐÓNG" : "CLOSE"}
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 moba-shop-scroll space-y-3">
          {error && (
            <div className="rounded-xl bg-rose-950/75 border border-rose-500/70 px-3 py-2.5 text-xs text-rose-100 font-semibold flex flex-wrap items-center justify-between gap-2">
              <span className="flex-1 min-w-[200px]">⚠️ {error}</span>
              {onRetryConnect && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRetryConnect}
                  className="min-h-[34px] px-3 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 border border-rose-300/60 text-[11px] font-moba font-extrabold text-white shrink-0 disabled:opacity-50"
                >
                  🔄 {isVi ? "THỬ KẾT NỐI LẠI" : "RETRY CONNECTION"}
                </button>
              )}
            </div>
          )}

          {(envInfo?.isFileProtocol || envInfo?.isInAppBrowser) && !room && (
            <div className="rounded-xl bg-amber-950/55 border border-amber-400/50 px-3 py-2 text-[11px] text-amber-100 leading-relaxed">
              💡{" "}
              {envInfo.isFileProtocol
                ? isVi
                  ? "Bạn đang mở file HTML tải về máy. Bấm '➕ TẠO PHÒNG NGAY' sẽ tự động mở phòng P2P Trực Tiếp để chơi Co-op cùng bạn bè mà không cần máy chủ!"
                  : "You opened a downloaded HTML file. Clicking 'Create Room' will automatically start a Direct P2P Room without needing a server!"
                : isVi
                ? "Bạn đang mở trong trình duyệt Zalo/Messenger. Nếu tạo phòng gặp lỗi kết nối, hãy bấm nút ⋯ ở góc trên và chọn 'Mở bằng trình duyệt' (Safari/Chrome)."
                : "Inside Zalo/Messenger browser: if connection fails, tap ⋯ and choose 'Open in Safari/Chrome'."}
            </div>
          )}

          {!room ? (
            <div className="space-y-3">
              {/* Nickname input + Selected hero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#091326] border border-[#C89B3C]/35 p-3">
                  <label className="block text-[11px] font-moba font-bold uppercase tracking-wider text-[#E5C16C] mb-1.5">
                    {isVi ? "Tên hiển thị của bạn" : "Your Display Name"}
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={playerName}
                    onChange={(e) => onChangeName(e.target.value)}
                    placeholder={isVi ? "Nhập tên chiến binh..." : "Enter warrior name..."}
                    className="w-full rounded-lg bg-[#050A16] border border-slate-700 focus:border-[#FBBF24] px-3 py-2 text-xs sm:text-sm text-white outline-none"
                  />
                </div>

                <div className="rounded-xl bg-[#091326] border border-[#C89B3C]/35 p-3 flex items-center gap-3">
                  {SkillIcon && selectedHero && (
                    <SkillIcon
                      heroId={selectedHero.id}
                      skillId="c3"
                      size={44}
                      roundedClass="rounded-xl"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-moba font-bold uppercase tracking-wider text-[#E5C16C]">
                      {isVi ? "Tướng mặc định" : "Selected Hero"}
                    </div>
                    <div className="text-sm font-moba font-extrabold text-white truncate">
                      {selectedHero?.name}
                    </div>
                    <div className="text-[11px] text-cyan-300 truncate">
                      {selectedHero?.role?.[lang] || selectedHero?.role?.vi}
                    </div>
                  </div>
                </div>
              </div>

              {p2pAnswerCode && (
                <div className="rounded-2xl bg-sky-950/80 border-2 border-sky-400/80 p-3.5 space-y-2 shadow-lg shadow-sky-950/60">
                  {p2pAutoPaired ? (
                    <>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs font-moba font-extrabold text-sky-200">
                          ⏳ {isVi ? "Đang tự động ghép đôi bằng mã 6 số..." : "Auto-pairing with 6-digit code..."}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowManualP2P((v) => !v)}
                          className="text-[11px] font-moba font-bold text-cyan-300 underline"
                        >
                          {showManualP2P ? (isVi ? "Ẩn mã thủ công" : "Hide manual") : (isVi ? "Mã thủ công (nếu kẹt)" : "Manual code")}
                        </button>
                      </div>
                      <div className="text-[11px] text-amber-200 leading-relaxed">
                        {isVi
                          ? "Đã tìm thấy phòng của Chủ phòng và gửi tín hiệu kết nối. Chờ 1–3 giây sẽ tự động vào phòng!"
                          : "Found Host room and sent handshake. Entering lobby shortly!"}
                      </div>
                      {showManualP2P && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            readOnly
                            value={p2pAnswerCode}
                            className="flex-1 min-w-0 rounded-lg bg-[#030710] border border-sky-500/50 px-3 py-1.5 text-center font-mono-numbers text-xs font-bold text-sky-100"
                          />
                          <button
                            type="button"
                            onClick={() => onCopyText?.(p2pAnswerCode, isVi ? "Đã sao chép Mã Phản Hồi!" : "Reply Code copied!")}
                            className="min-h-[34px] px-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-moba text-[11px] font-black shrink-0"
                          >
                            📋 {isVi ? "SAO CHÉP" : "COPY"}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-moba font-extrabold text-sky-200">
                        ✓{" "}
                        {isVi
                          ? "Chế độ Offline hoàn toàn: Gửi Mã Phản Hồi dưới đây lại cho Chủ Phòng:"
                          : "Offline Manual Mode: Copy & send Reply Code back to Host:"}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={p2pAnswerCode}
                          className="flex-1 min-w-0 rounded-lg bg-[#030710] border border-sky-500/50 px-3 py-2 text-center font-mono-numbers text-xs font-bold text-sky-100"
                        />
                        <button
                          type="button"
                          onClick={() => onCopyText?.(p2pAnswerCode, isVi ? "Đã sao chép Mã Phản Hồi!" : "Reply Code copied!")}
                          className="min-h-[38px] px-3.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-moba text-xs font-black shrink-0"
                        >
                          📋 {isVi ? "SAO CHÉP" : "COPY"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Two Options: CREATE ROOM & JOIN ROOM (6-Digit Unified) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* CREATE ROOM */}
                <div className="rounded-2xl bg-gradient-to-br from-[#10203F] to-[#081022] border border-[#C89B3C]/55 p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-[11px] font-moba font-bold text-amber-300">
                      👑 {isVi ? "LỰA CHỌN 1 · MÃ 6 SỐ NGẪU NHIÊN" : "OPTION 1 · 6-DIGIT ROOM"}
                    </div>
                    <h3 className="font-moba text-lg font-black text-white mt-2">
                      {isVi ? "TẠO PHÒNG CO-OP" : "CREATE CO-OP ROOM"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {isVi
                        ? "Sinh mã 6 số ngẫu nhiên. Hai máy dùng chung WiFi, khác mạng hay mở từ file .html đều ghép chỉ bằng 6 số này."
                        : "Generates a random 6-digit code. Works across same WiFi, remote Internet, or downloaded HTML files."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={busy || p2pBusy}
                      onClick={onCreateRoom}
                      className="w-full min-h-[44px] moba-bronze-btn rounded-xl font-moba text-sm font-black tracking-wide disabled:opacity-60"
                    >
                      {busy
                        ? isVi
                          ? "ĐANG TẠO PHÒNG..."
                          : "CREATING ROOM..."
                        : isVi
                        ? "➕ TẠO PHÒNG 6 SỐ NGAY"
                        : "➕ CREATE 6-DIGIT ROOM"}
                    </button>
                    <button
                      type="button"
                      disabled={p2pBusy || busy}
                      onClick={onStartP2PHost}
                      className="w-full min-h-[36px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 font-moba text-xs font-extrabold tracking-wide disabled:opacity-60"
                    >
                      {p2pBusy
                        ? isVi
                          ? "ĐANG KHỞI TẠO P2P 6 SỐ..."
                          : "STARTING P2P..."
                        : isVi
                        ? "⚡ TẠO PHÒNG P2P TRỰC TIẾP (6 SỐ)"
                        : "⚡ CREATE DIRECT P2P (6-DIGIT)"}
                    </button>
                  </div>
                </div>

                {/* JOIN ROOM */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onJoinRoom();
                  }}
                  className="rounded-2xl bg-gradient-to-br from-[#0B1B36] to-[#070E1E] border border-cyan-500/45 p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/40 text-[11px] font-moba font-bold text-cyan-300">
                      🔎 {isVi ? "LỰA CHỌN 2 · NHẬP ĐÚNG 6 SỐ" : "OPTION 2 · ENTER 6 DIGITS"}
                    </div>
                    <h3 className="font-moba text-lg font-black text-white mt-2">
                      {isVi ? "VÀO PHÒNG BẰNG MÃ 6 SỐ" : "JOIN BY 6-DIGIT CODE"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {isVi
                        ? "Nhập mã 6 chữ số từ Chủ phòng (tự động nhận cả phòng Server & phòng P2P qua WiFi/Internet)."
                        : "Enter the 6-digit code from Host (auto-detects Server & Direct P2P rooms)."}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={joinCode}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onChangeJoinCode(/^ah1/i.test(raw.trim()) ? raw : raw.toUpperCase());
                      }}
                      placeholder={isVi ? "Nhập 6 số · VD: 482915" : "e.g. 482915"}
                      className="mt-2.5 w-full rounded-xl bg-[#050A16] border border-cyan-500/50 focus:border-cyan-300 px-3 py-2.5 text-center font-mono-numbers text-base sm:text-lg font-black tracking-[0.22em] text-cyan-200 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || p2pBusy || !joinCode.trim()}
                    className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:brightness-110 text-slate-950 font-moba text-sm font-black tracking-wide disabled:opacity-50"
                  >
                    {busy || p2pBusy
                      ? isVi
                        ? "ĐANG TÌM PHÒNG 6 SỐ..."
                        : "FINDING ROOM..."
                      : isVi
                      ? "🚪 THAM GIA PHÒNG"
                      : "🚪 JOIN ROOM"}
                  </button>
                </form>
              </div>

              {/* Collapsed Offline/Manual Fallback */}
              <div className="rounded-xl bg-[#081122] border border-slate-700/70 px-3.5 py-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-300">
                    📶{" "}
                    {isVi
                      ? "Hai máy chỉ cần nhập mã 6 số ở trên. Chỉ mở mục bên cạnh nếu mất Internet hoàn toàn:"
                      : "6-digit codes work automatically over WiFi/Internet. Expand only for offline manual pairing:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualP2P((v) => !v)}
                    className="min-h-[28px] px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-moba font-bold text-slate-200 shrink-0"
                  >
                    🔧 {showManualP2P ? (isVi ? "Ẩn nâng cao" : "Hide Advanced") : (isVi ? "Nâng cao / Offline" : "Advanced / Offline")}
                  </button>
                </div>

                {showManualP2P && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={p2pIncomingOffer || ""}
                        onChange={(e) => onChangeP2PIncomingOffer?.(e.target.value)}
                        placeholder={isVi ? "Dán mã AH1... (khi mất mạng hoàn toàn)" : "Paste AH1... (offline only)"}
                        className="flex-1 min-w-0 rounded-lg bg-[#040812] border border-sky-500/45 focus:border-sky-300 px-2.5 py-1.5 text-xs font-mono-numbers text-sky-200 outline-none"
                      />
                      <button
                        type="button"
                        disabled={p2pBusy || !(p2pIncomingOffer || "").trim()}
                        onClick={onJoinP2POffer}
                        className="min-h-[34px] px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-moba text-xs font-black shrink-0 disabled:opacity-50"
                      >
                        {isVi ? "GHÉP THỦ CÔNG" : "MANUAL JOIN"}
                      </button>
                    </div>
                    {onApplyCustomServerUrl && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {isVi ? "Link máy chủ WiFi (tuỳ chọn):" : "Custom server URL:"}
                        </span>
                        <input
                          type="url"
                          value={customServerUrl || ""}
                          onChange={(e) => onChangeCustomServerUrl?.(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 min-w-[160px] rounded-lg bg-[#050A16] border border-slate-700 focus:border-amber-400 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={onApplyCustomServerUrl}
                          className="min-h-[30px] px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-moba font-bold text-amber-300"
                        >
                          {isVi ? "KẾT NỐI" : "CONNECT"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Power scaling info */}
              <div className="rounded-xl bg-[#070E1F] border border-[#C89B3C]/25 px-3.5 py-2.5 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  ⚔️{" "}
                  <strong className="text-[#FDE68A]">
                    {isVi ? "Cơ chế Co-op:" : "Co-op Scaling:"}
                  </strong>{" "}
                  {isVi
                    ? "Máu & Sát thương Quái/Boss tăng theo công thức 1 + 0.5 × (Số người - 1)"
                    : "Monster & Boss HP/Damage scales by 1 + 0.5 × (Players - 1)"}
                </span>
                <span className="font-mono-numbers text-amber-300 font-bold">
                  1P: 100% · 2P: 150% · 3P: 200% · 4P: 250%
                </span>
              </div>
            </div>
          ) : (
            /* IN-ROOM LOBBY */
            <div className="space-y-3">
              {/* Room ID & Power Scaling Banner */}
              <div className="rounded-xl bg-[#091326] border border-[#C89B3C]/50 p-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div>
                    <div className="text-[10px] font-moba font-bold uppercase tracking-wider text-slate-400">
                      {isP2PRoom ? (isVi ? "MÃ CHIA SẺ PHÒNG P2P" : "P2P SHARE CODE") : isVi ? "MÃ ID PHÒNG" : "ROOM ID"}
                    </div>
                    <div className="font-mono-numbers text-xl sm:text-2xl font-black tracking-[0.2em] text-[#FDE68A]">
                      {displayShareCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCopyRoomId}
                    className={`min-h-[38px] px-3 rounded-xl border text-xs font-moba font-extrabold transition-colors ${
                      copied
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                        : "bg-[#11203D] hover:bg-[#192E56] border-[#C89B3C]/60 text-[#FDE68A]"
                    }`}
                  >
                    {copied
                      ? isVi
                        ? "✓ ĐÃ SAO CHÉP"
                        : "✓ COPIED"
                      : isVi
                      ? "📋 SAO CHÉP MÃ"
                      : "📋 COPY CODE"}
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/12 border border-amber-500/40 text-xs font-mono-numbers">
                    <span className="text-slate-300">
                      {isVi ? "Sức mạnh quái:" : "Enemy Power:"}{" "}
                    </span>
                    <strong className="text-amber-300">{powerPct}%</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-cyan-500/12 border border-cyan-500/40 text-xs font-mono-numbers">
                    <span className="text-slate-300">
                      {isVi ? "Thành viên:" : "Players:"}{" "}
                    </span>
                    <strong className="text-cyan-300">{members.length} / 4</strong>
                  </div>
                </div>
              </div>

              {isP2PRoom && isHost && members.length < 4 && (
                <div className="rounded-xl bg-emerald-950/35 border border-emerald-500/50 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-moba font-bold text-emerald-300">
                      🔗{" "}
                      {p2pHasServerSignal
                        ? isVi
                          ? "P2P MÃ 6 SỐ TỰ ĐỘNG GHÉP ĐÔI (GỬI MÃ CHO BẠN BÈ)"
                          : "6-DIGIT AUTO-PAIR P2P (SEND CODE TO FRIENDS)"
                        : isVi
                        ? "P2P MÃ 6 SỐ CÙNG TRÌNH DUYỆT / GHÉP THỦ CÔNG OFFLINE"
                        : "P2P 6-DIGIT ROOM"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowManualP2P((v) => !v)}
                        className="min-h-[30px] px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-[11px] font-moba font-bold text-slate-200"
                      >
                        🔧 {showManualP2P ? (isVi ? "Ẩn thủ công" : "Hide Manual") : (isVi ? "Chế độ thủ công" : "Manual Fallback")}
                      </button>
                      <button
                        type="button"
                        disabled={p2pBusy}
                        onClick={onCreateP2PInvite}
                        className="min-h-[30px] px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-[11px] font-moba font-bold text-emerald-200"
                      >
                        🔄 {isVi ? "Làm mới" : "Refresh"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 rounded-lg bg-[#050A16] border border-emerald-500/40 px-3 py-1.5 text-center text-lg sm:text-xl font-black tracking-[0.28em] font-mono-numbers text-emerald-200">
                      {displayShareCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopyText?.(displayShareCode, isVi ? "Đã sao chép mã 6 số!" : "6-digit code copied!")}
                      className="min-h-[38px] px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-moba text-xs font-black shrink-0"
                    >
                      📋 {isVi ? "SAO CHÉP 6 SỐ" : "COPY 6-DIGIT"}
                    </button>
                  </div>
                  {Array.isArray(lanUrls) && lanUrls.length > 0 && (
                    <div className="rounded-lg bg-[#050A16]/90 border border-cyan-500/35 px-2.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="min-w-0 flex-1">
                        <span className="text-cyan-300 font-bold">📶 {isVi ? "Link cùng WiFi:" : "Same-WiFi URL:"}</span>{" "}
                        <span className="font-mono-numbers text-slate-200 break-all">{lanUrls[0]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopyText?.(lanUrls[0], isVi ? "Đã sao chép link WiFi!" : "WiFi link copied!")}
                        className="min-h-[28px] px-2.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-[11px] font-moba font-bold text-cyan-200 shrink-0"
                      >
                        📋 {isVi ? "Copy Link WiFi" : "Copy WiFi URL"}
                      </button>
                    </div>
                  )}

                  <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                    {p2pHasServerSignal
                      ? isVi
                        ? "✓ Bạn bè chỉ cần nhập đúng 6 số ở trên rồi bấm Tham Gia — hệ thống sẽ tự động ghép đôi không cần sao chép mã dài!"
                        : "✓ Friends just enter this 6-digit code to auto-pair — no long strings needed!"
                      : isVi
                      ? "💡 Mở cùng link WiFi/Web trên máy bạn bè để tự động ghép bằng 6 số, hoặc bấm 'Chế độ thủ công' nếu dùng 2 file HTML offline khác mạng."
                      : "💡 Use the same WiFi/Web URL for 6-digit auto-pair, or open Manual Fallback when offline across devices."}
                  </div>

                  {showManualP2P && (
                    <div className="pt-2 border-t border-emerald-500/30 space-y-2">
                      {p2pManualOfferCode && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={p2pManualOfferCode}
                            className="flex-1 min-w-0 rounded-lg bg-[#040812] border border-slate-700 px-2.5 py-1.5 text-[11px] font-mono-numbers text-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => onCopyText?.(p2pManualOfferCode, isVi ? "Đã sao chép Mã Mời Offline!" : "Manual Offer copied!")}
                            className="min-h-[32px] px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-moba text-[11px] font-bold shrink-0"
                          >
                            📋 {isVi ? "Copy AH1..." : "Copy AH1..."}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={p2pIncomingAnswer || ""}
                          onChange={(e) => onChangeP2PIncomingAnswer?.(e.target.value)}
                          placeholder={isVi ? "Dán Mã Phản Hồi (nếu ghép thủ công)..." : "Paste Reply Code (manual fallback)..."}
                          className="flex-1 min-w-0 rounded-lg bg-[#050A16] border border-cyan-500/45 focus:border-cyan-300 px-2.5 py-1.5 text-xs font-mono-numbers text-cyan-100 outline-none"
                        />
                        <button
                          type="button"
                          disabled={p2pBusy || !(p2pIncomingAnswer || "").trim()}
                          onClick={onAcceptP2PAnswer}
                          className="min-h-[34px] px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-moba text-[11px] font-black shrink-0 disabled:opacity-50"
                        >
                          ✓ {isVi ? "GHÉP ĐÔI" : "CONNECT PEER"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2-Column Lobby: Left = 4 Member Slots, Right = Quick Hero Picker */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Member List (4 slots) */}
                <div className="md:col-span-6 space-y-2">
                  <div className="text-[11px] font-moba font-bold uppercase tracking-wider text-[#E5C16C]">
                    {isVi ? "DANH SÁCH THÀNH VIÊN (TỐI ĐA 4)" : "SQUAD MEMBERS (MAX 4)"}
                  </div>
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const m = members.find((mem) => mem.slot === slotIdx) || members[slotIdx];
                      if (!m) {
                        return (
                          <div
                            key={`empty_${slotIdx}`}
                            className="rounded-xl bg-[#050A16]/80 border border-dashed border-slate-700/80 px-3 py-2.5 flex items-center justify-between text-xs text-slate-500"
                          >
                            <span>
                              #{slotIdx + 1} · {isVi ? "Vị trí trống — Đang chờ đồng đội..." : "Empty Slot — Waiting for player..."}
                            </span>
                            <span className="text-[10px] font-mono-numbers">ID: {room.roomId}</span>
                          </div>
                        );
                      }
                      const heroObj = heroes.find((hr) => hr.id === m.heroId) || heroes[0];
                      const isMe = m.id === playerId;
                      return (
                        <div
                          key={m.id}
                          className={`rounded-xl px-3 py-2 border flex items-center justify-between gap-2 ${
                            isMe
                              ? "bg-[#10203F] border-[#FBBF24]/80"
                              : "bg-[#091326] border-slate-700/90"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {SkillIcon && heroObj && (
                              <SkillIcon
                                heroId={heroObj.id}
                                skillId="c3"
                                size={38}
                                roundedClass="rounded-lg"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: heroObj?.color || "#38BDF8" }}
                                />
                                <span className="font-moba text-xs sm:text-sm font-extrabold text-white truncate">
                                  {m.name}
                                </span>
                                {isMe && (
                                  <span className="text-[10px] font-bold text-cyan-300">
                                    ({isVi ? "Bạn" : "You"})
                                  </span>
                                )}
                                {m.isHost && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300">
                                    👑 {isVi ? "Đội trưởng" : "Host"}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-300 truncate mt-0.5">
                                {heroObj?.name?.split("(")[0].trim()} ·{" "}
                                <span className="text-cyan-300">
                                  {heroObj?.role?.[lang] || heroObj?.role?.vi}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {m.isHost ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-400/50 text-[11px] font-moba font-extrabold text-amber-300">
                                👑 {isVi ? "CHỦ PHÒNG" : "HOST"}
                              </span>
                            ) : m.joinedRoom === false ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/50 text-[11px] font-moba font-bold text-amber-300">
                                ⏳ {isVi ? "ĐANG VÀO PHÒNG..." : "JOINING..."}
                              </span>
                            ) : m.ready ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/60 text-[11px] font-moba font-extrabold text-emerald-300">
                                ✓ {isVi ? "SẴN SÀNG" : "READY"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[11px] font-moba font-bold text-slate-300">
                                ⏳ {isVi ? "CHƯA SẴN SÀNG" : "NOT READY"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hero Selector inside Lobby */}
                <div className="md:col-span-6 flex flex-col min-h-0">
                  <div className="text-[11px] font-moba font-bold uppercase tracking-wider text-[#E5C16C] mb-2">
                    {isVi ? "CHỌN TƯỚNG CỦA BẠN" : "CHOOSE YOUR HERO"}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[250px] sm:max-h-[290px] overflow-y-auto pr-1 moba-shop-scroll">
                    {heroes.map((hr) => {
                      const active = selectedHero?.id === hr.id;
                      return (
                        <button
                          key={hr.id}
                          type="button"
                          onClick={() => onSelectHero(hr)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                            active
                              ? "bg-[#15294F] border-[#FBBF24] ring-1 ring-[#FBBF24]/70"
                              : "bg-[#081022] border-slate-800 hover:border-[#C89B3C]/60"
                          }`}
                        >
                          {SkillIcon && (
                            <SkillIcon
                              heroId={hr.id}
                              skillId="c3"
                              size={32}
                              roundedClass="rounded-lg"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: hr.color }}
                              />
                              <span className="font-moba text-xs font-bold text-white truncate">
                                {hr.name.split("(")[0].trim()}
                              </span>
                            </div>
                            <div className="text-[10px] text-cyan-300 truncate">
                              {hr.role?.[lang] || hr.role?.vi}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer when in room */}
        {room && (
          <footer className="moba-shop-footer px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="min-h-[42px] px-4 rounded-xl bg-rose-950/75 hover:bg-rose-900 border border-rose-500/60 text-rose-200 font-moba text-xs font-extrabold"
            >
              🚪 {isVi ? "RỜI PHÒNG" : "LEAVE ROOM"}
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              {isHost ? (
                <>
                  {notReadyMembers.length > 0 && (
                    <span className="text-[11px] text-amber-300 hidden sm:inline">
                      {isVi
                        ? `Đợi ${notReadyMembers.map((m) => m.name).join(", ")} vào phòng & Sẵn sàng...`
                        : `Waiting for ${notReadyMembers.map((m) => m.name).join(", ")}...`}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!canHostStart}
                    onClick={onStartMatch}
                    className={`min-h-[44px] px-6 rounded-xl font-moba text-sm font-black tracking-wide transition-all ${
                      canHostStart
                        ? "moba-bronze-btn"
                        : "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    }`}
                  >
                    ⚔️ {isVi ? "BẮT ĐẦU TRẬN" : "START MATCH"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onToggleReady}
                  className={`min-h-[44px] px-6 rounded-xl font-moba text-sm font-black tracking-wide border ${
                    myMember?.ready
                      ? "bg-emerald-600/25 hover:bg-emerald-600/35 border-emerald-400 text-emerald-200"
                      : "moba-bronze-btn"
                  }`}
                >
                  {myMember?.ready
                    ? isVi
                      ? "✓ ĐÃ SẴN SÀNG (BẤM ĐỂ HỦY)"
                      : "✓ READY (CLICK TO CANCEL)"
                    : isVi
                    ? "✓ SẴN SÀNG"
                    : "✓ READY"}
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
