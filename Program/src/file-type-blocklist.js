/** Global file-type exclusion policy. Hides matching files from Explorer and
 * prevents automatic editor opening; does not delete or modify disk files. */
export const DEFAULT_BLOCKED_EXTENSIONS=Object.freeze([
 '.mp4','.m4v','.mov','.avi','.mkv','.webm','.mp3','.wav','.flac','.ogg',
 '.jpg','.jpeg','.png','.gif','.webp','.bmp','.ico','.svg',
 '.pdf','.zip','.7z','.rar','.tar','.gz','.exe','.dll','.bin','.iso'
]);
const KEY='cluster.file-tool.blocked-extensions.v1';
export function normalizeExtension(value){
 const raw=String(value??'').trim().toLowerCase();
 const ext=raw.startsWith('.')?raw:'.'+raw;
 if(!/^\.[a-z0-9][a-z0-9_-]{0,19}$/.test(ext))throw new Error('Invalid file extension');
 return ext;
}
export class BlockedFileTypes{
 #items;#listeners=new Set();
 constructor(storage=globalThis.localStorage){
  this.storage=storage;
  let saved=null;
  try{saved=JSON.parse(storage?.getItem(KEY)??'null');}catch{}
  this.#items=new Set((Array.isArray(saved)?saved:DEFAULT_BLOCKED_EXTENSIONS).flatMap(x=>{
   try{return [normalizeExtension(x)];}catch{return [];}
  }));
 }
 get value(){return Object.freeze([...this.#items].sort());}
 has(filename){
  const name=String(filename||'').toLowerCase();
  return this.value.some(ext=>name.endsWith(ext));
 }
 add(extension){const ext=normalizeExtension(extension);this.#items.add(ext);this.#changed();return ext;}
 remove(extension){const ext=normalizeExtension(extension);this.#items.delete(ext);this.#changed();}
 replace(oldExtension,newExtension){
  const old=normalizeExtension(oldExtension),next=normalizeExtension(newExtension);
  if(old!==next&&this.#items.has(next))throw new Error('Extension already exists');
  this.#items.delete(old);this.#items.add(next);this.#changed();return next;
 }
 reset(){this.#items=new Set(DEFAULT_BLOCKED_EXTENSIONS);this.#changed();}
 subscribe(listener){this.#listeners.add(listener);return ()=>this.#listeners.delete(listener);}
 #changed(){
  try{this.storage?.setItem(KEY,JSON.stringify(this.value));}catch{}
  for(const fn of this.#listeners)fn(this.value);
 }
}
