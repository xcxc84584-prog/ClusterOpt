# Plan

1. Remove blue-state blanket read-only lock; retain guard when no slice content exists.
2. Attach AbortController to document-scoped streaming SAVE; check cancellation before each write and before close, abort temporary writer on edit.
3. Preserve viewport coordinates in OLR and restore scroll after selection to prevent caret-driven jump.
4. Add regression cases and verify syntax. Browser integration remains pending.
