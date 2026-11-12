# List the GDC projects (cohorts) GeneFox's TCGA tab offers, grouped by program (TCGA, TARGET, CPTAC, ...)...

List the GDC projects (cohorts) GeneFox's TCGA tab offers, grouped by
program (TCGA, TARGET, CPTAC, ...) with case and file counts, primary
site and disease type, and whether this server's per-cohort tools accept
each. Only projects with a GDC Xena expression dataset are listed, as in
the app. Optional search filters by id, name or site. Latency: 1-3 s
once, then instant.

## Usage

``` r
gf_tcga_projects(
    session,
    `search` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- search:

  (string, optional) Case-insensitive text matched against project id,
  name and primary site (the list's search field). NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `tcga_projects` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/tcga-projects-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
