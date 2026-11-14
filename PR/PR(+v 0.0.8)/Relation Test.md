# Opt 8 — Relation Test

| ID | 測試 | 預期 | 狀態 |
|---|---|---|---|
| RT-01 | 小文件重載 | 恢復未儲存文字 | NOT RUN |
| RT-02 | Ctrl+Z / Ctrl+Y | 還原/重做 | NOT RUN |
| RT-03 | 切換文件 | 還原捲動與游標 | NOT RUN |
| RT-04 | 儲存後 | 不跳回文件開頭 | NOT RUN |
| RT-05 | 重載後 | 恢復瀏覽位置 | NOT RUN |
| RT-06 | LineTree prefix/update/locate | 索引正確 | NOT RUN |
| RT-07 | WindowLoader | 只載入中心 ±1 | NOT RUN |
| RT-08 | WTF / MVCC 實際編輯 | 強制權限與版本驗證 | NOT IMPLEMENTED |
| RT-09 | 大文件虛擬編輯 | 不完整載入記憶體 | NOT IMPLEMENTED |
| RT-10 | 大文件 OLR 恢復 | 切片級 Journal | NOT IMPLEMENTED |
| RT-11 | GoToLine | 全文件 Tree 精確定位 | NOT IMPLEMENTED |
| RT-12 | UTF-8 切片邊界 | 正確解碼 | NOT IMPLEMENTED |
