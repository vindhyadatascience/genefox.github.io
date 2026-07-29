# Signup backend — Firebase (shared by website + app)

A single HTTP Cloud Function, **`signup`**, writes voluntary emails to a Firestore
`signups` collection. Both the **website banner** and the **in-app optional email
screen** call it. Unlike the Apps Script/Sheet alternative, this path returns a real
JSON status (so the caller can *confirm* the write) and is protected by CORS +
honeypot + a privacy-preserving per-IP rate limiter + optional App Check.

```
website banner ─┐
                ├─► POST /signup  ─►  Firestore "signups"   (deduped by sha256(email))
app screen ─────┘   (CORS · honeypot · rate-limit · App Check)
```

## Deploy (~10 min, needs the Firebase CLI)

1. `npm i -g firebase-tools && firebase login`
2. From this folder (`backend/firebase/`): copy `.firebaserc.example` → `.firebaserc`
   and set your Firebase **project ID** (the same project the app already uses).
3. Install deps: `cd functions && npm install && cd ..`
4. Create a random secret containing at least 32 bytes:
   `firebase functions:secrets:set RATE_LIMIT_HMAC_KEY`. This secret keys the HMAC
   used for rate-limit document IDs; never commit it or reuse it elsewhere.
5. Enable a Firestore TTL policy for collection group `ratelimits_v2`, timestamp
   field `expiresAt`. In Google Cloud CLI:
   `gcloud firestore fields ttls update expiresAt --collection-group=ratelimits_v2 --enable-ttl`.
   Wait until the policy is active before treating the retention statement below
   as deployed behavior. Firestore normally deletes an expired document within
   24 hours rather than exactly at its expiration timestamp.
6. **Firestore rules — read first.** If your app already has a `firestore.rules`,
   **merge** the relevant deny-all `match` blocks from
   [`firestore.rules`](./firestore.rules) into it
   and deploy *that* file — a rules deploy REPLACES the whole ruleset. If this is a
   fresh Firestore, you can deploy ours as-is.
7. Deploy:
   - functions only (safe): `firebase deploy --only functions`
   - functions + rules (only after step 6): `firebase deploy --only functions,firestore:rules`
8. **Required migration:** after the new functions are serving traffic, delete the
   entire legacy `ratelimits` collection once in the Firestore console or with the
   Firebase CLI. Its old document IDs contain source IPs and have no TTL. Do not
   delete `ratelimits_v2`. This purge is a public-release gate.
9. Confirm that new `ratelimits_v2` document IDs are 64 lowercase hexadecimal
   characters, include an `expiresAt` timestamp, and that the TTL policy is active.
10. Copy the printed function URL, e.g.
   `https://us-central1-<project>.cloudfunctions.net/signup`.

## Wire up the website

In `../../index.html`, set `SIGNUP_ENDPOINT` (in the signup `<script>`) to that URL.
Commit + push. The banner now reads the function's `{ok:true}` response and only shows
success on a real 2xx.

Make sure your site's origin is in `ALLOWED_ORIGINS` in `functions/index.js`
(`https://genefox.app` is already there).

## Wire up the app

The app posts the same JSON to the same URL, adding an **App Check** token header
`X-Firebase-AppCheck` when the platform can obtain one. Send `source: "app"`.
Tokens are verified and the result is recorded when present; they are not yet
required because the public Android release does not send one. The email screen
is **optional** (a skippable step).

## What's collected / privacy

Signup and unsubscribe records contain `email`, `source` (`"web"|"app"`), whether
App Check passed, and timestamps. The service also uses the request IP to derive
a secret-keyed HMAC solely for abuse prevention. It does not retain the IP itself.
The opaque rate-limit record expires after its one-hour enforcement window and,
with the required Firestore TTL policy active, is normally deleted within the
following 24 hours. No user agent is stored.

Apple App Privacy and Play Data Safety must declare the voluntary email. The
opaque, short-lived rate-limit identifier should also be disclosed conservatively
as a device/other identifier used for app functionality and fraud prevention.

## Anti-abuse notes

- **Honeypot** `hp` field (bots that fill it get a fake success).
- **Rate limit**: 20 requests/hour per secret-keyed IP HMAC
  (`ratelimits_v2/{hmac}`), tune in `index.js`.
- **App Check**: verified when present. For the *website*, requiring App Check needs
  the Firebase Web SDK + reCAPTCHA; deferred for v1 (honeypot + rate limit cover it).
- **Double opt-in**: not built yet. For a real mailing list, add a confirmation email
  + a `confirmed` flag before treating an address as subscribed (CAN-SPAM/GDPR).
