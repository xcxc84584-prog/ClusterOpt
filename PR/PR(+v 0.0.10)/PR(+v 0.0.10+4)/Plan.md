# Plan

1. 確認 FMC MVCC 的 dirty 狀態由 VirtualFileSession.recoveryEdits / dirty 暴露；OLR 透過 IndexedDB restoreAll 讀取工作區紀錄。
2. 載入切片完成、LOAD 進度結束後非同步查詢 OLR，避免進度條仍被 RUNNING 覆蓋。
3. 使用 FileSystemHandle.isSameEntry 判定 OLR 紀錄與目前文件相同，不單靠檔名。
4. 有未持久化變更 => DIVERGED；無 handle => UNVERIFIED；檢查失敗 => UNVERIFIED + EHU；確認乾淨 => SYNCED。
5. 保持原進度條 per-document 隔離、版本號、GitHub Pages 路徑。

參考：https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
https://google.github.io/eng-practices/review/developer/small-cls.html
