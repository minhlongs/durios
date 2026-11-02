import { afterEach, describe, expect, it } from "bun:test";
import {
  buildTwoTenantSealedDossier, disposeSealedDossierFixtures, GRANTEE_TENANT, ISO_CONTAINER, OWNER_TENANT,
} from "./helpers/two-tenant-sealed-dossier.js";

type ManifestEnvelope = {
  success: boolean;
  errorCode?: string;
  data: { verifiedDataSummary: Record<string, Record<string, unknown> | unknown>; compositeManifestSha256: string };
  redaction?: { applied: boolean; redactedKeys: string[]; quantityKeysVisible: boolean; notice: string };
};

describe("Cross-tenant manifest redaction and pilot KPI isolation (F-01, F-02)", () => {
  afterEach(() => { disposeSealedDossierFixtures(); });

  it("serves the owner the full manifest and the grantee a purpose-bound redacted view", async () => {
    const fx = await buildTwoTenantSealedDossier("BUYER_VERIFICATION");

    const ownerBody = (await (await fx.get(`/api/dossiers/${fx.dossierId}/manifest`, fx.owner)).json()) as ManifestEnvelope;
    expect(ownerBody.data.verifiedDataSummary.declaredNetWeightKg).toBe(18240);
    expect(ownerBody.redaction).toBeUndefined();

    const granteeRes = await fx.get(`/api/dossiers/${fx.dossierId}/manifest`, fx.grantee);
    expect(granteeRes.status).toBe(200);
    const granteeBody = (await granteeRes.json()) as ManifestEnvelope;

    // The commercial and quantity values the dossier view withholds were previously
    // readable straight off the manifest, defeating the 5A-5 redaction policy.
    expect(granteeBody.data.verifiedDataSummary.declaredNetWeightKg).toBeUndefined();
    expect(granteeBody.data.verifiedDataSummary.declaredBoxCount).toBeUndefined();
    const packing = granteeBody.data.verifiedDataSummary.packing_list as Record<string, unknown>;
    expect(packing.invoice_value).toBeUndefined();
    expect(packing.unit_price).toBeUndefined();
    expect(JSON.stringify(granteeBody.data)).not.toContain("92000");

    // Non-commercial identity survives: the grantee can still reconcile the container.
    expect(packing.container_number).toBe(ISO_CONTAINER);
    // Known residual gap, unchanged from the dossier view and locked by the 5A-5
    // redaction suite: quantity redaction is keyed on the declared-* field names, so the
    // same physical quantity stays readable under its document field name. Reported as
    // an observation rather than fixed here, because widening QUANTITY_KEYS would change
    // the approved dossier-view policy for every grantee.
    expect(packing.net_weight_kg).toBe("18240");
    expect(granteeBody.data.compositeManifestSha256).toHaveLength(64);
    expect(granteeBody.redaction?.applied).toBe(true);
    expect(granteeBody.redaction?.redactedKeys).toContain("declaredNetWeightKg");
    expect(granteeBody.redaction?.quantityKeysVisible).toBe(false);
    // The response must say the hash still refers to the owner's full record, or the
    // grantee recomputing it would read a false tamper signal.
    expect(granteeBody.redaction?.notice).toContain("compositeManifestSha256");
  });

  it("keeps declared quantities visible to a customs-inspection grantee", async () => {
    const fx = await buildTwoTenantSealedDossier("CUSTOMS_INSPECTION");
    const body = (await (await fx.get(`/api/dossiers/${fx.dossierId}/manifest`, fx.grantee)).json()) as ManifestEnvelope;
    expect(body.data.verifiedDataSummary.declaredNetWeightKg).toBe(18240);
    expect(body.redaction?.quantityKeysVisible).toBe(true);
    // Commercial terms stay withheld regardless of purpose.
    expect((body.data.verifiedDataSummary.packing_list as Record<string, unknown>).invoice_value).toBeUndefined();
  });

  it("refuses the manifest when the share purpose does not justify holding it", async () => {
    const fx = await buildTwoTenantSealedDossier("TRADE_FINANCE");
    const res = await fx.get(`/api/dossiers/${fx.dossierId}/manifest`, fx.grantee);
    expect(res.status).toBe(403);
    const body = (await res.json()) as ManifestEnvelope;
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe("SHARE_PURPOSE_FORBIDDEN");
    expect(JSON.stringify(body)).not.toContain("92000");
  });

  it("keeps a shared dossier out of the grantee tenant's KPI and launch gates", async () => {
    const fx = await buildTwoTenantSealedDossier("BUYER_VERIFICATION");

    const granteeKpi = (await (await fx.get("/api/pilot/kpi", fx.grantee)).json()) as { data: { totalContainers: number; containerMetrics: unknown[] } };
    expect(granteeKpi.data.totalContainers).toBe(0);
    expect(granteeKpi.data.containerMetrics).toHaveLength(0);
    // Another tenant's dossier code and container number must not appear at all.
    expect(JSON.stringify(granteeKpi.data)).not.toContain("DOS-ISO-001");
    expect(JSON.stringify(granteeKpi.data)).not.toContain(ISO_CONTAINER);

    const granteeGates = (await (await fx.get("/api/pilot/gates", fx.grantee)).json()) as {
      data: { passedCount: number; goForLiveCustomerData: boolean; kpiSummary: { totalContainers: number } } };
    expect(granteeGates.data.kpiSummary.totalContainers).toBe(0);
    expect(granteeGates.data.goForLiveCustomerData).toBe(false);
    expect(granteeGates.data.passedCount).toBeLessThan(5);

    // The owner still sees its own container, so the filter is scoping, not suppression.
    const ownerKpi = (await (await fx.get("/api/pilot/kpi", fx.owner)).json()) as { data: { totalContainers: number } };
    expect(ownerKpi.data.totalContainers).toBe(1);
    expect(OWNER_TENANT).not.toBe(GRANTEE_TENANT);
  });
});
