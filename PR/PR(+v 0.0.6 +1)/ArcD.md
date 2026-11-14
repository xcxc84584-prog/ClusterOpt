# PR(v0.0.6 +1) — 架構設計

## Object List
| Object | Responsibility |
|---|---|
| InterfacePalette | 黑白端點插值、RGB 保存、對比計算、CSS token 發布 |
| GlobalPropertyRegistry | UI_PALETTE 單一全域註冊 |
| PaletteDialog | 讀取/修改公開 UI_PALETTE；展示預覽與控制項 |
| LANGUAGE | 彈窗文字雙語化 |
| OMU | RGB 修改事件與 EHU |

## Event Chain
File.Tool.Palette → PaletteDialog.showModal → UI_PALETTE.set → apply() → CSS variables → 全域 UI 與彈窗同步更新。

## Contrast Policy
對各背景 surface 分別選取白色或黑色前景，使 WCAG 對比最大；文字與表面不使用同一組插值。中間亮度仍按 RGB 相對亮度計算；同步狀態條保留原本綠黃紅藍。

## EHU
不合法 RGB 值回傳 400 並記錄 OMU；localStorage 不可用時保留本次設定。

## 參考
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast
