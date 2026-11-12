# GeneFox for R

R access to GeneFox’s shared scientific runtime, with data frames,
tidyverse-compatible tables and SummarizedExperiment adapters. The
wrapper is MIT licensed; the GeneFox engine and native runtime remain
proprietary and are obtained separately.

This is version 0.1.0 of the package. It requires the GeneFox 1.1.0
runtime (ABI 1, SDK contract 1), which is distributed with the GeneFox
1.1.0 CLI; the GeneFox documentation describes how to install it.

Install the development package from the public repository:

``` r
remotes::install_github("vindhyadatascience/genefox-r")
```

Or build a local checkout with `R CMD build .` and install its source
tarball with `R CMD INSTALL`. A C compiler and the dependencies in
DESCRIPTION are needed; building the wrapper does not compile or
download the GeneFox engine.

After verifying a matching native runtime bundle’s publisher signature:

``` r
library(genefox)
session <- gf_session(runtime = "/path/to/genefox-runtime", output = "/path/to/results")
result <- gf_list_operations(session)
gf_table(result)
gf_close(session)
```

`gf_runtime(path)` validates the bundle’s platform, architecture, ABI,
contract and file inventory before loading code. Digests check integrity
and do not authenticate a publisher. Native runtime bundles are a
separate GeneFox release deliverable; none is included here.

Use [`gf_to_tibble()`](https://genefox.app/r/reference/gf_client.md) or
[`gf_to_data_table()`](https://genefox.app/r/reference/gf_client.md) for
common table frameworks, and
[`gf_from_se()`](https://genefox.app/r/reference/gf_client.md) /
[`gf_to_se()`](https://genefox.app/r/reference/gf_client.md) for
supported SummarizedExperiment data. GeneFox owns statistical analysis
and figure rendering; the R package preserves the results, provenance
and figures.

See the GeneFox documentation, and report problems in
[issues](https://github.com/vindhyadatascience/genefox-r/issues). The
export’s `genefox-source.json` records its source commit and runtime
compatibility.

Generated functions cover the free tools of the matching GeneFox runtime
release. Inspect `names(gf_tools(session))` in an open session to see
what that runtime offers; a generated function never grants access to
anything the runtime does not list.

To check the standalone R checkout, install the dependencies listed in
DESCRIPTION, including the suggested packages for full interoperability
coverage, and select a verified matching runtime bundle:

``` sh
export GENEFOX_SDK_TEST_RUNTIME=/absolute/path/to/genefox-runtime
R CMD build .
GENEFOX_R_VERSION="$(Rscript -e 'cat(read.dcf("DESCRIPTION")[1, "Version"])')"
R CMD check --no-manual "genefox_${GENEFOX_R_VERSION}.tar.gz"
```

Building the tarball applies the package’s `.Rbuildignore` exclusions.
The package check runs the files under `tests/`. Keep the runtime
variable set to include the actual native and CLI transport checks.

## GeneFox Pro in 1.1.0

GeneFox Pro needs a linked GeneFox account, and the 1.1.0 runtime offers
no account linking outside the GeneFox app. Pro tools and Pro-only
arguments (such as figure customization) are therefore not part of this
package.

## Data sources and terms

GeneFox analyzes public data that it retrieves from its providers when
you run an analysis: TCGA and other projects through the NCI Genomic
Data Commons, GEO, GTEx, the UCSC Xena and Toil recompute, CCLE,
Treehouse, Expression Atlas and cBioPortal. That data remains subject to
each provider’s terms, data-use policies and citation requirements,
which you are responsible for following. Results carry their source and
provenance so you can cite them.

## Research use only

GeneFox is for research use only. It is not a medical device and must
not be used to diagnose, treat or make clinical decisions about any
person.

## Notices

See
[LICENSE](https://github.com/vindhyadatascience/genefox-r/blob/main/LICENSE)
and
[inst/NOTICE](https://github.com/vindhyadatascience/genefox-r/blob/main/inst/NOTICE).
The GeneFox application, the `genefox` command-line tool and the GeneFox
runtime are proprietary software of Vindhya Data Science and are not
covered by this package’s license. The GeneFox name and logo are not
licensed, except that the unmodified logo may accompany the credit “made
with GeneFox” in reports produced with GeneFox, as inst/NOTICE
describes.

Use
[`gf_result_schemas()`](https://genefox.app/r/reference/gf_result_schemas.md)
to inspect the output contracts shipped with this package, without
starting a GeneFox runtime. The named list contains the versioned
survival, table, figure, provenance and error JSON Schema documents.
JSON arrays remain lists, and each call returns independent documents.
These describe shared result blocks; tool-specific scientific payloads
are preserved. Use `gf_tools(session)` for runtime availability.

Named success contracts cover `list_operations`,
`list_signature_presets`, `tcga_projects`, `gtex_tissue_expression`,
`reference_ccle_expression`, `reference_treehouse_expression`,
`reference_expression_atlas` and `reference_expression_atlas_catalog`.
Use each document’s `x-genefox-tool` field to identify the tool.
Scientific values, nulls, display strings and trust-labelled fields
retain their wire types. The nine released cBioPortal tools also have
named success contracts: provider values, exact source probability
strings, unavailable assays and separate patient/sample treatment counts
retain their types and meanings.

Clinical and discovery output contracts also cover `gene_info`,
`list_coverage`, `tcga_cases`, `tcga_case_detail`,
`tcga_cohort_summary`, `geo_search`, `geo_dataset_details` and
`geo_supplementary_layout`. Clinical age/survival units, unrequested
versus empty file lists, unknown GEO sample counts, cursor state and
parser diagnostics retain their original types. The supplementary
diagnostic payload preserves its existing shape without `tool` or
`caveats` members; its schema association is recorded in the result
index.

In `tcga_cohort_summary`, check `data.age_at_index.n` before
interpreting its quartiles. When no ages were observed (`n = 0`), the
existing summary returns zero quartiles and the histogram is refused.
Those zeros do not represent measured ages.

The TCGA analysis tools also publish named output contracts:
`tcga_expression`, `tcga_case_expression`, `tcga_compare_cohorts`,
`tcga_differential_expression`, `tcga_gene_isoforms`,
`tcga_gene_signature`, `tcga_heatmap`, `tcga_pan_cancer_expression`,
`tcga_pan_cancer_survival`, `tcga_sample_pca`, `tcga_survival`,
`tcga_top_correlates` and `tcga_tumor_normal`. These describe scientific
counts and measurements separately from display strings, canonical
survival blocks, correlation/BH families, paired-test availability and
export files. Sample counts and patient counts retain their distinct
units. Infinite confidence bounds retain the producer’s string tokens;
an unavailable measurement remains null. Heatmap color extents are
automatically computed output measurements, marked
`x-genefox-output-role: computed_extent` in the schema. Their presence
does not enable custom input controls. Isoform measurements retain their
separate pipeline and scale rather than being treated as a decomposition
of the gene view.

GEO output contracts also cover `geo_collection_summary`,
`geo_finder_plan`, `geo_gene_correlation`, `geo_heatmap`,
`geo_sample_pca`, `geo_series_expression`, `geo_survival` and
`geo_top_correlates`. The series expression schema includes its
heatmap-delegation result. Collection fields and sample-evidence modes
retain unknown counts, retry state, snapshots and the scope of subject
linkage; neither aggregate certifies unique patients across datasets.
Finder suggestions remain unexecuted and carry no fabricated fetch
provenance.

GEO identifiers, source filenames, CSV headers, labels and ranked
features retain their explicit trust labels. Count-library summaries
describe the source matrix separately from retained samples. Survival
discovery remains distinct from a computed endpoint, and the shared
survival block counts samples while retaining the caller’s explicit
time-unit mapping. Heatmap color extents remain computed output
measurements. Scientific numbers and unavailable values retain their
types.

Every tool in this package’s released catalogue has a named success
contract in its result schemas. `account_status` preserves granted
capability names and helper disclosures. `tcga_chat_schema` and
`geo_chat_schema` describe read-only snapshots with actual analysis
input schemas; they do not advertise chat execution.
`imported_de_enrichment` keeps full-precision decimal strings, explicit
`Inf` boundaries and null sample sizes; no sample counts are inferred
from the imported table. `open_destination` preserves route plans,
restore decisions, structured delegated results and untrusted run
errors. These are additive output sidecars: the input catalogue, session
ABI and SDK contract version remain unchanged. Contract presence does
not grant access to a tool; consult the selected session’s tool listing.
