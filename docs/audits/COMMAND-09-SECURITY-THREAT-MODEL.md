# DuriOS Security Threat Model & Adversarial Vulnerability Assessment
## Supreme Command #09: Deliverable 4 — Adversarial Security Review (Phase C)

**Scope:** Network ingress, actor resolution, tenant scoping, filesystem boundaries, persistence atomicity, audit hash integrity.  
**Classification Standard:** OWASP Top 10 / Common Weakness Enumeration (CWE)  
**Target Environment:** Local Single-User Prototype vs. Multi-User Field Pilot vs. Production Cloud  

---

## 1. Threat Matrix & Vulnerability Register

| Vulnerability ID | Vulnerability Title | Affected Asset | Attacker Capability | Reproducibility | Severity | Discovery / Pilot Blocking Status |
|---|---|---|---|---|---|---|
| **VULN-01** | **Unauthenticated Actor Role Impersonation** | `src/server/actor-resolver.ts:11-20` | Remote or local HTTP client passes header `x-actor-role: MANAGER` or URL parameter `?role=MANAGER` | 100% Deterministic | **P0 (Critical)** | **Blocks Multi-User Pilot & Production.** Permitted ONLY in local offline discovery by founder. |
| **VULN-02** | **Cross-Tenant Resource Access via Forged Tenant ID** | `src/server/actor-resolver.ts:6-10` & `src/storage/sqlite-dossier-repository.ts` | Attacker changes `actor.tenantId` in request header to query or mutate dossiers of rival packhouse | 100% Deterministic | **P0 (Critical)** | **Blocks Multi-Tenant Deployment.** Currently unmitigated by cryptographic session tokens. |
| **VULN-03** | **Dual-Write Crash Window (Crash Between Disk & DB)** | `src/workspace/container-dossier-workspace.ts:168-177` | System power failure or SIGKILL immediately after `fileStorage.storeFile` but before SQLite transaction commits | Low probability / High impact | **P2 (Medium)** | **Does Not Block Discovery.** Leaves orphaned PDF binary on disk; compensated on normal exception, but unmitigated on hard OS crash. |
| **VULN-04** | **Audit Hash History Rewrite via Direct SQLite Access** | `src/storage/sqlite-audit-ledger.ts:60-120` | Attacker with OS write access to `durios.db` modifies past event and recalculates downstream SHA-256 hashes | 100% with SQLite client | **P1 (High)** | **Tamper Detection Only, Not Tamper Resistant.** Acceptable for local prototype; requires external append-only notary / timestamping for production. |
| **VULN-05** | **Arbitrary Path Traversal via Filename Sanitization** | `src/storage/file-storage-service.ts:46-55` | Attacker uploads file named `../../etc/passwd` | **0% (Blocked)** | **P3 (Informational)** | **VERIFIED MITIGATED.** `resolveSafePath` properly validates canonical path boundaries and throws security violation. |
| **VULN-06** | **Unrestricted Local Network Exposure** | `src/server/server.ts:31-38` | Server binds to `0.0.0.0` or local network interface without TLS/mTLS, exposing unauthenticated endpoints on LAN | High if run on shared packhouse Wi-Fi | **P1 (High)** | **Requires Localhost-Only Binding (`127.0.0.1`)** during local field demonstration to prevent packhouse Wi-Fi snooping. |

---

## 2. Detailed Technical Investigation of High-Severity Findings

### VULN-01: Actor Spoofing Analysis
```typescript
// src/server/actor-resolver.ts:11-20
export function resolveLocalActor(req: Request): AuthenticatedActor {
  const roleHeader = req.headers.get("x-actor-role")?.toUpperCase();
  const url = new URL(req.url);
  const roleParam = url.searchParams.get("role")?.toUpperCase();
  const selectedRole = roleHeader ?? roleParam;
  if (selectedRole === "MANAGER" || selectedRole === "ADMIN") {
    return DEFAULT_MANAGER;
  }
  return DEFAULT_CLERK;
}
```
* **Attack Narrative:** Bất kỳ ai gửi request `POST /api/dossiers/DOS-001/approve` kèm header `x-actor-role: MANAGER` đều có thể ký duyệt xuất khẩu container mà không cần mật khẩu, session token hoặc chữ ký số.
* **Remediation for Tranche 2 Pilot:** Thay thế `resolveLocalActor` bằng JWT xác thực mã hóa hoặc WebAuthn passkey buộc đăng nhập bằng vân tay/mã PIN của chủ xưởng.

### VULN-04: Tamper Detection vs. Tamper Resistance
* **Finding:** Lớp `SqliteAuditLedger` hiện tại thực hiện rất tốt việc **phát hiện can thiệp (Tamper Detection)** thông qua hàm `verifyIntegrity()`. Khi một dòng trong SQLite bị sửa nội dung payload hoặc bị xóa, hàm kiểm tra sẽ phát hiện ngay chuỗi hash bị đứt gãy.
* **Limitation:** Tuy nhiên, nếu một kẻ tấn công hoặc nội gián có quyền mở tệp tin SQLite `durios.db`, họ có thể viết một script SQL đơn giản để cập nhật lại toàn bộ `previous_hash` và `event_hash` từ điểm sửa đổi đến cuối bảng. Do đó, hệ thống hiện tại **chưa có khả năng kháng can thiệp tuyệt đối (Tamper Resistance)** nếu kẻ tấn công sở hữu quyền truy cập hệ điều hành.

---

## 3. Deployment Safety Gate Recommendation

- **Local Discovery Execution (Current Tranche 1):** **PERMITTED.** Điều tra viên chỉ chạy phần mềm cục bộ trên máy tính xách tay cá nhân (Localhost: 127.0.0.1), không kết nối mạng nội bộ của xưởng, không lưu trữ dữ liệu thật chưa ẩn danh.
- **Controlled Multi-User Pilot (Tranche 2 Gate):** **BLOCKED.** Không được cấp tài khoản cho nhân viên xưởng sử dụng cho đến khi VULN-01, VULN-02 và VULN-06 được khắc phục bằng cơ chế xác thực an toàn.
