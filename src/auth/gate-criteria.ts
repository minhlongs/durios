import type { GateId } from "./pilot-gate-types.js";

/**
 * Two different questions, answered separately.
 *
 *  - "Did the machine check pass?" — something this codebase can compute (a file exists, a
 *    host is loopback, a backup verifies, the KPI thresholds hold).
 *  - "Is the launch gate evidenced?" — the documented criterion also needs a human artifact:
 *    a signature, a provider decision, a drill minute, a stopwatch sheet. No machine check
 *    can produce one, and `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`
 *    is the source of both lists below.
 *
 * Quoting "2/5 gates passed" without saying which question it answers is how a staging
 * number becomes a launch decision.
 */
export const GATE_MACHINE_CRITERIA: Readonly<Record<GateId, readonly string[]>> = {
  "GATE-01": ["Tệp tại DURIOS_GATE01_CONSENT_FILE tồn tại (chỉ kiểm tra sự tồn tại, không xác minh chữ ký)"],
  "GATE-02": ["DURIOS_OTP_* đủ để khởi tạo provider (isConfigured); chưa gửi OTP thật"],
  "GATE-03": ["DURIOS_HOST là loopback (assertLoopbackHostname)", "Chuỗi băm kiểm toán verifyIntegrity() === true"],
  "GATE-04": ["verifySiteBackup(DURIOS_BACKUP_DIR).valid === true (100% blob khớp SHA-256)"],
  "GATE-05": ["Ít nhất 5 container", "meanDeltaSeconds < 300", "zeroMissGate === true (bắt hết lỗi gài mù)"],
};

export const GATE_EXTERNAL_EVIDENCE_REQUIREMENTS: Readonly<Record<GateId, readonly string[]>> = {
  "GATE-01": ["Biên bản tiếp cận vựa do chủ vựa xác nhận", "Phê duyệt chọn site của Founder", "Biểu mẫu chấp thuận dữ liệu (91/2025/QH15) đã ký"],
  "GATE-02": ["Quyết định chọn nhà cung cấp OTP của Founder", "Biên bản gửi/nhận OTP thật trên staging cho tài khoản thật"],
  "GATE-03": ["Reverse proxy HTTPS với NODE_ENV=production", "Giới hạn mạng riêng tại vựa", "Mã hóa ổ đĩa và bản sao lưu", "Secrets lưu quyền 0600"],
  "GATE-04": ["Diễn tập backup/verify/restore trên máy vựa thật", "Biên bản diễn tập có người thực hiện ký", "Lịch sao lưu định kỳ đã chốt"],
  "GATE-05": ["Biên bản bấm giờ của người vận hành (HUMAN_STOPWATCH_ATTESTED)", "Tối thiểu 2 ca gài lỗi mù do người khác chuẩn bị", "Xác nhận 0 lỗi P0 còn mở"],
};

export const OPERATOR_EVIDENCE_NOTE =
  "Bằng chứng do người vận hành ghi nhận (OPERATOR_DECLARED). Hệ thống KHÔNG tự xác minh chữ ký, " +
  "không tự xác nhận hiện trường và không tự ký thay ai.";
