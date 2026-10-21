import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  compileStandaloneGoLiveDossierPack, verifyPilotGoLiveDossierPackIntegrity,
} from "./pilot-dossier-pack-compiler.js";
import { formatGoLivePackMarkdown } from "./pilot-dossier-pack-formatter.js";
import type { GoLiveReadinessReport } from "../domain/pilot-dossier-pack-types.js";

export interface FieldAuditorCliOptions {
  readonly verifyFilePath?: string | undefined;
  readonly outputDir?: string | undefined;
  readonly siteCode?: string | undefined;
  readonly dbPath?: string | undefined;
  readonly dataDir?: string | undefined;
  readonly backupDir?: string | undefined;
  readonly consentSignedFilePath?: string | undefined;
  readonly jsonOnly?: boolean | undefined;
  readonly markdownReport?: boolean | undefined;
  readonly env?: Record<string, string | undefined> | undefined;
}

export function runFieldAuditorCli(options: FieldAuditorCliOptions = {}): {
  readonly exitCode: number;
  readonly report: GoLiveReadinessReport;
  readonly outputFilePath?: string | undefined;
  readonly integrityVerified: boolean;
} {
  if (options.verifyFilePath) {
    const parsed = JSON.parse(readFileSync(options.verifyFilePath, "utf-8")) as GoLiveReadinessReport;
    const integrityVerified = verifyPilotGoLiveDossierPackIntegrity(parsed);
    return { exitCode: integrityVerified ? 0 : 1, report: parsed, outputFilePath: options.verifyFilePath, integrityVerified };
  }
  const report = compileStandaloneGoLiveDossierPack("founder-field-auditor", "AUDITOR", { siteCode: options.siteCode, dbPath: options.dbPath, dataDir: options.dataDir, backupDir: options.backupDir, consentSignedFilePath: options.consentSignedFilePath, env: options.env });
  let outputFilePath: string | undefined;
  if (options.outputDir) {
    mkdirSync(options.outputDir, { recursive: true });
    outputFilePath = join(options.outputDir, `${report.reportId}.json`);
    writeFileSync(outputFilePath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
    if (options.markdownReport) writeFileSync(join(options.outputDir, `${report.reportId}.md`), formatGoLivePackMarkdown(report), "utf-8");
  }
  const integrityVerified = verifyPilotGoLiveDossierPackIntegrity(report);
  return { exitCode: integrityVerified ? 0 : 1, report, outputFilePath, integrityVerified };
}

function parseCliArgs(argv: readonly string[]): FieldAuditorCliOptions {
  let verifyFilePath: string | undefined;
  let outputDir: string | undefined;
  let siteCode: string | undefined;
  let dbPath: string | undefined;
  let dataDir: string | undefined;
  let backupDir: string | undefined;
  let consentSignedFilePath: string | undefined;
  let jsonOnly = false;
  let markdownReport = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") jsonOnly = true;
    else if (arg === "--markdown" || arg === "--md") markdownReport = true;
    else if (arg === "--verify" && argv[i + 1]) verifyFilePath = argv[++i];
    else if (arg === "--output-dir" && argv[i + 1]) outputDir = argv[++i];
    else if (arg === "--site-code" && argv[i + 1]) siteCode = argv[++i];
    else if (arg === "--db-path" && argv[i + 1]) dbPath = argv[++i];
    else if (arg === "--data-dir" && argv[i + 1]) dataDir = argv[++i];
    else if (arg === "--backup-dir" && argv[i + 1]) backupDir = argv[++i];
    else if (arg === "--consent-file" && argv[i + 1]) consentSignedFilePath = argv[++i];
  }

  return {
    verifyFilePath, outputDir, siteCode, dbPath, dataDir,
    backupDir, consentSignedFilePath, jsonOnly, markdownReport,
  };
}

if (import.meta.main) {
  const cliOpts = parseCliArgs(process.argv.slice(2));
  const result = runFieldAuditorCli(cliOpts);
  if (cliOpts.jsonOnly) {
    process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
  } else {
    process.stdout.write(
      `[DuriOS Field Auditor] Site=${result.report.siteCode} Verdict=${result.report.overallVerdict} ` +
        `Gates=${result.report.passedGateCount}/${result.report.totalGateCount} ` +
        `SHA256=${result.report.reportSha256} Integrity=${result.integrityVerified}\n`
    );
    if (result.outputFilePath) {
      process.stdout.write(`[DuriOS Field Auditor] Saved pack to: ${result.outputFilePath}\n`);
    }
  }
  process.exit(result.exitCode);
}
