# ClusterOpt v0.0.49 — PR-02 (49.2 Micro-slices)

## PRDrequest
Create bounded logical micro-slices within an already registered physical slice. Support localized edits and preserve IDs of unaffected micro-slices without changing physical file, lease or MVCC semantics.

## ArcD
- MicroSliceDocument(parentSliceId, text, {maxLength:4096}) owns a PieceTree and ordered micro-slice descriptors.
- Public properties: parentSliceId, revision, length, microSliceCount, lineCount; list() exposes frozen descriptors (id, parentSliceId, start, end, length).
- Requests: locate(offset), insert(), delete(), replace(), slice(), lineStart().
- Each edit rebuilds only intersecting descriptors. Unaffected left/right descriptor IDs remain stable. IDs are unique within a document instance; they are not persistent cross-reload identities.
- UTF-16 offsets match the existing textarea/PieceTree, not file byte offsets. Surrogate-pair/grapheme-safe boundary selection is a caller responsibility.
- Isolation: MicroSliceDocument cannot acquire/release FLAG or commit MVCC. Parent physical slice remains the authoritative lease and revision scope until 49.5.
- Boundary sizes are bounded by maxLength; metadata operations currently use linear descriptor scans and arrays. 49.3 introduces indexed offsets to improve navigation.
- Not a global large-file materialization: instantiate only for an already resident physical slice.

## Relation Test
400 deterministic randomized edits vs plain strings, boundary continuity, descriptor size cap, unaffected ID preservation, invalid input and isolated VTE. GitHub CI required before merge.

## Release
Version stays 0.0.49, root redirect remains ?v=0.0.49. PR-02 is a sub-stage, not a new release.
