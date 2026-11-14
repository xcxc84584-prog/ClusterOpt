# ArcD v0.0.43

Context menu is appended to document.body rather than the Explorer panel, avoiding the workspace overflow clipping. Its fixed left anchor is the Explorer panel's right edge, and width is limited to the remaining viewport space. Vertical placement is clamped to the viewport. The existing Explorer scroll/wheel/touchmove dismissal, outside-click dismissal, and Escape are retained; window resize dismisses the menu. CSS selectors are updated to work outside the panel.
