# TCGA and GDC

Find GDC projects and plot one gene’s expression by sample type.

Cold-start time: `tcga_projects` 1–3 s, `tcga_expression` 5–40 s; cached
repeats are faster.

The examples use the session `s` from Getting started and need the
GeneFox runtime.

``` r
projects <- gf_tcga_projects(s, search = "BRCA")
expression <- gf_tcga_expression(
    s,
    project = "TCGA-BRCA",
    gene = "ESR1",
    stratify = "sample_type",
    width_in = 6.5,
    height_in = 4,
    dpi = 300
)
table <- gf_table(expression)
tibble <- gf_to_tibble(table)
```

![ESR1 expression in TCGA-BRCA by sample type, as box plots
(tcga_expression, 300 dpi)](figures/tcga-expression.png)

ESR1 expression in TCGA-BRCA by sample type, as box plots
(`tcga_expression`, 300 dpi)

## Result contracts

- `tcga_projects`:
  <https://genefox.app/schemas/v1/tcga-projects-result-v1.schema.json>
- `tcga_expression`:
  <https://genefox.app/schemas/v1/tcga-expression-result-v1.schema.json>
