# ArcD — v0.0.12

```text
Program/src/dependency-registry.js
   ├─ register(name, metadata)
   ├─ relate(from, to, type)
   ├─ dep(name?)
   ├─ list()
   └─ edges()
         ↓
main.js → Cluster.dep() / Cluster.objects()
         ↓
DevTools Console (read-only snapshots)
```

- Direction: `from` 為依賴者／呼叫者，`to` 為被依賴者。
- DYDA: 01 單向出、10 單向入、11 雙向、00 無相依。
- 資料來源：`createClusterDependencies()` 靜態宣告，避免散落於多個 Console 函式。
- 安全：不透過 Console 暴露內部 registry 的可變方法；查詢結果為複本。
- OMU：保留現有 `startLoop/emit/endLoop` 的 START/ERROR/EHU/END 行為。
- OCDA：本版僅建立相依圖，不將關聯圖誤當權限系統。
