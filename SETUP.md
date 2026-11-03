# Privacy policy release coordination

The privacy section added in `privacy/index.html` must also be applied to the app repository's reviewed file, `docs/privacy-policy.html`, so the byte-identical contract holds. The app repository is `/Users/jared/Documents/tcga_browse/RNABrowser` (origin `vindhyadatascience/locus`). Its file must match the live page at `https://genefox.app/privacy/` byte-for-byte; the site and app must ship in the same release.

1. Copy the whole `privacy/index.html` over `docs/privacy-policy.html` in the app repository and land the app repository change together with the site change. Do not publish the site change before the app repository change lands.
2. Publish the coordinated site and app release, then run `Scripts/validate-live-privacy-policy.sh docs/privacy-policy.html` in the app repository after the site is live.
