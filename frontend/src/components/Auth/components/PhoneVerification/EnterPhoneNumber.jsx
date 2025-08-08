// frontend/src/components/Auth/components/PhoneVerification/EnterPhoneNumber.jsx

import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { PhoneAuthProvider } from "firebase/auth";
import { auth } from "../../../../firebaseConfig";
import api from "../../../../api/axios";
import { translateAuthError } from "../../../../utils/auth/authErrors";

import PhoneInput, { isPossiblePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import styles from "./PhoneVerification.module.css";

/** Collects a phone number, runs reCAPTCHA, then requests an OTP. */
export default function EnterPhoneNumber({
  onCodeSent,
  verifier,
  setError: setFlowError,
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const setError = (msg) => {
    setLocalError(msg);
    setFlowError?.(msg);
  };

  const handleSendCode = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!phoneNumber || !isPossiblePhoneNumber(phoneNumber)) {
        setError("Please enter a valid phone number.");
        return;
      }
      if (!verifier) {
        setError(
          "Security verifier is not ready. Please try again in a moment."
        );
        return;
      }

      setLoading(true);
      try {
        await api.post("/auth/check-phone", { phoneNumber });
        await verifier.verify();

        const provider = new PhoneAuthProvider(auth);
        const verificationId = await provider.verifyPhoneNumber(
          phoneNumber,
          verifier
        );

        onCodeSent(verificationId, phoneNumber);
      } catch (err) {
        if (err?.response?.status === 409 && err?.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          const friendly = translateAuthError(err?.code);
          setError(
            friendly ||
              err?.response?.data?.error ||
              "Could not verify phone number. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [phoneNumber, verifier, onCodeSent]
  );

  return (
    <>
      <h1 className={styles.title}>Verify You're Human</h1>
      <p className={styles.instructions}>
        Enter your phone number and complete the security check to receive a
        code.
      </p>

      {localError && <div className={styles.errorMessage}>{localError}</div>}

      <form onSubmit={handleSendCode}>
        <p className={styles.label}>Phone number</p>
        <PhoneInput
          defaultCountry="US"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          className={styles.phoneInput}
          disabled={loading}
          countryOptionsListProps={{ className: "CountryDropdownMenu_Custom" }}
        />

        <button
          type="submit"
          className={styles.actionButton}
          disabled={
            loading || !phoneNumber || !isPossiblePhoneNumber(phoneNumber)
          }
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>
    </>
  );
}

EnterPhoneNumber.propTypes = {
  onCodeSent: PropTypes.func.isRequired,
  verifier: PropTypes.any, // RecaptchaVerifier instance
  setError: PropTypes.func,
};
