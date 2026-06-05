// frontend/src/components/Auth/Auth.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebaseConfig.js";
import { googleSignIn } from "../../api/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { translateAuthError } from "../../utils/auth/authErrors.js";

import LoginForm from "./components/LoginForm/LoginForm.jsx";
import SignupForm from "./components/SignupForm/SignupForm.jsx";
import SliderControls from "./components/SliderControls/SliderControls.jsx";
import LoadingSpinner from "../UI/LoadingSpinner/LoadingSpinner.jsx";
import Logo from "../UI/Logo/Logo.jsx";
import styles from "./Auth.module.css";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formContainerHeight, setHeight] = useState(null);

  const loginPaneRef = useRef(null);
  const signupPaneRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    loginSuccess,
    logout,
    isAuthenticated,
    currentUser,
    loading: authLoading,
  } = useAuth();

  const getIntendedPath = useCallback(() => {
    const fromState = location.state?.from;
    const raw =
      typeof fromState === "string" ? fromState : fromState?.pathname || null;
    if (!raw || raw === "/verify-phone" || raw === "/auth") {
      return "/home";
    }
    return raw;
  }, [location.state]);

  useEffect(() => {
    const target = isLogin ? loginPaneRef.current : signupPaneRef.current;
    if (!target) return;

    const ro = new ResizeObserver(([entry]) => {
      if (entry.target.scrollHeight) {
        setHeight(entry.target.scrollHeight);
      }
    });

    ro.observe(target);
    return () => ro.disconnect();
  }, [isLogin, authLoading]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !currentUser) return;

    if (currentUser.phoneVerified) {
      navigate(getIntendedPath(), { replace: true });
    }
  }, [authLoading, isAuthenticated, currentUser, navigate, getIntendedPath]);

  // THE FIX: Await the fresh fetch, then let ProtectedRoute do the heavy lifting
  const handleAuthSuccess = useCallback(async () => {
    await loginSuccess();
    // We send them to the intended path (or /home). If they need phone verification,
    // ProtectedRoute will intercept this instantly and route them to /verify-phone!
    navigate(getIntendedPath(), { replace: true });
  }, [loginSuccess, navigate, getIntendedPath]);

  const handleToggle = useCallback((val) => {
    setIsLogin(val);
    setErrorMsg("");
  }, []);

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const popup = await signInWithPopup(auth, provider);
      const idToken = await popup.user.getIdToken(true);

      // We don't need the stripped-down user object anymore!
      await googleSignIn(idToken);
      await handleAuthSuccess();
    } catch (e) {
      const authCode = e?.code;
      const backendError = e?.response?.data?.error;
      const backendCode = e?.response?.data?.code;

      if (authCode === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }

      if (authCode === "auth/unauthorized-domain") {
        setErrorMsg("This domain isn’t authorized for Google sign-in.");
      } else if (backendCode === "PHONE_VERIFICATION_REQUIRED") {
        navigate("/verify-phone", { replace: true });
      } else {
        // Fallback chain: Firebase Translation -> Backend Message -> Generic Fallback
        setErrorMsg(
          translateAuthError(authCode) ||
            backendError ||
            "Sign-in failed. Please try again.",
        );
      }
    } finally {
      // Only stop loading if we are still on the auth page (prevents flashing)
      if (window.location.pathname === "/auth") {
        setLoading(false);
      }
    }
  };

  const handleReturnToLanding = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  if (authLoading) return <LoadingSpinner />;

  if (isAuthenticated && currentUser && currentUser.phoneVerified === false) {
    return (
      <div className={styles.authPage}>
        <div className={styles.wrapper}>
          <div className={styles.title}>
            <Logo size="large" />
          </div>
          <div className={styles.errorMessage} role="status" aria-live="polite">
            You are signed in, but your phone number is not verified yet.
          </div>
          <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={() => navigate("/verify-phone", { replace: true })}
            >
              <span>Continue phone verification</span>
            </button>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleReturnToLanding}
            >
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div
        className={`${styles.wrapper} ${isLogin ? styles.login : styles.signup}`}
      >
        <div className={styles.title}>
          <Logo size="large" />
        </div>

        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

        <SliderControls isLogin={isLogin} onToggle={handleToggle} />

        <div
          className={styles.formContainer}
          style={{
            height: formContainerHeight ? `${formContainerHeight}px` : "auto",
          }}
        >
          <div className={styles.formInner}>
            <div
              ref={loginPaneRef}
              className={`${styles.pane} ${styles.loginPane}`}
            >
              <LoginForm
                loading={loading}
                setLoading={setLoading}
                setError={setErrorMsg}
                onSuccess={handleAuthSuccess}
              />
            </div>

            <div
              ref={signupPaneRef}
              className={`${styles.pane} ${styles.signupPane}`}
            >
              <SignupForm
                loading={loading}
                setLoading={setLoading}
                setError={setErrorMsg}
                onSuccess={handleAuthSuccess}
              />
            </div>
          </div>
        </div>

        <div className={styles.divider}>
          <hr />
          <span>OR</span>
          <hr />
        </div>

        <div className={styles.socialLogin}>
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google icon"
            />
            <span>{loading ? "Signing in…" : "Sign in with Google"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
