# 51.3 Plan
2026-11-15 研究：Shiki codeToTokens https://shiki.style/guide/ ，TextMate grammar https://macromates.com/manual/en/language_grammars 。TextMate grammar 有跨行狀態，單純詞法掃描不等同 grammar stack；本 PR 採保守有限 restart 與安全回退，不冒險存取未確認的 Shiki internal state。風險：模板字串、JSX、regex、C++ raw string 不支援，保留原 matchingWindow。後續需正式 stateful tokenizer adapter。
