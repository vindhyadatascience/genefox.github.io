# Search EMBL-EBI ArrayExpress (BioStudies) for expression studies, as GeneFox's ArrayExpress source does,...

Search EMBL-EBI ArrayExpress (BioStudies) for expression studies, as
GeneFox's ArrayExpress source does, returning accession, title and
release date for each. Open TG-GATEs (toxicogenomics) lives here, not on
GEO. Call arrayexpress_details on a hit before loading. Latency: 1-5 s.
Free; no Pro capability.

## Usage

``` r
gf_arrayexpress_search(
    session,
    `query`,
    `limit` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- query:

  (string) Free text, e.g. 'TG-GATEs' or a compound name.

- limit:

  (integer, optional; default 10; range 1..20) How many results to
  return (1-20). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `arrayexpress_search` tool. The runtime validates every argument
and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/arrayexpress-search-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
