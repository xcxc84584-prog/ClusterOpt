// ClusterOpt v0.0.30 — isolated, read-only Shiki tokenization.
// CDN-loaded grammars are optional; the editor remains fully usable offline.
const LANGUAGE_BY_EXTENSION = {
  c:'c',h:'c',cc:'cpp',cpp:'cpp',cxx:'cpp',hpp:'cpp',hh:'cpp',
  cs:'csharp',m:'objective-c',mm:'objective-c',java:'java',kt:'kotlin',
  js:'javascript',mjs:'javascript',cjs:'javascript',jsx:'jsx',
  ts:'typescript',tsx:'tsx',html:'html',htm:'html',css:'css',scss:'scss',
  json:'json',jsonc:'jsonc',xml:'xml',yaml:'yaml',yml:'yaml',toml:'toml',
  md:'markdown',markdown:'markdown',py:'python',rs:'rust',go:'go',
  swift:'swift',zig:'zig',rb:'ruby',php:'php',pl:'perl',lua:'lua',
  r:'r',sh:'bash',bash:'bash',ps1:'powershell',bat:'bat',cmd:'bat',
  sql:'sql',dart:'dart',jl:'julia',tex:'latex',asm:'asm',s:'asm',
  ini:'ini',dockerfile:'dockerfile',makefile:'makefile'
};
export function detectLanguage(name='') {
  const base=String(name).split('/').pop().toLowerCase();
  return LANGUAGE_BY_EXTENSION[base] || LANGUAGE_BY_EXTENSION[base.split('.').pop()] || 'text';
}
const CATEGORY = [
  [/comment/, 'comment'], [/string|quoted|regexp/, 'string'],
  [/keyword|storage|control/, 'keyword'], [/entity\.name\.function|support\.function/, 'function'],
  [/entity\.name\.type|support\.type|entity\.name\.class/, 'type'],
  [/constant\.numeric|number/, 'number'], [/markup|heading|emphasis/, 'markup'],
  [/operator|punctuation/, 'operator']
];
export function categoryFor(scopes=[]) {
  const joined=Array.isArray(scopes)?scopes.join(' '):String(scopes);
  return CATEGORY.find(([pattern])=>pattern.test(joined))?.[1] || 'plain';
}
function luminance(rgb) {
  const c=rgb.map(x=>{const v=x/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function rgb(hex) {return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function toHex(c) {return '#'+c.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');}
export class TextPalette {
  #version=0;
  #colors={};
  get version(){return this.#version;}
  setColor(category,color) {
    if (!/^(keyword|string|comment|function|type|number|markup|operator|plain)$/.test(category) ||
        !/^#[0-9a-f]{6}$/i.test(color)) return false;
    this.#colors[category]=color;this.#version++;return true;
  }
  resolve(background=[0,0,0],minimum=4.5) {
    const base={keyword:'#8aaaff',string:'#a4df9e',comment:'#a0a7b4',
      function:'#7bd9dd',type:'#e6ba82',number:'#e4a4df',
      markup:'#c7b0ff',operator:'#c4c9d3',plain:'#e2e4eb'};
    const target=luminance(background)>.18?[0,0,0]:[255,255,255];
    const colors={};
    for(const [key,value] of Object.entries(base)){
      let current=rgb(this.#colors[key]||value);
      for(let i=0;i<32 && contrast(current,background)<minimum;i++){
        current=current.map((c,j)=>Math.round(c+(target[j]-c)*.09));
      }
      colors[key]=toHex(current);
    }
    return colors;
  }
}
export class TextHighlighter {
  #shiki=null;
  #loading=null;
  #tokenCache=new Map();
  #palette=new TextPalette();
  enabled=true;
  get palette(){return this.#palette;}
  async #engine(){
    if(this.#shiki)return this.#shiki;
    if(!this.#loading){
      this.#loading=import('https://esm.sh/shiki@3.15.0?bundle')
        .then(async m=>m.createHighlighter({themes:['github-dark'],langs:[]}))
        .then(engine=>(this.#shiki=engine))
        .catch(error=>{this.#loading=null;throw error;});
    }
    return this.#loading;
  }
  invalidate(documentId){
    for(const key of this.#tokenCache.keys())if(key.startsWith(documentId+':'))this.#tokenCache.delete(key);
  }
  // Bypass highlighter: never reads adjacent slices and never retokenizes the slice.
  // A lexical line context is used only when available; multiline grammar state
  // remains a checkpoint problem and is not silently propagated to other lines.
  async highlightLine({documentId,targetSliceId,revision=0,language='text',
    line='',background=[0,0,0],signal}){
    const identity={documentId,targetSliceId,revision,language};
    if(!this.enabled||language==='text')return {...identity,status:'FALLBACK',ranges:[]};
    try{
      const engine=await this.#engine();
      if(signal?.aborted)return {...identity,status:'STALE',ranges:[]};
      if(!engine.getLoadedLanguages().includes(language))await engine.loadLanguage(language);
      if(signal?.aborted)return {...identity,status:'STALE',ranges:[]};
      const result=engine.codeToTokens(line,{lang:language,theme:'github-dark',
        includeExplanation:true});
      const colors=this.#palette.resolve(background);
      const ranges=[];let cursor=0;
      for(const token of result.tokens[0]||[]){
        const end=cursor+token.content.length;
        if(end>cursor){
          const category=categoryFor(
            token.explanation?.flatMap(x=>x.scopes?.map(s=>s.scopeName)||[])||[]);
          ranges.push({start:cursor,end,token:category,color:colors[category]});
        }
        cursor=end;
      }
      return {...identity,status:'OK',ranges,paletteVersion:this.#palette.version};
    }catch(error){return {...identity,status:'FALLBACK',ranges:[],error:String(error)};}
  }
  async highlightRange({documentId,targetSliceId,revision=0,language='text',
    lines=[],background=[0,0,0],signal}){
    const identity={documentId,targetSliceId,revision,language};
    if(lines.length>100)throw new RangeError('Highlight range exceeds 100 lines');
    if(!this.enabled||language==='text')return {...identity,status:'FALLBACK',ranges:[]};
    try{
      const engine=await this.#engine();
      if(signal?.aborted)return {...identity,status:'STALE',ranges:[]};
      if(!engine.getLoadedLanguages().includes(language))await engine.loadLanguage(language);
      if(signal?.aborted)return {...identity,status:'STALE',ranges:[]};
      const result=engine.codeToTokens(lines.join('\n'),{
        lang:language,theme:'github-dark',includeExplanation:true
      });
      const colors=this.#palette.resolve(background),ranges=[];
      let cursor=0;
      for(let i=0;i<result.tokens.length;i++){
        for(const token of result.tokens[i]){
          const end=cursor+token.content.length;
          if(end>cursor){
            const category=categoryFor(
              token.explanation?.flatMap(x=>x.scopes?.map(s=>s.scopeName)||[])||[]);
            ranges.push({start:cursor,end,token:category,color:colors[category]});
          }
          cursor=end;
        }
        if(i<result.tokens.length-1)cursor++;
      }
      return {...identity,status:'OK',ranges,paletteVersion:this.#palette.version};
    }catch(error){return {...identity,status:'FALLBACK',ranges:[],error:String(error)};}
  }
  async highlightSlice({documentId,targetSliceId,revision=0,language='text',
    previousSlice='',targetSlice='',nextSlice='',background=[0,0,0],signal}){
    const identity={documentId,targetSliceId,revision,language};
    if(!this.enabled||language==='text')return {...identity,status:'FALLBACK',ranges:[]};
    const cacheKey=[documentId,targetSliceId,revision,language,
      previousSlice.length,targetSlice.length,nextSlice.length].join(':');
    let ranges=this.#tokenCache.get(cacheKey);
    if(!ranges){
      try{
        const engine=await this.#engine();
        if(signal?.aborted)return {...identity,status:'STALE',ranges:[]};
        if(!engine.getLoadedLanguages().includes(language))await engine.loadLanguage(language);
        // Context is ALWAYS relative to the target slice, never the visible slice.
        // A bounded previous slice provides lexical context; checkpoints are needed
        // for constructs starting before that slice (future integration).
        const prefix=previousSlice?previousSlice+'\n':'';
        const combined=prefix+targetSlice+(nextSlice?'\n'+nextSlice:'');
        const result=engine.codeToTokens(combined,{lang:language,theme:'github-dark',
          includeExplanation:true});
        const start=prefix.length,end=start+targetSlice.length;
        let cursor=0;ranges=[];
        for(let line=0;line<result.tokens.length;line++){
          const tokens=result.tokens[line];
          for(const token of tokens){
            const length=token.content.length;
            const from=Math.max(start,cursor),to=Math.min(end,cursor+length);
            if(to>from)ranges.push({start:from-start,end:to-start,
              token:categoryFor(token.explanation?.flatMap(x=>x.scopes?.map(s=>s.scopeName)||[])||[])});
            cursor+=length;
          }
          if(line<result.tokens.length-1)cursor++;
        }
        this.#tokenCache.set(cacheKey,ranges);
        if(this.#tokenCache.size>32)this.#tokenCache.delete(this.#tokenCache.keys().next().value);
      }catch(error){return {...identity,status:'FALLBACK',ranges:[],error:String(error)};}
    }
    if(signal?.aborted)return {...identity,status:'STALE',ranges:[]};
    const colors=this.#palette.resolve(background);
    return {...identity,status:'OK',ranges:ranges.map(r=>({...r,color:colors[r.token]})),
      paletteVersion:this.#palette.version};
  }
}
