# Plan — 50.2

研究日期 2026-11-15：

1. MDN [beforeinput](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event): beforeinput 可提供修改前意圖；但 IME/autofill 可能不觸發或不可取消。採用 beforeinput 作可選 fast path，保留 input + reconcile；不採用全面阻止原生編輯。
2. MDN [InputEvent.inputType](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/inputType): insertLineBreak / insertParagraph / deleteContentBackward 等類型可推導編輯範圍。風險：data 可能為 null、平台行為不同；不明操作回退。
3. CodeMirror [transaction changes](https://codemirror.net/docs/migration/): 以 from/to/insert 表示局部變更。採用變更範圍概念；不替換 textarea。

順序：純解析器 → EditPath.applyKnownPatch → UI beforeinput/input → 隨機測試／VTE → OCDA 清單／QuestionList → CI。限制：textarea.value、gutter 全行重建、MicroSliceIndex rebuild、完整父切片提交仍可能 O(N)，留待 50.3/50.4。
