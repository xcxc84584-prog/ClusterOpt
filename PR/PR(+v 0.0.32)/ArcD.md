# ArcD — Local Line Highlighter

- Global `TextHighlighter.highlightSlice` only for initial file/slice load and palette updates.
- `TextHighlighter.highlightLine` tokenizes the edited line only, without loading adjacent slices.
- `HighlightRenderer` keeps one DOM element per text line. The edit path updates the affected line element(s), preserving unaffected colors.
- `scheduleLineHighlight` debounces 90ms, checks revision and active document, and discards stale results.
- Newline edits update line nodes but do not trigger full slice highlighting.
- Known limitation: a line-only tokenizer cannot fully resolve multi-line lexical constructs (block comments, multi-line strings). SyntaxCheckpoint and bounded dependency propagation are future work.
