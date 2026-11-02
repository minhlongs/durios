import { SYNTHETIC_EXTRACTION_ENV_FLAG } from "../src/extraction/synthetic-extraction-mode.js";

/**
 * Declares synthetic fixture extraction for the whole `bun test` run.
 *
 * Every document the suite uploads is a fixture: there is no reader integrated in Stage 0,
 * so without this the suite could only assert that nothing is ever extracted. Child
 * processes spawned by tests inherit the flag through `...process.env`.
 */
process.env[SYNTHETIC_EXTRACTION_ENV_FLAG] = "true";
