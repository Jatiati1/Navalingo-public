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
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);

  const clearClientAuth = useCallback(() => {
    setCurrentUser(null);
    setAuth(false);
    setCsrfToken(null);
    setError(null);
  }, []);

  const checkSession = useCallback(async () => {
    setError(null);
    setLoading(true);

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      // THIS FETCHES THE FULL, PERFECT PROFILE
      const profile = await getUserProfile();
      setCurrentUser(profile);
      setAuth(true);

      try {
        const token = await fetchCsrfToken();
        setCsrfToken(token);
      } catch {
        setCsrfToken(null);
      }
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

  // THE FIX: Do not accept partial data. Force a pristine fetch.
  const loginSuccess = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearClientAuth();
    }
  }, [clearClientAuth]);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setCurrentUser(profile);
      setAuth(true);
    } catch {
      clearClientAuth();
    }
  }, [clearClientAuth]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const cleanup = registerRetryHandler(checkSession);
    return cleanup;
  }, [checkSession]);

  useEffect(() => {
    const resetIso = currentUser?.credits?.resets;
    if (!resetIso) return;

    const resetDate = new Date(resetIso);
    const now = new Date();

    if (Number.isNaN(resetDate.getTime()) || resetDate <= now) return;

    const delay = resetDate.getTime() - now.getTime();
    const timerId = setTimeout(() => {
      refreshCurrentUser();
    }, delay);

    return () => clearTimeout(timerId);
  }, [currentUser?.credits?.resets, refreshCurrentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      user: currentUser,
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