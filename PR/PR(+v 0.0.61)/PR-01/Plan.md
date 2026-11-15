# v0.0.61 — Persistent PowerShell terminal

## Implementation
- Each PowerShell tab receives a separate long-lived local PowerShell process after token pairing.
- Multiple tabs execute concurrently; within a tab commands are queued and can contain multiple statements/lines.
- The browser polls bounded output; Enter executes, Shift+Enter adds a line, multiline Ctrl+V pastes and submits, and Ctrl+C on an empty input interrupts the current session (restarts the process, so its state is lost).
- No per-command confirmation or permission-level prompt. Browser-origin allowlist, loopback binding, and the 64-character pairing token remain mandatory.
- New endpoints: /session/start, /session/run, /session/poll, /session/interrupt, /session/close.
- Max 12 sessions, 20 queued commands per session, 16 KiB per command, 256 KiB rolling output.
- v0.0.61 r1: update root redirect, Program title, module query strings, and setup CMD filename.

## Limitations / validation
- Browser and Windows integration tests have not yet been run. Static JavaScript syntax was checked for changed modules.
- This is a persistent PowerShell stdin/stdout session, not a ConPTY/PTY terminal; programs requiring a full interactive TTY, terminal resizing, raw key input, or native prompts may not work correctly.
- Ctrl+C terminates the current process and creates a fresh one; existing variables and working directory are lost after interrupt.
- Multiline paste auto-submits; inspect pasted commands before pasting untrusted text.
- Full command execution can modify/delete local files. Never expose the agent beyond loopback or share the pairing token.
