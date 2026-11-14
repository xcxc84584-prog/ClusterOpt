# Opt 6 — 架構設計

## 物件
| 物件 | 權限 | 功能 |
|---|---|---|
| GlobalPropertyRegistry | Private registry / Public get | 共用屬性唯一來源 |
| InterfacePalette | Private RGB / Public value,set,subscribe | 調色盤計算及通知 |
| FileMenu.Tool | Public UI | 語言與介面調色盤入口 |
| LANGUAGE | Public read, controlled write | 中英文翻譯 |
| OMU | Private events, public diagnostics | 記錄設定事件 |

## 全域屬性
UI_PALETTE 的 RGB 為整數陣列 [R,G,B]，範圍 0–255。端點為黑 [0,0,0] 與白 [255,255,255]，使用 sRGB 線性相對亮度計算權重 t，再對各 UI token 做線性內插。色彩選擇會以低比例色彩染色表面；文字保留黑白端點對比。

## 事件鏈
File.Tool.Palette → InterfacePalette.set → InterfacePalette.apply → CSS Variables → 全 UI

## EHU
- RGB 非整數或超出 0–255 → 400，OMU EHU。
- localStorage 不可用 → 允許暫存更新，重新整理後不保證保留。

## 文件架構
Project root: Program/、全域屬性清單.md、PR/PR(+v 0.0.x)/。
