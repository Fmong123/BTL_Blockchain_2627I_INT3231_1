# Interface consistency

Goal: Make actions and important information easier to scan across the existing Vietnamese copyright application.

Use the existing purple DaisyUI theme, shared page headers and information sections. Standardize primary and secondary buttons, responsive action rows, readable supporting text, visible legal caveats and status/error notices with icons. Preserve contract calls, authentication, validation, PDF rendering and existing local changes.

- [x] Add a shared notice component and update shared presentation rules.
- [x] Apply the same action/notice structure to catalog, registration, verification, profile, sharing and license screens.
- [x] Run formatting, TypeScript and existing frontend tests; attempt desktop/narrow preview.

Review focus: long wallet/hash/error strings; mobile buttons; disabled transaction actions; light/dark contrast; screen-only changes must not alter printed license layout.

Implementation stays in the current branch because the requested interface includes existing uncommitted changes. No dependency changes or new behavior tests are needed for this presentation-only work.

Verification: TypeScript and ESLint on the changed TSX files passed. Existing frontend suite passed 36/36 (existing Node module-type warnings). Independent review found a disabled-outline styling issue; overrides now exclude disabled controls, including fieldset-disabled buttons. Supporting labels and license notes use at least 14px; print point sizes remain separate.

Visual verification remains incomplete: the local Next.js preview accepted startup but HTTP/browser requests timed out, including after restarting with local network permissions. No desktop/mobile screenshot or production build claim is made.
