# Prompt gửi cho phiên khác — Push DuriOS lên GitHub

> Chép toàn bộ khối bên dưới và gửi cho phiên Claude khác (phiên có quyền đẩy git).
> Thay 2 chỗ đánh dấu `<...>` trước khi gửi.

---

## Nhiệm vụ

Đẩy repo `/Users/macbook/durios` (nhánh `main`, 7 commit local chưa có remote) lên GitHub.

## Bối cảnh

- Đây là repo `main` DUY NHẤT, không có remote nào được cấu hình. 7 commit dưới đây chỉ tồn tại trên máy này.
- Các commit đều đã qua xác minh cục bộ trước khi tạo: typecheck exit 0, blueprint 25/25, deep audit GO 15/15 vòng, và các bộ lọc CI đều pass.
- Working tree sạch. File duy nhất chưa theo dõi là `.claude/` — **đừng commit nó**, đó là state phiên làm việc cục bộ.

## Các commit cần đẩy (từ cũ đến mới)

```
e5d0c8f feat(auth): add product personas and tenant-scoped actor identity
fa15c3a docs(blueprint): record journals, LOC plans, and 25-step Binh Pháp verification
b591246 refactor(saas): align modularity LOC ceiling with asserted standard of 100
e0907c6 docs(blueprint): fill 25-step evidence tables and retire false verdict
8a17e69 fix(ci): stop secret guard from failing on tracked .env.example
42c072f docs(blueprint): mark all four defects fixed after CI guard repair
dfe349d docs(journal): record LOC ceiling alignment, verdict retirement, and CI repair
```

## Các bước

1. **Kiểm tra an toàn trước khi làm bất cứ điều gì** — xác nhận không có file nhạy cảm nào trong danh sách theo dõi:
   ```bash
   cd /Users/macbook/durios
   git ls-files | grep -E '\.env$|\.db$|\.pem$|\.key$|\.p12$|\.pfx$'
   ```
   Phải ra trống. Nếu ra bất kỳ file nào, **DỪNG LẠI** và báo tôi.

2. **Tạo repo trên GitHub** bằng `gh` (thay `<owner>` và `<repo>` bằng giá trị thật):
   ```bash
   gh repo create <owner>/<repo> --<public|private> --source=/Users/macbook/durios --remote=origin
   ```
   Tôi để bạn chọn public hay private — repo này chứa kế hoạch kinh doanh nội bộ, tôi nghiêng về **private**.

3. **Kiểm tra lại `.gitignore` đã chặn `.claude/`** trước khi push. Hiện tại `.claude/` chưa bị chặn và đang nằm ngoài danh sách theo dõi — nếu push không loại trừ được, hãy hỏi tôi trước khi thêm vào `.gitignore`.

4. **Đẩy commit đầu tiên:**
   ```bash
   git -C /Users/macbook/durios push -u origin main
   ```

5. **Báo lại kết quả:** số commit đã đẩy, URL repo, và nội dung lệnh `git status -sb` sau khi push (phải ghi `main...origin/main`).

## Những điều KHÔNG được làm

- **Không** commit, add, hay push `.claude/` — đó là state phiên làm việc.
- **Không** push --force, không rebase, không sửa lịch sử commit.
- **Không** tạo pull request hay merge branch nào — chỉ đẩy `main` thẳng lên.
- **Không** sửa bất kỳ file nguồn nào trong repo. Nhiệm vụ này chỉ đẩy, không sửa.
- **Không** bật branch protection hay merge CI nào — chưa được yêu cầu.
- **Không** đẩy nếu bước 1 ra bất kỳ file nhạy cảm nào.

## Bối cảnh phiên làm việc trước đó (để hiểu các commit là gì)

Phiên trước đã chạy kế hoạch ở `plans/261021-2345-durios-25-step-binh-phap-accurate/plan.md`, trong đó có các lỗi đã sửa: mốc dòng code nâng từ 95 lên 100 (`b591246`), và bộ lọc secret CI bắt nhầm `.env.example` (`8a17e69`). Cả hai đã xác minh trước khi commit. Không cần làm gì thêm với chúng.
