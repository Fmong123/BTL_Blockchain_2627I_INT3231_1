# Restore Purple Demo Implementation Plan

> Execute inline with superpowers:executing-plans. User explicitly requested restoring the already demonstrated design; this is authorization to restore it without a new design approval round.

**Goal:** Match the original purple demo across the live frontend while retaining real blockchain behavior.

**Reference:** Original ban-quyen-so-demo.html, demo-desktop.png, demo-detail.png and demo-mobile.png in the conversation artifact directory.

**Architecture:** Keep Scaffold providers/hooks, routes, contract interfaces and receipt/error handling. Restore presentation in shared theme, header/footer, work cards, work details and license panels. Use existing DaisyUI/Heroicons; no dependencies.

## Global Constraints

- Light palette: accent #7050cd, background #f7f7fb, panel #ffffff, text #272536, border #e9e7f1; matching purple dark palette from the reference.
- Rounded bordered application frame, two-level header, three primary navigation links, three-column illustrated catalog, two-column work details and license management.
- Illustrations represent file types, not uploaded file contents. Do not fabricate artwork, metadata, addresses or license counts.
- Keep registration, verification, grant/revoke, filtering/pagination, wallet changes, error states and admin tooling accessible.
- No contract or dependency changes. Work in the existing codex/license-management branch; no commit/push required.

## Tasks

- [x] Restore shared theme/frame/header/footer and RainbowKit appearance using the reference palette and spacing.
- [x] Restore illustrated card grid, detail layout, registration/verification forms and personal-library/license panels consistently.
- [x] Build/typecheck/lint, compare desktop/mobile screenshots with the original, exercise real local registration/grant/revoke and wallet switching, then leave the updated demo running.

## Review Focus

Responsive navigation/wallet controls at 390px; addresses/hashes and long Vietnamese titles; form readability in light/dark; direct hash links show details without an oversized lookup form; disconnected/incorrect-wallet views retain working permissions and visible status.

## Progress

Ruling: existing demo is the binding visual specification; user explicitly asks for restoration, not another design exploration.
Ruling: keep type illustrations rather than pretend to show original files, since this application only retains file hashes on-chain.
Ruling: verify visual changes in the browser rather than adding tests that mirror CSS/markup. Existing behavior tests remain applicable.

Completed: restored shared palette including Scaffold component tokens, two-level navigation, illustrated grid, detail/permission columns, form styles, personal tabs and footer. Address components use their supported compact/ENS-or-address props, retaining copy/explorer behavior.

Independent review: fixed missing h1 for standalone detail/loading/error/not-found views and selected Tác phẩm for direct hash detail links. Both verified in the browser.

Verification: 15 frontend rule tests pass; final next:build passes lint, TypeScript and production compilation. Chrome smoke passes search/filter, duplicate detection, actual local registration/grant/revoke, wallet switching, received permissions and PDF verification. Final visual checks confirm #7050cd for both app and Scaffold tokens, three columns on desktop, zero overflow at 390px, and matching dark input palette. Original reference and new desktop/detail/mobile/dark images inspected.

Preview: local chain and production frontend running; restored the original three-work seed after transaction checks. No new dependencies or contract changes.
