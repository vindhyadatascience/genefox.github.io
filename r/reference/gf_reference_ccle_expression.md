# One gene's expression across the CCLE cancer cell lines (Treehouse Cell Line Compendium v1, log2(TPM+1)),...

One gene's expression across the CCLE cancer cell lines (Treehouse Cell
Line Compendium v1, log2(TPM+1)), as GeneFox's Reference › Cell Lines
screen shows it: the distribution and its 7-statistic table, and the
cell lines grouped by TCGA acronym, tissue, disease, histology or
subtype with the screen's Mann-Whitney/Kruskal-Wallis banner and
post-hoc summary, the top cell lines, and the grouped figure (box,
violin or strip) or the histogram. csv and recipe as the screen exports
them. Latency: 5-30 s cold (the cell-line index), seconds after. Both
figures are the app screen's PNG export.

## Usage

``` r
gf_reference_ccle_expression(
    session,
    `gene`,
    `csv` = NULL,
    `dpi` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `geometry` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `inline_image` = NULL,
    `keep_groups` = NULL,
    `limit` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `recipe` = NULL,
    `saved_chart` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
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

- gene:

  (string) HGNC gene symbol, e.g. SOX10. Upper-cased, as the screen
  does.

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

- geometry:

  (string, optional; one of "box", "strip", "violin", "histogram")
  Grouped: box (default), violin or strip; stratify=none: histogram. bar
  and median_bar read as box with a caveat. NULL omits it.

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

  (array, optional) Show only these groups of stratify, copied exactly
  from a previous call's levels (the screen's group filter). Statistics
  (r, r², n, the group test and its df) are recomputed on the retained
  samples with the other levels dropped, as R's droplevels(subset(...));
  a level not in the data is refused, never ignored. NULL omits it.

- limit:

  (integer, optional; default 25; range 1..200) How many of the
  highest-expressing cell lines to list (the screen's table shows 200).
  NULL omits it.

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

- saved_chart:

  (string, optional; one of "box", "strip", "violin") With a histogram
  export, retain this grouped chart control in its recipe. NULL omits
  it.

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

- stratify:

  (string, optional; one of "none", "tcga", "tissue", "disease",
  "histology", "subtype"; default "tissue") Group the cell lines by:
  none, tcga (TCGA acronym), tissue (the screen default), disease,
  histology or subtype. NULL omits it.

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
for the `reference_ccle_expression` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/reference-ccle-expression-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
