// frontend/src/components/Auth/components/PasswordRecovery/PasswordRecovery.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PasswordRecovery.module.css";
import api from "../../../../api/axios";

// Firebase (phone OTP)
import { PhoneAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { auth } from "../../../../firebaseConfig";

// Phone input
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// Password validation (shared)
import {
  usePasswordValidation,
  PasswordRequirements,
} from "../../../../utils/auth/PasswordValidation.jsx";

// Reusable OTP step
import EnterOtpCode from "../PhoneVerification/EnterOtpCode";

/**
 * PasswordRecovery
 * Phone-OTP–based password reset flow.
 *
 * Steps:
 *  1) Validate phone with backend, then send OTP via Firebase (invisible reCAPTCHA).
 *  2) Verify OTP.
 *  3) Set new password (client-side requirements enforced).
 */
export default function PasswordRecovery() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState("enter_phone"); // 'enter_phone' | 'enter_otp' | 'set_password' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { validation, isPasswordValid } = usePasswordValidation(newPassword);

  const [recoveryVerifier, setRecoveryVerifier] = useState(null);

  // Initialize invisible reCAPTCHA (scoped to this flow)
  useEffect(() => {
    if (!auth || typeof window === "undefined") return;

    const verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container-recovery",
      {
        size: "invisible",
      }
    );
    setRecoveryVerifier(verifier);

    return () => {
      try {
        verifier.clear();
      } catch {
        /* no-op */
      }
    };
  }, []);

  // Step 1: Validate phone with backend, then send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!recoveryVerifier) {
      setError("Security features are initializing. Please wait a moment.");
      return;
    }

    setLoading(true);
    try {
      // Validate that the phone is eligible for password reset.
      await api.post("/auth/validate-phone", { phoneNumber });

      // Send OTP via Firebase
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recoveryVerifier
      );
      setVerificationId(id);
      setCurrentStep("enter_otp");
    } catch (err) {
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP verified → proceed to new password
  const handleRecoveryOtpSuccess = (otpCode) => {
    setOtp(otpCode);
    setCurrentStep("set_password");
  };

  // Step 3: Submit new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password does not meet the security requirements.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        phoneNumber,
        otp,
        newPassword,
      });
      setCurrentStep("success");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => navigate("/auth");

  const renderStep = () => {
    switch (currentStep) {
      case "enter_phone":
        return (
          <form onSubmit={handleSendOtp}>
            <h1 className={styles.title}>Forgot Password</h1>
            <p className={styles.instructions}>
              Enter your registered phone number to receive a verification code.
            </p>
            <PhoneInput
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              defaultCountry="US"
              className={styles.phoneInput}
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !phoneNumber}
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
            <div className={styles.supportLink}>
              Can’t access your phone? Email{" "}
              <a href="mailto:hello@navalingo.com">hello@navalingo.com</a> for
              support.
            </div>
          </form>
        );

      case "enter_otp":
        return (
          <EnterOtpCode
            verificationId={verificationId}
            phoneNumber={phoneNumber}
            onSuccess={handleRecoveryOtpSuccess}
            title="Enter Recovery Code"
            verifier={recoveryVerifier}
          />
        );

      case "set_password":
        return (
          <form onSubmit={handleResetPassword}>
            <h1 className={styles.title}>Set New Password</h1>
            <p className={styles.instructions}>
              Create a new, strong password for your account.
            </p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.inputField}
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.inputField}
              required
            />
            <PasswordRequirements validation={validation} />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={
                loading || !newPassword || !confirmPassword || !isPasswordValid
              }
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        );

      case "success":
        return (
          <div>
            <h1 className={styles.title}>Password Reset</h1>
            <p className={styles.instructions}>
              Your password has been successfully updated. You can now log in
              with your new password.
            </p>
            <button onClick={handleDone} className={styles.submitButton}>
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div id="recaptcha-container-recovery" />
        {error && <p className={styles.errorMessage}>{error}</p>}
        {renderStep()}
      </div>
    </div>
  );
}
