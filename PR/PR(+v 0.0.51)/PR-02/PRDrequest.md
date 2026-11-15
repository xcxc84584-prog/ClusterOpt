# 51.2 — 增量著色行索引
已知 beforeinput UTF-16 範圍的輸入，局部更新 HighlightRenderer 的行起點與 Token 範圍，避免每次全字串 LF 掃描；IME/Undo/未知操作保留全文回退。不得改動 textarea、FLAG/MVCC 或儲存流程。驗收 600 隨機編輯、VTE、CI。
