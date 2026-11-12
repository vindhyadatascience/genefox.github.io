# TCGA and GDC

Explore listed GDC projects, one gene’s expression and panel
differential expression; this is not a genome-wide DE analysis. Project
listing takes 1–3 s once, expression 5–40 s cold, and DE 10–60 s cold.

Cohort-wide analyses can take 5–60 s; the specific cold latencies above
may be longer.

These examples use the session from Getting started and require the
runtime.

Figure-producing calls return engine PNGs at the requested dpi and size
when requested and available.

``` r
projects <- gf_tcga_projects(s, search = "BRCA")
expression <- gf_tcga_expression(s, project = "TCGA-BRCA", gene = "ESR1", figure = TRUE)
de <- gf_tcga_differential_expression(s, project = "TCGA-BRCA", genes = c("ESR1", "GATA3"))
table <- gf_table(expression)
tibble <- gf_to_tibble(table)
data_table <- gf_to_data_table(table)
```

## Result fields

`tcga-projects`: `data` (object), `display` (object), `caveats` (array).

`tcga-expression`: `data` (object), `display` (object), `caveats`
(array).

`tcga-differential-expression`: `data` (object), `display` (object),
`caveats` (array).
