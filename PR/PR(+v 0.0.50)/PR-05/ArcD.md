# ArcD — 50.5

VisualLineMap.Request.spliceLines -> wrapSegments -> cached visual rows and prefix -> VisualLineMap.Request.logicalToVisual / visualToLogical / calculateWrappedViewport -> Response mapping。42 OCDA objects；屬性 VISUAL_LINE_RANGE、WRAP_COLUMNS、WRAP_TAB_SIZE。純模型，無讀寫檔、FLAG/MVCC/DOM；EHU error 由呼叫者承接，非法參數 RangeError。
