// Renders every page of every book into one SVG contact sheet, and checks the book data.
// Usage: node tools/sheet.js [firstBookIndex] > /tmp/sheet.svg && rsvg-convert -w 2000 /tmp/sheet.svg -o /tmp/sheet.png
const fs=require('fs'),path=require('path');
const h=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const art=h.match(/<script id="art">([\s\S]*?)<\/script>/)[1];
const {BOOKS,scene}=new Function(art+';return {BOOKS,scene}')();
const from=+process.argv[2]||0,books=BOOKS.slice(from);
let out=`<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${books.length*300}" viewBox="0 0 4000 ${books.length*300}">`;
BOOKS.forEach(b=>{if(b.pages.length!==10)console.error('NOT 10 PAGES',b.id);
  b.pages.forEach((p,i)=>{const n=(scene(b,p).match(/data-act=/g)||[]).length;if(n<3)console.error('fewer than 3 tappable pictures',b.id,i+1,n)})});
books.forEach((b,r)=>b.pages.forEach((p,c)=>{
  out+=`<svg x="${c*400}" y="${r*300}" width="400" height="300" viewBox="0 0 400 300">`
    +scene(b,p).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace(/ data-tap /g,' ')
    +`<rect x="24" y="8" width="190" height="50" rx="14" fill="#fff" opacity=".85"/></svg>`}));   // white box = where the name badge sits
process.stdout.write(out+'</svg>');
