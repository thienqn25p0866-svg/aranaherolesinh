import React from "react";
import { FALLBACK_WEB_PLAY_URL } from "../firebase.ts";

export default function AuthErrorBanner({
  lang = "vi",
  authError = "",
  authDetails = null,
  onClear,
  onCopyText,
  compact = false,
  align = "left",
}) {
  if (!authError) return null;
  const isVi = lang === "vi";
  const currentProtocol =
    authDetails?.protocol ||
    (typeof window !== "undefined" ? window.location.protocol || "" : "");
  const isBridgeUnavailable = authDetails?.code === "auth/bridge-unavailable";
  const isBridgeRetry = authDetails?.code === "auth/bridge-ready-retry";
  const isFileProtocol = Boolean(currentProtocol && !/^https?:$/i.test(currentProtocol));
  const isUnauthorizedDomain =
    !isBridgeUnavailable &&
    !isBridgeRetry &&
    (authDetails?.code === "auth/unauthorized-domain" ||
      authError.includes("Authorized Domains") ||
      authError.includes("file://") ||
      isFileProtocol);
  const isStaleConfig =
    Boolean(authDetails?.isStaleConfig) || authError.includes("cấu hình");
  const currentHost =
    authDetails?.host ||
    (typeof window !== "undefined"
      ? window.location.hostname || window.location.host || (isFileProtocol ? "file:// (tệp cục bộ)" : window.location.origin)
      : "");
  const projectId = authDetails?.projectId || "";
  const authorizedDomains = Array.isArray(authDetails?.authorizedDomains)
    ? authDetails.authorizedDomains
    : [];
  const webAppUrl = authDetails?.webAppUrl || FALLBACK_WEB_PLAY_URL;
  const webAppUrls =
    Array.isArray(authDetails?.webAppUrls) && authDetails.webAppUrls.length > 0
      ? authDetails.webAppUrls
      : [webAppUrl];
  const consoleUrl =
    authDetails?.consoleUrl ||
    (projectId
      ? `https://console.firebase.google.com/project/${encodeURIComponent(projectId)}/authentication/settings`
      : "https://console.firebase.google.com/");

  const boxClass = isBridgeRetry
    ? "bg-emerald-950/65 border-emerald-400/65 text-emerald-100"
    : isFileProtocol
    ? "bg-amber-950/65 border-amber-400/65 text-amber-100"
    : "bg-rose-950/75 border-rose-500/65 text-rose-100";

  return (
    <div
      className={`rounded-xl border text-xs leading-relaxed select-text ${boxClass} ${
        compact ? "p-2.5 space-y-1.5" : "p-3.5 space-y-2.5"
      } ${align === "center" ? "text-left max-w-lg mx-auto" : "text-left"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`font-semibold break-words select-text ${
            isBridgeRetry
              ? "text-emerald-200"
              : isFileProtocol
              ? "text-amber-200"
              : "text-rose-200"
          }`}
        >
          {authError}
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-slate-300 hover:text-white shrink-0 font-bold cursor-pointer px-1"
            aria-label={isVi ? "Đóng thông báo" : "Dismiss"}
          >
            ✕
          </button>
        )}
      </div>

      {isStaleConfig && (
        <div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-moba font-black cursor-pointer"
          >
            ↻ {isVi ? "Tải lại trang ngay" : "Reload Page Now"}
          </button>
        </div>
      )}

      {isBridgeUnavailable && !isStaleConfig && (
        <div className="rounded-lg bg-slate-950/85 border border-amber-400/35 p-2.5 space-y-2 text-[11px] text-slate-200">
          <div className="font-semibold text-amber-200">
            {isVi
              ? "Cách bật Đăng nhập Google cho file HTML tải về:"
              : "How to enable Google Sign-In for downloaded HTML files:"}
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-200">
            <li>
              {isVi
                ? "Bước 1: Trên AI Studio, bấm Share / Publish để kích hoạt đường dẫn Web công khai (ais-pre-...)."
                : "Step 1: In AI Studio, click Share / Publish to activate the public HTTPS Web URL (ais-pre-...)."}
            </li>
            <li>
              {isVi
                ? "Bước 2: Sau khi đã bật Share/Publish, bấm lại nút Đăng nhập Google trong file HTML (hoặc tải lại bản HTML mới)."
                : "Step 2: Once published, tap Google Sign-In again in this HTML file (or re-download the HTML file)."}
            </li>
            <li>
              {isVi
                ? "Hoặc chơi & đăng nhập Google trực tiếp ngay trên tab Web Preview của AI Studio, rồi dùng nút Xuất/Nhập (.json) để đồng bộ file cục bộ."
                : "Or sign in directly inside AI Studio's Web Preview tab and use Export/Import (.json) to sync progress with your local file."}
            </li>
          </ul>
        </div>
      )}

      {isBridgeRetry && !isStaleConfig && (
        <div className="rounded-lg bg-slate-950/85 border border-emerald-400/35 p-2.5 text-[11px] text-emerald-100">
          {isVi
            ? "Kết nối HTTPS đã sẵn sàng. Hãy bấm lại nút 'ĐĂNG NHẬP BẰNG GOOGLE' ngay phía trên để mở cửa sổ chọn tài khoản Google."
            : "HTTPS auth bridge is ready. Click 'SIGN IN WITH GOOGLE' above once more to open the Google account popup."}
        </div>
      )}

      {isFileProtocol && !isStaleConfig && !isBridgeUnavailable && !isBridgeRetry && (
        <div className="rounded-lg bg-slate-950/85 border border-amber-400/35 p-2.5 space-y-2 text-[11px] text-slate-200">
          <div className="text-slate-200 leading-relaxed">
            {isVi
              ? "Khi mở file HTML cục bộ (file://), hãy cho phép trình duyệt mở cửa sổ Pop-up xác thực Google hoặc mở trực tiếp bản Web HTTPS chính thức:"
              : "When opening a local HTML file (file://), allow the Google auth Pop-up or open the official HTTPS web version:"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={webAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-moba font-black text-[11px] inline-flex items-center gap-1.5"
            >
              🌐 {isVi ? "Mở Bản Web HTTPS Để Đăng Nhập Google ↗" : "Open HTTPS Web Version ↗"}
            </a>
            <button
              type="button"
              onClick={() =>
                onCopyText?.(
                  webAppUrl,
                  isVi ? "Đã sao chép đường dẫn Web HTTPS!" : "Copied HTTPS web link!"
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-moba font-bold text-cyan-200 cursor-pointer"
            >
              {isVi ? "Sao chép Link Web" : "Copy Web Link"}
            </button>
          </div>
          {webAppUrls.length > 1 && (
            <div className="pt-1 border-t border-slate-800/90 space-y-1">
              <div className="text-[10px] text-slate-400">
                {isVi ? "Các đường dẫn Web HTTPS khả dụng:" : "Available HTTPS web links:"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {webAppUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-[10px] font-mono-numbers text-emerald-300 underline break-all"
                  >
                    {url.replace(/^https?:\/\//i, "")} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="text-[10px] text-amber-200/90">
            {isVi
              ? "Mẹo: Bạn có thể bấm 'Tải Xuống File Sao Lưu (.json)' ở cột bên phải, mở bản Web HTTPS rồi chọn 'Khôi Phục Từ File (.json)' để chuyển toàn bộ tiến trình lên Google Cloud."
              : "Tip: Export a .json backup here and import it on the HTTPS web version to sync your progress to Google Cloud."}
          </div>
        </div>
      )}

      {isUnauthorizedDomain && !isFileProtocol && !isStaleConfig && (
        <div className="rounded-lg bg-slate-950/85 border border-rose-500/35 p-2.5 space-y-2 text-[11px] text-slate-200">
          {currentHost && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-slate-400">
                  {isVi ? "Tên miền hiện tại: " : "Current domain: "}
                </span>
                <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-amber-400/50 text-amber-300 font-mono-numbers font-bold select-all break-all">
                  {currentHost}
                </code>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCopyText?.(
                    currentHost,
                    isVi
                      ? `Đã sao chép tên miền: ${currentHost}`
                      : `Copied domain: ${currentHost}`
                  )
                }
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] font-moba font-bold text-cyan-200 cursor-pointer shrink-0"
              >
                {isVi ? "Sao chép tên miền" : "Copy Domain"}
              </button>
            </div>
          )}

          {projectId && (
            <div>
              <span className="text-slate-400">
                {isVi ? "Dự án Firebase: " : "Firebase project: "}
              </span>
              <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono-numbers font-bold select-all">
                {projectId}
              </code>
            </div>
          )}

          {authorizedDomains.length > 0 && (
            <div className="space-y-1">
              <div className="text-slate-400">
                {isVi
                  ? "Các tên miền đang được cấp phép trên dự án:"
                  : "Currently authorized domains on project:"}
              </div>
              <div className="flex flex-wrap gap-1">
                {authorizedDomains.map((dom) => (
                  <code
                    key={dom}
                    className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono-numbers text-emerald-300 select-all break-all"
                  >
                    {dom}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-300">
              {isVi
                ? "Thêm tên miền trên vào Firebase Console → Authentication → Settings → Authorized domains."
                : "Add the domain above in Firebase Console → Authentication → Settings → Authorized domains."}
            </span>
            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-md bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 font-moba font-bold text-[10px] shrink-0"
            >
              {isVi ? "Mở Firebase Console ↗" : "Open Firebase Console ↗"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
