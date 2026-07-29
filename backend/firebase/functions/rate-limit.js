"use strict";

const crypto = require("crypto");

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MINIMUM_HMAC_SECRET_BYTES = 32;
const RATE_LIMIT_SCOPES = new Set(["signup", "unsubscribe"]);

/**
 * Derive an opaque Firestore document ID without retaining the source IP.
 *
 * A keyed HMAC is deliberately used instead of a plain hash: the input space for
 * IPv4 addresses is small enough that an unsalted hash can be reversed cheaply.
 */
function rateLimitDocumentID(scope, ip, secret) {
  if (!RATE_LIMIT_SCOPES.has(scope)) {
    throw new Error("rate-limit scope must be signup or unsubscribe");
  }

  const key = String(secret || "");
  if (Buffer.byteLength(key, "utf8") < MINIMUM_HMAC_SECRET_BYTES) {
    throw new Error(
      `RATE_LIMIT_HMAC_KEY must contain at least ${MINIMUM_HMAC_SECRET_BYTES} bytes`,
    );
  }

  return crypto
    .createHmac("sha256", key)
    .update("genefox-rate-limit\u0000", "utf8")
    .update(scope, "utf8")
    .update("\u0000", "utf8")
    .update(String(ip || "unknown"), "utf8")
    .digest("hex");
}

/**
 * Compute the next fixed-window state without depending on Firestore.
 *
 * Returning no state for a denied request prevents a blocked caller from
 * extending the document's retention. The existing TTL remains anchored to the
 * beginning of the active one-hour window.
 */
function rateLimitDecision(current, now, maxPerWindow) {
  if (!Number.isFinite(now)) throw new TypeError("now must be a finite number");
  if (!Number.isInteger(maxPerWindow) || maxPerWindow < 1) {
    throw new TypeError("maxPerWindow must be a positive integer");
  }

  const currentStart = Number(current?.windowStart);
  const currentCount = Number(current?.count);
  const activeWindow =
    Number.isFinite(currentStart) &&
    currentStart <= now &&
    now - currentStart < RATE_LIMIT_WINDOW_MS;

  const windowStart = activeWindow ? currentStart : now;
  const count =
    activeWindow && Number.isInteger(currentCount) && currentCount >= 0
      ? currentCount
      : 0;

  if (count >= maxPerWindow) {
    return { allowed: false };
  }

  return {
    allowed: true,
    state: {
      count: count + 1,
      windowStart,
      expiresAtMillis: windowStart + RATE_LIMIT_WINDOW_MS,
      schemaVersion: 3,
    },
  };
}

module.exports = {
  MINIMUM_HMAC_SECRET_BYTES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_SCOPES,
  rateLimitDecision,
  rateLimitDocumentID,
};
