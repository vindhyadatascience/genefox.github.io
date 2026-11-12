# Getting started

Install the GeneFox CLI 1.1.0 or later; it carries the GeneFox runtime,
which is proprietary and not bundled with this package. Then install the
package from the source tarball on its GitHub release:
`install.packages("genefox_1.1.0.tar.gz", repos = NULL, type = "source")`.

``` r
library(genefox)
s <- gf_session(runtime = "path/to/runtime", output = "output")
status <- gf_account_status(s)
```
