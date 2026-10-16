#!/usr/bin/env python3
"""Yeni seslendirme satırlarının marka sesine uyup uymadığını ölçer.

Kullanım:
  python3 promo/voice_check.py assets/voice/<reels>/*.mp3         # marka EQ'su uygulanmış haliyle ölçer
  python3 promo/voice_check.py --raw assets/voice/<reels>/*.mp3   # EQ'suz, ham dosyayı ölçer

Referans: fırsat maliyeti, tuzak seçenek ve indirim yanılgısı reelslerindeki ton etiketli satırlar.
Her satır için perde (F0 medyanı) ve ses rengi farkı (uzun dönem spektrum uzaklığı, dB) yazılır.
Referans satırlar kendi aralarında 3,0–5,1 dB farklı; 5,5 dB üstü kulakta "başka konuşmacı" gibi
duyulur, o satırı yeniden üret (tarif: brand/marka-sesi.md).
"""
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, 'assets', 'voice')
SR = 16000
LIMIT = 5.5
REF = ['firsat/v1.mp3', 'firsat/v3.mp3', 'firsat/v4.mp3', 'firsat/v5.mp3', 'tuzak/a3.mp3', 'tuzak/a1.mp3',
       'tuzak/a6b.mp3', 'tuzak/a9.mp3', 'indirim/b1b.mp3', 'indirim/b3.mp3', 'indirim/b4.mp3', 'indirim/b7b.mp3']
sys.path.insert(0, HERE)
from voice import BRAND_VOICE_FILTER  # noqa: E402


def load(f, af=''):
    cmd = ['ffmpeg', '-v', 'error', '-i', f] + (['-af', af] if af else []) + ['-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, dtype=np.float32).copy()


def pitch(x, fmin=70, fmax=400, fr=640, hop=160, th=0.12):
    """YIN ile perde tahmini; sessiz kareler atlanır."""
    out, tmin, tmax = [], int(SR / fmax), int(SR / fmin)
    for i in range(0, len(x) - fr - tmax, hop):
        w = x[i : i + fr + tmax]
        if np.sqrt(np.mean(w[:fr] ** 2)) < 0.02:
            continue
        d = np.array([np.sum((w[:fr] - w[t : t + fr]) ** 2) for t in range(tmax + 1)])
        cm = np.concatenate([[1], d[1:] * np.arange(1, tmax + 1) / np.maximum(np.cumsum(d[1:]), 1e-9)])
        idx = np.where(cm[tmin:] < th)[0]
        if len(idx):
            t = tmin + idx[0]
            while t + 1 < len(cm) and cm[t + 1] < cm[t]:
                t += 1
            out.append(SR / t)
    return float(np.median(out)) if out else 0.0


def ltas(x, n=1024):
    """Konuşulan karelerin ortalama spektrumu (100–6000 Hz, ortalaması sıfırlanmış dB)."""
    fr = x[: len(x) // n * n].reshape(-1, n)
    fr = fr[np.sqrt((fr ** 2).mean(1)) > 0.02]
    m = 10 * np.log10((np.abs(np.fft.rfft(fr * np.hanning(n), axis=1)) ** 2).mean(0) + 1e-12)
    f = np.fft.rfftfreq(n, 1 / SR)
    v = m[(f >= 100) & (f <= 6000)]
    return v - v.mean()


def main(args):
    raw = '--raw' in args
    files = [a for a in args if a != '--raw']
    if not files:
        print(__doc__)
        sys.exit(1)
    ref = np.mean([ltas(load(os.path.join(VOICE, f))) for f in REF], 0)
    print(f"{'satır':40s} {'perde':>7s} {'renk farkı':>11s}")
    bad = 0
    for f in files:
        x = load(f, '' if raw else BRAND_VOICE_FILTER)
        dist = float(np.sqrt(np.mean((ltas(x) - ref) ** 2)))
        ok = dist <= LIMIT
        bad += not ok
        print(f"{os.path.relpath(f, HERE)[-40:]:40s} {pitch(x):5.0f}Hz {dist:8.2f} dB   {'UYGUN' if ok else 'YENİDEN ÜRET'}")
    print(f"\nReferans satırlar kendi aralarında 3,0–5,1 dB; sınır {LIMIT} dB." + ('' if raw else ' (marka EQ\'su uygulanarak ölçüldü)'))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
