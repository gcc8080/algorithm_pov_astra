#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets
curl --fail -L --retry 2 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf' -o assets/NotoSansSC.ttf
python3 -m fontTools.varLib.instancer assets/NotoSansSC.ttf wght=400 -o assets/NotoSansSC-Regular.ttf
python3 -m fontTools.varLib.instancer assets/NotoSansSC.ttf wght=700 -o assets/NotoSansSC-Bold.ttf
