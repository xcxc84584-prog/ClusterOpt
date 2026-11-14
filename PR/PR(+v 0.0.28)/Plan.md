# Plan — v0.0.28

## 實作順序
1. 查閱網路程式守則與 PR 標準化指南。
2. 檢查現有根目錄文件、QuestionList、OMU 與 VTE 程式碼。
3. 更新程式編寫守則及清單版本說明。
4. 加入本版 EVENT CHAIN VTE 回歸測試。
5. 執行 CI；按實際結果記錄，不推定 PASS。

## 網路技術參考（2026-11-14）
- https://google.github.io/eng-practices/review/reviewer/looking-for.html — 採用命名、可維護性、測試、文件同步與避免混合格式化的原則；不照搬 Google 內部流程。
- https://google.github.io/styleguide/tsguide.html — 採用 JS/TS 一致命名與格式；依本專案沿用 2 空格縮排。
- https://docs.github.com/en/pull-requests/reference/managing-and-standardizing-pull-requests — 採用 PR 模板／檢查清單概念；具體 ArcD/PRDrequest/VTE 由 ClusterOpt 自訂。

## 風險
歷史 PR 路徑不一致，避免破壞連結；舊模組缺 VTE Event Chain 測試，需後續逐 PR 補齊。
