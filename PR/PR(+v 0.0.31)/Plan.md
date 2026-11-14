# Plan — v0.0.31

Research references (2026-11-14):
- https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder — fatal and streaming decode, adopted.
- https://encoding.spec.whatwg.org/ — browser-supported Big5/GBK/GB18030 mapping; auto-detection is inherently ambiguous.
- https://github.com/shikijs/shiki — Shiki asynchronous syntax tokenization.
- https://github.com/codemirror/dev — overlay architecture comparison; full editor replacement rejected.

Changes: preserve highlight colors during edits; FTI legacy encoding candidates; explicit Cluster-styled chooser; streaming UTF-8 conversion; preserve encoding metadata in recovery/external reload; register LANGUAGE strings; improve UI_PALETTE light mode contrast.

Explicit limitation: original legacy encoding is not preserved on save (conversion to UTF-8 is disclosed and confirmed). Real browser UI and large-file performance require verification.
