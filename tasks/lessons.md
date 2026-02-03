# Lessons Learned

## 2026-02-03: Onboarding Trigger Default Role Issue

**Error**: Users bypass onboarding after email verification and go directly to Home.

**Root Cause**: Migration `018_emergency_fix_trigger.sql` was designed to fix signup failures, 
but in the process it changed the default role from `NULL` to `'athlete'`. This prevents the 
onboarding flow from being triggered.

**Original Design** (003_rbac_roles.sql):
```sql
role = NULL -- Forces onboarding
```

**Broken Fix** (018_emergency_fix_trigger.sql):
```sql
ELSE 'athlete'::user_role -- Bypasses onboarding
```

**Lesson**: When making "emergency fixes" to critical auth flows, verify that they don't break 
downstream business logic (like onboarding). The onboarding system depends on `role = NULL` 
to redirect users to the role selection wizard.

**Fix**: Only assign role if explicitly provided in `raw_user_meta_data`; otherwise keep `NULL`.
