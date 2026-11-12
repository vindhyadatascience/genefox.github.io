# Sample PCA

Project TCGA/GDC and GEO samples onto principal components; this is not
a differential-expression test. TCGA PCA takes 30 s–5 min cold, then
seconds; GEO requires a cold matrix download, then seconds.

Cohort-wide analyses can take 5–60 s; the specific cold latencies above
may be longer.

These examples use the session from Getting started and require the
runtime.

Figure-producing calls return engine PNGs at the requested dpi and size
when requested and available.

``` r
tcga <- gf_tcga_sample_pca(s, project = "TCGA-BRCA", figure = TRUE)
geo <- gf_geo_sample_pca(s, accession = "GSE49711", figure = TRUE)
```

## Result fields

`tcga-sample-pca`: `data` (object), `display` (object), `caveats`
(array).

`geo-sample-pca`: `data` (object), `display` (object), `caveats`
(array).
