# PR-03 — Multiple PowerShell Tabs

- Header PowerShell button creates a new independent session tab on each click.
- Session cards share `#tabs` with editor documents and support selection and close.
- Document selection hides terminal pane without destroying terminal sessions.
- Closing a terminal card does not close documents or change their editor state.
- Session feedback is isolated per session; no local agent execution is available yet.
- Global LANGUAGE and UI_PALETTE remain authoritative.
- Verification: v060-powershell-tabs.test.mjs static tests; browser and CI execution pending.
