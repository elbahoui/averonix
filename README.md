# Averonix Local Controlled Demo

Averonix is an ISO/IEC 27001 readiness and gap analysis platform for Moroccan SMEs and organizations. This setup is for a controlled local demo of Agent Evidence, Manual Assessment, Dashboard, Report Preview, and planned Integration Evidence.

## Requirements

- Node.js
- npm
- Python
- FastAPI backend dependencies from `backend/requirements.txt`
- Supabase project values for frontend authentication
- `VITE_API_BASE_URL` pointing to the FastAPI backend

## Environment

Create `.env.local` in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Create `backend/.env` from `backend/.env.example` if needed:

```env
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
VITE_API_BASE_URL=http://localhost:8000
AVERONIX_ENV=development
AVERONIX_API_KEY=
```

## Local Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

## Frontend

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 8080
```

Demo URL:

```text
http://localhost:8080
```

## Verification

```powershell
npm run test
npx tsc --noEmit
npm run lint
npm run build
npm run clean:secret-artifacts
npm run check:secrets
python -m pytest backend
```

## Secret Artifact Safety

Local TanStack/Cloudflare builds can generate `dist/server/.dev.vars` from local environment files. This file must never be packaged, uploaded, copied into a deployment artifact, or committed.

Use:

```powershell
npm run clean:secret-artifacts
npm run check:secrets
```

`check:secrets` fails when forbidden secret artifacts are present in `dist` or, when git metadata is available, when `.env`-style files are tracked or staged. It reports only file paths and never prints secret values.

Production secrets must live in managed platform secret stores such as Cloudflare, Supabase, or the selected deployment platform. Do not copy `.env`, `backend/.env`, `.dev.vars`, or generated secret files into deploy output.

## Important Demo Notes

- A hosted frontend will not use a local backend unless the backend is deployed publicly and `VITE_API_BASE_URL` is set to that deployed backend URL.
- Authenticated workspace evidence should use FastAPI + Supabase persistence when configured.
- localStorage is only a development fallback, offline/demo draft cache, and resettable local demo state.
- Production/MVP deployments must not treat localStorage as the source of truth or final readiness record.
- Authenticated production builds require persisted FastAPI + Supabase workspace data for final Agent scans, assessment results, and reports.
- Integration Evidence is coming soon and must not be presented as active.
- Report Preview is not a PDF export and is not a certification report.
- Averonix is an information security readiness and gap analysis tool. It does not provide ISO certification, conformity assessment, accreditation, legal advice, or official approval from ISO or any regulator. Formal certification requires qualified auditors and accredited certification bodies.

## Additional Verification Guides

- Supabase RLS and organization isolation: `docs/supabase-rls-verification.md`
- Browser and mobile visual checks: `docs/browser-mobile-verification.md`
"# averonix" 
