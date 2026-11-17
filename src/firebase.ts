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
  "https://ais-pre-velqkihk7ko76ucfgbtodf-643309268932.asia-east1.run.app";

const BRIDGED_AUTH_STORAGE_KEY = "arena_hero_bridged_google_v1";

export interface BridgedGoogleUserSnapshot {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

interface BridgedGoogleSession {
  user: BridgedGoogleUserSnapshot;
  idToken: string;
  expiresAt: number;
}

let cachedLiveAuthorizedDomains: string[] = [];
const authStateListeners = new Set<(user: User | null) => void>();
let lastSdkAuthUser: User | null = null;

function isLocalFileProtocolEnv(): boolean {
  if (typeof window === "undefined") return false;
  return !/^https?:$/i.test(window.location.protocol || "");
}

function loadBridgedSession(): BridgedGoogleSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage?.getItem(BRIDGED_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BridgedGoogleSession>;
    if (
      !parsed ||
      typeof parsed.idToken !== "string" ||
      !parsed.idToken ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now() + 15_000 ||
      !parsed.user?.uid
    ) {
      window.localStorage?.removeItem(BRIDGED_AUTH_STORAGE_KEY);
      return null;
    }
    return {
      idToken: parsed.idToken,
      expiresAt: parsed.expiresAt,
      user: {
        uid: String(parsed.user.uid),
        email: parsed.user.email ? String(parsed.user.email) : null,
        emailVerified: Boolean(parsed.user.emailVerified),
        displayName: parsed.user.displayName ? String(parsed.user.displayName) : null,
        photoURL: parsed.user.photoURL ? String(parsed.user.photoURL) : null,
      },
    };
  } catch {
    return null;
  }
}

function saveBridgedSession(session: BridgedGoogleSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      window.localStorage?.removeItem(BRIDGED_AUTH_STORAGE_KEY);
    } else {
      window.localStorage?.setItem(BRIDGED_AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
  }
}

function toPseudoFirebaseUser(session: BridgedGoogleSession): User {
  const u = session.user;
  return {
    uid: u.uid,
    email: u.email,
    emailVerified: u.emailVerified,
    displayName: u.displayName,
    photoURL: u.photoURL,
    isAnonymous: false,
    tenantId: null,
    providerData: [
      {
        providerId: "google.com",
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        phoneNumber: null,
        photoURL: u.photoURL,
      },
    ],
    getIdToken: async () => session.idToken,
  } as unknown as User;
}

function getEffectiveCurrentUser(): User | null {
  if (auth.currentUser) return auth.currentUser;
  if (lastSdkAuthUser) return lastSdkAuthUser;
  const bridged = loadBridgedSession();
  return bridged ? toPseudoFirebaseUser(bridged) : null;
}

function emitAuthStateChange(user: User | null): void {
  for (const cb of authStateListeners) {
    try {
      cb(user);
    } catch {
    }
  }
}

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

let verifiedReachableBridgeOrigin = "";

async function probeReachableBridgeOrigin(): Promise<string> {
  if (verifiedReachableBridgeOrigin) return verifiedReachableBridgeOrigin;
  const domains = await fetchLiveAuthorizedDomains();
  const candidates = resolvePlayableWebUrls(domains).filter(
    (u) => !/^https?:\/\/ais-dev-/i.test(u.replace(/\/+$/, ""))
  );
  for (const base of candidates) {
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
      const res = await fetch(`${base.replace(/\/+$/, "")}/api/health`, {
        cache: "no-store",
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (timer) clearTimeout(timer);
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.ok === true) {
          verifiedReachableBridgeOrigin = base.replace(/\/+$/, "");
          return verifiedReachableBridgeOrigin;
        }
      }
    } catch {
    }
  }
  return "";
}

export function resolvePlayableWebUrls(authorizedDomains: string[] = []): string[] {
  const urls: string[] = [];
  const addUrl = (raw: string) => {
    const clean = String(raw || "").trim().replace(/\/+$/, "");
    if (!clean || !/^https?:\/\//i.test(clean)) return;
    if (!urls.includes(clean)) urls.push(clean);
  };
  if (verifiedReachableBridgeOrigin) {
    addUrl(verifiedReachableBridgeOrigin);
  }
  if (typeof window !== "undefined") {
    const w = window as unknown as {
      __ARENA_AUTH_URL__?: string;
      __ARENA_AUTH_URLS__?: string[];
      __ARENA_API_URL__?: string;
    };
    if (typeof w.__ARENA_AUTH_URL__ === "string" && !/^https?:\/\/ais-dev-/i.test(w.__ARENA_AUTH_URL__)) {
      addUrl(w.__ARENA_AUTH_URL__);
    }
    if (Array.isArray(w.__ARENA_AUTH_URLS__)) {
      for (const item of w.__ARENA_AUTH_URLS__) {
        if (typeof item === "string" && !/^https?:\/\/ais-dev-/i.test(item)) {
          addUrl(item);
        }
      }
    }
    if (typeof w.__ARENA_API_URL__ === "string" && !/^https?:\/\/ais-dev-/i.test(w.__ARENA_API_URL__)) {
      addUrl(w.__ARENA_API_URL__);
    }
    if (/^https?:$/i.test(window.location.protocol || "") && window.location.origin) {
      addUrl(window.location.origin);
    }
  }
  const mergedDomains =
    authorizedDomains.length > 0 ? authorizedDomains : cachedLiveAuthorizedDomains;
  const appHosts = mergedDomains
    .filter(
      (d) =>
        typeof d === "string" &&
        d.length > 0 &&
        !d.endsWith(".firebaseapp.com") &&
        !d.endsWith(".web.app") &&
        !d.startsWith("ais-dev-")
    )
    .sort((a, b) => {
      const rank = (s: string) =>
        s.startsWith("ais-pre-") ? 0 : s.startsWith("ais-mob-") ? 1 : 2;
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
    const list = Array.isArray(data?.authorizedDomains)
      ? data.authorizedDomains.filter((d: unknown): d is string => typeof d === "string" && d.length > 0)
      : [];
    if (list.length > 0) {
      cachedLiveAuthorizedDomains = list;
    }
    return list;
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
  const authorizedDomains = Array.isArray(extra?.authorizedDomains)
    ? extra.authorizedDomains
    : cachedLiveAuthorizedDomains;
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
  const isLocalFile = Boolean(protocol && !/^https?:$/i.test(protocol));
  const host =
    typeof window !== "undefined"
      ? window.location.hostname || window.location.host || (isLocalFile ? `${protocol} (tệp cục bộ)` : "")
      : "";
  let message =
    err instanceof Error && err.message
      ? err.message
      : "Đăng nhập Google không thành công. Vui lòng thử lại.";

  switch (rawCode) {
    case "auth/bridge-unavailable":
      message =
        "File HTML mở cục bộ cần đường dẫn Web HTTPS công khai (Shared App URL) đã xuất bản để mở cửa sổ Đăng nhập Google. Hiện trang chia sẻ công khai chưa được bật (404). Hãy bấm Share/Publish ứng dụng trên AI Studio, hoặc đăng nhập Google trực tiếp trên bản Web trong AI Studio.";
      break;
    case "auth/bridge-ready-retry":
      message =
        "Đã tìm thấy máy chủ xác thực HTTPS! Vui lòng bấm lại nút 'ĐĂNG NHẬP BẰNG GOOGLE' một lần nữa để mở cửa sổ đăng nhập.";
      break;
    case "auth/unauthorized-domain":
      if (isLocalFile) {
        message = `Không thể mở cửa sổ xác thực Google từ tệp cục bộ (${protocol || "file:"}). Hãy cho phép Pop-up hoặc mở trực tiếp bản Web HTTPS bên dưới (Dự án: ${firebaseConfig.projectId}).`;
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
  const activeUser = getEffectiveCurrentUser();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: activeUser?.uid,
      email: activeUser?.email,
      emailVerified: activeUser?.emailVerified,
      isAnonymous: activeUser?.isAnonymous,
      tenantId: activeUser?.tenantId,
      providerInfo:
        activeUser?.providerData?.map((provider) => ({
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
  if (isLocalFileProtocolEnv()) return;
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
  if (isLocalFileProtocolEnv()) {
    void probeReachableBridgeOrigin();
  }
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
  authStateListeners.add(callback);
  if (isLocalFileProtocolEnv()) {
    const bridged = loadBridgedSession();
    if (bridged) {
      queueMicrotask(() => callback(toPseudoFirebaseUser(bridged)));
    } else {
      queueMicrotask(() => callback(null));
    }
  }
  const unsubSdk = onAuthStateChanged(auth, (fbUser) => {
    lastSdkAuthUser = fbUser;
    if (fbUser) {
      callback(fbUser);
    } else if (!isLocalFileProtocolEnv()) {
      callback(null);
    } else {
      const bridged = loadBridgedSession();
      callback(bridged ? toPseudoFirebaseUser(bridged) : null);
    }
  });
  return () => {
    authStateListeners.delete(callback);
    unsubSdk();
  };
}

function isAllowedBridgeOrigin(origin: string): boolean {
  if (!origin || !/^https:\/\//i.test(origin)) return false;
  const known = resolvePlayableWebUrls();
  for (const url of known) {
    try {
      if (new URL(url).origin === origin) return true;
    } catch {
    }
  }
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    if (
      hostname.endsWith(".run.app") ||
      hostname.endsWith(".firebaseapp.com") ||
      hostname.endsWith(".web.app")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function generateBridgeSid(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function signInViaHttpsBridgeSync(): Promise<{
  user: User;
  idToken: string;
  isFounder: boolean;
}> {
  if (typeof window === "undefined") {
    return Promise.reject(formatFirebaseAuthError({ code: "auth/unauthorized-domain" }));
  }

  const urls = resolvePlayableWebUrls();
  const bridgeBase = (urls[0] || FALLBACK_WEB_PLAY_URL).replace(/\/+$/, "");
  const sid = generateBridgeSid();
  const bridgeUrl = `${bridgeBase}/?arena_auth_bridge=1&sid=${encodeURIComponent(sid)}`;

  let popup: Window | null = null;
  try {
    popup = window.open(
      bridgeUrl,
      "arena_google_auth_bridge",
      "width=500,height=680,menubar=no,toolbar=no,location=yes,status=no"
    );
  } catch {
    popup = null;
  }

  if (!popup) {
    const blockedErr = formatFirebaseAuthError({ code: "auth/popup-blocked" });
    return Promise.reject(blockedErr);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let closeCheckTimer: ReturnType<typeof setInterval> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let closeGraceTimer: ReturnType<typeof setTimeout> | null = null;
    let overallTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (closeCheckTimer) clearInterval(closeCheckTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (closeGraceTimer) clearTimeout(closeGraceTimer);
      if (overallTimer) clearTimeout(overallTimer);
    };

    const completeWithAuthPayload = (payload: {
      user: BridgedGoogleUserSnapshot;
      idToken: string;
      expiresAt?: number;
    }) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        popup?.close();
      } catch {
      }
      const session: BridgedGoogleSession = {
        idToken: String(payload.idToken),
        expiresAt:
          typeof payload.expiresAt === "number"
            ? payload.expiresAt
            : Date.now() + 50 * 60 * 1000,
        user: {
          uid: String(payload.user.uid),
          email: payload.user.email ? String(payload.user.email) : null,
          emailVerified: Boolean(payload.user.emailVerified),
          displayName: payload.user.displayName ? String(payload.user.displayName) : null,
          photoURL: payload.user.photoURL ? String(payload.user.photoURL) : null,
        },
      };
      saveBridgedSession(session);
      const pseudoUser = toPseudoFirebaseUser(session);
      emitAuthStateChange(pseudoUser);
      resolve({
        user: pseudoUser,
        idToken: session.idToken,
        isFounder: isFounderGoogleUser(pseudoUser),
      });
    };

    const failWith = async (rawErr: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      const formatted = formatFirebaseAuthError(rawErr);
      const liveDomains = await fetchLiveAuthorizedDomains();
      if (formatted.details && liveDomains.length > 0) {
        formatted.details.authorizedDomains = liveDomains;
        const webAppUrls = resolvePlayableWebUrls(liveDomains);
        formatted.details.webAppUrls = webAppUrls;
        formatted.details.webAppUrl = webAppUrls[0] || FALLBACK_WEB_PLAY_URL;
      }
      reject(formatted);
    };

    const onMessage = (event: MessageEvent) => {
      if (!event?.data || event.data.type !== "ARENA_AUTH_BRIDGE_RESULT") return;
      if (!isAllowedBridgeOrigin(event.origin)) return;

      if (event.data.ok && event.data.idToken && event.data.user?.uid) {
        completeWithAuthPayload({
          user: event.data.user,
          idToken: event.data.idToken,
          expiresAt: event.data.expiresAt,
        });
        return;
      }

      void failWith({
        code: event.data.errorCode || "auth/popup-closed-by-user",
        message: event.data.errorMessage || undefined,
      });
    };

    window.addEventListener("message", onMessage);

    const pollRelayOnce = async () => {
      if (settled) return;
      try {
        const res = await fetch(
          `${bridgeBase}/api/auth-bridge/poll?sid=${encodeURIComponent(sid)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.pending === false && data.idToken && data.user?.uid) {
          completeWithAuthPayload({
            user: data.user,
            idToken: data.idToken,
            expiresAt: data.expiresAt,
          });
        }
      } catch {
      }
    };

    pollTimer = setInterval(() => {
      void pollRelayOnce();
    }, 1200);

    closeCheckTimer = setInterval(() => {
      if (settled) return;
      try {
        if (popup && popup.closed) {
          if (!closeGraceTimer) {
            void pollRelayOnce();
            closeGraceTimer = setTimeout(async () => {
              await pollRelayOnce();
              if (!settled) {
                void failWith({ code: "auth/popup-closed-by-user" });
              }
            }, 900);
          }
        }
      } catch {
      }
    }, 350);

    overallTimer = setTimeout(() => {
      void failWith({
        code: "auth/network-request-failed",
        message: "Quá thời gian chờ xác thực Google qua cầu nối HTTPS. Vui lòng thử lại hoặc mở thẳng bản Web HTTPS.",
      });
    }, 180_000);
  });
}

export async function completeGoogleAuthBridgeSignIn(interactive = true): Promise<{
  user: BridgedGoogleUserSnapshot;
  idToken: string;
  expiresAt: number;
}> {
  const existing = auth.currentUser;
  if (existing && existing.emailVerified) {
    const idToken = await existing.getIdToken(true);
    return {
      user: {
        uid: existing.uid,
        email: existing.email,
        emailVerified: existing.emailVerified,
        displayName: existing.displayName,
        photoURL: existing.photoURL,
      },
      idToken,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };
  }
  if (!interactive) {
    throw new Error("NOT_SIGNED_IN");
  }
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken(true);
  return {
    user: {
      uid: result.user.uid,
      email: result.user.email,
      emailVerified: result.user.emailVerified,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    },
    idToken,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };
}

export async function signInPlayerWithGoogle(): Promise<{
  user: User;
  idToken: string;
  isFounder: boolean;
}> {
  if (googleSignInInFlight) {
    return googleSignInInFlight;
  }

  if (isLocalFileProtocolEnv()) {
    if (verifiedReachableBridgeOrigin) {
      const promise = signInViaHttpsBridgeSync().finally(() => {
        googleSignInInFlight = null;
      });
      googleSignInInFlight = promise;
      return promise;
    }
    const probePromise = (async () => {
      const found = await probeReachableBridgeOrigin();
      if (found) {
        throw formatFirebaseAuthError({ code: "auth/bridge-ready-retry" });
      }
      throw formatFirebaseAuthError({ code: "auth/bridge-unavailable" });
    })().finally(() => {
      googleSignInInFlight = null;
    });
    googleSignInInFlight = probePromise;
    return probePromise;
  }

  googleSignInInFlight = (async () => {
    try {
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
  saveBridgedSession(null);
  if (isLocalFileProtocolEnv()) {
    emitAuthStateChange(null);
    return;
  }
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
  await signOutPlayer();
}

// ---------------------------------------------------------------------------
// Firestore REST API fallback for bridged file:// sessions
// ---------------------------------------------------------------------------

function getActiveBridgedToken(): BridgedGoogleSession | null {
  if (auth.currentUser) return null;
  if (!isLocalFileProtocolEnv()) return null;
  return loadBridgedSession();
}

function firestoreDocResourceName(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  return `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${clean}`;
}

function firestoreRestEndpoint(relativePath = ""): string {
  const clean = relativePath.replace(/^\/+/, "");
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(firebaseConfig.firestoreDatabaseId)}/documents`;
  return clean ? `${base}/${clean}` : base;
}

type FirestoreRestValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreRestValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreRestValue> } };

function toRestValue(val: unknown): FirestoreRestValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => toRestValue(item)) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, FirestoreRestValue> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = toRestValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toRestFields(obj: Record<string, unknown>): Record<string, FirestoreRestValue> {
  const fields: Record<string, FirestoreRestValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toRestValue(v);
  }
  return fields;
}

function fromRestValue(val: FirestoreRestValue | undefined): unknown {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return Boolean(val.booleanValue);
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map((v) => fromRestValue(v))
      : [];
  }
  if ("mapValue" in val) {
    return fromRestFields(val.mapValue?.fields);
  }
  return null;
}

function fromRestFields(fields?: Record<string, FirestoreRestValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromRestValue(v);
  }
  return out;
}

async function firestoreRestFetch(url: string, idToken: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) {
    saveBridgedSession(null);
    emitAuthStateChange(null);
    throw new Error("Phiên đăng nhập Google đã hết hạn. Vui lòng bấm Đăng nhập lại.");
  }
  return res;
}

async function firestoreRestGetDoc(
  relativePath: string,
  idToken: string
): Promise<Record<string, unknown> | null> {
  const res = await firestoreRestFetch(firestoreRestEndpoint(relativePath), idToken, {
    method: "GET",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return fromRestFields(data?.fields);
}

async function firestoreRestWriteWithServerTime(
  relativePath: string,
  idToken: string,
  fields: Record<string, unknown>,
  serverTimeFields: string[],
  updateMaskFields?: string[],
  incrementFields?: Record<string, number>
): Promise<void> {
  const commitUrl = `${firestoreRestEndpoint()}:commit`;
  const docName = firestoreDocResourceName(relativePath);
  const fieldTransforms: Array<Record<string, unknown>> = serverTimeFields.map((fieldPath) => ({
    fieldPath,
    setToServerValue: "REQUEST_TIME",
  }));
  if (incrementFields) {
    for (const [fieldPath, delta] of Object.entries(incrementFields)) {
      fieldTransforms.push({
        fieldPath,
        increment: { integerValue: String(Math.round(delta)) },
      });
    }
  }

  const writeOp: Record<string, unknown> = {
    update: {
      name: docName,
      fields: toRestFields(fields),
    },
    updateTransforms: fieldTransforms,
  };
  if (updateMaskFields && updateMaskFields.length > 0) {
    writeOp.updateMask = { fieldPaths: updateMaskFields };
  }

  const res = await firestoreRestFetch(commitUrl, idToken, {
    method: "POST",
    body: JSON.stringify({ writes: [writeOp] }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `HTTP ${res.status}`);
  }
}

async function firestoreRestDeleteDoc(relativePath: string, idToken: string): Promise<void> {
  const res = await firestoreRestFetch(firestoreRestEndpoint(relativePath), idToken, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `HTTP ${res.status}`);
  }
}

async function firestoreRestRunQuery(
  collectionId: string,
  fieldPath: string,
  value: string | boolean,
  limitCount: number,
  idToken: string
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const queryUrl = `${firestoreRestEndpoint()}:runQuery`;
  const res = await firestoreRestFetch(queryUrl, idToken, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: "EQUAL",
            value: typeof value === "boolean" ? { booleanValue: value } : { stringValue: value },
          },
        },
        limit: limitCount,
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || `HTTP ${res.status}`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  const out: Array<{ id: string; data: Record<string, unknown> }> = [];
  for (const row of rows) {
    if (!row?.document?.name) continue;
    const parts = String(row.document.name).split("/");
    const id = parts[parts.length - 1] || "";
    out.push({
      id,
      data: fromRestFields(row.document.fields),
    });
  }
  return out;
}

const docWriteQueues = new Map<string, Promise<unknown>>();

function withDocWriteLock<T>(docKey: string, task: () => Promise<T>): Promise<T> {
  const prev = docWriteQueues.get(docKey) || Promise.resolve();
  const next = prev.catch(() => {}).then(task);
  const cleanup = next.finally(() => {
    if (docWriteQueues.get(docKey) === cleanup) {
      docWriteQueues.delete(docKey);
    }
  });
  docWriteQueues.set(docKey, cleanup);
  return next;
}

async function getDocServerOrCache(ref: ReturnType<typeof doc>) {
  try {
    return await getDocFromServer(ref);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes("offline") || msg.includes("unavailable") || msg.includes("failed to get document from server")) {
      return await getDoc(ref);
    }
    throw err;
  }
}

export async function syncFounderUnlockToFirestore(
  source: string = "backend_pin"
): Promise<boolean> {
  const user = getEffectiveCurrentUser();
  if (!isFounderGoogleUser(user) || !user) return false;

  const uid = user.uid;
  const profilePath = `founder_profiles/${uid}`;
  const safeDisplayName = (user.displayName || "Thiên · Nhà Sáng Lập").slice(0, 64);
  const safeSource = String(source || "backend_pin").slice(0, 32) || "backend_pin";
  const bridged = getActiveBridgedToken();

  return withDocWriteLock(profilePath, async () => {
    if (bridged) {
      try {
        const existing = await firestoreRestGetDoc(profilePath, bridged.idToken);
        if (!existing) {
          await firestoreRestWriteWithServerTime(
            profilePath,
            bridged.idToken,
            {
              uid,
              displayName: safeDisplayName,
              founderHeroId: "thien",
              godModeDefault: false,
              unlockCount: 1,
            },
            ["createdAt", "updatedAt"]
          );
        } else {
          await firestoreRestWriteWithServerTime(
            profilePath,
            bridged.idToken,
            { displayName: safeDisplayName },
            ["updatedAt"],
            ["displayName", "unlockCount", "updatedAt"],
            { unlockCount: 1 }
          );
        }
        const logId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        await firestoreRestWriteWithServerTime(
          `founder_profiles/${uid}/audit_logs/${logId}`,
          bridged.idToken,
          {
            uid,
            eventType: "UNLOCK_VERIFIED",
            heroId: "thien",
            source: safeSource,
          },
          ["createdAt"]
        );
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, profilePath);
      }
    }

    const profileRef = doc(db, "founder_profiles", uid);
    try {
      const snap = await getDocServerOrCache(profileRef);
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
  });
}

export async function logFounderAuditEvent(
  eventType: "UNLOCK_VERIFIED" | "MATCH_STARTED" | "GOD_MODE_TOGGLED",
  source: string = "arena_client"
): Promise<void> {
  const user = getEffectiveCurrentUser();
  if (!isFounderGoogleUser(user) || !user) return;
  const uid = user.uid;
  const auditPath = `founder_profiles/${uid}/audit_logs`;
  const bridged = getActiveBridgedToken();

  if (bridged) {
    try {
      const logId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      await firestoreRestWriteWithServerTime(
        `founder_profiles/${uid}/audit_logs/${logId}`,
        bridged.idToken,
        {
          uid,
          eventType,
          heroId: "thien",
          source: String(source || "arena_client").slice(0, 32),
        },
        ["createdAt"]
      );
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, auditPath);
    }
  }

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
  const bridged = getActiveBridgedToken();
  try {
    const d = bridged
      ? await firestoreRestGetDoc(path, bridged.idToken)
      : await (async () => {
          const snap = await getDoc(doc(db, "player_saves", uid));
          return snap.exists() ? snap.data() : null;
        })();
    if (!d) return null;
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
  const activeUser = getEffectiveCurrentUser();
  const canUseThien = founderUnlocked && isFounderGoogleUser(activeUser);
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
  };

  const bridged = getActiveBridgedToken();
  return withDocWriteLock(path, async () => {
    if (bridged) {
      try {
        const existing = await firestoreRestGetDoc(path, bridged.idToken);
        if (!existing) {
          await firestoreRestWriteWithServerTime(
            path,
            bridged.idToken,
            { uid, ...updateFields },
            ["createdAt", "updatedAt"]
          );
        } else {
          await firestoreRestWriteWithServerTime(
            path,
            bridged.idToken,
            updateFields,
            ["updatedAt"],
            [...Object.keys(updateFields), "updatedAt"]
          );
        }
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    const ref = doc(db, "player_saves", uid);
    try {
      const snap = await getDocServerOrCache(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid,
          ...updateFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          ...updateFields,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  });
}

export async function fetchOwnPublicProfile(uid: string): Promise<PublicPlayerDoc | null> {
  const path = `public_players/${uid}`;
  const bridged = getActiveBridgedToken();
  try {
    if (bridged) {
      const data = await firestoreRestGetDoc(path, bridged.idToken);
      return data ? (data as unknown as PublicPlayerDoc) : null;
    }
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
  const activeUser = getEffectiveCurrentUser();
  const canFounder = founderUnlocked && isFounderGoogleUser(activeUser);
  const safe = sanitizePlayerProfile(profile, { founderUnlocked: canFounder });
  const friendCode = generateFriendCode(uid);
  const favoriteHeroId =
    safe.favoriteHeroId === "thien" && !canFounder ? "eohyen" : safe.favoriteHeroId;

  let avatarType = safe.avatarType;
  let avatarValue = safe.avatarValue;
  if (avatarType === "google") {
    const cleanUrl = sanitizeGooglePhotoUrl(avatarValue || activeUser?.photoURL);
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
  };

  const bridged = getActiveBridgedToken();
  return withDocWriteLock(path, async () => {
    if (bridged) {
      try {
        const existing = await firestoreRestGetDoc(path, bridged.idToken);
        const resolvedFriendCode = existing
          ? String(existing.friendCode || friendCode)
          : friendCode;
        if (!existing) {
          await firestoreRestWriteWithServerTime(
            path,
            bridged.idToken,
            { uid, friendCode: resolvedFriendCode, ...mutableFields },
            ["createdAt", "updatedAt"]
          );
        } else {
          await firestoreRestWriteWithServerTime(
            path,
            bridged.idToken,
            mutableFields,
            ["updatedAt"],
            [...Object.keys(mutableFields), "updatedAt"]
          );
        }
        return {
          uid,
          friendCode: resolvedFriendCode,
          ...mutableFields,
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    const ref = doc(db, "public_players", uid);
    try {
      const snap = await getDocServerOrCache(ref);
      const resolvedFriendCode = snap.exists()
        ? String(snap.data().friendCode || friendCode)
        : friendCode;
      if (!snap.exists()) {
        await setDoc(ref, {
          uid,
          friendCode: resolvedFriendCode,
          ...mutableFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          ...mutableFields,
          updatedAt: serverTimestamp(),
        });
      }
      return {
        uid,
        friendCode: resolvedFriendCode,
        ...mutableFields,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  });
}

export async function searchPublicPlayers(queryText: string): Promise<PublicPlayerDoc[]> {
  const path = "public_players";
  const bridged = getActiveBridgedToken();
  try {
    const docsList: PublicPlayerDoc[] = bridged
      ? (await firestoreRestRunQuery("public_players", "isPublic", true, 100, bridged.idToken)).map(
          (r) => r.data as unknown as PublicPlayerDoc
        )
      : await (async () => {
          const q = query(collection(db, "public_players"), where("isPublic", "==", true), limit(100));
          const snap = await getDocs(q);
          const rows: PublicPlayerDoc[] = [];
          snap.forEach((docSnap) => rows.push(docSnap.data() as PublicPlayerDoc));
          return rows;
        })();

    const needle = String(queryText || "").trim().toLowerCase();
    const codeNeedle = String(queryText || "").trim().toUpperCase();
    const list: PublicPlayerDoc[] = [];
    for (const data of docsList) {
      if (!needle) {
        list.push(data);
        continue;
      }
      const matchName = (data.displayNameLower || data.displayName || "").toLowerCase().includes(needle);
      const matchCode = (data.friendCode || "").toUpperCase().includes(codeNeedle);
      if (matchName || matchCode) {
        list.push(data);
      }
    }
    return list
      .sort((a, b) => (b.highestWave - a.highestWave) || (b.lifetimeKills - a.lifetimeKills))
      .slice(0, 25);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchLeaderboardTopPlayers(limitCount: number = 20): Promise<PublicPlayerDoc[]> {
  const path = "public_players";
  const bridged = getActiveBridgedToken();
  try {
    const rows: PublicPlayerDoc[] = bridged
      ? (await firestoreRestRunQuery("public_players", "isPublic", true, 100, bridged.idToken)).map(
          (r) => r.data as unknown as PublicPlayerDoc
        )
      : await (async () => {
          const q = query(collection(db, "public_players"), where("isPublic", "==", true), limit(100));
          const snap = await getDocs(q);
          const out: PublicPlayerDoc[] = [];
          snap.forEach((docSnap) => out.push(docSnap.data() as PublicPlayerDoc));
          return out;
        })();
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
  const bridged = getActiveBridgedToken();
  try {
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

    if (bridged) {
      const [outRows, inRows] = await Promise.all([
        firestoreRestRunQuery("friend_requests", "fromUid", uid, 60, bridged.idToken),
        firestoreRestRunQuery("friend_requests", "toUid", uid, 60, bridged.idToken),
      ]);
      for (const r of outRows) addRow(r.id, r.data);
      for (const r of inRows) addRow(r.id, r.data);
    } else {
      const [outSnap, inSnap] = await Promise.all([
        getDocs(query(collection(db, "friend_requests"), where("fromUid", "==", uid), limit(60))),
        getDocs(query(collection(db, "friend_requests"), where("toUid", "==", uid), limit(60))),
      ]);
      outSnap.forEach((docSnap) => addRow(docSnap.id, docSnap.data()));
      inSnap.forEach((docSnap) => addRow(docSnap.id, docSnap.data()));
    }

    const relations = Array.from(rawMap.values());
    await Promise.all(
      relations.map(async (rel) => {
        const otherUid = rel.fromUid === uid ? rel.toUid : rel.fromUid;
        if (!otherUid) return;
        try {
          if (bridged) {
            const pData = await firestoreRestGetDoc(`public_players/${otherUid}`, bridged.idToken);
            if (pData) rel.otherProfile = pData as unknown as PublicPlayerDoc;
          } else {
            const pSnap = await getDoc(doc(db, "public_players", otherUid));
            if (pSnap.exists()) {
              rel.otherProfile = pSnap.data() as PublicPlayerDoc;
            }
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
  const user = getEffectiveCurrentUser();
  if (!user || !targetProfile?.uid || targetProfile.uid === user.uid) {
    throw new Error("Không thể gửi lời mời kết bạn cho chính mình.");
  }
  const pairIds = [user.uid, targetProfile.uid].sort();
  const reqId = `${pairIds[0]}_${pairIds[1]}`.slice(0, 128);
  const path = `friend_requests/${reqId}`;
  const bridged = getActiveBridgedToken();

  if (bridged) {
    try {
      const existingData = await firestoreRestGetDoc(path, bridged.idToken);
      if (existingData) {
        if (existingData.status === "accepted") return "already_friends";
        if (existingData.status === "pending") {
          if (existingData.toUid === user.uid) {
            await firestoreRestWriteWithServerTime(
              path,
              bridged.idToken,
              { status: "accepted" },
              ["updatedAt"],
              ["status", "updatedAt"]
            );
            return "auto_accepted";
          }
          return "already_pending";
        }
        if (existingData.status === "declined") {
          if (existingData.fromUid === user.uid) {
            await firestoreRestWriteWithServerTime(
              path,
              bridged.idToken,
              { status: "pending" },
              ["updatedAt"],
              ["status", "updatedAt"]
            );
            return "sent";
          }
          await firestoreRestDeleteDoc(path, bridged.idToken);
        }
      }

      await firestoreRestWriteWithServerTime(
        path,
        bridged.idToken,
        {
          fromUid: user.uid,
          toUid: targetProfile.uid,
          fromName: normalizeDisplayName(myProfile.displayName, "Chiến Binh"),
          toName: normalizeDisplayName(targetProfile.displayName, "Chiến Binh"),
          fromFriendCode: String(myProfile.friendCode || generateFriendCode(user.uid)).slice(0, 16),
          toFriendCode: String(targetProfile.friendCode || generateFriendCode(targetProfile.uid)).slice(0, 16),
          status: "pending",
        },
        ["createdAt", "updatedAt"]
      );
      return "sent";
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

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
  const bridged = getActiveBridgedToken();
  try {
    if (bridged) {
      await firestoreRestWriteWithServerTime(
        path,
        bridged.idToken,
        { status },
        ["updatedAt"],
        ["status", "updatedAt"]
      );
      return;
    }
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
  const bridged = getActiveBridgedToken();
  try {
    if (bridged) {
      await firestoreRestDeleteDoc(path, bridged.idToken);
      return;
    }
    await deleteDoc(doc(db, "friend_requests", reqId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
