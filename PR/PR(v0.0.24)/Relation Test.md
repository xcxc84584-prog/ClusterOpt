# Explorer v0.0.24 — Integration contract
- Root Close: close editor tabs whose FileSystemHandle is root or descendant of root directory (resolve); then detach root from Explorer and IndexedDB. No disk deletion.
- If dirty-file close confirmation is rejected, retain root. Already closed tabs remain closed.
- File > New and Explorer > New both call Explorer.newFile() → existing create().
- File > Open, Ctrl+O and Explorer > Import File all call Explorer.addFile() → same file picker, root registration and createVirtual() editor pipeline.
- Single left click workspace file opens or switches its editor tab; no double-click required.
- Right click shows action menu; left hold 200ms drag reorders siblings; arrow expands directory.
- Refresh collapses all expanded folders, not editor tabs.
- CI and browser interaction verification pending.
