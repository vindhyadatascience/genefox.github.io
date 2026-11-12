# GEO

Find GEO series, inspect samples and plot expression; this is not
per-device usability advice. Search takes 2–10 s, details 1–5 s, and
expression 10 s–3 min cold.

Cohort-wide analyses can take 5–60 s; the specific cold latencies above
may be longer.

These examples use the session from Getting started and require the
runtime.

Figure-producing calls return engine PNGs at the requested dpi and size
when requested and available.

``` r
hits <- gf_geo_search(s, query = "neuroblastoma")
details <- gf_geo_dataset_details(s, accession = "GSE49711")
expression <- gf_geo_series_expression(s, accession = "GSE49711", gene = "MYCN", figure = TRUE)
```

## Result fields

`geo-search`: `data` (object), `display` (object), `caveats` (array).

`geo-dataset-details`: `data` (object), `display` (object), `caveats`
(array).

`geo-series-expression`: `data` (object), `display` (object), `caveats`
(array).
