import { useNavigate } from "react-router-dom";
import { Icon } from "../../ui/Icon";
import { useReveal } from "../../../hooks/useReveal";
import { GITHUB_URL } from "../../../data/oss";
import { useApp } from "../../../context/AppContext";

const TRUST_BADGES = [
  { icon: "code", label: "100% Open Source", className: "text-blue-500" },
  { icon: "drive", label: "Self-host free", className: "text-emerald-500" },
  { icon: "lock", label: "AES-256 encryption", className: "text-indigo-500" },
  { icon: "cloud", label: "S3-compatible", className: "text-amber-500" },
];

export function OSSHero() {
  const navigate = useNavigate();
  const { user, theme } = useApp();
  const [ref, visible] = useReveal();
  const dark = theme === "dark";

  return (
    <section className="pt-28 lg:pt-32 pb-14 lg:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto transition-[opacity,transform] duration-700 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Open Source · Self-Host or Managed
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.08] mb-6">
            Open-Source,{" "}
            <span className="gradient-text">Self-Hosted</span>{" "}
            Cloud Storage
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            OwnStorage is a fully open-source cloud storage hub. Run it on your
            own infrastructure for free — or start on our managed cloud in
            seconds. Your files, your code, your rules.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-[box-shadow,transform]"
            >
              <Icon name="github" size={16} />
              Star on GitHub
            </a>
            <button
              onClick={() => navigate(user?.id ? "/home" : "/register")}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-bold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-[border-color,color,background-color]"
            >
              {user?.id ? "Go to Home" : "Try OwnStorage"}
              <Icon name="arrowRight" size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500 dark:text-zinc-400">
            {TRUST_BADGES.map((b, i) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <Icon name={b.icon} size={14} className={b.className} />
                {b.label}
                {i < TRUST_BADGES.length - 1 && (
                  <span className="hidden sm:inline text-slate-300 dark:text-zinc-700 ml-4">
                    •
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-14">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-2xl rounded-[2rem] pointer-events-none" />
          <div className="relative rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-0.5 border-b border-slate-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <div className="flex-1 flex items-center justify-center min-w-0">
                <div className="flex items-center gap-1.5 max-w-sm w-full px-3 py-1.5 rounded-lg bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/70 dark:border-zinc-700/70">
                  <Icon name="lock" size={12} className="shrink-0 text-emerald-500" />
                  <span className="truncate text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                    ownstorage.space/myfiles
                  </span>
                </div>
              </div>
            </div>
            <picture>
              <source
                srcSet={dark ? "/dashboard-dark.avif" : "/dashboard.avif"}
                type="image/avif"
              />
              <source
                srcSet={dark ? "/dashboard-dark.avif" : "/dashboard.webp"}
                type="image/webp"
              />
              <img
                src={dark ? "/dashboard-dark.avif" : "/dashboard.png"}
                alt="OwnStorage Myfiles Page"
                width="1920"
                height="1080"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-auto"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
}