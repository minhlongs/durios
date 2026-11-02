#!/usr/bin/env bash
# =============================================================================
# DuriOS Stage 0 — ONE sequential acceptance harness (handover item 4).
#
# Runs the ten acceptance steps in order against a copy of the delivered tree,
# in throwaway directories, with an EXPECTED result asserted for every step.
# Nothing here writes to ./data in the tree, nothing here touches a real
# customer database, and no step is allowed to hide a failure:
#
#   * `set -e` is deliberately NOT used. Every command's exit code is captured
#     and compared with the expected value, so a gate CLI that is BLOCKED and
#     therefore exits 1 is asserted as a PASS, not masked with `|| true`.
#   * any assertion mismatch increments FAILURES and the harness exits 1;
#   * a step that could not run at all (missing artifact) is a SKIP, and the
#     harness exits 3 so an incomplete run is never mistaken for a clean one.
#
# usage:
#   bash evidence/acceptance-harness.sh [--archive <handover.tar.gz>] [--log-dir <dir>] [--keep]
# environment:
#   HARNESS_TREE=<dir>    run against another copy of the tree (e.g. the extracted
#                         delivered-tree archive) instead of the repository checkout
#   HARNESS_PORT=<port>   loopback port for step 4 (default: first free from 3123)
#   HARNESS_LOG_DIR=<dir> where the step logs are written
#
# tools required: bun (per bun.lock), node, python3, git, curl, tar, sha256sum, awk.
# happy-dom is NOT required: it is only used by ui-render-probe.mjs, which is a DOM
# probe and explicitly not acceptance evidence (see UI-ACCEPTANCE-CHECKLIST.md).
# =============================================================================
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPORT_DIR=$(cd "$HERE/.." && pwd)
DEFAULT_TREE=$(cd "$REPORT_DIR/../../.." && pwd)
TREE=${HARNESS_TREE:-$DEFAULT_TREE}
if [ "$TREE" != "$DEFAULT_TREE" ]; then
  # Pointing the harness at another copy of the tree means running THAT copy's scripts, otherwise
  # the run would prove nothing about the artifact under review.
  REPORT_DIR="$TREE/docs/reports/arena-stage0-20261029"
  HERE="$REPORT_DIR/evidence"
fi
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
KEEP=0
ARCHIVE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --archive) ARCHIVE=${2:-}; shift 2 ;;
    --log-dir) HARNESS_LOG_DIR=${2:-}; shift 2 ;;
    --keep) KEEP=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

LOG_DIR=${HARNESS_LOG_DIR:-$HERE/acceptance-$STAMP}
mkdir -p "$LOG_DIR" || { echo "cannot create log dir $LOG_DIR" >&2; exit 2; }
WORK=$(mktemp -d "${TMPDIR:-/tmp}/durios-acceptance-XXXXXX")

CHECKS=0
ARCHIVE_SHA="(none)"
ARCHIVE_BYTES=0
FAILURES=0
SKIPS=0
STEP_RESULTS=""
STEP_LOG="$LOG_DIR/harness.log"
DRILL_ROOT=""

say()  { printf '%s\n' "$*" >> "$STEP_LOG"; printf '%s\n' "$*"; }
note() { printf '%s\n' "$*" >> "$STEP_LOG"; }

pass() { CHECKS=$((CHECKS + 1)); say "PASS | $1"; }
fail() { CHECKS=$((CHECKS + 1)); FAILURES=$((FAILURES + 1)); say "FAIL | $1"; }
skip() { SKIPS=$((SKIPS + 1)); say "SKIP | $1"; }

# assert_exit <label> <expected> <actual>
assert_exit() {
  if [ "$3" = "$2" ]; then pass "$1 (exit $3 as expected)"
  else fail "$1: expected exit $2, got $3"; fi
}

# assert_grep <label> <extended-regex> <file>
assert_grep() {
  if [ -f "$3" ] && grep -qE "$2" "$3"; then pass "$1"
  else fail "$1: pattern [$2] not found in $3"; fi
}

begin_step() { # <number> <slug> <expected result, one line>
  STEP_NUM=$1; STEP_SLUG=$2; STEP_EXPECTED=$3
  STEP_FAILS_BEFORE=$FAILURES; STEP_SKIPS_BEFORE=$SKIPS
  STEP_LOG="$LOG_DIR/$(printf 'step-%02d' "$STEP_NUM")-$STEP_SLUG.log"
  {
    printf '# STEP %s — %s\n' "$STEP_NUM" "$STEP_SLUG"
    printf '# tree              : %s\n' "$TREE"
    printf '# tree fingerprint  : %s\n' "$FINGERPRINT"
    printf '# work dir          : %s\n' "$WORK"
    printf '# started (UTC)     : %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '# EXPECTED RESULT   : %s\n' "$STEP_EXPECTED"
    printf '\n'
  } > "$STEP_LOG"
  say ""
  say "================ STEP $STEP_NUM — $STEP_SLUG ================"
  say "expected: $STEP_EXPECTED"
}

# run_logged <label> <command...> — runs the command, appends stdout+stderr to the
# step log, echoes the exit code. Never appends `|| true`.
run_logged() {
  local label=$1; shift
  printf '\n### CMD: %s\n' "$*" >> "$STEP_LOG"
  "$@" >> "$STEP_LOG" 2>&1
  local code=$?
  printf '### EXIT=%s\n' "$code" >> "$STEP_LOG"
  say "  ran: $label → exit $code"
  return "$code"
}

# end_step derives the step status from what actually happened inside it: any new failure makes the
# step FAIL, any new skip makes it SKIP. The argument is accepted for readability and ignored, so a
# step can never be reported PASS while one of its assertions failed.
end_step() {
  local _label=${1:-}
  local status="PASS"
  if [ "$FAILURES" -gt "$STEP_FAILS_BEFORE" ]; then status="FAIL"
  elif [ "$SKIPS" -gt "$STEP_SKIPS_BEFORE" ]; then status="SKIP"; fi
  STEP_RESULTS="$STEP_RESULTS$(printf 'step-%02d %-34s %s\n' "$STEP_NUM" "$STEP_SLUG" "$status")"$'\n'
  say "  → STEP $STEP_NUM result: $status"
}

# ---------------------------------------------------------------- environment
if ! command -v sha256sum > /dev/null 2>&1; then
  if command -v gsha256sum > /dev/null 2>&1; then
    sha256sum() { gsha256sum "$@"; }
  elif command -v shasum > /dev/null 2>&1; then
    sha256sum() { shasum -a 256 "$@"; }
  fi
  export -f sha256sum
fi
if ! command -v bun > /dev/null 2>&1; then
  echo "bun not found on PATH. Stage 0 runs on Bun + TypeScript; install the version pinned in bun.lock" >&2
  echo "(in this sandbox: bun 1.4.4). Aborting before step 1." >&2
  exit 2
fi
{
  printf '# acceptance environment — %s\n' "$STAMP"
  printf 'bun      : %s\n' "$(bun --version 2>&1)"
  printf 'node     : %s\n' "$(node --version 2>&1)"
  printf 'python3  : %s\n' "$(python3 --version 2>&1)"
  printf 'git      : %s\n' "$(git --version 2>&1)"
  printf 'tar      : %s\n' "$(tar --version 2>&1 | head -1)"
  printf 'curl     : %s\n' "$(curl --version 2>&1 | head -1)"
  printf 'sha256sum: %s\n' "$(sha256sum --version 2>&1 | head -1)"
  printf 'uname    : %s\n' "$(uname -srm)"
} > "$LOG_DIR/ENVIRONMENT.txt"

# ------------------------------------------------------- tree identity (step 0)
FINGERPRINT=$(
  cd "$TREE" && find . -type f \
    -not -path './.git/*' -not -path './node_modules/*' -not -path './data/*' \
    -not -path './docs/reports/arena-stage0-20261029/package/*' \
    -not -path './docs/reports/arena-stage0-20261029/delivery/*' \
    -not -path './docs/reports/arena-stage0-20261029/evidence/acceptance-*' \
    -print0 2>/dev/null | sort -z | xargs -0 sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1
)
FILE_COUNT=$(cd "$TREE" && find . -type f -not -path './.git/*' -not -path './node_modules/*' | wc -l | tr -d ' ')
GIT_HEAD="(not a git checkout)"
GIT_DIRTY="(not a git checkout)"
if [ -e "$TREE/.git" ]; then
  GIT_HEAD=$(cd "$TREE" && git rev-parse HEAD 2>/dev/null || echo "(unavailable)")
  GIT_DIRTY=$(cd "$TREE" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
fi
{
  printf '# tree identity — every log in this directory belongs to exactly this tree\n'
  printf 'tree            : %s\n' "$TREE"
  printf 'tree fingerprint: %s\n' "$FINGERPRINT"
  printf '  (sha256 over the sorted "path: sha256" list of every file in the tree, excluding\n'
  printf '   .git/, node_modules/, data/, the package/ and delivery/ artifacts and these logs)\n'
  printf 'files           : %s\n' "$FILE_COUNT"
  printf 'git HEAD        : %s\n' "$GIT_HEAD"
  printf 'git dirty lines : %s\n' "$GIT_DIRTY"
  printf 'stamp (UTC)     : %s\n' "$STAMP"
} > "$LOG_DIR/TREE-FINGERPRINT.txt"

say "DuriOS Stage 0 acceptance harness — $STAMP"
say "tree       : $TREE"
say "fingerprint: $FINGERPRINT"
say "log dir    : $LOG_DIR"
say "work dir   : $WORK"

# =============================== STEP 1 — checksums before extraction ========
begin_step 1 verify-checksums-and-list-archive \
  "outer SHA-256 of the handover archive verifies, the listing shows the five reports + evidence + package, every inner checksum in CHECKSUMS.txt matches, and package/SHA256SUMS.txt (when present) matches. Exit 0 for every sha256sum -c."
STEP1_OK=1
if [ -z "$ARCHIVE" ]; then
  ARCHIVE=$(ls -1 "$REPORT_DIR/delivery/"*.tar.gz 2>/dev/null | tail -1)
fi
if [ -n "$ARCHIVE" ] && [ -f "$ARCHIVE" ]; then
  ARCHIVE_BYTES=$(wc -c < "$ARCHIVE" | tr -d ' ')
  ARCHIVE_SHA=$(sha256sum "$ARCHIVE" | cut -d' ' -f1)
  say "archive: $ARCHIVE"
  say "archive sha256: $ARCHIVE_SHA"
  say "archive bytes : $ARCHIVE_BYTES"
  # Recorded because of the bootstrap problem: the archive that contains this log can only be built
  # AFTER this run, so the sha256 below identifies exactly which build was verified. Re-running the
  # harness against the archive you hold verifies that build instead.
  if [ -f "$ARCHIVE.sha256" ]; then
    run_logged "sha256sum -c on the archive's sidecar file" bash -c "cd \"$(dirname "$ARCHIVE")\" && sha256sum -c \"$(basename "$ARCHIVE").sha256\""
    assert_exit "outer archive checksum" 0 $?
  else
    fail "no sidecar checksum file next to $ARCHIVE"; STEP1_OK=0
  fi
  run_logged "list archive contents (no extraction into the tree)" tar -tzf "$ARCHIVE"
  if [ $? -eq 0 ]; then pass "archive listing readable"; else fail "archive listing unreadable"; STEP1_OK=0; fi
  cp "$STEP_LOG" "$WORK/listing-raw.txt"
  awk '/^### CMD: tar -tzf/{f=1;next} /^### EXIT=/{f=0} f' "$WORK/listing-raw.txt" > "$WORK/listing.txt"
  ENTRIES=$(wc -l < "$WORK/listing.txt" | tr -d ' ')
  if [ "$ENTRIES" -gt 100 ]; then pass "archive holds $ENTRIES entries (> 100 expected)"; else fail "archive holds only $ENTRIES entries"; STEP1_OK=0; fi
  for want in "README-HANDOVER.md" "REPORT.md" "VERIFICATION.md" "GATE-MATRIX.md" "FINDINGS.md" "RUNBOOK-STAGE0-REHEARSAL.md" "evidence/" "package/MANIFEST.txt" "package/SHA256SUMS.txt" "package/stage0-full.patch" "CHECKSUMS.txt"; do
    if grep -qF "$want" "$WORK/listing.txt"; then pass "listing contains $want"; else fail "listing is missing $want"; STEP1_OK=0; fi
  done
  CK_PATH=$(grep -m1 -E '(^|/)CHECKSUMS\.txt$' "$WORK/listing.txt" | tr -d '\r')
  if [ -n "$CK_PATH" ]; then
    mkdir -p "$WORK/inner-check"
    run_logged "extract only the archive payload into a scratch dir ($WORK/inner-check), never into the tree" tar -xzf "$ARCHIVE" -C "$WORK/inner-check"
    assert_exit "scratch extraction" 0 $?
    CK_DIR=$(dirname "$CK_PATH")
    run_logged "verify every inner checksum" bash -c "cd '$WORK/inner-check/$CK_DIR' && sha256sum -c CHECKSUMS.txt"
    INNER_CODE=$?
    assert_exit "inner CHECKSUMS.txt" 0 "$INNER_CODE"
    INNER_TOTAL=$(wc -l < "$WORK/inner-check/$CK_PATH" | tr -d ' ')
    say "  inner checksums: $INNER_TOTAL listed in CHECKSUMS.txt, all verified by sha256sum -c above"
    if [ "$INNER_TOTAL" -gt 100 ]; then pass "CHECKSUMS.txt lists $INNER_TOTAL files (> 100 expected)"; else fail "CHECKSUMS.txt lists only $INNER_TOTAL files"; STEP1_OK=0; fi
  else
    fail "CHECKSUMS.txt not found in the archive listing"; STEP1_OK=0
  fi
else
  skip "no handover archive found (pass --archive <path>); this tree carries no delivery/ artifact to verify"
  STEP1_OK=0
fi
if [ -f "$REPORT_DIR/package/SHA256SUMS.txt" ]; then
  run_logged "verify package/SHA256SUMS.txt inside the tree" bash -c "cd '$REPORT_DIR/package' && sha256sum -c SHA256SUMS.txt"
  assert_exit "package SHA256SUMS" 0 $?
else
  say "  note: this tree has no package/ directory (the delivered tree intentionally excludes it); the archive check above is the authoritative one"
fi
end_step

# =============================== STEP 2 — dependencies per lockfile ==========
begin_step 2 install-dependencies-per-lockfile \
  "bun.lock exists and 'bun install --frozen-lockfile' exits 0 without changing the lockfile."
if [ -f "$TREE/bun.lock" ]; then
  pass "bun.lock present"
  LOCK_BEFORE=$(sha256sum "$TREE/bun.lock" | cut -d' ' -f1)
else
  fail "bun.lock missing — dependencies cannot be installed per lockfile"
  LOCK_BEFORE="missing"
fi
run_logged "bun install --frozen-lockfile (in $TREE)" bash -c "cd '$TREE' && bun install --frozen-lockfile"
assert_exit "dependency install" 0 $?
if [ -f "$TREE/bun.lock" ]; then LOCK_AFTER=$(sha256sum "$TREE/bun.lock" | cut -d' ' -f1); else LOCK_AFTER="missing"; fi
if [ "$LOCK_BEFORE" = "$LOCK_AFTER" ]; then pass "bun.lock unchanged by the install"; else fail "bun.lock changed during install"; fi
end_step

# =============================== STEP 3 — typecheck + full test suite ========
begin_step 3 typecheck-and-full-test-suite \
  "'bun run typecheck' exits 0 and 'bun test' exits 0 with '0 fail'."
run_logged "bun run typecheck" bash -c "cd '$TREE' && bun run typecheck"
assert_exit "typecheck" 0 $?
run_logged "bun test (whole suite)" bash -c "cd '$TREE' && bun test"
assert_exit "bun test" 0 $?
assert_grep "test suite reports 0 failing tests" "[[:space:]]0 fail$" "$STEP_LOG"
PASS_LINE=$(grep -E "[[:space:]][0-9]+ pass$" "$STEP_LOG" | tail -1 | tr -d ' ')
EXPECT_LINE=$(grep -E "[[:space:]][0-9]+ expect\(\) calls$" "$STEP_LOG" | tail -1 | tr -d ' ')
say "  suite: $PASS_LINE / $EXPECT_LINE"
if [ -n "$PASS_LINE" ]; then pass "suite reported a pass count ($PASS_LINE)"; else fail "no pass count found in the test log"; fi
end_step

# =============================== STEP 4 — HTTP walkthrough, loopback only ====
begin_step 4 http-walkthrough-on-loopback-server \
  "the server binds 127.0.0.1 only; the 17-step walkthrough exits 0; spoofed role header ignored, anonymous 401, clerk export sign-off 403, sealed upload 409, manifest verifies FULL, gates report machine 2/5 and evidenced 0/5 with SYNTHETIC_REHEARSAL provenance."
WALK_PORT=${HARNESS_PORT:-3123}
while curl -fsS "http://127.0.0.1:$WALK_PORT/api/health" > /dev/null 2>&1; do WALK_PORT=$((WALK_PORT + 1)); done
WALK_DIR="$WORK/http-walkthrough"
mkdir -p "$WALK_DIR"
echo "$WALK_DIR" > "$WALK_DIR/tmpd.txt"
run_logged "seed a throwaway rehearsal database in $WALK_DIR" bash -c "cd '$TREE' && DURIOS_DB_PATH='$WALK_DIR/durios.db' DURIOS_DATA_DIR='$WALK_DIR/uploads' bun src/auth/pilot-rehearsal-seeder.ts"
assert_exit "rehearsal seeder" 0 $?
say "  starting the real server on 127.0.0.1:$WALK_PORT (loopback only, no public ingress)"
cd "$TREE"
DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true DURIOS_PORT="$WALK_PORT" DURIOS_HOST=127.0.0.1 \
  DURIOS_DB_PATH="$WALK_DIR/durios.db" DURIOS_DATA_DIR="$WALK_DIR/uploads" \
  bun src/server/server.ts > "$WALK_DIR/server.log" 2>&1 &
SERVER_PID=$!
cd "$HERE" > /dev/null
READY=0
for _ in $(seq 1 80); do
  if curl -fsS "http://127.0.0.1:$WALK_PORT/api/health" > /dev/null 2>&1; then READY=1; break; fi
  sleep 0.5
done
if [ "$READY" -eq 1 ]; then pass "server answered /api/health on 127.0.0.1:$WALK_PORT"; else fail "server never became ready on 127.0.0.1:$WALK_PORT"; fi
note "--- server log ($WALK_DIR/server.log) ---"
cat "$WALK_DIR/server.log" >> "$STEP_LOG" 2>&1
assert_grep "server bound to the loopback address only" "127\.0\.0\.1:$WALK_PORT" "$WALK_DIR/server.log"
if grep -qE "0\.0\.0\.0|\*:$WALK_PORT" "$WALK_DIR/server.log"; then fail "server log mentions a non-loopback bind address"; else pass "no non-loopback bind address in the server log"; fi
run_logged "http-walkthrough.sh (17 steps)" bash -c "cd '$TREE' && BASE_URL='http://127.0.0.1:$WALK_PORT' TMPD_FILE='$WALK_DIR/tmpd.txt' bash '$HERE/http-walkthrough.sh'"
WALK_CODE=$?
assert_exit "http walkthrough" 0 "$WALK_CODE"
WALK_OUT="$WORK/walkthrough-output.txt"
awk '/^### CMD: .*http-walkthrough.sh/{f=1;next} /^### EXIT=/{f=0} f' "$STEP_LOG" > "$WALK_OUT"
assert_grep "spoofed x-actor-role header is ignored (server still sees CLERK)" "^role seen by server = CLERK$" "$WALK_OUT"
assert_grep "anonymous request has no identity (401)" "^status=401$" "$WALK_OUT"
assert_grep "clerk cannot sign off an export (403 INSUFFICIENT_ROLE)" "'errorCode': 'INSUFFICIENT_ROLE'" "$WALK_OUT"
assert_grep "manager approve + export seals the dossier" "export  -> EXPORTED sealed: True" "$WALK_OUT"
assert_grep "sealed dossier refuses further uploads (409)" "^status=409$" "$WALK_OUT"
assert_grep "exported manifest verifies with FULL integrity coverage" "\"integrityCoverage\": \"FULL\"" "$WALK_OUT"
assert_grep "audit hash chain readable from the first to the sealed-export event" "audit events: [0-9]+ \| first: DOSSIER_CREATED \| last: DOSSIER_SEALED_EXPORTED" "$WALK_OUT"
assert_grep "gates report machine 2/5, evidenced 0/5, SYNTHETIC_REHEARSAL, no go-live" "machine checks: 2 / 5 \| launch gates evidenced: 0 / 5 \| goForLiveCustomerData: False \| provenance: SYNTHETIC_REHEARSAL" "$WALK_OUT"
assert_grep "rehearsal bootstrap stays disabled by default (403 FEATURE_DISABLED)" "'errorCode': 'FEATURE_DISABLED'" "$WALK_OUT"
kill "$SERVER_PID" 2>/dev/null
wait "$SERVER_PID" 2>/dev/null
if curl -fsS "http://127.0.0.1:$WALK_PORT/api/health" > /dev/null 2>&1; then fail "server still listening after the walkthrough"; else pass "server stopped; port $WALK_PORT is closed again"; fi
if [ -f "$TREE/data/durios.db" ]; then fail "the walkthrough wrote an operational database into the tree"; else pass "no operational database was written into the tree"; fi
end_step

# =============================== STEP 5 — permissions & tenant isolation =====
begin_step 5 permissions-and-tenant-isolation \
  "drill-stage0.ts exits 0 (55 checks incl. 404 for an ungranted tenant, 403 for a TRADE_FINANCE grantee, grantee redaction); permission-tenant-isolation.sh exits 0 with every tenant-scoped expectation met."
run_logged "drill-stage0.ts (S1-S11, synthetic rehearsal declared explicitly)" bash -c "cd '$TREE' && DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true bun '$HERE/drill-stage0.ts'"
assert_exit "stage 0 drill" 0 $?
DRILL_ROOT=$(grep -oE "root=[^ ]*drill-stage0-[A-Za-z0-9]+" "$STEP_LOG" | head -1 | cut -d= -f2)
if [ -z "$DRILL_ROOT" ]; then DRILL_ROOT=$(grep -oE "artifacts kept at [^ ]*drill-stage0-[A-Za-z0-9]+" "$STEP_LOG" | head -1 | sed 's/^artifacts kept at //'); fi
if [ -n "$DRILL_ROOT" ] && [ -f "$DRILL_ROOT/durios.db" ]; then
  pass "drill artifacts kept at $DRILL_ROOT (needed by steps 9 and 10)"
else
  fail "could not locate the drill database; steps 9 and 10 cannot run"; DRILL_ROOT=""
fi
assert_grep "ungranted tenant gets 404 on another tenant's manifest" "PASS \| ungranted tenant cannot read the manifest \| status=404" "$STEP_LOG"
assert_grep "TRADE_FINANCE grant does not carry the sealed manifest (403)" "PASS \| TRADE_FINANCE grant does not carry the sealed manifest \| status=403" "$STEP_LOG"
assert_grep "grantee manifest redacts commercial terms and declared quantities" "PASS \| grantee manifest hides commercial terms and declared quantities" "$STEP_LOG"
assert_grep "grantee manifest states the redaction instead of hiding it" "PASS \| grantee manifest keeps reconcilable identity and states the redaction" "$STEP_LOG"
if [ -n "$DRILL_ROOT" ]; then
  run_logged "permission-tenant-isolation.sh on the drill database" bash "$HERE/permission-tenant-isolation.sh" "$DRILL_ROOT"
  assert_exit "permission & tenant isolation checks" 0 $?
  assert_grep "no other tenant's manifest leaks into an exporter's proof kit" "PASS \| TENANT-DRILL-A manifest tenants" "$STEP_LOG"
  assert_grep "an unrelated MANAGER of another tenant sees no dossiers" "PASS \| TENANT-DRILL-C exportedManifests count = 0" "$STEP_LOG"
  assert_grep "a signed override never launders a critical blocker" "PASS \| TENANT-DRILL-A the override-exported manifest still carries its critical blocker = 1" "$STEP_LOG"
  assert_grep "the permission regression tests all pass" "PASS \| no failing assertion in those files" "$STEP_LOG"
fi
end_step

# =============================== STEP 6 — synthetic mode is explicit =========
begin_step 6 synthetic-fixture-mode-is-explicit \
  "extraction-mode-demo.ts exits 0: with the flag OFF the ordinary flow extracts only byte-present values, yields zero fields from unreadable documents, refuses fixtureFields, and hits none of the 8 template canaries."
run_logged "extraction-mode-demo.ts with synthetic mode explicitly OFF" bash -c "cd '$TREE' && env -u DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION bun '$HERE/extraction-mode-demo.ts'"
assert_exit "extraction mode demo" 0 $?
assert_grep "ordinary flow reports 0 failures" "failures=0" "$STEP_LOG"
assert_grep "no template canary value ever reached a dossier (8 canaries checked)" "PASS  no template canary value appeared anywhere in the ordinary flow" "$STEP_LOG"
assert_grep "fixtureFields are refused when synthetic mode is off" "SYNTHETIC_EXTRACTION_DISABLED" "$STEP_LOG"
assert_grep "an unreadable document blocks the dossier instead of inventing values" "RUL-DOC-UNREADABLE" "$STEP_LOG"
end_step

# =============================== STEP 7 — provenance adversarial =============
begin_step 7 provenance-adversarial-attacks \
  "gate-provenance-adversarial.ts exits 0: renamed IDs (A1), a mixed cohort (B1) and an erased ledger (C1) all keep evidenced=0 and never open a launch gate; a green operational fixture cohort (B0) is the only case that may."
run_logged "gate-provenance-adversarial.ts (A0/A1/B0/B1/C1/D1)" bash -c "cd '$TREE' && bun '$HERE/gate-provenance-adversarial.ts' '$WORK/provenance'"
assert_exit "provenance adversarial proof" 0 $?
assert_grep "54 assertions, 0 failures" "== summary == checks=54 failures=0" "$STEP_LOG"
assert_grep "A1: renaming every dossier code keeps evidenced at 0/5" "PASS \| A1 .*operationalGatesEvidencedCount \| actual=0 expected=0" "$STEP_LOG"
assert_grep "A1: the ledger signal, not the dossier name, holds the gate" "PASS \| A1 → the ledger signal still holds the gate \(REHEARSAL_DOSSIER_SEEDED\)" "$STEP_LOG"
assert_grep "B1: one synthetic container in the cohort closes every gate again" "PASS \| B1 .*operationalGatesEvidencedCount \| actual=0 expected=0" "$STEP_LOG"
assert_grep "C1: erasing the ledger rows fails GATE-03 and reports UNPROVEN_LEDGER_INTEGRITY" "PASS \| C1 .*evidenceProvenance \| actual=\"UNPROVEN_LEDGER_INTEGRITY\"" "$STEP_LOG"
assert_grep "D1: declared evidence paths that are not files are refused" "PASS \| D1 → nothing was recorded as operator evidence \| actual=0 expected=0" "$STEP_LOG"
end_step

# =============================== STEP 8 — gate CLI matrix ====================
begin_step 8 gate-cli-matrix-expected-exit-codes \
  "gate-cli-matrix.sh exits 0: A1-A3 and B1-B3 exit 1 (BLOCKED is the expected result, asserted not masked), B4 is the only case that exits 0 and it does so on fixture containers with fixture evidence."
run_logged "gate-cli-matrix.sh (7 gate cases + 2 auditor calls)" bash -c "cd '$TREE' && bash '$HERE/gate-cli-matrix.sh'"
assert_exit "gate CLI matrix" 0 $?
assert_grep "all 7 cases and both auditor calls matched their expected result" "== summary == cases=7 auditorCalls=2 failures=0" "$STEP_LOG"
for c in A1 A2 A3 B1 B2 B3; do
  assert_grep "case $c exits 1 because the site is BLOCKED (expected, not masked)" "^PASS \| case $c: exit=1 " "$STEP_LOG"
done
assert_grep "case B4 is the only one allowed to exit 0" "^PASS \| case B4: exit=0 machineChecks=5 gatesEvidenced=5 provenance=OPERATIONAL goLive=true" "$STEP_LOG"
assert_grep "A3: five declared evidence files still open nothing on a synthetic cohort" "^PASS \| case A3: exit=1 machineChecks=5 gatesEvidenced=0 " "$STEP_LOG"
assert_grep "B3: evidence cannot lift a gate whose machine check fails" "^PASS \| case B3: exit=1 machineChecks=4 gatesEvidenced=4 " "$STEP_LOG"
end_step

# =============================== STEP 9 — backup / verify / restore ==========
begin_step 9 backup-verify-restore-recheck \
  "backup-restore-drill.ts exits 0 with 0 failures, and the drill's own restore checks pass: restored DB hash equals the backup manifest hash, every blob re-hashes, a one-byte blob flip is detected."
run_logged "backup-restore-drill.ts" bash -c "cd '$TREE' && DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true bun '$HERE/backup-restore-drill.ts'"
assert_exit "backup / restore drill" 0 $?
assert_grep "backup-restore drill reports 0 failures" "failures=0" "$STEP_LOG"
if [ -n "$DRILL_ROOT" ] && [ -f "$DRILL_ROOT/drill-log.txt" ]; then
  assert_grep "restored database hash equals the backup manifest hash" "PASS \| restored database hash equals the backup manifest hash" "$DRILL_ROOT/drill-log.txt"
  assert_grep "every restored blob re-hashes to its recorded SHA-256" "PASS \| post-restore: every blob re-hashed to its recorded SHA-256" "$DRILL_ROOT/drill-log.txt"
  assert_grep "flipping one byte in a stored blob is detected" "PASS \| flipping one byte in a stored blob is detected by backup verification" "$DRILL_ROOT/drill-log.txt"
  assert_grep "audit hash chain still verifies after the restore" "PASS \| post-restore: audit hash chain verifies" "$DRILL_ROOT/drill-log.txt"
  assert_grep "sealed dossier and manifest are readable after the restore" "PASS \| post-restore: sealed dossier and manifest are readable" "$DRILL_ROOT/drill-log.txt"
else
  skip "drill artifacts unavailable, so the restore re-checks could not be read (step 5 must run first)"
fi
end_step

# =============================== STEP 10 — manifest tampering ================
begin_step 10 manifest-tampering-detection \
  "the standalone verifier accepts the untouched manifest (exit 0), rejects every tampered variant (exit 1), reports PARTIAL_LEGACY without the integrity field, and the drill's 7 tamper cases all pass."
if [ -n "$DRILL_ROOT" ] && [ -f "$DRILL_ROOT/manifest-good.json" ]; then
  GOOD="$DRILL_ROOT/manifest-good.json"
  cp "$GOOD" "$WORK/manifest-good.json"
  run_logged "verify:manifest on the untouched exported manifest" bash -c "cd '$TREE' && bun run src/export/standalone-manifest-verifier.ts '$WORK/manifest-good.json'"
  assert_exit "untouched manifest" 0 $?
  assert_grep "untouched manifest reports FULL integrity coverage" "\"integrityCoverage\": \"FULL\"" "$STEP_LOG"
  python3 - "$WORK/manifest-good.json" "$WORK/manifest-tampered.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding="utf-8"))
d["verifiedDataSummary"]["lab_test_report"]["cadmium_mg_kg"] = "0.001"
json.dump(d, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
PY
  run_logged "verify:manifest after rewriting one verified cadmium value" bash -c "cd '$TREE' && bun run src/export/standalone-manifest-verifier.ts '$WORK/manifest-tampered.json'"
  assert_exit "tampered manifest (rewritten verified value)" 1 $?
  python3 - "$WORK/manifest-good.json" "$WORK/manifest-legacy.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding="utf-8"))
d.pop("manifestIntegritySha256", None)
json.dump(d, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
PY
  run_logged "verify:manifest on a legacy manifest without manifestIntegritySha256" bash -c "cd '$TREE' && bun run src/export/standalone-manifest-verifier.ts '$WORK/manifest-legacy.json'"
  assert_exit "legacy manifest (no integrity field)" 0 $?
  assert_grep "legacy manifest is reported as PARTIAL_LEGACY, never as FULL" "\"integrityCoverage\": \"PARTIAL_LEGACY\"" "$STEP_LOG"
  assert_grep "drill S4: all seven tamper cases were detected" "PASS \| tamper detected: lifecycleState reverted to DRAFT" "$DRILL_ROOT/drill-log.txt"
  TAMPER_PASSES=$(grep -c "^PASS | tamper detected:" "$DRILL_ROOT/drill-log.txt")
  if [ "$TAMPER_PASSES" -eq 7 ]; then pass "drill S4 detected 7/7 tamper cases"; else fail "drill S4 detected $TAMPER_PASSES/7 tamper cases"; fi
  assert_grep "drill S4: a legacy manifest without the integrity field still verifies as PARTIAL_LEGACY" "PASS \| legacy manifest without the integrity field still verifies but reports PARTIAL_LEGACY" "$DRILL_ROOT/drill-log.txt"
else
  skip "no drill manifest available (step 5 must run first), so manifest tampering could not be re-checked here"
fi
end_step

# ============================================== summary =====================
FINAL_FAIL=0
[ -f "$TREE/data/durios.db" ] && { fail "the harness left an operational database inside the tree"; FINAL_FAIL=1; }
SUMMARY="$LOG_DIR/HARNESS-SUMMARY.txt"
{
  printf 'DuriOS Stage 0 acceptance harness — %s\n' "$STAMP"
  printf 'tree             : %s\n' "$TREE"
  printf 'tree fingerprint : %s\n' "$FINGERPRINT"
  printf 'git HEAD         : %s\n' "$GIT_HEAD"
  printf 'archive verified : %s\n' "${ARCHIVE:-none}"
  printf '  sha256         : %s\n' "$ARCHIVE_SHA"
  printf '  bytes          : %s\n' "$ARCHIVE_BYTES"
  printf 'log dir          : %s\n' "$LOG_DIR"
  printf 'work dir         : %s%s\n' "$WORK" "$([ "$KEEP" -eq 1 ] && echo " (kept)" || echo " (removed)")"
  printf '\n%s\n' "$STEP_RESULTS"
  printf 'checks=%s failures=%s skippedSteps=%s\n' "$CHECKS" "$FAILURES" "$SKIPS"
  printf '\nInterpretation: every number in this run comes from synthetic fixture data in throwaway\n'
  printf 'directories. A green harness means the delivered tree reproduces the Stage 0 evidence;\n'
  printf 'it is NOT a launch decision and it does not authorise a pilot with real customer data.\n'
  printf 'Machine criteria never substitute for external evidence: GATE-01..GATE-05 stay PENDING\n'
  printf 'until a human records real site artifacts, and only the Founder may act on them.\n'
} > "$SUMMARY"
say ""
say "================ SUMMARY ================"
cat "$SUMMARY"
[ "$KEEP" -eq 1 ] || rm -rf "$WORK"
if [ "$FAILURES" -gt 0 ] || [ "$FINAL_FAIL" -gt 0 ]; then
  say "RESULT: FAILED — $FAILURES assertion(s) did not match the expected result"
  exit 1
fi
if [ "$SKIPS" -gt 0 ]; then
  say "RESULT: INCOMPLETE — $SKIPS step(s) could not run (see SKIP lines above); re-run with --archive <handover.tar.gz>"
  exit 3
fi
say "RESULT: ALL $CHECKS ASSERTIONS MATCHED — 10/10 steps ran"
exit 0
