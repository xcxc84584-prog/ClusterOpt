/**
 * Documents: isolated OCDA object implementation.
 * Keep internal state private and expose public contracts only.
 */
export function createDocumentsClass(omu, contract) {
  return class Documents {
 #docs=new Map();#seq=0;
 create(name='未命名.txt',content='',handle=null){const id='DOC-'+(++this.#seq);this.#docs.set(id,{id,name,content,handle,dirty:false,revision:0});omu.emit('Documents','Create',201);return contract(true,{id});}
 get(id){const d=this.#docs.get(id);return d?contract(true,{id:d.id,name:d.name,content:d.content,dirty:d.dirty,revision:d.revision,hasHandle:!!d.handle}):contract(false,null,404,'Document not found');}
 update(id,content){const d=this.#docs.get(id);if(!d)return contract(false,null,404);d.content=content;d.revision++;d.dirty=true;omu.emit('Documents','Update',200);return contract(true);}
 replaceFromExternal(id,content,expectedRevision){const d=this.#docs.get(id);if(!d)return contract(false,null,404);if(d.revision!==expectedRevision)return contract(false,null,409,'Document changed during read');d.content=content;d.revision++;d.dirty=false;omu.emit('Documents','ExternalReplace',200);return contract(true);}
 setSaved(id,handle=null,name=null,expectedRevision=null){const d=this.#docs.get(id);if(!d)return contract(false,null,404);if(handle)d.handle=handle;if(name)d.name=name;if(expectedRevision===null||d.revision===expectedRevision)d.dirty=false;omu.emit('Documents','Saved',200);return contract(true);}
 handle(id){return this.#docs.get(id)?.handle||null;}
 close(id){if(!this.#docs.has(id))return contract(false,null,404);this.#docs.delete(id);omu.emit('Documents','Close',204);return contract(true);}
 ids(){return [...this.#docs.keys()];}
};
}
