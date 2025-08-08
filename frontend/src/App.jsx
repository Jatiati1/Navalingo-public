// frontend/src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "./firebaseConfig";

// Pages
import LoginSignup from "./components/Auth/Auth";
import PasswordRecovery from "./components/Auth/components/PasswordRecovery/PasswordRecovery";
import PhoneVerification from "./components/Auth/components/PhoneVerification/PhoneVerification";
import Home from "./components/Home/Home";
import Dashboard from "./components/Dashboard/Dashboard";
import Account from "./components/Account/Account";

// Account nested sections
import AccountSection from "./components/Account/sections/AccountSection/AccountSection.jsx";
import Security from "./components/Account/sections/Security/Security.jsx";
import Subscription from "./components/Account/sections/Subscription/Subscription.jsx";
import Feedback from "./components/Account/sections/Feedback/Feedback.jsx";
import Notifications from "./components/Account/sections/Notifications/Notifications.jsx";
import DeleteAccount from "./components/Account/sections/DeleteAccount/DeleteAccount.jsx";
import TryPro from "./components/Account/sections/TryPro/TryPro.jsx";

// Features
import Trash from "./features/trash/Trash.jsx";

// Auth gating
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * App routes and top-level auth redirect handling.
 * - Finalizes Firebase redirect sign-in on mount.
 * - Uses ProtectedRoute for authenticated sections.
 */
export default function App() {
  const location = useLocation();

  // Finalize Firebase redirect sign-in (no logs in public build)
  useEffect(() => {
    getRedirectResult(auth).catch(() => {
      /* no-op */
    });
  }, []);

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/auth" element={<LoginSignup />} />
      <Route path="/recover-password" element={<PasswordRecovery />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route
          path="/dashboard/:docId"
          element={<Dashboard key={location.pathname} />}
        />
        <Route path="/verify-phone" element={<PhoneVerification />} />
        <Route path="/account" element={<Account />}>
          <Route index element={<AccountSection />} />
          <Route path="security" element={<Security />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="trash" element={<Trash />} />
          <Route path="delete" element={<DeleteAccount />} />
          <Route path="try-pro" element={<TryPro />} />
        </Route>
      </Route>

      {/* Root + catch-all redirects */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
