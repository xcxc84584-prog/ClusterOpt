import test from 'node:test';
import assert from 'node:assert/strict';
import {InterfacePalette} from '../src/interface-palette.js';

function setup() {
  const properties = new Map();
  globalThis.document = {documentElement:{style:{setProperty:(key,value)=>properties.set(key,value)}}};
  globalThis.localStorage = {getItem:()=>null,setItem:()=>{}};
  return properties;
}

test('Explorer active colors follow global palette RGB changes', () => {
  const properties = setup();
  const palette = new InterfacePalette();
  const initial = palette.explorerActiveColor;
  assert.equal(properties.get('--explorer-active-bg'),initial.background);
  assert.equal(palette.set([255,255,255]).ok,true);
  const light = palette.explorerActiveColor;
  assert.notEqual(light.background,initial.background);
  assert.equal(properties.get('--explorer-active-bg'),light.background);
  assert.equal(palette.set([225,40,40]).ok,true);
  assert.notEqual(palette.explorerActiveColor.background,light.background);
});
