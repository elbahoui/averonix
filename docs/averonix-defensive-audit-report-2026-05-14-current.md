# Averonix Defensive Engineering Audit Report

Date: 2026-05-14
Scope: local repository inspection only
Method: defensive code review, configuration review, documentation review, and local test/build verification

No penetration testing, brute force, destructive testing, aggressive scanning, or third-party system testing was performed.

## 1. Executive Summary

Averonix is currently a strong controlled-demo product with a mostly coherent ISO/IEC 27001 readiness flow: landing, auth, onboarding, Agent Evidence Scan, Manual Assessment, dashboard, report preview, integrations placeholder, logo branding, and demo documentation are all present.

Overall health is improved compared with a pure prototype. The recent MVP foundation work added organization-owned persistence tables, FastAPI auth helpers, Supabase service-role persistence, profile completion state, stale result hashing, and persisted Agent/assessment APIs. However, the product is still not MVP-ready because production-grade data-source enforcement, deployment secret handling, real Supabase integration validation, and operational security controls are not yet fully proven.

Main strengths:
- Manual Assessment model is coherent: D1-D9, 81 questions, backend validation, evidence confidence, stale-result invalidation, and backend-first evaluation.
- Agent Evidence is clearly framed as external technical signals only and has defensive target validation.
- Dashboard and sidebar now present a credible command-center style with clear separation between Manual Assessment, Agent Evidence, Integration Evidence, and Report Preview.
- Compliance wording is mostly safe: the app does not claim certification, ISO approval, guaranteed compliance, or auditor replacement.
- Build, TypeScript, frontend tests, backend tests, and lint all pass in this local review.

Main risks:
- Build tooling materializes local secrets into `dist/server/.dev.vars`; it is ignored by git patterns, but it is still a high-risk deploy artifact if packaging is mishandled.
- Authenticated source-of-truth behavior is improved but still has legacy/local fallback paths that need stricter production enforcement and more tests.
- Supabase service-role persistence bypasses RLS by design, so backend authorization correctness becomes critical.
- Production readiness is not proven with a real Supabase environment, real migrations applied, production auth tokens, or deployment CORS/auth configuration.
- No browser/mobile visual pass was run in this audit, so responsive UI claims are based on code inspection and prior implementation, not live screenshots.

Final classification: controlled demo-ready with caveats; not MVP-ready, not pilot-ready, and not production-ready.

## 2. Current Progress Score

| Area | Score | Rationale |
| --- | ---: | --- |
| Frontend | 78 | Good route coverage, safe copy, persisted-data APIs added; still has fallback complexity. |
| Backend | 76 | Auth, persistence, validation, and safety checks exist; production behavior needs integration validation. |
| Agent Evidence | 74 | Safe target validation and org persistence path exist; rate limiting and production auth are not production-grade. |
| Manual Assessment | 82 | Strongest module: 81 questions, validation, scoring, persistence, stale hash. |
| Dashboard | 84 | Clear command-center UX with KPIs, evidence sources, domain map, and source labels. |
| Report Preview | 76 | Real-result driven, safe wording, PDF disabled; report snapshots are not used yet. |
| Integrations | 72 | Clearly coming soon and disabled; still only placeholder value. |
| Branding | 82 | Logo assets and BETA component exist; live visual sizing was not browser-verified in this pass. |
| Compliance wording | 86 | Generally safe and consistent; historical audit docs contain prohibited terms only as review context. |
| Security | 67 | Better than demo baseline, but production controls and secret-artifact handling need work. |
| UX | 80 | Dashboard and nav are significantly clearer; mobile needs live verification. |
| Data persistence | 62 | MVP foundation exists, but fallback/source-of-truth rules need stricter production gates. |
| Documentation | 74 | README and demo script exist; architecture and production operations docs are still thin. |
| Production readiness | 45 | Not ready: secret artifacts, no production auth/CORS validation, no operational controls. |
| Overall MVP readiness | 68 | Foundation started but not enough for real customer pilot. |

## 3. Product Completeness Review

Observed pages and modules:
- Landing page: `src/routes/index.tsx`
- Login/register: `src/routes/login.tsx`, `src/routes/register.tsx`
- Onboarding: `src/routes/onboarding.tsx`
- Dashboard: `src/routes/dashboard.tsx`
- Agent scan: `src/routes/scan.tsx`
- Manual assessment: `src/routes/assessment.tsx`
- Report preview: `src/routes/report.tsx`
- Integrations: `src/routes/integrations.tsx`
- App shell: `src/components/layout/DashboardShell.tsx`

Core controlled-demo flow is present:
1. Landing explains Averonix as readiness and gap analysis.
2. Register/login routes exist through Supabase/Lovable auth helpers.
3. Onboarding stores company/organization context.
4. Agent Evidence Scan runs backend-first and can persist when organization context exists.
5. Manual Assessment loads 81 questions for supported sectors and can autosave/evaluate.
6. Dashboard consumes persisted data first when organization context exists.
7. Report Preview uses the latest valid assessment result and does not generate fake reports.
8. Integrations are presented as coming soon.

Missing for MVP:
- Real end-to-end Supabase environment verification with migrations applied.
- Organization/member management UI beyond the basic current organization path.
- Durable report snapshot usage in `/report`.
- Production deployment runbook and artifact hygiene controls.
- Strong production rate limiting and monitoring.
- Browser/mobile regression checks.

Product state:
- Prototype: yes.
- Controlled demo-ready: yes, with caveats.
- MVP-ready: no.
- Pilot-ready: no.
- Production-ready: no.

## 4. Dashboard & Sidebar UX Review

Reviewed files:
- `src/routes/dashboard.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/components/brand/Logo.tsx`

The sidebar now matches the controlled-demo structure closely:
- Overview: Home, Starter guide
- Readiness: Manual assessment, Agent evidence, Readiness report
- Program: Controls, Evidence, Policies as Soon
- Workspace: Company, Integrations, Settings as Soon where applicable

Dashboard sections observed:
- Command center header
- KPI cards
- Manual Readiness Score
- Assessment Progress
- Agent Evidence
- Critical Gaps
- Current Readiness State
- Evidence Sources
- Next Best Actions
- Domain Readiness Map D1-D9
- Report Preview
- Company Context
- DEV-only Demo diagnostics

Positive findings:
- Manual Assessment is visually and semantically the primary readiness source.
- Agent Evidence is labeled as external technical signals and is not used as full readiness.
- Integrations are clearly coming soon.
- Dashboard source labels distinguish workspace-saved data from local development fallback.
- Sidebar is shorter and no longer exposes too many unfinished modules.

Remaining UX risks:
- Mobile layout was not browser-tested in this audit.
- The app still contains multiple fallback states; users may need clearer failure copy when authenticated persistence fails.
- The logo/BETA sizing appears correctly implemented in code, but live visibility was not screenshot-verified.

Dashboard UX score: 84/100.

Concrete improvements:
- Add one browser screenshot regression for desktop and mobile dashboard.
- In authenticated mode, make persisted-save failures more explicit before navigating away from assessment completion.
- Keep diagnostics collapsed and internal-only.

## 5. Manual Assessment Review

Reviewed files:
- `src/routes/assessment.tsx`
- `src/lib/assessment/api.ts`
- `src/lib/assessment/storage.ts`
- `src/lib/assessment/questions.ts`
- `src/lib/sector.ts`
- `backend/app/api/assessment_routes.py`
- `backend/app/assessment/questions_loader.py`
- `backend/app/assessment/scoring.py`
- `backend/app/data/assessment_questions.json`

Question model:
- D1-D9 domains are present.
- Verified by local JSON inspection: each domain has 6 core questions and 3 sector-specific questions for SaaS, ecommerce, and healthcare.
- Verified SaaS total: 81 questions.

Validation:
- `maturityLevel` is restricted to 0, 1, 2, 3.
- `evidenceConfidence` is restricted to 0, 0.3, 0.6, 1.
- Final evaluation rejects incomplete responses.
- Evidence notes have a max length check in backend scoring.
- Duplicate question responses are reduced to one latest value during validation/evaluation.

Persistence behavior:
- Frontend creates/loads an active persisted session when authenticated organization context exists.
- Responses autosave locally and then to the persisted backend path when available.
- Persisted evaluation uses `organizationId` and `sessionId`.
- Backend stores immutable result snapshots with `response_hash`.
- Editing responses after completion marks session stale.
- Latest result returns stale metadata if the current response hash no longer matches.

Trust issues:
- `src/routes/assessment.tsx` still has a fallback path that can save local results if persisted evaluation fails. Dashboard/report are designed to prefer persisted data, but the assessment completion UX should fail closed outside development for authenticated users.
- There is no browser-level test confirming submit disabled/enabled behavior after persisted session load.

Manual Assessment score: 82/100.

## 6. Agent Evidence Review

Reviewed files:
- `src/routes/scan.tsx`
- `src/lib/agent/agent-engine.ts`
- `src/lib/agent/api.ts`
- `src/lib/agent/storage.ts`
- `src/lib/api.ts`
- `backend/app/api/agent_routes.py`
- `backend/app/security.py`
- `backend/app/agent/*`

Positive findings:
- Frontend uses `VITE_API_BASE_URL` through `src/lib/api.ts`.
- `organizationId` is now forwarded end-to-end:
  - `scan.tsx`
  - `runAgentScan`
  - `runBackendAgentScan`
  - `POST /api/agent/scan`
- If workspace context is missing, scan UI shows: "Workspace context is missing. Please complete onboarding."
- Backend validates target domains and rejects unsafe schemes, localhost, private IPs, reserved IPs, internal TLDs, and public domains resolving to private IPs.
- Security headers checks use `follow_redirects=False`, reducing redirect-based SSRF risk.
- Agent limitations explicitly state that Agent Evidence is partial external technical signal evidence.
- Scan history is capped in localStorage fallback.

Expected checks covered by code:
- HTTPS / TLS
- DNS
- MX / SPF / DMARC / DKIM best effort
- Security headers
- Cookies
- Public exposure marked as policy-limited/not checked

Risks:
- Rate limiting is in-memory and per-process, suitable for local/demo but not production.
- Production API-key behavior appears to be fail-closed, but it is not a complete alternative to user auth. `_check_api_key` can pass, then unauthenticated production still raises 401. If API key was intended to permit service calls, behavior needs clarification.
- No production queueing, scan job isolation, or durable scan start/completion audit trail beyond best-effort persistence.

Agent Evidence score: 74/100.

## 7. Report Preview Review

Reviewed files:
- `src/routes/report.tsx`
- `src/lib/report/api.ts`
- `src/lib/assessment/api.ts`
- `src/lib/assessment/storage.ts`

Positive findings:
- Report shows empty state when no valid result exists.
- Persisted latest valid assessment result is preferred when organization context exists.
- Local result is only fallback when no organization exists or development fallback is active.
- Stale result state is surfaced as re-evaluation required.
- Report shows score, risk level, evidence confidence, sector, completion date, model version, question count, domain breakdown, critical gaps, and recommendations.
- PDF export is disabled.
- Copy says readiness preview, not certification report.

Gaps:
- `report_snapshots` table exists but `/report` does not use immutable report snapshots yet.
- Mobile responsive structure was not live-tested in browser.

Report Preview score: 76/100.

## 8. Landing Page & Copy Review

Reviewed files:
- `src/routes/index.tsx`
- `src/routes/__root.tsx`
- `README.md`
- `docs/demo-script.md`

Positive findings:
- Landing page positions Averonix around security readiness, ISO/IEC 27001 readiness, evidence confidence, and Moroccan SMEs.
- It uses 81 guided questions and 9 readiness domains.
- Dashboard mockup is labeled as sample/demo rather than live customer data.
- Footer disclaimer is explicit that Averonix is not a certification body.
- No user-facing certification, ISO approval, guaranteed compliance, or auditor-replacement claim was found in active landing copy.
- Lovable metadata is not present in the active app head; Lovable remains in integration code where needed.

Notes:
- Historical audit docs contain prohibited phrases as review context. This is acceptable, but plain grep searches will still find those phrases in documentation.
- The brand still focuses heavily on ISO/IEC 27001, which is appropriate for the current product but should be abstracted before adding NIST CSF, SOC 2, GDPR, HIPAA, or local regulatory frameworks.

Compliance wording score: 86/100.

## 9. Branding / Logo Review

Reviewed files:
- `public/brand/logo-horizontal.svg`
- `public/brand/logo-icon.svg`
- `public/brand/logo-monochrome.svg`
- `public/brand/logo-horizontal-dark.svg`
- `public/brand/apple-touch-icon.png`
- `src/components/brand/Logo.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/components/layout/DashboardShell.tsx`

Expected assets are present:
- `public/brand/logo-horizontal.svg`
- `public/brand/logo-icon.svg`
- `public/brand/logo-monochrome.svg`
- `public/brand/logo-horizontal-dark.svg`
- `public/brand/apple-touch-icon.png`

Positive findings:
- SVG files use vector paths and transparent backgrounds.
- No JPEG logo references were found in `src` or `public/brand`.
- `Logo.tsx` supports horizontal, icon, monochrome, and dark variants.
- `Logo.tsx` supports size variants including `sm`, `md`, `lg`, and `xl`.
- BETA is separate HTML/CSS, not baked into SVG assets.
- Root metadata configures favicon and Apple touch icon.

Limitations:
- This audit did not run a browser screenshot pass, so logo visibility is code-reviewed but not visually verified.
- SVG viewBoxes are cropped to visible artwork but not normalized to origin-zero coordinates. This is not inherently wrong, but future exports should preserve tight bounds.

Branding readiness score: 82/100.

## 10. Integrations Review

Reviewed file:
- `src/routes/integrations.tsx`

Positive findings:
- Integrations are clearly marked Coming Soon.
- Buttons are disabled.
- Microsoft 365, Google Workspace, GitHub, Cloudflare, and AWS/Azure are represented as planned/disabled.
- Page does not implement OAuth or active connection behavior.
- Copy frames integrations as future Integration Evidence.

Risk:
- Placeholder pages still need careful demo narration so users do not assume integrations exist today.

Integrations score: 72/100.

## 11. Defensive Security Review

Frontend:
- No frontend service-role key usage was found in browser client code.
- Browser Supabase client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Server-only Supabase service-role references are isolated in server/backend contexts.
- `dangerouslySetInnerHTML` was found in `src/components/ui/chart.tsx` for generated CSS variables. It is not directly rendering arbitrary user HTML, but it should remain config-controlled.
- localStorage parsing is guarded in storage helpers.
- Raw sensitive file storage is not implemented.

Backend:
- Production CORS rejects wildcard origins.
- Agent endpoint has in-memory rate limiting.
- Agent endpoint requires auth in production and fails closed without valid organization context.
- Unsafe target validation is implemented in `backend/app/security.py`.
- Generic Agent 500 errors do not expose raw exception text to clients.
- HTTP checks use timeouts.

Assessment API:
- Final incomplete submissions are rejected.
- Invalid maturity and confidence values are rejected.
- Unknown question IDs and domain mismatches are rejected during validation.
- Evidence note length is capped.

Supabase:
- RLS migrations exist for organizations and owned records.
- Server-side persistence uses service-role REST access, so RLS is bypassed by the backend; backend membership checks must be correct.
- Helper functions were hardened in a later migration, but callable helper surface should still be minimized where possible.

Security score: 67/100.

## 12. Supabase & Persistence Review

Reviewed files:
- `supabase/migrations/20250614203454_create_core_schema.sql`
- `supabase/migrations/20260513203000_mvp_organizations_persistence.sql`
- `supabase/migrations/20260514013000_profile_completion_and_rls_hardening.sql`
- `backend/app/persistence.py`
- `backend/app/supabase_client.py`
- `src/lib/org/api.ts`
- `src/lib/assessment/api.ts`
- `src/lib/agent/api.ts`
- `src/lib/report/api.ts`
- `src/lib/storage.ts`

Positive findings:
- Organizations and organization members exist in migrations.
- `profile_completed` exists and is backfilled based on required fields.
- Assessment sessions, responses, results, agent scans, report snapshots, and audit logs exist.
- Assessment result hashes are implemented.
- Frontend APIs exist for org, assessment, agent, and report data.
- Dashboard/report prefer persisted data when organization context exists.

Remaining source-of-truth risks:
- Legacy `companies` remains as compatibility fallback.
- localStorage remains as draft/fallback cache.
- `saveCompany` can fall back to legacy companies if organization save fails.
- `assessment.tsx` can fall back to local result generation after persisted evaluation failure.
- Real Supabase RLS and membership behavior were not verified against a running Supabase database in this audit.

Recommended persistence path:
1. Keep localStorage only as draft cache in development.
2. Fail closed for authenticated production persisted writes.
3. Use `organizations` as the only source of truth after migration confidence.
4. Move report preview to immutable `report_snapshots`.
5. Add audit-log viewer or admin export later.
6. Add local Supabase integration tests for cross-organization access.

## 13. Tests / Build Verification

Commands run locally:

| Command | Result | Summary |
| --- | --- | --- |
| `npm run test` | Passed | 10 test files, 34 tests passed. |
| `npx tsc --noEmit` | Passed | No TypeScript errors. |
| `npm run lint` | Passed with warnings | 7 existing React Fast Refresh warnings; no backend `.venv` scan failure. |
| `npm run build` | Passed | Vite/TanStack build succeeded. Build output noted `.env` usage and produced `dist/server/.dev.vars`. |
| `python -m pytest backend` | Passed | 37 backend tests passed. |

Lint warnings observed:
- `src/components/layout/DashboardShell.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/toggle.tsx`

These warnings do not block the controlled demo but should be cleaned before a stricter CI gate.

Safe API verification:
- Existing backend tests cover health, assessment validation, Agent target rejection, rate limit behavior, production CORS, generic Agent errors, and production auth rejection.
- No public target scans were performed.

Could not verify in this audit:
- Live FastAPI process startup with browser frontend.
- Live Supabase migration application.
- Real Supabase JWT validation against a production project.
- Mobile screenshots and visual overflow checks.
- Git tracked/staged secret status because this workspace does not expose a `.git` directory.

## 14. Documentation Review

Reviewed files:
- `README.md`
- `docs/demo-script.md`
- historical audit docs under `docs/`

Positive findings:
- README includes local frontend/backend setup, env variables, Supabase placeholders, demo URL, and safety disclaimer.
- Demo script includes controlled-demo flow, safety wording, prohibited claims, and limitations.
- Documentation reflects that authenticated workspace data should use FastAPI/Supabase persistence while localStorage remains fallback/cache.

Gaps:
- No dedicated architecture/source-of-truth document.
- No production deployment checklist that explicitly handles `.dev.vars`, platform secrets, CORS, auth, and migration application.
- No schema evolution/migration rollback guide.

Documentation score: 74/100.

## 15. Critical Issues

No critical controlled-demo blocker was found in source during this audit.

For MVP and production, several high-severity issues remain and must be fixed before pilot or production use.

## 16. High Issues

### H1 - Build output materializes local secrets into `dist/server/.dev.vars`

Severity: High
File/location: build output `dist/server/.dev.vars`, `.gitignore`, build pipeline

Impact:
The build command reported that secrets from `.env` were used and produced `dist/server/.dev.vars`. Even if ignored by git, this creates a deploy-artifact leakage risk if `dist` is archived, uploaded, copied, or inspected outside the developer machine.

Recommended fix:
- Configure the build/deployment path so local secrets are never written into distributable artifacts.
- Keep runtime secrets only in platform secret stores.
- Add a CI check that fails if `dist/server/.dev.vars` exists in deploy packaging.
- Keep `.gitignore` exclusions, but do not rely only on ignore rules.

Test to confirm:
- Run `npm run build`.
- Verify deploy artifact creation excludes `dist/server/.dev.vars`.
- Add CI assertion that no `.env`, `.dev.vars`, or secret-like file exists in packaged output.

### H2 - Authenticated source-of-truth still has legacy/local fallback complexity

Severity: High
File/location: `src/routes/assessment.tsx`, `src/lib/storage.ts`, `src/lib/api.ts`, `src/routes/dashboard.tsx`, `src/routes/report.tsx`

Impact:
The application now prefers backend/Supabase data for authenticated organizations, but legacy `companies` fallback and local assessment/result fallback remain. This is acceptable for controlled demos, but MVP behavior must not silently treat local results as workspace-saved truth.

Recommended fix:
- Outside development, fail closed for authenticated persisted save/evaluate failures.
- Keep localStorage only as draft cache and explicitly label fallback states.
- Remove legacy companies fallback after organization migration is proven.

Test to confirm:
- Mock backend persistence failure in production-like frontend tests.
- Confirm dashboard/report do not show local final result as workspace-saved.
- Confirm the UI displays a persistence failure or development fallback label.

### H3 - Backend uses service-role persistence, making backend authorization the tenant boundary

Severity: High
File/location: `backend/app/supabase_client.py`, `backend/app/persistence.py`

Impact:
Service-role access bypasses Supabase RLS. This can be a valid backend pattern, but any missing `require_organization_access` check can become cross-tenant data exposure or unauthorized writes.

Recommended fix:
- Add integration tests against a real local Supabase instance for two organizations and multiple roles.
- Centralize all organization-scoped reads/writes behind repository functions that require a checked user context.
- Avoid generic table access helpers for organization-owned entities.
- Consider using user-scoped Supabase requests where practical.

Test to confirm:
- User A cannot read/write User B organization data through backend endpoints.
- Viewer can read but cannot write.
- Owner/admin can update organization and manage permitted records.

## 17. Medium Issues

### M1 - Production rate limiting is in-memory only

Severity: Medium
File/location: `backend/app/api/agent_routes.py`

Impact:
The Agent endpoint rate limiter resets on process restart and does not coordinate across processes or instances.

Recommended fix:
Use Redis, Supabase, or gateway-level rate limiting for production.

Test to confirm:
Repeated requests across multiple app instances still enforce limits.

### M2 - API key production behavior is ambiguous

Severity: Medium
File/location: `backend/app/api/agent_routes.py`

Impact:
Production checks for `AVERONIX_API_KEY`, but unauthenticated requests still receive 401 after the key check. If the key is meant only as a fail-closed guard, document it. If it is meant as alternate machine auth, implement that explicitly.

Recommended fix:
Clarify and test the intended behavior.

Test to confirm:
Production without Bearer auth and with correct API key behaves exactly as documented.

### M3 - Report snapshots table exists but is unused

Severity: Medium
File/location: `supabase/migrations/*`, `src/routes/report.tsx`

Impact:
Report Preview still reads latest assessment result directly rather than a report snapshot. This is fine for demo but incomplete for MVP auditability.

Recommended fix:
Create immutable report preview snapshots from assessment results before pilot.

Test to confirm:
Report displays the snapshot that was generated from a specific result ID.

### M4 - Real Supabase RLS behavior was not integration-tested

Severity: Medium
File/location: `supabase/migrations/*`, backend persistence tests

Impact:
Migration SQL appears reasonable, but local unit tests do not prove RLS behavior against an actual Supabase database.

Recommended fix:
Add Supabase local integration tests for organization read/write policies and helper functions.

Test to confirm:
Run tests with two users and two organizations using Supabase local.

### M5 - No explicit request size limits observed

Severity: Medium
File/location: `backend/app/main.py`, FastAPI middleware/config

Impact:
Large request bodies could consume resources, especially on assessment and agent endpoints.

Recommended fix:
Add request body size limits at gateway and/or ASGI middleware.

Test to confirm:
Oversized requests are rejected with a safe 413 response.

### M6 - Browser/mobile UX is not regression-tested

Severity: Medium
File/location: frontend routes and layout

Impact:
Responsive behavior and logo visibility were not verified with screenshots in this audit.

Recommended fix:
Add Playwright or browser-use visual checks for landing, dashboard, assessment, report, and integrations.

Test to confirm:
Desktop and mobile screenshots show no horizontal overflow or unreadable logo.

## 18. Low Issues / Polish

### L1 - React Fast Refresh lint warnings remain

Severity: Low
File/location: shared UI components and `DashboardShell.tsx`

Impact:
Warnings do not block demo but weaken lint signal.

Recommended fix:
Split constants/helpers from component modules or adjust exports.

Test to confirm:
`npm run lint` runs without warnings.

### L2 - Historical audit docs contain prohibited phrases as review context

Severity: Low
File/location: `docs/`

Impact:
Plain grep searches for unsafe claims will still find historical reports, even though active product copy is safe.

Recommended fix:
Keep historical reports, but exclude `docs/*audit*` from product-copy guard scans or clearly mark them as audit context.

Test to confirm:
Product-copy scan only checks active UI/source files.

### L3 - Legacy compatibility tables remain

Severity: Low
File/location: `supabase/migrations/20250614203454_create_core_schema.sql`, `src/lib/storage.ts`

Impact:
Compatibility is useful now, but it adds confusion around source of truth.

Recommended fix:
Plan a migration to retire `companies` as the active profile source after organizations are stable.

Test to confirm:
App runs with organizations only and no legacy company fallback.

## 19. Demo Readiness Checklist

| Item | Status |
| --- | --- |
| Landing page clear and safe | Pass |
| Login/register present | Pass |
| Onboarding present | Pass |
| Dashboard command center present | Pass |
| Agent Evidence Scan present | Pass |
| Agent framed as external signals only | Pass |
| Manual Assessment D1-D9 present | Pass |
| 81 questions verified for SaaS | Pass |
| Submit incomplete final assessment rejected | Pass |
| Report Preview uses real result | Pass |
| PDF export disabled | Pass |
| Integrations marked Coming Soon | Pass |
| Logo + BETA present | Pass |
| Build/tests pass | Pass |
| Live browser/mobile check | Not verified in this audit |

## 20. MVP Readiness Checklist

| Item | Status |
| --- | --- |
| Organization-owned persistence schema | Partial/pass |
| Authenticated backend APIs | Partial/pass |
| Real Supabase auth verification | Implemented, not live-verified |
| Assessment responses persisted | Implemented |
| Assessment results immutable | Implemented |
| Agent scans persisted | Implemented |
| localStorage only fallback/cache | Partial |
| RLS tested against real Supabase | Missing |
| Report snapshots used | Missing |
| Production artifact secret safety | Needs fix |
| Role management UI/API | Missing |
| Production monitoring/rate limiting | Missing |

## 21. Pilot Readiness Checklist

| Item | Status |
| --- | --- |
| Production deployment runbook | Missing |
| Tenant isolation tested end-to-end | Missing |
| Audit logs operationalized | Partial |
| Data retention and deletion policy | Missing |
| Admin/member management | Missing |
| Backup/restore plan | Missing |
| Security headers/CSP for frontend | Not verified |
| Incident response process | Missing |
| Privacy/security terms | Missing |

## 22. Production Readiness Checklist

| Item | Status |
| --- | --- |
| No secrets in build artifacts | Failing risk |
| Strict production auth | Partial |
| Distributed rate limiting | Missing |
| Request size limits | Missing |
| Centralized logging/monitoring | Missing |
| Error tracking | Missing |
| DB migration pipeline | Missing |
| RLS integration tests | Missing |
| Disaster recovery | Missing |
| Formal security review | Missing |
| Compliance/legal review | Missing |

## 23. Recommended Roadmap

### Fix now

1. Remove or prevent `.dev.vars` secret materialization in deploy artifacts.
2. Add CI check for forbidden secret files in `dist` and repo.
3. Fail closed outside development when authenticated persisted assessment evaluation fails.
4. Add browser/mobile smoke checks for dashboard/report/logo.

### Next 48 hours

1. Add real Supabase local integration tests for organization isolation and roles.
2. Add frontend tests proving persisted backend data overrides localStorage.
3. Document production env handling and deployment artifact rules.
4. Clarify Agent API-key behavior.

### Before next demo

1. Run live demo flow from clean account: register, onboard, scan, assess, dashboard, report.
2. Verify mobile layout for landing, dashboard, scan, assessment, and report.
3. Confirm no user-facing Lovable/Radiance branding appears in app emails or metadata under the deployed environment.

### Before MVP

1. Retire legacy `companies` source-of-truth fallback or make it read-only compatibility.
2. Move report preview to immutable `report_snapshots`.
3. Add role/member management or clearly restrict to single-owner workspaces.
4. Add request size limits and distributed rate limiting.
5. Add production deployment and migration runbooks.

### Before pilot

1. Add operational monitoring and audit-log review.
2. Add data export/deletion flows.
3. Define data retention and privacy policy.
4. Conduct a formal security review of Supabase policies and backend auth.

### Later

1. Add multi-framework abstraction for NIST CSF, SOC 2, GDPR, HIPAA, and local frameworks.
2. Add real integrations.
3. Add report snapshot workflow and eventually PDF export.
4. Add risk register and control ownership workflows.

## 24. Final Priority List

1. Prevent secrets from being written into deploy artifacts.
2. Add CI secret/artifact guard checks.
3. Enforce persisted source-of-truth outside development for authenticated users.
4. Add real Supabase RLS/membership integration tests.
5. Add frontend tests for backend-over-localStorage precedence.
6. Add browser/mobile visual smoke tests.
7. Clarify and test production Agent auth/API-key behavior.
8. Add production-grade rate limiting.
9. Add request size limits.
10. Start retiring legacy `companies` and local final-result fallback after migration confidence.

## 25. Final Verdict

Prototype: yes.

Controlled demo-ready: yes, with caveats. The controlled flow is coherent and the test/build gates pass.

MVP-ready: no. MVP requires stricter production source-of-truth behavior, validated tenant isolation, safer deployment artifacts, and real Supabase integration tests.

Pilot-ready: no. Pilot requires operational controls, clearer data governance, monitoring, role handling, and production deployment discipline.

Production-ready: no. Production requires hardened secret handling, distributed rate limiting, request size limits, full tenant isolation verification, monitoring, incident processes, and legal/compliance review.

Bottom line: Averonix is credible for a controlled demo and materially closer to MVP than before, but it should not be treated as MVP-ready until the persistence and production security gates are proven end-to-end.
