# Page Override: 25-Screen Stitch Command Hub (`design-system/pages/stitch-command-hub.md`)

> **Inherits from:** `design-system/MASTER.md`  
> **Target Surfaces:** `site/public/gallery.html` (`/stitch/gallery.html`) and shared App Shell (`durios-live-bridge.js`, `durios-design-system.css`)

## 1. Navigation & Command Palette Overrides
- **Single-Line `44px` Top Command Bar (`#durios-unified-top-nav`):**
  - Uses crisp `stroke-width="2"` vector SVG icons (`.durios-svg-icon`) for the sidebar toggle, brand shield, Focus Canvas toggle, and drawer close control.
  - Exposes `⌘K` / `Ctrl+K` Command Palette Modal (`role="dialog" aria-modal="true"`) with instant keyboard filtering across all 25 screens and live rehearsal actions.
- **Floating Live Telemetry Dock (`#durios-live-dock-pill`):**
  - Respects `env(safe-area-inset-bottom)` on mobile/tablet viewports and provides 1-click access to `POST /api/auth/pilot-rehearsal-bootstrap?fullGates=true`.
