# ArcD
UI.editor.keydown(OLR undo/redo) → HighlightRenderer.retainDuringEdit → TextHighlighter.scheduleHighlight (abort prior task + revision guard) → HighlightRenderer.render。UI.editor.input(historyUndo/historyRedo) → scheduleHighlight；普通輸入仍 scheduleLineHighlight。沒有物理 Block reload。VTE/OMU/FLAG/MVCC 不變。
