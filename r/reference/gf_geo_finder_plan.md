# Plan GEO searches without executing them or using a model

Plan GEO searches without executing them or using a model. Returns
intent and one or two geo_search suggestions: the key terms with smart
search on, and the organism the question names; sample-size/comparison
hints are advisory. No conversation or cloud consent path.

## Usage

``` r
gf_geo_finder_plan(
    session,
    `text`,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- text:

  (string) Nonempty dataset-finder question; maximum 4096 UTF-8 bytes
  before trimming. Topic must fit geo_search's 200-character query
  schema.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_finder_plan` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-finder-plan-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
