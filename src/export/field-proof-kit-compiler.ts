import { calculateSha256 } from "../ingestion/document-hasher.js";
import { createWorkspaceApp } from "../server/server.js";
import type { DossierExportManifest } from "../domain/types.js";
import type { GoLiveReadinessReport, CompilePilotGoLivePackOptions } from "../domain/pilot-dossier-pack-types.js";
import { compileStandaloneGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity } from "./pilot-dossier-pack-compiler.js";
import { verifyExportManifest } from "./standalone-manifest-verifier.js";
import { buildOpcCommercialQuote, type OpcCommercialPlanCode, type OpcCommercialQuote } from "../saas/invoice-template.js";

export interface FieldProofKitBundle {
  readonly proofKitVersion: "1.0.0"; readonly proofKitId: string; readonly siteCode: string;
  readonly tenantId: string; readonly compiledAt: string; readonly goLiveReadiness: GoLiveReadinessReport;
  readonly exportedManifests: readonly DossierExportManifest[]; readonly commercialQuote: OpcCommercialQuote;
  readonly proofKitSha256: string;
}

export interface CompileFieldProofKitOptions extends CompilePilotGoLivePackOptions {
  readonly tenantId?: string | undefined; readonly planCode?: OpcCommercialPlanCode | undefined;
  readonly manifestsOverride?: readonly DossierExportManifest[] | undefined;
}

function serializeProofKitCore(core: Omit<FieldProofKitBundle, "proofKitSha256">): string {
  return JSON.stringify({
    proofKitVersion: core.proofKitVersion, proofKitId: core.proofKitId, siteCode: core.siteCode,
    tenantId: core.tenantId, compiledAt: core.compiledAt, goLiveReadiness: core.goLiveReadiness,
    exportedManifests: core.exportedManifests, commercialQuote: core.commercialQuote,
  });
}

function loadExportedManifestsFromDb(tenantId: string, dbPath?: string, dataDir?: string): readonly DossierExportManifest[] {
  const app = createWorkspaceApp({ ...(dbPath ? { dbPath } : {}), ...(dataDir ? { dataDir } : {}) });
  try {
    const rows = app.sqliteClient.db
      .query<{ manifest_json: string }, [string]>(
        "SELECT manifest_json FROM export_manifests WHERE tenant_id = ? ORDER BY created_at ASC"
      ).all(tenantId);
    return rows.map((r) => JSON.parse(r.manifest_json) as DossierExportManifest);
  } finally {
    app.sqliteClient.close();
  }
}

export function compileFieldProofKitBundle(options: CompileFieldProofKitOptions = {}): FieldProofKitBundle {
  const siteCode = options.siteCode ?? "SITE-CAILAY-TIENGIANG-01";
  const tenantId = options.tenantId ?? "TENANT-CAILAY-01";
  const planCode: OpcCommercialPlanCode = options.planCode ?? "PILOT_30D_5M_VND";
  const goLiveReadiness = compileStandaloneGoLiveDossierPack("OPC-PROOF-KIT-AUDITOR", "AUDITOR", options);
  const compiledAt = options.forcedTimestamp ?? goLiveReadiness.compiledAt;
  const exportedManifests = options.manifestsOverride ?? loadExportedManifestsFromDb(tenantId, options.dbPath, options.dataDir);
  const commercialQuote = buildOpcCommercialQuote({ tenantId, siteCode, planCode, issuedAtIso: compiledAt });
  const core: Omit<FieldProofKitBundle, "proofKitSha256"> = {
    proofKitVersion: "1.0.0", proofKitId: `PROOFKIT-${siteCode}-${compiledAt.slice(0, 10)}`,
    siteCode, tenantId, compiledAt, goLiveReadiness, exportedManifests, commercialQuote,
  };
  return { ...core, proofKitSha256: calculateSha256(serializeProofKitCore(core)) };
}

export function verifyFieldProofKitBundle(bundle: FieldProofKitBundle): {
  readonly valid: boolean; readonly recomputedSha256: string;
  readonly readinessValid: boolean; readonly allManifestsValid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];
  if (!bundle || bundle.proofKitVersion !== "1.0.0") errors.push("Invalid proofKitVersion.");
  const recomputedSha256 = calculateSha256(serializeProofKitCore(bundle));
  if (recomputedSha256 !== bundle.proofKitSha256) errors.push("Top-level proofKitSha256 mismatch.");
  const readinessValid = verifyPilotGoLiveDossierPackIntegrity(bundle.goLiveReadiness);
  if (!readinessValid) errors.push("Embedded GoLiveReadinessReport failed SHA-256 integrity check.");
  const allManifestsValid = bundle.exportedManifests.every((m) => verifyExportManifest(m).valid);
  if (!allManifestsValid) errors.push("One or more exported container manifests failed cryptographic verification.");
  return { valid: errors.length === 0, recomputedSha256, readinessValid, allManifestsValid, errors };
}
