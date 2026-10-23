# DuriOS Thẩm Định Thực Địa & Mô Hình Kinh Tế V2 (Validation & Economics v2.0)

**Mã tài liệu:** `docs/product-direction/VALIDATION-AND-ECONOMICS-V2.md`  
**Ngày cập nhật:** 2026-10-17  
**Trạng thái:** **DRAFT_FOR_FOUNDER_REVIEW**  
**Tài liệu tham chiếu:** `docs/product-direction/PRODUCT-PRD-V1.md`, `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`  
**Thứ bậc bằng chứng:** `ECONOMIC_TRUTH_FIRST` — Dựa trên số liệu chính thức của Bộ NN&MT tháng 9/2026 và tỷ giá tham khảo NHNN (~25.637 VND/USD).

---

## 1. Sự Thật Kinh Tế & Bài Toán 1 Triệu USD ARR (Economic Truth First)

### 1.1. Hiện thực thị trường cơ sở đóng gói tại Việt Nam
- Theo báo cáo chính thức của **Bộ Nông nghiệp & Môi trường**, công bố ngày 03/09/2026 tại họp báo Chính phủ thường kỳ tháng 8 ([nguồn](https://baochinhphu.vn/hop-bao-chinh-phu-thuong-ky-thang-8-dai-dien-bo-cong-an-lam-ro-nhieu-van-de-duoc-quan-tam-102260903170016698.htm)):
  - Cả nước hiện có khoảng **1.599 mã số vùng trồng** và **281 cơ sở đóng gói sầu riêng đang hoạt động**.
  - Kim ngạch xuất khẩu sầu riêng năm 2025 đạt khoảng **3,85 tỷ USD**; 8 tháng đầu năm 2026 ước đạt **1,95 tỷ USD** (trong đó Trung Quốc chiếm khoảng 95%).
- **Trần doanh thu SaaS thuần túy tại Việt Nam:**
  - Giả định mức giá thương mại: **60.000.000 VND / vựa / năm**.
  - Tỷ giá giả định kế hoạch: **25.637 VND / USD** (tham chiếu Ngân hàng Nhà nước; là giả định cho mô hình, không phải tỷ giá niêm yết chính thức tại thời điểm tính).
  - Nếu chiếm trọn **100% thị phần** toàn bộ 281 cơ sở đóng gói đang hoạt động:
    $$\text{Max SaaS Revenue} = 281 \times 60.000.000\text{ VND} = 16.860.000.000\text{ VND} \approx \mathbf{\$657.643\text{ ARR}}$$
  - Để đạt được **\$1.000.000 ARR** chỉ bằng tiền bán phần mềm 60 triệu VND/vựa:
    $$\text{Số vựa cần thiết} = \left\lceil \frac{1.000.000 \times 25.637}{60.000.000} \right\rceil = \lceil 427{,}28 \rceil = \mathbf{428\text{ vựa}}$$
  - Vì không thể bán một phần vựa, 427 vựa (≈ $999.337 ARR) vẫn **chưa đủ** đạt $1.000.000 ARR; chỉ 428 vựa (≈ $1.001.677 ARR) mới đạt.
  - **Kết luận không thể chối cãi:** $428\text{ vựa} > 281\text{ cơ sở đang hoạt động tại Việt Nam}$. Do đó, **ngay cả khi chiếm 100% thị phần vựa tại Việt Nam, DuriOS vẫn không thể đạt 1 triệu USD ARR chỉ bằng mô hình thuê bao SaaS đơn thuần.**

### 1.2. Thang đa tầng doanh thu (Multi-Revenue Stack) & Regional Expansion
Mục tiêu 1 triệu USD ARR bắt buộc phải là **khu vực Đông Nam Á (Thái Lan, Malaysia)** hoặc **kết hợp đa tầng doanh thu**:

| Tầng doanh thu | Bản chất kinh tế | Thời điểm mở |
|---|---|---|
| **1. DuriOS Core** | SaaS thuê bao / vựa / năm (60M VND) | Ngay sau Pilot Cai Lậy |
| **2. Verification Modules** | Phí gói đối soát nâng cao / container | Sau khi đạt PMF tại chỗ |
| **3. Multi-site Enterprise** | Hợp đồng cấp tập đoàn xuất khẩu / chuỗi vựa | Sau 3–5 khách hàng đầu tiên |
| **4. Verified Network Rooms** | Phí thành viên / API chia sẻ hồ sơ đối tác | Khi mạng lưới kín có thanh khoản |
| **5. Transaction Orchestration** | Phí điều phối giao dịch thành công (Take rate 0.1% – 0.5%) | Giai đoạn Closed Trade Network |
| **6. Logistics / Lab Referral** | Phí giới thiệu kiểm nghiệm / vận tải lạnh | Sau khi tích hợp API đối tác |
| **7. Finance / Insurance Share** | Chia sẻ doanh thu tài trợ thương mại với ngân hàng | Hợp tác tổ chức tín dụng cấp phép |
| **8. Regional Enterprise** | Hợp đồng xuất khẩu tại Thái Lan (57% thị phần), Malaysia | Mở rộng ASEAN |

*So sánh quy mô transaction fee:* Với 3,85 tỷ USD kim ngạch sầu riêng Việt Nam, chỉ cần điều phối qua nền tảng với take-rate 0.25%, nền tảng chỉ cần đạt 400 triệu USD Verified GMV (~10.4% kim ngạch) là đã đạt 1 triệu USD doanh thu.

### 1.3. Hệ chỉ số North Star toàn diện
Không chỉ theo dõi ARR đơn lẻ, hệ thống theo dõi song song:
1. **Verified GMV (North Star tối cao):** Tổng giá trị hàng hóa thực tế được chứng thực qua chuỗi bằng chứng DuriOS (không tính giao dịch không có evidence).
2. **Revenue per Verified Container:** Doanh thu trung bình trên mỗi container được xác thực.
3. **Gross Profit per Container:** Lợi nhuận gộp sau khi trừ chi phí vận hành và hạ tầng cho mỗi container.
4. **CAC Payback:** Thời gian hoàn vốn chi phí thu hút khách hàng (< 12 tháng).
5. **Cross-organization Network Density:** Mật độ liên kết xác thực giữa các tổ chức (Vựa ↔ Exporter ↔ Importer ↔ Lab ↔ Logistics).

---

## 2. Giao Thức Thẩm Định Thực Địa & 4 Phép Đo Mới

### 2.1. Phép đo thời gian đối soát chính (Primary KPI)
- **Chỉ số bắt buộc:** **Trung bình số học (Arithmetic Mean)** thời gian đối soát bộ hồ sơ:
  $$\text{Mean Time} = \frac{1}{N} \sum_{i=1}^{N} T_i < 5.0\text{ phút} \quad (N = 5\text{ containers})$$
- Tuyệt đối không thay bằng Trung vị (Median) để che giấu ca chậm; giữ nguyên trung bình số học để phản ánh trung thực rủi ro thực tế.

### 2.2. Bốn chỉ số đo lường bổ sung ngay từ container đầu tiên
Để chứng minh giá trị kinh tế trực tiếp cho chủ vựa, DuriOS đo lường và hiển thị 4 chỉ số:
1. **Số phút tiết kiệm được / container (`minutesSavedPerContainer`):** So sánh giữa thời gian xử lý thủ công (trung bình 30–45 phút) với thời gian trên DuriOS.
2. **Số điểm chạm con người (`humanTouchesPerContainer`):** Đếm số lần nhân viên phải gõ phím / can thiệp chỉnh sửa dữ liệu trên một container.
3. **Số ngoại lệ bất thường phát hiện sớm (`exceptionsDiscoveredPerContainer`):** Số lỗi sai container, sai chì, quá hạn kiểm nghiệm được phát hiện trước khi đóng hàng.
4. **Thiệt hại tài chính dự phòng ngăn chặn được (`expectedLossAvoidedVnd`):** Ước tính số tiền vựa tránh bị phạt hoặc trả hàng (ước tính 20.000.000 – 50.000.000 VND / container nếu sai số chì tại cửa khẩu).

---

## 3. Chín Tiêu Chí Dừng Nghiêm Ngặt (9 Hard Kill Criteria)

| Tiêu chí | Dấu hiệu vi phạm | Hành động dứt khoát |
|---|---|---|
| **1. WTP Failure** | Vựa không chịu trả tiền thuê bao sau pilot dù đạt KPI thời gian | Dừng mở rộng bán hàng; quay lại tìm hiểu nỗi đau thực sự |
| **2. Workflow Rejection** | < 5 phút nhưng nhân viên vẫn dùng Excel/Zalo làm nguồn sự thật | Sản phẩm chưa chiếm được luồng công việc; tinh giản UI/UX |
| **3. Exception Detection Failure** | Không bắt được 100% lỗi gài mù (planted blind faults) | Dừng tuyên bố kiểm định an toàn; sửa lại rule engine |
| **4. Privacy Sharing Refusal** | Vựa không muốn chia sẻ bất kỳ trường thông tin nào ra bên ngoài | Giả thuyết mạng lưới không khả thi; giữ ở mức local tool |
| **5. Buyer Indifference** | Người mua không ưu tiên chọn vựa có hồ sơ DuriOS Verified | Bằng chứng chưa tạo ra giá trị kinh tế thương mại |
| **6. No Repeat Trades** | Không có giao dịch lặp lại giữa các tổ chức trên mạng lưới | Dừng ý định mở sàn giao dịch B2B (Marketplace) |
| **7. Subsidy Dependency** | Mạng lưới chỉ có giao dịch khi nền tảng bỏ tiền trợ giá | Không gọi đó là hiệu ứng mạng lưới (Network Effect) |
| **8. High CAC Payback** | Thời gian hoàn vốn chi phí bán hàng (CAC Payback) > 18 tháng | Xem lại chiến lược giá và kênh phân phối |
| **9. Model Non-Portability** | Sang nước thứ hai (Malaysia) phải viết lại toàn bộ mã nguồn | Kiến trúc khu vực thất bại; cấu trúc lại Country Adapter |
