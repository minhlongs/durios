import type { ContainerDossier } from "../domain/types.js";
import type { AuthenticatedActor } from "../domain/types.js";
import type { FinancialVerificationPurpose } from "../saas/financial-attestation-token.js";
import type { WorkspaceLike } from "./financial-verification-context.js";
import { redactDossierForActor } from "../sharing/dossier-redactor.js";
import { compileExportManifest } from "../export/manifest-compiler.js";
import {
  verifyFinancialAttestationToken,
  type FinancialAttestationVerification,
} from "../saas/financial-attestation-token.js";

export interface FinancialDossierView {
  readonly dossier: ContainerDossier;
  readonly sealVerified: boolean;
  readonly compositeSha256: string;
}

export interface FinancialVerificationResponse {
  readonly success: boolean;
  readonly verificationSealBadge: string;
  readonly purpose?: FinancialVerificationPurpose | undefined;
  readonly compositeSha256?: string | undefined;
  readonly data?: FinancialDossierView | undefined;
  readonly reason?: string | undefined;
}

function buildInstitutionActor(): AuthenticatedActor {
  return {
    id: "FINANCIAL_INSTITUTION_ANONYMOUS",
    tenantId: "FININST_ANONYMOUS",
    role: "VIEWER",
    name: "Anonymous Financial Institution",
    tenantType: "BUYER_IMPORTER",
    persona: "BUYER_VIEWER",
  };
}

/**
 * Builds the view a financial institution receives. The institution is modelled as a
 * cross-tenant viewer holding no share grant, so the shared redactor strips commercial
 * fields (invoice value, buyer name, exporter margin) and blob storage paths.
 */
export function buildRedactedFinancialView(
  workspace: WorkspaceLike,
  dossier: ContainerDossier
): FinancialDossierView {
  const institutionActor = buildInstitutionActor();
  const redacted = redactDossierForActor(dossier, institutionActor, workspace.shareManager);
  const manifest = compileExportManifest(redacted, institutionActor);
  return {
    dossier: redacted,
    sealVerified: manifest.documents.length > 0,
    compositeSha256: manifest.compositeManifestSha256,
  };
}

function reject(reason: string): FinancialVerificationResponse {
  return { success: false, verificationSealBadge: "UNVERIFIED_ATTESTATION", reason };
}

export function verifyAndRedeemToken(
  workspace: WorkspaceLike,
  token: string,
  burnNonce: (nonce: string) => boolean
): FinancialVerificationResponse {
  const secret = process.env.DURIOS_FINANCIAL_ATTESTATION_SECRET ?? "";
  const verification: FinancialAttestationVerification = verifyFinancialAttestationToken(token, secret);
  if (!verification.valid || !verification.payload) return reject(verification.reason);
  if (!burnNonce(verification.payload.nonce)) {
    return reject("ATTESTATION_ALREADY_REDEEMED");
  }
  const dossier = workspace.getRawDossier(verification.payload.dossierId);
  if (!dossier) return reject("ATTESTED_DOSSIER_NOT_FOUND");
  const view = buildRedactedFinancialView(workspace, dossier);
  return {
    success: true,
    verificationSealBadge: "FINANCIAL_ATTESTATION_VERIFIED",
    purpose: verification.payload.purpose,
    compositeSha256: view.compositeSha256,
    data: view,
  };
}
