# Explorer v0.0.23 — Mouse contract and CI regression
- Right click workspace entry: opens action menu; selection background updates.
- Left click workspace entry: selection only, no action menu.
- Left hold >=200ms then drag to sibling: reorder, persist JSON order; no action menu.
- Left click folder disclosure arrow: expand/collapse.
- Double left click file: open editor tab.
- Explorer refresh: collapse expanded folder tree; preserve open editor documents and root handles.
- CI failure diagnosis: explorer-toggle.test.mjs fake panel lacked explorerRefresh listener and fake document lacked addEventListener. Update mocks to reflect current DOM contract.
- Browser integration still requires manual verification.
