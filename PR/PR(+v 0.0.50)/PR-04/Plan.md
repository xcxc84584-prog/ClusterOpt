# 50.4 Plan
參考已有 editor-render/viewport-calculator.js、RenderCoordinator 和 MDN scrollTop https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop 。不採用對 2M 行生成完整 DOM/字串；使用 spacer 保持捲動範圍，labels absolute 定位，依可見視窗加 overscan 生成行號。風險：字體行高／縮放／不同平台 scrollHeight 與 scrollbar，需要瀏覽器實測；大文件整體效能仍受 textarea 和 slice 提交限制。
