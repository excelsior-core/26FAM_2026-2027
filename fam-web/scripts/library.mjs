import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { attachmentLabel,downloadName } from '../src/document-names.js';
import { id,sha,seal } from './crypto.mjs';
import { ROOT,saveVault } from './vault.mjs';
export async function walk(dir) { const out=[];for(const f of await fs.readdir(dir,{withFileTypes:true})){if(f.isSymbolicLink())continue;const p=path.join(dir,f.name);if(f.isDirectory())out.push(...await walk(p));else out.push(p);}return out; }
const mime=p=>({'.html':'text/html','.pdf':'application/pdf','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(p).toLowerCase()]||'application/octet-stream';
export async function scan(v) {
  const files=await walk(v.source);if(!files.length)throw Error('Источник пуст. Существующий каталог сохранён.');
  const supported=files.filter(p=>/\.(html|pdf)$/i.test(p));if(!supported.length)throw Error('HTML и PDF не найдены. Существующий каталог сохранён.');let added=0;
  const sharedOriginals=new Map();
  for(const manifest of files.filter(file=>path.basename(file)==='original-pdf.json')){
    const folder=path.dirname(manifest);
    const reference=JSON.parse(await fs.readFile(manifest,'utf8'));
    if(typeof reference!=='string'||path.isAbsolute(reference)||!reference.toLowerCase().endsWith('.pdf')||
      !supported.includes(path.resolve(folder,reference))){
      throw Error(`Некорректная ссылка на общий оригинал: ${path.relative(v.source,manifest)}`);
    }
    sharedOriginals.set(folder,path.resolve(folder,reference));
  }
  const entries=supported.map(file=>({file,folder:path.dirname(file),shared:false}));
  for(const [folder,file] of sharedOriginals)entries.push({file,folder,shared:true});
  for(const {file,folder,shared} of entries){const rel=path.relative(v.source,file),parts=path.relative(v.source,folder).split(path.sep);const group=parts.slice(0,4).join('/');
    let rec=Object.values(v.records).find(r=>r.group===group);
    if(!rec){const folder=group.split('/').at(-1),dates=[...folder.matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)].map(m=>`${m[3]}-${m[2]}-${m[1]}`);const nums=[...folder.matchAll(/(?:^|\s)(\d{1,2})\s+\d{2}\.\d{2}\.\d{4}/g)].map(m=>Number(m[1]));
      rec={id:id(),group,title:folder.replace(/^(?:(?:\d+\s+)?\d{2}\.\d{2}\.\d{4}\s*)+/,'').replace(/^\d+\s+/,''),subject:parts[1]||'Материалы',type:parts.includes('Коллоквиумы')?'Коллоквиум':'Лекция',course:1,year:'2026/27',module:'',dates,number:nums.join('–'),tags:[],added:new Date().toISOString(),attachments:[],confirmed:false};v.records[rec.id]=rec;added++;}
    if(!rec.attachments.some(a=>a.path===rel)){
      const name=path.basename(file),type=mime(file);
      const role=type==='application/pdf'&&/^Конспект(?:[ ._-]|$)/iu.test(name)?'note':undefined;
      rec.attachments.push({id:id(),path:rel,name,mime:type,role,...(shared?{shared:true}:{})});
    }
  }
  for(const r of Object.values(v.records)){
    const sharedOriginal=sharedOriginals.get(path.join(v.source,r.group));
    r.attachments=r.attachments.filter(a=>!a.shared||path.join(v.source,a.path)===sharedOriginal);
    for(const a of r.attachments)a.missing=!files.includes(path.join(v.source,a.path));
  }
  await saveVault(v);return {added,records:Object.values(v.records).length,files:files.length,html:supported.filter(p=>p.endsWith('.html')).length,pdf:supported.filter(p=>p.endsWith('.pdf')).length};
}
function extract(paths) {return new Promise((resolve,reject)=>{const p=spawn('python',['-X','utf8',path.join(ROOT,'scripts/extract.py')],{windowsHide:true});let out='';p.stdout.on('data',b=>out+=b);p.stderr.resume();p.on('error',reject);p.on('close',c=>{try{if(c)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Не удалось извлечь текст. Требуются Python и pypdf.'));}});p.stdin.end(JSON.stringify(paths));});}
export async function build(v,progress=()=>{}) {
  const out=path.join(ROOT,'export');await fs.mkdir(path.join(out,'objects'),{recursive:true});await fs.mkdir(path.join(out,'access'),{recursive:true});
  const key=Buffer.from(v.epochs[v.current],'base64'),keep=new Set();let reused=0,encrypted=0;
  async function object(data,kind,identity) {const fingerprint=sha(data),cacheKey=`${v.current}|${kind}|${identity}|${fingerprint}`;let entry=v.cache[cacheKey];
    if(entry){try{await fs.access(path.join(out,'objects',entry.id+'.bin'));reused++;}catch{entry=null;}}
    if(!entry){entry={id:id(),epoch:v.current,kind};await fs.writeFile(path.join(out,'objects',entry.id+'.bin'),seal(data,key,kind,entry.id));v.cache[cacheKey]=entry;encrypted++;}keep.add(entry.id+'.bin');return entry;}
  const records=Object.values(v.records).filter(r=>!r.hidden);const paths=records.flatMap(r=>r.attachments.filter(a=>!a.missing).map(a=>path.join(v.source,a.path)));
  progress('Извлечение текста HTML и PDF');const extracts=await extract([...new Set(paths)]);const catalog=[],bySubject={},originals=new Map();
  for(const r of records){const pub={...r};delete pub.group;delete pub.confirmed;pub.module=r.module||v.modules.find(m=>r.dates.some(d=>d>=m.start&&d<=m.end))?.name||'';pub.attachments=[];
    for(const a of r.attachments){if(a.missing)continue;const p=path.join(v.source,a.path),data=await fs.readFile(p),ex=extracts[p];let resources=[];
      if(!originals.has(p))originals.set(p,await object(data,'original',a.id));
      const entry=originals.get(p);
      if(a.mime==='text/html'){const html=data.toString();for(const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"'#]+\.(?:png|jpg|jpeg|svg|webp))["']/gi)){const url=match[1];if(/^(data:|https?:|\/\/)/.test(url))continue;const img=path.resolve(path.dirname(p),url);if(!img.startsWith(v.source+path.sep))continue;try{resources.push({url,mime:mime(img),...await object(await fs.readFile(img),'resource',img)});}catch{resources.push({url,missing:true});}}}
      pub.attachments.push({id:a.id,name:downloadName(r,a),mime:a.mime,role:a.role,bytes:data.length,object:entry,resources,indexStatus:ex?.status||'error',scannedPages:ex?.scannedPages||0});
      (bySubject[r.subject]??=[]).push({record:r.id,attachment:a.id,title:r.title,tags:r.tags,source:attachmentLabel(r,a),pages:ex?.pages||[]});
    }catalog.push(pub);
  }
  const shards=[];for(const [subject,entries]of Object.entries(bySubject))shards.push({subject,...await object(Buffer.from(JSON.stringify(entries)),'index',subject)});
  const meta=await object(Buffer.from(JSON.stringify({subjects:[...new Set(catalog.map(r=>r.subject))],records:catalog,shards,updated:new Date().toISOString()})),'catalog','catalog');
  for(const u of v.users.filter(u=>u.active)){const envelope=seal(Buffer.from(JSON.stringify({epochs:v.epochs})),Buffer.from(u.wrappingKey,'base64'),'access',u.id);await fs.writeFile(path.join(out,'access',u.id+'.json'),JSON.stringify({v:1,salt:u.salt,rounds:u.rounds,data:envelope.toString('base64')}));}
  for(const name of await fs.readdir(path.join(out,'access')))if(!v.users.some(u=>u.active&&name===u.id+'.json'))await fs.unlink(path.join(out,'access',name));
  await fs.cp(path.join(ROOT,'public'),out,{recursive:true});await fs.cp(path.join(ROOT,'src'),path.join(out,'src'),{recursive:true});await fs.cp(path.join(ROOT,'vendor'),path.join(out,'vendor'),{recursive:true});
  // Admin files are intentionally never included in the allowlisted public source folder.
  const manifest={version:1,build:id(),catalog:meta};await fs.writeFile(path.join(out,'manifest.json.tmp'),JSON.stringify(manifest));await fs.rename(path.join(out,'manifest.json.tmp'),path.join(out,'manifest.json'));
  // Atomic manifest update comes before safe removal of obsolete objects. No source paths are touched.
  // Keep immutable encrypted objects for open tabs and cached catalogs; explicit archival cleanup can be added separately.
  const all=await walk(out),sizes=await Promise.all(all.map(p=>fs.stat(p)));const total=sizes.reduce((a,s)=>a+s.size,0);
  if(sizes.some(s=>s.size>=100*1024*1024)||total>=1024**3)throw Error('Экспорт превышает установленный предел размера.');
  const report={records:catalog.length,attachments:catalog.reduce((n,r)=>n+r.attachments.length,0),scanAttachments:catalog.flatMap(r=>r.attachments).filter(a=>a.indexStatus==='scan'||a.indexStatus==='partial').length,reused,encrypted,bytes:total,updated:new Date().toISOString()};
  v.lastBuild=report;await saveVault(v);return report;
}
