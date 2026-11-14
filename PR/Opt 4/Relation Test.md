# PR/Opt 4 — Relation Test

| ID | Scenario | Expected |
|---|---|---|
| RT-01 | Request PASS: Cluster.log() | 回傳 LOG 陣列副本 |
| RT-02 | Request FAIL: Cluster.log({limit:-1}) | 400 類型契約 |
| RT-03 | Response PASS: Cluster.ehu() | 僅 ehu=true 事件 |
| RT-04 | Response FAIL: Cluster.log({code:'404'}) | 400 類型契約 |
| RT-05 | Cluster.dep() | 回傳 from/to/type 相依清單 |
| RT-06 | 修改查詢結果物件 | 不影響 OMU 私有紀錄 |
| RT-07 | 編輯器輸入事件 | 不再因 t 變數遮蔽而拋錯 |

Status: 測試案例已定義，尚未在瀏覽器執行，不能宣稱 PASS。
