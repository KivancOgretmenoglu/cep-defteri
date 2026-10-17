#!/usr/bin/env bash
# Bir reels'i baştan üretir: ses → görüntü → out/<ad>.mp4
# Kullanım: promo/make.sh <reels-adı>    (adlar reels.json'da)
set -euo pipefail
cd "$(dirname "$0")"
name="${1:?reels adı ver (reels.json)}"
# hazır seslendirme satırları ("voiceFiles") varsa önce yerleştir: out/<ad>-voice.wav depoda yok (.gitignore)
if python3 -c 'import json,sys; sys.exit(0 if json.load(open("reels.json"))[sys.argv[1]].get("voiceFiles") else 1)' "$name"; then
  python3 voice.py place "$name"
fi
python3 audio.py "$name"
node render.mjs video "$name"
