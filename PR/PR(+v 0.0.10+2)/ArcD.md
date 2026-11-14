# ArcD

## Object List
- EditorWindow: 行號 gutter 與視窗狀態
- Documents: 文件 ID、名稱、revision、handle
- FileManager: 開檔與 handle 身分比對
- StorageProgressTracker: 操作進度
- SyncStatus: SYNCED / DIVERGED / ERROR
- OMU: 錯誤日誌

## Event Chain
Save → Reindex → Render → Refresh (preserve gutter)

Open → Find Existing Entry → Switch or Create

Save Success → Compare Revision → SYNCED (green)
