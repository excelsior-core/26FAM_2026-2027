/* FAM note runtime. No network; only the theme preference is persisted when available. */
(()=>{
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const systemTheme=matchMedia('(prefers-color-scheme: dark)');
  const themeSelect=$('#note-theme');
  let themeChoice='system';try{themeChoice=localStorage.getItem('fam-note-theme')||'system';}catch{}
  if(!['system','light','dark','parchment'].includes(themeChoice))themeChoice='system';
  function applyTheme(){const theme=themeChoice==='system'?(systemTheme.matches?'dark':'light'):themeChoice;document.documentElement.dataset.theme=theme;themeSelect.value=themeChoice;}
  themeSelect.addEventListener('change',()=>{themeChoice=themeSelect.value;try{localStorage.setItem('fam-note-theme',themeChoice);}catch{}applyTheme();});
  systemTheme.addEventListener('change',applyTheme);applyTheme();
  const proofs=$$('[data-proof]'),modes=['hidden','idea','full'];
  document.body.dataset.printMode='full';
  function syncToolbar(){
    const states=new Set(proofs.map(p=>p.dataset.mode));
    $$('[data-all-proofs]').forEach(b=>b.setAttribute('aria-pressed',String(states.size===1&&states.has(b.dataset.allProofs))));
    $('#proof-state').textContent=states.size>1?'Индивидуально':`${proofs.length} ${proofs.length%10===1&&proofs.length%100!==11?'доказательство':proofs.length%10>=2&&proofs.length%10<=4&&(proofs.length%100<12||proofs.length%100>14)?'доказательства':'доказательств'}`;
    $$('[data-all-proofs]').forEach(b=>b.disabled=proofs.length===0);
  }
  function setProof(proof,mode){
    if(!modes.includes(mode))return;
    proof.dataset.mode=mode;
    const idea=proof.querySelector('[data-proof-idea]'),full=proof.querySelector('[data-proof-full]');
    idea.hidden=mode!=='idea';full.hidden=mode!=='full';
    proof.querySelectorAll('[data-proof-mode]').forEach(b=>{
      const own=b.dataset.proofMode;b.setAttribute('aria-pressed',String(own===mode));
      if(own!=='hidden'){b.setAttribute('aria-expanded',String(own===mode));b.setAttribute('aria-controls',(own==='idea'?idea:full).id);}
      else b.hidden=mode==='hidden';
    });
  }
  for(const p of proofs){setProof(p,'idea');p.querySelectorAll('[data-proof-mode]').forEach(b=>b.addEventListener('click',()=>{setProof(p,b.dataset.proofMode);syncToolbar();updatePosition();}));}
  $$('[data-all-proofs]').forEach(b=>b.addEventListener('click',()=>{proofs.forEach(p=>setProof(p,b.dataset.allProofs));syncToolbar();updatePosition();}));syncToolbar();

  // Render before generating the outline, so math in headings gets a clean label.
  try{renderMathInElement($('#content'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:true,trust:false,strict:'error',errorCallback:()=>{$('#math-error').hidden=false;}});}catch{$('#math-error').hidden=false;}
  const headings=$$('h2[data-toc],h3[data-toc]'),list=document.createElement('ol');
  let number=0;
  for(const heading of headings){const li=document.createElement('li'),a=document.createElement('a');a.href='#'+heading.id;if(heading.tagName==='H2'){const n=document.createElement('span');n.className='toc-number';n.textContent=String(++number).padStart(2,'0');n.setAttribute('aria-hidden','true');a.append(n);}else li.className='toc-sub';a.append(document.createTextNode(heading.dataset.toc));li.append(a);list.append(li);}
  $('#toc').replaceChildren(list);$('#section-count').textContent=`Разделов: ${number}`;
  const mobile=matchMedia('(max-width:760px)');
  function closeToc(){ $('#contents').classList.remove('is-open');$('#toc-toggle').setAttribute('aria-expanded','false'); }
  $('#toc-toggle').addEventListener('click',()=>{const open=$('#contents').classList.toggle('is-open');$('#toc-toggle').setAttribute('aria-expanded',String(open));if(open)$('#toc a')?.focus();});
  $('#toc-close').addEventListener('click',()=>{closeToc();$('#toc-toggle').focus();});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&$('#contents').classList.contains('is-open')){closeToc();$('#toc-toggle').focus();}});
  mobile.addEventListener('change',closeToc);
  function goToHash(hash,push){let target;try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return;}if(!target)return;
    const proof=target.closest('[data-proof]');if(proof){setProof(proof,target.closest('[data-proof-idea]')?'idea':'full');syncToolbar();}
    closeToc();if(push){try{history.pushState(null,'',hash);}catch{/* opaque reader sandbox */}}
    target.scrollIntoView({behavior:'instant',block:'start'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});updatePosition();
  }
  document.addEventListener('click',ev=>{const a=ev.target.closest('a[href^="#"]');if(!a)return;ev.preventDefault();goToHash(a.getAttribute('href'),true);});
  window.addEventListener('hashchange',()=>goToHash(location.hash,false));
  function updatePosition(){const y=window.scrollY,span=document.documentElement.scrollHeight-innerHeight;$('#progress-bar').style.width=(span>0?Math.min(100,Math.max(0,100*y/span)):100)+'%';let active=headings[0];for(const h of headings)if(h.getBoundingClientRect().top<145)active=h;
    $$('#toc a').forEach(a=>{if(a.hash==='#'+active?.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
  let pending=false;window.addEventListener('scroll',()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;updatePosition();});},{passive:true});window.addEventListener('resize',updatePosition);
  if(location.hash)goToHash(location.hash,false);updatePosition();

  const dialog=$('#pdf-dialog');let printChoice='full';
  $('#pdf-open').addEventListener('click',()=>{closeToc();$('#pdf-status').textContent='';dialog.showModal();});
  $('#pdf-close').addEventListener('click',()=>dialog.close());
  $$('input[name="pdf-mode"]').forEach(r=>r.addEventListener('change',()=>{if(r.checked)printChoice=r.value;}));
  // Ctrl+P always exports full proofs; the explicit dialog temporarily selects a variant.
  let requested=false;
  window.addEventListener('beforeprint',()=>{if(!requested)document.body.dataset.printMode='full';});
  window.addEventListener('afterprint',()=>{requested=false;document.body.dataset.printMode='full';});
  $('#pdf-print').addEventListener('click',async()=>{
    const button=$('#pdf-print');button.disabled=true;$('#pdf-status').textContent='Подготовка формул и шрифтов…';
    try{
      await document.fonts.ready;
      await Promise.all($$('main img').map(img=>img.decode?.().catch(()=>{})));
      if(!$('#math-error').hidden)throw Error('Исправьте ошибки формул перед экспортом.');
      if($$('main img').some(img=>!img.complete||img.naturalWidth===0))throw Error('Не все иллюстрации загрузились. Проверьте изображения.');
      document.body.dataset.printMode=printChoice;requested=true;dialog.close();
      // Two frames let the dialog disappear before the browser captures the page.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.print();
    }catch(error){requested=false;document.body.dataset.printMode='full';if(!dialog.open)dialog.showModal();$('#pdf-status').textContent=error.message;}
    finally{button.disabled=false;}
  });
})();
