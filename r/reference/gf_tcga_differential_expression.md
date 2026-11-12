# Two-group differential expression on a gene panel in one TCGA or other GDC cohort, as GeneFox's...

Two-group differential expression on a gene panel in one TCGA or other
GDC cohort, as GeneFox's Differential screen computes it: per-gene
two-sided Mann-Whitney on one mean per patient, Benjamini-Hochberg over
the WHOLE requested panel (unresolved or underpowered genes kept at p =
1), the volcano, the ranked table and the CSV. Four contrasts (each
offered where the data allows): tumor_vs_normal (baseline tumors vs GTEx
donors of the matched tissue, TOIL hub), expression_high_low (median
split of split_gene), subgroup (two levels of a clinical factor or
molecular subtype), mutation_status (split_gene Mutant vs WT). Panel:
genes (2-80), a bundled preset, or the screen's default panel. csv,
recipe, html. Latency: 10-60 s cold. The figure is the app screen's PNG
export.

## Usage

``` r
gf_tcga_differential_expression(
    session,
    `project`,
    `arm_order` = NULL,
    `csv` = NULL,
    `dpi` = NULL,
    `factor` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `genes` = NULL,
    `group1` = NULL,
    `group2` = NULL,
    `gtex_tissue` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `inline_image` = NULL,
    `log2fc_cutoff` = NULL,
    `mode` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `preset` = NULL,
    `q_cutoff` = NULL,
    `recipe` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `sort` = NULL,
    `split_gene` = NULL,
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

- arm_order:

  (string, optional; one of "high_first", "low_first", "mutant_first",
  "wt_first") expression_high_low: high_first (default) or low_first;
  mutation_status: mutant_first (default) or wt_first. The second order
  inverts fold changes. NULL omits it.

- csv:

  (boolean, optional; default false) Also write the screen's CSV export
  (the app's own rows) under the output directory and return csv.path.
  NULL omits it.

- dpi:

  (integer, optional; default 300; range 72..1200) Resolution of a
  custom size (at most 8,192 px a side and 16 MP). NULL omits it.

- factor:

  (string, optional; one of "subtype", "sex_at_birth", "vital_status",
  "stage", "race", "ethnicity", "age_group", "diagnosis",
  "disease_type", "grade") subgroup: factor whose two levels are
  compared. Default Stage, or the first comparable factor in the cohort.
  NULL omits it.

- figure:

  (boolean, optional; default true) Draw the figure and return its PNG
  path. NULL omits it.

- format:

  (string, optional; one of "png", "svg", "tiff"; default "png") Figure
  format: png (raster, default), svg (vector with editable text), or
  tiff (raster, .tif); one per run. NULL omits it.

- genes:

  (array, optional) 2 to 80 distinct gene symbols, canonicalized via the
  human symbol/alias reference and de-duplicated; tokens and dataset
  mappings remain inspectable. At most one of genes and preset; neither
  uses the default panel. NULL omits it.

- group1:

  (string, optional) subgroup: first testable level (Group 1; see
  data.levels). With group2, or neither: first two testable levels.
  Unicode allowed; control and format characters refused. NULL omits it.

- group2:

  (string, optional) subgroup: second level (Group 2); swapping groups
  inverts fold changes. Unicode allowed; control and format characters
  refused. NULL omits it.

- gtex_tissue:

  (string, optional) tumor_vs_normal: one mapped GTEx tissue, required
  if several map. Donor means use only this tissue, not pooled tissues.
  NULL omits it.

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

- log2fc_cutoff:

  (number, optional; default 1; range 0..3) The \|Δ mean log₂
  expression\| shading threshold (0 to 3); it does not enter the test.
  NULL omits it.

- mode:

  (string, optional; one of "tumor_vs_normal", "expression_high_low",
  "subgroup", "mutation_status") Contrast; default tumor_vs_normal where
  offered for the cohort, otherwise subgroup. NULL omits it.

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

  (string, optional) The name of one of the app's bundled gene-set
  presets (the panel's Load preset… menu), exactly as listed. NULL omits
  it.

- q_cutoff:

  (number, optional; default 0.05; range 0.0001..1) The BH q threshold
  (the screen's FDR slider range, 0.0001 to 1). It never enters the
  test. NULL omits it.

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

- sort:

  (string, optional; one of "q", "effect"; default "q") On-screen table
  order: q (p then symbol) or effect (\|Δ\| descending). CSV and report
  tables retain kernel order. NULL omits it.

- split_gene:

  (string, optional) expression_high_low: gene for patient-level median
  split; mutation_status: gene for non-silent Mutant vs WT split. NULL
  omits it.

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
for the `tcga_differential_expression` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-differential-expression-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
