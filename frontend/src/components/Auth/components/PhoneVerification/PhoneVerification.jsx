// frontend/src/components/Auth/components/PhoneVerification/PhoneVerification.jsx

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { linkWithCredential, RecaptchaVerifier } from "firebase/auth";
import { auth } from "../../../../firebaseConfig";
import { useAuth } from "../../../../context/AuthContext";
import { updateUserProfile } from "../../../../api/userService";
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

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  // Set up a single RecaptchaVerifier for the flow.
  useEffect(() => {
    const v = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    setVerifier(v);
    return () => v.clear();
  }, []);

  const handleCodeSent = useCallback((newId, fullPhone) => {
    setError("");
    setVerificationId(newId);
    setPhoneNumber(fullPhone);
  }, []);

  const handleVerificationSuccess = useCallback(
    async (phoneCredential) => {
      setError("");
      try {
        await linkWithCredential(auth.currentUser, phoneCredential);
        await updateUserProfile({ phoneNumber, phoneVerified: true });
        updateUser({ phoneVerified: true, phoneNumber });
        navigate("/home", { replace: true });
      } catch (e) {
        setError(translateAuthError(e.code) || "An unexpected error occurred.");
      }
    },
    [navigate, phoneNumber, updateUser]
  );

  return (
    <div className={styles.verificationPage}>
      <div id="recaptcha-container" />
      <div className={styles.verificationContainer}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        {!verificationId ? (
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
