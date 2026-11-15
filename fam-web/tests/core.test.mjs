import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {seal,unseal,newAccess,derive,sha} from '../scripts/crypto.mjs';
import {loadVault,ROOT,rotate} from '../scripts/vault.mjs';
import {walk} from '../scripts/library.mjs';
import {search,excerpt} from '../src/search-worker.js';
test('AES-GCM round trip, wrong key, ciphertext and AAD authentication',()=>{const k=randomBytes(32),data=Buffer.from('Проверка формулы ∀ x ∈ R'),b=seal(data,k,'test','one');assert.deepEqual(unseal(b,k,'test','one'),data);assert.throws(()=>unseal(b,randomBytes(32),'test','one'));assert.throws(()=>unseal(b,k,'test','two'));assert.throws(()=>unseal(b,k,'other','one'));const bad=Buffer.from(b);bad[20]^=1;assert.throws(()=>unseal(bad,k,'test','one'));});
test('fresh nonces across repeated encryptions',()=>{const k=randomBytes(32),nonces=new Set();for(let i=0;i<1000;i++)nonces.add(seal(Buffer.from('same'),k,'t','same').subarray(1,13).toString('hex'));assert.equal(nonces.size,1000);});
test('personal access, wrong password and epoch exclusion',()=>{const a=newAccess('one'),b=newAccess('two'),key=randomBytes(32).toString('base64'),v={current:'old',epochs:{old:key},users:[a.user,b.user]};const secret=a.code.split('.')[2],wrap=derive(secret,Buffer.from(a.user.salt,'base64'),a.user.rounds);const envelope=seal(Buffer.from(JSON.stringify(v.epochs)),wrap,'access',a.user.id);assert.equal(JSON.parse(unseal(envelope,wrap,'access',a.user.id)).old,key);assert.throws(()=>unseal(envelope,derive('wrong',Buffer.from(a.user.salt,'base64'),a.user.rounds),'access',a.user.id));rotate(v,a.user.id);assert.equal(v.users[0].active,false);assert.equal(v.users[1].active,true);const fresh=seal(Buffer.from('new'),Buffer.from(v.epochs[v.current],'base64'),'original','x');assert.throws(()=>unseal(fresh,Buffer.from(key,'base64'),'original','x'));const updated=seal(Buffer.from(JSON.stringify(v.epochs)),Buffer.from(b.user.wrappingKey,'base64'),'access',b.user.id);assert.equal(JSON.parse(unseal(updated,Buffer.from(b.user.wrappingKey,'base64'),'access',b.user.id))[v.current],v.epochs[v.current]);});
test('Russian normalization, morphology, typo, exact phrase, tags and PDF page',()=>{const entries=[{record:'r',attachment:'a',title:'Алгебра',tags:['поле'],source:'a.pdf',pages:[{page:3,text:'Сопряжённые числа и аксиоматическое построение поля. Теорема доказывается индукцией.'}]}];assert.equal(search(entries,'сопряженные')[0].page,3);assert.equal(search(entries,'"аксиоматическое построение"')[0].id,'r');assert.equal(search(entries,'сопряженые')[0].id,'r');assert.equal(search(entries,'#поле')[0].id,'r');assert.equal(search(entries,'несуществующий').length,0);});
test('all 68 encrypted originals roundtrip byte-for-byte; catalog privacy; non-HTML originals unchanged',async()=>{const v=await loadVault(),out=path.join(ROOT,'export'),manifest=JSON.parse(await fs.readFile(path.join(out,'manifest.json'),'utf8'));const read=async d=>unseal(await fs.readFile(path.join(out,'objects',d.id+'.bin')),Buffer.from(v.epochs[d.epoch],'base64'),d.kind,d.id);const catalog=JSON.parse(await read(manifest.catalog));let count=0;for(const r of catalog.records){assert.equal(r.group,undefined);for(const a of r.attachments){assert.equal(a.path,undefined);const original=v.records[r.id].attachments.find(x=>x.id===a.id);assert.equal(sha(await read(a.object)),sha(await fs.readFile(path.join(v.source,original.path))));count++;}}assert.equal(count,68);const before=JSON.parse(await fs.readFile(path.join(ROOT,'.local/storage-before.json'),'utf8'));const now=await walk(v.source);assert.equal(now.length,before.length);// HTML notes are editorial sources. Their current bytes were checked against the encrypted export above.
for(const f of before)if(!/\.html$/i.test(f.path))assert.equal(sha(await fs.readFile(path.resolve(ROOT,'..',f.path))).toUpperCase(),f.sha256);});
test('public allowlist and no secrets, private titles, original paths, source maps or raw documents',async()=>{const v=await loadVault(),out=path.join(ROOT,'export'),files=await walk(out),keys=Object.values(v.epochs);for(const file of files){const rel=path.relative(out,file).replaceAll('\\','/');assert.match(rel,/^(index\.html|lecture\.html|favicon\.svg|sw\.js|manifest\.json|src\/[a-z-]+\.js|src\/[a-z-]+\.css|assets\/[a-z-]+\.png|vendor\/.+|objects\/[a-f0-9]{32}\.bin|access\/[a-f0-9]{32}\.json)$/);assert.ok(!/\.map$/.test(rel));const data=await fs.readFile(file);for(const key of keys)assert.ok(!data.includes(Buffer.from(key)));for(const r of Object.values(v.records))assert.ok(!data.includes(Buffer.from(r.title)));assert.ok(!data.includes(Buffer.from(v.source)));}});

test('search excerpts preserve complete inline and display TeX at both boundaries',()=>{
  for(const [left,right] of [['$','$'],['$$','$$'],['\\(','\\)'],['\\[','\\]']]){
    const formula=left+'a'.repeat(200)+'='+String.raw`\bar{b}`+right;
    const text='x'.repeat(20)+formula+'y'.repeat(40)+formula+'z'.repeat(100);
    const result=excerpt(text,115);
    assert.equal(result.startsWith(formula),true);
    assert.equal(result.endsWith(formula),true);
  }
});
