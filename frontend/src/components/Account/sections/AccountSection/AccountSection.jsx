// frontend/src/components/Account/sections/AccountSection/AccountSection.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { updateUserProfile } from "../../../../api/userService.js";
import { useToast } from "../../../UI/Toast/ToastProvider.jsx";
import styles from "./AccountSection.module.css";
import api from "../../../../api/axios.js";
import Button from "../../../UI/Button/Button.jsx";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const deriveCredits = (user) => {
  if (!user) return null;
  const subTier = user.subscriptionTier || "free";
  const max = subTier === "pro" ? 50 : 10;
  const used = Number.isFinite(user.creditsUsed) ? user.creditsUsed : 0;
  let resetAt = null;
  const ts = user.creditResetDate;
  if (ts && typeof ts.toDate === "function") {
    const d = ts.toDate();
    if (d instanceof Date && !isNaN(d)) resetAt = d;
  } else if (ts) {
    const d = new Date(ts);
    if (d instanceof Date && !isNaN(d)) resetAt = d;
  }
  const now = new Date();
  const hasReset = resetAt && now > resetAt;
  const current = hasReset ? max : Math.max(0, max - used);
  return {
    current,
    max,
    resets: resetAt ? resetAt.toISOString() : null,
  };
};

const useCountdown = (targetDate) => {
  const initial = useMemo(
    () => ({ days: 0, hours: 0, minutes: 0, seconds: 0 }),
    [],
  );
  const [timeLeft, setTimeLeft] = useState(initial);
  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(initial);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const end = new Date(targetDate).getTime();
      const distance = end - now;
      if (distance <= 0) {
        setTimeLeft(initial);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate, initial]);
  return timeLeft;
};

export default function AccountSection() {
  const { currentUser, updateUser, refreshCurrentUser } = useAuth();
  const { settingsHook } = useOutletContext();
  const { language, handleLanguageChange, loading: langLoading } = settingsHook;
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [localCredits, setLocalCredits] = useState(null);

  useEffect(() => {
    if (!refreshCurrentUser) return;
    (async () => {
      try {
        await refreshCurrentUser();
      } catch (err) {
        console.warn("refreshCurrentUser failed:", err);
      }
    })();
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLocalCredits(null);
      return;
    }
    if (currentUser.credits && typeof currentUser.credits.max === "number") {
      setLocalCredits(currentUser.credits);
    } else {
      setLocalCredits(deriveCredits(currentUser));
    }
  }, [currentUser]);

  const timeLeft = useCountdown(localCredits?.resets || null);
  const creditValue = localCredits
    ? `${localCredits.current.toLocaleString()} / ${localCredits.max.toLocaleString()} credits remaining`
    : "Loading…";

  let resetText = "";
  if (localCredits) {
    if (!localCredits.resets) {
      resetText =
        "Your 7-day reset timer will begin after you use your first credit.";
    } else if (timeLeft.days > 0) {
      resetText = `Your credits reset in ${timeLeft.days}d ${timeLeft.hours}h.`;
    } else if (timeLeft.hours > 0) {
      resetText = `Your credits reset in ${timeLeft.hours}h ${timeLeft.minutes}m.`;
    } else if (timeLeft.minutes > 0 || timeLeft.seconds > 0) {
      resetText = `Your credits reset in ${timeLeft.minutes}m ${timeLeft.seconds}s.`;
    } else {
      resetText = "Your credits are resetting now.";
    }
  }

  // Sync state with the 'name' field from the backend
  useEffect(() => {
    if (currentUser)
      setDisplayName(currentUser.name || currentUser.username || "");
  }, [currentUser]);

  const handleNameUpdate = useCallback(async () => {
    const trimmed = displayName.trim();
    const currentName = currentUser?.name || currentUser?.username;

    if (!trimmed || trimmed === currentName || busy) return;
    setBusy(true);
    try {
      // Send the 'name' key, as defined in our secure UserService whitelist
      await updateUserProfile({ name: trimmed });
      updateUser({ ...currentUser, name: trimmed });
      showToast("Profile updated successfully.", {
        severity: "success",
        duration: 2400,
        dedupeKey: "name-update-success",
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Failed to update profile. Please try again.";
      showToast(msg, {
        severity: "error",
        dedupeKey: "name-update-error",
      });
    } finally {
      setBusy(false);
    }
  }, [displayName, currentUser, updateUser, busy, showToast]);

  const disableUpdate =
    busy ||
    !displayName.trim() ||
    displayName.trim() === (currentUser?.name || currentUser?.username);

  // Handler for the Stripe Customer Portal button
  const handleManageBilling = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/stripe/create-portal-session");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Could not open billing portal:", error);
      showToast("Could not open the billing portal. Please try again.", {
        severity: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.profileContainer}>
      <h2 className="section-title">Account</h2>
      <p className="section-description">
        Manage your personal information and application preferences.
      </p>

      {/* Profile Information */}
      <div className="settings-section">
        <div className="form-group">
          <label htmlFor="profile-name">Name</label>
          <div className="input-group">
            <input
              id="profile-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              disabled={busy}
            />
            <button
              type="button"
              className="update-button"
              onClick={handleNameUpdate}
              disabled={disableUpdate}
            >
              {busy ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="profile-email">Email</label>
          <div className="input-group">
            <input
              id="profile-email"
              type="email"
              value={currentUser?.email || ""}
              className="input-field"
              readOnly
            />
          </div>
          <small className="fieldHelper">
            To change your email, please visit the Security section.
          </small>
        </div>
      </div>

      {/* Preferences */}
      <div className="settings-section">
        <h3 className="settings-heading">Preferences</h3>
        <div className="form-group">
          <label htmlFor="language-select">Language</label>
          <select
            id="language-select"
            className="setting-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={langLoading}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscription & Billing Section */}
      <div className="settings-section">
        <h3 className="settings-heading">Subscription & Billing</h3>
        <div className="form-group">
          <label htmlFor="current-plan">Current Plan</label>
          <div className="input-group">
            <input
              id="current-plan"
              type="text"
              className="input-field"
              value={
                currentUser?.subscriptionTier === "pro"
                  ? "Navalingo Pro"
                  : "Navalingo Free"
              }
              readOnly
            />
            {/* This button shows for ANY user who has ever been a customer */}
            {currentUser?.stripeCustomerId && (
              <Button
                onClick={handleManageBilling}
                disabled={busy}
                className="update-button"
              >
                {currentUser?.subscriptionTier === "pro"
                  ? "Manage Billing"
                  : "View Billing History"}
              </Button>
            )}
          </div>
          <small className="fieldHelper">
            {currentUser?.subscriptionTier === "pro"
              ? "Manage your subscription, view invoices, and update your payment method."
              : "You are currently on the free plan."}
          </small>
        </div>
      </div>

      {/* General: credit usage */}
      <div className="settings-section">
        <h3 className="settings-heading">General</h3>
        <div className="form-group">
          <label htmlFor="credits-usage">Credits</label>
          <input
            id="credits-usage"
            type="text"
            className="input-field"
            value={creditValue}
            readOnly
          />
          <small className="fieldHelper">{resetText}</small>
        </div>
      </div>
    </section>
  );
}
