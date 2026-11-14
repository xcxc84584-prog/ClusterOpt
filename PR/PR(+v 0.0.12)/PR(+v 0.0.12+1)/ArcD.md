# ArcD — v0.0.12+1

```text
FileSystemFileHandle.getFile()
       |
       v
ExternalChangeMonitor.checkNow()
       |-- non-virtual --> existing full-text compare
       |-- virtual --> compare size / lastModified
                            |-- unchanged --> SYNCED / DIVERGED
                            |-- internal --> DIVERGED (retain editor)
                            |-- external + dirty/busy --> EHU + DIVERGED
                            |-- external + clean --> new VirtualFileSession
                                                  --> indexLines()
                                                  --> atomic session swap
                                                  --> renderVirtualSlice()
                                                  --> SYNCED

#priority change --> GLOBALS.set --> localStorage.setItem
page boot --> localStorage.getItem --> GLOBALS.register
```

External reload never silently discards unsaved MVCC/OLR edits. The file handle must be available and readable; picker-only files without handles cannot be monitored. UI selection persists independently from workspace recovery.
