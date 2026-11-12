# An ArrayExpress study's record as GeneFox's source reads it: title, organism, platform, sample count,...

An ArrayExpress study's record as GeneFox's source reads it: title,
organism, platform, sample count, experimental design, SDRF factors, and
whether a processed expression matrix exists. Series with raw data only
(all four Open TG-GATEs series) are reported as not loadable, with their
metadata still listed. Latency: 2-10 s. Free; no Pro capability.

## Usage

``` r
gf_arrayexpress_details(
    session,
    `accession`,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- accession:

  (string) ArrayExpress accession, e.g. E-MTAB-797.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `arrayexpress_details` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/arrayexpress-details-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
