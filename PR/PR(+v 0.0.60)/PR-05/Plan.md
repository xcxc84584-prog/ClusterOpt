# PR-05 — Quick CMD setup and UI

Reference: legacy Cluster `plugin_terminal/terminal.js` (setup guide, pairing, revoke).

- Three-stage setup UI: download CMD, pair token, check connection.
- CMD downloads a pinned PLA agent file to `%USERPROFILE%\\ClusterOpt-Agent`; never automatically executes downloaded code.
- User manually reviews and launches `node server.mjs` (Node.js 20+ required).
- Browser token is memory-only and cleared on revoke. No storage or URL leakage.
- Browser UI uses global language and palette; multiple PowerShell tabs remain supported.
- Security limitations: no signature/hash verification in downloaded CMD, local agent currently supports only fixed read-only actions; browser support for mixed content/local network access varies.
- CI/browser validation pending.
