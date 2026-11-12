# GeneFox scientific client and framework adapters

Create a native or persistent CLI GeneFox session and retain the shared
engine results, provenance and owned figures. Framework dependencies are
optional.

## Details

`gf_session(runtime = path, output)` opens a verified GeneFox runtime
bundle (see `gf_runtime`); `runtime` must be given alone, without
`resources`, `library` or `binary`.
`gf_session(resources = NULL, output, library)` uses an explicit native
SDK library instead. Set `backend = "cli"` and `binary` for stdio.
Inspect `gf_tools(session)` for runtime schemas and call
`gf_call(session, tool, arguments)`. `gf_table(result, path)` returns a
data.frame; the path selects an engine table or record array.
`gf_from_se(x, units)` and `gf_to_se(x)` preserve named dense assays and
align metadata using unique feature/sample identifiers. Close the
session explicitly with `gf_close`. Figure allocations are copied before
returning and survive session close.

## Value

Sessions are explicit owners; tool calls return a gf_result; table
adapters return standard framework objects; figure save returns its path
invisibly.
