# Averonix Controlled Demo Script

## Opening

Averonix helps SMEs understand ISO/IEC 27001 readiness through Agent Evidence, Manual Assessment, and future Integration Evidence.

## Demo Flow

1. Login / onboarding
2. Agent Evidence Scan
3. Manual Assessment
4. Dashboard
5. Report Preview

## Safety Wording

Averonix is not a certification body and does not provide ISO certification.

Use:

- ISO/IEC 27001 readiness
- readiness assessment
- gap analysis
- evidence confidence
- Agent Evidence
- Manual Assessment
- Integration Evidence
- report preview

## What Not To Claim

- certified
- official ISO approval
- guaranteed compliance
- full compliance

## Demo Limitations

- Authenticated workspace data should use FastAPI + Supabase persistence when configured.
- localStorage is only a development fallback, offline/demo draft cache, and resettable local demo state.
- Production/MVP deployments must not treat localStorage as the source of truth or final readiness record.
- Before packaging or deployment, run `npm run clean:secret-artifacts` and `npm run check:secrets`.
- Production secrets must live in managed platform secret stores, not in `.env`, `.dev.vars`, or deploy output files.
- Integrations are coming soon.
- Backend must be running for full Agent checks and backend assessment scoring.
- Report is a preview only.
- Formal certification requires qualified auditors and accredited certification bodies.
