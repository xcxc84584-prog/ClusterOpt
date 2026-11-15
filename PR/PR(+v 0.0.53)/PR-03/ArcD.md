# ArcD
TextHighlighter scheduling: resident size >64 KiB → viewport-only syntax region (≤100 lines and ≤12 KiB); larger viewport text → plain fallback; scroll viewport change → debounced highlight; reuse HighlightRenderer LF index and token cache, avoid overlay reset on each scroll. Small resident text keeps existing full-slice path. No changes to FLAG/MVCC, micro-slice ownership or VTE.
