# Page Override: Domains 3 & 4 — Open-Core, Security Vault & SaaS Corridors (`design-system/pages/open-core-and-saas-corridors.md`)

> **Inherits from:** `design-system/MASTER.md`  
> **Target Surfaces:** `portability.html`, `upgrade.html`, `security-vault.html`, `ed25519-downgrade-simulator.html`, `cloud-ocr-vault.html`, `corridors.html`, `cluster.html`, `webhook-sync-queue.html`, `blueprint.html`

## 1. Zero-Lock-In & Ed25519 Tier Transparency
- **Graceful Downgrade Visibility (`ed25519-downgrade-simulator.html` & `upgrade.html`):** Always show `localDataAccessGuaranteed: true` alongside `COMMUNITY_OPEN_CORE`, `PACKHOUSE_PRO_SAAS`, and `EXPORTER_ENTERPRISE` tier comparisons.
- **Unit Economics & Ceiling Truth (`cloud-ocr-vault.html` & `blueprint.html`):** Render the `94.67%` container gross margin (`150,000 VND` price vs `8,000 VND` COGS) and Vietnam's 281-packhouse pure-SaaS ceiling (`$657,643` vs `$1,000,000 ARR` target) using `tabular-nums`.
