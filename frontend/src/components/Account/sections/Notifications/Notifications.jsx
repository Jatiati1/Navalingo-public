// frontend/src/components/Account/sections/Notifications/Notifications.jsx
import React, { useState } from "react";
import styles from "./Notifications.module.css";

/**
 * ToggleSwitch
 * Simple checkbox-based toggle used for notification settings.
 */
const ToggleSwitch = ({ label, checked, onChange, disabled }) => (
  <div className={styles.toggleSwitch}>
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className={styles.slider}></span>
    </label>
    <span>{label}</span>
  </div>
);

/**
 * Notifications
 * View-only demo for managing notification preferences.
 * Persists nothing; submission is simulated.
 */
function Notifications() {
  const [notifications, setNotifications] = useState({
    emailProductUpdates: true,
    emailWeeklySummary: false,
    inAppNewFeatures: true,
    inAppMentions: true,
    desktopDocumentChanges: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // No console logs in public build; show a simple confirmation instead.
    alert("Notification preferences saved!");
    setIsSaving(false);
  };

  return (
    <section className={styles.notificationsContainer}>
      <h2 className="section-title">Notification Settings</h2>
      <p className="section-description">Choose how you want to be notified.</p>

      <div className="settings-section">
        <h3 className="settings-heading">Email Notifications</h3>
        <ToggleSwitch
          label="Product Updates & Announcements"
          checked={notifications.emailProductUpdates}
          onChange={() => handleChange("emailProductUpdates")}
          disabled={isSaving}
        />
        <ToggleSwitch
          label="Weekly Activity Summary"
          checked={notifications.emailWeeklySummary}
          onChange={() => handleChange("emailWeeklySummary")}
          disabled={isSaving}
        />
      </div>

      <div className="settings-section">
        <h3 className="settings-heading">In-App Notifications</h3>
        <ToggleSwitch
          label="New Feature Spotlights"
          checked={notifications.inAppNewFeatures}
          onChange={() => handleChange("inAppNewFeatures")}
          disabled={isSaving}
        />
        <ToggleSwitch
          label="Mentions & Comments"
          checked={notifications.inAppMentions}
          onChange={() => handleChange("inAppMentions")}
          disabled={isSaving}
        />
      </div>

      <div className="settings-section">
        <h3 className="settings-heading">
          Desktop Notifications (if applicable)
        </h3>
        <ToggleSwitch
          label="Real-time Document Changes by Collaborators"
          checked={notifications.desktopDocumentChanges}
          onChange={() => handleChange("desktopDocumentChanges")}
          disabled={isSaving}
        />
        <small className={styles.smallNote}>
          Requires desktop app or browser permission.
        </small>
      </div>

      <button
        type="button"
        className="action-button-primary"
        style={{ marginTop: "20px" }}
        onClick={handleSaveChanges}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Notification Preferences"}
      </button>
    </section>
  );
}

export default Notifications;
