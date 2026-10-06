import axiosInstance from "./axiosInstance";

/**
 * Google Drive Import API.
 * Endpoints: /api/import/*
 */
export const importAPI = {
  /** GET /api/import/google/picker-token — get Google Picker OAuth token */
  getPickerToken: () =>
    axiosInstance.get("/api/import/google/picker-token"),

  /** POST /api/import/google/initiate — start a new import session */
  initiate: ({ file, targetId }) =>
    axiosInstance.post("/api/import/google/initiate", { file, targetId }),

  /** PUT /api/import/google/start-import/:id — trigger server-side import */
  startImport: (sessionId) =>
    axiosInstance.put(`/api/import/google/start-import/${sessionId}`),

  /** GET /api/import/google/progress/:id — poll import progress */
  getProgress: (sessionId) =>
    axiosInstance.get(`/api/import/google/progress/${sessionId}`),

  /** PUT /api/import/google/complete/:id — finalize import */
  complete: (sessionId) =>
    axiosInstance.put(`/api/import/google/complete/${sessionId}`),
};
