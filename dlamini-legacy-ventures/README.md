# Dlamini Legacy Ventures — Demo Site

A **static, front-end-only prototype** of the Dlamini Legacy Ventures short-term
loan website, built from the project brief. Plain HTML/CSS/JS — no build step,
no framework, no dependencies. Open `index.html` directly in a browser, or
serve the folder with any static file server.

## Scope: what this is and isn't

This is a **demo/mockup**, not a production lending platform:

- **No backend.** There is no server, database, API, authentication, or data
  storage of any kind. Every "submit" action (the application form, contact
  form, complaint form, login) is handled entirely in the browser with
  JavaScript and does not send data anywhere.
- **No real accounts.** `login.html` accepts any input and redirects to a
  dashboard pre-filled with sample data. `dashboard.html` and `admin.html`
  are static mockups with hard-coded example figures — they do not represent
  real customers, loans, or applications.
- **No real pricing.** The interest rate and fees used in `calculator.html`
  / `assets/js/calculator.js` are placeholder, illustrative figures only,
  clearly labelled as such in the UI and in code comments. They are **not**
  approved pricing and must not be used with real customers.
- **No real regulatory claims.** The site does not claim NCR registration
  (see `credit-provider-info.html`) and the legal pages (`privacy.html`,
  `terms.html`, `complaints.html`) are placeholder drafts, explicitly marked
  as pending legal/compliance review.

Every page carries a visible "DEMO PROTOTYPE" banner so it can't be mistaken
for a live service if shared or deployed anywhere.

## Pages included

Home, Loans, Loan Calculator, How It Works, About Us, FAQs, Contact Us,
Apply (6-step application flow), Application Status guide, Privacy Policy,
Terms & Conditions, Complaints, Responsible Lending, Credit Provider
Information, Login, customer Dashboard, and an Admin dashboard mockup
(reporting stats, application/loan/customer tables — linked only from the
footer, not the main nav, and marked `noindex`).

## Before any of this becomes a real product

Per the original brief's compliance gate, none of the following should be
taken from this demo — they all need real input from the business owner and
a legal/compliance professional first:

- Actual interest rates, fees, and loan terms (NCA-compliant)
- A real credit agreement and consumer disclosures
- Final privacy policy (POPIA) and terms & conditions
- A real complaints procedure and escalation path
- NCR registration (the site should only claim this once actually granted)
- A real backend: authentication, database, document storage, payment
  gateway, credit-bureau integration, SMS/email/WhatsApp automation, 2FA,
  audit logging, and all other items in the original security/POPIA
  requirements — none of that exists in this prototype.
