// frontend/src/components/Account/hooks/useEmailChangeFlow.js

import { useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PhoneAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import api from "../../../api/axios";

/**
 * useEmailChangeFlow
 * Orchestrates the multi-step email change flow guarded by phone OTP.
 *
 * Steps:
 * - "idle" → "otp" → "input_new_email" → "confirm_new_email" → "idle"
 *
 * @param {(phoneNumber: string) => Promise<string>} sendOtpCallback
 *   Sends an OTP to the given phone number and resolves with a verificationId.
 * @param {(message: string) => void} showToastCallback
 *   Displays a user-facing toast message.
 *
 * @returns {{
 *   step: 'idle'|'otp'|'input_new_email'|'confirm_new_email',
 *   loading: boolean,
 *   newEmail: string,
 *   beginFlow: () => Promise<void>,
 *   verifyOtp: (otp: string) => Promise<void>,
 *   submitNewEmail: (email: string) => void,
 *   goBackToEmailInput: () => void,
 *   updateEmail: () => Promise<void>,
 *   cancelFlow: () => void
 * }}
 */
export function useEmailChangeFlow(sendOtpCallback, showToastCallback) {
  const { currentUser, updateUser } = useAuth();
  const [step, setStep] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [newEmail, setNewEmail] = useState("");

  const beginFlow = useCallback(async () => {
    setLoading(true);
    try {
      const newVerificationId = await sendOtpCallback(currentUser.phoneNumber);
      setVerificationId(newVerificationId);
      setStep("otp");
    } catch {
      showToastCallback("Failed to send verification code. Please try again.");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  }, [currentUser.phoneNumber, sendOtpCallback, showToastCallback]);

  const verifyOtp = useCallback(
    async (otp) => {
      setLoading(true);
      try {
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        await reauthenticateWithCredential(auth.currentUser, credential);
        setStep("input_new_email");
      } catch {
        showToastCallback("Incorrect code. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [verificationId, showToastCallback]
  );

  const submitNewEmail = useCallback((email) => {
    setNewEmail(email);
    setStep("confirm_new_email");
  }, []);

  const goBackToEmailInput = useCallback(() => {
    setStep("input_new_email");
  }, []);

  const updateEmail = useCallback(async () => {
    setLoading(true);
    try {
      await api.put("/users/email", { newEmail });
      updateUser({ email: newEmail });
      showToastCallback("Email updated successfully!");
      setStep("idle");
    } catch (err) {
      showToastCallback(err.response?.data?.error || "Failed to update email.");
    } finally {
      setLoading(false);
    }
  }, [newEmail, updateUser, showToastCallback]);

  const cancelFlow = useCallback(() => {
    setStep("idle");
    setLoading(false);
  }, []);

  return {
    step,
    loading,
    newEmail,
    beginFlow,
    verifyOtp,
    submitNewEmail,
    goBackToEmailInput,
    updateEmail,
    cancelFlow,
  };
}
