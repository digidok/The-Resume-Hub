// "How it works" content for every catalogue service, shown when a client opens a
// service card. Written to describe the work itself without promising turnaround
// times, outcomes or results; timing and price are always confirmed in the quotation.
import type { PriceModel } from "@/lib/catalog/divisions";

export type ServiceDetail = {
  /** What the client receives. */
  includes: string[];
  /** What we need from the client to start. */
  needs: string[];
  /** Overrides the standard request-quote-deliver steps (for self-service products). */
  steps?: string[];
};

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  // Business administration
  "ba-cipc": {
    includes: ["Preparation of your company registration details and documents", "Submission through the relevant authority", "Your registration documents sent to you once issued"],
    needs: ["Proposed company names", "Director and shareholder details and ID copies", "Your registered address"],
  },
  "ba-amendments": {
    includes: ["Preparation of the change (directors, address or company details)", "Submission of the applicable filing", "Confirmation of the filing outcome"],
    needs: ["The change you want made", "Current company registration documents", "Identification of the people involved"],
  },
  "ba-profile": {
    includes: ["A written company profile or capability statement", "Professional layout, ready to send to clients, funders or for tenders", "One round of corrections"],
    needs: ["What your business does and who it serves", "Key projects, clients or experience you can name", "Your logo and brand details, if you have them"],
  },
  "ba-supplier": {
    includes: ["Help preparing the documents a supplier database asks for", "Guidance through the registration steps", "Your completed submission"],
    needs: ["The database(s) you want to register on", "Company registration and tax documents", "Bank confirmation and contact details"],
  },
  "ba-bbbee": {
    includes: ["A checklist of the documents your B-BBEE process needs", "Collecting and organising your documents in one place", "A pack ready for your verification agency"],
    needs: ["Your company and ownership details", "Financial and payroll information as requested", "Access to the people who hold the documents"],
  },
  "ba-records": {
    includes: ["A tidy register of your company records", "A calendar of statutory dates and reminders", "Updates as your details change"],
    needs: ["Your company registration documents", "Directors, shareholders and filing history", "Who we should send reminders to"],
  },
  "ba-va-monthly": {
    includes: ["A named contact who handles your agreed administrative tasks each month", "Email, calendar, scheduling, data capture, research, follow-ups and enquiry handling as agreed", "Regular updates on what was done"],
    needs: ["The tasks you want handled and how you prefer to work", "Access to the tools or accounts involved, shared securely", "Any rules about what needs your approval first"],
  },
  "ba-va-once": {
    includes: ["One defined task, such as a document, spreadsheet, research or correspondence", "Delivered to your dashboard to review", "One round of corrections"],
    needs: ["A clear description of the task", "Any source material or examples", "Your deadline"],
  },
  "ba-docs": {
    includes: ["Business documents prepared in your format and style", "Quotations, invoices, proposals, policies, SOPs, reports or presentations as requested", "One round of corrections"],
    needs: ["The type of document and its purpose", "The content or notes to work from", "Any template or brand style you want used"],
  },
  "ba-tender": {
    includes: ["A checklist of what the tender or supplier submission requires", "Compiling, formatting and checking your documents against it", "A final pack ready for you to submit"],
    needs: ["The tender or supplier documents", "Your company information and supporting documents", "The closing date"],
  },

  // Executive and board support
  "eb-pack": {
    includes: ["Board or committee papers compiled into one organised, paginated pack", "Consistent formatting and a contents page", "Delivered securely to your dashboard"],
    needs: ["The papers and reports to include", "The meeting date and who receives the pack", "Any format your board expects"],
  },
  "eb-agenda": {
    includes: ["A clear agenda for the meeting", "Matched to your governance format", "One round of corrections"],
    needs: ["Items to discuss and who presents them", "The meeting date, time and attendees", "Previous agendas, if you have them"],
  },
  "eb-minutes": {
    includes: ["Minutes taken at the meeting and written up in a professional structure", "Decisions and actions clearly recorded", "A draft for your review before final"],
    needs: ["The meeting date, time and how it is held", "The agenda and attendee list", "Your preferred minute format"],
  },
  "eb-transcription": {
    includes: ["A word-for-word written transcript of your recording", "Speakers identified where possible", "This is a transcript, not summarised minutes"],
    needs: ["The audio or video recording", "Speaker names, if known", "Any specialist terms or names to spell correctly"],
  },
  "eb-coord": {
    includes: ["Scheduling and logistics for executive meetings", "Follow-ups and deadline tracking", "Regular updates to you"],
    needs: ["Who needs to attend and their availability", "Your meeting cycle and recurring commitments", "Access to the relevant calendars, shared securely"],
  },
  "eb-registers": {
    includes: ["A register of resolutions, actions and decisions", "Kept up to date after each meeting", "Overdue items flagged to you"],
    needs: ["Minutes or notes from your meetings", "The people responsible for actions", "How often you want updates"],
  },
  "eb-diary": {
    includes: ["Confidential management of the executive's diary, email and documents", "Handled to the rules you set", "Regular updates on what was done"],
    needs: ["Your priorities and what needs your approval", "Secure access to the diary and mailbox", "Anything that must stay strictly private"],
  },
  "eb-gov": {
    includes: ["Governance policies, procedures or registers prepared for you", "Matched to your organisation's structure", "One round of corrections"],
    needs: ["The documents you need", "Your current policies and constitution, if any", "The people who must approve them"],
  },
  "eb-contract": {
    includes: ["A single agreement covering your full meeting cycle", "Packs, agendas, minutes and follow-up as agreed", "A named contact for the whole cycle"],
    needs: ["Your meeting calendar for the period", "The services you want included", "Who the main contact on your side is"],
  },

  // HR and recruitment
  "hr-recruit": {
    includes: ["Drafting job adverts", "Coordinating candidate screening and interview scheduling", "A shortlist pack for your decision"],
    needs: ["The role and what you are looking for", "Where you advertise", "Your preferred interview dates"],
  },
  "hr-jd": {
    includes: ["Clear, consistent job descriptions", "Duties, requirements and reporting lines set out", "One round of corrections"],
    needs: ["The role title and main duties", "Required qualifications and experience", "Existing descriptions, if any"],
  },
  "hr-docs": {
    includes: ["Employment contracts, offer letters or supporting documents prepared from your terms", "Consistent wording and formatting", "One round of corrections"],
    needs: ["The agreed terms for each employee", "Your existing templates, if you have them", "A final check by you or your legal adviser"],
  },
  "hr-onboard": {
    includes: ["Onboarding or offboarding checklists", "Induction packs or exit administration", "Ready to use for each new starter or leaver"],
    needs: ["Your current process", "Start or exit details", "The documents your staff must complete"],
  },
  "hr-files": {
    includes: ["Employee files organised and checked for missing documents", "A clear structure for new files", "A list of what is still outstanding"],
    needs: ["Access to the existing files, shared securely", "The documents each file must hold", "Any retention rules you follow"],
  },
  "hr-leave": {
    includes: ["Leave and attendance records captured and kept up to date", "Balances reported to you", "Queries flagged for your decision"],
    needs: ["Your leave policy", "Leave requests and attendance records as they happen", "Who approves leave"],
  },
  "hr-payroll": {
    includes: ["Payroll inputs prepared and checked", "Sent to your payroll provider in the format they need", "We do not run payroll or give tax advice"],
    needs: ["Hours, leave and changes for each pay period", "Your payroll provider's requirements", "Your cut-off dates"],
  },
  "hr-perf": {
    includes: ["Appraisal forms and performance records prepared", "Tracking of review dates", "Records kept in one place"],
    needs: ["Your performance process", "The roles and review cycle", "Completed forms as they come in"],
  },
  "hr-policy": {
    includes: ["HR policies and an employee handbook drafted for your business", "Written in plain language", "One round of corrections"],
    needs: ["The policies you need", "Your current practices and rules", "A review by your legal adviser before you adopt them"],
  },
  "hr-training": {
    includes: ["Training records kept up to date", "Skills-development paperwork prepared", "A summary of training completed"],
    needs: ["Who attended which training", "Certificates and provider details", "The reports you need to produce"],
  },
  "hr-planning": {
    includes: ["Headcount and capacity planning support", "Your current and planned staffing set out clearly", "A summary you can discuss with your team"],
    needs: ["Current headcount and roles", "Growth or budget plans", "Any known gaps or upcoming exits"],
  },
  "hr-lr": {
    includes: ["Labour-relations documents prepared", "Meeting administration, such as invitations and records", "We do not give legal advice or represent you"],
    needs: ["The matter and documents involved", "Your disciplinary and grievance procedures", "Dates and people involved"],
  },

  // Labour broking (temporary employment services)
  "lb-temp": {
    includes: ["Candidates shortlisted from our job-seeker database", "The worker is employed and paid by us", "A written agreement setting out the placement and our fees"],
    needs: ["The role, number of people and skills required", "Start date and expected duration", "Where and when they will work"],
  },
  "lb-fixed": {
    includes: ["Candidates shortlisted and presented to you", "Employment contracts, payroll and employment administration handled by us", "A written agreement before anyone starts"],
    needs: ["The role, number of people and contract length", "The working conditions and the pay range", "Start date and work location"],
  },
  "lb-project": {
    includes: ["A team assembled and employed by us for your project or season", "Salaries and administration handled by us", "A written agreement before anyone starts"],
    needs: ["The project scope, dates and number of people", "The skills and shifts required", "Where the work takes place"],
  },
  "lb-payroll": {
    includes: ["Salaries paid and payslips issued for the staff placed with you", "Leave and attendance administered", "Regular reports on hours and cost"],
    needs: ["Hours worked or attendance records for each pay period", "Your pay cut-off dates", "A contact for approvals"],
  },
  "lb-managed": {
    includes: ["A standing pool of staff for your ongoing needs", "All employment, payroll and administration handled by us", "Regular updates on who worked and when"],
    needs: ["Your usual staffing pattern and volumes", "Roles, shifts and locations", "A contact on your side for approvals"],
  },

  // Data science and BI
  "da-review": {
    includes: ["Your spreadsheet or dataset cleaned and checked", "Errors, duplicates and gaps listed", "A short data quality assessment"],
    needs: ["The file(s), uploaded securely", "What the data is used for", "Which columns matter most"],
  },
  "da-analysis": {
    includes: ["Analysis of your data, including trends, KPIs and statistical summaries", "A written management report", "Charts where they help"],
    needs: ["The data, uploaded securely", "The questions you want answered", "Who the report is for"],
  },
  "da-hr": {
    includes: ["HR analytics such as time-to-hire, cost-per-hire, turnover, absenteeism or skills gaps, as agreed", "A clear report with findings", "Personal data handled confidentially"],
    needs: ["HR data exports, uploaded securely", "The measures you want", "Definitions you use, such as what counts as turnover"],
  },
  "da-dashboard": {
    includes: ["A working prototype of your KPI dashboard", "Built around the measures you choose", "A walk-through of how to read it"],
    needs: ["The data source(s)", "The KPIs and who will use the dashboard", "Examples of reports you like"],
  },
  "da-automated": {
    includes: ["A workflow that processes your data and produces a report on a schedule", "Delivery through channels you authorise", "Setup and a test run"],
    needs: ["Where the data comes from and how often it changes", "The report format and who receives it", "Access to the systems involved, shared securely"],
  },
  "da-advanced": {
    includes: ["Advanced analytics such as forecasting, segmentation, anomaly detection or modelling, as scoped", "A prototype and a written explanation of the approach and its limits", "Scoped and quoted individually"],
    needs: ["A clear question or goal", "The data, uploaded securely", "How the result will be used"],
  },

  // Background screening
  "sc-basic": {
    includes: ["Selected identity, qualification and employment checks", "Coordinated with screening providers, depending on availability", "A report delivered securely to your dashboard"],
    needs: ["A lawful purpose for the check", "The candidate's consent, which we record before any check starts", "The candidate's details and documents"],
  },
  "sc-enhanced": {
    includes: ["Basic checks plus coordination of a criminal-record check and reference checks where appropriate", "Status updates as each check completes", "A report delivered securely"],
    needs: ["A lawful purpose for the check", "The candidate's consent, recorded before any check starts", "Referee details and the candidate's documents"],
  },
  "sc-financial": {
    includes: ["Coordination of a credit check, only where the legal conditions are met", "Status updates and a secure report", "A conversation with you first about whether it is allowed for the role"],
    needs: ["The role and why financial responsibility is relevant", "The candidate's consent, recorded before any check starts", "The candidate's details"],
  },
  "sc-programme": {
    includes: ["Bulk screening requests with consent administration", "A status dashboard and secure delivery of results", "Service levels agreed in your contract"],
    needs: ["Your expected volumes and the checks per role", "A process for collecting candidate consent", "A named contact on your side"],
  },
  "sc-individual": {
    includes: ["Individual checks, such as qualifications, employment history, identity, references, professional membership or directorships", "Status updates as each check completes", "A secure report"],
    needs: ["A lawful purpose for the check", "The person's consent, recorded before we start", "The details and documents for each check"],
  },

  // Automation
  "ai-basic": {
    includes: ["A simple automated task or notification", "Setup, testing and a hand-over", "A way to switch it off or hand over to a person"],
    needs: ["What should happen and when", "Access to the tools involved, shared securely", "An example of the result you expect"],
  },
  "ai-faq": {
    includes: ["A workflow that answers common questions and captures leads from WhatsApp or your website", "Follow-ups to the people who enquire", "A way to hand over to a person"],
    needs: ["Your common questions and answers", "The channels to connect and an approved WhatsApp number where needed", "Who should receive the leads"],
  },
  "ai-integration": {
    includes: ["Compatible systems connected, such as CRM, email and forms", "Data passed between them as you specify", "Testing and error handling"],
    needs: ["The systems to connect and what should move between them", "Access to those systems, shared securely", "A person who can confirm the result"],
  },
  "ai-sales": {
    includes: ["Booking, reminders, quotations or invoice notifications automated", "Messages sent from your accounts", "Testing and a hand-over"],
    needs: ["Your current process", "Message wording and timing", "Access to the booking or invoicing tool, shared securely"],
  },
  "ai-hr": {
    includes: ["Automated CV processing, candidate communication or onboarding steps", "Consent controls and an audit trail", "A person stays in control of every decision"],
    needs: ["Your current recruitment or onboarding process", "The messages candidates should receive", "Access to your systems, shared securely"],
  },
  "ai-managed": {
    includes: ["Monitoring and maintenance of your automations each month", "Fixes and improvements within the agreed scope", "A short monthly summary"],
    needs: ["A list of the workflows to be covered", "Access to the systems they run on", "A contact for approvals"],
  },

  // Career solutions
  "cs-cv": {
    includes: ["A professionally written or rewritten CV, ATS-friendly", "A matching cover letter", "Delivered for you to review"],
    needs: ["Your current CV or career details", "The kind of role you are going for", "Any job advert you are targeting"],
  },
  "cs-linkedin": {
    includes: ["A rewritten, search-ready LinkedIn profile", "Headline, summary and experience wording", "Ready for you to paste in"],
    needs: ["Your current LinkedIn profile or CV", "The roles or industry you want to be found for", "Achievements you want highlighted"],
  },
  "cs-exec-cv": {
    includes: ["A leadership-level CV and profile", "Focused on scope, impact and strategy", "One round of corrections"],
    needs: ["Your current CV", "Your biggest results and responsibilities", "The kind of senior role you want next"],
  },
  "cs-bio": {
    includes: ["A short and a long professional biography", "Suited to websites, speaking and boards", "One round of corrections"],
    needs: ["Your career history and key achievements", "Where the biography will be used", "Preferred tone and length"],
  },
  "cs-portfolio": {
    includes: ["Your work, qualifications and evidence organised into a portfolio", "A clear structure for sharing", "Delivered for your review"],
    needs: ["Examples of your work and certificates", "The purpose of the portfolio", "How you want to share it"],
  },
  "cs-website": {
    includes: ["A personal professional website with your summary, history, achievements, projects and downloadable CV", "Privacy controls so you decide what is public", "Quoted individually"],
    needs: ["Your CV and the content you want shown", "Photos or project material, if any", "Your privacy preferences"],
  },
  "cs-pro": {
    includes: ["Job matching against your Career Passport", "Tailored application kits and application tracking", "AI career tools, billed monthly, cancel any time"],
    needs: ["A free account", "A complete Career Passport and at least one resume", "Your search keywords"],
    steps: [
      "Create your free account and complete your Career Passport.",
      "Subscribe to Candidate Pro. Billing is monthly and you can cancel any time.",
      "Turn on Auto Apply with your keywords. We apply for you on jobs posted on Resume Hub, and prepare tailored kits for jobs on employers' own sites that you review and submit yourself.",
      "Track every application from your dashboard.",
    ],
  },
  "cs-interview": {
    includes: ["Job-specific interview questions", "Structured STAR feedback on your answers", "Choose a pack that suits you"],
    needs: ["The job you are preparing for", "Your resume", "Time to practise your answers"],
    steps: [
      "Create a free account and add your resume.",
      "Choose a prep pack and pay online.",
      "Practise job-specific questions and get structured STAR feedback.",
    ],
  },
  "cs-readiness": {
    includes: ["A career readiness report and skills-gap assessment", "Where you stand and what to build next", "Guidance only, not a guarantee of any outcome"],
    needs: ["Your CV and career goals", "Your skills and experience", "The roles you are aiming for"],
  },
  "cs-consult": {
    includes: ["A one-on-one session with a human career consultant", "Practical advice for your situation", "Time agreed with you after you enquire"],
    needs: ["Your CV and what you want to discuss", "Your preferred time", "Any questions in advance"],
  },
};

/** The steps every engagement follows, adjusted for how the service is bought. */
export function processSteps(models: PriceModel[]): string[] {
  const monthly = models.includes("monthly");
  const quoteOnly = models.length === 1 && models[0] === "quote";
  const steps = [
    "Send your request. We acknowledge it straight away.",
    quoteOnly
      ? "We review it and send a quotation for your approval. Nothing starts until you accept."
      : "We confirm the scope and send a quotation for your approval. Nothing starts until you accept.",
    "Upload your documents securely and we begin the work.",
    "Track progress, send messages and download your finished files from your dashboard.",
    "Review the delivery and approve it or ask for corrections.",
  ];
  if (monthly) steps.push("For monthly services, hours and activity are reported to you each month.");
  return steps;
}
