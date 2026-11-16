// Labels depend on catalog metadata only, never on a local source filename.
function isNote(attachment){
  return attachment.mime==='text/html'||attachment.role==='note';
}
export function attachmentLabel(record,attachment){
  const html=attachment.mime==='text/html',note=isNote(attachment),kind=note?'Конспект':'Материал преподавателя';
  const siblings=record.attachments.filter(a=>a.mime===attachment.mime&&isNote(a)===note),index=siblings.findIndex(a=>a.id===attachment.id);
  return `${kind}${siblings.length>1?` ${index+1}`:''} · ${html?'HTML':'PDF'}`;
}
export function downloadName(record,attachment){
  const extension=attachment.mime==='text/html'?'html':'pdf';
  const clean=value=>String(value??'').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'');
  const note=isNote(attachment);
  const siblings=record.attachments.filter(a=>a.mime===attachment.mime&&isNote(a)===note),index=siblings.findIndex(a=>a.id===attachment.id);
  const suffix=(note?` — Конспект${siblings.length>1?` ${index+1}`:''}`:siblings.length>1?` — Материал ${index+1}`:'')+`.${extension}`;
  const title=[record.subject,`${record.type||'Материал'}${record.number?' '+record.number:''}`,record.title].map(clean).filter(Boolean).join(' — ');
  // Leave room for a platform-added duplicate suffix and keep the extension intact.
  return `${(title||'FAM').slice(0,170-suffix.length).replace(/[. ]+$/,'')}${suffix}`;
}
