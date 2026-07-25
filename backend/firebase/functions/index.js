/**
 * GeneFox signup collector — Firebase HTTP Cloud Function (2nd gen).
 * Shared by BOTH the website banner and the in-app "optional email" screen.
 * Writes to Firestore `signups` (deduped by a hash of the email), returns a real
 * JSON status (so the caller can confirm success), and is protected by CORS +
 * honeypot + per-IP rate limiting + optional App Check.
 *
 * `unsubscribe` is the mirror of `signup`: it writes to a separate `unsubscribes`
 * suppression collection keyed by the SAME sha256(email) doc id, and never deletes
 * from `signups`. The mailing list is therefore the anti-join
 * (`signups` minus active `unsubscribes`) — see mailingList() below, which is the
 * ONLY supported way to build a send list.
 *
 * Suppression documents are never deleted, so an unsubscribe cannot be lost by a
 * later re-import. Re-subscribing does not erase the record either: `signup` flips
 * `active` to false and stamps `resubscribedAt`, leaving the history intact. The
 * anti-join therefore tests `active === true`, not mere existence.
 *
 * Deploy: see ../README.md.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAppCheck } = require("firebase-admin/app-check");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Browsers that may call this from the website. The app path is authenticated by
// App Check, not by Origin (native requests have no browser Origin).
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

// Simple fixed-window per-IP limiter (a transaction on ratelimits/{ip}).
async function underRateLimit(ip, maxPerHour) {
  const ref = db.collection("ratelimits").doc(String(ip).replace(/[^\w.:-]/g, "_").slice(0, 120) || "unknown");
  const WINDOW = 3600000;
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    let d = snap.exists ? snap.data() : { count: 0, windowStart: now };
    if (now - d.windowStart > WINDOW) d = { count: 0, windowStart: now };
    if (d.count >= maxPerHour) return false;
    d.count += 1;
    tx.set(ref, d);
    return true;
  });
}

exports.signup = onRequest({ region: "us-central1", maxInstances: 5, cors: false }, async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "method_not_allowed" }); return; }

  try {
    const body = req.body || {};

    // Honeypot: pretend success so bots that fill it get no signal.
    if (body.hp) { res.json({ ok: true }); return; }

    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      res.status(400).json({ ok: false, error: "invalid_email" }); return;
    }
    const source = String(body.source || "web").slice(0, 40);

    // App Check: verify + RECORD if a token is present. Not hard-required yet — iOS
    // sends a real App Attest token; Android (Play Integrity from Swift) is a follow-up,
    // and honeypot + rate-limit still guard the app path. Flip to a hard requirement for
    // source:"app" once both platforms reliably send a token.
    let appCheckOk = false;
    const token = req.header("X-Firebase-AppCheck");
    if (token) {
      try { await getAppCheck().verifyToken(token); appCheckOk = true; } catch (e) { appCheckOk = false; }
    }

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
    if (!(await underRateLimit(ip, 20))) {
      res.status(429).json({ ok: false, error: "rate_limited" }); return;
    }

    // Dedup + idempotency: doc id = sha256(email). Transaction so createdAt is set
    // once (first signup) and a re-submit only bumps updatedAt — never duplicates.
    const id = crypto.createHash("sha256").update(email).digest("hex");
    const ref = db.collection("signups").doc(id);
    const suppressionRef = db.collection("unsubscribes").doc(id);
    await db.runTransaction(async (tx) => {
      // Read BOTH before any write: Firestore transactions forbid a read after a write.
      const snap = await tx.get(ref);
      const suppression = await tx.get(suppressionRef);
      const data = { email, source, appCheck: appCheckOk, updatedAt: FieldValue.serverTimestamp() };
      if (!snap.exists) data.createdAt = FieldValue.serverTimestamp();
      tx.set(ref, data, { merge: true });
      // Signing up again is an explicit opt-in, so it lifts an earlier suppression —
      // but keeps the record, so the unsubscribe history survives.
      if (suppression.exists && suppression.data().active === true) {
        tx.set(suppressionRef, {
          active: false,
          resubscribedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("signup error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

exports.unsubscribe = onRequest({ region: "us-central1", maxInstances: 5, cors: false }, async (req, res) => {
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
    const source = String(body.source || "web").slice(0, 40);

    let appCheckOk = false;
    const token = req.header("X-Firebase-AppCheck");
    if (token) {
      try { await getAppCheck().verifyToken(token); appCheckOk = true; } catch (e) { appCheckOk = false; }
    }

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
    if (!(await underRateLimit(ip, 20))) {
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
 * The ONLY supported way to build a send list: every signup whose address is not
 * currently suppressed. Run with the Admin SDK (a script or the Functions shell);
 * this is not exposed over HTTP because it returns the whole list.
 *
 *   const { mailingList } = require("./index");
 *   const addresses = await mailingList();
 */
async function mailingList() {
  const [signups, unsubscribes] = await Promise.all([
    db.collection("signups").get(),
    db.collection("unsubscribes").where("active", "==", true).get(),
  ]);
  const suppressed = new Set(unsubscribes.docs.map((d) => d.id));
  return signups.docs
    .filter((d) => !suppressed.has(d.id))
    .map((d) => d.data().email)
    .filter((e) => typeof e === "string" && e.length > 0);
}

exports.mailingList = mailingList;
