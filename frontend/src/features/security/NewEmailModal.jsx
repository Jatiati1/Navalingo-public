// frontend/src/components/Features/Security/NewEmailModal.jsx
import React, { useState } from "react";
import styles from "./NewEmailModal.module.css";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function NewEmailModal({ onSubmit, onCancel, loading }) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  const titleId = "new-email-title";
  const descId = "new-email-desc";
  const inputId = "new-email-input";
  const errorId = "new-email-error";

  const valid = isValidEmail(newEmail);
  const canSubmit = !loading && valid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onSubmit(newEmail);
  };

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <form onSubmit={handleSubmit} noValidate>
          <h2 id={titleId} className={styles.modalTitle}>
            Change your email address
          </h2>
          <p id={descId} className={styles.modalDescription}>
            Enter the new email address you would like to associate with your
            account.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor={inputId} className={styles.label}>
              New Email Address
            </label>
            <input
              id={inputId}
              type="email"
              className={styles.inputField}
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              required
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              aria-invalid={!!error || (!!newEmail && !valid)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          {error && (
            <p
              id={errorId}
              className={styles.errorMessage}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={!canSubmit}
            >
              {loading ? "Continuing..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
