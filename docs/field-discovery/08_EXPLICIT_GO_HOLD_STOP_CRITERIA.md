# DuriOS Field Discovery: Explicit GO / HOLD / STOP Criteria
## Tiêu Chí Ra Quyết Định Chuyển Giai Đoạn (Gating Criteria for Tranche 2)

> **GHI CHÚ ĐIỀU CHỈNH HIỆU LỰC (SUPERSESSION & GOVERNANCE ALIGNMENT NOTE — 2026-10-14):**  
> Tài liệu này được giữ nguyên làm **lịch sử giai đoạn khảo sát trước ngày 2026-10-14**. Định hướng sản phẩm và kiến trúc hiện hành là `docs/product-direction/PRODUCT-PRD-V1.md` và `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` (**APPROVED — Founder approval, 2026-10-14**). Cổng khai trương **Pilot kín thực tế tại 01 vựa (on-prem, ưu tiên Cai Lậy)** và ngưỡng KPI (`< 5 phút/container` đạt, `< 3 phút/container` mục tiêu) được quy định tại `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`. Mọi mức phí trong PRD tiếp tục là giả thuyết kiểm chứng.

**Căn cứ pháp lý & Quản trị tài chính:**  
- Báo cáo Thẩm định độc lập: `Audit-03 (Conditional GO)`
- Giới hạn giải ngân Tranche 1: `7,500,000 VND` (Chỉ dành riêng cho Khảo sát thực địa, cấm viết code sản xuất).
- Giai đoạn đánh giá: Kết thúc Ngày 21 của Kế hoạch Khảo sát Thực địa.

---

## 1. Điều Kiện Đạt Chuẩn "GO" (Proceed to Tranche 2 - MVP Pilot Build)

*Để kích hoạt Tranche 2 (Hạn mức: 12,500,000 VND để hoàn thiện Local Pilot Engine và hỗ trợ kỹ thuật tại xưởng), BẮT BUỘC phải thoả mãn TOÀN BỘ 5 điều kiện sau:*

1. **Khách hàng sẵn sàng hợp tác (Access Gate):** Ít nhất 03 trong số tối thiểu 15 cơ sở tiếp cận (nhà đóng gói/hợp tác xã quy mô >3 cont/tuần) cho phép điều tra viên trực tiếp quan sát toàn bộ quy trình đóng cont và ghi nhận chứng từ thực tế.
2. **Cam kết thương mại bằng văn bản (Commercial Commitment Gate):** Ít nhất 01 nhà đóng gói hoặc doanh nghiệp xuất khẩu ký Bản Thoả Thuận Nguyên Tắc (LOI) đồng ý chạy thử nghiệm pilot 5 container với mức phí dịch vụ tối thiểu `2,500,000 - 5,000,000 VND` (có điều kiện hoàn tiền rõ ràng).
3. **Thu thập được mẫu chứng từ thực tế (Artifact Gate):** Thu thập được tối thiểu 03 bộ hồ sơ xuất khẩu ẩn danh thực tế (bao gồm Phiếu kết quả phân tích phòng Lab, Packing List, Bản thảo Phyto, Tờ khai hải quan) để làm dữ liệu chuẩn kiểm thử bộ quy tắc.
4. **Xác nhận tính khả thi của quy trình HITL (Workflow Fit Gate):** Thư ký chứng từ tại xưởng xác nhận giao diện xác thực đối chiếu Human-in-the-loop (gõ xác nhận trường dữ liệu trong vòng <3 phút/tài liệu) phù hợp với nhịp độ vận hành đóng cont.
5. **Kiểm soát ngân sách Tranche 1 (Capital Discipline Gate):** Tổng chi phí thực địa thực tế không vượt quá `7,500,000 VND` và có đầy đủ chứng từ thanh toán hợp lệ.

---

## 2. Điều Kiện Kích Hoạt Trạng Thái "HOLD" (Tạm Dừng Khảo Sát Thêm)

*Kích hoạt HOLD khi một trong các tình huống sau xảy ra, cần điều chỉnh phương pháp tiếp cận trong vòng tối đa 14 ngày mà không được giải ngân thêm vốn:*

1. **Rào cản mùa vụ (Seasonal Timing Block):** Khảo sát thực hiện vào thời điểm giáp hạt hoặc cuối vụ, các xưởng tạm đóng cửa hoặc chạy dưới công suất 1 cont/tuần $\rightarrow$ *Giải pháp:* Tạm dừng, chuyển vùng khảo sát sang vùng chuẩn bị vào vụ chính (ví dụ từ Miền Tây chuyển sang Đắk Lắk).
2. **E ngại về chia sẻ dữ liệu (Data Privacy Hesitation):** Các xưởng từ chối cho xem chứng từ vì sợ lộ giá mua và khách hàng, nhưng vẫn quan tâm đến việc kiểm tra lỗi số seal/số cont $\rightarrow$ *Giải pháp:* Thiết kế lại quy trình che mờ thông tin thương mại (Anonymization Protocol) trước khi phỏng vấn lại.
3. **Mô hình giá chưa khớp (Pricing Mismatch):** Khách hàng từ chối gói năm 60 triệu VND nhưng tha thiết muốn trả theo từng container (Pay-per-container: 100k - 200k/cont) $\rightarrow$ *Giải pháp:* Tái cấu trúc mô hình kinh tế đơn vị trước khi quyết định GO.

---

## 3. Điều Kiện Kích Hoạt Lệnh "STOP" (Dừng Dự Án & Hoàn Trả Vốn)

*Kích hoạt STOP ngay lập tức, chấm dứt dự án, bảo toàn số vốn còn lại khi xảy ra BẤT KỲ MỘT trong các dấu hiệu sau:*

1. **Quy trình "Bao luật" triệt tiêu nhu cầu phần mềm (Structural Rent-Seeking):** 100% các cơ sở xuất khẩu khẳng định việc thông quan tại cửa khẩu hoàn toàn phụ thuộc vào dịch vụ lo trọn gói tại biên giới, sai lệch chứng từ và chỉ số Cadmium không ảnh hưởng đến quyết định thông quan $\rightarrow$ *Lý do:* Sản phẩm phần mềm không có giá trị phòng ngừa thực tế.
2. **Gian lận mã vùng trồng có tính hệ thống (Systemic PUC Fraud):** Các nhà đóng gói từ chối sử dụng bất kỳ hệ thống nào có tính năng ghi nhận phả hệ minh bạch (WORM audit ledger) vì lo ngại bị phát hiện việc mua gom sầu riêng ngoài vùng chỉ dẫn địa lý $\rightarrow$ *Lý do:* Thị trường ngầm không chấp nhận sản phẩm minh bạch.
3. **Mức sẵn sàng chi trả bằng 0 (Zero WTP):** Sau khi tiếp cận 15 cơ sở, không có bất kỳ đơn vị nào chấp nhận chi trả quá 500,000 VND cho toàn bộ mùa vụ hoặc từ chối mọi hình thức phần mềm để duy trì dùng Zalo + sổ tay miễn phí.
4. **Chính phủ triển khai nền tảng bắt buộc miễn phí (Displacement by Mandatory State Platform):** Bộ Nông nghiệp & PTNT triển khai hệ thống phần mềm quản lý mã vùng trồng và cấp Phyto điện tử tích hợp hoàn toàn miễn phí và bắt buộc mọi nhà vườn/nhà đóng gói phải sử dụng trực tiếp, không cho phép kết nối bên thứ ba.

---

## 4. Bảng Ký Duyệt Quyết Định (Sign-off Matrix)
- **Đại diện Nhóm Nghiên Cứu & Sáng Lập (Founder):** `[Ký & Ghi rõ họ tên]`
- **Đại diện Kiểm Soát Vốn & Thẩm Định Độc Lập (Auditor):** `[Ký & Ghi rõ họ tên]`
- **Ngày quyết định:** `[DD/MM/YYYY]`
