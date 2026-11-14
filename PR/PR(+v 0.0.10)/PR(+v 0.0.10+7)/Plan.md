# Plan

1. 將瀏覽位置保護範圍改為 center-1、center、center+1。
2. MVCC 紀錄 persisted watermark，阻止未持久化版本被卸載。
3. OLR 編輯以 recovery protection 鎖定切片。
4. SliceLoader 列舉已載入切片，透過 FMC 原有 unregister 檢查卸載。
5. 處理非同步鄰近預讀完成時已離開視窗的情況。
6. 實際瀏覽器回歸測試與長時間滑動記憶體測試待執行。
