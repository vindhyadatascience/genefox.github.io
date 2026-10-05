# CLI reference

`genefox` runs one subcommand and exits, or serves MCP over stdio with `genefox mcp`. Resource, cache and output directories and the environment variables are described in [Install & resources](install.md).

## Subcommands and exit codes

Exit codes are `0` for success, `1` for a failure the command reports as `error: <sentence>`
on stderr, and `64` for a usage error. The table lists, per subcommand, which conditions give
which code.

| Invocation | Exit codes |
| --- | --- |
| `genefox` (no arguments), `genefox help`, `--help`, `-h` | 0: prints usage to stdout. |
| `genefox <unknown>` | 64: `unknown command: <name>`, then usage, on stderr. |
| `genefox catalog [--json]` | 0. |
| `genefox validate <recipe.json>` | 0 on success; 64 for a missing or extra argument; 1 when the file is missing or invalid. |
| `genefox render …` | 0 on success; 64 for a usage error; 1 for other failures. |
| `genefox fetch <url> …` | 0 on success; 64 for a usage error or a bad `-m`; 1 for a transport or decompression error. |
| `genefox report export …` | 0 on success; 1 for every failure, **including argument errors**. |
| `genefox doctor [--resources <dir>] [--output-dir <dir>]` | 0 when healthy; 1 if a required check fails; 64 for a usage error. Diagnostics go to stdout. |
| `genefox tools` | 0; 64 if any argument is given. |
| `genefox mcp [options]` | 64 for an option error; 0 when stdin reaches EOF and every in-flight call has answered; 0 when writing to stdout fails because the client has gone. |

`render` treats a missing recipe, a second positional argument, an unrecognised option, or
`--r-script` without `--storage-dir` as usage errors (64). Its `--r-script` combined with
`--size` exits 1.

### `genefox catalog [--json]`

Prints the operation catalogue (the same list `list_operations` returns): id, display name,
summary and data scope. `--json` prints the same records as sorted, pretty-printed JSON, in
the same form the MCP `list_operations` tool returns.

### `genefox validate <recipe.json>`

Decodes a recipe store file (the JSON file GeneFox writes when you save recipes) 
validates every recipe and resolves its operation. It prints one line per recipe:
`validated: <name> — dataset <catalog>/<id>, operation <id>`. Entries this build cannot read
are counted and reported, never silently dropped. The CLI does not enforce the store's
envelope-level policy (format id, version, caps). The legacy MCP tool `validate_recipe` gives
the same verdict.

### `genefox render <recipe.json> [options]`

Replays the **first** recipe in the file and writes a PNG, or with `--r-script`, R source.

| Option | Meaning |
| --- | --- |
| `--storage-dir <dir>` | A local imported-dataset store. Required for imported recipes and for `--r-script`. |
| `--size <preset>` | `single_column`, `one_and_a_half_column`, `double_column`, `slide` or `poster`. Without it, a public recipe uses its recorded figure size, or `double_column` if it has none, and an imported recipe uses `double_column`. Rejected with `--r-script`. |
| `--r-script` | Emit the exact-input R script for an imported heatmap or signature recipe, instead of a PNG. |
| `-o <file>` | Write to this file and print `wrote N bytes PNG` (or `… R source`). Without `-o`, the bytes go to stdout. Overwrites. |

Imported recipes replay from the verified local store. Public-dataset recipes replay through
the MCP tools' shared runners (network access needed) into a private temporary directory,
which is removed afterwards. They also need resources and a font that passes its pin. A
destination with no verifiable PNG replay refuses. The size is capped at 8,192 px per side
and 16,000,000 px in total.

### `genefox fetch <url> [-o <file>] [-z] [-m <bytes>]`

Fetches a URL through the CLI's **unrestricted** transport (the MCP server's host allowlist
does not apply here) and prints the body, or writes it with `-o` (overwrites). `-z`
gunzips the response. `-m` is the maximum response size in bytes: default 50,000,000,
allowed range 1 to 100,663,296. A value outside
that range exits 64.

### `genefox report export <file> [options]`

Reads a saved GeneFox v1/v2 report, renders it through the same PDF assembly
the GeneFox apps use, and writes it create-only to the output directory. It then prints
`wrote N bytes PDF to <path>`.

| Option | Meaning |
| --- | --- |
| `--format pdf` | The only format accepted. |
| `--output-dir <dir>` | Output directory (see [Output files](install.md#output-files)); or `GENEFOX_OUTPUT_DIR`. |
| `--resources <dir>` | Authoritative report assets; or `GENEFOX_RESOURCES`, then install-prefix/app-bundle discovery. Uses bundled report assets when no scientific root is selected. |
| `--generated-at <ISO8601>` | Fixed document timestamp with a time zone (years 0001–9999), for reproducible bytes. |
| `--without-methods` | Omit the auto-generated Methods pages. |

The report path must be a regular file, not a symbolic link, and fit this process's
memory-derived size limit. Unreadable figures, invalid figure sizes, or tables over the
budget refuse with no partial PDF written.

### `genefox doctor [--resources <dir>] [--output-dir <dir>]`

Runs offline startup checks and prints one line per check: the scientific resource inventory
and Ensembl reference (found/missing and path), bundled report marks and fonts (found/missing
and path), the figure font's SHA-256 pin, an actual create-only write under the output root,
the digest/inflate/transport seams and remaining required seams, and the sorted MCP fetch
allowlist. The write probe is removed afterwards. `genefox fetch` remains unrestricted.

Point `--resources <dir>` (or `GENEFOX_RESOURCES`) at the scientific
resources directory when automatic lookup does not find it. Explicit resources are authoritative for report assets too. `--output-dir` wins
over `GENEFOX_OUTPUT_DIR`, then defaults to `<system temp>/genefox-mcp`; a missing output
directory is created under the usual output policy. A missing or corrupt resource, font-pin
mismatch, failed write, or missing required seam exits **1**; all checks passing exits **0**.
A malformed option exits **64**. Missing-resource diagnostics name the manifest, reference
or report asset that failed.

### `genefox tools`

Prints the MCP tool catalogue as a markdown table: every tool this build registers, its
access class (free, Pro or legacy) and its deadline. The table on the
[Tool catalogue](tools.md) page is this output.

### `genefox mcp [options]`

Serves MCP over stdio. Requests go in on stdin and responses come out on stdout; logs go to
stderr. File descriptor 1 is pointed at stderr so that a stray `print` from the shared core cannot
corrupt the protocol stream.

| Option | Meaning |
| --- | --- |
| `--resources <dir>` | Scientific resources (see [Install & resources](install.md#scientific-resources)); or `GENEFOX_RESOURCES`, then resolved install prefix, then app bundle. |
| `--cache-dir <dir>` | Download cache; or `GENEFOX_CACHE_DIR`. Default: the native caches directory plus `GeneFoxCLI` (`~/Library/Caches/GeneFoxCLI`, or `$XDG_CACHE_HOME/GeneFoxCLI` on Linux). Available on every subcommand. |
| `--output-dir <dir>` | Where figures, CSVs, recipes and HTML are written; or `GENEFOX_OUTPUT_DIR`. Default `<system temp>/genefox-mcp`. |
| `--enable-legacy-tools` | Also list `report_export_pdf`, `validate_recipe`, `fetch_url` and `render_recipe`. These take local paths or URLs. |
| `--imported-store <dir>` | The local imported-dataset store that the legacy `render_recipe` may read for imported recipes. Only this flag names it; no tool argument can. |
| `--warm <list>` | Comma-separated background prefetch: `toil`, `pancan`, or project ids the tools accept (for example `TCGA-BRCA`). Unknown tokens are logged and skipped. Skipped entirely without resources. |
| `--call-timeout <seconds>` | One deadline, from 1 to 3600 seconds, for every call, replacing each tool's own. |
| `--max-concurrent-calls <n>` | How many `tools/call`s run at once, from 1 to 64 (default: half the processors, at least 2 and at most 4). Up to 16 more queue; beyond that a call answers `rate_limited` (retryable). |

A flag that takes a value refuses a following argument that starts with `--`. Every option
error exits 64 and prints the usage line on stderr.

