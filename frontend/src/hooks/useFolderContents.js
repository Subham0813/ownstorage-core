import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { directoryAPI } from "../api/directoryApi";
import { useUploadStore } from "../store/uploadStore";
import { sortItems, mergeOptimistic } from "../utils/optimistic";

const DEFAULT_PAGE_SIZE = 50;

function getFolderLimit(parentId, type) {
  try {
    const val = sessionStorage.getItem(`folder_limit_${parentId}_${type}`);
    return val ? Math.max(DEFAULT_PAGE_SIZE, parseInt(val, 10)) : DEFAULT_PAGE_SIZE;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

function setFolderLimit(parentId, type, count) {
  try {
    sessionStorage.setItem(`folder_limit_${parentId}_${type}`, String(count));
  } catch {}
}

const EMPTY_OPTIMISTIC = { added: [], overrides: {}, removedIds: new Set() };

export function useFolderContents(
  parentId,
  { sortBy = "name", sortOrder = "asc" } = {},
) {
  const [state, setState] = useState({
    dirs: [],
    files: [],
    items: [],
    dirCursor: null,
    fileCursor: null,
    isLoading: true,
    isRefreshing: false,
    hasLoaded: false,
    loadedParentId: null,
    loadingMoreDirs: false,
    loadingMoreFiles: false,
    hasMoreDirs: true,
    hasMoreFiles: true,
  });
  const versionRef = useRef(0);
  const [optimistic, setOptimistic] = useState(EMPTY_OPTIMISTIC);

  const optimisticAdd = useCallback((item) => {
    setOptimistic((prev) => ({ ...prev, added: [...prev.added, item] }));
  }, []);

  const optimisticRemove = useCallback((id) => {
    setOptimistic((prev) => {
      const removedIds = new Set(prev.removedIds);
      removedIds.add(id);
      return {
        ...prev,
        removedIds,
        added: prev.added.filter((a) => a.id !== id),
      };
    });
  }, []);

  const optimisticPatch = useCallback((id, updater) => {
    setOptimistic((prev) => ({
      ...prev,
      overrides: { ...prev.overrides, [id]: updater },
    }));
  }, []);

  const clearOptimistic = useCallback(() => {
    setOptimistic(EMPTY_OPTIMISTIC);
  }, []);

  const fetchPage = useCallback(
    async (dirCursor, fileCursor, customDirLimit, customFileLimit) => {
      const dirLimit = customDirLimit || getFolderLimit(parentId, "dirs");
      const fileLimit = customFileLimit || getFolderLimit(parentId, "files");

      const [dirRes, fileRes] = await Promise.all([
        directoryAPI.getAllDirs(parentId, {
          limit: dirLimit,
          ...(dirCursor ? { cursor: dirCursor } : {}),
        }),
        directoryAPI.getAllFiles(parentId, {
          limit: fileLimit,
          ...(fileCursor ? { cursor: fileCursor } : {}),
        }),
      ]);
      return {
        dirs: dirRes.data?.data?.items || [],
        dirCursor: dirRes.data?.data?.nextCursor || null,
        files: fileRes.data?.data?.items || [],
        fileCursor: fileRes.data?.data?.nextCursor || null,
      };
    },
    [parentId],
  );

  // Initial load & sort change
  useEffect(() => {
    if (!parentId) return;
    versionRef.current += 1;
    const currentVersion = versionRef.current;
    clearOptimistic();

    // Only show the skeleton for a brand-new folder; keep stale content on refetch
    setState((prev) => ({
      ...prev,
      isLoading: !prev.hasLoaded || prev.loadedParentId !== parentId,
      isRefreshing: prev.hasLoaded && prev.loadedParentId === parentId,
    }));

    fetchPage(null, null).then((result) => {
      if (currentVersion !== versionRef.current) return;
      const sortedDirs = sortItems(result.dirs, sortBy, sortOrder);
      const sortedFiles = sortItems(result.files, sortBy, sortOrder);
      const allItems = sortItems([...sortedDirs, ...sortedFiles], sortBy, sortOrder);
      setState({
        dirs: sortedDirs,
        files: sortedFiles,
        items: allItems,
        dirCursor: result.dirCursor,
        fileCursor: result.fileCursor,
        isLoading: false,
        isRefreshing: false,
        hasLoaded: true,
        loadedParentId: parentId,
        loadingMoreDirs: false,
        loadingMoreFiles: false,
        hasMoreDirs: !!result.dirCursor,
        hasMoreFiles: !!result.fileCursor,
      });
    });

    return () => {
      versionRef.current += 1;
    };
  }, [parentId, sortBy, sortOrder, fetchPage, clearOptimistic]);

  // Re-sort when sort changes (items already loaded, just re-sort)
  useEffect(() => {
    if (state.isLoading || state.items.length === 0) return;
    setState((prev) => ({
      ...prev,
      items: sortItems(prev.items, sortBy, sortOrder),
    }));
  }, [sortBy, sortOrder]);

  const loadMoreDirs = useCallback(async () => {
    if (!state.dirCursor || state.loadingMoreDirs) return;
    setState((prev) => ({ ...prev, loadingMoreDirs: true }));
    try {
      const result = await fetchPage(state.dirCursor, null, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
      setState((prev) => {
        const mergedDirs = [...prev.dirs, ...result.dirs];
        const newDirs = sortItems(mergedDirs, sortBy, sortOrder);
        const newItems = sortItems([...prev.items, ...result.dirs], sortBy, sortOrder);
        setFolderLimit(parentId, "dirs", newDirs.length);
        return {
          ...prev,
          dirs: newDirs,
          items: newItems,
          dirCursor: result.dirCursor,
          loadingMoreDirs: false,
          hasMoreDirs: !!result.dirCursor,
        };
      });
    } catch {
      setState((prev) => ({ ...prev, loadingMoreDirs: false }));
    }
  }, [state.dirCursor, state.loadingMoreDirs, fetchPage, sortBy, sortOrder, parentId]);

  const loadMoreFiles = useCallback(async () => {
    if (!state.fileCursor || state.loadingMoreFiles) return;
    setState((prev) => ({ ...prev, loadingMoreFiles: true }));
    try {
      const result = await fetchPage(null, state.fileCursor, DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
      setState((prev) => {
        const mergedFiles = [...prev.files, ...result.files];
        const newFiles = sortItems(mergedFiles, sortBy, sortOrder);
        const newItems = sortItems([...prev.items, ...result.files], sortBy, sortOrder);
        setFolderLimit(parentId, "files", newFiles.length);
        return {
          ...prev,
          files: newFiles,
          items: newItems,
          fileCursor: result.fileCursor,
          loadingMoreFiles: false,
          hasMoreFiles: !!result.fileCursor,
        };
      });
    } catch {
      setState((prev) => ({ ...prev, loadingMoreFiles: false }));
    }
  }, [state.fileCursor, state.loadingMoreFiles, fetchPage, sortBy, sortOrder, parentId]);

  const refresh = useCallback(() => {
    versionRef.current += 1;
    const currentVersion = versionRef.current;
    // Server truth wins: drop any optimistic patches and re-fetch.
    clearOptimistic();
    setState((prev) => ({ ...prev, isRefreshing: true }));
    fetchPage(null, null).then((result) => {
      if (currentVersion !== versionRef.current) return;
      const sortedDirs = sortItems(result.dirs, sortBy, sortOrder);
      const sortedFiles = sortItems(result.files, sortBy, sortOrder);
      const allItems = sortItems([...sortedDirs, ...sortedFiles], sortBy, sortOrder);
      setState({
        dirs: sortedDirs,
        files: sortedFiles,
        items: allItems,
        dirCursor: result.dirCursor,
        fileCursor: result.fileCursor,
        isLoading: false,
        isRefreshing: false,
        hasLoaded: true,
        loadedParentId: parentId,
        loadingMoreDirs: false,
        loadingMoreFiles: false,
        hasMoreDirs: !!result.dirCursor,
        hasMoreFiles: !!result.fileCursor,
      });
    });
  }, [fetchPage, parentId, sortBy, sortOrder, clearOptimistic]);

  // Auto-refresh when an upload finishes for this folder
  useEffect(() => {
    const handleUploadCompleted = (e) => {
      const targetParentId = e.detail?.parentId;
      if (!targetParentId || String(targetParentId) === String(parentId)) {
        refresh();
      }
    };

    window.addEventListener("vd:upload-completed", handleUploadCompleted);
    return () => {
      window.removeEventListener("vd:upload-completed", handleUploadCompleted);
    };
  }, [parentId, refresh]);

  // Auto-refresh when a Google Drive import finishes for this folder
  useEffect(() => {
    const handleImportCompleted = (e) => {
      const targetParentId = e.detail?.parentId;
      if (!targetParentId || String(targetParentId) === String(parentId)) {
        refresh();
      }
    };

    window.addEventListener("vd:import-completed", handleImportCompleted);
    return () => {
      window.removeEventListener("vd:import-completed", handleImportCompleted);
    };
  }, [parentId, refresh]);

  // Fallback: watch Zustand upload store for completion state changes
  useEffect(() => {
    let prevCompleted = useUploadStore
      .getState()
      .uploads.filter((u) => u.status === "completed").length;

    const unsub = useUploadStore.subscribe((state) => {
      const completed = state.uploads.filter((u) => u.status === "completed");
      if (completed.length > prevCompleted) {
        const newCompletions = completed.slice(prevCompleted);
        const matchesFolder = newCompletions.some(
          (u) => !u.parentId || String(u.parentId) === String(parentId)
        );
        prevCompleted = completed.length;
        if (matchesFolder) {
          refresh();
        }
      }
    });

    return () => unsub();
  }, [parentId, refresh]);

  // Fallback: watch Zustand import store for completion state changes
  useEffect(() => {
    let prevCompleted = useUploadStore
      .getState()
      .imports.filter((i) => i.status === "completed").length;

    const unsub = useUploadStore.subscribe((state) => {
      const completed = state.imports.filter((i) => i.status === "completed");
      if (completed.length > prevCompleted) {
        const newCompletions = completed.slice(prevCompleted);
        const matchesFolder = newCompletions.some(
          (i) => !i.parentId || String(i.parentId) === String(parentId)
        );
        prevCompleted = completed.length;
        if (matchesFolder) {
          refresh();
        }
      }
    });

    return () => unsub();
  }, [parentId, refresh]);

  // Merged view: server truth + optimistic patches (added/overrides/removed).
  const hasOptimistic =
    optimistic.added.length > 0 ||
    Object.keys(optimistic.overrides).length > 0 ||
    optimistic.removedIds.size > 0;

  const { dirs: mergedDirs, files: mergedFiles, items: mergedItems } = useMemo(() => {
    if (!hasOptimistic) {
      return { dirs: state.dirs, files: state.files, items: state.items };
    }
    const result = mergeOptimistic({
      dirs: state.dirs,
      files: state.files,
      overrides: optimistic.overrides,
      removedIds: optimistic.removedIds,
      added: optimistic.added,
    });
    return {
      dirs: sortItems(result.dirs, sortBy, sortOrder),
      files: sortItems(result.files, sortBy, sortOrder),
      items: sortItems(result.items, sortBy, sortOrder),
    };
  }, [hasOptimistic, state.dirs, state.files, state.items, optimistic, sortBy, sortOrder]);

  return {
    ...state,
    dirs: mergedDirs,
    files: mergedFiles,
    items: mergedItems,
    loadMoreDirs,
    loadMoreFiles,
    refresh,
    optimistic: { add: optimisticAdd, patch: optimisticPatch, remove: optimisticRemove, clear: clearOptimistic },
  };
}
