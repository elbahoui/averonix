# Supabase RLS Verification Results

Date: 2026-05-14

Scope: attempted local verification following `docs/supabase-rls-verification.md`.

## Result

Status: not fully executable in this local environment.

## What Was Checked

- Docker is available locally.
- Supabase CLI is not installed or not available on `PATH`.
- No local Supabase instance was started.
- No production Supabase project was queried.
- No production secrets or customer data were used.

## Command Results

```text
supabase --version
```

Result:

```text
supabase: command not found
```

```text
docker --version
```

Result:

```text
Docker version 29.4.2
```

## Static Verification From Repository

The migration files define:

- `organizations`
- `organization_members`
- `assessment_sessions`
- `assessment_responses`
- `assessment_results`
- `agent_scans`
- `report_snapshots`
- `audit_logs`
- `organizations.profile_completed`
- RLS policies for member read access and writer/owner/admin write restrictions

The later hardening migration keeps helper functions scoped to `auth.uid()` instead of accepting arbitrary user IDs.

## Not Verified

The following required checks were not executed against a live Supabase instance:

- User A cannot access User B organization.
- Viewer cannot write assessment responses or Agent scans.
- Owner/admin can update organization-owned records.
- Assessment results are isolated by organization.
- Agent scans are isolated by organization.
- Helper functions do not expose cross-user role inference in a live Supabase session.

## Missing To Complete

Install the Supabase CLI outside the project dependency tree, then run the checklist in `docs/supabase-rls-verification.md` with local test-only users and organizations.

Do not mark Averonix MVP-ready until this live RLS verification is completed and recorded.
