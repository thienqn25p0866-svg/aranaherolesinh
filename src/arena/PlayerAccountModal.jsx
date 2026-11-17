import React, { useEffect, useMemo, useRef, useState } from "react";
import PlayerAvatarBadge, { CrestSvg } from "./PlayerAvatarBadge.jsx";
import HeroPreviewCanvas from "./HeroPreviewCanvas.jsx";
import AuthErrorBanner from "./AuthErrorBanner.jsx";
import { R } from "./soundEngine.js";
import {
  AVATAR_CRESTS,
  AVATAR_FRAMES,
  DAILY_CHECKIN_REWARD,
  PLAYER_TITLES,
  canClaimDailyCheckIn,
  getTodayDateKey,
  isFrameUnlocked,
} from "./playerAccount.ts";
import {
  FALLBACK_WEB_PLAY_URL,
  fetchLeaderboardTopPlayers,
  fetchMyFriendRelations,
  removeFriendRelation,
  resolvePlayableWebUrls,
  respondFriendRequest,
  searchPublicPlayers,
  sendFriendRequest,
} from "../firebase.ts";

export default function PlayerAccountModal({
  lang = "vi",
  initialTab = "profile",
  profile,
  heroes = [],
  coins = 100,
  highestWave = 0,
  googleUser = null,
  founderUnlocked = false,
  syncBusy = false,
  authError = "",
  authDetails = null,
  onClearAuthError,
  onSaveProfile,
  onSignInGoogle,
  onSignOutGoogle,
  onPushCloudSave,
  onPullCloudSave,
  onClaimDailyCheckIn,
  onExportSaveJson,
  onImportSaveJson,
  onOpenCoopWithFriend,
  onCopyText,
  onShowToast,
  onClose,
}) {
  const isVi = lang === "vi";
  const [tab, setTab] = useState(initialTab);

  // Editable Profile draft
  const [draftName, setDraftName] = useState(profile?.displayName || "Chiến Binh");
  const [draftBio, setDraftBio] = useState(profile?.bio || "");
  const [draftAvatarType, setDraftAvatarType] = useState(profile?.avatarType || "hero");
  const [draftAvatarValue, setDraftAvatarValue] = useState(profile?.avatarValue || "eohyen");
  const [draftFrame, setDraftFrame] = useState(profile?.avatarFrame || "bronze_recruit");
  const [draftTitle, setDraftTitle] = useState(profile?.titleBadge || "Tân Binh Đấu Trường");
  const [draftFavHero, setDraftFavHero] = useState(profile?.favoriteHeroId || "eohyen");
  const [draftIsPublic, setDraftIsPublic] = useState(profile?.isPublic !== false);

  // Friends & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [relations, setRelations] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    setTab(initialTab || "profile");
  }, [initialTab]);

  useEffect(() => {
    setDraftName(profile?.displayName || "Chiến Binh");
    setDraftBio(profile?.bio || "");
    setDraftAvatarType(profile?.avatarType || "hero");
    setDraftAvatarValue(profile?.avatarValue || "eohyen");
    setDraftFrame(profile?.avatarFrame || "bronze_recruit");
    setDraftTitle(profile?.titleBadge || "Tân Binh Đấu Trường");
    setDraftFavHero(profile?.favoriteHeroId || "eohyen");
    setDraftIsPublic(profile?.isPublic !== false);
  }, [profile]);

  const effectiveHighestWave = Math.max(Number(highestWave) || 0, Number(profile?.highestWave) || 0);
  const canCheckIn = canClaimDailyCheckIn(profile?.dailyCheckInDate || "", getTodayDateKey());

  const loadFriendsAndDirectory = async () => {
    if (!googleUser?.uid) return;
    setFriendsLoading(true);
    setFriendsError("");
    try {
      const [rels, directory] = await Promise.all([
        fetchMyFriendRelations(googleUser.uid),
        searchPublicPlayers(searchQuery),
      ]);
      setRelations(rels);
      setSearchResults(directory.filter((p) => p.uid !== googleUser.uid));
    } catch (err) {
      setFriendsError(
        isVi
          ? "Chưa thể tải danh sách bạn bè từ Firestore. Hãy kiểm tra kết nối hoặc đăng nhập lại."
          : "Unable to load friends from Firestore."
      );
      console.warn(err);
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!googleUser?.uid) return;
    setLbLoading(true);
    setLbError("");
    try {
      const rows = await fetchLeaderboardTopPlayers(20);
      setLeaderboard(rows);
    } catch (err) {
      setLbError(
        isVi
          ? "Chưa thể tải bảng xếp hạng từ Firestore."
          : "Unable to load leaderboard."
      );
      console.warn(err);
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "friends" && googleUser?.uid) {
      loadFriendsAndDirectory();
    } else if (tab === "leaderboard" && googleUser?.uid) {
      loadLeaderboard();
    }
  }, [tab, googleUser?.uid]);

  const selectableHeroes = useMemo(
    () => heroes.filter((h) => !h.isSecretFounder || founderUnlocked),
    [heroes, founderUnlocked]
  );

  const relationByUid = useMemo(() => {
    const map = new Map();
    if (!googleUser?.uid) return map;
    for (const rel of relations) {
      const otherUid = rel.fromUid === googleUser.uid ? rel.toUid : rel.fromUid;
      map.set(otherUid, rel);
    }
    return map;
  }, [relations, googleUser?.uid]);

  const incomingRequests = useMemo(
    () =>
      relations.filter(
        (r) => googleUser?.uid && r.toUid === googleUser.uid && r.status === "pending"
      ),
    [relations, googleUser?.uid]
  );

  const outgoingRequests = useMemo(
    () =>
      relations.filter(
        (r) => googleUser?.uid && r.fromUid === googleUser.uid && r.status === "pending"
      ),
    [relations, googleUser?.uid]
  );

  const acceptedFriends = useMemo(
    () => relations.filter((r) => r.status === "accepted"),
    [relations]
  );

  const handleSaveDraft = async () => {
    R.playHeroLockIn();
    await onSaveProfile?.({
      displayName: draftName,
      bio: draftBio,
      avatarType: draftAvatarType,
      avatarValue: draftAvatarValue,
      avatarFrame: draftFrame,
      titleBadge: draftTitle,
      favoriteHeroId: draftFavHero,
      isPublic: draftIsPublic,
    });
  };

  const handleSearchSubmit = async (e) => {
    e?.preventDefault?.();
    if (!googleUser?.uid) return;
    R.playClick();
    setSearching(true);
    setFriendsError("");
    try {
      const rows = await searchPublicPlayers(searchQuery);
      setSearchResults(rows.filter((p) => p.uid !== googleUser.uid));
    } catch (err) {
      setFriendsError(isVi ? "Lỗi tìm kiếm người chơi." : "Failed to search players.");
      console.warn(err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (target) => {
    if (!googleUser?.uid) return;
    R.playClick();
    try {
      const res = await sendFriendRequest(profile, target);
      if (res === "auto_accepted") {
        onShowToast?.(isVi ? `Đã trở thành bạn bè với ${target.displayName}!` : `You are now friends with ${target.displayName}!`);
      } else if (res === "already_friends") {
        onShowToast?.(isVi ? "Hai bạn đã là bạn bè." : "Already friends.");
      } else if (res === "already_pending") {
        onShowToast?.(isVi ? "Lời mời đang chờ xác nhận." : "Request already pending.");
      } else {
        onShowToast?.(isVi ? `Đã gửi lời mời kết bạn tới ${target.displayName}!` : `Friend request sent to ${target.displayName}!`);
      }
      await loadFriendsAndDirectory();
    } catch (err) {
      R.playError();
      onShowToast?.(err?.message || (isVi ? "Không thể gửi lời mời kết bạn." : "Failed to send friend request."));
    }
  };

  const handleRespondRequest = async (reqId, status) => {
    R.playClick();
    try {
      await respondFriendRequest(reqId, status);
      onShowToast?.(
        status === "accepted"
          ? isVi
            ? "Đã chấp nhận kết bạn!"
            : "Friend request accepted!"
          : isVi
          ? "Đã từ chối lời mời."
          : "Friend request declined."
      );
      await loadFriendsAndDirectory();
    } catch {
      R.playError();
      onShowToast?.(isVi ? "Không thể cập nhật lời mời kết bạn." : "Failed to update request.");
    }
  };

  const handleRemoveFriend = async (reqId) => {
    R.playClick();
    try {
      await removeFriendRelation(reqId);
      onShowToast?.(isVi ? "Đã xóa khỏi danh sách bạn bè." : "Removed from friends.");
      await loadFriendsAndDirectory();
    } catch {
      R.playError();
      onShowToast?.(isVi ? "Không thể xóa bạn bè." : "Failed to remove friend.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImportSaveJson?.(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 10020 }}>
      <div className="modal-box moba-shop-shell w-[96vw] max-w-[920px] h-[90dvh] max-h-[820px] flex flex-col p-0 overflow-hidden">
        {/* Top Modal Header */}
        <header className="moba-shop-header px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <PlayerAvatarBadge
              avatarType={draftAvatarType}
              avatarValue={draftAvatarValue}
              avatarFrame={draftFrame}
              displayName={draftName}
              heroes={heroes}
              size={46}
              animated={draftAvatarType === "hero"}
            />
            <div className="min-w-0">
              <div className="text-[11px] font-moba font-bold text-amber-300 uppercase tracking-wider truncate">
                {googleUser
                  ? isVi
                    ? "Tài Khoản Google · Lưu Trình Duyệt & Cloud"
                    : "Google Account · Browser & Cloud Save"
                  : isVi
                  ? "Khách · Đang Lưu Tiến Trình Trên Trình Duyệt"
                  : "Guest · Local Browser Save Active"}
              </div>
              <h2 className="font-title text-lg sm:text-xl font-black text-white truncate">
                {draftName} · <span className="text-cyan-300 font-mono-numbers text-sm">{profile?.friendCode}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              R.playModalClose();
              onClose?.();
            }}
            className="btn-secondary min-h-[42px] w-11 px-0 text-sm shrink-0"
            aria-label={isVi ? "Đóng" : "Close"}
          >
            ✕
          </button>
        </header>

        {/* Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#091224] border-b border-slate-800/90 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: "profile", label: isVi ? "Hồ Sơ & Avatar" : "Profile & Avatar" },
            { id: "storage", label: isVi ? "Lưu Trữ & Google" : "Save & Google" },
            {
              id: "friends",
              label:
                incomingRequests.length > 0
                  ? `${isVi ? "Bạn Bè" : "Friends"} (${incomingRequests.length})`
                  : isVi
                  ? "Bạn Bè & Tìm Kiếm"
                  : "Friends & Search",
            },
            { id: "leaderboard", label: isVi ? "Bảng Xếp Hạng" : "Leaderboard" },
          ].map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  R.playTabSwitch();
                  setTab(item.id);
                }}
                className={`min-h-[40px] px-4 rounded-xl font-moba text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? "bg-amber-500/20 border-amber-400 text-amber-200"
                    : "bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {tab === "profile" && (
            <>
              {!googleUser && authError && (
                <AuthErrorBanner
                  lang={lang}
                  authError={authError}
                  authDetails={authDetails}
                  onClear={onClearAuthError}
                  onCopyText={onCopyText}
                />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Summary + Daily Check-In + Career Stats */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#101C36] to-[#080F20] p-4 flex flex-col items-center text-center">
                  <PlayerAvatarBadge
                    avatarType={draftAvatarType}
                    avatarValue={draftAvatarValue}
                    avatarFrame={draftFrame}
                    displayName={draftName}
                    heroes={heroes}
                    size={84}
                    animated={draftAvatarType === "hero"}
                  />
                  <div className="mt-3 font-title text-xl font-black text-white">{draftName}</div>
                  <div className="text-xs font-moba font-bold text-amber-300 mt-0.5">{draftTitle}</div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-xs">
                    {draftBio || (isVi ? "Chưa có câu giới thiệu." : "No bio yet.")}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-slate-950/90 border border-cyan-500/40 font-mono-numbers text-xs font-bold text-cyan-200">
                      {profile?.friendCode}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onCopyText?.(
                          profile?.friendCode,
                          isVi ? `Đã sao chép mã bạn bè: ${profile?.friendCode}` : "Friend code copied!"
                        )
                      }
                      className="btn-secondary min-h-[34px] px-3 text-[11px]"
                    >
                      {isVi ? "Sao Chép Mã" : "Copy Code"}
                    </button>
                  </div>

                  {/* Career Metrics */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/90 text-left font-mono-numbers tabular-nums">
                    <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 p-2.5">
                      <div className="text-[10px] text-slate-400">{isVi ? "Màn Cao Nhất" : "Best Wave"}</div>
                      <div className="text-base font-black text-amber-300">{effectiveHighestWave} / 27</div>
                    </div>
                    <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 p-2.5">
                      <div className="text-[10px] text-slate-400">{isVi ? "Xu Hiện Có" : "Coins"}</div>
                      <div className="text-base font-black text-yellow-300">{coins.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 p-2.5">
                      <div className="text-[10px] text-slate-400">{isVi ? "Tổng Quái Hạ" : "Total Kills"}</div>
                      <div className="text-base font-black text-cyan-300">
                        {(profile?.lifetimeKills || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950/75 border border-slate-800/80 p-2.5">
                      <div className="text-[10px] text-slate-400">{isVi ? "Chiến Thắng" : "Victories"}</div>
                      <div className="text-base font-black text-emerald-300">
                        {(profile?.victories || 0).toLocaleString()} / {(profile?.matchesPlayed || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Check-In Reward */}
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-moba text-sm font-extrabold text-emerald-300">
                      {isVi ? "Điểm Danh Hàng Ngày" : "Daily Check-In Bonus"}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      {canCheckIn
                        ? isVi
                          ? `Nhận ngay +${DAILY_CHECKIN_REWARD} Xu thưởng hôm nay!`
                          : `Claim +${DAILY_CHECKIN_REWARD} Coins today!`
                        : isVi
                        ? "Bạn đã nhận thưởng hôm nay. Quay lại vào ngày mai!"
                        : "Already claimed today. Come back tomorrow!"}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canCheckIn}
                    onClick={() => {
                      R.playCoinPickup();
                      onClaimDailyCheckIn?.();
                    }}
                    className={`min-h-[42px] px-4 rounded-xl font-moba text-xs font-black shrink-0 ${
                      canCheckIn
                        ? "moba-bronze-btn"
                        : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    }`}
                  >
                    {canCheckIn ? `+${DAILY_CHECKIN_REWARD} Xu` : isVi ? "Đã Nhận" : "Claimed"}
                  </button>
                </div>
              </div>

              {/* Right Customization Editor */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-moba font-bold text-slate-200 mb-1">
                        {isVi ? "Tên Chiến Binh (Tối đa 32 ký tự)" : "Warrior Name"}
                      </label>
                      <input
                        type="text"
                        maxLength={32}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder={isVi ? "Nhập tên của bạn..." : "Enter display name..."}
                        className="w-full min-h-[42px] rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-moba font-bold text-slate-200 mb-1">
                        {isVi ? "Tướng Tủ" : "Favorite Hero"}
                      </label>
                      <select
                        value={draftFavHero}
                        onChange={(e) => setDraftFavHero(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 px-3 py-2 text-sm text-white outline-none"
                      >
                        {selectableHeroes.map((hr) => (
                          <option key={hr.id} value={hr.id}>
                            {hr.name.split("(")[0].trim()} — {hr.role?.[lang] || hr.role?.vi}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-moba font-bold text-slate-200 mb-1">
                      {isVi ? "Khẩu Hiệu / Giới Thiệu" : "Warrior Bio"}
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={draftBio}
                      onChange={(e) => setDraftBio(e.target.value)}
                      placeholder={isVi ? "Ví dụ: Chuyên săn boss màn 27, mời vào Co-op!" : "Your motto..."}
                      className="w-full min-h-[40px] rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={draftIsPublic}
                      onChange={(e) => setDraftIsPublic(e.target.checked)}
                      className="w-4 h-4 accent-amber-400"
                    />
                    <span>
                      {isVi
                        ? "Cho phép bạn bè tìm kiếm tên & xuất hiện trên Bảng Xếp Hạng"
                        : "Allow friends to find me & show on Leaderboard"}
                    </span>
                  </label>
                </div>

                {/* Avatar Source Picker */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-moba text-sm font-extrabold text-white">
                      {isVi ? "Chọn Ảnh Đại Diện (Avatar)" : "Choose Avatar"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          R.playTabSwitch();
                          setDraftAvatarType("hero");
                          if (!selectableHeroes.some((h) => h.id === draftAvatarValue)) {
                            setDraftAvatarValue(draftFavHero || "eohyen");
                          }
                        }}
                        className={`min-h-[34px] px-3 rounded-lg text-xs font-bold border ${
                          draftAvatarType === "hero"
                            ? "bg-amber-500/20 border-amber-400 text-amber-200"
                            : "bg-slate-900 border-slate-700 text-slate-300"
                        }`}
                      >
                        {isVi ? "Tướng Động" : "Animated Hero"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          R.playTabSwitch();
                          setDraftAvatarType("crest");
                          if (!AVATAR_CRESTS.some((c) => c.id === draftAvatarValue)) {
                            setDraftAvatarValue(AVATAR_CRESTS[0].id);
                          }
                        }}
                        className={`min-h-[34px] px-3 rounded-lg text-xs font-bold border ${
                          draftAvatarType === "crest"
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                            : "bg-slate-900 border-slate-700 text-slate-300"
                        }`}
                      >
                        {isVi ? "Huy Hiệu" : "Crests"}
                      </button>
                      {googleUser?.photoURL && (
                        <button
                          type="button"
                          onClick={() => {
                            R.playTabSwitch();
                            setDraftAvatarType("google");
                            setDraftAvatarValue(googleUser.photoURL);
                          }}
                          className={`min-h-[34px] px-3 rounded-lg text-xs font-bold border ${
                            draftAvatarType === "google"
                              ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                              : "bg-slate-900 border-slate-700 text-slate-300"
                          }`}
                        >
                          Google Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {draftAvatarType === "hero" && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {selectableHeroes.map((hr) => {
                        const selected = draftAvatarType === "hero" && draftAvatarValue === hr.id;
                        return (
                          <button
                            key={hr.id}
                            type="button"
                            onClick={() => {
                              R.playHeroSelect(hr.id);
                              setDraftAvatarType("hero");
                              setDraftAvatarValue(hr.id);
                            }}
                            className={`rounded-xl p-1.5 border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              selected
                                ? "bg-[#16294E] border-amber-400 ring-1 ring-amber-400/70"
                                : "bg-slate-950/75 border-slate-800 hover:border-slate-600"
                            }`}
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#060B16]">
                              <HeroPreviewCanvas hero={hr} compact interactive={false} />
                            </div>
                            <span className="text-[10px] font-moba font-bold text-slate-200 truncate w-full text-center">
                              {hr.name.split("(")[0].trim()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {draftAvatarType === "crest" && (
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_CRESTS.map((crest) => {
                        const selected = draftAvatarType === "crest" && draftAvatarValue === crest.id;
                        return (
                          <button
                            key={crest.id}
                            type="button"
                            onClick={() => {
                              R.playClick();
                              setDraftAvatarType("crest");
                              setDraftAvatarValue(crest.id);
                            }}
                            className={`rounded-xl p-2 border flex flex-col items-center gap-1.5 cursor-pointer ${
                              selected
                                ? "bg-[#16294E] border-cyan-400"
                                : "bg-slate-950/75 border-slate-800 hover:border-slate-600"
                            }`}
                          >
                            <CrestSvg crestId={crest.id} size={38} />
                            <span className="text-[10px] font-moba font-bold text-slate-200 text-center leading-tight">
                              {crest.name?.[lang] || crest.name?.vi}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {draftAvatarType === "google" && googleUser?.photoURL && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40">
                      <img
                        src={googleUser.photoURL}
                        alt={draftName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-emerald-400"
                      />
                      <div className="text-xs text-slate-200">
                        <div className="font-bold text-emerald-300">
                          {isVi ? "Đang dùng ảnh đại diện Google" : "Using Google Account Photo"}
                        </div>
                        <div className="text-slate-400 mt-0.5">{googleUser.displayName || "Google User"}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Frames & Titles */}
                <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 space-y-3">
                  <div>
                    <h4 className="font-moba text-xs font-extrabold text-slate-200 mb-2">
                      {isVi ? "Khung Viền Avatar (Mở Khóa Theo Màn)" : "Avatar Frame (Wave Unlocks)"}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AVATAR_FRAMES.map((fr) => {
                        const unlocked = isFrameUnlocked(fr.id, effectiveHighestWave, founderUnlocked);
                        const active = draftFrame === fr.id;
                        return (
                          <button
                            key={fr.id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => {
                              R.playClick();
                              setDraftFrame(fr.id);
                            }}
                            className={`rounded-xl p-2 border text-left transition-all ${
                              active
                                ? "bg-slate-800 border-amber-400"
                                : unlocked
                                ? "bg-slate-950/80 border-slate-800 hover:border-slate-600 cursor-pointer"
                                : "bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ background: fr.gradient }}
                              />
                              <span className="text-[11px] font-moba font-bold text-white truncate">
                                {fr.name?.[lang] || fr.name?.vi}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {unlocked
                                ? isVi
                                  ? "Đã mở"
                                  : "Unlocked"
                                : fr.founderOnly
                                ? isVi
                                  ? "Nhà Sáng Lập"
                                  : "Founder Only"
                                : isVi
                                ? `Qua Màn ${fr.minWave}`
                                : `Clear Wave ${fr.minWave}`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-moba text-xs font-extrabold text-slate-200 mb-2">
                      {isVi ? "Danh Hiệu Hiển Thị" : "Title Badge"}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {PLAYER_TITLES.map((tl) => {
                        const unlocked = tl.founderOnly ? founderUnlocked : effectiveHighestWave >= tl.minWave;
                        const active = draftTitle === tl.id;
                        return (
                          <button
                            key={tl.id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => {
                              R.playClick();
                              setDraftTitle(tl.id);
                            }}
                            className={`min-h-[34px] px-3 rounded-lg text-xs font-moba font-bold border transition-colors ${
                              active
                                ? "bg-amber-500/20 border-amber-400 text-amber-200"
                                : unlocked
                                ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600 cursor-pointer"
                                : "bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed"
                            }`}
                          >
                            {unlocked ? "" : "🔒 "}
                            {isVi ? tl.id : tl.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={syncBusy}
                    onClick={handleSaveDraft}
                    className="btn-primary min-h-[46px] px-7 text-sm font-black"
                  >
                    {syncBusy
                      ? isVi
                        ? "ĐANG LƯU..."
                        : "SAVING..."
                      : isVi
                      ? "LƯU HỒ SƠ & AVATAR"
                      : "SAVE PROFILE & AVATAR"}
                  </button>
                </div>
              </div>
            </div>
            </>
          )}

          {tab === "storage" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Cloud Account Card */}
              <div className="rounded-2xl border border-cyan-500/40 bg-[#0B1325] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="text-xs font-moba font-extrabold text-cyan-300 uppercase tracking-wider">
                    {isVi ? "Tài Khoản Google & Lưu Đám Mây" : "Google Account & Cloud Save"}
                  </div>
                  <h3 className="font-title text-xl font-black text-white">
                    {googleUser
                      ? isVi
                        ? "Đã Kết Nối Tài Khoản Google"
                        : "Connected to Google"
                      : isVi
                      ? "Đăng Nhập Bằng Google"
                      : "Sign In With Google"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {googleUser
                      ? isVi
                        ? "Tiến trình (Xu, Màn cao nhất, Kho đồ, Trang bị, Tên, Avatar, Danh hiệu) sẽ tự động đồng bộ an toàn lên đám mây Firebase và cho phép kết bạn chơi Co-op."
                        : "Your progress (Coins, Best Wave, Inventory, Gear, Avatar) syncs securely to Cloud Firestore and unlocks Friend Search."
                      : isVi
                      ? "Đăng nhập nhanh bằng Google để giữ tiến trình chơi vĩnh viễn trên mọi thiết bị, tìm kiếm bạn bè theo Mã Bạn Bè và ghi danh lên Bảng Xếp Hạng."
                      : "Sign in with Google to save progress across devices, add friends, and compete on the leaderboard."}
                  </p>

                  {googleUser && (
                    <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 flex items-center gap-3">
                      {googleUser.photoURL ? (
                        <img
                          src={googleUser.photoURL}
                          alt={draftName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-cyan-400/70"
                        />
                      ) : (
                        <CrestSvg crestId="shield_gold" size={40} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-moba font-bold text-white truncate">
                          {googleUser.displayName || draftName}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">
                          {isVi ? "✓ Đã xác thực Google" : "✓ Google Verified"}
                          {profile?.lastSyncedAt ? ` · ${profile.lastSyncedAt}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {!googleUser && !authError && typeof window !== "undefined" && !/^https?:$/i.test(window.location.protocol || "") && (
                    <div className="rounded-xl bg-cyan-950/45 border border-cyan-400/45 px-3 py-2.5 text-xs text-cyan-100 leading-relaxed space-y-2">
                      <div>
                        {isVi
                          ? "Bạn đang mở bản HTML cục bộ. Bấm 'ĐĂNG NHẬP BẰNG GOOGLE' bên dưới để mở cửa sổ xác thực HTTPS và đồng bộ Cloud Save ngay trên bản này, hoặc mở trực tiếp bản Web HTTPS:"
                          : "You are running a local HTML copy. Click 'SIGN IN WITH GOOGLE' below to open the secure HTTPS auth bridge and sync Cloud Save, or open the HTTPS web version:"}
                      </div>
                      <a
                        href={resolvePlayableWebUrls()[0] || FALLBACK_WEB_PLAY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-moba font-black text-[11px]"
                      >
                        🌐 {isVi ? "Mở Bản Web HTTPS ↗" : "Open HTTPS Web Version ↗"}
                      </a>
                    </div>
                  )}
                  {!googleUser && authError && (
                    <AuthErrorBanner
                      lang={lang}
                      authError={authError}
                      authDetails={authDetails}
                      onClear={onClearAuthError}
                      onCopyText={onCopyText}
                    />
                  )}
                  {!googleUser ? (
                    <button
                      type="button"
                      disabled={syncBusy}
                      onClick={() => {
                        R.playClick();
                        onSignInGoogle?.();
                      }}
                      className="w-full min-h-[48px] rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-950 font-moba text-sm font-black flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
                    >
                      <span>G</span>
                      <span>
                        {syncBusy
                          ? isVi
                            ? "ĐANG ĐĂNG NHẬP..."
                            : "SIGNING IN..."
                          : isVi
                          ? "ĐĂNG NHẬP BẰNG GOOGLE"
                          : "SIGN IN WITH GOOGLE"}
                      </span>
                    </button>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={syncBusy}
                          onClick={() => {
                            R.playClick();
                            onPushCloudSave?.();
                          }}
                          className="btn-primary min-h-[44px] text-xs font-extrabold"
                        >
                          {syncBusy
                            ? isVi
                              ? "Đang đồng bộ..."
                              : "Syncing..."
                            : isVi
                            ? "Lưu Lên Cloud"
                            : "Save to Cloud"}
                        </button>
                        <button
                          type="button"
                          disabled={syncBusy}
                          onClick={() => {
                            R.playClick();
                            onPullCloudSave?.();
                          }}
                          className="btn-secondary min-h-[44px] text-xs font-bold border-cyan-500/50 text-cyan-200"
                        >
                          {isVi ? "Tải Từ Cloud" : "Load From Cloud"}
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={syncBusy}
                        onClick={() => {
                          R.playClick();
                          onSignOutGoogle?.();
                        }}
                        className="btn-secondary min-h-[40px] w-full text-xs text-rose-300 border-rose-500/40"
                      >
                        {isVi ? "Đăng Xuất Tài Khoản Google" : "Sign Out Google"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Browser Local Save + JSON Backup Card */}
              <div className="rounded-2xl border border-amber-500/40 bg-[#0B1325] p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="text-xs font-moba font-extrabold text-amber-300 uppercase tracking-wider">
                    {isVi ? "Lưu Trình Duyệt & Sao Lưu Tệp" : "Browser Save & File Backup"}
                  </div>
                  <h3 className="font-title text-xl font-black text-white">
                    {isVi ? "Lưu Tiến Trình Trên Trình Duyệt" : "Local Browser Persistence"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isVi
                      ? "Mỗi lần bạn chơi qua màn, mua trang bị, điểm danh hay đổi tên/avatar, game tự động lưu ngay vào bộ nhớ trình duyệt. Bạn cũng có thể xuất file .json để mang sang máy khác."
                      : "Every wave clear, purchase, check-in, and profile edit automatically persists in your browser. Export a .json backup anytime to transfer across devices."}
                  </p>

                  <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-xs space-y-1 font-mono-numbers">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isVi ? "Trạng thái lưu trình duyệt:" : "Browser storage:"}</span>
                      <span className="text-emerald-400 font-bold">{isVi ? "Đang hoạt động" : "Active"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isVi ? "Màn cao nhất đã lưu:" : "Saved best wave:"}</span>
                      <span className="text-amber-300 font-bold">{effectiveHighestWave} / 27</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isVi ? "Xu hiện tại:" : "Current coins:"}</span>
                      <span className="text-yellow-300 font-bold">{coins.toLocaleString()} Xu</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      R.playClick();
                      onExportSaveJson?.();
                    }}
                    className="btn-secondary min-h-[44px] w-full text-xs font-bold border-amber-500/45 text-amber-200"
                  >
                    {isVi ? "Tải Xuống File Sao Lưu (.json)" : "Export Save Backup (.json)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      R.playClick();
                      fileInputRef.current?.click();
                    }}
                    className="btn-secondary min-h-[44px] w-full text-xs font-bold border-sky-500/45 text-sky-200"
                  >
                    {isVi ? "Khôi Phục Tiến Trình Từ File (.json)" : "Import Save Backup (.json)"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "friends" && (
            <div className="space-y-4">
              {!googleUser ? (
                <div className="rounded-2xl border border-cyan-500/40 bg-[#0B1325] p-6 text-center space-y-3">
                  <h3 className="font-title text-lg font-black text-white">
                    {isVi
                      ? "Đăng Nhập Google Để Tìm Kiếm & Kết Bạn"
                      : "Sign In With Google To Find Friends"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    {isVi
                      ? "Tính năng tìm chiến binh qua Tên hoặc Mã Bạn Bè (AH-XXXXXX), gửi lời mời kết bạn và rủ tổ đội Co-op sử dụng danh bạ đám mây bảo mật qua tài khoản Google."
                      : "Player search, friend requests, and friend lists require Google Sign-In so other players can discover your public warrior card."}
                  </p>
                  {authError && (
                    <AuthErrorBanner
                      lang={lang}
                      authError={authError}
                      authDetails={authDetails}
                      onClear={onClearAuthError}
                      onCopyText={onCopyText}
                      align="center"
                    />
                  )}
                  <button
                    type="button"
                    disabled={syncBusy}
                    onClick={() => {
                      R.playClick();
                      onSignInGoogle?.();
                    }}
                    className="btn-primary min-h-[46px] px-6 text-sm disabled:opacity-60"
                  >
                    {syncBusy
                      ? isVi
                        ? "Đang đăng nhập..."
                        : "Signing in..."
                      : isVi
                      ? "Đăng Nhập Google Ngay"
                      : "Sign In With Google"}
                  </button>
                </div>
              ) : (
                <>
                  {/* My Code + Search Form */}
                  <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400 font-moba">
                        {isVi ? "Mã Bạn Bè Của Bạn:" : "Your Friend Code:"}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-950 border border-cyan-500/40 font-mono-numbers text-sm font-black text-cyan-300">
                        {profile?.friendCode}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onCopyText?.(
                            profile?.friendCode,
                            isVi ? `Đã sao chép mã bạn bè: ${profile?.friendCode}` : "Copied!"
                          )
                        }
                        className="btn-secondary min-h-[36px] px-3 text-xs"
                      >
                        {isVi ? "Sao Chép" : "Copy"}
                      </button>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 md:max-w-md">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isVi ? "Tìm theo Tên hoặc Mã (vd: AH-...)" : "Search Name or Friend Code..."}
                        className="flex-1 min-h-[42px] rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 px-3 py-2 text-xs text-white outline-none"
                      />
                      <button
                        type="submit"
                        disabled={searching}
                        className="btn-primary min-h-[42px] px-4 text-xs shrink-0"
                      >
                        {searching ? "..." : isVi ? "Tìm Kiếm" : "Search"}
                      </button>
                    </form>
                  </div>

                  {friendsError && (
                    <div className="rounded-xl bg-rose-950/50 border border-rose-500/50 px-3.5 py-2.5 text-xs text-rose-200">
                      {friendsError}
                    </div>
                  )}

                  {/* Incoming Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="rounded-2xl border border-amber-500/45 bg-amber-950/15 p-4 space-y-2.5">
                      <h4 className="font-moba text-sm font-extrabold text-amber-300">
                        {isVi ? `Lời Mời Kết Bạn Chờ Duyệt (${incomingRequests.length})` : `Incoming Requests (${incomingRequests.length})`}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {incomingRequests.map((req) => {
                          const other = req.otherProfile;
                          return (
                            <div
                              key={req.id}
                              className="rounded-xl bg-slate-950/85 border border-slate-800 p-3 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <PlayerAvatarBadge
                                  avatarType={other?.avatarType || "hero"}
                                  avatarValue={other?.avatarValue || "eohyen"}
                                  avatarFrame={other?.avatarFrame || "bronze_recruit"}
                                  displayName={other?.displayName || req.fromName}
                                  heroes={heroes}
                                  size={40}
                                />
                                <div className="min-w-0">
                                  <div className="font-moba text-xs font-bold text-white truncate">
                                    {other?.displayName || req.fromName}
                                  </div>
                                  <div className="text-[11px] font-mono-numbers text-cyan-300">
                                    {req.fromFriendCode} · Wave {other?.highestWave ?? 0}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRespondRequest(req.id, "accepted")}
                                  className="min-h-[34px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondRequest(req.id, "declined")}
                                  className="min-h-[34px] px-2.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Friends + Discovery 2-col */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Friends List */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-moba text-sm font-extrabold text-white">
                          {isVi ? `Danh Sách Bạn Bè (${acceptedFriends.length})` : `Friends (${acceptedFriends.length})`}
                        </h4>
                        <button
                          type="button"
                          onClick={loadFriendsAndDirectory}
                          className="text-xs text-cyan-300 hover:text-cyan-200 cursor-pointer"
                        >
                          {friendsLoading ? "..." : isVi ? "Làm mới" : "Refresh"}
                        </button>
                      </div>

                      {acceptedFriends.length === 0 ? (
                        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 text-center text-xs text-slate-400">
                          {isVi
                            ? "Chưa có bạn bè nào. Hãy tìm tên hoặc mã bạn bè ở cột bên cạnh để kết nối!"
                            : "No friends yet. Search players on the right to connect!"}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {acceptedFriends.map((rel) => {
                            const other = rel.otherProfile;
                            const fallbackName = rel.fromUid === googleUser.uid ? rel.toName : rel.fromName;
                            const fallbackCode = rel.fromUid === googleUser.uid ? rel.toFriendCode : rel.fromFriendCode;
                            return (
                              <div
                                key={rel.id}
                                className="rounded-xl bg-slate-950/85 border border-slate-800 p-2.5 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <PlayerAvatarBadge
                                    avatarType={other?.avatarType || "hero"}
                                    avatarValue={other?.avatarValue || "eohyen"}
                                    avatarFrame={other?.avatarFrame || "bronze_recruit"}
                                    displayName={other?.displayName || fallbackName}
                                    heroes={heroes}
                                    size={42}
                                  />
                                  <div className="min-w-0">
                                    <div className="font-moba text-xs font-bold text-white truncate">
                                      {other?.displayName || fallbackName}
                                    </div>
                                    <div className="text-[10px] text-amber-300 truncate">
                                      {other?.titleBadge || "Chiến Binh"} · Màn {other?.highestWave ?? 0}/27
                                    </div>
                                    <div className="text-[10px] font-mono-numbers text-slate-400">
                                      {other?.friendCode || fallbackCode}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      R.playClick();
                                      onOpenCoopWithFriend?.(other?.displayName || fallbackName);
                                    }}
                                    className="btn-secondary min-h-[34px] px-2.5 text-[11px] border-cyan-500/45 text-cyan-200"
                                  >
                                    Co-op
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFriend(rel.id)}
                                    className="btn-secondary min-h-[34px] px-2 text-[11px] text-rose-300 border-rose-500/40"
                                    title={isVi ? "Xóa bạn" : "Unfriend"}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {outgoingRequests.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-[11px] text-slate-400 font-moba font-bold">
                            {isVi ? `Đã gửi lời mời (${outgoingRequests.length})` : `Sent Requests (${outgoingRequests.length})`}
                          </div>
                          {outgoingRequests.map((req) => (
                            <div
                              key={req.id}
                              className="flex items-center justify-between text-xs bg-slate-950/70 border border-slate-800/70 rounded-lg px-2.5 py-1.5"
                            >
                              <span className="text-slate-300 truncate">
                                {req.otherProfile?.displayName || req.toName} ({req.toFriendCode})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFriend(req.id)}
                                className="text-[11px] text-slate-400 hover:text-rose-300 cursor-pointer shrink-0 ml-2"
                              >
                                {isVi ? "Hủy" : "Cancel"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Search Directory Results */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 space-y-2.5">
                      <h4 className="font-moba text-sm font-extrabold text-white">
                        {searchQuery.trim()
                          ? isVi
                            ? `Kết Quả Tìm Kiếm (${searchResults.length})`
                            : `Search Results (${searchResults.length})`
                          : isVi
                          ? "Chiến Binh Khác Trong Đấu Trường"
                          : "Warriors In Arena"}
                      </h4>
                      {searchResults.length === 0 ? (
                        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 text-center text-xs text-slate-400">
                          {isVi
                            ? "Không tìm thấy chiến binh nào phù hợp."
                            : "No matching players found."}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {searchResults.map((target) => {
                            const rel = relationByUid.get(target.uid);
                            return (
                              <div
                                key={target.uid}
                                className="rounded-xl bg-slate-950/85 border border-slate-800 p-2.5 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <PlayerAvatarBadge
                                    avatarType={target.avatarType}
                                    avatarValue={target.avatarValue}
                                    avatarFrame={target.avatarFrame}
                                    displayName={target.displayName}
                                    heroes={heroes}
                                    size={42}
                                  />
                                  <div className="min-w-0">
                                    <div className="font-moba text-xs font-bold text-white truncate">
                                      {target.displayName}
                                    </div>
                                    <div className="text-[10px] text-amber-300 truncate">
                                      {target.titleBadge} · Màn {target.highestWave}/27
                                    </div>
                                    <div className="text-[10px] font-mono-numbers text-slate-400">
                                      {target.friendCode} · {target.lifetimeKills.toLocaleString()} {isVi ? "quái" : "kills"}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {rel?.status === "accepted" ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                                      {isVi ? "Bạn Bè" : "Friends"}
                                    </span>
                                  ) : rel?.status === "pending" ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                                      {isVi ? "Đang Chờ" : "Pending"}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddFriend(target)}
                                      className="btn-secondary min-h-[34px] px-3 text-[11px] border-cyan-500/45 text-cyan-200"
                                    >
                                      {isVi ? "+ Kết Bạn" : "+ Add Friend"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "leaderboard" && (
            <div className="space-y-3">
              {!googleUser ? (
                <div className="rounded-2xl border border-amber-500/40 bg-[#0B1325] p-6 text-center space-y-3">
                  <h3 className="font-title text-lg font-black text-white">
                    {isVi
                      ? "Đăng Nhập Google Để Xem Bảng Xếp Hạng Chiến Binh"
                      : "Sign In To View Leaderboard"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    {isVi
                      ? "Kết nối tài khoản Google để xem thứ hạng vượt ải 27 màn và tổng số quái tiêu diệt của cộng đồng."
                      : "Connect your Google account to view community rankings."}
                  </p>
                  {authError && (
                    <AuthErrorBanner
                      lang={lang}
                      authError={authError}
                      authDetails={authDetails}
                      onClear={onClearAuthError}
                      onCopyText={onCopyText}
                      align="center"
                    />
                  )}
                  <button
                    type="button"
                    disabled={syncBusy}
                    onClick={() => {
                      R.playClick();
                      onSignInGoogle?.();
                    }}
                    className="btn-primary min-h-[46px] px-6 text-sm disabled:opacity-60"
                  >
                    {syncBusy
                      ? isVi
                        ? "Đang đăng nhập..."
                        : "Signing in..."
                      : isVi
                      ? "Đăng Nhập Google"
                      : "Sign In With Google"}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#0B1325] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-title text-base font-black text-white">
                      {isVi ? "Top 20 Chiến Binh Arena Hero" : "Top 20 Arena Warriors"}
                    </h3>
                    <button
                      type="button"
                      onClick={loadLeaderboard}
                      className="btn-secondary min-h-[34px] px-3 text-xs"
                    >
                      {lbLoading ? "..." : isVi ? "Cập Nhật" : "Refresh"}
                    </button>
                  </div>

                  {lbError && (
                    <div className="rounded-xl bg-rose-950/50 border border-rose-500/50 p-3 text-xs text-rose-200">
                      {lbError}
                    </div>
                  )}

                  {leaderboard.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {lbLoading
                        ? isVi
                          ? "Đang tải bảng xếp hạng..."
                          : "Loading leaderboard..."
                        : isVi
                        ? "Chưa có chiến binh công khai nào. Hãy lưu hồ sơ để trở thành người đầu tiên!"
                        : "No public warriors ranked yet."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((row, idx) => {
                        const isMe = row.uid === googleUser.uid;
                        const rankColor =
                          idx === 0
                            ? "text-amber-300 border-amber-400/70 bg-amber-500/15"
                            : idx === 1
                            ? "text-slate-200 border-slate-300/60 bg-slate-400/15"
                            : idx === 2
                            ? "text-orange-300 border-orange-400/60 bg-orange-500/15"
                            : "text-slate-400 border-slate-800 bg-slate-900/80";
                        return (
                          <div
                            key={row.uid}
                            className={`rounded-xl p-2.5 border flex items-center justify-between gap-3 ${
                              isMe
                                ? "bg-[#15264B] border-cyan-400/70"
                                : "bg-slate-950/80 border-slate-800/90"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono-numbers text-xs font-black shrink-0 ${rankColor}`}
                              >
                                #{idx + 1}
                              </span>
                              <PlayerAvatarBadge
                                avatarType={row.avatarType}
                                avatarValue={row.avatarValue}
                                avatarFrame={row.avatarFrame}
                                displayName={row.displayName}
                                heroes={heroes}
                                size={42}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-moba text-sm font-bold text-white truncate">
                                    {row.displayName}
                                  </span>
                                  {isMe && (
                                    <span className="text-[10px] font-moba font-bold text-cyan-300">
                                      ({isVi ? "Bạn" : "You"})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-amber-300 truncate">
                                  {row.titleBadge} · {row.friendCode}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 font-mono-numbers tabular-nums text-right">
                              <div>
                                <div className="text-[10px] text-slate-400">{isVi ? "Màn Cao Nhất" : "Best Wave"}</div>
                                <div className="text-sm font-black text-amber-300">{row.highestWave}/27</div>
                              </div>
                              <div className="hidden sm:block">
                                <div className="text-[10px] text-slate-400">{isVi ? "Quái Hạ" : "Kills"}</div>
                                <div className="text-sm font-bold text-cyan-300">
                                  {row.lifetimeKills.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
