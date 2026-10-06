import KpiCard from "../KpiCard";
import { formatSize } from "../../../utils/fileUtils";

export function BandwidthCard({ usage }) {
  const usedBw = usage?.usedBandwidthQuota ?? 0;
  const maxBw = usage?.maxBandwidthQuota ?? 1;
  const bwPct =
    maxBw > 0 ? Math.min(100, Math.round((usedBw / maxBw) * 100)) : 0;
  const bwBarColor =
    bwPct >= 90
      ? "bg-rose-500"
      : bwPct >= 70
        ? "bg-amber-500"
        : "bg-gradient-to-r from-purple-600 to-violet-500";

  return (
    <KpiCard
      icon="globe"
      iconClass="bg-gradient-to-tr from-purple-600 to-pink-600"
      glow="shadow-purple-500/20"
      blobClass="bg-purple-500/10"
      label="Bandwidth"
      pill={`${bwPct}% Limit`}
      pillClass="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
      body={
        <div className="flex items-baseline gap-1.5 mb-2 flex-wrap min-w-0">
          <span className="text-xl md:text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight font-mono truncate">
            {formatSize(usedBw)}
          </span>
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 font-mono shrink-0">
            / {formatSize(maxBw)}
          </span>
        </div>
      }
      footer={
        <div className="mt-2">
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-zinc-700/60">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ${bwBarColor}`}
              style={{ width: `${Math.max(bwPct, bwPct > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      }
    />
  );
}
