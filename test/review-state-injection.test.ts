import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serveIndexHtml } from "../src/server/static-ui.js";
import { REVIEW_VOCABULARY_PLACEHOLDER } from "../src/server/review-state-injection.js";
import { REVIEW_STATE_LABEL } from "../src/ui/review-state.js";
import { LEGAL_BASIS_LABEL, legalBasisLabel } from "../src/ui/legal-basis-labels.js";
import type { LegalBasis } from "../src/ui/review-legal-basis.js";

/**
 * The browser workspace must show review states and legal basis from the same
 * modules the unit tests exercise. An assertion that reads index.html from disk
 * proves nothing once the server substitutes values into the served page, so every
 * markup check here goes through serveIndexHtml().
 *
 * FIELD_STATUS_META carries some identical Vietnamese strings for the verification
 * enum, so a plain toContain on the label text would pass whether or not injection
 * happened. Assertions compare the injected object to the module export, which
 * cannot match by coincidence.
 */
const REVIEW_STATES = [
  "NEEDS_REVIEW", "NEEDS_EVIDENCE", "DISCREPANCY",
  "CONFIRMED_DATA", "SOURCE_CHANGED", "NEEDS_REASSESSMENT",
] as const;

const BASES: readonly LegalBasis[] = ["verified", "unverified", "advisory", "inactive"];

function servedScript(html: string): string {
  const open = html.indexOf("<script>") + "<script>".length;
  return html.slice(open, html.lastIndexOf("</script>"));
}

describe("Served workspace carries the shared review vocabulary", () => {
  it("injects the review-state labels the module exports", async () => {
    const script = servedScript(await (await serveIndexHtml()).text());
    for (const state of REVIEW_STATES) {
      expect(script).toContain(`"${state}":${JSON.stringify(REVIEW_STATE_LABEL[state])}`);
    }
  });

  it("injects a Vietnamese label for every legal basis the helper can return", async () => {
    const script = servedScript(await (await serveIndexHtml()).text());
    for (const basis of BASES) {
      expect(script).toContain(`"${basis}":${JSON.stringify(LEGAL_BASIS_LABEL[basis])}`);
    }
  });

  it("leaves no hand-written label definition on disk to drift from the module", () => {
    const onDisk = readFileSync(join(process.cwd(), "src/server/public/index.html"), "utf-8");
    expect(onDisk).not.toContain("const REVIEW_STATE_LABEL_VI");
    expect(onDisk).toContain(REVIEW_VOCABULARY_PLACEHOLDER);
  });

  it("labels a basis the helper would produce but the map has not been updated for", () => {
    // The map is keyed by the union, so adding a basis must trip this assertion.
    expect(Object.keys(LEGAL_BASIS_LABEL).sort()).toEqual([...BASES].sort());
    for (const basis of BASES) {
      const label = legalBasisLabel(basis);
      expect(label.vi.length).toBeGreaterThan(0);
      expect(label.en.length).toBeGreaterThan(0);
    }
  });

  it("keeps the injected block parseable as JavaScript", async () => {
    const script = servedScript(await (await serveIndexHtml()).text());
    expect(() => new Function(script)).not.toThrow();
  });

  it("does not invent an authority field the API never sends", () => {
    const onDisk = readFileSync(join(process.cwd(), "src/server/public/index.html"), "utf-8");
    expect(onDisk).not.toContain("sourceAuthority");
  });

  it("renders the finding's legal basis from the API field", () => {
    const onDisk = readFileSync(join(process.cwd(), "src/server/public/index.html"), "utf-8");
    expect(onDisk).toContain("f.legalBasis");
    expect(onDisk).toContain("finding__claim");
  });
});
