# 50.4 ArcD
UI.Request.updateLines -> GutterWindow.Request.calculateGutterWindow -> UI.Response.renderGutterWindow -> spacer + labels。Scroll -> RenderCoordinator -> syncGutterScroll -> renderGutterWindow。GUTTER_VIEWPORT_RANGE、GUTTER_OVERSCAN；41 OCDA objects。失敗時由 RenderCoordinator onError 送 OMU。無 SendTo。
