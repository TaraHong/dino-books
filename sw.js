/* Offline support. __BUILD__ is replaced with the commit id on every deploy. */
const V='__BUILD__',CORE='dino-core-'+V,AUDIO='dino-audio',FONT='dino-font';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CORE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys()
  .then(k=>Promise.all(k.filter(n=>n.startsWith('dino-core-')&&n!==CORE).map(n=>caches.delete(n))))
  .then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com')return e.respondWith(swr(e,FONT,r));
  if(u.origin!==location.origin)return;
  if(u.pathname.endsWith('/audio/index.json'))return e.respondWith(netFirst(AUDIO,r));
  /* the page itself: newest version when online, saved copy when offline */
  if(r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html'))return e.respondWith(netFirst(CORE,r,'index.html'));
  e.respondWith(swr(e,u.pathname.includes('/audio/')?AUDIO:CORE,r))});
/* answer from the cache right away, refresh the cache in the background */
async function swr(e,name,req){const c=await caches.open(name),hit=await c.match(req,{ignoreSearch:true});
  const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());return res}).catch(()=>hit||Response.error());
  if(hit){e.waitUntil(net);return hit}
  return net}
async function netFirst(name,req,alt){const c=await caches.open(name);
  try{const res=await fetch(req,{cache:'no-store'});if(res.ok)c.put(req,res.clone());return res}
  catch(x){return (await c.match(req,{ignoreSearch:true}))||(alt&&await c.match(alt))||new Response('[]',{headers:{'Content-Type':'application/json'}})}}
