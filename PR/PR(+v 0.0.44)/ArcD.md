# ArcD v0.0.44

Bind passive scroll, wheel, and touchmove handlers to the editor textarea (#editor). Each handler calls the existing idempotent Explorer.#closeMenu(). The editor is a separate scroll container, so this explicitly handles its events without changing editor input or scroll behavior. Existing Explorer scroll dismissal and fixed right-side positioning remain unchanged.
