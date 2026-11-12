# Inspect the versioned GeneFox result contracts

Read the JSON Schema documents shipped with this client package. This
does not load or start a GeneFox runtime.

## Usage

``` r
gf_result_schemas()
```

## Value

A named list of JSON Schema documents, keyed by their published file
names. JSON objects and arrays retain their list structure. Each call
returns a fresh copy.

## Details

These contracts are pinned to this package version. Use
[`gf_tools`](https://genefox.app/r/reference/gf_client.md) to inspect
which tools the selected runtime makes available. Report tables contain
display strings; original numeric values remain in the scientific data
payload.

## See also

[`gf_session`](https://genefox.app/r/reference/gf_client.md),
[`gf_table`](https://genefox.app/r/reference/gf_client.md)
