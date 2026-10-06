import { useRef } from "react";
import { useApp } from "../../context/AppContext";
import { Icon } from "./Icon";

const TYPE_CONFIG = {
  success: {
    title: "Success",
    icon: "checkCircle",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    border: "border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  error: {
    title: "Error",
    icon: "x",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    border: "border-rose-500/30",
    bar: "bg-rose-500",
  },
  danger: {
    title: "Error",
    icon: "x",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    border: "border-rose-500/30",
    bar: "bg-rose-500",
  },
  warning: {
    title: "Warning",
    icon: "alertTriangle",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    border: "border-amber-500/30",
    bar: "bg-amber-500",
  },
  info: {
    title: "Notice",
    icon: "info",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    border: "border-blue-500/30",
    bar: "bg-blue-500",
  },
};

function ToastItem ({ banner, onDismiss, onPause, onResume }) {
  const config = TYPE_CONFIG[banner.type] ?? TYPE_CONFIG.info;
  const barRef = useRef(null);

  const handleMouseEnter = () => {
    onPause?.();
    if (barRef.current) barRef.current.style.animationPlayState = "paused";
  };

  const handleMouseLeave = () => {
    onResume?.();
    if (barRef.current) barRef.current.style.animationPlayState = "running";
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex items-start gap-2.5 bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl shadow-slate-950/20 backdrop-blur-xl w-full sm:w-[26rem] max-w-[calc(100vw-2rem)] relative overflow-hidden animate-in slide-in-from-top-3 fade-in duration-200 select-none"
    >
      <div
        className={`p-1 rounded-full ${config.bg} shrink-0 flex items-center justify-center mt-0.5`}
      >
        <Icon name={config.icon} size={14} className={config.color} />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-wider ${config.color}`}
        >
          {config.title}
        </span>
        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 leading-snug break-words whitespace-normal mt-0.5">
          {banner.msg}
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors shrink-0 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
        title="Dismiss"
      >
        <Icon name="x" size={12} />
      </button>

      <div
        ref={barRef}
        className={`absolute bottom-0 left-0 right-0 h-[2px] ${config.bar} animate-shrink`}
      />
    </div>
  );
}

export default function Toast () {
  const { banner, clearBanner, pauseBanner, resumeBanner } = useApp();
  if (!banner) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[99999] flex flex-col items-stretch sm:items-end pointer-events-none">
      <div className="pointer-events-auto">
        <ToastItem banner={banner} onDismiss={clearBanner} onPause={pauseBanner} onResume={resumeBanner} />
      </div>
    </div>
  );
}
