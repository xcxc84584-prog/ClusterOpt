# PRDrequest — v0.0.29

## 需求
依目前 ClusterOpt 原始碼更新 `物件清單.md`、`屬性清單.md`，包含 Explorer、VTE、DFOM、DependencyRegistry、StoragePriority；區分已註冊與僅存在於原始碼的模組，標註存取與未完成事項。

## 不包含
不改動執行期註冊表、全域屬性值、Explorer UI 或使用者資料。

## 驗收
兩份文件涵蓋所有目前 `dependency-registry.js` 靜態物件，且不把模組存在誤寫成 ACL 完整實作。
