"""Human-verifies every extracted field of a dossier over HTTP and prints the new version."""
import json, os, subprocess, sys

did, base, jar = os.environ["DID"], os.environ["BASE"], os.environ["JAR"]
d = json.load(open("/tmp/walk-dossier.json"))["data"]
ver, count = d["version"], 0
for doc in d["documents"]:
    sys.stderr.write(f"  {doc['documentType']}: {len(doc['extractedFields'])} extracted fields -> " +
                     ", ".join(f"{f['fieldKey']}={f['rawValue']}" for f in doc["extractedFields"]) + "\n")
    for f in doc["extractedFields"]:
        body = json.dumps({"confirmedValue": f["rawValue"], "version": ver})
        out = subprocess.run(["curl", "-s", "-b", jar, "-X", "POST",
            f"{base}/api/dossiers/{did}/documents/{doc['id']}/fields/{f['id']}/verify",
            "-H", "content-type: application/json", "-d", body], capture_output=True, text=True).stdout
        data = json.loads(out).get("data") or {}
        ver = data.get("version", ver)
        count += 1
sys.stderr.write(f"verified {count} extracted fields\n")
print(ver)
