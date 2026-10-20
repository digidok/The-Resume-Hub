import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { FileUpload } from "@/components/business/file-upload";
import { requireAdminPage } from "@/lib/business/guard";
import { signPaths } from "@/lib/business/queries";
import { addScreeningReport, createScreeningCase, recordConsent, saveDisputeNote, setCheckStatus } from "@/lib/business/actions";
import {
  CHECK_STATUS_LABEL,
  CHECK_STATUS_STYLE,
  formatDate,
  type ScreeningCaseRow,
  type ScreeningCheckRow,
} from "@/lib/business/format";

export const metadata = { title: "Screening — The Resume Document Hub" };

const CHECK_TYPES = [
  "Identity",
  "Qualifications",
  "Employment history",
  "Criminal record",
  "References",
  "Professional membership",
  "Directorships",
  "Credit (eligible roles only)",
];
const STATUSES: ScreeningCheckRow["status"][] = ["requested", "in_progress", "completed", "discrepancy"];
const inputCls = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function ScreeningPage() {
  const { supabase } = await requireAdminPage();
  const { data: caseData } = await supabase.from("screening_cases").select("*").order("created_at", { ascending: false }).limit(100);
  const cases = (caseData ?? []) as ScreeningCaseRow[];
  const { data: checkData } = cases.length
    ? await supabase.from("screening_checks").select("*").in("case_id", cases.map((c) => c.id))
    : { data: [] };
  const checks = (checkData ?? []) as ScreeningCheckRow[];
  const reportUrls = await signPaths(supabase, "screening-reports", cases.map((c) => c.report_path).filter((p): p is string => Boolean(p)));

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Screening cases. Record the lawful purpose and the candidate&apos;s consent before any check starts. Reports are
        private to the client who ordered them.
      </p>
      <BusinessAdminNav />

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New screening case</h2>
        <form action={createScreeningCase} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="client_name" required placeholder="Client company" className={inputCls} />
          <input name="client_email" type="email" required placeholder="Client email (they sign in with this)" className={inputCls} />
          <input name="candidate_name" required placeholder="Candidate name" className={inputCls} />
          <input name="role_title" placeholder="Role (optional)" className={inputCls} />
          <textarea name="lawful_purpose" required rows={2} maxLength={1000} placeholder="Lawful purpose for these checks" className={`${inputCls} sm:col-span-2`} />
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Only the checks this role needs</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {CHECK_TYPES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="checks" value={c} />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Button type="submit">Create case</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {cases.length === 0 && <Card className="p-6 text-sm text-slate-500">No screening cases yet.</Card>}
        {cases.map((c) => {
          const mine = checks.filter((k) => k.case_id === c.id);
          const consentOk = c.consent_status === "received";
          return (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {c.candidate_name}
                    <span className="font-normal text-slate-500">
                      {c.role_title ? ` · ${c.role_title}` : ""} · for {c.client_name}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.reference} · {c.client_email} · {formatDate(c.created_at)} · case {c.status.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Purpose: {c.lawful_purpose}</p>
                </div>
              </div>

              <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">
                  Candidate consent:{" "}
                  <span className={consentOk ? "text-emerald-700" : c.consent_status === "declined" ? "text-red-700" : "text-amber-700"}>
                    {c.consent_status}
                  </span>
                  {c.consent_received_at ? ` on ${formatDate(c.consent_received_at)} (${c.consent_method})` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <form
                    className="flex gap-2"
                    action={async (form: FormData) => {
                      "use server";
                      await recordConsent(c.id, "received", form);
                    }}
                  >
                    <input name="method" placeholder="How consent was given (e.g. signed form, email)" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                    <Button type="submit" size="sm" variant="outline">
                      Record consent
                    </Button>
                  </form>
                  <form
                    action={async (form: FormData) => {
                      "use server";
                      await recordConsent(c.id, "declined", form);
                    }}
                  >
                    <Button type="submit" size="sm" variant="ghost">
                      Candidate declined
                    </Button>
                  </form>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {mine.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="flex items-center gap-2 text-slate-800">
                      {k.check_type}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CHECK_STATUS_STYLE[k.status]}`}>{CHECK_STATUS_LABEL[k.status]}</span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {STATUSES.filter((s) => s !== k.status).map((s) => (
                        <form
                          key={s}
                          action={async () => {
                            "use server";
                            await setCheckStatus(k.id, c.id, s);
                          }}
                        >
                          <Button type="submit" size="sm" variant="outline" disabled={!consentOk && s !== "requested"}>
                            {CHECK_STATUS_LABEL[s]}
                          </Button>
                        </form>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
              {!consentOk && <p className="mt-2 text-xs text-amber-700">Checks cannot start until consent is recorded.</p>}

              <form
                className="mt-3 flex gap-2"
                action={async (form: FormData) => {
                  "use server";
                  await saveDisputeNote(c.id, form);
                }}
              >
                <input
                  name="dispute_note"
                  defaultValue={c.dispute_note ?? ""}
                  maxLength={2000}
                  placeholder="Discrepancy or dispute note shown to the client (leave empty to clear)"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
                <Button type="submit" size="sm" variant="outline">
                  Save note
                </Button>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <FileUpload
                  bucket="screening-reports"
                  folder={c.reference}
                  label={c.report_path ? "Replace report" : "Upload report"}
                  maxMb={20}
                  register={addScreeningReport.bind(null, c.id)}
                />
                {c.report_path && reportUrls.get(c.report_path) && (
                  <a href={reportUrls.get(c.report_path)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                    Open current report
                  </a>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
