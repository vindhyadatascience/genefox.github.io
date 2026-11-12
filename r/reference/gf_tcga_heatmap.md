# An expression heatmap of a gene panel across one TCGA or other GDC cohort, as GeneFox's Heatmap screen...

An expression heatmap of a gene panel across one TCGA or other GDC
cohort, as GeneFox's Heatmap screen draws it: every sample (tumor then
normal), each gene z-scored or raw log2(TPM+1), genes and samples
clustered (UPGMA) within this host's measured leaf limit or ordered by
principal component above it (the notice says which and why), pinned
expression rows on top, annotation strips (sample type, subtype, stage,
… and one Mutant/WT strip per mutation gene), and every gene it could
not draw named. genes (2 to 1,000), one of the app's bundled presets, or
from_differential_expression: the top top_n genes up and down (by BH q,
then \|effect\|) of a tcga_differential_expression comparison, its
tested samples as columns under a DE group strip. csv (long format,
values as drawn), recipe, html. Latency: 10-60 s cold (the matrix fetch
dominates). The figure is the app screen's PNG export.

## Usage

``` r
gf_tcga_heatmap(
    session,
    `project`,
    `annotations` = NULL,
    `cluster_columns` = NULL,
    `cluster_rows` = NULL,
    `csv` = NULL,
    `dpi` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `from_differential_expression` = NULL,
    `genes` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `inline_image` = NULL,
    `mutation_genes` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `pinned_genes` = NULL,
    `preset` = NULL,
    `recipe` = NULL,
    `show_caption_color_keys` = NULL,
    `show_dendrograms` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `survival_detail` = NULL,
    `survival_median_lines` = NULL,
    `top_n` = NULL,
    `width_in` = NULL,
    `z_normalize` = NULL,
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

- annotations:

  (array, optional) Strips (default: sample_type, subtype, stage).
  mutation draws one per mutation_genes entry; unavailable strips are
  disclosed and omitted. NULL omits it.

- cluster_columns:

  (boolean, optional; default true) Cluster the samples (columns). NULL
  omits it.

- cluster_rows:

  (boolean, optional; default true) Cluster the genes (rows). NULL omits
  it.

- csv:

  (boolean, optional; default false) Also write the screen's CSV export
  (the app's own rows) under the output directory and return csv.path.
  NULL omits it.

- dpi:

  (integer, optional; default 300; range 72..1200) Resolution of a
  custom size (at most 8,192 px a side and 16 MP). NULL omits it.

- figure:

  (boolean, optional; default true) Draw the figure and return its PNG
  path. NULL omits it.

- format:

  (string, optional; one of "png", "svg", "tiff"; default "png") Figure
  format: png (raster, default), svg (vector with editable text), or
  tiff (raster, .tif); one per run. NULL omits it.

- from_differential_expression:

  (object, optional) DE comparison heatmap: supply
  tcga_differential_expression arguments for this project. Top top_n
  genes each way by BH q, \|effect\|, then symbol; tested sample
  columns, DE group strip first. Exactly one of genes, preset and
  from_differential_expression. NULL omits it.

- genes:

  (array, optional) The gene panel (at least 2), e.g.
  \["ESR1","PGR","ERBB2"\]; canonicalized through the existing human
  symbol/alias reference and de-duplicated as the screen parses it;
  typed tokens and exact dataset mappings remain inspectable. Exactly
  one of genes and preset. NULL omits it.

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

- mutation_genes:

  (array, optional) With annotations including mutation: one Mutant/WT
  strip per gene (GDC non-silent mutations), in order. NULL omits it.

- outline_text:

  (boolean, optional; default false) With format svg, write labels as
  glyph outlines instead of editable text. Refused with other formats.
  NULL omits it.

- output_name:

  (string, optional) Optional figure name replacing tool and title slug:
  up to 64 letters, digits, '.', '\_' or '-'; starts alphanumeric, no
  '..'. Session number, size and extension remain; collisions get -2,
  -3, etc. NULL omits it.

- pinned_genes:

  (array, optional) Genes drawn as pinned expression rows at the top, in
  pin order, excluded from clustering (the screen's Pinned expression).
  Pins and mutation strips share an 8-track limit. NULL omits it.

- preset:

  (string, optional) Bundled gene-set preset name, exactly as listed.
  Supply exactly one of genes, preset and from_differential_expression.
  NULL omits it.

- recipe:

  (boolean, optional; default false) Write an app recipe that reopens
  this analysis and return recipe.path. NULL omits it.

- show_caption_color_keys:

  (boolean, optional; default true) Figure style: a table caption
  carries the sentence explaining the figure's colors. NULL omits it.

- show_dendrograms:

  (boolean, optional; default true) Draw the gene and sample trees of a
  clustered axis (the screen's Show dendrograms). NULL omits it.

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

- top_n:

  (integer, optional; default 25; range 1..100) With
  from_differential_expression: genes per direction. Notices disclose
  when fewer genes rank. NULL omits it.

- width_in:

  (number, optional; range 1..40) Custom figure width in inches (with
  the other side; instead of size). The app's size control range. NULL
  omits it.

- z_normalize:

  (boolean, optional; default true) Z-score each gene across samples
  (the screen's Z-normalize per gene). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `tcga_heatmap` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-heatmap-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
