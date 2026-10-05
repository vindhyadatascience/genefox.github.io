# MCP server guide

`genefox mcp` serves GeneFox's analyses to an MCP client over stdio. Each tool runs the same
analysis code a GeneFox app screen runs, and returns that screen's numbers as JSON. Most tools
also write a PNG figure and can write the screen's CSV, a GeneFox recipe, or a single-figure
HTML document.

To install the binary and set up its resources, see [Install & resources](install.md). The
[CLI reference](cli.md) covers the other subcommands and exit codes.

## Starting the server

```bash
genefox mcp --resources /path/to/Resources --output-dir ~/genefox-out
```

| Option | Meaning |
| --- | --- |
| `--resources <dir>` | A copy of the app's bundled scientific resources directory; or `GENEFOX_RESOURCES`, then `<resolved executable directory>/../share/genefox/Resources`, then `<X>.app/Contents/Resources` for a `Contents/Helpers/genefox` or `Contents/MacOS/genefox` executable. Automatic roots require `ScientificResources.json`; every source uses the same integrity checks. Without usable resources, gene tools answer `resource_unavailable` and no figure is drawn. |
| `--cache-dir <dir>` | Download cache; or `GENEFOX_CACHE_DIR`. Default `~/Library/Caches/GeneFoxCLI` on macOS, `$XDG_CACHE_HOME/GeneFoxCLI` (or `~/.cache/GeneFoxCLI`) on Linux. Mount a persistent volume in containers; on WSL prefer the Linux filesystem. |
| `--output-dir <dir>` | Where figures, CSVs, recipes and HTML are written; or set `GENEFOX_OUTPUT_DIR`. Default `<system temp>/genefox-mcp`. Files are only ever created there, never overwritten. |
| `--enable-legacy-tools` | Also list the [legacy tools](#legacy-tools), which take local paths or URLs. |
| `--imported-store <dir>` | The imported-dataset store the legacy `render_recipe` may read. A tool argument cannot name a store. |
| `--warm <list>` | Prefetch `toil`, `pancan` and/or project ids such as `TCGA-BRCA`, in the background. |
| `--call-timeout <seconds>` | One deadline (1–3600 s) for every call, replacing each tool's own. |
| `--max-concurrent-calls <n>` | How many `tools/call`s run at once, 1–64 (default: half the processors, at least 2 and at most 4). Up to 16 more queue; beyond that a call answers `rate_limited` (retryable). |

An option error exits with status 64 before the server reads any input. Otherwise the server
prints one self-check line to stderr and then serves until stdin closes, for example:

```
genefox mcp: pid=152 resources=/path/to/Resources (flag) inventory=available reference=available font=ok pin=ok cache=/home/user/.cache/GeneFoxCLI out=/tmp/gfout allowlist=on legacy=off deadline=per-tool calls=4 queue=16 entitlement=free(not-linked) flavor=release version=1.1.0+unknown
```

Some fields in that line need explanation:

- **`allowlist=on`**: in `mcp` mode the network transport admits only an exact list of
  public-data hosts, over HTTPS on port 443, and re-checks every redirect
 . PedcBioPortal, loopback and GeneFox's own cloud hosts are
  deliberately absent.
- **`entitlement=free(not-linked)`**: see [Entitlements](#entitlements-genefox-pro).

Stdout carries only protocol messages. Logs, including one
`genefox mcp: host_not_allowed …` line per refused request, go to stderr.

## Connecting a client

Every client starts the server the same way: it runs the command
`genefox mcp [options]` and talks to it over stdin and stdout. Use absolute paths, because a
client may start the server from any working directory.

Long calls need a long client timeout. The server's own deadlines are 300 s, or 900 s for
the slow tools (see [Limits](#limits-deadlines-and-cancellation)), and a cold first call can
take minutes. Several clients stop waiting sooner than that by default; each client section
below says how to raise its limit.

### Claude Code

```bash
claude mcp add --transport stdio genefox --scope user \
  --env GENEFOX_OUTPUT_DIR=$HOME/genefox-out \
  -- /usr/local/bin/genefox mcp --resources /path/to/Resources
```

Or commit a project-scoped `.mcp.json`:

```json
{
  "mcpServers": {
    "genefox": {
      "command": "/usr/local/bin/genefox",
      "args": ["mcp", "--resources", "/path/to/Resources"],
      "env": { "GENEFOX_OUTPUT_DIR": "/Users/you/genefox-out" }
    }
  }
}
```

Claude Code reads these timeout settings, all in milliseconds:

- **`MCP_TIMEOUT`** limits server startup.
- **`MCP_TOOL_TIMEOUT`**, or a per-server `"timeout"` in `.mcp.json`, limits a single tool
  call.

Check the Claude Code MCP documentation for the current defaults.

### Claude Desktop

Claude Desktop uses the same `mcpServers` shape, in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "genefox": {
      "command": "/usr/local/bin/genefox",
      "args": ["mcp", "--resources", "/path/to/Resources", "--output-dir", "/Users/you/genefox-out"]
    }
  }
}
```

Check Claude Desktop's documentation for the config file's location and for its tool-call timeout.

### Codex

```bash
codex mcp add genefox --env GENEFOX_OUTPUT_DIR=$HOME/genefox-out \
  -- /usr/local/bin/genefox mcp --resources /path/to/Resources
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.genefox]
command = "/usr/local/bin/genefox"
args = ["mcp", "--resources", "/path/to/Resources"]
env = { GENEFOX_OUTPUT_DIR = "/Users/you/genefox-out" }
startup_timeout_sec = 30
tool_timeout_sec = 960
```

Codex documents defaults of `startup_timeout_sec = 10` and `tool_timeout_sec = 60`. A
60-second tool timeout ends most cold GeneFox calls early, so raise it as shown. Check
Codex's documentation for the current keys.

### OpenCode

In `opencode.json` (or `opencode.jsonc`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "genefox": {
      "type": "local",
      "command": ["/usr/local/bin/genefox", "mcp", "--resources", "/path/to/Resources"],
      "environment": { "GENEFOX_OUTPUT_DIR": "/Users/you/genefox-out" },
      "enabled": true
    }
  }
}
```

OpenCode documents a per-server `timeout` in milliseconds, with a default of 5000. Check
OpenCode's documentation for what that timeout bounds, and how to raise its tool-call limit,
before relying on long calls.

## Protocol surface

The server speaks protocol version `2024-11-05` and reports the server as
`genefox` version `1.1.0`. Each line on stdin is one JSON-RPC 2.0 message, and each response
is one line on stdout. The server handles these messages:

| Message | Behaviour |
| --- | --- |
| `initialize` | Returns `capabilities: {tools: {}}`, `serverInfo` and `instructions`: the usage rules a model should follow, which summarise this guide. |
| `ping` | Returns `{}`. |
| `tools/list` | The tools this process may offer (see [Entitlements](#entitlements-genefox-pro) and [Legacy tools](#legacy-tools)). The list and the dispatcher read the same registry, so a listed tool is always callable. |
| `tools/call` | Runs a tool. Its result is one `text` content item holding the tool's JSON. `isError: true` means the tool ran and reports a [tool error](#tool-errors). |
| `notifications/cancelled` | Cancels the call named by `requestId`. The cancelled call writes no response. |
| any other id-less message | Silence. |
| any other method | JSON-RPC error `-32601`. |

## Tool catalogue

The full catalogue of tools is on the [Tool catalogue](tools.md) page. It is generated by `genefox tools`, so it lists exactly the tools a given build implements.

A tool's **Access** class says when a client sees it: **free** tools are always listed, **Pro** tools only when that capability is granted (this build grants none), and **legacy** tools only with `--enable-legacy-tools`.

## Argument conventions

The server reads every tool's `arguments`:

- **Closed schemas.** Every input schema has `additionalProperties: false`. An unknown key is
  refused with `invalid_argument`, naming the key in `field`, so a misspelt key is reported
  instead of silently changing the analysis.
- **`null` means absent.** For an optional field, an empty string (after trimming) also
  counts as absent.
- **Types.** A wrong JSON type is refused with a sentence such as
  `gene: expected a string, got a number.` JSON `true` decodes as a boolean, not as the
  number 1.
- **Strings** are trimmed, then checked against a maximum length and, where the tool has
  one, a whole-string pattern. A TCGA gene symbol must match `^[A-Za-z0-9][A-Za-z0-9.-]*$`,
  with at most 30 characters, and is upper-cased as the TCGA screens do. The GTEx gene is
  trimmed but not upper-cased, as that screen does.
- **Enumerations** must be one of the listed values. A project id is matched
  case-insensitively and answered in canonical form (`tcga-stad` becomes `TCGA-STAD`).
- **Integers and numbers** are checked as doubles before any conversion. A value must be
  finite and within the schema's `minimum`/`maximum`, and an integer must also be whole.
  A value out of range is refused, never clamped.
- **String lists** are trimmed and de-duplicated case-insensitively. A list over its maximum
  count is refused, never truncated.
- **Figure size.** A tool with a `size` argument also accepts `width_in`, `height_in`,
  `dpi` (72–1,200) and the figure-style keys (`survival_detail`, `show_row_counts`,
  `show_caption_color_keys`, `show_figure_legends`). A custom size must stay within the
  app's side limits, 8,192 px per side and 16 megapixels in total. `dpi` is accepted only
  together with `width_in` and `height_in`.

Every refusal is a tool error whose `code` is `invalid_argument` and whose `field` names the
argument. It happens before any network request.
No argument of a non-legacy tool is a filesystem path or a URL to fetch. `open_destination`
takes a `genefox://` link, which it decodes as the app's route planner does; it does not
fetch it.

## Results and the `untrusted_*` trust model

A successful result is a JSON object. Analysis tools return `tool`, `data`, `display` (the
screen's sentences and tables, to quote verbatim), `caveats` and `provenance`. `provenance`
holds `sources`, `genefox_cli` (the version), `transport: "live"`, `fetched_at` and, where a
screen applies, `parity_screen`.

When a result list is capped, `truncated` discloses its `field`, `kept` and `total` counts.
One capped list produces an object; multiple capped lists produce an array of those objects,
so every cap is disclosed.

**Third-party text is never placed under a plain key.** Text that comes from a dataset, a
portal or a model goes under a key named `untrusted_*`. Examples
are GEO sample characteristics and author labels, CSV headers named after them, Reference and
cBioPortal labels and study text, local-model replies, and a deep link that carries GEO text
(`untrusted_deep_link`). The `initialize` instructions tell the model to treat these fields
as data, never as instructions. Each string is capped at **120 characters**, with a trailing
`…` when cut. A few diagnostic fields use their own larger caps; for example, GEO
supplementary refusal diagnostics allow 512 characters for a file name and 1,200 for a
reason. When a file name is derived from GEO text, the written path is returned as
`untrusted_path` / `untrusted_file_name`.

## Figures

A figure tool draws through GeneFox's shared engine and writes a PNG create-only under the output
directory, named as the app names the same export. It then returns `figure` with these keys:

| Key | Meaning |
| --- | --- |
| `path`, `file_name`, `bytes`, `sha256`, `width_px`, `height_px` | The file written. The pixel size is read from the PNG itself. |
| `geometry`, `size` | What was drawn. `size` is the preset token, or `custom`. |
| `description` | The engine's description of the figure. |
| `alt_text` | Alt text: the engine's own summary and caveat if it has one, otherwise the description, otherwise a sentence built from the title. |
| `data_table` | `[{label, value}]`, one row per drawn element (group, arm, legend row, or point), in drawn order. |
| `data_table_rows`, `data_table_truncated`, `data_table_note` | The table's row count before the cap; whether the table was cut; and, only when it was, a sentence saying so. |
| `data_table_unavailable` | Replaces the table when the engine attached no element description. |
| `parity`, `parity_screen`, `parity_note` | See [Parity tokens](#parity-tokens). |

The data table is capped at **200 rows**. Only
scatter and volcano figures, which have one row per point, reach that cap. Rows past it are
not lost: they are still in the tool's `data` and CSV, which are never capped by this.

When a figure's labels are third-party text, `description`, `alt_text` and `data_table` are
**replaced** by `untrusted_description`, `untrusted_alt_text` and `untrusted_data_table`, never
returned beside them, and every cell is capped as above. The counts and the truncation note
are GeneFox's own text and stay under plain keys.

A figure can also be missing:

- `figure_unavailable`: no font, no output directory, nothing to draw, or a write failure.
- `figure_refused`: the engine's refusal sentence.

The server never draws an unlabelled figure.

With `inline_image: true`, a figure tool also returns an MCP content item
`{"type":"image","data":"<base64 PNG>","mimeType":"image/png"}` alongside the
existing text item. The cap is **1,048,576 PNG bytes** before base64 encoding, inclusive.
For a larger PNG, no image item is returned; `figure.inline_image_omitted` contains
`{"reason":"size_limit","bytes":N,"maximum_bytes":1048576}`. The PNG is still
written create-only and its file metadata is still returned. The argument defaults to
`false`; omitting it preserves the existing result bytes. This lets clients display figures
without access to the server's output directory. An unavailable or refused figure adds no
image content. The legacy `render_recipe` reports a render verdict and has no shared figure result.

With `html: true`, a tool also writes the screen's single-figure HTML document. That document's `<img alt>` is the figure's `alt_text`,
and after the figure it has a "Figure 1 data" table of the same rows, with the same 200-row
cap. Every string in it is HTML-escaped. If no figure was drawn, the result carries
`html_unavailable` instead; `tcga_case_expression` always answers `html_unavailable`, with the
reason, because its screen exports no HTML.

`csv: true` and `recipe: true` work the same way. They return `csv` or `recipe` (with
`path`, `bytes` and `sha256`), or `csv_unavailable` / `recipe_unavailable` with a reason.

## Parity tokens

The `figure.parity` and `html.parity` fields say how an output relates to what the app
exports:

| Token | Where | Meaning |
| --- | --- | --- |
| `app_export_identical` | `figure.parity` | The app screen's PNG export calls the same function with the same arguments. |
| `engine_only` | `figure.parity` | Drawn by the shared engine, but the screen has no PNG export to match; for example, the screen snapshots the view. |
| `font_mismatch` | `figure.parity` | Replaces either value above when the figure font failed its SHA-256 pin. The glyph widths may differ from the app's. |
| `app_document_engine_png` | `html.parity` | The app's HTML document over the screen's title, subtitle, source and table, embedding the engine's PNG bytes. Apple re-encodes the same pixels. |
| `app_document_engine_figure` | `html.parity` | As above, but the screen snapshots this figure, so the app's own document embeds a snapshot where this one embeds the engine figure. |

The related fields are:

- **`figure.parity_screen`**: names the app screen the figure corresponds to.
- **`provenance.parity_screen`**: names the screen whose *numbers* the tool reproduces. The
  two can differ; for example, a Survival tab's numbers can come with an engine-drawn
  figure.
- **`parity_note`**: a sentence stating exactly where the output departs from the app,
  where there is something to say.

## Entitlements (GeneFox Pro)

The server **fails closed**. At startup it builds the process's access context once, with no granted capabilities, so every Pro capability is hidden. No argument, flag, environment variable or file can change this, and the server never reads the desktop app's grants, account or consent state.

A tool that requires a Pro capability is listed only when that capability is granted. Locked, checking and temporarily-unavailable capabilities all hide the tool. A hidden tool is also uncallable: a call to it gets the same `-32602 Unknown tool` error as a name that never existed.

This build registers **no Pro tools** (the catalogue shows `0 Pro`). `account_status` reports `linked: false`, `entitlement: "not_linked"`, `granted_capabilities: []` and `cloud_assist: "off"`, with the caveat "Linking a GeneFox account to this server is not available in this version."

## Account and cloud authority

Account linking, cloud retry and the dataset finder are **not available** in this version. In this build:

- **Disabled by default.** Each server context starts with no service, no profile and no evidence. No tool creates a privileged publication, no MCP argument can supply a service, evidence or approval, and the authority is shut down at EOF.
- **One-use human approval.** The design requires a decision made in a human helper's own interface for linking and for each cloud request. An approval is bound to one exact request, host and authority generation, and is consumed when used. That human helper is not built yet.
- **Model-run commands are never human approval.** An agent running a terminal command, or a model setting a `force`-style flag, is not the human decision the design requires. No tool input can stand in for it.

Local conversations (`tcga_ask_open`, `geo_ask_open`, `ask_turn`, `ask_close`) use only a host-owned local model and execute no analysis on their own. `local_model_status` reports whether a local model is ready. On the Linux build it reports `conversation: "unsupportedPlatform"` and `single_query: "unsupportedPlatform"`.

## Limits, deadlines and cancellation

| Limit | Value | Behaviour |
| --- | --- | --- |
| Request line size | 4 MB | Refused before decoding: `-32700 "Request line exceeds 4 MB"`, id `null`. |
| JSON nesting depth | 32 levels, the envelope counting as 1 | Refused before decoding: `-32700 "Request nesting exceeds 32 levels"`, id `null`. |
| Per-call deadline | 300 s by default; 900 s for the slow tools; 30 s for `ask_turn` (see the catalogue) | The call answers `timed_out` (retryable). The abandoned work may finish and fill the cache, so a retry is usually faster. |
| `--call-timeout` | 1–3600 s | Replaces every tool's deadline. |
| Concurrent calls (`--max-concurrent-calls`) | 1–64; default half the processors, 2 to 4; 16 more may queue | Beyond the queue: `rate_limited` (retryable, `details.source: genefox_server`), not run. Queued time counts against the deadline (`timed_out` with `details.queued: true`). |
| Early cancellations remembered | 256 | A `notifications/cancelled` that arrives before its request is remembered, and that request is then dropped. |
| GEO search cursors | 32 active searches, 15-minute idle expiry, 5,000 results per search | `cursor_capacity` (retryable), `cursor_expired`, `cursor_busy` (retryable), `pagination_limit`. |
| Local conversations | 2–8 sessions and 8–64 MB of snapshot memory in total, both measured from physical memory; 15-minute lifetime | `session_capacity`, `session_expired`, `session_busy` (retryable). |

The deadline timer runs outside the server's worker pool, so a saturated pool cannot delay the `timed_out` verdict.

**Concurrency.** The read loop starts one task per request line **immediately**, so `ping`
and `tools/list` are never queued behind a slow analysis. Only `tools/call` passes the call
limiter: at most `--max-concurrent-calls` run at once and up to 16 more wait,
first come first served; a call beyond that answers `rate_limited` at once. A slot is held by
the work, not the answer, so a timed-out or cancelled call keeps it until its kernel returns.

## Error codes

### JSON-RPC errors

| Code | When |
| --- | --- |
| `-32700` | Invalid JSON, a line over 4 MB, or nesting deeper than 32. Answered with id `null`. |
| `-32601` | Unsupported method. |
| `-32602` | `tools/call` named a tool that is not listed. For a legacy tool started without the flag, the message is `Tool not available: <name> is a legacy tool; start the server with --enable-legacy-tools`. |

### Tool errors

A tool error is a normal `tools/call` result with `isError: true`, whose text is
`{"error": {"code", "message", "retryable", "field"?, "details"?}}`. The codes used are:

| Code | Meaning |
| --- | --- |
| `invalid_argument` | An argument was refused (`field` names it), or an input file or report was unreadable. |
| `resource_unavailable` | The scientific resources, gene reference, or a report asset is missing. |
| `gene_not_found`, `ambiguous_gene` | The gene did not resolve, or resolved to more than one row (`details` lists the candidates). |
| `no_data`, `no_expression_data` | Nothing to analyse, or no expression matrix (GEO, Expression Atlas, supplementary files). |
| `not_runnable`, `unsupported_here`, `query_refused` | The analysis is refused with the app's sentence; the screen has no tool here; or the shared planner/validator refused the query. |
| `conflicting_loci`, `incomplete_family` (retryable), `upstream_partial_failure` (retryable) | Pan-cancer and pan-cancer survival assembly failures. |
| `upstream_unavailable` (retryable), `upstream_http` (retryable for 5xx), `rate_limited` (retryable, `retry_after`), `upstream_malformed`, `response_too_large` | Network and source failures. |
| `host_not_allowed` | The server reached a host outside the allowlist (`details.host`). |
| `seam_unavailable` | A platform seam was not installed. |
| `geo_search_failed`, `cursor_expired`, `cursor_busy`, `cursor_capacity`, `pagination_limit` | GEO search and pagination. |
| `session_capacity`, `session_expired`, `session_busy`, `session_limit`, `model_unavailable`, `invalid_model_response` | Local conversations. |
| `output_unavailable` | `report_export_pdf` has no usable output directory. |
| `timed_out` (retryable, `details.deadline_seconds`), `cancelled` | The deadline passed, or the call was cancelled. |
| `internal` | Anything else, with its message. |

Some file outputs fail without failing the call. They are reported beside the result as
`figure_unavailable`, `csv_unavailable`, `recipe_unavailable` or `html_unavailable`.

## Legacy tools

`--enable-legacy-tools` adds the legacy tools, which take a **local path or a URL**, which no
other tool does:

- **`report_export_pdf`**: a saved report to a PDF, written create-only to the output
  directory.
- **`report_export_html`**: a saved report to one self-contained HTML document.
- **`validate_recipe`**: the CLI's `validate` verdict.
- **`fetch_url`**: fetches through the installed transport. In `mcp` mode that is the
  allowlisted transport. `maximumBytes` must be between 1 and 100,663,296, the default is
  50 MB, and text over 100,000 bytes is returned as a preview.
- **`render_recipe`**: the CLI's `render`. An imported recipe reads only the store the server
  was started with (`--imported-store`); the model cannot choose a store, and a
  `storage_directory` argument is refused.

Without the flag they are neither listed nor callable (`-32602`).

## `list_coverage`

`list_coverage` takes no arguments. It returns one row per **free** app
operation: `row`, `operation`, `app_screen`, `mcp_tool` (or `null`), `status` and `note`. The
`status` is one of `available`, `partial`, `planned` or `not_available_headless`. The result
also has counts per status. On this build, `list_coverage` reported 54 available, 17
partial, 12 planned and 6 not available headlessly. A final row summarises Pro operations
without naming any. Call `list_coverage` for the current state rather than relying on these
numbers.

## Plugins

Client plugins for Claude Code, Codex and OpenCode are not yet available. See [Agent plugins](plugins.md).
