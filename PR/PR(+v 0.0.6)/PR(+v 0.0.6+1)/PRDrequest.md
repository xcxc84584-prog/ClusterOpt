# PR(v0.0.6 +1) — 調色盤彈窗重設計

## 需求
- 保留 File → Tool → Interface Color Palette 入口，改用 Cluster 風格的獨立彈窗。
- 彈窗、預覽、輸入框、文字、按鈕均隨 UI_PALETTE 全域屬性變色。
- RGB 色彩選擇器、R/G/B 三通道數值、黑白端點按鈕與即時預覽。
- 深淺兩端點插值時自動計算字體與表面對比，避免深色字體搭配深色背景。
- 支援繁體中文與英文、Esc 關閉、按鈕關閉、localStorage 持久化。
- 保留 Opt 5 同步狀態條顏色語意與既有 OMU Console API。
