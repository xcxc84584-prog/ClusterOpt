# ArcD — Repository Governance

## Object and property relationships
Documentation only. `DependencyRegistry` is the source of truth for OCDA object declarations; `OBJECT_LIST.md` and `PROPERTY_LIST.md` are generated-style snapshots; `物件清單.md`, `屬性清單.md`, `全域屬性清單.md` are canonical human-facing descriptions.

## Event chain
Maintainer -> RepositoryAudit.Request.Verify -> DocumentationIndex.Response -> test assertion PASS/FAIL -> GitHub Actions result -> PR merge gate. This is a static documentation test, not an EHU-producing runtime Event Chain. Existing runtime VTE and EHU event-chain tests remain unchanged.

## Isolation
No new Public/Protected/Private runtime object, no new Request/Response or EHU handler. No changes to IndexedDB, MVCC, FLAG, FileSystemHandle, editor state, or user files. Existing `createVTE()` remains isolated.

## Known limitations
A static registry list is not an AST-derived execution trace. 49.5 remains pending; 1 GiB/5 GiB browser tests NOT RUN. Historical PR documentation remains incomplete and is explicitly audited in PROJECT_ARCHITECTURE.md.
