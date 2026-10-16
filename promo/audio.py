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



# ───────── hikâye efektleri ─────────
def notif_ding():
    """telefon bildirimi: kısa üçlü tını"""
    out = np.zeros(int(0.6 * SR))
    for i, f in enumerate([1318.5, 1760, 2093]):
        b = fm_bell(f, 0.35, 0.22, ratio=2.0)
        j = int(i * 0.07 * SR)
        out[j : j + len(b)] += b[: len(out) - j]
    return out


def crunch():
    d = 0.16
    x = bp(noise(d), 1500, 7000) * 1.6
    cr = np.zeros(int(d * SR))
    idx = rng.choice(len(cr), 70, replace=False)
    cr[idx] = rng.uniform(0.3, 1, 70)
    cr = np.convolve(cr, np.exp(-np.arange(60) / 8), 'same')
    return x * (0.2 + cr) * expd(d, 14) * 0.9


def sting():
    """dramatik "dan dan daaan"""
    out = np.zeros(int(1.6 * SR))
    for off, m, d in [(0, 43, 0.18), (0.22, 41, 0.18), (0.44, 40, 1.0)]:
        t = tt(d)
        x = sum(wave_(phase(np.full(len(t), freq(m + iv) * det)), 'saw') for iv in (0, 12) for det in (0.995, 1.005))
        x = sweep_lp(x, 600 + 1600 * np.exp(-t * 3)) * adsr(len(t), 0.01, 0.1, 0.8, 0.2 if d > 0.5 else 0.05) * 0.35
        i = int(off * SR)
        out[i : i + len(x)] += x
    k = kick(1.0)
    out[: len(k)] += k
    j = int(0.44 * SR)
    out[j : j + len(k)] += k
    return np.tanh(out * 1.2)


def alarm(d=0.7):
    t = tt(d)
    f = np.where((t * 8) % 1 < 0.5, 1100, 820)
    x = wave_(phase(f), 'square', 0.5) * 0.3
    return lp(x, 4000) * adsr(len(x), 0.005, 0.05, 0.9, 0.05)


def pew():
    d = 0.22
    x = wave_(phase(glide(2400, 180, d, 0.5)), 'square', 0.3)
    return lp(x, 5000) * expd(d, 9) * 0.4


def spy_riff(t0, bus):
    """dedektif girişi: alçak, dolanan bas"""
    for i, (off, m) in enumerate([(0, 40), (0.15, 43), (0.3, 45), (0.45, 46), (0.6, 45), (0.75, 43)]):
        put(bus, pluck(m, 0.16, 'saw', cut=1400, v=0.22), t0 + off)


def whistle(t0, bus, notes):
    """ıslık: titreşimli saf ton ezgisi"""
    for off, m, d in notes:
        t = tt(d)
        f = freq(m) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t)) * glide(0.97, 1.0, d, 0.2)
        x = np.sin(2 * np.pi * phase(f)) + lp(noise(d), 3000) * 0.05
        put(bus, x * adsr(len(x), 0.03, 0.05, 0.85, 0.06) * 0.22, t0 + off)


def crickets(d):
    out = np.zeros(int(d * SR))
    tm = 0.0
    while tm < d - 0.2:
        for k in range(3):
            c = np.sin(2 * np.pi * 4600 * tt(0.025)) * np.sin(np.pi * np.linspace(0, 1, int(0.025 * SR))) * 0.06
            i = int((tm + k * 0.04) * SR)
            out[i : i + len(c)] += c[: len(out) - i]
        tm += 0.5
    return out


def wind(d):
    t = tt(d)
    return sweep_bp(noise(d), 500 + 300 * np.sin(2 * np.pi * 0.8 * t), q=3) * np.sin(np.pi * t / d) * 0.5


def growl_meow():
    x = voice([520, 640, 420], [(500, 2000), (850, 1300), (600, 900)], 0.45, v=0.6)
    return x * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * tt(0.45)))


def clink():
    b = fm_bell(3135, 0.35, 0.18, ratio=2.7)
    n = bp(noise(0.05), 3000, 9000) * expd(0.05, 60) * 0.2
    b[: len(n)] += n
    return b


def snore(d=0.6):
    t = tt(d)
    x = lp(noise(d), 500) * 3 * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * t)) * np.sin(np.pi * t / d) ** 2
    return x * 0.35


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


def cue_app(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    put(SFX, stereo_move(whoosh(0.45, 150, 1800), 0, 0), T(0.3), 0.45)
    for i, c in enumerate(o.get('chips', [])):
        fr = 1 if c.get('from', -300) > 0 else -1
        put(SFX, stereo_move(whoosh(0.22, 600, 4000), fr * 0.9, fr * 0.3), T(c['t'] - 0.05), 0.35)
        put(SFX, bloop(700 + 120 * i, 1300 + 150 * i, 0.07, 0.35), T(c['t'] + 0.05), pan=fr * 0.4)
    for tp in o.get('taps', []):
        put(SFX, ui_tap(), T(tp['t']))
    m = o.get('mascot')
    if m:
        mt = m.get('t', 1.4)
        put(SFX, boing(0.35, 0.22), T(mt), pan=0.5)
        voice_ = {'karamel': woof(), 'bilge': hoot()}.get(m.get('who'), meow(1.1, 0.4))
        put(SFX, voice_, T(mt + 0.45), 0.55, pan=0.5)


def cue_bursStory(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, snore(0.5), T(0.0), 0.8)
    put(SFX, stereo_move(whoosh(0.3, 300, 2500), 0, 0), T(0.25), 0.35)
    put(SFX, notif_ding(), T(0.32), 0.85)
    put(SFX, boing(0.35, 0.35), T(0.55))
    put(SFX, meow(1.35, 0.3), T(0.62), 0.6)
    put(SFX, popper(), T(1.1), 0.55)
    for i, t in enumerate([1.5, 1.9, 2.3, 2.7]):
        put(SFX, cash_register(), T(t), 0.6, pan=-0.4 if i % 2 == 0 else 0.4)
        put(SFX, stereo_move(whoosh(0.22, 600, 4000), -0.9 if i % 2 == 0 else 0.9, 0), T(t - 0.05), 0.3)
    put(SFX, sad_trombone(), T(3.38), 0.9)
    put(SFX, np.stack([rain(1.7), rain(1.7)], 1), T(3.3), 0.6)


def cue_tostStory(t0, skip=0, o=None):
    T = at(t0, skip)
    for i, t in enumerate([0.4, 0.8, 1.2]):
        put(SFX, stereo_move(whoosh(0.16, 900, 5000), 0.6 if i % 2 else -0.6, 0), T(t), 0.3)
    put(SFX, fm_bell(1568, 0.6, 0.25), T(1.6))
    put(SFX, stereo_move(whoosh(0.3, 300, 2500), 0.3, -0.6), T(1.62), 0.4)
    for t in [1.95, 2.15, 2.35]:
        put(SFX, crunch(), T(t), 0.9, pan=-0.4)
    put(SFX, voice([480, 520, 470], [(400, 900), (420, 850)], 0.35, kind='tri', v=0.4), T(2.42), 0.6, pan=-0.4)  # "mmm"
    put(SFX, stereo_move(whoosh(0.4, 200, 3000), -0.5, 0.5), T(2.55), 0.5)
    put(SFX, slot_roll(0.7), T(2.8), 0.55)
    put(SFX, sting(), T(4.0), 0.9)


def cue_subsStory(t0, skip=0, o=None):
    T = at(t0, skip)
    for i, t in enumerate([0.15, 0.35, 0.55]):
        put(SFX, bloop(500 + 150 * i, 1400 + 200 * i, 0.08, 0.4), T(t), pan=(i - 1) * 0.6)
    put(SFX, alarm(0.6), T(1.4), 0.7)
    put(SFX, slam_hit(0.9), T(1.4), 0.6)
    put(SFX, stereo_move(whoosh(0.4, 200, 2000), 0.9, 0.4), T(1.85), 0.45)
    spy_riff(T(1.9), SFX)
    for t in [2.4, 2.8, 3.2]:
        put(SFX, pew(), T(t - 0.1), 0.8, pan=0.5)
        put(SFX, stamp(), T(t), 0.8)
    put(SFX, ding_ding(), T(3.8), 0.7)
    put(SFX, cash_register(), T(3.85), 0.5)
    put(SFX, popper(), T(3.9), 0.5)


def cue_debtStory(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, woof(), T(0.25), 0.6, pan=-0.5)
    put(SFX, meow(1.1, 0.4), T(1.2), 0.65, pan=0.5)
    for i in range(3):
        put(SFX, pling(1568 * 1.06 ** i, 0.25, 0.35), T(1.4 + i * 0.15), pan=0.4 - i * 0.4)
    put(SFX, woof(), T(1.75), 0.5, pan=-0.5)
    for t in [2.1, 2.55, 3.0, 3.45]:
        put(SFX, paper_tear(0.22), T(t), 0.6)
    whistle(T(2.2), SFX, [(0, 79, 0.2), (0.22, 84, 0.2), (0.44, 81, 0.35), (0.85, 79, 0.2), (1.07, 76, 0.2), (1.29, 77, 0.45)])
    put(SFX, crickets(1.6), T(2.4), 0.8)
    put(SFX, np.stack([wind(1.0), wind(1.0)], 1), T(3.4), 0.5)
    put(SFX, growl_meow(), T(4.05), 0.7, pan=0.5)
    put(SFX, voice([300, 380, 260], [(500, 1100), (650, 1200)], 0.3, breath=0.3, v=0.55), T(4.6), 0.7, pan=-0.5)  # "hm?"
    put(SFX, boing(0.4, 0.25), T(4.75), pan=-0.5)


def cue_examStory(t0, skip=0, o=None):
    T = at(t0, skip)
    for k, tk in enumerate(np.arange(0.3, 2.95, 0.25)):
        put(SFX, tick(k % 2 == 0, 0.3), T(tk), pan=0.4)
    for i in range(5):
        put(SFX, clink(), T(0.5 + i * 0.45), 0.6, pan=-0.5 if i % 2 == 0 else 0.5)
    put(SFX, snore(0.7), T(2.2), 0.6)
    put(SFX, notif_ding(), T(3.0), 0.85)
    put(SFX, boing(0.35, 0.35), T(3.05))
    put(SFX, growl_meow(), T(3.55), 0.8)
    put(SFX, stereo_move(whoosh(0.35, 3000, 300), 0, 0), T(3.85), 0.5)
    put(SFX, bloop(900, 300, 0.15, 0.4), T(4.3))




# ───────── organik sahneler (native.js) ─────────
def cue_pov(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    if o.get('rise'):
        put(SFX, stereo_move(whoosh(0.4, 150, 1800), 0, 0), T(0.0), 0.4)
    for i, st in enumerate(o.get('steps', [])):
        if i and st.get('t', 0) >= 0:
            put(SFX, stereo_move(whoosh(0.28, 500, 4000), 0.8, -0.8), T(st['t'] - 0.03), 0.45)
        for j, (ts, _) in enumerate(st.get('seq', [])):
            if j == 1:  # tutar yazılıyor
                put(SFX, key_click(0.7), T(ts - 0.12), pan=-0.1)
                put(SFX, key_click(0.7), T(ts - 0.04), pan=0.1)
    for tp in o.get('taps', []):
        put(SFX, ui_tap(), T(tp['t']))
    if o.get('stopwatch'):
        a, b = o['stopwatch'][0], o['stopwatch'][1]
        for k, tk in enumerate(np.arange(a, b, 0.25)):
            put(SFX, tick(k % 2 == 0, 0.26), T(tk), pan=0.5)
        put(SFX, ding_ding(), T(b), 0.7)
        put(SFX, popper(), T(b + 0.02), 0.45)
    for i, c in enumerate(o.get('chips', [])):
        put(SFX, bloop(700 + 100 * i, 1400, 0.07, 0.35), T(c['t'] + 0.05), pan=-0.4)
    m = o.get('mascot')
    if m:
        if m.get('enter') is not None:
            put(SFX, boing(0.35, 0.22), T(m['enter']), pan=0.5)
        if m.get('cheer') is not None:
            put(SFX, meow(1.15, 0.35), T(m['cheer'] + 0.1), 0.5, pan=-0.5 if m.get('x', 230) < 540 else 0.5)
    c = o.get('confetti')
    if c and c['t'] >= 0:
        put(SFX, popper(), T(c['t']), 0.5)


def cue_chat(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    for t, who, _ in o.get('messages', []):
        if t < 0:
            continue
        if who == 'me':
            put(SFX, bloop(900, 1500, 0.06, 0.38), T(t), pan=0.4)
        else:
            put(SFX, bloop(520, 820, 0.07, 0.34), T(t), pan=-0.3)
    for h in o.get('hits', []):  # büyük cevap mesajı
        put(SFX, slam_hit(1.0), T(h), 0.5)
        put(SFX, ding_ding(), T(h + 0.05), 0.7)
    if o.get('typing'):
        a, b = o['typing'][0], o['typing'][1]
        for tk in np.arange(a + 0.05, b - 0.05, 0.11):
            put(SFX, key_click(0.35), T(tk), pan=0.3)


def cue_talk(t0, skip=0, o=None):
    T = at(t0, skip)
    for a, b in (o or {}).get('shake', []):
        put(SFX, stereo_move(whoosh(0.18, 800, 3000), -0.5, 0.5), T(a), 0.3)


def cue_lineup(t0, skip=0, o=None):
    T = at(t0, skip)
    voices = [(hoot(), -0.7), (chitter(), -0.4), (meow(1.0, 0.4), -0.1), (squeak(), 0.1), (sniff(), 0.4), (woof(), 0.7)]
    for i, (vc, pn) in enumerate(voices):
        tc = 0.1 + i * 0.14
        put(SFX, bloop(350 + 60 * i, 1100 + 120 * i, 0.08, 0.3), T(tc), pan=pn)
        put(SFX, vc, T(tc + 0.15), 0.55, pan=pn)


def cue_end(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, fm_bell(1568, 1.0, 0.22), T(0.5), pan=0.2)
    put(SFX, meow(1.15, 0.45), T(0.25), 0.6)
    if (o or {}).get('friend') == 'karamel':
        put(SFX, voice([300, 340, 280], [(500, 1100), (600, 1150)], 0.25, breath=0.3, v=0.45), T(0.6), 0.5, pan=-0.5)


# Fıstık'ın "konuşması": altyazıdaki her sözcük çıkarken ünlülerine göre minik heceler
VOWELS = {'a': (800, 1250), 'e': (520, 1900), 'ı': (420, 1500), 'i': (320, 2300), 'o': (520, 900), 'ö': (460, 1550), 'u': (340, 850), 'ü': (330, 1750)}


def cap_step(a, b, n):
    return min(0.2, ((b - a) * 0.72) / n)


def babble(captions, base=640):
    for cap in captions:
        a, b, text = cap[0], cap[1], cap[2]
        words = text.split(' ')
        step = cap_step(a, b, len(words))
        for i, w in enumerate(words):
            vs = [c for c in w.lower() if c in VOWELS][:3] or ['a']
            for j, v in enumerate(vs):
                d = min(0.075, step / len(vs) * 0.9)
                f = base * rng.uniform(0.88, 1.22) * (1.08 if w.endswith('?') and j == len(vs) - 1 else 1)
                F1, F2 = VOWELS[v]
                x = voice([f, f * 1.08, f * 0.95], [(F1, F2), (F1, F2)], d, kind='square', breath=0.08, vib=0.0, v=0.32)
                put(SFX, x, a + i * step + j * d, 1.0, pan=0.0)


def cue_boxes(boxes):
    for bx in boxes:
        if bx[0] > 0:
            put(SFX, bloop(620, 980, 0.05, 0.22), bx[0])

# ───────── yaratıcı hook sesleri ─────────
def squeak():
    """tavşan: iki minik cıyak"""
    out = np.zeros(int(0.35 * SR))
    for off, f0 in ((0, 1500), (0.13, 1750)):
        x = np.sin(2 * np.pi * phase(glide(f0, f0 * 1.35, 0.08))) * np.sin(np.pi * np.linspace(0, 1, int(0.08 * SR))) * 0.35
        i = int(off * SR)
        out[i : i + len(x)] += x
    return out


def scare_sting():
    """korku filmi ani vuruşu: uyumsuz yaylı küme + gürültü + alt vuruş"""
    d = 1.4
    t = tt(d)
    x = sum(wave_(phase(np.full(len(t), f)), 'saw') for f in (311, 330, 349, 466, 494, 523, 698, 740))
    x = sweep_lp(x, 6000 * np.exp(-t * 2) + 600) * np.exp(-t * 2.2) * 0.16
    x += bp(noise(d), 800, 7000) * np.exp(-t * 6) * 0.7
    k = kick(1.0)
    x[: len(k)] += k * 1.2
    return np.tanh(x * 1.3)


def inhale(d=0.3):
    t = tt(d)
    return sweep_bp(noise(d), 600 + 2500 * (t / d), q=2) * (t / d) ** 2 * 0.6


def woodblock(hi=True):
    f = 1250 if hi else 900
    return (np.sin(2 * np.pi * f * tt(0.06)) + 0.4 * np.sin(2 * np.pi * f * 2.7 * tt(0.06))) * expd(0.06, 60) * 0.45


def drumroll(d):
    out = np.zeros(int(d * SR) + SR)
    tm = 0.0
    while tm < d:
        s_ = lp(snare(0.12 + 0.5 * tm / d), 6000)[: int(0.08 * SR)]
        i = int(tm * SR)
        out[i : i + len(s_)] += s_
        tm += 0.045
    return out[: int(d * SR)]


def applause(d=1.6):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 140)):
        c = bp(noise(0.03), 900, 5000) * expd(0.03, 120) * rng.uniform(0.1, 0.35)
        i = rng.integers(0, len(out) - len(c))
        out[i : i + len(c)] += c
    env = np.minimum(1, np.linspace(0, 6, len(out))) * np.linspace(1, 0.2, len(out))
    return out * env


def slide_whistle(f0=1700, f1=260, d=0.6):
    x = np.sin(2 * np.pi * phase(glide(f0, f1, d, 0.7)) + 0.3 * np.sin(2 * np.pi * 6 * tt(d)))
    return x * adsr(int(d * SR), 0.02, 0.1, 0.8, 0.1) * 0.25


def cue_dread(t0, skip=0, o=None):
    T = at(t0, skip)
    S = (o or {}).get('scare', 3.3)
    for t in (1.0, 2.0):
        put(SFX, np.sin(2 * np.pi * phase(glide(90, 38, 0.6))) * expd(0.6, 4) * 0.9, T(t))
    put(SFX, inhale(0.32), T(S - 0.33), 0.8)
    put(SFX, scare_sting(), T(S), 0.95)
    put(SFX, voice([900, 1250, 600], [(800, 1300), (700, 1200), (500, 1000)], 0.6, breath=0.25, v=0.6), T(S + 0.05), 0.55)  # "aaaa!"
    put(SFX, slide_whistle(900, 200, 0.7), T(S + 0.55), 0.6)


def cue_coffeeQuiz(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    R_ = o.get('reveal', 3.0)
    for k, tk in enumerate(np.arange(0.0, R_ - 0.9, 0.5)):
        put(SFX, woodblock(k % 2 == 0), T(tk), pan=0.4)
    put(SFX, drumroll(1.0), T(R_ - 1.0), 0.7)
    put(SFX, crash(0.8), T(R_))
    put(SFX, popper(), T(R_ + 0.02), 0.6)
    put(SFX, slot_roll(0.75), T(R_ + 0.02), 0.5)
    put(SFX, ding_ding(), T(R_ + 0.8), 0.7)
    put(SFX, applause(1.8), T(R_ + 0.1), 0.8)
    put(SFX, slide_whistle(), T(R_ + 0.45), 0.9)
    put(SFX, kick(0.8), T(R_ + 1.0), 0.6)  # yere düşüş
    put(SFX, boing(0.4, 0.3), T(o.get('up', 5.2)), pan=0.5)
    put(SFX, meow(1.15, 0.4), T(o.get('up', 5.2) + 0.2), 0.6, pan=0.5)


def mascot_voice(k):
    return {'fistik': meow(1.0, 0.4), 'bilge': hoot(), 'ceviz': chitter(), 'diken': sniff(), 'karamel': woof(), 'pamuk': squeak()}[k]


def cue_persona(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    C0, D = o.get('c0', 1.8), o.get('d', 1.55)
    for i in range(6):
        put(SFX, bloop(500 + 40 * i, 900 + 60 * i, 0.06, 0.18), T(0.05 + i * 0.05), pan=(i % 3 - 1) * 0.6)
    for i, k in enumerate(['fistik', 'bilge', 'ceviz', 'diken', 'karamel', 'pamuk']):
        tc = C0 + i * D
        put(SFX, stereo_move(whoosh(0.25, 500, 4000), 0.8, -0.3), T(tc - 0.04), 0.4)
        put(SFX, fm_bell(1046.5 * 2 ** (i / 12 * 2), 0.6, 0.18), T(tc + 0.18))
        put(SFX, mascot_voice(k), T(tc + 0.35), 0.7)

# ───────── bilgi reelsleri ─────────
def cue_cards(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    RS, RG, CD = o.get('rowStart', 0.9), o.get('rowGap', 0.45), o.get('countDur', 0.7)
    for i, it in enumerate(o.get('items', [])):
        t = it['t']
        put(SFX, stereo_move(whoosh(0.3, 400, 3500), 0.9, -0.2), T(t - 0.02), 0.45)
        put(SFX, bloop(500, 900, 0.06, 0.2), T(t + 0.25))
        rows = it.get('ex', [])
        for j in range(len(rows)):
            put(SFX, tick(True, 0.25), T(t + RS + j * RG))
        if it.get('big'):
            a = t + RS + len(rows) * RG
            if it.get('bigTo') is not None:
                put(SFX, slot_roll(CD * 0.85), T(a), 0.45)
            put(SFX, fm_bell(1318.5 * 2 ** (i / 12 * 2), 0.8, 0.22), T(a + CD))
            if o.get('fast'):
                put(SFX, slam_hit(1.2), T(a + CD), 0.45)
            if o.get('decor'):  # kıvılcımlar
                for j in range(4):
                    put(SFX, pling(2093 * 2 ** (j / 12 * 3), 0.1, 0.12), T(a + CD + 0.04 + j * 0.05), pan=(j - 1.5) * 0.4)
        m = it.get('mascot')
        if m and o.get('decor') and m.get('say'):  # tepki balonu
            sa = m.get('sayAt', (t + RS + len(rows) * RG + CD + 0.1) if it.get('big') else (t + RS + len(rows) * RG + 0.2))
            if 'sayAt' in m:
                sa = t + m['sayAt']
            put(SFX, bloop(700, 1300, 0.06, 0.25), T(sa), pan=0.3)
        if m:
            put(SFX, boing(0.3, 0.18), T(t + 0.35), pan=0.5)
            put(SFX, mascot_voice(m.get('who', 'fistik')), T(t + 0.5), 0.45, pan=0.5)


def cue_cartHook(t0, skip=0, o=None):
    T = at(t0, skip)
    st = (o or {}).get('stop')
    if st is not None:  # pati yaklaşır → plak cızırtısı + "DUR!" damgası
        put(SFX, stereo_move(whoosh(st, 300, 1500), 0.5, 0), T(0.0), 0.3)
        d_sc = 0.25
        put(SFX, sweep_bp(noise(d_sc), np.linspace(2500, 600, int(d_sc * SR)), q=2) * 1.6, T(st - 0.1), 0.7)
        put(SFX, stamp(), T(st), 1.0)
        put(SFX, slam_hit(0.7), T(st), 0.7)
        put(SFX, meow(1.3, 0.3), T(st + 0.15), 0.6)
        return
    for k in range(4):  # tereddüt: düğmeye uzanıp geri çekilme
        put(SFX, ui_tap(0.35), T(0.15 + k * 1.96), pan=0.2)
    put(SFX, gulp(), T(1.1), 0.6)


def cue_drainHook(t0, skip=0, o=None):
    T = at(t0, skip)
    END = (o or {}).get('end', 1.5)
    for k, tc in enumerate(np.arange(0.15, END, 0.09)):  # paralar uçuşur, perde iner
        put(SFX, pling(2093 / (1.04 ** k), 0.12, 0.2), T(tc), pan=0.3 * np.sin(k))
    put(SFX, sad_trombone()[: int(0.9 * SR)], T(END), 0.7)
    put(SFX, slam_hit(0.8), T(END), 0.5)


def cue_pieHook(t0, skip=0, o=None):
    T = at(t0, skip)
    for i in range(3):
        put(SFX, bloop(500 + 200 * i, 1100 + 200 * i, 0.07, 0.3), T(0.1 + i * 0.18), pan=(i - 1) * 0.6)


def cue_mailHook(t0, skip=0, o=None):
    T = at(t0, skip)
    put(SFX, notif_ding(), T(0.05), 0.7)
    put(SFX, popper(), T(0.3), 0.4)

def cue_tagHook(t0, skip=0, o=None):
    T = at(t0, skip)
    fl = (o or {}).get('flip', 0.6)
    for k in range(3):  # gözler etiketler arasında gidip gelir
        put(SFX, ui_tap(0.3), T(0.05 + k * 0.18), pan=(-0.5 if k % 2 else 0.5))
    put(SFX, stamp(), T(fl), 0.9)
    put(SFX, slam_hit(0.8), T(fl), 0.6)
    put(SFX, fm_bell(1568, 0.8, 0.25), T(fl + 0.12))


def cue_percentHook(t0, skip=0, o=None):
    T = at(t0, skip)
    o = o or {}
    st = o.get('stop', 0.7)
    n = len(o.get('text', '%3×12=%36'))
    for k in range(n):  # tuşlara basılır
        put(SFX, tick(k % 2 == 0, 0.3), T(k * (st - 0.1) / n), pan=0.2)
    put(SFX, stamp(), T(st), 1.0)
    put(SFX, slam_hit(0.7), T(st), 0.7)

def buzzer(d=0.35):
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 116 * t)) * 0.5
    return lp(x, 1800) * adsr(len(t), 0.005, 0.05, 0.8, 0.08) * 0.35


def cue_quiz(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    OPT, CD0, STEP = o.get('optAt', 0.3), o.get('countAt', 0.9), o.get('step', 0.6)
    REV = CD0 + 3 * STEP
    for i, it in enumerate(o.get('items', [])):
        t = it['t']
        put(SFX, stereo_move(whoosh(0.3, 400, 3500), 0.9, -0.2), T(t - 0.02), 0.45)
        for j in range(2):
            put(SFX, bloop(500 + 250 * j, 900 + 250 * j, 0.06, 0.25), T(t + OPT + j * 0.12), pan=(j - 0.5))
        for k in range(3):  # geri sayım
            put(SFX, woodblock(k == 2), T(t + CD0 + k * STEP), 0.8, pan=0.3)
        put(SFX, buzzer(), T(t + REV), 0.5, pan=-0.3)
        put(SFX, ding_ding(), T(t + REV + 0.05), 0.7, pan=0.3)
        put(SFX, popper(), T(t + REV), 0.35)
        m = it.get('mascot')
        if m:
            put(SFX, boing(0.3, 0.18), T(t + 0.35), pan=0.5)
            put(SFX, mascot_voice(m.get('who', 'fistik')), T(t + REV + 0.25), 0.45, pan=0.5)

def pitched(x, s):
    return varispeed(x, np.full(int(len(x) / s) + 2, s))


def cue_oppTag(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    flips = o.get('flips', [])
    if flips:
        put(SFX, squeak(), T(0.3), 0.5, pan=0.2)  # Pamuk dans ederken cıyaklar
    for i, f in enumerate(flips):
        t = f[0]
        put(SFX, stereo_move(whoosh(0.3, 600, 4000), -0.4, 0.4), T(t - 0.15), 0.5)
        put(SFX, ui_tap(0.5), T(t), 0.8)
        put(SFX, ding_ding() if i else stamp(), T(t + 0.02), 0.6 if i else 0.9)
        if len(f) > 3:
            put(SFX, slot_roll(0.5), T(t), 0.45)
        if i:
            put(SFX, boing(0.35, 0.3), T(t + 0.05), pan=0.3)
    cd = o.get('countdown')
    if cd:
        for k in range(3):
            put(SFX, woodblock(k == 2), T(cd[0] + k * cd[1]), 0.8, pan=0.3)
    for t, st in o.get('pamuk', []):
        if st == 'shock':
            put(SFX, pitched(squeak(), 1.35), T(t + 0.05), 0.55, pan=0.15)
        if st == 'dumb':
            put(SFX, pitched(squeak(), 0.75), T(t + 0.3), 0.4, pan=0.15)
        if st == 'think':
            for k in range(3):
                put(SFX, pitched(squeak(), 1.1 + 0.08 * k), T(t + 0.6 + k * 0.9), 0.25, pan=0.15)
        if st == 'hit':
            put(SFX, pitched(squeak(), 1.6), T(t + 0.08), 0.6, pan=0.15)
        if st == 'faint':
            put(SFX, sad_trombone()[: int(1.0 * SR)], T(t + 0.1), 0.45)
            put(SFX, kick(0.7), T(t + 0.5), 0.6)
        if st == 'shock':
            put(SFX, slam_hit(0.9), T(t), 0.5)


def cue_lesson(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    put(SFX, bloop(500, 900, 0.06, 0.3), T(o.get('a', 0.2)))
    x = o.get('strike', 1.4)
    put(SFX, paper_tear(), T(x), 0.6)
    put(SFX, buzzer(), T(x + 0.15), 0.4)
    b = o.get('b', 2.4)
    put(SFX, stamp(), T(b), 0.9)
    put(SFX, boom(), T(b), 0.35)
    put(SFX, popper(), T(b + 0.05), 0.5)
    put(SFX, ding_ding(), T(b + 0.2), 0.6)

def cue_menuBoard(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    put(SFX, notif_ding(), T(0.25), 0.4)
    if 'pick' in o:
        put(SFX, ding_ding(), T(o['pick']), 0.6); put(SFX, popper(), T(o['pick'] + 0.05), 0.4); put(SFX, meow(1.2, 0.4), T(o['pick'] + 0.2), 0.5, pan=0.3)
    if 'hide' in o:
        put(SFX, buzzer(), T(o['hide']), 0.4); put(SFX, stereo_move(whoosh(0.3, 800, 3000), 0, 0.6), T(o['hide']), 0.4)
    if 'gap' in o:
        put(SFX, slot_roll(0.4), T(o['gap']), 0.4); put(SFX, fm_bell(1318, 0.6, 0.2), T(o['gap'] + 0.35))
    if 'trap' in o:
        put(SFX, stereo_move(whoosh(0.3, 400, 3500), 0.6, 0), T(o['trap']), 0.4); put(SFX, stamp(), T(o['trap'] + 0.25), 0.9); put(SFX, slam_hit(0.9), T(o['trap'] + 0.25), 0.5)
    cd = o.get('countdown')
    if cd:
        for k in range(3):
            put(SFX, woodblock(k == 2), T(cd[0] + k * cd[1]), 0.8, pan=0.3)
    for t, st in o.get('fistik', []):
        if st == 'shock':
            put(SFX, pitched(meow(1.0, 0.4), 1.3), T(t + 0.05), 0.5, pan=0.3)


def cue_saleTag(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    put(SFX, pitched(squeak(), 1.2), T(0.3), 0.4, pan=0.1)
    if 'sale' in o:
        put(SFX, paper_tear(), T(o['sale']), 0.5); put(SFX, stamp(), T(o['sale'] + 0.05), 0.8); put(SFX, cash_register(), T(o['sale'] + 0.3), 0.5)
    if 'brag' in o:
        put(SFX, popper(), T(o['brag']), 0.5); put(SFX, pitched(squeak(), 1.5), T(o['brag'] + 0.15), 0.5)
    if 'wallet' in o:
        put(SFX, stereo_move(whoosh(0.35, 300, 3000), -0.4, 0.4), T(o['wallet'] - 0.3), 0.5); put(SFX, boing(0.4, 0.3), T(o['wallet'] + 0.05))
    if 'reveal' in o:
        put(SFX, slam_hit(0.8), T(o['reveal']), 0.7); put(SFX, sad_trombone()[: int(1.1 * SR)], T(o['reveal'] + 0.1), 0.45)
        for k in range(6):
            put(SFX, pling(2093 / (1.05 ** k), 0.15, 0.2), T(o['reveal'] + 0.1 + k * 0.1), pan=0.3 * np.sin(k))
    cd = o.get('countdown')
    if cd:
        for k in range(3):
            put(SFX, woodblock(k == 2), T(cd[0] + k * cd[1]), 0.8, pan=0.3)

def cue_cinema(t0, skip=0, o=None):
    o = o or {}
    T = at(t0, skip)
    if 'ticket' in o:
        put(SFX, crickets(2.4), T(0.1), 0.9, pan=0.4)
        put(SFX, stamp(), T(o['ticket']), 0.8); put(SFX, slam_hit(1.1), T(o['ticket']), 0.35)
    if 'poll' in o:
        put(SFX, bloop(420, 1300, 0.09, 0.45), T(o['poll']))
    if 'leave1' in o:
        put(SFX, stereo_move(whoosh(0.35, 600, 2200), 0, -0.7), T(o['leave1'] + 0.1), 0.35)
    if 'qmark' in o:
        put(SFX, bloop(700, 500, 0.08, 0.3), T(o['qmark']))
    if 'pick' in o:
        put(SFX, ui_tap(0.8), T(o['pick'])); put(SFX, ding_ding(), T(o['pick'] + 0.08), 0.5)
        put(SFX, sniff(), T(o['pick'] + 0.25), 0.6, pan=0.1)
    if 'sleep' in o:
        sl, en = o['sleep'], o.get('end', o['sleep'] + 1.2)
        put(SFX, stereo_move(whoosh(0.5, 300, 2600), -0.5, 0.5), T(sl), 0.45)
        n = int((en - sl) / 0.11)
        for k in range(n):
            put(SFX, tick(k % 2 == 0, 0.28), T(sl + 0.05 + k * 0.11), pan=0.3)
        put(SFX, snore(0.7), T(sl + 0.2), 0.9); put(SFX, snore(0.7), T(sl + 0.95), 0.9)
        put(SFX, crunch(), T(sl + 0.55), 0.5, pan=0.5)
        put(SFX, fm_bell(392, 0.8, 0.25), T(en)); put(SFX, boom(0.6), T(en), 0.4)
    if 'cmp' in o:
        put(SFX, pitched(sniff(), 1.35), T(o['cmp']), 0.6); put(SFX, notif_ding(), T(o['cmp'] + 0.05), 0.4)
    if 'cmp1' in o:
        put(SFX, pling(1046, 0.25, 0.4), T(o['cmp1']), pan=-0.4); put(SFX, pling(1318, 0.25, 0.4), T(o['cmp1'] + 0.18), pan=0.4)
    if 'same' in o:
        put(SFX, paper_tear(), T(o['same']), 0.5); put(SFX, stamp(), T(o['same'] + 0.2), 0.9)
    if 'cmp2' in o:
        put(SFX, slam_hit(0.8), T(o['cmp2']), 0.7); put(SFX, sad_trombone()[: int(1.1 * SR)], T(o['cmp2'] + 0.1), 0.4)
    if 'sink' in o:
        sk = o['sink']
        put(SFX, stereo_move(whoosh(0.4, 2400, 300), 0.5, 0), T(sk), 0.45)
        put(SFX, gulp(), T(sk + 0.45), 0.8)
        for k in range(6):
            put(SFX, bloop(260 + 40 * k, 700 + 90 * k, 0.07, 0.25), T(sk + 0.7 + k * 0.17), pan=0.3 * np.sin(k * 1.7))

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


# ═════════ MÜZİK TÜRLERİ ═════════
# reels.json → "musicPlan": [[başla, bitir, tür], ...]. Türler: chip (varsayılan), lofi, horror, quiz.
def seg_bus(a, b):
    return np.zeros((int((b - a) * SR) + 2 * SR, 2))


def ep_note(m, d, v=0.12):
    """elektrik piyano (FM, tını + tremolo)"""
    t = tt(d)
    f = freq(m)
    idx = 1.6 * np.exp(-t * 3.5) + 0.3
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
    x *= np.exp(-t * 1.6) * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t))
    x *= adsr(len(x), 0.004, 0.1, 1.0, 0.12)
    return x * v


def lofi(a, b, last=True, **kw):
    BPM = 84
    bt = 60 / BPM
    sw = 0.62  # swing: 8'liklerin ikincisi geç
    bus = seg_bus(a, b)
    L = b - a
    chords = [(41, [57, 60, 64, 67]), (40, [55, 59, 62, 67]), (38, [57, 60, 62, 65]), (36, [55, 59, 64, 67])]  # Fmaj9 Em7 Dm9 Cmaj7
    mel = [[(1.5, 72), (2.5, 76)], [(0.5, 74), (2.0, 71)], [(1.0, 69), (2.5, 72)], [(0.5, 67), (3.0, 64)]]
    nbar = int(np.ceil(L / (4 * bt)))
    for bi in range(nbar):
        t0 = bi * 4 * bt
        root, ch = chords[bi % 4]
        for k, m in enumerate(ch):  # akor, hafif arpejli
            put(bus, ep_note(m, 4 * bt * 0.95, 0.09), t0 + k * 0.018, pan=(k - 1.5) * 0.25)
        for off, m in [(0, root), (2.5 * bt, root + 7), (3 * bt, root)]:
            x = np.sin(2 * np.pi * freq(m) * tt(bt * 0.9)) * adsr(int(bt * 0.9 * SR), 0.01, 0.2, 0.7, 0.08)
            put(bus, np.tanh(x * 1.5) * 0.4, t0 + off)
        for off, m in mel[bi % 4]:
            put(bus, ep_note(m + 12, bt * 1.2, 0.05), t0 + off * bt, pan=0.3)
            put(bus, lp(ep_note(m + 12, bt * 1.2, 0.05), 2000), t0 + off * bt + 0.75 * bt, 0.4, pan=-0.4)
        for beat in range(4):
            tb = t0 + beat * bt
            if beat in (0,) or (beat == 2 and bi % 2):
                put(bus, kick(0.55) * 0.9, tb)
            if beat == 2 and not bi % 2:
                put(bus, kick(0.45), tb + 0.5 * bt * (sw * 2 - 1) + bt * 0.5)
            if beat in (1, 3):
                sn = lp(snare(0.5), 3500)
                put(bus, sn, tb)
            for e8 in range(2):
                put(bus, hat(0.12 if e8 else 0.18), tb + (sw * bt if e8 else 0), pan=0.25)
    # plak cızırtısı ve bant hışırtısı
    n = len(bus)
    cr = np.zeros(n)
    idx = rng.choice(n, int(L * 18), replace=False)
    cr[idx] = rng.uniform(0.05, 0.25, len(idx))
    cr = hp(np.convolve(cr, np.exp(-np.arange(30) / 5), 'same'), 1500)
    hiss = lp(noise(n / SR), 5000)[:n] * 0.012
    bus += np.stack([cr + hiss, cr * 0.8 + hiss], 1)
    # bant titremesi (wow) + kısık tepe
    spd = 1 + 0.0035 * np.sin(2 * np.pi * 0.55 * np.arange(n) / SR)
    bus = np.stack([lp(varispeed(bus[:, c], spd), 6500) for c in range(2)], 1)
    put(MUS, bus[: int(L * SR)] * 1.25, a)


def horror(a, b, last=True, **kw):
    L = b - a
    t = tt(L + 0.5)
    n = len(t)
    k = t / L
    drone = sum(wave_(phase(np.full(n, f)), 'saw') for f in (55, 55.4, 58.3, 82.4 * 0.998))
    drone = sweep_lp(drone, 250 + 700 * k ** 2) * 0.22
    cluster = sum(np.sin(2 * np.pi * f * (1 + 0.004 * np.sin(2 * np.pi * (5 + i) * t)) * t) for i, f in enumerate((1760, 1864.7, 1975.5)))
    cluster *= 0.03 * k ** 1.5
    sub = np.sin(2 * np.pi * 36 * t) * 0.25 * (0.5 + 0.5 * k)
    bed = drone + cluster + sub
    bed[: int(0.15 * SR)] *= np.linspace(0, 1, int(0.15 * SR))
    put(MUS, np.stack([bed, np.roll(bed, 300)], 1)[: int(L * SR)], a)
    # kalp atışı, giderek hızlanır
    tm = 0.05
    while tm < L - 0.15:
        gap = lerp_(0.85, 0.36, tm / L)
        for j, v in ((0, 0.9), (0.16, 0.6)):
            h = np.sin(2 * np.pi * phase(glide(70, 40, 0.18))) * expd(0.18, 16) * v
            put(MUS, h, a + tm + j)
        tm += gap


def lerp_(x, y, k):
    return x + (y - x) * min(1, max(0, k))


def brass(ms, d, v=0.1):
    t = tt(d)
    x = sum(wave_(phase(np.full(len(t), freq(m) * det)), 'saw') for m in ms for det in (0.997, 1.003))
    x = sweep_lp(x, 700 + 3800 * np.exp(-t * 9) + 300) * adsr(len(t), 0.012, 0.08, 0.7, 0.05)
    return x * v / len(ms)


def quiz(a, b, last=True, **kw):
    """yarışma programı: swing, bakır nefesli vuruşlar, yürüyen bas, ride"""
    BPM = 132
    bt = 60 / BPM
    sw = 0.66
    L = b - a
    bus = seg_bus(a, b)
    prog_ = [(46, [62, 65, 70]), (43, [62, 67, 70]), (48, [63, 67, 72]), (41, [60, 65, 69])]  # Bb Gm Cm F
    walk = [[0, 4, 7, 9], [0, 3, 7, 5], [0, 3, 7, 6], [0, 4, 7, -1]]
    end = L - (1.0 if last else 0)
    nbar = int(np.ceil(end / (4 * bt)))
    for bi in range(nbar):
        t0 = bi * 4 * bt
        root, ch = prog_[bi % 4]
        for beat in range(4):
            tb = t0 + beat * bt
            if tb >= end:
                break
            m = root + walk[bi % 4][beat]
            x = (wave_(phase(np.full(int(bt * SR), freq(m))), 'tri') * 0.6 + np.sin(2 * np.pi * freq(m) * tt(bt))) * expd(bt, 5)
            put(bus, lp(x, 900) * 0.42, tb)
            put(bus, hp(noise(0.25), 5000) * expd(0.25, 9) * 0.16 + np.sin(2 * np.pi * 5200 * tt(0.25)) * expd(0.25, 12) * 0.02, tb, pan=0.4)  # ride
            if beat % 2 == 1:
                put(bus, hp(noise(0.12), 5000) * expd(0.12, 30) * 0.12, tb + sw * bt, pan=0.4)
                put(bus, lp(snare(0.32), 4000), tb)
            if beat == 0:
                put(bus, kick(0.6), tb)
        for off in (1 + sw, 3 + sw):  # nefesli vuruşlar
            if t0 + off * bt < end:
                put(bus, brass([m + 12 for m in ch], bt * 0.45, 0.32), t0 + off * bt)
    if last:
        put(bus, brass([58, 62, 65, 70, 74], 1.2, 0.5), end)
        put(bus, crash(0.5), end, pan=0.2)
        put(bus, kick(1.0), end)
    put(MUS, bus[: int(L * SR)] * 1.1, a)


def chip(a, b, last=True, **kw):
    t, bi = a, 0
    hit = b - (1.0 if last else 0)
    while t < hit - 1e-6:
        beats = int(round(min(4, (hit - t) / BEAT)))
        if beats <= 0:
            break
        music_bar(bi, t, MEL_A if (bi // 2) % 2 == 0 else MEL_B, length=beats)
        t += beats * BEAT
        bi += 1
    if last:
        for m in [48, 60, 64, 67, 72, 76]:
            put(MUS, pluck(m, 1.0, 'square', 0.4, cut=3500, v=0.06), hit)
        put(MUS, kick(1.0), hit)
        put(MUS, crash(0.5), hit, pan=0.2)


def marimba(m, d=0.35, v=0.18):
    t = tt(d)
    f = freq(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    return x * v


def pop(a, b, last=True, **kw):
    """hafif tropik pop: 104 BPM, dörtlük kick, el çırpma, vuruş arası akorlar, marimba"""
    BPM = kw.get('bpm', 104)
    bt = 60 / BPM
    L = b - a
    bus = seg_bus(a, b)
    prog_ = [(45, [57, 60, 64]), (41, [57, 60, 65]), (36, [55, 60, 64]), (43, [55, 59, 62])]  # Am F C G
    arp = [0, 2, 1, 2, 0, 2, 1, 3]
    end = L - (1.0 if last else 0)
    nbar = int(np.ceil(end / (4 * bt)))
    for bi in range(nbar):
        t0 = bi * 4 * bt
        root, ch = prog_[bi % 4]
        for beat in range(4):
            tb = t0 + beat * bt
            if tb >= end:
                break
            put(bus, kick(0.75), tb)
            if beat % 2:
                put(bus, clap(0.6), tb)
            put(bus, hat(0.2, open_=True) * 0.5, tb + bt / 2, pan=0.3)
            for m in ch:  # vuruş arası akor (pluck)
                put(bus, pluck(m + 12, bt * 0.3, 'square', 0.3, cut=3000, v=0.035), tb + bt / 2, pan=-0.2)
            x = np.sin(2 * np.pi * freq(root) * tt(bt * 0.9)) * adsr(int(bt * 0.9 * SR), 0.01, 0.1, 0.8, 0.05)
            put(bus, np.tanh(x * 1.4) * 0.38, tb)
        for k in range(8):
            if t0 + k * bt / 2 < end:
                n = ch[arp[k] % 3] + (12 if arp[k] == 3 else 0) + 12
                put(bus, marimba(n), t0 + k * bt / 2, pan=0.35 if k % 2 else -0.35)
    if last:
        for m in (57, 60, 64, 69, 72):
            put(bus, marimba(m + 12, 1.2, 0.2), end)
        put(bus, crash(0.4), end)
    put(MUS, bus[: int(L * SR)] * 1.05, a)


STYLES = {'lofi': lofi, 'horror': horror, 'quiz': quiz, 'chip': chip, 'pop': pop}


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
if REEL.get('babble'):
    babble(REEL.get('captions', []))
cue_boxes(REEL.get('boxes', []))
PLAN = REEL.get('musicPlan')
if PLAN:
    for i, seg in enumerate(PLAN):
        a, b, style = seg[:3]
        STYLES[style](a, b, last=(i == len(PLAN) - 1) and not REEL.get('loop'), **(seg[3] if len(seg) > 3 else {}))
    for c in range(2):  # chip türünün kick pompası
        MUS[:, c] *= duck
elif music_start is not None:
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

MFX = REEL.get('music', {})
for a, b in MFX.get('lowpass', []):  # boğuk (yan odadan geliyormuş gibi)
    i, j = int(a * SR), int(b * SR)
    seg = np.stack([lp(MUS[i:j, c], 600, 3) for c in range(2)], 1) * 1.3
    xf = min(int(0.08 * SR), (j - i) // 2)
    w = np.ones(j - i); w[:xf] = np.linspace(0, 1, xf); w[-xf:] = np.linspace(1, 0, xf)
    MUS[i:j] = MUS[i:j] * (1 - w[:, None]) + seg * w[:, None]
for a, b in MFX.get('gaps', []):  # müzik bant gibi durur, aradaki boşluk efektlere kalır
    i, j = int(a * SR), int(b * SR)
    stop = int(0.22 * SR)
    src = MUS[i : i + int(0.4 * SR)].copy()
    tail = np.stack([varispeed(src[:, c], np.linspace(1, 0.05, stop)) for c in range(2)], 1)
    tail *= np.linspace(1, 0, len(tail))[:, None]
    MUS[i:j] = 0
    MUS[i : i + len(tail)] = tail[: j - i]
    fi = min(int(0.05 * SR), N - j)
    if fi > 0:
        MUS[j : j + fi] *= np.linspace(0, 1, fi)[:, None]

# ═════════ MİKS ═════════
ir = reverb_ir()
wet = np.stack([fftconvolve(SFX[:, c], ir[:, c])[:N] for c in range(2)], 1)
sfx = SFX + wet * 0.18
env = np.abs(sfx).max(1)
env = lp(env, 8, 1).clip(0, None)
gain = 1 - 0.45 * np.clip(env / 0.35, 0, 1)  # efekt geldiğinde müzik kısılır
mus = MUS * gain[:, None] * REEL.get('musicGain', 1.0)
mus_wet = np.stack([fftconvolve(mus[:, c], ir[:, c] * 0.5)[:N] for c in range(2)], 1)


def master(mix, target_db=-15.5):
    """Ortalama yüksekliği hedefe getirir (Reels için ≈ −14 LUFS), sonra yumuşak sınırlar."""
    mix = np.stack([hp(mix[:, c], 28) for c in range(2)], 1)
    blk = int(0.4 * SR)
    e = np.array([np.sqrt((mix[i:i + blk] ** 2).mean()) for i in range(0, N - blk, blk)])
    loud = e[e > e.max() * 0.1]  # sessiz bölümler ortalamayı düşürmesin
    rms = np.sqrt((loud ** 2).mean()) if len(loud) else 1e-3
    mix = mix * (10 ** (target_db / 20) / rms)
    mix = np.tanh(mix * 1.1) / 1.1 * 0.97
    # örnekler arası tepe (true peak) ≤ −1 dBFS: AAC'ye çevrilirken kırpılmasın
    from scipy.signal import resample_poly
    tp = max(np.abs(resample_poly(mix[:, c], 4, 1)).max() for c in range(2))
    if tp > 0.89:
        mix *= 0.89 / tp
    fade = np.ones(N)
    fl = int((0.02 if REEL.get('loop') else 0.4) * SR)  # döngülü reels başa sessizce bağlanır
    fade[-fl:] = np.linspace(1, 0, fl)
    return mix * fade[:, None]


def write(mix, name):
    out = os.path.join(HERE, 'out', f'{name}.wav')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype('<i2').tobytes())
    print('yazıldı', out)


VOICE_PATH = os.path.join(HERE, 'out', f'{REEL_NAME}-voice.wav')
VO = None
if os.path.exists(VOICE_PATH):  # voice.py make <reels> ile üretilmiş seslendirme
    with wave.open(VOICE_PATH) as w:
        raw = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, w.getnchannels()) / 32768.0
    VO = np.zeros((N, 2))
    VO[: min(N, len(raw))] = raw[:N, :2] if raw.shape[1] >= 2 else np.repeat(raw[:N], 2, 1)
    venv = np.abs(VO).max(1)
    venv = lp(np.convolve(venv, np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'), 6, 1).clip(0, None)
    duck_v = 1 - np.clip(venv / 0.04, 0, 1)  # konuşurken 0, sessizken 1
    mus = mus * (0.30 + 0.70 * duck_v)[:, None]       # müzik −10 dB civarı kısılır
    sfx = sfx * (0.40 + 0.60 * duck_v)[:, None]       # efektler konuşmayı bastırmasın
    mus_wet = mus_wet * (0.30 + 0.70 * duck_v)[:, None]
    print('seslendirme karışıma eklendi:', VOICE_PATH)
VOMIX = VO * 1.5 if VO is not None else 0
write(master(mus * 0.55 + mus_wet * 0.05 + sfx * 0.9 + AMB + VOMIX), REEL_NAME)
if REEL.get('noMusicVariant'):
    # Instagram'da trend ses eklemek için: yalnız efektler ve konuşma
    write(master(sfx * 0.9 + AMB + VOMIX, -17.0), f'{REEL_NAME}-muziksiz')
