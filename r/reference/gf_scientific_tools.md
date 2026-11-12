# Generated GeneFox scientific tool clients

Typed clients generated from the shared runtime input schemas. The
runtime validates scientific arguments and computes every result.

## Details

Use [`gf_tools()`](https://genefox.app/r/reference/gf_client.md) to
inspect runtime availability. Each generated function has its own help
page with usage and arguments, for example
[`?gf_account_status`](https://genefox.app/r/reference/gf_account_status.md).
Functions accept a GeneFox session and the arguments documented by its
tool schema; NULL arguments are omitted. Analyses retrieve public data
from their providers over the network; no GeneFox account or language
model is required.

## Value

A GeneFox result containing the original engine payload, provenance and
owned figures.
