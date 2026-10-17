import { expect } from "bun:test";
import { routeHttpRequest } from "../../src/server/http-router.js";
import {
  buildValidDossierReadyForValidation, seedAndMakeActor, type Redaction5A5Context,
} from "./redaction-and-blobs-5a5-scenarios.js";
import {
  verifyAliasDossierAndDocumentGroups, verifyAliasSharesAndOrganicGroups, type ValidationStatusResponse,
} from "./api-v1-equivalence-5a5-alias-helpers.js";

export async function runApiV1AliasRouteGroupsScenario(ctx: Redaction5A5Context): Promise<void> {
  const { workspace } = ctx;
  const ownerAdmin = seedAndMakeActor(workspace, "TENANT-V1-OWNER", "ADMIN");
  const ownerClerk = seedAndMakeActor(workspace, "TENANT-V1-OWNER", "CLERK");
  const customsPartner = seedAndMakeActor(workspace, "TENANT-V1-CUSTOMS", "AUDITOR");

  const adminHeaders = { Authorization: `Bearer ${ownerAdmin.sessionToken}`, "content-type": "application/json" };
  const clerkHeaders = { Authorization: `Bearer ${ownerClerk.sessionToken}`, "content-type": "application/json" };

  await verifyAliasDossierAndDocumentGroups(workspace, ownerAdmin.actor, adminHeaders, clerkHeaders);

  // Group 3, 4, 5: Validate, Approve, Export, Manifest, Audit via /api/v1/...
  const readyDossier = buildValidDossierReadyForValidation(
    workspace, ownerAdmin.actor, "DOS-V1-EXPORT-READY"
  );

  const validateV1Res = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/validate`, {
      method: "POST", headers: clerkHeaders,
    })
  );
  expect(validateV1Res.status).toBe(200);
  expect(((await validateV1Res.json()) as ValidationStatusResponse).data.status).toBe("PASSED");

  // Clerk cannot approve on either /api or /api/v1 (error equivalence)
  const clerkApproveApi = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/dossiers/${readyDossier.id}/approve`, { method: "POST", headers: clerkHeaders })
  );
  const clerkApproveV1 = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/approve`, { method: "POST", headers: clerkHeaders })
  );
  expect(clerkApproveApi.status).toBe(403);
  expect(clerkApproveV1.status).toBe(403);
  expect(await clerkApproveV1.json()).toEqual(await clerkApproveApi.json());

  // Group 6 & 7 before sealing: Shares & Organic Evidence via /api/v1/...
  const shareGrantId = await verifyAliasSharesAndOrganicGroups(
    workspace, readyDossier.id, adminHeaders, customsPartner.sessionToken
  );

  // Approve & Export via /api/v1/...
  const approveV1Res = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/approve`, { method: "POST", headers: adminHeaders })
  );
  expect(approveV1Res.status).toBe(200);

  const exportV1Res = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/export`, { method: "POST", headers: adminHeaders })
  );
  expect(exportV1Res.status).toBe(200);

  // Manifest & Audit via /api/v1/...
  const customsHeaders = { Authorization: `Bearer ${customsPartner.sessionToken}` };
  const manifestApi = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/dossiers/${readyDossier.id}/manifest`, { headers: customsHeaders })
  );
  const manifestV1 = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/manifest`, { headers: customsHeaders })
  );
  expect(manifestV1.status).toBe(200);
  const manifestV1Body: unknown = await manifestV1.json();
  expect(manifestV1Body).toEqual(await manifestApi.json());
  expect(JSON.stringify(manifestV1Body)).not.toContain("storagePath");
  expect(JSON.stringify(manifestV1Body)).not.toContain("storage/blobs/");

  const auditApi = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/dossiers/${readyDossier.id}/audit`, { headers: customsHeaders })
  );
  const auditV1 = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/audit`, { headers: customsHeaders })
  );
  expect(auditV1.status).toBe(200);
  expect(await auditV1.json()).toEqual(await auditApi.json());

  // Revoke share via /api/v1/...
  const revokeV1Res = await routeHttpRequest(
    workspace,
    new Request(`http://localhost:3000/api/v1/dossiers/${readyDossier.id}/shares/${shareGrantId}/revoke`, {
      method: "POST", headers: adminHeaders, body: JSON.stringify({ reason: "Completed customs check" }),
    })
  );
  expect(revokeV1Res.status).toBe(200);

  // Out-of-scope /api/v1 routes return 404
  for (const outOfScopeUrl of [
    "http://localhost:3000/api/v1/health",
    "http://localhost:3000/api/v1/auth/me",
    "http://localhost:3000/api/v1/marketplace",
    "http://localhost:3000/api/v1/escrow",
  ]) {
    const res = await routeHttpRequest(workspace, new Request(outOfScopeUrl, { headers: adminHeaders }));
    expect(res.status).toBe(404);
  }
}
