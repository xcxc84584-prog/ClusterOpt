# Tests pending browser verification
- ZIP open/edit/save/reopen byte equality without edits
- Byte edits only change selected bytes
- Unicode > U+00FF save fails without write
- 1 GiB ZIP first slice editable, untouched tail preserved
- Reload dirty byte view from OLR
- UTF-8 text regression
- Forced binary load after unknown header

Known limitation: binary view edits only first 256 KiB; additional byte slices require future navigation support.
