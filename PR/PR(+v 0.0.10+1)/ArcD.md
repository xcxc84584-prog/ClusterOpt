# ArcD

## Object List
- VirtualFileSession: 文件獨立的 Blob、切片索引、游標與編輯
- StorageProgressTracker: 以 documentId 管理進度
- RecoveryPrebuild: 恢復 UI
- OLR: 工作區與未提交編輯恢復
- OMU: EHU / LOG

## Event Chain
Save → Rebind Blob → INDEX → Restore Position → Render Slice

Reload → OLR → Prebuild → INDEX Progress → Restore Edits → Window

## Relation
文件間不共享 slice generation；進度依 documentId 隔離。
