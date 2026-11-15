# Plan
2026-11-15：參考 MDN InputEvent.inputType https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/inputType 與 Monaco editor undo handling https://github.com/microsoft/monaco-editor 。採 historyUndo/historyRedo 事件分流、OLR undo 重建 resident Token，不強制 refresh；風險：大切片 full tokenization 耗時、瀏覽器輸入事件不一致、Shiki 載入失敗時仍需 fallback。保留 abort/generation 防止舊結果覆蓋。
