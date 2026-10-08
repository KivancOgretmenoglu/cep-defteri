"""Cep Defteri Reels: müzik + ses tasarımı.

Kullanım: python3 promo/audio.py <reels>   → promo/out/<reels>.wav
Sahneler ve zamanları reels.json'dan okunur (görüntüyle aynı kaynak). Her efekt sentezlenir
(örnek dosya yok). Üç kanal: müzik, efekt, ortam; efektler hafif yankıya gönderilir, müzik
büyük efektlerin altında kısılır (sidechain), en sonda yumuşak sınırlayıcı.
"""
import json
import os
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
REEL_NAME = sys.argv[1] if len(sys.argv) > 1 else 'tanitim'
REEL = json.load(open(os.path.join(HERE, 'reels.json'), encoding='utf-8'))[REEL_NAME]
SR = 44100
DUR = REEL['end']
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(11)

MUS = np.zeros((N, 2))
SFX = np.zeros((N, 2))
AMB = np.zeros((N, 2))


# ───────── temel yardımcılar ─────────
def tt(d):
    return np.arange(int(d * SR)) / SR


def put(bus, sig, t0, vol=1.0, pan=0.0):
    """Mono ya da stereo sinyali t0 anına ekler; pan −1 (sol) … +1 (sağ)."""
    n = len(bus)
    i = int(round(t0 * SR))
    if i >= n or len(sig) == 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: n - i] * vol
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        bus[i : i + len(sig), 0] += sig * l * 1.414
        bus[i : i + len(sig), 1] += sig * r * 1.414
    else:
        bus[i : i + len(sig)] += sig


def freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def adsr(n, a=0.005, d=0.1, s=0.6, r=0.05):
    e = np.full(n, s, float)
    na, nd, nr = max(1, int(a * SR)), max(1, int(d * SR)), max(1, int(r * SR))
    e[: min(na, n)] = np.linspace(0, 1, na)[: min(na, n)]
    seg = np.linspace(1, s, nd)
    e[na : na + nd] = seg[: max(0, min(nd, n - na))]
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def expd(d, k):
    return np.exp(-tt(d) * k)


def phase(f):
    """f: sabit ya da örnek başına frekans dizisi → faz (0..1)"""
    return np.cumsum(np.broadcast_to(f, f.shape) / SR) % 1.0


def wave_(ph, kind='square', duty=0.5):
    if kind == 'square':
        return np.where(ph < duty, 1.0, -1.0)
    if kind == 'saw':
        return 2 * ph - 1
    if kind == 'tri':
        return 4 * np.abs(ph - 0.5) - 1
    return np.sin(2 * np.pi * ph)


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)


def sweep_bp(x, centers, q=1.5, block=256):
    """Zamanla değişen bant geçiren: centers örnek başına merkez frekans."""
    out = np.zeros_like(x)
    zi = np.zeros((2, 2))
    for i in range(0, len(x), block):
        c = float(np.clip(centers[min(i, len(centers) - 1)], 60, SR / 2 - 2000))
        bw = c / q
        sos = butter(2, [max(30, c - bw / 2), c + bw / 2], 'band', fs=SR, output='sos')
        out[i : i + block], zi = sosfilt(sos, x[i : i + block], zi=zi)
    return out


def sweep_lp(x, cut, block=256):
    out = np.zeros_like(x)
    zi = np.zeros((1, 2))
    for i in range(0, len(x), block):
        c = float(np.clip(cut[min(i, len(cut) - 1)], 80, SR / 2 - 2000))
        sos = butter(2, c, 'low', fs=SR, output='sos')
        out[i : i + block], zi = sosfilt(sos, x[i : i + block], zi=zi)
    return out


def noise(d):
    return rng.uniform(-1, 1, int(d * SR))


def glide(f0, f1, d, curve=1.0):
    k = np.linspace(0, 1, int(d * SR)) ** curve
    return f0 * (f1 / f0) ** k


def varispeed(x, speed):
    pos = np.cumsum(speed)
    pos = pos[pos < len(x) - 1]
    return np.interp(pos, np.arange(len(x)), x)


# ───────── davul ve müzik sesleri ─────────
def kick(v=1.0):
    d = 0.28
    f = 50 + 160 * expd(d, 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * expd(d, 11)
    click = bp(noise(0.012), 2000, 6000) * expd(0.012, 300) * 0.5
    body[: len(click)] += click
    return np.tanh(body * 1.6) * v


def snare(v=1.0):
    d = 0.22
    tone = np.sin(2 * np.pi * phase(glide(240, 180, d))) * expd(d, 30) * 0.5
    nz = bp(noise(d), 1200, 9000) * expd(d, 18)
    return (tone + nz) * v


def clap(v=1.0):
    d = 0.25
    nz = bp(noise(d), 900, 5000)
    env = np.zeros(int(d * SR))
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        env[i:] += np.exp(-np.arange(len(env) - i) / SR * (60 if k < 2 else 16)) * (0.7 if k < 2 else 1)
    return nz * env * v * 0.7


def hat(v=1.0, open_=False):
    d = 0.25 if open_ else 0.05
    return hp(noise(d), 7000, 4) * expd(d, 12 if open_ else 90) * v


def crash(v=1.0, d=1.8):
    x = hp(noise(d), 3500, 2) * expd(d, 2.4)
    x += bp(noise(d), 5000, 12000) * expd(d, 5) * 0.6
    return x * v


def pluck(m, d, kind='square', duty=0.5, cut=3000, v=0.2, vib=0.0):
    t = tt(d)
    f = freq(m) * (1 + vib * np.sin(2 * np.pi * 6 * t) * np.clip(t / 0.15, 0, 1))
    x = wave_(phase(f), kind, duty)
    x = sweep_lp(x, cut * (0.35 + 0.65 * np.exp(-t * 10)) + 300)
    return x * adsr(len(x), 0.003, 0.12, 0.55, 0.04) * v


def pad(ms, d, v=0.08):
    t = tt(d)
    x = sum(wave_(phase(np.full(len(t), freq(m) * det)), 'saw') for m in ms for det in (0.996, 1.004))
    x = lp(x, 1800)
    return x * adsr(len(x), 0.05, 0.3, 0.8, 0.2) * v / len(ms)


def bass(m, d, v=0.45):
    t = tt(d)
    x = wave_(phase(np.full(len(t), freq(m))), 'square', 0.3) * 0.6 + np.sin(2 * np.pi * freq(m) * t)
    x = lp(x, 900)
    return x * adsr(len(x), 0.003, 0.08, 0.75, 0.03) * v


# ───────── ses efektleri ─────────
def reverb_ir(d=1.4):
    n = int(d * SR)
    t = np.arange(n) / SR
    ir = np.stack([lp(rng.normal(0, 1, n), 6000) * np.exp(-t * 4.2) for _ in range(2)], 1)
    ir[0] = 1.0
    return ir / np.abs(ir).sum(0) * 6


def cash_register():
    out = np.zeros(int(0.9 * SR))
    # mekanik "ka": çekmece
    ka = bp(noise(0.06), 500, 2500) * expd(0.06, 60) * 0.9
    ka += np.sin(2 * np.pi * 110 * tt(0.06)) * expd(0.06, 40) * 0.8
    out[: len(ka)] += ka
    # "çing": zil (inharmonik kısmi tonlar)
    t = tt(0.8)
    bell = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(2093, 1, 3.5), (3135, 0.6, 5), (4186, 0.5, 6), (5274, 0.35, 8), (6644, 0.25, 11)])
    i = int(0.07 * SR)
    out[i : i + len(bell)] += bell[: len(out) - i] * 0.5
    # bozuk para şıngırtısı
    for _ in range(9):
        j = int((0.08 + rng.uniform(0, 0.35)) * SR)
        f = rng.uniform(4500, 8500)
        p = np.sin(2 * np.pi * f * tt(0.05)) * expd(0.05, 90) * 0.15
        out[j : j + len(p)] += p[: len(out) - j]
    return out


def paper_tear(d=0.32):
    x = noise(d)
    cen = np.linspace(1800, 5500, len(x))
    x = sweep_bp(x, cen, q=1.2)
    # cızırtı: rastgele yırtılma lifleri
    crack = np.zeros(len(x))
    idx = rng.choice(len(x), 160, replace=False)
    crack[idx] = rng.uniform(0.4, 1, 160)
    crack = np.convolve(crack, np.exp(-np.arange(80) / 12), 'same')
    env = np.sin(np.pi * np.linspace(0, 1, len(x)) ** 0.6) ** 0.7
    return (x * 2.4 * (0.4 + crack)) * env * 0.7


def whoosh(d=0.45, f0=300, f1=3500, v=1.0):
    x = noise(d)
    k = np.linspace(0, 1, len(x))
    cen = f0 * (f1 / f0) ** np.sin(k * np.pi / 2)
    x = sweep_bp(x, cen, q=0.9)
    return x * np.sin(np.pi * k) ** 1.4 * v * 1.6


def stereo_move(x, p0, p1):
    pan = np.linspace(p0, p1, len(x))
    return np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)], 1) * 1.414


def pling(f, v=0.3, d=0.5):
    t = tt(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 14) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 25)
    return x * v


def gulp():
    d = 0.22
    f = np.concatenate([glide(260, 110, 0.12), glide(110, 300, 0.1)])
    x = np.sin(2 * np.pi * phase(f)) * adsr(len(f), 0.01, 0.1, 0.8, 0.05)
    return lp(x, 900) * 0.8


def thunder():
    d = 1.8
    x = lp(noise(d), 180, 4) * 6
    env = expd(d, 1.6) * (0.6 + 0.4 * np.abs(lp(noise(d), 6, 1)) * 8).clip(0, 1.4)
    crackl = bp(noise(0.25), 400, 3000) * expd(0.25, 14) * 0.6
    x = x * env
    x[: len(crackl)] += crackl
    return np.tanh(x * 1.3)


def rain(d):
    x = hp(noise(d), 2500) * 0.12 + bp(noise(d), 600, 2000) * 0.05
    n = int(d * SR)
    for _ in range(int(d * 40)):
        j = rng.integers(0, n - 800)
        f = rng.uniform(2000, 5000)
        x[j : j + 400] += np.sin(2 * np.pi * f * tt(400 / SR)) * expd(400 / SR, 250) * 0.08
    return x


def creak(d=0.42):
    t = tt(d)
    f = 150 + 70 * np.sin(2 * np.pi * 3 * t) + 40 * lp(noise(d), 30) * 10
    x = wave_(phase(f), 'saw')
    # sürtünme: düzensiz darbe zinciri
    x *= 0.5 + 0.5 * (np.sin(2 * np.pi * 34 * t) > 0)
    x = bp(x, 400, 2200)
    return x * np.sin(np.pi * t / d) * 0.6


def flutter(d=0.9):
    t = tt(d)
    x = bp(noise(d), 180, 900) * 2.2
    am = (np.sin(2 * np.pi * 24 * t) > 0.1).astype(float)
    am = lp(am, 120)
    return x * am * np.sin(np.pi * t / d) ** 0.5 * 0.9


def sad_trombone():
    """vah – vah – vah – vaaaah"""
    notes = [(67, 0.2), (66, 0.2), (65, 0.22), (64, 0.75)]
    out = []
    for i, (m, d) in enumerate(notes):
        t = tt(d)
        last = i == len(notes) - 1
        vib = 0.018 * np.sin(2 * np.pi * 6.5 * t) * np.clip((t - 0.15) / 0.2, 0, 1) if last else 0
        drop = (1 - 0.06 * np.clip((t - 0.45) / 0.3, 0, 1)) if last else 1
        f = freq(m - 12) * (1 + vib) * drop * np.ones(len(t))
        x = wave_(phase(f), 'saw') * 0.7 + wave_(phase(f * 1.003), 'square', 0.4) * 0.3
        # "vah": filtre açılıp kapanır
        cut = 350 + 2200 * np.sin(np.pi * np.clip(t / (0.18 if not last else 0.35), 0, 1)) ** 1.5
        if last:
            cut = np.where(t > 0.35, 350 + 1300 * (0.6 + 0.4 * np.sin(2 * np.pi * 6.5 * t)), cut)
        x = sweep_lp(x, cut)
        out.append(x * adsr(len(x), 0.02, 0.05, 0.9, 0.06 if not last else 0.25))
    return np.concatenate(out) * 0.55


def slam_hit(pitch=1.0):
    k = kick(1.0)
    nz = bp(noise(0.12), 1200 * pitch, 5000) * expd(0.12, 30) * 0.9
    k[: len(nz)] += nz
    return k


def riser(d=0.5):
    t = tt(d)
    k = t / d
    nz = sweep_bp(noise(d), 200 * (40 ** k), q=1.0) * k ** 2 * 1.8
    tone = np.sin(2 * np.pi * phase(glide(180, 1400, d, 1.6))) * k ** 2 * 0.35
    roll = np.zeros(len(t))
    tm = 0.0
    while tm < d:  # hızlanan trampet
        i = int(tm * SR)
        s = snare(0.15 + 0.6 * tm / d)
        roll[i : i + len(s)] += s[: len(roll) - i]
        tm += 0.11 - 0.08 * tm / d
    return nz + tone + roll


def boom(v=1.0):
    d = 1.6
    f = glide(85, 32, d, 0.5)
    sub = np.sin(2 * np.pi * phase(f)) * expd(d, 2.2)
    out = np.tanh(sub * 1.5)
    k = kick(1.0)
    out[: len(k)] += k
    c = crash(0.7)
    out[: len(c)] += c[: len(out)]
    return out * v


def bloop(f0=380, f1=1300, d=0.09, v=0.5):
    f = glide(f0, f1, d, 0.6)
    x = np.sin(2 * np.pi * phase(f)) * adsr(len(f), 0.002, 0.05, 0.5, 0.03)
    return x * v


def boing(d=0.45, v=0.4):
    t = tt(d)
    f = 220 * (1 + 0.8 * np.exp(-t * 6) * np.sin(2 * np.pi * 14 * t)) * glide(1, 1.8, d)
    x = np.sin(2 * np.pi * phase(f)) * expd(d, 5)
    return x * v


def popper():
    pop = bp(noise(0.05), 300, 4000) * expd(0.05, 70) * 1.2
    pop = np.concatenate([pop, np.zeros(int(0.9 * SR))])
    pop[: int(0.08 * SR)] += kick(0.6)[: int(0.08 * SR)]
    for _ in range(26):  # ışıltı
        j = int(rng.uniform(0.04, 0.7) * SR)
        f = rng.uniform(3000, 9000)
        s = np.sin(2 * np.pi * f * tt(0.06)) * expd(0.06, 70) * rng.uniform(0.05, 0.14)
        pop[j : j + len(s)] += s[: len(pop) - j]
    shimmer = hp(noise(0.95), 6000) * expd(0.95, 4) * 0.1
    pop[: len(shimmer)] += shimmer
    return pop


def ui_tap(v=0.6):
    x = bp(noise(0.012), 1800, 6000) * expd(0.012, 380) * 1.2
    x = np.concatenate([x, np.zeros(int(0.03 * SR))])
    tone = np.sin(2 * np.pi * 1750 * tt(0.03)) * expd(0.03, 140) * 0.35
    x[: len(tone)] += tone
    return x * v


def key_click(v=0.5):
    x = bp(noise(0.02), 900, 4000) * expd(0.02, 250)
    x += np.sin(2 * np.pi * 420 * tt(0.02)) * expd(0.02, 200) * 0.4
    return x * v


def tick(hi=True, v=0.35):
    x = bp(noise(0.015), 2600 if hi else 1700, 4200 if hi else 2800, 3) * expd(0.015, 400) * 3
    return x * v


def fm_bell(f, d=1.1, v=0.35, ratio=3.5):
    t = tt(d)
    idx = 3.0 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * ratio * t)) * np.exp(-t * 3.2)
    return x * v


def ding_ding():
    a = fm_bell(1046.5, 0.8)
    b = fm_bell(1568, 1.2)
    out = np.zeros(int(1.4 * SR))
    out[: len(a)] += a
    j = int(0.11 * SR)
    out[j : j + len(b)] += b[: len(out) - j]
    return out


def stamp():
    """KA-ÇUNK: mekanik tık + ağır gövde + kâğıt şaplağı"""
    out = np.zeros(int(0.5 * SR))
    ka = bp(noise(0.02), 2500, 7000) * expd(0.02, 250) * 0.7
    out[: len(ka)] += ka
    j = int(0.045 * SR)
    body = np.sin(2 * np.pi * phase(glide(140, 55, 0.25))) * expd(0.25, 16) * 1.2
    slap = bp(noise(0.12), 300, 1800) * expd(0.12, 35) * 1.1
    out[j : j + len(body)] += body
    out[j : j + len(slap)] += slap
    rattle = bp(noise(0.15), 3000, 6000) * expd(0.15, 25) * 0.15
    out[j + 400 : j + 400 + len(rattle)] += rattle
    return np.tanh(out * 1.4)


def slot_roll(d=0.9):
    out = np.zeros(int(d * SR) + SR)
    tm = 0.0
    k = 0
    while tm < d:
        s = tick(k % 2 == 0, 0.5)
        tone = np.sin(2 * np.pi * (900 + 30 * k) * tt(0.025)) * expd(0.025, 120) * 0.12
        i = int(tm * SR)
        out[i : i + len(s)] += s
        out[i : i + len(tone)] += tone
        tm += 0.035 + 0.11 * (tm / d) ** 2  # yavaşlayarak durur
        k += 1
    return out


def voice(f0s, vowels, d, kind='saw', breath=0.15, vib=0.03, v=0.5):
    """Basit formant sesi. f0s: (başlangıç, tepe, bitiş) perde; vowels: [(F1,F2)...] zaman boyunca."""
    t = tt(d)
    k = t / d
    f0 = np.interp(k, np.linspace(0, 1, len(f0s)), f0s) * (1 + vib * np.sin(2 * np.pi * 7 * t))
    src = wave_(phase(f0), kind) + noise(d) * breath
    F1 = np.interp(k, np.linspace(0, 1, len(vowels)), [a for a, _ in vowels])
    F2 = np.interp(k, np.linspace(0, 1, len(vowels)), [b for _, b in vowels])
    x = sweep_bp(src, F1, q=3.0) * 1.0 + sweep_bp(src, F2, q=4.0) * 0.7
    return x * adsr(len(x), 0.03, 0.1, 0.9, 0.08) * v * 2.5


def meow(scale=1.0, d=0.5, v=0.55):
    return voice([620 * scale, 900 * scale, 560 * scale], [(400, 2600), (900, 1500), (700, 1100), (380, 850)], d, v=v)


def mrrp():
    d = 0.24
    x = voice([500, 760, 700], [(450, 1800), (750, 1300)], d, v=0.5)
    return x * (0.55 + 0.45 * np.sin(2 * np.pi * 32 * tt(d)))


def hoot():
    out = np.zeros(int(0.75 * SR))
    for off, d, f in [(0, 0.16, 470), (0.26, 0.4, 440)]:
        t = tt(d)
        x = np.sin(2 * np.pi * phase(glide(f, f * 0.93, d))) + lp(noise(d), 900) * 0.25
        x *= np.sin(np.pi * t / d) ** 1.3
        i = int(off * SR)
        out[i : i + len(x)] += x * 0.55
    return out


def chitter():
    out = np.zeros(int(0.45 * SR))
    for k in range(7):
        d = 0.035
        f = glide(2600 + 120 * k, 3600, d)
        x = wave_(phase(f), 'tri') * np.sin(np.pi * tt(d) / d)
        i = int(k * 0.055 * SR)
        out[i : i + len(x)] += x * 0.4
    return out


def sniff():
    out = np.zeros(int(0.55 * SR))
    for k in range(3):
        d = 0.08
        x = bp(noise(d), 1500, 4500) * np.sin(np.pi * tt(d) / d) ** 2 * 1.4
        out[int(k * 0.11 * SR) : int(k * 0.11 * SR) + len(x)] += x
    sq = voice([900, 1100, 950], [(500, 2200), (450, 2000)], 0.14, kind='tri', v=0.35)
    out[int(0.36 * SR) : int(0.36 * SR) + len(sq)] += sq
    return out


def woof():
    out = np.zeros(int(0.5 * SR))
    for off, sc in [(0, 1.0), (0.2, 1.15)]:
        x = voice([260 * sc, 300 * sc, 150 * sc], [(500, 1100), (650, 1200), (400, 800)], 0.15, breath=0.4, vib=0.0, v=0.6)
        x = np.tanh(x * 2)
        i = int(off * SR)
        out[i : i + len(x)] += x
    return out


def fanfare(t0):
    for i, (m, d) in enumerate([(67, 0.12), (67, 0.12), (67, 0.12), (72, 0.6)]):
        st = t0 + [0, 0.13, 0.26, 0.39][i]
        for interval in (0, 4, 7):
            put(SFX, pluck(m + interval, d, 'square', 0.35, cut=4000, v=0.09, vib=0.01 if i == 3 else 0), st)


# ═════════ SAHNE SESLERİ ═════════
# Her fonksiyon sahnenin başladığı an (t0) ve atlanan süreyle (skip) çağrılır;
# içerdeki zamanlar reel.js'teki sahne içi zamanlarla (lt) aynıdır.
def at(t0, skip):
    return lambda rel: t0 + rel - skip


def groove(length, transpose=0):
    """Ayın 1'i: neşeli funk zemini"""
    buf = np.zeros((int(length * SR) + SR, 2))
    roots = [36, 36, 41]  # C C F (yarım ölçüler)
    for b in range(int(length / BEAT) + 1):
        tb = b * BEAT
        if tb >= length:
            break
        put(buf, kick(0.9), tb)
        if b % 2 == 1:
            put(buf, clap(0.8), tb)
        put(buf, hat(0.25), tb + 0.25)
        root = roots[min(b // 2, 2)] + transpose
        for off, oc in [(0, 0), (0.125, 12), (0.25, 0), (0.375, 12)]:
            put(buf, bass(root + oc, 0.11, 0.42), tb + off)
        for m in [root + 24 + x for x in (4, 7, 10, 14)]:  # vuruş arası akor
            put(buf, pluck(m, 0.12, 'square', 0.3, cut=5000, v=0.05), tb + 0.25, pan=0.3)
    return buf[: int(length * SR)]


def cue_hook(t0, skip=0, o=None):
    T = at(t0, skip)
    g1 = groove(1.5)
    put(MUS, g1, T(0.0))
    # Ayın 15'i: aynı zemin, boğuk ve yavaşlayan ("parti bitiyor")
    g2 = groove(1.0, transpose=-1)
    g2m = np.stack([lp(g2[:, c], 650, 3) for c in range(2)], 1)
    wob = 1 + 0.012 * np.sin(2 * np.pi * 2.5 * np.arange(len(g2m)) / SR)
    spd = np.linspace(1.0, 0.94, len(g2m)) * wob
    put(MUS, np.stack([varispeed(g2m[:, c], spd) for c in range(2)], 1) * 1.3, T(1.5))
    put(AMB, hp(noise(1.0), 3000) * 0.025 * (rng.random(int(SR)) > 0.995) * 10, T(1.5))  # plak cızırtısı
    put(SFX, cash_register(), T(0.0), 0.95, pan=-0.1)
    put(SFX, popper(), T(0.05), 0.5, pan=0.4)
    for k in range(5):  # para hışırtısı
        put(SFX, bp(noise(0.12), 2500, 8000) * expd(0.12, 25) * 0.25, T(0.3 + k * 0.23), pan=rng.uniform(-0.8, 0.8))
    put(SFX, meow(1.15, 0.38), T(0.85), 0.6, pan=0.1)
    put(SFX, paper_tear(), T(1.42), 1.0, pan=-0.2)
    put(SFX, stereo_move(whoosh(0.35, 400, 4000), 0.4, -0.8), T(1.45), 0.6)
    put(SFX, gulp(), T(1.62), 0.9)
    for i, tc in enumerate([1.7, 1.9, 2.1, 2.3]):  # paralar uçup gidiyor
        put(SFX, pling(1568 / (1.12 ** i), 0.32), T(tc), pan=-0.5 if i < 2 else 0.5)
        put(SFX, stereo_move(whoosh(0.25, 800, 5000), 0, -0.9 if i < 2 else 0.9), T(tc + 0.05), 0.35)
    put(SFX, paper_tear(0.3), T(2.42), 1.0, pan=-0.2)
    put(SFX, stereo_move(whoosh(0.35, 400, 4000), 0.4, -0.8), T(2.45), 0.6)
    # Ayın 30'u: gök gürültüsü, yağmur, trombon; 3,45'te bant durması
    bed = np.zeros((int(1.2 * SR), 2))
    put(bed, thunder(), 0.0, 0.9)
    put(bed, np.stack([rain(1.2), rain(1.2)], 1), 0.0, 1.0)
    put(bed, sad_trombone(), 0.08, 0.95)
    put(bed, creak(), 0.27, 0.8, pan=0.3)
    put(bed, stereo_move(flutter(0.85), 0.3, -0.3), 0.33, 0.9)
    cut = int(0.95 * SR)
    tail = np.stack([varispeed(bed[cut:, c], np.linspace(1, 0.05, int(0.16 * SR))) for c in range(2)], 1)
    tail *= np.linspace(1, 0, len(tail))[:, None]
    put(SFX, np.concatenate([bed[:cut], tail]), T(2.5))
    # plak cızırtısı: ilk zemini ileri-geri sür
    src = g1[:, 0] + g1[:, 1]
    d_sc = 0.32
    ts = tt(d_sc)
    pos = int(0.4 * SR) + (np.sin(2 * np.pi * ts / d_sc * 2 - np.pi / 2) + 1) * 0.045 * SR
    scr = np.interp(pos, np.arange(len(src)), src)
    scr = hp(scr, 300) * 1.4 + sweep_bp(noise(d_sc), 1500 + 1200 * np.abs(np.gradient(pos)), q=2) * 0.6
    put(SFX, scr * np.sin(np.pi * ts / d_sc) ** 0.3, T(3.46), 0.9)
    # "Tanıdık geldi mi?" çarpmaları + gerilim yükselişi
    for i, tw in enumerate([3.58, 3.80, 4.02]):
        put(SFX, slam_hit(1 + i * 0.25), T(tw), 0.85)
    put(SFX, riser(0.48), T(4.02), 0.8)


def cue_brand(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, popper(), T(0.12), 0.6, pan=-0.3)
    put(SFX, bloop(400, 1500, 0.1, 0.5), T(0.16))
    put(SFX, popper(), T(0.36), 0.55, pan=0.35)
    for tw, f1 in [(0.55, 3000), (0.85, 4500), (1.22, 3000)]:
        put(SFX, stereo_move(whoosh(0.3, 300, f1), -0.3, 0.3), T(tw - 0.12), 0.45)
    put(SFX, meow(1.0, 0.5), T(0.95), 0.75, pan=0.1)
    put(SFX, boing(0.4, 0.25), T(1.75), pan=0.1)


def cue_quickAdd(t0, skip=0, o=None):
    T = at(t0, skip)
    if not (o or {}).get('poster'):
        put(SFX, stereo_move(whoosh(0.45, 150, 1800), 0, 0), T(0.3), 0.45)
        put(SFX, bloop(300, 900, 0.1, 0.35), T(0.9), pan=-0.6)  # maskot balonu
    put(SFX, ui_tap(), T(1.0))
    put(SFX, key_click(0.7), T(1.6), pan=-0.1)
    put(SFX, key_click(0.7), T(1.7), pan=0.1)
    for k, tk in enumerate(np.arange(1.0, 3.45, 0.25)):  # kronometre
        put(SFX, tick(k % 2 == 0, 0.28), T(tk), pan=0.55)
    put(SFX, ui_tap(), T(2.5), pan=0.25)
    put(SFX, bloop(700, 1400, 0.06, 0.25), T(2.53), pan=0.25)
    put(SFX, ui_tap(0.7), T(3.3))
    put(SFX, ding_ding(), T(3.45), 0.75)
    put(SFX, popper(), T(3.47), 0.6)
    put(SFX, mrrp(), T(3.65), 0.8, pan=-0.5)


def cue_daily(t0, skip=0, o=None):
    T = at(t0, skip)
    if not (o or {}).get('poster'):
        put(SFX, stereo_move(whoosh(0.45, 150, 1800), 0.4, 0.4), T(0.4), 0.45)
    for i in range(4):
        put(SFX, stereo_move(whoosh(0.2, 600, 4000), -0.9, -0.3), T(0.85 + 0.28 * i), 0.35)
        if i:
            put(SFX, bloop(900 / (1.1 ** i), 500 / (1.1 ** i), 0.09, 0.35), T(0.92 + 0.28 * i), pan=-0.5)
    put(SFX, bloop(1100, 1500, 0.07, 0.35), T(0.92), pan=-0.5)  # ilk satır (artı)
    put(SFX, slam_hit(0.8), T(2.15), 0.55)
    put(SFX, slot_roll(0.85), T(2.2), 0.7)
    put(SFX, cash_register(), T(3.05), 0.7)
    put(SFX, meow(1.1, 0.35), T(2.45), 0.45, pan=0.6)


def cue_bills(t0, skip=0, o=None):
    T = at(t0, skip)
    for tc, pn in [(0.9, -0.7), (1.35, 0.7), (1.8, -0.7)]:
        put(SFX, stereo_move(whoosh(0.3, 500, 3500), pn * 1.2, pn * 0.4), T(tc - 0.05), 0.5)
    for ts_ in [1.45, 1.9, 2.35]:
        put(SFX, stamp(), T(ts_), 0.95)
    put(SFX, boing(0.45, 0.3), T(1.4), pan=0.5)
    put(SFX, fm_bell(1318.5, 1.0, 0.25), T(2.7), pan=0.2)


def cue_savings(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, stereo_move(whoosh(0.5, 120, 1500), -0.5, -0.5), T(0.5), 0.4)
    put(SFX, stereo_move(whoosh(0.5, 120, 1500), 0.5, 0.5), T(0.8), 0.4)
    put(SFX, bloop(500, 1200, 0.08, 0.4), T(1.1))
    for k, tc in enumerate(np.arange(1.2, 2.2, 0.083)):  # biriken paralar
        put(SFX, pling(1046.5 * 2 ** (k / 12), 0.13, 0.25), T(tc), pan=0.3 * np.sin(k))
    put(SFX, bloop(400, 1000, 0.08, 0.35), T(1.7))
    t_b = tt(0.9)
    sw = np.sin(2 * np.pi * phase(glide(300, 1200, 0.9, 0.7))) * (0.6 + 0.4 * np.sin(2 * np.pi * 16 * t_b)) * np.sin(np.pi * t_b / 0.9) ** 0.5 * 0.12
    put(SFX, sw, T(1.9))
    put(SFX, fm_bell(2093, 1.0, 0.25), T(2.8))


def cue_mascots(t0, skip=0, o=None):
    T = at(t0, skip)
    voices = [(meow(1.0, 0.45), -0.6), (hoot(), 0.0), (chitter(), 0.6), (sniff(), -0.3), (woof(), 0.3)]
    for i, (vc, pn) in enumerate(voices):
        tc = 0.55 + 0.28 * i
        put(SFX, bloop(350 + 60 * i, 1100 + 120 * i, 0.08, 0.35), T(tc), pan=pn)
        put(SFX, vc, T(tc + 0.12), 0.75, pan=pn)


def cue_outro(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, popper(), T(0.12), 0.7, pan=-0.5)
    put(SFX, popper(), T(0.2), 0.7, pan=0.5)
    put(SFX, bloop(400, 1500, 0.1, 0.5), T(0.16))
    fanfare(T(0.35))
    put(SFX, stereo_move(whoosh(0.3, 300, 3000), -0.3, 0.3), T(0.8), 0.4)
    put(SFX, bloop(350, 1300, 0.12, 0.55), T(1.7))
    put(SFX, fm_bell(2637, 1.2, 0.2), T(1.75), pan=0.3)
    put(SFX, meow(1.2, 0.5), T(2.25), 0.8)


CUES = {k[4:]: v for k, v in globals().items() if k.startswith('cue_')}

# ═════════ ANA MÜZİK ═════════
CHORDS = [(36, [60, 64, 67, 71]), (43, [59, 62, 67, 74]), (45, [60, 64, 69, 72]), (41, [60, 65, 69, 72])]
MEL_A = [
    [(0, 72, .5), (.5, 76, .5), (1, 79, .75), (2, 76, .5), (2.5, 79, .5), (3, 84, .5), (3.5, 83, .5)],
    [(0, 81, .5), (.5, 79, 1), (2, 74, .5), (2.5, 76, .5), (3, 79, 1)],
    [(0, 76, .5), (.5, 79, .5), (1, 81, .75), (2, 84, .5), (2.5, 83, .5), (3, 81, .5), (3.5, 79, .5)],
    [(0, 77, .5), (.5, 76, .5), (1, 77, .5), (1.5, 79, 1.5), (3.5, 72, .5)],
]
MEL_B = [  # sakin bölüm: seyrek
    [(0, 79, 1), (1.5, 76, .5), (2, 79, 1.5)],
    [(0, 78, 1), (1.5, 74, .5), (2, 79, 1.5)],
    [(0, 76, 1), (1.5, 72, .5), (2, 76, 1.5)],
    [(0, 77, 1), (1.5, 81, .5), (2, 79, 1.5)],
]
duck = np.ones(N)  # kick sidechain pompası


def music_bar(bi, t0, mel=None, drums=True, fill=False, length=4):
    root, ch = CHORDS[bi % 4]
    beats = length
    put(MUS, pad(ch, beats * BEAT), t0, 1.0)
    for k in range(beats * 2):
        oc = 12 if k % 4 == 3 else 0
        put(MUS, bass(root + oc, BEAT * 0.45), t0 + k * BEAT / 2, 0.9)
    for k in range(beats * 4):  # arpej (stereo)
        m = ch[[0, 1, 2, 3, 2, 1, 2, 3][k % 8]] + 12
        put(MUS, pluck(m, 0.1, 'square', 0.25, cut=4500, v=0.035), t0 + k * BEAT / 4, pan=-0.45 if k % 2 else 0.45)
    if mel:  # melodi + yankı (3/16 gecikme, karşı kanal)
        for b, m, d in mel[bi % 4]:
            if b >= beats:
                continue
            n = pluck(m, d * BEAT * 0.95, 'square', 0.5, cut=5000, v=0.085, vib=0.006)
            put(MUS, n, t0 + b * BEAT)
            put(MUS, lp(n, 2500), t0 + b * BEAT + 0.375, 0.35, pan=0.6)
    if drums:
        for b in range(beats):
            tb = t0 + b * BEAT
            put(MUS, kick(0.95), tb)
            i = int(tb * SR)
            if 0 <= i < N:
                dl = min(int(0.22 * SR), N - i)
                duck[i : i + dl] = np.minimum(duck[i : i + dl], 1 - 0.55 * np.exp(-np.arange(dl) / SR * 14))
            if b % 2 == 1:
                put(MUS, snare(0.55), tb)
                put(MUS, clap(0.45), tb)
            put(MUS, hat(0.22), tb + 0.25, pan=0.3)
            put(MUS, hat(0.12), tb + 0.125, pan=-0.3)
            put(MUS, hat(0.12), tb + 0.375, pan=-0.3)
        if fill:  # son vuruşta trampet geçişi
            for k in range(6):
                put(MUS, snare(0.25 + 0.08 * k), t0 + (beats - 1) * BEAT + k * BEAT / 6, pan=(k - 3) * 0.15)


def music_main(start, end, fill_before=()):
    """start'tan bitişe ölçü ölçü; son vuruş (end − 1 sn) akor + zil ile kapanır."""
    hit = end - 1.0
    t, bi = start, 0
    while t < hit - 1e-6:
        beats = int(round(min(4, (hit - t) / BEAT)))
        if beats <= 0:
            break
        fill = any(abs((t + beats * BEAT) - f) < 1e-3 for f in fill_before)
        music_bar(bi, t, MEL_A if (bi // 2) % 2 == 0 else MEL_B, fill=fill, length=beats)
        t += beats * BEAT
        bi += 1
    for m in [48, 60, 64, 67, 72, 76]:
        put(MUS, pluck(m, 1.0, 'square', 0.4, cut=3500, v=0.06), hit)
    put(MUS, kick(1.0), hit)
    put(MUS, crash(0.5), hit, pan=0.2)


# ═════════ REELS'İ KUR ═════════
scenes = REEL['scenes']
prev = None
music_start = None
outro_starts = []
for sc in scenes:
    typ, t0 = sc[0], sc[1]
    opts = sc[2] if len(sc) > 2 else {}
    skip = opts.get('skip', 0)
    if typ != 'hook' and music_start is None:
        music_start = t0
    if opts.get('flash'):
        if prev is not None and prev != 'hook':
            put(SFX, riser(0.5), t0 - 0.5, 0.5)  # kancanın kendi yükselişi var
        put(SFX, boom(1.0), t0, 0.95)
    elif prev is not None:
        put(SFX, stereo_move(whoosh(0.55, 200, 2500), -0.6, 0.6), t0 - 0.05, 0.6)  # sahne geçişi
    if typ == 'outro':
        outro_starts.append(t0)
    CUES[typ](t0, skip, opts)
    prev = typ
if music_start is not None:
    # müzik ölçüleri her flaşlı sahnede yeniden hizalanır (vuruş tam patlamaya düşsün)
    flashes = [sc[1] for sc in scenes if len(sc) > 2 and sc[2].get('flash') and sc[1] > music_start]
    seg_starts = [music_start] + flashes
    seg_ends = flashes + [DUR]
    for i, (a, b) in enumerate(zip(seg_starts, seg_ends)):
        if i < len(seg_starts) - 1:
            # ara bölüm: bitişte kapanış vuruşu yok, sonraki bölüme trampet geçişiyle bağlanır
            t, bi = a, 0
            while t < b - 1e-6:
                beats = int(round(min(4, (b - t) / BEAT)))
                if beats <= 0:
                    break
                music_bar(bi, t, MEL_A if (bi // 2) % 2 == 0 else MEL_B, fill=abs(t + beats * BEAT - b) < 1e-3, length=beats)
                t += beats * BEAT
                bi += 1
        else:
            music_main(a, b)
    for c in range(2):
        MUS[:, c] *= np.where(np.arange(N) / SR >= music_start, duck, 1.0)

# ═════════ MİKS ═════════
ir = reverb_ir()
wet = np.stack([fftconvolve(SFX[:, c], ir[:, c])[:N] for c in range(2)], 1)
sfx = SFX + wet * 0.18
env = np.abs(sfx).max(1)
env = lp(env, 8, 1).clip(0, None)
gain = 1 - 0.45 * np.clip(env / 0.35, 0, 1)  # efekt geldiğinde müzik kısılır
mus = MUS * gain[:, None]
mus_wet = np.stack([fftconvolve(mus[:, c], ir[:, c] * 0.5)[:N] for c in range(2)], 1)
mix = mus * 0.55 + mus_wet * 0.05 + sfx * 0.9 + AMB
mix = np.stack([hp(mix[:, c], 28) for c in range(2)], 1)
peak = np.abs(mix).max()
mix = np.tanh(mix / peak * 1.8) / np.tanh(1.8) * 0.93
fade = np.ones(N)
fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR))
mix *= fade[:, None]

out = os.path.join(HERE, 'out', f'{REEL_NAME}.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('yazıldı', out)
