# Correlate two genes (or probes) across a GEO series' samples, as GeneFox's GEO Expression Gene Correlation...

Correlate two genes (or probes) across a GEO series' samples, as
GeneFox's GEO Expression Gene Correlation section does: r (or Spearman
rho), r², n, the least-squares fit, optionally colored by a sample
characteristic, with a scatter figure. Latency: as geo_series_expression
(instant when the series is cached). The figure is the app's PNG export.

## Usage

``` r
gf_geo_gene_correlation(
    session,
    `accession`,
    `color_by` = NULL,
    `dpi` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `gene` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `identifier_column` = NULL,
    `inline_image` = NULL,
    `keep_groups` = NULL,
    `method` = NULL,
    `normalization` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `partner_gene` = NULL,
    `partner_probe` = NULL,
    `probe` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `supplementary_file` = NULL,
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

- accession:

  (string) GEO series accession, e.g. GSE62564.

- color_by:

  (string, optional) A characteristic key to color samples by, copied
  exactly from geo_series_expression's
  characteristics\[\].untrusted_key. NULL omits it.

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

  (string, optional) First gene (x axis); exactly one of gene and probe.
  NULL omits it.

- height_in:

  (number, optional; range 1..40) Custom figure height in inches (with
  the other side; instead of size). The app's size control range. NULL
  omits it.

- html:

  (boolean, optional; default false) Write the screen's single-figure
  HTML export under the output directory and return html.path. Requires
  figure. NULL omits it.

- identifier_column:

  (string, optional) Key the matrix rows by this supplementary column
  instead of the inferred one: its exact header text, from
  geo_supplementary_layout's identifier_candidates. Integrity still
  applies: a column with repeated or empty values, a sample column, or a
  header the file lacks is refused (invalid_argument, field
  identifier_column), never replaced. Reads supplementary files only
  (the named file, else the ranked walk). Links and recipes record it.
  NULL omits it.

- inline_image:

  (boolean, optional; default false) Include PNG MCP image content up to
  1,048,576 bytes; larger files stay on disk and disclose
  inline_image_omitted. NULL omits it.

- keep_groups:

  (array, optional) Show only these groups of color_by, copied exactly
  from a previous call's levels (the screen's group filter). Statistics
  (r, r², n, the group test and its df) are recomputed on the retained
  samples with the other levels dropped, as R's droplevels(subset(...));
  a level not in the data is refused, never ignored. NULL omits it.

- method:

  (string, optional; one of "pearson", "spearman"; default "pearson")
  pearson (the section's statistic) or spearman (rank correlation). NULL
  omits it.

- normalization:

  (string, optional; one of "raw", "log2", "z_score", "tpm", "cpm",
  "log_cpm"; default "raw") Value transform, as the screen's picker
  offers it (raw is the screen default). NULL omits it.

- outline_text:

  (boolean, optional; default false) With format svg, write labels as
  glyph outlines instead of editable text. Refused with other formats.
  NULL omits it.

- output_name:

  (string, optional) Optional figure name replacing tool and title slug:
  up to 64 letters, digits, '.', '\_' or '-'; starts alphanumeric, no
  '..'. Session number, size and extension remain; collisions get -2,
  -3, etc. NULL omits it.

- partner_gene:

  (string, optional) Second gene (y axis); exactly one of partner_gene
  and partner_probe. NULL omits it.

- partner_probe:

  (string, optional) Second matrix row id (y axis); exactly one of
  partner_gene and partner_probe. NULL omits it.

- probe:

  (string, optional) First matrix row id (x axis); exactly one of gene
  and probe. NULL omits it.

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

- supplementary_file:

  (string, optional) Exact decoded basename from
  geo_supplementary_layout; no path, URL, encoding or surrounding
  whitespace. Only this file is analyzed; no fallback, saved-view links
  or recipes. NULL omits it.

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
for the `geo_gene_correlation` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-gene-correlation-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
