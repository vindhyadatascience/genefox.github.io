# Human Protein Atlas expression for one human gene: consensus tissue RNA nTPM across 51 tissues,...

Human Protein Atlas expression for one human gene: consensus tissue RNA
nTPM across 51 tissues, single-cell type RNA nCPM across 154 cell types,
protein tissue summaries with IHC reliability, subcellular location, and
HPA-reported cancer prognostics. Pass a gene symbol (e.g. TP53) or an
Ensembl ID (ENSG…). Every response carries the required HPA citation and
the gene's versioned URL. Latency: 2-10 s. No figure.

## Usage

``` r
gf_hpa_gene(
    session,
    `gene`,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- gene:

  (string) A gene symbol (e.g. TP53) or an Ensembl gene ID (e.g.
  ENSG00000141510).

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `hpa_gene` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/hpa-gene-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
