# One GDC case, as GeneFox's case detail screen shows it: demographics, each diagnosis with its stage and...

One GDC case, as GeneFox's case detail screen shows it: demographics,
each diagnosis with its stage and age, identifiers, and its GDC files
grouped by data category (name, type, strategy, size, open or
controlled). Use tcga_case_expression for its transcriptome. Latency:
1-5 s (the cohort's cases, once).

## Usage

``` r
gf_tcga_case_detail(
    session,
    `case`,
    `project`,
    `files` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- case:

  (string) The case: its GDC UUID (case_id) or its submitter id (e.g.
  TCGA-A8-A08S), as tcga_cases lists it.

- project:

  (string; one of "TCGA-ACC", "TCGA-BLCA", "TCGA-BRCA", "TCGA-CESC",
  "TCGA-CHOL", "TCGA-COAD", "TCGA-DLBC", "TCGA-ESCA", "TCGA-GBM",
  "TCGA-HNSC", "TCGA-KICH", "TCGA-KIRC", "TCGA-KIRP", "TCGA-LAML",
  "TCGA-LGG", "TCGA-LIHC", "TCGA-LUAD", "TCGA-LUSC", "TCGA-MESO",
  "TCGA-OV", "TCGA-PAAD", "TCGA-PCPG", "TCGA-PRAD", "TCGA-READ",
  "TCGA-SARC", "TCGA-SKCM", "TCGA-STAD", "TCGA-TGCT", "TCGA-THCA",
  "TCGA-THYM", "TCGA-UCEC", "TCGA-UCS", "TCGA-UVM", "TARGET-ALL-P1",
  "TARGET-ALL-P2", "TARGET-ALL-P3", "TARGET-AML", "TARGET-CCSK",
  "TARGET-NBL", "TARGET-OS", "TARGET-RT", "TARGET-WT", "APOLLO-LUAD",
  "BEATAML1.0-COHORT", "CDDP_EAGLE-1", "CGCI-BLGSP", "CGCI-HTMCP-CC",
  "CGCI-HTMCP-DLBCL", "CGCI-HTMCP-LC", "CMI-ASC", "CMI-MBC", "CMI-MPC",
  "CPTAC-2", "CPTAC-3", "CTSP-DLBCL1", "EXCEPTIONAL_RESPONDERS-ER",
  "HCMI-CMDC", "MMRF-COMMPASS", "MP2PRT-ALL", "MP2PRT-WT",
  "NCICCR-DLBCL", "OHSU-CNL", "ORGANOID-PANCREATIC", "REBC-THYR",
  "WCDT-MCRPC") TCGA/TARGET/other GDC project id with a GDC Xena
  expression dataset, e.g. TCGA-BRCA.

- files:

  (boolean, optional; default true) Also list the case's GDC files (the
  Files tab). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `tcga_case_detail` tool. The runtime validates every argument
and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-case-detail-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
