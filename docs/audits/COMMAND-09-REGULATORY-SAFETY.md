# DuriOS Regulatory Safety Investigation: Cadmium & Cross-Border Rules
## Supreme Command #09: Deliverable 5 — Regulatory Safety Audit (Phase D)

**Audit Scope:** Rules catalog, evaluation engines, bilingual advisory disclaimers, export manifests, and legal statutory claims.  
**Auditor Classification:** Adversarial Product Safety & Regulatory Review  
**Date:** 2026-10-09  

---

## 1. Executive Safety Summary

The DuriOS rules engine is designed to prevent non-compliant containers from reaching export borders. However, **making unverified statutory legal claims in software creates serious commercial and legal liability**.

### Key Findings:
1. **Statutory Quarantine Enforced:** `RUL-GB2762-CD` (claiming a statutory GACC/SAMR maximum residue limit of 0.050 mg/kg under GB 2762-2022) is correctly **DISABLED** (`isActive: false`, `isStatutoryVerified: false`) in `src/rules/rule-catalog.ts:77-106`.
2. **Internal Packhouse Buffer Decoupled:** `RUL-INT-CD-WARN` (evaluating Cadmium at `> 0.040 mg/kg`) is active, but explicitly flagged as non-statutory (`isStatutoryVerified: false`). It emits an **ADVISORY WARNING**, not a statutory violation.
3. **Bilingual Disclaimer Quarantine:** In `src/rules/evaluator-helpers.ts` and `src/export/manifest-compiler.ts`, all warning messages and manifest metadata carry mandatory bilingual disclaimers stating that DuriOS evaluations are internal advisory checks and do not substitute for official Phytosanitary Certificates or GACC customs declarations.

---

## 2. Rule-by-Rule Regulatory Audit Matrix

| Rule ID | Name & analyte | Jurisdiction & Authority | Activation State | Statutory Flag | Unit & Operator | Evidence Classification | Status |
|---|---|---|---|---|---|---|---|
| `RUL-GB2762-CD` | Cadmium Statutory Limit | PRC (GB 2762-2022) | **INACTIVE** (`false`) | `false` | `mg/kg` (`> 0.050`) | **UNVERIFIED STATUTORY** | **QUARANTINED** |
| `RUL-INT-CD-WARN` | Cadmium Packhouse Advisory Buffer | Internal Packhouse Protocol | **ACTIVE** (`true`) | `false` | `mg/kg` (`> 0.040`) | **CORROBORATED INDUSTRY PRACTICE** | **ADVISORY ONLY** |
| `RUL-VN-MRL-PEST` | Pesticide Screening Baseline | VN MARD / GACC Protocol | **ACTIVE** (`true`) | `false` | Presence / Negative | **CORROBORATED PROTOCOL** | **ACTIVE** |
| `RUL-CROSS-DOC-SEAL` | Container & Seal Consistency | VN Customs / Transport Dossier | **ACTIVE** (`true`) | `true` | Exact String Match | **VERIFIED OPERATIONAL REQUIREMENT** | **CRITICAL GATE** |
| `RUL-PUC-CONSISTENCY` | Growing Area Code (MSVT) Match | VN MARD Traceability Protocol | **ACTIVE** (`true`) | `false` | Regex & Cross-Doc Match | **PARTIALLY VERIFIED** | **WARNING/REVIEW** |

---

## 3. Documentary Evidence Required to Enable Statutory Rules

Before `RUL-GB2762-CD` can be activated as a binding statutory rule, the following primary sources must be physically procured and archived:

1. **Official PRC Gazette:** Full official Chinese text of *National Food Safety Standard - Limits of Contaminants in Foods (GB 2762-2022)* published jointly by NHC and SAMR, specifically verifying the classification of fresh durian (*Durio zibethinus*) under Category 2.1 (Fresh Fruit) vs. tropical specialty fruits.
2. **Bilateral Protocol Document:** The official signed *Protocol of Phytosanitary Requirements for Export of Fresh Durian from Vietnam to China* between MARD (Vietnam) and GACC (China).
3. **Designated Laboratory Methodology:** Official standard testing method reference (GB 5009.15 for Cadmium in food) and measurement uncertainty specifications from accredited labs (e.g., Eurofins, Quatest 3, SGS).

---

## 4. Customer-Facing Quarantine Protocol

To protect the founder and DuriOS from regulatory exposure during Field Discovery:

- **Sales Pitch Quarantine:** Điều tra viên tuyệt đối KHÔNG quảng cáo với chủ xưởng rằng: *"Phần mềm đảm bảo thông quan 100% tại Bằng Tường / Hữu Nghị"*.
- **Advisory Labeling:** Mọi báo cáo và màn hình HITL phải hiển thị nhãn: `Khuyến nghị nội bộ (Internal Advisory Only)` thay vì `Chuẩn quốc gia GB 2762`.
- **Manifest Caveat:** Mọi tệp manifest JSON/PDF xuất ra phải chứa disclaimer:
  > *"This export manifest is an internal quality verification dossier prepared by the packhouse operator. It does not replace or guarantee official phytosanitary certification or customs clearance by Vietnamese or Chinese authorities."*
