# 51.6 Plan
2026-11-15 參考 MDN AbortController https://developer.mozilla.org/en-US/docs/Web/API/AbortController 與 requestIdleCallback https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback 。採最新任務覆蓋與 AbortSignal；不引入 Worker，因 Shiki 模組、CDN、語言載入與跨線程序列化需另行驗證。風險：同步 tokenization 仍可能阻塞主執行緒；cancel 只能阻止 stale commit。
