# Biểu Mẫu Chấp Thuận Dữ Liệu, Chính Sách Lưu/Xóa & Quy Trình Đo KPI Pilot

**Mã tài liệu:** `docs/pilot-readiness/04_DATA_PERMISSION_CONSENT_AND_KPI_PROTOCOL.md`  
**Ngày phát hành:** 2026-10-14  
**Phạm vi áp dụng:** Pilot kín tại 01 vựa đóng gói (On-Premise)

---

## Phần A — Biểu Mẫu Xin Phép Sử Dụng Dữ Liệu & Giới Hạn Trách Nhiệm (Data Permission & Consent Form)

> **Điều kiện bắt buộc:** Chỉ được nạp chứng từ thực tế của vựa vào máy chủ DuriOS sau khi đại diện có thẩm quyền của vựa đã ký xác nhận biểu mẫu dưới đây.

### BIÊN BẢN CHẤP THUẬN SỬ DỤNG DỮ LIỆU CHỨNG TỪ TRONG ĐỢT PILOT KÍN (ON-PREM)

1. **Thông tin Đơn vị Tham gia Pilot (Chủ sở hữu dữ liệu):**
   - Tên cơ sở đóng gói / Doanh nghiệp: `........................................................`
   - Địa chỉ vựa: `..........................................................................`
   - Người đại diện có thẩm quyền: `...............................` Chức vụ: `.................`
   - Mã định danh Tenant trên máy chủ cục bộ: `................................................`

2. **Phạm vi dữ liệu và Chế độ lưu trữ tại chỗ (Local-First On-Premise):**
   - Dữ liệu đưa vào hệ thống trong đợt Pilot gồm: thông tin Container/Seal, bản điện tử (PDF/ảnh) của Phiếu đóng gói (Packing List), Phiếu kết quả thử nghiệm phòng Lab, Giấy chứng nhận kiểm dịch thực vật, Hóa đơn/Hợp đồng (nếu có) và hồ sơ bằng chứng hữu cơ (nếu có).
   - Toàn bộ cơ sở dữ liệu SQLite và tệp nhị phân (`storage/blobs/{sha256}.bin`) được **lưu trữ trực tiếp trên máy chủ đặt tại vựa**; không tải lên đám mây công cộng và không chia sẻ cho bất kỳ bên thứ ba nào nếu Quản lý vựa không chủ động cấp quyền chia sẻ (`ShareAccessGrant`).

3. **Tuyên bố Giới hạn Trách nhiệm Pháp lý & Kỹ thuật (Mandatory Disclaimers):**
   - **Không cam kết thông quan:** DuriOS là phần mềm hỗ trợ đối chiếu chứng từ nội bộ tại vựa trước khi xuất hàng. Kết quả kiểm tra của phần mềm **không thay thế** quyết định kiểm tra, kiểm dịch hoặc thông quan của cơ quan Hải quan Việt Nam, GACC Trung Quốc hoặc bất kỳ cơ quan nhà nước nào.
   - **Không tự nhận chứng nhận hữu cơ:** Đối với hồ sơ bằng chứng hữu cơ do vựa tải lên, DuriOS chỉ lưu trữ nguyên trạng tệp chứng từ với trạng thái hệ thống cố định là `EVIDENCE_STORED_NOT_CERTIFIED` kèm tuyên bố miễn trừ trách nhiệm chuẩn. DuriOS không phải là tổ chức chứng nhận và không xác minh tính hợp pháp của chứng chỉ.
   - **Tuân thủ Bảo vệ Dữ liệu Cá nhân & Giao dịch Điện tử hiện hành (2026):** Việc thu thập tối thiểu dữ liệu nhân sự vận hành (họ tên, số điện thoại nhận OTP của Thư ký/Quản lý vựa) tuân thủ **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** (hiệu lực từ `2026-01-01`) và **Luật Giao dịch điện tử số 20/2023/QH15**. Giai đoạn Pilot chỉ vận hành phần mềm nội bộ tại vựa, chưa cung cấp sàn giao dịch thương mại điện tử hay dịch vụ trung gian thanh toán/ký quỹ theo **Luật Thương mại điện tử số 122/2025/QH15**, **Nghị định 248/2026/NĐ-CP** (hiệu lực từ `2026-07-01`) và **Nghị định 52/2024/NĐ-CP**.
   - **Giả thuyết phí:** Mọi mức phí thảo luận trong giai đoạn đánh giá là giả thuyết kiểm chứng cho đợt Pilot và chỉ có hiệu lực thương mại khi hai bên ký hợp đồng dịch vụ riêng.

4. **Thời hạn lưu trữ & Quy trình xóa sạch dữ liệu (Retention & Deletion Policy):**
   - **Trong thời gian Pilot (tối đa 90 ngày):** Dữ liệu được giữ trên máy chủ tại vựa và các bản sao lưu mã hóa tại chỗ để phục vụ đối chiếu và kiểm tra tính toàn vẹn.
   - **Khi kết thúc Pilot hoặc theo yêu cầu bất kỳ lúc nào của Chủ vựa:** Trong vòng **24 giờ** kể từ khi Chủ vựa yêu cầu kết thúc và xóa dữ liệu, kỹ thuật viên thực hiện xóa vĩnh viễn tệp cơ sở dữ liệu SQLite (`durios.db`, `-wal`, `-shm`), thư mục `storage/blobs/`, và toàn bộ các bản sao lưu liên quan trước sự chứng kiến của đại diện vựa, đồng thời lập **Biên bản Xác nhận Đã Xóa Dữ liệu (Data Destruction Certificate)**.

**Xác nhận của Đại diện Vựa**                              **Xác nhận của Đại diện DuriOS**  
*(Ký, ghi rõ họ tên & đóng dấu nếu có)*                   *(Ký, ghi rõ họ tên)*

---

## Phần B — Quy Trình Đo Lường KPI Pilot (`< 5 Phút/Container` Đạt, `< 3 Phút` Mục Tiêu)

### 1. Định nghĩa Đồng hồ Đo Thời gian Xử lý mỗi Container

- **Điểm Bắt đầu (`T_start`):** Thời điểm Thư ký chứng từ (`PACKHOUSE_CLERK`) bấm tạo hồ sơ `ContainerDossier` mới cho lô hàng (hoặc thời điểm tải tệp chứng từ đầu tiên lên hồ sơ đó), được hệ thống ghi nhận tự động tại trường `createdAt` / `uploadedAt` trong SQLite.
- **Điểm Kết thúc (`T_end`):** Thời điểm Thư ký hoàn tất xác minh các trường bắt buộc (`HUMAN_VERIFIED`) và bấm chạy kiểm tra quy tắc (`POST /api/v1/dossiers/:id/validate`), hệ thống trả về kết quả đánh giá hợp lệ (`READY_FOR_REVIEW`, `REVIEW_REQUIRED`, hoặc chặn đúng lỗi tại `VALIDATION_BLOCKED`), được ghi nhận tại trường `latestValidationResult.evaluatedAt`.
- **Công thức thời gian thao tác:**
  $$\Delta T_{\text{container}} = T_{\text{end}} - T_{\text{start}}$$
  *(Lưu ý: Thời gian chờ Quản lý vựa đi hiện trường quay lại bấm nút `Approve` / `Export` được ghi nhận riêng và không cộng vào thời gian thao tác đối chiếu của Thư ký).*

### 2. Ngưỡng Nghiệm Thu Thời Gian & Độ Chính Xác

> **Lệnh tự động hóa diễn tập & chấm điểm KPI (`GATE-05`):**
> - Khởi tạo 5 container diễn tập (gồm 2 ca gài lỗi mù): `bun run pilot:seed-rehearsal`
> - Chấm điểm KPI tự động từ SQLite (`meanDeltaSeconds < 300`, `zeroMissGate === true`): `bun run pilot:evaluate-kpi`

| Chỉ số KPI | Ngưỡng Đạt Pilot (Pass Gate) | Mục Tiêu Hiệu Suất (Target) | Cách xác minh |
|---|---|---|---|
| **Thời gian đối chiếu 01 bộ hồ sơ container ($\Delta T_{\text{container}}$)** | **$< 5\text{ phút}$ ($< 300\text{ giây}$)** trung bình trên 5 container thực tế | **$< 3\text{ phút}$ ($< 180\text{ giây}$)** | Trích xuất trực tiếp `evaluatedAt - createdAt` từ sổ cái kiểm toán SQLite (`audit_events`) kết hợp đồng hồ bấm giờ tại bàn giấy. |
| **Tỷ lệ chặn lỗi sai lệch Container / Seal / Thiếu chứng từ bắt buộc** | **$100\%$ lỗi bị chặn trước khi niêm phong** (`VALIDATION_BLOCKED`) | **$100\%$** | Kiểm tra thực tế trên 5 container + thực hiện tối thiểu **02 ca kiểm tra mù (Blind Fault-Injection)**. |

### 3. Quy Trình Xác Nhận Lỗi Container / Seal Bị Bỏ Sót (Zero-Miss Verification Protocol)

1. **Đối chiếu 3 chiều trên từng container thật:**
   - So khớp `container_number` và `seal_number` trên: (a) Tệp Packing List, (b) Tệp Giấy kiểm dịch thực vật (Phytosanitary Certificate), và (c) Ảnh chụp thực tế cửa container/kẹp chì tại bãi đóng hàng của vựa.
2. **Kiểm tra mù bắt buộc (Controlled Blind Fault-Injection — tối thiểu 02 ca):**
   - Trước khi bắt đầu hoặc xen kẽ trong đợt diễn tập tại vựa, người giám sát đưa vào 02 bộ hồ sơ kiểm tra có gài lỗi cố ý mà không báo trước vị trí lỗi cho hệ thống:
     - **Ca kiểm tra mù #1:** Sai lệch 1 ký tự số Seal giữa Packing List (`SEAL-889901`) và Phytosanitary Certificate (`SEAL-889902`). Hệ thống bắt buộc phải báo lỗi quy tắc `RUL-SEAL-MATCH` và khóa trạng thái ở `VALIDATION_BLOCKED` (từ chối `POST .../approve` và `POST .../export`).
     - **Ca kiểm tra mù #2:** Thiếu tệp Phiếu kết quả phân tích phòng Lab (`LAB_REPORT`) hoặc có trường còn ở trạng thái `UNVERIFIED`. Hệ thống bắt buộc phải chặn không cho phê duyệt/xuất hồ sơ.

---

## Phần C — Bảng Ghi Nhận KPI Thực Địa (5 Container Pilot Log Sheet)

| STT Container | Mã Dossier (`dossierCode`) | Số Container / Số Seal | `T_start` (ISO) | `T_end` (ISO) | $\Delta T$ (giây) | Đạt `< 5 phút`? | Lỗi phát hiện & chặn trước khi xuất | Xác nhận của Quản lý vựa |
|---|---|---|---|---|---|---|---|---|
| Cont #1 | | | | | | [ ] Có / [ ] Không | | |
| Cont #2 | | | | | | [ ] Có / [ ] Không | | |
| Cont #3 | | | | | | [ ] Có / [ ] Không | | |
| Cont #4 | | | | | | [ ] Có / [ ] Không | | |
| Cont #5 | | | | | | [ ] Có / [ ] Không | | |
| **Ca mù #1 (Sai Seal)** | | | | | | [ ] Chặn đúng `VALIDATION_BLOCKED` | | |
| **Ca mù #2 (Thiếu chứng từ / Chưa verify)** | | | | | | [ ] Chặn đúng | | |
