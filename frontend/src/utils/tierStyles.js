export const titleCase = (s = "") =>
  String(s)
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const planDisplayName = (key = "FREE") =>
  titleCase(String(key).split("_")[0]);

/* Style tokens shared across the app via getTierStyles(). Keep all keys. */
const TIER_STYLES = {
  FREE: {
    badgeBg:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
    avatarRing: "ring-sky-500/60",
    dot: "bg-sky-500",
    gradient: "from-sky-400 to-blue-500",
    storagePill:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
    accentBorder: "hover:border-sky-500/60 shadow-sky-500/10",
    iconBg:
      "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30",
    card: "border-sky-400/30 dark:border-sky-500/25 bg-white dark:bg-zinc-900 bg-gradient-to-bl from-sky-500/[0.08] via-white to-white dark:from-sky-500/[0.12] dark:via-zinc-900 dark:to-zinc-950 shadow-lg shadow-sky-500/5 hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-500/40",
    priceBox:
      "bg-sky-50/70 dark:bg-sky-500/10 border-sky-200/60 dark:border-sky-500/20",
    ringCurrent:
      "border-sky-500/80 ring-2 ring-sky-500/30 shadow-2xl shadow-sky-500/15 bg-white dark:bg-zinc-900 bg-gradient-to-bl from-sky-500/[0.08] via-white to-white dark:from-sky-500/[0.12] dark:via-zinc-900 dark:to-zinc-950",
    cta: "bg-gradient-to-r from-sky-600 to-blue-700 dark:from-sky-700 dark:to-blue-800 text-white shadow-md shadow-sky-500/20 dark:shadow-none hover:brightness-110",
    ctaGhost:
      "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/50 dark:hover:text-sky-300 border border-slate-200/80 dark:border-zinc-700/80",
    currentBox:
      "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
    spotlight: "bg-sky-500/15",
  },
  PRO: {
    badgeBg:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
    avatarRing: "ring-blue-500/50",
    dot: "bg-blue-500",
    gradient: "from-blue-600 via-blue-500 to-indigo-600",
    storagePill:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
    accentBorder: "hover:border-blue-500/60 shadow-blue-500/10",
    iconBg:
      "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
    card: "border-blue-500/25 dark:border-blue-500/20 bg-white dark:bg-zinc-900 bg-gradient-to-bl from-blue-500/[0.08] via-white to-white dark:from-blue-500/[0.10] dark:via-zinc-900 dark:to-zinc-950 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/40",
    priceBox:
      "bg-blue-50/70 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20",
    ringCurrent:
      "border-blue-500/80 ring-2 ring-blue-500/30 shadow-2xl shadow-blue-500/15 bg-white dark:bg-zinc-900 bg-gradient-to-bl from-blue-500/[0.08] via-white to-white dark:from-blue-500/[0.10] dark:via-zinc-900 dark:to-zinc-950",
    cta: "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white shadow-md shadow-blue-500/20 dark:shadow-none hover:brightness-110",
    ctaGhost:
      "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 border border-slate-200/80 dark:border-zinc-700/80",
    currentBox:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    spotlight: "bg-blue-500/15",
  },
  BUSINESS: {
    badgeBg:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    avatarRing: "ring-purple-500/50",
    dot: "bg-purple-500",
    gradient: "from-purple-600 via-violet-500 to-indigo-600",
    storagePill:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
    accentBorder: "hover:border-purple-500/60 shadow-purple-500/10",
    iconBg:
      "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30",
    card: "border-purple-500/25 dark:border-purple-500/20 bg-white dark:bg-zinc-900 bg-gradient-to-bl from-purple-500/[0.08] via-white to-white dark:from-purple-500/[0.10] dark:via-zinc-900 dark:to-zinc-950 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/40",
    priceBox:
      "bg-purple-50/70 dark:bg-purple-500/10 border-purple-200/60 dark:border-purple-500/20",
    ringCurrent:
      "border-purple-500/80 ring-2 ring-purple-500/30 shadow-2xl shadow-purple-500/15 bg-white dark:bg-zinc-900 bg-gradient-to-bl from-purple-500/[0.08] via-white to-white dark:from-purple-500/[0.10] dark:via-zinc-900 dark:to-zinc-950",
    cta: "bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 text-white shadow-md shadow-purple-500/20 dark:shadow-none hover:brightness-110",
    ctaGhost:
      "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 border border-slate-200/80 dark:border-zinc-700/80",
    currentBox:
      "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    spotlight: "bg-purple-500/15",
  },
};

export function getTierStyles(planKey) {
  const key = String(planKey || "FREE").split("_")[0].toUpperCase();
  return TIER_STYLES[key] || TIER_STYLES.FREE;
}