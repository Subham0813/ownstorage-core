import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { directoryAPI } from "../../api/directoryApi";
import { fileAPI } from "../../api/fileApi";
import { Icon, FileIcon } from "../ui/Icon";
import { formatSize, formatDate, getExtColor } from "../../utils/fileUtils";

export function DetailsPanel({
  item,
  isOpen,
  onClose,
  onAction,
  variant = "default",
  readOnly = false,
}) {
  const isDir = item?.type === "directory";
  const isShared = variant === "shared";

  const { data: info, isLoading: infoLoading } = useQuery({
    queryKey: ["itemInfo", item?.id, isDir],
    queryFn: async () => {
      const api = isDir ? directoryAPI : fileAPI;
      const res = await api.getInfo(item.id);
      return res.data?.data?.item || null;
    },
    enabled: isOpen && !!item?.id,
    staleTime: 0,
  });

  if (!isOpen || !item) return null;

  const data = info ? { ...info, ...item } : item;
  const ext = (data.extension || "").toLowerCase();
  const extLabel = isDir ? "Folder" : ext.toUpperCase() || "File";
  const color = isDir ? "#fbbf24" : getExtColor(ext);
  const fullPath = [...(data.path || []).map((p) => p.name)];
  const isLoading = infoLoading;

  return (
    <aside className="w-full shrink-0 border border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-xl shadow-xl shadow-slate-900/5 dark:shadow-2xl/40 flex flex-col h-full overflow-hidden animate-in fade-in duration-200 select-none">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="info" size={18} className="text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            Details
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details panel"
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Icon
              name="spinner"
              size={24}
              className="animate-spin text-blue-500"
            />
            <span className="text-xs font-semibold">Loading details...</span>
          </div>
        ) : (
          <>
            {/* Hero / Preview Banner */}
            <div className="flex flex-col items-center text-center px-4 pt-6 pb-4 bg-slate-50/50 dark:bg-zinc-950/20">
              {!isDir && data.thumbnailUrl ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 mb-3.5 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
                  <img
                    src={data.thumbnailUrl}
                    alt={data.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3.5 shadow-xs border border-white/60 dark:border-zinc-700/60"
                  style={{ backgroundColor: `${color}18`, color: color }}
                >
                  <FileIcon ext={data.extension} isDir={isDir} size={32} />
                </div>
              )}
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 break-all leading-snug max-w-full">
                {data.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200/50 dark:border-zinc-700/50"
                  style={{ color: color, backgroundColor: `${color}15` }}
                >
                  {extLabel}
                </span>
                {data.size != null && (
                  <span className="text-xs font-medium text-slate-400">
                    • {formatSize(data.size)}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 pb-20 space-y-4">
              {/* Properties Card */}
              <div className="bg-slate-50/80 dark:bg-zinc-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-zinc-800 space-y-3">
                <Row label="Name" value={data.name} />
                <Row label="Type" value={extLabel} />
                {data.size != null && (
                  <Row label="Size" value={formatSize(data.size)} />
                )}
                {isDir && (
                  <>
                    <Row label="Files" value={data.filesCount ?? 0} />
                    <Row label="Folders" value={data.dirsCount ?? 0} />
                  </>
                )}
                <Row label="Created" value={formatDate(data.createdAt)} />
                <Row label="Modified" value={formatDate(data.updatedAt)} />
                {data.owner ? (
                  <Row label="Owner" value={data.owner.name || "Unknown"} />
                ) : data.userId ? (
                  <Row
                    label="Owner"
                    value={data.userId.name || data.userId.email || "Unknown"}
                  />
                ) : null}
                <Row label="Location" value={"/" + fullPath.join("/")} mono />
                {isDir && (
                  <Row
                    label="Access"
                    value={
                      data.accessLevel === "public" ? "Public Link" : "Private"
                    }
                    valueClass={
                      data.accessLevel === "public"
                        ? "text-emerald-500 font-bold"
                        : ""
                    }
                  />
                )}
                {data.isStarred && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-zinc-700/50">
                    <Icon
                      name="starFilled"
                      size={14}
                      className="text-amber-400"
                    />
                    <span className="text-amber-500 dark:text-amber-400 font-bold text-xs">
                      Starred Item
                    </span>
                  </div>
                )}
              </div>

              {/* Action Cluster */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Actions
                </h5>
                <div className="grid grid-cols-2 gap-1.5">
                  {isShared ? (
                    <>
                      <ActionBtn
                        icon="arrowUpRight"
                        label="Open"
                        onClick={() => onAction("open", item)}
                        className="text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10"
                      />
                      <ActionBtn
                        icon="download"
                        label="Download"
                        onClick={() => onAction("download", item)}
                      />
                      {!readOnly && (
                        <>
                          <ActionBtn
                            icon="link"
                            label="Get Link"
                            onClick={() => onAction("getLink", item)}
                          />
                          <ActionBtn
                            icon="share"
                            label="Share"
                            onClick={() => onAction("share", item)}
                          />
                          <ActionBtn
                            icon={data.isStarred ? "starFilled" : "star"}
                            label={data.isStarred ? "Unstar" : "Star"}
                            active={data.isStarred}
                            onClick={() => onAction("star", item)}
                          />
                          <ActionBtn
                            icon="trash"
                            label="Bin"
                            danger
                            onClick={() => onAction("trash", item)}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {!isDir && (
                        <ActionBtn
                          icon="eye"
                          label="Preview"
                          onClick={() => onAction("preview", item)}
                          className="text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10"
                        />
                      )}
                      <ActionBtn
                        icon="share"
                        label="Share"
                        onClick={() => onAction("share", item)}
                      />
                      <ActionBtn
                        icon="link"
                        label="Get Link"
                        onClick={() => onAction("getLink", item)}
                      />
                      <ActionBtn
                        icon={data.isStarred ? "starFilled" : "star"}
                        label={data.isStarred ? "Unstar" : "Star"}
                        active={data.isStarred}
                        onClick={() => onAction("star", item)}
                      />
                      {!isDir && (
                        <ActionBtn
                          icon="download"
                          label="Download"
                          onClick={() => onAction("download", item)}
                        />
                      )}
                      <ActionBtn
                        icon="edit"
                        label="Rename"
                        onClick={() => onAction("rename", item)}
                      />
                      <ActionBtn
                        icon="move"
                        label="Move"
                        onClick={() => onAction("move", item)}
                      />
                      <ActionBtn
                        icon="trash"
                        label="Bin"
                        danger
                        onClick={() => onAction("trash", item)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export function DetailsMobileOverlay({
  item,
  isOpen,
  onClose,
  onAction,
  hideFrom = "lg",
  variant = "default",
  readOnly = false,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!item) return null;
  const hiddenClass = hideFrom === "md" ? "md:hidden" : "lg:hidden";

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 ${hiddenClass}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Item details"
        className={`fixed inset-x-0 bottom-0 z-[95] h-[88dvh] max-h-[720px] w-full rounded-t-3xl overflow-hidden bg-white dark:bg-zinc-900 pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-slate-950/40 border-t border-slate-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4 duration-300 ${hiddenClass}`}
      >
        <div className="w-full h-full">
          <DetailsPanel
            isOpen={isOpen}
            item={item}
            onClose={onClose}
            onAction={onAction}
            variant={variant}
            readOnly={readOnly}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}

function Row({ label, value, valueClass = "", mono = false }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 shrink-0 w-16">
        {label}
      </span>
      <span
        className={`text-xs font-medium text-right break-all ${mono ? "font-mono text-xs text-slate-600 dark:text-zinc-300" : ""} ${valueClass || "text-slate-800 dark:text-zinc-200"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  danger = false,
  active = false,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-[background-color,border-color,color,transform] border border-slate-200/60 dark:border-zinc-800 active:scale-95 cursor-pointer ${
        danger
          ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10 border-rose-200/50"
          : active
            ? "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10 border-amber-200/50"
            : "text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800"
      } ${className}`}
    >
      <Icon
        name={icon}
        size={20}
        className={
          danger
            ? "text-rose-500"
            : active
              ? "text-amber-400"
              : "text-slate-400"
        }
      />
      <span className="truncate">{label}</span>
    </button>
  );
}
