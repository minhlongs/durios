import { describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { verifySingleSiteLaunchGates } from "../src/auth/pilot-launch-gate-verifier.js";

const TMP = process.env.TMPDIR ?? "/tmp";
const DIR = join(TMP, "gate01-evidence-test");
const NO_BACKUP = join(DIR, "absent-backup-dir");

function gate01DetailFor(path: string): { passed: boolean; statusLabel: string; detail: string } {
  const report = verifySingleSiteLaunchGates({ consentSignedFilePath: path, backupDir: NO_BACKUP });
  const g = report.gates.find((x) => x.gateId === "GATE-01");
  if (!g) throw new Error("GATE-01 missing from report");
  return { passed: g.passed, statusLabel: g.statusLabel, detail: g.detail };
}

describe("GATE-01 consent evidence honesty", () => {
  it("does not describe a present-but-empty consent file as verified consent", () => {
    mkdirSync(DIR, { recursive: true });
    const emptyPath = join(DIR, "empty-consent.txt");
    writeFileSync(emptyPath, "", "utf-8");
    expect(statSync(emptyPath).size).toBe(0);

    const g = gate01DetailFor(emptyPath);

    expect(g.passed).toBe(false);
    expect(g.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
    expect(g.detail).toContain("0 byte");
  });

  it("does not treat an unrelated file as consent", () => {
    mkdirSync(DIR, { recursive: true });
    const junkPath = join(DIR, "junk-consent.txt");
    writeFileSync(junkPath, "shopping list: milk, eggs\\n", "utf-8");

    const g = gate01DetailFor(junkPath);

    expect(g.passed).toBe(false);
    expect(g.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
  });

  it("still fails closed when the consent file is absent", () => {
    const g = gate01DetailFor(join(DIR, "never-created.txt"));
    expect(g.passed).toBe(false);
    expect(g.statusLabel).toBe("PENDING_SITE_AND_CONSENT_SIGN_OFF");
  });

  it("does not let an auditor attestation open an empty file", () => {
    mkdirSync(DIR, { recursive: true });
    const emptyAttested = join(DIR, "empty-attested.txt");
    writeFileSync(emptyAttested, "", "utf-8");
    const report = verifySingleSiteLaunchGates({
      consentSignedFilePath: emptyAttested,
      consentVerified: true,
      backupDir: NO_BACKUP,
    });
    const g = report.gates.find((x) => x.gateId === "GATE-01");
    expect(g?.passed).toBe(false);
    expect(g?.statusLabel).toBe("PENDING_SIGNED_CONSENT_INCOMPLETE");
  });

  it("reports existence as existence, not as verified consent", () => {
    mkdirSync(DIR, { recursive: true });
    const p = join(DIR, "present-consent.bin");
    writeFileSync(p, "x", "utf-8");
    const g = gate01DetailFor(p);
    expect(g.detail).not.toContain("đã ký xác nhận");
    rmSync(DIR, { recursive: true, force: true });
  });
});
