import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  type PlayerProfile,
  type ProgressSnapshot,
  computeUnlockedTitles,
  generateFriendCode,
  normalizeDisplayName,
  sanitizeGooglePhotoUrl,
  sanitizePlayerProfile,
} from "./arena/playerAccount.ts";

export const FOUNDER_EMAIL = "thien.qn25p0866@gmail.com";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
auth.useDeviceLanguage?.();
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let googleSignInInFlight: Promise<{
  user: User;
  idToken: string;
  isFounder: boolean;
}> | null = null;

export const FALLBACK_WEB_PLAY_URL =
  "https://ais-pre-tpdjbv2vshwdy6lbv3ffbk-123739589644.asia-southeast1.run.app";

export interface FirebaseAuthErrorDetails {
  code: string;
  message: string;
  host: string;
  origin: string;
  protocol: string;
  projectId: string;
  authDomain: string;
  authorizedDomains: string[];
  webAppUrl: string;
  webAppUrls: string[];
  consoleUrl: string;
  isStaleConfig?: boolean;
  liveProjectId?: string;
}

export function resolvePlayableWebUrls(authorizedDomains: string[] = []): string[] {
  const urls: string[] = [];
  const addUrl = (raw: string) => {
    const clean = String(raw || "").trim().replace(/\/+$/, "");
    if (!clean || !/^https?:\/\//i.test(clean)) return;
    if (!urls.includes(clean)) urls.push(clean);
  };
  if (typeof window !== "undefined") {
    const w = window as unknown as { __ARENA_API_URL__?: string };
    if (typeof w.__ARENA_API_URL__ === "string") {
      addUrl(w.__ARENA_API_URL__);
    }
  }
  const appHosts = authorizedDomains
    .filter(
      (d) =>
        typeof d === "string" &&
        d.length > 0 &&
        !d.endsWith(".firebaseapp.com") &&
        !d.endsWith(".web.app")
    )
    .sort((a, b) => {
      const rank = (s: string) =>
        s.startsWith("ais-pre-") ? 0 : s.startsWith("ais-dev-") ? 1 : s.startsWith("ais-mob-") ? 2 : 3;
      return rank(a) - rank(b);
    });
  for (const h of appHosts) {
    addUrl(`https://${h}`);
  }
  addUrl(FALLBACK_WEB_PLAY_URL);
  return urls;
}

export async function fetchLiveAuthorizedDomains(): Promise<string[]> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.authorizedDomains)
      ? data.authorizedDomains.filter((d: unknown): d is string => typeof d === "string" && d.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function buildFirebaseAuthErrorDetails(
  rawCode: string,
  message: string,
  extra?: Partial<FirebaseAuthErrorDetails>
): FirebaseAuthErrorDetails {
  const protocol = typeof window !== "undefined" ? window.location.protocol || "" : "";
  const host =
    typeof window !== "undefined"
      ? window.location.hostname || window.location.host || (protocol === "file:" ? "file:// (tệp cục bộ)" : "")
      : "";
  const origin = typeof window !== "undefined" ? window.location.origin || "" : "";
  const projectId = firebaseConfig.projectId || "";
  const authorizedDomains = Array.isArray(extra?.authorizedDomains) ? extra.authorizedDomains : [];
  const webAppUrls = resolvePlayableWebUrls(authorizedDomains);
  return {
    code: rawCode,
    message,
    host,
    origin,
    protocol,
    projectId,
    authDomain: firebaseConfig.authDomain || "",
    authorizedDomains,
    webAppUrl: webAppUrls[0] || FALLBACK_WEB_PLAY_URL,
    webAppUrls,
    consoleUrl: projectId
      ? `https://console.firebase.google.com/project/${encodeURIComponent(projectId)}/authentication/settings`
      : "https://console.firebase.google.com/",
    ...extra,
  };
}

export function formatFirebaseAuthError(
  err: unknown
): Error & { code?: string; details?: FirebaseAuthErrorDetails } {
  const rawCode =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code || "")
      : "";
  const protocol = typeof window !== "undefined" ? window.location.protocol || "" : "";
  const host =
    typeof window !== "undefined"
      ? window.location.hostname || window.location.host || (protocol === "file:" ? "file:// (tệp cục bộ)" : "")
      : "";
  let message =
    err instanceof Error && err.message
      ? err.message
      : "Đăng nhập Google không thành công. Vui lòng thử lại.";

  switch (rawCode) {
    case "auth/unauthorized-domain":
      if (protocol === "file:") {
        message = `Không thể đăng nhập Google khi mở trực tiếp từ tệp cục bộ (file://). Hãy mở game qua đường dẫn web https:// hoặc máy chủ đã cấp phép (Dự án: ${firebaseConfig.projectId}).`;
      } else {
        message = `Tên miền hiện tại${host ? ` (${host})` : ""} chưa được cấp phép trong Firebase Auth Authorized Domains (Dự án đang nạp: ${firebaseConfig.projectId}).`;
      }
      break;
    case "auth/popup-blocked":
      message = "Trình duyệt đã chặn cửa sổ đăng nhập Google. Vui lòng cho phép mở cửa sổ bật lên (Pop-up) rồi thử lại.";
      break;
    case "auth/popup-closed-by-user":
      message = "Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.";
      break;
    case "auth/cancelled-popup-request":
      message = "Yêu cầu đăng nhập trước đó đã bị hủy do mở cửa sổ mới.";
      break;
    case "auth/operation-not-allowed":
      message = "Phương thức đăng nhập Google chưa được bật trên dự án Firebase.";
      break;
    case "auth/network-request-failed":
      message = "Lỗi kết nối mạng khi đăng nhập Google. Vui lòng kiểm tra Internet và thử lại.";
      break;
    default:
      break;
  }

  const out = new Error(message) as Error & {
    code?: string;
    details?: FirebaseAuthErrorDetails;
  };
  if (rawCode) out.code = rawCode;
  out.details = buildFirebaseAuthErrorDetails(rawCode, message);
  return out;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

if (typeof window !== "undefined") {
  void testConnection();
}

export function isFounderGoogleUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.emailVerified &&
      typeof user.email === "string" &&
      user.email.toLowerCase() === FOUNDER_EMAIL
  );
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInPlayerWithGoogle(): Promise<{
  user: User;
  idToken: string;
  isFounder: boolean;
}> {
  if (googleSignInInFlight) {
    return googleSignInInFlight;
  }
  googleSignInInFlight = (async () => {
    try {
      if (typeof window !== "undefined" && !/^https?:$/i.test(window.location.protocol)) {
        const localErr = formatFirebaseAuthError({ code: "auth/unauthorized-domain" });
        const liveDomains = await fetchLiveAuthorizedDomains();
        if (localErr.details) {
          localErr.details.authorizedDomains = liveDomains;
          const webAppUrls = resolvePlayableWebUrls(liveDomains);
          localErr.details.webAppUrls = webAppUrls;
          localErr.details.webAppUrl = webAppUrls[0] || FALLBACK_WEB_PLAY_URL;
        }
        throw localErr;
      }
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      return {
        user: result.user,
        idToken,
        isFounder: isFounderGoogleUser(result.user),
      };
    } catch (err) {
      const formatted = formatFirebaseAuthError(err);
      if (formatted.code === "auth/unauthorized-domain") {
        if (typeof window !== "undefined" && /^https?:$/i.test(window.location.protocol)) {
          try {
            const res = await fetch(`/firebase-applet-config.json?t=${Date.now()}`, {
              cache: "no-store",
            });
            if (res.ok) {
              const liveCfg = await res.json();
              if (liveCfg?.projectId && liveCfg.projectId !== firebaseConfig.projectId) {
                const staleMsg = `Trình duyệt đang giữ cấu hình Firebase cũ (${firebaseConfig.projectId}) trong khi máy chủ đã chuyển sang dự án mới (${liveCfg.projectId}). Vui lòng bấm "Tải lại trang" để áp dụng cấu hình mới.`;
                const staleErr = new Error(staleMsg) as Error & {
                  code?: string;
                  details?: FirebaseAuthErrorDetails;
                };
                staleErr.code = "auth/unauthorized-domain";
                staleErr.details = buildFirebaseAuthErrorDetails("auth/unauthorized-domain", staleMsg, {
                  isStaleConfig: true,
                  liveProjectId: liveCfg.projectId,
                });
                throw staleErr;
              }
            }
          } catch (refreshCheckErr) {
            if (
              refreshCheckErr instanceof Error &&
              refreshCheckErr.message.includes("cấu hình Firebase cũ")
            ) {
              throw refreshCheckErr;
            }
          }
        }
        const liveDomains = await fetchLiveAuthorizedDomains();
        if (formatted.details) {
          formatted.details.authorizedDomains = liveDomains;
          const webAppUrls = resolvePlayableWebUrls(liveDomains);
          formatted.details.webAppUrls = webAppUrls;
          formatted.details.webAppUrl = webAppUrls[0] || FALLBACK_WEB_PLAY_URL;
        }
      }
      throw formatted;
    } finally {
      googleSignInInFlight = null;
    }
  })();
  return googleSignInInFlight;
}

export async function signOutPlayer(): Promise<void> {
  await signOut(auth);
}

export async function signInFounderWithGoogle(): Promise<{
  user: User;
  idToken: string;
  isFounder: boolean;
}> {
  return signInPlayerWithGoogle();
}

export async function signOutFounderAuth(): Promise<void> {
  await signOut(auth);
}

export async function syncFounderUnlockToFirestore(
  source: string = "backend_pin"
): Promise<boolean> {
  const user = auth.currentUser;
  if (!isFounderGoogleUser(user) || !user) return false;

  const uid = user.uid;
  const profilePath = `founder_profiles/${uid}`;
  const profileRef = doc(db, "founder_profiles", uid);
  const safeDisplayName = (user.displayName || "Thiên · Nhà Sáng Lập").slice(0, 64);
  const safeSource = String(source || "backend_pin").slice(0, 32) || "backend_pin";

  try {
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      await setDoc(profileRef, {
        uid,
        displayName: safeDisplayName,
        founderHeroId: "thien",
        godModeDefault: false,
        unlockCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(profileRef, {
        displayName: safeDisplayName,
        unlockCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }

  const auditPath = `founder_profiles/${uid}/audit_logs`;
  try {
    await addDoc(collection(db, "founder_profiles", uid, "audit_logs"), {
      uid,
      eventType: "UNLOCK_VERIFIED",
      heroId: "thien",
      source: safeSource,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, auditPath);
  }

  return true;
}

export async function logFounderAuditEvent(
  eventType: "UNLOCK_VERIFIED" | "MATCH_STARTED" | "GOD_MODE_TOGGLED",
  source: string = "arena_client"
): Promise<void> {
  const user = auth.currentUser;
  if (!isFounderGoogleUser(user) || !user) return;
  const uid = user.uid;
  const auditPath = `founder_profiles/${uid}/audit_logs`;
  try {
    await addDoc(collection(db, "founder_profiles", uid, "audit_logs"), {
      uid,
      eventType,
      heroId: "thien",
      source: String(source || "arena_client").slice(0, 32),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, auditPath);
  }
}

export interface PublicPlayerDoc {
  uid: string;
  friendCode: string;
  displayName: string;
  displayNameLower: string;
  avatarType: "hero" | "crest" | "google";
  avatarValue: string;
  avatarFrame: string;
  titleBadge: string;
  bio: string;
  favoriteHeroId: string;
  highestWave: number;
  lifetimeKills: number;
  victories: number;
  isFounderBadge: boolean;
  isPublic: boolean;
}

export interface FriendRelationDoc {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  fromFriendCode: string;
  toFriendCode: string;
  status: "pending" | "accepted" | "declined";
  otherProfile?: PublicPlayerDoc | null;
}

export async function fetchPrivatePlayerSave(
  uid: string
): Promise<Partial<ProgressSnapshot> | null> {
  const path = `player_saves/${uid}`;
  try {
    const snap = await getDoc(doc(db, "player_saves", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      coins: Number(d.coins) || 100,
      currentWave: Number(d.currentWave) || 1,
      highestWave: Number(d.highestWave) || 0,
      selectedHeroId: String(d.selectedHeroId || "eohyen"),
      lifetimeKills: Number(d.lifetimeKills) || 0,
      matchesPlayed: Number(d.matchesPlayed) || 0,
      victories: Number(d.victories) || 0,
      dailyCheckInDate: String(d.dailyCheckInDate || ""),
      unlockedTitles: Array.isArray(d.unlockedTitles) ? d.unlockedTitles : [],
      inventoryItemIds: Array.isArray(d.inventoryItemIds) ? d.inventoryItemIds : [],
      heroGearEntries: Array.isArray(d.heroGearEntries) ? d.heroGearEntries : [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function savePrivatePlayerSave(
  uid: string,
  progress: ProgressSnapshot,
  founderUnlocked: boolean
): Promise<void> {
  const path = `player_saves/${uid}`;
  const ref = doc(db, "player_saves", uid);
  const canUseThien = founderUnlocked && isFounderGoogleUser(auth.currentUser);
  const safeHeroId =
    progress.selectedHeroId === "thien" && !canUseThien
      ? "eohyen"
      : String(progress.selectedHeroId || "eohyen").slice(0, 24);
  const highestWave = Math.max(0, Math.min(27, Math.floor(Number(progress.highestWave) || 0)));

  const updateFields = {
    coins: Math.max(0, Math.min(10000000, Math.floor(Number(progress.coins) || 0))),
    currentWave: Math.max(1, Math.min(27, Math.floor(Number(progress.currentWave) || 1))),
    highestWave,
    selectedHeroId: safeHeroId,
    lifetimeKills: Math.max(0, Math.min(100000000, Math.floor(Number(progress.lifetimeKills) || 0))),
    matchesPlayed: Math.max(0, Math.min(1000000, Math.floor(Number(progress.matchesPlayed) || 0))),
    victories: Math.max(0, Math.min(1000000, Math.floor(Number(progress.victories) || 0))),
    dailyCheckInDate: String(progress.dailyCheckInDate || "").slice(0, 16),
    unlockedTitles: computeUnlockedTitles(highestWave, canUseThien).slice(0, 32),
    inventoryItemIds: (progress.inventoryItemIds || [])
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .slice(0, 250),
    heroGearEntries: (progress.heroGearEntries || [])
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .slice(0, 110),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        ...updateFields,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, updateFields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchOwnPublicProfile(uid: string): Promise<PublicPlayerDoc | null> {
  const path = `public_players/${uid}`;
  try {
    const snap = await getDoc(doc(db, "public_players", uid));
    if (!snap.exists()) return null;
    return snap.data() as PublicPlayerDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertPublicPlayerProfile(
  uid: string,
  profile: PlayerProfile,
  founderUnlocked: boolean
): Promise<PublicPlayerDoc> {
  const path = `public_players/${uid}`;
  const ref = doc(db, "public_players", uid);
  const canFounder = founderUnlocked && isFounderGoogleUser(auth.currentUser);
  const safe = sanitizePlayerProfile(profile, { founderUnlocked: canFounder });
  const friendCode = generateFriendCode(uid);
  const favoriteHeroId =
    safe.favoriteHeroId === "thien" && !canFounder ? "eohyen" : safe.favoriteHeroId;

  let avatarType = safe.avatarType;
  let avatarValue = safe.avatarValue;
  if (avatarType === "google") {
    const cleanUrl = sanitizeGooglePhotoUrl(avatarValue || auth.currentUser?.photoURL);
    if (!cleanUrl) {
      avatarType = "hero";
      avatarValue = favoriteHeroId;
    } else {
      avatarValue = cleanUrl;
    }
  }

  const mutableFields = {
    displayName: normalizeDisplayName(safe.displayName, "Chiến Binh"),
    displayNameLower: normalizeDisplayName(safe.displayName, "Chiến Binh").toLowerCase().slice(0, 32),
    avatarType,
    avatarValue: avatarValue.slice(0, 300),
    avatarFrame: safe.avatarFrame.slice(0, 32),
    titleBadge: safe.titleBadge.slice(0, 48),
    bio: safe.bio.slice(0, 120),
    favoriteHeroId: favoriteHeroId.slice(0, 24),
    highestWave: safe.highestWave,
    lifetimeKills: safe.lifetimeKills,
    victories: safe.victories,
    isFounderBadge: Boolean(canFounder),
    isPublic: Boolean(safe.isPublic),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(ref);
    const resolvedFriendCode = snap.exists()
      ? String(snap.data().friendCode || friendCode)
      : friendCode;
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        friendCode: resolvedFriendCode,
        ...mutableFields,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, mutableFields);
    }
    return {
      uid,
      friendCode: resolvedFriendCode,
      displayName: mutableFields.displayName,
      displayNameLower: mutableFields.displayNameLower,
      avatarType: mutableFields.avatarType,
      avatarValue: mutableFields.avatarValue,
      avatarFrame: mutableFields.avatarFrame,
      titleBadge: mutableFields.titleBadge,
      bio: mutableFields.bio,
      favoriteHeroId: mutableFields.favoriteHeroId,
      highestWave: mutableFields.highestWave,
      lifetimeKills: mutableFields.lifetimeKills,
      victories: mutableFields.victories,
      isFounderBadge: mutableFields.isFounderBadge,
      isPublic: mutableFields.isPublic,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function searchPublicPlayers(queryText: string): Promise<PublicPlayerDoc[]> {
  const path = "public_players";
  try {
    const q = query(collection(db, "public_players"), where("isPublic", "==", true), limit(100));
    const snap = await getDocs(q);
    const needle = String(queryText || "").trim().toLowerCase();
    const codeNeedle = String(queryText || "").trim().toUpperCase();
    const list: PublicPlayerDoc[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as PublicPlayerDoc;
      if (!needle) {
        list.push(data);
        return;
      }
      const matchName = (data.displayNameLower || data.displayName || "").toLowerCase().includes(needle);
      const matchCode = (data.friendCode || "").toUpperCase().includes(codeNeedle);
      if (matchName || matchCode) {
        list.push(data);
      }
    });
    return list
      .sort((a, b) => (b.highestWave - a.highestWave) || (b.lifetimeKills - a.lifetimeKills))
      .slice(0, 25);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchLeaderboardTopPlayers(limitCount: number = 20): Promise<PublicPlayerDoc[]> {
  const path = "public_players";
  try {
    const q = query(collection(db, "public_players"), where("isPublic", "==", true), limit(100));
    const snap = await getDocs(q);
    const rows: PublicPlayerDoc[] = [];
    snap.forEach((docSnap) => {
      rows.push(docSnap.data() as PublicPlayerDoc);
    });
    return rows
      .sort(
        (a, b) =>
          (b.highestWave - a.highestWave) ||
          (b.victories - a.victories) ||
          (b.lifetimeKills - a.lifetimeKills)
      )
      .slice(0, limitCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchMyFriendRelations(uid: string): Promise<FriendRelationDoc[]> {
  const path = "friend_requests";
  try {
    const [outSnap, inSnap] = await Promise.all([
      getDocs(query(collection(db, "friend_requests"), where("fromUid", "==", uid), limit(60))),
      getDocs(query(collection(db, "friend_requests"), where("toUid", "==", uid), limit(60))),
    ]);

    const rawMap = new Map<string, FriendRelationDoc>();
    const addRow = (id: string, d: Record<string, unknown>) => {
      rawMap.set(id, {
        id,
        fromUid: String(d.fromUid || ""),
        toUid: String(d.toUid || ""),
        fromName: String(d.fromName || "Chiến Binh"),
        toName: String(d.toName || "Chiến Binh"),
        fromFriendCode: String(d.fromFriendCode || ""),
        toFriendCode: String(d.toFriendCode || ""),
        status: (d.status as "pending" | "accepted" | "declined") || "pending",
      });
    };

    outSnap.forEach((docSnap) => addRow(docSnap.id, docSnap.data()));
    inSnap.forEach((docSnap) => addRow(docSnap.id, docSnap.data()));

    const relations = Array.from(rawMap.values());
    await Promise.all(
      relations.map(async (rel) => {
        const otherUid = rel.fromUid === uid ? rel.toUid : rel.fromUid;
        if (!otherUid) return;
        try {
          const pSnap = await getDoc(doc(db, "public_players", otherUid));
          if (pSnap.exists()) {
            rel.otherProfile = pSnap.data() as PublicPlayerDoc;
          }
        } catch {
        }
      })
    );
    return relations;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function sendFriendRequest(
  myProfile: PlayerProfile,
  targetProfile: PublicPlayerDoc
): Promise<"sent" | "auto_accepted" | "already_friends" | "already_pending"> {
  const user = auth.currentUser;
  if (!user || !targetProfile?.uid || targetProfile.uid === user.uid) {
    throw new Error("Không thể gửi lời mời kết bạn cho chính mình.");
  }
  const pairIds = [user.uid, targetProfile.uid].sort();
  const reqId = `${pairIds[0]}_${pairIds[1]}`.slice(0, 128);
  const path = `friend_requests/${reqId}`;
  const reqRef = doc(db, "friend_requests", reqId);

  try {
    const existingSnap = await getDoc(reqRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData.status === "accepted") return "already_friends";
      if (existingData.status === "pending") {
        if (existingData.toUid === user.uid) {
          await updateDoc(reqRef, {
            status: "accepted",
            updatedAt: serverTimestamp(),
          });
          return "auto_accepted";
        }
        return "already_pending";
      }
      if (existingData.status === "declined") {
        if (existingData.fromUid === user.uid) {
          await updateDoc(reqRef, {
            status: "pending",
            updatedAt: serverTimestamp(),
          });
          return "sent";
        }
        await deleteDoc(reqRef);
      }
    }

    await setDoc(reqRef, {
      fromUid: user.uid,
      toUid: targetProfile.uid,
      fromName: normalizeDisplayName(myProfile.displayName, "Chiến Binh"),
      toName: normalizeDisplayName(targetProfile.displayName, "Chiến Binh"),
      fromFriendCode: String(myProfile.friendCode || generateFriendCode(user.uid)).slice(0, 16),
      toFriendCode: String(targetProfile.friendCode || generateFriendCode(targetProfile.uid)).slice(0, 16),
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return "sent";
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function respondFriendRequest(
  reqId: string,
  status: "accepted" | "declined"
): Promise<void> {
  const path = `friend_requests/${reqId}`;
  try {
    await updateDoc(doc(db, "friend_requests", reqId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeFriendRelation(reqId: string): Promise<void> {
  const path = `friend_requests/${reqId}`;
  try {
    await deleteDoc(doc(db, "friend_requests", reqId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
