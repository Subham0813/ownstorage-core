import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "../../components/ui/Icon";
import { EmptyState, Skeleton } from "../../components/ui/UI";
import { PageBanner } from "../../components/ui/PageBanner";
import { homeAPI } from "../../api/userApi";
import { fileAPI } from "../../api/fileApi";
import { directoryAPI } from "../../api/directoryApi";
import {
  isDirItem,
  getPublicLinkToken,
  copyPublicLink,
} from "../../utils/itemActions";
import { useApp } from "../../context/AppContext";
import { useFolderContents } from "../../hooks/useFolderContents";
import { useBreadcrumbs } from "../../hooks/useDirectoryInfo";
import { useItemSelection } from "../../hooks/useItemSelection";
import { useContextMenuState } from "../../hooks/useContextMenuState";
import { useHighlight } from "../../hooks/useHighlight";
import { ContextMenu } from "../../components/dashboard/ContextMenu";
import {
  useBreadcrumbCollapse,
  partitionCrumbs,
  EllipsisMenu,
} from "../../components/dashboard/Breadcrumb";
import { ShareModal } from "../../components/modals/ShareModal";
import { DetailsDock } from "../../components/dashboard/DetailsDock";
import { SharedGridSkeleton } from "../../components/dashboard/skeletons";
// import { SelectionToolbar } from "../../components/dashboard/SelectionToolbar";  // Shelved: uncomment when bulk operations are built
import { SortBar } from "../../components/dashboard/SortBar";
import { FolderGrid } from "../../components/dashboard/FolderGrid";
import { FileGrid } from "../../components/dashboard/FileGrid";

/* ─── Breadcrumb for shared folders ─── */
function SharedCrumb({ item, isLast, noChevron = false, linkFor }) {
  const to = linkFor(item);
  return (
    <span className="flex items-center gap-1 shrink-0">
      {!noChevron && (
        <Icon
          name="chevronRight"
          size={12}
          className="text-slate-400 dark:text-zinc-400"
        />
      )}
      {isLast ? (
        <span
          className="font-extrabold text-slate-900 dark:text-zinc-100 truncate max-w-[180px] sm:max-w-[240px] px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
          title={item.name}
        >
          {item.name}
        </span>
      ) : (
        <Link
          to={to}
          className="px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-slate-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate max-w-[140px] sm:max-w-[180px]"
          title={item.name}
        >
          {item.name}
        </Link>
      )}
    </span>
  );
}

function SharedBreadcrumb({ items }) {
  const { navRef, collapsed, isSmall } = useBreadcrumbCollapse(
    items?.length || 0,
  );
  if (!items || items.length === 0) return null;

  const { leading, trailing, hidden } = isSmall
    ? { leading: [], trailing: items.slice(-1), hidden: items.slice(0, -1) }
    : partitionCrumbs(items, collapsed);
  const linkFor = (item) => `/shared/folders/${item.id}`;

  return (
    <nav
      ref={navRef}
      className="flex items-center gap-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 overflow-x-auto no-scrollbar"
    >
      <Link
        to="/shared"
        className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-purple-500/10 transition-colors shrink-0 text-purple-600 dark:text-purple-400 font-bold"
        title="Shared Root"
      >
        <Icon name="share" size={16} />
        <span>Shared</span>
      </Link>
      <Icon
        name="chevronRight"
        size={12}
        className="text-slate-400 dark:text-zinc-400 shrink-0"
      />
      {leading.map((item) => (
        <SharedCrumb
          key={item.id}
          item={item}
          isLast={trailing.length === 0}
          noChevron
          linkFor={linkFor}
        />
      ))}
      {hidden.length > 0 && <EllipsisMenu items={hidden} linkFor={linkFor} />}
      {trailing.map((item, i) => (
        <SharedCrumb
          key={item.id}
          item={item}
          isLast={i === trailing.length - 1}
          linkFor={linkFor}
        />
      ))}
    </nav>
  );
}

/* ─── Access / Owner badge for shared item cards ─── */
function SharedBadge({ item, tab }) {
  const isByMe = tab === "byMe";
  const hasValidLink =
    item.publicPermission && item.publicPermission !== "none";

  if (isByMe) {
    const isPublic = item.accessLevel === "public" && hasValidLink;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 whitespace-nowrap leading-none ${
          isPublic
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : item.permission === "edit"
              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
              : "bg-amber-200/60 dark:bg-amber-500/15 text-zinc-900 dark:text-amber-300 border-amber-700/40"
        }`}
      >
        {isPublic
          ? "Public"
          : item.permission === "edit"
            ? "Can Edit"
            : "Can View"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shrink-0 whitespace-nowrap leading-none">
      <Icon name="user" size={9} className="text-purple-500" />
      {item.owner?.name || "Shared"}
    </span>
  );
}

/* ─── Main Shared Page ─── */
export default function Shared() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showMessage } = useApp();
  const queryClient = useQueryClient();
  useHighlight();

  const [activeTab, setActiveTab] = useState("withMe");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("sharedViewMode") || "grid",
  );
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchFilter, setSearchFilter] = useState("");
  // Shelved: uncomment when bulk operations are built
  // const {
  //   selectedIds,
  //   setSelectedIds,
  //   handleSelect,
  //   handleSelectAll,
  //   handleClearSelection,
  // } = useItemSelection();
  const { ctxMenu, handleContextMenu, closeCtxMenu } = useContextMenuState();
  const [shareModal, setShareModal] = useState({ isOpen: false, item: null });
  const [detailsPanel, setDetailsPanel] = useState({
    isOpen: false,
    item: null,
  });

  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent("details-panel-toggle", { detail: { open: detailsPanel.isOpen } }),
    );
  }, [detailsPanel.isOpen]);

  const isBrowsingFolder = !!id;

  // "Shared with Me" items belong to someone else: viewers only get
  // open/download/details. The tab persists while browsing, so this also
  // covers contents inside a shared folder.
  const readOnly = activeTab === "withMe";
  const READONLY_BLOCKED = ["share", "getLink", "trash", "bin", "star"];

  // Optimistic cache helpers for the root shared list (["shared"] query).
  const applySharedStar = useCallback(
    (ids, starValue) => {
      const match = (it) =>
        (it?._id && ids.includes(String(it._id))) ||
        (it?.id && ids.includes(String(it.id)));
      const patchList = (list) =>
        (list || []).map((it) =>
          match(it) ? { ...it, isStarred: starValue } : it,
        );
      queryClient.setQueryData(["shared"], (old) => {
        const d = old?.data?.data;
        if (!d) return old;
        const section = (dirs, files) => ({
          directories: patchList(dirs),
          files: patchList(files),
        });
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...d,
              sharedByMe: section(
                d.sharedByMe?.directories,
                d.sharedByMe?.files,
              ),
              sharedWithMe: section(
                d.sharedWithMe?.directories,
                d.sharedWithMe?.files,
              ),
            },
          },
        };
      });
    },
    [queryClient],
  );

  const applySharedRemove = useCallback(
    (ids) => {
      const match = (it) =>
        (it?._id && ids.includes(String(it._id))) ||
        (it?.id && ids.includes(String(it.id)));
      const rm = (list) => (list || []).filter((it) => !match(it));
      queryClient.setQueryData(["shared"], (old) => {
        const d = old?.data?.data;
        if (!d) return old;
        const section = (dirs, files) => ({
          directories: rm(dirs),
          files: rm(files),
        });
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...d,
              sharedByMe: section(
                d.sharedByMe?.directories,
                d.sharedByMe?.files,
              ),
              sharedWithMe: section(
                d.sharedWithMe?.directories,
                d.sharedWithMe?.files,
              ),
            },
          },
        };
      });
    },
    [queryClient],
  );

  // Folder contents if inside shared directory
  const {
    dirs: folderDirs,
    files: folderFiles,
    items: folderItems,
    isLoading: folderLoading,
    optimistic,
  } = useFolderContents(id, { sortBy, sortOrder });

  const { breadcrumbs, isLoading: crumbsLoading } = useBreadcrumbs(id);

  const { data: sharedData, isLoading: sharedLoading } = useQuery({
    queryKey: ["shared"],
    queryFn: () => homeAPI.getShared({ limit: 100 }),
    staleTime: 30_000,
    enabled: !isBrowsingFolder,
  });

  const shared = sharedData?.data?.data;
  const rawDirs =
    activeTab === "byMe"
      ? shared?.sharedByMe?.directories || []
      : shared?.sharedWithMe?.directories || [];
  const rawFiles =
    activeTab === "byMe"
      ? shared?.sharedByMe?.files || []
      : shared?.sharedWithMe?.files || [];

  const rootDirs = rawDirs.map((d) => ({ ...d, type: "directory" }));
  const rootFiles = rawFiles.map((f) => ({ ...f, type: "file" }));
  const rootAllItems = [...rootDirs, ...rootFiles];

  const displayAllItems = isBrowsingFolder ? folderItems : rootAllItems;
  const isLoading = isBrowsingFolder ? folderLoading : sharedLoading;

  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return displayAllItems;
    const q = searchFilter.toLowerCase().trim();
    return displayAllItems.filter((i) =>
      (i.name || "").toLowerCase().includes(q),
    );
  }, [displayAllItems, searchFilter]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = (a.name || "").localeCompare(b.name || "");
      else if (sortBy === "size") cmp = (a.size || 0) - (b.size || 0);
      else
        cmp =
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredItems, sortBy, sortOrder]);

  const folders = useMemo(
    () => sortedItems.filter((i) => i.type === "directory" || !i.mime),
    [sortedItems],
  );
  const files = useMemo(
    () => sortedItems.filter((i) => i.type === "file" || i.mime),
    [sortedItems],
  );

  const handleSortChange = useCallback(
    (field, order) => {
      if (order) {
        setSortBy(field);
        setSortOrder(order);
      } else {
        if (field === sortBy)
          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        else {
          setSortBy(field);
          setSortOrder("desc");
        }
      }
    },
    [sortBy, sortOrder],
  );

  const toggleViewMode = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem("sharedViewMode", mode);
  }, []);

  // Open / Download / Details / Context
  const handleOpen = useCallback(
    (item) => {
      if (isDirItem(item)) {
        navigate(`/shared/folders/${item.id}`);
      } else {
        fileAPI
          .getPreviewUrl(item.id)
          .then((res) => {
            const url = res.data?.data?.url;
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            else showMessage("error", "Could not generate preview.");
          })
          .catch(() => showMessage("error", "Failed to load preview."));
      }
    },
    [navigate, showMessage],
  );

  // Shelved: uncomment when bulk operations are built (along with selectedIds above)
  // const handleBulkAction = useCallback(
  //   async (action) => {
  //     const ids = Array.from(selectedIds);
  //     if (ids.length === 0) return;
  //
  //     const selectedItems = displayAllItems.filter((i) => ids.includes(i.id));
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
  //
  //         case "download": {
  //           const downloadItems = selectedItems.map((i) => ({
  //             type: i.type || (i.mime ? "file" : "directory"),
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
  //
  //         case "star":
  //           if (isBrowsingFolder) {
  //             selectedItems.forEach((item) =>
  //               optimistic.patch(item.id, (it) => ({
  //                 ...it,
  //                 isStarred: !item.isStarred,
  //               })),
  //             );
  //           } else {
  //             applySharedStar(
  //               selectedItems.map((i) => i.id),
  //               selectedItems.some((i) => !i.isStarred),
  //             );
  //           }
  //           try {
  //             await Promise.all(
  //               selectedItems.map((item) => {
  //                 const api = isDirItem(item) ? directoryAPI : fileAPI;
  //                 return api.toggleStar(item.id, !item.isStarred);
  //               }),
  //             );
  //             queryClient.invalidateQueries({ queryKey: ["shared"] });
  //             queryClient.invalidateQueries({ queryKey: ["user-starred"] });
  //             showMessage(
  //               "success",
  //               `Starred ${ids.length} item${ids.length > 1 ? "s" : ""}`,
  //             );
  //           } catch (err) {
  //             if (isBrowsingFolder) optimistic.clear();
  //             else queryClient.invalidateQueries({ queryKey: ["shared"] });
  //             showMessage("error", err?.response?.data?.message || "Action failed.");
  //           }
  //           break;
  //
  //         case "share":
  //           if (selectedItems.length > 0) {
  //             setShareModal({ isOpen: true, item: selectedItems[0] });
  //           }
  //           break;
  //
  //         case "getLink": {
  //           const first = selectedItems[0];
  //           if (!first) break;
  //           const shareApi = isDirItem(first) ? directoryAPI : fileAPI;
  //           const token = await getPublicLinkToken(shareApi, first.id);
  //           if (token) {
  //             await copyPublicLink(token, showMessage);
  //           } else {
  //             setShareModal({ isOpen: true, item: first });
  //           }
  //           break;
  //         }
  //
  //         case "trash":
  //           if (isBrowsingFolder) {
  //             selectedItems.forEach((item) => optimistic.remove(item.id));
  //           } else {
  //             applySharedRemove(selectedItems.map((i) => i.id));
  //           }
  //           try {
  //             await Promise.all(
  //               selectedItems.map((item) => {
  //                 const api = isDirItem(item) ? directoryAPI : fileAPI;
  //                 return api.trash(item.id);
  //               }),
  //             );
  //             queryClient.invalidateQueries({ queryKey: ["shared"] });
  //             queryClient.invalidateQueries({ queryKey: ["bin"] });
  //             queryClient.invalidateQueries({ queryKey: ["user-usage"] });
  //             showMessage(
  //               "success",
  //               `Moved ${ids.length} item${ids.length > 1 ? "s" : ""} to bin`,
  //             );
  //           } catch (err) {
  //             if (isBrowsingFolder) optimistic.clear();
  //             else queryClient.invalidateQueries({ queryKey: ["shared"] });
  //             showMessage("error", err?.response?.data?.message || "Action failed.");
  //           }
  //           break;
  //
  //         default:
  //           break;
  //       }
  //       setSelectedIds(new Set());
  //     } catch (err) {
  //       showMessage("error", err?.response?.data?.message || "Action failed.");
  //     }
  //   },
  //   [selectedIds, displayAllItems, showMessage, queryClient, handleOpen, isBrowsingFolder, optimistic, applySharedStar, applySharedRemove],
  // );

  const handleDownloadItem = useCallback(
    (item) => {
      const api = isDirItem(item) ? directoryAPI : fileAPI;
      api
        .getDownloadUrl(item.id)
        .then((res) => {
          const url = res.data?.data?.url;
          if (url) window.open(url, "_blank");
          else showMessage("error", "Could not generate download link.");
        })
        .catch(() => showMessage("error", "Failed to get download link."));
    },
    [showMessage],
  );

  const handleShowDetails = useCallback((item) => {
    setDetailsPanel({ isOpen: true, item });
  }, []);

  const handleCtxAction = useCallback(
    async (action, item) => {
      closeCtxMenu();
      if (readOnly && READONLY_BLOCKED.includes(action)) {
        showMessage("info", "View-only access — you can open and download this item.");
        return;
      }
      if (action === "open" || action === "preview") handleOpen(item);
      else if (action === "details") handleShowDetails(item);
      else if (action === "share") setShareModal({ isOpen: true, item });
      else if (action === "download") handleDownloadItem(item);
      else if (action === "getLink") {
        const shareApi = isDirItem(item) ? directoryAPI : fileAPI;
        try {
          const token = await getPublicLinkToken(shareApi, item.id);
          if (token) {
            await copyPublicLink(token, showMessage);
          } else {
            setShareModal({ isOpen: true, item });
          }
        } catch (err) {
          showMessage(
            "error",
            err?.response?.data?.message || "Failed to get share link.",
          );
        }
      } else if (action === "trash" || action === "bin") {
        const api = isDirItem(item) ? directoryAPI : fileAPI;
        try {
          if (isBrowsingFolder) optimistic.remove(item.id);
          else applySharedRemove([item.id]);
          await api.trash(item.id);
          queryClient.invalidateQueries({ queryKey: ["shared"] });
          queryClient.invalidateQueries({ queryKey: ["bin"] });
          queryClient.invalidateQueries({ queryKey: ["user-usage"] });
          showMessage("success", "Moved to bin");
          setDetailsPanel({ isOpen: false, item: null });
        } catch (err) {
          if (isBrowsingFolder) optimistic.clear();
          else queryClient.invalidateQueries({ queryKey: ["shared"] });
          showMessage(
            "error",
            err?.response?.data?.message || "Failed to move to bin.",
          );
        }
      } else if (action === "star") {
        try {
          const api = isDirItem(item) ? directoryAPI : fileAPI;
          const starValue = !item.isStarred;
          if (isBrowsingFolder) {
            optimistic.patch(item.id, (it) => ({
              ...it,
              isStarred: starValue,
            }));
          } else {
            applySharedStar([item.id], starValue);
          }
          await api.toggleStar(item.id, starValue);
          queryClient.invalidateQueries({ queryKey: ["shared"] });
          queryClient.invalidateQueries({ queryKey: ["user-starred"] });
          showMessage("success", item.isStarred ? "Unstarred" : "Starred");
        } catch (err) {
          if (isBrowsingFolder) optimistic.clear();
          else queryClient.invalidateQueries({ queryKey: ["shared"] });
          showMessage(
            "error",
            err?.response?.data?.message || "Failed to update star.",
          );
        }
      }
    },
    [
      closeCtxMenu,
      handleOpen,
      handleShowDetails,
      handleDownloadItem,
      queryClient,
      showMessage,
      isBrowsingFolder,
      optimistic,
      applySharedStar,
      applySharedRemove,
      readOnly,
    ],
  );

  const handleDetailsAction = useCallback(
    async (action, item) => {
      if (action === "close") setDetailsPanel({ isOpen: false, item: null });
      else if (action === "share") setShareModal({ isOpen: true, item });
      else if (action === "download") handleDownloadItem(item);
      else if (action === "open" || action === "preview") handleOpen(item);
      else if (action === "getLink" || action === "star" || action === "trash")
        handleCtxAction(action, item);
    },
    [handleDownloadItem, handleOpen, handleCtxAction],
  );

  const withMeCount =
    (shared?.sharedWithMe?.directories?.length || 0) +
    (shared?.sharedWithMe?.files?.length || 0);
  const byMeCount =
    (shared?.sharedByMe?.directories?.length || 0) +
    (shared?.sharedByMe?.files?.length || 0);

  return (
    <div className="flex h-full select-none pb-2">
      <div className="flex-1 min-w-0 p-0.5 sm:p-2 flex flex-col overflow-x-hidden">
        {!isBrowsingFolder && (
          <PageBanner
            icon="share"
            accent="purple"
            // title="Shared Vault"
            subtitle="Collaborate safely with shared folders, files, and permission controls"
            containerClassName="mb-4"
            right={
              <div className="flex flex-wrap items-center gap-1.5 bg-white/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-xs max-w-full">
                <button
                  onClick={() => setActiveTab("withMe")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "withMe"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon name="users" size={14} />
                  <span className=" sm:inline">Shared with Me</span>
                  {withMeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${activeTab === "withMe" ? "bg-white/20 text-white" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"}`}
                    >
                      {withMeCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("byMe")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "byMe"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon name="share" size={14} />
                  <span className="sm:inline">Shared by Me</span>
                  {byMeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${activeTab === "byMe" ? "bg-white/20 text-white" : "bg-purple-500/15 text-purple-600 dark:text-purple-400"}`}
                    >
                      {byMeCount}
                    </span>
                  )}
                </button>
              </div>
            }
          />
        )}

        {/* Shelved: uncomment when bulk operations are built
        <SelectionToolbar
          count={selectedIds.size}
          total={displayAllItems.length}
          variant="shared"
          onClear={handleClearSelection}
          onSelectAll={() => handleSelectAll(displayAllItems)}
          onAction={handleBulkAction}
          accent="purple"
        />
        */}

        <SortBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={toggleViewMode}
          leftContent={
            isBrowsingFolder ? (
              crumbsLoading ? (
                <Skeleton className="h-6 w-48 rounded-xl" />
              ) : (
                <SharedBreadcrumb items={breadcrumbs} />
              )
            ) : (
              <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                Showing {sortedItems.length} shared item
                {sortedItems.length !== 1 ? "s" : ""}
              </div>
            )
          }
        />

        <div className="pb-20 sm:pb-0 pl-2 pt-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar">
          {isLoading ? (
            <SharedGridSkeleton count={6} />
          ) : sortedItems.length === 0 ? (
            <div className="flex items-center justify-center min-h-[360px] sm:min-h-[420px]">
              <EmptyState
                icon={
                  isBrowsingFolder
                    ? "folder"
                    : activeTab === "byMe"
                      ? "share"
                      : "users"
                }
                title={
                  isBrowsingFolder
                    ? "This shared folder is empty"
                    : activeTab === "byMe"
                      ? "No shared items yet"
                      : "No items shared with you"
                }
                desc={
                  isBrowsingFolder
                    ? "This shared folder doesn't contain any files or sub-folders."
                    : activeTab === "byMe"
                      ? "Items you share with team members or via public link will show up here."
                      : "When someone shares files or folders with you, they'll appear here."
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              {folders.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 px-1 flex items-center gap-2">
                    {/* <Icon name="folder" size={14} className="text-amber-500" /> */}
                    Shared Folders ({folders.length})
                  </h3>
                  <FolderGrid
                    items={folders}
                    /* selectedIds={selectedIds}  Shelved */
                    /* onSelect={handleSelect}     Shelved */
                    onOpen={handleOpen}
                    onShowDetails={handleShowDetails}
                    onContextMenu={handleContextMenu}
                    accent="purple"
                    viewMode={viewMode}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                    renderBadge={(item) =>
                      viewMode === "grid" ? (
                        <span className="flex items-center gap-1.5 shrink-0">
                          {item.isStarred && (
                            <Icon
                              name="starFilled"
                              size={13}
                              className="text-amber-400 drop-shadow-sm"
                            />
                          )}
                          <SharedBadge item={item} tab={activeTab} />
                        </span>
                      ) : (
                        <SharedBadge item={item} tab={activeTab} />
                      )
                    }
                  />
                </div>
              )}

              {files.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 px-1 flex items-center gap-2">
                    {/* <Icon name="file" size={14} className="text-blue-500" /> */}
                    Shared Files ({files.length})
                  </h3>
                  <FileGrid
                    items={files}
                    /* selectedIds={selectedIds}  Shelved */
                    /* onSelect={handleSelect}     Shelved */
                    onOpen={handleOpen}
                    onShowDetails={handleShowDetails}
                    onContextMenu={handleContextMenu}
                    accent="purple"
                    viewMode={viewMode}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                    renderBadge={(item) =>
                      viewMode === "grid" ? (
                        <span className="flex items-center gap-1.5 shrink-0">
                          {item.isStarred && (
                            <Icon
                              name="starFilled"
                              size={13}
                              className="text-amber-400 drop-shadow-sm"
                            />
                          )}
                          <SharedBadge item={item} tab={activeTab} />
                        </span>
                      ) : (
                        <SharedBadge item={item} tab={activeTab} />
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DetailsDock
        item={detailsPanel.item}
        open={!!(detailsPanel.isOpen && detailsPanel.item)}
        onClose={() => setDetailsPanel({ isOpen: false, item: null })}
        onAction={handleDetailsAction}
        variant="shared"
        readOnly={readOnly}
      />

      <ContextMenu
        isOpen={ctxMenu.isOpen}
        position={ctxMenu.position}
        item={ctxMenu.item}
        onClose={closeCtxMenu}
        onAction={handleCtxAction}
        variant="shared"
        readOnly={readOnly}
      />

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, item: null })}
        item={shareModal.item}
      />
    </div>
  );
}
