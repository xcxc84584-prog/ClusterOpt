/**
 * SyncStatus: isolated OCDA object implementation.
 * Keep internal state private and expose public contracts only.
 */
export function createSyncStatusClass() {
  return class SyncStatus {
 #states=new Map();#listeners=new Set();
 get(id){return this.#states.get(id)||'UNVERIFIED';}
 set(id,state){this.#states.set(id,state);for(const cb of this.#listeners)cb(id,state);}
 delete(id){this.#states.delete(id);}
 subscribe(cb){this.#listeners.add(cb);return()=>this.#listeners.delete(cb);}
};
}
