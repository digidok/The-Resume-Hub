import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "FAQ — Resume Hub",
};

const FAQ_GROUPS = [
  {
    heading: "Resume building & templates",
    items: [
      {
        q: "How does the resume builder work?",
        a: "You fill in your details once — contact info, summary, experience, education, skills, languages, and projects — and pick from 10 templates, including sidebar layouts with a photo slot common in Gulf, Middle Eastern, and Asian CVs. The preview updates live, and you can export to PDF or share a public link.",
      },
      {
        q: "Can I add a photo, nationality, or visa status to my CV?",
        a: "Yes. These fields are optional and switched on for templates that support them — useful if you're applying in markets like the UAE, the wider Middle East, or Asia, where a photo and personal details are often expected on a CV. If you're applying mainly in South Africa, you can leave them blank.",
      },
      {
        q: "Can I translate my resume into another language?",
        a: "Yes — the resume translator uses AI to produce a translated copy of your resume content (for example into Arabic, French, Portuguese, or Swahili) so you can apply for roles across Africa, the Middle East, and Asia without rewriting everything by hand.",
      },
    ],
  },
  {
    heading: "AI features & ATS scoring",
    items: [
      {
        q: "What does the AI resume review actually check?",
        a: "It sends your resume content (and, if you provide one, the target job description) to Claude, which scores it out of 100 and returns specific feedback: whether your bullet points show quantified impact, whether your listed skills overlap with the keywords in the job description, and formatting issues that can trip up applicant tracking systems (ATS) — like missing dates or unclear job titles.",
      },
      {
        q: "What is an ATS, and why does it matter?",
        a: "An Applicant Tracking System is the software many employers use to filter and rank applications before a human ever reads them — it typically checks for keyword overlap with the job description and expects a clean, parseable structure. Our AI review is built to flag exactly the things a real ATS looks for, not just give generic writing tips.",
      },
      {
        q: "How does 'Fill gaps with AI' work?",
        a: "It only writes content for fields you've left empty — your summary, your skills list, or a role's description — based on the rest of your resume. It never overwrites anything you've already written.",
      },
      {
        q: "How does 'Suggest duties' work?",
        a: "For any experience entry, you can ask AI to suggest 6 role-typical bullet points based on the job title and company. You pick the ones that actually apply to you and insert them — nothing is added automatically.",
      },
      {
        q: "Does AI ever apply for jobs without checking with me first?",
        a: "Only if you turn on scheduled auto-apply and set your keywords. It then applies daily to new matching open jobs using the resume you chose, and emails you every time it does. You can turn it off at any time.",
      },
    ],
  },
  {
    heading: "Jobs & applications",
    items: [
      {
        q: "How do you keep job listings free of scams and junk?",
        a: "Every job listing on our board is verified before it goes live — we check that the employer and role are real. We don't run ads or accept sponsored filler listings, so what you see is what's actually hiring.",
      },
      {
        q: "Can I tailor my CV to a specific job posting?",
        a: "Yes — paste in a job description (or the job's URL) and Resume Hub's AI will suggest specific tweaks to your resume content so it aligns with what that employer is asking for, rather than sending the same generic CV everywhere.",
      },
      {
        q: "How do I track my applications?",
        a: "Every application you submit — whether manually or via auto-apply — shows up on your Applications page with its current status (submitted, interviewing, offer, hired) so you always know where things stand.",
      },
    ],
  },
  {
    heading: "Pricing & account",
    items: [
      {
        q: "Is Resume Hub free?",
        a: "Creating an account, building a resume, and applying to jobs is free. AI features (review, mock interview, auto-apply, salary insights, translation) use credits — free accounts get a starting balance, and you can top up or subscribe to Pro for more.",
      },
      {
        q: "Do you offer a student discount?",
        a: (
          <>
            Yes — students and recent graduates get 50% off Candidate Pro. See{" "}
            <Link href="/student-discount" className="font-medium text-brand-700 hover:underline">
              Student discount
            </Link>{" "}
            for how to redeem it.
          </>
        ),
      },
      {
        q: "Is my data safe?",
        a: (
          <>
            Yes. Your data is protected with encrypted connections and row-level access controls, and
            we process personal information in line with South Africa&apos;s POPIA. See our{" "}
            <Link href="/privacy" className="font-medium text-brand-700 hover:underline">
              Privacy Policy
            </Link>{" "}
            for the full details, including your rights and how to contact us about your data.
          </>
        ),
      },
      {
        q: "Can I talk to a real person?",
        a: "Yes — our team has been writing CVs professionally for 5+ years. Message us on WhatsApp (069 339 1915) for a free CV review or help building your resume, or email info@resumehub.co.za.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h1>
          <p className="mt-2 text-slate-600">
            How Resume Hub&apos;s features, AI, and ATS checks actually work.
          </p>

          <div className="mt-10 space-y-10">
            {FAQ_GROUPS.map((group) => (
              <div key={group.heading}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                  {group.heading}
                </h2>
                <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {group.items.map((item) => (
                    <details key={item.q} className="group p-4">
                      <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 marker:content-none">
                        <span className="flex items-center justify-between gap-4">
                          {item.q}
                          <span className="shrink-0 text-slate-400 group-open:rotate-45 transition-transform">
                            +
                          </span>
                        </span>
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
