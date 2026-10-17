import { describe, expect, it } from "bun:test";
import { SqliteClient } from "../src/storage/sqlite-client.js";
import { SqliteAuditLedger } from "../src/storage/sqlite-audit-ledger.js";
import type { AuthenticatedActor } from "../src/domain/types.js";

const ACTOR: AuthenticatedActor = {
  id: "ACT-AUDIT-1",
  name: "Inspector Le",
  role: "MANAGER",
  tenantId: "TEN-001",
  tenantType: "PACKHOUSE_EXPORTER",
  persona: "PACKHOUSE_MANAGER",
};

describe("Phase E: Audit Hash Chain Tamper Detection", () => {
  it("passes integrity check on valid hash chain", () => {
    const client = new SqliteClient({ dbPath: ":memory:", inMemory: true });
    const ledger = new SqliteAuditLedger(client);

    ledger.recordEvent(ACTOR, "DOS-1", "DOSSIER_CREATED", "CONTAINER_DOSSIER", "DOS-1", null, { a: 1 });
    ledger.recordEvent(ACTOR, "DOS-1", "DOCUMENT_UPLOADED", "DOCUMENT", "DOC-1", null, { b: 2 });
    ledger.recordEvent(ACTOR, "DOS-1", "FIELD_VERIFIED", "FIELD", "F-1", { status: "DRAFT" }, { status: "VERIFIED" });

    expect(ledger.verifyIntegrity()).toBe(true);
    expect(ledger.getAllEvents().length).toBe(3);
    client.close();
  });

  it("detects modified payload in historical audit event", () => {
    const client = new SqliteClient({ dbPath: ":memory:", inMemory: true });
    const ledger = new SqliteAuditLedger(client);

    ledger.recordEvent(ACTOR, "DOS-1", "DOSSIER_CREATED", "CONTAINER_DOSSIER", "DOS-1", null, { a: 1 });
    const ev2 = ledger.recordEvent(ACTOR, "DOS-1", "DOCUMENT_UPLOADED", "DOCUMENT", "DOC-1", null, { b: 2 });
    ledger.recordEvent(ACTOR, "DOS-1", "FIELD_VERIFIED", "FIELD", "F-1", null, { c: 3 });

    expect(ledger.verifyIntegrity()).toBe(true);

    // Attacker modifies payload_after of ev2 directly in SQLite
    client.db.run(
      "UPDATE audit_events SET payload_after = ? WHERE id = ?",
      [JSON.stringify({ b: 9999 }), ev2.id]
    );

    expect(ledger.verifyIntegrity()).toBe(false);
    client.close();
  });

  it("detects removed event in historical audit chain", () => {
    const client = new SqliteClient({ dbPath: ":memory:", inMemory: true });
    const ledger = new SqliteAuditLedger(client);

    ledger.recordEvent(ACTOR, "DOS-1", "EVENT_1", "CONTAINER_DOSSIER", "DOS-1", null, { step: 1 });
    const ev2 = ledger.recordEvent(ACTOR, "DOS-1", "EVENT_2", "CONTAINER_DOSSIER", "DOS-1", null, { step: 2 });
    ledger.recordEvent(ACTOR, "DOS-1", "EVENT_3", "CONTAINER_DOSSIER", "DOS-1", null, { step: 3 });

    expect(ledger.verifyIntegrity()).toBe(true);

    // Attacker deletes middle event
    client.db.run("DELETE FROM audit_events WHERE id = ?", [ev2.id]);

    expect(ledger.verifyIntegrity()).toBe(false);
    client.close();
  });

  it("detects reordered events in audit chain", () => {
    const client = new SqliteClient({ dbPath: ":memory:", inMemory: true });
    const ledger = new SqliteAuditLedger(client);

    const ev1 = ledger.recordEvent(ACTOR, "DOS-1", "EVENT_1", "CONTAINER_DOSSIER", "DOS-1", null, { step: 1 });
    const ev2 = ledger.recordEvent(ACTOR, "DOS-1", "EVENT_2", "CONTAINER_DOSSIER", "DOS-1", null, { step: 2 });

    expect(ledger.verifyIntegrity()).toBe(true);

    // Swap sequence IDs to reorder
    client.db.run("UPDATE audit_events SET sequence_id = 999 WHERE id = ?", [ev1.id]);
    client.db.run("UPDATE audit_events SET sequence_id = 1 WHERE id = ?", [ev2.id]);
    client.db.run("UPDATE audit_events SET sequence_id = 2 WHERE id = ?", [ev1.id]);

    expect(ledger.verifyIntegrity()).toBe(false);
    client.close();
  });

  it("detects broken previous_hash reference", () => {
    const client = new SqliteClient({ dbPath: ":memory:", inMemory: true });
    const ledger = new SqliteAuditLedger(client);

    ledger.recordEvent(ACTOR, "DOS-1", "EVENT_1", "CONTAINER_DOSSIER", "DOS-1", null, { step: 1 });
    const ev2 = ledger.recordEvent(ACTOR, "DOS-1", "EVENT_2", "CONTAINER_DOSSIER", "DOS-1", null, { step: 2 });

    expect(ledger.verifyIntegrity()).toBe(true);

    // Tamper with previous_hash pointer
    client.db.run(
      "UPDATE audit_events SET previous_hash = ? WHERE id = ?",
      ["0000000000000000000000000000000000000000000000000000000000000000", ev2.id]
    );

    expect(ledger.verifyIntegrity()).toBe(false);
    client.close();
  });
});
