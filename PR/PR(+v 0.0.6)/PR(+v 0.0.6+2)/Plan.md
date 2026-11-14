# PR(v0.0.6+2) — 計畫
1. 查閱 OpenTelemetry Collector 高頻日誌最佳實務及 Google JavaScript Style Guide。
2. 抽離 OMU 成獨立 ES Module。
3. 建立 startLoop / emit / endLoop 介面，保留錯誤與 EHU。
4. 讓 ExternalChangeMonitor.checkAll 傳遞 LoopID。
5. 將 0.0.6+1 文件移入 0.0.6 母版，建立 +2 子資料夾。
6. 保留全域屬性清單與既有 Program 目錄。
7. 驗證 JavaScript 模組載入及關係測試；未執行不可宣稱通過。

## 參考
- https://github.com/open-telemetry/opentelemetry-collector/blob/main/docs/coding-guidelines.md
- https://opentelemetry.io/docs/specs/otel/logs/
- https://google.github.io/styleguide/jsguide.html
