// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getUserProfile, logout as apiLogout } from "../api/authService";
import { fetchCsrfToken } from "../api/axios";
import { registerRetryHandler } from "../utils/auth/retryService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);

  // Called after a successful login flow
  const loginSuccess = useCallback((userData) => {
    setAuth(true);
    setCurrentUser(userData);
    setError(null);
  }, []);

  // Clear client-side auth state only
  const clearClientAuth = useCallback(() => {
    setCurrentUser(null);
    setAuth(false);
    setCsrfToken(null);
  }, []);

  // User-initiated logout
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearClientAuth();
    }
  }, [clearClientAuth]);

  // Check session and hydrate profile + CSRF
  const checkSession = useCallback(async () => {
    if (!navigator.onLine) return;

    setError(null);
    setLoading(true);

    try {
      const profile = await getUserProfile();
      setCurrentUser(profile);
      setAuth(true);

      const token = await fetchCsrfToken();
      setCsrfToken(token);
    } catch (e) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        clearClientAuth();
      } else {
        setError(e);
      }
    } finally {
      setLoading(false);
    }
  }, [clearClientAuth]);

  // Refresh only the current user profile (keeps auth if still valid)
  const refreshCurrentUser = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setCurrentUser(profile);
    } catch {
      clearClientAuth();
    }
  }, [clearClientAuth]);

  // Initial session check on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Register background retry handler for failed requests
  useEffect(() => {
    const cleanup = registerRetryHandler(checkSession);
    return cleanup;
  }, [checkSession]);

  // Auto-refresh profile when credit reset timer expires
  useEffect(() => {
    const resetIso = currentUser?.credits?.resets;
    if (!resetIso) return;

    const resetDate = new Date(resetIso);
    const now = new Date();
    if (isNaN(resetDate.getTime()) || resetDate <= now) return;

    const delay = resetDate.getTime() - now.getTime();
    const timerId = setTimeout(() => {
      refreshCurrentUser();
    }, delay);

    return () => clearTimeout(timerId);
  }, [currentUser?.credits?.resets, refreshCurrentUser]);

  // Exposed context value
  const value = useMemo(
    () => ({
      currentUser,
      user: currentUser, // legacy alias
      csrfToken,
      isAuthenticated,
      loading,
      error,
      checkSession,
      loginSuccess,
      logout,
      updateUser: (patchOrFn) => {
        if (typeof patchOrFn === "function") {
          setCurrentUser(patchOrFn);
        } else {
          setCurrentUser((cur) => (cur ? { ...cur, ...patchOrFn } : null));
        }
      },
      clearClientAuth,
      refreshCurrentUser,
    }),
    [
      currentUser,
      csrfToken,
      isAuthenticated,
      loading,
      error,
      checkSession,
      loginSuccess,
      logout,
      clearClientAuth,
      refreshCurrentUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
