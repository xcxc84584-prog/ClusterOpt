# ArcD — v0.0.10

## Object List
- OLR: 恢復工作區與編輯狀態
- VirtualFileSession: 切片索引、視窗與編輯還原
- RecoveryPrebuild: 暫時性 UI，顯示檔名、狀態與索引進度
- StorageProgressTracker: INDEX 操作進度
- OMU: 錯誤事件與 LOG

## Event Chain
`OLR.restoreAll → RecoveryPrebuild.show → VirtualFileSession.indexLines(progress) → restoreEdits → window → RecoveryPrebuild.hide`

## Property / Authorization
恢復 UI 僅使用公開顯示資料，不暴露檔案內容；檔案內容與未提交編輯仍由原有物件處理。錯誤由原有 EHU/OMU 通路記錄。
