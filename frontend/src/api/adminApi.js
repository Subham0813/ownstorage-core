import axiosInstance from "./axiosInstance";

/**
 * Admin API — all under /api/admin
 */
export const adminAPI = {
  /** GET /api/admin/dashboard — admin stats */
  getDashboard: () => axiosInstance.get("/api/admin/dashboard"),

  /** GET /api/admin/users — paginated user list */
  getUsers: (params) => axiosInstance.get("/api/admin/users", { params }),

  /** GET /api/admin/user/:id — single user detail */
  getUser: (id) => axiosInstance.get(`/api/admin/user/${id}`),

  /** GET /api/admin/user/:id/storage — user storage stats */
  getUserStorage: (id) => axiosInstance.get(`/api/admin/user/${id}/storage`),

  /** PATCH /api/admin/user/:id/role — Body: { role } */
  changeRole: (id, role) =>
    axiosInstance.patch(`/api/admin/user/${id}/role`, { role }),

  /** PATCH /api/admin/user/:id/logout — force logout */
  logoutUser: (id) => axiosInstance.patch(`/api/admin/user/${id}/logout`),

  /** PATCH /api/admin/user/:id/temp-remove — soft delete */
  removeUser: (id, reason) => axiosInstance.patch(`/api/admin/user/${id}/temp-remove`, { reason }),

  /** PATCH /api/admin/user/:id/recover — recover deleted user */
  recoverUser: (id) => axiosInstance.patch(`/api/admin/user/${id}/recover`),

  /** DELETE /api/admin/user/:id/delete — permanent delete */
  deleteUser: (id) => axiosInstance.delete(`/api/admin/user/${id}/delete`),

  /** GET /api/admin/feedback/:userId — user's feedback submissions */
  getFeedbacks: (userId, params) =>
    axiosInstance.get(`/api/admin/feedback/${userId}`, { params }),

  /** PATCH /api/admin/feedback/:feedbackId — Body: { status?, adminNotes? } */
  updateFeedback: (feedbackId, data) =>
    axiosInstance.patch(`/api/admin/feedback/${feedbackId}`, data),

  /** POST /api/admin/feedback/:feedbackId/reply — Body: { message, status? } */
  replyFeedback: (feedbackId, data) =>
    axiosInstance.post(`/api/admin/feedback/${feedbackId}/reply`, data),

  /** POST /api/admin/user/:id/email — Body: { subject, message } */
  sendEmail: (id, data) =>
    axiosInstance.post(`/api/admin/user/${id}/email`, data),
};
