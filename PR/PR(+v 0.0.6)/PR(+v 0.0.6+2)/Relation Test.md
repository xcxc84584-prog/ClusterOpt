# PR(v0.0.6+2) — Relationship Test
| ID | 情境 | 預期 |
|---|---|---|
| RT-01 | startLoop | 產生 START 與唯一 LoopID |
| RT-02 | LOOP 中連續正常 emit | 不保存重複正常紀錄 |
| RT-03 | LOOP 中 code=500 | 保留 ERROR |
| RT-04 | LOOP 中 ehu=true | 保留 EHU |
| RT-05 | endLoop | END 含 processed/suppressed/errors/durationMs |
| RT-06 | LOOP 外正常 emit | 照常保留 |
| RT-07 | 兩個並行 LoopID | 不互相合併 |
| RT-08 | 超過 500 筆 | EventID 不重複 |
| RT-09 | Cluster.log/ehu | 仍可查詢結果 |
| RT-10 | 監測器錯誤 | EHU 不被壓縮 |
| RT-11 | 異常中斷 | ABORTED 記錄 |
| RT-12 | 語言/色盤/文件狀態 | 全域屬性不受影響 |

狀態：尚未完成真實瀏覽器驗證。
