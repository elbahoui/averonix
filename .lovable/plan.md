## Goal

Fix misleading Agent scoring and add a real Python FastAPI backend + Manual Assessment, while keeping the existing TanStack Start frontend intact.

## 1. Python backend (new `backend/` folder)

FastAPI app with the exact tree from the spec:

- `app/main.py` — FastAPI app, CORS (env `ALLOWED_ORIGINS`, default `http://localhost:5173,http://localhost:3000`), include routers.
- `app/config.py`, `app/schemas.py` (Pydantic models matching the API contract), `app/security.py` (domain validation: reject localhost / private IPs / non-http schemes / internal hostnames).
- `app/agent/`:
  - `normalize_domain.py` — strip scheme/path, lowercase, FQDN check via `tldextract` + `validators`.
  - `checks.py` orchestrator + per-family modules:
    - `headers_checks.py` — `httpx` GET/HEAD, parse security headers, HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, cookie flags.
    - `tls_checks.py` — `ssl`/`cryptography` to fetch cert, validity, days-to-expiry.
    - `dns_checks.py` — `dnspython` for A/AAAA, MX, SPF (TXT v=spf1), DMARC (\_dmarc TXT), DKIM (selectors `default`/`google`/`selector1`; else `not_checked`).
    - `email_security_checks.py` — wraps SPF/DMARC/DKIM presence checks.
    - `exposure_checks.py` — public website availability + HTTP→HTTPS redirect; no port scanning.
  - `scoring.py` — verifiedSignalScore (weighted avg excluding not_checked), evidenceConfidence (verified / total weight), agentReadinessImpact = signal × confidence/100, risk interpretation: `insufficient_evidence` when confidence < 40, else mapped from impact.
  - `mapping.py` — same mapping table as frontend, with grouped mappedQuestions output.
  - `engine.py` — runs all checks (async via `httpx.AsyncClient`), assembles result matching response schema, never throws.
- `app/assessment/`:
  - `questions_loader.py` — loads `app/data/iso27001/d{1..9}.json`, returns 6 core + 3 sector questions per domain.
  - `scoring.py` — controlScore = (maturity/3)*100*confidence, domain weighted avg, overall weighted avg, critical gaps (severity high/critical AND (maturity=0 OR confidence≤0.3)).
  - `engine.py` — evaluate handler.
- `app/data/iso27001/d1..d9.json` — copy from `src/data/iso27001/`.
- `app/api/`:
  - `health_routes.py` — `GET /api/health`.
  - `agent_routes.py` — `POST /api/agent/scan`.
  - `assessment_routes.py` — `GET /api/assessment/questions`, `POST /api/assessment/evaluate`.
- `requirements.txt`, `pyproject.toml`, `.env.example`, `README.md` (run instructions: `uvicorn app.main:app --reload`).
- `tests/` — pytest for domain validation, scoring math, sector loading.

## 2. Frontend fixes (no rebuild)

### `src/lib/api.ts` (new)

- `getApiBase()` — reads `import.meta.env.VITE_API_BASE_URL`, returns null if missing.
- `runBackendAgentScan(input)` — POST `/api/agent/scan`, returns null on failure.
- `getAssessmentQuestions(sector)` — GET with local-JSON fallback (build the 6+3 list in-browser if backend down).
- `evaluateAssessment(payload)` — POST with local fallback that runs the same scoring formulas in TS.

### `src/lib/agent/scoring.ts` — fix

- Rename to expose `verifiedSignalScore`, `evidenceConfidence`, `agentReadinessImpact`, `riskInterpretation`.
- `evidenceConfidence` = `verifiedWeight / totalWeight * 100` (so 2/18 ≈ 11%, not 100%).
- `riskInterpretation`: `insufficient_evidence` if confidence < 40, else thresholds on `agentReadinessImpact`.
- Update `AgentScanSummary` type and engine assembly + components accordingly.

### `src/lib/agent/types.ts` & `agent-engine.ts`

- Add `verifiedSignalScore`, `agentReadinessImpact`, `riskInterpretation` to `summary`.
- Engine: try backend first via `runBackendAgentScan`; on failure fall back to local checks but tag every unavailable check `not_checked` so confidence is honest.

### `src/routes/scan.tsx`

- Show "Verified Signal Score", "Evidence Confidence", "Agent Readiness Impact", "Risk Interpretation" (never display "Minimal" when interpretation is `insufficient_evidence`).
- Recent scans line: `Signal {n} · {confidenceLabel} · {n} critical`.
- If backend missing, show inline warning banner.

### `src/components/agent/AgentScoreSummary.tsx`, `AgentEvidenceTable.tsx`

- Replace "Agent Score" wording. Group `mappedQuestions` by `questionId` (Domain · Control · Question · status · combined confidence · supporting checks count, expandable).

### `src/routes/assessment.tsx` — rewrite

- DashboardShell page titled "Manual ISO/IEC 27001 Readiness Assessment".
- Domain nav (D1–D9), per-domain progress, current-question card (severity badge, helpText, expectedEvidence), maturity (0–3), evidence-confidence (0/0.3/0.6/1.0), evidence note.
- Persist `averonix.assessment.responses` and `averonix.assessment.progress`; on complete, call `evaluateAssessment` (with local fallback) and store `averonix.assessment.results`.

### `src/routes/dashboard.tsx`

- Four cards: Combined Readiness, Agent Evidence (verified signal + confidence + coverage + risk interpretation + last scan), Manual Assessment (status + completion% + score), Integration Evidence (coming soon).
- Combined card: shows manual score if assessment complete; if only agent → "Partial external evidence only — not enough evidence for a readiness score"; if nothing → empty state.
- Evidence Sources row.

### `.env.example` at project root

- Add `VITE_API_BASE_URL=http://localhost:8000`.

## 3. Out of scope

- No new database tables, no Supabase auth changes, no React Router DOM, no routeTree edits beyond what router auto-gen handles. Existing pages (landing/login/register/onboarding/integrations/report) unchanged except dashboard.

## 4. Verification

- `pytest backend/tests` passes; `uvicorn app.main:app` boots; `curl /api/health` returns ok; agent scan on `example.com` returns sane summary with `insufficient_evidence` when most checks `not_checked`.
- Frontend `tsc` clean. `/scan` no longer shows score 100 + Minimal; recent scans line includes confidence; `/assessment` loads 81 questions and computes score; `/dashboard` separates four cards.

## Technical notes for the user

- Backend runs locally with `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`.
- Set `VITE_API_BASE_URL=http://localhost:8000` in the frontend `.env` to wire the live agent. Without it, frontend uses honest local fallback (most checks `not_checked`).
- DKIM without a selector remains `not_checked` by design — that's the spec.
