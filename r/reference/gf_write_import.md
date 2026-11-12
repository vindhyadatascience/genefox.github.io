# Write an Explicit Local Expression Input

Writes a features-by-samples TSV and a manifest retaining units, exact
IDs, aligned metadata, factor domains, provenance and any genomic
coordinates. Lists unselected assays explicitly. Performs no
normalization or analysis. The shared analysis engine stores expression
in Float32; the source TSV retains input precision.

## Usage

``` r
gf_write_import(x, directory, assay, scale)
```

## Arguments

- x:

  A dense experiment from gf_from_se().

- directory:

  A new output directory; existing directories are refused.

- assay:

  The exact name of the assay to export.

- scale:

  Explicitly linear, log2 or unknown; units never imply a transform.

## Details

A GRanges input retains sequence order, lengths, circularity, genome
assembly, unused sequence levels and JSON-compatible range metadata.
Grouped ranges remain available for R round-trips but must be converted
explicitly before interchange export; they are refused rather than
flattened across feature identities.

## Value

The local experiment.json manifest path.
