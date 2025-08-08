// frontend/src/components/Account/sections/Security/Security.jsx
// Security settings: email, phone, password, and delete-account entry.
// Uses global toasts and prevents starting multiple sensitive flows at once.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { useAuth } from "../../../../context/AuthContext.jsx";
import { auth } from "../../../../firebaseConfig.js";
import { useToast } from "../../../UI/Toast/ToastProvider.jsx";

import styles from "./Security.module.css";

export default function Security() {
  const navigate = useNavigate();
  const { flowContext } = useOutletContext();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [authUser, setAuthUser] = useState(auth.currentUser);

  // Flow context (provided by Account.jsx)
  const {
    loading,
    handleBeginEmailChange,
    handleBeginPhoneChange,
    handleBeginPasswordChange,
    emailFlowStep,
    phoneFlowStep,
    passwordFlowStep,
  } = flowContext;

  const isAnyFlowActive =
    emailFlowStep !== "idle" ||
    phoneFlowStep !== "idle" ||
    passwordFlowStep !== "idle";

  // Keep live auth state in sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAuthUser(user));
    return () => unsubscribe();
  }, []);

  const isPasswordUser = authUser?.providerData?.some(
    (p) => p.providerId === "password"
  );

  // Prevent starting more than one sensitive flow at a time
  const handleChangeIntent = useCallback(
    (type) => {
      if (isAnyFlowActive) {
        showToast("Finish the current security step before starting another.", {
          severity: "warning",
          duration: 3200,
          dedupeKey: "flow-already-active",
        });
        return;
      }
      switch (type) {
        case "email":
          handleBeginEmailChange();
          break;
        case "phone":
          handleBeginPhoneChange();
          break;
        case "password":
          if (!isPasswordUser) {
            showToast(
              "Password changes aren’t available for this sign-in method.",
              {
                severity: "info",
                duration: 3000,
                dedupeKey: "no-password-provider",
              }
            );
            return;
          }
          handleBeginPasswordChange();
          break;
        default:
          break;
      }
    },
    [
      isAnyFlowActive,
      handleBeginEmailChange,
      handleBeginPhoneChange,
      handleBeginPasswordChange,
      isPasswordUser,
      showToast,
    ]
  );

  const safeEmail = currentUser?.email || authUser?.email || "";

  return (
    <section aria-labelledby="security-heading">
      <h2 id="security-heading" className="section-title">
        Security
      </h2>
      <p className="section-description">
        Manage your password, credentials, and other security settings.
      </p>

      {/* Email address */}
      <div className={styles.securitySection}>
        <h3 className="settings-heading">Email Address</h3>
        <p className={styles.description}>
          The email address associated with your account.
        </p>
        <div className="input-group">
          <input
            id="email"
            type="email"
            value={safeEmail}
            readOnly
            className="input-field"
            aria-describedby="email-help"
          />
          {!isAnyFlowActive && (
            <div className="button-group-inline">
              <button
                type="button"
                className="update-button"
                onClick={() => handleChangeIntent("email")}
                disabled={loading || !safeEmail}
              >
                Change
              </button>
            </div>
          )}
        </div>
        <small id="email-help" className={styles.helperText}>
          You’ll verify changes with a secure code.
        </small>
      </div>

      {/* Phone number */}
      <div className={styles.securitySection}>
        <h3 className="settings-heading">Phone Number</h3>
        <p className={styles.description}>
          The phone number used for verification.
        </p>
        <div className="input-group">
          <input
            type="tel"
            className="input-field"
            readOnly
            value={currentUser?.phoneNumber || "No phone number set"}
            aria-describedby="phone-help"
          />
          {!isAnyFlowActive && (
            <div className="button-group-inline">
              <button
                className="update-button"
                onClick={() => handleChangeIntent("phone")}
                disabled={loading}
              >
                {currentUser?.phoneNumber ? "Change" : "Add"}
              </button>
            </div>
          )}
        </div>
        <small id="phone-help" className={styles.helperText}>
          Used for account recovery and stronger security.
        </small>
      </div>

      {/* Password (email+password accounts only) */}
      {isPasswordUser && (
        <div className={styles.securitySection}>
          <h3 className="settings-heading">Password</h3>
          <p className={styles.description}>
            Choose a strong, unique password to keep your account secure.
          </p>
          <div className="input-group">
            <input
              type="password"
              className="input-field"
              defaultValue="••••••••••••"
              readOnly
              aria-describedby="password-help"
            />
            {!isAnyFlowActive && (
              <div className="button-group-inline">
                <button
                  className="update-button"
                  onClick={() => handleChangeIntent("password")}
                  disabled={loading}
                >
                  Change
                </button>
              </div>
            )}
          </div>
          <small id="password-help" className={styles.helperText}>
            Update regularly and avoid reusing passwords.
          </small>
        </div>
      )}

      {/* Delete account */}
      <div className={styles.deleteSectionContainer}>
        <h3 className={styles.deleteHeading}>Delete Account</h3>
        <p className={styles.deleteDescription}>
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <button
          type="button"
          className={styles.deleteButton}
          disabled={loading || isAnyFlowActive}
          onClick={() => {
            if (isAnyFlowActive) {
              showToast(
                "Finish the current security step before deleting account.",
                {
                  severity: "warning",
                  duration: 3200,
                  dedupeKey: "delete-blocked-active-flow",
                }
              );
              return;
            }
            navigate("/account/delete");
          }}
        >
          Delete Account
        </button>
      </div>

      {/* Live region for async status (flows) */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          border: 0,
        }}
      >
        {loading ? "Processing security action…" : ""}
      </div>
    </section>
  );
}
