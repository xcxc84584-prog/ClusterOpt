# Plan — 50.1

研究日期：2026-11-15。

- MDN [beforeinput event](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event): 可於文字變更前取得輸入意圖，但 IME、autofill 等情境可能不觸發，故 50.2 必須保留 input 校正；不採取阻止所有瀏覽器原生輸入的方案。
- CodeMirror 6 [migration guide](https://codemirror.net/docs/migration/): 以 transaction changes 表示局部變更，採用其「變更範圍優先」概念；不引入 CodeMirror 或替換 textarea。

實作順序：建立獨立 benchmark、隨機／行數正確性斷言、OCDA 及清單更新、版本／重導向、CI。風險：Node 計時受 JIT/CI 負載影響，僅記錄數值不設硬性 CI 延遲閾值。後續 50.2 實作已知換行變更的增量路徑。
