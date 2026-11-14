# Opt 7 — Relationship Test

| ID | 行為 | 預期 | 狀態 |
|---|---|---|---|
| RT-01 | SL.attach + load | 註冊已載入切片 | NOT RUN |
| RT-02 | FMC 未載入 read | 404 | NOT RUN |
| RT-03 | 同切片兩次 AcquireWTF | 第二次 409 | NOT RUN |
| RT-04 | WTF 過期提交 | 403 | NOT RUN |
| RT-05 | MVCC stale base commit | 409 | NOT RUN |
| RT-06 | Dirty Slice unload | 409 | NOT RUN |
| RT-07 | 儲存進度 | 0→100 | NOT RUN |
| RT-08 | 儲存失敗 | ERROR 且不顯示 SYNCED | NOT RUN |
| RT-09 | 切換文件 | 正確切換文件狀態 | NOT RUN |
| RT-10 | 1 GiB/5 GiB 大文件 | 不完整載入 | NOT IMPLEMENTED |
| RT-11 | UTF-8 跨切片 | 正確解碼 | NOT IMPLEMENTED |
| RT-12 | 跨切片原子交易 | 全部提交或全部回滾 | NOT IMPLEMENTED |
