// src/api/userService.js
// User profile and preferences helpers plus a couple of dev-only helpers.

import axiosInstance from "./axios";

// Theme: enforced light (no network call).
export async function getThemePreference() {
  return "light";
}

// Language preferences.
export async function saveLanguagePreference(language) {
  const { data } = await axiosInstance.put("/users/preferences", { language });
  return data;
}

export async function getLanguagePreference() {
  try {
    const { data } = await axiosInstance.get("/users/profile");
    return data?.preferences?.language || "en";
  } catch {
    return "en";
  }
}

// Profile and account actions.
/**
 * Updates allowed profile fields.
 * Note: The backend whitelist currently allows: ["name", "username", "picture", "bio", "onboardingCompleted"].
 * Any other fields (like subscriptionTier or phoneVerified) will trigger a 403 Forbidden error.
 */
export async function updateUserProfile(updates) {
  const { data } = await axiosInstance.put("/users/profile", updates);
  return data;
}

export async function getUserProfile() {
  try {
    const { data } = await axiosInstance.get("/users/profile");
    return data;
  } catch {
    return null;
  }
}

export async function updateEmail(newEmail) {
  const { data } = await axiosInstance.put("/users/email", { newEmail });
  return data;
}

export async function updatePassword(newPassword) {
  const { data } = await axiosInstance.put("/users/password", { newPassword });
  return data;
}

export async function deleteAccount() {
  const { data } = await axiosInstance.delete("/users");
  return data;
}

// Phone verification/linking.
export async function linkPhoneNumber(idToken) {
  const { data } = await axiosInstance.post("/user/phone/link", { idToken });
  return data;
}

// Update phone number.
export async function updateUserPhoneNumber(newPhoneNumber) {
  const { data } = await axiosInstance.put("/user/phone", { newPhoneNumber });
  return data;
}

// Dev-only helpers (backend must expose these in development).
export async function devUpgradeToPro() {
  const { data } = await axiosInstance.post("/users/dev-upgrade-to-pro");
  return data;
}

export async function devDowngradeToFree() {
  const { data } = await axiosInstance.post("/users/dev-downgrade-to-free");
  return data;
}
