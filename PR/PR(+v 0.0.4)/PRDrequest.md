# PR/Opt 4 — PRDrequest

## Goal
讓使用者透過瀏覽器 Console 呼叫 OMU 唯讀查詢：`Cluster.log()`、`Cluster.ehu()`、`Cluster.dep()`。

## Constraints
- 瀏覽器 JavaScript Console 不支援以 `/Cluster` 起頭的指令；使用標準 JavaScript 語法 `Cluster.*()`。
- OMU 仍是黑箱，僅提供查詢結果副本，不公開內部陣列。
- 沿用 HTTP 類型狀態碼，EHU 特別標記；不建立遠端 HTTP API。
- 維持純黑 UI 與全域 LANGUAGE Property。
