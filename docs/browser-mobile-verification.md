# Browser And Mobile Verification Checklist

Use this checklist after UI-affecting changes and before controlled demos. No browser automation framework is required for this phase.

## Viewports

Check each page at:

- Desktop: 1440 x 900
- Tablet: 768 x 1024
- Mobile: 390 x 844

## Test-Only Workspace Setup

Use test-only data. Do not use production data, real customer records, or production secrets.

For local browser verification without a live Supabase test session, Averonix supports an explicit development-only test workspace. It only works when `import.meta.env.DEV` is true.

Open:

```text
http://127.0.0.1:8090/dashboard?devWorkspace=1
```

This enables a local test session in browser storage for verification. The test workspace uses:

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

To clear it, open:

```text
http://127.0.0.1:8090/dashboard?devWorkspace=0
```

This path is for visual verification only. It is not a production auth path and must not be used as customer data.

## Pages

| Page         | URL             | Checks                                                                                            |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------- |
| Landing      | `/`             | Logo readable, BETA aligned, 81 guided questions, 9 readiness domains, no certification claims.   |
| Login        | `/login`        | Logo visible, form usable, no horizontal overflow.                                                |
| Register     | `/register`     | Logo visible, form usable, safe account wording.                                                  |
| Onboarding   | `/onboarding`   | Required company fields visible, profile completion flow usable.                                  |
| Dashboard    | `/dashboard`    | KPI row visible, Manual Assessment primary, Agent Evidence separate, no horizontal overflow.      |
| Agent Scan   | `/scan`         | Backend status visible, missing workspace error clear, Agent score labeled external signals only. |
| Assessment   | `/assessment`   | 81-question flow usable, submit disabled until complete, saved state label visible.               |
| Report       | `/report`       | Readiness preview wording visible, PDF disabled, domain rows stack on mobile.                     |
| Integrations | `/integrations` | All cards disabled/Coming Soon, no active OAuth implication.                                      |

## Visual Acceptance

- No horizontal scrolling on mobile.
- Sidebar mobile menu opens and closes cleanly.
- Dashboard first screen shows useful KPI information.
- Logo is readable in navbar/sidebar/footer.
- BETA badge is visible but smaller than the logo.
- Agent Evidence is never presented as the full readiness score.
- Report Preview is not presented as a certification report.
- Integrations are clearly future evidence sources.

## Source-Of-Truth Acceptance

- In development, local fallback labels are visible when backend data is unavailable.
- In production builds, localStorage data must not appear as final workspace readiness data.
- Authenticated workspace data should show as saved to workspace when persisted data is available.
