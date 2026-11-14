# 規則 2：程式編寫守則

## 原則
以 Google JavaScript Style Guide 為主要基準，參考 Airbnb JavaScript Style Guide；採用 OCDA 一物件一模組原則，避免不必要的抽象與跨物件私有狀態存取。

1. 原始碼 UTF-8；檔名使用小寫英文字母與連字號。
2. 縮排統一 2 個空格，禁止 Tab；禁止多個獨立敘述擠在同一行。
3. 目標行寬 100 字元；過長的條件、函數參數及物件欄位分行。
4. 類別 PascalCase；變數與函數 camelCase；常數 UPPER_SNAKE_CASE。
5. 使用 ES Modules 的具名 export/import，物件功能拆分到獨立檔案。
6. 優先使用 const，必要時使用 let；避免 var。
7. 所有 if/for/while 分支使用大括號；統一分號。
8. 只有說明原因、契約與安全假設的註解；避免重複程式碼表面意義。
9. 修改時保留 OMU/EHU、LANGUAGE、存儲優先權、Console API 與 Relationship Test 行為。
10. 修改後必須執行語法檢查與瀏覽器關係測試，未執行不得標示 PASS。

## 本次整理
將 Documents、FileManager、GlobalPropertyRegistry、SyncStatus 從 main.js 拆為獨立 ES Module；main.js 保留初始化、事件協調與 ExternalChangeMonitor。其餘密集單行程式尚待逐檔格式化。

## 參考
- https://google.github.io/styleguide/jsguide.html
- https://github.com/airbnb/javascript
