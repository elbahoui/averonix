# Averonix Defensive Engineering Audit Report

Date: 2026-05-13

Scope: Local repository inspection only. No penetration testing, brute force, exploitation, aggressive scanning, or third-party target testing was performed. Existing verification commands were run locally. Environment files were not read or printed.

## 1. Executive Summary

Averonix is beyond a rough prototype and is suitable for a controlled demo with caveats. The core user journey is present: landing, auth, onboarding, Agent Evidence, Manual Assessment D1-D9, Dashboard, Report Preview, and a clearly disabled Integrations area. The product has also moved toward MVP foundations with Supabase organization persistence and backend authentication work.

The strongest parts are the Manual Assessment model, the safe compliance wording, the improved dashboard/sidebar command-center structure, the grouped Agent Evidence presentation, the disabled integrations posture, and the passing test/build gates.

The main risks are now source-of-truth and ownership issues rather than UI polish. Agent scan persistence is currently blocked by a frontend path that drops `organizationId`; onboarding completion can be inferred too early from an organization record; localStorage can still seed dashboard/report state before backend data arrives; persistence tests are not yet deep enough for MVP confidence; and Supabase RLS helper functions should be tightened before pilot use.

Final classification: controlled demo-ready with caveats. Not MVP-ready, not pilot-ready, and not production-ready.

## 2. Current Progress Score

| Area | Score | Notes |
|---|---:|---|
| Frontend | 78 | Strong route coverage and UX polish, but source precedence still leans on localStorage in key screens. |
| Backend | 76 | FastAPI structure, auth, validation, CORS, and safety checks are good; persistence path needs more end-to-end hardening. |
| Agent Evidence | 72 | Good safety posture and clear external-signal framing; frontend drops `organizationId` before backend call. |
| Manual Assessment | 84 | 81-question D1-D9 model, validation, stale invalidation, and backend scoring are strong. |
| Dashboard | 84 | Command-center layout is now clear and executive-friendly. |
| Report Preview | 78 | Honest preview tied to assessment result; still needs stronger persisted-source handling. |
| Integrations | 88 | Correctly disabled and positioned as future Integration Evidence. |
| Branding | 82 | Logo assets and BETA component are present; visual verification still needed in browser. |
| Compliance wording | 88 | Strong disclaimer and no confirmed certification claims in reviewed product copy. |
| Security | 70 | Good defensive controls, but RLS helper hardening and production source-of-truth issues remain. |
| UX | 80 | Clearer sidebar and KPI hierarchy; remaining gaps are mainly state messaging and first-load local cache behavior. |
| Data persistence | 62 | Supabase persistence model exists, but not yet reliable enough to be the only source of truth. |
| Documentation | 68 | Useful setup docs exist, but they are stale after the persistence work. |
| Production readiness | 45 | Production auth, tenancy, persistence, deployment secret handling, and observability need more work. |
| Overall MVP readiness | 69 | Close to MVP foundation, but not ready until persistence and ownership bugs are fixed. |

## 3. Product Completeness Review

The controlled demo flow is mostly complete:

- Landing page explains ISO/IEC 27001 readiness with safe wording.
- Login/register pages exist and use Supabase/Lovable auth helpers.
- Onboarding exists and creates/saves company/organization context.
- Agent Evidence Scan exists, calls the backend when configured, and has limited fallback behavior.
- Manual Assessment exists with D1-D9 and 81 questions.
- Dashboard reads assessment, Agent, company, and report state.
- Report Preview reads real assessment result state and avoids fake PDF export.
- Integrations are placeholder-only and disabled.

Current classification:

- Prototype: yes, but evolved beyond prototype quality.
- Controlled demo-ready: yes, with caveats.
- MVP-ready: no.
- Pilot-ready: no.
- Production-ready: no.

Primary blockers to MVP are durable source-of-truth consistency, organization-bound data access, deeper persistence tests, and removal of localStorage as an authenticated source of truth.

## 4. Dashboard & Sidebar UX Review

The dashboard now matches the expected command-center structure. `src/routes/dashboard.tsx` includes a compact header, KPI strip, Current Readiness State, Evidence Sources, Next Best Actions, Domain Readiness Map, Report Preview, Company Context, and development-only Demo diagnostics. `src/components/layout/DashboardShell.tsx` uses the requested controlled-demo sidebar structure:

- Overview: Home, Starter guide
- Readiness: Manual assessment, Agent evidence, Readiness report
- Program: Controls, Evidence, Policies marked Soon
- Workspace: Company, Integrations, Settings marked Soon

The dashboard correctly separates Manual Assessment from Agent Evidence. Agent score is not used as the Manual Readiness Score. Integrations are clearly future-facing. The `Starter guide` link targets `#next-best-actions`, and that anchor exists in the dashboard.

Dashboard UX score: 84/100.

Recommended improvements:

- Keep localStorage-derived data visibly labeled when backend/persisted data is unavailable.
- Avoid showing old local results on authenticated screens before persisted state resolves.
- Consider making the logo in the app shell non-navigational or route it to `/dashboard` for authenticated users.
- Keep DEV diagnostics collapsed and visually internal only.

## 5. Manual Assessment Review

The Manual Assessment implementation is one of the stronger modules.

Confirmed by code/tests:

- Supported sectors load 81 questions.
- Sector normalization exists for labels such as SaaS / Software, E-commerce, and Healthtech.
- Backend question endpoint supports `GET /api/assessment/questions?sector=saas`.
- Backend evaluation rejects incomplete final submissions.
- Backend validates question IDs, domain IDs, maturity levels, evidence confidence values, and evidence note length.
- Duplicate responses are deduplicated by `questionId`.
- Local response edits invalidate local results.
- Persisted session APIs exist.
- Persisted evaluation stores response hash and immutable result snapshot.

Trust issues:

- `src/lib/api.ts` still contains recommendation wording that can imply raw evidence upload. Prefer "Track stronger evidence references..." to match product safety language.
- Authenticated screens can still seed state from localStorage before persisted data is loaded.
- Persistence behavior needs end-to-end tests beyond route-level mocks.

Manual Assessment score: 84/100.

## 6. Agent Evidence Review

Agent Evidence is framed correctly as external technical signal evidence only. The backend checks DNS/TLS/HTTP headers/email security and keeps exposed services as policy `not_checked`. The backend does not perform port scanning.

Positive findings:

- `backend/app/security.py` rejects forbidden schemes, localhost, private/reserved IPs, internal TLDs, and resolved private addresses.
- `backend/app/agent/headers_checks.py` uses `follow_redirects=False`, reducing redirect SSRF risk.
- `backend/app/api/agent_routes.py` includes rate limiting, a request timeout, structured logging, generic server errors, and production auth/organization checks.
- Frontend UI includes backend status and external-signal-only language.
- Mapped evidence grouping is implemented so repeated mapped questions are not displayed as duplicate readiness rows.

Major issue:

- `src/routes/scan.tsx` passes `organizationId` into `runAgentScan`, but `src/lib/agent/agent-engine.ts` drops that field when calling `runBackendAgentScan`. In production, `backend/app/api/agent_routes.py` requires `organizationId`; therefore authenticated production Agent scans will fail or will not persist.

Agent module score: 72/100.

## 7. Report Preview Review

The Report Preview page is honest and demo-usable. It avoids fake PDF generation and positions output as a readiness preview, not a certification report. It shows assessment metadata, domain breakdown, critical gaps, recommendations, and disclaimer-style wording when result data exists.

Positive findings:

- Empty state exists when no assessment result is available.
- Stale/re-evaluation state is considered.
- Report wording avoids certification claims.
- Mobile layout has been made responsive with stacked/grid behavior rather than fixed-width rows.

Remaining risk:

- `src/routes/report.tsx` initializes from localStorage before attempting persisted result loading. In production, authenticated report state should prefer backend/Supabase and treat localStorage as fallback only when explicitly allowed.

Report Preview score: 78/100.

## 8. Landing Page & Copy Review

The landing page positioning is mostly safe and professional:

- "Security readiness made simple" positioning is present.
- ISO/IEC 27001 readiness is described as readiness/gap analysis.
- 81 guided questions and 9 readiness domains are used.
- No raw sensitive data language is present.
- The footer disclaimer is safe.
- The dashboard mockup is presented as sample/demo rather than live customer truth.

No confirmed unsafe landing copy was found for:

- ISO certified
- official ISO approval
- guaranteed compliance
- full compliance
- certification ready
- audit guaranteed
- auditor replacement
- old 30-question / 6-domain positioning

Strategic note: the brand is still heavily ISO/IEC 27001-led. That is fine for the current product, but future framework expansion should introduce a framework-agnostic vocabulary such as "security readiness program", "framework mapping", and "evidence sources" without reducing current ISO/IEC clarity.

Compliance wording score: 88/100.

## 9. Branding / Logo Review

Expected logo assets exist:

- `public/brand/logo-horizontal.svg`
- `public/brand/logo-icon.svg`
- `public/brand/logo-monochrome.svg`
- `public/brand/logo-horizontal-dark.svg`
- `public/brand/apple-touch-icon.png`

Code inspection found:

- SVGs are vector-based and do not contain embedded raster `<image>` tags.
- SVGs do not contain baked background rectangles.
- ViewBoxes are reasonably cropped around the visible logo.
- `src/components/brand/Logo.tsx` supports variants, sizes, `showBeta`, `className`, and `imgClassName`.
- BETA is separate HTML/CSS, not baked into the SVG.
- Favicon and Apple touch icon are configured.

Remaining checks:

- Visual browser verification is still needed for actual perceived size in navbar/sidebar/footer.
- `Logo` is always wrapped in a link to `/`; in authenticated shell usage this can navigate users out of the app. That is UX friction, not a security issue.

Branding readiness score: 82/100.

## 10. Integrations Review

The Integrations page behaves correctly for the current product state.

Confirmed:

- Microsoft 365, Google Workspace, GitHub, Cloudflare, and AWS/Azure are represented as planned/disabled.
- Buttons are disabled and labeled Coming Soon.
- The page does not implement OAuth or request tokens.
- Copy says Integration Evidence will be available later.
- Planned checks are neutral/planned, not presented as passing evidence.

Integrations score: 88/100.

## 11. Defensive Security Review

Frontend:

- No service-role key was found in the client build.
- `SUPABASE_SERVICE_ROLE_KEY` appears in server-only Supabase code and backend config.
- No dangerous user-content `dangerouslySetInnerHTML` was found; shadcn chart uses it for generated style injection from local chart config.
- localStorage parsing utilities are defensive.
- Raw sensitive files are not part of the current evidence model.

Backend:

- Production CORS fails closed when `ALLOWED_ORIGINS` is missing or wildcard.
- Agent target validation rejects unsafe schemes, localhost, internal TLDs, private/reserved IPs, and private resolved addresses.
- Agent route has rate limiting, timeout, generic exception response, and logging.
- Assessment API validates completeness and allowed values.
- Production auth is required for protected persisted paths.

Security concerns:

- Supabase RLS helper functions in `supabase/migrations/20260513203000_mvp_organizations_persistence.sql` accept a `uid` parameter and are granted to authenticated users. Because they are `SECURITY DEFINER`, this should be tightened to prevent role/membership inference or future policy misuse.
- The production Agent API key fallback code exists, but current route flow still returns authentication required after `_check_api_key`. Decide whether API key is a real auth mode or remove it to avoid false assumptions.
- The repository directory is not a Git repository, so tracked/staged secret status could not be verified. `.env` exists locally and was not read.

Security score: 70/100.

## 12. Supabase & Persistence Review

Current state:

- New organization-owned tables exist for organizations, members, assessment sessions, responses, results, agent scans, report snapshots, and audit logs.
- Existing older user-owned tables also remain, including `assessment_answers`, `scans`, and `integrations`.
- Backend persistence helpers exist in `backend/app/persistence.py`.
- Frontend persistence helpers exist under `src/lib/org/`, `src/lib/assessment/api.ts`, `src/lib/agent/api.ts`, and `src/lib/report/api.ts`.

Key risks:

- Organizations are now treated as source of truth, but onboarding completion is inferred from organization existence.
- localStorage remains a competing source for dashboard, report, and scan pages.
- Legacy tables remain and should be explicitly deprecated or migrated.
- No dedicated persistence test suite was found for organization/membership/RLS behavior.

Recommended migration path:

1. Make organizations the explicit source of truth with `profile_completed` or equivalent.
2. Move assessment responses/results to Supabase for authenticated users.
3. Move Agent scan history to Supabase for authenticated users.
4. Create immutable report snapshots from assessment result snapshots.
5. Add audit logs for meaningful workspace events.
6. Keep localStorage only as dev/offline draft cache with visible labeling.

Data persistence score: 62/100.

## 13. Tests / Build Verification

Commands run locally:

- `npm run test`: passed, 8 test files, 30 tests.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with 7 React Fast Refresh warnings.
- `npm run build`: passed.
- `python -m pytest backend`: passed, 34 tests.

Lint warnings are limited to React Fast Refresh `only-export-components` warnings in layout/UI component files and do not block the controlled demo.

Build note:

- `npm run build` reports `Using secrets defined in .env` and emits `dist/server/.dev.vars`. This file is ignored by `.gitignore`, but because this directory is not a Git repository, tracked/staged status could not be verified.

Safe endpoint verification:

- Existing backend tests cover health, assessment question count, incomplete assessment rejection, private target rejection, production CORS behavior, generic Agent 500 error behavior, production Agent auth rejection, and response hash behavior.
- No public target scanning was performed.

## 14. Documentation Review

`README.md` exists and covers requirements, environment setup, backend setup, frontend setup, verification commands, demo URL, deployment caveat, and disclaimer.

`docs/demo-script.md` exists and covers opening statement, flow, safety wording, prohibited claims, and demo limitations.

Documentation issue:

- Both README and demo script still say local demo evidence uses localStorage persistence. That was accurate before the MVP persistence phase, but now incomplete. Docs should explain that authenticated workspace data is moving to Supabase, while localStorage remains only demo/offline fallback.

Documentation score: 68/100.

## 15. Critical Issues

### 15.1 Agent scan persistence drops `organizationId`

Severity: Critical for MVP persistence; High for controlled demo.

File/location:

- `src/routes/scan.tsx:121`
- `src/lib/agent/agent-engine.ts:84`
- `backend/app/api/agent_routes.py:86`

Impact:

The Scan route passes `organizationId` into `runAgentScan`, but `runAgentScan` does not forward it to `runBackendAgentScan`. Production backend requires `organizationId`, and persistence only occurs when user and organization are present. This can break authenticated production Agent scans and prevent dashboard Agent Evidence from loading persisted organization scans.

Recommended fix:

Forward `organizationId: input.organizationId` into `runBackendAgentScan`.

Test to confirm:

Add a frontend unit test that `runAgentScan` calls the backend client with `organizationId`, plus a backend route test that authenticated Agent scan with organization membership persists the result.

### 15.2 Onboarding completion is inferred from organization existence

Severity: Critical for workspace correctness; High for controlled demo.

File/location:

- `src/routes/onboarding.tsx:216`
- `src/lib/org/api.ts:25`
- `src/lib/storage.ts:60`
- `src/components/layout/DashboardShell.tsx:82`

Impact:

Onboarding can save interim company data with `completed=false`. Later, `getCurrentOrganization()` maps any organization to `onboardingCompleted: true`. A partially completed onboarding flow can therefore be treated as completed, and dashboard access/state can become misleading.

Recommended fix:

Add an explicit organization profile completion field or preserve the legacy company completion state until migration is complete. Do not infer completion from organization existence.

Test to confirm:

Create an onboarding regression test where an organization exists but profile-required fields are incomplete; the app should still route to onboarding or show profile incomplete.

## 16. High Issues

### 16.1 Supabase RLS helper functions accept arbitrary user IDs

Severity: High.

File/location:

- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql:26`
- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql:40`
- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql:53`

Impact:

`SECURITY DEFINER` helpers accept a `uid` argument and are executable by authenticated users. This may allow membership/role inference and creates an authorization footgun for future policies.

Recommended fix:

Remove public `uid` parameters or enforce `uid = auth.uid()` inside the function. Revoke direct execute where possible and use internal helpers for policy-only checks.

Test to confirm:

Add Supabase policy tests or SQL tests that a user cannot infer another user's membership or role by calling helper functions.

### 16.2 Authenticated screens still prefer localStorage during initial load

Severity: High.

File/location:

- `src/routes/dashboard.tsx:115`
- `src/routes/report.tsx:40`
- `src/routes/scan.tsx:67`
- `src/lib/api.ts:343`

Impact:

Old localStorage data can briefly or permanently appear if backend/Supabase loading fails. That undermines the source-of-truth transition and can show stale readiness results as if they were current.

Recommended fix:

For authenticated users, prefer backend/Supabase first. Use localStorage only when backend is unavailable in development or explicitly labeled as local fallback.

Test to confirm:

Add tests proving persisted backend state overrides localStorage and that production mode does not silently show local final results.

### 16.3 Persistence coverage is not deep enough for MVP

Severity: High.

File/location:

- `backend/tests/`
- `src/lib/assessment/api.test.ts`

Impact:

Current tests pass, but persistence is mostly validated through route-level mocks. There is no dedicated persistence test suite for organization membership, viewer write restrictions, stale hash exclusion, or Agent scan persistence behavior with realistic data mappings.

Recommended fix:

Add backend tests for org access, viewer restrictions, response upsert, result snapshot immutability, stale hash behavior, and Agent scan persistence. Add frontend tests for backend-source precedence.

Test to confirm:

Run `python -m pytest backend` and `npm run test` with the new tests.

### 16.4 Documentation is stale after persistence work

Severity: High for handoff; Medium for demo.

File/location:

- `README.md:75`
- `docs/demo-script.md:39`

Impact:

Docs still state that local demo evidence uses localStorage persistence. That is now incomplete and can mislead the next engineer or demo operator about the intended source of truth.

Recommended fix:

Update docs to state: authenticated workspace data uses Supabase/FastAPI where configured; localStorage is dev/offline fallback cache only.

Test to confirm:

Have another developer run the app from docs and confirm they understand which data source is authoritative.

## 17. Medium Issues

### 17.1 Legacy Supabase tables remain beside organization-owned tables

Severity: Medium.

File/location:

- `supabase/migrations/20260509223621_28aad75f-747a-4dc2-955d-fae8a1447b64.sql`
- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql`

Impact:

Older user-owned tables such as `assessment_answers` and `scans` remain beside new organization-owned tables. This creates future source-of-truth confusion.

Recommended fix:

Mark legacy tables deprecated, migrate data, and either remove them in a later migration or link them to organization ownership.

### 17.2 Persisted Agent risk mapping can produce inconsistent legacy fields

Severity: Medium.

File/location:

- `backend/app/persistence.py:468`
- `src/lib/agent/types.ts`

Impact:

Persisted rows can use `insufficient_evidence` for both `riskInterpretation` and legacy `riskLevel`. Older frontend paths may expect risk level to be one of critical/high/medium/low/minimal.

Recommended fix:

Map `riskInterpretation` to a legacy `riskLevel` using the same frontend mapping logic.

### 17.3 Production API key logic is unclear

Severity: Medium.

File/location:

- `backend/app/api/agent_routes.py:61`
- `backend/app/api/agent_routes.py:83`

Impact:

The API key is checked when no production user exists, but the route still returns authentication required. This is fine if auth is mandatory, but confusing if API key is intended as a temporary production bypass.

Recommended fix:

Decide one mode: auth-only with organization membership, or API-key-only for a narrow internal mode. Remove dead/ambiguous behavior.

### 17.4 Build emits server secret artifact

Severity: Medium.

File/location:

- `dist/server/.dev.vars`
- `.gitignore`

Impact:

The build emits `.dev.vars` from `.env`. It is ignored, but accidental packaging/deployment of this file would be serious.

Recommended fix:

Add a CI/deployment guard to fail if `.dev.vars` is included in deploy artifacts. Never read or print it in logs.

### 17.5 Recommendation wording implies raw evidence attachment

Severity: Medium.

File/location:

- `src/lib/api.ts:322`
- `backend/app/assessment/scoring.py:163`

Impact:

Raw-evidence attachment wording conflicts with the safer "track evidence references, not raw sensitive data" product posture.

Recommended fix:

Replace with "Track stronger evidence references to raise confidence above 60%."

## 18. Low Issues / Polish

- React Fast Refresh warnings remain in shared UI component files. They do not block demo, but can be cleaned later.
- `src/components/brand/Logo.tsx` always links to `/`; in the authenticated shell, `/dashboard` may be a better destination.
- `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` for style injection. It is acceptable while chart config is developer-controlled.
- Generated Python `__pycache__` files appear in the repository tree. Because this is not a Git repo, tracked status cannot be confirmed. Keep them out of source archives.
- PowerShell output displayed mojibake for valid UTF-8 punctuation in some files, but source-level codepoint checks did not confirm actual broken characters in the reviewed project files.

## 19. Demo Readiness Checklist

| Item | Status |
|---|---|
| Landing page safe and clear | Pass |
| Auth pages present | Pass |
| Onboarding present | Pass with caveat |
| Agent Evidence Scan present | Pass with persistence bug |
| Manual Assessment D1-D9 present | Pass |
| 81 questions load | Pass |
| Dashboard command center present | Pass |
| Report Preview present | Pass |
| Integrations disabled / Coming Soon | Pass |
| Compliance wording safe | Pass |
| Build/test gates pass | Pass |
| LocalStorage stale-data risk controlled | Partial |

## 20. MVP Readiness Checklist

| Item | Status |
|---|---|
| Organization model | Partial |
| Authenticated backend APIs | Partial |
| Organization-bound assessment persistence | Partial |
| Organization-bound Agent scan persistence | Failing due frontend `organizationId` drop |
| Dashboard backend source of truth | Partial |
| Report backend source of truth | Partial |
| Stale hash detection | Partial |
| RLS hardened | Partial |
| Persistence tests | Partial |
| Documentation up to date | Failing |

## 21. Pilot Readiness Checklist

| Item | Status |
|---|---|
| Stable tenant isolation | Not ready |
| Supabase RLS verified | Not ready |
| Production auth fully enforced | Partial |
| Durable assessment/scan history | Partial |
| Audit logging implemented and tested | Partial |
| Operational monitoring | Missing |
| Data retention/export policy | Missing |
| Customer support/admin workflow | Missing |
| Security review complete | Partial |
| Legal/compliance disclaimers stable | Mostly ready |

## 22. Production Readiness Checklist

| Item | Status |
|---|---|
| No anonymous production scans | Mostly ready |
| No wildcard production CORS | Pass |
| No service role in frontend | Pass from build scan |
| Secrets not deployed in artifacts | Needs CI guard |
| Tenant isolation tested | Not ready |
| RLS helper hardening | Not ready |
| Observability and alerting | Missing |
| Rate limit persistence/distributed limits | Missing |
| Backups and disaster recovery | Missing |
| Security incident process | Missing |

## 23. Recommended Roadmap

### Fix now

- Forward `organizationId` from `runAgentScan` to `runBackendAgentScan`.
- Fix onboarding completion so organization existence does not imply completed onboarding.
- Update README and demo script to explain Supabase persistence versus local fallback.
- Replace raw-evidence attachment wording with evidence-reference wording.

### Next 48 hours

- Harden Supabase RLS helper functions.
- Make authenticated dashboard/report prefer persisted backend data before localStorage.
- Add persistence-focused tests for assessment sessions, responses, results, and Agent scans.
- Clarify or remove temporary production API key behavior.

### Before next demo

- Visually verify logo sizing and footer/sidebar contrast in browser.
- Run the full demo flow with a clean localStorage state and backend running.
- Confirm Agent scan persistence after the `organizationId` fix.
- Confirm stale assessment result behavior across dashboard and report.

### Before MVP

- Deprecate or migrate legacy Supabase tables.
- Make localStorage an explicit development/offline cache only.
- Add report snapshot read/write flow.
- Add audit log tests and a basic audit log viewer/admin path if needed.

### Before pilot

- Add tenant isolation tests against Supabase policies.
- Add organization member management flows.
- Add operational logging/monitoring.
- Add data retention, deletion, export, and backup policies.
- Add customer-facing privacy/security documentation.

### Later

- Add multi-framework abstraction for NIST CSF, SOC 2, GDPR, HIPAA, and local frameworks.
- Add real integrations after the evidence model is stable.
- Add PDF export only after report snapshots are durable and trusted.

## 24. Final Priority List

1. Fix Agent scan `organizationId` forwarding.
2. Fix onboarding completion/source-of-truth behavior.
3. Harden Supabase RLS helper functions.
4. Make persisted backend data authoritative for authenticated dashboard/report.
5. Add persistence and organization access tests.
6. Update README and demo script for the new persistence model.
7. Clarify production Agent auth/API-key behavior.
8. Deprecate or migrate legacy Supabase tables.
9. Add CI guard for `.env`/`.dev.vars` deployment artifacts.
10. Replace evidence wording that implies raw attachment.

## 25. Final Verdict

- Prototype: yes, but stronger than a prototype.
- Controlled demo-ready: yes, with caveats.
- MVP-ready: no.
- Pilot-ready: no.
- Production-ready: no.

Averonix is credible for a controlled demo if the operator knows the caveats and the backend is running. It is not yet an MVP because organization-bound persistence is present but not fully reliable, localStorage still competes with persisted state, and tenant isolation/persistence tests are not strong enough. The next engineering phase should be narrow: make authenticated workspace data the source of truth and prove it with tests.
