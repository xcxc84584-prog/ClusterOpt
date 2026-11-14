# Architecture

UI input → saveAbortControllers[documentId].abort() → VirtualFileSession.save(signal) → FileSystemWritableFileStream.abort() → state DIVERGED, original recovery edits retained.

OLR viewport = `{center, position:{scrollTop,scrollLeft,selectionStart,selectionEnd}}`. `center` and scroll offsets define visible content; selection offsets are secondary cursor state. The editor is locked only when no editable slice has been materialized.
