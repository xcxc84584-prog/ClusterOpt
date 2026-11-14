/**
 * DFOM — editor-only helpers. Keep stored document bytes unchanged.
 * The editor uses literal tab characters, not replacement spaces.
 */
export const DFOM_PAIRS = Object.freeze({
  '"': '"', "'": "'", '`': '`',
  '(': ')', '[': ']', '{': '}',
  '（': '）', '［': '］', '｛': '｝',
  '「': '」', '『': '』', '“': '”', '‘': '’'
});

export function dfomEdit(value, start, end, key, options = {}) {
  if (typeof value !== 'string' || !Number.isInteger(start) ||
      !Number.isInteger(end) || start < 0 || end < start || end > value.length) {
    return null;
  }
  const selected = value.slice(start, end);
  if (key === 'Tab' && !options.shift) {
    return {start, end, text: '\t', caret: start + 1};
  }
  if (key === 'Backspace' && start === end && start > 0) {
    if (value[start - 1] === '\t') {
      return {start: start - 1, end: start, text: '', caret: start - 1};
    }
    // A generated empty pair is removed in a single Backspace.
    if (start < value.length && DFOM_PAIRS[value[start - 1]] === value[start]) {
      return {start: start - 1, end: start + 1, text: '', caret: start - 1};
    }
  }
  if (options.ctrl || options.alt || options.meta || options.composing) return null;
  if (selected && DFOM_PAIRS[key]) {
    return {start, end, text: key + selected + DFOM_PAIRS[key],
      selectStart: start + key.length, selectEnd: start + key.length + selected.length};
  }
  if (start === end && DFOM_PAIRS[key]) {
    const next = value[start] || '';
    // Avoid duplicating a closing pair inside existing identifiers or punctuation.
    if (next && !/[\s\)\]\}\uff09\uff3d\uff5d,;:]/u.test(next)) return null;
    return {start, end, text: key + DFOM_PAIRS[key], caret: start + key.length};
  }
  if (start === end && Object.values(DFOM_PAIRS).includes(key) &&
      value[start] === key) {
    return {start, end: start + 1, text: key, caret: start + 1};
  }
  return null;
}

export function handleDfomKeydown(event, editor) {
  if (event.defaultPrevented || editor.readOnly || event.isComposing ||
      event.key === 'Process' || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  const edit = dfomEdit(editor.value, editor.selectionStart,
    editor.selectionEnd, event.key, {shift: event.shiftKey});
  if (!edit) return false;
  event.preventDefault();
  editor.setRangeText(edit.text, edit.start, edit.end, 'end');
  if (edit.selectStart !== undefined) {
    editor.setSelectionRange(edit.selectStart, edit.selectEnd);
  } else {
    editor.setSelectionRange(edit.caret, edit.caret);
  }
  return true;
}

/** A text-only mirror. Only tab spans have a visible guide. */
export function buildTabGuideFragment(documentRef, value) {
  const fragment = documentRef.createDocumentFragment();
  // A capped mirror avoids doubling memory usage for unusually large slices.
  const text = value.length > 300000 ? value.slice(0, 300000) : value;
  const pieces = text.split('\t');
  for (let i = 0; i < pieces.length; i++) {
    fragment.appendChild(documentRef.createTextNode(pieces[i]));
    if (i < pieces.length - 1) {
      const tab = documentRef.createElement('span');
      tab.className = 'dfom-tab';
      tab.textContent = '\t';
      fragment.appendChild(tab);
    }
  }
  return fragment;
}
