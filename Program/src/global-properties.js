/**
 * GlobalPropertyRegistry: isolated OCDA object implementation.
 * Keep internal state private and expose public contracts only.
 */
export function createGlobalPropertyRegistryClass() {
  return class GlobalPropertyRegistry {
 #values=new Map();
#listeners=new Map();
 register(name,value){if(this.#values.has(name))throw Error('Duplicate global property: '+name);
this.#values.set(name,value);
}
 get(name){return this.#values.get(name);
}
 set(name,value){if(!this.#values.has(name))return Object.freeze({ok: false, code: 404});
this.#values.set(name,value);
for(const cb of this.#listeners.get(name)||[])cb(value);
return Object.freeze({ok: true, code: 200});
}
 subscribe(name,cb){if(!this.#listeners.has(name))this.#listeners.set(name,new Set());
this.#listeners.get(name).add(cb);
return()=>this.#listeners.get(name).delete(cb);
}
};
}
