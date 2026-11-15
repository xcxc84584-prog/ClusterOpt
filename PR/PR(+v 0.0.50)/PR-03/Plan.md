# 50.3 Plan
研究：Fenwick Tree 適用固定索引 point update；插入／刪除需重建。Implicit treap 支援按序號 split/merge/splice，預期 O(log N + K)。參考 cp-algorithms Treap https://cp-algorithms.com/data_structures/treap.html 。取代索引內部結構而非更改物理切片權限，避免高風險重構。風險：MicroSliceDocument 的 boundary array 仍線性；後續可遷移 ID 到同一樹。
