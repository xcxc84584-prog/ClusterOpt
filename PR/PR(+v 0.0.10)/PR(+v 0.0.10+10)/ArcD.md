# Architecture

closeDoc(B) → choose surviving A → switchDoc(A) → refresh + renderVirtualSlice(A).

FTI PROMPT → user confirmation → FTI.forceText() → VirtualFileSession(forceText) → SliceLoader(TextDecoder UTF-8 fatal:false). Unmodified slices are written as source bytes; edited slices are written from text.
