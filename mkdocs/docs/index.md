# GeneFox CLI and MCP server

`genefox` is the headless GeneFox: a command-line tool and a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server. It shares the analysis code that the GeneFox iOS, macOS and Android apps run, so its numbers, figures, CSVs, recipes and reports come from the same code the app screens call.

There are two ways to use it:

- **CLI subcommands** (`catalog`, `validate`, `render`, `fetch`, `report export`, `curated`, `doctor`, `tools`). Each one runs once and exits. See the [CLI reference](cli.md).
- **`genefox mcp`**, an MCP server over stdio (newline-delimited JSON-RPC 2.0). It lets an MCP client such as Claude Code, Claude Desktop, Codex or OpenCode run GeneFox analyses. See the [MCP server guide](mcp.md).

## Relationship to the GeneFox app

Each MCP tool runs the same code a GeneFox app screen runs, and returns that screen's numbers as JSON. Most tools also write a PNG figure and can write the screen's CSV, a GeneFox recipe, or a single-figure HTML document. The [tool catalogue](tools.md) lists every tool and the screen it corresponds to.

## Free tools and Pro

Most tools are free (plus optional legacy tools that take local paths or URLs). The server **fails closed** for GeneFox Pro: a Pro tool is listed and callable only with a live grant, and nothing a client sends can grant one. See [Entitlements](mcp.md#entitlements-genefox-pro).

## Where to go next

| Page | What it covers |
| --- | --- |
| [Install & resources](install.md) | Requirements, the resources directory and its lookup order, cache and output directories. |
| [CLI reference](cli.md) | Subcommands, options and exit codes. |
| [MCP server guide](mcp.md) | Starting the server, connecting a client, the protocol surface, results and trust model, limits and error codes. |
| [Tool catalogue](tools.md) | Every MCP tool, generated from the server's registry. |
| [Agent plugins](plugins.md) | Setup for Claude Code, Codex and OpenCode. |

## R and Python

The [R package](https://genefox.app/r/) and [Python package](https://genefox.app/python/) call the same tools from code. Result contracts are published as [JSON Schemas](https://genefox.app/schemas/v1/).

Get the CLI from the [GeneFox download page](https://genefox.app/download/).
