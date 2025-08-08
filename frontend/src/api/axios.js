// src/api/axios.js
// Axios instance with optional bearer mirror and CSRF handling.
// - Base URL comes from VITE_API_URL or defaults to "/api".
// - If VITE_USE_BEARER=true, a bearer token is stored and sent alongside cookies.
// - On 403, a fresh CSRF token is fetched once and the request is retried.

import axios from "axios";

const USE_BEARER = (import.meta.env.VITE_USE_BEARER ?? "false") === "true";

function resolveBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  return envUrl || "/api";
}
const BASE_URL = resolveBaseURL();

// Optional bearer token (alongside httpOnly cookie on same origin)
let sessionToken = null;

export function setSessionToken(token) {
  if (!USE_BEARER) {
    sessionToken = null;
    return;
  }
  sessionToken = token || null;
  if (token) {
    localStorage.setItem("session_token", token);
  } else {
    localStorage.removeItem("session_token");
  }
}

// Restore persisted token on load when bearer mode is enabled
if (USE_BEARER) {
  const initial = localStorage.getItem("session_token");
  if (initial) sessionToken = initial;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 45_000,
  headers: { "Content-Type": "application/json" },
});

// CSRF cache and shared in-flight fetch
let csrfToken = null;
let csrfFetchPromise = null;

export async function fetchCsrfToken() {
  if (csrfToken) return csrfToken;
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = api
    .get("/auth/csrf-token")
    .then(({ data }) => {
      csrfToken = data?.csrfToken ?? null;
      return csrfToken;
    })
    .finally(() => {
      csrfFetchPromise = null;
    });

  return csrfFetchPromise;
}

// Attach bearer (optional) and CSRF header for mutating requests
api.interceptors.request.use(
  (config) => {
    const method = (config.method || "get").toLowerCase();
    const needsCsrf = ["post", "put", "patch", "delete"].includes(method);

    if (USE_BEARER && sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    if (needsCsrf && csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 403, fetch CSRF once and retry
let csrfRetryInFlight = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error?.config;
    const status = error?.response?.status;

    if (cfg && status === 403 && !csrfRetryInFlight) {
      csrfRetryInFlight = true;
      try {
        await fetchCsrfToken();
        cfg.headers = { ...(cfg.headers || {}), "X-CSRF-Token": csrfToken };
        return await api.request(cfg);
      } finally {
        csrfRetryInFlight = false;
      }
    }

    return Promise.reject(error);
  }
);

// Absolute API base (useful for sendBeacon or other non-Axios calls)
export function getApiBasePath() {
  try {
    const u = new URL(api.defaults.baseURL, window.location.origin);
    const path = u.pathname.endsWith("/")
      ? u.pathname.slice(0, -1)
      : u.pathname;
    return `${u.origin}${path}`;
  } catch {
    return "/api";
  }
}

export default api;
