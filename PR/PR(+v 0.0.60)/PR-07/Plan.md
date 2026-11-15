# PR-07 — Port takeover confirmation and PowerShell UI visibility

- CMD checks 127.0.0.1:43881 before starting PLA.
- On conflict, displays process ID/name/command line and requires typing `REPLACE 43881`.
- Stop operation is allowed only when the listener is a `node.exe` process whose command line matches `ClusterOpt-Agent...server.mjs`; unknown processes are never killed automatically.
- If verification or release fails, setup aborts. User must restart setup to get a new token.
- PowerShell setup toolbar/menu buttons now have visible palette-based backgrounds, foregrounds and labels; action buttons retain minimum dimensions.
- Build cache tag `opt060-portguard-ui`, release version stays v0.0.60, root redirects to `Program/?v=0.0.60`.
- Tests cover guard structure, UI visibility and version tag. Windows/browser runtime and CI results pending.
