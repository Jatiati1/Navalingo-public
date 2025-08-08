// frontend/src/components/Account/sections/AccountSection.jsx

import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { updateUserProfile } from "../../../../api/userService.js";
import { useToast } from "../../../UI/Toast/ToastProvider.jsx";
import styles from "./AccountSection.module.css";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

/**
 * useCountdown
 * Returns a simple {days, hours, minutes, seconds} countdown to targetDate.
 * @param {string | null} targetDate
 */
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

/**
 * AccountSection
 * Profile details, language preference, and credit usage summary.
 */
export default function AccountSection() {
  const { currentUser, updateUser } = useAuth();
  const { settingsHook } = useOutletContext();
  const { language, handleLanguageChange, loading: langLoading } = settingsHook;
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  // Credit calculation logic
  const credits = currentUser?.credits;
  const timeLeft = useCountdown(credits?.resets);
  let creditValue = "Loading...";
  let resetText = "";

  if (credits) {
    creditValue = `${credits.current.toLocaleString()} / ${credits.max.toLocaleString()} credits remaining`;

    if (!credits.resets) {
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

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
    }
  }, [currentUser]);

  const handleUsernameUpdate = useCallback(async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed === currentUser?.username || busy) return;

    setBusy(true);
    try {
      await updateUserProfile({ username: trimmed });
      updateUser({ ...currentUser, username: trimmed });
      showToast("Username updated.", {
        severity: "success",
        duration: 2400,
        dedupeKey: "username-update-success",
      });
    } catch {
      // Silent failure in public build; show user-facing toast only.
      showToast("Failed to update username. Please try again.", {
        severity: "error",
        dedupeKey: "username-update-error",
      });
    } finally {
      setBusy(false);
    }
  }, [username, currentUser, updateUser, busy, showToast]);

  const disableUpdate =
    busy || !username.trim() || username.trim() === currentUser?.username;

  return (
    <section className={styles.profileContainer}>
      <h2 className="section-title">Account</h2>
      <p className="section-description">
        Manage your personal information and application preferences.
      </p>

      {/* Profile Information */}
      <div className="settings-section">
        <div className="form-group">
          <label htmlFor="profile-username">Name</label>
          <div className="input-group">
            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              disabled={busy}
            />
            <button
              type="button"
              className="update-button"
              onClick={handleUsernameUpdate}
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

      {/* General: credit usage */}
      <div className="settings-section">
        <h3 className="settings-heading">General</h3>
        <div className="form-group">
          <label htmlFor="credits-usage">Weekly Credits</label>
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
