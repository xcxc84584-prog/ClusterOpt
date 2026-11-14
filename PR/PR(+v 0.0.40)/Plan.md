# Plan v0.0.40

Phase 1: remove full-slice highlighter and tab-guide DOM work from the synchronous input handler, reduce line-count and caret allocation. Phase 2 after browser measurement: replace full slice token remap with indexed range edits, virtualize indentation guides and coalesce MVCC commits. Do not silently alter save/recovery semantics.
