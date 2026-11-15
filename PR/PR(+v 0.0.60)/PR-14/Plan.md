# PR-14 — Interactive PowerShell R8

- After authenticated pairing, PowerShell tab includes command input, Enter-to-run, per-tab history with Up/Down and output log.
- Agent `/execute` accepts `interactive` action only with paired token, origin allowlist and `confirm:true` after browser confirmation. Commands run with `powershell.exe -NoProfile -NonInteractive -Command` and no elevation.
- Limit 2048 characters, 15-second process timeout, 64 KiB output. Each command is a separate process: working directory, variables and shell state are not persisted between commands.
- Each command can affect local system; approval is required for each submission. Current approval is browser-side and not a trusted OS authorization boundary.
- Cache chain and downloaded CMD updated to r8; release remains v0.0.60.
- CI and Windows integration not yet verified.
