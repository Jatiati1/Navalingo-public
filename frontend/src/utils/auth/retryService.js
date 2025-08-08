// src/utils/auth/retryService.js

/**
 * Global retry handler registry.
 *
 * Provides a minimal interface for registering a single retry callback
 * (e.g., from AuthContext) and triggering it elsewhere (e.g., from a toast).
 *
 * - registerRetryHandler(handler): store a callback to be invoked on retry.
 * - triggerRetry(): invoke the registered handler if present; otherwise no-op.
 *
 * No console logging or side effects in the public build.
 */

/** @type {null | (() => void)} */
let _retryHandler = null;

/**
 * Register a global retry handler.
 * @param {() => void} handler - Function to execute when retry is triggered.
 */
export function registerRetryHandler(handler) {
  _retryHandler = handler;
}

/**
 * Trigger the registered retry handler, if any. No-op if none is registered.
 */
export function triggerRetry() {
  if (typeof _retryHandler === "function") {
    _retryHandler();
  }
}
