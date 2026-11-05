# Phase 51 — Bounded Safari UTF-8 Restoration Input Windows

**Date:** 2026-11-02  
**Scope:** This Week raw financial Plan backup/restore in the still-unmerged consolidated review candidate, PR #29.  
**Release:** NONE. No access to personal financial records, no production deploy.

## Independently observed problem

The Phase 49 byte-length algorithm correctly reused a 16 KiB `Uint8Array` output buffer, but each iteration passed `text.slice(offset)` to `TextEncoder.encodeInto`. For a 3.4 million-code-unit backup with a 16 KiB output buffer this produces a series of successively shorter **multi-megabyte input strings**. Whether substring creation copies or shares backing memory depends on the JavaScript engine. The bounded output buffer alone did not bound the size of input substrings or the total number of UTF-16 code units presented across calls. This may cause avoidable memory pressure in iPhone Safari, though **no physical Safari memory or performance measurement has been performed**.

MDN source: https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto (the `read` value measures UTF-16 code units, the `written` value measures UTF-8 bytes; a buffer of 3 bytes per code unit is sufficient).
MDN source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String (JS slicing indexes UTF-16 code units, and splitting surrogate pairs changes their encoding).

## Implemented correction

1. Use at most `min(4096, floor(scratch.length/3))` UTF-16 code units per input window. Existing 16 KiB scratch buffer is reused.
2. When a window ends on a leading UTF-16 surrogate, defer it to the next window. Full surrogate pairs therefore encode as 4 bytes rather than two unrelated replacement characters.
3. Reject partial or malformed `encodeInto` results, including positive-but-incomplete progress. Restore remains fail-closed.
4. Preserve the existing 4 MiB total raw-backup byte cap, the exact-key allowlist, the no-session-data policy, and the transactional storage rollback rules.
5. Add three source-bound regression tests for large input-window limits, emoji at chunk boundaries, and partial encoder progress; update the cross-stack security invariant.

## Reproducible synthetic local measurement

Environment: Node.js 22.16.0, Linux container, one run per case. Measurements are indicative only, **not evidence of iOS Safari speedups**.

| Input | Metric | Before | After |
|---|---|---:|---:|
| 3,400,000 ASCII code units | Maximum input substring handed to `encodeInto` | 3,400,000 | 4,096 |
| 3,400,000 ASCII code units | Sum of input substring lengths across calls | 354,485,248 | 3,400,000 |
| 3,400,000 ASCII code units | Elapsed time in this Node run | 0.97 ms | 1.45 ms |
| 760,000 mixed emoji/CJK code units | Maximum substring length | 760,000 | 4,096 |
| 760,000 mixed emoji/CJK code units | Sum of input substring lengths | 44,449,228 | 760,000 |
| 760,000 mixed emoji/CJK code units | Elapsed time in this Node run | 1.21 ms | 1.40 ms |

An additional 180 deterministic randomized Unicode/isolated-surrogate cases returned the exact same UTF-8 byte length as `TextEncoder.encode(text)`. This independent test included ASCII, accented, CJK, and split or lone surrogate cases. The experimental input-window reduction is real; **throughput was slightly slower in Node**, not faster. On Safari, actual memory/latency gains are unknown until device QA.

## Residual risks and release gates

- JavaScriptCore may use substrings or internal copying differently from Node V8; only an iOS Safari benchmark can determine whether this reduces real peak memory.
- A browser without `encodeInto` still needs the existing fallback `encode(text).byteLength`, which can allocate a buffer for the entire entry. Removing that fallback requires a separate compatibility decision, not a silent change to security behavior.
- The safety cap counts UTF-8 bytes of allowlisted key/value text, not overall JSON file bytes, the JSON parser's temporary allocations, or Safari's localStorage capacity. A 4 MiB input can still require much more transient memory.
- Physical iPhone Safari acceptance requires repeated synthetic 4 MiB boundary cases, emoji/ZWJ/CJK, offline reconnect, partial storage failures, and local Plan recovery, with measured peak memory when available.
- Do not merge the consolidated 79+ commit PR until independent review; no Vercel production promotion, live money activation, or Supabase changes.

**CI must pass on the exact post-change SHA.** All claims here are limited to the isolated Node experiment and source-level regression results until CI is confirmed.
