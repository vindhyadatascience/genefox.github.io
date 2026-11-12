# Search NCBI GEO for expression series (GSE) as GeneFox's GEO search does (smart synonym expansion,...

Search NCBI GEO for expression series (GSE) as GeneFox's GEO search does
(smart synonym expansion, filters), returning accession, sample count
and a usability prediction for each. Start with query; continue with
cursor and optional limit only. next_cursor retains unreturned rows and
the exact searched term in this process. Latency: 2-10 s. Matches the
GeneFox app's GEO › Search results (without its per-device usability
notes).

## Usage

``` r
gf_geo_search(
    session,
    `cursor` = NULL,
    `data_type` = NULL,
    `limit` = NULL,
    `min_samples` = NULL,
    `organism` = NULL,
    `query` = NULL,
    `smart_search` = NULL,
    `sort` = NULL,
    progress_callback = NULL
)
```

## Arguments

- session:

  A GeneFox session from
  [`gf_session`](https://genefox.app/r/reference/gf_client.md).

- cursor:

  (string, optional) Continue with data.next_cursor and optional limit
  only. Process-local cursors expire after 15 minutes idle; successful
  pages replay at the same limit. Unknown or expired cursors require a
  new search. NULL omits it.

- data_type:

  (string, optional; one of "any", "expression_array",
  "expression_sequencing", "methylation_array",
  "methylation_sequencing", "noncoding_rna_sequencing",
  "genome_binding_sequencing"; default "any") GEO DataSet Type filter.
  NULL omits it.

- limit:

  (integer, optional; default 10; range 1..20) How many results to
  return (1-20). NULL omits it.

- min_samples:

  (string, optional; one of "any", "10", "50", "100", "500"; default
  "any") Minimum samples per series. NULL omits it.

- organism:

  (string, optional; one of "human", "mouse", "rat", "fly", "zebrafish",
  "worm", "yeast", "any"; default "human") Organism filter. NULL omits
  it.

- query:

  (string, optional) Free text or GEO accession: Unicode letters and
  digits, spaces and , . ; : ' / + \_ - only. NULL omits it.

- smart_search:

  (boolean, optional; default true) Expand the query with reviewed
  synonyms (the screen's default). NULL omits it.

- sort:

  (string, optional; one of "relevance", "newest", "oldest",
  "most_samples", "fewest_samples"; default "relevance") Result order.
  NULL omits it.

- progress_callback:

  Optional function receiving runtime progress events; NULL disables
  progress.

## Value

A `gf_result` holding the engine payload, provenance and owned figures
for the `geo_search` tool. The runtime validates every argument and
refuses tools absent from its
[`gf_tools()`](https://genefox.app/r/reference/gf_client.md) list.
Result contract:
<https://genefox.app/schemas/v1/geo-search-result-v1.schema.json>.

## See also

[`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md),
[`gf_tools`](https://genefox.app/r/reference/gf_client.md),
[`gf_call`](https://genefox.app/r/reference/gf_client.md)
