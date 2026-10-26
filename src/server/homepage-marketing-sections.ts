/**
 * Interactive ROI Calculator and Battlecard sections for the DuriOS Homepage.
 * Keeps `src/server/homepage-showroom-html.ts` strictly <= 100 LOC.
 */
const ROI_JS =
  "var q=parseInt(this.getAttribute('data-cont')||'30',10);" +
  "document.querySelectorAll('.durios-roi-tab').forEach(function(b){b.classList.remove('active')});" +
  "this.classList.add('active');" +
  "document.getElementById('durios-roi-goods').textContent=(q*1.8).toFixed(1)+' Tỷ VNĐ ('+q+' cont × 1,8 tỷ)';" +
  "document.getElementById('durios-roi-hours').textContent=(q*42/60).toFixed(0)+' Giờ (Rút từ 45p xuống < 3p/cont)';" +
  "document.getElementById('durios-roi-plan').textContent=q<=10?'Gói Vựa Cai Lậy (5 Tr/tháng)':q<=30?'Gói Vựa Cai Lậy (5 Tr/tháng) • ROI 70x':q<=100?'Gói Đội Xe Reefer (60 Tr/năm)':'Gói Tập Đoàn Hùng Hậu (180 Tr/năm) • Đa Vựa';";

export function buildMarketingRoiAndBattlecardHtml(): string {
  return `
  <div id="durios-roi-calculator" class="durios-section-card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>
        <strong style="font-size:15px;color:var(--color-primary,#0f6b4f)">💰 Máy Tính ROI &amp; Bảo Hiểm Chống Quay Đầu Container (Loss-Avoidance Calculator)</strong>
        <div style="font-size:12px;color:var(--color-text-muted,#4b5563)">Định lượng giá trị bảo vệ và số giờ giải phóng nhân lực khi rà soát bằng DuriOS.</div>
      </div>
      <div class="durios-roi-tabs">
        <button type="button" class="durios-roi-tab" data-cont="10" onclick="${ROI_JS}">10 Cont</button>
        <button type="button" class="durios-roi-tab active" data-cont="30" onclick="${ROI_JS}">30 Cont (Vựa Vừa)</button>
        <button type="button" class="durios-roi-tab" data-cont="100" onclick="${ROI_JS}">100 Cont</button>
        <button type="button" class="durios-roi-tab" data-cont="300" onclick="${ROI_JS}">300 Cont (Tập Đoàn)</button>
      </div>
    </div>
    <div class="durios-grid-4" style="margin-top:12px">
      <div class="durios-metric-box"><div class="durios-metric-val" id="durios-roi-goods">54.0 Tỷ VNĐ (30 cont × 1,8 tỷ)</div><div class="durios-metric-lbl">Giá trị hàng hóa được bảo vệ</div></div>
      <div class="durios-metric-box"><div class="durios-metric-val" style="color:#ef4444">350.000.000 VNĐ</div><div class="durios-metric-lbl">Chi phí rủi ro chặn đứng (1 lần lệch seal)</div></div>
      <div class="durios-metric-box"><div class="durios-metric-val" id="durios-roi-hours">21 Giờ (Rút từ 45p xuống &lt; 3p/cont)</div><div class="durios-metric-lbl">Thời gian chứng từ tiết kiệm</div></div>
      <div class="durios-metric-box"><div class="durios-metric-val" id="durios-roi-plan" style="font-size:13px;color:#38bdf8">Gói Vựa Cai Lậy (5 Tr/tháng) • ROI 70x</div><div class="durios-metric-lbl">Gói cước tối ưu khuyến nghị</div></div>
    </div>
  </div>

  <div id="durios-battlecard" class="durios-section-card">
    <strong style="font-size:15px">⚔️ Bảng So Sánh Đối Đầu: Làm Thủ Công (Excel + Zalo) vs. Hệ Điều Hành DuriOS 2027</strong>
    <div style="overflow-x:auto;margin-top:10px">
      <table class="durios-battle-table" style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
        <thead>
          <tr style="background:var(--color-surface-muted,#f0f2f5)">
            <th style="padding:10px;border-bottom:1px solid var(--color-border,#d5dae1)">Tiêu chí nghiệp vụ GACC</th>
            <th style="padding:10px;border-bottom:1px solid var(--color-border,#d5dae1);color:#b91c1c">❌ Làm tay thủ công (Excel + Zalo)</th>
            <th style="padding:10px;border-bottom:1px solid var(--color-border,#d5dae1);color:#0f766e">✅ DuriOS 2027 (Chuẩn GACC)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><strong>Thời gian soát 1 container</strong></td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#b91c1c">45 – 60 phút (dễ hoa mắt ban đêm)</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#0f766e;font-weight:700">&lt; 3 phút (Tự động 5 cổng)</td>
          </tr>
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><strong>Lệch số Seal / Mã PUC, PHC</strong></td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#b91c1c">Phát hiện khi xe đã kẹt ở Tân Thanh</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#0f766e;font-weight:700">Chặn 100% lỗi gài mù tại vựa</td>
          </tr>
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><strong>Bí mật giá &amp; nguồn vườn</strong></td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#b91c1c">Trôi nổi trên nhóm chat Zalo vựa</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#0f766e;font-weight:700">Khóa 127.0.0.1 (Luật 91/2025/QH15)</td>
          </tr>
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><strong>Thương lái Trung Quốc duyệt</strong></td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#b91c1c">Chờ xem ảnh giấy chụp mờ, dễ nghi</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#0f766e;font-weight:700">Quét mã QR chữ ký số Ed25519</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`;
}
