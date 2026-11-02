#!/usr/bin/env bash
# Assembles the ONE downloadable handover archive a reviewer needs, and its SHA-256.
#
#   delivery/durios-stage0-handover-<date>.tar.gz          README + reports/ + evidence/ + package/
#   delivery/durios-stage0-handover-<date>.tar.gz.sha256   checksum of the archive itself
#   (inside the archive) CHECKSUMS.txt                     checksum of every file it contains
#
# Run it AFTER package/build-package.sh and package/verify-package.sh, so the archives inside
# package/ are the verified ones. Nothing here commits, pushes or touches a remote.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../../.." && pwd)
cd "$REPO" || exit 2
DAY=$(date -u +%Y%m%d)
NAME="durios-stage0-handover-$DAY"
OUT="$HERE/delivery"
STAGE=$(mktemp -d /tmp/durios-handover-XXXXXX)
DEST="$STAGE/$NAME"

mkdir -p "$DEST/reports" "$OUT"
cp "$HERE/README-HANDOVER.md" "$DEST/"
for report in REPORT FINDINGS GATE-MATRIX VERIFICATION RUNBOOK-STAGE0-REHEARSAL UI-ACCEPTANCE-CHECKLIST; do
  cp "$HERE/$report.md" "$DEST/reports/"
done
cp -a "$HERE/evidence" "$DEST/evidence"
cp -a "$HERE/package" "$DEST/package"
rm -f "$DEST/package/APPLY-VERIFY-LOG.txt.bak"

(cd "$DEST" && find . -type f ! -name CHECKSUMS.txt | sort | xargs sha256sum > CHECKSUMS.txt)
tar --format=pax -czf "$OUT/$NAME.tar.gz" -C "$STAGE" "$NAME"
(cd "$OUT" && sha256sum "$NAME.tar.gz" > "$NAME.tar.gz.sha256")
rm -rf "$STAGE"

echo "# wrote $OUT/$NAME.tar.gz"
echo "#   bytes          : $(wc -c < "$OUT/$NAME.tar.gz")"
echo "#   entries        : $(tar -tzf "$OUT/$NAME.tar.gz" | wc -l)"
echo "#   files checksummed inside: $(tar -xzOf "$OUT/$NAME.tar.gz" "$NAME/CHECKSUMS.txt" | wc -l)"
echo "#   archive SHA-256: $(cut -d' ' -f1 "$OUT/$NAME.tar.gz.sha256")"
echo "#   verify with    : sha256sum -c $NAME.tar.gz.sha256   (then, inside: sha256sum -c CHECKSUMS.txt)"
echo
echo "# top level of the archive:"
tar -tzf "$OUT/$NAME.tar.gz" | awk -F/ 'NF<=3' | sed 's/^/#   /' | head -30
