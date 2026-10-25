# Phase 3 — Optimistic Concurrency For Dossier Writes

## Context Links

- `src/storage/sqlite-dossier-repository.ts:21-23` — `save()`, the blind upsert entry point
- `src/storage/sqlite-dossier-mapper.ts:44-77` — `upsertDossierRows` and its `ON CONFLICT ... DO UPDATE SET`
- `src/storage/schema-migrations.ts` — version-ordered migration runner, currently up to v6
- `src/storage/schema-migrations-share-purposes.ts` — the v6 table-rebuild convention
- `src/workspace/workspace-types.ts:19-29` — `DossierRepositoryLike`, the interface all write paths go through
- `src/workspace/dossier-lifecycle-service.ts:17,29,45` — three `repo.save` call sites
- `src/workspace/container-dossier-workspace.ts:49,68,88` — three more `repo.save` call sites
- `src/domain/types.ts:74-90` — the `ContainerDossier` shape

## Overview

Priority: P1. Status: completed.

Stop two people from silently overwriting each other's work on one dossier, and
stop a stale save from erasing the sealed manifest that the human sign-off
depends on.

The founder chose full scope here over a read-only rollout, accepting the extra
work deliberately. With no version column, a save that carries stale data wins
silently.

## The Gap Between What This Plan Claims And What It Can Deliver

This phase originally claimed: "The version travels on the dossier object the UI
already holds, so no new request field is needed on existing routes." **That is
false, and the consequence is that the phase's stated goal would not be met.**

Verified: every mutating route in `src/server/http-router.ts` receives only a
`dossierId` from the path — there is no dossier body and no version in it. The
workspace then re-reads the dossier inside the handler
(`src/workspace/container-dossier-workspace.ts:58,79` and
`src/workspace/dossier-lifecycle-service.ts:8,23,35`) and saves an object built
from that fresh read.

So a server-side-only version guard always compares the stored version against
the version of an object read moments earlier from the same store. The two values
are the same. The comparison can never fail.

The concrete failure: two operators both have dossier `DOS-X` open. A uploads a
document, B uploads a different document. Each request re-reads `DOS-X`, builds a
spread carrying the *current* version, and passes the guard. Both succeed, and
B's upload overwrites A's — precisely the silent data loss Gap C describes. The
guard would only catch genuinely server-interleaved requests, which the existing
`db.transaction()` wrapper already serializes.

**Therefore a client-supplied version is required, not optional.** The mutating
routes must accept the version the browser holds and reject when it is stale. This
is a contract addition, authorised in `plan.md`'s Constraints, and it is what
makes the phase deliver its goal rather than an unused check.

## Key Insights

- Every write path is read-modify-write against a whole aggregate: `findRaw` →
  mutate → `repo.save(updatedDossier)`. This is exactly the shape that loses
  updates, and it is also what makes the fix tractable — the version read can
  travel with the object.
- `upsertDossierRows` writes the dossier row, all documents, and all extracted
  fields, each with its own `ON CONFLICT` upsert. The version guard belongs on the
  **dossier row** — the aggregate root — not on the child rows, because the child
  upserts are idempotent with respect to a stale parent only if the parent write
  is rejected first.
- `export_manifests` upserts on `dossier_id` with no guard at all
  (`sqlite-dossier-repository.ts:78`), which is how a sealed manifest gets
  clobbered. Once a manifest exists for a dossier it must never be replaced.
- `DossierRepositoryLike` is an interface with an **optional** `findRaw?`. The
  in-memory repository used in tests does not have SQL, so the version guard must
  be additive: a `save` that cannot verify throws, rather than an interface change
  that breaks every implementation.
- Migrations are strictly ordered (`if (currentVersion < N) applyMigrationVN`) and
  the v6 precedent rebuilds a table when a constraint must change. A version
  column is a plain `ADD COLUMN`, so a transaction-wrapped ALTER is enough.

## Requirements

Functional:

1. `container_dossiers` gains a monotonic `version` column via migration v7,
   defaulting existing rows to 1.
2. The mutating routes accept a client-supplied `version` and fail with **HTTP
   409** when it is older than the stored version. Without a client-supplied
   precondition the guard cannot fire for the case this phase exists to close —
   see the gap section above.
3. On success the stored version increments, and the response carries the new
   version so the browser's held object can be updated. `DossierRepositoryLike.save`
   currently returns `void`
   (`src/workspace/workspace-types.ts:20`), and both implementations return `void`
   (`src/storage/sqlite-dossier-repository.ts:21`,
   `src/workspace/dossier-repository.ts:18`), with all six call sites ignoring any
   return. **This phase must change `save` to return the persisted
   `ContainerDossier`** — that interface change is unavoidable, because
   `ContainerDossier` is deeply `readonly` (`src/domain/types.ts`), so the caller's
   object cannot be mutated in place. Every mock typed against the `void`
   signature is affected; they are named in Related Code Files.
4. `saveExportManifest` never replaces an existing manifest row for a dossier, and
   the seal-save plus manifest-write happen in one transaction so a failure cannot
   leave a dossier sealed while the operator's export request fails.

Non-functional: no new runtime dependency; migration is safe on an existing SQLite
file with data; `bun:sqlite` transaction semantics only.

Non-goals: multi-user role model or per-field locking; row-level locking in
SQLite; cloud sync; a general-purpose conflict-merge UI.

## A second contract problem: `save` returning `void`

Requirement 3 needs the caller to learn the new version. Because the dossier type
is deeply `readonly`, the callee cannot write through to the caller's object, so
the only honest options are to change `save`'s return type or to have every caller
re-read after saving. This plan changes the return type and lists every affected
mock, because re-reading after every save adds a second query per write and leaves
a window where two in-memory copies disagree.

## The write paths that bypass `repo.save`

Named explicitly, because the phase treats `save` as the choke point and it is not
the only surface:

- `src/storage/legacy-blob-reconciler.ts:45` runs
  `UPDATE documents SET storage_path = ?` at workspace construction
  (`src/workspace/container-dossier-workspace.ts:39-40`), before any version
  exists on a fresh row. It touches no dossier column, so migration v7 does not
  disturb it — but this is stated so the interaction is not rediscovered.
- The in-memory repository is a plain `Map` overwrite with no version logic and no
  `saveExportManifest` at all (`src/workspace/dossier-repository.ts:18-20`; the
  method exists only on `SqliteDossierRepository`). Its rule must be specified, not
  improvised — see the in-memory decision below.

## The in-memory repository: the rule, stated

"Version-aware in the simplest honest way" is not executable. The rule is:

- Track a per-id version in the in-memory repository and throw the same
  `StaleDossierVersionError` when a save carries a stale version, so both
  implementations behave identically and tests cannot pass vacuously against
  behaviour the shipped path never has.
- The manifest guard is a **SQLite-only** test. The in-memory repository does not
  implement `saveExportManifest` and this phase does not add it, so the test that
  asserts a manifest cannot be replaced injects the SQLite repository explicitly.
- `test/rules-...` and the stale-save assertion name which repository they inject.

## Architecture

```
ContainerDossierWorkspace.*  (read-modify-write, unchanged shape)
  └── repo.save(dossier)            DossierRepositoryLike.save
        └── SqliteDossierRepository.save
              ├── read stored version for dossier.id
              ├── if provided && provided !== stored   → throw StaleDossierVersionError  → 409
              └── transaction(upsertDossierRows with version = stored + 1)
```

The version is compared inside the same transaction as the write so two racing
writers cannot both pass the check.

`StaleDossierVersionError` is a named error mapped in the server layer to 409 via
the existing `mapDomainErrorToResponse` convention.

## Every `save` call site, enumerated

Seven sites, because step-by-step "verify each site rather than assuming" was not
enough. Two are not spreads from a hydrated object:

| Site | Kind | Note |
|---|---|---|
| `src/workspace/container-dossier-workspace.ts:48` | fresh literal | `createDossier`; no prior object, so `version` must be initialised to 1 here |
| `src/workspace/container-dossier-workspace.ts:68` | spread from hydrated | upload path |
| `src/workspace/container-dossier-workspace.ts:88` | spread from hydrated | verifyField path |
| `src/workspace/dossier-lifecycle-service.ts:17` | spread from hydrated | validation |
| `src/workspace/dossier-lifecycle-service.ts:29` | spread from hydrated | approval |
| `src/workspace/dossier-lifecycle-service.ts:45` | spread from hydrated | seal on export |
| `src/workspace/document-ingestion-orchestrator.ts:40` | returns `dossier` unchanged | duplicate-upload path; passes through the version it was read at |

**The post-save authority rule, stated because it is otherwise a trap:**
after a successful save the *returned* object is authoritative, not the one the
caller constructed. Sites that save and then continue to hold their own object must
adopt the return value. Today `executeExportDossier` saves `sealedDossier` and
nothing re-saves it, so a stale in-memory copy does no harm — but any later phase
that adds a post-export save (for example the `CLOSED` transition) would hit a
phantom 409 on that stale copy.

**Tests and mocks that break on a required `version`, all verified:**

- `test/security-and-export.test.ts:5-7` — declares a test-local repository type
  against `save`'s `void` signature.
- `test/security-and-export.test.ts:50-58` — saves three successive variants each
  built from the same `exportedDossier` snapshot. Once saves are version-guarded the
  second and third carry a stale version and throw. This test needs rework: re-read
  the dossier before each save.
- `test/asean-corridor-and-verified-profile.test.ts:12-21` — a test-only
  `ContainerDossier` literal that fails typecheck without `version`.
- `test/open-core-workspace-portability.test.ts:10-22` — another test-only literal.
- `test/saas-advanced-ecosystem.test.ts:56` — builds
  `{ ...unsigned, reportedFields: ... }`, a second snapshot of one dossier that
  would conflict on save.

## Related Code Files

- Create `src/storage/schema-migrations-concurrency.ts` — `applyMigrationV7`, the
  version column.
- Modify `src/storage/schema-migrations.ts` — import v7 and add the ordered call.
- Modify `src/domain/types.ts` — add `version` to `ContainerDossier`.
- Modify `src/storage/sqlite-dossier-mapper.ts` — persist and return `version`
  from the dossier row; include it in the upsert's guarded update.
- Create `src/domain/stale-dossier-version-error.ts` or an equivalent
  domain-level error so the FSM/workspace layers can throw it without depending on
  storage.
- Modify `src/storage/sqlite-dossier-repository.ts` — version check in `save()`;
  refuse manifest replacement in `saveExportManifest()`.
- Modify `src/server/server-types.ts` — map the new error to 409.
- Modify `src/workspace/dossier-lifecycle-service.ts` and
  `container-dossier-workspace.ts` — carry the version through the spread updates
  so the next save is not born stale.
- Modify `src/workspace/dossier-repository.ts` (the in-memory repository) — keep
  it compiling and version-aware in the simplest honest way.
- Modify `src/server/public/index.html` — on a 409, tell the operator the dossier
  changed and offer a reload rather than failing silently.

## Implementation Steps

1. Read every `save` call site in the table above, plus the in-memory repository
   and `DossierRepositoryLike`, before editing.
2. Write the failing concurrency test first: two clients hold dossier `DOS-X`, the
   first saves with the current version and succeeds, the second saves with a
   version one behind and must fail. Confirm the second save currently succeeds —
   that silent success is the bug.
3. Add migration v7 with `ALTER TABLE container_dossiers ADD COLUMN version
   INTEGER NOT NULL DEFAULT 1`, wrapped in a transaction, following the existing
   migration file convention and registering it in the ordered runner.
4. Map the row to the object and back, including `version`.
5. Change `save` to return the persisted `ContainerDossier`, and update every mock
   named above. Update all seven call sites so the returned object becomes
   authoritative.
6. Add the guarded upsert. The check and the increment happen in one transaction;
   read the row's stored version from the database rather than trusting the
   argument.
7. Add the domain error and map it to 409 in `src/server/server-types.ts`.
8. Add the client-supplied `version` precondition to the mutating routes and send
   it from the browser. This is the step that makes the guard reachable for the
   two-operator case.
9. Make `saveExportManifest` refuse replacement of an existing row, and wrap the
   seal-save plus manifest-write in one transaction.
10. Update the browser to handle 409 explicitly with a reload prompt, and to send
    the version it holds on each write.
11. Specify and implement the in-memory repository rule from the decision section
    above.
12. Update the five named tests and mocks to the new signatures and truth.
13. Run the regression gate.

## Tests Before

- Two handles on one dossier: handle A saves a change and succeeds; handle B saves
  a different change built from the pre-A snapshot and **fails** with the stale
  version error. On current `main` both saves succeed — write the assertion for
  the failure and confirm it fails today.
- A second save carrying the version that A's save returned succeeds.
- After migration v7, an existing row has `version = 1` and remains readable and
  writable.
- Saving a manifest twice for the same dossier fails on the second attempt.

## Refactor

The aggregate carries a version every step must respect. The alternative —
comparing every mutable field to detect divergence — was rejected because it
cannot distinguish "another actor changed this" from "this actor changed it
back", and it silently accepts writes it should reject.

## Tests After

- The stale-save test now passes.
- Concurrent validate then approve on two snapshots: one wins, the other 409s.
- Export still succeeds on a clean, single-writer path — the happy path must not
  regress, and the manifest guard must not break first-time export.
- The full suite reports 0 failures against the 191 pass / 0 fail baseline.

## Success Criteria

- `bun test` reports **0 failures** against the measured pre-change baseline of
  191 pass / 0 fail across 42 files, with the new concurrency tests among them.
  This plan deliberately names no allowed-failure allowance, because the claim it
  replaced — two known `EADDRINUSE` failures — was wrong: `grep -rn "EADDRINUSE"
  test/ src/` returns nothing, and a fresh run is green. A criterion tolerating
  failures that do not exist is how a real regression gets signed off.
- `bun run typecheck` reports 0 errors.
- A stale save returns HTTP 409 through the real router, asserted in a test rather
  than reasoned about — and the test's second save genuinely fails, which is the
  assertion that was silently true-and-passing before this phase.
- Migration v7 applies cleanly to a database created at v6 with rows in it.
- No `:any`, no `console.log` in production code, no `src/` or `test/` file above
  the enforced 100 LOC ceiling.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| The migration breaks an existing pilot database | Keep the default to 1 for existing rows; test the migration against a database built at v6 |
| Adding a required field to `ContainerDossier` breaks every construction site | Grep all object literals; make the field required and fix every site rather than making it optional and silently failing to compare |
| Every write now needs a version the browser does not send | The version travels on the dossier object the UI already holds, so no new request field is needed on existing routes; verify one write path end to end |
| The 409 surfaces as a raw error in the browser | Map it in `server-types.ts` and handle it in the UI with a reload prompt |
| Two racing writers both pass the check | Compare and increment in one transaction, reading the row version from the database, not from the argument |

## Security Considerations

The integrity value is narrow and concrete: a sealed manifest, and the human
verification recorded alongside it, can no longer be destroyed by a stale write.
This protects the evidentiary chain the pilot's credibility rests on.

## Next Steps

Phases 1 and 2 should be merged before this phase's UI change lands, since phase 2
also edits `src/server/public/index.html`.

## Delivered

All success criteria verified on the branch:

- `bun test` — 227 pass / 0 fail across 50 files (baseline was 191 / 42).
- `bun run typecheck` — 0 errors.
- Stale upload returns 409 through the real router; stale approve returns 409 with
  `errorCode: "STALE_DOSSIER_VERSION"`. Both asserted in
  `test/dossier-optimistic-concurrency.test.ts`.
- Seal and manifest are now one transaction (`src/storage/sqlite-export-manifest.ts`).
  Tested at the repository level, because the FSM refuses a second export before the
  route ever reaches the branch where a split write could leave a dossier EXPORTED
  with no manifest.
- Migration v7 adds the version column, defaulting to 1 for existing rows.
- The browser sends the version it holds on every write against the open dossier
  (`fetchApi` → `isWriteToHeldDossier`), and refreshes it from the response because
  `refreshAfterMutation` re-fetches the dossier. A 409 surfaces through
  `notifyStaleDossier`, which tells the operator the dossier changed and to reload.

### Two deviations from this plan

1. **Validation had to return the new version.** Every write bumps the version, so a
   browser that validates could never legally write again — the version it held was
   stale the moment validation committed. `runValidation` still returns
   `ValidationRunResult` for its existing callers; `runValidationOutcome` returns the
   version alongside it.
2. **`runAction` was not the right place for the version guard.** It serializes
   button clicks, but browser state is not a lock: two tabs, or two operators, hold
   two independent copies. The guard belongs on the request, which is where it now is.

### One regression found and repaired during this phase

An earlier edit to `executeApproveForExport` had replaced the `save` +
`recordEvent` pair with a bare `return repo.save(...)`, deleting the
`DOSSIER_APPROVED_FOR_EXPORT` audit event. Restored to the ordered
save → recordEvent → return form.

### Code review outcome

A reviewer subagent was dispatched across the storage, workspace and server layers.
It ran past 25 minutes and reported nothing, so the review was completed directly.
One real defect was found, fixed, and proved:

`upsertDossierRows` discarded the result of its guarded write. The version check in
`save()` and the guarded UPDATE are separate statements, so the `WHERE ... version = ?`
clause is what actually guarantees atomicity — and a clause that matched no rows
reported success while writing nothing, returning a dossier claiming a version the
store never held. It now checks the row count and raises the stale-version error.

`test/dossier-version-guard-in-sql.test.ts` calls the write directly, so what refuses
the stale save is the SQL guard rather than the check in front of it. Verified by
reverting the fix and watching the test fail, then restoring it and watching it pass.

Checked and found sound: the seal and its manifest share one transaction and the
manifest's duplicate refusal rolls back the lifecycle write; the in-memory repository
mirrors the SQLite contract exactly (same check, same increment from the store, same
return); no public route or contract changed; `changes === 0` distinguishes a refused
write from a legitimate one because `version = container_dossiers.version + 1` always
alters the row on success, and a genuine insert reports one change.

### Post-merge review, and what it changed

The reviewer subagent finished after the merge and reported one defect that held up.
It is fixed in a follow-up on `main` (`12d9460`, PR #7):
`executeBlockerOverride` returned the pre-save object, so the caller was handed a
version the store had already moved past and its next write was refused with a 409
the operator could not explain. It now returns the object `repo.save` hands back,
matching its two sibling lifecycle functions. `test/dossier-signed-override.test.ts`
T-OV-08 asserts the invariant and was verified to fail with the source reverted.

Four other reported findings did not survive checking against the tree:

- *"the guard test is untracked"* — it is committed in `43e98e4`.
- *"`verifyField` has no version channel, so verification is unusable after a
  validation"* — the route re-reads the dossier and uses the current version.
  Verified by driving a full upload-and-validate flow: both a verify carrying the
  post-validation version and one carrying none return 200.
- *"`Math.max(1, dossier.version)` makes the returned version unusable"* — unreachable
  in this app; `createDossier` hardcodes `version: 1`. A real gap for an external
  caller of the repository contract, but not one this change introduced or the owner
  asked for.
- *"`changes === 0` cannot distinguish a refused write from a legitimate one"* —
  refuted by probe: a successful write always reports one change because
  `version = container_dossiers.version + 1` always alters the row, and a refused
  write leaves the row untouched and reports zero.

Two pre-existing gaps were noted and deliberately left, since they predate this work
and were outside the requested scope: `hasDocumentReferencingBlob` is not scoped by
tenant in either repository, and the verify route performs its existence check
before its authorization check. Both are recorded here rather than fixed.
