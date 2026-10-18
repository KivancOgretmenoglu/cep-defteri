#!/usr/bin/env python3
"""ElevenLabs ile Türkçe seslendirme.

Kullanım:
  python3 promo/voice.py voices                 → hesabındaki sesleri listeler (ad, id, açıklama)
  python3 promo/voice.py dry <reels>            → API'ye gitmeden metinleri ve kredi tahminini yazar
  python3 promo/voice.py place <reels>          → hazır mp3'leri ("voiceFiles") saniyelerine yerleştirir
  python3 promo/voice.py make <reels>           → seslendirmeyi üretir:
        promo/out/<reels>-voice.wav        (tam uzunlukta, satırlar doğru saniyelere yerleşmiş)
        promo/out/<reels>.captions.json    (kelime zamanlı altyazı; render otomatik kullanır)

Ayarlar (ortam değişkeni): ELEVENLABS_API_KEY (zorunlu), ELEVENLABS_VOICE_ID (seçtiğin ses),
ELEVENLABS_MODEL (varsayılan eleven_multilingual_v2). Anahtarı sohbete yazma; ortam ayarlarına ekle.

reels.json'da reels düzeyinde:
  "voice": [[başlangıç_sn, "söylenecek metin"], ...]
  "voiceSettings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "speed": 1.05}   (isteğe bağlı)
Aynı metin + ses + model bir kez üretilir (out/voice-cache); tekrar çalıştırmak kredi harcamaz.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
CACHE = os.path.join(OUT, 'voice-cache')
SR = 44100
API = 'https://api.elevenlabs.io'
# Marka sesi: Buğra - Sosyal Medya Seslendirmecisi (genç, İstanbul aksanı). ELEVENLABS_VOICE_ID ile değiştirilebilir.
BRAND_VOICE_ID = '78vut4AQryyKEWB72sOv'
# Marka sesi tarifi (brand/marka-sesi.md): ses rengini önceki reelslerdeki satırlara eşitleyen EQ.
# reels.json'da "voiceFilter": "brand" bunu seçer; yeni reelslerde "voiceTempo": 1.2 ile birlikte kullanılır.
BRAND_VOICE_FILTER = 'equalizer=f=170:t=q:w=0.9:g=-4,equalizer=f=560:t=q:w=1.0:g=-3,highshelf=f=3800:g=3.5'


def voice_filter(r):
    vf = r.get('voiceFilter') or ''
    return BRAND_VOICE_FILTER if vf == 'brand' else vf


def die(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    if not k:
        die('ELEVENLABS_API_KEY tanımlı değil. Ortam ayarlarına ekle (anahtarı sohbete yapıştırma).')
    return k


def curl(method, path, body=None):
    """Proxy ve sertifika ayarları curl ile hazır geldiği için curl kullanılır."""
    cmd = ['curl', '-sS', '--max-time', '120', '-X', method, API + path, '-H', f'xi-api-key: {key()}', '-w', '\n%{http_code}']
    if body is not None:
        cmd += ['-H', 'Content-Type: application/json', '-d', json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        die(f'Bağlantı hatası: {r.stderr.strip()}\n(Ağ politikası api.elevenlabs.io adresine izin veriyor mu?)')
    text, _, code = r.stdout.rpartition('\n')
    if code != '200':
        hint = {'401': 'API anahtarı geçersiz.', '403': 'Erişim reddedildi (anahtar izni ya da ağ politikası).', '422': 'İstek geçersiz (ses kimliği ya da ayarlar).', '429': 'Kota ya da hız sınırı.'}.get(code, '')
        die(f'ElevenLabs HTTP {code}. {hint}\n{text[:400]}')
    return json.loads(text)


def load_reel(name):
    reels = json.load(open(os.path.join(HERE, 'reels.json'), encoding='utf-8'))
    if name not in reels:
        die(f'reels.json içinde yok: {name}')
    r = reels[name]
    if not r.get('voice'):
        die(f'"{name}" için "voice" satırı tanımlı değil.')
    return r


def cmd_voices():
    d = curl('GET', '/v1/voices')
    for v in d.get('voices', []):
        lab = v.get('labels') or {}
        print(f"{v['voice_id']}  {v['name']:<22} {lab.get('language', '')} {lab.get('gender', '')} {lab.get('accent', '')} {lab.get('description', '')}")
    print('\nSeçtiğin sesin id\'sini ELEVENLABS_VOICE_ID olarak ortama ekle.')


def cmd_dry(name):
    r = load_reel(name)
    total = 0
    for t, text in r['voice']:
        words = len(text.split())
        total += len(text)
        print(f'{t:6.2f} sn  {words:2d} kelime  {text}')
    print(f'\nToplam {total} karakter ≈ {total} kredi (Multilingual v2; Flash/Turbo modelleri yarısı).')


def synth(text, voice_id, model, settings):
    """Metni üretir (önbellekli) → (mp3 yolu, alignment sözlüğü)."""
    os.makedirs(CACHE, exist_ok=True)
    h = hashlib.sha1(json.dumps([text, voice_id, model, settings], sort_keys=True).encode()).hexdigest()[:16]
    mp3, js = os.path.join(CACHE, h + '.mp3'), os.path.join(CACHE, h + '.json')
    if os.path.exists(mp3) and os.path.exists(js):
        return mp3, json.load(open(js))
    body = {'text': text, 'model_id': model, 'voice_settings': settings}
    d = curl('POST', f'/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128', body)
    open(mp3, 'wb').write(base64.b64decode(d['audio_base64']))
    al = d.get('normalized_alignment') or d.get('alignment')
    json.dump(al, open(js, 'w'))
    return mp3, al


def decode(mp3, af=''):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3] + (['-af', af] if af else []) + ['-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True)
    if r.returncode:
        die('ffmpeg çözemedi: ' + r.stderr.decode()[:200])
    return np.frombuffer(r.stdout, dtype=np.float32)


def trim(x):
    """Baştaki ve sondaki sessizliği kırpar (satır başlangıcı tam otursun)."""
    a = np.abs(x)
    idx = np.where(a > 0.01)[0]
    if not len(idx):
        return x, 0.0
    i0, i1 = max(0, idx[0] - int(0.02 * SR)), min(len(x), idx[-1] + int(0.08 * SR))
    return x[i0:i1], i0 / SR


def words_from_alignment(al, offset):
    """Karakter zamanlarından kelime başlangıç/bitiş zamanları (satır içi saniye)."""
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    out, cur, s0, e0 = [], '', None, None
    for c, a, b in zip(chars, st, en):
        if c.isspace():
            if cur:
                out.append((cur, s0 - offset, e0 - offset))
            cur, s0 = '', None
        else:
            if s0 is None:
                s0 = a
            cur += c
            e0 = b
    if cur:
        out.append((cur, s0 - offset, e0 - offset))
    return out


def phrases(words, max_words=5):
    """Kelimeleri ekranda görünecek kısa öbeklere böler (noktalamada ya da 5 kelimede)."""
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words or re.search(r'[.!?:,;]$', w[0]):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def cmd_make(name):
    r = load_reel(name)
    voice_id = os.environ.get('ELEVENLABS_VOICE_ID') or BRAND_VOICE_ID
    model = os.environ.get('ELEVENLABS_MODEL', 'eleven_multilingual_v2')
    settings = {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True, **r.get('voiceSettings', {})}
    n = int((r['end'] + 0.5) * SR)
    track = np.zeros(n, dtype=np.float32)
    caps, spoken = [], 0
    for t0, text in r['voice']:
        mp3, al = synth(text, voice_id, model, settings)
        x, lead = trim(decode(mp3, voice_filter(r)))
        i = int(t0 * SR)
        track[i : i + len(x)] += x[: max(0, n - i)]
        ws = [(w, t0 + a, t0 + b) for w, a, b in words_from_alignment(al, lead)]
        end_t = t0 + len(x) / SR
        if end_t > r['end']:
            print(f'UYARI: "{text[:30]}…" videonun bitişini ({r["end"]} sn) aşıyor: {end_t:.1f} sn', file=sys.stderr)
        spoken += len(text)
        for g in phrases(ws):
            caps.append([round(g[0][1] - 0.03, 2), round(g[-1][2] + 0.18, 2), ' '.join(w for w, _, _ in g), 1430, [round(w[1], 2) for w in g]])
        print(f'{t0:6.2f}–{end_t:5.2f} sn  {text}')
    track = np.tanh(track * 1.2) / 1.2
    stereo = (np.stack([track, track], 1) * 32767 * 0.9).astype('<i2')
    os.makedirs(OUT, exist_ok=True)
    wavp = os.path.join(OUT, f'{name}-voice.wav')
    with wave.open(wavp, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())
    json.dump(caps, open(os.path.join(OUT, f'{name}.captions.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'\nyazıldı: {wavp}\nyazıldı: out/{name}.captions.json   ({spoken} karakter)')
    print(f'Sonraki adım: python3 promo/audio.py {name} && node promo/render.mjs video {name}')


ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']


def tr_number(n):
    """1.234 → 'bin iki yüz otuz dört' (altyazıda rakam yazılan sayının okunuşu, hece sayımı için)."""
    def three(k):
        h, t, o = k // 100, k % 100 // 10, k % 10
        return ([] if h < 2 else [ONES[h]]) + (['yüz'] if h else []) + ([TENS[t]] if t else []) + ([ONES[o]] if o else [])
    th, rest = divmod(n, 1000)
    return ' '.join(([] if th < 2 else three(th)) + (['bin'] if th else []) + three(rest)) or 'sıfır'


def syllables(w):
    """Kelimenin hece sayısı; "2.500" gibi rakamlar okunuşlarına göre sayılır."""
    digits = re.sub(r'[^0-9]', '', w)
    if digits and len(digits) <= 6:
        w = tr_number(int(digits))
    return max(1, len(re.findall(r'[aeıioöuüAEIİOÖUÜ]', w)))


def estimate_caps(text, a, b, y, mx=4):
    """Satırın konuşma aralığına kelimeleri hece sayısına göre yayar; ≤4 kelimelik öbekler."""
    words = text.split()
    syl = [syllables(w) + (0.6 if re.search(r'[.,:?!]$', w) else 0) for w in words]
    tot, acc, times = sum(syl), 0, []
    for s_ in syl:
        times.append(round(a + (b - a) * acc / tot, 2)); acc += s_
    out, cur = [], []
    for k, w in enumerate(words):
        nxt = words[k + 1] if k + 1 < len(words) else ''
        cur.append(k)
        if len(cur) >= mx or re.search(r'[.,:?!]$', w) or len(' '.join(words[i] for i in cur) + ' ' + nxt) > 17:
            out.append(cur); cur = []
    if cur: out.append(cur)
    caps = []
    for g in out:
        end = times[g[-1] + 1] if g[-1] + 1 < len(times) else b
        caps.append([round(times[g[0]] - 0.03, 2), round(end + 0.3, 2), ' '.join(words[k] for k in g), y, [times[k] for k in g]])
    return caps


def cmd_place(name):
    """reels.json → "voiceFiles": [[sn, "mp3 yolu"], ...] ve isteğe bağlı "voiceTempo" ile hazır satırları yerleştirir."""
    reels = json.load(open(os.path.join(HERE, 'reels.json'), encoding='utf-8'))
    r = reels[name]
    tempo = r.get('voiceTempo', 1.0)
    n = int((r['end'] + 0.5) * SR)
    track = np.zeros(n, dtype=np.float32)
    caps = []
    for item in r['voiceFiles']:
        t0, f = item[0], item[1]
        tp = item[3] if len(item) > 3 else tempo  # satıra özel hız
        af = [voice_filter(r)] if voice_filter(r) else []  # ses rengini diğer reelslere eşitleyen EQ
        if tp != 1: af.append(f'atempo={tp}')
        cmd = ['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, f)] + (['-af', ','.join(af)] if af else []) + ['-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']
        x, _ = trim(np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, dtype=np.float32))
        i = int(t0 * SR)
        track[i : i + len(x)] += x[: max(0, n - i)]
        print(f'{t0:6.2f}–{t0 + len(x) / SR:5.2f} sn  {f}')
        if len(item) > 2 and item[2]:  # metin varsa hece ağırlıklı kelime zamanlı altyazı
            caps += estimate_caps(item[2], t0, t0 + len(x) / SR, r.get('captionY', 1330), r.get('captionMaxWords', 4))
    if caps and r.get('captionUntil'):  # CTA kutusu gelmeden altyazı biter
        cu = r['captionUntil']
        caps = [c for c in caps if c[0] < cu - 0.2]
        for c in caps: c[1] = min(c[1], cu)
    if caps:
        for k in range(len(caps) - 1):
            caps[k][1] = round(min(caps[k][1], caps[k + 1][0] - 0.01), 2)
        json.dump(caps, open(os.path.join(OUT, f'{name}.captions.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'yazıldı: out/{name}.captions.json ({len(caps)} öbek)')
    stereo = (np.stack([track, track], 1) * 32767 * 0.9).astype('<i2')
    with wave.open(os.path.join(OUT, f'{name}-voice.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(stereo.tobytes())
    print(f'yazıldı: out/{name}-voice.wav')


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['voices']:
        cmd_voices()
    elif a[:1] == ['dry'] and len(a) == 2:
        cmd_dry(a[1])
    elif a[:1] == ['place'] and len(a) == 2:
        cmd_place(a[1])
    elif a[:1] == ['make'] and len(a) == 2:
        cmd_make(a[1])
    else:
        print(__doc__)
