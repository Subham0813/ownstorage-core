import axiosInstance from "./axiosInstance";

export const authAPI = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} data
   */
  register: (data) =>
    axiosInstance.post("/api/auth/register", data),

  /**
   * Login with email and password
   * @param {{ email: string, password: string }} data
   */
  login: (data) =>
    axiosInstance.post("/api/auth/login", data),

  /**
   * Request an OTP
   * @param {{ email: string, purpose: "login" | "register" | "forgot-password" }} data
   */
  requestOTP: (data) =>
    axiosInstance.post("/api/auth/request-otp", data),

  /**
   * Verify an OTP
   * @param {{ email: string, otp: string, purpose: string, logoutLastSession?: boolean }} data
   */
  verifyOTP: (data) =>
    axiosInstance.post("/api/auth/verify-otp", data),

  /**
   * Initiate forgot-password flow (sends OTP/reset link)
   * @param {{ email: string }} data
   */
  forgotPasswordInit: (data) =>
    axiosInstance.post("/api/auth/forgot-password-init", data),

  /**
   * Complete forgot-password flow with new password
   * @param {{ newPassword: string }} data
   */
  forgotPassword: (data) =>
    axiosInstance.post("/api/auth/forgot-password", data),

  /**
   * Generate 2FA setup (QR code + manual secret)
   */
  generate2FA: () => axiosInstance.get("/api/auth/2fa/generate"),

  /**
   * Enable 2FA with verified TOTP code
   * @param {{ token: string }} data
   */
  enable2FA: (data) => axiosInstance.post("/api/auth/2fa/enable", data),

  /**
   * Verify TOTP during 2FA login flow
   * @param {{ token: string, logoutLastSession?: boolean }} data
   */
  verifyTotp: (data) =>
    axiosInstance.post("/api/auth/verify-totp", data),

  /**
   * Disable 2FA with verified TOTP code
   * @param {{ token: string }} data
   */
  disable2FA: (data) => axiosInstance.post("/api/auth/2fa/disable", data),

  /**
   * Complete an OAuth login paused for 2FA / session limit
   * @param {{ logoutLastSession?: boolean }} data
   */
  completeOauthLogin: (data) =>
    axiosInstance.post("/api/auth/complete-oauth", data),
};
