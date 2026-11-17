import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, completeGoogleAuthBridgeSignIn } from "../firebase.ts";

export default function GoogleAuthBridge() {
  const [status, setStatus] = useState<"checking" | "ready" | "signing_in" | "done" | "error">("checking");
  const [errorMsg, setErrorMsg] = useState("");
  const sentRef = useRef(false);

  const postSuccessAndClose = async (payload: {
    user: {
      uid: string;
      email: string | null;
      emailVerified: boolean;
      displayName: string | null;
      photoURL: string | null;
    };
    idToken: string;
    expiresAt: number;
  }) => {
    if (sentRef.current) return;
    sentRef.current = true;
    setStatus("done");

    const sid =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("sid") || ""
        : "";

    if (sid) {
      try {
        await fetch("/api/auth-bridge/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sid,
            user: payload.user,
            idToken: payload.idToken,
            expiresAt: payload.expiresAt,
          }),
        });
      } catch {
      }
    }

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "ARENA_AUTH_BRIDGE_RESULT",
            ok: true,
            user: payload.user,
            idToken: payload.idToken,
            expiresAt: payload.expiresAt,
          },
          "*"
        );
      }
    } catch {
    }

    setTimeout(() => {
      try {
        window.close();
      } catch {
      }
    }, 450);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (sentRef.current) return;
      if (fbUser && fbUser.emailVerified) {
        try {
          const res = await completeGoogleAuthBridgeSignIn(false);
          await postSuccessAndClose(res);
          return;
        } catch {
        }
      }
      setStatus("ready");
    });
    return () => unsub();
  }, []);

  const handleSignInClick = async () => {
    setStatus("signing_in");
    setErrorMsg("");
    try {
      const res = await completeGoogleAuthBridgeSignIn(true);
      await postSuccessAndClose(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Không thể đăng nhập Google. Vui lòng thử lại.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleCancel = () => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "ARENA_AUTH_BRIDGE_RESULT",
            ok: false,
            errorCode: "auth/popup-closed-by-user",
          },
          "*"
        );
      }
    } catch {
    }
    try {
      window.close();
    } catch {
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/50 bg-[#0b1325] p-6 shadow-2xl space-y-5 text-center">
        <div className="space-y-1.5">
          <div className="text-[11px] font-moba font-extrabold uppercase tracking-wider text-cyan-300">
            Arena Hero · Xác Thực Google HTTPS
          </div>
          <h1 className="font-title text-xl font-black text-white">
            Kết Nối Tài Khoản Google
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cửa sổ xác thực an toàn giúp bản HTML mở trực tiếp trên trình duyệt (PC &amp; Android) có thể đăng nhập Google và đồng bộ Cloud Save.
          </p>
        </div>

        {status === "checking" && (
          <div className="py-4 text-xs text-cyan-200 font-semibold">
            Đang kiểm tra phiên Google hiện tại...
          </div>
        )}

        {status === "done" && (
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-400/50 p-4 text-xs text-emerald-200 space-y-3">
            <div className="font-bold text-sm text-emerald-100">
              ✓ Đăng nhập Google thành công!
            </div>
            <div>
              Dữ liệu đã được gửi về game. Nếu tab này không tự đóng, bạn hãy quay lại tab game trước đó hoặc bấm nút dưới để chơi ngay trên bản Web HTTPS này:
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="w-full min-h-[42px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-moba text-xs font-black cursor-pointer"
            >
              VÀO GAME NGAY TRÊN WEB HTTPS
            </button>
          </div>
        )}

        {(status === "ready" || status === "signing_in" || status === "error") && (
          <div className="space-y-3">
            {errorMsg && (
              <div className="rounded-xl bg-rose-950/70 border border-rose-500/60 p-3 text-xs text-rose-200 text-left break-words">
                {errorMsg}
              </div>
            )}
            <button
              type="button"
              disabled={status === "signing_in"}
              onClick={handleSignInClick}
              className="w-full min-h-[48px] rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-950 font-moba text-sm font-black flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
            >
              <span>G</span>
              <span>
                {status === "signing_in"
                  ? "ĐANG MỞ GOOGLE..."
                  : "TIẾP TỤC ĐĂNG NHẬP GOOGLE"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-moba font-bold text-slate-200 cursor-pointer"
            >
              Hủy &amp; Quay Lại Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
