# Compare protein-altering mutations in one gene across 1–32 curated cBioPortal studies in one portal

Compare protein-altering mutations in one gene across 1–32 curated
cBioPortal studies in one portal. Uses gene-assayed sample denominators
and complete mutation/fetch pagination. Choose molecular_profile_id when
a study has several mutation profiles. Study/sample observations are
separate, not pooled unique patients; missing profiles and empty assay
cohorts remain unavailable. On request (pdf, html, csv; each off by
default), writes a multipart branded PDF, matching HTML and full CSV
when an output directory is configured. Latency: 10–180 s.

## Usage

``` r
gf_cbioportal_cross_study_mutations(
    session,
    `gene`,
    `studies`,
    `csv` = NULL,
    `generated_at` = NULL,
    `html` = NULL,
    `pdf` = NULL,
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

- studies:

  (array)

- csv:

  (boolean, optional; default false) Also write all selected study
  results, unavailable reasons, counts, source and methods. NULL omits
  it.

- generated_at:

  (string, optional) ISO 8601 report timestamp with time zone; omitted
  uses the current time. NULL omits it.

- html:

  (boolean, optional; default false) Also write the matching
  self-contained branded HTML report. NULL omits it.

- pdf:

  (boolean, optional; default false) Also write one complete multipart
  branded PDF. NULL omits it.

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
for the `cbioportal_cross_study_mutations` tool. The runtime validates
every argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/cbioportal-cross-study-mutations-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
