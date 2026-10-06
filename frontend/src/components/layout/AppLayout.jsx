import { Suspense, lazy, useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import Toast from "../ui/Toast";
const UploadModal = lazy(() => import("../upload/UploadModal"));
import { useUserUsage } from "../../hooks/useUserUsage";
import { useUnloadGuard } from "../../hooks/useUnloadGuard";
import { useUploadStore } from "../../store/uploadStore";

export default function AppLayout() {
  useUserUsage();
  useUnloadGuard();
  const openUploadModal = useUploadStore((s) => s.openUploadModal);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [manualCollapsed, setManualCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", manualCollapsed);
  }, [manualCollapsed]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleDetailsPanelToggle = useCallback((e) => {
    setDetailsPanelOpen(e?.detail?.open ?? false);
  }, []);

  useEffect(() => {
    document.addEventListener("details-panel-toggle", handleDetailsPanelToggle);
    return () =>
      document.removeEventListener(
        "details-panel-toggle",
        handleDetailsPanelToggle,
      );
  }, [handleDetailsPanelToggle]);

  useEffect(() => {
    setDetailsPanelOpen(false);
  }, [location.pathname]);

  // Relay global events to /myfiles pages; navigate there if elsewhere
  useEffect(() => {
    const relay = (e) => {
      if (!location.pathname.startsWith("/myfiles")) {
        sessionStorage.setItem("vd:pending-action", e.type);
        navigate("/myfiles");
      }
    };
    document.addEventListener("vd:trigger-upload", relay);
    document.addEventListener("vd:trigger-new-folder", relay);
    return () => {
      document.removeEventListener("vd:trigger-upload", relay);
      document.removeEventListener("vd:trigger-new-folder", relay);
    };
  }, [location.pathname, navigate]);

  // Opening the upload hub directly (works on any dashboard page)
  useEffect(() => {
    const open = () => openUploadModal();
    document.addEventListener("vd:trigger-upload", open);
    return () => document.removeEventListener("vd:trigger-upload", open);
  }, [openUploadModal]);

  // Re-dispatch pending action after navigation to /myfiles
  useEffect(() => {
    if (!location.pathname.startsWith("/myfiles")) return;
    const pending = sessionStorage.getItem("vd:pending-action");
    if (!pending) return;
    sessionStorage.removeItem("vd:pending-action");
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent(pending));
    }, 150);
  }, [location.pathname]);

  const isSidebarCollapsed = detailsPanelOpen || manualCollapsed;
  const sidebarWidth = isMobile ? "0px" : isSidebarCollapsed ? "68px" : "260px";

  return (
    <div
      className="h-screen flex dashboard-bg overflow-hidden p-0.5 sm:p-1.5 gap-1.5 sm:gap-2"
      style={{ "--sidebar-width": sidebarWidth }}
    >
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0 relative z-10">
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            setManualCollapsed((prev) => !prev);
            setDetailsPanelOpen(false);
          }}
        />
      </div>

      {/* Mobile sidebar overlay — slides in & out */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1050] md:hidden transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <div
        className={`fixed inset-y-0 left-0 z-[1100] md:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} mobile />
      </div>

      {/* Main content container with rounded-xl corners */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-xl shadow-slate-900/5 dark:shadow-2xl/40 overflow-hidden relative z-10">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — only mount on mobile */}
      {isMobile && <MobileNav />}

      {/* Global upload hub */}
      <Suspense fallback={null}>
        <UploadModal />
      </Suspense>

      {/* Global toast */}
      <Toast />
    </div>
  );
}
