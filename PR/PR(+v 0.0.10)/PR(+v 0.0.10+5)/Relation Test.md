# Relation Test

| ID | Scenario | Expected | Status |
|---|---|---|---|
| RT-01 | Valid ZIP | Raw binary, no TextDecoder | Pending browser test |
| RT-02 | ZIP save | Exact byte-for-byte copy | Pending browser test |
| RT-03 | Unknown encoding | Modal with Cancel/Force | Pending browser test |
| RT-04 | Cancel | No new document | Pending browser test |
| RT-05 | Force | Read-only raw binary | Pending browser test |
| RT-06 | Huge ZIP | No full file decode | Pending browser test |
| RT-07 | Reload binary file | Restore document window safely | Pending implementation |
| RT-08 | Invalid UTF-8 later in file | Safe fallback without data loss | Pending implementation |
