/**
 * FileManager: isolated OCDA object implementation.
 * Keep internal state private and expose public contracts only.
 */
export function createFileManagerClass(omu, contract) {
  return class FileManager {
 async open(files){const out=[];
for(const f of files){try{out.push({name:f.name,blob:f,content:null,handle:null});
omu.emit('FileManager','Read',200);
}catch(e){omu.emit('FileManager','Read',500,String(e),true);
}}return out;
}
 async openWithHandle(){const handles=await window.showOpenFilePicker({multiple:true});
const out=[];
for(const handle of handles){const file=await handle.getFile();
out.push({name:file.name,blob:file,content:null,handle});
}return out;
}
 async save(doc,handle,forceAs=false){try{let h=forceAs?null:handle;
if(!h&&'showSaveFilePicker'in window)h=await window.showSaveFilePicker({suggestedName:doc.name});
if(h){const w=await h.createWritable();
await w.write(doc.content);
await w.close();
omu.emit('FileManager','Write',200);
return contract(true,{handle:h,name:h.name});
}const blob=new Blob([doc.content],{type:'text/plain;charset=utf-8'});
const url=URL.createObjectURL(blob);
const a=document.createElement('a');
a.href=url;
a.download=doc.name;
a.click();
setTimeout(()=>URL.revokeObjectURL(url),1000);
omu.emit('FileManager','Download',200);
return contract(true,{handle:null,name:doc.name,download:true});
}catch(e){const cancel=e.name==='AbortError';
omu.emit('FileManager','Write',cancel?400:500,String(e),!cancel);
return contract(false,null,cancel?400:500,e.message);
}}
};
}
