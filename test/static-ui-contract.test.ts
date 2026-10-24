import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static contract for the browser workspace (src/server/public/index.html).
 * Guards the IDs, global functions and accessibility hooks that the UI relies on,
 * and regressions found during the UI audit (alert() dialogs, non-existent finding fields).
 */
const html = readFileSync(join(process.cwd(), "src/server/public/index.html"), "utf-8");
const script = html.slice(html.indexOf("<script>"), html.lastIndexOf("</script>"));

describe("Static UI contract: index.html", () => {
  it("keeps the element IDs used by the workspace script", () => {
    const ids = [
      "actor-role", "system-status", "create-dossier-form", "inp-dossier-code", "inp-container-num",
      "inp-seal-num", "inp-gate", "inp-market", "inp-temp", "inp-weight", "inp-boxes",
      "dossier-count", "dossier-list", "workspace-main",
    ];
    for (const id of ids) {
      expect(html).toContain(`id="${id}"`);
    }
    // Field inputs keep the val-<fieldId> convention read by verifyField().
    expect(script).toContain("id=\"val-${fid}\"");
    expect(script).toContain("document.getElementById(`val-${fieldId}`)");
  });

  it("keeps the global workspace functions", () => {
    const fns = [
      "fetchApi", "loadDossierList", "handleCreateDossier", "selectDossier", "reloadWorkspace",
      "renderWorkspace", "renderFieldsTable", "renderValidationSummary", "uploadSampleDoc",
      "verifyField", "runValidation", "approveExport", "exportDossier", "checkIntegrity",
      "recordOrganicEvidence", "grantSampleShare", "revokeShareGrant",
    ];
    for (const fn of fns) {
      expect(script).toMatch(new RegExp(`(async\\s+)?function\\s+${fn}\\s*\\(`));
    }
  });

  it("calls only existing API endpoints", () => {
    for (const path of ["/api/dossiers", "/documents", "/verify", "/validate", "/approve", "/export", "/audit", "/manifest", "/api/health", "/api/auth/login", "/api/auth/me", "/organic-evidence", "/shares", "/api/v1/pilot/kpi", "/api/v1/pilot/gates"]) {
      expect(script).toContain(path);
    }
    expect(script).toContain('"x-actor-role": role');
    expect(script).toContain('"x-pilot-token"');
  });

  it("has language, viewport, skip link and live regions", () => {
    expect(html).toContain('<html lang="vi">');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('class="skip-link" href="#workspace-main"');
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain(":focus-visible");
  });

  it("labels every create-dossier control", () => {
    for (const id of ["inp-dossier-code", "inp-container-num", "inp-seal-num", "inp-gate", "inp-market", "inp-temp", "inp-weight", "inp-boxes"]) {
      expect(html).toContain(`for="${id}"`);
    }
  });

  it("does not use blocking alert() dialogs", () => {
    expect(script).not.toMatch(/(^|[^.\w])alert\(/m);
  });

  it("renders validation findings from fields that exist in the API", () => {
    expect(script).not.toContain("f.message}");
    expect(script).not.toContain("sourceAuthority");
    for (const key of ["messageVi", "ruleName", "citation", "observedValue", "thresholdValue", "legalBasis"]) {
      expect(script).toContain(`f.${key}`);
    }
  });

  it("escapes API data instead of interpolating IDs into inline handlers", () => {
    expect(script).toContain("function escapeHtml(");
    expect(script).not.toMatch(/onclick="selectDossier\('\$\{/);
    expect(script).not.toMatch(/onclick="verifyField\('\$\{/);
  });
});
