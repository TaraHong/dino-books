# Renders every sound offline in headless Chrome and prints "peak/loudness" for each, so broken or silent sounds show up.
# Usage: python3 tools/sound-test.py   (needs playwright and /usr/bin/google-chrome)
import asyncio, json, os, tempfile
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TEST = '''<pre id="res">running</pre><script>
(async()=>{const res={},Real=window.OfflineAudioContext;
 window.AudioContext=function(){const c=new Real(2,44100*3,44100);c.resume=()=>Promise.resolve();return c};window.webkitAudioContext=window.AudioContext;
 for(const k of Object.keys(SND)){let pk=0,rm=0,err="";try{for(let r=0;r<3;r++){AC=null;SND[k](r===2?1.7:1);const d=(await AC.startRendering()).getChannelData(0);
   let p=0,s=0;for(let i=0;i<d.length;i++){const x=Math.abs(d[i]);if(x>p)p=x;s+=d[i]*d[i]}pk=Math.max(pk,p);rm=Math.max(rm,Math.sqrt(s/44100))}}catch(e){err=String(e)}
  res[k]=err||(pk.toFixed(2)+"/"+rm.toFixed(2))}
 document.getElementById("res").textContent="DONE "+JSON.stringify(res)})();
</script></body>'''
async def main():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read().replace('</body>', TEST)
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf8') as f:
        f.write(html)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + f.name)
        await pg.wait_for_function("document.getElementById('res').textContent.startsWith('DONE')", timeout=180000)
        for k, v in json.loads((await pg.inner_text('#res'))[5:]).items(): print(k.ljust(10), v)
        print('page errors:', errs or 'none')
        await b.close()
    os.unlink(f.name)
asyncio.run(main())
