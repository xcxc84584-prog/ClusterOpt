# Explorer v0.0.27 — cache and inline create regression
- `Program/src/main.js` imports `explorer.js?v=opt027-inline-ui`, ensuring a fresh ES module after deployment.
- Program HTML title and visible version are v0.0.27; CSS and main JS URLs use opt027-inline-ui.
- Root entrypoint redirects to Program/?v=0.0.27 and preserves existing query/hash.
- Right-click directory → New File or New Folder: inline input row appears in Explorer, no native prompt.
- Enter commits valid filename; Escape cancels; blank name cancels; duplicate name does not overwrite.
- File > New remains separate untitled editor creation; no Explorer New toolbar button.
- Browser runtime verification required after Pages deployment.
