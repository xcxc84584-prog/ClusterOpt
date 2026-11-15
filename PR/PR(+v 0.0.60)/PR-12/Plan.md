# PR-12 — Compact PowerShell setup (r6)

- Reorganized setup into one scroll-contained page with a compact status header, two side-by-side primary steps, verification, feedback, and collapsed diagnostics.
- On narrow screens, the two-column steps stack vertically.
- Explicitly preserve global theme contrast and button labels.
- Attached CI log: 210 pass, 2 fail (60.23 and 60.25) from stale r4 test assertions. Updated them to the actual r6 import and URL normalization chain.
- Root redirect, nested module cache and CMD filename advanced to r6; release remains v0.0.60.
- Browser layout and CI require post-merge confirmation.
