import { useCallback } from "react";
import { directoryAPI } from "../api/directoryApi";
import { fileAPI } from "../api/fileApi";
import { isDirItem, getPublicLinkToken, copyPublicLink } from "../utils/itemActions";
import { makeTempId } from "../utils/optimistic";

/**
 * Centralizes every folder/file action handler for the AllFiles page:
 * context-menu actions, rename/create/move/copy, details panel, and bulk actions.
 * Fast ops are optimistic: the UI updates instantly and reconciles on server settle.
 */
export function useFolderActions({
  parentId,
  refresh,
  allItems,
  folders,
  files,
  selectedIds,
  setSelectedIds,
  setRenameModal,
  setMoveModal,
  setShareModal,
  setNewFolderModal,
  setDetailsPanel,
  showMessage,
  navigate,
  queryClient,
  optimistic = { add() {}, patch() {}, remove() {}, clear() {} },
}) {
  const invalidateFolder = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["directoryInfo"] });
    queryClient.invalidateQueries({ queryKey: ["itemInfo"] });
    queryClient.invalidateQueries({ queryKey: ["user-starred"] });
    queryClient.invalidateQueries({ queryKey: ["user-recents"] });
    queryClient.invalidateQueries({ queryKey: ["user-usage"] });
    queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    queryClient.invalidateQueries({ queryKey: ["shared"] });
    refresh();
    window.dispatchEvent(new CustomEvent("vd:usage-changed"));
  }, [queryClient, refresh]);

  const handleOpen = useCallback(
    (item) => {
      if (item._pending) return;
      if (item.type === "directory") {
        navigate(`/myfiles/folders/${item.id}`);
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

  const handleShowDetails = useCallback((item) => {
    setDetailsPanel({ isOpen: true, item });
  }, [setDetailsPanel]);

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
              const res = await api.getDownloadInfo(item.id);
              const size = res.data?.data?.size;
              window.open(`/api/directories/download/${item.id}`, "_blank", "noopener,noreferrer");
            } else {
              const res = await api.getDownloadUrl(item.id);
              const url = res.data?.data?.url;
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }
            break;
          }
          case "rename":
            setRenameModal({ isOpen: true, item });
            break;
          case "copy":
            setMoveModal({ isOpen: true, item, items: null, mode: "copy" });
            break;
          case "move":
            setMoveModal({ isOpen: true, item, items: null });
            break;
          case "share":
            setShareModal({ isOpen: true, item });
            break;
          case "getLink": {
            const shareApi = isDir ? directoryAPI : fileAPI;
            const token = await getPublicLinkToken(shareApi, item.id);
            if (token) {
              await copyPublicLink(token, showMessage);
            } else {
              setShareModal({ isOpen: true, item });
            }
            break;
          }
          case "star":
            optimistic.patch(item.id, (it) => ({
              ...it,
              isStarred: !item.isStarred,
            }));
            try {
              await api.toggleStar(item.id, !item.isStarred);
              invalidateFolder();
              setDetailsPanel((prev) =>
                prev.item?.id === item.id
                  ? {
                      ...prev,
                      item: { ...prev.item, isStarred: !item.isStarred },
                    }
                  : prev,
              );
              showMessage("success", item.isStarred ? "Unstarred" : "Starred");
            } catch (err) {
              optimistic.clear();
              showMessage("error", err?.response?.data?.message || "Action failed.");
            }
            break;
          case "details":
            handleShowDetails(item);
            break;
          case "trash":
            optimistic.remove(item.id);
            try {
              await api.trash(item.id);
              invalidateFolder();
              showMessage("success", "Moved to bin");
            } catch (err) {
              optimistic.clear();
              showMessage("error", err?.response?.data?.message || "Action failed.");
            }
            break;
          default:
            break;
        }
      } catch (err) {
        showMessage("error", err?.response?.data?.message || "Action failed.");
      }
    },
    [
      handleOpen,
      handleShowDetails,
      showMessage,
      invalidateFolder,
      setRenameModal,
      setMoveModal,
      setShareModal,
      setDetailsPanel,
    ],
  );

  const handleRename = useCallback(
    async (item, newName) => {
      const isDir = item.type === "directory";
      const api = isDir ? directoryAPI : fileAPI;
      optimistic.patch(item.id, (it) => ({ ...it, name: newName }));
      try {
        await api.rename(item.id, newName);
        invalidateFolder();
        showMessage("success", `Renamed to "${newName}"`);
      } catch (err) {
        optimistic.clear();
        showMessage("error", err?.response?.data?.message || "Failed to rename.");
      }
      setRenameModal({ isOpen: false, item: null });
      setDetailsPanel((prev) =>
        prev.item?.id === item.id
          ? { ...prev, item: { ...prev.item, name: newName } }
          : prev,
      );
    },
    [invalidateFolder, showMessage, setRenameModal, setDetailsPanel, optimistic],
  );

  const handleCreateFolder = useCallback(
    async (name) => {
      if (!name?.trim()) return;
      const tempId = makeTempId("folder");
      optimistic.add({
        id: tempId,
        tempId,
        type: "directory",
        name: name.trim(),
        isDirectory: true,
        isDir: true,
        isStarred: false,
        size: 0,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true,
      });
      setNewFolderModal(false);
      try {
        await directoryAPI.create({ targetId: parentId, name: name.trim() });
        invalidateFolder();
        showMessage("success", `Folder "${name.trim()}" created`);
      } catch (err) {
        optimistic.clear();
        showMessage(
          "error",
          err?.response?.data?.message || "Failed to create folder.",
        );
      }
    },
    [parentId, invalidateFolder, showMessage, setNewFolderModal, optimistic],
  );

  const handleMove = useCallback(
    async (itemOrItems, targetId) => {
      const isBulk = Array.isArray(itemOrItems);
      const items = isBulk ? itemOrItems : [itemOrItems];
      items.forEach((i) => optimistic.remove(i.id));
      try {
        await Promise.all(
          items.map((i) => {
            const isDir = folders.some((f) => f.id === i.id);
            const api = isDir ? directoryAPI : fileAPI;
            return api.move(i.id, targetId);
          }),
        );
        invalidateFolder();
        showMessage(
          "success",
          isBulk
            ? `Moved ${items.length} item${items.length > 1 ? "s" : ""}`
            : `Moved "${items[0].name}"`,
        );
        setMoveModal({ isOpen: false, item: null, items: null });
        setDetailsPanel({ isOpen: false, item: null });
        setSelectedIds?.(new Set());
      } catch (err) {
        optimistic.clear();
        showMessage(
          "error",
          err?.response?.data?.message || "Failed to move items.",
        );
        setMoveModal({ isOpen: false, item: null, items: null });
      }
    },
    [
      folders,
      invalidateFolder,
      showMessage,
      setMoveModal,
      setDetailsPanel,
      setSelectedIds,
      optimistic,
    ],
  );

  const handleCopy = useCallback(
    async (item, targetId) => {
      if (item.type === "directory") {
        showMessage("error", "Copying folders is not supported yet.");
        return;
      }
      const tempId = makeTempId("copy");
      optimistic.add({ ...item, id: tempId, tempId, name: `${item.name} (copy)`, _pending: true });
      setMoveModal({ isOpen: false, item: null, items: null });
      try {
        await fileAPI.copy(item.id, targetId);
        invalidateFolder();
        showMessage("success", `Copied "${item.name}"`);
      } catch (err) {
        optimistic.clear();
        showMessage("error", err?.response?.data?.message || "Failed to copy.");
      }
    },
    [invalidateFolder, showMessage, setMoveModal, optimistic],
  );

  const handleDetailsAction = useCallback(
    async (action, item) => {
      await handleCtxAction(action, item);
      if (action === "trash") {
        setDetailsPanel({ isOpen: false, item: null });
      }
    },
    [handleCtxAction, setDetailsPanel],
  );

  const handleBulkAction = useCallback(
    async (action) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      try {
        switch (action) {
          case "star": {
            const selectedItems = allItems.filter((i) => ids.includes(i.id));
            selectedItems.forEach((i) =>
              optimistic.patch(i.id, (it) => ({ ...it, isStarred: !i.isStarred })),
            );
            try {
              await Promise.all(
                selectedItems.map((i) => {
                  const isDir = folders.some((f) => f.id === i.id);
                  const api = isDir ? directoryAPI : fileAPI;
                  return api.toggleStar(i.id, !i.isStarred);
                }),
              );
              invalidateFolder();
              showMessage("success", `Starred ${ids.length} items`);
            } catch (err) {
              optimistic.clear();
              showMessage("error", err?.response?.data?.message || "Action failed.");
            }
            break;
          }
          case "trash":
            ids.forEach((id) => optimistic.remove(id));
            try {
              await Promise.all(
                ids.map((id) => {
                  const isDir = folders.some((f) => f.id === id);
                  const api = isDir ? directoryAPI : fileAPI;
                  return api.trash(id);
                }),
              );
              invalidateFolder();
              showMessage("success", `Moved ${ids.length} items to bin`);
            } catch (err) {
              optimistic.clear();
              showMessage("error", err?.response?.data?.message || "Action failed.");
            }
            break;
          case "preview": {
            const previewItems = allItems.filter((i) => ids.includes(i.id));
            if (previewItems.length === 1) {
              handleOpen(previewItems[0]);
            } else {
              showMessage("info", "Open works on a single item.");
            }
            break;
          }
          case "download": {
            const downloadItems = [
              ...folders
                .filter((i) => ids.includes(i.id))
                .map((i) => ({ type: "directory", id: i.id })),
              ...files
                .filter((i) => ids.includes(i.id))
                .map((i) => ({ type: "file", id: i.id })),
            ];
            if (downloadItems.length > 0) {
              fileAPI.bulkDownload(downloadItems);
              showMessage(
                "info",
                `Downloading ${downloadItems.length} item${downloadItems.length > 1 ? "s" : ""}...`,
              );
            }
            break;
          }
          case "move": {
            const moveItems = allItems.filter((i) => ids.includes(i.id));
            if (moveItems.length > 0) {
              setMoveModal({
                isOpen: true,
                items: moveItems,
                mode: "move",
              });
            }
            break;
          }
          default:
            break;
        }
        setSelectedIds?.(new Set());
      } catch (err) {
        showMessage("error", err?.response?.data?.message || "Action failed.");
      }
    },
    [selectedIds, allItems, folders, files, showMessage, invalidateFolder, setSelectedIds, setMoveModal, handleOpen, optimistic],
  );

  return {
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
  };
}
