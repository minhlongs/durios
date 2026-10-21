import { expect } from "bun:test";
import { routeHttpRequest } from "../../src/server/http-router.js";
import type { ContainerDossierWorkspace } from "../../src/workspace/container-dossier-workspace.js";
import { seedTestPilotActor } from "./auth-test-helper.js";
export interface ActorHeaderPair { apiHeaders: Record<string, string>; v1Headers: Record<string, string> }
export interface EquivalenceActors {
  ownerAdmin: ActorHeaderPair; ownerClerk: ActorHeaderPair; ownerViewer: ActorHeaderPair;
  sharedCustomsClerk: ActorHeaderPair; sharedCustomsViewer: ActorHeaderPair;
sharedLogisticsViewer: ActorHeaderPair; intruderAdmin: ActorHeaderPair; unauthenticated: ActorHeaderPair; }
export type CompareCallFn = <T = Record<string, unknown>>(
suffixApi: string, suffixV1: string, method: string, actorPair: ActorHeaderPair, bodyObj?: unknown, expectedStatus?: number ) => Promise<{ bodyApi: T; bodyV1: T }>;
const DYNAMIC_ID_RE = /^(DOS|DOC|FLD|SHR|ORG|EVT|AUD)-[A-Za-z0-9-]+$/;
const TIMESTAMP_KEYS = new Set(["createdAt", "updatedAt", "uploadedAt", "verifiedAt", "evaluatedAt", "exportSealedAt", "exportedAt", "grantedAt", "revokedAt", "recordedAt", "timestamp"]);
const CHAIN_HASH_KEYS = new Set(["previousHash", "eventHash", "compositeManifestSha256", "compositeSha256", "auditLedgerTailHash"]);
const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
export function createEquivalenceHarness(wsApi: ContainerDossierWorkspace, wsV1: ContainerDossierWorkspace): { actors: EquivalenceActors; compareCall: CompareCallFn } {
  const seedMatchingActor = (
id: string, username: string, tenantId: string, tenantType: "PACKHOUSE_EXPORTER" | "BUYER_IMPORTER" | "INSPECTION_AUDITOR",
role: "CLERK" | "MANAGER" | "ADMIN" | "VIEWER" | "AUDITOR", persona: "PACKHOUSE_CLERK" | "PACKHOUSE_MANAGER" | "BUYER_VIEWER" | "SYSTEM_AUDITOR"
  ): ActorHeaderPair => {
    const opts = { id, username, actorName: `Actor ${id}`, tenantId, tenantType, role, persona };
    const [a1, a2] = [seedTestPilotActor(wsApi.authService, opts), seedTestPilotActor(wsV1.authService, opts)];
    return {
apiHeaders: { Authorization: `Bearer ${a1.sessionToken}`, "content-type": "application/json" }, v1Headers: { Authorization: `Bearer ${a2.sessionToken}`, "content-type": "application/json" },
}; };
  const actors: EquivalenceActors = {
ownerAdmin: seedMatchingActor("ACT-EQ-OWN-ADM", "eq.own.adm", "TENANT-EQ-OWNER", "PACKHOUSE_EXPORTER", "ADMIN", "PACKHOUSE_MANAGER"), ownerClerk: seedMatchingActor("ACT-EQ-OWN-CLK", "eq.own.clk", "TENANT-EQ-OWNER", "PACKHOUSE_EXPORTER", "CLERK", "PACKHOUSE_CLERK"),
ownerViewer: seedMatchingActor("ACT-EQ-OWN-VWR", "eq.own.vwr", "TENANT-EQ-OWNER", "PACKHOUSE_EXPORTER", "VIEWER", "BUYER_VIEWER"), sharedCustomsClerk: seedMatchingActor("ACT-EQ-SHR-CLK", "eq.shr.clk", "TENANT-EQ-CUSTOMS", "PACKHOUSE_EXPORTER", "CLERK", "PACKHOUSE_CLERK"),
sharedCustomsViewer: seedMatchingActor("ACT-EQ-SHR-VWR", "eq.shr.vwr", "TENANT-EQ-CUSTOMS", "BUYER_IMPORTER", "VIEWER", "BUYER_VIEWER"), sharedLogisticsViewer: seedMatchingActor("ACT-EQ-LOG-VWR", "eq.log.vwr", "TENANT-EQ-LOGISTICS", "BUYER_IMPORTER", "VIEWER", "BUYER_VIEWER"),
intruderAdmin: seedMatchingActor("ACT-EQ-INT-ADM", "eq.int.adm", "TENANT-EQ-INTRUDER", "PACKHOUSE_EXPORTER", "ADMIN", "PACKHOUSE_MANAGER"), unauthenticated: { apiHeaders: { "content-type": "application/json" }, v1Headers: { "content-type": "application/json" } },
  };
  const idMapApi = new Map<string, string>();
  const idMapV1 = new Map<string, string>();
  let idSeq = 0;
  function registerIdPair(apiVal: string, v1Val: string): void {
    if (!idMapApi.has(apiVal) && !idMapV1.has(v1Val)) {
      const prefixApi = apiVal.split("-")[0];
      expect(v1Val.split("-")[0]).toBe(prefixApi);
      idSeq += 1;
      const token = `<${prefixApi}_ID_${idSeq}>`;
      idMapApi.set(apiVal, token);
idMapV1.set(v1Val, token); }
  }
  function normalizePairedValues(valApi: unknown, valV1: unknown, keyName = ""): [unknown, unknown] {
    if (Array.isArray(valApi) && Array.isArray(valV1)) {
      expect(valV1.length).toBe(valApi.length);
      const pairs = valApi.map((item, i) => normalizePairedValues(item, valV1[i], keyName));
return [pairs.map((p) => p[0]), pairs.map((p) => p[1])]; }
    if (isRecord(valApi) && isRecord(valV1)) {
      expect(Object.keys(valV1).sort()).toEqual(Object.keys(valApi).sort());
      const outA: Record<string, unknown> = {};
      const outB: Record<string, unknown> = {};
      for (const k of Object.keys(valApi)) [outA[k], outB[k]] = normalizePairedValues(valApi[k], valV1[k], k);
return [outA, outB]; }
    if (typeof valApi === "string" && typeof valV1 === "string") {
      if (TIMESTAMP_KEYS.has(keyName)) {
        const [tApi, tV1] = [Date.parse(valApi), Date.parse(valV1)];
        expect(!Number.isNaN(tApi) && !Number.isNaN(tV1) && Math.abs(tApi - tV1) < 5000).toBe(true);
return [`<TIMESTAMP:${keyName}>`, `<TIMESTAMP:${keyName}>`]; }
      if (CHAIN_HASH_KEYS.has(keyName)) {
        if (valApi.startsWith("GENESIS") || valV1.startsWith("GENESIS")) {
          expect(valV1).toBe(valApi);
return [valApi, valV1]; }
        expect(/^[a-f0-9]{64}$/.test(valApi) && /^[a-f0-9]{64}$/.test(valV1)).toBe(true);
return [`<CHAIN_HASH:${keyName}>`, `<CHAIN_HASH:${keyName}>`]; }
      if (DYNAMIC_ID_RE.test(valApi) && DYNAMIC_ID_RE.test(valV1)) {
        registerIdPair(valApi, valV1);
return [idMapApi.get(valApi), idMapV1.get(valV1)]; }
      let [strApi, strV1] = [valApi, valV1];
      for (const [rawId, tok] of idMapApi.entries()) strApi = strApi.split(rawId).join(tok);
      for (const [rawId, tok] of idMapV1.entries()) strV1 = strV1.split(rawId).join(tok);
return [strApi, strV1]; }
return [valApi, valV1]; }
  const compareCall: CompareCallFn = async <T = Record<string, unknown>>(
suffixApi: string, suffixV1: string, method: string, actorPair: ActorHeaderPair, bodyObj?: unknown, expectedStatus?: number ): Promise<{ bodyApi: T; bodyV1: T }> => {
    const bodyInit = bodyObj !== undefined ? { body: JSON.stringify(bodyObj) } : {};
    const resApi = await routeHttpRequest(wsApi, new Request(`http://localhost:3000/api${suffixApi}`, { method, headers: actorPair.apiHeaders, ...bodyInit }));
    const resV1 = await routeHttpRequest(wsV1, new Request(`http://localhost:3000/api/v1${suffixV1}`, { method, headers: actorPair.v1Headers, ...bodyInit }));
    expect(resV1.status).toBe(resApi.status);
    if (expectedStatus !== undefined) expect(resApi.status).toBe(expectedStatus);
    expect(resV1.headers.get("content-type")).toBe(resApi.headers.get("content-type"));
    const [bodyApi, bodyV1] = [(await resApi.json()) as T, (await resV1.json()) as T];
    if (isRecord(bodyApi) && isRecord(bodyV1) && "errorCode" in bodyApi) expect(bodyV1.errorCode).toBe(bodyApi.errorCode);
    const [normApi, normV1] = normalizePairedValues(bodyApi, bodyV1);
    expect(normV1).toEqual(normApi);
return { bodyApi, bodyV1 }; };
return { actors, compareCall }; }
