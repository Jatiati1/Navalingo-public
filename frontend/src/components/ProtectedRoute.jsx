import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./UI/LoadingSpinner/LoadingSpinner";

const DEFAULT_AUTH_DEST = "/home";

export default function ProtectedRoute() {
  const { 
    loading, 
    isAuthenticated, 
    currentUser, 
    refreshCurrentUser,
    clearClientAuth 
  } = useAuth();
  
  const location = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);

  // SELF-HEALING: If auth says true, but the user profile is missing, force a refetch.
  // This handles the gap between Firebase Auth succeeding and the Firestore profile hydrating.
  useEffect(() => {
    if (isAuthenticated && !currentUser && !loading && !isRecovering) {
      setIsRecovering(true);
      refreshCurrentUser().finally(() => {
        setIsRecovering(false);
      });
    }
  }, [isAuthenticated, currentUser, loading, isRecovering, refreshCurrentUser]);

  // 1. If the app is actively fetching session data, show the spinner.
  if (loading || isRecovering) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "40vh",
          alignItems: "center",
          justifyContent: "center",
        }}
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner />
      </div>
    );
  }

  // 2. If loading finished and they aren't authenticated, boot to login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          from: location.pathname + location.search + location.hash,
        }}
      />
    );
  }

  // 3. If they ARE authenticated but the recovery failed to get a profile, 
  // their session is corrupted. Clear it and boot them to login so they aren't trapped.
  if (!currentUser) {
    clearClientAuth();
    return <Navigate to="/auth" replace />;
  }

  // 4. Normal Routing Logic
  const phoneVerified = Boolean(currentUser.phoneVerified);
  const isVerifyPage = location.pathname === "/verify-phone";

  if (!phoneVerified && !isVerifyPage) {
    return (
      <Navigate
        to="/verify-phone"
        replace
        state={{
          from: location.pathname + location.search + location.hash,
        }}
      />
    );
  }

  if (phoneVerified && isVerifyPage) {
    const intendedFrom = location.state?.from;
    const destination =
      intendedFrom && intendedFrom !== "/verify-phone"
        ? intendedFrom
        : DEFAULT_AUTH_DEST;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}