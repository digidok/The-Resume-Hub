# 3. Security and permissions testing

Run: 20 October 2026. Method: the four business migrations were applied to a throwaway PostgreSQL 16 database with stand-ins for Supabase's `auth` and `storage` schemas, then exercised as simulated signed-in users with `SET ROLE authenticated` and JWT claims. Test script: kept with the working notes; re-run it after every migration that touches business tables.

## 3.1 Results (all passed)

| Area | Check | Result |
|---|---|---|
| Isolation | Client A sees only A's requests, sent billing, retainers, screening cases and checks, messages and files; not B's | Pass |
| Isolation | Draft invoices are invisible to clients | Pass |
| Verification | A user with an unverified email sees nothing, even if rows exist for that email | Pass |
| Team members | Before being added, a colleague sees nothing; after, sees the owner's data only; after removal, nothing | Pass |
| Team members | A member cannot add members under an owner; an owner cannot add members under another owner | Pass |
| Quotes | Client can accept or decline their own sent quote; cannot touch another client's; cannot update billing directly | Pass |
| Approval | Client can approve only their own delivered request; not undelivered, not another client's | Pass |
| Messages | Client can post on their own request only; cannot post as team; cannot spoof another sender | Pass |
| Feedback | Only on own delivered work; one per request | Pass |
| Staff tables | Clients cannot read or write tasks, audit log, privacy requests, enquiries; cannot create or edit screening cases or billing | Pass |
| Pricing | Anyone can read catalogue overrides; nobody but admins can write | Pass |
| Audit | Admins can append; update and delete affect zero rows (append-only) | Pass |
| Storage | Clients can read only files under their own request or case reference | Pass |
| Anonymous | Signed-out visitors see no client data | Pass |

## 3.2 Application-level checks

| Check | Result |
|---|---|
| Enquiry API rejects unknown division, missing consent, missing required screening purpose | Pass |
| Honeypot returns a fake success without saving | Pass |
| Enquiry and privacy APIs rate-limit by email | Implemented (not load tested) |
| Invoice payment is marked paid only by the verified Payfast webhook, amount must match | Implemented. **Needs a sandbox payment test** |
| Screening checks cannot start until consent is recorded | Implemented in the action |
| Every admin business action writes to the audit log | Implemented |

## 3.3 Not tested

- Real end-to-end submissions in production (needs the production service key and email provider).
- Payfast sandbox payment of a business invoice.
- Load and abuse testing.
- Penetration test by an independent party (recommended before handling real screening data).

## 3.4 Open security items

See 01-technical-audit-and-feature-gap.md, section 1.2 (S1 to S5). S1 is the priority.
