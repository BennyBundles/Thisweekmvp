#!/usr/bin/env python3
"""Read-only October 2 source preservation checks; never rebuilds or modifies the site.

Run from a full checkout of the historical source:
    python3 tools/verify_oct02_original.py
The script validates local source structure and internal links. It cannot establish
pixel equality, autoplay behavior, mobile playback, or authenticated hosting.
"""
from __future__ import annotations
import html.parser
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = (
    "index.html", "full.html", "tagj.html", "artist.html",
    "producer.html", "creative.html", "catalogue/index.html",
)
PRESERVED = ("Skip Intro", "STILL GOT NAMES IN MY CHEST")
IGNORE_SCHEMES = ("https:", "http:", "mailto:", "tel:", "data:", "javascript:", "//", "#")

class LocalRefs(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        key = "href" if tag in ("a", "link") else "src" if tag in ("script", "img", "video", "source") else None
        if key and data.get(key):
            self.refs.append((tag, data[key]))

def main():
    failures = []
    for page in PAGES:
        f = ROOT / page
        if not f.is_file():
            failures.append(f"MISSING PAGE: {page}")
            continue
        source = f.read_text(encoding="utf-8")
        parser = LocalRefs()
        parser.feed(source)
        for tag, ref in parser.refs:
            if ref.startswith(IGNORE_SCHEMES) or ref.startswith("/") or ref.startswith("?"):
                continue
            clean = ref.split("#", 1)[0].split("?", 1)[0]
            if not clean:
                continue
            dest = (f.parent / clean)
            if not dest.exists():
                failures.append(f"BROKEN LOCAL REF: {page} {tag} -> {ref}")
    intro = ROOT / "index.html"
    if intro.is_file():
        src = intro.read_text(encoding="utf-8")
        for marker in PRESERVED:
            if marker.casefold() not in src.casefold():
                failures.append(f"MISSING INTRO MARKER: {marker}")
    for message in failures:
        print("FAIL:", message)
    print(f"Checked {len(PAGES)} historical routes; {len(failures)} issue(s).")
    print("NOTE: static source only; original video/device pixel parity NOT verified.")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
