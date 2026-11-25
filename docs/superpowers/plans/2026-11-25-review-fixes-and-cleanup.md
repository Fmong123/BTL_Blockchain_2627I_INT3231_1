# Review fixes and cleanup

Scope: the user authorized fixing the two reproduced review findings and removing proven-unused files. Preserve existing uncommitted work and user data. Local original-file storage and persistent blockchain remain separate proposed work.

- [x] Reproduce strict editor/API payload mismatch, then project editable dossier fields without relaxing write validation.
- [x] Add API regression for concurrent preparations before changing registration storage.
- [x] Give each canonical preparation a stable ID, include it in the draft primary key, and preserve old drafts through migration 0002.
- [x] Retain preparation identity with submitted transactions; recover old requests only when their draft is unambiguous. Finalization must not overwrite an already completed dossier.
- [x] Update handoff/architecture/local scope and remove only unused logo/price helper source files after checking references.
- [x] Run unit, contract, types, lint, build and isolated API regressions; verify new migration preserves existing drafts.
- [x] Verify file inventory, preserve required assets/migrations, and report remaining uncommitted handoff status without committing/pushing.

Evidence: 24 contract tests, 39 frontend tests, full lint, both package type checks, production build, 7 isolated API groups, independent scoped review, migration fresh/upgrade/repeat checks and comparison of all six pre-migration drafts. User database migration remains a runtime setup step, not performed against user data.
