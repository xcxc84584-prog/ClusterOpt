# Architecture

Viewport(center) → protected indices [center−1, center, center+1] → SliceLoader loadedIndices → VirtualFileSession candidate filter → FMC.unregister → check dirty / WTF / recoveryProtected / MVCC.hasUnpersistedVersion → MVCC.unregister + metadata release.

OLR: dirty edits are recovery protected until successful persistence. The OLR IndexedDB durable transaction itself is not verified here; this design conservatively protects in-memory recoverable edits.

Note: MVCC revisions are in-memory only; precommit state is represented conservatively by active WTF and unpersisted revision watermark.
