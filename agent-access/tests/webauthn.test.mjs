// node --test agent-access/tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toBase64url, fromBase64url, requestOptionsFromJSON, creationOptionsFromJSON, credentialToJSON, passkeysAvailable,
  describeCeremonyError,
} from "../webauthn.js";

const bytes = (...values) => new Uint8Array(values);
const asArray = (buffer) => [...new Uint8Array(buffer)];

test("base64url round trips every length and the URL-safe alphabet, without padding", () => {
  for (let n = 0; n < 70; n += 1) {
    const data = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 0xff);
    const text = toBase64url(data);
    assert.match(text, /^[A-Za-z0-9_-]*$/);
    assert.deepEqual(asArray(fromBase64url(text)), [...data]);
  }
  assert.equal(toBase64url(bytes(0xfb, 0xff, 0xbf)), "-_-_");
  assert.equal(toBase64url(bytes(0xfb, 0xff, 0xbf).buffer), "-_-_");
  // A view into a larger buffer encodes only its own bytes.
  const big = bytes(1, 2, 3, 4, 5);
  assert.equal(toBase64url(big.subarray(1, 3)), toBase64url(bytes(2, 3)));
  // Padding is accepted on the way in; anything else is refused.
  assert.deepEqual(asArray(fromBase64url("AQ==")), [1]);
  for (const bad of ["a+b", "a/b", "abc!", "A", 42, null]) assert.throws(() => fromBase64url(bad), TypeError);
  // Large inputs (a long attestation) do not overflow the argument list.
  const large = new Uint8Array(200000).fill(7);
  assert.equal(fromBase64url(toBase64url(large)).byteLength, 200000);
});

const REQUEST = {
  challenge: "Y2hhbGxlbmdl", rpId: "genefox.app", userVerification: "required", timeout: 300000,
  allowCredentials: [{ id: "Y3JlZC0x", type: "public-key", transports: ["internal", "hybrid"] }, { id: "Y3JlZC0y", type: "public-key", transports: [] }],
};
const CREATION = {
  rp: { id: "genefox.app", name: "GeneFox" }, user: { id: "dXNlcg", name: "jo@example.com", displayName: "GeneFox" },
  challenge: "Y2hhbGxlbmdl", pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
  timeout: 300000, attestation: "none", excludeCredentials: [{ id: "Y3JlZC0x", type: "public-key", transports: ["internal"] }],
  authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "required" },
  extensions: { credProps: true },
};

test("request options without the native helper: buffers where WebAuthn wants them, the rest unchanged", () => {
  const options = requestOptionsFromJSON(REQUEST, undefined);
  assert.deepEqual(asArray(options.challenge), asArray(fromBase64url("Y2hhbGxlbmdl")));
  assert.deepEqual(options.allowCredentials.map((c) => [asArray(c.id), c.type, c.transports]),
    [[asArray(fromBase64url("Y3JlZC0x")), "public-key", ["internal", "hybrid"]], [asArray(fromBase64url("Y3JlZC0y")), "public-key", undefined]]);
  assert.deepEqual([options.rpId, options.userVerification, options.timeout], ["genefox.app", "required", 300000]);
  assert.deepEqual(requestOptionsFromJSON({ challenge: "AA" }, undefined).allowCredentials, []);
});

test("creation options without the native helper: user id, challenge and exclusions decoded; selection kept", () => {
  const options = creationOptionsFromJSON(CREATION, undefined);
  assert.deepEqual(asArray(options.user.id), asArray(fromBase64url("dXNlcg")));
  assert.equal(options.user.name, "jo@example.com");
  assert.deepEqual(asArray(options.challenge), asArray(fromBase64url("Y2hhbGxlbmdl")));
  assert.deepEqual(options.excludeCredentials.map((c) => asArray(c.id)), [asArray(fromBase64url("Y3JlZC0x"))]);
  assert.deepEqual(options.authenticatorSelection, CREATION.authenticatorSelection);
  assert.deepEqual([options.attestation, options.timeout, options.extensions], ["none", 300000, { credProps: true }]);
  // The JSON it came from is not modified.
  assert.equal(CREATION.user.id, "dXNlcg");
});

test("the native parse helpers are used when present, and a throwing one falls back", () => {
  const seen = [];
  const PKC = {
    parseRequestOptionsFromJSON: (json) => { seen.push(["request", json]); return { native: "request" }; },
    parseCreationOptionsFromJSON: (json) => { seen.push(["creation", json]); return { native: "creation" }; },
  };
  assert.deepEqual(requestOptionsFromJSON(REQUEST, PKC), { native: "request" });
  assert.deepEqual(creationOptionsFromJSON(CREATION, PKC), { native: "creation" });
  assert.deepEqual(seen.map(([kind, json]) => [kind, json]), [["request", REQUEST], ["creation", CREATION]]);
  const throwing = { parseRequestOptionsFromJSON: () => { throw new Error("strict"); }, parseCreationOptionsFromJSON: () => { throw new Error("strict"); } };
  assert.ok(requestOptionsFromJSON(REQUEST, throwing).challenge instanceof ArrayBuffer);
  assert.ok(creationOptionsFromJSON(CREATION, throwing).user.id instanceof ArrayBuffer);
});

function fakeAssertion({ userHandle = bytes(9, 9), toJSON } = {}) {
  return {
    id: "Y3JlZC0x", rawId: fromBase64url("Y3JlZC0x"), type: "public-key", authenticatorAttachment: "platform",
    getClientExtensionResults: () => ({}),
    response: { clientDataJSON: bytes(1, 2), authenticatorData: bytes(3, 4), signature: bytes(5, 6), userHandle },
    ...(toJSON ? { toJSON } : {}),
  };
}

test("an assertion to JSON: every buffer base64url, a null userHandle and attachment left out", () => {
  assert.deepEqual(credentialToJSON(fakeAssertion()), {
    id: "Y3JlZC0x", rawId: "Y3JlZC0x", type: "public-key", authenticatorAttachment: "platform", clientExtensionResults: {},
    response: { clientDataJSON: "AQI", authenticatorData: "AwQ", signature: "BQY", userHandle: "CQk" },
  });
  const bare = { ...fakeAssertion({ userHandle: null }), authenticatorAttachment: null };
  const json = credentialToJSON(bare);
  assert.ok(!("userHandle" in json.response));
  assert.ok(!("authenticatorAttachment" in json));
});

test("a registration to JSON carries the attestation object and transports", () => {
  const credential = {
    id: "bmV3", rawId: fromBase64url("bmV3"), type: "public-key", authenticatorAttachment: "cross-platform",
    getClientExtensionResults: () => ({ credProps: { rk: true } }),
    response: { clientDataJSON: bytes(1), attestationObject: bytes(2), getTransports: () => ["usb", "nfc"] },
  };
  assert.deepEqual(credentialToJSON(credential), {
    id: "bmV3", rawId: "bmV3", type: "public-key", authenticatorAttachment: "cross-platform",
    clientExtensionResults: { credProps: { rk: true } },
    response: { clientDataJSON: "AQ", attestationObject: "Ag", transports: ["usb", "nfc"] },
  });
});

test("the browser's own toJSON is used when it works, and ignored when it throws or returns junk", () => {
  const native = { id: "Y3JlZC0x", response: { clientDataJSON: "native" } };
  assert.equal(credentialToJSON(fakeAssertion({ toJSON: () => native })), native);
  assert.equal(credentialToJSON(fakeAssertion({ toJSON: () => { throw new Error("broken extension"); } })).response.signature, "BQY");
  assert.equal(credentialToJSON(fakeAssertion({ toJSON: () => ({}) })).response.signature, "BQY");
});

test("passkey support needs a secure context, PublicKeyCredential and navigator.credentials", () => {
  const ok = { isSecureContext: true, PublicKeyCredential: function PKC() {}, navigator: { credentials: {} } };
  assert.equal(passkeysAvailable(ok), true);
  assert.equal(passkeysAvailable({ ...ok, isSecureContext: false }), false);
  assert.equal(passkeysAvailable({ ...ok, PublicKeyCredential: undefined }), false);
  assert.equal(passkeysAvailable({ ...ok, navigator: {} }), false);
});

test("ceremony errors: a cancel says nothing; the rest say what to do", () => {
  assert.equal(describeCeremonyError({ name: "NotAllowedError" }), "");
  assert.equal(describeCeremonyError({ name: "AbortError" }), "");
  assert.match(describeCeremonyError({ name: "InvalidStateError" }), /already has a passkey/);
  assert.match(describeCeremonyError({ name: "SecurityError" }), /genefox\.app\/agent-access/);
  assert.match(describeCeremonyError({ name: "NotSupportedError" }), /another browser/);
  assert.match(describeCeremonyError(new Error("x")), /did not complete/);
});
