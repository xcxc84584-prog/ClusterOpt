# Explorer v0.0.19 — Event Chain / Relation Test
- Editor tab switch → Explorer.syncDocuments → revealDocument → expand ancestors → set one selected path → render one highlighted row.
- Left-click workspace item → set selected path → open inline context menu; file click also opens editor.
- Right-click workspace item → set selected path → open context menu.
- Selection changes → previous row loses highlight.
- Explorer render → workspace section only; no OPEN EDITORS section.
- Buttons, input and tree rows use rounded borders and theme colors.
## VTE boundary
Test only against isolated workspace handles and temporary files. Do not delete production files.
## Manual checks pending
Desktop/mobile click and context menu, rapid editor tab switching, duplicate filenames, dark/light palette, touch long-press drag, browser reload.

## Close action (added)
- Context Close on a root (folder or imported root file): detach only from Explorer and IndexedDB; do not delete filesystem content.
- Context Close on a nested file: identify the open document by FileSystemHandle.isSameEntry, call the existing editor close lifecycle; never remove the workspace tree entry.
- Duplicate basenames: no name-only matching. Unsaved edits: existing close confirmation remains authoritative.
- Context Close on a nested directory: no matching editor tab; tree remains unchanged.
- Manual browser verification pending.
