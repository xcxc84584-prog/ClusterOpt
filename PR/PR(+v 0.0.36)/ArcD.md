# ArcD — v0.0.36

Root cause: textarea and gutter are separate scroll containers. Textarea's scrollHeight can exceed gutter's scrollHeight because of native padding and end-of-file scroll space. Setting the same scrollTop clamps the gutter at its own maximum; counting lines alone cannot fix the boundary. `syncGutterScroll` resets gutter bottom padding, measures the scrollHeight difference, adds compensating bottom padding, then synchronizes scrollTop. It runs on input, scroll, and after layout. Existing textarea, slicing, highlighter and persistence remain unchanged.
