# cBioPortal

List curated studies, read a study’s composition, and count one gene’s
alterations.

Alteration counts cover the whole study, not an expression subset.

Cold-start time: `cbioportal_studies` 1–10 s, `cbioportal_composition`
5–60 s, `cbioportal_alterations` 5–60 s; cached repeats are faster.

The examples use the session `s` from Getting started and need the
GeneFox runtime.

``` r
studies <- gf_cbioportal_studies(s)
composition <- gf_cbioportal_composition(s, study_id = "openpedcan_v15")
alterations <- gf_cbioportal_alterations(
    s,
    study_id = "openpedcan_v15",
    gene = "TP53"
)
```

## Result contracts

- `cbioportal_studies`:
  <https://genefox.app/schemas/v1/cbioportal-studies-result-v1.schema.json>
- `cbioportal_composition`:
  <https://genefox.app/schemas/v1/cbioportal-composition-result-v1.schema.json>
- `cbioportal_alterations`:
  <https://genefox.app/schemas/v1/cbioportal-alterations-result-v1.schema.json>
