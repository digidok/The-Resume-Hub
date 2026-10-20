# 4. Deployment, backup and recovery

## 4.1 Deployment

1. Work on a branch; push to `main` to release. Vercel builds and promotes automatically.
2. Check the deployment in Vercel (state READY) and open the site.
3. Database changes are SQL files in `supabase/migrations/`. Apply them to production through the Supabase dashboard SQL editor or CLI, in filename order, before deploying code that needs them.
4. Migrations here are forward-only. Fix mistakes with a new migration.

Required environment variables (Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ANTHROPIC_API_KEY`, `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_MODE` (`live` or sandbox), optional `NEXT_PUBLIC_WHATSAPP_MAIN`, `_SMALL_BUSINESS`, `_CORPORATE`. Never put the service-role key in client code or share it.

## 4.2 Rollback

- Code: in Vercel, open Deployments, choose the last good production deployment and promote or roll back to it. This takes effect immediately and does not touch the database.
- Database: restore from backup (below) or ship a corrective migration. Prefer the corrective migration.

## 4.3 Backups

Supabase takes automatic backups according to the project's plan. **Confirm in the Supabase dashboard (Database, Backups) which plan applies, how many days are kept, and whether point-in-time recovery is enabled.** If it is not, enable it before handling client or screening documents.

Beyond the platform backups:
- Take a manual database dump monthly and after major changes: `pg_dump` against the project connection string, stored in an encrypted location outside Supabase.
- Storage files (`studio-uploads`, `studio-deliveries`, `screening-reports`) are not inside a database dump. Export them periodically with the Supabase CLI or storage API.
- Keep the repository on GitHub (already the source of truth for code and migrations).

## 4.4 Recovery procedure

1. Decide the recovery point. For data damage, use point-in-time recovery if available; otherwise the latest daily backup.
2. Restore to a new Supabase project first, check the data, then repoint the environment variables (or promote the restore).
3. Re-deploy on Vercel so the new variables take effect.
4. Re-test: sign in, open a client dashboard, open the admin hub, download one delivered file.
5. Record what happened in the audit notes and tell affected clients if their data was involved.

## 4.5 Monitoring

- Vercel runtime logs and the admin Errors page.
- Supabase advisors (Security and Performance) monthly.
- Resend dashboard for email delivery failures.
- Payfast dashboard for payments that did not reach the webhook.
