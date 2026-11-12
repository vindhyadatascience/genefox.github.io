# Summarize explicit GEO series from family SOFT metadata, retaining repeated characteristics and provenance

Summarize explicit GEO series from family SOFT metadata, retaining
repeated characteristics and provenance. Reuses the raw SOFT cache.
detail=fields (default above 3 series) returns compact characteristic
inventories, coverage and up to five example values, without sample
rows. characteristic_key is a literal ASCII-case-insensitive key
substring; request inss to exclude developmental stage. Fields results
retain input order, per-series ok/timed_out/unavailable status and
retry_accessions. detail=samples retains repeated characteristics and
provenance. Optionally match a treatment term plus explicit
caller-supplied aliases and count explicit dataset-local subjects
(compact treatment_summary in fields mode; raw evidence and combination
flags in samples mode). Samples without subject IDs and protocol-only
mentions do not count as subjects. Samples mode returns an immutable
collection snapshot (accessions, SOFT source, content SHA-256) and
cross-dataset overlap: subjects merge only through a shared GSM. Neither
total is a verified unique patient total across datasets. No disease
inference, expression load or model normalization.

## Usage

``` r
gf_geo_collection_summary(
    session,
    `accessions`,
    `characteristic_key` = NULL,
    `detail` = NULL,
    `treatment_aliases` = NULL,
    `treatment_term` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- accessions:

  (array)

- characteristic_key:

  (string, optional) Literal ASCII-case-insensitive characteristic-key
  substring, not regex or synonym; e.g. 'inss' matches 'stage \[inss\]'.
  NULL omits it.

- detail:

  (string, optional; one of "fields", "samples") Fields is the default
  for more than 3 series; samples otherwise. Samples preserves the
  legacy evidence envelope. NULL omits it.

- treatment_aliases:

  (array, optional) Explicit alternative names for treatment_term,
  matched like the term; requires treatment_term. NULL omits it.

- treatment_term:

  (string, optional) Literal ASCII-case-insensitive substring in
  treatment-like characteristics and protocols; no automatic synonyms.
  NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_collection_summary` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-collection-summary-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
