# Plan — v0.0.12

## 實作
- 建立 `dependency-registry.js`，單一物件／相依資料來源。
- 以 registry 取代 `main.js` 既有六條寫死的相依資料。
- Console：`Cluster.dep()`、`Cluster.dep('FlagUnit')`、`Cluster.objects()`。
- 補齊物件清單、屬性清單、程式編寫守則、PR 四份文件與 QuestionList 記錄。
- 保留 OMU 原有 LOOP 壓縮；增加測試。
- 歷史 PR 目錄不強制搬動，避免破壞既有連結；新 PR 採固定四文件格式。

## 實作前網路參考
1. Google Engineering Practices — https://google.github.io/eng-practices/review/reviewer/looking-for.html
   - 採用：清晰命名、最小複雜度、文件與測試同步。
2. Google TypeScript/JavaScript Style Guide — https://google.github.io/styleguide/tsguide.html
   - 採用：一致性與可維護性；本專案為純 JavaScript，維持原有 ES Module。
3. Google Code Review Standard — https://github.com/google/eng-practices/blob/master/review/reviewer/standard.md
   - 採用：改動必須改善程式健康度；不在功能 PR 中大量格式化舊檔案。

## 限制
相依宣告不等於執行期 AST/Call Graph 自動發現；完整 OCDA ACL 驗證另列問題。
