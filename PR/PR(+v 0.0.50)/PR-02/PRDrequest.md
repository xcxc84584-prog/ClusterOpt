# PRDrequest — 50.2 增量換行

使用者 Enter、Backspace 合併行、Delete、選取取代及有 data 的貼上，優先以 beforeinput 的 UTF-16 編輯範圍推導 LF delta，免去 EditPath 的全文前後綴搜尋。IME、Undo、資料不完整、內容不符時回退原有 reconcile。維持 textarea 原生輸入、MVCC/FLAG 寫入、Recovery、重導向 v0.0.50。

驗收：成功／失敗／退回、行數一致、400 次隨機換行、VTE 隔離、CI PASS；不聲稱大文件 gutter 或完整切片提交已優化。
