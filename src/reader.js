import {icon,escape as e} from './icons.js';
import {fetchObject} from './crypto.js';
import {DOCX_MIME,attachmentLabel,downloadName} from './document-names.js';
let generation=0,cleanups=[],popups=[];
const $=s=>document.querySelector(s),root=new URL('../',import.meta.url);
const url=p=>new URL(p,root).href;
const dataURL=(bytes,mime)=>new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob([bytes],{type:mime}));});
export async function previewHTML(bytes,attachment,keys){const doc=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'text/html');
  for(const el of doc.querySelectorAll('base,meta[http-equiv],iframe,object,embed,form'))el.remove();
  for(const el of doc.querySelectorAll('script[src]')){const src=el.getAttribute('src');if(/katex(?:\.min)?\.js/.test(src))el.src=url('vendor/katex/katex.min.js');else if(/auto-render(?:\.min)?\.js/.test(src))el.src=url('vendor/katex/contrib/auto-render.min.js');else el.remove();}
  for(const el of doc.querySelectorAll('link[href]')){const href=el.getAttribute('href');if(/katex(?:\.min)?\.css/.test(href))el.href=url('vendor/katex/katex.min.css');else if(!href.startsWith('data:'))el.remove();}
  for(const style of doc.querySelectorAll('style'))style.textContent=style.textContent.replace(/@import\s+[^;]+;/g,'').replace(/url\(\s*['"]?https?:[^)]+\)/g,'none');
  for(const img of doc.querySelectorAll('img')){const src=img.getAttribute('src');if(src?.startsWith('data:'))continue;const resource=attachment.resources?.find(r=>r.url===src);if(resource&&!resource.missing&&keys){try{img.src=await dataURL(await fetchObject(resource,keys),resource.mime);}catch{img.removeAttribute('src');img.alt='Изображение недоступно';}}else{img.removeAttribute('src');img.alt=img.alt||'Внешнее изображение не загружено';}}
  const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content=`default-src 'none'; script-src 'unsafe-inline' ${root.origin}${root.pathname}vendor/; style-src 'unsafe-inline' ${root.origin}${root.pathname}vendor/; font-src data: ${root.origin}${root.pathname}vendor/; img-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;doc.head.prepend(csp);
  const fonts=doc.createElement('link');fonts.rel='stylesheet';fonts.href=url('vendor/fonts/lecture-fonts.css');doc.head.append(fonts);
  const styles=doc.createElement('style');styles.textContent='html{overflow-x:hidden}body{overflow-wrap:break-word}.katex-display{max-width:100%;overflow-x:auto;overflow-y:hidden}img,svg{max-width:100%}';doc.head.append(styles);
  // Source lectures expect localStorage for their own theme. In the opaque sandbox,
  // provide an ephemeral, frame-local adapter without weakening isolation.
  const shim=doc.createElement('script');shim.textContent=`(()=>{const values=new Map();const memory={getItem:k=>values.get(String(k))??null,setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,get length(){return values.size}};for(const name of ['localStorage','sessionStorage'])Object.defineProperty(window,name,{value:memory,configurable:false});document.addEventListener('click',event=>{const anchor=event.target.closest?.('a[href^="#"]');if(!anchor)return;event.preventDefault();try{const target=document.getElementById(decodeURIComponent(anchor.getAttribute('href').slice(1)));target?.scrollIntoView({block:'start',behavior:'instant'});}catch{}},true);document.addEventListener('DOMContentLoaded',()=>{if(innerWidth<960)document.querySelectorAll('.layout-root').forEach(el=>el.classList.add('sidebar-collapsed'));});})();`;csp.after(shim);
  // Same-document anchors stay useful; external navigation is removed from the derived preview.
  for(const a of doc.querySelectorAll('a')){const href=a.getAttribute('href');if(!href?.startsWith('#')){a.removeAttribute('href');a.removeAttribute('target');}}
  return '<!doctype html>'+doc.documentElement.outerHTML;
}
function resetStage(){generation++;for(const dispose of cleanups.splice(0))dispose();}
export function clearReader({lockTabs=false}={}){resetStage();$('#reader')?.close();$('#reader-content')?.replaceChildren();$('#reader')?.classList.remove('split-reader');if(lockTabs){for(const p of popups){try{p.postMessage({type:'fam-lock'},location.origin);}catch{}}popups=[];}else popups=popups.filter(p=>!p.closed);}
function openTab(record,attachment,bytes,preview,toast){
  const channel=crypto.randomUUID(),u=new URL('lecture.html',root);u.searchParams.set('bridge',channel);
  const child=window.open(u.href,'_blank');if(!child){toast('Разрешите открытие новой вкладки в браузере.');return;}popups.push(child);
  const listener=ev=>{if(ev.origin!==location.origin||ev.source!==child||ev.data?.type!=='fam-ready'||ev.data.channel!==channel)return;window.removeEventListener('message',listener);child.postMessage({type:'fam-document',channel,record:{title:record.title,subject:record.subject,type:record.type,number:record.number,attachments:[{...attachment,name:downloadName(record,attachment)}]},attachment:attachment.id,bytes,preview},location.origin);};
  window.addEventListener('message',listener);setTimeout(()=>window.removeEventListener('message',listener),20000);
}
function download(record,attachment,bytes){const u=URL.createObjectURL(new Blob([bytes],{type:attachment.mime})),a=document.createElement('a');a.href=u;a.download=downloadName(record,attachment);a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
export async function showReader(record,keys,{attachment,saved=false,onSave,toast=()=>{}}={}){
  resetStage();
  const dialog=$('#reader');
  const notes=record.attachments.filter(a=>a.mime==='text/html');
  const materials=record.attachments.filter(a=>a.mime==='application/pdf'||a.mime===DOCX_MIME);
  let selected=record.attachments.find(a=>a.id===attachment)||notes[0]||record.attachments[0];
  if(!selected)throw Error('Нет доступных вложений');
  let split=false;
  let materialSelected=materials.includes(selected)?selected:materials.find(a=>a.role!=='note')||materials[0];
  let noteSelected=notes.includes(selected)?selected:notes[0];
  const canSplit=materials.length>0&&notes.length>0;

  $('#reader-content').innerHTML=
    '<header class="reader-header"><div class="reader-title"><div class="eyebrow">'+e(record.subject)+' / '+e(record.type)+'</div><h2 title="'+e(record.title)+'">'+e(record.title)+'</h2></div>'+
    (canSplit?'<div class="reader-controls"><div class="reader-mode" role="group" aria-label="Режим просмотра"><button data-reader-mode="single" aria-pressed="true">Один документ</button><button data-reader-mode="split" aria-pressed="false">'+icon('split')+' Рядом</button></div><label class="split-size" hidden>Ширина материала<input type="range" min="30" max="70" value="50" aria-label="Ширина панели материала преподавателя"><span>50%</span></label></div>':'')+
    '<div class="reader-actions">'+(onSave?'<button class="icon-btn bookmark-action '+(saved?'saved':'')+'" id="save-record" aria-label="Избранное">'+icon('bookmark')+'</button>':'')+'<button class="icon-btn" id="close-reader" aria-label="Закрыть просмотр">'+icon('close')+'</button></div></header>'+
    '<div class="attachment-tabs" aria-label="Вложения"'+(record.attachments.length<2?' hidden':'')+'>'+record.attachments.map(a=>'<button data-attachment="'+e(a.id)+'" aria-pressed="'+(a.id===selected.id)+'">'+e(attachmentLabel(record,a))+'</button>').join('')+'</div><div class="document-workspace" id="document-workspace"></div>';

  if(!dialog.open)dialog.showModal();
  $('#close-reader').onclick=()=>clearReader();
  dialog.oncancel=()=>clearReader();
  if(onSave)$('#save-record').onclick=()=>$('#save-record').classList.toggle('saved',onSave());
  const workspace=$('#document-workspace');
  const slider=$('.split-size input');
  if(slider)slider.oninput=()=>{
    workspace.style.setProperty('--material-width',slider.value+'%');
    $('.split-size span').textContent=slider.value+'%';
  };

  function selectSingle(next){
    selected=next;
    if(materials.includes(next))materialSelected=next;
    if(notes.includes(next))noteSelected=next;
    render();
  }

  async function render(){
    resetStage();
    const mine=generation;
    dialog.classList.toggle('split-reader',split);
    $('.attachment-tabs').hidden=split||record.attachments.length<2;
    if(slider)$('.split-size').hidden=!split;
    dialog.querySelectorAll('[data-reader-mode]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.readerMode==='split')===split)));
    dialog.querySelectorAll('[data-attachment]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.attachment===selected.id)));
    workspace.classList.toggle('is-split',split);
    workspace.replaceChildren();
    if(split){
      await Promise.all([
        addPane(materialSelected,materials,'Выбрать материал преподавателя',next=>{materialSelected=next;render();}),
        addPane(noteSelected,notes,'Выбрать конспект',next=>{noteSelected=next;render();})
      ]);
    }else await addPane(selected,record.attachments,'Выбрать документ',selectSingle);

    async function addPane(a,choices,selectLabel,onChange){
      const pane=document.createElement('section');
      const label=e(attachmentLabel(record,a));
      pane.className='document-pane';
      pane.setAttribute('aria-label',attachmentLabel(record,a));
      const selector=choices.length>1?'<select aria-label="'+selectLabel+'">'+choices.map(item=>
        '<option value="'+e(item.id)+'" '+(item.id===a.id?'selected':'')+'>'+e(attachmentLabel(record,item))+'</option>'
      ).join('')+'</select>':'';
      pane.innerHTML='<header class="pane-header"><div class="pane-label'+(selector&&!split?' has-selector':'')+'">'+selector+
        (selector&&split?'':'<strong>'+label+'</strong>')+(a.indexStatus==='scan'?'<small>Скан</small>':'')+
        '</div><div class="pane-actions"><button class="icon-btn" data-popout aria-label="Открыть '+label+' в новой вкладке" title="Новая вкладка" disabled>'+icon('diagonal')+'</button><button class="icon-btn" data-download aria-label="Скачать '+label+'" title="Скачать файл" disabled>'+icon('download')+'</button></div></header>'+
        '<div class="document-stage"><div class="reader-loading">Загрузка…</div></div>';
      workspace.append(pane);

      const select=pane.querySelector('select');
      if(select)select.onchange=()=>onChange(choices.find(item=>item.id===select.value));
      const stage=pane.querySelector('.document-stage');
      try{
        const bytes=await fetchObject(a.object,keys);
        if(mine!==generation)return;
        const downloadButton=pane.querySelector('[data-download]');
        downloadButton.disabled=false;
        downloadButton.onclick=()=>download(record,a,bytes);
        let preview;
        if(a.mime==='application/pdf')await showPDF(bytes,mine,stage);
        else{
          const note=a.mime==='text/html';
          if(!note&&!a.preview){
            stage.innerHTML='<div class="reader-loading">Предпросмотр недоступен. Оригинал можно скачать.</div>';
            return;
          }
          preview=note?await previewHTML(bytes,a,keys):wordPreview(await fetchObject(a.preview,keys));
          if(mine!==generation)return;
          const frame=document.createElement('iframe');
          frame.title=record.title+' — '+attachmentLabel(record,a);
          frame.sandbox=note?'allow-scripts allow-modals':'';
          frame.referrerPolicy='no-referrer';
          frame.srcdoc=note?compactNotePreview(preview):preview;
          stage.replaceChildren(frame);
        }
        if(mine!==generation)return;
        const popout=pane.querySelector('[data-popout]');
        popout.disabled=false;
        popout.onclick=()=>openTab(record,a,bytes,preview,toast);
      }catch(err){
        if(mine!==generation)return;
        stage.innerHTML='<div class="reader-loading"><p>Не удалось открыть материал: '+e(err.message)+'</p><button class="primary-btn" data-retry>Повторить</button></div>';
        stage.querySelector('[data-retry]').onclick=render;
      }
    }
  }
  dialog.querySelectorAll('[data-attachment]').forEach(b=>b.onclick=()=>selectSingle(record.attachments.find(a=>a.id===b.dataset.attachment)));
  dialog.querySelectorAll('[data-reader-mode]').forEach(b=>b.onclick=()=>{split=b.dataset.readerMode==='split';render();});
  await render();
}
function wordPreview(bytes){
  const content=new TextDecoder().decode(bytes);
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;">'+
    '<style>:root{color-scheme:light dark}body{margin:0;background:Canvas;color:CanvasText;font:1rem/1.6 system-ui,sans-serif;overflow-wrap:anywhere}main{max-width:44rem;margin:auto;padding:clamp(1rem,4vw,2rem)}h1{font-size:1.45rem;line-height:1.2;margin:0 0 1.25rem}ol,ul{padding-inline-start:1.6rem}li{margin-block:.85rem}p{margin-block:.8rem}</style>'+
    '</head><body><main>'+content+'</main></body></html>';
}
function compactNotePreview(preview){
  if(!preview.includes('id="note-theme"'))return preview;
  return preview.replace('</head>','<style>@media screen and (min-width:500px){'+
    '.topbar{height:48px;min-height:48px;padding:0 3vw;flex-wrap:nowrap;gap:12px}'+
    '.topbar .wordmark{font-size:24px}.topbar .wordmark span,.topbar .pdf-button span{display:none}'+
    '.topbar .top-actions{flex-wrap:nowrap;gap:10px}.topbar .pdf-button{padding:5px 9px}'+
    '}</style></head>');
}
async function showPDF(bytes,mine,stage){
  const pdf=await import('../vendor/pdfjs/legacy/build/pdf.mjs');if(mine!==generation)return;pdf.GlobalWorkerOptions.workerSrc=url('vendor/pdfjs/legacy/build/pdf.worker.mjs');
  const task=pdf.getDocument({data:new Uint8Array(bytes.slice(0)),cMapUrl:url('vendor/pdfjs/cmaps/'),cMapPacked:true,standardFontDataUrl:url('vendor/pdfjs/standard_fonts/'),wasmUrl:url('vendor/pdfjs/wasm/'),isEvalSupported:false});
  let alive=true,observer,resize,timer;const renderTasks=new Map();cleanups.push(()=>{alive=false;clearTimeout(timer);observer?.disconnect();resize?.disconnect();renderTasks.forEach(t=>t.cancel());Promise.resolve(task.destroy()).catch(()=>{});});
  const doc=await task.promise;if(!alive||mine!==generation)return;
  stage.innerHTML=`<div class="pdf-toolbar"><span>PDF · ${doc.numPages} стр.</span><label>Страница <input type="number" min="1" max="${doc.numPages}" value="1" aria-label="Страница PDF"></label><button class="pdf-go" aria-label="Перейти к странице PDF">Перейти</button></div><div class="pdf-pages"></div>`;
  const container=stage.querySelector('.pdf-pages'),visible=new Set(),elements=[];let width=0;
  async function renderPage(el){const n=Number(el.dataset.page),targetWidth=Math.max(100,Math.min(container.clientWidth-24,1200));if(el.dataset.width===String(targetWidth))return;el.dataset.width=String(targetWidth);renderTasks.get(n)?.cancel();
    try{const page=await doc.getPage(n);if(!alive||mine!==generation||el.dataset.width!==String(targetWidth))return;const base=page.getViewport({scale:1}),vp=page.getViewport({scale:targetWidth/base.width}),canvas=document.createElement('canvas'),ratio=Math.min(devicePixelRatio,1.5);canvas.width=Math.floor(vp.width*ratio);canvas.height=Math.floor(vp.height*ratio);canvas.setAttribute('aria-label',`Страница ${n}`);el.replaceChildren(canvas);el.style.minHeight='0';const renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport:vp,transform:[ratio,0,0,ratio,0,0]});renderTasks.set(n,renderTask);await renderTask.promise;if(renderTasks.get(n)===renderTask)renderTasks.delete(n);
    }catch(err){if(alive&&mine===generation&&err.name!=='RenderingCancelledException'){el.textContent='Не удалось показать страницу.';delete el.dataset.width;}}
  }
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){visible.add(entry.target);renderPage(entry.target);}else visible.delete(entry.target);}},{root:stage,rootMargin:'400px'});
  for(let n=1;n<=doc.numPages;n++){const el=document.createElement('div');el.className='pdf-page';el.dataset.page=n;el.style.cssText='width:100%;min-height:640px';container.append(el);elements.push(el);observer.observe(el);}
  resize=new ResizeObserver(()=>{const next=container.clientWidth;if(Math.abs(next-width)<3)return;width=next;clearTimeout(timer);timer=setTimeout(()=>{if(alive)visible.forEach(renderPage);},140);});resize.observe(container);
  const input=stage.querySelector('input');function go(){const n=Math.max(1,Math.min(doc.numPages,Math.floor(Number(input.value)||1)));input.value=n;elements[n-1].scrollIntoView({block:'start',behavior:'instant'});renderPage(elements[n-1]);}
  stage.querySelector('.pdf-go').onclick=go;input.onkeydown=ev=>{if(ev.key==='Enter')go();};
}
