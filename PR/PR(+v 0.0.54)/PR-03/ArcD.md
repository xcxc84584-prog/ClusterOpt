# Architecture
Explorer action toolbar displays symbol only, retains title/aria-label/hover hint. Document transition highlight uses viewport mode; for resident >256KiB, skips synchronous highlighting entirely on switch/load (plain text fallback). Normal editing and smaller documents retain prior highlight path; MVCC/FLAG/VTE untouched.
