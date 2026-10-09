import { memo } from "react";
import { Icon, FileIcon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import SafeImage from "../ui/SafeImage";
import { useItemCard } from "../../hooks/useItemCard";
import { formatSize, getExtColor, timeAgo } from "../../utils/fileUtils";

export const FileListCard = memo(function FileListCard({
  item,
  isSelected,
  onSelect,
  onOpen,
  onShowDetails,
  onContextMenu,
  onAction,
  badge,
  metaText,
  timeText,
  accent = "blue",
}) {
  const isDir = item.type === "directory";

  const {
    handleClick,
    handleDoubleClick,
    handleCheckboxClick,
    handleMenuClick,
    handleContextMenu,
    handleKeyDown,
  } = useItemCard({ item, onSelect, onOpen, onContextMenu });

  const ACCENT_COLORS = {
    blue: "#3b82f6",
    amber: "#f59e0b",
    violet: "#8b5cf6",
    rose: "#f43f5e",
  };
  const accentColor = ACCENT_COLORS[accent] || ACCENT_COLORS.blue;

  const ext = isDir ? null : (item.extension || "").toLowerCase();
  const color = isDir ? "#fbbf24" : getExtColor(ext);

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      data-item-id={item.id}
      className={`group relative flex items-center gap-2.5 sm:gap-3 pl-2 pr-2 sm:pl-3.5 sm:pr-3 py-2.5 rounded-lg transition-[background-color] duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 [content-visibility:auto] [contain-intrinsic-size:auto_3.25rem] border-b border-slate-100 dark:border-zinc-800/60 last:border-b-0 ${
        /* isSelected
          ? "bg-slate-100/80 dark:bg-zinc-800/60"
          : */ "hover:bg-slate-50 dark:hover:bg-zinc-800/40"
      }`}
    >
      <span
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full transition-opacity duration-200 ${
          /* isSelected ? "opacity-100" : */ "opacity-0 group-hover:opacity-40"
        }`}
        style={{ backgroundColor: accentColor }}
      />

      {/* Shelved: uncomment when bulk operations are built
      <button
        onClick={handleCheckboxClick}
        aria-label={isSelected ? "Deselect item" : "Select item"}
        className={`w-[18px] h-[18px] rounded-md flex items-center justify-center border transition-[opacity,border-color,background-color] duration-150 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          isSelected
            ? "bg-blue-600 border-blue-600 text-white shadow-xs"
            : "bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-600 text-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:border-blue-500"
        }`}
      >
        <Icon
          name="check"
          size={14}
          className={isSelected ? "opacity-100" : "opacity-0"}
        />
      </button>
      */}

      <Tooltip
        content={`${isDir ? "Folder" : "File"} · ${metaText ?? (isDir ? `${item.filesCount ?? 0} items` : formatSize(item.size))}`}
        position="top"
      >
        <div
          className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border transition-colors duration-200"
          style={
            isDir
              ? {
                  backgroundColor: "rgba(251,191,36,0.12)",
                  borderColor: "rgba(251,191,36,0.25)",
                }
              : { backgroundColor: `${color}18`, borderColor: `${color}30` }
          }
        >
          <SafeImage
            src={isDir ? null : item.thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            fallback={<FileIcon ext={item.extension} isDir={isDir} size={20} />}
          />
        </div>
      </Tooltip>

      {/* Name + inline badge (keeps column alignment with header's flex name cell) */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="flex-1 min-w-0 flex flex-col">
          <Tooltip
            content={item.name}
            position="top-left"
            className="w-full min-w-0 overflow-hidden block"
          >
            <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate transition-colors block w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {item.name}
            </h4>
          </Tooltip>
          <span className="block sm:hidden text-xs font-medium text-slate-400 dark:text-zinc-500 truncate">
            {metaText ??
              (isDir ? `${item.filesCount ?? 0} items` : formatSize(item.size))}
            {" · "}
            {timeText ?? timeAgo(item.updatedAt || item.createdAt)}
          </span>
        </div>
        {badge && <span className="hidden sm:inline-flex shrink-0">{badge}</span>}
      </div>

      <span className="hidden sm:block w-20 text-right text-xs font-medium text-slate-500 dark:text-zinc-400 font-mono tabular-nums truncate shrink-0">
        {metaText ?? (isDir ? `${item.filesCount ?? 0} items` : formatSize(item.size))}
      </span>

      <span className="hidden sm:block w-28 text-right text-xs text-slate-400 dark:text-zinc-400 truncate shrink-0">
        {timeText ?? timeAgo(item.updatedAt || item.createdAt)}
      </span>

      <span className="flex w-6 justify-center shrink-0">
        {item.isStarred && (
          <Icon name="starFilled" size={15} className="text-amber-400" />
        )}
      </span>

      <span className="flex items-center justify-end w-9 shrink-0">
        <Tooltip content="More options" position="left">
          <button
            onClick={handleMenuClick}
            aria-label="More options"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <Icon name="moreHorizontal" size={16} />
          </button>
        </Tooltip>
      </span>
    </div>
  );
});