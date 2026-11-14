# Architecture

Document A → StorageProgressTracker(A, SAVE) → background write → StorageProgressTracker(A, INDEX) → reindex → LOAD viewport → SYNCED/DIVERGED.

Switching to B reads StorageProgressTracker(B) only. Switching back to A reads its existing operation without starting LOAD. The global footer is a view, not an owner of the task. The editor lock reads per-document savingDocuments/backgroundIndexing/rebuildingDocuments and current LOADING state.

Recovery: OLR.restoreAll → create document metadata → background INDEX progress → restore edits → render current viewport. No overlay DOM.
