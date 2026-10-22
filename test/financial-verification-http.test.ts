import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { getOpenCoreEditionManifest } from "../src/saas/open-core-edition-manifest.js";
import type { FinancialTestApp } from "./helpers/financial-verification-http-app.js";
import {
  COMMERCIALLY_SENSITIVE_KEYS,
  CONTAINER_NUMBERS,
  createSealedDossier,
  mintAttestationToken,
  verifyAttestationAuthentically,
} from "./helpers/financial-verification-http-fixtures.js";
import {
  startFinancialVerificationApp,
  stopFinancialVerificationApp,
} from "./helpers/financial-verification-http-app.js";

describe("Financial Verification Room: mint, public verify, and redacted dossier view", () => {
  let running: FinancialTestApp;

  beforeEach(() => {
    running = startFinancialVerificationApp();
  });

  afterEach(() => {
    stopFinancialVerificationApp(running.sqliteClient);
  });

  it("verifies an attestation over public HTTP and returns no commercial fields", async () => {
    const app = running;
    const dossierId = await createSealedDossier(app.handle, app.managerAuth, "DOS-FIN-001", CONTAINER_NUMBERS.DOS_FIN_001!);
    const token = await mintAttestationToken(app.handle, app.managerAuth, dossierId, "TRADE_FINANCE", "TENANT-BANK-1");

    const res = await verifyAttestationAuthentically(app.handle, token);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean; verificationSealBadge: string;
      data: { dossier: Record<string, unknown>; compositeSha256: string };
    };
    expect(body.success).toBe(true);
    expect(body.verificationSealBadge).toBe("FINANCIAL_ATTESTATION_VERIFIED");
    expect(body.data.compositeSha256).toMatch(/^[a-f0-9]{64}$/);
    for (const key of COMMERCIALLY_SENSITIVE_KEYS) {
      expect(body.data.dossier[key]).toBeUndefined();
    }
    expect(body.data.dossier.storagePath).toBeUndefined();
    expect(body.data.dossier.storage_path).toBeUndefined();
  });

  it("rejects a replayed token with 401 (single-use enforcement)", async () => {
    const app = running;
    const dossierId = await createSealedDossier(app.handle, app.managerAuth, "DOS-FIN-002", CONTAINER_NUMBERS.DOS_FIN_002!);
    const token = await mintAttestationToken(app.handle, app.managerAuth, dossierId, "MARINE_INSURANCE", "TENANT-INSURER-1");

    expect((await verifyAttestationAuthentically(app.handle, token)).status).toBe(200);
    const replay = await verifyAttestationAuthentically(app.handle, token);
    expect(replay.status).toBe(401);
    expect(((await replay.json()) as { reason: string }).reason).toBe("ATTESTATION_ALREADY_REDEEMED");
  });

  it("fails closed on a forged token without disclosing dossier data", async () => {
    const app = running;
    const forged = `DURIOS_ATT.${Buffer.from(JSON.stringify({ dossierId: "DOS-FIN-001" })).toString("base64url")}.${"0".repeat(64)}`;
    const res = await verifyAttestationAuthentically(app.handle, forged);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; data?: unknown };
    expect(body.success).toBe(false);
    expect(body.data).toBeUndefined();
  });

  it("rejects a mint request from a tenant that does not own the dossier", async () => {
    const app = running;
    const dossierId = await createSealedDossier(app.handle, app.managerAuth, "DOS-FIN-003", CONTAINER_NUMBERS.DOS_FIN_003!);
    const outsider = app.seedRivalTenantActor();
    const res = await app.handle(
      new Request("http://127.0.0.1/api/open-core/financial-attestation", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: outsider },
        body: JSON.stringify({ dossierId, purpose: "TRADE_FINANCE", institutionTenantId: "TENANT-BANK-1" }),
      })
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("registers MOD-ENT-03 in the open-core edition manifest", () => {
    const mod = getOpenCoreEditionManifest("EXPORTER_ENTERPRISE").modules.find((m) => m.moduleId === "MOD-ENT-03");
    expect(mod?.edition).toBe("EXPORTER_ENTERPRISE");
    expect(mod?.pathPattern).toContain("src/saas/financial-attestation-token.ts");
  });
});
