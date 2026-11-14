# Opt 6 — 需求文件

## 需求
- File → Tool → Language / Interface Color Palette。
- 新增全域屬性 UI_PALETTE，支援 RGB 0–255 三通道輸入及原生色彩選擇器。
- 黑白兩端點各自定義一組介面風格參數；中間值按相對亮度內插。
- 全域介面同步套用，儲存於 localStorage。
- 專案根目錄建立 全域屬性清單.md；PR 使用 PR(+v 0.0.x) 命名。
- 不破壞 Opt 3 語言切換、Opt 4 OMU Console、Opt 5 存儲優先機制。
