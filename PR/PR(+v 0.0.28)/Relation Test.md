# Relation Test — v0.0.28

## EVENT CHAIN 驗收
- GOV-01：PR_START → Research → Plan：確認來源 URL、日期與採用理由。狀態：文件檢查。
- GOV-02：LOOP_START → repeated normal events → ERROR/EHU → LOOP_END：驗證只保留 START、ERROR、EHU、END。狀態：新增自動測試，待 CI。
- GOV-03：createVTE() A/B → virtual file create/read/delete → event logs → Reset：驗證隔離與事件序列。狀態：新增自動測試，待 CI。
- GOV-04：QuestionList 三階段與全域唯一編號：檢查無重複狀態。狀態：文件檢查。
- GOV-05：每個未來 PR 需建立其實際功能的 VTE EVENT CHAIN；本 PR 僅覆蓋治理規範與示範鏈，不代表其他 PR 已測試。

## 測試命令
`npm test`（倉庫根目錄）。未取得 CI 結果前為 NOT RUN。
