# Signup backend — Firebase (shared by website + app)

A single HTTP Cloud Function, **`signup`**, writes voluntary emails to a Firestore
`signups` collection. Both the **website banner** and the **in-app optional email
screen** call it. Unlike the Apps Script/Sheet alternative, this path returns a real
JSON status (so the caller can *confirm* the write) and is protected by CORS +
honeypot + per-IP rate limiting + optional App Check.

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
4. **Firestore rules — read first.** If your app already has a `firestore.rules`,
   **merge** the two `match` blocks from [`firestore.rules`](./firestore.rules) into it
   and deploy *that* file — a rules deploy REPLACES the whole ruleset. If this is a
   fresh Firestore, you can deploy ours as-is.
5. Deploy:
   - functions only (safe): `firebase deploy --only functions`
   - functions + rules (only after step 4): `firebase deploy --only functions,firestore:rules`
6. Copy the printed function URL, e.g.
   `https://us-central1-<project>.cloudfunctions.net/signup`.

## Wire up the website

In `../../index.html`, set `SIGNUP_ENDPOINT` (in the signup `<script>`) to that URL.
Commit + push. The banner now reads the function's `{ok:true}` response and only shows
success on a real 2xx.

Make sure your site's origin is in `ALLOWED_ORIGINS` in `functions/index.js`
(`https://genefox.app` is already there).

## Wire up the app (later)

The app posts the same JSON to the same URL, adding an **App Check** token header
`X-Firebase-AppCheck` (the Firebase SDK provides it). Send `source: "app"` — the
function *requires* a valid App Check token for that source. The email screen is
**optional** (a skippable step), so Cloud Assist is never blocked by it.

## What's collected / privacy

Only: `email`, `source` (`"web"|"app"`), whether App Check passed, and timestamps.
No user agent, no IP stored on the signup doc (IP is used transiently for rate
limiting only). Update the Privacy Policy + Apple App Privacy + Play Data Safety to
declare voluntary email collection before a public launch.

## Anti-abuse notes

- **Honeypot** `hp` field (bots that fill it get a fake success).
- **Rate limit**: 20 signups/hour per IP (`ratelimits/{ip}`), tune in `index.js`.
- **App Check**: enforced for `source:"app"`. For the *website*, App Check needs the
  Firebase Web SDK + reCAPTCHA; deferred for the beta (honeypot + rate-limit cover it).
- **Double opt-in**: not built yet. For a real mailing list, add a confirmation email
  + a `confirmed` flag before treating an address as subscribed (CAN-SPAM/GDPR).
