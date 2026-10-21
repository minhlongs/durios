import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { AuditEvent, AuthenticatedActor } from "../domain/types.js";

export class AuditLedger {
  private readonly events: AuditEvent[] = [];
  private lastHash = "GENESIS-0000000000000000000000000000000000000000000000000000000000000000";

  public recordEvent(actor: AuthenticatedActor, dossierId: string, eventType: string, entityType: string, entityId: string, payloadBefore: Record<string, unknown> | null, payloadAfter: Record<string, unknown> | null, forcedTimestamp?: string): AuditEvent {
    const timestamp = forcedTimestamp ?? new Date().toISOString();
    const id = `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const hashInput = JSON.stringify({ id, tenantId: actor.tenantId, dossierId, actorId: actor.id, actorRole: actor.role, eventType, entityType, entityId, payloadBefore, payloadAfter, timestamp, previousHash: this.lastHash });
    const eventHash = calculateSha256(hashInput);
    const event: AuditEvent = { id, tenantId: actor.tenantId, dossierId, actorId: actor.id, actorRole: actor.role, eventType, entityType, entityId, payloadBefore, payloadAfter, timestamp, eventHash, previousHash: this.lastHash };
    this.events.push(Object.freeze(event));
    this.lastHash = eventHash;
    return event;
  }

  public getEventsForDossier(dossierId: string, tenantId: string): readonly AuditEvent[] { return this.events.filter((e) => e.dossierId === dossierId && e.tenantId === tenantId); }
  public getAllEvents(): readonly AuditEvent[] { return [...this.events]; }

  public verifyIntegrity(): boolean {
    let currentExpectedPrev = "GENESIS-0000000000000000000000000000000000000000000000000000000000000000";
    for (const event of this.events) {
      if (event.previousHash !== currentExpectedPrev) return false;
      const hashInput = JSON.stringify({ id: event.id, tenantId: event.tenantId, dossierId: event.dossierId, actorId: event.actorId, actorRole: event.actorRole, eventType: event.eventType, entityType: event.entityType, entityId: event.entityId, payloadBefore: event.payloadBefore, payloadAfter: event.payloadAfter, timestamp: event.timestamp, previousHash: event.previousHash });
      if (calculateSha256(hashInput) !== event.eventHash) return false;
      currentExpectedPrev = event.eventHash;
    }
    return true;
  }
}
