import axiosInstance from "./axiosInstance";

/**
 * File operations — all under /api/files
 * Docs: fileRouteRequestResponse.md
 */
export const fileAPI = {
  /** GET /api/files/info/:id — file metadata */
  getInfo: (id) =>
    axiosInstance.get(`/api/files/info/${id}`),

  /** GET /api/files/download/:id — signed download URL */
  getDownloadUrl: (id) =>
    axiosInstance.get(`/api/files/download/${id}`),

  /** GET /api/files/preview/:id — signed preview URL */
  getPreviewUrl: (id) =>
    axiosInstance.get(`/api/files/preview/${id}`),

  /** PATCH /api/files/rename/:id — Body: { newname } */
  rename: (id, newname) =>
    axiosInstance.patch(`/api/files/rename/${id}`, { newname }),

  /** PATCH /api/files/move/:id — Body: { targetId } */
  move: (id, targetId) =>
    axiosInstance.patch(`/api/files/move/${id}`, { targetId }),

  /** PATCH /api/files/starred/:id — Body: { starred: boolean } */
  toggleStar: (id, starred) =>
    axiosInstance.patch(`/api/files/starred/${id}`, { starred }),

  /** PUT /api/files/trash/:id — move to bin */
  trash: (id) =>
    axiosInstance.put(`/api/files/trash/${id}`),

  /** PUT /api/files/restore/:id — restore from bin */
  restore: (id) =>
    axiosInstance.put(`/api/files/restore/${id}`),

  /** DELETE /api/files/delete/:id — permanently delete */
  delete: (id) =>
    axiosInstance.delete(`/api/files/delete/${id}`),

  /** GET /api/files/share-info/:id — sharing state. Pass { public: 1 } to include publicPermission. */
  getShareInfo: (id, params) =>
    axiosInstance.get(`/api/files/share-info/${id}`, { params }),

  /** POST /api/files/share/:id — share with users &/or set public link */
  share: (id, data) =>
    axiosInstance.post(`/api/files/share/${id}`, data),

  /** PATCH /api/files/revoke-access/:id — revoke permissions */
  revokeAccess: (id, data) =>
    axiosInstance.patch(`/api/files/revoke-access/${id}`, data),

  /** PATCH /api/files/new-token/:id — regenerate public share token */
  newToken: (id, data) =>
    axiosInstance.patch(`/api/files/new-token/${id}`, data),

  /** POST /api/files/copy/:id — virtual copy to target directory. Body: { targetId } */
  copy: (id, targetId) =>
    axiosInstance.post(`/api/files/copy/${id}`, { targetId }),

  /** POST /api/files/bulk-download — download multiple files/dirs as ZIP */
  bulkDownload: async (items) => {
    const res = await axiosInstance.post(
      "/api/files/bulk-download",
      { items },
      { responseType: "blob" },
    );

    const disposition = res.headers["content-disposition"];
    let filename = "download.zip";
    if (disposition) {
      const match = disposition.match(/filename="?(.+?)"?$/);
      if (match) filename = match[1];
    }

    const url = URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
