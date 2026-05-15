# Averonix Backend

Python FastAPI backend powering the Averonix Agent and Manual Assessment for ISO/IEC 27001 readiness.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Then set `VITE_API_BASE_URL=http://localhost:8000` in the frontend `.env`.

## Endpoints

- `GET  /api/health`
- `POST /api/agent/scan`
- `GET  /api/assessment/questions?sector=saas`
- `POST /api/assessment/evaluate`

## Notes

- Agent performs only safe, externally observable checks. No intrusive scanning.
- Domain validation rejects localhost, private IPs, and non-http schemes.
- ISO/IEC 27001 question text in `app/data/iso27001/` is Averonix-authored readiness wording, not ISO standard text.
- Averonix is a readiness and gap analysis tool. It does not provide ISO certification.
