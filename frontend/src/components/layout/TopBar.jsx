import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Icon from "../ui/Icon";
import { ConfirmModal } from "../ui/UI";
import { getTierStyles, planDisplayName } from "../../utils/tierStyles";
import NotificationBell from "./NotificationBell";
import SearchModal from "../search/SearchModal";
import { TAB_ROOT_LABELS } from "../../utils/constants";
import { GITHUB_URL } from "../../data/oss";

const PAGE_TITLES = {
  "/home": "Home",
  "/myfiles": "My Files",
  "/search": "Search Results",
  "/shared": "Shared",
  "/bin": "Recycle Bin",
  "/settings": "Profile & Settings",
  "/admin": "Admin Dashboard",
  "/admin/users": "User Management",
  "/admin/users/:id": "User Details",
};

export default function TopBar({ onMenuToggle }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimer = useRef(null);

  const pathKey = location.pathname.startsWith("/myfiles/folders")
    ? "/myfiles"
    : location.pathname.startsWith("/shared/folders")
      ? "/shared"
      : location.pathname.startsWith("/admin/users/")
        ? "/admin/users/:id"
        : location.pathname;
  const title =
    PAGE_TITLES[pathKey] ||
    TAB_ROOT_LABELS[pathKey.replace("/", "")] ||
    "OwnStorage";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const planStyle = getTierStyles(user?.plan);
  const planLabel = planDisplayName(user?.plan);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Hotkey listener for ⌘K or /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth < 768) setShowSearch(true);
        else searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateSearch = useCallback(
    (q) => {
      if (q.trim()) {
        navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      }
    },
    [navigate],
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    navigateSearch(searchQuery);
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      navigateSearch(q);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const dropdownItems = [
    { icon: "settings", label: "Settings", path: "/settings" },
    {
      icon: "github",
      label: "Report Issue on GitHub",
      action: () =>
        window.open(
          `${GITHUB_URL}/issues`,
          "_blank",
          "noopener,noreferrer",
        ),
    },
    {
      icon: "logout",
      label: "Logout",
      action: () => {
        setDropdownOpen(false);
        setShowLogoutConfirm(true);
      },
    },
  ];

  return (
    <>
      <header className="h-16 shrink-0 flex items-center gap-3 px-4 sm:px-6 bg-transparent relative z-40">
        <button
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Icon name="menu" size={20} />
        </button>

        <button
          onClick={() => navigate("/home")}
          aria-label="OwnStorage"
          className="md:hidden flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span className="font-display text-xl md:text-lg font-extrabold tracking-tight whitespace-nowrap">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
              Own
            </span>
            <span className="text-slate-700 dark:text-zinc-300 font-normal">
              Storage
            </span>
          </span>
        </button>

        {/* Page title (desktop) — never truncates/shrinks; other elements flex */}
        <h1 className="hidden md:block shrink-0 pr-3 font-display text-base sm:text-lg lg:text-xl font-extrabold tracking-tight whitespace-nowrap text-slate-900 dark:text-zinc-100">
          {title}
        </h1>

        <div className="flex-1" />

        {/* Search Bar (desktop) — flexes/shrinks instead of the title */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center relative w-full max-w-72 lg:max-w-80 min-w-0"
        >
          <Icon
            name="search"
            size={15}
            className="absolute left-3.5 text-slate-400 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search files & folders..."
            className="pl-9 pr-12 py-2 w-full min-w-0 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-[border-color,box-shadow,background-color] shadow-2xs"
          />
          <kbd className="absolute right-3 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold text-slate-400 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 shadow-2xs pointer-events-none">
            ctrl + K
          </kbd>
        </form>

        <button
          onClick={() => setShowSearch(true)}
          aria-label="Search"
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Icon name="search" size={20} />
        </button>

        <NotificationBell />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-tr ${planStyle.gradient} ring-2 ${planStyle.avatarRing} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <Icon
              name="chevronDown"
              size={20}
              className={`text-slate-400 transition-transform duration-200 hidden sm:block ${
                dropdownOpen ? "rotate-180 text-blue-500" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl py-1.5 z-[1500] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${planStyle.gradient} ring-2 ${planStyle.avatarRing} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs`}
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                      {user?.name || "User"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                      {user?.email || ""}
                    </div>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planStyle.badgeBg}`}
                  >
                    {planLabel.toUpperCase()} PLAN
                  </span>
                </div>
              </div>

              <div className="px-2 py-0.5">
                {dropdownItems.map((item) => {
                  const isLogout = item.label === "Logout";
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.path) navigate(item.path);
                        else item.action?.();
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-colors rounded-2xl ${
                        isLogout
                          ? "bg-rose-200 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400sm:bg-rose-100 sm:dark:hover:bg-rose-500/10 sm:hover:text-rose-600 sm:dark:hover:text-rose-400"
                          : "text-slate-600 dark:text-zinc-400 dark:hover:bg-zinc-800/80  hover:bg-slate-100/80 hover:text-slate-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <Icon name={item.icon} size={20} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>
      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} />
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate("/signin");
        }}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        variant="danger"
      />
    </>
  );
}
