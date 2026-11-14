# ArcD — v0.0.13

## Object
DFOM：Program/src/dfom.js，純函式；不持有文件內容、不直接存取 FMC。

## Public Request / Response
- dfomEdit(value,start,end,key,options) → edit 或 null。
- handleDfomKeydown(event,editor) → boolean。
- buildTabGuideFragment(document,value) → DocumentFragment。

## Event Chain
鍵盤事件 → DFOM 決定變更 → textarea.setRangeText → 原有 input handler → FMC/MVCC/OLR。
渲染事件 → DFOM 只讀鏡像 → Tab 虛線；不更改原始 Tab 字元。
語言切換 → LANGUAGE.subscribe → renderLanguage → priority 標籤與選項。

## EHU
非法範圍回傳 null；儲存失敗沿用原有 FMC/EHU 契約。
