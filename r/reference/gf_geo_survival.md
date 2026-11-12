# Kaplan-Meier survival from a GEO series' own sample metadata, as GeneFox's GEO Survival section computes...

Kaplan-Meier survival from a GEO series' own sample metadata, as
GeneFox's GEO Survival section computes it, in two steps. First call
with just accession (and optionally gene/probe) to list the candidate
follow-up time columns and status columns with their values. Then call
with time_key, time_unit, event_key and event_values (which status
values mean the event occurred) to compute: all samples, or split at the
median of the gene/probe with GeneFox's eligibility-gated log-rank;
split_scheme=tertiles\|quartiles with split_comparison=extremes\|all
uses the TCGA Survival tab's quantile split over the endpoint-eligible
samples (type-7 cuts, ties lower, extremes log-rank + Cox or k-group +
trend log-rank). Latency: the matrix download when cold, then instant.
Numbers and figure match the app's section (a quantile split's figure is
drawn by the same engine; the section offers the median only).

## Usage

``` r
gf_geo_survival(
    session,
    `accession`,
    `dpi` = NULL,
    `event_key` = NULL,
    `event_values` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `gene` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `identifier_column` = NULL,
    `inline_image` = NULL,
    `normalization` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `probe` = NULL,
    `recipe` = NULL,
    `scrub_at_years` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `split_by_expression` = NULL,
    `split_comparison` = NULL,
    `split_scheme` = NULL,
    `supplementary_file` = NULL,
    `survival_detail` = NULL,
    `survival_median_lines` = NULL,
    `time_key` = NULL,
    `time_unit` = NULL,
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

- dpi:

  (integer, optional; default 300; range 72..1200) Resolution of a
  custom size (at most 8,192 px a side and 16 MP). NULL omits it.

- event_key:

  (string, optional) The status column, copied exactly from a discover
  call's status_keys\[\].untrusted_key. NULL omits it.

- event_values:

  (array, optional) Event-observed values from the column's
  untrusted_values; all others are censored. NULL omits it.

- figure:

  (boolean, optional; default true) Draw the figure and return its PNG
  path. NULL omits it.

- format:

  (string, optional; one of "png", "svg", "tiff"; default "png") Figure
  format: png (raster, default), svg (vector with editable text), or
  tiff (raster, .tif); one per run. NULL omits it.

- gene:

  (string, optional) Gene symbol to split at the median (at most one of
  gene and probe; omit both for the whole-series curve). NULL omits it.

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

- normalization:

  (string, optional; one of "raw", "log2", "z_score", "tpm", "cpm",
  "log_cpm"; default "raw") The value transform the split reads (the
  screen's picker; raw is its default). NULL omits it.

- outline_text:

  (boolean, optional; default false) With format svg, write labels as
  glyph outlines instead of editable text. Refused with other formats.
  NULL omits it.

- output_name:

  (string, optional) Optional figure name replacing tool and title slug:
  up to 64 letters, digits, '.', '\_' or '-'; starts alphanumeric, no
  '..'. Session number, size and extension remain; collisions get -2,
  -3, etc. NULL omits it.

- probe:

  (string, optional) Matrix row id to split at the median. NULL omits
  it.

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

- split_by_expression:

  (boolean, optional; default true) With a gene or probe, split at its
  median (the section's toggle, on by default). NULL omits it.

- split_comparison:

  (string, optional; one of "extremes", "all"; default "extremes")
  Tertiles/quartiles: extremes compares top vs bottom (log-rank and Cox;
  middle samples excluded); all draws every group with k-group log-rank
  and log-rank trend tests. Median requires extremes. NULL omits it.

- split_scheme:

  (string, optional; one of "median", "tertiles", "quartiles"; default
  "median") With a gene or probe and split_by_expression: median
  (default), tertiles or quartiles of endpoint-eligible values; type-7
  cuts, ties lower. Groups under 3 samples refuse. NULL omits it.

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

- time_key:

  (string, optional) The follow-up time column, copied exactly from a
  discover call's time_keys\[\].untrusted_key. NULL omits it.

- time_unit:

  (string, optional; one of "days", "weeks", "months", "years"; default
  "months") What the time column counts (the section's picker; months is
  its default). NULL omits it.

- width_in:

  (number, optional; range 1..40) Custom figure width in inches (with
  the other side; instead of size). The app's size control range. NULL
  omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_survival` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-survival-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
