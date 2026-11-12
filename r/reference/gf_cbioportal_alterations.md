# How often one gene is altered in a curated cBioPortal study, as GeneFox's cBioPortal screen reports it:...

How often one gene is altered in a curated cBioPortal study, as
GeneFox's cBioPortal screen reports it: mutated, amplified, deep-deleted
and unaltered among the samples the portal lists as PROFILED for the
gene (the denominator), with mutation classes and the screen's coverage
caveat and independently resolved gene-panel membership. Study-wide: not
restricted to a cancer-type subset (the screen's subset applies to
expression only). No figure (the screen shows rows). Latency: 5-60 s.

## Usage

``` r
gf_cbioportal_alterations(
    session,
    `gene`,
    `study_id`,
    `portal` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- gene:

  (string) HGNC gene symbol, e.g. CLDN18. Upper-cased, as the app does.

- study_id:

  (string) Curated study id from cbioportal_studies in its catalog
  portal. Uncurated ids are refused with closest matches.

- portal:

  (string, optional; one of "public", "ccdi", "pedcbioportal") public
  (cBioPortal), ccdi (CCDI cBioPortal, pediatric) or pedcbioportal
  (refused: it needs a personal data-access token, which this server
  never takes). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `cbioportal_alterations` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/cbioportal-alterations-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
