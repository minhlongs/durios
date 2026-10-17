# Sổ Tay Triển Khai Cụm Mật Độ Cao ĐBSCL (Step 15: Dense Cluster GTM Playbook)

**Mã tài liệu:** `docs/pilot-readiness/05_DENSE_CLUSTER_GTM_PLAYBOOK.md`  
**Ngày ban hành:** 2026-10-17  
**Module thực thi:** `src/sharing/dense-cluster-readiness.ts`  
**Trạng thái:** **ACTIVE_GATE_GOVERNED**

---

## 1. Nguyên Tắc Cốt Lõi: Mật Độ Cụm Trước Khi Mở Rộng Địa Lý

Hiệu ứng mạng lưới (Network Effects) của DuriOS chỉ xuất hiện khi các bên giao dịch lặp đi lặp lại trên cùng một chuẩn bằng chứng (`DuriOS Verified Profile` + `DossierExportManifest`). Việc ký rời rạc từng vựa ở nhiều tỉnh xa nhau không tạo ra mật độ mạng lưới. Do đó, DuriOS tập trung xây dựng **Cụm Mật Độ Cao Số 01 tại Tiền Giang / Đồng Bằng Sông Cửu Long (`MEKONG_DELTA_TIENGIANG_01`)**.

---

## 2. Cổng Điều Kiện Tiên Quyết (Fail-Closed Expansion Gate)

Hàm `evaluateDenseClusterReadiness()` trong `src/sharing/dense-cluster-readiness.ts` khóa chặt việc mở rộng sang cụm nếu chưa thỏa mãn đồng thời 2 điều kiện từ điểm xuất phát Cai Lậy (`SITE-CAILAY-TIENGIANG-01`):
1. `beachheadGate05Passed === true`: Vượt qua 5 container diễn tập với thời gian đối soát trung bình (Arithmetic Mean) $< 5,0$ phút và bắt 100% lỗi gài mù.
2. `beachheadPaidConversionConfirmed === true`: Vựa đầu tiên tại Cai Lậy ký hợp đồng thương mại trả phí (tránh vi phạm Hard Kill Criterion #1 về Willingness-To-Pay).

---

## 3. Cấu Trúc Mục Tiêu Cụm ĐBSCL (`MEKONG_DELTA_CLUSTER_TARGETS`)

| Vai trò nút mạng (`ClusterNodeRole`) | Số lượng mục tiêu tối thiểu | Vai trò trong chuỗi giá trị Verified Container |
|---|---|---|
| **`PACKHOUSE`** (Cơ sở đóng gói) | **8 cơ sở** | Tạo lập, đối soát chứng từ tại bàn cân và đóng dấu niêm phong container |
| **`EXPORTER`** (Doanh nghiệp xuất khẩu) | **3 doanh nghiệp** | Thu gom container từ nhiều vựa, kiểm tra chéo hồ sơ và đứng tên tờ khai hải quan |
| **`ACCREDITED_LAB`** (Phòng kiểm nghiệm) | **2 phòng lab** | Trả kết quả Cadimi & Vàng O ký số qua `PartnerLabWebhookIngestor` |
| **`COLD_CHAIN_LOGISTICS`** (Vận tải lạnh) | **3 đơn vị** | Cung cấp nhật ký nhiệt độ container lạnh (`12°C - 15°C`) và số chì hải quan |
| **`BUYER_IMPORTER`** (Thương nhân nhập khẩu) | **5 nhà mua** | Kiểm chứng gói bằng chứng bằng `MIT Standalone Manifest Verifier` tại cửa khẩu |

---

## 4. Công Thức Đo Lường Mật Độ Mạng Lưới (`networkDensityScore`)

$$\text{Network Density} = \frac{|E_{\text{verified}}|}{N_{\text{active}} \times (N_{\text{active}} - 1)}$$

Trong đó:
- $N_{\text{active}}$: Tổng số tổ chức trong cụm đã kích hoạt `VerifiedOrganizationProfile`.
- $|E_{\text{verified}}|$: Số cặp tổ chức có ít nhất 1 container đã được đối soát và xác minh thành công (`verifiedContainersCount > 0`).
