// Prints every line the app reads aloud as JSON {"<book id>/<NN>": "문장"}. Usage: node tools/tts-lines.js
const fs=require('fs'),path=require('path');
const h=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const {BOOKS}=new Function(h.match(/<script id="art">([\s\S]*?)<\/script>/)[1]+';return {BOOKS}')();
const pad=n=>String(n).padStart(2,'0'),out={};
for(const k of BOOKS){out[k.id+'/00']=k.title;k.pages.forEach((p,i)=>out[k.id+'/'+pad(i+1)]=p.t);out[k.id+'/11']='끝! 참 잘했어요.'}
console.log(JSON.stringify(out));
