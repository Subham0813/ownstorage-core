import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "../../components/ui/Icon";
import {
  Btn,
  EmptyState,
  ConfirmModal,
  Skeleton,
} from "../../components/ui/UI";
import { PageBanner } from "../../components/ui/PageBanner";
import { homeAPI } from "../../api/userApi";
import { fileAPI } from "../../api/fileApi";
import { directoryAPI } from "../../api/directoryApi";
import { formatSize, timeAgo } from "../../utils/fileUtils";
import { isDirItem } from "../../utils/itemActions";
import { useApp } from "../../context/AppContext";
import { useItemSelection } from "../../hooks/useItemSelection";
import { useContextMenuState } from "../../hooks/useContextMenuState";
import { ContextMenu } from "../../components/dashboard/ContextMenu";
// import { SelectionToolbar } from "../../components/dashboard/SelectionToolbar";  // Shelved: uncomment when bulk operations are built
import { SortBar } from "../../components/dashboard/SortBar";
import { FolderGrid } from "../../components/dashboard/FolderGrid";
import { FileGrid } from "../../components/dashboard/FileGrid";

function daysUntilPurge(deletedAt, retentionDays) {
  if (!deletedAt) return null;
  const purgeAt =
    new Date(deletedAt).getTime() + retentionDays * 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((new Date(deletedAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function RetentionBadge({ days }) {
  if (days === null) return <span className="text-xs text-slate-400">—</span>;
  if (days <= 1)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wider rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs">
        Deletes today
      </span>
    );
  if (days <= 3)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        {days}d remaining
      </span>
    );
  return (
    <span className="text-xs font-extrabold text-slate-400 dark:text-zinc-400 font-mono">
      {days}d left
    </span>
  );
}

/* ─── Main Trash Component ─── */
export default function Trash() {
  const { user, showMessage } = useApp();
  const queryClient = useQueryClient();
  const retentionDays = user?.limits?.trashRetentionDays ?? 15;
  // Shelved: uncomment when bulk operations are built
  // const {
  //   selectedIds,
  //   setSelectedIds,
  //   handleSelect,
  //   handleSelectAll,
  //   handleClearSelection,
  // } = useItemSelection();
  const { ctxMenu, handleContextMenu, closeCtxMenu } = useContextMenuState();
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("trashViewMode") || "grid",
  );
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    item: null,
  });
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);

  // Invalidate bin + every cross-page list a bin action can affect
  const invalidateBinRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["bin"] });
    queryClient.invalidateQueries({ queryKey: ["user-usage"] });
    queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    queryClient.invalidateQueries({ queryKey: ["userStats"] });
    queryClient.invalidateQueries({ queryKey: ["user-starred"] });
    queryClient.invalidateQueries({ queryKey: ["user-recents"] });
    queryClient.invalidateQueries({ queryKey: ["shared"] });
    queryClient.invalidateQueries({ queryKey: ["directoryInfo"] });
    window.dispatchEvent(new CustomEvent("vd:usage-changed"));
  }, [queryClient]);

  // Optimistic: instantly drop items from the bin list; server reconciles on settle.
  const removeFromBinCache = useCallback(
    (ids) => {
      const set = new Set(ids.map(String));
      queryClient.setQueryData(["bin"], (old) => {
        if (!old) return old;
        const items = old?.data?.data?.items || [];
        if (items.length === 0) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              items: items.filter((i) => !set.has(String(i.id))),
            },
          },
        };
      });
    },
    [queryClient],
  );

  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data: binData, isLoading } = useQuery({
    queryKey: ["bin"],
    queryFn: () => homeAPI.getBin({ limit: 100 }),
    staleTime: 30_000,
  });

  const items = binData?.data?.data?.items || [];
  const totalSize = items.reduce((sum, i) => sum + (i.size || 0), 0);

  // Urgent purges (deleting within 24h)
  const urgentPurges = useMemo(() => {
    return items.filter((item) => {
      const days = daysUntilPurge(item.permanentDeleteAt, retentionDays);
      return days !== null && days <= 1;
    });
  }, [items, retentionDays]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let valA, valB;
      if (sortBy === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      } else if (sortBy === "size") {
        valA = a.size || 0;
        valB = b.size || 0;
      } else {
        valA = new Date(
          a.deletedAt || a.updatedAt || a.createdAt || 0,
        ).getTime();
        valB = new Date(
          b.deletedAt || b.updatedAt || b.createdAt || 0,
        ).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortBy, sortOrder]);

  const trashedFolders = useMemo(
    () => sortedItems.filter((i) => !i.mime || i.type === "directory"),
    [sortedItems],
  );
  const trashedFiles = useMemo(
    () => sortedItems.filter((i) => i.mime || i.type === "file"),
    [sortedItems],
  );

  const toggleViewMode = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem("trashViewMode", mode);
  }, []);

  const restoreMutation = useMutation({
    mutationFn: async (item) => {
      const api = isDirItem(item) ? directoryAPI : fileAPI;
      return api.restore(item.id);
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ["bin"] });
      const prev = queryClient.getQueryData(["bin"]);
      removeFromBinCache([item.id]);
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["bin"], ctx.prev);
      showMessage("error", "Failed to restore item");
    },
    onSuccess: () => {
      invalidateBinRelated();
      showMessage("success", "Item restored successfully");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item) => {
      const api = isDirItem(item) ? directoryAPI : fileAPI;
      return api.delete(item.id);
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ["bin"] });
      const prev = queryClient.getQueryData(["bin"]);
      removeFromBinCache([item.id]);
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["bin"], ctx.prev);
      showMessage("error", "Failed to delete item");
    },
    onSuccess: () => {
      invalidateBinRelated();
      showMessage("success", "Item permanently purged");
    },
  });

  const emptyMutation = useMutation({
    mutationFn: () => homeAPI.emptyTrash(),
    onSuccess: () => {
      invalidateBinRelated();
      showMessage("success", "Bin completely emptied");
      setConfirmEmpty(false);
    },
    onError: () => showMessage("error", "Failed to empty bin"),
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids) => {
      const toDelete = items.filter((i) => ids.includes(i.id));
      await Promise.all(
        toDelete.map((item) => {
          const api = isDirItem(item) ? directoryAPI : fileAPI;
          return api.delete(item.id);
        }),
      );
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["bin"] });
      const prev = queryClient.getQueryData(["bin"]);
      removeFromBinCache(ids);
      return { prev };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["bin"], ctx.prev);
      showMessage("error", "Failed to delete selected items");
    },
    onSuccess: () => {
      invalidateBinRelated();
      // setSelectedIds(new Set());  // Shelved: uncomment when bulk operations are built
      showMessage("success", "Selected items permanently purged");
      setConfirmDeleteSelected(false);
    },
  });

  const handleOpen = useCallback(
    () => showMessage("info", "Restore this item to open and view contents."),
    [showMessage],
  );

  const handleShowDetails = useCallback(
    (item) => {
      const days = daysUntilPurge(item.permanentDeleteAt, retentionDays);
      const meta = formatSize(item.size);
      showMessage(
        "info",
        `${item.name} · ${meta}${days !== null ? ` · auto-purges in ${days} day${days === 1 ? "" : "s"}` : ""}`,
      );
    },
    [retentionDays, showMessage],
  );

  const handleCtxAction = useCallback(
    (action, item) => {
      closeCtxMenu();
      if (action === "restore") restoreMutation.mutate(item);
      else if (action === "delete") setConfirmDelete({ isOpen: true, item });
    },
    [closeCtxMenu, restoreMutation],
  );

  return (
    <div className="flex h-full select-none pb-2">
      <div className="flex-1 min-w-0 p-0.5 sm:p-2 flex flex-col overflow-x-hidden">
        <PageBanner
          icon="trash"
          accent="rose"
          subtitle={
            <span className="text-xs font-medium leading-relaxed break-words min-w-0 text-rose-950 dark:text-rose-100">
              Items moved to bin are held for{" "}
              <strong className="font-bold">{retentionDays} days</strong> before
              being permanently purged
            </span>
          }
          containerClassName="mb-1"
          right={
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs whitespace-nowrap">
                <Icon name="hardDrive" size={13} className="text-rose-500" />
                {formatSize(totalSize)} in bin
              </span>

              {items.length > 0 && (
                <Btn
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmEmpty(true)}
                  className="font-extrabold shadow-md active:scale-95 shrink-0 cursor-pointer hover:text-rose-600 dark:hover:text-rose-200"
                >
                  <Icon name="trash" size={14} />
                  Empty Bin
                </Btn>
              )}
            </>
          }
        />

        {/* Shelved: uncomment when bulk operations are built
        <SelectionToolbar
          count={selectedIds.size}
          total={items.length}
          variant="bin"
          onClear={handleClearSelection}
          onSelectAll={() => handleSelectAll(items)}
          accent="rose"
          onAction={(action) => {
            if (action === "delete") {
              setConfirmDeleteSelected(true);
            } else if (action === "restore") {
              items
                .filter((i) => selectedIds.has(i.id))
                .forEach((item) => restoreMutation.mutate(item));
              setSelectedIds(new Set());
            }
          }}
        />
        */}

        {items.length > 0 && (
          <SortBar
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(newSortBy, newSortOrder) => {
              setSortBy(newSortBy);
              if (newSortOrder !== undefined) setSortOrder(newSortOrder);
            }}
            viewMode={viewMode}
            onViewModeChange={toggleViewMode}
            leftContent={
              urgentPurges.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 whitespace-nowrap">
                  <span className="font-mono">
                    <span className="font-bold">
                      {urgentPurges.length} item
                      {urgentPurges.length !== 1 ? "s" : ""}
                    </span>{" "}
                    deleting within 24h
                  </span>
                </div>
              )
            }
          />
        )}

        {/* Scrollable Content View (Matching Shared page scroll area) */}
        <div className="pl-2 pt-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 md:pb-0 no-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-5 h-5 rounded-lg" />
                    <Skeleton className="w-14 h-4 rounded-full" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-2xl mx-auto" />
                  <Skeleton className="h-3.5 w-3/4 mx-auto mt-3" />
                  <Skeleton className="h-2.5 w-1/2 mx-auto mt-1.5" />
                  <Skeleton className="h-4 w-full mt-auto pt-3" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center min-h-[360px] sm:min-h-[420px]">
              <EmptyState
                icon="trash"
                title="Bin is empty"
                desc="Items moved to bin will be safely held here before being permanently purged."
              />
            </div>
          ) : (
            <div className="space-y-6">
              {trashedFolders.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 px-1 flex items-center gap-2">
                    <Icon name="folder" size={14} className="text-amber-500" />
                    Trashed Folders ({trashedFolders.length})
                  </h3>
                  <FolderGrid
                    items={trashedFolders}
                    /* selectedIds={selectedIds}  Shelved */
                    /* onSelect={handleSelect}     Shelved */
                    /* onOpen={handleOpen}          Shelved — no open/star in trash */
                    onShowDetails={handleShowDetails}
                    onContextMenu={handleContextMenu}
                    accent="rose"
                    viewMode={viewMode}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(newSortBy, newSortOrder) => {
                      setSortBy(newSortBy);
                      if (newSortOrder !== undefined) setSortOrder(newSortOrder);
                    }}
                    renderBadge={(item) => (
                      <RetentionBadge
                        days={daysUntilPurge(item.permanentDeleteAt, retentionDays)}
                      />
                    )}
                    metaText={(item) => formatSize(item.size)}
                    timeText={(item) => `Deleted ${timeAgo(item.deletedAt)}`}
                  />
                </div>
              )}

              {trashedFiles.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 px-1 flex items-center gap-2">
                    <Icon name="file" size={14} className="text-rose-500" />
                    Trashed Files ({trashedFiles.length})
                  </h3>
                  <FileGrid
                    items={trashedFiles}
                    /* selectedIds={selectedIds}  Shelved */
                    /* onSelect={handleSelect}     Shelved */
                    /* onOpen={handleOpen}          Shelved — no open/star in trash */
                    onShowDetails={handleShowDetails}
                    onContextMenu={handleContextMenu}
                    accent="rose"
                    viewMode={viewMode}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(newSortBy, newSortOrder) => {
                      setSortBy(newSortBy);
                      if (newSortOrder !== undefined) setSortOrder(newSortOrder);
                    }}
                    renderBadge={(item) => (
                      <RetentionBadge
                        days={daysUntilPurge(item.permanentDeleteAt, retentionDays)}
                      />
                    )}
                    timeText={(item) => `Deleted ${timeAgo(item.deletedAt)}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={() => emptyMutation.mutate()}
        title="Empty Bin"
        message={`This will permanently purge all ${items.length} item${items.length !== 1 ? "s" : ""} (${formatSize(totalSize)}). This action cannot be undone.`}
        confirmLabel="Empty Bin"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, item: null })}
        onConfirm={() => {
          if (confirmDelete.item) deleteMutation.mutate(confirmDelete.item);
          setConfirmDelete({ isOpen: false, item: null });
        }}
        title="Delete Permanently"
        message={`"${confirmDelete.item?.name}" will be permanently deleted from cloud storage.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />

      {/* Shelved: uncomment when bulk operations are built
      <ConfirmModal
        isOpen={confirmDeleteSelected}
        onClose={() => setConfirmDeleteSelected(false)}
        onConfirm={() => deleteSelectedMutation.mutate(Array.from(selectedIds))}
        title="Delete Selected Items"
        message={`${selectedIds.size} selected item${selectedIds.size !== 1 ? "s" : ""} will be permanently deleted.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
      */}

      <ContextMenu
        isOpen={ctxMenu.isOpen}
        position={ctxMenu.position}
        item={ctxMenu.item}
        onClose={closeCtxMenu}
        onAction={handleCtxAction}
        variant="bin"
      />
    </div>
  );
}
