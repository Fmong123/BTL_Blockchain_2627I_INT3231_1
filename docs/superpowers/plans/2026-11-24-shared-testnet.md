# Shared Testnet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare one Sepolia deployment used consistently by the group's hosted frontend and API.

**Architecture:** A shared network/deployment configuration selects Hardhat or Sepolia. Frontend hooks and API use the same chain and ABI; bounded event reads and a read-only preflight support hosted RPC providers.

**Tech Stack:** Next.js, Viem/Wagmi, Hardhat, PostgreSQL/Drizzle, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-24-shared-testnet-design.md`

## Global Constraints

- Sepolia chain ID 11155111; local Hardhat 31337 remains available.
- Preserve current user changes, generated ABI, SIWE domain/wallet checks and onchain authorization.
- No local reset/seed, no real funds, no secrets in public variables or chat.

## Review Focus

- Unknown network names and incomplete deployment coordinates fail explicitly.
- API RPC chain mismatch cannot authorize writes against another chain.
- Event history retains all pages without exceeding RPC block-range limits.
- Missing testnet deployment builds but shows an actionable unavailable state.
- Integration tests cannot run against the public testnet or hosted database.

### Task 1: Shared network and contract selection

**Files:** `utils/copyrightNetwork.ts`, its tests, `copyright.config.ts`, `scaffold.config.ts`, `contracts/externalContracts.ts`, copyright chain service, wallet/registration/work/license document components.

- [x] Test network allowlist and complete/nonzero address + positive deployment block parsing; run red.
- [x] Implement shared selection, use external declaration for Sepolia, migrate hardcoded product paths and SIWE checks; run tests/type checks.

### Task 2: Hosted RPC compatibility

**Files:** `utils/eventLogs.ts`, tests, `useScaffoldEventHistory.ts`, copyright chain service, `LicenseDocument.tsx`, public explorer routes.

- [x] Test bounded, inclusive event batches, empty ranges and propagated RPC failures; run red.
- [x] Use bounded event reads from deployment block, preserve manual refresh semantics; route testnet explorer pages to Etherscan without mounting local explorer.
- [x] Check local regression tests and both network builds.

### Task 3: Deployment handoff and preflight

**Files:** `.env.sepolia.example`, Hardhat network config, `scripts/check-testnet.mts`, scripts/package entries, `docs/TESTNET_DEPLOYMENT.md`, README and verification notes.

- [x] Add read-only preflight for chain/code/receipt/database/origin and actionable missing configuration errors.
- [x] Guard localhost integration test against testnet selection, document Vercel root/build and exact cloud variables, encrypted deployer/faucet/deploy workflow.
- [x] Run frontend tests, types, lint/build and local API regression with isolated resources. Record which external deployment steps still require user-owned credentials.

## Execution record

- Implemented inline; no production/testnet transactions, deployments, resets or seeds were issued.
- Ruling: keep Hardhat as the local default until public deployment coordinates are available; prepare Sepolia through explicit environment values so an unfinished deployment cannot impersonate the lost local registration.
- Ruling: add an optional BQS_NEXT_DIST_DIR to isolate verification output from the existing serving app. Next-generated tsconfig/next-env changes are restored after checks.
- Fresh review found the fixed local ABI lookup breaks a Sepolia-only clone; fixed with a declaration selector and a red/green regression test. Review reconfirmed resolution.
- Verified: 28 frontend tests, both package type checks, Next lint, Hardhat and Sepolia production builds, 4 Sepolia-mode HTTP checks, wrong-RPC 503, preflight/integration/export negative guards, and all 5 local API regression groups with separate database/RPC/app.
- External handoff remains: user-owned encrypted deployer and Sepolia ETH; Vercel/Neon sign-in, cloud database, confirmed contract deployment, preflight against actual cloud resources, and two-machine acceptance. These are not marked as completed by the code-preparation checklist.
