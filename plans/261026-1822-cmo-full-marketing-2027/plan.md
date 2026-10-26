---
status: completed
---

# Kế Hoạch Thực Thi: Chiến Dịch CMO & Team Marketing 100% (PLG ROI Calculator • Battlecard • AEO/GEO 30 URL • Enterprise Sales Kit)

## 1. Mục tiêu (Objective)
Triển khai trọn bộ vũ khí Marketing & Chuyển đổi B2B SaaS nông sản xuất khẩu đã được phê duyệt trong `advise-261026-1822-cmo-full-marketing-push.md`:
1. **Trên Trang chủ `/`:** Bổ sung **Máy tính ROI Chống Quay Đầu Container (`#durios-roi-calculator`)** (4 quy mô `10`, `30`, `100`, `300` cont/vụ) và **Bảng So Sánh Đối Đầu (`#durios-battlecard`)** (Làm tay Excel/Zalo vs. DuriOS 2027).
2. **Hạ tầng AEO/GEO & SEO (`src/server/`):** Mở rộng `sitemap.xml` lên **30 URL** đầy đủ và nâng cấp `Schema.org FAQPage` + `/llms-full.txt` với bộ từ khóa GACC Việt – Anh – Trung (`海关总署 GACC 248/249号令`, `PUC`, `PHC`, `GB 2762-2022`).
3. **Bộ Tài liệu CMO & Sales Kit (`docs/marketing/`):** Xuất bản 3 cẩm nang thực chiến: `cmo-gtm-master-plan-2027.md`, `hung-hau-enterprise-pitch-playbook.md`, và `zalo-packhouse-closing-scripts.md`.

## 2. Ràng buộc bất biến (Hard Constraints)
- Mọi file `.ts` trong `src/` và `test/` phải giữ nghiêm ngặt trần `<= 100 LOC/file`.
- 0 lỗi TypeScript (`bun run typecheck`), 0 kiểu `:any`, 0 `console.log` trong production code.
- Không chèn thêm thẻ `<script>...</script>` mới vào `<body>` của `index.html` để bảo toàn `servedScript()` trong `test/review-state-injection.test.ts`.
- Giữ nguyên chuẩn UI/UX Pro Max (`min-height: 44px`, `:focus-visible`, `prefers-reduced-motion: reduce`).
