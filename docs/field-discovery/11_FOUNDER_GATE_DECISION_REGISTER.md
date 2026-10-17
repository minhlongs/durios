# DuriOS Founder Gate Decision Register & Field Readiness Audit
## Supreme Command #12: Governance Audit, Commercial Gate Challenge & Field Readiness Verification

> **GHI CHÚ ĐIỀU CHỈNH HIỆU LỰC (SUPERSESSION & GOVERNANCE ALIGNMENT NOTE — 2026-10-14):**  
> Tài liệu này được lưu giữ nguyên trạng làm **hồ sơ lịch sử tại ngày 2026-10-09**. Kể từ ngày **2026-10-14**, Founder đã phê duyệt `docs/product-direction/PRODUCT-PRD-V1.md` và `docs/product-direction/PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md` làm định hướng sản phẩm hiện hành, đồng thời repo lõi `/Users/macbook/durios` đã hoàn tất nghiệm thu kỹ thuật Prompt 5A (`5A-1` đến `5A-6`, xử lý dứt điểm `VULN-01` và `VULN-02`). Các chỉ dẫn "REPOSITORY FROZEN" hoặc cấm chuẩn bị Pilot trong văn bản lịch sử dưới đây được thay thế bởi quy trình **Readiness & Cổng khai trương Pilot kín 01 vựa** tại `docs/pilot-readiness/01_SINGLE_SITE_READINESS_AND_LAUNCH_GATE.md`.

**Document Identifier:** `docs/field-discovery/11_FOUNDER_GATE_DECISION_REGISTER.md`  
**Date:** 2026-10-09  
**Audit Classification:** **GOVERNANCE & READINESS AUDIT — REPOSITORY FROZEN — ZERO EXPENDITURE AUTHORIZED** *(Historical classification as of 2026-10-09; superseded on 2026-10-14)*  
**Auditor / Role:** Adversarial Investment Reviewer & Governance Auditor  
**Inspected Repository Baseline:** Git HEAD `f621b4733b809d3f871340383031e060ea8f7ae9` (`main` branch)  
**Tranche 1 Capital Ceiling:** `7,500,000 VND` (Reported Expended: `0 VND` — Verified: No debits/receipts logged)  
**Tranche 2 Capital Status:** `LOCKED` (`12,500,000 VND` remains strictly frozen)  
**Production Status:** `BLOCKED` (VULN-01 Actor Spoofing & VULN-02 Cross-Tenant Boundary permanently block deployment)  

---

## 1. Verified Repository Status and Technical Limitations

```
================================================================================
REPOSITORY INTEGRITY & LIMITATION BASELINE:
================================================================================
- Git HEAD Commit: f621b4733b809d3f871340383031e060ea8f7ae9
- Working Tree State: PRESERVED DIRTY BASELINE (Strictly untouched)
- Automated Test Suite: 35 passing tests, 183 assertions passing [~400ms]
- TypeScript Compilation: 0 errors (bun x tsc --noEmit exit 0)
- Application Source Code: STRICTLY FROZEN (Zero edits, zero refactoring)
- Dependencies: 0 npm packages (native Bun runtime only, frozen)
================================================================================
```

### Technical Defect Limitations (Blocking Production & Live Pilots):
1. **VULN-01 (Actor Spoofing — P0 Blocker):** Actor role is determined solely from client-supplied HTTP header `x-actor-role` or query parameter `?role=`. Any unauthenticated network client can claim `MANAGER` or `AUDITOR` permissions and sign off on container dossiers.
2. **VULN-02 (Cross-Tenant Boundary Defect — P0 Blocker):** Single-tenant workspace model with zero cryptographic tenant boundary isolation. Cannot be hosted in any shared or multi-user environment.
3. **VULN-04 (Audit History Tamper Detection vs Tamper Resistance — P1 Limitation):** WORM SHA-256 hash chains detect modifications made through the application layer, but do not provide cryptographic tamper resistance against direct local SQLite file manipulation.
4. **VULN-06 (Unauthenticated Local Server Ingress — P1 Blocker):** Local HTTP server lacks authentication and TLS. Must be bound strictly to loopback interface `127.0.0.1:3000` with zero LAN broadcast.
5. **RUL-GB2762-CD (Statutory Quarantine — Regulatory Blocker):** Mandatory statutory Cadmium evaluation rule (`0.050 mg/kg`) is quarantined (`isActive: false`, `isStatutoryVerified: false`). Only internal non-statutory advisory rule `RUL-INT-CD-WARN` (`0.040 mg/kg`) operates, displaying mandatory disclaimers.

---

## 2. Canonical Governance Criteria and Unresolved Threshold Conflicts

### 2.1 File Location and Availability Audit

| Referenced Document Path | Actual Filesystem Location | Verification Status | Notes |
|---|---|---|---|
| `audit-03/15_KILL_GATE_AUDIT.md` | `/Users/macbook/plans/durios-research/audit-03/15_KILL_GATE_AUDIT.md` | **VERIFIED AVAILABLE** | Located in plans research directory. |
| `audit-03/08_UNIT_ECONOMICS.md` | `/Users/macbook/plans/durios-research/08_UNIT_ECONOMICS.md` & `/Users/macbook/plans/durios-research/audit-03/09_REBUILT_UNIT_ECONOMICS.md` | **VERIFIED AVAILABLE** | Initial economic model in `08_UNIT_ECONOMICS.md`; rebuilt model in `audit-03/09_REBUILT_UNIT_ECONOMICS.md`. |
| `docs/audits/COMMAND-09-EXECUTIVE-DECISION-MEMO.md` | `/Users/macbook/durios/docs/audits/COMMAND-09-EXECUTIVE-DECISION-MEMO.md` | **VERIFIED AVAILABLE** | Canonical audit memo for Command #09. |
| `docs/audits/COMMAND-09-TRANCHE-1-CAPITAL-CONTROL.md` | `/Users/macbook/durios/docs/audits/COMMAND-09-TRANCHE-1-CAPITAL-CONTROL.md` | **VERIFIED AVAILABLE** | Canonical capital allocation for Tranche 1. |
| `docs/field-discovery/08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` | `/Users/macbook/durios/docs/field-discovery/08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` | **VERIFIED AVAILABLE** | Canonical gate criteria document. |
| `docs/field-discovery/09_FIVE_DAY_EXECUTION_PROTOCOL.md` | `/Users/macbook/durios/docs/field-discovery/09_FIVE_DAY_EXECUTION_PROTOCOL.md` | **VERIFIED AVAILABLE** | Canonical 5-day field schedule. |
| `docs/field-discovery/10_FIELD_EXECUTION_PACKAGE.md` | `/Users/macbook/durios/docs/field-discovery/10_FIELD_EXECUTION_PACKAGE.md` | **VERIFIED AVAILABLE** | Canonical field execution package. |
| `docs/audits/COMMAND-10-REPOSITORY-FREEZE.md` | `/Users/macbook/durios/docs/audits/COMMAND-10-REPOSITORY-FREEZE.md` | **VERIFIED AVAILABLE** | Formal repository freeze baseline. |

### 2.2 Cross-Document Threshold Conflict Matrix

The audit identified five fundamental threshold discrepancies between early exploratory research and the canonical gating documents. **None of these conflicts have been formally ratified by the founder.**

| Threshold Dimension | Source A (Early Research / Audit-03 Drafts) | Source B (Canonical Discovery Documents) | Status | Operational Consequence | Required Founder Decision |
|---|---|---|---|---|---|
| **1. Packhouse Sample & Depth** | `audit-03/15_KILL_GATE_AUDIT.md` §1 & §2:<br>15–20 packhouses contacted; $\ge 4$ allow shadowing. | `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.1 & `10_FIELD_EXECUTION_PACKAGE.md` §2.A:<br>10–15 contacted, minimum **03 deep in-person observation visits**. | **UNRESOLVED CONFLICT** | Conducting 4-hour deep observations at 15–20 facilities during a 5-day trip is physically impossible. 3 deep observations is executable but carries higher sample variance. | Ratify whether the gate requires $\ge 3$ deep observations (qualitative depth) or $\ge 15$ surveyed facilities (statistical breadth). |
| **2. Commercial Commitment Threshold** | `audit-03/08_UNIT_ECONOMICS.md` §2 & `audit-03/15_KILL_GATE_AUDIT.md` §2:<br>1 signed annual contract at 60,000,000 VND ARR. | `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.2 & `10_FIELD_EXECUTION_PACKAGE.md` §2.A:<br>1 signed LOI for 5-container pilot with **2,500,000 – 5,000,000 VND conditional deposit**. | **UNRESOLVED CONFLICT** | Demanding 60M VND upfront before an MVP exists guarantees gate failure. A 2.5M–5M VND pilot deposit tests real skin-in-the-game without unbounded expectations. | Ratify whether commercial validation requires an annual contract (60M VND) or a pilot deposit LOI (2.5M–5M VND). |
| **3. Real Export Dossier Quota** | `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.3:<br>Minimum **03 complete dossiers**. | `10_FIELD_EXECUTION_PACKAGE.md` §2.A:<br>Minimum **02 complete dossiers** (Lab, Packing list, Phyto draft, Customs declaration). | **UNRESOLVED CONFLICT** | Obtaining 3 complete sets of sensitive export paperwork from guarded packhouse owners in 5 days is a severe bottleneck; 2 sets provides schema diversity. | Ratify whether the dossier threshold is strictly 02 or 03 complete sets. |
| **4. Discovery Review Timeline** | `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` Header:<br>"Kết thúc Ngày 21 của Kế hoạch Khảo sát Thực địa" (End of Day 21). | `09_FIVE_DAY_EXECUTION_PROTOCOL.md` & `10_FIELD_EXECUTION_PACKAGE.md` §7:<br>**5-Day Field Execution Plan** evaluated at the end of Day 5. | **UNRESOLVED CONFLICT** | Day 21 reflects an extended 3-week calendar cycle; the 5-day protocol concentrates field spend into a 5-day blitz capped at 7.5M VND. | Ratify whether the evaluation gate occurs at the end of the 5-Day field trip or after Day 21. |
| **5. Downstream Forwarder Engagement** | `audit-03/15_KILL_GATE_AUDIT.md`:<br>Focus solely on packhouse owners and clerks in packing sheds. | `09_FIVE_DAY_EXECUTION_PROTOCOL.md` Day 5 & `10_FIELD_EXECUTION_PACKAGE.md` §4:<br>Phone/remote interviews with **02 Northern border forwarders (Hữu Nghị/Tân Thanh)** to evaluate "bao luật". | **UNRESOLVED CONFLICT** | If border brokers routinely resolve seal and paper errors for minor informal fees ("bao luật"), packhouses have zero economic incentive to pay for compliance software. | Ratify whether forwarder verification of the "bao luật" dynamic is a mandatory pre-condition for Tranche 2 release. |

---

## 3. Critical Challenge of the Proposed Commercial Gate

The proposed Phase 1 exit gate consists of:
1. Minimum **03 deeply observed packhouses**
2. Minimum **02 complete, real, authorized, anonymized dossiers**
3. Minimum **01 LOI for a 5-container paid pilot**
4. Conditional deposit of **VND 2,500,000 – 5,000,000**
5. Tranche 1 expenditure $\le$ **VND 7,500,000**

### 3.1 Systematic Evaluation Against Commercial Realities (Dimensions A through H)

| Dimension | Does the 5-Criterion Package Establish This? | Adversarial Audit Finding & Failure Exposure | Evidence Quality Status |
|---|---|---|---|
| **A. Problem Existence** | **PARTIALLY** | Observing 3 packhouses confirms whether clerks make clerical errors or retype seal numbers. However, it does **not** prove that clerical errors lead to container rejections rather than quick local fixes. | `INDICATIVE` — Needs observation of past rejection records. |
| **B. Problem Frequency** | **NO** | A 4-hour visit to 3 packhouses captures a single point in time. It cannot statistically establish how often seal discrepancies or document mismatches occur across 50–200 containers in a season. | `UNVERIFIED ASSUMPTION` — Point-in-time observation cannot measure seasonal error frequency. |
| **C. Economic Materiality** | **NO** | Unless corroborated with actual financial loss records (demurrage invoices, cold-storage plug fees, price discounts), reported losses remain anecdotal claims (`[PARTICIPANT_STATEMENT]`). | `UNVERIFIED ASSUMPTION` — Verbal claims of loss are Level 1/Level 2 evidence, not Level 3. |
| **D. Identified Economic Buyer** | **PARTIALLY** | The founder may identify the packhouse owner. However, in Vietnamese durian exports, the financial loss from border delays is frequently borne by the **exporter / trading company** who purchased the fruit FOB/CNF, not the packing shed operator. | `CONTINGENT` — The true economic buyer may be the exporter, not the packhouse. |
| **E. Procurement Feasibility** | **NO** | Durian packhouses operate largely informally, relying on cash transactions and personal relationships. 1 signed LOI does not prove a repeatable software procurement process (VAT invoicing, contract terms, payment approval). | `UNVERIFIED ASSUMPTION` — Informal LOI does not demonstrate institutional procurement viability. |
| **F. Willingness to Pay (WTP)** | **PARTIALLY (WEAK)** | A 2.5M–5M VND conditional deposit with a "100% money-back guarantee" represents zero financial risk for the buyer. It tests **willingness to test**, not commercial willingness to pay for sustained software. | `INDICATIVE (L5)` — Flawed by asymmetric money-back promise. |
| **G. Product Feasibility** | **PARTIALLY** | Collecting 2 real dossiers proves that documents can be inspected by humans, but does not prove the software can reliably extract, validate, and assemble dossiers without breaking during live packing shifts. | `INDICATIVE` — Offline schema test only; does not test live operational latency. |
| **H. Repeatability Beyond 1 Customer** | **NO (CRITICAL FAILURE)** | **Satisfying A through G for 1 customer does NOT prove repeatability.** 1 deposit LOI out of 15 contacts could be an idiosyncratic personal favor, an outlier operator, or an unrepresentative edge case. | `UNPROVEN` — N=1 is an anecdote, not a scalable business model. |

### 3.2 Ceremonial Compliance Risks (False Positives in the Gate)
The auditor warns that the proposed gate can be satisfied **ceremonially** without establishing economic value:
- **Ceremonial LOI:** A friendly packhouse owner signs an LOI and hands over 2.5M VND because the founder is an acquaintance and the money-back guarantee ensures they can demand a full refund at any time.
- **Trivial Anonymized Dossiers:** Gathering 2 sets of documents that were already cleared months ago proves historical document availability, but does not prove willingness to share active, live-season documentation.
- **Superficial Shadowing:** Standing in a packhouse for 2 hours during an off-peak shift satisfies the "observation" checkbox without observing the high-stress midnight sealing crunch where real errors happen.

*Audit Recommendation (PENDING FOUNDER APPROVAL):* Upgrade the gate to require that:
- The deposit LOI is supported by at least 1 verified past demurrage/penalty incident record (receipt or booking record).
- The LOI refund terms are strictly milestone-bounded, not an open-ended "satisfaction guarantee."

---

## 4. LOI and Refund-Promise Audit (Asymmetric Liability Red Team)

The proposed pilot offers a **5-container paid pilot for 2,500,000 – 5,000,000 VND with a 100% money-back guarantee if the system fails to catch a document discrepancy before truck departure.**

### 4.1 Unresolved Legal, Operational, and Technical Questions

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ASYMMETRIC LIABILITY WARNING:                                                 │
│ Promising a "100% refund if the software misses a discrepancy" exposes a      │
│ solo founder to massive legal, reputational, and financial liability.         │
│ A single delayed container represents 1.5 - 2.5 BILLION VND in perishable     │
│ fruit. If a customer blames DuriOS for a held container, a refund of 5M VND   │
│ will not satisfy their demand for commercial damages.                         │
└───────────────────────────────────────────────────────────────────────────────┘
```

The auditor has identified 12 critical unresolved operational and legal issues:

1. **Definition of "Discrepancy":** What exact data fields are covered? (Seal number, container number, gross weight, net weight, PUC code, packing facility code, Cadmium ppm). Does a minor spelling variance on a farm address constitute a discrepancy?
2. **Scope of Documents:** Does the guarantee apply if the packhouse provides only 2 of the 4 required documents (e.g., Packing list provided, but Phyto draft missing)?
3. **Definition of "Ground Truth":** Who determines whether a discrepancy truly existed—the packhouse owner, the customs broker, or the founder?
4. **False Positives vs False Negatives:** If the software raises an alert on an unverified PUC code, but customs clears the truck anyway, does the customer claim the software failed or caused unnecessary delay?
5. **Timeline and Departure Cutoff:** What constitutes "caught before vehicle departure"? If the packhouse enters data 5 minutes before the truck pulls out, is the founder liable if review takes 10 minutes?
6. **Responsibility for Incomplete Data:** If the clerk types an illegible seal number from a wet notepad, who is responsible for the error?
7. **Customer Failure to Provide Data:** What happens if the customer packs 5 containers but only enters data for 2? Does the deposit become non-refundable?
8. **Refund Adjudication Mechanism:** Is there a defined dispute window (e.g., written claim within 48 hours accompanied by customs rejection notice)?
9. **Liability Cap & Indemnification:** Does the agreement contain an explicit, enforceable clause capping total liability strictly to the 2.5M–5M VND fee, explicitly disclaiming any consequential damages for spoiled fruit, demurrage, or lost contracts?
10. **Prototype Technical Maturity:** The current prototype has unauthenticated role resolution (VULN-01), single-tenant SQLite storage (VULN-02), and disabled statutory rules (`RUL-GB2762-CD`). It cannot safely process live commercial data without manual founder oversight.
11. **Data Confidentiality & Trade Secrets:** Export dossiers contain highly confidential trade secrets (buying prices, farmer lists, Chinese buyers). Does the founder have a standard Non-Disclosure Agreement (NDA) to protect themselves against allegations of data leakage?
12. **Tax & Legal Form:** Can the founder legally issue a VAT invoice for a software pilot as an individual or unregistered entity under Vietnamese commercial law?

### 4.2 Auditor Ruling on the Refund Guarantee
**BLOCKER:** An ambiguous or open-ended "money-back guarantee" is **BLOCKED**. It creates unbounded commercial liability. The founder must never offer an unconditional money-back guarantee in the field without ratified, legally bounded pilot terms.

---

## 5. Field Access Readiness Audit (5-Day Itinerary Feasibility)

### 5.1 Comprehensive Access Readiness Checklist

| Readiness Dimension | Specific Inspection Item | Status | Detailed Field Reality & Obstacles |
|---|---|---|---|
| **1. Confirmed Participants** | Named packhouse owners/clerks in Cai Lậy & Krông Pắc | **UNCONFIRMED** | No specific individuals or entities have confirmed meeting dates or agreed to participate. |
| **2. Confirmed Date & Time** | Calendar appointments for Day 1 through Day 5 | **UNCONFIRMED** | Entire 5-day schedule is an unbooked planning assumption. |
| **3. Permission for On-Site Observation** | Formal or informal agreement to stand in packing shed | **UNCONFIRMED** | Packhouses are restricted operational zones. Unannounced visitors are routinely turned away due to theft and trade secret concerns. |
| **4. Permission to View Documents** | Agreement to allow viewing of actual export dossiers | **UNCONFIRMED** | Documents contain sensitive pricing and farmer PUC data; owners are extremely guarded. |
| **5. Permission to Retain Evidence** | Agreement to allow photographing redacted documents | **UNCONFIRMED** | Requires explicit verbal or written consent (`Consent_Given`). |
| **6. Local Travel Feasibility** | Route from HCMC $\rightarrow$ Cai Lậy $\rightarrow$ Krông Pắc $\rightarrow$ HCMC | **PENDING** | Physical transit is possible via public bus/motorbike, but transit between Cai Lậy and Buôn Ma Thuột takes 8–10 hours. |
| **7. Night-Shift Safety & Access** | Observation of live container stuffing (22:00 – 04:00) | **UNCONFIRMED** | Packhouse stuffing occurs primarily at night. Solo founder entering remote rural sheds at 02:00 AM presents safety and physical access challenges. |
| **8. Interview Fallback Plan** | Backup facilities if primary contacts decline | **UNCONFIRMED** | No secondary contact list established. |
| **9. Cancellation Fallback Plan** | Procedure if harvest is paused due to weather/offseason | **UNCONFIRMED** | If heavy rain halts harvesting, packhouses do not pack. No weather contingency protocol exists. |
| **10. Cost Estimate & Approval** | Itemized budget within 7,500,000 VND cap | **PENDING** | Category caps defined, but no advance bookings or formal vendor quotes secured. |

### 5.2 Access Gap Analysis & Minimum Next Action
Because **zero field contacts are currently confirmed**, departing immediately on a physical trip would waste travel capital.

*Minimum Mandatory Next Action (Prior to Any Travel Expenditure):*
The founder must secure at least **02 warm, verified telephone or Zalo introductions** to packhouse operators or cooperative leaders in Cai Lậy and Krông Pắc (via agricultural extension networks, personal contacts, or industry associations) who explicitly agree in advance to host an in-person meeting.

---

## 6. Field Economics and Capital Discipline Audit (Tranche 1: 7,500,000 VND)

### 6.1 Mathematical & Category Verification

```
================================================================================
TRANCHE 1 CAPITAL RECONCILIATION:
================================================================================
1. Intercity Transport (HCMC - Cai Lậy - Buôn Ma Thuột - HCMC):    2,400,000 VND
2. Local Transit (Motorbike rental 4 days @ 150k + fuel 500k):     1,100,000 VND
3. Economy Lodging (Cai Lậy 1 night, BMT 2 nights @ 600k/night):   1,800,000 VND
4. Subsistence & Hospitality (Food @ 200k/day + host drinks 200k):  1,200,000 VND
5. Field Materials & Printing (Questionnaires, consent forms):       300,000 VND
6. Contingency Reserve (Emergency buffer):                           700,000 VND
--------------------------------------------------------------------------------
TOTAL AUTHORIZED ALLOCATION:                                       7,500,000 VND
REPORTED ACTUAL EXPENDITURE:                                               0 VND
REMAINING AUTHORIZED CEILING:                                      7,500,000 VND
================================================================================
```
*Mathematical Check:* `2,400,000 + 1,100,000 + 1,800,000 + 1,200,000 + 300,000 + 700,000 = 7,500,000 VND`. The arithmetic sums perfectly.

### 6.2 Realistic Travel Time & Itinerary Constraints
- **Transit Bottleneck (Day 2 to Day 4):** Traveling from Cai Lậy (Mekong Delta) to Krông Pắc (Central Highlands) involves either returning to HCMC to catch an overnight sleeper bus or taking a regional inter-provincial bus route. This requires 8 to 11 hours of travel. Allocating Day 3 entirely to transit and forwarder phone interviews is realistic, but leaves zero margin for bus delays or mechanical breakdown.
- **Harvest Season Alignment:** In October, the Mekong Delta (Cai Lậy) durian season is primarily off-season or early off-season nghịch vụ (induced flowering harvest), while Đắk Lắk (Krông Pắc) is at the tail-end of its main harvest. If harvest volume is low, packhouse activity will be sporadic.

### 6.3 Stage-Gated Stop-Loss Mechanism (Protecting Capital on Day 1 & Day 2)
To prevent spending the full 7.5M VND ceiling on a fruitless trip, the founder must enforce strict stop-loss trip triggers:
- **Day 1 Stop-Loss Check (Cai Lậy):** If upon arrival in Cai Lậy, the contacted packhouses are shuttered or refuse all entry, the founder must **not** proceed to Đắk Lắk. Total spend incurred: $\approx$ 1,200,000 VND. Capital preserved: $\approx$ 6,300,000 VND.
- **Day 2 Stop-Loss Check (Mekong Exit):** If by the end of Day 2, zero packhouse clerks or owners have permitted observation, the founder must abort the Central Highlands leg and return to HCMC. Total spend incurred: $\approx$ 2,500,000 VND. Capital preserved: $\approx$ 5,000,000 VND.

---

## 7. Security, Privacy and Regulatory Boundaries

### 7.1 Security Policy Enforcement
- **VULN-01 & VULN-02 Enforcement:** Multi-user deployment, public web hosting, and multi-tenant access remain **STRICTLY BLOCKED**.
- **Prototype Jail:** The prototype may only be demonstrated on the founder's personal laptop running on `localhost:3000` (loopback interface `127.0.0.1`).
- **No Wi-Fi Sharing:** The laptop must **not** be connected to local packhouse Wi-Fi or LAN networks to prevent unauthorized network access (VULN-06).

### 7.2 Customer Data Isolation & Anonymization
- **No Real Customer Data in Database:** It is strictly prohibited to enter real customer names, tax codes, or unredacted export documents into the local prototype SQLite database.
- **Demonstration with Synthetic Data Only:** All live walkthroughs shown to clerks must use the pre-bundled synthetic sample datasets (`synthetic-packhouse-01`, synthetic lab reports).
- **Physical Redaction Protocol:** When inspecting physical documents, the founder must view them on-site. If photos are taken with explicit consent, names, phone numbers, tax IDs, and commercial prices must be physically masked with markers or opaque paper before capture.
- **Zero Cloud AI Uploads:** No document images or audio recordings may be uploaded to cloud OCR or LLM APIs during the field trip.

---

## 8. Go / Hold / Stop Recommendation

### 8.1 Evaluated Status
- **Repository:** `FROZEN` (Head SHA verified, dirty working tree preserved, 35 tests passing).
- **Canonical Gate:** `CONFLICTED` (Thresholds in early research conflict with canonical documents; pending founder ratification).
- **Field Access:** `UNCONFIRMED` (Zero verified appointments, zero signed permissions).
- **Travel Readiness:** `HOLD` (Travel must not commence until preliminary access is confirmed).
- **Budget Readiness:** `READY` (Allocation verified; 0 VND expended; stop-loss rules established).
- **Commercial Validation:** `NONE` (Zero customer evidence collected to date).
- **Tranche 1 Capital:** `AUTHORIZED CEILING ONLY` (7,500,000 VND cap; zero new disbursements authorized).
- **Tranche 2 Capital:** `LOCKED` (12,500,000 VND strictly frozen).
- **Production:** `NOT AUTHORIZED` (Blocked by security and regulatory quarantines).

### 8.2 Comprehensive Recommendation: `HOLD (PRE-TRAVEL CONFIRMATION)`
The auditor recommends **HOLD on physical travel and capital disbursement** until the founder completes two mandatory pre-conditions:
1. Formally ratify the threshold conflicts documented in this register.
2. Confirm at least 02 preliminary packhouse access agreements via phone/Zalo to ensure the field trip is executable.

---

## 9. Founder Decision Register (Decisions Requiring Ratification)

The founder must review and explicitly decide the following seven governance decisions before spending any funds or commencing field travel.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ NOTICE TO FOUNDER:                                                            │
│ The auditor cannot resolve these decisions on your behalf.                    │
│ Please review the options, consequences, and supporting evidence for each     │
│ decision, and record your chosen option.                                      │
└───────────────────────────────────────────────────────────────────────────────┘
```

### DECISION 01: Ratification of Packhouse Sample Size and Observation Depth
* **Decision ID:** `DEC-01-SAMPLE-SIZE`
* **Exact Question:** What is the binding target sample size and evaluation depth required to exit Phase 1 Field Discovery?
* **Available Options:**
  - **Option A:** Canonical Discovery Standard — Contact 10–15 facilities, conduct minimum **03 deep in-person observation visits** (4+ hours each) across Cai Lậy and Krông Pắc (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md`).
  - **Option B:** Audit-03 Draft Standard — Interview 15–20 packhouses with minimum **04 in-person shadowing visits** (`audit-03/15_KILL_GATE_AUDIT.md`).
* **Consequences:**
  - *Option A:* Executable within 5 days and 7.5M VND budget; prioritizes depth over statistical breadth.
  - *Option B:* Physically impossible for a solo founder in 5 days; would require extending the field timeline to 14–21 days and increasing the travel budget.
* **Evidence Supporting Each Option:**
  - *For Option A:* Documented in `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.1 and `10_FIELD_EXECUTION_PACKAGE.md` §2.A.
  - *For Option B:* Documented in `audit-03/15_KILL_GATE_AUDIT.md` §2.
* **Urgency:** **URGENT** — Must be resolved prior to booking travel or scheduling meetings.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B]`

---

### DECISION 02: Commercial Commitment and Willingness-to-Pay Gate Standard
* **Decision ID:** `DEC-02-COMMERCIAL-GATE`
* **Exact Question:** What specific commercial milestone must be secured from a packhouse to satisfy the Phase 1 commercial gate and unlock Tranche 2?
* **Available Options:**
  - **Option A:** Pilot Deposit LOI — Minimum 01 signed Letter of Intent for a 5-container paid pilot with a **2,500,000 – 5,000,000 VND conditional deposit** (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md`).
  - **Option B:** Annual Contract — Minimum 01 signed annual SaaS contract at **60,000,000 VND ARR** with 10M VND setup fee (`audit-03/08_UNIT_ECONOMICS.md`).
  - **Option C:** Non-Monetary LOI — Minimum 02 signed written LOIs agreeing to pilot the software on 5 containers with zero upfront cash deposit.
* **Consequences:**
  - *Option A:* Tests real monetary skin-in-the-game while remaining realistic for an early MVP; provides credible evidence of WTP.
  - *Option B:* Completely unrealistic for an unbuilt product without a live pilot; guarantees gate failure.
  - *Option C:* Eliminates commercial friction, but provides weak WTP evidence (L5 vs L6), risking building an MVP for customers who refuse to pay later.
* **Evidence Supporting Each Option:**
  - *For Option A:* Backed by `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.2 and `10_FIELD_EXECUTION_PACKAGE.md` §2.A.
  - *For Option B:* Derived from original financial model in `audit-03/08_UNIT_ECONOMICS.md`.
  - *For Option C:* Common SaaS enterprise practice when security/compliance certifications are pending.
* **Urgency:** **URGENT** — Governs the pitch and document presented to packhouse owners during Days 2, 4, and 5.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B | Option C]`

---

### DECISION 03: Anonymized Real Export Dossier Quota
* **Decision ID:** `DEC-03-DOSSIER-QUOTA`
* **Exact Question:** How many complete, anonymized export document dossiers must be collected to satisfy the artifact gate?
* **Available Options:**
  - **Option A:** Canonical Execution Package Standard — Minimum **02 complete dossiers** (Lab analysis, Packing list, Phyto draft, Customs declaration) (`10_FIELD_EXECUTION_PACKAGE.md` §2.A).
  - **Option B:** Criteria Document Standard — Minimum **03 complete dossiers** (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.3).
* **Consequences:**
  - *Option A:* More achievable in a 5-day trip given packhouse secrecy; still provides sufficient data to cross-validate schema differences.
  - *Option B:* Stronger test of template diversity, but increases risk of gate failure if one packhouse refuses to provide all 4 documents.
* **Evidence Supporting Each Option:**
  - *For Option A:* `10_FIELD_EXECUTION_PACKAGE.md` §2.A.
  - *For Option B:* `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §1.3.
* **Urgency:** **URGENT** — Dictates the target quota for field artifact collection.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B]`

---

### DECISION 04: Legal Scope of Pilot Refund and Liability Limitation
* **Decision ID:** `DEC-04-REFUND-LIABILITY`
* **Exact Question:** What exact refund terms and liability limitations will be offered in the 5-container pilot LOI?
* **Available Options:**
  - **Option A:** Objective Milestone Refund with Strict Liability Cap — Refund is capped strictly at the pilot fee (2.5M–5M VND) and triggered *only* if the software fails to detect an objectively verifiable mismatch between the Packing List and Phyto draft for fields present in both documents, with an explicit legal disclaimer of all consequential cargo damages.
  - **Option B:** Unconditional 100% Satisfaction Guarantee — 100% refund offered if the customer is dissatisfied for any reason or if any container experiences clearance friction.
  - **Option C:** No Cash Refund / Free Re-Run Service Credit — Pilot fee is non-refundable; if software errors occur, the founder provides 5 additional containers of manual compliance checking for free.
* **Consequences:**
  - *Option A:* Legally bounds the founder's exposure while providing the customer with a credible performance warranty.
  - *Option B:* Exposes the founder to severe asymmetric financial liability and subjective disputes over cargo delays.
  - *Option C:* Eliminates refund cash risk, but reduces packhouse willingness to deposit funds upfront.
* **Evidence Supporting Each Option:**
  - *For Option A:* Standard B2B SaaS best practice and recommendation in `audit-03/11_PAID_PILOT_RED_TEAM.md`.
  - *For Option B:* Proposed in early informal marketing pitches (`01_STAKEHOLDER_INTERVIEW_GUIDE.md` §3.B4).
  - *For Option C:* Traditional agency/service contract terms in Vietnam.
* **Urgency:** **URGENT** — Must be decided before printing the LOI document or presenting terms to packhouse owners.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B | Option C]`

---

### DECISION 05: Mandatory Border Forwarder ("Bao Luật") Gate Trigger
* **Decision ID:** `DEC-05-FORWARDER-GATE`
* **Exact Question:** If border forwarders confirm that clerical document discrepancies are routinely resolved for trivial informal fees ("bao luật") without delaying trucks, does this trigger an immediate STOP (kill venture)?
* **Available Options:**
  - **Option A:** Binding STOP Trigger — If forwarders verify that informal border mechanisms render pre-departure document accuracy economically irrelevant, trigger an immediate STOP and return remaining capital (`08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §3.1).
  - **Option B:** Pivot to Exporter Compliance — Reorient the value proposition from border clearance prevention to exporter brand protection and internal audit controls, without killing the project.
* **Consequences:**
  - *Option A:* Enforces strict capital discipline and prevents burning capital on an artificial problem.
  - *Option B:* Allows exploring alternative customer segments (large exporters), but delays capital return and alters the product thesis.
* **Evidence Supporting Each Option:**
  - *For Option A:* `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` §3.1 and `10_FIELD_EXECUTION_PACKAGE.md` §10 Scenario C.
  - *For Option B:* Proposed failure tree in `audit-03/15_KILL_GATE_AUDIT.md` §3.
* **Urgency:** High — Determines how Day 3 and Day 5 forwarder interview results are interpreted at the gate review.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B]`

---

### DECISION 06: Pre-Travel Field Access Verification Gate
* **Decision ID:** `DEC-06-PRE-TRAVEL-VERIFICATION`
* **Exact Question:** Must the founder secure at least 02 confirmed introductions/appointments before booking transportation and lodging?
* **Available Options:**
  - **Option A:** Strict Pre-Booking Gate — Founder must secure at least 02 preliminary phone/Zalo confirmations with packhouse operators before spending any funds on travel or lodging.
  - **Option B:** Cold In-Person Canvassing — Founder travels to Cai Lậy and Buôn Ma Thuột immediately and conducts walk-in visits to packhouses along Highway 1A and Highway 26.
* **Consequences:**
  - *Option A:* Prevents wasting travel capital if local access is blocked; ensures high probability of executed meetings.
  - *Option B:* High risk of rejection at the gate; could burn 3M–5M VND without securing a single interview.
* **Evidence Supporting Each Option:**
  - *For Option A:* Governance auditor recommendation and capital discipline principles in `docs/audits/COMMAND-09-TRANCHE-1-CAPITAL-CONTROL.md`.
  - *For Option B:* Aggressive founder sales doctrine.
* **Urgency:** **IMMEDIATE** — Directly governs whether travel bookings can occur.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B]`

---

### DECISION 07: Tranche 1 Mid-Trip Stop-Loss Enforcement
* **Decision ID:** `DEC-07-STOP-LOSS-ENFORCEMENT`
* **Exact Question:** Will the founder enforce a mandatory stop-loss rule to abort the trip and preserve capital if Cai Lậy access fails on Day 1/Day 2?
* **Available Options:**
  - **Option A:** Mandatory Stop-Loss at 2,500,000 VND — If zero packhouses permit observation by the end of Day 2 in Cai Lậy, the founder aborts the Đắk Lắk leg, returns to HCMC, and preserves $\approx$ 5,000,000 VND of Tranche 1 capital.
  - **Option B:** Complete Full 5-Day Circuit Regardless — Founder proceeds to Đắk Lắk even if Cai Lậy yields zero access, using the full 7,500,000 VND ceiling to test both regions.
* **Consequences:**
  - *Option A:* Preserves venture capital when negative signals emerge early.
  - *Option B:* Exhausts the full Tranche 1 ceiling, but provides a comprehensive geographic test across both Mekong and Highlands regions.
* **Evidence Supporting Each Option:**
  - *For Option A:* `docs/audits/COMMAND-09-TRANCHE-1-CAPITAL-CONTROL.md` §2.3.
  - *For Option B:* Regional variance between Southern and Highlands packhouse dynamics.
* **Urgency:** High — Must be agreed before embarking on Day 1.
* **Founder Decision:** `[PENDING FOUNDER SELECTION: Option A | Option B]`

---

## 10. Summary Checklist of Next Actions for the Founder

To maintain governance integrity, the founder must execute the following sequential steps:

1. [ ] **Step 1:** Review Section 9 above and record formal choices for **DEC-01 through DEC-07**.
2. [ ] **Step 2:** Formally update `08_EXPLICIT_GO_HOLD_STOP_CRITERIA.md` with the ratified thresholds.
3. [ ] **Step 3:** Draft the legally bounded Pilot LOI terms reflecting the ratified decision on **DEC-04** (incorporating liability caps and objective ground truth definitions).
4. [ ] **Step 4:** Conduct preliminary outreach via telephone/Zalo to secure at least **02 confirmed introductory meetings** in Cai Lậy and/or Krông Pắc before purchasing tickets.
5. [ ] **Step 5:** Upon meeting confirmation, book economy transit and lodging within the `7,500,000 VND` allocation, strictly logging receipts in `06_FIELD_EVIDENCE_REGISTER.md`.
