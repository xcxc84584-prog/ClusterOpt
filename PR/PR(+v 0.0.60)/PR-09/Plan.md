# PR-09 — Y-only force port takeover

- On port 43881 conflict, the downloaded CMD asks `Force use port 43881? [Y/N]:`.
- Only `Y` (case-insensitive) authorizes terminating the current listener PID(s), without process identity verification. Other answers cancel.
- Warns that another service can be interrupted; no privilege elevation or bypass is attempted. Failure to release port aborts.
- Updates setup filename to `ClusterOpt-PLA-Setup-v0.0.60-r3.cmd`, cache tag to `opt060-psm-r3`, and tests/translation. Product version remains v0.0.60.
- CI and Windows runtime testing pending.
