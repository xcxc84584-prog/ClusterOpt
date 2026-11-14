import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTextColors,contrastRatio,DARK_BACKGROUND_COLORS,LIGHT_BACKGROUND_COLORS} from '../src/text-highlighter/text-contrast.js';
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
test('all syntax colors remain readable on dark, light and mid-tone surfaces',()=>{
 for(const bg of [[0,0,0],[255,255,255],[120,120,120],[65,80,110],[190,155,95],[32,33,39]]){
  const colors=resolveTextColors(bg);
  for(const [name,color] of Object.entries(colors))assert.ok(contrastRatio(rgb(color),bg)>=4.5,JSON.stringify({bg,name,color}));
 }
});
test('two endpoints yield different syntax hues',()=>{
 assert.notEqual(resolveTextColors([0,0,0]).keyword,resolveTextColors([255,255,255]).keyword);
 assert.equal(Object.keys(DARK_BACKGROUND_COLORS).length,Object.keys(LIGHT_BACKGROUND_COLORS).length);
});
test('user color overrides also meet contrast floor',()=>{
 const colors=resolveTextColors([255,255,255],4.5,{keyword:'#eeeeee'});
 assert.ok(contrastRatio(rgb(colors.keyword),[255,255,255])>=4.5);
});
