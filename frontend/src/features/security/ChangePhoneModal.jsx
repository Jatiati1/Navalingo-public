// frontend/src/components/features/Security/ChangePhoneModal.jsx
import React, { useState } from "react";
import PhoneInput, { isPossiblePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import styles from "./ChangePhoneModal.module.css";

export default function ChangePhoneModal({ onSubmit, onCancel, loading }) {
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const titleId = "change-phone-title";
  const descId = "change-phone-desc";
  const inputId = "change-phone-input";
  const errorId = "change-phone-error";

  const validNumber = newPhoneNumber && isPossiblePhoneNumber(newPhoneNumber);
  const canSubmit = !loading && !!validNumber;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validNumber) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError("");
    onSubmit(newPhoneNumber);
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
        <h2 id={titleId} className={styles.title}>
          Change Phone Number
        </h2>
        <p id={descId} className={styles.instructions}>
          A verification code will be sent to this new number to confirm
          ownership.
        </p>

        {error && (
          <div
            id={errorId}
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor={inputId} className={styles.visuallyHidden}>
            New phone number
          </label>
          <div className={styles.phoneInputContainer}>
            <PhoneInput
              id={inputId}
              defaultCountry="US"
              placeholder="Enter new phone number"
              value={newPhoneNumber}
              onChange={setNewPhoneNumber}
              className="phone-input-custom" /* global base styling if you have it */
              disabled={loading}
              autoFocus
              aria-invalid={!!error || (!!newPhoneNumber && !validNumber)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

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
              className={styles.actionButton}
              disabled={!canSubmit}
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
