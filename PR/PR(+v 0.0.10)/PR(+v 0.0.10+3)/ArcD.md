# ArcD

## Object List
- EditorWindow: GoToLine UI、編輯器與行號欄
- VirtualFileSession: lineStarts、center、slice content、position
- StorageProgressTracker: 每個 documentId 獨立的 LOAD 進度
- SyncStatus: LOADING 藍色、ERROR 紅色
- OMU: 失敗事件 EHU

## Event Chain
User.GoToLine(n) → Validate → BinarySearch(lineStarts) → LoadSlice(target) → Await Success → SetSelection → Scroll → RestorePosition

## Authorization
公開 Request；私有切片與 position 狀態透過 session API 管理。

## Dependency
EditorWindow → VirtualFileSession → StorageProgressTracker；錯誤 → OMU。
