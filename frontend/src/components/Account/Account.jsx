// frontend/src/components/Account/Account.jsx
/**
 * Account — container for the Account area.
 * - Wires search, sidebar, and nested routes.
 * - Hosts security flows (email / phone / password) with invisible reCAPTCHA.
 * - Uses global Toast system (no console logging).
 */
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { PhoneAuthProvider, RecaptchaVerifier } from "firebase/auth";

import { auth } from "../../firebaseConfig.js";
import { useAuth } from "../../context/AuthContext.jsx";

/* Hooks */
import useDropdown from "../../hooks/useDropdown.js";
import useSettings from "../../hooks/useSettings.js";
import { useEmailChangeFlow } from "./hooks/useEmailChangeFlow.js";
import { usePhoneChangeFlow } from "./hooks/usePhoneChangeFlow.js";
import { usePasswordChangeFlow } from "./hooks/usePasswordChangeFlow.js";

/* Local account search */
import {
  SearchProvider,
  SearchBar,
  makeAccountAdapter,
} from "../../features/search/index.js";

/* UI */
import Sidebar from "./Sidebar/Sidebar.jsx";
import Logo from "../UI/Logo/Logo.jsx";
import ReauthenticateModal from "../../features/security/ReauthenticateModal.jsx";
import OtpVerificationModal from "../../features/security/OtpVerificationModal.jsx";
import ChangePhoneModal from "../../features/security/ChangePhoneModal.jsx";
import ChangePasswordModal from "../../features/security/ChangePasswordModal.jsx";
import NewEmailModal from "../../features/security/NewEmailModal.jsx";
import ConfirmEmailModal from "../../features/security/ConfirmEmailModal.jsx";

/* Global toast */
import { useToast } from "../UI/Toast/ToastProvider.jsx";

import "./Account.css";
import "./accountstyles.css";

function Account() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  // Toast helper
  const notify = useCallback(
    (message, opts = {}) =>
      showToast(message, {
        severity: opts.severity || "info",
        dedupeKey: opts.dedupeKey,
        duration: opts.duration,
        persist: opts.persist,
      }),
    [showToast]
  );

  // Invisible reCAPTCHA shared by phone/email/password OTP flows
  const [modalVerifier, setModalVerifier] = useState(null);

  useEffect(() => {
    if (!auth || typeof window === "undefined") return;

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container-modal", {
      size: "invisible",
    });
    setModalVerifier(verifier);

    return () => {
      try {
        verifier.clear();
      } catch {
        /* no-op */
      }
      setModalVerifier(null);
    };
  }, []);

  // Dropdown + settings
  const userMenuDropdown = useDropdown(false);
  const settingsHook = useSettings();

  // OTP sender (wrapped for flows)
  const sendOtp = useCallback(
    async (phoneNumber) => {
      if (!modalVerifier) throw new Error("Verifier not ready.");
      const provider = new PhoneAuthProvider(auth);
      return provider.verifyPhoneNumber(phoneNumber, modalVerifier);
    },
    [modalVerifier]
  );

  // Security flows (toast + OTP passed into hooks)
  const emailFlow = useEmailChangeFlow(sendOtp, notify);
  const phoneFlow = usePhoneChangeFlow(sendOtp, notify);
  const passwordFlow = usePasswordChangeFlow(sendOtp, notify);

  const isAnyFlowActive =
    emailFlow.step !== "idle" ||
    phoneFlow.step !== "idle" ||
    passwordFlow.step !== "idle";

  const isAnyFlowLoading =
    emailFlow.loading || phoneFlow.loading || passwordFlow.loading;

  // Logout
  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/auth", { replace: true, state: { reason: "signed-out" } });
  }, [logout, navigate]);

  // Sidebar menu items (username header is non-clickable)
  const accountUserMenuItems = useMemo(
    () => [
      {
        id: "username",
        label: currentUser?.username || "User",
        isHeader: true,
      },
      { id: "home", label: "Home", path: "/home" },
      {
        id: "logout",
        label: "Sign out",
        isLogout: true,
        onClick: handleLogout,
      },
    ],
    [currentUser?.username, handleLogout]
  );

  // Context for nested routes
  const flowContext = useMemo(
    () => ({
      handleBeginEmailChange: emailFlow.beginFlow,
      handleBeginPhoneChange: phoneFlow.beginFlow,
      handleBeginPasswordChange: passwordFlow.beginFlow,
      emailFlowStep: emailFlow.step,
      phoneFlowStep: phoneFlow.step,
      passwordFlowStep: passwordFlow.step,
      loading: isAnyFlowLoading,
    }),
    [
      emailFlow.beginFlow,
      phoneFlow.beginFlow,
      passwordFlow.beginFlow,
      emailFlow.step,
      phoneFlow.step,
      passwordFlow.step,
      isAnyFlowLoading,
    ]
  );

  // Search adapter
  const accountSearchAdapter = useMemo(
    () => makeAccountAdapter(() => auth.currentUser || null),
    []
  );

  return (
    <div className="account-app">
      {/* Container for invisible reCAPTCHA */}
      <div id="recaptcha-container-modal" />
      {isAnyFlowActive && <div className="security-flow-overlay" />}

      {/* Email flow */}
      {emailFlow.step === "otp" && (
        <OtpVerificationModal
          onSuccess={emailFlow.verifyOtp}
          onCancel={emailFlow.cancelFlow}
          onResend={emailFlow.beginFlow}
          loading={emailFlow.loading}
        />
      )}
      {emailFlow.step === "input_new_email" && (
        <NewEmailModal
          onSubmit={emailFlow.submitNewEmail}
          onCancel={emailFlow.cancelFlow}
          loading={emailFlow.loading}
        />
      )}
      {emailFlow.step === "confirm_new_email" && (
        <ConfirmEmailModal
          email={emailFlow.newEmail}
          onConfirm={emailFlow.updateEmail}
          onCancel={emailFlow.cancelFlow}
          onGoBack={emailFlow.goBackToEmailInput}
          loading={emailFlow.loading}
        />
      )}

      {/* Phone flow */}
      {phoneFlow.step === "reauth" && (
        <ReauthenticateModal
          onSuccess={phoneFlow.onReauthSuccess}
          onCancel={phoneFlow.cancelFlow}
          onForgotPassword={phoneFlow.onForgotPassword}
        />
      )}
      {phoneFlow.step === "input_new" && (
        <ChangePhoneModal
          onSubmit={phoneFlow.sendNewPhoneOtp}
          onCancel={phoneFlow.cancelFlow}
          loading={phoneFlow.loading}
        />
      )}
      {phoneFlow.step === "otp_new" && (
        <OtpVerificationModal
          onSuccess={phoneFlow.updatePhone}
          onCancel={phoneFlow.cancelFlow}
          loading={phoneFlow.loading}
          phoneNumber={phoneFlow.newPhoneNumber}
          isChangingPhoneNumber
          onResend={() => phoneFlow.sendNewPhoneOtp(phoneFlow.newPhoneNumber)}
        />
      )}

      {/* Password flow */}
      {passwordFlow.step === "otp" && (
        <OtpVerificationModal
          onSuccess={passwordFlow.verifyOtp}
          onCancel={passwordFlow.cancelFlow}
          onResend={passwordFlow.beginFlow}
          loading={passwordFlow.loading}
        />
      )}
      {passwordFlow.step === "input_new" && (
        <ChangePasswordModal
          onSubmit={passwordFlow.updatePassword}
          onCancel={passwordFlow.cancelFlow}
          loading={passwordFlow.loading}
        />
      )}

      {/* Header */}
      <header className="account-header">
        <div className="title">
          <Logo size="small" color="white" />
        </div>

        <SearchProvider adapter={accountSearchAdapter}>
          <SearchBar
            className="search-container"
            placeholder="Search account settings…"
            showIcon
            renderItem={(r) => (
              <div>
                <span>{r.label}</span>
                {r.sub && <span className="result-sub">{r.sub}</span>}
              </div>
            )}
          />
        </SearchProvider>
      </header>

      {/* Layout */}
      <div className="account-layout">
        {!isAnyFlowActive && (
          <Sidebar
            onSidebarItemClick={(item) => navigate(item.path)}
            userMenuDropdown={userMenuDropdown}
            accountUserMenuItems={accountUserMenuItems}
          />
        )}

        <main
          className={`content-area ${isAnyFlowActive ? "" : "with-sidebar"}`}
        >
          <Outlet context={{ settingsHook, flowContext }} />
        </main>
      </div>
    </div>
  );
}

export default Account;
