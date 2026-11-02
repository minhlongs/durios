/**
 * The 5A-5 selective-disclosure policy shared by every view a non-owner tenant can
 * read: the dossier payload, the dossier list and the sealed export manifest.
 *
 * Keeping the key sets and the deep walker in one module is what makes the manifest
 * view redact exactly what the dossier view redacts — a grantee who could read a
 * withheld key through one endpoint but not the other had found a bypass.
 */
const ALWAYS_REDACTED_KEYS: ReadonlySet<string> = new Set([
  "invoice_value", "invoiceValue", "unit_price", "unitPrice",
  "buyer_name", "buyerName", "buyer_contact", "buyerContact",
  "commercial_contract_no", "commercialContractNo", "payment_terms", "paymentTerms",
  "exporter_margin", "exporterMargin", "customs_broker_fee", "customsBrokerFee",
  "clerkNote", "clerk_note", "storagePath", "storage_path",
  "orchard_supplier", "orchardSupplier", "farmgate_price", "farmgatePrice",
]);

const QUANTITY_KEYS: ReadonlySet<string> = new Set([
  "declaredNetWeightKg", "declared_net_weight_kg",
  "declaredBoxCount", "declared_box_count",
]);

export const selectiveDisclosure = {
  alwaysRedactedKeys: ALWAYS_REDACTED_KEYS,
  quantityKeys: ["declaredNetWeightKg", "declared_net_weight_kg", "declaredBoxCount", "declared_box_count"] as const,
} as const;

export function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as unknown as T;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) result[key] = cloneValue(val);
  }
  return result as T;
}

/**
 * Removes every withheld key from a nested payload. Extracted fields are objects
 * carrying their own `fieldKey`, so an array of fields is filtered on that key as
 * well as on the property names of the objects around it. Keys that were actually
 * present and removed are collected, which lets a caller tell the reader what was
 * withheld instead of returning a silently smaller document.
 */
export function redactObjectDeep(
  value: unknown,
  redactedKeys: ReadonlySet<string>,
  removedKeys?: Set<string> | undefined
): unknown {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value
      .filter((item) => {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          const record = item as Record<string, unknown>;
          if (typeof record.fieldKey === "string" && redactedKeys.has(record.fieldKey)) {
            removedKeys?.add(record.fieldKey);
            return false;
          }
        }
        return true;
      })
      .map((item) => redactObjectDeep(item, redactedKeys, removedKeys));
  }

  const record = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, propValue] of Object.entries(record)) {
    if (redactedKeys.has(key)) {
      if (propValue !== undefined) removedKeys?.add(key);
      continue;
    }
    if (propValue === undefined) continue;
    output[key] = redactObjectDeep(propValue, redactedKeys, removedKeys);
  }
  return output;
}

/** Which keys a non-owner grantee may not see, given the purposes they were granted. */
export function keysToRedactForGrantee(
  activeGrants: ReadonlyArray<{ readonly purpose: string }>
): { readonly keys: ReadonlySet<string>; readonly quantityKeysVisible: boolean } {
  const canViewQuantities = activeGrants.some(
    (grant) => grant.purpose === "CUSTOMS_INSPECTION" || grant.purpose === "LOGISTICS"
  );
  const keys = new Set<string>(ALWAYS_REDACTED_KEYS);
  if (!canViewQuantities) {
    for (const qKey of QUANTITY_KEYS) keys.add(qKey);
  }
  return { keys, quantityKeysVisible: canViewQuantities };
}
