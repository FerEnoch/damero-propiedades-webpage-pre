# ODD — Bootstrap approved issue intake

**Canonical source:** `odd/tasks/issue-intake-bootstrap.md`
**Engram mirror:** topic `odd/issue-intake-bootstrap/tasks`
**Status:** In progress
**Branch:** `chore/issue-intake-bootstrap` (based on `origin/main` at `6c212f0`)
**Target repository:** `github.com/FerEnoch/damero-propiedades-webpage-pre`
**Estimated authored changed lines:** Under 100

## Objective

Enable a policy-compliant issue → approval → PR flow for the completed dependency remediation without using a blank/Markdown issue or creating a PR without an approved issue.

## Problem and rationale

The default branch has no YAML Issue Form under `.github/ISSUE_TEMPLATE`, and the repository label inventory lacks both `status:approved` and `type:bug`. The user, who states they are the maintainer, explicitly instructed the assistant to follow the previously described three-step bootstrap: publish a YAML issue form on the default branch, establish the required labels, and create/review an issue before opening the stacked PR.

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

- [ ] Add a focused YAML dependency-update Issue Form under `.github/ISSUE_TEMPLATE/` with required package/version, rationale/evidence, and verification fields.
- [ ] Add the repository labels `status:approved` (approval remains manual) and `type:bug`; reuse existing `dependencies` for the issue.
- [ ] Commit the form on this branch and publish it to the authorized default-branch target using a non-force update.

**Route:** Direct inline for one bounded YAML form plus the explicitly authorized label setup. Test-first exception: passive issue-process configuration has no meaningful runnable RED test; verify YAML structure and target-host readback instead.
**Acceptance criteria:** GitHub's default branch exposes the YAML form; exact required label names exist; no issue is automatically marked approved; no protected approval is applied without exact issue-level user instruction.

### IB-02 — Create and approve the dependency issue

- [ ] Run a current duplicate search covering open and closed issues; stop/reuse a conforming duplicate rather than creating another.
- [ ] Prepare the issue title and materialized form body exclusively from verified session evidence; ask the user to review the exact draft before the single create attempt.
- [ ] Read back the created issue from the target host, then request/receive an exact issue-number approval instruction before applying `status:approved`.

### IB-03 — Open the stacked PR after approval

- [ ] Only after the issue has a verified `status:approved` label, open the PR from `fix/supply-chain-audit-pr15` to `feat/propiedades-demo-ars`, link the issue, and apply exactly one existing `type:bug` label.
- [ ] Report the PR URL; do not merge.

## Progress and evidence

- Read-only discovery on the target host confirmed `main` as default branch, authenticated repository `viewerPermission: ADMIN`, no `.github/ISSUE_TEMPLATE` directory, and no `status:approved` / `type:bug` labels. Existing labels include `dependencies` and `bug`.
- The earlier MapLibre/supply-chain fix is already published on `fix/supply-chain-audit-pr15`; its audit, build, and full E2E gates passed.
- No issue form, label, issue, or PR write has occurred in this bootstrap task yet.

## Next step

Review the task/form implementation, validate the YAML structure, then publish the form and labels as explicitly instructed. Issue body review and protected approval remain separate human gates.
