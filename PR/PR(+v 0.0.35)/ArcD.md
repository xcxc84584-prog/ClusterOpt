# ArcD — v0.0.35

The textarea is the source of truth for unsaved line counts. Every input event checks its current newline count rather than trusting beforeinput hints. Gutter rebuilds only when document, virtual slice, base line or count changes. A DOM signature prevents stale cached signatures from skipping a rebuild after the gutter was replaced with a loading placeholder. requestAnimationFrame re-syncs gutter scroll after the new line has been laid out. This does not commit or mutate the source file. Root index redirect, Program title, header and stylesheet cache version all use 0.0.35.
