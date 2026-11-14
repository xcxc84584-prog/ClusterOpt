# ArcD — v0.0.37

Explorer.setLocale translates both button text and title/aria-label through LANGUAGE.t; no duplicate local locale state.

matchingWindow scans at most 100 nearby lines around the caret, tracks quote/comment state, and locates the smallest matched bracket pair enclosing the edit. Block-comment delimiters are also considered. When no match exists, only the edited line is tokenized. TextHighlighter.highlightRegion calls Shiki on the bounded substring; HighlightRenderer.renderRegion replaces only the matching range's tokens and visible DOM nodes. Full-slice tokenization remains load-only. Local grammar context cannot guarantee correct coloring for unmatched or >100-line constructs; checkpoint propagation remains future work.
