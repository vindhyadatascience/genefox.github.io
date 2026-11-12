# Find genes or compounds in ToxicoDB (toxicodb.ca: Open TG-GATEs human and rat, DrugMatrix rat, EMEXP2458...

Find genes or compounds in ToxicoDB (toxicodb.ca: Open TG-GATEs human
and rat, DrugMatrix rat, EMEXP2458 hepatocyte toxicogenomics). kind=gene
matches symbol, Ensembl id, Entrez id or name; ToxicoDB gene ids are per
species. kind=compound matches name or PubChem CID. Returns ToxicoDB ids
to pass to toxicodb_experiments or toxicodb_analysis. Latency: 1-20 s
cold (the gene catalogue is 6 MB), then instant.

## Usage

``` r
gf_toxicodb_search(
    session,
    `kind`,
    `query`,
    `limit` = NULL,
    `species` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- kind:

  (string; one of "gene", "compound") What to search.

- query:

  (string) Text to match, e.g. CYP1A1 or acetaminophen.

- limit:

  (integer, optional; default 20; range 1..100) Most matches returned.
  NULL omits it.

- species:

  (string, optional; one of "human", "rat") Genes only: restrict to one
  species. NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `toxicodb_search` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/toxicodb-search-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
