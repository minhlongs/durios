import type { ContainerDossierWorkspace } from "../workspace/container-dossier-workspace.js";
import { resolveLocalActor } from "./actor-resolver.js";
import { errorResponse, jsonResponse } from "./server-types.js";
import { serveIndexHtml } from "./static-ui.js";
import {
  handleListDossiers,
  handleCreateDossier,
  handleGetDossier,
  handleRunValidation,
  handleApproveForExport,
  handleExportDossier,
  handleGetExportManifest,
} from "./dossier-handlers.js";
import {
  handleUploadDocument,
  handleVerifyField,
  handleGetAuditTrail,
} from "./document-handlers.js";

export async function routeHttpRequest(
  workspace: ContainerDossierWorkspace,
  req: Request
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  if (method === "GET" && (path === "/" || path === "/index.html")) {
    return serveIndexHtml();
  }

  if (method === "GET" && path === "/api/health") {
    return jsonResponse({
      status: "healthy",
      service: "durios-core-api",
      timestamp: new Date().toISOString(),
    });
  }

  const actor = resolveLocalActor(req);

  if (method === "GET" && path === "/api/dossiers") {
    return handleListDossiers(workspace, actor);
  }

  if (method === "POST" && path === "/api/dossiers") {
    return handleCreateDossier(workspace, actor, req);
  }

  const dossierMatch = path.match(/^\/api\/dossiers\/([^/]+)$/);
  if (dossierMatch && method === "GET") {
    return handleGetDossier(workspace, actor, dossierMatch[1]);
  }

  const validateMatch = path.match(/^\/api\/dossiers\/([^/]+)\/validate$/);
  if (validateMatch && method === "POST") {
    return handleRunValidation(workspace, actor, validateMatch[1]);
  }

  const approveMatch = path.match(/^\/api\/dossiers\/([^/]+)\/approve$/);
  if (approveMatch && method === "POST") {
    return handleApproveForExport(workspace, actor, approveMatch[1]);
  }

  const exportMatch = path.match(/^\/api\/dossiers\/([^/]+)\/export$/);
  if (exportMatch && method === "POST") {
    return handleExportDossier(workspace, actor, exportMatch[1]);
  }

  const manifestMatch = path.match(/^\/api\/dossiers\/([^/]+)\/manifest$/);
  if (manifestMatch && method === "GET") {
    return handleGetExportManifest(workspace, actor, manifestMatch[1]);
  }

  const auditMatch = path.match(/^\/api\/dossiers\/([^/]+)\/audit$/);
  if (auditMatch && method === "GET") {
    return handleGetAuditTrail(workspace, actor, auditMatch[1]);
  }

  const uploadDocMatch = path.match(/^\/api\/dossiers\/([^/]+)\/documents$/);
  if (uploadDocMatch && method === "POST") {
    return handleUploadDocument(workspace, actor, uploadDocMatch[1], req);
  }

  const verifyFieldMatch = path.match(
    /^\/api\/dossiers\/([^/]+)\/documents\/([^/]+)\/fields\/([^/]+)\/verify$/
  );
  if (verifyFieldMatch && method === "POST") {
    return handleVerifyField(
      workspace,
      actor,
      verifyFieldMatch[1],
      verifyFieldMatch[2],
      verifyFieldMatch[3],
      req
    );
  }

  return errorResponse(`Route '${method} ${path}' not found`, 404);
}
