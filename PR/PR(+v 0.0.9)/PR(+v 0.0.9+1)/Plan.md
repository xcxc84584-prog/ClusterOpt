# Plan — Opt 9+1

## 實作前技術參考

- Google JavaScript Style Guide：https://google.github.io/styleguide/jsguide.html — 一致性、UTF-8、2 空格縮排、ES module、清晰命名。
- GitHub Google Style Guides：https://github.com/google/styleguide — 參考一致的工程文件與程式碼慣例。
- 現有 QuestionList 前身三份文件 — 保留問題 ID、版本、驗收狀態，不重新編號。

## 實作

1. 原根目錄三份問題清單搬入 QuestionList1；原 #1–#30 保持編號。
2. 初始化 QuestionList2 的三份空白清單，保留 #101–#200 區間。
3. 更新問題生命週期、100 題區間、每版同步與標準目錄規範。
4. 刪除原根目錄清單，避免同一問題在兩個路徑存在有效狀態。
5. 更新全域屬性清單中的目錄說明；不修改執行期程式。

## 驗收

核對 #1–#30 與來源版本、#2/#3 待測試、其餘未處理、已修復仍為空；尚未執行瀏覽器功能測試。
