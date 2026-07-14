# GeneFox — website

Marketing site for **GeneFox**, a native browser for public cancer-genomics data,
developed by Vindhya Data Science.

- `index.html` — the landing page (self-contained: inline CSS + JS, brand data-viz
  drawn as inline SVG/Canvas, Google Fonts loaded over the network).
- `assets/` — brand imagery: app icon, Open Graph image, VDS symbol.
- `.nojekyll` — serve the files as-is (skip Jekyll processing).

## Preview locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy (GitHub Pages)

Enable Pages for this repo (Settings → Pages → Deploy from branch → `main` / root).
To use a custom domain, add a `CNAME` file containing the domain and configure DNS.

## Brand

- Ground navy `#1B2547` · magenta `#B53694` · pink `#D57BBA` · pale `#F4D7E7`
- Display **Bricolage Grotesque** · body **Hanken Grotesk** · mono **IBM Plex Mono**

## To wire up before launch

- Real **App Store** and **Google Play** URLs (the store badges currently link to `#`).
- Final **domain** + `CNAME`, and the canonical **privacy policy** page
  (`docs/privacy-policy.html` from the app repo) hosted at the URL the store listings expect.
