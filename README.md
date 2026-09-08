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

Two things to keep in step when a link changes:

- The badges appear **twice** in `index.html`, in the hero and in the footer CTA.
- `public/data/software.json` in the `vindhyadatascience.github.io` repo carries the same
  two URLs for the company site's software list. Its `dist/` copy is a build artifact and is
  gitignored, so it needs no edit.
