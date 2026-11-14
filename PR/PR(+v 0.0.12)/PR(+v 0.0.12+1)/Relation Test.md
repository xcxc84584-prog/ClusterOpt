# Relation Test — v0.0.12+1

| Test | Expected | Status |
|---|---|---|
| Persist external, reload page | external restored | Node PASS for storage helper; browser pending |
| Persist internal, reload page | internal restored | Node PASS for storage helper; browser pending |
| Invalid preference | default internal | Node |
| localStorage unavailable | safe fallback + EHU | Node for fallback; browser pending |
| External file changes, clean virtual session | new file indexed and editor rerendered | Browser pending |
| Internal priority, external change | preserve editor, DIVERGED | Browser pending |
| External priority with unsaved edits | preserve edits, EHU, DIVERGED | Browser pending |
| External file change during save/index | deferred | Browser pending |
| 1 GiB+ file monitor | no whole-file read | Browser pending |
| Existing nonvirtual monitor | no regression | Browser pending |
