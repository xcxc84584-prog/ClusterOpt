# PRD — Explorer workspace v0.0.18
- Explicit local file/folder import, refresh, search, close.
- Persist imported File System Access handles in IndexedDB; JSON ordering and expansion in localStorage.
- Preserve opened editor tabs and draft contents using existing OLR recovery in main.js (no replacement of recovery subsystem).
- Reveal active document in Explorer; name matching is ambiguous when duplicate basenames exist.
- Context menu rename/delete/cut/copy/paste and 200ms hold-to-reorder.
- Inline rename; Cluster graphite styling.
## Known limitations
- Folder rename/copy and cross-directory folder move need a separate safe recursive transaction implementation.
- Rename/delete of an already open file is not yet synchronized to Documents/MVCC; avoid using those actions on dirty open files.
- On unsupported browsers, folder import requires File System Access API; file import falls back to file input.
- Permissions may need reauthorization after reload; recovery cannot guarantee restored OS file access.
