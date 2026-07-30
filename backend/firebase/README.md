# Signup backend — Firebase (shared by website + app)

The **`signup`** and **`unsubscribe`** HTTP Cloud Functions manage voluntary email
records in Firestore. Both the **website banner** and the **in-app optional email
screen** use this backend. Unlike the Apps Script/Sheet alternative, this path
returns a real JSON status (so the caller can confirm receipt) and is protected by
CORS + honeypot + privacy-preserving per-IP rate limiters + optional App Check.

```
website banner ─┐
                ├─► POST /signup  ─►  Firestore "signups"
app screen ─────┘   (pending ownership confirmation; deduped by sha256(email))
```

## Deploy (~10 min, needs the Firebase CLI)

1. Use Node.js 22, then install/login to the Firebase CLI:
   `npm i -g firebase-tools && firebase login`.
2. From this folder (`backend/firebase/`): copy `.firebaserc.example` → `.firebaserc`
   and set your Firebase **project ID** (the same project the app already uses).
3. Install the reviewed dependency lock exactly:
   `cd functions && npm ci && npm audit --omit=dev --omit=optional && cd ..`.
   The committed `.npmrc` omits Firebase Admin's unused optional modules; Firestore
   is declared directly because it is the only optional Google Cloud module this
   backend uses.
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
Commit + push. The function returns `{ok:true, confirmationRequired:true}` after
accepting a request. First-party UI must treat that response only as confirmation
of receipt, not as a confirmed subscription. It deliberately does not reveal
whether an address was new, previously confirmed, or suppressed.

Make sure your site's origin is in `ALLOWED_ORIGINS` in `functions/index.js`
(`https://genefox.app` is already there).

## Wire up the app

The app posts the same JSON to the same URL, adding an **App Check** token header
`X-Firebase-AppCheck` when the optional-email client can obtain one. Send
`source: "app"`. Tokens are verified and the result is recorded when present;
they are not yet required because the Android optional-email client does not send
one. This statement applies only to the signup/unsubscribe endpoint: Android
Cloud Assist separately uses Play Integrity on its Firebase AI path and does not
call these email functions. The email screen is **optional** (a skippable step).

Both first-party clients must send exactly `source: "web"` or `source: "app"`.
Other or missing values are rejected rather than stored.

## What's collected / privacy

Signup and unsubscribe records contain `email`, `source` (`"web"|"app"`), whether
App Check passed, confirmation/suppression state, and timestamps. The service also
uses the request IP to derive an endpoint-scoped, secret-keyed HMAC solely for
abuse prevention. It does not write the raw IP to Firestore. Each endpoint has an
independent counter, so signup traffic cannot consume the unsubscribe allowance.
The opaque rate-limit record expires after its one-hour enforcement window and,
with the required Firestore TTL policy active, is normally deleted within the
following 24 hours. The application does not write a user agent to Firestore;
Google-managed request logs may separately contain ordinary network metadata
under the project's Cloud Logging retention settings.

Apple App Privacy and Play Data Safety must declare the voluntary email. The
opaque, short-lived rate-limit identifier should also be disclosed conservatively
as a device/other identifier used for app functionality and fraud prevention.

## Anti-abuse notes

- **Honeypot** `hp` field (bots that fill it get a fake success).
- **Rate limit**: 20 requests/hour per endpoint-scoped, secret-keyed IP HMAC
  (`ratelimits_v2/{hmac}`), with independent signup and unsubscribe allowances;
  tune in `index.js`.
- **App Check**: verified when present. For the *website*, requiring App Check needs
  the Firebase Web SDK + reCAPTCHA; deferred for v1 (honeypot + rate limit cover it).
- **Ownership confirmation is not built yet.** Every new public signup is stored
  with `confirmed: false`. Re-submitting an address preserves an existing
  `confirmed: true` value but never clears an active suppression. `mailingList()`
  returns only confirmed, non-suppressed addresses. **Do not send any campaign**
  until a separate ownership-verification flow has been implemented and tested to
  set `confirmed: true`; that future flow must also be the only way to reactivate a
  suppressed address. This repository does not currently select or claim an email
  sender or confirmation provider.
