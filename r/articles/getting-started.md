# Getting started

Install the GeneFox CLI 1.1.0 or later; it carries the GeneFox runtime,
which is proprietary and not bundled with this package.

Then install the package from its GitHub release:

``` r
remotes::install_url("https://github.com/vindhyadatascience/genefox-r/releases/download/v1.1.0/genefox_1.1.0.tar.gz")
```

``` r
library(genefox)
s <- gf_session(runtime = "path/to/runtime", output = "output")
status <- gf_account_status(s)
```

## Result contracts

- `account_status`:
  <https://genefox.app/schemas/v1/account-status-result-v1.schema.json>
