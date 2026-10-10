// Pure helpers for the /link page: no DOM, no Firebase, so they run under `node --test`.
//
// The user code format is the server's USER_CODE in RNABrowser/functions/src/helper-link.ts:
// two groups of five uppercase hex digits joined by a hyphen, e.g. "3F9A0-B21C7".

export const CODE_PATTERN = /^[0-9A-F]{5}-[0-9A-F]{5}$/;
export const HOST_LABEL_MAX = 64;

/**
 * Normalizes whatever was typed or pasted into the code field.
 * Returns { value, complete, error }: value is the display form (hyphen inserted after
 * the fifth digit), complete is true only for a full valid code, and error is a plain
 * sentence or "" when the input is merely unfinished.
 */
export function normalizeCode(raw) {
  let s = String(raw ?? "").toUpperCase();
  // Whitespace and dashes of any kind are separators the user may type or paste.
  s = s.replace(/[\s‐-―−-]/g, "");
  // The letter O is never in a hex code; it is always a mistyped zero.
  s = s.replace(/O/g, "0");
  if (/[^0-9A-F]/.test(s)) {
    return { value: format(s.replace(/[^0-9A-F]/g, "")), complete: false,
      error: "Codes use only the digits 0 to 9 and the letters A to F." };
  }
  if (s.length > 10) {
    return { value: format(s.slice(0, 10)), complete: false,
      error: "That is longer than a GeneFox code. Codes have 10 characters, like 3F9A0-B21C7." };
  }
  const value = format(s);
  return { value, complete: CODE_PATTERN.test(value), error: "" };
}

function format(digits) {
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * Makes the helper-supplied host label safe to show as plain text. The label is chosen by
 * whoever ran the helper, so it is untrusted: strip control and bidi-override characters
 * (which can visually reorder text) and cap the length. Callers must still use textContent.
 */
export function cleanHostLabel(raw) {
  let s = typeof raw === "string" ? raw : "";
  s = s.replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return "an unnamed computer";
  const chars = Array.from(s);
  return chars.length > HOST_LABEL_MAX ? chars.slice(0, HOST_LABEL_MAX - 1).join("") + "…" : s;
}

/** "9 min 05 s", "45 s"; "expired" at or below zero. */
export function formatRemaining(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "expired";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60), s = total % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

/** Plain-words message for a Firebase Functions callable error. */
export function describeCallError(err) {
  const code = String(err?.code ?? "").replace(/^functions\//, "");
  const message = String(err?.message ?? "");
  switch (code) {
    case "unauthenticated":
      return "Your sign-in has expired. Sign out, sign in again, and re-enter the code.";
    case "permission-denied":
      if (/helper session/i.test(message)) {
        return "This account session came from the command-line tools, which cannot approve themselves. Sign in here with your own account.";
      }
      return "That code was not recognized. Check it against the code on your computer, or start linking again there to get a new one.";
    case "deadline-exceeded":
      return "This code has expired. Start linking again on your computer to get a new code.";
    case "failed-precondition":
      if (/already/i.test(message)) {
        return "This code has already been used. If you did not just approve or decline it, start linking again on your computer.";
      }
      return "GeneFox could not check this request right now. Try again in a moment.";
    case "resource-exhausted":
      return "Too many attempts in a short time. Wait one minute, then try again.";
    case "invalid-argument":
      return "That code is not in the right format. Codes look like 3F9A0-B21C7.";
    case "unavailable":
    case "deadline":
    case "cancelled":
      return "Could not reach GeneFox. Check your internet connection and try again.";
    case "internal":
      // The SDK reports a blocked or failed fetch (offline, CORS) as a bare "internal".
      if (!message || /^internal$/i.test(message)) {
        return "Could not reach GeneFox. Check your internet connection and try again.";
      }
      return "Something went wrong on GeneFox's side. Try again, or start linking again on your computer.";
    default:
      return "Something went wrong. Check your connection and try again.";
  }
}

/** Plain-words message for a Firebase Auth sign-in error, or "" when the user simply cancelled. */
export function describeAuthError(err) {
  const code = String(err?.code ?? "").replace(/^auth\//, "");
  switch (code) {
    case "popup-closed-by-user":
    case "cancelled-popup-request":
    case "user-cancelled":
      return "";
    case "popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.";
    case "account-exists-with-different-credential":
      return "This email address already belongs to a GeneFox account that uses a different sign-in method. Choose the method you use in the GeneFox app.";
    case "network-request-failed":
      return "Could not reach the sign-in service. Check your internet connection and try again.";
    case "unauthorized-domain":
    case "operation-not-allowed":
    case "invalid-api-key":
    case "api-key-not-valid":
    case "configuration-not-found":
      return "This sign-in method is not available on this page yet. Try another one, or contact info@vindhyadatascience.com.";
    case "too-many-requests":
      return "Too many sign-in attempts. Wait a few minutes, then try again.";
    case "user-disabled":
      return "This GeneFox account has been disabled. Contact info@vindhyadatascience.com.";
    default:
      return "Sign-in did not complete. Try again.";
  }
}
