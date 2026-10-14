// Pure WebAuthn helpers for /agent-access (RNABrowser-3caw): no DOM and no Firebase, so they run
// under `node --test`. The server sends options as JSON (base64url strings) and expects the
// credential back as JSON (RNABrowser/functions/src/passkeys.ts creationOptions, assertionOptions;
// @simplewebauthn/server's RegistrationResponseJSON and AuthenticationResponseJSON).
//
// Browsers that have PublicKeyCredential.parseRequestOptionsFromJSON,
// parseCreationOptionsFromJSON and credential.toJSON() use them; the converters below are the
// fallback for those that don't, and for a native helper that throws.

const BASE64URL = /^[A-Za-z0-9_-]*$/;

/** base64url without padding, from an ArrayBuffer or a typed array. */
export function toBase64url(data) {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** An ArrayBuffer from base64url (padding optional). Throws on anything else. */
export function fromBase64url(text) {
  if (typeof text !== "string" || !BASE64URL.test(text.replace(/=+$/, ""))) {
    throw new TypeError("not base64url");
  }
  const plain = text.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  if (plain.length % 4 === 1) throw new TypeError("not base64url");
  const binary = atob(plain + "=".repeat((4 - (plain.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function descriptors(list) {
  return (Array.isArray(list) ? list : []).map((item) => {
    const out = { type: item.type || "public-key", id: fromBase64url(item.id) };
    if (Array.isArray(item.transports) && item.transports.length) out.transports = [...item.transports];
    return out;
  });
}

function native(PKC, name, json) {
  if (!PKC || typeof PKC[name] !== "function") return undefined;
  try { return PKC[name](json); } catch { return undefined; }
}

/** PublicKeyCredentialRequestOptions for navigator.credentials.get({publicKey}). */
export function requestOptionsFromJSON(json, PKC = globalThis.PublicKeyCredential) {
  const parsed = native(PKC, "parseRequestOptionsFromJSON", json);
  if (parsed) return parsed;
  const out = { challenge: fromBase64url(json.challenge), allowCredentials: descriptors(json.allowCredentials) };
  for (const key of ["rpId", "timeout", "userVerification", "hints"]) if (json[key] !== undefined) out[key] = json[key];
  if (json.extensions) out.extensions = { ...json.extensions };
  return out;
}

/** PublicKeyCredentialCreationOptions for navigator.credentials.create({publicKey}). */
export function creationOptionsFromJSON(json, PKC = globalThis.PublicKeyCredential) {
  const parsed = native(PKC, "parseCreationOptionsFromJSON", json);
  if (parsed) return parsed;
  const out = {
    rp: { ...json.rp },
    user: { ...json.user, id: fromBase64url(json.user.id) },
    challenge: fromBase64url(json.challenge),
    pubKeyCredParams: (json.pubKeyCredParams || []).map((p) => ({ ...p })),
    excludeCredentials: descriptors(json.excludeCredentials),
  };
  for (const key of ["timeout", "attestation", "hints"]) if (json[key] !== undefined) out[key] = json[key];
  if (json.authenticatorSelection) out.authenticatorSelection = { ...json.authenticatorSelection };
  if (json.extensions) out.extensions = { ...json.extensions };
  return out;
}

/** Drops undefined and null members, so the callable sends nothing where the browser had nothing. */
function compact(object) {
  const out = {};
  for (const [key, value] of Object.entries(object)) if (value !== undefined && value !== null) out[key] = value;
  return out;
}

/** The credential as the server's JSON: registration (attestationObject) or assertion (signature). */
export function credentialToJSON(credential) {
  if (typeof credential.toJSON === "function") {
    try {
      const json = credential.toJSON();
      if (json && typeof json === "object" && typeof json.id === "string" && json.response) return json;
    } catch { /* fall back below */ }
  }
  const r = credential.response;
  const response = { clientDataJSON: toBase64url(r.clientDataJSON) };
  if (r.attestationObject) {
    response.attestationObject = toBase64url(r.attestationObject);
    const transports = typeof r.getTransports === "function" ? r.getTransports() : undefined;
    if (Array.isArray(transports)) response.transports = transports;
  } else {
    response.authenticatorData = toBase64url(r.authenticatorData);
    response.signature = toBase64url(r.signature);
    if (r.userHandle) response.userHandle = toBase64url(r.userHandle);
  }
  return compact({
    id: credential.id,
    rawId: toBase64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults: typeof credential.getClientExtensionResults === "function"
      ? credential.getClientExtensionResults() : {},
    response,
  });
}

/** Whether this browser can run a passkey ceremony at all. */
export function passkeysAvailable(win = globalThis) {
  return Boolean(win.isSecureContext && win.PublicKeyCredential && win.navigator?.credentials);
}

/** Plain words for a failed navigator.credentials call, or "" when the person cancelled. */
export function describeCeremonyError(err) {
  const name = String(err?.name ?? "");
  switch (name) {
    case "NotAllowedError":
    case "AbortError":
      return "";
    case "InvalidStateError":
      return "This device already has a passkey for your GeneFox account. Use that one, or add a passkey on another device.";
    case "SecurityError":
      return "This page can't use passkeys here. Open https://genefox.app/agent-access/ directly.";
    case "NotSupportedError":
      return "This browser or device can't make a passkey GeneFox accepts. Try another browser, or your phone.";
    default:
      return "The passkey step did not complete. Try again.";
  }
}
