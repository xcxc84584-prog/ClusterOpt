# 51.4 ArcD
UI → TextHighlighter.Request.highlightSlice → RevisionTokenCache.Request.get/put → TextHighlighter.Response.resolveColors → HighlightRenderer.Response.render；Signal aborted → STALE，解析錯誤 → FALLBACK/EHU；cache invalidation 按 documentId。46 objects，屬性 TOKEN_CACHE_REVISION、TOKEN_CACHE_BUDGET。無 FLAG/MVCC 寫入。
