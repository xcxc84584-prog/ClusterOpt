# Plan — 50.5

研究：現有 ViewportCalculator 明確只支援 non-wrapping fixed-height；HighlightRenderer 的行高度、overlay 和 DFOM 也假設 white-space:pre。參考 MDN HTML textarea wrap https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#wrap 及 Canvas measureText https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText 。採用先純模型、後瀏覽器量測與整體同步的分段方案，避免單獨切換 textarea wrap 導致著色與行號偏移。限制：欄數模型無法準確描述 CJK/emoji/比例字體；spliceLines 重建 prefix O(N)，待性能量測。
