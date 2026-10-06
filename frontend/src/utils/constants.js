/**
 * Application-wide constants.
 * Import from here instead of defining inline across components.
 */

// ── Navigation ────────────────────────────────────────────────────────────────

/** Human-readable labels for each tab root */
export const TAB_ROOT_LABELS = {
  home: "Home",
  myfiles: "My Files",
  shared: "Shared",
  bin: "Bin",
};

/** Sidebar navigation items */
export const NAV_ITEMS = [
  { key: "home", label: "Home",      icon: "home",   path: "/home" },
  { key: "myfiles",     label: "My Files",   icon: "folder", path: "/myfiles" },
  { key: "shared",    label: "Shared",     icon: "share",  path: "/shared" },
  { key: "bin",       label: "Bin",        icon: "trash",  path: "/bin" },
];

// ── Upload ────────────────────────────────────────────────────────────────────

/** Google Drive import poll interval in ms */
export const GDRIVE_POLL_INTERVAL_MS = 1000;

// ── API / Cache ───────────────────────────────────────────────────────────────

/** Axios GET response cache duration in ms (5 minutes) */
export const CACHE_DURATION_MS = 5 * 60 * 1000;

/** HTTP error messages keyed by status code */
export const HTTP_ERROR_MESSAGES = {
  400: "Invalid request. Please check your input.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "The requested resource was not found.",
  409: "This action conflicts with an existing resource.",
  410: "This session has expired. Please start over.",
  413: "Too many active sessions. Please log out from another device.",
  429: "Too many requests. Please slow down and try again.",
  500: "Something went wrong on our end. Please try again.",
  502: "Server is temporarily unavailable. Please try again shortly.",
  503: "Service is currently unavailable. Please try again later.",
  504: "Request timed out. Please check your connection and retry.",
  network: "Unable to reach the server. Please check your internet connection.",
};
