import { afterEach, describe, expect, it } from "bun:test";
import { closeSync, ftruncateSync, mkdtempSync, openSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EVIDENCE_ARTIFACT_HASH_LIMIT_BYTES, EVIDENCE_ARTIFACT_TOO_LARGE, inspectEvidenceArtifact,
} from "../src/auth/gate-evidence-artifact.js";
import { resolveGateExternalEvidence } from "../src/auth/pilot-gate-evidence.js";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";
import { MISSING_FILE_EVIDENCE } from "./helpers/gate-operator-evidence.js";
import { buildGateSite } from "./helpers/gate-site-fixture.js";

/**
 * What the system is willing to call "operator evidence" (item 4 of the handover): a file that
 * exists, its size and SHA-256, and a named human. Anything else stays PENDING. The hash is not a
 * judgement of the artifact's content — it only lets a reviewer prove later that the file on
 * record was not swapped.
 */
describe("Gate evidence artifacts: recorded, never silently trusted", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  function site(): { root: string; file: string; body: string } {
    const root = mkdtempSync(join(tmpdir(), "durios-evidence-artifact-"));
    roots.push(root);
    const file = join(root, "gate01-site-consent-signed.md");
    const body = "# GATE-01\nBiên bản tiếp cận vựa, ký ngày 2026-10-30 (fixture)\n";
    writeFileSync(file, body, "utf-8");
    return { root, file, body };
  }

  it("records an existing file with its true hash and the human who declared it", () => {
    const { file, body } = site();
    const evidence = resolveGateExternalEvidence("GATE-01", {}, { "GATE-01": { filePath: file, attestedBy: "Nguyễn Văn A (quản lý vựa)" } });
    expect(evidence.status).toBe("RECORDED_BY_OPERATOR");
    expect(evidence.attestedBy).toBe("Nguyễn Văn A (quản lý vựa)");
    expect(evidence.artifact?.isFile).toBe(true);
    expect(evidence.artifact?.bytes).toBe(Buffer.byteLength(body, "utf-8"));
    expect(evidence.artifact?.sha256).toBe(createHash("sha256").update(body, "utf-8").digest("hex"));
    expect(evidence.recorded.some((line) => line.includes("SHA-256"))).toBe(true);
  });

  it("keeps a gate PENDING when the declared path is not a file, or when nobody is named", () => {
    const { root, file } = site();
    const missing = resolveGateExternalEvidence("GATE-03", {}, MISSING_FILE_EVIDENCE);
    expect(missing.status).toBe("PENDING_OPERATOR_EVIDENCE");
    expect(missing.artifact?.exists).toBe(false);
    expect(missing.note).toContain("không tồn tại");
    expect(missing.attestedBy).toBeUndefined();

    const directory = resolveGateExternalEvidence("GATE-03", {}, { "GATE-03": { filePath: root, attestedBy: "Người vận hành" } });
    expect(directory.status).toBe("PENDING_OPERATOR_EVIDENCE");
    expect(directory.note).toContain("không phải là tệp");

    // A real file with no human attached proves nothing about who recorded it.
    const anonymous = resolveGateExternalEvidence("GATE-03", {}, { "GATE-03": { filePath: file, attestedBy: "" } });
    expect(anonymous.status).toBe("PENDING_OPERATOR_EVIDENCE");
    expect(anonymous.artifact?.isFile).toBe(true);
  });

  it("reads evidence declarations from the server process environment, never from a request", () => {
    const { file } = site();
    const fromEnv = resolveGateExternalEvidence("GATE-04", {
      DURIOS_GATE04_EVIDENCE_FILE: file, DURIOS_GATE_EVIDENCE_ATTESTED_BY: "Trần Văn B (diễn tập 2026-10-29)",
    });
    expect(fromEnv.status).toBe("RECORDED_BY_OPERATOR");
    expect(fromEnv.attestedBy).toBe("Trần Văn B (diễn tập 2026-10-29)");
    // No env, no override: nothing is recorded, whatever anyone claims in chat.
    expect(resolveGateExternalEvidence("GATE-04", {}).status).toBe("PENDING_OPERATOR_EVIDENCE");
  });

  it("keeps every gate closed on an otherwise green site when the declared paths are not files", () => {
    const target = buildGateSite("operational");
    roots.push(target.root);
    const report = verifySingleSiteLaunchGates({ ...target.options, gateEvidence: MISSING_FILE_EVIDENCE });
    expect(report.machineChecksPassedCount).toBe(5);
    expect(report.operationalGatesEvidencedCount).toBe(0);
    expect(report.goForLiveCustomerData).toBe(false);
    expect(report.gates.every((g) => g.externalEvidence.status === "PENDING_OPERATOR_EVIDENCE")).toBe(true);
    expect(report.gates.every((g) => g.gateVerdict === "MACHINE_CHECK_ONLY")).toBe(true);
  });

  it("does not hash an artifact above the limit, but still records the declaration", () => {
    const { root } = site();
    const huge = join(root, "huge-video-evidence.bin");
    const handle = openSync(huge, "w");
    ftruncateSync(handle, EVIDENCE_ARTIFACT_HASH_LIMIT_BYTES + 1);
    closeSync(handle);
    const artifact = inspectEvidenceArtifact(huge);
    expect(artifact.isFile).toBe(true);
    expect(artifact.bytes).toBe(EVIDENCE_ARTIFACT_HASH_LIMIT_BYTES + 1);
    expect(artifact.sha256).toBe(EVIDENCE_ARTIFACT_TOO_LARGE);
  });
});
