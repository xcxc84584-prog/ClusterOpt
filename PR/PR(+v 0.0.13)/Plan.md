# Plan — v0.0.13

## 參考
- VS Code Language Configuration: https://code.visualstudio.com/api/language-extensions/language-configuration-guide （自動配對、包圍選取）
- VS Code Basic Editing: https://code.visualstudio.com/docs/editing/codebasics （自動閉合策略）
- Monaco editor options: https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IEditorOptions.html （tab stops、空白可視化）

## 取捨
不引入 Monaco/CodeMirror，避免替換現有 textarea 與大檔切片編輯核心。使用純函式 DFOM + 只讀視覺鏡像。

## 風險
- 300k 字元以上的單一編輯視窗只渲染前 300k 字元標記，避免鏡像 DOM 過大。
- IME 輸入組字期間不處理按鍵。
- 需瀏覽器驗證不同字型、混合中英文字與水平捲動對齊。
