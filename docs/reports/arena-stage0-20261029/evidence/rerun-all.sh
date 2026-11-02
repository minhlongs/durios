#!/usr/bin/env bash
# Regenerates every log in rerun-20261030/ from the tree as it stands right now.
#
# A reviewer does not have to trust the captured logs: run this script on the delivered tree and
# diff. Each log records the exact command, the git HEAD, the bun/node versions and the exit code.
# Everything it touches is a throwaway fixture under /tmp — synthetic documents only, no real
# customer data, and the HTTP server it starts is bound to 127.0.0.1 on a spare port.
#
# usage: bash rerun-all.sh            # writes into ./rerun-20261030/
#        OUT_DIR=/tmp/my-rerun bash rerun-all.sh
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../../.." && pwd)
cd "$REPO" || exit 2
OUT=${OUT_DIR:-"$HERE/rerun-20261030"}
PORT=${PORT:-3111}
mkdir -p "$OUT"
STAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
HEAD_SHA=$(git rev-parse HEAD)
BUNV=$(bun --version 2>/dev/null || echo "missing")
NODEV=$(node --version 2>/dev/null || echo "missing")
FAILED=""

capture() { # $1 log name, $2 title, $3 command, $4 optional note
  local out="$OUT/$1" title="$2" cmd="$3" note="${4:-}" code
  {
    printf '# %s — captured %s\n' "$title" "$STAMP"
    printf '# repo %s | branch %s | HEAD %s | bun %s | node %s\n' "$REPO" "$BRANCH" "$HEAD_SHA" "$BUNV" "$NODEV"
    [ -n "$note" ] && printf '# %s\n' "$note"
    printf '\n### CMD: %s\n' "$cmd"
  } > "$out"
  bash -c "$cmd" >> "$out" 2>&1
  code=$?
  printf 'EXIT=%s\n' "$code" >> "$out"
  printf '%-42s EXIT=%s\n' "$1" "$code"
  [ "$code" -ne 0 ] && FAILED="$FAILED $1"
  return 0
}

capture TYPECHECK-LOG.txt "bun run typecheck on the delivered tree" "bun run typecheck"
capture TEST-SUITE-LOG.txt "bun test — full suite on the delivered tree" "bun test" \
  'bunfig.toml: preload test/preload-synthetic-extraction.ts + [test] root = "./test" (keeps delivered snapshot copies out of the run)'
capture MODULARITY-LOG.txt "codebase modularity guard" \
  "bun -e 'import { evaluateCodebaseModularityDeep } from \"./src/saas/codebase-modularity-deep-introspector.ts\"; const r = evaluateCodebaseModularityDeep(process.cwd()); console.log(JSON.stringify(r, null, 2));'"
capture DRILL-STAGE0-LOG.txt "drill-stage0.ts (S1-S11)" \
  "DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true bun $HERE/drill-stage0.ts" \
  "DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true (bắt buộc: kịch bản nạp fixtureFields)"
capture BACKUP-RESTORE-DRILL-LOG.txt "backup-restore-drill.ts" \
  "DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true bun $HERE/backup-restore-drill.ts" \
  "DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true"
capture GATE-CLI-MATRIX-LOG.txt "gate CLI matrix (A1-A3 rehearsal cohort, B1-B4 operational fixture cohort)" \
  "bash $HERE/gate-cli-matrix.sh"
capture EXTRACTION-MODE-LOG.txt "extraction-mode-demo.ts — ordinary vs explicitly enabled synthetic flow" \
  "env -u DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION bun $HERE/extraction-mode-demo.ts"
capture GATE-PROVENANCE-ADVERSARIAL-LOG.txt "gate-provenance-adversarial.ts (F-14: rename / mix / erase attacks)" \
  "bun $HERE/gate-provenance-adversarial.ts /tmp/durios-adv-provenance" \
  "Mọi cơ sở dữ liệu, tài liệu và tệp 'bằng chứng' đều do script tự tạo — không phải quyết định khai trương"

# --- HTTP walkthrough: real server, loopback only, throwaway rehearsal database -----------------
WALK_DIR=$(mktemp -d /tmp/durios-walk-XXXXXX)
WALK_LOG="$OUT/HTTP-WALKTHROUGH-LOG.txt"
{
  printf '# http-walkthrough.sh against the REAL HTTP server bound to 127.0.0.1:%s — captured %s\n' "$PORT" "$STAMP"
  printf '# repo %s | branch %s | HEAD %s | bun %s\n' "$REPO" "$BRANCH" "$HEAD_SHA" "$BUNV"
  printf '# rehearsal DB: %s (seeded by pilot:seed-rehearsal — synthetic documents only, published rehearsal passwords)\n' "$WALK_DIR"
  printf '# server env: DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true DURIOS_PORT=%s DURIOS_HOST=127.0.0.1\n' "$PORT"
  printf '\n### CMD: BASE_URL=http://127.0.0.1:%s TMPD_FILE=%s/tmpd.txt bash %s/http-walkthrough.sh\n' "$PORT" "$WALK_DIR" "$HERE"
} > "$WALK_LOG"
echo "$WALK_DIR" > "$WALK_DIR/tmpd.txt"
DURIOS_DB_PATH="$WALK_DIR/durios.db" DURIOS_DATA_DIR="$WALK_DIR/uploads" \
  bun "$REPO/src/auth/pilot-rehearsal-seeder.ts" > "$WALK_DIR/seed.json" 2> "$WALK_DIR/seed.err"
DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true DURIOS_PORT="$PORT" DURIOS_HOST=127.0.0.1 \
  DURIOS_DB_PATH="$WALK_DIR/durios.db" DURIOS_DATA_DIR="$WALK_DIR/uploads" \
  bun "$REPO/src/server/server.ts" > "$WALK_DIR/server.log" 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 80); do
  curl -fsS "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1 && break
  sleep 0.5
done
BASE_URL="http://127.0.0.1:$PORT" TMPD_FILE="$WALK_DIR/tmpd.txt" bash "$HERE/http-walkthrough.sh" >> "$WALK_LOG" 2>&1
WALK_CODE=$?
kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null
{
  printf '\n### server stdout/stderr (%s)\n' "$WALK_DIR/server.log"
  cat "$WALK_DIR/server.log"
  printf '\nEXIT=%s\n' "$WALK_CODE"
} >> "$WALK_LOG"
printf '%-42s EXIT=%s\n' "HTTP-WALKTHROUGH-LOG.txt" "$WALK_CODE"
[ "$WALK_CODE" -ne 0 ] && FAILED="$FAILED HTTP-WALKTHROUGH-LOG.txt"
rm -rf "$WALK_DIR"

# --- UI render probe: headless DOM only, NOT a screenshot --------------------------------------
UI_LOG="$OUT/UI-RENDER-PROBE-LOG.txt"
TOOLS_DIR=${TOOLS_DIR:-"$HOME/tools"}
if ! node -e "import('happy-dom').then(()=>{},()=>process.exit(1))" 2>/dev/null; then
  npm install --prefix "$TOOLS_DIR" happy-dom@15 > /dev/null 2>&1
  mkdir -p "$REPO/node_modules"
  for m in happy-dom entities webidl-conversions whatwg-mimetype; do
    [ -e "$REPO/node_modules/$m" ] || ln -s "$TOOLS_DIR/node_modules/$m" "$REPO/node_modules/$m" 2>/dev/null
  done
fi
{
  printf '# ui-render-probe.mjs (headless DOM probe — KHÔNG phải ảnh chụp màn hình) — captured %s\n' "$STAMP"
  printf '# repo %s | branch %s | HEAD %s | bun %s | node %s\n' "$REPO" "$BRANCH" "$HEAD_SHA" "$BUNV" "$NODEV"
  printf '# happy-dom không phải dependency của dự án: npm install --prefix %s happy-dom@15 rồi symlink vào node_modules/\n' "$TOOLS_DIR"
  printf '\n### CMD: node %s/ui-render-probe.mjs\n' "$HERE"
} > "$UI_LOG"
node "$HERE/ui-render-probe.mjs" >> "$UI_LOG" 2>&1
UI_CODE=$?
printf 'EXIT=%s\n' "$UI_CODE" >> "$UI_LOG"
printf '%-42s EXIT=%s\n' "UI-RENDER-PROBE-LOG.txt" "$UI_CODE"
[ "$UI_CODE" -ne 0 ] && FAILED="$FAILED UI-RENDER-PROBE-LOG.txt"

echo
if [ -n "$FAILED" ]; then
  echo "RERUN INCOMPLETE — non-zero exit in:$FAILED"
  exit 1
fi
echo "RERUN COMPLETE — every log in $OUT exited 0"
