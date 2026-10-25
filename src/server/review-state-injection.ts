import { REVIEW_STATE_LABEL } from "../ui/review-state.js";
import { LEGAL_BASIS_LABEL } from "../ui/legal-basis-labels.js";

/** The single placeholder in the workspace HTML that both vocabularies replace. */
export const REVIEW_VOCABULARY_PLACEHOLDER = "/*__REVIEW_STATE_VOCABULARY__*/";

/**
 * Values injected into the page sit inside the single inline <script>, in a
 * JavaScript object literal — not in HTML. HTML-entity escaping would not
 * neutralise a JS string terminator, a backslash, or a closing </script> there,
 * so the value is serialised as JSON and then made safe for the script context by
 * breaking the one sequence that would end the block early.
 */
export function toJsLiteral(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

/**
 * The declarations the browser reads. Emitted as one block so the placeholder is a
 * whole statement and the file on disk is still valid JavaScript without it.
 */
function vocabularyBlock(): string {
  return [
    `const REVIEW_STATE_LABEL_VI = ${toJsLiteral(REVIEW_STATE_LABEL)};`,
    `const LEGAL_BASIS_LABEL = ${toJsLiteral(LEGAL_BASIS_LABEL)};`,
  ].join("\n    ");
}

/** Substitute the shared vocabularies into the served HTML. */
export function injectReviewVocabularies(html: string): string {
  return html.replace(REVIEW_VOCABULARY_PLACEHOLDER, () => vocabularyBlock());
}
