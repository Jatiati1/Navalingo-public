//frontend/src/components/UI/Toast/ToastStack.jsx
import React from "react";
import ToastItem from "./ToastItem.jsx";
import styles from "./Toast.module.css";

export default function ToastStack({
  toasts,
  onRemove,
  onPointerEnter,
  onPointerLeave,
}) {
  return (
    <div
      className={styles.toastStack}
      aria-live="polite"
      aria-atomic="false"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onRemove(t.id)} />
      ))}
    </div>
  );
}
