"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  RATE_LIMIT_WINDOW_MS,
  rateLimitDecision,
  rateLimitDocumentID,
} = require("./rate-limit");

const SECRET_A = "a".repeat(32);
const SECRET_B = "b".repeat(32);

test("rate-limit IDs are deterministic opaque HMACs", () => {
  const first = rateLimitDocumentID("203.0.113.42", SECRET_A);
  const again = rateLimitDocumentID("203.0.113.42", SECRET_A);

  assert.equal(first, again);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first.includes("203"), false);
});

test("different secrets cannot correlate the same source identifier", () => {
  assert.notEqual(
    rateLimitDocumentID("2001:db8::1", SECRET_A),
    rateLimitDocumentID("2001:db8::1", SECRET_B),
  );
});

test("short HMAC secrets fail closed", () => {
  assert.throws(
    () => rateLimitDocumentID("203.0.113.42", "too-short"),
    /at least 32 bytes/,
  );
});

test("the fixed window permits exactly the configured request count", () => {
  const start = 1_000_000;
  let current;

  for (let count = 1; count <= 20; count += 1) {
    const decision = rateLimitDecision(current, start + count, 20);
    assert.equal(decision.allowed, true);
    assert.equal(decision.state.count, count);
    current = decision.state;
  }

  assert.deepEqual(rateLimitDecision(current, start + 21, 20), {
    allowed: false,
  });
});

test("a denied request cannot extend identifier retention", () => {
  const start = 2_000_000;
  const current = {
    count: 20,
    windowStart: start,
    expiresAtMillis: start + RATE_LIMIT_WINDOW_MS,
  };

  const decision = rateLimitDecision(current, start + 30_000, 20);
  assert.equal(decision.allowed, false);
  assert.equal("state" in decision, false);
});

test("the window resets exactly at one hour with a one-hour TTL", () => {
  const start = 3_000_000;
  const decision = rateLimitDecision(
    { count: 20, windowStart: start },
    start + RATE_LIMIT_WINDOW_MS,
    20,
  );

  assert.deepEqual(decision, {
    allowed: true,
    state: {
      count: 1,
      windowStart: start + RATE_LIMIT_WINDOW_MS,
      expiresAtMillis: start + 2 * RATE_LIMIT_WINDOW_MS,
      schemaVersion: 2,
    },
  });
});

test("future or malformed stored state resets safely", () => {
  assert.equal(
    rateLimitDecision({ count: -3, windowStart: 9_000 }, 8_000, 20).state
      .count,
    1,
  );
  assert.equal(
    rateLimitDecision({ count: "many", windowStart: 7_000 }, 8_000, 20).state
      .count,
    1,
  );
});
