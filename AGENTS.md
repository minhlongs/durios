# Repository Guidelines

## Strategic Context & Guardrails (Strategic Realignment v2.0)

- **Vision & Metaphor**: Founder has outlined the vision of DuriOS as the value-chain orchestration platform across Southeast Asia durian exports (using the "Grab" metaphor for multi-sided coordination).
- **Current Operational Baseline**: The project remains at **STAGE ZERO** (single-site on-premise container dossier software for Cai Lậy packhouse).
- **V2 Documentation Status**: All V2 artifacts (`docs/product-direction/*V2*`) are strictly **`DRAFT_FOR_FOUNDER_REVIEW`**. Approved baseline remains V1 (`PRODUCT-PRD-V1.md` and `PRODUCT-ARCHITECTURE-AND-ROADMAP-V1.md`).
- **Safety Boundaries**: No public marketplace, no payment holding/custody, no AI autonomous sign-offs, and no real customer data ingestion until all five launch gates (`GATE-01..GATE-05`) pass.

## Project Structure & Module Organization

This repository implements the DuriOS Container Dossier Workspace using Bun and TypeScript:

- `src/`: Application source code, organized into domain models (`domain/`), server-side authentication and operations (`auth/`), document ingestion (`ingestion/`, `extraction/`), compliance rules (`rules/`), SQLite persistence (`storage/`), delegated sharing (`sharing/`), organic evidence (`organic/`), workspace orchestration (`workspace/`), HTTP server handlers (`server/`), and static browser UI assets (`ui/`).
- `test/`: Bun test suites (`*.test.ts`), shared scenario harnesses (`test/helpers/`), and synthetic test fixtures.
- `docs/`: Product direction specifications, pilot operations runbooks, and audit documentation.

## Build, Test, and Development Commands

Use the following commands from the repository root (matched to `package.json`):

- `bun install`: Install project dependencies and type definitions.
- `bun run typecheck`: Run `tsc --noEmit` to verify strict TypeScript types across the codebase.
- `bun test`: Execute the Bun test suite in `test/`.
- `bun run start:server`: Launch the local HTTP server (`src/server/server.ts`) bound to `127.0.0.1`.
- `bun run start`: Run the local CLI workflow demo (`src/cli.ts`).

## Coding Style & Naming Conventions

- **Indentation & Formatting**: Use two-space indentation and semicolons. No automated formatter or linter is configured; match surrounding files carefully.
- **TypeScript Strictness**: Maintain strict type checking (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`).
- **Module Imports**: Use ESM relative imports with explicit `.js` specifiers (for example, `import { SqliteClient } from "../storage/sqlite-client.js"`).
- **Filenames**: Name source modules in `kebab-case.ts` and test files in `kebab-case.test.ts`.

## Commit & Pull Request Guidelines

- **Commit Messages**: Available Git history uses a `feat:`-prefixed convention (`feat: initialize DuriOS v0.1.0...`). Use concise, descriptive commit subjects with conventional prefixes such as `feat:`, `fix:`, `refactor:`, `test:`, or `docs:`.
- **Pull Requests**: Include a clear summary of changes, output from relevant checks (`bun run typecheck` and `bun test`), linked issues or prompt references when applicable, and UI screenshots whenever interface files under `src/ui/` are modified.

## Security & Configuration Notes

This codebase is a local prototype and single-site pilot workspace. Keep the server bound to `127.0.0.1` (`localhost`) and never expose the application server directly to public networks without approved reverse-proxy TLS termination. Never commit real customer documents, credentials, or production secrets.
