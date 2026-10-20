# Database access-rule tests

These run against a **scratch** PostgreSQL 16 database with stand-ins for Supabase's `auth` and `storage` schemas (`stub.sql`). Never run them on production.

```bash
createdb rh_test
psql -d rh_test -v ON_ERROR_STOP=1 -f supabase/tests/stub.sql
for f in 20261020120000_studio_requests 20261020130000_business_dashboard 20261020170000_business_portal_phase3 \
         20261020200000_staff_roles 20261020210000_appointments 20261020220000_recruitment_workspace; do
  psql -d rh_test -v ON_ERROR_STOP=1 -q -f supabase/migrations/$f.sql
done
psql -d rh_test -v ON_ERROR_STOP=1 -f supabase/tests/staff_appointments_recruitment.sql
```

Every line should say PASS. Re-run after any migration that touches these tables.
