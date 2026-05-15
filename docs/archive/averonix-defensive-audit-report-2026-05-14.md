# Averonix Defensive Engineering Audit Report

Date: 2026-05-14

Scope: Local repository review only. No penetration testing, exploitation, brute force, aggressive scanning, destructive actions, or third-party target testing was performed. Environment files were not opened or printed. A local `.env` file exists and was not read.

## 1. Executive Summary

Averonix is controlled demo-ready with caveats. It is not MVP-ready, pilot-ready, or production-ready.

The product has a coherent current shape: landing page, auth pages, onboarding, Agent Evidence Scan, Manual Assessment D1-D9 with 81 guided questions, Dashboard Command Center, Readiness Report Preview, disabled Integration Evidence placeholder, Supabase auth/company profile, FastAPI backend, and logo/BETA branding.

The main strengths are the safe compliance positioning, the Manual Assessment model, the dashboard/sidebar UX, the Agent safety controls, and the disabled integrations posture. The main risks are still source-of-truth and persistence correctness: organization persistence exists but is not yet reliably authoritative, localStorage still seeds authenticated pages, Agent scan persistence drops `organizationId`, onboarding completion is inferred from organization existence, and the lint gate now fails because ESLint scans `backend/.venv`.

Final classification: controlled demo-ready, not MVP-ready.

## 2. Current Progress Score

| Area | Score | Notes |
|---|---:|---|
| Frontend | 76 | Good route coverage and UX, but authenticated pages still initialize from localStorage. |
| Backend | 76 | Auth, validation, CORS, SSRF controls, and persistence helpers exist; ownership path needs hardening. |
| Agent Evidence | 70 | Safe scan model is solid, but frontend drops `organizationId` before backend scan call. |
| Manual Assessment | 82 | D1-D9, 81 questions, validation, autosave, and evaluation are strong; persistence precedence still incomplete. |
| Dashboard | 82 | Command-center layout is strong; data source precedence needs correction. |
| Report Preview | 77 | Honest and useful; still initializes from localStorage before persisted result. |
| Integrations | 88 | Correctly disabled and clearly coming soon. |
| Branding | 82 | Logo assets/component are present; browser visual verification still needed. |
| Compliance wording | 88 | Safe wording in product copy; prohibited-claims list exists only in docs as "do not say". |
| Security | 68 | Good defensive controls; RLS helper design and source-of-truth issues remain. |
| UX | 80 | Sidebar/dashboard are much improved; fallback and persistence states need clearer gating. |
| Data persistence | 58 | Supabase foundation exists, but localStorage still competes with persisted state. |
| Documentation | 64 | Docs exist but are stale after persistence work. |
| Production readiness | 42 | Not production-ready: tenancy, lint, persistence, and deployment hygiene gaps remain. |
| Overall MVP readiness | 66 | Close to MVP foundation, but critical persistence issues remain. |

## 3. Product Completeness Review

Current flow coverage:

- Landing page: present.
- Login/Register: present.
- Onboarding: present, but completion source of truth is flawed.
- Agent Evidence Scan: present, backend-first when configured, but persisted scan path is broken by missing `organizationId`.
- Manual Assessment: present and complete for D1-D9/81 questions.
- Dashboard: present and executive-friendly.
- Report Preview: present and assessment-result based.
- Integrations: present as disabled coming soon.

Broken or incomplete areas:

- Agent scan persistence is not reliable.
- Organization profile completion is not explicit.
- Authenticated dashboard/report/scan screens still seed localStorage before persisted workspace data.
- Documentation still describes localStorage as the evidence persistence model.
- Lint fails due backend virtual environment files being included in ESLint scope.

Classification:

- Prototype: yes, but stronger than a pure prototype.
- Controlled demo-ready: yes, with caveats.
- MVP-ready: no.
- Pilot-ready: no.
- Production-ready: no.

## 4. Dashboard & Sidebar UX Review

The dashboard now mostly matches the expected controlled-demo command-center structure.

Confirmed:

- `src/components/layout/DashboardShell.tsx` has the controlled-demo sidebar groups: Overview, Readiness, Program, Workspace.
- Unfinished program items are muted/disabled with Soon labels.
- Mobile hamburger navigation exists.
- `src/routes/dashboard.tsx` includes command center header, KPI cards, Current Readiness State, Evidence Sources, Next Best Actions, Domain Readiness Map, Report Preview, Company Context, and DEV diagnostics.
- Agent Evidence is separated from Manual Readiness Score.
- Integrations are visibly coming soon.

Problems:

- Dashboard initializes from localStorage first: `src/routes/dashboard.tsx:115-117`.
- Persisted state can override later, but if backend/Supabase fails the user can see local cached results without a sufficiently strong source warning.
- Demo diagnostics are internal, but the dashboard still depends on local demo data enough to blur MVP source-of-truth boundaries.

Dashboard UX score: 82/100.

Recommended improvements:

- For authenticated users with organization context, load persisted workspace data first.
- Show localStorage only as explicit development fallback.
- Add visible source labels: Saved to workspace, Draft saved locally, Backend unavailable - local development fallback.

## 5. Manual Assessment Review

Expected model is implemented well:

- D1-D9 domains exist in frontend and backend data.
- Supported sectors return 81 questions.
- Sector normalization exists.
- Maturity levels and evidence confidence values are modeled.
- Autosave exists.
- localStorage keys exist:
  - `averonix.assessment.responses`
  - `averonix.assessment.results`
  - `averonix.assessment.progress`
- Backend evaluates and rejects incomplete final assessments.
- Backend validates invalid IDs, maturity, confidence, domain mismatch, note length, and duplicates.

Persistence status:

- `src/lib/assessment/api.ts` includes persisted session, response, evaluate, and latest result APIs.
- `backend/app/api/assessment_routes.py` requires auth for persisted session and result operations.
- `backend/app/persistence.py` computes and stores response hashes.

Issues:

- `src/routes/assessment.tsx` can use persisted responses, but still falls back to local responses when persistence is unavailable.
- Fallback is useful for development, but MVP production needs stronger gating and labels.
- Recommendation wording still implies raw evidence attachment in `src/lib/api.ts:322` and `backend/app/assessment/scoring.py:163`, which conflicts with the no raw sensitive data posture.

Manual Assessment score: 82/100.

## 6. Agent Evidence Review

Positive findings:

- Agent is framed as external technical signal evidence only.
- Backend scan endpoint exists at `POST /api/agent/scan`.
- Frontend uses `VITE_API_BASE_URL` via `src/lib/api.ts`.
- Backend status is visible in `/scan`.
- Frontend fallback exists and is labeled as limited browser checks.
- Mapped evidence is grouped by question ID.
- Backend rejects localhost, private/reserved IP literals, unsafe schemes, internal TLDs, and public domains resolving to private IPs.
- Backend rate limiting and timeout exist.
- HTTP checks use `follow_redirects=False`.
- Exposed services are policy `not_checked`; no port scanning was found.

Critical issue:

- `src/routes/scan.tsx:121` passes `organizationId` to `runAgentScan`.
- `src/lib/agent/agent-engine.ts:84` calls `runBackendAgentScan` without `organizationId`.
- `backend/app/api/agent_routes.py:86-108` requires/persists by `organizationId`.

Impact: production or authenticated Agent scans can be rejected or fail to persist under the organization. Dashboard Agent Evidence may not load from `agent_scans`.

Agent Evidence score: 70/100.

## 7. Report Preview Review

Confirmed:

- `/report` has an empty state if no result exists.
- It shows readiness preview wording, not certification report wording.
- PDF export is disabled.
- It displays overall score, risk level, evidence confidence, domain breakdown, critical gaps, recommendations, and metadata rows.
- It includes the formal disclaimer.

Issue:

- `src/routes/report.tsx:40` initializes `result` from localStorage before persisted result loading. With an authenticated organization, backend/Supabase should be the primary source and localStorage should be dev fallback only.

Report score: 77/100.

## 8. Landing Page & Copy Review

No unsafe product copy was found in the inspected product pages for:

- ISO certified
- official ISO approval
- guaranteed compliance
- full compliance
- certification ready
- audit guaranteed
- auditor replacement
- 30 questions
- 6 domains
- CNDP as main positioning
- Lovable App metadata

`docs/demo-script.md` includes phrases such as "official ISO approval", "guaranteed compliance", and "full compliance" only inside the "What Not To Claim" section. That is safe.

The product is still ISO/IEC 27001-led, which is correct for the current release. To remain framework-flexible later, future copy should introduce "framework readiness", "framework mapping", and "evidence sources" without diluting current ISO clarity.

Compliance wording score: 88/100.

## 9. Branding / Logo Review

Expected assets exist:

- `public/brand/logo-horizontal.svg`
- `public/brand/logo-icon.svg`
- `public/brand/logo-monochrome.svg`
- `public/brand/logo-horizontal-dark.svg`
- `public/brand/apple-touch-icon.png`

Confirmed:

- Logo component exists at `src/components/brand/Logo.tsx`.
- It supports variants: horizontal, icon, monochrome, dark.
- It supports sizes: sm, md, lg, xl.
- BETA badge is separate HTML/CSS, not baked into SVG.
- Favicon and Apple touch icon are configured through route/head metadata rather than a root `index.html`.

Limitations:

- There is no root `index.html` file in this TanStack Start project. This is not automatically a bug, but it means head/icon configuration must be verified through route/root metadata instead.
- Visual logo sizing was not browser-verified during this audit.
- The `Logo` component always links to `/`; in authenticated app shell contexts `/dashboard` may be a better destination.

Branding score: 82/100.

## 10. Integrations Review

Confirmed:

- Integrations page is a placeholder only.
- Microsoft 365, Google Workspace, GitHub, Cloudflare, and AWS/Azure are present.
- Buttons are disabled and labeled Coming Soon.
- Planned checks are neutral/planned, not green pass states.
- OAuth is not implemented.
- No real tokens are requested.

Integrations score: 88/100.

## 11. Defensive Security Review

Frontend:

- No service role key was found in browser-facing code.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server/backend contexts.
- `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML`, but for developer-controlled chart CSS, not user-generated content.
- localStorage parsing is defensive.
- Raw evidence file upload is not implemented.

Backend:

- Production CORS blocks wildcard and requires `ALLOWED_ORIGINS`.
- Agent endpoint includes rate limiting, timeout, safe target validation, and generic internal error handling.
- Assessment endpoint rejects incomplete final evaluation and invalid response fields.
- Production protected endpoints require authentication.

Supabase/security risks:

- RLS helper functions in `supabase/migrations/20260513203000_mvp_organizations_persistence.sql` accept an arbitrary `uid` parameter and are granted to authenticated users. This should be tightened.
- `profile_completed` is missing from organizations, so authorization/redirect decisions rely on incomplete profile semantics.
- No Supabase policy tests were found.
- `backend/.venv` exists and is scanned by ESLint, indicating dependency folders are not fully excluded from tooling.

Security score: 68/100.

## 12. Supabase & Persistence Review

Current model:

- Supabase auth is used.
- Legacy `companies` table exists.
- New organization tables and evidence persistence tables exist:
  - organizations
  - organization_members
  - assessment_sessions
  - assessment_responses
  - assessment_results
  - agent_scans
  - report_snapshots
  - audit_logs

Critical persistence issues:

- Organization existence implies onboarding completion via `src/lib/org/api.ts:38`.
- `profile_completed` or equivalent is not present in the organizations migration.
- Agent scan `organizationId` is dropped before backend call.
- Authenticated pages still initialize from localStorage before persisted workspace data.
- Existing older tables remain, including `assessment_answers`, `scans`, and `integrations`, creating future source-of-truth ambiguity.

Recommended migration path:

1. Add `profile_completed boolean not null default false` to organizations.
2. Backfill complete organizations only when required profile fields exist.
3. Fix Agent `organizationId` forwarding.
4. Make persisted workspace state authoritative for authenticated dashboard/report/scan.
5. Keep localStorage only as draft/development fallback.
6. Deprecate or migrate legacy user-owned tables.
7. Add Supabase policy and persistence tests.

Data persistence score: 58/100.

## 13. Tests / Build Verification

Commands run:

- `npm run test`: passed, 8 test files, 30 tests.
- `npx tsc --noEmit`: passed.
- `npm run lint`: failed.
- `npm run build`: passed.
- `python -m pytest backend`: passed, 34 tests.

Lint failure:

- ESLint scans `backend/.venv/Lib/site-packages/urllib3/contrib/emscripten/emscripten_fetch_worker.js`.
- This is a vendored dependency file, not Averonix app code.
- Current lint gate is still failed until `.venv`/`backend/.venv` is excluded from linting or removed from the workspace.

Build note:

- `npm run build` emits `Using secrets defined in .env` and creates `dist/server/.dev.vars`.
- `.gitignore` excludes `.env`, `.env.*`, `dist`, and `dist/server/.dev.vars`.
- This directory is not a Git repository, so tracked/staged secret status cannot be verified.

Safe endpoint verification:

- Existing backend tests cover `/api/health`, assessment question count, incomplete assessment rejection, private target rejection, CORS production behavior, Agent auth rejection, and generic Agent 500 error behavior.
- No public targets were scanned.

## 14. Documentation Review

`README.md` exists and includes:

- Requirements
- Frontend/backend setup
- Env variable examples
- `VITE_API_BASE_URL`
- Supabase frontend vars
- Local demo URL
- Deployment caveat
- Disclaimer

`docs/demo-script.md` exists and includes:

- Opening
- Demo flow
- Safety wording
- What not to claim
- Demo limitations

Documentation issue:

- `README.md:75` and `docs/demo-script.md:39` still say local demo evidence uses localStorage persistence. This is stale after the Supabase organization persistence work. Correct wording should say authenticated workspace data should use backend/Supabase when configured, while localStorage is development/offline fallback only.

Documentation score: 64/100.

## 15. Critical Issues

### 15.1 Agent scan persistence drops organizationId

Severity: Critical for MVP.

File/location:

- `src/routes/scan.tsx:121`
- `src/lib/agent/agent-engine.ts:84`
- `backend/app/api/agent_routes.py:86-108`

Impact:

Production backend requires `organizationId` for authenticated scan persistence. The frontend receives organization context but drops it before the backend call. Scans can fail in production or fail to persist under the organization.

Recommended fix:

Forward `organizationId: input.organizationId` into `runBackendAgentScan`.

Test to confirm:

Add a frontend unit test proving the backend scan body includes `organizationId`, and a backend route test proving a successful authenticated scan persists against the organization.

### 15.2 Organization existence is treated as onboarding completion

Severity: Critical for MVP.

File/location:

- `src/lib/org/api.ts:38`
- `src/lib/storage.ts:60-63`
- `src/components/layout/DashboardShell.tsx:82-93`

Impact:

Any existing organization is mapped to `onboardingCompleted: true`. A partially created organization can unlock dashboard access and create false workspace completeness.

Recommended fix:

Add `profile_completed boolean not null default false` to organizations. Set it true only after required onboarding fields are complete.

Test to confirm:

Test that an organization with `profile_completed=false` redirects to onboarding or shows "Complete company profile", while completed onboarding sets it true.

### 15.3 Lint gate fails because backend virtual environment is included

Severity: Critical for CI/demo gate reliability.

File/location:

- `backend/.venv/Lib/site-packages/...`
- ESLint project scope

Impact:

`npm run lint` fails on a vendored dependency. This blocks the stated verification gate even though app code is not the cause.

Recommended fix:

Exclude `.venv`, `backend/.venv`, Python caches, and generated dependency folders from ESLint and repository hygiene.

Test to confirm:

Run `npm run lint` and verify only intended app files are linted.

## 16. High Issues

### 16.1 Authenticated dashboard/report still seed from localStorage

Severity: High.

File/location:

- `src/routes/dashboard.tsx:115-117`
- `src/routes/report.tsx:40`
- `src/routes/scan.tsx:67`

Impact:

Authenticated users can see stale local cache before or instead of persisted workspace data. This undermines the MVP source-of-truth model.

Recommended fix:

For authenticated users with organization context, request backend/Supabase data first. Use localStorage only as labeled development fallback.

### 16.2 Supabase RLS helper functions accept arbitrary uid

Severity: High.

File/location:

- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql:26`
- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql:40`
- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql:53`

Impact:

Authenticated users may be able to call `SECURITY DEFINER` helpers with another user's UUID, creating membership/role inference and a future authorization footgun.

Recommended fix:

Remove public `uid` parameters or enforce `uid = auth.uid()` inside the function. Revoke direct execute if possible.

### 16.3 Evidence recommendation wording conflicts with no raw sensitive data posture

Severity: High for trust wording.

File/location:

- `src/lib/api.ts:322`
- `backend/app/assessment/scoring.py:163`

Impact:

Raw-evidence attachment wording can imply raw uploads/proofs. The product's trust posture says no raw sensitive data required.

Recommended fix:

Replace with: "Track stronger evidence references to raise confidence above 60%."

### 16.4 Documentation is stale after persistence work

Severity: High for handoff.

File/location:

- `README.md:75`
- `docs/demo-script.md:39`

Impact:

Docs still describe localStorage as evidence persistence, even though the app now has organization-owned persistence paths.

Recommended fix:

Update docs to describe Supabase/FastAPI as the authenticated source of truth and localStorage as fallback cache.

## 17. Medium Issues

- No root `index.html` exists. This is acceptable for TanStack Start, but head/icon configuration must be verified through route/root metadata.
- `Logo` always links to `/`, which is not ideal inside authenticated dashboard shell.
- Legacy Supabase tables remain next to organization-owned tables.
- API key behavior in `backend/app/api/agent_routes.py` is ambiguous because authentication is still required after API-key check.
- `dist/server/.dev.vars` is generated during build; ensure deploy artifacts never include it.
- Supabase generated TypeScript types do not include new organization/persistence tables, so frontend type safety is incomplete.
- Python `__pycache__` and build artifacts are present in the local tree.

## 18. Low Issues / Polish

- React Fast Refresh warnings remain in shared UI components when lint reaches app files.
- Product is still heavily ISO-led; future framework expansion needs abstraction copy later.
- Browser visual check is still needed for logo sizing/visibility.
- `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML`; acceptable while chart config is developer-controlled.
- Existing audit report files at project root create clutter; move old reports into `docs/` later.

## 19. Demo Readiness Checklist

| Item | Status |
|---|---|
| Landing page safe and clear | Pass |
| Auth pages present | Pass |
| Onboarding present | Pass with caveat |
| Agent Evidence Scan present | Pass with persistence bug |
| Manual Assessment 81 questions | Pass |
| Dashboard command center | Pass |
| Report Preview | Pass |
| Integrations disabled | Pass |
| Logo/BETA branding | Pass pending browser visual check |
| Tests | Pass |
| TypeScript | Pass |
| Build | Pass |
| Lint | Fail due `backend/.venv` scan |

## 20. MVP Readiness Checklist

| Item | Status |
|---|---|
| Organization model | Partial |
| Explicit profile completion | Missing |
| Organization-owned assessment sessions | Partial |
| Organization-owned assessment responses | Partial |
| Organization-owned assessment results | Partial |
| Organization-owned Agent scans | Broken by frontend `organizationId` drop |
| Dashboard persisted source of truth | Partial |
| Report persisted source of truth | Partial |
| RLS hardened and tested | Partial |
| Lint/build/test clean | Failing due lint |

## 21. Pilot Readiness Checklist

| Item | Status |
|---|---|
| Tenant isolation verified | Not ready |
| RLS policy tests | Missing |
| Durable evidence history | Partial |
| Audit logs implemented and tested | Partial |
| Admin/member management | Missing |
| Monitoring/observability | Missing |
| Data retention/deletion policy | Missing |
| Support runbook | Missing |
| Security review clean | Partial |

## 22. Production Readiness Checklist

| Item | Status |
|---|---|
| No wildcard production CORS | Pass |
| No anonymous production persisted evaluation | Mostly pass |
| No anonymous production Agent scan | Mostly pass |
| No service role key in browser code | Pass by code inspection |
| Secrets excluded from repo/deploy | Partial; not a Git repo, `.dev.vars` generated |
| Distributed rate limiting | Missing |
| Tenant isolation tests | Missing |
| Deployment artifact guardrails | Missing |
| Backups/DR | Missing |
| Monitoring/alerts | Missing |

## 23. Recommended Roadmap

### Fix now

- Forward `organizationId` into backend Agent scan calls.
- Add explicit `profile_completed` to organizations and stop inferring completion.
- Exclude `backend/.venv` and generated dependency folders from ESLint/repo hygiene.
- Replace raw-evidence attachment wording.
- Update README and demo script persistence wording.

### Next 48 hours

- Make authenticated dashboard/report/scan prefer persisted backend data over localStorage.
- Harden Supabase RLS helper functions.
- Add focused persistence tests for organization membership, response saves, result hashes, and Agent scan persistence.
- Regenerate/update Supabase TypeScript types for new tables.

### Before next demo

- Clean localStorage and run a full controlled demo with backend running.
- Verify logo sizing in browser.
- Confirm Agent scan persists after organization forwarding is fixed.
- Confirm stale assessment result is not shown as final.

### Before MVP

- Deprecate or migrate legacy user-owned tables.
- Make localStorage fallback development-only and visibly labeled.
- Add report snapshot read path.
- Add audit log tests.

### Before pilot

- Add member/role management.
- Add RLS tests and cross-organization access tests.
- Add monitoring and operational logs.
- Add retention/deletion/export policy.

### Later

- Abstract framework model for NIST CSF, SOC 2, GDPR, HIPAA, and local frameworks.
- Implement real integrations only after persistence is stable.
- Implement PDF export only after report snapshots are durable.

## 24. Final Priority List

1. Fix Agent scan `organizationId` forwarding.
2. Add `profile_completed` and correct onboarding source of truth.
3. Exclude `backend/.venv` from lint/tooling and restore lint gate.
4. Make persisted data authoritative for authenticated dashboard/report/scan.
5. Harden Supabase RLS helper functions.
6. Replace raw-evidence wording.
7. Update README and demo script.
8. Add persistence/organization access tests.
9. Regenerate Supabase types for new persistence tables.
10. Deprecate or migrate legacy Supabase tables.

## 25. Final Verdict

- Prototype: yes, but beyond prototype quality.
- Controlled demo-ready: yes, with caveats.
- MVP-ready: no.
- Pilot-ready: no.
- Production-ready: no.

Averonix is credible for a controlled demo, but the current repository is not clean enough for MVP readiness. The next practical milestone is narrow: repair organization-owned persistence, make backend/Supabase authoritative for authenticated users, restore the lint gate, and prove the source-of-truth behavior with tests.
