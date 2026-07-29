"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  confirmationForUnverifiedSignup,
  isMailingListEligible,
  validatedSignupSource,
} = require("./signup-policy");

test("signup sources are restricted to exact first-party values", () => {
  assert.equal(validatedSignupSource("web"), "web");
  assert.equal(validatedSignupSource("app"), "app");

  for (const invalid of [
    undefined,
    null,
    "",
    "WEB",
    " web",
    "website",
    "app-import",
    1,
  ]) {
    assert.equal(validatedSignupSource(invalid), null);
  }
});

test("an unverified signup creates and preserves an unconfirmed state", () => {
  assert.equal(confirmationForUnverifiedSignup(undefined), false);
  assert.equal(confirmationForUnverifiedSignup({}), false);
  assert.equal(
    confirmationForUnverifiedSignup({ confirmed: false }),
    false,
  );
});

test("an unverified signup never downgrades a previously confirmed record", () => {
  assert.equal(
    confirmationForUnverifiedSignup({ confirmed: true }),
    true,
  );
});

test("mailing-list eligibility requires confirmation and no active suppression", () => {
  const confirmed = { email: "researcher@example.org", confirmed: true };

  assert.equal(isMailingListEligible(confirmed, false), true);
  assert.equal(isMailingListEligible(confirmed, true), false);
  assert.equal(
    isMailingListEligible(
      { email: "researcher@example.org", confirmed: false },
      false,
    ),
    false,
  );
  assert.equal(
    isMailingListEligible({ email: "researcher@example.org" }, false),
    false,
  );
  assert.equal(isMailingListEligible({ confirmed: true }, false), false);
});
