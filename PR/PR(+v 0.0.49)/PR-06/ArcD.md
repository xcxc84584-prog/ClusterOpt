# ArcD — 49.5 MVCC / FLAG Micro Patch

## Event chain
Caller -> UserFlagGateway.patch / AgentFlagGateway.patch -> VirtualFileSession.editPatch -> SliceLoader.requestSlice -> FileManagementCore.userWrite / acquireWTF -> FileManagementCore.read (MVCC current) -> compare expectedVersionId -> MicroSliceDocument.replace -> FileManagementCore.commit / agentCommit -> MVCCUnit.commit -> dirty + recovery + lineStarts -> releaseWTF (finally) -> Response.

## Errors and EHU
400 MICRO_PATCH_INVALID; 409 MICRO_PATCH_VERSION_CONFLICT; 416 MICRO_PATCH_RANGE_INVALID; FLAG lease denial uses existing FLAG EHU. Failed patch leaves committed content unchanged. Release lease in finally. Version comparison happens while holding parent WTF.

## Isolation and limits
All micro-ranges of one physical slice share the parent WTF and MVCC version. MicroSliceDocument is ephemeral and cannot grant rights. No new runtime object (38 existing); new OCDA properties MICRO_PATCH_BASE_VERSION and MICRO_PATCH_RANGE, relation VirtualFileSession -> MicroSliceDocument. No disk transaction, multi-slice atomic patch, independent micro lease, or browser GB benchmark.
