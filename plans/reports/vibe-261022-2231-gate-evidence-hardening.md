# Vibe pipeline run: launch-gate evidence hardening

- **Request:** `/ak-vibe go next --auto --ship`
- **Ship mode resolved:** stable (`--ship`, no `--beta`/`--both`)
- **Route:** bugfix (defective gate behavior, proven by repro)
- **Worktree:** `/Users/macbook/durios/.claude/worktrees/gate-hardening`
- **Branch:** `hardening/launch-gate-evidence` (commit `4356c6e`)
- **Plan:** `plans/261022-1246-gate-evidence-hardening/plan.md` (validated)

## Step disposition

| Step | Disposition |
|---|---|
| Worktree | Ran — was on `main`, created isolated worktree + feature branch |
| Research (`/ak:research`) | Skipped — no network egress; the question needed no external source |
| Debug (`/ak:debug`) | **Ran** — root cause proven by execution, not inspection |
| Plan (`/ak:plan`) | Ran and validated |
| Red-team | **Ran — and it changed the plan.** The planned consent-marker check was invalid |
| Issue create/update | **BLOCKED** — sandbox denies `api.github.com:443` |
| Implement (`/ak:cook`-equivalent, TDD) | Ran — RED confirmed before each module |
| Code review | Ran; one Critical-equivalent defect found by the pipeline itself (see below) |
| Test (`/ak:test`) | **Ran**, not skipped — the fix changes gate semantics |
| Docs (`/ak:docs`) | **Deferred to a human** — see open questions |
| Ship PR | **BLOCKED** — same network denial |
| Review PR / merge / CI | **BLOCKED** — same network denial |

## Verification

| Gate | Before | After |
|---|---|---|
| `bun run typecheck` | clean | clean |
| `bun test` | 162 pass / 3 fail | 170 pass / 3 fail |
| `blueprint:verify-25-steps` | 25/25 | 25/25 |

The 3 failures are unchanged and are environment limits, verified by stashing all
changes and re-running against a clean tree:
1. `adversarial-verification.test.ts` — fails on clean tree (12 pass / 1 fail) as well.
2. 2x `process-restart-persistence.test.ts` — cannot bind a local port in this sandbox.

## Defect the pipeline found in its own fix

Probing the new module found that `consentVerified: true` would still open GATE-01 on
**an empty file**. An attestation is supposed to vouch for a document, so the document
must exist and be non-empty. Fixed, with a regression test that was originally missing
because the bug was found by probing rather than by the suite.

## What this run does NOT claim

The fix is **not a cryptographic control**. It converts a silently-hollow gate into an
explicit, attributable one and removes the overclaim. A caller can still pass
`consentVerified: true` without a real signed document. The stronger options (recorded
with costs in `plans/reports/plan-blocker-261022-2030-gate-evidence-consent-form.md`)
need a founder decision, because they change the pilot protocol rather than the code.

## Human next steps

1. **Push and open the PR manually** — `git push -u origin hardening/launch-gate-evidence` from outside this sandbox.
2. **Decide the consent-verification option** (A/B/C/D in the blocker report). Option A is shipped as an honest interim.
3. **Run the two OTP realities**: GATE-02 is now honest that it proves configuration only. A live send rehearsal on staging is still outstanding.
4. **Consider a `docs/` note** on what the 5 gates now mean, since the wording changed.

## Code review outcome (second pass, after f35c1b9)

| Severity | Count | Disposition |
|---|---|---|
| Critical | 1 | **Fixed in f35c1b9** — rehearsal drill attested on an unauthenticated route |
| Important | 3 | **Fixed in f35c1b9** — CLI had no attestation path; contradictory byte-size comment; sole 5/5 proof was a self-attestation |
| Minor | 6 | 1 fixed (`3a6cdd1`, test cleanup); 5 recorded and deliberately left, see below |

The Critical finding is worth stating plainly: **the first version of this fix
reintroduced the bug it was written to remove**, on a route that http-router matches
before its authentication gate. It was caught by reviewing with fresh context rather
than by the test suite, and it is why the review step ran before shipping.

Minor findings left as-is, with reasons:

- `sizeOfFile` collapsing "absent" and "unreadable" into the same label — fail-closed
  direction is right; the message points an operator at the wrong fix only for a rare
  permission/directory case. Worth a follow-up when an operator hits it for real.
- `toGateOpts` building through a `Record<string, unknown>` cast — pre-existing pattern;
  extended only for one field, and it should not be extended further for anything that
  opens a gate.
- `consentVerified` and `rehearsalMode` can now drift apart in the pack compiler. Harmless
  today because no production caller passes either; it should be threaded together if a
  caller appears.
- Two tests assert on Vietnamese detail substrings. Brittle to copy edits, but they are
  the assertions that prove the wording stopped overclaiming, which is the whole point.
- The strongest test hand-inlines its lookup instead of using the shared helper, because
  the helper cannot express the attestation flag.
