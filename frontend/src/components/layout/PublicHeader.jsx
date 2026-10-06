import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Icon from "../ui/Icon";
import { GITHUB_URL } from "../../data/oss";

const SunIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
  </svg>
);

const MoonIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const OSS_NAV_LINKS = [
  { id: "open-source", label: "Open Source", icon: "code" },
  { id: "features", label: "Features", icon: "grid" },
  { id: "self-hosted", label: "Self-Hosted", icon: "cloud" },
  { id: "pricing", label: "Get Started", icon: "rocket" },
  { id: "faq", label: "FAQ", icon: "info" },
];

export default function PublicHeader({ activePage = "home", openSource = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme, user } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const toggleRef = useRef(null);

  const links = OSS_NAV_LINKS;

  const isAuthPage = activePage === "auth";
  const onSignInPage = pathname === "/signin";
  const authCtaTarget = onSignInPage ? "/register" : "/signin";
  const authCtaLabel = onSignInPage ? "Create account" : "Sign In";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e) => {
      if (toggleRef.current?.contains(e.target)) return;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

  const goSignIn = () => navigate("/signin");

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    if (activePage === "home") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  const getLinkProps = (id) => {
    if (activePage === "home") {
      return {
        onClick: (e) => {
          e.preventDefault();
          handleNavClick(id);
        },
        className: "text-sm font-semibold transition-colors",
      };
    }
    return {};
  };

  const getLinkClass = () =>
    "text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 transition-colors";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-[background-color,box-shadow,transform,backdrop-filter] duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-zinc-800 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <button
            onClick={() => {
              if (activePage === "home") window.scrollTo({ top: 0, behavior: "smooth" });
              else navigate("/");
            }}
            className={`flex items-center gap-2.5 cursor-pointer`}
          >
            <span className="font-display text-2xl font-extrabold tracking-tight whitespace-nowrap">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">Own</span>
              <span className="text-slate-700 dark:text-zinc-300 font-normal">Storage</span>
            </span>
          </button>

          {/* Desktop nav links */}
          {!isAuthPage && (
            <div className="hidden lg:flex items-center gap-8">
              {links.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={link.id}
                    to={activePage === "home" ? `#${link.id}` : `/#${link.id}`}
                    {...getLinkProps(link.id)}
                    className={getLinkClass()}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          )}

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              {theme === "dark" ? SunIcon : MoonIcon}
            </button>
            {openSource && (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Star on GitHub"
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
              >
                <Icon name="github" size={18} />
              </a>
            )}
            {user?.id ? (
              <button
                onClick={() => navigate("/home")}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 px-2 py-1"
              >
                Home
              </button>
            ) : isAuthPage ? (
              <button
                onClick={() => navigate(authCtaTarget)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-full text-sm font-bold shadow-lg shadow-slate-500/10 transition-[background-color,transform,box-shadow] hover:scale-105 active:scale-95"
              >
                {authCtaLabel}
              </button>
            ) : (
              <>
                <button
                  onClick={goSignIn}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 px-2 py-1"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-full text-sm font-bold shadow-lg shadow-slate-500/10 transition-[background-color,transform,box-shadow] hover:scale-105 active:scale-95"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-2">
            {!user?.id && (
              <button onClick={() => navigate(isAuthPage ? authCtaTarget : "/signin")} className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-1">
                {isAuthPage ? authCtaLabel : "Sign In"}
              </button>
            )}
            {user?.id && (
              <button onClick={() => navigate("/myfiles")} className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-1">
                My Files
              </button>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              {theme === "dark" ? SunIcon : MoonIcon}
            </button>
            {openSource && (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Star on GitHub"
                className="p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
              >
                <Icon name="github" size={18} />
              </a>
            )}
            <button
              ref={toggleRef}
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden absolute left-3 right-3 sm:left-auto sm:right-6 sm:w-96 top-full mt-2 origin-top-right animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/40 overflow-hidden z-40"
        >
          {!isAuthPage && (
            <div className="p-2">
              {links.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0 transition-colors group-hover:text-blue-600">
                      <Icon name={link.icon || "info"} size={16} />
                    </span>
                    {link.label}
                    <span className="ml-auto text-slate-300 dark:text-zinc-600">
                      <Icon name="arrowUpRight" size={14} />
                    </span>
                  </Link>
                ) : (
                  <Link
                    key={link.id}
                    to={activePage === "home" ? `#${link.id}` : `/#${link.id}`}
                    onClick={(e) => {
                      if (activePage === "home") e.preventDefault();
                      handleNavClick(link.id);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0 transition-colors group-hover:text-blue-600">
                      <Icon name={link.icon} size={16} />
                    </span>
                    {link.label}
                    <span className="ml-auto text-slate-300 dark:text-zinc-600">
                      <Icon name="arrowUpRight" size={14} />
                    </span>
                  </Link>
                )
              )}
            </div>
          )}

          {!isAuthPage && <div className="h-px bg-slate-100 dark:bg-zinc-800/80 mx-4" />}

          <div className="p-3">
            {user?.id ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/myfiles");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-100/70 dark:hover:bg-blue-500/15 transition-colors"
              >
                <Icon name="home" size={16} />
                Go to My Files
                <Icon name="arrowRight" size={15} className="ml-auto" />
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    goSignIn();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Icon name="user" size={16} />
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/register");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-extrabold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-[background-color,transform,box-shadow]"
                >
                  Get Started Free
                  <Icon name="arrowRight" size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
