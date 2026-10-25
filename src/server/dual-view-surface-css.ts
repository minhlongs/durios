/**
 * Styles for the Dual-View switcher and its inspector modal.
 *
 * Scoped exclusively to `#durios-dual-view-toggle`, `#durios-agent-inspector-modal`,
 * and `.durios-inspector-*`. References the repository's existing `--durios-font-sans`
 * and `--durios-font-mono` tokens (defined in `durios-design-system.css`) with
 * safe system fallbacks, and never writes to `:root` so it cannot alter a page's
 * own design language.
 */
export const DUAL_VIEW_SURFACE_CSS = `
#durios-dual-view-toggle {
  position: fixed;
  bottom: 18px;
  right: 18px;
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e293b;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 9999px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  font-family: var(--durios-font-sans, system-ui, -apple-system, sans-serif);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #334155;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s;
}
#durios-dual-view-toggle:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
}
#durios-agent-inspector-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  padding: 24px;
  align-items: center;
  justify-content: center;
}
#durios-agent-inspector-modal.active {
  display: flex;
}
.durios-inspector-box {
  background: #0f172a;
  color: #f1f5f9;
  width: 100%;
  max-width: 860px;
  max-height: 85vh;
  border-radius: 12px;
  border: 1px solid #334155;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--durios-font-mono, ui-monospace, SFMono-Regular, monospace);
}
.durios-inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.durios-inspector-content {
  padding: 16px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
}
`;
