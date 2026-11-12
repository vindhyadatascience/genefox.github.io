# Figures and local expression

Figure tools take `format` (`png`, `svg` or `tiff`), `dpi`, and either a
`size` preset or `width_in` with `height_in`. Tools that support it also
return a recipe with `recipe = TRUE`.

Local expression data converts to and from GeneFox’s import format
without analysis.

``` r
base <- "path/to/local-expression"  # matrix.tsv, samples.tsv, experiment.json
matrix <- as.matrix(read.delim(file.path(base, "matrix.tsv"), row.names = 1, check.names = FALSE))
samples <- read.delim(file.path(base, "samples.tsv"), row.names = 1, check.names = FALSE)
x <- gf_experiment(list(logcounts = matrix), units = c(logcounts = "log2_cpm"), sample_metadata = samples)
se <- gf_to_se(x)  # needs SummarizedExperiment
manifest <- gf_write_import(x, tempfile("genefox-import-"), assay = "logcounts", scale = "log2")

# Save the figure of any figure-producing result:
gf_save_figure(result$figures[[1]], "figure.png")
```
