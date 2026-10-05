#!/usr/bin/env bash
# Build the GeneFox CLI/MCP docs (MkDocs Material) into /docs at the repo root.
# Run from anywhere. Creates .venv on first use. Fails on any warning.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PY="${PYTHON:-python3}"
if [ ! -x .venv/bin/python ]; then
  "$PY" -m venv .venv
fi
.venv/bin/python -m pip install --quiet --disable-pip-version-check -r mkdocs/requirements.txt
# Clean only the output directory, then build.
rm -rf docs
.venv/bin/mkdocs build --strict --clean -f mkdocs/mkdocs.yml
test -f docs/index.html
# Keep built docs out of Jekyll even if the repo-root .nojekyll is ever removed.
touch docs/.nojekyll
echo "Built docs/ ($(find docs -type f | wc -l | tr -d ' ') files)."
echo "Installed versions:"
.venv/bin/python -m pip freeze | grep -iE '^(mkdocs|mkdocs-material|mkdocs-material-extensions|pymdown-extensions|markdown|jinja2)==' 
