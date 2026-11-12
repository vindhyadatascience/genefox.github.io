# Read GEO host capabilities, bounded untrusted local suggestions and tool schemas for a matrix

Read GEO host capabilities, bounded untrusted local suggestions and tool
schemas for a matrix. No model, chat interpreter, app consent, app
matrix generation or recipe-library write.

## Usage

``` r
gf_geo_chat_schema(
    session,
    `accession`,
    `supplementary_file` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- accession:

  (string) GEO series accession.

- supplementary_file:

  (string, optional) Exact decoded basename from
  geo_supplementary_layout; no path, URL, encoding or surrounding
  whitespace. Only this file is analyzed; no fallback, saved-view links
  or recipes. NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_chat_schema` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-chat-schema-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
