// frontend/src/components/Account/hooks/usePasswordChangeFlow.js

import { useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PhoneAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import api from "../../../api/axios";

/**
 * usePasswordChangeFlow — phone-OTP–guarded password change flow.
 *
 * Steps: "idle" → "otp" → "input_new" → "idle"
 *
 * @param {(phoneNumber:string) => Promise<string>} sendOtpCallback
 * @param {(message:string) => void} showToastCallback
 * @returns {{
 *   step: 'idle'|'otp'|'input_new',
 *   loading: boolean,
 *   beginFlow: () => Promise<void>,
 *   verifyOtp: (otp:string) => Promise<void>,
 *   updatePassword: (newPassword:string) => Promise<void>,
 *   cancelFlow: () => void
 * }}
 */
export function usePasswordChangeFlow(sendOtpCallback, showToastCallback) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

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
        setStep("input_new");
      } catch {
        showToastCallback("Incorrect code. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [verificationId, showToastCallback]
  );

  const updatePassword = useCallback(
    async (newPassword) => {
      setLoading(true);
      try {
        await api.put("/users/password", { newPassword });
        showToastCallback("Password updated successfully!");
        setStep("idle");
      } catch (err) {
        showToastCallback(
          err.response?.data?.error || "Failed to update password."
        );
      } finally {
        setLoading(false);
      }
    },
    [showToastCallback]
  );

  const cancelFlow = useCallback(() => {
    setStep("idle");
    setLoading(false);
  }, []);

  return {
    step,
    loading,
    beginFlow,
    verifyOtp,
    updatePassword,
    cancelFlow,
  };
}
