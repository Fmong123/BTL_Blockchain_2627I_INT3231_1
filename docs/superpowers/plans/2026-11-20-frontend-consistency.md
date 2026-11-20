# Frontend Consistency Implementation Plan

**Goal:** Address the user's five reported issues across the entire live frontend while preserving the purple design and existing blockchain behavior.

**Specification:** User screenshots and explicit request: larger text, consistent page layout, stable text wrapping/alignment, concise functional copy, and working block explorer layouts.

**Architecture:** Shared PageHeader and typography/layout rules; preserve app/routes/Scaffold contract hooks. Explorer details use responsive definition lists instead of an auto-layout table. No contract/dependency changes or blockchain reset.

## Decisions

- Main text/inputs/buttons 16px; supporting text at least 14px; page titles 32px, section/card titles 20–24px. Artwork decoration may be smaller but must not carry essential information.
- Widen the desktop frame to 1440px and align page headers to the same gutter. Form content can remain narrower underneath its shared header.
- Remove repeated creative-space slogans and replace the catalog title with Tác phẩm.
- Remove global overflow-wrap:anywhere; apply wrapping only to hashes/code/long values. Explorer labels keep a stable readable width, stacking on mobile.
- Preserve local chain state and existing user works/licenses. Only restart the frontend to serve the new build.

## Tasks

- [x] Reproduce small-font/explorer layout failures, audit all routes and define shared PageHeader/type scale.
- [x] Apply consistent typography, page headers, concise copy and card/form/metadata alignment to works/register/verify/my/debug/explorer.
- [x] Repair explorer transaction/address/search/tables and their empty/error states, with focused behavior tests where changed.
- [x] Build/lint/typecheck, verify all routes at large/desktop/mobile widths and light/dark, review changes, update docs and refresh the live preview.

## Verification

Use browser geometry/computed styles and screenshots for visual regressions, meaningful pure tests for explorer search input parsing, existing frontend rules for behavior, and real local RPC data for transaction/address pages. Inspect long title/hash wrapping and stable card actions. No CSS-mirroring unit tests.


## Outcome

Completed on the production local build. Frontend rules: 17/17 passing. Build includes lint and TypeScript, passing. Browser geometry: 10 routes × 5 viewport widths, plus connected owner/recipient flows, real explorer links and error states, duplicate guard, PDF lookup, QR, long content and dark theme. Screenshots visually reviewed after transitions. Read-only review identified unbroken description and zero-address blank-page cases; both corrected and verified. No blockchain writes or reset during this pass. Evidence summarized in docs/VERIFICATION.md.
