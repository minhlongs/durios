# DuriOS — Container Dossier Workspace (Local Prototype)

> Hệ điều hành quản lý hồ sơ kỹ thuật số và kiểm tra tuân thủ xuất khẩu sầu riêng (Bản thử nghiệm cục bộ)  
> Digital technical dossier workspace and export compliance verification system for Vietnamese durian (Local development prototype).

---

## 1. Tổng quan & Bản chất hệ thống / Overview

DuriOS là công cụ cục bộ hỗ trợ chuẩn bị và đối soát hồ sơ container xuất khẩu sầu riêng tươi sang thị trường Trung Quốc (GACC). Hệ thống tập trung vào một quy trình cốt lõi duy nhất:

**Tạo hồ sơ container** $\rightarrow$ **Tải chứng từ mẫu** $\rightarrow$ **Băm SHA-256 trên máy chủ** $\rightarrow$ **Trích xuất trường dữ liệu ứng viên** $\rightarrow$ **Xác minh người vận hành (HITL)** $\rightarrow$ **Chạy kiểm tra tuân thủ tất định** $\rightarrow$ **Cảnh báo lỗi/nguy cơ** $\rightarrow$ **Xuất gói hồ sơ niêm phong số** $\rightarrow$ **Lưu vết kiểm toán chuỗi băm (Hash-chain Audit)** $\rightarrow$ **Lưu trữ bền vững qua SQLite**.

---

## 2. Yêu cầu tiên quyết / Prerequisites

- **Bun**: $\ge 1.3.0$ (Đã kiểm nghiệm trên Bun `1.3.14` trên macOS Darwin).
- **TypeScript**: $\ge 5.7.0$.
- Không yêu cầu cài đặt Docker, PostgreSQL, hoặc các dịch vụ đám mây bên ngoài.

---

## 3. Cài đặt & Lệnh vận hành / Setup & Commands

### 3.1 Cài đặt phụ thuộc / Install dependencies
```bash
bun install
```

### 3.2 Kiểm tra kiểu dữ liệu / Type checking
```bash
bun run typecheck
```

### 3.3 Chạy toàn bộ kiểm thử tự động / Run test suite
```bash
bun test
```
*Tất cả 21 bài kiểm thử trải rộng trên 6 bộ test suite (Persistence, HTTP API, Ingestion, HITL, FSM, Rules, Audit Tamper Detection) chạy trong ~200ms.*

### 3.4 Khởi động máy chủ HTTP & Giao diện trình duyệt / Start Local Server & Web Workspace
```bash
bun run start:server
```
- Máy chủ gắn kết cục bộ độc quyền tại: `http://127.0.0.1:3000` (hoặc cổng cấu hình qua `PORT`).
- Giao diện người dùng Web tiếng Việt có sẵn trực tiếp tại: `http://127.0.0.1:3000/`.

### 3.5 Chạy kịch bản dòng lệnh mô phỏng đầy đủ / Run CLI End-to-End Simulation
```bash
bun run start
# hoặc: bun run src/cli.ts
```

---

## 4. Kiến trúc lưu trữ & Bền vững dữ liệu / Persistence & Data Architecture

- **Cơ sở dữ liệu SQLite cục bộ (`./data/durios.db`)**:
  - Sử dụng module gốc `bun:sqlite`, chế độ WAL (`PRAGMA journal_mode = WAL`) và kích hoạt toàn vẹn khóa ngoại (`PRAGMA foreign_keys = ON`).
  - Hệ thống di chuyển schema phiên bản tự động (`schema_migrations`), chạy an toàn và lặp lại không phá hủy dữ liệu.
- **Thư mục lưu trữ tệp cục bộ (`./data/uploads/`)**:
  - Lưu trữ byte tệp độc lập với metadata cơ sở dữ liệu.
  - Tên tệp được sinh định danh an toàn dạng `doc_<uuid>_<timestamp>.bin` nhằm ngăn chặn tấn công Path Traversal.
  - Băm SHA-256 được tính toán tại máy chủ từ nội dung byte thực tế của tệp.
- **Cách xóa sạch dữ liệu thử nghiệm an toàn / Reset Demo Data**:
  ```bash
  rm -f data/*.db data/*.db-wal data/*.db-shm
  rm -rf data/uploads/*
  ```

---

## 5. Ranh giới an toàn & Kiểm toán / Security Boundary & Audit Ledger

1. **Ranh giới bảo mật cục bộ**:
   - Máy chủ chỉ lắng nghe trên `127.0.0.1`. Tuyệt đối không mở ra mạng nội bộ (LAN) hoặc Internet công cộng.
   - Phiên bản nguyên mẫu này mô phỏng cơ chế phân quyền RBAC (`CLERK` và `MANAGER`) thông qua HTTP header `x-actor-role` hoặc URL query parameter `role`. Đây là môi trường thử nghiệm phát triển, **chưa phải là hệ thống xác thực sản xuất (Production Auth)**.
2. **Sổ cái kiểm toán chuỗi băm (SHA-256 Hash Chain)**:
   - Mọi thay đổi trạng thái và xác minh con người được ghi nhận bất biến theo mô hình append-only.
   - Mỗi bản ghi chứa `previousHash` liên kết ngược về khối khởi thủy (`GENESIS-000...`).
   - *Phân định kỹ thuật quan trọng*: Chuỗi băm SHA-256 cung cấp khả năng phát hiện sửa đổi dữ liệu (Tamper Detection) khi đối chiếu với một mốc tham chiếu tin cậy. Chuỗi băm **không** biến cơ sở dữ liệu thành phần cứng chống ghi (WORM) nếu quản trị viên có quyền truy cập toàn bộ đĩa để tính lại chuỗi. Hệ thống phát hiện lập tức khi phát hiện payload bị sửa đổi, bản ghi bị xóa hoặc sai thứ tự và từ chối xuất gói hồ sơ.

---

## 6. Tuyên bố pháp lý & Quy tắc an toàn quy chuẩn / Regulatory Disclaimers

1. **Không phải phê duyệt của chính phủ**:
   - DuriOS là công cụ hỗ trợ chuẩn bị kỹ thuật và kiểm tra logic nội bộ. Việc hệ thống thông báo trạng thái `PASSED` **không đồng nghĩa** với việc lô hàng được cơ quan hải quan (GACC) hay cơ quan kiểm dịch thông quan pháp lý.
2. **Quy chuẩn Cadmium (GB 2762-2022 vs. Ngưỡng nội bộ)**:
   - **Giới hạn luật định**: Ngưỡng hàm lượng Cadmium theo quy chuẩn Trung Quốc GB 2762-2022 là **0.050 mg/kg**. Vượt quá ngưỡng này cấu thành vi phạm quy chuẩn nghiêm trọng (`CRITICAL_BLOCKER`).
   - **Ngưỡng cảnh báo nội bộ nhà đóng gói**: Ngưỡng **0.040 mg/kg** được hệ thống dán nhãn rõ ràng là **CẢNH BÁO NỘI BỘ (INTERNAL ADVISORY)** nhằm mục đích an toàn, không được phép coi là vi phạm pháp luật nếu hàm lượng $\le 0.050\text{ mg/kg}$.
3. **Quy tắc trích xuất giả lập**:
   - Bộ giải mã hiện tại sử dụng fixture mẫu (`synthetic fixture extractor`) để phát triển cục bộ, không phải hệ thống thị giác máy tính OCR trực tiếp trên môi trường thực tế.
4. **Bắt buộc xác minh con người (HITL)**:
   - Mọi trường dữ liệu trích xuất tự động phải được chuyên viên xác nhận (`HUMAN_VERIFIED`) trước khi hệ thống cho phép hoàn thành thẩm định và phê duyệt xuất hồ sơ.

---

## 7. Cấu trúc gói xuất khẩu / Export Manifest Bundle

Gói xuất khẩu bao gồm:
- Định danh và thông tin container (`dossierCode`, `containerNumber`, `sealNumber`).
- Bảng kê các chứng từ kèm mã băm SHA-256 độc lập.
- Tóm tắt dữ liệu đã được chuyên viên con người xác thực.
- Mã băm tổng hợp liên kết (`compositeManifestSha256`).
- Lịch sử kiểm toán và khuyến cáo pháp lý bắt buộc.

---

## 8. Hạn chế hiện tại / Known Limitations

- Chưa tích hợp cơ chế xác thực phiên người dùng sản xuất (JWT/OAuth2/Session Cookie an toàn).
- Hiện hỗ trợ chế độ Single-Tenant mô phỏng phân quyền cục bộ.
- Trích xuất dữ liệu đang dựa trên template fixture đồng bộ, chưa có pipeline OCR AI cho chứng từ quét thực tế chất lượng thấp.
- Cơ sở dữ liệu SQLite cục bộ phù hợp cho một máy trạm đơn lẻ, chưa hỗ trợ đồng bộ đa chi nhánh phân tán.
