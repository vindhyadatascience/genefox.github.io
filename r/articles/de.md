# Differential expression and enrichment

Compare a gene panel between TCGA tumor and normal samples, or analyze a
complete DE table you computed.

Panel DE tests only the genes you list; it is not a genome-wide
analysis.

Enrichment needs the complete tested table, including nonsignificant
genes: at least 500 distinct symbols with raw p-values. It does not
recompute DE.

Cold-start time: `tcga_differential_expression` 10–60 s; cached repeats
are faster.

The examples use the session `s` from Getting started and need the
GeneFox runtime.

``` r
de <- gf_tcga_differential_expression(
    s,
    project = "TCGA-BRCA",
    mode = "tumor_vs_normal",
    genes = c("ESR1", "GATA3", "FOXA1", "XBP1", "TFF1", "KRT5", "KRT14", "EGFR", "ERBB2", "MKI67", "TOP2A", "FOXM1"),
    width_in = 6.5,
    height_in = 4,
    dpi = 300
)
text <- paste(readLines("complete-de.tsv"), collapse = "\n")
enrichment <- gf_imported_de_enrichment(
    s,
    table = text,
    source = "precomputed DE",
    comparison = "treated versus control",
    complete_universe = TRUE
)
```

![Volcano plot of a 12-gene panel, TCGA-BRCA tumor versus normal
(tcga_differential_expression, 300
dpi)](figures/tcga-differential-expression.png)

Volcano plot of a 12-gene panel, TCGA-BRCA tumor versus normal
(`tcga_differential_expression`, 300 dpi)

## Result contracts

- `tcga_differential_expression`:
  <https://genefox.app/schemas/v1/tcga-differential-expression-result-v1.schema.json>
- `imported_de_enrichment`:
  <https://genefox.app/schemas/v1/imported-de-enrichment-result-v1.schema.json>
