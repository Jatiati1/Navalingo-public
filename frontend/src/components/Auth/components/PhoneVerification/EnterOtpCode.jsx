// frontend/src/components/Auth/components/PhoneVerification/EnterOtpCode.jsx
/**
 * Lightweight OTP entry component for phone verification.
 * - Verifies a 6-digit code against a Firebase `verificationId`.
 * - Supports resending codes with an exponential cooldown.
 * - All messages are user-facing; no console logging.
 */

import React, { useState, useEffect, useCallback } from "react";
import { PhoneAuthProvider } from "firebase/auth";
import { auth } from "../../../../firebaseConfig";
import { translateAuthError } from "../../../../utils/auth/authErrors";
import styles from "./PhoneVerification.module.css";

const mask = (num = "") =>
  num.replace(
    /^(\+\d{2})(\d+)(\d{2})$/,
    (_, a, b, c) => `${a}${"*".repeat(b.length)}${c}`
  );

const INITIAL_RESEND_COOLDOWN = 30; // seconds
const MAX_RESEND_ATTEMPTS = 3;

export default function EnterOtpCode({
  verificationId,
  phoneNumber,
  onSuccess,
  title = "Enter Your Code",
  verifier, // Invisible reCAPTCHA verifier from parent
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setCooldown] = useState(INITIAL_RESEND_COOLDOWN);
  const [resendAttempts, setAttempts] = useState(1);

  // Tick down the resend cooldown every second
  useEffect(() => {
    const id = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleResendCode = useCallback(async () => {
    if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
      setError(
        "You have reached the maximum number of resend attempts. Please try again later."
      );
      return;
    }
    if (!verifier) {
      setError("Security verifier is not ready. Please try again.");
      return;
    }

    setLoading(true);
    setError("");
    setOtp("");

    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      await phoneProvider.verifyPhoneNumber(phoneNumber, verifier);

      const nextAttempts = resendAttempts + 1;
      setAttempts(nextAttempts);
      const nextCooldown =
        INITIAL_RESEND_COOLDOWN * Math.pow(2, nextAttempts - 1);
      setCooldown(nextCooldown);
    } catch (e) {
      setError(
        translateAuthError(e.code) || "Could not resend code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, resendAttempts, verifier]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const phoneCredential = PhoneAuthProvider.credential(verificationId, otp);
      onSuccess(phoneCredential);
    } catch (e) {
      setError(
        translateAuthError(e.code) || "The code you entered is incorrect."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.instructions}>
        A 6-digit code was sent to {mask(phoneNumber)}
      </p>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleVerifyCode}>
        <input
          type="text"
          className={styles.codeInput}
          placeholder="123456"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={loading}
          autoComplete="one-time-code"
          inputMode="numeric"
        />

        <button
          type="submit"
          className={styles.actionButton}
          disabled={loading || otp.length < 6}
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>

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
      </form>
    </>
  );
}
