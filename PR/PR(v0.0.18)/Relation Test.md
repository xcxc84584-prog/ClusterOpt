# Relation Test / VTE
| Event | Virtual test | Expected |
|---|---|---|
| Search | Explorer test with in-memory entries | preserves order |
| File import | mocked picker/handle in browser | no duplicate root |
| Reload | isolated IndexedDB browser profile | handles restored if permitted |
| Switch document | fake document names/tree | expands ancestors |
| Long hold | pointer events at 200ms | reorders siblings and persists JSON |
| Rename/delete | temporary directory fixture only | no editor buffer mutation |
| Cut/copy/paste | temporary file fixture | byte-for-byte content |
## VTE boundary
Use only a temporary File System Access directory or browser test doubles.
Never execute destructive operations on production files or the user's workspace.
Existing `window.VTE` tests FMC/FlagUnit/MVCC; it does not emulate the browser File System Access picker, so browser UI validation remains required.
## Status
Automated pure search regression added. Browser integration, reload, drag and filesystem operations remain **manual / pending**.
