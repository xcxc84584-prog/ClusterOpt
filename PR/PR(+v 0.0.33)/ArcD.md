# ArcD — v0.0.33 Viewport Highlighter

The textarea remains the input source. HighlightRenderer stores UTF-16 line-start offsets and a sorted token-range array. Only visible lines plus 12 margin lines are materialized in the read-only overlay. Scroll changes the rendered window; typing maps prior token ranges and repaints only the viewport, then the single-line Shiki bypass refreshes the edited line. Full Shiki slice highlighting remains restricted to slice/document load and palette changes.

The gutter now updates on virtual-slice edits using session.lineStarts[center] as the base number. It avoids rebuilding if document, slice, base and line count are unchanged.

Limitation: no TextMate checkpoint convergence for multiline grammar states; this version is a viewport/DOM performance fix, not a complete incremental parser.
