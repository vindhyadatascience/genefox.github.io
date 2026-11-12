# Draw a free public GEO heatmap from a whole series matrix

Draw a free public GEO heatmap from a whole series matrix. Supply genes,
exact probes or a preset; optional strips, groups and exclusions.
Missing data, annotation overflow and workload-limited clustering are
disclosed. Descriptive; CSV has displayed values.

## Usage

``` r
gf_geo_heatmap(
    session,
    `accession`,
    `annotations` = NULL,
    `cluster_columns` = NULL,
    `cluster_rows` = NULL,
    `csv` = NULL,
    `dpi` = NULL,
    `exclude_low_depth` = NULL,
    `exclude_samples` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `genes` = NULL,
    `group_by` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `identifier_column` = NULL,
    `inline_image` = NULL,
    `keep_groups` = NULL,
    `low_depth_fraction` = NULL,
    `normalization` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `preset` = NULL,
    `probes` = NULL,
    `show_caption_color_keys` = NULL,
    `show_dendrograms` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `supplementary_file` = NULL,
    `survival_detail` = NULL,
    `survival_median_lines` = NULL,
    `width_in` = NULL,
    `z_normalize` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- accession:

  (string) GEO series accession.

- annotations:

  (array, optional) NULL omits it.

- cluster_columns:

  (boolean, optional; default true) Cluster samples within the measured
  workload limit. NULL omits it.

- cluster_rows:

  (boolean, optional; default true) Cluster genes within the measured
  workload limit. NULL omits it.

- csv:

  (boolean, optional; default false) Also write the screen's CSV export
  (the app's own rows) under the output directory and return csv.path.
  NULL omits it.

- dpi:

  (integer, optional; default 300; range 72..1200) Resolution of a
  custom size (at most 8,192 px a side and 16 MP). NULL omits it.

- exclude_low_depth:

  (boolean, optional; default false) For integer counts, drop samples
  below low_depth_fraction of median library size before normalization;
  flagged in data.library_sizes and caption. NULL omits it.

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

- genes:

  (array, optional) Gene symbols, resolved through the series platform
  annotation; multiple exact-symbol probes use highest whole-source
  finite-raw sample variance before filtering/normalization, with
  choices disclosed. Exactly one of genes, probes and preset. NULL omits
  it.

- group_by:

  (string, optional) Characteristic whose levels keep_groups selects;
  does not change expression values. NULL omits it.

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

  (array, optional) Show only these groups of group_by, copied exactly
  from a previous call's levels (the screen's group filter). Statistics
  (r, r², n, the group test and its df) are recomputed on the retained
  samples with the other levels dropped, as R's droplevels(subset(...));
  a level not in the data is refused, never ignored. NULL omits it.

- low_depth_fraction:

  (number, optional; default 0.1; range 0.001..0.999) Low-depth
  threshold as a fraction of the median library size (default 0.1). NULL
  omits it.

- normalization:

  (string, optional; one of "raw", "log2", "tpm", "cpm", "log_cpm";
  default "raw") Author values, log2(x+1), supplied TPM, or GeneFox
  CPM/log-CPM (integer counts, full-source library sizes; no TMM). NULL
  omits it.

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

  (string, optional) Bundled gene-set preset name; exactly one of genes,
  probes and preset. NULL omits it.

- probes:

  (array, optional) NULL omits it.

- show_caption_color_keys:

  (boolean, optional; default true) Figure style: a table caption
  carries the sentence explaining the figure's colors. NULL omits it.

- show_dendrograms:

  (boolean, optional; default true) Display the trees found by the
  analysis; never changes order. NULL omits it.

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

- z_normalize:

  (boolean, optional; default true) Per-gene z-score after base
  normalization, across retained samples. NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_heatmap` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-heatmap-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
