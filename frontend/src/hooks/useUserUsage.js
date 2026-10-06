import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { homeAPI } from "../api/userApi";
import { useUploadStore } from "../store/uploadStore";

/**
 * Keeps AppContext.user.quotas fresh without polling.
 * - Single React Query source for ["user-usage"] (shared with Dashboard)
 * - Fetches on mount + on window focus/reconnect (SWR)
 * - Invalidates only on real mutations (upload / delete / plan change)
 */
export function useUserUsage() {
  const { user, setUser } = useApp();
  const queryClient = useQueryClient();
  const prevCompletedRef = useRef(0);

  const { data: usageRes } = useQuery({
    queryKey: ["user-usage"],
    queryFn: () => homeAPI.getUsage(),
    enabled: !!user,
    staleTime: 60_000, // matches backend Redis TTL (60s)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // no refetchInterval — event-driven via invalidation below
  });

  // Merge query result into AppContext
  useEffect(() => {
    const usage = usageRes?.data?.data?.usage;
    if (!usage || !user) return;

    const merged = {
      ...user,
      usedQuota: usage.usedQuota ?? user.usedQuota,
      maxQuota: usage.maxQuota ?? user.maxQuota,
      usedBandwidthQuota: usage.usedBandwidthQuota ?? user.usedBandwidthQuota,
      maxBandwidthQuota: usage.maxBandwidthQuota ?? user.maxBandwidthQuota,
    };

    if (
      merged.usedQuota !== user.usedQuota ||
      merged.maxQuota !== user.maxQuota ||
      merged.usedBandwidthQuota !== user.usedBandwidthQuota ||
      merged.maxBandwidthQuota !== user.maxBandwidthQuota
    ) {
      setUser(merged);
    }
  }, [usageRes, user, setUser]);

  // Invalidate on app-level events + upload completions
  useEffect(() => {
    if (!user) return;

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["user-usage"] });

    window.addEventListener("vd:upload-completed", invalidate);
    window.addEventListener("vd:usage-changed", invalidate);
    window.addEventListener("vd:refresh", invalidate);

    const unsub = useUploadStore.subscribe((state) => {
      const completed = state.uploads.filter((u) => u.status === "completed").length;
      if (completed > prevCompletedRef.current && completed > 0) {
        invalidate();
      }
      prevCompletedRef.current = completed;
    });

    return () => {
      window.removeEventListener("vd:upload-completed", invalidate);
      window.removeEventListener("vd:usage-changed", invalidate);
      window.removeEventListener("vd:refresh", invalidate);
      unsub();
    };
  }, [user, queryClient]);
}
