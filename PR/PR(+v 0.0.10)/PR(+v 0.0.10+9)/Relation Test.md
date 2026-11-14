# Tests

| Case | Expected | Result |
|---|---|---|
| Blue SAVE with visible slice | Editable | Static inspection |
| Edit during streaming SAVE | Abort before next write or close, no false SYNCED | Browser pending |
| Reload with caret offscreen | Restore saved viewport, not caret line | Browser pending |
| Blue initial INDEX without loaded slice | No editing until actual slice exists | Static inspection |
| JS syntax | Valid | PASS |
