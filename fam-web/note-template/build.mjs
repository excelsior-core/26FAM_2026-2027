import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const source=path.resolve(process.argv[2]||path.join(here,'source.html'));
const output=path.resolve(process.argv[3]||path.join(here,'dist/FAM-Конспект.html'));
if(source===output)throw Error('Исходник и результат должны быть разными файлами.');
const read=p=>fs.readFile(p,'utf8');
async function inlineCSS(file){const css=(await read(file)).replace(/,\s*url\([^)]*\.(?:woff|ttf)["']?\)\s*format\([^)]*\)/g,'');const matches=[...css.matchAll(/url\(([^)]+)\)/g)];let result=css;for(const m of matches){const rel=m[1].replace(/["']/g,'');if(rel.startsWith('data:'))continue;if(/^(https?:|\/\/)/.test(rel))throw Error('Внешняя зависимость в CSS: '+rel);const font=await fs.readFile(path.resolve(path.dirname(file),rel));const ext=path.extname(rel);const mime={'.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'}[ext];if(!mime)throw Error('Неизвестный тип ресурса: '+rel);result=result.replace(m[0],`url(data:${mime};base64,${font.toString('base64')})`);}return result;}
let html=await read(source);
for(const figure of html.matchAll(/<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi)){
  if(!/\bthemed-figure\b/.test(figure[1]))continue;
  for(const theme of ['light','dark','parchment']){
    const variants=[...figure[2].matchAll(new RegExp('<img\\b[^>]*data-figure-theme=["\']'+theme+'["\'][^>]*>','gi'))];
    if(variants.length!==1||!variants[0][0].match(/\bsrc=["']data:image\/(?:svg\+xml|png);base64,/i))throw Error('Иллюстрация должна содержать ровно один встроенный img для темы '+theme);
  }
}
for(const marker of ['<!-- FAM:ASSETS -->','<!-- FAM:SCRIPTS -->'])if(html.split(marker).length!==2)throw Error('Требуется ровно один маркер '+marker);
const css=await Promise.all(['vendor/fonts/manrope/wght.css','vendor/fonts/cormorant-garamond/wght.css','vendor/fonts/cormorant-garamond/wght-italic.css','vendor/katex/katex.min.css'].map(p=>inlineCSS(path.join(root,p))));
css.push(await read(path.join(here,'style.css')));
const js=await Promise.all(['vendor/katex/katex.min.js','vendor/katex/contrib/auto-render.min.js','note-template/interaction.js'].map(p=>read(path.join(root,p))));
const licenses=await Promise.all(['vendor/fonts/manrope/LICENSE','vendor/fonts/cormorant-garamond/LICENSE','vendor/katex/LICENSE'].map(p=>read(path.join(root,p))));
html=html.replace('<!-- FAM:ASSETS -->',()=>'<style>\n'+css.join('\n')+'\n</style>');
html=html.replace('<!-- FAM:SCRIPTS -->',()=>js.map(code=>'<script>\n'+code.replace(/<\/script/gi,'<\\/script')+'\n</script>').join('\n'));
html=html.replace('</head>',()=>'<!-- Bundled font and KaTeX licenses:\n'+licenses.join('\n\n').replaceAll('--','—')+'\n-->\n</head>');
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,html);
console.log('Автономный HTML: '+output+'\nРазмер: '+(Buffer.byteLength(html)/1024/1024).toFixed(2)+' МБ');
