# 50.4 PRD
優化 Gutter 行號：只建立 viewport + overscan 的行號文字節點，完整高度由 spacer 保持；與 textarea scrollTop 同步，不更動實體切片、FLAG/MVCC、Recovery、編輯器 textarea。行號及樣式必須支援白天／黑夜模式。
