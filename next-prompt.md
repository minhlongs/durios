---
page: auditor
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
Screen 3: Field Auditor 5-Gate Launch Tool (`auditor.html`).
A high-integrity field auditor checklist and terminal report for Founder/Auditor on-site at packhouses (Cai Lậy, Tiền Giang):
- Header: Site Inspection Bar: Site VN-TG-PH-001 (Cai Lậy Hub), Lead Auditor Actor: Sophia Founder, Date: 2026-10-27, Target Market: GACC China (CN).
- Overall Status Banner: GO FOR LIVE OPERATIONAL LAUNCH — All 5 Gates Evaluated, Overall SHA-256 Seal: 8a4f9c2d1b7e3f...
- 5-Gate Interactive Accordion/Cards:
  1. `GATE-01: LEGAL CONSENT & DATA PROTECTION`: DPA agreement signed under Law 91/2025/QH15, 100% consent recorded on-chain, status pill: PASSED (GREEN).
  2. `GATE-02: MULTI-CHANNEL AUTH & OTP DRILL`: Zalo ZNS + SMS Brandname fallback drill, 10/10 OTP delivered in < 15 seconds, status pill: PASSED (GREEN).
  3. `GATE-03: LOCAL NETWORK ISOLATION`: Air-gapped LAN weighbridge station, port 3000 bound to local loopback, zero external telemetry leaks, status pill: PASSED (GREEN).
  4. `GATE-04: OFF-SITE RECOVERY & INTEGRITY`: SQLite WAL integrity verified, hourly encrypted off-site backup drill, zero data loss, status pill: PASSED (GREEN).
  5. `GATE-05: 5-CONTAINER TIMED REHEARSAL`: Mean verification time 3.4 mins (< 5.0 mins SLA), blind fault injection 2/2 caught (1 seal mismatch, 1 Cadmium > 0.05 mg/kg), status pill: PASSED (GREEN).
- Action Footer:
  - Button `Download Sealed Auditor Pack (.json)` (SHA-256 sealed manifest).
  - Button `Sign Off & Authorize Live Commercial Traffic` (Prompts for Ed25519 Auditor Key).
  - Navigation links to `index.html` (Workspace) and `dossiers.html` (Registry).
