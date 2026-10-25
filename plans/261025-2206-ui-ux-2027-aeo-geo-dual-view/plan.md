---
status: completed
---

# Kế hoạch Thực thi: Kiến trúc UI/UX 2027 & Chuẩn AEO / GEO Song Song Con Người & AI Agent

## 1. Mục tiêu (Objective)
Tái cấu trúc UI/UX toàn bộ dự án DuriOS theo xu hướng 2027 lấy cảm hứng từ Design Studio AI (`studio.agentkit.best`), tích hợp công tắc trực quan Con người ↔ AI Agent (`Human View ↔ Agent View`) trên toàn bộ 26 màn hình HTML (Workspace chính và 25 màn hình `/stitch/*`), cùng hệ thống endpoint AEO/GEO chuẩn quốc tế (`/llms.txt`, `/llms-full.txt`, `/.well-known/agent.json`, `robots.txt`, `sitemap.xml`) để các nền tảng AI (ChatGPT, Claude, Perplexity, Gemini) tự động nhận diện và trích dẫn chuẩn mực kiểm định container sầu riêng.

## 2. Ràng buộc bất biến (Hard Constraints)
- Mọi file `.ts` trong `src/` và `test/` phải giữ nghiêm ngặt trần `<= 100 LOC/file`.
- 0 lỗi TypeScript (`tsc --noEmit`), 0 kiểu `:any`, 0 `console.log` trong production code.
- Bảo toàn tuyệt đối ranh giới an ninh loopback `127.0.0.1` (`GATE-03`) và Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
- Không sửa thủ công từng file trong 25 trang `site/public/*.html` mà sử dụng cơ chế Server-Side String Injection lúc phục vụ file.
- Tái sử dụng hệ thống Design System chuẩn đã có trong `site/public/durios-design-system.css` và `design-system/MASTER.md` (`Inter`, `Space Grotesk`, `JetBrains Mono`) thay vì định nghĩa chồng chéo biến `:root`.
- Giữ xanh 100% các bài test hiện có (236/236 tests).

## 3. Các giai đoạn triển khai (Phases)

### Giai đoạn 1: Bộ Schema AEO/GEO & WebMCP Catalog 2027 (`src/server/`)
- `src/server/dual-view-surface-css.ts`: Định nghĩa CSS cô lập riêng cho thanh công tắc Dual-View và hộp thoại Agent Inspector, kế thừa các biến `--durios-font-*` từ hệ thống thiết kế gốc.
- `src/server/agent-aeo-schema.ts`: Hàm tạo cấu trúc Schema.org JSON-LD (`SoftwareApplication`, `FAQPage`).
- `src/server/agent-webmcp-catalog.ts`: Khai báo siêu dữ liệu Design Studio & danh mục công cụ WebMCP phi trạng thái.

### Giai đoạn 2: Tầng Tiêm Dữ Liệu Tự Động (Injection Pipeline)
- `src/server/agent-aeo-injector.ts`: Module tiêm JSON-LD, WebMCP state, và thanh công tắc vào chuỗi HTML với cơ chế escape `<` chống thoát khối `<script>`.
- `src/server/static-ui.ts`: Dẫn luồng HTML của Workspace chính (`/`) qua `injectAgentAeoSurface()`.
- `src/server/stitch-static-handler.ts`: Dẫn luồng các trang `/stitch/*.html` qua `injectAgentAeoSurface()` khi trả về file `.html`.

### Giai đoạn 3: Mở Rộng Router AEO / GEO & Agentic Discovery 2027
- `src/server/aeo-content-provider.ts` & `src/server/aeo-discovery-router.ts`: Xử lý `/llms.txt`, `/llms-full.txt`, `/.well-known/agent.json`, `/api/open-core/agent-catalog`, `/robots.txt`, `/sitemap.xml`.
- `src/server/http-router.ts`: Tích hợp các route khám phá mới vào router chính.

### Giai đoạn 4: Bộ Kiểm Thử & Kiểm Định Toàn Vẹn
- `test/agent-aeo-geo-discovery.test.ts` & `test/agent-aeo-dual-view-injection.test.ts`: Kiểm thử chi tiết 100% các route mới, định dạng MIME, và sự hiện diện của thanh công tắc cùng khối `<script type="application/ld+json">` trên cả `/` và `/stitch/auditor.html`.
- Xác minh `bun test` (241/241 pass), `tsc --noEmit` (0 lỗi), và kiểm tra trần `<= 100 LOC`.
