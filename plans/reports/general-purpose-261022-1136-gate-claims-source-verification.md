# DuriOS Claim Verification Report (16 claims)

All paths relative to `/Users/macbook/durios`. Verified by reading source, not by trusting intermediate docs.

| # | Claim | Verdict |
|---|---|---|
| 1 | GATE-01 env var + status | VERIFIED |
| 2 | GATE-02 otpProvider.isConfigured + 503 | VERIFIED |
| 3 | GATE-03 loopback + audit chain | VERIFIED |
| 4 | GATE-04 verifySiteBackup(backupDir) | VERIFIED |
| 5 | GATE-05 5 dossiers / <300s / 2 blind faults + goForLiveCustomerData | VERIFIED (1 note) |
| 6 | Seeder + test 5 dossiers, blindFaultCount=2 | VERIFIED |
| 7 | marketplace-guard dual-lock | VERIFIED |
| 8 | HITL block + MANAGER + PACKHOUSE_MANAGER | VERIFIED |
| 9 | ASEAN 4 corridor codes only | VERIFIED |
| 10 | Revenue Layer 6 + MOD-ENT-03 | VERIFIED (note on file list) |
| 11 | 4 KPI metrics | VERIFIED |
| 12 | Legal citations in src | VERIFIED |
| 13 | 91/2025/QH15 real subject | VERIFIED — it is Personal Data Protection Law |
| 14 | License model + LICENSE files | VERIFIED |
| 15 | maxRequests === 30 | VERIFIED |
| 16 | STRATEGY-V2-CHANGE-REPORT contents | PARTIAL — 2/5 sub-claims only |

## 1. GATE-01 consent env var + status — VERIFIED
`src/auth/pilot-launch-gate-verifier.ts:36,38,39`
```ts
const consentPath = options.consentSignedFilePath ?? env.DURIOS_GATE01_CONSENT_FILE;
const gate01Passed = Boolean(consentPath && existsSync(consentPath));
statusLabel: gate01Passed ? "PASS" : "PENDING_SITE_AND_CONSENT_SIGN_OFF"
```
Title string: `"Tiếp cận Vựa & Chấp thuận Dữ liệu (Luật DLCN 91/2025/QH15)"`

## 2. GATE-02 isConfigured + fail-closed 503 — VERIFIED
- `src/auth/pilot-launch-gate-verifier.ts:40-42`: `const otpProvider = createOtpProviderFromEnv(env);` / `const gate02Passed = otpProvider.isConfigured;` / `statusLabel: gate02Passed ? "PASS" : "PENDING_PROVIDER_CREDENTIALS"`
- `src/auth/otp-provider.ts:13`: `public readonly isConfigured = false;` on `UnconfiguredOtpProvider`
- `src/auth/otp-provider.ts:14`: `public sendOtp(_request: OtpDispatchRequest): never { throw new OtpProviderNotConfiguredError(); }`
- `src/server/auth-handlers.ts:53`: `if (err instanceof OtpProviderNotConfiguredError) return errorResponse(err.message, 503, err.code);`

## 3. GATE-03 loopback + audit chain — VERIFIED
`src/auth/pilot-launch-gate-verifier.ts:44-48`
```ts
try { assertLoopbackHostname(configuredHost); loopbackOk = true; } catch { loopbackOk = false; }
const gate03Passed = loopbackOk && auditChainValid;
```
`assertLoopbackHostname` at `src/server/server.ts:53`. `auditChainValid` sourced from `auditLedger.verifyIntegrity()` at `:72` and `:81`. Status label `"SECURITY_CONFIG_INCOMPLETE"`.

## 4. GATE-04 verifySiteBackup(backupDir) — VERIFIED
`src/auth/pilot-launch-gate-verifier.ts:53-54`
```ts
const verification = verifySiteBackup(backupDir);
gate04Passed = verification.valid;
```
Import at `:8` from `./site-backup-manager.js`; re-exported at `src/auth/site-backup-manager.ts:6`. Definition at `src/auth/site-restore-service.ts:10`.

## 5. GATE-05 thresholds + goForLiveCustomerData — VERIFIED
- `src/auth/pilot-launch-gate-verifier.ts:63`: `goForLiveCustomerData: passedCount === 5,`
- `src/auth/pilot-kpi-evaluator.ts:47`: `const underFiveMinuteGate = validDeltas.length >= 5 && meanDeltaSeconds < 300;`
- `src/auth/pilot-kpi-evaluator.ts:46`: `const zeroMissGate = blindFaultMetrics.length >= 2 && blindFaultsCaught === blindFaultMetrics.length;`
- `src/auth/pilot-kpi-evaluator.ts:50`: `gate05Passed: metrics.length >= 5 && underFiveMinuteGate && zeroMissGate`
Note: claim says "in src/auth/pilot-launch-gate-verifier.ts" — the 5-dossier / <300s / >=2-blind-fault thresholds actually live in `src/auth/pilot-kpi-evaluator.ts`. `pilot-launch-gate-verifier.ts` only aggregates (displays `< 5 phút/container`, derives `goForLiveCustomerData`).

## 6. Seeder + test — VERIFIED
- `src/auth/pilot-rehearsal-seeder.ts:18`: `export function seedGate05PilotRehearsal(...)`
- Source of 5 dossiers / 2 faults: `src/server/ecosystem-rehearsal-seeder.ts` `CAILAY_REHEARSAL_SPECS` (5 entries; R04 `BLIND_FAULT_SEAL_MISMATCH`, R05 `BLIND_FAULT_UNVERIFIED_EVIDENCE`)
- `test/pilot-rehearsal-seeder.test.ts:38,49,51,52`
```ts
expect(seeded.dossiers.length).toBe(5);
expect(kpiReport.totalContainers).toBe(5);
expect(kpiReport.blindFaultCount).toBe(2);
expect(kpiReport.blindFaultsCaught).toBe(2);
```

## 7. marketplace-guard dual-lock — VERIFIED
`src/marketplace/marketplace-guard.ts:27-28`
```ts
const featureFlagEnabled = env.DURIOS_FEATURE_B2B_MARKETPLACE === "enabled";
return featureFlagEnabled && context.goForLiveCustomerData === true;
```

## 8. HITL + RBAC — VERIFIED
- `src/verification/hitl-service.ts:70-79` `areAllFieldsVerified` returns false on any `verificationStatus !== "HUMAN_VERIFIED"`.
- The actual *blocking* producer: `src/rules/deterministic-engine.ts:12-27` returns `status: "HUMAN_VERIFICATION_REQUIRED"` with `ruleId: "RUL-GATE-UNVERIFIED"`, `severity: "CRITICAL_BLOCKER"` for any non-verified field.
- `src/auth/rbac-persona-assertions.ts:69,72`: approve/export requires `actor.role !== "MANAGER" && actor.role !== "ADMIN"` throws, then `if (actor.persona !== "PACKHOUSE_MANAGER")` throws.

## 9. ASEAN corridors — VERIFIED
`src/rules/asean-corridor-adapters.ts:3`: `export type AseanTradeCorridorCode = "VN_CN" | "MY_CN" | "TH_CN" | "PH_CN";`
Registry keys at `:28,37,46,55` (`VN_CN`, `MY_CN`, `TH_CN`, `PH_CN`) — no other code exists.

## 10. Revenue Layer 6 — VERIFIED
Files that exist: `src/saas/financial-attestation-token.ts`, `src/saas/financial-attestation-service.ts`, `src/saas/financial-attestation-codec.ts`, `src/server/financial-verification-context.ts`, `src/server/financial-verification-handler.ts`, `src/server/financial-verification-request.ts`, `src/server/financial-verification-view.ts` (7 files; 4 under `src/server/financial-verification-*`).
`src/saas/open-core-edition-manifest.ts:49`: `{ moduleId: "MOD-ENT-03", name: "Financial Verification Room (Trade-Finance & Marine Insurance)", pathPattern: "src/saas/financial-attestation-token.ts, src/saas/financial-attestation-service.ts, src/server/financial-verification-handler.ts", edition: "EXPORTER_ENTERPRISE", license: "Commercial-Ed25519", ... }`

## 11. 4 KPI metrics — VERIFIED
`src/auth/pilot-kpi-extended-types.ts:5-10`
```ts
readonly minutesSavedPerContainer: number;
readonly humanTouchesPerContainer: number;
readonly exceptionsDiscoveredPerContainer: number;
readonly expectedLossAvoidedVnd: number;
```

## 12. Legal citations in src — VERIFIED (in code, not just docs)
- `91/2025/QH15`: `src/auth/pilot-launch-gate-verifier.ts:39` (GATE-01 title `Luật DLCN 91/2025/QH15`); `src/export/pilot-dossier-pack-compiler.ts:13` (`"Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 2026-01-01)"`) and `:37` (`statutoryReference: "Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15"`); `src/server/ecosystem-rehearsal-drill.ts:24`
- `122/2025/QH15`: `src/marketplace/marketplace-guard.ts:37` (`"Luật TMĐT 122/2025/QH15 & Nghị định 248/2026/NĐ-CP"`); `src/marketplace/escrow-state-machine.ts:6`; `src/server/ecosystem-rehearsal-handler.ts:77`; `src/export/pilot-dossier-pack-compiler.ts:15` (`"Luật Thương mại điện tử 122/2025/QH15 & Nghị định 248/2026/NĐ-CP (hiệu lực 2026-07-01)"`)

## 13. What 91/2025/QH15 actually is — VERIFIED
The repo consistently names it the **Personal Data Protection Law** (`Luật Bảo vệ dữ liệu cá nhân`). Exact strings used:
- `src/export/pilot-dossier-pack-compiler.ts:13` — `"Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 2026-01-01)"`
- `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md:28` — `"Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15"` (hiệu lực từ `2026-01-01`)
- `docs/pilot-readiness/DECISION-01-CAI-LAY-SITE-SELECTION.md:21` — `"GATE-01 (Chấp thuận dữ liệu theo Luật 91/2025/QH15)"`
- Abbreviations in repo: `Luật DLCN` (`pilot-launch-gate-verifier.ts:39`), `Luật BVDLCN` (`.mekong/company.json:31`), `PDPL` (`src/server/ecosystem-rehearsal-drill.ts:24`, `SITE.md:40`)
It is **NOT** `Luật TDTT` and **NOT** `Luật Thương mại điện tử` — that is `122/2025/QH15` (`Luật TMĐT`).

## 14. License model + license files — VERIFIED
- `src/saas/open-core-edition-manifest.ts:30` and `:58`: `"AGPL-3.0-only (Core) + MIT (Verifier SDK) + Commercial (Pro/Enterprise)"`
- `LICENSE` (37,981 bytes) — `# DuriOS Open-Core Dual-License Agreement`
- `LICENSE-MIT` (1,373 bytes) — `MIT License (Applies to DuriOS Verification & Compliance Specification SDK)`
- `COMMERCIAL-LICENSE.md` (4,035 bytes) — `# DuriOS Commercial License & Managed SaaS Subscription Terms`
All three exist at repo root.

## 15. Tenant rate limiter — VERIFIED
`src/server/tenant-rate-limiter.ts:10` — `maxRequests: 30,`; enforced at `:50-52`: `if (nextCount > policy.maxRequests)`.

## 16. STRATEGY-V2-CHANGE-REPORT.md — PARTIAL (2 of 5 sub-claims)
File exists: `docs/product-direction/STRATEGY-V2-CHANGE-REPORT.md` (8,152 bytes).
- Staging budget 3-5 triệu VND — VERIFIED, `:81`: `"Phê duyệt hạn mức ngân sách nhỏ (ước tính 3–5 triệu VND) để đăng ký tài khoản doanh nghiệp Zalo ZNS và mua sắm thiết bị Mini PC"`
- Mini PC — VERIFIED, same line `:81` (`"thiết bị Mini PC chạy thử nghiệm tại thực địa"`)
- Zalo ZNS / SMS — VERIFIED, `:81` and `:73` (`"chưa ký hợp đồng thương mại với đơn vị viễn thông (Zalo ZNS / SMS)"`)
- Encrypted backup drive — NOT FOUND in this file (grep for `backup`, `drive`, `ổ cứng`, `mã hóa` = 0 hits). Present instead in `plans/company-blueprint/plan.md:90,416` and `plans/261022-0950-durios-blueprint-refresh/plan-draft.md:90,416` as `"Mini PC on-premise cộng ổ sao lưu, ngân sách ước tính 3–5 triệu VND"`.
- Cloud Vision OCR — NOT FOUND in this file (grep `Cloud Vision`, `OCR` = 0 hits). Present in `src/saas/open-core-edition-manifest.ts:43` (`MOD-PRO-01 Cloud Vision OCR Document Extractor`), `src/saas/cloud-ocr-extractor-adapter.ts:32`, `README.md:141,144,154`, `COMMERCIAL-LICENSE.md:13`, `SITE.md:47`.
Note: the word `Vision` appears 2x in the change report but both are `PRODUCT-VISION-V2.md` filename references (`:35,:80`), not Cloud Vision OCR.
