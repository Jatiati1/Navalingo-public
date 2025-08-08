// src/components/ProtectedRoute.jsx
// Protects routes by requiring authentication and phone verification.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./UI/LoadingSpinner/LoadingSpinner";

const isDev = import.meta.env.DEV;
const log = (...a) =>
  isDev && console.info("%c[ProtectedRoute]", "color:#3498DB", ...a);
const warn = (...a) =>
  isDev && console.warn("%c[ProtectedRoute]", "color:#F39C12", ...a);

const GRACE_PATHS = new Set(["/verify-phone"]);
const DEFAULT_AUTH_DEST = "/home";

export default function ProtectedRoute() {
  const { loading, isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is resolving
  if (loading) {
    log("Auth loading…");
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

  // Redirect unauthenticated users to /auth, preserving intended path
  if (!isAuthenticated) {
    warn("Unauthenticated → redirect to /auth");
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

  // Handle rare case where user is authenticated but currentUser is not yet loaded
  if (!currentUser) {
    warn("Authenticated but currentUser missing — showing spinner");
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

  const phoneVerified = Boolean(currentUser.phoneVerified);

  // Enforce phone verification
  if (!phoneVerified) {
    if (location.pathname !== "/verify-phone") {
      warn("Phone not verified → redirect to /verify-phone");
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
    return <Outlet />;
  }

  // Redirect verified users away from /verify-phone to intended or default page
  if (phoneVerified && location.pathname === "/verify-phone") {
    const intendedFrom = location.state?.from;
    const dest =
      intendedFrom && intendedFrom !== "/verify-phone"
        ? intendedFrom
        : DEFAULT_AUTH_DEST;
    log("Verified → redirecting to", dest);
    return <Navigate to={dest} replace />;
  }

  // Allow access to any other route
  log("Access granted:", location.pathname);
  return <Outlet />;
}
