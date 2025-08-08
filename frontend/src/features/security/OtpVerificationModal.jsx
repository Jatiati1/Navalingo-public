// frontend/src/components/Features/Security/OtpVerificationModal.jsx
import React, { useState, useEffect } from "react";
import styles from "./OtpVerificationModal.module.css";
import { useAuth } from "../../context/AuthContext";

const mask = (num = "") =>
  num
    ? num.replace(
        /^(\+\d{2})(\d+)(\d{2})$/,
        (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`
      )
    : "";

const INITIAL_RESEND_COOLDOWN = 30;
const MAX_RESEND_ATTEMPTS = 3;

export default function OtpVerificationModal({
  onSuccess,
  onCancel,
  loading,
  phoneNumber,
  isChangingPhoneNumber = false,
  onResend,
}) {
  const { currentUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // Start at 1 attempt because the first code was already sent
  const [resendCooldown, setResendCooldown] = useState(INITIAL_RESEND_COOLDOWN);
  const [resendAttempts, setResendAttempts] = useState(1);

  const numberToDisplay = phoneNumber || currentUser?.phoneNumber;

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleResendCode = () => {
    if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
      setError("Maximum resend attempts reached.");
      return;
    }
    const nextAttempts = resendAttempts + 1;
    setResendAttempts(nextAttempts);
    setResendCooldown(INITIAL_RESEND_COOLDOWN * Math.pow(2, nextAttempts - 1));
    onResend?.();
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError("");
    onSuccess(otp);
  };

  // Keep input numeric and max 6 chars
  const onOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    if (error) setError("");
  };

  const titleId = "otp-verify-title";
  const descId = "otp-verify-desc";
  const inputId = "otp-verify-input";
  const errorId = "otp-verify-error";

  const titleText = isChangingPhoneNumber
    ? "Verify New Phone Number"
    : "Confirm Your Identity";
  const instructionText = `For your security, enter the 6-digit code we sent to`;

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
          {titleText}
        </h2>
        <p id={descId} className={styles.instructions}>
          {instructionText} <strong>{mask(numberToDisplay)}</strong>.
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

        <form onSubmit={handleVerifyCode} noValidate>
          <label htmlFor={inputId} className={styles.visuallyHidden}>
            6-digit verification code
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            className={styles.codeInput}
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={onOtpChange}
            disabled={loading}
            autoComplete="one-time-code"
            autoFocus
            aria-invalid={!!error || (otp.length > 0 && otp.length !== 6)}
            aria-describedby={error ? errorId : undefined}
          />

          <div className={styles.resendContainer}>
            {resendAttempts >= MAX_RESEND_ATTEMPTS ? (
              <p className={styles.resendTextDisabled}>
                Maximum resend attempts reached.
              </p>
            ) : resendCooldown > 0 ? (
              <p className={styles.resendText}>
                You can resend the code in {resendCooldown}s
              </p>
            ) : (
              <button
                type="button"
                className={styles.resendButton}
                onClick={handleResendCode}
                disabled={loading}
              >
                Resend code
              </button>
            )}
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
              disabled={loading || otp.length < 6}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
