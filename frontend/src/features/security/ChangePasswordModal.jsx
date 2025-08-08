// frontend/src/components/Features/Security/ChangePasswordModal.jsx
import React, { useState } from "react";
import styles from "./ChangePasswordModal.module.css";
import {
  usePasswordValidation,
  PasswordRequirements,
} from "../../utils/auth/PasswordValidation.jsx";

export default function ChangePasswordModal({ onSubmit, onCancel, loading }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { validation, isPasswordValid } = usePasswordValidation(newPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (!isPasswordValid) {
      setError("Your password does not meet all the security requirements.");
      return;
    }

    onSubmit(newPassword);
  };

  const titleId = "change-password-title";
  const descId = "change-password-desc";
  const errorId = "change-password-error";

  const canSubmit =
    !loading && !!newPassword && !!confirmPassword && isPasswordValid;

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
            Create a new password
          </h2>
          <p id={descId} className={styles.modalDescription}>
            Your new password must meet the requirements below.
          </p>

          <label className={styles.visuallyHidden} htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            placeholder="New Password"
            className={styles.inputField}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoFocus
            required
            autoComplete="new-password"
            aria-invalid={!!error && newPassword !== confirmPassword}
          />

          <label className={styles.visuallyHidden} htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Confirm New Password"
            className={styles.inputField}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            aria-invalid={!!error && newPassword !== confirmPassword}
          />

          <PasswordRequirements validation={validation} />

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
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!canSubmit}
              aria-describedby={error ? errorId : undefined}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
