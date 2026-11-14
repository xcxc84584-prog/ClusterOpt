# Relation Test — v0.0.13

| Case | 預期 | 狀態 |
|---|---|---|
| LANGUAGE 切換 | priority 標籤、option、aria-label 即時翻譯 | 待瀏覽器驗證 |
| Tab 插入與刪除 | 一個 literal tab，一次 Backspace 刪除 | 已編寫單元測試 |
| 自動配對 | 中英文括號與引號配對 | 已編寫單元測試 |
| 已選取文字 | 自動包圍 | 已編寫單元測試 |
| 大文件切片 | 鏡像不影響原始 bytes | 待瀏覽器 VTE 驗證 |
| IME | 不攔截組字 | 待瀏覽器 VTE 驗證 |

VTE 測試以隔離虛擬文件與事件鏈操作，不寫入正式文件。
