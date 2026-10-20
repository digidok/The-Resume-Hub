# 6. Known limitations, dependencies and open items

## Must do before launch
1. Apply migration `20261020170000_business_portal_phase3.sql` to production (the earlier attempt was cancelled; nothing was applied). Deploy the matching code after it.
2. Send a real test enquiry on each funnel and confirm: team email, client acknowledgement, admin Enquiries view.
3. Run a **Payfast sandbox payment** of a business invoice and confirm it flips to Paid only after the webhook.
4. Fix security item S1 (Payfast RPC access): deploy the updated ITN route, confirm a test payment, then apply `20261020180000_lock_payfast_rpcs.sql`.
5. Enable leaked-password protection in Supabase Auth (S2).
6. Confirm the "From R" prices: the brief's data and automation prices are marked as test prices, and the screening prices are quote-only.
7. Confirm client names in the clients strip, get permission to show them, and add the logo files to `public/clients/`.
8. Get owner and legal sign-off on the cancellation and refund wording (guide, 5.8) and on any claim made about screening and POPIA.

9. **Labour broking.** The site now offers labour broking / temporary employment services (we employ and pay placed staff and run payroll). Before it is promoted, confirm the business's legal registrations and obligations for this service, and have the written placement agreement reviewed by a labour-law adviser. The page makes no claim about registrations.
10. **"100,000+ CVs" claim.** The figure is supplied by the business and is set in `src/lib/site-constants.ts`. The Resume Hub platform database itself holds far fewer resumes, so confirm where the 100,000 CVs are held and that they may be used for placement matching (POPIA consent) before publishing.

## Added in the "best platform" round (all need their migrations applied first)

Apply in this order after `20261020170000` and `20261020180000`: `20261020190000_security_hardening.sql`, `20261020200000_staff_roles.sql`, `20261020210000_appointments.sql`, `20261020220000_recruitment_workspace.sql`. Local database tests are in `supabase/tests` (27 checks); unit tests run with `npm test` and in CI.

- **Appointments:** public booking at `/book`, self-service cancel by private link, double-booking prevented by the database, daily reminder cron. Availability is set under Business hub > Appointments > Availability. Reminders run once a day on the current Vercel plan.
- **Staff roles:** recruiter, consultant, payroll, delivery. Added under Business hub > Staff. Admins can do everything.
- **Recruitment workspace:** CSV import with consent flag, searchable talent pool, vacancies with a pipeline board, bulk email with unsubscribe link, placements with timesheets and margin. It prepares payroll inputs only; it does not run payroll or file statutory returns.
- Only import people who have consented to be contacted. The 100,000 CV figure shown on the site must be confirmed against a real, consented source.

## Limitations of what is built
- Business-portal staff are administrators. There are no separate "service delivery staff" or "external provider" roles yet.
- Team members see everything linked to the owner's email. There is no per-document restriction.
- Invoices are shown in the dashboard; there is no PDF and no accounting-system integration.
- Retainer fees are not charged automatically each month.
- "Book a consultation" opens WhatsApp or the contact page; there is no calendar.
- Page copy is edited in code. Only prices and availability are editable by admins.
- The audit log covers business actions and invoice payments. Older platform admin actions (users, jobs, blog) are not logged.
- Messages between client and team are not real time; the other side is notified by email.
- Personal career websites are offered as a service, not as a product feature.

## Dependencies outside the code
- WhatsApp Business approval from Meta for any customer-facing WhatsApp automation. The existing ResumeHub WhatsApp automation still has open items (Meta upload 401, archival nodes, publishing workflows).
- Screening: authorised provider contracts and pricing before any check can be fulfilled or advertised with prices.
- Accounting system choice before invoicing integration.
- A data-retention decision (how long enquiries, files and screening records are kept) before deletion tooling is built.
- Confirming the Supabase backup plan and point-in-time recovery.

## Auto Apply
The existing Auto Apply feature was preserved and not changed. The brief requires that an application is never reported as submitted unless the destination or an authorised workflow confirms it. This has **not yet been verified** in the auto-apply code and should be checked before the feature is promoted.
