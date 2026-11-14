# Relation Test

| Case | Expected | Status |
|---|---|---|
| < before identifier | <> | Node regression test added |
| {\|} Space | { newline indent newline } | Node regression test added |
| {\|} Enter | indentOutdent | Node regression test added |
| Enter after ( | Indent | Node regression test added |
| Shift+Tab | Outdent | Node regression test added |
| Backspace indent | Delete indentation stop | Node regression test added |
| Browser VTE IME/mobile/large file | Preserve content and caret | Pending browser verification |

Rollback by reverting merge commit; original main is recovery point.
