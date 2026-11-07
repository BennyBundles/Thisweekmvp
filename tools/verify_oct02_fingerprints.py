#!/usr/bin/env python3
"""Non-mutating preservation guard for the October 1 historical TAGJ source.

Run in a full checkout of qa/oct02-original-preservation-20261106:
    python3 tools/verify_oct02_fingerprints.py

This is source-integrity QA, NOT visual/video/device parity.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
# Git blob hashes verified directly from immutable historical commit d148024...
EXPECTED_GIT_BLOBS = {
    "index.html": "dc19bdbae8776da3ba8eea0d3ce59854a27d4a51",
    "full.html": "a9fd1d8f228a64501130b827110a35d117d2a944",
}
REQUIRED_MEDIA = (
    "tagj-assets/intro/intro-poster-v149.jpg",
    "tagj-assets/intro/intro-clip-for-website-v152.mp4",
)
INTRO_MARKERS = (
    'id="introGate"',
    'id="introVideo"',
    'id="enterSound"',
    'id="enterMuted"',
    'id="skipIntro"',
    "STILL GOT NAMES IN MY CHEST",
    "playsinline",
    "tagjIntroSeenV153",
)
WORLD_MARKERS = ('data-world="home"', 'data-world="tagj"',
                 'data-world="artist"', 'data-world="producer"',
                 'data-world="creative"')


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\\0" + data).hexdigest()


def verify(root: Path = ROOT) -> list[str]:
    issues: list[str] = []
    for relative, expected in EXPECTED_GIT_BLOBS.items():
        path = root / relative
        if not path.is_file():
            issues.append(f"MISSING {relative}")
            continue
        actual = git_blob_sha(path.read_bytes())
        if actual != expected:
            issues.append(f"DRIFT {relative}: expected {expected}, actual {actual}")
    for relative in REQUIRED_MEDIA:
        path = root / relative
        if not path.is_file() or path.stat().st_size == 0:
            issues.append(f"MISSING/EMPTY MEDIA {relative}")
    intro = root / "index.html"
    if intro.is_file():
        source = intro.read_text(encoding="utf-8")
        issues.extend(f"INTRO MARKER MISSING: {m}" for m in INTRO_MARKERS if m not in source)
    full = root / "full.html"
    if full.is_file():
        source = full.read_text(encoding="utf-8")
        issues.extend(f"WORLD MARKER MISSING: {m}" for m in WORLD_MARKERS if m not in source)
    return issues


if __name__ == "__main__":
    errors = verify()
    for error in errors:
        print("FAIL:", error)
    print(f"Historical source fingerprint checks: {'FAIL' if errors else 'PASS'} ({len(errors)} issue(s))")
    print("Scope: local source only; no proof of pixel equality, audio playback, or Vercel runtime.")
    sys.exit(bool(errors))
