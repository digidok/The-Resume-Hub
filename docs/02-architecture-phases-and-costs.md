# 2. Architecture, integration plan, phases and operating costs

## 2.1 Architecture

```
Browser ──> Vercel (Next.js 16, server components + route handlers)
              │
              ├─ Supabase Auth ........ sign-in, email verification
              ├─ Supabase Postgres .... all data, row-level security
              ├─ Supabase Storage ..... private buckets (see below)
              ├─ Resend ............... transactional email
              ├─ Payfast .............. checkout, ITN webhook
              ├─ Anthropic ............ AI features
              └─ n8n / WhatsApp ....... automation (separate service)
```

Service catalogue: `src/lib/catalog/divisions.ts` holds defaults for every service. Admin overrides live in the `catalog_overrides` table and are merged at render time (`src/lib/catalog/overrides.ts`). Career prices that already exist at checkout are read from `src/lib/payfast/config.ts` so the catalogue cannot contradict checkout.

Access model. Clients are matched to their data by **verified email**. `current_verified_email()` returns the signed-in user's email only when it is confirmed. `visible_emails()` adds the owners who have added the user as an authorised team member. Every client-facing policy uses it, so the rule is enforced in the database, not just in pages.

Data model (business portal):

| Table | Purpose |
|---|---|
| `studio_requests` | Document Studio requests; status, approval time |
| `business_enquiries` | Division enquiries (career and business funnels), consent, status pipeline |
| `business_billing` | Quotes and invoices; Payfast reference, paid time |
| `business_deliverables`, bucket `studio-deliveries` | Delivered files |
| `business_messages` | Client and team conversation per request |
| `business_feedback` | Rating and comment after delivery |
| `business_retainers`, `business_time_entries` | Retainers, corporate contracts, hours |
| `business_members` | Authorised team members |
| `screening_cases`, `screening_checks`, bucket `screening-reports` | Screening workflow and private reports |
| `business_tasks` | Task allocation |
| `catalog_overrides` | Admin price and availability edits |
| `privacy_requests` | POPIA requests |
| `audit_log` | Append-only record of sensitive actions |

Storage buckets are private. Uploads by clients go through signed upload URLs issued by the server. Admin uploads use admin-only storage policies. Downloads use one-hour signed URLs created under the user's own session, so storage policies decide access.

Payment flow for invoices. The dashboard posts the invoice id to `/api/payfast/business-invoice`. The route reads the invoice under the user's session (so row-level security proves access), stores a payment reference with the service role and sends the user to Payfast. Payfast calls `/api/payfast/notify`. The existing five checks run (signature, merchant, source IP, Payfast server confirmation, COMPLETE status) and then `settleBusinessInvoice()` marks the invoice paid only if the amount matches exactly. Returning to the site is never treated as proof of payment.

## 2.2 Phases and status

| Phase | Scope | Status |
|---|---|---|
| 1 Audit and foundations | Audit, gap analysis, sitemap, landing pages | Done (this document set) |
| 2 Service catalogue | Division pages, enquiry and quote forms, pricing | Done |
| 3 Operational portal | Accounts, tracking, secure documents, tasks, notifications, recurring services, corporate accounts | Done, pending database migration `20261020170000` (see below) |
| 4 Automation and integrations | WhatsApp via approved channel, task and enquiry automation, payment and invoicing integrations, dashboards | Payments and dashboards done. WhatsApp and accounting integrations open |
| 5 Advanced | Career Intelligence, HR analytics, provider integrations | Future |

Each phase is independently releasable. Release order for the current backlog: (1) apply migration `20261020170000_business_portal_phase3.sql`; (2) deploy the code; (3) run a test enquiry and a Payfast sandbox invoice payment; (4) apply `20261020180000_lock_payfast_rpcs.sql`.

## 2.3 Development quotation by phase

Rand amounts depend on the developer's rates and are left for the business to fill in. Sizing is relative: S under a day, M one to three days, L three to ten days.

| Item | Phase | Size | Status | Rand |
|---|---|---|---|---|
| Catalogue, division pages, forms | 2 | L | Done | |
| Client portal, messages, approvals | 3 | L | Done | |
| Admin hub (requests, tasks, screening, reports, audit) | 3 | L | Done | |
| Invoice payments with verified ITN | 4 | M | Done | |
| Lock down Payfast RPCs (security fix) | 3 | S | Prepared | |
| Auto Apply audit and "confirmed submission" check | 5 | M | Open | |
| Personal career websites | 5 | L | Open | |
| Invoice PDFs | 4 | M | Open | |
| Recurring card billing for retainers (Payfast subscriptions) | 4 | M | Open | |
| Service-delivery staff and external-provider roles | 3 | M | Open | |
| Calendar booking for consultations | 4 | S | Open | |
| WhatsApp approved-channel integration | 4 | L | Open, needs Meta approval | |
| Accounting integration (Xero, Sage or similar) | 4 | L | Open, needs chosen system | |
| Screening provider integration | 5 | L | Open, needs provider contract | |
| Data retention and deletion tooling | 3 | M | Open, needs retention decision | |

## 2.4 Third-party and operating costs

Confirm current plans and prices in each dashboard; they change and are not stated here.

| Service | Used for | What drives cost |
|---|---|---|
| Vercel | Hosting, cron | Plan, bandwidth, function time |
| Supabase | Database, auth, storage, backups | Plan, database size, storage, point-in-time recovery add-on |
| Resend | Transactional email | Emails per month, sending domain |
| Payfast | Payments | Per-transaction fee (confirm the current schedule) |
| Anthropic API | AI features | Tokens used, see the AI usage page |
| Adzuna, SerpAPI | Job data | Plan and request volume |
| n8n hosting | WhatsApp and workflow automation | Hosting plan or server |
| WhatsApp Business (Meta) | Messaging | Per-conversation pricing, number registration |
| Domain (resumehub.co.za) | DNS | Annual renewal |
| Screening providers (future) | Checks | Per-check fees, contract minimums |
