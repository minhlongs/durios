import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  compileFieldProofKitBundle,
  verifyFieldProofKitBundle,
  type CompileFieldProofKitOptions,
  type FieldProofKitBundle,
} from "./field-proof-kit-compiler.js";
import type { OpcCommercialPlanCode } from "../saas/invoice-template.js";

export interface FieldProofKitCliOptions extends CompileFieldProofKitOptions {
  readonly verifyFilePath?: string | undefined;
  readonly outputDir?: string | undefined;
}

export function runFieldProofKitCli(options: FieldProofKitCliOptions = {}): {
  readonly exitCode: number;
  readonly bundle: FieldProofKitBundle;
  readonly outputFilePath?: string | undefined;
  readonly integrityVerified: boolean;
} {
  if (options.verifyFilePath) {
    const parsed = JSON.parse(readFileSync(options.verifyFilePath, "utf-8")) as FieldProofKitBundle;
    const verification = verifyFieldProofKitBundle(parsed);
    return {
      exitCode: verification.valid ? 0 : 1,
      bundle: parsed,
      outputFilePath: options.verifyFilePath,
      integrityVerified: verification.valid,
    };
  }

  const bundle = compileFieldProofKitBundle(options);
  let outputFilePath: string | undefined;
  if (options.outputDir) {
    mkdirSync(options.outputDir, { recursive: true });
    outputFilePath = join(options.outputDir, `${bundle.proofKitId}.json`);
    writeFileSync(outputFilePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf-8");
  }
  const verification = verifyFieldProofKitBundle(bundle);
  return {
    exitCode: verification.valid ? 0 : 1,
    bundle,
    outputFilePath,
    integrityVerified: verification.valid,
  };
}

function parseProofKitCliArgs(argv: readonly string[]): FieldProofKitCliOptions {
  const getArg = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  return {
    verifyFilePath: getArg("--verify"),
    outputDir: getArg("--output-dir"),
    siteCode: getArg("--site-code"),
    tenantId: getArg("--tenant-id"),
    planCode: getArg("--plan") as OpcCommercialPlanCode | undefined,
    dbPath: getArg("--db-path") ?? getArg("--db"),
    dataDir: getArg("--data-dir"),
    backupDir: getArg("--backup-dir"),
    consentSignedFilePath: getArg("--consent-file"),
  };
}

if (import.meta.main) {
  const opts = parseProofKitCliArgs(process.argv.slice(2));
  const res = runFieldProofKitCli(opts);
  process.stdout.write(`${JSON.stringify(res.bundle, null, 2)}\n`);
  process.exit(res.exitCode);
}
