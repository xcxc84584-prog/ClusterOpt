# PR(v0.0.6+2) — 架構設計
## 物件
- OMU（Program/src/omu.js）：私有事件佇列、唯一遞增 EventID、LoopID、巢狀 ParentLoopID。
- ExternalChangeMonitor：外部檔案監測循環；透過 OMU 公開 startLoop、emit、endLoop 契約記錄。
- GlobalPropertyRegistry：維持全域屬性單一資料來源。
- Console API：保留 Cluster.log/ehu/dep 的唯讀查詢。

## LOG 規則
| 類型 | LOOP 中 | LOOP 外 |
|---|---|---|
| START | 保留 | 不適用 |
| 正常 PROGRESS/LOG | 壓縮，不存 | 保留 |
| ERROR (code >= 400) | 保留 | 保留 |
| EHU (ehu=true) | 保留 | 保留 |
| END / ABORTED | 保留 | 不適用 |

## Event Chain
ExternalChangeMonitor.checkAll → OMU.startLoop → checkNow(id, LoopID) → OMU.emit → OMU.endLoop。

## 安全性與限制
- 每個 LoopID 獨立計數，不跨循環合併。
- END 包含 processed、suppressed、errors、durationMs。
- 事件最多保存 500 筆；EventID 使用單獨的遞增序列，清除舊事件不重用。
- 目前未提供頁面卸載時的自動 ABORTED 保證；異常終止需在可捕獲的例外中結束。
- 目前每次輪詢都會記錄 START/END，未實作跨輪詢的長期聚合。
