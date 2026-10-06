import { useNavigate, Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { useApp } from "../../context/AppContext";
import PublicFooter from "./PublicFooter";

export function LegalSection({ num, title, children }) {
  return (
    <section className="border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
      <div className="flex items-start gap-3 mb-4">
        {num && (
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-sm font-bold shadow-2xs">
            {num}
          </div>
        )}
        <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-slate-900 dark:text-zinc-100 pt-1.5">
          {title}
        </h2>
      </div>
      <div className="ml-12 pb-8 text-base text-slate-600 dark:text-zinc-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function LegalLayout({
  eyebrow = "Legal",
  title,
  lastUpdated,
  subtitle,
  children,
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Fixed nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-slate-200/70 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                aria-label="Go back"
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
                <Icon name="chevronLeft" size={20} />
              </button>
              <Link to="/" className="flex items-center gap-2.5">
                <span className="font-display text-2xl font-extrabold tracking-tight whitespace-nowrap">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                    Own
                  </span>
                  <span className="text-slate-700 dark:text-zinc-300 font-normal">
                    Storage
                  </span>
                </span>
              </Link>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto animate-fadeUp">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight">
            {title}
          </h1>
          {lastUpdated && (
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-full px-3.5 py-1.5">
              <Icon
                name="calendar"
                size={13}
                className="text-blue-500 dark:text-blue-400"
              />
              Last updated: {lastUpdated}
            </div>
          )}
          {subtitle && (
            <p className="text-base text-slate-500 dark:text-zinc-400 mt-5 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800 rounded-xl p-6 sm:p-10 shadow-xl">
          {children}
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            © {new Date().getFullYear()} OwnStorage · All rights reserved
          </p>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Icon name="chevronLeft" size={14} />
            Back to previous page
          </button>
        </footer>
      </main>

      <PublicFooter />
    </div>
  );
}
