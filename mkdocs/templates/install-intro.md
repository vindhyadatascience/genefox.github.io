# Install & resources

!!! info "Binary downloads: coming soon"
    Binary downloads are not published yet. This page describes the requirements and layout the CLI uses, so you can plan your setup.

## Supported platforms

`genefox` targets these architectures. Availability depends on the published release:

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

