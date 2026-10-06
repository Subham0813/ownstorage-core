import axiosInstance from "./axiosInstance";

/**
 * Upload API — multipart S3 upload lifecycle.
 * Endpoints: /api/uploads/*
 */
export const uploadsAPI = {
  /** POST /api/uploads/initiate — get presigned URLs for all parts */
  initiate: ({ file, targetId }) =>
    axiosInstance.post("/api/uploads/initiate", { file, targetId }),

  /** PUT /api/uploads/complete/:uploadId — finalize upload with ETags and optional thumbnail */
  complete: (uploadId, { parts, thumbnailBase64 }) =>
    axiosInstance.put(`/api/uploads/complete/${uploadId}`, { parts, thumbnailBase64 }),

  /** POST /api/uploads/retry/:uploadId — refresh presigned URLs for an existing session */
  retry: (uploadId) =>
    axiosInstance.post(`/api/uploads/retry/${uploadId}`),

  /** DELETE /api/uploads/cancel/:uploadId — abort multipart upload */
  cancel: (uploadId) =>
    axiosInstance.delete(`/api/uploads/cancel/${uploadId}`),
};
