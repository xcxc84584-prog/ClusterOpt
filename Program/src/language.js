// Global LANGUAGE property: black-box localization service.
const MESSAGES = Object.freeze({
  'zh-Hant': Object.freeze({
    explorerTitle:'檔案總管',explorerSearch:'搜尋文件',explorerAddFolder:'開啟資料夾',explorerAddFile:'開啟文件',explorerClose:'關閉檔案總管',
    file:'檔案',new:'建立新檔',open:'開啟檔案',save:'儲存',
    saveas:'另存新檔',close:'關閉分頁',closeall:'關閉全部',
    language:'語言',tool:'工具',palette:'介面調色盤',
    highlighter:'文本著色器',highlighterEnabled:'啟用 Shiki 語法著色',
    highlighterHint:'依檔案類型自動識別語言；色彩跟隨介面調色盤。',
    highlighterSlices:'僅解析目標切片與其相鄰切片，不修改文件。',
    highlighterReady:'語法引擎按需載入',highlighterActive:language=>`Shiki · ${language}`,
    highlighterFallback:'純文字模式',highlighterUnavailable:'語法引擎不可用',
    paletteRGB:'介面色系 RGB',paletteHint:'選擇顏色以即時預覽整體介面',
    palettePresets:'端點風格',paletteAutosave:'設定會自動儲存',
    done:'完成',closeDialog:'關閉視窗',darkEndpoint:'黑色端點',lightEndpoint:'白色端點',zh:'繁體中文',en:'English',
    empty:'選擇「檔案」建立或開啟文件',ready:'就緒',
    unnamed:'未命名.txt',editor:'文件編輯器',
    priority:'儲存優先級',internal:'內部優先',external:'外部優先',
    position:(line,col)=>`行 ${line}, 欄 ${col}`,slices:'切片',
    goLineInvalid:'請輸入有效的正整數行號',goLineOutOfRange:total=>`行號超出文件範圍（共 ${total} 行）`,goLineLoading:'正在載入目標區塊，請稍候…',goLineIndexMissing:'行號索引尚未建立完成',goLineLoadFailed:'區塊載入失敗',
    goLineLabel:'行號',goLineButton:'跳至行',goLineHint:'載入完成後才會跳轉',goLineGroup:'跳轉行工具',
    stateSYNCED:'已同步',stateDIVERGED:'未同步',stateERROR:'錯誤',stateLOADING:'載入中',stateSAVING:'儲存中',stateCONFLICT:'衝突',stateABORTED:'已中止',stateUNVERIFIED:'未驗證',stateINDEXING:'建立索引中',stateREAD:'讀取中',
    statusLoadedSlice:(index,total)=>`已載入切片 ${index} / ${total}`,
    statusReadyToJump:'載入完成後才會跳轉',
    plain:'純文字',unsaved:'未儲存',saved:'已儲存',
    downloaded:'已下載檔案',saveFailed:'儲存失敗',
    confirmClose:name=>`「${name}」尚未儲存，確定關閉？`
  }),
  en: Object.freeze({
    explorerTitle:'Explorer',explorerSearch:'Search files',explorerAddFolder:'Open Folder',explorerAddFile:'Open File',explorerClose:'Close Explorer',
    file:'File',new:'New File',open:'Open File',save:'Save',
    saveas:'Save As',close:'Close Tab',closeall:'Close All',
    language:'Language',tool:'Tool',palette:'Interface Color Palette',
    highlighter:'Text Highlighter',highlighterEnabled:'Enable Shiki syntax highlighting',
    highlighterHint:'Detect language from file type; colors follow the interface palette.',
    highlighterSlices:'Analyze the target slice and its neighbors without changing the file.',
    highlighterReady:'Syntax engine loads on demand',highlighterActive:language=>`Shiki · ${language}`,
    highlighterFallback:'Plain text mode',highlighterUnavailable:'Syntax engine unavailable',
    paletteRGB:'Interface RGB',paletteHint:'Select a color to preview the interface',
    palettePresets:'Endpoint styles',paletteAutosave:'Changes are saved automatically',
    done:'Done',closeDialog:'Close dialog',darkEndpoint:'Black endpoint',lightEndpoint:'White endpoint',zh:'繁體中文',en:'English',
    empty:'Choose File to create or open a document',ready:'Ready',
    unnamed:'Untitled.txt',editor:'Document editor',
    priority:'Storage priority',internal:'Internal first',external:'External first',
    position:(line,col)=>`Ln ${line}, Col ${col}`,slices:'slices',
    goLineInvalid:'Enter a valid positive line number',goLineOutOfRange:total=>`Line out of range (${total} lines)`,goLineLoading:'Loading target slice…',goLineIndexMissing:'Line index is not ready',goLineLoadFailed:'Slice loading failed',
    goLineLabel:'Line',goLineButton:'Go to Line',goLineHint:'Jump available after loading',goLineGroup:'Go to line',
    stateSYNCED:'SYNCED',stateDIVERGED:'DIVERGED',stateERROR:'ERROR',stateLOADING:'LOADING',stateSAVING:'SAVING',stateCONFLICT:'CONFLICT',stateABORTED:'ABORTED',stateUNVERIFIED:'UNVERIFIED',stateINDEXING:'INDEXING',stateREAD:'READING',
    statusLoadedSlice:(index,total)=>`Loaded slice ${index} / ${total}`,
    statusReadyToJump:'Jump available after loading',
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
