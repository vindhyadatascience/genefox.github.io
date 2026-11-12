# What one curated cBioPortal study's cohort is made of, measured from its own COHORT attribute as GeneFox's...

What one curated cBioPortal study's cohort is made of, measured from its
own COHORT attribute as GeneFox's cBioPortal screen shows it: pediatric
tumors, patient-derived models, adult tumors and normal tissue, with
counts, shares and the screen's mixture sentence (a 'pediatric' study
can be mostly adult or normal), plus the cancer-type subsets expression
can be restricted to. study_id is strict: a study cbioportal_studies
lists. Latency: 5-60 s (OpenPedCan v15 is 35,972 samples).

## Usage

``` r
gf_cbioportal_composition(
    session,
    `study_id`,
    `portal` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

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
for the `cbioportal_composition` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/cbioportal-composition-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
