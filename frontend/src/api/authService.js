// src/api/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import api, { fetchCsrfToken, setSessionToken } from "./axios";

/**
 * Handle the standard server response after any successful auth.
 */
async function handleAuthResponse(response) {
  // Optional: backend may return a token mirror, store it only if bearer mode is enabled
  if (response?.data?.token) {
    setSessionToken(response.data.token);
  }

  // Production behavior: cookie session plus CSRF, so always prefetch CSRF best-effort
  try {
    await fetchCsrfToken();
  } catch {
    // Non-fatal, request interceptor will fetch later if needed
  }

  return response.data;
}

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken();
  const response = await api.post("/auth/login", { idToken });
  return handleAuthResponse(response);
}

export async function signup(email, password, username) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await user.getIdToken();
  const response = await api.post("/auth/signup", {
    idToken,
    username,
    email,
  });
  return handleAuthResponse(response);
}

export async function googleSignIn(idToken) {
  const response = await api.post("/auth/google-signin", { idToken });
  return handleAuthResponse(response);
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignored
  } finally {
    setSessionToken(null);
    await auth.signOut();
  }
}

export async function getUserProfile() {
  const { data } = await api.get("/users/profile");
  return data;
}

export async function forceLogout() {
  try {
    await api.post("/auth/logout-and-clear");
  } catch {
    // best-effort
  } finally {
    setSessionToken(null);
    await auth.signOut();
    window.location.href = "/auth";
  }
}

// --- ADDED START ---
/**
 * Checks if a phone number exists in the system before allowing password recovery.
 * Passes type: "recovery" so the backend expects the number to exist.
 */
export async function validatePhone(phoneNumber) {
  const { data } = await api.post("/auth/check-phone", {
    phoneNumber,
    type: "recovery",
  });
  return data;
}
// --- ADDED END ---
