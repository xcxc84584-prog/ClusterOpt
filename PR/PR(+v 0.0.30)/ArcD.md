# ArcD — v0.0.30 Shiki TextHighlighter

## Object boundaries

SliceLoader → TextHighlighter(Shiki, TextPalette) → HighlightScheme → EditorWindow.

Input targetSliceId, previousSlice, targetSlice, nextSlice, document revision, language. Adjacent slices MUST be relative to targetSliceId, never visible viewport. Output ranges are UTF-16 offsets within targetSlice only. EditorWindow owns rendering; textarea owns input. Private TextPalette derives colors from global UI_PALETTE, never writes it.

## Limitation

The initial implementation uses a bounded previous-slice lexical context. Durable TextMate rule-stack checkpoints for constructs spanning more than one previous slice are not yet implemented; this is a known correctness gap, not a completed feature.

## EHU

Shiki load/parse errors fall back to uncolored text. Stale asynchronous requests are discarded.
