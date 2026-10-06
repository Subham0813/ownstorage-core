import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../context/AppContext";
import { Skeleton } from "../../components/ui/UI";
import { useFolderContents } from "../../hooks/useFolderContents";
import { useBreadcrumbs } from "../../hooks/useDirectoryInfo";
import { useFileDrop } from "../../hooks/useFileDrop";
import { useFolderActions } from "../../hooks/useFolderActions";
import { useItemSelection } from "../../hooks/useItemSelection";
import { useContextMenuState } from "../../hooks/useContextMenuState";
import { Breadcrumb } from "../../components/dashboard/Breadcrumb";
import { SortBar } from "../../components/dashboard/SortBar";
import { FileGrid } from "../../components/dashboard/FileGrid";
import { FolderGrid } from "../../components/dashboard/FolderGrid";
import {
  FolderGridSkeleton,
  FileGridSkeleton,
  FolderGridSkeletonInline,
} from "../../components/dashboard/skeletons";
import { EmptyFolder } from "../../components/dashboard/EmptyFolder";
import { ContextMenu } from "../../components/dashboard/ContextMenu";
// import { SelectionToolbar } from "../../components/dashboard/SelectionToolbar";  // Shelved: uncomment when bulk operations are built
import { DetailsDock } from "../../components/dashboard/DetailsDock";
import { AllFilesModals } from "./AllFilesModals";
import { useUploadStore } from "../../store/uploadStore";
import { formatSize } from "../../utils/fileUtils";
import { Icon } from "../../components/ui/Icon";
import { importAPI } from "../../api/importApi";
import { oauthAPI } from "../../api/oauthApi";
import { useGoogleDrivePicker } from "../../hooks/useGoogleDrivePicker";

export default function AllFiles() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { rootDirId, showMessage } = useApp();
  const parentId = id || rootDirId;
  const parentIdRef = useRef(parentId);
  const queryClient = useQueryClient();

  const addFiles = useUploadStore((s) => s.addFiles);
  const addImport = useUploadStore((s) => s.addImport);
  const openUploadModal = useUploadStore((s) => s.openUploadModal);
  const setCurrentFolderId = useUploadStore((s) => s.setCurrentFolderId);
  const setCurrentFolderPath = useUploadStore((s) => s.setCurrentFolderPath);
  const setFolderUploadName = useUploadStore((s) => s.setFolderUploadName);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Shelved: uncomment when bulk operations are built
  // const {
  //   selectedIds,
  //   setSelectedIds,
  //   handleSelect,
  //   handleSelectAll,
  //   handleClearSelection,
  // } = useItemSelection();
  const { ctxMenu, handleContextMenu, closeCtxMenu } = useContextMenuState();
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null });
  const [moveModal, setMoveModal] = useState({
    isOpen: false,
    item: null,
    items: null,
  });
  const [shareModal, setShareModal] = useState({ isOpen: false, item: null });
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [detailsPanel, setDetailsPanel] = useState({
    isOpen: false,
    item: null,
  });

  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent("details-panel-toggle", { detail: { open: detailsPanel.isOpen } }),
    );
  }, [detailsPanel.isOpen]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [view, setView] = useState("all");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("allFilesViewMode") || "grid",
  );

  const {
    dirs,
    files,
    items,
    isLoading,
    hasMoreDirs,
    loadingMoreDirs,
    loadMoreDirs,
    hasMoreFiles,
    loadingMoreFiles,
    loadMoreFiles,
    refresh,
    optimistic,
  } = useFolderContents(parentId, { sortBy, sortOrder });

  const { breadcrumbs, isLoading: crumbsLoading } = useBreadcrumbs(parentId);

  useEffect(() => {
    const openNewFolder = () => setNewFolderModal(true);
    window.addEventListener("vd:trigger-new-folder", openNewFolder);
    return () => {
      window.removeEventListener("vd:trigger-new-folder", openNewFolder);
    };
  }, []);

  useEffect(() => {
    if (location.state?.triggerNewFolder) {
      setNewFolderModal(true);
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const handleFileSelect = useCallback(
    (e) => {
      const files = e.target.files;
      if (files?.length) {
        addFiles(files, parentId);
        openUploadModal();
      }
      e.target.value = "";
    },
    [addFiles, openUploadModal, parentId],
  );

  const handleFolderSelect = useCallback(
    (e) => {
      try {
        const files = e.target.files;
        if (!files?.length) {
          e.target.value = "";
          return;
        }
        const fileArr = Array.from(files);
        const folderName = fileArr[0].webkitRelativePath.split("/")[0];
        setFolderUploadName(folderName);
        addFiles(fileArr, parentId);
        openUploadModal();
        showMessage(
          "success",
          `"${folderName}" — ${fileArr.length} file${fileArr.length > 1 ? "s" : ""} pending`,
        );
      } catch (err) {
        showMessage("error", "Failed to add folder files.");
      } finally {
        e.target.value = "";
      }
    },
    [addFiles, openUploadModal, parentId, setFolderUploadName, showMessage],
  );

  const openPicker = useGoogleDrivePicker((pickedFiles) => {
    if (!Array.isArray(pickedFiles) || pickedFiles.length === 0) return;
    pickedFiles.forEach((f) => {
      addImport(
        {
          name: f.name,
          size: f.sizeBytes || f.size || 0,
          type: f.mimeType || f.type || "application/octet-stream",
          googleDriveId: f.id,
        },
        parentId,
      );
    });
    openUploadModal();
    showMessage(
      "success",
      `${pickedFiles.length} Google Drive file${pickedFiles.length > 1 ? "s" : ""} queued for import`,
    );
  });

  const handleGDriveImport = useCallback(async () => {
    try {
      const { data } = await importAPI.getPickerToken();
      openPicker(data?.data?.accessToken);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "";
      const status = err?.response?.status;
      if (
        status === 401 ||
        msg.includes("not authenticated") ||
        msg.includes("log in")
      ) {
        showMessage(
          "info",
          "Please log in to your Google Drive account to import files",
        );
        oauthAPI.googleDriveConnect();
        return;
      } else if (status === 400 || status === 403) {
        if (msg.toLowerCase().includes("drive") || msg.toLowerCase().includes("not connected") || msg.toLowerCase().includes("expired")) {
          showMessage("info", "Connect your Google Drive to import files");
          oauthAPI.googleDriveConnect();
          return;
        }
        showMessage("error", msg || "Google Drive not connected");
      } else {
        showMessage("error", "Couldn't load Google Drive picker");
      }
    }
  }, [openPicker, showMessage]);

  const { isDragging, dragHandlers } = useFileDrop({
    onFiles: (droppedFiles) => {
      if (!droppedFiles?.length) return;
      addFiles(droppedFiles, parentId);
      showMessage(
        "success",
        `${droppedFiles.length} file${droppedFiles.length > 1 ? "s" : ""} pending`,
      );
    },
  });

  const totalSize = useMemo(
    () => files.reduce((acc, f) => acc + (Number(f.size) || 0), 0),
    [files],
  );

  useEffect(() => {
    if (parentIdRef.current !== parentId) {
      parentIdRef.current = parentId;
      // setSelectedIds(new Set());  // Shelved: uncomment when bulk operations are built
    }
    setCurrentFolderId(parentId);
  }, [parentId, setCurrentFolderId]);

  useEffect(() => {
    if (breadcrumbs?.length > 0) {
      setCurrentFolderPath(breadcrumbs.map((b) => b.name).join(" / "));
    }
  }, [breadcrumbs, setCurrentFolderPath]);

  const folders = dirs;
  const hasContent = items.length > 0;

  const starredFolders = useMemo(
    () => folders.filter((f) => f.isStarred),
    [folders],
  );
  const starredFiles = useMemo(
    () => files.filter((f) => f.isStarred),
    [files],
  );
  const visibleFolders = useMemo(
    () => (view === "starred" ? starredFolders : folders),
    [view, folders, starredFolders],
  );
  const visibleFiles = useMemo(
    () => (view === "starred" ? starredFiles : files),
    [view, files, starredFiles],
  );
  const displayItems = useMemo(() => {
    if (view === "starred") return [...visibleFolders, ...visibleFiles];
    return items;
  }, [view, items, visibleFolders, visibleFiles]);
  const starredTotalSize = useMemo(
    () => visibleFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0),
    [visibleFiles],
  );

  const parentName =
    breadcrumbs?.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].name
      : "folder";
  const folderPath = useMemo(
    () => breadcrumbs.map((b) => b.name).join(" / "),
    [breadcrumbs],
  );

  const {
    invalidateFolder,
    handleOpen,
    handleShowDetails,
    handleCtxAction,
    handleRename,
    handleCreateFolder,
    handleMove,
    handleCopy,
    handleDetailsAction,
    handleBulkAction,
  } = useFolderActions({
    parentId,
    refresh,
    allItems: items,
    folders,
    files,
    // selectedIds,        // Shelved: uncomment when bulk operations are built
    // setSelectedIds,     // Shelved: uncomment when bulk operations are built
    setRenameModal,
    setMoveModal,
    setShareModal,
    setNewFolderModal,
    setDetailsPanel,
    showMessage,
    navigate,
    queryClient,
    optimistic,
  });

  const handleSortChange = useCallback((field, order) => {
    setSortBy(field);
    if (order) setSortOrder(order);
  }, []);

  const toggleViewMode = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem("allFilesViewMode", mode);
  }, []);

  const fabProps = {
    onUpload: () => fileInputRef.current?.click(),
    onUploadFolder: () => folderInputRef.current?.click(),
    onNewFolder: () => setNewFolderModal(true),
    onGDriveImport: handleGDriveImport,
    detailsPanelOpen: !!(detailsPanel.isOpen && detailsPanel.item),
  };

  const fileInputProps = {
    fileInputRef,
    folderInputRef,
    onFileSelect: handleFileSelect,
    onFolderSelect: handleFolderSelect,
  };

  // Hoisted so every render branch (loading/empty/populated) mounts the same
  // modals — preventing Share/Rename/Move from unmounting during a refresh.
  const modalsElement = (
    <AllFilesModals
      newFolderModal={newFolderModal}
      parentName={parentName}
      onCloseNewFolder={() => setNewFolderModal(false)}
      onCreateFolder={handleCreateFolder}
      renameModal={renameModal}
      onCloseRename={() => setRenameModal({ isOpen: false, item: null })}
      onRename={handleRename}
      moveModal={moveModal}
      onCloseMove={() =>
        setMoveModal({ isOpen: false, item: null, items: null })
      }
      onMove={handleMove}
      onCopy={handleCopy}
      rootDirId={rootDirId}
      shareModal={shareModal}
      onCloseShare={() => setShareModal({ isOpen: false, item: null })}
      onChanged={invalidateFolder}
      fab={fabProps}
      {...fileInputProps}
    />
  );

  if (isLoading || crumbsLoading) {
    return (
      <>
        <div className="py-4 sm:py-6 px-4 sm:px-6 pb-20 lg:pb-0 space-y-6">
          <Skeleton className="w-48 h-5" />
          <Skeleton className="w-32 h-4" />
          <div className="space-y-2.5">
            <Skeleton className="w-24 h-4" />
            <FolderGridSkeleton count={3} />
          </div>
          <FileGridSkeleton count={8} />
        </div>
        {modalsElement}
      </>
    );
  }

  if (!hasContent) {
    return (
      <div className="py-4 sm:py-6 px-4 sm:px-6 flex flex-col min-h-full pb-20 lg:pb-0">
        <Breadcrumb items={breadcrumbs} />
        <div className="mt-6 flex-1">
          <EmptyFolder
            onUpload={openUploadModal}
            onNewFolder={() => setNewFolderModal(true)}
          />
        </div>
        {modalsElement}
      </div>
    );
  }

  return (
    <div className="flex h-full select-none" {...dragHandlers}>
      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {isDragging && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-xl">
            <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-zinc-300">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center">
                <Icon name="upload" className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-sm font-medium">Drop files here</p>
            </div>
          </div>
        )}

        {/* Shelved: uncomment when bulk operations are built
        {selectedIds.size > 0 && (
          <SelectionToolbar
            count={selectedIds.size}
            total={displayItems.length}
            onClear={handleClearSelection}
            onSelectAll={() => handleSelectAll(displayItems)}
            onAction={handleBulkAction}
            accent="amber"
          />
        )}
        */}

        <SortBar
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={toggleViewMode}
          leftContent={<Breadcrumb items={breadcrumbs} />}
        />

        <div className="flex items-center gap-1 px-1.5 pt-0.5">
          {[
            { key: "all", label: "All", count: items.length },
            { key: "folders", label: "Folders", count: folders.length },
            { key: "files", label: "Files", count: files.length },
            {
              key: "starred",
              label: "Starred",
              count: starredFolders.length + starredFiles.length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                view === tab.key
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/70"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs font-bold ${
                  view === tab.key
                    ? "text-amber-500/80 dark:text-amber-400/80"
                    : "text-slate-400 dark:text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div
          className="p-1 mt-2 flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20
         no-scrollbar"
        >
          {(view === "all" || view === "folders" || view === "starred") &&
            visibleFolders.length > 0 && (
              <div className="mb-6 px-1">
                <h2 className="section-label mb-2.5">
                  Folders ({visibleFolders.length})
                </h2>
                <FolderGrid
                  items={visibleFolders}
                /* selectedIds={selectedIds}  Shelved */
                /* onSelect={handleSelect}     Shelved */
                onOpen={handleOpen}
                onShowDetails={handleShowDetails}
                onContextMenu={handleContextMenu}
                onAction={handleCtxAction}
                accent="amber"
                viewMode={viewMode}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
              {loadingMoreDirs && <FolderGridSkeletonInline count={4} />}
              {hasMoreDirs && !loadingMoreDirs && (
                <button
                  onClick={loadMoreDirs}
                  className="mt-3 flex items-center gap-1.5 mx-auto text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-4 py-1.5 rounded-lg transition-colors"
                >
                  <Icon name="chevronDown" size={14} />
                  Load more folders
                </button>
              )}
            </div>
          )}

          {view === "folders" && folders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Icon
                  name="folder"
                  className="w-6 h-6 text-slate-400 dark:text-zinc-500"
                />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                No folders here
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                Create a folder to organize your files
              </p>
            </div>
          )}

          {view === "starred" &&
            visibleFolders.length === 0 &&
            visibleFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Icon
                    name="star"
                    className="w-6 h-6 text-slate-400 dark:text-zinc-500"
                  />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  No starred items yet
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  Star files and folders to find them here quickly
                </p>
              </div>
            )}

          {(view === "all" || view === "files" || view === "starred") && (
            <div className="px-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-label">Files ({visibleFiles.length})</h2>
                {/* {visibleFiles.length > 0 && (
                  <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                    {formatSize(view === "starred" ? starredTotalSize : totalSize)}
                  </span>
                )} */}
              </div>
              {visibleFiles.length > 0 ? (
                <>
                  <FileGrid
                    items={visibleFiles}
                    /* selectedIds={selectedIds}  Shelved */
                    /* onSelect={handleSelect}     Shelved */
                    onOpen={handleOpen}
                    onShowDetails={handleShowDetails}
                    onContextMenu={handleContextMenu}
                    onAction={handleCtxAction}
                    viewMode={viewMode}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                  />
                  {hasMoreFiles && (
                    <button
                      onClick={loadMoreFiles}
                      disabled={loadingMoreFiles}
                      className="mt-3 flex items-center gap-1.5 mx-auto text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingMoreFiles ? (
                        <>
                          <Icon
                            name="loader2"
                            className="w-4 h-4 animate-spin"
                          />
                          Loading…
                        </>
                      ) : (
                        <>
                          <Icon name="chevronDown" size={14} />
                          Load more files
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <Icon
                      name="files"
                      className="w-6 h-6 text-slate-400 dark:text-zinc-500"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                    No files here
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    Upload files or create folders to get started
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {ctxMenu.isOpen && ctxMenu.item && (
          <ContextMenu
            isOpen={ctxMenu.isOpen}
            position={ctxMenu.position}
            item={ctxMenu.item}
            onClose={closeCtxMenu}
            onAction={handleCtxAction}
          />
        )}
      </div>

      <DetailsDock
        item={detailsPanel.item}
        open={!!(detailsPanel.isOpen && detailsPanel.item)}
        onClose={() => setDetailsPanel({ isOpen: false, item: null })}
        onAction={handleDetailsAction}
      />

      {modalsElement}
    </div>
  );
}
