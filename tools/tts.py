"""Makes the read-aloud audio (audio/<book id>/<NN>.m4a) with the Supertonic text-to-speech model.

  node tools/tts-lines.js | python3 tools/tts.py --check   # how many files are missing or out of date
  node tools/tts-lines.js | python3 tools/tts.py           # make them (needs: pip install supertonic, ffmpeg)

A page is (re)made only when it has no audio at all, or when its audio is still the machine-made
file listed in audio/tts.json and the sentence (or the voice settings) changed since.
A recording that a person put there, in any format, is never touched.
"""
import hashlib, json, os, subprocess, sys, tempfile

VOICE = os.environ.get('TTS_VOICE', 'F1')      # built-in voices: F1-F5, M1-M5
SPEED = float(os.environ.get('TTS_SPEED', '0.95'))
STEPS = 12
EXTS = ('.m4a', '.mp3', '.wav', '.aac', '.ogg', '.webm')
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio')
MAN = os.path.join(ROOT, 'tts.json')
sha = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()

lines = json.load(sys.stdin)
man = json.load(open(MAN, encoding='utf-8')) if os.path.exists(MAN) else {}
cfg = f'{VOICE}/{SPEED}/{STEPS}'
todo = []
for key, text in lines.items():
    base = os.path.join(ROOT, key)
    have = [e for e in EXTS if os.path.exists(base + e)]
    m = man.get(key)
    if not have:
        todo.append(key)
    elif have == ['.m4a'] and m and sha(base + '.m4a') == m['sha'] and (m['text'] != text or m.get('cfg') != cfg):
        todo.append(key)
if '--check' in sys.argv:
    print(len(todo)); sys.exit()
if not todo:
    print('nothing to make'); sys.exit()

from supertonic import TTS
tts = TTS(auto_download=True)
style = tts.get_voice_style(voice_name=VOICE)
say = lambda t: t.replace('“', '').replace('”', '')   # quote marks are not spoken
for n, key in enumerate(todo, 1):
    out = os.path.join(ROOT, key + '.m4a')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    wav, dur = tts.synthesize(say(lines[key]), voice_style=style, lang='ko', speed=SPEED, total_steps=STEPS)
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, 'a.wav')
        tts.save_audio(wav, w)
        # a short breath of silence at both ends, even loudness, small mono AAC file
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-af',
                        'loudnorm=I=-16:TP=-1.5:LRA=11,adelay=120,apad=pad_dur=0.25',
                        '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart',
                        '-map_metadata', '-1', out], check=True)
    man[key] = {'text': lines[key], 'cfg': cfg, 'sha': sha(out)}
    print(f'{n}/{len(todo)} {key} {float(dur[0]):.1f}s {lines[key]}', flush=True)
json.dump(dict(sorted(man.items())), open(MAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
