# ArcD — v0.0.31

## TextHighlighter

HighlightRenderer retains the previous token colors during asynchronous retokenization. Unchanged prefix and suffix token ranges are remapped around edits, then replaced when Shiki returns. Switching documents or disabling highlighting clears the old overlay.

## FTI and legacy Chinese

FTI samples a bounded header and validates UTF-8 first. If invalid UTF-8, it checks Big5, GBK and GB18030 with fatal TextDecoder. Since the encodings overlap, ambiguous cases require an explicit user choice; even unambiguous cases require confirmation before conversion.

The converter uses streaming TextDecoder to avoid splitting multibyte sequences at 256 KiB boundaries, and creates a UTF-8 Blob for the existing UTF-8 SliceLoader. The source Blob remains untouched until an explicit save. **Saving writes UTF-8**, not the original legacy encoding; this is disclosed in the encoding chooser. Recovery stores the original encoding so file handles can be decoded again. Large legacy files still require performance testing because conversion creates an additional Blob.

## Localization and palette

TextHighlighter and the encoding chooser subscribe to the global LANGUAGE property through the existing renderLanguage lifecycle. Light-mode foreground and editor backgrounds derive from UI_PALETTE. No hardcoded dark-mode editor text.
