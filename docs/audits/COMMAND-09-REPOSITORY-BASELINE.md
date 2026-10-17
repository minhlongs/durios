# DuriOS Forensic Repository Baseline & Audit Checkpoint
## Supreme Command #09: Deliverable 1 — Forensic Baseline (Phase A)

**Date of Audit:** 2026-10-09  
**Branch:** `main`  
**Inspected HEAD SHA:** `f621b4733b809d3f871340383031e060ea8f7ae9`  
**Commit Message:** `feat: implement persistent core and browser hitl workspace for durios`  
**Git Working Tree Status:** Non-destructive preservation mode. Dirty working tree preserved.  
**TypeScript Typecheck:** `bun x tsc --noEmit` -> 0 errors (Exit code 0).  
**Test Suite Execution:** `bun test` -> 35 passed, 0 failed, 183 expect() assertions across 8 test suites [402ms].

---

## 1. Repository Inventory & File Structure

```
durios/
├── docs/
│   ├── audits/                                 # Forensic reports & adversarial safety memos
│   └── field-discovery/                        # Field validation instruments (01-08)
│       ├── 01_STAKEHOLDER_INTERVIEW_GUIDE.md
│       ├── 02_OBSERVED_WORKFLOW_CAPTURE_TEMPLATE.md
│       ├── 03_LOT_GENEALOGY_TRACING_WORKSHEET.md
│       ├── 04_DATA_OWNERSHIP_AND_PERMISSIONS_QUESTIONNAIRE.md
│       ├── 05_WILLINGNESS_TO_PAY_INTERVIEW_GUIDE.md
│       ├── 06_FIELD_EVIDENCE_REGISTER.md
│       ├── 07_FIELD_DISCOVERY_REPORT_TEMPLATE.md
│       └── 08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md
├── src/
│   ├── domain/                                 # Domain models, schema validators, types (<200 LOC)
│   │   ├── types.ts
│   │   ├── dossier-state-machine.ts
│   │   └── schema-validators.ts
│   ├── export/                                 # Manifest compilation & hashing (<200 LOC)
│   │   ├── manifest-compiler.ts
│   │   └── manifest-types.ts
│   ├── rules/                                  # Compliance rules & evaluation engines (<200 LOC)
│   │   ├── rule-catalog.ts
│   │   ├── evaluator-helpers.ts
│   │   └── rule-evaluator.ts
│   ├── server/                                 # HTTP REST endpoints & HITL web server (<200 LOC)
│   │   ├── server.ts
│   │   ├── http-router.ts
│   │   ├── dossier-handlers.ts
│   │   ├── document-handlers.ts
│   │   ├── actor-resolver.ts
│   │   └── server-types.ts
│   ├── storage/                                # SQLite repository, file store & audit ledger (<200 LOC)
│   │   ├── sqlite-dossier-repository.ts
│   │   ├── sqlite-audit-ledger.ts
│   │   ├── file-storage-service.ts
│   │   └── storage-types.ts
│   └── workspace/                              # Domain coordinator & HITL workspace (<200 LOC)
│       └── container-dossier-workspace.ts
├── test/                                       # Bun test suites (8 files, 35 tests, all green)
│   ├── container-dossier.test.ts
│   ├── export-manifest.test.ts
│   ├── full-dossier-lifecycle.test.ts
│   ├── http-server.test.ts
│   ├── rule-evaluator.test.ts
│   ├── sqlite-persistence.test.ts
│   ├── adversarial-verification.test.ts
│   └── process-restart-persistence.test.ts
├── package.json
└── tsconfig.json
```

---

## 2. Working Tree Modification Audit (Preserved State)

The working tree contains 4 modified source files and 3 untracked directory/test paths originating from Supreme Commands #07 & #08:

1. `src/rules/evaluator-helpers.ts`:
   - Updated disclaimer wording to avoid statutory claim conflation.
   - Clarified that `0.040 mg/kg` is an internal packhouse safety buffer, not statutory law.
2. `src/rules/rule-catalog.ts`:
   - Enforced statutory flags (`isStatutoryVerified: false`).
   - Quarantined `RUL-GB2762-CD` with `isActive: false` pending authoritative legal evidence.
3. `src/server/server.ts`:
   - Added `process.env.DURIOS_PORT` configuration for dynamic test isolation and multi-instance concurrency.
4. `src/workspace/container-dossier-workspace.ts`:
   - Implemented compensating filesystem rollback on database persistence failure (`fileStorage.deleteFile(storedFilePath)`).
   - Enforced field modification invalidation: clearing `latestValidationResult` and rolling back lifecycle state to `HUMAN_VERIFICATION_REQUIRED`.
5. `test/adversarial-verification.test.ts` (untracked):
   - 6 adversarial tests: rollback, invalidation, disclaimer enforcement, tamper detection, upload file constraints.
6. `test/process-restart-persistence.test.ts` (untracked):
   - Process restart verification using `Bun.spawn` and `SIGTERM` across real OS processes.
7. `docs/` (untracked):
   - Full 8-document field discovery suite.

---

## 3. Tooling and Runtime Configuration

- **Runtime:** Bun v1.3.14 (macOS Darwin 27.0.0, arm64).
- **TypeScript:** Strict mode enabled (`target: ESNext`, `moduleResolution: bundler`).
- **External Dependencies:** Zero external npm runtime dependencies. Built exclusively using native Bun APIs (`bun:sqlite`, native HTTP server `Bun.serve`, native crypto `crypto.subtle`).
- **Telemetry / Cloud Services:** 0 external connections. 100% local-first and air-gapped.
- **Budgetary Status:** Tranche 1 ceiling VND 7,500,000. Current expenditure: VND 0 (REPORTED ONLY).
