# Plan

- 將虛擬載入 generation 由全域數字改為 documentId Map。
- 儲存後從磁碟重新綁定 Blob，重新建立行號索引，恢復切片位置。
- 各文件使用 StorageProgressTracker 的 documentId 追蹤操作。
- 恢復期間顯示預建立視窗與切片進度。
- 測試多視窗並行、切換、儲存、重新整理及編輯恢復。
