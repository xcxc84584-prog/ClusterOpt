# Plan — v0.0.12+1

## 根因
- `ExternalChangeMonitor.checkNow()` 原本遇到 `virtualSessions.has(id)` 就直接返回，所有切片式開啟文件均無外部監測。
- 優先設定初始化固定為 `internal`，沒有持久化。
- 大檔不能使用 `file.text()` 每 2.5 秒整份讀取。

## 實作
1. 以 `File.size + File.lastModified` 比較虛擬文件變更。
2. 外部優先且無 dirty／save／index 時，使用新 `getFile()` 建立 VirtualFileSession，完成索引後原子替換舊 session，刷新目前切片。
3. 內部優先時不覆寫編輯器，標記 DIVERGED。
4. 外部優先遇未儲存編輯時暫緩覆寫並發出 EHU，避免資料遺失。
5. `STORAGE_PRIORITY` 使用 `localStorage` 持久化，例外時退回 internal 並記錄錯誤。
6. 儲存與恢復工作階段時更新外部檔案基準。
7. 更新 Node tests 與版本快取。

## 實作前參考
- MDN FileSystemFileHandle.getFile: https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/getFile
- Chrome File System Access API: https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
- MDN Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
- Google JavaScript Style Guide: https://google.github.io/styleguide/tsguide.html

## 取捨
- 不在輪詢中讀取整個 G 級文件；使用 size/mtime 快速比較，極少數相同 size+mtime 的內容變動仍可能漏報。
- 不覆蓋 dirty 編輯；由使用者先儲存或處理衝突。
