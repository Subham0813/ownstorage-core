import axiosInstance from "./axiosInstance";

/**
 * User / home routes — all under /api/user
 * Docs: userRouteRequestResponse.md
 */
export const homeAPI = {
  /** GET /api/user/info — current user profile */
  getUserProfile: () => axiosInstance.get("/api/user/info"),

  /** PUT /api/user/logout — logout current session */
  logout: () => axiosInstance.put("/api/user/logout"),

  /** PUT /api/user/logout-all — logout all sessions */
  logoutAll: () => axiosInstance.put("/api/user/logout-all"),

  /** GET /api/user/sessions — list all active sessions */
  getActiveSessions: () => axiosInstance.get("/api/user/sessions"),

  /** DELETE /api/user/sessions/:sessionId — revoke a specific session */
  revokeSession: (sessionId) =>
    axiosInstance.delete(`/api/user/sessions/${sessionId}`),

  /** DELETE /api/user/delete-profile — permanently delete account */
  deleteProfile: () => axiosInstance.delete("/api/user/delete-profile"),

  /** PATCH /api/user/update-name — update display name. Body: { name: string } */
  updateName: (data) => axiosInstance.patch("/api/user/update-name", data),


  /** PUT /api/user/revoke-drive-integration — disconnect Google Drive */
  revokeDriveIntegration: () =>
    axiosInstance.put("/api/user/revoke-drive-integration"),

  // ── Bin ──────────────────────────────────────────────────────────
  /**
   * Convenience: fetch both bin files and dirs in parallel.
   * Returns { directories: [...], files: [...] }
   */
  getBin: async (params) => {
    const [dirsRes, filesRes] = await Promise.all([
      axiosInstance.get("/api/user/bin/dirs", { params }),
      axiosInstance.get("/api/user/bin/files", { params }),
    ]);
    const dirs = dirsRes.data?.data?.items || [];
    const files = filesRes.data?.data?.items || [];
    return {
      data: {
        success: true,
        data: {
          items: [...dirs, ...files],
        },
      },
    };
  },

  // ── RECENTS ───────────────────────────────────────────────────────
  /**
   * Convenience: fetch both recent dirs and files in parallel.
   * Returns shape compatible with Dashboard load()
   */
  getRecents: async (params) => {
    const [dirsRes, filesRes] = await Promise.all([
      axiosInstance.get("/api/user/recents/dirs", { params }),
      axiosInstance.get("/api/user/recents/files", { params }),
    ]);
    return {
      data: {
        success: true,
        data: {
          directories: dirsRes.data?.data?.items || [],
          dirNextCursor: dirsRes.data?.data?.nextCursor,
          files: filesRes.data?.data?.items || [],
          fileNextCursor: filesRes.data?.data?.nextCursor,
        },
      },
    };
  },

  // ── STARRED ───────────────────────────────────────────────────────
  /**
   * Convenience: fetch both starred dirs and files in parallel.
   */
  getStarred: async (params) => {
    const [dirsRes, filesRes] = await Promise.all([
      axiosInstance.get("/api/user/starred/dirs", { params }),
      axiosInstance.get("/api/user/starred/files", { params }),
    ]);
    return {
      data: {
        success: true,
        data: {
          directories: dirsRes.data?.data?.items || [],
          dirNextCursor: dirsRes.data?.data?.nextCursor,
          files: filesRes.data?.data?.items || [],
          fileNextCursor: filesRes.data?.data?.nextCursor,
        },
      },
    };
  },

  // ── SHARED ────────────────────────────────────────────────────────
  /**
   * Convenience: fetch all four shared endpoints in parallel.
   * Returns { sharedWithMe: { directories, files }, sharedByMe: { directories, files } }
   */
  getShared: async (params) => {
    const [withMeDirs, withMeFiles, byMeDirs, byMeFiles] = await Promise.all([
      axiosInstance.get("/api/user/shared-with-me/dirs", { params }),
      axiosInstance.get("/api/user/shared-with-me/files", { params }),
      axiosInstance.get("/api/user/shared-by-me/dirs", { params }),
      axiosInstance.get("/api/user/shared-by-me/files", { params }),
    ]);
    return {
      data: {
        success: true,
        data: {
          sharedWithMe: {
            directories: withMeDirs.data?.data?.items || [],
            dirNextCursor: withMeDirs.data?.data?.nextCursor,
            files: withMeFiles.data?.data?.items || [],
            fileNextCursor: withMeFiles.data?.data?.nextCursor,
          },
          sharedByMe: {
            directories: byMeDirs.data?.data?.items || [],
            dirNextCursor: byMeDirs.data?.data?.nextCursor,
            files: byMeFiles.data?.data?.items || [],
            fileNextCursor: byMeFiles.data?.data?.nextCursor,
          },
        },
      },
    };
  },

  // ── Storage ───────────────────────────────────────────────────────
  /** POST /api/user/feedback — submit feedback/ bug report */
  submitFeedback: (data) => axiosInstance.post("/api/user/feedback", data),

  /** GET /api/user/stats — file/folder counts, size breakdown by category */
  getStats: () => axiosInstance.get("/api/user/stats"),

  /** GET /api/user/usage — storage + bandwidth quota usage */
  getUsage: () => axiosInstance.get("/api/user/usage"),

  /**
   * GET /api/user/storage
   * Returns { totalSize, totalFiles, totalDirs, breakdown: { docs, images, videos, others } }
   * Each breakdown entry: { count, size }
   */
  emptyTrash: () => axiosInstance.put("/api/user/empty-trash"),

  /** PUT /api/user/update-avatar — update user avatar image */
  updateAvatar: (avatarBase64) =>
    axiosInstance.put("/api/user/update-avatar", { avatarBase64 }),

  // ── Notifications ────────────────────────────────────────────────
  /** GET /api/notifications — paginated notifications */
  getNotifications: (params) =>
    axiosInstance.get("/api/notifications", { params }),

  /** PUT /api/notifications/:id/read — mark single notification as read */
  markAsRead: (id) => axiosInstance.put(`/api/notifications/${id}/read`),

  /** PUT /api/notifications/mark-all-read — mark all as read */
  markAllRead: () => axiosInstance.put("/api/notifications/mark-all-read"),

  /** DELETE /api/notifications/clear-read — delete all read notifications */
  clearRead: () => axiosInstance.delete("/api/notifications/clear-read"),

  /** GET /api/notifications/unread-count — get unread count */
  getUnreadCount: () => axiosInstance.get("/api/notifications/unread-count"),
};
