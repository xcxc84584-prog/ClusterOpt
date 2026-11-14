# Plan — v0.0.30

Research date: 2026-11-14.

- https://github.com/shikijs/shiki — adopted as primary syntax grammar engine; runtime grammar loading.
- https://github.com/codemirror/dev — reviewed as complete editor alternative; rejected to preserve ClusterOpt textarea and existing editor lifecycle.
- https://github.com/highlightjs/highlight.js — considered fallback; not selected due to Shiki TextMate grammar preference.

P0: settings dialog + object; P1: Shiki grammar mapping; P2: read-only overlay; P3: target-adjacent context and palette; P4: VTE regression and checkpoint propagation. Checkpoint propagation remains pending and requires follow-up.
