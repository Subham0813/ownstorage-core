import axios from "axios";
import { CACHE_DURATION_MS, HTTP_ERROR_MESSAGES } from "../utils/constants";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let globalShowMessage = null;

export const setGlobalShowMessage = (showMessageFn) => {
  globalShowMessage = showMessageFn;
};

const getErrorMessage = (error) => {
  if (!error.response) return HTTP_ERROR_MESSAGES.network;
  const status = error.response.status;
  const serverMessage = error.response.data?.message;
  return (
    serverMessage ||
    HTTP_ERROR_MESSAGES[status] ||
    "An unexpected error occurred."
  );
};

const requestCache = new Map();

const NO_CACHE_PATTERNS = [
  /\/progress\//,
  /\/download\//,
  /\/usage/,
  /\/stats/,
  /\/sessions/,
  /\/profile/,
  /\/share-info\//,
];

const getCacheKey = (config) => {
  if (config.method !== "get") return null;
  if (NO_CACHE_PATTERNS.some((p) => p.test(config.url))) return null;
  const paramStr = config.params
    ? "&" + new URLSearchParams(config.params).toString()
    : "";
  return `${config.method}:${config.url}${paramStr}`;
};

const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_DURATION_MS;

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

axiosInstance.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrf");
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    const cacheKey = getCacheKey(config);
    if (cacheKey && requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey);
      if (isCacheValid(cached.timestamp)) {
        config.adapter = () => Promise.resolve(cached.response);
      } else {
        requestCache.delete(cacheKey);
      }
    }

    // Add dummy query param to defeat browser HTTP cache
    if (config.method?.toLowerCase() === "get") {
      config.params = { ...config.params, _t: Date.now() };
    }
    
    // Store original cache key so the response interceptor doesn't use the _t modified config
    config._cacheKey = cacheKey;

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    const cacheKey = response.config._cacheKey || getCacheKey(response.config);
    if (cacheKey) {
      requestCache.set(cacheKey, { response, timestamp: Date.now() });
    }
    if (response.config.method !== 'get') {
      requestCache.clear();
      window.dispatchEvent(new CustomEvent('vd:refresh'));
      window.dispatchEvent(new CustomEvent('vd:usage-changed'));
    } else if (/\/download\//.test(response.config.url) || /\/preview\//.test(response.config.url)) {
      window.dispatchEvent(new CustomEvent('vd:usage-changed'));
    }
    return response;
  },
  (error) => {
    const errorMessage = getErrorMessage(error);

    if (!error.response) {
      console.error("Network error:", error);
      if (globalShowMessage) {
        globalShowMessage("error", errorMessage);
      }
      return Promise.reject(new Error(errorMessage));
    }

    const status = error.response.status;
    const isLogoutEndpoint = error.config?.url?.includes("/logout");
    // Public endpoints have no session — a 401 there must not kill the session
    const isPublicApiCall = /^\/(api\/(auth|public\/shared|health))\b/.test(
      error.config?.url ?? "",
    );
    // Public share pages have no session — don't redirect guests to /signin
    const isPublicSharePage = /^\/(share|file|folders|s)\//.test(
      window.location.pathname,
    );
    // Already on an auth page — a 401 here (e.g. the OAuth 2FA profile prefill,
    // which legitimately has no session cookie yet) must not bounce us into a
    // window.location.href="/signin" self-reload loop.
    const isAuthPage = ["/signin", "/register"].includes(
      window.location.pathname,
    );

    if (status === 401 && !isLogoutEndpoint && !isPublicApiCall && !isPublicSharePage && !isAuthPage && !window.location.pathname.startsWith("/auth/callback")) {
      localStorage.removeItem("userdata");
      if (globalShowMessage) globalShowMessage("error", errorMessage);
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1500);
    } else if (status === 410) {
      if (globalShowMessage) globalShowMessage("error", errorMessage);
    } else if (status >= 500) {
      console.error("Server error:", error);
      if (globalShowMessage) globalShowMessage("error", errorMessage);
    } else if (status === 429) {
      if (globalShowMessage) globalShowMessage("error", errorMessage);
    }

    error.message = errorMessage;
    return Promise.reject(error);
  },
);

export default axiosInstance;
