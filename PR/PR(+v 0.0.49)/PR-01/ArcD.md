# ClusterOpt v0.0.49 — PR-01 (49.1 Piece Tree)

## PRDrequest
Implement an independent editable Piece Tree core without changing the active textarea/virtual slice persistence path. Future PR-02 micro-slices and PR-05 MVCC/FLAG integration must pass existing authorization and recovery gates before use.

## ArcD
- PieceTree: immutable original string, append-only added buffer, implicit priority-balanced tree with UTF-16 character counts and LF counts per subtree.
- Requests: insert(offset,text), delete(start,end), replace(start,end,text), slice(start,end), lineStart(line).
- Properties: length, newlineCount, lineCount, revision.
- Read-only VTE isolation. No dependency on MVCC, FlagUnit, IndexedDB or disk.
- Range validation rejects invalid UTF-16 offsets; callers are responsible for Unicode grapheme-safe cursor boundaries.
- Expected logarithmic split/merge tree operations; generating inserted text and slicing requested output still cost proportional to content size. Not yet benchmarked for GB-scale use.

## Plan
49.1 Piece Tree core; 49.2 micro-slice boundary model; 49.3 line index; 49.4 editor edit-path integration; 49.5 MVCC and FLAG UNIT integration. Do not prematurely replace the existing editor path.

## Relation Test
CI: npm test; randomized deterministic replacement vs string reference; LF offsets; boundary validation; isolated VTE. Status pending CI.
Browser editing and 1 GiB+ performance: NOT RUN. Existing recovery, persistence, and slice lease semantics unchanged.
Version and redirect: Program 0.0.49; root ?v=0.0.49.
