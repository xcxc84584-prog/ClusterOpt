# Opt 7 — Plan

## 參考
- VS Code textbuffer: https://github.com/microsoft/vscode-textbuffer
- Blob.slice: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice
- FileSystemWritableFileStream: https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable
- Google JavaScript Style Guide: https://google.github.io/styleguide/jsguide.html

## 階段
1. **P0 已提交，未驗收**：FMC、FU、MVCCU、SL、StorageProgressTracker 的獨立 ES modules；進度條顯示狀態與儲存百分比。
2. **P1 未實作**：FileManager 開啟流程改為真正按需 Blob.slice；處理跨切片 UTF-8 邊界；FMCU 與 Viewport 接入。
3. **P2 未實作**：跨切片 Transaction Coordinator、Snapshot pin、完整版本回收、WTF 與編輯器整合。
4. **P3 未實作**：IndexedDB Journal、Storage Adapter、可恢復的 Flush 與精確進度。
5. **P4 未實作**：1GiB/5GiB 壓力測試、UI 互動與安全回歸。

## 重要限制
現有 editor textarea、Documents.content、FileManager.open() 仍使用完整字串；不能宣稱已實現真正的大文件按需編輯。SL 當前的獨立 byte-range 解碼未處理跨切片 UTF-8 字元；尚不適合直接取代編輯器資料來源。進度目前僅追蹤單次 SAVE 操作，非切片逐筆持久化。
