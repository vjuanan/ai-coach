# Fixing Post-Verification Onboarding Flow

## Problem
Users who verify their email are being redirected to Home instead of the onboarding flow.
The trigger `handle_new_user` incorrectly assigns `'athlete'` as default role instead of `NULL`.

## Root Cause
Migration `018_emergency_fix_trigger.sql` assigns `'athlete'` as fallback when no role is specified in metadata,
but the onboarding system requires `role = NULL` to force the user through the role selection wizard.

## Tasks

- [x] Investigate the issue (callback, middleware, trigger)
- [x] Create new migration `019_fix_onboarding_trigger.sql` to:
  - Only assign role if explicitly provided in `raw_user_meta_data`
  - Default to `NULL` to force onboarding
- [x] Correct Frontend `signup/page.tsx` to stop sending default role
- [x] Deploy migration to production
- [x] **REVISED**: Implement `onboarding_completed` flag instead of NULL role.
- [x] Update Middleware, Actions, and Onboarding page to use new flag.
- [x] Reset test user `admin@epnstore.com.ar`.
- [ ] Verify fix in production with browser test (Screenshots).

## Improved Login Error Message (2026-02-03)

- [x] Modify `app/login/page.tsx` to intercept "Invalid login credentials".
- [x] Translate error to friendly Spanish.
- [x] Enhance error UI with icon and better styling.
- [ ] Verify changes.

## Knowledge Page Optimization (2026-02-03)

- [x] Research current component structure.
- [x] Compact header layout (Apple Style).
- [x] Reduce whitespace and optimize controls alignment.
- [ ] Verify with screenshots.

## Fix Block Menu Options (2026-02-03)
- [ ] Locate the Block component and "..." menu code.
- [ ] Diagnose why the menu is not opening.
- [ ] Fix the issue.
- [ ] Verify the fix.
