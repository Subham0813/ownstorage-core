import { memo } from "react";
import { Icon, FileIcon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { useItemCard } from "../../hooks/useItemCard";
import { formatSize, timeAgo } from "../../utils/fileUtils";

export const FolderCard = memo(function FolderCard({
  item,
  isSelected,
  onSelect,
  onOpen,
  onAction,
  onShowDetails,
  onContextMenu,
  badge,
  metaText,
  timeText,
  accent = "amber",
  pending = false,
}) {
  const {
    handleClick,
    handleDoubleClick,
    handleCheckboxClick,
    handleOpenClick,
    handleMenuClick,
    handleContextMenu,
    handleKeyDown,
  } = useItemCard({ item, onSelect, onOpen, onContextMenu });

  const filesCount = item.filesCount ?? item.fileCount ?? 0;
  const dirsCount = item.dirsCount ?? item.dirCount ?? 0;
  const isFile = !!item.mime || item.type === "file";
  const totalItems =
    item.itemCount ?? item.totalItems ?? filesCount + dirsCount;

  const countsText =
    filesCount > 0 || dirsCount > 0
      ? [
          filesCount > 0
            ? `${filesCount} ${filesCount === 1 ? "file" : "files"}`
            : null,
          dirsCount > 0
            ? `${dirsCount} ${dirsCount === 1 ? "folder" : "folders"}`
            : null,
        ]
          .filter(Boolean)
          .join(", ")
      : `${totalItems} ${totalItems === 1 ? "item" : "items"}`;

  const formattedTime =
    item.updatedAt || item.createdAt
      ? timeAgo(item.updatedAt || item.createdAt)
      : null;
  const displayMeta = metaText ?? countsText;
  const displayTime = timeText ?? formattedTime;

  const metaParts = [];
  if (displayMeta) metaParts.push(displayMeta);
  if (!metaText && item.size) metaParts.push(formatSize(item.size));
  const detailedTooltip = metaParts.join(" · ");

  const ACCENTS = {
    amber: {
      selected:
        "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/80 ring-2 ring-amber-500/30 shadow-xs z-20",
      idle: "bg-white/90 dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-800/80 hover:border-amber-400/70 dark:hover:border-zinc-700 shadow-2xs hover:shadow-md",
      text: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
      btn: "hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
      checkboxSel: "bg-amber-500 border-amber-500 text-white opacity-100",
      checkboxIdle:
        "bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:border-amber-500",
    },
    blue: {
      selected:
        "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/80 ring-2 ring-blue-500/30 shadow-xs z-20",
      idle: "bg-white/90 dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-800/80 hover:border-blue-500/60 dark:hover:border-zinc-700 shadow-2xs hover:shadow-md",
      text: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
      btn: "hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
      checkboxSel: "bg-blue-500 border-blue-500 text-white opacity-100",
      checkboxIdle:
        "bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:border-blue-500",
    },
    violet: {
      selected:
        "bg-violet-500/10 dark:bg-violet-500/15 border-violet-500/80 ring-2 ring-violet-500/30 shadow-xs z-20",
      idle: "bg-white/90 dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-800/80 hover:border-violet-500/60 dark:hover:border-zinc-700 shadow-2xs hover:shadow-md",
      text: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
      btn: "hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
      checkboxSel: "bg-violet-500 border-violet-500 text-white opacity-100",
      checkboxIdle:
        "bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:border-violet-500",
    },
    rose: {
      selected:
        "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/80 ring-2 ring-rose-500/30 shadow-xs z-20",
      idle: "bg-white/90 dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-800/80 hover:border-rose-400/70 dark:hover:border-zinc-700 shadow-2xs hover:shadow-md",
      text: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
      btn: "hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
      checkboxSel: "bg-rose-500 border-rose-500 text-white opacity-100",
      checkboxIdle:
        "bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:border-rose-500",
    },
  };

  const theme = ACCENTS[accent] || ACCENTS.amber;
  const {
    selected: selectedClasses,
    idle: idleClasses,
    text: accentText,
    btn: accentBtn,
    checkboxSel: checkboxSelected,
    checkboxIdle,
  } = theme;

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
      className={`group relative p-2.5 sm:p-3 h-24 rounded-2xl border transition-[transform,box-shadow,border-color,background-color] duration-200 cursor-pointer select-none flex flex-col justify-between gap-1.5 outline-none hover:z-30 [content-visibility:auto] [contain-intrinsic-size:auto_6rem] ${
        /* isSelected ? selectedClasses : */ idleClasses
      } ${pending ? "opacity-70" : ""}`}
    >
      {/* Top Row: Checkbox + Folder Icon + Title + Open Button */}
      <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
        {/* Shelved: uncomment when bulk operations are built
        <button
          onClick={handleCheckboxClick}
          aria-label={isSelected ? "Deselect folder" : "Select folder"}
          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-[opacity,border-color,background-color] duration-150 shrink-0 ${
            isSelected ? checkboxSelected : checkboxIdle
          }`}
        >
          <Icon
            name="check"
            size={14}
            className={isSelected ? "opacity-100 text-white" : "opacity-0"}
          />
        </button>
        */}

        {isFile ? (
          <span className="shrink-0">
            <FileIcon ext={item.extension} isDir={false} size={18} />
          </span>
        ) : (
          <Icon
            name="folderFill"
            size={18}
            className="text-amber-500 dark:text-amber-400 shrink-0 drop-shadow-2xs"
          />
        )}

        <div className="min-w-0 flex-1 overflow-hidden">
          <Tooltip
            content={item.name}
            position="top-left"
            className="w-full min-w-0 overflow-hidden block"
          >
            <h4
              className={`text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 truncate transition-colors tracking-tight block w-full overflow-hidden text-ellipsis whitespace-nowrap ${accentText}`}
            >
              {item.name}
            </h4>
          </Tooltip>
        </div>

        {!badge && item.isStarred && (
          <span className="p-0.5 text-amber-400 shrink-0">
            <Icon name="starFilled" size={12} />
          </span>
        )}

        {onOpen && (
          <Tooltip
            content={isFile ? "Open file" : "Open folder"}
            position="top-right"
          >
            <button
              onClick={handleOpenClick}
              aria-label={isFile ? "Open file" : "Open folder"}
              className={`p-1 rounded-lg text-slate-400 transition-colors cursor-pointer shrink-0 ${accentBtn}`}
            >
              <Icon name="arrowUpRight" size={15} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Bottom Row: Metadata + Quick Actions + More */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
        {pending && (
          <span className="inline-flex items-center gap-1 text-blue-500 dark:text-blue-400 font-bold">
            <span className="w-3 h-3 border border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
            Syncing
          </span>
        )}
        {!pending && badge && <>{badge}</>}
        {!pending && (
        <p className="text-xs sm:text-xs font-medium text-slate-400 dark:text-zinc-400 truncate min-w-0 flex-1 font-mono">
          {displayMeta}
        </p>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {onShowDetails && (
            <Tooltip content="Details" position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetails(item);
                }}
                aria-label="Details"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Icon name="info" size={15} />
              </button>
            </Tooltip>
          )}
          {onContextMenu && (
            <Tooltip content="More actions" position="top-right">
              <button
                onClick={handleMenuClick}
                aria-label="More options"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-[color,background-color] duration-150 cursor-pointer shrink-0"
              >
                <Icon name="moreHorizontal" size={15} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});
