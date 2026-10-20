# 1. Technical audit and feature-gap analysis

Audit date: 20 October 2026. Scope: the repository `digidok/The-Resume-Hub`, the Vercel project `the-resume-hub` and the production Supabase project "Resume Hub".

## 1.1 Platform summary

| Area | What exists |
|---|---|
| Front end | Next.js 16.3 (App Router), React 19, Tailwind 4. Server components by default. |
| Hosting | Vercel. Production deploys on push to `main`. Domains: resumehub.co.za, www.resumehub.co.za. |
| Data and auth | Supabase (Postgres, Auth, Storage). 53 migrations. Row-level security is enabled on every public table. |
| Email | Resend (transactional). |
| Payments | Payfast (once-off checkout and recurring subscriptions) with a verified ITN webhook. |
| AI | Anthropic API (resume review, application generation, interview practice, Els assistant). |
| Jobs data | About 74,000 jobs, synced daily by cron from Adzuna and SerpAPI. |
| Scheduled jobs | `adzuna-sync` 05:00, `serpapi-sync` 05:30, `auto-apply` 08:00 daily, `whatsapp-job-broadcast` Mondays 09:00 (Vercel cron). |
| Roles | `candidate`, `employer`, `admin` in `profiles.role`. |
| Production size | 57 profiles, 73 resumes, 86 applications, 5 payments (small, pre-launch scale). |

Existing candidate features: resume builder and 100+ templates, ATS scanner, cover letters, auto-apply and bulk apply, job board and saved jobs, application tracker, interview coach, follow-ups, salary insights, career passport, CV import, connections. Employer features: job posts, candidate pool, interviews and scorecards, induction modules, offer letters, analytics. Admin: users, jobs, payments, invoices, blog, WhatsApp orders, AI usage, errors.

Conclusion of the audit: no rebuild is needed. The platform is sound and the business expansion was added on the same stack, as the brief requires.

## 1.2 Security findings on the existing platform

Source: Supabase security advisors and code review, 20 October 2026.

| # | Finding | Severity | Status |
|---|---|---|---|
| S1 | `process_payfast_itn()` and `mark_payfast_payment_failed()` can be executed by `anon` and `authenticated` through the public REST API. A signed-in user who starts a checkout can see their own pending `m_payment_id` and call the function with the matching amount, completing the payment (credits, Pro, employer plan) without paying. | High | Fix prepared, not applied. The ITN route now uses the service role; migration `20261020180000_lock_payfast_rpcs.sql` revokes browser access. Apply after confirming a test payment. |
| S2 | Leaked-password protection is disabled in Supabase Auth. | Medium | Enable in Supabase dashboard (Auth, Password security). |
| S3 | Eleven other `SECURITY DEFINER` functions are executable by `anon` (for example `accept_offer`, `get_promo_discount`, `submit_induction_attempt`). Most check `auth.uid()` internally, but each needs a review of whether anonymous access is intended. | Medium | Open. Review one by one. |
| S4 | `cron_secrets` and `promo_codes` have RLS enabled with no policy. | Info | Intended (service-only). |
| S5 | Two trigger functions have a mutable `search_path`. | Low | Open. Set `search_path` on both. |

## 1.3 Feature-gap analysis against the brief

Legend: **Built** = live in code. **Partial** = some of it exists. **Request-based** = published as a catalogue service with an enquiry, quote and delivery workflow (delivered by people, not software). **Not built** = needs development. **External** = needs a third party or an account the business must obtain.

| Brief section | Item | Status |
|---|---|---|
| 3 Website structure | Navigation, division landing pages, enquiry forms, Pricing, About, Contact | Built |
| 3 | Central service catalogue (prices, descriptions, availability) | Built (`src/lib/catalog`, with admin overrides) |
| 4.1 CV services | CV, cover letter, LinkedIn (existing prices) | Built (prices read from the checkout config) |
| 4.1 | Executive CV, biographies, portfolio, consultations | Request-based |
| 4.2 Auto Apply | Matching, tailored CV and cover letter, tracking, alerts | Existing. Internals not audited in depth: **needs a focused audit** |
| 4.2 | "Never report submitted unless confirmed" | **Needs verification** in the auto-apply code before launch |
| 4.3 | Personal career websites | Not built. A public CV link (`/r/[slug]`) exists. Offered as a request-based service |
| 4.4 | Interview practice, ATS, salary insights, follow-ups | Built (existing) |
| 4.4 | Career readiness report, skills-gap assessment | Request-based |
| 5 Business admin | Company registration and admin services | Request-based, with enquiry form and quote flow |
| 6 Executive and board | Enquiry capturing meeting details; models once-off, monthly, contract | Built. Document Studio for board packs and minutes is request-based |
| 7 HR and recruitment | Individual or monthly outsourced services | Request-based |
| 8 Data science and BI | Services and starting prices | Request-based. Client data exchange uses the secure file upload |
| 9 Screening | Cases, per-check status, consent record, discrepancy note, private report delivery, audit trail | Built |
| 9 | Authorised provider integrations | External. Not built |
| 10 Automation | Service pages and pricing | Request-based. Existing WhatsApp automation has open fixes (see limitations) |
| 11 Portal, business | Request list and status, files, approve deliverables, view history, invoices, retainer hours, message the assigned contact | Built |
| 11 | Register a business account | Partial. Clients sign up normally; data links by verified email |
| 11 | Roles: individual, owner, authorised team member, administrator | Built. Team members are added by the owner and see the owner's data |
| 11 | Roles: service delivery staff, external providers | Not built. Needs a role model beyond `admin` |
| 11 Career customers | Profiles, CVs, Auto Apply, subscriptions | Existing |
| 12 Quotes and payments | Quotes (accept or decline), invoices, pay online, server-side payment verification | Built |
| 12 | Recurring service packages and corporate contracts | Built as retainers and contracts with hours tracking. Automatic monthly card billing is not built |
| 12 | Invoice PDF generation or accounting integration | Not built |
| 12 | Task assignment, delivery tracking, notifications | Built (tasks, status, email notifications) |
| 12 | Refunds and cancellations | Procedure drafted in handover guide. Wording needs owner and legal sign-off |
| 13 Acquisition | Separate career and business funnels, acknowledgement email, lead tracking, consent | Built |
| 13 | "Book a consultation" | Partial. Links to WhatsApp and contact. No calendar booking |
| 14 Admin | Enquiries, customers, quotations, payments, tasks, retainers, screening, feedback, revenue and conversion reports | Built |
| 14 | Website content editing | Partial. Prices and availability are editable. Page copy is edited in code |
| 14 | Audit log | Built for all business actions and invoice payments. Older admin actions are not logged |
| 15 Privacy | POPIA request process (access, correction, deletion, opt-out, complaint) | Built |
| 15 | Retention policy, deletion tooling | Not built. Needs an owner decision on retention periods |
| 16 Pricing | Single catalogue, no conflicting prices | Built |
| 17 Phase 4 | WhatsApp integration through approved channels | External (Meta Business approval) |
| 17 Phase 5 | Provider integrations, advanced analytics | External and future |
