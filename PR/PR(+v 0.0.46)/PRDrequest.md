# v0.0.46 PMU — PRDrequest

## Scope
Introduce opt-in Performance Monitoring Unit (PMU) for ClusterOpt. No new modal or dashboard.
Expose through browser console `Cluster.command('pmu ...')`; integrate VTE benchmarking in a subsequent increment.

## Implemented
- Start, stop, reset, report/status, JSON/CSV export commands.
- Fixed-capacity (512 samples per metric) latency statistics P50/P95/P99/max.
- Long-task observer when supported, frame interval sampling, JS heap if available.
- Initial instrumentation of highlight tokenization/rendering, scroll synchronization and editor line/position updates.
- Global release version and redirect v0.0.46.

## Outstanding
- `pmu benchmark` returns 501 until isolated VTE runner is implemented.
- Slice load, persistence, and end-to-end input-to-paint metrics require dedicated instrumentation.
- Browser and VTE integration regression tests are NOT RUN.
- No claim that input latency/FPS goals have been met.
