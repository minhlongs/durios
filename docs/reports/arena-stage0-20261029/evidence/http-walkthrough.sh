#!/usr/bin/env bash
# Stage 0 main flow over the REAL HTTP server (127.0.0.1 only), against a throwaway
# rehearsal database. Synthetic documents only. Used to produce
# docs/reports/arena-stage0-20261029/evidence/HTTP-WALKTHROUGH-LOG.txt
set -uo pipefail
B=${BASE_URL:-http://127.0.0.1:3111}
J=/tmp/walk-cookies.txt
HERE=$(cd "$(dirname "$0")" && pwd)
TMPD2=$(cat "${TMPD_FILE:-/tmp/tmpd.txt}")   # rehearsal dir holding durios.db + uploads/
rm -f "$J"

step() { printf '\n=== %s ===\n' "$1"; }
jqp() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1"; }

step "1. health"
curl -s "$B/api/health"; echo

step "2. clerk login (POST /api/auth/login)"
curl -s -c "$J" -X POST "$B/api/auth/login" -H 'content-type: application/json' \
  -d '{"username":"clerk.cailay","password":"PilotClerk#2026"}' | python3 -m json.tool | head -20

step "3. who am I — role decided by the server (GET /api/auth/me)"
curl -s -b "$J" "$B/api/auth/me" | python3 -c "import sys,json;d=json.load(sys.stdin)['data']['actor'];print(json.dumps({k:d.get(k) for k in ['id','role','tenantId','tenantType','persona']},ensure_ascii=False))"

step "4. spoofed x-actor-role header is ignored (still CLERK)"
curl -s -b "$J" -H 'x-actor-role: MANAGER' "$B/api/auth/me" | python3 -c "import sys,json;print('role seen by server =',json.load(sys.stdin)['data']['actor']['role'])"

step "5. anonymous request has no identity (no self-elevation)"
curl -s -o /dev/null -w 'status=%{http_code}\n' -H 'x-actor-role: MANAGER' "$B/api/dossiers"

step "6. create dossier (POST /api/dossiers)"
CODE="DOS-HTTPWALK-$(date +%H%M%S)"
CREATE=$(curl -s -b "$J" -X POST "$B/api/dossiers" -H 'content-type: application/json' -d '{
  "dossierCode":"'"$CODE"'","containerNumber":"CSQU3054383","sealNumber":"VN-SEAL-778811",
  "targetMarket":"CN","borderGate":"Hữu Nghị","targetTemperatureC":14,
  "declaredNetWeightKg":19000,"declaredBoxCount":950}')
echo "$CREATE" | python3 -c "import sys,json;r=json.load(sys.stdin);d=r.get('data') or {};print(json.dumps({k:d.get(k) for k in ['id','dossierCode','lifecycleState','version']},ensure_ascii=False) if d else r)"
DID=$(echo "$CREATE" | jqp "d['data']['id']")
VER=$(echo "$CREATE" | jqp "d['data']['version']")

step "7. upload 3 synthetic documents with fixture fields"
up() {
  local TYPE=$1 NAME=$2 FIELDS=$3
  local B64
  B64=$(printf '%%PDF-1.5 synthetic %s' "$NAME" | base64 | tr -d '\r\n')
  R=$(curl -s -b "$J" -X POST "$B/api/dossiers/$DID/documents" -H 'content-type: application/json' \
    -d "{\"fileName\":\"$NAME\",\"documentType\":\"$TYPE\",\"version\":$VER,\"base64Content\":\"$B64\",\"fixtureFields\":$FIELDS}")
  echo "$TYPE -> $(echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['documentId'], 'sha256='+d['sha256Hash'][:16]+'…')")"
  VER=$(echo "$R" | jqp "d['data']['version']")
}
up PACKING_LIST PackingList.pdf '{"container_number":{"raw":"CSQU3054383"},"seal_number":{"raw":"VN-SEAL-778811"},"box_count":{"raw":"950"},"net_weight_kg":{"raw":"19000"}}'
up LAB_TEST_REPORT LabTestReport.pdf '{"cadmium_mg_kg":{"raw":"0.010"},"sample_code":{"raw":"EF-2026-VN-9082"},"sampling_date":{"raw":"2026-10-06"}}'
up PHYTOSANITARY_CERTIFICATE PhytoCert.pdf '{"container_number":{"raw":"CSQU3054383"},"seal_number":{"raw":"VN-SEAL-778811"},"phyto_cert_number":{"raw":"KDTV-2026-VN-09929"}}'

step "8. human verification of every extracted field (HITL is mandatory)"
curl -s -b "$J" "$B/api/dossiers/$DID" > /tmp/walk-dossier.json
VER=$(DID="$DID" BASE="$B" JAR="$J" python3 "$HERE/verify-fields.py")
echo "version after field verification: $VER"

step "9. run validation (POST /api/dossiers/:id/validate)"
VAL=$(curl -s -b "$J" -X POST "$B/api/dossiers/$DID/validate" -H 'content-type: application/json' -d "{\"version\":$VER}")
echo "$VAL" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(json.dumps({'status':d['status'],'blockers':len(d.get('blockers') or []),'version':d['version']},ensure_ascii=False))"
VER=$(echo "$VAL" | jqp "d['data']['version']")

step "10. clerk cannot approve for export (insufficient permission)"
curl -s -o /tmp/walk-403.json -w 'status=%{http_code}\n' -b "$J" -X POST "$B/api/dossiers/$DID/approve" -H 'content-type: application/json' -d "{\"version\":$VER}"
python3 -c "import json;print(json.load(open('/tmp/walk-403.json')))"

step "11. manager login, approve, export"
MJ=/tmp/walk-cookies-mgr.txt
curl -s -c "$MJ" -X POST "$B/api/auth/login" -H 'content-type: application/json' \
  -d '{"username":"manager.cailay","password":"PilotManager#2026"}' > /dev/null
APP=$(curl -s -b "$MJ" -X POST "$B/api/dossiers/$DID/approve" -H 'content-type: application/json' -d "{\"version\":$VER}")
echo "approve -> $(echo "$APP" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['lifecycleState'], 'version', d['version'])")"
VER=$(echo "$APP" | jqp "d['data']['version']")
EXP=$(curl -s -b "$MJ" -X POST "$B/api/dossiers/$DID/export" -H 'content-type: application/json' -d "{\"version\":$VER}")
echo "export  -> $(echo "$EXP" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['lifecycleState'], 'sealed:', d.get('isImmutable'))")"

step "12. sealed dossier refuses further uploads"
curl -s -o /tmp/walk-409.json -w 'status=%{http_code}\n' -b "$MJ" -X POST "$B/api/dossiers/$DID/documents" -H 'content-type: application/json' \
  -d "{\"fileName\":\"Late.pdf\",\"documentType\":\"PACKING_LIST\",\"base64Content\":\"$(printf '%%PDF-1.5 late' | base64 | tr -d '\r\n')\"}"
python3 -c "import json;print(json.load(open('/tmp/walk-409.json')).get('error'))"

step "13. fetch the export manifest and verify it with the standalone MIT verifier"
curl -s -b "$MJ" "$B/api/dossiers/$DID/manifest" > "$TMPD2/manifest-httpwalk.json"
python3 -c "
import json;d=json.load(open('$TMPD2/manifest-httpwalk.json'))['data']
print(json.dumps({k:d.get(k) for k in ['dossierCode','lifecycleState','isImmutable','compositeManifestSha256','manifestIntegritySha256','criticalBlockers']},ensure_ascii=False,indent=2))"
python3 -c "
import json;d=json.load(open('$TMPD2/manifest-httpwalk.json'))['data'];json.dump(d,open('$TMPD2/manifest-only.json','w'))"
bun run src/export/standalone-manifest-verifier.ts "$TMPD2/manifest-only.json"; echo "verify:manifest EXIT=$?"

step "14. audit trail hash chain is readable"
curl -s -b "$MJ" "$B/api/dossiers/$DID/audit" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];e=d if isinstance(d,list) else d.get('events',[]);print('audit events:',len(e),'| first:',e[0]['eventType'] if e else '-','| last:',e[-1]['eventType'] if e else '-')"

step "15. tenant-scoped KPI and gates for this rehearsal database"
curl -s -b "$MJ" "$B/api/pilot/kpi" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(json.dumps({k:d.get(k) for k in ['totalContainers','meanDeltaSeconds','gate05Passed','timingEvidenceSource','valueMetricsProvenance']},ensure_ascii=False))"
# Two different numbers on purpose: machine-checkable criteria vs launch gates cleared by
# recorded operator evidence. A rehearsal cohort can never clear a launch gate.
curl -s -b "$MJ" "$B/api/pilot/gates" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print('machine checks:',d['machineChecksPassedCount'],'/',d['totalGates'],'| launch gates evidenced:',d['operationalGatesEvidencedCount'],'/',d['totalGates'],'| goForLiveCustomerData:',d['goForLiveCustomerData'],'| provenance:',d['evidenceProvenance']);print('per-gate:',[(g['gateId'],'machine='+str(g['machineCheck']['passed']),g['externalEvidence']['status'],g['gateVerdict']) for g in d['gates']])"

step "16. rehearsal bootstrap is refused by default (F-03)"
curl -s -o /tmp/walk-boot.json -w 'status=%{http_code}\n' -X POST "$B/api/auth/pilot-rehearsal-bootstrap?role=MANAGER"
python3 -c "import json;print(json.load(open('/tmp/walk-boot.json')))"

step "17. repository operational data untouched"
ls -la ./data 2>/dev/null || echo "no ./data directory present"
echo "walkthrough database: $TMPD2"
