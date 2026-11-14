# Relation Test — v0.0.33

Node tests cover line starts, trailing blank lines, Chinese UTF-16 offsets and edit-range remapping. Manual acceptance needed: insert line in virtual slice, verify all following gutter numbers; type in 10 MiB slice, inspect DOM node count, scroll and selection alignment, IME composition and multiline comments. CI success is not equivalent to browser performance PASS.
