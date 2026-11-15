# ClusterOpt v0.0.49 — PR-04 / 49.4 Editor Edit Path

## PRDrequest
Integrate resident PieceTree/MicroSliceDocument edit reconciliation with actual native textarea input, preserving all existing physical-slice MVCC/FLAG commits, recovery, IME and undo. No new UI. Limit resident memory growth.

## ArcD
- EditPath(parentSliceId,text) owns MicroSliceDocument and authoritative last-observed textarea snapshot.
- UI beforeinput captures baseline when possible. UI input reconciles UTF-16 changed span via common prefix/suffix, then updates only affected micro-slice metadata.
- Max one active resident buffer; only create for <=1 Mi UTF-16 code units; larger text follows existing path.
- Every edit still calls VirtualFileSession.edit(index, fullContent), which owns the real FLAG/MVCC transaction; EditPath is a secondary derived cache and never grants permissions.
- On reconciliation error clear cache and emit OMU EHU; never prevent normal commit.
- Known limitation: full textarea.value and full-content MVCC commit remain; large-file throughput improvements cannot be claimed until 49.5 and browser benchmarking. Prefix/suffix diff is O(N) in unchanged text.
- OCDA new object EditPath, properties PARENT_SLICE_ID, EDIT_REVISION, TEXT_LENGTH, LINE_COUNT; UI -> EditPath REQUEST, EditPath -> MicroSliceDocument IMPORT. 38 registered objects.
- GitHub root object/property lists: OBJECT_LIST.md and PROPERTY_LIST.md, generated from registry declarations.

## Relation Test
CI tests cover IME, undo, arbitrary edits, reset, VTE isolation, OCDA count, and version/redirect contract. Browser and multi-GB benchmarks NOT RUN.

## Release
Version remains v0.0.49 in Program/index.html and main.js; root index.html redirects to Program/?v=0.0.49. main.js module cache query opt049-pr04 is refreshed in Program/index.html.
