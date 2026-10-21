import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import type { ShareAccessGrant, SharePurpose, ShareScope } from "../domain/pilot-types.js";
import type { AuditLedgerLike } from "../workspace/workspace-types.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import { AccessControlError, assertOwnerManagementRole, assertValidActor } from "../auth/rbac-policy.js";
import { insertShareGrantRow, markShareGrantRevokedRow, queryActiveGrantsForGrantee, queryAllGrantsForOwner, queryShareGrantById } from "./share-grant-store.js";

export class ShareAccessManager {
  private readonly client: SqliteClient;
  constructor(client?: SqliteClient | undefined) {
    this.client = client ?? new SqliteClient({ dbPath: ":memory:", inMemory: true });
  }

  public grantAccess(dossier: ContainerDossier, granteeTenantId: string, purpose: SharePurpose, scope: ShareScope, expiresAt: string, actor: AuthenticatedActor, auditLedger?: AuditLedgerLike): ShareAccessGrant {
    assertOwnerManagementRole(actor, dossier.tenantId, "grantShare");
    const trimmedGrantee = granteeTenantId?.trim() ?? "";
    if (!trimmedGrantee) throw new Error("Grantee tenant ID is required.");
    if (trimmedGrantee === dossier.tenantId) throw new Error("Cannot share dossier with owning tenant itself.");
    const expiresDate = new Date(expiresAt);
    if (isNaN(expiresDate.getTime()) || expiresDate <= new Date()) throw new Error("Expiration date must be a valid future ISO timestamp.");
    const grantId = `SHR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const grant: ShareAccessGrant = { id: grantId, dossierId: dossier.id, ownerTenantId: dossier.tenantId, granteeTenantId: trimmedGrantee, purpose, scope, grantedAt: new Date().toISOString(), grantedBy: actor.id, expiresAt: expiresDate.toISOString(), isRevoked: false };
    this.client.transaction(() => {
      insertShareGrantRow(this.client, dossier, grant);
      auditLedger?.recordEvent(actor, dossier.id, "SHARE_ACCESS_GRANTED", "CONTAINER_DOSSIER", grantId, null, { granteeTenantId: grant.granteeTenantId, purpose: grant.purpose, scope: grant.scope, expiresAt: grant.expiresAt });
    });
    return grant;
  }

  public revokeAccess(grantId: string, dossier: ContainerDossier, reason: string, actor: AuthenticatedActor, auditLedger?: AuditLedgerLike): ShareAccessGrant {
    assertOwnerManagementRole(actor, dossier.tenantId, "revokeShare");
    const existing = queryShareGrantById(this.client, grantId);
    if (!existing || existing.dossierId !== dossier.id || existing.ownerTenantId !== dossier.tenantId) throw new Error(`Share grant '${grantId}' not found for dossier '${dossier.id}'.`);
    const [now, trimmedReason] = [new Date().toISOString(), reason.trim()];
    const revokedGrant: ShareAccessGrant = { ...existing, isRevoked: true, revokedAt: now, revokedBy: actor.id, revocationReason: trimmedReason };
    this.client.transaction(() => {
      markShareGrantRevokedRow(this.client, grantId, dossier.id, dossier.tenantId, now, actor.id, trimmedReason);
      auditLedger?.recordEvent(actor, dossier.id, "SHARE_ACCESS_REVOKED", "CONTAINER_DOSSIER", grantId, { isRevoked: false }, { isRevoked: true, revokedAt: now, revocationReason: trimmedReason });
    });
    return revokedGrant;
  }

  public checkAccess(
    dossierId: string, ownerTenantId: string, actorTenantId: string, referenceNow?: Date | string
  ): { hasAccess: boolean; scope?: ShareScope; grant?: ShareAccessGrant; activeGrants?: readonly ShareAccessGrant[] } {
    if (ownerTenantId === actorTenantId) return { hasAccess: true, scope: "READ_AND_VERIFY", activeGrants: [] };
    const activeGrants = this.getActiveGrantsForTenant(dossierId, ownerTenantId, actorTenantId, referenceNow);
    if (activeGrants.length === 0) return { hasAccess: false, activeGrants: [] };
    const primaryGrant = activeGrants.find((g) => g.scope === "READ_AND_VERIFY") ?? activeGrants[0]!;
    return { hasAccess: true, scope: primaryGrant.scope, grant: primaryGrant, activeGrants };
  }

  public getActiveGrantsForTenant(
    dossierId: string, ownerTenantId: string, granteeTenantId: string, referenceNow?: Date | string
  ): readonly ShareAccessGrant[] {
    const nowIso = referenceNow instanceof Date
      ? referenceNow.toISOString()
      : typeof referenceNow === "string" ? new Date(referenceNow).toISOString() : new Date().toISOString();
    return queryActiveGrantsForGrantee(this.client, dossierId, ownerTenantId, granteeTenantId, nowIso);
  }

  public assertPurposeAllowed(dossier: ContainerDossier, actor: AuthenticatedActor, allowedPurposes: readonly SharePurpose[], endpointLabel: string, referenceNow?: Date | string): void {
    assertValidActor(actor);
    if (actor.tenantId === dossier.tenantId) return;
    const activeGrants = this.getActiveGrantsForTenant(dossier.id, dossier.tenantId, actor.tenantId, referenceNow);
    if (activeGrants.length === 0) throw new AccessControlError(`Tenant '${actor.tenantId}' has no active share grant for dossier '${dossier.id}'.`, "CROSS_TENANT_FORBIDDEN");
    if (!activeGrants.some((g) => allowedPurposes.includes(g.purpose))) {
      throw new AccessControlError(`Active share grant purpose for tenant '${actor.tenantId}' does not permit access to '${endpointLabel}'. Allowed purposes: ${allowedPurposes.join(", ")}.`, "SHARE_PURPOSE_FORBIDDEN");
    }
  }

  public listGrantsForDossier(dossier: ContainerDossier, actor: AuthenticatedActor): readonly ShareAccessGrant[] {
    assertValidActor(actor);
    return actor.tenantId === dossier.tenantId
      ? queryAllGrantsForOwner(this.client, dossier.id, dossier.tenantId)
      : this.getActiveGrantsForTenant(dossier.id, dossier.tenantId, actor.tenantId);
  }
}
