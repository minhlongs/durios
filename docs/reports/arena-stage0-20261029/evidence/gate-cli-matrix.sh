#!/usr/bin/env bash
# Launch-gate CLI matrix, captured for docs/reports/arena-stage0-20261029/evidence/rerun-20261030/.
#
# It answers one question: what exactly does the verifier report, and when does it allow real
# customer data? Two different counts are printed for every case - machine-checkable criteria
# and launch gates cleared by recorded operator evidence - because "2/5" alone is ambiguous.
#
# Every database and every "evidence" file below is a fixture created by this script or by
# pilot:seed-rehearsal. Nothing here is a launch decision and no real customer data is used.
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../../.." && pwd)
cd "$REPO" || exit 2
ROOT=${MATRIX_ROOT:-/tmp/durios-gate-matrix}
REH="$ROOT/rehearsal"
OPS="$ROOT/operational"
VERIFIER=src/auth/pilot-launch-gate-verifier.ts
AUDITOR=src/export/field-auditor-cli.ts
export DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION=true
rm -rf "$ROOT"; mkdir -p "$ROOT" "$REH"

echo "# gate CLI matrix — $(date -u +%Y-%m-%dT%H:%M:%SZ), bun $(bun --version), repo $REPO"
echo "# HEAD $(git rev-parse HEAD) on $(git rev-parse --abbrev-ref HEAD)"

echo
echo "=== build site A: rehearsal-seeded database (pilot:seed-rehearsal, published passwords) ==="
DURIOS_DB_PATH="$REH/durios.db" DURIOS_DATA_DIR="$REH/uploads" bun "$REPO/src/auth/pilot-rehearsal-seeder.ts" \
  > "$REH/seed.json" 2> "$REH/seed.err"
echo "seeded dossiers: $(python3 -c "import json;print([d['dossierCode'] for d in json.load(open('$REH/seed.json'))['dossiers']])")"
mkdir -p "$REH/evidence"
printf '%%PDF-1.5 FIXTURE consent artifact — unsigned, written by gate-cli-matrix.sh\n' > "$REH/consent.pdf"
for g in 01 02 03 04 05; do printf '%%PDF-1.5 FIXTURE GATE-%s evidence stub — unsigned\n' "$g" > "$REH/evidence/gate-$g.pdf"; done
R="$REH" bun -e 'const R = process.env.R!; const { createSiteBackup } = await import("./src/auth/site-backup-manager.js");
  const m = createSiteBackup(`${R}/durios.db`, `${R}/uploads`, `${R}/backup`);
  console.log(`backup written: dossiers=${m.dossierCount} blobs=${m.blobs.length}`);' 2>&1 | tail -1

echo
echo "=== build site B: operational fixture cohort (test helper, codes DOS-CAILAY-OP*) ==="
R="$REH" bun "$HERE/gate-cohort-site.ts" "$OPS"

# Every case records id / exit code / both counters / provenance / go-live into results.tsv, and the
# block at the end asserts those against the expected matrix. A case that prints the wrong numbers
# fails this script (exit 1) instead of merely looking different in a log.
RESULTS="$ROOT/results.tsv"
: > "$RESULTS"
run_case() {
  local id="$1"; local label="$2"; shift 2
  echo
  echo "################ $id — $label"
  echo "### ENV: $*"
  env "$@" bun "$VERIFIER" > "$ROOT/case-$id.json" 2> "$ROOT/case-$id.err"
  local code=$?
  cat "$ROOT/case-$id.err"
  CASE_ID="$id" CASE_CODE="$code" CASE_JSON="$ROOT/case-$id.json" CASE_RESULTS="$RESULTS" python3 -c "
import json, os
d = json.load(open(os.environ['CASE_JSON']))
keys = ('evidenceProvenance','machineChecksPassedCount','operationalGatesEvidencedCount','totalGates','goForLiveCustomerData')
print('### JSON: ' + json.dumps({k: d.get(k) for k in keys}))
print('### gates: ' + json.dumps([{'id': g['gateId'], 'machine': g['machineCheck']['passed'], 'evidence': g['externalEvidence']['status'], 'verdict': g['gateVerdict'], 'label': g['statusLabel']} for g in d['gates']]))
with open(os.environ['CASE_RESULTS'], 'a') as fh:
    fh.write('\t'.join([os.environ['CASE_ID'], os.environ['CASE_CODE'], str(d['machineChecksPassedCount']),
                         str(d['operationalGatesEvidencedCount']), d['evidenceProvenance'],
                         str(d['goForLiveCustomerData']).lower()]) + '\n')
"
  echo "### EXIT=$code"
}

run_case A1 "A1 rehearsal DB, host loopback only, no evidence declared" \
  DURIOS_DB_PATH="$REH/durios.db" DURIOS_DATA_DIR="$REH/uploads" DURIOS_HOST=127.0.0.1

run_case A2 "A2 rehearsal DB, every machine check green, NO evidence declared" \
  DURIOS_DB_PATH="$REH/durios.db" DURIOS_DATA_DIR="$REH/uploads" DURIOS_HOST=127.0.0.1 \
  DURIOS_GATE01_CONSENT_FILE="$REH/consent.pdf" DURIOS_BACKUP_DIR="$REH/backup" \
  DURIOS_OTP_PROVIDER=ESMS_VN DURIOS_OTP_API_URL=https://otp.example.vn/send DURIOS_OTP_API_KEY=fixture-key-not-live

run_case A3 "A3 rehearsal DB, every machine check green, ALL FIVE evidence files declared (synthetic cohort must not open a gate)" \
  DURIOS_DB_PATH="$REH/durios.db" DURIOS_DATA_DIR="$REH/uploads" DURIOS_HOST=127.0.0.1 \
  DURIOS_GATE01_CONSENT_FILE="$REH/consent.pdf" DURIOS_BACKUP_DIR="$REH/backup" \
  DURIOS_OTP_PROVIDER=ESMS_VN DURIOS_OTP_API_URL=https://otp.example.vn/send DURIOS_OTP_API_KEY=fixture-key-not-live \
  DURIOS_GATE01_EVIDENCE_FILE="$REH/evidence/gate-01.pdf" DURIOS_GATE02_EVIDENCE_FILE="$REH/evidence/gate-02.pdf" \
  DURIOS_GATE03_EVIDENCE_FILE="$REH/evidence/gate-03.pdf" DURIOS_GATE04_EVIDENCE_FILE="$REH/evidence/gate-04.pdf" \
  DURIOS_GATE05_EVIDENCE_FILE="$REH/evidence/gate-05.pdf" \
  DURIOS_GATE_EVIDENCE_ATTESTED_BY="Fixture Recorder (gate-cli-matrix.sh — NOT a real attestation)"

run_case B1 "B1 operational fixture cohort, every machine check green, NO evidence declared" \
  DURIOS_DB_PATH="$OPS/durios.db" DURIOS_DATA_DIR="$OPS/uploads" DURIOS_HOST=127.0.0.1 \
  DURIOS_GATE01_CONSENT_FILE="$OPS/consent.pdf" DURIOS_BACKUP_DIR="$OPS/backup" \
  DURIOS_OTP_PROVIDER=ESMS_VN DURIOS_OTP_API_URL=https://otp.example.vn/send DURIOS_OTP_API_KEY=fixture-key-not-live

run_case B2 "B2 operational fixture cohort, one gate's evidence declared with a named recorder" \
  DURIOS_DB_PATH="$OPS/durios.db" DURIOS_DATA_DIR="$OPS/uploads" DURIOS_HOST=127.0.0.1 \
  DURIOS_GATE01_CONSENT_FILE="$OPS/consent.pdf" DURIOS_BACKUP_DIR="$OPS/backup" \
  DURIOS_OTP_PROVIDER=ESMS_VN DURIOS_OTP_API_URL=https://otp.example.vn/send DURIOS_OTP_API_KEY=fixture-key-not-live \
  DURIOS_GATE03_EVIDENCE_FILE="$OPS/evidence/gate-03.pdf" \
  DURIOS_GATE_EVIDENCE_ATTESTED_BY="Fixture Recorder (gate-cli-matrix.sh — NOT a real attestation)"

run_case B3 "B3 operational fixture cohort, evidence declared for a gate whose MACHINE CHECK FAILS (consent file missing)" \
  DURIOS_DB_PATH="$OPS/durios.db" DURIOS_DATA_DIR="$OPS/uploads" DURIOS_HOST=127.0.0.1 \
  DURIOS_GATE01_CONSENT_FILE="$OPS/does-not-exist.pdf" DURIOS_BACKUP_DIR="$OPS/backup" \
  DURIOS_OTP_PROVIDER=ESMS_VN DURIOS_OTP_API_URL=https://otp.example.vn/send DURIOS_OTP_API_KEY=fixture-key-not-live \
  DURIOS_GATE01_EVIDENCE_FILE="$OPS/evidence/gate-01.pdf" DURIOS_GATE02_EVIDENCE_FILE="$OPS/evidence/gate-02.pdf" \
  DURIOS_GATE03_EVIDENCE_FILE="$OPS/evidence/gate-03.pdf" DURIOS_GATE04_EVIDENCE_FILE="$OPS/evidence/gate-04.pdf" \
  DURIOS_GATE05_EVIDENCE_FILE="$OPS/evidence/gate-05.pdf" \
  DURIOS_GATE_EVIDENCE_ATTESTED_BY="Fixture Recorder (gate-cli-matrix.sh — NOT a real attestation)"

echo
echo "################ B4 operational fixture cohort, all five machine checks green AND all five evidence files declared"
echo "### NOTE: this is the ONLY case that may print goForLiveCustomerData: true / EXIT=0, and it does so on"
echo "###       FIXTURE containers with FIXTURE evidence files. It demonstrates the mechanism; it is not a"
echo "###       launch decision, and a real run additionally needs Founder sign-off on real site artifacts."
env DURIOS_DB_PATH="$OPS/durios.db" DURIOS_DATA_DIR="$OPS/uploads" DURIOS_HOST=127.0.0.1 \
  DURIOS_GATE01_CONSENT_FILE="$OPS/consent.pdf" DURIOS_BACKUP_DIR="$OPS/backup" \
  DURIOS_OTP_PROVIDER=ESMS_VN DURIOS_OTP_API_URL=https://otp.example.vn/send DURIOS_OTP_API_KEY=fixture-key-not-live \
  DURIOS_GATE01_EVIDENCE_FILE="$OPS/evidence/gate-01.pdf" DURIOS_GATE02_EVIDENCE_FILE="$OPS/evidence/gate-02.pdf" \
  DURIOS_GATE03_EVIDENCE_FILE="$OPS/evidence/gate-03.pdf" DURIOS_GATE04_EVIDENCE_FILE="$OPS/evidence/gate-04.pdf" \
  DURIOS_GATE05_EVIDENCE_FILE="$OPS/evidence/gate-05.pdf" \
  DURIOS_GATE_EVIDENCE_ATTESTED_BY="Fixture Recorder (gate-cli-matrix.sh — NOT a real attestation)" \
  bun "$VERIFIER" > "$ROOT/case-B4.json" 2> "$ROOT/case-B4.err"
B4=$?
cat "$ROOT/case-B4.err"
CASE_ID="B4" CASE_CODE="$B4" CASE_JSON="$ROOT/case-B4.json" CASE_RESULTS="$RESULTS" python3 -c "
import json, os
d = json.load(open(os.environ['CASE_JSON']))
keys = ('evidenceProvenance','machineChecksPassedCount','operationalGatesEvidencedCount','totalGates','goForLiveCustomerData')
print('### JSON: ' + json.dumps({k: d.get(k) for k in keys}))
with open(os.environ['CASE_RESULTS'], 'a') as fh:
    fh.write('\t'.join([os.environ['CASE_ID'], os.environ['CASE_CODE'], str(d['machineChecksPassedCount']),
                         str(d['operationalGatesEvidencedCount']), d['evidenceProvenance'],
                         str(d['goForLiveCustomerData']).lower()]) + '\n')
"
echo "### EXIT=$B4"

echo
echo "################ field auditor CLI (pilot:audit-pack) prints both counts on the same two databases"
echo "### NOTE: this call passes only DURIOS_DB_PATH/DATA_DIR/HOST, so the consent file, the OTP provider"
echo "###       and the backup directory are not in the environment: 2 machine checks pass (GATE-03, GATE-05)"
echo "###       and no launch gate is evidenced. The line format is the point: two counts, never one number."
AUDITOR_FAILS=0
for site in "$REH" "$OPS"; do
  echo "### CMD: DURIOS_DB_PATH=$site/durios.db DURIOS_DATA_DIR=$site/uploads bun $AUDITOR --output-dir $site/pack"
  DURIOS_DB_PATH="$site/durios.db" DURIOS_DATA_DIR="$site/uploads" DURIOS_HOST=127.0.0.1 \
    bun "$AUDITOR" --output-dir "$site/pack" > "$ROOT/auditor-$(basename "$site").txt" 2>&1
  AUD_CODE=$?
  cat "$ROOT/auditor-$(basename "$site").txt"
  echo "### EXIT=$AUD_CODE"
  # pilot:audit-pack is a REPORTING tool: exit 0 means "a pack was produced and it is internally
  # consistent". The gate decision lives in the printed verdict line, and the CLI that must exit
  # non-zero on a blocked site is pilot:verify-gates (cases A1-B3 above). Both databases here are
  # blocked (no consent file, no OTP provider, no backup dir in this environment), so the verdict
  # must be HOLD_BLOCKERS_REMAIN with 2/5 machine checks and 0/5 evidenced launch gates.
  AUD_LINE=$(grep -m1 "^\[DuriOS Field Auditor\] Site=" "$ROOT/auditor-$(basename "$site").txt")
  if [ "$AUD_CODE" -eq 0 ] && echo "$AUD_LINE" | grep -q "Verdict=HOLD_BLOCKERS_REMAIN" \
     && echo "$AUD_LINE" | grep -q "MachineChecks=2/5" && echo "$AUD_LINE" | grep -q "LaunchGatesEvidenced=0/5"; then
    echo "PASS | pilot:audit-pack on $(basename "$site"): exit 0, Verdict=HOLD_BLOCKERS_REMAIN, MachineChecks=2/5, LaunchGatesEvidenced=0/5 (expected)"
  else
    echo "FAIL | pilot:audit-pack on $(basename "$site"): exit=$AUD_CODE line=[$AUD_LINE] — expected exit 0 with Verdict=HOLD_BLOCKERS_REMAIN MachineChecks=2/5 LaunchGatesEvidenced=0/5"
    AUDITOR_FAILS=$((AUDITOR_FAILS + 1))
  fi
done
echo
echo "################ expected-result assertions (this script exits 1 if the matrix drifts)"
echo "### results.tsv (id, exit, machineChecks, gatesEvidenced, evidenceProvenance, goForLiveCustomerData):"
cat -e -t "$RESULTS" | sed 's/\$$//' | sed 's/\^I/ | /g'
FAILS=$AUDITOR_FAILS
check_case() {
  local want="$1 $2 $3 $4 $5 $6"
  local got
  got=$(awk -F'\t' -v id="$1" '$1==id {print $1" "$2" "$3" "$4" "$5" "$6}' "$RESULTS")
  if [ "$got" = "$want" ]; then
    echo "PASS | case $1: exit=$2 machineChecks=$3 gatesEvidenced=$4 provenance=$5 goLive=$6"
  else
    echo "FAIL | case $1: expected [$want] got [$got]"
    FAILS=$((FAILS + 1))
  fi
}
# A1: only GATE-03 (loopback + intact chain) and GATE-05 (5 seeded containers) can pass on a bare DB.
check_case A1 1 2 0 SYNTHETIC_REHEARSAL false
# A2: all five machine checks green on a synthetic cohort, still no launch gate evidenced.
check_case A2 1 5 0 SYNTHETIC_REHEARSAL false
# A3: + five evidence files declared by this script; a synthetic cohort opens nothing.
check_case A3 1 5 0 SYNTHETIC_REHEARSAL false
# B1: operational fixture cohort, machine checks green, nobody recorded evidence yet.
check_case B1 1 5 0 OPERATIONAL false
# B2: one gate has a real file plus a named recorder.
check_case B2 1 5 1 OPERATIONAL false
# B3: evidence cannot lift a gate whose machine check fails (consent file missing) -> 4/4.
check_case B3 1 4 4 OPERATIONAL false
# B4: the only case allowed to exit 0, and only on fixture containers with fixture evidence.
check_case B4 0 5 5 OPERATIONAL true
echo "== summary == cases=7 auditorCalls=2 failures=$FAILS"
echo
echo "artifacts kept at $ROOT (rehearsal/, operational/, case-*.json, results.tsv)"
[ "$FAILS" -eq 0 ] || exit 1
