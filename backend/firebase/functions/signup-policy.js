"use strict";

const SIGNUP_SOURCES = new Set(["web", "app"]);

/**
 * Accept only the two source values emitted by the first-party clients.
 *
 * Returning null keeps request validation explicit: no caller-controlled fallback
 * or truncation can introduce undeclared source values into Firestore.
 */
function validatedSignupSource(value) {
  return typeof value === "string" && SIGNUP_SOURCES.has(value) ? value : null;
}

/**
 * A call to the public signup endpoint does not prove ownership of an address.
 *
 * New and previously unconfirmed records therefore remain false. A separate,
 * future verification flow may set the field to true; a later public signup must
 * preserve that verified state rather than downgrade it.
 */
function confirmationForUnverifiedSignup(existingRecord) {
  return existingRecord?.confirmed === true;
}

/**
 * Only explicitly confirmed, currently non-suppressed records may be exported.
 */
function isMailingListEligible(record, isActivelySuppressed) {
  return (
    record?.confirmed === true &&
    isActivelySuppressed !== true &&
    typeof record.email === "string" &&
    record.email.length > 0
  );
}

module.exports = {
  SIGNUP_SOURCES,
  confirmationForUnverifiedSignup,
  isMailingListEligible,
  validatedSignupSource,
};
