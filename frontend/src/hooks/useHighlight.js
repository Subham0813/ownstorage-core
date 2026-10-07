import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Reads `?highlight=<itemId>` from the URL and scrolls the matching
 * `[data-item-id]` element into view with a temporary flash.
 *
 * Grids load asynchronously, so the lookup retries for up to ~10s before
 * giving up (e.g. notification deep links into /shared or /myfiles/folders).
 */
export function useHighlight() {
  const { search, pathname } = useLocation();

  useEffect(() => {
    const id = new URLSearchParams(search).get("highlight");
    if (!id) return;

    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-item-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("item-highlight");
        window.setTimeout(() => el.classList.remove("item-highlight"), 6000);
        return;
      }
      if (attempts++ < 50) timer = window.setTimeout(tryScroll, 200);
    };

    timer = window.setTimeout(tryScroll, 250);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [search, pathname]);
}
