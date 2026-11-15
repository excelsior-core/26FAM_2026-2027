import test from 'node:test';
import assert from 'node:assert/strict';
import {attachmentLabel,downloadName} from '../src/document-names.js';
import {groupDates,monthCells,dateKey,parseDate} from '../src/calendar.js';
import {loadVault,ROOT} from '../scripts/vault.mjs';
import {unseal} from '../scripts/crypto.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
test('download names are descriptive, filesystem-safe and unique among format variants',()=>{
 const attachments=[{id:'a',mime:'text/html',name:'PRIVATE_LOCAL_NAME.html'},{id:'b',mime:'text/html',name:'PRIVATE_LOCAL_NAME_2.html'},{id:'c',mime:'application/pdf',name:'C:\\private\\x.pdf'}];
 const record={subject:'Тест / анализ',type:'Лекция',number:'1–2',title:'Тема: <A>? "B" '+ 'я'.repeat(200),attachments};
 const files=attachments.map(a=>downloadName(record,a));assert.equal(new Set(files).size,3);
 files.forEach((name,i)=>{assert.ok(name.length<=170);assert.doesNotMatch(name,/[<>:"/\\|?*\u0000-\u001f]/);assert.ok(!name.includes('PRIVATE'));assert.ok(name.endsWith(i===2?'.pdf':'.html'));assert.match(name,/Тест анализ/);});
 assert.equal(attachmentLabel(record,attachments[1]),'Конспект 2 · HTML');
});
test('calendar validates leap days, uses Monday weeks and covers year boundaries',()=>{
 assert.ok(parseDate('2028-02-29'));assert.equal(parseDate('2026-02-29'),null);assert.equal(parseDate('2026-13-01'),null);
 const cells=monthCells(2026,10);assert.equal(cells.length,42);assert.equal(dateKey(cells[0]),'2026-10-26');assert.equal(dateKey(cells.at(-1)),'2026-12-06');assert.equal(cells[0].getDay(),1);
 const january=monthCells(2027,0);assert.equal(dateKey(january[0]),'2026-12-28');assert.equal(dateKey(january.at(-1)),'2027-01-31');
});
test('calendar places multi-day lectures once per date and omits unknown dates',()=>{
 const a={id:'a',subject:'А',title:'Тема',dates:['2026-10-05','2026-10-05','2026-10-09']},b={id:'b',subject:'Б',title:'Тема',dates:[]};
 const grouped=groupDates([a,b]);assert.equal(grouped.size,2);assert.deepEqual(grouped.get('2026-10-05').map(r=>r.id),['a']);assert.deepEqual(grouped.get('2026-10-09').map(r=>r.id),['a']);
});
test('built catalog and search metadata use generated names instead of local filenames',async()=>{
 const vault=await loadVault(),out=path.join(ROOT,'export');const manifest=JSON.parse(await fs.readFile(path.join(out,'manifest.json'),'utf8'));
 const read=async d=>JSON.parse(unseal(await fs.readFile(path.join(out,'objects',d.id+'.bin')),Buffer.from(vault.epochs[d.epoch],'base64'),d.kind,d.id));
 const catalog=await read(manifest.catalog);
 for(const r of catalog.records)for(const a of r.attachments){assert.equal(a.name,downloadName(r,a));assert.equal(a.path,undefined);}
 for(const shard of catalog.shards)for(const item of await read(shard)){const r=catalog.records.find(r=>r.id===item.record),a=r.attachments.find(a=>a.id===item.attachment);assert.equal(item.source,attachmentLabel(r,a));}
});
