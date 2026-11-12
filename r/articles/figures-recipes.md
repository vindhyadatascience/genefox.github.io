# Figures and local expression

Figure-producing tools accept format, dpi, width_in, height_in and size
when listed in their signatures. The local expression interchange
preserves inputs; it does not perform analysis or render a figure. The
fixture conversion is local; analysis latency and free access depend on
the tool.

Cohort-wide analyses can take 5–60 s; the specific cold latencies above
may be longer.

The fixture comprises `matrix.tsv`, `samples.tsv` and `experiment.json`.
Request `format = "png"` for engine PNGs at the requested `dpi` and
size; `svg` and `tiff` are also supported. Specify `width_in` and
`height_in` together in inches instead of the `size` preset. For tools
that support it, `recipe = TRUE` requests a recipe for reopening the
analysis. Saving does not convert formats. The fixture alone does not
render a figure.

``` r
# Run from the repository root; experiment.json describes these files.
base <- "SDK/contracts/fixtures/local-expression/r"
matrix <- as.matrix(read.delim(file.path(base, "matrix.tsv"), row.names = 1, check.names = FALSE))
samples <- read.delim(file.path(base, "samples.tsv"), row.names = 1, check.names = FALSE)
x <- gf_experiment(list(logcounts = matrix), units = c(logcounts = "log2_cpm"), sample_metadata = samples)
se <- gf_to_se(x) # requires SummarizedExperiment
manifest <- gf_write_import(x, tempfile("genefox-import-"), assay = "logcounts", scale = "log2")
```

``` r
# Given a figure-producing result named result:
gf_save_figure(result$figures[[1]], "figure.png")
```

## Result fields

`tcga-expression`: `data` (object), `display` (object), `caveats`
(array).
