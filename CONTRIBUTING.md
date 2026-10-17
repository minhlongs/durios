# Contributing to DuriOS Open-Core

Thank you for contributing to **DuriOS** — the open-core container dossier workspace and deterministic compliance verification toolkit for agricultural export.

- **Program Status:** `IMPLEMENTATION_IN_PROGRESS_EXTERNAL_GATES_PENDING` (Local open-core foundation active; external cloud infrastructure, legal/CLA automation, and regulatory feeds pending — see `plans/261017-open-core-hardening/plan.md`).

## 1. Engineering Quality Gates (Strict Enforcement)
Every Pull Request submitted to this repository must pass all automated CI checks (`.github/workflows/ci.yml`) before review:

1. **Frozen Lockfile & Tracked Secret Hygiene:**
   Dependencies must install cleanly via `bun install --frozen-lockfile`. Commits must never track `.env*`, `.db` / `.db-wal` / `.db-shm`, or private key files (`.pem`, `.key`, `.p12`, `.pfx`).
2. **Strict TypeScript (`0` errors):**
   ```bash
   bun run typecheck
   ```
3. **Zero `any` Policy:**
   No occurrences of `: any`, `as any`, or `<any>` are permitted anywhere in `src/` or `test/`.
4. **File Length Ceiling ($\le 179$ lines per `.ts` file):**
   Every TypeScript file in `src/` and `test/` must remain $\le 179$ lines to preserve modularity and auditability.
5. **100% Test Suite Pass:**
   ```bash
   bun test
   ```

## 2. Human-in-the-Loop (HITL) & Regulatory Safety Boundaries
- **Never bypass human verification:** All document extractors (whether local regex or `CloudVisionOcrExtractorAdapter`) must emit candidate fields with `verificationStatus: "DRAFT"`. Only an authenticated human operator (`CLERK`, `MANAGER`, `ADMIN`) can transition a field to `"HUMAN_VERIFIED"`.
- **Fail-closed external connectors:** Any SaaS or external integration adapter must fail closed when unconfigured or unlicensed, and must never fabricate network delivery or regulatory approval receipts.
- **Never commit real customer PII or secrets:** Only synthetic test fixtures (`VN-TG-ORCHARD-*`, `MSKU1234565`, ephemeral test keys) are allowed in commits, supporting data minimization principles under Vietnam's Personal Data Protection Law (`91/2025/QH15`).
- **Maintain Zero-Custody in B2B/Escrow modules:** DuriOS never holds, pools, or transmits customer funds (`Nghị định 52/2024/NĐ-CP`).

## 3. Inbound Licensing & Contribution Terms
Until an external automated CLA bot is deployed, contributions are accepted under an **Inbound = Outbound** basis pursuant to `LICENSE` and `LICENSE-MIT` (MIT for the 5 specification/verifier modules and their type definitions; `AGPL-3.0-only` for the Community Core), unless a separate written Contributor License Agreement is executed with the project maintainers.
