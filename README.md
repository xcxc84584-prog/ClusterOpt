# Cluster_Opt_1

純黑色系 Cluster 基本編輯器，參照使用者提供的 UI 截圖重建。包含新增、開啟、編輯、儲存、另存、關閉、多分頁、行號、游標位置、Dirty 提醒與 OMU 本地日誌。

## 部署 GitHub Pages

將本資料夾中的 `index.html`、`src/`、`PR(+Opt 1)-ArcD.md` 上傳到 GitHub Repository 根目錄；Settings → Pages → Deploy from a branch → main → /(root)。

## 本地測試

在此資料夾執行 `python -m http.server 8000`，瀏覽 `http://localhost:8000/`。

## 快捷鍵

Ctrl+N 新檔、Ctrl+O 開檔、Ctrl+S 儲存、Ctrl+Shift+S 另存、Tab 插入四個空格。

## 注意

瀏覽器無 File System Access API 時，「儲存」使用下載方式，並非原檔覆寫。尚未實際進行瀏覽器端驗收；外部 HTTP API 與真實 Relationship Test 未實作。OMU 只使用 HTTP 類型代碼記錄本地事件。
