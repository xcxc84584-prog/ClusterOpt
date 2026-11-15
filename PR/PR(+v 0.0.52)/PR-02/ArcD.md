# ArcD
UI.File.Tool.TextHighlighter → ShortcutInput (readonly text) → keydown capture → TextHighlighterShortcut.normalizeHighlightShortcut → localStorage persistence → UI editor keydown toggle。保持 TextHighlighter/HighlightTaskScheduler/HighlightRenderer 原有 API；不觸碰 FLAG/MVCC/VTE。UI 只顯示儲存後的設定與未儲存草稿。
