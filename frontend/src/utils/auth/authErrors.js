// frontend/src/utils/auth/authErrors.js

/**
 * Auth error translation utility.
 * Maps Firebase Auth error codes to user-friendly messages.
 */

const defaultError = "An unexpected error occurred. Please try again.";

const errorMap = {
  // General
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email. Please sign up.",
  "auth/email-already-in-use":
    "An account with this email address already exists.",
  "auth/operation-not-allowed": "This sign-in method is disabled.",
  "auth/too-many-requests":
    "Access to this account has been temporarily disabled due to many failed login attempts. You can restore it by resetting your password or try again later.",
  "auth/network-request-failed":
    "A network error occurred. Please check your connection and try again.",

  // Password
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/wrong-password": "Incorrect password. Please try again.", // backward compatibility
  "auth/weak-password":
    "Password is too weak. It must be at least 8 characters.",

  // Phone / OTP / reCAPTCHA
  "auth/invalid-phone-number": "The phone number you entered is not valid.",
  "auth/missing-phone-number": "A phone number is required to continue.",
  "auth/invalid-verification-code":
    "The code you entered is invalid. Please try again.",
  "auth/code-expired":
    "The verification code has expired. Please request a new one.",
  "auth/captcha-check-failed":
    "The reCAPTCHA verification failed. Please try again.",

  // OAuth / Credential
  "auth/credential-already-in-use":
    "This phone number is already linked to another account.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this phone number or email.",
  "auth/popup-blocked":
    "The sign-in popup was blocked by your browser. Please allow popups and try again.",
  "auth/popup-closed-by-user":
    "The sign-in process was cancelled. Please try again.",
  "auth/cancelled-popup-request":
    "The sign-in process was cancelled. Please try again.",

  // Protected actions
  "auth/requires-recent-login":
    "This action is sensitive and requires a recent login. Please log out and log back in before trying again.",

  // App-specific
  "auth/social-account-no-password":
    "This account was created using a Google sign-in and does not have a password.",
};

/**
 * Translate a Firebase Auth error code into a user-facing message.
 * @param {string} errorCode - Error code from a Firebase Auth error.
 * @returns {string} User-friendly error message.
 */
export const translateAuthError = (errorCode) => {
  return errorMap[errorCode] || defaultError;
};
