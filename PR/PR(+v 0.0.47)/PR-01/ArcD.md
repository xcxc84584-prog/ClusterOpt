# v0.0.47 / PR-01 — Viewport Calculator

## PRDrequest
建立純函數固定行高、無自動換行編輯器的可視行區間計算。禁止存取 DOM、文件內容、IndexedDB 或修改正式編輯器。

## ArcD
Object: Viewport_Calculator. Public Request: Calculate(dimensions). Response: {ok,code,data}; 400 invalid arguments, 200 valid. Input: scrollTop, viewportHeight, lineHeight, lineCount, overscan. Output: [start,end) and [visibleStart,visibleEnd). No state or dependency edges; caller owns EHU Event ID and logging. No direct cross-object mutations.

## Plan
採用固定行高 viewport math；後續 Render Coordinator 接入前不變更現有渲染流程。參考：MDN Element.scrollTop https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop 及 Element.clientHeight https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight （參考文件，未宣稱本次已線上檢索）。若啟用軟換行須改用視覺行映射。

## Relation Test
- Node unit: `node --test Program/tests/editor-render/viewport.test.mjs` — NOT RUN at initial commit.
- Existing suite: `npm test` — NOT RUN at initial commit.
- VTE Event Chain: NOT RUN; pure calculation only, integration pending.
- Browser alignment: NOT RUN; this PR does not touch the renderer.
- Non-interference: design enforced by pure function; browser regression NOT RUN.

## Next
PR-02 introduces Render Coordinator with frame coalescing and generation invalidation.
