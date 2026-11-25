# Sharing and System Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public sharing/print flows and make the new copyright subsystem part of automated verification.

**Architecture:** Keep WorkRegistry V1 and existing Scaffold reads. Canonical URLs link work verification and a public license detail route; browser print exports the same observed data. CI starts PostgreSQL and the production app before running API integration tests.

**Tech Stack:** Next.js App Router, Scaffold-ETH hooks, DaisyUI, qrcode.react, PostgreSQL/Drizzle, Node test runner, GitHub Actions.

**Spec:** ../specs/2026-11-23-sharing-and-consistency-design.md

## Global Constraints

- No new runtime dependencies or contract/ABI changes.
- Vietnamese UI and Asia/Ho_Chi_Minh timestamps.
- Chain validity and off-chain acceptance remain separate.
- No push, merge, public deployment or destructive reset of existing services.

## Review Focus

- Unknown/invalid license ID, RPC failure or contract reset must not become valid printed records.
- QR and copied links must preserve work/license identity without account/session data.
- DB failure must be distinguished from missing terms and acceptance.
- Revocation/expiry after printing must be discoverable through the printed link.
- Mobile/dark/print layouts must keep long hash/address text readable.

### Task 1: CI and reproducible integration runtime

**Files:** `.github/workflows/lint.yaml`, `scripts/wait-for-service.mjs`, `packages/nextjs/db/copyright.integration.mts`.

**Interfaces:** wait script accepts one HTTP URL and an optional JSON-RPC readiness check; exits nonzero on timeout. CI invokes existing `yarn test:copyright` after DB migrations and production app readiness.

- [x] Add PostgreSQL service/config, migration and production API test steps; run for ngyn_branch/feature PRs as well as main.
- [x] Implement bounded readiness checks, keep failure logs and test replay/logout/expiry behavior with isolated local services.
- [x] Verify workflow parsing and live integration where available.

### Task 2: Work sharing and public license print

**Files:** `packages/nextjs/utils/shareLinks.ts`, `shareLinks.test.mjs`, `components/works/WorkSharePanel.tsx`, `components/licenses/LicenseDocument.tsx`, `app/licenses/[id]/page.tsx`, `components/licenses/LicenseCard.tsx`, `components/works/WorkRecord.tsx`, `components/copyright/LicenseTermsPanel.tsx`, `styles/copyright.css`.

**Interfaces:** canonical verification/license URL builders and positive uint256 license ID parser; shared public terms query used by card and print document. Public license reads use Scaffold hooks and current chain block.

- [x] Write and run failing tests for canonical identity URLs and invalid/overflowing IDs.
- [x] Implement URL helpers, QR/copy controls, direct license route, status/error/refresh behavior and print styles.
- [x] Run frontend tests, typecheck, lint/build; inspect desktop/mobile/dark/print.

### Task 3: System consistency and handoff

**Files:** `README.md`, `docs/ARCHITECTURE.md`, `docs/VERIFICATION.md`, `docs/HANDOFF_NGYN.md`, `KE_HOACH_DU_AN.md` and related UI labels.

**Interfaces:** documentation describes exactly the verified commands and behavior; no claims of unrun checks.

- [x] Align acceptance labels, existing cards and public print behavior; update docs and remaining work.
- [x] Run quality commands and isolated API tests; record evidence and limits.
- [x] Request an independent whole-change code review and resolve important findings.

## Execution record

- Baseline: 24 contract / 17 frontend tests passed. Final: 24 / 21, both workspace typechecks, lint and production build passed. PostgreSQL 16.16 UTF-8 migration ran twice; five API integration groups passed on production local.
- Independent review: fixed mixed-history snapshot risk with block hash recheck, immutable grant comparison and captured observation block. Regression test observed failing then passing. No critical findings.
- Browser QA covers QR decoding/clipboard, public records, IDs, grant mismatch, API/RPC failures, mobile/dark/print; PDF rendered and visually inspected. Evidence and limitations are in docs/VERIFICATION.md.
- Decision: preserve WorkRegistry V1 and separate chain validity from off-chain acceptance, as scoped. Direct `/licenses/id` remains a current-network lookup; the QR/full document link pins tx/block/contract. The review's minor address-bar observation is documented rather than silently changing direct-lookup semantics.
- Local feature branch preserves the pulled ngyn_branch baseline. No worktree creation, push, merge or public deployment. Temporary verification tools do not change project dependencies or user secrets.
