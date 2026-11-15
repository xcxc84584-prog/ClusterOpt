# v0.0.52 PR-03 — Ctrl+Z syntax color recovery
修復 Ctrl+Z/Y 文字已復原但語法著色未完全恢復。一般文件 OLR 與原生 historyUndo/historyRedo 必須重新著色 resident text，不得重新載入實體 Block，保留編輯/FLAG/MVCC 邏輯。
