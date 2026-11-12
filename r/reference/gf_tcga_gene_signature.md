# Score a gene SET across one TCGA or other GDC cohort, as GeneFox's Gene Signature screen does: every gene...

Score a gene SET across one TCGA or other GDC cohort, as GeneFox's Gene
Signature screen does: every gene resolved to one Ensembl row or the
whole set refused, the genes x samples matrix, one of five estimators
(mean log2(TPM+1), mean Z-score, standardized Z-sum, cohort rank mean,
within-sample transcriptome rank), the score distribution, the scores
grouped by a clinical/sample factor (incl. another gene's mutation
status) with the screen's table, and the survival association of the
score's median split (Kaplan-Meier, log-rank, Cox; OS, or DSS/PFI/DFI
for TCGA), or with split_scheme=tertiles\|quartiles and
split_comparison=extremes\|all the TCGA Survival tab's quantile split of
the score (extremes log-rank + Cox, or k-group + trend log-rank). genes
or one of the app's bundled presets. csv, recipe, html. Latency: 10-60 s
cold; within_sample_transcriptome_rank streams the whole Xena gene
universe (minutes). The figures are the app screen's PNG exports.

## Usage

``` r
gf_tcga_gene_signature(
    session,
    `project`,
    `csv` = NULL,
    `dpi` = NULL,
    `figure` = NULL,
    `figure_kind` = NULL,
    `format` = NULL,
    `genes` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `inline_image` = NULL,
    `method` = NULL,
    `mutation_gene` = NULL,
    `name` = NULL,
    `outcome` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `preset` = NULL,
    `recipe` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `split_comparison` = NULL,
    `split_scheme` = NULL,
    `stratify` = NULL,
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

- figure_kind:

  (string, optional; one of "distribution", "grouped", "survival")
  Figure: distribution (score histogram; ungrouped default), grouped
  (box plot; default with stratify) or survival (Kaplan-Meier). NULL
  omits it.

- format:

  (string, optional; one of "png", "svg", "tiff"; default "png") Figure
  format: png (raster, default), svg (vector with editable text), or
  tiff (raster, .tif); one per run. NULL omits it.

- genes:

  (array, optional) At least 2 distinct gene symbols, canonicalized via
  the approved-symbol/curated-alias reference and de-duplicated;
  original tokens and mapping provenance remain in gene_resolution.
  Exactly one of genes and preset. NULL omits it.

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

- method:

  (string, optional; one of "mean_raw", "mean_z_score",
  "standardized_z_sum", "mean_expression_rank",
  "within_sample_transcriptome_rank") The estimator (the screen's
  Scoring Method picker). Default mean_z_score, or the preset's
  recommended method. NULL omits it.

- mutation_gene:

  (string, optional) With stratify=mutation: the gene whose non-silent
  mutation status splits patients (Mutant vs WT). NULL omits it.

- name:

  (string, optional) The signature's name (the screen's Signature Name
  field); default "Signature (n genes)", or the preset's name. NULL
  omits it.

- outcome:

  (string, optional; one of "OS", "DSS", "PFI", "DFI"; default "OS") The
  survival association's endpoint: OS (GDC clinical follow-up), or
  DSS/PFI/DFI (PanCanAtlas, TCGA only). NULL omits it.

- outline_text:

  (boolean, optional; default false) With format svg, write labels as
  glyph outlines instead of editable text. Refused with other formats.
  NULL omits it.

- output_name:

  (string, optional) Optional figure name replacing tool and title slug:
  up to 64 letters, digits, '.', '\_' or '-'; starts alphanumeric, no
  '..'. Session number, size and extension remain; collisions get -2,
  -3, etc. NULL omits it.

- preset:

  (string, optional) Bundled gene-set preset name exactly as returned by
  list_signature_presets; its recommended method is the default. Exactly
  one of genes and preset. NULL omits it.

- recipe:

  (boolean, optional; default false) Write an app recipe that reopens
  this analysis and return recipe.path. NULL omits it.

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

- split_comparison:

  (string, optional; one of "extremes", "all"; default "extremes")
  Tertiles/quartiles: extremes compares top vs bottom (log-rank and Cox;
  middle patients excluded); all draws every group with k-group log-rank
  and log-rank trend tests. Median requires extremes. NULL omits it.

- split_scheme:

  (string, optional; one of "median", "tertiles", "quartiles"; default
  "median") median (default), tertiles or quartiles of endpoint-eligible
  scores; type-7 cuts, ties lower. Groups under 3 patients refuse. Saved
  view, link and recipe record the split. NULL omits it.

- stratify:

  (string, optional; one of "none", "sample_type", "subtype",
  "mutation", "sex_at_birth", "vital_status", "stage", "race",
  "ethnicity", "age_group", "diagnosis", "disease_type", "grade";
  default "sample_type") Group scores by this factor (default:
  sample_type); none for an ungrouped distribution. mutation needs
  mutation_gene. NULL omits it.

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
for the `tcga_gene_signature` tool. The runtime validates every argument
and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-gene-signature-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
