# List GeneFox's bundled signature presets in app order, with exact names, gene counts, descriptions,...

List GeneFox's bundled signature presets in app order, with exact names,
gene counts, descriptions, recommended scoring methods and
source/license provenance. Use a returned name as
tcga_gene_signature.preset. No arguments. Local resources only; instant.

## Usage

``` r
gf_list_signature_presets(
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
for the `list_signature_presets` tool. The runtime validates every
argument and refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/list-signature-presets-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
