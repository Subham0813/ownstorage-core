import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAPI } from "../../api/searchApi";
import { fileAPI } from "../../api/fileApi";
import { directoryAPI } from "../../api/directoryApi";
import { useApp } from "../../context/AppContext";
import { isDirItem } from "../../utils/itemActions";
import { useContextMenuState } from "../../hooks/useContextMenuState";
import { FolderGrid } from "../../components/dashboard/FolderGrid";
import { FileGrid } from "../../components/dashboard/FileGrid";
import { SortBar } from "../../components/dashboard/SortBar";
import { ContextMenu } from "../../components/dashboard/ContextMenu";
import { DetailsDock } from "../../components/dashboard/DetailsDock";
import { ShareModal } from "../../components/modals/ShareModal";
import { MoveModal } from "../../components/modals/MoveModal";
import { EmptyState } from "../../components/ui/UI";
import { Icon } from "../../components/ui/Icon";
import { GridSkeleton } from "../../components/dashboard/skeletons";
// import { SelectionToolbar } from "../../components/dashboard/SelectionToolbar";  // Shelved: uncomment when bulk operations are built

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showMessage, rootDirId } = useApp();
  const query = searchParams.get("q") || "";

  const [dirs, setDirs] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  // Shelved: uncomment when bulk operations are built
  // const { selectedIds, setSelectedIds, handleSelect } = useItemSelection({
  //   single: true,
  // });
  const { ctxMenu, handleContextMenu, closeCtxMenu } = useContextMenuState();
  const [detailsPanel, setDetailsPanel] = useState({
    isOpen: false,
    item: null,
  });

  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent("details-panel-toggle", {
        detail: { open: detailsPanel.isOpen },
      }),
    );
  }, [detailsPanel.isOpen]);
  const [shareModal, setShareModal] = useState({ isOpen: false, item: null });
  const [moveModal, setMoveModal] = useState({ isOpen: false, items: null });

  const sortedDirs = useMemo(() => {
    const arr = [...dirs];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "date")
        cmp =
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt);
      else if (sortBy === "size") cmp = (a.size || 0) - (b.size || 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [dirs, sortBy, sortOrder]);

  const sortedFiles = useMemo(() => {
    const arr = [...files];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "date")
        cmp =
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt);
      else if (sortBy === "size") cmp = (a.size || 0) - (b.size || 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [files, sortBy, sortOrder]);

  const allItems = useMemo(
    () => [...sortedDirs, ...sortedFiles],
    [sortedDirs, sortedFiles],
  );

  useEffect(() => {
    if (!query.trim()) {
      setDirs([]);
      setFiles([]);
      setFetched(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [dirRes, fileRes] = await Promise.all([
          searchAPI.dirs({ q: query, limit: 50 }),
          searchAPI.files({ q: query, limit: 50 }),
        ]);
        if (cancelled) return;
        const rawDirs = dirRes.data?.data?.items || [];
        const rawFiles = fileRes.data?.data?.items || [];
        setDirs(rawDirs);
        setFiles(rawFiles);
        setFetched(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    setDetailsPanel({ isOpen: false, item: null });
    setShareModal({ isOpen: false, item: null });
    setMoveModal({ isOpen: false, items: null });
    // setSelectedIds(new Set());  // Shelved: uncomment when bulk operations are built
  }, [query]);

  const handleOpen = useCallback(
    async (item) => {
      if (isDirItem(item)) {
        navigate(`/myfiles/folders/${item.id}`);
      } else {
        try {
          const res = await fileAPI.getPreviewUrl(item.id);
          const url = res.data?.data?.url;
          if (url) window.open(url, "_blank");
          else showMessage("error", "Could not generate preview.");
        } catch {
          showMessage("error", "Failed to load preview.");
        }
      }
    },
    [navigate, showMessage],
  );

  const handleShowDetails = useCallback((item) => {
    setDetailsPanel({ isOpen: true, item });
    // setSelectedIds(new Set([item.id]));  // Shelved: uncomment when bulk operations are built
  }, []);

  const handleCtxAction = useCallback(
    async (action, item) => {
      const isDir = isDirItem(item);
      const api = isDir ? directoryAPI : fileAPI;

      try {
        switch (action) {
          case "open":
          case "preview":
            handleOpen(item);
            break;
          case "download": {
            if (isDir) {
              window.open(
                `/api/directories/download/${item.id}`,
                "_blank",
                "noopener,noreferrer",
              );
            } else {
              const res = await api.getDownloadUrl(item.id);
              const url = res.data?.data?.url;
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }
            break;
          }
          case "rename":
            showMessage("info", "Rename from the item's folder.");
            break;
          case "copy":
            showMessage("info", "Copy from the item's folder.");
            break;
          case "move":
            showMessage("info", "Move from the item's folder.");
            break;
          case "share":
            setShareModal({ isOpen: true, item });
            break;
          case "star": {
            const starValue = !item.isStarred;
            const apply = (l) =>
              l.map((x) =>
                x.id === item.id ? { ...x, isStarred: starValue } : x,
              );
            setDirs((prev) => apply(prev));
            setFiles((prev) => apply(prev));
            try {
              await api.toggleStar(item.id, starValue);
              showMessage("success", item.isStarred ? "Unstarred" : "Starred");
            } catch (err) {
              const rollback = (l) =>
                l.map((x) =>
                  x.id === item.id ? { ...x, isStarred: item.isStarred } : x,
                );
              setDirs((prev) => rollback(prev));
              setFiles((prev) => rollback(prev));
              showMessage(
                "error",
                err?.response?.data?.message || "Action failed.",
              );
            }
            break;
          }
          case "details":
            handleShowDetails(item);
            break;
          case "trash": {
            const wasDir = isDir;
            setDirs((prev) => prev.filter((d) => d.id !== item.id));
            setFiles((prev) => prev.filter((f) => f.id !== item.id));
            try {
              await api.trash(item.id);
              showMessage("success", "Moved to bin");
            } catch (err) {
              if (wasDir) setDirs((prev) => [...prev, item]);
              else setFiles((prev) => [...prev, item]);
              showMessage(
                "error",
                err?.response?.data?.message || "Action failed.",
              );
            }
            break;
          }
          default:
            break;
        }
      } catch (err) {
        showMessage("error", err?.response?.data?.message || "Action failed.");
      }
    },
    [handleOpen, handleShowDetails, showMessage],
  );

  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "folders" | "files"

  const filteredDirs = useMemo(() => {
    if (activeFilter === "files") return [];
    return sortedDirs;
  }, [sortedDirs, activeFilter]);

  const filteredFiles = useMemo(() => {
    if (activeFilter === "folders") return [];
    return sortedFiles;
  }, [sortedFiles, activeFilter]);

  const handleSortChange = useCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    if (newSortOrder !== undefined) setSortOrder(newSortOrder);
  }, []);

  const handleDetailsAction = useCallback(
    async (action, item) => {
      await handleCtxAction(action, item);
      if (["star", "trash", "rename", "move"].includes(action)) {
        setDetailsPanel((prev) => ({ ...prev, isOpen: false }));
        // setSelectedIds(new Set());  // Shelved: uncomment when bulk operations are built
      }
    },
    [handleCtxAction],
  );

  // Shelved: uncomment when bulk operations are built
  // const handleBulkAction = useCallback(
  //   async (action) => {
  //     const ids = Array.from(selectedIds);
  //     if (ids.length === 0) return;
  //     const selectedItems = allItems.filter((i) => ids.includes(i.id));
  //
  //     try {
  //       switch (action) {
  //         case "preview":
  //           if (selectedItems.length === 1) {
  //             handleOpen(selectedItems[0]);
  //           } else {
  //             showMessage("info", "Open works on a single item.");
  //           }
  //           break;
  //         case "download": {
  //           const downloadItems = selectedItems.map((i) => ({
  //             type: i.mime ? "file" : "directory",
  //             id: i.id,
  //           }));
  //           if (downloadItems.length > 0) {
  //             fileAPI.bulkDownload(downloadItems);
  //             showMessage(
  //               "info",
  //               `Downloading ${downloadItems.length} item${downloadItems.length > 1 ? "s" : ""}...`,
  //             );
  //           }
  //           break;
  //         }
  //         case "star": {
  //           const value = selectedItems.some((i) => !i.isStarred);
  //           setDirs((prev) =>
  //             prev.map((d) =>
  //               ids.includes(d.id) ? { ...d, isStarred: value } : d,
  //             ),
  //           );
  //           setFiles((prev) =>
  //             prev.map((f) =>
  //               ids.includes(f.id) ? { ...f, isStarred: value } : f,
  //             ),
  //           );
  //           try {
  //             await Promise.all(
  //               selectedItems.map((item) => {
  //                 const api = isDirItem(item) ? directoryAPI : fileAPI;
  //                 return api.toggleStar(item.id, !item.isStarred);
  //               }),
  //             );
  //             showMessage("success", `Starred ${ids.length} items`);
  //           } catch (err) {
  //             const rollback = (prev, key) =>
  //               prev.map((item) => {
  //                 if (!ids.includes(item.id)) return item;
  //                 const original = selectedItems.find((s) => s.id === item.id);
  //                 return original ? { ...item, isStarred: original.isStarred } : item;
  //               });
  //             setDirs((prev) => rollback(prev));
  //             setFiles((prev) => rollback(prev));
  //             showMessage(
  //               "error",
  //               err?.response?.data?.message || "Action failed.",
  //             );
  //           }
  //           break;
  //         }
  //         case "trash": {
  //           const removedItems = selectedItems;
  //           setDirs((prev) => prev.filter((d) => !ids.includes(d.id)));
  //           setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
  //           try {
  //             await Promise.all(
  //               selectedItems.map((item) => {
  //                 const api = isDirItem(item) ? directoryAPI : fileAPI;
  //                 return api.trash(item.id);
  //               }),
  //             );
  //             showMessage("success", `Moved ${ids.length} items to bin`);
  //           } catch (err) {
  //             const dirsToRestore = removedItems.filter((i) => isDirItem(i));
  //             const filesToRestore = removedItems.filter((i) => !isDirItem(i));
  //             setDirs((prev) => [...prev, ...dirsToRestore]);
  //             setFiles((prev) => [...prev, ...filesToRestore]);
  //             showMessage(
  //               "error",
  //               err?.response?.data?.message || "Action failed.",
  //             );
  //           }
  //           break;
  //         }
  //         case "move":
  //           if (selectedItems.length > 0) {
  //             setMoveModal({ isOpen: true, items: selectedItems });
  //           }
  //           break;
  //         default:
  //           break;
  //       }
  //       setSelectedIds(new Set());
  //     } catch (err) {
  //       showMessage("error", err?.response?.data?.message || "Action failed.");
  //     }
  //   },
  //   [selectedIds, allItems, handleOpen, showMessage],
  // );

  const handleBulkMove = useCallback(
    async (items, targetId) => {
      const ids = items.map((i) => i.id);
      const movedItems = items;
      setDirs((prev) => prev.filter((d) => !ids.includes(d.id)));
      setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
      try {
        await Promise.all(
          items.map((item) => {
            const api = isDirItem(item) ? directoryAPI : fileAPI;
            return api.move(item.id, targetId);
          }),
        );
        setMoveModal({ isOpen: false, items: null });
        showMessage(
          "success",
          `Moved ${items.length} item${items.length > 1 ? "s" : ""}`,
        );
      } catch (err) {
        const dirsToRestore = movedItems.filter((i) => isDirItem(i));
        const filesToRestore = movedItems.filter((i) => !isDirItem(i));
        setDirs((prev) => [...prev, ...dirsToRestore]);
        setFiles((prev) => [...prev, ...filesToRestore]);
        showMessage(
          "error",
          err?.response?.data?.message || "Failed to move items.",
        );
        setMoveModal({ isOpen: false, items: null });
      }
    },
    [showMessage],
  );

  const hasResults = dirs.length > 0 || files.length > 0;

  if (!query.trim()) {
    return (
      <div className="py-12 px-4 sm:px-6 select-none flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-4 shadow-sm">
          <Icon name="search" size={32} />
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100">
          Search Your Drive
        </h3>
        <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-zinc-400 max-w-sm mt-1">
          Type a keyword in the top search bar to quickly find any files or
          folders in your cloud storage.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-4 sm:py-6 px-4 sm:px-6 pb-20 lg:pb-0">
        <GridSkeleton />
      </div>
    );
  }

  if (!hasResults && fetched) {
    return (
      <div className="py-12 px-4 sm:px-6 select-none flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 flex items-center justify-center mb-4 shadow-xs">
          <Icon name="search" size={32} />
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100">
          No matches found for "{query}"
        </h3>
        <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-zinc-400 max-w-sm mt-1">
          We couldn't find any items matching your query. Check for typos or try
          searching for broader keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full select-none">
      <div className="flex-1 min-w-0 p-0.5 sm:p-2 flex flex-col relative overflow-x-hidden">
        <div className="relative overflow-hidden rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-purple-500/15 dark:from-blue-900/60 dark:via-indigo-950/40 dark:to-purple-950/60 p-2 text-slate-900 dark:text-white shadow-md backdrop-blur-xl">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg ring-4 ring-blue-500/20">
                <Icon name="search" size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                    Search Results for
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/80 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/15 truncate max-w-[200px] sm:max-w-xs">
                    "{query}"
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  Found {allItems.length} matching item
                  {allItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shelved: uncomment when bulk operations are built
        <SelectionToolbar
          count={selectedIds.size}
          total={allItems.length}
          onAction={handleBulkAction}
          onClear={() => setSelectedIds(new Set())}
          accent="amber"
        />
        */}
        <div className="flex items-center justify-end gap-1.5">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
            {[
              { id: "all", label: "All", count: allItems.length },
              { id: "folders", label: "Folders", count: dirs.length },
              { id: "files", label: "Files", count: files.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}{" "}
                <span className="opacity-60 text-xs">({tab.count})</span>
              </button>
            ))}
          </div>

          <SortBar
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        <div className="mt-2 flex-1 overflow-y-auto min-h-0 pb-20 lg:pb-0 no-scrollbar">
          {filteredDirs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-2.5 px-0.5 flex items-center gap-1.5">
                <Icon name="folderFill" size={14} className="text-amber-500" />
                <span>Folders ({filteredDirs.length})</span>
              </h3>
              <FolderGrid
                items={filteredDirs}
                /* selectedIds={selectedIds}  Shelved */
                /* onSelect={handleSelect}     Shelved */
                onOpen={handleOpen}
                onShowDetails={handleShowDetails}
                onContextMenu={handleContextMenu}
                accent="amber"
              />
            </div>
          )}

          {filteredFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-2.5 px-0.5 flex items-center gap-1.5">
                <Icon name="file" size={14} className="text-blue-500" />
                <span>Files ({filteredFiles.length})</span>
              </h3>
              <FileGrid
                items={filteredFiles}
                /* selectedIds={selectedIds}  Shelved */
                /* onSelect={handleSelect}     Shelved */
                onOpen={handleOpen}
                onShowDetails={handleShowDetails}
                onContextMenu={handleContextMenu}
              />
            </div>
          )}
        </div>
      </div>

      <DetailsDock
        item={detailsPanel.item}
        open={!!detailsPanel.item}
        breakpoint="lg"
        onClose={() => {
          setDetailsPanel({ isOpen: false, item: null });
          // setSelectedIds(new Set());  // Shelved: uncomment when bulk operations are built
        }}
        onAction={handleDetailsAction}
      />

      <ContextMenu
        isOpen={ctxMenu.isOpen}
        position={ctxMenu.position}
        item={ctxMenu.item}
        onClose={closeCtxMenu}
        onAction={handleCtxAction}
      />

      <ShareModal
        isOpen={shareModal.isOpen}
        item={shareModal.item}
        onClose={() => setShareModal({ isOpen: false, item: null })}
      />

      <MoveModal
        isOpen={moveModal.isOpen}
        items={moveModal.items}
        onClose={() => setMoveModal({ isOpen: false, items: null })}
        onMove={handleBulkMove}
        rootDirId={rootDirId}
      />
    </div>
  );
}
