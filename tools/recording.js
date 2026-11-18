// Regenerates the per-book tables in RECORDING.md from the book data. Usage: node tools/recording.js
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const h=fs.readFileSync(path.join(root,'index.html'),'utf8');
const {BOOKS}=new Function(h.match(/<script id="art">([\s\S]*?)<\/script>/)[1]+';return {BOOKS}')();
const pad=n=>String(n).padStart(2,'0'),f=path.join(root,'RECORDING.md');
let md=fs.readFileSync(f,'utf8').split('\n## ')[0].trimEnd()+'\n';
for(const k of BOOKS){md+=`\n## ${k.title} — \`audio/${k.id}/\`\n\n| 파일 | 읽을 문장 |\n|---|---|\n| \`${k.id}/00.m4a\` | ${k.title} |\n`;
  k.pages.forEach((p,i)=>md+=`| \`${k.id}/${pad(i+1)}.m4a\` | ${p.t} |\n`);md+=`| \`${k.id}/11.m4a\` | 끝! 참 잘했어요. |\n`}
fs.writeFileSync(f,md);console.log('RECORDING.md:',BOOKS.length,'books');
