# Explorer v0.0.20 — Mouse behavior
- Left click: select one row, display context action menu including Close.
- Right mouse down + drag to another sibling + release: reorder within same parent; persist order to workspace JSON.
- Right click without drag: do not open action menu and do not reorder.
- Drag across different parents: no move.
- Right click suppresses native browser context menu on Explorer entries.
- Closing root detaches from Explorer; closing nested file closes matching editor tab without deleting data.
- Browser integration tests pending; verify with disposable files first.
