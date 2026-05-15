# Supabase RLS And Organization Isolation Verification

Use this checklist before treating Averonix persistence as MVP-ready. This is a manual/local Supabase verification guide; the Supabase CLI is not a project dependency.

## Preconditions

- Install the Supabase CLI separately if using local Supabase.
- Apply all migrations in `supabase/migrations`.
- Use test-only users, organizations, and data.
- Do not use production secrets or real customer data.

## Test Setup

Create:

- User A
- User B
- Organization A owned by User A
- Organization B owned by User B
- Optional User C with `viewer` role in Organization A
- Optional User D with `admin` role in Organization A

Create test rows for:

- `assessment_sessions`
- `assessment_responses`
- `assessment_results`
- `agent_scans`
- `report_snapshots`
- `audit_logs`

## Verification Matrix

| Scenario | Expected Result |
| --- | --- |
| User A selects Organization A | Allowed |
| User A selects Organization B | Denied |
| User B selects Organization A | Denied |
| User C viewer reads Organization A records | Allowed |
| User C viewer inserts/updates assessment responses | Denied |
| User D admin updates Organization A profile | Allowed |
| User A owner manages Organization A members | Allowed |
| User B manages Organization A members | Denied |
| Non-member reads `agent_scans` for another organization | Denied |
| Non-member reads `assessment_results` for another organization | Denied |
| Non-member inserts `report_snapshots` for another organization | Denied |
| Organization with `profile_completed=false` is returned | App must keep onboarding incomplete |

## Helper Function Checks

Verify helper functions do not allow cross-user role inference:

- Calling membership helpers for an organization where the current user is not a member must return false/null, not another user's role.
- Helper functions must use `auth.uid()` internally.
- Avoid accepting arbitrary user IDs from authenticated callers.

## Backend Boundary Checks

Because FastAPI uses server-side Supabase service-role access, verify backend endpoints separately:

- User A cannot fetch latest assessment result for Organization B.
- User A cannot save an assessment response for Organization B.
- User A cannot run or fetch Agent scans for Organization B.
- Viewer role can read but cannot write organization-owned assessment or scan records.
- Editing persisted responses marks completed sessions/results stale.

## Pass Criteria

Pass only when every denied case fails with an authorization error and every allowed case succeeds for the correct organization. Do not rely on localStorage for this verification.
