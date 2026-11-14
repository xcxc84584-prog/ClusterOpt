import test from 'node:test';
import assert from 'node:assert/strict';
import {Explorer} from '../src/explorer.js';

test('Explorer toggle opens, closes, and updates aria-expanded', () => {
  const panel = {hidden:true};
  const button = {attrs:{},setAttribute(key,value){this.attrs[key]=value;}};
  const original = globalThis.document;
  globalThis.document = {addEventListener(){},querySelector(selector) {
    assert.equal(selector,'#explorerToggle');
    return button;
  }};
  try {
    const explorer = Object.create(Explorer.prototype);
    // Private fields require a constructed instance; test with a minimal fake DOM.
    const tree={replaceChildren(){},addEventListener(){}};
    const search={value:'',addEventListener(){}};
    const controls={addEventListener(){}};
    panel.querySelector=selector=>({
      '#explorerTree':tree,'#explorerSearch':search,
      '#explorerAddFolder':controls,'#explorerAddFile':controls,'#explorerRefresh':controls,
      '#explorerClose':controls
    })[selector];
    button.addEventListener=()=>{};
    const instance=new Explorer({panel,openFile:async()=>{},openDocument:()=>{}});
    instance.toggle();
    assert.equal(panel.hidden,false);
    assert.equal(button.attrs['aria-expanded'],'true');
    instance.toggle();
    assert.equal(panel.hidden,true);
    assert.equal(button.attrs['aria-expanded'],'false');
    instance.toggle(true);
    assert.equal(panel.hidden,false);
    instance.toggle(false);
    assert.equal(panel.hidden,true);
  } finally {globalThis.document=original;}
});
