import { useEffect } from "react";
import { useUploadStore } from "../store/uploadStore";

const ACTIVE_STATUSES = new Set(["queued", "uploading"]);

/**
 * Warn before reload/tab-close while uploads or Drive imports are in flight.
 * In-app SPA navigation is safe (the store + XHR survive it) — only a real
 * unload kills transfers, so `beforeunload` is the exact right scope.
 * Modern browsers show their own generic message; calling preventDefault()
 * (plus legacy returnValue) is what triggers it.
 */
export function useUnloadGuard() {
  const hasActive = useUploadStore(
    (s) =>
      s.uploads.some((u) => ACTIVE_STATUSES.has(u.status)) ||
      s.imports.some((i) => ACTIVE_STATUSES.has(i.status)),
  );

  useEffect(() => {
    if (!hasActive) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasActive]);
}
