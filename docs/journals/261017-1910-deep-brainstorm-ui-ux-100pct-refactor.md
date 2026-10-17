# Deep Brainstorm (`--deep`): 100% UI/UX DOM Restoration & 2027 Global Enterprise App Shell Refactor

- **Timestamp:** 2026-10-17T19:10:00+07:00
- **Workflow:** `/ak-bootstrap` + `/ak-brainstorm --deep`
- **Target Milestone:** `v0.4.1` (100% Pristine DOM Restoration + Zero-Corruption 2027 App Shell + Automated Tag-Balance Guard)

---

## 1. Brainstorm Contract (4 Mandatory Fields)

| Field | Specification |
|---|---|
| **Outcome** | 100% of the 25 Stitch screens (`site/public/*.html` & `queue/*.html`) and primary Packhouse Workspace (`src/server/public/index.html`) have strictly balanced DOM trees (`openDivCount === closeDivCount`, `diff === 0`), zero truncated headers/panels, and a unified 44px 2027 Global Enterprise App Shell (`<!-- DURIOS-TOP-NAV-START --> ... <!-- DURIOS-TOP-NAV-END -->`) with `⌘K` Command Palette, Collapsible `[` Sidebar, `☀️ Daylight Field / 🌙 Emerald Ops` adaptive theming, and Bottom-Right Floating Live Dock. |
| **Constraints** | Preserve 100% of existing automated test contracts (`142+ pass, 0 fail`), strict file modularity (`<= 145 LOC` across all `.ts` files in `src/` and `test/`), and MIT SDK zero-dependency isolation. |
| **Non-Goals** | No external frontend framework bundle (React/Vue build step) or breaking URL route changes. |
| **Acceptance Criteria** | 1. All 25 HTML screens in `site/public/*.html` and `queue/*.html` pass automated `<div` vs `</div>` tag-balance verification (`openDivCount === closeDivCount`).<br>2. All 25 screens contain `<!-- DURIOS-TOP-NAV-START -->`, `<!-- DURIOS-TOP-NAV-END -->`, `DURIOS 25-SCREEN NAV`, `/stitch/durios-design-system.css`, and `/stitch/durios-live-bridge.js`.<br>3. `bun run typecheck` and `bun test --timeout 15000` pass `100%` (`0` errors, `0` failures). |

---

## 2. Five-Turn Deep Socratic Root-Cause Analysis (`--deep`)

### Turn 1: Empirical Diagnosis — Why Did the UI Look Broken & Cluttered?
- **Evidence Inspected:** Audited `<div` vs `</div>` tag counts across all 25 HTML files in `site/public/*.html`.
- **Root Cause Identified:**
  1. Earlier regex-based nav bar replacements matched `<div id="durios-unified-top-nav"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>` across files whose initial nav bar only had **1 outer `<div>`** (or after replacement had **11 nested `<div>`s**).
  2. Consequently, the regex matched past the nav bar into the main page body, swallowing the first 100–250 lines of content in **20 out of 25 screens** (`diff: -1` to `-6` orphaned `</div>` tags) and breaking CSS Grid/Flexbox containers!
  3. Additionally, `body.h-screen.overflow-hidden` on native Stitch screens clipped bottom content once the `44px` sticky top command bar was prepended.

### Turn 2: Pristine Source Recovery Strategy
- **Screens 1–14 (`index.html`, `dossiers.html`, `auditor.html`, `buyer.html`, `cluster.html`, `portability.html`, `upgrade.html`, `styleguide.html`, `paper-canvas.html`, `excel-grid.html`, `zalo-bot.html`, `mobile-weighbridge.html`, `field-proven.html`, `foundry.html`):** Restored directly from commit `94035fd`, where all 14 screens have `diff === 0` (`100%` intact DOM, 410–1,023 lines each).
- **Screens 16–23 (`corridors.html`, `blueprint.html`, `security-vault.html`, `organic-escrow-guard.html`, `webhook-sync-queue.html`, `socratic-introspector.html`, `rehearsal-command.html`, `mit-verifier-lab.html`):** Re-fetched directly from Google Stitch MCP (`projectId: 4832488622931116638`) via `get_screen` using their canonical `screenId`s.
- **Screens 15, 24, 25 (`gallery.html`, `cloud-ocr-vault.html`, `ed25519-downgrade-simulator.html`):** Verified `diff === 0` (`openDivCount === closeDivCount`).

### Turn 3: Zero-Corruption Sentinel Injection (`stripBalancedDivAt`)
- Replaced regex `</div>` matching with a deterministic **depth-counting HTML tag parser (`stripBalancedDivAt`)** that tracks `depth++` on `<div\b` and `depth--` on `</div>` until `depth === 0`.
- Wrapped the injected 2027 App Shell Top Command Bar in explicit comment sentinels:
  `<!-- DURIOS-TOP-NAV-START --> ... <!-- DURIOS-TOP-NAV-END -->`
  so future updates replace between comment sentinels in $O(1)$ without ever touching page body tags.

### Turn 4: Viewport & Sticky Header Ergonomics
- Automatically transformed `body` classes `h-screen overflow-hidden` $\to$ `min-h-screen overflow-x-hidden overflow-y-auto` across all 25 screens so no panel is ever clipped below the `44px` top command bar.
- Docked native screen `<header>` elements cleanly below the `44px` command bar via `durios-design-system.css` and `durios-live-bridge.js`.

### Turn 5: Permanent Automated Regression Guard (`test/stitch-static-route.test.ts`)
- Added an automated assertion in `test/stitch-static-route.test.ts` that counts `<div\b` and `</div>` tags across all 25 `/stitch/*.html` pages and enforces `openDivs === closeDivs` (`diff === 0`) and `<!-- DURIOS-TOP-NAV-START -->` presence on every test run.

### Turn 6: Eliminating Duplicate Native Headers & Sub-Navs (`durios-live-bridge.js` + `durios-design-system.css`)
- **Problem:** 24 of the 25 Stitch screens rendered their own internal `<header>` and/or secondary `<nav>` with static placeholder links (`Command Station | Dossiers | Field Auditor | Buyer Portal`) directly underneath `#durios-unified-top-nav` (`44px`).
- **Solution (`v0.5.0`):**
  1. `deduplicateStickyHeaders()` in `site/public/durios-live-bridge.js` automatically detects and hides redundant inner `<nav>` bars (`.durios-redundant-subnav`) while compacting the native `<header>` into a clean `38px` status strip (`.durios-compacted-native-header`).
  2. Added **`🎯 Focus Canvas Mode` (`#durios-btn-focus-mode` / Hotkey `f`)** in the `44px` Top Command Bar to toggle 100% full-bleed canvas view (hiding all secondary sub-headers).

### Turn 7: Primary Packhouse Workspace (`src/server/public/index.html`) 100% UX Refactor
- Added **Interactive Workflow Step Filter Bar** (`📋 Tất cả (4 bước)` | `1. Chứng từ` | `2. Xác minh HITL` | `3. Thẩm định GACC` | `4. Phê duyệt & Xuất` + `🎯 Tập trung bước hiện tại`) so operators can focus on one step at a time without scrolling through 4 tables, while preserving all 4 `<section id="sec-...">` DOM nodes for contract compatibility.
- Added **1-Click Batch Accelerators**:
  - Step 1: `⚡ Nạp nhanh đủ 3 chứng từ mẫu` (`uploadAllSampleDocs()`)
  - Step 2: `⚡ Xác nhận nhanh toàn bộ trường chờ duyệt` (`verifyAllFields()`)
- Upgraded `🚀 Diễn tập 5 Cont & 5/5 Gates` on `/` to invoke `POST /api/auth/pilot-rehearsal-bootstrap?fullGates=true` so 5/5 `GATE-01..05 PASS` unlocks in 1 click.
- Added **Dark Emerald Ops / Daylight Field Theme Toggle (`🌙 Emerald / ☀️ Field`)** and upgraded `#stitch-gallery-modal` with live search (`#stitch-modal-search`) and 4 domain filter pills across all 25 screens.

### Turn 8: Zero Dead Links (`href="#": 0`), Universal Interactive Button Delegation & Unified Root App Shell (`v0.6.0`)
- **Problem:**
  1. Auditing `site/public/*.html` revealed **113 `href="#"` dead anchor links** across 12 Stitch screens and **13 screens with `onclicks: 0`** where static Stitch `<button>` elements produced no feedback when clicked.
  2. The primary Packhouse Workspace (`src/server/public/index.html` at `/`) did not mount the `44px` Top Command Bar (`#durios-unified-top-nav`), `⌘K` Command Palette, `[` Sidebar Drawer, or Bottom-Right Floating Live Dock (`durios-live-bridge.js`).
- **Solution (`v0.6.0`):**
  1. **Zero Dead Links (`href="#": 0`):** Deterministically mapped all 113 `href="#"` links across `site/public/*.html` and `queue/*.html` to their corresponding live `.html` routes (`index.html`, `dossiers.html`, `auditor.html`, `buyer.html`, `rehearsal-command.html`, `mit-verifier-lab.html`, `security-vault.html`, `organic-escrow-guard.html`, `webhook-sync-queue.html`, `socratic-introspector.html`, `cloud-ocr-vault.html`, `ed25519-downgrade-simulator.html`, `corridors.html`, `blueprint.html`, `gallery.html`) and locked this with `expect(html).not.toContain('href="#"')` in `test/stitch-static-route.test.ts`.
  2. **Universal Interactive Button Delegation & 2027 Live Toasts (`setupUniversalInteractiveDelegation()` + `showLiveToast()`):** Wired event delegation in `durios-live-bridge.js` so clicking any native `<button>` across all 25 Stitch screens executes live backend verification (`POST /api/v1/open-core/verify-iso-and-manifest`, `POST /api/auth/pilot-rehearsal-bootstrap?fullGates=true`, or `downloadGoLivePack()`) and renders a sleek top-right 2027 Enterprise Toast notification with live SHA-256 / GACC telemetry.
  3. **Unified Root App Shell (`/` + `/stitch/*.html`):** Mounted `/stitch/durios-design-system.css`, `/stitch/durios-live-bridge.js`, and `#durios-unified-top-nav` directly onto `src/server/public/index.html` with route-aware `getScreenHref(file)` resolution so operators enjoy the exact same `44px` Command Bar, `⌘K` Palette, `[` Drawer, `🎯 Focus` Mode (`f` hotkey), and Bottom-Right Live Dock across both `/` and `/stitch/*.html`.


