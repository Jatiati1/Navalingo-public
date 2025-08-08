// frontend/src/components/UI/Toast/ToastItem.jsx
import React, { useEffect, useRef } from "react";
import styles from "./Toast.module.css";

/**
 * Renders a single toast notification.
 * Handles animations, action buttons, sub-messages, and dismissal.
 */
export default function ToastItem({ toast, onDismiss }) {
  const ref = useRef(null);

  // Restart entrance animation if the message changes for the same ID
  useEffect(() => {
    if (ref.current) void ref.current.offsetWidth;
  }, [toast.message]);

  // Map severity to CSS class
  const severityClass =
    {
      info: styles["sev-info"],
      success: styles["sev-success"],
      warning: styles["sev-warning"],
      error: styles["sev-error"],
    }[toast.severity] || styles["sev-info"];

  // Handles click on the toast action button
  const handleActionClick = (e) => {
    e.stopPropagation();
    toast.onAction?.();
    if (toast.dismissOnAction !== false) {
      onDismiss();
    }
  };

  // Handles keyboard interactions (Enter, Escape, Space)
  const handleKey = (e) => {
    if (["Enter", "Escape", " "].includes(e.key)) {
      e.preventDefault();
      onDismiss();
    }
  };

  // ARIA label for screen readers
  const ariaLabel = [toast.message, toast.actionLabel, toast.subMessage]
    .filter(Boolean)
    .join(". ");

  return (
    <div
      ref={ref}
      role="status"
      aria-label={ariaLabel}
      tabIndex={0}
      className={[
        styles.toast,
        severityClass,
        toast._exiting ? styles.toastExit : styles.toastEnter,
      ].join(" ")}
      onClick={onDismiss}
      onKeyDown={handleKey}
    >
      <div className={styles.toastContent}>
        {/* Main message */}
        {toast.message}

        {/* Footer with optional action and sub-message */}
        {(toast.actionLabel || toast.subMessage) && (
          <div className={styles.toastFooter}>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleActionClick}
              >
                {toast.actionLabel}
              </button>
            )}
            <div style={{ flexGrow: 1 }} />
            {toast.subMessage && (
              <div className={styles.toastSubMessage}>{toast.subMessage}</div>
            )}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        className={styles.closeBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        ×
      </button>

      {/* Progress bar for auto-dismiss toasts */}
      {!toast.persist && toast.duration && (
        <div
          className={styles.progress}
          style={{ "--duration": `${toast.duration}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
