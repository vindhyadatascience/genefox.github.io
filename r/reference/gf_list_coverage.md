# List GeneFox's free app operations and, for each, the tool that reaches it (or null), whether it is...

List GeneFox's free app operations and, for each, the tool that reaches
it (or null), whether it is available, partial, planned or not available
headlessly, and a note. Use it to see what this server cannot do yet. No
arguments. Instant.

## Usage

``` r
gf_list_coverage(
    session,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `list_coverage` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/list-coverage-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
