# Open a GeneFox link (genefox://…) or a saved-view descriptor as the app would: returns where it goes...

Open a GeneFox link (genefox://…) or a saved-view descriptor as the app
would: returns where it goes (GeneFox's route planner: a cohort
analysis, a Reference screen, a GEO series, a cBioPortal study
redirected to a native cohort, or why it cannot open), the decoded saved
view (the app's own validation), and, where this server has that
screen's tool, the tool call it maps to and its result. Latency: instant
to plan; running takes the mapped tool's time.

## Usage

``` r
gf_open_destination(
    session,
    `destination` = NULL,
    `figure` = NULL,
    `legacy_link` = NULL,
    `link` = NULL,
    `run` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- destination:

  (object, optional) A saved-view descriptor (JSON: kind plus its
  fields, e.g.
  {"kind":"tcga.survival","projectId":"TCGA-KIRC","gene":"CD276"}). NULL
  omits it.

- figure:

  (boolean, optional; default true) Draw the figure and return its PNG
  path. NULL omits it.

- legacy_link:

  (string, optional) With destination: the deep link an older saved view
  kept, planned when the descriptor itself is not openable. NULL omits
  it.

- link:

  (string, optional) A GeneFox deep link, e.g.
  genefox://tcga/TCGA-BRCA/expression/ESR1?stratify=stage. Supply
  exactly one of link and destination; links are parsed, not fetched.
  NULL omits it.

- run:

  (boolean, optional; default true) Also run the mapped tool and return
  its result. NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `open_destination` tool. The runtime validates every argument
and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/open-destination-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
