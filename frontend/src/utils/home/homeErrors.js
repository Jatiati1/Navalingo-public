// frontend/src/utils/home/homeErrors.js
/**
 * Home page error utilities.
 * Maps backend/client errors to user-facing toast configurations.
 */

export const HOME_CODES = [
  /* Success / Info */
  "DOCUMENT_TRASHED",
  "DOC_LIMIT_REACHED",

  /* Errors */
  "FETCH_LIST_FAILED",
  "CREATE_FAILED",
  "TRASH_FAILED",
  "SESSION_EXPIRED",
  "UNAUTHORIZED",
  "PHONE_UNVERIFIED",
  "FORBIDDEN",
  "NETWORK_OFFLINE",
  "NETWORK_ERROR",
  "TIMEOUT",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "FIRESTORE_INDEX_REQUIRED",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "UNKNOWN_ERROR",
];

/* Message map (static string or (ctx)=>string) */
const MESSAGE_MAP = {
  /* Success / Info */
  DOCUMENT_TRASHED: { message: "Document moved to Trash.", severity: "info" },
  DOC_LIMIT_REACHED: {
    message: (ctx) =>
      ctx?.isPro
        ? "You've reached the 80-document limit. Please delete old documents to create new ones."
        : "You've reached the 8-document limit for the free plan.",
    severity: "warning",
  },

  /* Errors */
  FETCH_LIST_FAILED: {
    message: "Could not load your documents. Please retry.",
    severity: "error",
  },
  CREATE_FAILED: {
    message: "Failed to create document. Try again.",
    severity: "error",
  },
  TRASH_FAILED: {
    message: "Could not move document to Trash.",
    severity: "error",
  },
  SESSION_EXPIRED: {
    message: "Session expired. Please sign in again.",
    severity: "error",
    persist: true,
  },
  UNAUTHORIZED: {
    message: "You need to sign in to continue.",
    severity: "error",
    persist: true,
  },
  PHONE_UNVERIFIED: {
    message: "Phone verification required for this action.",
    severity: "warning",
  },
  FORBIDDEN: { message: "You are not allowed to do that.", severity: "error" },
  NETWORK_OFFLINE: {
    message: "You are offline. Changes will not sync.",
    severity: "warning",
  },
  NETWORK_ERROR: {
    message: "Network error. Please check your connection.",
    severity: "error",
  },
  TIMEOUT: { message: "Request timed out. Try again.", severity: "warning" },
  RATE_LIMITED: {
    message: "Too many requests. Please slow down.",
    severity: "warning",
  },
  SERVER_ERROR: {
    message: "Server error. Please try again shortly.",
    severity: "error",
  },
  FIRESTORE_INDEX_REQUIRED: {
    message: "Server index building. Please retry in a moment.",
    severity: "info",
  },
  NOT_FOUND: { message: "The document was not found.", severity: "warning" },
  VALIDATION_ERROR: {
    message: "Invalid data sent. Please revise and retry.",
    severity: "warning",
  },
  UNKNOWN_ERROR: {
    message: "Something went wrong. Please try again.",
    severity: "error",
  },
};

/**
 * Return a toast-ready object for a known code.
 * @param {string} code
 * @param {object} [ctx]
 * @returns {{code:string, message:string, severity:string, persist?:boolean}}
 */
export function getHomeToast(code, ctx) {
  const entry = MESSAGE_MAP[code] || MESSAGE_MAP.UNKNOWN_ERROR;
  const message =
    typeof entry.message === "function" ? entry.message(ctx) : entry.message;
  return {
    code: code in MESSAGE_MAP ? code : "UNKNOWN_ERROR",
    message,
    severity: entry.severity,
    ...(entry.persist ? { persist: true } : {}),
  };
}

/**
 * Infer a HOME code from an Axios/fetch-style error.
 * @param {any} err
 * @returns {string}
 */
export function inferHomeErrorCode(err) {
  if (typeof navigator !== "undefined" && !navigator.onLine)
    return "NETWORK_OFFLINE";
  if (err?.code === "ECONNABORTED") return "TIMEOUT";

  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const backendCode = (data.code || "").toString();
  const backendError = (data.error || "").toString();

  if (backendCode === "PHONE_VERIFICATION_REQUIRED") return "PHONE_UNVERIFIED";
  if (backendCode === "DOC_LIMIT_REACHED") return "DOC_LIMIT_REACHED";

  if (
    (backendError &&
      /index/i.test(backendError) &&
      /firestore/i.test(backendError)) ||
    backendCode === "FIRESTORE_INDEX_REQUIRED"
  ) {
    return "FIRESTORE_INDEX_REQUIRED";
  }

  switch (status) {
    case 0:
      return "NETWORK_ERROR";
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return /stale/i.test(backendError) || /session/i.test(backendError)
        ? "SESSION_EXPIRED"
        : "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "VALIDATION_ERROR";
    case 422:
      return "VALIDATION_ERROR";
    case 429:
      return "RATE_LIMITED";
    case 500:
    case 502:
    case 503:
    case 504:
      return "SERVER_ERROR";
    default:
      break;
  }

  if (!status && err?.request && !err?.response) return "NETWORK_ERROR";
  return "UNKNOWN_ERROR";
}

/**
 * High-level convenience: convert Axios error to toast config.
 * @param {any} axiosError
 * @param {{ action?: 'create'|'list'|'trash' }} [opts]
 * @returns {{code:string, message:string, severity:string, persist?:boolean}}
 */
export function getHomeToastFromAxiosError(axiosError, opts = {}) {
  const code = inferHomeErrorCode(axiosError);

  if (code === "FORBIDDEN" && opts.action === "create") {
    const specificCode = inferHomeErrorCode(axiosError);
    return getHomeToast(
      specificCode === "DOC_LIMIT_REACHED"
        ? "DOC_LIMIT_REACHED"
        : "CREATE_FAILED"
    );
  }

  if (code === "UNKNOWN_ERROR" || code === "SERVER_ERROR") {
    if (opts.action === "create") return getHomeToast("CREATE_FAILED");
    if (opts.action === "list") return getHomeToast("FETCH_LIST_FAILED");
    if (opts.action === "trash") return getHomeToast("TRASH_FAILED");
  }

  return getHomeToast(code);
}

/**
 * Optional helper: choose a success toast for a completed action.
 * @param {'trash'} action
 * @param {object} [ctx]
 */
export function getSuccessToastForAction(action, ctx) {
  if (action === "trash") {
    return getHomeToast("DOCUMENT_TRASHED");
  }
  return getHomeToast("UNKNOWN_ERROR");
}
