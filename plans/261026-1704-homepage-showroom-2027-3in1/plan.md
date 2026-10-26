---
status: completed
---

# Kế hoạch Thực thi: Trang chủ DuriOS 2027 3-trong-1 (Marketing • Verifier • Showroom 25 Màn hình • Workspace 1 chạm)

## 1. Mục tiêu (Objective)
Triển khai Cổng chỉ huy Trang chủ DuriOS 2027 tại `/` kết hợp hoàn hảo cả 3 thành tố:
1. **Cổng Marketing Chuẩn B2B SaaS Nông sản:** Hero Banner, 4 chỉ số vàng (< 3p/cont, bắt 100% lỗi gài mù, chữ ký Ed25519, bảo mật nội bộ 127.0.0.1), bảng giá 4 tầng minh bạch (0đ / 5tr / 60tr / 180tr), và bộ 3 nút chuyển đổi PLG.
2. **Trình Xác minh Container ISO 6346 & Chữ ký số Trực tiếp (Zero-PII Live Verifier):** Kiểm tra mã container và kiểm toán chữ ký số tức thì trên client/server.
3. **Showroom Kệ 25 Màn hình Tương tác:** Trưng bày 25 màn hình phân theo 4 trụ cột nghiệp vụ (Packhouse UX, GACC Compliance, Security Vault, SaaS Operations) kèm nút mở xem trực tiếp.
4. **Thanh Chuyển Mạch 1 Chạm:** Cho phép chuyển đổi tức thì giữa `[🌟 Cổng Giới Thiệu & Showroom]` và `[🏭 Bàn Làm Việc Vựa (Packhouse Workspace)]` mà không cần tải lại trang.

## 2. Ràng buộc bất biến (Hard Constraints)
- Mọi file `.ts` trong `src/` và `test/` phải giữ nghiêm ngặt trần `<= 100 LOC/file`.
- 0 lỗi TypeScript (`tsc --noEmit`), 0 kiểu `:any`, 0 `console.log` trong production code.
- **Ràng buộc kiểm thử đặc biệt:** Không chèn thêm thẻ `<script>...</script>` inline mới vào `<body>` của `index.html` vì `test/review-state-injection.test.ts` dùng `html.slice(html.indexOf("<script>"), html.lastIndexOf("</script>"))`. Mọi tương tác chuyển tab hoặc thử mã cont phải dùng thuộc tính sự kiện inline (`onclick`, `oninput`) hoặc hàm có sẵn trong `/stitch/durios-live-bridge.js`.
- Không xóa hay làm gián đoạn các selector kiểm thử DOM (`#dossier-nav`, `#workspace-main`, `#btn-pilot-rehearsal-seed`, `#actor-role`, `REVIEW_VOCABULARY_PLACEHOLDER`, `id="durios-dual-view-toggle"`).

## 3. Các giai đoạn triển khai (Phases)

### Giai đoạn 1: Thiết kế Module Giao diện Showroom (`src/server/`)
- `src/server/homepage-showroom-css.ts`: CSS cô lập riêng cho Hero Banner, Thanh Chuyển Mạch 1 Chạm, Hộp Xác Minh Nhanh, Kệ 25 Màn hình và Bảng giá 4 tầng. Kế thừa các biến `--color-*` và font hệ thống.
- `src/server/homepage-showroom-html.ts`: Cấu trúc HTML ngữ nghĩa của Cổng Marketing, Bộ 3 CTA, Hộp kiểm tra nhanh mã ISO 6346 với 2 nút mẫu container sạch/lỗi, Kệ 25 màn hình, và Bảng giá 4 tầng.
- `src/server/homepage-showroom-injector.ts`: Hàm tiêm `injectHomepageShowroom(rawHtml)` vào chuỗi HTML phục vụ của Workspace.

### Giai đoạn 2: Tích hợp vào Tầng Phục vụ Trang chủ (`src/server/static-ui.ts`)
- Tích hợp `injectHomepageShowroom` vào hàm `serveIndexHtml()` trong `src/server/static-ui.ts`.
- Đảm bảo khi mở `/` trên trình duyệt, thanh chuyển mạch cho phép chuyển qua lại giữa Showroom và Workspace mượt mà.

### Giai đoạn 3: Kiểm thử Tự động & Toàn vẹn Hệ thống
- `test/homepage-showroom-injection.test.ts`: Kiểm thử sự hiện diện của Hero banner, bộ 3 CTA, ô xác minh container, bảng giá 4 tầng, và thanh chuyển mạch 1 chạm trên `serveIndexHtml()`.
- Chạy toàn bộ test suite (`bun test`), kiểm tra typecheck (`bun run typecheck`), kiểm tra trần `<= 100 LOC/file`, và kiểm tra không có `:any`.

### Giai đoạn 4: Đóng gói Triển khai lên Cloudflare Pages & Khởi chạy Cục bộ
- Build bộ tĩnh và deploy lên `https://durios.pages.dev` qua `wrangler pages deploy`.
- Khởi chạy máy chủ cục bộ `127.0.0.1:3000` và kiểm tra sức khỏe trực tiếp.
