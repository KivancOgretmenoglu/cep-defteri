#!/usr/bin/env bash
# Bir reels'i baştan üretir: ses → görüntü → out/<ad>.mp4
# Kullanım: promo/make.sh <reels-adı>    (adlar reels.json'da)
set -euo pipefail
cd "$(dirname "$0")"
name="${1:?reels adı ver (reels.json)}"
python3 audio.py "$name"
node render.mjs video "$name"
