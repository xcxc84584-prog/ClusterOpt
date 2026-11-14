# Plan — v0.0.29

## 開發前參考（2026-11-14）
- https://google.github.io/eng-practices/review/reviewer/looking-for.html — 參考文件與程式碼同步、測試可維護性；不照搬 Google 內部審查流程。
- https://github.com/google/eng-practices — 開源的工程實踐文件，作為文件維護與程式可讀性參考；非 ClusterOpt 物件架構來源。

## 實作
1. 讀取現有兩份清單與 DependencyRegistry。
2. 核對 Program/src 主要模組與私有欄位。
3. 更新清單並區分靜態宣告、實作存在、推定關係。
4. 增加 VTE/Registry 回歸測試，檢查所有 QuestionList。
5. 等待 CI 驗證，測試未完成不得標 PASS。
