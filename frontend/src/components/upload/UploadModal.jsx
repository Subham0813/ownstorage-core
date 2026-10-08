import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../ui/Icon";
import { GoogleDriveLogo } from "../auth/OAuthButtons";
import { useUploadStore } from "../../store/uploadStore";
import { useApp } from "../../context/AppContext";
import { formatSize } from "../../utils/fileUtils";
import {
  processQueue,
  processImportQueue,
  cancelUpload,
} from "../../utils/uploadManager";
import { directoryAPI } from "../../api/directoryApi";
import { importAPI } from "../../api/importApi";
import { oauthAPI } from "../../api/oauthApi";
import { useGoogleDrivePicker } from "../../hooks/useGoogleDrivePicker";

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

function getExt(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return "image";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "flac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["zip", "rar", "tar", "gz"].includes(ext)) return "archive";
  if (["doc", "docx"].includes(ext)) return "document";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  return "file";
}

// Create folder tree from items with relativePath, return map of localId → created folderId
async function createFolderTree(items, parentId, rootName) {
  const rootFolderName = rootName || items[0].relativePath.split("/")[0];
  const rootRes = await directoryAPI.create({
    targetId: parentId,
    name: rootFolderName,
  });
  const rootFolderId = rootRes.data?.data?.item?.id;

  const pathCache = {};
  const idMap = {};

  for (const item of items) {
    const parts = item.relativePath.split("/");
    parts.pop();
    let currentParentId = rootFolderId;

    for (const dirName of parts.slice(1)) {
      const key = `${currentParentId}/${dirName}`;
      if (pathCache[key]) {
        currentParentId = pathCache[key];
      } else {
        const res = await directoryAPI.create({
          targetId: currentParentId,
          name: dirName,
        });
        const subId = res.data?.data?.item?.id;
        pathCache[key] = subId;
        currentParentId = subId;
      }
    }
    idMap[item.localId] = currentParentId;
  }

  return { rootFolderId, rootName, idMap };
}

const ACTIVE_STATUSES = ["queued", "uploading", "paused"];
const FINISHED_STATUSES = ["completed", "failed", "cancelled"];

function formatEta(etaSec) {
  if (etaSec >= 3600)
    return `${Math.floor(etaSec / 3600)}h ${Math.round((etaSec % 3600) / 60)}m`;
  if (etaSec >= 60) return `${Math.floor(etaSec / 60)}m ${Math.floor(etaSec % 60)}s`;
  return `${Math.max(Math.floor(etaSec), 1)}s`;
}

function UploadMeta({ item }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (item.status !== "uploading") return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [item.status]);

  if (!item.startedAt) return null;

  const doneBytes =
    item.totalParts > 1
      ? Math.min(item.uploadedParts.length * item.partSize, item.size)
      : ((item.progress || 0) / 100) * item.size;
  const remainingBytes = Math.max(item.size - doneBytes, 0);
  const elapsedSec = Math.max((now - item.startedAt) / 1000, 1);
  const rate = doneBytes / elapsedSec;
  const eta = rate > 0 && remainingBytes > 0 ? formatEta(remainingBytes / rate) : "";

  return (
    <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-1 tabular-nums">
      {formatSize(doneBytes)} / {formatSize(item.size)}
      {eta ? ` \u00b7 ~${eta} left` : ""}
    </p>
  );
}

function ImportMeta({ item }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (item.status !== "uploading") return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [item.status]);

  if (!item.startedAt) return null;

  const progress = Math.min(item.progress || 0, 100);
  const remainingPct = Math.max(100 - progress, 0);
  const elapsedSec = Math.max((now - item.startedAt) / 1000, 1);
  const rate = progress / elapsedSec;
  const eta = rate > 0 && remainingPct > 0 ? formatEta(remainingPct / rate) : "";

  return (
    <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-1 tabular-nums">
      {progress}% completed
      {eta ? ` \u00b7 ~${eta} left` : ""}
    </p>
  );
}

export default function UploadModal() {
  const { user, showMessage } = useApp();

  const uploads = useUploadStore((s) => s.uploads);
  const imports = useUploadStore((s) => s.imports);
  const addFiles = useUploadStore((s) => s.addFiles);
  const addImport = useUploadStore((s) => s.addImport);
  const confirmAll = useUploadStore((s) => s.confirmAll);
  const confirmAllImports = useUploadStore((s) => s.confirmAllImports);
  const removePending = useUploadStore((s) => s.removePending);
  const removePendingImport = useUploadStore((s) => s.removePendingImport);
  const clearCompleted = useUploadStore((s) => s.clearCompleted);
  const clearCompletedImports = useUploadStore((s) => s.clearCompletedImports);
  const removeUpload = useUploadStore((s) => s.removeUpload);
  const removeImport = useUploadStore((s) => s.removeImport);
  const retryUpload = useUploadStore((s) => s.retryUpload);
  const retryImport = useUploadStore((s) => s.retryImport);
  const resumeUpload = useUploadStore((s) => s.resumeUpload);
  const cancelImport = useUploadStore((s) => s.cancelImport);
  const updateUpload = useUploadStore((s) => s.updateUpload);
  const updateImport = useUploadStore((s) => s.updateImport);
  const currentFolderId = useUploadStore((s) => s.currentFolderId);
  const currentFolderPath = useUploadStore((s) => s.currentFolderPath);
  const setCurrentFolderId = useUploadStore((s) => s.setCurrentFolderId);
  const updatePendingParentId = useUploadStore((s) => s.updatePendingParentId);
  const folderUploadName = useUploadStore((s) => s.folderUploadName);
  const setFolderUploadName = useUploadStore((s) => s.setFolderUploadName);
  const uploadModalOpen = useUploadStore((s) => s.uploadModalOpen);
  const openUploadModal = useUploadStore((s) => s.openUploadModal);
  const closeUploadModal = useUploadStore((s) => s.closeUploadModal);

  const [isDragging, setIsDragging] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderValue, setNewFolderValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [draftName, setDraftName] = useState("");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const newFolderRef = useRef(null);
  const skipBlurRef = useRef(false);

  const splitExt = (currentName) => {
    const idx = currentName.lastIndexOf(".");
    if (idx <= 0) return { base: currentName, ext: "" };
    return {
      base: currentName.slice(0, idx),
      ext: currentName.slice(idx),
    };
  };

  const startRename = (kind, localId, currentName) => {
    skipBlurRef.current = false;
    const { base, ext } = splitExt(currentName);
    setEditingItem({ kind, localId, ext });
    setDraftName(base);
  };

  const commitRename = () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (!editingItem) return;
    const base = draftName.trim();
    if (!base) {
      cancelRename();
      return;
    }
    const name = editingItem.ext ? base + editingItem.ext : base;
    if (!/^[^\\/:*?"<>|]+$/.test(name)) {
      showMessage("error", "Filename contains invalid characters");
      return;
    }
    if (editingItem.kind === "upload") {
      updateUpload(editingItem.localId, { name });
    } else {
      updateImport(editingItem.localId, { name });
    }
    setEditingItem(null);
    setDraftName("");
  };

  const cancelRename = () => {
    skipBlurRef.current = true;
    setEditingItem(null);
    setDraftName("");
  };

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
        currentFolderId,
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
        if (
          msg.toLowerCase().includes("drive") ||
          msg.toLowerCase().includes("not connected") ||
          msg.toLowerCase().includes("expired")
        ) {
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

  const pendingItems = uploads.filter((u) => u.status === "pending");
  const pendingImports = imports.filter((i) => i.status === "pending");
  const activeUploads = uploads.filter((u) =>
    ACTIVE_STATUSES.includes(u.status),
  );
  const activeImports = imports.filter((i) =>
    ["queued", "uploading"].includes(i.status),
  );
  const finishedUploads = uploads.filter((u) =>
    FINISHED_STATUSES.includes(u.status),
  );
  const finishedImports = imports.filter((i) =>
    FINISHED_STATUSES.includes(i.status),
  );
  const failedUploads = uploads.filter((u) => u.status === "failed");
  const failedImports = imports.filter((i) => i.status === "failed");

  const hasPending = pendingItems.length > 0 || pendingImports.length > 0;
  const activeCount = activeUploads.length + activeImports.length;
  const finishedCount = finishedUploads.length + finishedImports.length;
  const failedCount = failedUploads.length + failedImports.length;
  const canModify = activeCount === 0;

  const hasFolderItems = pendingItems.some((u) => u.relativePath);
  const hasImportOnly = pendingImports.length > 0 && pendingItems.length === 0;
  const totalPending = pendingItems.length + pendingImports.length;

  const isOpen = uploadModalOpen;
  const showPill =
    !isOpen && (hasPending || activeCount > 0 || failedCount > 0);

  const activeAll = [...activeUploads, ...activeImports];
  const avgProgress = activeAll.length
    ? Math.round(
        activeAll.reduce((s, u) => s + (u.progress || 0), 0) / activeAll.length,
      )
    : 0;

  useEffect(() => {
    if (!hasFolderItems && folderUploadName) setFolderUploadName(null);
  }, [hasFolderItems, folderUploadName, setFolderUploadName]);

  // Auto-clear finished items once the modal is closed & nothing is running.
  useEffect(() => {
    if (!isOpen && !hasPending && activeCount === 0 && finishedCount > 0) {
      clearCompleted();
      clearCompletedImports();
    }
  }, [
    isOpen,
    hasPending,
    activeCount,
    finishedCount,
    clearCompleted,
    clearCompletedImports,
  ]);

  const handleAddFiles = useCallback(
    (files) => {
      const fileArr = Array.from(files);
      const valid = [];
      for (const file of fileArr) {
        if (file.size > MAX_FILE_SIZE) {
          showMessage("error", `${file.name} exceeds the 5GB limit`);
          continue;
        }
        valid.push(file);
      }
      if (valid.length) {
        setFolderUploadName(null);
        addFiles(valid, currentFolderId);
        openUploadModal();
        showMessage(
          "success",
          `${valid.length} file${valid.length > 1 ? "s" : ""} added`,
        );
      }
    },
    [
      addFiles,
      currentFolderId,
      setFolderUploadName,
      showMessage,
      openUploadModal,
    ],
  );

  const handleFileSelect = useCallback(
    (e) => {
      if (e.target.files?.length) {
        handleAddFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleAddFiles],
  );

  const handleFolderSelect = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (!selectedFiles.length) return;
      const root = selectedFiles[0]?.webkitRelativePath?.split("/")[0];
      if (root) setFolderUploadName(root);
      addFiles(selectedFiles, currentFolderId);
      openUploadModal();
      showMessage(
        "success",
        `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} added`,
      );
      e.target.value = "";
    },
    [
      addFiles,
      currentFolderId,
      setFolderUploadName,
      showMessage,
      openUploadModal,
    ],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const dt = e.dataTransfer;
      if (dt.items) {
        for (const item of dt.items) {
          if (item.webkitGetAsEntry?.()?.isDirectory) {
            showMessage("error", "Use 'Upload Folder' button for folders");
            return;
          }
        }
      }
      if (dt.files?.length) handleAddFiles(dt.files);
    },
    [handleAddFiles, showMessage],
  );

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderValue.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await directoryAPI.create({
        targetId: currentFolderId,
        name,
      });
      const newId = res.data?.data?.item?.id;
      const newPath = `${currentFolderPath}/${name}`;
      setCurrentFolderId(newId, name, newPath);
      updatePendingParentId(newId);
      setFolderUploadName(null);
      setShowNewFolder(false);
      setNewFolderValue("");
      showMessage("success", `Folder "${name}" created`);
    } catch (err) {
      showMessage(
        "error",
        err?.response?.data?.message || "Failed to create folder",
      );
    } finally {
      setCreating(false);
    }
  }, [
    newFolderValue,
    creating,
    currentFolderId,
    currentFolderPath,
    setCurrentFolderId,
    updatePendingParentId,
    setFolderUploadName,
    showMessage,
  ]);

  const handleUploadAll = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const folderItems = pendingItems.filter((u) => u.relativePath);

    try {
      if (folderItems.length > 0) {
        const rootName =
          folderUploadName || folderItems[0].relativePath.split("/")[0];
        const { idMap } = await createFolderTree(
          folderItems,
          currentFolderId,
          rootName,
        );
        for (const item of folderItems) {
          updateUpload(item.localId, { parentId: idMap[item.localId] });
        }
        setFolderUploadName(null);
      }

      confirmAll();
      processQueue();

      if (pendingImports.length > 0) {
        confirmAllImports();
        processImportQueue();
      }
    } catch (err) {
      showMessage(
        "error",
        err?.response?.data?.message || "Failed to prepare folder structure",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    pendingItems,
    pendingImports,
    currentFolderId,
    folderUploadName,
    updateUpload,
    setFolderUploadName,
    confirmAll,
    confirmAllImports,
    showMessage,
  ]);

  const handleDiscard = () => {
    pendingItems.forEach((u) => removePending(u.localId));
    pendingImports.forEach((i) => removePendingImport(i.localId));
    if (activeCount === 0) closeUploadModal();
  };

  // Toast user-initiated cancels (uploadManager fires this after marking the row).
  useEffect(() => {
    const onCancelled = (e) => {
      const name = e?.detail?.name;
      showMessage(
        "info",
        name ? `Upload cancelled: ${name}` : "Upload cancelled",
      );
    };
    window.addEventListener("vd:upload-cancelled", onCancelled);
    return () => window.removeEventListener("vd:upload-cancelled", onCancelled);
  }, [showMessage]);

  const handleCancelAll = () => {
    uploads.forEach((u) => {
      if (["queued", "uploading"].includes(u.status)) cancelUpload(u.localId);
      else if (u.status === "pending") removePending(u.localId);
      else removeUpload(u.localId);
    });
    imports.forEach((i) => {
      if (i.status === "pending") removePendingImport(i.localId);
      else removeImport(i.localId);
    });
    closeUploadModal();
  };

  const handleDone = () => {
    if (!hasPending && activeCount === 0) {
      clearCompleted();
      clearCompletedImports();
    }
    closeUploadModal();
  };

  const handleRetry = (kind, localId) => {
    if (kind === "upload") {
      retryUpload(localId);
      processQueue();
    } else {
      retryImport(localId);
      processImportQueue();
    }
  };

  const usedStorage =
    user?.usedQuota ?? user?.root?.size ?? user?.usedStorageQuota ?? 0;
  const maxStorage = user?.maxQuota ?? 5 * 1024 * 1024 * 1024;
  const currentRemaining = Math.max(0, maxStorage - usedStorage);
  const totalPendingSize =
    pendingItems.reduce((s, u) => s + (u.size || 0), 0) +
    pendingImports.reduce((s, i) => s + (i.size || 0), 0);
  const isOverQuota = totalPendingSize > currentRemaining;

  // ─── Minimize pill (modal closed but work in progress) ───
  if (!isOpen) {
    if (!showPill) return null;
    return createPortal(
      <button
        onClick={openUploadModal}
        className="fixed z-[2000] right-4 bottom-44 sm:right-6 md:bottom-28 md:right-6 lg:bottom-32 lg:right-8 flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 border border-white/10 dark:border-slate-200/60 shadow-2xl shadow-slate-950/30 backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-200 cursor-pointer group select-none"
        title="Open upload queue"
      >
        <div className="relative">
          <Icon
            name="upload"
            size={16}
            className={activeCount > 0 ? "animate-bounce" : ""}
          />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          )}
        </div>
        <span className="text-xs font-extrabold whitespace-nowrap">
          {failedCount > 0
            ? `${failedCount} failed`
            : activeCount > 0
              ? `${activeCount} uploading`
              : `${totalPending} ready`}
        </span>
        {activeCount > 0 && (
          <span className="text-xs font-bold font-mono opacity-75">
            {avgProgress}%
          </span>
        )}
        <Icon name="chevronUp" size={14} className="opacity-70" />
      </button>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-200 p-0 sm:p-6 select-none">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-xl shadow-2xl shadow-slate-950/20 dark:shadow-black/60 border border-slate-200/80 dark:border-zinc-800 w-full sm:max-w-[640px] max-h-[92dvh] sm:max-h-[88dvh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Icon name="upload" size={20} color="white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight font-display">
                Uploads
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {hasPending
                  ? "Review selected files before uploading to cloud"
                  : activeCount > 0
                    ? "Uploading files to your cloud storage"
                    : "Add files, folders, or import from Google Drive"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={closeUploadModal}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Minimize"
            >
              <Icon name="chevronDown" size={18} />
            </button>
            <button
              onClick={handleDiscard}
              className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Discard pending items"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Target + new folder */}
        <div className="px-5 sm:px-6 pb-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs">
            <Icon name="folder" size={16} className="text-blue-500 shrink-0" />
            <span className="font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
              Target:
            </span>
            <span className="font-bold text-slate-900 dark:text-zinc-100 truncate font-display">
              {currentFolderPath}
            </span>
            {canModify && !hasFolderItems && (
              <button
                onClick={() => {
                  setShowNewFolder(true);
                  setNewFolderValue(folderUploadName || "");
                  setTimeout(() => newFolderRef.current?.focus(), 50);
                }}
                className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200/60 dark:border-blue-500/20 transition-[color,background-color,border-color] cursor-pointer"
              >
                <Icon name="folderPlus" size={13} />
                New Subfolder
              </button>
            )}
          </div>
          {hasFolderItems && canModify && (
            <div className="mt-2.5 flex items-center gap-2 animate-in fade-in duration-150">
              <Icon
                name="folder"
                size={16}
                className="text-blue-500 shrink-0"
              />
              <input
                value={folderUploadName || ""}
                onChange={(e) => setFolderUploadName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setFolderUploadName(null);
                }}
                placeholder="Folder name"
                className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl border border-blue-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium shrink-0">
                inside {currentFolderPath}
              </span>
            </div>
          )}
          {showNewFolder && canModify && !hasFolderItems && (
            <div className="mt-2.5 flex items-center gap-2 animate-in fade-in duration-150">
              <input
                ref={newFolderRef}
                value={newFolderValue}
                onChange={(e) => setNewFolderValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolder(false);
                    setNewFolderValue("");
                  }
                }}
                placeholder="Subfolder name"
                className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
              <button
                onClick={handleCreateFolder}
                disabled={creating || !newFolderValue.trim()}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderValue("");
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-2.5">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => canModify && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (canModify && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={canModify ? 0 : -1}
            aria-label="Upload files"
            className={`group border-2 border-dashed rounded-2xl p-4 text-center transition-[background-color,border-color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
              canModify ? "cursor-pointer" : "cursor-default opacity-60"
            } ${
              isDragging
                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[0.99]"
                : "border-slate-300 dark:border-zinc-700/80 hover:border-blue-500/70 hover:bg-blue-50/40 dark:hover:bg-zinc-800/50"
            }`}
          >
            <div className="flex justify-center items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                <Icon name="upload" size={18} />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              {isDragging
                ? "Drop files here to add to queue"
                : "Drag & drop files here"}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
              or click to browse from device
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={!canModify}
            />
          </div>

          {/* Folder + Drive import actions */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => canModify && folderInputRef.current?.click()}
              disabled={!canModify}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/70 hover:border-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-[color,background-color,border-color,transform] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Icon name="folderPlus" size={15} />
              Upload Folder
            </button>
            <button
              onClick={handleGDriveImport}
              disabled={!canModify}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-700/70 hover:border-green-400/60 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/60 dark:hover:bg-green-500/10 transition-[color,background-color,border-color,transform] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <GoogleDriveLogo size={15} />
              Drive Import
            </button>
            <input
              ref={folderInputRef}
              type="file"
              multiple
              webkitdirectory="true"
              directory="true"
              onChange={handleFolderSelect}
              className="hidden"
              disabled={!canModify}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 pb-3 no-scrollbar space-y-4">
          {hasPending && (
            <div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-display">
                  Selected Items ({totalPending})
                  {hasFolderItems && (
                    <span className="text-blue-600 dark:text-blue-400 font-bold ml-1.5 lowercase">
                      · folder upload
                    </span>
                  )}
                  {pendingImports.length > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-bold ml-1.5 lowercase">
                      · google drive
                    </span>
                  )}
                </p>
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 font-mono">
                  Total: {formatSize(totalPendingSize)}
                </span>
              </div>

              <div className="space-y-1.5 mt-2">
                {pendingItems.map((u) => {
                  const fileType = getExt(u.name);
                  return (
                    <div
                      key={u.localId}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800 group hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon
                          name={u.relativePath ? "folder" : fileType}
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 ${
                            editingItem?.kind === "upload" &&
                            editingItem.localId === u.localId
                              ? ""
                              : "truncate"
                          }`}
                        >
                          {u.relativePath && (
                            <span className="text-xs text-slate-400 font-mono truncate max-w-[120px] shrink-0">
                              {u.relativePath.split("/").slice(0, -1).join("/")}
                              /
                            </span>
                          )}
                          {editingItem?.kind === "upload" &&
                          editingItem.localId === u.localId ? (
                            <span className="flex-1 min-w-0 flex items-center gap-1">
                              <input
                                autoFocus
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename();
                                  if (e.key === "Escape") cancelRename();
                                }}
                                onBlur={commitRename}
                                className="flex-1 min-w-0 px-1.5 py-0.5 text-xs font-bold rounded-lg border border-blue-400 dark:border-blue-500 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                              />
                              {editingItem.ext && (
                                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 shrink-0 select-none">
                                  {editingItem.ext}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="truncate">{u.name}</span>
                          )}
                          {canModify &&
                            !(
                              editingItem?.kind === "upload" &&
                              editingItem.localId === u.localId
                            ) && (
                              <button
                                onClick={() =>
                                  startRename("upload", u.localId, u.name)
                                }
                                className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer shrink-0"
                                title="Rename file"
                              >
                                <Icon name="edit" size={13} />
                              </button>
                            )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium font-mono">
                          {formatSize(u.size)}
                        </p>
                      </div>
                      {canModify && (
                        <button
                          onClick={() => removePending(u.localId)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {pendingImports.length > 0 && (
                <div className="space-y-1.5 mt-1.5">
                  {pendingImports.map((im) => {
                    const fileType = getExt(im.name);
                    return (
                      <div
                        key={im.localId}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-green-50/70 dark:bg-green-500/5 border border-green-200/60 dark:border-green-500/20 group hover:border-green-300 dark:hover:border-green-500/40 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Icon
                            name={im.relativePath ? "folder" : fileType}
                            size={16}
                            className="text-green-600 dark:text-green-400"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 ${
                              editingItem?.kind === "import" &&
                              editingItem.localId === im.localId
                                ? ""
                                : "truncate"
                            }`}
                          >
                            <span className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider shrink-0">
                              Drive
                            </span>
                            {editingItem?.kind === "import" &&
                            editingItem.localId === im.localId ? (
                              <span className="flex-1 min-w-0 flex items-center gap-1">
                                <input
                                  autoFocus
                                  value={draftName}
                                  onChange={(e) => setDraftName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitRename();
                                    if (e.key === "Escape") cancelRename();
                                  }}
                                  onBlur={commitRename}
                                  className="flex-1 min-w-0 px-1.5 py-0.5 text-xs font-bold rounded-lg border border-green-400 dark:border-green-500 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                />
                                {editingItem.ext && (
                                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 shrink-0 select-none">
                                    {editingItem.ext}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="truncate">{im.name}</span>
                            )}
                            {canModify &&
                              !(
                                editingItem?.kind === "import" &&
                                editingItem.localId === im.localId
                              ) && (
                                <button
                                  onClick={() =>
                                    startRename("import", im.localId, im.name)
                                  }
                                  className="p-1 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors cursor-pointer shrink-0"
                                  title="Rename import"
                                >
                                  <Icon name="edit" size={13} />
                                </button>
                              )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium font-mono">
                            {formatSize(im.size)}
                          </p>
                        </div>
                        {canModify && (
                          <button
                            onClick={() => removePendingImport(im.localId)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove import"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeUploads.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-display pt-1">
                Uploading ({activeUploads.length})
              </p>
              <div className="space-y-1.5 mt-2">
                {activeUploads.map((u) => (
                  <div
                    key={u.localId}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-500/5 border border-blue-200/60 dark:border-blue-500/20"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-blue-200/80 dark:border-blue-500/30 flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon
                        name="upload"
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {u.name}
                        </p>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {u.progress}%
                        </span>
                      </div>
                      {u.status === "uploading" ? (
                        <div>
                          <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5 border border-slate-200/40 dark:border-zinc-700/40">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-[width] duration-300"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                          <UploadMeta item={u} />
                        </div>
                      ) : u.status === "paused" ? (
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          Paused
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                          Queued
                        </p>
                      )}
                    </div>
                    {u.status === "paused" ? (
                      <button
                        onClick={() => resumeUpload(u.localId)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors cursor-pointer"
                        title="Resume upload"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => cancelUpload(u.localId)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Cancel upload"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeImports.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-display pt-1">
                Importing ({activeImports.length})
              </p>
              <div className="space-y-1.5 mt-2">
                {activeImports.map((im) => (
                  <div
                    key={im.localId}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-green-50/60 dark:bg-green-500/5 border border-green-200/60 dark:border-green-500/20"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-green-200/80 dark:border-green-500/30 flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon
                        name="drive"
                        size={16}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {im.name}
                        </p>
                        <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400">
                          {im.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5 border border-slate-200/40 dark:border-zinc-700/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500 transition-[width] duration-300"
                          style={{ width: `${im.progress}%` }}
                        />
                      </div>
                      {im.status === "uploading" && <ImportMeta item={im} />}
                    </div>
                    <button
                      onClick={() => cancelImport(im.localId)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Cancel import"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finishedCount > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-display pt-1">
                Finished ({finishedCount})
              </p>
              <div className="space-y-1.5 mt-2">
                {finishedUploads.map((u) => {
                  const fileType = getExt(u.name);
                  return (
                    <div
                      key={u.localId}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon
                          name={fileType}
                          size={16}
                          className={
                            u.status === "failed"
                              ? "text-rose-500"
                              : "text-blue-600 dark:text-blue-400"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
                          {u.status === "completed" ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Uploaded · {formatSize(u.size)}
                            </span>
                          ) : u.status === "cancelled" ? (
                            <span className="text-slate-400">Cancelled</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">
                              {u.error || "Upload failed"}
                            </span>
                          )}
                        </p>
                      </div>
                      {u.status === "failed" && (
                        <button
                          onClick={() => handleRetry("upload", u.localId)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200/70 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => removeUpload(u.localId)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  );
                })}
                {finishedImports.map((im) => {
                  const fileType = getExt(im.name);
                  return (
                    <div
                      key={im.localId}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-green-50/60 dark:bg-green-500/5 border border-green-200/60 dark:border-green-500/20"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-green-200/80 dark:border-green-500/30 flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon
                          name={fileType}
                          size={16}
                          className={
                            im.status === "failed"
                              ? "text-rose-500"
                              : "text-green-600 dark:text-green-400"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {im.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
                          {im.status === "completed" ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Imported · {formatSize(im.size)}
                            </span>
                          ) : im.status === "cancelled" ? (
                            <span className="text-slate-400">Cancelled</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">
                              {im.error || "Import failed"}
                            </span>
                          )}
                        </p>
                      </div>
                      {im.status === "failed" && (
                        <button
                          onClick={() => handleRetry("import", im.localId)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200/70 dark:border-green-500/30 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => removeImport(im.localId)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!hasPending && activeCount === 0 && finishedCount === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                Drop files, choose a folder, or import from Google Drive
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/40">
          <div className="flex flex-col text-xs">
            {isOverQuota ? (
              <span className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
                <Icon name="alertTriangle" size={14} />
                Exceeds storage limit by{" "}
                {formatSize(totalPendingSize - currentRemaining)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {(hasPending || activeCount > 0) && (
              <button
                onClick={handleCancelAll}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl transition-[color,background-color] cursor-pointer"
              >
                Cancel All
              </button>
            )}
            {hasPending ? (
              <button
                onClick={handleUploadAll}
                disabled={isOverQuota || submitting}
                className="px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-[background-color,transform,box-shadow] shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Icon name={hasImportOnly ? "drive" : "upload"} size={16} />
                {hasFolderItems
                  ? `Create & Upload All`
                  : hasImportOnly
                    ? `Import All (${pendingImports.length})`
                    : `Upload & Import All (${totalPending})`}
              </button>
            ) : (
              <button
                onClick={handleDone}
                className="px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-xl transition-[background-color,transform,box-shadow] shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Icon name="check" size={16} />
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
