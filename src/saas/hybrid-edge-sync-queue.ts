import type { DossierExportManifest } from "../domain/types.js";
import { SqliteClient } from "../storage/sqlite-client.js";
import { resolveSaasSubscriptionStatus } from "./saas-tier-policy.js";

export type EdgeSyncItemStatus = "PENDING_OFFLINE" | "SYNCED_TO_CLOUD";

export interface QueuedEdgeSyncItem {
  readonly queueItemId: string;
  readonly tenantId: string;
  readonly dossierId: string;
  readonly dossierCode: string;
  readonly compositeManifestSha256: string;
  readonly queuedAt: string;
  readonly status: EdgeSyncItemStatus;
  readonly cloudSyncedAt?: string | undefined;
  readonly cloudAckReceiptHash?: string | undefined;
}

export interface EdgeSyncTransportReceipt {
  readonly ackReceiptHash: string;
  readonly syncedAt?: string | undefined;
}

export type EdgeSyncTransport = (item: QueuedEdgeSyncItem) => EdgeSyncTransportReceipt;

export interface HybridEdgeSyncQueueOptions {
  readonly sqliteClient?: SqliteClient | undefined;
  readonly transport?: EdgeSyncTransport | undefined;
}

interface EdgeSyncRow {
  readonly queue_item_id: string;
  readonly tenant_id: string;
  readonly dossier_id: string;
  readonly dossier_code: string;
  readonly composite_manifest_sha256: string;
  readonly status: EdgeSyncItemStatus;
  readonly queued_at: string;
  readonly cloud_synced_at: string | null;
  readonly cloud_ack_receipt_hash: string | null;
}

function mapRow(row: EdgeSyncRow): QueuedEdgeSyncItem {
  return {
    queueItemId: row.queue_item_id,
    tenantId: row.tenant_id,
    dossierId: row.dossier_id,
    dossierCode: row.dossier_code,
    compositeManifestSha256: row.composite_manifest_sha256,
    queuedAt: row.queued_at,
    status: row.status,
    ...(row.cloud_synced_at ? { cloudSyncedAt: row.cloud_synced_at } : {}),
    ...(row.cloud_ack_receipt_hash ? { cloudAckReceiptHash: row.cloud_ack_receipt_hash } : {}),
  };
}

export class HybridEdgeSyncQueue {
  private readonly sqliteClient: SqliteClient;
  private readonly transport?: EdgeSyncTransport | undefined;

  constructor(options: HybridEdgeSyncQueueOptions = {}) {
    this.sqliteClient = options.sqliteClient ?? new SqliteClient({ dbPath: ":memory:", inMemory: true });
    this.sqliteClient.db.run(
      "CREATE TABLE IF NOT EXISTS edge_sync_queue (queue_item_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, dossier_id TEXT NOT NULL UNIQUE, dossier_code TEXT NOT NULL, composite_manifest_sha256 TEXT NOT NULL, status TEXT NOT NULL, queued_at TEXT NOT NULL, cloud_synced_at TEXT, cloud_ack_receipt_hash TEXT)"
    );
    this.transport = options.transport;
  }

  public enqueueOfflineSealedManifest(
    manifest: DossierExportManifest,
    queuedAt = new Date().toISOString()
  ): QueuedEdgeSyncItem {
    if (manifest.lifecycleState !== "EXPORTED" || !manifest.isImmutable) {
      throw new Error("Only immutable EXPORTED manifests can be queued for edge sync.");
    }

    const existing = this.sqliteClient.db
      .query<EdgeSyncRow, [string]>("SELECT * FROM edge_sync_queue WHERE dossier_id = ? LIMIT 1")
      .get(manifest.dossierId);
    if (existing) return mapRow(existing);

    const item: QueuedEdgeSyncItem = {
      queueItemId: `SYNC-${manifest.dossierCode}`,
      tenantId: manifest.tenantId,
      dossierId: manifest.dossierId,
      dossierCode: manifest.dossierCode,
      compositeManifestSha256: manifest.compositeManifestSha256,
      queuedAt,
      status: "PENDING_OFFLINE",
    };

    this.sqliteClient.db
      .query(
        "INSERT INTO edge_sync_queue (queue_item_id, tenant_id, dossier_id, dossier_code, composite_manifest_sha256, status, queued_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(item.queueItemId, item.tenantId, item.dossierId, item.dossierCode, item.compositeManifestSha256, item.status, item.queuedAt);
    return item;
  }

  public listPendingItems(tenantId: string): readonly QueuedEdgeSyncItem[] {
    const rows = this.sqliteClient.db
      .query<EdgeSyncRow, [string]>(
        "SELECT * FROM edge_sync_queue WHERE tenant_id = ? AND status = 'PENDING_OFFLINE' ORDER BY queued_at ASC"
      )
      .all(tenantId);
    return rows.map(mapRow);
  }

  public flushPendingToCloud(
    tenantId: string,
    env: Record<string, string | undefined> = process.env,
    syncedAt = new Date().toISOString(),
    transportOverride?: EdgeSyncTransport
  ): readonly QueuedEdgeSyncItem[] {
    const sub = resolveSaasSubscriptionStatus(env, syncedAt, tenantId);
    if (!sub.licenseValid) {
      throw new Error(
        "Cloud synchronization requires an active PACKHOUSE_PRO_SAAS or EXPORTER_ENTERPRISE subscription; items remain safely stored offline."
      );
    }
    const transport = transportOverride ?? this.transport;
    if (!transport) {
      throw new Error("Edge sync transport is not configured; items remain in PENDING_OFFLINE.");
    }

    const pending = this.listPendingItems(tenantId);
    const synced: QueuedEdgeSyncItem[] = [];

    for (const item of pending) {
      const ack = transport(item);
      if (!ack || !/^[a-f0-9]{64}$/i.test(ack.ackReceiptHash)) {
        throw new Error(`Invalid cloud ack receipt hash for queue item '${item.queueItemId}'; item remains in PENDING_OFFLINE.`);
      }
      const effectiveSyncedAt = ack.syncedAt ?? syncedAt;
      const receiptHash = ack.ackReceiptHash.toLowerCase();

      this.sqliteClient.db
        .query("UPDATE edge_sync_queue SET status = 'SYNCED_TO_CLOUD', cloud_synced_at = ?, cloud_ack_receipt_hash = ? WHERE queue_item_id = ? AND tenant_id = ?")
        .run(effectiveSyncedAt, receiptHash, item.queueItemId, tenantId);

      synced.push({ ...item, status: "SYNCED_TO_CLOUD", cloudSyncedAt: effectiveSyncedAt, cloudAckReceiptHash: receiptHash });
    }
    return synced;
  }
}
