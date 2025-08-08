// frontend/src/components/Account/hooks/usePhoneChangeFlow.js

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserPhoneNumber } from "../../../api/userService";
import { useAuth } from "../../../context/AuthContext";

/**
 * usePhoneChangeFlow — multi-step phone number change flow.
 *
 * Steps: "idle" → "reauth" → "input_new" → "otp_new" → "idle"
 *
 * @param {(phoneNumber:string) => Promise<void>} sendOtpCallback
 * @param {(message:string) => void} showToastCallback
 * @returns {{
 *   step: 'idle'|'reauth'|'input_new'|'otp_new',
 *   loading: boolean,
 *   newPhoneNumber: string,
 *   beginFlow: () => void,
 *   onReauthSuccess: () => void,
 *   sendNewPhoneOtp: (number:string) => Promise<void>,
 *   updatePhone: () => Promise<void>,
 *   onForgotPassword: () => void,
 *   cancelFlow: () => void
 * }}
 */
export function usePhoneChangeFlow(sendOtpCallback, showToastCallback) {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");

  const beginFlow = useCallback(() => {
    setStep("reauth");
  }, []);

  const onReauthSuccess = useCallback(() => {
    setStep("input_new");
  }, []);

  const sendNewPhoneOtp = useCallback(
    async (number) => {
      setLoading(true);
      try {
        await sendOtpCallback(number);
        setNewPhoneNumber(number);
        setStep("otp_new");
      } catch (err) {
        showToastCallback(
          err?.message || "Failed to send OTP. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [sendOtpCallback, showToastCallback]
  );

  const updatePhone = useCallback(async () => {
    setLoading(true);
    try {
      await updateUserPhoneNumber(newPhoneNumber);
      updateUser({ phoneNumber: newPhoneNumber });
      showToastCallback("Phone number updated successfully!");
      setStep("idle");
    } catch {
      showToastCallback("Failed to update phone number. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [newPhoneNumber, updateUser, showToastCallback]);

  const onForgotPassword = useCallback(() => {
    setStep("idle");
    navigate("/recover-password");
  }, [navigate]);

  const cancelFlow = useCallback(() => {
    setStep("idle");
    setLoading(false);
  }, []);

  return {
    step,
    loading,
    newPhoneNumber,
    beginFlow,
    onReauthSuccess,
    sendNewPhoneOtp,
    updatePhone,
    onForgotPassword,
    cancelFlow,
  };
}
