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
