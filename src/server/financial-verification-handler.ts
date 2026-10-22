import type { ContainerDossier } from "../domain/types.js";
import type { AuthenticatedActor } from "../domain/types.js";
import type { FinancialVerificationPurpose } from "../saas/financial-attestation-token.js";
import type { WorkspaceLike } from "./financial-verification-context.js";
import { assertValidActor } from "../auth/rbac-policy.js";
import { jsonResponse, mapDomainErrorToResponse } from "./server-types.js";
import { buildFinancialAttestationToken } from "../saas/financial-attestation-token.js";
import { randomUUID } from "node:crypto";
import { verifyAndRedeemToken } from "./financial-verification-view.js";
import { resolveAttestationService } from "./financial-verification-context.js";
import { readJsonObject, parseMintRequestBody, parseVerificationRequestBody } from "./financial-verification-request.js";

const ATTESTATION_TTL_MS = 15 * 60 * 1000;

export type { WorkspaceLike } from "./financial-verification-context.js";
export type { MintAttestationRequestBody } from "./financial-verification-request.js";

export interface MintAttestationResponse {
  readonly token: string;
  readonly purpose: FinancialVerificationPurpose;
  readonly institutionTenantId: string;
  readonly expiresInSeconds: number;
}

export async function handleMintFinancialAttestation(
  workspace: WorkspaceLike,
  actor: AuthenticatedActor,
  req: Request
): Promise<Response> {
  try {
    assertValidActor(actor);
    const { dossierId, purpose, institutionTenantId } = parseMintRequestBody(await readJsonObject(req));
    const dossier = workspace.getRawDossier(dossierId);
    if (!dossier) throw new Error(`Dossier '${dossierId}' not found.`);
    if (dossier.tenantId !== actor.tenantId) {
      throw new Error("Only the dossier's owning tenant may mint a financial attestation.");
    }
    return jsonResponse({ success: true, data: buildMintResponse(dossier, purpose, institutionTenantId) });
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to mint financial attestation");
  }
}

export async function handleVerifyFinancialAttestation(
  workspace: WorkspaceLike,
  req: Request
): Promise<Response> {
  try {
    const token = parseVerificationRequestBody(await readJsonObject(req));
    const service = resolveAttestationService();
    const view = verifyAndRedeemToken(workspace, token, (nonce: string) => service.consumeNonce(nonce));
    return jsonResponse(view, view.success ? 200 : 401);
  } catch (err: unknown) {
    return mapDomainErrorToResponse(err, "Failed to verify financial attestation");
  }
}

function buildMintResponse(
  dossier: ContainerDossier,
  purpose: FinancialVerificationPurpose,
  institutionTenantId: string
): MintAttestationResponse {
  const issuedAt = new Date();
  const token = buildFinancialAttestationToken(
    {
      dossierId: dossier.id, ownerTenantId: dossier.tenantId, purpose, institutionTenantId,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + ATTESTATION_TTL_MS).toISOString(),
      nonce: randomUUID(),
    },
    process.env.DURIOS_FINANCIAL_ATTESTATION_SECRET ?? ""
  );
  return { token, purpose, institutionTenantId, expiresInSeconds: ATTESTATION_TTL_MS / 1000 };
}
