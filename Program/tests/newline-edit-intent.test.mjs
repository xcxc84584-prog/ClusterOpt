import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveEditIntent} from '../src/fmc/newline-edit-intent.js';
import {EditPath} from '../src/fmc/edit-path.js';
import {createVTE} from '../src/vte/vte.js';

const intent=(value,inputType,start,end=start,data=null,isComposing=false)=>
  deriveEditIntent({value,inputType,start,end,data,isComposing});

test('50.2: Enter and line join produce exact deltas and text',()=>{
  const path=new EditPath('test:0','a\nb',{maxLength:2});
  const enter=intent(path.text,'insertLineBreak',1);
  assert.equal(enter.deltaLines,1);
  assert.equal(path.applyKnownPatch(enter,'a\n\nb'),true);
  assert.equal(path.lineCount,3);
  const backspace=intent(path.text,'deleteContentBackward',2);
  assert.deepEqual({start:backspace.start,end:backspace.end,text:backspace.text,
    deltaLines:backspace.deltaLines},{start:1,end:2,text:'',deltaLines:-1});
  assert.equal(path.applyKnownPatch(backspace,'a\nb'),true);
  assert.equal(path.lineCount,2);
  const forward=intent(path.text,'deleteContentForward',1);
  assert.equal(forward.deltaLines,-1);
  assert.equal(path.applyKnownPatch(forward,'ab'),true);
  assert.equal(path.lineCount,1);
});

test('50.2: selection replacement, paste and fallback cases',()=>{
  const path=new EditPath('test:0','a\nb\nc',{maxLength:3});
  const paste=intent(path.text,'insertFromPaste',1,4,'x\ny\n');
  assert.equal(paste.deltaLines,0);
  assert.equal(path.applyKnownPatch(paste,'ax\ny\n\nc'),true);
  assert.equal(path.lineCount,3);
  assert.equal(intent(path.text,'historyUndo',1),null);
  assert.equal(intent(path.text,'insertText',1,1,'中',true),null);
  assert.equal(intent(path.text,'insertFromPaste',1,1,null),null);
  const edit=intent(path.text,'insertLineBreak',1);
  assert.equal(path.applyKnownPatch(edit,'unexpected'),false);
  assert.equal(path.text,'ax\ny\n\nc');
  path.reconcile('changed\nline');
  assert.equal(path.lineCount,2);
});

test('50.2: random known newline edits match reference; VTE isolated',()=>{
  const vte=createVTE();
  let reference='hello\nworld',seed=79;
  const path=new EditPath('test:0',reference,{maxLength:5});
  const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  for(let i=0;i<400;i++){
    const offset=rand(reference.length+1);
    const insert=rand(2)===0;
    const type=insert?'insertLineBreak':'deleteContentBackward';
    const change=intent(reference,type,offset);
    if(!change)continue;
    const next=reference.slice(0,change.start)+change.text+
      reference.slice(change.end);
    const previousLines=path.lineCount;
    assert.equal(path.applyKnownPatch(change,next),true);
    assert.equal(path.lineCount-previousLines,change.deltaLines);
    reference=next;
    assert.equal(path.slice(0,path.length),reference);
  }
  assert.equal(vte.Status().data.files.length,0);
});
