# Averonix Current Defensive Audit Report

Date: 2026-05-13  
Repository reviewed: `C:\Users\Onyx\Pictures\averonixio-main`  
Mode: authorized defensive engineering review only. No exploitation, brute force, destructive testing, aggressive scanning, or third-party target testing was performed.

## 1. Executive Summary

Averonix is currently controlled demo-ready with caveats. The core product story is coherent: ISO/IEC 27001 readiness for SMEs using Manual Assessment as the main readiness source, Agent Evidence as external technical signal evidence, Report Preview as a non-certification preview, and Integration Evidence as coming soon.

Overall health is stronger than the previous audit state. Immediate demo blockers around environment hygiene, generic Agent errors, production Agent fail-closed behavior, report mobile overflow, integrations consistency, and user-facing Lovable/Radiance copy have been addressed.

Main strengths:

- Manual Assessment D1-D9 loads 81 questions for supported sectors and rejects incomplete final scoring.
- Dashboard now separates Manual Assessment, Agent Evidence, Integration Evidence, and Report Preview clearly.
- Agent Evidence is framed as external technical signal evidence only.
- Backend has SSRF-oriented target validation, no port scanning, no redirect following, rate limiting, timeouts, generic 500 errors, and production API key enforcement.
- Supabase migrations include RLS on user-owned tables.
- Branding assets and BETA label are integrated.
- Required tests/build checks pass.

Main risks:

- Backend APIs are still not authenticated or tenant-bound to Supabase users/organizations.
- Assessment/Agent evidence is still localStorage-only for the active demo flow.
- A local `.env` file exists and the build tool reads it; this directory is not a Git worktree, so tracked/staged secret status cannot be verified here.
- Agent SSRF protection validates DNS before checks, but HTTP/TLS connections resolve again, leaving a residual DNS rebinding window.
- Rate limiting is in-memory and not production-grade.
- Multi-framework architecture is not implemented; current model is ISO/IEC 27001-specific.

Final classification:

- Prototype: yes
- Controlled demo-ready: yes
- MVP-ready: no
- Pilot-ready: no
- Production-ready: no

## 2. Current Progress Score

| Area | Score | Assessment |
|---|---:|---|
| Frontend | 84 | Core routes, copy, dashboard, branding, and tests are in good controlled-demo shape. Large route files and tooling residue remain. |
| Backend | 81 | FastAPI endpoints, CORS, Agent safety, generic errors, and assessment validation are solid for demo. Missing real auth/tenant binding. |
| Agent Evidence | 79 | Backend-first, non-intrusive, grouped evidence, private target rejection, timeout/rate limit/API key. Still not production-grade. |
| Manual Assessment | 85 | D1-D9, 81 questions, sector normalization, autosave, stale invalidation, backend validation. Needs durable persistence. |
| Dashboard | 86 | Command-center UX, KPI strip, evidence source separation, next actions, domain map, DEV diagnostics. Components remain inline. |
| Report Preview | 80 | Real-result only, metadata, disclaimer, disabled PDF, responsive domain rows. Needs durable report snapshots. |
| Integrations | 84 | All planned sources now represented and disabled. No OAuth or active-state implication. |
| Branding | 84 | Logo assets, favicon, apple icon, Logo component, BETA separation present. Browser visual QA still recommended. |
| Compliance wording | 86 | Unsafe claims are avoided in product copy; prohibited claims appear only in demo script as "what not to claim." |
| Security | 72 | Better demo posture after Agent hardening and env hygiene. Not pilot/production secure. |
| UX | 84 | Dashboard/landing/report are cleaner. Auth/onboarding flow is adequate for demo. |
| Data persistence | 55 | localStorage demo persistence works but is not tenant-bound or durable. |
| Documentation | 79 | README and demo script are useful. Architecture/scoring/security docs are missing. |
| Production readiness | 48 | Significant hardening remains: auth, persistence, observability, rate limiting, secret management, tenant ownership. |
| Overall MVP readiness | 74 | Close to MVP shape, but not ready for real customer evidence or pilot operation. |

## 3. Product Completeness Review

Current core flow status:

1. Landing page explains the product clearly: present.
2. User registers/logs in: present via Supabase email/password and Lovable-backed Google OAuth helper.
3. User completes onboarding: present; company profile saved to Supabase.
4. User runs Agent Evidence Scan: present; backend-first with fallback status.
5. User completes Manual Assessment: present; 81 questions for supported sectors.
6. Dashboard updates with real data: present from localStorage/Supabase-derived state.
7. Report Preview shows real assessment result: present.
8. Integrations are clearly coming soon: present and disabled.

Broken or missing flow elements:

- No `/company` or `/settings` route was found; Company links to onboarding and Settings is disabled/Soon.
- No `src/components/dashboard/` folder is present; dashboard components are inline in `src/routes/dashboard.tsx`.
- No root `index.html` was found; the app uses TanStack route head metadata in `src/routes/__root.tsx`.
- No architecture, scoring, or security docs beyond README/demo script were found.

Fake data and misleading sections:

- Dashboard does not use Agent score as Manual Readiness Score.
- Report Preview does not generate fake PDF.
- Integrations do not present active OAuth.
- Landing mockup is labeled sample/demo.

Current completeness verdict: controlled demo-ready, not MVP/pilot/production-ready.

## 4. Dashboard & Sidebar UX Review

Dashboard implementation is strong for a controlled demo.

Observed:

- Sidebar matches controlled-demo structure in `src/components/layout/DashboardShell.tsx`.
- Active routes are Home, Manual assessment, Agent evidence, Readiness report, Company, Integrations.
- Controls, Evidence, Policies, and Settings are muted disabled Soon items.
- Dashboard includes command-center header, KPI cards, current readiness state, evidence sources, next best actions, D1-D9 map, report preview, company context, and DEV-only diagnostics.
- Manual Readiness Score is based only on manual assessment result/progress.
- Agent Evidence is separated and labeled as external technical signals.
- Integrations are coming soon.

Dashboard UX score: 86/100.

Remaining improvements:

- Extract dashboard cards/helpers into `src/components/dashboard/` after the demo freeze.
- Add browser visual regression states for empty, agent-only, in-progress, completed, and stale assessment states.
- Confirm mobile sidebar and logo sizing in an actual browser session before demo.

## 5. Manual Assessment Review

Manual Assessment is functionally sound for a controlled demo.

Observed:

- D1-D9 are present through ISO data and backend question loader.
- Sector normalization exists in `src/lib/sector.ts`.
- Frontend calls backend questions first through `src/lib/api.ts`.
- Local fallback still returns 81 questions for requested display labels.
- `/assessment` uses normalized company sector.
- Responses include maturity, evidence confidence, and notes.
- Autosave writes to `averonix.assessment.responses`.
- Progress writes to `averonix.assessment.progress`.
- Results write to `averonix.assessment.results`.
- Response edits clear assessment results through `clearAssessmentResults()`.
- Submit is disabled until complete.
- Backend final evaluation rejects incomplete responses.
- Backend validation covers question ID, domain ID, maturity values, evidence confidence values, note length, and duplicate question IDs.

Trust risks:

- Active assessment persistence is localStorage-only.
- Result freshness depends on normal UI mutation clearing results; it does not cryptographically compare a current response hash to the result.
- Company/sector switching in the same browser can still leave local demo evidence unless reset or namespaced.

Manual Assessment score: 85/100.

## 6. Agent Evidence Review

Agent Evidence is demo-safe but not production-ready.

Observed:

- Frontend uses `VITE_API_BASE_URL` through `src/lib/api.ts`.
- `/scan` displays backend status using `src/lib/backend-status.ts`.
- Backend scan endpoint is `POST /api/agent/scan`.
- Agent checks are non-intrusive: HTTP/HTTPS, TLS, DNS, MX, SPF, DMARC, best-effort DKIM, headers, cookies, and public exposure as `not_checked`.
- `backend/app/agent/exposure_checks.py` explicitly avoids port scanning.
- `backend/app/agent/headers_checks.py` uses `follow_redirects=False`.
- `backend/app/security.py` rejects unsafe schemes, localhost/private/reserved IPs, internal TLDs, and public domains resolving to private IPs.
- `backend/app/api/agent_routes.py` has 5/minute rate limiting, timeout, structured logging, production API key enforcement, and generic 500 error responses.
- Frontend grouped mapped evidence exists in `src/lib/agent/grouped-evidence.ts`.

Remaining risks:

- DNS is validated before checks, but HTTP/TLS libraries resolve again during the actual request/connection. This leaves a residual DNS rebinding risk.
- Rate limiting is in-memory and can reset on restart; it is not distributed.
- Rate limiting trusts `X-Forwarded-For`; this is only safe behind a trusted proxy that overwrites the header.
- Backend does not authenticate requests to Supabase users or organizations.
- Backend still returns repeated mapped question records at API level; the frontend groups them.

Agent module score: 79/100.

## 7. Report Preview Review

Report Preview is useful and honest for demo.

Observed:

- Empty state appears when no result exists.
- Re-evaluation prompt appears when responses exist but no current result exists.
- Result view displays overall score, risk, evidence confidence, metadata, D1-D9 breakdown, critical gaps, and recommendations.
- PDF export remains disabled.
- The page states "Readiness preview - not a certification report."
- The report domain breakdown no longer uses the previous fixed-width overflow-prone row grid.

Remaining issues:

- Results are still localStorage-derived, not immutable report snapshots.
- Stale detection does not hash current responses against result metadata.
- No real export/report generation exists.

Report Preview score: 80/100.

## 8. Landing Page & Copy Review

Landing copy is safe for controlled demo.

Observed:

- `src/routes/index.tsx` includes "Security readiness made simple."
- It includes ISO/IEC 27001 readiness, 81 guided questions, 9 readiness domains, evidence confidence, no raw sensitive data, and Built for Morocco.
- Dashboard mockup is labeled Sample/Sample readiness view.
- Footer disclaimer is safe.
- Product copy avoids certification, official ISO approval, guaranteed compliance, full compliance, certification ready, audit guaranteed, and auditor replacement claims.

Search result nuance:

- `docs/demo-script.md` includes terms such as official ISO approval, guaranteed compliance, and full compliance only under "What Not To Claim." This is acceptable.

Multi-framework flexibility:

- Brand language is somewhat flexible, but implementation and metadata remain ISO/IEC 27001-specific.
- Before adding NIST CSF, SOC 2, GDPR, HIPAA, or local frameworks, the app needs a framework/model abstraction.

Compliance wording score: 86/100.

## 9. Branding / Logo Review

Branding is integrated.

Expected assets exist:

- `public/brand/logo-horizontal.svg`
- `public/brand/logo-icon.svg`
- `public/brand/logo-monochrome.svg`
- `public/brand/logo-horizontal-dark.svg`
- `public/brand/apple-touch-icon.png`

Observed:

- No JPEG logo assets were found in `public/brand`.
- SVGs have explicit viewBoxes and no obvious baked raster/jpeg artifacts from file listing/headers.
- Favicon and apple touch icon are configured in `src/routes/__root.tsx`.
- `src/components/brand/Logo.tsx` supports variants, sizes, `showBeta`, `className`, `imgClassName`, alt text, `loading="eager"`, and `decoding="async"`.
- BETA is separate HTML and not inside the SVG/favicon/app icon.
- Landing, footer, dashboard shell, and auth layout use the Logo component.

Cannot verify from code alone:

- Actual rendered logo visibility across desktop/mobile/footer in browser.

Branding readiness score: 84/100.

## 10. Integrations Review

Integrations are correctly locked as coming soon.

Observed:

- Page states no live integrations are connected.
- Microsoft 365, Google Workspace, GitHub, Cloudflare, and AWS/Azure are represented.
- Buttons are disabled and labeled Coming Soon.
- Planned checks use neutral Planned labels.
- OAuth is mentioned as a future connection approach only; no active OAuth flow is implemented.

Integrations score: 84/100.

## 11. Defensive Security Review

Frontend:

- No client-side service role import was found in normal route/component files.
- `src/integrations/supabase/client.server.ts` contains service role logic but is server-side by naming/convention.
- `dangerouslySetInnerHTML` appears in `src/components/ui/chart.tsx` for chart CSS generation. This is not currently a product-critical issue, but chart config must remain developer-controlled.
- localStorage parsing is guarded with try/catch.
- Dashboard routes use Supabase session checks through `DashboardShell`.

Backend:

- CORS rejects wildcard in production.
- Production without `ALLOWED_ORIGINS` fails.
- Agent unsafe schemes/private targets are rejected.
- Agent redirects are not followed.
- Agent does not port scan.
- Agent has timeout and rate limiting.
- Agent now returns generic 500s.
- Agent now requires API key in production.
- Assessment API rejects incomplete/invalid final scoring.

Supabase:

- RLS is enabled on profiles, companies, assessment_answers, scans, and integrations.
- Policies use `auth.uid() = user_id`.
- Function execute privileges are revoked.
- Current frontend demo flow does not yet persist assessment/scans to Supabase tables.

Security score: 72/100.

## 12. Supabase & Persistence Review

Current state:

- Supabase handles auth/profile/company.
- Agent scans and manual assessment state remain localStorage-controlled in the active app flow.
- localStorage keys are consistent:
  - `averonix.agent.lastScan`
  - `averonix.agent.scanHistory`
  - `averonix.assessment.responses`
  - `averonix.assessment.results`
  - `averonix.assessment.progress`
- Agent scan history is capped.
- Demo reset removes only Agent/Assessment keys and preserves company/auth.

Persistence risks:

- Evidence can cross users in the same browser.
- Results are not durable across devices.
- No organization ownership exists.
- No report snapshots exist.
- No audit logs exist.

Recommended migration path:

1. Add organizations/workspaces and memberships.
2. Persist assessment responses with organization, framework, model version, sector, question ID, maturity, confidence, note, author, timestamps.
3. Persist assessment result snapshots.
4. Persist Agent scan results and findings with organization ownership.
5. Persist report snapshots generated from immutable results.
6. Add audit logs for scan, assessment update, result generation, and report view/export.
7. Keep localStorage only for temporary draft/cache behavior.

Data persistence score: 55/100.

## 13. Tests / Build Verification

Commands run:

| Command | Result | Notes |
|---|---|---|
| `npm run test` | Passed | 7 files, 28 tests |
| `npx tsc --noEmit` | Passed | no TypeScript errors |
| `npm run lint` | Passed with warnings | 7 React Fast Refresh warnings, no errors |
| `npm run build` | Passed | build completed |
| `python -m pytest backend` | Passed | 30 tests |

Remaining lint warnings:

- `src/components/layout/DashboardShell.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/toggle.tsx`

All warnings are `react-refresh/only-export-components`. They do not block controlled demo readiness.

Safe local API verification:

- `/api/health`: 200
- `/api/assessment/questions?sector=saas`: 81 questions
- `/api/assessment/evaluate` incomplete final payload: 400, `ASSESSMENT_INCOMPLETE`
- `/api/agent/scan` private target `127.0.0.1`: 400

No public target scan was performed.

Build caveat:

- `npm run build` reports "Using secrets defined in .env". I did not read or print `.env` contents. `.env` and generated `.dev.vars` files are now ignored, but managed secret handling is still required before production.

## 14. Documentation Review

README:

- Includes requirements, backend setup, frontend setup, env variables, `VITE_API_BASE_URL`, Supabase vars, local demo URL, hosted frontend caveat, and disclaimer.
- Clear enough for local controlled demo setup.

Demo script:

- Includes opening statement, demo flow, safety wording, prohibited claims, and limitations.

Missing:

- Architecture overview.
- Scoring specification.
- Agent security/safety design.
- Supabase persistence/ownership design.
- Production deployment and secret-management runbook.
- Multi-framework architecture plan.

Documentation score: 79/100.

## 15. Critical Issues

### Critical 1: Backend APIs are not authenticated or tenant-bound

- Severity: Critical for pilot/production.
- File/location: `backend/app/api/agent_routes.py`, `backend/app/api/assessment_routes.py`.
- Impact: Backend requests are not tied to a Supabase user, company, or organization. API key enforcement protects Agent scans in production, but it is not user/tenant authorization.
- Recommended fix: Require Supabase JWT or signed backend session, derive user/org context server-side, and bind all scans/results to organization ownership.
- Test to confirm: Unauthenticated production backend requests return 401; authenticated users cannot access other organizations' data.

### Critical 2: Secret tracking cannot be verified in this workspace

- Severity: Critical if `.env` has ever been committed.
- File/location: local `.env` exists; directory is not a Git worktree.
- Impact: Secrets may be exposed if `.env` was committed, copied, or deployed. Build reads local `.env` and writes generated `dist/server/.dev.vars`.
- Recommended fix: In the real Git clone, verify `.env` was never tracked. Rotate any potentially exposed keys. Use managed deployment secrets.
- Test to confirm: Run `git status --short -- .env .env.example .gitignore backend/.env dist/server/.dev.vars` and `git check-ignore -v .env dist/server/.dev.vars` in the actual Git worktree.

## 16. High Issues

### High 1: Active evidence persistence is still localStorage-only

- File/location: `src/lib/assessment/storage.ts`, `src/lib/agent/storage.ts`.
- Impact: Evidence is not durable, tenant-bound, auditable, or safe for shared browsers.
- Recommended fix: Move active assessment/scan persistence to Supabase with organization ownership.
- Test to confirm: User A and User B in the same browser cannot see each other's results.

### High 2: DNS rebinding residual risk remains

- File/location: `backend/app/security.py`, `backend/app/agent/headers_checks.py`, `backend/app/agent/tls_checks.py`.
- Impact: DNS is validated before checks, but downstream HTTP/TLS connections resolve again.
- Recommended fix: Pin validated IPs or validate the actual connection target at request time.
- Test to confirm: Mock DNS changing from public to private between validation and connection; request must be blocked.

### High 3: In-memory rate limiting is not production-grade

- File/location: `backend/app/api/agent_routes.py`.
- Impact: Limits reset on process restart and do not work across instances. `X-Forwarded-For` trust depends on proxy setup.
- Recommended fix: Use Redis/Upstash or gateway-level rate limiting and trust proxy headers only from configured proxies.
- Test to confirm: Rate limits persist across workers and cannot be bypassed by spoofing `X-Forwarded-For`.

### High 4: Server-side service role helper lives under `src`

- File/location: `src/integrations/supabase/client.server.ts`.
- Impact: It is not imported client-side today, but location increases accidental import risk.
- Recommended fix: Move server-only Supabase admin client into an explicitly server-only area and enforce import boundaries.
- Test to confirm: Client bundle contains no service role references and lint/import rules reject client imports.

## 17. Medium Issues

### Medium 1: No organization/workspace model

- Impact: Limits multi-user SaaS readiness and pilot suitability.
- Fix: Add organizations, memberships, roles, and organization-owned records.

### Medium 2: Current model is ISO/IEC 27001-specific

- Impact: Brand goal includes future NIST CSF, SOC 2, GDPR, HIPAA, and local frameworks, but architecture is not framework-generic.
- Fix: Add framework registry/model abstraction before implementing additional frameworks.

### Medium 3: Dashboard route remains large

- File/location: `src/routes/dashboard.tsx`.
- Impact: Harder to maintain and test.
- Fix: Extract presentational components into `src/components/dashboard/`.

### Medium 4: No browser E2E tests

- Impact: Core demo flow can regress visually or behaviorally despite unit tests.
- Fix: Add Playwright or equivalent for login/onboarding/scan/assessment/dashboard/report happy paths.

### Medium 5: README references local `.env.local`, but build reads `.env`

- Impact: Developers may unintentionally build with local secrets.
- Fix: Clarify secret handling and managed deployment secrets in docs.

## 18. Low Issues / Polish

- `package.json` project name is still `tanstack_start_ts`.
- Lovable tooling packages/helpers remain; not user-facing in scanned copy, but architecture should be clarified.
- `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` for CSS; keep config developer-controlled.
- No visual browser QA was performed for logo/header/sidebar/footer in this audit.
- Demo script could explicitly say prohibited claims are examples not to use, though current heading already says that.

## 19. Demo Readiness Checklist

- Landing safe and clear: pass.
- Auth pages present: pass.
- Onboarding present: pass.
- Agent scan present and safely framed: pass.
- Manual Assessment 81 questions: pass.
- Dashboard command center: pass.
- Report Preview real-result only: pass.
- Integrations coming soon: pass.
- Logo/BETA assets integrated: pass by code inspection.
- Tests/build pass: pass.
- Git secret tracking verified: not verifiable here.

## 20. MVP Readiness Checklist

- Durable assessment persistence: missing.
- Durable Agent scan persistence: missing.
- Organization model: missing.
- Backend JWT/tenant auth: missing.
- Report snapshots: missing.
- Audit logs: missing.
- E2E tests: missing.
- Architecture/scoring/security docs: missing.

## 21. Pilot Readiness Checklist

- Organization ownership and RLS: partial schema foundation only.
- Backend auth to Supabase user/org: missing.
- Data retention/deletion model: missing.
- Admin/support access model: missing.
- Monitoring and alerting: missing.
- Real integration security design: missing.
- Legal/privacy/security terms for real customer evidence: missing.

## 22. Production Readiness Checklist

- Managed secrets: missing/not verified.
- Distributed rate limiting: missing.
- SSRF connection pinning: missing.
- Request body size controls: missing.
- Observability/tracing: missing.
- Deployment hardening/runbook: missing.
- Incident response process: missing.
- Multi-tenant authorization tests: missing.

## 23. Recommended Roadmap

### Fix now

- Verify `.env` tracking in the actual Git repo and rotate exposed keys if needed.
- Confirm rendered logo/sidebar/report mobile views in-browser.
- Document that `.env` is local-only and production uses managed secrets.

### Next 48 hours

- Add architecture/scoring/security notes.
- Add a simple browser smoke test for the controlled demo path.
- Move dashboard presentational pieces out of the route file if more dashboard work is planned.

### Before next demo

- Run full manual browser check: landing, register/login, onboarding, scan, assessment, dashboard, report, integrations.
- Confirm email sender/template is Averonix-branded.
- Prepare clean demo data reset before presenting.

### Before MVP

- Persist assessments, results, scans, and report snapshots to Supabase.
- Add organization/workspace ownership.
- Add backend Supabase JWT verification.
- Add response/result hashing for stale detection.

### Before pilot

- Add audit logs.
- Add retention/deletion policies.
- Add monitoring and incident process.
- Harden Agent SSRF/rate limiting.
- Conduct deployment security review.

### Later

- Add framework abstraction for NIST CSF, SOC 2, GDPR, HIPAA, and local frameworks.
- Implement real integrations only after OAuth/security architecture is ready.
- Add PDF exports from immutable report snapshots.

## 24. Final Priority List

1. Verify `.env` was never tracked and rotate any exposed secrets.
2. Add backend Supabase JWT auth and tenant binding.
3. Move assessment/Agent persistence to Supabase with organization ownership.
4. Add organization/workspace model.
5. Close Agent DNS rebinding residual risk.
6. Replace in-memory rate limiting with distributed/gateway limiting.
7. Add report snapshots and audit logs.
8. Add browser E2E smoke tests.
9. Add architecture/scoring/security documentation.
10. Build multi-framework abstraction before adding more frameworks.

## 25. Final Verdict

- Prototype: yes.
- Controlled demo-ready: yes.
- MVP-ready: no.
- Pilot-ready: no.
- Production-ready: no.

Averonix is suitable for an honest controlled demo. It should not yet be used for real customer evidence, pilot customers, or production readiness until backend auth, durable tenant-owned persistence, secret-management verification, and production security controls are completed.
