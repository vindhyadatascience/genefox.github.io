#!/usr/bin/env bash
# Build every GeneFox developer docs path from one app checkout:
#   /docs     CLI and MCP (MkDocs Material, from the app's canonical docs and a matching binary)
#   /r        R package (pkgdown)
#   /python   Python package (Sphinx + Furo)
#   /schemas/v1  result JSON Schemas;  /llms.txt  root index
# Run with --app-repo <checkout> --genefox <binary built from that checkout>.
# Fails on docs drift, internal text, or any build warning.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PY="${PYTHON:-python3}"
APP=""
args=("$@")
for ((i = 0; i < ${#args[@]}; i++)); do
  [ "${args[i]}" = "--app-repo" ] && APP="${args[i+1]:-}"
done
[ -n "$APP" ] && [ -d "$APP/SDK" ] || { echo "usage: $0 --app-repo <checkout> --genefox <binary>" >&2; exit 64; }
APP="$(cd "$APP" && pwd)"
TOOLS="$ROOT/.tooling"   # git-ignored: toolchains and staging, never published
mkdir -p "$TOOLS"

# --- CLI and MCP (/docs) ---
"$PY" scripts/sync-docs.py "$@"
if [ ! -x .venv/bin/python ]; then
  "$PY" -m venv .venv
fi
.venv/bin/python -m pip install --quiet --disable-pip-version-check -r mkdocs/requirements.txt
rm -rf docs
.venv/bin/mkdocs build --strict --clean -f mkdocs/mkdocs.yml
test -f docs/index.html
touch docs/.nojekyll

# --- R (/r): pkgdown from a pinned CRAN snapshot, installed into a worktree-local library ---
R_SNAPSHOT="https://packagemanager.posit.co/cran/2026-11-10"
PKGDOWN_VERSION="2.2.1"
export R_LIBS_USER="$TOOLS/R-lib"
mkdir -p "$R_LIBS_USER"
Rscript -e "
  .libPaths(c(Sys.getenv('R_LIBS_USER'), .libPaths()))
  if (!requireNamespace('pkgdown', quietly = TRUE) || as.character(packageVersion('pkgdown')) != '$PKGDOWN_VERSION') {
    options(repos = c(CRAN = '$R_SNAPSHOT'))
    install.packages('pkgdown', lib = Sys.getenv('R_LIBS_USER'), type = 'binary', quiet = TRUE)
  }
  stopifnot(as.character(packageVersion('pkgdown')) == '$PKGDOWN_VERSION')"
rm -rf "$TOOLS/stage" r
mkdir -p "$TOOLS/stage"
cp -R "$APP/SDK/R/genefox" "$TOOLS/stage/genefox"
(cd "$TOOLS/stage/genefox" && Rscript -e "
  .libPaths(c(Sys.getenv('R_LIBS_USER'), .libPaths()))
  options(warn = 2)
  pkgdown::check_pkgdown('.')
  pkgdown::build_site('.', override = list(destination = '$ROOT/r'), new_process = FALSE, install = TRUE, preview = FALSE)
  cat('pkgdown', as.character(packageVersion('pkgdown')), '\n')") 2>&1 | tee "$TOOLS/r-build.log"
grep -qiE '(^|[^a-z])warning' "$TOOLS/r-build.log" && { echo "pkgdown reported a warning" >&2; exit 1; }
test -f r/index.html && test -f r/llms.txt && test -f r/search.json

# --- Python (/python): Sphinx with warnings as errors ---
if [ ! -x "$TOOLS/sphinx-venv/bin/python" ]; then
  "$PY" -m venv "$TOOLS/sphinx-venv"
fi
"$TOOLS/sphinx-venv/bin/python" -m pip install --quiet --disable-pip-version-check -r scripts/sdk-docs-requirements.txt
rm -rf python "$TOOLS/py-doctrees"
"$TOOLS/sphinx-venv/bin/python" -m sphinx -W --keep-going -E -q -b html -d "$TOOLS/py-doctrees" "$APP/SDK/python/docs" python
rm -f python/.buildinfo
test -f python/objects.inv && test -f python/llms.txt && test -f python/llms-full.txt

# --- Result schemas (/schemas/v1) and the root llms.txt ---
rm -rf schemas
mkdir -p schemas/v1
cp "$APP"/SDK/docs-site/schemas/v1/*.schema.json schemas/v1/
"$PY" - "$ROOT/schemas/v1" <<'PY'
import html, json, sys
from pathlib import Path
d = Path(sys.argv[1])
rows = []
for p in sorted(d.glob('*.schema.json')):
    json.loads(p.read_text())  # every schema must parse
    rows.append(f'<li><a href="{p.name}">{html.escape(p.name)}</a></li>')
d.joinpath('index.html').write_text(
    '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><title>GeneFox result schemas, version 1</title>'
    '<meta name="viewport" content="width=device-width, initial-scale=1"></head>\n<body>\n'
    '<h1>GeneFox result schemas, version 1</h1>\n<p>JSON Schema contracts for tool results. '
    'See the <a href="/r/">R</a> and <a href="/python/">Python</a> references.</p>\n<ul>\n' + '\n'.join(rows) + '\n</ul>\n</body></html>\n')
PY
cp "$APP/SDK/docs-site/llms.txt" llms.txt

"$PY" scripts/check-docs-links.py
echo "Built docs/ r/ python/ schemas/v1/ llms.txt"
echo "Installed versions:"
.venv/bin/python -m pip freeze | grep -iE '^(mkdocs|mkdocs-material|mkdocs-material-extensions|pymdown-extensions|markdown|jinja2)=='
"$TOOLS/sphinx-venv/bin/python" -m pip freeze | grep -iE '^(sphinx|furo|myst-parser|sphinx-llms-txt)=='
echo "pkgdown==$PKGDOWN_VERSION (CRAN snapshot $R_SNAPSHOT); pandoc $(pandoc --version | head -1 | cut -d' ' -f2)"
