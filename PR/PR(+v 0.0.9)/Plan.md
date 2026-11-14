# Opt 9 — Plan

## 技術參考（實作前查閱）

- MDN Blob.slice：https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice — 用 byte-range 避免整份讀取。
- MDN Streams API：https://developer.mozilla.org/en-US/docs/Web/API/Streams_API — 逐段處理及輸出。
- CodeMirror 6 Viewport：https://codemirror.net/docs/guide/ — 只渲染可見區與鄰近範圍；本版不直接引入 CodeMirror。
- Google JavaScript Style Guide：https://google.github.io/styleguide/jsguide.html — 新增程式碼採用清晰命名、區塊及 2 空格縮排。

## 本版實作

1. VirtualFileSession.requestSlice(index) 按需求載入，合併同一 index 的並行請求。
2. window(center) 優先讀中心切片，再讀 ±1，回報 0/N 到 N/N 的實際完成數。
3. main.js 將 LOAD / SAVE 接入 StorageProgressTracker，顯示百分比與狀態。
4. save 對未修改切片使用 Blob 原始位元組範圍，修改切片使用 WTF/MVCC 提交內容；對齊 UTF-8 邊界。

## 已知限制

- 單片 textarea 並非連續行級虛擬捲動，跨切片編輯仍需補強。
- 不具備全文件 Tree 行號跳轉；大文件 OLR 重載恢復未完成。
- 已修改切片仍常駐記憶體，未建立完整 Dirty Journal 與硬性記憶體預算。
- File System Access API 以外的低記憶體儲存備援未完成。
- 本版未執行 1/5 GiB 真實瀏覽器壓力測試，不能標示 PASS。

## 修補補充

儲存成功後重新以 handle.getFile() 取得最新 Blob，解除舊切片註冊並重新 attach，避免原始 immutable Blob 與已儲存文件內容不一致。
