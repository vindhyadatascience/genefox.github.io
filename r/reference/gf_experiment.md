# Construct a Dense Expression Experiment

Validates named assays, explicit units and identifiers, and aligns
annotations by exact IDs. Plain R matrix workflows need no Bioconductor
packages. No normalization, analysis, relabeling or sparse/backed
materialization is performed.

## Usage

``` r
gf_experiment(assays, units, feature_ids = NULL, sample_ids = NULL,
  feature_metadata = NULL, sample_metadata = NULL, metadata = list(), row_ranges = NULL)
```

## Arguments

- assays:

  A named list of dense numeric matrices in features-by-samples
  orientation.

- units:

  Explicit units for every named assay.

- feature_ids:

  Unique nonempty feature IDs, defaulting to the first matrix's row
  names.

- sample_ids:

  Unique nonempty sample IDs, defaulting to the first matrix's column
  names.

- feature_metadata:

  Optional data.frame indexed by exact feature IDs.

- sample_metadata:

  Optional data.frame indexed by exact sample IDs.

- metadata:

  Experiment provenance and annotations as a list.

- row_ranges:

  Optional named genomic ranges retained by the SummarizedExperiment
  adapter.

## Value

A gf_experiment interchange object accepted by gf_write_import and
gf_to_se.
