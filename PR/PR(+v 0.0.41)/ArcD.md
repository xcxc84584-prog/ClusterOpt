# ArcD — v0.0.41

The textarea and tab guide were separate scroll containers. Assigning the textarea scrollTop to the guide was clamped by the guide's own scrollHeight, causing drift near EOF. Keep the tab guide as a fixed clipped viewport and translate a child mirror by the textarea's exact scrollTop/scrollLeft, with the same 16px text padding and monospace line height. Debounced guide content rebuild is preserved. Does not affect the source text, gutter or MVCC.
