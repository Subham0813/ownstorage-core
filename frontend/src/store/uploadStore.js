import { create } from "zustand";
import { genId, getImageMimeType } from "../utils/fileUtils";

/**
 * Zustand store for upload & import state.
 * Consumed by uploadManager.js (via getState()) and UI components (via useUploadStore hook).
 *
 * Upload lifecycle:  queued → uploading → completed | failed | paused | cancelled | url_expired
 * Import lifecycle: queued → uploading → completed | failed | cancelled
 */

export const useUploadStore = create((set) => ({
  uploads: [],
  imports: [],
  currentFolderId: null,
  currentFolderPath: "/Documents",
  folderUploadName: null,

  // ── Upload hub modal visibility ─────────────────────────────────
  uploadModalOpen: false,
  openUploadModal: () => set({ uploadModalOpen: true }),
  closeUploadModal: () => set({ uploadModalOpen: false }),

  // ── Upload actions ──────────────────────────────────────────────

  /** Add multiple files (status: pending — user must confirm before upload starts) */
  addFiles: (files, parentId = null, perFileParentIds = null) => {
    const items = Array.from(files).map((file, i) => ({
      localId: genId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type || getImageMimeType(file.name, file.type) || "application/octet-stream",
      parentId: perFileParentIds ? perFileParentIds[i] : parentId,
      relativePath: file.webkitRelativePath || null,
      status: "pending",
      progress: 0,
      uploadId: null,
      urls: [],
      totalParts: 0,
      partSize: 0,
      partIndex: 0,
      uploadedParts: [],
      startedAt: null,
      createdAt: Date.now(),
    }));
    set((s) => ({ uploads: [...s.uploads, ...items] }));
    return items.map((i) => i.localId);
  },

  /** Confirm all pending uploads */
  confirmAll: () =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.status === "pending" ? { ...u, status: "queued" } : u,
      ),
    })),

  /** Remove a pending item from the list */
  removePending: (localId) =>
    set((s) => ({
      uploads: s.uploads.filter((u) => u.localId !== localId),
    })),

  updateUpload: (localId, patch) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.localId === localId ? { ...u, ...patch } : u,
      ),
    })),

  clearCompleted: () =>
    set((s) => ({
      uploads: s.uploads.filter((u) => u.status !== "completed"),
    })),

  /** Remove a single upload by localId (any status) */
  removeUpload: (localId) =>
    set((s) => ({
      uploads: s.uploads.filter((u) => u.localId !== localId),
    })),

  setCurrentFolderId: (id, name, path) => set({
    currentFolderId: id,
    currentFolderPath: path || `/${name || "Documents"}`,
  }),

  setCurrentFolderPath: (path) => set({ currentFolderPath: path }),

  /** Update all pending items' parentId (used when user creates new folder in modal) */
  updatePendingParentId: (newParentId) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.status === "pending" ? { ...u, parentId: newParentId } : u,
      ),
    })),

  setFolderUploadName: (name) => set({ folderUploadName: name }),

  resumeUpload: (localId) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.localId === localId && u.status === "paused"
          ? { ...u, status: "queued" }
          : u,
      ),
    })),

  retryUpload: (localId) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.localId === localId &&
        ["failed", "url_expired"].includes(u.status)
          ? { ...u, status: "queued", progress: 0 }
          : u,
      ),
    })),

  cancelUploadLocal: (localId) =>
    set((s) => ({
      uploads: s.uploads.map((u) =>
        u.localId === localId
          ? { ...u, status: "cancelled" }
          : u,
      ),
    })),

  // ── Import actions ──────────────────────────────────────────────

  addImport: (file, parentId = null) => {
    const item = {
      localId: genId(),
      file,
      name: file.name,
      size: file.sizeBytes || file.size,
      type: file.mimeType || file.type || "application/octet-stream",
      parentId,
      status: "pending",
      progress: 0,
      sessionId: null,
      startedAt: null,
      createdAt: Date.now(),
    };
    set((s) => ({ imports: [...s.imports, item] }));
    return item.localId;
  },

  /** Confirm all pending imports */
  confirmAllImports: () =>
    set((s) => ({
      imports: s.imports.map((i) =>
        i.status === "pending" ? { ...i, status: "queued" } : i,
      ),
    })),

  /** Remove a pending import */
  removePendingImport: (localId) =>
    set((s) => ({
      imports: s.imports.filter((i) => i.localId !== localId),
    })),

  updateImport: (localId, patch) =>
    set((s) => ({
      imports: s.imports.map((i) =>
        i.localId === localId ? { ...i, ...patch } : i,
      ),
    })),

  removeImport: (localId) =>
    set((s) => ({
      imports: s.imports.filter((i) => i.localId !== localId),
    })),

  clearCompletedImports: () =>
    set((s) => ({
      imports: s.imports.filter((i) => i.status !== "completed"),
    })),

  cancelImport: (localId) =>
    set((s) => ({
      imports: s.imports.map((i) =>
        i.localId === localId
          ? { ...i, status: "cancelled" }
          : i,
      ),
    })),

  retryImport: (localId) =>
    set((s) => ({
      imports: s.imports.map((i) =>
        i.localId === localId && i.status === "failed"
          ? { ...i, status: "queued", progress: 0 }
          : i,
      ),
    })),
}));
