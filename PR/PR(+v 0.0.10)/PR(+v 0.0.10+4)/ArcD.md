# ArcD

## Object List
- FMC / MVCCUnit：記錄已載入切片的版本與提交；VirtualFileSession.dirty 表示尚未持久化的提交
- OLR / OverloadRestorer：IndexedDB workspace 中的可恢復編輯紀錄
- SyncStatus：每個 documentId 的 LOADING、DIVERGED、UNVERIFIED、SYNCED
- StorageProgressTracker：LOAD 完成後觸發狀態協調
- OMU：讀取失敗 EHU

## Event Chain
Load → MVCC/Session Dirty Check → OLR.restoreAll → SameEntry → SYNCED / DIVERGED / UNVERIFIED

## Security
無法確認來源或 IndexedDB 查詢失敗不得顯示綠色。MVCC 目前沒有獨立持久化的 pre-commit queue，因此以 dirty commit + OLR recovery snapshot 為依據。
