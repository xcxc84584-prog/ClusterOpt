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
                            |-- external + busy --> deferred; external + dirty --> discard and reload
                            |-- external + clean --> new VirtualFileSession
                                                  --> indexLines()
                                                  --> atomic session swap
                                                  --> renderVirtualSlice()
                                                  --> SYNCED

#priority change --> GLOBALS.set --> localStorage.setItem
page boot --> localStorage.getItem --> GLOBALS.register
```

External priority explicitly discards unsaved MVCC edits when external content changes; an OMU event records the discard. The file handle must be available and readable; picker-only files without handles cannot be monitored. UI selection persists independently from workspace recovery.
