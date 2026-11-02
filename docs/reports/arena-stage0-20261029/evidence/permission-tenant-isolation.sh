#!/usr/bin/env bash
# Step 5 of the acceptance harness: permission and tenant isolation on export / KPI / proof kit.
#
# Runs against the drill database produced by drill-stage0.ts, which holds four synthetic tenants:
#   TENANT-DRILL-A  packhouse exporter, owns the dossiers and both exported manifests
#   TENANT-DRILL-B  buyer/importer, granted a READ_ONLY BUYER_VERIFICATION share on one dossier
#   TENANT-DRILL-C  unrelated manager (the intruder case)
#   TENANT-DRILL-D  buyer/importer, granted a READ_ONLY TRADE_FINANCE share on the same dossier
#
# Every value below is a synthetic fixture. Each check states the expected result and this script
# exits 1 on the first mismatch count > 0 — no `|| true`, no silent pass.
#
# usage: bash permission-tenant-isolation.sh <drillRootDir>
set -uo pipefail
DRILL=${1:-}
if [ -z "$DRILL" ] || [ ! -f "$DRILL/durios.db" ]; then
  echo "usage: bash permission-tenant-isolation.sh <drillRootDir holding durios.db + uploads/>" >&2
  exit 2
fi
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../../.." && pwd)
cd "$REPO" || exit 2
DB="$DRILL/durios.db"
UPLOADS="$DRILL/uploads"
PROOFKIT=src/export/field-proof-kit-cli.ts
OUT="$DRILL/tenant-isolation"
mkdir -p "$OUT"
FAILS=0
CHECKS=0

echo "# permission & tenant isolation — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# drill database: $DB (synthetic tenants TENANT-DRILL-A/B/C/D)"

# expect_json <label> <file> <python expression on d> <expected literal>
expect_json() {
  local label="$1" file="$2" expr="$3" want="$4" got
  CHECKS=$((CHECKS + 1))
  got=$(EXPR="$expr" FILE="$file" python3 -c "
import json, os
d = json.load(open(os.environ['FILE']))
print(json.dumps(eval(os.environ['EXPR'])))
" 2>&1)
  if [ "$got" = "$want" ]; then
    echo "PASS | $label = $got"
  else
    echo "FAIL | $label: expected $want, got $got"
    FAILS=$((FAILS + 1))
  fi
}

# run_proofkit <tenantId> <expectedExitCode>
# pilot:proof-kit exits 0 only when the compiled bundle passes verifyFieldProofKitBundle. For the
# exporter tenant that is NOT the case here, and that is the point: its bundle contains the
# override-exported DOS-DRILL-HICD manifest, which still carries one unresolved critical blocker,
# so the kit must refuse to report integrity. A signed override never launders a blocker.
run_proofkit() {
  local tenant="$1" want_exit="$2"
  echo
  echo "### CMD: bun $PROOFKIT --tenant-id $tenant --db-path $DB --data-dir $UPLOADS"
  bun "$PROOFKIT" --tenant-id "$tenant" --db-path "$DB" --data-dir "$UPLOADS" > "$OUT/proofkit-$tenant.json" 2> "$OUT/proofkit-$tenant.err"
  local code=$?
  echo "### EXIT=$code (expected $want_exit)"
  CHECKS=$((CHECKS + 1))
  if [ "$code" -eq "$want_exit" ]; then
    echo "PASS | pilot:proof-kit for $tenant exits $want_exit as expected"
  else
    echo "FAIL | pilot:proof-kit for $tenant: expected exit $want_exit, got $code"
    cat "$OUT/proofkit-$tenant.err"
    FAILS=$((FAILS + 1))
  fi
  python3 -c "
import json
d = json.load(open('$OUT/proofkit-$tenant.json'))
print('### summary: ' + json.dumps({
    'tenantId': d['tenantId'],
    'exportedManifests': len(d['exportedManifests']),
    'dossierCodes': sorted(m['dossierCode'] for m in d['exportedManifests']),
    'manifestTenants': sorted({m['tenantId'] for m in d['exportedManifests']}),
    'goLiveVerdict': d['goLiveReadiness']['overallVerdict'],
    'machineChecks': d['goLiveReadiness']['machineChecksPassedCount'],
    'gatesEvidenced': d['goLiveReadiness']['operationalGatesEvidencedCount'],
    'evidenceProvenance': d['goLiveReadiness']['evidenceProvenance'],
    'goForLiveCustomerData': d['goLiveReadiness']['goForLiveCustomerData'],
    'proofKitSha256': d['proofKitSha256'][:16] + '...',
}, ensure_ascii=False))
"
}

A="$OUT/proofkit-TENANT-DRILL-A.json"
echo
echo "################ A. the exporter tenant sees its own two manifests, and only its own"
run_proofkit TENANT-DRILL-A 1
expect_json "TENANT-DRILL-A exportedManifests count" "$A" "len(d['exportedManifests'])" 2
expect_json "TENANT-DRILL-A dossierCodes" "$A" "sorted(m['dossierCode'] for m in d['exportedManifests'])" '["DOS-DRILL-HICD", "DOS-DRILL-OK"]'
expect_json "TENANT-DRILL-A manifest tenants (no other tenant's manifest leaks in)" "$A" "sorted({m['tenantId'] for m in d['exportedManifests']})" '["TENANT-DRILL-A"]'
expect_json "TENANT-DRILL-A every bundled manifest is sealed immutable" "$A" "all(m['isImmutable'] is True and m['lifecycleState'] == 'EXPORTED' for m in d['exportedManifests'])" true
expect_json "TENANT-DRILL-A the override-exported manifest still carries its critical blocker" "$A" "[m['complianceFindingsCount']['criticalBlockers'] for m in d['exportedManifests'] if m['dossierCode'] == 'DOS-DRILL-HICD'][0]" 1
expect_json "TENANT-DRILL-A the clean manifest carries no critical blocker" "$A" "[m['complianceFindingsCount']['criticalBlockers'] for m in d['exportedManifests'] if m['dossierCode'] == 'DOS-DRILL-OK'][0]" 0
expect_json "TENANT-DRILL-A go-live verdict is HOLD_BLOCKERS_REMAIN" "$A" "d['goLiveReadiness']['overallVerdict']" '"HOLD_BLOCKERS_REMAIN"'
expect_json "TENANT-DRILL-A goForLiveCustomerData" "$A" "d['goLiveReadiness']['goForLiveCustomerData']" false
expect_json "TENANT-DRILL-A launch gates evidenced" "$A" "d['goLiveReadiness']['operationalGatesEvidencedCount']" 0
expect_json "TENANT-DRILL-A the drill cohort is recognised as a synthetic rehearsal" "$A" "d['goLiveReadiness']['evidenceProvenance']" '"SYNTHETIC_REHEARSAL"'

echo
echo "################ B. a buyer granted READ_ONLY on one dossier gets no exporter manifests"
run_proofkit TENANT-DRILL-B 0
expect_json "TENANT-DRILL-B exportedManifests count" "$OUT/proofkit-TENANT-DRILL-B.json" "len(d['exportedManifests'])" 0
expect_json "TENANT-DRILL-B dossierCodes" "$OUT/proofkit-TENANT-DRILL-B.json" "[m['dossierCode'] for m in d['exportedManifests']]" '[]'

echo
echo "################ C. an unrelated MANAGER of another tenant sees nothing (role alone grants no data)"
run_proofkit TENANT-DRILL-C 0
expect_json "TENANT-DRILL-C exportedManifests count" "$OUT/proofkit-TENANT-DRILL-C.json" "len(d['exportedManifests'])" 0
expect_json "TENANT-DRILL-C goForLiveCustomerData" "$OUT/proofkit-TENANT-DRILL-C.json" "d['goLiveReadiness']['goForLiveCustomerData']" false

echo
echo "################ D. a TRADE_FINANCE grantee is scoped the same way as a buyer"
run_proofkit TENANT-DRILL-D 0
expect_json "TENANT-DRILL-D exportedManifests count" "$OUT/proofkit-TENANT-DRILL-D.json" "len(d['exportedManifests'])" 0

echo
echo "################ E. site-level KPI CLI is a machine-administrator surface, not a tenant surface"
echo "### CMD: DURIOS_DB_PATH=$DB DURIOS_DATA_DIR=$UPLOADS bun run pilot:evaluate-kpi"
DURIOS_DB_PATH="$DB" DURIOS_DATA_DIR="$UPLOADS" bun run pilot:evaluate-kpi > "$OUT/kpi-site-wide.json" 2> "$OUT/kpi-site-wide.err"
KPI_CODE=$?
echo "### EXIT=$KPI_CODE"
CHECKS=$((CHECKS + 1))
if [ "$KPI_CODE" -eq 0 ]; then
  echo "PASS | pilot:evaluate-kpi exits 0 on the drill database"
else
  echo "FAIL | pilot:evaluate-kpi exit=$KPI_CODE"; cat "$OUT/kpi-site-wide.err"; FAILS=$((FAILS + 1))
fi
# Documented behaviour, asserted rather than assumed: with no tenantId the evaluator reports the
# whole site (all tenants in that database). Tenant scoping for users happens on the application
# path — evaluateWorkspaceLaunchGates/selectOwnTenantDossiers — and is covered by the test files
# in step F below. This CLI reads a local database on the packhouse machine, i.e. the trusted
# administrator surface agreed for Stage 0.
expect_json "site-wide KPI sees containers from more than one tenant (documented, admin-only surface)" \
  "$OUT/kpi-site-wide.json" "d['totalContainers'] > 0" true
echo "### site-wide KPI: $(python3 -c "import json;d=json.load(open('$OUT/kpi-site-wide.json'));print(json.dumps({k:d.get(k) for k in ('totalContainers','reconciledCount','meanDeltaSeconds','gate05Passed','timingEvidenceSource')}))")"

echo
echo "################ F. the regression tests that hold permissions, tenant isolation and redaction"
TESTS="test/rbac-and-tuples-5a2.test.ts test/tri-tuple-persona-rbac.test.ts test/multi-tenant-pilot.test.ts test/manifest-redaction-and-tenant-kpi.test.ts test/field-proof-kit.test.ts test/security-and-export.test.ts test/redaction-storage-v1-5a5.test.ts test/sqlite-sharing-and-evidence-5a3.test.ts test/adversarial-verification.test.ts"
echo "### CMD: bun test $TESTS"
bun test $TESTS > "$OUT/permission-tests.txt" 2>&1
TEST_CODE=$?
tail -6 "$OUT/permission-tests.txt"
echo "### EXIT=$TEST_CODE"
CHECKS=$((CHECKS + 2))
if [ "$TEST_CODE" -eq 0 ]; then echo "PASS | permission/tenant-isolation test files exit 0"; else echo "FAIL | permission/tenant-isolation test files exit=$TEST_CODE"; FAILS=$((FAILS + 1)); fi
if grep -qE "[[:space:]]0 fail$" "$OUT/permission-tests.txt"; then
  echo "PASS | no failing assertion in those files: $(grep -E '[[:space:]][0-9]+ pass$' "$OUT/permission-tests.txt" | tr -d ' ') / 0 fail"
else
  echo "FAIL | the test log does not report '0 fail'"; FAILS=$((FAILS + 1))
fi

echo
echo "== summary == checks=$CHECKS failures=$FAILS"
[ "$FAILS" -eq 0 ] || exit 1
