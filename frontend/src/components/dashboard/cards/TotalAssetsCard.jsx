import KpiCard from "../KpiCard";
import { formatSize } from "../../../utils/fileUtils";

export function TotalAssetsCard({ stats }) {
  const totalFiles = stats?.totalFiles ?? 0;
  const totalDirs = stats?.totalDirs ?? 0;
  const totalSize = stats?.totalSize ?? 0;

  return (
    <KpiCard
      icon="folder"
      iconClass="bg-gradient-to-tr from-amber-500 to-orange-600"
      glow="shadow-amber-500/20"
      blobClass="bg-amber-500/10"
      label="Total Assets"
      pill={formatSize(totalSize)}
      pillClass="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono"
      footer={
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total Files</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
              {totalFiles.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Folders</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
              {totalDirs.toLocaleString()}
            </p>
          </div>
        </div>
      }
    />
  );
}
