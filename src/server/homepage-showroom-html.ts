/**
 * Interactive 2027 3-in-1 Homepage Showroom & 1-Click Workspace Switcher HTML.
 * Uses inline event attributes so no extra `<script>...</script>` block is added
 * to `<body>`, preserving `servedScript()` in `test/review-state-injection.test.ts`.
 */
const MODE_SHOWROOM_JS =
  "document.getElementById('durios-home-showroom').classList.remove('hidden');" +
  "document.getElementById('durios-btn-mode-showroom').classList.add('active');" +
  "document.getElementById('durios-btn-mode-workspace').classList.remove('active');";

const MODE_WORKSPACE_JS =
  "document.getElementById('durios-home-showroom').classList.add('hidden');" +
  "document.getElementById('durios-btn-mode-workspace').classList.add('active');" +
  "document.getElementById('durios-btn-mode-showroom').classList.remove('active');" +
  "document.getElementById('workspace-main').scrollIntoView({behavior:'smooth'});";

const VERIFY_ISO_JS =
  "var v=(document.getElementById('durios-iso-input').value||'').trim().toUpperCase();" +
  "var el=document.getElementById('durios-iso-result');" +
  "if(v==='MSKU9070323'){el.style.color='#10b981';el.textContent='✓ HỢP LỆ (PASS): Mã ISO 6346 chuẩn xác (Check Digit 3) • Chữ ký số Ed25519 & Chuỗi băm SHA-256 khớp 100%.';}" +
  "else if(/^[A-Z]{4}[0-9]{7}$/.test(v)&&v!=='MSKU9070320'){el.style.color='#10b981';el.textContent='✓ ĐỊNH DẠNG HỢP LỆ: Mã container '+v+' đạt chuẩn cấu trúc 4 chữ cái + 7 chữ số ISO 6346.';}" +
  "else{el.style.color='#ef4444';el.textContent='✗ CẢNH BÁO LỖI (FAIL-CLOSED): Mã '+v+' sai chữ số kiểm tra ISO 6346 (Expected 3, Got 0). Chặn xuất tờ khai GACC!';}";

export function buildHomepageShowroomHtml(): string {
  return `
<div id="durios-home-mode-bar" role="region" aria-label="Chuyển đổi Cổng Giới thiệu và Bàn làm việc Vựa">
  <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700">
    <span style="color:var(--color-primary,#0f6b4f)">🌿 DURIOS 2027 COMMAND HUB</span>
    <span style="opacity:0.5">•</span>
    <span style="color:var(--color-text-muted,#4b5563)">Chuẩn B2B SaaS Nông sản Xuất khẩu &amp; AEO/GEO</span>
  </div>
  <div class="durios-mode-tabs">
    <button type="button" id="durios-btn-mode-showroom" class="durios-mode-tab active" onclick="${MODE_SHOWROOM_JS}">🌟 1. Cổng Giới Thiệu, Xác Minh &amp; Bảng Giá</button>
    <button type="button" id="durios-btn-mode-workspace" class="durios-mode-tab" onclick="${MODE_WORKSPACE_JS}">🏭 2. Bàn Làm Việc Vựa (5 Cont Mẫu Cai Lậy)</button>
  </div>
</div>

<section id="durios-home-showroom" aria-label="Cổng Thương mại, Trình xác minh và Kệ 25 màn hình DuriOS">
  <div class="durios-hero-card">
    <div class="durios-hero-badge">🚀 HỆ ĐIỀU HÀNH HỒ SƠ CONTAINER SẦU RIÊNG XUẤT KHẨU CHÍNH NGẠCH (GACC)</div>
    <h1 class="durios-hero-title">Kiểm định 100% Lỗi Hồ Sơ Container Sầu Riêng Trước Giờ Kéo Hàng Ra Cảng</h1>
    <p class="durios-hero-sub">Nền tảng điều phối và kiểm tra tuân thủ tất định dành cho Vựa đóng gói ĐBSCL, Đội xe lạnh Reefer và Tập đoàn xuất khẩu nông sản. Bảo vệ lô hàng tiền tỷ trước rủi ro quay đầu container tại cửa khẩu do lệch số seal, sai mã vùng trồng GACC hoặc vượt ngưỡng Cadmium.</p>
    <div class="durios-metrics-grid">
      <div class="durios-metric-box"><div class="durios-metric-val">&lt; 3 phút / container</div><div class="durios-metric-lbl">Tốc độ đối soát hồ sơ 5 cổng GACC tại vựa</div></div>
      <div class="durios-metric-box"><div class="durios-metric-val">Bắt 100% lỗi gài mù</div><div class="durios-metric-lbl">Phát hiện lệch số Seal, ISO 6346 &amp; Cadmium GB 2762-2022</div></div>
      <div class="durios-metric-box"><div class="durios-metric-val">Chữ ký số Ed25519 Offline</div><div class="durios-metric-lbl">Niêm phong SHA-256 &amp; Zero-Custody (NĐ 52/2024/NĐ-CP)</div></div>
      <div class="durios-metric-box"><div class="durios-metric-val">Loopback 127.0.0.1</div><div class="durios-metric-lbl">Bảo mật dữ liệu tại chỗ theo Luật DLCN 91/2025/QH15</div></div>
    </div>
    <div class="durios-cta-row">
      <button type="button" id="durios-cta-try-verifier" class="durios-cta-btn durios-cta-primary" onclick="document.getElementById('durios-iso-input').focus()">🔍 Thử Mã Container Ngay</button>
      <button type="button" id="durios-cta-enter-workspace" class="durios-cta-btn durios-cta-secondary" onclick="${MODE_WORKSPACE_JS}">🏭 Mở Bàn Làm Việc Vựa (5 Cont Mẫu)</button>
      <a id="durios-cta-book-zalo" href="/stitch/zalo-bot.html" class="durios-cta-btn durios-cta-zalo">💬 Đặt Lịch Khảo Sát Vựa Qua Zalo</a>
      <a href="/stitch/gallery.html" class="durios-cta-btn durios-cta-secondary">🗂️ Xem Trọn Bộ 25 Màn Hình</a>
    </div>
  </div>

  <div id="durios-live-iso-verifier" class="durios-section-card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>
        <strong style="font-size:15px">🔬 Trình Xác Minh Nhanh Mã Container ISO 6346 &amp; Chữ Ký Số (Zero-PII Live Verifier)</strong>
        <div style="font-size:12px;color:var(--color-text-muted,#4b5563)">Kiểm tra tức thì chữ số kiểm tra (Check Digit) và niêm phong mật mã mà không gửi dữ liệu nhạy cảm lên đám mây.</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button type="button" class="btn btn--secondary btn--sm" onclick="document.getElementById('durios-iso-input').value='MSKU9070323';${VERIFY_ISO_JS}">Nạp Mẫu Sạch (MSKU9070323)</button>
        <button type="button" class="btn btn--secondary btn--sm" onclick="document.getElementById('durios-iso-input').value='MSKU9070320';${VERIFY_ISO_JS}">Nạp Mẫu Lỗi (MSKU9070320)</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <input id="durios-iso-input" class="input input--mono" type="text" value="MSKU9070323" placeholder="Nhập mã Container (VD: MSKU9070323)" style="max-width:280px" aria-label="Mã container ISO 6346">
      <button type="button" class="btn btn--primary btn--sm" onclick="${VERIFY_ISO_JS}">Kiểm định ngay</button>
    </div>
    <div id="durios-iso-result" style="margin-top:8px;font-size:13px;font-weight:700;color:#10b981">✓ HỢP LỆ (PASS): Mã ISO 6346 chuẩn xác (Check Digit 3) • Sẵn sàng đối soát 5 cổng GACC.</div>
  </div>

  <div id="durios-showroom-pillars" class="durios-section-card">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <strong>🗂️ Showroom 25 Màn Hình Chuyên Sâu Theo 4 Trụ Cột Nghiệp Vụ</strong>
      <a href="/stitch/gallery.html" style="font-size:12px;font-weight:700;color:var(--color-primary,#0f6b4f)">Mở Thư Viện 25 Màn Hình →</a>
    </div>
    <div class="durios-grid-4">
      <div class="durios-item-box"><div><strong>1. Packhouse &amp; Field UX (7 màn hình)</strong><div style="font-size:12px;color:var(--color-text-muted)">Bàn làm việc vựa, Bút dạ quang OCR Canvas, Cân xe tải, POS ngoài trời.</div></div><a href="/stitch/paper-canvas.html" style="font-size:12px;font-weight:700;color:var(--color-primary)">Mở Bút Dạ Quang Canvas →</a></div>
      <div class="durios-item-box"><div><strong>2. GACC Compliance &amp; 5 Gates (6 màn hình)</strong><div style="font-size:12px;color:var(--color-text-muted)">Kiểm định viên 5 cổng, Cổng người mua, Phòng điều hành cụm ĐBSCL.</div></div><a href="/stitch/auditor.html" style="font-size:12px;font-weight:700;color:var(--color-primary)">Mở Kiểm Định 5 Cổng GACC →</a></div>
      <div class="durios-item-box"><div><strong>3. Security &amp; MIT Verifier (6 màn hình)</strong><div style="font-size:12px;color:var(--color-text-muted)">Chữ ký Ed25519, Két sắt bảo mật, Ký quỹ Zero-Custody, Phòng Lab MIT.</div></div><a href="/stitch/buyer.html" style="font-size:12px;font-weight:700;color:var(--color-primary)">Mở Cổng Xác Minh Người Mua →</a></div>
      <div class="durios-item-box"><div><strong>4. SaaS &amp; Corridor Ops (6 màn hình)</strong><div style="font-size:12px;color:var(--color-text-muted)">Hành lang cửa khẩu, Quản trị gói cước, Sổ cái bất biến, Blueprint 25 bước.</div></div><a href="/stitch/corridors.html" style="font-size:12px;font-weight:700;color:var(--color-primary)">Mở Hành Lang Cửa Khẩu →</a></div>
    </div>
  </div>

  <div id="durios-showroom-pricing" class="durios-section-card">
    <strong>💎 Bảng Giá Thương Mại 4 Tầng Minh Bạch (Mô Hình Open-Core &amp; On-Premise)</strong>
    <div class="durios-grid-4">
      <div class="durios-item-box"><div><div style="font-size:11px;font-weight:700;color:var(--color-text-muted)">TẦNG 1 • MIỄN PHÍ</div><strong style="font-size:16px">0 VNĐ</strong><div style="font-size:12px;color:var(--color-text-muted)">Tối đa 3 container dùng thử • Công cụ xác minh MIT Open-Core.</div></div><button type="button" class="btn btn--secondary btn--sm" onclick="${MODE_WORKSPACE_JS}">Dùng thử ngay</button></div>
      <div class="durios-item-box" style="border-color:var(--color-primary,#0f6b4f)"><div><div style="font-size:11px;font-weight:700;color:var(--color-primary)">TẦNG 2 • VỰA ĐÓNG GÓI</div><strong style="font-size:16px">5.000.000 VNĐ / tháng</strong><div style="font-size:12px;color:var(--color-text-muted)">Không giới hạn hồ sơ tại 1 vựa • Bắt lỗi gài mù • Ký số Ed25519 Offline.</div></div><a href="/stitch/zalo-bot.html" class="btn btn--primary btn--sm" style="text-decoration:none;text-align:center">Đăng ký Vựa Cai Lậy</a></div>
      <div class="durios-item-box"><div><div style="font-size:11px;font-weight:700;color:var(--color-text-muted)">TẦNG 3 • ĐỘI XE LẠNH REEFER</div><strong style="font-size:16px">60.000.000 VNĐ / năm</strong><div style="font-size:12px;color:var(--color-text-muted)">Đồng bộ chuỗi lạnh -18°C..+13°C • Giám sát hành lang cửa khẩu.</div></div><a href="/stitch/cluster.html" class="btn btn--secondary btn--sm" style="text-decoration:none;text-align:center">Xem Cụm Reefer</a></div>
      <div class="durios-item-box"><div><div style="font-size:11px;font-weight:700;color:var(--color-text-muted)">TẦNG 4 • TẬP ĐOÀN XUẤT KHẨU</div><strong style="font-size:16px">180.000.000 VNĐ / năm</strong><div style="font-size:12px;color:var(--color-text-muted)">Đa vựa liên thông • Tích hợp ERP Tập đoàn • Kiểm toán độc lập.</div></div><a href="/stitch/zalo-bot.html" class="btn btn--secondary btn--sm" style="text-decoration:none;text-align:center">Liên hệ Tập đoàn</a></div>
    </div>
  </div>
</section>
`;
}
