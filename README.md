# GeneFox — website

Marketing site for **GeneFox**, a native browser for public cancer-genomics data,
developed by Vindhya Data Science.

- `index.html` — the landing page (self-contained: inline CSS + JS, brand data-viz
  drawn as inline SVG/Canvas, with system font stacks and no network font dependency).
- `assets/` — brand imagery: app icon, Open Graph image, VDS symbol.
- `.nojekyll` — serve the files as-is (skip Jekyll processing).

## Preview locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## /agent-access (approve AI assistant access, web passkeys)

`agent-access/` is the approval and passkey page of the app repository's
`docs/WebPasskeys2026-10.md`. It is part of the passkey trust base for `genefox.app`: any page
on this site can ask for passkey gestures, so review every change to this repository with that
in mind. Its tests need Node 22 or later and nothing installed:

```sh
node --test "agent-access/tests/*.test.mjs"
```

They check the CSP against the design's section 6.2, that nothing writes HTML from a string,
the pinned Firebase SDK, and the page's logic. For the Firebase emulators, make a local copy whose
CSP allows them (never publish it): `node agent-access/tests/local-copy.mjs <dir>`, then serve
`<dir>` and open `/agent-access/?emulator=1`.

## Deploy (GitHub Pages)

GitHub Pages deploys from `main` / root to [genefox.app](https://genefox.app).
The checked-in `CNAME` contains `genefox.app`, and DNS is configured for that domain.
The canonical privacy page is `privacy/index.html`; keep it byte-identical to
`docs/privacy-policy.html` in the app repository and run the app repository's
`Scripts/validate-live-privacy-policy.sh` before release.

## Brand

- Ground navy `#1B2547` · magenta `#B53694` · pink `#D57BBA` · pale `#F4D7E7`
- Display **Bricolage Grotesque** · body **Hanken Grotesk** · mono **IBM Plex Mono**

## Store links

Both listings are public, so the badges are plain store links with no beta wording:

- Apple — `https://apps.apple.com/app/genefox/id6778824242`
- Google Play — `https://play.google.com/store/apps/details?id=com.vds.GeneFox`

The Apple URL deliberately carries no country segment — `/app/...` rather than `/us/app/...`
— so the App Store sends each visitor to their own storefront instead of the US one, which
matters for a tool aimed at researchers anywhere.

The `beta-tag` span and its CSS rule are gone rather than left dormant; re-adding a tag is a
smaller job than wondering later whether an unused rule is load-bearing.

Four things to keep in step when a link changes:

- The badges appear **twice** in `index.html`, in the hero and in the footer CTA.
- `apple/index.html` and `android/index.html` are short links (see below) and each carries
  its store URL **four times** — the meta refresh, the canonical, the visible fallback link,
  and the script.
- `download/index.html` carries **both** store URLs twice each: once in the badge markup
  lifted from `index.html`, once in the script.
- `public/data/software.json` in the `vindhyadatascience.github.io` repo carries the same
  two URLs for the company site's software list. Its `dist/` copy is a build artifact and is
  gitignored, so it needs no edit.

## Short links

Three paths, two behaviours.

`genefox.app/apple` and `genefox.app/android` are **deterministic**: `/apple` goes to Apple
even from an Android phone. Someone naming a platform in a link usually means it, and a link
that silently retargets is one the sender cannot verify before sending. Use these when you
know the recipient's device, and when the URL has to be spoken, printed, or put in a QR code
— `apps.apple.com/app/genefox/id6778824242` cannot be transcribed by a human.

`genefox.app/download` **detects the device** and is the one to share when you do not know
what the recipient is holding. Android goes to Play, iPhone/iPad/Mac to the App Store, and
anything else — Windows, Linux, a crawler, scripting off — stays on the page, which shows
both badges. That landing state is the point, not a fallback: guessing for a visitor whose
device cannot be determined would strand them at the wrong store.

Android is tested for FIRST, because Android user agents contain "Linux" and some contain
strings that a naive Apple test would also match. iPadOS 13+ reports itself as "Macintosh",
which is normally a nuisance and is harmless here — an iPad and a Mac belong at the same
store. A crawler staying put is deliberate: `/download` is indexable and should be indexed,
unlike the two short links.

`/apple` and `/android` redirect three ways, in this order: a `<meta http-equiv="refresh">`
that works with scripting off, a `location.replace()` that beats it when scripting is on, and
a visible link if both fail. `/download` has no meta refresh, because it cannot know its
destination without scripting. All three use `replace()` rather than `assign()` so no history
entry is left — otherwise Back from the store bounces the visitor straight forward again.
`/apple` and `/android` are `noindex`; `/download` is not.

`download/index.html` lifts its two badge anchors verbatim from `index.html` so it cannot
drift from the look of the badges it mirrors, minus the `target="_blank"` — it is a
destination, not a link away from a page the reader wants to keep.

GitHub Pages serves static files and cannot issue a real 301. If these ever need to be
server-side redirects — for link-shortener analytics, or because a scanner refuses a
client-side hop — that means putting Cloudflare in front of the domain or moving hosting to
Firebase, which the project already uses for Functions and Firestore. Neither is needed for
the pages to work today.

## Account linking page (`/link`)

`link/index.html` is where a person approves the GeneFox command-line tools on a computer.
The helper prints a code like `3F9A0-B21C7` and the address `https://genefox.app/link`; the
person signs in, enters the code, sees which computer is asking, and chooses **Approve** or
**Don't link**. The computer then asks for its own on-screen confirmation.

- `link/index.html` — markup and inline CSS in the site's style (nav, tokens, footer).
- `link/link.js` — the flow. Firebase JS SDK 10.14.1 from `www.gstatic.com` (Auth +
  Functions only, no Analytics), calling the `linkApprove` callable in `us-central1`.
- `link/code.js` — pure helpers (code format, host-label cleaning, countdown, error
  wording), kept DOM-free so they can be tested with `node --test`.

Backend contract: `RNABrowser/functions/src/helper-link.ts` (`linkApprove` with
`{userCode, action: inspect|approve|decline}`; decisions echo the `thumbprint` and `host`
that `inspect` returned; the signed-in uid alone picks the account). A `?code=` in the URL
only pre-fills the field: nothing is checked or approved until the person presses buttons.

Safety notes: the helper's `hostLabel` is untrusted, so it is cleaned (control and bidi
characters removed, capped at 64 characters) and only ever written with `textContent`. The
page sets a Content-Security-Policy meta tag, sends no referrer, is `noindex`, keeps the
sign-in for the tab only (session persistence), and refuses to work inside a frame.

### Before it works in production

None of these are done by this branch. Do them in the Firebase / Google Cloud / Apple /
Microsoft consoles:

1. **Authorized domains.** Firebase console → Authentication → Settings → Authorized
   domains: add `genefox.app`.
2. **Sign-in providers on the web.** The page uses popups through
   `vds-genefox.firebaseapp.com/__/auth/handler` (popups, not redirects, because browsers'
   third-party storage partitioning breaks redirects when the auth domain differs from the
   page's domain).
   - **Google:** enabled in Firebase Authentication; nothing else needed for popups.
   - **Apple:** Firebase's Apple provider needs a **Services ID** (plus Team ID, Key ID and
     the Sign in with Apple private key) for web sign-in. In Apple Developer → Identifiers →
     the Services ID → Sign in with Apple → Configure: add domain
     `vds-genefox.firebaseapp.com` and return URL
     `https://vds-genefox.firebaseapp.com/__/auth/handler`.
   - **Microsoft:** Firebase's `microsoft.com` provider must be enabled with the Entra app's
     client ID and secret, and that app registration needs a **Web** platform redirect URI
     `https://vds-genefox.firebaseapp.com/__/auth/handler`. Accounts created by the macOS
     custom-token path are registered with the `microsoft.com` provider, so the web popup
     should land on the same account; confirm with one real sign-in.
3. **Web API key restrictions.** Google Cloud console → APIs & Services → Credentials →
   the browser key `AIzaSyCd…T_c`: if API restrictions are on, they must include
   **Identity Toolkit API**, **Token Service API** and **Cloud Functions API**. If HTTP
   referrer restrictions are on, add `https://genefox.app/*` and
   `https://vds-genefox.firebaseapp.com/*`.
4. **Deploy the six functions** (`linkStart`, `linkApprove`, `linkPoll`, `approvalCreate`,
   `approvalDecide`, `approvalPoll`) from `RNABrowser/functions`:
   `firebase deploy --only functions:genefox-auth` (never a bare `firebase deploy`). Their
   CORS allows only `https://genefox.app`, so the page must be served from exactly that
   origin.

The public web config in `link.js` has only `apiKey`, `authDomain` and `projectId`; Auth and
Functions need nothing else. (TODO if ever needed: `appId`/`messagingSenderId` from the
Firebase console's web app settings.)

### Testing locally against the emulators

```sh
# in a copy of RNABrowser/functions with an entry that calls initializeApp()
FIREBASE_DEBUG_MODE=true FIREBASE_DEBUG_FEATURES='{"enableCors":true}' \
  firebase emulators:start --only auth,functions,firestore --project demo-genefox
python3 -m http.server 8000      # from this repository's root
open 'http://localhost:8000/link/?emulator=1'
```

`?emulator=1` is honoured only on `localhost`/`127.0.0.1`; it points the page at the Auth
(9099) and Functions (5001) emulators under the `demo-genefox` project, which can never reach
production. The debug CORS flag is needed because the functions only allow `genefox.app`.
In the emulator `rawRequest.ip` is empty, so the rate limiter refuses every call unless the
local copy falls back to a fixed address.
