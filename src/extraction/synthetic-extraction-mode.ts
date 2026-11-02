/**
 * Synthetic fixture extraction is an explicit mode, never a default.
 *
 * The fixture extractor stands in for OCR while no reader is integrated. Left on by
 * default it answered "what does this document say?" with template values (cadmium
 * 0.028 mg/kg, container MSKU1234567, seal SL-998822) at 0.96 confidence, which a
 * clerk could then confirm as if they had been read off the paper. So the ordinary
 * flow extracts only what the bytes actually contain, and a document nobody can read
 * yields zero fields and blocks the dossier (RUL-DOC-UNREADABLE) instead.
 *
 * Rehearsal tooling opts in by name: the pilot seeder, the automated suite (via
 * bunfig.toml preload) and the Stage 0 drill scripts.
 */
export const SYNTHETIC_EXTRACTION_ENV_FLAG = "DURIOS_ENABLE_SYNTHETIC_FIXTURE_EXTRACTION";

export const SYNTHETIC_EXTRACTION_DISABLED_CODE = "SYNTHETIC_EXTRACTION_DISABLED";

const TRUTHY = new Set(["1", "true", "yes", "on"]);

export type EnvLike = Readonly<Record<string, string | undefined>>;

export function isSyntheticExtractionEnabled(env: EnvLike = process.env): boolean {
  const raw = env[SYNTHETIC_EXTRACTION_ENV_FLAG];
  return typeof raw === "string" && TRUTHY.has(raw.trim().toLowerCase());
}

/** Raised when a caller asks for fixture values while the instance runs the ordinary flow. */
export class SyntheticExtractionDisabledError extends Error {
  public readonly status = 400;
  public readonly code = SYNTHETIC_EXTRACTION_DISABLED_CODE;

  constructor(detail: string) {
    super(
      `Synthetic fixture extraction is disabled on this instance, so ${detail} was refused. ` +
        `The ordinary flow only stores values read from the document bytes; when nothing can be read it reports ` +
        `NOT_EXTRACTED and blocks the dossier instead of returning template values. ` +
        `For a declared rehearsal, start the process with ${SYNTHETIC_EXTRACTION_ENV_FLAG}=true.`
    );
    this.name = "SyntheticExtractionDisabledError";
  }
}

/**
 * Caller-supplied fixture values are a synthetic-mode input. Honouring them on an ordinary
 * instance would let an upload invent its own "extracted" evidence, so the registry refuses
 * the request instead of quietly dropping it.
 */
export function assertSyntheticFixtureRequestAllowed(env: EnvLike = process.env): void {
  if (!isSyntheticExtractionEnabled(env)) {
    throw new SyntheticExtractionDisabledError("the requested fixtureFields overrides");
  }
}

/**
 * Opt this process into synthetic extraction. Only rehearsal tooling may call it, and it
 * says so in the log line it leaves behind: a silent global switch is how fabricated
 * values end up in an operational database.
 */
export function enableSyntheticExtractionForRehearsal(tool: string, env: Record<string, string | undefined> = process.env): void {
  env[SYNTHETIC_EXTRACTION_ENV_FLAG] = "true";
  process.stderr.write(`[DuriOS] ${tool} enabled ${SYNTHETIC_EXTRACTION_ENV_FLAG}=true for this process (synthetic rehearsal only).\n`);
}
