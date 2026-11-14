# PR/Opt 4 — ArCD

## Object List
| Object | Role | Visibility |
|---|---|---|
| OMU | 記錄事件及 EHU | Private events; Public read-only logs |
| Cluster Console API | log/ehu/dep/help 查詢 | Public, immutable reference |
| Documents | 文件狀態與 CRUD | Private state |
| FileManager | 檔案讀寫 | Public contracts |
| LANGUAGE | 全域語言屬性 | Private locale; Public get/set |

## Property List
| Property | Description |
|---|---|
| OMU.events | 私有事件佇列，最多 500 筆 |
| OMU.event.ehu | 是否為 EHU |
| OMU.event.code | HTTP 類型狀態碼 |
| Dependency | from/to/type，靜態宣告 |

## Event Chain
Documents/FileManager/LANGUAGE → OMU.emit → OMU.logs → Cluster.log/ehu → Console

## RQ/RP Error Handling
| Request | Failure | Result |
|---|---|---|
| log({limit}) | 非整數或負數 | 400 類型契約 |
| log({code}) | 非 100–599 整數 | 400 類型契約 |
| log({source}) | 非字串 | 400 類型契約 |
| dep() | 無參數 | 回傳宣告的相依關係副本 |

## Example
```js
Cluster.log()
Cluster.log({limit:20})
Cluster.log({code:404})
Cluster.ehu()
Cluster.dep()
Cluster.help()
```

Note: 這些是頁面內 Console API，不是網路 HTTP 端點。
