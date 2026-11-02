import { afterEach, describe, expect, it } from "bun:test";
import { ContainerDossierWorkspace } from "../src/workspace/container-dossier-workspace.js";
import { routeHttpRequest } from "../src/server/http-router.js";
import { REHEARSAL_BOOTSTRAP_ENV_FLAG } from "../src/server/rehearsal-bootstrap-guard.js";
import { verifyPilotGoLiveDossierPackIntegrity } from "../src/export/pilot-report-seal.js";
import type { GoLiveReadinessReport } from "../src/domain/pilot-dossier-pack-types.js";
import { makeMultiTenantActor } from "./helpers/multi-tenant-pilot-scenarios.js";
import { seedTestPilotActor } from "./helpers/auth-test-helper.js";

const BOOTSTRAP_URL = "http://127.0.0.1:3000/api/auth/pilot-rehearsal-bootstrap?fullGates=true&role=MANAGER";
const PILOT_TENANT = "TENANT-CAILAY-PILOT-01";

interface BootstrapEnvelope {
  readonly success: boolean;
  readonly errorCode?: string;
  readonly data?: {
    readonly evidenceProvenance: string;
    readonly passedGateCount: number;
    readonly pilotKpi: {
      readonly timingEvidenceSource: string; readonly valueMetricsProvenance: string;
      readonly aggregateValueMetrics: { readonly assumptions: readonly unknown[] };
    };
    readonly goLivePack: {
      readonly overallVerdict: string; readonly goForLiveCustomerData: boolean; readonly evidenceProvenance: string;
      readonly gates: ReadonlyArray<{ readonly statusLabel: string }>;
      readonly mandatoryDisclaimers: readonly string[];
    };
  };
}

const bootstrap = (ws: ContainerDossierWorkspace): Promise<Response> =>
  routeHttpRequest(ws, new Request(BOOTSTRAP_URL, { method: "POST" }));

describe("Unauthenticated rehearsal bootstrap and gate provenance (F-03, F-07)", () => {
  afterEach(() => { delete process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG]; });

  it("is refused by default and provisions no account, token or dossier", async () => {
    delete process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG];
    const ws = new ContainerDossierWorkspace();
    const res = await bootstrap(ws);
    // Loopback binding was the only guard, yet every process on the host, every
    // cross-origin POST and every proxy forwarding Host: 127.0.0.1 could mint MANAGER rights.
    expect(res.status).toBe(403);
    const body = (await res.json()) as BootstrapEnvelope;
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe("FEATURE_DISABLED");
    expect(res.headers.get("set-cookie")).toBeNull();
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("dpt_");
    expect(raw).not.toContain(PILOT_TENANT);
    expect(ws.listDossiers(makeMultiTenantActor(PILOT_TENANT, "MANAGER"))).toHaveLength(0);
  });

  it("runs in a declared rehearsal sandbox and never claims go-live authority", async () => {
    process.env[REHEARSAL_BOOTSTRAP_ENV_FLAG] = "true";
    const ws = new ContainerDossierWorkspace();
    const res = await bootstrap(ws);
    expect(res.status).toBe(200);
    const body = (await res.json()) as BootstrapEnvelope;
    expect(body.data?.passedGateCount).toBe(5);
    expect(body.data?.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");

    const pack = body.data?.goLivePack;
    // 5/5 on drill-fabricated evidence stays a rehearsal verdict, not a go decision.
    expect(pack?.overallVerdict).toBe("READY_FOR_PILOT_GO_LIVE");
    expect(pack?.goForLiveCustomerData).toBe(false);
    expect(pack?.evidenceProvenance).toBe("SYNTHETIC_REHEARSAL");
    expect(pack?.gates.every((g) => g.statusLabel === "PASS_SYNTHETIC_REHEARSAL")).toBe(true);
    expect(pack?.mandatoryDisclaimers.some((d) => d.includes("SYNTHETIC REHEARSAL"))).toBe(true);
    expect(pack ? verifyPilotGoLiveDossierPackIntegrity(pack as unknown as GoLiveReadinessReport) : false).toBe(true);

    // Machine timestamps are labelled as such and the economic figures stay assumptions.
    expect(body.data?.pilotKpi.timingEvidenceSource).toBe("SYSTEM_TIMESTAMPS");
    expect(body.data?.pilotKpi.valueMetricsProvenance).toBe("UNVALIDATED_ASSUMPTION");
    expect(body.data?.pilotKpi.aggregateValueMetrics.assumptions).toHaveLength(2);
  });

  it("labels an operational gate run OPERATIONAL and keeps its go-live decision honest", async () => {
    const ws = new ContainerDossierWorkspace();
    const manager = seedTestPilotActor(ws.authService, { tenantId: "TENANT-OPS", role: "MANAGER" });
    const res = await routeHttpRequest(ws, new Request("http://127.0.0.1:3000/api/pilot/gates", {
      headers: { Cookie: manager.sessionCookie },
    }));
    const gates = (await res.json()) as {
      data: { readonly passedCount: number; readonly goForLiveCustomerData: boolean; readonly evidenceProvenance: string } };
    // No consent file, no OTP provider, no verified backup, no rehearsal cohort.
    expect(gates.data.passedCount).toBeLessThan(5);
    expect(gates.data.goForLiveCustomerData).toBe(false);
    expect(gates.data.evidenceProvenance).toBe("OPERATIONAL");
  });
});
