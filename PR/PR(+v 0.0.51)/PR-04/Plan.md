# 51.4 Plan
研究日期 2026-11-15。MDN Map insertion order https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map ，採刪除重插實作 LRU。Shiki codeToTokens https://shiki.style/guide/ ，語法類別與調色盤顏色分離；不使用僅長度的 key，因等長不同內容會碰撞。風險：保留精確內容作比較增加記憶體；長文本超過預算不快取；revision 序號由現有 highlightGeneration 提供。跨行 grammar checkpoint 尚未完成。
