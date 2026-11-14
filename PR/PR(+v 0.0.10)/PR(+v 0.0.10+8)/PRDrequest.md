# v0.0.10+8 — Background indexing and stable per-document progress

- Saving A must continue when switching A → B → A; its original progress remains visible and must not revert to DIVERGED/yellow until completion.
- Remove the full-page restore/rebuild overlay; perform indexing and recovery in background and report via blue footer progress.
- During blue LOADING/INDEXING the editor is read-only. Saving is also locked to avoid edits during streaming write.
