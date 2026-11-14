# Plan

1. 技術參考：Monaco Editor revealLine API；Google Engineering Practices 與 JavaScript Style Guide。
2. 依 VirtualFileSession.lineStarts 以二分搜尋定位切片。
3. 使用現有 renderVirtualSlice 進行非同步讀取與藍色 LOADING 進度；完成後定位游標與捲動。
4. 新增獨立 flex toolbar，縮窄時隱藏提示，避免 overlay 編輯器。
5. 保持既有 Program/ 與根 index.html 導向，避免 GitHub Pages 斷鏈；清單與 PR 文件按版本整理。
6. 驗收大文件、無效行號、快速切換視窗、狹窄 viewport、重載。

參考：https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IStandaloneCodeEditor.html

https://google.github.io/eng-practices/

https://github.com/google/styleguide
