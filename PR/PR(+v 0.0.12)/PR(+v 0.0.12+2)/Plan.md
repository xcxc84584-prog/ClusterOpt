# Plan — v0.0.12+2

## 參考
- VS Code UI best practices: https://github.com/microsoft/vscode/blob/main/.github/instructions/best-practices.instructions.md （採用既有元件、統一操作風格）
- VS Code custom layout: https://code.visualstudio.com/docs/configure/custom-layout （參考選單層級；不移植完整工作台）

## 實作
- main.js 視覺狀態採 200ms 延遲提交，保留原始狀態、事件及進度追蹤。
- index.html 移動 priority select 至 Tool 子區域。
- style.css 為選單分組、焦點與深色主題新增樣式。

## 風險
- 快速切換文件可能延遲顯示目前文件狀態最多 200ms。
- 需在真實瀏覽器檢查不同語言與行動裝置排版。
