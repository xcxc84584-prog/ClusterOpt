# v0.0.53 PR-03 — Large-text syntax highlighting >10s stall
User reports >10-second freeze when highlighting large text. P0: prevent unbounded synchronous full-slice Shiki on large resident text, keep editor interactive, preserve Ctrl+V/Undo and file state.
