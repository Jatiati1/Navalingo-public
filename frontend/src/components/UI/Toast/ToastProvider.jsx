// frontend/src/components/UI/Toast/ToastProvider.jsx
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import ToastStack from "./ToastStack.jsx";
import { registerToastApi } from "./toastApi.js";
import { useNetworkStatus } from "../../../hooks/useNetworkStatus";
import { triggerRetry } from "../../../utils/auth/retryService";

const ToastContext = createContext(null);

/**
 * Hook to access the toast API.
 * Must be used inside <ToastProvider />.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}

/**
 * Provides global toast notifications.
 * Handles creation, removal, timers, deduplication, persistence, and network status.
 */
export function ToastProvider({
  children,
  defaultDuration = 4500,
  maxToasts = 5,
}) {
  const [toasts, setToasts] = useState([]);

  // Tracking timers and timing metadata for pause/resume
  const timersRef = useRef(new Map());
  const startedAtRef = useRef(new Map());
  const remainingRef = useRef(new Map());

  // Network-aware toasts
  const isOnline = useNetworkStatus();
  const isOfflineToastVisible = useRef(false);

  /** Immediately removes a toast and clears its timer */
  const reallyRemove = useCallback((id) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    startedAtRef.current.delete(id);
    remainingRef.current.delete(id);
  }, []);

  /** Marks a toast as exiting, then removes it after animation delay */
  const removeToast = useCallback(
    (id) => {
      setToasts((curr) =>
        curr.map((t) => (t.id === id ? { ...t, _exiting: true } : t))
      );
      setTimeout(() => reallyRemove(id), 170);
    },
    [reallyRemove]
  );

  /** Starts auto-dismiss timer for a toast if applicable */
  const scheduleTimer = useCallback(
    (toast) => {
      if (toast.persist || toast.duration == null) return;
      startedAtRef.current.set(toast.id, Date.now());
      remainingRef.current.set(toast.id, toast.duration);
      const timer = setTimeout(() => removeToast(toast.id), toast.duration);
      timersRef.current.set(toast.id, timer);
    },
    [removeToast]
  );

  /**
   * Displays a toast.
   * Supports severity, persistence, deduplication, actions, and sub-messages.
   */
  const showToast = useCallback(
    (message, opts = {}) => {
      const {
        severity = "info",
        duration = defaultDuration,
        persist = false,
        id: forcedId,
        actionLabel,
        onAction,
        dedupeKey,
        dismissOnAction,
        subMessage,
      } = opts;

      const id =
        forcedId ||
        crypto?.randomUUID?.() ||
        String(Date.now() + Math.random());
      const isPersistent = persist || duration === null;

      const toast = {
        id,
        message,
        severity,
        persist: isPersistent,
        duration: isPersistent ? null : duration,
        actionLabel,
        onAction,
        dedupeKey,
        dismissOnAction,
        subMessage,
      };

      setToasts((curr) => {
        const filtered = dedupeKey
          ? curr.filter((t) => t.dedupeKey !== dedupeKey)
          : curr;
        return [toast, ...filtered].slice(0, maxToasts);
      });

      scheduleTimer(toast);
      return id;
    },
    [defaultDuration, maxToasts, scheduleTimer]
  );

  /** Pauses all active toast timers (e.g., on hover) */
  const pauseAll = useCallback(() => {
    timersRef.current.forEach((timer, id) => {
      clearTimeout(timer);
      const started = startedAtRef.current.get(id);
      const dur = remainingRef.current.get(id);
      if (started != null && dur != null) {
        const elapsed = Date.now() - started;
        remainingRef.current.set(id, Math.max(dur - elapsed, 0));
      }
    });
    timersRef.current.clear();
  }, []);

  /** Resumes timers from remaining time */
  const resumeAll = useCallback(() => {
    remainingRef.current.forEach((remain, id) => {
      if (remain <= 0) {
        removeToast(id);
        return;
      }
      startedAtRef.current.set(id, Date.now());
      const timer = setTimeout(() => removeToast(id), remain);
      timersRef.current.set(id, timer);
    });
  }, [removeToast]);

  /** Monitors network status and shows/hides offline/online toasts */
  useEffect(() => {
    const OFFLINE_TOAST_KEY = "network-status";

    if (!isOnline) {
      if (!isOfflineToastVisible.current) {
        showToast("You are offline. Connection lost.", {
          severity: "warning",
          persist: true,
          dedupeKey: OFFLINE_TOAST_KEY,
          actionLabel: "Retry",
          onAction: triggerRetry,
          dismissOnAction: false,
        });
        isOfflineToastVisible.current = true;
      }
    } else {
      if (isOfflineToastVisible.current) {
        setToasts((current) =>
          current.filter((t) => t.dedupeKey !== OFFLINE_TOAST_KEY)
        );
        showToast("You are back online!", {
          severity: "success",
          duration: 3000,
        });
        isOfflineToastVisible.current = false;
      }
    }
  }, [isOnline, showToast, setToasts]);

  /** Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  /** Registers global toast API for external calls */
  useEffect(() => {
    registerToastApi(showToast);
  }, [showToast]);

  const api = { showToast, removeToast };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack
        toasts={toasts}
        onRemove={removeToast}
        onPointerEnter={pauseAll}
        onPointerLeave={resumeAll}
      />
    </ToastContext.Provider>
  );
}
