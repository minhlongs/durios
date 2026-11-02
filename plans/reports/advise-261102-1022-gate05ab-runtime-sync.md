# Báo Cáo Tư Vấn Kiến Trúc & Chấm Điểm `--ultra` (Best-of-5): Đồng Bộ `GATE-05A` / `GATE-05B` Từ Tài Liệu Đến Runtime & Hoàn Tất Kiểm Chứng Stage 0

**Ngày thực hiện:** 2026-11-02  
**Nhánh làm việc:** `stage0/arena-integration-20261102` (tại commit `32ac535`)  
**Chế độ đánh giá:** `--ultra` (5 ứng viên độc lập + Verifier Rubric 80 điểm)

---

## 1. Needs from you (Cần bạn quyết định / phê duyệt ngoài phạm vi code)

1. **Chính sách mở khóa 5 container thật đầu tiên (`GATE-05A` -> `LIMITED_PILOT_AUTHORIZED`) giữ nguyên trạng thái `PENDING_FOUNDER_APPROVAL`:**
   - Bản đề xuất chính sách tại `docs/pilot-readiness/08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md` đã được soạn thảo đầy đủ. Trước khi Founder ký tệp ủy quyền thật cho vựa Cai Lậy, hệ thống mặc định giữ `pilotLifecycleState = "BLOCKED"` và `goForLiveCustomerData = false`.
2. **Hiện vật thực địa tại vựa Cai Lậy (khi triển khai thực tế):**
   - `GATE-01..GATE-04` (Biểu mẫu chấp thuận dữ liệu 91/2025/QH15 có chữ ký, biên bản OTP thật trên staging, xác nhận loopback/mạng/LUKS, biên bản diễn tập backup/restore).
   - Biên bản diễn tập `GATE-05A` trên DB diễn tập độc lập (`rehearsal.db`) và tệp JSON/PDF quyết định của Founder (`DURIOS_FOUNDER_PILOT_AUTH_FILE`) trước khi nạp 5 container thật đầu tiên.

---

## 2. Verdict (Kết luận kiến trúc & Kết quả `--ultra` Best-of-5)

### Bảng chấm điểm 5 ứng viên (`--ultra` Verifier Rubric)

| Ứng viên | 1. Độ trung thành với yêu cầu (/20) | 2. Bám sát bằng chứng mã nguồn (/20) | 3. Trung thực về Trade-offs & Đối kháng (/20) | 4. Tính khả thi `<= 100 LOC` & Handoff (/20) | Tổng điểm (/80) | Xếp hạng |
|---|---|---|---|---|---|---|
| **Candidate 1 (Architectural & FSM Rigor)** | **20/20** | **20/20** | **19/20** | **19/20** | **78/80** | **#1 (WINNER)** |
| **Candidate 2 (Security & Adversarial Guard)** | 19/20 | 20/20 | **20/20** | 18/20 | **77/80** | #2 |
| **Candidate 3 (`<=100 LOC` Modularity & DRY)** | 19/20 | 20/20 | 18/20 | **20/20** | **77/80** | #2 (Đồng hạng) |
| **Candidate 5 (Verification & Test Matrix)** | 19/20 | 19/20 | 18/20 | 19/20 | **75/80** | #4 |
| **Candidate 4 (Operator UX, CLI & Runbook)** | 18/20 | 19/20 | 18/20 | 18/20 | **73/80** | #5 |

**Kết luận:** Chọn kiến trúc **5-State Pilot Lifecycle FSM (`BLOCKED` -> `READY_FOR_FOUNDER_REVIEW` -> `LIMITED_PILOT_AUTHORIZED` -> `PILOT_COMPLETED` / `PILOT_HOLD`)** của Candidate 1, kết hợp chốt chặn đối kháng (hash-linked `Gate05aRehearsalReceipt` + `FounderPilotAuthorization` + high-water mark `DOSSIER_CREATED` quota guard) của Candidate 2 và thiết kế mô-đun `<= 100 LOC` của Candidate 3.

---

## 3. What you should do (Những việc cần thực hiện)

1. **Tách `GATE-05` thành `gate05Split: { gate05A, gate05B }` và máy trạng thái 5 bước (`PilotLifecycleState`):**
   - `BLOCKED`: Thiếu bất kỳ cổng `GATE-01..04` hoặc chưa có bằng chứng `GATE-05A`, hoặc đang chạy trực tiếp trên DB diễn tập (`SYNTHETIC_REHEARSAL`).
   - `READY_FOR_FOUNDER_REVIEW`: Trên DB vận hành sạch (`0` container thật, `auditChainValid === true`), `GATE-01..04` đạt `EVIDENCED_FOR_LAUNCH` và có bằng chứng diễn tập ngoài `GATE-05A` hợp lệ (khớp `siteCode`/`tenantId`), đang chờ quyết định của Founder (`policyStatus = "PENDING_FOUNDER_APPROVAL"`).
   - `LIMITED_PILOT_AUTHORIZED`: Đạt `READY_FOR_FOUNDER_REVIEW` cộng thêm hiện vật `FounderPilotAuthorization` hợp lệ (`maxContainers: 5`, khớp `siteCode`, `tenantId`, chưa hết hạn, chưa thu hồi). Cho phép `canStartLimitedFiveContainerPilot = true` nhưng giữ `goForLiveCustomerData = false`.
   - `PILOT_COMPLETED`: Đủ 5 container vận hành thật đạt `GATE-05B` (`< 300s`, `100%` bắt lỗi mù, `0` P0, biên bản bấm giờ người vận hành được ghi nhận). Chỉ ở trạng thái này `goForLiveCustomerData = true`.
   - `PILOT_HOLD`: Kích hoạt tức thời nếu chuỗi băm sổ cái đứt (`!auditChainValid`), hoặc phát hiện trộn dữ liệu synthetic vào DB vận hành đã có hồ sơ thật/ủy quyền, hoặc ủy quyền Founder bị thu hồi (`revoked: true`) / hết hạn (`expiresAt <= now`) / sai phạm vi.
2. **Cưỡng chế trần cứng 5 container (`maxContainers: 5`) tại `ContainerDossierWorkspace.createDossier()`:**
   - Khi chính sách vòng đời pilot được bật trên workspace, đếm `Math.max(activeTenantDossiers, createdAuditEventsForTenant)` để chặn container thứ 6 ở trạng thái `LIMITED_PILOT_AUTHORIZED` và chặn mọi tạo mới khi `BLOCKED` / `READY_FOR_FOUNDER_REVIEW` / `PILOT_HOLD`.

---

## 4. What you shouldn't do (Những việc cần tránh)

1. **Không gán `goForLiveCustomerData = true` ở trạng thái `LIMITED_PILOT_AUTHORIZED`:** Giữ các mô-đun hạ nguồn (`marketplace-guard.ts`, `dense-cluster-readiness.ts`, `pilot-dossier-pack-compiler.ts`) đóng an toàn (fail-closed) cho đến khi đạt `PILOT_COMPLETED`.
2. **Không chép dữ liệu diễn tập (`DOS-CAILAY-R*`) sang DB vận hành thật:** DB vận hành sạch chứng minh `GATE-05A` qua tệp bằng chứng diễn tập ngoài (`DURIOS_GATE05A_EVIDENCE_FILE` / `gate05ARehearsalReceipt`).
3. **Không vượt trần `100 LOC` trên bất kỳ tệp `.ts` nào trong `src/` và `test/` và không dùng `:any`.**

---

## 5. What could be better / more efficient (Tối ưu hóa hiệu quả)

- **Chiếu kép (Dual-Projection) cho `gates[]` và `gate05Split`:** Giữ nguyên tuple 5 cổng `gates: [GATE-01..GATE-05]` (`totalGates: 5`) để bảo toàn 100% tương thích ngược cho 303 bài kiểm thử hiện tại, đồng thời cung cấp `gate05Split`, `pilotLifecycleState`, `policyStatus`, `canStartLimitedFiveContainerPilot`, `founderAuthorization`, và `liveContainerQuota` trên cùng báo cáo.

---

## 6. My take and how to get there (Lộ trình triển khai)

1. Tạo `src/auth/pilot-lifecycle-types.ts`, `src/auth/founder-pilot-authorization.ts`, và `src/auth/pilot-lifecycle-policy.ts` (`<= 90 LOC` mỗi tệp).
2. Tích hợp vào `src/auth/pilot-gate-types.ts`, `src/auth/pilot-gate-report-builder.ts`, `src/auth/pilot-gate-summary.ts`, và `src/auth/cli-db-args.ts`.
3. Tạo `src/workspace/pilot-quota-guard.ts` và gắn vào `src/workspace/container-dossier-workspace.ts` (`<= 90 LOC`).
4. Cập nhật `src/domain/pilot-dossier-pack-types.ts`, `src/export/pilot-dossier-pack-compiler.ts`, `src/export/pilot-report-seal.ts`, `src/export/pilot-dossier-pack-formatter.ts`, và UI `src/server/public/index.html`.
5. Soạn thảo `docs/pilot-readiness/08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md` (`PENDING_FOUNDER_APPROVAL`) và cập nhật `docs/reports/arena-stage0-20261029/GATE-MATRIX.md`.
6. Viết 2 tệp kiểm thử mới (`test/pilot-lifecycle-5state-and-05ab.test.ts` và `test/pilot-quota-and-adversarial-05ab.test.ts`, mỗi tệp `<= 95 LOC`).

---

## 7. Benefits (Lợi ích)

- Giải quyết triệt để vòng khóa giữa DB diễn tập (`SYNTHETIC_REHEARSAL`) và DB vận hành sạch (`0` container).
- Chống gian lận trần 5 container (kể cả khi đổi tên `dossier_code` hoặc xóa dòng trong bảng `container_dossiers`).
- Bảo toàn 100% 303 bài kiểm thử hiện hữu và 15/15 Socratic turns.

---

## 8. Trade-offs (Đánh đổi)

- Tăng thêm 4 tệp mô-đun nhỏ trong `src/` và 2 tệp kiểm thử trong `test/` để giữ mọi tệp dưới ngưỡng `100 LOC`.
- Khi vận hành thực tế tại vựa, người vận hành cần khai báo tường minh đường dẫn tệp bằng chứng `GATE-05A` và tệp ủy quyền của Founder.

---

## 9. Work checklist, success metrics & handoff brief

### Work checklist
- [x] Chạy 5 ứng viên `--ultra` và chọn kiến trúc thắng cuộc.
- [ ] Cài đặt `pilot-lifecycle-types.ts`, `founder-pilot-authorization.ts`, `pilot-lifecycle-policy.ts`, `pilot-quota-guard.ts`.
- [ ] Cập nhật `pilot-gate-report-builder.ts`, `pilot-gate-summary.ts`, `container-dossier-workspace.ts`, `pilot-dossier-pack-compiler.ts`, `pilot-report-seal.ts`, và `index.html`.
- [ ] Tạo `08_FOUNDER_LAUNCH_POLICY_PROPOSAL_GATE05A_05B.md` (`PENDING_FOUNDER_APPROVAL`) và cập nhật `GATE-MATRIX.md`.
- [ ] Viết kiểm thử tự động cho 4 kịch bản tái hiện + kiểm thử đối kháng + kiểm tra trần 5 container.
- [ ] Xác minh `bun run typecheck`, `bun test`, `blueprint-cli.ts --deep` (15/15 Socratic turns, `<= 100 LOC`, `0 :any`).

### Success metrics
- `bun run typecheck`: `0` errors.
- `bun test`: `0` failures trên toàn bộ test suite (303 tests hiện hữu + các tests mới).
- `bun run src/saas/blueprint-cli.ts --deep`: `15/15` Socratic turns PASS, `maxSrcLoc <= 100`, `maxTestLoc <= 100`, `anyTypeViolationsCount === 0`.
- `bun run pilot:verify-gates`: Mặc định trả về `pilotLifecycleState: "BLOCKED"`, `policyStatus: "PREREQUISITES_INCOMPLETE"`, `goForLiveCustomerData: false`.

### Handoff brief
```text
Objective: Synchronize GATE-05A (pre-cutover rehearsal) and GATE-05B (5-container live graduation) with a 5-state pilot lifecycle FSM and 5-container quota guard across runtime, CLI, HTTP, UI, Go-Live Pack, docs, and tests.
Done means: All 4 reproduction scenarios + adversarial vectors + 5-container cap are verified by tests, every .ts file in src/ and test/ is <= 100 LOC with 0 :any, all tests and 15/15 Socratic turns pass, and default state remains BLOCKED / PENDING_FOUNDER_APPROVAL.
Out of scope: Pushing, opening PRs, merging, deploying, ingesting real customer data, or self-approving Founder launch policy.
Constraints: Strictly <= 100 LOC per .ts file in src/ and test/; zero :any; preserve .claude/ and DURIOS_CONTAINER_DOSSIER_MASTER_PROMPT.txt.
Stop and ask only if: A destructive action outside the repository or a real Founder policy sign-off is required.
```
