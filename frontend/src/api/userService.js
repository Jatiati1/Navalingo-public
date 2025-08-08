// frontend/src/api/userService.js
// User profile/preferences helpers and a couple of dev-only helpers.

import axiosInstance from "./axios";

// Theme: enforced light (no network call).
export async function getThemePreference() {
  return "light";
}

// Language preferences.
export async function saveLanguagePreference(language) {
  try {
    const { data } = await axiosInstance.put("/users/preferences", {
      language,
    });
    return data;
  } catch (e) {
    throw e;
  }
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
export async function updateUserProfile(updates) {
  try {
    const { data } = await axiosInstance.put("/users/profile", updates);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getUserProfile() {
  try {
    const { data } = await axiosInstance.get("/users/profile");
    return data;
  } catch {
    return null;
  }
}

export async function deleteAccount() {
  try {
    const { data } = await axiosInstance.delete("/users");
    return data;
  } catch (e) {
    throw e;
  }
}

// Phone verification/linking.
export async function linkPhoneNumber(idToken) {
  try {
    const { data } = await axiosInstance.post("/user/phone/link", { idToken });
    return data;
  } catch (e) {
    throw e;
  }
}

// Update phone number.
export async function updateUserPhoneNumber(newPhoneNumber) {
  try {
    const { data } = await axiosInstance.put("/user/phone", { newPhoneNumber });
    return data;
  } catch (e) {
    throw e;
  }
}

// Dev-only helpers (backend must expose these in development).
export async function devUpgradeToPro() {
  try {
    const { data } = await axiosInstance.post("/users/dev-upgrade-to-pro");
    return data;
  } catch (e) {
    throw e;
  }
}

export async function devDowngradeToFree() {
  try {
    const { data } = await axiosInstance.post("/users/dev-downgrade-to-free");
    return data;
  } catch (e) {
    throw e;
  }
}
