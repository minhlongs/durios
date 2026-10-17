import type { GoLiveReadinessReport } from "../domain/pilot-dossier-pack-types.js";

export function formatGoLivePackMarkdown(report: GoLiveReadinessReport): string {
  const lines: string[] = [];

  lines.push(`# BÁO CÁO KIỂM TOÁN THỰC ĐỊA & NIÊM PHONG HỒ SƠ KHAI TRƯƠNG PILOT`);
  lines.push(`**DuriOS — Digital Technical Dossier Workspace for Vietnamese Durian Exports**\n`);
  lines.push(`- **Mã báo cáo:** \`${report.reportId}\``);
  lines.push(`- **Địa điểm kiểm toán:** \`${report.siteCode}\``);
  lines.push(`- **Thời điểm lập:** \`${report.compiledAt}\``);
  lines.push(`- **Kiểm toán viên:** \`${report.compiledByActorId}\` (${report.compiledByActorRole})`);
  lines.push(`- **Kết luận:** **${report.overallVerdict}**`);
  lines.push(`- **Quyết định nạp dữ liệu khách hàng thật:** **${report.goForLiveCustomerData ? "ĐƯỢC PHÉP (GO)" : "TẠM GIỮ (HOLD)"}**`);
  lines.push(`- **Mã băm niêm phong SHA-256:** \`${report.reportSha256}\`\n`);

  lines.push(`## 1. Kết Quả Kiểm Tra 5 Cổng Khai Trương (Launch Gates)\n`);
  lines.push(`| Cổng | Tên cổng | Trạng thái | Chi tiết bằng chứng |`);
  lines.push(`|---|---|---|---|`);
  for (const g of report.gates) {
    const statusText = g.passed ? "✅ ĐẠT" : "❌ CHƯA ĐẠT";
    lines.push(`| **${g.gateId}** | ${g.title} | ${statusText} | ${g.detail} |`);
  }

  lines.push(`\n## 2. Danh Mục Kiểm Tra Thực Địa (Field Auditor Checklist)\n`);
  lines.push(`| Mã | Hạng mục kiểm tra | Quy chuẩn pháp lý | Kết quả | Chi tiết |`);
  lines.push(`|---|---|---|---|---|`);
  for (const chk of report.fieldAuditorChecklist) {
    const statusText = chk.passed ? "✅ SẴN SÀNG" : "⚠️ CẦN XỬ LÝ";
    lines.push(`| **${chk.itemId}** | ${chk.titleVi} | ${chk.statutoryReference} | ${statusText} | ${chk.evidenceDetail} |`);
  }

  lines.push(`\n## 3. Tóm Tắt Chỉ Số Đo Lường Diễn Tập (GATE-05 KPI Snapshot)\n`);
  lines.push(`- **Tổng số container diễn tập:** ${report.kpiSnapshot.totalContainers}`);
  const meanMins = (report.kpiSnapshot.meanDeltaSeconds / 60).toFixed(2);
  lines.push(`- **Thời gian đối soát trung bình:** ${meanMins} phút/container (Quy định: < 5.0 phút)`);
  lines.push(`- **Tỷ lệ chặn lỗi gài mù:** ${report.kpiSnapshot.blindFaultsCaught}/${report.kpiSnapshot.blindFaultCount} (100% bắt buộc)`);
  lines.push(`- **Kết luận cổng GATE-05:** ${report.kpiSnapshot.gate05Passed ? "ĐẠT" : "CHƯA ĐẠT"}`);

  lines.push(`\n## 4. Căn Cứ Pháp Lý & Quy Chuẩn (Statutory References)\n`);
  for (const ref of report.statutoryReferences) {
    lines.push(`- ${ref}`);
  }

  lines.push(`\n## 5. Tuyên Bố Trách Nhiệm Bắt Buộc (Mandatory Disclaimers)\n`);
  for (const disc of report.mandatoryDisclaimers) {
    lines.push(`> ${disc}\n`);
  }

  lines.push(`---\n*Báo cáo được ký số và niêm phong mật mã học bằng thuật toán SHA-256 trên mã nguồn DuriOS.*`);
  return lines.join("\n");
}
