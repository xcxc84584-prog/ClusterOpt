# Plan — 49.5

## External references (2026-11-15)
- [SQLite Isolation](https://www.sqlite.org/isolation.html): transactions and snapshot isolation. Applicable: validate snapshot version at commit; not adopted: treating in-memory MVCC as durable ACID transaction.
- [Monaco Editor Piece Tree](https://github.com/microsoft/vscode/tree/main/src/vs/editor/common/model/pieceTreeTextBuffer): editable piece tree. Applicable: localized UTF-16 patch operations; not adopted: wholesale editor replacement or new renderer.

## Implementation
1. Inspect FMC, FlagUnit, MVCCUnit, MicroSliceDocument, EditPath, gateways, QuestionLists.
2. Add explicit expectedVersionId to editPatch; acquire parent WTF, compare current version, construct patched content, commit via existing FMC.
3. Update recovery and line index only after successful commit; always release lease.
4. Add bound gateway patch methods, tests, OCDA and GitHub inventory updates.
5. Run CI; merge only after PASS. Retain root ?v=0.0.49 and Program version.

## Risk
Current API materializes a physical slice string to commit; no large-file latency proof. AGENT identity is trusted at gateway creation, not an untrusted remote parameter. Existing full-slice edit() remains available and lacks this explicit optimistic client base-version parameter.
