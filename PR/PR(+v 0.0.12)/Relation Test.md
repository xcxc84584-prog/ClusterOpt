# Relation Test — v0.0.12

| 測試 | 預期 | 驗證方式 |
|---|---|---|
| 全部宣告物件 | 可查詢、名稱唯一 | Node test |
| 每條相依 | 兩端物件均已註冊 | Node test |
| DYDA 01/11 | 單向／雙向正確 | Node test |
| 未知物件 | 404 | Node test |
| 重複相依 | 409 | Node test |
| 查詢快照 | 不可修改內部 registry | Node test |
| OMU 100 次正常 LOOP | START、ERROR、EHU、END | Node test |
| Browser Console `Cluster.dep()` | 回傳物件及相依圖 | 待瀏覽器驗收 |
| Browser UI / 250 MB 文件 | 無回歸 | 待瀏覽器驗收 |
