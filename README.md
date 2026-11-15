# ClusterOpt

Local-first browser IDE (GitHub Pages). Current release: **v0.0.50** (through stage 49.5).

- [Open application](https://xcxc84584-prog.github.io/ClusterOpt/)
- [Project architecture and repository tree](PROJECT_ARCHITECTURE.md)
- [Programming rules](程式編寫守則.md)
- [Object inventory](物件清單.md) · [Property inventory](屬性清單.md) · [Global properties](全域屬性清單.md)
- [OCDA object index](OBJECT_LIST.md) · [OCDA property index](PROPERTY_LIST.md)
- [QuestionList1](QuestionList1/) · [QuestionList2](QuestionList2/) · [PR history](PR/)

**Implementation status:** 49.1 Piece Tree, 49.2 micro-slices, 49.3 micro-slice index and 49.4 resident edit reconciliation are merged. 50.1 benchmarks and 50.2 incremental newline intent path; 49.5 parent-slice FLAG/MVCC-guarded micro-patch API is implemented; independent micro-slice leases are not. CI PASS does not imply browser or GB-file benchmarks.

50.3: micro-slice index structural splice uses implicit treap; document boundary array still linear on edits.

50.4: viewport-only gutter labels; keeps textarea authoritative and native scroll geometry.

50.5: soft-wrap visual-line map model and tests only. Browser wrap stays OFF to preserve highlighting, line numbers and caret geometry.
