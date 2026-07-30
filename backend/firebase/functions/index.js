/**
 * GeneFox signup collector — Firebase HTTP Cloud Function (2nd gen).
 * Shared by BOTH the website banner and the in-app "optional email" screen.
 * Writes an unconfirmed record to Firestore `signups` (deduped by a hash of the
 * email), returns a real JSON status (so the caller can confirm receipt), and is
 * protected by CORS + honeypot + per-IP rate limiting + optional App Check.
 *
 * `unsubscribe` is the mirror of `signup`: it writes to a separate `unsubscribes`
 * suppression collection keyed by the SAME sha256(email) doc id, and never deletes
 * from `signups`. The mailing list is therefore the confirmed-only anti-join
 * (`confirmed signups` minus active `unsubscribes`) — see mailingList() below,
 * which is the ONLY supported way to build a send list.
 *
 * Suppression documents are not deleted by either public endpoint, so an
 * unsubscribe cannot be lost by a later re-import. The public signup endpoint
 * neither proves ownership nor clears an active suppression. A separate
 * verification flow must confirm ownership before setting `confirmed: true` or
 * reactivating a suppressed address.
 *
 * Deploy: see ../README.md.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
  Timestamp,
} = require("firebase-admin/firestore");
const { getAppCheck } = require("firebase-admin/app-check");
const crypto = require("crypto");
const {
  rateLimitDecision,
  rateLimitDocumentID,
} = require("./rate-limit");
const {
  confirmationForUnverifiedSignup,
  isMailingListEligible,
  validatedSignupSource,
} = require("./signup-policy");

initializeApp();
const db = getFirestore();
const rateLimitHmacKey = defineSecret("RATE_LIMIT_HMAC_KEY");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUP_ACCEPTED_RESPONSE = Object.freeze({
  ok: true,
  confirmationRequired: true,
});
const FUNCTION_OPTIONS = {
  region: "us-central1",
  maxInstances: 5,
  cors: false,
  secrets: [rateLimitHmacKey],
};

// Browsers that may call this from the website. Native app requests have no
// browser Origin; App Check is verified separately when a token is present.
const ALLOWED_ORIGINS = new Set([
  "https://genefox.app",
  "https://www.genefox.app",
  "https://vindhyadatascience.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:5500",
]);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-Firebase-AppCheck");
  res.set("Access-Control-Max-Age", "3600");
}

// Fixed-window limiter keyed by an endpoint-scoped opaque HMAC, never by the
// source IP itself. Signup traffic therefore cannot consume the unsubscribe
// allowance. `expiresAt` is the TTL field for `ratelimits_v2`.
async function underRateLimit(scope, ip, maxPerHour) {
  const id = rateLimitDocumentID(scope, ip, rateLimitHmacKey.value());
  const ref = db.collection("ratelimits_v2").doc(id);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const decision = rateLimitDecision(
      snap.exists ? snap.data() : undefined,
      now,
      maxPerHour,
    );

    if (!decision.allowed) return false;

    tx.set(ref, {
      count: decision.state.count,
      windowStart: decision.state.windowStart,
      expiresAt: Timestamp.fromMillis(decision.state.expiresAtMillis),
      schemaVersion: decision.state.schemaVersion,
    });
    return true;
  });
}

exports.signup = onRequest(FUNCTION_OPTIONS, async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "method_not_allowed" }); return; }

  try {
    const body = req.body || {};

    // Honeypot: return the same pending-confirmation response as a real request.
    if (body.hp) { res.json(SIGNUP_ACCEPTED_RESPONSE); return; }

    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      res.status(400).json({ ok: false, error: "invalid_email" }); return;
    }
    const source = validatedSignupSource(body.source);
    if (!source) {
      res.status(400).json({ ok: false, error: "invalid_source" }); return;
    }

    // App Check: verify + RECORD if a token is present. Not hard-required yet —
    // supported Apple optional-email clients send an Apple App Check token, while
    // the Android optional-email client currently sends none. Android Cloud Assist
    // separately uses Play Integrity on its Firebase AI path and never calls this
    // function. Honeypot + rate limiting still guard this email endpoint.
    let appCheckOk = false;
    const token = req.header("X-Firebase-AppCheck");
    if (token) {
      try { await getAppCheck().verifyToken(token); appCheckOk = true; } catch (e) { appCheckOk = false; }
    }

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
    if (!(await underRateLimit("signup", ip, 20))) {
      res.status(429).json({ ok: false, error: "rate_limited" }); return;
    }

    // Dedup + idempotency: doc id = sha256(email). Transaction so createdAt is set
    // once (first signup) and a re-submit only bumps updatedAt — never duplicates.
    const id = crypto.createHash("sha256").update(email).digest("hex");
    const ref = db.collection("signups").doc(id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = {
        email,
        source,
        appCheck: appCheckOk,
        confirmed: confirmationForUnverifiedSignup(
          snap.exists ? snap.data() : undefined,
        ),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (!snap.exists) data.createdAt = FieldValue.serverTimestamp();
      tx.set(ref, data, { merge: true });
    });

    // Do not reveal whether the address was new, already confirmed, or suppressed.
    res.json(SIGNUP_ACCEPTED_RESPONSE);
  } catch (err) {
    console.error("signup error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

exports.unsubscribe = onRequest(FUNCTION_OPTIONS, async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "method_not_allowed" }); return; }

  try {
    const body = req.body || {};

    if (body.hp) { res.json({ ok: true }); return; }

    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      res.status(400).json({ ok: false, error: "invalid_email" }); return;
    }
    const source = validatedSignupSource(body.source);
    if (!source) {
      res.status(400).json({ ok: false, error: "invalid_source" }); return;
    }

    let appCheckOk = false;
    const token = req.header("X-Firebase-AppCheck");
    if (token) {
      try { await getAppCheck().verifyToken(token); appCheckOk = true; } catch (e) { appCheckOk = false; }
    }

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
    if (!(await underRateLimit("unsubscribe", ip, 20))) {
      res.status(429).json({ ok: false, error: "rate_limited" }); return;
    }

    // Suppress by the same sha256(email) id the signup uses, so the send-list
    // anti-join is a doc-id comparison. Deliberately NOT conditioned on the address
    // being present in `signups`: an unsubscribe must succeed for an address that was
    // never subscribed (or was already suppressed), and the response must not reveal
    // which case it was — that would turn this endpoint into a subscription oracle.
    const id = crypto.createHash("sha256").update(email).digest("hex");
    const ref = db.collection("unsubscribes").doc(id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = {
        email,
        source,
        appCheck: appCheckOk,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (!snap.exists) data.createdAt = FieldValue.serverTimestamp();
      tx.set(ref, data, { merge: true });
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("unsubscribe error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

/**
 * The ONLY supported way to build a send list: every ownership-confirmed signup
 * whose address is not currently suppressed. Run with the Admin SDK (a script or
 * the Functions shell); this is not exposed over HTTP because it returns the
 * whole list.
 *
 *   const { mailingList } = require("./index");
 *   const addresses = await mailingList();
 */
async function mailingList() {
  const [signups, unsubscribes] = await Promise.all([
    db.collection("signups").where("confirmed", "==", true).get(),
    db.collection("unsubscribes").where("active", "==", true).get(),
  ]);
  const suppressed = new Set(unsubscribes.docs.map((d) => d.id));
  return signups.docs
    .filter((d) =>
      isMailingListEligible(d.data(), suppressed.has(d.id)),
    )
    .map((d) => d.data().email)
    .filter((e) => typeof e === "string" && e.length > 0);
}

exports.mailingList = mailingList;
