# ArcD — v0.0.8+3

## 3.1 Object List

| ID | Object | Responsibility |
|---|---|---|
| DOC-OPEN | 未處理潛在問題清單.md | 未完成實作、缺陷及風險 |
| DOC-TEST | 待測試清單.md | 已實作、待驗收項目 |
| DOC-FIXED | 已修復紀錄.md | 已驗收項目與回歸歷史 |
| DOC-RT | Relation Test.md | 測試步驟、狀態、證據 |

## 3.2 Property List

- ISSUE_ID：穩定編號，不因版本或清單轉移變動。
- SOURCE_VERSION：問題來源版本。
- CURRENT_STATE：OPEN / PENDING_TEST / VERIFIED_FIXED。
- EVIDENCE：測試環境、日期、步驟與可查驗結果。
- GLOBAL_PROPERTIES：語言、UI 色盤、文件狀態等仍由原有全域屬性清單管理，本版不改動。

## 3.3 Event Chain

發現問題 → OPEN → 完整實作 → PENDING_TEST → Relation Test PASS → VERIFIED_FIXED。測試失敗退回 OPEN；回歸重新開啟原 ID。

## 3.4 EHU List

- EHU-01：缺乏驗證證據 → 不允許 VERIFIED_FIXED。
- EHU-02：多份清單重複有效狀態 → 合併至單一有效狀態並記錄更正。
- EHU-03：測試失敗 → 退回 OPEN 並保留失敗證據。

## 3.5 Relationship Test

參照同目錄 Relation Test.md。

## Dependency

三份清單依賴 PR 版本與 Relation Test；不改動執行期 OMU LOOP 壓縮行為。
