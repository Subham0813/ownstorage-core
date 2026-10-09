import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Icon } from "../ui/Icon";
import { NAV_ITEMS } from "../../utils/constants";
import { formatSize } from "../../utils/fileUtils";
import { Tooltip } from "../ui/Tooltip";

const ADMIN_NAV_ITEMS = [
  {
    key: "admin-dashboard",
    label: "Dashboard",
    icon: "barChart",
    path: "/admin",
  },
];

const ACCOUNT_ITEMS = [
  { key: "settings", label: "Settings", icon: "settings", path: "/settings" },
];

function NavSection({ label, children, collapsed }) {
  return (
    <div className="mb-1">
      {label && (
        <div
          className={`px-4 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider overflow-hidden transition-all duration-300 ${
            collapsed ? "opacity-0 max-h-0 pt-0 pb-0" : "pt-2 pb-1 max-h-6"
          }`}
        >
          {label}
        </div>
      )}
      {collapsed && <div className="pt-1.5" />}
      {children}
    </div>
  );
}

function NavItem({ item, onClick, collapsed }) {
  return (
    <Tooltip
      content={collapsed ? item.label : ""}
      position="right"
      className={collapsed ? "flex justify-center w-full" : "block"}
    >
      <NavLink
        to={item.path}
        onClick={onClick}
        className={({ isActive }) =>
          `group relative flex items-center font-medium select-none transition-[color,background-color] duration-150 ${
            collapsed
              ? "w-10 h-10 justify-center gap-0 rounded-2xl"
              : "w-full h-10 justify-start gap-3 px-4 rounded-xl"
          } ${
            isActive
              ? collapsed
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
          }`
        }
      >
        <Icon name={item.icon} size={20} className="shrink-0" />
        <span
          className={`text-sm truncate min-w-0 overflow-hidden transition-all duration-300 ${
            collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    </Tooltip>
  );
}

function NavButton({ icon, label, onClick, collapsed, variant = "default" }) {
  const isDanger = variant === "danger";

  return (
    <Tooltip
      content={collapsed ? label : ""}
      position="right"
      className={collapsed ? "flex justify-center w-full" : "block"}
    >
      <button
        onClick={onClick}
        aria-label={label}
        className={`group relative flex items-center font-medium select-none cursor-pointer transition-[color,background-color] duration-150 ${
          collapsed
            ? "w-10 h-10 justify-center gap-0 rounded-2xl"
            : "w-full h-10 justify-start gap-3 px-4 rounded-xl"
        } ${
          isDanger
            ? "bg-rose-200 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400sm:bg-rose-100 sm:dark:hover:bg-rose-500/10 sm:hover:text-rose-600 sm:dark:hover:text-rose-400"
            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/80 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100"
        }`}
      >
        <Icon name={icon} size={20} className="shrink-0" />
        <span
          className={`text-sm truncate min-w-0 overflow-hidden transition-all duration-300 ${
            collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
          }`}
        >
          {label}
        </span>
      </button>
    </Tooltip>
  );
}

function MeterBar({ pct, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-zinc-700/60">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ${color}`}
        style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
}

function MeterNumbers({ used, max }) {
  return (
    <div className="flex items-center justify-between gap-2 mt-1 text-xs font-semibold text-slate-400 dark:text-zinc-500 font-mono">
      <span className="truncate min-w-0">{formatSize(used)}</span>
      <span className="shrink-0 whitespace-nowrap">{formatSize(max)}</span>
    </div>
  );
}

function StorageBar({ user, collapsed }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem("sb-storage-open") !== "0";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("sb-storage-open", open ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [open]);

  const storageUsed = user?.usedQuota ?? 0;
  const storageMax = user?.maxQuota ?? 5 * 1024 * 1024 * 1024;
  const storagePct = Math.min(
    100,
    Math.round((storageUsed / storageMax) * 100),
  );
  const storageColor =
    storagePct >= 90
      ? "bg-rose-500"
      : storagePct >= 70
        ? "bg-amber-500"
        : "bg-gradient-to-r from-blue-600 to-indigo-500";

  const ringColor =
    storagePct >= 90
      ? "stroke-rose-500"
      : storagePct >= 70
        ? "stroke-amber-500"
        : "stroke-blue-600 dark:stroke-blue-500";

  const bwUsed = user?.usedBandwidthQuota ?? 0;
  const bwMax = user?.maxBandwidthQuota ?? 5 * 1024 * 1024 * 1024;
  const bwPct = Math.min(100, Math.round((bwUsed / bwMax) * 100));
  const bwColor =
    bwPct >= 90
      ? "bg-rose-500"
      : bwPct >= 70
        ? "bg-amber-500"
        : "bg-gradient-to-r from-purple-600 to-violet-500";

  return (
    <div className="relative">
      <div
        className={`m-1 rounded-xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-zinc-900/90 dark:via-zinc-900/60 dark:to-blue-950/30 border border-slate-200/90 dark:border-zinc-800 shadow-sm select-none relative overflow-hidden group transition-all duration-300 ${
          collapsed
            ? "max-h-0 p-0 my-0 border-0 opacity-0"
            : "max-h-none py-2 opacity-100"
        }`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500" />

        {/* Storage row — always visible, corner toggle button */}
        <div className="relative flex items-center justify-between gap-2 px-2">
          <span className="flex items-center gap-1.5 truncate min-w-0 text-xs font-bold text-slate-700 dark:text-zinc-200">
            <Icon
              name="hardDrive"
              size={14}
              className="text-blue-500 shrink-0"
            />
            Storage Used
          </span>
          <span className="flex items-center gap-1 shrink-0 min-w-0">
            <span
              className={`font-mono text-xs ${
                storagePct >= 90
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {storagePct}%
            </span>
            <Tooltip
              content={open ? "Hide bandwidth meter" : "Show bandwidth meter"}
              position="right"
            >
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls="sb-bw-panel"
                aria-label={
                  open ? "Hide bandwidth meter" : "Show bandwidth meter"
                }
                className="w-5 h-5 flex items-center justify-center rounded-md text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                <Icon
                  name={open ? "chevronDown" : "chevronUp"}
                  size={16}
                  className="min-w-0 shrink-0"
                />
              </button>
            </Tooltip>
          </span>
        </div>

        {/* Storage bar — always visible */}
        <div className="px-2 mt-1.5">
          <MeterBar pct={storagePct} color={storageColor} />
          <MeterNumbers used={storageUsed} max={storageMax} />
        </div>

        {/* Bandwidth — expandable section */}
        <div
          id="sb-bw-panel"
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-[160px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-2 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between gap-2 mb-1 text-xs font-extrabold">
              <span className="flex items-center gap-1.5 truncate min-w-0 text-xs font-bold text-slate-700 dark:text-zinc-200">
                <Icon
                  name="globe"
                  size={12}
                  className="text-purple-500 shrink-0"
                />
                Bandwidth Utilized
              </span>
              <span
                className={`font-mono shrink-0 min-w-0 whitespace-nowrap text-xs ${
                  bwPct >= 90
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-purple-600 dark:text-purple-400"
                }`}
              >
                {bwPct}%
              </span>
            </div>
            <MeterBar pct={bwPct} color={bwColor} />
            <MeterNumbers used={bwUsed} max={bwMax} />
          </div>
        </div>
      </div>

      {/* Collapsed ring — cross-fades in as the card collapses */}
      <div
        className={`flex justify-center overflow-hidden transition-all duration-300 ${
          collapsed ? "py-2 opacity-100 max-h-16" : "py-0 max-h-0 opacity-0"
        }`}
      >
        <Tooltip
          content={`Storage: ${storagePct}% · Bandwidth: ${bwPct}%`}
          position="right"
        >
          <button
            onClick={() =>
              navigate("/settings", {
                state: { scrollToPlanBanner: true },
              })
            }
            className="w-10 h-10 relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group"
          >
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                className="stroke-slate-200 dark:stroke-zinc-800"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                className={ringColor}
                strokeWidth="4"
                strokeDasharray={`${(storagePct / 100) * 87.96} 100`}
                strokeLinecap="round"
              />
            </svg>
            <Icon
              name="hardDrive"
              size={13}
              className="absolute inset-0 m-auto text-slate-600 dark:text-zinc-300 group-hover:text-blue-500 transition-colors"
            />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export default function Sidebar({
  onClose,
  mobile = false,
  collapsed = false,
  onToggleCollapse,
}) {
  const { user, isAdmin, isSuperAdmin, toggleTheme, theme } = useApp();
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (mobile && onClose) onClose();
  };

  const showAdmin = isAdmin || isSuperAdmin;
  const isCollapsed = !mobile && collapsed;

  return (
    <>
      <aside
        className={`flex flex-col h-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 ${
          mobile
            ? "rounded-r-3xl z-[1100] shadow-2xl"
            : "rounded-xl z-10 shadow-lg shadow-slate-900/5 dark:shadow-black/20"
        } transition-[transform,width] duration-300 ease-in-out relative isolate overflow-hidden ${
          mobile
            ? "w-[260px]"
            : isCollapsed
              ? "w-[68px]"
              : "w-[260px]"
        }`}
      >
        <div
          className={`flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-4"} py-3 shrink-0 overflow-hidden relative`}
        >
          {/* Cloud stays fixed; brand text fades out as the panel narrows */}
          <Tooltip
            content={isCollapsed ? "Expand sidebar" : ""}
            position="right"
          >
            <button
              onClick={
                isCollapsed
                  ? onToggleCollapse
                  : () => {
                      navigate("/home");
                      handleNavClick();
                    }
              }
              aria-label={isCollapsed ? "Expand sidebar" : "Go to Home"}
              className="group relative flex items-center gap-2.5 cursor-pointer overflow-hidden shrink-0"
            >
              {isCollapsed && (
                <span className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 overflow-hidden">
                  {/* BRAND CLOUD ICON — commented out, awaiting delete approval:
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
                    isCollapsed ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-white"
                  >
                    <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                  </svg>
                </span>
                */}
                  <span className="flex items-center justify-center">
                    <Icon
                      name="chevronRight"
                      size={20}
                      className="text-white"
                    />
                  </span>
                </span>
              )}
              <span
                className={`font-display text-xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden min-w-0 transition-all duration-300 ${
                  isCollapsed
                    ? "opacity-0 max-w-0 -ml-[10px]"
                    : "opacity-100 max-w-[200px]"
                }`}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                  Own
                </span>
                <span className="text-slate-700 dark:text-zinc-300 font-normal">
                  Storage
                </span>
              </span>
            </button>
          </Tooltip>

          {mobile ? (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
            >
              <Icon name="x" size={20} />
            </button>
          ) : onToggleCollapse && !isCollapsed ? (
            <Tooltip content="Collapse sidebar" position="bottom">
              <button
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-[color,background-color] duration-150 shrink-0 cursor-pointer"
              >
                <Icon name="chevronLeft" size={20} />
              </button>
            </Tooltip>
          ) : null}
        </div>

        <div
          className={`flex-1 overflow-y-auto px-1 py-1.5 space-y-0.5 no-scrollbar ${isCollapsed ? "overflow-x-visible relative z-30" : "overflow-x-hidden"}`}
        >
          <NavSection collapsed={isCollapsed}>
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            ))}
          </NavSection>

          {showAdmin && (
            <NavSection label="Admin" collapsed={isCollapsed}>
              {ADMIN_NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  onClick={handleNavClick}
                  collapsed={isCollapsed}
                />
              ))}
            </NavSection>
          )}

          <NavSection label="Account" collapsed={isCollapsed}>
            {ACCOUNT_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                onClick={handleNavClick}
                collapsed={isCollapsed}
              />
            ))}

            <NavButton
              icon={theme === "dark" ? "sun" : "moon"}
              label={theme === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={toggleTheme}
              collapsed={isCollapsed}
            />
          </NavSection>
        </div>

        {/* Bottom section — storage */}
        <div
          className={`shrink-0 ${isCollapsed ? "relative z-30" : "overflow-x-hidden"}`}
        >
          <StorageBar user={user} collapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
