import axiosInstance from "./axiosInstance";

/**
 * Search API — under /api/user/search
 */
export const searchAPI = {
  /** GET /api/user/search/files?q=&limit=&cursor= */
  files: (params) =>
    axiosInstance.get("/api/user/search/files", { params }),
  /** GET /api/user/search/dirs?q=&limit=&cursor= */
  dirs: (params) =>
    axiosInstance.get("/api/user/search/dirs", { params }),
};
