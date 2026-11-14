# PR/Opt 4 — Plan

1. 保留 OMU 私有事件儲存與原有 `ClusterOpt.logs()` 相容入口。
2. 新增不可覆寫的 `window.Cluster` 唯讀 Console API。
3. 提供 `log(options)`、`ehu(options)`、`dep()`、`help()`。
4. 支援 `limit`、`code`、`source` 篩選；不合法參數回傳 400 類型契約。
5. 修正 editor input handler 的 `t` 區域變數遮蔽錯誤。
6. 檢查新建、開啟、編輯、儲存、語言切換及查詢功能。

## Reference
- https://developer.mozilla.org/en-US/docs/Web/API/Window
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
