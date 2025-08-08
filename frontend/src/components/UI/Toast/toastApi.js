let _show = null;

/**
 * Internal – called by ToastProvider
 */
export function registerToastApi(fn) {
  _show = fn;
}

/**
 * External – safe global call
 */
export function showGlobalToast(message, opts) {
  if (typeof _show === "function") {
    _show(message, opts);
  } else {
    // Provider not mounted yet; optionally queue
    console.warn("ToastProvider not ready; toast skipped:", message);
  }
}
