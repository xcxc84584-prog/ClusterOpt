# Implementation plan

1. Guard SAVE/INDEX operations per document; tab switching must not start another LOAD that supersedes the tracker operation.
2. Keep original SAVE progress alive across tabs, then transition to INDEX with its own blue progress.
3. Replace overlay with footer tracker; restore initial session metadata early to display progress.
4. Lock editor on LOAD/INDEX/SAVE and on rebuilding state.
5. Verify syntax; browser tests for 250 MiB and multi-tab races remain pending.
