# PR(+Opt 3) — ArCD

## Object List
| Object | Responsibility | Encapsulation |
|---|---|---|
| LANGUAGE | 全域語言屬性與翻譯 | 私有 locale/listeners |
| IDE_UI_BASE | UI 文字渲染 | 只讀 LANGUAGE 契約 |
| FileMenu | 語言選單 | set(LANGUAGE) |
| Documents | 文件生命週期 | 不依賴語言 |
| FileManager | 讀寫文件 | 不依賴語言 |
| OMU | LOG 記錄 | 被動觀測 |

## Property List
| Property | Values | Access |
|---|---|---|
| LANGUAGE | zh-Hant / en | Public get/set，內部狀態 Private |
| UI_THEME | dark | 原樣保留 |
| DOCUMENT_STATE | dirty/saved | 不隨語言改變 |

## Event Chain
FileMenu.LanguageSelect → LANGUAGE.set → LANGUAGE.subscribe → IDE_UI_BASE.renderLanguage → OMU.emit(200)

## RQ/RP EHU List
| Event | Code | Behavior |
|---|---|---|
| Set supported locale | 200 | 更新 UI |
| Set unsupported locale | 400 | 拒絕並保持原值 |
| localStorage unavailable | 200 (fallback) | 使用記憶體，不阻塞 |
| Translation missing | fallback | 回退繁體中文或 key |

## Dependency
UI → LANGUAGE；FileMenu → LANGUAGE；LANGUAGE → OMU（由訂閱端紀錄）；Documents/FileManager 與 LANGUAGE 無資料相依。

## HTTP note
200/400 為 OMU 內部 HTTP 類型代碼，不代表實際 HTTP 請求。
