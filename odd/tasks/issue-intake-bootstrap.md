# ODD — Bootstrap approved issue intake

**Canonical source:** `odd/tasks/issue-intake-bootstrap.md`
**Engram mirror:** topic `odd/issue-intake-bootstrap/tasks`
**Status:** Complete (IB-01, IB-02, IB-03); PR #17 merged into `feat/propiedades-demo-ars` and PR #15 merged into `main`; issue #16 closed
**Branch:** `chore/issue-intake-bootstrap` (based on `origin/main` at `6c212f0`)
**Target repository:** `github.com/FerEnoch/damero-propiedades-webpage-pre`
**Estimated authored changed lines:** Under 100

## Objective

Enable a policy-compliant issue → approval → PR flow for the completed dependency remediation without using a blank/Markdown issue or creating a PR without an approved issue.

## Problem and rationale

The default branch had no YAML Issue Form under `.github/ISSUE_TEMPLATE`, and the repository label inventory lacked both `status:approved` and `type:bug`. The user, who states they are the maintainer, explicitly instructed the assistant to follow the previously described three-step bootstrap: publish a YAML issue form on the default branch, establish the required labels, and create/review an issue before opening the stacked PR.

## Scope and constraints

- GitHub target is `github.com/FerEnoch/damero-propiedades-webpage-pre`; default branch is `main`.
- User authorized the issue-intake bootstrap steps, including publication of the form to the default branch.
- Use the existing `dependencies` label on the issue form; never auto-apply `status:approved`.
- `status:approved` is a protected human approval decision and may only be applied to the exact issue after the user reviews it and explicitly approves it.
- The issue form must be on the default branch to be offered by GitHub; no Markdown/blank-body fallback is permitted.
- Complete a current open-and-closed duplicate search after selecting the form and before issue creation.
- Keep the issue body in a private temporary file outside the repository. Make one issue-create attempt and read it back; no blind retries.
- Do not merge PR #15 or the stacked PR.

## Tasks

### IB-01 — Publish dependency-update form and labels

- [x] Add a focused YAML dependency-update Issue Form under `.github/ISSUE_TEMPLATE/` with required package/version, rationale/evidence, and verification fields.
- [x] Add the repository labels `status:approved` (approval remains manual) and `type:bug`; reuse existing `dependencies` for the issue.
- [x] Commit the form on this branch and publish it to the authorized default-branch target using a non-force update.

**Route:** Direct inline for one bounded YAML form plus the explicitly authorized label setup. Test-first exception: passive issue-process configuration has no meaningful runnable RED test; verify YAML structure and target-host readback instead.
**Acceptance criteria:** GitHub's default branch exposes the YAML form; exact required label names exist; no issue is automatically marked approved; no protected approval is applied without exact issue-level user instruction.

### IB-02 — Create and approve the dependency issue

- [x] Run a current duplicate search covering open and closed issues; stop/reuse a conforming duplicate rather than creating another.
- [x] Prepare the issue title and materialized form body exclusively from verified session evidence; ask the user to review the exact draft before the single create attempt.
- [x] Read back the created issue from the target host, then request/receive an exact issue-number approval instruction before applying `status:approved`.

### IB-03 — Open the stacked PR after approval

- [x] Only after the issue has a verified `status:approved` label, open the PR from `fix/supply-chain-audit-pr15` to `feat/propiedades-demo-ars`, link the issue, and apply exactly one existing `type:bug` label.
- [x] Report the PR URL; do not merge.

## Progress and evidence

- Read-only discovery on the target host confirmed `main` as default branch, authenticated repository `viewerPermission: ADMIN`, no `.github/ISSUE_TEMPLATE` directory, and no `status:approved` / `type:bug` labels. Existing labels include `dependencies` and `bug`.
- The earlier MapLibre/supply-chain fix is already published on `fix/supply-chain-audit-pr15`; its audit, build, and full E2E gates passed.
- IB-01: `.github/ISSUE_TEMPLATE/dependency-update.yml` was validated with js-yaml against the GitHub form schema (required fields, existing `dependencies` label, options/required types) and committed as `6e5d7d7` (`chore(issue-forms): add dependency-update intake form`). The non-force push `chore/issue-intake-bootstrap:main` was accepted by the target host, which reported the authenticated actor bypassed the require-PR and required-status rules for `main` — evidence the actor holds maintainer authority. API readback confirms the form at `.github/ISSUE_TEMPLATE/dependency-update.yml` on `main` (sha `db595ed6`, 1562 bytes).
- IB-01: labels `status:approved` (color `0e8a16`) and `type:bug` (color `d73a4a`) were created on the target host and read back with their descriptions; the `dependencies` label is reused from the existing inventory.
- IB-01 close commit: `a642fe4` (`docs(odd): close issue intake bootstrap IB-01`, local on the bootstrap branch; main already carries the form at `6e5d7d7`).
- IB-02: duplicate search over all open and closed issues returned 0 items — no duplicate is possible; no candidate read set is required.
- IB-02: the user approved the exact draft and affirmed the first-person duplicate-check statement. The single `gh issue create` attempt succeeded: **issue #16** (`https://github.com/FerEnoch/damero-propiedades-webpage-pre/issues/16`), created with the form-declared `dependencies` label. Target-host readback confirmed state OPEN, exact title, body equality after CRLF/trailing-newline normalization, and labels `[dependencies]` — classified `confirmed`. Temporary body/readback files were removed (confirmed-path cleanup).
- IB-02 close: after the maintainer's exact issue-level instruction, `viewerPermission` was re-verified as ADMIN immediately before mutation; the validated pre-state was issue #16 OPEN with labels `[dependencies]` and no conflicting approval labels; the single atomic add-only mutation applied `status:approved`; the target-host post-readback confirmed #16 OPEN with `[dependencies, status:approved]` and every unrelated pre-state label preserved — classified `confirmed`. PR #15 remains unchanged.
- IB-03: **PR #17** (`https://github.com/FerEnoch/damero-propiedades-webpage-pre/pull/17`) was opened from `fix/supply-chain-audit-pr15` to `feat/propiedades-demo-ars` with body linking `Closes #16` (title `fix(deps): clear transitive security advisories and update maplibre-gl to 6.12.0`) and exactly one `type:bug` label. Readback confirmed base/head, OPEN state, labels `[type:bug]`, and the issue link. Temporary private files were removed (confirmed-path cleanup).
- Delivery close (2026-10-08): PR #17 was merged into `feat/propiedades-demo-ars` at 14:27:59Z and PR #15 was merged into `main` at 14:30:52Z; issue #16 closed automatically as COMPLETED. The remote `fix/supply-chain-audit-pr15` branch was removed after merge.

## Next step

Closed. No merge action remains; the bootstrap record reflects the merged, closed delivery. Any later verification lives in `main` history.
