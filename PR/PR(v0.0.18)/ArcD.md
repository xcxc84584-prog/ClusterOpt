# ArcD — Explorer v0.0.18
## Objects
- Explorer: UI tree, handle registry, JSON ordering, context menu.
- Documents: owns editor content, IDs and dirty state; remains separate.
- OLR: existing workspace and draft recovery; remains separate.
- FileManagementCore: remains the file editing and MVCC owner.
## Event chain
Import → browser picker → Explorer.remember → IndexedDB handles → render
Reload → Explorer.restoreRoots → directory lazy scan → render
Editor switch → syncDocuments → revealDocument → expand ancestors → scroll
Context action → filesystem handle API → tree refresh
Hold 200ms → target pointer → reorder siblings → JSON persist
## EHU
Handle API, IndexedDB, permission, and storage errors are logged without modifying editor state.
## Isolation
Explorer must not mutate editor document buffers or bypass FMC/MVCC.
