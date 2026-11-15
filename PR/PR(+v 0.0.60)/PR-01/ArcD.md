# ArcD — v0.0.60 PR-01
Objects: PowerShellManager (facade), PPMU (pure policy evaluation). Planned: P3A and PLA.
Global properties planned: LANGUAGE, UI_THEME.
Request: CheckPermission(command, operation) → ALLOW/DENY/PENDING.
EHU: invalid operation DENY; invalid command name DENY; local agent missing 503.
Event chain: Request → Validate → Match rules → Decision. No OS execution in this PR.
Isolation: no production token, process, or filesystem access.
