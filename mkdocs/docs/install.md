# Install & resources

!!! info "Binary downloads: coming soon"
    Binary downloads are not published yet. This page describes the requirements and layout the CLI uses, so you can plan your setup.

## Supported platforms

`genefox` is a single executable, built and tested for:

- **macOS** (universal: Apple silicon and Intel).
- **Linux** (x86_64 and arm64), including Windows Subsystem for Linux.
- **Windows** (x86_64), as `genefox.exe`.

## Installing the binary

Copy the binary to any directory on your `PATH`, together with SwiftPM's resource bundle: it holds the bundled report fonts and marks (see [Bundled report resources](#bundled-report-resources)). On macOS the bundle is `locus_genefox.bundle`, beside the binary. On Linux it is `locus_genefox.bundle` or `locus_genefox.resources`; `genefox` accepts either name. If the bundle is missing, `genefox` still runs, but `report export` refuses with a "resource unavailable" sentence instead of drawing substitute artwork.

If a file named `genefox.commit` sits beside the binary, the server reports its version as `1.1.0+<commit>`, using that file's first 64 characters or fewer. Otherwise it reports `1.1.0+unknown`.

### Install layout

Resource discovery expects a prefix laid out like this:

```
<prefix>/bin/genefox
<prefix>/bin/locus_genefox.bundle        # or locus_genefox.resources
<prefix>/share/genefox/Resources/
<prefix>/share/genefox/GeneFoxCLI-ThirdParty-NOTICE.txt  # when available
```

Add `<prefix>/bin` to `PATH`; resource discovery also works through a symlink to that binary.

## Scientific resources (`--resources <dir>` / `GENEFOX_RESOURCES`) {#scientific-resources}

The analysis tools need the app's bundled scientific resources: a copy of
the app's resources directory. Name the directory with `--resources <dir>` (`mcp`, `doctor` and
`report export`) or with `GENEFOX_RESOURCES` (every subcommand). The flag wins over the
variable; a leading `~` is expanded. The complete lookup order is:

1. `--resources <dir>`.
2. `GENEFOX_RESOURCES`.
3. `<resolved executable directory>/../share/genefox/Resources` (install prefix).
4. For `<X>.app/Contents/Helpers/genefox` or `Contents/MacOS/genefox`, the app's
   `Contents/Resources`.
5. None.

Executable symlinks are resolved before automatic lookup. Automatic candidates must contain
an existing regular, non-symlink `ScientificResources.json`; a bare directory is ignored.
Explicit flag/environment roots remain authoritative even if missing or corrupt. A corrupt
manifest in a selected automatic root also fails integrity checks; it does not trigger a
fallback to another root. Every source uses the same checks below.

`genefox` loads files from that directory only under these rules:

- **Names and types.** A name must match `[A-Za-z0-9._-]`, have at most 80 bytes and contain
  no `..`. The extension must be `json`, `ttf`, `txt` or `png`.
- **File type and size.** Symbolic links and non-regular files are refused, and so is any
  file over 16 MB.
- **Integrity.** `ScientificResources.json` has a
  compiled-in self-pin, and every listed file's size and SHA-256 are checked before the
  inventory reports `available`.
- **Font pin.** The figure font `SourceSans3-Regular.ttf` is not in the manifest, so the
  server pins its SHA-256 itself. If the font loads but fails
  the pin, figures are still drawn, but each one reports `parity: "font_mismatch"`.

At startup, `genefox mcp` logs one line to stderr with
`resources=/path (flag|environment|install-prefix|app-bundle)` and the existing
`inventory=… reference=… font=… pin=…` fields. It also reports `cache=/path`. Without usable resources, for example:

```
genefox mcp: pid=111 resources=none inventory=loaderUnavailable reference=unavailable font=missing pin=mismatch cache=/home/user/.cache/GeneFoxCLI out=/tmp/gfout allowlist=on legacy=off deadline=per-tool calls=4 queue=16 entitlement=free(not-linked) flavor=release version=1.1.0+unknown
genefox mcp: resources not ready; start the server with --resources <dir> (a copy of the app's resources directory)
```

If the named directory does not exist, the server logs that too. It never fails to start.
Without resources:

- **Gene tools.** They stay listed but answer `resource_unavailable`. A missing reference is
  never reported as a missing gene.
- **Figures.** With no font, no figure is drawn: the result carries
  `figure_unavailable: "font not loaded"`, and the numbers still come back.
- **`--warm`.** Skipped.
- **`render`.** Refuses public and imported recipes ("The validated public-analysis resources
  and figure font are required.", or "The bundled figure font is unavailable.").


## Bundled report resources

The `genefox` binary ships with a resource bundle. It holds the report
brand marks (`GeneFoxReportMark256.png`, `GeneFoxReportMark2400.png`,
`VDSLogoFullColor.png`, `VDSLogoSymbol.png`), the PDF faces (`SourceSans3-Regular`,
`-Semibold`, `-Bold`, `LiberationSans-Regular`, `-Bold`, `-Italic`) and their licence files.
`report export` and the legacy `report_export_pdf` tool use these by default.

A selected scientific resources directory (explicit or automatically discovered) is
**authoritative** for reports. If a brand mark or font is missing there, or cannot be decoded, the export refuses
with `resource_unavailable` and writes no PDF. The bundled copies are never substituted.


## Download cache (`--cache-dir <dir>` / `GENEFOX_CACHE_DIR`)

Every subcommand accepts `--cache-dir <dir>` after the command name. It wins over
`GENEFOX_CACHE_DIR`; leading `~` and relative paths are expanded at launch. Without either, the
cache is the native host's default: Foundation's caches directory plus `GeneFoxCLI`, which is
`~/Library/Caches/GeneFoxCLI` on macOS and `$XDG_CACHE_HOME/GeneFoxCLI` (or
`~/.cache/GeneFoxCLI`) on Linux.

Download and curated payload caches use this root. Private store locations remain under `GeneFoxCLI`'s
native application-support root. The MCP startup line reports `cache=/path`, and `doctor`
reports `cache root: path=/path`. This names the configured root; it does not probe cache
write permissions. For containers, mount a persistent cache volume and pass its directory.
On WSL, use the Linux filesystem rather than `/mnt/c`.


## Output files

Figures, CSVs, recipes and HTML documents from `mcp`, and PDFs from `report export`, are
written under **one output directory** that is fixed at launch:

1. `--output-dir <dir>`, then `GENEFOX_OUTPUT_DIR`, then `<system temp>/genefox-mcp`.
2. The directory is created with mode 0700 if missing. It must be a directory and must not
   be a symbolic link. Otherwise the MCP server reports `out=unusable` and file outputs come
   back as `*_unavailable`, while `report export` exits 1.

Every write follows these rules:

- **No paths from arguments.** File names come from the app's own export name for that output
 . No tool argument becomes a path.
- **Name rules.** A name that is not a plain file name falls back to a slug of letters,
  digits, `.`, `_` and `-`. A plain name has no control or format characters, none of
  `/ \ : * ? " < > |`, no leading `.`, `-` or space, no trailing `.` or space, and at most
  200 bytes.
- **Create-only.** A file is never overwritten. If the name is taken, the next candidate is
  `<stem>-2.<ext>`, `<stem>-3.<ext>` and so on, up to 1,000 attempts. The final write uses
  `.withoutOverwriting`, so a concurrent call that picked the same name moves on to the next
  suffix.
- **Containment.** Every candidate must sit inside the output directory, compared component
  by component with this host's path convention, never as a
  string prefix. On Windows that comparison covers drive roots, UNC shares, both separators
  and case.
- **Windows device names.** On every host, a name that is a Windows reserved device name
  (`CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`, with or without an extension)
  is refused, because the file could later be copied to Windows.

MCP figure tools accept `inline_image: true` for clients that cannot read this directory.
It adds an MCP `image` content item (`data`: base64 PNG, `mimeType`: `image/png`) when the
written PNG is **at most 1,048,576 bytes** before encoding. Larger PNGs return no image item
and disclose `figure.inline_image_omitted` with `reason: "size_limit"`, `bytes`, and
`maximum_bytes: 1048576`. Files are still written in both cases. Default is `false`, with
the existing result bytes preserved when omitted. See coverage row **E1** in `list_coverage`.
The legacy `render_recipe` reports a render verdict and has no shared figure result.

The `-o` flags of `render` and `fetch` are different: they write the path you give, with a
plain `Data.write`, and **do overwrite** an existing file.


## Environment variables

These are the only environment variables `genefox` reads:

| Variable | Read by | Meaning |
| --- | --- | --- |
| `GENEFOX_RESOURCES` | every subcommand | Scientific/report resources directory, when no `--resources` flag is given; otherwise automatic install-prefix/app-bundle lookup. |
| `GENEFOX_CACHE_DIR` | every subcommand | Download cache directory, when no `--cache-dir` flag is given. |
| `XDG_CACHE_HOME` | Linux cache default | Base directory for the default `GeneFoxCLI` download cache (read by Foundation). |
| `GENEFOX_OUTPUT_DIR` | `mcp`, `report export`, `doctor` | Output directory, when no `--output-dir` flag is given. |

The default output directory comes from Foundation's `FileManager.temporaryDirectory`, which
follows the platform's usual temporary-directory setting (for example `TMPDIR` on macOS and
Linux).
