# ArcD — v0.0.12+2

## Objects
- SyncStatus UI: 讀取 SyncStates / StorageProgressTracker 公開狀態，延遲呈現狀態切換。
- StoragePriority UI: 透過 GLOBALS 與 storage-priority.js 契約存取設定。
- File Menu UI: 分組並承載 Tool 子選單。

## Event Chain
1. SyncStates 或 StorageProgressTracker 更新。
2. renderSyncStatus 判定顯示狀態鍵。
3. 不同鍵延遲 200ms，期間新鍵覆蓋舊候選；相同鍵立即更新進度。
4. 真實錯誤仍由原有 EHU/OMU 流程處理。

## Isolation
僅修改 UI 呈現，不修改儲存策略、文件資料或 VTE 正式物件。
