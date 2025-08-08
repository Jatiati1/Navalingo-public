// frontend/src/components/Features/Security/ConfirmEmailModal.jsx
import React from "react";
import styles from "./ConfirmEmailModal.module.css";

export default function ConfirmEmailModal({
  email,
  onConfirm,
  onCancel, // kept for compatibility (unused here)
  onGoBack,
  loading,
}) {
  const titleId = "confirm-email-title";
  const descId = "confirm-email-desc";

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <h2 id={titleId} className={styles.modalTitle}>
          Confirm New Email
        </h2>
        <p id={descId} className={styles.modalDescription}>
          Please confirm you want to change your account’s email to the address
          below.
        </p>

        <div className={styles.emailDisplay}>{email}</div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onGoBack}
            disabled={loading}
          >
            Go Back
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.confirmButton}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Updating..." : "Confirm & Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
