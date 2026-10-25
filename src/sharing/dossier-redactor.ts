import type { AuthenticatedActor, ContainerDossier } from "../domain/types.js";
import type { ShareAccessManager } from "./share-access-manager.js";

const ALWAYS_REDACTED_KEYS: ReadonlySet<string> = new Set([
  "invoice_value", "invoiceValue", "unit_price", "unitPrice",
  "buyer_name", "buyerName", "buyer_contact", "buyerContact",
  "commercial_contract_no", "commercialContractNo", "payment_terms", "paymentTerms",
  "exporter_margin", "exporterMargin", "customs_broker_fee", "customsBrokerFee",
  "clerkNote", "clerk_note", "storagePath", "storage_path",
  "orchard_supplier", "orchardSupplier", "farmgate_price", "farmgatePrice",
]);

export const selectiveDisclosure = {
  alwaysRedactedKeys: ALWAYS_REDACTED_KEYS,
  quantityKeys: ["declaredNetWeightKg", "declared_net_weight_kg", "declaredBoxCount", "declared_box_count"] as const,
} as const;


const QUANTITY_KEYS: ReadonlySet<string> = new Set([
  "declaredNetWeightKg", "declared_net_weight_kg",
  "declaredBoxCount", "declared_box_count",
]);

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as unknown as T;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) result[key] = cloneValue(val);
  }
  return result as T;
}

function redactObjectDeep(value: unknown, redactedKeys: ReadonlySet<string>): unknown {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value
      .filter((item) => {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          if (typeof record.fieldKey === "string" && redactedKeys.has(record.fieldKey)) return false;
        }
        return true;
      })
      .map((item) => redactObjectDeep(item, redactedKeys));
  }

  const record = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, propValue] of Object.entries(record)) {
    if (redactedKeys.has(key) || propValue === undefined) continue;
    output[key] = redactObjectDeep(propValue, redactedKeys);
  }
  return output;
}

export function redactDossierForActor(
  dossier: ContainerDossier,
  actor: AuthenticatedActor,
  shareManager: ShareAccessManager
): ContainerDossier {
  if (dossier.tenantId === actor.tenantId) return cloneValue(dossier);

  const activeGrants = shareManager.getActiveGrantsForTenant(
    dossier.id, dossier.tenantId, actor.tenantId
  );
  const canViewQuantities = activeGrants.some(
    (grant) => grant.purpose === "CUSTOMS_INSPECTION" || grant.purpose === "LOGISTICS"
  );

  const keysToRedact = new Set<string>(ALWAYS_REDACTED_KEYS);
  if (!canViewQuantities) {
    for (const qKey of QUANTITY_KEYS) keysToRedact.add(qKey);
  }
  return redactObjectDeep(dossier, keysToRedact) as ContainerDossier;
}

export function redactDossierListForActor(
  dossiers: readonly ContainerDossier[],
  actor: AuthenticatedActor,
  shareManager: ShareAccessManager
): readonly ContainerDossier[] {
  return dossiers.map((dossier) => redactDossierForActor(dossier, actor, shareManager));
}
