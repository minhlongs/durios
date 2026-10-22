import { randomUUID } from "node:crypto";
import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import { assertOwnerManagementRole } from "../auth/rbac-policy.js";
import type { FinancialVerificationPurpose } from "./financial-attestation-token.js";
import {
  buildFinancialAttestationToken,
  verifyFinancialAttestationToken,
  type FinancialAttestationPayload,
  type FinancialAttestationVerification,
} from "./financial-attestation-token.js";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export interface FinancialAttestationMintRequest {
  readonly dossier: ContainerDossier;
  readonly purpose: FinancialVerificationPurpose;
  readonly institutionTenantId: string;
}

export class FinancialAttestationService {
  private readonly burnedNonces = new Set<string>();
  private readonly secret: string;

  constructor(secret: string) {
    const trimmed = secret?.trim() ?? "";
    if (trimmed.length < 16) {
      throw new Error("Financial attestation secret must be at least 16 characters.");
    }
    this.secret = trimmed;
  }

  public mintAttestation(request: FinancialAttestationMintRequest, actor: AuthenticatedActor): string {
    assertOwnerManagementRole(actor, request.dossier.tenantId, "mintFinancialAttestation");
    const institution = request.institutionTenantId?.trim() ?? "";
    if (!institution) throw new Error("Institution tenant ID is required.");
    if (institution === request.dossier.tenantId) {
      throw new Error("Cannot mint an attestation for the dossier's owning tenant itself.");
    }
    const issuedAt = new Date();
    const payload: FinancialAttestationPayload = {
      dossierId: request.dossier.id,
      ownerTenantId: request.dossier.tenantId,
      purpose: request.purpose,
      institutionTenantId: institution,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + TOKEN_TTL_MS).toISOString(),
      nonce: randomUUID(),
    };
    return buildFinancialAttestationToken(payload, this.secret);
  }

  public verifyAndBurn(token: string, referenceNow: Date | string = new Date()): FinancialAttestationVerification {
    const result = verifyFinancialAttestationToken(token, this.secret, referenceNow);
    if (!result.valid || !result.payload) return result;
    if (this.burnedNonces.has(result.payload.nonce)) {
      return { valid: false, reason: "ATTESTATION_ALREADY_USED", payload: result.payload };
    }
    this.burnedNonces.add(result.payload.nonce);
    return result;
  }

  public isBurned(nonce: string): boolean {
    return this.burnedNonces.has(nonce);
  }

  /**
   * Atomically claims a nonce, returning false when it was already redeemed. The check
   * and the burn happen in one call so two concurrent verifications of the same token
   * cannot both succeed.
   */
  public consumeNonce(nonce: string): boolean {
    if (this.burnedNonces.has(nonce)) return false;
    this.burnedNonces.add(nonce);
    return true;
  }
}
