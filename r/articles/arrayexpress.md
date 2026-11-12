# ArrayExpress

Search studies, inspect their records and load processed expression;
raw-only studies are not loadable. Search takes 1–5 s, details 2–10 s
and expression 5–30 s. These calls are free.

Cohort-wide analyses can take 5–60 s; the specific cold latencies above
may be longer.

These examples use the session from Getting started and require the
runtime.

Expression with a gene and group can produce an engine PNG at the
requested dpi and size; this summary call does not request one.

``` r
hits <- gf_arrayexpress_search(s, query = "spinal and bulbar muscular atrophy")
details <- gf_arrayexpress_details(s, accession = "E-MTAB-6986")
expression <- gf_arrayexpress_expression(s, accession = "E-MTAB-6986")
```

## Result fields

`arrayexpress-search`: `hits` (array), `total_hits` (integer), `source`
(string).

`arrayexpress-details`: `source` (string), `accession` (string),
`sample_count` (integer).

`arrayexpress-expression`: `source` (string), `accession` (string),
`sample_count` (integer).
