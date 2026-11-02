---
title: "DuriOS Stage 0 — Đóng kín 3 Khoảng Trống Thực Thi Hậu PR #24 (HTTP Quota Guard, Fail-Closed Founder SHA-256 & Timing Provenance)"
status: completed
branch: stage0/gate05ab-post-merge-hardening
created: 2026-11-02
updated: 2026-11-02
---

# Plan: Đóng kín 3 Khoảng Trống Thực Thi Hậu PR #24 (`GATE-05A`/`GATE-05B`, HTTP Quota Guard & Fail-Closed Founder Auth)

## 1. Outcome & Scope Boundary

- **Outcome:** Khóa kín hoàn toàn 3 khoảng trống thực thi hậu PR #24 (`efdfc3d`) để máy chủ DuriOS thực thi đúng 100% chính sách Khai trương 2 giai đoạn (`08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md`):
  1. **R1 (HTTP Server Quota & Lifecycle Guard):** Tự động đánh giá và cưỡng bức `assertPilotQuotaOnCreate` trên đường chạy HTTP Server (`POST /api/v1/dossiers` trong `src/server/dossier-handlers.ts`) dựa trên `evaluateWorkspaceLaunchGates`, bảo toàn luồng seeder diễn tập (`ecosystem-rehearsal-seeder.ts`) và unit test domain độc lập (`new ContainerDossierWorkspace()`).
  2. **R2 (Cryptographic Founder Authorization & Zero-Bypass):** Bắt buộc trường `gate05AEvidenceSha256` (chuỗi SHA-256 64 ký tự hex khớp tuyệt đối với biên bản `GATE-05A`) trong `FounderPilotAuthorizationRecord` (`src/auth/pilot-lifecycle-types.ts`, `src/auth/founder-pilot-authorization.ts`) và xóa bỏ hoàn toàn nhánh bypass `legacyGate05Evidenced` tại `src/auth/pilot-lifecycle-policy.ts:79-80`.
  3. **R3 (Timing Provenance & Git Main Sync):** Tự động nâng `timingEvidenceSource` lên `"HUMAN_STOPWATCH_ATTESTED"` trong `src/auth/pilot-gate-report-builder.ts` khi có biên bản `GATE-05B`/`GATE-05` đạt `RECORDED_BY_OPERATOR` trên cohort vận hành thật (`!rehearsalMode && kpiSummary.gate05Passed`), và đồng bộ nhánh `main` tại `/Users/macbook/durios` với `origin/main`.
- **Non-Goals:**
  - Không mở bất kỳ HTTP endpoint nào nhận tệp bằng chứng hay tệp quyết định Founder từ xa.
  - Không mở ngoại lệ miễn trừ theo tiền tố `dossierCode` (`DOS-CAILAY-R*`) trong `pilot-quota-guard.ts` vì `dossierCode` là dữ liệu từ client request body.
  - Không tự động ký duyệt `08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md` thay Founder.
- **Constraints:**
  - Mọi tệp trong `src/` và `test/` bắt buộc $\le 100$ LOC, `0 :any`, `0 console.log` trong mã production.
  - Giữ tương thích với toàn bộ bài test hiện hữu và đạt 15/15 Socratic turns PASS trên `bun run src/saas/blueprint-cli.ts --deep`.

## 2. Phases

| Phase | Title | Status | Files |
|---|---|---|---|
| Phase 1 | Fail-Closed Founder SHA-256, Zero-Bypass Lifecycle Policy & Timing Provenance (R2 & R3) | Completed | `src/auth/pilot-lifecycle-types.ts`, `src/auth/founder-pilot-authorization.ts`, `src/auth/pilot-lifecycle-policy.ts`, `src/auth/pilot-gate-report-builder.ts` |
| Phase 2 | Dynamic HTTP Server Quota & Lifecycle Guard on `POST /api/v1/dossiers` (R1) | Completed | `src/workspace/pilot-quota-guard.ts`, `src/server/dossier-handlers.ts` |
| Phase 3 | Test Fixtures Update & E2E Adversarial HTTP Verification Suite | Completed | `test/helpers/gate-operator-evidence.ts`, `test/pilot-launch-gate-verifier.test.ts`, `test/pilot-go-live-pack.test.ts`, `test/pilot-lifecycle-5state-and-05ab.test.ts`, `test/pilot-quota-and-adversarial-05ab.test.ts`, `test/pilot-http-quota-and-founder-sha.test.ts` |

## 3. Acceptance Criteria (Done Means)

- [x] **AC-1:** `POST /api/v1/dossiers` trên server `createWorkspaceApp()` khi chưa đủ `GATE-01..04` + `GATE-05A` + `DURIOS_FOUNDER_PILOT_AUTH_FILE` bị từ chối với mã `PILOT_LIFECYCLE_BLOCKED` hoặc `PILOT_LIFECYCLE_READY_FOR_FOUNDER_REVIEW` (0 container được tạo).
- [x] **AC-2:** `POST /api/v1/dossiers` ở `LIMITED_PILOT_AUTHORIZED` cho phép tối đa 5 container và chặn container thứ 6 với `PILOT_QUOTA_EXCEEDED` (kể cả khi xóa hồ sơ nháp).
- [x] **AC-3:** Tệp `DURIOS_FOUNDER_PILOT_AUTH_FILE` thiếu `gate05AEvidenceSha256` hoặc lệch SHA-256 với tệp `DURIOS_GATE05A_EVIDENCE_FILE` trả về `INVALID_SCOPE_OR_ARTIFACT` và ép `PILOT_HOLD`.
- [x] **AC-4:** Khai báo `DURIOS_GATE05_EVIDENCE_FILE` cùng `GATE-01..04` trên DB 5 container thật nhưng thiếu `DURIOS_FOUNDER_PILOT_AUTH_FILE` chỉ dừng ở `READY_FOR_FOUNDER_REVIEW` (`goForLiveCustomerData === false`).
- [x] **AC-5:** Khi đạt `PILOT_COMPLETED` với biên bản `GATE-05B` hợp lệ, `report.kpiSummary.timingEvidenceSource === "HUMAN_STOPWATCH_ATTESTED"` và `verifyPilotGoLiveDossierPackIntegrity(report) === true`.
- [x] **AC-6:** Tại `/Users/macbook/durios` và worktree: `bun run typecheck` (0 lỗi), `bun test` (100% pass), `bun run src/saas/blueprint-cli.ts --deep` (15/15 Socratic turns PASS, mọi tệp `src/` và `test/` $\le 100$ LOC, `0 :any`).
