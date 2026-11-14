# Plan — v0.0.33

Research 2026-11-15:
- https://codemirror.net/docs/guide/ — adopted viewport-only rendering and visible-range concepts; full editor replacement rejected to preserve Cluster textarea lifecycle.
- https://github.com/codemirror/website/blob/main/site/examples/decoration/index.md — adopted bounded visual decorations instead of whole-document DOM updates.
- https://github.com/Simon-He95/stream-markdown — reviewed Shiki incremental token/DOM updater and changed-line scheduling; adapted to arbitrary textarea edits rather than append-only streams.
- https://shiki.style/packages/stream — reviewed streaming Shiki; rejected for random-access edits because its API is stream-oriented.

Tests cover UTF-16 line index and range remapping. Browser input/IME/scroll and performance remain to be verified.
