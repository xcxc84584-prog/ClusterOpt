// PR v0.0.47-01: pure viewport range calculation. No DOM, I/O or editor mutation.
const isCount = n => Number.isSafeInteger(n) && n >= 0;
const isFiniteNonnegative = n => Number.isFinite(n) && n >= 0;

/**
 * Returns an exclusive-end logical line range for a fixed-height, non-wrapping editor.
 * A wrapped-line editor must supply a visual-line map instead of using this helper.
 */
export function calculateViewport({
  scrollTop, viewportHeight, lineHeight, lineCount, overscan = 2
}) {
  if (!isFiniteNonnegative(scrollTop) || !isFiniteNonnegative(viewportHeight) ||
      !Number.isFinite(lineHeight) || lineHeight <= 0 ||
      !isCount(lineCount) || !isCount(overscan)) {
    return {ok:false, code:400, message:'Invalid viewport dimensions or line count'};
  }
  if (lineCount === 0) {
    return {ok:true, code:200, data:{start:0,end:0,visibleStart:0,visibleEnd:0}};
  }
  const visibleStart = Math.min(lineCount, Math.floor(scrollTop / lineHeight));
  const visibleEnd = Math.min(lineCount, Math.max(
    visibleStart, Math.ceil((scrollTop + viewportHeight) / lineHeight)
  ));
  return {ok:true, code:200, data:{
    start:Math.max(0,visibleStart - overscan),
    end:Math.min(lineCount,visibleEnd + overscan),
    visibleStart, visibleEnd
  }};
}
