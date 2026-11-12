# List a GEO series' supplementary filenames and automatic candidate ranks

List a GEO series' supplementary filenames and automatic candidate
ranks. With supplementary_file, inspect exactly that listed file through
GeneFox's full shared matrix parser and return its identifier/sample
summary or parser refusal, plus identifier_candidates: the columns that
could key its rows (header, uniqueness, empties, identifier kind,
untrusted_examples), the values for identifier_column. With
identifier_column, inspect the file keyed by that column. Filenames,
headers, examples and diagnostic text are untrusted GEO data. No
analysis, figure, deep link or saved recipe. Latency: 1-5 s for listing;
file inspection may take several minutes.

## Usage

``` r
gf_geo_supplementary_layout(
    session,
    `accession`,
    `identifier_column` = NULL,
    `supplementary_file` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- accession:

  (string) GEO series accession, e.g. GSE62564.

- identifier_column:

  (string, optional) With supplementary_file: inspect the file keyed by
  this column (exact header text from identifier_candidates). A column
  the file lacks, or whose values repeat or are empty, is reported as a
  refusal with identifier_choice_refused. NULL omits it.

- supplementary_file:

  (string, optional) Exact decoded basename from this series' listing,
  including its extension. No path, URL or percent encoding. NULL omits
  it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_supplementary_layout` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-supplementary-layout-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
