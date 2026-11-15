# v0.0.50 PR-01 — 換行效能基準

目標：建立可重現 Enter 工作負載，分別量測 PieceTree 插入、EditPath 全文前後綴同步與全文 LF 掃描，輸出 P50/P95/P99。不可將 Node 測試當成瀏覽器 UI/GB 實測。更新 v0.0.50 title、重導向、OCDA 與清單。

驗收：相同工作負載正確行數、無 VTE 干擾、無敏感內容輸出、CI PASS、既有回歸保持成功。
