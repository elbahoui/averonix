# Browser And Mobile Verification Results

Date: 2026-05-14

Local URL: `http://127.0.0.1:8090`

Method: Codex in-app browser against the local Vite dev server.

Test account type: development-only verification workspace. No production data, real customer data, or production secrets were used.

Test workspace:

| Field               | Value                             |
| ------------------- | --------------------------------- |
| Test user email     | `verification.user@averonix.test` |
| Organization name   | `Averonix Verification Workspace` |
| Sector              | `saas`                            |
| Size                | `11-50`                           |
| Domain              | `example.ma`                      |
| City / Country      | `Casablanca, Morocco`             |
| `profile_completed` | `true`                            |
| Membership role     | `owner`                           |

## Summary

Authenticated workspace verification completed with the development-only workspace path documented in `docs/browser-mobile-verification.md`.

The workspace shell no longer remained indefinitely on `Loading workspace...` during this pass. Dashboard, scan, assessment, report, and integrations routes rendered with the test workspace. Mobile navigation opened and closed successfully.

Screenshot capture through the browser harness timed out, so no screenshot files are attached for this run. Verification was completed using DOM-visible page state at the requested viewport sizes.

## Viewport Results

| Page                                  | Viewport   | Result                                                                                                                                                        |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard `/dashboard?devWorkspace=1` | 1440 x 900 | Pass. Page rendered, sidebar visible, logo/BETA visible, Manual Readiness Score visible, Agent Evidence visible, integrations status visible.                 |
| Dashboard `/dashboard`                | 768 x 1024 | Pass. Page rendered after the dev workspace flag persisted in local browser storage. KPI content visible with no workspace loading loop.                      |
| Dashboard `/dashboard`                | 390 x 844  | Pass. Page rendered, KPI content visible, mobile navigation opened and closed, logo/BETA visible.                                                             |
| Agent Scan `/scan`                    | 390 x 844  | Pass. Agent Evidence Scan page rendered with the test company/domain, safe external scan wording, and Start Agent scan action.                                |
| Assessment `/assessment`              | 390 x 844  | Pass. Manual Assessment loaded after question fallback delay, D1 domain content visible, `0 of 81 answered` visible, submit button disabled while incomplete. |
| Report `/report`                      | 390 x 844  | Pass. Readiness Report Preview empty state rendered, not-certification wording visible, PDF export unavailable message visible.                               |
| Integrations `/integrations`          | 390 x 844  | Pass. Integration Evidence page rendered, Coming soon wording visible, Microsoft 365, Google Workspace, GitHub, and Cloudflare cards visible.                 |

## Checks Confirmed

- Authenticated workspace pages did not remain stuck on `Loading workspace...`.
- Dashboard KPI row content was visible.
- Manual Readiness Score and Agent Evidence were displayed as separate concepts.
- Mobile sidebar menu opened and closed.
- Logo and BETA badge were visible in the authenticated shell.
- Scan page was readable on mobile.
- Assessment page was usable on mobile and did not allow incomplete final submission.
- Report page used readiness-preview wording and did not present itself as a certification report.
- Integrations remained disabled/coming soon.
- Development fallback labels appeared where backend data was unavailable.

## Known Issues / Limitations

- Browser screenshot capture timed out with `Page.captureScreenshot`, so screenshots were not saved for this verification run.
- This pass used the development-only verification workspace, not a real Supabase authenticated user. Supabase RLS isolation must still be verified through `docs/supabase-rls-verification.md`.
- The dashboard visible H1 currently reads `Compliance Overview` while the browser title is `Security Readiness Command Center - Averonix`. This is a copy consistency issue, not a blocker for authenticated rendering verification.

## Release Note

This browser/mobile pass is sufficient to remove the previous authenticated-screen verification blocker for controlled demo readiness. It does not replace live Supabase RLS verification or a production deployment smoke test.
