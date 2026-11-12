# Survival of a TCGA/GDC project's patients (Kaplan-Meier; eligible two-group log-rank, Cox HR for...

Survival of a TCGA/GDC project's patients (Kaplan-Meier; eligible
two-group log-rank, Cox HR for expression splits), with its figure. With
neither stratify nor gene it is the whole-cohort (overall) curve every
survival screen opens on. stratify=expression (implied by a gene with no
stratify) splits patients at the median of one gene with the Survival
tab's analysis (OS from GDC clinical follow-up); split_on=methylation
splits on that gene's methylation instead, and split_on=cnv on its copy
number, with the same analysis (both OS only, TCGA only); DSS, PFI and
DFI are the Survival tab's PanCanAtlas endpoints (TCGA only).
stratify=none is the Survival tab's whole-cohort curve for any outcome
(no gene). Clinical stratify uses GDC case fields; mutation splits
non-silent mutation status for gene. split_scheme=tertiles\|quartiles
with split_comparison=extremes\|all uses the Survival tab, with shared
cut points, exclusions, omnibus/trend tests and ordered hues (expression
and methylation; CNV stays median-only by design). Clinical/mutation
splits use the Survival tab's analysis for every endpoint (the app's
PNG). csv / recipe write the screen's export. Latency: 5-30 s cold.
Figures: the Survival tab's median, whole-cohort, categorical and
quantile curves are the app's PNG exports, and a median CNV or
methylation split is the Expression screen's survival report PNG; a
methylation quantile figure is drawn by the same engine but has no app
screen.

## Usage

``` r
gf_tcga_survival(
    session,
    `project`,
    `csv` = NULL,
    `dpi` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `gene` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `inline_image` = NULL,
    `outcome` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `recipe` = NULL,
    `scrub_at_years` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `split_comparison` = NULL,
    `split_on` = NULL,
    `split_scheme` = NULL,
    `stratify` = NULL,
    `stratify_derived` = NULL,
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
  "WCDT-MCRPC") TCGA/TARGET project id, e.g. TCGA-KIRC.

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

- gene:

  (string, optional) HGNC gene symbol, required for expression or
  mutation survival and forbidden for clinical or none. Upper-cased.
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

- outcome:

  (string, optional; one of "OS", "DSS", "PFI", "DFI"; default "OS") OS
  (overall survival, GDC clinical; default), or PanCanAtlas DSS
  (disease-specific), PFI (progression-free interval), DFI (disease-free
  interval). DSS/PFI/DFI require TCGA. NULL omits it.

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

- scrub_at_years:

  (array, optional) Read the Kaplan-Meier figure at these times (years,
  each finite and at least 0; at most 20), as the app's hover card does:
  each time snaps to the nearest curve point and returns, per arm,
  survival and the number at risk AT the snapped time, plus the card's
  text. Answered in data.scrub, in request order. NULL omits it.

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
  Tertiles/quartiles: extremes compares top vs bottom and counts
  excluded middle patients; all draws every group with omnibus and trend
  log-rank tests. Median requires extremes. NULL omits it.

- split_on:

  (string, optional; one of "expression", "cnv", "methylation"; default
  "expression") For stratify=expression: expression (default), cnv
  (gene-level GISTIC2), or methylation (mean HM450 beta). cnv and
  methylation require OS and TCGA. NULL omits it.

- split_scheme:

  (string, optional; one of "median", "tertiles", "quartiles"; default
  "median") Expression and methylation: median (default), tertiles, or
  quartiles. CNV is median only. NULL omits it.

- stratify:

  (string, optional; one of "expression", "none", "mutation",
  "sex_at_birth", "stage", "race", "ethnicity", "age_group",
  "diagnosis", "disease_type", "grade"; default "none") none: whole
  cohort (default without gene); expression: gene median split (default
  with gene); mutation: Mutant vs WT. Clinical factors use case fields
  without gene. Vital status, sample type and molecular subtype
  forbidden. NULL omits it.

- stratify_derived:

  (object, optional) Group by a derived variable instead of a stratify
  factor (GeneFox's derived-variable recipe). sourceColumn is
  age_at_index with a numeric_threshold rule (bins the age itself), or a
  case-level factor token (gender, vital_status, stage, race, ethnicity,
  age_group, diagnosis, disease_type, grade) with a category_merge rule
  over that factor's labels. One factor only: no stratify,
  stratify_secondary or keep_groups beside it, and no saved recipe or
  link. NULL omits it.

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
for the `tcga_survival` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-survival-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
