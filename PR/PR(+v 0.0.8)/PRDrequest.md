# Opt 8 — PRDrequest

1. FMC 的 MVCC 增加 Overload Restorer (OLR)：網頁重載恢復編輯狀態、Ctrl+Z / Redo、瀏覽與編輯位置恢復。
2. 所有文件透過切片發送給 USER / AGENT；寫入必須取得 WTF。
3. 大文件按需載入，窗口僅載入目前及上下鄰近切片。
4. 行號由 Tree 維護，預留 GoToLine 跳轉。
5. 儲存、重載、切換文件不得無故回到文件或頁面頂端。
6. 按既有規則持續更新未處理潛在問題清單。
