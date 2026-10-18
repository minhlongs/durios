# Page Override: Primary Packhouse 3-Zone Workspace (`design-system/pages/packhouse-workspace.md`)

> **Inherits from:** `design-system/MASTER.md`  
> **Target Surfaces:** `src/server/public/index.html` (`/`) and `site/public/index.html` (`/stitch/index.html`)

## 1. Layout & Spatial Hierarchy Overrides
- **3-Zone Command Station (`1440px+` Desktop):**
  - **Zone 1 (Left Rail — `280px`):** Container Dossier Queue (`#dossier-list`), active lifecycle filter, and 1-click `+ Tạo hồ sơ` button.
  - **Zone 2 (Center Canvas — `1fr`):** 4-Step Workflow Filter Bar (`Tất cả`, `1. Tải chứng từ`, `2. Xác minh HITL`, `3. Kiểm tra quy tắc`, `4. Xuất niêm phong`) + 1-click batch accelerators (`uploadAllSampleDocs`, `verifyAllFields`).
  - **Zone 3 (Right Context Panel — `340px`):** Collapsible SHA-256 Audit Hash-Chain, Organic Evidence (`EVIDENCE_STORED_NOT_CERTIFIED`), and Cross-Tenant Share Grants.

## 2. Ergonomics & Safety Rules
- **Mandatory HITL Confirmation:** Every extracted field row (`#val-${fieldId}`) must expose explicit `Xác nhận` (`.btn--confirm`) and `Từ chối` (`.btn--danger`) controls with `tabular-nums` monospace alignment.
- **Zero Blocking Dialogs:** Never invoke `window.alert()`; all feedback routes through ARIA live regions (`role="status"`, `role="alert"`).
