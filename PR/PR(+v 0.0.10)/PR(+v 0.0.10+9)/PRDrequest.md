# v0.0.10+9

- Blue status does not globally prohibit editing. Once the actual slice is materialized, the editor remains editable.
- Editing while streaming SAVE interrupts the write; unsaved content must remain recoverable.
- OLR stores the user's current **viewport** (slice index and scrollTop/scrollLeft), independently of the editing caret position.
