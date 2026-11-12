#!/usr/bin/env python3
"""Check every link in the developer docs (/docs, /r, /python, /schemas, /llms.txt files).

Same-site links (relative, root-absolute or https://genefox.app/...) must resolve to a file
in this checkout, and a #fragment must name an id on the target page. External links are
listed with --external and fetched only with --online.
"""
import argparse
import re
import sys
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://genefox.app/'
TREES = ['docs', 'r', 'python', 'schemas']
TEXT_INDEXES = ['llms.txt', 'r/llms.txt', 'python/llms.txt', 'python/llms-full.txt']
SKIP_SCHEMES = ('mailto:', 'javascript:', 'data:', 'tel:')


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids, self.base = [], set(), None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ('id', 'name'):
            if a.get(key):
                self.ids.add(a[key])
        if tag == 'base' and a.get('href'):
            self.base = a['href']
        for key in ('href', 'src'):
            if a.get(key) and tag != 'base':
                self.links.append(a[key])


def parse(path, cache={}):
    if path not in cache:
        p = Links()
        p.feed(path.read_text(errors='replace'))
        cache[path] = p
    return cache[path]


def target(url, page):
    """Map a same-site URL to (file, fragment); None for external."""
    if url.startswith(SITE):
        rel = url[len(SITE):]
        base = ROOT
    elif re.match(r'^[a-z][a-z0-9+.-]*:', url) or url.startswith('//'):
        return None
    elif url.startswith('/'):
        rel, base = url[1:], ROOT
    else:
        rel, base = url, page.parent
    path, _, frag = rel.partition('#')
    path = urllib.parse.unquote(path.split('?', 1)[0])
    f = (base / path).resolve() if path else page
    if f.is_dir() or path.endswith('/') or not path and f.is_dir():
        f = f / 'index.html'
    return f, frag


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--external', action='store_true', help='print external links')
    ap.add_argument('--online', action='store_true', help='fetch external links (HEAD, then GET)')
    args = ap.parse_args()
    errors, external, checked = [], set(), 0
    pages = [p for t in TREES for p in (ROOT / t).rglob('*.html')]
    sources = [(p, parse(p).links) for p in pages]
    for name in TEXT_INDEXES:
        p = ROOT / name
        if not p.exists():
            errors.append(f'{name}: missing')
            continue
        sources.append((p, re.findall(r'\]\((\S+?)\)', p.read_text())))
    for page, links in sources:
        for url in links:
            if url.startswith(SKIP_SCHEMES) or url == '#':
                continue
            t = target(url, page)
            if t is None:
                external.add(url)
                continue
            checked += 1
            f, frag = t
            where = page.relative_to(ROOT)
            if not str(f).startswith(str(ROOT)) or not f.exists():
                errors.append(f'{where}: {url} -> missing {f.relative_to(ROOT) if str(f).startswith(str(ROOT)) else f}')
            elif frag and f.suffix == '.html' and frag not in parse(f).ids:
                errors.append(f'{where}: {url} -> no #{frag}')
    if args.external or args.online:
        for url in sorted(external):
            status = ''
            if args.online:
                try:
                    req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'genefox-docs-linkcheck'})
                    try:
                        status = urllib.request.urlopen(req, timeout=20).status
                    except Exception:
                        req.method = 'GET'
                        status = urllib.request.urlopen(req, timeout=20).status
                except Exception as e:
                    status = f'FAIL {e}'
                    errors.append(f'external: {url} {status}')
            print(f'external {status} {url}')
    for e in errors:
        print(e, file=sys.stderr)
    print(f'{checked} same-site links checked, {len(external)} external, {len(errors)} problems.')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
