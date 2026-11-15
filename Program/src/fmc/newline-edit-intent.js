// v0.0.50 PR-02: derive a bounded UTF-16 edit from beforeinput intent.
// Unknown browser/IME/history changes deliberately return null for fallback.
export function newlineCount(text) {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) count++;
  }
  return count;
}

export function deriveEditIntent({
  inputType, data, isComposing = false, start, end, value
}) {
  if (isComposing || typeof value !== 'string' ||
      !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end < start || end > value.length) return null;

  let from = start;
  let to = end;
  let text;
  switch (inputType) {
    case 'insertLineBreak':
    case 'insertParagraph':
      text = '\n';
      break;
    case 'insertText':
    case 'insertFromPaste':
      if (typeof data !== 'string') return null;
      text = data;
      break;
    case 'deleteContentBackward':
      if (from === to) {
        if (from === 0 || value[from - 1] !== '\n') return null;
        from--;
      }
      text = '';
      break;
    case 'deleteContentForward':
      if (from === to) {
        if (to >= value.length || value[to] !== '\n') return null;
        to++;
      }
      text = '';
      break;
    default:
      return null;
  }
  const removed = value.slice(from, to);
  return Object.freeze({
    start: from,
    end: to,
    text,
    deltaLines: newlineCount(text) - newlineCount(removed),
    previousLength: value.length
  });
}
