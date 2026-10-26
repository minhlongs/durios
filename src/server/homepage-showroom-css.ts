/**
 * Scoped styles for the 2027 3-in-1 Homepage Showroom & 1-Click Mode Switcher.
 * Uses existing DuriOS CSS custom properties (`--color-*`, `--durios-font-*`)
 * so it adapts automatically to both Light (Field) and Dark (Emerald Ops) themes.
 */
export const HOMEPAGE_SHOWROOM_CSS = `
#durios-home-mode-bar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px; padding: 8px 16px;
  background: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #d5dae1);
}
.durios-mode-tabs { display: inline-flex; gap: 6px; background: var(--color-surface-muted, #f0f2f5); padding: 4px; border-radius: 999px; border: 1px solid var(--color-border, #d5dae1); }
.durios-mode-tab {
  border: none; background: transparent; color: var(--color-text-muted, #4b5563);
  padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.15s ease;
}
.durios-mode-tab.active {
  background: var(--color-primary, #0f6b4f); color: var(--color-on-primary, #ffffff);
  box-shadow: 0 2px 6px rgba(15, 107, 79, 0.25);
}
#durios-home-showroom {
  max-width: 1280px; margin: 0 auto; padding: 20px 16px 32px;
  display: flex; flex-direction: column; gap: 20px;
}
#durios-home-showroom.hidden { display: none !important; }
.durios-hero-card {
  background: linear-gradient(135deg, #06281e 0%, #09140e 100%);
  color: #ecfdf5; border: 1px solid #1f3327; border-radius: 14px;
  padding: 24px; box-shadow: 0 14px 32px -10px rgba(6, 40, 30, 0.35);
}
.durios-hero-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(16, 185, 129, 0.16); color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 999px;
  padding: 4px 12px; font-size: 11px; font-weight: 700; margin-bottom: 12px;
}
.durios-hero-title {
  font-size: clamp(20px, 2.6vw, 30px); font-weight: 800; line-height: 1.25;
  margin: 0 0 10px 0; color: #ffffff;
}
.durios-hero-sub { font-size: 14px; color: #a7f3d0; max-width: 880px; margin: 0 0 18px 0; line-height: 1.55; }
.durios-metrics-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.durios-metric-box {
  background: rgba(16, 30, 22, 0.85); border: 1px solid #2d4c39;
  border-radius: 10px; padding: 12px 14px;
}
.durios-metric-val { font-size: 16px; font-weight: 800; color: #34d399; font-family: var(--durios-font-mono, monospace); }
.durios-metric-lbl { font-size: 12px; color: #cbd5e1; margin-top: 4px; }
.durios-cta-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.durios-cta-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px;
  border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none;
  cursor: pointer; border: 1px solid transparent; transition: transform 0.15s ease;
}
.durios-cta-btn:hover { transform: translateY(-1px); }
.durios-cta-primary { background: #10b981; color: #04120b; }
.durios-cta-secondary { background: #13281e; color: #ecfdf5; border-color: #34d399; }
.durios-cta-zalo { background: #0284c7; color: #ffffff; }
.durios-section-card {
  background: var(--color-surface, #ffffff); border: 1px solid var(--color-border, #d5dae1);
  border-radius: 12px; padding: 18px 20px;
}
.durios-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 12px; }
.durios-item-box {
  background: var(--color-surface-muted, #f0f2f5); border: 1px solid var(--color-border, #d5dae1);
  border-radius: 10px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
}
`;
