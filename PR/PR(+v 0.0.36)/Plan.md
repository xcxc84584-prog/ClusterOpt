# Plan — v0.0.36

Fix the scroll-range mismatch rather than adding duplicate line numbers. Use measured editor.scrollHeight and gutter.scrollHeight; ensure equal scrollable extent; keep per-input updates and requestAnimationFrame resync. Verify with unsaved Enter at EOF and viewport boundary.
