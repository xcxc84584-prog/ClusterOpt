# Explorer hotfix v0.0.17.1

根因：Explorer.toggle() 在無 force 時以 panel.hidden 原值重新寫入 hidden，按鈕永遠無法切換。修正為 open = panel.hidden，再寫入 panel.hidden = !open。

UI：將 Explorer 展開按鈕移至左上角標題旁的工具區，右側保留 File 選單。現有 ClusterOpt header 未包含 LOG 按鈕，故不憑空建立 LOG 物件。

測試：新增開啟／關閉／force／aria-expanded 回歸測試。沒有本地資料格式遷移，合併前 main 為還原點。
