# Project every sample of a TCGA/GDC cohort onto PC1 x PC2 over the 2,000 most variable genes of the whole...

Project every sample of a TCGA/GDC cohort onto PC1 x PC2 over the 2,000
most variable genes of the whole transcriptome, as GeneFox's cohort
Sample PCA does, optionally colored by a clinical variable or one gene,
with sample exclusions; optionally the scree series, the genes most
correlated with each PC and their loadings, and the biplot. Returns
variance explained, per-sample scores, the figure, a deep link, and
optionally the scatter and requested section CSVs, PNGs and per-list
recipes. Latency: 30 s-5 min cold (every gene is streamed from Xena;
about 2.5 min for TCGA-KIRP's 323 samples), then seconds for the same
cohort; a client that sends a progressToken gets progress every 10 s.
The figure is the app's TCGA › Sample PCA PNG export.

## Usage

``` r
gf_tcga_sample_pca(
    session,
    `project`,
    `biplot` = NULL,
    `color_by` = NULL,
    `color_gene` = NULL,
    `correlated_genes` = NULL,
    `csv` = NULL,
    `dpi` = NULL,
    `exclude_samples` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `inline_image` = NULL,
    `keep_groups` = NULL,
    `log_transform` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `recipe` = NULL,
    `scale_genes` = NULL,
    `scree` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `survival_detail` = NULL,
    `survival_median_lines` = NULL,
    `width_in` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- project:

  (string; one of "TCGA-ACC", "TCGA-BLCA", "TCGA-BRCA", "TCGA-CESC",
  "TCGA-CHOL", "TCGA-COAD", "TCGA-DLBC", "TCGA-ESCA", "TCGA-GBM",
  "TCGA-HNSC", "TCGA-KICH", "TCGA-KIRC", "TCGA-KIRP", "TCGA-LAML",
  "TCGA-LGG", "TCGA-LIHC", "TCGA-LUAD", "TCGA-LUSC", "TCGA-MESO",
  "TCGA-OV", "TCGA-PAAD", "TCGA-PCPG", "TCGA-PRAD", "TCGA-READ",
  "TCGA-SARC", "TCGA-SKCM", "TCGA-STAD", "TCGA-TGCT", "TCGA-THCA",
  "TCGA-THYM", "TCGA-UCEC", "TCGA-UCS", "TCGA-UVM", "TARGET-ALL-P1",
  "TARGET-ALL-P2", "TARGET-ALL-P3", "TARGET-AML", "TARGET-CCSK",
  "TARGET-NBL", "TARGET-OS", "TARGET-RT", "TARGET-WT", "APOLLO-LUAD",
  "BEATAML1.0-COHORT", "CDDP_EAGLE-1", "CGCI-BLGSP", "CGCI-HTMCP-CC",
  "CGCI-HTMCP-DLBCL", "CGCI-HTMCP-LC", "CMI-ASC", "CMI-MBC", "CMI-MPC",
  "CPTAC-2", "CPTAC-3", "CTSP-DLBCL1", "EXCEPTIONAL_RESPONDERS-ER",
  "HCMI-CMDC", "MMRF-COMMPASS", "MP2PRT-ALL", "MP2PRT-WT",
  "NCICCR-DLBCL", "OHSU-CNL", "ORGANOID-PANCREATIC", "REBC-THYR",
  "WCDT-MCRPC") TCGA/TARGET/other GDC project id with a GDC Xena
  expression dataset, e.g. TCGA-BRCA.

- biplot:

  (boolean, optional; default false) Overlay the top 8 gene loading
  vectors on the figure (the screen's biplot; runs the correlated-genes
  solve). NULL omits it.

- color_by:

  (string, optional; one of "sample_type", "stage", "grade",
  "sex_at_birth", "age_group", "race", "ethnicity", "vital_status",
  "diagnosis", "disease_type") Color by a clinical variable the cohort
  offers (at most one of color_by and color_gene). NULL omits it.

- color_gene:

  (string, optional) Color by this gene's expression (quantile bins); it
  must be among the 2,000 retained genes, as on the screen. NULL omits
  it.

- correlated_genes:

  (boolean, optional; default false) Also return correlated genes'
  PC1/PC2 correlations, loadings, cuts and captions, with optional PNG
  and section CSV. NULL omits it.

- csv:

  (boolean, optional; default false) Also write the screen's CSV export
  (the app's own rows) under the output directory and return csv.path.
  NULL omits it.

- dpi:

  (integer, optional; default 300; range 72..1200) Resolution of a
  custom size (at most 8,192 px a side and 16 MP). NULL omits it.

- exclude_samples:

  (array, optional) Exclude sample ids from data.points. Exclusions
  prevent a deep link because saved views do not record them. NULL omits
  it.

- figure:

  (boolean, optional; default true) Draw the figure and return its PNG
  path. NULL omits it.

- format:

  (string, optional; one of "png", "svg", "tiff"; default "png") Figure
  format: png (raster, default), svg (vector with editable text), or
  tiff (raster, .tif); one per run. NULL omits it.

- height_in:

  (number, optional; range 1..40) Custom figure height in inches (with
  the other side; instead of size). The app's size control range. NULL
  omits it.

- html:

  (boolean, optional; default false) Write the screen's single-figure
  HTML export under the output directory and return html.path. Requires
  figure. NULL omits it.

- inline_image:

  (boolean, optional; default false) Include PNG MCP image content up to
  1,048,576 bytes; larger files stay on disk and disclose
  inline_image_omitted. NULL omits it.

- keep_groups:

  (array, optional) Show only these groups of color_by; the PCA is
  recomputed on the retained samples, copied exactly from a previous
  call's levels (the screen's group filter). Statistics (r, r², n, the
  group test and its df) are recomputed on the retained samples with the
  other levels dropped, as R's droplevels(subset(...)); a level not in
  the data is refused, never ignored. NULL omits it.

- log_transform:

  (boolean, optional) Apply log2(x+1) before PCA. Default: the screen's
  (off for GDC's log-scale STAR values). NULL omits it.

- outline_text:

  (boolean, optional; default false) With format svg, write labels as
  glyph outlines instead of editable text. Refused with other formats.
  NULL omits it.

- output_name:

  (string, optional) Optional figure name replacing tool and title slug:
  up to 64 letters, digits, '.', '\_' or '-'; starts alphanumeric, no
  '..'. Session number, size and extension remain; collisions get -2,
  -3, etc. NULL omits it.

- recipe:

  (boolean, optional; default false) Write an app recipe that reopens
  this analysis and return recipe.path. NULL omits it.

- scale_genes:

  (boolean, optional; default true) Scale each gene to unit variance
  (correlation PCA); the screen default. NULL omits it.

- scree:

  (boolean, optional; default false) Also run the screen's scree solve
  and return its component rows, report caption and optional PNG/CSV
  export. NULL omits it.

- show_caption_color_keys:

  (boolean, optional; default true) Figure style: a table caption
  carries the sentence explaining the figure's colors. NULL omits it.

- show_figure_legends:

  (boolean, optional; default true) Figure style: the figure draws its
  own legend. NULL omits it.

- show_row_counts:

  (boolean, optional; default true) Figure style: a box plot's row
  labels carry each group's n. NULL omits it.

- size:

  (string, optional; one of "single_column", "one_and_a_half_column",
  "double_column", "slide", "poster"; default "double_column") Figure
  size preset (the app's export presets); double_column is the app
  default. NULL omits it.

- survival_detail:

  (string, optional; one of "none", "inference", "inferenceAndEffect",
  "full"; default "inferenceAndEffect") Figure style: how much of a
  Kaplan-Meier findings block to draw (the app's Figure Style setting).
  NULL omits it.

- survival_median_lines:

  (boolean, optional; default false) Figure style: draw dashed median
  survival guides for reached medians. NULL omits it.

- width_in:

  (number, optional; range 1..40) Custom figure width in inches (with
  the other side; instead of size). The app's size control range. NULL
  omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `tcga_sample_pca` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-sample-pca-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
