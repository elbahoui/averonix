# Averonix Technical, Product, Security, and UX Audit

Audit date: 2026-05-12

Scope reviewed: React/TanStack/Vite frontend, shadcn/ui components, Supabase integration, localStorage modules, ISO/IEC 27001 data files, FastAPI backend, Agent Evidence module, Manual Assessment module, Dashboard, Report, Integrations, migrations, tests, and build configuration.

Corrections applied during this audit:

- Fixed `src/styles.css` so all `@import` rules precede `@source`.
- Fixed `backend/app/agent/normalize_domain.py` to import the shared `app.security` module correctly.

## 1. Executive Summary

Overall project health: promising prototype with a meaningful ISO/IEC 27001 readiness model, real backend Agent checks, and a mostly honest evidence separation. It is not MVP-ready yet because source-of-truth boundaries, stale product copy, sector normalization, backend validation, persistence, and production controls are incomplete.

Current MVP completion estimate: 65%.

Main strengths:

- The D1-D9 data model exists and is valid for the intended MVP: 9 domains, 6 core questions per domain, 3 sector questions per supported sector, 81 selected questions per canonical sector.
- Backend Agent performs real, non-intrusive checks for HTTP/HTTPS, headers, DNS, MX, SPF, DMARC, DKIM best effort, TLS certificate, and TLS expiry.
- Agent scoring is conceptually separated into Verified Signal Score, Evidence Confidence, Agent Readiness Impact, and Risk Interpretation.
- Dashboard generally avoids treating Agent-only data as full readiness.
- Report page is manual-assessment based and does not generate a fake PDF.
- Required legal/compliance disclaimer appears on major trust surfaces.

Main risks:

- Frontend is not configured to use the backend by default because `.env` does not include `VITE_API_BASE_URL`.
- Onboarding stores display sector labels like `SaaS / Software` and `E-commerce`, but assessment data expects canonical values like `saas` and `ecommerce`; this can reduce the assessment to core-only questions instead of 81 questions.
- Backend assessment evaluation accepts incomplete responses and can return `100% / minimal` for one answered question.
- Agent endpoint is unauthenticated and does not block domains that resolve to private/internal IPs, creating SSRF-style risk in a deployed backend.
- Supabase is only partially used; Agent scans and assessment results remain localStorage-only.
- Agent mapping repeatedly maps many checks to the same D9 question, making coverage look noisier than it is.
- Lint currently fails with 472 Prettier errors and 7 React refresh warnings.

## 2. Current Progress Score

- Frontend: 72/100
- Backend: 76/100
- Agent Evidence: 70/100
- Manual Assessment: 76/100
- Dashboard: 68/100
- Reports: 70/100
- Integrations: 65/100
- Compliance wording: 78/100
- UX: 68/100
- Production readiness: 45/100
- Overall MVP readiness: 65/100

## 3. Critical Issues

### Backend Agent app import was broken

Severity: Critical

Where: `backend/app/agent/normalize_domain.py`

Why it matters: Importing `backend.app.main` failed because `normalize_domain.py` imported `.security`, which pointed to `backend.app.agent.security` instead of `backend.app.security`. Existing tests did not cover app startup or Agent route import. This would break normal API startup/import paths.

Recommended fix: Fixed during audit. Add a regression test that imports `app.main:app` and calls `/api/agent/scan`.

### Backend is not used by frontend unless environment is manually configured

Severity: High

Where: `.env`, `src/lib/api.ts`, `src/routes/scan.tsx`

Why it matters: `.env` contains Supabase variables but no `VITE_API_BASE_URL`. The frontend will fall back to limited browser checks, with most technical evidence marked `not_checked`. That is honest, but it means the real Python backend is not active in the default project state.

Recommended fix: Add `VITE_API_BASE_URL=http://localhost:8000` to local env docs and deployment envs. Add an obvious backend health indicator in the scan page and dashboard admin/debug view.

### Sector values are inconsistent and can break the 81-question MVP

Severity: High

Where: `src/routes/onboarding.tsx`, `src/routes/assessment.tsx`, `src/lib/api.ts`, `backend/app/assessment/questions_loader.py`

Why it matters: Onboarding saves labels such as `SaaS / Software`, `Healthtech`, and `E-commerce`; assessment expects `saas`, `healthcare`, and `ecommerce`. For mismatched sectors, sector-specific questions are not selected, so the user may see 54 questions instead of 81.

Recommended fix: Store canonical sector IDs and render separate labels. Add a shared `normalizeSector()` helper used by onboarding, assessment, Agent scan, local fallback, and backend payloads.

### Backend evaluation can produce final scores from incomplete assessments

Severity: Critical

Where: `backend/app/assessment/scoring.py`, `src/lib/api.ts`

Why it matters: The frontend blocks submission until all questions are answered, but the backend does not. API smoke testing returned `100%` and `minimal` risk for a single answered question. If stale or manually posted data is saved to `averonix.assessment.results`, dashboard and report will treat it as completed.

Recommended fix: Backend should validate the expected 81 responses for the selected sector or return completeness metadata and a `final=false` state. Local fallback should do the same.

### Agent scan endpoint has SSRF and abuse exposure

Severity: Critical

Where: `backend/app/security.py`, `backend/app/agent/checks.py`, `backend/app/api/agent_routes.py`

Why it matters: Literal private IPs and localhost are blocked, but a public-looking domain can resolve to private/internal IPs. The endpoint is unauthenticated and can trigger outbound HTTP, DNS, and TLS probes from the backend.

Recommended fix: Require authentication/rate limits, resolve target A/AAAA records before HTTP/TLS, reject private/reserved/link-local/multicast resolved IPs, limit redirects, add request budgets, and log scan owner/target.

## 4. Functional Bugs

- `/api/agent/scan` import path was broken before the audit fix; existing tests missed it.
- `POST /api/assessment/evaluate` accepts incomplete responses and returns a final-looking score.
- Onboarding sector labels do not match assessment sector IDs.
- Agent scan form receives raw company sector labels and casts them to `CompanySector`, which can submit invalid sector values.
- `src/routes/index.tsx` still markets "30 questions" and "6 domains" even though the current MVP is 81 questions across D1-D9.
- Root metadata still says `Lovable App`, with Lovable author/social metadata.
- Dashboard can continue showing old assessment results after the user changes responses because saving a response does not clear or invalidate `averonix.assessment.results`.
- Backend DMARC missing-record evidence says `_dmarc.{domain}` literally instead of interpolating the domain.
- `/company` and `/settings` routes do not exist; Company points to dashboard and Settings is disabled in navigation.
- `backend/README.md` references `.env.example`, but no backend `.env.example` file exists.

## 5. Misleading Product Logic

- Landing page says 30 questions, 6 domains, and a mock 72% readiness score. This conflicts with the D1-D9, 81-question MVP.
- Agent coverage is mapped to D7, D8, and D9, but most mappings repeat D9-C05. The UI labels this as partial, but the evidence table can appear broader than it is.
- Backend/local assessment scoring ignores unanswered expected questions if called directly.
- Agent `riskInterpretation` can be `minimal` when confidence is high and external signals are strong, but this must never be shown as organizational ISO readiness. Dashboard mostly avoids that; keep it that way.
- Auth page copy says "Your compliance journey starts here." Prefer "readiness journey".
- Integrations route metadata says "automated compliance checks"; prefer "planned integration evidence checks".

## 6. Architecture Issues

- Source of truth is split: backend and frontend both implement Agent scoring, assessment scoring, question loading, mapping, and local fallbacks.
- Supabase stores profiles and companies, but assessment responses/results and Agent scans are localStorage-only in the actual app flow.
- Backend routes are unauthenticated, so they do not connect to Supabase user/workspace context.
- There is no service layer separating persistence, scoring, and route UI on the frontend; route files own too much workflow state.
- `src/data/iso27001` and `backend/app/data/iso27001` are duplicated. They currently hash-match, but there is no sync guard.
- Error handling in `src/lib/api.ts` returns `null` for all backend failures, which hides backend errors and makes diagnosis harder.
- Generated shadcn/ui code is present and mostly fine, but the app-specific components are mixed with route logic rather than feature modules.

## 7. Agent Evidence Review

What works:

- Frontend calls `/api/agent/scan` when `VITE_API_BASE_URL` exists.
- Backend endpoint works after the import fix.
- CORS preflight from `http://localhost:5173` returns 200 and allows POST.
- Backend performs real observable checks and explicitly does not port-scan exposed services.
- Private literal targets such as `localhost`, `127.0.0.1`, `10.0.0.1`, and `.local` are rejected as failed normalization evidence.
- Not-checked checks are excluded from Verified Signal Score and reduce Evidence Confidence.
- UI presents Verified Signal Score, Evidence Confidence, Agent Readiness Impact, Risk Interpretation, Critical Findings, Checks, Mapping, Domain Coverage, and Limitations.

Issues:

- Default environment does not activate backend scanning.
- Agent mapping repeats: D9-C05 is mapped 13 times and D9-C01 6 times. This creates noisy repeated rows.
- Backend has 19 checks, but `AUTOMATED_QUESTIONS_TARGET` is hardcoded to 12.
- Backend total model questions is hardcoded to 270 instead of loaded from data.
- DKIM is best-effort using common selectors; this is acceptable only if labeled as best-effort.
- Exposure scanning is intentionally not performed, but the UI should say "not performed by policy" rather than "future release" in backend-backed results.
- Scan history is local only and capped at 10, with no user/workspace persistence.

Recommended fixes:

- Deduplicate mapped questions in the UI and show "signals contributing to this question" as grouped evidence.
- Add a per-domain "partial external signal only" label wherever D7/D8/D9 coverage is shown.
- Move Agent mapping/scoring contracts to shared generated schema or make backend authoritative.
- Add tests for expected reference summary shape, including the known 74/95/70/Medium style output.
- Add SSRF-safe DNS resolution and authenticated rate limiting.

## 8. Manual Assessment Review

What works:

- D1-D9 JSON exists in both frontend and backend.
- Each domain has 6 core questions and 24 sector questions, 3 per supported sector.
- Canonical sectors select 81 questions.
- Frontend loads backend questions first and falls back to local JSON.
- User can answer maturity level, evidence confidence, and evidence note.
- Progress, responses, and results use the expected localStorage keys.
- Frontend blocks submission until all loaded questions are answered.
- Scoring formula matches the requested model: `(maturityLevel / 3) * 100 * evidenceConfidence`.
- Risk bands match requested thresholds.

Issues:

- Sector normalization bug can prevent 81-question load.
- Backend/local evaluators can score partial data as final.
- Results are not invalidated when responses are edited.
- No evidence attachment or evidence source typing exists yet.
- No Supabase persistence for assessment responses/results despite tables existing.
- `assessment_answers` migration lacks `evidence_confidence`, result snapshots, sector, assessment version, and completion state.

Recommended fixes:

- Canonicalize sectors.
- Make backend reject incomplete evaluations unless explicitly called as draft.
- Add result versioning: model version, sector, question count, answered count, completedAt.
- Clear or mark stale results on response edits.
- Add tests for incomplete assessment rejection and sector label normalization.

## 9. Dashboard Review

What works:

- Dashboard separates Combined Readiness Score, Agent Evidence, Manual Assessment, and Integration Evidence.
- Agent-only state says "Not enough evidence" and "Agent evidence only".
- Integration Evidence is "Coming soon" and "Not connected".
- Empty states exist for no data.
- Required disclaimer is present.

Issues:

- Combined readiness is actually manual readiness when manual exists; there is no real combined model yet.
- Dashboard does not show manual evidence confidence or manual risk level in the top cards.
- Stale localStorage results can make the dashboard show "completed" after answers change or company sector changes.
- Company route is missing; Company nav item points back to dashboard.
- The sidebar has duplicate/ambiguous entries: Home, Get started, Readiness, Controls, Evidence.

Recommended fixes:

- Rename top card to "Manual Readiness Score" until a true combined model exists.
- Add explicit data freshness and source badges.
- Show assessment `answered/total`, `completedAt`, `sector`, `modelVersion`.
- Add stale-result invalidation.

## 10. UI/UX Review

Strengths:

- Visual direction is light, premium, and trust-oriented rather than dark cyber.
- Main workflow is understandable: onboard, scan, assess, view dashboard, view report.
- Empty states are present and generally useful.
- Agent limitations are visible.
- Report page clearly blocks PDF generation.

Issues:

- Landing page is a marketing page, not the product experience, and has stale counts.
- Mobile dashboard navigation is weak because the sidebar is hidden and only the logo/sign-out header remains.
- Agent tables can be crowded on smaller screens.
- Assessment question cards are functional but lengthy; completion will be tiring for 81 questions.
- Sidebar information architecture is not crisp enough for an executive SaaS tool.
- There are decorative gradients/orbs in auth layout that push toward a generic SaaS look.
- Several UI texts use "privacy" where the product is information security readiness.

Recommended fixes:

- Update landing to D1-D9 and 81 guided questions, or reduce it to a clean entry page.
- Add mobile navigation.
- Add assessment domain summary, unanswered filters, and "next unanswered" controls.
- Replace repeated evidence table rows with grouped cards.
- Use "information security" rather than "privacy" in onboarding metadata and field names.

## 11. Compliance & Trust Review

Unsafe claims found: no direct claims of ISO certification, ISO approval, guaranteed compliance, or full compliance were found.

Required disclaimer exists on landing, dashboard, report, and Agent limitations:

> Averonix is an information security readiness and gap analysis tool. It does not provide ISO certification, conformity assessment, accreditation, legal advice, or official approval from ISO or any regulator. Formal certification requires qualified auditors and accredited certification bodies.

Issues:

- Landing uses a shorter CNDP-specific variant, while other pages use the required exact variant.
- `AuthSplitLayout` says "compliance journey"; prefer "readiness journey".
- Integrations metadata says "automated compliance checks"; prefer "planned integration evidence".
- Onboarding route metadata says "privacy profile"; this is off-positioning for an ISO/IEC 27001 product.
- Root SEO metadata still says `Lovable App`, which damages trust.

Recommended fixes:

- Centralize disclaimer text in one module.
- Replace "compliance" with "readiness" except where discussing compliance review controls.
- Remove Lovable branding from metadata before demo.

## 12. Security Review

Strengths:

- Supabase RLS policies exist for profiles, companies, answers, scans, and integrations.
- Literal private/local scan targets are blocked.
- Exposed services check avoids port scanning.
- CORS works for localhost and Lovable regex.
- Backend uses timeouts for HTTP, DNS, and TLS checks.

Risks:

- Backend scan endpoints are unauthenticated.
- No rate limiting, scan quota, abuse logging, or target ownership verification.
- DNS rebinding/private-resolution protection is missing.
- HTTP redirects are not followed for header checks, but future redirect following must enforce private IP checks at each hop.
- `allow_origins=get_allowed_origins() or ["*"]` can become wildcard if env is empty.
- Build output includes Cloudflare `.dev.vars` under ignored `dist/server`; do not publish build artifacts to source control or logs.
- Supabase service-role client exists; ensure it is never imported into client bundles.

Recommended fixes:

- Protect backend endpoints with auth and per-user quotas.
- Add DNS resolution safety before network calls.
- Add structured security logs.
- Add production CORS allowlist with no wildcard fallback.

## 13. Data & Persistence Review

Current localStorage keys:

- Agent: `averonix.agent.lastScan`, `averonix.agent.scanHistory`
- Assessment: `averonix.assessment.responses`, `averonix.assessment.results`, `averonix.assessment.progress`
- Company: expected `averonix.company`, but actual company data is stored in Supabase `companies`, not localStorage.

What works:

- Agent scan history is capped at 10.
- Agent storage migrates legacy summary fields.
- Assessment storage has safe JSON parsing fallbacks.

Issues:

- Assessment results are not versioned and can go stale.
- Assessment responses are not keyed by user, company, sector, or assessment model version.
- Local data can mislead dashboard/report after sector or company changes.
- Supabase migrations define `assessment_answers` and `scans`, but frontend does not use them.
- `assessment_answers` schema is incomplete for current scoring because it lacks `evidence_confidence`.

Recommended fixes:

- Add `modelVersion`, `sector`, `companyId`, `questionCount`, `answeredCount`, `completedAt`, and `source` to results.
- Store assessment and Agent snapshots in Supabase after local MVP.
- Add localStorage migration/clear logic when company or sector changes.

## 14. Recommended Roadmap

Must fix now:

- Canonicalize sector values.
- Backend reject incomplete final assessment evaluations.
- Keep `VITE_API_BASE_URL` configured in local and deployed environments.
- Add auth/rate limiting/private-resolution protection to Agent backend before any public deployment.
- Update landing page from 30/6 to 81/D1-D9.

Next 48 hours:

- Deduplicate Agent mapped evidence by question.
- Add stale assessment result invalidation.
- Remove Lovable metadata and "privacy profile" copy.
- Add backend tests for app startup, Agent route, incomplete assessment, sector normalization, and private DNS resolution.
- Run Prettier or remove Prettier from lint if not wanted.

Before demo:

- Add mobile navigation.
- Rename "Combined Readiness Score" unless a real combined model exists.
- Add manual evidence confidence and manual risk level to dashboard.
- Add "backend connected" state for Agent scan.
- Add report metadata: company, sector, completed date, model version.

Before pilot customer:

- Persist Agent scans and assessment results to Supabase.
- Add user/workspace authorization to backend results.
- Add scan audit logs and quota controls.
- Add production deployment docs and env validation.
- Add basic monitoring/error reporting.

Later:

- Integration Evidence with read-only OAuth for Microsoft 365, Google Workspace, GitHub, Cloudflare, then AWS/Azure.
- Evidence attachment workflows.
- Control owner/task workflow.
- Exportable report generation with explicit "readiness preview" watermark.
- Shared schema generation between backend and frontend.

## 15. Final Priority List

1. Normalize sectors end to end so every supported sector loads 81 questions.
2. Make backend assessment evaluation reject incomplete final submissions.
3. Add `VITE_API_BASE_URL` and backend health status to the app setup.
4. Secure `/api/agent/scan` with auth, quotas, and private DNS resolution blocking.
5. Update stale landing and auth copy to match 81 questions, D1-D9, readiness wording.
6. Deduplicate Agent evidence mappings and group by question/domain.
7. Invalidate assessment results when responses, company, sector, or model version changes.
8. Persist Agent/Assessment results in Supabase with versioned snapshots.
9. Fix lint/Prettier debt and add missing backend route tests.
10. Improve dashboard semantics: manual score, agent partial evidence, integrations coming soon, no fake combined score.

## 16. Final Verdict

Current classification: prototype.

It is close to controlled-demo-ready after the must-fix items above, but it is not MVP-ready, pilot-ready, or production-ready. The core idea is sound and the data model is much more mature than a throwaway prototype, but product trust depends on precision: no stale counts, no partial assessment scores presented as final, no Agent evidence framed as full readiness, and no unauthenticated scanning backend.

Verification performed:

- `npm run build`: passed.
- `npx tsc --noEmit`: passed.
- `python -m pytest backend`: passed, 10 tests.
- FastAPI smoke test: `/api/health`, `/api/assessment/questions?sector=saas`, `/api/assessment/evaluate`, `/api/agent/scan` returned 200 after import fix.
- CORS preflight from `http://localhost:5173` returned 200.
- Literal private/local target tests returned failed normalization evidence.
- `npm run lint`: failed with 472 Prettier errors and 7 warnings.
