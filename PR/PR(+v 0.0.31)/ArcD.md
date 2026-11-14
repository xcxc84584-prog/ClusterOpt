# ArcD — v0.0.31

HighlightRenderer retains the previous semantic ranges during pending asynchronous re-tokenization. It shifts ranges in unchanged prefix and suffix around an edit and renders edited text as plain color until the new HighlightScheme arrives. The document remains owned by textarea.

FTI classifies CJK script in successfully decoded UTF-8 text. This does NOT add Big5/GB18030 decoding, which requires coordinating SliceLoader, save and byte preservation.
