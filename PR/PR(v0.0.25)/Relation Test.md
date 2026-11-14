# Explorer v0.0.25 — Integration acceptance
1. File > New, Ctrl+N, Explorer > New: same create() document pipeline; a new editor tab must appear.
2. Explorer context (right click) on directory or child file: New File and New Folder create entries in the selected directory, without overwriting existing names.
3. File > Open, Ctrl+O and Explorer import: same Explorer.addFile() / openHandles() pipeline. Files already inside workspace use existing root-derived handle and do not become duplicate roots.
4. Root Close closes its descendant tabs before detaching root; cancellation for unsaved file prevents detaching root. No disk deletion.
5. Left single click on file opens/switches tab even if held for >200ms without dragging; long-hold drag still reorders siblings.
6. Right click opens actions; Refresh collapses tree only.
7. Run GitHub Actions and verify in browser; no browser integration suite is included yet.
