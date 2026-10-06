import { memo } from "react";
import { Icon, FileIcon } from "../ui/Icon";
import { formatSize, timeAgo, getExtColor } from "../../utils/fileUtils";

export const QuickAccessItem = memo(function QuickAccessItem({ item, onClick }) {
  const isDir = !item.extension;
  const ext = (item.extension || "").toLowerCase();
  const color = isDir ? "#f59e0b" : getExtColor(ext);
  const updatedDate = item.updatedAt || item.createdAt;

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-3 px-3.5 sm:px-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-zinc-700 hover:shadow-md transition-[box-shadow,border-color,background-color] duration-200 text-left group cursor-pointer select-none"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200/60 dark:border-zinc-800 shadow-2xs group-hover:scale-105 transition-transform"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <FileIcon ext={item.extension} isDir={isDir} size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              title={item.name}
            >
              {item.name}
            </span>
            {item.isStarred && (
              <span className="shrink-0 p-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-400/30">
                <Icon name="starFilled" size={9} className="drop-shadow-2xs" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-zinc-400 font-mono">
            {ext ? (
              <span
                className="px-1.5 py-0.2 rounded text-xs font-bold uppercase border border-slate-200/60 dark:border-zinc-700/60 bg-slate-100/80 dark:bg-zinc-800/80"
                style={{ color }}
              >
                {ext}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-xs font-bold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/20">
                Folder
              </span>
            )}
            <span className="truncate">Updated {timeAgo(updatedDate)}</span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span className="font-semibold text-slate-500 dark:text-zinc-400">
              {formatSize(item.size)}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800/80 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-[background-color,color,transform] shadow-2xs group-hover:scale-105 border border-slate-200/60 dark:border-zinc-700/60">
        <Icon name="arrowUpRight" size={15} />
      </div>
    </button>
  );
});
