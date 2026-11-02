---
title: "DuriOS Stage 0 — Đồng bộ GATE-05A/05B & Máy Trạng Thái 5 Bước (Pilot Lifecycle FSM)"
status: completed
branch: stage0/gate05ab-runtime-sync-20261102
created: 2026-11-02
updated: 2026-11-02
---

# Plan: Đồng bộ GATE-05A / GATE-05B từ Tài liệu vào Runtime & Hoàn tất Kiểm chứng Stage 0

## 1. Outcome & Scope Boundary

- **Outcome:** Giải quyết triệt để thế khóa vòng (circular deadlock) giữa DB diễn tập (`SYNTHETIC_REHEARSAL`) và DB vận hành sạch (`0` container) bằng cách phân tách tường minh `GATE-05A` (Pre-Cutover Rehearsal) và `GATE-05B` (Live 5-Container Graduation) cùng máy trạng thái 5 bước (`BLOCKED`, `READY_FOR_FOUNDER_REVIEW`, `LIMITED_PILOT_AUTHORIZED`, `PILOT_COMPLETED`, `PILOT_HOLD`) và khóa hạn ngạch cứng `maxContainers: 5` trong `ContainerDossierWorkspace.createDossier()`.
- **Non-Goals:** Không mở rộng Stage 1/V2, không xây PKI phức tạp, không thêm HTTP endpoint ghi bằng chứng từ xa, không tự ý kích hoạt quyền nạp dữ liệu khách hàng thật (`PENDING_FOUNDER_APPROVAL`).
- **Constraints:**
  - Mọi tệp `.ts` trong `src/` và `test/` $\le 100$ LOC, `0 :any`.
  - `goForLiveCustomerData === true` chỉ khi `pilotLifecycleState === "PILOT_COMPLETED"`.
  - Giữ tương thích ngược 100% với 303 tests hiện hữu.

## 2. Phases

| Phase | Title | Status | Files |
|---|---|---|---|
| Phase 1 | Types, Founder Auth Verifier & 5-State Lifecycle Policy | Completed | `src/auth/pilot-lifecycle-types.ts`, `src/auth/founder-pilot-authorization.ts`, `src/auth/pilot-lifecycle-policy.ts` |
| Phase 2 | Gate Report Builder, CLI Summary, Workspace 5-Container Quota Guard, Audit Pack & UI | Completed | `src/auth/pilot-gate-types.ts`, `src/auth/pilot-gate-report-builder.ts`, `src/auth/pilot-gate-summary.ts`, `src/auth/cli-db-args.ts`, `src/workspace/pilot-quota-guard.ts`, `src/workspace/container-dossier-workspace.ts`, `src/domain/pilot-dossier-pack-types.ts`, `src/export/pilot-dossier-pack-compiler.ts`, `src/export/pilot-report-seal.ts`, `src/export/pilot-dossier-pack-formatter.ts`, `src/server/public/index.html` |
| Phase 3 | Reproduction & Adversarial Tests + Founder Policy Proposal Docs | Completed | `test/pilot-lifecycle-5state-and-05ab.test.ts`, `test/pilot-quota-and-adversarial-05ab.test.ts`, `docs/pilot-readiness/08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md`, `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`, `docs/reports/arena-stage0-20261029/GATE-MATRIX.md` |

## 3. Acceptance Criteria

- [x] AC-1: Tái hiện và kiểm thử tự động đủ 4 kịch bản S1–S4 trong `test/pilot-lifecycle-5state-and-05ab.test.ts`.
- [x] AC-2: Thực thi trần cứng 5 container trong `ContainerDossierWorkspace.createDossier()` khi bật `PilotWorkspaceQuotaPolicy` (`test/pilot-quota-and-adversarial-05ab.test.ts`).
- [x] AC-3: Kiểm định chặt tệp ủy quyền Founder (`maxContainers === 5`, `siteCode`, `tenantId`, hạn dùng, thu hồi, SHA-256 `GATE-05A`) và kích hoạt `PILOT_HOLD` khi vi phạm.
- [x] AC-4: Niêm phong SHA-256 bao phủ các trường vòng đời mới trong `GoLiveReadinessReport`.
- [x] AC-5: `bun run typecheck` (0 lỗi), `bun test` (308 pass / 0 fail), `bun run src/saas/blueprint-cli.ts --deep` (15/15 Socratic turns PASS, max LOC $\le 100$, `0 :any`).
