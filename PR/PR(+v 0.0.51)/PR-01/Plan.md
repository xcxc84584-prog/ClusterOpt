# 51.1 — Plan
研究日期 2026-11-15。參考 Node.js Performance API https://nodejs.org/api/perf_hooks.html （採用 performance.now 量測單調時間；風險為 JIT/GC 抖動）。參考 CodeMirror viewport decorations https://codemirror.net/docs/ref/#view.EditorView.visibleRanges （後續 51.2 可見範圍）。不採用 Shiki CDN 在 CI 作強制測試，避免網路依賴；此階段不測 DOM。
