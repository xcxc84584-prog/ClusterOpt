# Opt 6 — Relationship Test

| ID | 測試 | 預期 |
|---|---|---|
| RT-01 | 開啟 File → Tool | 顯示語言、介面調色盤 |
| RT-02 | RGB(0,0,0) | 深色端點 |
| RT-03 | RGB(255,255,255) | 淺色端點 |
| RT-04 | RGB(128,128,128) | 中間插值 |
| RT-05 | RGB 各通道調整 | 全域 UI 同步更新 |
| RT-06 | 不合法 RGB | 400，不變更屬性 |
| RT-07 | 重新整理 | localStorage 恢復設定 |
| RT-08 | 中英文切換 | Tool/Palette 翻譯同步 |
| RT-09 | 文件同步狀態 | 綠黃紅藍語意不受色盤覆蓋 |
| RT-10 | Cluster.log() | OMU Console 維持可用 |

狀態：待瀏覽器實測，不宣稱 PASS。
