# Relation Test — Repository Governance

## Planned command
`npm test` (GitHub Actions `ClusterOpt tests` workflow).

## Cases
- Static repository tree: README, PROJECT_ARCHITECTURE and canonical inventories exist.
- OCDA registry: exactly 38 objects, including PieceTree, MicroSliceDocument, MicroSliceIndex and EditPath.
- Redirect and release: v0.0.49 in root redirect, Program title and main title.
- VTE noninterference: `createVTE().Status().data.files` remains empty after registry read.
- Runtime compatibility: existing Node/VTE/OCDA tests must remain green.

## Evidence
Status **PENDING CI** at authoring time. Do not infer browser, multi-GiB, runtime permission or full EHU coverage from CI. Record actual GitHub run number and PASS/FAIL in PR metadata after execution.
