# DuriOS Design System Contract

## 1. Visual Language & Foundation
- **Design Metaphor:** High-density command station for durian packhouse container truth.
- **Device Support:** Desktop 1440px+ (3-Column Station) & Mobile/Tablet (Touch drawer).
- **Core Font Stack:**
  - Display & Headings: `Space Grotesk`, semi-bold uppercase tracking.
  - Body & Microcopy: `Inter`, 13px / 14px compact density.
  - Tabular & Technical Figures: `JetBrains Mono` monospace.

## 2. Color Palette
- Canvas Background: `#0B130E` (Deep Mekong Night)
- Card & Panel Surface: `#132018` (Dark Emerald Surface)
- Card Border: `#1F3327` (Subtle Forest Border)
- Primary Accent: `#10B981` (GACC Protocol Emerald Green)
- Warning / Secondary: `#F59E0B` (Ripe Durian Gold)
- Critical Error / Alert: `#EF4444` (Cadmium Over-Limit Alert Red)
- Text Primary: `#ECFDF5` (High-contrast Off-White)
- Text Secondary: `#6EE7B7` (Muted Jade)

## 3. Elevation & Radius
- Border Radius: `6px`
- Elevation Shadow: `0 4px 20px -2px rgba(16, 185, 129, 0.12)`

## 4. Spacing Scale
- Compact baseline: 4px, 8px, 12px, 16px, 20px, 24px, 32px.

## 5. Component Contracts
- Verification buttons: `btn-confirm` (Emerald `#10B981`), `btn-danger` (Red `#EF4444`).
- Status pills: `pill-verified`, `pill-warning`, `pill-danger`.
- Arithmetic Mean Countdown: tabular mono font, green `< 4m`, gold `4-5m`, red `> 5m`.

## 6. DESIGN SYSTEM CODE BLOCK (VERBATIM FOR BATONS)
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
