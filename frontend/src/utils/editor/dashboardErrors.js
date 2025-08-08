// frontend/src/utils/editor/dashboardErrors.js
/**
 * Centralized error handling for the Dashboard/Editor page.
 * Maps backend/frontend error conditions to user-facing toast configurations.
 */

/* -------------------------------------------------------------------------- */
/* Known editor-related codes                                                 */
/* -------------------------------------------------------------------------- */
export const EDITOR_CODES = [
  /* Success / Info */ "SAVE_SUCCESS",
  "TITLE_SAVE_SUCCESS",
  "NO_ISSUES_FOUND",
  "TRANSLATION_COMPLETE",

  /* Client-side validation */
  "EMPTY_TEXT_ERROR",
  "WORD_LIMIT_EXCEEDED",
  "TITLE_WORD_LIMIT_EXCEEDED",
  "TITLE_CHAR_LIMIT_EXCEEDED",

  /* Document load/save */
  "DOC_LOAD_FAILED",
  "DOC_NOT_FOUND",
  "DOC_FORBIDDEN",
  "SAVE_FAILED",
  "SAVE_FAILED_OFFLINE",

  /* AI processing */
  "AI_REQUEST_FAILED",
  "TRANSLATION_FAILED",
  "CORRECTION_FAILED",
  "AI_INVALID_RESPONSE",
  "AI_UNSUPPORTED_LANGUAGE",
  "AI_TEXT_TOO_SHORT",
  "AI_GIBBERISH_DETECTED",
  "AI_INVALID_CHARS",
  "FREE_USER_INSUFFICIENT_CREDITS",
  "PRO_USER_INSUFFICIENT_CREDITS",

  /* Network / server */
  "SESSION_EXPIRED",
  "NETWORK_ERROR",
  "TIMEOUT",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "UNKNOWN_ERROR",
];

/* -------------------------------------------------------------------------- */
/* Message and severity map                                                   */
/* -------------------------------------------------------------------------- */
const MESSAGE_MAP = {
  /* Success / Info */
  NO_ISSUES_FOUND: { message: "No grammar issues found.", severity: "info" },

  /* Client-side validation */
  EMPTY_TEXT_ERROR: {
    message: "Cannot process empty text.",
    severity: "warning",
  },
  WORD_LIMIT_EXCEEDED: {
    message: (ctx) =>
      `Text exceeds word limit of ${ctx?.limit || "the limit"}. Please shorten it.`,
    severity: "error",
  },
  TITLE_WORD_LIMIT_EXCEEDED: {
    message: (ctx) => `Title cannot exceed ${ctx?.limit || 25} words.`,
    severity: "warning",
  },
  TITLE_CHAR_LIMIT_EXCEEDED: {
    message: (ctx) =>
      `A word in the title cannot exceed ${ctx?.limit || 60} characters.`,
    severity: "warning",
  },

  /* Document load/save */
  DOC_LOAD_FAILED: {
    message: "Could not load the document. Please try again.",
    severity: "error",
    persist: true,
  },
  DOC_NOT_FOUND: {
    message: "Document not found. It may have been deleted.",
    severity: "error",
    persist: true,
  },
  DOC_FORBIDDEN: {
    message: "You do not have permission to view this document.",
    severity: "error",
    persist: true,
  },
  SAVE_FAILED: {
    message: "Save failed. Please check your connection and try again.",
    severity: "error",
  },
  SAVE_FAILED_OFFLINE: {
    message: "You are offline. Changes cannot be saved.",
    severity: "warning",
  },

  /* AI processing */
  AI_REQUEST_FAILED: {
    message: "The request failed. Please try again.",
    severity: "error",
  },
  TRANSLATION_FAILED: {
    message: "Translation failed. Please try again.",
    severity: "error",
  },
  CORRECTION_FAILED: {
    message: "Grammar check failed. Please try again.",
    severity: "error",
  },
  AI_INVALID_RESPONSE: {
    message: "The AI service returned an unexpected response.",
    severity: "warning",
  },
  AI_TEXT_TOO_SHORT: {
    message: "Text too short. Please enter more words to process.",
    severity: "info",
  },
  AI_UNSUPPORTED_LANGUAGE: {
    message: "The document language is not supported for processing.",
    severity: "warning",
  },
  AI_GIBBERISH_DETECTED: {
    message: "Processing was skipped because the text appears to be gibberish.",
    severity: "info",
  },
  AI_INVALID_CHARS: {
    message: "Text contains too many unsupported characters for processing.",
    severity: "warning",
  },
  FREE_USER_INSUFFICIENT_CREDITS: {
    message:
      "You're out of credits for the week. Upgrade to Pro to get 50 now, plus more features.",
    severity: "warning",
    actionLabel: "Upgrade to Pro",
    persist: true,
  },
  PRO_USER_INSUFFICIENT_CREDITS: {
    message: "You're out of weekly credits. Credits reset every week.",
    severity: "info",
  },

  /* Network / server */
  SESSION_EXPIRED: {
    message: "Your session has expired. Please sign in again.",
    severity: "error",
    persist: true,
  },
  NETWORK_ERROR: {
    message: "A network error occurred. Please check your connection.",
    severity: "error",
  },
  TIMEOUT: {
    message: "The request timed out. Please try again.",
    severity: "warning",
  },
  RATE_LIMITED: {
    message: "You've made too many requests. Please wait a moment.",
    severity: "warning",
  },
  SERVER_ERROR: {
    message:
      "A server error occurred. We've been notified and are looking into it.",
    severity: "error",
  },
  UNKNOWN_ERROR: {
    message: "An unknown error occurred. Please try again.",
    severity: "error",
  },
};

/* -------------------------------------------------------------------------- */
/* Public: get toast config from code                                         */
/* -------------------------------------------------------------------------- */
/**
 * Return a toast configuration for a given editor error code.
 * @param {string} code - One of EDITOR_CODES.
 * @param {object} [ctx] - Optional context for dynamic messages, e.g., { limit: 100 }.
 * @returns {{code: string, message: string, severity: string, persist?: boolean, actionLabel?: string}}
 */
export function getEditorToast(code, ctx) {
  const entry = MESSAGE_MAP[code] || MESSAGE_MAP.UNKNOWN_ERROR;
  const message =
    typeof entry.message === "function" ? entry.message(ctx) : entry.message;
  return {
    code: code in MESSAGE_MAP ? code : "UNKNOWN_ERROR",
    message,
    severity: entry.severity,
    ...(entry.persist && { persist: entry.persist }),
    ...(entry.actionLabel && { actionLabel: entry.actionLabel }),
  };
}

/* -------------------------------------------------------------------------- */
/* Public: infer code from an Axios/fetch-style error                         */
/* -------------------------------------------------------------------------- */
/**
 * Infer an editor error code from an Axios-like error object.
 * @param {any} err
 * @returns {string}
 */
export function inferEditorErrorCode(err) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "NETWORK_ERROR";
  }
  if (err?.code === "ECONNABORTED" || err.message?.includes("timeout")) {
    return "TIMEOUT";
  }

  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const backendError = (data.error || "").toString();

  if (backendError.includes("exceeds word limit")) return "WORD_LIMIT_EXCEEDED";
  if (backendError.includes("ambiguous or not in English/Spanish"))
    return "AI_UNSUPPORTED_LANGUAGE";
  if (backendError.includes("Gibberish text detected"))
    return "AI_GIBBERISH_DETECTED";
  if (backendError.includes("unsupported characters"))
    return "AI_INVALID_CHARS";

  switch (status) {
    case 400:
      return "AI_REQUEST_FAILED";
    case 401:
      return "SESSION_EXPIRED";
    case 403:
      return "DOC_FORBIDDEN";
    case 404:
      return "DOC_NOT_FOUND";
    case 413:
      return "WORD_LIMIT_EXCEEDED";
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

  if (err?.request && !err?.response) {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN_ERROR";
}

/* -------------------------------------------------------------------------- */
/* Public: convenience wrapper                                                */
/* -------------------------------------------------------------------------- */
/**
 * Convert an error to a toast config, with optional action context.
 * @param {any} error
 * @param {{action?: 'load'|'save_content'|'save_title'|'translate'|'correct'}} [opts]
 * @returns {{code:string, message:string, severity:string, persist?:boolean, actionLabel?: string}}
 */
export function getEditorToastFromError(error, opts = {}) {
  // Prefer a specific backend code if provided
  const specificBackendCode = error?.response?.data?.errorCode;
  if (specificBackendCode) {
    return getEditorToast(specificBackendCode);
  }

  // Client-side Error objects
  if (error instanceof Error && !error.isAxiosError) {
    if (error.message.includes("exceeds word-limit")) {
      const match = error.message.match(/\((\d+)\/\d+\)/);
      const limit = match ? parseInt(match[1], 10) : null;
      return getEditorToast("WORD_LIMIT_EXCEEDED", { limit });
    }
    if (error.message.includes("empty text")) {
      return getEditorToast("EMPTY_TEXT_ERROR");
    }
  }

  // Axios/network
  const code = inferEditorErrorCode(error);

  // Provide more specific UX by action context
  if (code === "UNKNOWN_ERROR" || code === "SERVER_ERROR") {
    if (opts.action === "load") return getEditorToast("DOC_LOAD_FAILED");
    if (opts.action === "save_content" || opts.action === "save_title")
      return getEditorToast("SAVE_FAILED");
    if (opts.action === "translate")
      return getEditorToast("TRANSLATION_FAILED");
    if (opts.action === "correct") return getEditorToast("CORRECTION_FAILED");
  }

  return getEditorToast(code);
}
