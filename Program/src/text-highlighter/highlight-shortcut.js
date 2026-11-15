// ClusterOpt v0.0.52: editor-scoped, user-configurable syntax toggle.
export const DEFAULT_HIGHLIGHT_SHORTCUT=Object.freeze({shift:true,key:'H'});
const RESERVED=new Set(['A','C','V','X','Z','Y','S','N','O','P','F','R','T','W','L','D','J','K','U','HISTORY']);
export function normalizeHighlightShortcut(value){
  if(!value||typeof value!=='object'||typeof value.shift!=='boolean'||
    typeof value.key!=='string'||!/^[A-Z0-9]$/.test(value.key.toUpperCase()))
    return null;
  const key=value.key.toUpperCase();
  // Plain Ctrl+letter combinations commonly belong to browser/editor actions.
  if(!value.shift&&RESERVED.has(key))return null;
  return Object.freeze({shift:value.shift,key});
}
export function matchesHighlightShortcut(event,shortcut){
  return !!(shortcut&&event&&(event.ctrlKey||event.metaKey)&&
    !!event.shiftKey===shortcut.shift&&!event.altKey&&!event.isComposing&&
    String(event.key||'').toUpperCase()===shortcut.key);
}
export function shouldHandleEditorShortcut(event,editor,dialog){
  const target=event?.target;
  return !!(editor&&target===editor&&!dialog?.open);
}
export function restoreHighlightShortcut(storage){
  try{
    const raw=storage?.getItem('cluster.textHighlighter.shortcut');
    if(raw){const shortcut=normalizeHighlightShortcut(JSON.parse(raw));
      if(shortcut)return shortcut;}
  }catch(_){}
  return DEFAULT_HIGHLIGHT_SHORTCUT;
}
export function persistHighlightShortcut(storage,shortcut){
  const normalized=normalizeHighlightShortcut(shortcut);
  if(!normalized)return false;
  try{storage?.setItem('cluster.textHighlighter.shortcut',JSON.stringify(normalized));
    return true;}catch(_){return false;}
}
