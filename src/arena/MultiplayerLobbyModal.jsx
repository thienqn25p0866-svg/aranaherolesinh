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
  p2pAnswerCode,
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
}) {
  const isVi = lang === "vi";
  const members = room?.members || [];
  const myMember = members.find((m) => m.id === playerId) || null;
  const isHost = Boolean(room && room.hostId === playerId);
  const notReadyMembers = members.filter((m) => !m.isHost && !m.ready);
  const canHostStart = isHost && members.length >= 1 && notReadyMembers.length === 0;
  const powerPct = Math.round((room?.powerMultiplier || 1) * 100);
  const isP2PRoom = Boolean(room?.roomId?.startsWith("P2-"));

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
                  <div className="text-xs font-moba font-extrabold text-sky-200">
                    ✓{" "}
                    {isVi
                      ? "Đã tạo Mã Phản Hồi! Hãy sao chép gửi lại cho Chủ Phòng:"
                      : "Reply Code Ready! Copy and send back to Host:"}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={p2pAnswerCode}
                      className="flex-1 min-w-0 rounded-lg bg-[#030710] border border-sky-500/50 px-2.5 py-2 text-xs font-mono-numbers text-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => onCopyText?.(p2pAnswerCode, isVi ? "Đã sao chép Mã Phản Hồi!" : "Reply Code copied!")}
                      className="min-h-[38px] px-3.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-moba text-xs font-black shrink-0"
                    >
                      📋 {isVi ? "SAO CHÉP" : "COPY"}
                    </button>
                  </div>
                  <div className="text-[11px] text-amber-200 leading-relaxed">
                    ⏳{" "}
                    {isVi
                      ? "Đang chờ Chủ phòng dán mã & bấm 'GHÉP ĐÔI'. Ngay khi ghép thành công, màn hình bạn sẽ TỰ ĐỘNG vào phòng!"
                      : "Waiting for Host to click Connect Peer — your screen will automatically enter the room!"}
                  </div>
                </div>
              )}

              {/* Two Options: CREATE ROOM & JOIN ROOM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* CREATE ROOM */}
                <div className="rounded-2xl bg-gradient-to-br from-[#10203F] to-[#081022] border border-[#C89B3C]/55 p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-[11px] font-moba font-bold text-amber-300">
                      👑 {isVi ? "LỰA CHỌN 1" : "OPTION 1"}
                    </div>
                    <h3 className="font-moba text-lg font-black text-white mt-2">
                      {isVi ? "TẠO PHÒNG MỚI" : "CREATE ROOM"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {isVi
                        ? "Tạo phòng ngay lập tức: dùng mã 6 ký tự khi có máy chủ web, hoặc tự động tạo phòng P2P Trực Tiếp nếu mở từ file HTML tải về máy."
                        : "Creates a room immediately: uses a 6-char Room ID on hosted servers or automatically starts Direct P2P on downloaded HTML."}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onCreateRoom}
                    className="w-full min-h-[44px] moba-bronze-btn rounded-xl font-moba text-sm font-black tracking-wide disabled:opacity-60"
                  >
                    {busy
                      ? isVi
                        ? "ĐANG TẠO PHÒNG..."
                        : "CREATING ROOM..."
                      : isVi
                      ? "➕ TẠO PHÒNG NGAY"
                      : "➕ CREATE ROOM"}
                  </button>
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
                      🔎 {isVi ? "LỰA CHỌN 2" : "OPTION 2"}
                    </div>
                    <h3 className="font-moba text-lg font-black text-white mt-2">
                      {isVi ? "VÀO PHÒNG BẰNG MÃ" : "JOIN ROOM BY CODE"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {isVi
                        ? "Nhập ID phòng 6 ký tự (VD: A7K9P2) hoặc dán Mã Mời P2P (AH1...) từ đội trưởng."
                        : "Enter a 6-char Room ID (e.g. A7K9P2) or paste a P2P Invite Code (AH1...)."}
                    </p>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onChangeJoinCode(/^ah1/i.test(raw.trim()) ? raw : raw.toUpperCase());
                      }}
                      placeholder={isVi ? "VD: A7K9P2 hoặc AH1..." : "e.g. A7K9P2 or AH1..."}
                      className="mt-2.5 w-full rounded-xl bg-[#050A16] border border-cyan-500/50 focus:border-cyan-300 px-3 py-2.5 text-center font-mono-numbers text-sm sm:text-base font-black tracking-wider text-cyan-200 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !joinCode.trim()}
                    className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:brightness-110 text-slate-950 font-moba text-sm font-black tracking-wide disabled:opacity-50"
                  >
                    {busy
                      ? isVi
                        ? "ĐANG TÌM PHÒNG..."
                        : "JOINING..."
                      : isVi
                      ? "🚪 THAM GIA PHÒNG"
                      : "🚪 JOIN ROOM"}
                  </button>
                </form>
              </div>

              {/* Direct P2P Section (Works even on file:// / content:// without a central server) */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0D1E34] to-[#081020] border border-emerald-500/55 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/45 text-[11px] font-moba font-bold text-emerald-300">
                      🔗 {isVi ? "P2P TRỰC TIẾP · CHƠI TỪ FILE HTML" : "DIRECT P2P · NO SERVER NEEDED"}
                    </div>
                    <h3 className="font-moba text-base font-black text-white mt-1.5">
                      {isVi
                        ? "KẾT NỐI TRỰC TIẾP VỚI BẠN BÈ (WEBRTC)"
                        : "DIRECT PEER-TO-PEER CO-OP"}
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {isVi
                        ? "Dùng được ngay cả khi bạn và bạn bè đang mở file .html tải về máy hoặc máy chủ web bị chặn."
                        : "Works even from downloaded HTML files (content:// / file://) when no central server is reachable."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#060D1C] border border-emerald-500/35 p-3 flex flex-col justify-between gap-2.5">
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-emerald-300">1. {isVi ? "Làm Chủ Phòng:" : "Host a P2P Room:"}</strong>{" "}
                      {isVi
                        ? "Tạo phòng và lấy Mã Mời gửi qua Zalo/Messenger cho bạn bè."
                        : "Create a P2P room and send the Invite Code to your friend."}
                    </div>
                    <button
                      type="button"
                      disabled={p2pBusy}
                      onClick={onStartP2PHost}
                      className="w-full min-h-[42px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-moba text-xs sm:text-sm font-black tracking-wide disabled:opacity-60"
                    >
                      {p2pBusy
                        ? isVi
                          ? "ĐANG KHỞI TẠO P2P..."
                          : "STARTING P2P..."
                        : isVi
                        ? "⚡ TẠO PHÒNG P2P NGAY"
                        : "⚡ CREATE P2P ROOM"}
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#060D1C] border border-sky-500/35 p-3 space-y-2">
                    <div className="text-xs text-slate-300">
                      <strong className="text-sky-300">2. {isVi ? "Vào Phòng Bạn Bè:" : "Join Friend's P2P Room:"}</strong>{" "}
                      {isVi ? "Dán Mã Mời (AH1...) nhận từ chủ phòng:" : "Paste Invite Code (AH1...) from host:"}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={p2pIncomingOffer || ""}
                        onChange={(e) => onChangeP2PIncomingOffer?.(e.target.value)}
                        placeholder={isVi ? "Dán mã AH1... vào đây" : "Paste AH1... offer code"}
                        className="flex-1 min-w-0 rounded-lg bg-[#040812] border border-sky-500/45 focus:border-sky-300 px-2.5 py-2 text-xs font-mono-numbers text-sky-200 outline-none"
                      />
                      <button
                        type="button"
                        disabled={p2pBusy || !(p2pIncomingOffer || "").trim()}
                        onClick={onJoinP2POffer}
                        className="min-h-[38px] px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-moba text-xs font-black shrink-0 disabled:opacity-50"
                      >
                        {isVi ? "TẠO MÃ ĐÁP" : "JOIN"}
                      </button>
                    </div>
                  </div>
                </div>

                {(envInfo?.isFileProtocol || error) && onApplyCustomServerUrl && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {isVi ? "Hoặc dán link web máy chủ (https://...):" : "Or custom server URL:"}
                    </span>
                    <input
                      type="url"
                      value={customServerUrl || ""}
                      onChange={(e) => onChangeCustomServerUrl?.(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 min-w-[180px] rounded-lg bg-[#050A16] border border-slate-700 focus:border-amber-400 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onApplyCustomServerUrl}
                      className="min-h-[32px] px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-moba font-bold text-amber-300"
                    >
                      {isVi ? "KẾT NỐI LINK" : "CONNECT"}
                    </button>
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
                      {isP2PRoom ? (isVi ? "PHÒNG P2P TRỰC TIẾP" : "DIRECT P2P ROOM") : isVi ? "MÃ ID PHÒNG" : "ROOM ID"}
                    </div>
                    <div className="font-mono-numbers text-xl sm:text-2xl font-black tracking-[0.2em] text-[#FDE68A]">
                      {room.roomId}
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
                      ? "📋 SAO CHÉP ID"
                      : "📋 COPY ID"}
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
                      🔗 {isVi ? "MỜI BẠN BÈ VÀO PHÒNG P2P (2 BƯỚC NHANH)" : "INVITE P2P TEAMMATES"}
                    </div>
                    <button
                      type="button"
                      disabled={p2pBusy}
                      onClick={onCreateP2PInvite}
                      className="min-h-[30px] px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-[11px] font-moba font-bold text-emerald-200"
                    >
                      🔄 {isVi ? "Tạo mã mời mới" : "New Invite Code"}
                    </button>
                  </div>
                  {p2pInviteCode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={p2pInviteCode}
                        className="flex-1 min-w-0 rounded-lg bg-[#050A16] border border-emerald-500/40 px-2.5 py-1.5 text-[11px] font-mono-numbers text-emerald-100"
                      />
                      <button
                        type="button"
                        onClick={() => onCopyText?.(p2pInviteCode, isVi ? "Đã sao chép Mã Mời P2P!" : "P2P Invite Code copied!")}
                        className="min-h-[34px] px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-moba text-[11px] font-black shrink-0"
                      >
                        📋 {isVi ? "SAO CHÉP MÃ MỜI" : "COPY INVITE"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[#050A16] border border-emerald-500/30 px-2.5 py-2 text-[11px] text-emerald-200/85">
                      ⏳ {isVi ? "Đang tạo Mã Mời P2P (AH1...) — hoặc bấm 'Tạo mã mời mới'." : "Generating P2P Invite Code (AH1...)..."}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={p2pIncomingAnswer || ""}
                      onChange={(e) => onChangeP2PIncomingAnswer?.(e.target.value)}
                      placeholder={isVi ? "Dán Mã Phản Hồi (AH1...) bạn bè gửi lại vào đây..." : "Paste friend's Reply Code (AH1...) here..."}
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
                            ) : m.ready ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/60 text-[11px] font-moba font-extrabold text-emerald-300">
                                ✓ {isVi ? "SẴN SÀNG" : "READY"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[11px] font-moba font-bold text-slate-300">
                                ⏳ {isVi ? "CHỜ..." : "WAITING"}
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
                        ? `Đang chờ ${notReadyMembers.map((m) => m.name).join(", ")} Sẵn sàng...`
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
