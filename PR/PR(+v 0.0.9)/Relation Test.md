# Opt 9 — Relation Test

| ID | 測試 | 預期 | 狀態 |
|---|---|---|---|
| RT9-01 | 1 GiB Blob 開啟 | 不呼叫 file.text()，只讀中心及鄰近切片 | NOT RUN |
| RT9-02 | 5 GiB Blob 開啟 | 可按需求載入且記憶體受控 | NOT RUN |
| RT9-03 | 載入進度 | LOAD 顯示 0/N → N/N | NOT RUN |
| RT9-04 | 快速切換切片 | 過期結果不覆蓋目前視窗 | NOT RUN |
| RT9-05 | 同片並行請求 | 合併為一次讀取 | NOT RUN |
| RT9-06 | CJK／emoji 邊界 | 解碼及儲存後位元組正確 | NOT RUN |
| RT9-07 | 大文件逐片儲存 | SAVE 顯示真實逐片進度，資料一致 | NOT RUN |
| RT9-08 | Dirty 切片持久化 | 儲存成功前不得清除 Dirty | NOT RUN |
| RT9-09 | 文件切換位置 | 保持游標與捲動位置 | NOT RUN |
| RT9-10 | WTF／MVCC | 拒絕過期與衝突寫入 | NOT RUN |
