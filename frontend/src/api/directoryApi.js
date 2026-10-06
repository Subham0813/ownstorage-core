import axiosInstance from "./axiosInstance";

/**
 * Directory operations — all under /api/directories
 * Docs: directoryRouteRequestResponse.md
 */
export const directoryAPI = {
  /** GET /api/directories/all-dirs/:id — child directories */
  getAllDirs: (parentId, params) =>
    axiosInstance.get(`/api/directories/all-dirs/${parentId}`, { params }),

  /** GET /api/directories/all-files/:id — files in folder */
  getAllFiles: (parentId, params) =>
    axiosInstance.get(`/api/directories/all-files/${parentId}`, { params }),

  /** GET /api/directories/info/:id — directory metadata + breadcrumb path */
  getInfo: (id) =>
    axiosInstance.get(`/api/directories/info/${id}`),

  /** POST /api/directories/new — create folder. Body: { targetId, name } */
  create: (data) =>
    axiosInstance.post("/api/directories/new", data),

  /** PATCH /api/directories/rename/:id — Body: { newname } */
  rename: (id, newname) =>
    axiosInstance.patch(`/api/directories/rename/${id}`, { newname }),

  /** PATCH /api/directories/move/:id — Body: { targetId } */
  move: (id, targetId) =>
    axiosInstance.patch(`/api/directories/move/${id}`, { targetId }),

  /** PATCH /api/directories/starred/:id — Body: { starred: boolean } */
  toggleStar: (id, starred) =>
    axiosInstance.patch(`/api/directories/starred/${id}`, { starred }),

  /** PUT /api/directories/trash/:id — move to bin */
  trash: (id) =>
    axiosInstance.put(`/api/directories/trash/${id}`),

  /** PUT /api/directories/restore/:id — restore from bin */
  restore: (id) =>
    axiosInstance.put(`/api/directories/restore/${id}`),

  /** DELETE /api/directories/delete/:id — permanently delete */
  delete: (id) =>
    axiosInstance.delete(`/api/directories/delete/${id}`),

  /** GET /api/directories/share-info/:id — sharing state. Pass { public: 1 } to include publicPermission. */
  getShareInfo: (id, params) =>
    axiosInstance.get(`/api/directories/share-info/${id}`, { params }),

  /** POST /api/directories/share/:id — share with users &/or set public link */
  share: (id, data) =>
    axiosInstance.post(`/api/directories/share/${id}`, data),

  /** PATCH /api/directories/revoke-access/:id — revoke permissions */
  revokeAccess: (id, data) =>
    axiosInstance.patch(`/api/directories/revoke-access/${id}`, data),

  /** PATCH /api/directories/new-token/:id — regenerate public share token */
  newToken: (id, data) =>
    axiosInstance.patch(`/api/directories/new-token/${id}`, data),

  /** GET /api/directories/download-info/:id — name + size before ZIP download */
  getDownloadInfo: (id) =>
    axiosInstance.get(`/api/directories/download-info/${id}`),

  /** GET /api/directories/download/:id — binary ZIP stream (navigate browser) */
  getDownloadUrl: (id) =>
    axiosInstance.get(`/api/directories/download/${id}`),
};
