# Plan
2026-11-15 參考 MDN KeyboardEvent https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent 、InputEvent https://developer.mozilla.org/en-US/docs/Web/API/InputEvent 、Web Storage https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage 。採 editor-scoped capture，保留瀏覽器快捷鍵優先；禁止常見 Ctrl 單鍵衝突。注意 Ctrl+Shift+瀏覽器保留快捷鍵仍可能無法攔截；未知 IME/Undo 編輯維持全文安全回退，虛擬切片原生 Undo 仍由瀏覽器管理。
