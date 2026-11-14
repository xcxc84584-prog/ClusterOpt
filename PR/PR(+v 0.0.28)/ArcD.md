# ArcD — v0.0.28

## 物件與資料流
Developer → Research → PRDrequest → ArcD → Plan → Code → VTE → Relation Test → QuestionList → Review → Merge。

## EVENT CHAIN
1. PR_START → RESEARCH.Request → SOURCE.Response → Plan（來源 URL、風險與取捨）。
2. OBJECT.Request → GLOBAL_PROPERTY.Registry → OBJECT.Response → OMU/EHU（不得越權改 private）。
3. LOOP_START → OMU.startLoop → OMU.emit×N → OMU.endLoop → compressed logs（保留錯誤與 EHU）。
4. PR_TEST.Request → createVTE() → isolated event sequence → assertions → Relation Test（PASS/FAIL/NOT RUN）。
5. ISSUE_DISCOVERY → QuestionList 未處理 → 待測試 → 已修復（以證據移轉）。

## 隔離
VTE 與正式 Documents、IndexedDB、FileSystemHandle 隔離；測試失敗不得改動使用者資料。
