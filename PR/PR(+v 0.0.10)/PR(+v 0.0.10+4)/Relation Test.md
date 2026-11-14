# Relation Test

| ID | 測試 | 預期 | 狀態 |
|---|---|---|---|
| RT-01 | 有 handle、無 dirty 與 OLR edits | SYNCED 綠色 | 待瀏覽器測試 |
| RT-02 | MVCC dirty | DIVERGED 黃色 | 待瀏覽器測試 |
| RT-03 | OLR 有相同 handle 可恢復 edits | DIVERGED | 待瀏覽器測試 |
| RT-04 | 無 file handle | UNVERIFIED | 待瀏覽器測試 |
| RT-05 | IndexedDB 查詢失敗 | UNVERIFIED + EHU | 待瀏覽器測試 |
| RT-06 | 切換分頁或並行載入 | 狀態不交叉覆蓋 | 待瀏覽器測試 |
| RT-07 | 儲存後再載入 | 綠色同步，沒有舊 recovery 誤報 | 待瀏覽器測試 |
