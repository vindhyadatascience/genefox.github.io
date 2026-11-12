# Retrieve a study’s declared sample-level TMB_NONSYNONYMOUS or MUTATION_COUNT clinical attribute without...

Retrieve a study’s declared sample-level TMB_NONSYNONYMOUS or
MUTATION_COUNT clinical attribute without conversion. Original numeric
text, metadata, provider units, assay and source are preserved. Missing
or unknown units are disclosed, never inferred. Mutation count differs
from mutations per megabase; no TMB is computed and no
sequenced-megabase denominator is assumed. Unavailable attributes never
fall back to counts. Conflicting metadata, malformed/negative/nonfinite
values and incomplete pages refuse the whole query. On request (pdf,
html, csv; each off by default), writes branded PDF, matching HTML and
complete CSV with a ranked sample chart. Latency: 10–180 s.

## Usage

``` r
gf_cbioportal_mutation_burden(
    session,
    `attribute_id`,
    `study_id`,
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

- attribute_id:

  (string; one of "TMB_NONSYNONYMOUS", "MUTATION_COUNT") Exact
  study-declared clinical attribute. No fallback or derivation.

- study_id:

  (string) Curated study id from cbioportal_studies in its catalog
  portal. Uncurated ids are refused with closest matches.

- csv:

  (boolean, optional; default false) Also write complete clinical
  values, units, assay, source and original response JSON. NULL omits
  it.

- generated_at:

  (string, optional) ISO 8601 timestamp with time zone; omitted uses
  current time. NULL omits it.

- html:

  (boolean, optional; default false) Also write the matching
  self-contained branded HTML report. NULL omits it.

- pdf:

  (boolean, optional; default false) Also write the branded report with
  complete clinical values and metadata source tables. NULL omits it.

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
for the `cbioportal_mutation_burden` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/cbioportal-mutation-burden-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
