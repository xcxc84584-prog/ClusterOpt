/**
 * DFOM — editor-only helpers. Keep stored document bytes unchanged.
 * The editor uses literal tab characters, not replacement spaces.
 */
export const DFOM_PAIRS = Object.freeze({
  '"': '"', "'": "'", '`': '`',
  '(': ')', '[': ']', '{': '}', '<': '>',
  '（': '）', '［': '］', '｛': '｝',
  '「': '」', '『': '』', '“': '”', '‘': '’',
  '〈': '〉', '《': '》', '【': '】', '〔': '〕', '〖': '〗',
  '｢': '｣', '«': '»', '‹': '›', '＜': '＞'
});

export const DFOM_SETTINGS = Object.freeze({
  tabSize: 4, indent: '\t', autoCloseBefore: ';:.,=}])> \n\t',
  expandBlockOnSpace: true
});

function lineContext(value, position) {
  const lineStart = value.lastIndexOf('\n', position - 1) + 1;
  const lineEnd = value.indexOf('\n', position);
  const before = value.slice(lineStart, position);
  const after = value.slice(position, lineEnd < 0 ? value.length : lineEnd);
  return {before, after, indent: (before.match(/^[ \t]*/) || [''])[0]};
}

function previousIndent(indent) {
  if (indent.endsWith('\t')) return indent.slice(0, -1);
  return indent.slice(0, Math.max(0, indent.length - DFOM_SETTINGS.tabSize));
}

export function dfomEdit(value, start, end, key, options = {}) {
  if (typeof value !== 'string' || !Number.isInteger(start) ||
      !Number.isInteger(end) || start < 0 || end < start || end > value.length) {
    return null;
  }
  if (options.ctrl || options.alt || options.meta || options.composing) return null;
  const selected = value.slice(start, end);
  const context = lineContext(value, start);
  const betweenBraces = start === end && value[start - 1] === '{' && value[start] === '}';
  if (key === 'Tab') {
    if (options.shift) {
      const lineStart = start - context.before.length;
      const currentIndent = (value.slice(lineStart).match(/^[ \t]*/) || [''])[0];
      if (!currentIndent) return null;
      const removed = currentIndent.endsWith('\t') ? '\t' :
        ' '.repeat(Math.min(DFOM_SETTINGS.tabSize, currentIndent.length));
      return {start: lineStart + currentIndent.length - removed.length,
        end: lineStart + currentIndent.length, text: '',
        caret: Math.max(lineStart, start - removed.length)};
    }
    return {start, end, text: '\t', caret: start + 1};
  }
  if (key === 'Backspace' && start === end && start > 0) {
    if (value[start - 1] === '\t') {
      return {start: start - 1, end: start, text: '', caret: start - 1};
    }
    if (start < value.length && DFOM_PAIRS[value[start - 1]] === value[start]) {
      return {start: start - 1, end: start + 1, text: '', caret: start - 1};
    }
    if (/^ +$/.test(context.before)) {
      const remove = ((context.before.length - 1) % DFOM_SETTINGS.tabSize) + 1;
      return {start: start - remove, end: start, text: '', caret: start - remove};
    }
  }
  // ClusterOpt extension: space inside an empty brace block expands to a new line.
  if (key === ' ' && betweenBraces && DFOM_SETTINGS.expandBlockOnSpace) {
    const text = '\n' + context.indent + DFOM_SETTINGS.indent +
      '\n' + context.indent;
    return {start, end, text, caret: start + 1 + context.indent.length +
      DFOM_SETTINGS.indent.length};
  }
  if (key === 'Enter') {
    if (start !== end) return null;
    if (betweenBraces) {
      const text = '\n' + context.indent + DFOM_SETTINGS.indent +
        '\n' + context.indent;
      return {start, end, text, caret: start + 1 + context.indent.length +
        DFOM_SETTINGS.indent.length};
    }
    const opening = /[{\[(]\s*$/.test(context.before);
    const closing = /^[}\])]/.test(context.after);
    const indent = closing && !opening ? previousIndent(context.indent) :
      context.indent + (opening ? DFOM_SETTINGS.indent : '');
    const text = '\n' + indent;
    return {start, end, text, caret: start + text.length};
  }
  if (selected && DFOM_PAIRS[key]) {
    return {start, end, text: key + selected + DFOM_PAIRS[key],
      selectStart: start + key.length,
      selectEnd: start + key.length + selected.length};
  }
  if (start === end && Object.values(DFOM_PAIRS).includes(key) &&
      value[start] === key) {
    return {start, end: start + 1, text: key, caret: start + 1};
  }
  if (start === end && DFOM_PAIRS[key]) {
    const next = value[start] || '';
    // Prefer predictable pairing for angle brackets even beside identifiers.
    if (key !== '<' && next && !DFOM_SETTINGS.autoCloseBefore.includes(next)) {
      return null;
    }
    return {start, end, text: key + DFOM_PAIRS[key], caret: start + key.length};
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
