import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { ROOT,PRIVATE,loadVault,saveVault,rotate } from './vault.mjs';
import { scan,build,walk } from './library.mjs';
import { newAccess,derive,seal,unseal } from './crypto.mjs';
const port=Number(process.env.FAM_PORT||4173),host=`127.0.0.1:${port}`,origin=`http://${host}`,token=randomBytes(32).toString('hex');
let vault=await loadVault();await saveVault(vault);let busy=false,status='Готово',watching=process.argv.includes('--watch');
async function job(fn){if(busy)throw Error('Дождитесь окончания текущей операции');busy=true;try{return await fn();}finally{busy=false;}}
if(!Object.keys(vault.records).length){console.log('Сканирование локальных материалов…');await scan(vault);}
try{await fs.access(path.join(ROOT,'export/manifest.json'));}catch{console.log('Создание зашифрованной локальной сборки…');await build(vault,s=>status=s);}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webm':'video/webm','.wasm':'application/wasm','.pdf':'application/pdf','.bcmap':'application/octet-stream'};
const csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; frame-src 'self' blob: about:; object-src 'none'; base-uri 'self'; form-action 'self'";
async function body(req){let s='';for await(const b of req){s+=b;if(s.length>8*1024*1024)throw Error('Слишком большой запрос');}return s?JSON.parse(s):{};}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',csp);res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  const send=(data,code=200)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
    if(req.headers.host!==host){send({error:'Неверный Host'},403);return;}
    const url=new URL(req.url,origin),p=decodeURIComponent(url.pathname);
    if(p.startsWith('/vendor/')){res.setHeader('Cross-Origin-Resource-Policy','cross-origin');res.setHeader('Access-Control-Allow-Origin','*');}
    if(p.startsWith('/api/')){
      if((req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'){send({error:'Запрос с постороннего сайта отклонён'},403);return;}
      if(p==='/api/session'&&req.method==='GET'){send({token,local:true});return;}
      if(req.headers['x-fam-token']!==token){send({error:'Откройте локальную панель заново'},403);return;}
      if(p==='/api/state'){send({records:Object.values(vault.records),users:vault.users.map(({wrappingKey,...u})=>u),modules:vault.modules,source:vault.source,lastBuild:vault.lastBuild,busy,status,watching,epoch:vault.current});return;}
      if(p==='/api/owner'&&req.method==='POST'){send({epochs:vault.epochs});return;}
      if(req.method!=='POST'){send({error:'Method not allowed'},405);return;}const data=await body(req);
      if(p==='/api/scan'){send(await job(async()=>{if(data.source){const source=path.resolve(data.source);await fs.access(source);vault.source=source;}return scan(vault);}));return;}
      if(p==='/api/build'){send(await job(()=>build(vault,s=>status=s)));return;}
      if(p==='/api/record'){const r=vault.records[data.id];if(!r)throw Error('Материал не найден');for(const k of ['title','subject','type','course','year','module','number','dates','tags','hidden'])if(k in data)r[k]=data[k];r.confirmed=true;await saveVault(vault);send({ok:true});return;}
      if(p==='/api/modules'){if(!Array.isArray(data.modules)||data.modules.some(m=>!m.name||!/^\d{4}-\d{2}-\d{2}$/.test(m.start)||m.start>m.end))throw Error('Проверьте интервалы модулей');vault.modules=data.modules;await saveVault(vault);send({ok:true});return;}
      if(p==='/api/access'){send(await job(async()=>{const {user,code}=newAccess(String(data.name||'Новый доступ').slice(0,120));vault.users.push(user);await saveVault(vault);await build(vault);return {code,measuredMs:user.measuredMs};}));return;}
      if(p==='/api/revoke'){send(await job(async()=>{rotate(vault,data.id);await saveVault(vault);return build(vault);}));return;}
      if(p==='/api/reencrypt'){send(await job(async()=>{vault.current=randomBytes(16).toString('hex');vault.epochs[vault.current]=randomBytes(32).toString('base64');await saveVault(vault);return build(vault);}));return;}
      if(p==='/api/watch'){watching=!!data.enabled;send({watching});return;}
      if(p==='/api/backup'){if(String(data.password).length<16)throw Error('Пароль резервной копии: минимум 16 символов');const salt=randomBytes(24),key=derive(data.password,salt,600000);send({v:1,salt:salt.toString('base64'),rounds:600000,data:seal(Buffer.from(JSON.stringify(vault)),key,'backup','registry').toString('base64')});return;}
      if(p==='/api/restore'){send(await job(async()=>{const b=data.backup;const restored=JSON.parse(unseal(Buffer.from(b.data,'base64'),derive(data.password,Buffer.from(b.salt,'base64'),b.rounds),'backup','registry'));if(restored.version!==1||!restored.epochs||!restored.records)throw Error('Неверный формат');await saveVault(restored);vault=restored;return build(vault);}));return;}
      send({error:'Неизвестная операция'},404);return;
    }
    let file;
    if(p==='/note-template/'||p==='/note-template')file=path.join(ROOT,'note-template/dist/FAM-Конспект.html');
    else if(p==='/admin'||p==='/admin/')file=path.join(ROOT,'scripts/admin.html');
    else if(p==='/admin.mjs')file=path.join(ROOT,'scripts/admin.mjs');
    else {const rel=p==='/'?'index.html':p.slice(1);if(rel.split('/').some(x=>x==='..'||x.startsWith('.'))){send({error:'Недоступно'},403);return;}file=path.resolve(ROOT,'export',rel);if(!file.startsWith(path.join(ROOT,'export')+path.sep)){send({error:'Недоступно'},403);return;}
      // Source development has priority over the last static export.
      const dev=p.startsWith('/src/')?path.join(ROOT,rel):path.join(ROOT,'public',rel);try{await fs.access(dev);file=dev;}catch{}
    }
    const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
  }catch(e){send({error:e.code==='ENOENT'?'Файл отсутствует':e.message},e.code==='ENOENT'?404:400);}
});
server.listen(port,'127.0.0.1',()=>console.log(`FAM local: ${origin}\nLocal admin: ${origin}/admin`));
let previous='',pending='',stable=0;setInterval(async()=>{if(!watching||busy)return;try{const files=await walk(vault.source);const stamp=(await Promise.all(files.map(async p=>{const s=await fs.stat(p);return `${p}:${s.size}:${s.mtimeMs}`;}))).join('|');if(!previous){previous=stamp;return;}if(stamp===previous)return;if(stamp!==pending){pending=stamp;stable=0;return;}if(++stable<2)return;await job(async()=>{await scan(vault);await build(vault,s=>status=s);});previous=stamp;status='Локальная сборка обновлена';}catch{status='Источник недоступен. Каталог сохранён.';}},2500).unref();
