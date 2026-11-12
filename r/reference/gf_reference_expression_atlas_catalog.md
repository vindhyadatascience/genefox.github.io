# The Expression Atlas experiments GeneFox's Reference › Expression Atlas picker offers: its three curated...

The Expression Atlas experiments GeneFox's Reference › Expression Atlas
picker offers: its three curated baseline experiments, then every human
baseline experiment in the live Atlas catalog, sorted by description
(when the catalog cannot be reached, only the three curated ones, as on
the screen, with the failure in catalogue_failure). Optional search
(accession or description text) and limit. Use an accession with
reference_expression_atlas. Latency: 2-10 s cold, cached for an hour.

## Usage

``` r
gf_reference_expression_atlas_catalog(
    session,
    `limit` = NULL,
    `search` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- limit:

  (integer, optional; default 100; range 1..500) How many experiments to
  list. NULL omits it.

- search:

  (string, optional) Keep experiments whose accession or description
  contains this text (case-insensitive). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `reference_expression_atlas_catalog` tool. The runtime validates
every argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/reference-expression-atlas-catalog-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
