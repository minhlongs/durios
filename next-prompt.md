---
page: portability
---

**DESIGN SYSTEM (REQUIRED):**
```css
:root {
  --bg-canvas: #0B130E;
  --bg-surface: #132018;
  --bg-card: #18281F;
  --border: #1F3327;
  --border-highlight: #10B981;
  --text-primary: #ECFDF5;
  --text-secondary: #6EE7B7;
  --text-muted: #34D399;
  --accent-primary: #10B981;
  --accent-gold: #F59E0B;
  --accent-danger: #EF4444;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-card: 6px;
  --shadow: 0 4px 20px -2px rgba(16, 185, 129, 0.12);
}
```

**Page request:**
Screen 6: Open-Core Portability & Self-Service Export Hub (`portability.html`).
A self-service data ownership and export center proving 100% Zero Vendor Lock-in for Vietnamese packhouse owners:
- Header: Open-Core Data Sovereignty & Portability Hub: Tenant Cai Lậy Hub #01 (VN-TG-PH-001).
- Commitment Banner: 100% DATA OWNERSHIP — EXPORT ANYTIME UNDER AGPL-3.0 CORE. You are not locked into any SaaS vendor.
- Bundle Generation Card:
  - Form options: Date range picker, Select dossiers to include (All 14 dossiers / 100%), Include Immutable Audit Ledger (48 Events), Include Cryptographic Manifests.
  - Signing & Verification: Secret Key input for HMAC-SHA256 signature stamping.
  - Large button: `Generate & Download Signed Portability Bundle (.json)`.
- Verification Terminal:
  - Curl and Bun commands showing how to import this bundle into another on-premise server or cloud instance:
    `bun run src/export/standalone-manifest-verifier.ts bundle.json`
- Navigation links to `index.html`, `dossiers.html`, `auditor.html`, `buyer.html`, `cluster.html`.
