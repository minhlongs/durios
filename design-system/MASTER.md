# DuriOS Master Design System (`design-system/MASTER.md`)

> **Generated & Persisted via `/ak-ui-ux-pro-max --design-system --persist -p "DuriOS"`**  
> **Scope:** 26 HTML Surfaces (`src/server/public/index.html` + 25 Stitch Screens `/stitch/*.html`)

---

## 1. Product & Style Classification
- **Product Type:** High-Density B2B Agricultural Export Compliance & Cryptographic Dossier Operating System (`VN_CN` GACC Protocol)
- **Primary Aesthetic:** **2027 Enterprise Command Station** (inspired by Linear, Stripe, Flexport, and Palantir Foundry)
- **Adaptive Dual-Theme Engine (`durios_theme` in `localStorage`):**
  - **Theme 1 — `🌙 Emerald Ops` (Default Dark Mode):** Deep Mekong Night `#060B08` canvas, `#09140E` surface, `#101E16` elevated cards, `#10B981` GACC Emerald primary accent, `#ECFDF5` off-white primary text (contrast `15.4:1` AAA).
  - **Theme 2 — `☀️ Daylight Field` (`daylight-theme` Outdoor High-Contrast Mode):** `#F8FAFC` slate canvas, `#FFFFFF` card surface, `#047857` deep emerald primary (`5.6:1` AA+), `#0F172A` primary text (`17.8:1` AAA) for direct sunlight readability at packhouse weighbridges.

---

## 2. Typography & Tabular Hierarchy
- **Display & Section Headers (`--durios-font-display`):** `'Space Grotesk'`, semi-bold/bold (`600–700`), tight tracking (`-0.01em` to `0.06em` uppercase).
- **Body & Operational Microcopy (`--durios-font-sans`):** `'Inter'`, `13px–14px` desktop compact density, `16px` mobile inputs (prevents iOS auto-zoom), line-height `1.5`.
- **Cryptographic Digests, Container IDs & Weights (`--durios-font-mono`):** `'JetBrains Mono'` with mandatory `font-variant-numeric: tabular-nums` on all SHA-256 hashes, ISO 6346 container numbers (`MSKU1234565`), Cadmium `mg/kg` readings, and `< 5m` KPI timers.

---

## 3. Priority 1–10 UI/UX Pro Max Rules Enforced

1. **Priority 1 — Accessibility (`CRITICAL`):**
   - Visible `:focus-visible` ring (`2px solid var(--durios-border-focus)`, `outline-offset: 2px`) across all buttons, inputs, links, and command bar items.
   - Skip link (`.skip-link` $\rightarrow$ `#workspace-main`) in primary workspace.
   - Non-blocking ARIA live regions (`role="status"`, `aria-live="polite"`, `role="alert"`) on both workspace notifications and `#durios-live-toast-container`.
   - Full `@media (prefers-reduced-motion: reduce)` support disabling decorative transitions and animations.
2. **Priority 2 — Touch & Interaction (`CRITICAL`):**
   - `touch-action: manipulation` on all interactive controls to eliminate 300ms mobile tap delay.
   - Minimum `44×44px` hit target enforcement on coarse pointers / mobile viewports (`@media (pointer: coarse), (max-width: 768px)`).
   - Tactile press state (`transform: scale(0.985)` within `120ms cubic-bezier(0.16, 1, 0.3, 1)`) without layout shift.
3. **Priority 5 & 9 — Layout, Safe Areas & 4-Domain Navigation (`HIGH`):**
   - Single-header `44px` Top Command Bar (`--durios-shell-height: 44px`), `⌘K` Command Palette, and `[` Collapsible Sidebar Drawer grouping all 25 screens into 4 domains:
     1. `1. Packhouse Ops` (7 screens)
     2. `2. Trust & Verifier` (6 screens)
     3. `3. Open-Core & Security` (6 screens)
     4. `4. SaaS & Corridors` (6 screens)
   - Zero dead `href="#"` links across all 26 HTML surfaces.
   - Safe-area inset padding (`env(safe-area-inset-bottom)`) for floating telemetry dock and mobile weighbridge drawers.
