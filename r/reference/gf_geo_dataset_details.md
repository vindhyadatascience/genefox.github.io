# A GEO series' record as GeneFox's dataset detail screen shows it: title, summary, organism, platform...

A GEO series' record as GeneFox's dataset detail screen shows it: title,
summary, organism, platform (accession and title), PubMed ids,
SuperSeries/SubSeries relations, sample count and the sample table
(accession + title, 200 per page from sample_offset), GeneFox's
usability prediction, and the GEO page / SOFT / supplementary links.
Call this before geo_series_expression to see the samples. Latency: 1-5
s. No figure.

## Usage

``` r
gf_geo_dataset_details(
    session,
    `accession`,
    `sample_offset` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- accession:

  (string) GEO series accession, e.g. GSE62564.

- sample_offset:

  (integer, optional; default 0; range 0..1000000) Index of the first
  sample row to return (pages of 200; next_sample_offset gives the next
  page). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_dataset_details` tool. The runtime validates every argument
and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-dataset-details-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
