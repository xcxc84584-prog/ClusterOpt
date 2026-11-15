# PR-06 — PowerShell setup UX revision 2

## Fixes
- Downloaded CMD now checks Node.js, downloads pinned PLA bootstrap and immediately starts it. The local agent prints its random pairing token to the **same CMD window**, which stays open until the agent stops.
- Setup window reorganized into a compact introduction, three ordered steps, connection feedback and collapsible diagnostics.
- All setup colors use Cluster global UI semantic tokens rather than hard-coded dark colors. Includes responsive layout, visible focus outlines, and language strings.
- Release remains v0.0.60; deployment build tag is updated to `opt060-psm-setup2` in both root redirect and Program assets. Historical release tests follow the new tag.

## Notes
- CMD **downloads and runs** the pinned agent; users should inspect the script before running. No signature/hash verification is implemented.
- PLA still allows only fixed read-only actions. This is not an interactive shell.
- Token is visible only in the user's local CMD and is not added to URLs or storage.
- CI and Windows/browser verification required after merge.

## UI references
- Salt Design System experience customization/onboarding guidance.
- Pyzed onboarding stepper and light/dark preview.
- SAP accessibility guidance for contrast, themes and responsive layout.
