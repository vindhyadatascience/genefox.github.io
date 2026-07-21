/**
 * GeneFox signup collector — Firebase HTTP Cloud Function (2nd gen).
 * Shared by BOTH the website banner and the in-app "optional email" screen.
 * Writes to Firestore `signups` (deduped by a hash of the email), returns a real
 * JSON status (so the caller can confirm success), and is protected by CORS +
 * honeypot + per-IP rate limiting + optional App Check.
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
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = { email, source, appCheck: appCheckOk, updatedAt: FieldValue.serverTimestamp() };
      if (!snap.exists) data.createdAt = FieldValue.serverTimestamp();
      tx.set(ref, data, { merge: true });
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("signup error", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});
