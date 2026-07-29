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

## Store-link release switch

The store badges intentionally retain the current TestFlight and Google Play beta links.
After each public store listing is live, replace its beta wording/tag and, for Apple,
the TestFlight URL with the public App Store URL.
