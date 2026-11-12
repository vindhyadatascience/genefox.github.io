# NCBI Gene metadata for one gene, as GeneFox's gene-info card shows it: official symbol, Entrez ID, full...

NCBI Gene metadata for one gene, as GeneFox's gene-info card shows it:
official symbol, Entrez ID, full name, aliases, cytogenetic location and
the RefSeq summary, plus the NCBI Gene page URL. Pass a symbol (e.g.
TP53) or an Entrez ID (e.g. 7157); human genes only, as the card
searches. The summary and aliases are third-party NCBI text. Latency:
1-5 s. No figure.

## Usage

``` r
gf_gene_info(
    session,
    `gene`,
    `organism` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- gene:

  (string) A gene symbol (e.g. TP53) or an Entrez Gene ID (e.g. 7157).

- organism:

  (string, optional) Organism; only human is supported (the default).
  NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `gene_info` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/gene-info-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
