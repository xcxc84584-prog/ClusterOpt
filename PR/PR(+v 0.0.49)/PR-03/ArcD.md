# ClusterOpt v0.0.49 — PR-03 / 49.3 Line & Micro-slice Index

## PRDrequest
Accelerate logical micro-slice offset lookup without changing physical slice authority. Retain PieceTree newline-index lineStart() from 49.1 and existing physical-slice LineTree.

## ArcD
- MicroSliceIndex is a Fenwick tree of UTF-16 lengths; prefix(i) and locate(offset) are O(log N); intersect(start,end) returns descriptor indices.
- MicroSliceDocument uses the index for locate and intersect; list remains O(N log N) because it materializes descriptors; edits rebuild the Fenwick tree in O(N) after structural splice.
- Line indexing remains three distinct scopes: PieceTree LF subtree counts (logical lines), MicroSliceIndex UTF-16 character offsets, LineTree physical-slice line totals. Do not confuse character offsets with byte offsets or logical line counts.
- No MVCC/FLAG or recovery write paths changed. No new UI.
- OCDA registry: MicroSliceIndex object, MICRO_SLICE_LENGTHS, MICRO_SLICE_PREFIX, MICRO_SLICE_RANGE; MicroSliceDocument -> MicroSliceIndex IMPORT. Total 37 registered objects.

## Relation Test / VTE
Node CI includes deterministic boundary, random prefix, structural edits and VTE isolation tests. Existing 49.1 and 49.2 randomized regressions must remain green.
## Release
Stay v0.0.49; existing Program title and root ?v=0.0.49 redirect unchanged. 49.4 will integrate edit paths after CI PASS.
