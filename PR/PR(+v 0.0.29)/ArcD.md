# ArcD — v0.0.29

## EVENT CHAIN
1. Developer → GitHub source modules → Object inventory → `物件清單.md`。
2. Developer → `#private` fields／公開契約／GlobalPropertyRegistry → Property inventory → `屬性清單.md`。
3. Documentation PR → createVTE() isolated chain → assertions → Relation Test。

## 邊界
`createClusterDependencies()` 的 22 個宣告物件與 Explorer、DFOM、VTE、DependencyRegistry、StoragePriority 的實作模組分開標示；文件不直接改動 Runtime。
