// src/api/authService.js
//
// Auth service used by the frontend.
// - Wraps Firebase client auth
// - Establishes/clears the server session
// - Prefetches CSRF after auth
// - Hydrates the full user profile so the UI has credits, etc.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import api, { fetchCsrfToken, setSessionToken } from "./axios";

/**
 * Handle the standard server response after any successful auth.
 * - Stores the bearer session token (if provided)
 * - Prefetches CSRF for subsequent mutating requests
 * - Hydrates the user profile from /users/profile so the UI can render immediately
 *
 * Returns the original payload, augmented with { user } when the profile fetch succeeds.
 */
async function handleAuthResponse(response) {
  // Store a bearer token mirror of the session cookie (if the backend returns one)
  if (response?.data?.token) {
    setSessionToken(response.data.token);

    // Proactively cache CSRF for follow-up POST/PUT/PATCH/DELETE requests
    try {
      await fetchCsrfToken();
    } catch {
      // Non-fatal: the next mutating request can request/refresh CSRF again
    }
  }

  // Hydrate the full server-side profile (credits, plan, etc.)
  let profile = null;
  try {
    const { data } = await api.get("/users/profile");
    profile = data;
  } catch {
    // Non-fatal: callers can invoke getUserProfile() later
  }

  return { ...response.data, ...(profile ? { user: profile } : {}) };
}

/**
 * Email/password sign-in.
 */
export async function login(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await user.getIdToken();
    const response = await api.post("/auth/login", { idToken });
    return await handleAuthResponse(response);
  } catch (e) {
    throw e;
  }
}

/**
 * Email/password sign-up.
 * Also accepts a display username for the backend user record.
 */
export async function signup(email, password, username) {
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await user.getIdToken();
    const response = await api.post("/auth/signup", {
      idToken,
      username,
      email,
    });
    return await handleAuthResponse(response);
  } catch (e) {
    throw e;
  }
}

/**
 * Google sign-in.
 * Expects a Google ID token issued on the client.
 */
export async function googleSignIn(idToken) {
  try {
    const response = await api.post("/auth/google-signin", { idToken });
    return await handleAuthResponse(response);
  } catch (e) {
    throw e;
  }
}

/**
 * User-initiated logout.
 * Clears the server session (best-effort) and local Firebase state.
 */
export async function logout() {
  try {
    // Best-effort: even if this fails, clear local session below
    await api.post("/auth/logout");
  } catch {
    // Intentionally ignored
  } finally {
    setSessionToken(null);
    await auth.signOut();
  }
}

/**
 * Fetch the current server-computed user profile.
 */
export async function getUserProfile() {
  try {
    const { data } = await api.get("/users/profile");
    return data;
  } catch (e) {
    throw e;
  }
}

/**
 * Hard logout invoked by the Axios layer when the session is stale.
 * Clears both server and client state, then navigates to /auth.
 */
export async function forceLogout() {
  try {
    await api.post("/auth/logout-and-clear");
  } catch {
    // Best-effort
  } finally {
    setSessionToken(null);
    await auth.signOut();
    window.location.href = "/auth";
  }
}
