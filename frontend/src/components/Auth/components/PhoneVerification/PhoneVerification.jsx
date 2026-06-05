// frontend/src/components/Auth/components/PhoneVerification/PhoneVerification.jsx

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  linkWithCredential,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { auth } from "../../../../firebaseConfig";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../api/axios"; // <--- ADDED SECURE API IMPORT
import { translateAuthError } from "../../../../utils/auth/authErrors";
import styles from "./PhoneVerification.module.css";
import EnterPhoneNumber from "./EnterPhoneNumber";
import EnterOtpCode from "./EnterOtpCode";

/** SMS OTP verification flow with an invisible reCAPTCHA. */
export default function PhoneVerification() {
  const [verificationId, setVerificationId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifier, setVerifier] = useState(null);
  const [error, setError] = useState("");
  const [autoSending, setAutoSending] = useState(false);

  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const v = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    setVerifier(v);
    return () => v.clear();
  }, []);

  useEffect(() => {
    if (
      verifier &&
      !verificationId &&
      currentUser?.phoneNumber &&
      !autoSending
    ) {
      const sendAutoSms = async () => {
        setAutoSending(true);
        setError("");
        try {
          const provider = new PhoneAuthProvider(auth);
          const newVerificationId = await provider.verifyPhoneNumber(
            currentUser.phoneNumber,
            verifier,
          );

          setPhoneNumber(currentUser.phoneNumber);
          setVerificationId(newVerificationId);
        } catch (err) {
          setError(
            translateAuthError(err?.code) ||
              "Failed to send automatic verification code. Please enter your number manually.",
          );
        } finally {
          setAutoSending(false);
        }
      };

      sendAutoSms();
    }
  }, [verifier, verificationId, currentUser, autoSending]);

  const handleCodeSent = useCallback((newId, fullPhone) => {
    setError("");
    setVerificationId(newId);
    setPhoneNumber(fullPhone);
  }, []);

  // THE FIX: Use the secure backend linking route
  const handleVerificationSuccess = useCallback(
    async (phoneCredential) => {
      setError("");
      try {
        // 1. Link the credential to the Firebase Auth session
        await linkWithCredential(auth.currentUser, phoneCredential);

        // 2. Force Firebase to generate a fresh token that includes the new phone number
        const idToken = await auth.currentUser.getIdToken(true);

        // 3. Send that secure token to your dedicated phone linking route
        await api.post("/user/phone/link", { idToken });

        // 4. Update the local React state to unlock the dashboard
        updateUser({ phoneVerified: true, phoneNumber });
        navigate("/home", { replace: true });
      } catch (e) {
        setError(translateAuthError(e.code) || "An unexpected error occurred.");
      }
    },
    [navigate, phoneNumber, updateUser],
  );

  return (
    <div className={styles.verificationPage}>
      <div id="recaptcha-container" />
      <div className={styles.verificationContainer}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        {autoSending && !verificationId ? (
          <div className={styles.loadingMessage}>
            Sending verification code to your phone number...
          </div>
        ) : !verificationId ? (
          <EnterPhoneNumber
            onCodeSent={handleCodeSent}
            verifier={verifier}
            setError={setError}
          />
        ) : (
          <EnterOtpCode
            verificationId={verificationId}
            phoneNumber={phoneNumber}
            onSuccess={handleVerificationSuccess}
            title="Verify Your Number"
            verifier={verifier}
          />
        )}
      </div>
    </div>
  );
}
