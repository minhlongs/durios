#!/usr/bin/env bash
set -euo pipefail
URL="$1"
OUT="$2"
curl -s -L "$URL" -o "$OUT"
echo "Saved to $OUT ($(wc -c < "$OUT") bytes)"
