import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { resolveAuthenticatedActor } from "./actor-resolver.js";
import {
  handleGetAuthenticatedMe, handleOtpChallengeRequest,
  handleOtpChallengeVerify, handlePasswordLogin,
} from "./auth-handlers.js";
import { errorResponse, jsonResponse, mapDomainErrorToResponse } from "./server-types.js";
import { serveIndexHtml } from "./static-ui.js";
import { serveStitchStaticAsset } from "./stitch-static-handler.js";
import {
  handleListDossiers, handleCreateDossier, handleGetDossier,
  handleRunValidation, handleApproveForExport, handleExportDossier, handleGetExportManifest,
} from "./dossier-handlers.js";
import {
  handleUploadDocument, handleVerifyField, handleGetAuditTrail,
} from "./document-handlers.js";
import {
  handleGrantShare, handleListShares, handleRevokeShare,
  handleRecordOrganicEvidence, handleListOrganicEvidence, handleGetPilotKpi, handleGetPilotGates,
} from "./pilot-handlers.js";
import { handleGetPilotGoLivePack } from "./pilot-dossier-pack-handler.js";
import { handleGetSaasStatus } from "./saas-status-handler.js";
import {
  handleExportWorkspacePortability, handleGetOpenCoreEditionManifest, handleVerifyWorkspacePortability,
} from "./open-core-portability-handler.js";
import { handleGetBlueprintStatus } from "./open-core-blueprint-handler.js";
import {
  handleBootstrapPilotRehearsal,
  handleGetEcosystemTelemetry,
  handleSeedAuthenticatedRehearsal,
} from "./ecosystem-rehearsal-handler.js";
import { handleVerifyIsoAndManifest } from "./open-core-verifier-handler.js";

export async function routeHttpRequest(
  workspace: ContainerDossierWorkspace,
  req: Request
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  if (method === "GET" && (path === "/" || path === "/index.html")) return serveIndexHtml();
  if (method === "GET" && path.startsWith("/stitch/")) {
    const stitchResp = serveStitchStaticAsset(path);
    if (stitchResp) return stitchResp;
  }
  if (method === "GET" && path === "/api/health") {
    return jsonResponse({ status: "healthy", service: "durios-core-api", timestamp: new Date().toISOString() });
  }
  if (method === "POST" && path === "/api/auth/login") return handlePasswordLogin(workspace.authService, req);
  if (method === "POST" && path === "/api/auth/pilot-rehearsal-bootstrap") return handleBootstrapPilotRehearsal(workspace, req);
  if (
    (method === "POST" || method === "GET") &&
    (path === "/api/v1/open-core/verify-iso-and-manifest" || path === "/api/open-core/verify-iso-and-manifest")
  ) {
    return handleVerifyIsoAndManifest(req);
  }
  if (method === "POST" && path === "/api/auth/otp/request") return handleOtpChallengeRequest(workspace.authService, req);
  if (method === "POST" && path === "/api/auth/otp/verify") return handleOtpChallengeVerify(workspace.authService, req);
  if (method === "GET" && path === "/api/auth/me") return handleGetAuthenticatedMe(workspace.authService, req);

  let actor;
  try {
    actor = resolveAuthenticatedActor(req, workspace.authService);
  } catch (err) {
    return mapDomainErrorToResponse(err, "Authentication required");
  }

  const isV1Scope =
    path.startsWith("/api/v1/dossiers") ||
    path.startsWith("/api/v1/pilot/") ||
    path.startsWith("/api/v1/saas/") ||
    path.startsWith("/api/v1/open-core/");
  const routePath = isV1Scope ? `/api/${path.slice("/api/v1/".length)}` : path;

  if (method === "GET" && routePath === "/api/pilot/kpi") return handleGetPilotKpi(workspace, actor);
  if (method === "GET" && routePath === "/api/pilot/gates") return handleGetPilotGates(workspace, actor);
  if (method === "GET" && routePath === "/api/pilot/go-live-pack") return handleGetPilotGoLivePack(workspace, actor);
  if (method === "POST" && routePath === "/api/pilot/rehearsal/seed") return handleSeedAuthenticatedRehearsal(workspace, actor);
  if (method === "GET" && routePath === "/api/saas/status") return handleGetSaasStatus(workspace, actor);
  if (method === "GET" && routePath === "/api/open-core/edition-manifest") return handleGetOpenCoreEditionManifest(workspace, actor);
  if (method === "GET" && routePath === "/api/open-core/blueprint-status") return handleGetBlueprintStatus(workspace, actor, req);
  if (method === "GET" && routePath === "/api/open-core/ecosystem-telemetry") return handleGetEcosystemTelemetry(workspace, actor);
  if (method === "GET" && routePath === "/api/open-core/portability") return handleExportWorkspacePortability(workspace, actor);
  if (method === "POST" && routePath === "/api/open-core/portability/verify") return handleVerifyWorkspacePortability(workspace, actor, req);

  if (method === "GET" && routePath === "/api/dossiers") return handleListDossiers(workspace, actor);
  if (method === "POST" && routePath === "/api/dossiers") return handleCreateDossier(workspace, actor, req);

  const dossierMatch = routePath.match(/^\/api\/dossiers\/([^/]+)$/);
  if (dossierMatch && method === "GET") return handleGetDossier(workspace, actor, dossierMatch[1]!);

  const validateMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/validate$/);
  if (validateMatch && method === "POST") return handleRunValidation(workspace, actor, validateMatch[1]!);

  const approveMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/approve$/);
  if (approveMatch && method === "POST") return handleApproveForExport(workspace, actor, approveMatch[1]!);

  const exportMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/export$/);
  if (exportMatch && method === "POST") return handleExportDossier(workspace, actor, exportMatch[1]!);

  const manifestMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/manifest$/);
  if (manifestMatch && method === "GET") return handleGetExportManifest(workspace, actor, manifestMatch[1]!);

  const auditMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/audit$/);
  if (auditMatch && method === "GET") return handleGetAuditTrail(workspace, actor, auditMatch[1]!);

  const uploadDocMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/documents$/);
  if (uploadDocMatch && method === "POST") return handleUploadDocument(workspace, actor, uploadDocMatch[1]!, req);

  const verifyFieldMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/documents\/([^/]+)\/fields\/([^/]+)\/verify$/);
  if (verifyFieldMatch && method === "POST") {
    return handleVerifyField(workspace, actor, verifyFieldMatch[1]!, verifyFieldMatch[2]!, verifyFieldMatch[3]!, req);
  }

  const revokeShareMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/shares\/([^/]+)\/revoke$/);
  if (revokeShareMatch && method === "POST") {
    return handleRevokeShare(workspace, actor, revokeShareMatch[1]!, revokeShareMatch[2]!, req);
  }

  const sharesMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/shares$/);
  if (sharesMatch) {
    if (method === "POST") return handleGrantShare(workspace, actor, sharesMatch[1]!, req);
    if (method === "GET") return handleListShares(workspace, actor, sharesMatch[1]!);
  }

  const organicMatch = routePath.match(/^\/api\/dossiers\/([^/]+)\/organic-evidence$/);
  if (organicMatch) {
    if (method === "POST") return handleRecordOrganicEvidence(workspace, actor, organicMatch[1]!, req);
    if (method === "GET") return handleListOrganicEvidence(workspace, actor, organicMatch[1]!);
  }

  return errorResponse(`Route '${method} ${path}' not found`, 404);
}
