import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import katex from '../vendor/katex/katex.min.js';
const sourceURL=new URL('../note-template/source.html',import.meta.url);
const builtURL=new URL('../note-template/dist/FAM-Конспект.html',import.meta.url);
test('every demonstration formula compiles in strict KaTeX, including hidden proofs',async()=>{
  const source=await fs.readFile(sourceURL,'utf8');let count=0;
  const decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  for(const match of source.matchAll(/\\\[([\s\S]*?)\\\]|\$([^$\n]+)\$/g)){
    assert.doesNotThrow(()=>katex.renderToString(decode(match[1]??match[2]),{displayMode:match[1]!==undefined,throwOnError:true,strict:'error',trust:false}));count++;
  }
  assert.ok(count>50,'The complete source including all three proofs was checked.');
});
test('portable note has embedded fonts/scripts, unique anchors and no external assets',async()=>{
  const html=await fs.readFile(builtURL,'utf8');
  const markup=html.replace(/<script>[\s\S]*?<\/script>|<style>[\s\S]*?<\/style>|<!--[\s\S]*?-->/g,'');
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  for(const m of markup.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'Missing target '+m[1]);
  assert.ok(!/<script[^>]*\bsrc=|<link[^>]*\bhref=|<img[^>]*\bsrc="(?!data:)/i.test(markup),'No external asset tags');
  const css=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  const fonts=[...css.matchAll(/url\(([^)]+)\)/g)];assert.ok(fonts.length>20);
  for(const m of fonts)assert.match(m[1],/^data:font\/woff2;base64,/);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,3);
  for(const script of scripts)assert.doesNotThrow(()=>new vm.Script(script[1]));
  assert.doesNotMatch(html,/<!-- FAM:(ASSETS|SCRIPTS) -->/);
});
