# 50.3 PRD
將 MicroSliceIndex 的結構更新由 Fenwick 全量 rebuild O(N) 改為 implicit treap splice O(log N + K)，保持 UTF-16 offset、right-biased 邊界、ID 與父切片 FLAG/MVCC 契約。不得宣稱整體編輯 O(log N)，因 Document 邊界陣列與 list 仍 O(N)。
