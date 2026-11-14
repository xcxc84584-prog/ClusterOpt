// Global LANGUAGE property: black-box localization service.
const MESSAGES = Object.freeze({
  'zh-Hant': Object.freeze({
    file:'檔案',new:'建立新檔',open:'開啟檔案',save:'儲存',
    saveas:'另存新檔',close:'關閉分頁',closeall:'關閉全部',
    language:'語言',zh:'繁體中文',en:'English',
    empty:'選擇「檔案」建立或開啟文件',ready:'就緒',
    unnamed:'未命名.txt',editor:'文件編輯器',
    priority:'存儲優先級',internal:'內部優先',external:'外部優先',
    plain:'純文字',unsaved:'未儲存',saved:'已儲存',
    downloaded:'已下載檔案',saveFailed:'儲存失敗',
    confirmClose:name=>`「${name}」尚未儲存，確定關閉？`
  }),
  en: Object.freeze({
    file:'File',new:'New File',open:'Open File',save:'Save',
    saveas:'Save As',close:'Close Tab',closeall:'Close All',
    language:'Language',zh:'繁體中文',en:'English',
    empty:'Choose File to create or open a document',ready:'Ready',
    unnamed:'Untitled.txt',editor:'Document editor',
    priority:'Storage priority',internal:'Internal first',external:'External first',
    plain:'Plain Text',unsaved:'Unsaved',saved:'Saved',
    downloaded:'File downloaded',saveFailed:'Save failed',
    confirmClose:name=>`"${name}" has unsaved changes. Close anyway?`
  })
});
export class LanguageProperty {
  #locale='zh-Hant';
  #listeners=new Set();
  constructor() {
    try {
      const saved=localStorage.getItem('cluster.language');
      if (saved in MESSAGES) this.#locale=saved;
    } catch (_) { /* Storage is optional. */ }
  }
  get value() { return this.#locale; }
  t(key,...args) {
    const entry=MESSAGES[this.#locale][key] ?? MESSAGES['zh-Hant'][key] ?? key;
    return typeof entry==='function' ? entry(...args) : entry;
  }
  set(value) {
    if (!(value in MESSAGES)) return Object.freeze({ok:false,code:400,message:'Unsupported locale'});
    if (value===this.#locale) return Object.freeze({ok:true,code:200});
    this.#locale=value;
    try { localStorage.setItem('cluster.language',value); } catch (_) {}
    for (const listener of this.#listeners) listener(value);
    return Object.freeze({ok:true,code:200});
  }
  subscribe(listener) {
    this.#listeners.add(listener);
    return ()=>this.#listeners.delete(listener);
  }
}
