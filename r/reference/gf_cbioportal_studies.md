# The cBioPortal studies GeneFox curates for one portal (ccdi, the screen's default, or public), as its...

The cBioPortal studies GeneFox curates for one portal (ccdi, the
screen's default, or public), as its Reference › cBioPortal screen lists
them: title, group, live sample count, the GDC project a study opens as,
citation, and the drift note when the portal no longer serves a curated
study or its sample count moved. pedcbioportal is refused (it needs a
personal data-access token). Follow with cbioportal_composition,
cbioportal_expression or cbioportal_alterations. Latency: 1-10 s.

## Usage

``` r
gf_cbioportal_studies(
    session,
    `portal` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

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
for the `cbioportal_studies` tool. The runtime validates every argument
and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/cbioportal-studies-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
