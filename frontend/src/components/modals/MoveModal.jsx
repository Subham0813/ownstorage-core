import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { directoryAPI } from "../../api/directoryApi";
import { ModalOverlay, ModalHeader, ModalFooter, Btn } from "../ui/UI";
import { Icon } from "../ui/Icon";

function FolderNode({
  id,
  name,
  currentItemId,
  selectedId,
  onSelect,
  depth = 0,
  isRoot = false,
}) {
  const [expanded, setExpanded] = useState(isRoot);
  const { data, isLoading } = useQuery({
    queryKey: ["dirChildren", id],
    queryFn: async () => {
      const res = await directoryAPI.getAllDirs(id, { limit: 50 });
      return res.data?.data?.items || [];
    },
    enabled: expanded,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });

  const children = data || [];
  const isCurrent = id === currentItemId;
  const isSelected = id === selectedId;

  const handleRowClick = () => {
    if (isSelected) {
      setExpanded(!expanded);
    } else {
      onSelect(id, name);
    }
  };

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute left-[21px] top-0 bottom-0 w-px bg-slate-200 dark:bg-zinc-700/60" />
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRowClick();
          }
        }}
        className={`w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-[color,background-color,transform] relative cursor-pointer ${
          isSelected
            ? "bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30"
            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80"
        }`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {depth > 0 && (
          <div className="absolute left-[21px] top-1/2 w-[11px] h-px bg-slate-200 dark:bg-zinc-700/60" />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
        >
          <Icon
            name={expanded ? "chevronDown" : "chevronRight"}
            size={14}
            className="text-slate-400"
          />
        </button>

        <Icon
          name={isRoot ? "home" : expanded ? "folderOpenFill" : "folderFill"}
          size={18}
          className={
            isSelected
              ? "text-blue-500"
              : isRoot
                ? "text-indigo-500"
                : "text-amber-500"
          }
        />

        <span className="truncate font-semibold">{name}</span>

        {isCurrent && (
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 ml-auto leading-none border border-slate-200/50 dark:border-zinc-700/50">
            Current
          </span>
        )}
      </div>

      {expanded && isLoading && (
        <div
          className="flex items-center gap-2 py-2 text-xs text-slate-400"
          style={{ paddingLeft: `${(depth + 1) * 24 + 12}px` }}
        >
          <Icon
            name="loader"
            size={14}
            className="animate-spin text-blue-500"
          />
          <span>Loading...</span>
        </div>
      )}

      {expanded && !isLoading && children.length === 0 && (
        <div
          className="py-1.5 text-xs text-slate-400 dark:text-zinc-400 italic"
          style={{ paddingLeft: `${(depth + 1) * 24 + 12}px` }}
        >
          No subfolders
        </div>
      )}

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ${
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children.map((child) => (
          <FolderNode
            key={child.id}
            id={child.id}
            name={child.name}
            currentItemId={currentItemId}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
}

export function MoveModal({
  item,
  items,
  isOpen,
  onClose,
  onMove,
  onCopy,
  rootDirId,
  mode = "move",
}) {
  const queryClient = useQueryClient();
  const [selectedDest, setSelectedDest] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedDest(null);
      setSelectedPath("");
      queryClient.invalidateQueries({ queryKey: ["dirChildren"] });
    }
  }, [isOpen, queryClient]);

  if (!isOpen) return null;

  const moveItems = items?.length ? items : item ? [item] : [];
  if (moveItems.length === 0) return null;

  const isBulk = Array.isArray(items) && items.length > 1;
  const currentParentId = isBulk || !item ? null : item.parentId;
  const isCopy = mode === "copy";

  const handleAction = async () => {
    if (!selectedDest || (!isCopy && selectedDest === currentParentId)) return;
    setLoading(true);
    try {
      if (isCopy) {
        await onCopy(item, selectedDest);
      } else if (isBulk || !item) {
        await onMove(moveItems, selectedDest);
      } else {
        await onMove(item, selectedDest);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-md">
      <ModalHeader
        title={
          isBulk
            ? `Move ${moveItems.length} items`
            : `${isCopy ? "Copy" : "Move"} "${item.name}"`
        }
        sub="Choose a destination folder"
        onClose={onClose}
      />
      <div className="max-h-[300px] overflow-y-auto border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-1.5 mb-2 no-scrollbar bg-slate-50/50 dark:bg-zinc-900/50">
        <FolderNode
          id={rootDirId}
          name="Home"
          isRoot
          currentItemId={currentParentId}
          selectedId={selectedDest}
          onSelect={(id, name) => {
            setSelectedDest(id);
            setSelectedPath(name);
          }}
        />
      </div>

      {selectedDest && (selectedDest !== currentParentId || isCopy) && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-3 bg-slate-100/60 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-700/50">
          Target:{" "}
          <span className="font-bold text-slate-800 dark:text-zinc-200">
            /{selectedPath}
          </span>
        </p>
      )}

      <ModalFooter>
        <Btn variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          onClick={handleAction}
          disabled={
            loading ||
            !selectedDest ||
            (!isCopy && selectedDest === currentParentId)
          }
        >
          {loading
            ? `${isCopy ? "Copying" : "Moving"}...`
            : `${isCopy ? "Copy" : "Move"} Here`}
        </Btn>
      </ModalFooter>
    </ModalOverlay>
  );
}
