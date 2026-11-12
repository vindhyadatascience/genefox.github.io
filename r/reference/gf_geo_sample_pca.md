# Project a GEO series' samples onto PC1 x PC2, as GeneFox's sample PCA screen does (top 2,000 most variable...

Project a GEO series' samples onto PC1 x PC2, as GeneFox's sample PCA
screen does (top 2,000 most variable rows by default, or top_genes;
optional log2(x+1), gene scaling), optionally colored by a sample
characteristic or by one gene's expression, with sample exclusions;
optionally the scree series, the genes most correlated with each PC and
their loadings, and the biplot. Returns variance explained, per-sample
scores, the scatter and requested section figures and optionally their
CSVs. Latency: the matrix download when cold, then seconds. The figure
is the app's GEO › Sample PCA PNG export.

## Usage

``` r
gf_geo_sample_pca(
    session,
    `accession`,
    `biplot` = NULL,
    `color_by` = NULL,
    `color_gene` = NULL,
    `color_probe` = NULL,
    `correlated_genes` = NULL,
    `csv` = NULL,
    `dpi` = NULL,
    `exclude_low_depth` = NULL,
    `exclude_samples` = NULL,
    `figure` = NULL,
    `format` = NULL,
    `height_in` = NULL,
    `html` = NULL,
    `identifier_column` = NULL,
    `inline_image` = NULL,
    `keep_groups` = NULL,
    `log_transform` = NULL,
    `low_depth_fraction` = NULL,
    `normalization` = NULL,
    `outline_text` = NULL,
    `output_name` = NULL,
    `scale_genes` = NULL,
    `scree` = NULL,
    `show_caption_color_keys` = NULL,
    `show_figure_legends` = NULL,
    `show_row_counts` = NULL,
    `size` = NULL,
    `supplementary_file` = NULL,
    `survival_detail` = NULL,
    `survival_median_lines` = NULL,
    `top_genes` = NULL,
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

- biplot:

  (boolean, optional; default false) Overlay the top 8 gene loading
  vectors on the figure (the screen's biplot; runs the correlated-genes
  solve). NULL omits it.

- color_by:

  (string, optional) Color by exact geo_series_expression
  characteristics\[\].untrusted_key. Use at most one of color_by,
  color_gene and color_probe. NULL omits it.

- color_gene:

  (string, optional) Color by this gene's expression (quantile bins),
  resolved as geo_series_expression resolves a gene (an ambiguous symbol
  lists its rows). NULL omits it.

- color_probe:

  (string, optional) Color by this matrix row's expression (quantile
  bins). NULL omits it.

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

  (array, optional) Show only these groups of color_by; the PCA is
  recomputed on the retained samples, copied exactly from a previous
  call's levels (the screen's group filter). Statistics (r, r², n, the
  group test and its df) are recomputed on the retained samples with the
  other levels dropped, as R's droplevels(subset(...)); a level not in
  the data is refused, never ignored. NULL omits it.

- log_transform:

  (boolean, optional) Apply log2(x+1) before PCA. Default: the screen's
  (on for a linear-scale matrix without negative values). NULL omits it.

- low_depth_fraction:

  (number, optional; default 0.1; range 0.001..0.999) Low-depth
  threshold as a fraction of the median library size (default 0.1). NULL
  omits it.

- normalization:

  (string, optional; one of "none", "cpm", "log_cpm"; default "none")
  cpm or log_cpm require non-negative integer counts (edgeR::cpm,
  prior.count 2 for log_cpm; column-sum library sizes, no TMM). log_cpm
  is log2; leave log_transform off. NULL omits it.

- outline_text:

  (boolean, optional; default false) With format svg, write labels as
  glyph outlines instead of editable text. Refused with other formats.
  NULL omits it.

- output_name:

  (string, optional) Optional figure name replacing tool and title slug:
  up to 64 letters, digits, '.', '\_' or '-'; starts alphanumeric, no
  '..'. Session number, size and extension remain; collisions get -2,
  -3, etc. NULL omits it.

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

- top_genes:

  (integer, optional; default 2000; range 2..100000) Most variable rows
  retained (screen: 2,000). Counts exceeding PCA workspace memory budget
  are refused (response_too_large). NULL omits it.

- width_in:

  (number, optional; range 1..40) Custom figure width in inches (with
  the other side; instead of size). The app's size control range. NULL
  omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_sample_pca` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-sample-pca-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
