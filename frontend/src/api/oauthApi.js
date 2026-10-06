import axiosInstance from "./axiosInstance";

/**
 * OAuth routes — /api/oauth
 * Docs: oauthRouteRequestResponse.md
 *
 * All connect endpoints are browser redirects (window.location.href),
 * NOT axios calls — they use 302 redirects to the provider.
 */
const redirectWithOrigin = (url) => {
  sessionStorage.setItem("oauthOrigin", window.location.pathname);
  window.location.href = url;
};

export const oauthAPI = {
  /** Redirect browser to Google OAuth (login / register / link) */
  googleConnect: () => {
    redirectWithOrigin(`${axiosInstance.defaults.baseURL}/api/oauth/google/connect`);
  },

  /** Redirect browser to GitHub OAuth (login / register / link) */
  githubConnect: () => {
    redirectWithOrigin(`${axiosInstance.defaults.baseURL}/api/oauth/github/connect`);
  },

  /**
   * Redirect browser to Google Drive OAuth (connect integration).
   * Requires user to already be logged in (sessionId cookie).
   */
  googleDriveConnect: () => {
    redirectWithOrigin(`${axiosInstance.defaults.baseURL}/api/oauth/google-drive/connect`);
  },

  /**
   * Disconnect Google Drive integration.
   * Uses DELETE /api/user/revoke-drive-integration (user route, not oauth).
   * Imported from homeAPI to keep concerns separate — call homeAPI.revokeDriveIntegration() instead.
   *
   * NOTE: /api/oauth/google-drive/disconnect does NOT exist in the backend.
   * Use homeAPI.revokeDriveIntegration() for this.
   */
};
