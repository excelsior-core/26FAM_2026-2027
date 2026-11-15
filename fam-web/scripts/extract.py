import sys,json,re,os,shutil,subprocess,tempfile
from html.parser import HTMLParser
class Text(HTMLParser):
    def __init__(self): super().__init__(); self.hidden=0; self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','noscript'): self.hidden+=1
        if tag=='img': self.parts.extend(v for k,v in attrs if k=='alt')
    def handle_endtag(self,tag):
        if tag in ('script','style','noscript'): self.hidden=max(0,self.hidden-1)
    def handle_data(self,data):
        if not self.hidden:self.parts.append(data)
def extract(p):
    if p.lower().endswith('.html'):
        parser=Text();parser.feed(open(p,encoding='utf-8-sig').read());return {'pages':[{'page':None,'text':re.sub(r'\s+',' ',' '.join(parser.parts))}],'status':'text'}
    try:
        from pypdf import PdfReader
        pages=[];scanned=0
        for n,page in enumerate(PdfReader(p).pages):
            text=page.extract_text() or ''
            if len(text.strip())<30:scanned+=1
            pages.append({'page':n+1,'text':re.sub(r'\s+',' ',text)})
        return {'pages':pages,'status':'scan' if scanned==len(pages) else 'partial' if scanned else 'text','scannedPages':scanned}
    except Exception as e:return {'pages':[],'status':'error','error':type(e).__name__}
data=json.load(sys.stdin)
out={p:extract(p) for p in data}
sys.stdout.buffer.write(json.dumps(out,ensure_ascii=False).encode('utf-8'))
