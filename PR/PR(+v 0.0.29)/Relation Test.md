# Relation Test — v0.0.29

| Case | EVENT CHAIN | 預期 | 結果 |
|---|---|---|---|
| CAT-01 | createClusterDependencies → list → inventory | 22 個靜態物件且包含核心物件 | NOT RUN（待 CI） |
| CAT-02 | Registry → dep → property metadata | Explorer 不應被錯認為靜態已註冊 | NOT RUN（待 CI） |
| CAT-03 | createVTE A/B → create file → read → reset | VTE 狀態彼此隔離 | NOT RUN（待 CI） |
| CAT-04 | 文件清單 → GitHub source | 兩份清單覆蓋靜態物件並標註額外模組 | 人工比對完成，尚無自動文件檢查 |

執行：`npm test`。不宣稱完成瀏覽器 E2E。
