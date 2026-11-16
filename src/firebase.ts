import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

export const FOUNDER_EMAIL = "thien.qn25p0866@gmail.com";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

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

export async function signInFounderWithGoogle(): Promise<{
  user: User;
  idToken: string;
  isFounder: boolean;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
    isFounder: isFounderGoogleUser(result.user),
  };
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
