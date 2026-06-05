// src/features/Security/ReauthenticateModal.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import styles from "./ReauthenticateModal.module.css";

export default function ReauthenticateModal({
  onSuccess,
  onCancel,
  onForgotPassword,
}) {
  const user = auth.currentUser; // read directly from Firebase Auth

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPasswordUser = user?.providerData?.some(
    (p) => p.providerId === "password"
  );

  const titleId = "reauth-title";
  const descId = "reauth-desc";
  const errorId = "reauth-error";
  const inputId = "reauth-password-input";

  // Focus the password field without using the `autoFocus` prop (a11y rule)
  const inputRef = useRef(null);
  useEffect(() => {
    if (isPasswordUser && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPasswordUser]);

  // Listen for Escape globally instead of attaching keyboard handlers to a non-interactive element
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const handlePasswordSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        if (!user || !user.email) {
          throw new Error("Missing email on account.");
        }
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, cred);
        onSuccess();
      } catch (err) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
      }
    },
    [user, password, onSuccess]
  );

  const handleGoogleReauth = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      onSuccess();
    } catch (err) {
      setError("Failed to re-authenticate with Google. Please try again.");
      setLoading(false);
    }
  }, [user, onSuccess]);

  // Render nothing if no current user (after hooks to satisfy rules-of-hooks)
  if (!user) return null;

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <h2 id={titleId} className={styles.title}>
          Confirm it’s you
        </h2>

        <p id={descId} className={styles.instructions}>
          {isPasswordUser
            ? "To continue, please confirm your password."
            : "To continue, please confirm your identity by signing in with Google again."}
        </p>

        {error && (
          <div
            id={errorId}
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {isPasswordUser ? (
          <form onSubmit={handlePasswordSubmit} noValidate>
            <label htmlFor={inputId} className={styles.visuallyHidden}>
              Password
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="password"
              className={styles.inputField}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />

            <div className={styles.forgotLinkContainer}>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={onForgotPassword}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.actionButton}
                disabled={loading || !password}
              >
                {loading ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleReauth}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Continue with Google"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
