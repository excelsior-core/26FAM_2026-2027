import {DOCX_MIME,attachmentLabel} from './document-names.js';
// Document-only window. No catalog, branding, key material or site controls.
const query=new URLSearchParams(location.search),channel=query.get('bridge'),parent=window.opener;
let objectURL,received=false;
function status(message){document.body.replaceChildren();const p=document.createElement('p');p.id='status';p.textContent=message;document.body.append(p);}
function release(){if(objectURL)URL.revokeObjectURL(objectURL);objectURL=null;document.body.replaceChildren();}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  if(event.data?.type==='fam-lock'){release();status('Доступ закрыт. Откройте конспект заново из библиотеки.');return;}
  const data=event.data;if(received||data?.type!=='fam-document'||data.channel!==channel)return;
  const attachment=data.record?.attachments?.find(a=>a.id===data.attachment);if(!attachment)return;
  received=true;history.replaceState(null,'',location.pathname);document.title=data.record.title+' — '+attachmentLabel(data.record,attachment);
  const frame=document.createElement('iframe');frame.title=document.title;frame.referrerPolicy='no-referrer';
  if(attachment.mime==='text/html'||attachment.mime===DOCX_MIME){
    if(typeof data.preview!=='string'){status('Не удалось загрузить материал. Откройте его повторно.');return;}
    frame.sandbox=attachment.mime==='text/html'?'allow-scripts allow-modals':'';frame.srcdoc=data.preview;
  }else if(attachment.mime==='application/pdf'){
    objectURL=URL.createObjectURL(new Blob([data.bytes],{type:'application/pdf'}));frame.src=objectURL;
  }else{status('Формат не поддерживается. Скачайте оригинал из библиотеки.');return;}
  document.body.replaceChildren(frame);
});
if(channel&&parent){parent.postMessage({type:'fam-ready',channel},location.origin);setTimeout(()=>{if(!received)status('Не удалось получить конспект. Откройте его заново из библиотеки.');},20000);}
else status('Для просмотра откройте конспект из библиотеки.');
window.addEventListener('pagehide',release);
