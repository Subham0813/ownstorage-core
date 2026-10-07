import { memo, useState } from "react";
import { Icon, FileIcon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { useItemCard } from "../../hooks/useItemCard";
import { formatSize, getExtColor, timeAgo } from "../../utils/fileUtils";

export const FileCard = memo(function FileCard({
  item,
  isSelected,
  onSelect,
  onOpen,
  onShowDetails,
  onContextMenu,
  badge,
  timeText,
  pending = false,
}) {
  const [imgError, setImgError] = useState(false);
  const isDir = item.type === "directory";
  const ext = (item.extension || "").toLowerCase() || "file";
  const color = getExtColor(ext);

  const {
    handleClick,
    handleDoubleClick,
    handleCheckboxClick,
    handleOpenClick,
    handleMenuClick,
    handleContextMenu,
    handleKeyDown,
  } = useItemCard({ item, onSelect, onOpen, onContextMenu });

  const sizeText = formatSize(item.size);
  const dateText = timeText ?? timeAgo(item.updatedAt || item.createdAt);

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
      className={`group relative h-48 sm:h-52 rounded-2xl border transition-[transform,box-shadow,border-color] duration-300 cursor-pointer select-none outline-none flex flex-col justify-between p-3.5 hover:z-30 [content-visibility:auto] [contain-intrinsic-size:auto_13rem] ${
        isSelected
          ? "border-blue-500 dark:border-zinc-400 ring-2 ring-blue-500/40 dark:ring-zinc-500/40 shadow-xl scale-[1.01] z-20"
          : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800/80 hover:border-blue-500/60 dark:hover:border-zinc-600/80 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08)] dark:shadow-black/60 dark:hover:shadow-black/90"
      } ${pending ? "opacity-70" : ""}`}
    >
      {/* Background Hero Canvas Container */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {item.thumbnailUrl && !imgError ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ease-out"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${color}40 0%, ${color}15 65%, #09090b 100%)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${color}30`, color: "#ffffff" }}
            >
              <FileIcon ext={item.extension} isDir={isDir} size={36} />
            </div>
          </div>
        )}
        {/* Dark Gradient Overlay for perfect label readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20 group-hover:from-slate-950/95 transition-colors" />
      </div>

      {/* Top-Right Floating Controls (star + open) pinned to the card corner */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
        {!badge && item.isStarred && (
          <span className="p-0.5 text-amber-400 shrink-0 drop-shadow-md">
            <Icon name="starFilled" size={15} />
          </span>
        )}
        {onOpen && (
          <Tooltip content="Open" position="top-left" className="shrink-0">
            <button
              onClick={handleOpenClick}
              aria-label="Open file"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <Icon name="arrowUpRight" size={22} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Top Floating Controls */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Shelved: uncomment when bulk operations are built
        <button
          onClick={handleCheckboxClick}
          aria-label={isSelected ? "Deselect file" : "Select file"}
          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-[opacity,transform,border-color,background-color] duration-150 ${
            isSelected
              ? "bg-blue-600 border-blue-600 text-white shadow-md scale-100 opacity-100"
              : "bg-slate-950/40 border-white/40 text-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-90 hover:border-blue-400"
          }`}
        >
          <Icon
            name="check"
            size={14}
            className={isSelected ? "opacity-100 text-white" : "opacity-0"}
          />
        </button>
        */}
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-md bg-slate-950/80 text-white border-white/20 font-mono">
            {ext}
          </span>
          {pending && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-md bg-blue-500/20 text-blue-300 border-blue-400/40 font-mono">
              Syncing
            </span>
          )}
        </div>
      </div>

      {/* Bottom Floating Information Overlay */}
      <div className="relative z-10 flex flex-col items-end justify-between gap-2 min-w-0 w-full overflow-hidden">
        {badge && <span className="shrink-0">{badge}</span>}

        <div className="flex min-w-0 flex-1 w-full justify-between items-center">
          <div className="min-w-0 flex-1 overflow-hidden pr-2">
            <Tooltip
              content={item.name}
              position="top-left"
              className="w-full min-w-0 overflow-hidden block"
            >
              <h4 className="text-xs sm:text-sm font-extrabold text-white truncate drop-shadow-md max-w-full font-display block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {item.name}
              </h4>
            </Tooltip>
            <div className="flex items-center justify-between gap-2 mt-1 min-w-0 overflow-hidden">
              <span className="text-xs sm:text-xs font-bold text-slate-200 truncate min-w-0 font-mono drop-shadow-xs">
                {sizeText}
              </span>
              <span className="text-xs sm:text-xs font-semibold text-slate-300 truncate min-w-0 font-mono drop-shadow-xs">
                {dateText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onShowDetails && (
              <Tooltip content="Details" position="top-left" className="shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDetails(item);
                  }}
                  aria-label="Details"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  <Icon name="info" size={15} />
                </button>
              </Tooltip>
            )}
            {onContextMenu && (
              <Tooltip content="More actions" position="top-right" className="shrink-0">
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
    </div>
  );
});
