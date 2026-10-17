import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStorageService } from "../../src/storage/file-storage-service.js";
import { SqliteAuditLedger } from "../../src/storage/sqlite-audit-ledger.js";
import { SqliteClient } from "../../src/storage/sqlite-client.js";
import { SqliteDossierRepository } from "../../src/storage/sqlite-dossier-repository.js";
import { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import {
  createEquivalenceHarness,
  type CompareCallFn,
  type EquivalenceActors,
} from "./api-v1-equivalence-5a5-normalizer.js";
import {
  runEquivalenceGroups1And2And6,
  type EquivalencePhase1State,
} from "./api-v1-equivalence-5a5-strict-groups-a.js";

async function runEquivalenceGroups7And3To5AndRevoke(
  actors: EquivalenceActors,
  compareCall: CompareCallFn,
  state: EquivalencePhase1State
): Promise<void> {
  const {
    ownerAdmin,
    ownerClerk,
    ownerViewer,
    sharedCustomsClerk,
    sharedLogisticsViewer,
    intruderAdmin,
  } = actors;
  const { dosApiId, dosV1Id, docsApi, docsV1, docPayloads, grantCustomsApiId, grantCustomsV1Id } =
    state;

  // GROUP 7: Organic Evidence (POST/GET .../organic-evidence)
  const validOrganicBody = {
    certifierName: "Demo Organic Certifier Lab (Synthetic)",
    certifierAccreditationNumber: "SYNTH-ACC-77",
    certificateNumber: "SYNTH-ORG-EQ-001",
    standardCode: "TCVN_11041",
    standardDescription: "TCVN 11041 Organic Standard (Synthetic)",
    certifiedScope: "Fresh Durian Fruit",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2028-12-31T23:59:59.000Z",
    issuingDate: "2026-01-01",
    issuerClaimedStatus: "CERTIFIED",
  };

  const orgApi = `/dossiers/${dosApiId}/organic-evidence`;
  const orgV1 = `/dossiers/${dosV1Id}/organic-evidence`;
  await compareCall(orgApi, orgV1, "POST", ownerViewer, validOrganicBody, 403);
  await compareCall(orgApi, orgV1, "POST", sharedCustomsClerk, validOrganicBody, 403);
  await compareCall(orgApi, orgV1, "POST", intruderAdmin, validOrganicBody, 403);
  await compareCall(orgApi, orgV1, "POST", ownerClerk, { ...validOrganicBody, issuerClaimedStatus: "EXPIRED" }, 422);
  await compareCall(orgApi, orgV1, "POST", ownerClerk, { ...validOrganicBody, duriosRecordStatus: "EVIDENCE_STORED_NOT_CERTIFIED" }, 422);
  await compareCall(orgApi, orgV1, "POST", ownerClerk, validOrganicBody, 201);

  await compareCall(orgApi, orgV1, "GET", ownerAdmin, undefined, 200);
  await compareCall(orgApi, orgV1, "GET", sharedCustomsClerk, undefined, 200);
  await compareCall(orgApi, orgV1, "GET", sharedLogisticsViewer, undefined, 403);
  await compareCall(orgApi, orgV1, "GET", intruderAdmin, undefined, 404);

  // GROUP 3: Validate (POST .../validate)
  const valApi = `/dossiers/${dosApiId}/validate`;
  const valV1 = `/dossiers/${dosV1Id}/validate`;
  await compareCall(valApi, valV1, "POST", ownerViewer, undefined, 403);
  await compareCall(valApi, valV1, "POST", sharedCustomsClerk, undefined, 403);
  await compareCall(valApi, valV1, "POST", intruderAdmin, undefined, 403);
  await compareCall(valApi, valV1, "POST", ownerClerk, undefined, 200);

  // GROUP 4: Approve & Export (POST .../approve, POST .../export)
  await compareCall(`/dossiers/${dosApiId}/manifest`, `/dossiers/${dosV1Id}/manifest`, "GET", ownerAdmin, undefined, 404);

  for (const action of ["approve", "export"]) {
    const actApi = `/dossiers/${dosApiId}/${action}`;
    const actV1 = `/dossiers/${dosV1Id}/${action}`;
    await compareCall(actApi, actV1, "POST", ownerClerk, undefined, 403);
    await compareCall(actApi, actV1, "POST", sharedCustomsClerk, undefined, 403);
    await compareCall(actApi, actV1, "POST", intruderAdmin, undefined, 403);
    await compareCall(actApi, actV1, "POST", ownerAdmin, undefined, 200);
  }

  // Post-seal 409 DOSSIER_IMMUTABLE equivalence across both prefixes
  await compareCall(`/dossiers/${dosApiId}/documents`, `/dossiers/${dosV1Id}/documents`, "POST", ownerAdmin, docPayloads[0], 409);
  await compareCall(
    `/dossiers/${dosApiId}/documents/${docsApi[0]!.id}/fields/${docsApi[0]!.extractedFields[0]!.id}/verify`,
    `/dossiers/${dosV1Id}/documents/${docsV1[0]!.id}/fields/${docsV1[0]!.extractedFields[0]!.id}/verify`,
    "POST",
    ownerAdmin,
    { confirmedValue: "MSKU1234565" },
    409
  );
  await compareCall(valApi, valV1, "POST", ownerAdmin, undefined, 409);
  await compareCall(orgApi, orgV1, "POST", ownerAdmin, validOrganicBody, 409);

  // GROUP 5: Manifest & Audit (GET .../manifest, GET .../audit)
  await compareCall(`/dossiers/${dosApiId}/manifest`, `/dossiers/${dosV1Id}/manifest`, "GET", ownerAdmin, undefined, 200);
  await compareCall(`/dossiers/${dosApiId}/manifest`, `/dossiers/${dosV1Id}/manifest`, "GET", sharedCustomsClerk, undefined, 200);
  await compareCall(`/dossiers/${dosApiId}/manifest`, `/dossiers/${dosV1Id}/manifest`, "GET", intruderAdmin, undefined, 404);

  await compareCall(`/dossiers/${dosApiId}/audit`, `/dossiers/${dosV1Id}/audit`, "GET", ownerAdmin, undefined, 200);
  await compareCall(`/dossiers/${dosApiId}/audit`, `/dossiers/${dosV1Id}/audit`, "GET", sharedCustomsClerk, undefined, 200);
  await compareCall(`/dossiers/${dosApiId}/audit`, `/dossiers/${dosV1Id}/audit`, "GET", sharedLogisticsViewer, undefined, 403);
  await compareCall(`/dossiers/${dosApiId}/audit`, `/dossiers/${dosV1Id}/audit`, "GET", intruderAdmin, undefined, 404);

  // Revoke share equivalence
  const revApi = `/dossiers/${dosApiId}/shares/${grantCustomsApiId}/revoke`;
  const revV1 = `/dossiers/${dosV1Id}/shares/${grantCustomsV1Id}/revoke`;
  await compareCall(revApi, revV1, "POST", ownerClerk, { reason: "Denied clerk revoke" }, 403);
  await compareCall(revApi, revV1, "POST", sharedCustomsClerk, { reason: "Denied grantee revoke" }, 403);
  await compareCall(revApi, revV1, "POST", intruderAdmin, { reason: "Denied intruder revoke" }, 403);
  await compareCall(revApi, revV1, "POST", ownerAdmin, { reason: "Completed customs inspection" }, 200);

  // Immediately after revoke, shared customs partner receives identical 404s on both prefixes
  await compareCall(`/dossiers/${dosApiId}`, `/dossiers/${dosV1Id}`, "GET", sharedCustomsClerk, undefined, 404);
  await compareCall(`/dossiers/${dosApiId}/manifest`, `/dossiers/${dosV1Id}/manifest`, "GET", sharedCustomsClerk, undefined, 404);
  await compareCall(`/dossiers/${dosApiId}/audit`, `/dossiers/${dosV1Id}/audit`, "GET", sharedCustomsClerk, undefined, 404);
  await compareCall(orgApi, orgV1, "GET", sharedCustomsClerk, undefined, 404);
}

export async function runApiVsApiV1StrictEquivalenceScenario(): Promise<void> {
  const dirApi = mkdtempSync(join(tmpdir(), "durios-5a6-eq-api-"));
  const dirV1 = mkdtempSync(join(tmpdir(), "durios-5a6-eq-v1-"));
  const clientApi = new SqliteClient({ dbPath: join(dirApi, "eq.db") });
  const clientV1 = new SqliteClient({ dbPath: join(dirV1, "eq.db") });

  const wsApi = new ContainerDossierWorkspace(
    new SqliteDossierRepository(clientApi),
    new SqliteAuditLedger(clientApi),
    new FileStorageService(join(dirApi, "uploads"))
  );
  const wsV1 = new ContainerDossierWorkspace(
    new SqliteDossierRepository(clientV1),
    new SqliteAuditLedger(clientV1),
    new FileStorageService(join(dirV1, "uploads"))
  );

  try {
    const { actors, compareCall } = createEquivalenceHarness(wsApi, wsV1);
    const state = await runEquivalenceGroups1And2And6(actors, compareCall);
    await runEquivalenceGroups7And3To5AndRevoke(actors, compareCall, state);
  } finally {
    clientApi.close();
    clientV1.close();
    rmSync(dirApi, { recursive: true, force: true });
    rmSync(dirV1, { recursive: true, force: true });
  }
}
