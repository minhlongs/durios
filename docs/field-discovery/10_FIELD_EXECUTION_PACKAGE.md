# DuriOS Field Execution Package & Field Validation Protocol
## Supreme Command #11: Deliverable 10 — Field Validation & Capital Execution Blueprint

**Date:** 2026-10-09  
**Version:** 1.0.0 (Command #11 Authorized)  
**Operating Classification:** **FIELD DISCOVERY AUTHORIZED — REPOSITORY FROZEN — PRODUCTION BLOCKED**  
**Authorized Capital Ceiling (Tranche 1):** `7,500,000 VND` (Reported Expended: `0 VND`)  
**Investigation Locations:** Cai Lậy (Tiền Giang) & Krông Pắc (Đắk Lắk)  
**Inspected Git Baseline:** `f621b4733b809d3f871340383031e060ea8f7ae9` (`main` branch)

---

## 1. Governance and Repository Status

```
================================================================================
OPERATIONAL GOVERNANCE MATRIX:
================================================================================
1. REPOSITORY STATUS: FROZEN
   - Git Commit HEAD SHA: f621b4733b809d3f871340383031e060ea8f7ae9
   - Working Tree: Preserved dirty tree (35 tests, 183 assertions passing)
   - Code Modifications: STRICTLY PROHIBITED (Zero feature additions, zero refactoring)
   - Dependency Changes: STRICTLY PROHIBITED (0 npm dependencies, native Bun only)

2. FIELD DISCOVERY STATUS: AUTHORIZED (TRANCHE 1)
   - Target Regions: Cai Lậy (Tiền Giang) & Krông Pắc (Đắk Lắk)
   - Spending Ceiling: VND 7,500,000 (Maximum cap)
   - Current Actual Spend: VND 0 (Reported only, pending founder receipts)
   - Purpose: Real workflow observation, past error identification, WTP testing.

3. PRODUCTION STATUS: NOT AUTHORIZED (BLOCKED)
   - Multi-User Pilot: BLOCKED (Blocked by VULN-01 Actor Spoofing & VULN-02 Cross-Tenant)
   - Cloud Infrastructure: BLOCKED (Local-first single-operator air-gapped demo only)
   - Commercial Contracts: BLOCKED (No annual software contracts before Gate review)
================================================================================
```

---

## 2. Canonical GO / HOLD / STOP Criteria (From `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md`)

To eliminate ambiguity and preserve capital discipline, the primary canonical gates for completing Field Discovery and evaluating Tranche 2 release (`12,500,000 VND`) are:

### A. Phase 1 Exit Gate (Field Discovery Complete)
* **Status:** PASS if all 4 conditions are met:
  1. Minimum **03 packhouses** allow direct observation of the packing and documentation workflow.
  2. Minimum **01 packhouse** signs a non-binding LOI for a paid 5-container pilot with a `2,500,000 - 5,000,000 VND` conditional deposit (100% money-back guarantee).
  3. Minimum **02 complete, real, anonymized export dossiers** collected (Lab, Packing list, Phyto draft, Customs declaration).
  4. Tranche 1 expenditure $\le$ `7,500,000 VND` with valid tax receipts.

### B. Phase 2 Gating (Paid Pilot Authorization)
* **GO (Proceed to Tranche 2):** Criteria in (A) fully satisfied. Tranche 2 (`12,500,000 VND`) unlocked for single-packhouse offline pilot tooling and security hardening.
* **HOLD (Extend Discovery Bounded):** 3 packhouses observed and 2 dossiers obtained, but LOI deposit pending decision. Bounded extension of 5 business days and $\le$ `2,500,000 VND` additional budget.
* **STOP (Terminate Venture / Preserve Capital):** Fewer than 2 packhouses permit observation, OR all packhouses report zero document friction because border forwarders handle 100% of corrections ("bao luật"), OR no packhouse is willing to commit a deposit even with a full refund guarantee.

---

## 3. Identification of Conflicting Criteria Across Audit Documents (Marked UNRESOLVED)

The audit reveals discrepancies between earlier draft specifications and the canonical discovery documents. These conflicts are explicitly documented below and marked **UNRESOLVED** pending founder direction:

| Discrepancy Dimension | Document A (Audit-03 Draft / Early Research) | Document B (Canonical `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md`) | Conflict Status | Business Impact |
|---|---|---|---|---|
| **Packhouse Sample Size** | 15 packhouses interviewed (`audit-03/15_KILL_GATE_AUDIT.md`) | 10–15 contacted, minimum **03 deep in-person observation visits** (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.1) | **UNRESOLVED** | Contacting 15 packhouses in 5 days is feasible; conducting deep 4-hour observations at 15 separate facilities in 5 days is physically impossible. |
| **Commercial Commitment Target** | 1 signed annual contract at 60M VND (`audit-03/08_UNIT_ECONOMICS.md`) | 01 signed LOI for a 5-container pilot with **2.5M – 5M VND conditional deposit** (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.2) | **UNRESOLVED** | Expecting an annual 60M VND commitment before an MVP is deployed is unrealistic. The deposit LOI is the practical test. |
| **Anonymized Dossier Quota** | Unspecified / qualitative | Minimum **02 (or 03) complete anonymized dossiers** collected (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.3) | **UNRESOLVED** | 02 vs 03 dossiers: minimum 2 complete sets required to test schema variations. |

*Recommendation for Founder:* Ratify the thresholds in `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` (3 deep observations, 1 deposit LOI, 2 anonymized dossiers, $\le$ 7.5M VND spend) as the binding decision standard.

---

## 4. Stakeholder Access Status & Access Gaps

| Stakeholder Group | Target Profile | Access Status | Access Gaps & Field Constraints |
|---|---|---|---|
| **Group A: Operations Staff** | Documentation clerks, weighing staff, packhouse managers | **UNCONFIRMED** | High friction during night packing shifts (22:00 – 04:00). Must observe without interrupting truck departure deadlines. |
| **Group B: Budget Holders** | Packhouse owners, managing directors, export company reps | **UNCONFIRMED** | Owners are frequently off-site negotiating fruit purchase prices. Requires advance booking via local introducers. |
| **Group C: Growers & Cooperatives** | PUC holders, cooperative heads | **CONTINGENT** | Interviewed *only* if they participate in PUC quota logging or pesticide testing feedback loops. |
| **Group D: Customs / Forwarders** | Border clearing agents (Lạng Sơn / Hữu Nghị) | **REMOTE ACCESS GAP** | Direct in-person access at border gates is not feasible within a 5-day Southern/Central Highlands trip. Conducted via phone/Zalo with Southern forwarder representatives. |

---

## 5. Field Evidence & Privacy Protocol (Chain of Custody)

### A. Seven-Category Evidence Taxonomy
Every record entered into `docs/field-discovery/06_FIELD_EVIDENCE_REGISTER.md` must be classified under one of the following 7 explicit categories:
1. `[DIRECT_OBSERVATION]`: Physically witnessed by the investigator (e.g., clerk retyping seal number 3 times).
2. `[PARTICIPANT_STATEMENT]`: Claimed verbally by interviewee (e.g., "We lost 50 million VND on one held container last year").
3. `[DOCUMENTARY_EVIDENCE]`: Verified against a physical or digital document (e.g., photo of redacted Phyto certificate).
4. `[FOUNDER_INTERPRETATION]`: Inferences or hypotheses drawn by the founder/investigator.
5. `[UNVERIFIED_ASSUMPTION]`: Market or technical assumptions lacking direct field backing.
6. `[CONTRADICTORY_EVIDENCE]`: Observations that refute product hypotheses (e.g., "Border agent clears mismatched seal for 500k VND").
7. `[MISSING_EVIDENCE]`: Critical gaps where access or documentation was refused.

### B. Privacy & Commercial Data Redaction Rules
1. **On-Site Viewing Over Copying:** Prioritize on-screen or in-person visual review without taking digital copies.
2. **Mandatory Redaction:** If photographing documents, cover or blur:
   - Personal names, phone numbers, and citizen IDs (PII).
   - Commercial buying/selling fruit prices and commission rates.
   - Specific farm plot addresses and exporter tax codes.
3. **No Cloud AI Uploads:** Absolutely NO raw customer documents or photos may be uploaded to external AI services (Claude, ChatGPT, OCR APIs) during field discovery.
4. **Local Prototype Isolation:** The DuriOS demo prototype must run strictly on `localhost` (127.0.0.1) on the investigator's offline laptop using pre-bundled synthetic sample data. No customer data may be entered into the local SQLite database.

---

## 6. Field Discovery Economics & Willingness-to-Pay (WTP) Hierarchy

Evidence of customer commitment must be classified strictly according to the **L0 to L6 Evidence Ladder**:

```
[L6] Signed Binding Pilot Contract with Deposited Funds (2.5M - 5M VND in escrow)
  ▲
[L5] Signed Written LOI with Explicit Conditional Refund Terms
  ▲
[L4] Identified Economic Buyer with Documented Procurement Approval Process
  ▲
[L3] Corroborated Financial Loss Records (Demurrage receipts, penalty invoices)
  ▲
[L2] Directly Observed Recurring Workflow Bottleneck / Error Rework
  ▲
[L1] Verbal Expression of Interest or Polite Praise ("Looks useful / nice software")
  ▲
[L0] Uncontacted / Desk Research Assumption
```

*Rule of Evidence:* Verbal praise (L1) has ZERO weight in the GO/HOLD/STOP decision. Only L3+ evidence justifies venture continuation.

---

## 7. Five-Day Field Execution Plan (Canonical Protocol)

| Day | Location & Focus | Primary Objective | Target Stakeholder | Required Output / Evidence | Daily Budget Ceiling |
|---|---|---|---|---|---|
| **Day 1** | **Cai Lậy (Tiền Giang)**<br>Operations Walkthrough | Map real packing workflow & timing from fruit arrival to truck sealing. | 2x Documentation Clerks,<br>1x Packhouse Supervisor | - 2x Workflow timing logs (`02_OBSERVED_WORKFLOW`)<br>- Identify manual data re-entry points | 1,500,000 VND |
| **Day 2** | **Cai Lậy (Tiền Giang)**<br>Artifacts & Buyer Interview | Collect anonymized export documents; interview business owner on losses & WTP. | 1x Packhouse Owner / Director,<br>1x Local Exporter | - 1x Anonymized Export Dossier<br>- 1x Economic Loss Worksheet (`09_ECONOMICS`)<br>- First LOI pitch | 1,500,000 VND |
| **Day 3** | **Transit & Transit Audit**<br>Tiền Giang $\rightarrow$ Đắk Lắk | Forwarder phone interviews; transit to Central Highlands; mid-point synthesis. | 2x Border Forwarders / Customs Agents (Phone) | - Group D Interview Log (`01_GUIDE` §5)<br>- Border "bao luật" friction assessment | 1,500,000 VND |
| **Day 4** | **Krông Pắc (Đắk Lắk)**<br>PUC & High-Volume Operations | Observe high-volume cooperative packing & PUC quota deduction practices. | 1x Cooperative Head,<br>1x Packhouse Manager | - 1x PUC Genealogy Worksheet (`03_LOT_GENEALOGY`)<br>- 1x Second Anonymized Dossier | 1,500,000 VND |
| **Day 5** | **Krông Pắc (Đắk Lắk)**<br>WTP Testing & LOI Closing | Present Pilot LOI with money-back guarantee to 2 packhouse owners; conclude trip. | 2x Packhouse Owners / Budget Holders | - 1x Signed LOI (or formal rejection notes)<br>- Completed Evidence Register (`06_REGISTER`)<br>- Expense reconciliation | 1,500,000 VND |

---

## 8. Tranche 1 Capital-Control Worksheet

* **Total Authorized Ceiling:** `7,500,000 VND`
* **Current Reported Expenditure:** `0 VND` (Pre-execution)

```markdown
### TRANCHE 1 EXPENSE TRACKING SHEET

| Expense Item | Authorized Cap | Actual Spend | Invoice / Receipt ID | Verified By |
|---|---|---|---|---|
| Intercity Travel (HCMC - Cai Lậy - Buôn Ma Thuột - HCMC) | 2,500,000 VND | 0 VND | PENDING_FIELD | Founder |
| Local Transport (Motorbike rental, fuel, taxis) | 1,200,000 VND | 0 VND | PENDING_FIELD | Founder |
| Economy Lodging (4 nights @ 400,000 - 500,000 VND) | 1,800,000 VND | 0 VND | PENDING_FIELD | Founder |
| Subsistence & Field Meals (5 days) | 1,500,000 VND | 0 VND | PENDING_FIELD | Founder |
| Printing, Redaction Stationery & Incidentals | 500,000 VND | 0 VND | PENDING_FIELD | Founder |
| **TOTAL** | **7,500,000 VND** | **0 VND** | — | — |
```

---

## 9. Security, Privacy & Regulatory Guardrails

1. **Statutory Quarantine:** Rule `RUL-GB2762-CD` remains disabled (`isActive: false`, `isStatutoryVerified: false`). No compliance or statutory claims may be made to interviewees. Advisory warnings (`RUL-INT-CD-WARN` at 0.040 mg/kg) must always display the statutory disclaimer.
2. **Prototype Jail:** The demonstration server must bind strictly to `127.0.0.1:3000`. No LAN broadcasting on packhouse Wi-Fi networks (protecting against VULN-01 and VULN-06).
3. **No Contractual Liability:** The investigator has no authority to sign binding SLAs, warrant customs clearance, or indemnify any party against export losses.

---

## 10. Evidence-to-Decision Matrix (Post-Discovery Gate)

| Field Finding Scenario | Evidence Signature | Mandatory Decision | Next Action |
|---|---|---|---|
| **Scenario A: High Pain & Willingness to Pay** | $\ge$ 3 deep observations, $\ge$ 2 real dossiers, $\ge$ 1 LOI with 2.5M - 5M deposit, spend $\le$ 7.5M VND. | **GO (Proceed to Tranche 2)** | Unlock Tranche 2 (12.5M VND) for 1-packhouse offline pilot tooling & security remediation. |
| **Scenario B: Pain Exists, Commercial Hesitation** | $\ge$ 3 deep observations, 2 dossiers, but LOI signed without cash deposit (verbal WTP only). | **HOLD (Bounded Extension)** | Max 5-day extension ($\le$ 2.5M VND) to negotiate escrow terms with 1 specific buyer. If no deposit, trigger STOP. |
| **Scenario C: Forwarder Dominance ("Bao Luật")** | Packhouses confirm border forwarders resolve all seal/dossier errors cheaply with no held trucks. | **STOP (Kill Venture)** | Terminate project immediately. Return remaining capital. The software solves a non-economic problem. |
| **Scenario D: Access Refused** | Fewer than 2 packhouses allow observation; zero dossiers obtained due to trust/data sensitivity. | **STOP (Kill Venture)** | Terminate project. Private data friction prevents vertical SaaS adoption in this segment. |

---

## 11. Clear STOP Conditions (Immediate Termination Triggers)

The founder must immediately halt field discovery and terminate the venture if any of the following occur:
1. **Total Access Block:** 5 consecutive packhouses refuse entry and decline to discuss workflow processes.
2. **Zero Economic Friction:** Every interviewed packhouse verifies that documentation errors have resulted in zero financial penalties, zero delayed trucks, and zero re-inspection costs over the past 24 months.
3. **Budget Exhaustion:** Tranche 1 expenses reach `7,500,000 VND` before Day 4 without securing a single observation agreement.

---

## 12. Founder Decisions and Actions Required

The founder must execute the following sequential actions:

- [ ] **Action 1 (Print Field Package):** Print physical copies of `01_STAKEHOLDER_INTERVIEW_GUIDE.md`, `02_OBSERVED_WORKFLOW_CAPTURE_TEMPLATE.md`, `03_LOT_GENEALOGY_TRACING_WORKSHEET.md`, `04_DATA_OWNERSHIP_AND_PERMISSIONS_QUESTIONNAIRE.md`, `05_WILLINGNESS_TO_PAY_INTERVIEW_GUIDE.md`, and `06_FIELD_EVIDENCE_REGISTER.md`.
- [ ] **Action 2 (Prepare Offline Laptop):** Verify the DuriOS prototype starts on `localhost:3000` with synthetic test data in an air-gapped state.
- [ ] **Action 3 (Book Travel within Cap):** Secure transport and economy lodging for Cai Lậy and Krông Pắc within the `7,500,000 VND` ceiling.
- [ ] **Action 4 (Execute Field Visits):** Conduct Days 1–5 adhering strictly to non-leading interview questions and neutral evidence logging.
- [ ] **Action 5 (Populate Evidence Register & Report):** Fill `06_FIELD_EVIDENCE_REGISTER.md` with SHA-256 hashed notes and complete `07_FIELD_DISCOVERY_REPORT_TEMPLATE.md` for gate review.
