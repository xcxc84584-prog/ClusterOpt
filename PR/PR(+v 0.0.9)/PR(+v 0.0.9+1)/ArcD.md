# ArcD — Opt 9+1

## Object List

- QuestionListRegistry：QuestionListx 的分組及編號區間（文件規範，尚無執行期類別）。
- IssueState：未處理 / 待測試 / 已修復，三份文件互斥。
- GlobalPropertyRegistry：沿用語言、UI 色盤、文件狀態及儲存進度的共用屬性。
- OMU：沿用 LOOP START / ERROR / EHU / END 壓縮原則。

## Properties

- ISSUE_ID：正整數，全域唯一且不可重用。
- QUESTION_LIST_INDEX：floor((ISSUE_ID - 1) / 100) + 1。
- ISSUE_SOURCE_VERSION：問題最初發現版本。
- ISSUE_STATE：OPEN / PENDING_TEST / VERIFIED_FIXED。

## Event Chain

NewIssue → Allocate ID → QuestionListx 未處理 → 完成實作 → 待測試 → Relation Test PASS → 已修復。

## EHU

- 重複 ID 或錯誤分組：拒絕並修正。
- 無測試證據：不得移至已修復。
- 測試失敗或回歸：保留 ID 返回未處理。

## Relationship Test

參照 Relation Test.md。此版為文件結構調整，不變更執行期 API。
