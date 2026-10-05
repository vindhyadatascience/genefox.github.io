# Agent plugins

!!! info "Coming soon"
    GeneFox agent plugins are not available yet. This page describes what is planned, so you know what to expect. No release dates are set.

The goal is one install step in each of **Claude Code**, **Codex** and **OpenCode** that gives an agent the GeneFox MCP server (`genefox mcp`) and the guidance to use it well, with no change to the server's trust, cancellation, entitlement, account or consent boundaries.

What is decided:

- **Thin package.** A plugin holds manifests, skill text, MCP server entries and a setup check. It contains no scientific logic and calls only the published CLI and MCP contracts.
- **Separate licence.** The plugin itself will be Apache-2.0. The GeneFox CLI and app remain proprietary, and the GeneFox name and logo are not licensed.
- **No bundled binary in the first version.** A plugin launches an installed `genefox`. It does not ship the binary.
- **The server stays the authority.** Pro tools fail closed in the server, the [`untrusted_*` rules](mcp.md#results-and-the-untrusted_-trust-model) come from the server's own instructions, and a plugin never pre-approves tools, raises entitlements or stands in for a human approval.

Until plugins are available, you can connect a client directly: see [Connecting a client](mcp.md#connecting-a-client).
