# Tests

| Case | Expected | Result |
|---|---|---|
| A saving → B → A | A SAVE progress continues; no replacement LOAD | Browser pending |
| A reindexing → B → A | A INDEX remains blue, read-only | Browser pending |
| Reload 250 MiB | No center overlay; footer shows indexing | Browser pending |
| Blue LOADING | editor readOnly true | Static code inspection |
| Failed save | ERROR red, no false SYNCED | Browser pending |
| JS syntax | Parse without syntax errors | PASS |
