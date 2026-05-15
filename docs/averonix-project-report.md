# Averonix - Security & Compliance Readiness Platform

## 1. Project Title

**Averonix - Security & Compliance Readiness Platform**

## 2. Executive Summary

Averonix is a security and compliance readiness platform designed for SMEs that need a clearer, more structured way to understand their cybersecurity posture and prepare for compliance programs. The current product focuses on ISO/IEC 27001 readiness, with a long-term direction toward supporting additional frameworks such as NIST CSF, SOC 2, GDPR, HIPAA, and local regulatory frameworks.

The product helps teams organize company context, run safe external technical signal checks, complete a guided readiness assessment, view readiness KPIs, and generate a readiness report preview. It is intended for founders, IT managers, security-responsible staff, consultants, and compliance preparation teams, particularly Moroccan startups and SMEs.

The current version is best classified as a **controlled demo / MVP foundation**. It has meaningful product flows and a credible user experience, but it is **not yet MVP-ready, pilot-ready, or production-ready**. Before production use, Averonix must prove durable organization-owned persistence, live Supabase RLS isolation, strict deployment secret handling, stronger production-grade operational controls, and authenticated source-of-truth behavior.

## 3. Problem Statement

SMEs often struggle to understand where they stand against security and compliance expectations. ISO/IEC 27001 readiness is especially difficult for small teams because the work spans policy, governance, risk, technical controls, evidence, and operational maturity.

Common problems include:

- Security evidence is scattered across tools, people, documents, and informal notes.
- ISO/IEC 27001 readiness is difficult to interpret without a structured assessment model.
- Companies do not know which control gaps are most important.
- Audit preparation is manual, inconsistent, and time-consuming.
- Evidence confidence is often weak or undocumented.
- Small teams lack a repeatable structure for readiness planning.
- External technical signals are rarely connected to readiness workflows.

The result is that SMEs may either underestimate risk, overstate readiness, or delay security preparation until a customer, auditor, investor, or regulator requests evidence.

## 4. Proposed Solution

Averonix provides a structured readiness workspace that helps SMEs understand their security posture without claiming certification or replacing qualified auditors.

The current solution includes:

- A guided ISO/IEC 27001 readiness assessment across D1-D9.
- 81 guided questions for structured manual assessment.
- Maturity level and evidence confidence tracking.
- Safe Agent Evidence Scan for external technical signals.
- Dashboard Command Center with readiness KPIs and next actions.
- Readiness Report Preview based on real assessment output.
- Organization/workspace persistence foundation.
- Future Integration Evidence layer for tools such as Microsoft 365, Google Workspace, GitHub, Cloudflare, and cloud providers.

The product separates readiness sources clearly:

- **Manual Assessment** is the main readiness source.
- **Agent Evidence** is external technical signal evidence only.
- **Integration Evidence** is planned for later.
- **Report Preview** is a readiness preview, not a certification report.

## 5. Target Users

| User Type                    | Need                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| SME founders                 | Understand readiness before customer, investor, or audit pressure.                  |
| IT managers                  | Identify control gaps and prioritize security work.                                 |
| Security responsible persons | Track evidence confidence and readiness progress.                                   |
| Consultants                  | Structure client readiness reviews and gap analysis.                                |
| Compliance preparation teams | Prepare evidence and readiness reports without overstating certification status.    |
| Moroccan startups and SMEs   | Use a practical readiness tool aligned with SME constraints and local market needs. |

## 6. Product Modules

### A. Landing Page

The landing page introduces Averonix as a security and compliance readiness platform. Its role is to explain the product clearly, position the platform around readiness and gap analysis, and avoid certification claims.

The messaging should continue to emphasize:

- ISO/IEC 27001 readiness.
- 81 guided questions.
- 9 readiness domains.
- Evidence confidence.
- No raw sensitive data required.
- Built for Moroccan SMEs.
- Future flexibility beyond ISO/IEC 27001.

### B. Authentication

The application includes login and register pages using Supabase authentication. Auth pages provide the entry point for workspace-based usage.

Current limitations:

- Authentication exists, but production-readiness depends on fully proven backend authorization and tenant binding.
- Development/test workspace support exists for local verification, but it is not a production auth path.
- Production deployment must ensure no anonymous access to persisted organization data or protected backend operations.

### C. Onboarding

Onboarding collects company and workspace context, including organization name, sector, size, domain, city, and country. This context is important because readiness questions and report metadata depend on company profile information.

The product now has an explicit organization/workspace persistence foundation. Organization completion should be based on a dedicated profile completion state, not simply the existence of an organization record.

### D. Dashboard Command Center

The Dashboard Command Center is the main executive workspace. It should help users understand readiness status quickly without confusing manual readiness, Agent signals, and future integration evidence.

Expected dashboard elements include:

- Manual Readiness Score.
- Assessment Progress.
- Agent Evidence.
- Critical Gaps.
- Current Readiness State.
- Evidence Sources.
- Next Best Actions.
- Domain Readiness Map D1-D9.
- Readiness Report Preview.
- Company Context.
- Development diagnostics only in development.

The dashboard should remain clear that Agent Evidence is not the full readiness score.

### E. Agent Evidence Scan

The Agent Evidence Scan collects safe external technical signals. It is designed to be non-intrusive and should not be described as a full ISO/IEC 27001 assessment.

Current or expected checks include:

- HTTPS availability.
- TLS certificate status.
- TLS expiry.
- DNS.
- MX records.
- SPF.
- DMARC.
- DKIM best effort.
- Security headers.
- Cookies.
- Public exposure marked as not checked by policy.

Important boundary:

**Agent Evidence is external technical signal evidence only. It does not replace the Manual Assessment, integrations, an audit, or a certification process.**

### F. Manual Assessment

The Manual Assessment is the primary readiness source in the current product.

It includes:

- D1-D9 readiness domains.
- 81 guided questions.
- Maturity level selection.
- Evidence confidence selection.
- Evidence notes or references.
- Autosave/draft behavior.
- Backend validation.
- Incomplete assessment rejection.

The supported maturity model:

| Level | Meaning                        |
| ----- | ------------------------------ |
| 0     | Not implemented                |
| 1     | Partially implemented          |
| 2     | Implemented but not documented |
| 3     | Implemented and evidenced      |

Evidence confidence values:

| Value | Meaning          |
| ----- | ---------------- |
| 0     | No evidence      |
| 0.3   | Weak evidence    |
| 0.6   | Partial evidence |
| 1     | Strong evidence  |

### G. Readiness Report Preview

The Readiness Report Preview presents the outcome of the manual assessment in a structured format.

It should include:

- Overall readiness score.
- Risk level.
- Evidence confidence.
- Sector.
- Completion timestamp.
- Model version.
- Answered count and question count.
- D1-D9 domain breakdown.
- Critical gaps.
- Recommendations.

Important boundary:

**The report is a readiness preview. It is not a certification report, audit opinion, official ISO approval, or guarantee of compliance.**

### H. Integrations

Integrations are currently **Coming Soon**.

Planned sources include:

- Microsoft 365.
- Google Workspace.
- GitHub.
- Cloudflare.
- AWS/Azure.

These integrations should remain disabled until implemented. The product should avoid implying active OAuth, connected evidence, passing checks, or real integration coverage before those features exist.

## 7. Technical Architecture

### Frontend

The frontend stack includes:

- React.
- TypeScript.
- Vite / TanStack.
- Tailwind and UI components.
- Route-based pages for landing, auth, onboarding, dashboard, scan, assessment, report, and integrations.

The frontend includes localStorage fallback behavior for development and controlled demo flows. For MVP and production use, authenticated backend/Supabase data should be authoritative.

### Backend

The backend stack includes:

- Python.
- FastAPI.
- Assessment APIs.
- Agent scan APIs.
- Organization and persistence APIs.
- Validation for assessment responses.
- Safe Agent scan controls.

The backend is the correct place for protected evaluation, persistence, organization access checks, and production scan authorization.

### Database / Auth

Supabase is used for authentication and persistence foundation.

Relevant intended or existing persistence entities include:

- `organizations`.
- `organization_members`.
- `assessment_sessions`.
- `assessment_responses`.
- `assessment_results`.
- `agent_scans`.
- `report_snapshots`.
- `audit_logs`.

Supabase RLS and organization isolation are critical for MVP and pilot readiness. They require live verification against a local or hosted Supabase environment.

### Persistence

The intended persistence model is:

- FastAPI + Supabase as the authenticated source of truth.
- localStorage only as development fallback, offline draft cache, or controlled demo fallback.

Production should not treat localStorage as authoritative final readiness data.

## 8. Scoring and Readiness Model

The scoring model is centered on Manual Assessment results.

Key principles:

- Manual Assessment is the main readiness score.
- Agent Evidence is not full readiness.
- Evidence confidence affects trust in the assessment result.
- Domain scoring is organized across D1-D9.
- Critical gaps and risk interpretation help prioritize remediation.
- If responses change after evaluation, results should become stale and require re-evaluation.

The model must avoid language such as compliance score, certified, certification ready, full compliance, guaranteed compliance, or audit guaranteed.

## 9. Security and Trust Principles

Averonix should maintain a conservative security posture.

Current principles:

- No raw sensitive data required.
- Evidence references and notes are preferred over raw evidence upload.
- Agent scanning should be safe and non-intrusive.
- No port scanning.
- Private and internal targets should be blocked.
- Unsafe schemes should be rejected.
- Production APIs require stronger authentication and tenant isolation.
- CORS must be restricted in production.
- Supabase service role use must remain server-side only.
- Supabase RLS and organization isolation still need live verification.

Production hardening still needed:

- Stronger operational rate limiting.
- Request size limits.
- Deployment secret handling enforcement.
- Live RLS verification.
- Browser/mobile E2E confidence.
- Monitoring and auditability.

## 10. Current Project Status

| Classification        | Status            | Explanation                                                                                                           |
| --------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Prototype             | Yes               | The product is beyond a rough prototype because multiple core flows exist.                                            |
| Controlled demo-ready | Yes, with caveats | The product can be demonstrated with known flows and honest limitations.                                              |
| MVP-ready             | No                | Durable source-of-truth behavior, tenant isolation, RLS verification, and operational hardening are not fully proven. |
| Pilot-ready           | No                | Needs stronger persistence, authorization, monitoring, documentation, and security validation.                        |
| Production-ready      | No                | Production security, deployment, isolation, and operational controls are not complete.                                |

## 11. Completed Work

Completed or materially implemented areas:

- Landing page.
- Login and register pages.
- Onboarding flow.
- Dashboard Command Center.
- Sidebar structure.
- Agent Evidence Scan.
- Manual Assessment D1-D9.
- 81 guided questions.
- Readiness Report Preview.
- Integrations placeholder.
- Logo and BETA branding.
- Backend validation for assessment flows.
- Organization persistence foundation.
- Supabase auth foundation.
- Safe compliance wording.
- Development/demo fallback behavior.
- Secret artifact check and cleanup workflow.
- Browser/mobile verification documentation.
- Authenticated visual verification with a development-only test workspace.
- Frontend and backend test suite passing in the latest local verification.

Latest local verification reported:

| Check                         | Result                                     |
| ----------------------------- | ------------------------------------------ |
| Frontend tests                | Passed                                     |
| TypeScript                    | Passed                                     |
| Lint                          | Passed with existing Fast Refresh warnings |
| Build                         | Passed                                     |
| Secret artifact cleanup/check | Passed after cleanup                       |
| Backend tests                 | Passed                                     |

## 12. Known Limitations

Known limitations:

- Live Supabase RLS verification has not been fully completed.
- Authenticated browser/mobile verification used a development-only workspace, not a live Supabase test user.
- localStorage fallback still exists for development/demo scenarios.
- Production secret artifact handling must be enforced in CI/deployment, not only run manually.
- Rate limiting is not production-grade.
- Request size and operational abuse controls need further hardening.
- Report snapshots exist as a direction but are not fully used as the report source.
- Integrations are not implemented.
- PDF export is not implemented.
- Multi-framework support is planned but not implemented.
- Production monitoring, alerting, and operational runbooks are not complete.

## 13. Risks

### Technical Risks

| Risk                                                        | Impact                                                                                              |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Source-of-truth confusion between Supabase and localStorage | Users may see stale or non-persisted readiness data if fallback behavior is not tightly controlled. |
| Production deployment secrets                               | Secret artifacts could be packaged if cleanup/check gates are not enforced.                         |
| Backend auth and tenant isolation                           | Organization-owned data could be exposed or modified incorrectly if authorization is incomplete.    |
| localStorage fallback                                       | Acceptable for demo/development, but unsafe as final truth in production.                           |

### Security Risks

| Risk                        | Impact                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| Service role backend access | Requires strict server-side authorization and no client exposure. |
| RLS not live-verified       | Policy mistakes may not be detected by unit tests alone.          |
| In-memory rate limiting     | Does not scale reliably across production instances.              |
| Missing request size limits | May expose backend to resource abuse.                             |

### Product Risks

| Risk                            | Impact                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| Overpromising compliance        | Users may misunderstand readiness as certification or audit approval. |
| Agent score misunderstanding    | Users may treat external signals as a full readiness result.          |
| Integrations expected too early | Users may assume evidence automation exists before it is implemented. |

## 14. Roadmap

### Phase 1 - Controlled Demo

Status: Mostly complete.

Focus:

- Controlled demo flow.
- Clear landing page.
- Auth pages.
- Onboarding.
- Dashboard.
- Agent Evidence Scan.
- Manual Assessment.
- Report Preview.
- Coming Soon integrations.
- Safe compliance wording.

### Phase 2 - MVP Foundation

Focus:

- Fix lint and release gates.
- Enforce backend/Supabase source of truth.
- Complete live Supabase RLS verification.
- Complete browser/mobile verification with real Supabase test users.
- Improve production secret handling.
- Add persistence and authorization tests.

### Phase 3 - MVP

Focus:

- Durable organization-owned assessment, scans, and results.
- Report snapshots as immutable preview source.
- Audit logs.
- Stronger backend auth.
- Browser E2E tests.
- Clear workspace state labels.

### Phase 4 - Pilot

Focus:

- Member roles and permission UX.
- Monitoring and alerting.
- Data retention policy.
- Security review.
- Customer-facing documentation.
- Support and incident procedures.

### Phase 5 - Future Frameworks

Focus:

- NIST CSF.
- SOC 2.
- GDPR.
- HIPAA.
- Moroccan and local regulatory frameworks.
- Framework mapping engine.
- Multi-framework evidence reuse.

## 15. Demo Scenario

A controlled 5-minute demo should be honest and tightly scoped.

1. Start on the landing page.
   - Explain that Averonix helps SMEs understand security readiness and prepare for compliance work.

2. Register or log in.
   - Show the workspace entry flow.

3. Complete onboarding.
   - Enter company profile, sector, size, domain, and location.

4. Run Agent Evidence Scan.
   - Explain that it checks safe external technical signals only.
   - Clarify that it is not a full ISO/IEC 27001 readiness score.

5. Open Manual Assessment.
   - Show D1-D9 and the 81-question structure.
   - Explain maturity levels and evidence confidence.

6. Show Dashboard KPIs.
   - Highlight Manual Readiness Score, Assessment Progress, Agent Evidence, Critical Gaps, and Next Best Actions.

7. Open Readiness Report Preview.
   - Show overall score, risk level, evidence confidence, domain breakdown, gaps, and recommendations.
   - State clearly that this is not a certification report.

8. Show Integrations Coming Soon.
   - Explain future evidence sources such as Microsoft 365, Google Workspace, GitHub, Cloudflare, and AWS/Azure.

9. Explain limitations honestly.
   - No certification.
   - No auditor replacement.
   - Integrations are planned.
   - Production persistence and tenant isolation must be fully proven before MVP/pilot use.

## 16. Final Evaluation

| Area                 |  Score | Rationale                                                                                                               |
| -------------------- | -----: | ----------------------------------------------------------------------------------------------------------------------- |
| Product idea         | 86/100 | Clear SME problem and strong positioning if compliance claims remain conservative.                                      |
| UX                   | 78/100 | Dashboard and core flows are demo-credible; some copy and full responsive verification still need refinement.           |
| Frontend             | 78/100 | Good React/TypeScript foundation with route coverage; source-of-truth boundaries still need tightening.                 |
| Backend              | 72/100 | FastAPI foundation exists with validation and persistence direction; production auth and operations need hardening.     |
| Security             | 64/100 | Defensive posture is improving, but RLS, tenant isolation, rate limiting, and deployment controls are not fully proven. |
| Compliance wording   | 84/100 | Product principles are sound; must keep avoiding certification or guarantee language.                                   |
| Demo readiness       | 82/100 | Suitable for a controlled demo with caveats and scripted flow.                                                          |
| MVP readiness        | 58/100 | Foundation exists, but durable source-of-truth and isolation guarantees need completion.                                |
| Production readiness | 35/100 | Not ready due to security, deployment, operational, and verification gaps.                                              |

## 17. Final Verdict

Averonix is credible for a controlled demo and has a solid MVP foundation direction. The product concept is strong, the core readiness flow is understandable, and the separation between Manual Assessment, Agent Evidence, and future Integration Evidence is the right product architecture.

However, Averonix should **not** be presented as production-ready. It should also not be positioned as a certification body, ISO certification provider, auditor replacement, or compliance guarantee.

Before MVP, pilot, or production use, the project must fully prove:

- Durable organization-owned persistence.
- Backend/Supabase source of truth.
- Tenant isolation and live Supabase RLS behavior.
- Deployment secret handling.
- Authenticated production API behavior.
- Operational controls such as rate limiting, request limits, monitoring, and audit logging.

**Final classification: controlled-demo-ready with caveats; not MVP-ready, not pilot-ready, and not production-ready.**
