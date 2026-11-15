# v0.0.60 PR-01 — PSM security foundation
Scope: isolated PowerShellManager browser facade, pure PPMU policy evaluator, unit tests.
Not implemented: Explorer UI, Windows PLA, pairing, command parsing, OS sandbox, secure policy persistence.
Security: no browser-side authorization is sufficient for command execution. PLA must revalidate every request.
