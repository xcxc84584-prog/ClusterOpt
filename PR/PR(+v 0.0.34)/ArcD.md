# ArcD — Dirty Range Highlighter

DirtyLineTracker records inclusive zero-based dirty ranges per document/slice. Adjacent edits merge; nonadjacent ranges remain separate. Each batch is at most 100 lines. TextHighlighter.highlightRange tokenizes only the batch; HighlightRenderer.renderRange patches tokens and visible DOM nodes only in that interval. Input never triggers full-slice tokenization.

Save contract: reset dirty histories only when doSave reports success. Failed or aborted saves retain history. Switching documents does not erase the stored history. Syntax state from outside a dirty range is not yet propagated; multiline grammar checkpoint is pending.
