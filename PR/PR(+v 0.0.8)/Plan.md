# Opt 8 — Plan

## 參考專案與設計
- CodeMirror 6 viewport: https://codemirror.net/docs/guide/ （只渲染可視範圍，不等於檔案按需讀取）
- VS Code PieceTree: https://github.com/rebornix/PieceTree （Tree 行索引、版本與 Undo/Redo）
- MDN Blob.slice: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice （Byte-range 載入）
- MDN IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API （非同步恢復狀態）
- Google JS Style Guide: https://google.github.io/styleguide/jsguide.html

## P0 已提交（未驗收）
1. 新增 OLR：IndexedDB 工作區快照、小文件 Undo/Redo、游標/捲動位置。
2. 新增 LineTree（Fenwick tree），支援 prefix/update/locate。
3. 新增 WindowLoader：目前切片 ±1，淘汰上一窗口的非必要切片。
4. main.js 接入 OLR 小文件重載恢復、切換分頁及儲存位置維持；提供 loadSliceWindow API。

## P1 未完成
1. FileManager、Documents、Editor 改為 FMCU 切片資料來源，不再使用 file.text()/整份 textarea。
2. 所有 USER/AGENT 讀寫走 FMC Request，寫入先取得 WTF。
3. UTF-8 跨切片處理與完整的 GoToLine Tree 索引（需掃描或持久化全文件行數）。
4. OLR 的大文件切片級 Journal、MVCC 交易 Undo/Redo 與恢復（目前為小文件字串快照）。
5. 全文件儲存位置與外部監測的同步邏輯調整。

## 安全限制
- 目前 OLR 只持久化每份 <=2 MiB 的編輯快照，並非大文件恢復保證。
- IndexedDB 受瀏覽器儲存額度與清理政策限制。
- WindowLoader API 目前為獨立接口，尚未取代實際 editor。
- 每次輸入紀錄完整字串 Undo 有記憶體成本，暫不適用大型文件。

## v0.0.8+1 修補紀錄

- 修補 #3：SliceLoader 以 UTF-8 字元起始位元組對齊 byte-range，使用 fatal TextDecoder 避免靜默替代字元。
- 部分修補 #5：MVCCU.commitBatch 先驗證全部 baseVersion，再進行同步記憶體提交；仍缺少持久化原子性與 Crash Recovery。
- 部分修補 #23：OLR Undo/Redo 改存最小差異區段；新增 clearAll 與 ClusterOpt.clearRecovery()。
- #1、#2、#4、#20、#21、#22、#24、#25 仍需進一步整合與驗收；不得標示 PASS。
- 下版目標：實際大文件載入、Viewport 切片、記憶體上限、位置恢復及 WTF 整合測試。
