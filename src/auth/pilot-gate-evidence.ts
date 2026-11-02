import type { GateCheckStatus, GateEvidenceOverride, GateExternalEvidence, GateId, MachineGateCheck, GateVerdict } from "./pilot-gate-types.js";
import { GATE_EXTERNAL_EVIDENCE_REQUIREMENTS, OPERATOR_EVIDENCE_NOTE } from "./gate-criteria.js";
import { describeEvidenceArtifact, inspectEvidenceArtifact } from "./gate-evidence-artifact.js";

export { GATE_EXTERNAL_EVIDENCE_REQUIREMENTS, GATE_MACHINE_CRITERIA, OPERATOR_EVIDENCE_NOTE } from "./gate-criteria.js";

/**
 * Resolves the human half of one gate.
 *
 * Evidence is recorded from `DURIOS_GATE0X_EVIDENCE_FILE` (X = 1..5) plus the shared
 * `DURIOS_GATE_EVIDENCE_ATTESTED_BY`, or programmatically through `gateEvidence`. Two things are
 * required, and neither is optional:
 *   - a **file that actually exists** — its size and SHA-256 are recorded so a reviewer can open
 *     the artifact and later prove it was not swapped. A path to nothing is not evidence;
 *   - a **named human** who recorded it. An anonymous file proves nobody.
 * What the file *means* — a signature, a site visit, a stopwatch sheet — cannot be checked by
 * code and is never claimed to be: the status is `RECORDED_BY_OPERATOR`, not `VERIFIED`.
 */
export function resolveGateExternalEvidence(
  gateId: GateId,
  env: Readonly<Record<string, string | undefined>>,
  overrides?: Readonly<Record<string, GateEvidenceOverride | undefined>>,
  recordedExtras: readonly string[] = []
): GateExternalEvidence {
  const override = overrides?.[gateId];
  const declared = override?.filePath ?? env[`DURIOS_GATE${gateId.slice(-2)}_EVIDENCE_FILE`] ?? "";
  const attestedBy = override?.attestedBy ?? env.DURIOS_GATE_EVIDENCE_ATTESTED_BY ?? "";
  const required = GATE_EXTERNAL_EVIDENCE_REQUIREMENTS[gateId];
  const recorded: string[] = [...recordedExtras];
  const artifact = declared.trim() === "" ? undefined : inspectEvidenceArtifact(declared);
  if (artifact) recorded.push(describeEvidenceArtifact(artifact));
  if (attestedBy.trim() !== "") recorded.push(`Người ghi nhận: ${attestedBy.trim()}`);
  const usableArtifact = Boolean(artifact && artifact.exists && artifact.isFile);
  const complete = usableArtifact && attestedBy.trim() !== "";
  const pendingNote = artifact && !usableArtifact
    ? `Khai báo bằng chứng không hợp lệ. ${describeEvidenceArtifact(artifact)}. `
    : `Chưa có bằng chứng vận hành được ghi nhận. Cần: ${required.join("; ")}. `;
  return {
    required,
    recorded,
    status: complete ? "RECORDED_BY_OPERATOR" : "PENDING_OPERATOR_EVIDENCE",
    ...(complete ? { attestedBy: attestedBy.trim() } : {}),
    ...(artifact ? { artifact } : {}),
    note: complete
      ? OPERATOR_EVIDENCE_NOTE
      : `${pendingNote}Đặt DURIOS_GATE${gateId.slice(-2)}_EVIDENCE_FILE (tệp thật) và DURIOS_GATE_EVIDENCE_ATTESTED_BY sau khi con người hoàn tất.`,
  };
}

export function resolveGateVerdict(machinePassed: boolean, evidence: GateExternalEvidence, rehearsalMode = false): GateVerdict {
  if (!machinePassed) return "PENDING";
  // Evidence produced inside a rehearsal is drill-fabricated by definition: it can show the
  // mechanism works, but it never opens a launch gate.
  if (rehearsalMode) return "MACHINE_CHECK_ONLY";
  return evidence.status === "RECORDED_BY_OPERATOR" ? "EVIDENCED_FOR_LAUNCH" : "MACHINE_CHECK_ONLY";
}

export const GATE_EVIDENCE_PENDING_LABEL = "MACHINE_CHECK_ONLY_PENDING_OPERATOR_EVIDENCE";

/** Attaches the machine/external split to gates the builder already computed. */
export function withGateEvidenceSplit(
  gates: readonly MachineGateCheck[],
  env: Readonly<Record<string, string | undefined>>,
  overrides?: Readonly<Record<string, GateEvidenceOverride | undefined>>,
  extras: Readonly<Record<string, readonly string[]>> = {},
  rehearsalMode = false
): readonly GateCheckStatus[] {
  return gates.map((gate) => {
    const externalEvidence = resolveGateExternalEvidence(gate.gateId, env, overrides, extras[gate.gateId] ?? []);
    const gateVerdict = resolveGateVerdict(gate.machineCheck.passed, externalEvidence, rehearsalMode);
    return {
      ...gate,
      externalEvidence,
      gateVerdict,
      // A plain PASS downgrades to "machine check only" when no human recorded evidence. A
      // rehearsal label already carries the stronger caveat, so it is left untouched.
      statusLabel: gate.statusLabel === "PASS" && gateVerdict !== "EVIDENCED_FOR_LAUNCH" ? GATE_EVIDENCE_PENDING_LABEL : gate.statusLabel,
    };
  });
}
