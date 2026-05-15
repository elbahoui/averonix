# Averonix Controlled Demo Readiness Report

Date: 2026-05-12  
Status: Controlled demo ready  
Verdict: Ready for a professional controlled demo, not production-ready.

## Executive Summary

Averonix has been prepared for a controlled demo focused on trust, clarity, and stability. The core flow is intact:

- Agent Evidence
- Manual Assessment D1-D9
- Dashboard
- Report Preview
- Integrations placeholder

This pass did not add new product features, integrations, PDF generation, AI explanations, or redesign work. It focused on making backend status visible, preventing silent fallback confusion, improving result freshness labels, locking integrations as coming soon, adding demo reset tooling, and documenting the local demo flow.

## Demo Readiness Improvements

### Demo Checklist

Added a DEV-only dashboard panel for local demo debugging. It shows:

- Backend API configured
- Backend health reachable
- Agent last scan exists
- Assessment responses exist
- Assessment result exists
- Report ready
- Local demo data age
- Current sector
- Question count

It is hidden outside development mode.

### Demo Data Reset

Added `clearDemoData()` in `src/lib/demo/reset.ts`.

It clears only:

- `averonix.agent.lastScan`
- `averonix.agent.scanHistory`
- `averonix.assessment.responses`
- `averonix.assessment.results`
- `averonix.assessment.progress`

It does not clear Supabase auth or company profile.

### Backend Status Visibility

Backend status is now visible in the demo-critical pages.

`/scan` shows one of:

- `Backend API URL is not configured - limited frontend checks only.`
- `Backend unavailable - using limited fallback.`
- `Python backend connected.`

`/assessment` shows:

- backend scoring connected, or
- local fallback warning.

This prevents silent fallback during demos.

### Manual Assessment Metadata

Dashboard and Report now surface assessment freshness and provenance:

- completed date
- model version
- sector
- answered count
- question count
- backend/local source

Stale results are not shown as final. If responses exist but no current result exists, the app keeps the re-evaluation-required state.

### Report Preview Trust

`/report` now clearly labels the output as:

> Readiness preview - not a certification report.

The disabled PDF button now explains:

> PDF export will be available after report generation is implemented.

No fake PDF or auditor-ready wording was added.

### Agent Demo Clarity

`/scan` now clearly distinguishes:

- Backend Agent active
- Limited browser checks only

Agent results include the trust note:

> This is an external technical signal score, not a full ISO/IEC 27001 readiness score.

Mapped evidence remains grouped by readiness question.

### Integrations Locked

`/integrations` is now clearly a placeholder:

- all buttons disabled
- all actions labeled `Coming Soon`
- planned checks marked as planned
- no OAuth flow
- no active connection implication

Copy now states:

> Integration Evidence will be available in a later release.

## Documentation Added

Added root `README.md` with:

- requirements
- backend setup
- frontend setup
- `.env.local` example
- demo URL
- Lovable deployment caveat
- compliance disclaimer

Added `docs/demo-script.md` with:

- opening demo statement
- demo flow
- safety wording
- prohibited claims
- demo limitations

## Verification Results

All required automated checks passed:

- `npm run test` - 7 files, 28 tests passed
- `npx tsc --noEmit` - passed
- `npm run lint` - passed with 7 existing React Fast Refresh warnings
- `npm run build` - passed
- `python -m pytest backend` - 27 tests passed

Remaining lint warnings:

- `src/components/layout/DashboardShell.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/toggle.tsx`

These are existing React Fast Refresh warnings from shared component exports. They do not block demo readiness.

## Controlled Demo Checklist

Before presenting:

1. Start backend on port `8000`.
2. Start frontend on `http://localhost:8080`.
3. Confirm `/scan` shows `Python backend connected.`
4. Run Agent Evidence Scan on a safe public domain.
5. Confirm `/assessment` loads 81 questions.
6. Complete assessment or use prepared demo data.
7. Confirm Dashboard shows Manual Assessment result metadata.
8. Confirm Report Preview shows real result metadata.
9. Confirm Integrations page is disabled and coming soon.
10. Use DEV reset only when preparing a fresh walkthrough.

## Compliance Safety

Safe wording remains:

- ISO/IEC 27001 readiness
- readiness assessment
- gap analysis
- evidence confidence
- Agent Evidence
- Manual Assessment
- Integration Evidence
- report preview

Do not claim:

- ISO certified
- certified by ISO
- official ISO approval
- guaranteed compliance
- full compliance
- audit guaranteed
- certification ready

Required disclaimer remains:

> Averonix is an information security readiness and gap analysis tool. It does not provide ISO certification, conformity assessment, accreditation, legal advice, or official approval from ISO or any regulator. Formal certification requires qualified auditors and accredited certification bodies.

## Final Verdict

Averonix is ready for a professional controlled demo.

It is still not production-ready because persistence is not fully server-side, backend auth/tenant binding is not complete, integrations are not built, and report generation is preview-only.

Current classification:

- Prototype: no
- Controlled demo-ready: yes
- MVP-ready: close, but not yet
- Pilot-ready: not yet
- Production-ready: no
