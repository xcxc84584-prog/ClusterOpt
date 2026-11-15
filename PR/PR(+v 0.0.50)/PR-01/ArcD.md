# ArcD — 50.1

Event Chain: Node benchmark runner -> LineBenchmark.Request.runLineBenchmark -> PieceTree.insert / EditPath.reconcile -> reference LF count -> Response statistics -> test PASS/FAIL. VTE.createVTE() remains isolated. Errors: invalid size RangeError; reference mismatch Error. No browser DOM, IndexedDB, FLAG/MVCC, or production user files accessed.

New OCDA object: LineBenchmark; properties LINE_BENCHMARK_P50, LINE_BENCHMARK_P95, LINE_BENCHMARK_P99; relations to PieceTree and EditPath. 39 registered objects.
