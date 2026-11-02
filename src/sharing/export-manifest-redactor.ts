import type { AuthenticatedActor, DossierExportManifest } from "../domain/types.js";
import type { ShareAccessManager } from "./share-access-manager.js";
import { keysToRedactForGrantee, redactObjectDeep } from "./redaction-policy.js";

export interface RedactedExportManifest {
  readonly manifest: DossierExportManifest;
  readonly redacted: boolean;
  readonly redactedKeys: readonly string[];
  readonly quantityKeysVisible: boolean;
}

/**
 * Applies the 5A-5 redaction policy to a sealed export manifest.
 *
 * A manifest carries `verifiedDataSummary`, which mirrors every human-verified
 * document field — including the commercial keys the dossier view withholds from a
 * non-owner tenant. Serving it unredacted handed a share grantee the invoice value,
 * unit price and declared quantities of somebody else's container, so the manifest is
 * redacted with exactly the same key policy as the dossier payload.
 *
 * Redaction changes the bytes the composite hash was taken over. The caller must
 * therefore report that this is a redacted view: `compositeManifestSha256` still
 * refers to the owner's full record, and a grantee who recomputes it over the
 * redacted payload would otherwise read a false tamper signal.
 */
export function redactExportManifestForActor(
  manifest: DossierExportManifest,
  actor: AuthenticatedActor,
  shareManager: ShareAccessManager
): RedactedExportManifest {
  if (manifest.tenantId === actor.tenantId) {
    return { manifest, redacted: false, redactedKeys: [], quantityKeysVisible: true };
  }

  const activeGrants = shareManager.getActiveGrantsForTenant(
    manifest.dossierId, manifest.tenantId, actor.tenantId
  );
  const { keys, quantityKeysVisible } = keysToRedactForGrantee(activeGrants);
  const removedKeys = new Set<string>();
  const summary = redactObjectDeep(manifest.verifiedDataSummary, keys, removedKeys) as Record<string, unknown>;
  const documents = redactObjectDeep(manifest.documents, keys, removedKeys) as DossierExportManifest["documents"];
  return {
    manifest: { ...manifest, verifiedDataSummary: summary, documents },
    redacted: removedKeys.size > 0,
    redactedKeys: Array.from(removedKeys).sort(),
    quantityKeysVisible,
  };
}
