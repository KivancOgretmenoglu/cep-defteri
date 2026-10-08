"""Chiptune müzik + ses efektleri → promo/out/music.wav (120 BPM, 28 sn)."""
import numpy as np, wave, os
SR = 44100; DUR = 28.0; N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)

def add(sig, t0, vol=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i] * vol
    L[i:i+len(sig)] += sig * (1 - max(pan, 0)); R[i:i+len(sig)] += sig * (1 + min(pan, 0))

def freq(m): return 440.0 * 2 ** ((m - 69) / 12)
def env(n, a=0.005, d=0.1, s=0.6, r=0.05):
    e = np.ones(n) * s; na, nd, nr = int(a*SR), int(d*SR), int(r*SR)
    e[:na] = np.linspace(0, 1, max(na,1)); e[na:na+nd] = np.linspace(1, s, max(nd,1))[: max(0, n-na)]
    e[-nr:] *= np.linspace(1, 0, nr) if nr < n else 1
    return e
def osc(f, dur, kind='square', duty=0.5, slide=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    ff = f * (1 + slide * t / max(dur, 1e-3))
    ph = np.cumsum(ff) / SR % 1.0
    if kind == 'square': w = np.where(ph < duty, 1.0, -1.0)
    elif kind == 'tri': w = 4 * np.abs(ph - 0.5) - 1
    elif kind == 'saw': w = 2 * ph - 1
    else: w = np.sin(2 * np.pi * ph)
    return w
def note(m, dur, kind='square', duty=0.5, vol=0.2, a=0.004, d=0.08, s=0.5, r=0.04, slide=0.0):
    w = osc(freq(m), dur, kind, duty, slide); return w * env(len(w), a, d, s, r) * vol
def noise(dur, vol=0.3, decay=12, hp=False):
    n = int(dur * SR); x = rng.uniform(-1, 1, n)
    if hp: x = np.diff(x, prepend=0)
    return x * np.exp(-np.arange(n) / SR * decay) * vol
def kick():
    n = int(0.22 * SR); t = np.arange(n) / SR
    f = 120 * np.exp(-t * 28) + 45; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.9
def whoosh(dur=0.6, up=True):
    n = int(dur * SR); x = rng.uniform(-1, 1, n); t = np.arange(n) / SR
    y = np.zeros(n); a = 0.0
    c = (0.02 + 0.5 * (t / dur) ** 2) if up else (0.5 - 0.48 * t / dur)
    for i in range(n):
        a += c[i] * (x[i] - a); y[i] = a
    return y * np.sin(np.pi * t / dur) ** 1.5 * 0.9

# ── müzik ──
chords = [  # C – G – Am – F (her biri 1 ölçü = 2 sn); (bas, akor sesleri)
    (36, [60, 64, 67, 72]), (43, [59, 62, 67, 71]), (33, [57, 60, 64, 69]), (41, [57, 60, 65, 69]),
]
mel = [  # ölçü başına 8 sekizlik; None = sus (derece MIDI)
    [76, None, 79, None, 76, 74, 72, None], [74, None, 79, 78, 79, None, 74, None],
    [72, None, 76, None, 81, 79, 76, None], [77, 76, 77, 79, 81, None, 79, None],
]
def bar(bi, t0, level):
    bass, ch = chords[bi % 4]
    for k in range(8):  # bas (sekizlikler)
        add(note(bass + (12 if k % 4 == 3 else 0), BEAT * 0.9, 'tri', vol=0.5, d=0.05, s=0.8), t0 + k * BEAT / 2, 1.0)
    if level >= 1:
        for k in range(16):  # arpej
            m = ch[(k * 3 if k % 8 > 3 else k) % 4]
            add(note(m, 0.11, 'square', 0.25, vol=0.07, d=0.04, s=0.5), t0 + k * BEAT / 4, 1.0, pan=0.3 if k % 2 else -0.3)
    if level >= 2:
        for k, m in enumerate(mel[bi % 4]):
            if m: add(note(m, BEAT * 0.45, 'square', 0.5, vol=0.12, d=0.05, s=0.6), t0 + k * BEAT / 2, 1.0)
    if level >= 1:
        for b in range(4):
            add(kick(), t0 + b * BEAT, 0.8)
            if b in (1, 3): add(noise(0.14, 0.45, 22), t0 + b * BEAT, 1.0)
        for k in range(8): add(noise(0.04, 0.12, 80, hp=True), t0 + k * BEAT / 2 + BEAT / 4, 1.0)

for b in range(14):
    bar(b, b * 2.0, 0 if b == 0 else 1 if b == 1 else 2)
# giriş (0–3 sn) daha sade: kick/arpej yok; 1. ölçü yarım ritim
# ── ses efektleri ──
def pop(t, m=84, v=0.25): add(note(m, 0.12, 'square', 0.5, vol=v, a=0.002, d=0.05, s=0.3, slide=0.8), t)
def click(t): add(noise(0.03, 0.5, 120, hp=True), t, 1.0); add(note(96, 0.04, 'square', vol=0.12), t)
def thud(t): add(kick() * 0.9, t); add(noise(0.12, 0.5, 40), t)
def coin(t): add(note(88, 0.07, 'square', vol=0.2, d=0.02, s=0.8), t); add(note(95, 0.25, 'square', vol=0.2, d=0.05, s=0.4), t + 0.07)
def jingle(t, base=72):
    for i, m in enumerate([0, 4, 7, 12, 16]): add(note(base + m, 0.16 if i < 4 else 0.5, 'square', 0.25, vol=0.2, d=0.05, s=0.6), t + i * 0.075)
for t in [0, 3.0, 6.0, 11.0, 14.0, 18.0, 21.0, 24.0]: add(whoosh(0.6), max(0, t - 0.05), 0.5)
add(note(64, 0.5, 'saw', vol=0.15, a=0.01, d=0.2, s=0.3, slide=-0.5), 1.0)   # "hmm?" kancası
for i in range(9): coin(1.55 + i * 0.07)                                     # coinler uçuyor
add(note(60, 0.6, 'tri', vol=0.4, slide=-0.55, s=0.6), 1.9)                  # üzgün trombon
jingle(3.15, 76); add(noise(0.5, 0.25, 6, hp=True), 3.35)
click(7.0)
for k, t in enumerate([7.7, 7.78]): click(t)
click(8.5); click(9.3); jingle(9.45, 72)
for t in np.arange(7.0, 9.4, 0.2): add(noise(0.015, 0.25, 200, hp=True), t)
for i in range(4): pop(11.9 + 0.28 * i, 76 + 3 * i)
for k, t in enumerate(np.arange(13.2, 14.0, 0.06)): add(note(72 + k, 0.04, 'square', vol=0.1), t)
pop(13.15, 60, 0.3)
for t in [14.9, 15.35, 15.8]: add(whoosh(0.3), t - 0.1, 0.4)
for t in [15.45, 15.9, 16.35]: thud(t)
pop(19.1, 79); pop(19.7, 74)
for k, t in enumerate(np.arange(19.9, 20.8, 0.05)): add(note(64 + k * 0.7, 0.05, 'square', vol=0.08), t)
for i in range(5): pop(21.55 + 0.28 * i, 72 + 2 * i)
jingle(24.15, 72); jingle(24.4, 79); add(noise(0.5, 0.25, 6, hp=True), 24.3)
pop(25.7, 79, 0.3)
# final vuruşu
for m in [60, 64, 67, 72]: add(note(m, 1.2, 'square', 0.25, vol=0.1, a=0.01, d=0.3, s=0.4, r=0.5), 27.0)
add(kick(), 27.0)
# ── son işlem ──
st = np.stack([L, R], 1)
st = np.tanh(st * 1.4) * 0.85
fade = np.ones(N); fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR)); fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
st *= fade[:, None]
os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
p = os.path.join(os.path.dirname(__file__), 'out', 'music.wav')
with wave.open(p, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
print('yazıldı', p)
