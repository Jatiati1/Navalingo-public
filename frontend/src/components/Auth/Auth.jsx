// frontend/src/components/Auth/Auth.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
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

/** Configure Google provider */
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export default function Auth() {
  /** UI state */
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formContainerHeight, setHeight] = useState(null);
  const loginPaneRef = useRef(null);
  const signupPaneRef = useRef(null);

  /** Auth / routing */
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loginSuccess,
    isAuthenticated,
    currentUser,
    loading: authLoading,
  } = useAuth();

  /** Keep container height in sync with active pane */
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

  /** Redirect if already signed in */
  useEffect(() => {
    if (authLoading || !isAuthenticated || !currentUser) return;
    const fromState = location.state?.from;
    const intended =
      typeof fromState === "string" ? fromState : fromState?.pathname;
    if (currentUser.phoneVerified) {
      navigate(intended || "/home", { replace: true });
    } else {
      navigate("/verify-phone", { replace: true });
    }
  }, [authLoading, isAuthenticated, currentUser, navigate, location.state]);

  /** Store user in context; navigation handled by the effect above */
  const handleAuthSuccess = useCallback(
    (userData) => {
      loginSuccess(userData);
    },
    [loginSuccess]
  );

  const handleToggle = useCallback((val) => setIsLogin(val), []);

  /** Handle Google redirect result (fallback path) */
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) return;
        const idToken = await result.user.getIdToken(true);
        const { user } = await googleSignIn(idToken);
        handleAuthSuccess(user);
      } catch (e) {
        setErrorMsg(
          translateAuthError(e?.code) ??
            "Google sign-in (redirect) failed. Please try again."
        );
      }
    })();
  }, [handleAuthSuccess]);

  /** Google sign-in (primary: popup; fallback: redirect) */
  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const popup = await signInWithPopup(auth, provider);
      const idToken = await popup.user.getIdToken(true);
      const { user } = await googleSignIn(idToken);
      handleAuthSuccess(user);
    } catch (e) {
      const code = e?.code;
      if (code === "auth/unauthorized-domain") {
        setErrorMsg(
          "This domain isn’t authorized for Google sign-in. Add it in Firebase → Authentication → Settings → Authorized domains."
        );
      } else if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      } else if (e?.response?.data?.code === "PHONE_VERIFICATION_REQUIRED") {
        navigate("/verify-phone");
      } else {
        setErrorMsg(
          translateAuthError(code) ?? "Sign-in failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <LoadingSpinner />;

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
            {/* Login */}
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

            {/* Signup */}
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
