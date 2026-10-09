import { calculateSha256 } from "../ingestion/document-hasher.js";
import type { AuditEvent, AuthenticatedActor } from "../domain/types.js";
import type { SqliteClient } from "./sqlite-client.js";

const GENESIS_HASH = "GENESIS-0000000000000000000000000000000000000000000000000000000000000000";

interface AuditRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly dossier_id: string | null;
  readonly actor_id: string;
  readonly actor_name: string;
  readonly actor_role: string;
  readonly event_type: string;
  readonly entity_type: string;
  readonly entity_id: string;
  readonly payload_before: string | null;
  readonly payload_after: string | null;
  readonly previous_hash: string;
  readonly event_hash: string;
  readonly created_at: string;
}

export class SqliteAuditLedger {
  constructor(private readonly client: SqliteClient) {}

  public recordEvent(
    actor: AuthenticatedActor,
    dossierId: string | null,
    eventType: string,
    entityType: string,
    entityId: string,
    payloadBefore: Record<string, unknown> | null,
    payloadAfter: Record<string, unknown> | null,
    forcedTimestamp?: string
  ): AuditEvent {
    const timestamp = forcedTimestamp ?? new Date().toISOString();
    const id = `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    return this.client.transaction(() => {
      const lastRow = this.client.db
        .query<{ event_hash: string }, []>(
          "SELECT event_hash FROM audit_events ORDER BY sequence_id DESC LIMIT 1"
        )
        .get();

      const previousHash = lastRow?.event_hash ?? GENESIS_HASH;

      const hashInput = JSON.stringify({
        id,
        tenantId: actor.tenantId,
        dossierId,
        actorId: actor.id,
        actorRole: actor.role,
        eventType,
        entityType,
        entityId,
        payloadBefore,
        payloadAfter,
        timestamp,
        previousHash,
      });

      const eventHash = calculateSha256(hashInput);

      this.client.db.run(
        `INSERT INTO audit_events (
          id, tenant_id, dossier_id, actor_id, actor_name, actor_role,
          event_type, entity_type, entity_id, payload_before, payload_after,
          previous_hash, event_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          actor.tenantId,
          dossierId,
          actor.id,
          actor.name,
          actor.role,
          eventType,
          entityType,
          entityId,
          payloadBefore ? JSON.stringify(payloadBefore) : null,
          payloadAfter ? JSON.stringify(payloadAfter) : null,
          previousHash,
          eventHash,
          timestamp,
        ]
      );

      const event: AuditEvent = {
        id,
        tenantId: actor.tenantId,
        dossierId: dossierId ?? "",
        actorId: actor.id,
        actorRole: actor.role,
        eventType,
        entityType,
        entityId,
        payloadBefore,
        payloadAfter,
        timestamp,
        eventHash,
        previousHash,
      };

      return Object.freeze(event);
    });
  }

  public getEventsForDossier(dossierId: string, tenantId: string): readonly AuditEvent[] {
    const rows = this.client.db
      .query<AuditRow, [string, string]>(
        `SELECT * FROM audit_events
         WHERE dossier_id = ? AND tenant_id = ?
         ORDER BY sequence_id ASC`
      )
      .all(dossierId, tenantId);

    return rows.map(mapAuditRowToEvent);
  }

  public getAllEvents(): readonly AuditEvent[] {
    const rows = this.client.db
      .query<AuditRow, []>("SELECT * FROM audit_events ORDER BY sequence_id ASC")
      .all();
    return rows.map(mapAuditRowToEvent);
  }

  public verifyIntegrity(): boolean {
    const rows = this.client.db
      .query<AuditRow, []>("SELECT * FROM audit_events ORDER BY sequence_id ASC")
      .all();

    let expectedPrev = GENESIS_HASH;
    for (const r of rows) {
      if (r.previous_hash !== expectedPrev) return false;

      const hashInput = JSON.stringify({
        id: r.id,
        tenantId: r.tenant_id,
        dossierId: r.dossier_id,
        actorId: r.actor_id,
        actorRole: r.actor_role,
        eventType: r.event_type,
        entityType: r.entity_type,
        entityId: r.entity_id,
        payloadBefore: r.payload_before ? JSON.parse(r.payload_before) : null,
        payloadAfter: r.payload_after ? JSON.parse(r.payload_after) : null,
        timestamp: r.created_at,
        previousHash: r.previous_hash,
      });

      if (calculateSha256(hashInput) !== r.event_hash) return false;
      expectedPrev = r.event_hash;
    }
    return true;
  }
}

function mapAuditRowToEvent(r: AuditRow): AuditEvent {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    dossierId: r.dossier_id ?? "",
    actorId: r.actor_id,
    actorRole: r.actor_role as any,
    eventType: r.event_type,
    entityType: r.entity_type,
    entityId: r.entity_id,
    payloadBefore: r.payload_before ? JSON.parse(r.payload_before) : null,
    payloadAfter: r.payload_after ? JSON.parse(r.payload_after) : null,
    timestamp: r.created_at,
    eventHash: r.event_hash,
    previousHash: r.previous_hash,
  };
}
