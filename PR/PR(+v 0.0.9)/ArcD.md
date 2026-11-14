# Opt 9 — ArcD

## Object List

- VirtualFileSession：切片請求去重、窗口載入、WTF/MVCC 編輯與串流儲存。
- SliceLoader：Blob 範圍解碼及已載入切片註冊。
- StorageProgressTracker：操作 ID 隔離及完成數／總數百分比。
- Editor View：只將中心切片寫入 textarea；前後鄰近切片預讀。

## Properties

- STORAGE_PROGRESS：LOAD / SAVE operationId、completedUnits、totalUnits、phase。
- DOCUMENT_STATUS：LOADING / UNVERIFIED / DIVERGED / SAVING / ERROR。
- UI_PALETTE、LANGUAGE：沿用全域註冊表。

## Event Chain

USER.Open → FileManager Blob → VirtualFileSession → requestSlice(center) → requestSlice(±1) → FMC → UI。
USER.Edit → WTF → MVCC Commit → Dirty。
USER.Save → ordered Blob ranges / dirty content → writable stream → progress → close。

## EHU

- 416：非法切片索引。
- 409：被較新窗口取代的載入結果。
- 422：UTF-8 解碼錯誤。
- 500：讀寫／授權失敗；不可回報成功。

## Relationship Test

參照 Relation Test.md；尚未執行真實瀏覽器驗收。
