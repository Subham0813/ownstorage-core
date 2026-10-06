import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { homeAPI } from "../api/userApi";
import { genId } from "../utils/fileUtils";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function readStoredUser() {
  try {
    const u = JSON.parse(localStorage.getItem("userdata") ?? "null");
    return u && typeof u === "object" && u?.id ? u : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(readStoredUser);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    root.classList.add("no-transitions");
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("no-transitions"));
    });
    return () => root.classList.remove("no-transitions");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // ── Banner helpers (replaces toast array) ───────────────────────
  const bannerTimerRef = useRef(null);
  const bannerRemainingRef = useRef(4500);
  const bannerStartRef = useRef(0);

  const clearBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  const toast = useCallback((type, msg, duration = 4500) => {
    clearBannerTimer();
    const id = genId();
    setBanner({ id, type, msg });
    bannerStartRef.current = Date.now();
    bannerRemainingRef.current = duration;
    bannerTimerRef.current = setTimeout(() => {
      setBanner((b) => (b?.id === id ? null : b));
      bannerTimerRef.current = null;
    }, duration);
  }, [clearBannerTimer]);

  const pauseBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
      const elapsed = Date.now() - bannerStartRef.current;
      bannerRemainingRef.current = Math.max(0, bannerRemainingRef.current - elapsed);
    }
  }, []);

  const resumeBanner = useCallback(() => {
    setBanner((b) => {
      if (!b) return b;
      bannerStartRef.current = Date.now();
      bannerTimerRef.current = setTimeout(() => {
        setBanner((prev) => (prev?.id === b.id ? null : prev));
        bannerTimerRef.current = null;
      }, bannerRemainingRef.current);
      return b;
    });
  }, []);

  const clearBanner = useCallback(() => {
    clearBannerTimer();
    setBanner(null);
  }, [clearBannerTimer]);

  // showMessage is the revamped-compatible alias used by DashboardContext + hooks
  const showMessage = useCallback(
    (type, text) => {
      toast(type, text);
    },
    [toast],
  );

  // ── Auth helpers ────────────────────────────────────────────────
  const setUser = useCallback((userData) => {
    localStorage.setItem("userdata", JSON.stringify(userData));
    setUserState(userData);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    localStorage.removeItem("userdata");
    // Clear all persisted dashboard state
    sessionStorage.removeItem("currentView");
    sessionStorage.removeItem("currentDirectory");
    sessionStorage.removeItem("breadcrumbs");
    sessionStorage.removeItem("filters");
    sessionStorage.removeItem("searchQuery");
    sessionStorage.removeItem("vd_breadcrumb");
  }, []);

  const logout = useCallback(async () => {
    try {
      await homeAPI.logout();
    } catch {}
    clearUser();
    toast("success", "Signed out successfully");
  }, [clearUser, toast]);

  const logoutAll = useCallback(async () => {
    try {
      await homeAPI.logoutAll();
    } catch {}
    clearUser();
    toast("success", "All sessions terminated");
  }, [clearUser, toast]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await homeAPI.getUserProfile();
      const userData = data?.data?.user;
      if (userData?.id) {
        // Merge with current localStorage value to avoid stale closure on `user`
        const current = readStoredUser();
        const updated = { ...current, ...userData };
        localStorage.setItem("userdata", JSON.stringify(updated));
        setUserState(updated);
        return updated;
      }
    } catch {}
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire axiosInstance global message handler
  useEffect(() => {
    import("../api/axiosInstance").then((mod) => {
      mod.setGlobalShowMessage?.((type, msg) => toast(type, msg));
    });
  }, [toast]);

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";
  const rootDirId = user?.root?.id ?? user?.rootId ?? null;

  const value = useMemo(
    () => ({
      user,
      setUser,
      clearUser,
      logout,
      logoutAll,
      refreshUser,
      banner,
      toast,
      clearBanner,
      pauseBanner,
      resumeBanner,
      loading,
      setLoading,
      showMessage,
      theme,
      toggleTheme,
      isAdmin,
      isSuperAdmin,
      rootDirId,
    }),
    [
      user,
      setUser,
      clearUser,
      logout,
      logoutAll,
      refreshUser,
      banner,
      toast,
      clearBanner,
      pauseBanner,
      resumeBanner,
      loading,
      setLoading,
      showMessage,
      theme,
      toggleTheme,
      isAdmin,
      isSuperAdmin,
      rootDirId,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
