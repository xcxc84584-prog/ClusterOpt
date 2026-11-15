# Plan — Repository Governance

## External research (2026-11-15)
1. GitHub Docs: [Best practices for repositories](https://docs.github.com/en/enterprise-cloud%40latest/repositories/creating-and-managing-repositories/best-practices-for-repositories). Supports README and branch/PR workflow. Adopt: root README and PR-based review. Risk: generic guidance cannot replace OCDA contracts; do not adopt broad unrelated security refactoring in this PR.
2. GitHub Docs: [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes). Supports relative repository links. Adopt: concise README and relative links to deeper architecture docs. Risk: duplicated content can drift; keep canonical source references.

## Order
1. Read rules, full Git tree, object/property lists and QuestionLists.
2. Update canonical inventories and README/PROJECT_ARCHITECTURE.
3. Record PR-01–PR-04 four-file gaps; preserve historical paths.
4. Add reproducible CI checks and run VTE noninterference.
5. Review CI evidence and merge only on PASS.

## Non-adopted alternatives
Do not move 216 historical PR files, bulk-rename modules, or introduce a new `Project/` root; each risks breaking references or contradicts the rule that the repo root is the project root.
