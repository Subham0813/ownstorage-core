import KpiCard from "../KpiCard";
import { formatSize } from "../../../utils/fileUtils";

export function StorageCard({ usage, stats }) {
  const usedStorage = usage?.usedQuota ?? stats?.usedQuota ?? 0;
  const maxStorage = usage?.maxQuota ?? stats?.maxQuota ?? 1;
  const storePct =
    maxStorage > 0
      ? Math.min(100, Math.round((usedStorage / maxStorage) * 100))
      : 0;
  const storeBarColor =
    storePct >= 90
      ? "bg-rose-500"
      : storePct >= 70
        ? "bg-amber-500"
        : "bg-gradient-to-r from-blue-600 to-indigo-500";

  return (
    <KpiCard
      icon="hardDrive"
      iconClass="bg-gradient-to-tr from-blue-600 to-indigo-600"
      glow="shadow-blue-500/20"
      blobClass="bg-blue-500/10"
      label="Storage"
      pill={`${storePct}% Used`}
      pillClass="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
      body={
        <div className="flex items-baseline gap-1.5 mb-2 flex-wrap min-w-0">
          <span className="text-xl md:text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight font-mono truncate">
            {formatSize(usedStorage)}
          </span>
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 font-mono shrink-0">
            / {formatSize(maxStorage)}
          </span>
        </div>
      }
      footer={
        <div className="mt-2">
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-zinc-700/60">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ${storeBarColor}`}
              style={{ width: `${Math.max(storePct, storePct > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      }
    />
  );
}
